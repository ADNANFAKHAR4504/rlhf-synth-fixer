## bin/tap.ts

```typescript
#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { TapStack } from '../lib/tap-stack';

const app = new cdk.App();

const primaryStack = new TapStack(app, 'Corp-TapStack-Primary', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: 'us-east-1'
  },
  isPrimary: true,
  backupRegion: 'us-west-2'
});

const backupStack = new TapStack(app, 'Corp-TapStack-Backup', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: 'us-west-2'
  },
  isPrimary: false,
  backupRegion: 'us-east-1'
});

backupStack.addDependency(primaryStack);
```

## lib/tap-stack.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import * as s3n from 'aws-cdk-lib/aws-s3-notifications';
import { Construct } from 'constructs';

export interface TapStackProps extends cdk.StackProps {
  isPrimary: boolean;
  backupRegion: string;
}

export class TapStack extends cdk.Stack {
  public readonly bucket: s3.Bucket;

  constructor(scope: Construct, id: string, props: TapStackProps) {
    super(scope, id, props);

    const currentRegion = this.region;
    const { isPrimary, backupRegion } = props;

    this.bucket = new s3.Bucket(this, 'Corp-DataBucket', {
      bucketName: `corp-data-bucket-${currentRegion}-${this.account}`,
      versioned: true,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      lifecycleRules: [{
        id: 'Corp-LifecycleRule',
        enabled: true,
        noncurrentVersionExpiration: cdk.Duration.days(90)
      }]
    });

    const lambdaRole = new iam.Role(this, 'Corp-LambdaRole', {
      roleName: `Corp-LambdaRole-${currentRegion}`,
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole')
      ],
      inlinePolicies: {
        'Corp-S3ReplicationPolicy': new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                's3:GetObject',
                's3:GetObjectVersion',
                's3:PutObject',
                's3:PutObjectAcl',
                's3:DeleteObject'
              ],
              resources: [
                `arn:aws:s3:::corp-data-bucket-${currentRegion}-${this.account}/*`,
                `arn:aws:s3:::corp-data-bucket-${backupRegion}-${this.account}/*`
              ]
            }),
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                's3:ListBucket',
                's3:GetBucketVersioning'
              ],
              resources: [
                `arn:aws:s3:::corp-data-bucket-${currentRegion}-${this.account}`,
                `arn:aws:s3:::corp-data-bucket-${backupRegion}-${this.account}`
              ]
            }),
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'cloudwatch:PutMetricData'
              ],
              resources: ['*']
            })
          ]
        })
      }
    });

    const replicationFunction = new lambda.Function(this, 'Corp-ReplicationFunction', {
      functionName: `Corp-ReplicationFunction-${currentRegion}`,
      runtime: lambda.Runtime.PYTHON_3_9,
      handler: 'index.lambda_handler',
      role: lambdaRole,
      timeout: cdk.Duration.minutes(5),
      environment: {
        SOURCE_BUCKET: this.bucket.bucketName,
        DESTINATION_BUCKET: `corp-data-bucket-${backupRegion}-${this.account}`,
        DESTINATION_REGION: backupRegion,
        SOURCE_REGION: currentRegion
      },
      code: lambda.Code.fromInline(`
import boto3
import json
import os
import urllib.parse
from datetime import datetime

def lambda_handler(event, context):
    s3_client = boto3.client('s3')
    dest_s3_client = boto3.client('s3', region_name=os.environ['DESTINATION_REGION'])
    cloudwatch = boto3.client('cloudwatch')
    
    source_bucket = os.environ['SOURCE_BUCKET']
    dest_bucket = os.environ['DESTINATION_BUCKET']
    
    for record in event['Records']:
        bucket = record['s3']['bucket']['name']
        key = urllib.parse.unquote_plus(record['s3']['object']['key'], encoding='utf-8')
        
        try:
            if record['eventName'].startswith('ObjectCreated'):
                copy_source = {'Bucket': bucket, 'Key': key}
                dest_s3_client.copy_object(
                    CopySource=copy_source,
                    Bucket=dest_bucket,
                    Key=key,
                    ServerSideEncryption='AES256'
                )
                
                cloudwatch.put_metric_data(
                    Namespace='Corp/S3Replication',
                    MetricData=[
                        {
                            'MetricName': 'ObjectsReplicated',
                            'Value': 1,
                            'Unit': 'Count',
                            'Dimensions': [
                                {
                                    'Name': 'SourceRegion',
                                    'Value': os.environ['SOURCE_REGION']
                                },
                                {
                                    'Name': 'DestinationRegion',
                                    'Value': os.environ['DESTINATION_REGION']
                                }
                            ]
                        }
                    ]
                )
                
            elif record['eventName'].startswith('ObjectRemoved'):
                dest_s3_client.delete_object(Bucket=dest_bucket, Key=key)
                
        except Exception as e:
            print(f"Error processing {key}: {str(e)}")
            
            cloudwatch.put_metric_data(
                Namespace='Corp/S3Replication',
                MetricData=[
                    {
                        'MetricName': 'ReplicationErrors',
                        'Value': 1,
                        'Unit': 'Count',
                        'Dimensions': [
                            {
                                'Name': 'SourceRegion',
                                'Value': os.environ['SOURCE_REGION']
                            },
                            {
                                'Name': 'DestinationRegion',
                                'Value': os.environ['DESTINATION_REGION']
                            }
                        ]
                    }
                ]
            )
            raise e
    
    return {'statusCode': 200, 'body': json.dumps('Replication completed')}
      `)
    });

    this.bucket.addEventNotification(
      s3.EventType.OBJECT_CREATED,
      new s3n.LambdaDestination(replicationFunction)
    );

    this.bucket.addEventNotification(
      s3.EventType.OBJECT_REMOVED,
      new s3n.LambdaDestination(replicationFunction)
    );

    const dashboard = new cloudwatch.Dashboard(this, 'Corp-ReplicationDashboard', {
      dashboardName: `Corp-ReplicationDashboard-${currentRegion}`,
      widgets: [
        [
          new cloudwatch.GraphWidget({
            title: 'Objects Replicated',
            left: [
              new cloudwatch.Metric({
                namespace: 'Corp/S3Replication',
                metricName: 'ObjectsReplicated',
                dimensionsMap: {
                  SourceRegion: currentRegion,
                  DestinationRegion: backupRegion
                },
                statistic: 'Sum'
              })
            ],
            width: 12,
            height: 6
          })
        ],
        [
          new cloudwatch.GraphWidget({
            title: 'Replication Errors',
            left: [
              new cloudwatch.Metric({
                namespace: 'Corp/S3Replication',
                metricName: 'ReplicationErrors',
                dimensionsMap: {
                  SourceRegion: currentRegion,
                  DestinationRegion: backupRegion
                },
                statistic: 'Sum'
              })
            ],
            width: 12,
            height: 6
          })
        ],
        [
          new cloudwatch.GraphWidget({
            title: 'Lambda Function Duration',
            left: [
              new cloudwatch.Metric({
                namespace: 'AWS/Lambda',
                metricName: 'Duration',
                dimensionsMap: {
                  FunctionName: replicationFunction.functionName
                },
                statistic: 'Average'
              })
            ],
            width: 6,
            height: 6
          }),
          new cloudwatch.GraphWidget({
            title: 'Lambda Function Errors',
            left: [
              new cloudwatch.Metric({
                namespace: 'AWS/Lambda',
                metricName: 'Errors',
                dimensionsMap: {
                  FunctionName: replicationFunction.functionName
                },
                statistic: 'Sum'
              })
            ],
            width: 6,
            height: 6
          })
        ],
        [
          new cloudwatch.SingleValueWidget({
            title: 'S3 Bucket Objects',
            metrics: [
              new cloudwatch.Metric({
                namespace: 'AWS/S3',
                metricName: 'NumberOfObjects',
                dimensionsMap: {
                  BucketName: this.bucket.bucketName,
                  StorageType: 'AllStorageTypes'
                },
                statistic: 'Average'
              })
            ],
            width: 6,
            height: 6
          }),
          new cloudwatch.SingleValueWidget({
            title: 'S3 Bucket Size (Bytes)',
            metrics: [
              new cloudwatch.Metric({
                namespace: 'AWS/S3',
                metricName: 'BucketSizeBytes',
                dimensionsMap: {
                  BucketName: this.bucket.bucketName,
                  StorageType: 'StandardStorage'
                },
                statistic: 'Average'
              })
            ],
            width: 6,
            height: 6
          })
        ]
      ]
    });

    const healthCheckFunction = new lambda.Function(this, 'Corp-HealthCheckFunction', {
      functionName: `Corp-HealthCheckFunction-${currentRegion}`,
      runtime: lambda.Runtime.PYTHON_3_9,
      handler: 'index.lambda_handler',
      role: lambdaRole,
      timeout: cdk.Duration.minutes(2),
      environment: {
        SOURCE_BUCKET: this.bucket.bucketName,
        DESTINATION_BUCKET: `corp-data-bucket-${backupRegion}-${this.account}`,
        DESTINATION_REGION: backupRegion,
        SOURCE_REGION: currentRegion
      },
      code: lambda.Code.fromInline(`
import boto3
import json
import os
from datetime import datetime

def lambda_handler(event, context):
    s3_client = boto3.client('s3')
    dest_s3_client = boto3.client('s3', region_name=os.environ['DESTINATION_REGION'])
    cloudwatch = boto3.client('cloudwatch')
    
    source_bucket = os.environ['SOURCE_BUCKET']
    dest_bucket = os.environ['DESTINATION_BUCKET']
    
    try:
        source_objects = s3_client.list_objects_v2(Bucket=source_bucket)
        dest_objects = dest_s3_client.list_objects_v2(Bucket=dest_bucket)
        
        source_count = source_objects.get('KeyCount', 0)
        dest_count = dest_objects.get('KeyCount', 0)
        
        sync_percentage = (dest_count / source_count * 100) if source_count > 0 else 100
        
        cloudwatch.put_metric_data(
            Namespace='Corp/S3Replication',
            MetricData=[
                {
                    'MetricName': 'SyncPercentage',
                    'Value': sync_percentage,
                    'Unit': 'Percent',
                    'Dimensions': [
                        {
                            'Name': 'SourceRegion',
                            'Value': os.environ['SOURCE_REGION']
                        },
                        {
                            'Name': 'DestinationRegion',
                            'Value': os.environ['DESTINATION_REGION']
                        }
                    ]
                }
            ]
        )
        
        return {
            'statusCode': 200,
            'body': json.dumps({
                'source_objects': source_count,
                'destination_objects': dest_count,
                'sync_percentage': sync_percentage
            })
        }
        
    except Exception as e:
        print(f"Health check error: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }
      `)
    });

    const healthCheckRule = new events.Rule(this, 'Corp-HealthCheckRule', {
      ruleName: `Corp-HealthCheckRule-${currentRegion}`,
      schedule: events.Schedule.rate(cdk.Duration.minutes(15))
    });

    healthCheckRule.addTarget(new targets.LambdaFunction(healthCheckFunction));

    new cdk.CfnOutput(this, 'Corp-BucketName', {
      value: this.bucket.bucketName,
      exportName: `Corp-BucketName-${currentRegion}`
    });

    new cdk.CfnOutput(this, 'Corp-ReplicationFunctionArn', {
      value: replicationFunction.functionArn,
      exportName: `Corp-ReplicationFunctionArn-${currentRegion}`
    });

    new cdk.CfnOutput(this, 'Corp-DashboardUrl', {
      value: `https://${currentRegion}.console.aws.amazon.com/cloudwatch/home?region=${currentRegion}#dashboards:name=${dashboard.dashboardName}`,
      exportName: `Corp-DashboardUrl-${currentRegion}`
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
    "@aws-cdk-lib/aws-s3:createDefaultLoggingPolicy": true,
    "@aws-cdk/aws-ec2:uniqueImdsv2TemplateName": true,
    "@aws-cdk/aws-ecs:arnFormatIncludesClusterName": true,
    "@aws-cdk/aws-iam:minimizePolicies": true,
    "@aws-cdk/core:validateSnapshotRemovalPolicy": true,
    "@aws-cdk/aws-codepipeline:crossAccountKeyAliasStackSafeResourceName": true,
    "@aws-cdk/aws-s3:serverAccessLogsUseBucketPolicy": true,
    "@aws-cdk/aws-s3-deployment:useDefaultSourceKeyCondition": true,
    "@aws-cdk/aws-rds:databaseProxyUniqueResourceName": true,
    "@aws-cdk/aws-codedeploy:removeAlarmsFromDeploymentGroup": true,
    "@aws-cdk/aws-apigateway:authorizerChangeRequiresRestApiRedeployment": true,
    "@aws-cdk/aws-cloudformation:parseTemplateParameter": true,
    "@aws-cdk/aws-lambda:recognizeVersionProps": true,
    "@aws-cdk/aws-lambda:recognizeLayerVersion": true,
    "@aws-cdk/core:includePrefixInUniqueNameGeneration": true,
    "@aws-cdk/aws-opensearchservice:enableLogging": true,
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
    "@aws-cdk/aws-elasticloadbalancingv2:enableEndpointServiceTlsPolicy": true,
    "@aws-cdk/core:stackRelativeExports": true
  }
}
```