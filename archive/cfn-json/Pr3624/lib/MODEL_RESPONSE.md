### Reasoning Trace

---

I need to create a comprehensive CloudFormation template for a fleet management platform that monitors 15,000 commercial vehicles. This is a complex infrastructure, so I'll approach it systematically.

Let's start with the high-level structure of a CloudFormation template:

```json
{
  "AWSTemplateFormatVersion": "2010-09-09",
  "Description": "Fleet Management Platform for 15,000 Commercial Vehicles",
  "Parameters": {
    // Parameters will go here
  },
  "Resources": {
    // Resources will go here
  },
  "Outputs": {
    // Outputs will go here
  }
}
```

Now, let's fill in the sections one by one:

1. Parameters: We'll need parameters for environment-specific values like environment name, email addresses for notifications, etc.

2. Resources: This is where the bulk of our template will reside. We need to define all the AWS resources required for the fleet management platform.

3. Outputs: We'll include outputs for important resource identifiers that might be needed for cross-stack references.

Let's start with the Parameters section:

```json
"Parameters": {
  "EnvironmentName": {
    "Type": "String",
    "Description": "Environment name (e.g., dev, test, prod)",
    "Default": "prod"
  },
  "OperationsEmail": {
    "Type": "String",
    "Description": "Email address for operations team to receive alerts",
    "AllowedPattern": "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$"
  },
  "VehicleCount": {
    "Type": "Number",
    "Description": "Number of vehicles in the fleet",
    "Default": 15000,
    "MinValue": 1
  },
  "TelemetryFrequencySeconds": {
    "Type": "Number",
    "Description": "Frequency of telemetry data emitted by each vehicle (in seconds)",
    "Default": 60,
    "MinValue": 1
  }
}
```

Now let's build the Resources section. I'll go through each of the required infrastructure components:

1. IoT Infrastructure
2. Data Ingestion and Streaming
3. Time-Series Data Storage
4. Vehicle Data Storage
5. Machine Learning Infrastructure
6. Anomaly Detection
7. Route Optimization
8. Data Processing
9. Historical Data and Analytics
10. Data Cataloging and Querying
11. Business Intelligence
12. Workflow Orchestration
13. Event-Driven Architecture
14. Notifications
15. Monitoring and Observability
16. API Layer

Let's start with the IoT Infrastructure:

```json
"Resources": {
  "IoTPolicy": {
    "Type": "AWS::IoT::Policy",
    "Properties": {
      "PolicyName": {"Fn::Sub": "${EnvironmentName}-fleet-iot-policy"},
      "PolicyDocument": {
        "Version": "2012-10-17",
        "Statement": [
          {
            "Effect": "Allow",
            "Action": [
              "iot:Connect",
              "iot:Publish",
              "iot:Subscribe",
              "iot:Receive"
            ],
            "Resource": "*"
          }
        ]
      }
    }
  },
  "IoTFleetIndexingConfig": {
    "Type": "AWS::IoT::FleetMetric",
    "Properties": {
      "MetricName": {"Fn::Sub": "${EnvironmentName}-vehicle-fleet-metric"},
      "IndexName": "AWS_Things",
      "QueryString": "thingTypeName:Vehicle",
      "Period": 60,
      "AggregationType": {
        "Name": "Statistics",
        "Values": ["count"]
      }
    }
  },
  "VehicleThingType": {
    "Type": "AWS::IoT::ThingType",
    "Properties": {
      "ThingTypeName": "Vehicle",
      "ThingTypeProperties": {
        "SearchableAttributes": ["vehicleId", "vin", "model", "year", "manufacturerName"],
        "Description": "Commercial Vehicle Thing Type"
      }
    }
  },
  "TelemetryRule": {
    "Type": "AWS::IoT::TopicRule",
    "Properties": {
      "RuleName": {"Fn::Sub": "${EnvironmentName}-vehicle-telemetry"},
      "TopicRulePayload": {
        "Description": "Rule for processing vehicle telemetry data",
        "RuleDisabled": false,
        "Sql": "SELECT * FROM 'vehicles/+/telemetry'",
        "Actions": [
          {
            "Kinesis": {
              "RoleArn": {"Fn::GetAtt": ["IoTToKinesisRole", "Arn"]},
              "StreamName": {"Ref": "TelemetryStream"},
              "PartitionKey": "${topic(3)}"
            }
          }
        ]
      }
    }
  },
  "IoTToKinesisRole": {
    "Type": "AWS::IAM::Role",
    "Properties": {
      "AssumeRolePolicyDocument": {
        "Version": "2012-10-17",
        "Statement": [
          {
            "Effect": "Allow",
            "Principal": {
              "Service": "iot.amazonaws.com"
            },
            "Action": "sts:AssumeRole"
          }
        ]
      },
      "ManagedPolicyArns": ["arn:aws:iam::aws:policy/service-role/AWSIoTRuleActions"]
    }
  }
}
```

Next, let's add the Data Ingestion and Streaming resources:

```json
"TelemetryStream": {
  "Type": "AWS::Kinesis::Stream",
  "Properties": {
    "Name": {"Fn::Sub": "${EnvironmentName}-vehicle-telemetry-stream"},
    "RetentionPeriodHours": 48,
    "ShardCount": {
      "Fn::If": [
        "IsProd",
        {"Fn::Ceiling": {"Fn::Divide": [{"Fn::Multiply": [{"Ref": "VehicleCount"}, {"Fn::Divide": [1, {"Ref": "TelemetryFrequencySeconds"}]}]}, 1000]}},
        1
      ]
    },
    "StreamEncryption": {
      "EncryptionType": "KMS",
      "KeyId": "alias/aws/kinesis"
    },
    "StreamModeDetails": {
      "StreamMode": "PROVISIONED"
    },
    "Tags": [
      {"Key": "Environment", "Value": {"Ref": "EnvironmentName"}},
      {"Key": "Project", "Value": "Fleet Management"}
    ]
  }
},
"TelemetryStreamMonitoringAlarm": {
  "Type": "AWS::CloudWatch::Alarm",
  "Properties": {
    "AlarmName": {"Fn::Sub": "${EnvironmentName}-telemetry-stream-throttling"},
    "AlarmDescription": "Alarm if Kinesis stream is throttling",
    "MetricName": "WriteProvisionedThroughputExceeded",
    "Namespace": "AWS/Kinesis",
    "Statistic": "Sum",
    "Period": 60,
    "EvaluationPeriods": 1,
    "Threshold": 1,
    "ComparisonOperator": "GreaterThanOrEqualToThreshold",
    "Dimensions": [
      {
        "Name": "StreamName",
        "Value": {"Ref": "TelemetryStream"}
      }
    ],
    "AlarmActions": [{"Ref": "OperationsAlertTopic"}]
  }
}
```

