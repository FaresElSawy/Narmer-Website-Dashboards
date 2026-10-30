import { StaffAccountCreate } from '../../../../shared/features/account/StaffForms.jsx'
import { useDashboard } from './DashboardContext.jsx'
import { StaffError } from './components.jsx'

export function CreateStaffAccount({ onCreated }) {
  return (
    <StaffAccountCreate dashboard={useDashboard()} ErrorView={StaffError} onCreated={onCreated} />
  )
}
