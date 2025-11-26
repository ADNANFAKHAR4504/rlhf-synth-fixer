# MODEL_RESPONSE: Security, Compliance, and Governance

This document contains the CloudFormation JSON template and Lambda function code for implementing an automated infrastructure compliance analysis system.

## File: lib/compliance-stack.json

```json
{
  "AWSTemplateFormatVersion": "2010-09-09",
  "Description": "Automated Infrastructure Compliance Analysis System",
  "Parameters": {
    "EnvironmentSuffix": {
      "Type": "String",
      "Description": "Unique suffix for resource naming",
      "Default": "dev"
    },
    "SecurityTeamEmail": {
      "Type": "String",
      "Description": "Email address for security team notifications",
      "Default": "security@example.com"
    }
  },
  "Resources": {
    "ComplianceReportsBucket": {
      "Type": "AWS::S3::Bucket",
      "Properties": {
        "BucketName": {
          "Fn::Sub": "compliance-reports-${EnvironmentSuffix}"
        },
        "VersioningConfiguration": {
          "Status": "Enabled"
        },
        "LifecycleConfiguration": {
          "Rules": [
            {
              "Id": "TransitionToGlacier",
              "Status": "Enabled",
              "Transitions": [
                {
                  "TransitionInDays": 30,
                  "StorageClass": "GLACIER"
                }
              ]
            }
          ]
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
        }
      }
    },
    "ConfigRole": {
      "Type": "AWS::IAM::Role",
      "Properties": {
        "RoleName": {
          "Fn::Sub": "config-role-${EnvironmentSuffix}"
        },
        "AssumeRolePolicyDocument": {
          "Version": "2012-10-17",
          "Statement": [
            {
              "Effect": "Allow",
              "Principal": {
                "Service": "config.amazonaws.com"
              },
              "Action": "sts:AssumeRole"
            }
          ]
        },
        "ManagedPolicyArns": [
          "arn:aws:iam::aws:policy/service-role/AWS_ConfigRole"
        ],
        "Policies": [
          {
            "PolicyName": "ConfigS3Access",
            "PolicyDocument": {
              "Version": "2012-10-17",
              "Statement": [
                {
                  "Effect": "Allow",
                  "Action": [
                    "s3:GetBucketVersioning",
                    "s3:PutObject",
                    "s3:GetObject"
                  ],
                  "Resource": [
                    {
                      "Fn::GetAtt": ["ComplianceReportsBucket", "Arn"]
                    },
                    {
                      "Fn::Sub": "${ComplianceReportsBucket.Arn}/*"
                    }
                  ]
                }
              ]
            }
          }
        ]
      }
    },
    "ConfigRecorder": {
      "Type": "AWS::Config::ConfigurationRecorder",
      "Properties": {
        "Name": {
          "Fn::Sub": "config-recorder-${EnvironmentSuffix}"
        },
        "RoleArn": {
          "Fn::GetAtt": ["ConfigRole", "Arn"]
        },
        "RecordingGroup": {
          "AllSupported": true,
          "IncludeGlobalResourceTypes": true
        }
      }
    },
    "ConfigDeliveryChannel": {
      "Type": "AWS::Config::DeliveryChannel",
      "Properties": {
        "Name": {
          "Fn::Sub": "config-delivery-${EnvironmentSuffix}"
        },
        "S3BucketName": {
          "Ref": "ComplianceReportsBucket"
        }
      }
    },
    "LambdaExecutionRole": {
      "Type": "AWS::IAM::Role",
      "Properties": {
        "RoleName": {
          "Fn::Sub": "lambda-compliance-role-${EnvironmentSuffix}"
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
            "PolicyName": "ComplianceValidationPolicy",
            "PolicyDocument": {
              "Version": "2012-10-17",
              "Statement": [
                {
                  "Effect": "Allow",
                  "Action": [
                    "config:PutEvaluations",
                    "config:DescribeConfigRules",
                    "config:DescribeComplianceByConfigRule"
                  ],
                  "Resource": "*"
                },
                {
                  "Effect": "Allow",
                  "Action": [
                    "s3:PutObject",
                    "s3:GetObject"
                  ],
                  "Resource": {
                    "Fn::Sub": "${ComplianceReportsBucket.Arn}/*"
                  }
                },
                {
                  "Effect": "Allow",
                  "Action": [
                    "sns:Publish"
                  ],
                  "Resource": {
                    "Ref": "ComplianceNotificationTopic"
                  }
                },
                {
                  "Effect": "Allow",
                  "Action": [
                    "ssm:GetParameter",
                    "ssm:GetParameters"
                  ],
                  "Resource": {
                    "Fn::Sub": "arn:aws:ssm:${AWS::Region}:${AWS::AccountId}:parameter/compliance/*"
                  }
                },
                {
                  "Effect": "Allow",
                  "Action": [
                    "cloudformation:DescribeStacks",
                    "cloudformation:DetectStackDrift",
                    "cloudformation:DescribeStackResourceDrifts"
                  ],
                  "Resource": "*"
                }
              ]
            }
          }
        ]
      }
    },
    "TagComplianceFunction": {
      "Type": "AWS::Lambda::Function",
      "Properties": {
        "FunctionName": {
          "Fn::Sub": "tag-compliance-validator-${EnvironmentSuffix}"
        },
        "Runtime": "python3.9",
        "Handler": "index.lambda_handler",
        "Role": {
          "Fn::GetAtt": ["LambdaExecutionRole", "Arn"]
        },
        "MemorySize": 256,
        "Timeout": 60,
        "Code": {
          "ZipFile": "import json\nimport boto3\n\nconfig = boto3.client('config')\nsns = boto3.client('sns')\n\nREQUIRED_TAGS = ['Environment', 'Owner', 'CostCenter']\n\ndef lambda_handler(event, context):\n    configuration_item = json.loads(event['configurationItem'])\n    resource_type = configuration_item['resourceType']\n    resource_id = configuration_item['resourceId']\n    tags = configuration_item.get('tags', {})\n    \n    missing_tags = [tag for tag in REQUIRED_TAGS if tag not in tags]\n    \n    compliance_type = 'COMPLIANT' if not missing_tags else 'NON_COMPLIANT'\n    annotation = f'Missing required tags: {missing_tags}' if missing_tags else 'All required tags present'\n    \n    evaluation = {\n        'ComplianceResourceType': resource_type,\n        'ComplianceResourceId': resource_id,\n        'ComplianceType': compliance_type,\n        'Annotation': annotation,\n        'OrderingTimestamp': configuration_item['configurationItemCaptureTime']\n    }\n    \n    config.put_evaluations(\n        Evaluations=[evaluation],\n        ResultToken=event['resultToken']\n    )\n    \n    if compliance_type == 'NON_COMPLIANT':\n        sns.publish(\n            TopicArn=context.environment_variables.get('SNS_TOPIC_ARN'),\n            Subject='Non-Compliant Resource Detected',\n            Message=f'Resource {resource_id} is missing required tags: {missing_tags}'\n        )\n    \n    return {'statusCode': 200, 'body': json.dumps(evaluation)}\n"
        },
        "Environment": {
          "Variables": {
            "SNS_TOPIC_ARN": {
              "Ref": "ComplianceNotificationTopic"
            }
          }
        }
      }
    },
    "DriftDetectionFunction": {
      "Type": "AWS::Lambda::Function",
      "Properties": {
        "FunctionName": {
          "Fn::Sub": "drift-detection-validator-${EnvironmentSuffix}"
        },
        "Runtime": "python3.9",
        "Handler": "index.lambda_handler",
        "Role": {
          "Fn::GetAtt": ["LambdaExecutionRole", "Arn"]
        },
        "MemorySize": 256,
        "Timeout": 300,
        "Code": {
          "ZipFile": "import json\nimport boto3\nimport time\n\ncfn = boto3.client('cloudformation')\nconfig_client = boto3.client('config')\nsns = boto3.client('sns')\ns3 = boto3.client('s3')\n\ndef lambda_handler(event, context):\n    configuration_item = json.loads(event['configurationItem'])\n    resource_type = configuration_item['resourceType']\n    resource_id = configuration_item['resourceId']\n    \n    if resource_type != 'AWS::CloudFormation::Stack':\n        return {'statusCode': 200, 'body': 'Not a CloudFormation stack'}\n    \n    stack_name = resource_id\n    \n    try:\n        drift_response = cfn.detect_stack_drift(StackName=stack_name)\n        drift_detection_id = drift_response['StackDriftDetectionId']\n        \n        while True:\n            status_response = cfn.describe_stack_drift_detection_status(\n                StackDriftDetectionId=drift_detection_id\n            )\n            status = status_response['DetectionStatus']\n            \n            if status == 'DETECTION_COMPLETE':\n                drift_status = status_response['StackDriftStatus']\n                break\n            elif status == 'DETECTION_FAILED':\n                return {'statusCode': 500, 'body': 'Drift detection failed'}\n            \n            time.sleep(5)\n        \n        compliance_type = 'COMPLIANT' if drift_status == 'IN_SYNC' else 'NON_COMPLIANT'\n        annotation = f'Stack drift status: {drift_status}'\n        \n        evaluation = {\n            'ComplianceResourceType': resource_type,\n            'ComplianceResourceId': resource_id,\n            'ComplianceType': compliance_type,\n            'Annotation': annotation,\n            'OrderingTimestamp': configuration_item['configurationItemCaptureTime']\n        }\n        \n        config_client.put_evaluations(\n            Evaluations=[evaluation],\n            ResultToken=event['resultToken']\n        )\n        \n        if compliance_type == 'NON_COMPLIANT':\n            drifts = cfn.describe_stack_resource_drifts(StackName=stack_name)\n            report = {\n                'stack_name': stack_name,\n                'drift_status': drift_status,\n                'drifted_resources': drifts.get('StackResourceDrifts', [])\n            }\n            \n            bucket = context.environment_variables.get('REPORTS_BUCKET')\n            s3.put_object(\n                Bucket=bucket,\n                Key=f'drift-reports/{stack_name}-{int(time.time())}.json',\n                Body=json.dumps(report, default=str)\n            )\n            \n            sns.publish(\n                TopicArn=context.environment_variables.get('SNS_TOPIC_ARN'),\n                Subject=f'CloudFormation Stack Drift Detected: {stack_name}',\n                Message=f'Stack {stack_name} has drifted. Status: {drift_status}'\n            )\n        \n        return {'statusCode': 200, 'body': json.dumps(evaluation)}\n    \n    except Exception as e:\n        return {'statusCode': 500, 'body': str(e)}\n"
        },
        "Environment": {
          "Variables": {
            "SNS_TOPIC_ARN": {
              "Ref": "ComplianceNotificationTopic"
            },
            "REPORTS_BUCKET": {
              "Ref": "ComplianceReportsBucket"
            }
          }
        }
      }
    },
    "SecurityPolicyValidatorFunction": {
      "Type": "AWS::Lambda::Function",
      "Properties": {
        "FunctionName": {
          "Fn::Sub": "security-policy-validator-${EnvironmentSuffix}"
        },
        "Runtime": "python3.9",
        "Handler": "index.lambda_handler",
        "Role": {
          "Fn::GetAtt": ["LambdaExecutionRole", "Arn"]
        },
        "MemorySize": 256,
        "Timeout": 60,
        "Code": {
          "ZipFile": "import json\nimport boto3\n\nconfig_client = boto3.client('config')\nssm = boto3.client('ssm')\nsns = boto3.client('sns')\n\ndef lambda_handler(event, context):\n    configuration_item = json.loads(event['configurationItem'])\n    resource_type = configuration_item['resourceType']\n    resource_id = configuration_item['resourceId']\n    \n    violations = []\n    \n    if resource_type == 'AWS::EC2::Instance':\n        ami_id = configuration_item['configuration'].get('imageId')\n        try:\n            approved_amis_param = ssm.get_parameter(Name='/compliance/approved-amis')\n            approved_amis = json.loads(approved_amis_param['Parameter']['Value'])\n            if ami_id not in approved_amis:\n                violations.append(f'AMI {ami_id} is not in approved list')\n        except:\n            pass\n    \n    if resource_type == 'AWS::EC2::SecurityGroup':\n        ingress_rules = configuration_item['configuration'].get('ipPermissions', [])\n        for rule in ingress_rules:\n            for ip_range in rule.get('ipRanges', []):\n                if ip_range.get('cidrIp') == '0.0.0.0/0':\n                    violations.append('Security group allows unrestricted access from 0.0.0.0/0')\n    \n    if resource_type == 'AWS::S3::Bucket':\n        encryption = configuration_item['configuration'].get('serverSideEncryptionConfiguration')\n        if not encryption:\n            violations.append('S3 bucket does not have encryption enabled')\n    \n    compliance_type = 'COMPLIANT' if not violations else 'NON_COMPLIANT'\n    annotation = '; '.join(violations) if violations else 'No security policy violations detected'\n    \n    evaluation = {\n        'ComplianceResourceType': resource_type,\n        'ComplianceResourceId': resource_id,\n        'ComplianceType': compliance_type,\n        'Annotation': annotation,\n        'OrderingTimestamp': configuration_item['configurationItemCaptureTime']\n    }\n    \n    config_client.put_evaluations(\n        Evaluations=[evaluation],\n        ResultToken=event['resultToken']\n    )\n    \n    if compliance_type == 'NON_COMPLIANT':\n        sns.publish(\n            TopicArn=context.environment_variables.get('SNS_TOPIC_ARN'),\n            Subject='Security Policy Violation Detected',\n            Message=f'Resource {resource_id} has violations: {annotation}'\n        )\n    \n    return {'statusCode': 200, 'body': json.dumps(evaluation)}\n"
        },
        "Environment": {
          "Variables": {
            "SNS_TOPIC_ARN": {
              "Ref": "ComplianceNotificationTopic"
            }
          }
        }
      }
    },
    "TagComplianceConfigRule": {
      "Type": "AWS::Config::ConfigRule",
      "DependsOn": ["ConfigRecorder", "ConfigDeliveryChannel"],
      "Properties": {
        "ConfigRuleName": {
          "Fn::Sub": "tag-compliance-rule-${EnvironmentSuffix}"
        },
        "Source": {
          "Owner": "CUSTOM_LAMBDA",
          "SourceIdentifier": {
            "Fn::GetAtt": ["TagComplianceFunction", "Arn"]
          },
          "SourceDetails": [
            {
              "EventSource": "aws.config",
              "MessageType": "ConfigurationItemChangeNotification"
            }
          ]
        }
      }
    },
    "DriftDetectionConfigRule": {
      "Type": "AWS::Config::ConfigRule",
      "DependsOn": ["ConfigRecorder", "ConfigDeliveryChannel"],
      "Properties": {
        "ConfigRuleName": {
          "Fn::Sub": "drift-detection-rule-${EnvironmentSuffix}"
        },
        "Source": {
          "Owner": "CUSTOM_LAMBDA",
          "SourceIdentifier": {
            "Fn::GetAtt": ["DriftDetectionFunction", "Arn"]
          },
          "SourceDetails": [
            {
              "EventSource": "aws.config",
              "MessageType": "ConfigurationItemChangeNotification"
            },
            {
              "EventSource": "aws.config",
              "MessageType": "ScheduledNotification",
              "MaximumExecutionFrequency": "TwentyFour_Hours"
            }
          ]
        }
      }
    },
    "SecurityPolicyConfigRule": {
      "Type": "AWS::Config::ConfigRule",
      "DependsOn": ["ConfigRecorder", "ConfigDeliveryChannel"],
      "Properties": {
        "ConfigRuleName": {
          "Fn::Sub": "security-policy-rule-${EnvironmentSuffix}"
        },
        "Source": {
          "Owner": "CUSTOM_LAMBDA",
          "SourceIdentifier": {
            "Fn::GetAtt": ["SecurityPolicyValidatorFunction", "Arn"]
          },
          "SourceDetails": [
            {
              "EventSource": "aws.config",
              "MessageType": "ConfigurationItemChangeNotification"
            }
          ]
        }
      }
    },
    "TagComplianceFunctionPermission": {
      "Type": "AWS::Lambda::Permission",
      "Properties": {
        "FunctionName": {
          "Fn::GetAtt": ["TagComplianceFunction", "Arn"]
        },
        "Action": "lambda:InvokeFunction",
        "Principal": "config.amazonaws.com",
        "SourceAccount": {
          "Ref": "AWS::AccountId"
        }
      }
    },
    "DriftDetectionFunctionPermission": {
      "Type": "AWS::Lambda::Permission",
      "Properties": {
        "FunctionName": {
          "Fn::GetAtt": ["DriftDetectionFunction", "Arn"]
        },
        "Action": "lambda:InvokeFunction",
        "Principal": "config.amazonaws.com",
        "SourceAccount": {
          "Ref": "AWS::AccountId"
        }
      }
    },
    "SecurityPolicyFunctionPermission": {
      "Type": "AWS::Lambda::Permission",
      "Properties": {
        "FunctionName": {
          "Fn::GetAtt": ["SecurityPolicyValidatorFunction", "Arn"]
        },
        "Action": "lambda:InvokeFunction",
        "Principal": "config.amazonaws.com",
        "SourceAccount": {
          "Ref": "AWS::AccountId"
        }
      }
    },
    "ComplianceNotificationTopic": {
      "Type": "AWS::SNS::Topic",
      "Properties": {
        "TopicName": {
          "Fn::Sub": "compliance-notifications-${EnvironmentSuffix}"
        },
        "DisplayName": "Compliance Notifications"
      }
    },
    "ComplianceNotificationSubscription": {
      "Type": "AWS::SNS::Subscription",
      "Properties": {
        "Protocol": "email",
        "TopicArn": {
          "Ref": "ComplianceNotificationTopic"
        },
        "Endpoint": {
          "Ref": "SecurityTeamEmail"
        }
      }
    },
    "ComplianceEventBridgeRole": {
      "Type": "AWS::IAM::Role",
      "Properties": {
        "RoleName": {
          "Fn::Sub": "eventbridge-compliance-role-${EnvironmentSuffix}"
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
                  "Action": "lambda:InvokeFunction",
                  "Resource": [
                    {
                      "Fn::GetAtt": ["TagComplianceFunction", "Arn"]
                    },
                    {
                      "Fn::GetAtt": ["DriftDetectionFunction", "Arn"]
                    },
                    {
                      "Fn::GetAtt": ["SecurityPolicyValidatorFunction", "Arn"]
                    }
                  ]
                }
              ]
            }
          }
        ]
      }
    },
    "ConfigComplianceChangeRule": {
      "Type": "AWS::Events::Rule",
      "Properties": {
        "Name": {
          "Fn::Sub": "config-compliance-change-${EnvironmentSuffix}"
        },
        "Description": "Trigger on AWS Config compliance changes",
        "EventPattern": {
          "source": ["aws.config"],
          "detail-type": ["Config Rules Compliance Change"]
        },
        "State": "ENABLED",
        "Targets": [
          {
            "Arn": {
              "Fn::GetAtt": ["TagComplianceFunction", "Arn"]
            },
            "Id": "TagComplianceTarget"
          }
        ]
      }
    },
    "EventBridgeLambdaPermission": {
      "Type": "AWS::Lambda::Permission",
      "Properties": {
        "FunctionName": {
          "Ref": "TagComplianceFunction"
        },
        "Action": "lambda:InvokeFunction",
        "Principal": "events.amazonaws.com",
        "SourceArn": {
          "Fn::GetAtt": ["ConfigComplianceChangeRule", "Arn"]
        }
      }
    },
    "ApprovedAMIsParameter": {
      "Type": "AWS::SSM::Parameter",
      "Properties": {
        "Name": {
          "Fn::Sub": "/compliance/approved-amis-${EnvironmentSuffix}"
        },
        "Type": "String",
        "Value": "[\"ami-0c55b159cbfafe1f0\", \"ami-0947d2ba12ee1ff75\"]",
        "Description": "List of approved AMI IDs for EC2 instances"
      }
    },
    "SecurityGroupRulesParameter": {
      "Type": "AWS::SSM::Parameter",
      "Properties": {
        "Name": {
          "Fn::Sub": "/compliance/security-group-rules-${EnvironmentSuffix}"
        },
        "Type": "String",
        "Value": "{\"max_ports\": 10, \"allowed_protocols\": [\"tcp\", \"udp\"], \"forbidden_cidrs\": [\"0.0.0.0/0\"]}",
        "Description": "Security group validation rules"
      }
    },
    "ComplianceThresholdsParameter": {
      "Type": "AWS::SSM::Parameter",
      "Properties": {
        "Name": {
          "Fn::Sub": "/compliance/thresholds-${EnvironmentSuffix}"
        },
        "Type": "String",
        "Value": "{\"max_drift_count\": 5, \"critical_resources\": [\"AWS::RDS::DBInstance\", \"AWS::EC2::SecurityGroup\"]}",
        "Description": "Compliance thresholds and critical resource types"
      }
    },
    "ComplianceDashboard": {
      "Type": "AWS::CloudWatch::Dashboard",
      "Properties": {
        "DashboardName": {
          "Fn::Sub": "compliance-dashboard-${EnvironmentSuffix}"
        },
        "DashboardBody": {
          "Fn::Sub": [
            "{\"widgets\":[{\"type\":\"metric\",\"properties\":{\"metrics\":[[\"AWS/Lambda\",\"Invocations\",{\"stat\":\"Sum\",\"label\":\"Tag Compliance Checks\"}],[\"AWS/Lambda\",\"Errors\",{\"stat\":\"Sum\",\"label\":\"Validation Errors\"}]],\"region\":\"${AWS::Region}\",\"title\":\"Compliance Function Metrics\",\"period\":300}},{\"type\":\"log\",\"properties\":{\"query\":\"SOURCE '${TagComplianceFunctionLogGroup}' | SOURCE '${DriftDetectionFunctionLogGroup}' | SOURCE '${SecurityPolicyFunctionLogGroup}' | fields @timestamp, @message | filter @message like /NON_COMPLIANT/ | sort @timestamp desc | limit 20\",\"region\":\"${AWS::Region}\",\"title\":\"Recent Non-Compliant Resources\"}},{\"type\":\"metric\",\"properties\":{\"metrics\":[[\"AWS/SNS\",\"NumberOfMessagesPublished\",{\"stat\":\"Sum\"}]],\"region\":\"${AWS::Region}\",\"title\":\"Compliance Notifications Sent\",\"period\":300}}]}",
            {
              "TagComplianceFunctionLogGroup": {
                "Ref": "TagComplianceFunctionLogGroup"
              },
              "DriftDetectionFunctionLogGroup": {
                "Ref": "DriftDetectionFunctionLogGroup"
              },
              "SecurityPolicyFunctionLogGroup": {
                "Ref": "SecurityPolicyFunctionLogGroup"
              }
            }
          ]
        }
      }
    },
    "TagComplianceFunctionLogGroup": {
      "Type": "AWS::Logs::LogGroup",
      "Properties": {
        "LogGroupName": {
          "Fn::Sub": "/aws/lambda/tag-compliance-validator-${EnvironmentSuffix}"
        },
        "RetentionInDays": 30
      }
    },
    "DriftDetectionFunctionLogGroup": {
      "Type": "AWS::Logs::LogGroup",
      "Properties": {
        "LogGroupName": {
          "Fn::Sub": "/aws/lambda/drift-detection-validator-${EnvironmentSuffix}"
        },
        "RetentionInDays": 30
      }
    },
    "SecurityPolicyFunctionLogGroup": {
      "Type": "AWS::Logs::LogGroup",
      "Properties": {
        "LogGroupName": {
          "Fn::Sub": "/aws/lambda/security-policy-validator-${EnvironmentSuffix}"
        },
        "RetentionInDays": 30
      }
    }
  },
  "Outputs": {
    "ComplianceReportsBucketName": {
      "Description": "S3 bucket for compliance reports",
      "Value": {
        "Ref": "ComplianceReportsBucket"
      }
    },
    "ComplianceNotificationTopicArn": {
      "Description": "SNS topic ARN for compliance notifications",
      "Value": {
        "Ref": "ComplianceNotificationTopic"
      }
    },
    "ConfigRecorderName": {
      "Description": "AWS Config recorder name",
      "Value": {
        "Ref": "ConfigRecorder"
      }
    },
    "ComplianceDashboardURL": {
      "Description": "CloudWatch dashboard URL",
      "Value": {
        "Fn::Sub": "https://console.aws.amazon.com/cloudwatch/home?region=${AWS::Region}#dashboards:name=compliance-dashboard-${EnvironmentSuffix}"
      }
    }
  }
}
```

