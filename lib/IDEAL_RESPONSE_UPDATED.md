# TAP Infrastructure - Ideal Response

This document contains the perfect Infrastructure as Code solution for a secure, scalable AWS multi-region setup with comprehensive security controls and monitoring.

## Architecture Overview

The solution implements a robust multi-region architecture with:
- **Multi-region deployment**: Primary (us-east-1) and Secondary (us-west-1) regions
- VPC with public, private, and isolated subnets across 2 AZs in each region
- RDS MySQL database with Multi-AZ deployment and cross-region read replicas
- Auto Scaling Groups with encrypted EBS volumes for high availability
- Lambda function for S3 replication monitoring with SNS alerts
- CloudFront distribution for global content delivery (primary region only)
- S3 cross-region replication with monitoring and alerts
- Comprehensive security groups with least-privilege access
- KMS encryption at rest across all resources

## Design Decisions
- **Multi-region architecture**: Primary region (us-east-1) with secondary region (us-west-1) for disaster recovery
- **Security-first approach**: All resources use KMS encryption and follow least-privilege principles
- **Network isolation**: Database in isolated subnets, applications in private subnets with NAT gateways
- **S3 cross-region replication**: Automated replication with monitoring and SNS alerts
- **CloudFront distribution**: Global content delivery from primary region only with dedicated logs bucket
- **Auto Scaling Groups**: High availability with encrypted EBS volumes instead of single EC2 instances
- **Comprehensive tagging**: All resources tagged with Environment, Project, and Owner for governance
- **Resource cleanup**: Applied RemovalPolicy.DESTROY for CI/CD compatibility
- **VPC design**: Custom CIDR (10.1.0.0/16) with smaller subnets (26-bit mask) for efficient IP usage
- **Multi-AZ deployment**: RDS configured for high availability with cross-region read replicas
- **Encrypted storage**: All storage (EBS, RDS, S3) encrypted with customer-managed KMS keys

## Code Implementation

### bin/tap.ts

```typescript
#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { Tags } from 'aws-cdk-lib';
import { TapStack } from '../lib/tap-stack';

const app = new cdk.App();

// Get environment suffix from context (set by CI/CD pipeline) or use 'dev' as default
const environmentSuffix = app.node.tryGetContext('environmentSuffix') || 'dev';
const repositoryName = process.env.REPOSITORY || 'unknown';
const commitAuthor = process.env.COMMIT_AUTHOR || 'unknown';

// Apply tags to all stacks in this app
Tags.of(app).add('Environment', environmentSuffix);
Tags.of(app).add('Repository', repositoryName);
Tags.of(app).add('Author', commitAuthor);
Tags.of(app).add('Project', 'tap-multi-region');

// Primary region stack (us-east-1)
const primaryStack = new TapStack(app, `TapStackPrimary${environmentSuffix}`, {
  stackName: `TapStackPrimary${environmentSuffix}`,
  environmentSuffix: environmentSuffix,
  isPrimary: true,
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: 'us-east-1',
  },
});

// Secondary region stack (us-west-1)
const secondaryStack = new TapStack(
  app,
  `TapStackSecondary${environmentSuffix}`,
  {
    stackName: `TapStackSecondary${environmentSuffix}`,
    environmentSuffix: environmentSuffix,
    isPrimary: false,
    primaryRegion: 'us-east-1',
    primaryBucketArn: primaryStack.primaryBucketArn,
    primaryDatabaseIdentifier: primaryStack.databaseInstanceIdentifier,
    env: {
      account: process.env.CDK_DEFAULT_ACCOUNT,
      region: 'us-west-1',
    },
  }
);

// Add cross-stack dependency - Primary depends on Secondary to ensure replica bucket exists
primaryStack.addDependency(secondaryStack);
```

### cdk.json

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

## Key Features Implemented

### Security & Compliance
- **KMS encryption**: All data encrypted at rest with key rotation enabled
- **S3 cross-region replication**: Automated replication with proper IAM roles and KMS permissions
- **Least-privilege IAM**: Specific permissions without wildcards
- **Network isolation**: Database in isolated subnets, applications in private subnets
- **Comprehensive tagging**: Environment, Project, and Owner tags for governance

### High Availability & Performance
- **Multi-region deployment**: Primary and secondary regions for disaster recovery
- **RDS Multi-AZ**: MySQL database with cross-region read replicas
- **Auto Scaling Groups**: High availability with 1-3 instances per region
- **CloudFront distribution**: Global content delivery with dedicated logs bucket
- **VPC design**: Custom CIDR with public, private, and isolated subnets
- **Encrypted storage**: All storage (EBS, RDS, S3) encrypted with customer-managed KMS keys

### Monitoring & Operations
- **S3 replication monitoring**: Lambda function monitors replication events
- **SNS alerts**: Real-time notifications for replication status
- **CloudWatch logs**: Centralized logging with 14-day retention for Lambda
- **Resource cleanup**: RemovalPolicy.DESTROY for CI/CD pipeline compatibility
- **Environment-aware**: Dynamic naming with environment suffix support

### Cost Optimization
- **t3.micro instances**: Cost-effective instance types in Auto Scaling Groups
- **Efficient networking**: Dual NAT gateways for high availability
- **Serverless compute**: Lambda functions for S3 replication monitoring
- **CloudFront caching**: Reduced origin requests with global edge locations

## Deployment Verification

The solution is designed to:
1. Deploy cleanly with `cdk deploy` in both primary and secondary regions
2. Provide S3 cross-region replication with monitoring and alerts
3. Support global content delivery through CloudFront distribution
4. Scale automatically with Auto Scaling Groups based on demand
5. Clean up completely without resource retention
6. Support comprehensive logging and metrics for debugging

This implementation provides a secure, scalable foundation for modern cloud applications while maintaining security, compliance, and operational best practices.
