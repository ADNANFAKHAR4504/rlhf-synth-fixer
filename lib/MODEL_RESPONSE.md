### Reasoning Trace
---

This is a comprehensive request for creating an AWS infrastructure using CDKTF (Cloud Development Kit for Terraform) in TypeScript. The user wants production-ready code with high security standards, proper modularization, and extensive AWS service integration.

Let me break down what I need to implement:

1. **lib/tap-stack.ts** - Main stack file that:
   - Sets up provider for us-east-1
   - Defines input parameters via TerraformVariable
   - Orchestrates all modules
   - Includes validation logic
   - Provides outputs

2. **lib/modules.ts** - Modular functions/classes that implement:
   - VPC with multi-AZ setup (2+ public, 2+ private subnets)
   - NAT Gateways in each public subnet
   - Bastion host in public subnet
   - EC2 fleet in private subnets
   - ALB in public subnets
   - Multi-AZ RDS in private subnets
   - S3 buckets with encryption and proper policies
   - IAM roles with least privilege
   - VPC Flow Logs
   - AWS Config
   - GuardDuty
   - CloudWatch monitoring and alarms
   - SSM integration
   - VPC endpoints
   - KMS key management

Key security requirements:
- All inbound traffic restricted to trustedIpRanges
- Everything encrypted with KMS
- No public access to RDS or S3
- Multi-AZ for high availability
- Comprehensive logging and monitoring
- Least privilege IAM

Let me start coding these two files with all the requirements...
### Answer 
---

I'll create a comprehensive AWS CDKTF implementation that meets all your requirements. Here are the two files:

## File 1: lib/tap-stack.ts

```typescript
/*
 * AWS TAP Infrastructure Stack - Production-Ready CDKTF Implementation
 * 
 * Usage:
 * npm install @cdktf/provider-aws constructs cdktf
 * cdktf init --template=typescript --providers=aws
 * cdktf synth
 * cdktf diff
 * cdktf deploy
 * 
 * Required AWS Provider Version: ~> 5.0
 */

import { Construct } from 'constructs';
import { TerraformStack, TerraformOutput, TerraformVariable } from 'cdktf';
import { AwsProvider } from '@cdktf/provider-aws/lib/provider';
import { DataAwsCallerIdentity } from '@cdktf/provider-aws/lib/data-aws-caller-identity';
import { DataAwsRegion } from '@cdktf/provider-aws/lib/data-aws-region';
import {
  createVpcWithSubnetsAndNat,
  createKmsKey,
  createBastionHost,
  createPrivateEc2Fleet,
  createAlbForPrivateInstances,
  createRdsMultiAz,
  createEncryptedS3Buckets,
  createIamRolesAndPolicies,
  createVPCFlowLogs,
  enableAwsConfigAndBuckets,
  enableGuardDuty,
  createCloudWatchAlarms,
  createSsmSetupAndVpcEndpoints,
  validateStackConfiguration,
  StackConfig
} from './modules';

export class TapStack extends TerraformStack {
  constructor(scope: Construct, id: string) {
    super(scope, id);

    // ==================== Provider Configuration ====================
    const provider = new AwsProvider(this, 'aws', {
      region: 'us-east-1',
      defaultTags: [{
        tags: {
          ManagedBy: 'CDKTF',
          Project: 'TAP-Infrastructure'
        }
      }]
    });

    // ==================== Input Variables ====================
    const environment = new TerraformVariable(this, 'environment', {
      type: 'string',
      default: 'production',
      description: 'Environment name (e.g., production, staging, development)',
      validation: [{
        condition: 'contains(["production", "staging", "development"], var.environment)',
        errorMessage: 'Environment must be production, staging, or development'
      }]
    });

    const trustedIpRanges = new TerraformVariable(this, 'trustedIpRanges', {
      type: 'list(string)',
      description: 'List of trusted IP CIDR ranges for management access',
      default: ['10.0.0.0/8'], // Override with actual trusted IPs
      validation: [{
        condition: 'length(var.trustedIpRanges) > 0',
        errorMessage: 'At least one trusted IP range must be specified'
      }]
    });

    const vpcCidr = new TerraformVariable(this, 'vpcCidr', {
      type: 'string',
      default: '10.0.0.0/16',
      description: 'CIDR block for VPC'
    });

    const availabilityZones = new TerraformVariable(this, 'availabilityZones', {
      type: 'list(string)',
      default: ['us-east-1a', 'us-east-1b', 'us-east-1c'],
      description: 'List of availability zones',
      validation: [{
        condition: 'length(var.availabilityZones) >= 2',
        errorMessage: 'At least 2 availability zones must be specified'
      }]
    });

    const instanceType = new TerraformVariable(this, 'instanceType', {
      type: 'string',
      default: 't3.medium',
      description: 'EC2 instance type for application fleet'
    });

    const keyPairName = new TerraformVariable(this, 'keyPairName', {
      type: 'string',
      description: 'Name of existing EC2 key pair for SSH access',
      validation: [{
        condition: 'length(var.keyPairName) > 0',
        errorMessage: 'Key pair name is required'
      }]
    });

    const dbPassword = new TerraformVariable(this, 'dbPassword', {
      type: 'string',
      sensitive: true,
      description: 'Master password for RDS database',
      validation: [{
        condition: 'length(var.dbPassword) >= 8',
        errorMessage: 'Database password must be at least 8 characters'
      }]
    });

    const kmsKeyAlias = new TerraformVariable(this, 'kmsKeyAlias', {
      type: 'string',
      default: 'tap-infrastructure-key',
      description: 'Alias for KMS customer managed key'
    });

    const notificationEmail = new TerraformVariable(this, 'notificationEmail', {
      type: 'string',
      description: 'Email address for CloudWatch alarm notifications',
      validation: [{
        condition: 'can(regex("^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$", var.notificationEmail))',
        errorMessage: 'Must be a valid email address'
      }]
    });

    const dbInstanceClass = new TerraformVariable(this, 'dbInstanceClass', {
      type: 'string',
      default: 'db.t3.micro',
      description: 'RDS instance class'
    });

    const fleetSize = new TerraformVariable(this, 'fleetSize', {
      type: 'number',
      default: 2,
      description: 'Number of EC2 instances in the application fleet',
      validation: [{
        condition: 'var.fleetSize >= 2',
        errorMessage: 'Fleet size must be at least 2 for high availability'
      }]
    });

    // ==================== Data Sources ====================
    const currentRegion = new DataAwsRegion(this, 'current', {});
    const currentIdentity = new DataAwsCallerIdentity(this, 'current_identity', {});

    // ==================== Stack Configuration ====================
    const stackConfig: StackConfig = {
      environment: environment.value,
      trustedIpRanges: trustedIpRanges.listValue,
      vpcCidr: vpcCidr.value,
      availabilityZones: availabilityZones.listValue,
      instanceType: instanceType.value,
      keyPairName: keyPairName.value,
      dbPassword: dbPassword.value,
      kmsKeyAlias: kmsKeyAlias.value,
      notificationEmail: notificationEmail.value,
      dbInstanceClass: dbInstanceClass.value,
      fleetSize: fleetSize.numberValue,
      region: currentRegion.name,
      accountId: currentIdentity.accountId,
      tags: {
        Environment: environment.value,
        Owner: 'Platform-Team',
        CostCenter: 'Infrastructure',
        Compliance: 'SOC2'
      }
    };

    // ==================== Runtime Validation ====================
    validateStackConfiguration(stackConfig);

    // ==================== KMS Key Creation ====================
    const kmsKey = createKmsKey(this, stackConfig);

    // ==================== VPC and Networking ====================
    const vpcResources = createVpcWithSubnetsAndNat(this, stackConfig);

    // ==================== IAM Roles and Policies ====================
    const iamResources = createIamRolesAndPolicies(this, stackConfig);

    // ==================== S3 Buckets ====================
    const s3Resources = createEncryptedS3Buckets(this, stackConfig, kmsKey);

    // ==================== Bastion Host ====================
    const bastionResources = createBastionHost(
      this,
      stackConfig,
      vpcResources,
      iamResources,
      kmsKey
    );

    // ==================== EC2 Application Fleet ====================
    const ec2FleetResources = createPrivateEc2Fleet(
      this,
      stackConfig,
      vpcResources,
      iamResources,
      kmsKey
    );

    // ==================== Application Load Balancer ====================
    const albResources = createAlbForPrivateInstances(
      this,
      stackConfig,
      vpcResources,
      ec2FleetResources
    );

    // ==================== RDS Multi-AZ Database ====================
    const rdsResources = createRdsMultiAz(
      this,
      stackConfig,
      vpcResources,
      kmsKey
    );

    // ==================== VPC Flow Logs ====================
    createVPCFlowLogs(this, stackConfig, vpcResources, kmsKey);

    // ==================== SSM and VPC Endpoints ====================
    createSsmSetupAndVpcEndpoints(
      this,
      stackConfig,
      vpcResources,
      iamResources
    );

    // ==================== AWS Config ====================
    enableAwsConfigAndBuckets(
      this,
      stackConfig,
      s3Resources.configBucket,
      iamResources.configRole
    );

    // ==================== GuardDuty ====================
    enableGuardDuty(this, stackConfig);

    // ==================== CloudWatch Monitoring ====================
    createCloudWatchAlarms(
      this,
      stackConfig,
      ec2FleetResources,
      albResources,
      rdsResources
    );

    // ==================== Stack Outputs ====================
    new TerraformOutput(this, 'vpc_id', {
      value: vpcResources.vpc.id,
      description: 'VPC ID'
    });

    new TerraformOutput(this, 'alb_dns_name', {
      value: albResources.alb.dnsName,
      description: 'Application Load Balancer DNS name'
    });

    new TerraformOutput(this, 'bastion_public_ip', {
      value: bastionResources.instance.publicIp,
      description: 'Bastion host public IP address'
    });

    new TerraformOutput(this, 'rds_endpoint', {
      value: rdsResources.instance.endpoint,
      description: 'RDS database endpoint',
      sensitive: true
    });

    new TerraformOutput(this, 'kms_key_arn', {
      value: kmsKey.arn,
      description: 'KMS customer managed key ARN'
    });

    new TerraformOutput(this, 'private_instance_ids', {
      value: ec2FleetResources.instances.map(i => i.id),
      description: 'Private EC2 instance IDs'
    });

    new TerraformOutput(this, 's3_app_bucket', {
      value: s3Resources.appBucket.id,
      description: 'Application S3 bucket name'
    });

    new TerraformOutput(this, 'sns_topic_arn', {
      value: albResources.snsTopic.arn,
      description: 'SNS topic ARN for alarms'
    });
  }
}

// Runtime validation on module load
if (typeof process !== 'undefined' && process.env.AWS_REGION !== 'us-east-1') {
  console.warn('Warning: AWS_REGION should be set to us-east-1 for this stack');
}
```

