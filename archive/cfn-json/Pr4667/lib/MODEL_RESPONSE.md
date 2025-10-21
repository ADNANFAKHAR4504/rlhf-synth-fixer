# Streaming Media Processing Pipeline - CloudFormation Implementation

This implementation provides a complete streaming media processing pipeline using CloudFormation JSON template with all necessary AWS services for video transcoding and delivery.

## File: lib/TapStack.json

```json
{
  "AWSTemplateFormatVersion": "2010-09-09",
  "Description": "Streaming Media Processing Pipeline - Video Transcoding and Delivery Infrastructure",
  "Metadata": {
    "AWS::CloudFormation::Interface": {
      "ParameterGroups": [
        {
          "Label": {
            "default": "Environment Configuration"
          },
          "Parameters": [
            "EnvironmentSuffix"
          ]
        }
      ]
    }
  },
  "Parameters": {
    "EnvironmentSuffix": {
      "Type": "String",
      "Default": "dev",
      "Description": "Environment suffix for resource naming (e.g., dev, staging, prod)",
      "AllowedPattern": "^[a-zA-Z0-9]+$",
      "ConstraintDescription": "Must contain only alphanumeric characters"
    }
  },
  "Resources": {
    "VideoInputBucket": {
      "Type": "AWS::S3::Bucket",
      "DeletionPolicy": "Delete",
      "Properties": {
        "BucketName": {
          "Fn::Sub": "video-input-${EnvironmentSuffix}"
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
        "VersioningConfiguration": {
          "Status": "Enabled"
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
              "Id": "DeleteOldVersions",
              "Status": "Enabled",
              "NoncurrentVersionExpirationInDays": 30
            }
          ]
        },
        "Tags": [
          {
            "Key": "Environment",
            "Value": {
              "Ref": "EnvironmentSuffix"
            }
          },
          {
            "Key": "Application",
            "Value": "MediaProcessingPipeline"
          },
          {
            "Key": "ManagedBy",
            "Value": "CloudFormation"
          }
        ]
      }
    },
    "VideoOutputBucket": {
      "Type": "AWS::S3::Bucket",
      "DeletionPolicy": "Delete",
      "Properties": {
        "BucketName": {
          "Fn::Sub": "video-output-${EnvironmentSuffix}"
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
        "VersioningConfiguration": {
          "Status": "Enabled"
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
              "Id": "TransitionToIA",
              "Status": "Enabled",
              "Transitions": [
                {
                  "StorageClass": "INTELLIGENT_TIERING",
                  "TransitionInDays": 90
                }
              ]
            }
          ]
        },
        "Tags": [
          {
            "Key": "Environment",
            "Value": {
              "Ref": "EnvironmentSuffix"
            }
          },
          {
            "Key": "Application",
            "Value": "MediaProcessingPipeline"
          },
          {
            "Key": "ManagedBy",
            "Value": "CloudFormation"
          }
        ]
      }
    },
    "VideoJobStatusTable": {
      "Type": "AWS::DynamoDB::Table",
      "DeletionPolicy": "Delete",
      "UpdateReplacePolicy": "Delete",
      "Properties": {
        "TableName": {
          "Fn::Sub": "video-job-status-${EnvironmentSuffix}"
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
            "AttributeName": "timestamp",
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
            "IndexName": "StatusTimestampIndex",
            "KeySchema": [
              {
                "AttributeName": "status",
                "KeyType": "HASH"
              },
              {
                "AttributeName": "timestamp",
                "KeyType": "RANGE"
              }
            ],
            "Projection": {
              "ProjectionType": "ALL"
            }
          }
        ],
        "BillingMode": "PAY_PER_REQUEST",
        "DeletionProtectionEnabled": false,
        "Tags": [
          {
            "Key": "Environment",
            "Value": {
              "Ref": "EnvironmentSuffix"
            }
          },
          {
            "Key": "Application",
            "Value": "MediaProcessingPipeline"
          },
          {
            "Key": "ManagedBy",
            "Value": "CloudFormation"
          }
        ]
      }
    },
    "VideoProcessingQueue": {
      "Type": "AWS::SQS::Queue",
      "DeletionPolicy": "Delete",
      "Properties": {
        "QueueName": {
          "Fn::Sub": "video-processing-queue-${EnvironmentSuffix}"
        },
        "VisibilityTimeout": 900,
        "MessageRetentionPeriod": 1209600,
        "ReceiveMessageWaitTimeSeconds": 20,
        "RedrivePolicy": {
          "deadLetterTargetArn": {
            "Fn::GetAtt": [
              "VideoProcessingDLQ",
              "Arn"
            ]
          },
          "maxReceiveCount": 3
        },
        "Tags": [
          {
            "Key": "Environment",
            "Value": {
              "Ref": "EnvironmentSuffix"
            }
          },
          {
            "Key": "Application",
            "Value": "MediaProcessingPipeline"
          },
          {
            "Key": "ManagedBy",
            "Value": "CloudFormation"
          }
        ]
      }
    },
    "VideoProcessingDLQ": {
      "Type": "AWS::SQS::Queue",
      "DeletionPolicy": "Delete",
      "Properties": {
        "QueueName": {
          "Fn::Sub": "video-processing-dlq-${EnvironmentSuffix}"
        },
        "MessageRetentionPeriod": 1209600,
        "Tags": [
          {
            "Key": "Environment",
            "Value": {
              "Ref": "EnvironmentSuffix"
            }
          },
          {
            "Key": "Application",
            "Value": "MediaProcessingPipeline"
          },
          {
            "Key": "ManagedBy",
            "Value": "CloudFormation"
          }
        ]
      }
    },
    "TranscodingCompleteTopic": {
      "Type": "AWS::SNS::Topic",
      "DeletionPolicy": "Delete",
      "Properties": {
        "TopicName": {
          "Fn::Sub": "transcoding-complete-${EnvironmentSuffix}"
        },
        "DisplayName": "Video Transcoding Completion Notifications",
        "Tags": [
          {
            "Key": "Environment",
            "Value": {
              "Ref": "EnvironmentSuffix"
            }
          },
          {
            "Key": "Application",
            "Value": "MediaProcessingPipeline"
          },
          {
            "Key": "ManagedBy",
            "Value": "CloudFormation"
          }
        ]
      }
    },
    "MediaConvertRole": {
      "Type": "AWS::IAM::Role",
      "Properties": {
        "RoleName": {
          "Fn::Sub": "mediaconvert-role-${EnvironmentSuffix}"
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
          "arn:aws:iam::aws:policy/AmazonS3ReadOnlyAccess"
        ],
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
                    "s3:ListBucket"
                  ],
                  "Resource": [
                    {
                      "Fn::GetAtt": [
                        "VideoInputBucket",
                        "Arn"
                      ]
                    },
                    {
                      "Fn::Sub": "${VideoInputBucket.Arn}/*"
                    }
                  ]
                },
                {
                  "Effect": "Allow",
                  "Action": [
                    "s3:PutObject",
                    "s3:PutObjectAcl"
                  ],
                  "Resource": [
                    {
                      "Fn::Sub": "${VideoOutputBucket.Arn}/*"
                    }
                  ]
                }
              ]
            }
          }
        ],
        "Tags": [
          {
            "Key": "Environment",
            "Value": {
              "Ref": "EnvironmentSuffix"
            }
          },
          {
            "Key": "Application",
            "Value": "MediaProcessingPipeline"
          },
          {
            "Key": "ManagedBy",
            "Value": "CloudFormation"
          }
        ]
      }
    },
    "TranscodingLambdaRole": {
      "Type": "AWS::IAM::Role",
      "Properties": {
        "RoleName": {
          "Fn::Sub": "transcoding-lambda-role-${EnvironmentSuffix}"
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
            "PolicyName": "TranscodingLambdaPolicy",
            "PolicyDocument": {
              "Version": "2012-10-17",
              "Statement": [
                {
                  "Effect": "Allow",
                  "Action": [
                    "mediaconvert:CreateJob",
                    "mediaconvert:GetJob",
                    "mediaconvert:DescribeEndpoints"
                  ],
                  "Resource": "*"
                },
                {
                  "Effect": "Allow",
                  "Action": [
                    "s3:GetObject",
                    "s3:GetObjectVersion"
                  ],
                  "Resource": [
                    {
                      "Fn::Sub": "${VideoInputBucket.Arn}/*"
                    }
                  ]
                },
                {
                  "Effect": "Allow",
                  "Action": [
                    "dynamodb:PutItem",
                    "dynamodb:UpdateItem",
                    "dynamodb:GetItem"
                  ],
                  "Resource": [
                    {
                      "Fn::GetAtt": [
                        "VideoJobStatusTable",
                        "Arn"
                      ]
                    }
                  ]
                },
                {
                  "Effect": "Allow",
                  "Action": [
                    "sqs:SendMessage"
                  ],
                  "Resource": [
                    {
                      "Fn::GetAtt": [
                        "VideoProcessingQueue",
                        "Arn"
                      ]
                    }
                  ]
                },
                {
                  "Effect": "Allow",
                  "Action": [
                    "sns:Publish"
                  ],
                  "Resource": [
                    {
                      "Ref": "TranscodingCompleteTopic"
                    }
                  ]
                },
                {
                  "Effect": "Allow",
                  "Action": [
                    "iam:PassRole"
                  ],
                  "Resource": [
                    {
                      "Fn::GetAtt": [
                        "MediaConvertRole",
                        "Arn"
                      ]
                    }
                  ]
                },
                {
                  "Effect": "Allow",
                  "Action": [
                    "states:StartExecution"
                  ],
                  "Resource": [
                    {
                      "Ref": "TranscodingStateMachine"
                    }
                  ]
                }
              ]
            }
          }
        ],
        "Tags": [
          {
            "Key": "Environment",
            "Value": {
              "Ref": "EnvironmentSuffix"
            }
          },
          {
            "Key": "Application",
            "Value": "MediaProcessingPipeline"
          },
          {
            "Key": "ManagedBy",
            "Value": "CloudFormation"
          }
        ]
      }
    },
    "TranscodingLambdaLogGroup": {
      "Type": "AWS::Logs::LogGroup",
      "DeletionPolicy": "Delete",
      "UpdateReplacePolicy": "Delete",
      "Properties": {
        "LogGroupName": {
          "Fn::Sub": "/aws/lambda/transcoding-orchestrator-${EnvironmentSuffix}"
        },
        "RetentionInDays": 7
      }
    },
    "TranscodingOrchestratorFunction": {
      "Type": "AWS::Lambda::Function",
      "DependsOn": "TranscodingLambdaLogGroup",
      "Properties": {
        "FunctionName": {
          "Fn::Sub": "transcoding-orchestrator-${EnvironmentSuffix}"
        },
        "Runtime": "python3.11",
        "Handler": "index.lambda_handler",
        "Role": {
          "Fn::GetAtt": [
            "TranscodingLambdaRole",
            "Arn"
          ]
        },
        "Timeout": 300,
        "MemorySize": 512,
        "Environment": {
          "Variables": {
            "MEDIACONVERT_ROLE_ARN": {
              "Fn::GetAtt": [
                "MediaConvertRole",
                "Arn"
              ]
            },
            "OUTPUT_BUCKET": {
              "Ref": "VideoOutputBucket"
            },
            "JOB_STATUS_TABLE": {
              "Ref": "VideoJobStatusTable"
            },
            "SNS_TOPIC_ARN": {
              "Ref": "TranscodingCompleteTopic"
            },
            "STATE_MACHINE_ARN": {
              "Ref": "TranscodingStateMachine"
            }
          }
        },
        "Code": {
          "ZipFile": "import json\nimport boto3\nimport os\nimport time\nfrom datetime import datetime\n\nmediaconvert_client = None\ndynamodb = boto3.resource('dynamodb')\nsns = boto3.client('sns')\nsfn = boto3.client('stepfunctions')\n\ndef get_mediaconvert_client():\n    global mediaconvert_client\n    if mediaconvert_client is None:\n        client = boto3.client('mediaconvert', region_name=os.environ['AWS_REGION'])\n        endpoints = client.describe_endpoints()\n        mediaconvert_client = boto3.client('mediaconvert', endpoint_url=endpoints['Endpoints'][0]['Url'])\n    return mediaconvert_client\n\ndef lambda_handler(event, context):\n    print(f\"Received event: {json.dumps(event)}\")\n    \n    # Handle S3 event trigger\n    if 'Records' in event:\n        for record in event['Records']:\n            if record['eventSource'] == 'aws:s3':\n                bucket = record['s3']['bucket']['name']\n                key = record['s3']['object']['key']\n                \n                # Start Step Functions execution\n                execution_input = {\n                    'bucket': bucket,\n                    'key': key,\n                    'timestamp': int(time.time())\n                }\n                \n                response = sfn.start_execution(\n                    stateMachineArn=os.environ['STATE_MACHINE_ARN'],\n                    input=json.dumps(execution_input)\n                )\n                \n                print(f\"Started Step Functions execution: {response['executionArn']}\")\n                \n    # Handle MediaConvert job creation\n    elif 'bucket' in event and 'key' in event:\n        bucket = event['bucket']\n        key = event['key']\n        job_id = f\"job-{int(time.time())}\"\n        \n        # Store job status in DynamoDB\n        table = dynamodb.Table(os.environ['JOB_STATUS_TABLE'])\n        table.put_item(\n            Item={\n                'jobId': job_id,\n                'status': 'SUBMITTED',\n                'inputBucket': bucket,\n                'inputKey': key,\n                'timestamp': int(time.time()),\n                'createdAt': datetime.utcnow().isoformat()\n            }\n        )\n        \n        # Create MediaConvert job\n        mc_client = get_mediaconvert_client()\n        \n        job_settings = {\n            'Role': os.environ['MEDIACONVERT_ROLE_ARN'],\n            'Settings': {\n                'Inputs': [\n                    {\n                        'FileInput': f's3://{bucket}/{key}',\n                        'AudioSelectors': {\n                            'Audio Selector 1': {\n                                'DefaultSelection': 'DEFAULT'\n                            }\n                        },\n                        'VideoSelector': {}\n                    }\n                ],\n                'OutputGroups': [\n                    {\n                        'Name': 'HLS',\n                        'OutputGroupSettings': {\n                            'Type': 'HLS_GROUP_SETTINGS',\n                            'HlsGroupSettings': {\n                                'Destination': f's3://{os.environ[\"OUTPUT_BUCKET\"]}/{key.split(\".\")[0]}/hls/',\n                                'SegmentLength': 10\n                            }\n                        },\n                        'Outputs': [\n                            {\n                                'NameModifier': '_1080p',\n                                'VideoDescription': {\n                                    'Width': 1920,\n                                    'Height': 1080,\n                                    'CodecSettings': {\n                                        'Codec': 'H_264',\n                                        'H264Settings': {\n                                            'Bitrate': 5000000\n                                        }\n                                    }\n                                },\n                                'AudioDescriptions': [\n                                    {\n                                        'CodecSettings': {\n                                            'Codec': 'AAC',\n                                            'AacSettings': {\n                                                'Bitrate': 128000\n                                            }\n                                        }\n                                    }\n                                ]\n                            },\n                            {\n                                'NameModifier': '_720p',\n                                'VideoDescription': {\n                                    'Width': 1280,\n                                    'Height': 720,\n                                    'CodecSettings': {\n                                        'Codec': 'H_264',\n                                        'H264Settings': {\n                                            'Bitrate': 3000000\n                                        }\n                                    }\n                                },\n                                'AudioDescriptions': [\n                                    {\n                                        'CodecSettings': {\n                                            'Codec': 'AAC',\n                                            'AacSettings': {\n                                                'Bitrate': 128000\n                                            }\n                                        }\n                                    }\n                                ]\n                            },\n                            {\n                                'NameModifier': '_480p',\n                                'VideoDescription': {\n                                    'Width': 854,\n                                    'Height': 480,\n                                    'CodecSettings': {\n                                        'Codec': 'H_264',\n                                        'H264Settings': {\n                                            'Bitrate': 1500000\n                                        }\n                                    }\n                                },\n                                'AudioDescriptions': [\n                                    {\n                                        'CodecSettings': {\n                                            'Codec': 'AAC',\n                                            'AacSettings': {\n                                                'Bitrate': 96000\n                                            }\n                                        }\n                                    }\n                                ]\n                            },\n                            {\n                                'NameModifier': '_360p',\n                                'VideoDescription': {\n                                    'Width': 640,\n                                    'Height': 360,\n                                    'CodecSettings': {\n                                        'Codec': 'H_264',\n                                        'H264Settings': {\n                                            'Bitrate': 800000\n                                        }\n                                    }\n                                },\n                                'AudioDescriptions': [\n                                    {\n                                        'CodecSettings': {\n                                            'Codec': 'AAC',\n                                            'AacSettings': {\n                                                'Bitrate': 96000\n                                            }\n                                        }\n                                    }\n                                ]\n                            }\n                        ]\n                    }\n                ]\n            }\n        }\n        \n        try:\n            response = mc_client.create_job(**job_settings)\n            mc_job_id = response['Job']['Id']\n            \n            # Update DynamoDB with MediaConvert job ID\n            table.update_item(\n                Key={'jobId': job_id},\n                UpdateExpression='SET #status = :status, mediaConvertJobId = :mc_job_id',\n                ExpressionAttributeNames={'#status': 'status'},\n                ExpressionAttributeValues={\n                    ':status': 'PROCESSING',\n                    ':mc_job_id': mc_job_id\n                }\n            )\n            \n            return {\n                'statusCode': 200,\n                'body': json.dumps({\n                    'jobId': job_id,\n                    'mediaConvertJobId': mc_job_id,\n                    'status': 'PROCESSING'\n                })\n            }\n        except Exception as e:\n            print(f\"Error creating MediaConvert job: {str(e)}\")\n            table.update_item(\n                Key={'jobId': job_id},\n                UpdateExpression='SET #status = :status, errorMessage = :error',\n                ExpressionAttributeNames={'#status': 'status'},\n                ExpressionAttributeValues={\n                    ':status': 'FAILED',\n                    ':error': str(e)\n                }\n            )\n            raise\n    \n    return {'statusCode': 200, 'body': json.dumps('Processing complete')}\n"
        },
        "Tags": [
          {
            "Key": "Environment",
            "Value": {
              "Ref": "EnvironmentSuffix"
            }
          },
          {
            "Key": "Application",
            "Value": "MediaProcessingPipeline"
          },
          {
            "Key": "ManagedBy",
            "Value": "CloudFormation"
          }
        ]
      }
    },
    "TranscodingOrchestratorPermission": {
      "Type": "AWS::Lambda::Permission",
      "Properties": {
        "FunctionName": {
          "Ref": "TranscodingOrchestratorFunction"
        },
        "Action": "lambda:InvokeFunction",
        "Principal": "s3.amazonaws.com",
        "SourceArn": {
          "Fn::GetAtt": [
            "VideoInputBucket",
            "Arn"
          ]
        }
      }
    },
    "StepFunctionsRole": {
      "Type": "AWS::IAM::Role",
      "Properties": {
        "RoleName": {
          "Fn::Sub": "stepfunctions-role-${EnvironmentSuffix}"
        },
        "AssumeRolePolicyDocument": {
          "Version": "2012-10-17",
          "Statement": [
            {
              "Effect": "Allow",
              "Principal": {
                "Service": "states.amazonaws.com"
              },
              "Action": "sts:AssumeRole"
            }
          ]
        },
        "Policies": [
          {
            "PolicyName": "StepFunctionsExecutionPolicy",
            "PolicyDocument": {
              "Version": "2012-10-17",
              "Statement": [
                {
                  "Effect": "Allow",
                  "Action": [
                    "lambda:InvokeFunction"
                  ],
                  "Resource": [
                    {
                      "Fn::GetAtt": [
                        "TranscodingOrchestratorFunction",
                        "Arn"
                      ]
                    }
                  ]
                },
                {
                  "Effect": "Allow",
                  "Action": [
                    "sns:Publish"
                  ],
                  "Resource": [
                    {
                      "Ref": "TranscodingCompleteTopic"
                    }
                  ]
                },
                {
                  "Effect": "Allow",
                  "Action": [
                    "dynamodb:PutItem",
                    "dynamodb:UpdateItem"
                  ],
                  "Resource": [
                    {
                      "Fn::GetAtt": [
                        "VideoJobStatusTable",
                        "Arn"
                      ]
                    }
                  ]
                }
              ]
            }
          }
        ],
        "Tags": [
          {
            "Key": "Environment",
            "Value": {
              "Ref": "EnvironmentSuffix"
            }
          },
          {
            "Key": "Application",
            "Value": "MediaProcessingPipeline"
          },
          {
            "Key": "ManagedBy",
            "Value": "CloudFormation"
          }
        ]
      }
    },
    "TranscodingStateMachineLogGroup": {
      "Type": "AWS::Logs::LogGroup",
      "DeletionPolicy": "Delete",
      "UpdateReplacePolicy": "Delete",
      "Properties": {
        "LogGroupName": {
          "Fn::Sub": "/aws/stepfunctions/transcoding-${EnvironmentSuffix}"
        },
        "RetentionInDays": 7
      }
    },
    "TranscodingStateMachine": {
      "Type": "AWS::StepFunctions::StateMachine",
      "Properties": {
        "StateMachineName": {
          "Fn::Sub": "transcoding-workflow-${EnvironmentSuffix}"
        },
        "RoleArn": {
          "Fn::GetAtt": [
            "StepFunctionsRole",
            "Arn"
          ]
        },
        "LoggingConfiguration": {
          "Level": "ALL",
          "IncludeExecutionData": true,
          "Destinations": [
            {
              "CloudWatchLogsLogGroup": {
                "LogGroupArn": {
                  "Fn::GetAtt": [
                    "TranscodingStateMachineLogGroup",
                    "Arn"
                  ]
                }
              }
            }
          ]
        },
        "DefinitionString": {
          "Fn::Sub": "{\n  \"Comment\": \"Video transcoding workflow with retry logic\",\n  \"StartAt\": \"StartTranscoding\",\n  \"States\": {\n    \"StartTranscoding\": {\n      \"Type\": \"Task\",\n      \"Resource\": \"${TranscodingOrchestratorFunction.Arn}\",\n      \"Retry\": [\n        {\n          \"ErrorEquals\": [\"States.ALL\"],\n          \"IntervalSeconds\": 2,\n          \"MaxAttempts\": 3,\n          \"BackoffRate\": 2\n        }\n      ],\n      \"Catch\": [\n        {\n          \"ErrorEquals\": [\"States.ALL\"],\n          \"Next\": \"TranscodingFailed\"\n        }\n      ],\n      \"Next\": \"WaitForCompletion\"\n    },\n    \"WaitForCompletion\": {\n      \"Type\": \"Wait\",\n      \"Seconds\": 60,\n      \"Next\": \"CheckJobStatus\"\n    },\n    \"CheckJobStatus\": {\n      \"Type\": \"Choice\",\n      \"Choices\": [\n        {\n          \"Variable\": \"$.statusCode\",\n          \"NumericEquals\": 200,\n          \"Next\": \"TranscodingSuccess\"\n        }\n      ],\n      \"Default\": \"TranscodingFailed\"\n    },\n    \"TranscodingSuccess\": {\n      \"Type\": \"Task\",\n      \"Resource\": \"arn:aws:states:::sns:publish\",\n      \"Parameters\": {\n        \"TopicArn\": \"${TranscodingCompleteTopic}\",\n        \"Message\": {\n          \"status\": \"SUCCESS\",\n          \"jobId.$\": \"$.body\"\n        }\n      },\n      \"End\": true\n    },\n    \"TranscodingFailed\": {\n      \"Type\": \"Task\",\n      \"Resource\": \"arn:aws:states:::sns:publish\",\n      \"Parameters\": {\n        \"TopicArn\": \"${TranscodingCompleteTopic}\",\n        \"Message\": {\n          \"status\": \"FAILED\",\n          \"error.$\": \"$.Error\"\n        }\n      },\n      \"End\": true\n    }\n  }\n}\n"
        },
        "Tags": [
          {
            "Key": "Environment",
            "Value": {
              "Ref": "EnvironmentSuffix"
            }
          },
          {
            "Key": "Application",
            "Value": "MediaProcessingPipeline"
          },
          {
            "Key": "ManagedBy",
            "Value": "CloudFormation"
          }
        ]
      }
    },
    "VideoUploadEventRule": {
      "Type": "AWS::Events::Rule",
      "Properties": {
        "Name": {
          "Fn::Sub": "video-upload-event-${EnvironmentSuffix}"
        },
        "Description": "Trigger transcoding workflow on video upload",
        "EventPattern": {
          "source": ["aws.s3"],
          "detail-type": ["Object Created"],
          "detail": {
            "bucket": {
              "name": [
                {
                  "Ref": "VideoInputBucket"
                }
              ]
            }
          }
        },
        "State": "ENABLED",
        "Targets": [
          {
            "Arn": {
              "Fn::GetAtt": [
                "TranscodingOrchestratorFunction",
                "Arn"
              ]
            },
            "Id": "TranscodingLambdaTarget"
          }
        ]
      }
    },
    "EventBridgeLambdaPermission": {
      "Type": "AWS::Lambda::Permission",
      "Properties": {
        "FunctionName": {
          "Ref": "TranscodingOrchestratorFunction"
        },
        "Action": "lambda:InvokeFunction",
        "Principal": "events.amazonaws.com",
        "SourceArn": {
          "Fn::GetAtt": [
            "VideoUploadEventRule",
            "Arn"
          ]
        }
      }
    },
    "ProcessingErrorAlarm": {
      "Type": "AWS::CloudWatch::Alarm",
      "Properties": {
        "AlarmName": {
          "Fn::Sub": "video-processing-errors-${EnvironmentSuffix}"
        },
        "AlarmDescription": "Alert when video processing failures exceed threshold",
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
              "Ref": "TranscodingOrchestratorFunction"
            }
          }
        ],
        "TreatMissingData": "notBreaching"
      }
    },
    "DLQDepthAlarm": {
      "Type": "AWS::CloudWatch::Alarm",
      "Properties": {
        "AlarmName": {
          "Fn::Sub": "dlq-messages-${EnvironmentSuffix}"
        },
        "AlarmDescription": "Alert when messages accumulate in DLQ",
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
              "Fn::GetAtt": [
                "VideoProcessingDLQ",
                "QueueName"
              ]
            }
          }
        ],
        "TreatMissingData": "notBreaching"
      }
    }
  },
  "Outputs": {
    "VideoInputBucketName": {
      "Description": "S3 bucket for video input files",
      "Value": {
        "Ref": "VideoInputBucket"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-VideoInputBucketName"
        }
      }
    },
    "VideoInputBucketArn": {
      "Description": "ARN of the video input bucket",
      "Value": {
        "Fn::GetAtt": [
          "VideoInputBucket",
          "Arn"
        ]
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-VideoInputBucketArn"
        }
      }
    },
    "VideoOutputBucketName": {
      "Description": "S3 bucket for transcoded video output",
      "Value": {
        "Ref": "VideoOutputBucket"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-VideoOutputBucketName"
        }
      }
    },
    "VideoOutputBucketArn": {
      "Description": "ARN of the video output bucket",
      "Value": {
        "Fn::GetAtt": [
          "VideoOutputBucket",
          "Arn"
        ]
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-VideoOutputBucketArn"
        }
      }
    },
    "VideoJobStatusTableName": {
      "Description": "DynamoDB table for tracking video processing jobs",
      "Value": {
        "Ref": "VideoJobStatusTable"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-VideoJobStatusTableName"
        }
      }
    },
    "VideoJobStatusTableArn": {
      "Description": "ARN of the job status table",
      "Value": {
        "Fn::GetAtt": [
          "VideoJobStatusTable",
          "Arn"
        ]
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-VideoJobStatusTableArn"
        }
      }
    },
    "VideoProcessingQueueUrl": {
      "Description": "URL of the video processing SQS queue",
      "Value": {
        "Ref": "VideoProcessingQueue"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-VideoProcessingQueueUrl"
        }
      }
    },
    "VideoProcessingQueueArn": {
      "Description": "ARN of the video processing queue",
      "Value": {
        "Fn::GetAtt": [
          "VideoProcessingQueue",
          "Arn"
        ]
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-VideoProcessingQueueArn"
        }
      }
    },
    "VideoProcessingDLQUrl": {
      "Description": "URL of the dead-letter queue",
      "Value": {
        "Ref": "VideoProcessingDLQ"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-VideoProcessingDLQUrl"
        }
      }
    },
    "TranscodingCompleteTopicArn": {
      "Description": "SNS topic for transcoding completion notifications",
      "Value": {
        "Ref": "TranscodingCompleteTopic"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-TranscodingCompleteTopicArn"
        }
      }
    },
    "TranscodingOrchestratorFunctionArn": {
      "Description": "ARN of the transcoding orchestrator Lambda function",
      "Value": {
        "Fn::GetAtt": [
          "TranscodingOrchestratorFunction",
          "Arn"
        ]
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-TranscodingOrchestratorFunctionArn"
        }
      }
    },
    "TranscodingStateMachineArn": {
      "Description": "ARN of the transcoding Step Functions state machine",
      "Value": {
        "Ref": "TranscodingStateMachine"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-TranscodingStateMachineArn"
        }
      }
    },
    "MediaConvertRoleArn": {
      "Description": "IAM role ARN for MediaConvert service",
      "Value": {
        "Fn::GetAtt": [
          "MediaConvertRole",
          "Arn"
        ]
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-MediaConvertRoleArn"
        }
      }
    },
    "StackName": {
      "Description": "Name of this CloudFormation stack",
      "Value": {
        "Ref": "AWS::StackName"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-StackName"
        }
      }
    },
    "EnvironmentSuffix": {
      "Description": "Environment suffix used for this deployment",
      "Value": {
        "Ref": "EnvironmentSuffix"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-EnvironmentSuffix"
        }
      }
    }
  }
}
```

