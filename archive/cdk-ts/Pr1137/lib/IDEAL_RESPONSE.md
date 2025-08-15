## bin/tap.ts

```typescript
#!/usr/bin/env node
/// <reference types="node" />
import * as cdk from 'aws-cdk-lib';
import { Tags } from 'aws-cdk-lib';
import { TapStack } from '../lib/tap-stack';

const app = new cdk.App();

// Get environment suffix from context (set by CI/CD pipeline) or use 'dev' as default
const environmentSuffix = app.node.tryGetContext('environmentSuffix') || 'dev';
const stackBaseName = `TapStack${environmentSuffix}`;

// Multi-region configuration (defaults align with requirements)
const primaryRegion: string =
  app.node.tryGetContext('primaryRegion') || 'us-east-1';
const backupRegion: string =
  app.node.tryGetContext('backupRegion') || 'us-west-2';

const repositoryName = process.env.REPOSITORY || 'unknown';
const commitAuthor = process.env.COMMIT_AUTHOR || 'unknown';

// Apply tags to all stacks in this app (optional - you can do this at stack level instead)
Tags.of(app).add('Environment', environmentSuffix);
Tags.of(app).add('Repository', repositoryName);
Tags.of(app).add('Author', commitAuthor);

// Primary region stack
new TapStack(app, `${stackBaseName}-${primaryRegion}`, {
  stackName: `${stackBaseName}-${primaryRegion}`,
  environmentSuffix: environmentSuffix,
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: primaryRegion,
  },
});

// Backup region stack
new TapStack(app, `${stackBaseName}-${backupRegion}`, {
  stackName: `${stackBaseName}-${backupRegion}`,
  environmentSuffix: environmentSuffix,
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: backupRegion,
  },
});
```

## lib/tap-stack.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import {
  aws_cloudwatch as cloudwatch,
  aws_iam as iam,
  aws_lambda as lambda,
  aws_s3 as s3,
  aws_s3_notifications as s3n,
  aws_ssm as ssm,
} from 'aws-cdk-lib';
import { Construct } from 'constructs';

interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, props);

    const environmentSuffix: string =
      props?.environmentSuffix ||
      this.node.tryGetContext('environmentSuffix') ||
      'dev';

    const accountId = cdk.Stack.of(this).account;
    const currentRegion = cdk.Stack.of(this).region;
    const primaryRegion: string =
      this.node.tryGetContext('primaryRegion') || 'us-east-1';
    const backupRegion: string =
      this.node.tryGetContext('backupRegion') || 'us-west-2';
    const peerRegion =
      currentRegion === primaryRegion ? backupRegion : primaryRegion;

    // Resource naming following Corp-<resource> (S3 bucket names must be lowercase and DNS-compliant)
    const normalizedEnv = environmentSuffix.toLowerCase();
    const bucketNameCurrent =
      `corp-data-${normalizedEnv}-${currentRegion}-${accountId}`.toLowerCase();
    const bucketNamePeer =
      `corp-data-${normalizedEnv}-${peerRegion}-${accountId}`.toLowerCase();

    // S3 bucket (versioned, encrypted, SSL-only, public access blocked)
    const dataBucket = new s3.Bucket(this, 'Corp-DataBucket', {
      bucketName: bucketNameCurrent,
      versioned: true,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      enforceSSL: true,
      objectOwnership: s3.ObjectOwnership.BUCKET_OWNER_ENFORCED,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      autoDeleteObjects: false,
    });

    // Expose this region's bucket name via SSM Parameter Store
    const localBucketParamPath = `/corp/tap/${normalizedEnv}/${currentRegion}/bucket-name`;
    // eslint-disable-next-line no-new
    new ssm.StringParameter(this, 'Corp-LocalBucketNameParam', {
      parameterName: localBucketParamPath,
      stringValue: dataBucket.bucketName,
      description: 'Bucket name for this region used by cross-region sync',
    });

    // Lambda function to synchronize objects to peer-region bucket
    const peerBucketParamPath = `/corp/tap/${normalizedEnv}/${peerRegion}/bucket-name`;
    const syncFunction = new lambda.Function(this, 'Corp-S3SyncFunction', {
      functionName: `Corp-S3Sync-${currentRegion}-${normalizedEnv}`,
      description: 'Copies newly created S3 objects to the peer region bucket',
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      timeout: cdk.Duration.minutes(5),
      environment: {
        DEST_PARAM_PATH: peerBucketParamPath,
        DEST_REGION: peerRegion,
      },
      code: lambda.Code.fromInline(
        `'use strict';\n` +
          `const AWS = require('aws-sdk');\n` +
          `const ssm = new AWS.SSM();\n` +
          `const s3 = new AWS.S3({ signatureVersion: 'v4' });\n` +
          `exports.handler = async (event) => {\n` +
          `  const destRegion = process.env.DEST_REGION;\n` +
          `  const paramName = process.env.DEST_PARAM_PATH;\n` +
          `  if (!destRegion || !paramName) { throw new Error('Missing DEST_REGION or DEST_PARAM_PATH'); }\n` +
          `  const param = await ssm.getParameter({ Name: paramName, WithDecryption: false }).promise();\n` +
          `  const destBucket = param.Parameter && param.Parameter.Value;\n` +
          `  if (!destBucket) { throw new Error('Destination bucket parameter not found'); }\n` +
          `  const results = await Promise.all(event.Records.map(async (record) => {\n` +
          `    if (!record || !record.s3 || !record.s3.object) return;\n` +
          `    const srcBucket = record.s3.bucket.name;\n` +
          `    const key = decodeURIComponent((record.s3.object.key || '').replace(/\\+/g, ' '));\n` +
          `    if (!key) return;\n` +
          `    const copySource = encodeURI(\`${'${'}srcBucket${'}'}\/${'${'}key${'}'}\`);\n` +
          `    await s3.copyObject({\n` +
          `      CopySource: copySource,\n` +
          `      Bucket: destBucket,\n` +
          `      Key: key,\n` +
          `      ACL: 'bucket-owner-full-control',\n` +
          `      MetadataDirective: 'COPY'\n` +
          `    }).promise();\n` +
          `  }));\n` +
          `  return { statusCode: 200, copied: results ? results.length : 0 };\n` +
          `};\n`
      ),
    });

    // Least-privilege IAM for the sync function
    dataBucket.grantRead(syncFunction);
    syncFunction.addToRolePolicy(
      new iam.PolicyStatement({
        sid: 'AllowWriteToPeerBucket',
        actions: [
          's3:PutObject',
          's3:AbortMultipartUpload',
          's3:ListBucket',
          's3:ListBucketMultipartUploads',
        ],
        resources: [
          `arn:${cdk.Aws.PARTITION}:s3:::${bucketNamePeer}`,
          `arn:${cdk.Aws.PARTITION}:s3:::${bucketNamePeer}/*`,
        ],
      })
    );
    syncFunction.addToRolePolicy(
      new iam.PolicyStatement({
        sid: 'AllowReadPeerBucketParam',
        actions: ['ssm:GetParameter'],
        resources: [
          `arn:${cdk.Aws.PARTITION}:ssm:${peerRegion}:${cdk.Aws.ACCOUNT_ID}:parameter${peerBucketParamPath}`,
        ],
      })
    );

    // Trigger: replicate only newly created objects
    dataBucket.addEventNotification(
      s3.EventType.OBJECT_CREATED_PUT,
      new s3n.LambdaDestination(syncFunction)
    );
    dataBucket.addEventNotification(
      s3.EventType.OBJECT_CREATED_COMPLETE_MULTIPART_UPLOAD,
      new s3n.LambdaDestination(syncFunction)
    );

    // CloudWatch Dashboard for visibility across both regions
    const dashboard = new cloudwatch.Dashboard(
      this,
      'Corp-ReplicationDashboard',
      {
        dashboardName: `Corp-Replication-${normalizedEnv}-${accountId}`,
      }
    );

    // Lambda operational metrics
    const invocations = syncFunction.metricInvocations();
    const errors = syncFunction.metricErrors();
    const duration = syncFunction.metricDuration();

    // S3 metrics for current and peer buckets
    const objectsCurrent = new cloudwatch.Metric({
      namespace: 'AWS/S3',
      metricName: 'NumberOfObjects',
      dimensionsMap: {
        BucketName: bucketNameCurrent,
        StorageType: 'AllStorageTypes',
      },
      statistic: 'Average',
      region: currentRegion,
    });
    const objectsPeer = new cloudwatch.Metric({
      namespace: 'AWS/S3',
      metricName: 'NumberOfObjects',
      dimensionsMap: {
        BucketName: bucketNamePeer,
        StorageType: 'AllStorageTypes',
      },
      statistic: 'Average',
      region: peerRegion,
    });
    const sizeCurrent = new cloudwatch.Metric({
      namespace: 'AWS/S3',
      metricName: 'BucketSizeBytes',
      dimensionsMap: {
        BucketName: bucketNameCurrent,
        StorageType: 'StandardStorage',
      },
      statistic: 'Average',
      region: currentRegion,
    });
    const sizePeer = new cloudwatch.Metric({
      namespace: 'AWS/S3',
      metricName: 'BucketSizeBytes',
      dimensionsMap: {
        BucketName: bucketNamePeer,
        StorageType: 'StandardStorage',
      },
      statistic: 'Average',
      region: peerRegion,
    });

    dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'Corp-Lambda S3 Sync - Invocations/Errors',
        left: [invocations],
        right: [errors],
        width: 12,
      }),
      new cloudwatch.GraphWidget({
        title: 'Corp-Lambda S3 Sync - Duration (p95)',
        left: [duration.with({ statistic: 'p95' })],
        width: 12,
      })
    );
    dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: `Corp-S3 NumberOfObjects (${currentRegion} vs ${peerRegion})`,
        left: [objectsCurrent, objectsPeer],
        width: 12,
      }),
      new cloudwatch.GraphWidget({
        title: `Corp-S3 BucketSizeBytes (${currentRegion} vs ${peerRegion})`,
        left: [sizeCurrent, sizePeer],
        width: 12,
      })
    );
  }
}
```

## cdk.json

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
    "@aws-cdk/aws-lambda:useCdkManagedLogGroup": true,
    "@aws-cdk/aws-s3:publicAccessBlockedByDefault": true
  }
}
```

Insert here the ideal response
