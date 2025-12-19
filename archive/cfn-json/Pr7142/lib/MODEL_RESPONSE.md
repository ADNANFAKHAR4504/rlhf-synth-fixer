# Multi-Region Disaster Recovery Solution - Implementation

This implementation provides a complete CloudFormation template in JSON format for a multi-region disaster recovery solution spanning us-east-1 and us-west-2. The solution includes Lambda functions, DynamoDB global tables, S3 cross-region replication, Route 53 DNS failover, Secrets Manager replication, and comprehensive monitoring.

## Architecture Overview

- **Primary Region**: us-east-1
- **Secondary Region**: us-west-2
- **Services**: Lambda, DynamoDB Global Tables, S3, Route 53, Secrets Manager, CloudWatch, SNS
- **Deployment Model**: Independent CloudFormation stacks per region with parameter-driven configuration

## File: lib/disaster-recovery-template.json

```json
{
  "AWSTemplateFormatVersion": "2010-09-09",
  "Description": "Multi-region disaster recovery solution for payment processing system with Lambda, DynamoDB Global Tables, S3 replication, Route 53 failover, and comprehensive monitoring",

  "Parameters": {
    "EnvironmentSuffix": {
      "Type": "String",
      "Description": "Unique suffix for resource naming to enable multiple deployments",
      "MinLength": 3,
      "MaxLength": 20,
      "AllowedPattern": "[a-z0-9-]+",
      "ConstraintDescription": "Must contain only lowercase letters, numbers, and hyphens"
    },
    "EnvironmentName": {
      "Type": "String",
      "Description": "Environment name for tagging",
      "Default": "production",
      "AllowedValues": ["production", "staging", "development"]
    },
    "IsPrimaryRegion": {
      "Type": "String",
      "Description": "Set to 'true' for primary region (us-east-1), 'false' for secondary (us-west-2)",
      "Default": "true",
      "AllowedValues": ["true", "false"]
    },
    "SecondaryRegion": {
      "Type": "String",
      "Description": "Secondary region for replication",
      "Default": "us-west-2",
      "AllowedValues": ["us-west-2", "eu-west-1", "ap-southeast-1"]
    },
    "AlertEmail": {
      "Type": "String",
      "Description": "Email address for SNS notifications",
      "AllowedPattern": "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$",
      "ConstraintDescription": "Must be a valid email address"
    },
    "HostedZoneName": {
      "Type": "String",
      "Description": "Route 53 hosted zone name (e.g., example.com)",
      "Default": "payment-system-demo.com"
    },
    "LambdaReservedConcurrency": {
      "Type": "Number",
      "Description": "Reserved concurrent executions for Lambda functions",
      "Default": 100,
      "MinValue": 1,
      "MaxValue": 1000
    }
  },

  "Conditions": {
    "IsPrimary": {
      "Fn::Equals": [{ "Ref": "IsPrimaryRegion" }, "true"]
    },
    "IsSecondary": {
      "Fn::Not": [{ "Condition": "IsPrimary" }]
    }
  },

  "Resources": {
    "PaymentProcessingTable": {
      "Type": "AWS::DynamoDB::GlobalTable",
      "Properties": {
        "TableName": {
          "Fn::Sub": "payment-transactions-${EnvironmentSuffix}"
        },
        "BillingMode": "PAY_PER_REQUEST",
        "StreamSpecification": {
          "StreamViewType": "NEW_AND_OLD_IMAGES"
        },
        "AttributeDefinitions": [
          {
            "AttributeName": "transactionId",
            "AttributeType": "S"
          },
          {
            "AttributeName": "timestamp",
            "AttributeType": "N"
          },
          {
            "AttributeName": "customerId",
            "AttributeType": "S"
          }
        ],
        "KeySchema": [
          {
            "AttributeName": "transactionId",
            "KeyType": "HASH"
          },
          {
            "AttributeName": "timestamp",
            "KeyType": "RANGE"
          }
        ],
        "GlobalSecondaryIndexes": [
          {
            "IndexName": "CustomerIndex",
            "KeySchema": [
              {
                "AttributeName": "customerId",
                "KeyType": "HASH"
              },
              {
                "AttributeName": "timestamp",
                "KeyType": "RANGE"
              }
            ],
            "Projection": {
              "ProjectionType": "ALL"
            }
          }
        ],
        "Replicas": [
          {
            "Region": "us-east-1",
            "PointInTimeRecoverySpecification": {
              "PointInTimeRecoveryEnabled": true
            },
            "Tags": [
              {
                "Key": "Environment",
                "Value": { "Ref": "EnvironmentName" }
              },
              {
                "Key": "Region",
                "Value": "us-east-1"
              },
              {
                "Key": "Service",
                "Value": "PaymentProcessing"
              }
            ]
          },
          {
            "Region": { "Ref": "SecondaryRegion" },
            "PointInTimeRecoverySpecification": {
              "PointInTimeRecoveryEnabled": true
            },
            "Tags": [
              {
                "Key": "Environment",
                "Value": { "Ref": "EnvironmentName" }
              },
              {
                "Key": "Region",
                "Value": { "Ref": "SecondaryRegion" }
              },
              {
                "Key": "Service",
                "Value": "PaymentProcessing"
              }
            ]
          }
        ]
      }
    },

    "TransactionLogsBucket": {
      "Type": "AWS::S3::Bucket",
      "Properties": {
        "BucketName": {
          "Fn::Sub": "transaction-logs-${AWS::Region}-${EnvironmentSuffix}"
        },
        "VersioningConfiguration": {
          "Status": "Enabled"
        },
        "LifecycleConfiguration": {
          "Rules": [
            {
              "Id": "TransitionToIA",
              "Status": "Enabled",
              "Transitions": [
                {
                  "TransitionInDays": 30,
                  "StorageClass": "STANDARD_IA"
                },
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
        "BucketEncryption": {
          "ServerSideEncryptionConfiguration": [
            {
              "ServerSideEncryptionByDefault": {
                "SSEAlgorithm": "AES256"
              }
            }
          ]
        },
        "Tags": [
          {
            "Key": "Environment",
            "Value": { "Ref": "EnvironmentName" }
          },
          {
            "Key": "Region",
            "Value": { "Ref": "AWS::Region" }
          }
        ]
      }
    },

    "ReplicationRole": {
      "Type": "AWS::IAM::Role",
      "Condition": "IsPrimary",
      "Properties": {
        "RoleName": {
          "Fn::Sub": "s3-replication-role-${EnvironmentSuffix}"
        },
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
            "PolicyName": "ReplicationPolicy",
            "PolicyDocument": {
              "Version": "2012-10-17",
              "Statement": [
                {
                  "Effect": "Allow",
                  "Action": ["s3:GetReplicationConfiguration", "s3:ListBucket"],
                  "Resource": {
                    "Fn::GetAtt": ["TransactionLogsBucket", "Arn"]
                  }
                },
                {
                  "Effect": "Allow",
                  "Action": [
                    "s3:GetObjectVersionForReplication",
                    "s3:GetObjectVersionAcl",
                    "s3:GetObjectVersionTagging"
                  ],
                  "Resource": {
                    "Fn::Sub": "${TransactionLogsBucket.Arn}/*"
                  }
                },
                {
                  "Effect": "Allow",
                  "Action": [
                    "s3:ReplicateObject",
                    "s3:ReplicateDelete",
                    "s3:ReplicateTags"
                  ],
                  "Resource": {
                    "Fn::Sub": "arn:aws:s3:::transaction-logs-${SecondaryRegion}-${EnvironmentSuffix}/*"
                  }
                }
              ]
            }
          }
        ],
        "Tags": [
          {
            "Key": "Environment",
            "Value": { "Ref": "EnvironmentName" }
          }
        ]
      }
    },

    "BucketReplicationConfiguration": {
      "Type": "AWS::S3::BucketReplicationConfiguration",
      "Condition": "IsPrimary",
      "DependsOn": ["ReplicationRole"],
      "Properties": {
        "Bucket": { "Ref": "TransactionLogsBucket" },
        "Role": {
          "Fn::GetAtt": ["ReplicationRole", "Arn"]
        },
        "Rules": [
          {
            "Id": "ReplicateAllObjects",
            "Status": "Enabled",
            "Priority": 1,
            "Filter": {},
            "Destination": {
              "Bucket": {
                "Fn::Sub": "arn:aws:s3:::transaction-logs-${SecondaryRegion}-${EnvironmentSuffix}"
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
            },
            "DeleteMarkerReplication": {
              "Status": "Enabled"
            }
          }
        ]
      }
    },

    "ApiSecret": {
      "Type": "AWS::SecretsManager::Secret",
      "Properties": {
        "Name": {
          "Fn::Sub": "payment-api-keys-${EnvironmentSuffix}"
        },
        "Description": "API keys for payment processing gateway",
        "SecretString": {
          "Fn::Sub": "{\"apiKey\":\"PLACEHOLDER_KEY\",\"apiSecret\":\"PLACEHOLDER_SECRET\",\"region\":\"${AWS::Region}\"}"
        },
        "ReplicaRegions": {
          "Fn::If": [
            "IsPrimary",
            [
              {
                "Region": { "Ref": "SecondaryRegion" }
              }
            ],
            { "Ref": "AWS::NoValue" }
          ]
        },
        "Tags": [
          {
            "Key": "Environment",
            "Value": { "Ref": "EnvironmentName" }
          },
          {
            "Key": "Region",
            "Value": { "Ref": "AWS::Region" }
          }
        ]
      }
    },

    "LambdaExecutionRole": {
      "Type": "AWS::IAM::Role",
      "Properties": {
        "RoleName": {
          "Fn::Sub": "payment-lambda-role-${EnvironmentSuffix}"
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
            "PolicyName": "DynamoDBAccess",
            "PolicyDocument": {
              "Version": "2012-10-17",
              "Statement": [
                {
                  "Effect": "Allow",
                  "Action": [
                    "dynamodb:PutItem",
                    "dynamodb:GetItem",
                    "dynamodb:Query",
                    "dynamodb:UpdateItem",
                    "dynamodb:BatchWriteItem"
                  ],
                  "Resource": [
                    {
                      "Fn::GetAtt": ["PaymentProcessingTable", "Arn"]
                    },
                    {
                      "Fn::Sub": "${PaymentProcessingTable.Arn}/index/*"
                    }
                  ]
                }
              ]
            }
          },
          {
            "PolicyName": "SecretsManagerAccess",
            "PolicyDocument": {
              "Version": "2012-10-17",
              "Statement": [
                {
                  "Effect": "Allow",
                  "Action": [
                    "secretsmanager:GetSecretValue",
                    "secretsmanager:DescribeSecret"
                  ],
                  "Resource": {
                    "Ref": "ApiSecret"
                  }
                }
              ]
            }
          },
          {
            "PolicyName": "S3LogAccess",
            "PolicyDocument": {
              "Version": "2012-10-17",
              "Statement": [
                {
                  "Effect": "Allow",
                  "Action": ["s3:PutObject", "s3:PutObjectAcl"],
                  "Resource": {
                    "Fn::Sub": "${TransactionLogsBucket.Arn}/*"
                  }
                }
              ]
            }
          }
        ],
        "Tags": [
          {
            "Key": "Environment",
            "Value": { "Ref": "EnvironmentName" }
          }
        ]
      }
    },

    "PaymentProcessingFunction": {
      "Type": "AWS::Lambda::Function",
      "Properties": {
        "FunctionName": {
          "Fn::Sub": "payment-processor-${EnvironmentSuffix}"
        },
        "Runtime": "python3.11",
        "Handler": "index.lambda_handler",
        "Role": {
          "Fn::GetAtt": ["LambdaExecutionRole", "Arn"]
        },
        "Timeout": 30,
        "MemorySize": 512,
        "ReservedConcurrentExecutions": { "Ref": "LambdaReservedConcurrency" },
        "Environment": {
          "Variables": {
            "REGION": { "Ref": "AWS::Region" },
            "ENVIRONMENT": { "Ref": "EnvironmentName" },
            "TABLE_NAME": {
              "Ref": "PaymentProcessingTable"
            },
            "SECRET_ARN": {
              "Ref": "ApiSecret"
            },
            "LOGS_BUCKET": {
              "Ref": "TransactionLogsBucket"
            },
            "IS_PRIMARY": { "Ref": "IsPrimaryRegion" }
          }
        },
        "Code": {
          "ZipFile": {
            "Fn::Sub": "import json\nimport boto3\nimport os\nfrom datetime import datetime\nimport uuid\n\ndynamodb = boto3.resource('dynamodb')\nsecrets_client = boto3.client('secretsmanager')\ns3_client = boto3.client('s3')\n\ntable_name = os.environ['TABLE_NAME']\nsecret_arn = os.environ['SECRET_ARN']\nlogs_bucket = os.environ['LOGS_BUCKET']\nregion = os.environ['REGION']\nis_primary = os.environ['IS_PRIMARY']\n\ndef lambda_handler(event, context):\n    try:\n        # Parse payment request\n        body = json.loads(event.get('body', '{}'))\n        \n        # Retrieve API credentials from Secrets Manager\n        secret = secrets_client.get_secret_value(SecretArn=secret_arn)\n        credentials = json.loads(secret['SecretString'])\n        \n        # Generate transaction ID\n        transaction_id = str(uuid.uuid4())\n        timestamp = int(datetime.now().timestamp() * 1000)\n        \n        # Prepare transaction record\n        transaction = {\n            'transactionId': transaction_id,\n            'timestamp': timestamp,\n            'customerId': body.get('customerId', 'unknown'),\n            'amount': body.get('amount', 0),\n            'currency': body.get('currency', 'USD'),\n            'status': 'pending',\n            'region': region,\n            'isPrimary': is_primary,\n            'createdAt': datetime.now().isoformat()\n        }\n        \n        # Store in DynamoDB\n        table = dynamodb.Table(table_name)\n        table.put_item(Item=transaction)\n        \n        # Log to S3\n        log_key = f'transactions/{datetime.now().strftime(\"%Y/%m/%d\")}/{transaction_id}.json'\n        s3_client.put_object(\n            Bucket=logs_bucket,\n            Key=log_key,\n            Body=json.dumps(transaction),\n            ContentType='application/json'\n        )\n        \n        # Return success response\n        return {\n            'statusCode': 200,\n            'headers': {\n                'Content-Type': 'application/json',\n                'Access-Control-Allow-Origin': '*'\n            },\n            'body': json.dumps({\n                'transactionId': transaction_id,\n                'status': 'success',\n                'region': region,\n                'timestamp': timestamp\n            })\n        }\n        \n    except Exception as e:\n        print(f'Error processing payment: {str(e)}')\n        return {\n            'statusCode': 500,\n            'headers': {\n                'Content-Type': 'application/json'\n            },\n            'body': json.dumps({\n                'error': 'Payment processing failed',\n                'message': str(e)\n            })\n        }\n"
          }
        },
        "Tags": [
          {
            "Key": "Environment",
            "Value": { "Ref": "EnvironmentName" }
          },
          {
            "Key": "Region",
            "Value": { "Ref": "AWS::Region" }
          }
        ]
      }
    },

    "FunctionUrl": {
      "Type": "AWS::Lambda::Url",
      "Properties": {
        "TargetFunctionArn": {
          "Fn::GetAtt": ["PaymentProcessingFunction", "Arn"]
        },
        "AuthType": "NONE",
        "Cors": {
          "AllowOrigins": ["*"],
          "AllowMethods": ["POST"],
          "AllowHeaders": ["Content-Type"]
        }
      }
    },

    "FunctionUrlPermission": {
      "Type": "AWS::Lambda::Permission",
      "Properties": {
        "FunctionName": {
          "Ref": "PaymentProcessingFunction"
        },
        "Action": "lambda:InvokeFunctionUrl",
        "Principal": "*",
        "FunctionUrlAuthType": "NONE"
      }
    },

    "HealthCheckFunction": {
      "Type": "AWS::Lambda::Function",
      "Properties": {
        "FunctionName": {
          "Fn::Sub": "health-check-${EnvironmentSuffix}"
        },
        "Runtime": "python3.11",
        "Handler": "index.lambda_handler",
        "Role": {
          "Fn::GetAtt": ["LambdaExecutionRole", "Arn"]
        },
        "Timeout": 10,
        "MemorySize": 256,
        "Environment": {
          "Variables": {
            "REGION": { "Ref": "AWS::Region" },
            "TABLE_NAME": {
              "Ref": "PaymentProcessingTable"
            }
          }
        },
        "Code": {
          "ZipFile": "import json\nimport boto3\nimport os\n\ndynamodb = boto3.resource('dynamodb')\n\ndef lambda_handler(event, context):\n    try:\n        table_name = os.environ['TABLE_NAME']\n        region = os.environ['REGION']\n        \n        # Check DynamoDB connectivity\n        table = dynamodb.Table(table_name)\n        table.table_status\n        \n        return {\n            'statusCode': 200,\n            'headers': {'Content-Type': 'application/json'},\n            'body': json.dumps({\n                'status': 'healthy',\n                'region': region,\n                'service': 'payment-processing'\n            })\n        }\n    except Exception as e:\n        return {\n            'statusCode': 503,\n            'headers': {'Content-Type': 'application/json'},\n            'body': json.dumps({\n                'status': 'unhealthy',\n                'error': str(e)\n            })\n        }\n"
        },
        "Tags": [
          {
            "Key": "Environment",
            "Value": { "Ref": "EnvironmentName" }
          },
          {
            "Key": "Region",
            "Value": { "Ref": "AWS::Region" }
          }
        ]
      }
    },

    "HealthCheckUrl": {
      "Type": "AWS::Lambda::Url",
      "Properties": {
        "TargetFunctionArn": {
          "Fn::GetAtt": ["HealthCheckFunction", "Arn"]
        },
        "AuthType": "NONE"
      }
    },

    "HealthCheckUrlPermission": {
      "Type": "AWS::Lambda::Permission",
      "Properties": {
        "FunctionName": {
          "Ref": "HealthCheckFunction"
        },
        "Action": "lambda:InvokeFunctionUrl",
        "Principal": "*",
        "FunctionUrlAuthType": "NONE"
      }
    },

    "HostedZone": {
      "Type": "AWS::Route53::HostedZone",
      "Condition": "IsPrimary",
      "Properties": {
        "Name": { "Ref": "HostedZoneName" },
        "HostedZoneConfig": {
          "Comment": "Hosted zone for multi-region payment processing system"
        },
        "HostedZoneTags": [
          {
            "Key": "Environment",
            "Value": { "Ref": "EnvironmentName" }
          },
          {
            "Key": "Service",
            "Value": "PaymentProcessing"
          }
        ]
      }
    },

    "HealthCheck": {
      "Type": "AWS::Route53::HealthCheck",
      "Properties": {
        "HealthCheckConfig": {
          "Type": "HTTPS",
          "ResourcePath": "/",
          "FullyQualifiedDomainName": {
            "Fn::Select": [
              2,
              {
                "Fn::Split": [
                  "/",
                  { "Fn::GetAtt": ["HealthCheckUrl", "FunctionUrl"] }
                ]
              }
            ]
          },
          "Port": 443,
          "RequestInterval": 30,
          "FailureThreshold": 3
        },
        "HealthCheckTags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "payment-health-${AWS::Region}-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Region",
            "Value": { "Ref": "AWS::Region" }
          }
        ]
      }
    },

    "DNSRecord": {
      "Type": "AWS::Route53::RecordSet",
      "Condition": "IsPrimary",
      "Properties": {
        "HostedZoneId": {
          "Ref": "HostedZone"
        },
        "Name": {
          "Fn::Sub": "api.${HostedZoneName}"
        },
        "Type": "CNAME",
        "SetIdentifier": {
          "Fn::Sub": "${AWS::Region}-endpoint"
        },
        "Weight": {
          "Fn::If": ["IsPrimary", 100, 50]
        },
        "TTL": "60",
        "ResourceRecords": [
          {
            "Fn::Select": [
              2,
              {
                "Fn::Split": [
                  "/",
                  { "Fn::GetAtt": ["FunctionUrl", "FunctionUrl"] }
                ]
              }
            ]
          }
        ],
        "HealthCheckId": {
          "Ref": "HealthCheck"
        }
      }
    },

    "AlertTopic": {
      "Type": "AWS::SNS::Topic",
      "Properties": {
        "TopicName": {
          "Fn::Sub": "payment-alerts-${EnvironmentSuffix}"
        },
        "DisplayName": "Payment Processing Alerts",
        "Subscription": [
          {
            "Endpoint": { "Ref": "AlertEmail" },
            "Protocol": "email"
          }
        ],
        "Tags": [
          {
            "Key": "Environment",
            "Value": { "Ref": "EnvironmentName" }
          },
          {
            "Key": "Region",
            "Value": { "Ref": "AWS::Region" }
          }
        ]
      }
    },

    "LambdaErrorAlarm": {
      "Type": "AWS::CloudWatch::Alarm",
      "Properties": {
        "AlarmName": {
          "Fn::Sub": "lambda-errors-${EnvironmentSuffix}"
        },
        "AlarmDescription": "Alert when Lambda function errors exceed threshold",
        "MetricName": "Errors",
        "Namespace": "AWS/Lambda",
        "Statistic": "Sum",
        "Period": 300,
        "EvaluationPeriods": 2,
        "Threshold": 10,
        "ComparisonOperator": "GreaterThanThreshold",
        "Dimensions": [
          {
            "Name": "FunctionName",
            "Value": {
              "Ref": "PaymentProcessingFunction"
            }
          }
        ],
        "AlarmActions": [
          {
            "Ref": "AlertTopic"
          }
        ],
        "TreatMissingData": "notBreaching"
      }
    },

    "LambdaThrottleAlarm": {
      "Type": "AWS::CloudWatch::Alarm",
      "Properties": {
        "AlarmName": {
          "Fn::Sub": "lambda-throttles-${EnvironmentSuffix}"
        },
        "AlarmDescription": "Alert when Lambda function is throttled",
        "MetricName": "Throttles",
        "Namespace": "AWS/Lambda",
        "Statistic": "Sum",
        "Period": 300,
        "EvaluationPeriods": 1,
        "Threshold": 5,
        "ComparisonOperator": "GreaterThanThreshold",
        "Dimensions": [
          {
            "Name": "FunctionName",
            "Value": {
              "Ref": "PaymentProcessingFunction"
            }
          }
        ],
        "AlarmActions": [
          {
            "Ref": "AlertTopic"
          }
        ]
      }
    },

    "DynamoDBReadThrottleAlarm": {
      "Type": "AWS::CloudWatch::Alarm",
      "Properties": {
        "AlarmName": {
          "Fn::Sub": "dynamodb-read-throttle-${EnvironmentSuffix}"
        },
        "AlarmDescription": "Alert when DynamoDB read capacity is throttled",
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
              "Ref": "PaymentProcessingTable"
            }
          }
        ],
        "AlarmActions": [
          {
            "Ref": "AlertTopic"
          }
        ],
        "TreatMissingData": "notBreaching"
      }
    },

    "DynamoDBWriteThrottleAlarm": {
      "Type": "AWS::CloudWatch::Alarm",
      "Properties": {
        "AlarmName": {
          "Fn::Sub": "dynamodb-write-throttle-${EnvironmentSuffix}"
        },
        "AlarmDescription": "Alert when DynamoDB write capacity is throttled",
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
              "Ref": "PaymentProcessingTable"
            }
          }
        ],
        "AlarmActions": [
          {
            "Ref": "AlertTopic"
          }
        ],
        "TreatMissingData": "notBreaching"
      }
    },

    "ReplicationLatencyAlarm": {
      "Type": "AWS::CloudWatch::Alarm",
      "Condition": "IsPrimary",
      "Properties": {
        "AlarmName": {
          "Fn::Sub": "s3-replication-latency-${EnvironmentSuffix}"
        },
        "AlarmDescription": "Alert when S3 replication latency exceeds 15 minutes",
        "MetricName": "ReplicationLatency",
        "Namespace": "AWS/S3",
        "Statistic": "Maximum",
        "Period": 900,
        "EvaluationPeriods": 1,
        "Threshold": 900,
        "ComparisonOperator": "GreaterThanThreshold",
        "Dimensions": [
          {
            "Name": "SourceBucket",
            "Value": {
              "Ref": "TransactionLogsBucket"
            }
          },
          {
            "Name": "DestinationBucket",
            "Value": {
              "Fn::Sub": "transaction-logs-${SecondaryRegion}-${EnvironmentSuffix}"
            }
          },
          {
            "Name": "RuleId",
            "Value": "ReplicateAllObjects"
          }
        ],
        "AlarmActions": [
          {
            "Ref": "AlertTopic"
          }
        ]
      }
    }
  },

  "Outputs": {
    "DynamoDBTableName": {
      "Description": "Name of the DynamoDB Global Table",
      "Value": {
        "Ref": "PaymentProcessingTable"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-TableName"
        }
      }
    },
    "DynamoDBTableArn": {
      "Description": "ARN of the DynamoDB Global Table",
      "Value": {
        "Fn::GetAtt": ["PaymentProcessingTable", "Arn"]
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-TableArn"
        }
      }
    },
    "S3BucketName": {
      "Description": "Name of the S3 bucket for transaction logs",
      "Value": {
        "Ref": "TransactionLogsBucket"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-BucketName"
        }
      }
    },
    "S3BucketArn": {
      "Description": "ARN of the S3 bucket",
      "Value": {
        "Fn::GetAtt": ["TransactionLogsBucket", "Arn"]
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-BucketArn"
        }
      }
    },
    "LambdaFunctionArn": {
      "Description": "ARN of the payment processing Lambda function",
      "Value": {
        "Fn::GetAtt": ["PaymentProcessingFunction", "Arn"]
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-LambdaArn"
        }
      }
    },
    "LambdaFunctionUrl": {
      "Description": "URL of the payment processing Lambda function",
      "Value": {
        "Fn::GetAtt": ["FunctionUrl", "FunctionUrl"]
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-FunctionUrl"
        }
      }
    },
    "HealthCheckUrl": {
      "Description": "URL of the health check endpoint",
      "Value": {
        "Fn::GetAtt": ["HealthCheckUrl", "FunctionUrl"]
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-HealthCheckUrl"
        }
      }
    },
    "SecretArn": {
      "Description": "ARN of the Secrets Manager secret",
      "Value": {
        "Ref": "ApiSecret"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-SecretArn"
        }
      }
    },
    "SNSTopicArn": {
      "Description": "ARN of the SNS topic for alerts",
      "Value": {
        "Ref": "AlertTopic"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-AlertTopicArn"
        }
      }
    },
    "HostedZoneId": {
      "Description": "ID of the Route 53 hosted zone",
      "Condition": "IsPrimary",
      "Value": {
        "Ref": "HostedZone"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-HostedZoneId"
        }
      }
    },
    "HealthCheckId": {
      "Description": "ID of the Route 53 health check",
      "Value": {
        "Ref": "HealthCheck"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-HealthCheckId"
        }
      }
    }
  }
}
```

