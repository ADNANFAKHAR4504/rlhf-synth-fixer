import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as logs from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';

export class SecurityStack extends cdk.Stack {
  public readonly vpc: ec2.Vpc;
  public readonly kmsKey: kms.Key;
  public readonly dbSecret: secretsmanager.Secret;
  public readonly logBucket: s3.Bucket;
  public readonly albLogBucket: s3.Bucket;
  public readonly appSecurityGroup: ec2.SecurityGroup;
  public readonly dbSecurityGroup: ec2.SecurityGroup;
  public readonly albSecurityGroup: ec2.SecurityGroup;
  public readonly ec2Role: iam.Role;
  // public readonly rdsRole: iam.Role;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // KMS Key for encryption at rest
    this.kmsKey = new kms.Key(this, 'EncryptionKey', {
      description: 'KMS key for encrypting all data at rest',
      enableKeyRotation: true,
    });

    // VPC with multi-AZ setup
    this.vpc = new ec2.Vpc(this, 'SecureVpc', {
      maxAzs: 2,
      natGateways: 2,
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
          cidrMask: 28,
          name: 'Database',
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        },
      ],
    });

    // S3 Bucket for general logging with encryption
    this.logBucket = new s3.Bucket(this, 'LogBucket', {
      encryption: s3.BucketEncryption.KMS,
      encryptionKey: this.kmsKey,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      versioned: true,
      lifecycleRules: [
        {
          id: 'LogRetention',
          expiration: cdk.Duration.days(365),
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
        },
      ],
    });

    // Separate S3 Bucket for ALB logs (ALB doesn't support KMS-encrypted buckets)
    this.albLogBucket = new s3.Bucket(this, 'AlbLogBucket', {
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      versioned: true,
      lifecycleRules: [
        {
          id: 'AlbLogRetention',
          expiration: cdk.Duration.days(365),
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
        },
      ],
    });

    // CloudWatch Log Group with unique name per environment
    const environmentSuffix =
      this.node.tryGetContext('environmentSuffix') || 'dev';
    new logs.LogGroup(this, 'ApplicationLogGroup', {
      logGroupName: `/aws/application/secure-web-app-${environmentSuffix}`,
      retention: logs.RetentionDays.ONE_YEAR,
      encryptionKey: this.kmsKey,
    });

    // Database secret in Secrets Manager
    this.dbSecret = new secretsmanager.Secret(this, 'DbSecret', {
      description: 'RDS Database Credentials',
      generateSecretString: {
        secretStringTemplate: JSON.stringify({ username: 'admin' }),
        generateStringKey: 'password',
        excludeCharacters: '"@/\\',
        passwordLength: 32,
      },
      encryptionKey: this.kmsKey,
    });

    // Security Groups with restricted access
    this.albSecurityGroup = new ec2.SecurityGroup(this, 'AlbSecurityGroup', {
      vpc: this.vpc,
      description: 'Security group for Application Load Balancer',
      allowAllOutbound: true, // Allow all outbound for ALB to reach targets
    });

    // Allow HTTP access for testing (in production, use HTTPS only)
    this.albSecurityGroup.addIngressRule(
      ec2.Peer.ipv4('203.0.113.0/24'), // Replace with your allowed IP range
      ec2.Port.tcp(80),
      'HTTP access from trusted IPs'
    );

    // Also allow HTTPS for future use
    this.albSecurityGroup.addIngressRule(
      ec2.Peer.ipv4('203.0.113.0/24'), // Replace with your allowed IP range
      ec2.Port.tcp(443),
      'HTTPS access from trusted IPs'
    );

    this.appSecurityGroup = new ec2.SecurityGroup(this, 'AppSecurityGroup', {
      vpc: this.vpc,
      description: 'Security group for application instances',
      allowAllOutbound: true,
    });

    this.appSecurityGroup.addIngressRule(
      this.albSecurityGroup,
      ec2.Port.tcp(8080),
      'HTTP from ALB'
    );

    this.dbSecurityGroup = new ec2.SecurityGroup(this, 'DbSecurityGroup', {
      vpc: this.vpc,
      description: 'Security group for RDS database',
      allowAllOutbound: false,
    });

    this.dbSecurityGroup.addIngressRule(
      this.appSecurityGroup,
      ec2.Port.tcp(3306),
      'MySQL from application'
    );

    // IAM Role for EC2 instances with minimal permissions
    this.ec2Role = new iam.Role(this, 'Ec2Role', {
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      description: 'IAM role for EC2 instances with minimal permissions',
    });

    this.ec2Role.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['secretsmanager:GetSecretValue'],
        resources: [this.dbSecret.secretArn],
      })
    );

    this.ec2Role.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['logs:CreateLogStream', 'logs:PutLogEvents'],
        resources: [
          `arn:aws:logs:${this.region}:${this.account}:log-group:/aws/application/secure-web-app-${environmentSuffix}:*`,
        ],
      })
    );

    this.ec2Role.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['s3:PutObject', 's3:PutObjectAcl'],
        resources: [`${this.logBucket.bucketArn}/*`],
      })
    );

    // // IAM Role for RDS with minimal permissions
    // this.rdsRole = new iam.Role(this, 'RdsRole', {
    //   assumedBy: new iam.ServicePrincipal('rds.amazonaws.com'),
    //   description: 'IAM role for RDS with minimal permissions',
    // });

    // this.rdsRole.addToPolicy(new iam.PolicyStatement({
    //   effect: iam.Effect.ALLOW,
    //   actions: [
    //     's3:PutObject',
    //     's3:PutObjectAcl',
    //   ],
    //   resources: [`${this.logBucket.bucketArn}/rds-logs/*`],
    // }));
  }
}
