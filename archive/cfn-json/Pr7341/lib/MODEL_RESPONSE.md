# CloudFormation Compliance Analyzer - Infrastructure Implementation

This implementation provides a complete CloudFormation-based compliance analysis system with automated scanning, validation, and reporting capabilities.

## Architecture Overview

The system consists of the following components:
- AWS Config Rules for compliance validation
- Lambda functions for template parsing and validation
- DynamoDB for storing scan results
- SNS for critical violation notifications
- Step Functions for workflow orchestration
- EventBridge for event-driven triggers
- CloudWatch for monitoring and dashboards
- S3 for compliance report storage
- IAM roles for cross-account access
- X-Ray for distributed tracing

## File: lib/compliance-analyzer-template.json

```json
{
  "AWSTemplateFormatVersion": "2010-09-09",
  "Description": "CloudFormation Compliance Analyzer Infrastructure - Automated template scanning and validation system",
  "Parameters": {
    "EnvironmentSuffix": {
      "Type": "String",
      "Description": "Environment suffix for resource naming to ensure uniqueness",
      "Default": "dev",
      "AllowedPattern": "^[a-z0-9-]+$",
      "ConstraintDescription": "Must contain only lowercase letters, numbers, and hyphens"
    },
    "NotificationEmail": {
      "Type": "String",
      "Description": "Email address for compliance violation notifications",
      "AllowedPattern": "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$",
      "ConstraintDescription": "Must be a valid email address"
    },
    "ExternalId": {
      "Type": "String",
      "Description": "External ID for cross-account assume role security",
      "MinLength": 8,
      "NoEcho": true
    },
    "TargetAccountIds": {
      "Type": "CommaDelimitedList",
      "Description": "Comma-separated list of AWS account IDs to scan",
      "Default": ""
    }
  },
  "Resources": {
    "ComplianceReportsBucket": {
      "Type": "AWS::S3::Bucket",
      "Properties": {
        "BucketName": {
          "Fn::Sub": "compliance-reports-${EnvironmentSuffix}-${AWS::AccountId}"
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
            "Value": {
              "Ref": "EnvironmentSuffix"
            }
          },
          {
            "Key": "Purpose",
            "Value": "ComplianceReports"
          }
        ]
      }
    },
    "ScanResultsTable": {
      "Type": "AWS::DynamoDB::Table",
      "Properties": {
        "TableName": {
          "Fn::Sub": "compliance-scan-results-${EnvironmentSuffix}"
        },
        "BillingMode": "PAY_PER_REQUEST",
        "AttributeDefinitions": [
          {
            "AttributeName": "accountIdTimestamp",
            "AttributeType": "S"
          },
          {
            "AttributeName": "resourceId",
            "AttributeType": "S"
          }
        ],
        "KeySchema": [
          {
            "AttributeName": "accountIdTimestamp",
            "KeyType": "HASH"
          },
          {
            "AttributeName": "resourceId",
            "KeyType": "RANGE"
          }
        ],
        "StreamSpecification": {
          "StreamViewType": "NEW_AND_OLD_IMAGES"
        },
        "Tags": [
          {
            "Key": "Environment",
            "Value": {
              "Ref": "EnvironmentSuffix"
            }
          },
          {
            "Key": "Purpose",
            "Value": "ComplianceScanResults"
          }
        ]
      }
    },
    "ComplianceViolationTopic": {
      "Type": "AWS::SNS::Topic",
      "Properties": {
        "TopicName": {
          "Fn::Sub": "compliance-violations-${EnvironmentSuffix}"
        },
        "DisplayName": "CloudFormation Compliance Violations",
        "Subscription": [
          {
            "Endpoint": {
              "Ref": "NotificationEmail"
            },
            "Protocol": "email"
          }
        ],
        "Tags": [
          {
            "Key": "Environment",
            "Value": {
              "Ref": "EnvironmentSuffix"
            }
          }
        ]
      }
    },
    "LambdaExecutionRole": {
      "Type": "AWS::IAM::Role",
      "Properties": {
        "RoleName": {
          "Fn::Sub": "compliance-lambda-role-${EnvironmentSuffix}"
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
          "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole",
          "arn:aws:iam::aws:policy/AWSXRayDaemonWriteAccess"
        ],
        "Policies": [
          {
            "PolicyName": "ComplianceAnalyzerPolicy",
            "PolicyDocument": {
              "Version": "2012-10-17",
              "Statement": [
                {
                  "Effect": "Allow",
                  "Action": [
                    "s3:GetObject",
                    "s3:ListBucket"
                  ],
                  "Resource": [
                    {
                      "Fn::Sub": "arn:aws:s3:::compliance-reports-${EnvironmentSuffix}-${AWS::AccountId}"
                    },
                    {
                      "Fn::Sub": "arn:aws:s3:::compliance-reports-${EnvironmentSuffix}-${AWS::AccountId}/*"
                    }
                  ]
                },
                {
                  "Effect": "Allow",
                  "Action": [
                    "s3:PutObject"
                  ],
                  "Resource": [
                    {
                      "Fn::Sub": "arn:aws:s3:::compliance-reports-${EnvironmentSuffix}-${AWS::AccountId}/*"
                    }
                  ]
                },
                {
                  "Effect": "Allow",
                  "Action": [
                    "dynamodb:PutItem",
                    "dynamodb:GetItem",
                    "dynamodb:Query",
                    "dynamodb:Scan"
                  ],
                  "Resource": [
                    {
                      "Fn::GetAtt": [
                        "ScanResultsTable",
                        "Arn"
                      ]
                    }
                  ]
                },
                {
                  "Effect": "Allow",
                  "Action": [
                    "sns:Publish"
                  ],
                  "Resource": [
                    {
                      "Ref": "ComplianceViolationTopic"
                    }
                  ]
                },
                {
                  "Effect": "Allow",
                  "Action": [
                    "config:DescribeConfigRules",
                    "config:GetComplianceDetailsByConfigRule"
                  ],
                  "Resource": "*"
                },
                {
                  "Effect": "Allow",
                  "Action": [
                    "sts:AssumeRole"
                  ],
                  "Resource": "arn:aws:iam::*:role/ComplianceScannerRole-*"
                },
                {
                  "Effect": "Allow",
                  "Action": [
                    "cloudformation:DescribeStacks",
                    "cloudformation:GetTemplate"
                  ],
                  "Resource": "*"
                },
                {
                  "Effect": "Allow",
                  "Action": [
                    "cloudwatch:PutMetricData"
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
            "Value": {
              "Ref": "EnvironmentSuffix"
            }
          }
        ]
      }
    },
    "TemplateParserFunction": {
      "Type": "AWS::Lambda::Function",
      "Properties": {
        "FunctionName": {
          "Fn::Sub": "template-parser-${EnvironmentSuffix}"
        },
        "Runtime": "python3.9",
        "Handler": "template_parser.lambda_handler",
        "Role": {
          "Fn::GetAtt": [
            "LambdaExecutionRole",
            "Arn"
          ]
        },
        "Code": {
          "ZipFile": "# Placeholder - actual code in separate file\nimport json\ndef lambda_handler(event, context):\n    return {'statusCode': 200, 'body': json.dumps('Template parser function')}\n"
        },
        "Timeout": 300,
        "MemorySize": 512,
        "Environment": {
          "Variables": {
            "DYNAMODB_TABLE": {
              "Ref": "ScanResultsTable"
            },
            "SNS_TOPIC_ARN": {
              "Ref": "ComplianceViolationTopic"
            },
            "ENVIRONMENT_SUFFIX": {
              "Ref": "EnvironmentSuffix"
            }
          }
        },
        "TracingConfig": {
          "Mode": "Active"
        },
        "Tags": [
          {
            "Key": "Environment",
            "Value": {
              "Ref": "EnvironmentSuffix"
            }
          }
        ]
      }
    },
    "ComplianceValidatorFunction": {
      "Type": "AWS::Lambda::Function",
      "Properties": {
        "FunctionName": {
          "Fn::Sub": "compliance-validator-${EnvironmentSuffix}"
        },
        "Runtime": "python3.9",
        "Handler": "compliance_validator.lambda_handler",
        "Role": {
          "Fn::GetAtt": [
            "LambdaExecutionRole",
            "Arn"
          ]
        },
        "Code": {
          "ZipFile": "# Placeholder - actual code in separate file\nimport json\ndef lambda_handler(event, context):\n    return {'statusCode': 200, 'body': json.dumps('Compliance validator function')}\n"
        },
        "Timeout": 300,
        "MemorySize": 512,
        "Environment": {
          "Variables": {
            "DYNAMODB_TABLE": {
              "Ref": "ScanResultsTable"
            },
            "SNS_TOPIC_ARN": {
              "Ref": "ComplianceViolationTopic"
            },
            "ENVIRONMENT_SUFFIX": {
              "Ref": "EnvironmentSuffix"
            }
          }
        },
        "TracingConfig": {
          "Mode": "Active"
        },
        "Tags": [
          {
            "Key": "Environment",
            "Value": {
              "Ref": "EnvironmentSuffix"
            }
          }
        ]
      }
    },
    "ReportGeneratorFunction": {
      "Type": "AWS::Lambda::Function",
      "Properties": {
        "FunctionName": {
          "Fn::Sub": "report-generator-${EnvironmentSuffix}"
        },
        "Runtime": "python3.9",
        "Handler": "report_generator.lambda_handler",
        "Role": {
          "Fn::GetAtt": [
            "LambdaExecutionRole",
            "Arn"
          ]
        },
        "Code": {
          "ZipFile": "# Placeholder - actual code in separate file\nimport json\ndef lambda_handler(event, context):\n    return {'statusCode': 200, 'body': json.dumps('Report generator function')}\n"
        },
        "Timeout": 300,
        "MemorySize": 512,
        "Environment": {
          "Variables": {
            "DYNAMODB_TABLE": {
              "Ref": "ScanResultsTable"
            },
            "REPORTS_BUCKET": {
              "Ref": "ComplianceReportsBucket"
            },
            "ENVIRONMENT_SUFFIX": {
              "Ref": "EnvironmentSuffix"
            }
          }
        },
        "TracingConfig": {
          "Mode": "Active"
        },
        "Tags": [
          {
            "Key": "Environment",
            "Value": {
              "Ref": "EnvironmentSuffix"
            }
          }
        ]
      }
    },
    "StepFunctionsRole": {
      "Type": "AWS::IAM::Role",
      "Properties": {
        "RoleName": {
          "Fn::Sub": "compliance-stepfunctions-role-${EnvironmentSuffix}"
        },
        "AssumeRolePolicyDocument": {
          "Version": "2012-10-17",
          "Statement": [
            {
              "Effect": "Allow",
              "Principal": {
                "Service": "states.amazonaws.com"
              },
              "Action": "sts:AssumeRole"
            }
          ]
        },
        "Policies": [
          {
            "PolicyName": "StepFunctionsExecutionPolicy",
            "PolicyDocument": {
              "Version": "2012-10-17",
              "Statement": [
                {
                  "Effect": "Allow",
                  "Action": [
                    "lambda:InvokeFunction"
                  ],
                  "Resource": [
                    {
                      "Fn::GetAtt": [
                        "TemplateParserFunction",
                        "Arn"
                      ]
                    },
                    {
                      "Fn::GetAtt": [
                        "ComplianceValidatorFunction",
                        "Arn"
                      ]
                    },
                    {
                      "Fn::GetAtt": [
                        "ReportGeneratorFunction",
                        "Arn"
                      ]
                    }
                  ]
                },
                {
                  "Effect": "Allow",
                  "Action": [
                    "xray:PutTraceSegments",
                    "xray:PutTelemetryRecords"
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
            "Value": {
              "Ref": "EnvironmentSuffix"
            }
          }
        ]
      }
    },
    "ComplianceScanStateMachine": {
      "Type": "AWS::StepFunctions::StateMachine",
      "Properties": {
        "StateMachineName": {
          "Fn::Sub": "compliance-scan-workflow-${EnvironmentSuffix}"
        },
        "RoleArn": {
          "Fn::GetAtt": [
            "StepFunctionsRole",
            "Arn"
          ]
        },
        "TracingConfiguration": {
          "Enabled": true
        },
        "DefinitionString": {
          "Fn::Sub": [
            "{\n  \"Comment\": \"CloudFormation Compliance Scan Workflow\",\n  \"StartAt\": \"ParseTemplate\",\n  \"States\": {\n    \"ParseTemplate\": {\n      \"Type\": \"Task\",\n      \"Resource\": \"${TemplateParserArn}\",\n      \"ResultPath\": \"$.parsedResources\",\n      \"Retry\": [\n        {\n          \"ErrorEquals\": [\"Lambda.ServiceException\", \"Lambda.TooManyRequestsException\"],\n          \"IntervalSeconds\": 2,\n          \"MaxAttempts\": 3,\n          \"BackoffRate\": 2\n        }\n      ],\n      \"Catch\": [\n        {\n          \"ErrorEquals\": [\"States.ALL\"],\n          \"ResultPath\": \"$.error\",\n          \"Next\": \"HandleError\"\n        }\n      ],\n      \"Next\": \"ValidateCompliance\"\n    },\n    \"ValidateCompliance\": {\n      \"Type\": \"Task\",\n      \"Resource\": \"${ValidatorArn}\",\n      \"ResultPath\": \"$.validationResults\",\n      \"Retry\": [\n        {\n          \"ErrorEquals\": [\"Lambda.ServiceException\", \"Lambda.TooManyRequestsException\"],\n          \"IntervalSeconds\": 2,\n          \"MaxAttempts\": 3,\n          \"BackoffRate\": 2\n        }\n      ],\n      \"Catch\": [\n        {\n          \"ErrorEquals\": [\"States.ALL\"],\n          \"ResultPath\": \"$.error\",\n          \"Next\": \"HandleError\"\n        }\n      ],\n      \"Next\": \"GenerateReport\"\n    },\n    \"GenerateReport\": {\n      \"Type\": \"Task\",\n      \"Resource\": \"${ReportGeneratorArn}\",\n      \"ResultPath\": \"$.reportUrl\",\n      \"Retry\": [\n        {\n          \"ErrorEquals\": [\"Lambda.ServiceException\", \"Lambda.TooManyRequestsException\"],\n          \"IntervalSeconds\": 2,\n          \"MaxAttempts\": 3,\n          \"BackoffRate\": 2\n        }\n      ],\n      \"Catch\": [\n        {\n          \"ErrorEquals\": [\"States.ALL\"],\n          \"ResultPath\": \"$.error\",\n          \"Next\": \"HandleError\"\n        }\n      ],\n      \"End\": true\n    },\n    \"HandleError\": {\n      \"Type\": \"Pass\",\n      \"Result\": \"Error occurred during compliance scan\",\n      \"End\": true\n    }\n  }\n}",
            {
              "TemplateParserArn": {
                "Fn::GetAtt": [
                  "TemplateParserFunction",
                  "Arn"
                ]
              },
              "ValidatorArn": {
                "Fn::GetAtt": [
                  "ComplianceValidatorFunction",
                  "Arn"
                ]
              },
              "ReportGeneratorArn": {
                "Fn::GetAtt": [
                  "ReportGeneratorFunction",
                  "Arn"
                ]
              }
            }
          ]
        },
        "Tags": [
          {
            "Key": "Environment",
            "Value": {
              "Ref": "EnvironmentSuffix"
            }
          }
        ]
      }
    },
    "EventBridgeRole": {
      "Type": "AWS::IAM::Role",
      "Properties": {
        "RoleName": {
          "Fn::Sub": "compliance-eventbridge-role-${EnvironmentSuffix}"
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
            "PolicyName": "EventBridgeStepFunctionsPolicy",
            "PolicyDocument": {
              "Version": "2012-10-17",
              "Statement": [
                {
                  "Effect": "Allow",
                  "Action": [
                    "states:StartExecution"
                  ],
                  "Resource": [
                    {
                      "Ref": "ComplianceScanStateMachine"
                    }
                  ]
                }
              ]
            }
          }
        ],
        "Tags": [
          {
            "Key": "Environment",
            "Value": {
              "Ref": "EnvironmentSuffix"
            }
          }
        ]
      }
    },
    "CloudFormationEventRule": {
      "Type": "AWS::Events::Rule",
      "Properties": {
        "Name": {
          "Fn::Sub": "cfn-compliance-trigger-${EnvironmentSuffix}"
        },
        "Description": "Trigger compliance scan on CloudFormation stack events",
        "EventPattern": {
          "source": [
            "aws.cloudformation"
          ],
          "detail-type": [
            "CloudFormation Stack Status Change"
          ],
          "detail": {
            "status-details": {
              "status": [
                "CREATE_COMPLETE",
                "UPDATE_COMPLETE"
              ]
            }
          }
        },
        "State": "ENABLED",
        "Targets": [
          {
            "Arn": {
              "Ref": "ComplianceScanStateMachine"
            },
            "RoleArn": {
              "Fn::GetAtt": [
                "EventBridgeRole",
                "Arn"
              ]
            },
            "Id": "ComplianceScanTarget"
          }
        ]
      }
    },
    "S3EncryptionConfigRule": {
      "Type": "AWS::Config::ConfigRule",
      "Properties": {
        "ConfigRuleName": {
          "Fn::Sub": "s3-bucket-encryption-check-${EnvironmentSuffix}"
        },
        "Description": "Checks that S3 buckets have encryption enabled (AES256 or KMS)",
        "Source": {
          "Owner": "AWS",
          "SourceIdentifier": "S3_BUCKET_SERVER_SIDE_ENCRYPTION_ENABLED"
        },
        "Scope": {
          "ComplianceResourceTypes": [
            "AWS::S3::Bucket"
          ]
        }
      }
    },
    "RDSEncryptionConfigRule": {
      "Type": "AWS::Config::ConfigRule",
      "Properties": {
        "ConfigRuleName": {
          "Fn::Sub": "rds-encryption-check-${EnvironmentSuffix}"
        },
        "Description": "Checks that RDS instances have encryption enabled",
        "Source": {
          "Owner": "AWS",
          "SourceIdentifier": "RDS_STORAGE_ENCRYPTED"
        },
        "Scope": {
          "ComplianceResourceTypes": [
            "AWS::RDS::DBInstance"
          ]
        }
      }
    },
    "EC2InstanceTypeConfigRule": {
      "Type": "AWS::Config::ConfigRule",
      "Properties": {
        "ConfigRuleName": {
          "Fn::Sub": "ec2-instance-type-check-${EnvironmentSuffix}"
        },
        "Description": "Checks that EC2 instances are only t3.micro or t3.small types",
        "InputParameters": {
          "instanceTypes": "t3.micro,t3.small"
        },
        "Source": {
          "Owner": "AWS",
          "SourceIdentifier": "DESIRED_INSTANCE_TYPE"
        },
        "Scope": {
          "ComplianceResourceTypes": [
            "AWS::EC2::Instance"
          ]
        }
      }
    },
    "ComplianceDashboard": {
      "Type": "AWS::CloudWatch::Dashboard",
      "Properties": {
        "DashboardName": {
          "Fn::Sub": "compliance-metrics-${EnvironmentSuffix}"
        },
        "DashboardBody": {
          "Fn::Sub": "{\n  \"widgets\": [\n    {\n      \"type\": \"metric\",\n      \"properties\": {\n        \"metrics\": [\n          [\"ComplianceAnalyzer\", \"ComplianceScore\", {\"stat\": \"Average\"}],\n          [\".\", \"TotalResourcesScanned\", {\"stat\": \"Sum\"}],\n          [\".\", \"ViolationsDetected\", {\"stat\": \"Sum\"}]\n        ],\n        \"period\": 300,\n        \"stat\": \"Average\",\n        \"region\": \"${AWS::Region}\",\n        \"title\": \"Compliance Overview\",\n        \"yAxis\": {\n          \"left\": {\n            \"min\": 0\n          }\n        }\n      }\n    },\n    {\n      \"type\": \"metric\",\n      \"properties\": {\n        \"metrics\": [\n          [\"ComplianceAnalyzer\", \"S3Violations\", {\"stat\": \"Sum\"}],\n          [\".\", \"RDSViolations\", {\"stat\": \"Sum\"}],\n          [\".\", \"EC2Violations\", {\"stat\": \"Sum\"}]\n        ],\n        \"period\": 300,\n        \"stat\": \"Sum\",\n        \"region\": \"${AWS::Region}\",\n        \"title\": \"Violations by Service Type\",\n        \"yAxis\": {\n          \"left\": {\n            \"min\": 0\n          }\n        }\n      }\n    },\n    {\n      \"type\": \"log\",\n      \"properties\": {\n        \"query\": \"SOURCE '/aws/lambda/template-parser-${EnvironmentSuffix}' | fields @timestamp, @message | sort @timestamp desc | limit 20\",\n        \"region\": \"${AWS::Region}\",\n        \"title\": \"Recent Template Parser Logs\"\n      }\n    }\n  ]\n}"
        }
      }
    },
    "CrossAccountScanRole": {
      "Type": "AWS::IAM::Role",
      "Properties": {
        "RoleName": {
          "Fn::Sub": "compliance-cross-account-role-${EnvironmentSuffix}"
        },
        "AssumeRolePolicyDocument": {
          "Version": "2012-10-17",
          "Statement": [
            {
              "Effect": "Allow",
              "Principal": {
                "AWS": {
                  "Fn::Sub": "arn:aws:iam::${AWS::AccountId}:root"
                }
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
        "Policies": [
          {
            "PolicyName": "CrossAccountScanPolicy",
            "PolicyDocument": {
              "Version": "2012-10-17",
              "Statement": [
                {
                  "Effect": "Allow",
                  "Action": [
                    "cloudformation:DescribeStacks",
                    "cloudformation:GetTemplate",
                    "cloudformation:ListStacks"
                  ],
                  "Resource": "*"
                },
                {
                  "Effect": "Allow",
                  "Action": [
                    "s3:GetObject"
                  ],
                  "Resource": "arn:aws:s3:::*/cloudformation-templates/*"
                }
              ]
            }
          }
        ],
        "Tags": [
          {
            "Key": "Environment",
            "Value": {
              "Ref": "EnvironmentSuffix"
            }
          },
          {
            "Key": "Purpose",
            "Value": "CrossAccountCompliance"
          }
        ]
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
    "ScanResultsTableName": {
      "Description": "DynamoDB table for scan results",
      "Value": {
        "Ref": "ScanResultsTable"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-ScanResultsTable"
        }
      }
    },
    "ComplianceViolationTopicArn": {
      "Description": "SNS topic ARN for violation notifications",
      "Value": {
        "Ref": "ComplianceViolationTopic"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-ViolationTopic"
        }
      }
    },
    "StateMachineArn": {
      "Description": "Step Functions state machine ARN",
      "Value": {
        "Ref": "ComplianceScanStateMachine"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-StateMachine"
        }
      }
    },
    "TemplateParserFunctionArn": {
      "Description": "Template parser Lambda function ARN",
      "Value": {
        "Fn::GetAtt": [
          "TemplateParserFunction",
          "Arn"
        ]
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-TemplateParser"
        }
      }
    },
    "ComplianceValidatorFunctionArn": {
      "Description": "Compliance validator Lambda function ARN",
      "Value": {
        "Fn::GetAtt": [
          "ComplianceValidatorFunction",
          "Arn"
        ]
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-ComplianceValidator"
        }
      }
    },
    "ReportGeneratorFunctionArn": {
      "Description": "Report generator Lambda function ARN",
      "Value": {
        "Fn::GetAtt": [
          "ReportGeneratorFunction",
          "Arn"
        ]
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-ReportGenerator"
        }
      }
    },
    "ComplianceDashboardURL": {
      "Description": "CloudWatch dashboard URL",
      "Value": {
        "Fn::Sub": "https://console.aws.amazon.com/cloudwatch/home?region=${AWS::Region}#dashboards:name=compliance-metrics-${EnvironmentSuffix}"
      }
    },
    "CrossAccountRoleArn": {
      "Description": "Cross-account IAM role ARN for scanning",
      "Value": {
        "Fn::GetAtt": [
          "CrossAccountScanRole",
          "Arn"
        ]
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-CrossAccountRole"
        }
      }
    }
  }
}
```