Now let's add the Time-Series Data Storage resources:

```json
"TelemetryDataTable": {
  "Type": "AWS::DynamoDB::Table",
  "Properties": {
    "TableName": {"Fn::Sub": "${EnvironmentName}-telemetry-data"},
    "BillingMode": "PAY_PER_REQUEST",
    "AttributeDefinitions": [
      {
        "AttributeName": "vehicleId",
        "AttributeType": "S"
      },
      {
        "AttributeName": "timestamp",
        "AttributeType": "N"
      }
    ],
    "KeySchema": [
      {
        "AttributeName": "vehicleId",
        "KeyType": "HASH"
      },
      {
        "AttributeName": "timestamp",
        "KeyType": "RANGE"
      }
    ],
    "StreamSpecification": {
      "StreamViewType": "NEW_AND_OLD_IMAGES"
    },
    "TimeToLiveSpecification": {
      "Enabled": true,
      "AttributeName": "ttl"
    },
    "Tags": [
      {"Key": "Environment", "Value": {"Ref": "EnvironmentName"}},
      {"Key": "Project", "Value": "Fleet Management"}
    ]
  }
}
```

Now, let's add the Vehicle Data Storage resources:

```json
"VehicleProfileTable": {
  "Type": "AWS::DynamoDB::Table",
  "Properties": {
    "TableName": {"Fn::Sub": "${EnvironmentName}-vehicle-profiles"},
    "BillingMode": "PAY_PER_REQUEST",
    "AttributeDefinitions": [
      {
        "AttributeName": "vehicleId",
        "AttributeType": "S"
      },
      {
        "AttributeName": "vin",
        "AttributeType": "S"
      }
    ],
    "KeySchema": [
      {
        "AttributeName": "vehicleId",
        "KeyType": "HASH"
      }
    ],
    "GlobalSecondaryIndexes": [
      {
        "IndexName": "VinIndex",
        "KeySchema": [
          {
            "AttributeName": "vin",
            "KeyType": "HASH"
          }
        ],
        "Projection": {
          "ProjectionType": "ALL"
        }
      }
    ],
    "PointInTimeRecoverySpecification": {
      "PointInTimeRecoveryEnabled": true
    },
    "SSESpecification": {
      "SSEEnabled": true
    },
    "Tags": [
      {"Key": "Environment", "Value": {"Ref": "EnvironmentName"}},
      {"Key": "Project", "Value": "Fleet Management"}
    ]
  }
},
"MaintenanceRecordsTable": {
  "Type": "AWS::DynamoDB::Table",
  "Properties": {
    "TableName": {"Fn::Sub": "${EnvironmentName}-maintenance-records"},
    "BillingMode": "PAY_PER_REQUEST",
    "AttributeDefinitions": [
      {
        "AttributeName": "recordId",
        "AttributeType": "S"
      },
      {
        "AttributeName": "vehicleId",
        "AttributeType": "S"
      },
      {
        "AttributeName": "maintenanceDate",
        "AttributeType": "S"
      }
    ],
    "KeySchema": [
      {
        "AttributeName": "recordId",
        "KeyType": "HASH"
      }
    ],
    "GlobalSecondaryIndexes": [
      {
        "IndexName": "VehicleMaintenanceIndex",
        "KeySchema": [
          {
            "AttributeName": "vehicleId",
            "KeyType": "HASH"
          },
          {
            "AttributeName": "maintenanceDate",
            "KeyType": "RANGE"
          }
        ],
        "Projection": {
          "ProjectionType": "ALL"
        }
      }
    ],
    "PointInTimeRecoverySpecification": {
      "PointInTimeRecoveryEnabled": true
    },
    "SSESpecification": {
      "SSEEnabled": true
    },
    "Tags": [
      {"Key": "Environment", "Value": {"Ref": "EnvironmentName"}},
      {"Key": "Project", "Value": "Fleet Management"}
    ]
  }
}
```

Now, let's add the Machine Learning Infrastructure resources:

