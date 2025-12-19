/**
 * Main TapStack - Orchestrates all infrastructure components
 Addresses AZ conflicts and deployment issues
 */

import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

// Import existing component functions
import {
  createEc2InstanceRole,
  createRdsRole,
  createAlbRole,
} from './components/security/iam';
import {
  createApplicationKmsKey,
  createDatabaseKmsKey,
  createS3KmsKey,
} from './components/security/kms';
import { createVpc } from './components/vpc/vpc';
import { createSubnet } from './components/vpc/subnet'; // CHANGED: Import createSubnet instead of createSubnetGroup
import { createInternetGateway } from './components/vpc/internetGateway';
import { createMultiAzNatGateway } from './components/vpc/natGateway';
import { createRouteTables } from './components/vpc/routeTable';
import {
  createWebSecurityGroup,
  createDatabaseSecurityGroup,
  createApplicationSecurityGroup,
} from './components/security/securityGroup';
import { createHttpAlb } from './components/compute/alb'; // CHANGED: From createHttpsAlb to createHttpAlb
import { createApplicationTargetGroup } from './components/compute/targetGroup';
import {
  createLaunchTemplate,
  createAutoScalingGroup,
} from './components/compute/ec2';
import { createSecureS3Bucket } from './components/storage/s3';
import { createSecureRdsInstance } from './components/storage/rds';
import { createApplicationLogGroups } from './components/monitoring/cloudWatch';
import { createAwsConfig } from './components/monitoring/config';
import { createDatabaseCredentials } from './components/secrets/secretsManager';
import { createApplicationParameters } from './components/secrets/parameterStore';

export interface TapStackArgs {
  environmentSuffix?: string;
  regions?: string[];
  tags?: Record<string, string>;
}

// Define proper interfaces for infrastructure components
interface IdentityInfrastructure {
  ec2Role: aws.iam.Role;
  ec2RoleArn: pulumi.Output<string>;
  ec2InstanceProfile: aws.iam.InstanceProfile;
  ec2InstanceProfileArn: pulumi.Output<string>;
  rdsRole: aws.iam.Role;
  rdsRoleArn: pulumi.Output<string>;
  albRole: aws.iam.Role;
  albRoleArn: pulumi.Output<string>;
}

interface RegionalSecurityInfrastructure {
  applicationKms: ReturnType<typeof createApplicationKmsKey>;
  databaseKms: ReturnType<typeof createDatabaseKmsKey>;
  s3Kms: ReturnType<typeof createS3KmsKey>;
}

// FIXED: Updated subnet structure
interface RegionalNetworkInfrastructure {
  vpc: ReturnType<typeof createVpc>;
  publicSubnets: ReturnType<typeof createSubnet>[];
  privateSubnets: ReturnType<typeof createSubnet>[];
  publicSubnetIds: pulumi.Output<string>[];
  privateSubnetIds: pulumi.Output<string>[];
  igw: ReturnType<typeof createInternetGateway>;
  natGateways: ReturnType<typeof createMultiAzNatGateway>;
  routeTables: ReturnType<typeof createRouteTables>;
  albSg: ReturnType<typeof createWebSecurityGroup>;
  appSg: ReturnType<typeof createApplicationSecurityGroup>;
  dbSg: ReturnType<typeof createDatabaseSecurityGroup>;
}

interface RegionalSecretsInfrastructure {
  dbCredentials: ReturnType<typeof createDatabaseCredentials>;
  appParams: ReturnType<typeof createApplicationParameters>;
}

interface RegionalStorageInfrastructure {
  configBucket: ReturnType<typeof createSecureS3Bucket>;
  dataBucket: ReturnType<typeof createSecureS3Bucket>;
  database: ReturnType<typeof createSecureRdsInstance>;
}

interface RegionalComputeInfrastructure {
  targetGroup: ReturnType<typeof createApplicationTargetGroup>;
  alb: ReturnType<typeof createHttpAlb>; // CHANGED: From createHttpsAlb to createHttpAlb
  launchTemplate: ReturnType<typeof createLaunchTemplate>;
  asg: ReturnType<typeof createAutoScalingGroup>;
}

