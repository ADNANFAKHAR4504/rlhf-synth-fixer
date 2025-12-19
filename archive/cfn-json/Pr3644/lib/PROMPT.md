I need help building a parking management system infrastructure in AWS us-west-2 region. I already have a CloudFormation template started (TapStack.json) that I need you to update with the parking system components.

Here's what I need to build:

**Core Requirements:**
- API Gateway for the parking booking API
- Lambda function using Node.js 18 runtime for handling reservation logic
- DynamoDB table for storing parking spots and bookings, with a GSI (Global Secondary Index) for efficient queries by facility and time ranges
- EventBridge rule for automated booking reminders
- SNS topic for sending booking confirmations to users
- SES configuration for emailing parking receipts
- IoT Core setup for integrating with parking gate systems (entry/exit control)
- CloudWatch metrics/dashboard for tracking parking facility occupancy
- S3 bucket for storing parking facility images
- Proper IAM roles to ensure secure access between all services

**Important Constraints:**
1. Use DynamoDB with GSI for efficient facility and time-range queries
2. Implement IoT Core for parking gate access control
3. Configure EventBridge for automated booking reminders
4. Send confirmations via SNS and receipts via SES
5. Track facility occupancy in CloudWatch
6. Implement conflict prevention logic to avoid double bookings

**Critical Requirements - Please Follow Strictly:**
- This needs to work across different AWS accounts without any modifications
- NO hardcoded values - no account IDs, ARNs, or region names hardcoded anywhere
- Use parameters, intrinsic functions, or pseudo parameters instead
- Tag ALL resources with: `iac-rlhf-amazon`
- The Lambda function should have real-world parking reservation logic, not just a hello world example
- Make it production-ready even if simplified

**IMPORTANT - Existing File:**
I already have a file `lib/TapStack.json` with this content:

```json
{
  "AWSTemplateFormatVersion": "2010-09-09",
  "Description": "TAP Stack - Task Assignment Platform CloudFormation Template",
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
        "DeletionProtectionEnabled": false
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
        "Fn::GetAtt": [
          "TurnAroundPromptTable",
          "Arn"
        ]
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-TurnAroundPromptTableArn"
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

**STRICT INSTRUCTION:**
You MUST update the existing `lib/TapStack.json` file above. Do NOT create a new stack or new files. Update the existing template by adding the parking management resources to it. Keep the existing DynamoDB table and add the new parking system resources alongside it. Make sure to maintain the same structure and formatting style.

Can you help me update this CloudFormation template with all the parking management system components?
