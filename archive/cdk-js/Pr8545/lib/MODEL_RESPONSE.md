```javascript
// bin/tap.mjs
#!/usr/bin/env node
import { App } from 'aws-cdk-lib';
import { TapStack } from '../lib/tap-stack.mjs';

const app = new App();
new TapStack(app, 'TapStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION
  },
});
```

```javascript
// lib/tap-stack.mjs
import { Stack, RemovalPolicy, Duration, CfnOutput, Tags } from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as sagemaker from 'aws-cdk-lib/aws-sagemaker';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as events from 'aws-cdk-lib/aws-events';
import * as eventTargets from 'aws-cdk-lib/aws-events-targets';
import * as securityhub from 'aws-cdk-lib/aws-securityhub';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as logs from 'aws-cdk-lib/aws-logs';

export class TapStack extends Stack {
  constructor(scope, id, props) {
    super(scope, id, props);

    const vpc = new ec2.Vpc(this, 'TapVpc', {
      maxAzs: 2,
      natGateways: 1
    });
    
    Tags.of(vpc).add('Owner', 'FinTechMLOps');
    Tags.of(vpc).add('CostCenter', 'ML-Infrastructure');
    Tags.of(vpc).add('Application', 'FraudPrediction');

    const sagemakerSg = new ec2.SecurityGroup(this, 'SageMakerSG', {
      vpc,
      description: 'Security group for SageMaker endpoint'
    });
    
    sagemakerSg.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      'Allow HTTPS inbound for endpoint invocation'
    );
    
    Tags.of(sagemakerSg).add('Owner', 'FinTechMLOps');
    Tags.of(sagemakerSg).add('CostCenter', 'ML-Infrastructure');
    Tags.of(sagemakerSg).add('Application', 'FraudPrediction');

    const modelBucket = new s3.Bucket(this, 'ModelArtifactsBucket', {
      versioned: true,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: RemovalPolicy.RETAIN,
      enforceSSL: true
    });
    
    Tags.of(modelBucket).add('Owner', 'FinTechMLOps');
    Tags.of(modelBucket).add('CostCenter', 'ML-Infrastructure');
    Tags.of(modelBucket).add('Application', 'FraudPrediction');

    const predictionTable = new dynamodb.Table(this, 'PredictionRecordsTable', {
      partitionKey: { name: 'requestId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'timestamp', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      encryption: dynamodb.TableEncryption.DEFAULT,
      removalPolicy: RemovalPolicy.RETAIN,
      pointInTimeRecovery: true
    });
    
    predictionTable.addGlobalSecondaryIndex({
      indexName: 'ModelVersionIndex',
      partitionKey: { name: 'modelVersion', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'timestamp', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL
    });
    
    Tags.of(predictionTable).add('Owner', 'FinTechMLOps');
    Tags.of(predictionTable).add('CostCenter', 'ML-Infrastructure');
    Tags.of(predictionTable).add('Application', 'FraudPrediction');

    const sagemakerExecutionRole = new iam.Role(this, 'SageMakerExecutionRole', {
      assumedBy: new iam.ServicePrincipal('sagemaker.amazonaws.com')
    });
    
    modelBucket.grantRead(sagemakerExecutionRole);
    
    sagemakerExecutionRole.addToPolicy(new iam.PolicyStatement({
      actions: [
        'ec2:CreateNetworkInterface',
        'ec2:DescribeNetworkInterfaces',
        'ec2:DeleteNetworkInterface'
      ],
      resources: ['*']
    }));
    
    const sagemakerModel = new sagemaker.CfnModel(this, 'FraudDetectionModel', {
      executionRoleArn: sagemakerExecutionRole.roleArn,
      primaryContainer: {
        image: `${this.account}.dkr.ecr.${this.region}.amazonaws.com/fraud-detection:latest`,
        modelDataUrl: `s3://${modelBucket.bucketName}/fraud-model/model.tar.gz`,
        environment: {
          MODEL_VERSION: '1.0.0'
        }
      },
      vpcConfig: {
        securityGroupIds: [sagemakerSg.securityGroupId],
        subnets: vpc.privateSubnets.map(subnet => subnet.subnetId)
      },
      tags: [
        { key: 'Owner', value: 'FinTechMLOps' },
        { key: 'CostCenter', value: 'ML-Infrastructure' },
        { key: 'Application', value: 'FraudPrediction' }
      ]
    });

    const endpointConfig = new sagemaker.CfnEndpointConfig(this, 'FraudEndpointConfig', {
      productionVariants: [
        {
          initialInstanceCount: 2,
          instanceType: 'ml.c5.large',
          modelName: sagemakerModel.attrModelName,
          variantName: 'AllTraffic',
          initialVariantWeight: 1.0
        }
      ],
      dataCaptureConfig: {
        captureStatus: 'Enabled',
        destinationS3Uri: `s3://${modelBucket.bucketName}/datacapture`,
        initialSamplingPercentage: 20,
        captureOptions: [
          { captureMode: 'Input' },
          { captureMode: 'Output' }
        ]
      },
      tags: [
        { key: 'Owner', value: 'FinTechMLOps' },
        { key: 'CostCenter', value: 'ML-Infrastructure' },
        { key: 'Application', value: 'FraudPrediction' }
      ]
    });

    const endpoint = new sagemaker.CfnEndpoint(this, 'FraudEndpoint', {
      endpointConfigName: endpointConfig.attrEndpointConfigName,
      tags: [
        { key: 'Owner', value: 'FinTechMLOps' },
        { key: 'CostCenter', value: 'ML-Infrastructure' },
        { key: 'Application', value: 'FraudPrediction' }
      ]
    });
    
    const alertTopic = new sns.Topic(this, 'FraudModelAlertsTopic');
    Tags.of(alertTopic).add('Owner', 'FinTechMLOps');
    Tags.of(alertTopic).add('CostCenter', 'ML-Infrastructure');
    Tags.of(alertTopic).add('Application', 'FraudPrediction');

    const lambdaRole = new iam.Role(this, 'PreprocessLambdaRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com')
    });

    lambdaRole.addToPolicy(new iam.PolicyStatement({
      actions: ['sagemaker:InvokeEndpoint'],
      resources: [endpoint.ref]
    }));

    predictionTable.grantWriteData(lambdaRole);

    lambdaRole.addToPolicy(new iam.PolicyStatement({
      actions: [
        'logs:CreateLogGroup',
        'logs:CreateLogStream',
        'logs:PutLogEvents',
        'cloudwatch:PutMetricData'
      ],
      resources: ['*']
    }));
    
    lambdaRole.addToPolicy(new iam.PolicyStatement({
      actions: [
        'ec2:CreateNetworkInterface',
        'ec2:DescribeNetworkInterfaces',
        'ec2:DeleteNetworkInterface'
      ],
      resources: ['*']
    }));
    
    const preprocessLambda = new lambda.Function(this, 'PreprocessLambda', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'index.handler',
      code: lambda.Code.fromInline(`
        import { SageMakerRuntimeClient, InvokeEndpointCommand } from "@aws-sdk/client-sagemaker-runtime";
        import { DynamoDBClient, PutItemCommand } from "@aws-sdk/client-dynamodb";
        import { CloudWatchClient, PutMetricDataCommand } from "@aws-sdk/client-cloudwatch";

        const smClient = new SageMakerRuntimeClient();
        const dbClient = new DynamoDBClient();
        const cwClient = new CloudWatchClient();

        export const handler = async (event) => {
          const requestId = event.requestContext?.requestId || Date.now().toString();
          const timestamp = new Date().toISOString();
          
          try {
            const payload = JSON.parse(event.body);
            const transformedPayload = { ...payload, timestamp };
            
            const command = new InvokeEndpointCommand({
              EndpointName: process.env.ENDPOINT_NAME,
              ContentType: 'application/json',
              Body: JSON.stringify(transformedPayload)
            });
            
            const startTime = Date.now();
            const response = await smClient.send(command);
            const endTime = Date.now();
            
            const responseBody = JSON.parse(Buffer.from(response.Body).toString());
            
            await dbClient.send(new PutItemCommand({
              TableName: process.env.PREDICTION_TABLE,
              Item: {
                requestId: { S: requestId },
                timestamp: { S: timestamp },
                modelVersion: { S: '1.0.0' },
                predictionOutcome: { S: responseBody.prediction },
                inputFeatures: { S: JSON.stringify(payload) },
                latencyMs: { N: (endTime - startTime).toString() }
              }
            }));
            
            await cwClient.send(new PutMetricDataCommand({
              Namespace: 'FraudDetection/ModelDrift',
              MetricData: [
                {
                  MetricName: 'PredictionConfidence',
                  Value: responseBody.confidence || 0,
                  Unit: 'None',
                  Dimensions: [{ Name: 'ModelVersion', Value: '1.0.0' }]
                },
                {
                  MetricName: 'PositivePredictions',
                  Value: responseBody.prediction === 'fraud' ? 1 : 0,
                  Unit: 'Count',
                  Dimensions: [{ Name: 'ModelVersion', Value: '1.0.0' }]
                }
              ]
            }));
            
            return {
              statusCode: 200,
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                requestId,
                prediction: responseBody.prediction,
                confidence: responseBody.confidence,
                timestamp
              })
            };
          } catch (error) {
            await dbClient.send(new PutItemCommand({
              TableName: process.env.PREDICTION_TABLE,
              Item: {
                requestId: { S: requestId },
                timestamp: { S: timestamp },
                error: { S: error.message },
                stack: { S: error.stack }
              }
            }));
            
            return {
              statusCode: 500,
              body: JSON.stringify({ error: 'An error occurred processing your request' })
            };
          }
        }
      `),
      timeout: Duration.seconds(30),
      memorySize: 1024,
      environment: {
        ENDPOINT_NAME: endpoint.attrEndpointName,
        PREDICTION_TABLE: predictionTable.tableName
      },
      role: lambdaRole,
      vpc: vpc,
      vpcSubnets: { subnets: vpc.privateSubnets }
    });

    const api = new apigateway.RestApi(this, 'FraudPredictionAPI', {
      restApiName: 'Fraud Prediction API',
      description: 'API for real-time fraud prediction',
      endpointConfiguration: {
        types: [apigateway.EndpointType.REGIONAL]
      }
    });

    const apiKey = new apigateway.ApiKey(this, 'FraudApiKey', {
      apiKeyName: 'FraudPredictionKey'
    });

    const usagePlan = new apigateway.UsagePlan(this, 'FraudUsagePlan', {
      name: 'FraudPredictionUsagePlan',
      throttle: {
        rateLimit: 10,
        burstLimit: 20
      },
      quota: {
        limit: 500000,
        period: apigateway.Period.DAY
      }
    });

    usagePlan.addApiKey(apiKey);
    usagePlan.addApiStage({ stage: api.deploymentStage });

    const predictResource = api.root.addResource('predict');
    const predictIntegration = new apigateway.LambdaIntegration(preprocessLambda);
    
    predictResource.addMethod('POST', predictIntegration, {
      apiKeyRequired: true
    });

    const securityHub = new securityhub.CfnHub(this, 'SecurityHub');

    const dashboard = new cloudwatch.Dashboard(this, 'FraudPredictionDashboard', {
      dashboardName: 'FraudPredictionMetrics'
    });

    const predictionLatencyAlarm = new cloudwatch.Alarm(this, 'PredictionLatencyAlarm', {
      metric: new cloudwatch.Metric({
        namespace: 'FraudDetection/ModelDrift',
        metricName: 'PredictionLatency',
        dimensionsMap: { ModelVersion: '1.0.0' }
      }),
      threshold: 2000,
      evaluationPeriods: 2,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING
    });

    const driftAlarm = new cloudwatch.Alarm(this, 'ModelDriftAlarm', {
      metric: new cloudwatch.Metric({
        namespace: 'FraudDetection/ModelDrift',
        metricName: 'PredictionConfidence',
        dimensionsMap: { ModelVersion: '1.0.0' }
      }),
      threshold: 0.7,
      comparisonOperator: cloudwatch.ComparisonOperator.LESS_THAN_THRESHOLD,
      evaluationPeriods: 3,
      treatMissingData: cloudwatch.TreatMissingData.BREACHING
    });

    const driftRule = new events.Rule(this, 'DriftEventRule', {
      eventPattern: {
        source: ['aws.cloudwatch'],
        detailType: ['CloudWatch Alarm State Change'],
        detail: {
          alarmName: [driftAlarm.alarmName]
        }
      }
    });

    driftRule.addTarget(new eventTargets.SnsTopic(alertTopic));

    new CfnOutput(this, 'APIEndpoint', {
      value: api.url,
      description: 'API Gateway endpoint URL'
    });

    new CfnOutput(this, 'APIKey', {
      value: apiKey.keyId,
      description: 'API Key ID for authentication'
    });

    new CfnOutput(this, 'S3BucketName', {
      value: modelBucket.bucketName,
      description: 'S3 bucket for model artifacts'
    });

    new CfnOutput(this, 'DynamoDBTable', {
      value: predictionTable.tableName,
      description: 'DynamoDB table for prediction records'
    });

    new CfnOutput(this, 'SageMakerEndpoint', {
      value: endpoint.attrEndpointName,
      description: 'SageMaker endpoint name'
    });

    new CfnOutput(this, 'CloudWatchDashboard', {
      value: dashboard.dashboardArn,
      description: 'CloudWatch dashboard for monitoring'
    });
  }
}
```

```json
{
  "app": "node bin/tap.mjs",
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
    "@aws-cdk/core:enableStackNameDuplicates": true,
    "aws-cdk:enableDiffNoFail": true,
    "@aws-cdk/core:stackRelativeExports": true,
    "@aws-cdk/aws-lambda:recognizeVersionProps": true,
    "@aws-cdk/aws-lambda:recognizeLayerVersion": true,
    "@aws-cdk/aws-cloudfront:defaultSecurityPolicyTLSv1.2_2021": true,
    "@aws-cdk/aws-rds:lowercaseDbIdentifier": true,
    "@aws-cdk/aws-efs:defaultEncryptionAtRest": true,
    "@aws-cdk/aws-lambda:checkSecurityGroupRules": true,
    "@aws-cdk/aws-codeguruprofiler:profilingGroupWithoutComputePlatform": true,
    "@aws-cdk/aws-opensearchservice:enableLogging": true,
    "@aws-cdk/aws-sns-subscriptions:restrictSqsDescryption": true,
    "@aws-cdk/aws-apigateway:disableCloudWatchRole": true,
    "@aws-cdk/core:enablePartitionLiterals": true,
    "@aws-cdk/core:target-partitions": [
      "aws",
      "aws-cn"
    ]
  }
}
```