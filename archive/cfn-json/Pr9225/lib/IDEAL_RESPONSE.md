# Infrastructure Template Validation System - CloudFormation Implementation

## Architecture Overview

This solution implements an automated infrastructure validation system using serverless AWS services. The architecture follows event-driven patterns and security best practices:

1. **S3 Bucket** - Stores CloudFormation templates to be analyzed
2. **EventBridge Rule** - Automatically detects new template uploads
3. **Lambda Function** - Validates templates against security best practices
4. **DynamoDB Table** - Persists validation results with queryable schema
5. **CloudWatch Logs** - Captures execution logs for monitoring and debugging
6. **IAM Roles** - Enforces least-privilege access controls

## AWS Services Used

- **Amazon S3**: Template storage with versioning and encryption enabled
- **Amazon EventBridge**: Event-driven automation triggering validation on S3 uploads
- **AWS Lambda**: Serverless compute running Python 3.12 validation logic
- **Amazon DynamoDB**: NoSQL database storing validation findings with point-in-time recovery
- **Amazon CloudWatch**: Log aggregation with 30-day retention
- **AWS IAM**: Security controls with specific, non-wildcard permissions

## Security Considerations

1. **IAM Least Privilege**: Lambda execution role has explicit permissions only - no wildcard actions
2. **S3 Security**: Bucket configured with encryption at rest (AES256), versioning enabled, and public access blocked
3. **DynamoDB Protection**: Point-in-time recovery enabled, deletion protection disabled for testing
4. **Network Isolation**: Lambda runs in AWS-managed VPC with automatic security updates
5. **Audit Trail**: All actions logged to CloudWatch for compliance tracking

## Lambda Validation Logic

The Lambda function implements real security validation:
- Parses CloudFormation JSON/YAML templates from S3
- Checks for wildcard IAM actions (Action: "*")
- Validates S3 bucket public access settings
- Detects security groups with overly permissive rules (0.0.0.0/0)
- Identifies resources with deletion protection disabled
- Stores structured findings in DynamoDB with severity levels

## How to Deploy

1. **Prerequisites**:
   - AWS CLI configured with appropriate credentials
   - Permissions to create IAM roles, Lambda functions, S3 buckets, DynamoDB tables, EventBridge rules

2. **Deploy Stack**:
   ```bash
   aws cloudformation create-stack \
     --stack-name template-validation-dev \
     --template-body file://template.json \
     --parameters ParameterKey=EnvironmentSuffix,ParameterValue=dev \
     --capabilities CAPABILITY_IAM \
     --region us-east-1
   ```

3. **Monitor Deployment**:
   ```bash
   aws cloudformation describe-stacks \
     --stack-name template-validation-dev \
     --region us-east-1 \
     --query 'Stacks[0].StackStatus'
   ```

4. **Retrieve Outputs**:
   ```bash
   aws cloudformation describe-stacks \
     --stack-name template-validation-dev \
     --region us-east-1 \
     --query 'Stacks[0].Outputs'
   ```

## How to Test

1. **Upload a Test Template**:
   ```bash
   # Get S3 bucket name from stack outputs
   BUCKET_NAME=$(aws cloudformation describe-stacks \
     --stack-name template-validation-dev \
     --query 'Stacks[0].Outputs[?OutputKey==`TemplateBucketName`].OutputValue' \
     --output text)

   # Upload a CloudFormation template
   aws s3 cp test-template.json s3://${BUCKET_NAME}/test-template.json
   ```

2. **Check Lambda Logs**:
   ```bash
   aws logs tail /aws/lambda/template-validator-dev --follow
   ```

3. **Query Validation Results**:
   ```bash
   # Get DynamoDB table name from stack outputs
   TABLE_NAME=$(aws cloudformation describe-stacks \
     --stack-name template-validation-dev \
     --query 'Stacks[0].Outputs[?OutputKey==`ResultsTableName`].OutputValue' \
     --output text)

   # Scan results
   aws dynamodb scan --table-name ${TABLE_NAME}
   ```

4. **Expected Results**:
   - Lambda function executes automatically when template is uploaded
   - Validation findings stored in DynamoDB with TemplateId and Timestamp
   - CloudWatch Logs show detailed execution trace

