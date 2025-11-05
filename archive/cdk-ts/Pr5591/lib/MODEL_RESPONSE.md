### Reasoning Trace
---

This is a complex multi-environment infrastructure replication system. Let me break down the requirements:

1. **Environments**: Dev (us-east-1), Staging (us-west-2), Production (eu-west-1)
2. **Key Components**:
   - Shared stack pattern with environment-specific parameters
   - DynamoDB state tracking with on-demand billing and PITR
   - ARM/Graviton2 Lambda functions for validation
   - EventBridge rules for stack update triggers
   - S3 configuration store with versioning and cross-region replication
   - CodePipeline with sequential promotion and manual approvals
   - CloudWatch dashboards for drift visualization
   - SNS notifications for alerts
   - VPC endpoints for secure inter-service communication
   - Consistent tagging strategy

3. **Constraints**:
   - ARM-based Lambda functions
   - DynamoDB on-demand with PITR
   - S3 cross-region replication
   - 1-hour minimum delay between staging and prod
   - VPC endpoints for all inter-environment calls

Let me create the two files:

1. `main.ts` - Entry point with environment configurations
2. `tapstack.ts` - Main stack with all resources

I need to ensure:
- Proper VPC setup with endpoints
- Cross-region capabilities
- Proper IAM permissions
- Event-driven architecture
- Pipeline with approval gates and delays
### Answer 
---

```typescript
// main.ts
import * as cdk from 'aws-cdk-lib';
import { TapStack } from './tapstack';

const app = new cdk.App();

// Environment configurations
const environments = {
  dev: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: 'us-east-1',
    envName: 'dev',
    vpcCidr: '10.0.0.0/16',
    instanceType: 't4g.micro',
    storageTier: 'gp3',
    maxAzs: 2,
    requiresApproval: false
  },
  staging: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: 'us-west-2',
    envName: 'staging',
    vpcCidr: '10.1.0.0/16',
    instanceType: 't4g.small',
    storageTier: 'gp3',
    maxAzs: 2,
    requiresApproval: true
  },
  prod: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: 'eu-west-1',
    envName: 'prod',
    vpcCidr: '10.2.0.0/16',
    instanceType: 't4g.medium',
    storageTier: 'io2',
    maxAzs: 3,
    requiresApproval: true
  }
};

// Deploy primary stack in us-east-1 (dev region) for global resources
const primaryStack = new TapStack(app, 'InfraReplicationSystem', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: 'us-east-1'
  },
  description: 'Multi-environment infrastructure replication and consistency system',
  environments: environments,
  sourceCommit: process.env.SOURCE_COMMIT || 'manual-deploy',
  deploymentVersion: process.env.DEPLOYMENT_VERSION || '1.0.0'
});

// Apply tags to all resources
cdk.Tags.of(app).add('System', 'InfrastructureReplication');
cdk.Tags.of(app).add('ManagedBy', 'CDK');
cdk.Tags.of(app).add('CostCenter', 'Platform');

app.synth();
```

