# HIPAA-Compliant Patient Data Processing Infrastructure

This CloudFormation template deploys a secure, HIPAA-compliant infrastructure for processing patient records with encrypted storage, secure compute, and comprehensive audit logging.

## File: lib/TapStack.json

```json
{
  "AWSTemplateFormatVersion": "2010-09-09",
  "Description": "HIPAA-compliant patient data processing infrastructure with encrypted S3 storage, secure Lambda processing, KMS encryption, and CloudWatch audit logging",
  "Parameters": {
    "EnvironmentSuffix": {
      "Type": "String",
      "Description": "Unique suffix for resource naming to support multiple environments",
      "Default": "prod",
      "AllowedPattern": "^[a-z0-9-]+$",
      "ConstraintDescription": "Must contain only lowercase letters, numbers, and hyphens"
    },
    "ExternalId": {
      "Type": "String",
      "Description": "External ID for cross-account IAM role assumption",
      "Default": "test-external-id-123",
      "MinLength": 8,
      "NoEcho": true
    },
    "DatabasePassword": {
      "Type": "String",
      "Description": "Database password to be encrypted in Lambda environment",
      "Default": "TestPassword123!",
      "NoEcho": true,
      "MinLength": 12
    }
  },
  "Resources": {
    "EncryptionKey": {
      "Type": "AWS::KMS::Key",
      "Properties": {
        "Description": "Customer-managed KMS key for encrypting Lambda environment variables containing database credentials",
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
              "Sid": "Allow Lambda to use the key",
              "Effect": "Allow",
              "Principal": {
                "Service": "lambda.amazonaws.com"
              },
              "Action": [
                "kms:Decrypt",
                "kms:DescribeKey"
              ],
              "Resource": "*",
              "Condition": {
                "StringEquals": {
                  "kms:ViaService": {
                    "Fn::Sub": "lambda.${AWS::Region}.amazonaws.com"
                  }
                }
              }
            },
            {
              "Sid": "Allow CloudWatch Logs to use the key",
              "Effect": "Allow",
              "Principal": {
                "Service": {
                  "Fn::Sub": "logs.${AWS::Region}.amazonaws.com"
                }
              },
              "Action": [
                "kms:Encrypt",
                "kms:Decrypt",
                "kms:ReEncrypt*",
                "kms:GenerateDataKey*",
                "kms:CreateGrant",
                "kms:DescribeKey"
              ],
              "Resource": "*",
              "Condition": {
                "ArnLike": {
                  "kms:EncryptionContext:aws:logs:arn": {
                    "Fn::Sub": "arn:aws:logs:${AWS::Region}:${AWS::AccountId}:*"
                  }
                }
              }
            }
          ]
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "kms-key-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "EnvironmentSuffix"
            }
          },
          {
            "Key": "DataClassification",
            "Value": "PHI-HealthcareData"
          },
          {
            "Key": "ComplianceScope",
            "Value": "HIPAA"
          }
        ]
      }
    },
    "EncryptionKeyAlias": {
      "Type": "AWS::KMS::Alias",
      "Properties": {
        "AliasName": {
          "Fn::Sub": "alias/patient-data-key-${EnvironmentSuffix}"
        },
        "TargetKeyId": {
          "Ref": "EncryptionKey"
        }
      }
    },
    "PatientDataBucket": {
      "Type": "AWS::S3::Bucket",
      "DeletionPolicy": "Retain",
      "UpdateReplacePolicy": "Retain",
      "Properties": {
        "BucketName": {
          "Fn::Sub": "patient-data-bucket-${EnvironmentSuffix}-${AWS::AccountId}"
        },
        "BucketEncryption": {
          "ServerSideEncryptionConfiguration": [
            {
              "ServerSideEncryptionByDefault": {
                "SSEAlgorithm": "AES256"
              },
              "BucketKeyEnabled": true
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
              "NoncurrentVersionExpirationInDays": 90
            }
          ]
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "patient-data-bucket-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "EnvironmentSuffix"
            }
          },
          {
            "Key": "DataClassification",
            "Value": "PHI-HealthcareData"
          },
          {
            "Key": "ComplianceScope",
            "Value": "HIPAA"
          }
        ]
      }
    },
    "PatientDataBucketPolicy": {
      "Type": "AWS::S3::BucketPolicy",
      "Properties": {
        "Bucket": {
          "Ref": "PatientDataBucket"
        },
        "PolicyDocument": {
          "Version": "2012-10-17",
          "Statement": [
            {
              "Sid": "DenyUnencryptedObjectUploads",
              "Effect": "Deny",
              "Principal": "*",
              "Action": "s3:PutObject",
              "Resource": {
                "Fn::Sub": "${PatientDataBucket.Arn}/*"
              },
              "Condition": {
                "StringNotEquals": {
                  "s3:x-amz-server-side-encryption": "AES256"
                }
              }
            },
            {
              "Sid": "DenyInsecureTransport",
              "Effect": "Deny",
              "Principal": "*",
              "Action": "s3:*",
              "Resource": [
                {
                  "Fn::GetAtt": [
                    "PatientDataBucket",
                    "Arn"
                  ]
                },
                {
                  "Fn::Sub": "${PatientDataBucket.Arn}/*"
                }
              ],
              "Condition": {
                "Bool": {
                  "aws:SecureTransport": "false"
                }
              }
            }
          ]
        }
      }
    },
    "LambdaExecutionRole": {
      "Type": "AWS::IAM::Role",
      "Properties": {
        "RoleName": {
          "Fn::Sub": "lambda-execution-role-${EnvironmentSuffix}"
        },
        "AssumeRolePolicyDocument": {
          "Version": "2012-10-17",
          "Statement": [
            {
              "Effect": "Allow",
              "Principal": {
                "Service": "lambda.amazonaws.com"
              },
              "Action": "sts:AssumeRole",
              "Condition": {
                "StringEquals": {
                  "sts:ExternalId": {
                    "Ref": "ExternalId"
                  }
                }
              }
            }
          ]
        },
        "ManagedPolicyArns": [],
        "Policies": [
          {
            "PolicyName": "LambdaS3Access",
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
                    "Fn::Sub": "${PatientDataBucket.Arn}/*"
                  }
                },
                {
                  "Effect": "Allow",
                  "Action": [
                    "s3:ListBucket",
                    "s3:ListBucketVersions"
                  ],
                  "Resource": {
                    "Fn::GetAtt": [
                      "PatientDataBucket",
                      "Arn"
                    ]
                  }
                }
              ]
            }
          },
          {
            "PolicyName": "LambdaLogsAccess",
            "PolicyDocument": {
              "Version": "2012-10-17",
              "Statement": [
                {
                  "Effect": "Allow",
                  "Action": [
                    "logs:CreateLogStream",
                    "logs:PutLogEvents"
                  ],
                  "Resource": {
                    "Fn::Sub": "${PatientDataProcessorLogGroup.Arn}:*"
                  }
                }
              ]
            }
          },
          {
            "PolicyName": "LambdaKMSAccess",
            "PolicyDocument": {
              "Version": "2012-10-17",
              "Statement": [
                {
                  "Effect": "Allow",
                  "Action": [
                    "kms:Decrypt",
                    "kms:DescribeKey"
                  ],
                  "Resource": {
                    "Fn::GetAtt": [
                      "EncryptionKey",
                      "Arn"
                    ]
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
              "Fn::Sub": "lambda-execution-role-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "EnvironmentSuffix"
            }
          },
          {
            "Key": "DataClassification",
            "Value": "PHI-HealthcareData"
          },
          {
            "Key": "ComplianceScope",
            "Value": "HIPAA"
          }
        ]
      }
    },
    "PatientDataProcessorLogGroup": {
      "Type": "AWS::Logs::LogGroup",
      "DeletionPolicy": "Retain",
      "UpdateReplacePolicy": "Retain",
      "Properties": {
        "LogGroupName": {
          "Fn::Sub": "/aws/lambda/patient-data-processor-${EnvironmentSuffix}"
        },
        "RetentionInDays": 90,
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "patient-data-processor-logs-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "EnvironmentSuffix"
            }
          },
          {
            "Key": "DataClassification",
            "Value": "PHI-HealthcareData"
          },
          {
            "Key": "ComplianceScope",
            "Value": "HIPAA"
          }
        ]
      }
    },
    "PatientDataProcessor": {
      "Type": "AWS::Lambda::Function",
      "DependsOn": [
        "PatientDataProcessorLogGroup"
      ],
      "Properties": {
        "FunctionName": {
          "Fn::Sub": "patient-data-processor-${EnvironmentSuffix}"
        },
        "Runtime": "python3.11",
        "Handler": "index.lambda_handler",
        "Role": {
          "Fn::GetAtt": [
            "LambdaExecutionRole",
            "Arn"
          ]
        },
        "MemorySize": 1024,
        "Timeout": 300,
        "KmsKeyArn": {
          "Fn::GetAtt": [
            "EncryptionKey",
            "Arn"
          ]
        },
        "Environment": {
          "Variables": {
            "BUCKET_NAME": {
              "Ref": "PatientDataBucket"
            },
            "DATABASE_PASSWORD": {
              "Ref": "DatabasePassword"
            },
            "ENVIRONMENT": {
              "Ref": "EnvironmentSuffix"
            },
            "LOG_LEVEL": "INFO"
          }
        },
        "Code": {
          "ZipFile": "import json\nimport boto3\nimport os\nimport logging\nfrom datetime import datetime\n\n# Configure logging\nlogger = logging.getLogger()\nlogger.setLevel(os.environ.get('LOG_LEVEL', 'INFO'))\n\ns3_client = boto3.client('s3')\n\ndef lambda_handler(event, context):\n    \"\"\"\n    Process patient data records from S3 bucket.\n    \n    This function is triggered when new objects are created in the S3 bucket.\n    It performs secure processing of patient records with comprehensive logging\n    for HIPAA compliance and audit requirements.\n    \"\"\"\n    try:\n        logger.info(f\"Processing event: {json.dumps(event)}\")\n        \n        # Extract S3 event details\n        for record in event.get('Records', []):\n            if record.get('eventName', '').startswith('ObjectCreated'):\n                bucket_name = record['s3']['bucket']['name']\n                object_key = record['s3']['object']['key']\n                \n                logger.info(f\"Processing new patient record: {object_key} from bucket: {bucket_name}\")\n                \n                # Get object metadata\n                try:\n                    response = s3_client.head_object(\n                        Bucket=bucket_name,\n                        Key=object_key\n                    )\n                    \n                    # Verify encryption\n                    encryption = response.get('ServerSideEncryption', 'None')\n                    logger.info(f\"Object encryption: {encryption}\")\n                    \n                    if encryption == 'None':\n                        logger.error(f\"SECURITY VIOLATION: Unencrypted object detected: {object_key}\")\n                        raise ValueError(\"Unencrypted patient data detected\")\n                    \n                    # Get object content\n                    obj_response = s3_client.get_object(\n                        Bucket=bucket_name,\n                        Key=object_key\n                    )\n                    \n                    content = obj_response['Body'].read().decode('utf-8')\n                    logger.info(f\"Successfully retrieved patient record: {object_key}\")\n                    \n                    # Process patient data\n                    # In production, this would include:\n                    # - Data validation and sanitization\n                    # - PHI de-identification if required\n                    # - Database operations (using encrypted DATABASE_PASSWORD)\n                    # - Compliance checks and audit logging\n                    \n                    logger.info(f\"Patient record processed successfully: {object_key}\")\n                    \n                except Exception as e:\n                    logger.error(f\"Error processing object {object_key}: {str(e)}\")\n                    raise\n        \n        return {\n            'statusCode': 200,\n            'body': json.dumps({\n                'message': 'Patient records processed successfully',\n                'timestamp': datetime.utcnow().isoformat()\n            })\n        }\n        \n    except Exception as e:\n        logger.error(f\"Lambda execution failed: {str(e)}\")\n        return {\n            'statusCode': 500,\n            'body': json.dumps({\n                'message': 'Error processing patient records',\n                'error': str(e),\n                'timestamp': datetime.utcnow().isoformat()\n            })\n        }\n"
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "patient-data-processor-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "EnvironmentSuffix"
            }
          },
          {
            "Key": "DataClassification",
            "Value": "PHI-HealthcareData"
          },
          {
            "Key": "ComplianceScope",
            "Value": "HIPAA"
          }
        ]
      }
    },
    "LambdaInvokePermission": {
      "Type": "AWS::Lambda::Permission",
      "Properties": {
        "FunctionName": {
          "Ref": "PatientDataProcessor"
        },
        "Action": "lambda:InvokeFunction",
        "Principal": "s3.amazonaws.com",
        "SourceAccount": {
          "Ref": "AWS::AccountId"
        },
        "SourceArn": {
          "Fn::GetAtt": [
            "PatientDataBucket",
            "Arn"
          ]
        }
      }
    }
  },
  "Outputs": {
    "S3BucketArn": {
      "Description": "ARN of the patient data S3 bucket",
      "Value": {
        "Fn::GetAtt": [
          "PatientDataBucket",
          "Arn"
        ]
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-S3BucketArn"
        }
      }
    },
    "S3BucketName": {
      "Description": "Name of the patient data S3 bucket",
      "Value": {
        "Ref": "PatientDataBucket"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-S3BucketName"
        }
      }
    },
    "LambdaFunctionArn": {
      "Description": "ARN of the patient data processor Lambda function",
      "Value": {
        "Fn::GetAtt": [
          "PatientDataProcessor",
          "Arn"
        ]
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-LambdaFunctionArn"
        }
      }
    },
    "LambdaFunctionName": {
      "Description": "Name of the patient data processor Lambda function",
      "Value": {
        "Ref": "PatientDataProcessor"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-LambdaFunctionName"
        }
      }
    },
    "KMSKeyId": {
      "Description": "ID of the KMS customer-managed key for encryption",
      "Value": {
        "Ref": "EncryptionKey"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-KMSKeyId"
        }
      }
    },
    "KMSKeyArn": {
      "Description": "ARN of the KMS customer-managed key for encryption",
      "Value": {
        "Fn::GetAtt": [
          "EncryptionKey",
          "Arn"
        ]
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-KMSKeyArn"
        }
      }
    },
    "LogGroupName": {
      "Description": "Name of the CloudWatch Logs group for Lambda function",
      "Value": {
        "Ref": "PatientDataProcessorLogGroup"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-LogGroupName"
        }
      }
    }
  }
}
```