```json
"SageMakerRole": {
  "Type": "AWS::IAM::Role",
  "Properties": {
    "AssumeRolePolicyDocument": {
      "Version": "2012-10-17",
      "Statement": [
        {
          "Effect": "Allow",
          "Principal": {
            "Service": "sagemaker.amazonaws.com"
          },
          "Action": "sts:AssumeRole"
        }
      ]
    },
    "ManagedPolicyArns": [
      "arn:aws:iam::aws:policy/AmazonSageMakerFullAccess",
      "arn:aws:iam::aws:policy/AmazonS3FullAccess",
      "arn:aws:iam::aws:policy/AmazonDynamoDBReadOnlyAccess"
    ]
  }
},
"SageMakerDomain": {
  "Type": "AWS::SageMaker::Domain",
  "Properties": {
    "DomainName": {"Fn::Sub": "${EnvironmentName}-fleet-management"},
    "AuthMode": "IAM",
    "VpcId": {"Fn::ImportValue": "VpcId"},
    "SubnetIds": [
      {"Fn::ImportValue": "PrivateSubnet1"},
      {"Fn::ImportValue": "PrivateSubnet2"}
    ],
    "DefaultUserSettings": {
      "ExecutionRole": {"Fn::GetAtt": ["SageMakerRole", "Arn"]}
    },
    "AppNetworkAccessType": "VpcOnly",
    "Tags": [
      {"Key": "Environment", "Value": {"Ref": "EnvironmentName"}},
      {"Key": "Project", "Value": "Fleet Management"}
    ]
  }
},
"SageMakerUserProfile": {
  "Type": "AWS::SageMaker::UserProfile",
  "Properties": {
    "DomainId": {"Fn::GetAtt": ["SageMakerDomain", "DomainId"]},
    "UserProfileName": "fleet-data-scientist",
    "Tags": [
      {"Key": "Environment", "Value": {"Ref": "EnvironmentName"}},
      {"Key": "Project", "Value": "Fleet Management"}
    ]
  }
},
"SageMakerNotebookInstance": {
  "Type": "AWS::SageMaker::NotebookInstance",
  "Properties": {
    "NotebookInstanceName": {"Fn::Sub": "${EnvironmentName}-fleet-maintenance-model"},
    "InstanceType": "ml.t3.xlarge",
    "RoleArn": {"Fn::GetAtt": ["SageMakerRole", "Arn"]},
    "VolumeSizeInGB": 50,
    "LifecycleConfigName": {"Fn::GetAtt": ["NotebookLifecycleConfig", "NotebookInstanceLifecycleConfigName"]},
    "Tags": [
      {"Key": "Environment", "Value": {"Ref": "EnvironmentName"}},
      {"Key": "Project", "Value": "Fleet Management"}
    ]
  }
},
"NotebookLifecycleConfig": {
  "Type": "AWS::SageMaker::NotebookInstanceLifecycleConfig",
  "Properties": {
    "OnStart": [
      {
        "Content": {
          "Fn::Base64": "#!/bin/bash\npip install pandas matplotlib scikit-learn xgboost boto3\nmkdir -p /home/ec2-user/SageMaker/fleet-maintenance"
        }
      }
    ]
  }
},
"MaintenanceModelEndpointConfig": {
  "Type": "AWS::SageMaker::EndpointConfig",
  "Properties": {
    "EndpointConfigName": {"Fn::Sub": "${EnvironmentName}-maintenance-prediction-config"},
    "ProductionVariants": [
      {
        "InitialInstanceCount": 1,
        "InitialVariantWeight": 1.0,
        "InstanceType": "ml.m5.large",
        "ModelName": {"Ref": "MaintenanceModel"},
        "VariantName": "AllTraffic"
      }
    ],
    "Tags": [
      {"Key": "Environment", "Value": {"Ref": "EnvironmentName"}},
      {"Key": "Project", "Value": "Fleet Management"}
    ]
  }
},
"MaintenanceModel": {
  "Type": "AWS::SageMaker::Model",
  "Properties": {
    "ModelName": {"Fn::Sub": "${EnvironmentName}-maintenance-prediction-model"},
    "ExecutionRoleArn": {"Fn::GetAtt": ["SageMakerRole", "Arn"]},
    "PrimaryContainer": {
      "Image": {"Fn::Sub": "433757028032.dkr.ecr.${AWS::Region}.amazonaws.com/xgboost:latest"},
      "ModelDataUrl": "s3://PLACEHOLDER-FOR-MODEL-ARTIFACT/model.tar.gz"
    },
    "Tags": [
      {"Key": "Environment", "Value": {"Ref": "EnvironmentName"}},
      {"Key": "Project", "Value": "Fleet Management"}
    ]
  }
},
"MaintenanceModelEndpoint": {
  "Type": "AWS::SageMaker::Endpoint",
  "Properties": {
    "EndpointName": {"Fn::Sub": "${EnvironmentName}-maintenance-prediction"},
    "EndpointConfigName": {"Fn::GetAtt": ["MaintenanceModelEndpointConfig", "EndpointConfigName"]},
    "Tags": [
      {"Key": "Environment", "Value": {"Ref": "EnvironmentName"}},
      {"Key": "Project", "Value": "Fleet Management"}
    ]
  }
}
```

Let's add the Anomaly Detection resources:

Note: Using CloudWatch Anomaly Detection instead of Lookout for Equipment due to regional availability in us-east-2.

```json
"VehicleTemperatureAnomaly": {
  "Type": "AWS::CloudWatch::AnomalyDetector",
  "Properties": {
    "MetricName": "EngineTemperature",
    "Namespace": "FleetManagement",
    "Stat": "Average"
  }
}
```

Now let's add the Route Optimization resources:

```json
"LocationServiceRole": {
  "Type": "AWS::IAM::Role",
  "Properties": {
    "AssumeRolePolicyDocument": {
      "Version": "2012-10-17",
      "Statement": [
        {
          "Effect": "Allow",
          "Principal": {
            "Service": "geo.amazonaws.com"
          },
          "Action": "sts:AssumeRole"
        }
      ]
    },
    "ManagedPolicyArns": ["arn:aws:iam::aws:policy/AmazonLocationServiceFullAccess"]
  }
},
"VehicleTracker": {
  "Type": "AWS::Location::Tracker",
  "Properties": {
    "TrackerName": {"Fn::Sub": "${EnvironmentName}-vehicle-tracker"},
    "PositionFiltering": "AccuracyBased",
    "PricingPlan": "RequestBasedUsage",
    "Description": "Tracker for fleet vehicles",
    "Tags": [
      {"Key": "Environment", "Value": {"Ref": "EnvironmentName"}},
      {"Key": "Project", "Value": "Fleet Management"}
    ]
  }
},
"RouteCalculator": {
  "Type": "AWS::Location::RouteCalculator",
  "Properties": {
    "CalculatorName": {"Fn::Sub": "${EnvironmentName}-route-calculator"},
    "Description": "Route calculator for fleet optimization",
    "PricingPlan": "RequestBasedUsage",
    "Tags": [
      {"Key": "Environment", "Value": {"Ref": "EnvironmentName"}},
      {"Key": "Project", "Value": "Fleet Management"}
    ]
  }
},
"ServiceAreaGeofenceCollection": {
  "Type": "AWS::Location::GeofenceCollection",
  "Properties": {
    "CollectionName": {"Fn::Sub": "${EnvironmentName}-service-areas"},
    "Description": "Geofence collection for service areas",
    "PricingPlan": "RequestBasedUsage",
    "Tags": [
      {"Key": "Environment", "Value": {"Ref": "EnvironmentName"}},
      {"Key": "Project", "Value": "Fleet Management"}
    ]
  }
}
```

Let's add the Data Processing resources:

