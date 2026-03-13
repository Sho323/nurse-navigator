import { Database } from "@/types/supabase";

type PatientMaster = Pick<Database["public"]["Tables"]["patients"]["Row"], "name" | "kana_name">;

type SalesStatus = Database["public"]["Enums"]["sales_status"];

type ReconciliationResult = {
    patient_name: string;
    billed_amount: number;
    received_amount: number | null;
    status: SalesStatus;
    ai_comment: string;
};

type CsvParseResult = {
    headers: string[];
    rows: string[][];
};

type ParsedReceipt = {
    patientName: string;
    billedAmount: number | null;
};

type ParsedBank = {
    index: number;
    payerName: string;
    amount: number | null;
    used: boolean;
    normalizedName: string;
    compactName: string;
    normalizedKana: string;
};

const RECEIPT_NAME_HEADERS = [/患者/, /氏名/, /名前/, /name/i];
const RECEIPT_AMOUNT_HEADERS = [/請求額/, /請求金額/, /金額/, /amount/i];
const BANK_NAME_HEADERS = [/振込人/, /名義/, /氏名/, /名前/, /name/i];
const BANK_AMOUNT_HEADERS = [/入金額/, /受領額/, /金額/, /amount/i];

function parseCsvLine(line: string) {
    const cells: string[] = [];
    let current = "";
    let inQuotes = false;

    for (let index = 0; index < line.length; index += 1) {
        const char = line[index];
        const next = line[index + 1];

        if (char === '"') {
            if (inQuotes && next === '"') {
                current += '"';
                index += 1;
            } else {
                inQuotes = !inQuotes;
            }
            continue;
        }

        if (char === "," && !inQuotes) {
            cells.push(current);
            current = "";
            continue;
        }

        current += char;
    }

    cells.push(current);
    return cells;
}

function parseCsv(csv: string): CsvParseResult {
    const lines = csv
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean);

    if (lines.length === 0) {
        return { headers: [], rows: [] };
    }

    const headers = parseCsvLine(lines[0]);
    const rows = lines.slice(1).map((line) => parseCsvLine(line));
    return { headers, rows };
}

function findColumnIndex(headers: string[], patterns: RegExp[]) {
    return headers.findIndex((header) => {
        const normalized = header.normalize("NFKC").trim();
        return patterns.some((pattern) => pattern.test(normalized));
    });
}

function normalizeSpace(value: string) {
    return value.normalize("NFKC").replace(/[\s\u3000]+/g, " ").trim();
}

function compactName(value: string) {
    return normalizeSpace(value)
        .replace(/[()（）［］【】「」『』\[\]<>]/g, "")
        .replace(/様|サマ|さん|氏|殿/gi, "")
        .replace(/[\s\u3000・･\-ー_]/g, "")
        .toUpperCase();
}

function normalizeKana(value: string) {
    return compactName(value)
        .replace(/[A-Z0-9]/g, "");
}

function parseAmount(value: string | undefined) {
    if (!value) return null;
    const numeric = value
        .normalize("NFKC")
        .replace(/[^\d.-]/g, "");
    if (!numeric) return null;
    const parsed = Number(numeric);
    return Number.isFinite(parsed) ? parsed : null;
}

function pickBestByAmount(candidates: ParsedBank[], billedAmount: number | null) {
    if (candidates.length === 0) return null;
    if (billedAmount == null) return candidates[0];

    let best = candidates[0];
    let bestDiff = Math.abs((best.amount ?? billedAmount) - billedAmount);

    for (const candidate of candidates.slice(1)) {
        const diff = Math.abs((candidate.amount ?? billedAmount) - billedAmount);
        if (diff < bestDiff) {
            best = candidate;
            bestDiff = diff;
        }
    }

    return best;
}

function isNearMatch(left: string, right: string) {
    if (!left || !right) return false;
    if (left === right) return true;
    if (left.includes(right) || right.includes(left)) {
        return Math.min(left.length, right.length) >= 3;
    }
    return left.slice(0, 3) === right.slice(0, 3);
}

function buildPatientKanaLookup(patientMaster: PatientMaster[]) {
    const map = new Map<string, string>();
    for (const patient of patientMaster) {
        if (!patient.name || !patient.kana_name) continue;
        map.set(compactName(patient.name), normalizeKana(patient.kana_name));
    }
    return map;
}

