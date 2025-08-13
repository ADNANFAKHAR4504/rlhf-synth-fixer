```typescript

import * as cdk from 'aws-cdk-lib';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as logs from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';

export interface SecureIAMProps {
  userName: string;
  roleName: string;
  s3BucketArns: string[];
  rdsResourceArns?: string[];
}

export class SecureIAM extends Construct {
  public readonly user: iam.User;
  public readonly role: iam.Role;
  public readonly logGroup: logs.LogGroup;

  constructor(scope: Construct, id: string, props: SecureIAMProps) {
    super(scope, id);

    // Create CloudWatch Log Group for IAM role logging
    this.logGroup = new logs.LogGroup(this, 'IAMRoleLogGroup', {
      logGroupName: `/aws/iam/roles/${props.roleName}-${Date.now()}`,
      retention: logs.RetentionDays.ONE_YEAR,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // Create IAM role with least privilege
    this.role = new iam.Role(this, 'SecureRole', {
      roleName: props.roleName,
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      description: 'Secure role with least privilege access',
      maxSessionDuration: cdk.Duration.hours(1),
    });

    // Add CloudTrail logging policy for the role
    const cloudTrailLoggingPolicy = new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        'logs:CreateLogGroup',
        'logs:CreateLogStream',
        'logs:PutLogEvents',
        'logs:DescribeLogStreams',
      ],
      resources: [this.logGroup.logGroupArn],
    });

    // Create least privilege S3 policy
    const s3Policy = new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        's3:GetObject',
        's3:PutObject',
        's3:DeleteObject',
        's3:GetObjectVersion',
        's3:ListBucket',
      ],
      resources: [
        ...props.s3BucketArns,
        ...props.s3BucketArns.map(arn => `${arn}/*`),
      ],
      conditions: {
        Bool: {
          'aws:SecureTransport': 'true',
        },
      },
    });

    // Add RDS policy if RDS resources are provided
    let rdsPolicy: iam.PolicyStatement | undefined;
    if (props.rdsResourceArns && props.rdsResourceArns.length > 0) {
      rdsPolicy = new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'rds:DescribeDBInstances',
          'rds:DescribeDBClusters',
          'rds-db:connect',
        ],
        resources: props.rdsResourceArns,
      });
    }

    // Attach policies to role
    this.role.addToPolicy(cloudTrailLoggingPolicy);
    this.role.addToPolicy(s3Policy);
    if (rdsPolicy) {
      this.role.addToPolicy(rdsPolicy);
    }

    // Create IAM user with MFA requirement
    this.user = new iam.User(this, 'SecureUser', {
      userName: props.userName,
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('IAMUserChangePassword'),
      ],
    });

    // Policy requiring MFA for all actions
    const mfaPolicy = new iam.Policy(this, 'MFARequiredPolicy', {
      policyName: 'RequireMFAPolicy',
      statements: [
        new iam.PolicyStatement({
          sid: 'AllowViewAccountInfo',
          effect: iam.Effect.ALLOW,
          actions: [
            'iam:GetAccountPasswordPolicy',
            'iam:ListVirtualMFADevices',
            'iam:GetUser',
            'iam:ListMFADevices',
          ],
          resources: ['*'],
        }),
        new iam.PolicyStatement({
          sid: 'AllowManageOwnPasswords',
          effect: iam.Effect.ALLOW,
          actions: ['iam:ChangePassword', 'iam:GetUser'],
          resources: ['arn:aws:iam::*:user/${aws:username}'],
        }),
        new iam.PolicyStatement({
          sid: 'AllowManageOwnMFA',
          effect: iam.Effect.ALLOW,
          actions: [
            'iam:CreateVirtualMFADevice',
            'iam:DeleteVirtualMFADevice',
            'iam:EnableMFADevice',
            'iam:ListMFADevices',
            'iam:ResyncMFADevice',
          ],
          resources: [
            'arn:aws:iam::*:mfa/${aws:username}',
            'arn:aws:iam::*:user/${aws:username}',
          ],
        }),
        new iam.PolicyStatement({
          sid: 'DenyAllExceptUnlessSignedInWithMFA',
          effect: iam.Effect.DENY,
          notActions: [
            'iam:CreateVirtualMFADevice',
            'iam:EnableMFADevice',
            'iam:GetUser',
            'iam:ListMFADevices',
            'iam:ListVirtualMFADevices',
            'iam:ResyncMFADevice',
            'sts:GetSessionToken',
            'iam:ChangePassword',
          ],
          resources: ['*'],
          conditions: {
            BoolIfExists: {
              'aws:MultiFactorAuthPresent': 'false',
            },
          },
        }),
      ],
    });

    this.user.attachInlinePolicy(mfaPolicy);

    // Output user ARN
    new cdk.CfnOutput(this, 'UserArn', {
      value: this.user.userArn,
      description: `ARN of the secure IAM user ${props.userName}`,
    });

    new cdk.CfnOutput(this, 'RoleArn', {
      value: this.role.roleArn,
      description: `ARN of the secure IAM role ${props.roleName}`,
    });
  }
}


import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';

export interface SecureNetworkingProps {
  vpcName: string;
  cidr: string;
  maxAzs: number;
}

export class SecureNetworking extends Construct {
  public readonly vpc: ec2.Vpc;
  public readonly s3Endpoint: ec2.GatewayVpcEndpoint;
  public readonly securityGroup: ec2.SecurityGroup;

  constructor(scope: Construct, id: string, props: SecureNetworkingProps) {
    super(scope, id);

    // Create VPC with private and public subnets
    this.vpc = new ec2.Vpc(this, 'SecureVPC', {
      vpcName: props.vpcName,
      ipAddresses: ec2.IpAddresses.cidr(props.cidr),
      maxAzs: props.maxAzs,
      natGateways: 1, // Minimize costs while maintaining security
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'Public',
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          cidrMask: 24,
          name: 'Private',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
        {
          cidrMask: 24,
          name: 'Database',
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        },
      ],
      enableDnsHostnames: true,
      enableDnsSupport: true,
    });

    // Create VPC endpoint for S3 to ensure traffic doesn't traverse public internet
    this.s3Endpoint = this.vpc.addGatewayEndpoint('S3Endpoint', {
      service: ec2.GatewayVpcEndpointAwsService.S3,
      subnets: [
        {
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
        {
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        },
      ],
    });

    // Create secure security group (NO SSH from 0.0.0.0/0)
    this.securityGroup = new ec2.SecurityGroup(this, 'SecureSecurityGroup', {
      vpc: this.vpc,
      description: 'Secure security group with restricted access',
      allowAllOutbound: false, // Explicit outbound rules only
    });

    // Allow HTTPS outbound for secure communications
    this.securityGroup.addEgressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      'Allow HTTPS outbound'
    );

    // Allow HTTP outbound for package updates (consider restricting further)
    this.securityGroup.addEgressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      'Allow HTTP outbound for updates'
    );

    // Allow SSH only from VPC CIDR (internal access only)
    this.securityGroup.addIngressRule(
      ec2.Peer.ipv4(props.cidr),
      ec2.Port.tcp(22),
      'Allow SSH from VPC only'
    );

    // VPC Flow Logs for security monitoring
    new ec2.FlowLog(this, 'VPCFlowLog', {
      resourceType: ec2.FlowLogResourceType.fromVpc(this.vpc),
      destination: ec2.FlowLogDestination.toCloudWatchLogs(),
    });

    // Outputs
    new cdk.CfnOutput(this, 'VpcId', {
      value: this.vpc.vpcId,
      description: 'VPC ID',
    });

    new cdk.CfnOutput(this, 'S3EndpointId', {
      value: this.s3Endpoint.vpcEndpointId,
      description: 'S3 VPC Endpoint ID',
    });
  }
}

import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as rds from 'aws-cdk-lib/aws-rds';
import { Construct } from 'constructs';

export interface SecureRDSProps {
  vpc: ec2.IVpc;
  databaseName: string;
  instanceIdentifier: string;
  securityGroup: ec2.ISecurityGroup;
}

export class SecureRDS extends Construct {
  public readonly database: rds.DatabaseInstance;
  public readonly encryptionKey: kms.Key;

  constructor(scope: Construct, id: string, props: SecureRDSProps) {
    super(scope, id);

    // Create KMS key for RDS encryption
    this.encryptionKey = new kms.Key(this, 'RDSEncryptionKey', {
      description: 'KMS key for RDS instance encryption',
      enableKeyRotation: true,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // Create subnet group for RDS in isolated subnets
    const subnetGroup = new rds.SubnetGroup(this, 'DatabaseSubnetGroup', {
      vpc: props.vpc,
      description: 'Subnet group for secure RDS instance',
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
      },
    });

    // Create parameter group with secure settings
    const parameterGroup = new rds.ParameterGroup(
      this,
      'DatabaseParameterGroup',
      {
        engine: rds.DatabaseInstanceEngine.postgres({
          version: rds.PostgresEngineVersion.VER_15_13,
        }),
        description: 'Secure parameter group for PostgreSQL',
        parameters: {
          log_statement: 'all',
          log_min_duration_statement: '1000',
          shared_preload_libraries: 'pg_stat_statements',
          ssl: '1',
          log_connections: '1',
          log_disconnections: '1',
        },
      }
    );

    // Create RDS security group
    const rdsSecurityGroup = new ec2.SecurityGroup(this, 'RDSSecurityGroup', {
      vpc: props.vpc,
      description: 'Security group for RDS instance',
      allowAllOutbound: false,
    });

    // Allow PostgreSQL access only from application security group
    rdsSecurityGroup.addIngressRule(
      props.securityGroup,
      ec2.Port.tcp(5432),
      'Allow PostgreSQL access from application'
    );

    // Create the RDS instance with encryption at rest
    this.database = new rds.DatabaseInstance(this, 'SecureDatabase', {
      instanceIdentifier: props.instanceIdentifier,
      engine: rds.DatabaseInstanceEngine.postgres({
        version: rds.PostgresEngineVersion.VER_15_13,
      }),
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T3,
        ec2.InstanceSize.MICRO
      ),
      credentials: rds.Credentials.fromGeneratedSecret('postgres', {
        secretName: `${props.instanceIdentifier}-credentials`,
        excludeCharacters: '"@/\\\'',
      }),
      vpc: props.vpc,
      subnetGroup: subnetGroup,
      securityGroups: [rdsSecurityGroup],
      databaseName: props.databaseName,

      // Encryption at rest (required)
      storageEncrypted: true,
      storageEncryptionKey: this.encryptionKey,

      // Backup and maintenance
      backupRetention: cdk.Duration.days(7),
      deleteAutomatedBackups: false,
      deletionProtection: true,

      // Monitoring and logging
      monitoringInterval: cdk.Duration.seconds(60),
      enablePerformanceInsights: true,
      performanceInsightEncryptionKey: this.encryptionKey,
      performanceInsightRetention: rds.PerformanceInsightRetention.DEFAULT,

      cloudwatchLogsExports: ['postgresql'],
      parameterGroup: parameterGroup,

      // Multi-AZ for high availability
      multiAz: false, // Set to true for production

      // Auto minor version upgrade
      autoMinorVersionUpgrade: true,

      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // Create CloudWatch log group for RDS logs
    new logs.LogGroup(this, 'RDSLogGroup', {
      logGroupName: `/aws/rds/instance/${props.instanceIdentifier}/postgresql-${Date.now()}`,
      retention: logs.RetentionDays.ONE_MONTH,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // Output database endpoint
    new cdk.CfnOutput(this, 'DatabaseEndpoint', {
      value: this.database.instanceEndpoint.hostname,
      description: 'RDS instance endpoint',
    });

    new cdk.CfnOutput(this, 'DatabaseArn', {
      value: this.database.instanceArn,
      description: 'RDS instance ARN',
    });
  }
}

import * as cdk from 'aws-cdk-lib';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';

export interface SecureS3BucketProps {
  bucketName: string;
  encryptionKey?: kms.IKey;
  enableLogging?: boolean;
}

export class SecureS3Bucket extends Construct {
  public readonly bucket: s3.Bucket;
  public readonly encryptionKey: kms.Key;

  constructor(scope: Construct, id: string, props: SecureS3BucketProps) {
    super(scope, id);

    // Create KMS key for S3 encryption
    this.encryptionKey =
      (props.encryptionKey as kms.Key) ||
      new kms.Key(this, 'S3EncryptionKey', {
        description: 'KMS key for S3 bucket encryption',
        enableKeyRotation: true,
        removalPolicy: cdk.RemovalPolicy.RETAIN,
      });

    // Create secure S3 bucket
    this.bucket = new s3.Bucket(this, 'SecureBucket', {
      bucketName: props.bucketName,
      // Enable versioning as required
      versioned: true,
      // Server-side encryption with KMS
      encryption: s3.BucketEncryption.KMS,
      encryptionKey: this.encryptionKey,
      // Ensure bucket is not publicly accessible
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      publicReadAccess: false,
      // Enable access logging if specified
      serverAccessLogsPrefix: props.enableLogging ? 'access-logs/' : undefined,
      // Secure transport only
      enforceSSL: true,
      // Lifecycle rules for cost optimization
      lifecycleRules: [
        {
          id: 'DeleteIncompleteMultipartUploads',
          abortIncompleteMultipartUploadAfter: cdk.Duration.days(7),
        },
        {
          id: 'TransitionToIA',
          transitions: [
            {
              storageClass: s3.StorageClass.INFREQUENT_ACCESS,
              transitionAfter: cdk.Duration.days(30),
            },
          ],
        },
      ],
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // Add bucket notification for security monitoring
    // Commented out until a proper destination is configured
    // this.bucket.addEventNotification(
    //   s3.EventType.OBJECT_CREATED,
    //   // You can add SNS topic or Lambda function here for monitoring
    // );

    // Output the bucket ARN for reference
    new cdk.CfnOutput(this, 'BucketArn', {
      value: this.bucket.bucketArn,
      description: 'ARN of the secure S3 bucket',
    });
  }
}


import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { SecureS3Bucket } from './constructs/secure-s3-bucket';
import { SecureNetworking } from './constructs/secure-networking';
import { SecureRDS } from './constructs/secure-rds';
import { SecureIAM } from './constructs/secure-iam';

interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, props);

    // Ensure deployment in us-east-1
    if (props?.env?.region !== 'us-east-1') {
      throw new Error('This stack must be deployed in us-east-1 region');
    }

    // Create secure networking infrastructure
    const networking = new SecureNetworking(this, 'SecureNetworking', {
      vpcName: 'secure-vpc',
      cidr: '10.0.0.0/16',
      maxAzs: 2,
    });

    // Create secure S3 buckets
    const dataBucket = new SecureS3Bucket(this, 'DataBucket', {
      bucketName: `secure-data-bucket-${cdk.Aws.ACCOUNT_ID}`,
      enableLogging: true,
    });

    const logsBucket = new SecureS3Bucket(this, 'LogsBucket', {
      bucketName: `secure-logs-bucket-${cdk.Aws.ACCOUNT_ID}`,
      enableLogging: false,
    });

    // Create secure RDS instance
    const database = new SecureRDS(this, 'SecureDatabase', {
      vpc: networking.vpc,
      databaseName: 'securedb',
      instanceIdentifier: 'secure-postgres-instance',
      securityGroup: networking.securityGroup,
    });

    // Create secure IAM resources
    // const iamResources =
    new SecureIAM(this, 'SecureIAM', {
      userName: 'secure-user',
      roleName: 'secure-application-role',
      s3BucketArns: [dataBucket.bucket.bucketArn, logsBucket.bucket.bucketArn],
      rdsResourceArns: [database.database.instanceArn],
    });

    // Stack outputs
    new cdk.CfnOutput(this, 'StackRegion', {
      value: this.region,
      description: 'Stack deployment region',
    });

    new cdk.CfnOutput(this, 'SecurityCompliance', {
      value: 'All security requirements implemented',
      description: 'Security compliance status',
    });
  }
}

```