import * as cdk from 'aws-cdk-lib';
import {
  aws_cloudwatch as cloudwatch,
  aws_iam as iam,
  aws_lambda as lambda,
  aws_logs as logs,
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
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    // Expose this region's bucket name via SSM Parameter Store
    const localBucketParamPath = `/corp/tap/${normalizedEnv}/${currentRegion}/bucket-name`;
    const localBucketParam = new ssm.StringParameter(
      this,
      'Corp-LocalBucketNameParam',
      {
        parameterName: localBucketParamPath,
        stringValue: dataBucket.bucketName,
        description: 'Bucket name for this region used by cross-region sync',
      }
    );
    localBucketParam.applyRemovalPolicy(cdk.RemovalPolicy.DESTROY);

    // Lambda function to synchronize objects to peer-region bucket
    const peerBucketParamPath = `/corp/tap/${normalizedEnv}/${peerRegion}/bucket-name`;
    // Explicit Log Group so we can control retention and removal policy
    const syncLogGroup = new logs.LogGroup(this, 'Corp-S3SyncLogGroup', {
      logGroupName: `/aws/lambda/Corp-S3Sync-${currentRegion}-${normalizedEnv}`,
      retention: logs.RetentionDays.ONE_WEEK,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const syncFunction = new lambda.Function(this, 'Corp-S3SyncFunction', {
      functionName: `Corp-S3Sync-${currentRegion}-${normalizedEnv}`,
      description: 'Copies newly created S3 objects to the peer region bucket',
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      timeout: cdk.Duration.minutes(5),
      logGroup: syncLogGroup,
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
    // Read from local bucket
    dataBucket.grantRead(syncFunction);
    // Write to peer bucket (deterministic name) and list for existence checks
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
    // LogGroup removal is handled by explicit LogGroup above
    // Allow reading the peer bucket name from SSM in the peer region
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
        dashboardName: `Corp-Replication-${normalizedEnv}-${currentRegion}-${accountId}`,
      }
    );
    dashboard.applyRemovalPolicy(cdk.RemovalPolicy.DESTROY);

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
    // CloudFormation Outputs for discovery and integration
    // Bucket name
    // eslint-disable-next-line no-new
    new cdk.CfnOutput(this, 'CorpBucketName', {
      value: dataBucket.bucketName,
      exportName: `Corp-BucketName-${normalizedEnv}-${currentRegion}`,
    });

    // Lambda function identifiers
    // eslint-disable-next-line no-new
    new cdk.CfnOutput(this, 'CorpSyncFunctionName', {
      value: syncFunction.functionName,
      exportName: `Corp-SyncFunctionName-${normalizedEnv}-${currentRegion}`,
    });
    // eslint-disable-next-line no-new
    new cdk.CfnOutput(this, 'CorpSyncFunctionArn', {
      value: syncFunction.functionArn,
      exportName: `Corp-SyncFunctionArn-${normalizedEnv}-${currentRegion}`,
    });

    // SSM parameter name for this region's bucket
    // eslint-disable-next-line no-new
    new cdk.CfnOutput(this, 'CorpLocalBucketParamName', {
      value: localBucketParam.parameterName,
      exportName: `Corp-LocalBucketParam-${normalizedEnv}-${currentRegion}`,
    });

    // Dashboard details
    // eslint-disable-next-line no-new
    new cdk.CfnOutput(this, 'CorpDashboardName', {
      value: dashboard.dashboardName,
      exportName: `Corp-DashboardName-${normalizedEnv}-${currentRegion}`,
    });
    // eslint-disable-next-line no-new
    new cdk.CfnOutput(this, 'CorpDashboardUrl', {
      value: `https://${currentRegion}.console.aws.amazon.com/cloudwatch/home?region=${currentRegion}#dashboards:name=${dashboard.dashboardName}`,
      exportName: `Corp-DashboardUrl-${normalizedEnv}-${currentRegion}`,
    });

    // Peer region reference
    // eslint-disable-next-line no-new
    new cdk.CfnOutput(this, 'CorpPeerRegion', {
      value: peerRegion,
      exportName: `Corp-PeerRegion-${normalizedEnv}-${currentRegion}`,
    });
  }
}