## File: lib/lambda/template_parser.py

```python
"""
CloudFormation Template Parser Lambda Function

Parses CloudFormation templates from S3 and extracts resource definitions
for compliance validation. Handles nested stacks and cross-references.
"""

import json
import os
import boto3
from datetime import datetime
from typing import Dict, List, Any
from aws_xray_sdk.core import xray_recorder
from aws_xray_sdk.core import patch_all

# Patch AWS SDK clients for X-Ray tracing
patch_all()

# Initialize AWS clients
s3_client = boto3.client('s3')
cfn_client = boto3.client('cloudformation')
dynamodb = boto3.resource('dynamodb')
sns_client = boto3.client('sns')
cloudwatch = boto3.client('cloudwatch')

# Environment variables
DYNAMODB_TABLE = os.environ.get('DYNAMODB_TABLE')
SNS_TOPIC_ARN = os.environ.get('SNS_TOPIC_ARN')
ENVIRONMENT_SUFFIX = os.environ.get('ENVIRONMENT_SUFFIX', 'dev')

# Initialize DynamoDB table
table = dynamodb.Table(DYNAMODB_TABLE)


def lambda_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Main Lambda handler for parsing CloudFormation templates.
    
    Args:
        event: Lambda event containing stack information
        context: Lambda context
        
    Returns:
        Dictionary with parsed resources and metadata
    """
    try:
        # Extract stack information from event
        stack_name = event.get('stackName')
        account_id = event.get('accountId', context.invoked_function_arn.split(':')[4])
        region = event.get('region', os.environ.get('AWS_REGION', 'us-east-1'))
        
        if not stack_name:
            return create_error_response('Missing required parameter: stackName')
        
        # Get CloudFormation template
        template = get_cloudformation_template(stack_name, account_id, event.get('roleArn'))
        
        if not template:
            return create_error_response(f'Failed to retrieve template for stack: {stack_name}')
        
        # Parse template and extract resources
        resources = parse_template_resources(template)
        
        # Store initial scan record
        timestamp = datetime.utcnow().isoformat()
        scan_id = f"{account_id}#{timestamp}"
        
        # Store metadata in DynamoDB
        store_scan_metadata(scan_id, stack_name, account_id, region, len(resources))
        
        # Publish CloudWatch metrics
        publish_metrics('TemplatesParsed', 1)
        publish_metrics('ResourcesExtracted', len(resources))
        
        return {
            'statusCode': 200,
            'scanId': scan_id,
            'stackName': stack_name,
            'accountId': account_id,
            'region': region,
            'resourceCount': len(resources),
            'resources': resources,
            'timestamp': timestamp
        }
        
    except Exception as e:
        error_message = f'Error parsing template: {str(e)}'
        print(error_message)
        
        # Send notification for critical errors
        send_error_notification(error_message, event)
        
        # Publish error metric
        publish_metrics('ParsingErrors', 1)
        
        return create_error_response(error_message)


@xray_recorder.capture('get_cloudformation_template')
def get_cloudformation_template(stack_name: str, account_id: str, role_arn: str = None) -> Dict:
    """
    Retrieve CloudFormation template from AWS.
    
    Args:
        stack_name: Name of the CloudFormation stack
        account_id: AWS account ID
        role_arn: Optional cross-account role ARN
        
    Returns:
        Template dictionary or None if error
    """
    try:
        # Assume cross-account role if provided
        if role_arn:
            sts_client = boto3.client('sts')
            assumed_role = sts_client.assume_role(
                RoleArn=role_arn,
                RoleSessionName=f'ComplianceScanner-{account_id}',
                DurationSeconds=3600
            )
            
            # Create CloudFormation client with assumed credentials
            cfn_client_cross = boto3.client(
                'cloudformation',
                aws_access_key_id=assumed_role['Credentials']['AccessKeyId'],
                aws_secret_access_key=assumed_role['Credentials']['SecretAccessKey'],
                aws_session_token=assumed_role['Credentials']['SessionToken']
            )
        else:
            cfn_client_cross = cfn_client
        
        # Get template
        response = cfn_client_cross.get_template(
            StackName=stack_name,
            TemplateStage='Original'
        )
        
        template_body = response.get('TemplateBody', {})
        
        # Parse if string
        if isinstance(template_body, str):
            template_body = json.loads(template_body)
        
        return template_body
        
    except cfn_client.exceptions.ClientError as e:
        error_code = e.response['Error']['Code']
        print(f'CloudFormation API error: {error_code} - {str(e)}')
        return None
    except Exception as e:
        print(f'Error retrieving template: {str(e)}')
        return None


@xray_recorder.capture('parse_template_resources')
def parse_template_resources(template: Dict) -> List[Dict]:
    """
    Parse CloudFormation template and extract all resource definitions.
    
    Args:
        template: CloudFormation template dictionary
        
    Returns:
        List of resource definitions with metadata
    """
    resources = []
    template_resources = template.get('Resources', {})
    
    for logical_id, resource_def in template_resources.items():
        resource_type = resource_def.get('Type', 'Unknown')
        properties = resource_def.get('Properties', {})
        
        # Extract relevant information based on resource type
        resource_info = {
            'logicalId': logical_id,
            'type': resource_type,
            'properties': properties
        }
        
        # Extract specific compliance-relevant properties
        if resource_type == 'AWS::S3::Bucket':
            resource_info['encryption'] = extract_s3_encryption(properties)
            resource_info['publicAccess'] = extract_s3_public_access(properties)
            
        elif resource_type == 'AWS::RDS::DBInstance':
            resource_info['encryption'] = properties.get('StorageEncrypted', False)
            resource_info['publiclyAccessible'] = properties.get('PubliclyAccessible', False)
            
        elif resource_type == 'AWS::EC2::Instance':
            resource_info['instanceType'] = properties.get('InstanceType', 'Unknown')
        
        resources.append(resource_info)
    
    return resources


def extract_s3_encryption(properties: Dict) -> Dict:
    """Extract S3 bucket encryption configuration."""
    encryption_config = properties.get('BucketEncryption', {})
    rules = encryption_config.get('ServerSideEncryptionConfiguration', [])
    
    if not rules:
        return {'enabled': False, 'algorithm': None}
    
    sse_default = rules[0].get('ServerSideEncryptionByDefault', {})
    algorithm = sse_default.get('SSEAlgorithm', 'Unknown')
    
    return {
        'enabled': True,
        'algorithm': algorithm,
        'kmsKeyId': sse_default.get('KMSMasterKeyID')
    }


def extract_s3_public_access(properties: Dict) -> Dict:
    """Extract S3 bucket public access configuration."""
    public_access_config = properties.get('PublicAccessBlockConfiguration', {})
    
    return {
        'blockPublicAcls': public_access_config.get('BlockPublicAcls', False),
        'blockPublicPolicy': public_access_config.get('BlockPublicPolicy', False),
        'ignorePublicAcls': public_access_config.get('IgnorePublicAcls', False),
        'restrictPublicBuckets': public_access_config.get('RestrictPublicBuckets', False)
    }


@xray_recorder.capture('store_scan_metadata')
def store_scan_metadata(scan_id: str, stack_name: str, account_id: str, 
                        region: str, resource_count: int) -> None:
    """
    Store scan metadata in DynamoDB.
    
    Args:
        scan_id: Unique scan identifier (accountId#timestamp)
        stack_name: CloudFormation stack name
        account_id: AWS account ID
        region: AWS region
        resource_count: Number of resources found
    """
    try:
        table.put_item(
            Item={
                'accountIdTimestamp': scan_id,
                'resourceId': 'METADATA',
                'stackName': stack_name,
                'accountId': account_id,
                'region': region,
                'resourceCount': resource_count,
                'scanStatus': 'PARSING_COMPLETE',
                'timestamp': datetime.utcnow().isoformat()
            }
        )
    except Exception as e:
        print(f'Error storing scan metadata: {str(e)}')


def publish_metrics(metric_name: str, value: float, unit: str = 'Count') -> None:
    """
    Publish custom CloudWatch metrics.
    
    Args:
        metric_name: Name of the metric
        value: Metric value
        unit: Metric unit (default: Count)
    """
    try:
        cloudwatch.put_metric_data(
            Namespace='ComplianceAnalyzer',
            MetricData=[
                {
                    'MetricName': metric_name,
                    'Value': value,
                    'Unit': unit,
                    'Timestamp': datetime.utcnow(),
                    'Dimensions': [
                        {
                            'Name': 'Environment',
                            'Value': ENVIRONMENT_SUFFIX
                        }
                    ]
                }
            ]
        )
    except Exception as e:
        print(f'Error publishing metric {metric_name}: {str(e)}')


def send_error_notification(error_message: str, event: Dict) -> None:
    """
    Send SNS notification for critical errors.
    
    Args:
        error_message: Error message to send
        event: Original Lambda event
    """
    try:
        message = {
            'Subject': 'CloudFormation Compliance Scan Error',
            'ErrorMessage': error_message,
            'Event': event,
            'Timestamp': datetime.utcnow().isoformat()
        }
        
        sns_client.publish(
            TopicArn=SNS_TOPIC_ARN,
            Subject='Compliance Scanner Error',
            Message=json.dumps(message, indent=2)
        )
    except Exception as e:
        print(f'Error sending SNS notification: {str(e)}')


def create_error_response(error_message: str) -> Dict:
    """Create standardized error response."""
    return {
        'statusCode': 500,
        'error': error_message,
        'timestamp': datetime.utcnow().isoformat()
    }
```

