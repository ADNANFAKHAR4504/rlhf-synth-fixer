### Reasoning Trace

---

The user wants a CloudFormation template in JSON format that creates a serverless infrastructure with the following requirements:

1. S3 bucket
2. Python 3.12 Lambda function triggered by S3 object creation
3. IAM roles and policies for Lambda to access S3 and CloudWatch
4. KMS encryption for Lambda environment variables
5. CloudWatch Log Group for Lambda logs
6. S3 lifecycle policy to delete incomplete multipart uploads after 7 days
7. Stack policy to prevent S3 bucket updates after creation
8. Drift detection enabled on resources
9. Naming convention with "app-" prefix
10. Export S3 bucket ARN in Outputs

Let me create a comprehensive CloudFormation template that addresses all these requirements.

### Answer

---

I'll create a comprehensive CloudFormation template that meets all your requirements. This template will deploy a serverless infrastructure with proper security, monitoring, and lifecycle management.

```json
{
  "AWSTemplateFormatVersion": "2010-09-09",
  "Description": "Serverless infrastructure with S3 bucket and Lambda function with KMS encryption and lifecycle policies",

  "Parameters": {
    "Environment": {
      "Type": "String",
      "Default": "dev",
      "AllowedValues": ["dev", "staging", "prod"],
      "Description": "Environment name for the deployment"
    }
  },

  "Resources": {
    "AppKMSKey": {
      "Type": "AWS::KMS::Key",
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
            "Value": "app-kms-key"
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "Environment"
            }
          }
        ]
      }
    },

    "AppKMSKeyAlias": {
      "Type": "AWS::KMS::Alias",
      "Properties": {
        "AliasName": "alias/app-lambda-env-key",
        "TargetKeyId": {
          "Ref": "AppKMSKey"
        }
      }
    },

    "AppS3Bucket": {
      "Type": "AWS::S3::Bucket",
      "Properties": {
        "BucketName": {
          "Fn::Sub": "app-s3bucket-${AWS::AccountId}-${AWS::Region}"
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
            "Value": "app-s3bucket"
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "Environment"
            }
          }
        ]
      },
      "DependsOn": "AppLambdaPermission"
    },

    "AppLambdaExecutionRole": {
      "Type": "AWS::IAM::Role",
      "Properties": {
        "RoleName": "app-lambda-execution-role",
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
            "PolicyName": "app-lambda-s3-access-policy",
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
                    "s3:GetObjectMetadata",
                    "s3:GetObjectVersionMetadata"
                  ],
                  "Resource": [
                    {
                      "Fn::Sub": "arn:aws:s3:::app-s3bucket-${AWS::AccountId}-${AWS::Region}"
                    },
                    {
                      "Fn::Sub": "arn:aws:s3:::app-s3bucket-${AWS::AccountId}-${AWS::Region}/*"
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
                    "Fn::Sub": "arn:aws:logs:${AWS::Region}:${AWS::AccountId}:log-group:/aws/lambda/app-lambda-function:*"
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
            "Value": "app-lambda-role"
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "Environment"
            }
          }
        ]
      }
    },

    "AppLambdaLogGroup": {
      "Type": "AWS::Logs::LogGroup",
      "Properties": {
        "LogGroupName": "/aws/lambda/app-lambda-function",
        "RetentionInDays": 30,
        "Tags": [
          {
            "Key": "Name",
            "Value": "app-lambda-logs"
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "Environment"
            }
          }
        ]
      }
    },

    "AppLambdaFunction": {
      "Type": "AWS::Lambda::Function",
      "Properties": {
        "FunctionName": "app-lambda-function",
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
              "Ref": "Environment"
            },
            "PROCESSING_MODE": "automatic",
            "S3_BUCKET": {
              "Ref": "AppS3Bucket"
            }
          }
        },
        "KmsKeyArn": {
          "Fn::GetAtt": ["AppKMSKey", "Arn"]
        },
        "ReservedConcurrentExecutions": 10,
        "Tags": [
          {
            "Key": "Name",
            "Value": "app-lambda-function"
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "Environment"
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
        "SourceArn": {
          "Fn::Sub": "arn:aws:s3:::app-s3bucket-${AWS::AccountId}-${AWS::Region}"
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
      }
    },
    "LambdaFunctionArn": {
      "Description": "ARN of the Lambda function",
      "Value": {
        "Fn::GetAtt": ["AppLambdaFunction", "Arn"]
      }
    },
    "KMSKeyId": {
      "Description": "ID of the KMS key used for encryption",
      "Value": {
        "Ref": "AppKMSKey"
      }
    }
  }
}
```

Additionally, here's the **Stack Policy** that should be applied when creating the stack to prevent updates to the S3 bucket after creation:

```json
{
  "Statement": [
    {
      "Effect": "Deny",
      "Principal": "*",
      "Action": ["Update:Replace", "Update:Delete", "Update:Modify"],
      "Resource": "LogicalResourceId/AppS3Bucket",
      "Condition": {
        "StringEquals": {
          "ResourceType": ["AWS::S3::Bucket"]
        }
      }
    },
    {
      "Effect": "Allow",
      "Principal": "*",
      "Action": "Update:*",
      "Resource": "*"
    }
  ]
}
```

## Key Features Implemented:

### 1. **Resource Naming Convention**

- All resources follow the "app-" prefix convention
- Resources are named descriptively (e.g., `app-s3bucket`, `app-lambda-function`)

### 2. **Security Features**

- **KMS Encryption**: Lambda environment variables are encrypted using a dedicated KMS key
- **S3 Bucket Security**:
  - Server-side encryption enabled (AES256)
  - Public access blocked
  - Versioning enabled
- **IAM Least Privilege**: Lambda has only necessary permissions for S3 and CloudWatch

### 3. **Lambda Configuration**

- Python 3.12 runtime
- Triggered on all S3 object creation events
- Environment variables encrypted with KMS
- Reserved concurrent executions set to prevent throttling

### 4. **Monitoring & Logging**

- Dedicated CloudWatch Log Group with 30-day retention
- Lambda includes comprehensive logging in the code

### 5. **Lifecycle Management**

- S3 lifecycle rule to delete incomplete multipart uploads after 7 days

### 6. **Outputs**

- S3 Bucket ARN is exported for cross-stack references
- Additional outputs for bucket name, Lambda ARN, and KMS key ID

## Deployment Instructions:

1. **Save the template** as `serverless-infrastructure.json`

2. **Save the stack policy** as `stack-policy.json`

3. **Deploy the stack** with the stack policy:

```bash
aws cloudformation create-stack \
  --stack-name app-serverless-stack \
  --template-body file://serverless-infrastructure.json \
  --stack-policy-body file://stack-policy.json \
  --capabilities CAPABILITY_NAMED_IAM \
  --region us-east-1
```

4. **Enable drift detection** after stack creation:

```bash
aws cloudformation detect-stack-drift \
  --stack-name app-serverless-stack \
  --region us-east-1
```

The template is production-ready and includes all best practices for security, monitoring, and lifecycle management. The Lambda function includes sample code that logs S3 events and can be extended with your business logic.
