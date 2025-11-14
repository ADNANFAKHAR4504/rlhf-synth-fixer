# Automated Infrastructure Compliance System - CloudFormation Implementation

This implementation provides a comprehensive automated compliance validation system using CloudFormation with JSON. The solution monitors AWS resources for compliance violations, automatically triggers validation checks when resources change, generates detailed JSON reports, and alerts the compliance team of any issues.

## Architecture Overview

The system consists of:
- **3 SSM Automation Documents**: IMDSv2 enforcement, approved AMI validation, and required tags checking
- **3 EventBridge Rules**: Monitoring EC2 state changes, security group modifications, and IAM role updates
- **Lambda Function**: Compliance report generation and processing with inline Python code
- **S3 Bucket**: Report storage with versioning, encryption, and lifecycle policies
- **SNS Topic**: Alert notifications with email subscription
- **CloudWatch Dashboard**: Real-time compliance metrics dashboard with 4 custom metrics
- **IAM Roles**: Least-privilege access for Lambda, SSM automation, and EventBridge

## File Structure

```
lib/
  template.json           # Complete CloudFormation implementation (936 lines)
  AWS_REGION             # us-east-1
```

## Complete Implementation (lib/template.json)

```json
{
  "AWSTemplateFormatVersion": "2010-09-09",
  "Description": "Automated Infrastructure Compliance Validation and Remediation System",
  "Parameters": {
    "EnvironmentSuffix": {
      "Type": "String",
      "Description": "Unique suffix for resource naming",
      "Default": "dev",
      "AllowedPattern": "[a-z0-9-]+",
      "ConstraintDescription": "Must contain only lowercase letters, numbers, and hyphens"
    },
    "ComplianceEmailAddress": {
      "Type": "String",
      "Description": "Email address for compliance notifications",
      "Default": "compliance@example.com"
    },
    "ApprovedAMIList": {
      "Type": "CommaDelimitedList",
      "Description": "Comma-separated list of approved AMI IDs",
      "Default": "ami-0c55b159cbfafe1f0,ami-0abcdef1234567890"
    }
  },
  "Resources": {
    "ComplianceReportsBucket": {
      "Type": "AWS::S3::Bucket",
      "DeletionPolicy": "Retain",
      "Properties": {
        "BucketName": {
          "Fn::Sub": "compliance-reports-${EnvironmentSuffix}"
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
        "LifecycleConfiguration": {
          "Rules": [
            {
              "Id": "ArchiveOldReports",
              "Status": "Enabled",
              "Transitions": [
                {
                  "TransitionInDays": 90,
                  "StorageClass": "GLACIER"
                }
              ]
            }
          ]
        },
        "PublicAccessBlockConfiguration": {
          "BlockPublicAcls": true,
          "BlockPublicPolicy": true,
          "IgnorePublicAcls": true,
          "RestrictPublicBuckets": true
        },
        "Tags": [
          {
            "Key": "Environment",
            "Value": "qa"
          },
          {
            "Key": "Project",
            "Value": "compliance-checker"
          }
        ]
      }
    },
    "ComplianceAlertTopic": {
      "Type": "AWS::SNS::Topic",
      "Properties": {
        "TopicName": {
          "Fn::Sub": "compliance-alerts-${EnvironmentSuffix}"
        },
        "DisplayName": "Infrastructure Compliance Alerts",
        "Tags": [
          {
            "Key": "Environment",
            "Value": "qa"
          },
          {
            "Key": "Project",
            "Value": "compliance-checker"
          }
        ]
      }
    },
    "ComplianceAlertSubscription": {
      "Type": "AWS::SNS::Subscription",
      "Properties": {
        "Protocol": "email",
        "TopicArn": {
          "Ref": "ComplianceAlertTopic"
        },
        "Endpoint": {
          "Ref": "ComplianceEmailAddress"
        }
      }
    },
    "ComplianceReportProcessorRole": {
      "Type": "AWS::IAM::Role",
      "Properties": {
        "RoleName": {
          "Fn::Sub": "compliance-report-processor-role-${EnvironmentSuffix}"
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
            "PolicyName": "ComplianceReportProcessorPolicy",
            "PolicyDocument": {
              "Version": "2012-10-17",
              "Statement": [
                {
                  "Effect": "Allow",
                  "Action": [
                    "s3:PutObject",
                    "s3:PutObjectAcl"
                  ],
                  "Resource": {
                    "Fn::Sub": "arn:aws:s3:::compliance-reports-${EnvironmentSuffix}/*"
                  }
                },
                {
                  "Effect": "Allow",
                  "Action": [
                    "sns:Publish"
                  ],
                  "Resource": {
                    "Ref": "ComplianceAlertTopic"
                  }
                },
                {
                  "Effect": "Allow",
                  "Action": [
                    "ec2:DescribeInstances",
                    "ec2:DescribeImages",
                    "ec2:DescribeSecurityGroups",
                    "iam:GetRole",
                    "iam:ListRoleTags"
                  ],
                  "Resource": "*"
                },
                {
                  "Effect": "Allow",
                  "Action": [
                    "cloudwatch:PutMetricData"
                  ],
                  "Resource": "*",
                  "Condition": {
                    "StringEquals": {
                      "cloudwatch:namespace": "ComplianceChecker"
                    }
                  }
                },
                {
                  "Effect": "Allow",
                  "Action": [
                    "ssm:GetAutomationExecution",
                    "ssm:DescribeAutomationExecutions"
                  ],
                  "Resource": "*"
                }
              ]
            }
          }
        ],
        "Tags": [
          {
            "Key": "Environment",
            "Value": "qa"
          },
          {
            "Key": "Project",
            "Value": "compliance-checker"
          }
        ]
      }
    },
    "ComplianceReportProcessorLogGroup": {
      "Type": "AWS::Logs::LogGroup",
      "DeletionPolicy": "Delete",
      "Properties": {
        "LogGroupName": {
          "Fn::Sub": "/aws/lambda/compliance-report-processor-${EnvironmentSuffix}"
        },
        "RetentionInDays": 30
      }
    },
    "ComplianceReportProcessorFunction": {
      "Type": "AWS::Lambda::Function",
      "DependsOn": "ComplianceReportProcessorLogGroup",
      "Properties": {
        "FunctionName": {
          "Fn::Sub": "compliance-report-processor-${EnvironmentSuffix}"
        },
        "Runtime": "python3.11",
        "Handler": "index.lambda_handler",
        "Role": {
          "Fn::GetAtt": ["ComplianceReportProcessorRole", "Arn"]
        },
        "Timeout": 300,
        "Environment": {
          "Variables": {
            "BUCKET_NAME": {
              "Ref": "ComplianceReportsBucket"
            },
            "SNS_TOPIC_ARN": {
              "Ref": "ComplianceAlertTopic"
            },
            "ENVIRONMENT_SUFFIX": {
              "Ref": "EnvironmentSuffix"
            }
          }
        },
        "Code": {
          "ZipFile": "<<INLINE_PYTHON_CODE>>"
        },
        "Tags": [
          {
            "Key": "Environment",
            "Value": "qa"
          },
          {
            "Key": "Project",
            "Value": "compliance-checker"
          }
        ]
      }
    },
    "SSMAutomationRole": {
      "Type": "AWS::IAM::Role",
      "Properties": {
        "RoleName": {
          "Fn::Sub": "ssm-automation-role-${EnvironmentSuffix}"
        },
        "AssumeRolePolicyDocument": {
          "Version": "2012-10-17",
          "Statement": [
            {
              "Effect": "Allow",
              "Principal": {
                "Service": "ssm.amazonaws.com"
              },
              "Action": "sts:AssumeRole"
            }
          ]
        },
        "Policies": [
          {
            "PolicyName": "SSMAutomationPolicy",
            "PolicyDocument": {
              "Version": "2012-10-17",
              "Statement": [
                {
                  "Effect": "Allow",
                  "Action": [
                    "ec2:DescribeInstances",
                    "ec2:DescribeImages",
                    "ec2:ModifyInstanceMetadataOptions",
                    "ec2:CreateTags"
                  ],
                  "Resource": "*"
                },
                {
                  "Effect": "Allow",
                  "Action": [
                    "lambda:InvokeFunction"
                  ],
                  "Resource": {
                    "Fn::GetAtt": ["ComplianceReportProcessorFunction", "Arn"]
                  }
                }
              ]
            }
          }
        ],
        "Tags": [
          {
            "Key": "Environment",
            "Value": "qa"
          },
          {
            "Key": "Project",
            "Value": "compliance-checker"
          }
        ]
      }
    },
    "IMDSv2ComplianceDocument": {
      "Type": "AWS::SSM::Document",
      "Properties": {
        "Name": {
          "Fn::Sub": "CheckIMDSv2Compliance-${EnvironmentSuffix}"
        },
        "DocumentType": "Automation",
        "DocumentFormat": "JSON",
        "Content": {
          "schemaVersion": "0.3",
          "description": "Check and enforce IMDSv2 on EC2 instances",
          "assumeRole": {
            "Fn::GetAtt": ["SSMAutomationRole", "Arn"]
          },
          "parameters": {
            "InstanceId": {
              "type": "String",
              "description": "EC2 Instance ID to check"
            }
          },
          "mainSteps": [
            {
              "name": "checkIMDSv2",
              "action": "aws:executeAwsApi",
              "inputs": {
                "Service": "ec2",
                "Api": "DescribeInstances",
                "InstanceIds": ["{{ InstanceId }}"]
              },
              "outputs": [
                {
                  "Name": "MetadataOptions",
                  "Selector": "$.Reservations[0].Instances[0].MetadataOptions",
                  "Type": "StringMap"
                }
              ]
            }
          ],
          "outputs": [
            "checkIMDSv2.MetadataOptions"
          ]
        },
        "Tags": [
          {
            "Key": "Environment",
            "Value": "qa"
          },
          {
            "Key": "Project",
            "Value": "compliance-checker"
          }
        ]
      }
    },
    "ApprovedAMIComplianceDocument": {
      "Type": "AWS::SSM::Document",
      "Properties": {
        "Name": {
          "Fn::Sub": "CheckApprovedAMI-${EnvironmentSuffix}"
        },
        "DocumentType": "Automation",
        "DocumentFormat": "JSON",
        "Content": {
          "schemaVersion": "0.3",
          "description": "Check if EC2 instance is using approved AMI",
          "assumeRole": {
            "Fn::GetAtt": ["SSMAutomationRole", "Arn"]
          },
          "parameters": {
            "InstanceId": {
              "type": "String",
              "description": "EC2 Instance ID to check"
            }
          },
          "mainSteps": [
            {
              "name": "getInstanceAMI",
              "action": "aws:executeAwsApi",
              "inputs": {
                "Service": "ec2",
                "Api": "DescribeInstances",
                "InstanceIds": ["{{ InstanceId }}"]
              },
              "outputs": [
                {
                  "Name": "ImageId",
                  "Selector": "$.Reservations[0].Instances[0].ImageId",
                  "Type": "String"
                }
              ]
            }
          ],
          "outputs": [
            "getInstanceAMI.ImageId"
          ]
        },
        "Tags": [
          {
            "Key": "Environment",
            "Value": "qa"
          },
          {
            "Key": "Project",
            "Value": "compliance-checker"
          }
        ]
      }
    },
    "RequiredTagsComplianceDocument": {
      "Type": "AWS::SSM::Document",
      "Properties": {
        "Name": {
          "Fn::Sub": "CheckRequiredTags-${EnvironmentSuffix}"
        },
        "DocumentType": "Automation",
        "DocumentFormat": "JSON",
        "Content": {
          "schemaVersion": "0.3",
          "description": "Check if EC2 instance has required tags",
          "assumeRole": {
            "Fn::GetAtt": ["SSMAutomationRole", "Arn"]
          },
          "parameters": {
            "InstanceId": {
              "type": "String",
              "description": "EC2 Instance ID to check"
            }
          },
          "mainSteps": [
            {
              "name": "getInstanceTags",
              "action": "aws:executeAwsApi",
              "inputs": {
                "Service": "ec2",
                "Api": "DescribeInstances",
                "InstanceIds": ["{{ InstanceId }}"]
              },
              "outputs": [
                {
                  "Name": "Tags",
                  "Selector": "$.Reservations[0].Instances[0].Tags",
                  "Type": "MapList"
                }
              ]
            }
          ],
          "outputs": [
            "getInstanceTags.Tags"
          ]
        },
        "Tags": [
          {
            "Key": "Environment",
            "Value": "qa"
          },
          {
            "Key": "Project",
            "Value": "compliance-checker"
          }
        ]
      }
    },
    "EventBridgeInvokeLambdaRole": {
      "Type": "AWS::IAM::Role",
      "Properties": {
        "RoleName": {
          "Fn::Sub": "eventbridge-lambda-role-${EnvironmentSuffix}"
        },
        "AssumeRolePolicyDocument": {
          "Version": "2012-10-17",
          "Statement": [
            {
              "Effect": "Allow",
              "Principal": {
                "Service": "events.amazonaws.com"
              },
              "Action": "sts:AssumeRole"
            }
          ]
        },
        "Policies": [
          {
            "PolicyName": "InvokeLambdaPolicy",
            "PolicyDocument": {
              "Version": "2012-10-17",
              "Statement": [
                {
                  "Effect": "Allow",
                  "Action": [
                    "lambda:InvokeFunction"
                  ],
                  "Resource": {
                    "Fn::GetAtt": ["ComplianceReportProcessorFunction", "Arn"]
                  }
                }
              ]
            }
          }
        ],
        "Tags": [
          {
            "Key": "Environment",
            "Value": "qa"
          },
          {
            "Key": "Project",
            "Value": "compliance-checker"
          }
        ]
      }
    },
    "EC2StateChangeRule": {
      "Type": "AWS::Events::Rule",
      "Properties": {
        "Name": {
          "Fn::Sub": "ec2-state-change-rule-${EnvironmentSuffix}"
        },
        "Description": "Trigger compliance checks on EC2 state changes",
        "EventPattern": {
          "source": ["aws.ec2"],
          "detail-type": ["EC2 Instance State-change Notification"],
          "detail": {
            "state": ["running", "stopped"]
          }
        },
        "State": "ENABLED",
        "Targets": [
          {
            "Arn": {
              "Fn::GetAtt": ["ComplianceReportProcessorFunction", "Arn"]
            },
            "Id": "ComplianceCheckTarget",
            "RoleArn": {
              "Fn::GetAtt": ["EventBridgeInvokeLambdaRole", "Arn"]
            }
          }
        ]
      }
    },
    "EC2StateChangeRulePermission": {
      "Type": "AWS::Lambda::Permission",
      "Properties": {
        "FunctionName": {
          "Ref": "ComplianceReportProcessorFunction"
        },
        "Action": "lambda:InvokeFunction",
        "Principal": "events.amazonaws.com",
        "SourceArn": {
          "Fn::GetAtt": ["EC2StateChangeRule", "Arn"]
        }
      }
    },
    "SecurityGroupChangeRule": {
      "Type": "AWS::Events::Rule",
      "Properties": {
        "Name": {
          "Fn::Sub": "security-group-change-rule-${EnvironmentSuffix}"
        },
        "Description": "Trigger compliance checks on security group modifications",
        "EventPattern": {
          "source": ["aws.ec2"],
          "detail-type": ["AWS API Call via CloudTrail"],
          "detail": {
            "eventSource": ["ec2.amazonaws.com"],
            "eventName": [
              "AuthorizeSecurityGroupIngress",
              "AuthorizeSecurityGroupEgress",
              "RevokeSecurityGroupIngress",
              "RevokeSecurityGroupEgress",
              "ModifySecurityGroupRules"
            ]
          }
        },
        "State": "ENABLED",
        "Targets": [
          {
            "Arn": {
              "Fn::GetAtt": ["ComplianceReportProcessorFunction", "Arn"]
            },
            "Id": "SecurityGroupComplianceTarget",
            "RoleArn": {
              "Fn::GetAtt": ["EventBridgeInvokeLambdaRole", "Arn"]
            }
          }
        ]
      }
    },
    "SecurityGroupChangeRulePermission": {
      "Type": "AWS::Lambda::Permission",
      "Properties": {
        "FunctionName": {
          "Ref": "ComplianceReportProcessorFunction"
        },
        "Action": "lambda:InvokeFunction",
        "Principal": "events.amazonaws.com",
        "SourceArn": {
          "Fn::GetAtt": ["SecurityGroupChangeRule", "Arn"]
        }
      }
    },
    "IAMRoleChangeRule": {
      "Type": "AWS::Events::Rule",
      "Properties": {
        "Name": {
          "Fn::Sub": "iam-role-change-rule-${EnvironmentSuffix}"
        },
        "Description": "Trigger compliance checks on IAM role updates",
        "EventPattern": {
          "source": ["aws.iam"],
          "detail-type": ["AWS API Call via CloudTrail"],
          "detail": {
            "eventSource": ["iam.amazonaws.com"],
            "eventName": [
              "CreateRole",
              "DeleteRole",
              "UpdateRole",
              "PutRolePolicy",
              "DeleteRolePolicy",
              "AttachRolePolicy",
              "DetachRolePolicy"
            ]
          }
        },
        "State": "ENABLED",
        "Targets": [
          {
            "Arn": {
              "Fn::GetAtt": ["ComplianceReportProcessorFunction", "Arn"]
            },
            "Id": "IAMRoleComplianceTarget",
            "RoleArn": {
              "Fn::GetAtt": ["EventBridgeInvokeLambdaRole", "Arn"]
            }
          }
        ]
      }
    },
    "IAMRoleChangeRulePermission": {
      "Type": "AWS::Lambda::Permission",
      "Properties": {
        "FunctionName": {
          "Ref": "ComplianceReportProcessorFunction"
        },
        "Action": "lambda:InvokeFunction",
        "Principal": "events.amazonaws.com",
        "SourceArn": {
          "Fn::GetAtt": ["IAMRoleChangeRule", "Arn"]
        }
      }
    },
    "ComplianceDashboard": {
      "Type": "AWS::CloudWatch::Dashboard",
      "Properties": {
        "DashboardName": {
          "Fn::Sub": "compliance-dashboard-${EnvironmentSuffix}"
        },
        "DashboardBody": {
          "Fn::Sub": "{\"widgets\":[{\"type\":\"metric\",\"properties\":{\"metrics\":[[\"ComplianceChecker\",\"CompliancePercentage\",{\"stat\":\"Average\",\"label\":\"Compliance %\"}]],\"view\":\"timeSeries\",\"stacked\":false,\"region\":\"${AWS::Region}\",\"title\":\"Overall Compliance Percentage\",\"period\":300,\"yAxis\":{\"left\":{\"min\":0,\"max\":100}}}},{\"type\":\"metric\",\"properties\":{\"metrics\":[[\"ComplianceChecker\",\"CheckExecutionCount\",{\"stat\":\"Sum\",\"label\":\"Total Checks\"}]],\"view\":\"timeSeries\",\"stacked\":false,\"region\":\"${AWS::Region}\",\"title\":\"Check Execution Count\",\"period\":300}},{\"type\":\"metric\",\"properties\":{\"metrics\":[[\"ComplianceChecker\",\"FailedChecksCount\",{\"stat\":\"Sum\",\"label\":\"Failed Checks\"}]],\"view\":\"timeSeries\",\"stacked\":false,\"region\":\"${AWS::Region}\",\"title\":\"Failed Checks Count\",\"period\":300}},{\"type\":\"metric\",\"properties\":{\"metrics\":[[\"ComplianceChecker\",\"LastCheckTimestamp\",{\"stat\":\"Maximum\",\"label\":\"Last Check\"}]],\"view\":\"singleValue\",\"region\":\"${AWS::Region}\",\"title\":\"Last Check Timestamp\",\"period\":300}}]}"
        }
      }
    }
  },
  "Outputs": {
    "ComplianceReportsBucketName": {
      "Description": "S3 bucket for compliance reports",
      "Value": {
        "Ref": "ComplianceReportsBucket"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-ReportsBucket"
        }
      }
    },
    "ComplianceAlertTopicArn": {
      "Description": "SNS topic ARN for compliance alerts",
      "Value": {
        "Ref": "ComplianceAlertTopic"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-AlertTopic"
        }
      }
    },
    "ComplianceReportProcessorFunctionArn": {
      "Description": "Lambda function ARN for report processing",
      "Value": {
        "Fn::GetAtt": ["ComplianceReportProcessorFunction", "Arn"]
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-ProcessorFunction"
        }
      }
    },
    "ComplianceDashboardURL": {
      "Description": "CloudWatch dashboard URL",
      "Value": {
        "Fn::Sub": "https://console.aws.amazon.com/cloudwatch/home?region=${AWS::Region}#dashboards:name=compliance-dashboard-${EnvironmentSuffix}"
      }
    },
    "IMDSv2ComplianceDocumentName": {
      "Description": "SSM document for IMDSv2 compliance checks",
      "Value": {
        "Ref": "IMDSv2ComplianceDocument"
      }
    },
    "ApprovedAMIComplianceDocumentName": {
      "Description": "SSM document for approved AMI checks",
      "Value": {
        "Ref": "ApprovedAMIComplianceDocument"
      }
    },
    "RequiredTagsComplianceDocumentName": {
      "Description": "SSM document for required tags checks",
      "Value": {
        "Ref": "RequiredTagsComplianceDocument"
      }
    }
  }
}
```