interface RegionalMonitoringInfrastructure {
  logGroups: ReturnType<typeof createApplicationLogGroups>;
  awsConfig: ReturnType<typeof createAwsConfig>;
}

// FIXED: Simple static AZ mapping based on your working regions
function getAvailabilityZones(region: string): string[] {
  const regionAzMap: Record<string, string[]> = {
    'us-west-1': ['us-west-1a', 'us-west-1b'], // LocalStack only supports us-west-1a and us-west-1b
    // Add other regions later after testing
    // 'us-east-1': ['us-east-1a', 'us-east-1b'], // Add back later
  };

  const azs = regionAzMap[region];
  if (!azs) {
    throw new Error(
      `Unsupported region: ${region}. Supported regions: ${Object.keys(regionAzMap).join(', ')}`
    );
  }

  console.log(` Region ${region} will use AZs: ${azs.join(', ')}`);
  return azs;
}

// Generate unique bucket names with validation
function generateUniqueBucketName(
  baseName: string,
  region: string,
  suffix: string
): string {
  const stackName = pulumi.getStack();
  const projectName = pulumi.getProject();

  // Create deterministic name for CI consistency
  const bucketName =
    `${baseName}-${region}-${stackName}-${projectName}-${suffix}`
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '-')
      .substring(0, 63); // S3 bucket name length limit

  console.log(`Generated bucket name: ${bucketName}`);
  return bucketName;
}

// Get different CIDR blocks per region to avoid conflicts
function getRegionalCidrBlock(region: string, index: number): string {
  // Use different /16 blocks per region to avoid conflicts
  const baseOctet = 10 + index;
  return `${baseOctet}.0.0.0/16`;
}

export class TapStack extends pulumi.ComponentResource {
  public readonly environmentSuffix: string;
  public readonly regions: string[];
  public readonly tags: Record<string, string>;

  // Infrastructure components with proper typing
  public readonly identity: IdentityInfrastructure;
  public readonly regionalSecurity: Record<
    string,
    RegionalSecurityInfrastructure
  > = {};
  public readonly regionalNetworks: Record<
    string,
    RegionalNetworkInfrastructure
  > = {};
  public readonly regionalCompute: Record<
    string,
    RegionalComputeInfrastructure
  > = {};
  public readonly regionalStorage: Record<
    string,
    RegionalStorageInfrastructure
  > = {};
  public readonly regionalMonitoring: Record<
    string,
    RegionalMonitoringInfrastructure
  > = {};
  public readonly regionalSecrets: Record<
    string,
    RegionalSecretsInfrastructure
  > = {};
  public readonly providers: Record<string, aws.Provider> = {};

