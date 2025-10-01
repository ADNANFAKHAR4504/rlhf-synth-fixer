### Reasoning Trace

---

The user is asking for a production-ready CloudFormation template for the TAP (Task Assignment Platform)
Stack. Let me break down the requirements:

1. **Core Infrastructure:**
   - DynamoDB table for storing turnaround prompts
   - Production-ready configuration with security and monitoring

2. **Security Requirements:**
   - Encryption at rest using AWS KMS
   - Proper IAM policies via key policies
   - Secure configuration following AWS Well-Architected Framework

3. **Production Features:**
   - CloudWatch monitoring with alarms
   - SNS notifications for operational alerts
   - CloudWatch dashboard for observability
   - DynamoDB Streams for data change tracking
   - TTL for automatic data cleanup
   - Point-in-time recovery (configurable)

4. **Template Requirements:**
   - JSON format CloudFormation
   - Parameterized for reusability across environments
   - No required parameters for easy deployment
   - Proper tagging strategy
   - Clean, maintainable structure
   - Deletable resources for testing/development

Let me create a focused, production-ready CloudFormation template specifically for the TAP Stack requirements.

### Answer

---

I'll create a production-ready CloudFormation template for the TAP Stack that focuses on the core
requirements while maintaining security, monitoring, and operational excellence.

## CloudFormation Template - TAP Stack

