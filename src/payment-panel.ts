// 支付方式接口
interface PaymentMethod {
  [key: string]: any // 允许任意字段
  value: string | number // 必须有一个唯一标识
}

// 字段映射配置
interface FieldMapping {
  titleField?: string // 标题字段名，默认 'title' 或 'name'
  subtitleField?: string // 副标题字段名，默认 'subtitle' 或 'desc' 或 'description'
  iconField?: string // 图标字段名，默认 'icon'
  valueField?: string // 值字段名，默认 'value' 或 'id'
}

// 支付面板配置
interface PaymentPanelConfig {
  // 拖拽关闭相关
  allowSwipeToClose?: boolean // 是否允许下拉关闭，默认 true
  closeThreshold?: number // 关闭距离阈值（像素），默认 100px
  closeThresholdPercent?: number // 关闭距离阈值（百分比 0-1），默认 0.3
  velocityThreshold?: number // 速度阈值（像素/毫秒），默认 0.5

  // 行为配置
  closeOnOverlayClick?: boolean // 点击遮罩层是否关闭，默认 true

  // 密码输入相关
  enablePassword?: boolean // 是否启用密码输入，默认 false
  passwordLength?: number // 密码位数，默认 6

  // UI配置
  headerTitle?: string // 标题文本，默认 "支付"
}

// 默认配置
const DEFAULT_CONFIG: Required<PaymentPanelConfig> = {
  allowSwipeToClose: true,
  closeThreshold: 100,
  closeThresholdPercent: 0.3,
  velocityThreshold: 0.5,
  closeOnOverlayClick: true,
  enablePassword: false,
  passwordLength: 6,
  headerTitle: '支付'
}

class PaymentPanel extends HTMLElement {
  private shadow: ShadowRoot
  private isOpen: boolean = false
  private overlay: HTMLElement | null = null
  private panel: HTMLElement | null = null

  // 拖拽相关
  private isDragging: boolean = false
  private startY: number = 0
  private currentY: number = 0
  private startTime: number = 0
  private lastY: number = 0
  private lastTime: number = 0
  private velocity: number = 0

  // 配置项（使用默认配置初始化）
  private allowSwipeToClose: boolean = DEFAULT_CONFIG.allowSwipeToClose
  private closeThreshold: number = DEFAULT_CONFIG.closeThreshold
  private closeThresholdPercent: number = DEFAULT_CONFIG.closeThresholdPercent
  private velocityThreshold: number = DEFAULT_CONFIG.velocityThreshold
  private closeOnOverlayClick: boolean = DEFAULT_CONFIG.closeOnOverlayClick
  private enablePassword: boolean = DEFAULT_CONFIG.enablePassword
  private passwordLength: number = DEFAULT_CONFIG.passwordLength
  private currentPassword: string = '' // 当前输入的密码
  private headerTitle: string = DEFAULT_CONFIG.headerTitle

  // 默认支付方式
  private static readonly DEFAULT_PAYMENT_METHODS: PaymentMethod[] = [
    { value: 'wechat', title: '微信支付', subtitle: '推荐使用', icon: '💳' },
    { value: 'alipay', title: '支付宝', subtitle: '安全便捷', icon: '💰' },
    { value: 'card', title: '银行卡', subtitle: '支持各大银行', icon: '💵' }
  ]

  private static readonly DEFAULT_FIELD_MAPPING: FieldMapping = {
    titleField: 'title',
    subtitleField: 'subtitle',
    iconField: 'icon',
    valueField: 'value'
  }

  // 支付方式配置
  private paymentMethods: PaymentMethod[] = []
  private fieldMapping: FieldMapping = {}
  private selectedMethod: PaymentMethod | null = null
  private hasCustomPaymentMethods: boolean = false // 标记是否设置过自定义支付方式

  constructor() {
    super()
    this.shadow = this.attachShadow({ mode: 'open' })
    this.isOpen = false

    // 使用默认支付方式
    this.paymentMethods = [...PaymentPanel.DEFAULT_PAYMENT_METHODS]
    this.fieldMapping = { ...PaymentPanel.DEFAULT_FIELD_MAPPING }
    if (this.paymentMethods.length > 0) {
      this.selectedMethod = this.paymentMethods[0]
    }
  }

  // 静态属性观察器，用于监听属性变化
  static get observedAttributes() {
    return ['close-threshold', 'close-threshold-percent', 'velocity-threshold', 'close-on-overlay-click', 'enable-password', 'password-length']
  }

  attributeChangedCallback(name: string, oldValue: string, newValue: string) {
    if (oldValue === newValue) return

    switch (name) {
      case 'close-threshold':
        this.closeThreshold = parseFloat(newValue) || 100
        break
      case 'close-threshold-percent':
        this.closeThresholdPercent = parseFloat(newValue) || 0.3
        break
      case 'velocity-threshold':
        this.velocityThreshold = parseFloat(newValue) || 0.5
        break
      case 'close-on-overlay-click':
        this.closeOnOverlayClick = newValue !== 'false'
        break
      case 'enable-password':
        this.enablePassword = newValue !== 'false'
        break
      case 'password-length':
        this.passwordLength = parseInt(newValue) || 6
        break
    }
  }

