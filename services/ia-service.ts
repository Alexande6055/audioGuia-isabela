import axios, { isAxiosError } from "axios"
import { locations, birdSpecies } from "../app/data"

export const generatedContent = async (promptData: string) => {
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

/**
 * esta funcion cojera la data que se encuentra en el archivo data.ts
 * y la construira en un string para poder ser usada en el prompt
 */
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
  return `Eres un asistente turístico especializado en las Islas Galápagos Isabella. 

Información que tienes se recomienda:
${construccion_data()}

Instrucciones para responder:
1. Si el mensaje del usuario es un saludo (como "hola", "buenos días", etc.), responde solo con un saludo breve y amigable. No proporciones información adicional.
2. Si el mensaje no está relacionado con Galápagos, responde:
   "Lo siento, pero me especializo en información sobre Galápagos. ¿Te gustaría saber sobre algún lugar turístico o especie de ave en particular?"
4. Mantén las respuestas en español, con un tono profesional, amable y conversacional.
5. Evita el uso de caracteres especiales o emojis.
6. En caso de necesitar informacion adicional o externa a la que se recomiendda eres libre de obtenerlas de otras fuentes

Mensaje del usuario:
"${promptData}"

}