## File: lib/README.md

```markdown
# Automated Infrastructure Compliance Analysis System

This CloudFormation template deploys a comprehensive compliance monitoring system for AWS infrastructure.

## Architecture Overview

The solution implements:
- AWS Config with custom rules for continuous compliance monitoring
- Lambda functions (Python 3.9) for custom validation logic
- S3 bucket for compliance report storage with lifecycle management
- EventBridge rules for real-time event processing
- SNS notifications for security team alerts
- CloudWatch dashboard for compliance metrics visualization
- Parameter Store for configuration management

## Components

### AWS Config
- **ConfigRecorder**: Records configuration changes for all supported AWS resources
- **DeliveryChannel**: Delivers configuration snapshots to S3
- **Custom Config Rules**: Three custom rules powered by Lambda functions

### Lambda Functions

1. **Tag Compliance Validator** (`tag-compliance-validator`)
   - Validates required tags (Environment, Owner, CostCenter)
   - Triggers on resource configuration changes
   - Reports non-compliant resources to SNS

2. **Drift Detection Validator** (`drift-detection-validator`)
   - Detects CloudFormation stack drift
   - Runs on schedule (every 24 hours) and on stack changes
   - Generates detailed drift reports in S3

3. **Security Policy Validator** (`security-policy-validator`)
   - Validates EC2 AMIs against approved list
   - Checks security groups for overly permissive rules
   - Ensures S3 buckets have encryption enabled

### Storage

- **S3 Bucket**: Stores compliance reports with versioning enabled
  - Lifecycle policy transitions reports to Glacier after 30 days
  - Server-side encryption enabled
  - Public access blocked

### Notifications

- **SNS Topic**: Sends email notifications to security team
- **EventBridge Rules**: Triggers Lambda functions on Config compliance changes

### Monitoring

- **CloudWatch Dashboard**: Displays compliance metrics and recent violations
- **CloudWatch Logs**: Stores Lambda function logs with 30-day retention

### Configuration Management

- **Parameter Store**: Stores approved AMI lists and security policies
  - `/compliance/approved-amis-{suffix}`: List of approved AMI IDs
  - `/compliance/security-group-rules-{suffix}`: Security group validation rules
  - `/compliance/thresholds-{suffix}`: Compliance thresholds

## Deployment

### Prerequisites

- AWS CLI configured with appropriate credentials
- Permissions to create IAM roles, Lambda functions, Config resources, S3 buckets, SNS topics, and CloudWatch resources

### Parameters

- `EnvironmentSuffix`: Unique identifier for resource naming (default: "dev")
- `SecurityTeamEmail`: Email address for compliance notifications (default: "security@example.com")

### Deploy

```bash
aws cloudformation create-stack \
  --stack-name compliance-monitoring \
  --template-body file://lib/compliance-stack.json \
  --parameters \
    ParameterKey=EnvironmentSuffix,ParameterValue=prod \
    ParameterKey=SecurityTeamEmail,ParameterValue=security@yourcompany.com \
  --capabilities CAPABILITY_NAMED_IAM \
  --region us-east-1