  connectedCallback() {
    // 读取属性值
    const closeThreshold = this.getAttribute('close-threshold')
    if (closeThreshold) {
      this.closeThreshold = parseFloat(closeThreshold) || 100
    }

    const closeThresholdPercent = this.getAttribute('close-threshold-percent')
    if (closeThresholdPercent) {
      this.closeThresholdPercent = parseFloat(closeThresholdPercent) || 0.3
    }

    const velocityThreshold = this.getAttribute('velocity-threshold')
    if (velocityThreshold) {
      this.velocityThreshold = parseFloat(velocityThreshold) || 0.5
    }

    this.render()
    this.setupEventListeners()
    this.detectSystemTheme()

    // 初始化密码输入（在 render 之后）
    this.initPasswordInput()
    this.updatePasswordUI()
    this.updateDragHandleVisibility()
  }

  disconnectedCallback() {
    this.removeEventListeners()
  }

  private detectSystemTheme() {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    this.updateTheme(mediaQuery.matches)

    // 监听系统主题变化
    mediaQuery.addEventListener('change', (e) => {
      this.updateTheme(e.matches)
    })
  }

  private updateTheme(isDark: boolean) {
    const root = this.shadow.host
    if (isDark) {
      root.setAttribute('data-theme', 'dark')
    } else {
      root.setAttribute('data-theme', 'light')
    }
  }