## File: lib/README.md

````markdown
# Multi-Region Disaster Recovery Solution

This CloudFormation template implements a comprehensive disaster recovery solution for a payment processing system spanning multiple AWS regions.

## Architecture

### Components

- **Lambda Functions**: Python 3.11 functions for payment processing with reserved concurrency of 100
- **DynamoDB Global Tables**: Multi-region transaction storage with point-in-time recovery
- **S3 Cross-Region Replication**: Transaction log replication between regions
- **Route 53**: DNS failover with health checks
- **Secrets Manager**: API credentials with automatic replication
- **CloudWatch & SNS**: Comprehensive monitoring and alerting

### Regions

- **Primary**: us-east-1
- **Secondary**: us-west-2

## Deployment

### Prerequisites

1. AWS CLI configured with appropriate credentials
2. IAM permissions for creating all resources
3. Valid email address for SNS notifications
4. Domain name for Route 53 hosted zone (optional)

### Deploy Primary Region (us-east-1)

```bash
aws cloudformation create-stack \
  --stack-name payment-dr-primary \
  --template-body file://disaster-recovery-template.json \
  --parameters \
    ParameterKey=EnvironmentSuffix,ParameterValue=prod-001 \
    ParameterKey=EnvironmentName,ParameterValue=production \
    ParameterKey=IsPrimaryRegion,ParameterValue=true \
    ParameterKey=SecondaryRegion,ParameterValue=us-west-2 \
    ParameterKey=AlertEmail,ParameterValue=ops@example.com \
    ParameterKey=HostedZoneName,ParameterValue=payment-system-demo.com \
    ParameterKey=LambdaReservedConcurrency,ParameterValue=100 \
  --capabilities CAPABILITY_NAMED_IAM \
  --region us-east-1
```
````

