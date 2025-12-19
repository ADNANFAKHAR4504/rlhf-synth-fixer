## File 1: lib/modules.ts

```typescript
import { TerraformModule } from "cdktf";
import { AwsProvider } from "@cdktf/provider-aws/lib/provider";
import { Vpc } from "@cdktf/provider-aws/lib/vpc";
import { Subnet } from "@cdktf/provider-aws/lib/subnet";
import { Instance } from "@cdktf/provider-aws/lib/instance";
import { Construct } from "constructs";

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
export class VpcModule extends TerraformModule {
  public readonly vpc: Vpc;
  public readonly subnet: Subnet;
  public readonly subnetId: string;

  constructor(scope: Construct, id: string, config: VpcModuleConfig) {
    super(scope, id);

    // Create VPC with specified CIDR block
    this.vpc = new Vpc(this, "vpc", {
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
    
    this.subnet = new Subnet(this, "subnet", {
      vpcId: this.vpc.id,
      cidrBlock: subnetCidr,
      availabilityZone: "us-west-2a", // Hardcoded for simplicity, could be made configurable
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
export class Ec2Module extends TerraformModule {
  public readonly instance: Instance;

  constructor(scope: Construct, id: string, config: Ec2ModuleConfig) {
    super(scope, id);

    // Create EC2 instance with provided configuration
    this.instance = new Instance(this, "instance", {
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
      userData: Buffer.from(`#!/bin/bash
echo "Instance initialized for ${config.name}" > /var/log/init.log
`).toString('base64'),
    });
  }
}
```

## File 2: lib/tap-stack.ts

```typescript
import { TerraformStack } from "cdktf";
import { AwsProvider } from "@cdktf/provider-aws/lib/provider";
import { Construct } from "constructs";
import { VpcModule, Ec2Module } from "./modules";

/**
 * Configuration interface for TapStack
 */
export interface TapStackConfig {
  environment: 'dev' | 'staging' | 'production';
  region?: string;
}

/**
 * Environment-specific configuration type
 */
interface EnvironmentConfig {
  instanceType: string;
  vpcCidr: string;
  ami: string;
}

/**
 * TapStack - Main infrastructure stack that composes VPC and EC2 resources
 * 
 * This stack:
 * - Manages multi-environment configurations (dev, staging, production)
 * - Creates VPC and EC2 infrastructure using reusable modules
 * - Applies consistent tagging across all environments
 * - Uses centralized configuration mapping for easy management
 */
export class TapStack extends TerraformStack {
  public readonly vpcModule: VpcModule;
  public readonly ec2Module: Ec2Module;
  private readonly environment: string;

  /**
   * Centralized environment configuration mapping
   * This single source of truth makes it easy to manage different environment settings
   */
  private readonly environmentConfigs: Record<string, EnvironmentConfig> = {
    dev: {
      instanceType: "t2.micro",
      vpcCidr: "10.10.1.0/24",
      ami: "ami-0c02fb55956c7d316", // Amazon Linux 2 AMI (us-west-2)
    },
    staging: {
      instanceType: "t3.small",
      vpcCidr: "10.10.2.0/24",
      ami: "ami-0c02fb55956c7d316", // Amazon Linux 2 AMI (us-west-2)
    },
    production: {
      instanceType: "t3.medium",
      vpcCidr: "10.10.3.0/24",
      ami: "ami-0c02fb55956c7d316", // Amazon Linux 2 AMI (us-west-2)
    },
  };

  constructor(scope: Construct, id: string, config: TapStackConfig) {
    super(scope, id);

    this.environment = config.environment;

    // Validate environment configuration exists
    if (!this.environmentConfigs[this.environment]) {
      throw new Error(`Invalid environment: ${this.environment}. Supported environments: ${Object.keys(this.environmentConfigs).join(', ')}`);
    }

    // Get environment-specific configuration
    const envConfig = this.environmentConfigs[this.environment];

    // Configure AWS Provider
    new AwsProvider(this, "aws", {
      region: config.region || "us-west-2",
      defaultTags: [
        {
          tags: {
            Environment: this.environment,
            ManagedBy: "CDKTF",
            Project: "TapStack",
          },
        },
      ],
    });

    // Common tags applied to all resources
    const commonTags = {
      Environment: this.environment,
      ManagedBy: "CDKTF",
      Project: "TapStack",
      CreatedAt: new Date().toISOString(),
    };

    // Create VPC using environment-specific CIDR
    this.vpcModule = new VpcModule(this, "vpc-module", {
      name: `tap-${this.environment}`,
      cidrBlock: envConfig.vpcCidr,
      tags: commonTags,
    });

    // Create EC2 instance using environment-specific configuration
    // and subnet from the VPC module
    this.ec2Module = new Ec2Module(this, "ec2-module", {
      name: `tap-${this.environment}`,
      instanceType: envConfig.instanceType,
      ami: envConfig.ami,
      subnetId: this.vpcModule.subnetId,
      tags: {
        ...commonTags,
        Role: "application-server",
      },
    });

    // Log configuration for debugging (optional)
    console.log(`🚀 Deploying TapStack for environment: ${this.environment}`);
    console.log(`📊 Configuration:`, {
      instanceType: envConfig.instanceType,
      vpcCidr: envConfig.vpcCidr,
      region: config.region || "us-west-2",
    });
  }

  /**
   * Get the current environment configuration
   * Useful for accessing configuration values from outside the stack
   */
  public getEnvironmentConfig(): EnvironmentConfig {
    return this.environmentConfigs[this.environment];
  }

  /**
   * Get all available environment configurations
   * Useful for validation or documentation purposes
   */
  public static getAvailableEnvironments(): string[] {
    return ['dev', 'staging', 'production'];
  }
}
```

## Key Features and Design Decisions

### 🏗️ **Modular Architecture**
- **VpcModule**: Encapsulates VPC and subnet creation with configurable CIDR blocks
- **Ec2Module**: Handles EC2 instance provisioning with flexible configuration options
- Both modules extend `TerraformModule` for reusability across different stacks

### 🌍 **Environment Management**
- **Centralized Configuration**: Single `environmentConfigs` object manages all environment-specific settings
- **Type Safety**: TypeScript interfaces ensure configuration consistency
- **Validation**: Runtime validation prevents deployment to invalid environments

### 🏷️ **Comprehensive Tagging Strategy**
- **Default Tags**: Applied at the provider level for all resources
- **Resource-Specific Tags**: Additional tags applied per resource type
- **Environment Identification**: Clear environment tagging for resource management

### 🔧 **Production-Ready Features**
- **Error Handling**: Validates environment configurations before deployment
- **Logging**: Provides deployment feedback and configuration visibility
- **Documentation**: Comprehensive comments explaining each component's purpose
- **Extensibility**: Easy to add new environments or modify existing configurations

### 📋 **Usage Example**
This code can be used in a `main.ts` file like this:

```typescript
import { App } from "cdktf";
import { TapStack } from "./lib/tap-stack";

const app = new App();

// Deploy development environment
new TapStack(app, "tap-dev", {
  environment: "dev",
  region: "us-west-2"
});

// Deploy staging environment
new TapStack(app, "tap-staging", {
  environment: "staging",
  region: "us-west-2"
});

app.synth();
```