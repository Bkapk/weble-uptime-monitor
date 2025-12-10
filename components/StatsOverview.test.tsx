import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import StatsOverview from './StatsOverview';
import { Stats } from '../types';

describe('StatsOverview', () => {
  const mockStats: Stats = {
    total: 10,
    up: 7,
    down: 2,
    paused: 1,
    avgLatency: 150,
  };

  it('should render all stats correctly', () => {
    render(<StatsOverview stats={mockStats} />);

    expect(screen.getByText('Total Monitors')).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument();

    expect(screen.getByText('Operational')).toBeInTheDocument();
    expect(screen.getByText('7')).toBeInTheDocument();

    expect(screen.getByText('Downtime')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();

    expect(screen.getByText('Avg. Latency')).toBeInTheDocument();
    expect(screen.getByText('150ms')).toBeInTheDocument();
  });

  it('should display -- when avgLatency is 0', () => {
    const statsWithZeroLatency: Stats = {
      ...mockStats,
      avgLatency: 0,
    };

    render(<StatsOverview stats={statsWithZeroLatency} />);
    expect(screen.getByText('--')).toBeInTheDocument();
  });

  it('should handle zero monitors', () => {
    const emptyStats: Stats = {
      total: 0,
      up: 0,
      down: 0,
      paused: 0,
      avgLatency: 0,
    };

    render(<StatsOverview stats={emptyStats} />);
    expect(screen.getByText('Total Monitors')).toBeInTheDocument();
    expect(screen.getAllByText('0')).toHaveLength(3); // total, up, down
    expect(screen.getByText('--')).toBeInTheDocument(); // avgLatency
  });
});

