```typescript
// lib/tap-stack.ts
import {
  AwsProvider,
  AwsProviderDefaultTags,
} from '@cdktf/provider-aws/lib/provider';
import { S3Backend, TerraformStack, TerraformOutput } from 'cdktf';
import { Construct } from 'constructs';
import { RandomProvider } from '@cdktf/provider-random/lib/provider';

// Import your stacks here
import {
  SecurityModule,
  VpcModule,
  ComputeModule,
  DatabaseModule,
  MonitoringModule,
  ComplianceModule,
} from './modules';

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

    // Configure Random Provider for bucket suffix
    new RandomProvider(this, 'random', {});

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

    // Add your stack instantiations here
    // Do NOT create resources directly in this stack.
    // Instead, create separate stacks for each resource type.

    // Security Module - Creates KMS keys, IAM roles, and log bucket
    const securityModule = new SecurityModule(this, 'security');

    // VPC Module - Creates VPC, subnets, security groups, and networking components
    const vpcModule = new VpcModule(this, 'vpc', {
      kmsKey: securityModule.dataKmsKey, // ✅ pass full key object
    });

    // Compute Module - Creates ALB, ASG, Launch Template, and EC2 instances
    const computeModule = new ComputeModule(this, 'compute', {
      vpcId: vpcModule.vpcId,
      publicSubnetIds: vpcModule.publicSubnetIds,
      privateSubnetIds: vpcModule.privateSubnetIds,
      albSecurityGroupId: vpcModule.albSecurityGroupId,
      appSecurityGroupId: vpcModule.appSecurityGroupId,
      kmsKey: securityModule.dataKmsKey, // ✅ pass full key object
      adminRoleArn: securityModule.adminRole.arn,
      logBucketName: securityModule.logBucket.bucket,
    });

    // Database Module - Creates RDS and Redshift instances
    const databaseModule = new DatabaseModule(this, 'database', {
      vpcId: vpcModule.vpcId,
      privateSubnetIds: vpcModule.privateSubnetIds,
      dbSecurityGroupId: vpcModule.dbSecurityGroupId,
      redshiftSecurityGroupId: vpcModule.redshiftSecurityGroupId,
      kmsKey: securityModule.dataKmsKey, // ✅ pass full key object
      logBucketId: securityModule.logBucket.id,
    });

    // Monitoring Module - Creates CloudWatch alarms and SNS topics
    new MonitoringModule(this, 'monitoring', {
      albArn: computeModule.albArn,
      asgName: computeModule.asgName,
      kmsKey: securityModule.dataKmsKey, // ✅ pass full key object
    });

    // Compliance Module - Creates AWS Config resources
    new ComplianceModule(this, 'compliance', {
      logBucketName: securityModule.logBucket.bucket,
      kmsKey: securityModule.dataKmsKey, // ✅ pass full key object
    });

    // Terraform Outputs for reference
    new TerraformOutput(this, 'vpc-id', {
      value: vpcModule.vpcId,
      description: 'VPC ID',
    });

    new TerraformOutput(this, 'public-subnet-ids', {
      value: JSON.stringify(vpcModule.publicSubnetIds),
      description: 'Public subnet IDs',
    });

    new TerraformOutput(this, 'private-subnet-ids', {
      value: JSON.stringify(vpcModule.privateSubnetIds),
      description: 'Private subnet IDs',
    });

    new TerraformOutput(this, 's3-bucket-name', {
      value: securityModule.logBucket.bucket,
      description: 'S3 log bucket name',
    });

    new TerraformOutput(this, 'admin-role-arn', {
      value: securityModule.adminRole.arn,
      description: 'Admin role ARN',
    });

    new TerraformOutput(this, 'alb-security-group-id', {
      value: vpcModule.albSecurityGroupId,
      description: 'ALB Security Group ID',
    });

    new TerraformOutput(this, 'app-security-group-id', {
      value: vpcModule.appSecurityGroupId,
      description: 'Application Security Group ID',
    });

    new TerraformOutput(this, 'db-security-group-id', {
      value: vpcModule.dbSecurityGroupId,
      description: 'Database Security Group ID',
    });

    new TerraformOutput(this, 'redshift-security-group-id', {
      value: vpcModule.redshiftSecurityGroupId,
      description: 'Redshift Security Group ID',
    });

    new TerraformOutput(this, 'alb-arn', {
      value: computeModule.albArn,
      description: 'Application Load Balancer ARN',
    });

    new TerraformOutput(this, 'asg-name', {
      value: computeModule.asgName,
      description: 'Auto Scaling Group name',
    });

    new TerraformOutput(this, 'rds-endpoint', {
      value: databaseModule.rdsEndpoint,
      description: 'RDS database endpoint',
    });

    new TerraformOutput(this, 'redshift-endpoint', {
      value: databaseModule.redshiftEndpoint,
      description: 'Redshift cluster endpoint',
    });

    new TerraformOutput(this, 'kms-key-id', {
      value: securityModule.dataKmsKey.keyId,
      description: 'KMS key ID for encryption',
    });

    new TerraformOutput(this, 'kms-key-arn', {
      value: securityModule.dataKmsKey.arn,
      description: 'KMS key ARN for encryption',
    });
  }
}

```


