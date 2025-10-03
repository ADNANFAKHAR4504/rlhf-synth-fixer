# CloudFormation Template for Serverless Weather Monitoring System with Time Series Analytics

## CloudFormation Template - TapStack.json

```json
{
  "AWSTemplateFormatVersion": "2010-09-09",
  "Description": "Serverless Weather Monitoring System - Processes 5,200 daily sensor readings with real-time aggregation, time series analytics, and automated reporting",
  "Parameters": {
    "EnvironmentSuffix": {
      "Type": "String",
      "Default": "dev",
      "Description": "Environment suffix for resource naming",
      "AllowedPattern": "^[a-zA-Z0-9]+$"
    },
    "S3BucketForFailedEvents": {
      "Type": "String",
      "Default": "",
      "Description": "S3 bucket name for failed Lambda events (optional)"
    }
  },
  "Conditions": {
    "HasFailedEventsBucket": {
      "Fn::Not": [
        {
          "Fn::Equals": [
            { "Ref": "S3BucketForFailedEvents" },
            ""
          ]
        }
      ]
    }
  },
  "Resources": {
    "WeatherReadingsTable": {
      "Type": "AWS::DynamoDB::Table",
      "Properties": {
        "TableName": {
          "Fn::Sub": "WeatherReadings-${EnvironmentSuffix}"
        },
        "AttributeDefinitions": [
          {
            "AttributeName": "sensorId",
            "AttributeType": "S"
          },
          {
            "AttributeName": "timestamp",
            "AttributeType": "N"
          }
        ],
        "KeySchema": [
          {
            "AttributeName": "sensorId",
            "KeyType": "HASH"
          },
          {
            "AttributeName": "timestamp",
            "KeyType": "RANGE"
          }
        ],
        "BillingMode": "PROVISIONED",
        "ProvisionedThroughput": {
          "ReadCapacityUnits": 5,
          "WriteCapacityUnits": 5
        },
        "StreamSpecification": {
          "StreamViewType": "NEW_AND_OLD_IMAGES"
        },
        "PointInTimeRecoverySpecification": {
          "PointInTimeRecoveryEnabled": false
        },
        "Tags": [
          {
            "Key": "Application",
            "Value": "WeatherMonitoring"
          },
          {
            "Key": "Environment",
            "Value": { "Ref": "EnvironmentSuffix" }
          }
        ]
      }
    },
    "TableReadScalingTarget": {
      "Type": "AWS::ApplicationAutoScaling::ScalableTarget",
      "Properties": {
        "ServiceNamespace": "dynamodb",
        "ResourceId": {
          "Fn::Sub": "table/${WeatherReadingsTable}"
        },
        "ScalableDimension": "dynamodb:table:ReadCapacityUnits",
        "MinCapacity": 5,
        "MaxCapacity": 100,
        "RoleARN": {
          "Fn::GetAtt": ["DynamoDBAutoScalingRole", "Arn"]
        }
      }
    },
    "TableReadScalingPolicy": {
      "Type": "AWS::ApplicationAutoScaling::ScalingPolicy",
      "Properties": {
        "PolicyName": {
          "Fn::Sub": "WeatherReadings-ReadAutoScaling-${EnvironmentSuffix}"
        },
        "PolicyType": "TargetTrackingScaling",
        "ScalingTargetId": {
          "Ref": "TableReadScalingTarget"
        },
        "TargetTrackingScalingPolicyConfiguration": {
          "TargetValue": 70,
          "ScaleInCooldown": 60,
          "ScaleOutCooldown": 60,
          "PredefinedMetricSpecification": {
            "PredefinedMetricType": "DynamoDBReadCapacityUtilization"
          }
        }
      }
    },
    "TableWriteScalingTarget": {
      "Type": "AWS::ApplicationAutoScaling::ScalableTarget",
      "Properties": {
        "ServiceNamespace": "dynamodb",
        "ResourceId": {
          "Fn::Sub": "table/${WeatherReadingsTable}"
        },
        "ScalableDimension": "dynamodb:table:WriteCapacityUnits",
        "MinCapacity": 5,
        "MaxCapacity": 100,
        "RoleARN": {
          "Fn::GetAtt": ["DynamoDBAutoScalingRole", "Arn"]
        }
      }
    },
    "TableWriteScalingPolicy": {
      "Type": "AWS::ApplicationAutoScaling::ScalingPolicy",
      "Properties": {
        "PolicyName": {
          "Fn::Sub": "WeatherReadings-WriteAutoScaling-${EnvironmentSuffix}"
        },
        "PolicyType": "TargetTrackingScaling",
        "ScalingTargetId": {
          "Ref": "TableWriteScalingTarget"
        },
        "TargetTrackingScalingPolicyConfiguration": {
          "TargetValue": 70,
          "ScaleInCooldown": 60,
          "ScaleOutCooldown": 60,
          "PredefinedMetricSpecification": {
            "PredefinedMetricType": "DynamoDBWriteCapacityUtilization"
          }
        }
      }
    },
    "DynamoDBAutoScalingRole": {
      "Type": "AWS::IAM::Role",
      "Properties": {
        "AssumeRolePolicyDocument": {
          "Version": "2012-10-17",
          "Statement": [
            {
              "Effect": "Allow",
              "Principal": {
                "Service": "application-autoscaling.amazonaws.com"
              },
              "Action": "sts:AssumeRole"
            }
          ]
        },
        "ManagedPolicyArns": [
          "arn:aws:iam::aws:policy/service-role/DynamoDBAutoscalingRole"
        ]
      }
    },
    "TimestreamDatabase": {
      "Type": "AWS::Timestream::Database",
      "Properties": {
        "DatabaseName": "WeatherMonitoring"
      }
    },
    "TimestreamTable": {
      "Type": "AWS::Timestream::Table",
      "DependsOn": "TimestreamDatabase",
      "Properties": {
        "DatabaseName": "WeatherMonitoring",
        "TableName": "SensorData",
        "RetentionProperties": {
          "MemoryStoreRetentionPeriodInHours": 168,
          "MagneticStoreRetentionPeriodInDays": 365
        },
        "MagneticStoreWriteProperties": {
          "EnableMagneticStoreWrites": true
        }
      }
    },
    "WeatherAnomalyTopic": {
      "Type": "AWS::SNS::Topic",
      "Properties": {
        "TopicName": {
          "Fn::Sub": "WeatherAnomalies-${EnvironmentSuffix}"
        },
        "DisplayName": "Weather Anomaly Alerts",
        "KmsMasterKeyId": "alias/aws/sns"
      }
    },
    "DataAggregationLambdaRole": {
      "Type": "AWS::IAM::Role",
      "Properties": {
        "AssumeRolePolicyDocument": {
          "Version": "2012-10-17",
          "Statement": [
            {
              "Effect": "Allow",
              "Principal": {
                "Service": "lambda.amazonaws.com"
              },
              "Action": "sts:AssumeRole"
            }
          ]
        },
        "ManagedPolicyArns": [
          "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
        ],
        "Policies": [
          {
            "PolicyName": "DynamoDBAccess",
            "PolicyDocument": {
              "Version": "2012-10-17",
              "Statement": [
                {
                  "Effect": "Allow",
                  "Action": [
                    "dynamodb:PutItem",
                    "dynamodb:GetItem",
                    "dynamodb:Query",
                    "dynamodb:BatchWriteItem"
                  ],
                  "Resource": {
                    "Fn::GetAtt": ["WeatherReadingsTable", "Arn"]
                  }
                },
                {
                  "Effect": "Allow",
                  "Action": [
                    "sns:Publish"
                  ],
                  "Resource": {
                    "Ref": "WeatherAnomalyTopic"
                  }
                },
                {
                  "Effect": "Allow",
                  "Action": [
                    "cloudwatch:PutMetricData"
                  ],
                  "Resource": "*"
                },
                {
                  "Effect": "Allow",
                  "Action": [
                    "timestream:WriteRecords",
                    "timestream:DescribeEndpoints"
                  ],
                  "Resource": [
                    {
                      "Fn::GetAtt": ["TimestreamTable", "Arn"]
                    }
                  ]
                }
              ]
            }
          }
        ]
      }
    },
    "DataAggregationFunction": {
      "Type": "AWS::Lambda::Function",
      "Properties": {
        "FunctionName": {
          "Fn::Sub": "WeatherDataAggregation-${EnvironmentSuffix}"
        },
        "Runtime": "python3.11",
        "Handler": "index.lambda_handler",
        "Role": {
          "Fn::GetAtt": ["DataAggregationLambdaRole", "Arn"]
        },
        "Code": {
          "ZipFile": |
            import json
            import boto3
            import os
            from decimal import Decimal
            from datetime import datetime
            import logging

            logger = logging.getLogger()
            logger.setLevel(logging.INFO)

            dynamodb = boto3.resource('dynamodb')
            sns = boto3.client('sns')
            cloudwatch = boto3.client('cloudwatch')
            timestream = boto3.client('timestream-write')

            TABLE_NAME = os.environ['TABLE_NAME']
            SNS_TOPIC_ARN = os.environ['SNS_TOPIC_ARN']

            def lambda_handler(event, context):
                try:
                    # Parse the incoming sensor data
                    body = json.loads(event.get('body', '{}'))

                    sensor_id = body.get('sensorId')
                    temperature = body.get('temperature')
                    humidity = body.get('humidity')
                    pressure = body.get('pressure')
                    wind_speed = body.get('windSpeed')

                    if not sensor_id:
                        return {
                            'statusCode': 400,
                            'headers': {'Content-Type': 'application/json'},
                            'body': json.dumps({'error': 'sensorId is required'})
                        }

                    # Prepare item for DynamoDB
                    table = dynamodb.Table(TABLE_NAME)
                    timestamp = int(datetime.now().timestamp())

                    item = {
                        'sensorId': sensor_id,
                        'timestamp': timestamp,
                        'temperature': Decimal(str(temperature)) if temperature else None,
                        'humidity': Decimal(str(humidity)) if humidity else None,
                        'pressure': Decimal(str(pressure)) if pressure else None,
                        'windSpeed': Decimal(str(wind_speed)) if wind_speed else None,
                        'processedAt': datetime.utcnow().isoformat()
                    }

                    # Remove None values
                    item = {k: v for k, v in item.items() if v is not None}

                    # Store in DynamoDB
                    table.put_item(Item=item)

                    # Write to Timestream
                    try:
                        timestream_records = [{
                            'Time': str(timestamp * 1000),
                            'TimeUnit': 'MILLISECONDS',
                            'Dimensions': [
                                {'Name': 'sensorId', 'Value': sensor_id},
                                {'Name': 'location', 'Value': 'us-east-1'}
                            ],
                            'MeasureName': 'temperature',
                            'MeasureValue': str(temperature) if temperature else '0',
                            'MeasureValueType': 'DOUBLE'
                        }]

                        timestream.write_records(
                            DatabaseName='WeatherMonitoring',
                            TableName='SensorData',
                            Records=timestream_records
                        )
                    except Exception as ts_error:
                        logger.warning(f'Failed to write to Timestream: {str(ts_error)}')

                    # Check for anomalies
                    anomalies = []
                    if temperature and (temperature > 50 or temperature < -30):
                        anomalies.append(f'Extreme temperature: {temperature}°C')
                    if humidity and (humidity > 95 or humidity < 5):
                        anomalies.append(f'Extreme humidity: {humidity}%')
                    if wind_speed and wind_speed > 150:
                        anomalies.append(f'Extreme wind speed: {wind_speed} km/h')

                    # Send SNS notification for anomalies
                    if anomalies:
                        message = {
                            'sensorId': sensor_id,
                            'timestamp': timestamp,
                            'anomalies': anomalies,
                            'data': body
                        }

                        sns.publish(
                            TopicArn=SNS_TOPIC_ARN,
                            Subject=f'Weather Anomaly Detected - Sensor {sensor_id}',
                            Message=json.dumps(message, default=str)
                        )

                        logger.warning(f'Anomalies detected for sensor {sensor_id}: {anomalies}')

                    # Send custom metrics to CloudWatch
                    cloudwatch.put_metric_data(
                        Namespace='WeatherMonitoring',
                        MetricData=[
                            {
                                'MetricName': 'ReadingsProcessed',
                                'Value': 1,
                                'Unit': 'Count',
                                'Dimensions': [
                                    {
                                        'Name': 'SensorId',
                                        'Value': sensor_id
                                    }
                                ]
                            }
                        ]
                    )

                    return {
                        'statusCode': 200,
                        'headers': {'Content-Type': 'application/json'},
                        'body': json.dumps({
                            'message': 'Data processed successfully',
                            'sensorId': sensor_id,
                            'timestamp': timestamp
                        })
                    }

                except json.JSONDecodeError:
                    logger.error('Invalid JSON in request body')
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json'},
                        'body': json.dumps({'error': 'Invalid JSON format'})
                    }
                except Exception as e:
                    logger.error(f'Unexpected error: {str(e)}')
                    # Log to CloudWatch
                    cloudwatch.put_metric_data(
                        Namespace='WeatherMonitoring',
                        MetricData=[
                            {
                                'MetricName': 'ProcessingErrors',
                                'Value': 1,
                                'Unit': 'Count'
                            }
                        ]
                    )
                    return {
                        'statusCode': 500,
                        'headers': {'Content-Type': 'application/json'},
                        'body': json.dumps({'error': 'Internal server error'})
                    }
        },
        "Environment": {
          "Variables": {
            "TABLE_NAME": {
              "Ref": "WeatherReadingsTable"
            },
            "SNS_TOPIC_ARN": {
              "Ref": "WeatherAnomalyTopic"
            }
          }
        },
        "Timeout": 30,
        "MemorySize": 256,
        "ReservedConcurrentExecutions": 100,
        "DeadLetterConfig": {
          "Fn::If": [
            "HasFailedEventsBucket",
            {
              "TargetArn": {
                "Fn::GetAtt": ["FailedEventsQueue", "Arn"]
              }
            },
            { "Ref": "AWS::NoValue" }
          ]
        }
      }
    },
    "FailedEventsQueue": {
      "Type": "AWS::SQS::Queue",
      "Condition": "HasFailedEventsBucket",
      "Properties": {
        "QueueName": {
          "Fn::Sub": "WeatherFailedEvents-${EnvironmentSuffix}"
        },
        "MessageRetentionPeriod": 1209600,
        "VisibilityTimeout": 60
      }
    },
    "DataAggregationSchedulerRole": {
      "Type": "AWS::IAM::Role",
      "Properties": {
        "AssumeRolePolicyDocument": {
          "Version": "2012-10-17",
          "Statement": [
            {
              "Effect": "Allow",
              "Principal": {
                "Service": "scheduler.amazonaws.com"
              },
              "Action": "sts:AssumeRole"
            }
          ]
        },
        "Policies": [
          {
            "PolicyName": "SchedulerInvokePolicy",
            "PolicyDocument": {
              "Version": "2012-10-17",
              "Statement": [
                {
                  "Effect": "Allow",
                  "Action": "lambda:InvokeFunction",
                  "Resource": [
                    {
                      "Fn::GetAtt": ["DataAggregationFunction", "Arn"]
                    },
                    {
                      "Fn::GetAtt": ["ReportGenerationFunction", "Arn"]
                    }
                  ]
                }
              ]
            }
          }
        ]
      }
    },
    "HourlyAggregationSchedule": {
      "Type": "AWS::Scheduler::Schedule",
      "Properties": {
        "Name": {
          "Fn::Sub": "HourlyDataAggregation-${EnvironmentSuffix}"
        },
        "Description": "Trigger hourly data aggregation from DynamoDB to Timestream",
        "ScheduleExpression": "rate(1 hour)",
        "FlexibleTimeWindow": {
          "Mode": "FLEXIBLE",
          "MaximumWindowInMinutes": 15
        },
        "Target": {
          "Arn": {
            "Fn::GetAtt": ["DataAggregationFunction", "Arn"]
          },
          "RoleArn": {
            "Fn::GetAtt": ["DataAggregationSchedulerRole", "Arn"]
          },
          "Input": "{\"source\": \"EventBridge Scheduler\", \"action\": \"aggregate\"}"
        },
        "State": "ENABLED"
      }
    },
    "DailyReportSchedule": {
      "Type": "AWS::Scheduler::Schedule",
      "Properties": {
        "Name": {
          "Fn::Sub": "DailyWeatherReport-${EnvironmentSuffix}"
        },
        "Description": "Generate daily weather report at 2 AM UTC",
        "ScheduleExpression": "cron(0 2 * * ? *)",
        "ScheduleExpressionTimezone": "UTC",
        "FlexibleTimeWindow": {
          "Mode": "FLEXIBLE",
          "MaximumWindowInMinutes": 15
        },
        "Target": {
          "Arn": {
            "Fn::GetAtt": ["ReportGenerationFunction", "Arn"]
          },
          "RoleArn": {
            "Fn::GetAtt": ["DataAggregationSchedulerRole", "Arn"]
          },
          "Input": "{\"source\": \"EventBridge Scheduler\", \"reportType\": \"daily\"}"
        },
        "State": "ENABLED"
      }
    },
    "ReportGenerationFunction": {
      "Type": "AWS::Lambda::Function",
      "Properties": {
        "FunctionName": {
          "Fn::Sub": "WeatherReportGeneration-${EnvironmentSuffix}"
        },
        "Runtime": "python3.11",
        "Handler": "index.handler",
        "Role": {
          "Fn::GetAtt": ["ReportGenerationRole", "Arn"]
        },
        "Timeout": 60,
        "MemorySize": 512,
        "Environment": {
          "Variables": {
            "TIMESTREAM_DB": "WeatherMonitoring",
            "TIMESTREAM_TABLE": "SensorData",
            "SNS_TOPIC_ARN": {
              "Ref": "WeatherAnomalyTopic"
            }
          }
        },
        "Code": {
          "ZipFile": |
            import json
            import boto3
            from datetime import datetime, timedelta

            timestream_query = boto3.client('timestream-query')
            sns = boto3.client('sns')

            def handler(event, context):
                try:
                    # Query Timestream for daily aggregates
                    query = """
                    SELECT
                        DATE_FORMAT(time, '%Y-%m-%d') as date,
                        AVG(measure_value::double) as avg_temp,
                        MAX(measure_value::double) as max_temp,
                        MIN(measure_value::double) as min_temp,
                        COUNT(*) as reading_count
                    FROM "WeatherMonitoring"."SensorData"
                    WHERE time > ago(24h)
                    AND measure_name = 'temperature'
                    GROUP BY DATE_FORMAT(time, '%Y-%m-%d')
                    """

                    response = timestream_query.query(QueryString=query)

                    # Process results
                    report_data = []
                    for row in response['Rows']:
                        report_data.append({
                            'date': row['Data'][0]['ScalarValue'],
                            'avg_temp': float(row['Data'][1]['ScalarValue']),
                            'max_temp': float(row['Data'][2]['ScalarValue']),
                            'min_temp': float(row['Data'][3]['ScalarValue']),
                            'readings': int(row['Data'][4]['ScalarValue'])
                        })

                    # Send report via SNS
                    sns.publish(
                        TopicArn=os.environ['SNS_TOPIC_ARN'],
                        Subject='Daily Weather Report',
                        Message=json.dumps(report_data, indent=2)
                    )

                    return {
                        'statusCode': 200,
                        'body': json.dumps({'message': 'Report generated successfully'})
                    }
                except Exception as e:
                    print(f"Error: {str(e)}")
                    return {
                        'statusCode': 500,
                        'body': json.dumps({'error': str(e)})
                    }
        }
      }
    },
    "ReportGenerationRole": {
      "Type": "AWS::IAM::Role",
      "Properties": {
        "AssumeRolePolicyDocument": {
          "Version": "2012-10-17",
          "Statement": [
            {
              "Effect": "Allow",
              "Principal": {
                "Service": "lambda.amazonaws.com"
              },
              "Action": "sts:AssumeRole"
            }
          ]
        },
        "ManagedPolicyArns": [
          "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
        ],
        "Policies": [
          {
            "PolicyName": "TimestreamQueryPolicy",
            "PolicyDocument": {
              "Version": "2012-10-17",
              "Statement": [
                {
                  "Effect": "Allow",
                  "Action": [
                    "timestream:Select",
                    "timestream:DescribeEndpoints"
                  ],
                  "Resource": "*"
                },
                {
                  "Effect": "Allow",
                  "Action": "sns:Publish",
                  "Resource": {
                    "Ref": "WeatherAnomalyTopic"
                  }
                }
              ]
            }
          }
        ]
      }
    },
    "LambdaInvokePermission": {
      "Type": "AWS::Lambda::Permission",
      "Properties": {
        "FunctionName": {
          "Ref": "DataAggregationFunction"
        },
        "Action": "lambda:InvokeFunction",
        "Principal": "apigateway.amazonaws.com",
        "SourceArn": {
          "Fn::Sub": "arn:aws:execute-api:${AWS::Region}:${AWS::AccountId}:${WeatherAPI}/*/*"
        }
      }
    },
    "WeatherAPI": {
      "Type": "AWS::ApiGateway::RestApi",
      "Properties": {
        "Name": {
          "Fn::Sub": "WeatherMonitoringAPI-${EnvironmentSuffix}"
        },
        "Description": "API for weather sensor data ingestion",
        "EndpointConfiguration": {
          "Types": ["REGIONAL"]
        }
      }
    },
    "WeatherAPIDeployment": {
      "Type": "AWS::ApiGateway::Deployment",
      "DependsOn": ["SensorDataMethod"],
      "Properties": {
        "RestApiId": {
          "Ref": "WeatherAPI"
        },
        "StageName": "prod"
      }
    },
    "SensorDataResource": {
      "Type": "AWS::ApiGateway::Resource",
      "Properties": {
        "RestApiId": {
          "Ref": "WeatherAPI"
        },
        "ParentId": {
          "Fn::GetAtt": ["WeatherAPI", "RootResourceId"]
        },
        "PathPart": "sensor-data"
      }
    },
    "SensorDataMethod": {
      "Type": "AWS::ApiGateway::Method",
      "Properties": {
        "RestApiId": {
          "Ref": "WeatherAPI"
        },
        "ResourceId": {
          "Ref": "SensorDataResource"
        },
        "HttpMethod": "POST",
        "AuthorizationType": "NONE",
        "Integration": {
          "Type": "AWS_PROXY",
          "IntegrationHttpMethod": "POST",
          "Uri": {
            "Fn::Sub": "arn:aws:apigateway:${AWS::Region}:lambda:path/2015-03-31/functions/${DataAggregationFunction.Arn}/invocations"
          }
        },
        "MethodResponses": [
          {
            "StatusCode": "200"
          },
          {
            "StatusCode": "400"
          },
          {
            "StatusCode": "500"
          }
        ]
      }
    },
    "APIUsagePlan": {
      "Type": "AWS::ApiGateway::UsagePlan",
      "DependsOn": ["WeatherAPIDeployment"],
      "Properties": {
        "UsagePlanName": {
          "Fn::Sub": "WeatherMonitoring-UsagePlan-${EnvironmentSuffix}"
        },
        "Description": "Usage plan with rate limiting",
        "ApiStages": [
          {
            "ApiId": {
              "Ref": "WeatherAPI"
            },
            "Stage": "prod",
            "Throttle": {
              "/sensor-data/POST": {
                "RateLimit": 100,
                "BurstLimit": 200
              }
            }
          }
        ],
        "Throttle": {
          "RateLimit": 100,
          "BurstLimit": 200
        }
      }
    },
    "LambdaErrorAlarm": {
      "Type": "AWS::CloudWatch::Alarm",
      "Properties": {
        "AlarmName": {
          "Fn::Sub": "WeatherLambda-HighErrorRate-${EnvironmentSuffix}"
        },
        "AlarmDescription": "Alarm when Lambda error rate exceeds 1%",
        "MetricName": "Errors",
        "Namespace": "AWS/Lambda",
        "Statistic": "Average",
        "Period": 300,
        "EvaluationPeriods": 2,
        "Threshold": 0.01,
        "ComparisonOperator": "GreaterThanThreshold",
        "Dimensions": [
          {
            "Name": "FunctionName",
            "Value": {
              "Ref": "DataAggregationFunction"
            }
          }
        ],
        "AlarmActions": [
          {
            "Ref": "WeatherAnomalyTopic"
          }
        ],
        "TreatMissingData": "notBreaching"
      }
    },
    "APIGateway4xxAlarm": {
      "Type": "AWS::CloudWatch::Alarm",
      "Properties": {
        "AlarmName": {
          "Fn::Sub": "WeatherAPI-High4xxErrors-${EnvironmentSuffix}"
        },
        "AlarmDescription": "Alarm when API Gateway 4xx errors exceed 5%",
        "MetricName": "4XXError",
        "Namespace": "AWS/ApiGateway",
        "Statistic": "Average",
        "Period": 300,
        "EvaluationPeriods": 2,
        "Threshold": 0.05,
        "ComparisonOperator": "GreaterThanThreshold",
        "Dimensions": [
          {
            "Name": "ApiName",
            "Value": {
              "Fn::Sub": "WeatherMonitoringAPI-${EnvironmentSuffix}"
            }
          }
        ],
        "AlarmActions": [
          {
            "Ref": "WeatherAnomalyTopic"
          }
        ],
        "TreatMissingData": "notBreaching"
      }
    },
    "DynamoDBThrottleAlarm": {
      "Type": "AWS::CloudWatch::Alarm",
      "Properties": {
        "AlarmName": {
          "Fn::Sub": "WeatherDynamoDB-ThrottledRequests-${EnvironmentSuffix}"
        },
        "AlarmDescription": "Alarm when DynamoDB requests are throttled",
        "MetricName": "UserErrors",
        "Namespace": "AWS/DynamoDB",
        "Statistic": "Sum",
        "Period": 300,
        "EvaluationPeriods": 1,
        "Threshold": 1,
        "ComparisonOperator": "GreaterThanOrEqualToThreshold",
        "Dimensions": [
          {
            "Name": "TableName",
            "Value": {
              "Ref": "WeatherReadingsTable"
            }
          }
        ],
        "AlarmActions": [
          {
            "Ref": "WeatherAnomalyTopic"
          }
        ],
        "TreatMissingData": "notBreaching"
      }
    },
    "TimestreamQueryAlarm": {
      "Type": "AWS::CloudWatch::Alarm",
      "Properties": {
        "AlarmName": {
          "Fn::Sub": "WeatherTimestream-SlowQueries-${EnvironmentSuffix}"
        },
        "AlarmDescription": "Alarm when Timestream query execution exceeds 5 seconds",
        "MetricName": "QueryDuration",
        "Namespace": "AWS/Timestream",
        "Statistic": "Average",
        "Period": 300,
        "EvaluationPeriods": 2,
        "Threshold": 5000,
        "ComparisonOperator": "GreaterThanThreshold",
        "Dimensions": [
          {
            "Name": "DatabaseName",
            "Value": "WeatherMonitoring"
          },
          {
            "Name": "TableName",
            "Value": "SensorData"
          }
        ],
        "AlarmActions": [
          {
            "Ref": "WeatherAnomalyTopic"
          }
        ],
        "TreatMissingData": "notBreaching"
      }
    },
    "LambdaLogGroup": {
      "Type": "AWS::Logs::LogGroup",
      "Properties": {
        "LogGroupName": {
          "Fn::Sub": "/aws/lambda/WeatherDataAggregation-${EnvironmentSuffix}"
        },
        "RetentionInDays": 7
      }
    }
  },
  "Outputs": {
    "APIEndpoint": {
      "Description": "API Gateway endpoint URL",
      "Value": {
        "Fn::Sub": "https://${WeatherAPI}.execute-api.${AWS::Region}.amazonaws.com/prod/sensor-data"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-APIEndpoint"
        }
      }
    },
    "DynamoDBTableName": {
      "Description": "Name of the DynamoDB table",
      "Value": {
        "Ref": "WeatherReadingsTable"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-TableName"
        }
      }
    },
    "LambdaFunctionArn": {
      "Description": "ARN of the Lambda function",
      "Value": {
        "Fn::GetAtt": ["DataAggregationFunction", "Arn"]
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-LambdaArn"
        }
      }
    },
    "SNSTopicArn": {
      "Description": "ARN of the SNS topic for anomaly alerts",
      "Value": {
        "Ref": "WeatherAnomalyTopic"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-SNSTopicArn"
        }
      }
    },
    "TimestreamDatabaseName": {
      "Description": "Name of the Timestream database",
      "Value": {
        "Ref": "TimestreamDatabase"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-TimestreamDB"
        }
      }
    },
    "TimestreamTableArn": {
      "Description": "ARN of the Timestream table",
      "Value": {
        "Fn::GetAtt": ["TimestreamTable", "Arn"]
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-TimestreamTableArn"
        }
      }
    },
    "HourlyScheduleArn": {
      "Description": "ARN of the hourly aggregation schedule",
      "Value": {
        "Fn::GetAtt": ["HourlyAggregationSchedule", "Arn"]
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-HourlySchedule"
        }
      }
    },
    "DailyReportScheduleArn": {
      "Description": "ARN of the daily report schedule",
      "Value": {
        "Fn::GetAtt": ["DailyReportSchedule", "Arn"]
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-DailySchedule"
        }
      }
    }
  }
}
```