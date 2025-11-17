import { BrowserRouter, Routes, Route } from "react-router-dom"
import Landing from "./pages/Landing"
import Login from "./pages/Login"
import Signup from "./pages/Signup"
import Projects from "./pages/Projects"
import Works from "./pages/Works"
import Subworks from "./pages/Subworks"
import SubworkDetails from "./pages/SubworkDetails"
import Profile from "./pages/Profile"
import { AppShell } from "./components/AppShell"
import RequireAuth from "./components/RequireAuth"

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route element={<RequireAuth />}>
          <Route path="/projects" element={<Projects />} />
          <Route path="/projects/:projectId/works" element={<Works />} />
          <Route path="/works/:workId/subworks" element={<Subworks />} />
          <Route path="/subworks/:subworkId/details" element={<SubworkDetails />} />
          <Route path="/profile" element={<Profile />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

  

