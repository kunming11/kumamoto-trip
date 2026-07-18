export type ItemType =
  | 'attraction'
  | 'bus'
  | 'car'
  | 'hike'
  | 'food'
  | 'hotel'
  | 'flight'
  | 'taxi'
  | 'other'

export type BudgetCategory = 'transport' | 'hotel' | 'food' | 'ticket' | 'other'

export type PackCategory = 'clothes' | 'hike' | 'docs' | 'electronics' | 'toiletries'

export interface ItineraryItem {
  id: string
  time?: string
  title: string
  note?: string
  type: ItemType
  mapsQuery?: string
  done: boolean
}

export interface DayPlan {
  date: string
  label: string
  items: ItineraryItem[]
}

export interface Flight {
  id: string
  label: string
  flightNo: string
  airline: string
  fromCode: string
  fromName: string
  toCode: string
  toName: string
  departAt: string
  arriveAt: string
}

export interface Hotel {
  id: string
  name: string
  nights: string[]
  mapsQuery: string
  note?: string
}

export interface PackItem {
  id: string
  name: string
  category: PackCategory
  checked: boolean
}

export interface BudgetEntry {
  id: string
  category: BudgetCategory
  title: string
  amount: number
  date?: string
}

export interface TripState {
  title: string
  subtitle: string
  startDate: string
  endDate: string
  totalBudget: number
  currency: string
  flights: Flight[]
  hotels: Hotel[]
  days: DayPlan[]
  packing: PackItem[]
  budget: BudgetEntry[]
}
