# 支付面板 Web Component

移动端支付面板组件。

## 安装

```bash
pnpm install
```

## 开发

```bash
pnpm run dev
```

## 构建

```bash
pnpm run build
```

构建完成后，会在 `dist` 目录生成 `payment-panel.js` 文件。

## 使用方法

### 1. 引入组件

```html
<script src="./dist/payment-panel.js"></script>
```

引入后会自动初始化，全局对象 `PaymentPanel` 可直接使用。

### 2. 打开支付面板

```javascript
// 基础打开
PaymentPanel.open();

// 带金额打开
PaymentPanel.open(99.99);
```

### 3. 关闭支付面板

```javascript
PaymentPanel.close();
```

### 4. 设置金额

```javascript
PaymentPanel.setAmount(199.00);
```

### 5. 自定义支付方式

```javascript
// 设置支付方式列表和字段映射
PaymentPanel.setPaymentMethods(
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

### 6. 统一配置

```javascript
// 使用 setConfig 方法统一配置所有选项
PaymentPanel.setConfig({
  allowSwipeToClose: false,        // 是否允许下拉关闭（false时隐藏拖动滑块）
  closeOnOverlayClick: false,      // 点击遮罩层是否关闭
  enablePassword: true,            // 是否启用密码输入
  passwordLength: 6,               // 密码位数（默认6位）
  headerTitle: '确认付款',         // 标题文本（默认"支付"）
  closeThreshold: 150,             // 关闭距离阈值（像素）
  closeThresholdPercent: 0.4,      // 关闭距离阈值（百分比，0-1之间）
  velocityThreshold: 0.8           // 速度阈值（像素/毫秒）
});
```

**注意**：`setConfig` 方法中，如果某个配置项没有传入（undefined），会自动恢复为默认值。这样可以防止团队成员之间的配置互相影响。

### 7. 单独设置配置项

```javascript
// 设置标题
PaymentPanel.setHeaderTitle('确认付款');

// 设置关闭阈值
PaymentPanel.setCloseThreshold(150); // 设置距离阈值为150px
PaymentPanel.setCloseThresholdPercent(0.4); // 设置距离阈值为面板高度的40%
PaymentPanel.setVelocityThreshold(0.8); // 设置速度阈值为0.8px/ms

// 设置点击遮罩层是否关闭
PaymentPanel.setCloseOnOverlayClick(false);

// 设置密码输入
PaymentPanel.setEnablePassword(true);
PaymentPanel.setPasswordLength(6); // 设置密码位数（默认6位）

// 重置为默认配置
PaymentPanel.resetConfig();
```

### 8. 监听事件

```javascript
// 监听支付确认事件
PaymentPanel.on('payment-confirm', (e) => {
  const { method, amount, methodData } = e.detail;
  console.log('支付方式:', method);
  console.log('支付金额:', amount);
  console.log('完整数据:', methodData);
});

// 监听关闭事件
PaymentPanel.on('payment-close', () => {
  console.log('支付面板已关闭');
});

// 移除事件监听
PaymentPanel.off('payment-confirm', handler);
```

## API

### 全局方法

#### 基础方法

- `PaymentPanel.open(amount?: number)` - 打开支付面板，可选传入金额
- `PaymentPanel.close()` - 关闭支付面板
- `PaymentPanel.setAmount(amount: number)` - 设置支付金额

#### 支付方式

- `PaymentPanel.setPaymentMethods(methods?, fieldMapping?)` - 设置支付方式列表
  - `methods`: 支付方式数组（可选），如果不传或传空数组，会恢复为默认支付方式
  - `fieldMapping`: 可选，字段映射配置
    - `titleField`: 标题字段名（默认 'title' 或 'name'）
    - `subtitleField`: 副标题字段名（默认 'subtitle' 或 'desc'）
    - `iconField`: 图标字段名（默认 'icon'）
    - `valueField`: 值字段名（默认 'value' 或 'id'）
- `PaymentPanel.getSelectedMethod()` - 获取当前选中的支付方式

#### 统一配置

- `PaymentPanel.setConfig(config: PaymentPanelConfig)` - 统一配置所有选项
  - `allowSwipeToClose?: boolean` - 是否允许下拉关闭（默认 true，false 时隐藏拖动滑块）
  - `closeOnOverlayClick?: boolean` - 点击遮罩层是否关闭（默认 true）
  - `enablePassword?: boolean` - 是否启用密码输入（默认 false）
  - `passwordLength?: number` - 密码位数（默认 6，范围 4-12）
  - `headerTitle?: string` - 标题文本（默认 "支付"）
  - `closeThreshold?: number` - 关闭距离阈值（像素，默认 100）
  - `closeThresholdPercent?: number` - 关闭距离阈值（百分比，默认 0.3）
  - `velocityThreshold?: number` - 速度阈值（像素/毫秒，默认 0.5）

  **注意**：如果某个配置项没有传入（undefined），会自动恢复为默认值。

- `PaymentPanel.resetConfig()` - 重置所有配置为默认值

#### 单独配置方法

- `PaymentPanel.setHeaderTitle(title: string)` - 设置标题文本
- `PaymentPanel.setCloseThreshold(threshold: number)` - 设置关闭距离阈值（像素）
- `PaymentPanel.setCloseThresholdPercent(percent: number)` - 设置关闭距离阈值（百分比，0-1之间）
- `PaymentPanel.setVelocityThreshold(threshold: number)` - 设置速度阈值（像素/毫秒）
- `PaymentPanel.setCloseOnOverlayClick(close: boolean)` - 设置点击遮罩层是否关闭
- `PaymentPanel.setEnablePassword(enable: boolean)` - 设置是否启用密码输入
- `PaymentPanel.setPasswordLength(length: number)` - 设置密码位数（4-12位）

#### 事件

- `PaymentPanel.on(event, handler)` - 监听事件（自动去重，同一个 handler 只会添加一次）
- `PaymentPanel.off(event, handler)` - 移除事件监听

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

## 主题

组件会自动检测系统主题设置，支持亮色主题和暗色主题。使用 GitHub 风格的配色方案，所有颜色通过 CSS 变量管理，可以轻松自定义。

## 浏览器支持

- Chrome/Edge (最新版本)
- Firefox (最新版本)
- Safari (最新版本)
- 移动端浏览器

## 许可证

ISC
