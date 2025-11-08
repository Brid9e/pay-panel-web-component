import PaymentPanel from './payment-panel'
import type { PaymentMethod, FieldMapping, PaymentPanelConfig } from './types'

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

/**
 * 获取或创建全局实例
 * 返回支付面板的全局单例实例
 * @returns {PaymentPanel} 支付面板实例
 * @author Brid9e
 */
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

/**
 * 全局API
 * 提供支付面板的全局访问接口
 * @author Brid9e
 */
const PaymentPanelAPI = {
  /**
   * 打开支付面板
   * @param {number} [amount] - 支付金额，可选
   * @author Brid9e
   */
  open(amount?: number) {
    getInstance().open(amount)
  },

  /**
   * 关闭支付面板
   * @author Brid9e
   */
  close() {
    getInstance().close()
  },

  /**
   * 设置金额
   * @param {number} amount - 支付金额
   * @author Brid9e
   */
  setAmount(amount: number) {
    getInstance().setAmount(amount)
  },

  /**
   * 设置支付方式列表
   * @param {PaymentMethod[]} [methods] - 支付方式列表，如果为空则使用默认列表
   * @param {FieldMapping} [fieldMapping] - 字段映射配置，用于自定义字段名
   * @author Brid9e
   */
  setPaymentMethods(methods?: PaymentMethod[], fieldMapping?: FieldMapping) {
    getInstance().setPaymentMethods(methods, fieldMapping)
  },

  /**
   * 获取选中的支付方式
   * @returns {PaymentMethod | null} 当前选中的支付方式，如果未选中则返回 null
   * @author Brid9e
   */
  getSelectedMethod(): PaymentMethod | null {
    return getInstance().getSelectedMethod()
  },

  /**
   * 设置关闭阈值（像素）
   * @param {number} threshold - 关闭阈值（像素）
   * @author Brid9e
   */
  setCloseThreshold(threshold: number) {
    getInstance().setCloseThreshold(threshold)
  },

  /**
   * 设置关闭阈值（百分比）
   * @param {number} percent - 关闭阈值（0-1之间）
   * @author Brid9e
   */
  setCloseThresholdPercent(percent: number) {
    getInstance().setCloseThresholdPercent(percent)
  },

  /**
   * 设置速度阈值（像素/毫秒）
   * @param {number} threshold - 速度阈值（像素/毫秒）
   * @author Brid9e
   */
  setVelocityThreshold(threshold: number) {
    getInstance().setVelocityThreshold(threshold)
  },

  /**
   * 设置点击遮罩层是否关闭
   * @param {boolean} close - 是否允许点击遮罩层关闭
   * @author Brid9e
   */
  setCloseOnOverlayClick(close: boolean) {
    getInstance().setCloseOnOverlayClick(close)
  },

  /**
   * 设置是否启用密码输入
   * @param {boolean} enable - 是否启用密码输入
   * @author Brid9e
   */
  setEnablePassword(enable: boolean) {
    getInstance().setEnablePassword(enable)
  },

  /**
   * 设置密码位数
   * @param {number} length - 密码位数（4-12）
   * @author Brid9e
   */
  setPasswordLength(length: number) {
    getInstance().setPasswordLength(length)
  },

  /**
   * 统一配置方法
   * @param {PaymentPanelConfig} config - 配置对象
   * @author Brid9e
   */
  setConfig(config: PaymentPanelConfig) {
    getInstance().setConfig(config)
  },

  /**
   * 设置标题
   * @param {string} title - 标题文本
   * @author Brid9e
   */
  setHeaderTitle(title: string) {
    getInstance().setHeaderTitle(title)
  },

  /**
   * 设置金额标签
   * @param {string} label - 金额标签文本
   * @author Brid9e
   */
  setAmountLabel(label: string) {
    getInstance().setAmountLabel(label)
  },

  /**
   * 设置主题
   * @param {PaymentPanelConfig['theme']} theme - 主题配置对象
   * @author Brid9e
   */
  setTheme(theme: PaymentPanelConfig['theme']) {
    getInstance().setTheme(theme)
  },

  /**
   * 获取当前主题
   * @returns {PaymentPanelConfig['theme']} 当前主题配置对象
   * @author Brid9e
   */
  getTheme(): PaymentPanelConfig['theme'] {
    return getInstance().getTheme()
  },

  /**
   * 重置为默认配置
   * @author Brid9e
   */
  resetConfig() {
    getInstance().resetConfig()
  },

  /**
   * 监听事件（自动去重，同一个handler只会添加一次）
   * @param {'payment-confirm' | 'payment-close'} event - 事件名称
   * @param {(e: CustomEvent) => void} handler - 事件处理函数
   * @author Brid9e
   */
  on(event: 'payment-confirm' | 'payment-close', handler: (e: CustomEvent) => void) {
    const instance = getInstance()
    // 先移除，避免重复添加
    instance.removeEventListener(event, handler as EventListener)
    // 再添加
    instance.addEventListener(event, handler as EventListener)
  },

  /**
   * 移除事件监听
   * @param {'payment-confirm' | 'payment-close'} event - 事件名称
   * @param {(e: CustomEvent) => void} handler - 事件处理函数
   * @author Brid9e
   */
  off(event: 'payment-confirm' | 'payment-close', handler: (e: CustomEvent) => void) {
    getInstance().removeEventListener(event, handler as EventListener)
  },

  /**
   * 移除所有事件监听
   * @param {'payment-confirm' | 'payment-close'} [event] - 事件名称，如果未指定则移除所有事件监听
   * @author Brid9e
   */
  removeAllListeners(event?: 'payment-confirm' | 'payment-close') {
    const instance = getInstance()
    if (event) {
      // 克隆元素以移除所有监听器（简单方法）
      const newElement = instance.cloneNode(true) as PaymentPanel
      if (instance.parentNode) {
        instance.parentNode.replaceChild(newElement, instance)
        // 重新初始化
        if (globalInstance === instance) {
          globalInstance = newElement
        }
      }
    } else {
      // 移除所有事件监听
      const newElement = instance.cloneNode(true) as PaymentPanel
      if (instance.parentNode) {
        instance.parentNode.replaceChild(newElement, instance)
        if (globalInstance === instance) {
          globalInstance = newElement
        }
      }
    }
  }
}

// 挂载到全局
if (typeof window !== 'undefined') {
  (window as any).PaymentPanel = PaymentPanelAPI
}

// 导出
export { PaymentPanelAPI }
export type { PaymentMethod, FieldMapping, PaymentPanelConfig } from './types'
export default PaymentPanelAPI
