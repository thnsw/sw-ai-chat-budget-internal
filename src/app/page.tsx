'use client';

import { useChat } from '@ai-sdk/react';
import { useEffect, useRef } from 'react';

export default function Chat() {
  const { messages, input, handleInputChange, handleSubmit, status, stop, reload, error } = useChat();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="flex flex-col w-full max-w-md py-24 mx-auto stretch">
      {/* Message Display UI with Streaming Optimizations */}
      <div className="space-y-4 mb-4 flex-1 overflow-y-auto">
        {messages.map(message => (
          <div key={message.id} className="whitespace-pre-wrap">
            <div className="font-bold">
              {message.role === 'user' ? 'You: ' : 'Budget Assistant: '}
            </div>
            <div>{message.content}</div>
          </div>
        ))}
        
        {/* Loading indicator during streaming */}
        {status === 'submitted' && (
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900"></div>
            <span className="text-gray-500">Analyzing budget data...</span>
          </div>
        )}
        
        {status === 'streaming' && (
          <div className="flex items-center space-x-2">
            <div className="animate-pulse text-gray-500">●</div>
            <span className="text-gray-500">Budget Assistant is typing...</span>
            <button 
              type="button" 
              onClick={() => stop()}
              className="text-xs bg-red-100 hover:bg-red-200 px-2 py-1 rounded"
            >
              Stop
            </button>
          </div>
        )}
        
        {/* Auto-scroll anchor */}
        <div ref={messagesEndRef} />
      </div>

      {/* Error handling with retry */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded">
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
      <form onSubmit={handleSubmit}>
        <input
          className="fixed bottom-0 w-full max-w-md p-2 mb-8 border border-gray-300 rounded shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
          value={input}
          placeholder={status === 'ready' ? "Ask about budget performance..." : "Processing..."}
          onChange={handleInputChange}
          disabled={status !== 'ready'}
        />
      </form>
    </div>
  );
}
