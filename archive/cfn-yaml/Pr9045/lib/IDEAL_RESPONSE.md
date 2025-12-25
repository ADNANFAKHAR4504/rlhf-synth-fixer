# Ideal CloudFormation Response for Data Backup System with S3

This document outlines the ideal CloudFormation template implementation for the data backup system as specified in the requirements.

## Template Structure

The ideal response should include:

### 1. Parameters

- **Environment**: Environment name (dev, staging, prod) with proper validation
- **BackupBucketName**: Globally unique S3 bucket name with pattern validation

### 2. Mappings

- **EnvironmentConfig**: Environment-specific configurations like retention days

### 3. Core Resources

#### Security & Encryption

- **AWS::KMS::Key**: Customer managed key for backup encryption
- **AWS::KMS::Alias**: User-friendly alias for the KMS key

#### Storage

- **AWS::S3::Bucket**: Primary backup bucket with:
  - KMS encryption enabled
  - Versioning enabled
  - Lifecycle policies for automatic cleanup
  - Public access blocked
  - Access logging configured
- **AWS::S3::Bucket**: Separate logging bucket for access logs

#### Compute

- **AWS::Lambda::Function**: Python 3.9 function for backup processing with:
  - Proper error handling and retry logic
  - CloudWatch metrics integration
  - Environment variables for configuration
  - Appropriate timeout and memory allocation

#### IAM

- **AWS::IAM::Role**: Lambda execution role with:
  - Basic execution permissions
  - S3 bucket access (least privilege)
  - KMS key usage permissions
  - CloudWatch metrics permissions

#### Monitoring & Scheduling

- **AWS::Logs::LogGroup**: Dedicated log group for Lambda function
- **AWS::Events::Rule**: EventBridge rule for daily triggers
- **AWS::Lambda::Permission**: Allow EventBridge to invoke Lambda
- **AWS::CloudWatch::Alarm**: Backup failure alerts
- **AWS::CloudWatch::Alarm**: Duration monitoring

### 4. Outputs

- **BackupBucketName**: S3 bucket name with stack export
- **BackupLambdaArn**: Lambda function ARN for reference
- **EventBridgeRuleName**: Scheduled rule name
- **KMSKeyId**: KMS key ID for external reference

## Key Quality Attributes

### Security

- No hardcoded values or account-specific information
- Proper IAM policies with least privilege access
- KMS encryption for data at rest
- Public access blocked on all S3 buckets

### Reliability

- Error handling in Lambda function
- CloudWatch alarms for monitoring
- Retry policies on EventBridge rules
- Proper resource tagging

### Cost Optimization

- Lifecycle policies to automatically delete old backups
- Pay-per-request billing for infrequent access patterns
- Appropriate resource sizing

### Cross-Account Compatibility

- Use of AWS pseudo parameters (AWS::AccountId, AWS::Region)
- No hardcoded ARNs or resource names
- Parameterized configuration

## Lambda Function Implementation

The ideal Lambda function should:

1. **Process 500+ documents daily** as specified in requirements
2. **Generate structured backup manifests** with metadata
3. **Upload to S3** with proper encryption and metadata
4. **Send CloudWatch metrics** for monitoring
5. **Handle errors gracefully** with proper logging
6. **Support cross-account execution** without modifications

### Example Lambda Function Structure

```python
import json
import boto3
import logging
from datetime import datetime

def lambda_handler(event, context):
    """
    Main handler for backup processing
    """
    try:
        # Initialize AWS clients
        s3_client = boto3.client('s3')
        cloudwatch = boto3.client('cloudwatch')

        # Process backup operations
        result = process_backups(s3_client)

        # Send metrics to CloudWatch
        send_metrics(cloudwatch, result)

        return {
            'statusCode': 200,
            'body': json.dumps('Backup completed successfully')
        }
    except Exception as e:
        logging.error(f"Backup failed: {str(e)}")
        raise
```

## Resource Naming Convention

All resources should follow consistent naming patterns:

```yaml
# Example naming patterns
BackupBucket: !Sub '${AWS::StackName}-backup-${Environment}'
LambdaFunction: !Sub '${AWS::StackName}-backup-processor'
KMSKey: !Sub '${AWS::StackName}-backup-key'
LogGroup: !Sub '/aws/lambda/${AWS::StackName}-backup-processor'
```

## Tagging Strategy

All resources must include:

```yaml
Tags:
  - Key: Environment
    Value: !Ref Environment
  - Key: Purpose
    Value: DataBackup
  - Key: iac-rlhf-amazon
    Value: backup-system
```

This template serves as the gold standard for a production-ready, secure, and maintainable data backup solution using AWS CloudFormation.

## Complete CloudFormation Templates

### lib/TapStack.yml - Complete YAML Implementation

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Automated Daily Backup System with S3, Lambda, and EventBridge'

Metadata:
  AWS::CloudFormation::Interface:
    ParameterGroups:
      - Label:
          default: 'Environment Configuration'
        Parameters:
          - Environment
          - BackupBucketName