  private render() {
    this.shadow.innerHTML = `
      <style>
        :host {
          --bg-overlay: rgba(0, 0, 0, 0.5);
          --bg-panel-light: #ffffff;
          --bg-panel-dark: #161b22;
          --bg-header-light: #f6f8fa;
          --bg-header-dark: #21262d;
          --bg-button-primary-light: #238636;
          --bg-button-primary-dark: #238636;
          --bg-button-primary-hover-light: #2ea043;
          --bg-button-primary-hover-dark: #2ea043;
          --bg-button-secondary-light: #f6f8fa;
          --bg-button-secondary-dark: #21262d;
          --bg-button-secondary-hover-light: #f3f4f6;
          --bg-button-secondary-hover-dark: #30363d;
          --text-primary-light: #24292f;
          --text-primary-dark: #e6edf3;
          --text-secondary-light: #57606a;
          --text-secondary-dark: #8b949e;
          --border-light: #d0d7de;
          --border-dark: #30363d;
          --shadow-light: rgba(0, 0, 0, 0.1);
          --shadow-dark: rgba(0, 0, 0, 0.3);
        }

        :host([data-theme="dark"]) {
          --bg-overlay: rgba(0, 0, 0, 0.7);
        }

        .overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: var(--bg-overlay);
          z-index: 9998;
          opacity: 0;
          visibility: hidden;
          transition: opacity 0.3s ease, visibility 0.3s ease;
        }

        .overlay.show {
          opacity: 1;
          visibility: visible;
        }

        .panel {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          background-color: var(--bg-panel-light);
          border-top-left-radius: 16px;
          border-top-right-radius: 16px;
          box-shadow: 0 -4px 20px var(--shadow-light);
          z-index: 9999;
          transform: translateY(100%);
          transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          max-height: 90vh;
          display: flex;
          flex-direction: column;
          touch-action: none;
          overflow: hidden;
        }

        .panel-close-btn {
          position: absolute;
          top: 12px;
          left: 12px;
          width: 24px;
          height: 24px;
          background: none;
          border: none;
          padding: 0;
          cursor: pointer;
          z-index: 10000;
          display: flex;
          align-items: center;
          justify-content: center;
          touch-action: manipulation;
          opacity: 0.7;
          transition: opacity 0.2s ease;
        }

        .panel-close-btn:hover {
          opacity: 1;
        }

        .panel-close-btn svg {
          width: 100%;
          height: 100%;
        }

        .panel-close-btn svg path {
          stroke: var(--text-secondary-light);
        }

        :host([data-theme="dark"]) .panel-close-btn svg path {
          stroke: #ffffff;
        }

        .panel-close-btn:hover svg path {
          stroke: var(--text-primary-light);
        }

        :host([data-theme="dark"]) .panel-close-btn:hover svg path {
          stroke: #ffffff;
        }

        :host([data-theme="dark"]) .panel {
          background-color: var(--bg-panel-dark);
          box-shadow: 0 -4px 20px var(--shadow-dark);
        }

        .panel.show {
          transform: translateY(0);
        }

        .panel.dragging {
          transition: none;
        }

        .drag-handle {
          width: 40px;
          height: 4px;
          background-color: var(--border-light);
          border-radius: 2px;
          margin: 12px auto;
          cursor: grab;
          touch-action: none;
          user-select: none;
          transition: opacity 0.2s ease;
        }

        .drag-handle:active {
          cursor: grabbing;
        }

        .drag-handle.hidden {
          display: none;
        }

        :host([data-theme="dark"]) .drag-handle {
          background-color: var(--border-dark);
        }

        .header {
          padding: 16px 20px;
          background-color: transparent;
          border-top-left-radius: 16px;
          border-top-right-radius: 16px;
          touch-action: none;
          user-select: none;
        }

        :host([data-theme="dark"]) .header {
          background-color: transparent;
        }

        .header-content {
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .header-title {
          font-size: 18px;
          font-weight: 600;
          color: var(--text-primary-light);
          margin: 0;
          text-align: center;
        }

        :host([data-theme="dark"]) .header-title {
          color: var(--text-primary-dark);
        }

        .content {
          flex: 1;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          padding: 20px;
          min-height: 0;
        }

        .amount-section {
          margin-bottom: 24px;
          flex-shrink: 0;
        }

        .amount-label {
          font-size: 14px;
          color: var(--text-secondary-light);
          margin-bottom: 8px;
        }

        :host([data-theme="dark"]) .amount-label {
          color: var(--text-secondary-dark);
        }

        .amount-value {
          font-size: 48px;
          font-weight: 700;
          color: var(--text-primary-light);
        }

        .amount-value .currency-symbol {
          font-size: 32px;
          vertical-align: baseline;
          margin-right: 4px;
        }

        :host([data-theme="dark"]) .amount-value {
          color: var(--text-primary-dark);
        }

        .payment-methods {
          flex: 1;
          display: flex;
          flex-direction: column;
          min-height: 0;
          overflow: hidden;
        }

        .payment-methods-list-container {
          flex: 1;
          overflow-y: auto;
          overflow-x: hidden;
          touch-action: pan-y;
          -webkit-overflow-scrolling: touch;
          min-height: 0;
          /* 隐藏滚动条 */
          scrollbar-width: none; /* Firefox */
          -ms-overflow-style: none; /* IE and Edge */
        }

        .payment-methods-list-container::-webkit-scrollbar {
          display: none; /* Chrome, Safari, Opera */
        }

        .payment-methods-title {
          font-size: 16px;
          font-weight: 600;
          color: var(--text-primary-light);
          margin-bottom: 12px;
          flex-shrink: 0;
        }

        :host([data-theme="dark"]) .payment-methods-title {
          color: var(--text-primary-dark);
        }

        .payment-method {
          display: flex;
          align-items: center;
          padding: 12px;
          border: 1px solid var(--border-light);
          border-radius: 8px;
          margin-bottom: 8px;
          cursor: pointer;
          transition: background-color 0.2s ease, border-color 0.2s ease;
          outline: none;
          -webkit-tap-highlight-color: transparent;
        }

        .payment-method:active {
          background-color: var(--bg-button-secondary-hover-light);
        }

        :host([data-theme="dark"]) .payment-method:active {
          background-color: var(--bg-button-secondary-hover-dark);
        }

        :host([data-theme="dark"]) .payment-method {
          border-color: var(--border-dark);
        }

        .payment-method:hover {
          background-color: var(--bg-button-secondary-hover-light);
        }

        :host([data-theme="dark"]) .payment-method:hover {
          background-color: var(--bg-button-secondary-hover-dark);
        }

        .payment-method.selected {
          border-color: var(--bg-button-primary-light);
          background-color: var(--bg-button-secondary-hover-light);
        }

        :host([data-theme="dark"]) .payment-method.selected {
          border-color: var(--bg-button-primary-dark);
          background-color: var(--bg-button-secondary-hover-dark);
        }

        .payment-icon {
          width: 32px;
          height: 32px;
          margin-right: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
        }

        .payment-info {
          flex: 1;
        }

        .payment-name {
          font-size: 16px;
          font-weight: 500;
          color: var(--text-primary-light);
          margin-bottom: 2px;
        }

        :host([data-theme="dark"]) .payment-name {
          color: var(--text-primary-dark);
        }

        .payment-desc {
          font-size: 12px;
          color: var(--text-secondary-light);
        }

        :host([data-theme="dark"]) .payment-desc {
          color: var(--text-secondary-dark);
        }

        .payment-radio {
          width: 24px;
          height: 24px;
          position: relative;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0;
          transition: opacity 0.2s ease;
        }

        .payment-method.selected .payment-radio {
          opacity: 1;
        }

        .payment-radio svg {
          width: 24px;
          height: 24px;
        }

        .payment-radio svg path {
          stroke: #238636;
          stroke-width: 2.5;
          stroke-linecap: round;
          stroke-linejoin: round;
          fill: none;
        }

        .actions {
          padding: 16px 20px;
          border-top: 1px solid var(--border-light);
          background-color: var(--bg-header-light);
          display: flex;
          gap: 12px;
        }

        :host([data-theme="dark"]) .actions {
          border-top-color: var(--border-dark);
          background-color: var(--bg-header-dark);
        }

        .btn {
          flex: 1;
          padding: 12px 24px;
          border: none;
          border-radius: 6px;
          font-size: 16px;
          font-weight: 500;
          cursor: pointer;
          transition: background-color 0.2s ease;
        }

        .btn-secondary {
          background-color: var(--bg-button-secondary-light);
          color: var(--text-primary-light);
        }

        :host([data-theme="dark"]) .btn-secondary {
          background-color: var(--bg-button-secondary-dark);
          color: var(--text-primary-dark);
        }

        .btn-secondary:hover {
          background-color: var(--bg-button-secondary-hover-light);
        }

        :host([data-theme="dark"]) .btn-secondary:hover {
          background-color: var(--bg-button-secondary-hover-dark);
        }

        .btn-primary {
          background-color: var(--bg-button-primary-light);
          color: #ffffff;
        }

        .btn-primary:hover {
          background-color: var(--bg-button-primary-hover-light);
        }

        .password-section {
          margin-top: 24px;
        }

        .password-label {
          font-size: 14px;
          color: var(--text-secondary-light);
          margin-bottom: 16px;
          text-align: center;
        }

        :host([data-theme="dark"]) .password-label {
          color: var(--text-secondary-dark);
        }

        .password-input-container {
          display: flex;
          justify-content: center;
          margin-bottom: 24px;
        }

        .password-dots {
          display: flex;
          gap: 12px;
        }

        .password-dot {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          border: 2px solid var(--border-light);
          background-color: transparent;
          transition: all 0.2s ease;
        }

        :host([data-theme="dark"]) .password-dot {
          border-color: var(--border-dark);
        }

        .password-dot.filled {
          background-color: var(--text-primary-light);
          border-color: var(--text-primary-light);
        }

        :host([data-theme="dark"]) .password-dot.filled {
          background-color: var(--text-primary-dark);
          border-color: var(--text-primary-dark);
        }

        .keyboard {
          display: flex;
          flex-direction: column;
          gap: 12px;
          padding: 0 20px 20px;
          width: 100%;
          box-sizing: border-box;
        }

        .keyboard-row {
          display: flex;
          gap: 12px;
          width: 100%;
        }

        .keyboard-key {
          flex: 1;
          height: 50px;
          border: none;
          border-radius: 8px;
          background-color: var(--bg-button-secondary-light);
          color: var(--text-primary-light);
          font-size: 20px;
          font-weight: 500;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
          touch-action: manipulation;
          user-select: none;
          min-width: 0;
          box-sizing: border-box;
          padding: 0;
          outline: none;
          -webkit-tap-highlight-color: transparent;
        }

        :host([data-theme="dark"]) .keyboard-key {
          background-color: var(--bg-button-secondary-dark);
          color: var(--text-primary-dark);
        }

        .keyboard-key:active {
          background-color: var(--bg-button-secondary-hover-light);
          transform: scale(0.95);
        }

        :host([data-theme="dark"]) .keyboard-key:active {
          background-color: var(--bg-button-secondary-hover-dark);
        }

        .keyboard-key-empty {
          border: 1px solid transparent;
          background-color: transparent;
          cursor: default;
        }

        .keyboard-key-empty:active {
          transform: none;
        }

        .keyboard-key-delete {
          padding: 0;
        }

        .keyboard-key-delete svg {
          width: 20px;
          height: 20px;
        }

        .keyboard-key-delete svg path {
          stroke: var(--text-primary-light);
        }

        :host([data-theme="dark"]) .keyboard-key-delete svg path {
          stroke: var(--text-primary-dark);
        }

        @media (max-width: 480px) {
          .panel {
            max-height: 92vh;
          }
        }
      </style>
      <div class="overlay"></div>
      <div class="panel">
        <button class="panel-close-btn" id="closeBtn" aria-label="关闭">
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M6 6L18 18M18 6L6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
        <div class="drag-handle"></div>
        <div class="header">
          <div class="header-content">
            <h3 class="header-title" id="headerTitle">支付</h3>
          </div>
        </div>
        <div class="content">
          <div class="amount-section">
            <div class="amount-label">支付金额</div>
            <div class="amount-value"><span class="currency-symbol">¥</span><span id="amount">0.00</span></div>
          </div>
          <div class="payment-methods">
            <div class="payment-methods-title">选择支付方式</div>
            <div class="payment-methods-list-container">
              <div id="payment-methods-list"></div>
            </div>
          </div>
          <div class="password-section" id="passwordSection" style="display: none;">
            <div class="password-label">请输入支付密码</div>
            <div class="password-input-container">
              <div class="password-dots" id="passwordDots"></div>
            </div>
            <div class="keyboard" id="keyboard">
              <div class="keyboard-row">
                <button class="keyboard-key" data-key="1">1</button>
                <button class="keyboard-key" data-key="2">2</button>
                <button class="keyboard-key" data-key="3">3</button>
              </div>
              <div class="keyboard-row">
                <button class="keyboard-key" data-key="4">4</button>
                <button class="keyboard-key" data-key="5">5</button>
                <button class="keyboard-key" data-key="6">6</button>
              </div>
              <div class="keyboard-row">
                <button class="keyboard-key" data-key="7">7</button>
                <button class="keyboard-key" data-key="8">8</button>
                <button class="keyboard-key" data-key="9">9</button>
              </div>
              <div class="keyboard-row">
                <button class="keyboard-key keyboard-key-empty"></button>
                <button class="keyboard-key" data-key="0">0</button>
                <button class="keyboard-key keyboard-key-delete" id="deleteKey">
                  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M21 4H8l-7 8 7 8h13a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    <path d="M18 9l-6 6M12 9l6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
        <div class="actions" id="actions">
          <button class="btn btn-secondary" id="cancelBtn">取消</button>
          <button class="btn btn-primary" id="confirmBtn">确认支付</button>
        </div>
      </div>
    `

    this.overlay = this.shadow.querySelector('.overlay')
    this.panel = this.shadow.querySelector('.panel')

    // 渲染支付方式列表
    this.renderPaymentMethods()
  }

