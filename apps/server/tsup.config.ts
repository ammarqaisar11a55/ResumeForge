import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts', 'src/db/cli.ts'],
  format: ['esm'],
  platform: 'node',
  target: 'node20',
  outDir: 'dist',
  clean: true,
  sourcemap: true,
  // Workspace packages ship TypeScript source, so bundle them in.
  noExternal: [/^@resumeforge\//],
});
