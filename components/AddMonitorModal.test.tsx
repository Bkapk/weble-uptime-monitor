import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AddMonitorModal from './AddMonitorModal';
import { AddMonitorFormData } from '../types';

describe('AddMonitorModal', () => {
  const mockOnAdd = vi.fn();
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should not render when isOpen is false', () => {
    render(
      <AddMonitorModal isOpen={false} onClose={mockOnClose} onAdd={mockOnAdd} />
    );

    expect(screen.queryByText('Add Monitors')).not.toBeInTheDocument();
  });

  it('should render when isOpen is true', () => {
    render(
      <AddMonitorModal isOpen={true} onClose={mockOnClose} onAdd={mockOnAdd} />
    );

    expect(screen.getByText('Add Monitors')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/https:\/\/google.com/)).toBeInTheDocument();
  });

  it('should call onClose when cancel button is clicked', () => {
    render(
      <AddMonitorModal isOpen={true} onClose={mockOnClose} onAdd={mockOnAdd} />
    );

    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should call onClose when X button is clicked', () => {
    render(
      <AddMonitorModal isOpen={true} onClose={mockOnClose} onAdd={mockOnAdd} />
    );

    const closeButton = screen.getByRole('button', { name: '' });
    fireEvent.click(closeButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should submit form with correct data', async () => {
    const user = userEvent.setup();
    render(
      <AddMonitorModal isOpen={true} onClose={mockOnClose} onAdd={mockOnAdd} />
    );

    const textarea = screen.getByPlaceholderText(/https:\/\/google.com/);
    const intervalInput = screen.getByLabelText(/Check Interval/);
    const submitButton = screen.getByText('Start Monitoring');

    await user.type(textarea, 'https://example.com\nhttps://google.com');
    await user.clear(intervalInput);
    await user.type(intervalInput, '120');
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockOnAdd).toHaveBeenCalledWith({
        urls: 'https://example.com\nhttps://google.com',
        interval: 120,
      });
    });

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should validate required URLs field', async () => {
    const user = userEvent.setup();
    render(
      <AddMonitorModal isOpen={true} onClose={mockOnClose} onAdd={mockOnAdd} />
    );

    const submitButton = screen.getByText('Start Monitoring');
    await user.click(submitButton);

    // Form should not submit without URLs
    expect(mockOnAdd).not.toHaveBeenCalled();
  });

  it('should have default interval value', () => {
    render(
      <AddMonitorModal isOpen={true} onClose={mockOnClose} onAdd={mockOnAdd} />
    );

    const intervalInput = screen.getByLabelText(/Check Interval/) as HTMLInputElement;
    expect(intervalInput.value).toBe('60');
  });
});

