import { reconcileCsv } from "./reconciliation";

describe("reconcileCsv", () => {
    const patientMaster = [
        { name: "佐藤 健一", kana_name: "サトウ ケンイチ" },
        { name: "鈴木 花子", kana_name: "スズキ ハナコ" },
        { name: "田中 一郎", kana_name: "タナカ イチロウ" },
    ];

    it("matches exact and kana-based rows without AI", () => {
        const receiptCsv = ["患者名,請求額", "佐藤 健一,15000", "鈴木 花子,24500"].join("\n");
        const bankCsv = ["振込人名義,入金額", "佐藤 健一,15000", "スズキ ハナコ,24500"].join("\n");

        const result = reconcileCsv({ receiptCsv, bankCsv, patientMaster });
        expect(result).toHaveLength(2);
        expect(result[0].status).toBe("matched");
        expect(result[1].status).toBe("matched");
    });

    it("falls back to amount-only inference when name does not match", () => {
        const receiptCsv = ["患者名,請求額", "田中 一郎,18200"].join("\n");
        const bankCsv = ["振込人名義,入金額", "ヤマダ タロウ,18200"].join("\n");

        const result = reconcileCsv({ receiptCsv, bankCsv, patientMaster });
        expect(result[0].status).toBe("inferred");
        expect(result[0].received_amount).toBe(18200);
    });

    it("returns error when no candidate can be matched", () => {
        const receiptCsv = ["患者名,請求額", "田中 一郎,18200"].join("\n");
        const bankCsv = ["振込人名義,入金額", "ヤマダ タロウ,15000"].join("\n");

        const result = reconcileCsv({ receiptCsv, bankCsv, patientMaster });
        expect(result[0].status).toBe("error");
        expect(result[0].received_amount).toBeNull();
    });
});
