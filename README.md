English | [简体中文](https://github.com/Brid9e/pypjs/blob/main/README-ZH.md)

# pypjs

A simple, easy-to-use, framework-agnostic payment panel component.

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
pypjs.open()

// Open with amount
pypjs.open(99.99)
```

### 4. Close Payment Panel

```javascript
pypjs.close()
```

### 5. Set Amount

```javascript
pypjs.setAmount(199.0)
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
    titleField: 'name', // Title field name
    subtitleField: 'desc', // Subtitle field name
    iconField: 'icon', // Icon field name
    valueField: 'id' // Value field name
  }
)
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
)
```

#### Icon Types

Supports three icon types: Image URL, String (emoji/character), or default SVG icon.

### 7. Unified Configuration

```javascript
// Use setConfig to configure all options
pypjs.setConfig({
  allowSwipeToClose: false, // Allow swipe to close (hides drag handle when false)
  closeOnOverlayClick: false, // Close on overlay click
  enablePassword: true, // Enable password input
  passwordLength: 6, // Password length (default 6)
  headerTitle: 'Confirm Payment', // Header title (optional, defaults to i18n)
  amountLabel: 'Payment Amount', // Amount label (optional, defaults to i18n)
  iconDisplay: 'always', // Icon display mode: 'always' | 'never' | 'auto' (default 'always')
  closeThreshold: 150, // Close distance threshold (pixels)
  closeThresholdPercent: 0.4, // Close distance threshold (percentage, 0-1)
  velocityThreshold: 0.8, // Velocity threshold (pixels/ms)
  allowConfirmWithoutMethods: true, // Allow confirm when no payment methods (default true)
  hidePaymentMethods: false, // Hide payment methods section (default false)
  amountAlign: 'left', // Amount alignment: 'left' | 'center' | 'right' (default 'left')
  amountFont: 'Arial, sans-serif', // Amount font (optional)
  textFont: 'Arial, sans-serif', // Text font for other elements (optional)
  language: 'en', // Language setting: 'zh' | 'en' | 'ja' | 'ru' (default 'en')
  i18n: {
    // Custom i18n texts (partial override, optional)
    headerTitle: 'Custom Title',
    confirmButton: 'Confirm'
  },
  theme: {
    // Theme configuration
    primaryColor: '#ff4d4f',
    primaryHoverColor: '#ff7875',
    overlayColor: 'rgba(0, 0, 0, 0.6)',
    panelBgLight: '#ffffff',
    panelBgDark: '#2d2d2d',
    textPrimaryLight: '#24292f',
    textPrimaryDark: '#e0e0e0'
  }
})
```

**Note**: In `setConfig`, undefined values will revert to defaults.

### 8. Individual Configuration Methods

```javascript
pypjs.setHeaderTitle('Confirm Payment')
pypjs.setAmountLabel('Payment Amount')
pypjs.setEnablePassword(true)
pypjs.setPasswordLength(6)
pypjs.setLanguage('zh')
pypjs.setTheme({ primaryColor: '#ff4d4f' })
pypjs.resetConfig()
// ... and more
```

### 9. Event Listeners

```javascript
// Listen to payment confirm event
pypjs.on('payment-confirm', (e) => {
  const { method, amount, methodData } = e.detail
  console.log('Payment method:', method)
  console.log('Amount:', amount)
  console.log('Full data:', methodData)
})

// Listen to close event
pypjs.on('payment-close', () => {
  console.log('Payment panel closed')
})

