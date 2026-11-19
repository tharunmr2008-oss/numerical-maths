import {
  DividedDifferenceRow,
  InterpolationMethod,
  InterpolationPoint,
  InterpolationResult,
  InterpolationStep,
} from '../types/academic';

const round = (val: number, decimals = 4): number => {
  const factor = Math.pow(10, decimals);
  return Math.round((val + Number.EPSILON) * factor) / factor;
};

export function validateInterpolationInputs(
  rawPoints: InterpolationPoint[],
  targetX: number
): { valid: boolean; error?: string; sortedPoints: InterpolationPoint[] } {
  if (!Number.isFinite(targetX)) {
    return { valid: false, error: 'Target assessment index must be a valid number.', sortedPoints: [] };
  }

  if (rawPoints.length < 2) {
    return {
      valid: false,
      error: 'At least 2 known assessment marks are required to perform numerical interpolation.',
      sortedPoints: [],
    };
  }

  for (const pt of rawPoints) {
    if (!Number.isFinite(pt.x) || !Number.isFinite(pt.y)) {
      return { valid: false, error: 'All known assessment points must contain finite numeric values.', sortedPoints: [] };
    }
  }

  const sortedPoints = [...rawPoints].sort((a, b) => a.x - b.x);
  for (let i = 1; i < sortedPoints.length; i++) {
    if (sortedPoints[i].x === sortedPoints[i - 1].x) {
      return {
        valid: false,
        error: `Duplicate assessment index x = ${sortedPoints[i].x}. Each known mark must have a unique assessment index.`,
        sortedPoints: [],
      };
    }
  }

  return { valid: true, sortedPoints };
}

/**
 * Lagrange Polynomial Interpolation
 * P(x) = sum_{i=0}^{n-1} y_i * L_i(x), where L_i(x) = prod_{j != i} (x - x_j) / (x_i - x_j)
 */
export function evaluateLagrange(points: InterpolationPoint[], targetX: number): {
  estimate: number;
  steps: InterpolationStep[];
} {
  const n = points.length;
  let total = 0;
  const steps: InterpolationStep[] = [];
  const termSummaries: string[] = [];

  for (let i = 0; i < n; i++) {
    let numerator = 1;
    let denominator = 1;
    const numFactors: string[] = [];
    const denFactors: string[] = [];

    for (let j = 0; j < n; j++) {
      if (i !== j) {
        numerator *= targetX - points[j].x;
        denominator *= points[i].x - points[j].x;
        numFactors.push(`(${targetX} - ${points[j].x})`);
        denFactors.push(`(${points[i].x} - ${points[j].x})`);
      }
    }

    const li = numerator / denominator;
    const contribution = points[i].y * li;
    total += contribution;

    steps.push({
      stepNumber: i + 1,
      title: `Basis Polynomial L${i}(${targetX}) for ${points[i].label}`,
      expression: `L${i}(${targetX}) = [${numFactors.join(' · ')}] / [${denFactors.join(' · ')}]`,
      value: `L${i} = ${round(li, 5)} → y${i}·L${i} = ${round(points[i].y, 2)} × ${round(li, 5)} = ${round(contribution, 4)}`,
    });

    termSummaries.push(`${round(contribution, 3)}`);
  }

  steps.push({
    stepNumber: n + 1,
    title: 'Sum Weighted Basis Contributions',
    expression: `P(${targetX}) = ${termSummaries.join(' + ')}`,
    value: `P(${targetX}) = ${round(total, 4)}`,
  });

  return { estimate: total, steps };
}

/**
 * Newton's Divided Difference Interpolation
 */
