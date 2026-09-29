import { BaselinePanel } from './components/BaselinePanel';
import { BroadcastPanel } from './components/BroadcastPanel';
import { RoomsPanel } from './components/RoomsPanel';
import { AckPanel } from './components/AckPanel';
import { ReconnectPanel } from './components/ReconnectPanel';
import './App.css';

function App() {
  return (
    <div className="app">
      <h1>Socket.IO Feature Showcase</h1>
      <div className="panels">
        <BaselinePanel />
        <BroadcastPanel />
        <RoomsPanel />
        <AckPanel />
        <ReconnectPanel />
      </div>
    </div>
  );
}

export default App;
