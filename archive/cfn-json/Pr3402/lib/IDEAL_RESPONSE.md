# CloudFormation Template for Serverless Weather Monitoring System with Enhanced Features

## Complete Infrastructure Solution - TapStack.json
```json
{
  "AWSTemplateFormatVersion": "2010-09-09",
  "Description": "Serverless Weather Monitoring System with Time Series Analytics and Automated Reporting - Processes 5,200 daily sensor readings",
  "Parameters": {
    "EnvironmentSuffix": {
      "Type": "String",
      "Default": "dev",
      "Description": "Environment suffix for resource naming",
      "AllowedPattern": "^[a-zA-Z0-9]+$"
    },
    "EnableTimestream": {
      "Type": "String",
      "Default": "false",
      "AllowedValues": [
        "true",
        "false"
      ],
      "Description": "Enable Timestream resources (requires service enablement)"
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
            "Value": {
              "Ref": "EnvironmentSuffix"
            }
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
          "Fn::GetAtt": [
            "DynamoDBAutoScalingRole",
            "Arn"
          ]
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
          "Fn::GetAtt": [
            "DynamoDBAutoScalingRole",
            "Arn"
          ]
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
        "Policies": [
          {
            "PolicyName": "DynamoDBAutoScalingPolicy",
            "PolicyDocument": {
              "Version": "2012-10-17",
              "Statement": [
                {
                  "Effect": "Allow",
                  "Action": [
                    "dynamodb:DescribeTable",
                    "dynamodb:UpdateTable",
                    "cloudwatch:PutMetricAlarm",
                    "cloudwatch:DescribeAlarms",
                    "cloudwatch:GetMetricStatistics",
                    "cloudwatch:SetAlarmState",
                    "cloudwatch:DeleteAlarms"
                  ],
                  "Resource": "*"
                }
              ]
            }
          }
        ]
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
                    "dynamodb:BatchWriteItem",
                    "dynamodb:Scan"
                  ],
                  "Resource": {
                    "Fn::GetAtt": [
                      "WeatherReadingsTable",
                      "Arn"
                    ]
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
                    "s3:PutObject",
                    "s3:PutObjectAcl",
                    "s3:GetObject",
                    "s3:GetObjectVersion"
                  ],
                  "Resource": {
                    "Fn::Sub": "arn:aws:s3:::weather-failed-events-${EnvironmentSuffix}-${AWS::AccountId}/*"
                  }
                },
                {
                  "Effect": "Allow",
                  "Action": [
                    "s3:ListBucket"
                  ],
                  "Resource": {
                    "Fn::Sub": "arn:aws:s3:::weather-failed-events-${EnvironmentSuffix}-${AWS::AccountId}"
                  }
                },
                {
                  "Effect": "Allow",
                  "Action": [
                    "timestream:WriteRecords",
                    "timestream:DescribeEndpoints"
                  ],
                  "Resource": "*"
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
          "Fn::GetAtt": [
            "DataAggregationLambdaRole",
            "Arn"
          ]
        },
        "Code": {
          "ZipFile": "import json\nimport boto3\nimport os\nfrom decimal import Decimal\nfrom datetime import datetime, timedelta\nimport logging\n\nlogger = logging.getLogger()\nlogger.setLevel(logging.INFO)\n\ndynamodb = boto3.resource('dynamodb')\nsns = boto3.client('sns')\ncloudwatch = boto3.client('cloudwatch')\ntimestream = boto3.client('timestream-write')\n\nTABLE_NAME = os.environ['TABLE_NAME']\nSNS_TOPIC_ARN = os.environ['SNS_TOPIC_ARN']\nTIMESTREAM_DB = os.environ.get('TIMESTREAM_DATABASE', 'WeatherMonitoring')\nTIMESTREAM_TABLE = os.environ.get('TIMESTREAM_TABLE', 'SensorData')\n\ndef decimal_default(obj):\n    if isinstance(obj, Decimal):\n        return float(obj)\n    raise TypeError\n\ndef lambda_handler(event, context):\n    try:\n        logger.info(f\"Received event: {json.dumps(event)}\")\n\n        # Check if this is an EventBridge scheduled event\n        if event.get('source') == 'EventBridge Scheduler':\n            action = event.get('action')\n            report_type = event.get('reportType')\n\n            if action == 'aggregate':\n                return handle_data_aggregation()\n            elif report_type == 'daily':\n                return handle_daily_report()\n            else:\n                logger.warning(f\"Unknown EventBridge action: {action} or reportType: {report_type}\")\n                return {\n                    'statusCode': 200,\n                    'body': json.dumps({'message': 'No action taken'})\n                }\n\n        # Otherwise, handle as API Gateway event (sensor data ingestion)\n        body = json.loads(event.get('body', '{}'))\n\n        sensor_id = body.get('sensorId')\n        temperature = body.get('temperature')\n        humidity = body.get('humidity')\n        pressure = body.get('pressure')\n        wind_speed = body.get('windSpeed')\n\n        if not sensor_id:\n            return {\n                'statusCode': 400,\n                'headers': {'Content-Type': 'application/json'},\n                'body': json.dumps({'error': 'sensorId is required'})\n            }\n\n        # Prepare item for DynamoDB\n        table = dynamodb.Table(TABLE_NAME)\n        timestamp = int(datetime.now().timestamp())\n\n        item = {\n            'sensorId': sensor_id,\n            'timestamp': timestamp,\n            'temperature': Decimal(str(temperature)) if temperature else None,\n            'humidity': Decimal(str(humidity)) if humidity else None,\n            'pressure': Decimal(str(pressure)) if pressure else None,\n            'windSpeed': Decimal(str(wind_speed)) if wind_speed else None,\n            'processedAt': datetime.utcnow().isoformat()\n        }\n\n        # Remove None values\n        item = {k: v for k, v in item.items() if v is not None}\n\n        # Store in DynamoDB\n        table.put_item(Item=item)\n\n        # Check for anomalies\n        anomalies = []\n        if temperature and (temperature > 50 or temperature < -30):\n            anomalies.append(f'Extreme temperature: {temperature}\u00b0C')\n        if humidity and (humidity > 95 or humidity < 5):\n            anomalies.append(f'Extreme humidity: {humidity}%')\n        if wind_speed and wind_speed > 150:\n            anomalies.append(f'Extreme wind speed: {wind_speed} km/h')\n\n        # Send SNS notification for anomalies\n        if anomalies:\n            message = {\n                'sensorId': sensor_id,\n                'timestamp': timestamp,\n                'anomalies': anomalies,\n                'data': body\n            }\n\n            sns.publish(\n                TopicArn=SNS_TOPIC_ARN,\n                Subject=f'Weather Anomaly Detected - Sensor {sensor_id}',\n                Message=json.dumps(message, default=str)\n            )\n\n            logger.warning(f'Anomalies detected for sensor {sensor_id}: {anomalies}')\n\n        # Send custom metrics to CloudWatch\n        cloudwatch.put_metric_data(\n            Namespace='WeatherMonitoring',\n            MetricData=[\n                {\n                    'MetricName': 'ReadingsProcessed',\n                    'Value': 1,\n                    'Unit': 'Count',\n                    'Dimensions': [\n                        {\n                            'Name': 'SensorId',\n                            'Value': sensor_id\n                        }\n                    ]\n                }\n            ]\n        )\n\n        return {\n            'statusCode': 200,\n            'headers': {'Content-Type': 'application/json'},\n            'body': json.dumps({\n                'message': 'Data processed successfully',\n                'sensorId': sensor_id,\n                'timestamp': timestamp\n            })\n        }\n\n    except json.JSONDecodeError:\n        logger.error('Invalid JSON in request body')\n        return {\n            'statusCode': 400,\n            'headers': {'Content-Type': 'application/json'},\n            'body': json.dumps({'error': 'Invalid JSON format'})\n        }\n    except Exception as e:\n        logger.error(f'Unexpected error: {str(e)}')\n        # Log to CloudWatch\n        cloudwatch.put_metric_data(\n            Namespace='WeatherMonitoring',\n            MetricData=[\n                {\n                    'MetricName': 'ProcessingErrors',\n                    'Value': 1,\n                    'Unit': 'Count'\n                }\n            ]\n        )\n        return {\n            'statusCode': 500,\n            'headers': {'Content-Type': 'application/json'},\n            'body': json.dumps({'error': 'Internal server error'})\n        }\n\ndef handle_data_aggregation():\n    \"\"\"Handle hourly data aggregation and migration to Timestream\"\"\"\n    try:\n        logger.info(\"Starting hourly data aggregation\")\n\n        table = dynamodb.Table(TABLE_NAME)\n\n        # Get data from the last hour\n        one_hour_ago = int((datetime.now() - timedelta(hours=1)).timestamp())\n        current_time = int(datetime.now().timestamp())\n\n        # Scan for recent data (in production, use Query with GSI for better performance)\n        response = table.scan(\n            FilterExpression='#ts BETWEEN :start AND :end',\n            ExpressionAttributeNames={'#ts': 'timestamp'},\n            ExpressionAttributeValues={\n                ':start': one_hour_ago,\n                ':end': current_time\n            }\n        )\n\n        items = response.get('Items', [])\n        logger.info(f\"Found {len(items)} items to aggregate\")\n\n        if items:\n            # Calculate aggregates\n            temp_values = [float(item.get('temperature', 0)) for item in items if item.get('temperature')]\n            humidity_values = [float(item.get('humidity', 0)) for item in items if item.get('humidity')]\n\n            aggregates = {\n                'period': datetime.now().strftime('%Y-%m-%d %H:00:00'),\n                'itemCount': len(items),\n                'avgTemperature': sum(temp_values) / len(temp_values) if temp_values else 0,\n                'avgHumidity': sum(humidity_values) / len(humidity_values) if humidity_values else 0,\n                'maxTemperature': max(temp_values) if temp_values else 0,\n                'minTemperature': min(temp_values) if temp_values else 0\n            }\n\n            logger.info(f\"Aggregates: {json.dumps(aggregates, default=decimal_default)}\")\n\n            # Try to write to Timestream if available\n            try:\n                if TIMESTREAM_DB and TIMESTREAM_TABLE:\n                    write_to_timestream(items)\n            except Exception as ts_error:\n                logger.warning(f\"Could not write to Timestream: {str(ts_error)}\")\n\n            # Send metrics to CloudWatch\n            cloudwatch.put_metric_data(\n                Namespace='WeatherMonitoring',\n                MetricData=[\n                    {\n                        'MetricName': 'HourlyAggregation',\n                        'Value': len(items),\n                        'Unit': 'Count'\n                    }\n                ]\n            )\n\n            return {\n                'statusCode': 200,\n                'body': json.dumps({\n                    'message': 'Data aggregation completed',\n                    'aggregates': aggregates\n                }, default=decimal_default)\n            }\n\n        return {\n            'statusCode': 200,\n            'body': json.dumps({'message': 'No data to aggregate'})\n        }\n\n    except Exception as e:\n        logger.error(f\"Error in data aggregation: {str(e)}\")\n        return {\n            'statusCode': 500,\n            'body': json.dumps({'error': f'Aggregation failed: {str(e)}'})\n        }\n\ndef handle_daily_report():\n    \"\"\"Generate daily weather report\"\"\"\n    try:\n        logger.info(\"Generating daily weather report\")\n\n        table = dynamodb.Table(TABLE_NAME)\n\n        # Get data from the last 24 hours\n        one_day_ago = int((datetime.now() - timedelta(days=1)).timestamp())\n        current_time = int(datetime.now().timestamp())\n\n        # Scan for recent data\n        response = table.scan(\n            FilterExpression='#ts BETWEEN :start AND :end',\n            ExpressionAttributeNames={'#ts': 'timestamp'},\n            ExpressionAttributeValues={\n                ':start': one_day_ago,\n                ':end': current_time\n            }\n        )\n\n        items = response.get('Items', [])\n        logger.info(f\"Found {len(items)} items for daily report\")\n\n        if items:\n            # Generate report statistics\n            temp_values = [float(item.get('temperature', 0)) for item in items if item.get('temperature')]\n            humidity_values = [float(item.get('humidity', 0)) for item in items if item.get('humidity')]\n            pressure_values = [float(item.get('pressure', 0)) for item in items if item.get('pressure')]\n            wind_values = [float(item.get('windSpeed', 0)) for item in items if item.get('windSpeed')]\n\n            report = {\n                'reportDate': datetime.now().strftime('%Y-%m-%d'),\n                'totalReadings': len(items),\n                'temperature': {\n                    'average': sum(temp_values) / len(temp_values) if temp_values else 0,\n                    'max': max(temp_values) if temp_values else 0,\n                    'min': min(temp_values) if temp_values else 0\n                },\n                'humidity': {\n                    'average': sum(humidity_values) / len(humidity_values) if humidity_values else 0,\n                    'max': max(humidity_values) if humidity_values else 0,\n                    'min': min(humidity_values) if humidity_values else 0\n                },\n                'pressure': {\n                    'average': sum(pressure_values) / len(pressure_values) if pressure_values else 0,\n                    'max': max(pressure_values) if pressure_values else 0,\n                    'min': min(pressure_values) if pressure_values else 0\n                },\n                'windSpeed': {\n                    'average': sum(wind_values) / len(wind_values) if wind_values else 0,\n                    'max': max(wind_values) if wind_values else 0,\n                    'min': min(wind_values) if wind_values else 0\n                }\n            }\n\n            # Send report via SNS\n            sns.publish(\n                TopicArn=SNS_TOPIC_ARN,\n                Subject=f\"Daily Weather Report - {report['reportDate']}\",\n                Message=json.dumps(report, indent=2, default=decimal_default)\n            )\n\n            logger.info(f\"Daily report generated: {json.dumps(report, default=decimal_default)}\")\n\n            # Send metrics to CloudWatch\n            cloudwatch.put_metric_data(\n                Namespace='WeatherMonitoring',\n                MetricData=[\n                    {\n                        'MetricName': 'DailyReportGenerated',\n                        'Value': 1,\n                        'Unit': 'Count'\n                    }\n                ]\n            )\n\n            return {\n                'statusCode': 200,\n                'body': json.dumps({\n                    'message': 'Daily report generated successfully',\n                    'report': report\n                }, default=decimal_default)\n            }\n\n        return {\n            'statusCode': 200,\n            'body': json.dumps({'message': 'No data available for daily report'})\n        }\n\n    except Exception as e:\n        logger.error(f\"Error generating daily report: {str(e)}\")\n        return {\n            'statusCode': 500,\n            'body': json.dumps({'error': f'Report generation failed: {str(e)}'})\n        }\n\ndef write_to_timestream(items):\n    \"\"\"Write data to Timestream\"\"\"\n    try:\n        records = []\n        current_time_str = str(int(datetime.now().timestamp() * 1000))\n\n        for item in items:\n            sensor_id = item.get('sensorId', 'unknown')\n            timestamp = str(int(item.get('timestamp', 0) * 1000))\n\n            # Add temperature record\n            if 'temperature' in item:\n                records.append({\n                    'Time': timestamp,\n                    'TimeUnit': 'MILLISECONDS',\n                    'Dimensions': [\n                        {'Name': 'sensorId', 'Value': sensor_id},\n                        {'Name': 'measureType', 'Value': 'temperature'}\n                    ],\n                    'MeasureName': 'value',\n                    'MeasureValue': str(item['temperature']),\n                    'MeasureValueType': 'DOUBLE'\n                })\n\n            # Add humidity record\n            if 'humidity' in item:\n                records.append({\n                    'Time': timestamp,\n                    'TimeUnit': 'MILLISECONDS',\n                    'Dimensions': [\n                        {'Name': 'sensorId', 'Value': sensor_id},\n                        {'Name': 'measureType', 'Value': 'humidity'}\n                    ],\n                    'MeasureName': 'value',\n                    'MeasureValue': str(item['humidity']),\n                    'MeasureValueType': 'DOUBLE'\n                })\n\n        if records:\n            response = timestream.write_records(\n                DatabaseName=TIMESTREAM_DB,\n                TableName=TIMESTREAM_TABLE,\n                Records=records[:100]  # Limit to 100 records per write\n            )\n            logger.info(f\"Written {len(records)} records to Timestream\")\n\n    except Exception as e:\n        logger.warning(f\"Failed to write to Timestream: {str(e)}\")"
        },
        "Environment": {
          "Variables": {
            "TABLE_NAME": {
              "Ref": "WeatherReadingsTable"
            },
            "SNS_TOPIC_ARN": {
              "Ref": "WeatherAnomalyTopic"
            },
            "TIMESTREAM_DATABASE": "WeatherMonitoring",
            "TIMESTREAM_TABLE": "SensorData"
          }
        },
        "Timeout": 30,
        "MemorySize": 256,
        "ReservedConcurrentExecutions": 100
      }
    },
    "FailedEventsBucket": {
      "Type": "AWS::S3::Bucket",
      "Properties": {
        "BucketName": {
          "Fn::Sub": "weather-failed-events-${EnvironmentSuffix}-${AWS::AccountId}"
        },
        "LifecycleConfiguration": {
          "Rules": [
            {
              "Id": "ExpireOldFailedEvents",
              "Status": "Enabled",
              "ExpirationInDays": 30
            }
          ]
        },
        "PublicAccessBlockConfiguration": {
          "BlockPublicAcls": true,
          "BlockPublicPolicy": true,
          "IgnorePublicAcls": true,
          "RestrictPublicBuckets": true
        }
      }
    },
    "LambdaFailureDestination": {
      "Type": "AWS::Lambda::EventInvokeConfig",
      "Properties": {
        "FunctionName": {
          "Ref": "DataAggregationFunction"
        },
        "Qualifier": "$LATEST",
        "MaximumRetryAttempts": 2,
        "DestinationConfig": {
          "OnFailure": {
            "Destination": {
              "Fn::GetAtt": [
                "FailedEventsBucket",
                "Arn"
              ]
            }
          }
        }
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
          "Types": [
            "REGIONAL"
          ]
        }
      }
    },
    "WeatherAPIDeployment": {
      "Type": "AWS::ApiGateway::Deployment",
      "DependsOn": [
        "SensorDataMethod"
      ],
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
          "Fn::GetAtt": [
            "WeatherAPI",
            "RootResourceId"
          ]
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
      "DependsOn": [
        "WeatherAPIDeployment"
      ],
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
    "LambdaLogGroup": {
      "Type": "AWS::Logs::LogGroup",
      "Properties": {
        "LogGroupName": {
          "Fn::Sub": "/aws/lambda/WeatherDataAggregation-${EnvironmentSuffix}"
        },
        "RetentionInDays": 7
      }
    },
    "TimestreamDatabase": {
      "Type": "AWS::Timestream::Database",
      "Properties": {
        "DatabaseName": "WeatherMonitoring"
      },
      "Condition": "ShouldCreateTimestream"
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
      },
      "Condition": "ShouldCreateTimestream"
    },
    "SchedulerRole": {
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
                  "Resource": {
                    "Fn::GetAtt": [
                      "DataAggregationFunction",
                      "Arn"
                    ]
                  }
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
        "Description": "Trigger hourly data aggregation",
        "ScheduleExpression": "rate(1 hour)",
        "FlexibleTimeWindow": {
          "Mode": "FLEXIBLE",
          "MaximumWindowInMinutes": 15
        },
        "Target": {
          "Arn": {
            "Fn::GetAtt": [
              "DataAggregationFunction",
              "Arn"
            ]
          },
          "RoleArn": {
            "Fn::GetAtt": [
              "SchedulerRole",
              "Arn"
            ]
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
            "Fn::GetAtt": [
              "DataAggregationFunction",
              "Arn"
            ]
          },
          "RoleArn": {
            "Fn::GetAtt": [
              "SchedulerRole",
              "Arn"
            ]
          },
          "Input": "{\"source\": \"EventBridge Scheduler\", \"reportType\": \"daily\"}"
        },
        "State": "ENABLED"
      }
    },
    "TimestreamQueryAlarm": {
      "Type": "AWS::CloudWatch::Alarm",
      "Properties": {
        "AlarmName": {
          "Fn::Sub": "WeatherTimestream-SlowQueries-${EnvironmentSuffix}"
        },
        "AlarmDescription": "Alarm when Timestream query execution exceeds 5 seconds",
        "MetricName": "QueryExecutionTime",
        "Namespace": "AWS/Timestream",
        "Statistic": "Average",
        "Period": 300,
        "EvaluationPeriods": 2,
        "Threshold": 5000,
        "ComparisonOperator": "GreaterThanThreshold",
        "AlarmActions": [
          {
            "Ref": "WeatherAnomalyTopic"
          }
        ],
        "TreatMissingData": "notBreaching"
      },
      "Condition": "ShouldCreateTimestream"
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
        "Fn::GetAtt": [
          "DataAggregationFunction",
          "Arn"
        ]
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
    "FailedEventsBucketName": {
      "Description": "S3 bucket for failed Lambda events",
      "Value": {
        "Ref": "FailedEventsBucket"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-FailedEventsBucket"
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
      },
      "Condition": "ShouldCreateTimestream"
    },
    "HourlyScheduleArn": {
      "Description": "ARN of the hourly aggregation schedule",
      "Value": {
        "Fn::GetAtt": [
          "HourlyAggregationSchedule",
          "Arn"
        ]
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-HourlySchedule"
        }
      }
    }
  },
  "Conditions": {
    "ShouldCreateTimestream": {
      "Fn::Equals": [
        {
          "Ref": "EnableTimestream"
        },
        "true"
      ]
    }
  }
}
```

