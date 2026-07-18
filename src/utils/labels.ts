import type { ItemType, PackCategory, BudgetCategory } from '../types'

export const ITEM_TYPE_LABEL: Record<ItemType, string> = {
  attraction: '景點',
  bus: '巴士',
  car: '租車',
  hike: '爬山',
  food: '餐飲',
  hotel: '住宿',
  flight: '航班',
  taxi: '計程車',
  other: '其他',
}

export const PACK_CAT_LABEL: Record<PackCategory, string> = {
  docs: '證件',
  clothes: '衣物',
  hike: '登山',
  electronics: '電子',
  toiletries: '盥洗',
}

export const BUDGET_CAT_LABEL: Record<BudgetCategory, string> = {
  transport: '交通',
  hotel: '住宿',
  food: '餐飲',
  ticket: '門票',
  other: '其他',
}

export const PACK_CAT_ORDER: PackCategory[] = [
  'docs',
  'clothes',
  'hike',
  'electronics',
  'toiletries',
]