function determineStatusAndComment({
    patientName,
    billedAmount,
    bankEntry,
    reason,
}: {
    patientName: string;
    billedAmount: number | null;
    bankEntry: ParsedBank | null;
    reason: string;
}) {
    if (!bankEntry) {
        return {
            receivedAmount: null,
            status: "error" as SalesStatus,
            comment: "候補となる入金データが見つからないため、手動確認が必要です。",
        };
    }

    const receivedAmount = bankEntry.amount;
    if (receivedAmount == null || billedAmount == null) {
        return {
            receivedAmount,
            status: "error" as SalesStatus,
            comment: "請求額または入金額の数値を解釈できなかったため、手動確認が必要です。",
        };
    }

    const diff = billedAmount - receivedAmount;
    const absDiff = Math.abs(diff);

    if (absDiff === 0 && (reason === "exact_name" || reason === "kana_exact")) {
        return {
            receivedAmount,
            status: "matched" as SalesStatus,
            comment: `名義一致で入金額も一致しました（判定: ${reason === "exact_name" ? "氏名完全一致" : "カナ一致"}）。`,
        };
    }

    if (absDiff === 0) {
        return {
            receivedAmount,
            status: "inferred" as SalesStatus,
            comment: `入金額は一致していますが、名義は推定一致です（判定: ${reason}）。`,
        };
    }

    if (absDiff <= 500) {
        return {
            receivedAmount,
            status: "inferred" as SalesStatus,
            comment: `名義は一致候補ですが、${absDiff.toLocaleString()}円の差額があります。要確認です。`,
        };
    }

    return {
        receivedAmount,
        status: "error" as SalesStatus,
        comment: `${patientName} の候補入金は見つかりましたが、請求額との差額が${absDiff.toLocaleString()}円あるため手動確認が必要です。`,
    };
}

export function reconcileCsv({
    receiptCsv,
    bankCsv,
    patientMaster,
}: {
    receiptCsv: string;
    bankCsv: string;
    patientMaster: PatientMaster[];
}) {
    const receipt = parseCsv(receiptCsv);
    const bank = parseCsv(bankCsv);

    if (receipt.headers.length === 0 || bank.headers.length === 0) {
        throw new Error("CSVヘッダーが読み取れませんでした");
    }

    const receiptNameIdx = findColumnIndex(receipt.headers, RECEIPT_NAME_HEADERS);
    const receiptAmountIdx = findColumnIndex(receipt.headers, RECEIPT_AMOUNT_HEADERS);
    const bankNameIdx = findColumnIndex(bank.headers, BANK_NAME_HEADERS);
    const bankAmountIdx = findColumnIndex(bank.headers, BANK_AMOUNT_HEADERS);

    if (receiptNameIdx === -1 || receiptAmountIdx === -1) {
        throw new Error("請求CSVに患者名または請求額カラムが見つかりません");
    }
    if (bankNameIdx === -1 || bankAmountIdx === -1) {
        throw new Error("銀行CSVに名義または入金額カラムが見つかりません");
    }

    const patientKanaLookup = buildPatientKanaLookup(patientMaster);

    const receiptRows: ParsedReceipt[] = receipt.rows.map((row) => ({
        patientName: normalizeSpace(row[receiptNameIdx] ?? ""),
        billedAmount: parseAmount(row[receiptAmountIdx]),
    }));

    const bankRows: ParsedBank[] = bank.rows.map((row, index) => {
        const payerName = normalizeSpace(row[bankNameIdx] ?? "");
        return {
            index,
            payerName,
            amount: parseAmount(row[bankAmountIdx]),
            used: false,
            normalizedName: normalizeSpace(payerName),
            compactName: compactName(payerName),
            normalizedKana: normalizeKana(payerName),
        };
    });

    const results: ReconciliationResult[] = [];

    for (const receiptRow of receiptRows) {
        if (!receiptRow.patientName) {
            continue;
        }

        const patientCompact = compactName(receiptRow.patientName);
        const patientKana = patientKanaLookup.get(patientCompact) ?? "";
        const unmatched = bankRows.filter((entry) => !entry.used);

        const exactCandidates = unmatched.filter(
            (entry) =>
                entry.normalizedName === receiptRow.patientName ||
                entry.compactName === patientCompact
        );
        let selected = pickBestByAmount(exactCandidates, receiptRow.billedAmount);
        let reason = "exact_name";

        if (!selected && patientKana) {
            const kanaCandidates = unmatched.filter((entry) => entry.normalizedKana === patientKana);
            selected = pickBestByAmount(kanaCandidates, receiptRow.billedAmount);
            reason = "kana_exact";
        }

        if (!selected) {
            const nearCandidates = unmatched.filter(
                (entry) =>
                    isNearMatch(entry.compactName, patientCompact) ||
                    (patientKana && isNearMatch(entry.normalizedKana, patientKana))
            );
            selected = pickBestByAmount(nearCandidates, receiptRow.billedAmount);
            reason = "near_match";
        }

        if (!selected && receiptRow.billedAmount != null) {
            const amountOnlyCandidates = unmatched.filter(
                (entry) => entry.amount === receiptRow.billedAmount
            );
            if (amountOnlyCandidates.length === 1) {
                selected = amountOnlyCandidates[0];
                reason = "amount_only";
            }
        }

        const decision = determineStatusAndComment({
            patientName: receiptRow.patientName,
            billedAmount: receiptRow.billedAmount,
            bankEntry: selected,
            reason,
        });

        if (selected) {
            selected.used = true;
        }

        results.push({
            patient_name: receiptRow.patientName,
            billed_amount: receiptRow.billedAmount ?? 0,
            received_amount: decision.receivedAmount,
            status: decision.status,
            ai_comment: decision.comment,
        });
    }

    return results;
}
