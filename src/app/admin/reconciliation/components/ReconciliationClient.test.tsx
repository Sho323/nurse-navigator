import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ReconciliationClient from './ReconciliationClient';
import { processReconciliation } from '../actions';

// mock next/link
jest.mock('next/link', () => {
    return ({ children, href }: { children: React.ReactNode, href: string }) => {
        return <a href={href}>{children}</a>;
    };
});

// mock server actions
jest.mock('../actions', () => ({
    processReconciliation: jest.fn(),
}));

describe('ReconciliationClient Component', () => {
    const mockProfile = {
        tenant_id: 'tenant-123',
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('請求CSVと入金CSVを両方とも選択した状態でのみ、アップロードボタンが活性化すること', async () => {
        const user = userEvent.setup();
        render(<ReconciliationClient profile={mockProfile} initialData={[]} />);

        const submitButton = screen.getByRole('button', { name: /アップロードしたCSVで自動消込を開始/i });
        
        // 初期状態では無効化されている
        expect(submitButton).toBeDisabled();

        const dummyCsv1 = new File(['dummy,csv'], 'dummy1.csv', { type: 'text/csv' });
        const dummyCsv2 = new File(['dummy,csv'], 'dummy2.csv', { type: 'text/csv' });

        // 片方のファイル（請求CSV）のみ選択
        const receiptInput = document.querySelector('input[type="file"]') as HTMLInputElement;
        await user.upload(receiptInput, dummyCsv1);

        // まだ無効化されている
        expect(submitButton).toBeDisabled();

        // もう片方（入金CSV）も選択
        const bankInputs = document.querySelectorAll('input[type="file"]');
        const bankInput = bankInputs[1] as HTMLInputElement;
        await user.upload(bankInput, dummyCsv2);

        // 両方選択されたのでボタンが活性化される
        expect(submitButton).not.toBeDisabled();
    });

    it('アップロード後、消込APIから成功レスポンスが返ってきた際、完了メッセージが表示されること', async () => {
        // processReconciliationが成功レスポンスを返すようにモック
        (processReconciliation as jest.Mock).mockResolvedValue({ success: true });

        const user = userEvent.setup();
        render(<ReconciliationClient profile={mockProfile} initialData={[]} />);

        const dummyCsv1 = new File(['dummy,csv'], 'dummy1.csv', { type: 'text/csv' });
        const dummyCsv2 = new File(['dummy,csv'], 'dummy2.csv', { type: 'text/csv' });
        
        // jsdom workaround: File.text() is not implemented in jsdom
        dummyCsv1.text = jest.fn().mockResolvedValue('dummy,csv');
        dummyCsv2.text = jest.fn().mockResolvedValue('dummy,csv');

        const inputs = document.querySelectorAll('input[type="file"]');
        await user.upload(inputs[0] as HTMLInputElement, dummyCsv1);
        await user.upload(inputs[1] as HTMLInputElement, dummyCsv2);

        // ボタンをクリック
        const submitButton = screen.getByRole('button', { name: /アップロードしたCSVで自動消込を開始/i });
        fireEvent.click(submitButton);

        // メッセージが表示されるのを待機
        await waitFor(() => {
            expect(screen.getByText('ルールベースの消込処理が完了しました。')).toBeInTheDocument();
        });

        // サーバーアクションが呼ばれたことを確認 (FormDataの中身までは検証を省略)
        expect(processReconciliation).toHaveBeenCalledTimes(1);
    });
});