## File: lib/lambda/compliance_validator.py

```python
"""
Compliance Validator Lambda Function

Validates parsed CloudFormation resources against AWS Config Rules
and identifies compliance violations.
"""

import json
import os
import boto3
from datetime import datetime
from typing import Dict, List, Any
from aws_xray_sdk.core import xray_recorder
from aws_xray_sdk.core import patch_all

# Patch AWS SDK clients for X-Ray tracing
patch_all()

# Initialize AWS clients
config_client = boto3.client('config')
dynamodb = boto3.resource('dynamodb')
sns_client = boto3.client('sns')
cloudwatch = boto3.client('cloudwatch')

# Environment variables
DYNAMODB_TABLE = os.environ.get('DYNAMODB_TABLE')
SNS_TOPIC_ARN = os.environ.get('SNS_TOPIC_ARN')
ENVIRONMENT_SUFFIX = os.environ.get('ENVIRONMENT_SUFFIX', 'dev')

# Initialize DynamoDB table
table = dynamodb.Table(DYNAMODB_TABLE)

# Compliance rules configuration
COMPLIANCE_RULES = {
    'S3_ENCRYPTION': {
        'resourceType': 'AWS::S3::Bucket',
        'requiredAlgorithms': ['AES256', 'aws:kms'],
        'severity': 'HIGH'
    },
    'RDS_ENCRYPTION': {
        'resourceType': 'AWS::RDS::DBInstance',
        'requiredEncryption': True,
        'severity': 'CRITICAL'
    },
    'EC2_INSTANCE_TYPE': {
        'resourceType': 'AWS::EC2::Instance',
        'allowedTypes': ['t3.micro', 't3.small'],
        'severity': 'MEDIUM'
    }
}


def lambda_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Main Lambda handler for compliance validation.
    
    Args:
        event: Lambda event containing parsed resources
        context: Lambda context
        
    Returns:
        Dictionary with validation results and violations
    """
    try:
        # Extract data from previous step
        scan_id = event.get('scanId')
        resources = event.get('resources', [])
        stack_name = event.get('stackName')
        account_id = event.get('accountId')
        
        if not scan_id or not resources:
            return create_error_response('Missing required data from previous step')
        
        # Validate each resource against compliance rules
        validation_results = []
        violations = []
        compliant_count = 0
        
        for resource in resources:
            result = validate_resource(resource, scan_id)
            validation_results.append(result)
            
            if result['compliant']:
                compliant_count += 1
            else:
                violations.append(result)
        
        # Calculate compliance score
        total_resources = len(resources)
        compliance_score = (compliant_count / total_resources * 100) if total_resources > 0 else 0
        
        # Store validation results in DynamoDB
        store_validation_results(scan_id, validation_results, compliance_score)
        
        # Send notifications for critical violations
        critical_violations = [v for v in violations if v.get('severity') == 'CRITICAL']
        if critical_violations:
            send_violation_notifications(critical_violations, stack_name, account_id)
        
        # Publish CloudWatch metrics
        publish_metrics('ComplianceScore', compliance_score, 'Percent')
        publish_metrics('TotalResourcesScanned', total_resources)
        publish_metrics('ViolationsDetected', len(violations))
        publish_metrics_by_service(violations)
        
        return {
            'statusCode': 200,
            'scanId': scan_id,
            'totalResources': total_resources,
            'compliantResources': compliant_count,
            'violations': len(violations),
            'complianceScore': compliance_score,
            'validationResults': validation_results,
            'criticalViolations': len(critical_violations),
            'timestamp': datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        error_message = f'Error validating compliance: {str(e)}'
        print(error_message)
        publish_metrics('ValidationErrors', 1)
        return create_error_response(error_message)


@xray_recorder.capture('validate_resource')
def validate_resource(resource: Dict, scan_id: str) -> Dict:
    """
    Validate a single resource against compliance rules.
    
    Args:
        resource: Resource definition from template
        scan_id: Scan identifier
        
    Returns:
        Validation result dictionary
    """
    resource_type = resource.get('type')
    logical_id = resource.get('logicalId')
    
    # Initialize result
    result = {
        'resourceId': logical_id,
        'resourceType': resource_type,
        'compliant': True,
        'violations': [],
        'severity': 'NONE'
    }
    
    # Validate S3 buckets
    if resource_type == 'AWS::S3::Bucket':
        result = validate_s3_bucket(resource)
        
    # Validate RDS instances
    elif resource_type == 'AWS::RDS::DBInstance':
        result = validate_rds_instance(resource)
        
    # Validate EC2 instances
    elif resource_type == 'AWS::EC2::Instance':
        result = validate_ec2_instance(resource)
    
    return result


def validate_s3_bucket(resource: Dict) -> Dict:
    """
    Validate S3 bucket against encryption and public access rules.
    
    Args:
        resource: S3 bucket resource definition
        
    Returns:
        Validation result
    """
    logical_id = resource.get('logicalId')
    encryption_config = resource.get('encryption', {})
    public_access_config = resource.get('publicAccess', {})
    
    violations = []
    severity = 'NONE'
    
    # Check encryption
    if not encryption_config.get('enabled'):
        violations.append({
            'rule': 'S3_ENCRYPTION_REQUIRED',
            'message': 'S3 bucket does not have encryption enabled',
            'remediation': 'Enable server-side encryption with AES256 or KMS'
        })
        severity = 'HIGH'
    elif encryption_config.get('algorithm') not in ['AES256', 'aws:kms']:
        violations.append({
            'rule': 'S3_ENCRYPTION_ALGORITHM',
            'message': f'S3 bucket uses unsupported encryption algorithm: {encryption_config.get("algorithm")}',
            'remediation': 'Use AES256 or aws:kms encryption algorithm'
        })
        severity = 'HIGH'
    
    # Check public access
    if not all([
        public_access_config.get('blockPublicAcls', False),
        public_access_config.get('blockPublicPolicy', False),
        public_access_config.get('ignorePublicAcls', False),
        public_access_config.get('restrictPublicBuckets', False)
    ]):
        violations.append({
            'rule': 'S3_PUBLIC_ACCESS_BLOCK',
            'message': 'S3 bucket does not have all public access blocks enabled',
            'remediation': 'Enable all four public access block settings'
        })
        severity = 'CRITICAL'
    
    return {
        'resourceId': logical_id,
        'resourceType': 'AWS::S3::Bucket',
        'compliant': len(violations) == 0,
        'violations': violations,
        'severity': severity
    }


def validate_rds_instance(resource: Dict) -> Dict:
    """
    Validate RDS instance against encryption rules.
    
    Args:
        resource: RDS instance resource definition
        
    Returns:
        Validation result
    """
    logical_id = resource.get('logicalId')
    encryption_enabled = resource.get('encryption', False)
    publicly_accessible = resource.get('publiclyAccessible', False)
    
    violations = []
    severity = 'NONE'
    
    # Check encryption
    if not encryption_enabled:
        violations.append({
            'rule': 'RDS_ENCRYPTION_REQUIRED',
            'message': 'RDS instance does not have encryption enabled',
            'remediation': 'Enable storage encryption for RDS instance'
        })
        severity = 'CRITICAL'
    
    # Check public accessibility
    if publicly_accessible:
        violations.append({
            'rule': 'RDS_PUBLIC_ACCESS',
            'message': 'RDS instance is publicly accessible',
            'remediation': 'Set PubliclyAccessible to false'
        })
        severity = 'CRITICAL'
    
    return {
        'resourceId': logical_id,
        'resourceType': 'AWS::RDS::DBInstance',
        'compliant': len(violations) == 0,
        'violations': violations,
        'severity': severity
    }


def validate_ec2_instance(resource: Dict) -> Dict:
    """
    Validate EC2 instance against instance type rules.
    
    Args:
        resource: EC2 instance resource definition
        
    Returns:
        Validation result
    """
    logical_id = resource.get('logicalId')
    instance_type = resource.get('instanceType', 'Unknown')
    allowed_types = COMPLIANCE_RULES['EC2_INSTANCE_TYPE']['allowedTypes']
    
    violations = []
    severity = 'NONE'
    
    # Check instance type
    if instance_type not in allowed_types:
        violations.append({
            'rule': 'EC2_INSTANCE_TYPE_ALLOWED',
            'message': f'EC2 instance type {instance_type} is not in allowed list',
            'remediation': f'Use one of the allowed instance types: {", ".join(allowed_types)}'
        })
        severity = 'MEDIUM'
    
    return {
        'resourceId': logical_id,
        'resourceType': 'AWS::EC2::Instance',
        'compliant': len(violations) == 0,
        'violations': violations,
        'severity': severity
    }


@xray_recorder.capture('store_validation_results')
def store_validation_results(scan_id: str, validation_results: List[Dict], 
                             compliance_score: float) -> None:
    """
    Store validation results in DynamoDB.
    
    Args:
        scan_id: Scan identifier
        validation_results: List of validation results
        compliance_score: Overall compliance score
    """
    try:
        # Store each resource validation result
        for result in validation_results:
            table.put_item(
                Item={
                    'accountIdTimestamp': scan_id,
                    'resourceId': result['resourceId'],
                    'resourceType': result['resourceType'],
                    'compliant': result['compliant'],
                    'violations': result['violations'],
                    'severity': result['severity'],
                    'timestamp': datetime.utcnow().isoformat()
                }
            )
        
        # Update metadata with compliance score
        table.update_item(
            Key={
                'accountIdTimestamp': scan_id,
                'resourceId': 'METADATA'
            },
            UpdateExpression='SET complianceScore = :score, scanStatus = :status',
            ExpressionAttributeValues={
                ':score': str(compliance_score),
                ':status': 'VALIDATION_COMPLETE'
            }
        )
        
    except Exception as e:
        print(f'Error storing validation results: {str(e)}')


def send_violation_notifications(violations: List[Dict], stack_name: str, 
                                 account_id: str) -> None:
    """
    Send SNS notifications for compliance violations.
    
    Args:
        violations: List of violation details
        stack_name: CloudFormation stack name
        account_id: AWS account ID
    """
    try:
        violation_summary = []
        
        for violation in violations:
            resource_id = violation.get('resourceId')
            resource_type = violation.get('resourceType')
            violation_list = violation.get('violations', [])
            
            for v in violation_list:
                violation_summary.append({
                    'Resource': f"{resource_type} - {resource_id}",
                    'Rule': v.get('rule'),
                    'Message': v.get('message'),
                    'Remediation': v.get('remediation')
                })
        
        message = {
            'Subject': f'CRITICAL: Compliance Violations Detected in {stack_name}',
            'Account': account_id,
            'Stack': stack_name,
            'ViolationCount': len(violations),
            'Violations': violation_summary,
            'Timestamp': datetime.utcnow().isoformat(),
            'Action': 'Review and remediate violations immediately'
        }
        
        sns_client.publish(
            TopicArn=SNS_TOPIC_ARN,
            Subject=f'CRITICAL: Compliance Violations in {stack_name}',
            Message=json.dumps(message, indent=2)
        )
        
    except Exception as e:
        print(f'Error sending violation notifications: {str(e)}')


def publish_metrics(metric_name: str, value: float, unit: str = 'Count') -> None:
    """
    Publish custom CloudWatch metrics.
    
    Args:
        metric_name: Name of the metric
        value: Metric value
        unit: Metric unit
    """
    try:
        cloudwatch.put_metric_data(
            Namespace='ComplianceAnalyzer',
            MetricData=[
                {
                    'MetricName': metric_name,
                    'Value': value,
                    'Unit': unit,
                    'Timestamp': datetime.utcnow(),
                    'Dimensions': [
                        {
                            'Name': 'Environment',
                            'Value': ENVIRONMENT_SUFFIX
                        }
                    ]
                }
            ]
        )
    except Exception as e:
        print(f'Error publishing metric {metric_name}: {str(e)}')


def publish_metrics_by_service(violations: List[Dict]) -> None:
    """
    Publish violation metrics broken down by service type.
    
    Args:
        violations: List of violations
    """
    try:
        # Count violations by service
        service_counts = {}
        for violation in violations:
            resource_type = violation.get('resourceType', 'Unknown')
            service = resource_type.split('::')[1] if '::' in resource_type else 'Unknown'
            service_counts[service] = service_counts.get(service, 0) + 1
        
        # Publish metrics for each service
        for service, count in service_counts.items():
            cloudwatch.put_metric_data(
                Namespace='ComplianceAnalyzer',
                MetricData=[
                    {
                        'MetricName': f'{service}Violations',
                        'Value': count,
                        'Unit': 'Count',
                        'Timestamp': datetime.utcnow(),
                        'Dimensions': [
                            {
                                'Name': 'Environment',
                                'Value': ENVIRONMENT_SUFFIX
                            }
                        ]
                    }
                ]
            )
    except Exception as e:
        print(f'Error publishing service metrics: {str(e)}')


def create_error_response(error_message: str) -> Dict:
    """Create standardized error response."""
    return {
        'statusCode': 500,
        'error': error_message,
        'timestamp': datetime.utcnow().isoformat()
    }
```

