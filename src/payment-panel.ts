import type { PaymentMethod, FieldMapping, PaymentPanelConfig } from './types'

/**
 * 默认配置
 * 支付面板的默认配置值
 * @author Brid9e
 */
const DEFAULT_CONFIG: Required<Omit<PaymentPanelConfig, 'theme'>> = {
  allowSwipeToClose: true,
  closeThreshold: 100,
  closeThresholdPercent: 0.3,
  velocityThreshold: 0.5,
  closeOnOverlayClick: true,
  enablePassword: false,
  passwordLength: 6,
  headerTitle: '支付',
  amountLabel: '支付金额'
}

/**
 * 支付面板组件
 * 一个基于 Web Components 的移动端支付面板组件，支持拖拽关闭、密码输入、主题自定义等功能
 * @author Brid9e
 */
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
  private amountLabel: string = DEFAULT_CONFIG.amountLabel

  // 主题配置
  private theme: PaymentPanelConfig['theme'] = {}

  /**
   * 默认支付方式列表
   * @author Brid9e
   */
  private static readonly DEFAULT_PAYMENT_METHODS: PaymentMethod[] = [
    { value: 'wechat', title: '微信支付', subtitle: '推荐使用', icon: '💳' },
    { value: 'alipay', title: '支付宝', subtitle: '安全便捷', icon: '💰' },
    { value: 'card', title: '银行卡', subtitle: '支持各大银行', icon: '💵' }
  ]

  /**
   * 默认字段映射配置
   * @author Brid9e
   */
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
  private expandedGroups: Set<number> = new Set() // 展开的分组索引

  /**
   * 构造函数
   * 初始化支付面板组件，创建 Shadow DOM 并设置默认支付方式
   * @author Brid9e
   */
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

  /**
   * 静态属性观察器，用于监听属性变化
   * 返回需要监听的属性名称数组
   * @returns {string[]} 需要监听的属性名称数组
   * @author Brid9e
   */
  static get observedAttributes() {
    return ['close-threshold', 'close-threshold-percent', 'velocity-threshold', 'close-on-overlay-click', 'enable-password', 'password-length']
  }

  /**
   * 属性变化回调函数
   * 当 observedAttributes 中定义的属性发生变化时触发
   * @param {string} name - 属性名称
   * @param {string} oldValue - 旧值
   * @param {string} newValue - 新值
   * @author Brid9e
   */
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

  /**
   * 元素连接到 DOM 时调用
   * 初始化组件，读取属性值，渲染 UI，设置事件监听器
   * @author Brid9e
   */
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

  /**
   * 元素从 DOM 断开时调用
   * 清理事件监听器
   * @author Brid9e
   */
  disconnectedCallback() {
    this.removeEventListeners()
  }

  /**
   * 检测系统主题
   * 监听系统深色/浅色模式变化，并自动更新组件主题
   * @author Brid9e
   */
  private detectSystemTheme() {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    this.updateTheme(mediaQuery.matches)

    // 监听系统主题变化
    mediaQuery.addEventListener('change', (e) => {
      this.updateTheme(e.matches)
    })
  }

  /**
   * 更新主题
   * 根据系统主题设置组件的 data-theme 属性
   * @param {boolean} isDark - 是否为深色模式
   * @author Brid9e
   */
  private updateTheme(isDark: boolean) {
    const root = this.shadow.host
    if (isDark) {
      root.setAttribute('data-theme', 'dark')
    } else {
      root.setAttribute('data-theme', 'light')
    }
  }

  /**
   * 渲染组件
   * 生成组件的 HTML 结构和样式，应用主题配置
   * @author Brid9e
   */
  private render() {
    // 获取主题色值，如果未设置则使用默认值
    const primaryColor = this.theme?.primaryColor || '#238636'
    const primaryHoverColor = this.theme?.primaryHoverColor || '#2ea043'
    const overlayColor = this.theme?.overlayColor || 'rgba(0, 0, 0, 0.5)'
    const panelBgLight = this.theme?.panelBgLight || '#ffffff'
    const panelBgDark = this.theme?.panelBgDark || '#2d2d2d'
    const textPrimaryLight = this.theme?.textPrimaryLight || '#24292f'
    const textPrimaryDark = this.theme?.textPrimaryDark || '#e0e0e0'
    const textSecondaryLight = this.theme?.textSecondaryLight || '#57606a'
    const textSecondaryDark = this.theme?.textSecondaryDark || '#999999'

    this.shadow.innerHTML = `
      <style>
        :host {
          --bg-overlay: ${overlayColor};
          --bg-panel-light: ${panelBgLight};
          --bg-panel-dark: ${panelBgDark};
          --bg-header-light: #f6f8fa;
          --bg-header-dark: #333333;
          --bg-button-primary-light: ${primaryColor};
          --bg-button-primary-dark: ${primaryColor};
          --bg-button-primary-hover-light: ${primaryHoverColor};
          --bg-button-primary-hover-dark: ${primaryHoverColor};
          --bg-button-secondary-light: #f6f8fa;
          --bg-button-secondary-dark: #333333;
          --bg-button-secondary-hover-light: #f3f4f6;
          --bg-button-secondary-hover-dark: #404040;
          --text-primary-light: ${textPrimaryLight};
          --text-primary-dark: ${textPrimaryDark};
          --text-secondary-light: ${textSecondaryLight};
          --text-secondary-dark: ${textSecondaryDark};
          --border-light: #d0d7de;
          --border-dark: #4d4d4d;
          --shadow-light: rgba(0, 0, 0, 0.1);
          --shadow-dark: rgba(0, 0, 0, 0.3);
        }

        :host([data-theme="dark"]) {
          --bg-overlay: ${overlayColor.includes('rgba')
            ? overlayColor.replace(/[\d.]+(?=\))/, (match) => {
                const opacity = parseFloat(match)
                return String(Math.min(1, opacity + 0.2))
              })
            : 'rgba(0, 0, 0, 0.7)'};
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
          background: var(--bg-panel-light);
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
          background: var(--bg-panel-dark);
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
          padding: 10px 12px;
          border: 1px solid var(--border-light);
          border-radius: 8px;
          margin-bottom: 6px;
          cursor: pointer;
          transition: background-color 0.2s ease, border-color 0.2s ease;
          outline: none;
          -webkit-tap-highlight-color: transparent;
        }

        .payment-method-group {
          margin-bottom: 8px;
        }

        .payment-method-group-header {
          display: flex;
          align-items: center;
          padding: 10px 12px;
          border: 1px solid var(--border-light);
          border-radius: 8px;
          margin-bottom: 6px;
          cursor: pointer;
          transition: background-color 0.2s ease, border-color 0.2s ease;
          outline: none;
          -webkit-tap-highlight-color: transparent;
          user-select: none;
        }

        :host([data-theme="dark"]) .payment-method-group-header {
          border-color: var(--border-dark);
        }

        .payment-method-group-header:hover {
          background-color: var(--bg-button-secondary-hover-light);
        }

        :host([data-theme="dark"]) .payment-method-group-header:hover {
          background-color: var(--bg-button-secondary-hover-dark);
        }

        .payment-method-group-header .payment-name {
          font-weight: 600;
        }

        .payment-method-group-children {
          padding-left: 12px;
          max-height: 0;
          overflow: hidden;
          transition: max-height 0.3s ease;
        }

        .payment-method-group.expanded .payment-method-group-children {
          max-height: 2000px;
        }

        .payment-method-group-arrow {
          width: 20px;
          height: 20px;
          margin-left: auto;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: transform 0.3s ease;
        }

        .payment-method-group.expanded .payment-method-group-arrow {
          transform: rotate(90deg);
        }

        .payment-method-group-arrow svg {
          width: 16px;
          height: 16px;
        }

        .payment-method-group-arrow svg path {
          stroke: var(--text-secondary-light);
          stroke-width: 2;
        }

        :host([data-theme="dark"]) .payment-method-group-arrow svg path {
          stroke: var(--text-secondary-dark);
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
          width: 28px;
          height: 28px;
          margin-right: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
        }

        .payment-info {
          flex: 1;
        }

        .payment-name {
          font-size: 14px;
          font-weight: 500;
          color: var(--text-primary-light);
          margin-bottom: 2px;
        }

        :host([data-theme="dark"]) .payment-name {
          color: var(--text-primary-dark);
        }

        .payment-desc {
          font-size: 11px;
          color: var(--text-secondary-light);
        }

        :host([data-theme="dark"]) .payment-desc {
          color: var(--text-secondary-dark);
        }

        .payment-radio {
          width: 20px;
          height: 20px;
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
          width: 20px;
          height: 20px;
        }

        .payment-radio svg path {
          stroke: ${primaryColor};
          stroke-width: 2.5;
          stroke-linecap: round;
          stroke-linejoin: round;
          fill: none;
        }

        .actions {
          padding: 16px 20px;
          background: transparent;
          display: flex;
          gap: 12px;
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
          outline: none;
          -webkit-tap-highlight-color: transparent;
          user-select: none;
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

        :host([data-theme="dark"]) .btn-primary {
          background-color: var(--bg-button-primary-dark);
          color: #ffffff;
        }

        :host([data-theme="dark"]) .btn-primary:hover {
          background-color: var(--bg-button-primary-hover-dark);
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
            <div class="amount-label">${this.amountLabel}</div>
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

  /**
   * 初始化密码输入
   * 渲染密码点并设置键盘事件监听器
   * @author Brid9e
   */
  private initPasswordInput() {
    this.renderPasswordDots()
    this.setupKeyboardListeners()
  }

  /**
   * 渲染密码点
   * 根据当前密码长度渲染对应数量的密码点
   * @author Brid9e
   */
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

  /**
   * 设置键盘事件监听器
   * 为数字键和删除键添加点击事件处理
   * @author Brid9e
   */
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

  /**
   * 检查密码是否输入完成
   * 当密码长度达到设定值时，触发支付确认事件并关闭面板
   * @author Brid9e
   */
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

  /**
   * 更新密码输入 UI
   * 根据是否启用密码输入来显示/隐藏密码输入区域和操作按钮
   * @author Brid9e
   */
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

  /**
   * 渲染支付方式列表
   * 支持普通列表和二级分组列表，处理展开/折叠功能
   * @author Brid9e
   */
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

    // 扁平化所有支付方式（包括子项）用于查找选中项
    const flattenMethods = (methods: PaymentMethod[]): PaymentMethod[] => {
      const result: PaymentMethod[] = []
      methods.forEach(method => {
        if (method.children && method.children.length > 0) {
          result.push(...flattenMethods(method.children))
        } else {
          result.push(method)
        }
      })
      return result
    }

    const allMethods = flattenMethods(this.paymentMethods)
    let itemIndex = 0

    container.innerHTML = this.paymentMethods
      .map((method, groupIndex) => {
        // 检查是否有 children
        if (method.children && method.children.length > 0) {
          // 分组模式
          const title = String(getField(method, titleField, ['title', 'name', 'label']) || '')
          const isExpanded = this.expandedGroups.has(groupIndex)

          const childrenHtml = method.children
            .map((child: PaymentMethod) => {
              const value = String(getField(child, valueField, ['value', 'id', 'code']) || itemIndex)
              const childTitle = String(getField(child, titleField, ['title', 'name', 'label']) || '')
              const childSubtitle = String(getField(child, subtitleField, ['subtitle', 'desc', 'description']) || '')
              const icon = String(getField(child, iconField, ['icon', 'emoji']) || '💳')
              const isSelected = this.selectedMethod === child
              const currentIndex = itemIndex++

              return `
                <div class="payment-method ${isSelected ? 'selected' : ''}" data-method="${value}" data-index="${currentIndex}" data-group-index="${groupIndex}">
                  <div class="payment-icon">${icon}</div>
                  <div class="payment-info">
                    <div class="payment-name">${childTitle}</div>
                    ${childSubtitle ? `<div class="payment-desc">${childSubtitle}</div>` : ''}
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

          return `
            <div class="payment-method-group ${isExpanded ? 'expanded' : ''}" data-group-index="${groupIndex}">
              <div class="payment-method-group-header" data-group-header="${groupIndex}">
                <div class="payment-info">
                  <div class="payment-name">${title}</div>
                </div>
                <div class="payment-method-group-arrow">
                  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M9 18l6-6-6-6"/>
                  </svg>
                </div>
              </div>
              <div class="payment-method-group-children">
                ${childrenHtml}
              </div>
            </div>
          `
        } else {
          // 普通模式
          const value = String(getField(method, valueField, ['value', 'id', 'code']) || itemIndex)
          const title = String(getField(method, titleField, ['title', 'name', 'label']) || '')
          const subtitle = String(getField(method, subtitleField, ['subtitle', 'desc', 'description']) || '')
          const icon = String(getField(method, iconField, ['icon', 'emoji']) || '💳')
          const isSelected = this.selectedMethod === method || (itemIndex === 0 && !this.selectedMethod)
          const currentIndex = itemIndex++

          return `
            <div class="payment-method ${isSelected ? 'selected' : ''}" data-method="${value}" data-index="${currentIndex}">
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
        }
      })
      .join('')

    // 设置分组展开/折叠事件
    container.querySelectorAll('.payment-method-group-header').forEach(header => {
      header.addEventListener('click', (e) => {
        e.stopPropagation()
        const groupIndex = parseInt(header.getAttribute('data-group-header') || '0')
        if (this.expandedGroups.has(groupIndex)) {
          this.expandedGroups.delete(groupIndex)
        } else {
          this.expandedGroups.add(groupIndex)
        }
        this.renderPaymentMethods()
      })
    })
  }

  /**
   * 设置事件监听器
   * 为遮罩层、关闭按钮、确认/取消按钮、支付方式选择等添加事件处理
   * @author Brid9e
   */
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
        if (target && !target.closest('.payment-method-group-header')) {
          e.stopPropagation()
          const index = parseInt(target.getAttribute('data-index') || '0')
          const allMethods = this.getAllMethods()
          if (allMethods[index]) {
            // 如果切换了支付方式，清空已输入的密码
            if (this.selectedMethod !== allMethods[index] && this.currentPassword.length > 0) {
              this.currentPassword = ''
              this.renderPasswordDots()
            }
            this.selectedMethod = allMethods[index]
            const paymentMethods = this.shadow.querySelectorAll('.payment-method')
            paymentMethods.forEach((m) => m.classList.remove('selected'))
            target.classList.add('selected')
          }
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

  /**
   * 设置拖拽事件监听器
   * 为面板、拖拽手柄、头部等添加触摸和鼠标拖拽事件
   * @author Brid9e
   */
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

  /**
   * 处理拖拽开始
   * 记录拖拽起始位置和时间，初始化拖拽状态
   * @param {TouchEvent | MouseEvent} e - 触摸或鼠标事件
   * @author Brid9e
   */
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

  /**
   * 处理拖拽移动
   * 更新面板位置，计算拖拽速度，更新遮罩层透明度
   * @param {TouchEvent | MouseEvent} e - 触摸或鼠标事件
   * @author Brid9e
   */
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

  /**
   * 处理拖拽结束
   * 根据拖拽距离和速度判断是否关闭面板，或回弹到原位置
   * @param {TouchEvent | MouseEvent} e - 触摸或鼠标事件
   * @author Brid9e
   */
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

  /**
   * 获取事件的 Y 坐标
   * 兼容触摸事件和鼠标事件
   * @param {TouchEvent | MouseEvent} e - 触摸或鼠标事件
   * @returns {number} Y 坐标值
   * @author Brid9e
   */
  private getY(e: TouchEvent | MouseEvent): number {
    if ('touches' in e && e.touches.length > 0) {
      return e.touches[0].clientY
    } else if ('clientY' in e) {
      return e.clientY
    }
    return 0
  }

  /**
   * 移除事件监听器
   * 清理所有事件监听器（当前为空实现，保留接口）
   * @author Brid9e
   */
  private removeEventListeners() {
    // 清理事件监听器
  }

  /**
   * 打开支付面板
   * 显示支付面板，可选择性设置支付金额
   * @param {number} [amount] - 支付金额，可选
   * @author Brid9e
   */
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

  /**
   * 关闭支付面板
   * 隐藏支付面板，恢复页面滚动，触发关闭事件
   * @author Brid9e
   */
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

  /**
   * 设置支付金额
   * 更新面板中显示的支付金额
   * @param {number} amount - 支付金额
   * @author Brid9e
   */
  public setAmount(amount: number) {
    const amountElement = this.shadow.querySelector('#amount')
    if (amountElement) {
      amountElement.textContent = amount.toFixed(2)
    }
  }

  /**
   * 设置关闭阈值（像素）
   * 设置拖拽关闭面板所需的最小像素距离
   * @param {number} threshold - 关闭阈值（像素）
   * @author Brid9e
   */
  public setCloseThreshold(threshold: number) {
    this.closeThreshold = threshold
    this.setAttribute('close-threshold', String(threshold))
  }

  /**
   * 设置关闭阈值（百分比）
   * 设置拖拽关闭面板所需的最小百分比距离（相对于面板高度）
   * @param {number} percent - 关闭阈值（0-1之间）
   * @author Brid9e
   */
  public setCloseThresholdPercent(percent: number) {
    this.closeThresholdPercent = Math.max(0, Math.min(1, percent))
    this.setAttribute(
      'close-threshold-percent',
      String(this.closeThresholdPercent)
    )
  }

  /**
   * 设置速度阈值（像素/毫秒）
   * 设置拖拽关闭面板所需的最小速度
   * @param {number} threshold - 速度阈值（像素/毫秒）
   * @author Brid9e
   */
  public setVelocityThreshold(threshold: number) {
    this.velocityThreshold = threshold
    this.setAttribute('velocity-threshold', String(threshold))
  }

  /**
   * 设置支付方式列表
   * 设置自定义支付方式列表和字段映射配置，支持二级分组结构
   * @param {PaymentMethod[]} [methods] - 支付方式列表，如果为空则使用默认列表
   * @param {FieldMapping} [fieldMapping] - 字段映射配置，用于自定义字段名
   * @author Brid9e
   */
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

  /**
   * 获取当前选中的支付方式
   * 返回当前用户选中的支付方式对象
   * @returns {PaymentMethod | null} 当前选中的支付方式，如果未选中则返回 null
   * @author Brid9e
   */
  public getSelectedMethod(): PaymentMethod | null {
    return this.selectedMethod
  }

  /**
   * 获取所有支付方式（扁平化，包括子项）
   * 将分组结构扁平化，返回所有可选的支付方式
   * @returns {PaymentMethod[]} 扁平化后的支付方式列表
   * @author Brid9e
   */
  private getAllMethods(): PaymentMethod[] {
    const result: PaymentMethod[] = []
    this.paymentMethods.forEach(method => {
      if (method.children && method.children.length > 0) {
        result.push(...method.children)
      } else {
        result.push(method)
      }
    })
    return result
  }

  /**
   * 设置点击遮罩层是否关闭
   * 控制点击遮罩层时是否关闭支付面板
   * @param {boolean} close - 是否允许点击遮罩层关闭
   * @author Brid9e
   */
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

  /**
   * 设置是否启用密码输入
   * 控制是否显示密码输入界面
   * @param {boolean} enable - 是否启用密码输入
   * @author Brid9e
   */
  public setEnablePassword(enable: boolean) {
    this.enablePassword = enable
    this.setAttribute('enable-password', String(enable))
    this.updatePasswordUI()
    if (!enable) {
      this.currentPassword = ''
      this.renderPasswordDots()
    }
  }

  /**
   * 设置密码位数
   * 设置支付密码的位数，范围限制在 4-12 位
   * @param {number} length - 密码位数（4-12）
   * @author Brid9e
   */
  public setPasswordLength(length: number) {
    this.passwordLength = Math.max(4, Math.min(12, length)) // 限制在4-12位
    this.setAttribute('password-length', String(this.passwordLength))
    this.currentPassword = ''
    this.renderPasswordDots()
  }

  /**
   * 统一配置方法
   * 一次性设置所有配置项，包括拖拽、行为、密码、UI、主题等配置
   * @param {PaymentPanelConfig} config - 配置对象
   * @author Brid9e
   */
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

    this.amountLabel = config.amountLabel !== undefined
      ? (config.amountLabel || DEFAULT_CONFIG.amountLabel)
      : DEFAULT_CONFIG.amountLabel
    this.updateAmountLabel()

    // 设置主题
    if (config.theme !== undefined) {
      // setTheme 方法会自动处理空对象，重置为默认值
      this.setTheme(config.theme)
    } else {
      // 如果没有传入 theme，重置为默认主题，避免之前设置的主题影响
      this.setTheme({})
    }
  }

  /**
   * 重置为默认配置
   * 将所有配置项重置为默认值
   * @author Brid9e
   */
  public resetConfig() {
    this.setConfig({})
    // 重置支付方式为默认值（setPaymentMethods 会自动设置 hasCustomPaymentMethods = false）
    this.setPaymentMethods()
  }

  /**
   * 更新拖动滑块显示状态
   * 根据是否允许下拉关闭来控制拖动滑块的显示/隐藏
   * @author Brid9e
   */
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

  /**
   * 设置标题
   * 设置支付面板的标题文本
   * @param {string} title - 标题文本
   * @author Brid9e
   */
  public setHeaderTitle(title: string) {
    this.headerTitle = title || '支付'
    this.updateHeaderTitle()
  }

  /**
   * 更新标题显示
   * 更新 DOM 中标题元素的文本内容
   * @author Brid9e
   */
  private updateHeaderTitle() {
    const titleElement = this.shadow.querySelector('#headerTitle') as HTMLElement
    if (titleElement) {
      titleElement.textContent = this.headerTitle
    }
  }

  /**
   * 设置金额标签
   * 设置支付金额标签的文本
   * @param {string} label - 金额标签文本
   * @author Brid9e
   */
  public setAmountLabel(label: string) {
    this.amountLabel = label || '支付金额'
    this.updateAmountLabel()
  }

  /**
   * 更新金额标签显示
   * 更新 DOM 中金额标签元素的文本内容
   * @author Brid9e
   */
  private updateAmountLabel() {
    const labelElement = this.shadow.querySelector('.amount-label') as HTMLElement
    if (labelElement) {
      labelElement.textContent = this.amountLabel
    }
  }

  /**
   * 设置主题
   * 设置支付面板的主题配色，包括主色调、背景色、文本色等
   * @param {PaymentPanelConfig['theme']} theme - 主题配置对象，传入空对象会重置为默认主题
   * @author Brid9e
   */
  public setTheme(theme: PaymentPanelConfig['theme']) {
    // 如果传入空对象或 null/undefined，重置为主题默认值（空对象）
    // 这样在 render 时会使用默认值
    if (!theme || Object.keys(theme).length === 0) {
      this.theme = {}
    } else {
      this.theme = theme
    }
    // 重新渲染以应用新主题
    this.render()
    // 重新设置事件监听器
    this.setupEventListeners()
    // 重新初始化密码输入
    this.initPasswordInput()
    this.updatePasswordUI()
    this.updateDragHandleVisibility()
    // 重新渲染支付方式列表
    this.renderPaymentMethods()
    // 更新标题
    this.updateHeaderTitle()
  }

  /**
   * 获取当前主题
   * 返回当前设置的主题配置对象
   * @returns {PaymentPanelConfig['theme']} 当前主题配置对象
   * @author Brid9e
   */
  public getTheme(): PaymentPanelConfig['theme'] {
    return { ...this.theme }
  }
}

// 注册自定义元素
if (!customElements.get('payment-panel')) {
  customElements.define('payment-panel', PaymentPanel)
}

// 导出类型（从 types 文件夹重新导出）
export type { PaymentMethod, FieldMapping, PaymentPanelConfig } from './types'

export default PaymentPanel
