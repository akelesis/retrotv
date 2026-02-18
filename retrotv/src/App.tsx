import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import LoginScreen from './pages/LoginScreen'
import PlayerScreen from './pages/PlayerScreen'
import GuideScreen from './pages/GuideScreen'
import ChannelManagerScreen from './pages/ChannelManagerScreen'

export default function App(): JSX.Element {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LoginScreen />} />
          <Route path="/player" element={<PlayerScreen />} />
          <Route path="/guide" element={<GuideScreen />} />
          <Route path="/manager" element={<ChannelManagerScreen />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
