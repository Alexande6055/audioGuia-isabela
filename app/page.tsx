"use client"
import { useState } from "react"
import VoiceAssistant from "../voice-assistant"

export default function Home() {
  const [started, setStarted] = useState(false)

  const handleStart = () => {
    const audio = new Audio("/bienvenida.mp3")
    audio.play().then(() => setStarted(true))
  }

  if (!started) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="bg-white rounded-3xl shadow-2xl p-12 text-center max-w-lg w-full">
          <h1 className="text-4xl font-extrabold mb-6 text-blue-800 drop-shadow">Bienvenido</h1>
          <button
            className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-12 py-6 rounded-full text-2xl font-bold shadow-lg hover:scale-105 hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 outline-none focus:ring-4 focus:ring-blue-300"
            style={{ letterSpacing: "2px" }}
            onClick={handleStart}
          >
            🚀 Iniciar Asistente
          </button>
        </div>
      </div>
    )
  }

  return <VoiceAssistant />
}