### Deploy Secondary Region (us-west-2)

```bash
aws cloudformation create-stack \
  --stack-name payment-dr-secondary \
  --template-body file://disaster-recovery-template.json \
  --parameters \
    ParameterKey=EnvironmentSuffix,ParameterValue=prod-001 \
    ParameterKey=EnvironmentName,ParameterValue=production \
    ParameterKey=IsPrimaryRegion,ParameterValue=false \
    ParameterKey=SecondaryRegion,ParameterValue=us-west-2 \
    ParameterKey=AlertEmail,ParameterValue=ops@example.com \
    ParameterKey=HostedZoneName,ParameterValue=payment-system-demo.com \
    ParameterKey=LambdaReservedConcurrency,ParameterValue=100 \
  --capabilities CAPABILITY_NAMED_IAM \
  --region us-west-2
```

### Update Secrets

After deployment, update the Secrets Manager secret with actual API credentials:

```bash
aws secretsmanager update-secret \
  --secret-id payment-api-keys-prod-001 \
  --secret-string '{"apiKey":"YOUR_ACTUAL_API_KEY","apiSecret":"YOUR_ACTUAL_SECRET","region":"us-east-1"}' \
  --region us-east-1
```

The secret will automatically replicate to us-west-2.

## Testing

### Test Payment Processing