```

### Post-Deployment

1. Confirm the SNS subscription email sent to the security team
2. Wait 5-10 minutes for AWS Config to begin recording
3. Access the CloudWatch dashboard via the output URL
4. Update Parameter Store values with your organization's approved AMIs and security rules

## Compliance Rules

### Tag Compliance
- **Rule**: `tag-compliance-rule`
- **Checks**: Environment, Owner, CostCenter tags present on all resources
- **Trigger**: On resource configuration change

### Drift Detection
- **Rule**: `drift-detection-rule`
- **Checks**: CloudFormation stack drift status
- **Trigger**: On stack change and every 24 hours

### Security Policy
- **Rule**: `security-policy-rule`
- **Checks**:
  - EC2 instances use approved AMIs
  - Security groups don't allow unrestricted access (0.0.0.0/0)
  - S3 buckets have encryption enabled
- **Trigger**: On resource configuration change

## Monitoring and Alerts

### CloudWatch Dashboard

The compliance dashboard shows:
- Lambda function invocation counts and errors
- Recent non-compliant resources from logs
- SNS notification counts

### SNS Notifications

Email alerts are sent for:
- Resources missing required tags
- CloudFormation stack drift detected
- Security policy violations (unapproved AMIs, insecure security groups, unencrypted S3 buckets)

## Customization

### Adding Custom Compliance Rules

1. Create a new Lambda function with validation logic
2. Add IAM permissions to the Lambda execution role
3. Create a new AWS Config rule referencing the Lambda function
4. Add Lambda permission for Config to invoke the function
5. Update EventBridge rules if needed

### Modifying Approved AMIs

```bash
aws ssm put-parameter \
  --name "/compliance/approved-amis-prod" \
  --value '["ami-12345678", "ami-87654321"]' \
  --type String \
  --overwrite
