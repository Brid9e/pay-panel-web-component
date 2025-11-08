# pypjs

一个简易好用、不受框架限制的支付面板组件。

## 使用方法

### 1. 安装

```bash
npm install pypjs
# 或
pnpm add pypjs
# 或
yarn add pypjs
```

### 2. 引入组件

#### 在 Vue/React/现代项目中使用（ES Module）

```javascript
import pypjs from 'pypjs'

// 使用组件
pypjs.open(99.99)
pypjs.setConfig({ headerTitle: '支付' })
```

#### 在浏览器中使用（Script 标签）

```html
<script src="./dist/index.js"></script>
```

引入后会自动初始化，全局对象 `pypjs` 可直接使用。

### 3. 打开支付面板

```javascript
// 基础打开
pypjs.open();

// 带金额打开
pypjs.open(99.99);
```

### 4. 关闭支付面板

```javascript
pypjs.close();
```

### 5. 设置金额

```javascript
pypjs.setAmount(199.00);
```

### 6. 自定义支付方式

#### 基础用法

```javascript
// 设置支付方式列表和字段映射
pypjs.setPaymentMethods(
  [
    { id: 1, name: '微信支付', desc: '推荐使用', icon: '💳' },
    { id: 2, name: '支付宝', desc: '安全便捷', icon: '💰' },
    { id: 3, name: 'Apple Pay', desc: '快速支付', icon: '🍎' }
  ],
  {
    titleField: 'name',      // 标题字段名
    subtitleField: 'desc',   // 副标题字段名
    iconField: 'icon',       // 图标字段名
    valueField: 'id'         // 值字段名
  }
);
```

#### 二级分组

支持二级分组结构，点击分组标题可展开/折叠子项：

```javascript
pypjs.setPaymentMethods(
  [
    {
      name: '在线支付',
      children: [
        { id: 1, name: '微信支付', desc: '推荐使用', icon: '💳' },
        { id: 2, name: '支付宝', desc: '安全便捷', icon: '💰' },
        { id: 3, name: 'Apple Pay', desc: '快速支付', icon: '🍎' }
      ]
    },
    {
      name: '银行卡支付',
      children: [
        { id: 4, name: '储蓄卡', desc: '支持各大银行', icon: '💵' },
        { id: 5, name: '信用卡', desc: '支持各大银行', icon: '💳' }
      ]
    }
  ],
  {
    titleField: 'name',
    subtitleField: 'desc',
    iconField: 'icon',
    valueField: 'id'
  }
);
```

#### 图标类型

支持三种图标类型：图片URL、字符串（emoji/字符）或默认SVG图标。

### 7. 统一配置

```javascript
// 使用 setConfig 方法统一配置所有选项
pypjs.setConfig({
  allowSwipeToClose: false,        // 是否允许下拉关闭（false时隐藏拖动滑块）
  closeOnOverlayClick: false,      // 点击遮罩层是否关闭
  enablePassword: true,            // 是否启用密码输入
  passwordLength: 6,               // 密码位数（默认6位）
  headerTitle: '确认付款',         // 标题文本（可选，默认使用i18n）
  amountLabel: '付款金额',         // 金额标签文本（可选，默认使用i18n）
  iconDisplay: 'always',           // 图标显示模式：'always' | 'never' | 'auto'（默认'always'）
  closeThreshold: 150,             // 关闭距离阈值（像素）
  closeThresholdPercent: 0.4,      // 关闭距离阈值（百分比，0-1之间）
  velocityThreshold: 0.8,          // 速度阈值（像素/毫秒）
  allowConfirmWithoutMethods: true, // 当没有支付方式时是否允许确认（默认true）
  hidePaymentMethods: false,       // 是否隐藏支付方式区域（默认false）
  amountAlign: 'left',             // 金额对齐方式：'left' | 'center' | 'right'（默认'left'）
  amountFont: 'Arial, sans-serif', // 金额字体（可选）
  textFont: 'Arial, sans-serif',   // 其他文本字体（可选）
  language: 'zh',                  // 语言设置：'zh' | 'en' | 'ja' | 'ru'（默认'en'）
  i18n: {                          // 自定义多语言文本（部分覆盖，可选）
    headerTitle: '自定义标题',
    confirmButton: '确认'
  },
  theme: {                         // 主题配置
    primaryColor: '#ff4d4f',
    primaryHoverColor: '#ff7875',
    overlayColor: 'rgba(0, 0, 0, 0.6)',
    panelBgLight: '#ffffff',
    panelBgDark: '#2d2d2d',
    textPrimaryLight: '#24292f',
    textPrimaryDark: '#e0e0e0'
  }
});
```

