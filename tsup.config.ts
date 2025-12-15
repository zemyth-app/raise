import { defineConfig } from 'tsup';

export default defineConfig({
  entry: [
    'src/index.ts',
    'src/accounts/index.ts',
    'src/instructions/index.ts',
    'src/pdas/index.ts',
    'src/constants/index.ts',
    'src/errors/index.ts',
    'src/types/index.ts',
  ],
  format: ['cjs', 'esm'],
  dts: true,
  clean: true,
  sourcemap: true,
  splitting: false,
  treeshake: true,
  outDir: 'dist',
  external: [
    '@coral-xyz/anchor',
    '@solana/web3.js',
    '@solana/spl-token',
  ],
});
