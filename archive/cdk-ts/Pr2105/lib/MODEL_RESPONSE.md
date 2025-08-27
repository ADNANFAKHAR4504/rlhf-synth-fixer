**bin/tap.ts**
```typescript
#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { TapStack } from '../lib/tap-stack';

const app = new cdk.App();

const primaryRegion = 'us-east-1';
const secondaryRegion = 'eu-west-1';

const primaryStack = new TapStack(app, 'TapStack-Primary', {
  env: { region: primaryRegion },
  isPrimary: true,
  replicationRegion: secondaryRegion,
});

const secondaryStack = new TapStack(app, 'TapStack-Secondary', {
  env: { region: secondaryRegion },
  isPrimary: false,
  replicationRegion: primaryRegion,
});

secondaryStack.addDependency(primaryStack);
```

**lib/tap-stack.ts**
```typescript
import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as autoscaling from 'aws-cdk-lib/aws-autoscaling';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as s3n from 'aws-cdk-lib/aws-s3-notifications';
import { Construct } from 'constructs';

interface TapStackProps extends cdk.StackProps {
  isPrimary: boolean;
  replicationRegion: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: TapStackProps) {
    super(scope, id, props);

    const standardTags = {
      Project: 'TAP',
      Environment: props.isPrimary ? 'primary' : 'secondary',
      CostCenter: 'engineering',
      Owner: 'platform-team'
    };

    // KMS Key for encryption
    const kmsKey = new kms.Key(this, 'TapKey', {
      description: 'TAP encryption key',
      enableKeyRotation: true,
    });
    cdk.Tags.of(kmsKey).add('Name', `tap-key-${this.region}`);
    Object.entries(standardTags).forEach(([key, value]) => {
      cdk.Tags.of(kmsKey).add(key, value);
    });

    // VPC
    const vpc = new ec2.Vpc(this, 'TapVpc', {
      maxAzs: 2,
      natGateways: 1,
    });
    Object.entries(standardTags).forEach(([key, value]) => {
      cdk.Tags.of(vpc).add(key, value);
    });

    // S3 Bucket
    const bucket = new s3.Bucket(this, 'TapBucket', {
      bucketName: `tap-data-${this.account}-${this.region}`,
      versioned: true,
      encryptionKey: kmsKey,
      encryption: s3.BucketEncryption.KMS,
      enforceSSL: true,
      publicReadAccess: false,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
    });
    Object.entries(standardTags).forEach(([key, value]) => {
      cdk.Tags.of(bucket).add(key, value);
    });

    // S3 Replication Role
    const replicationRole = new iam.Role(this, 'S3ReplicationRole', {
      assumedBy: new iam.ServicePrincipal('s3.amazonaws.com'),
      inlinePolicies: {
        ReplicationPolicy: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                's3:GetObjectVersionForReplication',
                's3:GetObjectVersionAcl',
                's3:GetObjectVersionTagging'
              ],
              resources: [`${bucket.bucketArn}/*`]
            }),
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                's3:ReplicateObject',
                's3:ReplicateDelete',
                's3:ReplicateTags'
              ],
              resources: [`arn:aws:s3:::tap-data-${this.account}-${props.replicationRegion}/*`]
            }),
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: ['kms:Decrypt'],
              resources: [kmsKey.keyArn]
            }),
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: ['kms:GenerateDataKey'],
              resources: [`arn:aws:kms:${props.replicationRegion}:${this.account}:key/*`]
            })
          ]
        })
      }
    });
    Object.entries(standardTags).forEach(([key, value]) => {
      cdk.Tags.of(replicationRole).add(key, value);
    });

    // S3 Replication Configuration (only for primary)
    if (props.isPrimary) {
      const cfnBucket = bucket.node.defaultChild as s3.CfnBucket;
      cfnBucket.replicationConfiguration = {
        role: replicationRole.roleArn,
        rules: [{
          id: 'ReplicateToSecondary',
          status: 'Enabled',
          prefix: '',
          destination: {
            bucket: `arn:aws:s3:::tap-data-${this.account}-${props.replicationRegion}`,
            encryptionConfiguration: {
              replicaKmsKeyId: `arn:aws:kms:${props.replicationRegion}:${this.account}:key/*`
            }
          }
        }]
      };
    }

    // Lambda for replication events
    const replicationLambda = new lambda.Function(this, 'ReplicationHandler', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromInline(`
        const AWS = require('aws-sdk');
        const sns = new AWS.SNS();
        
        exports.handler = async (event) => {
          console.log('Replication event:', JSON.stringify(event, null, 2));
          
          for (const record of event.Records) {
            if (record.eventSource === 'aws:s3') {
              const message = {
                bucket: record.s3.bucket.name,
                key: record.s3.object.key,
                eventName: record.eventName,
                region: process.env.AWS_REGION,
                timestamp: new Date().toISOString()
              };
              
              await sns.publish({
                TopicArn: process.env.SNS_TOPIC_ARN,
                Message: JSON.stringify(message),
                Subject: 'S3 Replication Event'
              }).promise();
            }
          }
        };
      `),
      environment: {
        SNS_TOPIC_ARN: `arn:aws:sns:${this.region}:${this.account}:tap-replication-events`
      }
    });
    Object.entries(standardTags).forEach(([key, value]) => {
      cdk.Tags.of(replicationLambda).add(key, value);
    });

    // SNS Topic
    const replicationTopic = new sns.Topic(this, 'ReplicationTopic', {
      topicName: 'tap-replication-events',
      masterKey: kmsKey
    });
    Object.entries(standardTags).forEach(([key, value]) => {
      cdk.Tags.of(replicationTopic).add(key, value);
    });

    replicationTopic.grantPublish(replicationLambda);

    // S3 Event Notification
    bucket.addEventNotification(
      s3.EventType.OBJECT_CREATED,
      new s3n.LambdaDestination(replicationLambda)
    );

    // RDS Subnet Group
    const dbSubnetGroup = new rds.SubnetGroup(this, 'DbSubnetGroup', {
      vpc,
      description: 'TAP database subnet group',
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS
      }
    });
    Object.entries(standardTags).forEach(([key, value]) => {
      cdk.Tags.of(dbSubnetGroup).add(key, value);
    });

    // RDS Security Group
    const dbSecurityGroup = new ec2.SecurityGroup(this, 'DbSecurityGroup', {
      vpc,
      description: 'TAP database security group',
      allowAllOutbound: false
    });
    Object.entries(standardTags).forEach(([key, value]) => {
      cdk.Tags.of(dbSecurityGroup).add(key, value);
    });

    // RDS Instance (Primary) or Read Replica (Secondary)
    if (props.isPrimary) {
      const database = new rds.DatabaseInstance(this, 'TapDatabase', {
        engine: rds.DatabaseInstanceEngine.postgres({
          version: rds.PostgresEngineVersion.VER_15_4
        }),
        instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MICRO),
        vpc,
        subnetGroup: dbSubnetGroup,
        securityGroups: [dbSecurityGroup],
        multiAz: true,
        storageEncrypted: true,
        storageEncryptionKey: kmsKey,
        backupRetention: cdk.Duration.days(7),
        deletionProtection: true,
        enablePerformanceInsights: true,
        performanceInsightEncryptionKey: kmsKey,
        cloudwatchLogsExports: ['postgresql'],
        credentials: rds.Credentials.fromGeneratedSecret('tapuser', {
          encryptionKey: kmsKey
        })
      });
      Object.entries(standardTags).forEach(([key, value]) => {
        cdk.Tags.of(database).add(key, value);
      });
    } else {
      const readReplica = new rds.DatabaseInstanceReadReplica(this, 'TapReadReplica', {
        sourceDatabaseInstance: rds.DatabaseInstance.fromDatabaseInstanceAttributes(this, 'SourceDb', {
          instanceIdentifier: `tapstack-primary-tapdatabase`,
          instanceEndpointAddress: `tapstack-primary-tapdatabase.${this.account}.${props.replicationRegion}.rds.amazonaws.com`,
          port: 5432,
          securityGroups: []
        }),
        instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MICRO),
        vpc,
        subnetGroup: dbSubnetGroup,
        securityGroups: [dbSecurityGroup],
        enablePerformanceInsights: true,
        performanceInsightEncryptionKey: kmsKey,
        cloudwatchLogsExports: ['postgresql']
      });
      Object.entries(standardTags).forEach(([key, value]) => {
        cdk.Tags.of(readReplica).add(key, value);
      });
    }

    // EC2 Security Group
    const webSecurityGroup = new ec2.SecurityGroup(this, 'WebSecurityGroup', {
      vpc,
      description: 'TAP web tier security group'
    });
    webSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      'HTTP access'
    );
    webSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      'HTTPS access'
    );
    Object.entries(standardTags).forEach(([key, value]) => {
      cdk.Tags.of(webSecurityGroup).add(key, value);
    });

    dbSecurityGroup.addIngressRule(
      webSecurityGroup,
      ec2.Port.tcp(5432),
      'Database access from web tier'
    );

    // EC2 Instance Role
    const instanceRole = new iam.Role(this, 'InstanceRole', {
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('CloudWatchAgentServerPolicy')
      ],
      inlinePolicies: {
        S3Access: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                's3:GetObject',
                's3:PutObject',
                's3:DeleteObject'
              ],
              resources: [`${bucket.bucketArn}/*`]
            }),
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: ['s3:ListBucket'],
              resources: [bucket.bucketArn]
            }),
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'kms:Decrypt',
                'kms:GenerateDataKey'
              ],
              resources: [kmsKey.keyArn]
            })
          ]
        })
      }
    });
    Object.entries(standardTags).forEach(([key, value]) => {
      cdk.Tags.of(instanceRole).add(key, value);
    });

    // Launch Template
    const launchTemplate = new ec2.LaunchTemplate(this, 'LaunchTemplate', {
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MICRO),
      machineImage: ec2.MachineImage.latestAmazonLinux2(),
      securityGroup: webSecurityGroup,
      role: instanceRole,
      userData: ec2.UserData.forLinux(),
      blockDevices: [{
        deviceName: '/dev/xvda',
        volume: ec2.BlockDeviceVolume.ebs(20, {
          encrypted: true,
          kmsKey: kmsKey
        })
      }]
    });
    Object.entries(standardTags).forEach(([key, value]) => {
      cdk.Tags.of(launchTemplate).add(key, value);
    });

    // Auto Scaling Group
    const asg = new autoscaling.AutoScalingGroup(this, 'AutoScalingGroup', {
      vpc,
      launchTemplate,
      minCapacity: 1,
      maxCapacity: 3,
      desiredCapacity: 2,
      healthCheckType: autoscaling.HealthCheckType.ELB,
      healthCheckGracePeriod: cdk.Duration.seconds(300)
    });
    Object.entries(standardTags).forEach(([key, value]) => {
      cdk.Tags.of(asg).add(key, value);
    });

    // CloudFront Distribution (only in primary region)
    if (props.isPrimary) {
      const distribution = new cloudfront.Distribution(this, 'TapDistribution', {
        defaultBehavior: {
          origin: new origins.S3Origin(bucket),
          viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
          cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
        },
        enableLogging: true,
        logBucket: new s3.Bucket(this, 'CloudFrontLogsBucket', {
          encryption: s3.BucketEncryption.S3_MANAGED,
          enforceSSL: true,
          publicReadAccess: false,
          blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
        }),
        logFilePrefix: 'cloudfront-logs/'
      });
      Object.entries(standardTags).forEach(([key, value]) => {
        cdk.Tags.of(distribution).add(key, value);
      });
    }

    // CloudWatch Alarms
    const replicationFailureAlarm = new cloudwatch.Alarm(this, 'ReplicationFailureAlarm', {
      metric: new cloudwatch.Metric({
        namespace: 'AWS/S3',
        metricName: 'ReplicationLatency',
        dimensionsMap: {
          SourceBucket: bucket.bucketName,
          DestinationBucket: `tap-data-${this.account}-${props.replicationRegion}`
        },
        statistic: 'Average'
      }),
      threshold: 900, // 15 minutes
      evaluationPeriods: 2,
      treatMissingData: cloudwatch.TreatMissingData.BREACHING
    });
    
    replicationFailureAlarm.addAlarmAction({
      bind: () => ({ alarmActionArn: replicationTopic.topicArn })
    });
    Object.entries(standardTags).forEach(([key, value]) => {
      cdk.Tags.of(replicationFailureAlarm).add(key, value);
    });

    // Log Groups
    new logs.LogGroup(this, 'ReplicationLambdaLogs', {
      logGroupName: `/aws/lambda/${replicationLambda.functionName}`,
      retention: logs.RetentionDays.ONE_WEEK,
      encryptionKey: kmsKey
    });
  }
}
```

**cdk.json**
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
    "@aws-cdk/aws-stepfunctions-tasks:enableLoggingConfiguration": true,
    "@aws-cdk/aws-ec2:restrictDefaultSecurityGroup": true,
    "@aws-cdk/aws-apigateway:requestValidatorUniqueId": true,
    "@aws-cdk/aws-kms:aliasNameRef": true,
    "@aws-cdk/aws-autoscaling:generateLaunchTemplateInsteadOfLaunchConfig": true,
    "@aws-cdk/core:includePrefixInUniqueNameGeneration": true,
    "@aws-cdk/aws-efs:denyAnonymousAccess": true,
    "@aws-cdk/aws-opensearchservice:enableLogging": true,
    "@aws-cdk/aws-nordicapis-apigateway:authorizerChangeDeploymentLogicalId": true,
    "@aws-cdk/aws-ec2:ebsDefaultGp3Volume": true,
    "@aws-cdk/aws-ecs-patterns:removeDefaultDesiredCount": true,
    "@aws-cdk/aws-rds:preventRenderingDeprecatedCredentials": true,
    "@aws-cdk/aws-codepipeline-actions:useNewDefaultBranchForSourceAction": true
  }
}
```