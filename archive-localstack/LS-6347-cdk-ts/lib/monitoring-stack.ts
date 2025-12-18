import * as cdk from 'aws-cdk-lib';
import * as synthetics from 'aws-cdk-lib/aws-synthetics';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as actions from 'aws-cdk-lib/aws-cloudwatch-actions';
import { Construct } from 'constructs';

export interface MonitoringStackProps {
  environmentSuffix: string;
  region: string;
  endpointUrl: string;
}

export class MonitoringStack extends Construct {
  public readonly canary: synthetics.Canary;

  constructor(scope: Construct, id: string, props: MonitoringStackProps) {
    super(scope, id);

    const { environmentSuffix, region, endpointUrl } = props;

    // S3 Bucket for canary artifacts
    const artifactsBucket = new s3.Bucket(this, 'CanaryArtifactsBucket', {
      bucketName: `tapstack${environmentSuffix.toLowerCase()}canary${region.replace(/-/g, '')}`,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      lifecycleRules: [
        {
          id: 'DeleteOldArtifacts',
          expiration: cdk.Duration.days(30),
        },
      ],
    });

    // IAM Role for Canary
    const canaryRole = new iam.Role(this, 'CanaryRole', {
      roleName: `TapStack${environmentSuffix}CanaryRole${region}`,
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'CloudWatchSyntheticsFullAccess'
        ),
      ],
    });

    artifactsBucket.grantWrite(canaryRole);

    canaryRole.addToPolicy(
      new iam.PolicyStatement({
        actions: [
          'logs:CreateLogGroup',
          'logs:CreateLogStream',
          'logs:PutLogEvents',
        ],
        resources: ['*'],
      })
    );

    // CloudWatch Synthetics Canary - USING CORRECT RUNTIME v7.0
    this.canary = new synthetics.Canary(this, 'EndpointCanary', {
      canaryName: `tapstack${environmentSuffix.toLowerCase()}canary${region.replace(/-/g, '')}`,
      runtime: synthetics.Runtime.SYNTHETICS_NODEJS_PUPPETEER_7_0,
      test: synthetics.Test.custom({
        code: synthetics.Code.fromInline(`
const synthetics = require('Synthetics');
const log = require('SyntheticsLogger');

const apiCanaryBlueprint = async function () {
    const url = '${endpointUrl}';

    const requestOptionsStep1 = {
        hostname: new URL(url).hostname,
        method: 'GET',
        path: '/',
        port: 80,
        protocol: 'http:'
    };

    let stepConfig = {
        includeRequestHeaders: true,
        includeResponseHeaders: true,
        includeRequestBody: true,
        includeResponseBody: true,
        continueOnStepFailure: false
    };

    await synthetics.executeHttpStep('Verify endpoint', requestOptionsStep1, null, stepConfig);
};

exports.handler = async () => {
    return await apiCanaryBlueprint();
};
        `),
        handler: 'index.handler',
      }),
      schedule: synthetics.Schedule.rate(cdk.Duration.minutes(5)),
      artifactsBucketLocation: {
        bucket: artifactsBucket,
      },
      role: canaryRole,
      environmentVariables: {
        REGION: region,
        ENVIRONMENT_SUFFIX: environmentSuffix,
      },
      successRetentionPeriod: cdk.Duration.days(7),
      failureRetentionPeriod: cdk.Duration.days(14),
    });

    // SNS Topic for canary alarms
    const alarmTopic = new sns.Topic(this, 'CanaryAlarmTopic', {
      topicName: `TapStack${environmentSuffix}CanaryAlarms${region}`,
      displayName: 'Canary Monitoring Alarms',
    });

    // Canary failure alarm
    const canaryAlarm = new cloudwatch.Alarm(this, 'CanaryFailureAlarm', {
      alarmName: `TapStack${environmentSuffix}CanaryFailure${region}`,
      metric: this.canary.metricSuccessPercent(),
      threshold: 90,
      evaluationPeriods: 2,
      datapointsToAlarm: 2,
      comparisonOperator: cloudwatch.ComparisonOperator.LESS_THAN_THRESHOLD,
      treatMissingData: cloudwatch.TreatMissingData.BREACHING,
    });

    canaryAlarm.addAlarmAction(new actions.SnsAction(alarmTopic));

    // Duration alarm
    const durationAlarm = new cloudwatch.Alarm(this, 'CanaryDurationAlarm', {
      alarmName: `TapStack${environmentSuffix}CanaryHighDuration${region}`,
      metric: this.canary.metricDuration(),
      threshold: 10000, // 10 seconds
      evaluationPeriods: 3,
      datapointsToAlarm: 2,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });

    durationAlarm.addAlarmAction(new actions.SnsAction(alarmTopic));

    // Outputs
    new cdk.CfnOutput(this, 'CanaryName', {
      value: this.canary.canaryName,
      description: 'CloudWatch Synthetics Canary Name',
    });

    new cdk.CfnOutput(this, 'CanaryId', {
      value: this.canary.canaryId,
      description: 'CloudWatch Synthetics Canary ID',
    });

    new cdk.CfnOutput(this, 'ArtifactsBucketName', {
      value: artifactsBucket.bucketName,
      description: 'Canary Artifacts Bucket Name',
    });
  }
}
