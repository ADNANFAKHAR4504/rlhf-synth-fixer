# CDK TypeScript Secure Web Application Infrastructure

I'll help you create a secure web application infrastructure using AWS CDK TypeScript. This solution will implement production-grade security controls including KMS encryption, private databases, secure S3 buckets with logging, and advanced AWS security features.

## File Structure

The solution includes the following files:

### cdk.json

```json
{
  "app": "npx ts-node --prefer-ts-exts bin/tap.ts",
  "watch": {
    "include": ["**"],
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
    "@aws-cdk/core:target-partitions": ["aws", "aws-cn"],
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

### bin/tap.ts

```typescript
#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { Tags } from 'aws-cdk-lib';
import { TapStack } from '../lib/tap-stack';

const app = new cdk.App();

// Get environment suffix from context (set by CI/CD pipeline) or use 'dev' as default
const environmentSuffix = app.node.tryGetContext('environmentSuffix') || 'dev';
const stackName = `TapStack${environmentSuffix}`;

const repositoryName = process.env.REPOSITORY || 'unknown';
const commitAuthor = process.env.COMMIT_AUTHOR || 'unknown';

// Apply tags to all stacks in this app
Tags.of(app).add('Environment', 'production');
Tags.of(app).add('Repository', repositoryName);
Tags.of(app).add('Author', commitAuthor);

new TapStack(app, stackName, {
  stackName: stackName,
  environmentSuffix: environmentSuffix,
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: 'ap-northeast-1',
  },
});
```

### lib/tap-stack.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as cloudtrail from 'aws-cdk-lib/aws-cloudtrail';
import * as guardduty from 'aws-cdk-lib/aws-guardduty';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Tags } from 'aws-cdk-lib';

export interface TapStackProps extends cdk.StackProps {
  environmentSuffix: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: TapStackProps) {
    super(scope, id, props);

    // Apply production environment tag to all resources in stack
    Tags.of(this).add('environment', 'production');

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

    const kmsAlias = new kms.Alias(this, 'SecureAppKeyAlias', {
      aliasName: `alias/secure-app-${props.environmentSuffix}`,
      targetKey: kmsKey,
    });

    // Create VPC with public and private subnets
    const vpc = new ec2.Vpc(this, 'SecureAppVpc', {
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
          cidrMask: 24,
          name: 'Database',
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        },
      ],
    });

    // Create S3 bucket for access logs
    const accessLogsBucket = new s3.Bucket(this, 'AccessLogsBucket', {
      bucketName: `secure-app-access-logs-${props.environmentSuffix}-${this.account}`,
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
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // Create S3 bucket for web application assets
    const webAssetsBucket = new s3.Bucket(this, 'WebAssetsBucket', {
      bucketName: `secure-app-assets-${props.environmentSuffix}-${this.account}`,
      encryption: s3.BucketEncryption.KMS,
      encryptionKey: kmsKey,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      versioned: true,
      serverAccessLogsBucket: accessLogsBucket,
      serverAccessLogsPrefix: 'web-assets-access-logs/',
      transferAcceleration: true,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // Create CloudTrail bucket
    const cloudTrailBucket = new s3.Bucket(this, 'CloudTrailBucket', {
      bucketName: `secure-app-cloudtrail-${props.environmentSuffix}-${this.account}`,
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
      removalPolicy: cdk.RemovalPolicy.RETAIN,
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
            'AWS:SourceArn': `arn:aws:cloudtrail:ap-northeast-1:${this.account}:trail/SecureAppTrail`,
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
            'AWS:SourceArn': `arn:aws:cloudtrail:ap-northeast-1:${this.account}:trail/SecureAppTrail`,
          },
        },
      })
    );

    // Create CloudTrail with KMS encryption
    const trail = new cloudtrail.Trail(this, 'SecureAppTrail', {
      trailName: 'SecureAppTrail',
      bucket: cloudTrailBucket,
      kmsKey: kmsKey,
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
    const database = new rds.DatabaseInstance(this, 'SecureAppDatabase', {
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
      deleteAutomatedBackups: false,
      deletionProtection: true,
      multiAz: false,
      publiclyAccessible: false,
      credentials: rds.Credentials.fromGeneratedSecret('postgres', {
        encryptionKey: kmsKey,
      }),
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

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
    const guardDutyDetector = new guardduty.CfnDetector(
      this,
      'GuardDutyDetector',
      {
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
      }
    );

    // Output important resource information
    new cdk.CfnOutput(this, 'KMSKeyId', {
      value: kmsKey.keyId,
      description: 'KMS Key ID for encryption',
    });

    new cdk.CfnOutput(this, 'WebAssetsBucketName', {
      value: webAssetsBucket.bucketName,
      description: 'S3 bucket for web application assets',
    });

    new cdk.CfnOutput(this, 'DatabaseEndpoint', {
      value: database.instanceEndpoint.hostname,
      description: 'RDS database endpoint',
    });

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
  }
}
```

This solution provides:

1. **Security Features**:
   - KMS customer managed key with automatic rotation
   - All S3 buckets encrypted with KMS
   - Private RDS database with no public access
   - Proper IAM policies with least privilege
   - All resources tagged with 'environment=production'

2. **Modern AWS Features**:
   - S3 Transfer Acceleration enabled on web assets bucket
   - GuardDuty detector with S3 protection and malware scanning
   - CloudTrail with SSE-KMS encryption and file validation

3. **Infrastructure Components**:
   - Secure VPC with public, private, and isolated subnets
   - Application Load Balancer for web traffic
   - Encrypted RDS PostgreSQL database in isolated subnets
   - S3 buckets with proper logging and lifecycle policies
   - CloudTrail for comprehensive API logging

4. **Security Best Practices**:
   - Block all public access on S3 buckets
   - Database deletion protection enabled
   - Versioning enabled on critical buckets
   - Proper security groups with minimal required access
   - Comprehensive logging and monitoring setup

The infrastructure follows AWS Well-Architected Framework security pillar guidelines and implements defense-in-depth security controls.