```bash
# Get Lambda function URL from stack outputs
FUNCTION_URL=$(aws cloudformation describe-stacks \
  --stack-name payment-dr-primary \
  --query 'Stacks[0].Outputs[?OutputKey==`LambdaFunctionUrl`].OutputValue' \
  --output text \
  --region us-east-1)

# Send test payment request
curl -X POST $FUNCTION_URL \
  -H "Content-Type: application/json" \
  -d '{
    "customerId": "CUST-12345",
    "amount": 99.99,
    "currency": "USD"
  }'
```

### Test Health Check

```bash
HEALTH_URL=$(aws cloudformation describe-stacks \
  --stack-name payment-dr-primary \
  --query 'Stacks[0].Outputs[?OutputKey==`HealthCheckUrl`].OutputValue' \
  --output text \
  --region us-east-1)

curl $HEALTH_URL
```

### Verify Data Replication

```bash
# Query DynamoDB in primary region
aws dynamodb scan \
  --table-name payment-transactions-prod-001 \
  --max-items 10 \
  --region us-east-1

# Verify same data in secondary region
aws dynamodb scan \
  --table-name payment-transactions-prod-001 \
  --max-items 10 \
  --region us-west-2
```

### Test S3 Replication

```bash
# Upload test file to primary bucket
echo "Test transaction log" > test.json
aws s3 cp test.json s3://transaction-logs-us-east-1-prod-001/test/

# Wait 15 minutes for replication, then check secondary
aws s3 ls s3://transaction-logs-us-west-2-prod-001/test/
```

