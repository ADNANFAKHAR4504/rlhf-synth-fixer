import { Stack, RemovalPolicy, Duration, CfnOutput, Tags, CustomResource } from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as sagemaker from 'aws-cdk-lib/aws-sagemaker';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as cloudwatchActions from 'aws-cdk-lib/aws-cloudwatch-actions';
import * as events from 'aws-cdk-lib/aws-events';
import * as eventTargets from 'aws-cdk-lib/aws-events-targets';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as cr from 'aws-cdk-lib/custom-resources';

export class TapStack extends Stack {
  constructor(scope, id, props) {
    super(scope, id, props);

    const environmentSuffix =
      props?.environmentSuffix ||
      this.node.tryGetContext('environmentSuffix') ||
      'dev';

    // Check if running in LocalStack (SageMaker not supported)
    const isLocalStack = process.env.CDK_LOCAL === 'true' || 
                         process.env.AWS_ENDPOINT_URL?.includes('localhost') ||
                         process.env.LOCALSTACK_HOSTNAME !== undefined;

    const modelRepository = new ecr.Repository(this, 'FraudDetectionRepository', {
      repositoryName: `fraud-detection-${environmentSuffix}`,
      removalPolicy: RemovalPolicy.DESTROY,
      emptyOnDelete: true,
      imageScanOnPush: true
    });
    
    modelRepository.addToResourcePolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      principals: [new iam.ServicePrincipal('sagemaker.amazonaws.com')],
      actions: [
        'ecr:BatchCheckLayerAvailability',
        'ecr:GetDownloadUrlForLayer',
        'ecr:BatchGetImage'
      ]
    }));
    
    Tags.of(modelRepository).add('Owner', 'FinTechMLOps');
    Tags.of(modelRepository).add('CostCenter', 'ML-Infrastructure');
    Tags.of(modelRepository).add('Application', 'FraudPrediction');

    const securityHubEnablementFunction = new lambda.Function(this, 'SecurityHubEnablementFunction', {
      runtime: lambda.Runtime.PYTHON_3_12,
      handler: 'index.handler',
      timeout: Duration.seconds(120),
      code: lambda.Code.fromInline(`
import json
import boto3
import urllib3

def send_response(event, context, status, data, reason=None):
    response_body = {
        'Status': status,
        'Reason': reason or f'See CloudWatch Log Stream: {context.log_stream_name}',
        'PhysicalResourceId': context.log_stream_name,
        'StackId': event['StackId'],
        'RequestId': event['RequestId'],
        'LogicalResourceId': event['LogicalResourceId'],
        'Data': data
    }
    http = urllib3.PoolManager()
    http.request('PUT', event['ResponseURL'], body=json.dumps(response_body).encode('utf-8'), headers={'Content-Type': ''})

def handler(event, context):
    sh = boto3.client('securityhub')
    region = event['ResourceProperties']['Region']
    
    try:
        if event['RequestType'] == 'Delete':
            send_response(event, context, 'SUCCESS', {})
            return
        
        hub_arn = ''
        standards_arns = []
        
        # Check if Security Hub is already enabled
        try:
            hub_response = sh.describe_hub()
            hub_arn = hub_response.get('HubArn', '')
            print(f'Security Hub already enabled: {hub_arn}')
        except sh.exceptions.InvalidAccessException:
            print('Security Hub not enabled, enabling now...')
            try:
                enable_response = sh.enable_security_hub(
                    ControlFindingGenerator='SECURITY_CONTROL'
                )
                hub_arn = enable_response.get('HubArn', '')
                print(f'Security Hub enabled: {hub_arn}')
            except Exception as e:
                if 'already exists' in str(e).lower():
                    print('Security Hub already exists, retrieving...')
                    hub_response = sh.describe_hub()
                    hub_arn = hub_response.get('HubArn', '')
                else:
                    raise
        except Exception as e:
            error_msg = str(e).lower()
            if 'not subscribed' in error_msg or 'invalidaccess' in error_msg:
                print('Security Hub not enabled, enabling now...')
                enable_response = sh.enable_security_hub(
                    ControlFindingGenerator='SECURITY_CONTROL'
                )
                hub_arn = enable_response.get('HubArn', '')
            else:
                raise
        
        # Enable PCI-DSS standard
        pci_arn = f'arn:aws:securityhub:{region}::standards/pci-dss/v/3.2.1'
        try:
            pci_response = sh.batch_enable_standards(
                StandardsSubscriptionRequests=[{
                    'StandardsArn': pci_arn
                }]
            )
            if pci_response.get('StandardsSubscriptions'):
                standards_arns.append(pci_response['StandardsSubscriptions'][0]['StandardsSubscriptionArn'])
            print(f'PCI-DSS standard enabled')
        except Exception as e:
            if 'already exists' in str(e).lower() or 'already subscribed' in str(e).lower():
                print('PCI-DSS standard already enabled')
                # Get existing subscription
                standards = sh.get_enabled_standards()
                for std in standards.get('StandardsSubscriptions', []):
                    if 'pci-dss' in std['StandardsArn']:
                        standards_arns.append(std['StandardsSubscriptionArn'])
            else:
                print(f'Warning: Could not enable PCI-DSS standard: {e}')
        
        # Enable AWS Foundational Security Best Practices
        aws_arn = f'arn:aws:securityhub:{region}::standards/aws-foundational-security-best-practices/v/1.0.0'
        try:
            aws_response = sh.batch_enable_standards(
                StandardsSubscriptionRequests=[{
                    'StandardsArn': aws_arn
                }]
            )
            if aws_response.get('StandardsSubscriptions'):
                standards_arns.append(aws_response['StandardsSubscriptions'][0]['StandardsSubscriptionArn'])
            print(f'AWS Foundational Security Best Practices enabled')
        except Exception as e:
            if 'already exists' in str(e).lower() or 'already subscribed' in str(e).lower():
                print('AWS Foundational Security Best Practices already enabled')
                # Get existing subscription
                standards = sh.get_enabled_standards()
                for std in standards.get('StandardsSubscriptions', []):
                    if 'aws-foundational-security-best-practices' in std['StandardsArn']:
                        standards_arns.append(std['StandardsSubscriptionArn'])
            else:
                print(f'Warning: Could not enable AWS Foundational standard: {e}')
        
        send_response(event, context, 'SUCCESS', {
            'HubArn': hub_arn,
            'StandardsArns': ','.join(standards_arns)
        })
    except Exception as e:
        print(f'Error: {e}')
        import traceback
        traceback.print_exc()
        send_response(event, context, 'FAILED', {'Error': str(e)}, str(e))
      `)
    });
    
    securityHubEnablementFunction.addToRolePolicy(new iam.PolicyStatement({
      actions: [
        'securityhub:DescribeHub',
        'securityhub:EnableSecurityHub',
        'securityhub:GetFindings',
        'securityhub:ListEnabledProductsForImport',
        'securityhub:BatchEnableStandards',
        'securityhub:GetEnabledStandards',
        'securityhub:TagResource'
      ],
      resources: ['*']
    }));
    
    const securityHubEnablement = new CustomResource(this, 'SecurityHubEnablement', {
      serviceToken: new cr.Provider(this, 'SecurityHubEnablementProvider', {
        onEventHandler: securityHubEnablementFunction
      }).serviceToken,
      properties: {
        Region: this.region
      }
    });

    const modelBucket = new s3.Bucket(this, 'ModelArtifactsBucket', {
      bucketName: `fraud-model-artifacts-${environmentSuffix}-${this.account}`,
      versioned: true,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      enforceSSL: true
    });
    
    Tags.of(modelBucket).add('Owner', 'FinTechMLOps');
    Tags.of(modelBucket).add('CostCenter', 'ML-Infrastructure');
    Tags.of(modelBucket).add('Application', 'FraudPrediction');

    const modelUploadFunction = new lambda.Function(this, 'ModelUploadFunction', {
      runtime: lambda.Runtime.PYTHON_3_12,
      handler: 'index.handler',
      timeout: Duration.seconds(120),
      memorySize: 512,
      code: lambda.Code.fromInline(`
import json
import boto3
import tarfile
import io
import cfnresponse

def handler(event, context):
    try:
        if event['RequestType'] == 'Delete':
            cfnresponse.send(event, context, cfnresponse.SUCCESS, {})
            return
        
        bucket = event['ResourceProperties']['BucketName']
        key = event['ResourceProperties']['Key']
        
        s3 = boto3.client('s3')
        
        # Create custom inference script
        inference_code = '''
import json

def model_fn(model_dir):
    return {"status": "loaded"}

def predict_fn(data, model):
    return {
        "prediction": "not_fraud",
        "confidence": 0.85,
        "model_version": "1.0.0"
    }

def input_fn(request_body, content_type):
    if content_type == "application/json":
        return json.loads(request_body)
    return request_body

def output_fn(prediction, accept):
    return json.dumps(prediction), "application/json"
'''
        
        # Create model.tar.gz with inference script
        tar_buffer = io.BytesIO()
        with tarfile.open(fileobj=tar_buffer, mode='w:gz') as tar:
            # Add inference script
            inference_bytes = inference_code.encode('utf-8')
            info = tarfile.TarInfo(name='code/inference.py')
            info.size = len(inference_bytes)
            tar.addfile(info, io.BytesIO(inference_bytes))
            
            # Add empty model file to satisfy container
            model_bytes = b'dummy'
            info2 = tarfile.TarInfo(name='xgboost-model')
            info2.size = len(model_bytes)
            tar.addfile(info2, io.BytesIO(model_bytes))
        
        tar_buffer.seek(0)
        s3.put_object(Bucket=bucket, Key=key, Body=tar_buffer.read())
        
        cfnresponse.send(event, context, cfnresponse.SUCCESS, {'ObjectKey': key})
    except Exception as e:
        print(f'Error: {e}')
        import traceback
        traceback.print_exc()
        cfnresponse.send(event, context, cfnresponse.FAILED, {'Error': str(e)})
      `)
    });
    
    modelBucket.grantPut(modelUploadFunction);
    
    const modelUpload = new CustomResource(this, 'ModelUpload', {
      serviceToken: new cr.Provider(this, 'ModelUploadProvider', {
        onEventHandler: modelUploadFunction
      }).serviceToken,
      properties: {
        BucketName: modelBucket.bucketName,
        Key: 'fraud-model/model.tar.gz'
      }
    });

    const predictionTable = new dynamodb.Table(this, 'PredictionRecordsTable', {
      tableName: `fraud-predictions-${environmentSuffix}`,
      partitionKey: { name: 'requestId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'timestamp', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
      removalPolicy: RemovalPolicy.DESTROY,
      pointInTimeRecovery: true,
      stream: dynamodb.StreamViewType.NEW_AND_OLD_IMAGES
    });
    
    predictionTable.addGlobalSecondaryIndex({
      indexName: 'ModelVersionIndex',
      partitionKey: { name: 'modelVersion', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'timestamp', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL
    });
    
    predictionTable.addGlobalSecondaryIndex({
      indexName: 'CorrelationIdIndex',
      partitionKey: { name: 'correlationId', type: dynamodb.AttributeType.STRING },
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
    modelRepository.grantPull(sagemakerExecutionRole);
    
    sagemakerExecutionRole.addToPolicy(new iam.PolicyStatement({
      actions: [
        'logs:CreateLogGroup',
        'logs:CreateLogStream',
        'logs:PutLogEvents'
      ],
      resources: ['*']
    }));
    
    sagemakerExecutionRole.addToPolicy(new iam.PolicyStatement({
      actions: ['ecr:GetAuthorizationToken'],
      resources: ['*']
    }));
    
    sagemakerExecutionRole.addToPolicy(new iam.PolicyStatement({
      actions: [
        'ecr:BatchCheckLayerAvailability',
        'ecr:GetDownloadUrlForLayer',
        'ecr:BatchGetImage'
      ],
      resources: [
        modelRepository.repositoryArn,
        `arn:aws:ecr:${this.region}:763104351884:repository/*`
      ]
    }));
    
    // SageMaker resources - only create if not running in LocalStack
    let endpointName = `fraud-endpoint-${environmentSuffix}`;
    let sagemakerModel;
    let endpointConfig;
    let endpoint;

    if (!isLocalStack) {
      sagemakerModel = new sagemaker.CfnModel(this, 'FraudDetectionModel', {
        modelName: `fraud-model-${environmentSuffix}`,
        executionRoleArn: sagemakerExecutionRole.roleArn,
        primaryContainer: {
          image: `763104351884.dkr.ecr.${this.region}.amazonaws.com/pytorch-inference:2.0.0-cpu-py310`,
          modelDataUrl: `s3://${modelBucket.bucketName}/fraud-model/model.tar.gz`,
          environment: {
            MODEL_VERSION: '1.0.0',
            SAGEMAKER_PROGRAM: 'inference.py',
            SAGEMAKER_SUBMIT_DIRECTORY: `/opt/ml/model/code`
          }
        },
        tags: [
          { key: 'Owner', value: 'FinTechMLOps' },
          { key: 'CostCenter', value: 'ML-Infrastructure' },
          { key: 'Application', value: 'FraudPrediction' },
          { key: 'Environment', value: environmentSuffix }
        ]
      });
      
      sagemakerModel.node.addDependency(modelUpload);

      endpointConfig = new sagemaker.CfnEndpointConfig(this, 'FraudEndpointConfig', {
        endpointConfigName: `fraud-endpoint-config-${environmentSuffix}`,
        productionVariants: [
          {
            initialInstanceCount: 2,
            instanceType: 'ml.t2.medium',
            modelName: sagemakerModel.attrModelName,
            variantName: 'AllTraffic',
            initialVariantWeight: 1.0
          }
        ],
        dataCaptureConfig: {
          enableCapture: true,
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
          { key: 'Application', value: 'FraudPrediction' },
          { key: 'Environment', value: environmentSuffix }
        ]
      });

      endpoint = new sagemaker.CfnEndpoint(this, 'FraudEndpoint', {
        endpointName: endpointName,
        endpointConfigName: endpointConfig.attrEndpointConfigName,
        tags: [
          { key: 'Owner', value: 'FinTechMLOps' },
          { key: 'CostCenter', value: 'ML-Infrastructure' },
          { key: 'Application', value: 'FraudPrediction' },
          { key: 'Environment', value: environmentSuffix }
        ]
      });
      
      endpointName = endpoint.attrEndpointName;
    }
    
    const alertTopic = new sns.Topic(this, 'FraudModelAlertsTopic', {
      topicName: `fraud-alerts-${environmentSuffix}`,
      displayName: `Fraud Model Alerts (${environmentSuffix})`
    });
    
    Tags.of(alertTopic).add('Owner', 'FinTechMLOps');
    Tags.of(alertTopic).add('CostCenter', 'ML-Infrastructure');
    Tags.of(alertTopic).add('Application', 'FraudPrediction');

    const lambdaRole = new iam.Role(this, 'PreprocessLambdaRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com')
    });

    lambdaRole.addToPolicy(new iam.PolicyStatement({
      actions: ['sagemaker:InvokeEndpoint'],
      resources: [`arn:aws:sagemaker:${this.region}:${this.account}:endpoint/${endpointName}`]
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
    
    const preprocessLambda = new lambda.Function(this, 'PreprocessLambda', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'index.handler',
      code: lambda.Code.fromInline(`
        export const handler = async (event) => {
          const AWS = await import('@aws-sdk/client-sagemaker-runtime');
          const DDB = await import('@aws-sdk/client-dynamodb');
          const CW = await import('@aws-sdk/client-cloudwatch');
          
          const smClient = new AWS.SageMakerRuntimeClient();
          const dbClient = new DDB.DynamoDBClient();
          const cwClient = new CW.CloudWatchClient();
          
          // Generate correlation ID for request tracing
          const correlationId = event.headers?.['X-Request-ID'] || 
                               event.headers?.['x-request-id'] || 
                               event.requestContext?.requestId || 
                               \`req-\${Date.now()}-\${Math.random().toString(36).substr(2, 9)}\`;
          const requestId = event.requestContext?.requestId || correlationId;
          const timestamp = new Date().toISOString();
          
          // Structured logging helper
          const log = (level, message, data = {}) => {
            console.log(JSON.stringify({
              level,
              message,
              correlationId,
              requestId,
              timestamp: new Date().toISOString(),
              ...data
            }));
          };
          
          log('INFO', 'Processing fraud detection request', { 
            endpoint: process.env.ENDPOINT_NAME,
            table: process.env.PREDICTION_TABLE
          });
          
          try {
            const payload = JSON.parse(event.body);
            log('INFO', 'Request payload parsed', { 
              transactionId: payload.transactionId,
              amount: payload.amount 
            });
            
            const transformedPayload = { ...payload, timestamp, correlationId };
            
            const command = new AWS.InvokeEndpointCommand({
              EndpointName: process.env.ENDPOINT_NAME,
              ContentType: 'application/json',
              Body: JSON.stringify(transformedPayload)
            });
            
            const startTime = Date.now();
            log('INFO', 'Invoking SageMaker endpoint');
            const response = await smClient.send(command);
            const endTime = Date.now();
            const latency = endTime - startTime;
            
            log('INFO', 'SageMaker endpoint invoked successfully', { latency });
            
            const responseBody = JSON.parse(Buffer.from(response.Body).toString());
            
            log('INFO', 'Storing prediction in DynamoDB');
            await dbClient.send(new DDB.PutItemCommand({
              TableName: process.env.PREDICTION_TABLE,
              Item: {
                requestId: { S: requestId },
                timestamp: { S: timestamp },
                correlationId: { S: correlationId },
                modelVersion: { S: '1.0.0' },
                predictionOutcome: { S: responseBody.prediction || 'unknown' },
                inputFeatures: { S: JSON.stringify(payload) },
                latencyMs: { N: latency.toString() }
              }
            }));
            
            const isHighRisk = responseBody.confidence < 0.6;
            const isAnomaly = Math.abs(responseBody.confidence - 0.85) > 0.3;
            const featureSum = Object.values(payload).reduce((sum, val) => {
              return sum + (typeof val === 'number' ? val : 0);
            }, 0);
            const featureMagnitude = Math.sqrt(featureSum);
            
            log('INFO', 'Publishing CloudWatch metrics', { 
              confidence: responseBody.confidence,
              isHighRisk,
              isAnomaly 
            });
            
            await cwClient.send(new CW.PutMetricDataCommand({
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
                },
                {
                  MetricName: 'ConfidenceDistribution',
                  Value: Math.floor(responseBody.confidence * 10) / 10,
                  Unit: 'None',
                  Dimensions: [
                    { Name: 'ModelVersion', Value: '1.0.0' },
                    { Name: 'ConfidenceBin', Value: String(Math.floor(responseBody.confidence * 10) / 10) }
                  ]
                },
                {
                  MetricName: 'FeatureMagnitude',
                  Value: featureMagnitude,
                  Unit: 'None',
                  Dimensions: [{ Name: 'ModelVersion', Value: '1.0.0' }]
                },
                {
                  MetricName: 'HighRiskPredictions',
                  Value: isHighRisk ? 1 : 0,
                  Unit: 'Count',
                  Dimensions: [{ Name: 'ModelVersion', Value: '1.0.0' }]
                },
                {
                  MetricName: 'AnomalyDetections',
                  Value: isAnomaly ? 1 : 0,
                  Unit: 'Count',
                  Dimensions: [{ Name: 'ModelVersion', Value: '1.0.0' }]
                },
                {
                  MetricName: 'PredictionLatency',
                  Value: latency,
                  Unit: 'Milliseconds',
                  Dimensions: [{ Name: 'ModelVersion', Value: '1.0.0' }]
                }
              ]
            }));
            
            log('INFO', 'Request processed successfully', { 
              prediction: responseBody.prediction,
              confidence: responseBody.confidence
            });
            
            return {
              statusCode: 200,
              headers: { 
                'Content-Type': 'application/json',
                'X-Request-ID': correlationId,
                'X-Correlation-ID': correlationId
              },
              body: JSON.stringify({
                requestId,
                correlationId,
                prediction: responseBody.prediction,
                confidence: responseBody.confidence,
                timestamp
              })
            };
          } catch (error) {
            log('ERROR', 'Request processing failed', { 
              errorName: error.name,
              errorMessage: error.message,
              errorStack: error.stack
            });
            
            await cwClient.send(new CW.PutMetricDataCommand({
              Namespace: 'FraudDetection/Errors',
              MetricData: [
                {
                  MetricName: 'ProcessingErrors',
                  Value: 1,
                  Unit: 'Count',
                  Dimensions: [{ Name: 'ModelVersion', Value: '1.0.0' }]
                },
                {
                  MetricName: 'ErrorRate',
                  Value: 1,
                  Unit: 'Count',
                  Dimensions: [
                    { Name: 'ErrorType', Value: error.name || 'UnknownError' },
                    { Name: 'ModelVersion', Value: '1.0.0' }
                  ]
                }
              ]
            })).catch(cwErr => {
              log('ERROR', 'Failed to publish error metrics', { 
                cloudwatchError: cwErr.message 
              });
            });
            
            return {
              statusCode: error.name === 'ValidationException' ? 400 : 500,
              headers: { 
                'Content-Type': 'application/json',
                'X-Request-ID': correlationId,
                'X-Correlation-ID': correlationId
              },
              body: JSON.stringify({ 
                error: error.message,
                errorType: error.name,
                requestId,
                correlationId,
                timestamp: new Date().toISOString()
              })
            };
          }
        };
      `),
      role: lambdaRole,
      environment: {
        ENDPOINT_NAME: endpointName,
        PREDICTION_TABLE: predictionTable.tableName,
      },
      timeout: Duration.seconds(30),
      memorySize: 1024,
      logRetention: logs.RetentionDays.TWO_WEEKS
    });
    
    Tags.of(preprocessLambda).add('Owner', 'FinTechMLOps');
    Tags.of(preprocessLambda).add('CostCenter', 'ML-Infrastructure');
    Tags.of(preprocessLambda).add('Application', 'FraudPrediction');

    const api = new apigateway.RestApi(this, 'FraudDetectionApi', {
      restApiName: `fraud-detection-api-${environmentSuffix}`,
      description: `Fraud Detection API for ${environmentSuffix} environment`,
      deployOptions: {
        stageName: 'prod',
        loggingLevel: apigateway.MethodLoggingLevel.INFO,
        dataTraceEnabled: true,
        metricsEnabled: true
      },
      endpointConfiguration: {
        types: [apigateway.EndpointType.REGIONAL]
      },
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: ['Content-Type', 'X-Amz-Date', 'Authorization', 'X-Api-Key', 'X-Request-ID'],
        allowCredentials: false,
        maxAge: Duration.hours(1)
      }
    });
    
    Tags.of(api).add('Owner', 'FinTechMLOps');
    Tags.of(api).add('CostCenter', 'ML-Infrastructure');
    Tags.of(api).add('Application', 'FraudPrediction');

    // Add request validator
    const requestValidator = new apigateway.RequestValidator(this, 'RequestValidator', {
      restApi: api,
      requestValidatorName: `fraud-api-validator-${environmentSuffix}`,
      validateRequestBody: true,
      validateRequestParameters: true
    });
    
    // Define request model
    const requestModel = new apigateway.Model(this, 'PredictionRequestModel', {
      restApi: api,
      contentType: 'application/json',
      modelName: 'PredictionRequest',
      schema: {
        type: apigateway.JsonSchemaType.OBJECT,
        required: ['transactionId', 'amount'],
        properties: {
          transactionId: { type: apigateway.JsonSchemaType.STRING },
          amount: { type: apigateway.JsonSchemaType.NUMBER, minimum: 0 },
          merchantCategory: { type: apigateway.JsonSchemaType.STRING },
          location: { type: apigateway.JsonSchemaType.STRING }
        }
      }
    });
    
    const predictions = api.root.addResource('predictions');
    predictions.addMethod('POST', new apigateway.LambdaIntegration(preprocessLambda), {
      apiKeyRequired: true,
      requestValidator: requestValidator,
      requestModels: {
        'application/json': requestModel
      }
    });
    
    const apiKey = api.addApiKey('FraudDetectionApiKey');
    const usagePlan = api.addUsagePlan('FraudDetectionUsagePlan', {
      name: 'FraudDetectionUsagePlan',
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
    usagePlan.addApiStage({
      stage: api.deploymentStage
    });

    const invocationMetric = new cloudwatch.Metric({
      namespace: 'AWS/SageMaker',
      metricName: 'Invocations',
      dimensionsMap: { EndpointName: endpointName },
      statistic: 'Sum',
      period: Duration.minutes(5)
    });
    
    const modelLatencyMetric = new cloudwatch.Metric({
      namespace: 'AWS/SageMaker',
      metricName: 'ModelLatency',
      dimensionsMap: { EndpointName: endpointName },
      statistic: 'Average',
      period: Duration.minutes(5)
    });
    
    const invocation4xxErrorsMetric = new cloudwatch.Metric({
      namespace: 'AWS/SageMaker',
      metricName: 'Invocation4XXErrors',
      dimensionsMap: { EndpointName: endpointName },
      statistic: 'Sum',
      period: Duration.minutes(5)
    });
    
    const predictionConfidenceMetric = new cloudwatch.Metric({
      namespace: 'FraudDetection/ModelDrift',
      metricName: 'PredictionConfidence',
      dimensionsMap: { ModelVersion: '1.0.0' },
      statistic: 'Average',
      period: Duration.hours(1)
    });
    
    const featureMagnitudeMetric = new cloudwatch.Metric({
      namespace: 'FraudDetection/ModelDrift',
      metricName: 'FeatureMagnitude',
      dimensionsMap: { ModelVersion: '1.0.0' },
      statistic: 'Average',
      period: Duration.hours(1)
    });
    
    const highRiskMetric = new cloudwatch.Metric({
      namespace: 'FraudDetection/ModelDrift',
      metricName: 'HighRiskPredictions',
      dimensionsMap: { ModelVersion: '1.0.0' },
      statistic: 'Sum',
      period: Duration.hours(1)
    });
    
    const anomalyMetric = new cloudwatch.Metric({
      namespace: 'FraudDetection/ModelDrift',
      metricName: 'AnomalyDetections',
      dimensionsMap: { ModelVersion: '1.0.0' },
      statistic: 'Sum',
      period: Duration.hours(1)
    });
    
    const errorRateMetric = new cloudwatch.Metric({
      namespace: 'FraudDetection/Errors',
      metricName: 'ErrorRate',
      dimensionsMap: { ModelVersion: '1.0.0' },
      statistic: 'Sum',
      period: Duration.minutes(5)
    });
    
    const dashboard = new cloudwatch.Dashboard(this, 'FraudDetectionDashboard', {
      dashboardName: `FraudDetection-${this.region}-${environmentSuffix}`
    });
    
    dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'Endpoint Invocations & Errors',
        left: [invocationMetric, invocation4xxErrorsMetric],
        right: [errorRateMetric],
        width: 12
      }),
      new cloudwatch.GraphWidget({
        title: 'Endpoint Latency',
        left: [modelLatencyMetric],
        width: 12
      }),
      new cloudwatch.GraphWidget({
        title: 'Model Confidence & Drift',
        left: [predictionConfidenceMetric, featureMagnitudeMetric],
        width: 12
      }),
      new cloudwatch.GraphWidget({
        title: 'Risk & Anomaly Detection',
        left: [highRiskMetric, anomalyMetric],
        width: 12
      })
    );
    
    Tags.of(dashboard).add('Owner', 'FinTechMLOps');
    Tags.of(dashboard).add('CostCenter', 'ML-Infrastructure');
    Tags.of(dashboard).add('Application', 'FraudPrediction');
    
    const latencyAlarm = new cloudwatch.Alarm(this, 'EndpointLatencyAlarm', {
      metric: modelLatencyMetric,
      threshold: 500,
      evaluationPeriods: 3,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD
    });
    
    const driftAlarm = new cloudwatch.Alarm(this, 'ModelDriftAlarm', {
      metric: predictionConfidenceMetric,
      threshold: 0.7,
      evaluationPeriods: 24,
      comparisonOperator: cloudwatch.ComparisonOperator.LESS_THAN_THRESHOLD
    });
    
    const featureDriftAlarm = new cloudwatch.Alarm(this, 'FeatureDriftAlarm', {
      metric: featureMagnitudeMetric,
      threshold: 100,
      evaluationPeriods: 6,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD
    });
    
    const anomalyAlarm = new cloudwatch.Alarm(this, 'AnomalyDetectionAlarm', {
      metric: anomalyMetric,
      threshold: 10,
      evaluationPeriods: 3,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD
    });
    
    const errorRateAlarm = new cloudwatch.Alarm(this, 'HighErrorRateAlarm', {
      metric: errorRateMetric,
      threshold: 5,
      evaluationPeriods: 2,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD
    });

    latencyAlarm.addAlarmAction(new cloudwatchActions.SnsAction(alertTopic));
    driftAlarm.addAlarmAction(new cloudwatchActions.SnsAction(alertTopic));
    featureDriftAlarm.addAlarmAction(new cloudwatchActions.SnsAction(alertTopic));
    anomalyAlarm.addAlarmAction(new cloudwatchActions.SnsAction(alertTopic));
    errorRateAlarm.addAlarmAction(new cloudwatchActions.SnsAction(alertTopic));
    
    const driftRule = new events.Rule(this, 'ModelDriftRule', {
      eventPattern: {
        source: ['aws.cloudwatch'],
        detailType: ['CloudWatch Alarm State Change'],
        detail: {
          alarmName: [
            latencyAlarm.alarmName,
            driftAlarm.alarmName,
            featureDriftAlarm.alarmName,
            anomalyAlarm.alarmName,
            errorRateAlarm.alarmName
          ]
        }
      }
    });
    
    driftRule.addTarget(new eventTargets.SnsTopic(alertTopic));
    
    new CfnOutput(this, 'ApiEndpoint', {
      value: api.url,
      description: 'Fraud Detection API endpoint URL',
      exportName: `${this.stackName}-ApiEndpoint`
    });
    
    new CfnOutput(this, 'SageMakerEndpoint', {
      value: endpointName,
      description: 'SageMaker endpoint name',
      exportName: `${this.stackName}-SageMakerEndpoint`
    });
    
    new CfnOutput(this, 'ModelBucketName', {
      value: modelBucket.bucketName,
      description: 'S3 bucket for model artifacts',
      exportName: `${this.stackName}-ModelBucket`
    });
    
    new CfnOutput(this, 'PredictionTableName', {
      value: predictionTable.tableName,
      description: 'DynamoDB table for prediction records',
      exportName: `${this.stackName}-PredictionTable`
    });
    
    new CfnOutput(this, 'ApiKeyId', {
      value: apiKey.keyId,
      description: 'API Gateway API Key ID',
      exportName: `${this.stackName}-ApiKeyId`
    });
    
    new CfnOutput(this, 'ModelRepositoryUri', {
      value: modelRepository.repositoryUri,
      description: 'ECR repository URI for fraud detection model container',
      exportName: `${this.stackName}-ModelRepositoryUri`
    });
  }
}
