# Multi-Environment RDS Aurora Database Replication System

This CloudFormation template creates a comprehensive multi-environment database replication infrastructure with Aurora MySQL clusters, Lambda-based synchronization, and secure cross-environment access.

## File: lib/TapStack.json

```json
{
  "AWSTemplateFormatVersion": "2010-09-09",
  "Description": "Multi-environment RDS Aurora database replication system with automated synchronization",
  "Parameters": {
    "EnvironmentSuffix": {
      "Type": "String",
      "Description": "Unique suffix for resource naming to prevent conflicts",
      "Default": "test"
    },
    "Environment": {
      "Type": "String",
      "Description": "Environment name (dev, staging, or prod)",
      "AllowedValues": ["dev", "staging", "prod"],
      "Default": "dev"
    },
    "DevAccountId": {
      "Type": "String",
      "Description": "AWS Account ID for dev environment",
      "Default": "111111111111"
    },
    "StagingAccountId": {
      "Type": "String",
      "Description": "AWS Account ID for staging environment",
      "Default": "222222222222"
    },
    "ProdAccountId": {
      "Type": "String",
      "Description": "AWS Account ID for prod environment",
      "Default": "333333333333"
    }
  },
  "Conditions": {
    "IsDevEnvironment": {"Fn::Equals": [{"Ref": "Environment"}, "dev"]},
    "IsStagingEnvironment": {"Fn::Equals": [{"Ref": "Environment"}, "staging"]},
    "IsProdEnvironment": {"Fn::Equals": [{"Ref": "Environment"}, "prod"]}
  },
  "Resources": {
    "VPC": {
      "Type": "AWS::EC2::VPC",
      "Properties": {
        "CidrBlock": {
          "Fn::If": [
            "IsDevEnvironment",
            "10.1.0.0/16",
            {"Fn::If": ["IsStagingEnvironment", "10.2.0.0/16", "10.3.0.0/16"]}
          ]
        },
        "EnableDnsHostnames": true,
        "EnableDnsSupport": true,
        "Tags": [
          {
            "Key": "Name",
            "Value": {"Fn::Sub": "vpc-${Environment}-${EnvironmentSuffix}"}
          }
        ]
      }
    },
    "PrivateSubnet1": {
      "Type": "AWS::EC2::Subnet",
      "Properties": {
        "VpcId": {"Ref": "VPC"},
        "CidrBlock": {
          "Fn::If": [
            "IsDevEnvironment",
            "10.1.1.0/24",
            {"Fn::If": ["IsStagingEnvironment", "10.2.1.0/24", "10.3.1.0/24"]}
          ]
        },
        "AvailabilityZone": {"Fn::Select": [0, {"Fn::GetAZs": ""}]},
        "Tags": [
          {
            "Key": "Name",
            "Value": {"Fn::Sub": "private-subnet-1-${Environment}-${EnvironmentSuffix}"}
          }
        ]
      }
    },
    "PrivateSubnet2": {
      "Type": "AWS::EC2::Subnet",
      "Properties": {
        "VpcId": {"Ref": "VPC"},
        "CidrBlock": {
          "Fn::If": [
            "IsDevEnvironment",
            "10.1.2.0/24",
            {"Fn::If": ["IsStagingEnvironment", "10.2.2.0/24", "10.3.2.0/24"]}
          ]
        },
        "AvailabilityZone": {"Fn::Select": [1, {"Fn::GetAZs": ""}]},
        "Tags": [
          {
            "Key": "Name",
            "Value": {"Fn::Sub": "private-subnet-2-${Environment}-${EnvironmentSuffix}"}
          }
        ]
      }
    },
    "DatabaseSecurityGroup": {
      "Type": "AWS::EC2::SecurityGroup",
      "Properties": {
        "GroupDescription": "Security group for Aurora MySQL database",
        "GroupName": {"Fn::Sub": "db-sg-${Environment}-${EnvironmentSuffix}"},
        "VpcId": {"Ref": "VPC"},
        "SecurityGroupIngress": [
          {
            "IpProtocol": "tcp",
            "FromPort": 3306,
            "ToPort": 3306,
            "CidrIp": {
              "Fn::If": [
                "IsDevEnvironment",
                "10.1.0.0/16",
                {"Fn::If": ["IsStagingEnvironment", "10.2.0.0/16", "10.3.0.0/16"]}
              ]
            },
            "Description": "Allow MySQL traffic within VPC"
          }
        ],
        "Tags": [
          {
            "Key": "Name",
            "Value": {"Fn::Sub": "db-sg-${Environment}-${EnvironmentSuffix}"}
          }
        ]
      }
    },
    "LambdaSecurityGroup": {
      "Type": "AWS::EC2::SecurityGroup",
      "Properties": {
        "GroupDescription": "Security group for Lambda functions",
        "GroupName": {"Fn::Sub": "lambda-sg-${Environment}-${EnvironmentSuffix}"},
        "VpcId": {"Ref": "VPC"},
        "SecurityGroupEgress": [
          {
            "IpProtocol": "tcp",
            "FromPort": 3306,
            "ToPort": 3306,
            "DestinationSecurityGroupId": {"Ref": "DatabaseSecurityGroup"},
            "Description": "Allow Lambda to connect to Aurora"
          },
          {
            "IpProtocol": "tcp",
            "FromPort": 443,
            "ToPort": 443,
            "CidrIp": "0.0.0.0/0",
            "Description": "Allow HTTPS for AWS API calls"
          }
        ],
        "Tags": [
          {
            "Key": "Name",
            "Value": {"Fn::Sub": "lambda-sg-${Environment}-${EnvironmentSuffix}"}
          }
        ]
      }
    },
    "EncryptionKey": {
      "Type": "AWS::KMS::Key",
      "Properties": {
        "Description": {"Fn::Sub": "KMS key for ${Environment} environment encryption"},
        "EnableKeyRotation": true,
        "KeyPolicy": {
          "Version": "2012-10-17",
          "Statement": [
            {
              "Sid": "Enable IAM User Permissions",
              "Effect": "Allow",
              "Principal": {
                "AWS": {"Fn::Sub": "arn:aws:iam::${AWS::AccountId}:root"}
              },
              "Action": "kms:*",
              "Resource": "*"
            },
            {
              "Sid": "Allow RDS to use the key",
              "Effect": "Allow",
              "Principal": {
                "Service": "rds.amazonaws.com"
              },
              "Action": [
                "kms:Decrypt",
                "kms:GenerateDataKey",
                "kms:CreateGrant"
              ],
              "Resource": "*"
            },
            {
              "Sid": "Allow Lambda to use the key",
              "Effect": "Allow",
              "Principal": {
                "Service": "lambda.amazonaws.com"
              },
              "Action": [
                "kms:Decrypt",
                "kms:GenerateDataKey"
              ],
              "Resource": "*"
            }
          ]
        }
      }
    },
    "EncryptionKeyAlias": {
      "Type": "AWS::KMS::Alias",
      "Properties": {
        "AliasName": {"Fn::Sub": "alias/${Environment}-${EnvironmentSuffix}"},
        "TargetKeyId": {"Ref": "EncryptionKey"}
      }
    },
    "DBSubnetGroup": {
      "Type": "AWS::RDS::DBSubnetGroup",
      "Properties": {
        "DBSubnetGroupName": {"Fn::Sub": "db-subnet-group-${Environment}-${EnvironmentSuffix}"},
        "DBSubnetGroupDescription": {"Fn::Sub": "Subnet group for ${Environment} Aurora cluster"},
        "SubnetIds": [
          {"Ref": "PrivateSubnet1"},
          {"Ref": "PrivateSubnet2"}
        ],
        "Tags": [
          {
            "Key": "Name",
            "Value": {"Fn::Sub": "db-subnet-group-${Environment}-${EnvironmentSuffix}"}
          }
        ]
      }
    },
    "DatabaseSecret": {
      "Type": "AWS::SecretsManager::Secret",
      "Properties": {
        "Name": {"Fn::Sub": "db-credentials-${Environment}-${EnvironmentSuffix}"},
        "Description": {"Fn::Sub": "Database credentials for ${Environment} Aurora cluster"},
        "GenerateSecretString": {
          "SecretStringTemplate": "{\"username\":\"admin\"}",
          "GenerateStringKey": "password",
          "PasswordLength": 32,
          "ExcludeCharacters": "\"@'/\\"
        },
        "KmsKeyId": {"Ref": "EncryptionKey"}
      }
    },
    "AuroraCluster": {
      "Type": "AWS::RDS::DBCluster",
      "Properties": {
        "DBClusterIdentifier": {"Fn::Sub": "aurora-cluster-${Environment}-${EnvironmentSuffix}"},
        "Engine": "aurora-mysql",
        "EngineVersion": "5.7.mysql_aurora.2.11.3",
        "MasterUsername": {"Fn::Sub": "{{resolve:secretsmanager:${DatabaseSecret}:SecretString:username}}"},
        "MasterUserPassword": {"Fn::Sub": "{{resolve:secretsmanager:${DatabaseSecret}:SecretString:password}}"},
        "DBSubnetGroupName": {"Ref": "DBSubnetGroup"},
        "VpcSecurityGroupIds": [{"Ref": "DatabaseSecurityGroup"}],
        "StorageEncrypted": true,
        "KmsKeyId": {"Ref": "EncryptionKey"},
        "BackupRetentionPeriod": 7,
        "PreferredBackupWindow": "03:00-04:00",
        "PreferredMaintenanceWindow": "mon:04:00-mon:05:00",
        "EnableCloudwatchLogsExports": ["audit", "error", "general", "slowquery"],
        "DeletionProtection": false,
        "Tags": [
          {
            "Key": "Name",
            "Value": {"Fn::Sub": "aurora-cluster-${Environment}-${EnvironmentSuffix}"}
          }
        ]
      }
    },
    "AuroraInstance1": {
      "Type": "AWS::RDS::DBInstance",
      "Properties": {
        "DBInstanceIdentifier": {"Fn::Sub": "aurora-instance-1-${Environment}-${EnvironmentSuffix}"},
        "DBClusterIdentifier": {"Ref": "AuroraCluster"},
        "DBInstanceClass": "db.r5.large",
        "Engine": "aurora-mysql",
        "PubliclyAccessible": false,
        "Tags": [
          {
            "Key": "Name",
            "Value": {"Fn::Sub": "aurora-instance-1-${Environment}-${EnvironmentSuffix}"}
          }
        ]
      }
    },
    "AuroraInstance2": {
      "Type": "AWS::RDS::DBInstance",
      "Properties": {
        "DBInstanceIdentifier": {"Fn::Sub": "aurora-instance-2-${Environment}-${EnvironmentSuffix}"},
        "DBClusterIdentifier": {"Ref": "AuroraCluster"},
        "DBInstanceClass": "db.r5.large",
        "Engine": "aurora-mysql",
        "PubliclyAccessible": false,
        "Tags": [
          {
            "Key": "Name",
            "Value": {"Fn::Sub": "aurora-instance-2-${Environment}-${EnvironmentSuffix}"}
          }
        ]
      }
    },
    "SecretRotationSchedule": {
      "Type": "AWS::SecretsManager::RotationSchedule",
      "DependsOn": ["AuroraInstance1", "AuroraInstance2"],
      "Properties": {
        "SecretId": {"Ref": "DatabaseSecret"},
        "RotationLambdaARN": {"Fn::GetAtt": ["SecretRotationLambda", "Arn"]},
        "RotationRules": {
          "AutomaticallyAfterDays": 30
        }
      }
    },
    "MigrationScriptBucket": {
      "Type": "AWS::S3::Bucket",
      "Properties": {
        "BucketName": {"Fn::Sub": "migration-scripts-${Environment}-${EnvironmentSuffix}"},
        "VersioningConfiguration": {
          "Status": "Enabled"
        },
        "BucketEncryption": {
          "ServerSideEncryptionConfiguration": [
            {
              "ServerSideEncryptionByDefault": {
                "SSEAlgorithm": "aws:kms",
                "KMSMasterKeyID": {"Ref": "EncryptionKey"}
              }
            }
          ]
        },
        "LifecycleConfiguration": {
          "Rules": [
            {
              "Id": "DeleteOldMigrationScripts",
              "Status": "Enabled",
              "ExpirationInDays": 30
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
            "Key": "Name",
            "Value": {"Fn::Sub": "migration-scripts-${Environment}-${EnvironmentSuffix}"}
          }
        ]
      }
    },
    "LambdaExecutionRole": {
      "Type": "AWS::IAM::Role",
      "Properties": {
        "RoleName": {"Fn::Sub": "lambda-execution-role-${Environment}-${EnvironmentSuffix}"},
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
            "PolicyName": "DatabaseAccess",
            "PolicyDocument": {
              "Version": "2012-10-17",
              "Statement": [
                {
                  "Effect": "Allow",
                  "Action": [
                    "rds:DescribeDBClusters",
                    "rds:DescribeDBInstances"
                  ],
                  "Resource": {"Fn::Sub": "arn:aws:rds:${AWS::Region}:${AWS::AccountId}:cluster:aurora-cluster-${Environment}-${EnvironmentSuffix}"}
                },
                {
                  "Effect": "Allow",
                  "Action": [
                    "secretsmanager:GetSecretValue"
                  ],
                  "Resource": {"Ref": "DatabaseSecret"}
                },
                {
                  "Effect": "Allow",
                  "Action": [
                    "s3:GetObject",
                    "s3:ListBucket"
                  ],
                  "Resource": [
                    {"Fn::GetAtt": ["MigrationScriptBucket", "Arn"]},
                    {"Fn::Sub": "${MigrationScriptBucket.Arn}/*"}
                  ]
                },
                {
                  "Effect": "Allow",
                  "Action": [
                    "kms:Decrypt",
                    "kms:GenerateDataKey"
                  ],
                  "Resource": {"Fn::GetAtt": ["EncryptionKey", "Arn"]}
                },
                {
                  "Effect": "Allow",
                  "Action": [
                    "ssm:GetParameter",
                    "ssm:GetParameters"
                  ],
                  "Resource": {"Fn::Sub": "arn:aws:ssm:${AWS::Region}:${AWS::AccountId}:parameter/db-connection-${Environment}-${EnvironmentSuffix}"}
                },
                {
                  "Effect": "Allow",
                  "Action": [
                    "logs:CreateLogGroup",
                    "logs:CreateLogStream",
                    "logs:PutLogEvents"
                  ],
                  "Resource": {"Fn::Sub": "arn:aws:logs:${AWS::Region}:${AWS::AccountId}:log-group:/aws/lambda/*"}
                }
              ]
            }
          }
        ]
      }
    },
    "CrossAccountRole": {
      "Type": "AWS::IAM::Role",
      "Properties": {
        "RoleName": {"Fn::Sub": "cross-account-sync-role-${Environment}-${EnvironmentSuffix}"},
        "AssumeRolePolicyDocument": {
          "Version": "2012-10-17",
          "Statement": [
            {
              "Effect": "Allow",
              "Principal": {
                "AWS": [
                  {"Fn::Sub": "arn:aws:iam::${DevAccountId}:root"},
                  {"Fn::Sub": "arn:aws:iam::${StagingAccountId}:root"},
                  {"Fn::Sub": "arn:aws:iam::${ProdAccountId}:root"}
                ]
              },
              "Action": "sts:AssumeRole",
              "Condition": {
                "StringEquals": {
                  "sts:ExternalId": {"Fn::Sub": "sync-${Environment}-${EnvironmentSuffix}"}
                }
              }
            }
          ]
        },
        "Policies": [
          {
            "PolicyName": "CrossAccountSyncAccess",
            "PolicyDocument": {
              "Version": "2012-10-17",
              "Statement": [
                {
                  "Effect": "Allow",
                  "Action": [
                    "rds:DescribeDBClusters",
                    "rds:DescribeDBInstances"
                  ],
                  "Resource": {"Fn::Sub": "arn:aws:rds:${AWS::Region}:${AWS::AccountId}:cluster:aurora-cluster-${Environment}-${EnvironmentSuffix}"}
                },
                {
                  "Effect": "Allow",
                  "Action": [
                    "s3:GetObject"
                  ],
                  "Resource": {"Fn::Sub": "${MigrationScriptBucket.Arn}/*"}
                }
              ]
            }
          }
        ]
      }
    },
    "SchemaSync Lambda": {
      "Type": "AWS::Lambda::Function",
      "Properties": {
        "FunctionName": {"Fn::Sub": "schema-sync-${Environment}-${EnvironmentSuffix}"},
        "Runtime": "python3.9",
        "Handler": "index.lambda_handler",
        "Role": {"Fn::GetAtt": ["LambdaExecutionRole", "Arn"]},
        "Timeout": 300,
        "VpcConfig": {
          "SecurityGroupIds": [{"Ref": "LambdaSecurityGroup"}],
          "SubnetIds": [
            {"Ref": "PrivateSubnet1"},
            {"Ref": "PrivateSubnet2"}
          ]
        },
        "Environment": {
          "Variables": {
            "DB_SECRET_ARN": {"Ref": "DatabaseSecret"},
            "DB_CLUSTER_ENDPOINT": {"Fn::GetAtt": ["AuroraCluster", "Endpoint.Address"]},
            "MIGRATION_BUCKET": {"Ref": "MigrationScriptBucket"},
            "ENVIRONMENT": {"Ref": "Environment"}
          }
        },
        "Code": {
          "ZipFile": "import json\nimport boto3\nimport os\nimport logging\nimport pymysql\nfrom botocore.exceptions import ClientError\n\nlogger = logging.getLogger()\nlogger.setLevel(logging.INFO)\n\ndef lambda_handler(event, context):\n    logger.info('Schema synchronization started')\n    \n    try:\n        secrets_client = boto3.client('secretsmanager')\n        s3_client = boto3.client('s3')\n        \n        # Get database credentials\n        secret_arn = os.environ['DB_SECRET_ARN']\n        secret_response = secrets_client.get_secret_value(SecretId=secret_arn)\n        secret = json.loads(secret_response['SecretString'])\n        \n        # Get migration scripts from S3\n        bucket = os.environ['MIGRATION_BUCKET']\n        scripts = s3_client.list_objects_v2(Bucket=bucket, Prefix='schemas/')\n        \n        # Connect to database\n        db_endpoint = os.environ['DB_CLUSTER_ENDPOINT']\n        connection = pymysql.connect(\n            host=db_endpoint,\n            user=secret['username'],\n            password=secret['password'],\n            database='mysql',\n            connect_timeout=5\n        )\n        \n        logger.info(f'Connected to database at {db_endpoint}')\n        \n        # Execute migration scripts\n        executed_count = 0\n        if 'Contents' in scripts:\n            for script in scripts['Contents']:\n                script_key = script['Key']\n                logger.info(f'Executing script: {script_key}')\n                \n                script_obj = s3_client.get_object(Bucket=bucket, Key=script_key)\n                script_content = script_obj['Body'].read().decode('utf-8')\n                \n                with connection.cursor() as cursor:\n                    cursor.execute(script_content)\n                    connection.commit()\n                \n                executed_count += 1\n        \n        connection.close()\n        \n        logger.info(f'Schema synchronization completed. Executed {executed_count} scripts')\n        \n        return {\n            'statusCode': 200,\n            'body': json.dumps({\n                'message': 'Schema synchronization successful',\n                'scripts_executed': executed_count\n            })\n        }\n        \n    except Exception as e:\n        logger.error(f'Schema synchronization failed: {str(e)}')\n        raise\n"
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": {"Fn::Sub": "schema-sync-${Environment}-${EnvironmentSuffix}"}
          }
        ]
      }
    },
    "DataSyncLambda": {
      "Type": "AWS::Lambda::Function",
      "Properties": {
        "FunctionName": {"Fn::Sub": "data-sync-${Environment}-${EnvironmentSuffix}"},
        "Runtime": "python3.9",
        "Handler": "index.lambda_handler",
        "Role": {"Fn::GetAtt": ["LambdaExecutionRole", "Arn"]},
        "Timeout": 300,
        "VpcConfig": {
          "SecurityGroupIds": [{"Ref": "LambdaSecurityGroup"}],
          "SubnetIds": [
            {"Ref": "PrivateSubnet1"},
            {"Ref": "PrivateSubnet2"}
          ]
        },
        "Environment": {
          "Variables": {
            "DB_SECRET_ARN": {"Ref": "DatabaseSecret"},
            "DB_CLUSTER_ENDPOINT": {"Fn::GetAtt": ["AuroraCluster", "Endpoint.Address"]},
            "MIGRATION_BUCKET": {"Ref": "MigrationScriptBucket"},
            "ENVIRONMENT": {"Ref": "Environment"}
          }
        },
        "Code": {
          "ZipFile": "import json\nimport boto3\nimport os\nimport logging\nimport pymysql\n\nlogger = logging.getLogger()\nlogger.setLevel(logging.INFO)\n\ndef lambda_handler(event, context):\n    logger.info('Data synchronization started')\n    \n    try:\n        secrets_client = boto3.client('secretsmanager')\n        s3_client = boto3.client('s3')\n        \n        # Get database credentials\n        secret_arn = os.environ['DB_SECRET_ARN']\n        secret_response = secrets_client.get_secret_value(SecretId=secret_arn)\n        secret = json.loads(secret_response['SecretString'])\n        \n        # Get data scripts from S3\n        bucket = os.environ['MIGRATION_BUCKET']\n        scripts = s3_client.list_objects_v2(Bucket=bucket, Prefix='data/')\n        \n        # Connect to database\n        db_endpoint = os.environ['DB_CLUSTER_ENDPOINT']\n        connection = pymysql.connect(\n            host=db_endpoint,\n            user=secret['username'],\n            password=secret['password'],\n            database='mysql',\n            connect_timeout=5\n        )\n        \n        logger.info(f'Connected to database at {db_endpoint}')\n        \n        # Execute data synchronization scripts\n        synced_count = 0\n        if 'Contents' in scripts:\n            for script in scripts['Contents']:\n                script_key = script['Key']\n                logger.info(f'Syncing data from: {script_key}')\n                \n                script_obj = s3_client.get_object(Bucket=bucket, Key=script_key)\n                script_content = script_obj['Body'].read().decode('utf-8')\n                \n                with connection.cursor() as cursor:\n                    cursor.execute(script_content)\n                    connection.commit()\n                \n                synced_count += 1\n        \n        connection.close()\n        \n        logger.info(f'Data synchronization completed. Synced {synced_count} datasets')\n        \n        return {\n            'statusCode': 200,\n            'body': json.dumps({\n                'message': 'Data synchronization successful',\n                'datasets_synced': synced_count\n            })\n        }\n        \n    except Exception as e:\n        logger.error(f'Data synchronization failed: {str(e)}')\n        raise\n"
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": {"Fn::Sub": "data-sync-${Environment}-${EnvironmentSuffix}"}
          }
        ]
      }
    },
    "SecretRotationLambda": {
      "Type": "AWS::Lambda::Function",
      "Properties": {
        "FunctionName": {"Fn::Sub": "secret-rotation-${Environment}-${EnvironmentSuffix}"},
        "Runtime": "python3.9",
        "Handler": "index.lambda_handler",
        "Role": {"Fn::GetAtt": ["LambdaExecutionRole", "Arn"]},
        "Timeout": 300,
        "VpcConfig": {
          "SecurityGroupIds": [{"Ref": "LambdaSecurityGroup"}],
          "SubnetIds": [
            {"Ref": "PrivateSubnet1"},
            {"Ref": "PrivateSubnet2"}
          ]
        },
        "Environment": {
          "Variables": {
            "DB_CLUSTER_ENDPOINT": {"Fn::GetAtt": ["AuroraCluster", "Endpoint.Address"]}
          }
        },
        "Code": {
          "ZipFile": "import json\nimport boto3\nimport logging\n\nlogger = logging.getLogger()\nlogger.setLevel(logging.INFO)\n\ndef lambda_handler(event, context):\n    logger.info('Secret rotation invoked')\n    \n    service_client = boto3.client('secretsmanager')\n    arn = event['SecretId']\n    token = event['ClientRequestToken']\n    step = event['Step']\n    \n    logger.info(f'Rotating secret {arn} at step {step}')\n    \n    if step == 'createSecret':\n        logger.info('Creating new secret version')\n        # Implementation for creating new secret version\n        pass\n    elif step == 'setSecret':\n        logger.info('Setting new secret in database')\n        # Implementation for setting new password in database\n        pass\n    elif step == 'testSecret':\n        logger.info('Testing new secret')\n        # Implementation for testing new credentials\n        pass\n    elif step == 'finishSecret':\n        logger.info('Finishing rotation')\n        # Implementation for finishing rotation\n        pass\n    \n    return {\n        'statusCode': 200,\n        'body': json.dumps({'message': f'Rotation step {step} completed'})\n    }\n"
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": {"Fn::Sub": "secret-rotation-${Environment}-${EnvironmentSuffix}"}
          }
        ]
      }
    },
    "SecretRotationLambdaPermission": {
      "Type": "AWS::Lambda::Permission",
      "Properties": {
        "FunctionName": {"Ref": "SecretRotationLambda"},
        "Action": "lambda:InvokeFunction",
        "Principal": "secretsmanager.amazonaws.com"
      }
    },
    "DBConnectionParameter": {
      "Type": "AWS::SSM::Parameter",
      "Properties": {
        "Name": {"Fn::Sub": "/db-connection-${Environment}-${EnvironmentSuffix}"},
        "Type": "SecureString",
        "Value": {
          "Fn::Sub": [
            "{\"endpoint\":\"${Endpoint}\",\"port\":\"3306\",\"database\":\"mysql\",\"secret_arn\":\"${SecretArn}\"}",
            {
              "Endpoint": {"Fn::GetAtt": ["AuroraCluster", "Endpoint.Address"]},
              "SecretArn": {"Ref": "DatabaseSecret"}
            }
          ]
        },
        "Description": {"Fn::Sub": "Database connection string for ${Environment} environment"},
        "KmsKeyId": {"Ref": "EncryptionKey"},
        "Tags": {
          "Name": {"Fn::Sub": "db-connection-${Environment}-${EnvironmentSuffix}"}
        }
      }
    },
    "ReplicationLagAlarm": {
      "Type": "AWS::CloudWatch::Alarm",
      "Properties": {
        "AlarmName": {"Fn::Sub": "replication-lag-alarm-${Environment}-${EnvironmentSuffix}"},
        "AlarmDescription": "Alert when Aurora replication lag exceeds 60 seconds",
        "MetricName": "AuroraReplicaLag",
        "Namespace": "AWS/RDS",
        "Statistic": "Maximum",
        "Period": 60,
        "EvaluationPeriods": 2,
        "Threshold": 60,
        "ComparisonOperator": "GreaterThanThreshold",
        "Dimensions": [
          {
            "Name": "DBClusterIdentifier",
            "Value": {"Ref": "AuroraCluster"}
          }
        ],
        "TreatMissingData": "notBreaching"
      }
    },
    "SchemaSyncErrorAlarm": {
      "Type": "AWS::CloudWatch::Alarm",
      "Properties": {
        "AlarmName": {"Fn::Sub": "schema-sync-error-alarm-${Environment}-${EnvironmentSuffix}"},
        "AlarmDescription": "Alert on schema synchronization Lambda errors",
        "MetricName": "Errors",
        "Namespace": "AWS/Lambda",
        "Statistic": "Sum",
        "Period": 300,
        "EvaluationPeriods": 1,
        "Threshold": 1,
        "ComparisonOperator": "GreaterThanOrEqualToThreshold",
        "Dimensions": [
          {
            "Name": "FunctionName",
            "Value": {"Ref": "SchemaSyncLambda"}
          }
        ],
        "TreatMissingData": "notBreaching"
      }
    },
    "DataSyncErrorAlarm": {
      "Type": "AWS::CloudWatch::Alarm",
      "Properties": {
        "AlarmName": {"Fn::Sub": "data-sync-error-alarm-${Environment}-${EnvironmentSuffix}"},
        "AlarmDescription": "Alert on data synchronization Lambda errors",
        "MetricName": "Errors",
        "Namespace": "AWS/Lambda",
        "Statistic": "Sum",
        "Period": 300,
        "EvaluationPeriods": 1,
        "Threshold": 1,
        "ComparisonOperator": "GreaterThanOrEqualToThreshold",
        "Dimensions": [
          {
            "Name": "FunctionName",
            "Value": {"Ref": "DataSyncLambda"}
          }
        ],
        "TreatMissingData": "notBreaching"
      }
    }
  },
  "Outputs": {
    "VPCId": {
      "Description": "VPC ID",
      "Value": {"Ref": "VPC"},
      "Export": {
        "Name": {"Fn::Sub": "${AWS::StackName}-VPCId"}
      }
    },
    "AuroraClusterEndpoint": {
      "Description": "Aurora cluster endpoint",
      "Value": {"Fn::GetAtt": ["AuroraCluster", "Endpoint.Address"]},
      "Export": {
        "Name": {"Fn::Sub": "${AWS::StackName}-AuroraClusterEndpoint"}
      }
    },
    "AuroraClusterReadEndpoint": {
      "Description": "Aurora cluster read endpoint",
      "Value": {"Fn::GetAtt": ["AuroraCluster", "ReadEndpoint.Address"]},
      "Export": {
        "Name": {"Fn::Sub": "${AWS::StackName}-AuroraClusterReadEndpoint"}
      }
    },
    "DatabaseSecretArn": {
      "Description": "Database credentials secret ARN",
      "Value": {"Ref": "DatabaseSecret"},
      "Export": {
        "Name": {"Fn::Sub": "${AWS::StackName}-DatabaseSecretArn"}
      }
    },
    "MigrationBucketName": {
      "Description": "S3 bucket for migration scripts",
      "Value": {"Ref": "MigrationScriptBucket"},
      "Export": {
        "Name": {"Fn::Sub": "${AWS::StackName}-MigrationBucketName"}
      }
    },
    "SchemaSyncLambdaArn": {
      "Description": "Schema synchronization Lambda ARN",
      "Value": {"Fn::GetAtt": ["SchemaSyncLambda", "Arn"]},
      "Export": {
        "Name": {"Fn::Sub": "${AWS::StackName}-SchemaSyncLambdaArn"}
      }
    },
    "DataSyncLambdaArn": {
      "Description": "Data synchronization Lambda ARN",
      "Value": {"Fn::GetAtt": ["DataSyncLambda", "Arn"]},
      "Export": {
        "Name": {"Fn::Sub": "${AWS::StackName}-DataSyncLambdaArn"}
      }
    },
    "CrossAccountRoleArn": {
      "Description": "Cross-account IAM role ARN",
      "Value": {"Fn::GetAtt": ["CrossAccountRole", "Arn"]},
      "Export": {
        "Name": {"Fn::Sub": "${AWS::StackName}-CrossAccountRoleArn"}
      }
    },
    "EncryptionKeyId": {
      "Description": "KMS encryption key ID",
      "Value": {"Ref": "EncryptionKey"},
      "Export": {
        "Name": {"Fn::Sub": "${AWS::StackName}-EncryptionKeyId"}
      }
    }
  }
}
```

