### Reasoning Trace
---

The user is asking for a CloudFormation template that creates a serverless image processing pipeline for a photo-sharing app. Let me break down what's needed:

1. **Storage**:
   - S3 bucket for uploads (source)
   - S3 bucket for processed images (destination)

2. **Processing**:
   - Lambda function (Python 3.11) for image resizing
   - S3 event triggers to invoke Lambda

3. **Monitoring**:
   - CloudWatch logs for Lambda
   - CloudWatch metrics for performance monitoring

4. **Notifications**:
   - SNS topic for error notifications

5. **Security**:
   - IAM role for Lambda execution with least privileges

The Lambda function needs to:
- Be triggered by S3 events when images are uploaded
- Resize images
- Store processed images in the destination bucket
- Log performance metrics
- Send notifications on errors

I'll create a comprehensive CloudFormation template in JSON format that includes all these components.
### Answer 
---

# Serverless Image Processing Pipeline CloudFormation Template

Below is a complete CloudFormation template that implements the serverless image processing pipeline for your photo-sharing application. The solution follows AWS best practices and includes all required components.

## CloudFormation Template

```json
{
  "AWSTemplateFormatVersion": "2010-09-09",
  "Description": "Serverless image processing pipeline for photo-sharing application",
  
  "Parameters": {
    "NotificationEmail": {
      "Type": "String",
      "Description": "Email address for error notifications",
      "AllowedPattern": "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$",
      "ConstraintDescription": "Must be a valid email address"
    },
    "ImageMaxWidth": {
      "Type": "Number",
      "Default": 1024,
      "Description": "Maximum width for resized images in pixels",
      "MinValue": 100,
      "MaxValue": 4096
    },
    "ImageMaxHeight": {
      "Type": "Number",
      "Default": 768,
      "Description": "Maximum height for resized images in pixels",
      "MinValue": 100,
      "MaxValue": 4096
    }
  },

  "Resources": {
    "UploadBucket": {
      "Type": "AWS::S3::Bucket",
      "Properties": {
        "BucketName": {
          "Fn::Sub": "photo-uploads-${AWS::StackName}-${AWS::AccountId}"
        },
        "BucketEncryption": {
          "ServerSideEncryptionConfiguration": [
            {
              "ServerSideEncryptionByDefault": {
                "SSEAlgorithm": "AES256"
              }
            }
          ]
        },
        "PublicAccessBlockConfiguration": {
          "BlockPublicAcls": true,
          "BlockPublicPolicy": true,
          "IgnorePublicAcls": true,
          "RestrictPublicBuckets": true
        },
        "LifecycleConfiguration": {
          "Rules": [
            {
              "Id": "DeleteOldImages",
              "Status": "Enabled",
              "ExpirationInDays": 365
            }
          ]
        },
        "VersioningConfiguration": {
          "Status": "Enabled"
        },
        "NotificationConfiguration": {
          "LambdaConfigurations": [
            {
              "Event": "s3:ObjectCreated:*",
              "Filter": {
                "S3Key": {
                  "Rules": [
                    {
                      "Name": "suffix",
                      "Value": ".jpg"
                    }
                  ]
                }
              },
              "Function": {
                "Fn::GetAtt": ["ImageProcessorFunction", "Arn"]
              }
            },
            {
              "Event": "s3:ObjectCreated:*",
              "Filter": {
                "S3Key": {
                  "Rules": [
                    {
                      "Name": "suffix",
                      "Value": ".jpeg"
                    }
                  ]
                }
              },
              "Function": {
                "Fn::GetAtt": ["ImageProcessorFunction", "Arn"]
              }
            },
            {
              "Event": "s3:ObjectCreated:*",
              "Filter": {
                "S3Key": {
                  "Rules": [
                    {
                      "Name": "suffix",
                      "Value": ".png"
                    }
                  ]
                }
              },
              "Function": {
                "Fn::GetAtt": ["ImageProcessorFunction", "Arn"]
              }
            }
          ]
        }
      },
      "DependsOn": ["S3InvokePermission"]
    },

    "ProcessedBucket": {
      "Type": "AWS::S3::Bucket",
      "Properties": {
        "BucketName": {
          "Fn::Sub": "photo-processed-${AWS::StackName}-${AWS::AccountId}"
        },
        "BucketEncryption": {
          "ServerSideEncryptionConfiguration": [
            {
              "ServerSideEncryptionByDefault": {
                "SSEAlgorithm": "AES256"
              }
            }
          ]
        },
        "PublicAccessBlockConfiguration": {
          "BlockPublicAcls": true,
          "BlockPublicPolicy": true,
          "IgnorePublicAcls": true,
          "RestrictPublicBuckets": true
        },
        "LifecycleConfiguration": {
          "Rules": [
            {
              "Id": "MoveToIA",
              "Status": "Enabled",
              "Transitions": [
                {
                  "StorageClass": "STANDARD_IA",
                  "TransitionInDays": 30
                }
              ]
            },
            {
              "Id": "DeleteOldProcessedImages",
              "Status": "Enabled",
              "ExpirationInDays": 365
            }
          ]
        },
        "VersioningConfiguration": {
          "Status": "Enabled"
        }
      }
    },

    "ErrorNotificationTopic": {
      "Type": "AWS::SNS::Topic",
      "Properties": {
        "TopicName": {
          "Fn::Sub": "ImageProcessingErrors-${AWS::StackName}"
        },
        "DisplayName": "Image Processing Error Notifications",
        "Subscription": [
          {
            "Endpoint": {
              "Ref": "NotificationEmail"
            },
            "Protocol": "email"
          }
        ]
      }
    },

    "ImageProcessorRole": {
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
            "PolicyName": "S3AccessPolicy",
            "PolicyDocument": {
              "Version": "2012-10-17",
              "Statement": [
                {
                  "Effect": "Allow",
                  "Action": [
                    "s3:GetObject",
                    "s3:GetObjectVersion"
                  ],
                  "Resource": {
                    "Fn::Sub": "${UploadBucket.Arn}/*"
                  }
                },
                {
                  "Effect": "Allow",
                  "Action": [
                    "s3:PutObject",
                    "s3:PutObjectAcl"
                  ],
                  "Resource": {
                    "Fn::Sub": "${ProcessedBucket.Arn}/*"
                  }
                }
              ]
            }
          },
          {
            "PolicyName": "SNSPublishPolicy",
            "PolicyDocument": {
              "Version": "2012-10-17",
              "Statement": [
                {
                  "Effect": "Allow",
                  "Action": "sns:Publish",
                  "Resource": {
                    "Ref": "ErrorNotificationTopic"
                  }
                }
              ]
            }
          },
          {
            "PolicyName": "CloudWatchMetricsPolicy",
            "PolicyDocument": {
              "Version": "2012-10-17",
              "Statement": [
                {
                  "Effect": "Allow",
                  "Action": [
                    "cloudwatch:PutMetricData"
                  ],
                  "Resource": "*"
                }
              ]
            }
          }
        ]
      }
    },

    "ImageProcessorFunction": {
      "Type": "AWS::Lambda::Function",
      "Properties": {
        "FunctionName": {
          "Fn::Sub": "ImageProcessor-${AWS::StackName}"
        },
        "Runtime": "python3.11",
        "Handler": "index.lambda_handler",
        "Role": {
          "Fn::GetAtt": ["ImageProcessorRole", "Arn"]
        },
        "Timeout": 60,
        "MemorySize": 1024,
        "ReservedConcurrentExecutions": 100,
        "Environment": {
          "Variables": {
            "PROCESSED_BUCKET": {
              "Ref": "ProcessedBucket"
            },
            "SNS_TOPIC_ARN": {
              "Ref": "ErrorNotificationTopic"
            },
            "MAX_WIDTH": {
              "Ref": "ImageMaxWidth"
            },
            "MAX_HEIGHT": {
              "Ref": "ImageMaxHeight"
            }
          }
        },
        "Code": {
          "ZipFile": {
            "Fn::Sub": |
              import json
              import boto3
              import os
              import time
              from PIL import Image
              import io
              from datetime import datetime
              import logging
              import traceback
              
              # Configure logging
              logger = logging.getLogger()
              logger.setLevel(logging.INFO)
              
              # Initialize AWS clients
              s3_client = boto3.client('s3', region_name='us-west-2')
              sns_client = boto3.client('sns', region_name='us-west-2')
              cloudwatch_client = boto3.client('cloudwatch', region_name='us-west-2')
              
              # Environment variables
              PROCESSED_BUCKET = os.environ['PROCESSED_BUCKET']
              SNS_TOPIC_ARN = os.environ['SNS_TOPIC_ARN']
              MAX_WIDTH = int(os.environ['MAX_WIDTH'])
              MAX_HEIGHT = int(os.environ['MAX_HEIGHT'])
              
              def send_metric(metric_name, value, unit='Count'):
                  """Send custom metric to CloudWatch"""
                  try:
                      cloudwatch_client.put_metric_data(
                          Namespace='ImageProcessing',
                          MetricData=[
                              {
                                  'MetricName': metric_name,
                                  'Value': value,
                                  'Unit': unit,
                                  'Timestamp': datetime.utcnow()
                              }
                          ]
                      )
                  except Exception as e:
                      logger.error(f"Failed to send metric: {str(e)}")
              
              def send_error_notification(error_message, bucket, key):
                  """Send error notification via SNS"""
                  try:
                      message = {
                          'error': error_message,
                          'bucket': bucket,
                          'key': key,
                          'timestamp': datetime.utcnow().isoformat()
                      }
                      
                      sns_client.publish(
                          TopicArn=SNS_TOPIC_ARN,
                          Subject='Image Processing Error',
                          Message=json.dumps(message, indent=2)
                      )
                  except Exception as e:
                      logger.error(f"Failed to send SNS notification: {str(e)}")
              
              def resize_image(image_bytes):
                  """Resize image maintaining aspect ratio"""
                  img = Image.open(io.BytesIO(image_bytes))
                  
                  # Calculate new dimensions
                  original_width, original_height = img.size
                  logger.info(f"Original dimensions: {original_width}x{original_height}")
                  
                  # Calculate scaling factor
                  width_ratio = MAX_WIDTH / original_width
                  height_ratio = MAX_HEIGHT / original_height
                  scale_factor = min(width_ratio, height_ratio, 1.0)  # Don't upscale
                  
                  if scale_factor < 1.0:
                      new_width = int(original_width * scale_factor)
                      new_height = int(original_height * scale_factor)
                      
                      # Resize image
                      img_resized = img.resize((new_width, new_height), Image.Resampling.LANCZOS)
                      logger.info(f"Resized dimensions: {new_width}x{new_height}")
                  else:
                      img_resized = img
                      logger.info("Image already within size limits, no resizing needed")
                  
                  # Convert to RGB if necessary (for PNG with transparency)
                  if img_resized.mode in ('RGBA', 'P'):
                      img_resized = img_resized.convert('RGB')
                  
                  # Save to bytes
                  output = io.BytesIO()
                  img_resized.save(output, format='JPEG', quality=90, optimize=True)
                  return output.getvalue()
              
              def lambda_handler(event, context):
                  """Main Lambda handler function"""
                  start_time = time.time()
                  
                  for record in event['Records']:
                      bucket = record['s3']['bucket']['name']
                      key = record['s3']['object']['key']
                      
                      logger.info(f"Processing image: {bucket}/{key}")
                      
                      try:
                          # Download image from S3
                          response = s3_client.get_object(Bucket=bucket, Key=key)
                          image_bytes = response['Body'].read()
                          
                          # Get original metadata
                          metadata = response.get('Metadata', {})
                          content_type = response.get('ContentType', 'image/jpeg')
                          
                          # Resize image
                          resized_image = resize_image(image_bytes)
                          
                          # Generate output key
                          output_key = f"resized/{key}"
                          
                          # Upload to processed bucket
                          s3_client.put_object(
                              Bucket=PROCESSED_BUCKET,
                              Key=output_key,
                              Body=resized_image,
                              ContentType='image/jpeg',
                              Metadata={
                                  **metadata,
                                  'original-bucket': bucket,
                                  'original-key': key,
                                  'processed-date': datetime.utcnow().isoformat()
                              }
                          )
                          
                          # Calculate processing time
                          processing_time = (time.time() - start_time) * 1000  # Convert to milliseconds
                          
                          # Send success metrics
                          send_metric('ProcessedImages', 1)
                          send_metric('ProcessingTime', processing_time, 'Milliseconds')
                          
                          logger.info(f"Successfully processed image: {output_key} in {processing_time:.2f}ms")
                          
                      except Exception as e:
                          error_msg = f"Error processing {bucket}/{key}: {str(e)}\n{traceback.format_exc()}"
                          logger.error(error_msg)
                          
                          # Send error notification
                          send_error_notification(str(e), bucket, key)
                          
                          # Send error metric
                          send_metric('ProcessingErrors', 1)
                          
                          # Re-raise the exception to mark Lambda execution as failed
                          raise
                  
                  return {
                      'statusCode': 200,
                      'body': json.dumps('Image processing completed successfully')
                  }
          }
        }
      }
    },

    "ImageProcessorFunctionLogGroup": {
      "Type": "AWS::Logs::LogGroup",
      "Properties": {
        "LogGroupName": {
          "Fn::Sub": "/aws/lambda/ImageProcessor-${AWS::StackName}"
        },
        "RetentionInDays": 30
      }
    },

    "S3InvokePermission": {
      "Type": "AWS::Lambda::Permission",
      "Properties": {
        "FunctionName": {
          "Ref": "ImageProcessorFunction"
        },
        "Action": "lambda:InvokeFunction",
        "Principal": "s3.amazonaws.com",
        "SourceAccount": {
          "Ref": "AWS::AccountId"
        }
      }
    },

    "ProcessingAlarmTopic": {
      "Type": "AWS::SNS::Topic",
      "Properties": {
        "TopicName": {
          "Fn::Sub": "ImageProcessingAlarms-${AWS::StackName}"
        },
        "DisplayName": "Image Processing Alarms",
        "Subscription": [
          {
            "Endpoint": {
              "Ref": "NotificationEmail"
            },
            "Protocol": "email"
          }
        ]
      }
    },

    "LambdaErrorAlarm": {
      "Type": "AWS::CloudWatch::Alarm",
      "Properties": {
        "AlarmName": {
          "Fn::Sub": "ImageProcessor-Errors-${AWS::StackName}"
        },
        "AlarmDescription": "Alert when Lambda function errors exceed threshold",
        "MetricName": "Errors",
        "Namespace": "AWS/Lambda",
        "Statistic": "Sum",
        "Period": 300,
        "EvaluationPeriods": 2,
        "Threshold": 10,
        "ComparisonOperator": "GreaterThanThreshold",
        "Dimensions": [
          {
            "Name": "FunctionName",
            "Value": {
              "Ref": "ImageProcessorFunction"
            }
          }
        ],
        "AlarmActions": [
          {
            "Ref": "ProcessingAlarmTopic"
          }
        ],
        "TreatMissingData": "notBreaching"
      }
    },

    "LambdaThrottleAlarm": {
      "Type": "AWS::CloudWatch::Alarm",
      "Properties": {
        "AlarmName": {
          "Fn::Sub": "ImageProcessor-Throttles-${AWS::StackName}"
        },
        "AlarmDescription": "Alert when Lambda function is throttled",
        "MetricName": "Throttles",
        "Namespace": "AWS/Lambda",
        "Statistic": "Sum",
        "Period": 300,
        "EvaluationPeriods": 1,
        "Threshold": 5,
        "ComparisonOperator": "GreaterThanThreshold",
        "Dimensions": [
          {
            "Name": "FunctionName",
            "Value": {
              "Ref": "ImageProcessorFunction"
            }
          }
        ],
        "AlarmActions": [
          {
            "Ref": "ProcessingAlarmTopic"
          }
        ],
        "TreatMissingData": "notBreaching"
      }
    },

    "ProcessingDashboard": {
      "Type": "AWS::CloudWatch::Dashboard",
      "Properties": {
        "DashboardName": {
          "Fn::Sub": "ImageProcessing-${AWS::StackName}"
        },
        "DashboardBody": {
          "Fn::Sub": |
            {
              "widgets": [
                {
                  "type": "metric",
                  "properties": {
                    "title": "Lambda Invocations",
                    "period": 300,
                    "stat": "Sum",
                    "region": "us-west-2",
                    "metrics": [
                      ["AWS/Lambda", "Invocations", {"stat": "Sum", "label": "Invocations"}],
                      [".", "Errors", {"stat": "Sum", "label": "Errors"}],
                      [".", "Throttles", {"stat": "Sum", "label": "Throttles"}]
                    ],
                    "dimensions": {
                      "FunctionName": "${ImageProcessorFunction}"
                    }
                  }
                },
                {
                  "type": "metric",
                  "properties": {
                    "title": "Processing Performance",
                    "period": 300,
                    "stat": "Average",
                    "region": "us-west-2",
                    "metrics": [
                      ["AWS/Lambda", "Duration", {"stat": "Average", "label": "Avg Duration (ms)"}],
                      [".", ".", {"stat": "Maximum", "label": "Max Duration (ms)"}],
                      [".", ".", {"stat": "Minimum", "label": "Min Duration (ms)"}]
                    ],
                    "dimensions": {
                      "FunctionName": "${ImageProcessorFunction}"
                    }
                  }
                },
                {
                  "type": "metric",
                  "properties": {
                    "title": "Custom Metrics",
                    "period": 300,
                    "stat": "Sum",
                    "region": "us-west-2",
                    "metrics": [
                      ["ImageProcessing", "ProcessedImages", {"stat": "Sum", "label": "Processed Images"}],
                      [".", "ProcessingErrors", {"stat": "Sum", "label": "Processing Errors"}]
                    ]
                  }
                },
                {
                  "type": "metric",
                  "properties": {
                    "title": "Lambda Concurrent Executions",
                    "period": 60,
                    "stat": "Maximum",
                    "region": "us-west-2",
                    "metrics": [
                      ["AWS/Lambda", "ConcurrentExecutions", {"stat": "Maximum", "label": "Concurrent Executions"}]
                    ],
                    "dimensions": {
                      "FunctionName": "${ImageProcessorFunction}"
                    }
                  }
                }
              ]
            }
        }
      }
    }
  },

  "Outputs": {
    "UploadBucketName": {
      "Description": "Name of the S3 bucket for image uploads",
      "Value": {
        "Ref": "UploadBucket"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-UploadBucket"
        }
      }
    },
    "ProcessedBucketName": {
      "Description": "Name of the S3 bucket for processed images",
      "Value": {
        "Ref": "ProcessedBucket"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-ProcessedBucket"
        }
      }
    },
    "LambdaFunctionArn": {
      "Description": "ARN of the image processor Lambda function",
      "Value": {
        "Fn::GetAtt": ["ImageProcessorFunction", "Arn"]
      }
    },
    "ErrorNotificationTopicArn": {
      "Description": "ARN of the SNS topic for error notifications",
      "Value": {
        "Ref": "ErrorNotificationTopic"
      }
    },
    "DashboardURL": {
      "Description": "CloudWatch Dashboard URL",
      "Value": {
        "Fn::Sub": "https://console.aws.amazon.com/cloudwatch/home?region=us-west-2#dashboards:name=ImageProcessing-${AWS::StackName}"
      }
    }
  }
}
```

