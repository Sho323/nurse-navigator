import {
    collectPatientIdentifiers,
    createCsvMaskState,
    inspectVisitRecordForAi,
    maskCsvNameColumns,
    unmaskCsvAlias,
} from "./ai-privacy";

describe("ai-privacy", () => {
    it("masks name-like CSV columns with stable aliases", () => {
        const state = createCsvMaskState();

        const receipt = maskCsvNameColumns(
            ["患者名,請求額", "佐藤 健一,15000", "鈴木 花子,24500"].join("\n"),
            state
        );
        const bank = maskCsvNameColumns(
            ["振込人名義,入金額", "佐藤 健一,15000", "スズキ タロウ,24500"].join("\n"),
            state
        );

        expect(receipt.csv).toContain("[患者A]");
        expect(receipt.csv).toContain("[患者B]");
        expect(bank.csv).toContain("[患者A]");
        expect(bank.csv).toContain("[患者C]");
        expect(unmaskCsvAlias("[患者B]", state)).toBe("鈴木 花子");
    });

    it("sanitizes patient names and direct identifiers in visit text", () => {
        const result = inspectVisitRecordForAi(
            "佐藤 健一様へ連絡。電話は090-1234-5678、生年月日は2026年3月1日、住所は〒150-0001です。",
            ["佐藤 健一"]
        );

        expect(result.requiresReview).toBe(true);
        expect(result.matchedSignals).toEqual(
            expect.arrayContaining(["patient_name", "phone_number", "postal_code", "date"])
        );
        expect(result.sanitizedText).toContain("[患者名]");
        expect(result.sanitizedText).toContain("[電話番号]");
        expect(result.sanitizedText).toContain("[郵便番号]");
        expect(result.sanitizedText).toContain("[日付]");
    });

    it("builds identifiers from patient master and masks names across tenants records", () => {
        const identifiers = collectPatientIdentifiers([
            { name: "佐藤  健一", kana_name: "サトウ ケンイチ" },
            { name: "鈴木 花子", kana_name: "スズキ　ハナコ" },
            { name: "佐藤 健一", kana_name: null },
        ]);

        expect(identifiers).toEqual(
            expect.arrayContaining(["佐藤 健一", "サトウ ケンイチ", "鈴木 花子", "スズキ ハナコ"])
        );
        expect(identifiers.filter((value) => value === "佐藤 健一")).toHaveLength(1);

        const result = inspectVisitRecordForAi(
            "本日は鈴木 花子さん宅を訪問。連絡先は03-1234-5678。",
            identifiers
        );

        expect(result.requiresReview).toBe(true);
        expect(result.matchedSignals).toEqual(expect.arrayContaining(["patient_name", "phone_number"]));
        expect(result.sanitizedText).toContain("[患者名]");
        expect(result.sanitizedText).toContain("[電話番号]");
    });
});