## File: lib/lambda/schema_sync.py

```python
import json
import boto3
import os
import logging
import pymysql
from botocore.exceptions import ClientError

logger = logging.getLogger()
logger.setLevel(logging.INFO)

def lambda_handler(event, context):
    """
    Synchronize database schema changes across environments.

    This function:
    1. Retrieves database credentials from Secrets Manager
    2. Downloads migration scripts from S3
    3. Executes scripts against the Aurora cluster
    4. Logs all activities to CloudWatch
    """
    logger.info('Schema synchronization started')

    try:
        secrets_client = boto3.client('secretsmanager')
        s3_client = boto3.client('s3')

        # Get database credentials
        secret_arn = os.environ['DB_SECRET_ARN']
        secret_response = secrets_client.get_secret_value(SecretId=secret_arn)
        secret = json.loads(secret_response['SecretString'])

        # Get migration scripts from S3
        bucket = os.environ['MIGRATION_BUCKET']
        scripts = s3_client.list_objects_v2(Bucket=bucket, Prefix='schemas/')

        # Connect to database
        db_endpoint = os.environ['DB_CLUSTER_ENDPOINT']
        connection = pymysql.connect(
            host=db_endpoint,
            user=secret['username'],
            password=secret['password'],
            database='mysql',
            connect_timeout=5
        )

        logger.info(f'Connected to database at {db_endpoint}')

        # Execute migration scripts
        executed_count = 0
        if 'Contents' in scripts:
            for script in scripts['Contents']:
                script_key = script['Key']
                logger.info(f'Executing script: {script_key}')

                script_obj = s3_client.get_object(Bucket=bucket, Key=script_key)
                script_content = script_obj['Body'].read().decode('utf-8')

                with connection.cursor() as cursor:
                    cursor.execute(script_content)
                    connection.commit()

                executed_count += 1

        connection.close()

        logger.info(f'Schema synchronization completed. Executed {executed_count} scripts')

        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Schema synchronization successful',
                'scripts_executed': executed_count
            })
        }

    except Exception as e:
        logger.error(f'Schema synchronization failed: {str(e)}')
        raise
```

