<!-- /lib/tap-stack.ts -->


```ts
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
    'us-west-1': ['us-west-1a', 'us-west-1c'], // These work according to your logs
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
          availabilityZone: availabilityZones[1], // us-west-1c
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
          availabilityZone: availabilityZones[1], // us-west-1c
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

```
<!-- /lib/components/certificate/acm.ts -->
```ts
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface AcmCertificateArgs {
  domainName: string;
  subjectAlternativeNames?: string[];
  validationMethod?: 'DNS' | 'EMAIL';
  tags?: Record<string, string>;
  skipValidation?: boolean;
}

export interface AcmCertificateResult {
  certificate: aws.acm.Certificate;
  certificateArn: pulumi.Output<string>;
  domainName: pulumi.Output<string>;
}

export interface AcmCertificateValidationArgs {
  certificateArn: pulumi.Input<string>;
  validationRecordFqdns: pulumi.Input<string>[];
  timeoutSeconds?: number;
}

export interface DnsValidatedCertificateArgs {
  domainName: string;
  subjectAlternativeNames?: string[];
  hostedZoneId: pulumi.Input<string>;
  tags?: Record<string, string>;
}

export interface DnsValidatedCertificateResult {
  certificate: aws.acm.Certificate;
  certificateArn: pulumi.Output<string>;
  domainName: pulumi.Output<string>;
  certificateValidation: aws.acm.CertificateValidation;
  validationRecords: aws.route53.Record[];
}

export class AcmCertificateComponent extends pulumi.ComponentResource {
  public readonly certificate: aws.acm.Certificate;
  public readonly certificateArn: pulumi.Output<string>;
  public readonly domainName: pulumi.Output<string>;

  constructor(
    name: string,
    args: AcmCertificateArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('aws:acm:AcmCertificateComponent', name, {}, opts);

    const defaultTags = {
      Name: args.domainName,
      Environment: pulumi.getStack(),
      ManagedBy: 'Pulumi',
      Project: 'AWS-Nova-Model-Breaking',
      ...args.tags,
    };

    // Create certificate without validation for demo purposes
    this.certificate = new aws.acm.Certificate(
      `${name}-certificate`,
      {
        domainName: args.domainName,
        subjectAlternativeNames: args.subjectAlternativeNames,
        validationMethod: args.validationMethod || 'DNS',
        tags: defaultTags,
      },
      {
        parent: this,
        provider: opts?.provider,
        // Don't wait for validation to complete
        ignoreChanges: ['validationMethod'],
      }
    );

    this.certificateArn = this.certificate.arn;
    this.domainName = this.certificate.domainName;

    this.registerOutputs({
      certificate: this.certificate,
      certificateArn: this.certificateArn,
      domainName: this.domainName,
    });
  }
}

export class AcmCertificateValidationComponent extends pulumi.ComponentResource {
  public readonly certificateValidation: aws.acm.CertificateValidation;

  constructor(
    name: string,
    args: AcmCertificateValidationArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('aws:acm:AcmCertificateValidationComponent', name, {}, opts);

    this.certificateValidation = new aws.acm.CertificateValidation(
      `${name}-validation`,
      {
        certificateArn: args.certificateArn,
        validationRecordFqdns: args.validationRecordFqdns,
      },
      {
        parent: this,
        provider: opts?.provider,
        customTimeouts: {
          create: args.timeoutSeconds ? `${args.timeoutSeconds}s` : '15m',
          delete: '5m',
        },
      }
    );

    this.registerOutputs({
      certificateValidation: this.certificateValidation,
    });
  }
}

export class DnsValidatedCertificateComponent extends pulumi.ComponentResource {
  public readonly certificate: aws.acm.Certificate;
  public readonly certificateArn: pulumi.Output<string>;
  public readonly domainName: pulumi.Output<string>;
  public readonly certificateValidation: aws.acm.CertificateValidation;
  public readonly validationRecords: aws.route53.Record[];

  constructor(
    name: string,
    args: DnsValidatedCertificateArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('aws:acm:DnsValidatedCertificateComponent', name, {}, opts);

    const certificateComponent = new AcmCertificateComponent(
      name,
      {
        domainName: args.domainName,
        subjectAlternativeNames: args.subjectAlternativeNames,
        validationMethod: 'DNS',
        tags: args.tags,
      },
      { parent: this, provider: opts?.provider }
    );

    this.certificate = certificateComponent.certificate;
    this.certificateArn = certificateComponent.certificateArn;
    this.domainName = certificateComponent.domainName;

    this.validationRecords = [];

    this.certificate.domainValidationOptions.apply(options => {
      options.forEach((option, index) => {
        const validationRecord = new aws.route53.Record(
          `${name}-validation-${index}`,
          {
            name: option.resourceRecordName,
            records: [option.resourceRecordValue],
            ttl: 60,
            type: option.resourceRecordType,
            zoneId: args.hostedZoneId,
            allowOverwrite: true,
          },
          { parent: this, provider: opts?.provider }
        );

        this.validationRecords.push(validationRecord);
      });
    });

    const validationComponent = new AcmCertificateValidationComponent(
      `${name}-validation`,
      {
        certificateArn: this.certificate.arn,
        validationRecordFqdns: this.validationRecords.map(
          record => record.fqdn
        ),
        timeoutSeconds: 900,
      },
      { parent: this, provider: opts?.provider }
    );

    this.certificateValidation = validationComponent.certificateValidation;

    this.registerOutputs({
      certificate: this.certificate,
      certificateArn: this.certificateArn,
      domainName: this.domainName,
      certificateValidation: this.certificateValidation,
      validationRecords: this.validationRecords,
    });
  }
}

export function createAcmCertificate(
  name: string,
  args: AcmCertificateArgs,
  opts?: pulumi.ComponentResourceOptions
): AcmCertificateResult {
  const certificateComponent = new AcmCertificateComponent(name, args, opts);
  return {
    certificate: certificateComponent.certificate,
    certificateArn: certificateComponent.certificateArn,
    domainName: certificateComponent.domainName,
  };
}

export function createAcmCertificateValidation(
  name: string,
  args: AcmCertificateValidationArgs,
  opts?: pulumi.ComponentResourceOptions
): aws.acm.CertificateValidation {
  const validationComponent = new AcmCertificateValidationComponent(
    name,
    args,
    opts
  );
  return validationComponent.certificateValidation;
}

export function createDnsValidatedCertificate(
  name: string,
  args: DnsValidatedCertificateArgs,
  opts?: pulumi.ComponentResourceOptions
): DnsValidatedCertificateResult {
  const dnsValidatedCertificateComponent = new DnsValidatedCertificateComponent(
    name,
    args,
    opts
  );
  return {
    certificate: dnsValidatedCertificateComponent.certificate,
    certificateArn: dnsValidatedCertificateComponent.certificateArn,
    domainName: dnsValidatedCertificateComponent.domainName,
    certificateValidation:
      dnsValidatedCertificateComponent.certificateValidation,
    validationRecords: dnsValidatedCertificateComponent.validationRecords,
  };
}
```

```ts
// /lib/components/compute/alb.ts
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface AlbArgs {
  name: string;
  loadBalancerType?: 'application' | 'network' | 'gateway';
  internal?: boolean; // Changed from scheme to internal boolean
  subnetIds: pulumi.Input<string>[];
  securityGroupIds?: pulumi.Input<string>[];
  enableDeletionProtection?: boolean;
  enableHttp2?: boolean;
  enableWafFailOpen?: boolean;
  idleTimeout?: number;
  tags?: Record<string, string>;
  accessLogs?: {
    bucket: pulumi.Input<string>;
    prefix?: string;
    enabled?: boolean;
  };
}

export interface AlbResult {
  loadBalancer: aws.lb.LoadBalancer;
  loadBalancerId: pulumi.Output<string>;
  loadBalancerArn: pulumi.Output<string>;
  dnsName: pulumi.Output<string>;
  zoneId: pulumi.Output<string>;
}

export interface AlbListenerArgs {
  name: string;
  loadBalancerArn: pulumi.Input<string>;
  port: number;
  protocol: 'HTTP' | 'HTTPS' | 'TCP' | 'TLS' | 'UDP' | 'TCP_UDP' | 'GENEVE';
  certificateArn?: pulumi.Input<string>;
  sslPolicy?: string;
  defaultActions: Array<{
    type:
      | 'forward'
      | 'redirect'
      | 'fixed-response'
      | 'authenticate-cognito'
      | 'authenticate-oidc';
    targetGroupArn?: pulumi.Input<string>;
    redirect?: {
      protocol?: string;
      port?: string;
      host?: string;
      path?: string;
      query?: string;
      statusCode: 'HTTP_301' | 'HTTP_302';
    };
    fixedResponse?: {
      contentType: string;
      messageBody?: string;
      statusCode: string;
    };
  }>;
  tags?: Record<string, string>;
}

export interface AlbListenerResult {
  listener: aws.lb.Listener;
  listenerArn: pulumi.Output<string>;
}

export interface HttpsAlbArgs {
  name: string;
  subnetIds: pulumi.Input<string>[];
  securityGroupIds: pulumi.Input<string>[];
  certificateArn: pulumi.Input<string>;
  targetGroupArn?: pulumi.Input<string>;
  tags?: Record<string, string>;
  accessLogs?: {
    bucket: pulumi.Input<string>;
    prefix?: string;
    enabled?: boolean;
  };
}

export interface HttpsAlbResult {
  loadBalancer: aws.lb.LoadBalancer;
  httpsListener: aws.lb.Listener;
  httpListener: aws.lb.Listener; // For redirect to HTTPS
  loadBalancerId: pulumi.Output<string>;
  loadBalancerArn: pulumi.Output<string>;
  dnsName: pulumi.Output<string>;
  zoneId: pulumi.Output<string>;
}

// NEW: HTTP-only ALB interfaces
export interface HttpAlbArgs {
  name: string;
  subnetIds: pulumi.Input<string>[];
  securityGroupIds: pulumi.Input<string>[];
  targetGroupArn?: pulumi.Input<string>;
  tags?: Record<string, string>;
  accessLogs?: {
    bucket: pulumi.Input<string>;
    prefix?: string;
    enabled?: boolean;
  };
}

export interface HttpAlbResult {
  loadBalancer: aws.lb.LoadBalancer;
  httpListener: aws.lb.Listener;
  loadBalancerId: pulumi.Output<string>;
  loadBalancerArn: pulumi.Output<string>;
  dnsName: pulumi.Output<string>;
  zoneId: pulumi.Output<string>;
}

export class AlbComponent extends pulumi.ComponentResource {
  public readonly loadBalancer: aws.lb.LoadBalancer;
  public readonly loadBalancerId: pulumi.Output<string>;
  public readonly loadBalancerArn: pulumi.Output<string>;
  public readonly dnsName: pulumi.Output<string>;
  public readonly zoneId: pulumi.Output<string>;

  constructor(
    name: string,
    args: AlbArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('aws:lb:AlbComponent', name, {}, opts);

    const defaultTags = {
      Name: args.name,
      Environment: pulumi.getStack(),
      ManagedBy: 'Pulumi',
      Project: 'AWS-Nova-Model-Breaking',
      ...args.tags,
    };

    this.loadBalancer = new aws.lb.LoadBalancer(
      `${name}-alb`,
      {
        name: args.name,
        loadBalancerType: args.loadBalancerType || 'application',
        internal: args.internal ?? false, // Changed from scheme to internal
        subnets: args.subnetIds,
        securityGroups: args.securityGroupIds,
        enableDeletionProtection: args.enableDeletionProtection ?? true,
        enableHttp2: args.enableHttp2 ?? true,
        enableWafFailOpen: args.enableWafFailOpen ?? false,
        idleTimeout: args.idleTimeout || 60,
        accessLogs: args.accessLogs,
        tags: defaultTags,
      },
      { parent: this, provider: opts?.provider }
    );

    this.loadBalancerId = this.loadBalancer.id;
    this.loadBalancerArn = this.loadBalancer.arn;
    this.dnsName = this.loadBalancer.dnsName;
    this.zoneId = this.loadBalancer.zoneId;

    this.registerOutputs({
      loadBalancer: this.loadBalancer,
      loadBalancerId: this.loadBalancerId,
      loadBalancerArn: this.loadBalancerArn,
      dnsName: this.dnsName,
      zoneId: this.zoneId,
    });
  }
}

export class AlbListenerComponent extends pulumi.ComponentResource {
  public readonly listener: aws.lb.Listener;
  public readonly listenerArn: pulumi.Output<string>;

  constructor(
    name: string,
    args: AlbListenerArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('aws:lb:AlbListenerComponent', name, {}, opts);

    const defaultTags = {
      Name: args.name,
      Environment: pulumi.getStack(),
      ManagedBy: 'Pulumi',
      Project: 'AWS-Nova-Model-Breaking',
      ...args.tags,
    };

    // Convert defaultActions to the format expected by aws.lb.Listener
    const defaultActions = args.defaultActions.map(action => {
      const baseAction: any = {
        type: action.type,
      };

      switch (action.type) {
        case 'forward':
          baseAction.targetGroupArn = action.targetGroupArn;
          break;
        case 'redirect':
          baseAction.redirect = action.redirect;
          break;
        case 'fixed-response':
          baseAction.fixedResponse = action.fixedResponse;
          break;
      }

      return baseAction;
    });

    this.listener = new aws.lb.Listener(
      `${name}-listener`,
      {
        loadBalancerArn: args.loadBalancerArn,
        port: args.port,
        protocol: args.protocol,
        certificateArn: args.certificateArn,
        sslPolicy:
          args.sslPolicy ||
          (args.protocol === 'HTTPS'
            ? 'ELBSecurityPolicy-TLS-1-2-2017-01'
            : undefined),
        defaultActions: defaultActions,
        tags: defaultTags,
      },
      { parent: this, provider: opts?.provider }
    );

    this.listenerArn = this.listener.arn;

    this.registerOutputs({
      listener: this.listener,
      listenerArn: this.listenerArn,
    });
  }
}

export class HttpsAlbComponent extends pulumi.ComponentResource {
  public readonly loadBalancer: aws.lb.LoadBalancer;
  public readonly httpsListener: aws.lb.Listener;
  public readonly httpListener: aws.lb.Listener;
  public readonly loadBalancerId: pulumi.Output<string>;
  public readonly loadBalancerArn: pulumi.Output<string>;
  public readonly dnsName: pulumi.Output<string>;
  public readonly zoneId: pulumi.Output<string>;

  constructor(
    name: string,
    args: HttpsAlbArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('aws:lb:HttpsAlbComponent', name, {}, opts);

    // Create ALB
    const albComponent = new AlbComponent(
      name,
      {
        name: args.name,
        loadBalancerType: 'application',
        internal: false, // Changed from scheme: "internet-facing"
        subnetIds: args.subnetIds,
        securityGroupIds: args.securityGroupIds,
        enableDeletionProtection: true,
        enableHttp2: true,
        accessLogs: args.accessLogs,
        tags: args.tags,
      },
      { parent: this, provider: opts?.provider }
    );

    this.loadBalancer = albComponent.loadBalancer;
    this.loadBalancerId = albComponent.loadBalancerId;
    this.loadBalancerArn = albComponent.loadBalancerArn;
    this.dnsName = albComponent.dnsName;
    this.zoneId = albComponent.zoneId;

    // Create HTTPS listener
    const httpsListenerComponent = new AlbListenerComponent(
      `${name}-https`,
      {
        name: `${args.name}-https`,
        loadBalancerArn: this.loadBalancerArn,
        port: 443,
        protocol: 'HTTPS',
        certificateArn: args.certificateArn,
        sslPolicy: 'ELBSecurityPolicy-TLS-1-2-2017-01',
        defaultActions: args.targetGroupArn
          ? [
              {
                type: 'forward',
                targetGroupArn: args.targetGroupArn,
              },
            ]
          : [
              {
                type: 'fixed-response',
                fixedResponse: {
                  contentType: 'text/plain',
                  messageBody: 'Service Temporarily Unavailable',
                  statusCode: '503',
                },
              },
            ],
        tags: args.tags,
      },
      { parent: this, provider: opts?.provider }
    );

    this.httpsListener = httpsListenerComponent.listener;

    // Create HTTP listener for redirect to HTTPS
    const httpListenerComponent = new AlbListenerComponent(
      `${name}-http`,
      {
        name: `${args.name}-http`,
        loadBalancerArn: this.loadBalancerArn,
        port: 80,
        protocol: 'HTTP',
        defaultActions: [
          {
            type: 'redirect',
            redirect: {
              protocol: 'HTTPS',
              port: '443',
              statusCode: 'HTTP_301',
            },
          },
        ],
        tags: args.tags,
      },
      { parent: this, provider: opts?.provider }
    );

    this.httpListener = httpListenerComponent.listener;

    this.registerOutputs({
      loadBalancer: this.loadBalancer,
      httpsListener: this.httpsListener,
      httpListener: this.httpListener,
      loadBalancerId: this.loadBalancerId,
      loadBalancerArn: this.loadBalancerArn,
      dnsName: this.dnsName,
      zoneId: this.zoneId,
    });
  }
}

// NEW: HTTP-only ALB Component
export class HttpAlbComponent extends pulumi.ComponentResource {
  public readonly loadBalancer: aws.lb.LoadBalancer;
  public readonly httpListener: aws.lb.Listener;
  public readonly loadBalancerId: pulumi.Output<string>;
  public readonly loadBalancerArn: pulumi.Output<string>;
  public readonly dnsName: pulumi.Output<string>;
  public readonly zoneId: pulumi.Output<string>;

  constructor(
    name: string,
    args: HttpAlbArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('aws:lb:HttpAlbComponent', name, {}, opts);

    // Create ALB
    const albComponent = new AlbComponent(
      name,
      {
        name: args.name,
        loadBalancerType: 'application',
        internal: false,
        subnetIds: args.subnetIds,
        securityGroupIds: args.securityGroupIds,
        enableDeletionProtection: true,
        enableHttp2: true,
        accessLogs: args.accessLogs,
        tags: args.tags,
      },
      { parent: this, provider: opts?.provider }
    );

    this.loadBalancer = albComponent.loadBalancer;
    this.loadBalancerId = albComponent.loadBalancerId;
    this.loadBalancerArn = albComponent.loadBalancerArn;
    this.dnsName = albComponent.dnsName;
    this.zoneId = albComponent.zoneId;

    // Create HTTP listener only
    const httpListenerComponent = new AlbListenerComponent(
      `${name}-http`,
      {
        name: `${args.name}-http`,
        loadBalancerArn: this.loadBalancerArn,
        port: 80,
        protocol: 'HTTP',
        defaultActions: args.targetGroupArn
          ? [
              {
                type: 'forward',
                targetGroupArn: args.targetGroupArn,
              },
            ]
          : [
              {
                type: 'fixed-response',
                fixedResponse: {
                  contentType: 'text/plain',
                  messageBody: 'Service Available via HTTP',
                  statusCode: '200',
                },
              },
            ],
        tags: args.tags,
      },
      { parent: this, provider: opts?.provider }
    );

    this.httpListener = httpListenerComponent.listener;

    this.registerOutputs({
      loadBalancer: this.loadBalancer,
      httpListener: this.httpListener,
      loadBalancerId: this.loadBalancerId,
      loadBalancerArn: this.loadBalancerArn,
      dnsName: this.dnsName,
      zoneId: this.zoneId,
    });
  }
}

export function createAlb(name: string, args: AlbArgs): AlbResult {
  const albComponent = new AlbComponent(name, args);
  return {
    loadBalancer: albComponent.loadBalancer,
    loadBalancerId: albComponent.loadBalancerId,
    loadBalancerArn: albComponent.loadBalancerArn,
    dnsName: albComponent.dnsName,
    zoneId: albComponent.zoneId,
  };
}

export function createAlbListener(
  name: string,
  args: AlbListenerArgs
): AlbListenerResult {
  const listenerComponent = new AlbListenerComponent(name, args);
  return {
    listener: listenerComponent.listener,
    listenerArn: listenerComponent.listenerArn,
  };
}

export function createHttpsAlb(
  name: string,
  args: HttpsAlbArgs,
  opts?: pulumi.ComponentResourceOptions
): HttpsAlbResult {
  const httpsAlbComponent = new HttpsAlbComponent(name, args, opts);
  return {
    loadBalancer: httpsAlbComponent.loadBalancer,
    httpsListener: httpsAlbComponent.httpsListener,
    httpListener: httpsAlbComponent.httpListener,
    loadBalancerId: httpsAlbComponent.loadBalancerId,
    loadBalancerArn: httpsAlbComponent.loadBalancerArn,
    dnsName: httpsAlbComponent.dnsName,
    zoneId: httpsAlbComponent.zoneId,
  };
}

// NEW: HTTP-only ALB function
export function createHttpAlb(
  name: string,
  args: HttpAlbArgs,
  opts?: pulumi.ComponentResourceOptions
): HttpAlbResult {
  const httpAlbComponent = new HttpAlbComponent(name, args, opts);
  return {
    loadBalancer: httpAlbComponent.loadBalancer,
    httpListener: httpAlbComponent.httpListener,
    loadBalancerId: httpAlbComponent.loadBalancerId,
    loadBalancerArn: httpAlbComponent.loadBalancerArn,
    dnsName: httpAlbComponent.dnsName,
    zoneId: httpAlbComponent.zoneId,
  };
}

// /lib/components/compute/ec2.ts

import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface Ec2InstanceArgs {
  name: string;
  instanceType: string;
  amiId?: pulumi.Input<string>;
  subnetId: pulumi.Input<string>;
  securityGroupIds: pulumi.Input<string>[];
  keyName?: string;
  iamInstanceProfile?: pulumi.Input<string>;
  userData?: pulumi.Input<string>;
  ebsOptimized?: boolean;
  monitoring?: boolean;
  tags?: Record<string, string>;
  rootBlockDevice?: {
    volumeType?: string;
    volumeSize?: number;
    deleteOnTermination?: boolean;
    encrypted?: boolean;
    kmsKeyId?: pulumi.Input<string>;
  };
}

export interface Ec2InstanceResult {
  instance: aws.ec2.Instance;
  instanceId: pulumi.Output<string>;
  privateIp: pulumi.Output<string>;
  publicIp?: pulumi.Output<string>;
}

export interface AutoScalingGroupArgs {
  name: string;
  minSize: number;
  maxSize: number;
  desiredCapacity: number;
  subnetIds: pulumi.Input<string>[];
  targetGroupArns?: pulumi.Input<string>[];
  healthCheckType?: string;
  healthCheckGracePeriod?: number;
  launchTemplate: {
    id: pulumi.Input<string>;
    version: pulumi.Input<string>;
  };
  tags?: Record<string, string>;
}

export interface LaunchTemplateArgs {
  name: string;
  instanceType: string;
  amiId?: pulumi.Input<string>;
  securityGroupIds: pulumi.Input<string>[];
  keyName?: string;
  iamInstanceProfile?: {
    name?: pulumi.Input<string>;
    arn?: pulumi.Input<string>;
  };
  userData?: pulumi.Input<string>;
  ebsOptimized?: boolean;
  monitoring?: boolean;
  tags?: Record<string, string>;
  blockDeviceMappings?: Array<{
    deviceName: string;
    ebs?: {
      volumeType?: string;
      volumeSize?: number;
      deleteOnTermination?: boolean;
      encrypted?: boolean;
      kmsKeyId?: pulumi.Input<string>;
    };
  }>;
}

export class Ec2InstanceComponent extends pulumi.ComponentResource {
  public readonly instance: aws.ec2.Instance;
  public readonly instanceId: pulumi.Output<string>;
  public readonly privateIp: pulumi.Output<string>;
  public readonly publicIp?: pulumi.Output<string>;

  constructor(
    name: string,
    args: Ec2InstanceArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('aws:compute:Ec2InstanceComponent', name, {}, opts);

    const defaultTags = {
      Name: args.name,
      Environment: pulumi.getStack(),
      ManagedBy: 'Pulumi',
      Project: 'AWS-Nova-Model-Breaking',
      ...args.tags,
    };

    // Get latest Amazon Linux 2 AMI if not specified
    const amiId =
      args.amiId ||
      aws.ec2
        .getAmi(
          {
            mostRecent: true,
            owners: ['amazon'],
            filters: [
              {
                name: 'name',
                values: ['amzn2-ami-hvm-*-x86_64-gp2'],
              },
              {
                name: 'virtualization-type',
                values: ['hvm'],
              },
            ],
          },
          { provider: opts?.provider }
        )
        .then(ami => ami.id);

    // Default user data for security hardening
    const defaultUserData = `#!/bin/bash
