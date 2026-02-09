import { DegreeOfSuccess } from '@thecompany/shared-types';

/**
 * Calculate the degree of success for a PF2e check.
 * 
 * Rules:
 * - total >= DC + 10 → Critical Success
 * - total >= DC → Success  
 * - total <= DC - 10 → Critical Failure
 * - otherwise → Failure
 * 
 * Special: Natural 20 improves result by one step. Natural 1 worsens by one step.
 */
export function degreeOfSuccess(
  naturalRoll: number,
  totalResult: number,
  dc: number
): DegreeOfSuccess {
  // Step 1: Determine base degree from total vs DC
  let degree: DegreeOfSuccess;

  if (totalResult >= dc + 10) {
    degree = 'critical-success';
  } else if (totalResult >= dc) {
    degree = 'success';
  } else if (totalResult <= dc - 10) {
    degree = 'critical-failure';
  } else {
    degree = 'failure';
  }

  // Step 2: Apply natural 20/1 adjustment
  if (naturalRoll === 20) {
    degree = improveDegree(degree);
  } else if (naturalRoll === 1) {
    degree = worsenDegree(degree);
  }

  return degree;
}

function improveDegree(degree: DegreeOfSuccess): DegreeOfSuccess {
  switch (degree) {
    case 'critical-failure': return 'failure';
    case 'failure': return 'success';
    case 'success': return 'critical-success';
    case 'critical-success': return 'critical-success'; // Can't go higher
  }
}

function worsenDegree(degree: DegreeOfSuccess): DegreeOfSuccess {
  switch (degree) {
    case 'critical-success': return 'success';
    case 'success': return 'failure';
    case 'failure': return 'critical-failure';
    case 'critical-failure': return 'critical-failure'; // Can't go lower
  }
}

/**
 * Get a human-readable label for a degree of success.
 */
export function degreeLabel(degree: DegreeOfSuccess): string {
  switch (degree) {
    case 'critical-success': return 'Critical Success';
    case 'success': return 'Success';
    case 'failure': return 'Failure';
    case 'critical-failure': return 'Critical Failure';
  }
}

/**
 * Get a CSS color class for a degree of success.
 */
export function degreeColor(degree: DegreeOfSuccess): string {
  switch (degree) {
    case 'critical-success': return 'text-yellow-400';
    case 'success': return 'text-green-400';
    case 'failure': return 'text-red-400';
    case 'critical-failure': return 'text-red-600';
  }
}