  private initPasswordInput() {
    this.renderPasswordDots()
    this.setupKeyboardListeners()
  }

  private renderPasswordDots() {
    const container = this.shadow.querySelector('#passwordDots')
    if (!container) return

    container.innerHTML = ''
    for (let i = 0; i < this.passwordLength; i++) {
      const dot = document.createElement('div')
      dot.className = 'password-dot'
      if (i < this.currentPassword.length) {
        dot.classList.add('filled')
      }
      container.appendChild(dot)
    }
  }

  private setupKeyboardListeners() {
    const keyboard = this.shadow.querySelector('#keyboard')
    if (!keyboard) return

    // 数字键
    const numberKeys = keyboard.querySelectorAll('.keyboard-key[data-key]')
    numberKeys.forEach(key => {
      key.addEventListener('click', () => {
        const value = key.getAttribute('data-key')
        if (value && this.currentPassword.length < this.passwordLength) {
          this.currentPassword += value
          this.renderPasswordDots()
          this.checkPasswordComplete()
        }
      })
    })

    // 删除键
    const deleteKey = this.shadow.querySelector('#deleteKey')
    if (deleteKey) {
      deleteKey.addEventListener('click', () => {
        if (this.currentPassword.length > 0) {
          this.currentPassword = this.currentPassword.slice(0, -1)
          this.renderPasswordDots()
        }
      })
    }
  }

