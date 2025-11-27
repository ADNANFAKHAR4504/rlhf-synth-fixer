# TAP Stack - Task Assignment Platform CloudFormation Template

This CloudFormation template implements the Turn Around Prompt (TAP) stack for the Task Assignment Platform. The solution creates a DynamoDB table for storing task assignments and related data.

## Architecture Overview

The template creates a simple but robust infrastructure with:

- DynamoDB table with pay-per-request billing for cost optimization
- Environment-specific resource naming for multi-environment deployments
- Proper deletion protection and lifecycle management

## File: lib/TapStack.json

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
        "Fn::GetAtt": ["TurnAroundPromptTable", "Arn"]
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

## Deployment Instructions

1. Deploy the CloudFormation stack using the AWS CLI or Console:

   ```bash
   aws cloudformation deploy \
     --template-file lib/TapStack.json \
     --stack-name tap-stack-dev \
     --parameter-overrides EnvironmentSuffix=dev
   ```

2. The stack will create a DynamoDB table with the following outputs:
   - `TurnAroundPromptTableName`: The name of the DynamoDB table
   - `TurnAroundPromptTableArn`: The ARN of the DynamoDB table
   - `StackName`: The CloudFormation stack name
   - `EnvironmentSuffix`: The environment suffix used

## Resource Naming Convention

All resources follow the naming pattern: `TurnAroundPromptTable-{EnvironmentSuffix}`

This ensures uniqueness across multiple deployments and environments.

## Cost Optimization

- Uses DynamoDB pay-per-request billing mode for cost efficiency
- No provisioned throughput - scales automatically with usage
- Minimal resource footprint with single DynamoDB table
