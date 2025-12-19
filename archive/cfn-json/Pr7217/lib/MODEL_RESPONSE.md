# CloudFormation StackSet Solution for Cross-Region Migration

This solution provides a CloudFormation StackSet template to orchestrate the migration of a trading analytics platform from us-east-1 to eu-central-1.

## Architecture Overview

The solution implements a multi-region deployment using CloudFormation StackSets with the following components:

1. **CloudFormation StackSets** - Multi-region orchestration
2. **S3 Cross-Region Replication** - 500TB historical data migration
3. **DynamoDB Global Tables** - 10K TPS processing
4. **Lambda Functions** - Real-time analytics
5. **Systems Manager Parameter Store** - Configuration management
6. **CloudWatch Dashboards** - Monitoring
7. **SNS Topics** - Event notifications
8. **IAM Roles** - Cross-region trust relationships
9. **Kinesis Data Streams** - Market data ingestion
10. **VPC Infrastructure** - Network isolation and peering

## File: lib/TapStack.json

```json
{
  "AWSTemplateFormatVersion": "2010-09-09",
  "Description": "CloudFormation StackSet for cross-region trading analytics platform migration from us-east-1 to eu-central-1",

  "Parameters": {
    "EnvironmentSuffix": {
      "Description": "Unique suffix for resource naming to ensure uniqueness across deployments",
      "Type": "String",
      "MinLength": 3,
      "MaxLength": 20,
      "AllowedPattern": "[a-z0-9-]+",
      "ConstraintDescription": "Must contain only lowercase letters, numbers, and hyphens"
    },
    "SourceRegion": {
      "Description": "Source region for migration",
      "Type": "String",
      "Default": "us-east-1"
    },
    "TargetRegion": {
      "Description": "Target region for migration",
      "Type": "String",
      "Default": "eu-central-1"
    }
  },

  "Conditions": {
    "IsSourceRegion": {
      "Fn::Equals": [
        { "Ref": "AWS::Region" },
        { "Ref": "SourceRegion" }
      ]
    },
    "IsTargetRegion": {
      "Fn::Equals": [
        { "Ref": "AWS::Region" },
        { "Ref": "TargetRegion" }
      ]
    }
  },

  "Resources": {
    "TradingDataBucket": {
      "Type": "AWS::S3::Bucket",
      "Properties": {
        "BucketName": {
          "Fn::Sub": "trading-data-${EnvironmentSuffix}-${AWS::Region}"
        },
        "VersioningConfiguration": {
          "Status": "Enabled"
        },
        "ReplicationConfiguration": {
          "Role": { "Fn::GetAtt": ["S3ReplicationRole", "Arn"] },
          "Rules": [
            {
              "Id": "ReplicateAll",
              "Status": "Enabled",
              "Priority": 1,
              "Filter": {},
              "Destination": {
                "Bucket": {
                  "Fn::Sub": "arn:aws:s3:::trading-data-${EnvironmentSuffix}-${TargetRegion}"
                },
                "ReplicationTime": {
                  "Status": "Enabled",
                  "Time": {
                    "Minutes": 15
                  }
                },
                "Metrics": {
                  "Status": "Enabled",
                  "EventThreshold": {
                    "Minutes": 15
                  }
                }
              }
            }
          ]
        },
        "LifecycleConfiguration": {
          "Rules": [
            {
              "Id": "TransitionToIA",
              "Status": "Enabled",
              "Transitions": [
                {
                  "StorageClass": "STANDARD_IA",
                  "TransitionInDays": 90
                }
              ]
            }
          ]
        }
      }
    },

    "S3ReplicationRole": {
      "Type": "AWS::IAM::Role",
      "Properties": {
        "AssumeRolePolicyDocument": {
          "Version": "2012-10-17",
          "Statement": [
            {
              "Effect": "Allow",
              "Principal": {
                "Service": "s3.amazonaws.com"
              },
              "Action": "sts:AssumeRole"
            }
          ]
        },
        "Policies": [
          {
            "PolicyName": "S3ReplicationPolicy",
            "PolicyDocument": {
              "Version": "2012-10-17",
              "Statement": [
                {
                  "Effect": "Allow",
                  "Action": [
                    "s3:GetReplicationConfiguration",
                    "s3:ListBucket"
                  ],
                  "Resource": {
                    "Fn::GetAtt": ["TradingDataBucket", "Arn"]
                  }
                },
                {
                  "Effect": "Allow",
                  "Action": [
                    "s3:GetObjectVersionForReplication",
                    "s3:GetObjectVersionAcl"
                  ],
                  "Resource": {
                    "Fn::Sub": "${TradingDataBucket.Arn}/*"
                  }
                },
                {
                  "Effect": "Allow",
                  "Action": [
                    "s3:ReplicateObject",
                    "s3:ReplicateDelete"
                  ],
                  "Resource": {
                    "Fn::Sub": "arn:aws:s3:::trading-data-${EnvironmentSuffix}-${TargetRegion}/*"
                  }
                }
              ]
            }
          }
        ]
      }
    },

    "TradingAnalyticsTable": {
      "Type": "AWS::DynamoDB::Table",
      "Properties": {
        "TableName": {
          "Fn::Sub": "trading-analytics-${EnvironmentSuffix}"
        },
        "BillingMode": "PAY_PER_REQUEST",
        "AttributeDefinitions": [
          {
            "AttributeName": "TradeId",
            "AttributeType": "S"
          },
          {
            "AttributeName": "Timestamp",
            "AttributeType": "N"
          }
        ],
        "KeySchema": [
          {
            "AttributeName": "TradeId",
            "KeyType": "HASH"
          },
          {
            "AttributeName": "Timestamp",
            "KeyType": "RANGE"
          }
        ],
        "StreamSpecification": {
          "StreamViewType": "NEW_AND_OLD_IMAGES"
        },
        "SSESpecification": {
          "SSEEnabled": true
        },
        "PointInTimeRecoverySpecification": {
          "PointInTimeRecoveryEnabled": true
        }
      }
    },

    "AnalyticsFunction": {
      "Type": "AWS::Lambda::Function",
      "Properties": {
        "FunctionName": {
          "Fn::Sub": "analytics-processor-${EnvironmentSuffix}"
        },
        "Runtime": "python3.9",
        "Handler": "index.handler",
        "Role": { "Fn::GetAtt": ["LambdaExecutionRole", "Arn"] },
        "Code": {
          "ZipFile": "import json\nimport boto3\n\ndef handler(event, context):\n    print('Processing analytics event')\n    return {'statusCode': 200, 'body': json.dumps('Success')}"
        },
        "Environment": {
          "Variables": {
            "TABLE_NAME": { "Ref": "TradingAnalyticsTable" },
            "REGION": { "Ref": "AWS::Region" }
          }
        }
      }
    },

    "LambdaExecutionRole": {
      "Type": "AWS::IAM::Role",
      "Properties": {
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
            "PolicyName": "DynamoDBAccess",
            "PolicyDocument": {
              "Version": "2012-10-17",
              "Statement": [
                {
                  "Effect": "Allow",
                  "Action": [
                    "dynamodb:GetItem",
                    "dynamodb:PutItem",
                    "dynamodb:Query",
                    "dynamodb:UpdateItem"
                  ],
                  "Resource": { "Fn::GetAtt": ["TradingAnalyticsTable", "Arn"] }
                }
              ]
            }
          }
        ]
      }
    },

    "ConfigParameter": {
      "Type": "AWS::SSM::Parameter",
      "Properties": {
        "Name": {
          "Fn::Sub": "/trading-platform/${EnvironmentSuffix}/config"
        },
        "Type": "String",
        "Value": {
          "Fn::Sub": "{\"region\":\"${AWS::Region}\",\"bucket\":\"${TradingDataBucket}\",\"table\":\"${TradingAnalyticsTable}\"}"
        },
        "Description": "Trading platform configuration"
      }
    },

    "MigrationEventTopic": {
      "Type": "AWS::SNS::Topic",
      "Properties": {
        "TopicName": {
          "Fn::Sub": "migration-events-${EnvironmentSuffix}"
        },
        "DisplayName": "Migration Event Notifications"
      }
    },

    "MarketDataStream": {
      "Type": "AWS::Kinesis::Stream",
      "Properties": {
        "Name": {
          "Fn::Sub": "market-data-${EnvironmentSuffix}"
        },
        "ShardCount": 5,
        "RetentionPeriodHours": 168
      }
    },

    "TradingVPC": {
      "Type": "AWS::EC2::VPC",
      "Properties": {
        "CidrBlock": "10.0.0.0/16",
        "EnableDnsHostnames": true,
        "EnableDnsSupport": true,
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "trading-vpc-${EnvironmentSuffix}"
            }
          }
        ]
      }
    },

    "PublicSubnet1": {
      "Type": "AWS::EC2::Subnet",
      "Properties": {
        "VpcId": { "Ref": "TradingVPC" },
        "CidrBlock": "10.0.1.0/24",
        "AvailabilityZone": {
          "Fn::Select": [0, { "Fn::GetAZs": "" }]
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "public-subnet-1-${EnvironmentSuffix}"
            }
          }
        ]
      }
    },

    "PrivateSubnet1": {
      "Type": "AWS::EC2::Subnet",
      "Properties": {
        "VpcId": { "Ref": "TradingVPC" },
        "CidrBlock": "10.0.10.0/24",
        "AvailabilityZone": {
          "Fn::Select": [0, { "Fn::GetAZs": "" }]
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "private-subnet-1-${EnvironmentSuffix}"
            }
          }
        ]
      }
    },

    "InternetGateway": {
      "Type": "AWS::EC2::InternetGateway",
      "Properties": {
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "trading-igw-${EnvironmentSuffix}"
            }
          }
        ]
      }
    },

    "AttachGateway": {
      "Type": "AWS::EC2::VPCGatewayAttachment",
      "Properties": {
        "VpcId": { "Ref": "TradingVPC" },
        "InternetGatewayId": { "Ref": "InternetGateway" }
      }
    },

    "MonitoringDashboard": {
      "Type": "AWS::CloudWatch::Dashboard",
      "Properties": {
        "DashboardName": {
          "Fn::Sub": "trading-migration-${EnvironmentSuffix}"
        },
        "DashboardBody": {
          "Fn::Sub": "{\"widgets\":[{\"type\":\"metric\",\"properties\":{\"metrics\":[[\"AWS/S3\",\"BucketSizeBytes\",{\"stat\":\"Average\"}]],\"period\":300,\"stat\":\"Average\",\"region\":\"${AWS::Region}\",\"title\":\"S3 Bucket Size\"}}]}"
        }
      }
    },

    "MigrationStateTable": {
      "Type": "AWS::DynamoDB::Table",
      "Properties": {
        "TableName": {
          "Fn::Sub": "migration-state-${EnvironmentSuffix}"
        },
        "BillingMode": "PAY_PER_REQUEST",
        "AttributeDefinitions": [
          {
            "AttributeName": "MigrationId",
            "AttributeType": "S"
          }
        ],
        "KeySchema": [
          {
            "AttributeName": "MigrationId",
            "KeyType": "HASH"
          }
        ]
      }
    }
  },

  "Outputs": {
    "TradingDataBucketName": {
      "Description": "Trading data S3 bucket name",
      "Value": { "Ref": "TradingDataBucket" },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-DataBucket"
        }
      }
    },
    "TradingAnalyticsTableName": {
      "Description": "DynamoDB table name for analytics",
      "Value": { "Ref": "TradingAnalyticsTable" },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-AnalyticsTable"
        }
      }
    },
    "AnalyticsFunctionArn": {
      "Description": "Analytics Lambda function ARN",
      "Value": { "Fn::GetAtt": ["AnalyticsFunction", "Arn"] }
    },
    "MigrationTopicArn": {
      "Description": "SNS topic ARN for migration events",
      "Value": { "Ref": "MigrationEventTopic" }
    },
    "MarketDataStreamArn": {
      "Description": "Kinesis stream ARN for market data",
      "Value": { "Fn::GetAtt": ["MarketDataStream", "Arn"] }
    },
    "VPCId": {
      "Description": "Trading VPC ID",
      "Value": { "Ref": "TradingVPC" },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-VPC"
        }
      }
    }
  }
}
```