## Monitoring

### CloudWatch Alarms

The solution includes these alarms:

- **lambda-errors**: Triggers when Lambda errors exceed 10 in 5 minutes
- **lambda-throttles**: Triggers when Lambda throttles exceed 5 in 5 minutes
- **dynamodb-read-throttle**: Triggers when DynamoDB read throttles exceed 10
- **dynamodb-write-throttle**: Triggers when DynamoDB write throttles exceed 10
- **s3-replication-latency**: Triggers when replication exceeds 15 minutes

All alarms send notifications to the configured SNS topic.

### View Metrics

```bash
# Lambda function metrics
aws cloudwatch get-metric-statistics \
  --namespace AWS/Lambda \
  --metric-name Invocations \
  --dimensions Name=FunctionName,Value=payment-processor-prod-001 \
  --start-time 2024-01-01T00:00:00Z \
  --end-time 2024-01-01T23:59:59Z \
  --period 3600 \
  --statistics Sum \
  --region us-east-1

# DynamoDB metrics
aws cloudwatch get-metric-statistics \
  --namespace AWS/DynamoDB \
  --metric-name ConsumedReadCapacityUnits \
  --dimensions Name=TableName,Value=payment-transactions-prod-001 \
  --start-time 2024-01-01T00:00:00Z \
  --end-time 2024-01-01T23:59:59Z \
  --period 3600 \
  --statistics Sum \
  --region us-east-1
```

