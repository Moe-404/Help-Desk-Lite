import { Navigate, Route, Routes } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import SubmitTicket from './pages/SubmitTicket'
import TicketDetails from './pages/TicketDetails'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/submit" element={<SubmitTicket />} />
      <Route path="/tickets/:ticketId" element={<TicketDetails />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