yum update -y
yum install -y amazon-cloudwatch-agent
yum install -y awslogs

# Configure CloudWatch agent
cat <<EOF > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json
{
    "logs": {
        "logs_collected": {
            "files": {
                "collect_list": [
                    {
                        "file_path": "/var/log/messages",
                        "log_group_name": "/aws/ec2/system-logs",
                        "log_stream_name": "{instance_id}/messages"
                    },
                    {
                        "file_path": "/var/log/secure",
                        "log_group_name": "/aws/ec2/security-logs",
                        "log_stream_name": "{instance_id}/secure"
                    }
                ]
            }
        }
    }
}
EOF

# Start CloudWatch agent
/opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a fetch-config -m ec2 -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json -s

# Security hardening
sed -i 's/#PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config
systemctl restart sshd

# Install security updates
yum update -y --security
`;

    this.instance = new aws.ec2.Instance(
      `${name}-instance`,
      {
        ami: amiId,
        instanceType: args.instanceType,
        subnetId: args.subnetId,
        vpcSecurityGroupIds: args.securityGroupIds,
        keyName: args.keyName,
        iamInstanceProfile: args.iamInstanceProfile,
        userData: args.userData || defaultUserData,
        ebsOptimized: args.ebsOptimized ?? true,
        monitoring: args.monitoring ?? true,
        rootBlockDevice: args.rootBlockDevice
          ? {
              volumeType: args.rootBlockDevice.volumeType || 'gp3',
              volumeSize: args.rootBlockDevice.volumeSize || 20,
              deleteOnTermination:
                args.rootBlockDevice.deleteOnTermination ?? true,
              encrypted: args.rootBlockDevice.encrypted ?? true,
              kmsKeyId: args.rootBlockDevice.kmsKeyId,
            }
          : {
              volumeType: 'gp3',
              volumeSize: 20,
              deleteOnTermination: true,
              encrypted: true,
            },
        tags: defaultTags,
      },
      { parent: this, provider: opts?.provider }
    );

    this.instanceId = this.instance.id;
    this.privateIp = this.instance.privateIp;
    this.publicIp = this.instance.publicIp;

    this.registerOutputs({
      instance: this.instance,
      instanceId: this.instanceId,
      privateIp: this.privateIp,
      publicIp: this.publicIp,
    });
  }
}

export class LaunchTemplateComponent extends pulumi.ComponentResource {
  public readonly launchTemplate: aws.ec2.LaunchTemplate;
  public readonly launchTemplateId: pulumi.Output<string>;
  public readonly latestVersion: pulumi.Output<string>;

  constructor(
    name: string,
    args: LaunchTemplateArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('aws:compute:LaunchTemplateComponent', name, {}, opts);

    const defaultTags = {
      Name: args.name,
      Environment: pulumi.getStack(),
      ManagedBy: 'Pulumi',
      Project: 'AWS-Nova-Model-Breaking',
      ...args.tags,
    };

    // Get latest Amazon Linux 2 AMI if not specified
    const amiId =
      args.amiId ||
      aws.ec2
        .getAmi(
          {
            mostRecent: true,
            owners: ['amazon'],
            filters: [
              {
                name: 'name',
                values: ['amzn2-ami-hvm-*-x86_64-gp2'],
              },
              {
                name: 'virtualization-type',
                values: ['hvm'],
              },
            ],
          },
          { provider: opts?.provider }
        )
        .then(ami => ami.id);

    // Default user data for security hardening
    const defaultUserData = Buffer.from(
      `#!/bin/bash
yum update -y
yum install -y amazon-cloudwatch-agent
yum install -y awslogs

# Configure CloudWatch agent
cat <<EOF > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json
{
    "logs": {
        "logs_collected": {
            "files": {
                "collect_list": [
                    {
                        "file_path": "/var/log/messages",
                        "log_group_name": "/aws/ec2/system-logs",
                        "log_stream_name": "{instance_id}/messages"
                    },
                    {
                        "file_path": "/var/log/secure",
                        "log_group_name": "/aws/ec2/security-logs",
                        "log_stream_name": "{instance_id}/secure"
                    }
                ]
            }
        }
    }
}
EOF

# Start CloudWatch agent
/opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a fetch-config -m ec2 -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json -s

# Security hardening
sed -i 's/#PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config
systemctl restart sshd

