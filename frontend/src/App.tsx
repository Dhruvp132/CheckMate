import './App.css'
import { BrowserRouter, Route, Routes } from "react-router-dom";
import Landing from './screens/Landing'; 
import { GameLanding } from './screens/GameLanding';
// import { GameLanding } from './screens/GameLanding';


function App() {
  return (
    <div className=''>
     <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} /> 
        <Route path="/game" element={<GameLanding/>} /> 
      </Routes>
    </BrowserRouter>
    </div>
  )
}

export default App