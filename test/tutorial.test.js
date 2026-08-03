import { describe, expect, it } from 'vitest';
import { SCENES, SCENES_EN } from '../src/content/tutorial.js';
import { compile } from '../src/tutorial.js';

describe('tutorial scenes', () => {
  it('compile into a playable board with a start cell and task targets', () => {
    for (const scene of [...SCENES, ...SCENES_EN]) {
      const { level, targets } = compile(scene);
      const room = level.rooms[0];
      expect(room.playerStart).toBeTruthy();
      expect(room.W).toBeGreaterThan(0);
      expect(room.H).toBeGreaterThan(0);
      if (scene.allow?.move === 'targets') expect(targets.length).toBeGreaterThan(0);
    }
  });
});
