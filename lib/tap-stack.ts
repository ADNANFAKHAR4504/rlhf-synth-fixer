import * as cdk from 'aws-cdk-lib';
import * as cloudtrail from 'aws-cdk-lib/aws-cloudtrail';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as guardduty from 'aws-cdk-lib/aws-guardduty';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';

export interface TapStackProps extends cdk.StackProps {
  environmentSuffix: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: TapStackProps) {
    super(scope, id, props);

    // Detect LocalStack environment
    const isLocalStack =
      process.env.AWS_ENDPOINT_URL?.includes('localhost') ||
      process.env.AWS_ENDPOINT_URL?.includes('4566');

    cdk.Tags.of(this).add('environment', 'production');
    // Create KMS key for encryption
    const kmsKey = new kms.Key(this, 'SecureAppKey', {
      description: 'KMS key for secure web application encryption',
      enableKeyRotation: true,
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
            sid: 'Allow CloudTrail and S3 to use the key',
            effect: iam.Effect.ALLOW,
            principals: [
              new iam.ServicePrincipal('cloudtrail.amazonaws.com'),
              new iam.ServicePrincipal('s3.amazonaws.com'),
            ],
            actions: [
              'kms:Decrypt',
              'kms:DescribeKey',
              'kms:Encrypt',
              'kms:GenerateDataKey*',
              'kms:ReEncrypt*',
            ],
            resources: ['*'],
          }),
        ],
      }),
    });

    new kms.Alias(this, 'SecureAppKeyAlias', {
      aliasName: `alias/secure-app-${props.environmentSuffix}`,
      targetKey: kmsKey,
    });

    // Create VPC with public and private subnets
    // For LocalStack: reduce NAT gateways to save resources
    const vpc = new ec2.Vpc(this, 'SecureAppVpc', {
      maxAzs: 2,
      natGateways: isLocalStack ? 0 : 2, // LocalStack NAT Gateway support is limited
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'Public',
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          cidrMask: 24,
          name: 'Private',
          subnetType: isLocalStack
            ? ec2.SubnetType.PUBLIC
            : ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
        {
          cidrMask: 24,
          name: 'Database',
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        },
      ],
    });

    // Create S3 bucket for access logs
    // For LocalStack: simplify bucket name to avoid length issues
    // Note: This bucket exists for compliance but isn't used for server access logging
    // as LocalStack has limited support for that feature
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const accessLogsBucket = new s3.Bucket(this, 'AccessLogsBucket', {
      bucketName: `app-logs-${props.environmentSuffix}`,
      encryption: s3.BucketEncryption.KMS,
      encryptionKey: kmsKey,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      versioned: true,
      lifecycleRules: [
        {
          id: 'DeleteOldLogs',
          enabled: true,
          expiration: cdk.Duration.days(90),
        },
      ],
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    // Create S3 bucket for web application assets
    // For LocalStack: remove unsupported features (transfer acceleration, server access logging)
    const webAssetsBucket = new s3.Bucket(this, 'WebAssetsBucket', {
      bucketName: `app-assets-${props.environmentSuffix}`,
      encryption: s3.BucketEncryption.KMS,
      encryptionKey: kmsKey,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      versioned: true,
      // LocalStack doesn't support: serverAccessLogsBucket, transferAcceleration
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    // Create CloudTrail bucket
    // For LocalStack: simplify bucket name
    const cloudTrailBucket = new s3.Bucket(this, 'CloudTrailBucket', {
      bucketName: `app-trail-${props.environmentSuffix}`,
      encryption: s3.BucketEncryption.KMS,
      encryptionKey: kmsKey,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      versioned: true,
      lifecycleRules: [
        {
          id: 'DeleteOldTrails',
          enabled: true,
          expiration: cdk.Duration.days(365),
        },
      ],
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    // Configure CloudTrail bucket policy
    cloudTrailBucket.addToResourcePolicy(
      new iam.PolicyStatement({
        sid: 'AWSCloudTrailAclCheck',
        effect: iam.Effect.ALLOW,
        principals: [new iam.ServicePrincipal('cloudtrail.amazonaws.com')],
        actions: ['s3:GetBucketAcl'],
        resources: [cloudTrailBucket.bucketArn],
        conditions: {
          StringEquals: {
            'AWS:SourceArn': `arn:aws:cloudtrail:${this.region}:${this.account}:trail/SecureAppTrail-${props.environmentSuffix}`,
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
            'AWS:SourceArn': `arn:aws:cloudtrail:${this.region}:${this.account}:trail/SecureAppTrail-${props.environmentSuffix}`,
          },
        },
      })
    );

    // Create CloudTrail
    // For LocalStack: remove KMS encryption (limited support)
    const trail = new cloudtrail.Trail(this, 'SecureAppTrail', {
      trailName: `SecureAppTrail-${props.environmentSuffix}`,
      bucket: cloudTrailBucket,
      encryptionKey: isLocalStack ? undefined : kmsKey,
      includeGlobalServiceEvents: true,
      isMultiRegionTrail: false,
      enableFileValidation: true,
    });

    // Add data events for S3 buckets
    trail.addS3EventSelector([
      {
        bucket: webAssetsBucket,
        objectPrefix: '',
      },
    ]);

    // Create RDS database resources (conditionally for LocalStack)
    // For LocalStack: RDS service must be explicitly enabled in SERVICES configuration
    // Skip RDS creation if LocalStack environment doesn't have RDS service enabled
    let database: rds.DatabaseInstance | undefined;

    if (!isLocalStack) {
      // Create database subnet group
      const dbSubnetGroup = new rds.SubnetGroup(this, 'DatabaseSubnetGroup', {
        vpc,
        description: 'Subnet group for secure application database',
        vpcSubnets: {
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        },
      });

      // Create database security group
      const dbSecurityGroup = new ec2.SecurityGroup(
        this,
        'DatabaseSecurityGroup',
        {
          vpc,
          description: 'Security group for secure application database',
          allowAllOutbound: false,
        }
      );

      // Create RDS instance with encryption
      database = new rds.DatabaseInstance(this, 'SecureAppDatabase', {
        engine: rds.DatabaseInstanceEngine.postgres({
          version: rds.PostgresEngineVersion.VER_15_8,
        }),
        instanceType: ec2.InstanceType.of(
          ec2.InstanceClass.T3,
          ec2.InstanceSize.MICRO
        ),
        vpc,
        subnetGroup: dbSubnetGroup,
        securityGroups: [dbSecurityGroup],
        storageEncrypted: true,
        storageEncryptionKey: kmsKey,
        backupRetention: cdk.Duration.days(7),
        deleteAutomatedBackups: true,
        deletionProtection: false,
        multiAz: false,
        publiclyAccessible: false,
        credentials: rds.Credentials.fromGeneratedSecret('postgres', {
          encryptionKey: kmsKey,
        }),
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      });
    }

    // Create ALB security group
    const albSecurityGroup = new ec2.SecurityGroup(this, 'ALBSecurityGroup', {
      vpc,
      description: 'Security group for Application Load Balancer',
      allowAllOutbound: false,
    });

    albSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      'Allow HTTPS traffic'
    );

    albSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      'Allow HTTP traffic'
    );

    // Create Application Load Balancer
    const alb = new elbv2.ApplicationLoadBalancer(this, 'SecureAppALB', {
      vpc,
      internetFacing: true,
      securityGroup: albSecurityGroup,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PUBLIC,
      },
    });

    // Enable GuardDuty detector (if not already enabled)
    // For LocalStack: GuardDuty requires Pro - make conditional
    if (!isLocalStack) {
      new guardduty.CfnDetector(this, 'GuardDutyDetector', {
        enable: true,
        dataSources: {
          s3Logs: {
            enable: true,
          },
          malwareProtection: {
            scanEc2InstanceWithFindings: {
              ebsVolumes: true,
            },
          },
        },
      });
    }

    // Output important resource information
    new cdk.CfnOutput(this, 'KMSKeyId', {
      value: kmsKey.keyId,
      description: 'KMS Key ID for encryption',
    });

    new cdk.CfnOutput(this, 'WebAssetsBucketName', {
      value: webAssetsBucket.bucketName,
      description: 'S3 bucket for web application assets',
    });

    if (database) {
      new cdk.CfnOutput(this, 'DatabaseEndpoint', {
        value: database.instanceEndpoint.hostname,
        description: 'RDS database endpoint',
      });
    }

    new cdk.CfnOutput(this, 'LoadBalancerDNS', {
      value: alb.loadBalancerDnsName,
      description: 'Application Load Balancer DNS name',
    });

    new cdk.CfnOutput(this, 'VPCId', {
      value: vpc.vpcId,
      description: 'VPC ID',
    });

    new cdk.CfnOutput(this, 'CloudTrailArn', {
      value: trail.trailArn,
      description: 'CloudTrail ARN',
    });

    new cdk.CfnOutput(this, 'CloudTrailBucketName', {
      value: cloudTrailBucket.bucketName,
      description: 'S3 bucket for CloudTrail logs',
    });
  }
}