```typescript
// tapstack.ts
import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as codepipeline from 'aws-cdk-lib/aws-codepipeline';
import * as codepipeline_actions from 'aws-cdk-lib/aws-codepipeline-actions';
import * as events from 'aws-cdk-lib/aws-events';
import * as events_targets from 'aws-cdk-lib/aws-events-targets';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as sns_subscriptions from 'aws-cdk-lib/aws-sns-subscriptions';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as codebuild from 'aws-cdk-lib/aws-codebuild';
import * as stepfunctions from 'aws-cdk-lib/aws-stepfunctions';
import * as stepfunctions_tasks from 'aws-cdk-lib/aws-stepfunctions-tasks';
import { Construct } from 'constructs';

interface TapStackProps extends cdk.StackProps {
  environments: {
    [key: string]: {
      account?: string;
      region: string;
      envName: string;
      vpcCidr: string;
      instanceType: string;
      storageTier: string;
      maxAzs: number;
      requiresApproval: boolean;
    };
  };
  sourceCommit: string;
  deploymentVersion: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: TapStackProps) {
    super(scope, id, props);

    // 🔹 VPC Configuration with Private Subnets
    const vpc = new ec2.Vpc(this, 'ReplicationVpc', {
      ipAddresses: ec2.IpAddresses.cidr('10.100.0.0/16'),
      maxAzs: 2,
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'Private',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS
        },
        {
          cidrMask: 24,
          name: 'Public',
          subnetType: ec2.SubnetType.PUBLIC
        }
      ],
      enableDnsHostnames: true,
      enableDnsSupport: true
    });

    // 🔹 VPC Endpoints for AWS Services
    vpc.addGatewayEndpoint('S3Endpoint', {
      service: ec2.GatewayVpcEndpointAwsService.S3,
      subnets: [{ subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS }]
    });

    vpc.addGatewayEndpoint('DynamoDBEndpoint', {
      service: ec2.GatewayVpcEndpointAwsService.DYNAMODB,
      subnets: [{ subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS }]
    });

    vpc.addInterfaceEndpoint('LambdaEndpoint', {
      service: ec2.InterfaceVpcEndpointAwsService.LAMBDA,
      subnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS }
    });

    vpc.addInterfaceEndpoint('SNSEndpoint', {
      service: ec2.InterfaceVpcEndpointAwsService.SNS,
      subnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS }
    });

    vpc.addInterfaceEndpoint('EventBridgeEndpoint', {
      service: ec2.InterfaceVpcEndpointAwsService.EVENTBRIDGE,
      subnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS }
    });

    // 🔹 DynamoDB State Tracker
    const stateTable = new dynamodb.Table(this, 'InfraStateTable', {
      tableName: 'infrastructure-state-tracker',
      partitionKey: {
        name: 'environment',
        type: dynamodb.AttributeType.STRING
      },
      sortKey: {
        name: 'deploymentTimestamp',
        type: dynamodb.AttributeType.NUMBER
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      pointInTimeRecovery: true,
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
      stream: dynamodb.StreamViewType.NEW_AND_OLD_IMAGES,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      tags: {
        Purpose: 'StateTracking',
        Environment: 'Global',
        Version: props.deploymentVersion,
        SourceCommit: props.sourceCommit,
        DeployedAt: new Date().toISOString()
      }
    });

    // Global Secondary Index for version lookups
    stateTable.addGlobalSecondaryIndex({
      indexName: 'version-index',
      partitionKey: {
        name: 'version',
        type: dynamodb.AttributeType.STRING
      },
      sortKey: {
        name: 'environment',
        type: dynamodb.AttributeType.STRING
      },
      projectionType: dynamodb.ProjectionType.ALL
    });

    // 🔹 S3 Configuration Store with Versioning and Cross-Region Replication
    const configBucket = new s3.Bucket(this, 'ConfigStore', {
      bucketName: `infra-config-store-${this.account}-${this.region}`,
      versioned: true,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      lifecycleRules: [{
        id: 'delete-old-versions',
        noncurrentVersionExpiration: cdk.Duration.days(90),
        enabled: true
      }],
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      autoDeleteObjects: false,
      objectOwnership: s3.ObjectOwnership.BUCKET_OWNER_ENFORCED,
      serverAccessLogsPrefix: 'access-logs/',
      replicationConfiguration: {
        role: new iam.Role(this, 'ReplicationRole', {
          assumedBy: new iam.ServicePrincipal('s3.amazonaws.com'),
          inlinePolicies: {
            ReplicationPolicy: new iam.PolicyDocument({
              statements: [
                new iam.PolicyStatement({
                  actions: [
                    's3:GetReplicationConfiguration',
                    's3:ListBucket'
                  ],
                  resources: [`arn:aws:s3:::infra-config-store-${this.account}-${this.region}`]
                }),
                new iam.PolicyStatement({
                  actions: [
                    's3:GetObjectVersionForReplication',
                    's3:GetObjectVersionAcl'
                  ],
                  resources: [`arn:aws:s3:::infra-config-store-${this.account}-${this.region}/*`]
                }),
                new iam.PolicyStatement({
                  actions: [
                    's3:ReplicateObject',
                    's3:ReplicateDelete'
                  ],
                  resources: [
                    `arn:aws:s3:::infra-config-store-${this.account}-us-west-2/*`,
                    `arn:aws:s3:::infra-config-store-${this.account}-eu-west-1/*`
                  ]
                })
              ]
            })
          }
        }).roleArn,
        rules: [{
          id: 'replicate-all',
          status: s3.ReplicationRuleStatus.ENABLED,
          priority: 1,
          deleteMarkerReplication: { status: s3.DeleteMarkerReplicationStatus.ENABLED },
          filter: {},
          destinations: [
            {
              bucket: `arn:aws:s3:::infra-config-store-${this.account}-us-west-2`,
              replicationTime: {
                status: s3.ReplicationTimeStatus.ENABLED,
                time: cdk.Duration.minutes(15)
              },
              metrics: {
                status: s3.ReplicationRuleStatus.ENABLED,
                eventThreshold: cdk.Duration.minutes(15)
              }
            }
          ]
        }]
      }
    });

    // 🔹 SNS Topics for Notifications
    const driftTopic = new sns.Topic(this, 'DriftDetectionTopic', {
      topicName: 'infrastructure-drift-alerts',
      displayName: 'Infrastructure Drift Detection Alerts'
    });

    const validationTopic = new sns.Topic(this, 'ValidationFailureTopic', {
      topicName: 'validation-failure-alerts',
      displayName: 'Environment Validation Failures'
    });

    const rollbackTopic = new sns.Topic(this, 'RollbackExecutionTopic', {
      topicName: 'rollback-execution-alerts',
      displayName: 'Rollback Execution Notifications'
    });

    // Add email subscriptions
    const alertEmail = this.node.tryGetContext('alertEmail') || 'alerts@example.com';
    driftTopic.addSubscription(new sns_subscriptions.EmailSubscription(alertEmail));
    validationTopic.addSubscription(new sns_subscriptions.EmailSubscription(alertEmail));
    rollbackTopic.addSubscription(new sns_subscriptions.EmailSubscription(alertEmail));

    // 🔹 Lambda Layer for Shared Libraries
    const sharedLayer = new lambda.LayerVersion(this, 'SharedLibraries', {
      code: lambda.Code.fromAsset('lambda-layer'),
      compatibleRuntimes: [lambda.Runtime.NODEJS_18_X],
      compatibleArchitectures: [lambda.Architecture.ARM_64],
      description: 'Shared libraries for validation functions'
    });

    // 🔹 Drift Validation Lambda (ARM/Graviton2)
    const driftValidationFunction = new lambda.Function(this, 'DriftValidationFunction', {
      functionName: 'infrastructure-drift-validator',
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
            
            if (sourceCfg.stackTemplate !== targetCfg.stackTemplate) {
              driftDetected.push('Stack template differs between environments');
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
        VALIDATION_TOPIC_ARN: validationTopic.topicArn
      },
      vpc: vpc,
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
      layers: [sharedLayer],
      tracing: lambda.Tracing.ACTIVE,
      reservedConcurrentExecutions: 10
    });

    // Grant permissions
    stateTable.grantReadData(driftValidationFunction);
    configBucket.grantRead(driftValidationFunction);
    driftTopic.grantPublish(driftValidationFunction);
    validationTopic.grantPublish(driftValidationFunction);

    // 🔹 Rollback Lambda (ARM/Graviton2)
    const rollbackFunction = new lambda.Function(this, 'RollbackFunction', {
      functionName: 'infrastructure-rollback',
      runtime: lambda.Runtime.NODEJS_18_X,
      architecture: lambda.Architecture.ARM_64,
      handler: 'index.handler',
      code: lambda.Code.fromInline(`
        const AWS = require('aws-sdk');
        const dynamodb = new AWS.DynamoDB.DocumentClient();
        const s3 = new AWS.S3();
        const sns = new AWS.SNS();
        const codepipeline = new AWS.CodePipeline();
        
        exports.handler = async (event) => {
          const { targetVersion, environments } = event;
          
          try {
            const rollbackResults = [];
            
            for (const env of environments) {
              // Fetch target version configuration
              const configKey = \`configs/\${env}/parameters-v\${targetVersion}.json\`;
              
              const versionConfig = await s3.getObject({
                Bucket: '${configBucket.bucketName}',
                Key: configKey
              }).promise();
              
              // Update current configuration
              await s3.putObject({
                Bucket: '${configBucket.bucketName}',
                Key: \`configs/\${env}/parameters.json\`,
                Body: versionConfig.Body,
                ContentType: 'application/json',
                Metadata: {
                  rollbackFrom: event.currentVersion,
                  rollbackTo: targetVersion,
                  rollbackAt: new Date().toISOString()
                }
              }).promise();
              
              // Record rollback in state table
              await dynamodb.put({
                TableName: '${stateTable.tableName}',
                Item: {
                  environment: env,
                  deploymentTimestamp: Date.now(),
                  version: targetVersion,
                  action: 'ROLLBACK',
                  sourceVersion: event.currentVersion,
                  initiatedBy: event.initiatedBy || 'automated',
                  reason: event.reason || 'Drift detection failure'
                }
              }).promise();
              
              rollbackResults.push({
                environment: env,
                status: 'success',
                rolledBackTo: targetVersion
              });
            }
            
            // Send rollback notification
            await sns.publish({
              TopicArn: '${rollbackTopic.topicArn}',
              Subject: 'Infrastructure Rollback Executed',
              Message: JSON.stringify({
                targetVersion,
                environments,
                results: rollbackResults,
                timestamp: new Date().toISOString()
              }, null, 2)
            }).promise();
            
            return {
              statusCode: 200,
              success: true,
              results: rollbackResults
            };
            
          } catch (error) {
            console.error('Rollback failed:', error);
            
            await sns.publish({
              TopicArn: '${rollbackTopic.topicArn}',
              Subject: 'Infrastructure Rollback Failed',
              Message: JSON.stringify({
                error: error.message,
                targetVersion,
                environments,
                timestamp: new Date().toISOString()
              }, null, 2)
            }).promise();
            
            throw error;
          }
        };
      `),
      timeout: cdk.Duration.minutes(10),
      memorySize: 1024,
      environment: {
        STATE_TABLE: stateTable.tableName,
        CONFIG_BUCKET: configBucket.bucketName,
        ROLLBACK_TOPIC_ARN: rollbackTopic.topicArn
      },
      vpc: vpc,
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
      layers: [sharedLayer],
      tracing: lambda.Tracing.ACTIVE,
      reservedConcurrentExecutions: 5
    });

    // Grant permissions
    stateTable.grantReadWriteData(rollbackFunction);
    configBucket.grantReadWrite(rollbackFunction);
    rollbackTopic.grantPublish(rollbackFunction);

    // 🔹 Environment Update Lambda
    const environmentUpdateFunction = new lambda.Function(this, 'EnvironmentUpdateFunction', {
      functionName: 'environment-update-handler',
      runtime: lambda.Runtime.NODEJS_18_X,
      architecture: lambda.Architecture.ARM_64,
      handler: 'index.handler',
      code: lambda.Code.fromInline(`
        const AWS = require('aws-sdk');
        const dynamodb = new AWS.DynamoDB.DocumentClient();
        const cloudwatch = new AWS.CloudWatch();
        
        exports.handler = async (event) => {
          console.log('Stack update event:', JSON.stringify(event, null, 2));
          
          const stackName = event.detail.stackName;
          const environment = stackName.includes('prod') ? 'prod' : 
                             stackName.includes('staging') ? 'staging' : 'dev';
          
          try {
            // Record update in state table
            await dynamodb.put({
              TableName: '${stateTable.tableName}',
              Item: {
                environment: environment,
                deploymentTimestamp: Date.now(),
                version: '${props.deploymentVersion}',
                stackName: stackName,
                eventType: event.detail.eventName,
                sourceCommit: '${props.sourceCommit}',
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
                    { Name: 'Action', Value: event.detail.eventName }
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
        STATE_TABLE: stateTable.tableName
      },
      vpc: vpc,
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
      tracing: lambda.Tracing.ACTIVE
    });

    stateTable.grantReadWriteData(environmentUpdateFunction);
    environmentUpdateFunction.addToRolePolicy(new iam.PolicyStatement({
      actions: ['cloudwatch:PutMetricData'],
      resources: ['*']
    }));

    // 🔹 EventBridge Rules for Stack Updates
    const stackUpdateRule = new events.Rule(this, 'StackUpdateRule', {
      ruleName: 'infrastructure-stack-updates',
      description: 'Trigger validation on CloudFormation stack updates',
      eventPattern: {
        source: ['aws.cloudformation'],
        detailType: ['CloudFormation Stack Status Change'],
        detail: {
          'status-details': {
            status: ['UPDATE_COMPLETE', 'CREATE_COMPLETE']
          }
        }
      }
    });

    stackUpdateRule.addTarget(new events_targets.LambdaFunction(environmentUpdateFunction));
    stackUpdateRule.addTarget(new events_targets.LambdaFunction(driftValidationFunction, {
      event: events.RuleTargetInput.fromObject({
        sourceEnv: 'dev',
        targetEnv: 'staging'
      })
    }));

    // 🔹 Step Functions for Orchestration
    const waitTask = new stepfunctions.Wait(this, 'WaitOneHour', {
      time: stepfunctions.WaitTime.duration(cdk.Duration.hours(1))
    });

    const validateDriftTask = new stepfunctions_tasks.LambdaInvoke(this, 'ValidateDrift', {
      lambdaFunction: driftValidationFunction,
      outputPath: '$.Payload'
    });

    const rollbackTask = new stepfunctions_tasks.LambdaInvoke(this, 'ExecuteRollback', {
      lambdaFunction: rollbackFunction,
      outputPath: '$.Payload'
    });

    const promotionStateMachine = new stepfunctions.StateMachine(this, 'PromotionStateMachine', {
      stateMachineName: 'infrastructure-promotion',
      definition: validateDriftTask
        .next(new stepfunctions.Choice(this, 'DriftCheck')
          .when(stepfunctions.Condition.booleanEquals('$.driftDetected', true), rollbackTask)
          .otherwise(waitTask)
        ),
      tracingConfiguration: {
        enabled: true
      }
    });

    // 🔹 CodeBuild Project for Deployment
    const deployProject = new codebuild.PipelineProject(this, 'DeployProject', {
      projectName: 'infrastructure-deploy',
      vpc: vpc,
      subnetSelection: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
      environment: {
        buildImage: codebuild.LinuxBuildImage.STANDARD_7_0,
        computeType: codebuild.ComputeType.MEDIUM,
        privileged: true
      },
      environmentVariables: {
        STATE_TABLE: { value: stateTable.tableName },
        CONFIG_BUCKET: { value: configBucket.bucketName }
      },
      buildSpec: codebuild.BuildSpec.fromObject({
        version: '0.2',
        phases: {
          install: {
            commands: [
              'npm install -g aws-cdk@latest',
              'npm install'
            ]
          },
          build: {
            commands: [
              'cdk deploy --require-approval never'
            ]
          }
        }
      })
    });

    // 🔹 CodePipeline for Sequential Promotion
    const sourceOutput = new codepipeline.Artifact();
    const buildOutput = new codepipeline.Artifact();

    const pipeline = new codepipeline.Pipeline(this, 'PromotionPipeline', {
      pipelineName: 'infrastructure-promotion',
      artifactBucket: configBucket,
      restartExecutionOnUpdate: false,
      stages: [
        // Source Stage
        {
          stageName: 'Source',
          actions: [
            new codepipeline_actions.S3SourceAction({
              actionName: 'SourceAction',
              bucket: configBucket,
              bucketKey: 'source/infrastructure.zip',
              output: sourceOutput,
              trigger: codepipeline_actions.S3Trigger.EVENTS
            })
          ]
        },
        
        // Dev Deployment
        {
          stageName: 'DeployToDev',
          actions: [
            new codepipeline_actions.CodeBuildAction({
              actionName: 'DeployDev',
              project: deployProject,
              input: sourceOutput,
              outputs: [buildOutput],
              environmentVariables: {
                ENVIRONMENT: { value: 'dev' },
                REGION: { value: 'us-east-1' }
              }
            })
          ]
        },
        
        // Staging Validation & Deployment
        {
          stageName: 'ValidateAndDeployStaging',
          actions: [
            new codepipeline_actions.LambdaInvokeAction({
              actionName: 'ValidateDrift',
              lambda: driftValidationFunction,
              userParameters: {
                sourceEnv: 'dev',
                targetEnv: 'staging'
              }
            }),
            new codepipeline_actions.ManualApprovalAction({
              actionName: 'ApproveStaging',
              notificationTopic: validationTopic,
              additionalInformation: 'Review dev environment before promoting to staging'
            }),
            new codepipeline_actions.CodeBuildAction({
              actionName: 'DeployStaging',
              project: deployProject,
              input: sourceOutput,
              environmentVariables: {
                ENVIRONMENT: { value: 'staging' },
                REGION: { value: 'us-west-2' }
              }
            })
          ]
        },
        
        // Production Gate with Delay
        {
          stageName: 'ProductionGate',
          actions: [
            new codepipeline_actions.StepFunctionsInvokeAction({
              actionName: 'EnforceDelay',
              stateMachine: promotionStateMachine,
              stateMachineInput: codepipeline_actions.StateMachineInput.literal({
                sourceEnv: 'staging',
                targetEnv: 'prod'
              })
            }),
            new codepipeline_actions.ManualApprovalAction({
              actionName: 'ApproveProduction',
              notificationTopic: validationTopic,
              additionalInformation: 'Final approval required for production deployment',
              externalEntityLink: `https://console.aws.amazon.com/cloudwatch/home?region=${this.region}#dashboards:name=InfrastructureDrift`
            })
          ]
        },
        
        // Production Deployment
        {
          stageName: 'DeployToProduction',
          actions: [
            new codepipeline_actions.CodeBuildAction({
              actionName: 'DeployProd',
              project: deployProject,
              input: sourceOutput,
              environmentVariables: {
                ENVIRONMENT: { value: 'prod' },
                REGION: { value: 'eu-west-1' }
              }
            })
          ]
        },
        
        // Rollback Stage
        {
          stageName: 'RollbackIfNeeded',
          actions: [
            new codepipeline_actions.ManualApprovalAction({
              actionName: 'TriggerRollback',
              notificationTopic: rollbackTopic,
              additionalInformation: 'Approve to rollback all environments to previous version'
            }),
            new codepipeline_actions.LambdaInvokeAction({
              actionName: 'ExecuteRollback',
              lambda: rollbackFunction,
              userParameters: {
                environments: ['dev', 'staging', 'prod'],
                targetVersion: 'previous'
              }
            })
          ]
        }
      ]
    });

    // Grant pipeline permissions
    stateTable.grantReadWriteData(pipeline);
    configBucket.grantReadWrite(pipeline);

    // 🔹 CloudWatch Dashboard
    const dashboard = new cloudwatch.Dashboard(this, 'InfrastructureDashboard', {
      dashboardName: 'InfrastructureDrift',
      defaultInterval: cdk.Duration.hours(1)
    });

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
            label: 'Dev'
          }),
          new cloudwatch.Metric({
            namespace: 'InfrastructureReplication',
            metricName: 'EnvironmentUpdate',
            dimensionsMap: { Environment: 'staging' },
            statistic: 'Sum',
            label: 'Staging'
          }),
          new cloudwatch.Metric({
            namespace: 'InfrastructureReplication',
            metricName: 'EnvironmentUpdate',
            dimensionsMap: { Environment: 'prod' },
            statistic: 'Sum',
            label: 'Production'
          })
        ],
        width: 12,
        height: 6
      }),
      
      new cloudwatch.TextWidget({
        markdown: `# Infrastructure Replication System
        
## Environment Status
- **Dev Region**: us-east-1
- **Staging Region**: us-west-2
- **Production Region**: eu-west-1

## Key Resources
- [State Table](https://console.aws.amazon.com/dynamodb/home?region=${this.region}#tables:selected=${stateTable.tableName})
- [Config Bucket](https://s3.console.aws.amazon.com/s3/buckets/${configBucket.bucketName})
- [Promotion Pipeline](https://console.aws.amazon.com/codesuite/codepipeline/pipelines/${pipeline.pipelineName})

## Deployed Version
- **Version**: ${props.deploymentVersion}
- **Commit**: ${props.sourceCommit}
- **Deployed**: ${new Date().toISOString()}`,
        width: 12,
        height: 6
      }),
      
      new cloudwatch.AlarmWidget({
        title: 'Drift Detection Alarms',
        alarms: [
          new cloudwatch.Alarm(this, 'DriftAlarm', {
            alarmName: 'infrastructure-drift-detected',
            metric: new cloudwatch.Metric({
              namespace: 'InfrastructureReplication',
              metricName: 'DriftDetected',
              statistic: 'Sum'
            }),
            threshold: 1,
            evaluationPeriods: 1,
            treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
            alarmDescription: 'Drift detected between environments'
          })
        ],
        width: 24,
        height: 4
      })
    );

    // 🔹 Apply Consistent Tags
    cdk.Tags.of(this).add('Environment', 'Global');
    cdk.Tags.of(this).add('Version', props.deploymentVersion);
    cdk.Tags.of(this).add('SourceCommit', props.sourceCommit);
    cdk.Tags.of(this).add('DeployedAt', new Date().toISOString());
    cdk.Tags.of(this).add('ManagedBy', 'CDK');
    
    // Stack Outputs
    new cdk.CfnOutput(this, 'StateTableName', {
      value: stateTable.tableName,
      description: 'DynamoDB table for infrastructure state tracking'
    });
    
    new cdk.CfnOutput(this, 'ConfigBucketName', {
      value: configBucket.bucketName,
      description: 'S3 bucket for environment configurations'
    });
    
    new cdk.CfnOutput(this, 'PipelineArn', {
      value: pipeline.pipelineArn,
      description: 'CodePipeline ARN for environment promotion'
    });
    
    new cdk.CfnOutput(this, 'DashboardUrl', {
      value: `https://console.aws.amazon.com/cloudwatch/home?region=${this.region}#dashboards:name=${dashboard.dashboardName}`,
      description: 'CloudWatch dashboard for monitoring infrastructure drift'
    });
  }
}
```