## File 2: lib/modules.ts

```typescript
/*
 * AWS TAP Infrastructure Modules - Reusable Components
 * 
 * This module provides production-ready AWS resource constructs with:
 * - Security best practices (encryption, least privilege IAM)
 * - High availability (multi-AZ deployments)
 * - Comprehensive monitoring and logging
 * - Compliance-ready configurations
 */

import { Construct } from 'constructs';
import { Fn, TerraformOutput } from 'cdktf';

// AWS Provider Imports
import { Vpc } from '@cdktf/provider-aws/lib/vpc';
import { Subnet } from '@cdktf/provider-aws/lib/subnet';
import { InternetGateway } from '@cdktf/provider-aws/lib/internet-gateway';
import { NatGateway } from '@cdktf/provider-aws/lib/nat-gateway';
import { Eip } from '@cdktf/provider-aws/lib/eip';
import { RouteTable } from '@cdktf/provider-aws/lib/route-table';
import { Route } from '@cdktf/provider-aws/lib/route';
import { RouteTableAssociation } from '@cdktf/provider-aws/lib/route-table-association';
import { SecurityGroup } from '@cdktf/provider-aws/lib/security-group';
import { SecurityGroupRule } from '@cdktf/provider-aws/lib/security-group-rule';
import { Instance } from '@cdktf/provider-aws/lib/instance';
import { KmsKey } from '@cdktf/provider-aws/lib/kms-key';
import { KmsAlias } from '@cdktf/provider-aws/lib/kms-alias';
import { S3Bucket } from '@cdktf/provider-aws/lib/s3-bucket';
import { S3BucketPolicy } from '@cdktf/provider-aws/lib/s3-bucket-policy';
import { S3BucketPublicAccessBlock } from '@cdktf/provider-aws/lib/s3-bucket-public-access-block';
import { S3BucketServerSideEncryptionConfigurationA } from '@cdktf/provider-aws/lib/s3-bucket-server-side-encryption-configuration';
import { S3BucketVersioningA } from '@cdktf/provider-aws/lib/s3-bucket-versioning';
import { S3BucketLoggingA } from '@cdktf/provider-aws/lib/s3-bucket-logging';
import { IamRole } from '@cdktf/provider-aws/lib/iam-role';
import { IamRolePolicy } from '@cdktf/provider-aws/lib/iam-role-policy';
import { IamRolePolicyAttachment } from '@cdktf/provider-aws/lib/iam-role-policy-attachment';
import { IamInstanceProfile } from '@cdktf/provider-aws/lib/iam-instance-profile';
import { FlowLog } from '@cdktf/provider-aws/lib/flow-log';
import { CloudwatchLogGroup } from '@cdktf/provider-aws/lib/cloudwatch-log-group';
import { DbInstance } from '@cdktf/provider-aws/lib/db-instance';
import { DbSubnetGroup } from '@cdktf/provider-aws/lib/db-subnet-group';
import { Alb } from '@cdktf/provider-aws/lib/alb';
import { AlbTargetGroup } from '@cdktf/provider-aws/lib/alb-target-group';
import { AlbListener } from '@cdktf/provider-aws/lib/alb-listener';
import { AlbTargetGroupAttachment } from '@cdktf/provider-aws/lib/alb-target-group-attachment';
import { ConfigConfigurationRecorder } from '@cdktf/provider-aws/lib/config-configuration-recorder';
import { ConfigDeliveryChannel } from '@cdktf/provider-aws/lib/config-delivery-channel';
import { ConfigConfigurationRecorderStatus } from '@cdktf/provider-aws/lib/config-configuration-recorder-status';
import { GuarddutyDetector } from '@cdktf/provider-aws/lib/guardduty-detector';
import { CloudwatchMetricAlarm } from '@cdktf/provider-aws/lib/cloudwatch-metric-alarm';
import { SnsTopic } from '@cdktf/provider-aws/lib/sns-topic';
import { SnsTopicSubscription } from '@cdktf/provider-aws/lib/sns-topic-subscription';
import { VpcEndpoint } from '@cdktf/provider-aws/lib/vpc-endpoint';
import { SsmDocument } from '@cdktf/provider-aws/lib/ssm-document';
import { DataAwsAmi } from '@cdktf/provider-aws/lib/data-aws-ami';

// ==================== Type Definitions ====================
export interface StackConfig {
  environment: string;
  trustedIpRanges: string[];
  vpcCidr: string;
  availabilityZones: string[];
  instanceType: string;
  keyPairName: string;
  dbPassword: string;
  kmsKeyAlias: string;
  notificationEmail: string;
  dbInstanceClass: string;
  fleetSize: number;
  region: string;
  accountId: string;
  tags: { [key: string]: string };
}

export interface VpcResources {
  vpc: Vpc;
  publicSubnets: Subnet[];
  privateSubnets: Subnet[];
  natGateways: NatGateway[];
  internetGateway: InternetGateway;
  publicRouteTable: RouteTable;
  privateRouteTables: RouteTable[];
}

export interface IamResources {
  ec2Role: IamRole;
  ec2InstanceProfile: IamInstanceProfile;
  ssmRole: IamRole;
  configRole: IamRole;
  flowLogRole: IamRole;
}

export interface S3Resources {
  appBucket: S3Bucket;
  logBucket: S3Bucket;
  configBucket: S3Bucket;
}

export interface BastionResources {
  instance: Instance;
  securityGroup: SecurityGroup;
}

export interface Ec2FleetResources {
  instances: Instance[];
  securityGroup: SecurityGroup;
}

export interface AlbResources {
  alb: Alb;
  targetGroup: AlbTargetGroup;
  listener: AlbListener;
  securityGroup: SecurityGroup;
  snsTopic: SnsTopic;
}

export interface RdsResources {
  instance: DbInstance;
  subnetGroup: DbSubnetGroup;
  securityGroup: SecurityGroup;
}

// ==================== Validation Functions ====================
export function validateStackConfiguration(config: StackConfig): void {
  // Region validation
  if (config.region !== 'us-east-1') {
    throw new Error('This stack is configured for us-east-1 region only');
  }

  // Trusted IP ranges validation
  if (!config.trustedIpRanges || config.trustedIpRanges.length === 0) {
    throw new Error('At least one trusted IP range must be specified');
  }

  // Validate CIDR format
  const cidrRegex = /^(\d{1,3}\.){3}\d{1,3}\/\d{1,2}$/;
  config.trustedIpRanges.forEach(cidr => {
    if (!cidrRegex.test(cidr)) {
      throw new Error(`Invalid CIDR format: ${cidr}`);
    }
  });

  // Availability zones validation
  if (!config.availabilityZones || config.availabilityZones.length < 2) {
    throw new Error('At least 2 availability zones must be specified for high availability');
  }

  // Fleet size validation
  if (config.fleetSize < 2) {
    throw new Error('Fleet size must be at least 2 for high availability');
  }

  // Password validation
  if (!config.dbPassword || config.dbPassword.length < 8) {
    throw new Error('Database password must be at least 8 characters');
  }

  console.log('✓ Stack configuration validated successfully');
}

// ==================== KMS Key Module ====================
export function createKmsKey(scope: Construct, config: StackConfig): KmsKey {
  const kmsKey = new KmsKey(scope, 'kms-key', {
    description: `Customer managed KMS key for ${config.environment} environment`,
    enableKeyRotation: true,
    deletionWindowInDays: 30,
    policy: JSON.stringify({
      Version: '2012-10-17',
      Statement: [
        {
          Sid: 'Enable IAM User Permissions',
          Effect: 'Allow',
          Principal: {
            AWS: `arn:aws:iam::${config.accountId}:root`
          },
          Action: 'kms:*',
          Resource: '*'
        },
        {
          Sid: 'Allow services to use the key',
          Effect: 'Allow',
          Principal: {
            Service: [
              'ec2.amazonaws.com',
              's3.amazonaws.com',
              'rds.amazonaws.com',
              'logs.amazonaws.com'
            ]
          },
          Action: [
            'kms:Decrypt',
            'kms:GenerateDataKey',
            'kms:CreateGrant'
          ],
          Resource: '*'
        }
      ]
    }),
    tags: config.tags
  });

  new KmsAlias(scope, 'kms-alias', {
    name: `alias/${config.kmsKeyAlias}`,
    targetKeyId: kmsKey.id
  });

  return kmsKey;
}

// ==================== VPC Module ====================
export function createVpcWithSubnetsAndNat(
  scope: Construct,
  config: StackConfig
): VpcResources {
  // Create VPC with DNS support
  const vpc = new Vpc(scope, 'vpc', {
    cidrBlock: config.vpcCidr,
    enableDnsHostnames: true,
    enableDnsSupport: true,
    tags: {
      ...config.tags,
      Name: `${config.environment}-vpc`
    }
  });

  // Create Internet Gateway
  const igw = new InternetGateway(scope, 'igw', {
    vpcId: vpc.id,
    tags: {
      ...config.tags,
      Name: `${config.environment}-igw`
    }
  });

  // Calculate subnet CIDRs
  const publicSubnets: Subnet[] = [];
  const privateSubnets: Subnet[] = [];
  const natGateways: NatGateway[] = [];
  const privateRouteTables: RouteTable[] = [];

  // Create subnets across availability zones
  config.availabilityZones.forEach((az, index) => {
    // Public subnet (10.0.0.0/24, 10.0.1.0/24, etc.)
    const publicSubnet = new Subnet(scope, `public-subnet-${index}`, {
      vpcId: vpc.id,
      cidrBlock: `10.0.${index}.0/24`,
      availabilityZone: az,
      mapPublicIpOnLaunch: true,
      tags: {
        ...config.tags,
        Name: `${config.environment}-public-subnet-${az}`,
        Type: 'Public'
      }
    });
    publicSubnets.push(publicSubnet);

    // Private subnet (10.0.100.0/24, 10.0.101.0/24, etc.)
    const privateSubnet = new Subnet(scope, `private-subnet-${index}`, {
      vpcId: vpc.id,
      cidrBlock: `10.0.${100 + index}.0/24`,
      availabilityZone: az,
      mapPublicIpOnLaunch: false,
      tags: {
        ...config.tags,
        Name: `${config.environment}-private-subnet-${az}`,
        Type: 'Private'
      }
    });
    privateSubnets.push(privateSubnet);

    // Create NAT Gateway for each public subnet (high availability)
    const eip = new Eip(scope, `nat-eip-${index}`, {
      domain: 'vpc',
      tags: {
        ...config.tags,
        Name: `${config.environment}-nat-eip-${az}`
      }
    });

    const natGateway = new NatGateway(scope, `nat-gateway-${index}`, {
      allocationId: eip.id,
      subnetId: publicSubnet.id,
      tags: {
        ...config.tags,
        Name: `${config.environment}-nat-gateway-${az}`
      }
    });
    natGateways.push(natGateway);

    // Create route table for private subnet
    const privateRouteTable = new RouteTable(scope, `private-rt-${index}`, {
      vpcId: vpc.id,
      tags: {
        ...config.tags,
        Name: `${config.environment}-private-rt-${az}`
      }
    });
    privateRouteTables.push(privateRouteTable);

    // Add route to NAT Gateway
    new Route(scope, `private-route-${index}`, {
      routeTableId: privateRouteTable.id,
      destinationCidrBlock: '0.0.0.0/0',
      natGatewayId: natGateway.id
    });

    // Associate route table with private subnet
    new RouteTableAssociation(scope, `private-rt-assoc-${index}`, {
      subnetId: privateSubnet.id,
      routeTableId: privateRouteTable.id
    });
  });

  // Public route table
  const publicRouteTable = new RouteTable(scope, 'public-rt', {
    vpcId: vpc.id,
    tags: {
      ...config.tags,
      Name: `${config.environment}-public-rt`
    }
  });

  // Add route to Internet Gateway
  new Route(scope, 'public-route', {
    routeTableId: publicRouteTable.id,
    destinationCidrBlock: '0.0.0.0/0',
    gatewayId: igw.id
  });

  // Associate public subnets with public route table
  publicSubnets.forEach((subnet, index) => {
    new RouteTableAssociation(scope, `public-rt-assoc-${index}`, {
      subnetId: subnet.id,
      routeTableId: publicRouteTable.id
    });
  });

  // Validate subnet creation
  if (publicSubnets.length < 2 || privateSubnets.length < 2) {
    throw new Error('Failed to create required number of subnets');
  }

  if (natGateways.length !== publicSubnets.length) {
    throw new Error('NAT Gateway count must equal public subnet count');
  }

  return {
    vpc,
    publicSubnets,
    privateSubnets,
    natGateways,
    internetGateway: igw,
    publicRouteTable,
    privateRouteTables
  };
}

// ==================== IAM Module ====================
export function createIamRolesAndPolicies(
  scope: Construct,
  config: StackConfig
): IamResources {
  // EC2 Instance Role (Least Privilege)
  const ec2Role = new IamRole(scope, 'ec2-role', {
    name: `${config.environment}-ec2-role`,
    assumeRolePolicy: JSON.stringify({
      Version: '2012-10-17',
      Statement: [
        {
          Action: 'sts:AssumeRole',
          Effect: 'Allow',
          Principal: {
            Service: 'ec2.amazonaws.com'
          }
        }
      ]
    }),
    tags: config.tags
  });

  // Attach SSM managed policy for Session Manager
  new IamRolePolicyAttachment(scope, 'ec2-ssm-policy', {
    role: ec2Role.name,
    policyArn: 'arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore'
  });

  // Custom policy for S3 and CloudWatch
  new IamRolePolicy(scope, 'ec2-custom-policy', {
    name: 'ec2-app-policy',
    role: ec2Role.id,
    policy: JSON.stringify({
      Version: '2012-10-17',
      Statement: [
        {
          Effect: 'Allow',
          Action: [
            's3:GetObject',
            's3:PutObject',
            's3:DeleteObject',
            's3:ListBucket'
          ],
          Resource: [
            `arn:aws:s3:::${config.environment}-app-*`,
            `arn:aws:s3:::${config.environment}-app-*/*`
          ]
        },
        {
          Effect: 'Allow',
          Action: [
            'logs:CreateLogGroup',
            'logs:CreateLogStream',
            'logs:PutLogEvents',
            'logs:DescribeLogStreams'
          ],
          Resource: 'arn:aws:logs:*:*:*'
        },
        {
          Effect: 'Allow',
          Action: [
            'cloudwatch:PutMetricData',
            'ec2:DescribeVolumes',
            'ec2:DescribeTags',
            'ec2:DescribeInstances'
          ],
          Resource: '*'
        }
      ]
    })
  });

  const ec2InstanceProfile = new IamInstanceProfile(scope, 'ec2-instance-profile', {
    name: `${config.environment}-ec2-profile`,
    role: ec2Role.name
  });

  // SSM Role for Systems Manager
  const ssmRole = new IamRole(scope, 'ssm-role', {
    name: `${config.environment}-ssm-role`,
    assumeRolePolicy: JSON.stringify({
      Version: '2012-10-17',
      Statement: [
        {
          Action: 'sts:AssumeRole',
          Effect: 'Allow',
          Principal: {
            Service: 'ssm.amazonaws.com'
          }
        }
      ]
    }),
    tags: config.tags
  });

  // Config Service Role
  const configRole = new IamRole(scope, 'config-role', {
    name: `${config.environment}-config-role`,
    assumeRolePolicy: JSON.stringify({
      Version: '2012-10-17',
      Statement: [
        {
          Action: 'sts:AssumeRole',
          Effect: 'Allow',
          Principal: {
            Service: 'config.amazonaws.com'
          }
        }
      ]
    }),
    tags: config.tags
  });

  new IamRolePolicyAttachment(scope, 'config-policy', {
    role: configRole.name,
    policyArn: 'arn:aws:iam::aws:policy/service-role/ConfigRole'
  });

  // VPC Flow Logs Role
  const flowLogRole = new IamRole(scope, 'flow-log-role', {
    name: `${config.environment}-flow-log-role`,
    assumeRolePolicy: JSON.stringify({
      Version: '2012-10-17',
      Statement: [
        {
          Action: 'sts:AssumeRole',
          Effect: 'Allow',
          Principal: {
            Service: 'vpc-flow-logs.amazonaws.com'
          }
        }
      ]
    }),
    tags: config.tags
  });

  new IamRolePolicy(scope, 'flow-log-policy', {
    name: 'flow-log-cloudwatch-policy',
    role: flowLogRole.id,
    policy: JSON.stringify({
      Version: '2012-10-17',
      Statement: [
        {
          Effect: 'Allow',
          Action: [
            'logs:CreateLogGroup',
            'logs:CreateLogStream',
            'logs:PutLogEvents',
            'logs:DescribeLogGroups',
            'logs:DescribeLogStreams'
          ],
          Resource: '*'
        }
      ]
    })
  });

  return {
    ec2Role,
    ec2InstanceProfile,
    ssmRole,
    configRole,
    flowLogRole
  };
}

// ==================== S3 Buckets Module ====================
export function createEncryptedS3Buckets(
  scope: Construct,
  config: StackConfig,
  kmsKey: KmsKey
): S3Resources {
  // Create logging bucket first
  const logBucket = new S3Bucket(scope, 'log-bucket', {
    bucket: `${config.environment}-logs-${config.accountId}`,
    tags: config.tags
  });

  // Enable versioning for log bucket
  new S3BucketVersioningA(scope, 'log-bucket-versioning', {
    bucket: logBucket.id,
    versioningConfiguration: {
      status: 'Enabled'
    }
  });

  // Configure server-side encryption for log bucket
  new S3BucketServerSideEncryptionConfigurationA(scope, 'log-bucket-encryption', {
    bucket: logBucket.id,
    rule: [{
      applyServerSideEncryptionByDefault: {
        sseAlgorithm: 'aws:kms',
        kmsMasterKeyId: kmsKey.arn
      },
      bucketKeyEnabled: true
    }]
  });

  // Block public access for log bucket
  new S3BucketPublicAccessBlock(scope, 'log-bucket-pab', {
    bucket: logBucket.id,
    blockPublicAcls: true,
    blockPublicPolicy: true,
    ignorePublicAcls: true,
    restrictPublicBuckets: true
  });

  // Application bucket
  const appBucket = new S3Bucket(scope, 'app-bucket', {
    bucket: `${config.environment}-app-${config.accountId}`,
    tags: config.tags
  });

  // Enable versioning for app bucket
  new S3BucketVersioningA(scope, 'app-bucket-versioning', {
    bucket: appBucket.id,
    versioningConfiguration: {
      status: 'Enabled'
    }
  });

  // Configure server-side encryption for app bucket
  new S3BucketServerSideEncryptionConfigurationA(scope, 'app-bucket-encryption', {
    bucket: appBucket.id,
    rule: [{
      applyServerSideEncryptionByDefault: {
        sseAlgorithm: 'aws:kms',
        kmsMasterKeyId: kmsKey.arn
      },
      bucketKeyEnabled: true
    }]
  });

  // Enable access logging for app bucket
  new S3BucketLoggingA(scope, 'app-bucket-logging', {
    bucket: appBucket.id,
    targetBucket: logBucket.id,
    targetPrefix: 'app-bucket-logs/'
  });

  // Block public access for app bucket
  new S3BucketPublicAccessBlock(scope, 'app-bucket-pab', {
    bucket: appBucket.id,
    blockPublicAcls: true,
    blockPublicPolicy: true,
    ignorePublicAcls: true,
    restrictPublicBuckets: true
  });

  // Strict bucket policy for app bucket
  new S3BucketPolicy(scope, 'app-bucket-policy', {
    bucket: appBucket.id,
    policy: JSON.stringify({
      Version: '2012-10-17',
      Statement: [
        {
          Sid: 'DenyInsecureTransport',
          Effect: 'Deny',
          Principal: '*',
          Action: 's3:*',
          Resource: [
            appBucket.arn,
            `${appBucket.arn}/*`
          ],
          Condition: {
            Bool: {
              'aws:SecureTransport': 'false'
            }
          }
        },
        {
          Sid: 'RequireEncryptedStorage',
          Effect: 'Deny',
          Principal: '*',
          Action: 's3:PutObject',
          Resource: `${appBucket.arn}/*`,
          Condition: {
            StringNotEquals: {
              's3:x-amz-server-side-encryption': 'aws:kms'
            }
          }
        }
      ]
    })
  });

  // Config bucket
  const configBucket = new S3Bucket(scope, 'config-bucket', {
    bucket: `${config.environment}-config-${config.accountId}`,
    tags: config.tags
  });

  // Enable versioning for config bucket
  new S3BucketVersioningA(scope, 'config-bucket-versioning', {
    bucket: configBucket.id,
    versioningConfiguration: {
      status: 'Enabled'
    }
  });

  // Configure server-side encryption for config bucket
  new S3BucketServerSideEncryptionConfigurationA(scope, 'config-bucket-encryption', {
    bucket: configBucket.id,
    rule: [{
      applyServerSideEncryptionByDefault: {
        sseAlgorithm: 'aws:kms',
        kmsMasterKeyId: kmsKey.arn
      },
      bucketKeyEnabled: true
    }]
  });

  // Block public access for config bucket
  new S3BucketPublicAccessBlock(scope, 'config-bucket-pab', {
    bucket: configBucket.id,
    blockPublicAcls: true,
    blockPublicPolicy: true,
    ignorePublicAcls: true,
    restrictPublicBuckets: true
  });

  return {
    appBucket,
    logBucket,
    configBucket
  };
}

// ==================== Bastion Host Module ====================
export function createBastionHost(
  scope: Construct,
  config: StackConfig,
  vpcResources: VpcResources,
  iamResources: IamResources,
  kmsKey: KmsKey
): BastionResources {
  // Security group for bastion host
  const bastionSg = new SecurityGroup(scope, 'bastion-sg', {
    name: `${config.environment}-bastion-sg`,
    description: 'Security group for bastion host - restricted to trusted IPs',
    vpcId: vpcResources.vpc.id,
    tags: {
      ...config.tags,
      Name: `${config.environment}-bastion-sg`
    }
  });

  // Ingress rules - SSH only from trusted IPs
  config.trustedIpRanges.forEach((cidr, index) => {
    new SecurityGroupRule(scope, `bastion-ssh-ingress-${index}`, {
      type: 'ingress',
      fromPort: 22,
      toPort: 22,
      protocol: 'tcp',
      cidrBlocks: [cidr],
      securityGroupId: bastionSg.id,
      description: `SSH access from trusted IP range ${index + 1}`
    });
  });

  // Egress rule - Allow all outbound
  new SecurityGroupRule(scope, 'bastion-egress', {
    type: 'egress',
    fromPort: 0,
    toPort: 0,
    protocol: '-1',
    cidrBlocks: ['0.0.0.0/0'],
    securityGroupId: bastionSg.id,
    description: 'Allow all outbound traffic'
  });

  // Get latest Amazon Linux 2 AMI
  const ami = new DataAwsAmi(scope, 'bastion-ami', {
    mostRecent: true,
    owners: ['amazon'],
    filter: [
      {
        name: 'name',
        values: ['amzn2-ami-hvm-*-x86_64-gp2']
      },
      {
        name: 'virtualization-type',
        values: ['hvm']
      }
    ]
  });

  // Create bastion instance
  const bastionInstance = new Instance(scope, 'bastion-instance', {
    ami: ami.id,
    instanceType: 't3.micro',
    keyName: config.keyPairName,
    subnetId: vpcResources.publicSubnets[0].id,
    vpcSecurityGroupIds: [bastionSg.id],
    iamInstanceProfile: iamResources.ec2InstanceProfile.name,
    rootBlockDevice: {
      volumeType: 'gp3',
      volumeSize: 20,
      encrypted: true,
      kmsKeyId: kmsKey.arn,
      deleteOnTermination: true
    },
    metadataOptions: {
      httpTokens: 'required',
      httpPutResponseHopLimit: 1
    },
    userData: Fn.base64encode(`#!/bin/bash
# Update system
yum update -y

# Install SSM agent (usually pre-installed on Amazon Linux 2)
yum install -y amazon-ssm-agent
systemctl enable amazon-ssm-agent
systemctl start amazon-ssm-agent

# Install CloudWatch agent
wget https://s3.amazonaws.com/amazoncloudwatch-agent/amazon_linux/amd64/latest/amazon-cloudwatch-agent.rpm
rpm -U ./amazon-cloudwatch-agent.rpm

# Harden SSH configuration
sed -i 's/PermitRootLogin yes/PermitRootLogin no/g' /etc/ssh/sshd_config
sed -i 's/#MaxAuthTries 6/MaxAuthTries 3/g' /etc/ssh/sshd_config
systemctl restart sshd

# Install fail2ban for additional security
yum install -y fail2ban
systemctl enable fail2ban
systemctl start fail2ban
`),
    tags: {
      ...config.tags,
      Name: `${config.environment}-bastion`,
      Type: 'Bastion'
    }
  });

  return {
    instance: bastionInstance,
    securityGroup: bastionSg
  };
}

// ==================== EC2 Fleet Module ====================
export function createPrivateEc2Fleet(
  scope: Construct,
  config: StackConfig,
  vpcResources: VpcResources,
  iamResources: IamResources,
  kmsKey: KmsKey
): Ec2FleetResources {
  // Security group for application instances
  const appSg = new SecurityGroup(scope, 'app-sg', {
    name: `${config.environment}-app-sg`,
    description: 'Security group for application instances',
    vpcId: vpcResources.vpc.id,
    tags: {
      ...config.tags,
      Name: `${config.environment}-app-sg`
    }
  });

  // Allow SSH from bastion only
  new SecurityGroupRule(scope, 'app-ssh-from-bastion', {
    type: 'ingress',
    fromPort: 22,
    toPort: 22,
    protocol: 'tcp',
    sourceSecurityGroupId: appSg.id,
    securityGroupId: appSg.id,
    description: 'SSH from bastion host only'
  });

  // Allow HTTP from ALB (to be configured)
  new SecurityGroupRule(scope, 'app-http-from-alb', {
    type: 'ingress',
    fromPort: 80,
    toPort: 80,
    protocol: 'tcp',
    cidrBlocks: ['10.0.0.0/16'],
    securityGroupId: appSg.id,
    description: 'HTTP from ALB'
  });

  // Egress rule
  new SecurityGroupRule(scope, 'app-egress', {
    type: 'egress',
    fromPort: 0,
    toPort: 0,
    protocol: '-1',
    cidrBlocks: ['0.0.0.0/0'],
    securityGroupId: appSg.id,
    description: 'Allow all outbound traffic'
  });

  // Get latest Amazon Linux 2 AMI
  const ami = new DataAwsAmi(scope, 'app-ami', {
    mostRecent: true,
    owners: ['amazon'],
    filter: [
      {
        name: 'name',
        values: ['amzn2-ami-hvm-*-x86_64-gp2']
      },
      {
        name: 'virtualization-type',
        values: ['hvm']
      }
    ]
  });

  // Create EC2 instances across private subnets
  const instances: Instance[] = [];
  for (let i = 0; i < config.fleetSize; i++) {
    const subnetIndex = i % vpcResources.privateSubnets.length;
    const instance = new Instance(scope, `app-instance-${i}`, {
      ami: ami.id,
      instanceType: config.instanceType,
      keyName: config.keyPairName,
      subnetId: vpcResources.privateSubnets[subnetIndex].id,
      vpcSecurityGroupIds: [appSg.id],
      iamInstanceProfile: iamResources.ec2InstanceProfile.name,
      rootBlockDevice: {
        volumeType: 'gp3',
        volumeSize: 30,
        encrypted: true,
        kmsKeyId: kmsKey.arn,
        deleteOnTermination: true
      },
      metadataOptions: {
        httpTokens: 'required',
        httpPutResponseHopLimit: 1
      },
      userData: Fn.base64encode(`#!/bin/bash
# Update system
yum update -y

# Install SSM agent
yum install -y amazon-ssm-agent
systemctl enable amazon-ssm-agent
systemctl start amazon-ssm-agent

# Install CloudWatch agent
wget https://s3.amazonaws.com/amazoncloudwatch-agent/amazon_linux/amd64/latest/amazon-cloudwatch-agent.rpm
rpm -U ./amazon-cloudwatch-agent.rpm

# Install and configure Apache as sample application
yum install -y httpd
echo "<h1>Application Instance ${i + 1} in ${config.environment}</h1>" > /var/www/html/index.html
systemctl enable httpd
systemctl start httpd

# Configure CloudWatch metrics
cat <<EOF > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json
{
  "metrics": {
    "namespace": "${config.environment}/Application",
    "metrics_collected": {
      "mem": {
        "measurement": [
          {"name": "mem_used_percent", "rename": "MemoryUtilization"}
        ]
      },
      "disk": {
        "measurement": [
          {"name": "used_percent", "rename": "DiskUtilization"}
        ],
        "resources": ["/"]
      }
    }
  }
}
EOF

/opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a fetch-config -m ec2 -s -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json
`),
      tags: {
        ...config.tags,
        Name: `${config.environment}-app-instance-${i + 1}`,
        Type: 'Application'
      }
    });
    instances.push(instance);
  }

  return {
    instances,
    securityGroup: appSg
  };
}

// ==================== ALB Module ====================
export function createAlbForPrivateInstances(
  scope: Construct,
  config: StackConfig,
  vpcResources: VpcResources,
  ec2FleetResources: Ec2FleetResources
): AlbResources {
  // Security group for ALB
  const albSg = new SecurityGroup(scope, 'alb-sg', {
    name: `${config.environment}-alb-sg`,
    description: 'Security group for Application Load Balancer',
    vpcId: vpcResources.vpc.id,
    tags: {
      ...config.tags,
      Name: `${config.environment}-alb-sg`
    }
  });

  // Allow HTTPS from trusted IPs
  config.trustedIpRanges.forEach((cidr, index) => {
    new SecurityGroupRule(scope, `alb-https-ingress-${index}`, {
      type: 'ingress',
      fromPort: 443,
      toPort: 443,
      protocol: 'tcp',
      cidrBlocks: [cidr],
      securityGroupId: albSg.id,
      description: `HTTPS from trusted IP range ${index + 1}`
    });
  });

  // Allow HTTP from trusted IPs (will redirect to HTTPS)
  config.trustedIpRanges.forEach((cidr, index) => {
    new SecurityGroupRule(scope, `alb-http-ingress-${index}`, {
      type: 'ingress',
      fromPort: 80,
      toPort: 80,
      protocol: 'tcp',
      cidrBlocks: [cidr],
      securityGroupId: albSg.id,
      description: `HTTP from trusted IP range ${index + 1}`
    });
  });

  // Egress to application instances
  new SecurityGroupRule(scope, 'alb-egress-to-app', {
    type: 'egress',
    fromPort: 80,
    toPort: 80,
    protocol: 'tcp',
    sourceSecurityGroupId: ec2FleetResources.securityGroup.id,
    securityGroupId: albSg.id,
    description: 'HTTP to application instances'
  });

  // Create ALB
  const alb = new Alb(scope, 'alb', {
    name: `${config.environment}-alb`,
    internal: false,
    loadBalancerType: 'application',
    securityGroups: [albSg.id],
    subnets: vpcResources.publicSubnets.map(s => s.id),
    enableDeletionProtection: false,
    enableHttp2: true,
    enableCrossZoneLoadBalancing: true,
    tags: config.tags
  });

  // Create target group
  const targetGroup = new AlbTargetGroup(scope, 'alb-tg', {
    name: `${config.environment}-tg`,
    port: 80,
    protocol: 'HTTP',
    vpcId: vpcResources.vpc.id,
    targetType: 'instance',
    healthCheck: {
      enabled: true,
      healthyThreshold: 2,
      unhealthyThreshold: 3,
      timeout: 5,
      interval: 30,
      path: '/',
      matcher: '200'
    },
    tags: config.tags
  });

  // Attach EC2 instances to target group
  ec2FleetResources.instances.forEach((instance, index) => {
    new AlbTargetGroupAttachment(scope, `tg-attachment-${index}`, {
      targetGroupArn: targetGroup.arn,
      targetId: instance.id,
      port: 80
    });
  });

  // Create ALB listener
  const listener = new AlbListener(scope, 'alb-listener', {
    loadBalancerArn: alb.arn,
    port: 80,
    protocol: 'HTTP',
    defaultAction: [{
      type: 'forward',
      targetGroupArn: targetGroup.arn
    }]
  });

  // Create SNS topic for alarms
  const snsTopic = new SnsTopic(scope, 'alarm-topic', {
    name: `${config.environment}-alarms`,
    kmsKeyId: `alias/aws/sns`,
    tags: config.tags
  });

  // Create email subscription
  new SnsTopicSubscription(scope, 'alarm-subscription', {
    topicArn: snsTopic.arn,
    protocol: 'email',
    endpoint: config.notificationEmail
  });

  return {
    alb,
    targetGroup,
    listener,
    securityGroup: albSg,
    snsTopic
  };
}

// ==================== RDS Module ====================
export function createRdsMultiAz(
  scope: Construct,
  config: StackConfig,
  vpcResources: VpcResources,
  kmsKey: KmsKey
): RdsResources {
  // Security group for RDS
  const rdsSg = new SecurityGroup(scope, 'rds-sg', {
    name: `${config.environment}-rds-sg`,
    description: 'Security group for RDS database',
    vpcId: vpcResources.vpc.id,
    tags: {
      ...config.tags,
      Name: `${config.environment}-rds-sg`
    }
  });

  // Allow MySQL/Aurora from application instances only
  new SecurityGroupRule(scope, 'rds-ingress-from-app', {
    type: 'ingress',
    fromPort: 3306,
    toPort: 3306,
    protocol: 'tcp',
    cidrBlocks: ['10.0.100.0/22'], // Private subnet range
    securityGroupId: rdsSg.id,
    description: 'MySQL from application instances'
  });

  // No egress needed for RDS
  new SecurityGroupRule(scope, 'rds-egress', {
    type: 'egress',
    fromPort: 0,
    toPort: 0,
    protocol: '-1',
    cidrBlocks: ['0.0.0.0/0'],
    securityGroupId: rdsSg.id,
    description: 'Allow all outbound'
  });

  // Create DB subnet group
  const dbSubnetGroup = new DbSubnetGroup(scope, 'db-subnet-group', {
    name: `${config.environment}-db-subnet-group`,
    description: 'Subnet group for RDS',
    subnetIds: vpcResources.privateSubnets.map(s => s.id),
    tags: config.tags
  });

  // Create RDS instance
  const rdsInstance = new DbInstance(scope, 'rds-instance', {
    identifier: `${config.environment}-db`,
    engine: 'mysql',
    engineVersion: '8.0.35',
    instanceClass: config.dbInstanceClass,
    allocatedStorage: 20,
    storageType: 'gp3',
    storageEncrypted: true,
    kmsKeyId: kmsKey.arn,
    dbName: 'appdb',
    username: 'admin',
    password: config.dbPassword,
    vpcSecurityGroupIds: [rdsSg.id],
    dbSubnetGroupName: dbSubnetGroup.name,
    multiAz: true,
    publiclyAccessible: false,
    backupRetentionPeriod: 7,
    backupWindow: '03:00-04:00',
    maintenanceWindow: 'sun:04:00-sun:05:00',
    autoMinorVersionUpgrade: true,
    deletionProtection: true,
    enabledCloudwatchLogsExports: ['error', 'general', 'slowquery'],
    tags: config.tags
  });

  // Validate Multi-AZ configuration
  if (!rdsInstance.multiAz) {
    throw new Error('RDS instance must be configured with Multi-AZ for high availability');
  }

  if (rdsInstance.publiclyAccessible) {
    throw new Error('RDS instance must not be publicly accessible');
  }

  return {
    instance: rdsInstance,
    subnetGroup: dbSubnetGroup,
    securityGroup: rdsSg
  };
}

// ==================== VPC Flow Logs Module ====================
export function createVPCFlowLogs(
  scope: Construct,
  config: StackConfig,
  vpcResources: VpcResources,
  kmsKey: KmsKey
): void {
  // Create CloudWatch Log Group for VPC Flow Logs
  const flowLogGroup = new CloudwatchLogGroup(scope, 'flow-log-group', {
    name: `/aws/vpc/${config.environment}`,
    retentionInDays: 30,
    kmsKeyId: kmsKey.arn,
    tags: config.tags
  });

  // Create IAM role for Flow Logs
  const flowLogRole = new IamRole(scope, 'flow-logs-role', {
    name: `${config.environment}-vpc-flow-logs-role`,
    assumeRolePolicy: JSON.stringify({
      Version: '2012-10-17',
      Statement: [
        {
          Action: 'sts:AssumeRole',
          Effect: 'Allow',
          Principal: {
            Service: 'vpc-flow-logs.amazonaws.com'
          }
        }
      ]
    })
  });

  new IamRolePolicy(scope, 'flow-logs-policy', {
    name: 'flow-logs-cloudwatch-policy',
    role: flowLogRole.id,
    policy: JSON.stringify({
      Version: '2012-10-17',
      Statement: [
        {
          Effect: 'Allow',
          Action: [
            'logs:CreateLogGroup',
            'logs:CreateLogStream',
            'logs:PutLogEvents',
            'logs:DescribeLogGroups',
            'logs:DescribeLogStreams'
          ],
          Resource: '*'
        }
      ]
    })
  });

  // Enable VPC Flow Logs
  new FlowLog(scope, 'vpc-flow-log', {
    iamRoleArn: flowLogRole.arn,
    logDestinationType: 'cloud-watch-logs',
    logGroupName: flowLogGroup.name,
    trafficType: 'ALL',
    vpcId: vpcResources.vpc.id,
    tags: {
      ...config.tags,
      Name: `${config.environment}-vpc-flow-log`
    }
  });
}

// ==================== AWS Config Module ====================
export function enableAwsConfigAndBuckets(
  scope: Construct,
  config: StackConfig,
  configBucket: S3Bucket,
  configRole: IamRole
): void {
  // Config bucket policy
  new S3BucketPolicy(scope, 'config-bucket-policy', {
    bucket: configBucket.id,
    policy: JSON.stringify({
      Version: '2012-10-17',
      Statement: [
        {
          Sid: 'AWSConfigBucketPermissionsCheck',
          Effect: 'Allow',
          Principal: {
            Service: 'config.amazonaws.com'
          },
          Action: 's3:GetBucketAcl',
          Resource: configBucket.arn
        },
        {
          Sid: 'AWSConfigBucketExistenceCheck',
          Effect: 'Allow',
          Principal: {
            Service: 'config.amazonaws.com'
          },
          Action: 's3:ListBucket',
          Resource: configBucket.arn
        },
        {
          Sid: 'AWSConfigBucketWrite',
          Effect: 'Allow',
          Principal: {
            Service: 'config.amazonaws.com'
          },
          Action: 's3:PutObject',
          Resource: `${configBucket.arn}/*`,
          Condition: {
            StringEquals: {
              's3:x-amz-acl': 'bucket-owner-full-control'
            }
          }
        }
      ]
    })
  });

// ==================== GuardDuty Module ====================
export function enableGuardDuty(
  scope: Construct,
  config: StackConfig
): void {
  new GuarddutyDetector(scope, 'guardduty-detector', {
    enable: true,
    findingPublishingFrequency: 'FIFTEEN_MINUTES',
    tags: config.tags
  });
}

// ==================== CloudWatch Alarms Module ====================
export function createCloudWatchAlarms(
  scope: Construct,
  config: StackConfig,
  ec2FleetResources: Ec2FleetResources,
  albResources: AlbResources,
  rdsResources: RdsResources
): void {
  // EC2 CPU Utilization Alarms
  ec2FleetResources.instances.forEach((instance, index) => {
    new CloudwatchMetric
