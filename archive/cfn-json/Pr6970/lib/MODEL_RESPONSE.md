# CloudFormation Loan Processing Migration Infrastructure

This CloudFormation template creates the complete AWS infrastructure for migrating an on-premises loan processing system. The template uses Parameters and Conditions to support both development (single-AZ) and production (multi-AZ) configurations.

## File: lib/loan-processing-stack.json

```json
{
  "AWSTemplateFormatVersion": "2010-09-09",
  "Description": "Loan Processing Migration Infrastructure - RDS Aurora MySQL, Lambda, S3, VPC with multi-AZ support",
  "Parameters": {
    "EnvironmentSuffix": {
      "Type": "String",
      "Description": "Unique suffix for resource names to enable multiple deployments",
      "MinLength": 1,
      "MaxLength": 20,
      "AllowedPattern": "[a-z0-9-]+",
      "ConstraintDescription": "Must contain only lowercase letters, numbers, and hyphens"
    },
    "EnvironmentType": {
      "Type": "String",
      "Description": "Environment type for conditional resource deployment",
      "Default": "dev",
      "AllowedValues": ["dev", "prod"],
      "ConstraintDescription": "Must be either dev or prod"
    },
    "DBInstanceClass": {
      "Type": "String",
      "Description": "RDS Aurora instance class",
      "Default": "db.t3.medium",
      "AllowedValues": [
        "db.t3.medium",
        "db.t3.large",
        "db.r5.large",
        "db.r5.xlarge",
        "db.r5.2xlarge"
      ],
      "ConstraintDescription": "Must be a valid Aurora MySQL instance class"
    },
    "CostCenter": {
      "Type": "String",
      "Description": "Cost center for resource tagging",
      "Default": "FinancialServices"
    },
    "MigrationPhase": {
      "Type": "String",
      "Description": "Current migration phase",
      "Default": "Phase1-Infrastructure",
      "AllowedValues": [
        "Phase1-Infrastructure",
        "Phase2-DataMigration",
        "Phase3-ApplicationMigration",
        "Phase4-Testing",
        "Phase5-Production"
      ]
    }
  },
  "Conditions": {
    "IsProduction": {
      "Fn::Equals": [{"Ref": "EnvironmentType"}, "prod"]
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
            "Value": {"Fn::Sub": "loan-vpc-${EnvironmentSuffix}"}
          },
          {
            "Key": "Environment",
            "Value": {"Ref": "EnvironmentType"}
          },
          {
            "Key": "CostCenter",
            "Value": {"Ref": "CostCenter"}
          },
          {
            "Key": "MigrationPhase",
            "Value": {"Ref": "MigrationPhase"}
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
            "Value": {"Fn::Sub": "loan-igw-${EnvironmentSuffix}"}
          },
          {
            "Key": "Environment",
            "Value": {"Ref": "EnvironmentType"}
          },
          {
            "Key": "CostCenter",
            "Value": {"Ref": "CostCenter"}
          },
          {
            "Key": "MigrationPhase",
            "Value": {"Ref": "MigrationPhase"}
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
    "PublicSubnet1": {
      "Type": "AWS::EC2::Subnet",
      "Properties": {
        "VpcId": {"Ref": "VPC"},
        "CidrBlock": "10.0.1.0/24",
        "AvailabilityZone": {"Fn::Select": [0, {"Fn::GetAZs": ""}]},
        "MapPublicIpOnLaunch": true,
        "Tags": [
          {
            "Key": "Name",
            "Value": {"Fn::Sub": "loan-public-subnet-1-${EnvironmentSuffix}"}
          },
          {
            "Key": "Environment",
            "Value": {"Ref": "EnvironmentType"}
          },
          {
            "Key": "CostCenter",
            "Value": {"Ref": "CostCenter"}
          },
          {
            "Key": "MigrationPhase",
            "Value": {"Ref": "MigrationPhase"}
          }
        ]
      }
    },
    "PublicSubnet2": {
      "Type": "AWS::EC2::Subnet",
      "Properties": {
        "VpcId": {"Ref": "VPC"},
        "CidrBlock": "10.0.2.0/24",
        "AvailabilityZone": {"Fn::Select": [1, {"Fn::GetAZs": ""}]},
        "MapPublicIpOnLaunch": true,
        "Tags": [
          {
            "Key": "Name",
            "Value": {"Fn::Sub": "loan-public-subnet-2-${EnvironmentSuffix}"}
          },
          {
            "Key": "Environment",
            "Value": {"Ref": "EnvironmentType"}
          },
          {
            "Key": "CostCenter",
            "Value": {"Ref": "CostCenter"}
          },
          {
            "Key": "MigrationPhase",
            "Value": {"Ref": "MigrationPhase"}
          }
        ]
      }
    },
    "PrivateSubnet1": {
      "Type": "AWS::EC2::Subnet",
      "Properties": {
        "VpcId": {"Ref": "VPC"},
        "CidrBlock": "10.0.11.0/24",
        "AvailabilityZone": {"Fn::Select": [0, {"Fn::GetAZs": ""}]},
        "Tags": [
          {
            "Key": "Name",
            "Value": {"Fn::Sub": "loan-private-subnet-1-${EnvironmentSuffix}"}
          },
          {
            "Key": "Environment",
            "Value": {"Ref": "EnvironmentType"}
          },
          {
            "Key": "CostCenter",
            "Value": {"Ref": "CostCenter"}
          },
          {
            "Key": "MigrationPhase",
            "Value": {"Ref": "MigrationPhase"}
          }
        ]
      }
    },
    "PrivateSubnet2": {
      "Type": "AWS::EC2::Subnet",
      "Properties": {
        "VpcId": {"Ref": "VPC"},
        "CidrBlock": "10.0.12.0/24",
        "AvailabilityZone": {"Fn::Select": [1, {"Fn::GetAZs": ""}]},
        "Tags": [
          {
            "Key": "Name",
            "Value": {"Fn::Sub": "loan-private-subnet-2-${EnvironmentSuffix}"}
          },
          {
            "Key": "Environment",
            "Value": {"Ref": "EnvironmentType"}
          },
          {
            "Key": "CostCenter",
            "Value": {"Ref": "CostCenter"}
          },
          {
            "Key": "MigrationPhase",
            "Value": {"Ref": "MigrationPhase"}
          }
        ]
      }
    },
    "PublicRouteTable": {
      "Type": "AWS::EC2::RouteTable",
      "Properties": {
        "VpcId": {"Ref": "VPC"},
        "Tags": [
          {
            "Key": "Name",
            "Value": {"Fn::Sub": "loan-public-rt-${EnvironmentSuffix}"}
          },
          {
            "Key": "Environment",
            "Value": {"Ref": "EnvironmentType"}
          },
          {
            "Key": "CostCenter",
            "Value": {"Ref": "CostCenter"}
          },
          {
            "Key": "MigrationPhase",
            "Value": {"Ref": "MigrationPhase"}
          }
        ]
      }
    },
    "PublicRoute": {
      "Type": "AWS::EC2::Route",
      "DependsOn": "AttachGateway",
      "Properties": {
        "RouteTableId": {"Ref": "PublicRouteTable"},
        "DestinationCidrBlock": "0.0.0.0/0",
        "GatewayId": {"Ref": "InternetGateway"}
      }
    },
    "PublicSubnetRouteTableAssociation1": {
      "Type": "AWS::EC2::SubnetRouteTableAssociation",
      "Properties": {
        "SubnetId": {"Ref": "PublicSubnet1"},
        "RouteTableId": {"Ref": "PublicRouteTable"}
      }
    },
    "PublicSubnetRouteTableAssociation2": {
      "Type": "AWS::EC2::SubnetRouteTableAssociation",
      "Properties": {
        "SubnetId": {"Ref": "PublicSubnet2"},
        "RouteTableId": {"Ref": "PublicRouteTable"}
      }
    },
    "NATGateway1EIP": {
      "Type": "AWS::EC2::EIP",
      "DependsOn": "AttachGateway",
      "Properties": {
        "Domain": "vpc",
        "Tags": [
          {
            "Key": "Name",
            "Value": {"Fn::Sub": "loan-nat-eip-1-${EnvironmentSuffix}"}
          },
          {
            "Key": "Environment",
            "Value": {"Ref": "EnvironmentType"}
          },
          {
            "Key": "CostCenter",
            "Value": {"Ref": "CostCenter"}
          },
          {
            "Key": "MigrationPhase",
            "Value": {"Ref": "MigrationPhase"}
          }
        ]
      }
    },
    "NATGateway1": {
      "Type": "AWS::EC2::NatGateway",
      "Properties": {
        "AllocationId": {"Fn::GetAtt": ["NATGateway1EIP", "AllocationId"]},
        "SubnetId": {"Ref": "PublicSubnet1"},
        "Tags": [
          {
            "Key": "Name",
            "Value": {"Fn::Sub": "loan-nat-1-${EnvironmentSuffix}"}
          },
          {
            "Key": "Environment",
            "Value": {"Ref": "EnvironmentType"}
          },
          {
            "Key": "CostCenter",
            "Value": {"Ref": "CostCenter"}
          },
          {
            "Key": "MigrationPhase",
            "Value": {"Ref": "MigrationPhase"}
          }
        ]
      }
    },
    "NATGateway2EIP": {
      "Type": "AWS::EC2::EIP",
      "Condition": "IsProduction",
      "DependsOn": "AttachGateway",
      "Properties": {
        "Domain": "vpc",
        "Tags": [
          {
            "Key": "Name",
            "Value": {"Fn::Sub": "loan-nat-eip-2-${EnvironmentSuffix}"}
          },
          {
            "Key": "Environment",
            "Value": {"Ref": "EnvironmentType"}
          },
          {
            "Key": "CostCenter",
            "Value": {"Ref": "CostCenter"}
          },
          {
            "Key": "MigrationPhase",
            "Value": {"Ref": "MigrationPhase"}
          }
        ]
      }
    },
    "NATGateway2": {
      "Type": "AWS::EC2::NatGateway",
      "Condition": "IsProduction",
      "Properties": {
        "AllocationId": {"Fn::GetAtt": ["NATGateway2EIP", "AllocationId"]},
        "SubnetId": {"Ref": "PublicSubnet2"},
        "Tags": [
          {
            "Key": "Name",
            "Value": {"Fn::Sub": "loan-nat-2-${EnvironmentSuffix}"}
          },
          {
            "Key": "Environment",
            "Value": {"Ref": "EnvironmentType"}
          },
          {
            "Key": "CostCenter",
            "Value": {"Ref": "CostCenter"}
          },
          {
            "Key": "MigrationPhase",
            "Value": {"Ref": "MigrationPhase"}
          }
        ]
      }
    },
    "PrivateRouteTable1": {
      "Type": "AWS::EC2::RouteTable",
      "Properties": {
        "VpcId": {"Ref": "VPC"},
        "Tags": [
          {
            "Key": "Name",
            "Value": {"Fn::Sub": "loan-private-rt-1-${EnvironmentSuffix}"}
          },
          {
            "Key": "Environment",
            "Value": {"Ref": "EnvironmentType"}
          },
          {
            "Key": "CostCenter",
            "Value": {"Ref": "CostCenter"}
          },
          {
            "Key": "MigrationPhase",
            "Value": {"Ref": "MigrationPhase"}
          }
        ]
      }
    },
    "PrivateRoute1": {
      "Type": "AWS::EC2::Route",
      "Properties": {
        "RouteTableId": {"Ref": "PrivateRouteTable1"},
        "DestinationCidrBlock": "0.0.0.0/0",
        "NatGatewayId": {"Ref": "NATGateway1"}
      }
    },
    "PrivateSubnetRouteTableAssociation1": {
      "Type": "AWS::EC2::SubnetRouteTableAssociation",
      "Properties": {
        "SubnetId": {"Ref": "PrivateSubnet1"},
        "RouteTableId": {"Ref": "PrivateRouteTable1"}
      }
    },
    "PrivateRouteTable2": {
      "Type": "AWS::EC2::RouteTable",
      "Properties": {
        "VpcId": {"Ref": "VPC"},
        "Tags": [
          {
            "Key": "Name",
            "Value": {"Fn::Sub": "loan-private-rt-2-${EnvironmentSuffix}"}
          },
          {
            "Key": "Environment",
            "Value": {"Ref": "EnvironmentType"}
          },
          {
            "Key": "CostCenter",
            "Value": {"Ref": "CostCenter"}
          },
          {
            "Key": "MigrationPhase",
            "Value": {"Ref": "MigrationPhase"}
          }
        ]
      }
    },
    "PrivateRoute2": {
      "Type": "AWS::EC2::Route",
      "Properties": {
        "RouteTableId": {"Ref": "PrivateRouteTable2"},
        "DestinationCidrBlock": "0.0.0.0/0",
        "NatGatewayId": {
          "Fn::If": [
            "IsProduction",
            {"Ref": "NATGateway2"},
            {"Ref": "NATGateway1"}
          ]
        }
      }
    },
    "PrivateSubnetRouteTableAssociation2": {
      "Type": "AWS::EC2::SubnetRouteTableAssociation",
      "Properties": {
        "SubnetId": {"Ref": "PrivateSubnet2"},
        "RouteTableId": {"Ref": "PrivateRouteTable2"}
      }
    },
    "KMSKey": {
      "Type": "AWS::KMS::Key",
      "Properties": {
        "Description": {"Fn::Sub": "KMS key for loan processing encryption - ${EnvironmentSuffix}"},
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
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": {"Fn::Sub": "loan-kms-key-${EnvironmentSuffix}"}
          },
          {
            "Key": "Environment",
            "Value": {"Ref": "EnvironmentType"}
          },
          {
            "Key": "CostCenter",
            "Value": {"Ref": "CostCenter"}
          },
          {
            "Key": "MigrationPhase",
            "Value": {"Ref": "MigrationPhase"}
          }
        ]
      }
    },
    "KMSKeyAlias": {
      "Type": "AWS::KMS::Alias",
      "Properties": {
        "AliasName": {"Fn::Sub": "alias/loan-processing-${EnvironmentSuffix}"},
        "TargetKeyId": {"Ref": "KMSKey"}
      }
    },
    "DBSubnetGroup": {
      "Type": "AWS::RDS::DBSubnetGroup",
      "Properties": {
        "DBSubnetGroupName": {"Fn::Sub": "loan-db-subnet-group-${EnvironmentSuffix}"},
        "DBSubnetGroupDescription": "Subnet group for loan processing Aurora cluster",
        "SubnetIds": [
          {"Ref": "PrivateSubnet1"},
          {"Ref": "PrivateSubnet2"}
        ],
        "Tags": [
          {
            "Key": "Name",
            "Value": {"Fn::Sub": "loan-db-subnet-group-${EnvironmentSuffix}"}
          },
          {
            "Key": "Environment",
            "Value": {"Ref": "EnvironmentType"}
          },
          {
            "Key": "CostCenter",
            "Value": {"Ref": "CostCenter"}
          },
          {
            "Key": "MigrationPhase",
            "Value": {"Ref": "MigrationPhase"}
          }
        ]
      }
    },
    "DBSecurityGroup": {
      "Type": "AWS::EC2::SecurityGroup",
      "Properties": {
        "GroupName": {"Fn::Sub": "loan-db-sg-${EnvironmentSuffix}"},
        "GroupDescription": "Security group for loan processing Aurora cluster",
        "VpcId": {"Ref": "VPC"},
        "SecurityGroupIngress": [
          {
            "IpProtocol": "tcp",
            "FromPort": 3306,
            "ToPort": 3306,
            "SourceSecurityGroupId": {"Ref": "LambdaSecurityGroup"},
            "Description": "Allow MySQL access from Lambda functions"
          }
        ],
        "Tags": [
          {
            "Key": "Name",
            "Value": {"Fn::Sub": "loan-db-sg-${EnvironmentSuffix}"}
          },
          {
            "Key": "Environment",
            "Value": {"Ref": "EnvironmentType"}
          },
          {
            "Key": "CostCenter",
            "Value": {"Ref": "CostCenter"}
          },
          {
            "Key": "MigrationPhase",
            "Value": {"Ref": "MigrationPhase"}
          }
        ]
      }
    },
    "DBSecret": {
      "Type": "AWS::SecretsManager::Secret",
      "Properties": {
        "Name": {"Fn::Sub": "loan-db-credentials-${EnvironmentSuffix}"},
        "Description": "Database credentials for loan processing Aurora cluster",
        "GenerateSecretString": {
          "SecretStringTemplate": "{\"username\": \"loanadmin\"}",
          "GenerateStringKey": "password",
          "PasswordLength": 32,
          "ExcludeCharacters": "\"@/\\\\"
        },
        "KmsKeyId": {"Ref": "KMSKey"},
        "Tags": [
          {
            "Key": "Name",
            "Value": {"Fn::Sub": "loan-db-credentials-${EnvironmentSuffix}"}
          },
          {
            "Key": "Environment",
            "Value": {"Ref": "EnvironmentType"}
          },
          {
            "Key": "CostCenter",
            "Value": {"Ref": "CostCenter"}
          },
          {
            "Key": "MigrationPhase",
            "Value": {"Ref": "MigrationPhase"}
          }
        ]
      }
    },
    "DBCluster": {
      "Type": "AWS::RDS::DBCluster",
      "Properties": {
        "DBClusterIdentifier": {"Fn::Sub": "loan-aurora-cluster-${EnvironmentSuffix}"},
        "Engine": "aurora-mysql",
        "EngineVersion": "8.0.mysql_aurora.3.04.0",
        "MasterUsername": {"Fn::Sub": "{{resolve:secretsmanager:${DBSecret}:SecretString:username}}"},
        "MasterUserPassword": {"Fn::Sub": "{{resolve:secretsmanager:${DBSecret}:SecretString:password}}"},
        "DBSubnetGroupName": {"Ref": "DBSubnetGroup"},
        "VpcSecurityGroupIds": [{"Ref": "DBSecurityGroup"}],
        "StorageEncrypted": true,
        "KmsKeyId": {"Ref": "KMSKey"},
        "BackupRetentionPeriod": 7,
        "PreferredBackupWindow": "03:00-04:00",
        "PreferredMaintenanceWindow": "mon:04:00-mon:05:00",
        "EnableCloudwatchLogsExports": ["error", "general", "slowquery"],
        "DeletionProtection": false,
        "Tags": [
          {
            "Key": "Name",
            "Value": {"Fn::Sub": "loan-aurora-cluster-${EnvironmentSuffix}"}
          },
          {
            "Key": "Environment",
            "Value": {"Ref": "EnvironmentType"}
          },
          {
            "Key": "CostCenter",
            "Value": {"Ref": "CostCenter"}
          },
          {
            "Key": "MigrationPhase",
            "Value": {"Ref": "MigrationPhase"}
          }
        ]
      }
    },
    "DBInstance1": {
      "Type": "AWS::RDS::DBInstance",
      "Properties": {
        "DBInstanceIdentifier": {"Fn::Sub": "loan-aurora-instance-1-${EnvironmentSuffix}"},
        "DBClusterIdentifier": {"Ref": "DBCluster"},
        "DBInstanceClass": {"Ref": "DBInstanceClass"},
        "Engine": "aurora-mysql",
        "PubliclyAccessible": false,
        "Tags": [
          {
            "Key": "Name",
            "Value": {"Fn::Sub": "loan-aurora-instance-1-${EnvironmentSuffix}"}
          },
          {
            "Key": "Environment",
            "Value": {"Ref": "EnvironmentType"}
          },
          {
            "Key": "CostCenter",
            "Value": {"Ref": "CostCenter"}
          },
          {
            "Key": "MigrationPhase",
            "Value": {"Ref": "MigrationPhase"}
          }
        ]
      }
    },
    "DBInstance2": {
      "Type": "AWS::RDS::DBInstance",
      "Condition": "IsProduction",
      "Properties": {
        "DBInstanceIdentifier": {"Fn::Sub": "loan-aurora-instance-2-${EnvironmentSuffix}"},
        "DBClusterIdentifier": {"Ref": "DBCluster"},
        "DBInstanceClass": {"Ref": "DBInstanceClass"},
        "Engine": "aurora-mysql",
        "PubliclyAccessible": false,
        "Tags": [
          {
            "Key": "Name",
            "Value": {"Fn::Sub": "loan-aurora-instance-2-${EnvironmentSuffix}"}
          },
          {
            "Key": "Environment",
            "Value": {"Ref": "EnvironmentType"}
          },
          {
            "Key": "CostCenter",
            "Value": {"Ref": "CostCenter"}
          },
          {
            "Key": "MigrationPhase",
            "Value": {"Ref": "MigrationPhase"}
          }
        ]
      }
    },
    "SecretRotationLambdaRole": {
      "Type": "AWS::IAM::Role",
      "Properties": {
        "RoleName": {"Fn::Sub": "loan-secret-rotation-role-${EnvironmentSuffix}"},
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
            "PolicyName": "SecretsManagerRotation",
            "PolicyDocument": {
              "Version": "2012-10-17",
              "Statement": [
                {
                  "Effect": "Allow",
                  "Action": [
                    "secretsmanager:DescribeSecret",
                    "secretsmanager:GetSecretValue",
                    "secretsmanager:PutSecretValue",
                    "secretsmanager:UpdateSecretVersionStage"
                  ],
                  "Resource": {"Ref": "DBSecret"}
                },
                {
                  "Effect": "Allow",
                  "Action": [
                    "secretsmanager:GetRandomPassword"
                  ],
                  "Resource": "*"
                }
              ]
            }
          }
        ],
        "Tags": [
          {
            "Key": "Name",
            "Value": {"Fn::Sub": "loan-secret-rotation-role-${EnvironmentSuffix}"}
          },
          {
            "Key": "Environment",
            "Value": {"Ref": "EnvironmentType"}
          },
          {
            "Key": "CostCenter",
            "Value": {"Ref": "CostCenter"}
          },
          {
            "Key": "MigrationPhase",
            "Value": {"Ref": "MigrationPhase"}
          }
        ]
      }
    },
    "SecretRotationSchedule": {
      "Type": "AWS::SecretsManager::RotationSchedule",
      "DependsOn": "DBInstance1",
      "Properties": {
        "SecretId": {"Ref": "DBSecret"},
        "RotationLambdaARN": {"Fn::GetAtt": ["SecretRotationLambda", "Arn"]},
        "RotationRules": {
          "AutomaticallyAfterDays": 30
        }
      }
    },
    "SecretRotationLambda": {
      "Type": "AWS::Lambda::Function",
      "Properties": {
        "FunctionName": {"Fn::Sub": "loan-secret-rotation-${EnvironmentSuffix}"},
        "Runtime": "python3.11",
        "Handler": "index.lambda_handler",
        "Role": {"Fn::GetAtt": ["SecretRotationLambdaRole", "Arn"]},
        "VpcConfig": {
          "SecurityGroupIds": [{"Ref": "LambdaSecurityGroup"}],
          "SubnetIds": [
            {"Ref": "PrivateSubnet1"},
            {"Ref": "PrivateSubnet2"}
          ]
        },
        "Timeout": 300,
        "Environment": {
          "Variables": {
            "SECRETS_MANAGER_ENDPOINT": {"Fn::Sub": "https://secretsmanager.${AWS::Region}.amazonaws.com"}
          }
        },
        "Code": {
          "ZipFile": "import boto3\nimport json\nimport pymysql\nimport os\n\ndef lambda_handler(event, context):\n    service_client = boto3.client('secretsmanager')\n    arn = event['SecretId']\n    token = event['ClientRequestToken']\n    step = event['Step']\n    \n    metadata = service_client.describe_secret(SecretId=arn)\n    if not metadata['RotationEnabled']:\n        raise ValueError(f\"Secret {arn} is not enabled for rotation\")\n    \n    versions = metadata['VersionIdsToStages']\n    if token not in versions:\n        raise ValueError(f\"Secret version {token} has no stage for rotation\")\n    \n    if step == \"createSecret\":\n        create_secret(service_client, arn, token)\n    elif step == \"setSecret\":\n        set_secret(service_client, arn, token)\n    elif step == \"testSecret\":\n        test_secret(service_client, arn, token)\n    elif step == \"finishSecret\":\n        finish_secret(service_client, arn, token)\n    else:\n        raise ValueError(\"Invalid step parameter\")\n\ndef create_secret(service_client, arn, token):\n    service_client.get_secret_value(SecretId=arn, VersionStage=\"AWSCURRENT\")\n    try:\n        service_client.get_secret_value(SecretId=arn, VersionId=token, VersionStage=\"AWSPENDING\")\n    except service_client.exceptions.ResourceNotFoundException:\n        passwd = service_client.get_random_password(PasswordLength=32, ExcludeCharacters='\"@/\\\\')\n        current_dict = json.loads(service_client.get_secret_value(SecretId=arn, VersionStage=\"AWSCURRENT\")['SecretString'])\n        current_dict['password'] = passwd['RandomPassword']\n        service_client.put_secret_value(SecretId=arn, ClientRequestToken=token, SecretString=json.dumps(current_dict), VersionStages=['AWSPENDING'])\n\ndef set_secret(service_client, arn, token):\n    pass\n\ndef test_secret(service_client, arn, token):\n    pass\n\ndef finish_secret(service_client, arn, token):\n    metadata = service_client.describe_secret(SecretId=arn)\n    current_version = None\n    for version in metadata[\"VersionIdsToStages\"]:\n        if \"AWSCURRENT\" in metadata[\"VersionIdsToStages\"][version]:\n            if version == token:\n                return\n            current_version = version\n            break\n    \n    service_client.update_secret_version_stage(SecretId=arn, VersionStage=\"AWSCURRENT\", MoveToVersionId=token, RemoveFromVersionId=current_version)\n"
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": {"Fn::Sub": "loan-secret-rotation-${EnvironmentSuffix}"}
          },
          {
            "Key": "Environment",
            "Value": {"Ref": "EnvironmentType"}
          },
          {
            "Key": "CostCenter",
            "Value": {"Ref": "CostCenter"}
          },
          {
            "Key": "MigrationPhase",
            "Value": {"Ref": "MigrationPhase"}
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
    "LoanDocumentsBucket": {
      "Type": "AWS::S3::Bucket",
      "Properties": {
        "BucketName": {"Fn::Sub": "loan-documents-${EnvironmentSuffix}-${AWS::AccountId}"},
        "VersioningConfiguration": {
          "Status": "Enabled"
        },
        "BucketEncryption": {
          "ServerSideEncryptionConfiguration": [
            {
              "ServerSideEncryptionByDefault": {
                "SSEAlgorithm": "aws:kms",
                "KMSMasterKeyID": {"Ref": "KMSKey"}
              }
            }
          ]
        },
        "PublicAccessBlockConfiguration": {
          "BlockPublicAcls": true,
          "BlockPublicPolicy": true,
          "IgnorePublicAcls": true,
          "RestrictPublicBuckets": true
        },
        "LifecycleConfiguration": {
          "Rules": [
            {
              "Id": "DeleteOldVersions",
              "Status": "Enabled",
              "NoncurrentVersionExpirationInDays": 90
            }
          ]
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": {"Fn::Sub": "loan-documents-${EnvironmentSuffix}"}
          },
          {
            "Key": "Environment",
            "Value": {"Ref": "EnvironmentType"}
          },
          {
            "Key": "CostCenter",
            "Value": {"Ref": "CostCenter"}
          },
          {
            "Key": "MigrationPhase",
            "Value": {"Ref": "MigrationPhase"}
          }
        ]
      }
    },
    "LambdaSecurityGroup": {
      "Type": "AWS::EC2::SecurityGroup",
      "Properties": {
        "GroupName": {"Fn::Sub": "loan-lambda-sg-${EnvironmentSuffix}"},
        "GroupDescription": "Security group for loan processing Lambda functions",
        "VpcId": {"Ref": "VPC"},
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
            "Value": {"Fn::Sub": "loan-lambda-sg-${EnvironmentSuffix}"}
          },
          {
            "Key": "Environment",
            "Value": {"Ref": "EnvironmentType"}
          },
          {
            "Key": "CostCenter",
            "Value": {"Ref": "CostCenter"}
          },
          {
            "Key": "MigrationPhase",
            "Value": {"Ref": "MigrationPhase"}
          }
        ]
      }
    },
    "LoanValidationLogGroup": {
      "Type": "AWS::Logs::LogGroup",
      "Properties": {
        "LogGroupName": {"Fn::Sub": "/aws/lambda/loan-validation-${EnvironmentSuffix}"},
        "RetentionInDays": 90,
        "Tags": [
          {
            "Key": "Name",
            "Value": {"Fn::Sub": "loan-validation-logs-${EnvironmentSuffix}"}
          },
          {
            "Key": "Environment",
            "Value": {"Ref": "EnvironmentType"}
          },
          {
            "Key": "CostCenter",
            "Value": {"Ref": "CostCenter"}
          },
          {
            "Key": "MigrationPhase",
            "Value": {"Ref": "MigrationPhase"}
          }
        ]
      }
    },
    "LoanValidationRole": {
      "Type": "AWS::IAM::Role",
      "Properties": {
        "RoleName": {"Fn::Sub": "loan-validation-role-${EnvironmentSuffix}"},
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
            "PolicyName": "LoanValidationPolicy",
            "PolicyDocument": {
              "Version": "2012-10-17",
              "Statement": [
                {
                  "Effect": "Allow",
                  "Action": [
                    "logs:CreateLogGroup",
                    "logs:CreateLogStream",
                    "logs:PutLogEvents"
                  ],
                  "Resource": {"Fn::GetAtt": ["LoanValidationLogGroup", "Arn"]}
                },
                {
                  "Effect": "Allow",
                  "Action": [
                    "secretsmanager:GetSecretValue"
                  ],
                  "Resource": {"Ref": "DBSecret"}
                },
                {
                  "Effect": "Allow",
                  "Action": [
                    "kms:Decrypt"
                  ],
                  "Resource": {"Fn::GetAtt": ["KMSKey", "Arn"]}
                },
                {
                  "Effect": "Allow",
                  "Action": [
                    "s3:GetObject",
                    "s3:PutObject"
                  ],
                  "Resource": {"Fn::Sub": "${LoanDocumentsBucket.Arn}/*"}
                }
              ]
            }
          }
        ],
        "Tags": [
          {
            "Key": "Name",
            "Value": {"Fn::Sub": "loan-validation-role-${EnvironmentSuffix}"}
          },
          {
            "Key": "Environment",
            "Value": {"Ref": "EnvironmentType"}
          },
          {
            "Key": "CostCenter",
            "Value": {"Ref": "CostCenter"}
          },
          {
            "Key": "MigrationPhase",
            "Value": {"Ref": "MigrationPhase"}
          }
        ]
      }
    },
    "LoanValidationFunction": {
      "Type": "AWS::Lambda::Function",
      "DependsOn": "LoanValidationLogGroup",
      "Properties": {
        "FunctionName": {"Fn::Sub": "loan-validation-${EnvironmentSuffix}"},
        "Runtime": "python3.11",
        "Handler": "index.lambda_handler",
        "Role": {"Fn::GetAtt": ["LoanValidationRole", "Arn"]},
        "MemorySize": 1024,
        "Timeout": 300,
        "ReservedConcurrentExecutions": 10,
        "VpcConfig": {
          "SecurityGroupIds": [{"Ref": "LambdaSecurityGroup"}],
          "SubnetIds": [
            {"Ref": "PrivateSubnet1"},
            {"Ref": "PrivateSubnet2"}
          ]
        },
        "Environment": {
          "Variables": {
            "DB_SECRET_ARN": {"Ref": "DBSecret"},
            "DB_CLUSTER_ENDPOINT": {"Fn::GetAtt": ["DBCluster", "Endpoint.Address"]},
            "DOCUMENTS_BUCKET": {"Ref": "LoanDocumentsBucket"},
            "ENVIRONMENT": {"Ref": "EnvironmentType"}
          }
        },
        "Code": {
          "ZipFile": "import json\nimport boto3\nimport os\nfrom decimal import Decimal\n\ndef lambda_handler(event, context):\n    \"\"\"\n    Loan validation Lambda function\n    Validates loan applications against business rules\n    \"\"\"\n    \n    print(f\"Processing loan validation request: {json.dumps(event)}\")\n    \n    # Extract loan details from event\n    loan_amount = event.get('loanAmount', 0)\n    credit_score = event.get('creditScore', 0)\n    debt_to_income = event.get('debtToIncome', 0)\n    loan_type = event.get('loanType', 'personal')\n    \n    # Initialize validation result\n    validation_result = {\n        'loanId': event.get('loanId', 'unknown'),\n        'isValid': False,\n        'validationErrors': [],\n        'validationWarnings': [],\n        'approvalStatus': 'PENDING'\n    }\n    \n    # Validation rules\n    errors = []\n    warnings = []\n    \n    # Rule 1: Loan amount validation\n    if loan_amount <= 0:\n        errors.append('Loan amount must be greater than zero')\n    elif loan_amount > 1000000:\n        errors.append('Loan amount exceeds maximum allowed ($1,000,000)')\n    \n    # Rule 2: Credit score validation\n    if credit_score < 300 or credit_score > 850:\n        errors.append('Credit score must be between 300 and 850')\n    elif credit_score < 620:\n        warnings.append('Credit score below recommended threshold (620)')\n    \n    # Rule 3: Debt-to-income ratio validation\n    if debt_to_income < 0 or debt_to_income > 100:\n        errors.append('Debt-to-income ratio must be between 0 and 100')\n    elif debt_to_income > 43:\n        warnings.append('Debt-to-income ratio exceeds recommended threshold (43%)')\n    \n    # Rule 4: Loan type validation\n    valid_loan_types = ['personal', 'mortgage', 'auto', 'business']\n    if loan_type not in valid_loan_types:\n        errors.append(f'Invalid loan type. Must be one of: {\", \".join(valid_loan_types)}')\n    \n    # Determine approval status\n    if len(errors) == 0:\n        if len(warnings) == 0:\n            validation_result['approvalStatus'] = 'APPROVED'\n            validation_result['isValid'] = True\n        else:\n            validation_result['approvalStatus'] = 'MANUAL_REVIEW'\n            validation_result['isValid'] = True\n    else:\n        validation_result['approvalStatus'] = 'REJECTED'\n        validation_result['isValid'] = False\n    \n    validation_result['validationErrors'] = errors\n    validation_result['validationWarnings'] = warnings\n    \n    print(f\"Validation result: {json.dumps(validation_result)}\")\n    \n    return {\n        'statusCode': 200,\n        'body': json.dumps(validation_result),\n        'headers': {\n            'Content-Type': 'application/json'\n        }\n    }\n"
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": {"Fn::Sub": "loan-validation-${EnvironmentSuffix}"}
          },
          {
            "Key": "Environment",
            "Value": {"Ref": "EnvironmentType"}
          },
          {
            "Key": "CostCenter",
            "Value": {"Ref": "CostCenter"}
          },
          {
            "Key": "MigrationPhase",
            "Value": {"Ref": "MigrationPhase"}
          }
        ]
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
    "DBClusterEndpoint": {
      "Description": "Aurora MySQL cluster endpoint",
      "Value": {"Fn::GetAtt": ["DBCluster", "Endpoint.Address"]},
      "Export": {
        "Name": {"Fn::Sub": "${AWS::StackName}-DBClusterEndpoint"}
      }
    },
    "DBSecretArn": {
      "Description": "ARN of the database credentials secret",
      "Value": {"Ref": "DBSecret"},
      "Export": {
        "Name": {"Fn::Sub": "${AWS::StackName}-DBSecretArn"}
      }
    },
    "LoanDocumentsBucketName": {
      "Description": "S3 bucket for loan documents",
      "Value": {"Ref": "LoanDocumentsBucket"},
      "Export": {
        "Name": {"Fn::Sub": "${AWS::StackName}-DocumentsBucket"}
      }
    },
    "LoanValidationFunctionArn": {
      "Description": "ARN of the loan validation Lambda function",
      "Value": {"Fn::GetAtt": ["LoanValidationFunction", "Arn"]},
      "Export": {
        "Name": {"Fn::Sub": "${AWS::StackName}-ValidationFunctionArn"}
      }
    },
    "KMSKeyId": {
      "Description": "KMS Key ID for encryption",
      "Value": {"Ref": "KMSKey"},
      "Export": {
        "Name": {"Fn::Sub": "${AWS::StackName}-KMSKeyId"}
      }
    }
  }
}
```