export function evaluateNewtonDividedDifference(points: InterpolationPoint[], targetX: number): {
  estimate: number;
  steps: InterpolationStep[];
  table: DividedDifferenceRow[];
} {
  const n = points.length;
  const dd: number[][] = Array.from({ length: n }, () => Array(n).fill(0));

  for (let i = 0; i < n; i++) {
    dd[i][0] = points[i].y;
  }

  for (let j = 1; j < n; j++) {
    for (let i = 0; i < n - j; i++) {
      dd[i][j] = (dd[i + 1][j - 1] - dd[i][j - 1]) / (points[i + j].x - points[i].x);
    }
  }

  const table: DividedDifferenceRow[] = points.map((pt, i) => ({
    x: pt.x,
    y: pt.y,
    differences: Array.from({ length: n - i }, (_, order) => round(dd[i][order], 5)),
  }));

  const steps: InterpolationStep[] = [
    {
      stepNumber: 1,
      title: 'Initialize Zeroth-Order Coefficients',
      expression: `b₀ = f[x₀] = ${round(dd[0][0], 4)}`,
      value: `Order 0 constant = ${round(dd[0][0], 4)}`,
    },
  ];

  let estimate = dd[0][0];
  let productTerm = 1;
  const polyTerms: string[] = [`${round(dd[0][0], 4)}`];

  for (let order = 1; order < n; order++) {
    productTerm *= targetX - points[order - 1].x;
    const coeff = dd[0][order];
    const termValue = coeff * productTerm;
    estimate += termValue;

    const factorLabels = Array.from({ length: order }, (_, k) => `(${targetX} - ${points[k].x})`).join('·');
    polyTerms.push(`(${round(coeff, 4)})·${factorLabels}`);

    steps.push({
      stepNumber: order + 1,
      title: `Order-${order} Divided Difference Term`,
      expression: `b${order} = f[x₀…x${order}] = ${round(coeff, 5)} · ${factorLabels}`,
      value: `Term contribution = ${round(termValue, 4)} (Cumulative = ${round(estimate, 4)})`,
    });
  }

  steps.push({
    stepNumber: n + 1,
    title: 'Evaluate Newton Polynomial',
    expression: `P(${targetX}) = ${polyTerms.join(' + ')}`,
    value: `P(${targetX}) = ${round(estimate, 4)}`,
  });

  return { estimate, steps, table };
}

/**
 * Piecewise Linear Interpolation
 */
export function evaluateLinear(points: InterpolationPoint[], targetX: number): {
  estimate: number;
  steps: InterpolationStep[];
} {
  const n = points.length;
  let idx = 0;

  if (targetX <= points[0].x) {
    idx = 0;
  } else if (targetX >= points[n - 1].x) {
    idx = n - 2;
  } else {
    for (let i = 0; i < n - 1; i++) {
      if (targetX >= points[i].x && targetX <= points[i + 1].x) {
        idx = i;
        break;
      }
    }
  }

  const p0 = points[idx];
  const p1 = points[idx + 1];
  const slope = (p1.y - p0.y) / (p1.x - p0.x);
  const estimate = p0.y + slope * (targetX - p0.x);

  const steps: InterpolationStep[] = [
    {
      stepNumber: 1,
      title: 'Select Bracketing Assessment Interval',
      expression: `Interval [x${idx}, x${idx + 1}] = [${p0.x}, ${p1.x}] with marks (${round(p0.y, 2)}, ${round(p1.y, 2)})`,
      value: `Δx = ${p1.x - p0.x}, Δy = ${round(p1.y - p0.y, 4)}`,
    },
    {
      stepNumber: 2,
      title: 'Compute Secant Slope m',
      expression: `m = (${round(p1.y, 2)} - ${round(p0.y, 2)}) / (${p1.x} - ${p0.x})`,
      value: `m = ${round(slope, 5)} marks per assessment`,
    },
    {
      stepNumber: 3,
      title: 'Evaluate Linear Model',
      expression: `y(${targetX}) = ${round(p0.y, 2)} + (${round(slope, 4)}) × (${targetX} - ${p0.x})`,
      value: `y(${targetX}) = ${round(estimate, 4)}`,
    },
  ];

  return { estimate, steps };
}

/**
 * Natural Cubic Spline Interpolation
 * Solves tridiagonal system for second derivatives M_0 = M_{n-1} = 0.
 * Falls back cleanly to linear if n === 2 (since natural cubic spline on 2 points is exact linear).
 */
