/**
 * TypeScript representation of our Terraform infrastructure configuration
 * This file is used for unit testing and validation
 */

export interface TerraformConfig {
  terraform: {
    requiredVersion: string;
    requiredProviders: {
      aws: {
        source: string;
        version: string;
      };
      random: {
        source: string;
        version: string;
      };
    };
  };
  provider: {
    aws: {
      region: string;
      defaultTags: {
        Environment: string;
        Project: string;
        ManagedBy: string;
        EnvironmentSuffix: string;
      };
    };
  };
  variables: {
    region: string;
    availabilityZones: string[];
    vpcCidr: string;
    publicSubnetCidrs: string[];
    privateSubnetCidrs: string[];
    allowedSshCidr: string;
    environment: string;
    projectName: string;
    environmentSuffix: string;
  };
  resources: {
    vpc: VPCResource;
    subnets: SubnetResources;
    security: SecurityResources;
    s3: S3Resources;
  };
}

export interface VPCResource {
  cidrBlock: string;
  enableDnsHostnames: boolean;
  enableDnsSupport: boolean;
  internetGateway: boolean;
  natGateway: boolean;
  elasticIp: boolean;
  tags: Record<string, string>;
}

export interface SubnetResources {
  publicSubnets: {
    count: number;
    mapPublicIpOnLaunch: boolean;
    availabilityZones: string[];
  };
  privateSubnets: {
    count: number;
    availabilityZones: string[];
  };
  routeTables: {
    public: boolean;
    private: boolean;
  };
}

export interface SecurityResources {
  sshSecurityGroup: {
    ingressRules: Array<{
      fromPort: number;
      toPort: number;
      protocol: string;
      cidrBlocks: string[];
    }>;
    egressRules: Array<{
      fromPort: number;
      toPort: number;
      protocol: string;
      cidrBlocks: string[];
    }>;
  };
  vpcEndpoints: {
    s3: {
      type: string;
      serviceName: string;
      routeTableAssociations: string[];
    };
  };
}

export interface S3Resources {
  bucket: {
    versioning: boolean;
    encryption: {
      algorithm: string;
      bucketKeyEnabled: boolean;
    };
    publicAccessBlock: {
      blockPublicAcls: boolean;
      blockPublicPolicy: boolean;
      ignorePublicAcls: boolean;
      restrictPublicBuckets: boolean;
    };
    forceDestroy: boolean;
  };
  bucketPolicy: {
    denyInsecureConnections: boolean;
    denyUnencryptedUploads: boolean;
  };
}

export class TerraformInfrastructure {
  private config: TerraformConfig;

  constructor() {
    this.config = this.getDefaultConfig();
  }

  private getDefaultConfig(): TerraformConfig {
    return {
      terraform: {
        requiredVersion: '>= 1.0',
        requiredProviders: {
          aws: {
            source: 'hashicorp/aws',
            version: '~> 5.0',
          },
          random: {
            source: 'hashicorp/random',
            version: '~> 3.0',
          },
        },
      },
      provider: {
        aws: {
          region: 'us-east-1',
          defaultTags: {
            Environment: 'Production',
            Project: 'secure-infrastructure',
            ManagedBy: 'Terraform',
            EnvironmentSuffix: 'default',
          },
        },
      },
      variables: {
        region: 'us-east-1',
        availabilityZones: ['us-east-1a', 'us-east-1b'],
        vpcCidr: '10.0.0.0/16',
        publicSubnetCidrs: ['10.0.1.0/24', '10.0.2.0/24'],
        privateSubnetCidrs: ['10.0.10.0/24', '10.0.20.0/24'],
        allowedSshCidr: '192.168.1.0/24',
        environment: 'Production',
        projectName: 'secure-infrastructure',
        environmentSuffix: '',
      },
      resources: {
        vpc: {
          cidrBlock: '10.0.0.0/16',
          enableDnsHostnames: true,
          enableDnsSupport: true,
          internetGateway: true,
          natGateway: true,
          elasticIp: true,
          tags: {
            Name: 'secure-infrastructure-vpc',
          },
        },
        subnets: {
          publicSubnets: {
            count: 2,
            mapPublicIpOnLaunch: true,
            availabilityZones: ['us-east-1a', 'us-east-1b'],
          },
          privateSubnets: {
            count: 2,
            availabilityZones: ['us-east-1a', 'us-east-1b'],
          },
          routeTables: {
            public: true,
            private: true,
          },
        },
        security: {
          sshSecurityGroup: {
            ingressRules: [
              {
                fromPort: 22,
                toPort: 22,
                protocol: 'tcp',
                cidrBlocks: ['192.168.1.0/24'],
              },
            ],
            egressRules: [
              {
                fromPort: 0,
                toPort: 0,
                protocol: '-1',
                cidrBlocks: ['0.0.0.0/0'],
              },
            ],
          },
          vpcEndpoints: {
            s3: {
              type: 'Gateway',
              serviceName: 'com.amazonaws.us-east-1.s3',
              routeTableAssociations: ['public', 'private'],
            },
          },
        },
        s3: {
          bucket: {
            versioning: true,
            encryption: {
              algorithm: 'AES256',
              bucketKeyEnabled: true,
            },
            publicAccessBlock: {
              blockPublicAcls: true,
              blockPublicPolicy: true,
              ignorePublicAcls: true,
              restrictPublicBuckets: true,
            },
            forceDestroy: true,
          },
          bucketPolicy: {
            denyInsecureConnections: true,
            denyUnencryptedUploads: true,
          },
        },
      },
    };
  }

