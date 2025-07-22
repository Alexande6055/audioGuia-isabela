"use server"

import axios, { isAxiosError } from "axios"
import { locations, birdSpecies } from "../data"





export async function processVoiceQuery(promptData: string) {
  // Variables de entorno para el cliente
  const IA_URL = process.env.NEXT_PUBLIC_IA_URL || ""
  const IA_API_KEY = process.env.NEXT_PUBLIC_IA_API_KEY || ""
  const IA_MODELO = process.env.NEXT_PUBLIC_IA_MODELO || "gemini-pro"
  const IA_CONECTION_ROLE = process.env.NEXT_PUBLIC_IA_CONECTION_ROLE || "user"

  const prompt = await buildPrompt(promptData)
  try {
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
      },
      {
        headers: {
          Authorization: `Bearer ${IA_API_KEY}`,
          "Content-Type": "application/json",
        },
      },
    )

    // Manejar diferentes formatos de respuesta
    if (response.data.choices && Array.isArray(response.data.choices) && response.data.choices[0]) {
      return response.data.choices[0].message?.content || response.data.choices[0]?.content || ""
    }

    // Si no hay choices, intentar con otros formatos comunes
    if (response.data.content) {
      return response.data.content
    }

    // Si la respuesta es un string directo
    if (typeof response.data === "string") {
      return response.data
    }

    // Si no se pudo extraer el contenido
    console.error("Formato de respuesta inesperado:", response.data)
    return "Lo siento, hubo un problema al procesar tu consulta. Por favor, intenta de nuevo."
  } catch (error: unknown) {
    if (isAxiosError(error)) {
      console.error("Error de llamada a la API:", error.response?.data || error.message)
    } else if (error instanceof Error) {
      console.error("Error de llamada a la API:", error.message)
    } else {
      console.error("Error de llamada a la API:", error)
    }
    throw new Error("Fallo la generacion del articulo con IA")
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

const buildPrompt = async (promptData: string) => {
  return `Eres un asistente turístico experto en la Isla Isabela, Galápagos.

Responde en español, de manera clara, amable y profesional.

Cuando te pregunten, ofrece información detallada y relevante sobre:

- Lugares turísticos (volcanes, playas, centros, etc.)
- Historia y datos naturales (erupciones, fauna, flora)
- Hoteles (nombre, dirección, descripción)
- Restaurantes (nombre y ubicación)
- Horarios, precios y accesibilidad si aplica
- Actividades disponibles en los lugares turísticos y demás

Siempre comienza alegre y entusiasta, como si vendiaras la idea al turista:


Si no sabes algo, dilo y ofrece una recomendación general.

incluye informacion importante para el turista sobre el lugar y sus actividades en esta.

No incluyas información irrelevante.

Pregunta al turista si quiere saber mas. 

Usuario: "${promptData}"

`
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