  constructor(
    name: string,
    args?: TapStackArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('nova:TapStack', name, {}, opts);

    // FIXED: Start with single region deployment
    this.environmentSuffix = args?.environmentSuffix || 'prod';
    this.regions = args?.regions || ['us-west-1']; // Only us-west-1 for now
    this.tags = args?.tags || {
      Environment: this.environmentSuffix,
      Project: 'IaC-AWS-Model-Breaking',
      Application: 'secure-app',
      ManagedBy: 'Pulumi',
    };

    console.log(
      ` Starting TapStack deployment across ${this.regions.length} regions: ${this.regions.join(', ')}`
    );

    // Validate regions and AZs upfront
    this.regions.forEach((region, index) => {
      const azs = getAvailabilityZones(region);
      console.log(
        `Region ${index + 1}/${this.regions.length}: ${region} (AZs: ${azs.join(', ')})`
      );
    });

    console.log('Creating Identity and Access Infrastructure...');

    // Create shared identity infrastructure using existing components
    const ec2Role = createEc2InstanceRole(`${name}-ec2-role`, {
      name: `${name}-ec2`,
      tags: this.tags,
    });

    const rdsRole = createRdsRole(`${name}-rds-role`, {
      name: `${name}-rds`,
      tags: this.tags,
    });

    const albRole = createAlbRole(`${name}-alb-role`, {
      name: `${name}-alb`,
      tags: this.tags,
    });

    this.identity = {
      ec2Role: ec2Role.role,
      ec2RoleArn: ec2Role.roleArn,
      ec2InstanceProfile: ec2Role.instanceProfile,
      ec2InstanceProfileArn: ec2Role.instanceProfileArn,
      rdsRole: rdsRole.role,
      rdsRoleArn: rdsRole.roleArn,
      albRole: albRole.role,
      albRoleArn: albRole.roleArn,
    };

    // Sequential deployment with explicit dependencies
    let previousProvider: aws.Provider | undefined = undefined;

    for (
      let regionIndex = 0;
      regionIndex < this.regions.length;
      regionIndex++
    ) {
      const region = this.regions[regionIndex];
      const isPrimary = regionIndex === 0;
      const availabilityZones = getAvailabilityZones(region);
      const cidrBlock = getRegionalCidrBlock(region, regionIndex);

      console.log(
        `\n === REGION ${regionIndex + 1}/${this.regions.length}: ${region.toUpperCase()} ${isPrimary ? '(PRIMARY)' : '(SECONDARY)'} ===`
      );
      console.log(`    AZs: ${availabilityZones.join(', ')}`);
      console.log(`    CIDR: ${cidrBlock}`);

      // Create regional AWS provider with proper dependency handling
      console.log(`   Creating AWS provider for ${region}...`);
      const providerOpts: pulumi.ResourceOptions = {
        parent: this,
      };

      if (previousProvider) {
        providerOpts.dependsOn = [previousProvider];
      }

      this.providers[region] = new aws.Provider(
        `${name}-provider-${region}`,
        {
          region: region as aws.Region,
          profile: process.env.AWS_PROFILE,
        },
        providerOpts
      );

      console.log(`    Creating Security Infrastructure for ${region}...`);

      // Create KMS keys with regional provider
      const appKms = createApplicationKmsKey(
        `${name}-app-kms-${region}`,
        {
          name: `${name}-application-${region}`,
          description: `Application encryption key for ${region}`,
          tags: this.tags,
        },
        { provider: this.providers[region], parent: this }
      );

      const dbKms = createDatabaseKmsKey(
        `${name}-db-kms-${region}`,
        {
          name: `${name}-database-${region}`,
          description: `Database encryption key for ${region}`,
          tags: this.tags,
        },
        { provider: this.providers[region], parent: this }
      );

      const s3Kms = createS3KmsKey(
        `${name}-s3-kms-${region}`,
        {
          name: `${name}-s3-${region}`,
          description: `S3 encryption key for ${region}`,
          tags: this.tags,
        },
        { provider: this.providers[region], parent: this }
      );

      this.regionalSecurity[region] = {
        applicationKms: appKms,
        databaseKms: dbKms,
        s3Kms: s3Kms,
      };

      console.log(`    Creating Networking Infrastructure for ${region}...`);

      // Create VPC with unique CIDR per region
      const vpc = createVpc(
        `${name}-vpc-${region}`,
        {
          cidrBlock: cidrBlock,
          name: `${name}-vpc-${region}`,
          tags: this.tags,
        },
        {
          provider: this.providers[region],
          parent: this,
          dependsOn: [appKms.key],
        }
      );

      // FIXED: Create subnets individually instead of using the broken SubnetGroupComponent
      const publicSubnets: ReturnType<typeof createSubnet>[] = [];
      const privateSubnets: ReturnType<typeof createSubnet>[] = [];
      const publicSubnetIds: pulumi.Output<string>[] = [];
      const privateSubnetIds: pulumi.Output<string>[] = [];

      // Create public subnets
      const publicSubnet0 = createSubnet(
        `${name}-subnets-${region}-public-0`,
        {
          vpcId: vpc.vpcId,
          cidrBlock: `${10 + regionIndex}.0.1.0/24`,
          availabilityZone: availabilityZones[0], // us-west-1a
          isPublic: true,
          mapPublicIpOnLaunch: true,
          name: `${name}-public-0-${region}`,
          tags: this.tags,
        },
        {
          provider: this.providers[region],
          parent: this,
          dependsOn: [vpc.vpc],
        }
      );

      const publicSubnet1 = createSubnet(
        `${name}-subnets-${region}-public-1`,
        {
          vpcId: vpc.vpcId,
          cidrBlock: `${10 + regionIndex}.0.2.0/24`,
          availabilityZone: availabilityZones[1], // us-west-1b
          isPublic: true,
          mapPublicIpOnLaunch: true,
          name: `${name}-public-1-${region}`,
          tags: this.tags,
        },
        {
          provider: this.providers[region],
          parent: this,
          dependsOn: [vpc.vpc],
        }
      );

      publicSubnets.push(publicSubnet0, publicSubnet1);
      publicSubnetIds.push(publicSubnet0.subnetId, publicSubnet1.subnetId);

      // Create private subnets
      const privateSubnet0 = createSubnet(
        `${name}-subnets-${region}-private-0`,
        {
          vpcId: vpc.vpcId,
          cidrBlock: `${10 + regionIndex}.0.10.0/24`,
          availabilityZone: availabilityZones[0], // us-west-1a
          isPublic: false,
          mapPublicIpOnLaunch: false,
          name: `${name}-private-0-${region}`,
          tags: this.tags,
        },
        {
          provider: this.providers[region],
          parent: this,
          dependsOn: [vpc.vpc],
        }
      );

      const privateSubnet1 = createSubnet(
        `${name}-subnets-${region}-private-1`,
        {
          vpcId: vpc.vpcId,
          cidrBlock: `${10 + regionIndex}.0.20.0/24`,
          availabilityZone: availabilityZones[1], // us-west-1b
          isPublic: false,
          mapPublicIpOnLaunch: false,
          name: `${name}-private-1-${region}`,
          tags: this.tags,
        },
        {
          provider: this.providers[region],
          parent: this,
          dependsOn: [vpc.vpc],
        }
      );

      privateSubnets.push(privateSubnet0, privateSubnet1);
      privateSubnetIds.push(privateSubnet0.subnetId, privateSubnet1.subnetId);

      console.log(`    Creating Internet Gateway for ${region}...`);

      // Create Internet Gateway with regional provider
      const igw = createInternetGateway(
        `${name}-igw-${region}`,
        {
          vpcId: vpc.vpcId,
          name: `${name}-igw-${region}`,
          tags: this.tags,
        },
        {
          provider: this.providers[region],
          parent: this,
          dependsOn: [vpc.vpc],
        }
      );

      console.log(`    Creating NAT Gateways for ${region}...`);

      // Create NAT Gateways with regional provider
      const natGateways = createMultiAzNatGateway(
        `${name}-nat-${region}`,
        {
          publicSubnetIds: publicSubnetIds,
          name: `${name}-nat-${region}`,
          tags: this.tags,
        },
        {
          provider: this.providers[region],
          parent: this,
        }
      );

      console.log(`    Creating Route Tables for ${region}...`);

      // Create Route Tables with regional provider
      const routeTables = createRouteTables(
        `${name}-routes-${region}`,
        {
          vpcId: vpc.vpcId,
          internetGatewayId: igw.internetGatewayId,
          publicSubnetIds: publicSubnetIds,
          name: `${name}-public-${region}`,
          tags: this.tags,
        },
        {
          vpcId: vpc.vpcId,
          natGatewayIds: natGateways.natGatewayIds,
          privateSubnetIds: privateSubnetIds,
          name: `${name}-private-${region}`,
          tags: this.tags,
        },
        {
          provider: this.providers[region],
          parent: this,
        }
      );

      console.log(`     Creating Security Groups for ${region}...`);

      // Create security groups with regional provider
      const albSg = createWebSecurityGroup(
        `${name}-alb-sg-${region}`,
        {
          name: `${name}-alb-sg-${region}`,
          vpcId: vpc.vpcId,
          tags: this.tags,
        },
        {
          provider: this.providers[region],
          parent: this,
          dependsOn: [vpc.vpc],
        }
      );

      const appSg = createApplicationSecurityGroup(
        `${name}-app-sg-${region}`,
        {
          name: `${name}-app-sg-${region}`,
          vpcId: vpc.vpcId,
          albSecurityGroupId: albSg.securityGroupId,
          tags: this.tags,
        },
        {
          provider: this.providers[region],
          parent: this,
        }
      );

      const dbSg = createDatabaseSecurityGroup(
        `${name}-db-sg-${region}`,
        {
          name: `${name}-db-sg-${region}`,
          vpcId: vpc.vpcId,
          webSecurityGroupId: appSg.securityGroupId,
          tags: this.tags,
        },
        {
          provider: this.providers[region],
          parent: this,
        }
      );

      this.regionalNetworks[region] = {
        vpc,
        publicSubnets,
        privateSubnets,
        publicSubnetIds,
        privateSubnetIds,
        igw,
        natGateways,
        routeTables,
        albSg,
        appSg,
        dbSg,
      };

      console.log(`    Creating Secrets Infrastructure for ${region}...`);

      // Create secrets and parameters with regional provider
      const dbCredentials = createDatabaseCredentials(
        `${name}-db-creds-${region}`,
        {
          name: `${name}-${region}`,
          username: 'admin',
          password: pulumi.output('temp-password-to-be-rotated'),
          host: 'placeholder-host',
          port: '3306',
          dbname: 'appdb',
          engine: 'mysql',
          kmsKeyId: dbKms.keyArn,
          tags: this.tags,
        },
        { provider: this.providers[region], parent: this }
      );

      const appParams = createApplicationParameters(
        `${name}-app-params-${region}`,
        {
          name: `${name}-${region}`,
          parameters: {
            'app-env': {
              value: this.environmentSuffix,
              type: 'String',
              description: 'Application environment',
            },
            'app-version': {
              value: '1.0.0',
              type: 'String',
              description: 'Application version',
            },
            region: {
              value: region,
              type: 'String',
              description: 'Deployment region',
            },
          },
          kmsKeyId: appKms.keyArn,
          tags: this.tags,
        },
        { provider: this.providers[region], parent: this }
      );

      this.regionalSecrets[region] = {
        dbCredentials,
        appParams,
      };

      console.log(`    Creating Storage Infrastructure for ${region}...`);

      // Create S3 buckets with regional provider and unique naming
      const configBucket = createSecureS3Bucket(
        `${name}-config-bucket-${region}`,
        {
          name: `${name}-config-${region}`,
          bucketName: generateUniqueBucketName(
            `${name}-config`,
            region,
            'config'
          ),
          kmsKeyId: s3Kms.keyArn,
          enableVersioning: true,
          enableLifecycle: true,
          tags: { ...this.tags, Region: region },
        },
        { provider: this.providers[region], parent: this }
      );

      const dataBucket = createSecureS3Bucket(
        `${name}-data-bucket-${region}`,
        {
          name: `${name}-data-${region}`,
          bucketName: generateUniqueBucketName(`${name}-data`, region, 'data'),
          kmsKeyId: s3Kms.keyArn,
          enableVersioning: true,
          enableLifecycle: true,
          tags: { ...this.tags, Region: region },
        },
        { provider: this.providers[region], parent: this }
      );

      console.log(`     Creating Database for ${region}...`);

      // FIXED: Now privateSubnetIds is properly typed as pulumi.Output<string>[]
      const database = createSecureRdsInstance(
        `${name}-db-${region}`,
        {
          name: `${name}-db-${region}`,
          identifier: `${name}-db-${region}`,
          instanceClass: 'db.t3.medium',
          allocatedStorage: 20,
          dbName: 'appdb',
          username: 'admin',
          subnetIds: privateSubnetIds, // Now this is correctly typed
          securityGroupIds: [dbSg.securityGroupId],
          kmsKeyId: dbKms.keyArn,
          backupRetentionPeriod: 7,
          performanceInsightsEnabled: true,
          tags: { ...this.tags, Region: region },
        },
        { provider: this.providers[region], parent: this }
      );

      this.regionalStorage[region] = {
        configBucket,
        dataBucket,
        database,
      };

      console.log(`    Creating Compute Infrastructure for ${region}...`);

      // Create target group with regional provider
      const targetGroup = createApplicationTargetGroup(
        `${name}-tg-${region}`,
        {
          name: `${name}-tg-${region}`,
          port: 8080,
          vpcId: vpc.vpcId,
          healthCheckPath: '/health',
          tags: this.tags,
        },
        { provider: this.providers[region], parent: this }
      );

      // CHANGED: Create HTTP-only ALB (no certificate required)
      const alb = createHttpAlb(
        `${name}-alb-${region}`,
        {
          name: `${name}-alb-${region}`,
          subnetIds: publicSubnetIds,
          securityGroupIds: [albSg.securityGroupId],
          targetGroupArn: targetGroup.targetGroupArn,
          tags: this.tags,
        },
        { provider: this.providers[region], parent: this }
      );

      // Create launch template with regional provider
      const launchTemplate = createLaunchTemplate(
        `${name}-lt-${region}`,
        {
          name: `${name}-lt-${region}`,
          instanceType: 't3.micro',
          securityGroupIds: [appSg.securityGroupId],
          iamInstanceProfile: {
            arn: this.identity.ec2InstanceProfileArn,
          },
          blockDeviceMappings: [
            {
              deviceName: '/dev/xvda',
              ebs: {
                volumeType: 'gp3',
                volumeSize: 20,
                deleteOnTermination: true,
                encrypted: true,
                kmsKeyId: appKms.keyArn,
              },
            },
          ],
          tags: this.tags,
        },
        { provider: this.providers[region], parent: this }
      );

      // Create auto scaling group with regional provider
      const asg = createAutoScalingGroup(
        `${name}-asg-${region}`,
        {
          name: `${name}-asg-${region}`,
          minSize: 2,
          maxSize: 10,
          desiredCapacity: 2,
          subnetIds: privateSubnetIds,
          targetGroupArns: [targetGroup.targetGroupArn],
          launchTemplate: {
            id: launchTemplate.launchTemplateId,
            version: '$Latest',
          },
          tags: this.tags,
        },
        { provider: this.providers[region], parent: this }
      );

      this.regionalCompute[region] = {
        targetGroup,
        alb,
        launchTemplate,
        asg,
      };

      console.log(`    Creating Monitoring Infrastructure for ${region}...`);

      // Create log groups with regional provider
      const logGroups = createApplicationLogGroups(`${name}-logs-${region}`, {
        name: `${name}-${region}`,
        retentionInDays: 90,
        // kmsKeyId: appKms.keyArn,
        tags: this.tags,
      });

      // Create AWS Config with regional provider
      const awsConfig = createAwsConfig(`${name}-config-${region}`, {
        name: `${name}-config-${region}`,
        s3BucketName: configBucket.bucketId,
        // s3KmsKeyArn: appKms.keyArn,
        tags: this.tags,
      });

      this.regionalMonitoring[region] = {
        logGroups,
        awsConfig,
      };

      // Set previous provider for sequential deployment
      previousProvider = this.providers[region];

      console.log(`    Region ${region} infrastructure complete!`);
    }

    // Register outputs
    this.registerOutputs({
      environmentSuffix: this.environmentSuffix,
      regions: this.regions,
      identityEc2RoleArn: this.identity.ec2RoleArn,
      primaryRegionVpcId: this.regionalNetworks[this.regions[0]]?.vpc.vpcId,
      primaryRegionAlbDnsName:
        this.regionalCompute[this.regions[0]]?.alb.dnsName,
      regionalVpcIds: Object.fromEntries(
        this.regions.map(region => [
          region,
          this.regionalNetworks[region]?.vpc.vpcId,
        ])
      ),
      regionalAlbDnsNames: Object.fromEntries(
        this.regions.map(region => [
          region,
          this.regionalCompute[this.regions[0]]?.alb.dnsName,
        ])
      ),
    });

    console.log(
      `\n TapStack deployment complete across ${this.regions.length} regions: ${this.regions.join(', ')}`
    );
    console.log(
      `  Total resources deployed: ${this.regions.length * 15}+ resources across all regions`
    );
  }
}