```json
{
  "AWSTemplateFormatVersion": "2010-09-09",
  "Description": "TAP Stack - Task Assignment Platform CloudFormation Template with security and monitoring",
  "Metadata": {
    "AWS::CloudFormation::Interface": {
      "ParameterGroups": [
        {
          "Label": {
            "default": "Environment Configuration"
          },
          "Parameters": ["EnvironmentSuffix", "ProjectName"]
        },
        {
          "Label": {
            "default": "Monitoring Configuration"
          },
          "Parameters": ["AlertEmail"]
        },
        {
          "Label": {
            "default": "DynamoDB Configuration"
          },
          "Parameters": [
            "DeletionProtectionEnabled",
            "PointInTimeRecoveryEnabled"
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
    },
    "ProjectName": {
      "Type": "String",
      "Default": "tap",
      "MinLength": 1,
      "MaxLength": 50,
      "AllowedPattern": "^[a-z0-9-]+$",
      "Description": "Project name (lowercase, alphanumeric and hyphens only)"
    },
    "AlertEmail": {
      "Type": "String",
      "Default": "",
      "Description": "Email address for CloudWatch alarm notifications (optional)"
    },
    "DeletionProtectionEnabled": {
      "Type": "String",
      "Default": "false",
      "AllowedValues": ["true", "false"],
      "Description": "Enable deletion protection for DynamoDB table"
    },
    "PointInTimeRecoveryEnabled": {
      "Type": "String",
      "Default": "false",
      "AllowedValues": ["true", "false"],
      "Description": "Enable point-in-time recovery for DynamoDB table"
    }
  },
  "Conditions": {
    "EnableDeletionProtection": {
      "Fn::Equals": [
        {
          "Ref": "DeletionProtectionEnabled"
        },
        "true"
      ]
    },
    "EnablePointInTimeRecovery": {
      "Fn::Equals": [
        {
          "Ref": "PointInTimeRecoveryEnabled"
        },
        "true"
      ]
    },
    "HasAlertEmail": {
      "Fn::Not": [
        {
          "Fn::Equals": [
            {
              "Ref": "AlertEmail"
            },
            ""
          ]
        }
      ]
    }
  },
  "Resources": {
    "KMSKey": {
      "Type": "AWS::KMS::Key",
      "Properties": {
        "Description": {
          "Fn::Sub": "KMS key for ${ProjectName}-${EnvironmentSuffix} TAP application"
        },
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
              "Sid": "Allow DynamoDB to use the key",
              "Effect": "Allow",
              "Principal": {
                "Service": "dynamodb.amazonaws.com"
              },
              "Action": ["kms:Decrypt", "kms:DescribeKey", "kms:CreateGrant"],
              "Resource": "*"
            },
            {
              "Sid": "Allow SNS to use the key",
              "Effect": "Allow",
              "Principal": {
                "Service": "sns.amazonaws.com"
              },
              "Action": ["kms:Decrypt", "kms:GenerateDataKey"],
              "Resource": "*"
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
            "Key": "Project",
            "Value": {
              "Ref": "ProjectName"
            }
          },
          {
            "Key": "ManagedBy",
            "Value": "CloudFormation"
          }
        ]
      }
    },
    "KMSKeyAlias": {
      "Type": "AWS::KMS::Alias",
      "Properties": {
        "AliasName": {
          "Fn::Sub": "alias/${ProjectName}-${EnvironmentSuffix}"
        },
        "TargetKeyId": {
          "Ref": "KMSKey"
        }
      }
    },
    "TurnAroundPromptTable": {
      "Type": "AWS::DynamoDB::Table",
      "DeletionPolicy": "Delete",
      "UpdateReplacePolicy": "Delete",
      "Properties": {
        "TableName": {
          "Fn::Sub": "TurnAroundPromptTable${EnvironmentSuffix}"
        },
        "AttributeDefinitions": [
          {
            "AttributeName": "id",
            "AttributeType": "S"
          }
        ],
        "KeySchema": [
          {
            "AttributeName": "id",
            "KeyType": "HASH"
          }
        ],
        "BillingMode": "PAY_PER_REQUEST",
        "DeletionProtectionEnabled": {
          "Fn::If": ["EnableDeletionProtection", true, false]
        },
        "SSESpecification": {
          "SSEEnabled": true,
          "SSEType": "KMS",
          "KMSMasterKeyId": {
            "Ref": "KMSKey"
          }
        },
        "PointInTimeRecoverySpecification": {
          "PointInTimeRecoveryEnabled": {
            "Fn::If": ["EnablePointInTimeRecovery", true, false]
          }
        },
        "StreamSpecification": {
          "StreamViewType": "NEW_AND_OLD_IMAGES"
        },
        "TimeToLiveSpecification": {
          "AttributeName": "ttl",
          "Enabled": true
        },
        "Tags": [
          {
            "Key": "Environment",
            "Value": {
              "Ref": "EnvironmentSuffix"
            }
          },
          {
            "Key": "Project",
            "Value": {
              "Ref": "ProjectName"
            }
          },
          {
            "Key": "ManagedBy",
            "Value": "CloudFormation"
          }
        ]
      }
    },
    "SNSTopic": {
      "Type": "AWS::SNS::Topic",
      "Properties": {
        "TopicName": {
          "Fn::Sub": "${ProjectName}-${EnvironmentSuffix}-alerts"
        },
        "DisplayName": {
          "Fn::Sub": "${ProjectName} ${EnvironmentSuffix} Alerts"
        },
        "KmsMasterKeyId": {
          "Ref": "KMSKey"
        },
        "Subscription": {
          "Fn::If": [
            "HasAlertEmail",
            [
              {
                "Endpoint": {
                  "Ref": "AlertEmail"
                },
                "Protocol": "email"
              }
            ],
            {
              "Ref": "AWS::NoValue"
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
            "Key": "Project",
            "Value": {
              "Ref": "ProjectName"
            }
          },
          {
            "Key": "ManagedBy",
            "Value": "CloudFormation"
          }
        ]
      }
    },
    "DynamoDBThrottleAlarm": {
      "Type": "AWS::CloudWatch::Alarm",
      "Properties": {
        "AlarmName": {
          "Fn::Sub": "${ProjectName}-${EnvironmentSuffix}-dynamodb-throttles"
        },
        "AlarmDescription": "Alarm when DynamoDB throttles exceed threshold",
        "MetricName": "UserErrors",
        "Namespace": "AWS/DynamoDB",
        "Statistic": "Sum",
        "Period": 300,
        "EvaluationPeriods": 2,
        "Threshold": 10,
        "ComparisonOperator": "GreaterThanThreshold",
        "Dimensions": [
          {
            "Name": "TableName",
            "Value": {
              "Ref": "TurnAroundPromptTable"
            }
          }
        ],
        "AlarmActions": [
          {
            "Ref": "SNSTopic"
          }
        ],
        "TreatMissingData": "notBreaching"
      }
    },
    "DynamoDBSystemErrorAlarm": {
      "Type": "AWS::CloudWatch::Alarm",
      "Properties": {
        "AlarmName": {
          "Fn::Sub": "${ProjectName}-${EnvironmentSuffix}-dynamodb-system-errors"
        },
        "AlarmDescription": "Alarm when DynamoDB system errors occur",
        "MetricName": "SystemErrors",
        "Namespace": "AWS/DynamoDB",
        "Statistic": "Sum",
        "Period": 300,
        "EvaluationPeriods": 1,
        "Threshold": 5,
        "ComparisonOperator": "GreaterThanThreshold",
        "Dimensions": [
          {
            "Name": "TableName",
            "Value": {
              "Ref": "TurnAroundPromptTable"
            }
          }
        ],
        "AlarmActions": [
          {
            "Ref": "SNSTopic"
          }
        ],
        "TreatMissingData": "notBreaching"
      }
    },
    "DynamoDBReadThrottleAlarm": {
      "Type": "AWS::CloudWatch::Alarm",
      "Properties": {
        "AlarmName": {
          "Fn::Sub": "${ProjectName}-${EnvironmentSuffix}-dynamodb-read-throttle"
        },
        "AlarmDescription": "Alarm when DynamoDB read throttles occur",
        "MetricName": "ReadThrottleEvents",
        "Namespace": "AWS/DynamoDB",
        "Statistic": "Sum",
        "Period": 300,
        "EvaluationPeriods": 2,
        "Threshold": 10,
        "ComparisonOperator": "GreaterThanThreshold",
        "Dimensions": [
          {
            "Name": "TableName",
            "Value": {
              "Ref": "TurnAroundPromptTable"
            }
          }
        ],
        "AlarmActions": [
          {
            "Ref": "SNSTopic"
          }
        ],
        "TreatMissingData": "notBreaching"
      }
    },
    "DynamoDBWriteThrottleAlarm": {
      "Type": "AWS::CloudWatch::Alarm",
      "Properties": {
        "AlarmName": {
          "Fn::Sub": "${ProjectName}-${EnvironmentSuffix}-dynamodb-write-throttle"
        },
        "AlarmDescription": "Alarm when DynamoDB write throttles occur",
        "MetricName": "WriteThrottleEvents",
        "Namespace": "AWS/DynamoDB",
        "Statistic": "Sum",
        "Period": 300,
        "EvaluationPeriods": 2,
        "Threshold": 10,
        "ComparisonOperator": "GreaterThanThreshold",
        "Dimensions": [
          {
            "Name": "TableName",
            "Value": {
              "Ref": "TurnAroundPromptTable"
            }
          }
        ],
        "AlarmActions": [
          {
            "Ref": "SNSTopic"
          }
        ],
        "TreatMissingData": "notBreaching"
      }
    },
    "CloudWatchDashboard": {
      "Type": "AWS::CloudWatch::Dashboard",
      "Properties": {
        "DashboardName": {
          "Fn::Sub": "${ProjectName}-${EnvironmentSuffix}-dashboard"
        },
        "DashboardBody": {
          "Fn::Sub": "{\n  \"widgets\": [\n    {\n      \"type\": \"metric\",\n      \"properties\": {\n        \"metrics\": [\n          [\"AWS/DynamoDB\", \"ConsumedReadCapacityUnits\", {\"stat\": \"Sum\", \"label\": \"Read Capacity\"}],\n          [\".\", \"ConsumedWriteCapacityUnits\", {\"stat\": \"Sum\", \"label\": \"Write Capacity\"}]\n        ],\n        \"view\": \"timeSeries\",\n        \"stacked\": false,\n        \"region\": \"${AWS::Region}\",\n        \"title\": \"DynamoDB Capacity Units\",\n        \"period\": 300,\n        \"dimensions\": {\n          \"TableName\": \"${TurnAroundPromptTable}\"\n        }\n      }\n    },\n    {\n      \"type\": \"metric\",\n      \"properties\": {\n        \"metrics\": [\n          [\"AWS/DynamoDB\", \"UserErrors\", {\"stat\": \"Sum\", \"label\": \"User Errors\"}],\n          [\".\", \"SystemErrors\", {\"stat\": \"Sum\", \"label\": \"System Errors\"}]\n        ],\n        \"view\": \"timeSeries\",\n        \"stacked\": false,\n        \"region\": \"${AWS::Region}\",\n        \"title\": \"DynamoDB Errors\",\n        \"period\": 300,\n        \"dimensions\": {\n          \"TableName\": \"${TurnAroundPromptTable}\"\n        }\n      }\n    },\n    {\n      \"type\": \"metric\",\n      \"properties\": {\n        \"metrics\": [\n          [\"AWS/DynamoDB\", \"ReadThrottleEvents\", {\"stat\": \"Sum\", \"label\": \"Read Throttles\"}],\n          [\".\", \"WriteThrottleEvents\", {\"stat\": \"Sum\", \"label\": \"Write Throttles\"}]\n        ],\n        \"view\": \"timeSeries\",\n        \"stacked\": false,\n        \"region\": \"${AWS::Region}\",\n        \"title\": \"DynamoDB Throttle Events\",\n        \"period\": 300,\n        \"dimensions\": {\n          \"TableName\": \"${TurnAroundPromptTable}\"\n        }\n      }\n    },\n    {\n      \"type\": \"metric\",\n      \"properties\": {\n        \"metrics\": [\n          [\"AWS/DynamoDB\", \"SuccessfulRequestLatency\", {\"stat\": \"Average\", \"label\": \"Avg Latency\"}],\n          [\".\", \".\", {\"stat\": \"Maximum\", \"label\": \"Max Latency\"}]\n        ],\n        \"view\": \"timeSeries\",\n        \"stacked\": false,\n        \"region\": \"${AWS::Region}\",\n        \"title\": \"DynamoDB Latency\",\n        \"period\": 300,\n        \"dimensions\": {\n          \"TableName\": \"${TurnAroundPromptTable}\"\n        },\n        \"yAxis\": {\n          \"left\": {\n            \"min\": 0\n          }\n        }\n      }\n    }\n  ]\n}"
        }
      }
    }
  },
  "Outputs": {
    "TurnAroundPromptTableName": {
      "Description": "Name of the DynamoDB table",
      "Value": {
        "Ref": "TurnAroundPromptTable"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-TurnAroundPromptTableName"
        }
      }
    },
    "TurnAroundPromptTableArn": {
      "Description": "ARN of the DynamoDB table",
      "Value": {
        "Fn::GetAtt": ["TurnAroundPromptTable", "Arn"]
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-TurnAroundPromptTableArn"
        }
      }
    },
    "TurnAroundPromptTableStreamArn": {
      "Description": "Stream ARN of the DynamoDB table",
      "Value": {
        "Fn::GetAtt": ["TurnAroundPromptTable", "StreamArn"]
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-TurnAroundPromptTableStreamArn"
        }
      }
    },
    "KMSKeyId": {
      "Description": "KMS Key ID for encryption",
      "Value": {
        "Ref": "KMSKey"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-KMSKeyId"
        }
      }
    },
    "KMSKeyArn": {
      "Description": "KMS Key ARN for encryption",
      "Value": {
        "Fn::GetAtt": ["KMSKey", "Arn"]
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-KMSKeyArn"
        }
      }
    },
    "SNSTopicArn": {
      "Description": "SNS Topic ARN for alerts",
      "Value": {
        "Ref": "SNSTopic"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-SNSTopicArn"
        }
      }
    },
    "DashboardURL": {
      "Description": "CloudWatch Dashboard URL",
      "Value": {
        "Fn::Sub": "https://console.aws.amazon.com/cloudwatch/home?region=${AWS::Region}#dashboards:name=${ProjectName}-${EnvironmentSuffix}-dashboard"
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

## Deployment Instructions

### 1. **Validate the Template**

```bash
# CloudFormation validation
aws cloudformation validate-template \
  --template-body file://lib/TapStack.json \
  --region us-east-1

