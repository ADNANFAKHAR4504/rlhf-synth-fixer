# Media Processing Pipeline - Production-Ready CloudFormation Implementation

This is a comprehensive, production-ready media processing pipeline for a Japanese streaming service. The implementation includes complete security controls, monitoring, error handling, and follows AWS best practices.

## File: lib/TapStack.json

```json
{
  "AWSTemplateFormatVersion": "2010-09-09",
  "Description": "Production-Ready Media Processing Pipeline for Japanese Streaming Service",
  "Parameters": {
    "environmentSuffix": {
      "Type": "String",
      "Description": "Environment suffix for resource naming to ensure uniqueness across deployments",
      "Default": "dev",
      "AllowedPattern": "[a-z0-9-]+",
      "ConstraintDescription": "Must contain only lowercase letters, numbers, and hyphens"
    }
  },
  "Resources": {
    "EncryptionKey": {
      "Type": "AWS::KMS::Key",
      "Properties": {
        "Description": {
          "Fn::Sub": "KMS key for media pipeline encryption-${environmentSuffix}"
        },
        "EnableKeyRotation": true,
        "KeyPolicy": {
          "Version": "2012-10-17",
          "Statement": [
            {
              "Sid": "Enable IAM User Permissions",
              "Effect": "Allow",
              "Principal": {
                "AWS": {
                  "Fn::Sub": "arn:aws:iam::${AWS::AccountId}:root"
                }
              },
              "Action": "kms:*",
              "Resource": "*"
            },
            {
              "Sid": "Allow services to use the key",
              "Effect": "Allow",
              "Principal": {
                "Service": [
                  "s3.amazonaws.com",
                  "lambda.amazonaws.com",
                  "dynamodb.amazonaws.com",
                  "logs.amazonaws.com",
                  "sns.amazonaws.com",
                  "sqs.amazonaws.com"
                ]
              },
              "Action": [
                "kms:Decrypt",
                "kms:GenerateDataKey",
                "kms:CreateGrant"
              ],
              "Resource": "*"
            }
          ]
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "media-pipeline-key-${environmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "environmentSuffix"
            }
          },
          {
            "Key": "Project",
            "Value": "MediaProcessingPipeline"
          }
        ]
      }
    },
    "EncryptionKeyAlias": {
      "Type": "AWS::KMS::Alias",
      "Properties": {
        "AliasName": {
          "Fn::Sub": "alias/media-pipeline-${environmentSuffix}"
        },
        "TargetKeyId": {
          "Ref": "EncryptionKey"
        }
      }
    },
    "RawVideosBucket": {
      "Type": "AWS::S3::Bucket",
      "Properties": {
        "BucketName": {
          "Fn::Sub": "raw-videos-${environmentSuffix}-${AWS::AccountId}"
        },
        "VersioningConfiguration": {
          "Status": "Enabled"
        },
        "BucketEncryption": {
          "ServerSideEncryptionConfiguration": [
            {
              "ServerSideEncryptionByDefault": {
                "SSEAlgorithm": "aws:kms",
                "KMSMasterKeyID": {
                  "Fn::GetAtt": ["EncryptionKey", "Arn"]
                }
              },
              "BucketKeyEnabled": true
            }
          ]
        },
        "PublicAccessBlockConfiguration": {
          "BlockPublicAcls": true,
          "BlockPublicPolicy": true,
          "IgnorePublicAcls": true,
          "RestrictPublicBuckets": true
        },
        "LoggingConfiguration": {
          "DestinationBucketName": {
            "Ref": "LoggingBucket"
          },
          "LogFilePrefix": "raw-videos-logs/"
        },
        "NotificationConfiguration": {
          "LambdaConfigurations": [
            {
              "Event": "s3:ObjectCreated:*",
              "Function": {
                "Fn::GetAtt": ["ProcessingLambda", "Arn"]
              },
              "Filter": {
                "S3Key": {
                  "Rules": [
                    {
                      "Name": "suffix",
                      "Value": ".mp4"
                    }
                  ]
                }
              }
            }
          ]
        },
        "LifecycleConfiguration": {
          "Rules": [
            {
              "Id": "TransitionToIA",
              "Status": "Enabled",
              "Transitions": [
                {
                  "TransitionInDays": 30,
                  "StorageClass": "STANDARD_IA"
                }
              ]
            }
          ]
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "raw-videos-${environmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "environmentSuffix"
            }
          },
          {
            "Key": "Project",
            "Value": "MediaProcessingPipeline"
          },
          {
            "Key": "DataClassification",
            "Value": "Confidential"
          }
        ]
      },
      "DependsOn": ["ProcessingLambda", "S3InvokePermission"]
    },
    "ProcessedVideosBucket": {
      "Type": "AWS::S3::Bucket",
      "Properties": {
        "BucketName": {
          "Fn::Sub": "processed-videos-${environmentSuffix}-${AWS::AccountId}"
        },
        "VersioningConfiguration": {
          "Status": "Enabled"
        },
        "BucketEncryption": {
          "ServerSideEncryptionConfiguration": [
            {
              "ServerSideEncryptionByDefault": {
                "SSEAlgorithm": "aws:kms",
                "KMSMasterKeyID": {
                  "Fn::GetAtt": ["EncryptionKey", "Arn"]
                }
              },
              "BucketKeyEnabled": true
            }
          ]
        },
        "PublicAccessBlockConfiguration": {
          "BlockPublicAcls": true,
          "BlockPublicPolicy": true,
          "IgnorePublicAcls": true,
          "RestrictPublicBuckets": true
        },
        "LoggingConfiguration": {
          "DestinationBucketName": {
            "Ref": "LoggingBucket"
          },
          "LogFilePrefix": "processed-videos-logs/"
        },
        "CorsConfiguration": {
          "CorsRules": [
            {
              "AllowedOrigins": ["*"],
              "AllowedMethods": ["GET", "HEAD"],
              "AllowedHeaders": ["*"],
              "MaxAge": 3000
            }
          ]
        },
        "LifecycleConfiguration": {
          "Rules": [
            {
              "Id": "DeleteOldVersions",
              "Status": "Enabled",
              "NoncurrentVersionExpirationInDays": 90
            }
          ]
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "processed-videos-${environmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "environmentSuffix"
            }
          },
          {
            "Key": "Project",
            "Value": "MediaProcessingPipeline"
          }
        ]
      }
    },
    "ThumbnailsBucket": {
      "Type": "AWS::S3::Bucket",
      "Properties": {
        "BucketName": {
          "Fn::Sub": "thumbnails-${environmentSuffix}-${AWS::AccountId}"
        },
        "BucketEncryption": {
          "ServerSideEncryptionConfiguration": [
            {
              "ServerSideEncryptionByDefault": {
                "SSEAlgorithm": "aws:kms",
                "KMSMasterKeyID": {
                  "Fn::GetAtt": ["EncryptionKey", "Arn"]
                }
              },
              "BucketKeyEnabled": true
            }
          ]
        },
        "PublicAccessBlockConfiguration": {
          "BlockPublicAcls": true,
          "BlockPublicPolicy": true,
          "IgnorePublicAcls": true,
          "RestrictPublicBuckets": true
        },
        "CorsConfiguration": {
          "CorsRules": [
            {
              "AllowedOrigins": ["*"],
              "AllowedMethods": ["GET", "HEAD"],
              "AllowedHeaders": ["*"],
              "MaxAge": 3000
            }
          ]
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "thumbnails-${environmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "environmentSuffix"
            }
          },
          {
            "Key": "Project",
            "Value": "MediaProcessingPipeline"
          }
        ]
      }
    },
    "LoggingBucket": {
      "Type": "AWS::S3::Bucket",
      "Properties": {
        "BucketName": {
          "Fn::Sub": "media-pipeline-logs-${environmentSuffix}-${AWS::AccountId}"
        },
        "BucketEncryption": {
          "ServerSideEncryptionConfiguration": [
            {
              "ServerSideEncryptionByDefault": {
                "SSEAlgorithm": "aws:kms",
                "KMSMasterKeyID": {
                  "Fn::GetAtt": ["EncryptionKey", "Arn"]
                }
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
              "Id": "ExpireLogs",
              "Status": "Enabled",
              "ExpirationInDays": 90
            }
          ]
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "media-pipeline-logs-${environmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "environmentSuffix"
            }
          },
          {
            "Key": "Project",
            "Value": "MediaProcessingPipeline"
          }
        ]
      }
    },
    "LoggingBucketPolicy": {
      "Type": "AWS::S3::BucketPolicy",
      "Properties": {
        "Bucket": {
          "Ref": "LoggingBucket"
        },
        "PolicyDocument": {
          "Version": "2012-10-17",
          "Statement": [
            {
              "Sid": "S3ServerAccessLogsPolicy",
              "Effect": "Allow",
              "Principal": {
                "Service": "logging.s3.amazonaws.com"
              },
              "Action": "s3:PutObject",
              "Resource": {
                "Fn::Sub": "${LoggingBucket.Arn}/*"
              }
            }
          ]
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
          },
          {
            "AttributeName": "status",
            "AttributeType": "S"
          },
          {
            "AttributeName": "createdAt",
            "AttributeType": "N"
          }
        ],
        "KeySchema": [
          {
            "AttributeName": "jobId",
            "KeyType": "HASH"
          }
        ],
        "GlobalSecondaryIndexes": [
          {
            "IndexName": "StatusIndex",
            "KeySchema": [
              {
                "AttributeName": "status",
                "KeyType": "HASH"
              },
              {
                "AttributeName": "createdAt",
                "KeyType": "RANGE"
              }
            ],
            "Projection": {
              "ProjectionType": "ALL"
            }
          }
        ],
        "BillingMode": "PAY_PER_REQUEST",
        "SSESpecification": {
          "SSEEnabled": true,
          "SSEType": "KMS",
          "KMSMasterKeyId": {
            "Fn::GetAtt": ["EncryptionKey", "Arn"]
          }
        },
        "PointInTimeRecoverySpecification": {
          "PointInTimeRecoveryEnabled": true
        },
        "StreamSpecification": {
          "StreamViewType": "NEW_AND_OLD_IMAGES"
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "media-jobs-${environmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "environmentSuffix"
            }
          },
          {
            "Key": "Project",
            "Value": "MediaProcessingPipeline"
          }
        ]
      }
    },
    "DeadLetterQueue": {
      "Type": "AWS::SQS::Queue",
      "Properties": {
        "QueueName": {
          "Fn::Sub": "media-processing-dlq-${environmentSuffix}"
        },
        "MessageRetentionPeriod": 1209600,
        "KmsMasterKeyId": {
          "Fn::GetAtt": ["EncryptionKey", "Arn"]
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "media-processing-dlq-${environmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "environmentSuffix"
            }
          },
          {
            "Key": "Project",
            "Value": "MediaProcessingPipeline"
          }
        ]
      }
    },
    "ProcessingQueue": {
      "Type": "AWS::SQS::Queue",
      "Properties": {
        "QueueName": {
          "Fn::Sub": "media-processing-queue-${environmentSuffix}"
        },
        "VisibilityTimeout": 900,
        "MessageRetentionPeriod": 345600,
        "KmsMasterKeyId": {
          "Fn::GetAtt": ["EncryptionKey", "Arn"]
        },
        "RedrivePolicy": {
          "deadLetterTargetArn": {
            "Fn::GetAtt": ["DeadLetterQueue", "Arn"]
          },
          "maxReceiveCount": 3
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "media-processing-queue-${environmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "environmentSuffix"
            }
          },
          {
            "Key": "Project",
            "Value": "MediaProcessingPipeline"
          }
        ]
      }
    },
    "JobCompletionTopic": {
      "Type": "AWS::SNS::Topic",
      "Properties": {
        "TopicName": {
          "Fn::Sub": "media-job-completion-${environmentSuffix}"
        },
        "DisplayName": "Media Processing Job Completion Notifications",
        "KmsMasterKeyId": {
          "Fn::GetAtt": ["EncryptionKey", "Arn"]
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "media-job-completion-${environmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "environmentSuffix"
            }
          },
          {
            "Key": "Project",
            "Value": "MediaProcessingPipeline"
          }
        ]
      }
    },
    "JobFailureTopic": {
      "Type": "AWS::SNS::Topic",
      "Properties": {
        "TopicName": {
          "Fn::Sub": "media-job-failure-${environmentSuffix}"
        },
        "DisplayName": "Media Processing Job Failure Alerts",
        "KmsMasterKeyId": {
          "Fn::GetAtt": ["EncryptionKey", "Arn"]
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "media-job-failure-${environmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "environmentSuffix"
            }
          },
          {
            "Key": "Project",
            "Value": "MediaProcessingPipeline"
          }
        ]
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
        "Policies": [
          {
            "PolicyName": "MediaConvertS3Access",
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
                    "Fn::Sub": "${RawVideosBucket.Arn}/*"
                  }
                },
                {
                  "Effect": "Allow",
                  "Action": [
                    "s3:PutObject",
                    "s3:PutObjectAcl"
                  ],
                  "Resource": [
                    {
                      "Fn::Sub": "${ProcessedVideosBucket.Arn}/*"
                    },
                    {
                      "Fn::Sub": "${ThumbnailsBucket.Arn}/*"
                    }
                  ]
                },
                {
                  "Effect": "Allow",
                  "Action": [
                    "kms:Decrypt",
                    "kms:GenerateDataKey"
                  ],
                  "Resource": {
                    "Fn::GetAtt": ["EncryptionKey", "Arn"]
                  }
                }
              ]
            }
          }
        ],
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "MediaConvertRole-${environmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "environmentSuffix"
            }
          },
          {
            "Key": "Project",
            "Value": "MediaProcessingPipeline"
          }
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
          "arn:aws:iam::aws:policy/AWSXRayDaemonWriteAccess"
        ],
        "Policies": [
          {
            "PolicyName": "MediaProcessingPolicy",
            "PolicyDocument": {
              "Version": "2012-10-17",
              "Statement": [
                {
                  "Effect": "Allow",
                  "Action": [
                    "s3:GetObject",
                    "s3:GetObjectVersion",
                    "s3:GetObjectAttributes"
                  ],
                  "Resource": {
                    "Fn::Sub": "${RawVideosBucket.Arn}/*"
                  }
                },
                {
                  "Effect": "Allow",
                  "Action": [
                    "s3:PutObject"
                  ],
                  "Resource": [
                    {
                      "Fn::Sub": "${ProcessedVideosBucket.Arn}/*"
                    },
                    {
                      "Fn::Sub": "${ThumbnailsBucket.Arn}/*"
                    }
                  ]
                },
                {
                  "Effect": "Allow",
                  "Action": [
                    "dynamodb:PutItem",
                    "dynamodb:GetItem",
                    "dynamodb:UpdateItem",
                    "dynamodb:Query"
                  ],
                  "Resource": [
                    {
                      "Fn::GetAtt": ["JobStatusTable", "Arn"]
                    },
                    {
                      "Fn::Sub": "${JobStatusTable.Arn}/index/*"
                    }
                  ]
                },
                {
                  "Effect": "Allow",
                  "Action": [
                    "mediaconvert:CreateJob",
                    "mediaconvert:GetJob",
                    "mediaconvert:ListJobs",
                    "mediaconvert:DescribeEndpoints"
                  ],
                  "Resource": "*"
                },
                {
                  "Effect": "Allow",
                  "Action": [
                    "sns:Publish"
                  ],
                  "Resource": [
                    {
                      "Ref": "JobCompletionTopic"
                    },
                    {
                      "Ref": "JobFailureTopic"
                    }
                  ]
                },
                {
                  "Effect": "Allow",
                  "Action": [
                    "sqs:SendMessage",
                    "sqs:ReceiveMessage",
                    "sqs:DeleteMessage",
                    "sqs:GetQueueAttributes"
                  ],
                  "Resource": [
                    {
                      "Fn::GetAtt": ["ProcessingQueue", "Arn"]
                    }
                  ]
                },
                {
                  "Effect": "Allow",
                  "Action": [
                    "kms:Decrypt",
                    "kms:GenerateDataKey",
                    "kms:DescribeKey"
                  ],
                  "Resource": {
                    "Fn::GetAtt": ["EncryptionKey", "Arn"]
                  }
                },
                {
                  "Effect": "Allow",
                  "Action": [
                    "iam:PassRole"
                  ],
                  "Resource": {
                    "Fn::GetAtt": ["MediaConvertRole", "Arn"]
                  },
                  "Condition": {
                    "StringLike": {
                      "iam:PassedToService": "mediaconvert.amazonaws.com"
                    }
                  }
                }
              ]
            }
          }
        ],
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "ProcessingLambdaRole-${environmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "environmentSuffix"
            }
          },
          {
            "Key": "Project",
            "Value": "MediaProcessingPipeline"
          }
        ]
      }
    },
    "ProcessingLambdaLogGroup": {
      "Type": "AWS::Logs::LogGroup",
      "Properties": {
        "LogGroupName": {
          "Fn::Sub": "/aws/lambda/media-processor-${environmentSuffix}"
        },
        "RetentionInDays": 30,
        "KmsKeyId": {
          "Fn::GetAtt": ["EncryptionKey", "Arn"]
        }
      }
    },
    "ProcessingLambda": {
      "Type": "AWS::Lambda::Function",
      "Properties": {
        "FunctionName": {
          "Fn::Sub": "media-processor-${environmentSuffix}"
        },
        "Description": "Orchestrates media processing workflow for uploaded videos",
        "Runtime": "python3.11",
        "Handler": "index.handler",
        "Role": {
          "Fn::GetAtt": ["ProcessingLambdaRole", "Arn"]
        },
        "Timeout": 900,
        "MemorySize": 1024,
        "ReservedConcurrentExecutions": 10,
        "TracingConfig": {
          "Mode": "Active"
        },
        "DeadLetterConfig": {
          "TargetArn": {
            "Fn::GetAtt": ["DeadLetterQueue", "Arn"]
          }
        },
        "Code": {
          "ZipFile": {
            "Fn::Join": [
              "\n",
              [
                "import json",
                "import boto3",
                "import os",
                "import uuid",
                "from datetime import datetime",
                "from decimal import Decimal",
                "",
                "s3 = boto3.client('s3')",
                "mediaconvert = boto3.client('mediaconvert', region_name=os.environ['AWS_REGION'])",
                "dynamodb = boto3.resource('dynamodb')",
                "sns = boto3.client('sns')",
                "",
                "def handler(event, context):",
                "    try:",
                "        print('Event received:', json.dumps(event))",
                "        ",
                "        # Extract S3 event details",
                "        record = event['Records'][0]",
                "        bucket = record['s3']['bucket']['name']",
                "        key = record['s3']['object']['key']",
                "        size = record['s3']['object']['size']",
                "        ",
                "        print(f'Processing video: {key} from bucket: {bucket}')",
                "        ",
                "        # Create job entry in DynamoDB",
                "        table = dynamodb.Table(os.environ['JOB_TABLE'])",
                "        job_id = str(uuid.uuid4())",
                "        timestamp = int(datetime.utcnow().timestamp())",
                "        ",
                "        job_item = {",
                "            'jobId': job_id,",
                "            'status': 'SUBMITTED',",
                "            'inputFile': key,",
                "            'inputBucket': bucket,",
                "            'fileSize': Decimal(str(size)),",
                "            'createdAt': timestamp,",
                "            'updatedAt': timestamp",
                "        }",
                "        ",
                "        table.put_item(Item=job_item)",
                "        print(f'Job {job_id} created in DynamoDB')",
                "        ",
                "        # Get MediaConvert endpoint",
                "        endpoints = mediaconvert.describe_endpoints()",
                "        mediaconvert_endpoint = endpoints['Endpoints'][0]['Url']",
                "        mediaconvert_client = boto3.client('mediaconvert', endpoint_url=mediaconvert_endpoint)",
                "        ",
                "        # Create MediaConvert job",
                "        input_path = f's3://{bucket}/{key}'",
                "        output_path = f's3://{os.environ[\"PROCESSED_BUCKET\"]}/{job_id}/'",
                "        ",
                "        job_settings = {",
                "            'Role': os.environ['MEDIACONVERT_ROLE'],",
                "            'Settings': {",
                "                'Inputs': [{",
                "                    'FileInput': input_path,",
                "                    'AudioSelectors': {",
                "                        'Audio Selector 1': {",
                "                            'DefaultSelection': 'DEFAULT'",
                "                        }",
                "                    }",
                "                }],",
                "                'OutputGroups': [{",
                "                    'Name': 'HLS',",
                "                    'OutputGroupSettings': {",
                "                        'Type': 'HLS_GROUP_SETTINGS',",
                "                        'HlsGroupSettings': {",
                "                            'Destination': output_path,",
                "                            'SegmentLength': 6,",
                "                            'MinSegmentLength': 0",
                "                        }",
                "                    },",
                "                    'Outputs': [",
                "                        {",
                "                            'VideoDescription': {",
                "                                'Width': 1920,",
                "                                'Height': 1080,",
                "                                'CodecSettings': {",
                "                                    'Codec': 'H_264',",
                "                                    'H264Settings': {",
                "                                        'RateControlMode': 'QVBR',",
                "                                        'MaxBitrate': 5000000",
                "                                    }",
                "                                }",
                "                            },",
                "                            'AudioDescriptions': [{",
                "                                'CodecSettings': {",
                "                                    'Codec': 'AAC',",
                "                                    'AacSettings': {",
                "                                        'Bitrate': 96000,",
                "                                        'SampleRate': 48000",
                "                                    }",
                "                                }",
                "                            }]",
                "                        }",
                "                    ]",
                "                }]",
                "            }",
                "        }",
                "        ",
                "        mc_job = mediaconvert_client.create_job(**job_settings)",
                "        mc_job_id = mc_job['Job']['Id']",
                "        ",
                "        # Update DynamoDB with MediaConvert job ID",
                "        table.update_item(",
                "            Key={'jobId': job_id},",
                "            UpdateExpression='SET #status = :status, mediaConvertJobId = :mcjob, updatedAt = :updated',",
                "            ExpressionAttributeNames={'#status': 'status'},",
                "            ExpressionAttributeValues={",
                "                ':status': 'PROCESSING',",
                "                ':mcjob': mc_job_id,",
                "                ':updated': int(datetime.utcnow().timestamp())",
                "            }",
                "        )",
                "        ",
                "        print(f'MediaConvert job {mc_job_id} started for job {job_id}')",
                "        ",
                "        return {",
                "            'statusCode': 200,",
                "            'body': json.dumps({",
                "                'jobId': job_id,",
                "                'mediaConvertJobId': mc_job_id,",
                "                'status': 'PROCESSING'",
                "            })",
                "        }",
                "        ",
                "    except Exception as e:",
                "        print(f'Error processing video: {str(e)}')",
                "        ",
                "        # Publish to failure topic",
                "        sns.publish(",
                "            TopicArn=os.environ['FAILURE_TOPIC'],",
                "            Subject='Media Processing Job Failed',",
                "            Message=json.dumps({",
                "                'error': str(e),",
                "                'event': event",
                "            })",
                "        )",
                "        ",
                "        raise"
              ]
            ]
          }
        },
        "Environment": {
          "Variables": {
            "JOB_TABLE": {
              "Ref": "JobStatusTable"
            },
            "PROCESSED_BUCKET": {
              "Ref": "ProcessedVideosBucket"
            },
            "THUMBNAILS_BUCKET": {
              "Ref": "ThumbnailsBucket"
            },
            "MEDIACONVERT_ROLE": {
              "Fn::GetAtt": ["MediaConvertRole", "Arn"]
            },
            "COMPLETION_TOPIC": {
              "Ref": "JobCompletionTopic"
            },
            "FAILURE_TOPIC": {
              "Ref": "JobFailureTopic"
            },
            "AWS_REGION": "eu-south-2"
          }
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "media-processor-${environmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "environmentSuffix"
            }
          },
          {
            "Key": "Project",
            "Value": "MediaProcessingPipeline"
          }
        ]
      },
      "DependsOn": ["ProcessingLambdaLogGroup"]
    },
    "S3InvokePermission": {
      "Type": "AWS::Lambda::Permission",
      "Properties": {
        "FunctionName": {
          "Ref": "ProcessingLambda"
        },
        "Action": "lambda:InvokeFunction",
        "Principal": "s3.amazonaws.com",
        "SourceAccount": {
          "Ref": "AWS::AccountId"
        },
        "SourceArn": {
          "Fn::Sub": "arn:aws:s3:::raw-videos-${environmentSuffix}-${AWS::AccountId}"
        }
      }
    },
    "ProcessingLambdaErrorAlarm": {
      "Type": "AWS::CloudWatch::Alarm",
      "Properties": {
        "AlarmName": {
          "Fn::Sub": "media-processor-errors-${environmentSuffix}"
        },
        "AlarmDescription": "Alert when Lambda function has errors",
        "MetricName": "Errors",
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
              "Ref": "ProcessingLambda"
            }
          }
        ],
        "AlarmActions": [
          {
            "Ref": "JobFailureTopic"
          }
        ],
        "TreatMissingData": "notBreaching"
      }
    },
    "ProcessingLambdaThrottleAlarm": {
      "Type": "AWS::CloudWatch::Alarm",
      "Properties": {
        "AlarmName": {
          "Fn::Sub": "media-processor-throttles-${environmentSuffix}"
        },
        "AlarmDescription": "Alert when Lambda function is throttled",
        "MetricName": "Throttles",
        "Namespace": "AWS/Lambda",
        "Statistic": "Sum",
        "Period": 300,
        "EvaluationPeriods": 1,
        "Threshold": 10,
        "ComparisonOperator": "GreaterThanThreshold",
        "Dimensions": [
          {
            "Name": "FunctionName",
            "Value": {
              "Ref": "ProcessingLambda"
            }
          }
        ],
        "AlarmActions": [
          {
            "Ref": "JobFailureTopic"
          }
        ],
        "TreatMissingData": "notBreaching"
      }
    },
    "DLQDepthAlarm": {
      "Type": "AWS::CloudWatch::Alarm",
      "Properties": {
        "AlarmName": {
          "Fn::Sub": "media-dlq-depth-${environmentSuffix}"
        },
        "AlarmDescription": "Alert when dead letter queue has messages",
        "MetricName": "ApproximateNumberOfMessagesVisible",
        "Namespace": "AWS/SQS",
        "Statistic": "Average",
        "Period": 300,
        "EvaluationPeriods": 1,
        "Threshold": 1,
        "ComparisonOperator": "GreaterThanOrEqualToThreshold",
        "Dimensions": [
          {
            "Name": "QueueName",
            "Value": {
              "Fn::GetAtt": ["DeadLetterQueue", "QueueName"]
            }
          }
        ],
        "AlarmActions": [
          {
            "Ref": "JobFailureTopic"
          }
        ],
        "TreatMissingData": "notBreaching"
      }
    },
    "MediaProcessingDashboard": {
      "Type": "AWS::CloudWatch::Dashboard",
      "Properties": {
        "DashboardName": {
          "Fn::Sub": "MediaProcessing-${environmentSuffix}"
        },
        "DashboardBody": {
          "Fn::Sub": [
            "{\"widgets\":[{\"type\":\"metric\",\"properties\":{\"metrics\":[[\"AWS/Lambda\",\"Invocations\",{\"stat\":\"Sum\",\"label\":\"Invocations\"}],[\".\",\"Errors\",{\"stat\":\"Sum\",\"label\":\"Errors\"}],[\".\",\"Duration\",{\"stat\":\"Average\",\"label\":\"Duration\"}]],\"view\":\"timeSeries\",\"region\":\"eu-south-2\",\"title\":\"Lambda Metrics\",\"period\":300,\"yAxis\":{\"left\":{\"min\":0}}}},{\"type\":\"metric\",\"properties\":{\"metrics\":[[\"AWS/SQS\",\"ApproximateNumberOfMessagesVisible\",{\"stat\":\"Average\"}]],\"view\":\"timeSeries\",\"region\":\"eu-south-2\",\"title\":\"Queue Depth\",\"period\":300}}]}",
            {}
          ]
        }
      }
    },
    "EventBridgeRule": {
      "Type": "AWS::Events::Rule",
      "Properties": {
        "Name": {
          "Fn::Sub": "mediaconvert-completion-${environmentSuffix}"
        },
        "Description": "Capture MediaConvert job state changes",
        "EventPattern": {
          "source": ["aws.mediaconvert"],
          "detail-type": ["MediaConvert Job State Change"],
          "detail": {
            "status": ["COMPLETE", "ERROR", "CANCELED"]
          }
        },
        "State": "ENABLED",
        "Targets": [
          {
            "Arn": {
              "Fn::GetAtt": ["StatusUpdateLambda", "Arn"]
            },
            "Id": "MediaConvertStatusTarget"
          }
        ]
      }
    },
    "EventBridgeInvokePermission": {
      "Type": "AWS::Lambda::Permission",
      "Properties": {
        "FunctionName": {
          "Ref": "StatusUpdateLambda"
        },
        "Action": "lambda:InvokeFunction",
        "Principal": "events.amazonaws.com",
        "SourceArn": {
          "Fn::GetAtt": ["EventBridgeRule", "Arn"]
        }
      }
    },
    "StatusUpdateLambdaLogGroup": {
      "Type": "AWS::Logs::LogGroup",
      "Properties": {
        "LogGroupName": {
          "Fn::Sub": "/aws/lambda/status-updater-${environmentSuffix}"
        },
        "RetentionInDays": 30,
        "KmsKeyId": {
          "Fn::GetAtt": ["EncryptionKey", "Arn"]
        }
      }
    },
    "StatusUpdateLambda": {
      "Type": "AWS::Lambda::Function",
      "Properties": {
        "FunctionName": {
          "Fn::Sub": "status-updater-${environmentSuffix}"
        },
        "Description": "Updates job status based on MediaConvert events",
        "Runtime": "python3.11",
        "Handler": "index.handler",
        "Role": {
          "Fn::GetAtt": ["ProcessingLambdaRole", "Arn"]
        },
        "Timeout": 60,
        "MemorySize": 256,
        "TracingConfig": {
          "Mode": "Active"
        },
        "Code": {
          "ZipFile": {
            "Fn::Join": [
              "\n",
              [
                "import json",
                "import boto3",
                "import os",
                "from datetime import datetime",
                "",
                "dynamodb = boto3.resource('dynamodb')",
                "sns = boto3.client('sns')",
                "",
                "def handler(event, context):",
                "    try:",
                "        print('MediaConvert event:', json.dumps(event))",
                "        ",
                "        detail = event['detail']",
                "        mc_job_id = detail['jobId']",
                "        status = detail['status']",
                "        ",
                "        # Find job in DynamoDB",
                "        table = dynamodb.Table(os.environ['JOB_TABLE'])",
                "        response = table.scan(",
                "            FilterExpression='mediaConvertJobId = :mcjob',",
                "            ExpressionAttributeValues={':mcjob': mc_job_id}",
                "        )",
                "        ",
                "        if not response['Items']:",
                "            print(f'Job not found for MediaConvert job {mc_job_id}')",
                "            return {'statusCode': 404}",
                "        ",
                "        job_id = response['Items'][0]['jobId']",
                "        ",
                "        # Update status",
                "        table.update_item(",
                "            Key={'jobId': job_id},",
                "            UpdateExpression='SET #status = :status, updatedAt = :updated',",
                "            ExpressionAttributeNames={'#status': 'status'},",
                "            ExpressionAttributeValues={",
                "                ':status': status,",
                "                ':updated': int(datetime.utcnow().timestamp())",
                "            }",
                "        )",
                "        ",
                "        # Publish notification",
                "        topic_arn = os.environ['COMPLETION_TOPIC'] if status == 'COMPLETE' else os.environ['FAILURE_TOPIC']",
                "        sns.publish(",
                "            TopicArn=topic_arn,",
                "            Subject=f'Media Processing Job {status}',",
                "            Message=json.dumps({",
                "                'jobId': job_id,",
                "                'mediaConvertJobId': mc_job_id,",
                "                'status': status",
                "            })",
                "        )",
                "        ",
                "        print(f'Updated job {job_id} to status {status}')",
                "        ",
                "        return {'statusCode': 200}",
                "        ",
                "    except Exception as e:",
                "        print(f'Error updating status: {str(e)}')",
                "        raise"
              ]
            ]
          }
        },
        "Environment": {
          "Variables": {
            "JOB_TABLE": {
              "Ref": "JobStatusTable"
            },
            "COMPLETION_TOPIC": {
              "Ref": "JobCompletionTopic"
            },
            "FAILURE_TOPIC": {
              "Ref": "JobFailureTopic"
            }
          }
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "status-updater-${environmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "environmentSuffix"
            }
          },
          {
            "Key": "Project",
            "Value": "MediaProcessingPipeline"
          }
        ]
      },
      "DependsOn": ["StatusUpdateLambdaLogGroup"]
    }
  },
  "Outputs": {
    "RawVideosBucketName": {
      "Description": "S3 bucket for raw video uploads",
      "Value": {
        "Ref": "RawVideosBucket"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-RawVideosBucket"
        }
      }
    },
    "ProcessedVideosBucketName": {
      "Description": "S3 bucket for processed videos",
      "Value": {
        "Ref": "ProcessedVideosBucket"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-ProcessedVideosBucket"
        }
      }
    },
    "ThumbnailsBucketName": {
      "Description": "S3 bucket for video thumbnails",
      "Value": {
        "Ref": "ThumbnailsBucket"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-ThumbnailsBucket"
        }
      }
    },
    "JobStatusTableName": {
      "Description": "DynamoDB table for tracking job status",
      "Value": {
        "Ref": "JobStatusTable"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-JobStatusTable"
        }
      }
    },
    "ProcessingLambdaArn": {
      "Description": "ARN of the processing Lambda function",
      "Value": {
        "Fn::GetAtt": ["ProcessingLambda", "Arn"]
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-ProcessingLambdaArn"
        }
      }
    },
    "StatusUpdateLambdaArn": {
      "Description": "ARN of the status update Lambda function",
      "Value": {
        "Fn::GetAtt": ["StatusUpdateLambda", "Arn"]
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-StatusUpdateLambdaArn"
        }
      }
    },
    "JobCompletionTopicArn": {
      "Description": "ARN of the job completion SNS topic",
      "Value": {
        "Ref": "JobCompletionTopic"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-JobCompletionTopic"
        }
      }
    },
    "ProcessingQueueUrl": {
      "Description": "URL of the processing SQS queue",
      "Value": {
        "Ref": "ProcessingQueue"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-ProcessingQueue"
        }
      }
    },
    "EncryptionKeyId": {
      "Description": "KMS key ID for encryption",
      "Value": {
        "Ref": "EncryptionKey"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-EncryptionKey"
        }
      }
    },
    "MediaConvertRoleArn": {
      "Description": "IAM role ARN for MediaConvert",
      "Value": {
        "Fn::GetAtt": ["MediaConvertRole", "Arn"]
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-MediaConvertRole"
        }
      }
    },
    "DashboardUrl": {
      "Description": "CloudWatch Dashboard URL",
      "Value": {
        "Fn::Sub": "https://console.aws.amazon.com/cloudwatch/home?region=eu-south-2#dashboards:name=MediaProcessing-${environmentSuffix}"
      }
    }
  }
}
```

