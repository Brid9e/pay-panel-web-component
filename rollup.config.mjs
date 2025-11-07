import typescript from '@rollup/plugin-typescript';

export default {
  input: 'src/index.ts',
  output: {
    file: 'dist/payment-panel.js',
    format: 'iife',
    name: 'PaymentPanelModule',
    sourcemap: false
  },
  plugins: [
    typescript({
      tsconfig: './tsconfig.json',
      declaration: false
    })
  ]
};
