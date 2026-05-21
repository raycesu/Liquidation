export const MAX_ROOM_DESCRIPTION_WORDS = 25

export const normalizeRoomDescription = (description: string) =>
  description.trim().replace(/\s+/g, " ")

export const getDescriptionWordCount = (description: string) =>
  description.split(/\s+/).filter(Boolean).length

export const isDescriptionWithinWordLimit = (
  description: string,
  maxWords: number = MAX_ROOM_DESCRIPTION_WORDS,
) => getDescriptionWordCount(normalizeRoomDescription(description)) <= maxWords