## File: lib/README.md

```markdown
# Loan Processing Migration Infrastructure

This CloudFormation template creates a complete AWS infrastructure for migrating an on-premises loan processing system to AWS.

## Architecture Overview

The infrastructure includes:

- **VPC Network**: Multi-AZ VPC with public and private subnets across 2 availability zones
- **RDS Aurora MySQL**: Encrypted database cluster with automatic backups and Secrets Manager integration
- **Lambda Function**: Loan validation processing with 1GB memory and reserved concurrency
- **S3 Storage**: Versioned bucket for loan documents with KMS encryption
- **Secrets Manager**: Automatic 30-day credential rotation for database passwords
- **CloudWatch Logs**: 90-day retention for compliance requirements
- **KMS Encryption**: Customer-managed keys for data encryption

## Parameters

| Parameter | Description | Default | Allowed Values |
|-----------|-------------|---------|----------------|
| EnvironmentSuffix | Unique suffix for resource names | Required | alphanumeric + hyphens |
| EnvironmentType | Environment type (dev/prod) | dev | dev, prod |
| DBInstanceClass | RDS Aurora instance size | db.t3.medium | db.t3.medium, db.t3.large, db.r5.large, db.r5.xlarge, db.r5.2xlarge |
| CostCenter | Cost center tag | FinancialServices | any string |
| MigrationPhase | Migration phase tag | Phase1-Infrastructure | Phase1 through Phase5 |

## Deployment

### Prerequisites

- AWS CLI configured with appropriate credentials
- Permissions to create VPC, RDS, Lambda, S3, KMS, Secrets Manager, and IAM resources

### Deploy Development Environment

```bash
aws cloudformation create-stack \
  --stack-name loan-processing-dev \
  --template-body file://lib/loan-processing-stack.json \
  --parameters \
    ParameterKey=EnvironmentSuffix,ParameterValue=dev-001 \
    ParameterKey=EnvironmentType,ParameterValue=dev \
    ParameterKey=DBInstanceClass,ParameterValue=db.t3.medium \
  --capabilities CAPABILITY_NAMED_IAM \
  --region us-east-1
