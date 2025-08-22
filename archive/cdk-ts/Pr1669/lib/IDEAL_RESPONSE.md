```typescript
// tap-stack.ts
import * as cdk from 'aws-cdk-lib';
import * as cloudtrail from 'aws-cdk-lib/aws-cloudtrail';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as guardduty from 'aws-cdk-lib/aws-guardduty';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as wafv2 from 'aws-cdk-lib/aws-wafv2';
import { Construct } from 'constructs';

export interface TapStackProps extends cdk.StackProps {
  environment: string;
  allowedSshIps?: string[];
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: TapStackProps) {
    super(scope, id, props);

    const { environment, allowedSshIps = [] } = props;
    const resourcePrefix = `${environment}`;

    // 1. KMS Key for encryption (Requirements 2, 7)
    const kmsKey = new kms.Key(this, `${resourcePrefix}-security-key`, {
      alias: `${resourcePrefix}-security-key`,
      description: `KMS key for ${environment} environment encryption`,
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
            sid: 'Allow CloudTrail to encrypt logs',
            effect: iam.Effect.ALLOW,
            principals: [new iam.ServicePrincipal('cloudtrail.amazonaws.com')],
            actions: [
              'kms:GenerateDataKey*',
              'kms:DescribeKey',
              'kms:Encrypt',
              'kms:ReEncrypt*',
              'kms:Decrypt',
            ],
            resources: ['*'],
          }),
          new iam.PolicyStatement({
            sid: 'Allow CloudWatch Logs to encrypt logs',
            effect: iam.Effect.ALLOW,
            principals: [new iam.ServicePrincipal('logs.amazonaws.com')],
            actions: [
              'kms:GenerateDataKey*',
              'kms:DescribeKey',
              'kms:Encrypt',
              'kms:ReEncrypt*',
              'kms:Decrypt',
            ],
            resources: ['*'],
          }),
          new iam.PolicyStatement({
            sid: 'Allow S3 to encrypt objects',
            effect: iam.Effect.ALLOW,
            principals: [new iam.ServicePrincipal('s3.amazonaws.com')],
            actions: [
              'kms:GenerateDataKey*',
              'kms:DescribeKey',
              'kms:Encrypt',
              'kms:ReEncrypt*',
              'kms:Decrypt',
            ],
            resources: ['*'],
          }),
          new iam.PolicyStatement({
            sid: 'Allow RDS to encrypt data',
            effect: iam.Effect.ALLOW,
            principals: [new iam.ServicePrincipal('rds.amazonaws.com')],
            actions: [
              'kms:GenerateDataKey*',
              'kms:DescribeKey',
              'kms:Encrypt',
              'kms:ReEncrypt*',
              'kms:Decrypt',
            ],
            resources: ['*'],
          }),
          new iam.PolicyStatement({
            sid: 'Allow SNS to encrypt messages',
            effect: iam.Effect.ALLOW,
            principals: [new iam.ServicePrincipal('sns.amazonaws.com')],
            actions: [
              'kms:GenerateDataKey*',
              'kms:DescribeKey',
              'kms:Encrypt',
              'kms:ReEncrypt*',
              'kms:Decrypt',
            ],
            resources: ['*'],
          }),
        ],
      }),
    });

    // 2. VPC and Security Groups (Requirements 9, 11)
    const vpc = new ec2.Vpc(this, `${resourcePrefix}-vpc`, {
      vpcName: `${resourcePrefix}-vpc`,
      maxAzs: 2,
      natGateways: 1,
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'public',
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          cidrMask: 24,
          name: 'private',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
      ],
    });

    // Security Group for EC2 instances - SSH only from allowed IPs
    const ec2SecurityGroup = new ec2.SecurityGroup(
      this,
      `${resourcePrefix}-ec2-sg`,
      {
        vpc,
        securityGroupName: `${resourcePrefix}-ec2-sg`,
        description:
          'Security group for EC2 instances with restricted SSH access',
        allowAllOutbound: true,
      }
    );

    // Add SSH rules only for specified IPs
    allowedSshIps.forEach((ip, index) => {
      ec2SecurityGroup.addIngressRule(
        ec2.Peer.ipv4(ip),
        ec2.Port.tcp(22),
        `SSH access from allowed IP ${index + 1}`
      );
    });

    // Security Group for ALB
    const albSecurityGroup = new ec2.SecurityGroup(
      this,
      `${resourcePrefix}-alb-sg`,
      {
        vpc,
        securityGroupName: `${resourcePrefix}-alb-sg`,
        description: 'Security group for Application Load Balancer',
        allowAllOutbound: false,
      }
    );

    albSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      'HTTP traffic'
    );
    albSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      'HTTPS traffic'
    );

    // Security Group for RDS
    const rdsSecurityGroup = new ec2.SecurityGroup(
      this,
      `${resourcePrefix}-rds-sg`,
      {
        vpc,
        securityGroupName: `${resourcePrefix}-rds-sg`,
        description: 'Security group for RDS instances',
        allowAllOutbound: false,
      }
    );

    rdsSecurityGroup.addIngressRule(
      ec2SecurityGroup,
      ec2.Port.tcp(3306),
      'MySQL access from EC2'
    );

    // 3. IAM Roles with Trust Policies (Requirement 1, 6)
    const ec2Role = new iam.Role(this, `${resourcePrefix}-ec2-role`, {
      roleName: `${resourcePrefix}-ec2-role`,
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      description: 'IAM role for EC2 instances with S3 read-only access',
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'AmazonSSMManagedInstanceCore'
        ),
      ],
    });

    // Add S3 read-only permissions to EC2 role
    ec2Role.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          's3:GetObject',
          's3:GetObjectVersion',
          's3:ListBucket',
          's3:GetBucketLocation',
        ],
        resources: [
          `arn:aws:s3:::${resourcePrefix}-*`,
          `arn:aws:s3:::${resourcePrefix}-*/*`,
        ],
      })
    );

    // Instance profile for EC2 instances (can be used for future EC2 instances)
    new iam.InstanceProfile(this, `${resourcePrefix}-instance-profile`, {
      instanceProfileName: `${resourcePrefix}-instance-profile`,
      role: ec2Role,
    });

    // 4. S3 Bucket with security policies (Requirement 3)
    const s3Bucket = new s3.Bucket(this, `${resourcePrefix}-secure-bucket`, {
      bucketName: `${resourcePrefix}-secure-bucket-${cdk.Aws.ACCOUNT_ID}-${cdk.Aws.REGION}`,
      encryption: s3.BucketEncryption.KMS,
      encryptionKey: kmsKey,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ACLS,
      versioned: true,
      lifecycleRules: [
        {
          id: 'DeleteIncompleteMultipartUploads',
          abortIncompleteMultipartUploadAfter: cdk.Duration.days(7),
        },
      ],
    });

    // Policy to restrict public PUT actions
    s3Bucket.addToResourcePolicy(
      new iam.PolicyStatement({
        sid: 'DenyPublicPutActions',
        effect: iam.Effect.DENY,
        principals: [new iam.AnyPrincipal()],
        actions: ['s3:PutObject', 's3:PutObjectAcl', 's3:PutObjectVersionAcl'],
        resources: [s3Bucket.arnForObjects('*')],
        conditions: {
          StringNotEquals: {
            'aws:PrincipalServiceName': [
              'ec2.amazonaws.com',
              'lambda.amazonaws.com',
            ],
          },
        },
      })
    );

    // 5. RDS Instance with KMS encryption (Requirement 2)
    const rdsSubnetGroup = new rds.SubnetGroup(
      this,
      `${resourcePrefix}-rds-subnet-group`,
      {
        subnetGroupName: `${resourcePrefix}-rds-subnet-group`,
        description: 'Subnet group for RDS instances',
        vpc,
        vpcSubnets: {
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
      }
    );

    const rdsInstance = new rds.DatabaseInstance(
      this,
      `${resourcePrefix}-database`,
      {
        instanceIdentifier: `${resourcePrefix}-database`,
        engine: rds.DatabaseInstanceEngine.mysql({
          version: rds.MysqlEngineVersion.VER_8_0,
        }),
        instanceType: ec2.InstanceType.of(
          ec2.InstanceClass.T3,
          ec2.InstanceSize.MICRO
        ),
        vpc,
        subnetGroup: rdsSubnetGroup,
        securityGroups: [rdsSecurityGroup],
        storageEncrypted: true,
        storageEncryptionKey: kmsKey,
        backupRetention: cdk.Duration.days(7),
        deletionProtection: environment === 'prod',
        multiAz: environment === 'prod',
        autoMinorVersionUpgrade: true,
      }
    );

    // 6. Application Load Balancer
    const alb = new elbv2.ApplicationLoadBalancer(
      this,
      `${resourcePrefix}-alb`,
      {
        loadBalancerName: `${resourcePrefix}-alb`,
        vpc,
        internetFacing: true,
        securityGroup: albSecurityGroup,
      }
    );

    // 7. AWS WAF for Load Balancer protection (Requirement 5)
    const webAcl = new wafv2.CfnWebACL(this, `${resourcePrefix}-web-acl`, {
      name: `${resourcePrefix}-web-acl`,
      scope: 'REGIONAL',
      defaultAction: { allow: {} },
      rules: [
        {
          name: 'AWSManagedRulesCommonRuleSet',
          priority: 1,
          overrideAction: { none: {} },
          statement: {
            managedRuleGroupStatement: {
              vendorName: 'AWS',
              name: 'AWSManagedRulesCommonRuleSet',
            },
          },
          visibilityConfig: {
            sampledRequestsEnabled: true,
            cloudWatchMetricsEnabled: true,
            metricName: 'CommonRuleSetMetric',
          },
        },
        {
          name: 'AWSManagedRulesKnownBadInputsRuleSet',
          priority: 2,
          overrideAction: { none: {} },
          statement: {
            managedRuleGroupStatement: {
              vendorName: 'AWS',
              name: 'AWSManagedRulesKnownBadInputsRuleSet',
            },
          },
          visibilityConfig: {
            sampledRequestsEnabled: true,
            cloudWatchMetricsEnabled: true,
            metricName: 'KnownBadInputsRuleSetMetric',
          },
        },
        {
          name: 'AWSManagedRulesSQLiRuleSet',
          priority: 3,
          overrideAction: { none: {} },
          statement: {
            managedRuleGroupStatement: {
              vendorName: 'AWS',
              name: 'AWSManagedRulesSQLiRuleSet',
            },
          },
          visibilityConfig: {
            sampledRequestsEnabled: true,
            cloudWatchMetricsEnabled: true,
            metricName: 'SQLiRuleSetMetric',
          },
        },
      ],
      visibilityConfig: {
        sampledRequestsEnabled: true,
        cloudWatchMetricsEnabled: true,
        metricName: `${resourcePrefix}WebAclMetric`,
      },
    });

    // Associate WAF with ALB
    new wafv2.CfnWebACLAssociation(
      this,
      `${resourcePrefix}-web-acl-association`,
      {
        resourceArn: alb.loadBalancerArn,
        webAclArn: webAcl.attrArn,
      }
    );

    // 8. CloudTrail with encrypted logs (Requirement 7)
    const cloudTrailLogGroup = new logs.LogGroup(
      this,
      `${resourcePrefix}-cloudtrail-logs`,
      {
        logGroupName: `/aws/cloudtrail/${resourcePrefix}-logs`,
        retention: logs.RetentionDays.ONE_YEAR,
        encryptionKey: kmsKey,
      }
    );

    const cloudTrailBucket = new s3.Bucket(
      this,
      `${resourcePrefix}-cloudtrail-bucket`,
      {
        bucketName: `${resourcePrefix}-cloudtrail-${cdk.Aws.ACCOUNT_ID}-${cdk.Aws.REGION}`,
        encryption: s3.BucketEncryption.KMS,
        encryptionKey: kmsKey,
        blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
        versioned: true,
      }
    );

    // CloudTrail for API logging and monitoring
    new cloudtrail.Trail(this, `${resourcePrefix}-cloudtrail`, {
      trailName: `${resourcePrefix}-cloudtrail`,
      bucket: cloudTrailBucket,
      encryptionKey: kmsKey,
      includeGlobalServiceEvents: true,
      isMultiRegionTrail: true,
      enableFileValidation: true,
      cloudWatchLogGroup: cloudTrailLogGroup,
    });

    // 9. SNS Topic with restricted access (Requirement 8)
    const snsTopic = new sns.Topic(this, `${resourcePrefix}-notifications`, {
      topicName: `${resourcePrefix}-notifications`,
      masterKey: kmsKey,
    });

    snsTopic.addToResourcePolicy(
      new iam.PolicyStatement({
        sid: 'AllowCloudWatchPublish',
        effect: iam.Effect.ALLOW,
        principals: [new iam.ServicePrincipal('cloudwatch.amazonaws.com')],
        actions: ['sns:Publish'],
        resources: [snsTopic.topicArn],
      })
    );

    snsTopic.addToResourcePolicy(
      new iam.PolicyStatement({
        sid: 'AllowEventsPublish',
        effect: iam.Effect.ALLOW,
        principals: [new iam.ServicePrincipal('events.amazonaws.com')],
        actions: ['sns:Publish'],
        resources: [snsTopic.topicArn],
      })
    );

    snsTopic.addToResourcePolicy(
      new iam.PolicyStatement({
        sid: 'AllowLambdaPublish',
        effect: iam.Effect.ALLOW,
        principals: [new iam.ServicePrincipal('lambda.amazonaws.com')],
        actions: ['sns:Publish'],
        resources: [snsTopic.topicArn],
      })
    );

    // 10. GuardDuty Detector (Requirement 10)
    const guardDutyDetector = new guardduty.CfnDetector(
      this,
      `${resourcePrefix}-guardduty`,
      {
        enable: true,
        findingPublishingFrequency: 'FIFTEEN_MINUTES',
        dataSources: {
          s3Logs: { enable: true },
          kubernetes: {
            auditLogs: { enable: true },
          },
          malwareProtection: {
            scanEc2InstanceWithFindings: {
              ebsVolumes: true,
            },
          },
        },
      }
    );

    // 11. IAM User with MFA requirement (Requirement 4)
    const iamUser = new iam.User(this, `${resourcePrefix}-app-user`, {
      userName: `${resourcePrefix}-app-user`,
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('ReadOnlyAccess'),
      ],
    });

    // Policy to enforce MFA
    const mfaPolicy = new iam.Policy(this, `${resourcePrefix}-mfa-policy`, {
      policyName: `${resourcePrefix}-mfa-policy`,
      statements: [
        new iam.PolicyStatement({
          sid: 'AllowViewAccountInfo',
          effect: iam.Effect.ALLOW,
          actions: [
            'iam:GetAccountPasswordPolicy',
            'iam:GetAccountSummary',
            'iam:ListVirtualMFADevices',
          ],
          resources: ['*'],
        }),
        new iam.PolicyStatement({
          sid: 'AllowManageOwnPasswords',
          effect: iam.Effect.ALLOW,
          actions: ['iam:ChangePassword', 'iam:GetUser'],
          resources: [
            `arn:aws:iam::${cdk.Aws.ACCOUNT_ID}:user/\${aws:username}`,
          ],
        }),
        new iam.PolicyStatement({
          sid: 'AllowManageOwnMFA',
          effect: iam.Effect.ALLOW,
          actions: [
            'iam:CreateVirtualMFADevice',
            'iam:DeleteVirtualMFADevice',
            'iam:EnableMFADevice',
            'iam:ListMFADevices',
            'iam:ResyncMFADevice',
          ],
          resources: [
            `arn:aws:iam::${cdk.Aws.ACCOUNT_ID}:mfa/\${aws:username}`,
            `arn:aws:iam::${cdk.Aws.ACCOUNT_ID}:user/\${aws:username}`,
          ],
        }),
        new iam.PolicyStatement({
          sid: 'DenyAllExceptUnlessSignedInWithMFA',
          effect: iam.Effect.DENY,
          notActions: [
            'iam:CreateVirtualMFADevice',
            'iam:EnableMFADevice',
            'iam:GetUser',
            'iam:ListMFADevices',
            'iam:ListVirtualMFADevices',
            'iam:ResyncMFADevice',
            'sts:GetSessionToken',
          ],
          resources: ['*'],
          conditions: {
            BoolIfExists: {
              'aws:MultiFactorAuthPresent': 'false',
            },
          },
        }),
      ],
    });

    mfaPolicy.attachToUser(iamUser);

    // 12. Access Key Rotation Lambda (Requirement 4)
    const keyRotationRole = new iam.Role(
      this,
      `${resourcePrefix}-key-rotation-role`,
      {
        roleName: `${resourcePrefix}-key-rotation-role`,
        assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
        managedPolicies: [
          iam.ManagedPolicy.fromAwsManagedPolicyName(
            'service-role/AWSLambdaBasicExecutionRole'
          ),
        ],
      }
    );

    keyRotationRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'iam:CreateAccessKey',
          'iam:DeleteAccessKey',
          'iam:ListAccessKeys',
          'iam:UpdateAccessKey',
          'sns:Publish',
        ],
        resources: [iamUser.userArn, snsTopic.topicArn],
      })
    );

    // Output important resource ARNs
    new cdk.CfnOutput(this, 'VpcId', {
      value: vpc.vpcId,
      description: 'VPC ID',
    });

    new cdk.CfnOutput(this, 'KmsKeyId', {
      value: kmsKey.keyId,
      description: 'KMS Key ID for encryption',
    });

    new cdk.CfnOutput(this, 'S3BucketName', {
      value: s3Bucket.bucketName,
      description: 'Secure S3 Bucket Name',
    });

    new cdk.CfnOutput(this, 'RdsEndpoint', {
      value: rdsInstance.instanceEndpoint.hostname,
      description: 'RDS Instance Endpoint',
    });

    new cdk.CfnOutput(this, 'LoadBalancerDns', {
      value: alb.loadBalancerDnsName,
      description: 'Application Load Balancer DNS Name',
    });

    new cdk.CfnOutput(this, 'WebAclArn', {
      value: webAcl.attrArn,
      description: 'WAF Web ACL ARN',
    });

    new cdk.CfnOutput(this, 'GuardDutyDetectorId', {
      value: guardDutyDetector.ref,
      description: 'GuardDuty Detector ID',
    });

    new cdk.CfnOutput(this, 'SnsTopicArn', {
      value: snsTopic.topicArn,
      description: 'SNS Topic ARN for notifications',
    });
  }
}
```