## Key Features

1. **Encrypted Storage**
   - S3 bucket with AES-256 server-side encryption
   - S3 bucket key encryption enabled for cost optimization
   - Versioning enabled for data integrity
   - Public access blocked
   - Lifecycle policy for old version cleanup

2. **Secure Compute**
   - Lambda function with KMS encryption for environment variables
   - IAM role with least-privilege access
   - External ID condition for role assumption
   - Comprehensive error handling and logging

3. **Key Management**
   - Customer-managed KMS key with automatic rotation
   - Key policies for Lambda and CloudWatch Logs access
   - KMS alias for easier key management

4. **Compliance & Audit**
   - CloudWatch Logs with 90-day retention
   - DeletionPolicy and UpdateReplacePolicy: Retain for stateful resources
   - Comprehensive resource tagging
   - HIPAA-compliant data classification

5. **Integration**
   - Lambda permission for S3 event notifications
   - SourceAccount specified for cross-account security
   - Stack outputs for integration with other stacks

## Deployment

Deploy using AWS CLI:

```bash
aws cloudformation deploy \
  --template-file lib/TapStack.json \
  --stack-name TapStack${ENVIRONMENT_SUFFIX} \
  --capabilities CAPABILITY_IAM CAPABILITY_NAMED_IAM \
  --parameter-overrides \
    EnvironmentSuffix=${ENVIRONMENT_SUFFIX} \
    ExternalId=${EXTERNAL_ID} \
    DatabasePassword=${DATABASE_PASSWORD} \
  --region us-east-1
```

## Testing

Integration tests are provided in `test/tap-stack.int.test.ts` that:
- Dynamically discover the stack name from `ENVIRONMENT_SUFFIX`
- Validate all deployed resources
- Verify security configurations
- Check compliance requirements

Run integration tests:

```bash
export ENVIRONMENT_SUFFIX=pr6640
export AWS_REGION=us-east-1
npm run test:integration
```
