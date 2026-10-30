import { StrictMode } from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router'
import { ErrorBoundary } from '../../../../shared/ui/ErrorBoundary.jsx'
import '../css/site.css'
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
if (root.hasChildNodes()) hydrateRoot(root, app)
else createRoot(root).render(app)
