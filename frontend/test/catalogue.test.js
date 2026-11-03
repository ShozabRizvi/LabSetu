import test from 'node:test';
import assert from 'node:assert/strict';
import { catalogueParameters, priceInPaise } from '../src/utils/catalogueUtils.js';

test('staff prices preserve entered decimal paise and reject ambiguous or invalid amounts', () => {
  assert.equal(priceInPaise('125.50'), 12550);
  assert.equal(priceInPaise('0.01'), 1);
  assert.equal(priceInPaise('10000000.00'), 1000000000);
  for (const value of ['', '-1', '1.001', '1e2', 'NaN', '0', '10000000.01']) assert.throws(() => priceInPaise(value));
});

test('staff clinical parameters preserve approved text and never infer reference intervals', () => {
  assert.deepEqual(catalogueParameters(''), []);
  assert.deepEqual(catalogueParameters('Hemoglobin | g/dL\nFinding | | Laboratory supplied interval'), [
    { name: 'Hemoglobin', unit: 'g/dL' }, { name: 'Finding', unit: '', referenceRange: 'Laboratory supplied interval' }
  ]);
  assert.throws(() => catalogueParameters('Missing unit separator'));
  assert.throws(() => catalogueParameters('Name | unit | interval | extra'));
});
