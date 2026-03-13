type CsvMaskState = {
    aliasByOriginal: Map<string, string>;
    originalByAlias: Map<string, string>;
    nextIndex: number;
};

type CsvMaskResult = {
    csv: string;
    maskedHeaders: string[];
    maskedCellCount: number;
    state: CsvMaskState;
};

type VisitRecordScanResult = {
    matchedSignals: string[];
    sanitizedText: string;
    requiresReview: boolean;
};

type PatientMasterRecord = {
    name?: string | null;
    kana_name?: string | null;
};

const NAME_HEADER_PATTERN = /(患者|氏名|名前|name|名義)/i;
const PHONE_PATTERN = /(?:\+81[-\s]?)?(?:0\d{1,4}[-\s]?\d{1,4}[-\s]?\d{3,4})/g;
const POSTAL_CODE_PATTERN = /〒?\d{3}-?\d{4}/g;
const DATE_PATTERN = /(?:19|20)\d{2}[/.年-](?:0?[1-9]|1[0-2])[/.月-](?:0?[1-9]|[12]\d|3[01])(?:日)?/g;

function escapeRegExp(value: string) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function toAliasLabel(index: number) {
    let current = index;
    let label = "";

    do {
        label = String.fromCharCode(65 + (current % 26)) + label;
        current = Math.floor(current / 26) - 1;
    } while (current >= 0);

    return label;
}

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

function serializeCsvLine(cells: string[]) {
    return cells
        .map((cell) => {
            if (/[",\n\r]/.test(cell)) {
                return `"${cell.replace(/"/g, '""')}"`;
            }
            return cell;
        })
        .join(",");
}

function normalizeName(value: string) {
    return value.trim().replace(/[\s\u3000]+/g, " ");
}

function buildFlexibleNamePattern(name: string) {
    const tokens = normalizeName(name)
        .split(/[\s\u3000]+/)
        .filter(Boolean)
        .map(escapeRegExp);

    if (tokens.length === 0) {
        return null;
    }

    return new RegExp(tokens.join("[\\s\\u3000]*"), "g");
}

function replaceIfMatched(text: string, pattern: RegExp, replacement: string) {
    pattern.lastIndex = 0;
    if (!pattern.test(text)) {
        pattern.lastIndex = 0;
        return { text, matched: false };
    }

    pattern.lastIndex = 0;
    return {
        text: text.replace(pattern, replacement),
        matched: true,
    };
}

function getOrCreateAlias(originalValue: string, state: CsvMaskState) {
    const normalized = normalizeName(originalValue);
    const existingAlias = state.aliasByOriginal.get(normalized);

    if (existingAlias) {
        return existingAlias;
    }

    const alias = `[患者${toAliasLabel(state.nextIndex)}]`;
    state.aliasByOriginal.set(normalized, alias);
    state.originalByAlias.set(alias, normalized);
    state.nextIndex += 1;
    return alias;
}

export function createCsvMaskState(): CsvMaskState {
    return {
        aliasByOriginal: new Map(),
        originalByAlias: new Map(),
        nextIndex: 0,
    };
}

export function maskCsvNameColumns(csv: string, state = createCsvMaskState()): CsvMaskResult {
    if (!csv.trim()) {
        return {
            csv,
            maskedHeaders: [],
            maskedCellCount: 0,
            state,
        };
    }

    const lines = csv.split(/\r?\n/);
    const headers = parseCsvLine(lines[0] ?? "");
    const nameColumnIndexes = headers.reduce<number[]>((indexes, header, index) => {
        if (NAME_HEADER_PATTERN.test(header.trim())) {
            indexes.push(index);
        }
        return indexes;
    }, []);

    if (nameColumnIndexes.length === 0) {
        return {
            csv,
            maskedHeaders: [],
            maskedCellCount: 0,
            state,
        };
    }

    let maskedCellCount = 0;
    const maskedLines = lines.map((line, lineIndex) => {
        if (lineIndex === 0 || !line.trim()) {
            return line;
        }

        const cells = parseCsvLine(line);
        let didMaskRow = false;

        for (const columnIndex of nameColumnIndexes) {
            const rawValue = cells[columnIndex];
            if (!rawValue) {
                continue;
            }

            const normalized = normalizeName(rawValue);
            if (!normalized) {
                continue;
            }

            cells[columnIndex] = getOrCreateAlias(normalized, state);
            maskedCellCount += 1;
            didMaskRow = true;
        }

        return didMaskRow ? serializeCsvLine(cells) : line;
    });

    return {
        csv: maskedLines.join("\n"),
        maskedHeaders: nameColumnIndexes.map((index) => headers[index]).filter(Boolean),
        maskedCellCount,
        state,
    };
}

export function unmaskCsvAlias(value: string | null | undefined, state: CsvMaskState) {
    if (!value) {
        return value ?? "";
    }

    return state.originalByAlias.get(value.trim()) ?? value;
}

export function collectPatientIdentifiers(records: PatientMasterRecord[]) {
    const identifiers = new Set<string>();

    for (const record of records) {
        for (const candidate of [record.name, record.kana_name]) {
            if (!candidate) {
                continue;
            }

            const normalized = normalizeName(candidate);
            if (normalized) {
                identifiers.add(normalized);
            }
        }
    }

    return Array.from(identifiers);
}

export function inspectVisitRecordForAi(text: string, patientIdentifiers: string[]) {
    const matchedSignals = new Set<string>();
    let sanitizedText = text;

    for (const identifier of patientIdentifiers.map(normalizeName).filter(Boolean)) {
        const pattern = buildFlexibleNamePattern(identifier);
        if (!pattern) {
            continue;
        }

        const result = replaceIfMatched(sanitizedText, pattern, "[患者名]");
        sanitizedText = result.text;
        if (result.matched) {
            matchedSignals.add("patient_name");
        }
    }

    const phoneResult = replaceIfMatched(sanitizedText, PHONE_PATTERN, "[電話番号]");
    sanitizedText = phoneResult.text;
    if (phoneResult.matched) {
        matchedSignals.add("phone_number");
    }

    const postalCodeResult = replaceIfMatched(sanitizedText, POSTAL_CODE_PATTERN, "[郵便番号]");
    sanitizedText = postalCodeResult.text;
    if (postalCodeResult.matched) {
        matchedSignals.add("postal_code");
    }

    const dateResult = replaceIfMatched(sanitizedText, DATE_PATTERN, "[日付]");
    sanitizedText = dateResult.text;
    if (dateResult.matched) {
        matchedSignals.add("date");
    }

    return {
        matchedSignals: Array.from(matchedSignals),
        sanitizedText,
        requiresReview: matchedSignals.size > 0,
    } satisfies VisitRecordScanResult;
}
