import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import { Construct } from 'constructs';

interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, props);

    // Get environment suffix from props, context, or use 'dev' as default
    const environmentSuffix =
      props?.environmentSuffix ||
      this.node.tryGetContext('environmentSuffix') ||
      'dev';

    // Get allowed IP ranges from context or use default restrictive range
    const allowedIpRanges = this.node.tryGetContext('allowedIpRanges') || [
      '10.0.0.0/8',
    ];

    // Common tags for all resources
    const commonTags = {
      Environment: environmentSuffix,
      Purpose: 'security-infrastructure',
      Project: 'tap-security',
      ManagedBy: 'cdk',
      CostCenter: 'security-ops',
    };

    // Apply tags to the stack
    cdk.Tags.of(this).add('Environment', environmentSuffix);
    cdk.Tags.of(this).add('Purpose', 'security-infrastructure');
    cdk.Tags.of(this).add('Project', 'tap-security');
    cdk.Tags.of(this).add('ManagedBy', 'cdk');

    // 1. KMS Keys for Data Encryption
    const s3KmsKey = new kms.Key(this, `S3KmsKey-${environmentSuffix}`, {
      alias: `tap-s3-key-${environmentSuffix}`,
      description: `KMS key for S3 bucket encryption in ${environmentSuffix} environment`,
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
            sid: 'Allow S3 Service',
            effect: iam.Effect.ALLOW,
            principals: [new iam.ServicePrincipal('s3.amazonaws.com')],
            actions: [
              'kms:Decrypt',
              'kms:GenerateDataKey',
              'kms:ReEncrypt*',
              'kms:CreateGrant',
              'kms:DescribeKey',
            ],
            resources: ['*'],
          }),
        ],
      }),
    });

    const ebsKmsKey = new kms.Key(this, `EbsKmsKey-${environmentSuffix}`, {
      alias: `tap-ebs-key-${environmentSuffix}`,
      description: `KMS key for EBS volume encryption in ${environmentSuffix} environment`,
      enableKeyRotation: true,
    });

    // Store KMS key ARNs in Parameter Store for reference
    new ssm.StringParameter(this, `S3KmsKeyParam-${environmentSuffix}`, {
      parameterName: `/tap/${environmentSuffix}/kms/s3-key-arn`,
      stringValue: s3KmsKey.keyArn,
      description: 'S3 KMS Key ARN for encryption',
    });

    new ssm.StringParameter(this, `EbsKmsKeyParam-${environmentSuffix}`, {
      parameterName: `/tap/${environmentSuffix}/kms/ebs-key-arn`,
      stringValue: ebsKmsKey.keyArn,
      description: 'EBS KMS Key ARN for encryption',
    });

    // 2. VPC and Network Security
    const vpc = new ec2.Vpc(this, `SecureVpc-${environmentSuffix}`, {
      ipAddresses: ec2.IpAddresses.cidr('10.0.0.0/16'),
      maxAzs: 3,
      enableDnsHostnames: true,
      enableDnsSupport: true,
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'private-subnet',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
        {
          cidrMask: 24,
          name: 'public-subnet',
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          cidrMask: 28,
          name: 'isolated-subnet',
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        },
      ],
    });

    // Security Groups with restrictive rules
    const webSecurityGroup = new ec2.SecurityGroup(
      this,
      `WebSecurityGroup-${environmentSuffix}`,
      {
        vpc,
        description: 'Security group for web servers with restricted access',
        allowAllOutbound: false,
      }
    );

    // Only allow HTTPS from specified IP ranges
    allowedIpRanges.forEach((cidr: string, index: number) => {
      webSecurityGroup.addIngressRule(
        ec2.Peer.ipv4(cidr),
        ec2.Port.tcp(443),
        `Allow HTTPS from trusted range ${index + 1}`
      );
    });

    // Allow outbound HTTPS for updates and API calls
    webSecurityGroup.addEgressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      'Allow outbound HTTPS'
    );

    // Database security group - only accessible from web tier
    const dbSecurityGroup = new ec2.SecurityGroup(
      this,
      `DbSecurityGroup-${environmentSuffix}`,
      {
        vpc,
        description: 'Security group for database servers',
        allowAllOutbound: false,
      }
    );

    dbSecurityGroup.addIngressRule(
      webSecurityGroup,
      ec2.Port.tcp(5432),
      'Allow PostgreSQL from web tier'
    );

    // 3. IAM Roles and Policies with MFA Requirements
    const mfaCondition = {
      Bool: {
        'aws:MultiFactorAuthPresent': 'true',
      },
      NumericLessThan: {
        'aws:MultiFactorAuthAge': '3600', // 1 hour
      },
    };

    // EC2 Instance Role with minimal permissions
    const ec2Role = new iam.Role(this, `Ec2InstanceRole-${environmentSuffix}`, {
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      description:
        'IAM role for EC2 instances with minimal required permissions',
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'AmazonSSMManagedInstanceCore'
        ),
      ],
      inlinePolicies: {
        KMSAccessPolicy: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: ['kms:Decrypt', 'kms:GenerateDataKey'],
              resources: [s3KmsKey.keyArn, ebsKmsKey.keyArn],
            }),
          ],
        }),
      },
    });

    // Admin role requiring MFA
    const adminRole = new iam.Role(this, `AdminRole-${environmentSuffix}`, {
      assumedBy: new iam.AccountRootPrincipal(),
      description: 'Administrative role requiring MFA authentication',
      inlinePolicies: {
        AdminPolicy: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: ['*'],
              resources: ['*'],
              conditions: mfaCondition,
            }),
            new iam.PolicyStatement({
              effect: iam.Effect.DENY,
              actions: [
                'iam:DeleteRole',
                'iam:DeleteUser',
                'kms:ScheduleKeyDeletion',
                's3:DeleteBucket',
              ],
              resources: ['*'],
            }),
          ],
        }),
      },
    });

    // 4. S3 Buckets with Security Best Practices
    const secureBucket = new s3.Bucket(
      this,
      `SecureBucket-${environmentSuffix}`,
      {
        bucketName: `tap-secure-bucket-${environmentSuffix}-${cdk.Aws.ACCOUNT_ID}-${Date.now()}`,
        versioned: true,
        encryptionKey: s3KmsKey,
        encryption: s3.BucketEncryption.KMS,
        bucketKeyEnabled: true,
        blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
        enforceSSL: true,
        lifecycleRules: [
          {
            id: 'delete-incomplete-multipart-uploads',
            abortIncompleteMultipartUploadAfter: cdk.Duration.days(1),
          },
          {
            id: 'transition-to-ia',
            transitions: [
              {
                storageClass: s3.StorageClass.INFREQUENT_ACCESS,
                transitionAfter: cdk.Duration.days(30),
              },
            ],
          },
        ],
      }
    );

    // 5. CloudWatch Alarms for Security Monitoring
    new cloudwatch.Alarm(this, `UnauthorizedAccessAlarm-${environmentSuffix}`, {
      alarmName: `tap-unauthorized-access-${environmentSuffix}`,
      alarmDescription: 'Alarm for unauthorized access attempts',
      metric: new cloudwatch.Metric({
        namespace: 'AWS/EC2',
        metricName: 'StatusCheckFailed',
        statistic: 'Sum',
        period: cdk.Duration.minutes(5),
      }),
      threshold: 1,
      evaluationPeriods: 1,
      comparisonOperator:
        cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });

    // 6. Output important resource information
    new cdk.CfnOutput(this, `VpcId-${environmentSuffix}`, {
      value: vpc.vpcId,
      description: 'VPC ID for the secure infrastructure',
      exportName: `tap-vpc-id-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, `S3BucketName-${environmentSuffix}`, {
      value: secureBucket.bucketName,
      description: 'Name of the secure S3 bucket',
      exportName: `tap-s3-bucket-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, `S3KmsKeyId-${environmentSuffix}`, {
      value: s3KmsKey.keyId,
      description: 'KMS Key ID for S3 encryption',
      exportName: `tap-s3-kms-key-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, `Ec2RoleArn-${environmentSuffix}`, {
      value: ec2Role.roleArn,
      description: 'ARN of the EC2 instance role',
      exportName: `tap-ec2-role-arn-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, `WebSecurityGroupId-${environmentSuffix}`, {
      value: webSecurityGroup.securityGroupId,
      description: 'Security Group ID for web servers',
      exportName: `tap-web-sg-id-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, `AdminRoleArn-${environmentSuffix}`, {
      value: adminRole.roleArn,
      description: 'ARN of the admin role requiring MFA',
      exportName: `tap-admin-role-arn-${environmentSuffix}`,
    });

    // Apply common tags to all constructs
    Object.entries(commonTags).forEach(([key, value]) => {
      cdk.Tags.of(this).add(key, value);
    });
  }
}
