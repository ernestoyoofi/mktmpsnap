import "./index.css"
import { Toaster } from "sonner"
import { BrowserRouter, Routes, Route, Link } from "react-router-dom"

// Pages
import HomeFormStartSnap from "./pages/Home"
import ShowSnapshot from "./pages/ShowSnapshot"

function NotFound() {
  return <div className="w-full h-dvh flex flex-col items-center justify-center">
    <p>404 Not Found!</p>
    <Link to="/" className="text-blue-700 underline">Back To Home</Link>
  </div>
}

export function App() {
  return <>
    <Toaster richColors position="bottom-center"/>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomeFormStartSnap />} />
        <Route path="/mktmp/:slug" element={<ShowSnapshot />} />
        <Route path="*" element={<NotFound />} /> 
      </Routes>
    </BrowserRouter>
  </>
}

export default App
