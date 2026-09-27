export type DomainName =
  | 'social_communication'
  | 'sensory_processing'
  | 'executive_function'
  | 'emotional_regulation'
  | 'motor_coordination'

export type Band = 'minimal' | 'mild' | 'moderate' | 'substantial'

export type DomainScore = {
  percentage: number | null
  band: Band | null
}
