// src/App.js

import React from 'react';
import Game from './components/Game'; 

function App() {
  return (
    // Aplică clasa 'dark-mode' elementului body folosind o clasă pe div-ul App.
    
    <div className="App">
      <Game />
    </div>
  );
}

export default App;