"use client"
import { useEffect } from "react"
import VoiceAssistant from "../voice-assistant"

export default function Home() {
  useEffect(() => {
    const welcome = "Hola, soy tu asistente Audioguía de Galápagos, centralizado en Isabela de la empresa turística ElecGalap. ¡Bienvenido!";
    const utterance = new window.SpeechSynthesisUtterance(welcome)
    utterance.lang = "es-ES"
    utterance.rate = 0.95
    utterance.pitch = 1
    // Solo reproducir si hay voces disponibles y el usuario ya interactuó
    const speak = () => {
      window.speechSynthesis.speak(utterance)
    }
    // Chrome requiere interacción, así que intentamos tras un click
    if (typeof window !== "undefined") {
      if (window.speechSynthesis.getVoices().length === 0) {
        window.speechSynthesis.onvoiceschanged = speak
      } else {
        speak()
      }
    }
    return () => {
      window.speechSynthesis.cancel()
    }
  }, [])

  return <VoiceAssistant />
}