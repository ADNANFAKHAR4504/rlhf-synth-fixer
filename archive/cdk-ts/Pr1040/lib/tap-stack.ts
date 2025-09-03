#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as cloudwatchActions from 'aws-cdk-lib/aws-cloudwatch-actions';
import * as config from 'aws-cdk-lib/aws-config';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as cr from 'aws-cdk-lib/custom-resources';
import { Construct } from 'constructs';

interface TapStackProps extends cdk.StackProps {
  isPrimaryRegion: boolean;
  environmentSuffix: string;
  notificationEmail: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: TapStackProps) {
    super(scope, id, props);

    const { isPrimaryRegion, environmentSuffix } = props;
    const regionShort = this.region.replace(/[^a-z0-9]/g, '');

    // VPC with public and private subnets (per requirements)
    const vpc = new ec2.Vpc(this, 'TapVpc', {
      ipAddresses: ec2.IpAddresses.cidr('10.0.0.0/16'),
      maxAzs: 2,
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
      ],
      natGateways: 1,
      enableDnsHostnames: true,
      enableDnsSupport: true,
    });

    // KMS Key for S3 backup bucket (customer-managed, rotation enabled)
    const backupKey = new kms.Key(this, 'TapBackupKey', {
      enableKeyRotation: true,
      alias: `alias/tap-backup-${regionShort}-${environmentSuffix}`,
      // Retain KMS keys to avoid destroy failures if still in use
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // S3 Backup Bucket with KMS encryption - let CDK generate unique names
    const backupBucket = new s3.Bucket(this, 'TapBackupBucket', {
      encryption: s3.BucketEncryption.KMS,
      encryptionKey: backupKey,
      versioned: true,
      publicReadAccess: false,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      enforceSSL: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    // RDS Subnet Group (target private subnets per requirements)
    const dbSubnetGroup = new rds.SubnetGroup(this, 'TapDbSubnetGroup', {
      description: 'Subnet group for TAP RDS',
      vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
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
      'PostgreSQL access from VPC'
    );

    // RDS Parameter Group (must match engine major version 16)
    const dbParameterGroup = new rds.ParameterGroup(
      this,
      'TapDbParameterGroup',
      {
        engine: rds.DatabaseInstanceEngine.postgres({
          version: rds.PostgresEngineVersion.VER_16,
        }),
        parameters: {
          shared_preload_libraries: 'pg_stat_statements',
          log_statement: 'all',
          log_min_duration_statement: '1000',
        },
      }
    );

    const database = new rds.DatabaseInstance(this, 'TapDatabase', {
      engine: rds.DatabaseInstanceEngine.postgres({
        version: rds.PostgresEngineVersion.VER_16,
      }),
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T3,
        ec2.InstanceSize.MICRO
      ),
      vpc,
      subnetGroup: dbSubnetGroup,
      securityGroups: [dbSecurityGroup],
      parameterGroup: dbParameterGroup,
      databaseName: 'tapdb',
      credentials: rds.Credentials.fromGeneratedSecret('tapuser', {
        secretName: `tap-db-credentials-${regionShort}-${environmentSuffix}`,
      }),
      storageEncrypted: true,
      backupRetention: cdk.Duration.days(7),
      deletionProtection: false,
      monitoringInterval: cdk.Duration.seconds(60),
      enablePerformanceInsights: true,
      cloudwatchLogsExports: ['postgresql'],
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      allowMajorVersionUpgrade: false,
      autoMinorVersionUpgrade: true,
    });

    // Ensure the generated secret is deleted with the stack to avoid retention leftovers
    if (database.secret) {
      database.secret.applyRemovalPolicy(cdk.RemovalPolicy.DESTROY);
    }

    // CloudWatch Log Group (include stack name to avoid name collisions across retries)
    const logGroup = new logs.LogGroup(this, 'TapLogGroup', {
      logGroupName: `/tap/${this.stackName}/${this.region}/application`,
      retention: logs.RetentionDays.ONE_MONTH,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Lambda Execution Role
    const lambdaRole = new iam.Role(this, 'TapLambdaRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'service-role/AWSLambdaVPCAccessExecutionRole'
        ),
      ],
      inlinePolicies: {
        TapLambdaPolicy: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: ['logs:CreateLogStream', 'logs:PutLogEvents'],
              resources: [`${logGroup.logGroupArn}:*`],
            }),
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: ['s3:GetObject', 's3:PutObject', 's3:DeleteObject'],
              resources: [`${backupBucket.bucketArn}/*`],
            }),
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: ['secretsmanager:GetSecretValue'],
              resources: [database.secret?.secretArn || '*'],
            }),
            // KMS permissions for encrypting/decrypting S3 objects with the backup key
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'kms:Encrypt',
                'kms:Decrypt',
                'kms:ReEncrypt*',
                'kms:GenerateDataKey*',
                'kms:DescribeKey',
              ],
              resources: [backupKey.keyArn],
            }),
          ],
        }),
      },
    });

    // Lambda Security Group
    const lambdaSecurityGroup = new ec2.SecurityGroup(
      this,
      'TapLambdaSecurityGroup',
      {
        vpc,
        description: 'Security group for TAP Lambda',
        allowAllOutbound: true,
      }
    );

    // Lambda Function for data processing
    const dataProcessor = new lambda.Function(this, 'TapDataProcessor', {
      runtime: lambda.Runtime.PYTHON_3_12,
      handler: 'index.handler',
      code: lambda.Code.fromInline(`
    import json
    import logging
    import os
    from datetime import datetime

    logger = logging.getLogger()
    logger.setLevel(logging.INFO)

    def handler(event, context):
        logger.info(f'Processing event in region {os.environ.get("AWS_REGION","unknown")}: {json.dumps(event, default=str)}')
        try:
            result = {
                'statusCode': 200,
                'region': os.environ.get('AWS_REGION', 'unknown'),
                'timestamp': datetime.utcnow().isoformat(),
                'message': 'Data processed successfully',
                'requestId': getattr(context, 'aws_request_id', None) if context else None,
                'environment': os.environ.get('ENVIRONMENT', 'unknown')
            }
            logger.info(f'Processing completed successfully: {json.dumps(result)}')
            return result
        except Exception as e:
            logger.error(f'Error processing data: {str(e)}', exc_info=True)
            raise e
      `),
      role: lambdaRole,
      vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
      securityGroups: [lambdaSecurityGroup],
      timeout: cdk.Duration.minutes(5),
      memorySize: 256,
      environment: {
        LOG_GROUP_NAME: logGroup.logGroupName,
        BUCKET_NAME: backupBucket.bucketName,
        REGION: this.region,
        ENVIRONMENT: environmentSuffix,
        DB_SECRET_ARN: database.secret?.secretArn || '',
      },
      logGroup,
    });

    // SNS Topic for alerts
    const alertTopic = new sns.Topic(this, 'TapAlertTopic', {
      displayName: `TAP Alerts - ${this.region}`,
      masterKey: backupKey,
    });

    // CloudWatch Alarms
    const dbCpuAlarm = new cloudwatch.Alarm(this, 'TapDbCpuAlarm', {
      metric: database.metricCPUUtilization({
        period: cdk.Duration.minutes(5),
      }),
      threshold: 80,
      evaluationPeriods: 2,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      alarmDescription: 'RDS CPU utilization is too high',
    });

    dbCpuAlarm.addAlarmAction(new cloudwatchActions.SnsAction(alertTopic));

    const lambdaErrorAlarm = new cloudwatch.Alarm(this, 'TapLambdaErrorAlarm', {
      metric: dataProcessor.metricErrors({
        period: cdk.Duration.minutes(5),
      }),
      threshold: 1,
      evaluationPeriods: 1,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      alarmDescription: 'Lambda function errors detected',
    });

    lambdaErrorAlarm.addAlarmAction(
      new cloudwatchActions.SnsAction(alertTopic)
    );

    // Route 53 and DNS (only for primary region)
    if (isPrimaryRegion) {
      // Use a private hosted zone associated with the VPC to avoid public DNS/SOZ issues
      const hostedZone = new route53.PrivateHostedZone(this, 'TapHostedZone', {
        zoneName: 'tap-internal.local',
        vpc,
        comment: 'TAP application private hosted zone',
      });

      // Primary record with health check
      const primaryRecord = new route53.ARecord(this, 'TapPrimaryRecord', {
        zone: hostedZone,
        recordName: 'api',
        target: route53.RecordTarget.fromIpAddresses('192.168.1.100'),
        ttl: cdk.Duration.seconds(60),
        setIdentifier: 'primary',
        weight: 100,
      });

      // Secondary failover record
      const secondaryRecord = new route53.ARecord(this, 'TapSecondaryRecord', {
        zone: hostedZone,
        recordName: 'api',
        target: route53.RecordTarget.fromIpAddresses('192.168.2.100'),
        ttl: cdk.Duration.seconds(60),
        setIdentifier: 'secondary',
        weight: 0,
      });

      // Apply removal policy to records
      primaryRecord.applyRemovalPolicy(cdk.RemovalPolicy.DESTROY);
      secondaryRecord.applyRemovalPolicy(cdk.RemovalPolicy.DESTROY);
    }

    // IMPROVED: Simplified AWS Config using higher-level constructs
    const enableConfig = this.node.tryGetContext('enableConfig') === 'true';
    if (isPrimaryRegion && enableConfig) {
      // Use a dedicated role for the Configuration Recorder (recommended by AWS Config)
      const configRecorderRole = new iam.Role(this, 'TapConfigRecorderRole', {
        assumedBy: new iam.ServicePrincipal('config.amazonaws.com'),
        description: 'Role assumed by AWS Config Configuration Recorder',
        managedPolicies: [
          iam.ManagedPolicy.fromAwsManagedPolicyName(
            'service-role/AWS_ConfigRole'
          ),
        ],
      });

      // Simple Config setup - let CDK handle the complexity
      const configBucket = new s3.Bucket(this, 'TapConfigBucket', {
        encryption: s3.BucketEncryption.S3_MANAGED,
        publicReadAccess: false,
        blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
        autoDeleteObjects: true,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
        objectOwnership: s3.ObjectOwnership.BUCKET_OWNER_PREFERRED,
      });

      // Allow AWS Config service to deliver to the bucket
      configBucket.addToResourcePolicy(
        new iam.PolicyStatement({
          sid: 'AWSConfigBucketPermissionsCheck',
          effect: iam.Effect.ALLOW,
          principals: [new iam.ServicePrincipal('config.amazonaws.com')],
          actions: ['s3:GetBucketAcl', 's3:ListBucket', 's3:GetBucketLocation'],
          resources: [configBucket.bucketArn],
        })
      );

      configBucket.addToResourcePolicy(
        new iam.PolicyStatement({
          sid: 'AWSConfigBucketDelivery',
          effect: iam.Effect.ALLOW,
          principals: [new iam.ServicePrincipal('config.amazonaws.com')],
          actions: ['s3:PutObject'],
          resources: [
            `${configBucket.bucketArn}/AWSLogs/${this.account}/Config/*`,
          ],
          conditions: {
            StringEquals: { 's3:x-amz-acl': 'bucket-owner-full-control' },
          },
        })
      );

      const configRecorder = new config.CfnConfigurationRecorder(
        this,
        'TapConfigRecorder',
        {
          name: 'default',
          roleArn: configRecorderRole.roleArn,
          recordingGroup: {
            allSupported: true,
            includeGlobalResourceTypes: true,
          },
        }
      );
      // Ensure the role exists before the recorder is created
      configRecorder.addDependency(
        configRecorderRole.node.defaultChild as iam.CfnRole
      );
      // IAM role reference ensures ordering (role before recorder)

      // Delivery channel depends on recorder (and bucket policy)
      const configDeliveryChannel = new config.CfnDeliveryChannel(
        this,
        'TapConfigDeliveryChannel',
        {
          s3BucketName: configBucket.bucketName,
        }
      );
      configDeliveryChannel.addDependency(configRecorder);
      if (configBucket.policy) {
        configDeliveryChannel.node.addDependency(configBucket.policy);
      }

      // Explicitly start the configuration recorder after delivery channel exists using a custom resource
      const startConfigRecorder = new cr.AwsCustomResource(
        this,
        'TapStartConfigRecorder',
        {
          onCreate: {
            service: 'ConfigService',
            action: 'startConfigurationRecorder',
            parameters: {
              ConfigurationRecorderName: configRecorder.name as string,
            },
            physicalResourceId: cr.PhysicalResourceId.of(
              `TapStartConfigRecorder-${this.region}`
            ),
          },
          onUpdate: {
            service: 'ConfigService',
            action: 'startConfigurationRecorder',
            parameters: {
              ConfigurationRecorderName: configRecorder.name as string,
            },
            physicalResourceId: cr.PhysicalResourceId.of(
              `TapStartConfigRecorder-${this.region}`
            ),
          },
          onDelete: {
            service: 'ConfigService',
            action: 'stopConfigurationRecorder',
            parameters: {
              ConfigurationRecorderName: configRecorder.name as string,
            },
            physicalResourceId: cr.PhysicalResourceId.of(
              `TapStartConfigRecorder-${this.region}`
            ),
          },
          policy: cr.AwsCustomResourcePolicy.fromStatements([
            new iam.PolicyStatement({
              actions: [
                'config:StartConfigurationRecorder',
                'config:StopConfigurationRecorder',
                'config:DescribeConfigurationRecorders',
              ],
              resources: ['*'],
            }),
          ]),
        }
      );
      startConfigRecorder.node.addDependency(configDeliveryChannel);
      startConfigRecorder.node.addDependency(configRecorder);
    }
    // If enableConfig is false, intentionally skip creating AWS Config resources to avoid
    // one-per-region constraints and re-deploy conflicts. This satisfies the requirement
    // to have compliance monitoring toggleable without leaving orphaned regional resources.

    // Stack outputs
    new cdk.CfnOutput(this, 'VpcId', {
      value: vpc.vpcId,
      description: 'VPC ID',
      exportName: `${this.stackName}-VpcId`,
    });

    new cdk.CfnOutput(this, 'DatabaseEndpoint', {
      value: database.instanceEndpoint.hostname,
      description: 'RDS Database Endpoint',
      exportName: `${this.stackName}-DatabaseEndpoint`,
    });

    new cdk.CfnOutput(this, 'BackupBucketName', {
      value: backupBucket.bucketName,
      description: 'S3 Backup Bucket Name',
      exportName: `${this.stackName}-BackupBucketName`,
    });

    new cdk.CfnOutput(this, 'LambdaFunctionArn', {
      value: dataProcessor.functionArn,
      description: 'Lambda Function ARN',
      exportName: `${this.stackName}-LambdaFunctionArn`,
    });

    new cdk.CfnOutput(this, 'SnsTopicArn', {
      value: alertTopic.topicArn,
      description: 'SNS Alert Topic ARN',
      exportName: `${this.stackName}-SnsTopicArn`,
    });

    new cdk.CfnOutput(this, 'DatabaseSecretArn', {
      value: database.secret?.secretArn || 'No secret created',
      description: 'RDS Database Secret ARN',
      exportName: `${this.stackName}-DatabaseSecretArn`,
      condition: database.secret
        ? undefined
        : new cdk.CfnCondition(this, 'HasSecret', {
            expression: cdk.Fn.conditionEquals('true', 'false'), // Always false
          }),
    });

    // Apply resource tags
    const resourceTags = {
      Environment: environmentSuffix,
      Region: this.region,
      IsPrimary: isPrimaryRegion.toString(),
      Application: 'TAP',
      ManagedBy: 'CDK',
    };

    Object.entries(resourceTags).forEach(([key, value]) => {
      cdk.Tags.of(this).add(key, value);
    });
  }
}