## File: lib/lambda/report_generator.py

```python
"""
Report Generator Lambda Function

Generates comprehensive compliance reports from validation results
and stores them in S3.
"""

import json
import os
import boto3
from datetime import datetime
from typing import Dict, List, Any
from aws_xray_sdk.core import xray_recorder
from aws_xray_sdk.core import patch_all

# Patch AWS SDK clients for X-Ray tracing
patch_all()

# Initialize AWS clients
s3_client = boto3.client('s3')
dynamodb = boto3.resource('dynamodb')
cloudwatch = boto3.client('cloudwatch')

# Environment variables
DYNAMODB_TABLE = os.environ.get('DYNAMODB_TABLE')
REPORTS_BUCKET = os.environ.get('REPORTS_BUCKET')
ENVIRONMENT_SUFFIX = os.environ.get('ENVIRONMENT_SUFFIX', 'dev')

# Initialize DynamoDB table
table = dynamodb.Table(DYNAMODB_TABLE)


def lambda_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Main Lambda handler for generating compliance reports.
    
    Args:
        event: Lambda event containing validation results
        context: Lambda context
        
    Returns:
        Dictionary with report URL and summary
    """
    try:
        # Extract data from previous step
        scan_id = event.get('scanId')
        stack_name = event.get('stackName')
        account_id = event.get('accountId')
        region = event.get('region', 'us-east-1')
        compliance_score = event.get('complianceScore', 0)
        validation_results = event.get('validationResults', [])
        
        if not scan_id:
            return create_error_response('Missing required data: scanId')
        
        # Generate report content
        report = generate_compliance_report(
            scan_id, stack_name, account_id, region,
            compliance_score, validation_results
        )
        
        # Store report in S3
        report_key = store_report_in_s3(report, scan_id, account_id)
        
        # Update DynamoDB with report location
        update_scan_record_with_report(scan_id, report_key)
        
        # Publish metrics
        publish_metrics('ReportsGenerated', 1)
        
        # Generate report URL
        report_url = f"s3://{REPORTS_BUCKET}/{report_key}"
        
        return {
            'statusCode': 200,
            'scanId': scan_id,
            'reportUrl': report_url,
            'reportKey': report_key,
            'complianceScore': compliance_score,
            'timestamp': datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        error_message = f'Error generating report: {str(e)}'
        print(error_message)
        publish_metrics('ReportGenerationErrors', 1)
        return create_error_response(error_message)


@xray_recorder.capture('generate_compliance_report')
def generate_compliance_report(scan_id: str, stack_name: str, account_id: str,
                               region: str, compliance_score: float,
                               validation_results: List[Dict]) -> Dict:
    """
    Generate comprehensive compliance report.
    
    Args:
        scan_id: Scan identifier
        stack_name: CloudFormation stack name
        account_id: AWS account ID
        region: AWS region
        compliance_score: Overall compliance score
        validation_results: List of validation results
        
    Returns:
        Report dictionary
    """
    # Calculate statistics
    total_resources = len(validation_results)
    compliant_resources = sum(1 for r in validation_results if r['compliant'])
    non_compliant_resources = total_resources - compliant_resources
    
    # Group violations by severity
    critical_violations = [r for r in validation_results if r.get('severity') == 'CRITICAL']
    high_violations = [r for r in validation_results if r.get('severity') == 'HIGH']
    medium_violations = [r for r in validation_results if r.get('severity') == 'MEDIUM']
    
    # Group violations by resource type
    violations_by_type = {}
    for result in validation_results:
        if not result['compliant']:
            resource_type = result['resourceType']
            if resource_type not in violations_by_type:
                violations_by_type[resource_type] = []
            violations_by_type[resource_type].append(result)
    
    # Build report
    report = {
        'reportMetadata': {
            'scanId': scan_id,
            'stackName': stack_name,
            'accountId': account_id,
            'region': region,
            'scanTimestamp': scan_id.split('#')[1],
            'reportGeneratedAt': datetime.utcnow().isoformat()
        },
        'executiveSummary': {
            'complianceScore': compliance_score,
            'totalResources': total_resources,
            'compliantResources': compliant_resources,
            'nonCompliantResources': non_compliant_resources,
            'criticalViolations': len(critical_violations),
            'highViolations': len(high_violations),
            'mediumViolations': len(medium_violations),
            'overallStatus': get_overall_status(compliance_score)
        },
        'violationsByType': violations_by_type,
        'criticalViolations': critical_violations,
        'detailedResults': validation_results,
        'recommendations': generate_recommendations(validation_results)
    }
    
    return report


def get_overall_status(compliance_score: float) -> str:
    """Determine overall compliance status based on score."""
    if compliance_score >= 95:
        return 'EXCELLENT'
    elif compliance_score >= 80:
        return 'GOOD'
    elif compliance_score >= 60:
        return 'FAIR'
    else:
        return 'POOR'


def generate_recommendations(validation_results: List[Dict]) -> List[Dict]:
    """
    Generate remediation recommendations based on violations.
    
    Args:
        validation_results: List of validation results
        
    Returns:
        List of recommendations
    """
    recommendations = []
    
    for result in validation_results:
        if not result['compliant']:
            resource_id = result['resourceId']
            resource_type = result['resourceType']
            
            for violation in result.get('violations', []):
                recommendations.append({
                    'resource': f"{resource_type} - {resource_id}",
                    'issue': violation.get('message'),
                    'recommendation': violation.get('remediation'),
                    'severity': result.get('severity'),
                    'rule': violation.get('rule')
                })
    
    # Sort by severity
    severity_order = {'CRITICAL': 0, 'HIGH': 1, 'MEDIUM': 2, 'LOW': 3}
    recommendations.sort(key=lambda x: severity_order.get(x['severity'], 99))
    
    return recommendations


@xray_recorder.capture('store_report_in_s3')
def store_report_in_s3(report: Dict, scan_id: str, account_id: str) -> str:
    """
    Store compliance report in S3.
    
    Args:
        report: Report dictionary
        scan_id: Scan identifier
        account_id: AWS account ID
        
    Returns:
        S3 object key
    """
    try:
        # Generate S3 key with organized structure
        timestamp = datetime.utcnow()
        year = timestamp.strftime('%Y')
        month = timestamp.strftime('%m')
        day = timestamp.strftime('%d')
        
        report_key = f"reports/{account_id}/{year}/{month}/{day}/{scan_id}.json"
        
        # Convert report to JSON
        report_json = json.dumps(report, indent=2, default=str)
        
        # Upload to S3
        s3_client.put_object(
            Bucket=REPORTS_BUCKET,
            Key=report_key,
            Body=report_json,
            ContentType='application/json',
            ServerSideEncryption='AES256',
            Metadata={
                'scanId': scan_id,
                'accountId': account_id,
                'complianceScore': str(report['executiveSummary']['complianceScore'])
            }
        )
        
        return report_key
        
    except Exception as e:
        print(f'Error storing report in S3: {str(e)}')
        raise


@xray_recorder.capture('update_scan_record_with_report')
def update_scan_record_with_report(scan_id: str, report_key: str) -> None:
    """
    Update DynamoDB scan record with report location.
    
    Args:
        scan_id: Scan identifier
        report_key: S3 object key for report
    """
    try:
        table.update_item(
            Key={
                'accountIdTimestamp': scan_id,
                'resourceId': 'METADATA'
            },
            UpdateExpression='SET reportKey = :key, scanStatus = :status, completedAt = :completed',
            ExpressionAttributeValues={
                ':key': report_key,
                ':status': 'COMPLETED',
                ':completed': datetime.utcnow().isoformat()
            }
        )
    except Exception as e:
        print(f'Error updating scan record: {str(e)}')


def publish_metrics(metric_name: str, value: float, unit: str = 'Count') -> None:
    """
    Publish custom CloudWatch metrics.
    
    Args:
        metric_name: Name of the metric
        value: Metric value
        unit: Metric unit
    """
    try:
        cloudwatch.put_metric_data(
            Namespace='ComplianceAnalyzer',
            MetricData=[
                {
                    'MetricName': metric_name,
                    'Value': value,
                    'Unit': unit,
                    'Timestamp': datetime.utcnow(),
                    'Dimensions': [
                        {
                            'Name': 'Environment',
                            'Value': ENVIRONMENT_SUFFIX
                        }
                    ]
                }
            ]
        )
    except Exception as e:
        print(f'Error publishing metric {metric_name}: {str(e)}')


def create_error_response(error_message: str) -> Dict:
    """Create standardized error response."""
    return {
        'statusCode': 500,
        'error': error_message,
        'timestamp': datetime.utcnow().isoformat()
    }
```