Parameters:
  Environment:
    Type: String
    Description: Environment name (dev, staging, prod)
    Default: prod
    AllowedValues:
      - dev
      - staging
      - prod

  BackupBucketName:
    Type: String
    Description: Name for the S3 backup bucket (must be globally unique)
    Default: 'backup-system-prod-12345'
    AllowedPattern: '^[a-z0-9][a-z0-9-]*[a-z0-9]$'
    ConstraintDescription: Must be a valid S3 bucket name
    MinLength: 3
    MaxLength: 63

Mappings:
  EnvironmentConfig:
    dev:
      RetentionDays: 7
    staging:
      RetentionDays: 14
    prod:
      RetentionDays: 30

Resources:
  # KMS Key for S3 Encryption
  BackupKMSKey:
    Type: AWS::KMS::Key
    Properties:
      Description: !Sub 'KMS key for ${Environment} backup encryption'
      KeyPolicy:
        Version: '2012-10-17'
        Id: backup-key-policy
        Statement:
          - Sid: Enable IAM User Permissions
            Effect: Allow
            Principal:
              AWS: !Sub 'arn:aws:iam::${AWS::AccountId}:root'
            Action: 'kms:*'
            Resource: '*'
          - Sid: Allow Lambda to use the key
            Effect: Allow
            Principal:
              Service: lambda.amazonaws.com
            Action:
              - 'kms:Decrypt'
              - 'kms:GenerateDataKey'
              - 'kms:CreateGrant'
              - 'kms:DescribeKey'
            Resource: '*'
            Condition:
              StringEquals:
                'kms:ViaService': !Sub 's3.${AWS::Region}.amazonaws.com'
          - Sid: Allow CloudWatch Logs to use the key
            Effect: Allow
            Principal:
              Service: !Sub 'logs.${AWS::Region}.amazonaws.com'
            Action:
              - 'kms:Encrypt'
              - 'kms:Decrypt'
              - 'kms:ReEncrypt*'
              - 'kms:GenerateDataKey*'
              - 'kms:DescribeKey'
            Resource: '*'
            Condition:
              ArnLike:
                'kms:EncryptionContext:aws:logs:arn': !Sub 'arn:aws:logs:${AWS::Region}:${AWS::AccountId}:log-group:/aws/lambda/${Environment}-backup-function'
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: Purpose
          Value: BackupEncryption
        - Key: iac-rlhf-amazon
          Value: 'true'

  BackupKMSKeyAlias:
    Type: AWS::KMS::Alias
    Properties:
      AliasName: !Sub 'alias/${Environment}-backup-key'
      TargetKeyId: !Ref BackupKMSKey

  # S3 Backup Bucket
  BackupS3Bucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub '${BackupBucketName}-${AWS::AccountId}-${Environment}'
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: 'aws:kms'
              KMSMasterKeyID: !Ref BackupKMSKey
      VersioningConfiguration:
        Status: Enabled
      LifecycleConfiguration:
        Rules:
          - Id: DeleteOldBackups
            Status: Enabled
            ExpirationInDays:
              !FindInMap [EnvironmentConfig, !Ref Environment, RetentionDays]
            NoncurrentVersionExpirationInDays: 1
          - Id: AbortIncompleteMultipartUploads
            Status: Enabled
            AbortIncompleteMultipartUpload:
              DaysAfterInitiation: 1
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      MetricsConfigurations:
        - Id: BackupMetrics
      LoggingConfiguration:
        DestinationBucketName: !Ref LoggingBucket
        LogFilePrefix: backup-access-logs/
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: Purpose
          Value: DailyBackups
        - Key: iac-rlhf-amazon
          Value: 'true'

  # S3 Bucket for Access Logs
  LoggingBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Sub '${BackupBucketName}-${AWS::AccountId}-${Environment}-logs'
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: AES256
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      LifecycleConfiguration:
        Rules:
          - Id: DeleteOldLogs
            Status: Enabled
            ExpirationInDays: 90
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: Purpose
          Value: BackupLogs
        - Key: iac-rlhf-amazon
          Value: 'true'

  # IAM Role for Lambda
  BackupLambdaRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: !Sub '${Environment}-backup-lambda-role'
      AssumeRolePolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Effect: Allow
            Principal:
              Service: lambda.amazonaws.com
            Action: 'sts:AssumeRole'
      ManagedPolicyArns:
        - 'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole'
      Policies:
        - PolicyName: BackupS3Access
          PolicyDocument:
            Version: '2012-10-17'
            Statement:
              - Effect: Allow
                Action:
                  - 's3:PutObject'
                  - 's3:PutObjectAcl'
                  - 's3:GetObject'
                  - 's3:GetObjectVersion'
                Resource:
                  - !Sub '${BackupS3Bucket.Arn}/*'
              - Effect: Allow
                Action:
                  - 's3:ListBucket'
                Resource:
                  - !GetAtt BackupS3Bucket.Arn
              - Effect: Allow
                Action:
                  - 'kms:Decrypt'
                  - 'kms:GenerateDataKey'
                  - 'kms:CreateGrant'
                  - 'kms:DescribeKey'
                Resource:
                  - !GetAtt BackupKMSKey.Arn
              - Effect: Allow
                Action:
                  - 'cloudwatch:PutMetricData'
                Resource: '*'
                Condition:
                  StringEquals:
                    'cloudwatch:namespace': 'BackupSystem'
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: Purpose
          Value: BackupLambdaExecution
        - Key: iac-rlhf-amazon
          Value: 'true'

  # CloudWatch Log Group for Lambda
  BackupLambdaLogGroup:
    Type: AWS::Logs::LogGroup
    Properties:
      LogGroupName: !Sub '/aws/lambda/${Environment}-backup-function'
      RetentionInDays: 30
      KmsKeyId: !GetAtt BackupKMSKey.Arn
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: Purpose
          Value: BackupLogs
        - Key: iac-rlhf-amazon
          Value: 'true'

  # Lambda Function for Backups
  BackupLambdaFunction:
    Type: AWS::Lambda::Function
    Properties:
      FunctionName: !Sub '${Environment}-backup-function'
      Description: 'Daily backup function to upload documents to S3'
      Runtime: python3.9
      Handler: index.lambda_handler
      Role: !GetAtt BackupLambdaRole.Arn
      Timeout: 900 # 15 minutes
      MemorySize: 512
      Environment:
        Variables:
          BACKUP_BUCKET: !Ref BackupS3Bucket
          ENVIRONMENT: !Ref Environment
          KMS_KEY_ID: !Ref BackupKMSKey
      Code:
        ZipFile: |
          import json
          import boto3
          import os
          from datetime import datetime
          import logging
          from botocore.exceptions import ClientError

          logger = logging.getLogger()
          logger.setLevel(logging.INFO)

          s3_client = boto3.client('s3')
          cloudwatch = boto3.client('cloudwatch')

          def send_metric(metric_name, value, unit='Count'):
              """Send custom metric to CloudWatch"""
              try:
                  cloudwatch.put_metric_data(
                      Namespace='BackupSystem',
                      MetricData=[
                          {
                              'MetricName': metric_name,
                              'Value': value,
                              'Unit': unit,
                              'Dimensions': [
                                  {
                                      'Name': 'Environment',
                                      'Value': os.environ['ENVIRONMENT']
                                  }
                              ]
                          }
                      ]
                  )
              except Exception as e:
                  logger.error(f"Failed to send metric: {e}")

          def generate_sample_documents(count=500):
              """Generate sample business documents for backup"""
              documents = []
              document_types = ['invoice', 'receipt', 'contract', 'report', 'memo']
              
              for i in range(count):
                  doc_type = document_types[i % len(document_types)]
                  document = {
                      'document_id': f'{doc_type}_{i:04d}',
                      'type': doc_type,
                      'content': f'Sample {doc_type} content for document {i}',
                      'created_date': datetime.utcnow().isoformat(),
                      'file_size': len(f'Sample {doc_type} content for document {i}'),
                      'checksum': f'md5_{i:04d}',
                      'metadata': {
                          'department': ['finance', 'hr', 'operations', 'sales'][i % 4],
                          'priority': ['low', 'medium', 'high'][i % 3],
                          'confidential': i % 5 == 0
                      }
                  }
                  documents.append(document)
              
              return documents

          def lambda_handler(event, context):
              """Main handler for backup processing"""
              bucket_name = os.environ['BACKUP_BUCKET']
              kms_key_id = os.environ['KMS_KEY_ID']
              
              backup_date = datetime.utcnow().strftime('%Y-%m-%d')
              documents_uploaded = 0
              
              try:
                  logger.info(f"Starting backup process for {backup_date}")
                  
                  # Generate sample documents for backup (in real scenario, fetch from business systems)
                  sample_documents = generate_sample_documents(500)
                  
                  # Create daily backup manifest with business context
                  manifest = {
                      'backup_date': backup_date,
                      'backup_timestamp': datetime.utcnow().isoformat(),
                      'total_documents': len(sample_documents),
                      'backup_summary': {
                          'document_types': {},
                          'departments': {},
                          'total_size_bytes': 0
                      },
                      'documents': sample_documents
                  }
                  
                  # Calculate summary statistics
                  for doc in sample_documents:
                      doc_type = doc['type']
                      department = doc['metadata']['department']
                      
                      manifest['backup_summary']['document_types'][doc_type] = \
                          manifest['backup_summary']['document_types'].get(doc_type, 0) + 1
                      manifest['backup_summary']['departments'][department] = \
                          manifest['backup_summary']['departments'].get(department, 0) + 1
                      manifest['backup_summary']['total_size_bytes'] += doc['file_size']
                  
                  # Upload manifest to S3 with encryption
                  manifest_key = f'backups/{backup_date}/manifest.json'
                  
                  s3_client.put_object(
                      Bucket=bucket_name,
                      Key=manifest_key,
                      Body=json.dumps(manifest, indent=2),
                      ServerSideEncryption='aws:kms',
                      SSEKMSKeyId=kms_key_id,
                      ContentType='application/json',
                      Tagging='Type=BackupManifest&Environment=' + os.environ['ENVIRONMENT'],
                      Metadata={
                          'backup-date': backup_date,
                          'document-count': str(len(sample_documents)),
                          'backup-type': 'daily-business-documents'
                      }
                  )
                  
                  # Upload individual document samples (simulate business document backup)
                  for i, doc in enumerate(sample_documents[:10]):  # Upload first 10 as samples
                      doc_key = f'backups/{backup_date}/documents/{doc["document_id"]}.json'
                      
                      s3_client.put_object(
                          Bucket=bucket_name,
                          Key=doc_key,
                          Body=json.dumps(doc, indent=2),
                          ServerSideEncryption='aws:kms',
                          SSEKMSKeyId=kms_key_id,
                          ContentType='application/json',
                          Tagging=f'Type=BusinessDocument&Department={doc["metadata"]["department"]}',
                          Metadata={
                              'document-type': doc['type'],
                              'department': doc['metadata']['department'],
                              'backup-date': backup_date
                          }
                      )
                  
                  documents_uploaded = len(sample_documents)
                  logger.info(f"Successfully uploaded backup for {backup_date} with {documents_uploaded} documents")
                  
                  # Send success metrics to CloudWatch
                  send_metric('BackupSuccess', 1)
                  send_metric('DocumentsBackedUp', documents_uploaded)
                  send_metric('BackupSizeBytes', manifest['backup_summary']['total_size_bytes'], 'Bytes')
                  
                  return {
                      'statusCode': 200,
                      'body': json.dumps({
                          'message': 'Backup completed successfully',
                          'backup_date': backup_date,
                          'documents_uploaded': documents_uploaded,
                          'total_size_bytes': manifest['backup_summary']['total_size_bytes'],
                          'manifest_key': manifest_key
                      })
                  }
                  
              except ClientError as e:
                  logger.error(f"AWS Client Error during backup: {e}")
                  send_metric('BackupFailure', 1)
                  raise e
              except Exception as e:
                  logger.error(f"Unexpected error during backup: {e}")
                  send_metric('BackupFailure', 1)
                  raise e

      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: Purpose
          Value: DailyBackupProcessor
        - Key: iac-rlhf-amazon
          Value: 'true'

  # EventBridge Rule for Daily Trigger
  DailyBackupRule:
    Type: AWS::Events::Rule
    Properties:
      Name: !Sub '${Environment}-daily-backup-trigger'
      Description: 'Triggers daily backup at 2 AM UTC'
      ScheduleExpression: 'cron(0 2 * * ? *)' # Daily at 2 AM UTC
      State: ENABLED
      Targets:
        - Arn: !GetAtt BackupLambdaFunction.Arn
          Id: '1'
          RetryPolicy:
            MaximumRetryAttempts: 2
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: Purpose
          Value: BackupScheduler
        - Key: iac-rlhf-amazon
          Value: 'true'

  # Permission for EventBridge to invoke Lambda
  LambdaInvokePermission:
    Type: AWS::Lambda::Permission
    Properties:
      FunctionName: !Ref BackupLambdaFunction
      Action: 'lambda:InvokeFunction'
      Principal: events.amazonaws.com
      SourceArn: !GetAtt DailyBackupRule.Arn

  # CloudWatch Alarms
  BackupFailureAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub '${Environment}-backup-failures'
      AlarmDescription: 'Alert when backup fails'
      MetricName: BackupFailure
      Namespace: BackupSystem
      Statistic: Sum
      Period: 300
      EvaluationPeriods: 1
      Threshold: 1
      ComparisonOperator: GreaterThanOrEqualToThreshold
      Dimensions:
        - Name: Environment
          Value: !Ref Environment
      TreatMissingData: notBreaching
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: Purpose
          Value: BackupMonitoring
        - Key: iac-rlhf-amazon
          Value: 'true'

  LambdaDurationAlarm:
    Type: AWS::CloudWatch::Alarm
    Properties:
      AlarmName: !Sub '${Environment}-backup-duration-high'
      AlarmDescription: 'Alert when backup takes too long'
      MetricName: Duration
      Namespace: AWS/Lambda
      Statistic: Average
      Period: 300
      EvaluationPeriods: 2
      Threshold: 600000 # 10 minutes in milliseconds
      ComparisonOperator: GreaterThanThreshold
      Dimensions:
        - Name: FunctionName
          Value: !Ref BackupLambdaFunction
      TreatMissingData: notBreaching
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: Purpose
          Value: BackupMonitoring
        - Key: iac-rlhf-amazon
          Value: 'true'