```json
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
      "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole",
      "arn:aws:iam::aws:policy/AmazonKinesisReadOnlyAccess",
      "arn:aws:iam::aws:policy/AmazonDynamoDBFullAccess",
      "arn:aws:iam::aws:policy/AmazonSNSFullAccess",
      "arn:aws:iam::aws:policy/AmazonSageMakerFullAccess"
    ]
  }
},
"TelemetryProcessorFunction": {
  "Type": "AWS::Lambda::Function",
  "Properties": {
    "FunctionName": {"Fn::Sub": "${EnvironmentName}-telemetry-processor"},
    "Handler": "index.handler",
    "Role": {"Fn::GetAtt": ["LambdaExecutionRole", "Arn"]},
    "Code": {
      "ZipFile": "exports.handler = async (event) => {\n  console.log('Processing vehicle telemetry');\n  // Process records from Kinesis and store in DynamoDB\n  return { statusCode: 200 };\n};"
    },
    "Runtime": "nodejs16.x",
    "Timeout": 60,
    "MemorySize": 512,
    "Environment": {
      "Variables": {
        "TELEMETRY_TABLE": {"Ref": "TelemetryDataTable"},
        "ENVIRONMENT": {"Ref": "EnvironmentName"}
      }
    },
    "Tags": [
      {"Key": "Environment", "Value": {"Ref": "EnvironmentName"}},
      {"Key": "Project", "Value": "Fleet Management"}
    ]
  }
},
"AlertGeneratorFunction": {
  "Type": "AWS::Lambda::Function",
  "Properties": {
    "FunctionName": {"Fn::Sub": "${EnvironmentName}-alert-generator"},
    "Handler": "index.handler",
    "Role": {"Fn::GetAtt": ["LambdaExecutionRole", "Arn"]},
    "Code": {
      "ZipFile": "exports.handler = async (event) => {\n  console.log('Generating alerts based on thresholds');\n  // Generate alerts based on thresholds\n  return { statusCode: 200 };\n};"
    },
    "Runtime": "nodejs16.x",
    "Timeout": 60,
    "MemorySize": 512,
    "Environment": {
      "Variables": {
        "ALERT_TOPIC_ARN": {"Ref": "OperationsAlertTopic"},
        "ENVIRONMENT": {"Ref": "EnvironmentName"}
      }
    },
    "Tags": [
      {"Key": "Environment", "Value": {"Ref": "EnvironmentName"}},
      {"Key": "Project", "Value": "Fleet Management"}
    ]
  }
},
"MLInferenceFunction": {
  "Type": "AWS::Lambda::Function",
  "Properties": {
    "FunctionName": {"Fn::Sub": "${EnvironmentName}-ml-inference-coordinator"},
    "Handler": "index.handler",
    "Role": {"Fn::GetAtt": ["LambdaExecutionRole", "Arn"]},
    "Code": {
      "ZipFile": "exports.handler = async (event) => {\n  console.log('Coordinating ML inference');\n  // Coordinate ML inference for predictive maintenance\n  return { statusCode: 200 };\n};"
    },
    "Runtime": "nodejs16.x",
    "Timeout": 300,
    "MemorySize": 1024,
    "Environment": {
      "Variables": {
        "SAGEMAKER_ENDPOINT": {"Fn::GetAtt": ["MaintenanceModelEndpoint", "EndpointName"]},
        "ENVIRONMENT": {"Ref": "EnvironmentName"}
      }
    },
    "Tags": [
      {"Key": "Environment", "Value": {"Ref": "EnvironmentName"}},
      {"Key": "Project", "Value": "Fleet Management"}
    ]
  }
},
"TelemetryProcessorEventSourceMapping": {
  "Type": "AWS::Lambda::EventSourceMapping",
  "Properties": {
    "BatchSize": 100,
    "Enabled": true,
    "EventSourceArn": {"Fn::GetAtt": ["TelemetryStream", "Arn"]},
    "FunctionName": {"Fn::GetAtt": ["TelemetryProcessorFunction", "Arn"]},
    "StartingPosition": "LATEST"
  }
}
```

Now, let's add the Historical Data and Analytics resources:

```json
"RawTelemetryBucket": {
  "Type": "AWS::S3::Bucket",
  "Properties": {
    "BucketName": {"Fn::Sub": "${EnvironmentName}-raw-telemetry-${AWS::AccountId}"},
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
              "StorageClass": "STANDARD_IA",
              "TransitionInDays": 90
            },
            {
              "StorageClass": "GLACIER",
              "TransitionInDays": 180
            }
          ],
          "NoncurrentVersionTransitions": [
            {
              "StorageClass": "GLACIER",
              "TransitionInDays": 30
            }
          ],
          "ExpirationInDays": 730,
          "NoncurrentVersionExpirationInDays": 90
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
    "Tags": [
      {"Key": "Environment", "Value": {"Ref": "EnvironmentName"}},
      {"Key": "Project", "Value": "Fleet Management"}
    ]
  }
}
```

Let's add the Data Cataloging and Querying resources:

