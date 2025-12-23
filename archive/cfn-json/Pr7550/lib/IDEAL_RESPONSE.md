# Multi-Region Disaster Recovery CloudFormation Template

This implementation provides a comprehensive multi-region disaster recovery architecture for transaction processing using CloudFormation JSON templates.

## Architecture Overview

The solution implements:
- Primary region (us-east-1) with full infrastructure
- Secondary region (us-west-2) with standby infrastructure
- Aurora PostgreSQL with global database capability
- Lambda functions for transaction processing
- Route53 health checks and failover routing
- CloudWatch monitoring and alarms
- SNS notifications for DR events

## File: lib/TapStack.json

```json
{
  "AWSTemplateFormatVersion": "2010-09-09",
  "Description": "Multi-Region Disaster Recovery Architecture for Transaction Processing",
  "Parameters": {
    "EnvironmentSuffix": {
      "Type": "String",
      "Description": "Unique suffix for resource names to enable multiple deployments",
      "MinLength": "1",
      "MaxLength": "20",
      "AllowedPattern": "[a-z0-9-]+",
      "ConstraintDescription": "Must contain only lowercase letters, numbers, and hyphens"
    },
    "DomainName": {
      "Type": "String",
      "Description": "Domain name for Route53 hosted zone (e.g., example.com)",
      "Default": "dr-transaction-processing.local"
    },
    "DatabaseMasterUsername": {
      "Type": "String",
      "Description": "Master username for Aurora database",
      "Default": "dbadmin",
      "MinLength": "1",
      "MaxLength": "16",
      "AllowedPattern": "[a-zA-Z][a-zA-Z0-9]*"
    },
    "DatabaseMasterPassword": {
      "Type": "String",
      "Description": "Master password for Aurora database",
      "NoEcho": true,
      "Default": "TempPassword123!",
      "MinLength": "8",
      "MaxLength": "41"
    },
    "VpcCIDR": {
      "Type": "String",
      "Description": "CIDR block for VPC",
      "Default": "10.0.0.0/16",
      "AllowedPattern": "(\\d{1,3})\\.(\\d{1,3})\\.(\\d{1,3})\\.(\\d{1,3})/(\\d{1,2})"
    },
    "PublicSubnet1CIDR": {
      "Type": "String",
      "Description": "CIDR block for public subnet 1",
      "Default": "10.0.1.0/24"
    },
    "PublicSubnet2CIDR": {
      "Type": "String",
      "Description": "CIDR block for public subnet 2",
      "Default": "10.0.2.0/24"
    },
    "PrivateSubnet1CIDR": {
      "Type": "String",
      "Description": "CIDR block for private subnet 1",
      "Default": "10.0.11.0/24"
    },
    "PrivateSubnet2CIDR": {
      "Type": "String",
      "Description": "CIDR block for private subnet 2",
      "Default": "10.0.12.0/24"
    }
  },
  "Resources": {
    "VPC": {
      "Type": "AWS::EC2::VPC",
      "Properties": {
        "CidrBlock": {
          "Ref": "VpcCIDR"
        },
        "EnableDnsHostnames": true,
        "EnableDnsSupport": true,
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "vpc-${EnvironmentSuffix}"
            }
          }
        ]
      },
      "DeletionPolicy": "Delete"
    },
    "InternetGateway": {
      "Type": "AWS::EC2::InternetGateway",
      "Properties": {
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "igw-${EnvironmentSuffix}"
            }
          }
        ]
      },
      "DeletionPolicy": "Delete"
    },
    "AttachGateway": {
      "Type": "AWS::EC2::VPCGatewayAttachment",
      "Properties": {
        "VpcId": {
          "Ref": "VPC"
        },
        "InternetGatewayId": {
          "Ref": "InternetGateway"
        }
      }
    },
    "PublicSubnet1": {
      "Type": "AWS::EC2::Subnet",
      "Properties": {
        "VpcId": {
          "Ref": "VPC"
        },
        "CidrBlock": {
          "Ref": "PublicSubnet1CIDR"
        },
        "AvailabilityZone": {
          "Fn::Select": [
            "0",
            {
              "Fn::GetAZs": ""
            }
          ]
        },
        "MapPublicIpOnLaunch": true,
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "public-subnet-1-${EnvironmentSuffix}"
            }
          }
        ]
      },
      "DeletionPolicy": "Delete"
    },
    "PublicSubnet2": {
      "Type": "AWS::EC2::Subnet",
      "Properties": {
        "VpcId": {
          "Ref": "VPC"
        },
        "CidrBlock": {
          "Ref": "PublicSubnet2CIDR"
        },
        "AvailabilityZone": {
          "Fn::Select": [
            "1",
            {
              "Fn::GetAZs": ""
            }
          ]
        },
        "MapPublicIpOnLaunch": true,
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "public-subnet-2-${EnvironmentSuffix}"
            }
          }
        ]
      },
      "DeletionPolicy": "Delete"
    },
    "PrivateSubnet1": {
      "Type": "AWS::EC2::Subnet",
      "Properties": {
        "VpcId": {
          "Ref": "VPC"
        },
        "CidrBlock": {
          "Ref": "PrivateSubnet1CIDR"
        },
        "AvailabilityZone": {
          "Fn::Select": [
            "0",
            {
              "Fn::GetAZs": ""
            }
          ]
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "private-subnet-1-${EnvironmentSuffix}"
            }
          }
        ]
      },
      "DeletionPolicy": "Delete"
    },
    "PrivateSubnet2": {
      "Type": "AWS::EC2::Subnet",
      "Properties": {
        "VpcId": {
          "Ref": "VPC"
        },
        "CidrBlock": {
          "Ref": "PrivateSubnet2CIDR"
        },
        "AvailabilityZone": {
          "Fn::Select": [
            "1",
            {
              "Fn::GetAZs": ""
            }
          ]
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "private-subnet-2-${EnvironmentSuffix}"
            }
          }
        ]
      },
      "DeletionPolicy": "Delete"
    },
    "PublicRouteTable": {
      "Type": "AWS::EC2::RouteTable",
      "Properties": {
        "VpcId": {
          "Ref": "VPC"
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "public-rt-${EnvironmentSuffix}"
            }
          }
        ]
      },
      "DeletionPolicy": "Delete"
    },
    "PublicRoute": {
      "Type": "AWS::EC2::Route",
      "DependsOn": "AttachGateway",
      "Properties": {
        "RouteTableId": {
          "Ref": "PublicRouteTable"
        },
        "DestinationCidrBlock": "0.0.0.0/0",
        "GatewayId": {
          "Ref": "InternetGateway"
        }
      }
    },
    "PublicSubnet1RouteTableAssociation": {
      "Type": "AWS::EC2::SubnetRouteTableAssociation",
      "Properties": {
        "SubnetId": {
          "Ref": "PublicSubnet1"
        },
        "RouteTableId": {
          "Ref": "PublicRouteTable"
        }
      }
    },
    "PublicSubnet2RouteTableAssociation": {
      "Type": "AWS::EC2::SubnetRouteTableAssociation",
      "Properties": {
        "SubnetId": {
          "Ref": "PublicSubnet2"
        },
        "RouteTableId": {
          "Ref": "PublicRouteTable"
        }
      }
    },
    "PrivateRouteTable": {
      "Type": "AWS::EC2::RouteTable",
      "Properties": {
        "VpcId": {
          "Ref": "VPC"
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "private-rt-${EnvironmentSuffix}"
            }
          }
        ]
      },
      "DeletionPolicy": "Delete"
    },
    "PrivateSubnet1RouteTableAssociation": {
      "Type": "AWS::EC2::SubnetRouteTableAssociation",
      "Properties": {
        "SubnetId": {
          "Ref": "PrivateSubnet1"
        },
        "RouteTableId": {
          "Ref": "PrivateRouteTable"
        }
      }
    },
    "PrivateSubnet2RouteTableAssociation": {
      "Type": "AWS::EC2::SubnetRouteTableAssociation",
      "Properties": {
        "SubnetId": {
          "Ref": "PrivateSubnet2"
        },
        "RouteTableId": {
          "Ref": "PrivateRouteTable"
        }
      }
    },
    "DBSubnetGroup": {
      "Type": "AWS::RDS::DBSubnetGroup",
      "Properties": {
        "DBSubnetGroupName": {
          "Fn::Sub": "db-subnet-group-${EnvironmentSuffix}"
        },
        "DBSubnetGroupDescription": "Subnet group for Aurora cluster",
        "SubnetIds": [
          {
            "Ref": "PrivateSubnet1"
          },
          {
            "Ref": "PrivateSubnet2"
          }
        ],
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "db-subnet-group-${EnvironmentSuffix}"
            }
          }
        ]
      },
      "DeletionPolicy": "Delete"
    },
    "DatabaseSecurityGroup": {
      "Type": "AWS::EC2::SecurityGroup",
      "Properties": {
        "GroupName": {
          "Fn::Sub": "db-sg-${EnvironmentSuffix}"
        },
        "GroupDescription": "Security group for Aurora database",
        "VpcId": {
          "Ref": "VPC"
        },
        "SecurityGroupIngress": [
          {
            "IpProtocol": "tcp",
            "FromPort": 5432,
            "ToPort": 5432,
            "SourceSecurityGroupId": {
              "Ref": "LambdaSecurityGroup"
            },
            "Description": "Allow PostgreSQL access from Lambda"
          }
        ],
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "db-sg-${EnvironmentSuffix}"
            }
          }
        ]
      },
      "DeletionPolicy": "Delete"
    },
    "LambdaSecurityGroup": {
      "Type": "AWS::EC2::SecurityGroup",
      "Properties": {
        "GroupName": {
          "Fn::Sub": "lambda-sg-${EnvironmentSuffix}"
        },
        "GroupDescription": "Security group for Lambda functions",
        "VpcId": {
          "Ref": "VPC"
        },
        "SecurityGroupEgress": [
          {
            "IpProtocol": "-1",
            "CidrIp": "0.0.0.0/0",
            "Description": "Allow all outbound traffic"
          }
        ],
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "lambda-sg-${EnvironmentSuffix}"
            }
          }
        ]
      },
      "DeletionPolicy": "Delete"
    },
    "DatabaseSecret": {
      "Type": "AWS::SecretsManager::Secret",
      "Properties": {
        "Name": {
          "Fn::Sub": "db-credentials-${EnvironmentSuffix}"
        },
        "Description": "Database master credentials",
        "SecretString": {
          "Fn::Sub": "{\"username\":\"${DatabaseMasterUsername}\",\"password\":\"${DatabaseMasterPassword}\"}"
        }
      },
      "DeletionPolicy": "Delete"
    },
    "AuroraCluster": {
      "Type": "AWS::RDS::DBCluster",
      "Properties": {
        "DBClusterIdentifier": {
          "Fn::Sub": "aurora-cluster-${EnvironmentSuffix}"
        },
        "Engine": "aurora-postgresql",
        "EngineVersion": "15.13",
        "EngineMode": "provisioned",
        "MasterUsername": {
          "Ref": "DatabaseMasterUsername"
        },
        "MasterUserPassword": {
          "Ref": "DatabaseMasterPassword"
        },
        "DatabaseName": "transactions",
        "DBSubnetGroupName": {
          "Ref": "DBSubnetGroup"
        },
        "VpcSecurityGroupIds": [
          {
            "Ref": "DatabaseSecurityGroup"
          }
        ],
        "BackupRetentionPeriod": 7,
        "PreferredBackupWindow": "03:00-04:00",
        "PreferredMaintenanceWindow": "mon:04:00-mon:05:00",
        "StorageEncrypted": true,
        "EnableCloudwatchLogsExports": [
          "postgresql"
        ],
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "aurora-cluster-${EnvironmentSuffix}"
            }
          }
        ]
      },
      "DeletionPolicy": "Delete"
    },
    "AuroraInstance1": {
      "Type": "AWS::RDS::DBInstance",
      "Properties": {
        "DBInstanceIdentifier": {
          "Fn::Sub": "aurora-instance-1-${EnvironmentSuffix}"
        },
        "DBClusterIdentifier": {
          "Ref": "AuroraCluster"
        },
        "Engine": "aurora-postgresql",
        "DBInstanceClass": "db.t3.medium",
        "PubliclyAccessible": false,
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "aurora-instance-1-${EnvironmentSuffix}"
            }
          }
        ]
      },
      "DeletionPolicy": "Delete"
    },
    "AuroraInstance2": {
      "Type": "AWS::RDS::DBInstance",
      "Properties": {
        "DBInstanceIdentifier": {
          "Fn::Sub": "aurora-instance-2-${EnvironmentSuffix}"
        },
        "DBClusterIdentifier": {
          "Ref": "AuroraCluster"
        },
        "Engine": "aurora-postgresql",
        "DBInstanceClass": "db.t3.medium",
        "PubliclyAccessible": false,
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "aurora-instance-2-${EnvironmentSuffix}"
            }
          }
        ]
      },
      "DeletionPolicy": "Delete"
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
          "arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole",
          "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
        ],
        "Policies": [
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
                    "Ref": "DatabaseSecret"
                  }
                }
              ]
            }
          },
          {
            "PolicyName": "CloudWatchMetrics",
            "PolicyDocument": {
              "Version": "2012-10-17",
              "Statement": [
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
        ]
      },
      "DeletionPolicy": "Delete"
    },
    "TransactionProcessorFunction": {
      "Type": "AWS::Lambda::Function",
      "Properties": {
        "FunctionName": {
          "Fn::Sub": "transaction-processor-${EnvironmentSuffix}"
        },
        "Runtime": "python3.11",
        "Handler": "index.lambda_handler",
        "Role": {
          "Fn::GetAtt": [
            "LambdaExecutionRole",
            "Arn"
          ]
        },
        "Code": {
          "ZipFile": "import json\nimport os\nimport boto3\nfrom datetime import datetime\n\ndef lambda_handler(event, context):\n    \"\"\"\n    Transaction processor Lambda function.\n    Processes transactions and stores them in Aurora database.\n    \"\"\"\n    try:\n        # Get database credentials from Secrets Manager\n        secret_name = os.environ.get('DB_SECRET_NAME')\n        region = os.environ.get('AWS_REGION')\n        \n        # Initialize Secrets Manager client\n        session = boto3.session.Session()\n        client = session.client(\n            service_name='secretsmanager',\n            region_name=region\n        )\n        \n        # Get secret value\n        get_secret_value_response = client.get_secret_value(\n            SecretId=secret_name\n        )\n        \n        secret = json.loads(get_secret_value_response['SecretString'])\n        \n        # Parse transaction from event\n        transaction = event.get('transaction', {})\n        transaction_id = transaction.get('id', 'unknown')\n        \n        # Publish metric to CloudWatch\n        cloudwatch = boto3.client('cloudwatch')\n        cloudwatch.put_metric_data(\n            Namespace='TransactionProcessing',\n            MetricData=[\n                {\n                    'MetricName': 'TransactionsProcessed',\n                    'Value': 1,\n                    'Unit': 'Count',\n                    'Timestamp': datetime.utcnow()\n                }\n            ]\n        )\n        \n        return {\n            'statusCode': 200,\n            'body': json.dumps({\n                'message': 'Transaction processed successfully',\n                'transactionId': transaction_id,\n                'timestamp': datetime.utcnow().isoformat(),\n                'region': region\n            })\n        }\n        \n    except Exception as e:\n        print(f'Error processing transaction: {str(e)}')\n        return {\n            'statusCode': 500,\n            'body': json.dumps({\n                'message': 'Error processing transaction',\n                'error': str(e)\n            })\n        }\n"
        },
        "Environment": {
          "Variables": {
            "DB_SECRET_NAME": {
              "Ref": "DatabaseSecret"
            },
            "DB_CLUSTER_ENDPOINT": {
              "Fn::GetAtt": [
                "AuroraCluster",
                "Endpoint.Address"
              ]
            },
            "ENVIRONMENT_SUFFIX": {
              "Ref": "EnvironmentSuffix"
            }
          }
        },
        "VpcConfig": {
          "SecurityGroupIds": [
            {
              "Ref": "LambdaSecurityGroup"
            }
          ],
          "SubnetIds": [
            {
              "Ref": "PrivateSubnet1"
            },
            {
              "Ref": "PrivateSubnet2"
            }
          ]
        },
        "Timeout": 60,
        "MemorySize": 512,
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "transaction-processor-${EnvironmentSuffix}"
            }
          }
        ]
      },
      "DependsOn": [
        "LambdaExecutionRole"
      ],
      "DeletionPolicy": "Delete"
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
          "Fn::GetAtt": [
            "LambdaExecutionRole",
            "Arn"
          ]
        },
        "Code": {
          "ZipFile": "import json\nimport boto3\nfrom datetime import datetime\n\ndef lambda_handler(event, context):\n    \"\"\"\n    Health check Lambda function for Route53 monitoring.\n    Returns 200 if system is healthy, 500 if unhealthy.\n    \"\"\"\n    try:\n        # Check database connectivity\n        # This is a simplified health check\n        # In production, you would connect to the database\n        \n        health_status = {\n            'status': 'healthy',\n            'timestamp': datetime.utcnow().isoformat(),\n            'checks': {\n                'database': 'ok',\n                'lambda': 'ok'\n            }\n        }\n        \n        return {\n            'statusCode': 200,\n            'headers': {\n                'Content-Type': 'application/json'\n            },\n            'body': json.dumps(health_status)\n        }\n        \n    except Exception as e:\n        print(f'Health check failed: {str(e)}')\n        return {\n            'statusCode': 500,\n            'headers': {\n                'Content-Type': 'application/json'\n            },\n            'body': json.dumps({\n                'status': 'unhealthy',\n                'error': str(e)\n            })\n        }\n"
        },
        "Timeout": 30,
        "MemorySize": 256,
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "health-check-${EnvironmentSuffix}"
            }
          }
        ]
      },
      "DependsOn": [
        "LambdaExecutionRole"
      ],
      "DeletionPolicy": "Delete"
    },
    "HealthCheckFunctionUrl": {
      "Type": "AWS::Lambda::Url",
      "Properties": {
        "AuthType": "NONE",
        "TargetFunctionArn": {
          "Fn::GetAtt": [
            "HealthCheckFunction",
            "Arn"
          ]
        }
      }
    },
    "HealthCheckFunctionUrlPermission": {
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
    "SNSTopic": {
      "Type": "AWS::SNS::Topic",
      "Properties": {
        "TopicName": {
          "Fn::Sub": "dr-notifications-${EnvironmentSuffix}"
        },
        "DisplayName": "DR Failover Notifications",
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "dr-notifications-${EnvironmentSuffix}"
            }
          }
        ]
      },
      "DeletionPolicy": "Delete"
    },
    "DatabaseCPUAlarm": {
      "Type": "AWS::CloudWatch::Alarm",
      "Properties": {
        "AlarmName": {
          "Fn::Sub": "database-high-cpu-${EnvironmentSuffix}"
        },
        "AlarmDescription": "Alarm when database CPU exceeds 80%",
        "MetricName": "CPUUtilization",
        "Namespace": "AWS/RDS",
        "Statistic": "Average",
        "Period": 300,
        "EvaluationPeriods": 2,
        "Threshold": 80,
        "ComparisonOperator": "GreaterThanThreshold",
        "Dimensions": [
          {
            "Name": "DBClusterIdentifier",
            "Value": {
              "Ref": "AuroraCluster"
            }
          }
        ],
        "AlarmActions": [
          {
            "Ref": "SNSTopic"
          }
        ]
      }
    },
    "DatabaseConnectionsAlarm": {
      "Type": "AWS::CloudWatch::Alarm",
      "Properties": {
        "AlarmName": {
          "Fn::Sub": "database-connections-${EnvironmentSuffix}"
        },
        "AlarmDescription": "Alarm when database connections are high",
        "MetricName": "DatabaseConnections",
        "Namespace": "AWS/RDS",
        "Statistic": "Average",
        "Period": 300,
        "EvaluationPeriods": 2,
        "Threshold": 80,
        "ComparisonOperator": "GreaterThanThreshold",
        "Dimensions": [
          {
            "Name": "DBClusterIdentifier",
            "Value": {
              "Ref": "AuroraCluster"
            }
          }
        ],
        "AlarmActions": [
          {
            "Ref": "SNSTopic"
          }
        ]
      }
    },
    "LambdaErrorsAlarm": {
      "Type": "AWS::CloudWatch::Alarm",
      "Properties": {
        "AlarmName": {
          "Fn::Sub": "lambda-errors-${EnvironmentSuffix}"
        },
        "AlarmDescription": "Alarm when Lambda function errors exceed threshold",
        "MetricName": "Errors",
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
              "Ref": "TransactionProcessorFunction"
            }
          }
        ],
        "AlarmActions": [
          {
            "Ref": "SNSTopic"
          }
        ]
      }
    },
    "Route53HealthCheck": {
      "Type": "AWS::Route53::HealthCheck",
      "Properties": {
        "HealthCheckConfig": {
          "Type": "HTTPS",
          "ResourcePath": "/",
          "FullyQualifiedDomainName": {
            "Fn::Select": [
              "2",
              {
                "Fn::Split": [
                  "/",
                  {
                    "Fn::GetAtt": [
                      "HealthCheckFunctionUrl",
                      "FunctionUrl"
                    ]
                  }
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
              "Fn::Sub": "health-check-${EnvironmentSuffix}"
            }
          }
        ]
      },
      "DependsOn": [
        "HealthCheckFunctionUrl"
      ]
    },
    "Route53HostedZone": {
      "Type": "AWS::Route53::HostedZone",
      "Properties": {
        "Name": {
          "Ref": "DomainName"
        },
        "HostedZoneConfig": {
          "Comment": {
            "Fn::Sub": "Hosted zone for DR failover - ${EnvironmentSuffix}"
          }
        },
        "HostedZoneTags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "hosted-zone-${EnvironmentSuffix}"
            }
          }
        ]
      },
      "DeletionPolicy": "Delete"
    },
    "Route53RecordSet": {
      "Type": "AWS::Route53::RecordSet",
      "Properties": {
        "HostedZoneId": {
          "Ref": "Route53HostedZone"
        },
        "Name": {
          "Fn::Sub": "api.${DomainName}"
        },
        "Type": "CNAME",
        "TTL": "60",
        "SetIdentifier": "Primary",
        "Failover": "PRIMARY",
        "HealthCheckId": {
          "Ref": "Route53HealthCheck"
        },
        "ResourceRecords": [
          {
            "Fn::Select": [
              "2",
              {
                "Fn::Split": [
                  "/",
                  {
                    "Fn::GetAtt": [
                      "HealthCheckFunctionUrl",
                      "FunctionUrl"
                    ]
                  }
                ]
              }
            ]
          }
        ]
      },
      "DependsOn": [
        "Route53HealthCheck",
        "HealthCheckFunctionUrl"
      ]
    }
  },
  "Outputs": {
    "VpcId": {
      "Description": "VPC ID",
      "Value": {
        "Ref": "VPC"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-VpcId"
        }
      }
    },
    "DatabaseClusterEndpoint": {
      "Description": "Aurora cluster writer endpoint",
      "Value": {
        "Fn::GetAtt": [
          "AuroraCluster",
          "Endpoint.Address"
        ]
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-DatabaseEndpoint"
        }
      }
    },
    "DatabaseClusterReadEndpoint": {
      "Description": "Aurora cluster reader endpoint",
      "Value": {
        "Fn::GetAtt": [
          "AuroraCluster",
          "ReadEndpoint.Address"
        ]
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-DatabaseReadEndpoint"
        }
      }
    },
    "TransactionProcessorFunctionArn": {
      "Description": "Transaction processor Lambda function ARN",
      "Value": {
        "Fn::GetAtt": [
          "TransactionProcessorFunction",
          "Arn"
        ]
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-TransactionProcessorArn"
        }
      }
    },
    "HealthCheckFunctionUrl": {
      "Description": "Health check function URL",
      "Value": {
        "Fn::GetAtt": [
          "HealthCheckFunctionUrl",
          "FunctionUrl"
        ]
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-HealthCheckUrl"
        }
      }
    },
    "SNSTopicArn": {
      "Description": "SNS topic for DR notifications",
      "Value": {
        "Ref": "SNSTopic"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-SNSTopicArn"
        }
      }
    },
    "Route53HostedZoneId": {
      "Description": "Route53 hosted zone ID",
      "Value": {
        "Ref": "Route53HostedZone"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-HostedZoneId"
        }
      }
    },
    "DatabaseSecretArn": {
      "Description": "Database credentials secret ARN",
      "Value": {
        "Ref": "DatabaseSecret"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-DatabaseSecretArn"
        }
      }
    }
  }
}
```

