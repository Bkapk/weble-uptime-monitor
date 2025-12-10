import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import MonitorCard from './MonitorCard';
import { Monitor, MonitorStatus } from '../types';

describe('MonitorCard', () => {
  const mockMonitor: Monitor = {
    id: 'test-1',
    url: 'https://example.com',
    name: 'example.com',
    status: MonitorStatus.UP,
    statusCode: 200,
    lastChecked: Date.now() - 30000, // 30 seconds ago
    latency: 150,
    history: [
      { timestamp: Date.now() - 60000, latency: 120 },
      { timestamp: Date.now() - 30000, latency: 150 },
    ],
    interval: 60,
    isPaused: false,
  };

  const mockHandlers = {
    onRemove: vi.fn(),
    onTogglePause: vi.fn(),
    onManualCheck: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render monitor information correctly', () => {
    render(
      <MonitorCard monitor={mockMonitor} {...mockHandlers} />
    );

    expect(screen.getByText('example.com')).toBeInTheDocument();
    expect(screen.getByText('https://example.com')).toBeInTheDocument();
    expect(screen.getByText('UP')).toBeInTheDocument();
    expect(screen.getByText('150ms')).toBeInTheDocument();
    expect(screen.getByText('200')).toBeInTheDocument();
  });

  it('should call onRemove when delete button is clicked', () => {
    render(
      <MonitorCard monitor={mockMonitor} {...mockHandlers} />
    );

    const deleteButton = screen.getAllByTitle('Remove Monitor')[0];
    fireEvent.click(deleteButton);

    expect(mockHandlers.onRemove).toHaveBeenCalledWith('test-1');
  });

  it('should call onTogglePause when pause button is clicked', () => {
    render(
      <MonitorCard monitor={mockMonitor} {...mockHandlers} />
    );

    const pauseButton = screen.getAllByTitle('Pause')[0];
    fireEvent.click(pauseButton);

    expect(mockHandlers.onTogglePause).toHaveBeenCalledWith('test-1');
  });

  it('should call onManualCheck when refresh button is clicked', () => {
    render(
      <MonitorCard monitor={mockMonitor} {...mockHandlers} />
    );

    const refreshButton = screen.getAllByTitle('Check Now')[0];
    fireEvent.click(refreshButton);

    expect(mockHandlers.onManualCheck).toHaveBeenCalledWith('test-1');
  });

  it('should display DOWN status correctly', () => {
    const downMonitor: Monitor = {
      ...mockMonitor,
      status: MonitorStatus.DOWN,
      statusCode: 500,
    };

    render(
      <MonitorCard monitor={downMonitor} {...mockHandlers} />
    );

    expect(screen.getByText('DOWN')).toBeInTheDocument();
  });

  it('should display PENDING status correctly', () => {
    const pendingMonitor: Monitor = {
      ...mockMonitor,
      status: MonitorStatus.PENDING,
      statusCode: undefined,
    };

    render(
      <MonitorCard monitor={pendingMonitor} {...mockHandlers} />
    );

    expect(screen.getByText('PENDING')).toBeInTheDocument();
  });

  it('should show play button when monitor is paused', () => {
    const pausedMonitor: Monitor = {
      ...mockMonitor,
      isPaused: true,
      status: MonitorStatus.PAUSED,
    };

    render(
      <MonitorCard monitor={pausedMonitor} {...mockHandlers} />
    );

    expect(screen.getByTitle('Resume')).toBeInTheDocument();
  });
});