```json
"GlueServiceRole": {
  "Type": "AWS::IAM::Role",
  "Properties": {
    "AssumeRolePolicyDocument": {
      "Version": "2012-10-17",
      "Statement": [
        {
          "Effect": "Allow",
          "Principal": {
            "Service": "glue.amazonaws.com"
          },
          "Action": "sts:AssumeRole"
        }
      ]
    },
    "ManagedPolicyArns": [
      "arn:aws:iam::aws:policy/service-role/AWSGlueServiceRole",
      "arn:aws:iam::aws:policy/AmazonS3FullAccess"
    ]
  }
},
"FleetDatabase": {
  "Type": "AWS::Glue::Database",
  "Properties": {
    "CatalogId": {"Ref": "AWS::AccountId"},
    "DatabaseInput": {
      "Name": {"Fn::Sub": "${EnvironmentName}_fleet_db"},
      "Description": "Database for fleet management data"
    }
  }
},
"TelemetryCrawler": {
  "Type": "AWS::Glue::Crawler",
  "Properties": {
    "Name": {"Fn::Sub": "${EnvironmentName}-telemetry-crawler"},
    "Role": {"Fn::GetAtt": ["GlueServiceRole", "Arn"]},
    "DatabaseName": {"Ref": "FleetDatabase"},
    "Targets": {
      "S3Targets": [
        {
          "Path": {"Fn::Sub": "s3://${RawTelemetryBucket}/telemetry-data/"}
        }
      ]
    },
    "SchemaChangePolicy": {
      "UpdateBehavior": "UPDATE_IN_DATABASE",
      "DeleteBehavior": "LOG"
    },
    "Schedule": {
      "ScheduleExpression": "cron(0 0 * * ? *)"
    },
    "Configuration": "{\"Version\":1.0,\"CrawlerOutput\":{\"Partitions\":{\"AddOrUpdateBehavior\":\"InheritFromTable\"},\"Tables\":{\"AddOrUpdateBehavior\":\"MergeNewColumns\"}}}"
  }
},
"AthenaWorkgroup": {
  "Type": "AWS::Athena::WorkGroup",
  "Properties": {
    "Name": {"Fn::Sub": "${EnvironmentName}-fleet-analytics"},
    "Description": "Workgroup for fleet analytics queries",
    "State": "ENABLED",
    "WorkGroupConfiguration": {
      "ResultConfiguration": {
        "OutputLocation": {"Fn::Sub": "s3://${AthenaResultsBucket}/"}
      },
      "EnforceWorkGroupConfiguration": true,
      "PublishCloudWatchMetricsEnabled": true,
      "BytesScannedCutoffPerQuery": 10737418240
    },
    "Tags": [
      {"Key": "Environment", "Value": {"Ref": "EnvironmentName"}},
      {"Key": "Project", "Value": "Fleet Management"}
    ]
  }
},
"AthenaResultsBucket": {
  "Type": "AWS::S3::Bucket",
  "Properties": {
    "BucketName": {"Fn::Sub": "${EnvironmentName}-athena-results-${AWS::AccountId}"},
    "LifecycleConfiguration": {
      "Rules": [
        {
          "Id": "DeleteOldResults",
          "Status": "Enabled",
          "ExpirationInDays": 30
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
    "Tags": [
      {"Key": "Environment", "Value": {"Ref": "EnvironmentName"}},
      {"Key": "Project", "Value": "Fleet Management"}
    ]
  }
}
```

Let's add the Business Intelligence resources:

```json
"QuickSightRole": {
  "Type": "AWS::IAM::Role",
  "Properties": {
    "AssumeRolePolicyDocument": {
      "Version": "2012-10-17",
      "Statement": [
        {
          "Effect": "Allow",
          "Principal": {
            "Service": "quicksight.amazonaws.com"
          },
          "Action": "sts:AssumeRole"
        }
      ]
    },
    "ManagedPolicyArns": [
      "arn:aws:iam::aws:policy/AmazonS3ReadOnlyAccess",
      "arn:aws:iam::aws:policy/AmazonDynamoDBReadOnlyAccess",
      "arn:aws:iam::aws:policy/service-role/AWSQuicksightAthenaAccess"
    ]
  }
}
```

Let's add the Workflow Orchestration resources:

```json
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
    "ManagedPolicyArns": [
      "arn:aws:iam::aws:policy/AmazonDynamoDBFullAccess",
      "arn:aws:iam::aws:policy/AmazonSNSFullAccess",
      "arn:aws:iam::aws:policy/service-role/AWSLambdaRole"
    ]
  }
},
"MaintenanceWorkflow": {
  "Type": "AWS::StepFunctions::StateMachine",
  "Properties": {
    "StateMachineName": {"Fn::Sub": "${EnvironmentName}-maintenance-workflow"},
    "RoleArn": {"Fn::GetAtt": ["StepFunctionsRole", "Arn"]},
    "Definition": {
      "Comment": "State machine for vehicle maintenance workflow",
      "StartAt": "ScheduleInspection",
      "States": {
        "ScheduleInspection": {
          "Type": "Task",
          "Resource": "arn:aws:states:::lambda:invoke",
          "Parameters": {
            "FunctionName": "PLACEHOLDER_FUNCTION_ARN",
            "Payload": {
              "action": "scheduleInspection",
              "vehicleId.$": "$.vehicleId",
              "maintenanceType.$": "$.maintenanceType"
            }
          },
          "Next": "OrderParts",
          "Catch": [
            {
              "ErrorEquals": ["States.ALL"],
              "Next": "HandleError"
            }
          ]
        },
        "OrderParts": {
          "Type": "Task",
          "Resource": "arn:aws:states:::lambda:invoke",
          "Parameters": {
            "FunctionName": "PLACEHOLDER_FUNCTION_ARN",
            "Payload": {
              "action": "orderParts",
              "vehicleId.$": "$.vehicleId",
              "parts.$": "$.parts"
            }
          },
          "Next": "AssignTechnician",
          "Retry": [
            {
              "ErrorEquals": ["States.ALL"],
              "IntervalSeconds": 60,
              "MaxAttempts": 3,
              "BackoffRate": 2
            }
          ],
          "Catch": [
            {
              "ErrorEquals": ["States.ALL"],
              "Next": "HandleError"
            }
          ]
        },
        "AssignTechnician": {
          "Type": "Task",
          "Resource": "arn:aws:states:::lambda:invoke",
          "Parameters": {
            "FunctionName": "PLACEHOLDER_FUNCTION_ARN",
            "Payload": {
              "action": "assignTechnician",
              "vehicleId.$": "$.vehicleId",
              "maintenanceType.$": "$.maintenanceType",
              "scheduledDate.$": "$.scheduledDate"
            }
          },
          "Next": "NotifyFleetManager",
          "Catch": [
            {
              "ErrorEquals": ["States.ALL"],
              "Next": "HandleError"
            }
          ]
        },
        "NotifyFleetManager": {
          "Type": "Task",
          "Resource": "arn:aws:states:::sns:publish",
          "Parameters": {
            "TopicArn": {"Ref": "OperationsAlertTopic"},
            "Message": {
              "vehicleId.$": "$.vehicleId",
              "maintenanceType.$": "$.maintenanceType",
              "scheduledDate.$": "$.scheduledDate",
              "technician.$": "$.technician"
            },
            "Subject": "Maintenance Scheduled"
          },
          "End": true
        },
        "HandleError": {
          "Type": "Task",
          "Resource": "arn:aws:states:::sns:publish",
          "Parameters": {
            "TopicArn": {"Ref": "OperationsAlertTopic"},
            "Message": {
              "error.$": "$.error",
              "vehicleId.$": "$.vehicleId"
            },
            "Subject": "Maintenance Workflow Error"
          },
          "End": true
        }
      }
    },
    "Tags": [
      {"Key": "Environment", "Value": {"Ref": "EnvironmentName"}},
      {"Key": "Project", "Value": "Fleet Management"}
    ]
  }
}
```

