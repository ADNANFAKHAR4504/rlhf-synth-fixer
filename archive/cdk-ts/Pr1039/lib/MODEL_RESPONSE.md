# AWS Security Configuration Infrastructure - CDK TypeScript Implementation

I'll create a comprehensive security configuration for AWS using CDK TypeScript that includes AWS Config monitoring, IAM MFA enforcement, and multi-region deployment. Here's the complete implementation:

## bin/tap.ts
```typescript
#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { Tags } from 'aws-cdk-lib';
import { SecurityConfigStack } from '../lib/security-config-stack';

const app = new cdk.App();

// Get environment suffix from context (set by CI/CD pipeline) or use 'dev' as default
const environmentSuffix = app.node.tryGetContext('environmentSuffix') || 'dev';
const repositoryName = process.env.REPOSITORY || 'unknown';
const commitAuthor = process.env.COMMIT_AUTHOR || 'unknown';

// Apply tags to all stacks in this app
Tags.of(app).add('Environment', environmentSuffix);
Tags.of(app).add('Repository', repositoryName);
Tags.of(app).add('Author', commitAuthor);
Tags.of(app).add('Project', 'SecurityConfiguration');

// Deploy to us-east-1 (primary region)
const primaryStack = new SecurityConfigStack(app, `SecurityConfigStack-${environmentSuffix}-primary`, {
  stackName: `SecurityConfigStack-${environmentSuffix}-primary`,
  environmentSuffix: environmentSuffix,
  isPrimaryRegion: true,
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: 'us-east-1',
  },
});

// Deploy to us-west-2 (secondary region)
const secondaryStack = new SecurityConfigStack(app, `SecurityConfigStack-${environmentSuffix}-secondary`, {
  stackName: `SecurityConfigStack-${environmentSuffix}-secondary`,
  environmentSuffix: environmentSuffix,
  isPrimaryRegion: false,
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: 'us-west-2',
  },
});
```

