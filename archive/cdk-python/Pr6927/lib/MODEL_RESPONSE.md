# Model Response: Serverless Credit Scoring Infrastructure

This document contains the complete CloudFormation JSON template for deploying a serverless credit scoring web application.

## File: lib/TapStack.json

```json
{
  "AWSTemplateFormatVersion": "2010-09-09",
  "Description": "Serverless credit scoring web application with ALB, Lambda, and Aurora Serverless v2",
  "Parameters": {
    "EnvironmentSuffix": {
      "Type": "String",
      "Description": "Unique suffix for resource naming to enable parallel deployments",
      "AllowedPattern": "[a-z0-9-]+",
      "ConstraintDescription": "Must contain only lowercase letters, numbers, and hyphens"
    },
    "CertificateArn": {
      "Type": "String",
      "Description": "ARN of ACM certificate for HTTPS listener",
      "Default": "arn:aws:acm:us-east-1:123456789012:certificate/example"
    },
    "DatabaseMasterUsername": {
      "Type": "String",
      "Description": "Master username for Aurora database",
      "Default": "dbadmin",
      "NoEcho": true
    },
    "DatabaseMasterPassword": {
      "Type": "String",
      "Description": "Master password for Aurora database",
      "NoEcho": true,
      "MinLength": 8
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
            "Value": { "Fn::Sub": "vpc-${EnvironmentSuffix}" }
          },
          {
            "Key": "Environment",
            "Value": "Production"
          },
          {
            "Key": "CostCenter",
            "Value": "FinTech"
          },
          {
            "Key": "DataClassification",
            "Value": "Sensitive"
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
            "Value": { "Fn::Sub": "igw-${EnvironmentSuffix}" }
          },
          {
            "Key": "Environment",
            "Value": "Production"
          },
          {
            "Key": "CostCenter",
            "Value": "FinTech"
          },
          {
            "Key": "DataClassification",
            "Value": "Sensitive"
          }
        ]
      }
    },
    "VPCGatewayAttachment": {
      "Type": "AWS::EC2::VPCGatewayAttachment",
      "Properties": {
        "VpcId": { "Ref": "VPC" },
        "InternetGatewayId": { "Ref": "InternetGateway" }
      }
    },
    "PublicSubnet1": {
      "Type": "AWS::EC2::Subnet",
      "Properties": {
        "VpcId": { "Ref": "VPC" },
        "CidrBlock": "10.0.1.0/24",
        "AvailabilityZone": { "Fn::Select": [0, { "Fn::GetAZs": "" }] },
        "MapPublicIpOnLaunch": true,
        "Tags": [
          {
            "Key": "Name",
            "Value": { "Fn::Sub": "public-subnet-1-${EnvironmentSuffix}" }
          },
          {
            "Key": "Environment",
            "Value": "Production"
          },
          {
            "Key": "CostCenter",
            "Value": "FinTech"
          },
          {
            "Key": "DataClassification",
            "Value": "Sensitive"
          }
        ]
      }
    },
    "PublicSubnet2": {
      "Type": "AWS::EC2::Subnet",
      "Properties": {
        "VpcId": { "Ref": "VPC" },
        "CidrBlock": "10.0.2.0/24",
        "AvailabilityZone": { "Fn::Select": [1, { "Fn::GetAZs": "" }] },
        "MapPublicIpOnLaunch": true,
        "Tags": [
          {
            "Key": "Name",
            "Value": { "Fn::Sub": "public-subnet-2-${EnvironmentSuffix}" }
          },
          {
            "Key": "Environment",
            "Value": "Production"
          },
          {
            "Key": "CostCenter",
            "Value": "FinTech"
          },
          {
            "Key": "DataClassification",
            "Value": "Sensitive"
          }
        ]
      }
    },
    "PublicSubnet3": {
      "Type": "AWS::EC2::Subnet",
      "Properties": {
        "VpcId": { "Ref": "VPC" },
        "CidrBlock": "10.0.3.0/24",
        "AvailabilityZone": { "Fn::Select": [2, { "Fn::GetAZs": "" }] },
        "MapPublicIpOnLaunch": true,
        "Tags": [
          {
            "Key": "Name",
            "Value": { "Fn::Sub": "public-subnet-3-${EnvironmentSuffix}" }
          },
          {
            "Key": "Environment",
            "Value": "Production"
          },
          {
            "Key": "CostCenter",
            "Value": "FinTech"
          },
          {
            "Key": "DataClassification",
            "Value": "Sensitive"
          }
        ]
      }
    },
    "PrivateSubnet1": {
      "Type": "AWS::EC2::Subnet",
      "Properties": {
        "VpcId": { "Ref": "VPC" },
        "CidrBlock": "10.0.11.0/24",
        "AvailabilityZone": { "Fn::Select": [0, { "Fn::GetAZs": "" }] },
        "Tags": [
          {
            "Key": "Name",
            "Value": { "Fn::Sub": "private-subnet-1-${EnvironmentSuffix}" }
          },
          {
            "Key": "Environment",
            "Value": "Production"
          },
          {
            "Key": "CostCenter",
            "Value": "FinTech"
          },
          {
            "Key": "DataClassification",
            "Value": "Sensitive"
          }
        ]
      }
    },
    "PrivateSubnet2": {
      "Type": "AWS::EC2::Subnet",
      "Properties": {
        "VpcId": { "Ref": "VPC" },
        "CidrBlock": "10.0.12.0/24",
        "AvailabilityZone": { "Fn::Select": [1, { "Fn::GetAZs": "" }] },
        "Tags": [
          {
            "Key": "Name",
            "Value": { "Fn::Sub": "private-subnet-2-${EnvironmentSuffix}" }
          },
          {
            "Key": "Environment",
            "Value": "Production"
          },
          {
            "Key": "CostCenter",
            "Value": "FinTech"
          },
          {
            "Key": "DataClassification",
            "Value": "Sensitive"
          }
        ]
      }
    },
    "PrivateSubnet3": {
      "Type": "AWS::EC2::Subnet",
      "Properties": {
        "VpcId": { "Ref": "VPC" },
        "CidrBlock": "10.0.13.0/24",
        "AvailabilityZone": { "Fn::Select": [2, { "Fn::GetAZs": "" }] },
        "Tags": [
          {
            "Key": "Name",
            "Value": { "Fn::Sub": "private-subnet-3-${EnvironmentSuffix}" }
          },
          {
            "Key": "Environment",
            "Value": "Production"
          },
          {
            "Key": "CostCenter",
            "Value": "FinTech"
          },
          {
            "Key": "DataClassification",
            "Value": "Sensitive"
          }
        ]
      }
    },
    "NATGatewayEIP": {
      "Type": "AWS::EC2::EIP",
      "DependsOn": "VPCGatewayAttachment",
      "Properties": {
        "Domain": "vpc",
        "Tags": [
          {
            "Key": "Name",
            "Value": { "Fn::Sub": "nat-eip-${EnvironmentSuffix}" }
          },
          {
            "Key": "Environment",
            "Value": "Production"
          },
          {
            "Key": "CostCenter",
            "Value": "FinTech"
          },
          {
            "Key": "DataClassification",
            "Value": "Sensitive"
          }
        ]
      }
    },
    "NATGateway": {
      "Type": "AWS::EC2::NatGateway",
      "Properties": {
        "AllocationId": { "Fn::GetAtt": ["NATGatewayEIP", "AllocationId"] },
        "SubnetId": { "Ref": "PublicSubnet1" },
        "Tags": [
          {
            "Key": "Name",
            "Value": { "Fn::Sub": "nat-gateway-${EnvironmentSuffix}" }
          },
          {
            "Key": "Environment",
            "Value": "Production"
          },
          {
            "Key": "CostCenter",
            "Value": "FinTech"
          },
          {
            "Key": "DataClassification",
            "Value": "Sensitive"
          }
        ]
      }
    },
    "PublicRouteTable": {
      "Type": "AWS::EC2::RouteTable",
      "Properties": {
        "VpcId": { "Ref": "VPC" },
        "Tags": [
          {
            "Key": "Name",
            "Value": { "Fn::Sub": "public-rt-${EnvironmentSuffix}" }
          },
          {
            "Key": "Environment",
            "Value": "Production"
          },
          {
            "Key": "CostCenter",
            "Value": "FinTech"
          },
          {
            "Key": "DataClassification",
            "Value": "Sensitive"
          }
        ]
      }
    },
    "PublicRoute": {
      "Type": "AWS::EC2::Route",
      "DependsOn": "VPCGatewayAttachment",
      "Properties": {
        "RouteTableId": { "Ref": "PublicRouteTable" },
        "DestinationCidrBlock": "0.0.0.0/0",
        "GatewayId": { "Ref": "InternetGateway" }
      }
    },
    "PublicSubnet1RouteTableAssociation": {
      "Type": "AWS::EC2::SubnetRouteTableAssociation",
      "Properties": {
        "SubnetId": { "Ref": "PublicSubnet1" },
        "RouteTableId": { "Ref": "PublicRouteTable" }
      }
    },
    "PublicSubnet2RouteTableAssociation": {
      "Type": "AWS::EC2::SubnetRouteTableAssociation",
      "Properties": {
        "SubnetId": { "Ref": "PublicSubnet2" },
        "RouteTableId": { "Ref": "PublicRouteTable" }
      }
    },
    "PublicSubnet3RouteTableAssociation": {
      "Type": "AWS::EC2::SubnetRouteTableAssociation",
      "Properties": {
        "SubnetId": { "Ref": "PublicSubnet3" },
        "RouteTableId": { "Ref": "PublicRouteTable" }
      }
    },
    "PrivateRouteTable": {
      "Type": "AWS::EC2::RouteTable",
      "Properties": {
        "VpcId": { "Ref": "VPC" },
        "Tags": [
          {
            "Key": "Name",
            "Value": { "Fn::Sub": "private-rt-${EnvironmentSuffix}" }
          },
          {
            "Key": "Environment",
            "Value": "Production"
          },
          {
            "Key": "CostCenter",
            "Value": "FinTech"
          },
          {
            "Key": "DataClassification",
            "Value": "Sensitive"
          }
        ]
      }
    },
    "PrivateRoute": {
      "Type": "AWS::EC2::Route",
      "Properties": {
        "RouteTableId": { "Ref": "PrivateRouteTable" },
        "DestinationCidrBlock": "0.0.0.0/0",
        "NatGatewayId": { "Ref": "NATGateway" }
      }
    },
    "PrivateSubnet1RouteTableAssociation": {
      "Type": "AWS::EC2::SubnetRouteTableAssociation",
      "Properties": {
        "SubnetId": { "Ref": "PrivateSubnet1" },
        "RouteTableId": { "Ref": "PrivateRouteTable" }
      }
    },
    "PrivateSubnet2RouteTableAssociation": {
      "Type": "AWS::EC2::SubnetRouteTableAssociation",
      "Properties": {
        "SubnetId": { "Ref": "PrivateSubnet2" },
        "RouteTableId": { "Ref": "PrivateRouteTable" }
      }
    },
    "PrivateSubnet3RouteTableAssociation": {
      "Type": "AWS::EC2::SubnetRouteTableAssociation",
      "Properties": {
        "SubnetId": { "Ref": "PrivateSubnet3" },
        "RouteTableId": { "Ref": "PrivateRouteTable" }
      }
    },
    "KMSKey": {
      "Type": "AWS::KMS::Key",
      "Properties": {
        "Description": { "Fn::Sub": "KMS key for Aurora encryption - ${EnvironmentSuffix}" },
        "EnableKeyRotation": true,
        "KeyPolicy": {
          "Version": "2012-10-17",
          "Statement": [
            {
              "Sid": "Enable IAM User Permissions",
              "Effect": "Allow",
              "Principal": {
                "AWS": { "Fn::Sub": "arn:aws:iam::${AWS::AccountId}:root" }
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
                "kms:DescribeKey",
                "kms:CreateGrant"
              ],
              "Resource": "*"
            }
          ]
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": { "Fn::Sub": "kms-key-${EnvironmentSuffix}" }
          },
          {
            "Key": "Environment",
            "Value": "Production"
          },
          {
            "Key": "CostCenter",
            "Value": "FinTech"
          },
          {
            "Key": "DataClassification",
            "Value": "Sensitive"
          }
        ]
      }
    },
    "KMSKeyAlias": {
      "Type": "AWS::KMS::Alias",
      "Properties": {
        "AliasName": { "Fn::Sub": "alias/aurora-${EnvironmentSuffix}" },
        "TargetKeyId": { "Ref": "KMSKey" }
      }
    },
    "DBSubnetGroup": {
      "Type": "AWS::RDS::DBSubnetGroup",
      "Properties": {
        "DBSubnetGroupDescription": { "Fn::Sub": "Subnet group for Aurora cluster - ${EnvironmentSuffix}" },
        "DBSubnetGroupName": { "Fn::Sub": "db-subnet-group-${EnvironmentSuffix}" },
        "SubnetIds": [
          { "Ref": "PrivateSubnet1" },
          { "Ref": "PrivateSubnet2" },
          { "Ref": "PrivateSubnet3" }
        ],
        "Tags": [
          {
            "Key": "Name",
            "Value": { "Fn::Sub": "db-subnet-group-${EnvironmentSuffix}" }
          },
          {
            "Key": "Environment",
            "Value": "Production"
          },
          {
            "Key": "CostCenter",
            "Value": "FinTech"
          },
          {
            "Key": "DataClassification",
            "Value": "Sensitive"
          }
        ]
      }
    },
    "AuroraSecurityGroup": {
      "Type": "AWS::EC2::SecurityGroup",
      "Properties": {
        "GroupDescription": { "Fn::Sub": "Security group for Aurora cluster - ${EnvironmentSuffix}" },
        "GroupName": { "Fn::Sub": "aurora-sg-${EnvironmentSuffix}" },
        "VpcId": { "Ref": "VPC" },
        "SecurityGroupIngress": [
          {
            "IpProtocol": "tcp",
            "FromPort": 5432,
            "ToPort": 5432,
            "SourceSecurityGroupId": { "Ref": "LambdaSecurityGroup" }
          }
        ],
        "Tags": [
          {
            "Key": "Name",
            "Value": { "Fn::Sub": "aurora-sg-${EnvironmentSuffix}" }
          },
          {
            "Key": "Environment",
            "Value": "Production"
          },
          {
            "Key": "CostCenter",
            "Value": "FinTech"
          },
          {
            "Key": "DataClassification",
            "Value": "Sensitive"
          }
        ]
      }
    },
    "AuroraCluster": {
      "Type": "AWS::RDS::DBCluster",
      "Properties": {
        "Engine": "aurora-postgresql",
        "EngineMode": "provisioned",
        "EngineVersion": "15.3",
        "DatabaseName": "creditscoring",
        "MasterUsername": { "Ref": "DatabaseMasterUsername" },
        "MasterUserPassword": { "Ref": "DatabaseMasterPassword" },
        "DBClusterIdentifier": { "Fn::Sub": "aurora-cluster-${EnvironmentSuffix}" },
        "DBSubnetGroupName": { "Ref": "DBSubnetGroup" },
        "VpcSecurityGroupIds": [{ "Ref": "AuroraSecurityGroup" }],
        "BackupRetentionPeriod": 30,
        "PreferredBackupWindow": "03:00-04:00",
        "PreferredMaintenanceWindow": "mon:04:00-mon:05:00",
        "StorageEncrypted": true,
        "KmsKeyId": { "Ref": "KMSKey" },
        "EnableCloudwatchLogsExports": ["postgresql"],
        "ServerlessV2ScalingConfiguration": {
          "MinCapacity": 0.5,
          "MaxCapacity": 2
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": { "Fn::Sub": "aurora-cluster-${EnvironmentSuffix}" }
          },
          {
            "Key": "Environment",
            "Value": "Production"
          },
          {
            "Key": "CostCenter",
            "Value": "FinTech"
          },
          {
            "Key": "DataClassification",
            "Value": "Sensitive"
          }
        ]
      }
    },
    "AuroraInstance1": {
      "Type": "AWS::RDS::DBInstance",
      "Properties": {
        "Engine": "aurora-postgresql",
        "DBClusterIdentifier": { "Ref": "AuroraCluster" },
        "DBInstanceClass": "db.serverless",
        "DBInstanceIdentifier": { "Fn::Sub": "aurora-instance-1-${EnvironmentSuffix}" },
        "PubliclyAccessible": false,
        "EnablePerformanceInsights": true,
        "PerformanceInsightsRetentionPeriod": 7,
        "Tags": [
          {
            "Key": "Name",
            "Value": { "Fn::Sub": "aurora-instance-1-${EnvironmentSuffix}" }
          },
          {
            "Key": "Environment",
            "Value": "Production"
          },
          {
            "Key": "CostCenter",
            "Value": "FinTech"
          },
          {
            "Key": "DataClassification",
            "Value": "Sensitive"
          }
        ]
      }
    },
    "AuroraLogGroup": {
      "Type": "AWS::Logs::LogGroup",
      "Properties": {
        "LogGroupName": { "Fn::Sub": "/aws/rds/cluster/aurora-cluster-${EnvironmentSuffix}/postgresql" },
        "RetentionInDays": 365,
        "Tags": [
          {
            "Key": "Name",
            "Value": { "Fn::Sub": "aurora-logs-${EnvironmentSuffix}" }
          },
          {
            "Key": "Environment",
            "Value": "Production"
          },
          {
            "Key": "CostCenter",
            "Value": "FinTech"
          },
          {
            "Key": "DataClassification",
            "Value": "Sensitive"
          }
        ]
      }
    },
    "LambdaSecurityGroup": {
      "Type": "AWS::EC2::SecurityGroup",
      "Properties": {
        "GroupDescription": { "Fn::Sub": "Security group for Lambda function - ${EnvironmentSuffix}" },
        "GroupName": { "Fn::Sub": "lambda-sg-${EnvironmentSuffix}" },
        "VpcId": { "Ref": "VPC" },
        "SecurityGroupEgress": [
          {
            "IpProtocol": "tcp",
            "FromPort": 5432,
            "ToPort": 5432,
            "DestinationSecurityGroupId": { "Ref": "AuroraSecurityGroup" }
          },
          {
            "IpProtocol": "tcp",
            "FromPort": 443,
            "ToPort": 443,
            "CidrIp": "0.0.0.0/0"
          }
        ],
        "Tags": [
          {
            "Key": "Name",
            "Value": { "Fn::Sub": "lambda-sg-${EnvironmentSuffix}" }
          },
          {
            "Key": "Environment",
            "Value": "Production"
          },
          {
            "Key": "CostCenter",
            "Value": "FinTech"
          },
          {
            "Key": "DataClassification",
            "Value": "Sensitive"
          }
        ]
      }
    },
    "LambdaExecutionRole": {
      "Type": "AWS::IAM::Role",
      "Properties": {
        "RoleName": { "Fn::Sub": "lambda-execution-role-${EnvironmentSuffix}" },
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
            "PolicyName": "AuroraAccess",
            "PolicyDocument": {
              "Version": "2012-10-17",
              "Statement": [
                {
                  "Effect": "Allow",
                  "Action": [
                    "rds-data:ExecuteStatement",
                    "rds-data:BatchExecuteStatement"
                  ],
                  "Resource": { "Fn::GetAtt": ["AuroraCluster", "DBClusterArn"] }
                }
              ]
            }
          },
          {
            "PolicyName": "CloudWatchLogs",
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
                  "Resource": "arn:aws:logs:*:*:*"
                }
              ]
            }
          }
        ],
        "Tags": [
          {
            "Key": "Name",
            "Value": { "Fn::Sub": "lambda-execution-role-${EnvironmentSuffix}" }
          },
          {
            "Key": "Environment",
            "Value": "Production"
          },
          {
            "Key": "CostCenter",
            "Value": "FinTech"
          },
          {
            "Key": "DataClassification",
            "Value": "Sensitive"
          }
        ]
      }
    },
    "LambdaFunction": {
      "Type": "AWS::Lambda::Function",
      "Properties": {
        "FunctionName": { "Fn::Sub": "credit-scoring-${EnvironmentSuffix}" },
        "Runtime": "nodejs18.x",
        "Handler": "index.handler",
        "Role": { "Fn::GetAtt": ["LambdaExecutionRole", "Arn"] },
        "Code": {
          "ZipFile": "exports.handler = async (event) => { console.log('Credit scoring logic', JSON.stringify(event)); const response = { statusCode: 200, body: JSON.stringify({ score: 750, status: 'approved' }) }; return response; };"
        },
        "Timeout": 30,
        "MemorySize": 512,
        "ReservedConcurrentExecutions": 10,
        "VpcConfig": {
          "SecurityGroupIds": [{ "Ref": "LambdaSecurityGroup" }],
          "SubnetIds": [
            { "Ref": "PrivateSubnet1" },
            { "Ref": "PrivateSubnet2" },
            { "Ref": "PrivateSubnet3" }
          ]
        },
        "Environment": {
          "Variables": {
            "DB_CLUSTER_ARN": { "Fn::GetAtt": ["AuroraCluster", "DBClusterArn"] },
            "DB_NAME": "creditscoring"
          }
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": { "Fn::Sub": "credit-scoring-${EnvironmentSuffix}" }
          },
          {
            "Key": "Environment",
            "Value": "Production"
          },
          {
            "Key": "CostCenter",
            "Value": "FinTech"
          },
          {
            "Key": "DataClassification",
            "Value": "Sensitive"
          }
        ]
      }
    },
    "LambdaLogGroup": {
      "Type": "AWS::Logs::LogGroup",
      "Properties": {
        "LogGroupName": { "Fn::Sub": "/aws/lambda/credit-scoring-${EnvironmentSuffix}" },
        "RetentionInDays": 365,
        "Tags": [
          {
            "Key": "Name",
            "Value": { "Fn::Sub": "lambda-logs-${EnvironmentSuffix}" }
          },
          {
            "Key": "Environment",
            "Value": "Production"
          },
          {
            "Key": "CostCenter",
            "Value": "FinTech"
          },
          {
            "Key": "DataClassification",
            "Value": "Sensitive"
          }
        ]
      }
    },
    "LambdaFunctionUrl": {
      "Type": "AWS::Lambda::Url",
      "Properties": {
        "AuthType": "AWS_IAM",
        "TargetFunctionArn": { "Fn::GetAtt": ["LambdaFunction", "Arn"] }
      }
    },
    "LambdaInvokePermission": {
      "Type": "AWS::Lambda::Permission",
      "Properties": {
        "FunctionName": { "Ref": "LambdaFunction" },
        "Action": "lambda:InvokeFunctionUrl",
        "Principal": "elasticloadbalancing.amazonaws.com",
        "SourceArn": { "Fn::GetAtt": ["ALBTargetGroup", "TargetGroupArn"] }
      }
    },
    "ALBSecurityGroup": {
      "Type": "AWS::EC2::SecurityGroup",
      "Properties": {
        "GroupDescription": { "Fn::Sub": "Security group for ALB - ${EnvironmentSuffix}" },
        "GroupName": { "Fn::Sub": "alb-sg-${EnvironmentSuffix}" },
        "VpcId": { "Ref": "VPC" },
        "SecurityGroupIngress": [
          {
            "IpProtocol": "tcp",
            "FromPort": 443,
            "ToPort": 443,
            "CidrIp": "0.0.0.0/0"
          }
        ],
        "Tags": [
          {
            "Key": "Name",
            "Value": { "Fn::Sub": "alb-sg-${EnvironmentSuffix}" }
          },
          {
            "Key": "Environment",
            "Value": "Production"
          },
          {
            "Key": "CostCenter",
            "Value": "FinTech"
          },
          {
            "Key": "DataClassification",
            "Value": "Sensitive"
          }
        ]
      }
    },
    "ALBLogsBucket": {
      "Type": "AWS::S3::Bucket",
      "Properties": {
        "BucketName": { "Fn::Sub": "alb-logs-${EnvironmentSuffix}" },
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
        },
        "LifecycleConfiguration": {
          "Rules": [
            {
              "Id": "DeleteOldLogs",
              "Status": "Enabled",
              "ExpirationInDays": 365
            }
          ]
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": { "Fn::Sub": "alb-logs-${EnvironmentSuffix}" }
          },
          {
            "Key": "Environment",
            "Value": "Production"
          },
          {
            "Key": "CostCenter",
            "Value": "FinTech"
          },
          {
            "Key": "DataClassification",
            "Value": "Sensitive"
          }
        ]
      }
    },
    "ALBLogsBucketPolicy": {
      "Type": "AWS::S3::BucketPolicy",
      "Properties": {
        "Bucket": { "Ref": "ALBLogsBucket" },
        "PolicyDocument": {
          "Statement": [
            {
              "Effect": "Allow",
              "Principal": {
                "AWS": "arn:aws:iam::127311923021:root"
              },
              "Action": "s3:PutObject",
              "Resource": { "Fn::Sub": "${ALBLogsBucket.Arn}/*" }
            }
          ]
        }
      }
    },
    "ApplicationLoadBalancer": {
      "Type": "AWS::ElasticLoadBalancingV2::LoadBalancer",
      "Properties": {
        "Name": { "Fn::Sub": "alb-${EnvironmentSuffix}" },
        "Type": "application",
        "Scheme": "internet-facing",
        "IpAddressType": "ipv4",
        "Subnets": [
          { "Ref": "PublicSubnet1" },
          { "Ref": "PublicSubnet2" },
          { "Ref": "PublicSubnet3" }
        ],
        "SecurityGroups": [{ "Ref": "ALBSecurityGroup" }],
        "LoadBalancerAttributes": [
          {
            "Key": "access_logs.s3.enabled",
            "Value": "true"
          },
          {
            "Key": "access_logs.s3.bucket",
            "Value": { "Ref": "ALBLogsBucket" }
          }
        ],
        "Tags": [
          {
            "Key": "Name",
            "Value": { "Fn::Sub": "alb-${EnvironmentSuffix}" }
          },
          {
            "Key": "Environment",
            "Value": "Production"
          },
          {
            "Key": "CostCenter",
            "Value": "FinTech"
          },
          {
            "Key": "DataClassification",
            "Value": "Sensitive"
          }
        ]
      }
    },
    "ALBTargetGroup": {
      "Type": "AWS::ElasticLoadBalancingV2::TargetGroup",
      "Properties": {
        "Name": { "Fn::Sub": "alb-tg-${EnvironmentSuffix}" },
        "TargetType": "lambda",
        "Targets": [
          {
            "Id": { "Fn::GetAtt": ["LambdaFunction", "Arn"] }
          }
        ],
        "Tags": [
          {
            "Key": "Name",
            "Value": { "Fn::Sub": "alb-tg-${EnvironmentSuffix}" }
          },
          {
            "Key": "Environment",
            "Value": "Production"
          },
          {
            "Key": "CostCenter",
            "Value": "FinTech"
          },
          {
            "Key": "DataClassification",
            "Value": "Sensitive"
          }
        ]
      }
    },
    "ALBListener": {
      "Type": "AWS::ElasticLoadBalancingV2::Listener",
      "Properties": {
        "LoadBalancerArn": { "Ref": "ApplicationLoadBalancer" },
        "Port": 443,
        "Protocol": "HTTPS",
        "SslPolicy": "ELBSecurityPolicy-TLS-1-2-2017-01",
        "Certificates": [
          {
            "CertificateArn": { "Ref": "CertificateArn" }
          }
        ],
        "DefaultActions": [
          {
            "Type": "forward",
            "TargetGroupArn": { "Ref": "ALBTargetGroup" }
          }
        ]
      }
    },
    "ALBListenerRule": {
      "Type": "AWS::ElasticLoadBalancingV2::ListenerRule",
      "Properties": {
        "ListenerArn": { "Ref": "ALBListener" },
        "Priority": 1,
        "Conditions": [
          {
            "Field": "path-pattern",
            "Values": ["/score"]
          }
        ],
        "Actions": [
          {
            "Type": "forward",
            "TargetGroupArn": { "Ref": "ALBTargetGroup" }
          }
        ]
      }
    }
  },
  "Outputs": {
    "VPCId": {
      "Description": "VPC ID",
      "Value": { "Ref": "VPC" },
      "Export": {
        "Name": { "Fn::Sub": "${AWS::StackName}-VPCId" }
      }
    },
    "ALBDNSName": {
      "Description": "Application Load Balancer DNS Name",
      "Value": { "Fn::GetAtt": ["ApplicationLoadBalancer", "DNSName"] },
      "Export": {
        "Name": { "Fn::Sub": "${AWS::StackName}-ALBDNSName" }
      }
    },
    "LambdaFunctionArn": {
      "Description": "Lambda Function ARN",
      "Value": { "Fn::GetAtt": ["LambdaFunction", "Arn"] },
      "Export": {
        "Name": { "Fn::Sub": "${AWS::StackName}-LambdaFunctionArn" }
      }
    },
    "LambdaFunctionUrl": {
      "Description": "Lambda Function URL",
      "Value": { "Fn::GetAtt": ["LambdaFunctionUrl", "FunctionUrl"] },
      "Export": {
        "Name": { "Fn::Sub": "${AWS::StackName}-LambdaFunctionUrl" }
      }
    },
    "AuroraClusterEndpoint": {
      "Description": "Aurora Cluster Endpoint",
      "Value": { "Fn::GetAtt": ["AuroraCluster", "Endpoint.Address"] },
      "Export": {
        "Name": { "Fn::Sub": "${AWS::StackName}-AuroraClusterEndpoint" }
      }
    },
    "AuroraClusterArn": {
      "Description": "Aurora Cluster ARN",
      "Value": { "Fn::GetAtt": ["AuroraCluster", "DBClusterArn"] },
      "Export": {
        "Name": { "Fn::Sub": "${AWS::StackName}-AuroraClusterArn" }
      }
    },
    "KMSKeyId": {
      "Description": "KMS Key ID",
      "Value": { "Ref": "KMSKey" },
      "Export": {
        "Name": { "Fn::Sub": "${AWS::StackName}-KMSKeyId" }
      }
    },
    "ALBLogsBucket": {
      "Description": "S3 Bucket for ALB Logs",
      "Value": { "Ref": "ALBLogsBucket" },
      "Export": {
        "Name": { "Fn::Sub": "${AWS::StackName}-ALBLogsBucket" }
      }
    }
  }
}
```

