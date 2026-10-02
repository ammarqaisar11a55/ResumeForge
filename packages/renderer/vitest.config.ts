import { defineProject } from 'vitest/config';

export default defineProject({
  test: {
    name: 'renderer',
    environment: 'jsdom',
    include: ['src/**/*.test.{ts,tsx}'],
  },
});
