"use client";

import { useState } from "react";
import { ArrowLeft, User, Stethoscope, Link as LinkIcon, AlertTriangle, PhoneCall, Calendar as CalIcon, Edit3, CheckCircle, Loader2 } from "lucide-react";
import { Database } from "@/types/supabase";
import { recordAiConsent, updatePatientProfile } from "../../actions";
import { useRouter } from "next/navigation";
import { ConsentedByKind } from "@/utils/consent";

type Patient = Database['public']['Tables']['patients']['Row'];
type Consent = Database["public"]["Tables"]["consents"]["Row"];
type ConsentEvent = Database["public"]["Tables"]["consent_events"]["Row"];

interface Props {
    patient: Patient;
    aiConsent: Consent | null;
    consentEvents: ConsentEvent[];
}

export default function PatientProfileClient({ patient, aiConsent, consentEvents }: Props) {
    const router = useRouter();
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isUpdatingConsent, setIsUpdatingConsent] = useState(false);
    const [consentActor, setConsentActor] = useState<ConsentedByKind>("patient");
    const [consentNotes, setConsentNotes] = useState("");
    
    // Form State
    const [formData, setFormData] = useState({
        name: patient.name || "",
        kana_name: patient.kana_name || "",
        insurance_type: patient.insurance_type || "",
        care_level: patient.care_level || "",
        diagnosis: patient.diagnosis || "",
        current_illness: patient.current_illness || "",
        medical_history: patient.medical_history || "",
        primary_physician: patient.primary_physician || "",
        family_structure: patient.family_structure || "",
        key_person_contact: patient.key_person_contact || "",
        emergency_response: patient.emergency_response || "",
        precautions: patient.precautions || "",
        monthly_schedule: patient.monthly_schedule || "",
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSave = async () => {
        setIsSaving(true);
        const data = new FormData();
        Object.entries(formData).forEach(([key, value]) => {
            data.append(key, value);
        });

        const res = await updatePatientProfile(patient.id, data);
        if (res.error) {
            alert(res.error);
        } else {
            setIsEditing(false);
            router.refresh();
        }
        setIsSaving(false);
    };

    const consentLabel =
        aiConsent?.status === "granted"
            ? "同意取得済み"
            : aiConsent?.status === "revoked"
              ? "撤回済み"
              : "未取得";

    const consentClassName =
        aiConsent?.status === "granted"
            ? "bg-green-100 text-green-700"
            : aiConsent?.status === "revoked"
              ? "bg-red-100 text-red-700"
              : "bg-gray-100 text-gray-600";

    const handleConsentUpdate = async (status: "granted" | "revoked") => {
        setIsUpdatingConsent(true);
        const result = await recordAiConsent({
            patientId: patient.id,
            status,
            consentedByKind: consentActor,
            notes: consentNotes || undefined,
        });

        if (result?.error) {
            alert(result.error);
        } else {
            setConsentNotes("");
            router.refresh();
        }
        setIsUpdatingConsent(false);
    };

    return (
        <div className="bg-[#FFFAF0] min-h-screen font-sans pb-24 flex flex-col items-center">
            {/* Header */}
            <header className="w-full max-w-2xl bg-white px-6 py-6 rounded-b-[40px] shadow-sm flex items-center justify-between sticky top-0 z-10">
                <button onClick={() => router.back()} className="text-gray-400 hover:text-orange-500 transition-colors">
                    <ArrowLeft size={24} />
                </button>
                <h1 className="text-xl font-extrabold text-gray-800 tracking-tight">利用者プロフィール</h1>
                {!isEditing ? (
                    <button onClick={() => setIsEditing(true)} className="w-10 h-10 bg-orange-50 flex items-center justify-center rounded-xl text-orange-500 hover:bg-orange-100 transition-colors">
                        <Edit3 size={18} />
                    </button>
                ) : (
                    <div className="w-10"></div>
                )}
            </header>

            <main className="w-full max-w-2xl px-6 mt-8 space-y-6">
                <section className="bg-white p-6 rounded-3xl shadow-sm border border-orange-100">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-sm font-bold text-gray-500">加算チェック利用同意（CONS-000）</h2>
                        <span className={`text-xs font-bold px-3 py-1 rounded-full ${consentClassName}`}>
                            {consentLabel}
                        </span>
                    </div>

                    <p className="text-xs text-gray-500 mb-4">
                        加算チェックの実行には本同意が必要です。撤回すると次回以降のチェック処理は停止されます。
                    </p>

                    <div className="grid grid-cols-2 gap-3 mb-3">
                        <select
                            value={consentActor}
                            onChange={(event) => setConsentActor(event.target.value as ConsentedByKind)}
                            className="border border-gray-200 rounded-xl p-3 text-sm font-medium bg-gray-50"
                            disabled={isUpdatingConsent}
                        >
                            <option value="patient">本人同意</option>
                            <option value="representative">代理人同意</option>
                            <option value="staff">スタッフ記録</option>
                        </select>
                        <input
                            value={consentNotes}
                            onChange={(event) => setConsentNotes(event.target.value)}
                            placeholder="補足メモ（任意）"
                            className="border border-gray-200 rounded-xl p-3 text-sm font-medium bg-gray-50"
                            disabled={isUpdatingConsent}
                        />
                    </div>

                    <div className="flex gap-3 mb-4">
                        <button
                            onClick={() => handleConsentUpdate("granted")}
                            disabled={isUpdatingConsent}
                            className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-green-300 text-white font-bold py-3 rounded-xl transition-colors"
                        >
                            同意を記録
                        </button>
                        <button
                            onClick={() => handleConsentUpdate("revoked")}
                            disabled={isUpdatingConsent}
                            className="flex-1 bg-red-500 hover:bg-red-600 disabled:bg-red-300 text-white font-bold py-3 rounded-xl transition-colors"
                        >
                            撤回を記録
                        </button>
                    </div>

                    <div className="border-t border-gray-100 pt-4">
                        <p className="text-xs font-bold text-gray-400 mb-2">直近履歴（最大5件）</p>
                        {consentEvents.length === 0 ? (
                            <p className="text-sm text-gray-400">履歴はまだありません。</p>
                        ) : (
                            <div className="space-y-2">
                                {consentEvents.map((event) => (
                                    <div key={event.id} className="bg-gray-50 rounded-xl p-3 text-sm">
                                        <p className="font-bold text-gray-700">
                                            {event.action === "grant" ? "同意取得" : event.action === "revoke" ? "同意撤回" : "同意更新"}
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            {new Date(event.created_at).toLocaleString("ja-JP")} / {event.consented_by_kind || "未設定"}
                                        </p>
                                        {event.notes && <p className="text-xs text-gray-600 mt-1">{event.notes}</p>}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </section>

                {/* Basic Info Group */}
                <section className="bg-white p-6 rounded-3xl shadow-sm border border-orange-50">
                    <h2 className="text-sm font-bold text-gray-400 flex items-center gap-2 mb-4">
                        <User size={16} /> 基本情報
                    </h2>
                    <div className="space-y-4">
                        <div>
                            <label className="text-xs font-bold text-gray-400 block mb-1">氏名</label>
                            {isEditing ? (
                                <input name="name" value={formData.name} onChange={handleChange} className="w-full border border-gray-200 rounded-xl p-3 font-bold text-gray-800 focus:outline-none focus:border-orange-300 bg-gray-50" />
                            ) : (
                                <p className="text-lg font-bold text-gray-800">{formData.name}</p>
                            )}
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-400 block mb-1">氏名（フリガナ）</label>
                            {isEditing ? (
                                <input name="kana_name" value={formData.kana_name} onChange={handleChange} className="w-full border border-gray-200 rounded-xl p-3 font-medium text-gray-800 focus:outline-none focus:border-orange-300 bg-gray-50" />
                            ) : (
                                <p className="font-medium text-gray-800">{formData.kana_name || '未設定'}</p>
                            )}
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs font-bold text-gray-400 block mb-1">保険種別</label>
                                {isEditing ? (
                                    <select name="insurance_type" value={formData.insurance_type} onChange={handleChange} className="w-full border border-gray-200 rounded-xl p-3 font-medium text-gray-800 focus:outline-none focus:border-orange-300 bg-gray-50">
                                        <option value="">未選択</option>
                                        <option value="介護保険">介護保険</option>
                                        <option value="医療保険">医療保険</option>
                                    </select>
                                ) : (
                                    <p className="font-medium text-gray-800">{formData.insurance_type || '未設定'}</p>
                                )}
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-400 block mb-1">介護度</label>
                                {isEditing ? (
                                    <select name="care_level" value={formData.care_level} onChange={handleChange} className="w-full border border-gray-200 rounded-xl p-3 font-medium text-gray-800 focus:outline-none focus:border-orange-300 bg-gray-50">
                                        <option value="">未選択</option>
                                        <option value="要支援1">要支援1</option>
                                        <option value="要支援2">要支援2</option>
                                        <option value="要介護1">要介護1</option>
                                        <option value="要介護2">要介護2</option>
                                        <option value="要介護3">要介護3</option>
                                        <option value="要介護4">要介護4</option>
                                        <option value="要介護5">要介護5</option>
                                    </select>
                                ) : (
                                    <p className="font-medium text-gray-800">{formData.care_level || '未設定'}</p>
                                )}
                            </div>
                        </div>
                    </div>
                </section>

                {/* Medical Info Group */}
                <section className="bg-white p-6 rounded-3xl shadow-sm border border-orange-50">
                    <h2 className="text-sm font-bold text-gray-400 flex items-center gap-2 mb-4">
                        <Stethoscope size={16} /> 医療・疾患情報
                    </h2>
                    <div className="space-y-4">
                        <div>
                            <label className="text-xs font-bold text-gray-400 block mb-1">診断名</label>
                            {isEditing ? (
                                <input name="diagnosis" value={formData.diagnosis} onChange={handleChange} className="w-full border border-gray-200 rounded-xl p-3 font-medium text-gray-800 focus:outline-none focus:border-orange-300 bg-gray-50" />
                            ) : (
                                <p className="font-medium text-gray-800">{formData.diagnosis || '未設定'}</p>
                            )}
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-400 block mb-1">現病歴</label>
                            {isEditing ? (
                                <textarea name="current_illness" value={formData.current_illness} onChange={handleChange} rows={2} className="w-full border border-gray-200 rounded-xl p-3 font-medium text-gray-800 focus:outline-none focus:border-orange-300 bg-gray-50 resize-none" />
                            ) : (
                                <p className="font-medium text-gray-800 whitespace-pre-wrap">{formData.current_illness || '未設定'}</p>
                            )}
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-400 block mb-1">既往歴</label>
                            {isEditing ? (
                                <textarea name="medical_history" value={formData.medical_history} onChange={handleChange} rows={2} className="w-full border border-gray-200 rounded-xl p-3 font-medium text-gray-800 focus:outline-none focus:border-orange-300 bg-gray-50 resize-none" />
                            ) : (
                                <p className="font-medium text-gray-800 whitespace-pre-wrap">{formData.medical_history || '未設定'}</p>
                            )}
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-400 block mb-1">主治医（かかりつけ医）</label>
                            {isEditing ? (
                                <input name="primary_physician" value={formData.primary_physician} onChange={handleChange} className="w-full border border-gray-200 rounded-xl p-3 font-medium text-gray-800 focus:outline-none focus:border-orange-300 bg-gray-50" />
                            ) : (
                                <p className="font-medium text-gray-800">{formData.primary_physician || '未設定'}</p>
                            )}
                        </div>
                    </div>
                </section>

                {/* Network Group */}
                <section className="bg-white p-6 rounded-3xl shadow-sm border border-orange-50">
                    <h2 className="text-sm font-bold text-gray-400 flex items-center gap-2 mb-4">
                        <LinkIcon size={16} /> ネットワ－ク・家族
                    </h2>
                    <div className="space-y-4">
                        <div>
                            <label className="text-xs font-bold text-gray-400 block mb-1">家族関係・家系図情報</label>
                            {isEditing ? (
                                <textarea name="family_structure" value={formData.family_structure} onChange={handleChange} rows={3} placeholder="例：長男（同居）、長女（県外在住）など" className="w-full border border-gray-200 rounded-xl p-3 font-medium text-gray-800 focus:outline-none focus:border-orange-300 bg-gray-50 resize-none" />
                            ) : (
                                <p className="font-medium text-gray-800 whitespace-pre-wrap">{formData.family_structure || '未設定'}</p>
                            )}
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-400 flex items-center gap-1 mb-1">
                                <PhoneCall size={12}/> キーパーソン(KP)連絡先
                            </label>
                            {isEditing ? (
                                <input name="key_person_contact" value={formData.key_person_contact} onChange={handleChange} placeholder="例：長男 090-xxxx-xxxx" className="w-full border border-gray-200 rounded-xl p-3 font-medium text-gray-800 focus:outline-none focus:border-orange-300 bg-gray-50" />
                            ) : (
                                <p className="font-medium text-gray-800 whitespace-pre-wrap">{formData.key_person_contact || '未設定'}</p>
                            )}
                        </div>
                    </div>
                </section>

                {/* Important Notes */}
                <section className="bg-white p-6 rounded-3xl shadow-sm border border-red-50 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                        <AlertTriangle size={100} className="text-red-500" />
                    </div>
                    <h2 className="text-sm font-bold text-red-400 flex items-center gap-2 mb-4 relative z-10">
                        <AlertTriangle size={16} /> 注意事項・緊急時対応
                    </h2>
                    <div className="space-y-4 relative z-10">
                        <div>
                            <label className="text-xs font-bold text-red-400 block mb-1">緊急時の対応方法</label>
                            {isEditing ? (
                                <textarea name="emergency_response" value={formData.emergency_response} onChange={handleChange} rows={2} className="w-full border border-red-100 rounded-xl p-3 font-medium text-gray-800 focus:outline-none focus:border-red-300 bg-red-50/30 resize-none" />
                            ) : (
                                <p className="font-medium text-red-900 whitespace-pre-wrap">{formData.emergency_response || '未設定'}</p>
                            )}
                        </div>
                        <div>
                            <label className="text-xs font-bold text-red-400 block mb-1">対応注意事項</label>
                            {isEditing ? (
                                <textarea name="precautions" value={formData.precautions} onChange={handleChange} rows={3} placeholder="例：右麻痺のため左側から声掛け、嚥下注意など" className="w-full border border-red-100 rounded-xl p-3 font-medium text-gray-800 focus:outline-none focus:border-red-300 bg-red-50/30 resize-none" />
                            ) : (
                                <p className="font-medium text-red-900 whitespace-pre-wrap">{formData.precautions || '未設定'}</p>
                            )}
                        </div>
                    </div>
                </section>

                 {/* Settings / Monthly */}
                 <section className="bg-white p-6 rounded-3xl shadow-sm border border-orange-50">
                    <h2 className="text-sm font-bold text-gray-400 flex items-center gap-2 mb-4">
                        <CalIcon size={16} /> 月間予定
                    </h2>
                    <div className="space-y-4">
                        <div>
                            {isEditing ? (
                                <textarea name="monthly_schedule" value={formData.monthly_schedule} onChange={handleChange} rows={3} placeholder="例：第2火曜日内科受診、月・木デイサービス" className="w-full border border-gray-200 rounded-xl p-3 font-medium text-gray-800 focus:outline-none focus:border-orange-300 bg-gray-50 resize-none" />
                            ) : (
                                <p className="font-medium text-gray-800 whitespace-pre-wrap">{formData.monthly_schedule || '未設定'}</p>
                            )}
                        </div>
                    </div>
                </section>

            </main>

            {/* Save Action Banner */}
            {isEditing && (
                 <div className="fixed bottom-0 w-full bg-white border-t border-gray-100 p-4 flex gap-4 z-50 shadow-[0_-10px_40px_rgba(0,0,0,0.08)] md:justify-center">
                    <button 
                        onClick={() => setIsEditing(false)}
                        disabled={isSaving}
                        className="flex-1 max-w-[150px] bg-gray-100 text-gray-600 font-bold py-4 rounded-xl transition-colors hover:bg-gray-200"
                    >
                        キャンセル
                    </button>
                    <button 
                        onClick={handleSave}
                        disabled={isSaving}
                        className="flex-1 max-w-sm bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white font-bold py-4 rounded-xl flex justify-center items-center gap-2 transition-all shadow-md active:scale-95"
                    >
                        {isSaving ? <Loader2 size={24} className="animate-spin" /> : <CheckCircle size={24} />}
                        {isSaving ? '保存中...' : 'プロフィールを保存'}
                    </button>
                 </div>
            )}
        </div>
    );
}