# CFN-Lint validation (optional)
cfn-lint lib/TapStack.json
```

### 2. **Create Stack (Minimal)**

```bash
aws cloudformation deploy \
  --template-file lib/TapStack.json \
  --stack-name TapStackdev \
  --capabilities CAPABILITY_IAM \
  --region us-east-1
```

### 3. **Create Stack (With Configuration)**

```bash
aws cloudformation deploy \
  --template-file lib/TapStack.json \
  --stack-name TapStackprod \
  --parameter-overrides \
    EnvironmentSuffix=prod \
    ProjectName=tap \
    AlertEmail=ops@example.com \
    PointInTimeRecoveryEnabled=true \
    DeletionProtectionEnabled=true \
  --capabilities CAPABILITY_IAM \
  --region us-east-1
```

### 4. **Update Stack** (for changes)

```bash
aws cloudformation deploy \
  --template-file lib/TapStack.json \
  --stack-name TapStackdev \
  --parameter-overrides \
    PointInTimeRecoveryEnabled=true \
  --capabilities CAPABILITY_IAM \
  --region us-east-1
```

## Key Features Implemented

### **Security**

- ✅ KMS encryption for DynamoDB using customer-managed keys
- ✅ Encrypted SNS topics for secure notifications
- ✅ Least privilege IAM policies via KMS key policies
- ✅ Proper resource tagging for governance and compliance

### **Production Readiness**

- ✅ CloudWatch monitoring with 4 comprehensive alarms
- ✅ CloudWatch dashboard for operational visibility
- ✅ DynamoDB Streams for real-time data processing
- ✅ Point-in-time recovery (configurable)
- ✅ TTL for automatic data lifecycle management
- ✅ Deletion protection (configurable)

### **Simplicity**

- ✅ Zero required parameters - deploy with defaults
- ✅ Focused design - no unnecessary complexity
- ✅ Single DynamoDB table with simple hash key schema
- ✅ On-demand billing eliminates capacity planning

### **Monitoring & Observability**

- ✅ DynamoDB user error monitoring (UserErrors metric)
- ✅ System error monitoring (SystemErrors metric)
- ✅ Read throttle monitoring (ReadThrottleEvents metric)
- ✅ Write throttle monitoring (WriteThrottleEvents metric)
- ✅ CloudWatch dashboard with 4 metric widgets
- ✅ Conditional email notifications via SNS

### **Best Practices**

- ✅ Parameterized template with sensible defaults
- ✅ Conditional resource creation (email subscription, PITR, deletion protection)
- ✅ Consistent naming conventions
- ✅ Comprehensive outputs for cross-stack integration
- ✅ Deletable resources for development environments
- ✅ Proper metadata for CloudFormation UI organization

## Real-World Usage Examples

### Python Example

```python
import boto3
import uuid
from datetime import datetime, timedelta

