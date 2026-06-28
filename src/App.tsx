import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { SettingsProvider } from './context/SettingsContext'
import { AppHeader } from './components/AppHeader'
import { routes } from './routes'

function App() {
  return (
    <SettingsProvider>
      <BrowserRouter>
        <div className="min-h-full">
          <AppHeader />
          <main className="mx-auto max-w-7xl px-5 py-6">
            <Routes>
              {routes.map((r) => (
                <Route key={r.path} path={r.path} element={r.element} />
              ))}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </SettingsProvider>
  )
}

export default App