## Key Features Explained

### 1. **Storage Configuration**
- **Two S3 Buckets**: Separate buckets for uploads and processed images
- **Encryption**: AES256 server-side encryption enabled
- **Versioning**: Enabled for data protection
- **Lifecycle Rules**: Automatic cleanup of old images and transition to cheaper storage

### 2. **Lambda Function**
- **Runtime**: Python 3.11 with Pillow library for image processing
- **Memory**: 1GB allocated for efficient image processing
- **Concurrent Executions**: Limited to 100 to prevent overwhelming the system
- **Error Handling**: Comprehensive try-catch blocks with detailed logging

### 3. **Event-Driven Processing**
- **S3 Event Triggers**: Automatic Lambda invocation for .jpg, .jpeg, and .png files
- **Asynchronous Processing**: Non-blocking image processing

### 4. **Monitoring & Alerting**
- **CloudWatch Logs**: Detailed logging with 30-day retention
- **Custom Metrics**: Processing time and success/failure counts
- **Alarms**: Automatic alerts for errors and throttling
- **Dashboard**: Real-time visualization of processing metrics

### 5. **Security**
- **IAM Roles**: Least-privilege access with specific permissions
- **Public Access Block**: Prevents accidental public exposure
- **Encrypted Storage**: All data encrypted at rest

