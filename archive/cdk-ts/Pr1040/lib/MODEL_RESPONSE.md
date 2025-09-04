## bin/tap.ts

```typescript
#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { TapStack } from '../lib/tap-stack';

const app = new cdk.App();

const primaryStack = new TapStack(app, 'TapStackPrimary', {
  env: { 
    account: process.env.CDK_DEFAULT_ACCOUNT, 
    region: 'us-west-1' 
  },
  isPrimary: true,
  crossRegionBackupBucket: 'tap-backup-us-east-1',
  notificationEmail: process.env.NOTIFICATION_EMAIL || 'admin@example.com'
});

const secondaryStack = new TapStack(app, 'TapStackSecondary', {
  env: { 
    account: process.env.CDK_DEFAULT_ACCOUNT, 
    region: 'us-east-1' 
  },
  isPrimary: false,
  crossRegionBackupBucket: 'tap-backup-us-west-1',
  notificationEmail: process.env.NOTIFICATION_EMAIL || 'admin@example.com'
});

primaryStack.addDependency(secondaryStack);
```

## lib/tap-stack.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as snsSubscriptions from 'aws-cdk-lib/aws-sns-subscriptions';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as config from 'aws-cdk-lib/aws-config';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as cloudwatchActions from 'aws-cdk-lib/aws-cloudwatch-actions';
import { Construct } from 'constructs';

