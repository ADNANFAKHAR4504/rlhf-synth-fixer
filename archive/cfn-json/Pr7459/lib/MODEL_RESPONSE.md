# Serverless Trade Processing System - CloudFormation Template

This implementation provides a serverless trade processing system using AWS CloudFormation JSON template. The system orchestrates trade validation, enrichment, and compliance recording across multiple AWS regions.

## File: lib/TapStack.json

```json
{
  "AWSTemplateFormatVersion": "2010-09-09",
  "Description": "Serverless Trade Processing System with Step Functions, Lambda containers, and DynamoDB global tables",
  "Parameters": {
    "EnvironmentSuffix": {
      "Type": "String",
      "Description": "Unique suffix for resource naming",
      "Default": "dev"
    },
    "ValidatorImageUri": {
      "Type": "String",
      "Description": "ECR image URI for trade validator function"
    },
    "EnricherImageUri": {
      "Type": "String",
      "Description": "ECR image URI for metadata enricher function"
    },
    "RecorderImageUri": {
      "Type": "String",
      "Description": "ECR image URI for compliance recorder function"
    }
  },
  "Resources": {
    "TradeValidatorDLQ": {
      "Type": "AWS::SQS::Queue",
      "Properties": {
        "QueueName": {
          "Fn::Sub": "trade-validator-dlq-${EnvironmentSuffix}"
        },
        "MessageRetentionPeriod": 1209600
      }
    },
    "MetadataEnricherDLQ": {
      "Type": "AWS::SQS::Queue",
      "Properties": {
        "QueueName": {
          "Fn::Sub": "metadata-enricher-dlq-${EnvironmentSuffix}"
        },
        "MessageRetentionPeriod": 1209600
      }
    },
    "ComplianceRecorderDLQ": {
      "Type": "AWS::SQS::Queue",
      "Properties": {
        "QueueName": {
          "Fn::Sub": "compliance-recorder-dlq-${EnvironmentSuffix}"
        },
        "MessageRetentionPeriod": 1209600
      }
    },
    "LambdaExecutionRole": {
      "Type": "AWS::IAM::Role",
      "Properties": {
        "RoleName": {
          "Fn::Sub": "lambda-execution-role-${EnvironmentSuffix}"
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
          "arn:aws:iam::aws:policy/CloudWatchLambdaInsightsExecutionRolePolicy"
        ],
        "Policies": [
          {
            "PolicyName": "DynamoDBAccess",
            "PolicyDocument": {
              "Version": "2012-10-17",
              "Statement": [
                {
                  "Effect": "Allow",
                  "Action": [
                    "dynamodb:PutItem",
                    "dynamodb:GetItem",
                    "dynamodb:UpdateItem",
                    "dynamodb:Query"
                  ],
                  "Resource": {
                    "Fn::GetAtt": ["TradeTable", "Arn"]
                  }
                }
              ]
            }
          },
          {
            "PolicyName": "SQSAccess",
            "PolicyDocument": {
              "Version": "2012-10-17",
              "Statement": [
                {
                  "Effect": "Allow",
                  "Action": ["sqs:SendMessage"],
                  "Resource": "*"
                }
              ]
            }
          },
          {
            "PolicyName": "SSMAccess",
            "PolicyDocument": {
              "Version": "2012-10-17",
              "Statement": [
                {
                  "Effect": "Allow",
                  "Action": ["ssm:GetParameter", "ssm:GetParameters"],
                  "Resource": "*"
                }
              ]
            }
          }
        ]
      }
    },
    "TradeValidatorFunction": {
      "Type": "AWS::Lambda::Function",
      "Properties": {
        "FunctionName": {
          "Fn::Sub": "trade-validator-${EnvironmentSuffix}"
        },
        "Role": {
          "Fn::GetAtt": ["LambdaExecutionRole", "Arn"]
        },
        "PackageType": "Image",
        "Code": {
          "ImageUri": {
            "Ref": "ValidatorImageUri"
          }
        },
        "Architectures": ["arm64"],
        "Timeout": 60,
        "MemorySize": 512,
        "DeadLetterConfig": {
          "TargetArn": {
            "Fn::GetAtt": ["TradeValidatorDLQ", "Arn"]
          }
        },
        "Environment": {
          "Variables": {
            "TABLE_NAME": {
              "Ref": "TradeTable"
            }
          }
        }
      }
    },
    "MetadataEnricherFunction": {
      "Type": "AWS::Lambda::Function",
      "Properties": {
        "FunctionName": {
          "Fn::Sub": "metadata-enricher-${EnvironmentSuffix}"
        },
        "Role": {
          "Fn::GetAtt": ["LambdaExecutionRole", "Arn"]
        },
        "PackageType": "Image",
        "Code": {
          "ImageUri": {
            "Ref": "EnricherImageUri"
          }
        },
        "Architectures": ["arm64"],
        "Timeout": 60,
        "MemorySize": 512,
        "ReservedConcurrentExecutions": 10,
        "DeadLetterConfig": {
          "TargetArn": {
            "Fn::GetAtt": ["MetadataEnricherDLQ", "Arn"]
          }
        },
        "Environment": {
          "Variables": {
            "TABLE_NAME": {
              "Ref": "TradeTable"
            }
          }
        }
      }
    },
    "ComplianceRecorderFunction": {
      "Type": "AWS::Lambda::Function",
      "Properties": {
        "FunctionName": {
          "Fn::Sub": "compliance-recorder-${EnvironmentSuffix}"
        },
        "Role": {
          "Fn::GetAtt": ["LambdaExecutionRole", "Arn"]
        },
        "PackageType": "Image",
        "Code": {
          "ImageUri": {
            "Ref": "RecorderImageUri"
          }
        },
        "Architectures": ["arm64"],
        "Timeout": 60,
        "MemorySize": 512,
        "ReservedConcurrentExecutions": 10,
        "DeadLetterConfig": {
          "TargetArn": {
            "Fn::GetAtt": ["ComplianceRecorderDLQ", "Arn"]
          }
        },
        "Environment": {
          "Variables": {
            "TABLE_NAME": {
              "Ref": "TradeTable"
            }
          }
        }
      }
    },
    "TradeTable": {
      "Type": "AWS::DynamoDB::Table",
      "Properties": {
        "TableName": {
          "Fn::Sub": "trades-${EnvironmentSuffix}"
        },
        "BillingMode": "PAY_PER_REQUEST",
        "AttributeDefinitions": [
          {
            "AttributeName": "tradeId",
            "AttributeType": "S"
          },
          {
            "AttributeName": "timestamp",
            "AttributeType": "N"
          }
        ],
        "KeySchema": [
          {
            "AttributeName": "tradeId",
            "KeyType": "HASH"
          },
          {
            "AttributeName": "timestamp",
            "KeyType": "RANGE"
          }
        ],
        "PointInTimeRecoverySpecification": {
          "PointInTimeRecoveryEnabled": true
        },
        "StreamSpecification": {
          "StreamViewType": "NEW_AND_OLD_IMAGES"
        }
      }
    },
    "StepFunctionsRole": {
      "Type": "AWS::IAM::Role",
      "Properties": {
        "RoleName": {
          "Fn::Sub": "step-functions-role-${EnvironmentSuffix}"
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
            "PolicyName": "LambdaInvoke",
            "PolicyDocument": {
              "Version": "2012-10-17",
              "Statement": [
                {
                  "Effect": "Allow",
                  "Action": ["lambda:InvokeFunction"],
                  "Resource": [
                    {
                      "Fn::GetAtt": ["TradeValidatorFunction", "Arn"]
                    },
                    {
                      "Fn::GetAtt": ["MetadataEnricherFunction", "Arn"]
                    },
                    {
                      "Fn::GetAtt": ["ComplianceRecorderFunction", "Arn"]
                    }
                  ]
                }
              ]
            }
          }
        ]
      }
    },
    "TradeProcessingStateMachine": {
      "Type": "AWS::StepFunctions::StateMachine",
      "Properties": {
        "StateMachineName": {
          "Fn::Sub": "trade-processing-${EnvironmentSuffix}"
        },
        "RoleArn": {
          "Fn::GetAtt": ["StepFunctionsRole", "Arn"]
        },
        "DefinitionString": {
          "Fn::Sub": [
            "{\"Comment\":\"Trade Processing Workflow\",\"StartAt\":\"ParallelProcessing\",\"States\":{\"ParallelProcessing\":{\"Type\":\"Parallel\",\"Branches\":[{\"StartAt\":\"ValidateTrade\",\"States\":{\"ValidateTrade\":{\"Type\":\"Task\",\"Resource\":\"${ValidatorArn}\",\"End\":true}}},{\"StartAt\":\"EnrichMetadata\",\"States\":{\"EnrichMetadata\":{\"Type\":\"Task\",\"Resource\":\"${EnricherArn}\",\"End\":true}}}],\"Next\":\"RecordCompliance\"},\"RecordCompliance\":{\"Type\":\"Task\",\"Resource\":\"${RecorderArn}\",\"End\":true}}}",
            {
              "ValidatorArn": {
                "Fn::GetAtt": ["TradeValidatorFunction", "Arn"]
              },
              "EnricherArn": {
                "Fn::GetAtt": ["MetadataEnricherFunction", "Arn"]
              },
              "RecorderArn": {
                "Fn::GetAtt": ["ComplianceRecorderFunction", "Arn"]
              }
            }
          ]
        }
      }
    },
    "EventBridgeRole": {
      "Type": "AWS::IAM::Role",
      "Properties": {
        "RoleName": {
          "Fn::Sub": "eventbridge-role-${EnvironmentSuffix}"
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
            "PolicyName": "StartStateMachine",
            "PolicyDocument": {
              "Version": "2012-10-17",
              "Statement": [
                {
                  "Effect": "Allow",
                  "Action": ["states:StartExecution"],
                  "Resource": {
                    "Ref": "TradeProcessingStateMachine"
                  }
                }
              ]
            }
          }
        ]
      }
    },
    "SourceSystem1Rule": {
      "Type": "AWS::Events::Rule",
      "Properties": {
        "Name": {
          "Fn::Sub": "source-system-1-${EnvironmentSuffix}"
        },
        "EventPattern": {
          "source": ["trading.system1"],
          "detail-type": ["Trade Event"]
        },
        "State": "ENABLED",
        "Targets": [
          {
            "Arn": {
              "Ref": "TradeProcessingStateMachine"
            },
            "RoleArn": {
              "Fn::GetAtt": ["EventBridgeRole", "Arn"]
            },
            "Id": "SourceSystem1Target"
          }
        ]
      }
    },
    "SourceSystem2Rule": {
      "Type": "AWS::Events::Rule",
      "Properties": {
        "Name": {
          "Fn::Sub": "source-system-2-${EnvironmentSuffix}"
        },
        "EventPattern": {
          "source": ["trading.system2"],
          "detail-type": ["Trade Event"]
        },
        "State": "ENABLED",
        "Targets": [
          {
            "Arn": {
              "Ref": "TradeProcessingStateMachine"
            },
            "RoleArn": {
              "Fn::GetAtt": ["EventBridgeRole", "Arn"]
            },
            "Id": "SourceSystem2Target"
          }
        ]
      }
    },
    "SourceSystem3Rule": {
      "Type": "AWS::Events::Rule",
      "Properties": {
        "Name": {
          "Fn::Sub": "source-system-3-${EnvironmentSuffix}"
        },
        "EventPattern": {
          "source": ["trading.system3"],
          "detail-type": ["Trade Event"]
        },
        "State": "ENABLED",
        "Targets": [
          {
            "Arn": {
              "Ref": "TradeProcessingStateMachine"
            },
            "RoleArn": {
              "Fn::GetAtt": ["EventBridgeRole", "Arn"]
            },
            "Id": "SourceSystem3Target"
          }
        ]
      }
    },
    "ValidatorDLQAlarm": {
      "Type": "AWS::CloudWatch::Alarm",
      "Properties": {
        "AlarmName": {
          "Fn::Sub": "validator-dlq-alarm-${EnvironmentSuffix}"
        },
        "AlarmDescription": "Alert when messages accumulate in validator DLQ",
        "MetricName": "ApproximateNumberOfMessagesVisible",
        "Namespace": "AWS/SQS",
        "Statistic": "Average",
        "Period": 300,
        "EvaluationPeriods": 1,
        "Threshold": 1,
        "ComparisonOperator": "GreaterThanThreshold",
        "Dimensions": [
          {
            "Name": "QueueName",
            "Value": {
              "Fn::GetAtt": ["TradeValidatorDLQ", "QueueName"]
            }
          }
        ]
      }
    },
    "EnricherDLQAlarm": {
      "Type": "AWS::CloudWatch::Alarm",
      "Properties": {
        "AlarmName": {
          "Fn::Sub": "enricher-dlq-alarm-${EnvironmentSuffix}"
        },
        "AlarmDescription": "Alert when messages accumulate in enricher DLQ",
        "MetricName": "ApproximateNumberOfMessagesVisible",
        "Namespace": "AWS/SQS",
        "Statistic": "Average",
        "Period": 300,
        "EvaluationPeriods": 1,
        "Threshold": 1,
        "ComparisonOperator": "GreaterThanThreshold",
        "Dimensions": [
          {
            "Name": "QueueName",
            "Value": {
              "Fn::GetAtt": ["MetadataEnricherDLQ", "QueueName"]
            }
          }
        ]
      }
    },
    "RecorderDLQAlarm": {
      "Type": "AWS::CloudWatch::Alarm",
      "Properties": {
        "AlarmName": {
          "Fn::Sub": "recorder-dlq-alarm-${EnvironmentSuffix}"
        },
        "AlarmDescription": "Alert when messages accumulate in recorder DLQ",
        "MetricName": "ApproximateNumberOfMessagesVisible",
        "Namespace": "AWS/SQS",
        "Statistic": "Average",
        "Period": 300,
        "EvaluationPeriods": 1,
        "Threshold": 1,
        "ComparisonOperator": "GreaterThanThreshold",
        "Dimensions": [
          {
            "Name": "QueueName",
            "Value": {
              "Fn::GetAtt": ["ComplianceRecorderDLQ", "QueueName"]
            }
          }
        ]
      }
    },
    "APIEndpointParameter": {
      "Type": "AWS::SSM::Parameter",
      "Properties": {
        "Name": {
          "Fn::Sub": "/trade-processing/${EnvironmentSuffix}/api-endpoint"
        },
        "Type": "String",
        "Value": "https://api.example.com/v1",
        "Description": "API endpoint for trade processing"
      }
    },
    "ProcessingThresholdParameter": {
      "Type": "AWS::SSM::Parameter",
      "Properties": {
        "Name": {
          "Fn::Sub": "/trade-processing/${EnvironmentSuffix}/processing-threshold"
        },
        "Type": "String",
        "Value": "1000",
        "Description": "Processing threshold for trade validation"
      }
    },
    "ECRRepository": {
      "Type": "AWS::ECR::Repository",
      "Properties": {
        "RepositoryName": {
          "Fn::Sub": "trade-processing-${EnvironmentSuffix}"
        },
        "ImageScanningConfiguration": {
          "ScanOnPush": true
        }
      }
    }
  },
  "Outputs": {
    "StateMachineArn": {
      "Description": "ARN of the trade processing state machine",
      "Value": {
        "Ref": "TradeProcessingStateMachine"
      }
    },
    "TradeTableName": {
      "Description": "Name of the DynamoDB trade table",
      "Value": {
        "Ref": "TradeTable"
      }
    },
    "ECRRepositoryUri": {
      "Description": "URI of the ECR repository",
      "Value": {
        "Fn::GetAtt": ["ECRRepository", "RepositoryUri"]
      }
    }
  }
}
```

## Deployment Instructions

1. Build and push container images to ECR:
   ```bash
   aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <account-id>.dkr.ecr.us-east-1.amazonaws.com

   docker build -t trade-validator ./lambda/validator
   docker tag trade-validator:latest <account-id>.dkr.ecr.us-east-1.amazonaws.com/trade-processing-dev:validator
   docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/trade-processing-dev:validator
   ```

2. Deploy the CloudFormation stack:
   ```bash
   aws cloudformation create-stack \
     --stack-name trade-processing-dev \
     --template-body file://lib/TapStack.json \
     --parameters \
       ParameterKey=EnvironmentSuffix,ParameterValue=dev \
       ParameterKey=ValidatorImageUri,ParameterValue=<validator-image-uri> \
       ParameterKey=EnricherImageUri,ParameterValue=<enricher-image-uri> \
       ParameterKey=RecorderImageUri,ParameterValue=<recorder-image-uri> \
     --capabilities CAPABILITY_NAMED_IAM
   ```

3. Monitor the deployment:
   ```bash
   aws cloudformation describe-stacks --stack-name trade-processing-dev
   ```