import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import NurseHomePageClient from './NurseHomePageClient';

// 外部依存をモック化
jest.mock('../actions', () => ({
    saveVisitRecord: jest.fn(),
}));

jest.mock('@/hooks/useSpeechRecognition', () => ({
    useSpeechRecognition: () => ({
        isListening: false,
        transcript: '',
        setTranscript: jest.fn(),
        startListening: jest.fn(),
        stopListening: jest.fn(),
    }),
}));

jest.mock('next/navigation', () => ({
    useRouter: () => ({
        refresh: jest.fn(),
    }),
}));

jest.mock('@/utils/supabase/client', () => ({
    createClient: jest.fn(() => ({
        auth: {
            signOut: jest.fn(),
        },
    })),
}));

describe('NurseHomePageClient Component', () => {
    const mockProfile = {
        id: 'user-id',
        tenant_id: 'tenant-id',
        name: '田中 看護師',
        role: 'nurse'
    };
    
    const mockPatients = [
        { id: 'patient-id', name: '佐藤 健一', tenant_id: 'tenant-id', insurance_type: '介護保険', care_level: '要介護3' }
    ];

    it('写真アップロード時、ファイルサイズが5MB以上の場合にエラーメッセージを表示すること', async () => {
        // UIをレンダリング
        render(<NurseHomePageClient profile={mockProfile as any} patients={mockPatients as any} />);

        // user-eventをセットアップ
        const user = userEvent.setup();

        // 6MBのダミーファイルを作成
        const largeFile = new File(['x'.repeat(6 * 1024 * 1024)], 'large_image.jpg', { type: 'image/jpeg' });
        
        // ファイル入力欄を取得しアップロード
        const fileInput = screen.getByLabelText(/写真添付/i);
        await user.upload(fileInput, largeFile);

        // 期待値: サイズ制限超過のエラーメッセージが即座に表示されること
        await waitFor(() => {
            expect(screen.getByText(/ファイルサイズが大きすぎます/i)).toBeInTheDocument();
        });
        
        // 「添付済み」の表示に変わっていないことを確認
        expect(screen.queryByText('添付済み')).not.toBeInTheDocument();
    });
});