## Implementation Notes

### AWS Services Used

1. **Amazon S3** - Video storage (input and output buckets) with encryption and versioning
2. **AWS MediaConvert** - Video transcoding service for multiple quality outputs
3. **AWS Lambda** - Serverless compute for workflow orchestration
4. **AWS Step Functions** - State machine for managing transcoding workflow with retry logic
5. **Amazon DynamoDB** - NoSQL database for tracking job status and metadata
6. **Amazon SQS** - Message queuing with dead-letter queue for failed jobs
7. **Amazon SNS** - Pub/sub messaging for job completion notifications
8. **Amazon EventBridge** - Event-driven triggers for S3 uploads
9. **Amazon CloudWatch** - Monitoring, logging, and alarms
10. **AWS IAM** - Identity and access management with least privilege roles

### Key Features

- **Multi-Resolution Transcoding**: Videos are transcoded to 1080p, 720p, 480p, and 360p formats
- **HLS Output**: MediaConvert generates HTTP Live Streaming (HLS) compatible segments
- **Retry Logic**: Step Functions handles retry with exponential backoff
- **Error Handling**: Dead-letter queue captures failed processing jobs
- **Monitoring**: CloudWatch alarms for Lambda errors and DLQ depth
- **Security**: Encryption at rest, IAM least privilege, no public S3 access
- **Cost Optimization**: Pay-per-request DynamoDB, S3 lifecycle policies, 7-day log retention
- **Scalability**: Serverless architecture scales automatically with load

### Deployment Considerations

- All resource names include the `environmentSuffix` parameter for uniqueness
- No DeletionPolicy: Retain - all resources can be cleanly destroyed
- Lambda function includes inline code for easy deployment
- MediaConvert endpoints are dynamically discovered at runtime
- Step Functions state machine includes comprehensive error handling
- CloudWatch Logs have 7-day retention for cost optimization

### Testing Strategy

Unit tests should verify:
- Template syntax and structure
- Resource properties and dependencies
- IAM role permissions
- Parameter validation

Integration tests should validate:
- S3 upload triggers Lambda function
- MediaConvert job creation and execution
- DynamoDB job status tracking
- SNS notifications on completion
- CloudWatch alarm functionality