  private checkPasswordComplete() {
    if (this.currentPassword.length === this.passwordLength) {
      // 密码输入完成，触发支付确认
      const selectedIndex = this.shadow
        .querySelector('.payment-method.selected')
        ?.getAttribute('data-index')
      const selectedMethod = selectedIndex !== null && selectedIndex !== undefined
        ? this.paymentMethods[parseInt(selectedIndex, 10)]
        : null
      const amount =
        this.shadow.querySelector('#amount')?.textContent || '0.00'

      this.dispatchEvent(
        new CustomEvent('payment-confirm', {
          detail: {
            method: selectedMethod?.value || selectedMethod,
            methodData: selectedMethod,
            amount,
            password: this.currentPassword
          },
          bubbles: true,
          composed: true
        })
      )

      // 重置密码
      this.currentPassword = ''
      this.renderPasswordDots()
      this.close()
    }
  }

  private updatePasswordUI() {
    const passwordSection = this.shadow.querySelector('#passwordSection') as HTMLElement
    const actions = this.shadow.querySelector('#actions') as HTMLElement

    if (this.enablePassword) {
      if (passwordSection) {
        passwordSection.style.display = 'block'
      }
      if (actions) {
        actions.style.display = 'none'
      }
    } else {
      if (passwordSection) {
        passwordSection.style.display = 'none'
      }
      if (actions) {
        actions.style.display = 'flex'
      }
    }
  }

  private renderPaymentMethods() {
    const container = this.shadow.querySelector('#payment-methods-list')
    if (!container) return

    const titleField = this.fieldMapping.titleField || 'title'
    const subtitleField = this.fieldMapping.subtitleField || 'subtitle'
    const iconField = this.fieldMapping.iconField || 'icon'
    const valueField = this.fieldMapping.valueField || 'value'

    // 如果没有找到指定字段，尝试常见字段名
    const getField = (item: PaymentMethod, field: string, fallbacks: string[]) => {
      if (item[field] !== undefined) return item[field]
      for (const fallback of fallbacks) {
        if (item[fallback] !== undefined) return item[fallback]
      }
      return ''
    }

    container.innerHTML = this.paymentMethods
      .map((method, index) => {
        const value = String(getField(method, valueField, ['value', 'id', 'code']) || index)
        const title = String(getField(method, titleField, ['title', 'name', 'label']) || '')
        const subtitle = String(getField(method, subtitleField, ['subtitle', 'desc', 'description']) || '')
        const icon = String(getField(method, iconField, ['icon', 'emoji']) || '💳')
        const isSelected = this.selectedMethod === method || (index === 0 && !this.selectedMethod)

        return `
          <div class="payment-method ${isSelected ? 'selected' : ''}" data-method="${value}" data-index="${index}">
            <div class="payment-icon">${icon}</div>
            <div class="payment-info">
              <div class="payment-name">${title}</div>
              ${subtitle ? `<div class="payment-desc">${subtitle}</div>` : ''}
            </div>
            <div class="payment-radio">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M20 6L9 17l-5-5"/>
              </svg>
            </div>
          </div>
        `
      })
      .join('')
  }