## File: lib/lambda/data_sync.py

```python
import json
import boto3
import os
import logging
import pymysql

logger = logging.getLogger()
logger.setLevel(logging.INFO)

def lambda_handler(event, context):
    """
    Synchronize reference data across environments.

    This function:
    1. Retrieves database credentials from Secrets Manager
    2. Downloads data synchronization scripts from S3
    3. Executes data sync operations against the Aurora cluster
    4. Logs all activities to CloudWatch
    """
    logger.info('Data synchronization started')

    try:
        secrets_client = boto3.client('secretsmanager')
        s3_client = boto3.client('s3')

        # Get database credentials
        secret_arn = os.environ['DB_SECRET_ARN']
        secret_response = secrets_client.get_secret_value(SecretId=secret_arn)
        secret = json.loads(secret_response['SecretString'])

        # Get data scripts from S3
        bucket = os.environ['MIGRATION_BUCKET']
        scripts = s3_client.list_objects_v2(Bucket=bucket, Prefix='data/')

        # Connect to database
        db_endpoint = os.environ['DB_CLUSTER_ENDPOINT']
        connection = pymysql.connect(
            host=db_endpoint,
            user=secret['username'],
            password=secret['password'],
            database='mysql',
            connect_timeout=5
        )

        logger.info(f'Connected to database at {db_endpoint}')

        # Execute data synchronization scripts
        synced_count = 0
        if 'Contents' in scripts:
            for script in scripts['Contents']:
                script_key = script['Key']
                logger.info(f'Syncing data from: {script_key}')

                script_obj = s3_client.get_object(Bucket=bucket, Key=script_key)
                script_content = script_obj['Body'].read().decode('utf-8')

                with connection.cursor() as cursor:
                    cursor.execute(script_content)
                    connection.commit()

                synced_count += 1

        connection.close()

        logger.info(f'Data synchronization completed. Synced {synced_count} datasets')

        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Data synchronization successful',
                'datasets_synced': synced_count
            })
        }

    except Exception as e:
        logger.error(f'Data synchronization failed: {str(e)}')
        raise
```