Let's add the Event-Driven Architecture resources:

```json
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
    "ManagedPolicyArns": [
      "arn:aws:iam::aws:policy/AmazonSNSFullAccess",
      "arn:aws:iam::aws:policy/service-role/AWSLambdaRole",
      "arn:aws:iam::aws:policy/AmazonStepFunctionsFullAccess"
    ]
  }
},
"MaintenanceScheduleRule": {
  "Type": "AWS::Events::Rule",
  "Properties": {
    "Name": {"Fn::Sub": "${EnvironmentName}-maintenance-scheduler"},
    "Description": "Scheduled rule to trigger maintenance checks",
    "ScheduleExpression": "rate(1 day)",
    "State": "ENABLED",
    "Targets": [
      {
        "Arn": {"Fn::GetAtt": ["MLInferenceFunction", "Arn"]},
        "Id": "MLInferenceTarget",
        "Input": "{\"action\": \"scheduledMaintenance\"}"
      }
    ]
  }
},
"VehicleConditionRule": {
  "Type": "AWS::Events::Rule",
  "Properties": {
    "Name": {"Fn::Sub": "${EnvironmentName}-vehicle-condition-monitor"},
    "Description": "Rule to trigger workflows based on vehicle conditions",
    "EventPattern": {
      "source": ["aws.iot"],
      "detail-type": ["IoT Rule Trigger"],
      "detail": {
        "ruleName": [{"Fn::Sub": "${EnvironmentName}-vehicle-condition-rule"}]
      }
    },
    "State": "ENABLED",
    "Targets": [
      {
        "Arn": {"Ref": "MaintenanceWorkflow"},
        "Id": "MaintenanceWorkflowTarget",
        "RoleArn": {"Fn::GetAtt": ["EventBridgeRole", "Arn"]}
      }
    ]
  }
},
"VehicleConditionRulePermission": {
  "Type": "AWS::Lambda::Permission",
  "Properties": {
    "Action": "lambda:InvokeFunction",
    "FunctionName": {"Fn::GetAtt": ["MLInferenceFunction", "Arn"]},
    "Principal": "events.amazonaws.com",
    "SourceArn": {"Fn::GetAtt": ["MaintenanceScheduleRule", "Arn"]}
  }
}
```

Let's add the Notifications resources:

```json
"OperationsAlertTopic": {
  "Type": "AWS::SNS::Topic",
  "Properties": {
    "TopicName": {"Fn::Sub": "${EnvironmentName}-vehicle-alerts"},
    "DisplayName": "Vehicle Alert Notifications",
    "Tags": [
      {"Key": "Environment", "Value": {"Ref": "EnvironmentName"}},
      {"Key": "Project", "Value": "Fleet Management"}
    ]
  }
},
"OperationsAlertSubscription": {
  "Type": "AWS::SNS::Subscription",
  "Properties": {
    "TopicArn": {"Ref": "OperationsAlertTopic"},
    "Protocol": "email",
    "Endpoint": {"Ref": "OperationsEmail"}
  }
},
"EmailIdentity": {
  "Type": "AWS::SES::EmailIdentity",
  "Properties": {
    "EmailIdentity": {"Ref": "OperationsEmail"}
  }
},
"MaintenanceEmailTemplate": {
  "Type": "AWS::SES::Template",
  "Properties": {
    "Template": {
      "TemplateName": {"Fn::Sub": "${EnvironmentName}-maintenance-notification"},
      "SubjectPart": "Vehicle Maintenance Notification - {{vehicleId}}",
      "HtmlPart": "<h1>Vehicle Maintenance Required</h1><p>Vehicle {{vehicleId}} requires maintenance of type {{maintenanceType}}. Scheduled for {{scheduledDate}}.</p>",
      "TextPart": "Vehicle Maintenance Required\n\nVehicle {{vehicleId}} requires maintenance of type {{maintenanceType}}. Scheduled for {{scheduledDate}}."
    }
  }
}
```

Let's add the Monitoring and Observability resources:

