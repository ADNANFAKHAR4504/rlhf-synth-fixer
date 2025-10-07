# Document Automation System - CloudFormation Implementation

Hey, I need help updating my existing CloudFormation template to build out a comprehensive document automation system. I already have a basic stack set up with a DynamoDB table, and I need you to extend it with all the required AWS services.

## What I Need

I'm building a document automation platform that needs to handle document generation, processing, approval workflows, and analytics. The system should be deployed in `us-east-1` region.

Here's what needs to be added to my existing stack:

### Core Services
- **API Gateway** - REST API for document generation requests
- **Lambda Functions** - Using Node.js 22 runtime for template processing and merging documents
- **S3 Buckets** - Separate buckets for templates and generated documents, both with versioning enabled
- **DynamoDB** - Already have one table, but need additional tables for document metadata and complete audit trails
- **Step Functions** - State machine to handle multi-party approval workflows

### Document Processing
- **Textract** - For document verification and analysis
- **Comprehend** - Automated clause extraction and analysis
- **Translate** - Multi-language document generation support

### Notifications & Delivery
- **SNS** - For sending signature requests
- **SES** - Email delivery of documents

### Monitoring & Analytics
- **CloudWatch** - Track document processing metrics and logs
- **EventBridge** - Set up rules for compliance deadline monitoring and reminders
- **Athena** - Query and analyze document usage patterns

### Security
- **KMS** - Encryption keys for all documents at rest
- **IAM Roles** - Proper least-privilege roles with document-level permissions for each service

## Important Requirements

1. **Template Versioning**: S3 buckets must have versioning enabled with proper metadata tracking
2. **Dynamic Generation**: Lambda functions should support dynamic document generation from templates
3. **Approval Workflows**: Step Functions should support multi-party approval processes
4. **Document Verification**: Integrate Textract for automated document verification
5. **Clause Analysis**: Use Comprehend for intelligent clause extraction
6. **Multi-language**: Translate integration for generating documents in multiple languages
7. **Encryption**: All documents must be encrypted using KMS
8. **Audit Trail**: Complete audit trail stored in DynamoDB with timestamp and user tracking
9. **Compliance Monitoring**: EventBridge rules to monitor compliance deadlines
10. **Analytics**: Athena workgroup configured for document usage analytics

## Existing Stack Code

Here's my current CloudFormation template that you need to update:

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

## Critical Instructions

**PLEASE UPDATE THE EXISTING CODE ABOVE - DO NOT CREATE NEW STACKS OR FILES**

I need you to:
1. Keep the existing DynamoDB table and all current resources
2. Add all the new services to this same template
3. Maintain the EnvironmentSuffix parameter pattern for all resource naming
4. Follow CloudFormation JSON best practices
5. Add proper outputs for all major resources created
6. Ensure all resources have appropriate DependsOn relationships where needed
7. Include inline Lambda function code where appropriate (for simple functions)
8. Set up proper IAM policies with least-privilege access

The final template should be production-ready with all services properly configured and integrated. Make sure everything uses the EnvironmentSuffix parameter so I can deploy multiple environments.

Thanks!