  public getConfig(): TerraformConfig {
    return this.config;
  }

  public setEnvironmentSuffix(suffix: string): void {
    this.config.variables.environmentSuffix = suffix;
    this.config.provider.aws.defaultTags.EnvironmentSuffix =
      suffix || 'default';
  }

  public getNamePrefix(): string {
    const suffix = this.config.variables.environmentSuffix;
    const projectName = this.config.variables.projectName;
    return suffix ? `${projectName}-${suffix}` : projectName;
  }

  public validateVPCConfig(): boolean {
    const vpc = this.config.resources.vpc;
    return (
      vpc.enableDnsHostnames &&
      vpc.enableDnsSupport &&
      vpc.internetGateway &&
      vpc.natGateway &&
      vpc.elasticIp
    );
  }

  public validateSubnetConfig(): boolean {
    const subnets = this.config.resources.subnets;
    return (
      subnets.publicSubnets.count === 2 &&
      subnets.privateSubnets.count === 2 &&
      subnets.publicSubnets.mapPublicIpOnLaunch &&
      subnets.routeTables.public &&
      subnets.routeTables.private
    );
  }

  public validateSecurityConfig(): boolean {
    const security = this.config.resources.security;
    const sshIngress = security.sshSecurityGroup.ingressRules[0];
    return (
      sshIngress.fromPort === 22 &&
      sshIngress.toPort === 22 &&
      sshIngress.cidrBlocks[0] === '192.168.1.0/24' &&
      security.vpcEndpoints.s3.type === 'Gateway'
    );
  }

  public validateS3Config(): boolean {
    const s3 = this.config.resources.s3;
    return (
      s3.bucket.versioning &&
      s3.bucket.encryption.algorithm === 'AES256' &&
      s3.bucket.publicAccessBlock.blockPublicAcls &&
      s3.bucket.publicAccessBlock.blockPublicPolicy &&
      s3.bucket.publicAccessBlock.ignorePublicAcls &&
      s3.bucket.publicAccessBlock.restrictPublicBuckets &&
      s3.bucketPolicy.denyInsecureConnections &&
      s3.bucketPolicy.denyUnencryptedUploads
    );
  }

  public validateProductionTags(): boolean {
    return (
      this.config.provider.aws.defaultTags.Environment === 'Production' &&
      this.config.provider.aws.defaultTags.ManagedBy === 'Terraform'
    );
  }

  public isMultiAZ(): boolean {
    return this.config.variables.availabilityZones.length >= 2;
  }

  public getRegion(): string {
    return this.config.variables.region;
  }

  public getAllowedSSHCIDR(): string {
    return this.config.variables.allowedSshCidr;
  }

  public validateRequirements(): {
    multiAZ: boolean;
    natGateway: boolean;
    s3Encryption: boolean;
    sshRestriction: boolean;
    productionTags: boolean;
  } {
    return {
      multiAZ: this.isMultiAZ(),
      natGateway: this.config.resources.vpc.natGateway,
      s3Encryption: this.validateS3Config(),
      sshRestriction: this.validateSecurityConfig(),
      productionTags: this.validateProductionTags(),
    };
  }

  public getResourceCount(): number {
    // Count all resources that will be created
    let count = 0;

    // VPC resources
    count += 1; // VPC
    count += 1; // Internet Gateway
    count += 1; // NAT Gateway
    count += 1; // Elastic IP

    // Subnets
    count += this.config.resources.subnets.publicSubnets.count;
    count += this.config.resources.subnets.privateSubnets.count;

    // Route tables and associations
    count += 2; // Public and private route tables
    count += this.config.resources.subnets.publicSubnets.count; // Public associations
    count += this.config.resources.subnets.privateSubnets.count; // Private associations

    // Security
    count += 1; // Security group
    count += 1; // VPC endpoint

    // S3
    count += 1; // Bucket
    count += 1; // Versioning
    count += 1; // Encryption
    count += 1; // Public access block
    count += 1; // Bucket policy
    count += 1; // Random ID

    return count;
  }

  public getOutputs(): string[] {
    return [
      'vpc_id',
      'vpc_cidr',
      'public_subnet_ids',
      'private_subnet_ids',
      'internet_gateway_id',
      'nat_gateway_id',
      'nat_gateway_ip',
      'ssh_security_group_id',
      's3_bucket_name',
      's3_bucket_arn',
      's3_vpc_endpoint_id',
    ];
  }
}

export default TerraformInfrastructure;