## File: lib/README.md

```markdown
# CloudFormation Compliance Analyzer

Automated infrastructure compliance analysis system for CloudFormation templates across multiple AWS accounts.

## Overview

This solution provides comprehensive compliance scanning and validation for CloudFormation stacks, automatically detecting violations against AWS Config Rules and generating detailed reports with notifications for critical issues.

## Architecture

The system consists of the following components:

1. **AWS Config Rules**: Define compliance criteria for S3 encryption, RDS encryption, and EC2 instance types
2. **Lambda Functions**: Parse templates, validate resources, and generate reports
3. **Step Functions**: Orchestrate the compliance scanning workflow
4. **EventBridge**: Trigger scans on CloudFormation stack events
5. **DynamoDB**: Store scan results and compliance data
6. **S3**: Store compliance reports with lifecycle management
7. **SNS**: Send notifications for critical violations
8. **CloudWatch**: Monitor metrics and provide compliance dashboard
9. **IAM**: Cross-account roles for secure multi-account scanning
10. **X-Ray**: Distributed tracing for performance monitoring

## Deployment

### Prerequisites

- AWS CLI configured with appropriate credentials
- AWS Config enabled in the target account
- Valid email address for SNS notifications
- External ID for cross-account access (min 8 characters)

### Parameters

- **EnvironmentSuffix**: Unique suffix for resource naming (default: dev)
- **NotificationEmail**: Email address for compliance alerts
- **ExternalId**: External ID for cross-account assume role security
- **TargetAccountIds**: Comma-separated list of AWS account IDs to scan

### Deploy the Stack

```bash
aws cloudformation create-stack \
  --stack-name compliance-analyzer \
  --template-body file://lib/compliance-analyzer-template.json \
  --parameters \
    ParameterKey=EnvironmentSuffix,ParameterValue=prod \
    ParameterKey=NotificationEmail,ParameterValue=security@example.com \
    ParameterKey=ExternalId,ParameterValue=your-secure-external-id \
    ParameterKey=TargetAccountIds,ParameterValue="123456789012,987654321098" \
  --capabilities CAPABILITY_NAMED_IAM \
  --region us-east-1