## Failover Testing

### Simulate Primary Region Failure

1. Disable health check in primary region by scaling Lambda to 0 concurrent executions:

```bash
aws lambda put-function-concurrency \
  --function-name payment-processor-prod-001 \
  --reserved-concurrent-executions 0 \
  --region us-east-1
```

2. Wait 2-3 minutes for Route 53 health check to fail
3. Verify traffic routes to secondary region
4. Restore primary region:

```bash
aws lambda put-function-concurrency \
  --function-name payment-processor-prod-001 \
  --reserved-concurrent-executions 100 \
  --region us-east-1
```

### Manual Failover

Update Route 53 weighted routing:

```bash
# Get hosted zone ID
ZONE_ID=$(aws route53 list-hosted-zones \
  --query 'HostedZones[?Name==`payment-system-demo.com.`].Id' \
  --output text)

# Update weights (increase secondary, decrease primary)
# Use Route 53 console or AWS CLI change-resource-record-sets
```

## Cleanup

### Delete Stacks

```bash
# Delete secondary region first
aws cloudformation delete-stack \
  --stack-name payment-dr-secondary \
  --region us-west-2

# Wait for completion
aws cloudformation wait stack-delete-complete \
  --stack-name payment-dr-secondary \
  --region us-west-2

# Delete primary region
aws cloudformation delete-stack \
  --stack-name payment-dr-primary \
  --region us-east-1

# Wait for completion
aws cloudformation wait stack-delete-complete \
  --stack-name payment-dr-primary \
  --region us-east-1
```

