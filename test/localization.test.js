import { describe, expect, it } from 'vitest';
import en from '../src/lang/en.json';
import ru from '../src/lang/ru.json';

describe('localization bundles', () => {
  it('have the same non-empty translation keys', () => {
    expect(Object.keys(en).sort()).toEqual(Object.keys(ru).sort());
    for (const [key, value] of Object.entries(en)) {
      expect(value.trim(), key).not.toBe('');
      expect(ru[key].trim(), key).not.toBe('');
    }
  });
});