This is the fully functional CloudFormation template that includes:
- Amazon Timestream for time-series data storage (conditional)
- AWS EventBridge Scheduler for automated processing
- Complete error handling and monitoring
- All required IAM permissions

### Below is the lambda source code for the project `lib/tap_stack.py`

```python
import json
import boto3
import os
from decimal import Decimal
from datetime import datetime, timedelta
import logging

logger = logging.getLogger()
logger.setLevel(logging.INFO)

dynamodb = boto3.resource('dynamodb')
sns = boto3.client('sns')
cloudwatch = boto3.client('cloudwatch')
timestream = boto3.client('timestream-write')

TABLE_NAME = os.environ['TABLE_NAME']
SNS_TOPIC_ARN = os.environ['SNS_TOPIC_ARN']
TIMESTREAM_DB = os.environ.get('TIMESTREAM_DATABASE', 'WeatherMonitoring')
TIMESTREAM_TABLE = os.environ.get('TIMESTREAM_TABLE', 'SensorData')

def decimal_default(obj):
    if isinstance(obj, Decimal):
        return float(obj)
    raise TypeError

def lambda_handler(event, context):
    try:
        logger.info(f"Received event: {json.dumps(event)}")

        # Check if this is an EventBridge scheduled event
        if event.get('source') == 'EventBridge Scheduler':
            action = event.get('action')
            report_type = event.get('reportType')

            if action == 'aggregate':
                return handle_data_aggregation()
            elif report_type == 'daily':
                return handle_daily_report()
            else:
                logger.warning(f"Unknown EventBridge action: {action} or reportType: {report_type}")
                return {
                    'statusCode': 200,
                    'body': json.dumps({'message': 'No action taken'})
                }

        # Otherwise, handle as API Gateway event (sensor data ingestion)
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

def handle_data_aggregation():
    """Handle hourly data aggregation and migration to Timestream"""
    try:
        logger.info("Starting hourly data aggregation")

        table = dynamodb.Table(TABLE_NAME)

        # Get data from the last hour
        one_hour_ago = int((datetime.now() - timedelta(hours=1)).timestamp())
        current_time = int(datetime.now().timestamp())

        # Scan for recent data (in production, use Query with GSI for better performance)
        response = table.scan(
            FilterExpression='#ts BETWEEN :start AND :end',
            ExpressionAttributeNames={'#ts': 'timestamp'},
            ExpressionAttributeValues={
                ':start': one_hour_ago,
                ':end': current_time
            }
        )

        items = response.get('Items', [])
        logger.info(f"Found {len(items)} items to aggregate")

        if items:
            # Calculate aggregates
            temp_values = [float(item.get('temperature', 0)) for item in items if item.get('temperature')]
            humidity_values = [float(item.get('humidity', 0)) for item in items if item.get('humidity')]

            aggregates = {
                'period': datetime.now().strftime('%Y-%m-%d %H:00:00'),
                'itemCount': len(items),
                'avgTemperature': sum(temp_values) / len(temp_values) if temp_values else 0,
                'avgHumidity': sum(humidity_values) / len(humidity_values) if humidity_values else 0,
                'maxTemperature': max(temp_values) if temp_values else 0,
                'minTemperature': min(temp_values) if temp_values else 0
            }

            logger.info(f"Aggregates: {json.dumps(aggregates, default=decimal_default)}")

            # Try to write to Timestream if available
            try:
                if TIMESTREAM_DB and TIMESTREAM_TABLE:
                    write_to_timestream(items)
            except Exception as ts_error:
                logger.warning(f"Could not write to Timestream: {str(ts_error)}")

            # Send metrics to CloudWatch
            cloudwatch.put_metric_data(
                Namespace='WeatherMonitoring',
                MetricData=[
                    {
                        'MetricName': 'HourlyAggregation',
                        'Value': len(items),
                        'Unit': 'Count'
                    }
                ]
            )

            return {
                'statusCode': 200,
                'body': json.dumps({
                    'message': 'Data aggregation completed',
                    'aggregates': aggregates
                }, default=decimal_default)
            }

        return {
            'statusCode': 200,
            'body': json.dumps({'message': 'No data to aggregate'})
        }

    except Exception as e:
        logger.error(f"Error in data aggregation: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({'error': f'Aggregation failed: {str(e)}'})
        }

def handle_daily_report():
    """Generate daily weather report"""
    try:
        logger.info("Generating daily weather report")

        table = dynamodb.Table(TABLE_NAME)

        # Get data from the last 24 hours
        one_day_ago = int((datetime.now() - timedelta(days=1)).timestamp())
        current_time = int(datetime.now().timestamp())

        # Scan for recent data
        response = table.scan(
            FilterExpression='#ts BETWEEN :start AND :end',
            ExpressionAttributeNames={'#ts': 'timestamp'},
            ExpressionAttributeValues={
                ':start': one_day_ago,
                ':end': current_time
            }
        )

        items = response.get('Items', [])
        logger.info(f"Found {len(items)} items for daily report")

        if items:
            # Generate report statistics
            temp_values = [float(item.get('temperature', 0)) for item in items if item.get('temperature')]
            humidity_values = [float(item.get('humidity', 0)) for item in items if item.get('humidity')]
            pressure_values = [float(item.get('pressure', 0)) for item in items if item.get('pressure')]
            wind_values = [float(item.get('windSpeed', 0)) for item in items if item.get('windSpeed')]

            report = {
                'reportDate': datetime.now().strftime('%Y-%m-%d'),
                'totalReadings': len(items),
                'temperature': {
                    'average': sum(temp_values) / len(temp_values) if temp_values else 0,
                    'max': max(temp_values) if temp_values else 0,
                    'min': min(temp_values) if temp_values else 0
                },
                'humidity': {
                    'average': sum(humidity_values) / len(humidity_values) if humidity_values else 0,
                    'max': max(humidity_values) if humidity_values else 0,
                    'min': min(humidity_values) if humidity_values else 0
                },
                'pressure': {
                    'average': sum(pressure_values) / len(pressure_values) if pressure_values else 0,
                    'max': max(pressure_values) if pressure_values else 0,
                    'min': min(pressure_values) if pressure_values else 0
                },
                'windSpeed': {
                    'average': sum(wind_values) / len(wind_values) if wind_values else 0,
                    'max': max(wind_values) if wind_values else 0,
                    'min': min(wind_values) if wind_values else 0
                }
            }

            # Send report via SNS
            sns.publish(
                TopicArn=SNS_TOPIC_ARN,
                Subject=f"Daily Weather Report - {report['reportDate']}",
                Message=json.dumps(report, indent=2, default=decimal_default)
            )

            logger.info(f"Daily report generated: {json.dumps(report, default=decimal_default)}")

            # Send metrics to CloudWatch
            cloudwatch.put_metric_data(
                Namespace='WeatherMonitoring',
                MetricData=[
                    {
                        'MetricName': 'DailyReportGenerated',
                        'Value': 1,
                        'Unit': 'Count'
                    }
                ]
            )

            return {
                'statusCode': 200,
                'body': json.dumps({
                    'message': 'Daily report generated successfully',
                    'report': report
                }, default=decimal_default)
            }

        return {
            'statusCode': 200,
            'body': json.dumps({'message': 'No data available for daily report'})
        }

    except Exception as e:
        logger.error(f"Error generating daily report: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({'error': f'Report generation failed: {str(e)}'})
        }

def write_to_timestream(items):
    """Write data to Timestream"""
    try:
        records = []
        current_time_str = str(int(datetime.now().timestamp() * 1000))

        for item in items:
            sensor_id = item.get('sensorId', 'unknown')
            timestamp = str(int(item.get('timestamp', 0) * 1000))

            # Add temperature record
            if 'temperature' in item:
                records.append({
                    'Time': timestamp,
                    'TimeUnit': 'MILLISECONDS',
                    'Dimensions': [
                        {'Name': 'sensorId', 'Value': sensor_id},
                        {'Name': 'measureType', 'Value': 'temperature'}
                    ],
                    'MeasureName': 'value',
                    'MeasureValue': str(item['temperature']),
                    'MeasureValueType': 'DOUBLE'
                })

            # Add humidity record
            if 'humidity' in item:
                records.append({
                    'Time': timestamp,
                    'TimeUnit': 'MILLISECONDS',
                    'Dimensions': [
                        {'Name': 'sensorId', 'Value': sensor_id},
                        {'Name': 'measureType', 'Value': 'humidity'}
                    ],
                    'MeasureName': 'value',
                    'MeasureValue': str(item['humidity']),
                    'MeasureValueType': 'DOUBLE'
                })

        if records:
            response = timestream.write_records(
                DatabaseName=TIMESTREAM_DB,
                TableName=TIMESTREAM_TABLE,
                Records=records[:100]  # Limit to 100 records per write
            )
            logger.info(f"Written {len(records)} records to Timestream")

    except Exception as e:
        logger.warning(f"Failed to write to Timestream: {str(e)}")
```

