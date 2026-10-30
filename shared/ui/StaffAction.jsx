import { Link } from 'react-router'
import { Button } from './Primitives.jsx'
import { Icon } from './Brand.jsx'
import '../assets/css/dashboard-controls.css'

// Table rows use icons; primary and editor actions keep their text labels.
export function StaffAction({ action, label, to, ...props }) {
  const attributes = {
    ...props,
    className: `staff-row-icon staff-${action}-icon`,
    'aria-label': label,
    title: label,
    children: <Icon name={action === 'delete' ? 'trash' : 'edit'} />,
  }
  return to ? <Link to={to} {...attributes} /> : <Button variant="secondary" {...attributes} />
}
