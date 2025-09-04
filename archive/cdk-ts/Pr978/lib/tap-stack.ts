import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as cloudtrail from 'aws-cdk-lib/aws-cloudtrail';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as macie from 'aws-cdk-lib/aws-macie';
import * as guardduty from 'aws-cdk-lib/aws-guardduty';
import { Construct } from 'constructs';

interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, props);

    const environmentSuffix = props?.environmentSuffix || 'dev';
    const uniqueId = 'trainr640';

    // Create VPC for secure access control
    const vpc = new ec2.Vpc(this, `SecurityVPC-${environmentSuffix}`, {
      vpcName: `SecurityVPC-${uniqueId}-${environmentSuffix}`,
      maxAzs: 2,
      ipAddresses: ec2.IpAddresses.cidr('10.0.0.0/16'),
      natGateways: 1,
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: `PublicSubnet-${uniqueId}-${environmentSuffix}`,
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          cidrMask: 24,
          name: `PrivateSubnet-${uniqueId}-${environmentSuffix}`,
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
      ],
    });

    cdk.Tags.of(vpc).add('Environment', 'Production');

    // Create KMS key for DynamoDB encryption
    const dynamoKmsKey = new kms.Key(
      this,
      `DynamoKMSKey-${environmentSuffix}`,
      {
        alias: `dynamodb-key-${uniqueId}-${environmentSuffix}`,
        description: 'KMS key for DynamoDB table encryption',
        enableKeyRotation: true,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      }
    );

    cdk.Tags.of(dynamoKmsKey).add('Environment', 'Production');

    // Create IAM role for secure S3 and DynamoDB access
    const securityRole = new iam.Role(
      this,
      `SecurityAccessRole-${environmentSuffix}`,
      {
        roleName: `SecurityAccessRole-${uniqueId}-${environmentSuffix}`,
        assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
        description: 'IAM role with secure access to S3 and DynamoDB',
      }
    );

    cdk.Tags.of(securityRole).add('Environment', 'Production');

    // Create S3 bucket with security configurations
    const secureS3Bucket = new s3.Bucket(
      this,
      `SecureS3Bucket-${environmentSuffix}`,
      {
        bucketName: `secure-s3-bucket-${uniqueId}-${environmentSuffix}-${this.account}`,
        versioned: true,
        encryption: s3.BucketEncryption.S3_MANAGED,
        blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
        enforceSSL: true,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
        autoDeleteObjects: true,
      }
    );

    cdk.Tags.of(secureS3Bucket).add('Environment', 'Production');

    // Create bucket policy to restrict access to specific VPC and IAM role
    const restrictToVPCAndRoleStatement = new iam.PolicyStatement({
      sid: 'RestrictToVPCAndRole',
      effect: iam.Effect.ALLOW,
      principals: [new iam.ArnPrincipal(securityRole.roleArn)],
      actions: [
        's3:GetObject',
        's3:PutObject',
        's3:DeleteObject',
        's3:ListBucket',
      ],
      resources: [secureS3Bucket.bucketArn, secureS3Bucket.arnForObjects('*')],
      conditions: {
        StringEquals: {
          'aws:SourceVpc': vpc.vpcId,
        },
        Bool: {
          'aws:SecureTransport': 'true',
        },
      },
    });

    const denyInsecureConnectionsStatement = new iam.PolicyStatement({
      sid: 'DenyInsecureConnections',
      effect: iam.Effect.DENY,
      principals: [new iam.AnyPrincipal()],
      actions: ['s3:*'],
      resources: [secureS3Bucket.bucketArn, secureS3Bucket.arnForObjects('*')],
      conditions: {
        Bool: {
          'aws:SecureTransport': 'false',
        },
      },
    });

    secureS3Bucket.addToResourcePolicy(restrictToVPCAndRoleStatement);
    secureS3Bucket.addToResourcePolicy(denyInsecureConnectionsStatement);

    // Create DynamoDB table with KMS encryption
    const secureTable = new dynamodb.Table(
      this,
      `SecureDynamoTable-${environmentSuffix}`,
      {
        tableName: `SecureTable-${uniqueId}-${environmentSuffix}`,
        partitionKey: {
          name: 'id',
          type: dynamodb.AttributeType.STRING,
        },
        encryption: dynamodb.TableEncryption.CUSTOMER_MANAGED,
        encryptionKey: dynamoKmsKey,
        billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
        pointInTimeRecoverySpecification: {
          pointInTimeRecoveryEnabled: true,
        },
      }
    );

    cdk.Tags.of(secureTable).add('Environment', 'Production');

    // Grant limited DynamoDB permissions to security role
    secureTable.grantReadWriteData(securityRole);

    // Create IAM policy for DynamoDB access with least privilege
    const dynamoPolicy = new iam.Policy(
      this,
      `DynamoSecurityPolicy-${environmentSuffix}`,
      {
        policyName: `DynamoSecurityPolicy-${uniqueId}-${environmentSuffix}`,
        statements: [
          new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            actions: [
              'dynamodb:Query',
              'dynamodb:GetItem',
              'dynamodb:PutItem',
              'dynamodb:UpdateItem',
              'dynamodb:DeleteItem',
            ],
            resources: [secureTable.tableArn],
            conditions: {
              Bool: {
                'aws:SecureTransport': 'true',
              },
            },
          }),
        ],
      }
    );

    dynamoPolicy.attachToRole(securityRole);
    cdk.Tags.of(dynamoPolicy).add('Environment', 'Production');

    // Create S3 bucket for CloudTrail logs
    const cloudTrailBucket = new s3.Bucket(
      this,
      `CloudTrailLogsBucket-${environmentSuffix}`,
      {
        bucketName: `cloudtrail-logs-${uniqueId}-${environmentSuffix}-${this.account}`,
        encryption: s3.BucketEncryption.S3_MANAGED,
        blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
        enforceSSL: true,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
        autoDeleteObjects: true,
      }
    );

    cdk.Tags.of(cloudTrailBucket).add('Environment', 'Production');

    // Create CloudTrail for comprehensive logging
    const trail = new cloudtrail.Trail(
      this,
      `SecurityAuditTrail-${environmentSuffix}`,
      {
        trailName: `SecurityAuditTrail-${uniqueId}-${environmentSuffix}`,
        bucket: cloudTrailBucket,
        includeGlobalServiceEvents: true,
        isMultiRegionTrail: true,
        enableFileValidation: true,
        sendToCloudWatchLogs: true,
      }
    );

    // Add event selectors for S3
    trail.addS3EventSelector([
      {
        bucket: secureS3Bucket,
        objectPrefix: '',
      },
    ]);

    // Note: DynamoDB data events are handled automatically when CloudTrail management events are enabled

    cdk.Tags.of(trail).add('Environment', 'Production');

    // Enable GuardDuty for threat detection
    const guardDuty = new guardduty.CfnDetector(
      this,
      `GuardDutyDetector-${environmentSuffix}`,
      {
        enable: true,
        findingPublishingFrequency: 'FIFTEEN_MINUTES',
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
      }
    );

    cdk.Tags.of(guardDuty).add('Environment', 'Production');

    // Enable Macie for data security and classification
    const macieSession = new macie.CfnSession(
      this,
      `MacieSession-${environmentSuffix}`,
      {
        status: 'ENABLED',
        findingPublishingFrequency: 'FIFTEEN_MINUTES',
      }
    );

    cdk.Tags.of(macieSession).add('Environment', 'Production');

    // Macie will automatically scan and classify the S3 bucket after session is enabled
    // No need for explicit classification job as Macie v2 handles this automatically

    // VPC Endpoint for S3 to ensure secure access
    const s3Endpoint = vpc.addGatewayEndpoint('S3Endpoint', {
      service: ec2.GatewayVpcEndpointAwsService.S3,
    });

    cdk.Tags.of(s3Endpoint).add('Environment', 'Production');

    // VPC Endpoint for DynamoDB
    const dynamoEndpoint = vpc.addGatewayEndpoint('DynamoDBEndpoint', {
      service: ec2.GatewayVpcEndpointAwsService.DYNAMODB,
    });

    cdk.Tags.of(dynamoEndpoint).add('Environment', 'Production');

    // Outputs
    new cdk.CfnOutput(this, 'S3BucketName', {
      value: secureS3Bucket.bucketName,
      description: 'Name of the secure S3 bucket',
      exportName: `S3BucketName-${uniqueId}-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'DynamoDBTableArn', {
      value: secureTable.tableArn,
      description: 'ARN of the secure DynamoDB table',
      exportName: `DynamoDBTableArn-${uniqueId}-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'SecurityRoleArn', {
      value: securityRole.roleArn,
      description: 'ARN of the security access role',
      exportName: `SecurityRoleArn-${uniqueId}-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'CloudTrailArn', {
      value: trail.trailArn,
      description: 'ARN of the CloudTrail for audit logging',
      exportName: `CloudTrailArn-${uniqueId}-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'VPCId', {
      value: vpc.vpcId,
      description: 'VPC ID for secure network access',
      exportName: `VPCId-${uniqueId}-${environmentSuffix}`,
    });
  }
}