```typescript
// lib/modules.ts
import { Construct } from 'constructs';
import { TerraformOutput } from 'cdktf';
import { KmsKey } from '@cdktf/provider-aws/lib/kms-key';
import { KmsAlias } from '@cdktf/provider-aws/lib/kms-alias';
import { IamRole } from '@cdktf/provider-aws/lib/iam-role';
import { IamRolePolicy } from '@cdktf/provider-aws/lib/iam-role-policy';
import { IamInstanceProfile } from '@cdktf/provider-aws/lib/iam-instance-profile';
import { S3Bucket } from '@cdktf/provider-aws/lib/s3-bucket';
import { S3BucketVersioningA } from '@cdktf/provider-aws/lib/s3-bucket-versioning';
import { S3BucketServerSideEncryptionConfigurationA } from '@cdktf/provider-aws/lib/s3-bucket-server-side-encryption-configuration';
import { S3BucketPublicAccessBlock } from '@cdktf/provider-aws/lib/s3-bucket-public-access-block';
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
import { NetworkAcl } from '@cdktf/provider-aws/lib/network-acl';
import { NetworkAclRule } from '@cdktf/provider-aws/lib/network-acl-rule';
import { NetworkAclAssociation } from '@cdktf/provider-aws/lib/network-acl-association';
import { FlowLog } from '@cdktf/provider-aws/lib/flow-log';
import { CloudwatchLogGroup } from '@cdktf/provider-aws/lib/cloudwatch-log-group';
import { LaunchTemplate } from '@cdktf/provider-aws/lib/launch-template';
import { AutoscalingGroup } from '@cdktf/provider-aws/lib/autoscaling-group';
import { AutoscalingPolicy } from '@cdktf/provider-aws/lib/autoscaling-policy';
import { Lb } from '@cdktf/provider-aws/lib/lb';
import { LbTargetGroup } from '@cdktf/provider-aws/lib/lb-target-group';
import { LbListener } from '@cdktf/provider-aws/lib/lb-listener';
import { DbSubnetGroup } from '@cdktf/provider-aws/lib/db-subnet-group';
import { DbParameterGroup } from '@cdktf/provider-aws/lib/db-parameter-group';
import { DbInstance } from '@cdktf/provider-aws/lib/db-instance';
import { RedshiftSubnetGroup } from '@cdktf/provider-aws/lib/redshift-subnet-group';
import { RedshiftCluster } from '@cdktf/provider-aws/lib/redshift-cluster';
import { CloudwatchMetricAlarm } from '@cdktf/provider-aws/lib/cloudwatch-metric-alarm';
import { SnsTopicSubscription } from '@cdktf/provider-aws/lib/sns-topic-subscription';
import { SnsTopic } from '@cdktf/provider-aws/lib/sns-topic';
import { ConfigConfigRule } from '@cdktf/provider-aws/lib/config-config-rule';
import { DataAwsAvailabilityZones } from '@cdktf/provider-aws/lib/data-aws-availability-zones';
import { DataAwsAmi } from '@cdktf/provider-aws/lib/data-aws-ami';
import { DataAwsCallerIdentity } from '@cdktf/provider-aws/lib/data-aws-caller-identity';
import { S3BucketPolicy } from '@cdktf/provider-aws/lib/s3-bucket-policy';
import { DataAwsElbServiceAccount } from '@cdktf/provider-aws/lib/data-aws-elb-service-account';

export interface VpcModuleProps {
  kmsKey: KmsKey;
}

export interface ComputeModuleProps {
  vpcId: string;
  publicSubnetIds: string[];
  privateSubnetIds: string[];
  albSecurityGroupId: string;
  appSecurityGroupId: string;
  kmsKey: KmsKey;
  adminRoleArn: string;
  logBucketName: string; // Add this line
}

export interface DatabaseModuleProps {
  vpcId: string;
  privateSubnetIds: string[];
  dbSecurityGroupId: string;
  redshiftSecurityGroupId: string;
  kmsKey: KmsKey;
  logBucketId: string;
}

export interface MonitoringModuleProps {
  albArn: string;
  asgName: string;
  kmsKey: KmsKey;
}

export interface ComplianceModuleProps {
  logBucketName: string;
  kmsKey: KmsKey;
}

export class SecurityModule extends Construct {
  public readonly dataKmsKey: KmsKey;
  public readonly adminRole: IamRole;
  public readonly logBucket: S3Bucket;

  constructor(scope: Construct, id: string) {
    super(scope, id);

    const callerIdentity = new DataAwsCallerIdentity(this, 'current');

    // Create KMS Key first
    this.dataKmsKey = new KmsKey(this, 'data-kms-key', {
      description: 'KMS key for ecommerce data encryption',
      enableKeyRotation: true,
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Sid: 'Enable IAM User Permissions',
            Effect: 'Allow',
            Principal: {
              AWS: `arn:aws:iam::${callerIdentity.accountId}:root`,
            },
            Action: 'kms:*',
            Resource: '*',
          },
          {
            Sid: 'Allow CloudWatch Logs',
            Effect: 'Allow',
            Principal: {
              Service: 'logs.us-east-1.amazonaws.com',
            },
            Action: [
              'kms:Encrypt',
              'kms:Decrypt',
              'kms:ReEncrypt*',
              'kms:GenerateDataKey*',
              'kms:DescribeKey',
            ],
            Resource: '*',
            Condition: {
              ArnEquals: {
                'kms:EncryptionContext:aws:logs:arn': [
                  `arn:aws:logs:us-east-1:${callerIdentity.accountId}:log-group:/aws/ec2/tap-prod`,
                  `arn:aws:logs:us-east-1:${callerIdentity.accountId}:log-group:/aws/vpc/flowlogs/tap-prod`,
                ],
              },
            },
          },
        ],
      }),
      tags: {
        Name: 'tap-kms-data-prod',
      },
    });

    new KmsAlias(this, 'data-kms-alias', {
      name: 'alias/tap-data-prod',
      targetKeyId: this.dataKmsKey.keyId,
    });

    // Admin Role with MFA requirement
    this.adminRole = new IamRole(this, 'admin-role', {
      name: 'tap-admin-role-prod',
      assumeRolePolicy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Principal: {
              AWS: `arn:aws:iam::${callerIdentity.accountId}:root`,
            },
            Action: 'sts:AssumeRole',
            Condition: {
              Bool: { 'aws:MultiFactorAuthPresent': 'true' },
            },
          },
        ],
      }),
      tags: {
        Name: 'tap-admin-role-prod',
      },
    });

    new IamRolePolicy(this, 'admin-role-policy', {
      name: 'AdminAccess',
      role: this.adminRole.id,
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: '*',
            Resource: '*',
          },
        ],
      }),
    });

    // Create S3 bucket
    this.logBucket = new S3Bucket(this, 'log-bucket', {
      bucket: 'tap-logs-prod-ts',
      tags: {
        Name: 'tap-logs-prod-ts',
      },
    });

    new S3BucketVersioningA(this, 'log-bucket-versioning', {
      bucket: this.logBucket.id,
      versioningConfiguration: {
        status: 'Enabled',
      },
    });

    new S3BucketServerSideEncryptionConfigurationA(
      this,
      'log-bucket-encryption',
      {
        bucket: this.logBucket.id,
        rule: [
          {
            applyServerSideEncryptionByDefault: {
              sseAlgorithm: 'aws:kms',
              kmsMasterKeyId: this.dataKmsKey.arn,
            },
            bucketKeyEnabled: true,
          },
        ],
      }
    );

    new S3BucketPublicAccessBlock(this, 'log-bucket-pab', {
      bucket: this.logBucket.id,
      blockPublicAcls: true,
      blockPublicPolicy: true,
      ignorePublicAcls: true,
      restrictPublicBuckets: true,
    });

    // ELB Service Account for ALB access logs
    const elbServiceAccount = new DataAwsElbServiceAccount(
      this,
      'elb-service-account',
      {
        region: 'us-east-1',
      }
    );

    // In SecurityModule class, update the S3 bucket policy:

    // S3 Bucket Policy for ALB Access Logs
    new S3BucketPolicy(this, 'log-bucket-policy', {
      bucket: this.logBucket.id,
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Sid: 'AllowELBAccessLogs',
            Effect: 'Allow',
            Principal: {
              AWS: elbServiceAccount.arn,
            },
            Action: 's3:PutObject',
            Resource: `${this.logBucket.arn}/alb-access-logs/*`,
          },
          {
            Sid: 'AllowELBAccessLogDelivery',
            Effect: 'Allow',
            Principal: {
              Service: 'logdelivery.elb.amazonaws.com', // Updated service
            },
            Action: 's3:PutObject',
            Resource: `${this.logBucket.arn}/alb-access-logs/*`,
          },
          {
            Sid: 'AllowELBGetBucketAcl',
            Effect: 'Allow',
            Principal: {
              AWS: elbServiceAccount.arn,
            },
            Action: 's3:GetBucketAcl',
            Resource: this.logBucket.arn,
          },
          {
            Effect: 'Allow',
            Principal: {
              Service: 'delivery.logs.amazonaws.com',
            },
            Action: 's3:PutObject',
            Resource: `${this.logBucket.arn}/*`,
            Condition: {
              StringEquals: {
                's3:x-amz-acl': 'bucket-owner-full-control',
              },
            },
          },
          {
            Effect: 'Allow',
            Principal: {
              Service: 'delivery.logs.amazonaws.com',
            },
            Action: 's3:GetBucketAcl',
            Resource: this.logBucket.arn,
          },
        ],
      }),
    });
  }
}

export class VpcModule extends Construct {
  public readonly vpcId: string;
  public readonly publicSubnetIds: string[];
  public readonly privateSubnetIds: string[];
  public readonly albSecurityGroupId: string;
  public readonly appSecurityGroupId: string;
  public readonly dbSecurityGroupId: string;
  public readonly redshiftSecurityGroupId: string;

  constructor(scope: Construct, id: string, props: VpcModuleProps) {
    super(scope, id);

    const azs = new DataAwsAvailabilityZones(this, 'azs', {
      state: 'available',
    });

    // VPC
    const vpc = new Vpc(this, 'vpc', {
      cidrBlock: '10.0.0.0/16',
      enableDnsHostnames: true,
      enableDnsSupport: true,
      tags: {
        Name: 'tap-vpc-prod',
      },
    });
    this.vpcId = vpc.id;

    // Internet Gateway
    const igw = new InternetGateway(this, 'igw', {
      vpcId: vpc.id,
      tags: {
        Name: 'tap-igw-prod',
      },
    });

    // Public Subnets
    const publicSubnets: Subnet[] = [];
    for (let i = 0; i < 2; i++) {
      const subnet = new Subnet(this, `public-subnet-${i}`, {
        vpcId: vpc.id,
        cidrBlock: `10.0.${i + 1}.0/24`,
        availabilityZone: `\${${azs.fqn}.names[${i}]}`,
        mapPublicIpOnLaunch: true,
        tags: {
          Name: `tap-public-subnet-${i + 1}-prod`,
          Type: 'Public',
        },
      });
      publicSubnets.push(subnet);
    }
    this.publicSubnetIds = publicSubnets.map(s => s.id);

    // NAT Gateways
    const natGateways: NatGateway[] = [];
    for (let i = 0; i < 2; i++) {
      const eip = new Eip(this, `nat-eip-${i}`, {
        domain: 'vpc',
        tags: {
          Name: `tap-nat-eip-${i + 1}-prod`,
        },
      });

      const nat = new NatGateway(this, `nat-gateway-${i}`, {
        allocationId: eip.id,
        subnetId: publicSubnets[i].id,
        tags: {
          Name: `tap-nat-${i + 1}-prod`,
        },
      });
      natGateways.push(nat);
    }

    // Private Subnets
    const privateSubnets: Subnet[] = [];
    for (let i = 0; i < 2; i++) {
      const subnet = new Subnet(this, `private-subnet-${i}`, {
        vpcId: vpc.id,
        cidrBlock: `10.0.${i + 10}.0/24`,
        availabilityZone: `\${${azs.fqn}.names[${i}]}`,
        tags: {
          Name: `tap-private-subnet-${i + 1}-prod`,
          Type: 'Private',
        },
      });
      privateSubnets.push(subnet);
    }
    this.privateSubnetIds = privateSubnets.map(s => s.id);

    // Route Tables
    const publicRt = new RouteTable(this, 'public-rt', {
      vpcId: vpc.id,
      tags: {
        Name: 'tap-public-rt-prod',
      },
    });

    new Route(this, 'public-route', {
      routeTableId: publicRt.id,
      destinationCidrBlock: '0.0.0.0/0',
      gatewayId: igw.id,
    });

    publicSubnets.forEach((subnet, i) => {
      new RouteTableAssociation(this, `public-rta-${i}`, {
        subnetId: subnet.id,
        routeTableId: publicRt.id,
      });
    });

    privateSubnets.forEach((subnet, i) => {
      const privateRt = new RouteTable(this, `private-rt-${i}`, {
        vpcId: vpc.id,
        tags: {
          Name: `tap-private-rt-${i + 1}-prod`,
        },
      });

      new Route(this, `private-route-${i}`, {
        routeTableId: privateRt.id,
        destinationCidrBlock: '0.0.0.0/0',
        natGatewayId: natGateways[i].id,
      });

      new RouteTableAssociation(this, `private-rta-${i}`, {
        subnetId: subnet.id,
        routeTableId: privateRt.id,
      });
    });

    // Network ACLs
    const publicNacl = new NetworkAcl(this, 'public-nacl', {
      vpcId: vpc.id,
      tags: {
        Name: 'tap-public-nacl-prod',
      },
    });

    // Public NACL Rules
    new NetworkAclRule(this, 'public-nacl-http-in', {
      networkAclId: publicNacl.id,
      ruleNumber: 100,
      protocol: 'tcp',
      ruleAction: 'allow',
      fromPort: 80,
      toPort: 80,
      cidrBlock: '0.0.0.0/0',
    });

    new NetworkAclRule(this, 'public-nacl-https-in', {
      networkAclId: publicNacl.id,
      ruleNumber: 110,
      protocol: 'tcp',
      ruleAction: 'allow',
      fromPort: 443,
      toPort: 443,
      cidrBlock: '0.0.0.0/0',
    });

    new NetworkAclRule(this, 'public-nacl-ephemeral-in', {
      networkAclId: publicNacl.id,
      ruleNumber: 120,
      protocol: 'tcp',
      ruleAction: 'allow',
      fromPort: 1024,
      toPort: 65535,
      cidrBlock: '0.0.0.0/0',
    });

    new NetworkAclRule(this, 'public-nacl-all-out', {
      networkAclId: publicNacl.id,
      ruleNumber: 100,
      protocol: '-1',
      ruleAction: 'allow',
      cidrBlock: '0.0.0.0/0',
      egress: true,
    });

    publicSubnets.forEach((subnet, i) => {
      new NetworkAclAssociation(this, `public-nacl-assoc-${i}`, {
        networkAclId: publicNacl.id,
        subnetId: subnet.id,
      });
    });

    const privateNacl = new NetworkAcl(this, 'private-nacl', {
      vpcId: vpc.id,
      tags: {
        Name: 'tap-private-nacl-prod',
      },
    });

    // Private NACL Rules
    new NetworkAclRule(this, 'private-nacl-ephemeral-in', {
      networkAclId: privateNacl.id,
      ruleNumber: 100,
      protocol: 'tcp',
      ruleAction: 'allow',
      fromPort: 1024,
      toPort: 65535,
      cidrBlock: '10.0.0.0/16',
    });

    new NetworkAclRule(this, 'private-nacl-all-out', {
      networkAclId: privateNacl.id,
      ruleNumber: 100,
      protocol: '-1',
      ruleAction: 'allow',
      cidrBlock: '0.0.0.0/0',
      egress: true,
    });

    privateSubnets.forEach((subnet, i) => {
      new NetworkAclAssociation(this, `private-nacl-assoc-${i}`, {
        networkAclId: privateNacl.id,
        subnetId: subnet.id,
      });
    });

    // Security Groups
    const albSg = new SecurityGroup(this, 'alb-sg', {
      name: 'tap-alb-sg-prod',
      description: 'Security group for ALB',
      vpcId: vpc.id,
      tags: {
        Name: 'tap-alb-sg-prod',
      },
    });
    this.albSecurityGroupId = albSg.id;

    const appSg = new SecurityGroup(this, 'app-sg', {
      name: 'tap-app-sg-prod',
      description: 'Security group for application instances',
      vpcId: vpc.id,
      tags: {
        Name: 'tap-app-sg-prod',
      },
    });
    this.appSecurityGroupId = appSg.id;

    const dbSg = new SecurityGroup(this, 'db-sg', {
      name: 'tap-db-sg-prod',
      description: 'Security group for RDS database',
      vpcId: vpc.id,
      tags: {
        Name: 'tap-db-sg-prod',
      },
    });
    this.dbSecurityGroupId = dbSg.id;

    const redshiftSg = new SecurityGroup(this, 'redshift-sg', {
      name: 'tap-redshift-sg-prod',
      description: 'Security group for Redshift cluster',
      vpcId: vpc.id,
      tags: {
        Name: 'tap-redshift-sg-prod',
      },
    });
    this.redshiftSecurityGroupId = redshiftSg.id;

    // Security Group Rules
    new SecurityGroupRule(this, 'alb-http-in', {
      type: 'ingress',
      fromPort: 80,
      toPort: 80,
      protocol: 'tcp',
      cidrBlocks: ['0.0.0.0/0'],
      securityGroupId: albSg.id,
    });

    new SecurityGroupRule(this, 'alb-https-in', {
      type: 'ingress',
      fromPort: 443,
      toPort: 443,
      protocol: 'tcp',
      cidrBlocks: ['0.0.0.0/0'],
      securityGroupId: albSg.id,
    });

    new SecurityGroupRule(this, 'alb-to-app', {
      type: 'egress',
      fromPort: 3000,
      toPort: 3000,
      protocol: 'tcp',
      sourceSecurityGroupId: appSg.id,
      securityGroupId: albSg.id,
    });

    new SecurityGroupRule(this, 'app-from-alb', {
      type: 'ingress',
      fromPort: 3000,
      toPort: 3000,
      protocol: 'tcp',
      sourceSecurityGroupId: albSg.id,
      securityGroupId: appSg.id,
    });

    new SecurityGroupRule(this, 'app-to-db', {
      type: 'egress',
      fromPort: 5432,
      toPort: 5432,
      protocol: 'tcp',
      sourceSecurityGroupId: dbSg.id,
      securityGroupId: appSg.id,
    });

    new SecurityGroupRule(this, 'app-to-redshift', {
      type: 'egress',
      fromPort: 5439,
      toPort: 5439,
      protocol: 'tcp',
      sourceSecurityGroupId: redshiftSg.id,
      securityGroupId: appSg.id,
    });

    new SecurityGroupRule(this, 'app-https-out', {
      type: 'egress',
      fromPort: 443,
      toPort: 443,
      protocol: 'tcp',
      cidrBlocks: ['0.0.0.0/0'],
      securityGroupId: appSg.id,
    });

    new SecurityGroupRule(this, 'db-from-app', {
      type: 'ingress',
      fromPort: 5432,
      toPort: 5432,
      protocol: 'tcp',
      sourceSecurityGroupId: appSg.id,
      securityGroupId: dbSg.id,
    });

    new SecurityGroupRule(this, 'redshift-from-app', {
      type: 'ingress',
      fromPort: 5439,
      toPort: 5439,
      protocol: 'tcp',
      sourceSecurityGroupId: appSg.id,
      securityGroupId: redshiftSg.id,
    });

    // Add these missing security group rules in VpcModule
    new SecurityGroupRule(this, 'app-http-out', {
      type: 'egress',
      fromPort: 80,
      toPort: 80,
      protocol: 'tcp',
      cidrBlocks: ['0.0.0.0/0'],
      securityGroupId: appSg.id,
    });

    new SecurityGroupRule(this, 'app-dns-out', {
      type: 'egress',
      fromPort: 53,
      toPort: 53,
      protocol: 'udp',
      cidrBlocks: ['0.0.0.0/0'],
      securityGroupId: appSg.id,
    });

    // Add SSH access for troubleshooting (remove in production)
    new SecurityGroupRule(this, 'app-ssh-in', {
      type: 'ingress',
      fromPort: 22,
      toPort: 22,
      protocol: 'tcp',
      cidrBlocks: ['10.0.0.0/16'], // Only from VPC
      securityGroupId: appSg.id,
    });

    // VPC Flow Logs
    const flowLogGroup = new CloudwatchLogGroup(this, 'flow-log-group', {
      name: '/aws/vpc/flowlogs/tap-prod',
      retentionInDays: 30,
      kmsKeyId: props.kmsKey.arn,
      tags: {
        Name: 'tap-vpc-flow-logs-prod',
      },
    });

    const flowLogRole = new IamRole(this, 'flow-log-role', {
      name: 'tap-flow-log-role-prod',
      assumeRolePolicy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Principal: { Service: 'vpc-flow-logs.amazonaws.com' },
            Action: 'sts:AssumeRole',
          },
        ],
      }),
    });

    new IamRolePolicy(this, 'flow-log-policy', {
      name: 'FlowLogDeliveryRolePolicy',
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
              'logs:DescribeLogStreams',
            ],
            Resource: '*',
          },
        ],
      }),
    });

    new FlowLog(this, 'vpc-flow-log', {
      iamRoleArn: flowLogRole.arn,
      logDestination: flowLogGroup.arn,
      vpcId: vpc.id, // ✅ singular
      trafficType: 'ALL',
      tags: {
        Name: 'tap-vpc-flow-log-prod',
      },
    });

    // Outputs
    new TerraformOutput(this, 'vpc-id', {
      value: vpc.id,
      description: 'VPC ID',
    });
  }
}

export class ComputeModule extends Construct {
  public readonly albArn: string;
  public readonly asgName: string;

  constructor(scope: Construct, id: string, props: ComputeModuleProps) {
    super(scope, id);

    // Get latest Amazon Linux 2 AMI
    const ami = new DataAwsAmi(this, 'amazon-linux', {
      mostRecent: true,
      owners: ['amazon'],
      filter: [
        {
          name: 'name',
          values: ['amzn2-ami-hvm-*-x86_64-gp2'],
        },
      ],
    });

    // Instance Role
    const instanceRole = new IamRole(this, 'instance-role', {
      name: 'tap-instance-role-prod',
      assumeRolePolicy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Principal: { Service: 'ec2.amazonaws.com' },
            Action: 'sts:AssumeRole',
          },
        ],
      }),
      managedPolicyArns: [
        'arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore',
        'arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy',
      ],
      tags: {
        Name: 'tap-instance-role-prod',
      },
    });

    const instanceProfile = new IamInstanceProfile(this, 'instance-profile', {
      name: 'tap-instance-profile-prod',
      role: instanceRole.name,
    });

    // Launch Template
    const launchTemplate = new LaunchTemplate(this, 'launch-template', {
      name: 'tap-launch-template-prod',
      imageId: ami.id,
      instanceType: 't3.medium',
      iamInstanceProfile: {
        name: instanceProfile.name,
      },
      vpcSecurityGroupIds: [props.appSecurityGroupId],
      metadataOptions: {
        httpEndpoint: 'enabled',
        httpTokens: 'required',
        httpPutResponseHopLimit: 1,
      },
      blockDeviceMappings: [
        {
          deviceName: '/dev/xvda',
          ebs: {
            volumeSize: 20,
            volumeType: 'gp3',
            encrypted: 'true',
            kmsKeyId: props.kmsKey.arn,
            deleteOnTermination: 'true',
          },
        },
      ],
      userData: Buffer.from(
        `#!/bin/bash
set -e
exec > >(tee /var/log/user-data.log|logger -t user-data -s 2>/dev/console) 2>&1

echo "Starting user data script..."

# Update system
yum update -y

# Install CloudWatch agent
yum install -y amazon-cloudwatch-agent

# Install Docker
amazon-linux-extras install -y docker
systemctl start docker
systemctl enable docker
usermod -a -G docker ec2-user

# Install SSM agent (usually pre-installed)
yum install -y amazon-ssm-agent
systemctl start amazon-ssm-agent
systemctl enable amazon-ssm-agent

# CloudWatch Agent configuration
cat > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json << 'EOF'
{
  "metrics": {
    "namespace": "CWAgent",
    "metrics_collected": {
      "cpu": {
        "measurement": ["cpu_usage_idle", "cpu_usage_iowait", "cpu_usage_user", "cpu_usage_system"],
        "metrics_collection_interval": 60
      },
      "disk": {
        "measurement": ["used_percent"],
        "metrics_collection_interval": 60,
        "resources": ["*"]
      },
      "mem": {
        "measurement": ["mem_used_percent"],
        "metrics_collection_interval": 60
      }
    }
  },
  "logs": {
    "logs_collected": {
      "files": {
        "collect_list": [
          {
            "file_path": "/var/log/messages",
            "log_group_name": "/aws/ec2/tap-prod",
            "log_stream_name": "{instance_id}/messages"
          },
          {
            "file_path": "/var/log/user-data.log",
            "log_group_name": "/aws/ec2/tap-prod",
            "log_stream_name": "{instance_id}/user-data"
          }
        ]
      }
    }
  }
}
EOF

# Start CloudWatch agent
/opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a fetch-config -m ec2 -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json -s

# Create a simple health check endpoint
mkdir -p /var/www/html
echo "OK" > /var/www/html/health
python3 -m http.server 3000 --directory /var/www/html &

echo "User data script completed successfully"
      `
      ).toString('base64'),
      tagSpecifications: [
        {
          resourceType: 'instance',
          tags: {
            Name: 'tap-app-instance-prod',
            Project: 'ecommerce',
            Environment: 'prod',
            Owner: 'platform',
          },
        },
      ],
      tags: {
        Name: 'tap-launch-template-prod',
      },
    });

    // Application Load Balancer
    const alb = new Lb(this, 'alb', {
      name: 'tap-alb-prod',
      loadBalancerType: 'application',
      securityGroups: [props.albSecurityGroupId],
      subnets: props.publicSubnetIds,
      enableDeletionProtection: true,
      // accessLogs: {
      //   bucket: props.logBucketName, // Use props instead of hardcoded value
      //   enabled: true,
      //   prefix: 'alb-access-logs',
      // },
      tags: {
        Name: 'tap-alb-prod',
      },
    });
    this.albArn = alb.arn;

    // Target Group
    const targetGroup = new LbTargetGroup(this, 'target-group', {
      name: 'tap-tg-prod',
      port: 3000,
      protocol: 'HTTP',
      vpcId: props.vpcId,
      healthCheck: {
        enabled: true,
        healthyThreshold: 2,
        interval: 30,
        matcher: '200',
        path: '/health',
        port: 'traffic-port',
        protocol: 'HTTP',
        timeout: 5,
        unhealthyThreshold: 2,
      },
      tags: {
        Name: 'tap-tg-prod',
      },
    });

    // ALB Listener
    new LbListener(this, 'alb-listener', {
      loadBalancerArn: alb.arn,
      port: 80,
      protocol: 'HTTP',
      defaultAction: [
        {
          type: 'forward',
          targetGroupArn: targetGroup.arn,
        },
      ],
    });

    // Auto Scaling Group
    const asg = new AutoscalingGroup(this, 'asg', {
      name: 'tap-asg-prod',
      vpcZoneIdentifier: props.privateSubnetIds,
      targetGroupArns: [targetGroup.arn],
      healthCheckType: 'ELB',
      healthCheckGracePeriod: 300,
      minSize: 2,
      maxSize: 10,
      desiredCapacity: 2,
      waitForCapacityTimeout: '0s', // ✅ Skip waiting for healthy instances
      launchTemplate: {
        id: launchTemplate.id,
        version: '$Latest',
      },
      tag: [
        {
          key: 'Name',
          value: 'tap-asg-instance-prod',
          propagateAtLaunch: true,
        },
        {
          key: 'Project',
          value: 'ecommerce',
          propagateAtLaunch: true,
        },
        {
          key: 'Environment',
          value: 'prod',
          propagateAtLaunch: true,
        },
        {
          key: 'Owner',
          value: 'platform',
          propagateAtLaunch: true,
        },
      ],
    });
    this.asgName = asg.name;

    // Auto Scaling Policies
    new AutoscalingPolicy(this, 'scale-up-policy', {
      name: 'tap-scale-up-prod',
      scalingAdjustment: 1,
      adjustmentType: 'ChangeInCapacity',
      cooldown: 300,
      autoscalingGroupName: asg.name,
      policyType: 'SimpleScaling',
    });

    new AutoscalingPolicy(this, 'scale-down-policy', {
      name: 'tap-scale-down-prod',
      scalingAdjustment: -1,
      adjustmentType: 'ChangeInCapacity',
      cooldown: 300,
      autoscalingGroupName: asg.name,
      policyType: 'SimpleScaling',
    });

    // CloudWatch Log Group for instances
    new CloudwatchLogGroup(this, 'instance-log-group', {
      name: '/aws/ec2/tap-prod',
      retentionInDays: 30,
      kmsKeyId: props.kmsKey.arn,
      tags: {
        Name: 'tap-instance-logs-prod',
      },
    });

    // Outputs
    new TerraformOutput(this, 'alb-dns', {
      value: alb.dnsName,
      description: 'ALB DNS Name',
    });

    new TerraformOutput(this, 'asg-name', {
      value: asg.name,
      description: 'Auto Scaling Group Name',
    });
  }
}

export class DatabaseModule extends Construct {
  public readonly rdsEndpoint: string;
  public readonly redshiftEndpoint: string;

  constructor(scope: Construct, id: string, props: DatabaseModuleProps) {
    super(scope, id);

    // RDS Subnet Group
    const dbSubnetGroup = new DbSubnetGroup(this, 'db-subnet-group', {
      name: 'tap-db-subnet-group-prod',
      subnetIds: props.privateSubnetIds,
      description: 'Subnet group for RDS database',
      tags: {
        Name: 'tap-db-subnet-group-prod',
      },
    });

    // RDS Parameter Group
    const dbParameterGroup = new DbParameterGroup(this, 'db-parameter-group', {
      name: 'tap-db-pg-prod',
      family: 'postgres17',
      description: 'Parameter group for PostgreSQL 14',
      parameter: [
        {
          name: 'rds.force_ssl',
          value: '1',
        },
        {
          name: 'log_statement',
          value: 'all',
        },
      ],
      tags: {
        Name: 'tap-db-pg-prod',
      },
    });

    // RDS Instance
    const rdsInstance = new DbInstance(this, 'rds-instance', {
      identifier: 'tap-db-prod',
      engine: 'postgres',
      instanceClass: 'db.t3.medium',
      allocatedStorage: 100,
      storageType: 'gp3',
      storageEncrypted: true,
      kmsKeyId: props.kmsKey.arn,
      dbName: 'ecommerce',
      username: 'dbadmin',
      manageMasterUserPassword: true, // Fixed: was 'managePassword'
      dbSubnetGroupName: dbSubnetGroup.name,
      parameterGroupName: dbParameterGroup.name,
      vpcSecurityGroupIds: [props.dbSecurityGroupId],
      backupRetentionPeriod: 7,
      backupWindow: '03:00-04:00',
      maintenanceWindow: 'sun:04:00-sun:05:00',
      multiAz: true,
      deletionProtection: true,
      performanceInsightsEnabled: true,
      performanceInsightsKmsKeyId: props.kmsKey.arn,
      performanceInsightsRetentionPeriod: 7,
      enabledCloudwatchLogsExports: ['postgresql'],
      tags: {
        Name: 'tap-db-prod',
      },
    });
    this.rdsEndpoint = rdsInstance.endpoint;

    // Redshift Subnet Group
    const redshiftSubnetGroup = new RedshiftSubnetGroup(
      this,
      'redshift-subnet-group',
      {
        name: 'tap-redshift-subnet-group-prod',
        subnetIds: props.privateSubnetIds,
        description: 'Subnet group for Redshift cluster',
        tags: {
          Name: 'tap-redshift-subnet-group-prod',
        },
      }
    );

    // Redshift Cluster
    const redshiftCluster = new RedshiftCluster(this, 'redshift-cluster', {
      clusterIdentifier: 'tap-redshift-prod',
      nodeType: 'ra3.xlplus',
      numberOfNodes: 1,
      databaseName: 'analytics',
      masterUsername: 'redshiftadmin',
      manageMasterPassword: true, // Fixed: was 'managePassword'
      clusterSubnetGroupName: redshiftSubnetGroup.name,
      vpcSecurityGroupIds: [props.redshiftSecurityGroupId],
      encrypted: 'true',
      kmsKeyId: props.kmsKey.arn,
      publiclyAccessible: false,
      tags: {
        Name: 'tap-redshift-prod',
      },
    });
    this.redshiftEndpoint = redshiftCluster.endpoint;

    // Outputs
    new TerraformOutput(this, 'rds-endpoint', {
      value: rdsInstance.endpoint,
      description: 'RDS Endpoint',
    });

    new TerraformOutput(this, 'redshift-endpoint', {
      value: redshiftCluster.endpoint,
      description: 'Redshift Endpoint',
    });
  }
}

export class MonitoringModule extends Construct {
  constructor(scope: Construct, id: string, props: MonitoringModuleProps) {
    super(scope, id);

    // SNS Topic for alerts
    const alertsTopic = new SnsTopic(this, 'alerts-topic', {
      name: 'tap-alerts-prod',
      kmsMasterKeyId: props.kmsKey.arn, // ✅ Correct
      tags: {
        Name: 'tap-alerts-prod',
      },
    });

    new SnsTopicSubscription(this, 'alerts-email', {
      topicArn: alertsTopic.arn,
      protocol: 'email',
      endpoint: 'platform-team@company.com',
    });

    // CloudWatch Alarms
    new CloudwatchMetricAlarm(this, 'alb-5xx-alarm', {
      alarmName: 'tap-alb-5xx-errors-prod',
      comparisonOperator: 'GreaterThanThreshold',
      evaluationPeriods: 2,
      metricName: 'HTTPCode_ELB_5XX_Count',
      namespace: 'AWS/ApplicationELB',
      period: 300,
      statistic: 'Sum',
      threshold: 10,
      alarmDescription: 'ALB 5XX errors',
      alarmActions: [alertsTopic.arn],
      dimensions: {
        LoadBalancer: props.albArn,
      },
      tags: {
        Name: 'tap-alb-5xx-alarm-prod',
      },
    });

    new CloudwatchMetricAlarm(this, 'asg-cpu-alarm', {
      alarmName: 'tap-asg-cpu-high-prod',
      comparisonOperator: 'GreaterThanThreshold',
      evaluationPeriods: 2,
      metricName: 'CPUUtilization',
      namespace: 'AWS/EC2',
      period: 300,
      statistic: 'Average',
      threshold: 80,
      alarmDescription: 'High CPU utilization in ASG',
      alarmActions: [alertsTopic.arn],
      dimensions: {
        AutoScalingGroupName: props.asgName,
      },
      tags: {
        Name: 'tap-asg-cpu-alarm-prod',
      },
    });
  }
}

export class ComplianceModule extends Construct {
  constructor(scope: Construct, id: string, _props: ComplianceModuleProps) {
    super(scope, id);

    // Create IAM role for Config Rules only (no Configuration Recorder)
    const configRole = new IamRole(this, 'config-role', {
      name: `tap-config-role-prod-${Date.now()}`,
      assumeRolePolicy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Principal: { Service: 'config.amazonaws.com' },
            Action: 'sts:AssumeRole',
          },
        ],
      }),
      managedPolicyArns: [
        'arn:aws:iam::aws:policy/service-role/AWS_ConfigRole',
      ],
      tags: {
        Name: 'tap-config-role-prod',
      },
    });

    // REMOVED: ConfigConfigurationRecorder - this was causing the limit error

    // Keep only the Config Rules (these don't require a recorder for compliance checks)
    const configRules = [
      {
        name: 's3-bucket-server-side-encryption-enabled',
        source: 'AWS',
        identifier: 'S3_BUCKET_SERVER_SIDE_ENCRYPTION_ENABLED',
      },
      {
        name: 'rds-storage-encrypted',
        source: 'AWS',
        identifier: 'RDS_STORAGE_ENCRYPTED',
      },
      {
        name: 'cloudwatch-log-group-encrypted',
        source: 'AWS',
        identifier: 'CLOUDWATCH_LOG_GROUP_ENCRYPTED',
      },
      {
        name: 'iam-user-mfa-enabled',
        source: 'AWS',
        identifier: 'IAM_USER_MFA_ENABLED',
      },
    ];

    configRules.forEach((rule, index) => {
      new ConfigConfigRule(this, `config-rule-${index}`, {
        name: `tap-${rule.name}-prod-${Date.now()}`,
        source: {
          owner: rule.source,
          sourceIdentifier: rule.identifier,
        },
        dependsOn: [configRole],
      });
    });
  }
}

```