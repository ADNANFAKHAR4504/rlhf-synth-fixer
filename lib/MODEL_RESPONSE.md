```json
{
  "AWSTemplateFormatVersion": "2010-09-09",
  "Description": "Large-scale profile migration system with DMS, Lambda, DynamoDB, Neptune, OpenSearch, and monitoring",
  
  "Parameters": {
    "SourceDatabaseEndpoint": {
      "Type": "String",
      "Description": "Cassandra source database endpoint"
    },
    "SourceDatabasePort": {
      "Type": "Number",
      "Default": 9042,
      "Description": "Cassandra database port"
    },
    "NeptuneDBInstanceClass": {
      "Type": "String",
      "Default": "db.r5.12xlarge",
      "Description": "Neptune instance class for handling 890M nodes and 12B edges"
    }
  },
  
  "Resources": {
    "VPC": {
      "Type": "AWS::EC2::VPC",
      "Properties": {
        "CidrBlock": "10.0.0.0/16",
        "EnableDnsHostnames": true,
        "EnableDnsSupport": true,
        "Tags": [
          {
            "Key": "Name",
            "Value": "ProfileMigrationVPC"
          }
        ]
      }
    },
    
    "PrivateSubnet1": {
      "Type": "AWS::EC2::Subnet",
      "Properties": {
        "VpcId": {"Ref": "VPC"},
        "CidrBlock": "10.0.1.0/24",
        "AvailabilityZone": {"Fn::Select": [0, {"Fn::GetAZs": ""}]},
        "Tags": [
          {
            "Key": "Name",
            "Value": "PrivateSubnet1"
          }
        ]
      }
    },
    
    "PrivateSubnet2": {
      "Type": "AWS::EC2::Subnet",
      "Properties": {
        "VpcId": {"Ref": "VPC"},
        "CidrBlock": "10.0.2.0/24",
        "AvailabilityZone": {"Fn::Select": [1, {"Fn::GetAZs": ""}]},
        "Tags": [
          {
            "Key": "Name",
            "Value": "PrivateSubnet2"
          }
        ]
      }
    },
    
    "PublicSubnet1": {
      "Type": "AWS::EC2::Subnet",
      "Properties": {
        "VpcId": {"Ref": "VPC"},
        "CidrBlock": "10.0.10.0/24",
        "MapPublicIpOnLaunch": true,
        "AvailabilityZone": {"Fn::Select": [0, {"Fn::GetAZs": ""}]},
        "Tags": [
          {
            "Key": "Name",
            "Value": "PublicSubnet1"
          }
        ]
      }
    },
    
    "PublicSubnet2": {
      "Type": "AWS::EC2::Subnet",
      "Properties": {
        "VpcId": {"Ref": "VPC"},
        "CidrBlock": "10.0.11.0/24",
        "MapPublicIpOnLaunch": true,
        "AvailabilityZone": {"Fn::Select": [1, {"Fn::GetAZs": ""}]},
        "Tags": [
          {
            "Key": "Name",
            "Value": "PublicSubnet2"
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
            "Value": "ProfileMigrationIGW"
          }
        ]
      }
    },
    
    "AttachGateway": {
      "Type": "AWS::EC2::VPCGatewayAttachment",
      "Properties": {
        "VpcId": {"Ref": "VPC"},
        "InternetGatewayId": {"Ref": "InternetGateway"}
      }
    },
    
    "NATGateway": {
      "Type": "AWS::EC2::NatGateway",
      "Properties": {
        "AllocationId": {"Fn::GetAtt": ["EIPForNAT", "AllocationId"]},
        "SubnetId": {"Ref": "PublicSubnet1"}
      }
    },
    
    "EIPForNAT": {
      "Type": "AWS::EC2::EIP",
      "DependsOn": "AttachGateway",
      "Properties": {
        "Domain": "vpc"
      }
    },
    
    "PrivateRouteTable": {
      "Type": "AWS::EC2::RouteTable",
      "Properties": {
        "VpcId": {"Ref": "VPC"}
      }
    },
    
    "PrivateRoute": {
      "Type": "AWS::EC2::Route",
      "Properties": {
        "RouteTableId": {"Ref": "PrivateRouteTable"},
        "DestinationCidrBlock": "0.0.0.0/0",
        "NatGatewayId": {"Ref": "NATGateway"}
      }
    },
    
    "SubnetRouteTableAssociation1": {
      "Type": "AWS::EC2::SubnetRouteTableAssociation",
      "Properties": {
        "SubnetId": {"Ref": "PrivateSubnet1"},
        "RouteTableId": {"Ref": "PrivateRouteTable"}
      }
    },
    
    "SubnetRouteTableAssociation2": {
      "Type": "AWS::EC2::SubnetRouteTableAssociation",
      "Properties": {
        "SubnetId": {"Ref": "PrivateSubnet2"},
        "RouteTableId": {"Ref": "PrivateRouteTable"}
      }
    },
    
    "S3Bucket": {
      "Type": "AWS::S3::Bucket",
      "Properties": {
        "BucketName": {"Fn::Sub": "profile-migration-${AWS::AccountId}"},
        "VersioningConfiguration": {
          "Status": "Enabled"
        },
        "LifecycleConfiguration": {
          "Rules": [
            {
              "Id": "DeleteOldProfiles",
              "Status": "Enabled",
              "ExpirationInDays": 30
            }
          ]
        },
        "NotificationConfiguration": {
          "LambdaConfigurations": [
            {
              "Event": "s3:ObjectCreated:*",
              "Function": {"Fn::GetAtt": ["TransformValidateLambda", "Arn"]},
              "Filter": {
                "S3Key": {
                  "Rules": [
                    {
                      "Name": "suffix",
                      "Value": ".json"
                    }
                  ]
                }
              }
            }
          ]
        },
        "Tags": [
          {
            "Key": "Purpose",
            "Value": "ProfileMigration"
          }
        ]
      }
    },
    
    "S3BucketLambdaPermission": {
      "Type": "AWS::Lambda::Permission",
      "Properties": {
        "FunctionName": {"Ref": "TransformValidateLambda"},
        "Action": "lambda:InvokeFunction",
        "Principal": "s3.amazonaws.com",
        "SourceAccount": {"Ref": "AWS::AccountId"},
        "SourceArn": {"Fn::Sub": "arn:aws:s3:::profile-migration-${AWS::AccountId}"}
      }
    },
    
    "DynamoDBTable": {
      "Type": "AWS::DynamoDB::Table",
      "Properties": {
        "TableName": "ProfileMigrationTable",
        "AttributeDefinitions": [
          {
            "AttributeName": "user_id",
            "AttributeType": "S"
          },
          {
            "AttributeName": "timestamp",
            "AttributeType": "N"
          }
        ],
        "KeySchema": [
          {
            "AttributeName": "user_id",
            "KeyType": "HASH"
          },
          {
            "AttributeName": "timestamp",
            "KeyType": "RANGE"
          }
        ],
        "BillingMode": "PROVISIONED",
        "ProvisionedThroughput": {
          "ReadCapacityUnits": 70000,
          "WriteCapacityUnits": 70000
        },
        "StreamSpecification": {
          "StreamViewType": "NEW_AND_OLD_IMAGES"
        },
        "PointInTimeRecoverySpecification": {
          "PointInTimeRecoveryEnabled": true
        },
        "Tags": [
          {
            "Key": "Purpose",
            "Value": "ProfileMigration"
          }
        ]
      }
    },
    
    "DynamoDBAutoScalingRole": {
      "Type": "AWS::IAM::Role",
      "Properties": {
        "AssumeRolePolicyDocument": {
          "Version": "2012-10-17",
          "Statement": [
            {
              "Effect": "Allow",
              "Principal": {
                "Service": "application-autoscaling.amazonaws.com"
              },
              "Action": "sts:AssumeRole"
            }
          ]
        },
        "ManagedPolicyArns": [
          "arn:aws:iam::aws:policy/service-role/AWSApplicationAutoScalingDynamoDBTablePolicy"
        ]
      }
    },
    
    "DynamoDBWriteCapacityScalableTarget": {
      "Type": "AWS::ApplicationAutoScaling::ScalableTarget",
      "Properties": {
        "MaxCapacity": 140000,
        "MinCapacity": 70000,
        "ResourceId": {"Fn::Sub": "table/${DynamoDBTable}"},
        "RoleARN": {"Fn::GetAtt": ["DynamoDBAutoScalingRole", "Arn"]},
        "ScalableDimension": "dynamodb:table:WriteCapacityUnits",
        "ServiceNamespace": "dynamodb"
      }
    },
    
    "DynamoDBWriteScalingPolicy": {
      "Type": "AWS::ApplicationAutoScaling::ScalingPolicy",
      "Properties": {
        "PolicyName": "DynamoDBWriteAutoScalingPolicy",
        "PolicyType": "TargetTrackingScaling",
        "ScalingTargetId": {"Ref": "DynamoDBWriteCapacityScalableTarget"},
        "TargetTrackingScalingPolicyConfiguration": {
          "TargetValue": 70.0,
          "PredefinedMetricSpecification": {
            "PredefinedMetricType": "DynamoDBWriteCapacityUtilization"
          }
        }
      }
    },
    
    "NeptuneDBSubnetGroup": {
      "Type": "AWS::Neptune::DBSubnetGroup",
      "Properties": {
        "DBSubnetGroupDescription": "Subnet group for Neptune cluster",
        "SubnetIds": [
          {"Ref": "PrivateSubnet1"},
          {"Ref": "PrivateSubnet2"}
        ],
        "Tags": [
          {
            "Key": "Purpose",
            "Value": "ProfileMigration"
          }
        ]
      }
    },
    
    "NeptuneDBCluster": {
      "Type": "AWS::Neptune::DBCluster",
      "Properties": {
        "DBClusterIdentifier": "profile-migration-neptune",
        "DBSubnetGroupName": {"Ref": "NeptuneDBSubnetGroup"},
        "VpcSecurityGroupIds": [{"Ref": "NeptuneSecurityGroup"}],
        "BackupRetentionPeriod": 7,
        "PreferredBackupWindow": "03:00-04:00",
        "PreferredMaintenanceWindow": "sun:04:00-sun:05:00",
        "Tags": [
          {
            "Key": "Purpose",
            "Value": "ProfileMigration"
          }
        ]
      }
    },
    
    "NeptuneDBInstance1": {
      "Type": "AWS::Neptune::DBInstance",
      "Properties": {
        "DBInstanceIdentifier": "profile-migration-neptune-1",
        "DBClusterIdentifier": {"Ref": "NeptuneDBCluster"},
        "DBInstanceClass": {"Ref": "NeptuneDBInstanceClass"},
        "Tags": [
          {
            "Key": "Purpose",
            "Value": "ProfileMigration"
          }
        ]
      }
    },
    
    "NeptuneDBInstance2": {
      "Type": "AWS::Neptune::DBInstance",
      "Properties": {
        "DBInstanceIdentifier": "profile-migration-neptune-2",
        "DBClusterIdentifier": {"Ref": "NeptuneDBCluster"},
        "DBInstanceClass": {"Ref": "NeptuneDBInstanceClass"},
        "Tags": [
          {
            "Key": "Purpose",
            "Value": "ProfileMigration"
          }
        ]
      }
    },
    
    "NeptuneSecurityGroup": {
      "Type": "AWS::EC2::SecurityGroup",
      "Properties": {
        "GroupDescription": "Security group for Neptune cluster",
        "VpcId": {"Ref": "VPC"},
        "SecurityGroupIngress": [
          {
            "IpProtocol": "tcp",
            "FromPort": 8182,
            "ToPort": 8182,
            "SourceSecurityGroupId": {"Ref": "LambdaSecurityGroup"}
          }
        ],
        "Tags": [
          {
            "Key": "Name",
            "Value": "NeptuneSecurityGroup"
          }
        ]
      }
    },
    
    "OpenSearchDomain": {
      "Type": "AWS::OpenSearchService::Domain",
      "Properties": {
        "DomainName": "profile-migration-search",
        "EngineVersion": "OpenSearch_2.9",
        "ClusterConfig": {
          "InstanceType": "r5.4xlarge.search",
          "InstanceCount": 6,
          "DedicatedMasterEnabled": true,
          "DedicatedMasterType": "r5.xlarge.search",
          "DedicatedMasterCount": 3,
          "ZoneAwarenessEnabled": true,
          "ZoneAwarenessConfig": {
            "AvailabilityZoneCount": 2
          }
        },
        "EBSOptions": {
          "EBSEnabled": true,
          "VolumeType": "gp3",
          "VolumeSize": 1000,
          "Iops": 16000,
          "Throughput": 1000
        },
        "VPCOptions": {
          "SubnetIds": [
            {"Ref": "PrivateSubnet1"},
            {"Ref": "PrivateSubnet2"}
          ],
          "SecurityGroupIds": [
            {"Ref": "OpenSearchSecurityGroup"}
          ]
        },
        "AdvancedOptions": {
          "rest.action.multi.allow_explicit_index": "true",
          "indices.fielddata.cache.size": "40",
          "indices.query.bool.max_clause_count": "1024"
        },
        "Tags": [
          {
            "Key": "Purpose",
            "Value": "ProfileMigration"
          }
        ]
      }
    },
    
    "OpenSearchSecurityGroup": {
      "Type": "AWS::EC2::SecurityGroup",
      "Properties": {
        "GroupDescription": "Security group for OpenSearch domain",
        "VpcId": {"Ref": "VPC"},
        "SecurityGroupIngress": [
          {
            "IpProtocol": "tcp",
            "FromPort": 443,
            "ToPort": 443,
            "SourceSecurityGroupId": {"Ref": "LambdaSecurityGroup"}
          }
        ],
        "Tags": [
          {
            "Key": "Name",
            "Value": "OpenSearchSecurityGroup"
          }
        ]
      }
    },
    
    "KinesisFirehoseRole": {
      "Type": "AWS::IAM::Role",
      "Properties": {
        "AssumeRolePolicyDocument": {
          "Version": "2012-10-17",
          "Statement": [
            {
              "Effect": "Allow",
              "Principal": {
                "Service": "firehose.amazonaws.com"
              },
              "Action": "sts:AssumeRole"
            }
          ]
        },
        "Policies": [
          {
            "PolicyName": "FirehoseOpenSearchPolicy",
            "PolicyDocument": {
              "Version": "2012-10-17",
              "Statement": [
                {
                  "Effect": "Allow",
                  "Action": [
                    "es:*",
                    "s3:*",
                    "logs:*"
                  ],
                  "Resource": "*"
                }
              ]
            }
          }
        ]
      }
    },
    
    "KinesisFirehoseBackupBucket": {
      "Type": "AWS::S3::Bucket",
      "Properties": {
        "BucketName": {"Fn::Sub": "firehose-backup-${AWS::AccountId}"}
      }
    },
    
    "KinesisFirehoseDeliveryStream": {
      "Type": "AWS::KinesisFirehose::DeliveryStream",
      "DependsOn": "OpenSearchDomain",
      "Properties": {
        "DeliveryStreamName": "ProfileIndexingStream",
        "DeliveryStreamType": "DirectPut",
        "AmazonopensearchserviceDestinationConfiguration": {
          "DomainARN": {"Fn::GetAtt": ["OpenSearchDomain", "Arn"]},
          "IndexName": "profiles",
          "IndexRotationPeriod": "OneDay",
          "TypeName": "_doc",
          "BufferingHints": {
            "IntervalInSeconds": 60,
            "SizeInMBs": 5
          },
          "RetryConfiguration": {
            "DurationInSeconds": 3600
          },
          "S3Configuration": {
            "BucketARN": {"Fn::GetAtt": ["KinesisFirehoseBackupBucket", "Arn"]},
            "BufferingHints": {
              "IntervalInSeconds": 60,
              "SizeInMBs": 5
            },
            "CompressionFormat": "GZIP",
            "Prefix": "backup/",
            "ErrorOutputPrefix": "error/",
            "RoleARN": {"Fn::GetAtt": ["KinesisFirehoseRole", "Arn"]}
          },
          "ProcessingConfiguration": {
            "Enabled": false
          },
          "CloudWatchLoggingOptions": {
            "Enabled": true,
            "LogGroupName": "/aws/kinesisfirehose/profile-indexing",
            "LogStreamName": "opensearch-delivery"
          },
          "RoleARN": {"Fn::GetAtt": ["KinesisFirehoseRole", "Arn"]}
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
          "arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole"
        ],
        "Policies": [
          {
            "PolicyName": "LambdaFullAccess",
            "PolicyDocument": {
              "Version": "2012-10-17",
              "Statement": [
                {
                  "Effect": "Allow",
                  "Action": [
                    "s3:*",
                    "dynamodb:*",
                    "firehose:*",
                    "logs:*",
                    "neptune-db:*",
                    "es:*",
                    "cloudwatch:*",
                    "dms:*",
                    "sns:*"
                  ],
                  "Resource": "*"
                }
              ]
            }
          }
        ]
      }
    },
    
    "LambdaSecurityGroup": {
      "Type": "AWS::EC2::SecurityGroup",
      "Properties": {
        "GroupDescription": "Security group for Lambda functions",
        "VpcId": {"Ref": "VPC"},
        "SecurityGroupEgress": [
          {
            "IpProtocol": "-1",
            "CidrIp": "0.0.0.0/0"
          }
        ],
        "Tags": [
          {
            "Key": "Name",
            "Value": "LambdaSecurityGroup"
          }
        ]
      }
    },
    
    "TransformValidateLambda": {
      "Type": "AWS::Lambda::Function",
      "Properties": {
        "FunctionName": "ProfileTransformValidate",
        "Runtime": "python3.11",
        "Handler": "index.lambda_handler",
        "Role": {"Fn::GetAtt": ["LambdaExecutionRole", "Arn"]},
        "MemorySize": 3008,
        "Timeout": 300,
        "ReservedConcurrentExecutions": 4000,
        "Environment": {
          "Variables": {
            "DYNAMODB_TABLE": {"Ref": "DynamoDBTable"},
            "FIREHOSE_STREAM": {"Ref": "KinesisFirehoseDeliveryStream"},
            "SNS_TOPIC": {"Ref": "MonitoringSNSTopic"}
          }
        },
        "VpcConfig": {
          "SubnetIds": [
            {"Ref": "PrivateSubnet1"},
            {"Ref": "PrivateSubnet2"}
          ],
          "SecurityGroupIds": [
            {"Ref": "LambdaSecurityGroup"}
          ]
        },
        "Code": {
          "ZipFile": "import json\nimport boto3\nimport os\n\ndef lambda_handler(event, context):\n    # Transform and validate profile data\n    # Write to DynamoDB with conditional checks\n    # Send to Kinesis Firehose for OpenSearch indexing\n    return {'statusCode': 200}\n"
        },
        "Tags": [
          {
            "Key": "Purpose",
            "Value": "ProfileMigration"
          }
        ]
      }
    },
    
    "GraphBuilderLambda": {
      "Type": "AWS::Lambda::Function",
      "Properties": {
        "FunctionName": "ProfileGraphBuilder",
        "Runtime": "python3.11",
        "Handler": "index.lambda_handler",
        "Role": {"Fn::GetAtt": ["LambdaExecutionRole", "Arn"]},
        "MemorySize": 3008,
        "Timeout": 300,
        "ReservedConcurrentExecutions": 2000,
        "Environment": {
          "Variables": {
            "NEPTUNE_ENDPOINT": {"Fn::GetAtt": ["NeptuneDBCluster", "Endpoint"]},
            "NEPTUNE_PORT": {"Fn::GetAtt": ["NeptuneDBCluster", "Port"]},
            "SNS_TOPIC": {"Ref": "MonitoringSNSTopic"}
          }
        },
        "VpcConfig": {
          "SubnetIds": [
            {"Ref": "PrivateSubnet1"},
            {"Ref": "PrivateSubnet2"}
          ],
          "SecurityGroupIds": [
            {"Ref": "LambdaSecurityGroup"}
          ]
        },
        "Code": {
          "ZipFile": "import json\nimport boto3\nimport os\n\ndef lambda_handler(event, context):\n    # Process DynamoDB stream events\n    # Build graph data in Neptune using Gremlin\n    return {'statusCode': 200}\n"
        },
        "Tags": [
          {
            "Key": "Purpose",
            "Value": "ProfileMigration"
          }
        ]
      }
    },
    
    "LagDetectionLambda": {
      "Type": "AWS::Lambda::Function",
      "Properties": {
        "FunctionName": "MigrationLagDetection",
        "Runtime": "python3.11",
        "Handler": "index.lambda_handler",
        "Role": {"Fn::GetAtt": ["LambdaExecutionRole", "Arn"]},
        "MemorySize": 1024,
        "Timeout": 60,
        "Environment": {
          "Variables": {
            "DMS_TASK_ARN": {"Ref": "DMSReplicationTask"},
            "SNS_TOPIC": {"Ref": "MonitoringSNSTopic"},
            "THROTTLE_LAMBDA": {"Ref": "ThrottlingAdjustmentLambda"}
          }
        },
        "Code": {
          "ZipFile": "import json\nimport boto3\nimport os\n\ndef lambda_handler(event, context):\n    # Query CloudWatch metrics for DMS and Lambda\n    # Detect migration lag\n    # Trigger throttling if needed\n    return {'statusCode': 200}\n"
        },
        "Tags": [
          {
            "Key": "Purpose",
            "Value": "ProfileMigration"
          }
        ]
      }
    },
    
    "ThrottlingAdjustmentLambda": {
      "Type": "AWS::Lambda::Function",
      "Properties": {
        "FunctionName": "DMSThrottlingAdjustment",
        "Runtime": "python3.11",
        "Handler": "index.lambda_handler",
        "Role": {"Fn::GetAtt": ["LambdaExecutionRole", "Arn"]},
        "MemorySize": 512,
        "Timeout": 30,
        "Environment": {
          "Variables": {
            "DMS_TASK_ARN": {"Ref": "DMSReplicationTask"},
            "SNS_TOPIC": {"Ref": "MonitoringSNSTopic"}
          }
        },
        "Code": {
          "ZipFile": "import json\nimport boto3\nimport os\n\ndef lambda_handler(event, context):\n    # Adjust DMS replication task throttling\n    # Apply within 30 seconds\n    return {'statusCode': 200}\n"
        },
        "Tags": [
          {
            "Key": "Purpose",
            "Value": "ProfileMigration"
          }
        ]
      }
    },
    
    "DynamoDBStreamEventSourceMapping": {
      "Type": "AWS::Lambda::EventSourceMapping",
      "Properties": {
        "EventSourceArn": {"Fn::GetAtt": ["DynamoDBTable", "StreamArn"]},
        "FunctionName": {"Ref": "GraphBuilderLambda"},
        "StartingPosition": "LATEST",
        "MaximumBatchingWindowInSeconds": 5,
        "ParallelizationFactor": 10,
        "MaximumRecordAgeInSeconds": 3600
      }
    },
    
    "LagDetectionScheduleRule": {
      "Type": "AWS::Events::Rule",
      "Properties": {
        "Name": "LagDetectionSchedule",
        "Description": "Trigger lag detection every minute",
        "ScheduleExpression": "rate(1 minute)",
        "State": "ENABLED",
        "Targets": [
          {
            "Arn": {"Fn::GetAtt": ["LagDetectionLambda", "Arn"]},
            "Id": "LagDetectionTarget"
          }
        ]
      }
    },
    
    "LagDetectionLambdaPermission": {
      "Type": "AWS::Lambda::Permission",
      "Properties": {
        "FunctionName": {"Ref": "LagDetectionLambda"},
        "Action": "lambda:InvokeFunction",
        "Principal": "events.amazonaws.com",
        "SourceArn": {"Fn::GetAtt": ["LagDetectionScheduleRule", "Arn"]}
      }
    },
    
    "AthenaWorkgroup": {
      "Type": "AWS::Athena::WorkGroup",
      "Properties": {
        "Name": "ProfileValidationWorkgroup",
        "WorkGroupConfiguration": {
          "ResultConfigurationUpdates": {
            "OutputLocation": {"Fn::Sub": "s3://athena-results-${AWS::AccountId}/"}
          },
          "EnforceWorkGroupConfiguration": true,
          "EngineVersion": {
            "SelectedEngineVersion": "Athena engine version 3"
          }
        },
        "Tags": [
          {
            "Key": "Purpose",
            "Value": "ProfileMigration"
          }
        ]
      }
    },
    
    "AthenaResultsBucket": {
      "Type": "AWS::S3::Bucket",
      "Properties": {
        "BucketName": {"Fn::Sub": "athena-results-${AWS::AccountId}"},
        "LifecycleConfiguration": {
          "Rules": [
            {
              "Id": "DeleteOldResults",
              "Status": "Enabled",
              "ExpirationInDays": 7
            }
          ]
        }
      }
    },
    
    "StepFunctionsRole": {
      "Type": "AWS::IAM::Role",
      "Properties": {
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
            "PolicyName": "StepFunctionsPolicy",
            "PolicyDocument": {
              "Version": "2012-10-17",
              "Statement": [
                {
                  "Effect": "Allow",
                  "Action": [
                    "athena:*",
                    "s3:*",
                    "glue:*",
                    "sns:*",
                    "lambda:InvokeFunction"
                  ],
                  "Resource": "*"
                }
              ]
            }
          }
        ]
      }
    },
    
    "ValidationStateMachine": {
      "Type": "AWS::StepFunctions::StateMachine",
      "Properties": {
        "StateMachineName": "ProfileValidationWorkflow",
        "RoleArn": {"Fn::GetAtt": ["StepFunctionsRole", "Arn"]},
        "DefinitionString": {
          "Fn::Sub": "{\n  \"Comment\": \"Profile validation workflow\",\n  \"StartAt\": \"RunAthenaQuery\",\n  \"States\": {\n    \"RunAthenaQuery\": {\n      \"Type\": \"Task\",\n      \"Resource\": \"arn:aws:states:::athena:startQueryExecution.sync\",\n      \"Parameters\": {\n        \"QueryString\": \"SELECT * FROM profiles_raw TABLESAMPLE (1 PERCENT) LIMIT 1000000\",\n        \"WorkGroup\": \"${AthenaWorkgroup}\",\n        \"ResultConfiguration\": {\n          \"OutputLocation\": \"s3://athena-results-${AWS::AccountId}/\"\n        }\n      },\n      \"Next\": \"ValidateResults\"\n    },\n    \"ValidateResults\": {\n      \"Type\": \"Task\",\n      \"Resource\": \"arn:aws:states:::lambda:invoke\",\n      \"Parameters\": {\n        \"FunctionName\": \"DataValidation\",\n        \"Payload.$\": \"$\"\n      },\n      \"End\": true\n    }\n  }\n}"
        },
        "Tags": [
          {
            "Key": "Purpose",
            "Value": "ProfileMigration"
          }
        ]
      }
    },
    
    "ValidationScheduleRule": {
      "Type": "AWS::Events::Rule",
      "Properties": {
        "Name": "ValidationSchedule",
        "Description": "Trigger validation workflow every 15 minutes",
        "ScheduleExpression": "rate(15 minutes)",
        "State": "ENABLED",
        "Targets": [
          {
            "Arn": {"Fn::GetAtt": ["ValidationStateMachine", "Arn"]},
            "Id": "ValidationTarget",
            "RoleArn": {"Fn::GetAtt": ["EventBridgeRole", "Arn"]}
          }
        ]
      }
    },
    
    "EventBridgeRole": {
      "Type": "AWS::IAM::Role",
      "Properties": {
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
            "PolicyName": "InvokeStepFunctions",
            "PolicyDocument": {
              "Version": "2012-10-17",
              "Statement": [
                {
                  "Effect": "Allow",
                  "Action": "states:StartExecution",
                  "Resource": {"Ref": "ValidationStateMachine"}
                }
              ]
            }
          }
        ]
      }
    },
    
    "DMSSubnetGroup": {
      "Type": "AWS::DMS::ReplicationSubnetGroup",
      "Properties": {
        "ReplicationSubnetGroupIdentifier": "profile-migration-subnet-group",
        "ReplicationSubnetGroupDescription": "Subnet group for DMS replication",
        "SubnetIds": [
          {"Ref": "PrivateSubnet1"},
          {"Ref": "PrivateSubnet2"}
        ],
        "Tags": [
          {
            "Key": "Purpose",
            "Value": "ProfileMigration"
          }
        ]
      }
    },
    
    "DMSReplicationInstance": {
      "Type": "AWS::DMS::ReplicationInstance",
      "Properties": {
        "ReplicationInstanceIdentifier": "profile-migration-instance",
        "ReplicationInstanceClass": "dms.r5.24xlarge",
        "AllocatedStorage": 2000,
        "MultiAZ": true,
        "PubliclyAccessible": false,
        "ReplicationSubnetGroupIdentifier": {"Ref": "DMSSubnetGroup"},
        "VpcSecurityGroupIds": [{"Ref": "DMSSecurityGroup"}],
        "Tags": [
          {
            "Key": "Purpose",
            "Value": "ProfileMigration"
          }
        ]
      }
    },
    
    "DMSSecurityGroup": {
      "Type": "AWS::EC2::SecurityGroup",
      "Properties": {
        "GroupDescription": "Security group for DMS replication instance",
        "VpcId": {"Ref": "VPC"},
        "SecurityGroupEgress": [
          {
            "IpProtocol": "-1",
            "CidrIp": "0.0.0.0/0"
          }
        ],
        "Tags": [
          {
            "Key": "Name",
            "Value": "DMSSecurityGroup"
          }
        ]
      }
    },
    
    "DMSSourceEndpoint": {
      "Type": "AWS::DMS::Endpoint",
      "Properties": {
        "EndpointIdentifier": "cassandra-source-endpoint",
        "EndpointType": "source",
        "EngineName": "cassandra",
        "ServerName": {"Ref": "SourceDatabaseEndpoint"},
        "Port": {"Ref": "SourceDatabasePort"},
        "Tags": [
          {
            "Key": "Purpose",
            "Value": "ProfileMigration"
          }
        ]
      }
    },
    
    "DMSTargetEndpoint": {
      "Type": "AWS::DMS::Endpoint",
      "Properties": {
        "EndpointIdentifier": "s3-target-endpoint",
        "EndpointType": "target",
        "EngineName": "s3",
        "S3Settings": {
          "BucketName": {"Ref": "S3Bucket"},
          "DataFormat": "json",
          "CompressionType": "gzip",
          "IncludeOpForFullLoad": true,
          "TimestampColumnName": "migration_timestamp",
          "ParquetVersion": "parquet-2-0",
          "EnableStatistics": true,
          "CdcInsertsOnly": false,
          "PreserveTransactions": false
        },
        "ServiceAccessRoleArn": {"Fn::GetAtt": ["DMSServiceRole", "Arn"]},
        "Tags": [
          {
            "Key": "Purpose",
            "Value": "ProfileMigration"
          }
        ]
      }
    },
    
    "DMSServiceRole": {
      "Type": "AWS::IAM::Role",
      "Properties": {
        "AssumeRolePolicyDocument": {
          "Version": "2012-10-17",
          "Statement": [
            {
              "Effect": "Allow",
              "Principal": {
                "Service": "dms.amazonaws.com"
              },
              "Action": "sts:AssumeRole"
            }
          ]
        },
        "ManagedPolicyArns": [
          "arn:aws:iam::aws:policy/service-role/AmazonDMSVPCManagementRole"
        ],
        "Policies": [
          {
            "PolicyName": "S3Access",
            "PolicyDocument": {
              "Version": "2012-10-17",
              "Statement": [
                {
                  "Effect": "Allow",
                  "Action": [
                    "s3:*"
                  ],
                  "Resource": [
                    {"Fn::GetAtt": ["S3Bucket", "Arn"]},
                    {"Fn::Sub": "${S3Bucket.Arn}/*"}
                  ]
                }
              ]
            }
          }
        ]
      }
    },
    
    "DMSReplicationTask": {
      "Type": "AWS::DMS::ReplicationTask",
      "Properties": {
        "ReplicationTaskIdentifier": "profile-migration-task",
        "MigrationType": "full-load-and-cdc",
        "ReplicationInstanceArn": {"Ref": "DMSReplicationInstance"},
        "SourceEndpointArn": {"Ref": "DMSSourceEndpoint"},
        "TargetEndpointArn": {"Ref": "DMSTargetEndpoint"},
        "TableMappings": "{\n  \"rules\": [\n    {\n      \"rule-type\": \"selection\",\n      \"rule-id\": \"1\",\n      \"rule-name\": \"1\",\n      \"object-locator\": {\n        \"schema-name\": \"profiles\",\n        \"table-name\": \"%\"\n      },\n      \"rule-action\": \"include\"\n    }\n  ]\n}",
        "ReplicationTaskSettings": "{\n  \"TargetMetadata\": {\n    \"TargetSchema\": \"\",\n    \"SupportLobs\": true,\n    \"FullLobMode\": false,\n    \"LobChunkSize\": 64,\n    \"LimitedSizeLobMode\": true,\n    \"LobMaxSize\": 32,\n    \"InlineLobMaxSize\": 16,\n    \"LoadMaxFileSize\": 1000000,\n    \"ParallelLoadThreads\": 16,\n    \"ParallelLoadBufferSize\": 500,\n    \"BatchApplyEnabled\": true,\n    \"TaskRecoveryTableEnabled\": false\n  },\n  \"FullLoadSettings\": {\n    \"TargetTablePrepMode\": \"DROP_AND_CREATE\",\n    \"CreatePkAfterFullLoad\": false,\n    \"StopTaskCachedChangesApplied\": false,\n    \"StopTaskCachedChangesNotApplied\": false,\n    \"EnableStatistics\": true,\n    \"EnableValidation\": false,\n    \"ThreadCount\": 8,\n    \"TablesErrorBehavior\": \"SUSPEND_TABLE\",\n    \"LoadMaxFileSize\": 1000000,\n    \"ParallelLoadThreads\": 16,\n    \"ParallelLoadBufferSize\": 500\n  },\n  \"TTSettings\": {\n    \"EnableTT\": false\n  }\n}",
        "Tags": [
          {
            "Key": "Purpose",
            "Value": "ProfileMigration"
          }
        ]
      }
    },
    
    "MonitoringSNSTopic": {
      "Type": "AWS::SNS::Topic",
      "Properties": {
        "TopicName": "ProfileMigrationMonitoring",
        "DisplayName": "Profile Migration Monitoring",
        "Tags": [
          {
            "Key": "Purpose",
            "Value": "ProfileMigration"
          }
        ]
      }
    },
    
    "MigrationLagAlarm": {
      "Type": "AWS::CloudWatch::Alarm",
      "Properties": {
        "AlarmName": "ProfileMigrationLag",
        "AlarmDescription": "Alert when migration lag exceeds 10 minutes",
        "MetricName": "MigrationLag",
        "Namespace": "ProfileMigration",
        "Statistic": "Average",
        "Period": 60,
        "EvaluationPeriods": 2,
        "Threshold": 600,
        "ComparisonOperator": "GreaterThanThreshold",
        "AlarmActions": [
          {"Ref": "MonitoringSNSTopic"},
          {"Fn::GetAtt": ["ThrottlingAdjustmentLambda", "Arn"]}
        ],
        "TreatMissingData": "breaching"
      }
    },
    
    "ThrottleLambdaAlarmPermission": {
      "Type": "AWS::Lambda::Permission",
      "Properties": {
        "FunctionName": {"Ref": "ThrottlingAdjustmentLambda"},
        "Action": "lambda:InvokeFunction",
        "Principal": "lambda.alarms.cloudwatch.amazonaws.com",
        "SourceAccount": {"Ref": "AWS::AccountId"},
        "SourceArn": {"Fn::GetAtt": ["MigrationLagAlarm", "Arn"]}
      }
    },
    
    "DMSReplicationRateAlarm": {
      "Type": "AWS::CloudWatch::Alarm",
      "Properties": {
        "AlarmName": "DMSReplicationRate",
        "AlarmDescription": "Alert when DMS replication rate drops",
        "MetricName": "CDCThroughputRowsSource",
        "Namespace": "AWS/DMS",
        "Dimensions": [
          {
            "Name": "ReplicationTaskIdentifier",
            "Value": {"Ref": "DMSReplicationTask"}
          }
        ],
        "Statistic": "Average",
        "Period": 300,
        "EvaluationPeriods": 2,
        "Threshold": 205000,
        "ComparisonOperator": "LessThanThreshold",
        "AlarmActions": [
          {"Ref": "MonitoringSNSTopic"}
        ],
        "TreatMissingData": "breaching"
      }
    },
    
    "LambdaConcurrentExecutionsAlarm": {
      "Type": "AWS::CloudWatch::Alarm",
      "Properties": {
        "AlarmName": "TransformLambdaConcurrency",
        "AlarmDescription": "Alert when Lambda concurrent executions approach limit",
        "MetricName": "ConcurrentExecutions",
        "Namespace": "AWS/Lambda",
        "Dimensions": [
          {
            "Name": "FunctionName",
            "Value": {"Ref": "TransformValidateLambda"}
          }
        ],
        "Statistic": "Maximum",
        "Period": 60,
        "EvaluationPeriods": 2,
        "Threshold": 3800,
        "ComparisonOperator": "GreaterThanThreshold",
        "AlarmActions": [
          {"Ref": "MonitoringSNSTopic"}
        ],
        "TreatMissingData": "notBreaching"
      }
    },
    
    "DynamoDBThrottleAlarm": {
      "Type": "AWS::CloudWatch::Alarm",
      "Properties": {
        "AlarmName": "DynamoDBWriteThrottle",
        "AlarmDescription": "Alert when DynamoDB writes are throttled",
        "MetricName": "WriteThrottleEvents",
        "Namespace": "AWS/DynamoDB",
        "Dimensions": [
          {
            "Name": "TableName",
            "Value": {"Ref": "DynamoDBTable"}
          }
        ],
        "Statistic": "Sum",
        "Period": 60,
        "EvaluationPeriods": 1,
        "Threshold": 100,
        "ComparisonOperator": "GreaterThanThreshold",
        "AlarmActions": [
          {"Ref": "MonitoringSNSTopic"}
        ],
        "TreatMissingData": "notBreaching"
      }
    }
  },
  
  "Outputs": {
    "S3BucketName": {
      "Description": "S3 bucket for DMS target",
      "Value": {"Ref": "S3Bucket"}
    },
    "DynamoDBTableName": {
      "Description": "DynamoDB table for profiles",
      "Value": {"Ref": "DynamoDBTable"}
    },
    "NeptuneEndpoint": {
      "Description": "Neptune cluster endpoint",
      "Value": {"Fn::GetAtt": ["NeptuneDBCluster", "Endpoint"]}
    },
    "OpenSearchDomainEndpoint": {
      "Description": "OpenSearch domain endpoint",
      "Value": {"Fn::GetAtt": ["OpenSearchDomain", "DomainEndpoint"]}
    },
    "FirehoseStreamName": {
      "Description": "Kinesis Firehose delivery stream",
      "Value": {"Ref": "KinesisFirehoseDeliveryStream"}
    },
    "MonitoringTopicArn": {
      "Description": "SNS topic for monitoring alerts",
      "Value": {"Ref": "MonitoringSNSTopic"}
    },
    "ValidationStateMachineArn": {
      "Description": "Step Functions state machine for validation",
      "Value": {"Ref": "ValidationStateMachine"}
    }
  }
}
```