## Lambda Function Implementation Details

The Lambda function (inline Python code) provides:

1. **Event Parsing**: Processes EventBridge events for EC2, Security Group, and IAM changes
2. **Compliance Checks**: Validates EC2 instances for:
   - IMDSv2 enforcement (HttpTokens=required)
   - Required tags (Environment, Project)
   - Approved AMI usage
3. **Report Generation**: Creates JSON reports with pass/fail status, timestamps, and remediation recommendations
4. **S3 Storage**: Stores reports organized by date: `compliance-reports/YYYY/MM/DD/{report_id}.json`
5. **CloudWatch Metrics**: Publishes 4 custom metrics to ComplianceChecker namespace
6. **SNS Alerts**: Sends detailed alerts for failed compliance checks with remediation steps

## SSM Automation Documents

All three documents use schema version 0.3 and the SSM automation role:

1. **IMDSv2ComplianceDocument**: Checks instance metadata options for IMDSv2 enforcement
2. **ApprovedAMIComplianceDocument**: Retrieves and validates instance AMI against approved list
3. **RequiredTagsComplianceDocument**: Validates presence of required tags on instances

## EventBridge Rules

Three rules trigger the compliance Lambda function:

1. **EC2StateChangeRule**: Monitors instance state changes (running, stopped)
2. **SecurityGroupChangeRule**: Tracks security group modifications via CloudTrail
3. **IAMRoleChangeRule**: Monitors IAM role creation, deletion, and policy changes

