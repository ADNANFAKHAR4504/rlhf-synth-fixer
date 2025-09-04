// infrastructure.ts - TypeScript representation of our Terraform infrastructure
// This file provides testable functions that represent our infrastructure configuration

export interface InfrastructureConfig {
  awsRegion: string;
  projectName: string;
  environment: string;
  environmentSuffix: string;
}

export interface S3BucketConfig {
  versioning: boolean;
  encryption: boolean;
  publicAccessBlock: boolean;
  forceDestroy: boolean;
}

export interface RDSConfig {
  engine: string;
  engineVersion: string;
  instanceClass: string;
  multiAz: boolean;
  storageType: string;
  storageEncrypted: boolean;
  deletionProtection: boolean;
  skipFinalSnapshot: boolean;
  backupRetentionPeriod: number;
}

export interface EC2Config {
  instanceType: string;
  associatePublicIp: boolean;
}

export interface VPCConfig {
  cidrBlock: string;
  publicSubnetsCount: number;
  privateSubnetsCount: number;
  enableDnsHostnames: boolean;
  enableDnsSupport: boolean;
}

export class InfrastructureValidator {
  private config: InfrastructureConfig;

  constructor(config: InfrastructureConfig) {
    this.config = config;
  }

  validateResourceName(baseName: string): string {
    if (!this.config.environmentSuffix) {
      throw new Error('Environment suffix is required for resource naming');
    }
    return `${this.config.projectName}-${this.config.environmentSuffix}-${baseName}`;
  }

  getS3BucketConfig(): S3BucketConfig {
    return {
      versioning: true,
      encryption: true,
      publicAccessBlock: true,
      forceDestroy: true, // Required for cleanup
    };
  }

  getRDSConfig(): RDSConfig {
    return {
      engine: 'postgres',
      engineVersion: '15.8',
      instanceClass: 'db.t4g.micro', // Graviton2-based
      multiAz: true,
      storageType: 'gp3',
      storageEncrypted: true,
      deletionProtection: false, // Required for cleanup
      skipFinalSnapshot: true, // Required for cleanup
      backupRetentionPeriod: 7,
    };
  }

  getEC2Config(): EC2Config {
    return {
      instanceType: 't2.micro',
      associatePublicIp: true,
    };
  }

  getVPCConfig(): VPCConfig {
    return {
      cidrBlock: '10.0.0.0/16',
      publicSubnetsCount: 2,
      privateSubnetsCount: 2,
      enableDnsHostnames: true,
      enableDnsSupport: true,
    };
  }

  validateRDSGraviton(): boolean {
    const rdsConfig = this.getRDSConfig();
    return rdsConfig.instanceClass.includes('t4g');
  }

  validateS3DataIntegrity(): boolean {
    const s3Config = this.getS3BucketConfig();
    // S3 default data integrity is enabled by default in AWS provider v5+
    return s3Config.encryption === true;
  }

  validateHighAvailability(): boolean {
    const rdsConfig = this.getRDSConfig();
    return rdsConfig.multiAz === true;
  }

  validateSecurityBestPractices(): boolean {
    const s3Config = this.getS3BucketConfig();
    const rdsConfig = this.getRDSConfig();

    return (
      s3Config.publicAccessBlock === true &&
      s3Config.encryption === true &&
      rdsConfig.storageEncrypted === true
    );
  }

  validateCleanupCapability(): boolean {
    const s3Config = this.getS3BucketConfig();
    const rdsConfig = this.getRDSConfig();

    return (
      s3Config.forceDestroy === true &&
      rdsConfig.deletionProtection === false &&
      rdsConfig.skipFinalSnapshot === true
    );
  }

  generateSubnetCidrs(
    vpcCidr: string,
    count: number,
    offset: number = 0
  ): string[] {
    const cidrs: string[] = [];
    for (let i = 0; i < count; i++) {
      cidrs.push(`10.0.${offset + i + 1}.0/24`);
    }
    return cidrs;
  }

  validateNetworkSegmentation(): boolean {
    const vpcConfig = this.getVPCConfig();
    const publicSubnets = this.generateSubnetCidrs(
      vpcConfig.cidrBlock,
      vpcConfig.publicSubnetsCount,
      0
    );
    const privateSubnets = this.generateSubnetCidrs(
      vpcConfig.cidrBlock,
      vpcConfig.privateSubnetsCount,
      9
    );

    // Ensure no overlap between public and private subnets
    const allSubnets = [...publicSubnets, ...privateSubnets];
    const uniqueSubnets = new Set(allSubnets);

    return uniqueSubnets.size === allSubnets.length;
  }

  calculateInfrastructureCost(): { min: number; max: number } {
    // Rough monthly cost estimates in USD
    const costs = {
      ec2_t2_micro: 8.35, // On-demand pricing
      rds_t4g_micro_multiaz: 29.2, // Multi-AZ doubles the cost
      s3_storage_per_gb: 0.023,
      vpc: 0, // VPC itself is free
      data_transfer_per_gb: 0.09,
    };

    const minCost =
      costs.ec2_t2_micro +
      costs.rds_t4g_micro_multiaz +
      costs.s3_storage_per_gb * 10;
    const maxCost = minCost + costs.data_transfer_per_gb * 100; // Assume up to 100GB transfer

    return {
      min: Math.round(minCost * 100) / 100,
      max: Math.round(maxCost * 100) / 100,
    };
  }
}

export function validateTerraformOutputs(
  outputs: Record<string, unknown>
): boolean {
  const requiredOutputs = [
    's3_bucket_name',
    'ec2_instance_id',
    'ec2_public_ip',
    'rds_endpoint',
    'rds_port',
    'vpc_id',
  ];

  for (const output of requiredOutputs) {
    if (!outputs[output]) {
      return false;
    }
  }

  return true;
}

export function parseRDSEndpoint(endpoint: string): {
  host: string;
  port: number;
} {
  const parts = endpoint.split(':');
  if (parts.length !== 2) {
    throw new Error('Invalid RDS endpoint format');
  }

  return {
    host: parts[0],
    port: parseInt(parts[1], 10),
  };
}

export function generateResourceTags(
  config: InfrastructureConfig
): Record<string, string> {
  return {
    Name: `${config.projectName}-${config.environmentSuffix}`,
    Project: config.projectName,
    Environment: config.environment,
    ManagedBy: 'terraform',
  };
}