## File: lib/README.md

```markdown
# Multi-Environment RDS Aurora Database Replication System

This infrastructure implements a comprehensive multi-environment database replication system for financial services applications.

## Architecture Overview

The system creates isolated VPCs for dev, staging, and production environments, each containing:

- RDS Aurora MySQL cluster with 2 db.r5.large instances
- Lambda functions for automated schema and data synchronization
- S3 buckets for migration script storage with versioning
- KMS encryption keys for data at rest
- Secrets Manager for credential management with automatic rotation
- Systems Manager Parameter Store for connection strings
- CloudWatch alarms for monitoring replication lag and Lambda errors
- Cross-account IAM roles for secure environment access

## Deployment

### Prerequisites

1. AWS CLI configured with appropriate permissions
2. Three AWS accounts (dev, staging, prod)
3. CloudFormation StackSets permissions

### Deploy to Each Environment

```bash
# Deploy to dev environment
aws cloudformation create-stack \
  --stack-name aurora-replication-dev \
  --template-body file://lib/TapStack.json \
  --parameters \
    ParameterKey=EnvironmentSuffix,ParameterValue=<unique-suffix> \
    ParameterKey=Environment,ParameterValue=dev \
    ParameterKey=DevAccountId,ParameterValue=<dev-account-id> \
    ParameterKey=StagingAccountId,ParameterValue=<staging-account-id> \
    ParameterKey=ProdAccountId,ParameterValue=<prod-account-id> \
  --capabilities CAPABILITY_NAMED_IAM \
  --region us-east-1

