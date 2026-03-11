import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ChatPageClient from './ChatPageClient';
import { sendMessage } from '../actions';
import { createClient } from '@/utils/supabase/client';

// モックの設定
jest.mock('../actions', () => ({
    sendMessage: jest.fn(),
}));

jest.mock('@/hooks/useSpeechRecognition', () => ({
    useSpeechRecognition: () => ({
        isListening: false,
        transcript: '',
        setTranscript: jest.fn(),
        startListening: jest.fn(),
        stopListening: jest.fn(),
        resetTranscript: jest.fn(),
    }),
}));

jest.mock('next/navigation', () => ({
    useRouter: () => ({
        refresh: jest.fn(),
    }),
}));

const mockSubscribe = jest.fn();
const mockOn = jest.fn().mockReturnValue({ subscribe: mockSubscribe });
const mockRemoveChannel = jest.fn();

// Supabaseクライアントの追加フェッチをモック (sender情報取得用)
const mockSingle = jest.fn().mockResolvedValue({ data: { name: '佐藤 先生', role: 'doctor' } });
const mockEq = jest.fn().mockReturnValue({ single: mockSingle });
const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });
const mockFrom = jest.fn().mockReturnValue({ select: mockSelect });

jest.mock('@/utils/supabase/client', () => ({
    createClient: jest.fn(() => ({
        channel: jest.fn().mockReturnValue({
            on: mockOn,
        }),
        removeChannel: mockRemoveChannel,
        from: mockFrom,
    })),
}));

// ResizeObserverのモック (scrollIntoView用)
window.HTMLElement.prototype.scrollIntoView = jest.fn();

describe('ChatPageClient Component', () => {
    const mockProfile = {
        id: 'user1',
        tenant_id: 'tenant1',
        name: '山田 看護師',
        role: 'nurse'
    };

    const initialMessages = [
        {
            id: 'msg1',
            content: '最初のメッセージ',
            tenant_id: 'tenant1',
            sender_id: 'user1',
            patient_id: 'patient1',
            created_at: new Date().toISOString(),
            is_system_alert: false,
            sender: { name: '山田 看護師', role: 'nurse' }
        }
    ];

    const mockPatients = [
        { id: 'patient1', name: '佐藤 健一', tenant_id: 'tenant1' },
        { id: 'patient2', name: '鈴木 花子', tenant_id: 'tenant1' }
    ];

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('テキストを入力して送信ボタンを押すと、メッセージ送信メソッドが呼ばれ、入力欄がクリアされること', async () => {
        const user = userEvent.setup();
        (sendMessage as jest.Mock).mockResolvedValue({ success: true });

        render(<ChatPageClient profile={mockProfile as any} initialMessages={initialMessages as any} patients={mockPatients as any} />);

        // テキスト入力欄を取得
        const textarea = screen.getByPlaceholderText(/メッセージを入力/i);
        
        // テキストを入力
        await user.type(textarea, 'テストメッセージ');
        expect(textarea).toHaveValue('テストメッセージ');

        // 送信ボタンは disabled ではない状態で取得（アイコンはSend）
        // 確実にするために textarea の親ノードの兄弟にある button 等を探すか、disabled じゃないものを探す
        const buttons = screen.getAllByRole('button');
        const sendButton = buttons.find((b) => {
            const btn = b as HTMLButtonElement;
            return !btn.disabled && btn.innerHTML.includes('lucide-send');
        });
        
        if (sendButton) {
            await user.click(sendButton);
        }

        // 送信処理が呼ばれたことを確認
        await waitFor(() => {
            expect(sendMessage).toHaveBeenCalledTimes(1);
        });

        // FormDataの中身も検証可能だが、ここでは最低限呼び出しを確認
        
        // 入力欄がクリアされたことを確認
        expect(textarea).toHaveValue('');
    });

    it('Supabase Realtimeからの新規メッセージイベントを受信した際、チャット画面に新着メッセージが追加表示されること', async () => {
        render(<ChatPageClient profile={mockProfile as any} initialMessages={initialMessages as any} patients={mockPatients as any} />);

        // 初期表示の確認
        expect(screen.getByText('最初のメッセージ')).toBeInTheDocument();

        // onメソッドで渡されたコールバック関数を取得
        const onCallArgs = mockOn.mock.calls[0];
        const payloadCallback = onCallArgs[2];

        // 新規メッセージが来た体でコールバックを直接実行
        const newRealtimeMessage = {
            id: 'msg2',
            content: 'リアルタイムの新しいメッセージ',
            tenant_id: 'tenant1',
            sender_id: 'user2',
            patient_id: 'patient1',
            created_at: new Date().toISOString(),
            is_system_alert: false,
        };

        // リアルタイムイベント発火
        await payloadCallback({ new: newRealtimeMessage });

        // 新しいメッセージが表示されたことを確認
        await waitFor(() => {
            expect(screen.getByText('リアルタイムの新しいメッセージ')).toBeInTheDocument();
        });
    });
});
