"use server"

import axios, { isAxiosError } from "axios"
import { locations, birdSpecies } from "../data"

// Respuestas de fallback para cuando la API no funcione
const fallbackResponses = {
  saludo: [
    "¡Hola! Soy tu guía turístico de las Islas Galápagos. ¿En qué puedo ayudarte?",
    "¡Bienvenido! Estoy aquí para ayudarte a conocer las maravillas de Galápagos.",
    "¡Hola! ¿Te gustaría conocer sobre los lugares turísticos o la fauna de Galápagos?",
  ],
  lugares: [
    "En la Isla Isabela puedes visitar el Volcán Sierra Negra, uno de los volcanes más activos con una caldera impresionante. También está el Centro de Crianza de Tortugas donde se conservan las especies en peligro.",
    "Te recomiendo visitar Playa del Amor, una hermosa playa con arena blanca, y el Centro de Interpretación para aprender sobre la flora y fauna local.",
    "El Mirador de Aves es perfecto para observar especies endémicas como flamencos y pinzones de Darwin en su hábitat natural.",
  ],
  fauna: [
    "En Galápagos encontrarás especies únicas como las tortugas gigantes, iguanas marinas, lobos marinos y más de 13 especies de pinzones de Darwin.",
    "Los flamencos americanos son una de las aves más espectaculares, junto con el cormorán no volador, único en el mundo por haber perdido la capacidad de volar.",
    "Las tortugas gigantes pueden vivir más de 100 años y son el símbolo de las islas. En el Centro de Crianza puedes conocer más sobre su conservación.",
  ],
  general: [
    "Las Islas Galápagos son un paraíso natural único en el mundo, hogar de especies que no encontrarás en ningún otro lugar.",
    "Cada isla tiene características únicas. Isabela es la más grande y ofrece volcanes activos, playas hermosas y una biodiversidad increíble.",
    "La conservación es muy importante en Galápagos. Todos los visitantes deben seguir las reglas para proteger este ecosistema único.",
  ],
}

function getRandomResponse(category: keyof typeof fallbackResponses): string {
  const responses = fallbackResponses[category]
  return responses[Math.floor(Math.random() * responses.length)]
}

function generateFallbackResponse(query: string): string {
  const lowerQuery = query.toLowerCase()

  // Detectar saludos
  if (
    lowerQuery.includes("hola") ||
    lowerQuery.includes("buenos") ||
    lowerQuery.includes("buenas") ||
    lowerQuery.includes("saludos") ||
    lowerQuery.includes("hi")
  ) {
    return getRandomResponse("saludo")
  }

  // Detectar preguntas sobre lugares
  if (
    lowerQuery.includes("lugar") ||
    lowerQuery.includes("visitar") ||
    lowerQuery.includes("turístico") ||
    lowerQuery.includes("playa") ||
    lowerQuery.includes("volcán") ||
    lowerQuery.includes("centro")
  ) {
    return getRandomResponse("lugares")
  }

  // Detectar preguntas sobre fauna
  if (
    lowerQuery.includes("animal") ||
    lowerQuery.includes("ave") ||
    lowerQuery.includes("tortuga") ||
    lowerQuery.includes("iguana") ||
    lowerQuery.includes("flamenco") ||
    lowerQuery.includes("pinzón")
  ) {
    return getRandomResponse("fauna")
  }

  // Respuesta general
  return getRandomResponse("general")
}

export async function processVoiceQuery(promptData: string) {
  // Variables de entorno del servidor
  const IA_URL = process.env.IA_URL || ""
  const IA_API_KEY = process.env.IA_API_KEY || ""
  const IA_MODELO = process.env.IA_MODELO || "gpt-3.5-turbo"
  const IA_CONECTION_ROLE = process.env.IA_CONECTION_ROLE || "user"

  // Si no hay configuración de API, usar respuestas de fallback
  if (!IA_URL || !IA_API_KEY) {
    console.log("API no configurada, usando respuestas de fallback")
    return {
      success: true,
      content: generateFallbackResponse(promptData),
      fallback: true,
    }
  }

  const prompt = buildPrompt(promptData)

  try {
    console.log("Intentando conectar con API:", IA_URL.substring(0, 30) + "...")

    const response = await axios.post(
      IA_URL,
      {
        model: IA_MODELO,
        messages: [
          {
            role: IA_CONECTION_ROLE,
            content: prompt,
          },
        ],
        max_tokens: 150,
        temperature: 0.7,
      },
      {
        headers: {
          Authorization: `Bearer ${IA_API_KEY}`,
          "Content-Type": "application/json",
        },
        timeout: 15000, // 15 segundos
      },
    )

    console.log("Respuesta exitosa de la API")

    // Manejar formato OpenAI/ChatGPT
    if (response.data.choices && Array.isArray(response.data.choices) && response.data.choices[0]) {
      const content = response.data.choices[0].message?.content || response.data.choices[0]?.content || ""
      return { success: true, content: content.trim(), fallback: false }
    }

    // Manejar formato Gemini
    if (response.data.candidates && Array.isArray(response.data.candidates) && response.data.candidates[0]) {
      const content = response.data.candidates[0].content?.parts?.[0]?.text || ""
      if (content) {
        return { success: true, content: content.trim(), fallback: false }
      }
    }

    // Otros formatos
    if (response.data.content) {
      return { success: true, content: response.data.content.trim(), fallback: false }
    }

    if (typeof response.data === "string") {
      return { success: true, content: response.data.trim(), fallback: false }
    }

    // Si no se pudo extraer contenido, usar fallback
    console.log("Formato de respuesta no reconocido, usando fallback")
    return {
      success: true,
      content: generateFallbackResponse(promptData),
      fallback: true,
    }
  } catch (error: unknown) {
    console.log("Error con API, usando respuesta de fallback")

    if (isAxiosError(error)) {
      console.error("Detalles del error:", {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
      })
    }

    // Siempre devolver una respuesta de fallback en caso de error
    return {
      success: true,
      content: generateFallbackResponse(promptData),
      fallback: true,
    }
  }
}

const construccion_data = () => {
  const location = locations.map((location) => {
    return `Nombre: ${location.name}, Descripcion: ${location.description}`
  })
  const birdSpecie = birdSpecies.map((bird) => {
    return `Nombre: ${bird.name}, Descripcion: ${bird.description}`
  })
  return location.join("\n") + "\n" + birdSpecie.join("\n")
}

const buildPrompt = (promptData: string) => {
  return `Eres un asistente turístico especializado en las Islas Galápagos Isabella. 

Información disponible:
${construccion_data()}

Instrucciones:
1. Responde en español de manera breve y conversacional (máximo 2-3 oraciones)
2. Si es un saludo, responde solo con un saludo amigable
3. Si no está relacionado con Galápagos, redirige amablemente al tema
4. Usa un tono profesional pero amigable
5. No uses emojis ni caracteres especiales

Consulta del usuario: "${promptData}"

Respuesta:`
}

// Función para verificar el estado de la API
export async function checkApiStatus() {
  const IA_URL = process.env.IA_URL || ""
  const IA_API_KEY = process.env.IA_API_KEY || ""

  return {
    configured: !!(IA_URL && IA_API_KEY),
    url: IA_URL ? `${IA_URL.substring(0, 30)}...` : "No configurada",
    hasKey: !!IA_API_KEY,
    fallbackMode: !(IA_URL && IA_API_KEY),
  }
}