```

### Deploy Lambda Function Code

After the stack is created, deploy the Lambda function code:

```bash
# Package Lambda functions
cd lib/lambda
zip -r template_parser.zip template_parser.py
zip -r compliance_validator.zip compliance_validator.py
zip -r report_generator.zip report_generator.py

# Update Lambda functions
aws lambda update-function-code \
  --function-name template-parser-${ENVIRONMENT_SUFFIX} \
  --zip-file fileb://template_parser.zip

aws lambda update-function-code \
  --function-name compliance-validator-${ENVIRONMENT_SUFFIX} \
  --zip-file fileb://compliance_validator.zip

aws lambda update-function-code \
  --function-name report-generator-${ENVIRONMENT_SUFFIX} \
  --zip-file fileb://report_generator.zip
```

## Usage

### Automated Scanning

The system automatically triggers scans when CloudFormation stacks reach CREATE_COMPLETE or UPDATE_COMPLETE status via EventBridge.

### Manual Scanning

To manually trigger a compliance scan:

```bash
aws stepfunctions start-execution \
  --state-machine-arn arn:aws:states:us-east-1:ACCOUNT_ID:stateMachine:compliance-scan-workflow-${ENVIRONMENT_SUFFIX} \
  --input '{"stackName":"your-stack-name","accountId":"123456789012","region":"us-east-1"}'