# Get table name from CloudFormation outputs
cfn = boto3.client('cloudformation', region_name='us-east-1')
response = cfn.describe_stacks(StackName='TapStackdev')
outputs = {o['OutputKey']: o['OutputValue'] for o in response['Stacks'][0]['Outputs']}

dynamodb = boto3.resource('dynamodb', region_name='us-east-1')
table = dynamodb.Table(outputs['TurnAroundPromptTableName'])

# Create turnaround prompt
def create_prompt(prompt_text, task_type, priority='medium'):
    prompt_id = str(uuid.uuid4())
    ttl_timestamp = int((datetime.now() + timedelta(days=30)).timestamp())

    item = {
        'id': prompt_id,
        'prompt_text': prompt_text,
        'task_type': task_type,
        'priority': priority,
        'status': 'pending',
        'created_at': datetime.now().isoformat(),
        'ttl': ttl_timestamp
    }

    table.put_item(Item=item)
    return prompt_id

# Example usage
prompt_id = create_prompt(
    'Review the following code for security vulnerabilities',
    'code_review',
    'high'
)
print(f"Created prompt: {prompt_id}")
```

### Node.js/TypeScript Example

```javascript
const {
  CloudFormationClient,
  DescribeStacksCommand,
} = require('@aws-sdk/client-cloudformation');
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand } = require('@aws-sdk/lib-dynamodb');