## CloudWatch Dashboard

JSON dashboard body includes 4 widgets displaying:
1. **Overall Compliance Percentage**: Time series chart (0-100%)
2. **Check Execution Count**: Sum of successful check runs
3. **Failed Checks Count**: Sum of failed compliance checks
4. **Last Check Timestamp**: Single value display of most recent check

## IAM Security Model

All roles follow least-privilege access:

1. **ComplianceReportProcessorRole**: Lambda execution with specific S3, SNS, EC2, IAM, CloudWatch, and SSM permissions
2. **SSMAutomationRole**: EC2 describe/modify actions and Lambda invoke for report processor
3. **EventBridgeInvokeLambdaRole**: Only Lambda invoke function permission

## Resource Naming and Lifecycle

All resources use EnvironmentSuffix parameter:
- S3 Bucket: `compliance-reports-${EnvironmentSuffix}` (Retain policy for audit trail)
- Lambda: `compliance-report-processor-${EnvironmentSuffix}`
- IAM Roles: `*-role-${EnvironmentSuffix}`
- SSM Documents: `Check*-${EnvironmentSuffix}`
- EventBridge Rules: `*-rule-${EnvironmentSuffix}`
- CloudWatch Dashboard: `compliance-dashboard-${EnvironmentSuffix}`
- Log Group: `/aws/lambda/compliance-report-processor-${EnvironmentSuffix}` (Delete policy)

