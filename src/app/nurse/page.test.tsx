import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import NurseHomePage from './page';

describe('NurseHomePage Component', () => {
    it('写真アップロード時、ファイルサイズが5MB以上の場合にエラーメッセージを表示し処理を中断すること', async () => {
        // 画面をレンダリング
        render(<NurseHomePage />);

        // 6MBのダミーファイルを作成
        const largeFile = new File(['x'.repeat(6 * 1024 * 1024)], 'large_image.jpg', { type: 'image/jpeg' });

        // file input要素を取得
        const fileInput = screen.getByLabelText('写真添付');

        // ファイルをユーザー操作としてアップロード
        await userEvent.upload(fileInput, largeFile);

        // 期待値: 画面上にエラーメッセージが表示されること
        await waitFor(() => {
            expect(screen.getByText('ファイルサイズが大きすぎます（5MB以上）。')).toBeInTheDocument();
        });
    });
});
