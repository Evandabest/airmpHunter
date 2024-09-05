"use client"
import { useState } from "react";

export default function Home() {
  const [chat, setChat] = useState([
    { role: "bot", text: "Welcome to HunterMatch! How can I help you today?" },
  ]);
  const [input, setInput] = useState("");

  const handleSendMessage = async () => {
    if (input === "") {
      return;
    }
    setChat([...chat, { role: "user", text: input }]);
    setInput("");
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: input }),
      });
      console.log("Response:", response); 
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setChat((prevChat) => [...prevChat, { role: "bot", text: data.message }]);
    } catch (error) {
      console.error("Error fetching chat response:", error);
      setChat((prevChat) => [...prevChat, { role: "bot", text: "Sorry, something went wrong." }]);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-purple-600">
      <header className="bg-purple-700 py-4">
        <h1 className="text-white text-2xl font-bold text-center">Hunter Match</h1>
      </header>
      <main className="flex-grow flex flex-col p-4 bg-gray-100">
        <div className="flex-grow overflow-y-scroll mb-4 bg-white rounded-lg shadow-md p-4">
          {chat.map((message, index) => (
            <div
              key={index}
              className={`flex ${
                message.role === "user" ? "justify-end" : "justify-start"
              } mb-4`}
            >
              <div
                className={`max-w-[70%] p-3 rounded-lg ${
                  message.role === "user"
                    ? "bg-purple-100 text-right"
                    : "bg-gray-200"
                }`}
              >
                <p className="text-sm font-semibold mb-1 text-purple-700">
                  {message.role === "user" ? "Hunter Student" : "Hunter bot"}
                </p>
                <p className="text-black">{message.text}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="flex">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            className="flex-grow px-4 py-2 text-black rounded-l-lg focus:outline-none"
          />
          <button
            onClick={handleSendMessage}
            className="bg-purple-500 text-white px-6 py-2 rounded-r-lg hover:bg-purple-600 transition-colors"
          >
            Send
          </button>
        </div>
      </main>
    </div>
  );
}