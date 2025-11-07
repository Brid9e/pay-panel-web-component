import PaymentPanel, { PaymentMethod, FieldMapping } from './payment-panel'

// 确保自定义元素已注册
if (typeof window !== 'undefined' && !customElements.get('payment-panel')) {
  customElements.define('payment-panel', PaymentPanel)
}

// 全局注册（可选）
declare global {
  interface HTMLElementTagNameMap {
    'payment-panel': PaymentPanel
  }
}

// 全局单例实例
let globalInstance: PaymentPanel | null = null

// 获取或创建全局实例
function getInstance(): PaymentPanel {
  if (!globalInstance) {
    // 确保自定义元素已注册
    if (typeof window !== 'undefined' && !customElements.get('payment-panel')) {
      customElements.define('payment-panel', PaymentPanel)
    }

    // 确保 DOM 已准备好
    if (document.body) {
      globalInstance = document.createElement('payment-panel') as PaymentPanel
      document.body.appendChild(globalInstance)
    } else {
      // 如果 body 还没准备好，等待 DOMContentLoaded
      throw new Error('PaymentPanel: document.body is not ready. Please wait for DOMContentLoaded.')
    }
  }
  return globalInstance
}

// 全局API
const PaymentPanelAPI = {
  // 打开支付面板
  open(amount?: number) {
    getInstance().open(amount)
  },

  // 关闭支付面板
  close() {
    getInstance().close()
  },

  // 设置金额
  setAmount(amount: number) {
    getInstance().setAmount(amount)
  },

  // 设置支付方式列表
  setPaymentMethods(methods: PaymentMethod[], fieldMapping?: FieldMapping) {
    getInstance().setPaymentMethods(methods, fieldMapping)
  },

  // 获取选中的支付方式
  getSelectedMethod(): PaymentMethod | null {
    return getInstance().getSelectedMethod()
  },

  // 设置关闭阈值
  setCloseThreshold(threshold: number) {
    getInstance().setCloseThreshold(threshold)
  },

  setCloseThresholdPercent(percent: number) {
    getInstance().setCloseThresholdPercent(percent)
  },

  setVelocityThreshold(threshold: number) {
    getInstance().setVelocityThreshold(threshold)
  },

  // 设置点击遮罩层是否关闭
  setCloseOnOverlayClick(close: boolean) {
    getInstance().setCloseOnOverlayClick(close)
  },

  // 监听事件
  on(event: 'payment-confirm' | 'payment-close', handler: (e: CustomEvent) => void) {
    getInstance().addEventListener(event, handler as EventListener)
  },

  // 移除事件监听
  off(event: 'payment-confirm' | 'payment-close', handler: (e: CustomEvent) => void) {
    getInstance().removeEventListener(event, handler as EventListener)
  }
}

// 挂载到全局
if (typeof window !== 'undefined') {
  (window as any).PaymentPanel = PaymentPanelAPI
}

// 导出
export { PaymentPanelAPI, PaymentMethod, FieldMapping }
export default PaymentPanelAPI
