## lib/modules.ts
```typescript
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
```

## lib/tap-stack.ts

```typescript
import {
  AwsProvider,
  AwsProviderDefaultTags,
} from '@cdktf/provider-aws/lib/provider';
import { S3Backend, TerraformStack, TerraformOutput } from 'cdktf';
import { Construct } from 'constructs';

// ? Import your stacks here
import { VpcModule, Ec2Module } from './modules';

interface TapStackProps {
  environmentSuffix?: string;
  stateBucket?: string;
  stateBucketRegion?: string;
  awsRegion?: string;
  defaultTags?: AwsProviderDefaultTags;
}

// If you need to override the AWS Region for the terraform provider for any particular task,
// you can set it here. Otherwise, it will default to 'us-east-1'.

const AWS_REGION_OVERRIDE = '';

export class TapStack extends TerraformStack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id);

    const environmentSuffix = props?.environmentSuffix || 'dev';
    const awsRegion = AWS_REGION_OVERRIDE
      ? AWS_REGION_OVERRIDE
      : props?.awsRegion || 'us-east-1';
    const stateBucketRegion = props?.stateBucketRegion || 'us-east-1';
    const stateBucket = props?.stateBucket || 'iac-rlhf-tf-states';
    const defaultTags = props?.defaultTags ? [props.defaultTags] : [];

    // Configure AWS Provider - this expects AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY to be set in the environment
    new AwsProvider(this, 'aws', {
      region: awsRegion,
      defaultTags: defaultTags,
    });

    // Configure S3 Backend with native state locking
    new S3Backend(this, {
      bucket: stateBucket,
      key: `${environmentSuffix}/${id}.tfstate`,
      region: stateBucketRegion,
      encrypt: true,
    });
    // Using an escape hatch instead of S3Backend construct - CDKTF still does not support S3 state locking natively
    // ref - https://developer.hashicorp.com/terraform/cdktf/concepts/resources#escape-hatch
    this.addOverride('terraform.backend.s3.use_lockfile', true);

    // ? Add your stack instantiations here
    // ! Do NOT create resources directly in this stack.
    // ! Instead, create separate stacks for each resource type.

    // Create VPC module
    const vpcModule = new VpcModule(this, 'vpc-module', {
      name: `tap-${environmentSuffix}`,
      cidrBlock: '10.0.0.0/24',
      tags: {
        Environment: environmentSuffix,
      },
    });

    // Create EC2 module
    const ec2Module = new Ec2Module(this, 'ec2-module', {
      instanceType: 't3.micro',
      ami: 'ami-0e95a5e2743ec9ec9', // Amazon Linux 2 AMI (adjust based on your region)
      subnetId: vpcModule.subnetId,
      name: `tap-${environmentSuffix}`,
      tags: {
        Environment: environmentSuffix,
      },
    });

    // Outputs for reference
    new TerraformOutput(this, 'vpc-id', {
      value: vpcModule.vpc.id,
      description: 'VPC ID',
    });

    new TerraformOutput(this, 'subnet-id', {
      value: vpcModule.subnet.id,
      description: 'Subnet ID',
    });

    new TerraformOutput(this, 'ec2-instance-id', {
      value: ec2Module.instance.id,
      description: 'EC2 instance ID',
    });

    new TerraformOutput(this, 'ec2-private-ip', {
      value: ec2Module.instance.privateIp,
      description: 'EC2 instance private IP address',
    });

    new TerraformOutput(this, 'ec2-public-ip', {
      value: ec2Module.instance.publicIp,
      description: 'EC2 instance public IP address',
    });
  }
}
```