const region = 'us-east-1';
const cfnClient = new CloudFormationClient({ region });
const client = new DynamoDBClient({ region });
const docClient = DynamoDBDocumentClient.from(client);

// Get table name from CloudFormation
async function getTableName() {
  const response = await cfnClient.send(
    new DescribeStacksCommand({ StackName: 'TapStackdev' })
  );
  const outputs = response.Stacks[0].Outputs;
  return outputs.find(o => o.OutputKey === 'TurnAroundPromptTableName')
    .OutputValue;
}

// Create and manage prompts
async function createPrompt(promptText, taskType, priority = 'medium') {
  const tableName = await getTableName();
  const promptId = crypto.randomUUID();

  await docClient.send(
    new PutCommand({
      TableName: tableName,
      Item: {
        id: promptId,
        prompt_text: promptText,
        task_type: taskType,
        priority,
        status: 'pending',
        created_at: new Date().toISOString(),
        ttl: Math.floor(Date.now() / 1000) + 86400 * 30,
      },
    })
  );

  return promptId;
}

// Usage
createPrompt('Analyze system performance metrics', 'analysis', 'high').then(
  id => console.log(`Created prompt: ${id}`)
);
```

This CloudFormation template provides a clean, focused, production-ready TAP Stack that eliminates
complexity while maintaining enterprise-grade security, monitoring, and operational excellence.
The template is designed to be deployed immediately with sensible defaults while offering full
configurability for production environments.