**注意**：`setConfig` 中未传入的值会恢复为默认值。

### 8. 单独设置配置项

```javascript
pypjs.setHeaderTitle('确认付款');
pypjs.setAmountLabel('付款金额');
pypjs.setEnablePassword(true);
pypjs.setPasswordLength(6);
pypjs.setLanguage('zh');
pypjs.setTheme({ primaryColor: '#ff4d4f' });
pypjs.resetConfig();
// ... 更多方法
```

### 9. 监听事件

```javascript
// 监听支付确认事件
pypjs.on('payment-confirm', (e) => {
  const { method, amount, methodData } = e.detail;
  console.log('支付方式:', method);
  console.log('支付金额:', amount);
  console.log('完整数据:', methodData);
});

// 监听关闭事件
pypjs.on('payment-close', () => {
  console.log('支付面板已关闭');
});

// 移除事件监听
pypjs.off('payment-confirm', handler);
```

## 特性

### 图标显示

图标显示模式：`always`（默认）、`never`、`auto`。支持图片URL、字符串（emoji/字符）或默认SVG图标。

### 多语言支持

支持中文（zh）、英文（en）、日文（ja）、俄文（ru）。可通过 `i18n` 配置部分覆盖默认文本。

```javascript
pypjs.setConfig({
  language: 'zh',
  i18n: {
    headerTitle: '自定义标题',
    confirmButton: '确认支付'
  }
});
```

### 金额对齐和字体

支持自定义金额对齐方式（`left` | `center` | `right`）和金额、文本字体。

### 支付方式控制

- `allowConfirmWithoutMethods`：控制无支付方式时是否允许确认（默认 `true`）
- `hidePaymentMethods`：隐藏支付方式区域，只显示金额和确认按钮/密码输入（默认 `false`）

### 主题

自动检测系统主题设置，支持亮色和暗色主题，可自定义颜色。背景支持渐变。

```javascript
pypjs.setTheme({
  primaryColor: '#ff4d4f',
  primaryHoverColor: '#ff7875',
  panelBgLight: 'linear-gradient(135deg, #fff5f5 0%, #ffe8e8 100%)',
  panelBgDark: '#1a0f0f'
});
```

## API 参考

### 全局方法

#### 基础方法

- `pypjs.open(amount?: number)` - 打开支付面板，可选传入金额
- `pypjs.close()` - 关闭支付面板
- `pypjs.setAmount(amount: number)` - 设置支付金额

#### 支付方式

- `pypjs.setPaymentMethods(methods?, fieldMapping?)` - 设置支付方式列表
  - `methods`: 支付方式数组（可选），如果不传或传空数组，会恢复为默认支付方式
  - `fieldMapping`: 可选，字段映射配置
    - `titleField`: 标题字段名（默认 'title' 或 'name'）
    - `subtitleField`: 副标题字段名（默认 'subtitle' 或 'desc'）
    - `iconField`: 图标字段名（默认 'icon'）
    - `valueField`: 值字段名（默认 'value' 或 'id'）
- `pypjs.getSelectedMethod()` - 获取当前选中的支付方式

#### 统一配置

