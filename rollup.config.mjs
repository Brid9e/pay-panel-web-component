import typescript from '@rollup/plugin-typescript';
import terser from '@rollup/plugin-terser';

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
    }),
    terser({
      compress: false, // 禁用压缩，只进行混淆
      mangle: {
        toplevel: true, // 混淆顶级作用域变量名
        properties: {
          regex: /^_/ // 混淆以下划线开头的属性名
        }
      },
      format: {
        comments: false, // 移除注释
        beautify: true, // 美化输出，保持代码格式
        indent_level: 2, // 缩进级别
        preserve_annotations: false // 不保留注释
      }
    })
  ]
};