interface TapStackProps extends cdk.StackProps {
  isPrimary: boolean;
  crossRegionBackupBucket: string;
  notificationEmail: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: TapStackProps) {
    super(scope, id, props);

    const region = this.region;
    const isPrimary = props.isPrimary;
    const regionSuffix = region.replace('-', '');

    // KMS Key for encryption
    const kmsKey = new kms.Key(this, 'TapKmsKey', {
      description: `TAP KMS Key for ${region}`,
      enableKeyRotation: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    kmsKey.addAlias(`alias/tap-key-${regionSuffix}`);

    // VPC
    const vpc = new ec2.Vpc(this, 'TapVpc', {
      cidr: '10.0.0.0/16',
      maxAzs: 3,
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
          name: 'Isolated',
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        },
      ],
      natGateways: 2,
    });

    // S3 Bucket for backups
    const backupBucket = new s3.Bucket(this, 'TapBackupBucket', {
      bucketName: `tap-backup-${regionSuffix}-${this.account}`,
      encryption: s3.BucketEncryption.KMS,
      encryptionKey: kmsKey,
      versioned: true,
      lifecycleRules: [
        {
          id: 'DeleteOldVersions',
          expiredObjectDeleteMarker: true,
          noncurrentVersionExpiration: cdk.Duration.days(30),
        },
      ],
      publicReadAccess: false,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Cross-region replication bucket
    if (isPrimary) {
      const replicationRole = new iam.Role(this, 'ReplicationRole', {
        assumedBy: new iam.ServicePrincipal('s3.amazonaws.com'),
        inlinePolicies: {
          ReplicationPolicy: new iam.PolicyDocument({
            statements: [
              new iam.PolicyStatement({
                effect: iam.Effect.ALLOW,
                actions: [
                  's3:GetObjectVersionForReplication',
                  's3:GetObjectVersionAcl',
                  's3:GetObjectVersionTagging',
                ],
                resources: [`${backupBucket.bucketArn}/*`],
              }),
              new iam.PolicyStatement({
                effect: iam.Effect.ALLOW,
                actions: [
                  's3:ReplicateObject',
                  's3:ReplicateDelete',
                  's3:ReplicateTags',
                ],
                resources: [`arn:aws:s3:::${props.crossRegionBackupBucket}/*`],
              }),
            ],
          }),
        },
      });

      const cfnBucket = backupBucket.node.defaultChild as s3.CfnBucket;
      cfnBucket.replicationConfiguration = {
        role: replicationRole.roleArn,
        rules: [
          {
            id: 'ReplicateToSecondaryRegion',
            status: 'Enabled',
            prefix: '',
            destination: {
              bucket: `arn:aws:s3:::${props.crossRegionBackupBucket}`,
              storageClass: 'STANDARD_IA',
            },
          },
        ],
      };
    }

    // RDS Subnet Group
    const dbSubnetGroup = new rds.SubnetGroup(this, 'TapDbSubnetGroup', {
      description: 'Subnet group for TAP RDS',
      vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
      },
    });

    // RDS Security Group
    const dbSecurityGroup = new ec2.SecurityGroup(this, 'TapDbSecurityGroup', {
      vpc,
      description: 'Security group for TAP RDS',
      allowAllOutbound: false,
    });

    dbSecurityGroup.addIngressRule(
      ec2.Peer.ipv4(vpc.vpcCidrBlock),
      ec2.Port.tcp(5432),
      'Allow PostgreSQL access from VPC'
    );

    // RDS Instance
    const database = new rds.DatabaseInstance(this, 'TapDatabase', {
      engine: rds.DatabaseInstanceEngine.postgres({
        version: rds.PostgresEngineVersion.VER_14,
      }),
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MICRO),
      vpc,
      subnetGroup: dbSubnetGroup,
      securityGroups: [dbSecurityGroup],
      databaseName: 'tapdb',
      credentials: rds.Credentials.fromGeneratedSecret('tapuser'),
      storageEncrypted: true,
      storageEncryptionKey: kmsKey,
      backupRetention: cdk.Duration.days(7),
      deletionProtection: false,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      monitoringInterval: cdk.Duration.seconds(60),
    });

    // Read Replica in opposite region (only for primary)
    if (isPrimary) {
      new rds.DatabaseInstanceReadReplica(this, 'TapDatabaseReplica', {
        sourceDatabaseInstance: database,
        instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MICRO),
        storageEncrypted: true,
        deletionProtection: false,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      });
    }

    // CloudWatch Log Group
    const logGroup = new logs.LogGroup(this, 'TapLogGroup', {
      logGroupName: `/tap/${region}/application`,
      retention: logs.RetentionDays.ONE_WEEK,
      encryptionKey: kmsKey,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Lambda Execution Role
    const lambdaRole = new iam.Role(this, 'TapLambdaRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaVPCAccessExecutionRole'),
      ],
      inlinePolicies: {
        TapLambdaPolicy: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'logs:CreateLogStream',
                'logs:PutLogEvents',
              ],
              resources: [logGroup.logGroupArn],
            }),
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                's3:GetObject',
                's3:PutObject',
              ],
              resources: [`${backupBucket.bucketArn}/*`],
            }),
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'kms:Decrypt',
                'kms:GenerateDataKey',
              ],
              resources: [kmsKey.keyArn],
            }),
          ],
        }),
      },
    });

    // Lambda Security Group
    const lambdaSecurityGroup = new ec2.SecurityGroup(this, 'TapLambdaSecurityGroup', {
      vpc,
      description: 'Security group for TAP Lambda',
      allowAllOutbound: true,
    });

    // Lambda Function
    const dataProcessor = new lambda.Function(this, 'TapDataProcessor', {
      runtime: lambda.Runtime.PYTHON_3_9,
      handler: 'index.handler',
      code: lambda.Code.fromInline(`
import json
import boto3
import logging

logger = logging.getLogger()
logger.setLevel(logging.INFO)

def handler(event, context):
    logger.info(f'Processing event: {json.dumps(event)}')
    
    try:
        # Data processing logic here
        result = {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Data processed successfully',
                'region': '${region}',
                'timestamp': context.aws_request_id
            })
        }
        logger.info('Data processing completed successfully')
        return result
    except Exception as e:
        logger.error(f'Error processing data: {str(e)}')
        raise e
      `),
      role: lambdaRole,
      vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
      securityGroups: [lambdaSecurityGroup],
      timeout: cdk.Duration.minutes(5),
      environment: {
        LOG_GROUP_NAME: logGroup.logGroupName,
        BUCKET_NAME: backupBucket.bucketName,
        REGION: region,
      },
    });

    // SNS Topic for notifications
    const alertTopic = new sns.Topic(this, 'TapAlertTopic', {
      displayName: `TAP Alerts - ${region}`,
      masterKey: kmsKey,
    });

    alertTopic.addSubscription(
      new snsSubscriptions.EmailSubscription(props.notificationEmail)
    );

    // CloudWatch Alarms
    const dbCpuAlarm = new cloudwatch.Alarm(this, 'TapDbCpuAlarm', {
      metric: database.metricCPUUtilization(),
      threshold: 80,
      evaluationPeriods: 2,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });

    dbCpuAlarm.addAlarmAction(new cloudwatchActions.SnsAction(alertTopic));

    const lambdaErrorAlarm = new cloudwatch.Alarm(this, 'TapLambdaErrorAlarm', {
      metric: dataProcessor.metricErrors(),
      threshold: 1,
      evaluationPeriods: 1,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });

    lambdaErrorAlarm.addAlarmAction(new cloudwatchActions.SnsAction(alertTopic));

    // Route 53 Health Check and DNS (only for primary)
    if (isPrimary) {
      const hostedZone = new route53.HostedZone(this, 'TapHostedZone', {
        zoneName: 'tap-app.example.com',
      });

      const primaryRecord = new route53.ARecord(this, 'TapPrimaryRecord', {
        zone: hostedZone,
        recordName: 'api',
        target: route53.RecordTarget.fromIpAddresses('1.2.3.4'), // Replace with actual IP
        ttl: cdk.Duration.seconds(60),
        setIdentifier: 'primary',
        geoLocation: route53.GeoLocation.country('US'),
      });

      const secondaryRecord = new route53.ARecord(this, 'TapSecondaryRecord', {
        zone: hostedZone,
        recordName: 'api',
        target: route53.RecordTarget.fromIpAddresses('5.6.7.8'), // Replace with actual IP
        ttl: cdk.Duration.seconds(60),
        setIdentifier: 'secondary',
        geoLocation: route53.GeoLocation.defaultLocation(),
      });
    }

    // AWS Config
    const configRole = new iam.Role(this, 'TapConfigRole', {
      assumedBy: new iam.ServicePrincipal('config.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/ConfigRole'),
      ],
    });

    const configBucket = new s3.Bucket(this, 'TapConfigBucket', {
      bucketName: `tap-config-${regionSuffix}-${this.account}`,
      encryption: s3.BucketEncryption.KMS,
      encryptionKey: kmsKey,
      publicReadAccess: false,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const configDeliveryChannel = new config.CfnDeliveryChannel(this, 'TapConfigDeliveryChannel', {
      s3BucketName: configBucket.bucketName,
    });

    const configRecorder = new config.CfnConfigurationRecorder(this, 'TapConfigRecorder', {
      roleArn: configRole.roleArn,
      recordingGroup: {
        allSupported: true,
        includeGlobalResourceTypes: isPrimary,
      },
    });

    configRecorder.addDependency(configDeliveryChannel);

    // Config Rules
    new config.ManagedRule(this, 'TapS3BucketPublicAccessProhibited', {
      identifier: config.ManagedRuleIdentifiers.S3_BUCKET_PUBLIC_ACCESS_PROHIBITED,
    });

    new config.ManagedRule(this, 'TapRdsStorageEncrypted', {
      identifier: config.ManagedRuleIdentifiers.RDS_STORAGE_ENCRYPTED,
    });

    // Tags
    const tags = {
      Environment: 'production',
      Application: 'tap',
      Region: region,
      IsPrimary: isPrimary.toString(),
    };

    Object.entries(tags).forEach(([key, value]) => {
      cdk.Tags.of(this).add(key, value);
    });

    // Outputs
    new cdk.CfnOutput(this, 'VpcId', {
      value: vpc.vpcId,
      description: 'VPC ID',
    });

    new cdk.CfnOutput(this, 'DatabaseEndpoint', {
      value: database.instanceEndpoint.hostname,
      description: 'RDS Database Endpoint',
    });

    new cdk.CfnOutput(this, 'BackupBucketName', {
      value: backupBucket.bucketName,
      description: 'S3 Backup Bucket Name',
    });

    new cdk.CfnOutput(this, 'LambdaFunctionName', {
      value: dataProcessor.functionName,
      description: 'Lambda Function Name',
    });

    new cdk.CfnOutput(this, 'SnsTopicArn', {
      value: alertTopic.topicArn,
      description: 'SNS Alert Topic ARN',
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
    "@aws-cdk/core:target": "aws-cdk-lib",
    "@aws-cdk-v2/core:enableStackNameDuplicates": true,
    "aws-cdk:enableDiffNoFail": true,
    "@aws-cdk-v2/core:bootstrapQualifier": "hnb659fds",
    "@aws-cdk-v2/core:newStyleStackSynthesis": true,
    "@aws-cdk/aws-apigateway:usagePlanKeyOrderInsensitiveId": true,
    "@aws-cdk/core:stackRelativeExports": true,
    "@aws-cdk/aws-rds:lowercaseDbIdentifier": true,
    "@aws-cdk/aws-lambda:recognizeVersionProps": true,
    "@aws-cdk/aws-cloudfront:defaultSecurityPolicyTLSv1.2_2021": true,
    "@aws-cdk/aws-secretsmanager:useAttachedSecretResourcePolicyForSecretTargetAttachments": true,
    "@aws-cdk/aws-redshift:columnId": true,
    "@aws-cdk/aws-stepfunctions-tasks:enableLogging": true,
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
    "@aws-cdk/aws-iam:standardizedServicePrincipals": true,
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
    "@aws-cdk/aws-stepfunctions-tasks:enableLogging": true,
    "@aws-cdk/aws-ec2:restrictDefaultSecurityGroup": true,
    "@aws-cdk/aws-apigateway:requestValidatorUniqueId": true,
    "@aws-cdk/aws-kms:aliasNameRef": true,
    "@aws-cdk/aws-autoscaling:generateLaunchTemplateInsteadOfLaunchConfig": true,
    "@aws-cdk/core:includePrefixInUniqueNameGeneration": true,
    "@aws-cdk/aws-opensearchservice:enableLogging": true,
    "@aws-cdk/aws-neptune:defaultAssociatedRoles": true,
    "@aws-cdk/aws-ec2:ebsDefaultGp3Volume": true,
    "@aws-cdk/aws-ecs:removeDefaultDeploymentAlarm": true
  }
}
```