## File: lib/lambda/credit-scoring.js

```javascript
/**
 * Credit Scoring Lambda Function
 *
 * This function handles credit scoring requests from the ALB.
 * It extracts customer data from the request, performs credit scoring logic,
 * and returns a credit score and approval status.
 */

exports.handler = async (event) => {
    console.log('Received event:', JSON.stringify(event, null, 2));

    try {
        // Extract request data
        const body = event.body ? JSON.parse(event.body) : {};
        const customerId = body.customerId || 'unknown';
        const income = body.income || 0;
        const creditHistory = body.creditHistory || 0;

        // Simple credit scoring logic (placeholder)
        let score = 600; // Base score

        // Adjust score based on income
        if (income > 100000) {
            score += 100;
        } else if (income > 50000) {
            score += 50;
        }

        // Adjust score based on credit history (years)
        score += Math.min(creditHistory * 10, 100);

        // Cap score at 850
        score = Math.min(score, 850);

        // Determine approval status
        const status = score >= 700 ? 'approved' : 'declined';

        // Log the scoring decision
        console.log(`Credit scoring for customer ${customerId}: score=${score}, status=${status}`);

        // Return response
        const response = {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({
                customerId: customerId,
                score: score,
                status: status,
                timestamp: new Date().toISOString()
            })
        };

        return response;

    } catch (error) {
        console.error('Error processing credit scoring request:', error);

        return {
            statusCode: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({
                error: 'Internal server error',
                message: error.message
            })
        };
    }
};
```