  private setupEventListeners() {
    // 遮罩层点击关闭（根据配置决定是否添加）
    if (this.overlay && this.closeOnOverlayClick) {
      this.overlay.addEventListener('click', () => {
        this.close()
      })
    }

    // 左上角关闭按钮
    const closeBtn = this.shadow.querySelector('#closeBtn')
    if (closeBtn) {
      // 使用 mousedown 和 touchstart 确保在拖拽事件之前触发
      closeBtn.addEventListener('mousedown', (e) => {
        e.stopPropagation()
        e.preventDefault()
        this.close()
      })
      closeBtn.addEventListener('touchstart', (e) => {
        e.stopPropagation()
        e.preventDefault()
        this.close()
      })
      closeBtn.addEventListener('click', (e) => {
        e.stopPropagation()
        e.preventDefault()
        this.close()
      })
    }

    // 取消按钮
    const cancelBtn = this.shadow.querySelector('#cancelBtn')
    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => {
        this.close()
      })
    }

    // 确认支付按钮
    const confirmBtn = this.shadow.querySelector('#confirmBtn')
    if (confirmBtn) {
      confirmBtn.addEventListener('click', () => {
        const selectedIndex = this.shadow
          .querySelector('.payment-method.selected')
          ?.getAttribute('data-index')
        const selectedMethod = selectedIndex !== null && selectedIndex !== undefined
          ? this.paymentMethods[parseInt(selectedIndex, 10)]
          : null
        const amount =
          this.shadow.querySelector('#amount')?.textContent || '0.00'
        this.dispatchEvent(
          new CustomEvent('payment-confirm', {
            detail: {
              method: selectedMethod?.value || selectedMethod,
              methodData: selectedMethod,
              amount
            },
            bubbles: true,
            composed: true
          })
        )
        this.close()
      })
    }

    // 支付方式选择（使用事件委托，因为列表是动态生成的）
    if (this.panel) {
      this.panel.addEventListener('click', (e) => {
        const target = (e.target as HTMLElement).closest('.payment-method')
        if (target) {
          const index = parseInt(target.getAttribute('data-index') || '0')
          this.selectedMethod = this.paymentMethods[index]
          const paymentMethods = this.shadow.querySelectorAll('.payment-method')
          paymentMethods.forEach((m) => m.classList.remove('selected'))
          target.classList.add('selected')
        }
      })
    }

    // 阻止面板内容点击关闭
    if (this.panel) {
      this.panel.addEventListener('click', (e) => {
        e.stopPropagation()
      })
    }

    // 设置拖拽事件监听
    this.setupDragListeners()
  }

  private setupDragListeners() {
    if (!this.panel || !this.allowSwipeToClose) return

    const dragHandle = this.shadow.querySelector('.drag-handle')
    const header = this.shadow.querySelector('.header')
    const dragTargets = [dragHandle, header].filter(Boolean) as HTMLElement[]

    // 为拖拽目标和面板添加事件监听
    ;[...dragTargets, this.panel].forEach((element) => {
      // 触摸事件（移动端）
      element.addEventListener('touchstart', this.handleDragStart.bind(this), {
        passive: false
      })
      element.addEventListener('touchmove', this.handleDragMove.bind(this), {
        passive: false
      })
      element.addEventListener('touchend', this.handleDragEnd.bind(this), {
        passive: false
      })

      // 鼠标事件（桌面端，用于测试）
      element.addEventListener('mousedown', this.handleDragStart.bind(this))
    })

    // 全局事件，确保在拖拽时能继续跟踪
    document.addEventListener('touchmove', this.handleDragMove.bind(this), {
      passive: false
    })
    document.addEventListener('touchend', this.handleDragEnd.bind(this))
    document.addEventListener('mousemove', this.handleDragMove.bind(this))
    document.addEventListener('mouseup', this.handleDragEnd.bind(this))
  }

  private handleDragStart(e: TouchEvent | MouseEvent) {
    if (!this.isOpen || !this.panel || !this.allowSwipeToClose) return

    // 检查是否从可拖拽区域开始
    const target = e.target as HTMLElement
    const dragHandle = this.shadow.querySelector('.drag-handle')
    const header = this.shadow.querySelector('.header')
    const content = this.shadow.querySelector('.content')
    const actions = this.shadow.querySelector('.actions')
    const closeBtn = this.shadow.querySelector('#closeBtn')
    const keyboard = this.shadow.querySelector('#keyboard')

    // 如果点击的是关闭按钮，不处理拖拽
    if (closeBtn?.contains(target) || target.closest('#closeBtn')) {
      return
    }

    // 如果点击的是内容区域、操作按钮区域或键盘区域，允许正常交互（滚动、点击）
    if (content?.contains(target) || actions?.contains(target) || keyboard?.contains(target)) {
      return
    }

    // 从拖拽手柄、头部或面板其他区域都可以拖拽
    e.preventDefault()
    e.stopPropagation()

    this.isDragging = true
    this.startY = this.getY(e)
    this.currentY = this.startY
    this.startTime = Date.now()
    this.lastY = this.startY
    this.lastTime = this.startTime
    this.velocity = 0

    if (this.panel) {
      this.panel.classList.add('dragging')
    }
  }

  private handleDragMove(e: TouchEvent | MouseEvent) {
    if (!this.isDragging || !this.panel) return

    e.preventDefault()
    e.stopPropagation()

    const currentY = this.getY(e)
    const currentTime = Date.now()
    const deltaY = currentY - this.startY

    // 只允许向下拖拽
    if (deltaY < 0) return

    // 计算速度
    const timeDelta = currentTime - this.lastTime
    if (timeDelta > 0) {
      const distanceDelta = currentY - this.lastY
      this.velocity = Math.abs(distanceDelta) / timeDelta
    }

    this.currentY = currentY
    this.lastY = currentY
    this.lastTime = currentTime

    // 更新面板位置
    this.panel.style.transform = `translateY(${deltaY}px)`

    // 更新遮罩层透明度
    if (this.overlay) {
      const panelHeight = this.panel.offsetHeight
      const opacity = Math.max(0, 1 - deltaY / panelHeight)
      this.overlay.style.opacity = String(opacity)
    }
  }

  private handleDragEnd(e: TouchEvent | MouseEvent) {
    if (!this.isDragging || !this.panel) return

    e.preventDefault()
    e.stopPropagation()

    this.isDragging = false
    this.panel.classList.remove('dragging')

    // 使用 currentY 获取最终的位移（touchend 时 touches 可能为空）
    const deltaY = this.currentY - this.startY
    const panelHeight = this.panel.offsetHeight
    const threshold = Math.max(
      this.closeThreshold,
      panelHeight * this.closeThresholdPercent
    )

    // 计算最终速度方向（最后一次移动的方向）
    const finalVelocity =
      this.lastY !== this.startY
        ? (this.currentY - this.lastY) /
          Math.max(1, this.lastTime - this.startTime)
        : 0

    // 判断是否应该关闭
    // 1. 最终位移超过阈值
    // 2. 速度超过阈值 且 最终速度是向下的（防止往上拖后还关闭）
    const shouldClose =
      deltaY > threshold ||
      (this.velocity > this.velocityThreshold &&
        finalVelocity > 0 &&
        deltaY > 0)

    if (shouldClose) {
      this.close()
    } else {
      // 回弹到原位置
      this.panel.style.transform = ''
      if (this.overlay) {
        this.overlay.style.opacity = ''
      }
    }

    // 重置状态
    this.startY = 0
    this.currentY = 0
    this.velocity = 0
  }

  private getY(e: TouchEvent | MouseEvent): number {
    if ('touches' in e && e.touches.length > 0) {
      return e.touches[0].clientY
    } else if ('clientY' in e) {
      return e.clientY
    }
    return 0
  }

  private removeEventListeners() {
    // 清理事件监听器
  }

  public open(amount?: number) {
    if (this.isOpen) return

    // 每次打开时，如果没有设置过自定义支付方式，恢复为默认值
    // 这样可以防止之前设置的支付方式影响后续打开
    if (!this.hasCustomPaymentMethods) {
      this.paymentMethods = [...PaymentPanel.DEFAULT_PAYMENT_METHODS]
      this.fieldMapping = { ...PaymentPanel.DEFAULT_FIELD_MAPPING }
      if (this.paymentMethods.length > 0) {
        this.selectedMethod = this.paymentMethods[0]
      }
      this.renderPaymentMethods()
    }
    // 每次打开后，重置标记，这样下次打开时如果没有设置就会用默认值
    this.hasCustomPaymentMethods = false

    this.isOpen = true
    document.body.style.overflow = 'hidden'

    if (amount !== undefined) {
      const amountElement = this.shadow.querySelector('#amount')
      if (amountElement) {
        amountElement.textContent = amount.toFixed(2)
      }
    }

    // 触发动画
    requestAnimationFrame(() => {
      if (this.overlay) {
        this.overlay.classList.add('show')
      }
      if (this.panel) {
        this.panel.classList.add('show')
      }
    })
  }

  public close() {
    if (!this.isOpen) return

    this.isOpen = false
    this.isDragging = false
    document.body.style.overflow = ''

    if (this.overlay) {
      this.overlay.classList.remove('show')
      this.overlay.style.opacity = ''
    }
    if (this.panel) {
      this.panel.classList.remove('show')
      this.panel.classList.remove('dragging')
      this.panel.style.transform = ''
    }

    // 触发关闭事件
    this.dispatchEvent(
      new CustomEvent('payment-close', {
        bubbles: true,
        composed: true
      })
    )
  }

  public setAmount(amount: number) {
    const amountElement = this.shadow.querySelector('#amount')
    if (amountElement) {
      amountElement.textContent = amount.toFixed(2)
    }
  }

  // 设置关闭阈值（像素）
  public setCloseThreshold(threshold: number) {
    this.closeThreshold = threshold
    this.setAttribute('close-threshold', String(threshold))
  }

  // 设置关闭阈值（百分比，0-1之间）
  public setCloseThresholdPercent(percent: number) {
    this.closeThresholdPercent = Math.max(0, Math.min(1, percent))
    this.setAttribute(
      'close-threshold-percent',
      String(this.closeThresholdPercent)
    )
  }

  // 设置速度阈值（像素/毫秒）
  public setVelocityThreshold(threshold: number) {
    this.velocityThreshold = threshold
    this.setAttribute('velocity-threshold', String(threshold))
  }

  // 设置支付方式列表
  public setPaymentMethods(methods?: PaymentMethod[], fieldMapping?: FieldMapping) {
    // 如果没有传入或传入空数组，恢复为默认值
    if (!methods || methods.length === 0) {
      this.paymentMethods = [...PaymentPanel.DEFAULT_PAYMENT_METHODS]
      this.fieldMapping = { ...PaymentPanel.DEFAULT_FIELD_MAPPING }
      this.hasCustomPaymentMethods = false // 标记为未设置自定义支付方式
    } else {
      this.paymentMethods = methods
      this.fieldMapping = fieldMapping || { ...PaymentPanel.DEFAULT_FIELD_MAPPING }
      this.hasCustomPaymentMethods = true // 标记为已设置自定义支付方式
    }
    // 重新渲染支付方式列表
    this.renderPaymentMethods()
    // 重置选中状态
    if (this.paymentMethods.length > 0) {
      this.selectedMethod = this.paymentMethods[0]
    } else {
      this.selectedMethod = null
    }
  }

  // 获取当前选中的支付方式
  public getSelectedMethod(): PaymentMethod | null {
    return this.selectedMethod
  }

  // 设置点击遮罩层是否关闭
  public setCloseOnOverlayClick(close: boolean) {
    this.closeOnOverlayClick = close
    this.setAttribute('close-on-overlay-click', String(close))

    // 重新设置事件监听
    if (this.overlay) {
      // 移除旧的事件监听器（需要重新绑定）
      const newOverlay = this.overlay.cloneNode(true) as HTMLElement
      if (this.overlay.parentNode) {
        this.overlay.parentNode.replaceChild(newOverlay, this.overlay)
        this.overlay = newOverlay
      }

      if (this.closeOnOverlayClick) {
        this.overlay.addEventListener('click', () => {
          this.close()
        })
      }
    }
  }

  // 设置是否启用密码输入
  public setEnablePassword(enable: boolean) {
    this.enablePassword = enable
    this.setAttribute('enable-password', String(enable))
    this.updatePasswordUI()
    if (!enable) {
      this.currentPassword = ''
      this.renderPasswordDots()
    }
  }

  // 设置密码位数
  public setPasswordLength(length: number) {
    this.passwordLength = Math.max(4, Math.min(12, length)) // 限制在4-12位
    this.setAttribute('password-length', String(this.passwordLength))
    this.currentPassword = ''
    this.renderPasswordDots()
  }

  // 统一配置方法
  public setConfig(config: PaymentPanelConfig) {
    // 如果配置项存在，使用传入的值；如果不存在，恢复为默认值
    this.allowSwipeToClose = config.allowSwipeToClose !== undefined
      ? config.allowSwipeToClose
      : DEFAULT_CONFIG.allowSwipeToClose
    this.updateDragHandleVisibility()
    this.setupDragListeners()

    this.closeThreshold = config.closeThreshold !== undefined
      ? config.closeThreshold
      : DEFAULT_CONFIG.closeThreshold
    this.setAttribute('close-threshold', String(this.closeThreshold))

    this.closeThresholdPercent = config.closeThresholdPercent !== undefined
      ? Math.max(0, Math.min(1, config.closeThresholdPercent))
      : DEFAULT_CONFIG.closeThresholdPercent
    this.setAttribute('close-threshold-percent', String(this.closeThresholdPercent))

    this.velocityThreshold = config.velocityThreshold !== undefined
      ? config.velocityThreshold
      : DEFAULT_CONFIG.velocityThreshold
    this.setAttribute('velocity-threshold', String(this.velocityThreshold))

    this.closeOnOverlayClick = config.closeOnOverlayClick !== undefined
      ? config.closeOnOverlayClick
      : DEFAULT_CONFIG.closeOnOverlayClick
    this.setAttribute('close-on-overlay-click', String(this.closeOnOverlayClick))
    // 重新设置遮罩层点击监听（通过克隆节点来移除所有监听器）
    if (this.overlay) {
      const newOverlay = this.overlay.cloneNode(true) as HTMLElement
      if (this.overlay.parentNode) {
        this.overlay.parentNode.replaceChild(newOverlay, this.overlay)
        this.overlay = newOverlay
      }

      if (this.closeOnOverlayClick) {
        this.overlay.addEventListener('click', () => {
          this.close()
        })
      }
    }

    this.enablePassword = config.enablePassword !== undefined
      ? config.enablePassword
      : DEFAULT_CONFIG.enablePassword
    this.setAttribute('enable-password', String(this.enablePassword))
    this.updatePasswordUI()
    if (!this.enablePassword) {
      this.currentPassword = ''
      this.renderPasswordDots()
    }

    this.passwordLength = config.passwordLength !== undefined
      ? Math.max(4, Math.min(12, config.passwordLength))
      : DEFAULT_CONFIG.passwordLength
    this.setAttribute('password-length', String(this.passwordLength))
    if (config.passwordLength !== undefined) {
      this.currentPassword = ''
      this.renderPasswordDots()
    }

    this.headerTitle = config.headerTitle !== undefined
      ? (config.headerTitle || DEFAULT_CONFIG.headerTitle)
      : DEFAULT_CONFIG.headerTitle
    this.updateHeaderTitle()
  }

  // 重置为默认配置
  public resetConfig() {
    this.setConfig({})
    // 重置支付方式为默认值（setPaymentMethods 会自动设置 hasCustomPaymentMethods = false）
    this.setPaymentMethods()
  }

  // 更新拖动滑块显示状态
  private updateDragHandleVisibility() {
    const dragHandle = this.shadow.querySelector('.drag-handle') as HTMLElement
    if (dragHandle) {
      if (this.allowSwipeToClose) {
        dragHandle.classList.remove('hidden')
      } else {
        dragHandle.classList.add('hidden')
      }
    }
  }

  // 设置标题
  public setHeaderTitle(title: string) {
    this.headerTitle = title || '支付'
    this.updateHeaderTitle()
  }

  // 更新标题显示
  private updateHeaderTitle() {
    const titleElement = this.shadow.querySelector('#headerTitle') as HTMLElement
    if (titleElement) {
      titleElement.textContent = this.headerTitle
    }
  }
}

// 注册自定义元素
if (!customElements.get('payment-panel')) {
  customElements.define('payment-panel', PaymentPanel)
}

// 导出类型
export type { PaymentMethod, FieldMapping, PaymentPanelConfig }

export default PaymentPanel