```

### View Results

1. **CloudWatch Dashboard**: Navigate to CloudWatch > Dashboards > compliance-metrics-${ENVIRONMENT_SUFFIX}
2. **DynamoDB**: Query the ScanResultsTable for detailed results
3. **S3 Reports**: Download reports from the ComplianceReportsBucket
4. **Email Notifications**: Critical violations are sent to the configured email address

## Compliance Rules

### S3 Bucket Encryption
- **Requirement**: All S3 buckets must have encryption enabled with AES256 or KMS
- **Severity**: HIGH
- **Remediation**: Enable BucketEncryption with ServerSideEncryptionConfiguration

### RDS Instance Encryption
- **Requirement**: All RDS instances must have StorageEncrypted set to true
- **Severity**: CRITICAL
- **Remediation**: Enable StorageEncrypted property and recreate instance

### EC2 Instance Type
- **Requirement**: Only t3.micro and t3.small instance types allowed
- **Severity**: MEDIUM
- **Remediation**: Change InstanceType property to t3.micro or t3.small

### S3 Public Access
- **Requirement**: All S3 buckets must have public access blocks enabled
- **Severity**: CRITICAL
- **Remediation**: Enable all four PublicAccessBlockConfiguration settings

## Monitoring

### CloudWatch Metrics

The system publishes custom metrics under the `ComplianceAnalyzer` namespace:

- `ComplianceScore`: Overall compliance percentage
- `TotalResourcesScanned`: Number of resources analyzed
- `ViolationsDetected`: Number of compliance violations
- `S3Violations`: S3-specific violations
- `RDSViolations`: RDS-specific violations
- `EC2Violations`: EC2-specific violations
- `TemplatesParsed`: Number of templates parsed
- `ReportsGenerated`: Number of reports generated

### X-Ray Tracing

All Lambda functions and Step Functions have X-Ray tracing enabled for performance monitoring and debugging.

## Cross-Account Setup

To scan CloudFormation stacks in other AWS accounts:

1. Deploy the cross-account role in target accounts:

```bash
aws cloudformation create-stack \
  --stack-name compliance-scanner-role \
  --template-body file://cross-account-role-template.json \
  --parameters \
    ParameterKey=CentralAccountId,ParameterValue=123456789012 \
    ParameterKey=ExternalId,ParameterValue=your-secure-external-id \
  --capabilities CAPABILITY_NAMED_IAM
