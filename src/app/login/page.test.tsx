import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import LoginPage from './page';
import { createClient } from '@/utils/supabase/client';

// Supabaseクライアントをモック化
jest.mock('@/utils/supabase/client', () => ({
    createClient: jest.fn(() => ({
        auth: {
            signInWithOAuth: jest.fn(),
        },
    })),
}));

describe('LoginPage Component', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('Googleログインボタンをクリックすると、サインイン処理が呼ばれること', async () => {
        // ログイン処理のモックを定義
        const signInMock = jest.fn().mockResolvedValue({ data: null, error: null });
        (createClient as jest.Mock).mockReturnValue({
            auth: {
                signInWithOAuth: signInMock,
            },
        });

        // 画面をレンダリング
        render(<LoginPage />);

        // ボタンを取得してクリック
        const button = screen.getByRole('button', { name: /Googleでログイン/i });
        fireEvent.click(button);

        // 期待値: signInWithOAuthが正しい引数で呼び出されたこと
        await waitFor(() => {
            expect(signInMock).toHaveBeenCalledWith({
                provider: "google",
                options: expect.objectContaining({
                    redirectTo: expect.stringContaining('/auth/callback'),
                }),
            });
        });
    });
});
