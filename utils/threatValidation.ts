export const VALID_THREAT_TYPES = ['ip', 'domain', 'url', 'file_hash'] as const
export type ThreatType = typeof VALID_THREAT_TYPES[number]
export type Confidence = 'low' | 'medium' | 'high'

export function isValidThreatType(type: string): type is ThreatType {
  return VALID_THREAT_TYPES.includes(type.toLowerCase() as ThreatType)
}

export function validateThreatData(data: Record<string, unknown>) {
  if (!data.type || !data.value || !data.confidence) {
    throw new Error('Missing required fields')
  }

  if (!isValidThreatType(data.type as string)) {
    throw new Error(`Invalid type: ${data.type}. Must be one of: ${VALID_THREAT_TYPES.join(', ')}`)
  }

  if (!['low', 'medium', 'high'].includes(data.confidence as string)) {
    throw new Error('Invalid confidence level. Must be: low, medium, or high')
  }
}