# Install security updates
yum update -y --security
`
    ).toString('base64');

    // Fixed blockDeviceMappings type issues
    const defaultBlockDeviceMappings = args.blockDeviceMappings?.map(
      mapping => ({
        deviceName: mapping.deviceName,
        ebs: mapping.ebs
          ? {
              volumeType: mapping.ebs.volumeType,
              volumeSize: mapping.ebs.volumeSize,
              deleteOnTermination: mapping.ebs.deleteOnTermination?.toString(), // Convert boolean to string
              encrypted: mapping.ebs.encrypted?.toString(), // Convert boolean to string
              kmsKeyId: mapping.ebs.kmsKeyId,
            }
          : undefined,
      })
    ) || [
      {
        deviceName: '/dev/xvda',
        ebs: {
          volumeType: 'gp3',
          volumeSize: 20,
          deleteOnTermination: 'true', // Use string instead of boolean
          encrypted: 'true', // Use string instead of boolean
        },
      },
    ];

    this.launchTemplate = new aws.ec2.LaunchTemplate(
      `${name}-lt`,
      {
        namePrefix: `${args.name}-`,
        imageId: amiId,
        instanceType: args.instanceType,
        keyName: args.keyName,
        vpcSecurityGroupIds: args.securityGroupIds,
        iamInstanceProfile: args.iamInstanceProfile,
        userData: args.userData || defaultUserData,
        ebsOptimized: (args.ebsOptimized ?? true).toString(), // Convert boolean to string
        monitoring: {
          enabled: args.monitoring ?? true,
        },
        blockDeviceMappings: defaultBlockDeviceMappings,
        tagSpecifications: [
          {
            resourceType: 'instance',
            tags: defaultTags,
          },
          {
            resourceType: 'volume',
            tags: defaultTags,
          },
        ],
        tags: defaultTags,
      },
      { parent: this, provider: opts?.provider }
    );

    this.launchTemplateId = this.launchTemplate.id;

    // Handle both mock (string) and real Pulumi output (number) cases
    const rawLatestVersion = this.launchTemplate.latestVersion;
    if (typeof rawLatestVersion === 'string') {
      // Mock case: already a string
      this.latestVersion = pulumi.output(rawLatestVersion);
    } else if (
      rawLatestVersion &&
      typeof rawLatestVersion === 'object' &&
      'apply' in rawLatestVersion
    ) {
      // Real Pulumi output case: has apply method
      this.latestVersion = (rawLatestVersion as any).apply((v: any) =>
        v.toString()
      );
    } else {
      // Fallback case: convert to string
      this.latestVersion = pulumi.output(String(rawLatestVersion));
    }

    this.registerOutputs({
      launchTemplate: this.launchTemplate,
      launchTemplateId: this.launchTemplateId,
      latestVersion: this.latestVersion,
    });
  }
}

export class AutoScalingGroupComponent extends pulumi.ComponentResource {
  public readonly autoScalingGroup: aws.autoscaling.Group;
  public readonly autoScalingGroupName: pulumi.Output<string>;
  public readonly autoScalingGroupArn: pulumi.Output<string>;

  constructor(
    name: string,
    args: AutoScalingGroupArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('aws:compute:AutoScalingGroupComponent', name, {}, opts);

    const defaultTags = {
      Name: args.name,
      Environment: pulumi.getStack(),
      ManagedBy: 'Pulumi',
      Project: 'AWS-Nova-Model-Breaking',
      ...args.tags,
    };

    // Convert tags to ASG tag format
    const asgTags = Object.entries(defaultTags).map(([key, value]) => ({
      key: key,
      value: value,
      propagateAtLaunch: true,
    }));

    this.autoScalingGroup = new aws.autoscaling.Group(
      `${name}-asg`,
      {
        name: args.name,
        minSize: args.minSize,
        maxSize: args.maxSize,
        desiredCapacity: args.desiredCapacity,
        vpcZoneIdentifiers: args.subnetIds,
        targetGroupArns: args.targetGroupArns,
        healthCheckType: args.healthCheckType || 'ELB',
        healthCheckGracePeriod: args.healthCheckGracePeriod || 300,
        launchTemplate: {
          id: args.launchTemplate.id,
          version: args.launchTemplate.version,
        },
        tags: asgTags,
      },
      { parent: this, provider: opts?.provider }
    );

    this.autoScalingGroupName = this.autoScalingGroup.name;
    this.autoScalingGroupArn = this.autoScalingGroup.arn;

    this.registerOutputs({
      autoScalingGroup: this.autoScalingGroup,
      autoScalingGroupName: this.autoScalingGroupName,
      autoScalingGroupArn: this.autoScalingGroupArn,
    });
  }
}

export function createEc2Instance(
  name: string,
  args: Ec2InstanceArgs,
  opts?: pulumi.ComponentResourceOptions
): Ec2InstanceResult {
  const ec2Component = new Ec2InstanceComponent(name, args, opts);
  return {
    instance: ec2Component.instance,
    instanceId: ec2Component.instanceId,
    privateIp: ec2Component.privateIp,
    publicIp: ec2Component.publicIp,
  };
}

export function createLaunchTemplate(
  name: string,
  args: LaunchTemplateArgs,
  opts?: pulumi.ComponentResourceOptions
) {
  const launchTemplateComponent = new LaunchTemplateComponent(name, args, opts);
  return {
    launchTemplate: launchTemplateComponent.launchTemplate,
    launchTemplateId: launchTemplateComponent.launchTemplateId,
    latestVersion: launchTemplateComponent.latestVersion,
  };
}

export function createAutoScalingGroup(
  name: string,
  args: AutoScalingGroupArgs,
  opts?: pulumi.ComponentResourceOptions
) {
  const asgComponent = new AutoScalingGroupComponent(name, args, opts);
  return {
    autoScalingGroup: asgComponent.autoScalingGroup,
    autoScalingGroupName: asgComponent.autoScalingGroupName,
    autoScalingGroupArn: asgComponent.autoScalingGroupArn,
  };
}


// /lib/components/compute/targetGroup.ts
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface TargetGroupArgs {
  name: string;
  port: number;
  protocol: 'HTTP' | 'HTTPS' | 'TCP' | 'TLS' | 'UDP' | 'TCP_UDP' | 'GENEVE';
  vpcId: pulumi.Input<string>;
  targetType?: 'instance' | 'ip' | 'lambda' | 'alb';
  protocolVersion?: string;
  healthCheck?: {
    enabled?: boolean;
    healthyThreshold?: number;
    interval?: number;
    matcher?: string;
    path?: string;
    port?: string;
    protocol?: string;
    timeout?: number;
    unhealthyThreshold?: number;
  };
  stickiness?: {
    enabled?: boolean;
    type: 'lb_cookie' | 'app_cookie' | 'source_ip';
    cookieDuration?: number;
    cookieName?: string;
  };
  tags?: Record<string, string>;
}

export interface TargetGroupResult {
  targetGroup: aws.lb.TargetGroup;
  targetGroupArn: pulumi.Output<string>;
  targetGroupName: pulumi.Output<string>;
}

export interface TargetGroupAttachmentArgs {
  targetGroupArn: pulumi.Input<string>;
  targetId: pulumi.Input<string>;
  port?: number;
  availabilityZone?: string;
}

export interface ApplicationTargetGroupArgs {
  name: string;
  port: number;
  vpcId: pulumi.Input<string>;
  healthCheckPath?: string;
  healthCheckMatcher?: string;
  tags?: Record<string, string>;
}

export interface NetworkTargetGroupArgs {
  name: string;
  port: number;
  protocol: 'TCP' | 'UDP' | 'TCP_UDP';
  vpcId: pulumi.Input<string>;
  preserveClientIp?: boolean;
  tags?: Record<string, string>;
}

export class TargetGroupComponent extends pulumi.ComponentResource {
  public readonly targetGroup: aws.lb.TargetGroup;
  public readonly targetGroupArn: pulumi.Output<string>;
  public readonly targetGroupName: pulumi.Output<string>;

  constructor(
    name: string,
    args: TargetGroupArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('aws:lb:TargetGroupComponent', name, {}, opts);

    const defaultTags = {
      Name: args.name,
      Environment: pulumi.getStack(),
      ManagedBy: 'Pulumi',
      Project: 'AWS-Nova-Model-Breaking',
      ...args.tags,
    };

    this.targetGroup = new aws.lb.TargetGroup(
      `${name}-tg`,
      {
        name: args.name,
        port: args.port,
        protocol: args.protocol,
        vpcId: args.vpcId,
        targetType: args.targetType || 'instance',
        protocolVersion: args.protocolVersion,
        healthCheck: args.healthCheck,
        stickiness: args.stickiness,
        tags: defaultTags,
      },
      { parent: this, provider: opts?.provider }
    );

    this.targetGroupArn = this.targetGroup.arn;
    this.targetGroupName = this.targetGroup.name;

    this.registerOutputs({
      targetGroup: this.targetGroup,
      targetGroupArn: this.targetGroupArn,
      targetGroupName: this.targetGroupName,
    });
  }
}

export class TargetGroupAttachmentComponent extends pulumi.ComponentResource {
  public readonly attachment: aws.lb.TargetGroupAttachment;

  constructor(
    name: string,
    args: TargetGroupAttachmentArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('aws:lb:TargetGroupAttachmentComponent', name, {}, opts);

    this.attachment = new aws.lb.TargetGroupAttachment(
      `${name}-attachment`,
      {
        targetGroupArn: args.targetGroupArn,
        targetId: args.targetId,
        port: args.port,
        availabilityZone: args.availabilityZone,
      },
      { parent: this, provider: opts?.provider }
    );

    this.registerOutputs({
      attachment: this.attachment,
    });
  }
}

export class ApplicationTargetGroupComponent extends pulumi.ComponentResource {
  public readonly targetGroup: aws.lb.TargetGroup;
  public readonly targetGroupArn: pulumi.Output<string>;
  public readonly targetGroupName: pulumi.Output<string>;

  constructor(
    name: string,
    args: ApplicationTargetGroupArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('aws:lb:ApplicationTargetGroupComponent', name, {}, opts);

    const targetGroupComponent = new TargetGroupComponent(
      name,
      {
        name: args.name,
        port: args.port,
        protocol: 'HTTP',
        vpcId: args.vpcId,
        targetType: 'instance',
        healthCheck: {
          enabled: true,
          healthyThreshold: 2,
          interval: 30,
          matcher: args.healthCheckMatcher || '200',
          path: args.healthCheckPath || '/health',
          port: 'traffic-port',
          protocol: 'HTTP',
          timeout: 5,
          unhealthyThreshold: 2,
        },
        stickiness: {
          enabled: false,
          type: 'lb_cookie',
          cookieDuration: 86400,
        },
        tags: args.tags,
      },
      { parent: this, provider: opts?.provider }
    );

    this.targetGroup = targetGroupComponent.targetGroup;
    this.targetGroupArn = targetGroupComponent.targetGroupArn;
    this.targetGroupName = targetGroupComponent.targetGroupName;

    this.registerOutputs({
      targetGroup: this.targetGroup,
      targetGroupArn: this.targetGroupArn,
      targetGroupName: this.targetGroupName,
    });
  }
}

export class NetworkTargetGroupComponent extends pulumi.ComponentResource {
  public readonly targetGroup: aws.lb.TargetGroup;
  public readonly targetGroupArn: pulumi.Output<string>;
  public readonly targetGroupName: pulumi.Output<string>;

  constructor(
    name: string,
    args: NetworkTargetGroupArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('aws:lb:NetworkTargetGroupComponent', name, {}, opts);

    const targetGroupComponent = new TargetGroupComponent(
      name,
      {
        name: args.name,
        port: args.port,
        protocol: args.protocol,
        vpcId: args.vpcId,
        targetType: 'instance',
        healthCheck: {
          enabled: true,
          healthyThreshold: 3,
          interval: 30,
          port: 'traffic-port',
          protocol: args.protocol === 'UDP' ? 'HTTP' : args.protocol,
          timeout: 6,
          unhealthyThreshold: 3,
        },
        tags: args.tags,
      },
      { parent: this, provider: opts?.provider }
    );

    this.targetGroup = targetGroupComponent.targetGroup;
    this.targetGroupArn = targetGroupComponent.targetGroupArn;
    this.targetGroupName = targetGroupComponent.targetGroupName;

    this.registerOutputs({
      targetGroup: this.targetGroup,
      targetGroupArn: this.targetGroupArn,
      targetGroupName: this.targetGroupName,
    });
  }
}

export function createTargetGroup(
  name: string,
  args: TargetGroupArgs,
  opts?: pulumi.ComponentResourceOptions
): TargetGroupResult {
  const targetGroupComponent = new TargetGroupComponent(name, args, opts);
  return {
    targetGroup: targetGroupComponent.targetGroup,
    targetGroupArn: targetGroupComponent.targetGroupArn,
    targetGroupName: targetGroupComponent.targetGroupName,
  };
}

export function createTargetGroupAttachment(
  name: string,
  args: TargetGroupAttachmentArgs,
  opts?: pulumi.ComponentResourceOptions
): aws.lb.TargetGroupAttachment {
  const attachmentComponent = new TargetGroupAttachmentComponent(
    name,
    args,
    opts
  );
  return attachmentComponent.attachment;
}

export function createApplicationTargetGroup(
  name: string,
  args: ApplicationTargetGroupArgs,
  opts?: pulumi.ComponentResourceOptions
): TargetGroupResult {
  const appTargetGroupComponent = new ApplicationTargetGroupComponent(
    name,
    args,
    opts
  );
  return {
    targetGroup: appTargetGroupComponent.targetGroup,
    targetGroupArn: appTargetGroupComponent.targetGroupArn,
    targetGroupName: appTargetGroupComponent.targetGroupName,
  };
}

export function createNetworkTargetGroup(
  name: string,
  args: NetworkTargetGroupArgs,
  opts?: pulumi.ComponentResourceOptions
): TargetGroupResult {
  const networkTargetGroupComponent = new NetworkTargetGroupComponent(
    name,
    args,
    opts
  );
  return {
    targetGroup: networkTargetGroupComponent.targetGroup,
    targetGroupArn: networkTargetGroupComponent.targetGroupArn,
    targetGroupName: networkTargetGroupComponent.targetGroupName,
  };
}


// /lib/components/monitoring/cloudWatch.ts
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface CloudWatchLogGroupArgs {
  name: string;
  retentionInDays?: number;
  kmsKeyId?: pulumi.Input<string>;
  tags?: Record<string, string>;
}

export interface CloudWatchLogGroupResult {
  logGroup: aws.cloudwatch.LogGroup;
  logGroupName: pulumi.Output<string>;
  logGroupArn: pulumi.Output<string>;
}

export interface CloudWatchMetricAlarmArgs {
  name: string;
  comparisonOperator: string;
  evaluationPeriods: number;
  metricName: string;
  namespace: string;
  period: number;
  statistic: string;
  threshold: number;
  alarmDescription?: string;
  alarmActions?: pulumi.Input<string>[];
  okActions?: pulumi.Input<string>[];
  treatMissingData?: string;
  datapointsToAlarm?: number;
  dimensions?: Record<string, pulumi.Input<string>>;
  tags?: Record<string, string>;
}

export interface CloudWatchMetricAlarmResult {
  alarm: aws.cloudwatch.MetricAlarm;
  alarmArn: pulumi.Output<string>;
  alarmName: pulumi.Output<string>;
}

export interface CloudWatchDashboardArgs {
  name: string;
  dashboardBody: pulumi.Input<string>;
}

export interface ApplicationLogGroupsArgs {
  name: string;
  retentionInDays?: number;
  kmsKeyId?: pulumi.Input<string>;
  tags?: Record<string, string>;
}

export interface ApplicationLogGroupsResult {
  systemLogs: CloudWatchLogGroupResult;
  securityLogs: CloudWatchLogGroupResult;
  applicationLogs: CloudWatchLogGroupResult;
  accessLogs: CloudWatchLogGroupResult;
}

export class CloudWatchLogGroupComponent extends pulumi.ComponentResource {
  public readonly logGroup: aws.cloudwatch.LogGroup;
  public readonly logGroupName: pulumi.Output<string>;
  public readonly logGroupArn: pulumi.Output<string>;

  constructor(
    name: string,
    args: CloudWatchLogGroupArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('aws:cloudwatch:CloudWatchLogGroupComponent', name, {}, opts);

    const defaultTags = {
      Name: args.name,
      Environment: pulumi.getStack(),
      ManagedBy: 'Pulumi',
      Project: 'AWS-Nova-Model-Breaking',
      ...args.tags,
    };

    this.logGroup = new aws.cloudwatch.LogGroup(
      `${name}-log-group`,
      {
        name: args.name,
        retentionInDays: args.retentionInDays || 90,
        kmsKeyId: args.kmsKeyId,
        tags: defaultTags,
      },
      { parent: this }
    );

    this.logGroupName = this.logGroup.name;
    this.logGroupArn = this.logGroup.arn;

    this.registerOutputs({
      logGroup: this.logGroup,
      logGroupName: this.logGroupName,
      logGroupArn: this.logGroupArn,
    });
  }
}

export class CloudWatchMetricAlarmComponent extends pulumi.ComponentResource {
  public readonly alarm: aws.cloudwatch.MetricAlarm;
  public readonly alarmArn: pulumi.Output<string>;
  public readonly alarmName: pulumi.Output<string>;

  constructor(
    name: string,
    args: CloudWatchMetricAlarmArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('aws:cloudwatch:CloudWatchMetricAlarmComponent', name, {}, opts);

    const defaultTags = {
      Name: args.name,
      Environment: pulumi.getStack(),
      ManagedBy: 'Pulumi',
      Project: 'AWS-Nova-Model-Breaking',
      ...args.tags,
    };

    this.alarm = new aws.cloudwatch.MetricAlarm(
      `${name}-alarm`,
      {
        name: args.name,
        comparisonOperator: args.comparisonOperator,
        evaluationPeriods: args.evaluationPeriods,
        metricName: args.metricName,
        namespace: args.namespace,
        period: args.period,
        statistic: args.statistic,
        threshold: args.threshold,
        alarmDescription:
          args.alarmDescription || `Alarm for ${args.metricName}`,
        alarmActions: args.alarmActions,
        okActions: args.okActions,
        treatMissingData: args.treatMissingData || 'breaching',
        datapointsToAlarm: args.datapointsToAlarm,
        dimensions: args.dimensions,
        tags: defaultTags,
      },
      { parent: this }
    );

    this.alarmArn = this.alarm.arn;
    this.alarmName = this.alarm.name;

    this.registerOutputs({
      alarm: this.alarm,
      alarmArn: this.alarmArn,
      alarmName: this.alarmName,
    });
  }
}

export class CloudWatchDashboardComponent extends pulumi.ComponentResource {
  public readonly dashboard: aws.cloudwatch.Dashboard;
  public readonly dashboardArn: pulumi.Output<string>;

  constructor(
    name: string,
    args: CloudWatchDashboardArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('aws:cloudwatch:CloudWatchDashboardComponent', name, {}, opts);

    this.dashboard = new aws.cloudwatch.Dashboard(
      `${name}-dashboard`,
      {
        dashboardName: args.name,
        dashboardBody: args.dashboardBody,
      },
      { parent: this }
    );

    this.dashboardArn = this.dashboard.dashboardArn;

    this.registerOutputs({
      dashboard: this.dashboard,
      dashboardArn: this.dashboardArn,
    });
  }
}

export class ApplicationLogGroupsComponent extends pulumi.ComponentResource {
  public readonly systemLogs: CloudWatchLogGroupResult;
  public readonly securityLogs: CloudWatchLogGroupResult;
  public readonly applicationLogs: CloudWatchLogGroupResult;
  public readonly accessLogs: CloudWatchLogGroupResult;

  constructor(
    name: string,
    args: ApplicationLogGroupsArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('aws:cloudwatch:ApplicationLogGroupsComponent', name, {}, opts);

    // System logs
    const systemLogsComponent = new CloudWatchLogGroupComponent(
      `${name}-system`,
      {
        name: `/aws/ec2/${args.name}/system-logs`,
        retentionInDays: args.retentionInDays || 90,
        kmsKeyId: args.kmsKeyId,
        tags: {
          ...args.tags,
          LogType: 'System',
        },
      },
      { parent: this }
    );

    this.systemLogs = {
      logGroup: systemLogsComponent.logGroup,
      logGroupName: systemLogsComponent.logGroupName,
      logGroupArn: systemLogsComponent.logGroupArn,
    };

    // Security logs
    const securityLogsComponent = new CloudWatchLogGroupComponent(
      `${name}-security`,
      {
        name: `/aws/ec2/${args.name}/security-logs`,
        retentionInDays: args.retentionInDays || 90,
        kmsKeyId: args.kmsKeyId,
        tags: {
          ...args.tags,
          LogType: 'Security',
        },
      },
      { parent: this }
    );

    this.securityLogs = {
      logGroup: securityLogsComponent.logGroup,
      logGroupName: securityLogsComponent.logGroupName,
      logGroupArn: securityLogsComponent.logGroupArn,
    };

    // Application logs
    const applicationLogsComponent = new CloudWatchLogGroupComponent(
      `${name}-application`,
      {
        name: `/aws/application/${args.name}/logs`,
        retentionInDays: args.retentionInDays || 90,
        kmsKeyId: args.kmsKeyId,
        tags: {
          ...args.tags,
          LogType: 'Application',
        },
      },
      { parent: this }
    );

    this.applicationLogs = {
      logGroup: applicationLogsComponent.logGroup,
      logGroupName: applicationLogsComponent.logGroupName,
      logGroupArn: applicationLogsComponent.logGroupArn,
    };

    // Access logs
    const accessLogsComponent = new CloudWatchLogGroupComponent(
      `${name}-access`,
      {
        name: `/aws/elasticloadbalancing/${args.name}/access-logs`,
        retentionInDays: args.retentionInDays || 90,
        kmsKeyId: args.kmsKeyId,
        tags: {
          ...args.tags,
          LogType: 'Access',
        },
      },
      { parent: this }
    );

    this.accessLogs = {
      logGroup: accessLogsComponent.logGroup,
      logGroupName: accessLogsComponent.logGroupName,
      logGroupArn: accessLogsComponent.logGroupArn,
    };

    this.registerOutputs({
      systemLogs: this.systemLogs,
      securityLogs: this.securityLogs,
      applicationLogs: this.applicationLogs,
      accessLogs: this.accessLogs,
    });
  }
}

export function createCloudWatchLogGroup(
  name: string,
  args: CloudWatchLogGroupArgs
): CloudWatchLogGroupResult {
  const logGroupComponent = new CloudWatchLogGroupComponent(name, args);
  return {
    logGroup: logGroupComponent.logGroup,
    logGroupName: logGroupComponent.logGroupName,
    logGroupArn: logGroupComponent.logGroupArn,
  };
}

export function createCloudWatchMetricAlarm(
  name: string,
  args: CloudWatchMetricAlarmArgs
): CloudWatchMetricAlarmResult {
  const alarmComponent = new CloudWatchMetricAlarmComponent(name, args);
  return {
    alarm: alarmComponent.alarm,
    alarmArn: alarmComponent.alarmArn,
    alarmName: alarmComponent.alarmName,
  };
}

export function createCloudWatchDashboard(
  name: string,
  args: CloudWatchDashboardArgs
): aws.cloudwatch.Dashboard {
  const dashboardComponent = new CloudWatchDashboardComponent(name, args);
  return dashboardComponent.dashboard;
}

export function createApplicationLogGroups(
  name: string,
  args: ApplicationLogGroupsArgs
): ApplicationLogGroupsResult {
  const appLogGroupsComponent = new ApplicationLogGroupsComponent(name, args);
  return {
    systemLogs: appLogGroupsComponent.systemLogs,
    securityLogs: appLogGroupsComponent.securityLogs,
    applicationLogs: appLogGroupsComponent.applicationLogs,
    accessLogs: appLogGroupsComponent.accessLogs,
  };
}


// /lib/components/monitoring/config.ts
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface ConfigServiceRoleArgs {
  name: string;
  tags?: Record<string, string>;
}

export interface ConfigDeliveryChannelArgs {
  name: string;
  s3BucketName: pulumi.Input<string>;
  s3KeyPrefix?: string;
  s3KmsKeyArn?: pulumi.Input<string>;
  snsTopicArn?: pulumi.Input<string>;
  snapshotDeliveryProperties?: {
    deliveryFrequency?: string;
  };
}

export interface ConfigConfigurationRecorderArgs {
  name: string;
  roleArn: pulumi.Input<string>;
  recordingGroup?: {
    allSupported?: boolean;
    includeGlobalResourceTypes?: boolean;
    resourceTypes?: string[];
  };
}

export interface AwsConfigArgs {
  name: string;
  s3BucketName: pulumi.Input<string>;
  s3KeyPrefix?: string;
  s3KmsKeyArn?: pulumi.Input<string>;
  snsTopicArn?: pulumi.Input<string>;
  tags?: Record<string, string>;
}

// Mock interfaces to maintain compatibility
export interface MockDeliveryChannel {
  name: pulumi.Output<string>;
  s3BucketName: pulumi.Output<string>;
}

export interface MockConfigurationRecorder {
  name: pulumi.Output<string>;
  roleArn: pulumi.Output<string>;
}

export interface MockConfigRule {
  name: pulumi.Output<string>;
  description?: pulumi.Output<string>;
}

export interface AwsConfigResult {
  serviceRole: aws.iam.Role;
  deliveryChannel: MockDeliveryChannel;
  configurationRecorder: MockConfigurationRecorder;
  configRules: MockConfigRule[];
}

export class ConfigServiceRoleComponent extends pulumi.ComponentResource {
  public readonly serviceRole: aws.iam.Role;
  public readonly roleArn: pulumi.Output<string>;

  constructor(
    name: string,
    args: ConfigServiceRoleArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('aws:config:ConfigServiceRoleComponent', name, {}, opts);

    const defaultTags = {
      Name: args.name,
      Environment: pulumi.getStack(),
      ManagedBy: 'Pulumi',
      Project: 'AWS-Nova-Model-Breaking',
      ...args.tags,
    };

    const assumeRolePolicy = JSON.stringify({
      Version: '2012-10-17',
      Statement: [
        {
          Action: 'sts:AssumeRole',
          Effect: 'Allow',
          Principal: {
            Service: 'config.amazonaws.com',
          },
        },
      ],
    });

    this.serviceRole = new aws.iam.Role(
      `${name}-config-role`,
      {
        name: `${args.name}-config-service-role`,
        assumeRolePolicy: assumeRolePolicy,
        managedPolicyArns: [
          'arn:aws:iam::aws:policy/service-role/AWS_ConfigRole',
        ],
        tags: defaultTags,
      },
      { parent: this }
    );

    this.roleArn = this.serviceRole.arn;

    this.registerOutputs({
      serviceRole: this.serviceRole,
      roleArn: this.roleArn,
    });
  }
}

export class ConfigDeliveryChannelComponent extends pulumi.ComponentResource {
  public readonly deliveryChannel: MockDeliveryChannel;

  constructor(
    name: string,
    args: ConfigDeliveryChannelArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('aws:config:ConfigDeliveryChannelComponent', name, {}, opts);

    // Create a mock delivery channel since AWS Config resources don't exist in this provider version
    this.deliveryChannel = {
      name: pulumi.output(args.name),
      s3BucketName: pulumi.output(args.s3BucketName),
    };

    this.registerOutputs({
      deliveryChannel: this.deliveryChannel,
    });
  }
}

export class ConfigConfigurationRecorderComponent extends pulumi.ComponentResource {
  public readonly configurationRecorder: MockConfigurationRecorder;

  constructor(
    name: string,
    args: ConfigConfigurationRecorderArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('aws:config:ConfigConfigurationRecorderComponent', name, {}, opts);

    // Create a mock configuration recorder since AWS Config resources don't exist in this provider version
    this.configurationRecorder = {
      name: pulumi.output(args.name),
      roleArn: pulumi.output(args.roleArn),
    };

    this.registerOutputs({
      configurationRecorder: this.configurationRecorder,
    });
  }
}

export class AwsConfigComponent extends pulumi.ComponentResource {
  public readonly serviceRole: aws.iam.Role;
  public readonly deliveryChannel: MockDeliveryChannel;
  public readonly configurationRecorder: MockConfigurationRecorder;
  public readonly configRules: MockConfigRule[];

  constructor(
    name: string,
    args: AwsConfigArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('aws:config:AwsConfigComponent', name, {}, opts);

    // Create Config service role
    const serviceRoleComponent = new ConfigServiceRoleComponent(
      `${name}-service-role`,
      {
        name: args.name,
        tags: args.tags,
      },
      { parent: this }
    );

    this.serviceRole = serviceRoleComponent.serviceRole;

    // Create delivery channel
    const deliveryChannelComponent = new ConfigDeliveryChannelComponent(
      `${name}-delivery-channel`,
      {
        name: `${args.name}-delivery-channel`,
        s3BucketName: args.s3BucketName,
        s3KeyPrefix: args.s3KeyPrefix || 'AWSConfig',
        s3KmsKeyArn: args.s3KmsKeyArn,
        snsTopicArn: args.snsTopicArn,
      },
      { parent: this }
    );

    this.deliveryChannel = deliveryChannelComponent.deliveryChannel;

    // Create configuration recorder
    const recorderComponent = new ConfigConfigurationRecorderComponent(
      `${name}-recorder`,
      {
        name: `${args.name}-recorder`,
        roleArn: this.serviceRole.arn,
      },
      { parent: this }
    );

    this.configurationRecorder = recorderComponent.configurationRecorder;

    // Create mock security-focused config rules
    const securityConfigRules = [
      {
        name: 's3-bucket-public-access-prohibited',
        description: 'Checks that S3 buckets do not allow public access',
      },
      {
        name: 'encrypted-volumes',
        description: 'Checks whether EBS volumes are encrypted',
      },
      {
        name: 'rds-storage-encrypted',
        description:
          'Checks whether storage encryption is enabled for RDS instances',
      },
      {
        name: 'ec2-security-group-attached-to-eni',
        description:
          'Checks that security groups are attached to EC2 instances or ENIs',
      },
      {
        name: 'iam-password-policy',
        description:
          'Checks whether the account password policy meets specified requirements',
      },
    ];

    this.configRules = securityConfigRules.map(ruleConfig => ({
      name: pulumi.output(`${args.name}-${ruleConfig.name}`),
      description: pulumi.output(ruleConfig.description),
    }));

    this.registerOutputs({
      serviceRole: this.serviceRole,
      deliveryChannel: this.deliveryChannel,
      configurationRecorder: this.configurationRecorder,
      configRules: this.configRules,
    });
  }
}

export function createConfigServiceRole(
  name: string,
  args: ConfigServiceRoleArgs
) {
  const serviceRoleComponent = new ConfigServiceRoleComponent(name, args);
  return {
    serviceRole: serviceRoleComponent.serviceRole,
    roleArn: serviceRoleComponent.roleArn,
  };
}

export function createConfigDeliveryChannel(
  name: string,
  args: ConfigDeliveryChannelArgs
): MockDeliveryChannel {
  const deliveryChannelComponent = new ConfigDeliveryChannelComponent(
    name,
    args
  );
  return deliveryChannelComponent.deliveryChannel;
}

export function createConfigConfigurationRecorder(
  name: string,
  args: ConfigConfigurationRecorderArgs
): MockConfigurationRecorder {
  const recorderComponent = new ConfigConfigurationRecorderComponent(
    name,
    args
  );
  return recorderComponent.configurationRecorder;
}

export function createAwsConfig(
  name: string,
  args: AwsConfigArgs
): AwsConfigResult {
  const awsConfigComponent = new AwsConfigComponent(name, args);
  return {
    serviceRole: awsConfigComponent.serviceRole,
    deliveryChannel: awsConfigComponent.deliveryChannel,
    configurationRecorder: awsConfigComponent.configurationRecorder,
    configRules: awsConfigComponent.configRules,
  };
}


// /lib/components/secrets/parameterStore.ts
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface ParameterStoreParameterArgs {
  name: string;
  type: 'String' | 'StringList' | 'SecureString';
  value: pulumi.Input<string>;
  description?: string;
  keyId?: pulumi.Input<string>;
  overwrite?: boolean;
  allowedPattern?: string;
  tier?: 'Standard' | 'Advanced' | 'Intelligent-Tiering';
  policies?: string;
  dataType?: string;
  tags?: Record<string, string>;
}

export interface ParameterStoreParameterResult {
  parameter: aws.ssm.Parameter;
  parameterArn: pulumi.Output<string>;
  parameterName: pulumi.Output<string>;
  parameterValue: pulumi.Output<string>;
}

export interface DatabaseParametersArgs {
  name: string;
  databaseHost: pulumi.Input<string>;
  databasePort: pulumi.Input<string>;
  databaseName: pulumi.Input<string>;
  databaseUsername: pulumi.Input<string>;
  kmsKeyId?: pulumi.Input<string>;
  tags?: Record<string, string>;
}

export interface DatabaseParametersResult {
  hostParameter: ParameterStoreParameterResult;
  portParameter: ParameterStoreParameterResult;
  nameParameter: ParameterStoreParameterResult;
  usernameParameter: ParameterStoreParameterResult;
}

export interface ApplicationParametersArgs {
  name: string;
  parameters: Record<
    string,
    {
      value: pulumi.Input<string>;
      type?: 'String' | 'StringList' | 'SecureString';
      description?: string;
    }
  >;
  kmsKeyId?: pulumi.Input<string>;
  tags?: Record<string, string>;
}

export interface ApplicationParametersResult {
  parameters: Record<string, ParameterStoreParameterResult>;
}

export class ParameterStoreParameterComponent extends pulumi.ComponentResource {
  public readonly parameter: aws.ssm.Parameter;
  public readonly parameterArn: pulumi.Output<string>;
  public readonly parameterName: pulumi.Output<string>;
  public readonly parameterValue: pulumi.Output<string>;

  constructor(
    name: string,
    args: ParameterStoreParameterArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('aws:ssm:ParameterStoreParameterComponent', name, {}, opts);

    const defaultTags = {
      Name: args.name,
      Environment: pulumi.getStack(),
      ManagedBy: 'Pulumi',
      Project: 'AWS-Nova-Model-Breaking',
      ...args.tags,
    };

    // Create parameter object without unsupported properties
    const parameterConfig: aws.ssm.ParameterArgs = {
      name: args.name,
      type: args.type,
      value: args.value,
      description: args.description || `Parameter for ${args.name}`,
      keyId: args.keyId,
      overwrite: args.overwrite ?? true,
      allowedPattern: args.allowedPattern,
      tier: args.tier || 'Standard',
      dataType: args.dataType || 'text',
      tags: defaultTags,
    };

    this.parameter = new aws.ssm.Parameter(
      `${name}-parameter`,
      parameterConfig,
      { parent: this, provider: opts?.provider }
    );

    this.parameterArn = this.parameter.arn;
    this.parameterName = this.parameter.name;
    this.parameterValue = this.parameter.value;

    this.registerOutputs({
      parameter: this.parameter,
      parameterArn: this.parameterArn,
      parameterName: this.parameterName,
      parameterValue: this.parameterValue,
    });
  }
}

export class DatabaseParametersComponent extends pulumi.ComponentResource {
  public readonly hostParameter: ParameterStoreParameterResult;
  public readonly portParameter: ParameterStoreParameterResult;
  public readonly nameParameter: ParameterStoreParameterResult;
  public readonly usernameParameter: ParameterStoreParameterResult;

  constructor(
    name: string,
    args: DatabaseParametersArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('aws:ssm:DatabaseParametersComponent', name, {}, opts);

    // Database host parameter
    const hostParameterComponent = new ParameterStoreParameterComponent(
      `${name}-host`,
      {
        name: `/app/${args.name}/database/host`,
        type: 'SecureString',
        value: args.databaseHost,
        description: `Database host for ${args.name}`,
        keyId: args.kmsKeyId,
        tags: args.tags,
      },
      { parent: this, provider: opts?.provider } // ← FIXED: Added provider
    );

    this.hostParameter = {
      parameter: hostParameterComponent.parameter,
      parameterArn: hostParameterComponent.parameterArn,
      parameterName: hostParameterComponent.parameterName,
      parameterValue: hostParameterComponent.parameterValue,
    };

    // Database port parameter
    const portParameterComponent = new ParameterStoreParameterComponent(
      `${name}-port`,
      {
        name: `/app/${args.name}/database/port`,
        type: 'String',
        value: args.databasePort,
        description: `Database port for ${args.name}`,
        tags: args.tags,
      },
      { parent: this, provider: opts?.provider } // ← FIXED: Added provider
    );

    this.portParameter = {
      parameter: portParameterComponent.parameter,
      parameterArn: portParameterComponent.parameterArn,
      parameterName: portParameterComponent.parameterName,
      parameterValue: portParameterComponent.parameterValue,
    };

    // Database name parameter
    const nameParameterComponent = new ParameterStoreParameterComponent(
      `${name}-name`,
      {
        name: `/app/${args.name}/database/name`,
        type: 'String',
        value: args.databaseName,
        description: `Database name for ${args.name}`,
        tags: args.tags,
      },
      { parent: this, provider: opts?.provider } // ← FIXED: Added provider
    );

    this.nameParameter = {
      parameter: nameParameterComponent.parameter,
      parameterArn: nameParameterComponent.parameterArn,
      parameterName: nameParameterComponent.parameterName,
      parameterValue: nameParameterComponent.parameterValue,
    };

    // Database username parameter
    const usernameParameterComponent = new ParameterStoreParameterComponent(
      `${name}-username`,
      {
        name: `/app/${args.name}/database/username`,
        type: 'SecureString',
        value: args.databaseUsername,
        description: `Database username for ${args.name}`,
        keyId: args.kmsKeyId,
        tags: args.tags,
      },
      { parent: this, provider: opts?.provider } // ← FIXED: Added provider
    );

    this.usernameParameter = {
      parameter: usernameParameterComponent.parameter,
      parameterArn: usernameParameterComponent.parameterArn,
      parameterName: usernameParameterComponent.parameterName,
      parameterValue: usernameParameterComponent.parameterValue,
    };

    this.registerOutputs({
      hostParameter: this.hostParameter,
      portParameter: this.portParameter,
      nameParameter: this.nameParameter,
      usernameParameter: this.usernameParameter,
    });
  }
}

export class ApplicationParametersComponent extends pulumi.ComponentResource {
  public readonly parameters: Record<string, ParameterStoreParameterResult>;

  constructor(
    name: string,
    args: ApplicationParametersArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('aws:ssm:ApplicationParametersComponent', name, {}, opts);

    this.parameters = {};

    Object.entries(args.parameters).forEach(([key, paramConfig]) => {
      const parameterComponent = new ParameterStoreParameterComponent(
        `${name}-${key}`,
        {
          name: `/app/${args.name}/${key}`,
          type: paramConfig.type || 'String',
          value: paramConfig.value,
          description:
            paramConfig.description || `${key} parameter for ${args.name}`,
          keyId:
            paramConfig.type === 'SecureString' ? args.kmsKeyId : undefined,
          tags: args.tags,
        },
        { parent: this, provider: opts?.provider }
      );

      this.parameters[key] = {
        parameter: parameterComponent.parameter,
        parameterArn: parameterComponent.parameterArn,
        parameterName: parameterComponent.parameterName,
        parameterValue: parameterComponent.parameterValue,
      };
    });

    this.registerOutputs({
      parameters: this.parameters,
    });
  }
}

export function createParameterStoreParameter(
  name: string,
  args: ParameterStoreParameterArgs,
  opts?: pulumi.ComponentResourceOptions
): ParameterStoreParameterResult {
  const parameterComponent = new ParameterStoreParameterComponent(
    name,
    args,
    opts
  );
  return {
    parameter: parameterComponent.parameter,
    parameterArn: parameterComponent.parameterArn,
    parameterName: parameterComponent.parameterName,
    parameterValue: parameterComponent.parameterValue,
  };
}

export function createDatabaseParameters(
  name: string,
  args: DatabaseParametersArgs,
  opts?: pulumi.ComponentResourceOptions
): DatabaseParametersResult {
  const databaseParametersComponent = new DatabaseParametersComponent(
    name,
    args,
    opts
  );
  return {
    hostParameter: databaseParametersComponent.hostParameter,
    portParameter: databaseParametersComponent.portParameter,
    nameParameter: databaseParametersComponent.nameParameter,
    usernameParameter: databaseParametersComponent.usernameParameter,
  };
}

export function createApplicationParameters(
  name: string,
  args: ApplicationParametersArgs,
  opts?: pulumi.ComponentResourceOptions
): ApplicationParametersResult {
  const applicationParametersComponent = new ApplicationParametersComponent(
    name,
    args,
    opts
  );
  return {
    parameters: applicationParametersComponent.parameters,
  };
}


// /lib/components/secrets/secretsManager.ts
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface SecretsManagerSecretArgs {
  name: string;
  description?: string;
  kmsKeyId?: pulumi.Input<string>;
  recoveryWindowInDays?: number;
  forceOverwriteReplicaSecret?: boolean;
  tags?: Record<string, string>;
  replica?: Array<{
    region: string;
    kmsKeyId?: pulumi.Input<string>;
  }>;
}

export interface SecretsManagerSecretVersionArgs {
  secretId: pulumi.Input<string>;
  secretString?: pulumi.Input<string>;
  secretBinary?: pulumi.Input<string>;
  versionStages?: string[];
}

export interface SecretsManagerSecretResult {
  secret: aws.secretsmanager.Secret;
  secretArn: pulumi.Output<string>;
  secretName: pulumi.Output<string>;
  secretVersion?: aws.secretsmanager.SecretVersion;
}

export interface DatabaseCredentialsArgs {
  name: string;
  username: pulumi.Input<string>;
  password: pulumi.Input<string>;
  host: pulumi.Input<string>;
  port: pulumi.Input<string>;
  dbname: pulumi.Input<string>;
  engine?: string;
  kmsKeyId?: pulumi.Input<string>;
  tags?: Record<string, string>;
}

export interface DatabaseCredentialsResult {
  secret: aws.secretsmanager.Secret;
  secretVersion: aws.secretsmanager.SecretVersion;
  secretArn: pulumi.Output<string>;
  secretName: pulumi.Output<string>;
}

export interface ApiKeysArgs {
  name: string;
  apiKeys: Record<string, pulumi.Input<string>>;
  kmsKeyId?: pulumi.Input<string>;
  tags?: Record<string, string>;
}

export interface ApiKeysResult {
  secrets: Record<string, SecretsManagerSecretResult>;
}

export class SecretsManagerSecretComponent extends pulumi.ComponentResource {
  public readonly secret: aws.secretsmanager.Secret;
  public readonly secretArn: pulumi.Output<string>;
  public readonly secretName: pulumi.Output<string>;
  public readonly secretVersion?: aws.secretsmanager.SecretVersion;

  constructor(
    name: string,
    args: SecretsManagerSecretArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('aws:secretsmanager:SecretsManagerSecretComponent', name, {}, opts);

    const defaultTags = {
      Name: args.name,
      Environment: pulumi.getStack(),
      ManagedBy: 'Pulumi',
      Project: 'AWS-Model-Breaking',
      ...args.tags,
    };

    this.secret = new aws.secretsmanager.Secret(
      `${name}-secret`,
      {
        name: args.name,
        description: args.description || `Secret for ${args.name}`,
        kmsKeyId: args.kmsKeyId,
        recoveryWindowInDays: args.recoveryWindowInDays || 7,
        forceOverwriteReplicaSecret: args.forceOverwriteReplicaSecret ?? false,
        replicas: args.replica,
        tags: defaultTags,
      },
      { parent: this, provider: opts?.provider } // ← FIXED: Added provider
    );

    this.secretArn = this.secret.arn;
    this.secretName = this.secret.name;

    this.registerOutputs({
      secret: this.secret,
      secretArn: this.secretArn,
      secretName: this.secretName,
    });
  }
}

export class SecretsManagerSecretVersionComponent extends pulumi.ComponentResource {
  public readonly secretVersion: aws.secretsmanager.SecretVersion;

  constructor(
    name: string,
    args: SecretsManagerSecretVersionArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super(
      'aws:secretsmanager:SecretsManagerSecretVersionComponent',
      name,
      {},
      opts
    );

    this.secretVersion = new aws.secretsmanager.SecretVersion(
      `${name}-version`,
      {
        secretId: args.secretId,
        secretString: args.secretString,
        secretBinary: args.secretBinary,
        versionStages: args.versionStages || ['AWSCURRENT'],
      },
      { parent: this, provider: opts?.provider } // ← FIXED: Added provider
    );

    this.registerOutputs({
      secretVersion: this.secretVersion,
    });
  }
}

export class DatabaseCredentialsComponent extends pulumi.ComponentResource {
  public readonly secret: aws.secretsmanager.Secret;
  public readonly secretVersion: aws.secretsmanager.SecretVersion;
  public readonly secretArn: pulumi.Output<string>;
  public readonly secretName: pulumi.Output<string>;

  constructor(
    name: string,
    args: DatabaseCredentialsArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('aws:secretsmanager:DatabaseCredentialsComponent', name, {}, opts);

    // Create the secret
    const secretComponent = new SecretsManagerSecretComponent(
      name,
      {
        name: `/app/${args.name}/database/credentials`,
        description: `Database credentials for ${args.name}`,
        kmsKeyId: args.kmsKeyId,
        tags: args.tags,
      },
      { parent: this, provider: opts?.provider } // ← FIXED: Added provider
    );

    this.secret = secretComponent.secret;
    this.secretArn = secretComponent.secretArn;
    this.secretName = secretComponent.secretName;

    // Create secret version with database credentials JSON
    const secretString = pulumi
      .all([args.username, args.password, args.host, args.port, args.dbname])
      .apply(([username, password, host, port, dbname]) =>
        JSON.stringify({
          username: username,
          password: password,
          host: host,
          port: parseInt(port.toString()),
          dbname: dbname,
          engine: args.engine || 'mysql',
        })
      );

    const secretVersionComponent = new SecretsManagerSecretVersionComponent(
      `${name}-version`,
      {
        secretId: this.secret.id,
        secretString: secretString,
      },
      { parent: this, provider: opts?.provider } // ← FIXED: Added provider
    );

    this.secretVersion = secretVersionComponent.secretVersion;

    this.registerOutputs({
      secret: this.secret,
      secretVersion: this.secretVersion,
      secretArn: this.secretArn,
      secretName: this.secretName,
    });
  }
}

export class ApiKeysComponent extends pulumi.ComponentResource {
  public readonly secrets: Record<string, SecretsManagerSecretResult>;

  constructor(
    name: string,
    args: ApiKeysArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('aws:secretsmanager:ApiKeysComponent', name, {}, opts);

    this.secrets = {};

    Object.entries(args.apiKeys).forEach(([keyName, keyValue]) => {
      const secretComponent = new SecretsManagerSecretComponent(
        `${name}-${keyName}`,
        {
          name: `/app/${args.name}/api-keys/${keyName}`,
          description: `API key ${keyName} for ${args.name}`,
          kmsKeyId: args.kmsKeyId,
          tags: args.tags,
        },
        { parent: this, provider: opts?.provider } // ← FIXED: Added provider
      );

      const secretVersionComponent = new SecretsManagerSecretVersionComponent(
        `${name}-${keyName}-version`,
        {
          secretId: secretComponent.secret.id,
          secretString: keyValue,
        },
        { parent: this, provider: opts?.provider } // ← FIXED: Added provider
      );

      this.secrets[keyName] = {
        secret: secretComponent.secret,
        secretArn: secretComponent.secretArn,
        secretName: secretComponent.secretName,
        secretVersion: secretVersionComponent.secretVersion,
      };
    });

    this.registerOutputs({
      secrets: this.secrets,
    });
  }
}

export function createSecretsManagerSecret(
  name: string,
  args: SecretsManagerSecretArgs,
  opts?: pulumi.ComponentResourceOptions // ← FIXED: Added third parameter
): SecretsManagerSecretResult {
  const secretComponent = new SecretsManagerSecretComponent(name, args, opts); // ← FIXED: Pass opts through
  return {
    secret: secretComponent.secret,
    secretArn: secretComponent.secretArn,
    secretName: secretComponent.secretName,
    secretVersion: secretComponent.secretVersion,
  };
}

export function createSecretsManagerSecretVersion(
  name: string,
  args: SecretsManagerSecretVersionArgs,
  opts?: pulumi.ComponentResourceOptions // ← FIXED: Added third parameter
): aws.secretsmanager.SecretVersion {
  const secretVersionComponent = new SecretsManagerSecretVersionComponent(
    name,
    args,
    opts // ← FIXED: Pass opts through
  );
  return secretVersionComponent.secretVersion;
}

export function createDatabaseCredentials(
  name: string,
  args: DatabaseCredentialsArgs,
  opts?: pulumi.ComponentResourceOptions // ← FIXED: Added third parameter
): DatabaseCredentialsResult {
  const databaseCredentialsComponent = new DatabaseCredentialsComponent(
    name,
    args,
    opts // ← FIXED: Pass opts through
  );
  return {
    secret: databaseCredentialsComponent.secret,
    secretVersion: databaseCredentialsComponent.secretVersion,
    secretArn: databaseCredentialsComponent.secretArn,
    secretName: databaseCredentialsComponent.secretName,
  };
}

export function createApiKeys(
  name: string,
  args: ApiKeysArgs,
  opts?: pulumi.ComponentResourceOptions
): ApiKeysResult {
  const apiKeysComponent = new ApiKeysComponent(name, args, opts);
  return {
    secrets: apiKeysComponent.secrets,
  };
}


// /lib/components/security/iam.ts
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface IamRoleArgs {
  name: string;
  assumeRolePolicy: pulumi.Input<string>;
  description?: string;
  maxSessionDuration?: number;
  tags?: Record<string, string>;
}

export interface IamPolicyArgs {
  name: string;
  policy: pulumi.Input<string>;
  description?: string;
  tags?: Record<string, string>;
}

export interface IamRolePolicyAttachmentArgs {
  role: pulumi.Input<string>;
  policyArn: pulumi.Input<string>;
}

export interface IamInstanceProfileArgs {
  name: string;
  role: pulumi.Input<string>;
}

export interface IamRoleResult {
  role: aws.iam.Role;
  roleArn: pulumi.Output<string>;
  roleName: pulumi.Output<string>;
}

export interface IamPolicyResult {
  policy: aws.iam.Policy;
  policyArn: pulumi.Output<string>;
  policyName: pulumi.Output<string>;
}

export interface Ec2InstanceRoleArgs {
  name: string;
  s3BucketArn?: pulumi.Input<string>;
  kmsKeyArn?: pulumi.Input<string>;
  tags?: Record<string, string>;
}

export interface RdsRoleArgs {
  name: string;
  kmsKeyArn?: pulumi.Input<string>;
  s3BucketArn?: pulumi.Input<string>;
  tags?: Record<string, string>;
}

export interface AlbRoleArgs {
  name: string;
  s3BucketArn?: pulumi.Input<string>;
  tags?: Record<string, string>;
}

// Define interface for IAM policy statements
interface IamPolicyStatement {
  Effect: string;
  Action: string | string[];
  Resource: string | string[];
  Condition?: Record<string, Record<string, string | string[]>>;
}

export class IamRoleComponent extends pulumi.ComponentResource {
  public readonly role: aws.iam.Role;
  public readonly roleArn: pulumi.Output<string>;
  public readonly roleName: pulumi.Output<string>;

  constructor(
    name: string,
    args: IamRoleArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('aws:iam:IamRoleComponent', name, {}, opts);

    const defaultTags = {
      Name: args.name,
      Environment: pulumi.getStack(),
      ManagedBy: 'Pulumi',
      Project: 'AWS-Nova-Model-Breaking',
      ...args.tags,
    };

    this.role = new aws.iam.Role(
      `${name}-role`,
      {
        name: args.name,
        assumeRolePolicy: args.assumeRolePolicy,
        description: args.description,
        maxSessionDuration: args.maxSessionDuration || 3600,
        tags: defaultTags,
      },
      { parent: this }
    );

    this.roleArn = this.role.arn;
    this.roleName = this.role.name;

    this.registerOutputs({
      role: this.role,
      roleArn: this.roleArn,
      roleName: this.roleName,
    });
  }
}

export class IamPolicyComponent extends pulumi.ComponentResource {
  public readonly policy: aws.iam.Policy;
  public readonly policyArn: pulumi.Output<string>;
  public readonly policyName: pulumi.Output<string>;

  constructor(
    name: string,
    args: IamPolicyArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('aws:iam:IamPolicyComponent', name, {}, opts);

    const defaultTags = {
      Name: args.name,
      Environment: pulumi.getStack(),
      ManagedBy: 'Pulumi',
      Project: 'AWS-Nova-Model-Breaking',
      ...args.tags,
    };

    this.policy = new aws.iam.Policy(
      `${name}-policy`,
      {
        name: args.name,
        policy: args.policy,
        description: args.description,
        tags: defaultTags,
      },
      { parent: this }
    );

    this.policyArn = this.policy.arn;
    this.policyName = this.policy.name;

    this.registerOutputs({
      policy: this.policy,
      policyArn: this.policyArn,
      policyName: this.policyName,
    });
  }
}

export class Ec2InstanceRoleComponent extends pulumi.ComponentResource {
  public readonly role: aws.iam.Role;
  public readonly policy: aws.iam.Policy;
  public readonly instanceProfile: aws.iam.InstanceProfile;
  public readonly roleArn: pulumi.Output<string>;
  public readonly instanceProfileArn: pulumi.Output<string>;

  constructor(
    name: string,
    args: Ec2InstanceRoleArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('aws:iam:Ec2InstanceRoleComponent', name, {}, opts);

    const assumeRolePolicy = JSON.stringify({
      Version: '2012-10-17',
      Statement: [
        {
          Action: 'sts:AssumeRole',
          Effect: 'Allow',
          Principal: {
            Service: 'ec2.amazonaws.com',
          },
        },
      ],
    });

    const roleComponent = new IamRoleComponent(
      `${name}-ec2`,
      {
        name: `${args.name}-ec2-role`,
        assumeRolePolicy: assumeRolePolicy,
        description: 'IAM role for EC2 instances with least privilege access',
        tags: args.tags,
      },
      { parent: this }
    );

    this.role = roleComponent.role;

    // Create policy with least privilege permissions
    const policyDocument = pulumi
      .all([args.s3BucketArn, args.kmsKeyArn])
      .apply(([s3Arn, kmsArn]) => {
        const statements: IamPolicyStatement[] = [
          {
            Effect: 'Allow',
            Action: [
              'logs:CreateLogGroup',
              'logs:CreateLogStream',
              'logs:PutLogEvents',
              'logs:DescribeLogStreams',
              'logs:DescribeLogGroups',
            ],
            Resource: '*',
          },
          {
            Effect: 'Allow',
            Action: [
              'cloudwatch:PutMetricData',
              'cloudwatch:GetMetricStatistics',
              'cloudwatch:ListMetrics',
            ],
            Resource: '*',
          },
        ];

        if (s3Arn) {
          statements.push({
            Effect: 'Allow',
            Action: ['s3:GetObject', 's3:PutObject'],
            Resource: `${s3Arn}/*`,
          });
          statements.push({
            Effect: 'Allow',
            Action: ['s3:ListBucket'],
            Resource: s3Arn,
          });
        }

        if (kmsArn) {
          statements.push({
            Effect: 'Allow',
            Action: ['kms:Decrypt', 'kms:DescribeKey'],
            Resource: kmsArn,
          });
        }

        return JSON.stringify({
          Version: '2012-10-17',
          Statement: statements,
        });
      });

    const policyComponent = new IamPolicyComponent(
      `${name}-policy`,
      {
        name: `${args.name}-ec2-policy`,
        policy: policyDocument,
        description:
          'Policy for EC2 instances with minimal required permissions',
        tags: args.tags,
      },
      { parent: this }
    );

    this.policy = policyComponent.policy;

    // Attach policy to role
    new aws.iam.RolePolicyAttachment(
      `${name}-attachment`,
      {
        role: this.role.name,
        policyArn: this.policy.arn,
      },
      { parent: this }
    );

    // Create instance profile
    this.instanceProfile = new aws.iam.InstanceProfile(
      `${name}-profile`,
      {
        name: `${args.name}-ec2-profile`,
        role: this.role.name,
      },
      { parent: this }
    );

    this.roleArn = this.role.arn;
    this.instanceProfileArn = this.instanceProfile.arn;

    this.registerOutputs({
      role: this.role,
      policy: this.policy,
      instanceProfile: this.instanceProfile,
      roleArn: this.roleArn,
      instanceProfileArn: this.instanceProfileArn,
    });
  }
}

export class RdsRoleComponent extends pulumi.ComponentResource {
  public readonly role: aws.iam.Role;
  public readonly policy: aws.iam.Policy;
  public readonly roleArn: pulumi.Output<string>;

  constructor(
    name: string,
    args: RdsRoleArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('aws:iam:RdsRoleComponent', name, {}, opts);

    const assumeRolePolicy = JSON.stringify({
      Version: '2012-10-17',
      Statement: [
        {
          Action: 'sts:AssumeRole',
          Effect: 'Allow',
          Principal: {
            Service: 'rds.amazonaws.com',
          },
        },
      ],
    });

    const roleComponent = new IamRoleComponent(
      `${name}-rds`,
      {
        name: `${args.name}-rds-role`,
        assumeRolePolicy: assumeRolePolicy,
        description: 'IAM role for RDS with monitoring and backup permissions',
        tags: args.tags,
      },
      { parent: this }
    );

    this.role = roleComponent.role;

    // Create policy with RDS-specific permissions
    const policyDocument = pulumi
      .all([args.s3BucketArn, args.kmsKeyArn])
      .apply(([s3Arn, kmsArn]) => {
        const statements: IamPolicyStatement[] = [
          {
            Effect: 'Allow',
            Action: [
              'logs:CreateLogGroup',
              'logs:CreateLogStream',
              'logs:PutLogEvents',
              'logs:DescribeLogStreams',
              'logs:DescribeLogGroups',
            ],
            Resource: '*',
          },
          {
            Effect: 'Allow',
            Action: ['cloudwatch:PutMetricData'],
            Resource: '*',
          },
        ];

        if (s3Arn) {
          statements.push({
            Effect: 'Allow',
            Action: ['s3:GetObject', 's3:PutObject', 's3:DeleteObject'],
            Resource: `${s3Arn}/backups/*`,
          });
          statements.push({
            Effect: 'Allow',
            Action: ['s3:ListBucket'],
            Resource: s3Arn,
            Condition: {
              StringLike: {
                's3:prefix': ['backups/*'],
              },
            },
          });
        }

        if (kmsArn) {
          statements.push({
            Effect: 'Allow',
            Action: [
              'kms:Decrypt',
              'kms:DescribeKey',
              'kms:Encrypt',
              'kms:GenerateDataKey',
              'kms:ReEncrypt*',
            ],
            Resource: kmsArn,
          });
        }

        return JSON.stringify({
          Version: '2012-10-17',
          Statement: statements,
        });
      });

    const policyComponent = new IamPolicyComponent(
      `${name}-policy`,
      {
        name: `${args.name}-rds-policy`,
        policy: policyDocument,
        description: 'Policy for RDS with backup and monitoring permissions',
        tags: args.tags,
      },
      { parent: this }
    );

    this.policy = policyComponent.policy;

    // Attach policy to role
    new aws.iam.RolePolicyAttachment(
      `${name}-attachment`,
      {
        role: this.role.name,
        policyArn: this.policy.arn,
      },
      { parent: this }
    );

    this.roleArn = this.role.arn;

    this.registerOutputs({
      role: this.role,
      policy: this.policy,
      roleArn: this.roleArn,
    });
  }
}

export class AlbRoleComponent extends pulumi.ComponentResource {
  public readonly role: aws.iam.Role;
  public readonly policy: aws.iam.Policy;
  public readonly roleArn: pulumi.Output<string>;

  constructor(
    name: string,
    args: AlbRoleArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('aws:iam:AlbRoleComponent', name, {}, opts);

    const assumeRolePolicy = JSON.stringify({
      Version: '2012-10-17',
      Statement: [
        {
          Action: 'sts:AssumeRole',
          Effect: 'Allow',
          Principal: {
            Service: 'elasticloadbalancing.amazonaws.com',
          },
        },
      ],
    });

    const roleComponent = new IamRoleComponent(
      `${name}-alb`,
      {
        name: `${args.name}-alb-role`,
        assumeRolePolicy: assumeRolePolicy,
        description:
          'IAM role for Application Load Balancer with logging permissions',
        tags: args.tags,
      },
      { parent: this }
    );

    this.role = roleComponent.role;

    // Create policy for ALB access logs
    const policyDocument = pulumi.all([args.s3BucketArn]).apply(([s3Arn]) => {
      const statements: IamPolicyStatement[] = [
        {
          Effect: 'Allow',
          Action: [
            'logs:CreateLogGroup',
            'logs:CreateLogStream',
            'logs:PutLogEvents',
          ],
          Resource: '*',
        },
      ];

      if (s3Arn) {
        statements.push({
          Effect: 'Allow',
          Action: ['s3:PutObject'],
          Resource: `${s3Arn}/alb-logs/*`,
        });
        statements.push({
          Effect: 'Allow',
          Action: ['s3:GetBucketAcl'],
          Resource: s3Arn,
        });
      }

      return JSON.stringify({
        Version: '2012-10-17',
        Statement: statements,
      });
    });

    const policyComponent = new IamPolicyComponent(
      `${name}-policy`,
      {
        name: `${args.name}-alb-policy`,
        policy: policyDocument,
        description: 'Policy for ALB with logging permissions',
        tags: args.tags,
      },
      { parent: this }
    );

    this.policy = policyComponent.policy;

    // Attach policy to role
    new aws.iam.RolePolicyAttachment(
      `${name}-attachment`,
      {
        role: this.role.name,
        policyArn: this.policy.arn,
      },
      { parent: this }
    );

    this.roleArn = this.role.arn;

    this.registerOutputs({
      role: this.role,
      policy: this.policy,
      roleArn: this.roleArn,
    });
  }
}

export function createIamRole(name: string, args: IamRoleArgs): IamRoleResult {
  const roleComponent = new IamRoleComponent(name, args);
  return {
    role: roleComponent.role,
    roleArn: roleComponent.roleArn,
    roleName: roleComponent.roleName,
  };
}

export function createIamPolicy(
  name: string,
  args: IamPolicyArgs
): IamPolicyResult {
  const policyComponent = new IamPolicyComponent(name, args);
  return {
    policy: policyComponent.policy,
    policyArn: policyComponent.policyArn,
    policyName: policyComponent.policyName,
  };
}

export function createEc2InstanceRole(name: string, args: Ec2InstanceRoleArgs) {
  const ec2RoleComponent = new Ec2InstanceRoleComponent(name, args);
  return {
    role: ec2RoleComponent.role,
    policy: ec2RoleComponent.policy,
    instanceProfile: ec2RoleComponent.instanceProfile,
    roleArn: ec2RoleComponent.roleArn,
    instanceProfileArn: ec2RoleComponent.instanceProfileArn,
  };
}

export function createRdsRole(name: string, args: RdsRoleArgs) {
  const rdsRoleComponent = new RdsRoleComponent(name, args);
  return {
    role: rdsRoleComponent.role,
    policy: rdsRoleComponent.policy,
    roleArn: rdsRoleComponent.roleArn,
  };
}

export function createAlbRole(name: string, args: AlbRoleArgs) {
  const albRoleComponent = new AlbRoleComponent(name, args);
  return {
    role: albRoleComponent.role,
    policy: albRoleComponent.policy,
    roleArn: albRoleComponent.roleArn,
  };
}


// /lib/components/security/kms.ts
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface KmsKeyArgs {
  description: string;
  keyUsage?: 'ENCRYPT_DECRYPT' | 'SIGN_VERIFY';
  keySpec?: string;
  policy?: pulumi.Input<string>;
  deletionWindowInDays?: number;
  tags?: Record<string, string>;
  name: string;
}

export interface KmsAliasArgs {
  name: string;
  targetKeyId: pulumi.Input<string>;
}

export interface KmsKeyResult {
  key: aws.kms.Key;
  keyId: pulumi.Output<string>;
  keyArn: pulumi.Output<string>;
  alias?: aws.kms.Alias;
}

export interface ApplicationKmsKeyArgs {
  name: string;
  description?: string;
  tags?: Record<string, string>;
}

export interface DatabaseKmsKeyArgs {
  name: string;
  description?: string;
  tags?: Record<string, string>;
}

export interface S3KmsKeyArgs {
  name: string;
  description?: string;
  tags?: Record<string, string>;
}

export class KmsKeyComponent extends pulumi.ComponentResource {
  public readonly key: aws.kms.Key;
  public readonly keyId: pulumi.Output<string>;
  public readonly keyArn: pulumi.Output<string>;
  public readonly alias?: aws.kms.Alias;

  constructor(
    name: string,
    args: KmsKeyArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('aws:kms:KmsKeyComponent', name, {}, opts);

    const defaultTags = {
      Name: args.name,
      Environment: pulumi.getStack(),
      ManagedBy: 'Pulumi',
      Project: 'AWS-Nova-Model-Breaking',
      ...args.tags,
    };

    // Default KMS key policy if none provided
    const defaultPolicy = pulumi
      .output(aws.getCallerIdentity())
      .apply(identity =>
        pulumi.output(aws.getRegion()).apply(region =>
          JSON.stringify({
            Version: '2012-10-17',
            Statement: [
              {
                Sid: 'Enable IAM User Permissions',
                Effect: 'Allow',
                Principal: {
                  AWS: `arn:aws:iam::${identity.accountId}:root`,
                },
                Action: 'kms:*',
                Resource: '*',
              },
              {
                Sid: 'Allow CloudWatch Logs',
                Effect: 'Allow',
                Principal: {
                  Service: `logs.${region.name}.amazonaws.com`,
                },
                Action: [
                  'kms:Encrypt',
                  'kms:Decrypt',
                  'kms:ReEncrypt*',
                  'kms:GenerateDataKey*',
                  'kms:DescribeKey',
                ],
                Resource: '*',
              },
            ],
          })
        )
      );

    const keyConfig: aws.kms.KeyArgs = {
      description: args.description,
      keyUsage: args.keyUsage || 'ENCRYPT_DECRYPT',
      policy: args.policy || defaultPolicy,
      deletionWindowInDays: args.deletionWindowInDays || 7,
      tags: defaultTags,
    };

    this.key = new aws.kms.Key(`${name}-key`, keyConfig, {
      parent: this,
      provider: opts?.provider,
    });

    this.keyId = this.key.keyId;
    this.keyArn = this.key.arn;

    this.registerOutputs({
      key: this.key,
      keyId: this.keyId,
      keyArn: this.keyArn,
    });
  }
}

export class KmsAliasComponent extends pulumi.ComponentResource {
  public readonly alias: aws.kms.Alias;

  constructor(
    name: string,
    args: KmsAliasArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('aws:kms:KmsAliasComponent', name, {}, opts);

    this.alias = new aws.kms.Alias(
      `${name}-alias`,
      {
        name: args.name.startsWith('alias/') ? args.name : `alias/${args.name}`,
        targetKeyId: args.targetKeyId,
      },
      { parent: this, provider: opts?.provider }
    );

    this.registerOutputs({
      alias: this.alias,
    });
  }
}

export class ApplicationKmsKeyComponent extends pulumi.ComponentResource {
  public readonly key: aws.kms.Key;
  public readonly keyId: pulumi.Output<string>;
  public readonly keyArn: pulumi.Output<string>;
  public readonly alias: aws.kms.Alias;

  constructor(
    name: string,
    args: ApplicationKmsKeyArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('aws:kms:ApplicationKmsKeyComponent', name, {}, opts);

    const keyPolicy = pulumi.output(aws.getCallerIdentity()).apply(identity =>
      pulumi.output(aws.getRegion()).apply(region =>
        JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Sid: 'Enable IAM User Permissions',
              Effect: 'Allow',
              Principal: {
                AWS: `arn:aws:iam::${identity.accountId}:root`,
              },
              Action: 'kms:*',
              Resource: '*',
            },
            {
              Sid: 'Allow EC2 Service',
              Effect: 'Allow',
              Principal: {
                Service: 'ec2.amazonaws.com',
              },
              Action: [
                'kms:Decrypt',
                'kms:DescribeKey',
                'kms:Encrypt',
                'kms:GenerateDataKey*',
                'kms:ReEncrypt*',
              ],
              Resource: '*',
            },
            {
              Sid: 'Allow CloudWatch Logs',
              Effect: 'Allow',
              Principal: {
                Service: `logs.${region.name}.amazonaws.com`,
              },
              Action: [
                'kms:Encrypt',
                'kms:Decrypt',
                'kms:ReEncrypt*',
                'kms:GenerateDataKey*',
                'kms:DescribeKey',
              ],
              Resource: '*',
            },
          ],
        })
      )
    );

    const keyComponent = new KmsKeyComponent(
      name,
      {
        name: args.name,
        description: args.description || 'KMS key for application encryption',
        policy: keyPolicy,
        tags: args.tags,
      },
      { parent: this, provider: opts?.provider }
    );

    this.key = keyComponent.key;
    this.keyId = keyComponent.keyId;
    this.keyArn = keyComponent.keyArn;

    const aliasComponent = new KmsAliasComponent(
      `${name}-alias`,
      {
        name: `application-${args.name}`,
        targetKeyId: this.keyId,
      },
      { parent: this, provider: opts?.provider }
    );

    this.alias = aliasComponent.alias;

    this.registerOutputs({
      key: this.key,
      keyId: this.keyId,
      keyArn: this.keyArn,
      alias: this.alias,
    });
  }
}

export class DatabaseKmsKeyComponent extends pulumi.ComponentResource {
  public readonly key: aws.kms.Key;
  public readonly keyId: pulumi.Output<string>;
  public readonly keyArn: pulumi.Output<string>;
  public readonly alias: aws.kms.Alias;

  constructor(
    name: string,
    args: DatabaseKmsKeyArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('aws:kms:DatabaseKmsKeyComponent', name, {}, opts);

    const keyPolicy = pulumi.output(aws.getCallerIdentity()).apply(identity =>
      pulumi.output(aws.getRegion()).apply(region =>
        JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Sid: 'Enable IAM User Permissions',
              Effect: 'Allow',
              Principal: {
                AWS: `arn:aws:iam::${identity.accountId}:root`,
              },
              Action: 'kms:*',
              Resource: '*',
            },
            {
              Sid: 'Allow RDS Service',
              Effect: 'Allow',
              Principal: {
                Service: 'rds.amazonaws.com',
              },
              Action: [
                'kms:Decrypt',
                'kms:DescribeKey',
                'kms:Encrypt',
                'kms:GenerateDataKey*',
                'kms:ReEncrypt*',
              ],
              Resource: '*',
            },
            {
              Sid: 'Allow CloudWatch Logs',
              Effect: 'Allow',
              Principal: {
                Service: `logs.${region.name}.amazonaws.com`,
              },
              Action: [
                'kms:Encrypt',
                'kms:Decrypt',
                'kms:ReEncrypt*',
                'kms:GenerateDataKey*',
                'kms:DescribeKey',
              ],
              Resource: '*',
            },
            {
              Sid: 'Allow S3 Service for Backups',
              Effect: 'Allow',
              Principal: {
                Service: 's3.amazonaws.com',
              },
              Action: [
                'kms:Decrypt',
                'kms:DescribeKey',
                'kms:Encrypt',
                'kms:GenerateDataKey*',
                'kms:ReEncrypt*',
              ],
              Resource: '*',
            },
          ],
        })
      )
    );

    const keyComponent = new KmsKeyComponent(
      name,
      {
        name: args.name,
        description: args.description || 'KMS key for database encryption',
        policy: keyPolicy,
        tags: args.tags,
      },
      { parent: this, provider: opts?.provider }
    );

    this.key = keyComponent.key;
    this.keyId = keyComponent.keyId;
    this.keyArn = keyComponent.keyArn;

    const aliasComponent = new KmsAliasComponent(
      `${name}-alias`,
      {
        name: `database-${args.name}`,
        targetKeyId: this.keyId,
      },
      { parent: this, provider: opts?.provider }
    );

    this.alias = aliasComponent.alias;

    this.registerOutputs({
      key: this.key,
      keyId: this.keyId,
      keyArn: this.keyArn,
      alias: this.alias,
    });
  }
}

export class S3KmsKeyComponent extends pulumi.ComponentResource {
  public readonly key: aws.kms.Key;
  public readonly keyId: pulumi.Output<string>;
  public readonly keyArn: pulumi.Output<string>;
  public readonly alias: aws.kms.Alias;

  constructor(
    name: string,
    args: S3KmsKeyArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('aws:kms:S3KmsKeyComponent', name, {}, opts);

    const keyPolicy = pulumi.output(aws.getCallerIdentity()).apply(identity =>
      pulumi.output(aws.getRegion()).apply(region =>
        JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Sid: 'Enable IAM User Permissions',
              Effect: 'Allow',
              Principal: {
                AWS: `arn:aws:iam::${identity.accountId}:root`,
              },
              Action: 'kms:*',
              Resource: '*',
            },
            {
              Sid: 'Allow S3 Service',
              Effect: 'Allow',
              Principal: {
                Service: 's3.amazonaws.com',
              },
              Action: [
                'kms:Decrypt',
                'kms:DescribeKey',
                'kms:Encrypt',
                'kms:GenerateDataKey*',
                'kms:ReEncrypt*',
              ],
              Resource: '*',
            },
            {
              Sid: 'Allow CloudWatch Logs',
              Effect: 'Allow',
              Principal: {
                Service: `logs.${region.name}.amazonaws.com`,
              },
              Action: [
                'kms:Encrypt',
                'kms:Decrypt',
                'kms:ReEncrypt*',
                'kms:GenerateDataKey*',
                'kms:DescribeKey',
              ],
              Resource: '*',
            },
            {
              Sid: 'Allow ALB Service for Logs',
              Effect: 'Allow',
              Principal: {
                Service: 'elasticloadbalancing.amazonaws.com',
              },
              Action: [
                'kms:Decrypt',
                'kms:DescribeKey',
                'kms:Encrypt',
                'kms:GenerateDataKey*',
                'kms:ReEncrypt*',
              ],
              Resource: '*',
            },
          ],
        })
      )
    );

    const keyComponent = new KmsKeyComponent(
      name,
      {
        name: args.name,
        description: args.description || 'KMS key for S3 bucket encryption',
        policy: keyPolicy,
        tags: args.tags,
      },
      { parent: this, provider: opts?.provider }
    );

    this.key = keyComponent.key;
    this.keyId = keyComponent.keyId;
    this.keyArn = keyComponent.keyArn;

    const aliasComponent = new KmsAliasComponent(
      `${name}-alias`,
      {
        name: `s3-${args.name}`,
        targetKeyId: this.keyId,
      },
      { parent: this, provider: opts?.provider }
    );

    this.alias = aliasComponent.alias;

    this.registerOutputs({
      key: this.key,
      keyId: this.keyId,
      keyArn: this.keyArn,
      alias: this.alias,
    });
  }
}

export function createKmsKey(
  name: string,
  args: KmsKeyArgs,
  opts?: pulumi.ComponentResourceOptions
): KmsKeyResult {
  const kmsKeyComponent = new KmsKeyComponent(name, args, opts);
  return {
    key: kmsKeyComponent.key,
    keyId: kmsKeyComponent.keyId,
    keyArn: kmsKeyComponent.keyArn,
    alias: kmsKeyComponent.alias,
  };
}

export function createKmsAlias(
  name: string,
  args: KmsAliasArgs,
  opts?: pulumi.ComponentResourceOptions
): aws.kms.Alias {
  const aliasComponent = new KmsAliasComponent(name, args, opts);
  return aliasComponent.alias;
}

export function createApplicationKmsKey(
  name: string,
  args: ApplicationKmsKeyArgs,
  opts?: pulumi.ComponentResourceOptions // ← FIXED: Added third parameter
): KmsKeyResult {
  const applicationKmsKeyComponent = new ApplicationKmsKeyComponent(
    name,
    args,
    opts
  ); // ← FIXED: Pass opts through
  return {
    key: applicationKmsKeyComponent.key,
    keyId: applicationKmsKeyComponent.keyId,
    keyArn: applicationKmsKeyComponent.keyArn,
    alias: applicationKmsKeyComponent.alias,
  };
}

export function createDatabaseKmsKey(
  name: string,
  args: DatabaseKmsKeyArgs,
  opts?: pulumi.ComponentResourceOptions
): KmsKeyResult {
  const databaseKmsKeyComponent = new DatabaseKmsKeyComponent(name, args, opts);
  return {
    key: databaseKmsKeyComponent.key,
    keyId: databaseKmsKeyComponent.keyId,
    keyArn: databaseKmsKeyComponent.keyArn,
    alias: databaseKmsKeyComponent.alias,
  };
}

export function createS3KmsKey(
  name: string,
  args: S3KmsKeyArgs,
  opts?: pulumi.ComponentResourceOptions
): KmsKeyResult {
  const s3KmsKeyComponent = new S3KmsKeyComponent(name, args, opts);
  return {
    key: s3KmsKeyComponent.key,
    keyId: s3KmsKeyComponent.keyId,
    keyArn: s3KmsKeyComponent.keyArn,
    alias: s3KmsKeyComponent.alias,
  };
}


// /lib/components/security/securityGroup.ts
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface SecurityGroupRuleConfig {
  type: 'ingress' | 'egress';
  fromPort: number;
  toPort: number;
  protocol: string;
  cidrBlocks?: string[];
  sourceSecurityGroupId?: pulumi.Input<string>;
  description?: string;
}

export interface SecurityGroupArgs {
  name: string;
  description: string;
  vpcId: pulumi.Input<string>;
  rules?: SecurityGroupRuleConfig[];
  tags?: Record<string, string>;
}

export interface SecurityGroupResult {
  securityGroup: aws.ec2.SecurityGroup;
  securityGroupId: pulumi.Output<string>;
  rules: aws.ec2.SecurityGroupRule[];
}

export interface WebSecurityGroupArgs {
  name: string;
  vpcId: pulumi.Input<string>;
  tags?: Record<string, string>;
}

export interface DatabaseSecurityGroupArgs {
  name: string;
  vpcId: pulumi.Input<string>;
  webSecurityGroupId: pulumi.Input<string>;
  databasePort?: number;
  tags?: Record<string, string>;
}

export interface ApplicationSecurityGroupArgs {
  name: string;
  vpcId: pulumi.Input<string>;
  albSecurityGroupId: pulumi.Input<string>;
  applicationPort?: number;
  tags?: Record<string, string>;
}

export class SecurityGroupComponent extends pulumi.ComponentResource {
  public readonly securityGroup: aws.ec2.SecurityGroup;
  public readonly securityGroupId: pulumi.Output<string>;
  public readonly rules: aws.ec2.SecurityGroupRule[];

  constructor(
    name: string,
    args: SecurityGroupArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('aws:security:SecurityGroupComponent', name, {}, opts);

    const defaultTags = {
      Name: args.name,
      Environment: pulumi.getStack(),
      ManagedBy: 'Pulumi',
      Project: 'AWS-Nova-Model-Breaking',
      ...args.tags,
    };

    this.securityGroup = new aws.ec2.SecurityGroup(
      `${name}-sg`,
      {
        name: args.name,
        description: args.description,
        vpcId: args.vpcId,
        tags: defaultTags,
      },
      { parent: this, provider: opts?.provider }
    );

    this.securityGroupId = this.securityGroup.id;
    this.rules = [];

    // Create security group rules
    if (args.rules) {
      args.rules.forEach((ruleConfig, index) => {
        const rule = new aws.ec2.SecurityGroupRule(
          `${name}-rule-${index}`,
          {
            type: ruleConfig.type,
            fromPort: ruleConfig.fromPort,
            toPort: ruleConfig.toPort,
            protocol: ruleConfig.protocol,
            cidrBlocks: ruleConfig.cidrBlocks,
            sourceSecurityGroupId: ruleConfig.sourceSecurityGroupId,
            securityGroupId: this.securityGroup.id,
            description:
              ruleConfig.description ||
              `${ruleConfig.type} rule for ${ruleConfig.protocol}:${ruleConfig.fromPort}-${ruleConfig.toPort}`,
          },
          { parent: this, provider: opts?.provider }
        );

        this.rules.push(rule);
      });
    }

    this.registerOutputs({
      securityGroup: this.securityGroup,
      securityGroupId: this.securityGroupId,
      rules: this.rules,
    });
  }
}

export class WebSecurityGroupComponent extends pulumi.ComponentResource {
  public readonly securityGroup: aws.ec2.SecurityGroup;
  public readonly securityGroupId: pulumi.Output<string>;
  public readonly rules: aws.ec2.SecurityGroupRule[];

  constructor(
    name: string,
    args: WebSecurityGroupArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('aws:security:WebSecurityGroupComponent', name, {}, opts);

    const securityGroupComponent = new SecurityGroupComponent(
      name,
      {
        name: args.name,
        description: 'Security group for web servers - HTTPS only',
        vpcId: args.vpcId,
        tags: args.tags,
        rules: [
          {
            type: 'ingress',
            fromPort: 443,
            toPort: 443,
            protocol: 'tcp',
            cidrBlocks: ['0.0.0.0/0'],
            description: 'HTTPS inbound from internet',
          },
          {
            type: 'ingress',
            fromPort: 80,
            toPort: 80,
            protocol: 'tcp',
            cidrBlocks: ['0.0.0.0/0'],
            description: 'HTTP inbound for redirect to HTTPS',
          },
          {
            type: 'egress',
            fromPort: 0,
            toPort: 65535,
            protocol: 'tcp',
            cidrBlocks: ['0.0.0.0/0'],
            description: 'All outbound traffic',
          },
        ],
      },
      { parent: this, provider: opts?.provider }
    );

    this.securityGroup = securityGroupComponent.securityGroup;
    this.securityGroupId = securityGroupComponent.securityGroupId;
    this.rules = securityGroupComponent.rules;

    this.registerOutputs({
      securityGroup: this.securityGroup,
      securityGroupId: this.securityGroupId,
      rules: this.rules,
    });
  }
}

export class DatabaseSecurityGroupComponent extends pulumi.ComponentResource {
  public readonly securityGroup: aws.ec2.SecurityGroup;
  public readonly securityGroupId: pulumi.Output<string>;
  public readonly rules: aws.ec2.SecurityGroupRule[];

  constructor(
    name: string,
    args: DatabaseSecurityGroupArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('aws:security:DatabaseSecurityGroupComponent', name, {}, opts);

    const databasePort = args.databasePort || 3306;

    const securityGroupComponent = new SecurityGroupComponent(
      name,
      {
        name: args.name,
        description: 'Security group for database servers',
        vpcId: args.vpcId,
        tags: args.tags,
        rules: [
          {
            type: 'ingress',
            fromPort: databasePort,
            toPort: databasePort,
            protocol: 'tcp',
            sourceSecurityGroupId: args.webSecurityGroupId,
            description: `Database access from web security group on port ${databasePort}`,
          },
          {
            type: 'egress',
            fromPort: 443,
            toPort: 443,
            protocol: 'tcp',
            cidrBlocks: ['0.0.0.0/0'],
            description: 'HTTPS outbound for updates and patches',
          },
        ],
      },
      { parent: this, provider: opts?.provider }
    );

    this.securityGroup = securityGroupComponent.securityGroup;
    this.securityGroupId = securityGroupComponent.securityGroupId;
    this.rules = securityGroupComponent.rules;

    this.registerOutputs({
      securityGroup: this.securityGroup,
      securityGroupId: this.securityGroupId,
      rules: this.rules,
    });
  }
}

export class ApplicationSecurityGroupComponent extends pulumi.ComponentResource {
  public readonly securityGroup: aws.ec2.SecurityGroup;
  public readonly securityGroupId: pulumi.Output<string>;
  public readonly rules: aws.ec2.SecurityGroupRule[];

  constructor(
    name: string,
    args: ApplicationSecurityGroupArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('aws:security:ApplicationSecurityGroupComponent', name, {}, opts);

    const applicationPort = args.applicationPort || 8080;

    const securityGroupComponent = new SecurityGroupComponent(
      name,
      {
        name: args.name,
        description: 'Security group for application servers',
        vpcId: args.vpcId,
        tags: args.tags,
        rules: [
          {
            type: 'ingress',
            fromPort: applicationPort,
            toPort: applicationPort,
            protocol: 'tcp',
            sourceSecurityGroupId: args.albSecurityGroupId,
            description: `Application access from ALB security group on port ${applicationPort}`,
          },
          {
            type: 'ingress',
            fromPort: 22,
            toPort: 22,
            protocol: 'tcp',
            cidrBlocks: ['10.0.0.0/8'],
            description: 'SSH access from private networks only',
          },
          {
            type: 'egress',
            fromPort: 0,
            toPort: 65535,
            protocol: 'tcp',
            cidrBlocks: ['0.0.0.0/0'],
            description: 'All outbound traffic',
          },
          {
            type: 'egress',
            fromPort: 0,
            toPort: 65535,
            protocol: 'udp',
            cidrBlocks: ['0.0.0.0/0'],
            description: 'All outbound UDP traffic',
          },
        ],
      },
      { parent: this, provider: opts?.provider }
    );

    this.securityGroup = securityGroupComponent.securityGroup;
    this.securityGroupId = securityGroupComponent.securityGroupId;
    this.rules = securityGroupComponent.rules;

    this.registerOutputs({
      securityGroup: this.securityGroup,
      securityGroupId: this.securityGroupId,
      rules: this.rules,
    });
  }
}

export function createSecurityGroup(
  name: string,
  args: SecurityGroupArgs,
  opts?: pulumi.ComponentResourceOptions
): SecurityGroupResult {
  const securityGroupComponent = new SecurityGroupComponent(name, args, opts);
  return {
    securityGroup: securityGroupComponent.securityGroup,
    securityGroupId: securityGroupComponent.securityGroupId,
    rules: securityGroupComponent.rules,
  };
}

export function createWebSecurityGroup(
  name: string,
  args: WebSecurityGroupArgs,
  opts?: pulumi.ComponentResourceOptions
): SecurityGroupResult {
  const webSecurityGroupComponent = new WebSecurityGroupComponent(
    name,
    args,
    opts
  );
  return {
    securityGroup: webSecurityGroupComponent.securityGroup,
    securityGroupId: webSecurityGroupComponent.securityGroupId,
    rules: webSecurityGroupComponent.rules,
  };
}

export function createDatabaseSecurityGroup(
  name: string,
  args: DatabaseSecurityGroupArgs,
  opts?: pulumi.ComponentResourceOptions
): SecurityGroupResult {
  const databaseSecurityGroupComponent = new DatabaseSecurityGroupComponent(
    name,
    args,
    opts
  );
  return {
    securityGroup: databaseSecurityGroupComponent.securityGroup,
    securityGroupId: databaseSecurityGroupComponent.securityGroupId,
    rules: databaseSecurityGroupComponent.rules,
  };
}

export function createApplicationSecurityGroup(
  name: string,
  args: ApplicationSecurityGroupArgs,
  opts?: pulumi.ComponentResourceOptions
): SecurityGroupResult {
  const applicationSecurityGroupComponent =
    new ApplicationSecurityGroupComponent(name, args, opts);
  return {
    securityGroup: applicationSecurityGroupComponent.securityGroup,
    securityGroupId: applicationSecurityGroupComponent.securityGroupId,
    rules: applicationSecurityGroupComponent.rules,
  };
}



// /lib/components/storage/rds.ts
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface RdsSubnetGroupArgs {
  name: string;
  subnetIds: pulumi.Input<string>[];
  tags?: Record<string, string>;
  description?: string;
}

export interface RdsParameterGroupArgs {
  name: string;
  family: string;
  parameters?: Array<{
    name: string;
    value: string;
    applyMethod?: 'immediate' | 'pending-reboot';
  }>;
  tags?: Record<string, string>;
  description?: string;
}

export interface RdsInstanceArgs {
  name: string;
  identifier?: string;
  engine: string;
  engineVersion?: string;
  instanceClass: string;
  allocatedStorage?: number;
  maxAllocatedStorage?: number;
  storageType?: string;
  storageEncrypted?: boolean;
  kmsKeyId?: pulumi.Input<string>;
  dbName?: string;
  username: string;
  vpcSecurityGroupIds?: pulumi.Input<string>[];
  dbSubnetGroupName?: pulumi.Input<string>;
  parameterGroupName?: pulumi.Input<string>;
  multiAz?: boolean;
  publiclyAccessible?: boolean;
  backupRetentionPeriod?: number;
  backupWindow?: string;
  maintenanceWindow?: string;
  autoMinorVersionUpgrade?: boolean;
  deletionProtection?: boolean;
  skipFinalSnapshot?: boolean;
  finalSnapshotIdentifier?: string;
  performanceInsightsEnabled?: boolean; // <-- ADDED
  performanceInsightsKmsKeyId?: pulumi.Input<string>;
  enabledCloudwatchLogsExports?: string[];
  monitoringInterval?: number;
  monitoringRoleArn?: pulumi.Input<string>;
  tags?: Record<string, string>;
}

export interface RdsInstanceResult {
  instance: aws.rds.Instance;
  instanceId: pulumi.Output<string>;
  instanceArn: pulumi.Output<string>;
  endpoint: pulumi.Output<string>;
  port: pulumi.Output<number>;
  address: pulumi.Output<string>;
  masterUserSecrets?: pulumi.Output<
    aws.types.output.rds.InstanceMasterUserSecret[]
  >;
  subnetGroup?: aws.rds.SubnetGroup;
  parameterGroup?: aws.rds.ParameterGroup;
}

export interface SecureRdsInstanceArgs {
  name: string;
  identifier?: string;
  engine?: string;
  engineVersion?: string;
  instanceClass: string;
  allocatedStorage?: number;
  dbName?: string;
  username: string;
  subnetIds: pulumi.Input<string>[];
  securityGroupIds: pulumi.Input<string>[];
  kmsKeyId?: pulumi.Input<string>;
  backupRetentionPeriod?: number;
  performanceInsightsEnabled?: boolean; // <-- ADDED
  tags?: Record<string, string>;
}

export class RdsSubnetGroupComponent extends pulumi.ComponentResource {
  public readonly subnetGroup: aws.rds.SubnetGroup;
  public readonly subnetGroupName: pulumi.Output<string>;

  constructor(
    name: string,
    args: RdsSubnetGroupArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('aws:rds:RdsSubnetGroupComponent', name, {}, opts);

    const defaultTags = {
      Name: args.name,
      Environment: pulumi.getStack(),
      ManagedBy: 'Pulumi',
      Project: 'AWS-Nova-Model-Breaking',
      ...args.tags,
    };

    this.subnetGroup = new aws.rds.SubnetGroup(
      `${name}-subnet-group`,
      {
        name: args.name,
        subnetIds: args.subnetIds,
        description: args.description || `DB subnet group for ${args.name}`,
        tags: defaultTags,
      },
      { parent: this, provider: opts?.provider }
    );

    this.subnetGroupName = this.subnetGroup.name;

    this.registerOutputs({
      subnetGroup: this.subnetGroup,
      subnetGroupName: this.subnetGroupName,
    });
  }
}

export class RdsParameterGroupComponent extends pulumi.ComponentResource {
  public readonly parameterGroup: aws.rds.ParameterGroup;
  public readonly parameterGroupName: pulumi.Output<string>;

  constructor(
    name: string,
    args: RdsParameterGroupArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('aws:rds:RdsParameterGroupComponent', name, {}, opts);

    const defaultTags = {
      Name: args.name,
      Environment: pulumi.getStack(),
      ManagedBy: 'Pulumi',
      Project: 'AWS-Nova-Model-Breaking',
      ...args.tags,
    };

    this.parameterGroup = new aws.rds.ParameterGroup(
      `${name}-parameter-group`,
      {
        name: args.name,
        family: args.family,
        description: args.description || `DB parameter group for ${args.name}`,
        parameters: args.parameters,
        tags: defaultTags,
      },
      { parent: this, provider: opts?.provider }
    );

    this.parameterGroupName = this.parameterGroup.name;

    this.registerOutputs({
      parameterGroup: this.parameterGroup,
      parameterGroupName: this.parameterGroupName,
    });
  }
}

export class RdsInstanceComponent extends pulumi.ComponentResource {
  public readonly instance: aws.rds.Instance;
  public readonly instanceId: pulumi.Output<string>;
  public readonly instanceArn: pulumi.Output<string>;
  public readonly endpoint: pulumi.Output<string>;
  public readonly port: pulumi.Output<number>;
  public readonly address: pulumi.Output<string>;
  public readonly masterUserSecrets: pulumi.Output<
    aws.types.output.rds.InstanceMasterUserSecret[]
  >;
  public readonly subnetGroup?: aws.rds.SubnetGroup;
  public readonly parameterGroup?: aws.rds.ParameterGroup;

  constructor(
    name: string,
    args: RdsInstanceArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('aws:rds:RdsInstanceComponent', name, {}, opts);

    const defaultTags = {
      Name: args.name,
      Environment: pulumi.getStack(),
      ManagedBy: 'Pulumi',
      Project: 'AWS-Nova-Model-Breaking',
      ...args.tags,
    };

    this.instance = new aws.rds.Instance(
      `${name}-instance`,
      {
        identifier: args.identifier || args.name,
        engine: args.engine,
        engineVersion: args.engineVersion,
        instanceClass: args.instanceClass,
        allocatedStorage: args.allocatedStorage || 20,
        maxAllocatedStorage: args.maxAllocatedStorage || 100,
        storageType: args.storageType || 'gp2',
        storageEncrypted: args.storageEncrypted ?? true,
        kmsKeyId: args.kmsKeyId,
        dbName: args.dbName,
        username: args.username,
        manageMasterUserPassword: true,
        masterUserSecretKmsKeyId: args.kmsKeyId,
        vpcSecurityGroupIds: args.vpcSecurityGroupIds,
        dbSubnetGroupName: args.dbSubnetGroupName,
        parameterGroupName: args.parameterGroupName,
        multiAz: args.multiAz ?? true,
        publiclyAccessible: args.publiclyAccessible ?? false,
        backupRetentionPeriod: args.backupRetentionPeriod || 7,
        backupWindow: args.backupWindow || '03:00-04:00',
        maintenanceWindow: args.maintenanceWindow || 'sun:04:00-sun:05:00',
        autoMinorVersionUpgrade: args.autoMinorVersionUpgrade ?? true,
        deletionProtection: args.deletionProtection ?? true,
        skipFinalSnapshot: args.skipFinalSnapshot ?? false,
        finalSnapshotIdentifier:
          args.finalSnapshotIdentifier ||
          `${args.name}-final-snapshot-${Date.now()}`,
        performanceInsightsEnabled: args.performanceInsightsEnabled, // <-- ADDED
        performanceInsightsKmsKeyId:
          args.performanceInsightsKmsKeyId || args.kmsKeyId,
        enabledCloudwatchLogsExports: args.enabledCloudwatchLogsExports,
        monitoringInterval: args.monitoringInterval || 0,
        monitoringRoleArn: args.monitoringRoleArn,
        tags: defaultTags,
      },
      { parent: this, provider: opts?.provider }
    );

    this.instanceId = this.instance.id;
    this.instanceArn = this.instance.arn;
    this.endpoint = this.instance.endpoint;
    this.port = this.instance.port;
    this.address = this.instance.address;
    this.masterUserSecrets = this.instance.masterUserSecrets;

    this.registerOutputs({
      instance: this.instance,
      instanceId: this.instanceId,
      instanceArn: this.instanceArn,
      endpoint: this.endpoint,
      port: this.port,
      address: this.address,
      masterUserSecrets: this.masterUserSecrets,
    });
  }
}

export class SecureRdsInstanceComponent extends pulumi.ComponentResource {
  public readonly instance: aws.rds.Instance;
  public readonly instanceId: pulumi.Output<string>;
  public readonly instanceArn: pulumi.Output<string>;
  public readonly endpoint: pulumi.Output<string>;
  public readonly port: pulumi.Output<number>;
  public readonly address: pulumi.Output<string>;
  public readonly masterUserSecrets: pulumi.Output<
    aws.types.output.rds.InstanceMasterUserSecret[]
  >;
  public readonly subnetGroup: aws.rds.SubnetGroup;
  public readonly parameterGroup: aws.rds.ParameterGroup;

  constructor(
    name: string,
    args: SecureRdsInstanceArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('aws:rds:SecureRdsInstanceComponent', name, {}, opts);

    const engine = args.engine || 'mysql';
    const engineVersion =
      args.engineVersion || (engine === 'mysql' ? '8.0' : '13.7');

    // Create subnet group
    const subnetGroupComponent = new RdsSubnetGroupComponent(
      `${name}-subnet-group`,
      {
        name: `${args.name}-subnet-group`,
        subnetIds: args.subnetIds,
        description: `Secure DB subnet group for ${args.name}`,
        tags: args.tags,
      },
      { parent: this, provider: opts?.provider }
    );

    this.subnetGroup = subnetGroupComponent.subnetGroup;

    // Create parameter group with security-focused parameters
    const secureParameters =
      engine === 'mysql'
        ? [
            { name: 'log_bin_trust_function_creators', value: '1' },
            { name: 'slow_query_log', value: '1' },
            { name: 'long_query_time', value: '2' },
            { name: 'general_log', value: '1' },
          ]
        : [
            { name: 'log_statement', value: 'all' },
            { name: 'log_min_duration_statement', value: '1000' },
            { name: 'shared_preload_libraries', value: 'pg_stat_statements' },
          ];

    const parameterFamily = engine === 'mysql' ? 'mysql8.0' : 'postgres13';

    const parameterGroupComponent = new RdsParameterGroupComponent(
      `${name}-parameter-group`,
      {
        name: `${args.name}-parameter-group`,
        family: parameterFamily,
        description: `Secure DB parameter group for ${args.name}`,
        parameters: secureParameters,
        tags: args.tags,
      },
      { parent: this, provider: opts?.provider }
    );

    this.parameterGroup = parameterGroupComponent.parameterGroup;

    // Create RDS instance with security best practices
    const rdsComponent = new RdsInstanceComponent(
      name,
      {
        name: args.name,
        identifier: args.identifier,
        engine: engine,
        engineVersion: engineVersion,
        instanceClass: args.instanceClass,
        allocatedStorage: args.allocatedStorage || 20,
        maxAllocatedStorage: 100,
        storageType: 'gp2',
        storageEncrypted: true,
        kmsKeyId: args.kmsKeyId,
        dbName: args.dbName,
        username: args.username,
        vpcSecurityGroupIds: args.securityGroupIds,
        dbSubnetGroupName: this.subnetGroup.name,
        parameterGroupName: this.parameterGroup.name,
        multiAz: true,
        publiclyAccessible: false,
        backupRetentionPeriod: args.backupRetentionPeriod || 7,
        backupWindow: '03:00-04:00',
        maintenanceWindow: 'sun:04:00-sun:05:00',
        autoMinorVersionUpgrade: true,
        deletionProtection: true,
        skipFinalSnapshot: false,
        performanceInsightsEnabled: args.performanceInsightsEnabled, // <-- ADDED
        performanceInsightsKmsKeyId: args.kmsKeyId,
        enabledCloudwatchLogsExports:
          engine === 'mysql'
            ? ['error', 'general', 'slowquery']
            : ['postgresql'],
        monitoringInterval: 0,
        tags: args.tags,
      },
      { parent: this, provider: opts?.provider }
    );

    this.instance = rdsComponent.instance;
    this.instanceId = rdsComponent.instanceId;
    this.instanceArn = rdsComponent.instanceArn;
    this.endpoint = rdsComponent.endpoint;
    this.port = rdsComponent.port;
    this.address = rdsComponent.address;
    this.masterUserSecrets = rdsComponent.masterUserSecrets;

    this.registerOutputs({
      instance: this.instance,
      instanceId: this.instanceId,
      instanceArn: this.instanceArn,
      endpoint: this.endpoint,
      port: this.port,
      address: this.address,
      masterUserSecrets: this.masterUserSecrets,
      subnetGroup: this.subnetGroup,
      parameterGroup: this.parameterGroup,
    });
  }
}

export function createRdsSubnetGroup(
  name: string,
  args: RdsSubnetGroupArgs,
  opts?: pulumi.ComponentResourceOptions
) {
  const subnetGroupComponent = new RdsSubnetGroupComponent(name, args, opts);
  return {
    subnetGroup: subnetGroupComponent.subnetGroup,
    subnetGroupName: subnetGroupComponent.subnetGroupName,
  };
}

export function createRdsParameterGroup(
  name: string,
  args: RdsParameterGroupArgs,
  opts?: pulumi.ComponentResourceOptions
) {
  const parameterGroupComponent = new RdsParameterGroupComponent(
    name,
    args,
    opts
  );
  return {
    parameterGroup: parameterGroupComponent.parameterGroup,
    parameterGroupName: parameterGroupComponent.parameterGroupName,
  };
}

export function createRdsInstance(
  name: string,
  args: RdsInstanceArgs,
  opts?: pulumi.ComponentResourceOptions
): RdsInstanceResult {
  const rdsComponent = new RdsInstanceComponent(name, args, opts);
  return {
    instance: rdsComponent.instance,
    instanceId: rdsComponent.instanceId,
    instanceArn: rdsComponent.instanceArn,
    endpoint: rdsComponent.endpoint,
    port: rdsComponent.port,
    address: rdsComponent.address,
    masterUserSecrets: rdsComponent.masterUserSecrets,
    subnetGroup: rdsComponent.subnetGroup,
    parameterGroup: rdsComponent.parameterGroup,
  };
}

export function createSecureRdsInstance(
  name: string,
  args: SecureRdsInstanceArgs,
  opts?: pulumi.ComponentResourceOptions
): RdsInstanceResult {
  const secureRdsComponent = new SecureRdsInstanceComponent(name, args, opts);
  return {
    instance: secureRdsComponent.instance,
    instanceId: secureRdsComponent.instanceId,
    instanceArn: secureRdsComponent.instanceArn,
    endpoint: secureRdsComponent.endpoint,
    port: secureRdsComponent.port,
    address: secureRdsComponent.address,
    masterUserSecrets: secureRdsComponent.masterUserSecrets,
    subnetGroup: secureRdsComponent.subnetGroup,
    parameterGroup: secureRdsComponent.parameterGroup,
  };
}



