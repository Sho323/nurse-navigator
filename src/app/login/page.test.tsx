import { render, screen } from '@testing-library/react';
import LoginPage from './page';

describe('LoginPage', () => {
    it('renders a login button', () => {
        render(<LoginPage />);

        const button = screen.getByRole('button', { name: /Googleでログイン/i });
        expect(button).toBeInTheDocument();
    });
});
