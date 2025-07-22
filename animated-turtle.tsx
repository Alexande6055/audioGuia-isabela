"use client"

import { useEffect, useState } from "react"

interface AnimatedTurtleProps {
  state: "idle" | "listening" | "processing" | "playing" | "error"
}

export function AnimatedTurtle({ state }: AnimatedTurtleProps) {
  const [eyesBlink, setEyesBlink] = useState(false)

  // Parpadeo automático
  useEffect(() => {
    const blinkInterval = setInterval(() => {
      setEyesBlink(true)
      setTimeout(() => setEyesBlink(false), 150)
    }, 3000)

    return () => clearInterval(blinkInterval)
  }, [])

  const getTurtleAnimation = () => {
    switch (state) {
      case "listening":
        return "animate-bounce"
      case "processing":
        return "animate-pulse"
      case "playing":
        return "animate-talk"
      case "error":
        return "animate-shake"
      default:
        return "animate-breathe"
    }
  }

  const getShellColor = () => {
    switch (state) {
      case "listening":
        return "#ef4444" // red
      case "processing":
        return "#eab308" // yellow
      case "playing":
        return "#22c55e" // green
      case "error":
        return "#6b7280" // gray
      default:
        return "#3b82f6" // blue
    }
  }

  return (
    <div className="relative">
      <style jsx>{`
        @keyframes breathe {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
        @keyframes talk {
          0%, 100% { transform: scaleY(1); }
          25% { transform: scaleY(1.1); }
          50% { transform: scaleY(0.9); }
          75% { transform: scaleY(1.1); }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-2px); }
          75% { transform: translateX(2px); }
        }
        .animate-breathe {
          animation: breathe 3s ease-in-out infinite;
        }
        .animate-talk {
          animation: talk 0.5s ease-in-out infinite;
        }
        .animate-shake {
          animation: shake 0.5s ease-in-out infinite;
        }
      `}</style>

      <div className={`w-32 h-32 ${getTurtleAnimation()}`}>
        <svg viewBox="0 0 200 200" className="w-full h-full drop-shadow-lg" xmlns="http://www.w3.org/2000/svg">
          {/* Sombra */}
          <ellipse cx="100" cy="180" rx="60" ry="10" fill="rgba(0,0,0,0.2)" className="animate-pulse" />

          {/* Patas traseras */}
          <ellipse cx="70" cy="140" rx="12" ry="8" fill="#4ade80" />
          <ellipse cx="130" cy="140" rx="12" ry="8" fill="#4ade80" />

          {/* Caparazón */}
          <ellipse
            cx="100"
            cy="120"
            rx="50"
            ry="40"
            fill={getShellColor()}
            className="transition-colors duration-500"
          />

          {/* Patrón del caparazón */}
          <g fill="rgba(255,255,255,0.3)">
            <circle cx="100" cy="110" r="8" />
            <circle cx="85" cy="125" r="6" />
            <circle cx="115" cy="125" r="6" />
            <circle cx="100" cy="135" r="5" />
            <circle cx="90" cy="105" r="4" />
            <circle cx="110" cy="105" r="4" />
          </g>

          {/* Patas delanteras */}
          <ellipse cx="75" cy="100" rx="10" ry="6" fill="#4ade80" />
          <ellipse cx="125" cy="100" rx="10" ry="6" fill="#4ade80" />

          {/* Cuello */}
          <ellipse cx="100" cy="85" rx="15" ry="20" fill="#4ade80" />

          {/* Cabeza */}
          <ellipse
            cx="100"
            cy="70"
            rx="20"
            ry="18"
            fill="#4ade80"
            className={state === "playing" ? "animate-talk" : ""}
          />

          {/* Ojos */}
          <g>
            {/* Ojos blancos */}
            <circle cx="92" cy="65" r="6" fill="white" />
            <circle cx="108" cy="65" r="6" fill="white" />

            {/* Pupilas */}
            {!eyesBlink && (
              <>
                <circle cx="92" cy="65" r="3" fill="black" />
                <circle cx="108" cy="65" r="3" fill="black" />
                {/* Brillo en los ojos */}
                <circle cx="93" cy="63" r="1" fill="white" />
                <circle cx="109" cy="63" r="1" fill="white" />
              </>
            )}

            {/* Párpados cuando parpadea */}
            {eyesBlink && (
              <>
                <ellipse cx="92" cy="65" rx="6" ry="1" fill="#4ade80" />
                <ellipse cx="108" cy="65" rx="6" ry="1" fill="#4ade80" />
              </>
            )}
          </g>

          {/* Boca */}
          <g>
            {state === "playing" ? (
              // Boca abierta hablando
              <ellipse cx="100" cy="75" rx="4" ry="3" fill="#2d5016" />
            ) : state === "listening" ? (
              // Boca sorprendida
              <circle cx="100" cy="75" r="2" fill="#2d5016" />
            ) : (
              // Sonrisa normal
              <path d="M 95 75 Q 100 78 105 75" stroke="#2d5016" strokeWidth="2" fill="none" strokeLinecap="round" />
            )}
          </g>

          {/* Cola */}
          <ellipse cx="100" cy="155" rx="8" ry="5" fill="#4ade80" />

          {/* Efectos especiales según el estado */}
          {state === "listening" && (
            <g>
              {/* Ondas de sonido */}
              <circle
                cx="100"
                cy="70"
                r="35"
                fill="none"
                stroke="rgba(239, 68, 68, 0.3)"
                strokeWidth="2"
                className="animate-ping"
              />
              <circle
                cx="100"
                cy="70"
                r="45"
                fill="none"
                stroke="rgba(239, 68, 68, 0.2)"
                strokeWidth="1"
                className="animate-ping"
                style={{ animationDelay: "0.5s" }}
              />
            </g>
          )}

          {state === "processing" && (
            <g>
              {/* Puntos de pensamiento */}
              <circle cx="120" cy="50" r="2" fill="#eab308" className="animate-bounce" />
              <circle
                cx="130"
                cy="45"
                r="3"
                fill="#eab308"
                className="animate-bounce"
                style={{ animationDelay: "0.2s" }}
              />
              <circle
                cx="140"
                cy="40"
                r="4"
                fill="#eab308"
                className="animate-bounce"
                style={{ animationDelay: "0.4s" }}
              />
            </g>
          )}

          {state === "playing" && (
            <g>
              {/* Notas musicales */}
              <text x="130" y="60" fontSize="12" fill="#22c55e" className="animate-bounce">
                ♪
              </text>
              <text
                x="140"
                y="50"
                fontSize="10"
                fill="#22c55e"
                className="animate-bounce"
                style={{ animationDelay: "0.3s" }}
              >
                ♫
              </text>
              <text
                x="125"
                y="45"
                fontSize="8"
                fill="#22c55e"
                className="animate-bounce"
                style={{ animationDelay: "0.6s" }}
              >
                ♪
              </text>
            </g>
          )}
        </svg>

        {/* Mensaje de la tortuga */}
        <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2">
          <div className="bg-white rounded-full px-3 py-1 shadow-md border-2 border-gray-200">
            <p className="text-xs text-gray-600 font-medium">
              {state === "idle" && "¡Hola! 🐢"}
              {state === "listening" && "Te escucho..."}
              {state === "processing" && "Pensando..."}
              {state === "playing" && "¡Aquí tienes!"}
              {state === "error" && "¡Ups! 😅"}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
