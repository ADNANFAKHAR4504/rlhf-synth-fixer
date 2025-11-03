# Media Processing Pipeline - CloudFormation Implementation

This implementation provides a basic media processing pipeline using AWS services. The infrastructure includes S3 buckets for storage, Lambda functions for processing orchestration, and supporting services.

## File: lib/TapStack.json

```json
{
  "AWSTemplateFormatVersion": "2010-09-09",
  "Description": "Media Processing Pipeline for Japanese Streaming Service",
  "Parameters": {
    "environmentSuffix": {
      "Type": "String",
      "Description": "Environment suffix for resource naming",
      "Default": "dev"
    }
  },
  "Resources": {
    "RawVideosBucket": {
      "Type": "AWS::S3::Bucket",
      "Properties": {
        "BucketName": {
          "Fn::Sub": "raw-videos-${environmentSuffix}"
        },
        "VersioningConfiguration": {
          "Status": "Enabled"
        },
        "BucketEncryption": {
          "ServerSideEncryptionConfiguration": [
            {
              "ServerSideEncryptionByDefault": {
                "SSEAlgorithm": "AES256"
              }
            }
          ]
        }
      }
    },
    "ProcessedVideosBucket": {
      "Type": "AWS::S3::Bucket",
      "Properties": {
        "BucketName": {
          "Fn::Sub": "processed-videos-${environmentSuffix}"
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
        "LifecycleConfiguration": {
          "Rules": [
            {
              "Id": "DeleteOldVersions",
              "Status": "Enabled",
              "NoncurrentVersionExpirationInDays": 30
            }
          ]
        }
      }
    },
    "ThumbnailsBucket": {
      "Type": "AWS::S3::Bucket",
      "Properties": {
        "BucketName": {
          "Fn::Sub": "thumbnails-${environmentSuffix}"
        }
      }
    },
    "JobStatusTable": {
      "Type": "AWS::DynamoDB::Table",
      "Properties": {
        "TableName": {
          "Fn::Sub": "media-jobs-${environmentSuffix}"
        },
        "AttributeDefinitions": [
          {
            "AttributeName": "jobId",
            "AttributeType": "S"
          }
        ],
        "KeySchema": [
          {
            "AttributeName": "jobId",
            "KeyType": "HASH"
          }
        ],
        "BillingMode": "PAY_PER_REQUEST"
      }
    },
    "MediaConvertRole": {
      "Type": "AWS::IAM::Role",
      "Properties": {
        "RoleName": {
          "Fn::Sub": "MediaConvertRole-${environmentSuffix}"
        },
        "AssumeRolePolicyDocument": {
          "Version": "2012-10-17",
          "Statement": [
            {
              "Effect": "Allow",
              "Principal": {
                "Service": "mediaconvert.amazonaws.com"
              },
              "Action": "sts:AssumeRole"
            }
          ]
        },
        "ManagedPolicyArns": [
          "arn:aws:iam::aws:policy/AmazonS3FullAccess"
        ]
      }
    },
    "ProcessingLambdaRole": {
      "Type": "AWS::IAM::Role",
      "Properties": {
        "RoleName": {
          "Fn::Sub": "ProcessingLambdaRole-${environmentSuffix}"
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
          "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole",
          "arn:aws:iam::aws:policy/AmazonS3FullAccess",
          "arn:aws:iam::aws:policy/AmazonDynamoDBFullAccess"
        ]
      }
    },
    "ProcessingLambda": {
      "Type": "AWS::Lambda::Function",
      "Properties": {
        "FunctionName": {
          "Fn::Sub": "media-processor-${environmentSuffix}"
        },
        "Runtime": "python3.11",
        "Handler": "index.handler",
        "Role": {
          "Fn::GetAtt": ["ProcessingLambdaRole", "Arn"]
        },
        "Timeout": 300,
        "MemorySize": 512,
        "Code": {
          "ZipFile": "import json\nimport boto3\nimport os\n\ndef handler(event, context):\n    print('Processing video:', json.dumps(event))\n    s3 = boto3.client('s3')\n    mediaconvert = boto3.client('mediaconvert')\n    dynamodb = boto3.resource('dynamodb')\n    \n    # Extract S3 event details\n    bucket = event['Records'][0]['s3']['bucket']['name']\n    key = event['Records'][0]['s3']['object']['key']\n    \n    # Create job entry in DynamoDB\n    table = dynamodb.Table(os.environ['JOB_TABLE'])\n    job_id = context.request_id\n    table.put_item(Item={'jobId': job_id, 'status': 'PROCESSING', 'inputFile': key})\n    \n    return {'statusCode': 200, 'body': json.dumps('Processing started')}\n"
        },
        "Environment": {
          "Variables": {
            "JOB_TABLE": {
              "Ref": "JobStatusTable"
            },
            "PROCESSED_BUCKET": {
              "Ref": "ProcessedVideosBucket"
            }
          }
        }
      }
    },
    "S3InvokePermission": {
      "Type": "AWS::Lambda::Permission",
      "Properties": {
        "FunctionName": {
          "Ref": "ProcessingLambda"
        },
        "Action": "lambda:InvokeFunction",
        "Principal": "s3.amazonaws.com",
        "SourceArn": {
          "Fn::GetAtt": ["RawVideosBucket", "Arn"]
        }
      }
    },
    "JobCompletionTopic": {
      "Type": "AWS::SNS::Topic",
      "Properties": {
        "TopicName": {
          "Fn::Sub": "media-jobs-${environmentSuffix}"
        }
      }
    }
  },
  "Outputs": {
    "RawVideosBucketName": {
      "Description": "Raw videos bucket name",
      "Value": {
        "Ref": "RawVideosBucket"
      }
    },
    "ProcessedVideosBucketName": {
      "Description": "Processed videos bucket name",
      "Value": {
        "Ref": "ProcessedVideosBucket"
      }
    },
    "JobStatusTableName": {
      "Description": "DynamoDB table for job status",
      "Value": {
        "Ref": "JobStatusTable"
      }
    },
    "ProcessingLambdaArn": {
      "Description": "Processing Lambda ARN",
      "Value": {
        "Fn::GetAtt": ["ProcessingLambda", "Arn"]
      }
    }
  }
}
```

## Implementation Notes

This CloudFormation template creates:

1. **S3 Buckets**: Three buckets for raw videos, processed videos, and thumbnails with basic encryption
2. **DynamoDB Table**: For tracking job status
3. **IAM Roles**: For MediaConvert and Lambda with managed policies
4. **Lambda Function**: For orchestrating the processing workflow
5. **SNS Topic**: For job completion notifications

## Known Limitations

- S3 bucket notification configuration is not included (needs to be added manually)
- MediaConvert job template is not defined
- Missing EventBridge rules for automated processing
- No Step Functions state machine for complex workflows
- Missing SQS queues for retry handling
- CloudWatch alarms and dashboards not configured
- Encryption uses default AES256 instead of KMS
- IAM policies use managed policies with overly broad permissions
- No bucket policies for access control
- Missing CloudWatch Logs retention policies
- No tags on resources
- Lambda code is inline and basic

## Deployment

```bash
aws cloudformation create-stack \
  --stack-name media-pipeline-stack \
  --template-body file://lib/TapStack.json \
  --parameters ParameterKey=environmentSuffix,ParameterValue=dev \
  --capabilities CAPABILITY_NAMED_IAM \
  --region eu-south-2
```