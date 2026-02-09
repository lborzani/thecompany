import { describe, it, expect } from 'vitest';
import { degreeOfSuccess, degreeLabel, degreeColor } from '../../utils/pf2e/degrees';

describe('degreeOfSuccess', () => {
  // Basic degree thresholds
  it('should return success when total >= DC', () => {
    expect(degreeOfSuccess(10, 15, 15)).toBe('success');
    expect(degreeOfSuccess(10, 20, 15)).toBe('success');
  });

  it('should return failure when total < DC', () => {
    expect(degreeOfSuccess(10, 14, 15)).toBe('failure');
  });

  it('should return critical-success when total >= DC + 10', () => {
    expect(degreeOfSuccess(10, 25, 15)).toBe('critical-success');
    expect(degreeOfSuccess(10, 30, 15)).toBe('critical-success');
  });

  it('should return critical-failure when total <= DC - 10', () => {
    expect(degreeOfSuccess(10, 5, 15)).toBe('critical-failure');
    expect(degreeOfSuccess(10, 3, 15)).toBe('critical-failure');
  });

  it('should treat total == DC - 10 as critical failure', () => {
    expect(degreeOfSuccess(5, 5, 15)).toBe('critical-failure');
  });

  // Natural 20 improvements
  it('nat 20 should improve failure to success', () => {
    expect(degreeOfSuccess(20, 14, 15)).toBe('success');
  });

  it('nat 20 should improve success to critical success', () => {
    expect(degreeOfSuccess(20, 15, 15)).toBe('critical-success');
  });

  it('nat 20 should improve critical failure to failure', () => {
    expect(degreeOfSuccess(20, 5, 15)).toBe('failure');
  });

  it('nat 20 should keep critical success as critical success', () => {
    expect(degreeOfSuccess(20, 25, 15)).toBe('critical-success');
  });

  // Natural 1 worsenings
  it('nat 1 should worsen success to failure', () => {
    expect(degreeOfSuccess(1, 15, 15)).toBe('failure');
  });

  it('nat 1 should worsen critical success to success', () => {
    expect(degreeOfSuccess(1, 25, 15)).toBe('success');
  });

  it('nat 1 should worsen failure to critical failure', () => {
    expect(degreeOfSuccess(1, 14, 15)).toBe('critical-failure');
  });

  it('nat 1 should keep critical failure as critical failure', () => {
    expect(degreeOfSuccess(1, 5, 15)).toBe('critical-failure');
  });
});

describe('degreeLabel', () => {
  it('should return correct labels', () => {
    expect(degreeLabel('critical-success')).toBe('Critical Success');
    expect(degreeLabel('success')).toBe('Success');
    expect(degreeLabel('failure')).toBe('Failure');
    expect(degreeLabel('critical-failure')).toBe('Critical Failure');
  });
});

describe('degreeColor', () => {
  it('should return CSS classes for each degree', () => {
    expect(degreeColor('critical-success')).toContain('yellow');
    expect(degreeColor('success')).toContain('green');
    expect(degreeColor('failure')).toContain('red');
    expect(degreeColor('critical-failure')).toContain('red');
  });
});