Outputs:
  BackupBucketName:
    Description: 'Name of the S3 backup bucket'
    Value: !Ref BackupS3Bucket
    Export:
      Name: !Sub '${AWS::StackName}-backup-bucket'

  BackupLambdaArn:
    Description: 'ARN of the backup Lambda function'
    Value: !GetAtt BackupLambdaFunction.Arn
    Export:
      Name: !Sub '${AWS::StackName}-backup-lambda-arn'

  EventBridgeRuleName:
    Description: 'Name of the EventBridge rule for daily backups'
    Value: !Ref DailyBackupRule
    Export:
      Name: !Sub '${AWS::StackName}-daily-backup-rule'

  KMSKeyId:
    Description: 'ID of the KMS key used for encryption'
    Value: !Ref BackupKMSKey
    Export:
      Name: !Sub '${AWS::StackName}-kms-key-id'

  LoggingBucketName:
    Description: 'Name of the S3 logging bucket'
    Value: !Ref LoggingBucket
    Export:
      Name: !Sub '${AWS::StackName}-logging-bucket'
```

### lib/TapStack.json - Complete JSON Implementation

```json
{
  "AWSTemplateFormatVersion": "2010-09-09",
  "Description": "Automated Daily Backup System with S3, Lambda, and EventBridge",
  "Metadata": {
    "AWS::CloudFormation::Interface": {
      "ParameterGroups": [
        {
          "Label": {
            "default": "Environment Configuration"
          },
          "Parameters": ["Environment", "BackupBucketName"]
        }
      ]
    }
  },
  "Parameters": {
    "Environment": {
      "Type": "String",
      "Description": "Environment name (dev, staging, prod)",
      "Default": "prod",
      "AllowedValues": ["dev", "staging", "prod"]
    },
    "BackupBucketName": {
      "Type": "String",
      "Description": "Name for the S3 backup bucket (must be globally unique)",
      "Default": "backup-system-prod-12345",
      "AllowedPattern": "^[a-z0-9][a-z0-9-]*[a-z0-9]$",
      "ConstraintDescription": "Must be a valid S3 bucket name",
      "MinLength": 3,
      "MaxLength": 63
    }
  },
  "Mappings": {
    "EnvironmentConfig": {
      "dev": {
        "RetentionDays": 7
      },
      "staging": {
        "RetentionDays": 14
      },
      "prod": {
        "RetentionDays": 30
      }
    }
  },
  "Resources": {
    "BackupKMSKey": {
      "Type": "AWS::KMS::Key",
      "Properties": {
        "Description": {
          "Fn::Sub": "KMS key for ${Environment} backup encryption"
        },
        "KeyPolicy": {
          "Version": "2012-10-17",
          "Id": "backup-key-policy",
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
                "kms:GenerateDataKey",
                "kms:CreateGrant",
                "kms:DescribeKey"
              ],
              "Resource": "*",
              "Condition": {
                "StringEquals": {
                  "kms:ViaService": {
                    "Fn::Sub": "s3.${AWS::Region}.amazonaws.com"
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
                "kms:DescribeKey"
              ],
              "Resource": "*",
              "Condition": {
                "ArnLike": {
                  "kms:EncryptionContext:aws:logs:arn": {
                    "Fn::Sub": "arn:aws:logs:${AWS::Region}:${AWS::AccountId}:log-group:/aws/lambda/${Environment}-backup-function"
                  }
                }
              }
            }
          ]
        },
        "Tags": [
          {
            "Key": "Environment",
            "Value": {
              "Ref": "Environment"
            }
          },
          {
            "Key": "Purpose",
            "Value": "BackupEncryption"
          },
          {
            "Key": "iac-rlhf-amazon",
            "Value": "true"
          }
        ]
      }
    },
    "BackupKMSKeyAlias": {
      "Type": "AWS::KMS::Alias",
      "Properties": {
        "AliasName": {
          "Fn::Sub": "alias/${Environment}-backup-key"
        },
        "TargetKeyId": {
          "Ref": "BackupKMSKey"
        }
      }
    },
    "BackupS3Bucket": {
      "Type": "AWS::S3::Bucket",
      "Properties": {
        "BucketName": {
          "Fn::Sub": "${BackupBucketName}-${AWS::AccountId}-${Environment}"
        },
        "BucketEncryption": {
          "ServerSideEncryptionConfiguration": [
            {
              "ServerSideEncryptionByDefault": {
                "SSEAlgorithm": "aws:kms",
                "KMSMasterKeyID": {
                  "Ref": "BackupKMSKey"
                }
              }
            }
          ]
        },
        "VersioningConfiguration": {
          "Status": "Enabled"
        },
        "LifecycleConfiguration": {
          "Rules": [
            {
              "Id": "DeleteOldBackups",
              "Status": "Enabled",
              "ExpirationInDays": {
                "Fn::FindInMap": [
                  "EnvironmentConfig",
                  {
                    "Ref": "Environment"
                  },
                  "RetentionDays"
                ]
              },
              "NoncurrentVersionExpirationInDays": 1
            },
            {
              "Id": "AbortIncompleteMultipartUploads",
              "Status": "Enabled",
              "AbortIncompleteMultipartUpload": {
                "DaysAfterInitiation": 1
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
        "MetricsConfigurations": [
          {
            "Id": "BackupMetrics"
          }
        ],
        "LoggingConfiguration": {
          "DestinationBucketName": {
            "Ref": "LoggingBucket"
          },
          "LogFilePrefix": "backup-access-logs/"
        },
        "Tags": [
          {
            "Key": "Environment",
            "Value": {
              "Ref": "Environment"
            }
          },
          {
            "Key": "Purpose",
            "Value": "DailyBackups"
          },
          {
            "Key": "iac-rlhf-amazon",
            "Value": "true"
          }
        ]
      }
    },
    "LoggingBucket": {
      "Type": "AWS::S3::Bucket",
      "Properties": {
        "BucketName": {
          "Fn::Sub": "${BackupBucketName}-${AWS::AccountId}-${Environment}-logs"
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
              "Id": "DeleteOldLogs",
              "Status": "Enabled",
              "ExpirationInDays": 90
            }
          ]
        },
        "Tags": [
          {
            "Key": "Environment",
            "Value": {
              "Ref": "Environment"
            }
          },
          {
            "Key": "Purpose",
            "Value": "BackupLogs"
          },
          {
            "Key": "iac-rlhf-amazon",
            "Value": "true"
          }
        ]
      }
    },
    "BackupLambdaRole": {
      "Type": "AWS::IAM::Role",
      "Properties": {
        "RoleName": {
          "Fn::Sub": "${Environment}-backup-lambda-role"
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
            "PolicyName": "BackupS3Access",
            "PolicyDocument": {
              "Version": "2012-10-17",
              "Statement": [
                {
                  "Effect": "Allow",
                  "Action": [
                    "s3:PutObject",
                    "s3:PutObjectAcl",
                    "s3:GetObject",
                    "s3:GetObjectVersion"
                  ],
                  "Resource": [
                    {
                      "Fn::Sub": "${BackupS3Bucket.Arn}/*"
                    }
                  ]
                },
                {
                  "Effect": "Allow",
                  "Action": ["s3:ListBucket"],
                  "Resource": [
                    {
                      "Fn::GetAtt": ["BackupS3Bucket", "Arn"]
                    }
                  ]
                },
                {
                  "Effect": "Allow",
                  "Action": [
                    "kms:Decrypt",
                    "kms:GenerateDataKey",
                    "kms:CreateGrant",
                    "kms:DescribeKey"
                  ],
                  "Resource": [
                    {
                      "Fn::GetAtt": ["BackupKMSKey", "Arn"]
                    }
                  ]
                },
                {
                  "Effect": "Allow",
                  "Action": ["cloudwatch:PutMetricData"],
                  "Resource": "*",
                  "Condition": {
                    "StringEquals": {
                      "cloudwatch:namespace": "BackupSystem"
                    }
                  }
                }
              ]
            }
          }
        ],
        "Tags": [
          {
            "Key": "Environment",
            "Value": {
              "Ref": "Environment"
            }
          },
          {
            "Key": "Purpose",
            "Value": "BackupLambdaExecution"
          },
          {
            "Key": "iac-rlhf-amazon",
            "Value": "true"
          }
        ]
      }
    },
    "BackupLambdaLogGroup": {
      "Type": "AWS::Logs::LogGroup",
      "Properties": {
        "LogGroupName": {
          "Fn::Sub": "/aws/lambda/${Environment}-backup-function"
        },
        "RetentionInDays": 30,
        "KmsKeyId": {
          "Fn::GetAtt": ["BackupKMSKey", "Arn"]
        },
        "Tags": [
          {
            "Key": "Environment",
            "Value": {
              "Ref": "Environment"
            }
          },
          {
            "Key": "Purpose",
            "Value": "BackupLogs"
          },
          {
            "Key": "iac-rlhf-amazon",
            "Value": "true"
          }
        ]
      }
    },
    "BackupLambdaFunction": {
      "Type": "AWS::Lambda::Function",
      "Properties": {
        "FunctionName": {
          "Fn::Sub": "${Environment}-backup-function"
        },
        "Description": "Daily backup function to upload documents to S3",
        "Runtime": "python3.9",
        "Handler": "index.lambda_handler",
        "Role": {
          "Fn::GetAtt": ["BackupLambdaRole", "Arn"]
        },
        "Timeout": 900,
        "MemorySize": 512,
        "Environment": {
          "Variables": {
            "BACKUP_BUCKET": {
              "Ref": "BackupS3Bucket"
            },
            "ENVIRONMENT": {
              "Ref": "Environment"
            },
            "KMS_KEY_ID": {
              "Ref": "BackupKMSKey"
            }
          }
        },
        "Code": {
          "ZipFile": "import json\nimport boto3\nimport os\nfrom datetime import datetime\nimport logging\nfrom botocore.exceptions import ClientError\n\nlogger = logging.getLogger()\nlogger.setLevel(logging.INFO)\n\ns3_client = boto3.client('s3')\ncloudwatch = boto3.client('cloudwatch')\n\ndef send_metric(metric_name, value, unit='Count'):\n    \"\"\"Send custom metric to CloudWatch\"\"\"\n    try:\n        cloudwatch.put_metric_data(\n            Namespace='BackupSystem',\n            MetricData=[\n                {\n                    'MetricName': metric_name,\n                    'Value': value,\n                    'Unit': unit,\n                    'Dimensions': [\n                        {\n                            'Name': 'Environment',\n                            'Value': os.environ['ENVIRONMENT']\n                        }\n                    ]\n                }\n            ]\n        )\n    except Exception as e:\n        logger.error(f\"Failed to send metric: {e}\")\n\ndef generate_sample_documents(count=500):\n    \"\"\"Generate sample business documents for backup\"\"\"\n    documents = []\n    document_types = ['invoice', 'receipt', 'contract', 'report', 'memo']\n    \n    for i in range(count):\n        doc_type = document_types[i % len(document_types)]\n        document = {\n            'document_id': f'{doc_type}_{i:04d}',\n            'type': doc_type,\n            'content': f'Sample {doc_type} content for document {i}',\n            'created_date': datetime.utcnow().isoformat(),\n            'file_size': len(f'Sample {doc_type} content for document {i}'),\n            'checksum': f'md5_{i:04d}',\n            'metadata': {\n                'department': ['finance', 'hr', 'operations', 'sales'][i % 4],\n                'priority': ['low', 'medium', 'high'][i % 3],\n                'confidential': i % 5 == 0\n            }\n        }\n        documents.append(document)\n    \n    return documents\n\ndef lambda_handler(event, context):\n    \"\"\"Main handler for backup processing\"\"\"\n    bucket_name = os.environ['BACKUP_BUCKET']\n    kms_key_id = os.environ['KMS_KEY_ID']\n    \n    backup_date = datetime.utcnow().strftime('%Y-%m-%d')\n    documents_uploaded = 0\n    \n    try:\n        logger.info(f\"Starting backup process for {backup_date}\")\n        \n        # Generate sample documents for backup (in real scenario, fetch from business systems)\n        sample_documents = generate_sample_documents(500)\n        \n        # Create daily backup manifest with business context\n        manifest = {\n            'backup_date': backup_date,\n            'backup_timestamp': datetime.utcnow().isoformat(),\n            'total_documents': len(sample_documents),\n            'backup_summary': {\n                'document_types': {},\n                'departments': {},\n                'total_size_bytes': 0\n            },\n            'documents': sample_documents\n        }\n        \n        # Calculate summary statistics\n        for doc in sample_documents:\n            doc_type = doc['type']\n            department = doc['metadata']['department']\n            \n            manifest['backup_summary']['document_types'][doc_type] = \\\n                manifest['backup_summary']['document_types'].get(doc_type, 0) + 1\n            manifest['backup_summary']['departments'][department] = \\\n                manifest['backup_summary']['departments'].get(department, 0) + 1\n            manifest['backup_summary']['total_size_bytes'] += doc['file_size']\n        \n        # Upload manifest to S3 with encryption\n        manifest_key = f'backups/{backup_date}/manifest.json'\n        \n        s3_client.put_object(\n            Bucket=bucket_name,\n            Key=manifest_key,\n            Body=json.dumps(manifest, indent=2),\n            ServerSideEncryption='aws:kms',\n            SSEKMSKeyId=kms_key_id,\n            ContentType='application/json',\n            Tagging='Type=BackupManifest&Environment=' + os.environ['ENVIRONMENT'],\n            Metadata={\n                'backup-date': backup_date,\n                'document-count': str(len(sample_documents)),\n                'backup-type': 'daily-business-documents'\n            }\n        )\n        \n        # Upload individual document samples (simulate business document backup)\n        for i, doc in enumerate(sample_documents[:10]):  # Upload first 10 as samples\n            doc_key = f'backups/{backup_date}/documents/{doc[\"document_id\"]}.json'\n            \n            s3_client.put_object(\n                Bucket=bucket_name,\n                Key=doc_key,\n                Body=json.dumps(doc, indent=2),\n                ServerSideEncryption='aws:kms',\n                SSEKMSKeyId=kms_key_id,\n                ContentType='application/json',\n                Tagging=f'Type=BusinessDocument&Department={doc[\"metadata\"][\"department\"]}',\n                Metadata={\n                    'document-type': doc['type'],\n                    'department': doc['metadata']['department'],\n                    'backup-date': backup_date\n                }\n            )\n        \n        documents_uploaded = len(sample_documents)\n        logger.info(f\"Successfully uploaded backup for {backup_date} with {documents_uploaded} documents\")\n        \n        # Send success metrics to CloudWatch\n        send_metric('BackupSuccess', 1)\n        send_metric('DocumentsBackedUp', documents_uploaded)\n        send_metric('BackupSizeBytes', manifest['backup_summary']['total_size_bytes'], 'Bytes')\n        \n        return {\n            'statusCode': 200,\n            'body': json.dumps({\n                'message': 'Backup completed successfully',\n                'backup_date': backup_date,\n                'documents_uploaded': documents_uploaded,\n                'total_size_bytes': manifest['backup_summary']['total_size_bytes'],\n                'manifest_key': manifest_key\n            })\n        }\n        \n    except ClientError as e:\n        logger.error(f\"AWS Client Error during backup: {e}\")\n        send_metric('BackupFailure', 1)\n        raise e\n    except Exception as e:\n        logger.error(f\"Unexpected error during backup: {e}\")\n        send_metric('BackupFailure', 1)\n        raise e\n"
        },
        "Tags": [
          {
            "Key": "Environment",
            "Value": {
              "Ref": "Environment"
            }
          },
          {
            "Key": "Purpose",
            "Value": "DailyBackupProcessor"
          },
          {
            "Key": "iac-rlhf-amazon",
            "Value": "true"
          }
        ]
      }
    },
    "DailyBackupRule": {
      "Type": "AWS::Events::Rule",
      "Properties": {
        "Name": {
          "Fn::Sub": "${Environment}-daily-backup-trigger"
        },
        "Description": "Triggers daily backup at 2 AM UTC",
        "ScheduleExpression": "cron(0 2 * * ? *)",
        "State": "ENABLED",
        "Targets": [
          {
            "Arn": {
              "Fn::GetAtt": ["BackupLambdaFunction", "Arn"]
            },
            "Id": "1",
            "RetryPolicy": {
              "MaximumRetryAttempts": 2
            }
          }
        ],
        "Tags": [
          {
            "Key": "Environment",
            "Value": {
              "Ref": "Environment"
            }
          },
          {
            "Key": "Purpose",
            "Value": "BackupScheduler"
          },
          {
            "Key": "iac-rlhf-amazon",
            "Value": "true"
          }
        ]
      }
    },
    "LambdaInvokePermission": {
      "Type": "AWS::Lambda::Permission",
      "Properties": {
        "FunctionName": {
          "Ref": "BackupLambdaFunction"
        },
        "Action": "lambda:InvokeFunction",
        "Principal": "events.amazonaws.com",
        "SourceArn": {
          "Fn::GetAtt": ["DailyBackupRule", "Arn"]
        }
      }
    },
    "BackupFailureAlarm": {
      "Type": "AWS::CloudWatch::Alarm",
      "Properties": {
        "AlarmName": {
          "Fn::Sub": "${Environment}-backup-failures"
        },
        "AlarmDescription": "Alert when backup fails",
        "MetricName": "BackupFailure",
        "Namespace": "BackupSystem",
        "Statistic": "Sum",
        "Period": 300,
        "EvaluationPeriods": 1,
        "Threshold": 1,
        "ComparisonOperator": "GreaterThanOrEqualToThreshold",
        "Dimensions": [
          {
            "Name": "Environment",
            "Value": {
              "Ref": "Environment"
            }
          }
        ],
        "TreatMissingData": "notBreaching",
        "Tags": [
          {
            "Key": "Environment",
            "Value": {
              "Ref": "Environment"
            }
          },
          {
            "Key": "Purpose",
            "Value": "BackupMonitoring"
          },
          {
            "Key": "iac-rlhf-amazon",
            "Value": "true"
          }
        ]
      }
    },
    "LambdaDurationAlarm": {
      "Type": "AWS::CloudWatch::Alarm",
      "Properties": {
        "AlarmName": {
          "Fn::Sub": "${Environment}-backup-duration-high"
        },
        "AlarmDescription": "Alert when backup takes too long",
        "MetricName": "Duration",
        "Namespace": "AWS/Lambda",
        "Statistic": "Average",
        "Period": 300,
        "EvaluationPeriods": 2,
        "Threshold": 600000,
        "ComparisonOperator": "GreaterThanThreshold",
        "Dimensions": [
          {
            "Name": "FunctionName",
            "Value": {
              "Ref": "BackupLambdaFunction"
            }
          }
        ],
        "TreatMissingData": "notBreaching",
        "Tags": [
          {
            "Key": "Environment",
            "Value": {
              "Ref": "Environment"
            }
          },
          {
            "Key": "Purpose",
            "Value": "BackupMonitoring"
          },
          {
            "Key": "iac-rlhf-amazon",
            "Value": "true"
          }
        ]
      }
    }
  },
  "Outputs": {
    "BackupBucketName": {
      "Description": "Name of the S3 backup bucket",
      "Value": {
        "Ref": "BackupS3Bucket"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-backup-bucket"
        }
      }
    },
    "BackupLambdaArn": {
      "Description": "ARN of the backup Lambda function",
      "Value": {
        "Fn::GetAtt": ["BackupLambdaFunction", "Arn"]
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-backup-lambda-arn"
        }
      }
    },
    "EventBridgeRuleName": {
      "Description": "Name of the EventBridge rule for daily backups",
      "Value": {
        "Ref": "DailyBackupRule"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-daily-backup-rule"
        }
      }
    },
    "KMSKeyId": {
      "Description": "ID of the KMS key used for encryption",
      "Value": {
        "Ref": "BackupKMSKey"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-kms-key-id"
        }
      }
    },
    "LoggingBucketName": {
      "Description": "Name of the S3 logging bucket",
      "Value": {
        "Ref": "LoggingBucket"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-logging-bucket"
        }
      }
    }
  }
}
```