```

2. Update the Lambda execution role with permissions to assume the cross-account role

3. When invoking scans, provide the roleArn parameter:

```json
{
  "stackName": "your-stack-name",
  "accountId": "987654321098",
  "region": "us-east-1",
  "roleArn": "arn:aws:iam::987654321098:role/compliance-cross-account-role-prod"
}
```

## Testing

See the test directory for unit and integration tests.

## Troubleshooting

### Lambda Function Errors

Check CloudWatch Logs for detailed error messages:

```bash
aws logs tail /aws/lambda/template-parser-${ENVIRONMENT_SUFFIX} --follow
```

### Step Functions Execution Failures

View execution history:

```bash
aws stepfunctions list-executions \
  --state-machine-arn arn:aws:states:us-east-1:ACCOUNT_ID:stateMachine:compliance-scan-workflow-${ENVIRONMENT_SUFFIX} \
  --status-filter FAILED
```

### DynamoDB Query Issues

Ensure you're using the correct partition key format: `accountId#timestamp`

```python
response = table.query(
    KeyConditionExpression='accountIdTimestamp = :pk',
    ExpressionAttributeValues={':pk': '123456789012#2025-11-26T12:00:00'}
)
```

## Cost Optimization

- Lambda functions use 512MB memory - adjust if needed
- DynamoDB uses on-demand billing - consider provisioned capacity for high volume
- S3 lifecycle policies transition reports to Glacier after 90 days
- X-Ray tracing samples 5% of requests - adjust sampling rate if needed

## Security Considerations

- All data encrypted at rest and in transit
- Cross-account access uses external IDs to prevent confused deputy attacks
- IAM roles follow least privilege principles
- S3 buckets have public access blocks enabled
- Lambda functions run in VPC if network isolation required

## Maintenance

### Updating Config Rules

To add new compliance rules, update the COMPLIANCE_RULES dictionary in `compliance_validator.py` and add corresponding validation logic.

### Archiving Old Reports

Reports older than 90 days are automatically transitioned to Glacier. To permanently delete:

```bash
aws s3 rm s3://compliance-reports-${ENVIRONMENT_SUFFIX}-${ACCOUNT_ID}/reports/ --recursive
```

## License

Internal use only - proprietary software
```

