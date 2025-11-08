/**
 * 支付方式接口
 * 定义支付方式的数据结构，支持二级分组
 * @author Brid9e
 */
export interface PaymentMethod {
  /** 允许任意字段 */
  [key: string]: any
  /** 必须有一个唯一标识 */
  value: string | number
  /** 子支付方式列表，用于二级分组 */
  children?: PaymentMethod[]
}

/**
 * 字段映射配置
 * 用于自定义支付方式数据的字段名映射
 * @author Brid9e
 */
export interface FieldMapping {
  /** 标题字段名，默认 'title' 或 'name' */
  titleField?: string
  /** 副标题字段名，默认 'subtitle' 或 'desc' 或 'description' */
  subtitleField?: string
  /** 图标字段名，默认 'icon' */
  iconField?: string
  /** 值字段名，默认 'value' 或 'id' */
  valueField?: string
}

/**
 * 主题配置
 * 定义支付面板的主题配色方案
 * @author Brid9e
 */
export interface ThemeConfig {
  /** 主色调（用于按钮、选中状态等），默认 "#238636" */
  primaryColor?: string
  /** 主色调悬停色，默认 "#2ea043" */
  primaryHoverColor?: string
  /** 遮罩层颜色，默认 "rgba(0, 0, 0, 0.5)" */
  overlayColor?: string
  /** 浅色模式下面板背景色，默认 "#ffffff"，支持渐变 */
  panelBgLight?: string
  /** 深色模式下面板背景色，默认 "#2d2d2d"，支持渐变 */
  panelBgDark?: string
  /** 浅色模式下主文本色，默认 "#24292f" */
  textPrimaryLight?: string
  /** 深色模式下主文本色，默认 "#e0e0e0" */
  textPrimaryDark?: string
  /** 浅色模式下次要文本色，默认 "#57606a" */
  textSecondaryLight?: string
  /** 深色模式下次要文本色，默认 "#999999" */
  textSecondaryDark?: string
}

/**
 * 支付面板配置
 * 定义支付面板的所有可配置项
 * @author Brid9e
 */
export interface PaymentPanelConfig {
  /** 是否允许下拉关闭，默认 true */
  allowSwipeToClose?: boolean
  /** 关闭距离阈值（像素），默认 100px */
  closeThreshold?: number
  /** 关闭距离阈值（百分比 0-1），默认 0.3 */
  closeThresholdPercent?: number
  /** 速度阈值（像素/毫秒），默认 0.5 */
  velocityThreshold?: number

  /** 点击遮罩层是否关闭，默认 true */
  closeOnOverlayClick?: boolean

  /** 是否启用密码输入，默认 false */
  enablePassword?: boolean
  /** 密码位数，默认 6 */
  passwordLength?: number

  /** 标题文本，默认 "支付" */
  headerTitle?: string
  /** 金额标签文本，默认 "支付金额" */
  amountLabel?: string

  /** 图标显示模式，默认 "always" */
  iconDisplay?: 'always' | 'never' | 'auto'

  /** 主题配置 */
  theme?: ThemeConfig
}
