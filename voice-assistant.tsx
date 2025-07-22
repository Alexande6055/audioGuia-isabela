"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Mic, MicOff, Volume2, Loader2, Send, AlertCircle, Wifi, WifiOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import type SpeechRecognition from "speech-recognition"
import { AnimatedTurtle } from "./animated-turtle"
import { processVoiceQuery, checkApiStatus } from "./app/actions/ia-actions"

type AssistantState = "idle" | "listening" | "processing" | "playing" | "error"

export default function VoiceAssistant() {
  const [state, setState] = useState<AssistantState>("idle")
  const [recordingTime, setRecordingTime] = useState(0)
  const [transcribedText, setTranscribedText] = useState("")
  const [isEditing, setIsEditing] = useState(false)
  const [confidence, setConfidence] = useState(0)
  const [isPressed, setIsPressed] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  const [apiStatus, setApiStatus] = useState<any>(null)
  const [isFallbackMode, setIsFallbackMode] = useState(false)
  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const responseAudioRef = useRef<HTMLAudioElement | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const transcribedTextRef = useRef("")
  useEffect(() => {
    // Crear elemento de audio para reproducir respuestas
    responseAudioRef.current = new Audio()
    responseAudioRef.current.onended = () => {
      setState("idle")
    }

    // Verificar configuración de API al cargar
    checkApiStatus().then((status) => {
      setApiStatus(status)
      setIsFallbackMode(status.fallbackMode)
    })

    return () => {
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current)
      }
      if (audioContextRef.current) {
        audioContextRef.current.close()
      }
    }
  }, [])

  const startListening = async () => {
    try {
      // Limpiar cualquier reconocimiento previo
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop()
          recognitionRef.current = null
        } catch (error) {
          console.log("Limpiando reconocimiento previo...")
        }
      }

      // Resetear estados completamente
      setTranscribedText("")
      setConfidence(0)
      setRecordingTime(0)
      setErrorMessage("")

      // Verificar soporte para Web Speech API
      if (!("webkitSpeechRecognition" in window) && !("SpeechRecognition" in window)) {
        setState("error")
        setErrorMessage("Tu navegador no soporta reconocimiento de voz. Usa Chrome o Edge.")
        return
      }

      // Crear una nueva instancia cada vez
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
      recognitionRef.current = new SpeechRecognition()

      // Configuración del reconocimiento
      recognitionRef.current.continuous = true
      recognitionRef.current.interimResults = true
      recognitionRef.current.lang = "es-ES"
      recognitionRef.current.maxAlternatives = 1

      // Event handlers
      recognitionRef.current.onstart = () => {
        console.log("Reconocimiento iniciado")
        setState("listening")
        setRecordingTime(0)

        recordingIntervalRef.current = setInterval(() => {
          setRecordingTime((prev) => prev + 1)
        }, 1000)
      }

      recognitionRef.current.onresult = (event) => {
        let finalTranscript = ""
        let interimTranscript = ""

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript
          const confidence = event.results[i][0].confidence

          if (event.results[i].isFinal) {
            finalTranscript += transcript
            setConfidence(confidence || 0.8)
          } else {
            interimTranscript += transcript
          }
        }

        const currentText = finalTranscript || interimTranscript
        setTranscribedText(currentText)
        transcribedTextRef.current = currentText // Guardar el texto transcrito actual
        console.log("Texto reconocido:", currentText)
      }

      recognitionRef.current.onend = () => {
        console.log("Reconocimiento terminado")

        if (recordingIntervalRef.current) {
          clearInterval(recordingIntervalRef.current)
        }

        // Solo procesar si no estamos en modo "listening" (el usuario hizo click para parar)
        if (!isPressed) {
          const textToProcess = transcribedTextRef.current.trim()
          console.log("Procesando texto:", textToProcess)

          if (textToProcess) {
            processTranscribedText(textToProcess)
          } else {
            console.log("No hay texto para procesar")
            setState("idle")
          }
        }
      }

      recognitionRef.current.onerror = (event) => {
        console.error("Error de reconocimiento:", event.error)

        if (recordingIntervalRef.current) {
          clearInterval(recordingIntervalRef.current)
        }

        setState("error")
        setIsPressed(false)
        setErrorMessage(`Error de reconocimiento: ${event.error}`)
        setTimeout(() => {
          setState("idle")
          setErrorMessage("")
        }, 3000)
      }

      // Iniciar el reconocimiento
      console.log("Iniciando reconocimiento...")
      recognitionRef.current.start()
    } catch (error) {
      console.error("Error al iniciar reconocimiento:", error)
      setState("error")
      setErrorMessage("Error al iniciar el reconocimiento de voz")
      setTimeout(() => {
        setState("idle")
        setErrorMessage("")
      }, 3000)
    }
  }

  const stopListening = () => {
    console.log("Deteniendo reconocimiento...")
    setIsPressed(false)

    if (recognitionRef.current && state === "listening") {
      try {
        recognitionRef.current.stop()
      } catch (error) {
        console.log("Error al detener reconocimiento:", error)
      }
    }
  }

  const processTranscribedText = async (text: string) => {
    console.log("Procesando texto:", text)
    setState("processing")
    setErrorMessage("")

    // Limpiar el reconocimiento completamente
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop()
        recognitionRef.current = null
      } catch (error) {
        console.log("Limpiando reconocimiento en procesamiento...")
      }
    }

    try {
      // Llamar al Server Action (siempre funciona ahora con fallback)
      const result = await processVoiceQuery(text)
      console.log("Respuesta:", result)

      const response = result.content
      setIsFallbackMode(result.fallback || false)

      // Usar Text-to-Speech del navegador para generar audio de respuesta
      const utterance = new SpeechSynthesisUtterance(response)
      utterance.lang = "es-ES"
      utterance.rate = 0.9
      utterance.pitch = 1

      utterance.onstart = () => setState("playing")
      utterance.onend = () => {
        console.log("Respuesta terminada, volviendo a idle")
        setState("idle")
        setTranscribedText("")
        setIsEditing(false)
        setConfidence(0)
      }

      utterance.onerror = (error) => {
        console.error("Error en Text-to-Speech:", error)
        setState("error")
        setErrorMessage("Error al reproducir la respuesta")
        setTimeout(() => {
          setState("idle")
          setTranscribedText("")
          setIsEditing(false)
          setConfidence(0)
          setErrorMessage("")
        }, 3000)
      }

      speechSynthesis.speak(utterance)
    } catch (error) {
      console.error("Error al procesar:", error)
      setState("error")
      setErrorMessage("Error al procesar tu consulta")

      setTimeout(() => {
        setState("idle")
        setTranscribedText("")
        setIsEditing(false)
        setConfidence(0)
        setErrorMessage("")
      }, 3000)
    }
  }

  const getStateMessage = () => {
    if (errorMessage) return errorMessage

    switch (state) {
      case "listening":
        return `Grabando... ${recordingTime}s - Haz click para enviar`
      case "processing":
        return isFallbackMode ? "Procesando con respuestas locales..." : "Consultando información de Galápagos..."
      case "playing":
        return "Compartiendo información turística..."
      case "error":
        return errorMessage || "Error con el reconocimiento de voz"
      default:
        return "Haz click para empezar a grabar"
    }
  }

  const getButtonIcon = () => {
    switch (state) {
      case "listening":
        return <MicOff className="w-8 h-8" />
      case "transcribed":
        return <Send className="w-8 h-8" />
      case "processing":
        return <Loader2 className="w-8 h-8 animate-spin" />
      case "playing":
        return <Volume2 className="w-8 h-8" />
      case "error":
        return <AlertCircle className="w-8 h-8" />
      default:
        return <Mic className="w-8 h-8" />
    }
  }

  const getButtonColor = () => {
    switch (state) {
      case "listening":
        return "bg-red-500 hover:bg-red-600 border-red-300"
      case "transcribed":
        return "bg-green-500 hover:bg-green-600 border-green-300"
      case "processing":
        return "bg-yellow-500 hover:bg-yellow-600 border-yellow-300"
      case "playing":
        return "bg-blue-500 hover:bg-blue-600 border-blue-300"
      case "error":
        return "bg-gray-500 hover:bg-gray-600 border-gray-300"
      default:
        return "bg-blue-500 hover:bg-blue-600 border-blue-300"
    }
  }

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()

    if (state === "idle") {
      // Empezar a grabar
      setIsPressed(true)
      startListening()
    } else if (state === "listening") {
      // Parar y procesar
      setIsPressed(false)
      stopListening()
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md mx-auto shadow-2xl">
        <CardContent className="p-8 text-center">
          {/* Avatar del asistente - Tortuga animada */}
          <div className="mb-6">
            <div className="flex justify-center mb-4">
              <AnimatedTurtle state={state} />
            </div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Guía Turístico de Galápagos</h1>
            <p className="text-gray-600 text-sm">{getStateMessage()}</p>
          </div>

          {/* Estado de conexión */}
          <div className="mb-4 flex justify-center">
            {isFallbackMode ? (
              <Badge variant="secondary" className="flex items-center gap-1">
                <WifiOff className="w-3 h-3" />
                Modo Local
              </Badge>
            ) : (
              <Badge variant="default" className="flex items-center gap-1">
                <Wifi className="w-3 h-3" />
                Conectado
              </Badge>
            )}
          </div>

          {/* Visualizador de audio mientras escucha */}
          {state === "listening" && (
            <div className="mb-6">
              <div className="flex justify-center space-x-1 mb-2">
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className="w-3 h-8 bg-red-500 rounded-full animate-pulse"
                    style={{
                      animationDelay: `${i * 0.1}s`,
                      animationDuration: "0.8s",
                    }}
                  />
                ))}
              </div>
              <Progress value={(recordingTime / 30) * 100} className="w-full" />
              {transcribedText && <p className="text-sm text-gray-600 mt-2 italic">"{transcribedText}"</p>}
            </div>
          )}

          {/* Botón principal */}
          <Button
            onClick={handleClick}
            disabled={state === "processing" || state === "playing"}
            className={`w-24 h-24 rounded-full border-4 transition-all duration-300 transform select-none ${state === "listening" ? "scale-95" : "hover:scale-105"
              } ${getButtonColor()}`}
            style={{ touchAction: "none" }}
          >
            {getButtonIcon()}
          </Button>

          {/* Indicadores de estado actualizados */}
          <div className="flex justify-center space-x-4 text-xs mt-4">
            <div className={`flex items-center space-x-1 ${state === "idle" ? "text-blue-600" : "text-gray-400"}`}>
              <div className="w-2 h-2 rounded-full bg-current" />
              <span>Listo</span>
            </div>
            <div className={`flex items-center space-x-1 ${state === "listening" ? "text-red-600" : "text-gray-400"}`}>
              <div className="w-2 h-2 rounded-full bg-current" />
              <span>Grabando</span>
            </div>
            <div
              className={`flex items-center space-x-1 ${state === "processing" ? "text-yellow-600" : "text-gray-400"}`}
            >
              <div className="w-2 h-2 rounded-full bg-current" />
              <span>Procesando</span>
            </div>
            <div className={`flex items-center space-x-1 ${state === "playing" ? "text-blue-600" : "text-gray-400"}`}>
              <div className="w-2 h-2 rounded-full bg-current" />
              <span>Respondiendo</span>
            </div>
          </div>

          {/* Instrucciones actualizadas */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-600">
              {state === "idle" && "Haz click en el botón para empezar a grabar"}
              {state === "listening" && "Haz click nuevamente para enviar tu consulta"}
              {state === "processing" && "Analizando tu consulta..."}
              {state === "playing" && "Escuchando la respuesta del asistente"}
              {state === "error" && "Error - intenta de nuevo"}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