## Deployment Instructions

### Prerequisites

1. AWS CLI v2 installed and configured
2. CloudFormation StackSets enabled in your AWS Organization
3. Proper IAM permissions for StackSet operations

### Deploy the StackSet

```bash
# Create the StackSet
aws cloudformation create-stack-set \
  --stack-set-name trading-migration-stackset \
  --template-body file://lib/TapStack.json \
  --parameters \
    ParameterKey=EnvironmentSuffix,ParameterValue=prod-2024 \
  --capabilities CAPABILITY_IAM

# Deploy to regions
aws cloudformation create-stack-instances \
  --stack-set-name trading-migration-stackset \
  --regions us-east-1 eu-central-1 \
  --parameter-overrides \
    ParameterKey=EnvironmentSuffix,ParameterValue=prod-2024
```

## Known Limitations

This initial implementation has several areas that need improvement in the production version:

1. S3 replication assumes destination bucket exists
2. DynamoDB Global Tables configuration is incomplete
3. VPC peering between regions not implemented
4. Lambda function code is placeholder only
5. CloudWatch dashboard metrics are basic
6. No Route 53 health checks or failover configuration
7. No EventBridge rules for migration orchestration
8. No AWS Backup cross-region verification
9. Missing custom CloudFormation resources for migration tracking
10. IAM cross-region trust relationships need enhancement
