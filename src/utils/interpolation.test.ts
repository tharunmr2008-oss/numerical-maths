import test from 'node:test';
import assert from 'node:assert/strict';
import { runInterpolation } from './interpolation';
import { InterpolationPoint } from '../types/academic';

const quadraticPoints: InterpolationPoint[] = [
  { x: 1, y: 1, label: 'A1' },
  { x: 2, y: 4, label: 'A2' },
  { x: 3, y: 9, label: 'A3' },
  { x: 5, y: 25, label: 'A5' },
];

test('Lagrange recovers exact quadratic polynomial f(x)=x^2 at missing x=4', () => {
  const res = runInterpolation(quadraticPoints, 4, 'lagrange', 100);
  assert.equal(res.ok, true);
  if (res.ok) {
    assert.equal(res.result.rawEstimate, 16);
    assert.equal(res.result.clampedEstimate, 16);
    assert.equal(res.result.isExtrapolation, false);
    assert.ok(res.result.steps.length === quadraticPoints.length + 1);
  }
});

test('Newton Divided Difference matches Lagrange identically for same polynomial', () => {
  const lag = runInterpolation(quadraticPoints, 4, 'lagrange', 100);
  const newt = runInterpolation(quadraticPoints, 4, 'newton', 100);
  assert.equal(lag.ok, true);
  assert.equal(newt.ok, true);
  if (lag.ok && newt.ok) {
    assert.equal(newt.result.rawEstimate, lag.result.rawEstimate);
    assert.ok(newt.result.dividedDifferenceTable);
    assert.equal(newt.result.dividedDifferenceTable?.length, 4);
    // 2nd divided difference for x^2 is constant 1, 3rd is 0
    assert.equal(newt.result.dividedDifferenceTable?.[0].differences[2], 1);
    assert.equal(newt.result.dividedDifferenceTable?.[0].differences[3], 0);
  }
});

test('Piecewise Linear interpolates midpoint between x=3 (y=9) and x=5 (y=25) as 17', () => {
  const res = runInterpolation(quadraticPoints, 4, 'linear', 100);
  assert.equal(res.ok, true);
  if (res.ok) {
    assert.equal(res.result.rawEstimate, 17);
  }
});

test('Natural Cubic Spline produces smooth value passing through all known knots', () => {
  const res = runInterpolation(quadraticPoints, 4, 'spline', 100);
  assert.equal(res.ok, true);
  if (res.ok) {
    assert.ok(res.result.rawEstimate > 14 && res.result.rawEstimate < 18);
    const knot2 = res.result.curveSamples.find((s) => s.x === 2);
    assert.equal(knot2?.estimated, 4);
  }
});

test('Validation rejects fewer than 2 known points and duplicate x indices', () => {
  const tooFew = runInterpolation([{ x: 1, y: 80, label: 'A1' }], 2, 'lagrange');
  assert.equal(tooFew.ok, false);

  const dupX = runInterpolation(
    [
      { x: 2, y: 70, label: 'A2' },
      { x: 2, y: 80, label: 'A2b' },
    ],
    3,
    'newton'
  );
  assert.equal(dupX.ok, false);
});

test('Clamping flags estimates exceeding 100 or below 0 while preserving rawEstimate', () => {
  const steep: InterpolationPoint[] = [
    { x: 1, y: 60, label: 'A1' },
    { x: 2, y: 90, label: 'A2' },
  ];
  const res = runInterpolation(steep, 3, 'linear', 100);
  assert.equal(res.ok, true);
  if (res.ok) {
    assert.equal(res.result.rawEstimate, 120);
    assert.equal(res.result.clampedEstimate, 100);
    assert.equal(res.result.isClamped, true);
    assert.equal(res.result.isExtrapolation, true);
  }
});
