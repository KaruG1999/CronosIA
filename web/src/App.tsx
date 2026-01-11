import { Header } from './components/Header';
import { ChatInterface } from './components/ChatInterface';

function App() {
  return (
    <div className="min-h-screen bg-cronos-deep bg-hex-pattern">
      {/* Header */}
      <Header networkStatus="disconnected" />

      {/* Main content */}
      <main className="pt-16 h-screen">
        <div className="max-w-4xl mx-auto h-full flex flex-col">
          <ChatInterface />
        </div>
      </main>
    </div>
  );
}

export default App;