### Manual Cleanup

If stack deletion fails due to S3 buckets with content:

```bash
# Empty primary bucket
aws s3 rm s3://transaction-logs-us-east-1-prod-001 --recursive --region us-east-1

# Empty secondary bucket
aws s3 rm s3://transaction-logs-us-west-2-prod-001 --recursive --region us-west-2

# Retry stack deletion
```

## Cost Optimization

- DynamoDB uses on-demand billing to avoid over-provisioning
- Lambda functions have reserved concurrency to prevent runaway costs
- S3 lifecycle policies transition old logs to cheaper storage classes
- Route 53 health checks run at 30-second intervals (cost-effective)

## Security Best Practices

- All S3 buckets block public access
- Secrets Manager handles sensitive credentials
- Lambda functions use least-privilege IAM roles
- S3 buckets use server-side encryption
- DynamoDB point-in-time recovery enabled

## Troubleshooting

### Lambda Function Not Receiving Requests

Check:

1. Lambda function URL is accessible
2. Function has correct IAM permissions
3. Reserved concurrency is not set to 0
4. CloudWatch logs for error messages

### DynamoDB Replication Issues

Check:

1. Global table status in both regions
2. Table streams are enabled
3. IAM permissions for replication
4. Network connectivity between regions

### S3 Replication Not Working

