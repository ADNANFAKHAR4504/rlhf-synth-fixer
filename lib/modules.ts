import { Construct } from 'constructs';
import { Vpc } from '@cdktf/provider-aws/lib/vpc';
import { Subnet } from '@cdktf/provider-aws/lib/subnet';
import { Instance } from '@cdktf/provider-aws/lib/instance';

/**
 * Configuration interface for VPC Module
 */
export interface VpcModuleConfig {
  name: string;
  cidrBlock: string;
  tags?: { [key: string]: string };
}

/**
 * VpcModule - A reusable module for creating VPC infrastructure
 *
 * This module creates:
 * - AWS VPC with specified CIDR block
 * - Public subnet within the VPC
 * - Exposes subnet ID for use by other modules
 */
export class VpcModule extends Construct {
  public readonly vpc: Vpc;
  public readonly subnet: Subnet;
  public readonly subnetId: string;

  constructor(scope: Construct, id: string, config: VpcModuleConfig) {
    super(scope, id);

    // Create VPC with specified CIDR block
    this.vpc = new Vpc(this, 'vpc', {
      cidrBlock: config.cidrBlock,
      enableDnsHostnames: true,
      enableDnsSupport: true,
      tags: {
        Name: `${config.name}-vpc`,
        ...config.tags,
      },
    });

    // Create a public subnet within the VPC
    // Using the first /28 subnet from the VPC CIDR for simplicity
    const subnetCidr = this.calculateSubnetCidr(config.cidrBlock);

    this.subnet = new Subnet(this, 'subnet', {
      vpcId: this.vpc.id,
      cidrBlock: subnetCidr,
      availabilityZone: 'us-east-1a', // Hardcoded for simplicity, could be made configurable
      mapPublicIpOnLaunch: true,
      tags: {
        Name: `${config.name}-subnet`,
        ...config.tags,
      },
    });

    // Expose subnet ID as a public property
    this.subnetId = this.subnet.id;
  }

  /**
   * Calculate a /28 subnet CIDR from the VPC CIDR
   * This is a simplified implementation for demonstration
   */
  private calculateSubnetCidr(vpcCidr: string): string {
    // Extract the base IP and convert /24 to /28
    // For example: 10.10.1.0/24 becomes 10.10.1.0/28
    const baseCidr = vpcCidr.split('/')[0];
    return `${baseCidr}/28`;
  }
}

/**
 * Configuration interface for EC2 Module
 */
export interface Ec2ModuleConfig {
  instanceType: string;
  ami: string;
  subnetId: string;
  name: string;
  tags?: { [key: string]: string };
}

/**
 * Ec2Module - A reusable module for creating EC2 instances
 *
 * This module creates:
 * - AWS EC2 instance with specified configuration
 * - Applies provided tags for resource management
 */
export class Ec2Module extends Construct {
  public readonly instance: Instance;

  constructor(scope: Construct, id: string, config: Ec2ModuleConfig) {
    super(scope, id);

    // Create EC2 instance with provided configuration
    this.instance = new Instance(this, 'instance', {
      instanceType: config.instanceType,
      ami: config.ami,
      subnetId: config.subnetId,

      // Security and networking configuration
      associatePublicIpAddress: true,

      // Apply tags for resource identification and management
      tags: {
        Name: `${config.name}-instance`,
        ...config.tags,
      },

      // Basic user data for instance initialization (optional)
      userData: Buffer.from(
        `#!/bin/bash
echo "Instance initialized for ${config.name}" > /var/log/init.log
`
      ).toString('base64'),
    });
  }
}