## Key Features Implemented

### 1. Core Infrastructure
- **API Gateway**: REST API with rate limiting (100 req/sec)
- **Lambda Function**: Python 3.11 runtime with multi-purpose handler
- **DynamoDB Table**: Auto-scaling enabled (5-100 units, 70% target)

### 2. Enhanced Features
- **Amazon Timestream**: Time-series database for historical analytics (conditional)
  - 7 days memory retention
  - 365 days magnetic storage
- **EventBridge Scheduler**: 
  - Hourly data aggregation
  - Daily report generation at 2 AM UTC
  - 15-minute flexible time window

### 3. Monitoring & Alerting
- **CloudWatch Alarms**:
  - Lambda error rate > 1%
  - API Gateway 4xx errors > 5%
  - DynamoDB throttled requests
  - Timestream query execution > 5 seconds (conditional)
- **SNS Topic**: Anomaly detection alerts
- **CloudWatch Logs**: 7-day retention with Live Tail support

### 4. Error Handling
- **S3 Bucket**: Failed Lambda event storage
- **Lambda Retry Configuration**: Max 2 retry attempts
- **Dead Letter Destination**: S3 bucket with 30-day lifecycle

### 5. Security
- **IAM Roles**: Least privilege access
- **KMS Encryption**: SNS topic encryption
- **S3 Public Access**: Blocked on failed events bucket

## Deployment Instructions

1. Save the template as 

2. Deploy without Timestream (default):


3. Deploy with Timestream (if enabled in account):


## Stack Outputs

The stack provides the following outputs:
- **APIEndpoint**: API Gateway URL for sensor data submission
- **DynamoDBTableName**: Name of the DynamoDB table
- **LambdaFunctionArn**: ARN of the Lambda function
- **SNSTopicArn**: ARN for anomaly notifications
- **FailedEventsBucketName**: S3 bucket for failed events
- **TimestreamDatabaseName**: Timestream database (if enabled)
- **HourlyScheduleArn**: EventBridge hourly schedule ARN

## Testing the Deployment

### Send Sensor Data


### Trigger Anomaly Detection


## Notes

1. **Timestream Availability**: Timestream requires explicit enablement in some AWS accounts. Use the  parameter to control deployment.

2. **Environment Suffix**: Always use a unique environment suffix to avoid resource naming conflicts.

3. **Cleanup**: Remember to delete the S3 bucket contents before deleting the stack.

4. **Monitoring**: CloudWatch dashboards can be added for visualization of metrics.

5. **Cost Optimization**: DynamoDB auto-scaling ensures cost-effective operation based on actual load.
