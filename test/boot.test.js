import { describe, expect, it } from 'vitest';

describe('application boot', () => {
  it('loads the entry module and leaves an interactive loading screen', async () => {
    await import('../src/main.js');
    const loading = document.getElementById('loadingScreen');
    expect(loading).toBeTruthy();
    expect(loading.children.length).toBeGreaterThan(0);
  });
});