## Cleanup

To delete all resources:
```bash
# Empty S3 bucket first (versioned bucket requirement)
aws s3 rm s3://${BUCKET_NAME} --recursive

# Delete stack
aws cloudformation delete-stack \
  --stack-name template-validation-dev \
  --region us-east-1
```

All resources are configured for clean deletion - no manual intervention required.

---

## CloudFormation Template

```json
{
  "AWSTemplateFormatVersion": "2010-09-09",
  "Description": "Infrastructure Template Validation System - Automated security and compliance validation for CloudFormation templates",
  "Parameters": {
    "EnvironmentSuffix": {
      "Type": "String",
      "Default": "dev",
      "Description": "Environment suffix for resource naming (e.g., dev, staging, prod)",
      "AllowedPattern": "^[a-z0-9-]+$",
      "ConstraintDescription": "Must contain only lowercase letters, numbers, and hyphens"
    }
  },
  "Resources": {
    "TemplateBucket": {
      "Type": "AWS::S3::Bucket",
      "Properties": {
        "BucketName": {
          "Fn::Sub": "template-validation-bucket-${EnvironmentSuffix}-${AWS::AccountId}"
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
        },
        "PublicAccessBlockConfiguration": {
          "BlockPublicAcls": true,
          "BlockPublicPolicy": true,
          "IgnorePublicAcls": true,
          "RestrictPublicBuckets": true
        },
        "NotificationConfiguration": {
          "EventBridgeConfiguration": {
            "EventBridgeEnabled": true
          }
        }
      }
    },
    "ResultsTable": {
      "Type": "AWS::DynamoDB::Table",
      "Properties": {
        "TableName": {
          "Fn::Sub": "template-validation-results-${EnvironmentSuffix}"
        },
        "AttributeDefinitions": [
          {
            "AttributeName": "TemplateId",
            "AttributeType": "S"
          },
          {
            "AttributeName": "Timestamp",
            "AttributeType": "S"
          }
        ],
        "KeySchema": [
          {
            "AttributeName": "TemplateId",
            "KeyType": "HASH"
          },
          {
            "AttributeName": "Timestamp",
            "KeyType": "RANGE"
          }
        ],
        "BillingMode": "PAY_PER_REQUEST",
        "DeletionProtectionEnabled": false,
        "PointInTimeRecoverySpecification": {
          "PointInTimeRecoveryEnabled": true
        }
      }
    },
    "ValidatorLogGroup": {
      "Type": "AWS::Logs::LogGroup",
      "Properties": {
        "LogGroupName": {
          "Fn::Sub": "/aws/lambda/template-validator-${EnvironmentSuffix}"
        },
        "RetentionInDays": 30
      }
    },
    "ValidatorRole": {
      "Type": "AWS::IAM::Role",
      "Properties": {
        "RoleName": {
          "Fn::Sub": "template-validator-role-${EnvironmentSuffix}"
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
            "PolicyName": "S3ReadAccess",
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
                    "Fn::Sub": "${TemplateBucket.Arn}/*"
                  }
                }
              ]
            }
          },
          {
            "PolicyName": "DynamoDBWriteAccess",
            "PolicyDocument": {
              "Version": "2012-10-17",
              "Statement": [
                {
                  "Effect": "Allow",
                  "Action": [
                    "dynamodb:PutItem",
                    "dynamodb:UpdateItem"
                  ],
                  "Resource": {
                    "Fn::GetAtt": [
                      "ResultsTable",
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
    "ValidatorFunction": {
      "Type": "AWS::Lambda::Function",
      "DependsOn": "ValidatorLogGroup",
      "Properties": {
        "FunctionName": {
          "Fn::Sub": "template-validator-${EnvironmentSuffix}"
        },
        "Runtime": "python3.12",
        "Handler": "index.handler",
        "Role": {
          "Fn::GetAtt": [
            "ValidatorRole",
            "Arn"
          ]
        },
        "Timeout": 300,
        "MemorySize": 512,
        "Environment": {
          "Variables": {
            "RESULTS_TABLE_NAME": {
              "Ref": "ResultsTable"
            }
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
                "from datetime import datetime",
                "from urllib.parse import unquote_plus",
                "",
                "s3 = boto3.client('s3')",
                "dynamodb = boto3.resource('dynamodb')",
                "table = dynamodb.Table(os.environ['RESULTS_TABLE_NAME'])",
                "",
                "def handler(event, context):",
                "    \"\"\"",
                "    Validates CloudFormation templates for security issues.",
                "    Triggered by S3 PutObject events via EventBridge.",
                "    \"\"\"",
                "    try:",
                "        # Extract S3 event details",
                "        detail = event.get('detail', {})",
                "        bucket_name = detail.get('bucket', {}).get('name')",
                "        object_key = unquote_plus(detail.get('object', {}).get('key', ''))",
                "        ",
                "        print(f'Processing template: s3://{bucket_name}/{object_key}')",
                "        ",
                "        # Download template from S3",
                "        response = s3.get_object(Bucket=bucket_name, Key=object_key)",
                "        template_content = response['Body'].read().decode('utf-8')",
                "        ",
                "        # Parse template",
                "        try:",
                "            template = json.loads(template_content)",
                "        except json.JSONDecodeError:",
                "            # Try YAML if JSON fails",
                "            import yaml",
                "            template = yaml.safe_load(template_content)",
                "        ",
                "        # Validate template",
                "        findings = validate_template(template, object_key)",
                "        ",
                "        # Store results in DynamoDB",
                "        timestamp = datetime.utcnow().isoformat()",
                "        table.put_item(",
                "            Item={",
                "                'TemplateId': object_key,",
                "                'Timestamp': timestamp,",
                "                'BucketName': bucket_name,",
                "                'TotalFindings': len(findings),",
                "                'CriticalFindings': sum(1 for f in findings if f['Severity'] == 'CRITICAL'),",
                "                'HighFindings': sum(1 for f in findings if f['Severity'] == 'HIGH'),",
                "                'MediumFindings': sum(1 for f in findings if f['Severity'] == 'MEDIUM'),",
                "                'LowFindings': sum(1 for f in findings if f['Severity'] == 'LOW'),",
                "                'Findings': findings,",
                "                'Status': 'COMPLETED'",
                "            }",
                "        )",
                "        ",
                "        print(f'Validation complete: {len(findings)} findings')",
                "        ",
                "        return {",
                "            'statusCode': 200,",
                "            'body': json.dumps({",
                "                'message': 'Template validated successfully',",
                "                'templateId': object_key,",
                "                'findingsCount': len(findings)",
                "            })",
                "        }",
                "    ",
                "    except Exception as e:",
                "        print(f'Error processing template: {str(e)}')",
                "        # Store error in DynamoDB",
                "        try:",
                "            timestamp = datetime.utcnow().isoformat()",
                "            table.put_item(",
                "                Item={",
                "                    'TemplateId': object_key if 'object_key' in locals() else 'unknown',",
                "                    'Timestamp': timestamp,",
                "                    'Status': 'FAILED',",
                "                    'ErrorMessage': str(e)",
                "                }",
                "            )",
                "        except:",
                "            pass",
                "        ",
                "        return {",
                "            'statusCode': 500,",
                "            'body': json.dumps({'error': str(e)})",
                "        }",
                "",
                "def validate_template(template, template_id):",
                "    \"\"\"",
                "    Validates CloudFormation template for security issues.",
                "    Returns list of findings with severity levels.",
                "    \"\"\"",
                "    findings = []",
                "    resources = template.get('Resources', {})",
                "    ",
                "    for resource_name, resource_config in resources.items():",
                "        resource_type = resource_config.get('Type', '')",
                "        properties = resource_config.get('Properties', {})",
                "        ",
                "        # Check IAM policies for wildcard actions",
                "        if resource_type in ['AWS::IAM::Role', 'AWS::IAM::Policy', 'AWS::IAM::ManagedPolicy']:",
                "            findings.extend(check_iam_wildcards(resource_name, resource_config))",
                "        ",
                "        # Check S3 buckets for public access",
                "        if resource_type == 'AWS::S3::Bucket':",
                "            findings.extend(check_s3_public_access(resource_name, properties))",
                "        ",
                "        # Check Security Groups for overly permissive rules",
                "        if resource_type == 'AWS::EC2::SecurityGroup':",
                "            findings.extend(check_security_group_rules(resource_name, properties))",
                "        ",
                "        # Check DynamoDB deletion protection",
                "        if resource_type == 'AWS::DynamoDB::Table':",
                "            findings.extend(check_dynamodb_protection(resource_name, properties))",
                "        ",
                "        # Check RDS encryption",
                "        if resource_type == 'AWS::RDS::DBInstance':",
                "            findings.extend(check_rds_encryption(resource_name, properties))",
                "    ",
                "    return findings",
                "",
                "def check_iam_wildcards(resource_name, resource_config):",
                "    \"\"\"Check for wildcard IAM actions\"\"\"",
                "    findings = []",
                "    properties = resource_config.get('Properties', {})",
                "    ",
                "    # Check inline policies",
                "    policies = properties.get('Policies', [])",
                "    for policy in policies:",
                "        policy_doc = policy.get('PolicyDocument', {})",
                "        statements = policy_doc.get('Statement', [])",
                "        if isinstance(statements, dict):",
                "            statements = [statements]",
                "        ",
                "        for stmt in statements:",
                "            actions = stmt.get('Action', [])",
                "            if isinstance(actions, str):",
                "                actions = [actions]",
                "            ",
                "            if '*' in actions or any('*' in action for action in actions):",
                "                findings.append({",
                "                    'ResourceName': resource_name,",
                "                    'ResourceType': resource_config.get('Type'),",
                "                    'Severity': 'CRITICAL',",
                "                    'Finding': 'Wildcard IAM action detected',",
                "                    'Description': f'Policy contains wildcard action: {actions}',",
                "                    'Recommendation': 'Replace wildcard actions with specific permissions'",
                "                })",
                "    ",
                "    return findings",
                "",
                "def check_s3_public_access(resource_name, properties):",
                "    \"\"\"Check S3 bucket for public access configuration\"\"\"",
                "    findings = []",
                "    ",
                "    # Check PublicAccessBlockConfiguration",
                "    public_access_block = properties.get('PublicAccessBlockConfiguration', {})",
                "    if not public_access_block:",
                "        findings.append({",
                "            'ResourceName': resource_name,",
                "            'ResourceType': 'AWS::S3::Bucket',",
                "            'Severity': 'HIGH',",
                "            'Finding': 'Public access block not configured',",
                "            'Description': 'S3 bucket does not have PublicAccessBlockConfiguration',",
                "            'Recommendation': 'Enable all public access block settings'",
                "        })",
                "    else:",
                "        if not public_access_block.get('BlockPublicAcls', False):",
                "            findings.append({",
                "                'ResourceName': resource_name,",
                "                'ResourceType': 'AWS::S3::Bucket',",
                "                'Severity': 'HIGH',",
                "                'Finding': 'BlockPublicAcls not enabled',",
                "                'Description': 'S3 bucket allows public ACLs',",
                "                'Recommendation': 'Set BlockPublicAcls to true'",
                "            })",
                "    ",
                "    # Check encryption",
                "    if 'BucketEncryption' not in properties:",
                "        findings.append({",
                "            'ResourceName': resource_name,",
                "            'ResourceType': 'AWS::S3::Bucket',",
                "            'Severity': 'MEDIUM',",
                "            'Finding': 'Encryption not configured',",
                "            'Description': 'S3 bucket does not have encryption at rest',",
                "            'Recommendation': 'Enable bucket encryption with AES256 or KMS'",
                "        })",
                "    ",
                "    return findings",
                "",
                "def check_security_group_rules(resource_name, properties):",
                "    \"\"\"Check for overly permissive security group rules\"\"\"",
                "    findings = []",
                "    ",
                "    ingress_rules = properties.get('SecurityGroupIngress', [])",
                "    for rule in ingress_rules:",
                "        cidr = rule.get('CidrIp', '')",
                "        if cidr == '0.0.0.0/0':",
                "            findings.append({",
                "                'ResourceName': resource_name,",
                "                'ResourceType': 'AWS::EC2::SecurityGroup',",
                "                'Severity': 'HIGH',",
                "                'Finding': 'Overly permissive ingress rule',",
                "                'Description': f'Security group allows ingress from 0.0.0.0/0 on port {rule.get(\"FromPort\")}',",
                "                'Recommendation': 'Restrict ingress to specific IP ranges'",
                "            })",
                "    ",
                "    return findings",
                "",
                "def check_dynamodb_protection(resource_name, properties):",
                "    \"\"\"Check DynamoDB deletion protection\"\"\"",
                "    findings = []",
                "    ",
                "    if not properties.get('DeletionProtectionEnabled', False):",
                "        findings.append({",
                "            'ResourceName': resource_name,",
                "            'ResourceType': 'AWS::DynamoDB::Table',",
                "            'Severity': 'LOW',",
                "            'Finding': 'Deletion protection not enabled',",
                "            'Description': 'DynamoDB table does not have deletion protection',",
                "            'Recommendation': 'Enable deletion protection for production tables'",
                "        })",
                "    ",
                "    return findings",
                "",
                "def check_rds_encryption(resource_name, properties):",
                "    \"\"\"Check RDS instance encryption\"\"\"",
                "    findings = []",
                "    ",
                "    if not properties.get('StorageEncrypted', False):",
                "        findings.append({",
                "            'ResourceName': resource_name,",
                "            'ResourceType': 'AWS::RDS::DBInstance',",
                "            'Severity': 'HIGH',",
                "            'Finding': 'Storage encryption not enabled',",
                "            'Description': 'RDS instance does not have storage encryption',",
                "            'Recommendation': 'Enable storage encryption with KMS'",
                "        })",
                "    ",
                "    return findings"
              ]
            ]
          }
        }
      }
    },
    "EventBridgeInvokePermission": {
      "Type": "AWS::Lambda::Permission",
      "Properties": {
        "FunctionName": {
          "Ref": "ValidatorFunction"
        },
        "Action": "lambda:InvokeFunction",
        "Principal": "events.amazonaws.com",
        "SourceArn": {
          "Fn::GetAtt": [
            "ValidationTriggerRule",
            "Arn"
          ]
        }
      }
    },
    "ValidationTriggerRule": {
      "Type": "AWS::Events::Rule",
      "Properties": {
        "Name": {
          "Fn::Sub": "template-validation-trigger-${EnvironmentSuffix}"
        },
        "Description": "Triggers Lambda validation when CloudFormation templates are uploaded to S3",
        "State": "ENABLED",
        "EventPattern": {
          "source": [
            "aws.s3"
          ],
          "detail-type": [
            "Object Created"
          ],
          "detail": {
            "bucket": {
              "name": [
                {
                  "Ref": "TemplateBucket"
                }
              ]
            }
          }
        },
        "Targets": [
          {
            "Arn": {
              "Fn::GetAtt": [
                "ValidatorFunction",
                "Arn"
              ]
            },
            "Id": "TemplateValidatorTarget"
          }
        ]
      }
    }
  },
  "Outputs": {
    "ValidatorFunctionArn": {
      "Description": "ARN of the Lambda function that validates templates",
      "Value": {
        "Fn::GetAtt": [
          "ValidatorFunction",
          "Arn"
        ]
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-ValidatorFunctionArn"
        }
      }
    },
    "ResultsTableName": {
      "Description": "Name of the DynamoDB table storing validation results",
      "Value": {
        "Ref": "ResultsTable"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-ResultsTableName"
        }
      }
    },
    "TemplateBucketName": {
      "Description": "Name of the S3 bucket for template uploads",
      "Value": {
        "Ref": "TemplateBucket"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-TemplateBucketName"
        }
      }
    },
    "TemplateBucketArn": {
      "Description": "ARN of the S3 bucket for template uploads",
      "Value": {
        "Fn::GetAtt": [
          "TemplateBucket",
          "Arn"
        ]
      }
    }
  }
}
```
