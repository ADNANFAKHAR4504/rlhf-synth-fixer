import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as cloudtrail from 'aws-cdk-lib/aws-cloudtrail';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as wafv2 from 'aws-cdk-lib/aws-wafv2';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';

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

    // 1. AWS KMS Key with automatic rotation
    const kmsKey = new kms.Key(this, 'SecureKMSKey', {
      description: 'KMS key for secure architecture encryption',
      enableKeyRotation: true,
      keySpec: kms.KeySpec.SYMMETRIC_DEFAULT,
      keyUsage: kms.KeyUsage.ENCRYPT_DECRYPT,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    kmsKey.addAlias(`alias/secure-key-${environmentSuffix}`);

    // 2. S3 Buckets with server-side encryption
    const cloudTrailBucket = new s3.Bucket(this, 'CloudTrailLogsBucket', {
      bucketName: `ct-logs-${environmentSuffix}`.toLowerCase(),
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      versioned: true,
      lifecycleRules: [
        {
          id: 'DeleteOldLogs',
          expiration: cdk.Duration.days(365),
        },
      ],
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    const configBucket = new s3.Bucket(this, 'ConfigBucket', {
      bucketName: `cfg-${environmentSuffix}`.toLowerCase(),
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      versioned: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    // 3. CloudTrail
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const trail = new cloudtrail.Trail(this, 'SecurityAuditTrail', {
      bucket: cloudTrailBucket,
      includeGlobalServiceEvents: true,
      enableFileValidation: true,
      isMultiRegionTrail: true,
      sendToCloudWatchLogs: true,
      cloudWatchLogsRetention: logs.RetentionDays.ONE_YEAR,
    });

    // 4. IAM roles with least privilege
    const lambdaExecutionRole = new iam.Role(this, 'LambdaExecutionRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'service-role/AWSLambdaBasicExecutionRole'
        ),
      ],
      inlinePolicies: {
        KMSDecryptPolicy: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: ['kms:Decrypt'],
              resources: [kmsKey.keyArn],
            }),
          ],
        }),
      },
    });

    // 5. Lambda with encrypted environment variables
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const secureFunction = new lambda.Function(this, 'SecureFunction', {
      functionName: `secure-fn-${environmentSuffix}`,
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromInline(`
        exports.handler = async (event) => {
          console.log('Secure function executing...');
          return { statusCode: 200, body: 'Success' };
        };
      `),
      role: lambdaExecutionRole,
      environment: {
        DATABASE_URL: 'encrypted-database-connection',
        API_KEY: 'encrypted-api-key',
      },
      environmentEncryption: kmsKey,
    });

    // 6. CloudWatch Log Group for security group changes
    const securityGroupLogGroup = new logs.LogGroup(
      this,
      'SecurityGroupChangesLog',
      {
        logGroupName: `/aws/events/sg-changes-${environmentSuffix}`,
        retention: logs.RetentionDays.ONE_YEAR,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      }
    );

    // 7. EventBridge rule for security group changes
    const sgChangeRule = new events.Rule(this, 'SecurityGroupChangeRule', {
      eventPattern: {
        source: ['aws.ec2'],
        detailType: ['AWS API Call via CloudTrail'],
        detail: {
          eventSource: ['ec2.amazonaws.com'],
          eventName: [
            'AuthorizeSecurityGroupIngress',
            'AuthorizeSecurityGroupEgress',
            'RevokeSecurityGroupIngress',
            'RevokeSecurityGroupEgress',
            'CreateSecurityGroup',
            'DeleteSecurityGroup',
          ],
        },
      },
    });

    sgChangeRule.addTarget(
      new targets.CloudWatchLogGroup(securityGroupLogGroup)
    );

    // 8. WAF Web ACL for CloudFront (Global)
    const webAcl = new wafv2.CfnWebACL(this, 'CloudFrontWebACL', {
      scope: 'CLOUDFRONT',
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
      ],
      visibilityConfig: {
        sampledRequestsEnabled: true,
        cloudWatchMetricsEnabled: true,
        metricName: 'webACL',
      },
    });

    // 9. MFA-enabled IAM Group
    const mfaEnabledGroup = new iam.Group(this, 'MFAEnabledGroup', {
      groupName: `MFAUsers-${environmentSuffix}`,
    });

    const mfaPolicy = new iam.PolicyDocument({
      statements: [
        new iam.PolicyStatement({
          sid: 'DenyAllExceptListedIfNoMFA',
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

    mfaEnabledGroup.attachInlinePolicy(
      new iam.Policy(this, 'MFAEnforcement', {
        document: mfaPolicy,
      })
    );

    // Tags for all resources
    cdk.Tags.of(this).add('Environment', environmentSuffix);
    cdk.Tags.of(this).add('SecurityCompliance', 'true');
    cdk.Tags.of(this).add('Project', 'SecureArchitecture');

    // Outputs
    new cdk.CfnOutput(this, 'KMSKeyId', {
      value: kmsKey.keyId,
      description: 'KMS Key ID',
    });

    new cdk.CfnOutput(this, 'CloudTrailBucketName', {
      value: cloudTrailBucket.bucketName,
      description: 'CloudTrail S3 Bucket',
    });

    new cdk.CfnOutput(this, 'ConfigBucketName', {
      value: configBucket.bucketName,
      description: 'Config S3 Bucket',
    });

    new cdk.CfnOutput(this, 'WebACLArn', {
      value: webAcl.attrArn,
      description: 'WAF Web ACL ARN',
    });

    new cdk.CfnOutput(this, 'LambdaFunctionName', {
      value: `secure-fn-${environmentSuffix}`,
      description: 'Secure Lambda Function Name',
    });
  }
}