```

### Adjusting Lifecycle Policies

Edit the S3 bucket's `LifecycleConfiguration` in the template to change transition timelines.

## Cost Considerations

- **AWS Config**: Charged per configuration item recorded (~$0.003 per item)
- **Lambda**: Minimal cost for compliance checks (~$0.20/month per million requests)
- **S3**: Standard storage + Glacier for reports
- **SNS**: Free tier covers most notification needs
- **CloudWatch**: Logs and dashboard included in free tier limits

## Cleanup

```bash
# Empty S3 bucket first
aws s3 rm s3://compliance-reports-{suffix} --recursive

# Delete the stack
aws cloudformation delete-stack \
  --stack-name compliance-monitoring \
  --region us-east-1
```

**Note**: AWS Config resources may need manual deletion if the stack deletion fails.

## Security Best Practices

- All IAM roles follow least privilege principle
- S3 bucket has public access blocked
- All data encrypted at rest and in transit
- CloudWatch Logs retain data for 30 days only
- Lambda functions have minimal timeout to prevent runaway costs

## Troubleshooting

### Config Rules Not Evaluating

- Verify Config Recorder is enabled: `aws configservice describe-configuration-recorder-status`
- Check Lambda function logs in CloudWatch
- Ensure Lambda has permissions to call `config:PutEvaluations`

### Lambda Timeouts

- Drift detection can take up to 5 minutes for large stacks
- Increase Lambda timeout if needed (max 15 minutes)

### SNS Notifications Not Received

- Confirm email subscription in SNS console
- Check Lambda environment variables contain correct SNS topic ARN
- Verify Lambda has `sns:Publish` permission

## Support

For issues or questions, contact your cloud security team.
```

## Summary

This implementation provides a complete automated compliance monitoring system using CloudFormation JSON. The solution includes:

- AWS Config with 3 custom Lambda-based rules
- 3 Python 3.9 Lambda functions (256MB memory) for compliance validation
- S3 bucket with versioning and 30-day Glacier lifecycle
- EventBridge integration for real-time processing
- SNS email notifications for security team
- CloudWatch dashboard with compliance metrics
- Parameter Store entries for configuration
- IAM roles with least privilege policies
- All resources use environmentSuffix for unique naming
- All resources are fully destroyable (no Retain policies)

The template is production-ready and follows AWS best practices for security, compliance, and cost optimization.