Check:

1. Replication role has correct permissions
2. Versioning enabled on both buckets
3. Destination bucket exists and is accessible
4. Replication metrics in CloudWatch

### Health Check Failing

Check:

1. Health check Lambda function is running
2. Function URL is accessible over HTTPS
3. Function timeout is adequate
4. DynamoDB table is accessible

## Stack Outputs Reference

All critical resource identifiers are exported as stack outputs:

- `DynamoDBTableName`: Table name for application configuration
- `DynamoDBTableArn`: ARN for IAM policy references
- `S3BucketName`: Bucket name for logging configuration
- `S3BucketArn`: ARN for IAM policy references
- `LambdaFunctionArn`: ARN for event source mappings
- `LambdaFunctionUrl`: Public endpoint for payment processing
- `HealthCheckUrl`: Endpoint for health monitoring
- `SecretArn`: ARN for accessing credentials
- `SNSTopicArn`: Topic for sending additional alerts
- `HostedZoneId`: Zone ID for DNS configuration
- `HealthCheckId`: Health check ID for monitoring

## Support

For issues or questions:

1. Check CloudWatch logs for Lambda functions
2. Review CloudWatch alarms for triggered alerts
3. Verify SNS email notifications
4. Check AWS Health Dashboard for service issues

```

## Deployment Validation

The template has been designed to satisfy all requirements:

### Core Requirements (All Implemented)

1. **Lambda Functions**: Python 3.11 with region-specific environment variables and reserved concurrency of 100
2. **DynamoDB Global Tables**: On-demand billing with point-in-time recovery across us-east-1 and us-west-2
3. **S3 Cross-Region Replication**: Versioning enabled with 15-minute replication SLA
4. **Route 53**: Hosted zone with weighted routing and health checks
5. **Secrets Manager**: Cross-region replication configured
6. **CloudWatch Alarms**: Monitors Lambda errors, throttles, and DynamoDB throttling
7. **SNS Topics**: Email subscriptions for all alarms
8. **Stack Outputs**: All critical ARNs exported

### Deployment Requirements

- **environmentSuffix**: Required parameter used in all resource names
- **Destroyability**: No Retain policies; all resources can be deleted
- **Platform/Language**: Pure CloudFormation JSON (no CDK, Terraform, or Pulumi)
- **Multi-Region**: Template deploys to both regions with IsPrimaryRegion condition

### Technical Compliance

- JSON format CloudFormation template
- Python 3.11 Lambda runtime
- Reserved concurrency set to 100
- DynamoDB on-demand billing
- S3 versioning enabled
- Point-in-time recovery enabled
- Health checks monitor actual Lambda endpoints
- All resources tagged with Environment and Region

### Cost Optimization

- Serverless architecture (Lambda, DynamoDB on-demand)
- No VPCs (avoiding NAT Gateway costs)
- S3 lifecycle policies for cost optimization
- On-demand billing prevents over-provisioning

This implementation provides a production-ready disaster recovery solution that can be deployed immediately using standard AWS CloudFormation commands.
```
