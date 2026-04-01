import { useState, createContext, useContext } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import { useData } from './hooks/useData'
import Splash    from './components/Splash'
import Layout    from './components/Layout'
import Login     from './pages/Login'
import Home      from './pages/Home'
import Timer     from './pages/Timer'
import Records   from './pages/Records'
import Analysis  from './pages/Analysis'
import Tax       from './pages/Tax'
import MapPage   from './pages/Map'
import Community from './pages/Community'
import MyPage    from './pages/My'
import Admin     from './pages/Admin'

// データコンテキスト
export const DataCtx = createContext(null)
export const useAppData = () => useContext(DataCtx)

function Spinner() {
  return (
    <div style={{ minHeight:'100vh', display:'flex', flexDirection:'column',
      alignItems:'center', justifyContent:'center', gap:14, background:'var(--g1)' }}>
      <div className="spinner"/>
      <span style={{ fontSize:13, color:'var(--g4)' }}>読み込み中…</span>
    </div>
  )
}

function PrivateRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <Spinner />
  return user ? children : <Navigate to="/login" replace />
}
function AdminRoute({ children }) {
  const { user, isAdmin, loading } = useAuth()
  if (loading) return <Spinner />
  if (!user) return <Navigate to="/login" replace />
  if (!isAdmin) return <Navigate to="/" replace />
  return children
}

export default function App() {
  const data = useData()
  const [splashDone, setSplashDone] = useState(false)

  return (
    <DataCtx.Provider value={data}>
      {/* スプラッシュ（初回のみ） */}
      {!splashDone && <Splash onDone={() => setSplashDone(true)} />}

      <Routes>
        <Route path="/login" element={<Login />} />

        <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
          <Route index           element={<Home />} />
          <Route path="timer"    element={<Timer />} />
          <Route path="records"  element={<Records />} />
          <Route path="analysis" element={<Analysis />} />
          <Route path="tax"      element={<Tax />} />
          <Route path="map"      element={<MapPage />} />
          <Route path="community"element={<Community />} />
          <Route path="my"       element={<MyPage />} />
        </Route>

        <Route path="/admin" element={<AdminRoute><Layout /></AdminRoute>}>
          <Route index element={<Admin />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </DataCtx.Provider>
  )
}