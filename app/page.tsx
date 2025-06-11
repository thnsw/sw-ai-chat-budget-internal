'use client';

import { useChat } from '@ai-sdk/react';
import { useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';

export default function Chat() {
  const { messages, input, handleInputChange, handleSubmit, status, stop, reload, error } = useChat();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const prevMessagesLength = useRef(messages.length);
  const prevStatus = useRef(status);

  // Improved auto-scroll: only scroll when a new message is added or streaming ends
  useEffect(() => {
    const isNewMessage = messages.length > prevMessagesLength.current;
    const streamingJustFinished = prevStatus.current === 'streaming' && status !== 'streaming';
    if (isNewMessage || streamingJustFinished) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
    prevMessagesLength.current = messages.length;
    prevStatus.current = status;
  }, [messages, status]);

  return (
    <div className="min-h-screen w-full flex flex-col bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Header */}
      <header className="w-full py-6 px-8 bg-white shadow-md flex items-center justify-between sticky top-0 z-10">
        <h1 className="text-2xl font-bold text-blue-700 tracking-tight">💬 Budget Assistant</h1>
        <span className="text-sm text-gray-400">AI-powered budget analysis</span>
      </header>

      {/* Chat Area */}
      <main className="flex-1 flex flex-col items-center justify-center w-full">
        <div className="w-full max-w-3xl flex-1 flex flex-col px-4 py-8 overflow-y-auto pb-36" style={{ minHeight: '60vh' }}>
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 select-none py-24">
              <div className="text-5xl mb-4">💡</div>
              <div className="text-lg font-medium">Ask about your budget performance, team utilization, or get an executive summary!</div>
            </div>
          )}
          {messages.map(message => (
            <div
              key={message.id}
              className={
                message.role === 'user'
                  ? 'flex w-full justify-end mb-2'
                  : 'flex w-full justify-start mb-2'
              }
            >
              <div
                className={
                  message.role === 'user'
                    ? 'bg-blue-600 text-white rounded-2xl rounded-br-sm px-5 py-3 max-w-xl shadow-md'
                    : 'bg-white text-gray-900 rounded-2xl rounded-bl-sm px-5 py-3 max-w-xl shadow border border-blue-100'
                }
              >
                <div className="text-xs font-semibold mb-1 opacity-60">
                  {message.role === 'user' ? 'You' : 'Budget Assistant'}
                </div>
                {message.role === 'assistant' ? (
                  <div className="prose prose-blue">
                    <ReactMarkdown>{message.content}</ReactMarkdown>
                  </div>
                ) : (
                  <div>{message.content}</div>
                )}
              </div>
            </div>
          ))}

          {/* Loading indicator during streaming */}
          {status === 'submitted' && (
            <div className="flex items-center space-x-2 justify-center my-4">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
              <span className="text-blue-500">Analyzing budget data...</span>
            </div>
          )}

          {status === 'streaming' && (
            <div className="flex items-center space-x-2 justify-center my-4">
              <div className="animate-pulse text-blue-500 text-lg">●</div>
              <span className="text-blue-500">Budget Assistant is typing...</span>
              <button
                type="button"
                onClick={() => stop()}
                className="text-xs bg-red-100 hover:bg-red-200 px-2 py-1 rounded ml-2"
              >
                Stop
              </button>
            </div>
          )}

          {/* Auto-scroll anchor */}
          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* Error handling with retry */}
      {error && (
        <div className="fixed bottom-24 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-md p-3 bg-red-50 border border-red-200 rounded shadow-lg">
          <div className="text-red-700 text-sm">An error occurred while processing your request.</div>
          <button
            type="button"
            onClick={() => reload()}
            className="mt-2 text-xs bg-red-100 hover:bg-red-200 px-2 py-1 rounded"
          >
            Retry
          </button>
        </div>
      )}

      {/* Input Form with Status-aware Submission */}
      <form
        onSubmit={handleSubmit}
        className="w-full flex items-center justify-center fixed bottom-0 left-0 bg-gradient-to-t from-blue-50 via-white to-transparent py-6 px-4 z-20"
        style={{ boxShadow: '0 -2px 16px 0 rgba(0,0,0,0.04)' }}
      >
        <input
          className="w-full max-w-3xl p-4 pr-32 border border-gray-300 rounded-2xl shadow-xl focus:outline-none focus:ring-2 focus:ring-blue-200 text-lg disabled:opacity-50 disabled:cursor-not-allowed bg-white"
          value={input}
          placeholder={status === 'ready' ? 'Ask about budget performance, team utilization, or executive summaries...' : 'Processing...'}
          onChange={handleInputChange}
          disabled={status !== 'ready'}
        />
        <button
          type="submit"
          disabled={status !== 'ready' || !input.trim()}
          className="absolute right-8 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2 rounded-2xl shadow transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Send
        </button>
      </form>
    </div>
  );
} 