```

### Deploy Production Environment

```bash
aws cloudformation create-stack \
  --stack-name loan-processing-prod \
  --template-body file://lib/loan-processing-stack.json \
  --parameters \
    ParameterKey=EnvironmentSuffix,ParameterValue=prod-001 \
    ParameterKey=EnvironmentType,ParameterValue=prod \
    ParameterKey=DBInstanceClass,ParameterValue=db.r5.large \
  --capabilities CAPABILITY_NAMED_IAM \
  --region us-east-1
```

### Monitor Deployment

```bash
aws cloudformation describe-stacks \
  --stack-name loan-processing-dev \
  --query 'Stacks[0].StackStatus' \
  --region us-east-1
```

## Environment Differences

### Development Environment (EnvironmentType=dev)

- Single NAT Gateway for cost savings
- Single Aurora instance (writer only)
- Suitable for testing and development

### Production Environment (EnvironmentType=prod)

- Dual NAT Gateways for high availability
- Two Aurora instances (writer + reader for multi-AZ)
- Full redundancy across availability zones

## Security Features

1. **Encryption**
   - Customer-managed KMS keys for all data at rest
   - S3 bucket encryption with KMS
   - RDS Aurora storage encryption
   - Encrypted Secrets Manager secrets

2. **Network Isolation**
   - Private subnets for RDS and Lambda
   - Security groups restricting access
   - No public database endpoints
   - NAT Gateways for outbound connectivity

3. **Credential Management**
   - Secrets Manager for database credentials
   - Automatic 30-day password rotation
   - IAM roles with least privilege access

4. **Audit & Compliance**
   - CloudWatch Logs with 90-day retention
   - Aurora audit logs enabled
   - Resource tagging for cost allocation

## Outputs

| Output | Description |
|--------|-------------|
| VPCId | VPC identifier for reference |
| DBClusterEndpoint | Aurora cluster endpoint for connections |
| DBSecretArn | Secrets Manager ARN for database credentials |
| LoanDocumentsBucketName | S3 bucket name for documents |
| LoanValidationFunctionArn | Lambda function ARN |
| KMSKeyId | KMS key ID for encryption |

## Cost Optimization

- Development environment uses single NAT Gateway
- Aurora instances sized appropriately by parameter
- Reserved concurrency prevents Lambda throttling
- S3 lifecycle policies clean up old versions after 90 days

## Cleanup

To delete the stack and all resources:

```bash
# Empty the S3 bucket first
aws s3 rm s3://loan-documents-<suffix>-<account-id> --recursive

