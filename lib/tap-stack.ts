import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as cloudtrail from 'aws-cdk-lib/aws-cloudtrail';
import * as logs from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';

interface TapStackProps extends cdk.StackProps {
  environmentSuffix: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: TapStackProps) {
    super(scope, id, props);

    const { environmentSuffix } = props;

    // KMS Key for encryption
    const securityKey = new kms.Key(
      this,
      `SecureCorp-MasterKey-${environmentSuffix}`,
      {
        description: 'SecureCorp master encryption key for data at rest',
        enableKeyRotation: true,
        keySpec: kms.KeySpec.SYMMETRIC_DEFAULT,
        keyUsage: kms.KeyUsage.ENCRYPT_DECRYPT,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      }
    );

    securityKey.addAlias(`alias/securecorp-master-key-${environmentSuffix}`);

    // VPC with multi-AZ configuration
    const vpc = new ec2.Vpc(this, `SecureCorp-VPC-${environmentSuffix}`, {
      ipAddresses: ec2.IpAddresses.cidr('10.0.0.0/16'),
      maxAzs: 3,
      enableDnsHostnames: true,
      enableDnsSupport: true,
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: `SecureCorp-Public-${environmentSuffix}`,
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          cidrMask: 24,
          name: `SecureCorp-Private-${environmentSuffix}`,
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
        {
          cidrMask: 24,
          name: `SecureCorp-Isolated-${environmentSuffix}`,
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        },
      ],
    });

    // VPC Flow Logs for security monitoring
    const flowLogsLogGroup = new logs.LogGroup(
      this,
      `VPC-FlowLogs-${environmentSuffix}`,
      {
        logGroupName: `/securecorp/vpc/flowlogs/${environmentSuffix}`,
        retention: logs.RetentionDays.ONE_YEAR,
        encryptionKey: securityKey,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      }
    );

    const flowLogsRole = new iam.Role(
      this,
      `VPC-FlowLogs-Role-${environmentSuffix}`,
      {
        assumedBy: new iam.ServicePrincipal('vpc-flow-logs.amazonaws.com'),
        inlinePolicies: {
          FlowLogsDeliveryPolicy: new iam.PolicyDocument({
            statements: [
              new iam.PolicyStatement({
                effect: iam.Effect.ALLOW,
                actions: [
                  'logs:CreateLogGroup',
                  'logs:CreateLogStream',
                  'logs:PutLogEvents',
                  'logs:DescribeLogGroups',
                  'logs:DescribeLogStreams',
                ],
                resources: ['*'],
              }),
            ],
          }),
        },
      }
    );

    new ec2.FlowLog(this, `SecureCorp-VPC-FlowLogs-${environmentSuffix}`, {
      resourceType: ec2.FlowLogResourceType.fromVpc(vpc),
      destination: ec2.FlowLogDestination.toCloudWatchLogs(
        flowLogsLogGroup,
        flowLogsRole
      ),
      trafficType: ec2.FlowLogTrafficType.ALL,
    });

    // VPC Endpoints for secure communication
    const s3VpcEndpoint = vpc.addGatewayEndpoint(
      `S3-VPC-Endpoint-${environmentSuffix}`,
      {
        service: ec2.GatewayVpcEndpointAwsService.S3,
        subnets: [{ subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS }],
      }
    );

    const kmsVpcEndpoint = vpc.addInterfaceEndpoint(
      `KMS-VPC-Endpoint-${environmentSuffix}`,
      {
        service: ec2.InterfaceVpcEndpointAwsService.KMS,
        subnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
        privateDnsEnabled: true,
      }
    );

    const secretsManagerEndpoint = vpc.addInterfaceEndpoint(
      `SecretsManager-VPC-Endpoint-${environmentSuffix}`,
      {
        service: ec2.InterfaceVpcEndpointAwsService.SECRETS_MANAGER,
        subnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
        privateDnsEnabled: true,
      }
    );

    const ec2Endpoint = vpc.addInterfaceEndpoint(
      `EC2-VPC-Endpoint-${environmentSuffix}`,
      {
        service: ec2.InterfaceVpcEndpointAwsService.EC2,
        subnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
        privateDnsEnabled: true,
      }
    );

    // CloudTrail logging bucket
    const cloudTrailBucket = new s3.Bucket(
      this,
      `SecureCorp-CloudTrail-Bucket-${environmentSuffix}`,
      {
        bucketName: `securecorp-cloudtrail-${environmentSuffix}-${cdk.Aws.ACCOUNT_ID}`,
        encryption: s3.BucketEncryption.KMS,
        encryptionKey: securityKey,
        blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
        versioned: true,
        lifecycleRules: [
          {
            id: 'CloudTrailLogRetention',
            transitions: [
              {
                storageClass: s3.StorageClass.INFREQUENT_ACCESS,
                transitionAfter: cdk.Duration.days(30),
              },
              {
                storageClass: s3.StorageClass.GLACIER,
                transitionAfter: cdk.Duration.days(90),
              },
            ],
            expiration: cdk.Duration.days(2555), // 7 years retention
          },
        ],
        removalPolicy: cdk.RemovalPolicy.DESTROY,
        autoDeleteObjects: true,
      }
    );

    // Data bucket with encryption
    const dataBucket = new s3.Bucket(
      this,
      `SecureCorp-Data-${environmentSuffix}`,
      {
        bucketName: `securecorp-data-${environmentSuffix}-${cdk.Aws.ACCOUNT_ID}`,
        encryption: s3.BucketEncryption.KMS,
        encryptionKey: securityKey,
        blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
        versioned: true,
        enforceSSL: true,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
        autoDeleteObjects: true,
      }
    );

    // CloudTrail with network activity events for VPC endpoints
    const cloudTrailLogGroup = new logs.LogGroup(
      this,
      `CloudTrail-LogGroup-${environmentSuffix}`,
      {
        logGroupName: `/securecorp/cloudtrail/${environmentSuffix}`,
        retention: logs.RetentionDays.ONE_YEAR,
        encryptionKey: securityKey,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      }
    );

    const trail = new cloudtrail.Trail(
      this,
      `SecureCorp-CloudTrail-${environmentSuffix}`,
      {
        trailName: `SecureCorp-CloudTrail-${environmentSuffix}`,
        bucket: cloudTrailBucket,
        includeGlobalServiceEvents: true,
        isMultiRegionTrail: true,
        enableFileValidation: true,
        encryptionKey: securityKey,
        sendToCloudWatchLogs: true,
        cloudWatchLogGroup: cloudTrailLogGroup,
      }
    );

    // Add network activity events for VPC endpoints (new 2025 feature)
    const cfnTrail = trail.node.defaultChild as cloudtrail.CfnTrail;
    cfnTrail.addPropertyOverride('AdvancedEventSelectors', [
      {
        Name: 'VPC Endpoint Network Activity Events',
        FieldSelectors: [
          {
            Field: 'eventCategory',
            Equals: ['NetworkActivityEvents'],
          },
          {
            Field: 'resources.type',
            Equals: ['AWS::EC2::VPCEndpoint'],
          },
        ],
      },
      {
        Name: 'All Management Events',
        FieldSelectors: [
          {
            Field: 'eventCategory',
            Equals: ['Management'],
          },
        ],
      },
      {
        Name: 'All Data Events',
        FieldSelectors: [
          {
            Field: 'eventCategory',
            Equals: ['Data'],
          },
        ],
      },
    ]);

    // IAM Roles for different user types with least privilege

    // Developer Role - limited access
    const developerRole = new iam.Role(
      this,
      `SecureCorp-Developer-Role-${environmentSuffix}`,
      {
        roleName: `SecureCorp-Developer-${environmentSuffix}`,
        assumedBy: new iam.ArnPrincipal('arn:aws:iam::*:root'), // Should be restricted to specific principals
        description:
          'Role for developers with limited access to development resources',
      }
    );

    developerRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'ec2:DescribeInstances',
          'ec2:DescribeImages',
          'ec2:DescribeSecurityGroups',
          'ec2:DescribeVpcs',
          'ec2:DescribeSubnets',
        ],
        resources: ['*'],
      })
    );

    developerRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['s3:GetObject', 's3:PutObject'],
        resources: [`${dataBucket.bucketArn}/dev/*`],
        conditions: {
          Bool: {
            'aws:SecureTransport': 'true',
          },
        },
      })
    );

    // Admin Role - elevated access with conditions
    const adminRole = new iam.Role(
      this,
      `SecureCorp-Admin-Role-${environmentSuffix}`,
      {
        roleName: `SecureCorp-Admin-${environmentSuffix}`,
        assumedBy: new iam.ArnPrincipal('arn:aws:iam::*:root'), // Should be restricted to specific principals
        description: 'Role for administrators with elevated access',
      }
    );

    adminRole.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName('PowerUserAccess')
    );

    // Deny dangerous actions even for admins
    adminRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.DENY,
        actions: [
          'iam:DeleteRole',
          'iam:DeletePolicy',
          'kms:ScheduleKeyDeletion',
          's3:DeleteBucket',
        ],
        resources: ['*'],
        conditions: {
          StringNotEquals: {
            'aws:PrincipalTag/EmergencyAccess': 'true',
          },
        },
      })
    );

    // Read-Only Role for auditors
    const auditorRole = new iam.Role(
      this,
      `SecureCorp-Auditor-Role-${environmentSuffix}`,
      {
        roleName: `SecureCorp-Auditor-${environmentSuffix}`,
        assumedBy: new iam.ArnPrincipal('arn:aws:iam::*:root'), // Should be restricted to specific principals
        description: 'Role for auditors with read-only access',
      }
    );

    auditorRole.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName('ReadOnlyAccess')
    );

    // RDS Subnet Group for encrypted database
    const dbSubnetGroup = new rds.SubnetGroup(
      this,
      `SecureCorp-DB-SubnetGroup-${environmentSuffix}`,
      {
        description: 'Subnet group for SecureCorp databases',
        vpc,
        vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_ISOLATED },
        subnetGroupName: `securecorp-db-subnet-group-${environmentSuffix}`,
      }
    );

    // Security Group for RDS
    const dbSecurityGroup = new ec2.SecurityGroup(
      this,
      `SecureCorp-DB-SG-${environmentSuffix}`,
      {
        vpc,
        description: 'Security group for SecureCorp database',
        allowAllOutbound: false,
      }
    );

    dbSecurityGroup.addIngressRule(
      ec2.Peer.ipv4(vpc.vpcCidrBlock),
      ec2.Port.tcp(5432),
      'Allow PostgreSQL access from VPC'
    );

    // RDS PostgreSQL instance with encryption
    const database = new rds.DatabaseInstance(
      this,
      `SecureCorp-Database-${environmentSuffix}`,
      {
        engine: rds.DatabaseInstanceEngine.postgres({
          version: rds.PostgresEngineVersion.VER_15_4,
        }),
        instanceType: ec2.InstanceType.of(
          ec2.InstanceClass.T3,
          ec2.InstanceSize.MICRO
        ),
        vpc,
        vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_ISOLATED },
        securityGroups: [dbSecurityGroup],
        subnetGroup: dbSubnetGroup,
        storageEncrypted: true,
        storageEncryptionKey: securityKey,
        backupRetention: cdk.Duration.days(30),
        deletionProtection: false,
        multiAz: false, // Set to true for production
        monitoringInterval: cdk.Duration.seconds(60),
        enablePerformanceInsights: true,
        performanceInsightEncryptionKey: securityKey,
        databaseName: 'securecorpdb',
        credentials: rds.Credentials.fromGeneratedSecret('dbadmin', {
          encryptionKey: securityKey,
        }),
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      }
    );

    // Output important resources
    new cdk.CfnOutput(this, 'VPCId', {
      value: vpc.vpcId,
      description: 'VPC ID for SecureCorp infrastructure',
    });

    new cdk.CfnOutput(this, 'KMSKeyId', {
      value: securityKey.keyId,
      description: 'KMS Key ID for encryption',
    });

    new cdk.CfnOutput(this, 'KMSKeyArn', {
      value: securityKey.keyArn,
      description: 'KMS Key ARN for encryption',
    });

    new cdk.CfnOutput(this, 'CloudTrailArn', {
      value: trail.trailArn,
      description: 'CloudTrail ARN for audit logging',
    });

    new cdk.CfnOutput(this, 'CloudTrailBucketName', {
      value: cloudTrailBucket.bucketName,
      description: 'CloudTrail S3 bucket name',
    });

    new cdk.CfnOutput(this, 'DataBucketName', {
      value: dataBucket.bucketName,
      description: 'Data S3 bucket name',
    });

    new cdk.CfnOutput(this, 'DataBucketArn', {
      value: dataBucket.bucketArn,
      description: 'Data S3 bucket ARN',
    });

    new cdk.CfnOutput(this, 'DatabaseEndpoint', {
      value: database.instanceEndpoint.hostname,
      description: 'RDS Database endpoint',
    });

    new cdk.CfnOutput(this, 'DatabasePort', {
      value: database.instanceEndpoint.port.toString(),
      description: 'RDS Database port',
    });

    new cdk.CfnOutput(this, 'DatabaseSecretArn', {
      value: database.secret?.secretArn || 'No secret created',
      description: 'RDS Database credentials secret ARN',
    });

    new cdk.CfnOutput(this, 'DeveloperRoleArn', {
      value: developerRole.roleArn,
      description: 'Developer IAM role ARN',
    });

    new cdk.CfnOutput(this, 'AdminRoleArn', {
      value: adminRole.roleArn,
      description: 'Admin IAM role ARN',
    });

    new cdk.CfnOutput(this, 'AuditorRoleArn', {
      value: auditorRole.roleArn,
      description: 'Auditor IAM role ARN',
    });

    new cdk.CfnOutput(this, 'VPCEndpointS3Id', {
      value: s3VpcEndpoint.vpcEndpointId,
      description: 'S3 VPC Endpoint ID',
    });

    new cdk.CfnOutput(this, 'VPCEndpointKMSId', {
      value: kmsVpcEndpoint.vpcEndpointId,
      description: 'KMS VPC Endpoint ID',
    });

    new cdk.CfnOutput(this, 'VPCEndpointSecretsManagerId', {
      value: secretsManagerEndpoint.vpcEndpointId,
      description: 'Secrets Manager VPC Endpoint ID',
    });

    new cdk.CfnOutput(this, 'VPCEndpointEC2Id', {
      value: ec2Endpoint.vpcEndpointId,
      description: 'EC2 VPC Endpoint ID',
    });

    // Tags for compliance
    cdk.Tags.of(this).add('Environment', environmentSuffix);
    cdk.Tags.of(this).add('Project', 'SecureCorp');
    cdk.Tags.of(this).add('CostCenter', 'Security');
    cdk.Tags.of(this).add('DataClassification', 'Confidential');
  }
}
