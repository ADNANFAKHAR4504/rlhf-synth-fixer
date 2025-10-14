# Ideal CloudFormation Response

This document contains the production-ready CloudFormation template that addresses all the infrastructure requirements and fixes the issues identified in the initial model response. The template creates a secure, scalable serverless infrastructure with proper error handling, environment isolation, and AWS best practices.

## Key Features

- **Production-Ready**: Resolves circular dependencies and validation errors
- **Multi-Environment Support**: Parameterized environment suffix for isolated deployments
- **Security Hardened**: KMS encryption, IAM least privilege, and proper access controls
- **Operationally Sound**: Comprehensive tagging, deletion policies, and CloudWatch integration
- **AWS Best Practices**: Follows CloudFormation and AWS service best practices

```json
{
  "AWSTemplateFormatVersion": "2010-09-09",
  "Description": "Serverless infrastructure with S3 bucket and Lambda function with KMS encryption and lifecycle policies",
  "Metadata": {
    "AWS::CloudFormation::Interface": {
      "ParameterGroups": [
        {
          "Label": {
            "default": "Environment Configuration"
          },
          "Parameters": ["EnvironmentSuffix"]
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
    "AppKMSKey": {
      "Type": "AWS::KMS::Key",
      "DeletionPolicy": "Delete",
      "UpdateReplacePolicy": "Delete",
      "Properties": {
        "Description": "KMS key for encrypting Lambda environment variables",
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
              "Sid": "Allow Lambda to use the key",
              "Effect": "Allow",
              "Principal": {
                "Service": "lambda.amazonaws.com"
              },
              "Action": ["kms:Decrypt", "kms:DescribeKey"],
              "Resource": "*"
            }
          ]
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "app-kms-key-${EnvironmentSuffix}"
            }
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
    "AppKMSKeyAlias": {
      "Type": "AWS::KMS::Alias",
      "Properties": {
        "AliasName": {
          "Fn::Sub": "alias/app-lambda-env-key-${EnvironmentSuffix}"
        },
        "TargetKeyId": {
          "Ref": "AppKMSKey"
        }
      }
    },
    "AppS3Bucket": {
      "Type": "AWS::S3::Bucket",
      "DeletionPolicy": "Delete",
      "UpdateReplacePolicy": "Delete",
      "Properties": {
        "BucketName": {
          "Fn::Sub": "app-s3bucket-${AWS::AccountId}-${AWS::Region}-${EnvironmentSuffix}"
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
        "VersioningConfiguration": {
          "Status": "Enabled"
        },
        "LifecycleConfiguration": {
          "Rules": [
            {
              "Id": "DeleteIncompleteMultipartUploads",
              "Status": "Enabled",
              "AbortIncompleteMultipartUpload": {
                "DaysAfterInitiation": 7
              }
            }
          ]
        },
        "NotificationConfiguration": {
          "LambdaConfigurations": [
            {
              "Event": "s3:ObjectCreated:*",
              "Function": {
                "Fn::GetAtt": ["AppLambdaFunction", "Arn"]
              }
            }
          ]
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "app-s3bucket-${EnvironmentSuffix}"
            }
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
    "AppLambdaExecutionRole": {
      "Type": "AWS::IAM::Role",
      "Properties": {
        "RoleName": {
          "Fn::Sub": "app-lambda-execution-role-${EnvironmentSuffix}"
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
            "PolicyName": {
              "Fn::Sub": "app-lambda-s3-access-policy-${EnvironmentSuffix}"
            },
            "PolicyDocument": {
              "Version": "2012-10-17",
              "Statement": [
                {
                  "Effect": "Allow",
                  "Action": [
                    "s3:GetObject",
                    "s3:GetObjectVersion",
                    "s3:ListBucket",
                    "s3:GetBucketLocation",
                    "s3:GetObjectAttributes",
                    "s3:GetObjectVersionAttributes"
                  ],
                  "Resource": [
                    {
                      "Fn::Sub": "arn:aws:s3:::app-s3bucket-${AWS::AccountId}-${AWS::Region}-${EnvironmentSuffix}"
                    },
                    {
                      "Fn::Sub": "arn:aws:s3:::app-s3bucket-${AWS::AccountId}-${AWS::Region}-${EnvironmentSuffix}/*"
                    }
                  ]
                },
                {
                  "Effect": "Allow",
                  "Action": [
                    "logs:CreateLogGroup",
                    "logs:CreateLogStream",
                    "logs:PutLogEvents"
                  ],
                  "Resource": {
                    "Fn::Sub": "arn:aws:logs:${AWS::Region}:${AWS::AccountId}:log-group:/aws/lambda/app-lambda-function-${EnvironmentSuffix}:*"
                  }
                },
                {
                  "Effect": "Allow",
                  "Action": ["kms:Decrypt", "kms:DescribeKey"],
                  "Resource": {
                    "Fn::GetAtt": ["AppKMSKey", "Arn"]
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
              "Fn::Sub": "app-lambda-role-${EnvironmentSuffix}"
            }
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
    "AppLambdaLogGroup": {
      "Type": "AWS::Logs::LogGroup",
      "DeletionPolicy": "Delete",
      "UpdateReplacePolicy": "Delete",
      "Properties": {
        "LogGroupName": {
          "Fn::Sub": "/aws/lambda/app-lambda-function-${EnvironmentSuffix}"
        },
        "RetentionInDays": 30,
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "app-lambda-logs-${EnvironmentSuffix}"
            }
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
    "AppLambdaFunction": {
      "Type": "AWS::Lambda::Function",
      "Properties": {
        "FunctionName": {
          "Fn::Sub": "app-lambda-function-${EnvironmentSuffix}"
        },
        "Runtime": "python3.12",
        "Handler": "index.lambda_handler",
        "Role": {
          "Fn::GetAtt": ["AppLambdaExecutionRole", "Arn"]
        },
        "Code": {
          "ZipFile": "import json\nimport boto3\nimport os\nimport logging\n\nlogger = logging.getLogger()\nlogger.setLevel(logging.INFO)\n\ndef lambda_handler(event, context):\n    logger.info(f'Lambda function invoked with event: {json.dumps(event)}')\n    \n    # Process S3 event\n    for record in event.get('Records', []):\n        bucket = record['s3']['bucket']['name']\n        key = record['s3']['object']['key']\n        event_name = record['eventName']\n        \n        logger.info(f'Processing {event_name} for object {key} in bucket {bucket}')\n        \n        # Add your custom processing logic here\n        logger.info(f'Environment: {os.environ.get(\"ENVIRONMENT\", \"not set\")}')\n        logger.info(f'Processing mode: {os.environ.get(\"PROCESSING_MODE\", \"not set\")}')\n    \n    return {\n        'statusCode': 200,\n        'body': json.dumps('S3 event processed successfully')\n    }\n"
        },
        "Timeout": 60,
        "MemorySize": 256,
        "Environment": {
          "Variables": {
            "ENVIRONMENT": {
              "Ref": "EnvironmentSuffix"
            },
            "PROCESSING_MODE": "automatic"
          }
        },
        "KmsKeyArn": {
          "Fn::GetAtt": ["AppKMSKey", "Arn"]
        },
        "ReservedConcurrentExecutions": 10,
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "app-lambda-function-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "EnvironmentSuffix"
            }
          }
        ]
      },
      "DependsOn": "AppLambdaLogGroup"
    },
    "AppLambdaPermission": {
      "Type": "AWS::Lambda::Permission",
      "Properties": {
        "FunctionName": {
          "Fn::GetAtt": ["AppLambdaFunction", "Arn"]
        },
        "Action": "lambda:InvokeFunction",
        "Principal": "s3.amazonaws.com",
        "SourceAccount": {
          "Ref": "AWS::AccountId"
        }
      }
    }
  },
  "Outputs": {
    "S3BucketArn": {
      "Description": "ARN of the created S3 bucket",
      "Value": {
        "Fn::GetAtt": ["AppS3Bucket", "Arn"]
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-S3BucketArn"
        }
      }
    },
    "S3BucketName": {
      "Description": "Name of the created S3 bucket",
      "Value": {
        "Ref": "AppS3Bucket"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-S3BucketName"
        }
      }
    },
    "LambdaFunctionArn": {
      "Description": "ARN of the Lambda function",
      "Value": {
        "Fn::GetAtt": ["AppLambdaFunction", "Arn"]
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-LambdaFunctionArn"
        }
      }
    },
    "LambdaFunctionName": {
      "Description": "Name of the Lambda function",
      "Value": {
        "Ref": "AppLambdaFunction"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-LambdaFunctionName"
        }
      }
    },
    "KMSKeyId": {
      "Description": "ID of the KMS key used for encryption",
      "Value": {
        "Ref": "AppKMSKey"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-KMSKeyId"
        }
      }
    },
    "KMSKeyArn": {
      "Description": "ARN of the KMS key used for encryption",
      "Value": {
        "Fn::GetAtt": ["AppKMSKey", "Arn"]
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-KMSKeyArn"
        }
      }
    }
  }
}
```
