# pypjs

一个简单易用的支付面板。

## 使用方法

### 1. 引入组件

```html
<script src="./dist/index.js"></script>
```

引入后会自动初始化，全局对象 `pypjs` 可直接使用。

### 2. 打开支付面板

```javascript
// 基础打开
pypjs.open();

// 带金额打开
pypjs.open(99.99);
```

### 3. 关闭支付面板

```javascript
pypjs.close();
```

### 4. 设置金额

```javascript
pypjs.setAmount(199.00);
```

### 5. 自定义支付方式

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

支持三种图标类型：

1. **图片URL**：自动识别以 `http://`、`https://` 开头或包含图片扩展名的字符串
   ```javascript
   { icon: 'https://example.com/icon.png' }
   ```

2. **字符串**：显示第一个字符（emoji 会完整显示）
   ```javascript
   { icon: '💳' }  // emoji
   { icon: '支' }   // 单个字符
   { icon: '支付宝' } // 显示第一个字符"支"
   ```

3. **无图标**：显示默认 SVG 图标
   ```javascript
   { name: '银行卡' } // 没有 icon 字段
   ```

### 6. 统一配置

```javascript
// 使用 setConfig 方法统一配置所有选项
pypjs.setConfig({
  allowSwipeToClose: false,        // 是否允许下拉关闭（false时隐藏拖动滑块）
  closeOnOverlayClick: false,      // 点击遮罩层是否关闭
  enablePassword: true,            // 是否启用密码输入
  passwordLength: 6,               // 密码位数（默认6位）
  headerTitle: '确认付款',         // 标题文本（默认"支付"）
  amountLabel: '付款金额',         // 金额标签文本（默认"支付金额"）
  iconDisplay: 'always',           // 图标显示模式：'always' | 'never' | 'auto'（默认'always'）
  closeThreshold: 150,             // 关闭距离阈值（像素）
  closeThresholdPercent: 0.4,      // 关闭距离阈值（百分比，0-1之间）
  velocityThreshold: 0.8,          // 速度阈值（像素/毫秒）
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

**注意**：`setConfig` 方法中，如果某个配置项没有传入（undefined），会自动恢复为默认值。这样可以防止团队成员之间的配置互相影响。

### 7. 单独设置配置项

```javascript
// 设置标题
pypjs.setHeaderTitle('确认付款');

// 设置金额标签
pypjs.setAmountLabel('付款金额');

// 设置关闭阈值
pypjs.setCloseThreshold(150); // 设置距离阈值为150px
pypjs.setCloseThresholdPercent(0.4); // 设置距离阈值为面板高度的40%
pypjs.setVelocityThreshold(0.8); // 设置速度阈值为0.8px/ms

// 设置点击遮罩层是否关闭
pypjs.setCloseOnOverlayClick(false);

// 设置密码输入
pypjs.setEnablePassword(true);
pypjs.setPasswordLength(6); // 设置密码位数（默认6位）

// 设置主题
pypjs.setTheme({
  primaryColor: '#ff4d4f',
  primaryHoverColor: '#ff7875',
  panelBgLight: 'linear-gradient(135deg, #fff5f5 0%, #ffe8e8 100%)',
  panelBgDark: '#1a0f0f'
});