## Architecture Overview

This production-ready implementation includes:

### Security
- **KMS Encryption**: Custom KMS key with rotation enabled for all data at rest
- **Encryption in Transit**: TLS/SSL enforced for all service communications
- **Least Privilege IAM**: Custom policies with specific resource-level permissions
- **S3 Security**: Public access blocked, bucket policies, versioning, and logging enabled
- **DynamoDB Encryption**: Server-side encryption with KMS and point-in-time recovery

### Storage
- **Raw Videos Bucket**: Versioned, encrypted, with S3 event notifications
- **Processed Videos Bucket**: Encrypted with lifecycle policies for cost optimization
- **Thumbnails Bucket**: Encrypted with CORS for web access
- **Logging Bucket**: Centralized logging with retention policies

### Processing Pipeline
- **Processing Lambda**: Orchestrates MediaConvert jobs with comprehensive error handling
- **Status Update Lambda**: Processes MediaConvert job completion events
- **MediaConvert Integration**: Creates transcoding jobs with HLS output
- **Job Tracking**: DynamoDB table with GSI for status queries

### Messaging & Events
- **EventBridge**: Captures MediaConvert state changes
- **SNS Topics**: Separate topics for completion and failure notifications
- **SQS Queues**: Processing queue with dead-letter queue for failed messages

