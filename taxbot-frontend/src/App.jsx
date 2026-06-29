import Header from './components/Header';
import ChatWindow from './components/ChatWindow';
import InputBar from './components/InputBar';
import { useChat } from './hooks/useChat';

/**
 * App — Root component for TaxBot.
 *
 * Wires the useChat hook into the Header, ChatWindow, and InputBar.
 * Layout uses a full-viewport flex column: header → chat → input bar.
 */
export default function App() {
  const { messages, isLoading, sendMessage, retryMessage, clearChat } = useChat();

  return (
    <div className="flex flex-col h-screen bg-app-bg">
      <Header isLoading={isLoading} clearChat={clearChat} />

      <ChatWindow
        messages={messages}
        isLoading={isLoading}
        onSuggestionClick={sendMessage}
        onRetry={retryMessage}
      />

      <InputBar onSend={sendMessage} isLoading={isLoading} />
    </div>
  );
}
