import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

// --- Mocks -----------------------------------------------------------------
const updateUser = vi.fn();
const navigate = vi.fn();

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      // Report an active recovery session so the form becomes enabled.
      onAuthStateChange: (cb: (e: string, s: unknown) => void) => {
        cb('PASSWORD_RECOVERY', { user: { id: 'u1' } });
        return { data: { subscription: { unsubscribe: vi.fn() } } };
      },
      getSession: () => Promise.resolve({ data: { session: { user: { id: 'u1' } } } }),
      updateUser: (...args: unknown[]) => updateUser(...args),
    },
  },
}));

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return { ...actual, useNavigate: () => navigate };
});

const toast = { success: vi.fn(), error: vi.fn() };
vi.mock('sonner', () => ({ toast: { success: (m: string) => toast.success(m), error: (m: string) => toast.error(m) } }));

import ResetPassword from './ResetPassword';

const renderPage = () =>
  render(
    <MemoryRouter initialEntries={['/reset-password']}>
      <ResetPassword />
    </MemoryRouter>
  );

const fill = (pw: string, confirm: string) => {
  fireEvent.change(screen.getByPlaceholderText('New password'), { target: { value: pw } });
  fireEvent.change(screen.getByPlaceholderText('Confirm new password'), { target: { value: confirm } });
};

describe('ResetPassword page', () => {
  beforeEach(() => {
    updateUser.mockReset();
    navigate.mockReset();
    toast.success.mockReset();
    toast.error.mockReset();
  });

  it('enables the form once a recovery session is present', async () => {
    renderPage();
    await waitFor(() =>
      expect(screen.getByText('Enter your new password below.')).toBeInTheDocument()
    );
    expect(screen.getByPlaceholderText('New password')).not.toBeDisabled();
  });

  it('rejects passwords shorter than 6 characters', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByPlaceholderText('New password')).not.toBeDisabled());

    fill('123', '123');
    fireEvent.click(screen.getByRole('button', { name: /update password/i }));

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith('Password must be at least 6 characters.')
    );
    expect(updateUser).not.toHaveBeenCalled();
  });

  it('rejects mismatched passwords', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByPlaceholderText('New password')).not.toBeDisabled());

    fill('abcdef', 'abcdeg');
    fireEvent.click(screen.getByRole('button', { name: /update password/i }));

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Passwords do not match.'));
    expect(updateUser).not.toHaveBeenCalled();
  });

  it('updates the password and redirects to /account on success', async () => {
    updateUser.mockResolvedValue({ error: null });
    renderPage();
    await waitFor(() => expect(screen.getByPlaceholderText('New password')).not.toBeDisabled());

    fill('newpass123', 'newpass123');
    fireEvent.click(screen.getByRole('button', { name: /update password/i }));

    await waitFor(() => expect(updateUser).toHaveBeenCalledWith({ password: 'newpass123' }));
    await waitFor(() =>
      expect(toast.success).toHaveBeenCalledWith('Password updated. You are now signed in.')
    );
    expect(navigate).toHaveBeenCalledWith('/account', { replace: true });
  });

  it('surfaces backend errors as an error toast', async () => {
    updateUser.mockResolvedValue({ error: new Error('token expired') });
    renderPage();
    await waitFor(() => expect(screen.getByPlaceholderText('New password')).not.toBeDisabled());

    fill('newpass123', 'newpass123');
    fireEvent.click(screen.getByRole('button', { name: /update password/i }));

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('token expired'));
    expect(navigate).not.toHaveBeenCalled();
  });
});
