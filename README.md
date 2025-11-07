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

### 6. 自定义关闭阈值

```javascript
PaymentPanel.setCloseThreshold(150); // 设置距离阈值为150px
PaymentPanel.setCloseThresholdPercent(0.4); // 设置距离阈值为面板高度的40%
PaymentPanel.setVelocityThreshold(0.8); // 设置速度阈值为0.8px/ms
```

### 7. 监听事件

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

- `PaymentPanel.open(amount?: number)` - 打开支付面板，可选传入金额
- `PaymentPanel.close()` - 关闭支付面板
- `PaymentPanel.setAmount(amount: number)` - 设置支付金额
- `PaymentPanel.setPaymentMethods(methods, fieldMapping?)` - 设置支付方式列表
  - `methods`: 支付方式数组，每个对象必须包含唯一标识字段（如 `value` 或 `id`）
  - `fieldMapping`: 可选，字段映射配置
    - `titleField`: 标题字段名（默认 'title' 或 'name'）
    - `subtitleField`: 副标题字段名（默认 'subtitle' 或 'desc'）
    - `iconField`: 图标字段名（默认 'icon'）
    - `valueField`: 值字段名（默认 'value' 或 'id'）
- `PaymentPanel.getSelectedMethod()` - 获取当前选中的支付方式
- `PaymentPanel.setCloseThreshold(threshold: number)` - 设置关闭距离阈值（像素）
- `PaymentPanel.setCloseThresholdPercent(percent: number)` - 设置关闭距离阈值（百分比，0-1之间）
- `PaymentPanel.setVelocityThreshold(threshold: number)` - 设置速度阈值（像素/毫秒）
- `PaymentPanel.on(event, handler)` - 监听事件
- `PaymentPanel.off(event, handler)` - 移除事件监听

### 拖拽关闭

组件支持通过向下拖拽来关闭面板：
- 可以从拖拽手柄（顶部横条）或标题栏区域开始拖拽
- 拖拽距离超过阈值或拖拽速度超过速度阈值时，松开手指会自动关闭
- 未达到阈值时，面板会回弹到原位置
- 内容区域可以正常滚动，不会触发拖拽

### 事件

- `payment-confirm` - 支付确认时触发，事件详情包含：
  - `method`: 选择的支付方式的值（根据 valueField 配置）
  - `methodData`: 完整的支付方式对象
  - `amount`: 支付金额
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
