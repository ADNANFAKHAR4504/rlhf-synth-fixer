import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as kms from 'aws-cdk-lib/aws-kms';
import { Construct } from 'constructs';

// LocalStack detection
const isLocalStack =
  process.env.AWS_ENDPOINT_URL?.includes('localhost') ||
  process.env.AWS_ENDPOINT_URL?.includes('4566');

interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, props);

    const environmentSuffix =
      props?.environmentSuffix ||
      this.node.tryGetContext('environmentSuffix') ||
      'dev';

    // Create VPC with 2 public and 2 private subnets across different AZs
    // LocalStack does not support NAT Gateways with EIP allocation, so we disable them
    const vpc = new ec2.Vpc(this, 'SecureVPC', {
      ipAddresses: ec2.IpAddresses.cidr('10.0.0.0/16'),
      maxAzs: 2,
      subnetConfiguration: [
        {
          name: 'PublicSubnet',
          subnetType: ec2.SubnetType.PUBLIC,
          cidrMask: 24,
        },
        {
          name: 'PrivateSubnet',
          subnetType: isLocalStack
            ? ec2.SubnetType.PUBLIC
            : ec2.SubnetType.PRIVATE_WITH_EGRESS,
          cidrMask: 24,
        },
      ],
      natGateways: isLocalStack ? 0 : 2, // NAT Gateways not supported in LocalStack
      enableDnsHostnames: true,
      enableDnsSupport: true,
    });

    // Security Group for web servers (HTTP/HTTPS)
    const webSecurityGroup = new ec2.SecurityGroup(this, 'WebSecurityGroup', {
      vpc: vpc,
      description: 'Security group for web servers',
      allowAllOutbound: true,
    });

    webSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      'Allow HTTP traffic'
    );

    webSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      'Allow HTTPS traffic'
    );

    // Security Group for SSH access
    const sshSecurityGroup = new ec2.SecurityGroup(this, 'SSHSecurityGroup', {
      vpc: vpc,
      description: 'Security group for SSH access',
      allowAllOutbound: false,
    });

    sshSecurityGroup.addIngressRule(
      ec2.Peer.ipv4(vpc.vpcCidrBlock),
      ec2.Port.tcp(22),
      'Allow SSH from VPC'
    );

    // Security Group for RDS
    const rdsSecurityGroup = new ec2.SecurityGroup(this, 'RDSSecurityGroup', {
      vpc: vpc,
      description: 'Security group for RDS instances',
      allowAllOutbound: false,
    });

    rdsSecurityGroup.addIngressRule(
      webSecurityGroup,
      ec2.Port.tcp(3306),
      'Allow MySQL access from web servers'
    );

    // KMS Key for encryption
    const encryptionKey = new kms.Key(this, 'EncryptionKey', {
      description: 'KMS key for encrypting resources',
      enableKeyRotation: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    encryptionKey.addAlias(`infrastructure-key-${environmentSuffix}`);

    // S3 Bucket for logs with encryption
    const logsBucket = new s3.Bucket(this, 'LogsBucket', {
      bucketName: `application-logs-${environmentSuffix}-${this.account}-${this.region}`,
      encryption: s3.BucketEncryption.KMS,
      encryptionKey: encryptionKey,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      versioned: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      lifecycleRules: [
        {
          id: 'DeleteOldLogs',
          enabled: true,
          expiration: cdk.Duration.days(30),
          noncurrentVersionExpiration: cdk.Duration.days(7),
        },
      ],
      serverAccessLogsPrefix: 'access-logs/',
    });

    // IAM Role for EC2 instances with least privilege
    const ec2Role = new iam.Role(this, 'EC2Role', {
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      description: 'IAM role for EC2 instances with least privilege',
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'CloudWatchAgentServerPolicy'
        ),
      ],
      inlinePolicies: {
        LogsAccess: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: ['s3:PutObject', 's3:PutObjectAcl'],
              resources: [logsBucket.arnForObjects('application-logs/*')],
            }),
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'kms:Encrypt',
                'kms:Decrypt',
                'kms:ReEncrypt*',
                'kms:GenerateDataKey*',
                'kms:DescribeKey',
              ],
              resources: [encryptionKey.keyArn],
            }),
          ],
        }),
      },
    });

    const instanceProfile = new iam.InstanceProfile(
      this,
      'EC2InstanceProfile',
      {
        role: ec2Role,
      }
    );

    // Launch Template with encrypted EBS volumes
    // LocalStack has limited EC2 support - simplify for LocalStack
    const launchTemplate = new ec2.LaunchTemplate(
      this,
      'SecureLaunchTemplate',
      {
        machineImage: ec2.MachineImage.latestAmazonLinux2023(),
        instanceType: ec2.InstanceType.of(
          ec2.InstanceClass.T3,
          ec2.InstanceSize.MICRO
        ),
        securityGroup: webSecurityGroup,
        role: ec2Role,
        userData: ec2.UserData.forLinux(),
        blockDevices: isLocalStack
          ? [
              {
                deviceName: '/dev/xvda',
                volume: ec2.BlockDeviceVolume.ebs(20, {
                  encrypted: true,
                  deleteOnTermination: true,
                  volumeType: ec2.EbsDeviceVolumeType.GP3,
                }),
              },
            ]
          : [
              {
                deviceName: '/dev/xvda',
                volume: ec2.BlockDeviceVolume.ebs(20, {
                  encrypted: true,
                  kmsKey: encryptionKey,
                  deleteOnTermination: true,
                  volumeType: ec2.EbsDeviceVolumeType.GP3,
                }),
              },
            ],
      }
    );

    // RDS Subnet Group and Database - only deploy on real AWS (not supported in LocalStack Community)
    // LocalStack Community Edition does not support RDS
    let database: rds.DatabaseInstance | undefined;
    let dbSubnetGroup: rds.SubnetGroup | undefined;

    if (!isLocalStack) {
      // RDS Subnet Group for private subnets only
      dbSubnetGroup = new rds.SubnetGroup(this, 'DatabaseSubnetGroup', {
        description: 'Subnet group for RDS instances in private subnets',
        vpc: vpc,
        vpcSubnets: {
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
      });

      // RDS instance in private subnets with encryption
      database = new rds.DatabaseInstance(this, 'SecureDatabase', {
        engine: rds.DatabaseInstanceEngine.mysql({
          version: rds.MysqlEngineVersion.VER_8_0,
        }),
        instanceType: ec2.InstanceType.of(
          ec2.InstanceClass.T3,
          ec2.InstanceSize.MICRO
        ),
        credentials: rds.Credentials.fromGeneratedSecret('admin', {
          secretName: `rds-credentials-${environmentSuffix}`,
          excludeCharacters: '"@/\\',
        }),
        vpc: vpc,
        subnetGroup: dbSubnetGroup,
        securityGroups: [rdsSecurityGroup],
        storageEncrypted: true,
        storageEncryptionKey: encryptionKey,
        backupRetention: cdk.Duration.days(7),
        deleteAutomatedBackups: true,
        deletionProtection: false,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
        allocatedStorage: 20,
        maxAllocatedStorage: 100,
        monitoringInterval: cdk.Duration.seconds(60),
        enablePerformanceInsights: false, // Performance Insights not supported for t3.micro
        cloudwatchLogsExports: ['error', 'general', 'slowquery'],
      });
    }

    // IAM Role for Lambda functions if needed
    const lambdaRole = new iam.Role(this, 'LambdaExecutionRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      description: 'IAM role for Lambda functions with least privilege',
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'service-role/AWSLambdaBasicExecutionRole'
        ),
      ],
      inlinePolicies: {
        VPCAccess: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'ec2:CreateNetworkInterface',
                'ec2:DescribeNetworkInterfaces',
                'ec2:DeleteNetworkInterface',
                'ec2:AttachNetworkInterface',
                'ec2:DetachNetworkInterface',
              ],
              resources: ['*'],
            }),
          ],
        }),
      },
    });

    // Apply tags to all resources
    cdk.Tags.of(this).add('Project', 'SecureInfrastructure');
    cdk.Tags.of(this).add('Environment', environmentSuffix);
    cdk.Tags.of(this).add('ManagedBy', 'CDK');
    cdk.Tags.of(this).add('CostCenter', 'Infrastructure');

    // Outputs for reference
    new cdk.CfnOutput(this, 'VPCId', {
      value: vpc.vpcId,
      description: 'VPC ID',
      exportName: `VPC-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'LogsBucketName', {
      value: logsBucket.bucketName,
      description: 'S3 Logs Bucket Name',
      exportName: `LogsBucket-${environmentSuffix}`,
    });

    // Only output database endpoint if RDS was deployed (not on LocalStack)
    if (database) {
      new cdk.CfnOutput(this, 'DatabaseEndpoint', {
        value: database.instanceEndpoint.hostname,
        description: 'RDS Database Endpoint',
        exportName: `DatabaseEndpoint-${environmentSuffix}`,
      });
    }

    new cdk.CfnOutput(this, 'KMSKeyId', {
      value: encryptionKey.keyId,
      description: 'KMS Encryption Key ID',
      exportName: `KMSKey-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'LaunchTemplateId', {
      value: launchTemplate.launchTemplateId || '',
      description: 'EC2 Launch Template ID',
      exportName: `LaunchTemplate-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'InstanceProfileArn', {
      value: instanceProfile.instanceProfileArn,
      description: 'EC2 Instance Profile ARN',
      exportName: `InstanceProfile-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'LambdaRoleArn', {
      value: lambdaRole.roleArn,
      description: 'Lambda Execution Role ARN',
      exportName: `LambdaRole-${environmentSuffix}`,
    });
  }
}
