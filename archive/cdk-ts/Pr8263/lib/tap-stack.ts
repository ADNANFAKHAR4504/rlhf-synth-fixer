import * as cdk from 'aws-cdk-lib';
import * as cloudtrail from 'aws-cdk-lib/aws-cloudtrail';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';

// ? Import your stacks here
// import { MyStack } from './my-stack';

// LocalStack detection - CloudTrail not supported in LocalStack Community
const isLocalStack =
  process.env.AWS_ENDPOINT_URL?.includes('localhost') ||
  process.env.LOCALSTACK_HOSTNAME !== undefined ||
  process.env.CDK_DEFAULT_ACCOUNT === '000000000000';

interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: TapStackProps) {
    super(scope, id, props);

    const { environmentSuffix } = props;
    const suffix = environmentSuffix || 'dev';

    // Region validation - ensure we're in us-east-1
    const regionCondition = new cdk.CfnCondition(this, 'IsUSEast1', {
      expression: cdk.Fn.conditionEquals(cdk.Aws.REGION, 'us-east-1'),
    });

    // 'KMS Key' for S3 encryption
    const s3KmsKey = new kms.Key(this, 'S3EncryptionKey', {
      description: `KMS key for S3 bucket encryption and CloudTrail logs - ${suffix}`,
      enableKeyRotation: true, // Enable automatic key rotation for security
      removalPolicy: cdk.RemovalPolicy.DESTROY, // Destroy for cleanup
      alias: `alias/secure-infra-s3-key-${suffix}`,

      // Key policy for S3 encryption (CloudTrail policies removed for PR testing)
      policy: new iam.PolicyDocument({
        statements: [
          // Allow root account full access
          new iam.PolicyStatement({
            sid: 'Enable IAM User Permissions',
            effect: iam.Effect.ALLOW,
            principals: [new iam.AccountRootPrincipal()],
            actions: ['kms:*'],
            resources: ['*'],
          }),
          // Allow CloudTrail service to use the key
          new iam.PolicyStatement({
            sid: 'Allow CloudTrail to encrypt logs',
            effect: iam.Effect.ALLOW,
            principals: [new iam.ServicePrincipal('cloudtrail.amazonaws.com')],
            actions: [
              'kms:GenerateDataKey*',
              'kms:DescribeKey',
              'kms:Encrypt',
              'kms:ReEncrypt*',
              'kms:CreateGrant',
              'kms:Decrypt',
            ],
            resources: ['*'],
            conditions: {
              StringEquals: {
                'kms:EncryptionContext:aws:cloudtrail:arn': `arn:aws:cloudtrail:${this.region}:${this.account}:trail/SecureCloudTrail`,
              },
            },
          }),
        ],
      }),
    });

    // Create KMS key alias
    new kms.Alias(this, 'S3EncryptionKeyAlias', {
      aliasName: 'alias/secure-s3-encryption-key',
      targetKey: s3KmsKey,
    });

    // S3 Bucket for CloudTrail logs - encrypted with KMS
    const cloudTrailBucket = new s3.Bucket(this, 'CloudTrailLogsBucket', {
      bucketName: `secure-cloudtrail-logs-${suffix}-${this.account}-${this.region}`,
      encryption: s3.BucketEncryption.KMS,
      encryptionKey: s3KmsKey,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      enforceSSL: true,
      versioned: true,
      lifecycleRules: [
        {
          id: 'DeleteOldLogs',
          enabled: true,
          expiration: cdk.Duration.days(90),
          noncurrentVersionExpiration: cdk.Duration.days(30),
        },
      ],
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    // CloudTrail bucket policy for proper permissions
    cloudTrailBucket.addToResourcePolicy(
      new iam.PolicyStatement({
        sid: 'AWSCloudTrailAclCheck',
        effect: iam.Effect.ALLOW,
        principals: [new iam.ServicePrincipal('cloudtrail.amazonaws.com')],
        actions: ['s3:GetBucketAcl'],
        resources: [cloudTrailBucket.bucketArn],
        conditions: {
          StringEquals: {
            'AWS:SourceArn': `arn:aws:cloudtrail:${this.region}:${this.account}:trail/SecureCloudTrail`,
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
            'AWS:SourceArn': `arn:aws:cloudtrail:${this.region}:${this.account}:trail/SecureCloudTrail`,
          },
        },
      })
    );

    // VPC with public and private subnets
    // For LocalStack: NAT Gateway not supported, use isolated subnets instead
    const vpc = new ec2.Vpc(this, 'SecureVPC', {
      maxAzs: 2,
      cidr: '10.0.0.0/16',
      natGateways: isLocalStack ? 0 : 1, // No NAT Gateway for LocalStack
      subnetConfiguration: isLocalStack
        ? [
            {
              cidrMask: 24,
              name: 'Public',
              subnetType: ec2.SubnetType.PUBLIC,
            },
            {
              cidrMask: 24,
              name: 'Private',
              subnetType: ec2.SubnetType.PRIVATE_ISOLATED, // Use isolated for LocalStack
            },
          ]
        : [
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
          ],
      enableDnsHostnames: true,
      enableDnsSupport: true,
    });

    // Security Group for EC2 instances - restricted inbound access
    const ec2SecurityGroup = new ec2.SecurityGroup(this, 'EC2SecurityGroup', {
      vpc,
      description: 'Security group for EC2 instances with restricted access',
      allowAllOutbound: true,
    });

    // Add inbound rule for specified CIDR range (SSH access)
    ec2SecurityGroup.addIngressRule(
      ec2.Peer.ipv4('203.0.113.0/24'), // Example CIDR - replace with your actual CIDR
      ec2.Port.tcp(22),
      'SSH access from specified CIDR range'
    );

    // Add inbound rule for HTTP/HTTPS if needed
    ec2SecurityGroup.addIngressRule(
      ec2.Peer.ipv4('203.0.113.0/24'),
      ec2.Port.tcp(80),
      'HTTP access from specified CIDR range'
    );

    ec2SecurityGroup.addIngressRule(
      ec2.Peer.ipv4('203.0.113.0/24'),
      ec2.Port.tcp(443),
      'HTTPS access from specified CIDR range'
    );

    // IAM Role for EC2 instances with least privilege
    const ec2Role = new iam.Role(this, 'EC2InstanceRole', {
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      description:
        'IAM role for EC2 instances with minimal required permissions',
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'AmazonSSMManagedInstanceCore'
        ),
      ],
    });

    // Instance profile for EC2
    const instanceProfile = new iam.CfnInstanceProfile(
      this,
      'EC2InstanceProfile',
      {
        roles: [ec2Role.roleName],
        instanceProfileName: 'SecureEC2InstanceProfile',
      }
    );

    // Latest Amazon Linux 2 AMI
    const amzn2Ami = new ec2.AmazonLinuxImage({
      generation: ec2.AmazonLinuxGeneration.AMAZON_LINUX_2,
      cpuType: ec2.AmazonLinuxCpuType.X86_64,
    });

    // EC2 Instance in private subnet (public for LocalStack)
    const ec2Instance = new ec2.Instance(this, 'SecureEC2Instance', {
      vpc,
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T3,
        ec2.InstanceSize.MICRO
      ),
      machineImage: amzn2Ami,
      securityGroup: ec2SecurityGroup,
      role: ec2Role,
      vpcSubnets: {
        subnetType: isLocalStack
          ? ec2.SubnetType.PUBLIC
          : ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
      userData: ec2.UserData.forLinux(),
      keyName: undefined, // Remove if you want to specify a key pair
    });

    // Security Group for Lambda functions - egress only
    const lambdaSecurityGroup = new ec2.SecurityGroup(
      this,
      'LambdaSecurityGroup',
      {
        vpc,
        description: 'Security group for Lambda functions - egress only',
        allowAllOutbound: true,
      }
    );

    // IAM Role for Lambda functions with VPC execution permissions
    const lambdaRole = new iam.Role(this, 'LambdaExecutionRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      description:
        'IAM role for Lambda functions with VPC execution permissions',
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'service-role/AWSLambdaBasicExecutionRole'
        ),
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'service-role/AWSLambdaVPCAccessExecutionRole'
        ),
      ],
    });

    // Lambda function in VPC (without VPC for LocalStack due to limitations)
    const lambdaFunction = new lambda.Function(this, 'SecureLambdaFunction', {
      runtime: lambda.Runtime.PYTHON_3_9,
      handler: 'index.handler',
      code: lambda.Code.fromInline(`
import json
import logging

logger = logging.getLogger()
logger.setLevel(logging.INFO)

def handler(event, context):
    logger.info('Lambda function executed successfully in VPC')
    return {
        'statusCode': 200,
        'body': json.dumps({
            'message': 'Hello from secure Lambda in VPC!',
            'requestId': context.aws_request_id
        })
    }
      `),
      role: lambdaRole,
      // Skip VPC configuration for LocalStack (not well supported)
      ...(isLocalStack
        ? {}
        : {
            vpc: vpc,
            vpcSubnets: {
              subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
            },
            securityGroups: [lambdaSecurityGroup],
          }),
      timeout: cdk.Duration.seconds(30),
      memorySize: 128,
      description: 'Secure Lambda function running in VPC',
    });

    // CloudTrail for logging API calls (skip for LocalStack - not supported)
    let trail: cloudtrail.Trail | undefined;
    if (!isLocalStack) {
      trail = new cloudtrail.Trail(this, 'SecureCloudTrail', {
        trailName: 'SecureCloudTrail',
        bucket: cloudTrailBucket,
        includeGlobalServiceEvents: true,
        isMultiRegionTrail: true,
        enableFileValidation: true,
        encryptionKey: s3KmsKey,
        sendToCloudWatchLogs: false, // Disable CloudWatch logs to reduce costs
      });
    }

    // Apply region condition to all resources (skip for LocalStack)
    const resources: cdk.CfnResource[] = [
      s3KmsKey.node.defaultChild as cdk.CfnResource,
      cloudTrailBucket.node.defaultChild as cdk.CfnResource,
      vpc.node.defaultChild as cdk.CfnResource,
      ec2SecurityGroup.node.defaultChild as cdk.CfnResource,
      ec2Role.node.defaultChild as cdk.CfnResource,
      instanceProfile,
      ec2Instance.node.defaultChild as cdk.CfnResource,
      lambdaSecurityGroup.node.defaultChild as cdk.CfnResource,
      lambdaRole.node.defaultChild as cdk.CfnResource,
      lambdaFunction.node.defaultChild as cdk.CfnResource,
    ];

    // Add CloudTrail to resources list only if created
    if (trail) {
      resources.push(trail.node.defaultChild as cdk.CfnResource);
    }

    // Apply region condition only for non-LocalStack deployments
    if (!isLocalStack) {
      resources.forEach(resource => {
        resource.cfnOptions.condition = regionCondition;
      });
    }

    // Stack Outputs (condition only for non-LocalStack)
    new cdk.CfnOutput(this, 'S3BucketName', {
      value: cloudTrailBucket.bucketName,
      description: 'Name of the encrypted S3 bucket for CloudTrail logs',
      ...(isLocalStack ? {} : { condition: regionCondition }),
    });

    new cdk.CfnOutput(this, 'VPCId', {
      value: vpc.vpcId,
      description: 'ID of the secure VPC',
      ...(isLocalStack ? {} : { condition: regionCondition }),
    });

    new cdk.CfnOutput(this, 'EC2InstanceId', {
      value: ec2Instance.instanceId,
      description: 'ID of the secure EC2 instance',
      ...(isLocalStack ? {} : { condition: regionCondition }),
    });

    // CloudTrail output (only if CloudTrail was created)
    if (trail) {
      new cdk.CfnOutput(this, 'CloudTrailArn', {
        value: trail.trailArn,
        description: 'ARN of the CloudTrail',
        ...(isLocalStack ? {} : { condition: regionCondition }),
      });
    }

    new cdk.CfnOutput(this, 'LambdaFunctionArn', {
      value: lambdaFunction.functionArn,
      description: 'ARN of the Lambda function in VPC',
      ...(isLocalStack ? {} : { condition: regionCondition }),
    });

    new cdk.CfnOutput(this, 'KMSKeyId', {
      value: s3KmsKey.keyId,
      description: 'ID of the KMS key used for S3 encryption',
      ...(isLocalStack ? {} : { condition: regionCondition }),
    });

    // Lambda Security Group ID for integration purposes
    new cdk.CfnOutput(this, 'LambdaSecurityGroupId', {
      value: lambdaSecurityGroup.securityGroupId,
      description: 'Security Group ID for the Lambda function',
    });

    // EC2 Security Group ID for integration purposes
    new cdk.CfnOutput(this, 'EC2SecurityGroupId', {
      value: ec2SecurityGroup.securityGroupId,
      description: 'Security Group ID for the EC2',
    });
  }
}
