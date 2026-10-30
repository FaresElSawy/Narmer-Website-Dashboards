import { StrictMode } from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router'
import { ErrorBoundary } from '../../../../shared/ui/ErrorBoundary.jsx'
import '../css/site.css'
import '../../../../shared/assets/css/dashboard-controls.css'
import App from '../../App.jsx'
import { restorePublicRoute } from '../../../../shared/assets/js/public-route.js'

restorePublicRoute()

const root = document.getElementById('root')
const publicData = JSON.parse(document.getElementById('narmer-public-data')?.textContent || 'null')
const router = createBrowserRouter([{ path: '*', element: <App publicData={publicData} /> }])
if (!root.hasChildNodes()) document.querySelector('[data-fallback-robots]')?.remove()
const app = (
  <StrictMode>
    <ErrorBoundary>
      <RouterProvider router={router} />
    </ErrorBoundary>
  </StrictMode>
)
// Filtered catalog URLs have no matching build-time HTML snapshot.
const filteredCatalog = /^\/(en|ar)\/products\/?$/.test(location.pathname) && location.search
if (root.hasChildNodes() && !filteredCatalog) hydrateRoot(root, app)
else createRoot(root).render(app)