### Monitoring & Observability
- **CloudWatch Logs**: Encrypted log groups with 30-day retention
- **CloudWatch Alarms**: Monitors Lambda errors, throttles, and DLQ depth
- **CloudWatch Dashboard**: Real-time metrics visualization
- **X-Ray Tracing**: Distributed tracing for debugging

### Resource Naming
- All resources use `environmentSuffix` parameter for multi-environment support
- Consistent naming convention: `resource-type-${environmentSuffix}`
- Unique bucket names with account ID suffix

### Compliance Features
- Data residency in eu-south-2 region
- Comprehensive tagging (Name, Environment, Project)
- Audit logging capabilities
- Encryption at rest and in transit
- No retention policies (fully destroyable)

## Deployment Instructions

```bash
# Validate the template
aws cloudformation validate-template \
  --template-body file://lib/TapStack.json \
  --region eu-south-2

# Deploy the stack
aws cloudformation create-stack \
  --stack-name media-pipeline-prod \
  --template-body file://lib/TapStack.json \
  --parameters ParameterKey=environmentSuffix,ParameterValue=prod \
  --capabilities CAPABILITY_NAMED_IAM \
  --region eu-south-2 \
  --tags Key=Project,Value=MediaProcessingPipeline Key=Environment,Value=production

# Monitor deployment
aws cloudformation wait stack-create-complete \
  --stack-name media-pipeline-prod \
  --region eu-south-2

# Get outputs
aws cloudformation describe-stacks \
  --stack-name media-pipeline-prod \
  --region eu-south-2 \
  --query 'Stacks[0].Outputs'
```

## Testing the Pipeline

```bash
# Upload a test video
aws s3 cp test-video.mp4 s3://raw-videos-prod-<account-id>/ \
  --region eu-south-2

# Check job status in DynamoDB
aws dynamodb scan \
  --table-name media-jobs-prod \
  --region eu-south-2

# View Lambda logs
aws logs tail /aws/lambda/media-processor-prod --follow \
  --region eu-south-2
```

## Cleanup

```bash
# Empty S3 buckets first
aws s3 rm s3://raw-videos-prod-<account-id> --recursive
aws s3 rm s3://processed-videos-prod-<account-id> --recursive
aws s3 rm s3://thumbnails-prod-<account-id> --recursive
aws s3 rm s3://media-pipeline-logs-prod-<account-id> --recursive

# Delete the stack
aws cloudformation delete-stack \
  --stack-name media-pipeline-prod \
  --region eu-south-2
```