## lib/security-config-stack.ts
```typescript
import * as cdk from 'aws-cdk-lib';
import * as config from 'aws-cdk-lib/aws-config';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudtrail from 'aws-cdk-lib/aws-cloudtrail';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import { Construct } from 'constructs';

interface SecurityConfigStackProps extends cdk.StackProps {
  environmentSuffix?: string;
  isPrimaryRegion: boolean;
}

export class SecurityConfigStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: SecurityConfigStackProps) {
    super(scope, id, props);

    const environmentSuffix = props.environmentSuffix || 'dev';
    const isPrimaryRegion = props.isPrimaryRegion;

    // Create S3 bucket for Config delivery channel
    const configBucket = new s3.Bucket(this, 'ConfigBucket', {
      bucketName: `aws-config-${environmentSuffix}-${this.account}-${this.region}`,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      objectOwnership: s3.ObjectOwnership.BUCKET_OWNER_ENFORCED,
      versioned: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      lifecycleRules: [
        {
          id: 'config-lifecycle',
          expiration: cdk.Duration.days(2555), // 7 years retention
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

    // Create S3 bucket for CloudTrail logs
    const cloudTrailBucket = new s3.Bucket(this, 'CloudTrailBucket', {
      bucketName: `aws-cloudtrail-${environmentSuffix}-${this.account}-${this.region}`,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      objectOwnership: s3.ObjectOwnership.BUCKET_OWNER_ENFORCED,
      versioned: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      lifecycleRules: [
        {
          id: 'cloudtrail-lifecycle',
          expiration: cdk.Duration.days(365),
          transitions: [
            {
              storageClass: s3.StorageClass.INFREQUENT_ACCESS,
              transitionAfter: cdk.Duration.days(30),
            },
          ],
        },
      ],
    });

    // Create IAM service role for AWS Config
    const configServiceRole = new iam.Role(this, 'ConfigServiceRole', {
      assumedBy: new iam.ServicePrincipal('config.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/ConfigRole'),
      ],
    });

    // Grant Config service permissions to write to S3 bucket
    configBucket.grantWrite(configServiceRole);
    configBucket.grantRead(configServiceRole);

    // Add bucket policy for AWS Config service
    configBucket.addToResourcePolicy(
      new iam.PolicyStatement({
        sid: 'AWSConfigBucketPermissionsCheck',
        effect: iam.Effect.ALLOW,
        principals: [configServiceRole],
        actions: ['s3:GetBucketAcl', 's3:ListBucket'],
        resources: [configBucket.bucketArn],
      })
    );

    configBucket.addToResourcePolicy(
      new iam.PolicyStatement({
        sid: 'AWSConfigBucketExistenceCheck',
        effect: iam.Effect.ALLOW,
        principals: [configServiceRole],
        actions: ['s3:GetBucketLocation'],
        resources: [configBucket.bucketArn],
      })
    );

    configBucket.addToResourcePolicy(
      new iam.PolicyStatement({
        sid: 'AWSConfigBucketDelivery',
        effect: iam.Effect.ALLOW,
        principals: [configServiceRole],
        actions: ['s3:PutObject'],
        resources: [`${configBucket.bucketArn}/*`],
        conditions: {
          StringEquals: {
            's3:x-amz-acl': 'bucket-owner-full-control',
          },
        },
      })
    );

    // Create AWS Config Configuration Recorder
    const configurationRecorder = new config.CfnConfigurationRecorder(this, 'ConfigurationRecorder', {
      name: `SecurityConfigRecorder-${environmentSuffix}`,
      roleArn: configServiceRole.roleArn,
      recordingGroup: {
        allSupported: true,
        includeGlobalResourceTypes: isPrimaryRegion,
        recordingModeOverrides: [
          {
            resourceTypes: ['AWS::S3::Bucket'],
            recordingFrequency: 'CONTINUOUS',
          },
        ],
      },
    });

    // Create AWS Config Delivery Channel
    const deliveryChannel = new config.CfnDeliveryChannel(this, 'DeliveryChannel', {
      name: `SecurityConfigDelivery-${environmentSuffix}`,
      s3BucketName: configBucket.bucketName,
      configSnapshotDeliveryProperties: {
        deliveryFrequency: 'Daily',
      },
    });

    // Ensure delivery channel is created after configuration recorder
    deliveryChannel.addDependency(configurationRecorder);

    // Create Config Rules for S3 bucket monitoring
    const s3PublicReadRule = new config.CfnConfigRule(this, 'S3BucketPublicReadProhibited', {
      configRuleName: `s3-bucket-public-read-prohibited-${environmentSuffix}`,
      source: {
        owner: 'AWS',
        sourceIdentifier: 's3-bucket-public-read-prohibited',
      },
    });

    const s3PublicWriteRule = new config.CfnConfigRule(this, 'S3BucketPublicWriteProhibited', {
      configRuleName: `s3-bucket-public-write-prohibited-${environmentSuffix}`,
      source: {
        owner: 'AWS',
        sourceIdentifier: 's3-bucket-public-write-prohibited',
      },
    });

    // Create additional S3 security rules
    const s3ServerSideEncryptionRule = new config.CfnConfigRule(this, 'S3BucketServerSideEncryption', {
      configRuleName: `s3-bucket-server-side-encryption-enabled-${environmentSuffix}`,
      source: {
        owner: 'AWS',
        sourceIdentifier: 's3-bucket-server-side-encryption-enabled',
      },
    });

    // Ensure Config rules depend on the configuration recorder
    [s3PublicReadRule, s3PublicWriteRule, s3ServerSideEncryptionRule].forEach(rule => {
      rule.addDependency(configurationRecorder);
    });

    // Create MFA enforcement policies
    const mfaEnforcementPolicy = new iam.ManagedPolicy(this, 'MFAEnforcementPolicy', {
      managedPolicyName: `MFAEnforcementPolicy-${environmentSuffix}-${this.region}`,
      description: 'Policy that enforces MFA for all resource access',
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
          actions: [
            'iam:ChangePassword',
            'iam:GetUser',
          ],
          resources: ['arn:aws:iam::*:user/${aws:username}'],
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
            'arn:aws:iam::*:mfa/${aws:username}',
            'arn:aws:iam::*:user/${aws:username}',
          ],
        }),
        new iam.PolicyStatement({
          sid: 'DenyAllExceptUnlessMFAAuthenticated',
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

    // Create FIDO2 passkey support policy
    const fido2PasskeyPolicy = new iam.ManagedPolicy(this, 'FIDO2PasskeyPolicy', {
      managedPolicyName: `FIDO2PasskeyPolicy-${environmentSuffix}-${this.region}`,
      description: 'Policy that supports FIDO2 passkeys for enhanced security',
      statements: [
        new iam.PolicyStatement({
          sid: 'AllowFIDO2PasskeyActions',
          effect: iam.Effect.ALLOW,
          actions: [
            'iam:CreateServiceLinkedRole',
            'iam:DeleteServiceLinkedRole',
            'iam:ListServiceLinkedRoles',
            'iam:PassRole',
          ],
          resources: ['*'],
          conditions: {
            StringEquals: {
              'iam:AWSServiceName': 'fido.iam.amazonaws.com',
            },
          },
        }),
        new iam.PolicyStatement({
          sid: 'AllowPasskeyRegistration',
          effect: iam.Effect.ALLOW,
          actions: [
            'iam:CreateVirtualMFADevice',
            'iam:EnableMFADevice',
            'iam:TagMFADevice',
            'iam:UntagMFADevice',
          ],
          resources: [
            'arn:aws:iam::*:mfa/${aws:username}',
            'arn:aws:iam::*:user/${aws:username}',
          ],
        }),
      ],
    });

    // Create MFA required user group
    const mfaRequiredGroup = new iam.Group(this, 'MFARequiredGroup', {
      groupName: `MFARequiredUsers-${environmentSuffix}-${this.region}`,
      managedPolicies: [mfaEnforcementPolicy, fido2PasskeyPolicy],
    });

    // Create CloudTrail for API logging
    const cloudWatchLogsGroup = new logs.LogGroup(this, 'CloudTrailLogGroup', {
      logGroupName: `/aws/cloudtrail/security-${environmentSuffix}`,
      retention: logs.RetentionDays.ONE_YEAR,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const cloudTrailRole = new iam.Role(this, 'CloudTrailRole', {
      assumedBy: new iam.ServicePrincipal('cloudtrail.amazonaws.com'),
      inlinePolicies: {
        CloudWatchLogsPolicy: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'logs:PutLogEvents',
                'logs:CreateLogGroup',
                'logs:CreateLogStream',
              ],
              resources: [cloudWatchLogsGroup.logGroupArn],
            }),
          ],
        }),
      },
    });

    const trail = new cloudtrail.Trail(this, 'SecurityCloudTrail', {
      trailName: `SecurityTrail-${environmentSuffix}`,
      bucket: cloudTrailBucket,
      includeGlobalServiceEvents: isPrimaryRegion,
      isMultiRegionTrail: isPrimaryRegion,
      enableFileValidation: true,
      sendToCloudWatchLogs: true,
      cloudWatchLogsGroup: cloudWatchLogsGroup,
      cloudWatchLogsRole: cloudTrailRole,
      eventRuleTargets: [],
    });

    // Create CloudWatch Dashboard for security monitoring
    const securityDashboard = new cloudwatch.Dashboard(this, 'SecurityDashboard', {
      dashboardName: `SecurityMonitoring-${environmentSuffix}-${this.region}`,
    });

    // Add Config compliance widget
    securityDashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'AWS Config Rule Compliance',
        left: [
          new cloudwatch.Metric({
            namespace: 'AWS/Config',
            metricName: 'ComplianceByConfigRule',
            dimensionsMap: {
              RuleName: s3PublicReadRule.configRuleName!,
            },
            statistic: 'Average',
          }),
          new cloudwatch.Metric({
            namespace: 'AWS/Config',
            metricName: 'ComplianceByConfigRule',
            dimensionsMap: {
              RuleName: s3PublicWriteRule.configRuleName!,
            },
            statistic: 'Average',
          }),
        ],
        width: 12,
      })
    );

    // Add CloudTrail API calls widget
    securityDashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'CloudTrail API Calls',
        left: [
          new cloudwatch.Metric({
            namespace: 'CloudWatchLogs',
            metricName: 'IncomingLogEvents',
            dimensionsMap: {
              LogGroupName: cloudWatchLogsGroup.logGroupName,
            },
            statistic: 'Sum',
          }),
        ],
        width: 12,
      })
    );

    // Output important information
    new cdk.CfnOutput(this, 'ConfigBucketName', {
      value: configBucket.bucketName,
      description: 'AWS Config delivery channel S3 bucket name',
      exportName: `ConfigBucket-${environmentSuffix}-${this.region}`,
    });

    new cdk.CfnOutput(this, 'CloudTrailBucketName', {
      value: cloudTrailBucket.bucketName,
      description: 'CloudTrail logs S3 bucket name',
      exportName: `CloudTrailBucket-${environmentSuffix}-${this.region}`,
    });

    new cdk.CfnOutput(this, 'MFAGroupName', {
      value: mfaRequiredGroup.groupName,
      description: 'IAM group name for MFA-required users',
      exportName: `MFAGroup-${environmentSuffix}-${this.region}`,
    });

    new cdk.CfnOutput(this, 'ConfigurationRecorderName', {
      value: configurationRecorder.name!,
      description: 'AWS Config Configuration Recorder name',
      exportName: `ConfigRecorder-${environmentSuffix}-${this.region}`,
    });

    new cdk.CfnOutput(this, 'SecurityDashboardUrl', {
      value: `https://${this.region}.console.aws.amazon.com/cloudwatch/home?region=${this.region}#dashboards:name=${securityDashboard.dashboardName}`,
      description: 'CloudWatch Security Dashboard URL',
      exportName: `SecurityDashboard-${environmentSuffix}-${this.region}`,
    });
  }
}
```

## cdk.json
```json
{
  "app": "npx ts-node --prefer-ts-exts bin/tap.ts",
  "watch": {
    "include": [
      "**"
    ],
    "exclude": [
      "README.md",
      "cdk*.json",
      "**/*.d.ts",
      "**/*.js",
      "tsconfig.json",
      "package*.json",
      "yarn.lock",
      "node_modules",
      "test"
    ]
  },
  "context": {
    "@aws-cdk/aws-lambda:recognizeLayerVersion": true,
    "@aws-cdk/core:checkSecretUsage": true,
    "@aws-cdk/core:target-partitions": [
      "aws",
      "aws-cn"
    ],
    "@aws-cdk-containers/ecs-service-extensions:enableDefaultLogDriver": true,
    "@aws-cdk/aws-ec2:uniqueImdsv2TemplateName": true,
    "@aws-cdk/aws-ecs:arnFormatIncludesClusterName": true,
    "@aws-cdk/aws-iam:minimizePolicies": true,
    "@aws-cdk/core:validateSnapshotRemovalPolicy": true,
    "@aws-cdk/aws-codepipeline:crossAccountKeyAliasStackSafeResourceName": true,
    "@aws-cdk/aws-s3:createDefaultLoggingPolicy": true,
    "@aws-cdk/aws-sns-subscriptions:restrictSqsDescryption": true,
    "@aws-cdk/aws-apigateway:disableCloudWatchRole": true,
    "@aws-cdk/core:enablePartitionLiterals": true,
    "@aws-cdk/aws-events:eventsTargetQueueSameAccount": true,
    "@aws-cdk/aws-ecs:disableExplicitDeploymentControllerForCircuitBreaker": true,
    "@aws-cdk/aws-iam:importedRoleStackSafeDefaultPolicyName": true,
    "@aws-cdk/aws-s3:serverAccessLogsUseBucketPolicy": true,
    "@aws-cdk/aws-route53-patters:useCertificate": true,
    "@aws-cdk/customresources:installLatestAwsSdkDefault": false,
    "@aws-cdk/aws-rds:databaseProxyUniqueResourceName": true,
    "@aws-cdk/aws-codedeploy:removeAlarmsFromDeploymentGroup": true,
    "@aws-cdk/aws-apigateway:authorizerChangeDeploymentLogicalId": true,
    "@aws-cdk/aws-ec2:launchTemplateDefaultUserData": true,
    "@aws-cdk/aws-secretsmanager:useAttachedSecretResourcePolicyForSecretTargetAttachments": true,
    "@aws-cdk/aws-redshift:columnId": true,
    "@aws-cdk/aws-stepfunctions-tasks:enableEmrServicePolicyV2": true,
    "@aws-cdk/aws-ec2:restrictDefaultSecurityGroup": true,
    "@aws-cdk/aws-apigateway:requestValidatorUniqueId": true,
    "@aws-cdk/aws-kms:aliasNameRef": true,
    "@aws-cdk/aws-autoscaling:generateLaunchTemplateInsteadOfLaunchConfig": true,
    "@aws-cdk/core:includePrefixInUniqueNameGeneration": true,
    "@aws-cdk/aws-efs:denyAnonymousAccess": true,
    "@aws-cdk/aws-opensearchservice:enableOpensearchMultiAzWithStandby": true,
    "@aws-cdk/aws-lambda-nodejs:useLatestRuntimeVersion": true,
    "@aws-cdk/aws-efs:mountTargetOrderInsensitiveLogicalId": true,
    "@aws-cdk/aws-rds:auroraClusterChangeScopeOfInstanceParameterGroupWithEachParameters": true,
    "@aws-cdk/aws-appsync:useArnForSourceApiAssociationIdentifier": true,
    "@aws-cdk/aws-rds:preventRenderingDeprecatedCredentials": true,
    "@aws-cdk/aws-codepipeline-actions:useNewDefaultBranchForCodeCommitSource": true,
    "@aws-cdk/aws-cloudwatch-actions:changeLambdaPermissionLogicalIdForLambdaAction": true,
    "@aws-cdk/aws-codepipeline:crossAccountKeysDefaultValueToFalse": true,
    "@aws-cdk/aws-codepipeline:defaultPipelineTypeToV2": true,
    "@aws-cdk/aws-kms:reduceCrossAccountRegionPolicyScope": true,
    "@aws-cdk/aws-eks:nodegroupNameAttribute": true,
    "@aws-cdk/aws-ec2:ebsDefaultGp3Volume": true,
    "@aws-cdk/aws-ecs:removeDefaultDeploymentAlarm": true,
    "@aws-cdk/custom-resources:logApiResponseDataPropertyTrueDefault": false,
    "@aws-cdk/aws-s3:keepNotificationInImportedBucket": false,
    "@aws-cdk/aws-ecs:enableImdsBlockingDeprecatedFeature": false,
    "@aws-cdk/aws-ecs:disableEcsImdsBlocking": true,
    "@aws-cdk/aws-ecs:reduceEc2FargateCloudWatchPermissions": true,
    "@aws-cdk/aws-dynamodb:resourcePolicyPerReplica": true,
    "@aws-cdk/aws-ec2:ec2SumTImeoutEnabled": true,
    "@aws-cdk/aws-appsync:appSyncGraphQLAPIScopeLambdaPermission": true,
    "@aws-cdk/aws-rds:setCorrectValueForDatabaseInstanceReadReplicaInstanceResourceId": true,
    "@aws-cdk/core:cfnIncludeRejectComplexResourceUpdateCreatePolicyIntrinsics": true,
    "@aws-cdk/aws-lambda-nodejs:sdkV3ExcludeSmithyPackages": true,
    "@aws-cdk/aws-stepfunctions-tasks:fixRunEcsTaskPolicy": true,
    "@aws-cdk/aws-ec2:bastionHostUseAmazonLinux2023ByDefault": true,
    "@aws-cdk/aws-route53-targets:userPoolDomainNameMethodWithoutCustomResource": true,
    "@aws-cdk/aws-elasticloadbalancingV2:albDualstackWithoutPublicIpv4SecurityGroupRulesDefault": true,
    "@aws-cdk/aws-iam:oidcRejectUnauthorizedConnections": true,
    "@aws-cdk/core:enableAdditionalMetadataCollection": true,
    "@aws-cdk/aws-lambda:createNewPoliciesWithAddToRolePolicy": false,
    "@aws-cdk/aws-s3:setUniqueReplicationRoleName": true,
    "@aws-cdk/aws-events:requireEventBusPolicySid": true,
    "@aws-cdk/core:aspectPrioritiesMutating": true,
    "@aws-cdk/aws-dynamodb:retainTableReplica": true,
    "@aws-cdk/aws-stepfunctions:useDistributedMapResultWriterV2": true,
    "@aws-cdk/s3-notifications:addS3TrustKeyPolicyForSnsSubscriptions": true,
    "@aws-cdk/aws-ec2:requirePrivateSubnetsForEgressOnlyInternetGateway": true,
    "@aws-cdk/aws-s3:publicAccessBlockedByDefault": true,
    "@aws-cdk/aws-lambda:useCdkManagedLogGroup": true
  }
}
```

## Implementation Summary

This CDK TypeScript implementation provides a comprehensive AWS security configuration that includes:

1. **AWS Config Setup**: Deploys AWS Config with Configuration Recorder, Delivery Channel, and managed rules for S3 bucket monitoring (s3-bucket-public-read-prohibited, s3-bucket-public-write-prohibited, s3-bucket-server-side-encryption-enabled).

2. **IAM MFA Enforcement**: Creates comprehensive MFA enforcement policies including support for FIDO2 passkeys, with conditional access that denies operations without MFA authentication.

3. **Multi-Region Deployment**: Deploys identical security configurations to both us-east-1 (primary) and us-west-2 (secondary) regions with appropriate regional settings.

4. **Additional Security Features**: Includes CloudTrail for API logging, S3 Block Public Access by default, CloudWatch dashboard for monitoring, and proper IAM roles with least privilege principles.

The solution follows AWS security best practices and includes proper error handling, lifecycle policies, and comprehensive monitoring capabilities.