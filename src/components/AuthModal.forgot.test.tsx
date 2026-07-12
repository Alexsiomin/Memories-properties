import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

// --- Mocks -----------------------------------------------------------------
const resetPasswordForEmail = vi.fn();

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      resetPasswordForEmail: (...args: unknown[]) => resetPasswordForEmail(...args),
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
    },
  },
}));

vi.mock('@/hooks/use-auth', () => ({
  useAuth: () => ({ user: null, session: null, loading: false, signOut: vi.fn() }),
}));

const toast = { success: vi.fn(), error: vi.fn() };
vi.mock('sonner', () => ({ toast: { success: (m: string) => toast.success(m), error: (m: string) => toast.error(m) } }));

import AuthModal from './AuthModal';

const renderModal = () =>
  render(
    <MemoryRouter initialEntries={['/?auth=1']}>
      <AuthModal />
    </MemoryRouter>
  );

const goToForgot = () => {
  renderModal();
  fireEvent.click(screen.getByRole('button', { name: /forgot password/i }));
};

describe('AuthModal — forgot password flow', () => {
  beforeEach(() => {
    resetPasswordForEmail.mockReset();
    toast.success.mockReset();
    toast.error.mockReset();
  });

  it('switches to the reset view when "Forgot password?" is clicked', () => {
    goToForgot();
    expect(screen.getAllByText('Reset your password').length).toBeGreaterThan(0);
  });

  it('sends a reset link with the correct redirect URL and shows the success message', async () => {
    resetPasswordForEmail.mockResolvedValue({ error: null });
    goToForgot();

    fireEvent.change(screen.getByPlaceholderText(/email address/i), {
      target: { value: '  User@Example.com  ' },
    });
    fireEvent.click(screen.getByRole('button', { name: /send reset link/i }));

    await waitFor(() => expect(resetPasswordForEmail).toHaveBeenCalledTimes(1));
    // email is trimmed + lowercased, redirect points at /reset-password
    expect(resetPasswordForEmail).toHaveBeenCalledWith(
      'user@example.com',
      expect.objectContaining({ redirectTo: expect.stringContaining('/reset-password') })
    );
    await waitFor(() =>
      expect(toast.success).toHaveBeenCalledWith('Password reset link sent. Check your inbox.')
    );
    // returns to sign-in view
    await waitFor(() =>
      expect(screen.getAllByText('Sign in to Memories').length).toBeGreaterThan(0)
    );
  });

  it('surfaces backend errors as an error toast', async () => {
    resetPasswordForEmail.mockResolvedValue({ error: new Error('rate limit exceeded') });
    goToForgot();

    fireEvent.change(screen.getByPlaceholderText(/email address/i), {
      target: { value: 'user@example.com' },
    });
    fireEvent.click(screen.getByRole('button', { name: /send reset link/i }));

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('rate limit exceeded'));
    expect(toast.success).not.toHaveBeenCalled();
  });
});
