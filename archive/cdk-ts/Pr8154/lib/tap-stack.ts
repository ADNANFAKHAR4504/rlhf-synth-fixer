import * as cdk from 'aws-cdk-lib';
import * as cloudtrail from 'aws-cdk-lib/aws-cloudtrail';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';

interface TapStackProps extends cdk.StackProps {
  environmentSuffix: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: TapStackProps) {
    super(scope, id, props);

    const { environmentSuffix } = props;

    // Create KMS key for proper encryption
    const securityKey = new kms.Key(
      this,
      `SecureCorp-MasterKey-${environmentSuffix}`,
      {
        description: 'SecureCorp master encryption key for data at rest',
        enableKeyRotation: true,
        keySpec: kms.KeySpec.SYMMETRIC_DEFAULT,
        keyUsage: kms.KeyUsage.ENCRYPT_DECRYPT,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
        policy: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              sid: 'Enable IAM User Permissions',
              effect: iam.Effect.ALLOW,
              principals: [new iam.AccountRootPrincipal()],
              actions: ['kms:*'],
              resources: ['*'],
            }),
            new iam.PolicyStatement({
              sid: 'Allow CloudWatch Logs',
              effect: iam.Effect.ALLOW,
              principals: [
                new iam.ServicePrincipal(
                  `logs.${cdk.Aws.REGION}.amazonaws.com`
                ),
              ],
              actions: [
                'kms:Encrypt',
                'kms:Decrypt',
                'kms:ReEncrypt*',
                'kms:GenerateDataKey*',
                'kms:DescribeKey',
              ],
              resources: ['*'],
            }),
            new iam.PolicyStatement({
              sid: 'Allow CloudTrail',
              effect: iam.Effect.ALLOW,
              principals: [
                new iam.ServicePrincipal('cloudtrail.amazonaws.com'),
              ],
              actions: [
                'kms:Encrypt',
                'kms:Decrypt',
                'kms:ReEncrypt*',
                'kms:GenerateDataKey*',
                'kms:DescribeKey',
              ],
              resources: ['*'],
            }),
            new iam.PolicyStatement({
              sid: 'Allow RDS',
              effect: iam.Effect.ALLOW,
              principals: [new iam.ServicePrincipal('rds.amazonaws.com')],
              actions: [
                'kms:Encrypt',
                'kms:Decrypt',
                'kms:ReEncrypt*',
                'kms:GenerateDataKey*',
                'kms:DescribeKey',
              ],
              resources: ['*'],
            }),
            new iam.PolicyStatement({
              sid: 'Allow Secrets Manager',
              effect: iam.Effect.ALLOW,
              principals: [
                new iam.ServicePrincipal('secretsmanager.amazonaws.com'),
              ],
              actions: [
                'kms:Encrypt',
                'kms:Decrypt',
                'kms:ReEncrypt*',
                'kms:GenerateDataKey*',
                'kms:DescribeKey',
              ],
              resources: ['*'],
            }),
          ],
        }),
      }
    );

    securityKey.addAlias(`alias/securecorp-master-key-${environmentSuffix}`);

    // VPC with multi-AZ configuration and enhanced security
    // Disable NAT Gateways for LocalStack compatibility (VPC endpoints provide connectivity)
    const vpc = new ec2.Vpc(this, `SecureCorp-VPC-${environmentSuffix}`, {
      ipAddresses: ec2.IpAddresses.cidr('10.0.0.0/16'),
      maxAzs: 3,
      natGateways: 0, // Disable NAT Gateways for LocalStack compatibility
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

    // Enhanced VPC endpoints for complete coverage
    const secretsManagerEndpoint = vpc.addInterfaceEndpoint(
      `SecretsManager-VPC-Endpoint-${environmentSuffix}`,
      {
        service: ec2.InterfaceVpcEndpointAwsService.SECRETS_MANAGER,
        subnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
        privateDnsEnabled: true,
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

    const ec2Endpoint = vpc.addInterfaceEndpoint(
      `EC2-VPC-Endpoint-${environmentSuffix}`,
      {
        service: ec2.InterfaceVpcEndpointAwsService.EC2,
        subnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
        privateDnsEnabled: true,
      }
    );

    // CloudTrail logging bucket with proper security
    const cloudTrailBucket = new s3.Bucket(
      this,
      `SecureCorp-CloudTrail-Bucket-${environmentSuffix}`,
      {
        encryption: s3.BucketEncryption.KMS,
        encryptionKey: securityKey,
        blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
        versioned: true,
        enforceSSL: true,
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

    // CloudTrail bucket policy for security
    cloudTrailBucket.addToResourcePolicy(
      new iam.PolicyStatement({
        sid: 'AWSCloudTrailAclCheck',
        effect: iam.Effect.ALLOW,
        principals: [new iam.ServicePrincipal('cloudtrail.amazonaws.com')],
        actions: ['s3:GetBucketAcl', 's3:GetBucketLocation'],
        resources: [cloudTrailBucket.bucketArn],
        conditions: {
          StringEquals: {
            'AWS:SourceArn': `arn:aws:cloudtrail:${cdk.Aws.REGION}:${cdk.Aws.ACCOUNT_ID}:trail/SecureCorp-CloudTrail-${environmentSuffix}`,
          },
        },
      })
    );

    cloudTrailBucket.addToResourcePolicy(
      new iam.PolicyStatement({
        sid: 'AWSCloudTrailWrite',
        effect: iam.Effect.ALLOW,
        principals: [new iam.ServicePrincipal('cloudtrail.amazonaws.com')],
        actions: ['s3:PutObject'],
        resources: [`${cloudTrailBucket.bucketArn}/*`],
        conditions: {
          StringEquals: {
            's3:x-amz-acl': 'bucket-owner-full-control',
            'AWS:SourceArn': `arn:aws:cloudtrail:${cdk.Aws.REGION}:${cdk.Aws.ACCOUNT_ID}:trail/SecureCorp-CloudTrail-${environmentSuffix}`,
          },
        },
      })
    );

    // Data bucket with encryption
    const dataBucket = new s3.Bucket(
      this,
      `SecureCorp-Data-${environmentSuffix}`,
      {
        encryption: s3.BucketEncryption.KMS,
        encryptionKey: securityKey,
        blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
        versioned: true,
        enforceSSL: true,
        objectOwnership: s3.ObjectOwnership.BUCKET_OWNER_ENFORCED,
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

    // Add advanced event selectors for comprehensive logging
    const cfnTrail = trail.node.defaultChild as cloudtrail.CfnTrail;
    cfnTrail.addPropertyOverride('AdvancedEventSelectors', [
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
        Name: 'S3 Data Events',
        FieldSelectors: [
          {
            Field: 'eventCategory',
            Equals: ['Data'],
          },
          {
            Field: 'resources.type',
            Equals: ['AWS::S3::Object'],
          },
          {
            Field: 'resources.ARN',
            StartsWith: [
              `${cloudTrailBucket.bucketArn}/`,
              `${dataBucket.bucketArn}/`,
            ],
          },
        ],
      },
    ]);

    // IAM Roles for different user types with least privilege

    // Developer Role - limited access with conditions
    const developerRole = new iam.Role(
      this,
      `SecureCorp-Developer-Role-${environmentSuffix}`,
      {
        roleName: `SecureCorp-Developer-${environmentSuffix}`,
        assumedBy: new iam.AccountRootPrincipal(),
        description:
          'Role for developers with limited access to development resources',
        maxSessionDuration: cdk.Duration.hours(4), // Limit session duration
      }
    );

    // Developer permissions - simplified for compatibility
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
        assumedBy: new iam.AccountRootPrincipal(),
        description: 'Role for administrators with elevated access',
        maxSessionDuration: cdk.Duration.hours(2), // Shorter session for admins
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
          'cloudtrail:StopLogging',
          'cloudtrail:DeleteTrail',
          'logs:DeleteLogGroup',
          'ec2:TerminateInstances',
        ],
        resources: ['*'],
        conditions: {
          Bool: {
            'aws:MultiFactorAuthPresent': 'false',
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
        assumedBy: new iam.AccountRootPrincipal(),
        description: 'Role for auditors with read-only access',
        maxSessionDuration: cdk.Duration.hours(8), // Longer for auditing tasks
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

    // Security Group for RDS - more restrictive
    const dbSecurityGroup = new ec2.SecurityGroup(
      this,
      `SecureCorp-DB-SG-${environmentSuffix}`,
      {
        vpc,
        description: 'Security group for SecureCorp database',
        allowAllOutbound: false,
      }
    );

    // Only allow database access from private subnets, not entire VPC
    const privateSubnets = vpc.selectSubnets({
      subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
    });

    privateSubnets.subnets.forEach((subnet, index) => {
      dbSecurityGroup.addIngressRule(
        ec2.Peer.ipv4(subnet.ipv4CidrBlock),
        ec2.Port.tcp(5432),
        `Allow PostgreSQL access from private subnet ${index + 1}`
      );
    });

    // RDS PostgreSQL instance with encryption
    const database = new rds.DatabaseInstance(
      this,
      `SecureCorp-Database-${environmentSuffix}`,
      {
        engine: rds.DatabaseInstanceEngine.postgres({
          version: rds.PostgresEngineVersion.VER_16_3,
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

    new cdk.CfnOutput(this, 'VPCEndpointSecretsManagerId', {
      value: secretsManagerEndpoint.vpcEndpointId,
      description: 'Secrets Manager VPC Endpoint ID',
    });

    new cdk.CfnOutput(this, 'VPCEndpointKMSId', {
      value: kmsVpcEndpoint.vpcEndpointId,
      description: 'KMS VPC Endpoint ID',
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