```json
"FleetMetricsDashboard": {
  "Type": "AWS::CloudWatch::Dashboard",
  "Properties": {
    "DashboardName": {"Fn::Sub": "${EnvironmentName}-fleet-metrics"},
    "DashboardBody": {
      "Fn::Join": ["", [
        "{\"widgets\":[",
        "{\"type\":\"metric\",\"width\":12,\"height\":6,\"properties\":{\"metrics\":[[\"AWS/IoT\",\"Connected.Devices\",\"ThingTypeName\",\"Vehicle\"]],\"view\":\"timeSeries\",\"stacked\":false,\"region\":\"",
        {"Ref": "AWS::Region"},
        "\",\"title\":\"Connected Vehicles\",\"period\":300}},",
        "{\"type\":\"metric\",\"width\":12,\"height\":6,\"properties\":{\"metrics\":[[\"AWS/Kinesis\",\"IncomingRecords\",\"StreamName\",\"",
        {"Ref": "TelemetryStream"},
        "\"]],\"view\":\"timeSeries\",\"stacked\":false,\"region\":\"",
        {"Ref": "AWS::Region"},
        "\",\"title\":\"Incoming Telemetry Records\",\"period\":60}},",
        "{\"type\":\"metric\",\"width\":12,\"height\":6,\"properties\":{\"metrics\":[[\"AWS/DynamoDB\",\"ConsumedWriteCapacityUnits\",\"TableName\",\"",
        {"Ref": "TelemetryDataTable"},
        "\"]],\"view\":\"timeSeries\",\"stacked\":false,\"region\":\"",
        {"Ref": "AWS::Region"},
        "\",\"title\":\"DynamoDB Write Activity\",\"period\":300}},",
        "{\"type\":\"metric\",\"width\":12,\"height\":6,\"properties\":{\"metrics\":[[\"AWS/Lambda\",\"Invocations\",\"FunctionName\",\"",
        {"Ref": "TelemetryProcessorFunction"},
        "\"]],\"view\":\"timeSeries\",\"stacked\":false,\"region\":\"",
        {"Ref": "AWS::Region"},
        "\",\"title\":\"Telemetry Processor Invocations\",\"period\":60}}",
        "]}"
      ]]
    }
  }
},
"VehicleTemperatureAnomaly": {
  "Type": "AWS::CloudWatch::AnomalyDetector",
  "Properties": {
    "MetricName": "EngineTemperature",
    "Namespace": "FleetManagement",
    "Stat": "Average",
    "MetricMathAnomalyDetector": {
      "MetricDataQueries": [
        {
          "Id": "m1",
          "MetricStat": {
            "Metric": {
              "MetricName": "EngineTemperature",
              "Namespace": "FleetManagement"
            },
            "Period": 300,
            "Stat": "Average"
          },
          "ReturnData": true
        }
      ]
    }
  }
},
"TelemetryProcessorErrorAlarm": {
  "Type": "AWS::CloudWatch::Alarm",
  "Properties": {
    "AlarmName": {"Fn::Sub": "${EnvironmentName}-telemetry-processor-errors"},
    "AlarmDescription": "Alarm if the Telemetry Processor Lambda function has errors",
    "MetricName": "Errors",
    "Namespace": "AWS/Lambda",
    "Statistic": "Sum",
    "Period": 60,
    "EvaluationPeriods": 1,
    "Threshold": 1,
    "ComparisonOperator": "GreaterThanOrEqualToThreshold",
    "Dimensions": [
      {
        "Name": "FunctionName",
        "Value": {"Ref": "TelemetryProcessorFunction"}
      }
    ],
    "AlarmActions": [{"Ref": "OperationsAlertTopic"}]
  }
}
```

Finally, let's add the API Layer resources:

```json
"ApiGatewayRole": {
  "Type": "AWS::IAM::Role",
  "Properties": {
    "AssumeRolePolicyDocument": {
      "Version": "2012-10-17",
      "Statement": [
        {
          "Effect": "Allow",
          "Principal": {
            "Service": "apigateway.amazonaws.com"
          },
          "Action": "sts:AssumeRole"
        }
      ]
    },
    "ManagedPolicyArns": [
      "arn:aws:iam::aws:policy/AmazonDynamoDBReadOnlyAccess",
      "arn:aws:iam::aws:policy/service-role/AWSLambdaRole"
    ]
  }
},
"FleetManagementApi": {
  "Type": "AWS::ApiGateway::RestApi",
  "Properties": {
    "Name": {"Fn::Sub": "${EnvironmentName}-fleet-management-api"},
    "Description": "API for fleet management platform",
    "EndpointConfiguration": {
      "Types": ["REGIONAL"]
    },
    "Tags": [
      {"Key": "Environment", "Value": {"Ref": "EnvironmentName"}},
      {"Key": "Project", "Value": "Fleet Management"}
    ]
  }
},
"ApiVehiclesResource": {
  "Type": "AWS::ApiGateway::Resource",
  "Properties": {
    "RestApiId": {"Ref": "FleetManagementApi"},
    "ParentId": {"Fn::GetAtt": ["FleetManagementApi", "RootResourceId"]},
    "PathPart": "vehicles"
  }
},
"ApiVehicleIdResource": {
  "Type": "AWS::ApiGateway::Resource",
  "Properties": {
    "RestApiId": {"Ref": "FleetManagementApi"},
    "ParentId": {"Ref": "ApiVehiclesResource"},
    "PathPart": "{vehicleId}"
  }
},
"ApiMaintenanceResource": {
  "Type": "AWS::ApiGateway::Resource",
  "Properties": {
    "RestApiId": {"Ref": "FleetManagementApi"},
    "ParentId": {"Ref": "ApiVehicleIdResource"},
    "PathPart": "maintenance"
  }
},
"ApiTelemetryResource": {
  "Type": "AWS::ApiGateway::Resource",
  "Properties": {
    "RestApiId": {"Ref": "FleetManagementApi"},
    "ParentId": {"Ref": "ApiVehicleIdResource"},
    "PathPart": "telemetry"
  }
},
"ApiAnalyticsResource": {
  "Type": "AWS::ApiGateway::Resource",
  "Properties": {
    "RestApiId": {"Ref": "FleetManagementApi"},
    "ParentId": {"Fn::GetAtt": ["FleetManagementApi", "RootResourceId"]},
    "PathPart": "analytics"
  }
},
"ApiGetVehicleMethod": {
  "Type": "AWS::ApiGateway::Method",
  "Properties": {
    "AuthorizationType": "AWS_IAM",
    "HttpMethod": "GET",
    "Integration": {
      "Type": "AWS",
      "IntegrationHttpMethod": "POST",
      "Uri": {"Fn::Sub": "arn:aws:apigateway:${AWS::Region}:lambda:path/2015-03-31/functions/${GetVehicleFunction.Arn}/invocations"},
      "IntegrationResponses": [
        {
          "StatusCode": "200",
          "ResponseParameters": {
            "method.response.header.Access-Control-Allow-Origin": "'*'"
          }
        }
      ]
    },
    "MethodResponses": [
      {
        "StatusCode": "200",
        "ResponseParameters": {
          "method.response.header.Access-Control-Allow-Origin": true
        }
      }
    ],
    "ResourceId": {"Ref": "ApiVehicleIdResource"},
    "RestApiId": {"Ref": "FleetManagementApi"}
  }
},
"ApiGetVehicleOptionsMethod": {
  "Type": "AWS::ApiGateway::Method",
  "Properties": {
    "AuthorizationType": "NONE",
    "HttpMethod": "OPTIONS",
    "Integration": {
      "Type": "MOCK",
      "IntegrationResponses": [
        {
          "StatusCode": "200",
          "ResponseParameters": {
            "method.response.header.Access-Control-Allow-Headers": "'Content-Type,X-Amz-Date,Authorization,X-Api-Key'",
            "method.response.header.Access-Control-Allow-Methods": "'GET,OPTIONS'",
            "method.response.header.Access-Control-Allow-Origin": "'*'"
          },
          "ResponseTemplates": {
            "application/json": ""
          }
        }
      ],
      "PassthroughBehavior": "WHEN_NO_TEMPLATES",
      "RequestTemplates": {
        "application/json": "{\"statusCode\": 200}"
      }
    },
    "MethodResponses": [
      {
        "StatusCode": "200",
        "ResponseParameters": {
          "method.response.header.Access-Control-Allow-Headers": true,
          "method.response.header.Access-Control-Allow-Methods": true,
          "method.response.header.Access-Control-Allow-Origin": true
        }
      }
    ],
    "ResourceId": {"Ref": "ApiVehicleIdResource"},
    "RestApiId": {"Ref": "FleetManagementApi"}
  }
},
"GetVehicleFunction": {
  "Type": "AWS::Lambda::Function",
  "Properties": {
    "FunctionName": {"Fn::Sub": "${EnvironmentName}-get-vehicle-details"},
    "Handler": "index.handler",
    "Role": {"Fn::GetAtt": ["LambdaExecutionRole", "Arn"]},
    "Code": {
      "ZipFile": "exports.handler = async (event) => {\n  console.log('Getting vehicle details');\n  // Retrieve vehicle details from DynamoDB\n  const vehicleId = event.pathParameters.vehicleId;\n  return {\n    statusCode: 200,\n    headers: { 'Access-Control-Allow-Origin': '*' },\n    body: JSON.stringify({ vehicleId, status: 'Active', lastReported: new Date().toISOString() })\n  };\n};"
    },
    "Runtime": "nodejs16.x",
    "Timeout": 30,
    "MemorySize": 256,
    "Environment": {
      "Variables": {
        "VEHICLE_PROFILE_TABLE": {"Ref": "VehicleProfileTable"},
        "ENVIRONMENT": {"Ref": "EnvironmentName"}
      }
    },
    "Tags": [
      {"Key": "Environment", "Value": {"Ref": "EnvironmentName"}},
      {"Key": "Project", "Value": "Fleet Management"}
    ]
  }
},
"GetVehicleLambdaPermission": {
  "Type": "AWS::Lambda::Permission",
  "Properties": {
    "Action": "lambda:InvokeFunction",
    "FunctionName": {"Fn::GetAtt": ["GetVehicleFunction", "Arn"]},
    "Principal": "apigateway.amazonaws.com",
    "SourceArn": {"Fn::Sub": "arn:aws:execute-api:${AWS::Region}:${AWS::AccountId}:${FleetManagementApi}/*/GET/vehicles/{vehicleId}"}
  }
},
"ApiDeployment": {
  "Type": "AWS::ApiGateway::Deployment",
  "DependsOn": ["ApiGetVehicleMethod", "ApiGetVehicleOptionsMethod"],
  "Properties": {
    "RestApiId": {"Ref": "FleetManagementApi"},
    "StageName": {"Ref": "EnvironmentName"}
  }
}
```

