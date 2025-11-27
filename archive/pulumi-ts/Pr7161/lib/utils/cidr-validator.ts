import * as pulumi from '@pulumi/pulumi';

interface CidrConfig {
  env: string;
  cidr: string;
}

export function validateCidrOverlap(
  allCidrs: CidrConfig[],
  currentEnv: string,
  currentCidr: string
): void {
  // Parse CIDR block
  const parseCidr = (cidr: string): { base: number; mask: number } => {
    const [ip, mask] = cidr.split('/');
    const octets = ip.split('.').map(Number);
    const base =
      (octets[0] << 24) + (octets[1] << 16) + (octets[2] << 8) + octets[3];
    return { base, mask: parseInt(mask) };
  };

  // Check if two CIDR blocks overlap
  const cidrsOverlap = (cidr1: string, cidr2: string): boolean => {
    const c1 = parseCidr(cidr1);
    const c2 = parseCidr(cidr2);

    const mask1 = ~((1 << (32 - c1.mask)) - 1);
    const mask2 = ~((1 << (32 - c2.mask)) - 1);

    const network1 = c1.base & mask1;
    const network2 = c2.base & mask2;

    const smallerMask = Math.min(c1.mask, c2.mask);
    const mask = ~((1 << (32 - smallerMask)) - 1);

    return (network1 & mask) === (network2 & mask);
  };

  // Find the expected CIDR for the current environment (if it exists in the list)
  const expectedConfig = allCidrs.find(config => config.env === currentEnv);

  // If environment is in the list, validate it matches the expected CIDR
  if (expectedConfig) {
    if (currentCidr !== expectedConfig.cidr) {
      throw new Error(
        `CIDR mismatch: ${currentEnv} expected ${expectedConfig.cidr} but got ${currentCidr}`
      );
    }
  } else {
    // For dynamic environments (like PR stacks), just log that it's not in the predefined list
    pulumi.log.info(
      `Environment '${currentEnv}' is not in predefined CIDR list. Validating for overlaps only.`
    );
  }

  // Validate current CIDR against all other environments for overlaps
  for (const config of allCidrs) {
    if (config.env !== currentEnv && cidrsOverlap(currentCidr, config.cidr)) {
      throw new Error(
        `CIDR overlap detected: ${currentEnv} (${currentCidr}) overlaps with ${config.env} (${config.cidr})`
      );
    }
  }

  pulumi.log.info(
    `CIDR validation passed: ${currentEnv} (${currentCidr}) does not overlap with other environments`
  );
}