- `pypjs.setConfig(config: pypjsConfig)` - 统一配置所有选项
  - `allowSwipeToClose?: boolean` - 是否允许下拉关闭（默认 true，false 时隐藏拖动滑块）
  - `closeOnOverlayClick?: boolean` - 点击遮罩层是否关闭（默认 true）
  - `enablePassword?: boolean` - 是否启用密码输入（默认 false）
  - `passwordLength?: number` - 密码位数（默认 6，范围 4-12）
  - `headerTitle?: string` - 标题文本（可选，默认使用i18n）
  - `amountLabel?: string` - 金额标签文本（可选，默认使用i18n）
  - `iconDisplay?: 'always' | 'never' | 'auto'` - 图标显示模式（默认 "always"）
    - `always`: 总是显示图标区域
    - `never`: 总是不显示图标区域
    - `auto`: 有 icon 值时显示，没有则不显示
  - `closeThreshold?: number` - 关闭距离阈值（像素，默认 100）
  - `closeThresholdPercent?: number` - 关闭距离阈值（百分比，默认 0.3）
  - `velocityThreshold?: number` - 速度阈值（像素/毫秒，默认 0.5）
  - `allowConfirmWithoutMethods?: boolean` - 当没有支付方式时是否允许确认（默认 true）
  - `hidePaymentMethods?: boolean` - 是否隐藏支付方式区域（默认 false）
  - `amountAlign?: 'left' | 'center' | 'right'` - 金额对齐方式（默认 'left'）
  - `amountFont?: string` - 金额字体（可选，如 "Arial, sans-serif"）
  - `textFont?: string` - 其他文本字体（可选，如 "Arial, sans-serif"）
  - `language?: 'zh' | 'en' | 'ja' | 'ru'` - 语言设置（默认 'en'）
  - `i18n?: Partial<I18nTexts>` - 自定义多语言文本（部分覆盖，可选）
    - `headerTitle?: string` - 标题文本
    - `amountLabel?: string` - 金额标签文本
    - `paymentMethodsTitle?: string` - 支付方式标题文本
    - `passwordLabel?: string` - 密码标签文本
    - `cancelButton?: string` - 取消按钮文本
    - `confirmButton?: string` - 确认按钮文本
    - `emptyStateText?: string` - 空状态文本
    - `closeAriaLabel?: string` - 关闭按钮无障碍标签
  - `theme?: ThemeConfig` - 主题配置对象
    - `primaryColor?: string` - 主色调（默认 "#238636"）
    - `primaryHoverColor?: string` - 主色调悬停色（默认 "#2ea043"）
    - `overlayColor?: string` - 遮罩层颜色（默认 "rgba(0, 0, 0, 0.5)"）
    - `panelBgLight?: string` - 浅色模式下面板背景色（默认 "#ffffff"，支持渐变）
    - `panelBgDark?: string` - 深色模式下面板背景色（默认 "#2d2d2d"，支持渐变）
    - `textPrimaryLight?: string` - 浅色模式下主文本色（默认 "#24292f"）
    - `textPrimaryDark?: string` - 深色模式下主文本色（默认 "#e0e0e0"）
    - `textSecondaryLight?: string` - 浅色模式下次要文本色（默认 "#57606a"）
    - `textSecondaryDark?: string` - 深色模式下次要文本色（默认 "#999999"）

  **注意**：如果某个配置项没有传入（undefined），会自动恢复为默认值。

- `pypjs.resetConfig()` - 重置所有配置为默认值

#### 单独配置方法

- `pypjs.setHeaderTitle(title?: string)` - 设置标题文本（可选，不传则使用i18n）
- `pypjs.setAmountLabel(label?: string)` - 设置金额标签文本（可选，不传则使用i18n）
- `pypjs.setCloseThreshold(threshold: number)` - 设置关闭距离阈值（像素）
- `pypjs.setCloseThresholdPercent(percent: number)` - 设置关闭距离阈值（百分比，0-1之间）
- `pypjs.setVelocityThreshold(threshold: number)` - 设置速度阈值（像素/毫秒）
- `pypjs.setCloseOnOverlayClick(close: boolean)` - 设置点击遮罩层是否关闭
- `pypjs.setEnablePassword(enable: boolean)` - 设置是否启用密码输入
- `pypjs.setPasswordLength(length: number)` - 设置密码位数（4-12位）
- `pypjs.setAllowConfirmWithoutMethods(allow: boolean)` - 设置无支付方式时是否允许确认
- `pypjs.setHidePaymentMethods(hide: boolean)` - 设置是否隐藏支付方式区域
- `pypjs.setAmountAlign(align: 'left' | 'center' | 'right')` - 设置金额对齐方式
- `pypjs.setAmountFont(font: string)` - 设置金额字体
- `pypjs.setTextFont(font: string)` - 设置文本字体
- `pypjs.setLanguage(lang: 'zh' | 'en' | 'ja' | 'ru')` - 设置语言
- `pypjs.setI18n(i18n: Partial<I18nTexts>)` - 设置自定义多语言文本（部分覆盖）
- `pypjs.setTheme(theme: ThemeConfig)` - 设置主题配置
- `pypjs.getTheme()` - 获取当前主题配置

#### 事件

- `pypjs.on(event, handler)` - 监听事件（自动去重，同一个 handler 只会添加一次）
- `pypjs.off(event, handler)` - 移除事件监听

### 事件

- `payment-confirm` - 支付确认时触发
  - `method`: 选择的支付方式的值
  - `methodData`: 完整的支付方式对象
  - `amount`: 支付金额
  - `password`: 密码（如果启用了密码输入）
- `payment-close` - 支付面板关闭时触发

## 浏览器支持

- Chrome/Edge (最新版本)
- Firefox (最新版本)
- Safari (最新版本)
- 移动端浏览器

## 许可证

MIT