Let's add the Outputs section:

```json
"Outputs": {
  "ApiEndpoint": {
    "Description": "Fleet Management API Endpoint",
    "Value": {"Fn::Sub": "https://${FleetManagementApi}.execute-api.${AWS::Region}.amazonaws.com/${EnvironmentName}"}
  },
  "TelemetryStreamName": {
    "Description": "Kinesis Stream for Vehicle Telemetry",
    "Value": {"Ref": "TelemetryStream"},
    "Export": {
      "Name": {"Fn::Sub": "${AWS::StackName}-TelemetryStreamName"}
    }
  },
  "TelemetryDataTableName": {
    "Description": "DynamoDB Table for Vehicle Telemetry Data",
    "Value": {"Ref": "TelemetryDataTable"},
    "Export": {
      "Name": {"Fn::Sub": "${AWS::StackName}-TelemetryDataTableName"}
    }
  },
  "VehicleProfileTableName": {
    "Description": "DynamoDB Table for Vehicle Profiles",
    "Value": {"Ref": "VehicleProfileTable"},
    "Export": {
      "Name": {"Fn::Sub": "${AWS::StackName}-VehicleProfileTableName"}
    }
  },
  "MaintenanceRecordsTableName": {
    "Description": "DynamoDB Table for Maintenance Records",
    "Value": {"Ref": "MaintenanceRecordsTable"},
    "Export": {
      "Name": {"Fn::Sub": "${AWS::StackName}-MaintenanceRecordsTableName"}
    }
  },
  "RawTelemetryBucketName": {
    "Description": "S3 Bucket for Raw Telemetry Data",
    "Value": {"Ref": "RawTelemetryBucket"},
    "Export": {
      "Name": {"Fn::Sub": "${AWS::StackName}-RawTelemetryBucketName"}
    }
  },
  "MaintenanceModelEndpointName": {
    "Description": "SageMaker Endpoint for Maintenance Prediction",
    "Value": {"Fn::GetAtt": ["MaintenanceModelEndpoint", "EndpointName"]},
    "Export": {
      "Name": {"Fn::Sub": "${AWS::StackName}-MaintenanceModelEndpointName"}
    }
  },
  "OperationsAlertTopicArn": {
    "Description": "SNS Topic ARN for Operations Alerts",
    "Value": {"Ref": "OperationsAlertTopic"},
    "Export": {
      "Name": {"Fn::Sub": "${AWS::StackName}-OperationsAlertTopicArn"}
    }
  },
  "VehicleTrackerName": {
    "Description": "Amazon Location Service Tracker for Vehicles",
    "Value": {"Ref": "VehicleTracker"},
    "Export": {
      "Name": {"Fn::Sub": "${AWS::StackName}-VehicleTrackerName"}
    }
  },
  "RouteCalculatorName": {
    "Description": "Amazon Location Service Route Calculator",
    "Value": {"Ref": "RouteCalculator"},
    "Export": {
      "Name": {"Fn::Sub": "${AWS::StackName}-RouteCalculatorName"}
    }
  },
  "MaintenanceWorkflowArn": {
    "Description": "Step Functions State Machine ARN for Maintenance Workflow",
    "Value": {"Ref": "Main
### Answer
---

```