## Deployment Instructions

1. **Save the template** as `image-processing-pipeline.json`

2. **Deploy using AWS CLI**:
```bash
aws cloudformation create-stack \
  --stack-name photo-processing-pipeline \
  --template-body file://image-processing-pipeline.json \
  --parameters ParameterKey=NotificationEmail,ParameterValue=your-email@example.com \
  --capabilities CAPABILITY_IAM \
  --region us-west-2
```

3. **Monitor deployment**:
```bash
aws cloudformation describe-stacks \
  --stack-name photo-processing-pipeline \
  --region us-west-2
```

## Testing the Pipeline

1. **Upload a test image**:
```bash
aws s3 cp test-image.jpg s3://photo-uploads-<stack-name>-<account-id>/
```

2. **Check processed images**:
```bash
aws s3 ls s3://photo-processed-<stack-name>-<account-id>/resized/
```

3. **View metrics in CloudWatch Dashboard** using the URL provided in stack outputs

## Cost Optimization

- **Lambda**: Pay only for actual processing time (approximately $0.20/day for 4,000 images)
- **S3 Lifecycle**: Automatic transition to Infrequent Access storage after 30 days
- **Reserved Concurrency**: Prevents runaway costs from excessive concurrent executions

This solution scales automatically to handle your 4,000 daily images while maintaining high availability and fault tolerance.