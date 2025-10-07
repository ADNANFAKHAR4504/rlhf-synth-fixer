# Task: Update CloudFormation Stack for News Aggregator

I need help updating my existing CloudFormation template to build a news aggregator application. I already have a basic stack with a DynamoDB table, but I need to expand it significantly.

## Current Stack

Here's my existing CloudFormation template (lib/TapStack.json):

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

## What I Need

I want to transform this into a complete news aggregator platform deployed in **us-east-2** region. Here's what needs to be added to the existing stack:

### Frontend & Distribution
- **S3 Bucket**: For hosting the static frontend files (HTML, CSS, JavaScript)
- **CloudFront Distribution**: To serve the frontend globally with low latency and cache API responses

### Backend API
- **API Gateway**: REST API for the backend endpoints that the frontend will call
- **Lambda Functions**: Using Node.js 18 runtime for:
  - Content aggregation from various news sources
  - Handling user preference updates
  - Serving personalized content feeds

### Data Storage
- **DynamoDB Tables**:
  - Articles table to store aggregated news articles
  - User preferences table to store user settings and interests
  - Keep the existing TurnAroundPromptTable

### Content Processing
- **EventBridge Scheduled Rules**: To trigger content fetching at regular intervals (every hour or so)
- **Amazon Comprehend**: Integrate for automatic content categorization and sentiment analysis
- **Amazon Personalize**: For generating personalized article recommendations based on user preferences

### Monitoring & Security
- **CloudWatch**: Logs and metrics for monitoring the application
- **IAM Roles and Policies**: Proper service roles for Lambda to access DynamoDB, Comprehend, Personalize, etc.

## Important Constraints

1. Schedule content fetching with EventBridge rules
2. Use Comprehend for automatic categorization of articles
3. Implement Personalize for creating personalized news feeds
4. Store user preferences in DynamoDB
5. Cache API responses in CloudFront for better performance

## Critical Instructions

**IMPORTANT**: Please update the existing `lib/TapStack.json` file. Do NOT create new stacks or new files. I want all these resources added to my current CloudFormation template while preserving the existing DynamoDB table and the EnvironmentSuffix parameter structure.

Make sure all resource names use the EnvironmentSuffix parameter for proper naming (like the existing table does). Also, ensure proper exports in the Outputs section for any resources that might be referenced elsewhere.

The deployment should be ready for us-east-2 region, and all IAM permissions should follow the principle of least privilege.

Please provide the complete updated CloudFormation template in JSON format.