export function evaluateCubicSpline(points: InterpolationPoint[], targetX: number): {
  estimate: number;
  steps: InterpolationStep[];
} {
  const n = points.length;
  if (n === 2) {
    const linearRes = evaluateLinear(points, targetX);
    return {
      estimate: linearRes.estimate,
      steps: [
        {
          stepNumber: 1,
          title: 'Two-Point Boundary Condition (M₀ = M₁ = 0)',
          expression: 'With 2 knots, a natural cubic spline reduces identically to a linear segment.',
          value: `S(${targetX}) = ${round(linearRes.estimate, 4)}`,
        },
        ...linearRes.steps.map((s, i) => ({ ...s, stepNumber: i + 2 })),
      ],
    };
  }

  const h: number[] = [];
  for (let i = 0; i < n - 1; i++) {
    h.push(points[i + 1].x - points[i].x);
  }

  // Tridiagonal system for interior second derivatives M_1 ... M_{n-2}
  const mCount = n - 2;
  const a = Array(mCount).fill(0);
  const b = Array(mCount).fill(0);
  const c = Array(mCount).fill(0);
  const rhs = Array(mCount).fill(0);

  for (let i = 0; i < mCount; i++) {
    const knot = i + 1;
    a[i] = h[knot - 1];
    b[i] = 2 * (h[knot - 1] + h[knot]);
    c[i] = h[knot];
    rhs[i] =
      6 *
      ((points[knot + 1].y - points[knot].y) / h[knot] -
        (points[knot].y - points[knot - 1].y) / h[knot - 1]);
  }

  // Thomas algorithm (forward sweep)
  for (let i = 1; i < mCount; i++) {
    const factor = a[i] / b[i - 1];
    b[i] -= factor * c[i - 1];
    rhs[i] -= factor * rhs[i - 1];
  }

  const M = Array(n).fill(0);
  M[mCount] = rhs[mCount - 1] / b[mCount - 1];
  for (let i = mCount - 2; i >= 0; i--) {
    M[i + 1] = (rhs[i] - c[i] * M[i + 2]) / b[i];
  }

  // Locate interval i
  let idx = 0;
  if (targetX <= points[0].x) {
    idx = 0;
  } else if (targetX >= points[n - 1].x) {
    idx = n - 2;
  } else {
    for (let i = 0; i < n - 1; i++) {
      if (targetX >= points[i].x && targetX <= points[i + 1].x) {
        idx = i;
        break;
      }
    }
  }

  const hi = h[idx];
  const dxRight = points[idx + 1].x - targetX;
  const dxLeft = targetX - points[idx].x;

  const term1 = (M[idx] * Math.pow(dxRight, 3)) / (6 * hi);
  const term2 = (M[idx + 1] * Math.pow(dxLeft, 3)) / (6 * hi);
  const term3 = ((points[idx].y / hi) - (M[idx] * hi) / 6) * dxRight;
  const term4 = ((points[idx + 1].y / hi) - (M[idx + 1] * hi) / 6) * dxLeft;

  const estimate = term1 + term2 + term3 + term4;

  const steps: InterpolationStep[] = [
    {
      stepNumber: 1,
      title: 'Solve Tridiagonal Curvature Vector M',
      expression: `Natural boundaries M₀ = 0, M${n - 1} = 0 · Vector M = [${M.map((v) => round(v, 3)).join(', ')}]`,
      value: `Active curvatures: M${idx} = ${round(M[idx], 4)}, M${idx + 1} = ${round(M[idx + 1], 4)}`,
    },
    {
      stepNumber: 2,
      title: `Select Spline Segment S${idx}(x) on [${points[idx].x}, ${points[idx + 1].x}]`,
      expression: `h${idx} = ${hi}, (x${idx + 1} - x) = ${round(dxRight, 3)}, (x - x${idx}) = ${round(dxLeft, 3)}`,
      value: `Cubic terms: ${round(term1, 4)} + ${round(term2, 4)}`,
    },
    {
      stepNumber: 3,
      title: 'Combine Linear & Cubic Spline Terms',
      expression: `S${idx}(${targetX}) = ${round(term1, 3)} + ${round(term2, 3)} + ${round(term3, 3)} + ${round(term4, 3)}`,
      value: `S(${targetX}) = ${round(estimate, 4)}`,
    },
  ];

  return { estimate, steps };
}

function evaluateMethodPoint(
  method: InterpolationMethod,
  points: InterpolationPoint[],
  x: number
): number {
  switch (method) {
    case 'lagrange':
      return evaluateLagrange(points, x).estimate;
    case 'newton':
      return evaluateNewtonDividedDifference(points, x).estimate;
    case 'spline':
      return evaluateCubicSpline(points, x).estimate;
    case 'linear':
      return evaluateLinear(points, x).estimate;
  }
}

export const METHOD_METADATA: Record<
  InterpolationMethod,
  {
    name: string;
    shortName: string;
    formulaTitle: string;
    formulaEquation: string;
    formulaDescription: string;
  }
