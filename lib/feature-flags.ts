import { cache } from 'react'
import { prisma } from '@/lib/db'

export type FeatureFlags = {
  named_individuals_enabled: boolean
}

/**
 * Reads feature flags from the SiteConfig singleton.
 * Returns all flags defaulting to false if no row exists yet.
 * Wrapped in React cache() so multiple calls within the same render pass
 * are deduplicated to a single database query.
 */
export const getFeatureFlags = cache(async function getFeatureFlags(): Promise<FeatureFlags> {
  const config = await prisma.siteConfig.findUnique({ where: { id: 'singleton' } })
  return {
    named_individuals_enabled: config?.named_individuals_enabled ?? false,
  }
})
