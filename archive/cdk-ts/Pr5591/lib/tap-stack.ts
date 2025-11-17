import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as events from 'aws-cdk-lib/aws-events';
import * as events_targets from 'aws-cdk-lib/aws-events-targets';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as kms from 'aws-cdk-lib/aws-kms';
import { Construct } from 'constructs';

interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, props);

    // Get environment suffix from props, context, or use 'dev' as default
    const environmentSuffix =
      props?.environmentSuffix ||
      this.node.tryGetContext('environmentSuffix') ||
      process.env.ENVIRONMENT_SUFFIX ||
      'dev';

    // 🔹 VPC Configuration with Private Subnets
    const vpc = new ec2.Vpc(this, `ReplicationVpc-${environmentSuffix}`, {
      ipAddresses: ec2.IpAddresses.cidr('10.100.0.0/16'),
      maxAzs: 2,
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'Private',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
        {
          cidrMask: 24,
          name: 'Public',
          subnetType: ec2.SubnetType.PUBLIC,
        },
      ],
      enableDnsHostnames: true,
      enableDnsSupport: true,
    });

    // Add VPC Endpoints for AWS Services
    vpc.addGatewayEndpoint(`S3Endpoint-${environmentSuffix}`, {
      service: ec2.GatewayVpcEndpointAwsService.S3,
      subnets: [{ subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS }],
    });

    vpc.addGatewayEndpoint(`DynamoDBEndpoint-${environmentSuffix}`, {
      service: ec2.GatewayVpcEndpointAwsService.DYNAMODB,
      subnets: [{ subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS }],
    });

    vpc.addInterfaceEndpoint(`LambdaEndpoint-${environmentSuffix}`, {
      service: ec2.InterfaceVpcEndpointAwsService.LAMBDA,
      subnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
    });

    vpc.addInterfaceEndpoint(`SNSEndpoint-${environmentSuffix}`, {
      service: ec2.InterfaceVpcEndpointAwsService.SNS,
      subnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
    });

    // 🔹 KMS Key for Encryption
    const encryptionKey = new kms.Key(
      this,
      `ReplicationEncryptionKey-${environmentSuffix}`,
      {
        description: `KMS key for infrastructure replication system - ${environmentSuffix}`,
        enableKeyRotation: true,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      }
    );

    new kms.Alias(this, `ReplicationEncryptionKeyAlias-${environmentSuffix}`, {
      aliasName: `alias/infrastructure-replication-${environmentSuffix}`,
      targetKey: encryptionKey,
    });

    // 🔹 DynamoDB State Tracker
    const stateTable = new dynamodb.Table(
      this,
      `InfraStateTable-${environmentSuffix}`,
      {
        tableName: `infrastructure-state-tracker-${environmentSuffix}`,
        partitionKey: {
          name: 'environment',
          type: dynamodb.AttributeType.STRING,
        },
        sortKey: {
          name: 'deploymentTimestamp',
          type: dynamodb.AttributeType.NUMBER,
        },
        billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
        pointInTimeRecoverySpecification: {
          pointInTimeRecoveryEnabled: false,
        },
        encryption: dynamodb.TableEncryption.CUSTOMER_MANAGED,
        encryptionKey: encryptionKey,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      }
    );

    // Global Secondary Index for version lookups
    stateTable.addGlobalSecondaryIndex({
      indexName: 'version-index',
      partitionKey: {
        name: 'version',
        type: dynamodb.AttributeType.STRING,
      },
      sortKey: {
        name: 'environment',
        type: dynamodb.AttributeType.STRING,
      },
      projectionType: dynamodb.ProjectionType.ALL,
    });

    // 🔹 S3 Configuration Store with Versioning
    const configBucket = new s3.Bucket(
      this,
      `ConfigStore-${environmentSuffix}`,
      {
        bucketName: `infra-config-store-${environmentSuffix}-${this.account}-${this.region}`,
        versioned: false,
        encryption: s3.BucketEncryption.KMS,
        encryptionKey: encryptionKey,
        blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
        autoDeleteObjects: true,
      }
    );

    // 🔹 SNS Topics for Notifications
    const driftTopic = new sns.Topic(
      this,
      `DriftDetectionTopic-${environmentSuffix}`,
      {
        topicName: `infrastructure-drift-alerts-${environmentSuffix}`,
        displayName: 'Infrastructure Drift Detection Alerts',
      }
    );

    const validationTopic = new sns.Topic(
      this,
      `ValidationFailureTopic-${environmentSuffix}`,
      {
        topicName: `validation-failure-alerts-${environmentSuffix}`,
        displayName: 'Environment Validation Failures',
      }
    );

    // 🔹 Drift Validation Lambda (ARM/Graviton2)
    const driftValidationFunction = new lambda.Function(
      this,
      `DriftValidationFunction-${environmentSuffix}`,
      {
        functionName: `infrastructure-drift-validator-${environmentSuffix}`,
        runtime: lambda.Runtime.NODEJS_18_X,
        architecture: lambda.Architecture.ARM_64,
        handler: 'index.handler',
        code: lambda.Code.fromInline(`
          const AWS = require('aws-sdk');
          const dynamodb = new AWS.DynamoDB.DocumentClient();
          const s3 = new AWS.S3();
          const sns = new AWS.SNS();
          
          exports.handler = async (event) => {
            const { sourceEnv, targetEnv } = event;
            
            try {
              // Fetch latest state from DynamoDB
              const sourceState = await dynamodb.query({
                TableName: '${stateTable.tableName}',
                KeyConditionExpression: 'environment = :env',
                ExpressionAttributeValues: { ':env': sourceEnv },
                ScanIndexForward: false,
                Limit: 1
              }).promise();
              
              const targetState = await dynamodb.query({
                TableName: '${stateTable.tableName}',
                KeyConditionExpression: 'environment = :env',
                ExpressionAttributeValues: { ':env': targetEnv },
                ScanIndexForward: false,
                Limit: 1
              }).promise();
              
              // Fetch configurations from S3
              const sourceConfig = await s3.getObject({
                Bucket: '${configBucket.bucketName}',
                Key: \`configs/\${sourceEnv}/parameters.json\`
              }).promise();
              
              const targetConfig = await s3.getObject({
                Bucket: '${configBucket.bucketName}',
                Key: \`configs/\${targetEnv}/parameters.json\`
              }).promise();
              
              // Compare configurations
              const sourceCfg = JSON.parse(sourceConfig.Body.toString());
              const targetCfg = JSON.parse(targetConfig.Body.toString());
              
              const driftDetected = [];
              
              // Check critical parameters
              if (sourceCfg.version !== targetCfg.version) {
                driftDetected.push(\`Version mismatch: \${sourceCfg.version} vs \${targetCfg.version}\`);
              }
              
              // Send notification if drift detected
              if (driftDetected.length > 0) {
                await sns.publish({
                  TopicArn: '${driftTopic.topicArn}',
                  Subject: \`Drift Detected: \${sourceEnv} -> \${targetEnv}\`,
                  Message: JSON.stringify({
                    sourceEnvironment: sourceEnv,
                    targetEnvironment: targetEnv,
                    driftItems: driftDetected,
                    timestamp: new Date().toISOString()
                  }, null, 2)
                }).promise();
                
                return {
                  statusCode: 400,
                  driftDetected: true,
                  details: driftDetected
                };
              }
              
              return {
                statusCode: 200,
                driftDetected: false,
                message: 'Environments are in sync'
              };
              
            } catch (error) {
              console.error('Validation failed:', error);
              
              await sns.publish({
                TopicArn: '${validationTopic.topicArn}',
                Subject: 'Validation Function Error',
                Message: JSON.stringify({
                  error: error.message,
                  environments: { source: sourceEnv, target: targetEnv },
                  timestamp: new Date().toISOString()
                }, null, 2)
              }).promise();
              
              throw error;
            }
          };
        `),
        timeout: cdk.Duration.minutes(5),
        memorySize: 512,
        environment: {
          STATE_TABLE: stateTable.tableName,
          CONFIG_BUCKET: configBucket.bucketName,
          DRIFT_TOPIC_ARN: driftTopic.topicArn,
          VALIDATION_TOPIC_ARN: validationTopic.topicArn,
        },
        vpc: vpc,
        vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
        tracing: lambda.Tracing.ACTIVE,
      }
    );

    // Grant permissions
    stateTable.grantReadData(driftValidationFunction);
    configBucket.grantRead(driftValidationFunction);
    encryptionKey.grantDecrypt(driftValidationFunction);
    encryptionKey.grantEncrypt(driftValidationFunction);
    driftTopic.grantPublish(driftValidationFunction);
    validationTopic.grantPublish(driftValidationFunction);

    // Grant VPC permissions
    driftValidationFunction.addToRolePolicy(
      new iam.PolicyStatement({
        actions: [
          'ec2:CreateNetworkInterface',
          'ec2:DescribeNetworkInterfaces',
          'ec2:DeleteNetworkInterface',
        ],
        resources: ['*'],
      })
    );

    // 🔹 Environment Update Lambda
    const environmentUpdateFunction = new lambda.Function(
      this,
      `EnvironmentUpdateFunction-${environmentSuffix}`,
      {
        functionName: `environment-update-handler-${environmentSuffix}`,
        runtime: lambda.Runtime.NODEJS_18_X,
        architecture: lambda.Architecture.ARM_64,
        handler: 'index.handler',
        code: lambda.Code.fromInline(`
          const AWS = require('aws-sdk');
          const dynamodb = new AWS.DynamoDB.DocumentClient();
          const cloudwatch = new AWS.CloudWatch();
          
          exports.handler = async (event) => {
            console.log('Stack update event:', JSON.stringify(event, null, 2));
            
            const stackName = event.detail?.stackName || 'unknown';
            const environment = stackName.includes('prod') ? 'prod' : 
                               stackName.includes('staging') ? 'staging' : 'dev';
            
            try {
              // Record update in state table
              await dynamodb.put({
                TableName: '${stateTable.tableName}',
                Item: {
                  environment: environment,
                  deploymentTimestamp: Date.now(),
                  version: '1.0.0',
                  stackName: stackName,
                  eventType: event.detail?.eventName || 'UNKNOWN',
                  status: 'UPDATED'
                }
              }).promise();
              
              // Push metric to CloudWatch
              await cloudwatch.putMetricData({
                Namespace: 'InfrastructureReplication',
                MetricData: [
                  {
                    MetricName: 'EnvironmentUpdate',
                    Value: 1,
                    Unit: 'Count',
                    Dimensions: [
                      { Name: 'Environment', Value: environment },
                      { Name: 'Action', Value: event.detail?.eventName || 'UNKNOWN' }
                    ],
                    Timestamp: new Date()
                  }
                ]
              }).promise();
              
              return { statusCode: 200, message: 'Update recorded' };
              
            } catch (error) {
              console.error('Failed to record update:', error);
              throw error;
            }
          };
        `),
        timeout: cdk.Duration.minutes(2),
        memorySize: 256,
        environment: {
          STATE_TABLE: stateTable.tableName,
        },
        vpc: vpc,
        vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
        tracing: lambda.Tracing.ACTIVE,
      }
    );

    stateTable.grantReadWriteData(environmentUpdateFunction);
    encryptionKey.grantDecrypt(environmentUpdateFunction);
    encryptionKey.grantEncrypt(environmentUpdateFunction);
    environmentUpdateFunction.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ['cloudwatch:PutMetricData'],
        resources: ['*'],
      })
    );

    // Grant VPC permissions
    environmentUpdateFunction.addToRolePolicy(
      new iam.PolicyStatement({
        actions: [
          'ec2:CreateNetworkInterface',
          'ec2:DescribeNetworkInterfaces',
          'ec2:DeleteNetworkInterface',
        ],
        resources: ['*'],
      })
    );

    // 🔹 EventBridge Rules for Stack Updates
    const stackUpdateRule = new events.Rule(
      this,
      `StackUpdateRule-${environmentSuffix}`,
      {
        ruleName: `infrastructure-stack-updates-${environmentSuffix}`,
        description: 'Trigger validation on CloudFormation stack updates',
        eventPattern: {
          source: ['aws.cloudformation'],
          detailType: ['CloudFormation Stack Status Change'],
          detail: {
            'status-details': {
              status: ['UPDATE_COMPLETE', 'CREATE_COMPLETE'],
            },
          },
        },
      }
    );

    stackUpdateRule.addTarget(
      new events_targets.LambdaFunction(environmentUpdateFunction)
    );
    stackUpdateRule.addTarget(
      new events_targets.LambdaFunction(driftValidationFunction, {
        event: events.RuleTargetInput.fromObject({
          sourceEnv: 'dev',
          targetEnv: 'staging',
        }),
      })
    );

    // 🔹 CloudWatch Dashboard
    const dashboard = new cloudwatch.Dashboard(
      this,
      `InfrastructureDashboard-${environmentSuffix}`,
      {
        dashboardName: `InfrastructureDrift-${environmentSuffix}`,
      }
    );

    // Add widgets
    dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'Environment Updates',
        left: [
          new cloudwatch.Metric({
            namespace: 'InfrastructureReplication',
            metricName: 'EnvironmentUpdate',
            dimensionsMap: { Environment: 'dev' },
            statistic: 'Sum',
            label: 'Dev',
          }),
          new cloudwatch.Metric({
            namespace: 'InfrastructureReplication',
            metricName: 'EnvironmentUpdate',
            dimensionsMap: { Environment: 'staging' },
            statistic: 'Sum',
            label: 'Staging',
          }),
          new cloudwatch.Metric({
            namespace: 'InfrastructureReplication',
            metricName: 'EnvironmentUpdate',
            dimensionsMap: { Environment: 'prod' },
            statistic: 'Sum',
            label: 'Production',
          }),
        ],
        width: 12,
        height: 6,
      }),
      new cloudwatch.TextWidget({
        markdown: `# Infrastructure Replication System
        
## Environment Status
- **Environment Suffix**: ${environmentSuffix}
- **Region**: ${this.region}
- **Account**: ${this.account}

## Key Resources
- [State Table](https://console.aws.amazon.com/dynamodb/home?region=${this.region}#tables:selected=${stateTable.tableName})
- [Config Bucket](https://s3.console.aws.amazon.com/s3/buckets/${configBucket.bucketName})
- [Drift Validator](https://console.aws.amazon.com/lambda/home?region=${this.region}#/functions/${driftValidationFunction.functionName})`,
        width: 12,
        height: 6,
      })
    );

    // 🔹 Apply Consistent Tags
    cdk.Tags.of(this).add('Environment', environmentSuffix);
    cdk.Tags.of(this).add('ManagedBy', 'CDK');
    cdk.Tags.of(this).add('Project', 'InfrastructureReplication');

    // Stack Outputs
    new cdk.CfnOutput(this, 'StateTableName', {
      value: stateTable.tableName,
      description: 'DynamoDB table for infrastructure state tracking',
      exportName: `StateTableName-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'ConfigBucketName', {
      value: configBucket.bucketName,
      description: 'S3 bucket for environment configurations',
      exportName: `ConfigBucketName-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'DriftValidationFunctionName', {
      value: driftValidationFunction.functionName,
      description: 'Lambda function for drift validation',
      exportName: `DriftValidationFunctionName-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'VpcId', {
      value: vpc.vpcId,
      description: 'VPC ID for replication infrastructure',
      exportName: `VpcId-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'DashboardUrl', {
      value: `https://console.aws.amazon.com/cloudwatch/home?region=${this.region}#dashboards:name=${dashboard.dashboardName}`,
      description: 'CloudWatch dashboard for monitoring infrastructure drift',
      exportName: `DashboardUrl-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'EncryptionKeyId', {
      value: encryptionKey.keyId,
      description: 'KMS key ID for infrastructure encryption',
      exportName: `EncryptionKeyId-${environmentSuffix}`,
    });
  }
}
