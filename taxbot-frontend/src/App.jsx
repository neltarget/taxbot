import { useState } from 'react';
import Header from './components/Header';
import ChatWindow from './components/ChatWindow';
import InputBar from './components/InputBar';
import HistoryPane from './components/HistoryPane';
import { useChatSession } from './hooks/useChatSession';

/**
 * App — Root component for TaxBot.
 *
 * Wires useChatSession into Header, ChatWindow, InputBar, and HistoryPane.
 * Uses a premium gradient background with glass panel chat container.
 */
export default function App() {
  const {
    messages,
    sessions,
    activeSessionId,
    isLoading,
    sendMessage,
    retryMessage,
    clearChat,
    switchSession,
    deleteSession,
  } = useChatSession();

  const [isHistoryOpen, setIsHistoryOpen] = useState(true);
  const toggleHistory = () => setIsHistoryOpen((prev) => !prev);

  return (
    <div className="premium-bg flex flex-col h-screen">
      <div className="flex flex-1 min-h-0">
        {/* History sidebar */}
        <HistoryPane
          isOpen={isHistoryOpen}
          onClose={() => setIsHistoryOpen(false)}
          sessions={sessions}
          activeSessionId={activeSessionId}
          onSwitch={switchSession}
          onDelete={deleteSession}
          onNewChat={clearChat}
        />

        {/* Main chat column */}
        <div className="flex-1 flex flex-col min-h-0 min-w-0">
          <Header
            isLoading={isLoading}
            clearChat={clearChat}
            isHistoryOpen={isHistoryOpen}
            toggleHistory={toggleHistory}
          />

          <div className="flex-1 flex flex-col min-h-0 glass-panel mx-0 md:mx-2 lg:mx-4 mb-2 md:mb-3 rounded-none md:rounded-xl overflow-hidden border-0 md:border border-white/[0.06]">
            <ChatWindow
              messages={messages}
              isLoading={isLoading}
              onSuggestionClick={sendMessage}
              onRetry={retryMessage}
            />

            <InputBar onSend={sendMessage} isLoading={isLoading} />
          </div>
        </div>
      </div>
    </div>
  );
}