// 重置为默认配置
pypjs.resetConfig();
```

### 8. 监听事件

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

## API

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
  - `headerTitle?: string` - 标题文本（默认 "支付"）
  - `amountLabel?: string` - 金额标签文本（默认 "支付金额"）
  - `iconDisplay?: 'always' | 'never' | 'auto'` - 图标显示模式（默认 "always"）
    - `always`: 总是显示图标区域
    - `never`: 总是不显示图标区域
    - `auto`: 有 icon 值时显示，没有则不显示
  - `closeThreshold?: number` - 关闭距离阈值（像素，默认 100）
  - `closeThresholdPercent?: number` - 关闭距离阈值（百分比，默认 0.3）
  - `velocityThreshold?: number` - 速度阈值（像素/毫秒，默认 0.5）
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

- `pypjs.setHeaderTitle(title: string)` - 设置标题文本
- `pypjs.setAmountLabel(label: string)` - 设置金额标签文本
- `pypjs.setCloseThreshold(threshold: number)` - 设置关闭距离阈值（像素）
- `pypjs.setCloseThresholdPercent(percent: number)` - 设置关闭距离阈值（百分比，0-1之间）
- `pypjs.setVelocityThreshold(threshold: number)` - 设置速度阈值（像素/毫秒）
- `pypjs.setCloseOnOverlayClick(close: boolean)` - 设置点击遮罩层是否关闭
- `pypjs.setEnablePassword(enable: boolean)` - 设置是否启用密码输入
- `pypjs.setPasswordLength(length: number)` - 设置密码位数（4-12位）
- `pypjs.setTheme(theme: ThemeConfig)` - 设置主题配置
- `pypjs.getTheme()` - 获取当前主题配置

#### 事件

- `pypjs.on(event, handler)` - 监听事件（自动去重，同一个 handler 只会添加一次）
- `pypjs.off(event, handler)` - 移除事件监听

### 拖拽关闭

组件支持通过向下拖拽来关闭面板：
- 可以从拖拽手柄（顶部横条）或标题栏区域开始拖拽
- 拖拽距离超过阈值或拖拽速度超过速度阈值时，松开手指会自动关闭
- 未达到阈值时，面板会回弹到原位置
- 内容区域可以正常滚动，不会触发拖拽
- 可以通过 `allowSwipeToClose: false` 禁用下拉关闭功能，此时拖动滑块会自动隐藏

### 密码输入

启用密码输入功能后：
- 会自动隐藏取消/确认按钮
- 显示密码输入框和软键盘
- 输入完成后自动触发支付确认事件
- 密码位数可配置（默认6位，范围4-12位）
- 密码会包含在 `payment-confirm` 事件的 `detail.password` 中

### 事件

- `payment-confirm` - 支付确认时触发，事件详情包含：
  - `method`: 选择的支付方式的值（根据 valueField 配置）
  - `methodData`: 完整的支付方式对象
  - `amount`: 支付金额
  - `password`: 密码（如果启用了密码输入）
- `payment-close` - 支付面板关闭时触发

## 图标显示

组件支持灵活的图标显示配置：

### 图标显示模式

- **always**（默认）：总是显示图标区域，即使没有 icon 值也会显示默认 SVG 图标
- **never**：总是不显示图标区域
- **auto**：有 icon 值时显示，没有 icon 值或加载失败时不显示

### 图标类型

1. **图片URL**：支持 `http://`、`https://` 开头的 URL 或包含图片扩展名的字符串
   - 图片会以 `object-fit: cover` 的方式填充 28x28px 的正方形区域
   - 加载失败时自动显示默认 SVG 图标

2. **字符串**：
   - Emoji（长度 ≤ 2）：完整显示
   - 普通字符串：显示第一个字符
   - 使用 `Array.from()` 正确处理多字节字符（如 emoji）

3. **默认图标**：没有 icon 值或图片加载失败时显示默认 SVG 图标

### 示例

```javascript
// 设置图标显示模式
pypjs.setConfig({
  iconDisplay: 'auto' // 有icon时显示，没有时不显示
});

// 使用图片URL
pypjs.setPaymentMethods([
  { id: 1, name: '微信支付', icon: 'https://example.com/wechat.png' },
  { id: 2, name: '支付宝', icon: 'https://i.alipayobjects.com/common/favicon/favicon.ico' }
]);

// 使用字符串
pypjs.setPaymentMethods([
  { id: 1, name: '微信支付', icon: '💳' },  // emoji
  { id: 2, name: '支付宝', icon: '支' }      // 单个字符
]);
```

## 主题

组件会自动检测系统主题设置，支持亮色主题和暗色主题。所有颜色通过 CSS 变量管理，可以轻松自定义。

### 主题配置

```javascript
// 使用 setTheme 方法设置主题
pypjs.setTheme({
  primaryColor: '#ff4d4f',                    // 主色调
  primaryHoverColor: '#ff7875',               // 主色调悬停色
  overlayColor: 'rgba(0, 0, 0, 0.6)',        // 遮罩层颜色
  panelBgLight: '#ffffff',                    // 浅色模式下面板背景色
  panelBgDark: '#1a0f0f',                     // 深色模式下面板背景色
  textPrimaryLight: '#24292f',                // 浅色模式下主文本色
  textPrimaryDark: '#e0e0e0',                 // 深色模式下主文本色
  textSecondaryLight: '#57606a',              // 浅色模式下次要文本色
  textSecondaryDark: '#999999'                // 深色模式下次要文本色
});

// 支持渐变背景
pypjs.setTheme({
  panelBgLight: 'linear-gradient(135deg, #fff5f5 0%, #ffe8e8 100%)',
  panelBgDark: 'linear-gradient(135deg, #1a0f0f 0%, #2d1a1a 100%)'
});

// 在 setConfig 中设置主题
pypjs.setConfig({
  theme: {
    primaryColor: '#ff4d4f',
    primaryHoverColor: '#ff7875'
  }
});
```

### 默认主题

- 浅色模式：GitHub 风格的配色方案
- 深色模式：灰色系配色方案，适配广泛审美

## 浏览器支持

- Chrome/Edge (最新版本)
- Firefox (最新版本)
- Safari (最新版本)
- 移动端浏览器

## 许可证

ISC