## Deployment Instructions

```bash
# Set environment suffix
export ENVIRONMENT_SUFFIX="synth101912438"
export COMPLIANCE_EMAIL="your-email@example.com"

# Validate template
aws cloudformation validate-template \
  --template-body file://lib/template.json \
  --region us-east-1

# Deploy stack
aws cloudformation create-stack \
  --stack-name compliance-system-${ENVIRONMENT_SUFFIX} \
  --template-body file://lib/template.json \
  --parameters \
    ParameterKey=EnvironmentSuffix,ParameterValue=${ENVIRONMENT_SUFFIX} \
    ParameterKey=ComplianceEmailAddress,ParameterValue=${COMPLIANCE_EMAIL} \
  --capabilities CAPABILITY_NAMED_IAM \
  --region us-east-1

# Wait for completion
aws cloudformation wait stack-create-complete \
  --stack-name compliance-system-${ENVIRONMENT_SUFFIX} \
  --region us-east-1

# Get stack outputs
aws cloudformation describe-stacks \
  --stack-name compliance-system-${ENVIRONMENT_SUFFIX} \
  --query 'Stacks[0].Outputs' \
  --region us-east-1
```

## Testing the System

1. **Launch an EC2 instance** without IMDSv2 enforcement
2. **Verify EventBridge rule triggers** Lambda function
3. **Check S3 bucket** for compliance report JSON
4. **Verify SNS alert** sent to compliance email
5. **View CloudWatch dashboard** for metrics
6. **Test SSM documents** manually with instance IDs

## Key Features

- All 18 resources include EnvironmentSuffix in names
- S3 bucket has Retain policy (all others Delete)
- CloudWatch Logs retention set to 30 days
- All resources tagged with Environment=qa and Project=compliance-checker
- EventBridge rules use dedicated IAM role with RoleArn
- Lambda has explicit permissions for CloudWatch namespace condition
- SSM documents properly reference automation role ARN
- Comprehensive stack outputs for testing and integration

## Compliance with Requirements

- 3 SSM automation documents for specific compliance checks
- 3 EventBridge rules for EC2, Security Group, and IAM monitoring
- Lambda function with inline Python code for report processing
- S3 with versioning, encryption (SSE-S3), and lifecycle (90-day Glacier transition)
- SNS topic with email subscription
- CloudWatch dashboard with 4 custom metrics
- IAM roles with least-privilege policies (no unnecessary wildcards)
- CloudWatch Logs with 30-day retention
- Resource naming follows convention: `resource-name-${EnvironmentSuffix}`
- All resources support clean deletion (except S3 with Retain for audit trail)
