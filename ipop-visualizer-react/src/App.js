// import logo from './logo.svg';
// import './App.css';
import React from 'react';
// import './CSS/Global.css'
// import './CSS/Component.css'
import 'bootstrap/dist/css/bootstrap.min.css';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import Tool from './Components/SAGE2/Tool';
import Overlay from './Components/SAGE2/Overlay';
import Graph from './Components/SAGE2/Graph'
import Search from './Components/SAGE2/Search';

// import Header from './Components/Common/Header';
// import ipop_ic from './Images/Icons/ipop_ic.svg';
// import SystemContent from './Components/Common/SystemContent';

// function App() {
//   return (
//     <>
//       <Header src={ipop_ic} alt="ipop_ic">IPOP NETWORK VISUALIZER</Header>
//       <SystemContent />
//     </>
//   );
// }

// SAGE2_version
function App(){
  return(
    <>
    <Router>
      <Switch>
        <Route exact path="/">
          <Tool/>
        </Route>
        <Route exact path="/overlay">
          <Overlay/>
        </Route>
        <Route exact path="/graph">
          <Graph/>
        </Route>
        <Route exact path="/search">
          <Search/>
        </Route>
      </Switch>
    </Router>
    </>
  )
}

export default App;
