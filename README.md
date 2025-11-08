# pypjs

A simple and easy-to-use payment panel component.

## Usage

### 1. Installation

```bash
npm install pypjs
# or
pnpm add pypjs
# or
yarn add pypjs
```

### 2. Import the Component

#### In Vue/React/Modern Projects (ES Module)

```javascript
import pypjs from 'pypjs'

// Use the component
pypjs.open(99.99)
pypjs.setConfig({ headerTitle: 'Payment' })
```

#### In Browser (Script Tag)

```html
<script src="./dist/index.js"></script>
```

After including, the global `pypjs` object is available for use.

### 3. Open Payment Panel

```javascript
// Basic usage
pypjs.open();

// Open with amount
pypjs.open(99.99);
```

### 4. Close Payment Panel

```javascript
pypjs.close();
```

### 5. Set Amount

```javascript
pypjs.setAmount(199.00);
```

### 6. Custom Payment Methods

#### Basic Usage

```javascript
// Set payment methods list and field mapping
pypjs.setPaymentMethods(
  [
    { id: 1, name: 'WeChat Pay', desc: 'Recommended', icon: '💳' },
    { id: 2, name: 'Alipay', desc: 'Secure & Convenient', icon: '💰' },
    { id: 3, name: 'Apple Pay', desc: 'Fast Payment', icon: '🍎' }
  ],
  {
    titleField: 'name',      // Title field name
    subtitleField: 'desc',   // Subtitle field name
    iconField: 'icon',       // Icon field name
    valueField: 'id'         // Value field name
  }
);
```

#### Two-Level Grouping

Supports two-level grouping structure. Click group headers to expand/collapse items:

```javascript
pypjs.setPaymentMethods(
  [
    {
      name: 'Online Payment',
      children: [
        { id: 1, name: 'WeChat Pay', desc: 'Recommended', icon: '💳' },
        { id: 2, name: 'Alipay', desc: 'Secure & Convenient', icon: '💰' },
        { id: 3, name: 'Apple Pay', desc: 'Fast Payment', icon: '🍎' }
      ]
    },
    {
      name: 'Bank Card',
      children: [
        { id: 4, name: 'Debit Card', desc: 'All Banks Supported', icon: '💵' },
        { id: 5, name: 'Credit Card', desc: 'All Banks Supported', icon: '💳' }
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

#### Icon Types

Supports three icon types:

1. **Image URL**: Automatically recognizes strings starting with `http://`, `https://` or containing image extensions
   ```javascript
   { icon: 'https://example.com/icon.png' }
   ```

2. **String**: Displays first character (emoji displays fully)
   ```javascript
   { icon: '💳' }  // emoji
   { icon: 'A' }   // single character
   { icon: 'Alipay' } // displays first character "A"
   ```

3. **No Icon**: Displays default SVG icon
   ```javascript
   { name: 'Bank Card' } // no icon field
   ```

### 7. Unified Configuration

```javascript
// Use setConfig to configure all options
pypjs.setConfig({
  allowSwipeToClose: false,        // Allow swipe to close (hides drag handle when false)
  closeOnOverlayClick: false,      // Close on overlay click
  enablePassword: true,            // Enable password input
  passwordLength: 6,               // Password length (default 6)
  headerTitle: 'Confirm Payment',  // Header title (default "Payment")
  amountLabel: 'Payment Amount',   // Amount label (default "Payment Amount")
  iconDisplay: 'always',           // Icon display mode: 'always' | 'never' | 'auto' (default 'always')
  closeThreshold: 150,             // Close distance threshold (pixels)
  closeThresholdPercent: 0.4,      // Close distance threshold (percentage, 0-1)
  velocityThreshold: 0.8,          // Velocity threshold (pixels/ms)
  theme: {                         // Theme configuration
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

**Note**: In `setConfig`, if a configuration item is not provided (undefined), it will automatically revert to the default value. This prevents configuration conflicts between team members.

### 8. Individual Configuration Methods

```javascript
// Set title
pypjs.setHeaderTitle('Confirm Payment');

// Set amount label
pypjs.setAmountLabel('Payment Amount');

// Set close thresholds
pypjs.setCloseThreshold(150); // Set distance threshold to 150px
pypjs.setCloseThresholdPercent(0.4); // Set distance threshold to 40% of panel height
pypjs.setVelocityThreshold(0.8); // Set velocity threshold to 0.8px/ms