> = {
  lagrange: {
    name: 'Lagrange Polynomial Interpolation',
    shortName: 'Lagrange',
    formulaTitle: 'Lagrange Basis Polynomial Form',
    formulaEquation: 'P(x) = Σᵢ yᵢ · ∏_{j ≠ i} (x - xⱼ) / (xᵢ - xⱼ)',
    formulaDescription:
      'Constructs a unique degree (n - 1) polynomial passing exactly through all known assessment scores without solving linear systems.',
  },
  newton: {
    name: "Newton's Divided Difference",
    shortName: 'Newton DD',
    formulaTitle: 'Newton Progressive Divided Difference Form',
    formulaEquation: 'P(x) = f[x₀] + f[x₀,x₁](x - x₀) + f[x₀,x₁,x₂](x - x₀)(x - x₁) + …',
    formulaDescription:
      'Builds an incremental triangular difference table so higher-order curvature adjustments are transparent at every assessment step.',
  },
  spline: {
    name: 'Natural Cubic Spline',
    shortName: 'Cubic Spline',
    formulaTitle: 'Piecewise C² Natural Cubic Spline',
    formulaEquation: 'Sᵢ(x) = [Mᵢ(xᵢ₊₁ - x)³ + Mᵢ₊₁(x - xᵢ)³] / (6hᵢ) + C₁(xᵢ₊₁ - x) + C₂(x - xᵢ)',
    formulaDescription:
      'Fits smooth piecewise cubic polynomials with continuous first and second derivatives, minimizing oscillation across large assessment sets.',
  },
  linear: {
    name: 'Piecewise Linear Interpolation',
    shortName: 'Linear',
    formulaTitle: 'Linear Bracket Interpolation',
    formulaEquation: 'y(x) = y₀ + [(y₁ - y₀) / (x₁ - x₀)] · (x - x₀)',
    formulaDescription:
      'Connects adjacent assessments with direct line segments, offering stable, overshoot-free estimates between known evaluations.',
  },
};

export function runInterpolation(
  rawPoints: InterpolationPoint[],
  targetX: number,
  method: InterpolationMethod,
  maxScore = 100
): { ok: true; result: InterpolationResult } | { ok: false; error: string } {
  const validation = validateInterpolationInputs(rawPoints, targetX);
  if (!validation.valid) {
    return { ok: false, error: validation.error || 'Invalid interpolation input.' };
  }

  const points = validation.sortedPoints;
  const minX = points[0].x;
  const maxX = points[points.length - 1].x;
  const isExtrapolation = targetX < minX || targetX > maxX;

  let rawEstimate = 0;
  let steps: InterpolationStep[] = [];
  let dividedDifferenceTable: DividedDifferenceRow[] | undefined;

  if (method === 'lagrange') {
    const res = evaluateLagrange(points, targetX);
    rawEstimate = res.estimate;
    steps = res.steps;
  } else if (method === 'newton') {
    const res = evaluateNewtonDividedDifference(points, targetX);
    rawEstimate = res.estimate;
    steps = res.steps;
    dividedDifferenceTable = res.table;
  } else if (method === 'spline') {
    const res = evaluateCubicSpline(points, targetX);
    rawEstimate = res.estimate;
    steps = res.steps;
  } else {
    const res = evaluateLinear(points, targetX);
    rawEstimate = res.estimate;
    steps = res.steps;
  }

  const clampedEstimate = Math.min(maxScore, Math.max(0, rawEstimate));
  const isClamped = Math.abs(clampedEstimate - rawEstimate) > 1e-6;

  // Build curve points for all integer assessment indices across the span
  const spanStart = Math.min(minX, Math.floor(targetX));
  const spanEnd = Math.max(maxX, Math.ceil(targetX));
  const pointByX = new Map<number, number>();
  for (const pt of points) {
    pointByX.set(pt.x, pt.y);
  }

  const curveSamples: Array<{ x: number; estimated: number; actual: number | null }> = [];
  for (let x = spanStart; x <= spanEnd; x++) {
    const est = evaluateMethodPoint(method, points, x);
    curveSamples.push({
      x,
      estimated: round(Math.min(maxScore, Math.max(0, est)), 2),
      actual: pointByX.has(x) ? pointByX.get(x)! : null,
    });
  }

  const meta = METHOD_METADATA[method];
  const confidenceLabel = isExtrapolation
    ? 'Extrapolation (outside known assessment span)'
    : points.length >= 4
      ? 'High-order bounded interpolation'
      : 'Bounded interval interpolation';

  return {
    ok: true,
    result: {
      method,
      targetX,
      rawEstimate: round(rawEstimate, 2),
      clampedEstimate: round(clampedEstimate, 2),
      isClamped,
      isExtrapolation,
      confidenceLabel,
      formulaTitle: meta.formulaTitle,
      formulaEquation: meta.formulaEquation,
      formulaDescription: meta.formulaDescription,
      steps,
      dividedDifferenceTable,
      knownPoints: points,
      curveSamples,
    },
  };
}
