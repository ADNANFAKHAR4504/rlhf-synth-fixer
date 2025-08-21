/**
 * Main TapStack - Orchestrates all infrastructure components
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
import { createSubnetGroup } from './components/vpc/subnet';
import { createInternetGateway } from './components/vpc/internetGateway';
import { createMultiAzNatGateway } from './components/vpc/natGateway';
import { createRouteTables } from './components/vpc/routeTable';
import {
  createWebSecurityGroup,
  createDatabaseSecurityGroup,
  createApplicationSecurityGroup,
} from './components/security/securityGroup';
import { createHttpsAlb } from './components/compute/alb';
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
import { createAcmCertificate } from './components/certificate/acm';

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

interface RegionalNetworkInfrastructure {
  vpc: ReturnType<typeof createVpc>;
  subnets: ReturnType<typeof createSubnetGroup>;
  igw: ReturnType<typeof createInternetGateway>;
  natGateways: ReturnType<typeof createMultiAzNatGateway>;
  routeTables: ReturnType<typeof createRouteTables>;
  albSg: ReturnType<typeof createWebSecurityGroup>;
  appSg: ReturnType<typeof createApplicationSecurityGroup>;
  dbSg: ReturnType<typeof createDatabaseSecurityGroup>;
}

interface RegionalCertificateInfrastructure {
  certificate: ReturnType<typeof createAcmCertificate>;
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
  alb: ReturnType<typeof createHttpsAlb>;
  launchTemplate: ReturnType<typeof createLaunchTemplate>;
  asg: ReturnType<typeof createAutoScalingGroup>;
}

interface RegionalMonitoringInfrastructure {
  logGroups: ReturnType<typeof createApplicationLogGroups>;
  awsConfig: ReturnType<typeof createAwsConfig>;
}

// Helper function to get availability zones for a region
function getAvailabilityZones(region: string): string[] {
  const regionAzMap: Record<string, string[]> = {
    'us-east-1': ['us-east-1a', 'us-east-1b'],
    'us-east-2': ['us-east-2a', 'us-east-2b'],
    'us-west-1': ['us-west-1a', 'us-west-1c'], // Note: us-west-1b doesn't exist
    'us-west-2': ['us-west-2a', 'us-west-2b'],
    'eu-west-1': ['eu-west-1a', 'eu-west-1b'],
    'eu-west-2': ['eu-west-2a', 'eu-west-2b'],
    'eu-central-1': ['eu-central-1a', 'eu-central-1b'],
    'ap-southeast-1': ['ap-southeast-1a', 'ap-southeast-1b'],
    'ap-southeast-2': ['ap-southeast-2a', 'ap-southeast-2b'],
    'ap-northeast-1': ['ap-northeast-1a', 'ap-northeast-1c'],
  };

  return regionAzMap[region] || [`${region}a`, `${region}b`];
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
  public readonly regionalCertificates: Record<
    string,
    RegionalCertificateInfrastructure
  > = {};
  public readonly providers: Record<string, aws.Provider> = {};

  constructor(
    name: string,
    args?: TapStackArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('nova:TapStack', name, {}, opts);

    // Set default values
    this.environmentSuffix = args?.environmentSuffix || 'prod';
    this.regions = args?.regions || ['us-east-1', 'us-west-1'];
    this.tags = args?.tags || {
      Environment: this.environmentSuffix,
      Project: 'IaC-AWS-Model-Breaking',
      Application: 'nova-secure-app',
      ManagedBy: 'Pulumi',
    };

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

    // Create regional infrastructure for each region
    for (const region of this.regions) {
      const isPrimary = region === this.regions[0]; // First region is primary
      const availabilityZones = getAvailabilityZones(region);

      console.log(
        `🌍 Setting up AWS provider for region: ${region} ${isPrimary ? '(PRIMARY)' : ''}`
      );

      // Create regional AWS provider
      this.providers[region] = new aws.Provider(
        `${name}-provider-${region}`,
        {
          region: region as aws.Region,
        },
        { parent: this }
      );

      console.log(`Creating Security Infrastructure for ${region}...`);

      // Create KMS keys using existing components
      const appKms = createApplicationKmsKey(`${name}-app-kms-${region}`, {
        name: `${name}-application-${region}`,
        description: `Application encryption key for ${region}`,
        tags: this.tags,
      });

      const dbKms = createDatabaseKmsKey(`${name}-db-kms-${region}`, {
        name: `${name}-database-${region}`,
        description: `Database encryption key for ${region}`,
        tags: this.tags,
      });

      const s3Kms = createS3KmsKey(`${name}-s3-kms-${region}`, {
        name: `${name}-s3-${region}`,
        description: `S3 encryption key for ${region}`,
        tags: this.tags,
      });

      this.regionalSecurity[region] = {
        applicationKms: appKms,
        databaseKms: dbKms,
        s3Kms: s3Kms,
      };

      console.log(` Creating Networking Infrastructure for ${region}...`);

      // Create VPC and networking using existing components
      const vpc = createVpc(`${name}-vpc-${region}`, {
        cidrBlock: '10.0.0.0/16',
        name: `${name}-vpc-${region}`,
        tags: this.tags,
      });

      // Use dynamic availability zones based on the actual region
      const subnets = createSubnetGroup(`${name}-subnets-${region}`, {
        vpcId: vpc.vpcId,
        publicSubnets: [
          {
            cidrBlock: '10.0.1.0/24',
            availabilityZone: availabilityZones[0],
            name: `${name}-public-1-${region}`,
          },
          {
            cidrBlock: '10.0.2.0/24',
            availabilityZone: availabilityZones[1],
            name: `${name}-public-2-${region}`,
          },
        ],
        privateSubnets: [
          {
            cidrBlock: '10.0.10.0/24',
            availabilityZone: availabilityZones[0],
            name: `${name}-private-1-${region}`,
          },
          {
            cidrBlock: '10.0.20.0/24',
            availabilityZone: availabilityZones[1],
            name: `${name}-private-2-${region}`,
          },
        ],
        tags: this.tags,
      });

      const igw = createInternetGateway(`${name}-igw-${region}`, {
        vpcId: vpc.vpcId,
        name: `${name}-igw-${region}`,
        tags: this.tags,
      });

      const natGateways = createMultiAzNatGateway(`${name}-nat-${region}`, {
        publicSubnetIds: subnets.publicSubnetIds,
        name: `${name}-nat-${region}`,
        tags: this.tags,
      });

      const routeTables = createRouteTables(
        `${name}-routes-${region}`,
        {
          vpcId: vpc.vpcId,
          internetGatewayId: igw.internetGatewayId,
          publicSubnetIds: subnets.publicSubnetIds,
          name: `${name}-public-${region}`,
          tags: this.tags,
        },
        {
          vpcId: vpc.vpcId,
          natGatewayIds: natGateways.natGatewayIds,
          privateSubnetIds: subnets.privateSubnetIds,
          name: `${name}-private-${region}`,
          tags: this.tags,
        }
      );

      // Create security groups
      const albSg = createWebSecurityGroup(`${name}-alb-sg-${region}`, {
        name: `${name}-alb-sg-${region}`,
        vpcId: vpc.vpcId,
        tags: this.tags,
      });

      const appSg = createApplicationSecurityGroup(`${name}-app-sg-${region}`, {
        name: `${name}-app-sg-${region}`,
        vpcId: vpc.vpcId,
        albSecurityGroupId: albSg.securityGroupId,
        tags: this.tags,
      });

      const dbSg = createDatabaseSecurityGroup(`${name}-db-sg-${region}`, {
        name: `${name}-db-sg-${region}`,
        vpcId: vpc.vpcId,
        webSecurityGroupId: appSg.securityGroupId,
        tags: this.tags,
      });

      this.regionalNetworks[region] = {
        vpc,
        subnets,
        igw,
        natGateways,
        routeTables,
        albSg,
        appSg,
        dbSg,
      };

      console.log(` Creating Certificates Infrastructure for ${region}...`);

      // Create SSL certificate without validation (for demo purposes)
      const certificate = createAcmCertificate(
        `${name}-cert-${region}`,
        {
          domainName: `hackwithjoshua-${this.environmentSuffix}-${region}.demo.local`,
          subjectAlternativeNames: [
            `*.hackwithjoshua-${this.environmentSuffix}-${region}.demo.local`,
          ],
          validationMethod: 'DNS',
          skipValidation: true, // Skip validation for demo domain
          tags: this.tags,
        },
        { provider: this.providers[region] }
      );

      this.regionalCertificates[region] = { certificate };

      console.log(` Creating Secrets Infrastructure for ${region}...`);

      // Create secrets and parameters
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
        }
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
          },
          kmsKeyId: appKms.keyArn,
          tags: this.tags,
        }
      );

      this.regionalSecrets[region] = {
        dbCredentials,
        appParams,
      };

      console.log(` Creating Storage Infrastructure for ${region}...`);

      // Create S3 buckets
      const configBucket = createSecureS3Bucket(
        `${name}-config-bucket-${region}`,
        {
          name: `${name}-config-${region}`,
          bucketName: `${name}-config-${region}-${Date.now()}`,
          kmsKeyId: s3Kms.keyArn,
          enableVersioning: true,
          enableLifecycle: true,
          tags: this.tags,
        }
      );

      const dataBucket = createSecureS3Bucket(`${name}-data-bucket-${region}`, {
        name: `${name}-data-${region}`,
        bucketName: `${name}-data-${region}-${Date.now()}`,
        kmsKeyId: s3Kms.keyArn,
        enableVersioning: true,
        enableLifecycle: true,
        tags: this.tags,
      });

      // Create RDS database
      const database = createSecureRdsInstance(`${name}-db-${region}`, {
        name: `${name}-db-${region}`,
        identifier: `${name}-db-${region}`,
        instanceClass: 'db.t3.micro',
        allocatedStorage: 20,
        dbName: 'appdb',
        username: 'admin',
        passwordSecretArn: dbCredentials.secretArn,
        subnetIds: subnets.privateSubnetIds,
        securityGroupIds: [dbSg.securityGroupId],
        kmsKeyId: dbKms.keyArn,
        backupRetentionPeriod: 7,
        tags: this.tags,
      });

      this.regionalStorage[region] = {
        configBucket,
        dataBucket,
        database,
      };

      console.log(` Creating Compute Infrastructure for ${region}...`);

      // Create target group
      const targetGroup = createApplicationTargetGroup(`${name}-tg-${region}`, {
        name: `${name}-tg-${region}`,
        port: 8080,
        vpcId: vpc.vpcId,
        healthCheckPath: '/health',
        tags: this.tags,
      });

      // Create ALB
      const alb = createHttpsAlb(`${name}-alb-${region}`, {
        name: `${name}-alb-${region}`,
        subnetIds: subnets.publicSubnetIds,
        securityGroupIds: [albSg.securityGroupId],
        certificateArn: certificate.certificateArn,
        targetGroupArn: targetGroup.targetGroupArn,
        tags: this.tags,
      });

      // Create launch template
      const launchTemplate = createLaunchTemplate(`${name}-lt-${region}`, {
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
      });

      // Create auto scaling group
      const asg = createAutoScalingGroup(`${name}-asg-${region}`, {
        name: `${name}-asg-${region}`,
        minSize: 2,
        maxSize: 10,
        desiredCapacity: 2,
        subnetIds: subnets.privateSubnetIds,
        targetGroupArns: [targetGroup.targetGroupArn],
        launchTemplate: {
          id: launchTemplate.launchTemplateId,
          version: '$Latest',
        },
        tags: this.tags,
      });

      this.regionalCompute[region] = {
        targetGroup,
        alb,
        launchTemplate,
        asg,
      };

      console.log(` Creating Monitoring Infrastructure for ${region}...`);

      // Create log groups
      const logGroups = createApplicationLogGroups(`${name}-logs-${region}`, {
        name: `${name}-${region}`,
        retentionInDays: 90,
        kmsKeyId: appKms.keyArn,
        tags: this.tags,
      });

      // Create AWS Config
      const awsConfig = createAwsConfig(`${name}-config-${region}`, {
        name: `${name}-config-${region}`,
        s3BucketName: configBucket.bucketId,
        s3KmsKeyArn: appKms.keyArn,
        tags: this.tags,
      });

      this.regionalMonitoring[region] = {
        logGroups,
        awsConfig,
      };
    }

    // Register outputs
    this.registerOutputs({
      environmentSuffix: this.environmentSuffix,
      regions: this.regions,
      identityEc2RoleArn: this.identity.ec2RoleArn,
      primaryRegionVpcId: this.regionalNetworks[this.regions[0]]?.vpc.vpcId,
      primaryRegionAlbDnsName:
        this.regionalCompute[this.regions[0]]?.alb.dnsName,
    });

    console.log(
      ` TapStack deployment complete for regions: ${this.regions.join(', ')}`
    );
  }
}
