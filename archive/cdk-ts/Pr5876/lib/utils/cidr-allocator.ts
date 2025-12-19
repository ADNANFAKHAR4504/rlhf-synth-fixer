export class CidrAllocator {
  private static readonly BASE_CIDR = '10.0.0.0/8';

  // Environment-based CIDR allocation to avoid overlaps
  private static readonly ENVIRONMENT_CIDR_MAP: { [key: string]: string } = {
    dev: '10.10.0.0/16',
    staging: '10.20.0.0/16',
    test: '10.30.0.0/16',
    prod: '10.40.0.0/16',
    demo: '10.50.0.0/16',
  };

  /**
   * Allocate non-overlapping CIDR blocks for each environment
   * Ensures cross-account compatibility without hardcoded values
   */
  static allocateVpcCidr(environment: string): string {
    const cidr = this.ENVIRONMENT_CIDR_MAP[environment.toLowerCase()];
    if (!cidr) {
      // Fallback for unknown environments - use hash-based allocation
      const hash = (this.hashString(environment) % 200) + 60; // Range 60-259
      return `10.${hash}.0.0/16`;
    }
    return cidr;
  }

  /**
   * Generate subnet CIDRs within a VPC CIDR
   */
  static allocateSubnetCidrs(vpcCidr: string): {
    publicCidrs: string[];
    privateCidrs: string[];
    databaseCidrs: string[];
  } {
    const baseOctets = vpcCidr.split('.').slice(0, 2);
    const base = `${baseOctets[0]}.${baseOctets[1]}`;

    return {
      publicCidrs: [`${base}.1.0/24`, `${base}.2.0/24`, `${base}.3.0/24`],
      privateCidrs: [`${base}.11.0/24`, `${base}.12.0/24`, `${base}.13.0/24`],
      databaseCidrs: [`${base}.21.0/24`, `${base}.22.0/24`, `${base}.23.0/24`],
    };
  }

  /**
   * Simple string hash function for environment-based allocation
   */
  private static hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
  }
}