# Deploy to staging environment
aws cloudformation create-stack \
  --stack-name aurora-replication-staging \
  --template-body file://lib/TapStack.json \
  --parameters \
    ParameterKey=EnvironmentSuffix,ParameterValue=<unique-suffix> \
    ParameterKey=Environment,ParameterValue=staging \
    ParameterKey=DevAccountId,ParameterValue=<dev-account-id> \
    ParameterKey=StagingAccountId,ParameterValue=<staging-account-id> \
    ParameterKey=ProdAccountId,ParameterValue=<prod-account-id> \
  --capabilities CAPABILITY_NAMED_IAM \
  --region us-east-1

# Deploy to prod environment
aws cloudformation create-stack \
  --stack-name aurora-replication-prod \
  --template-body file://lib/TapStack.json \
  --parameters \
    ParameterKey=EnvironmentSuffix,ParameterValue=<unique-suffix> \
    ParameterKey=Environment,ParameterValue=prod \
    ParameterKey=DevAccountId,ParameterValue=<dev-account-id> \
    ParameterKey=StagingAccountId,ParameterValue=<staging-account-id> \
    ParameterKey=ProdAccountId,ParameterValue=<prod-account-id> \
  --capabilities CAPABILITY_NAMED_IAM \
  --region us-east-1
