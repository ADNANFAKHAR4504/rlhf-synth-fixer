# AWS CDK TypeScript Infrastructure Response

Here's the complete AWS CDK TypeScript infrastructure code to meet your requirements:

## lib/tap-stack.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as kms from 'aws-cdk-lib/aws-kms';
import { Construct } from 'constructs';

interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, props);

    const environmentSuffix = props?.environmentSuffix || this.node.tryGetContext('environmentSuffix') || 'dev';

    // Create VPC with 2 public and 2 private subnets across different AZs
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
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
          cidrMask: 24,
        }
      ],
      natGateways: 2, // One NAT Gateway per AZ for high availability
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
        }
      ],
      serverAccessLogsPrefix: 'access-logs/',
    });

    // IAM Role for EC2 instances with least privilege
    const ec2Role = new iam.Role(this, 'EC2Role', {
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      description: 'IAM role for EC2 instances with least privilege',
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('CloudWatchAgentServerPolicy'),
      ],
      inlinePolicies: {
        LogsAccess: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                's3:PutObject',
                's3:PutObjectAcl',
              ],
              resources: [
                logsBucket.arnForObjects('application-logs/*'),
              ],
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

    const instanceProfile = new iam.InstanceProfile(this, 'EC2InstanceProfile', {
      role: ec2Role,
    });

    // Launch Template with encrypted EBS volumes
    const launchTemplate = new ec2.LaunchTemplate(this, 'SecureLaunchTemplate', {
      machineImage: ec2.MachineImage.latestAmazonLinux2023(),
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MICRO),
      securityGroup: webSecurityGroup,
      role: ec2Role,
      userData: ec2.UserData.forLinux(),
      blockDevices: [
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
    });

    // RDS Subnet Group for private subnets only
    const dbSubnetGroup = new rds.SubnetGroup(this, 'DatabaseSubnetGroup', {
      description: 'Subnet group for RDS instances in private subnets',
      vpc: vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
    });

    // RDS instance in private subnets with encryption
    const database = new rds.DatabaseInstance(this, 'SecureDatabase', {
      engine: rds.DatabaseInstanceEngine.mysql({
        version: rds.MysqlEngineVersion.VER_8_0,
      }),
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MICRO),
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
      enablePerformanceInsights: true,
      performanceInsightEncryptionKey: encryptionKey,
      cloudwatchLogsExports: ['error', 'general', 'slowquery'],
    });

    // IAM Role for Lambda functions if needed
    const lambdaRole = new iam.Role(this, 'LambdaExecutionRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      description: 'IAM role for Lambda functions with least privilege',
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
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

    new cdk.CfnOutput(this, 'DatabaseEndpoint', {
      value: database.instanceEndpoint.hostname,
      description: 'RDS Database Endpoint',
      exportName: `DatabaseEndpoint-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'KMSKeyId', {
      value: encryptionKey.keyId,
      description: 'KMS Encryption Key ID',
      exportName: `KMSKey-${environmentSuffix}`,
    });
  }
}
```

This infrastructure code provides:

1. **VPC with proper subnets**: Creates a VPC with 2 public and 2 private subnets across 2 availability zones
2. **Internet Gateway**: Automatically created by CDK for public subnets
3. **NAT Gateways**: 2 NAT Gateways (one per AZ) for high availability
4. **Route Tables**: Automatically configured by CDK VPC construct
5. **Security Groups**: Separate security groups for web servers, SSH access, and RDS
6. **RDS in private subnets**: Database is placed only in private subnets with proper subnet group
7. **Encrypted EBS volumes**: Launch template includes encrypted EBS volumes using KMS
8. **S3 bucket for logs**: Encrypted S3 bucket with lifecycle policies and access logging
9. **IAM roles**: Least privilege roles for EC2 instances and Lambda functions
10. **No hardcoded secrets**: Uses CDK context, environment variables, and generated secrets
11. **Clean destruction**: All resources configured with proper removal policies
12. **Proper tagging**: All resources are tagged consistently

The code uses the latest CDK best practices and ensures all resources can be cleanly destroyed with `cdk destroy` without manual intervention.