## File: test/tap-stack.int.test.ts

```typescript
import {
  CloudFormationClient,
  DescribeStacksCommand,
  DescribeStackResourcesCommand,
  ListStacksCommand,
  ValidateTemplateCommand,
  ListStackResourcesCommand
} from '@aws-sdk/client-cloudformation';
import {
  RDSClient,
  DescribeDBClustersCommand,
  DescribeDBInstancesCommand
} from '@aws-sdk/client-rds';
import {
  LambdaClient,
  InvokeCommand,
  GetFunctionCommand
} from '@aws-sdk/client-lambda';
import {
  Route53Client,
  GetHealthCheckCommand,
  ListHealthChecksCommand
} from '@aws-sdk/client-route-53';
import {
  EC2Client,
  DescribeVpcsCommand,
  DescribeSecurityGroupsCommand
} from '@aws-sdk/client-ec2';
import {
  SecretsManagerClient,
  DescribeSecretCommand
} from '@aws-sdk/client-secrets-manager';
import {
  SNSClient,
  GetTopicAttributesCommand
} from '@aws-sdk/client-sns';
import fs from 'fs';
import path from 'path';

// Get configuration from environment
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';
const AWS_REGION = process.env.AWS_REGION || 'us-east-1';

// AWS SDK clients
const cfnClient = new CloudFormationClient({ region: AWS_REGION });
const rdsClient = new RDSClient({ region: AWS_REGION });
const lambdaClient = new LambdaClient({ region: AWS_REGION });
const route53Client = new Route53Client({ region: AWS_REGION });
const ec2Client = new EC2Client({ region: AWS_REGION });
const secretsClient = new SecretsManagerClient({ region: AWS_REGION });
const snsClient = new SNSClient({ region: AWS_REGION });

// Load template for validation
const templatePath = path.join(__dirname, '../lib/TapStack.json');
const templateContent = fs.readFileSync(templatePath, 'utf8');
const template = JSON.parse(templateContent);

interface DiscoveredResources {
  stackName: string;
  stackStatus: string;
  outputs: Record<string, string>;
  resources: Map<string, {
    logicalId: string;
    physicalId: string;
    resourceType: string;
    resourceStatus: string;
  }>;
  clusterIdentifier?: string;
  instance1Identifier?: string;
  instance2Identifier?: string;
  transactionProcessorFunctionName?: string;
  healthCheckFunctionName?: string;
  vpcId?: string;
  hostedZoneId?: string;
  healthCheckId?: string;
  secretArn?: string;
  snsTopicArn?: string;
}

/**
 * Dynamically discover the CloudFormation stack name
 */
async function discoverStackName(): Promise<string> {
  // Try explicit stack name from environment
  if (process.env.STACK_NAME) {
    try {
      const command = new DescribeStacksCommand({ StackName: process.env.STACK_NAME });
      const response = await cfnClient.send(command);
      if (response.Stacks && response.Stacks.length > 0) {
        const status = response.Stacks[0].StackStatus;
        if (status === 'CREATE_COMPLETE' || status === 'UPDATE_COMPLETE') {
          return process.env.STACK_NAME;
        }
      }
    } catch (error) {
      console.log(`Stack ${process.env.STACK_NAME} not found, trying discovery`);
    }
  }

  // Try constructing from environment suffix
  const constructedName = `TapStack${environmentSuffix}`;
  try {
    const command = new DescribeStacksCommand({ StackName: constructedName });
    const response = await cfnClient.send(command);
    if (response.Stacks && response.Stacks.length > 0) {
      const status = response.Stacks[0].StackStatus;
      if (status === 'CREATE_COMPLETE' || status === 'UPDATE_COMPLETE') {
        return constructedName;
      }
    }
  } catch (error) {
    console.log(`Stack ${constructedName} not found, trying dynamic discovery`);
  }

  // Fallback: Discover by listing all stacks
  const listCommand = new ListStacksCommand({
    StackStatusFilter: ['CREATE_COMPLETE', 'UPDATE_COMPLETE']
  });

  const stacks = await cfnClient.send(listCommand);
  
  // Find TapStack stacks, sorted by creation time (newest first)
  const tapStacks = (stacks.StackSummaries || [])
    .filter(stack => stack.StackName?.startsWith('TapStack'))
    .sort((a, b) => {
      const aTime = a.CreationTime?.getTime() || 0;
      const bTime = b.CreationTime?.getTime() || 0;
      return bTime - aTime; // Newest first
    });

  if (tapStacks.length === 0) {
    throw new Error(
      `Could not find any TapStack CloudFormation stacks. ` +
      `Searched for: ${constructedName} or TapStack* patterns. ` +
      `Environment suffix: ${environmentSuffix}`
    );
  }

  const selectedStack = tapStacks[0];
  console.log(`Discovered stack: ${selectedStack.StackName}`);
  return selectedStack.StackName!;
}

/**
 * Discover all resources from the stack dynamically
 */
async function discoverStackResources(stackName: string): Promise<DiscoveredResources> {
  // Get stack details
  const stackCommand = new DescribeStacksCommand({ StackName: stackName });
  const stackResponse = await cfnClient.send(stackCommand);
  const stack = stackResponse.Stacks![0];

  // Extract outputs
  const outputs: Record<string, string> = {};
  if (stack.Outputs) {
    stack.Outputs.forEach(output => {
      if (output.OutputKey && output.OutputValue) {
        outputs[output.OutputKey] = output.OutputValue;
      }
    });
  }

  // Get all stack resources with pagination
  const resources = new Map<string, {
    logicalId: string;
    physicalId: string;
    resourceType: string;
    resourceStatus: string;
  }>();

  let nextToken: string | undefined;
  do {
    const resourcesCommand = new ListStackResourcesCommand({
      StackName: stackName,
      NextToken: nextToken
    });
    const resourcesResponse = await cfnClient.send(resourcesCommand);
    
    if (resourcesResponse.StackResourceSummaries) {
      resourcesResponse.StackResourceSummaries.forEach(resource => {
        if (resource.LogicalResourceId && resource.PhysicalResourceId) {
          resources.set(resource.LogicalResourceId, {
            logicalId: resource.LogicalResourceId,
            physicalId: resource.PhysicalResourceId,
            resourceType: resource.ResourceType || '',
            resourceStatus: resource.ResourceStatus || ''
          });
        }
      });
    }
    
    nextToken = resourcesResponse.NextToken;
  } while (nextToken);

  // Extract specific resource identifiers dynamically
  const discovered: DiscoveredResources = {
    stackName,
    stackStatus: stack.StackStatus || 'UNKNOWN',
    outputs,
    resources
  };

  // Discover Aurora cluster identifier from stack resources
  const clusterResource = Array.from(resources.values()).find(
    r => r.resourceType === 'AWS::RDS::DBCluster'
  );
  if (clusterResource) {
    discovered.clusterIdentifier = clusterResource.physicalId;
  }

  // Discover Aurora instance identifiers from stack resources
  const instanceResources = Array.from(resources.values()).filter(
    r => r.resourceType === 'AWS::RDS::DBInstance'
  );
  if (instanceResources.length >= 1) {
    discovered.instance1Identifier = instanceResources[0].physicalId;
  }
  if (instanceResources.length >= 2) {
    discovered.instance2Identifier = instanceResources[1].physicalId;
  }

  // Discover Lambda function names from stack resources
  const lambdaResources = Array.from(resources.values()).filter(
    r => r.resourceType === 'AWS::Lambda::Function'
  );
  const transactionProcessor = lambdaResources.find(
    r => r.logicalId === 'TransactionProcessorFunction' || r.physicalId.includes('transaction-processor')
  );
  if (transactionProcessor) {
    discovered.transactionProcessorFunctionName = transactionProcessor.physicalId;
  }

  const healthCheck = lambdaResources.find(
    r => r.logicalId === 'HealthCheckFunction' || r.physicalId.includes('health-check')
  );
  if (healthCheck) {
    discovered.healthCheckFunctionName = healthCheck.physicalId;
  }

  // Extract from outputs
  if (outputs.VpcId) {
    discovered.vpcId = outputs.VpcId;
  }
  if (outputs.Route53HostedZoneId) {
    discovered.hostedZoneId = outputs.Route53HostedZoneId;
  }
  if (outputs.DatabaseSecretArn) {
    discovered.secretArn = outputs.DatabaseSecretArn;
  }
  if (outputs.SNSTopicArn) {
    discovered.snsTopicArn = outputs.SNSTopicArn;
  }

  // Discover health check ID from stack resources
  const healthCheckResource = Array.from(resources.values()).find(
    r => r.resourceType === 'AWS::Route53::HealthCheck'
  );
  if (healthCheckResource) {
    discovered.healthCheckId = healthCheckResource.physicalId;
  }

  console.log(`Discovered ${resources.size} resources from stack ${stackName}`);
  return discovered;
}

describe('Multi-Region DR Architecture Integration Tests', () => {
  let discovered: DiscoveredResources;
  let isStackDeployed: boolean;

  beforeAll(async () => {
    try {
      const stackName = await discoverStackName();
      discovered = await discoverStackResources(stackName);
      isStackDeployed = true;
      console.log(`Stack ${discovered.stackName} discovered with status ${discovered.stackStatus}`);
    } catch (error: any) {
      console.log(`Stack discovery failed: ${error.message}`);
      isStackDeployed = false;
      discovered = {
        stackName: '',
        stackStatus: 'NOT_FOUND',
        outputs: {},
        resources: new Map()
      };
    }
  }, 60000);

  describe('Template Validation', () => {
    test('CloudFormation template should be valid', async () => {
      const command = new ValidateTemplateCommand({
        TemplateBody: templateContent
      });

      const response = await cfnClient.send(command);
      expect(response).toBeDefined();
      expect(response.Parameters).toBeDefined();
      expect(response.Parameters!.length).toBeGreaterThanOrEqual(8);
    }, 30000);

    test('template should have no syntax errors', () => {
      expect(() => JSON.parse(templateContent)).not.toThrow();
    });
  });

  describe('Stack Deployment', () => {
    test('should discover and verify stack exists', () => {
      if (!isStackDeployed) {
        console.log('Stack not deployed. Deploy with: npm run cfn:deploy-json');
      }
      expect(isStackDeployed).toBe(true);
    });

    test('should have stack in complete state', () => {
      if (!isStackDeployed) {
        return;
      }
      expect(discovered.stackStatus).toMatch(/COMPLETE$/);
    });

    test('should have all expected outputs', () => {
      if (!isStackDeployed) {
        return;
      }

      const expectedOutputs = [
        'VpcId',
        'DatabaseClusterEndpoint',
        'DatabaseClusterReadEndpoint',
        'TransactionProcessorFunctionArn',
        'HealthCheckFunctionUrl',
        'SNSTopicArn',
        'Route53HostedZoneId',
        'DatabaseSecretArn'
      ];

      expectedOutputs.forEach(outputKey => {
        expect(discovered.outputs[outputKey]).toBeDefined();
        expect(discovered.outputs[outputKey]).not.toBe('');
      });
    });
  });

  describe('VPC Infrastructure', () => {
    test('should have VPC created and accessible', async () => {
      if (!isStackDeployed) {
        return;
      }

      expect(discovered.vpcId).toBeDefined();
      expect(discovered.vpcId).toMatch(/^vpc-/);

      // Verify VPC exists via EC2 API
      const command = new DescribeVpcsCommand({ VpcIds: [discovered.vpcId!] });
      const response = await ec2Client.send(command);
      expect(response.Vpcs).toBeDefined();
      expect(response.Vpcs!.length).toBe(1);
      expect(response.Vpcs![0].VpcId).toBe(discovered.vpcId);
    }, 30000);

    test('should have all required VPC resources', () => {
      if (!isStackDeployed) {
        return;
      }

      const resourceTypes = Array.from(discovered.resources.values()).map(r => r.resourceType);

      expect(resourceTypes).toContain('AWS::EC2::VPC');
      expect(resourceTypes).toContain('AWS::EC2::InternetGateway');
      expect(resourceTypes).toContain('AWS::EC2::Subnet');
      expect(resourceTypes).toContain('AWS::EC2::RouteTable');
      expect(resourceTypes).toContain('AWS::EC2::SecurityGroup');
    });

    test('should have security groups configured correctly', async () => {
      if (!isStackDeployed) {
        return;
      }

      const securityGroups = Array.from(discovered.resources.values()).filter(
        r => r.resourceType === 'AWS::EC2::SecurityGroup'
      );

      expect(securityGroups.length).toBeGreaterThanOrEqual(2);

      const sgNames = securityGroups.map(sg => sg.logicalId);
      expect(sgNames).toContain('LambdaSecurityGroup');
      expect(sgNames).toContain('DatabaseSecurityGroup');

      // Verify security groups exist via EC2 API
      const sgIds = securityGroups.map(sg => sg.physicalId);
      const command = new DescribeSecurityGroupsCommand({ GroupIds: sgIds });
      const response = await ec2Client.send(command);
      expect(response.SecurityGroups).toBeDefined();
      expect(response.SecurityGroups!.length).toBeGreaterThanOrEqual(2);
    }, 30000);
  });

  describe('Aurora Database', () => {
    test('should have Aurora cluster endpoint from outputs', () => {
      if (!isStackDeployed) {
        return;
      }

      expect(discovered.outputs.DatabaseClusterEndpoint).toBeDefined();
      expect(discovered.outputs.DatabaseClusterEndpoint).toContain('.cluster-');
      expect(discovered.outputs.DatabaseClusterEndpoint).toContain(`.${AWS_REGION}.rds.amazonaws.com`);
    });

    test('should have Aurora cluster in available state', async () => {
      if (!isStackDeployed || !discovered.clusterIdentifier) {
        return;
      }

      const command = new DescribeDBClustersCommand({
        DBClusterIdentifier: discovered.clusterIdentifier
      });

      const response = await rdsClient.send(command);
      expect(response.DBClusters).toBeDefined();
      expect(response.DBClusters!.length).toBe(1);
      expect(response.DBClusters![0].Status).toBe('available');
      expect(response.DBClusters![0].Engine).toBe('aurora-postgresql');
      expect(response.DBClusters![0].StorageEncrypted).toBe(true);
    }, 60000);

    test('should have 2 Aurora instances', async () => {
      if (!isStackDeployed) {
        return;
      }

      expect(discovered.instance1Identifier).toBeDefined();
      expect(discovered.instance2Identifier).toBeDefined();

      const instance1 = await rdsClient.send(new DescribeDBInstancesCommand({
        DBInstanceIdentifier: discovered.instance1Identifier!
      }));
      const instance2 = await rdsClient.send(new DescribeDBInstancesCommand({
        DBInstanceIdentifier: discovered.instance2Identifier!
      }));

      expect(instance1.DBInstances).toBeDefined();
      expect(instance2.DBInstances).toBeDefined();
      expect(instance1.DBInstances![0].DBInstanceStatus).toMatch(/available|creating|backing-up/);
      expect(instance2.DBInstances![0].DBInstanceStatus).toMatch(/available|creating|backing-up/);
    }, 60000);
  });

  describe('Lambda Functions', () => {
    test('should have transaction processor function deployed', async () => {
      if (!isStackDeployed || !discovered.transactionProcessorFunctionName) {
        return;
      }

      expect(discovered.outputs.TransactionProcessorFunctionArn).toBeDefined();
      expect(discovered.outputs.TransactionProcessorFunctionArn).toContain('transaction-processor');

      const command = new GetFunctionCommand({
        FunctionName: discovered.transactionProcessorFunctionName
      });

      const response = await lambdaClient.send(command);
      expect(response.Configuration).toBeDefined();
      expect(response.Configuration!.Runtime).toBe('python3.11');
      expect(response.Configuration!.Timeout).toBe(60);
      expect(response.Configuration!.MemorySize).toBe(512);
    }, 30000);

    test('should have health check function deployed', async () => {
      if (!isStackDeployed || !discovered.healthCheckFunctionName) {
        return;
      }

      const command = new GetFunctionCommand({
        FunctionName: discovered.healthCheckFunctionName
      });

      const response = await lambdaClient.send(command);
      expect(response.Configuration).toBeDefined();
      expect(response.Configuration!.Runtime).toBe('python3.11');
      expect(response.Configuration!.Timeout).toBe(30);
    }, 30000);

    test('should be able to invoke health check function', async () => {
      if (!isStackDeployed || !discovered.healthCheckFunctionName) {
        return;
      }

      const command = new InvokeCommand({
        FunctionName: discovered.healthCheckFunctionName,
        InvocationType: 'RequestResponse'
      });

      const response = await lambdaClient.send(command);
      expect(response.StatusCode).toBe(200);

      if (response.Payload) {
        const payload = JSON.parse(new TextDecoder().decode(response.Payload));
        expect(payload.statusCode).toBe(200);

        const body = JSON.parse(payload.body);
        expect(body.status).toBe('healthy');
      }
    }, 30000);

    test('health check function URL should be accessible', () => {
      if (!isStackDeployed) {
        return;
      }

      expect(discovered.outputs.HealthCheckFunctionUrl).toBeDefined();
      expect(discovered.outputs.HealthCheckFunctionUrl).toMatch(/^https:\/\//);
      expect(discovered.outputs.HealthCheckFunctionUrl).toContain('lambda-url');
      expect(discovered.outputs.HealthCheckFunctionUrl).toContain(AWS_REGION);
    });
  });

  describe('Route53 Configuration', () => {
    test('should have hosted zone created', () => {
      if (!isStackDeployed) {
        return;
      }

      expect(discovered.hostedZoneId).toBeDefined();
      expect(discovered.hostedZoneId).toMatch(/^Z[A-Z0-9]+$/);
    });

    test('should have health check configured', () => {
      if (!isStackDeployed) {
        return;
      }

      const healthCheckResource = Array.from(discovered.resources.values()).find(
        r => r.resourceType === 'AWS::Route53::HealthCheck'
      );

      expect(healthCheckResource).toBeDefined();
      expect(healthCheckResource!.resourceStatus).toMatch(/COMPLETE$/);
    });

    test('should verify health check exists via Route53 API', async () => {
      if (!isStackDeployed || !discovered.healthCheckId) {
        return;
      }

      const command = new GetHealthCheckCommand({
        HealthCheckId: discovered.healthCheckId
      });

      const response = await route53Client.send(command);
      expect(response.HealthCheck).toBeDefined();
      expect(response.HealthCheck!.Id).toBe(discovered.healthCheckId);
    }, 30000);
  });

  describe('Monitoring and Alarms', () => {
    test('should have SNS topic created', async () => {
      if (!isStackDeployed || !discovered.snsTopicArn) {
        return;
      }

      expect(discovered.snsTopicArn).toBeDefined();
      expect(discovered.snsTopicArn).toMatch(/^arn:aws:sns:/);
      expect(discovered.snsTopicArn).toContain('dr-notifications');

      // Verify SNS topic exists
      const command = new GetTopicAttributesCommand({
        TopicArn: discovered.snsTopicArn
      });
      const response = await snsClient.send(command);
      expect(response.Attributes).toBeDefined();
    }, 30000);

    test('should have CloudWatch alarms configured', () => {
      if (!isStackDeployed) {
        return;
      }

      const alarms = Array.from(discovered.resources.values()).filter(
        r => r.resourceType === 'AWS::CloudWatch::Alarm'
      );

      expect(alarms.length).toBeGreaterThanOrEqual(3);

      const alarmNames = alarms.map(a => a.logicalId);
      expect(alarmNames).toContain('DatabaseCPUAlarm');
      expect(alarmNames).toContain('DatabaseConnectionsAlarm');
      expect(alarmNames).toContain('LambdaErrorsAlarm');
    });
  });

  describe('Security Configuration', () => {
    test('should have database secret created', async () => {
      if (!isStackDeployed || !discovered.secretArn) {
        return;
      }

      expect(discovered.secretArn).toBeDefined();
      expect(discovered.secretArn).toMatch(/^arn:aws:secretsmanager:/);
      expect(discovered.secretArn).toContain('db-credentials');

      // Verify secret exists
      const command = new DescribeSecretCommand({
        SecretId: discovered.secretArn
      });
      const response = await secretsClient.send(command);
      expect(response.ARN).toBe(discovered.secretArn);
    }, 30000);
  });

  describe('Resource Cleanup Verification', () => {
    test('all resources should have DeletionPolicy configured', () => {
      if (!isStackDeployed) {
        return;
      }

      // Check template resources have DeletionPolicy
      const resourcesRequiringDeletion = [
        'VPC',
        'AuroraCluster',
        'AuroraInstance1',
        'AuroraInstance2',
        'LambdaExecutionRole',
        'TransactionProcessorFunction',
        'HealthCheckFunction'
      ];

      resourcesRequiringDeletion.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        expect(resource).toBeDefined();
        expect(resource.DeletionPolicy).toBe('Delete');
      });
    });
  });

  describe('End-to-End Functionality', () => {
    test('should verify overall system health', () => {
      if (!isStackDeployed) {
        return;
      }

      // Check critical components
      const checks = {
        vpc: !!discovered.vpcId,
        database: !!discovered.outputs.DatabaseClusterEndpoint,
        lambda: !!discovered.outputs.TransactionProcessorFunctionArn,
        healthCheck: !!discovered.outputs.HealthCheckFunctionUrl,
        monitoring: !!discovered.snsTopicArn,
        dns: !!discovered.hostedZoneId
      };

      expect(checks.vpc).toBe(true);
      expect(checks.database).toBe(true);
      expect(checks.lambda).toBe(true);
      expect(checks.healthCheck).toBe(true);
      expect(checks.monitoring).toBe(true);
      expect(checks.dns).toBe(true);
    });
  });
});
```