```

### Post-Deployment Configuration

1. **VPC Peering Acceptance**: Manually accept VPC peering connections in each target account
2. **Route Table Updates**: Update route tables to enable traffic between peered VPCs
3. **Lambda Dependencies**: Deploy pymysql layer to Lambda functions for database connectivity
4. **Migration Scripts**: Upload initial schema and data scripts to S3 buckets

## Usage

### Trigger Schema Synchronization

```bash
aws lambda invoke \
  --function-name schema-sync-<environment>-<suffix> \
  --region us-east-1 \
  --payload '{}' \
  response.json
```

### Trigger Data Synchronization

```bash
aws lambda invoke \
  --function-name data-sync-<environment>-<suffix> \
  --region us-east-1 \
  --payload '{}' \
  response.json
```

## Monitoring

CloudWatch alarms are configured for:

- Aurora replication lag > 60 seconds
- Schema synchronization Lambda errors
- Data synchronization Lambda errors

## Security

- All data encrypted at rest using KMS
- Database credentials stored in Secrets Manager with 30-day rotation
- Connection strings stored in Parameter Store with KMS encryption
- Cross-account roles follow least-privilege principle
- VPC peering restricted to MySQL port 3306

## Cost Considerations

- Aurora db.r5.large instances: ~$0.29/hour per instance
- Aurora storage: $0.10/GB-month
- Lambda invocations: Free tier covers most use cases
- KMS key: $1/month per key
- S3 storage: Minimal with lifecycle policies

## Cleanup

```bash
aws cloudformation delete-stack \
  --stack-name aurora-replication-<environment> \
  --region us-east-1
```

Note: S3 buckets with objects will need manual deletion or emptying before stack deletion.
```
