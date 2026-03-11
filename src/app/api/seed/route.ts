import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
    try {
        const supabase = await createClient();

        // 1. Get current logged in user
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // 管理者クライアントを作成（RLSを無視してデータを生成するため）
        console.log("Creating Admin Client ...");
        const adminUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const adminKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        
        if (!adminUrl || !adminKey) {
            console.error("Missing SUPABASE env vars for admin");
            return NextResponse.json({ error: 'Missing Server Configuration' }, { status: 500 });
        }

        const supabaseAdmin = createSupabaseClient(adminUrl, adminKey);

        // 2. Clear existing tenants (cascade will handle the rest)
        // ※自分の現在のテナント等を消さないように、必要ならWHERE句を調整できますが、
        // 今回はデモ用なので全消去でもOKか、もしくは全消去せずに新しいテナントを作る方針にします。
        
        // 3. Create Tenant
        console.log("Creating Tenant...");
        const { data: tenant, error: tenantError } = await supabaseAdmin
            .from('tenants')
            .insert({ name: 'さくら訪問看護ステーション' })
            .select()
            .single();

        if (tenantError || !tenant) {
            console.error('Tenant Error:', tenantError);
            return NextResponse.json({ error: 'Failed to create tenant: ' + tenantError?.message }, { status: 500 });
        }

        // 4. Update Current User Profile
        const { error: profileError } = await supabaseAdmin
            .from('profiles')
            .update({
                tenant_id: tenant.id,
                name: '山田 看護師',
                role: 'nurse'
            })
            .eq('id', user.id);

        if (profileError) {
            console.error('Profile Error:', profileError);
            return NextResponse.json({ error: 'Failed to update profile: ' + profileError.message }, { status: 500 });
        }

        // 5. Create Sample Patients
        const patientsToInsert = [
            {
                tenant_id: tenant.id,
                name: '佐藤 健一',
                kana_name: 'サトウ ケンイチ',
                care_level: '要介護3',
                insurance_type: '介護保険',
            },
            {
                tenant_id: tenant.id,
                name: '鈴木 花子',
                kana_name: 'スズキ ハナコ',
                care_level: '要支援2',
                insurance_type: '医療保険',
            },
            {
                tenant_id: tenant.id,
                name: '高橋 一郎',
                kana_name: 'タカハシ イチロウ',
                care_level: '要介護1',
                insurance_type: '介護保険',
            }
        ];

        const { error: patientsError } = await supabaseAdmin
            .from('patients')
            .insert(patientsToInsert);

        if (patientsError) {
            console.error('Patients Error:', patientsError);
            return NextResponse.json({ error: 'Failed to insert patients: ' + patientsError.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, message: 'Seed data created successfully' });

    } catch (err) {
        console.error('Unexpected error:', err);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
