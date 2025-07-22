export interface AudioLocation {
  id: string
  name: string
  description: string
  audioDescription: string
  coordinates: { x: number; y: number }
  accessibility: string[]
  type?: "location" | "wildlife"
  image?: string
}

export interface BirdSpecies {
  id: string
  name: string
  scientificName: string
  description: string
  audioDescription: string
  habitat: string
  bestTime: string
  image: string
  sound: string
}
