import { prisma } from '@/lib/db'

export type FeatureFlags = {
  named_individuals_enabled: boolean
}

/**
 * Reads feature flags from the SiteConfig singleton.
 * Returns all flags defaulting to false if no row exists yet.
 */
export async function getFeatureFlags(): Promise<FeatureFlags> {
  const config = await prisma.siteConfig.findUnique({ where: { id: 'singleton' } })
  return {
    named_individuals_enabled: config?.named_individuals_enabled ?? false,
  }
}