// Remove event listener
pypjs.off('payment-confirm', handler)
```

## Features

### Icon Display

Icon display modes: `always` (default), `never`, `auto`. Supports image URL, string (emoji/character), or default SVG icon.

### Internationalization (i18n)

Supports Chinese (zh), English (en), Japanese (ja), and Russian (ru). You can partially override default texts using the `i18n` configuration.

```javascript
pypjs.setConfig({
  language: 'zh',
  i18n: {
    headerTitle: 'Custom Title',
    confirmButton: 'Confirm Payment'
  }
})
```

### Amount Alignment and Fonts

Supports custom amount alignment (`left` | `center` | `right`) and fonts for amount and text elements.

### Payment Methods Control

- `allowConfirmWithoutMethods`: Control whether to allow confirmation when no payment methods (default `true`)
- `hidePaymentMethods`: Hide payment methods section, only show amount and confirm button/password input (default `false`)

### Theme

Automatically detects system theme settings. Supports light and dark themes with customizable colors. Backgrounds support gradients.

```javascript
pypjs.setTheme({
  primaryColor: '#ff4d4f',
  primaryHoverColor: '#ff7875',
  panelBgLight: 'linear-gradient(135deg, #fff5f5 0%, #ffe8e8 100%)',
  panelBgDark: '#1a0f0f'
})
```

## API Reference

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
  - `headerTitle?: string` - Header title text (optional, defaults to i18n)
  - `amountLabel?: string` - Amount label text (optional, defaults to i18n)
  - `iconDisplay?: 'always' | 'never' | 'auto'` - Icon display mode (default "always")
    - `always`: Always show icon area
    - `never`: Never show icon area
    - `auto`: Show when icon value exists, hide when not
  - `closeThreshold?: number` - Close distance threshold (pixels, default 100)
  - `closeThresholdPercent?: number` - Close distance threshold (percentage, default 0.3)
  - `velocityThreshold?: number` - Velocity threshold (pixels/ms, default 0.5)
  - `allowConfirmWithoutMethods?: boolean` - Allow confirm when no payment methods (default true)
  - `hidePaymentMethods?: boolean` - Hide payment methods section (default false)
  - `amountAlign?: 'left' | 'center' | 'right'` - Amount alignment (default 'left')
  - `amountFont?: string` - Amount font (optional, e.g. "Arial, sans-serif")
  - `textFont?: string` - Text font for other elements (optional, e.g. "Arial, sans-serif")
  - `language?: 'zh' | 'en' | 'ja' | 'ru'` - Language setting (default 'en')
  - `i18n?: Partial<I18nTexts>` - Custom i18n texts (partial override, optional)
    - `headerTitle?: string` - Header title text
    - `amountLabel?: string` - Amount label text
    - `paymentMethodsTitle?: string` - Payment methods title text
    - `passwordLabel?: string` - Password label text
    - `cancelButton?: string` - Cancel button text
    - `confirmButton?: string` - Confirm button text
    - `emptyStateText?: string` - Empty state text
    - `closeAriaLabel?: string` - Close button aria label
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

- `pypjs.setHeaderTitle(title?: string)` - Set header title text (optional, defaults to i18n if not provided)
- `pypjs.setAmountLabel(label?: string)` - Set amount label text (optional, defaults to i18n if not provided)
- `pypjs.setCloseThreshold(threshold: number)` - Set close distance threshold (pixels)
- `pypjs.setCloseThresholdPercent(percent: number)` - Set close distance threshold (percentage, 0-1)
- `pypjs.setVelocityThreshold(threshold: number)` - Set velocity threshold (pixels/ms)
- `pypjs.setCloseOnOverlayClick(close: boolean)` - Set whether to close on overlay click
- `pypjs.setEnablePassword(enable: boolean)` - Set whether to enable password input
- `pypjs.setPasswordLength(length: number)` - Set password length (4-12 digits)
- `pypjs.setAllowConfirmWithoutMethods(allow: boolean)` - Set whether to allow confirm without payment methods
- `pypjs.setHidePaymentMethods(hide: boolean)` - Set whether to hide payment methods section
- `pypjs.setAmountAlign(align: 'left' | 'center' | 'right')` - Set amount alignment
- `pypjs.setAmountFont(font: string)` - Set amount font
- `pypjs.setTextFont(font: string)` - Set text font
- `pypjs.setLanguage(lang: 'zh' | 'en' | 'ja' | 'ru')` - Set language
- `pypjs.setI18n(i18n: Partial<I18nTexts>)` - Set custom i18n texts (partial override)
- `pypjs.setTheme(theme: ThemeConfig)` - Set theme configuration
- `pypjs.getTheme()` - Get current theme configuration

#### Events

- `pypjs.on(event, handler)` - Listen to events (auto-deduplication, same handler only added once)
- `pypjs.off(event, handler)` - Remove event listener

### Events

- `payment-confirm` - Triggered when payment is confirmed
  - `method`: Selected payment method value
  - `methodData`: Complete payment method object
  - `amount`: Payment amount
  - `password`: Password (if password input is enabled)
- `payment-close` - Triggered when payment panel is closed

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers

## License

MIT
