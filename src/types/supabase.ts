export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export interface Database {
    public: {
        Tables: {
            tenants: {
                Row: {
                    id: string
                    name: string
                    created_at: string
                }
                Insert: {
                    id?: string
                    name: string
                    created_at?: string
                }
                Update: {
                    id?: string
                    name?: string
                    created_at?: string
                }
            }
            profiles: {
                Row: {
                    id: string
                    tenant_id: string
                    name: string
                    role: 'admin' | 'nurse'
                    created_at: string
                }
                Insert: {
                    id: string
                    tenant_id: string
                    name: string
                    role?: 'admin' | 'nurse'
                    created_at?: string
                }
                Update: {
                    id?: string
                    tenant_id?: string
                    name?: string
                    role?: 'admin' | 'nurse'
                    created_at?: string
                }
            }
            patients: {
                Row: {
                    id: string
                    tenant_id: string
                    name: string
                    kana_name: string | null
                    care_level: string | null
                    insurance_type: string | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    tenant_id: string
                    name: string
                    kana_name?: string | null
                    care_level?: string | null
                    insurance_type?: string | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    tenant_id?: string
                    name?: string
                    kana_name?: string | null
                    care_level?: string | null
                    insurance_type?: string | null
                    created_at?: string
                }
            }
            visit_records: {
                Row: {
                    id: string
                    tenant_id: string
                    patient_id: string
                    nurse_id: string
                    visit_type: string
                    temperature: number | null
                    blood_pressure: string | null
                    text_record: string | null
                    image_urls: string[] | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    tenant_id: string
                    patient_id: string
                    nurse_id: string
                    visit_type: string
                    temperature?: number | null
                    blood_pressure?: string | null
                    text_record?: string | null
                    image_urls?: string[] | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    tenant_id?: string
                    patient_id?: string
                    nurse_id?: string
                    visit_type?: string
                    temperature?: number | null
                    blood_pressure?: string | null
                    text_record?: string | null
                    image_urls?: string[] | null
                    created_at?: string
                }
            }
            messages: {
                Row: {
                    id: string
                    tenant_id: string
                    sender_id: string
                    patient_id: string | null
                    content: string
                    is_system_alert: boolean
                    created_at: string
                }
                Insert: {
                    id?: string
                    tenant_id: string
                    sender_id: string
                    patient_id?: string | null
                    content: string
                    is_system_alert?: boolean
                    created_at?: string
                }
                Update: {
                    id?: string
                    tenant_id?: string
                    sender_id?: string
                    patient_id?: string | null
                    content?: string
                    is_system_alert?: boolean
                    created_at?: string
                }
            }
            sales_data: {
                Row: {
                    id: string
                    tenant_id: string
                    target_month: string
                    billed_amount: number
                    received_amount: number | null
                    patient_name: string
                    status: 'matched' | 'inferred' | 'error' | 'pending'
                    ai_comment: string | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    tenant_id: string
                    target_month: string
                    billed_amount: number
                    received_amount?: number | null
                    patient_name: string
                    status?: 'matched' | 'inferred' | 'error' | 'pending'
                    ai_comment?: string | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    tenant_id?: string
                    target_month?: string
                    billed_amount?: number
                    received_amount?: number | null
                    patient_name?: string
                    status?: 'matched' | 'inferred' | 'error' | 'pending'
                    ai_comment?: string | null
                    created_at?: string
                }
            }
        }
        Views: {
            [_ in never]: never
        }
        Functions: {
            [_ in never]: never
        }
        Enums: {
            [_ in never]: never
        }
    }
}