// Set overlay click behavior
pypjs.setCloseOnOverlayClick(false);

// Set password input
pypjs.setEnablePassword(true);
pypjs.setPasswordLength(6); // Set password length (default 6)

// Set theme
pypjs.setTheme({
  primaryColor: '#ff4d4f',
  primaryHoverColor: '#ff7875',
  panelBgLight: 'linear-gradient(135deg, #fff5f5 0%, #ffe8e8 100%)',
  panelBgDark: '#1a0f0f'
});

// Reset to default configuration
pypjs.resetConfig();
```

### 9. Event Listeners

```javascript
// Listen to payment confirm event
pypjs.on('payment-confirm', (e) => {
  const { method, amount, methodData } = e.detail;
  console.log('Payment method:', method);
  console.log('Amount:', amount);
  console.log('Full data:', methodData);
});

// Listen to close event
pypjs.on('payment-close', () => {
  console.log('Payment panel closed');
});

// Remove event listener
pypjs.off('payment-confirm', handler);
```

## API

### Global Methods

#### Basic Methods

- `pypjs.open(amount?: number)` - Open payment panel, optionally with amount
- `pypjs.close()` - Close payment panel
- `pypjs.setAmount(amount: number)` - Set payment amount

#### Payment Methods

- `pypjs.setPaymentMethods(methods?, fieldMapping?)` - Set payment methods list
  - `methods`: Payment methods array (optional), if not provided or empty array, restores default payment methods
  - `fieldMapping`: Optional field mapping configuration
    - `titleField`: Title field name (default 'title' or 'name')
    - `subtitleField`: Subtitle field name (default 'subtitle' or 'desc')
    - `iconField`: Icon field name (default 'icon')
    - `valueField`: Value field name (default 'value' or 'id')
- `pypjs.getSelectedMethod()` - Get currently selected payment method

#### Unified Configuration

- `pypjs.setConfig(config: pypjsConfig)` - Configure all options
  - `allowSwipeToClose?: boolean` - Allow swipe to close (default true, hides drag handle when false)
  - `closeOnOverlayClick?: boolean` - Close on overlay click (default true)
  - `enablePassword?: boolean` - Enable password input (default false)
  - `passwordLength?: number` - Password length (default 6, range 4-12)
  - `headerTitle?: string` - Header title text (default "Payment")
  - `amountLabel?: string` - Amount label text (default "Payment Amount")
  - `iconDisplay?: 'always' | 'never' | 'auto'` - Icon display mode (default "always")
    - `always`: Always show icon area
    - `never`: Never show icon area
    - `auto`: Show when icon value exists, hide when not
  - `closeThreshold?: number` - Close distance threshold (pixels, default 100)
  - `closeThresholdPercent?: number` - Close distance threshold (percentage, default 0.3)
  - `velocityThreshold?: number` - Velocity threshold (pixels/ms, default 0.5)
  - `theme?: ThemeConfig` - Theme configuration object
    - `primaryColor?: string` - Primary color (default "#238636")
    - `primaryHoverColor?: string` - Primary hover color (default "#2ea043")
    - `overlayColor?: string` - Overlay color (default "rgba(0, 0, 0, 0.5)")
    - `panelBgLight?: string` - Panel background color in light mode (default "#ffffff", supports gradients)
    - `panelBgDark?: string` - Panel background color in dark mode (default "#2d2d2d", supports gradients)
    - `textPrimaryLight?: string` - Primary text color in light mode (default "#24292f")
    - `textPrimaryDark?: string` - Primary text color in dark mode (default "#e0e0e0")
    - `textSecondaryLight?: string` - Secondary text color in light mode (default "#57606a")
    - `textSecondaryDark?: string` - Secondary text color in dark mode (default "#999999")

  **Note**: If a configuration item is not provided (undefined), it will automatically revert to the default value.

- `pypjs.resetConfig()` - Reset all configurations to default values

#### Individual Configuration Methods

- `pypjs.setHeaderTitle(title: string)` - Set header title text
- `pypjs.setAmountLabel(label: string)` - Set amount label text
- `pypjs.setCloseThreshold(threshold: number)` - Set close distance threshold (pixels)
- `pypjs.setCloseThresholdPercent(percent: number)` - Set close distance threshold (percentage, 0-1)
- `pypjs.setVelocityThreshold(threshold: number)` - Set velocity threshold (pixels/ms)
- `pypjs.setCloseOnOverlayClick(close: boolean)` - Set whether to close on overlay click
- `pypjs.setEnablePassword(enable: boolean)` - Set whether to enable password input
- `pypjs.setPasswordLength(length: number)` - Set password length (4-12 digits)
- `pypjs.setTheme(theme: ThemeConfig)` - Set theme configuration
- `pypjs.getTheme()` - Get current theme configuration

#### Events

- `pypjs.on(event, handler)` - Listen to events (auto-deduplication, same handler only added once)
- `pypjs.off(event, handler)` - Remove event listener

### Swipe to Close

The component supports closing the panel by swiping down:
- Can start dragging from the drag handle (top bar) or header area
- When drag distance exceeds threshold or drag velocity exceeds velocity threshold, releasing will automatically close
- If threshold is not reached, panel will bounce back to original position
- Content area can scroll normally without triggering drag
- Can disable swipe to close with `allowSwipeToClose: false`, which automatically hides the drag handle

### Password Input

When password input is enabled:
- Cancel/confirm buttons are automatically hidden
- Password input field and soft keyboard are displayed
- Payment confirm event is automatically triggered after input completion
- Password length is configurable (default 6 digits, range 4-12)
- Password is included in `payment-confirm` event's `detail.password`

### Events

- `payment-confirm` - Triggered when payment is confirmed, event detail contains:
  - `method`: Selected payment method value (according to valueField configuration)
  - `methodData`: Complete payment method object
  - `amount`: Payment amount
  - `password`: Password (if password input is enabled)
- `payment-close` - Triggered when payment panel is closed

## Icon Display

The component supports flexible icon display configuration:

### Icon Display Modes

- **always** (default): Always show icon area, displays default SVG icon even when no icon value
- **never**: Never show icon area
- **auto**: Show when icon value exists, hide when icon value is missing or fails to load

### Icon Types

1. **Image URL**: Supports URLs starting with `http://`, `https://` or containing image extensions
   - Images fill a 28x28px square area with `object-fit: cover`
   - Automatically displays default SVG icon on load failure

