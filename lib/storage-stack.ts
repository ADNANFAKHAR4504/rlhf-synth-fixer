import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';

interface StorageStackProps extends cdk.StackProps {
  vpc: ec2.Vpc;
  environmentSuffix?: string;
}

export class StorageStack extends cdk.Stack {
  public readonly kmsKey: kms.Key;
  public readonly dataBuckets: s3.Bucket[];
  public readonly accessLogBucket: s3.Bucket;

  constructor(scope: Construct, id: string, props: StorageStackProps) {
    super(scope, id, props);

    const suffix = props.environmentSuffix || 'dev';

    // Create KMS key for encryption
    this.kmsKey = new kms.Key(this, 'EncryptionKey', {
      description: `KMS key for securing storage resources - ${suffix}`,
      enableKeyRotation: true,
      pendingWindow: cdk.Duration.days(7),
    });

    // Allow CloudWatch Logs to use the KMS key
    this.kmsKey.addToResourcePolicy(
      new cdk.aws_iam.PolicyStatement({
        sid: 'Enable CloudWatch Logs',
        effect: cdk.aws_iam.Effect.ALLOW,
        principals: [new cdk.aws_iam.ServicePrincipal('logs.amazonaws.com')],
        actions: [
          'kms:Encrypt*',
          'kms:Decrypt*',
          'kms:ReEncrypt*',
          'kms:GenerateDataKey*',
          'kms:CreateGrant',
          'kms:Describe*',
        ],
        resources: ['*'],
        conditions: {
          ArnLike: {
            'kms:EncryptionContext:aws:logs:arn': `arn:aws:logs:${cdk.Aws.REGION}:${cdk.Aws.ACCOUNT_ID}:*`,
          },
        },
      })
    );

    // Create access logs bucket
    this.accessLogBucket = new s3.Bucket(this, 'AccessLogsBucket', {
      bucketName: `secure-access-logs-${suffix}-${cdk.Aws.ACCOUNT_ID}`,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      versioned: false,
      lifecycleRules: [
        {
          id: 'DeleteAccessLogs',
          expiration: cdk.Duration.days(90),
        },
      ],
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    // Create multiple S3 buckets with strict security
    this.dataBuckets = [];
    const bucketNames = ['app-data', 'backup-data', 'logs-data'];

    bucketNames.forEach((name, _index) => {
      const bucket = new s3.Bucket(this, `${name}-bucket`, {
        bucketName: `secure-${name}-${suffix}-${cdk.Aws.ACCOUNT_ID}`,
        encryption: s3.BucketEncryption.KMS,
        encryptionKey: this.kmsKey,
        blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
        versioned: true,
        serverAccessLogsBucket: this.accessLogBucket,
        serverAccessLogsPrefix: `access-logs/${name}/`,
        lifecycleRules: [
          {
            id: 'IntelligentTiering',
            transitions: [
              {
                storageClass: s3.StorageClass.INTELLIGENT_TIERING,
                transitionAfter: cdk.Duration.days(1),
              },
            ],
            noncurrentVersionExpiration: cdk.Duration.days(30),
          },
        ],
        removalPolicy: cdk.RemovalPolicy.DESTROY,
        autoDeleteObjects: true,
      });

      // Deny all public access
      bucket.addToResourcePolicy(
        new cdk.aws_iam.PolicyStatement({
          sid: 'DenyPublicAccess',
          effect: cdk.aws_iam.Effect.DENY,
          principals: [new cdk.aws_iam.AnyPrincipal()],
          actions: ['s3:*'],
          resources: [bucket.bucketArn, `${bucket.bucketArn}/*`],
          conditions: {
            Bool: {
              'aws:SecureTransport': 'false',
            },
          },
        })
      );

      this.dataBuckets.push(bucket);
    });

    // Create RDS subnet group
    const dbSubnetGroup = new rds.SubnetGroup(this, 'DatabaseSubnetGroup', {
      description: `Subnet group for RDS databases - ${suffix}`,
      vpc: props.vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
      },
    });

    // Create RDS security group
    const dbSecurityGroup = new ec2.SecurityGroup(
      this,
      'DatabaseSecurityGroup',
      {
        vpc: props.vpc,
        description: 'Security group for RDS databases',
        allowAllOutbound: false,
      }
    );

    // Create multiple RDS instances with encryption
    const databaseConfigs = [
      {
        id: 'primary',
        instanceType: ec2.InstanceType.of(
          ec2.InstanceClass.T3,
          ec2.InstanceSize.MICRO
        ),
      },
      {
        id: 'secondary',
        instanceType: ec2.InstanceType.of(
          ec2.InstanceClass.T3,
          ec2.InstanceSize.MICRO
        ),
      },
    ];

    databaseConfigs.forEach(config => {
      new rds.DatabaseInstance(this, `Database${config.id}`, {
        removalPolicy: cdk.RemovalPolicy.DESTROY, // Add this line
        engine: rds.DatabaseInstanceEngine.postgres({
          version: rds.PostgresEngineVersion.VER_15_7,
        }),
        instanceType: config.instanceType,
        credentials: rds.Credentials.fromGeneratedSecret('postgres', {
          secretName: `rds-credentials-${config.id}-${suffix}`,
        }),
        vpc: props.vpc,
        subnetGroup: dbSubnetGroup,
        securityGroups: [dbSecurityGroup],
        storageEncrypted: true,
        storageEncryptionKey: this.kmsKey,
        backupRetention: cdk.Duration.days(7),
        deleteAutomatedBackups: true,
        deletionProtection: false,
        multiAz: false, // Set to false to reduce deployment time
        allocatedStorage: 20,
        maxAllocatedStorage: 100,
        monitoringInterval: cdk.Duration.seconds(60),
        enablePerformanceInsights: true,
        performanceInsightEncryptionKey: this.kmsKey,
      });
    });

    cdk.Tags.of(this).add('Component', 'Storage');
  }
}
