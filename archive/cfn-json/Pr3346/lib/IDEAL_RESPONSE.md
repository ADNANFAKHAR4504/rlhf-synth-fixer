```json
{
  "AWSTemplateFormatVersion": "2010-09-09",
  "Description": "Serverless image processing pipeline for photo-sharing application",
  "Parameters": {
    "NotificationEmail": {
      "Type": "String",
      "Description": "Email address for error notifications",
      "Default": "test@example.com",
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
                "Fn::GetAtt": [
                  "ImageProcessorFunction",
                  "Arn"
                ]
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
                "Fn::GetAtt": [
                  "ImageProcessorFunction",
                  "Arn"
                ]
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
                "Fn::GetAtt": [
                  "ImageProcessorFunction",
                  "Arn"
                ]
              }
            }
          ]
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "photo-uploads-${AWS::StackName}"
            }
          },
          {
            "Key": "Purpose",
            "Value": "Image upload storage"
          }
        ]
      },
      "DependsOn": [
        "S3InvokePermission"
      ]
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
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "photo-processed-${AWS::StackName}"
            }
          },
          {
            "Key": "Purpose",
            "Value": "Processed image storage"
          }
        ]
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
        ],
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "ImageProcessingErrors-${AWS::StackName}"
            }
          },
          {
            "Key": "Purpose",
            "Value": "Error notification topic"
          }
        ]
      }
    },
    "ImageProcessorRole": {
      "Type": "AWS::IAM::Role",
      "Properties": {
        "RoleName": {
          "Fn::Sub": "ImageProcessorRole-${AWS::StackName}"
        },
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
                    "Fn::Sub": "arn:aws:s3:::photo-uploads-${AWS::StackName}-${AWS::AccountId}/*"
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
        ],
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "ImageProcessorRole-${AWS::StackName}"
            }
          },
          {
            "Key": "Purpose",
            "Value": "Lambda execution role"
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
          "Fn::GetAtt": [
            "ImageProcessorRole",
            "Arn"
          ]
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
          "ZipFile": "import json\nimport boto3\nimport os\nimport time\nfrom PIL import Image\nimport io\nfrom datetime import datetime\nimport logging\nimport traceback\n\nlogger = logging.getLogger()\nlogger.setLevel(logging.INFO)\n\ns3_client = boto3.client('s3', region_name='us-west-2')\nsns_client = boto3.client('sns', region_name='us-west-2')\ncloudwatch_client = boto3.client('cloudwatch', region_name='us-west-2')\n\nPROCESSED_BUCKET = os.environ['PROCESSED_BUCKET']\nSNS_TOPIC_ARN = os.environ['SNS_TOPIC_ARN']\nMAX_WIDTH = int(os.environ['MAX_WIDTH'])\nMAX_HEIGHT = int(os.environ['MAX_HEIGHT'])\n\ndef send_metric(metric_name, value, unit='Count'):\n    try:\n        cloudwatch_client.put_metric_data(\n            Namespace='ImageProcessing',\n            MetricData=[\n                {\n                    'MetricName': metric_name,\n                    'Value': value,\n                    'Unit': unit,\n                    'Timestamp': datetime.utcnow()\n                }\n            ]\n        )\n    except Exception as e:\n        logger.error(f\"Failed to send metric: {str(e)}\")\n\ndef send_error_notification(error_message, bucket, key):\n    try:\n        message = {\n            'error': error_message,\n            'bucket': bucket,\n            'key': key,\n            'timestamp': datetime.utcnow().isoformat()\n        }\n        sns_client.publish(\n            TopicArn=SNS_TOPIC_ARN,\n            Subject='Image Processing Error',\n            Message=json.dumps(message, indent=2)\n        )\n    except Exception as e:\n        logger.error(f\"Failed to send SNS notification: {str(e)}\")\n\ndef resize_image(image_bytes):\n    img = Image.open(io.BytesIO(image_bytes))\n    original_width, original_height = img.size\n    logger.info(f\"Original dimensions: {original_width}x{original_height}\")\n    \n    width_ratio = MAX_WIDTH / original_width\n    height_ratio = MAX_HEIGHT / original_height\n    scale_factor = min(width_ratio, height_ratio, 1.0)\n    \n    if scale_factor < 1.0:\n        new_width = int(original_width * scale_factor)\n        new_height = int(original_height * scale_factor)\n        img_resized = img.resize((new_width, new_height), Image.Resampling.LANCZOS)\n        logger.info(f\"Resized dimensions: {new_width}x{new_height}\")\n    else:\n        img_resized = img\n        logger.info(\"Image already within size limits, no resizing needed\")\n    \n    if img_resized.mode in ('RGBA', 'P'):\n        img_resized = img_resized.convert('RGB')\n    \n    output = io.BytesIO()\n    img_resized.save(output, format='JPEG', quality=90, optimize=True)\n    return output.getvalue()\n\ndef lambda_handler(event, context):\n    start_time = time.time()\n    \n    for record in event['Records']:\n        bucket = record['s3']['bucket']['name']\n        key = record['s3']['object']['key']\n        logger.info(f\"Processing image: {bucket}/{key}\")\n        \n        try:\n            response = s3_client.get_object(Bucket=bucket, Key=key)\n            image_bytes = response['Body'].read()\n            metadata = response.get('Metadata', {})\n            content_type = response.get('ContentType', 'image/jpeg')\n            \n            resized_image = resize_image(image_bytes)\n            output_key = f\"resized/{key}\"\n            \n            s3_client.put_object(\n                Bucket=PROCESSED_BUCKET,\n                Key=output_key,\n                Body=resized_image,\n                ContentType='image/jpeg',\n                Metadata={\n                    **metadata,\n                    'original-bucket': bucket,\n                    'original-key': key,\n                    'processed-date': datetime.utcnow().isoformat()\n                }\n            )\n            \n            processing_time = (time.time() - start_time) * 1000\n            send_metric('ProcessedImages', 1)\n            send_metric('ProcessingTime', processing_time, 'Milliseconds')\n            logger.info(f\"Successfully processed image: {output_key} in {processing_time:.2f}ms\")\n            \n        except Exception as e:\n            error_msg = f\"Error processing {bucket}/{key}: {str(e)}\\n{traceback.format_exc()}\"\n            logger.error(error_msg)\n            send_error_notification(str(e), bucket, key)\n            send_metric('ProcessingErrors', 1)\n            raise\n    \n    return {\n        'statusCode': 200,\n        'body': json.dumps('Image processing completed successfully')\n    }\n"
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "ImageProcessor-${AWS::StackName}"
            }
          },
          {
            "Key": "Purpose",
            "Value": "Image processing function"
          }
        ]
      }
    },
    "ImageProcessorFunctionLogGroup": {
      "Type": "AWS::Logs::LogGroup",
      "Properties": {
        "LogGroupName": {
          "Fn::Sub": "/aws/lambda/ImageProcessor-${AWS::StackName}"
        },
        "RetentionInDays": 30,
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "/aws/lambda/ImageProcessor-${AWS::StackName}"
            }
          },
          {
            "Key": "Purpose",
            "Value": "Lambda function logs"
          }
        ]
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
        },
        "SourceArn": {
          "Fn::Sub": "arn:aws:s3:::photo-uploads-${AWS::StackName}-${AWS::AccountId}"
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
        ],
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "ImageProcessingAlarms-${AWS::StackName}"
            }
          },
          {
            "Key": "Purpose",
            "Value": "Alarm notification topic"
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
          "Fn::Sub": "{\"widgets\":[{\"type\":\"metric\",\"properties\":{\"title\":\"Lambda Invocations\",\"period\":300,\"stat\":\"Sum\",\"region\":\"us-west-2\",\"metrics\":[[\"AWS/Lambda\",\"Invocations\",{\"stat\":\"Sum\",\"label\":\"Invocations\"}],[\".\",\"Errors\",{\"stat\":\"Sum\",\"label\":\"Errors\"}],[\".\",\"Throttles\",{\"stat\":\"Sum\",\"label\":\"Throttles\"}]],\"dimensions\":{\"FunctionName\":\"${ImageProcessorFunction}\"}}},{\"type\":\"metric\",\"properties\":{\"title\":\"Processing Performance\",\"period\":300,\"stat\":\"Average\",\"region\":\"us-west-2\",\"metrics\":[[\"AWS/Lambda\",\"Duration\",{\"stat\":\"Average\",\"label\":\"Avg Duration (ms)\"}],[\".\",\".\",{\"stat\":\"Maximum\",\"label\":\"Max Duration (ms)\"}],[\".\",\".\",{\"stat\":\"Minimum\",\"label\":\"Min Duration (ms)\"}]],\"dimensions\":{\"FunctionName\":\"${ImageProcessorFunction}\"}}},{\"type\":\"metric\",\"properties\":{\"title\":\"Custom Metrics\",\"period\":300,\"stat\":\"Sum\",\"region\":\"us-west-2\",\"metrics\":[[\"ImageProcessing\",\"ProcessedImages\",{\"stat\":\"Sum\",\"label\":\"Processed Images\"}],[\".\",\"ProcessingErrors\",{\"stat\":\"Sum\",\"label\":\"Processing Errors\"}]]}},{\"type\":\"metric\",\"properties\":{\"title\":\"Lambda Concurrent Executions\",\"period\":60,\"stat\":\"Maximum\",\"region\":\"us-west-2\",\"metrics\":[[\"AWS/Lambda\",\"ConcurrentExecutions\",{\"stat\":\"Maximum\",\"label\":\"Concurrent Executions\"}]],\"dimensions\":{\"FunctionName\":\"${ImageProcessorFunction}\"}}}]}"
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
        "Fn::GetAtt": [
          "ImageProcessorFunction",
          "Arn"
        ]
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-LambdaFunctionArn"
        }
      }
    },
    "ErrorNotificationTopicArn": {
      "Description": "ARN of the SNS topic for error notifications",
      "Value": {
        "Ref": "ErrorNotificationTopic"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-ErrorNotificationTopic"
        }
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