2. **String**:
   - Emoji (length ≤ 2): Displays fully
   - Regular string: Displays first character
   - Uses `Array.from()` to correctly handle multi-byte characters (like emoji)

3. **Default Icon**: Displays default SVG icon when no icon value or image load failure

### Examples

```javascript
// Set icon display mode
pypjs.setConfig({
  iconDisplay: 'auto' // Show when icon exists, hide when not
});

// Use image URL
pypjs.setPaymentMethods([
  { id: 1, name: 'WeChat Pay', icon: 'https://example.com/wechat.png' },
  { id: 2, name: 'Alipay', icon: 'https://i.alipayobjects.com/common/favicon/favicon.ico' }
]);

// Use string
pypjs.setPaymentMethods([
  { id: 1, name: 'WeChat Pay', icon: '💳' },  // emoji
  { id: 2, name: 'Alipay', icon: 'A' }        // single character
]);
```

## Theme

The component automatically detects system theme settings and supports light and dark themes. All colors are managed through CSS variables for easy customization.

### Theme Configuration

```javascript
// Use setTheme method to set theme
pypjs.setTheme({
  primaryColor: '#ff4d4f',                    // Primary color
  primaryHoverColor: '#ff7875',               // Primary hover color
  overlayColor: 'rgba(0, 0, 0, 0.6)',        // Overlay color
  panelBgLight: '#ffffff',                    // Panel background in light mode
  panelBgDark: '#1a0f0f',                     // Panel background in dark mode
  textPrimaryLight: '#24292f',                // Primary text color in light mode
  textPrimaryDark: '#e0e0e0',                 // Primary text color in dark mode
  textSecondaryLight: '#57606a',              // Secondary text color in light mode
  textSecondaryDark: '#999999'                // Secondary text color in dark mode
});

// Support gradient backgrounds
pypjs.setTheme({
  panelBgLight: 'linear-gradient(135deg, #fff5f5 0%, #ffe8e8 100%)',
  panelBgDark: 'linear-gradient(135deg, #1a0f0f 0%, #2d1a1a 100%)'
});

// Set theme in setConfig
pypjs.setConfig({
  theme: {
    primaryColor: '#ff4d4f',
    primaryHoverColor: '#ff7875'
  }
});
```

### Default Theme

- Light mode: GitHub-style color scheme
- Dark mode: Grayscale color scheme for broad aesthetic appeal

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers

## License

MIT
