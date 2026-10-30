import { DashboardReport } from '../features/reports/Reports.jsx'

export function DashboardOverview() {
  return <DashboardReport kind="overview" />
}
export function DashboardFinance() {
  return <DashboardReport kind="finance" />
}
export function DashboardPerformance() {
  return <DashboardReport kind="sales-performance" />
}