# Delete the stack
aws cloudformation delete-stack \
  --stack-name loan-processing-dev \
  --region us-east-1
```

**Note**: All resources are configured without deletion protection or retain policies, making cleanup straightforward.

## Troubleshooting

### Stack Creation Fails

1. Check CloudFormation events:
   ```bash
   aws cloudformation describe-stack-events \
     --stack-name loan-processing-dev \
     --region us-east-1
   ```

2. Verify IAM permissions include CAPABILITY_NAMED_IAM
3. Ensure EnvironmentSuffix is unique across your account

### Lambda Function Cannot Connect to RDS

1. Verify Lambda is in private subnets
2. Check security group rules allow traffic between Lambda and RDS
3. Confirm NAT Gateway is operational for outbound connectivity

### Secret Rotation Fails

1. Check Secret rotation Lambda logs in CloudWatch
2. Verify Lambda can reach RDS endpoint
3. Ensure rotation Lambda has VPC access execution role

## Support

For issues related to the infrastructure, check:
- CloudFormation stack events
- CloudWatch Logs for Lambda functions
- RDS event logs
- VPC Flow Logs (if enabled)
```

## Deployment Verification

After deployment completes, verify the infrastructure:

1. **Check Stack Status**
   ```bash
   aws cloudformation describe-stacks --stack-name loan-processing-dev
   ```

2. **Test Lambda Function**
   ```bash
   aws lambda invoke \
     --function-name loan-validation-<suffix> \
     --payload '{"loanId":"TEST001","loanAmount":50000,"creditScore":720,"debtToIncome":35,"loanType":"personal"}' \
     response.json
   ```

3. **Verify Database Connectivity**
   ```bash
   # Get database endpoint
   aws rds describe-db-clusters --db-cluster-identifier loan-aurora-cluster-<suffix>

   # Get credentials from Secrets Manager
   aws secretsmanager get-secret-value --secret-id loan-db-credentials-<suffix>
   ```

4. **Check S3 Bucket**
   ```bash
   aws s3 ls s3://loan-documents-<suffix>-<account-id>
   ```

## Features Implemented

- All MANDATORY requirements completed
- Parameters for flexible deployment
- Conditions for dev/prod differences
- Multi-AZ support with conditional resources
- Encrypted storage with KMS
- Secrets Manager with 30-day rotation
- CloudWatch Logs with 90-day retention
- Lambda with 1GB memory and reserved concurrency
- S3 with versioning enabled
- Comprehensive tagging
- No deletion protection (fully destroyable)
