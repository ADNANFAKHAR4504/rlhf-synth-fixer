# Payment Processing Migration - CloudFormation Implementation

This implementation provides a comprehensive CloudFormation JSON template structure for migrating a payment processing system to AWS with multi-environment support.

## File: lib/master-stack.json

```json
{
  "AWSTemplateFormatVersion": "2010-09-09",
  "Description": "Master stack for payment processing infrastructure migration",
  "Parameters": {
    "EnvironmentSuffix": {
      "Type": "String",
      "Description": "Environment suffix for resource naming (e.g., prod, staging)",
      "AllowedPattern": "[a-z0-9-]+",
      "MinLength": 1,
      "MaxLength": 20
    },
    "Environment": {
      "Type": "String",
      "Description": "Environment name",
      "AllowedValues": ["production", "staging"],
      "Default": "production"
    },
    "VPCStackTemplateURL": {
      "Type": "String",
      "Description": "S3 URL for VPC nested stack template"
    },
    "DatabaseStackTemplateURL": {
      "Type": "String",
      "Description": "S3 URL for Database nested stack template"
    },
    "ApplicationStackTemplateURL": {
      "Type": "String",
      "Description": "S3 URL for Application nested stack template"
    },
    "DBMasterUsername": {
      "Type": "String",
      "Description": "Master username for RDS Aurora cluster",
      "Default": "admin",
      "NoEcho": true
    },
    "DBMasterPassword": {
      "Type": "String",
      "Description": "Master password for RDS Aurora cluster",
      "NoEcho": true,
      "MinLength": 8
    }
  },
  "Resources": {
    "VPCStack": {
      "Type": "AWS::CloudFormation::Stack",
      "Properties": {
        "TemplateURL": {
          "Ref": "VPCStackTemplateURL"
        },
        "Parameters": {
          "EnvironmentSuffix": {
            "Ref": "EnvironmentSuffix"
          }
        },
        "Tags": [
          {
            "Key": "Environment",
            "Value": {
              "Ref": "Environment"
            }
          },
          {
            "Key": "ManagedBy",
            "Value": "CloudFormation"
          }
        ]
      }
    },
    "DatabaseStack": {
      "Type": "AWS::CloudFormation::Stack",
      "DependsOn": "VPCStack",
      "Properties": {
        "TemplateURL": {
          "Ref": "DatabaseStackTemplateURL"
        },
        "Parameters": {
          "EnvironmentSuffix": {
            "Ref": "EnvironmentSuffix"
          },
          "VPCId": {
            "Fn::GetAtt": ["VPCStack", "Outputs.VPCId"]
          },
          "PrivateSubnetIds": {
            "Fn::GetAtt": ["VPCStack", "Outputs.PrivateSubnetIds"]
          },
          "DBMasterUsername": {
            "Ref": "DBMasterUsername"
          },
          "DBMasterPassword": {
            "Ref": "DBMasterPassword"
          }
        },
        "Tags": [
          {
            "Key": "Environment",
            "Value": {
              "Ref": "Environment"
            }
          }
        ]
      }
    },
    "ApplicationStack": {
      "Type": "AWS::CloudFormation::Stack",
      "DependsOn": "DatabaseStack",
      "Properties": {
        "TemplateURL": {
          "Ref": "ApplicationStackTemplateURL"
        },
        "Parameters": {
          "EnvironmentSuffix": {
            "Ref": "EnvironmentSuffix"
          },
          "VPCId": {
            "Fn::GetAtt": ["VPCStack", "Outputs.VPCId"]
          },
          "PrivateSubnetIds": {
            "Fn::GetAtt": ["VPCStack", "Outputs.PrivateSubnetIds"]
          },
          "DBSecretArn": {
            "Fn::GetAtt": ["DatabaseStack", "Outputs.DBSecretArn"]
          },
          "DBClusterEndpoint": {
            "Fn::GetAtt": ["DatabaseStack", "Outputs.DBClusterEndpoint"]
          },
          "KMSKeyId": {
            "Fn::GetAtt": ["DatabaseStack", "Outputs.KMSKeyId"]
          }
        },
        "Tags": [
          {
            "Key": "Environment",
            "Value": {
              "Ref": "Environment"
            }
          }
        ]
      }
    }
  },
  "Outputs": {
    "VPCId": {
      "Description": "VPC ID",
      "Value": {
        "Fn::GetAtt": ["VPCStack", "Outputs.VPCId"]
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-VPCId"
        }
      }
    },
    "APIEndpoint": {
      "Description": "API Gateway endpoint",
      "Value": {
        "Fn::GetAtt": ["ApplicationStack", "Outputs.APIEndpoint"]
      }
    },
    "DBClusterEndpoint": {
      "Description": "RDS Aurora cluster endpoint",
      "Value": {
        "Fn::GetAtt": ["DatabaseStack", "Outputs.DBClusterEndpoint"]
      }
    }
  }
}
```

## File: lib/vpc-stack.json

```json
{
  "AWSTemplateFormatVersion": "2010-09-09",
  "Description": "VPC infrastructure for payment processing system",
  "Parameters": {
    "EnvironmentSuffix": {
      "Type": "String",
      "Description": "Environment suffix for resource naming"
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
            "Value": {
              "Fn::Sub": "payment-vpc-${EnvironmentSuffix}"
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
              "Fn::Sub": "payment-igw-${EnvironmentSuffix}"
            }
          }
        ]
      }
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
    "PrivateSubnet1": {
      "Type": "AWS::EC2::Subnet",
      "Properties": {
        "VpcId": {
          "Ref": "VPC"
        },
        "CidrBlock": "10.0.1.0/24",
        "AvailabilityZone": {
          "Fn::Select": [
            0,
            {
              "Fn::GetAZs": ""
            }
          ]
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "payment-private-subnet-1-${EnvironmentSuffix}"
            }
          }
        ]
      }
    },
    "PrivateSubnet2": {
      "Type": "AWS::EC2::Subnet",
      "Properties": {
        "VpcId": {
          "Ref": "VPC"
        },
        "CidrBlock": "10.0.2.0/24",
        "AvailabilityZone": {
          "Fn::Select": [
            1,
            {
              "Fn::GetAZs": ""
            }
          ]
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "payment-private-subnet-2-${EnvironmentSuffix}"
            }
          }
        ]
      }
    },
    "PrivateSubnet3": {
      "Type": "AWS::EC2::Subnet",
      "Properties": {
        "VpcId": {
          "Ref": "VPC"
        },
        "CidrBlock": "10.0.3.0/24",
        "AvailabilityZone": {
          "Fn::Select": [
            2,
            {
              "Fn::GetAZs": ""
            }
          ]
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "payment-private-subnet-3-${EnvironmentSuffix}"
            }
          }
        ]
      }
    },
    "PublicSubnet1": {
      "Type": "AWS::EC2::Subnet",
      "Properties": {
        "VpcId": {
          "Ref": "VPC"
        },
        "CidrBlock": "10.0.101.0/24",
        "AvailabilityZone": {
          "Fn::Select": [
            0,
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
              "Fn::Sub": "payment-public-subnet-1-${EnvironmentSuffix}"
            }
          }
        ]
      }
    },
    "PublicSubnet2": {
      "Type": "AWS::EC2::Subnet",
      "Properties": {
        "VpcId": {
          "Ref": "VPC"
        },
        "CidrBlock": "10.0.102.0/24",
        "AvailabilityZone": {
          "Fn::Select": [
            1,
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
              "Fn::Sub": "payment-public-subnet-2-${EnvironmentSuffix}"
            }
          }
        ]
      }
    },
    "PublicSubnet3": {
      "Type": "AWS::EC2::Subnet",
      "Properties": {
        "VpcId": {
          "Ref": "VPC"
        },
        "CidrBlock": "10.0.103.0/24",
        "AvailabilityZone": {
          "Fn::Select": [
            2,
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
              "Fn::Sub": "payment-public-subnet-3-${EnvironmentSuffix}"
            }
          }
        ]
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
            "Value": {
              "Fn::Sub": "payment-nat-eip-1-${EnvironmentSuffix}"
            }
          }
        ]
      }
    },
    "NATGateway1": {
      "Type": "AWS::EC2::NatGateway",
      "Properties": {
        "AllocationId": {
          "Fn::GetAtt": ["NATGateway1EIP", "AllocationId"]
        },
        "SubnetId": {
          "Ref": "PublicSubnet1"
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "payment-nat-1-${EnvironmentSuffix}"
            }
          }
        ]
      }
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
              "Fn::Sub": "payment-public-rt-${EnvironmentSuffix}"
            }
          }
        ]
      }
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
    "PublicSubnet3RouteTableAssociation": {
      "Type": "AWS::EC2::SubnetRouteTableAssociation",
      "Properties": {
        "SubnetId": {
          "Ref": "PublicSubnet3"
        },
        "RouteTableId": {
          "Ref": "PublicRouteTable"
        }
      }
    },
    "PrivateRouteTable1": {
      "Type": "AWS::EC2::RouteTable",
      "Properties": {
        "VpcId": {
          "Ref": "VPC"
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "payment-private-rt-1-${EnvironmentSuffix}"
            }
          }
        ]
      }
    },
    "PrivateRoute1": {
      "Type": "AWS::EC2::Route",
      "Properties": {
        "RouteTableId": {
          "Ref": "PrivateRouteTable1"
        },
        "DestinationCidrBlock": "0.0.0.0/0",
        "NatGatewayId": {
          "Ref": "NATGateway1"
        }
      }
    },
    "PrivateSubnet1RouteTableAssociation": {
      "Type": "AWS::EC2::SubnetRouteTableAssociation",
      "Properties": {
        "SubnetId": {
          "Ref": "PrivateSubnet1"
        },
        "RouteTableId": {
          "Ref": "PrivateRouteTable1"
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
          "Ref": "PrivateRouteTable1"
        }
      }
    },
    "PrivateSubnet3RouteTableAssociation": {
      "Type": "AWS::EC2::SubnetRouteTableAssociation",
      "Properties": {
        "SubnetId": {
          "Ref": "PrivateSubnet3"
        },
        "RouteTableId": {
          "Ref": "PrivateRouteTable1"
        }
      }
    }
  },
  "Outputs": {
    "VPCId": {
      "Description": "VPC ID",
      "Value": {
        "Ref": "VPC"
      }
    },
    "PrivateSubnetIds": {
      "Description": "Comma-separated list of private subnet IDs",
      "Value": {
        "Fn::Join": [
          ",",
          [
            {
              "Ref": "PrivateSubnet1"
            },
            {
              "Ref": "PrivateSubnet2"
            },
            {
              "Ref": "PrivateSubnet3"
            }
          ]
        ]
      }
    },
    "PublicSubnetIds": {
      "Description": "Comma-separated list of public subnet IDs",
      "Value": {
        "Fn::Join": [
          ",",
          [
            {
              "Ref": "PublicSubnet1"
            },
            {
              "Ref": "PublicSubnet2"
            },
            {
              "Ref": "PublicSubnet3"
            }
          ]
        ]
      }
    }
  }
}
```

## File: lib/database-stack.json

```json
{
  "AWSTemplateFormatVersion": "2010-09-09",
  "Description": "Database infrastructure for payment processing system",
  "Parameters": {
    "EnvironmentSuffix": {
      "Type": "String",
      "Description": "Environment suffix for resource naming"
    },
    "VPCId": {
      "Type": "String",
      "Description": "VPC ID"
    },
    "PrivateSubnetIds": {
      "Type": "CommaDelimitedList",
      "Description": "List of private subnet IDs"
    },
    "DBMasterUsername": {
      "Type": "String",
      "Description": "Master username for Aurora cluster",
      "NoEcho": true
    },
    "DBMasterPassword": {
      "Type": "String",
      "Description": "Master password for Aurora cluster",
      "NoEcho": true
    }
  },
  "Resources": {
    "KMSKey": {
      "Type": "AWS::KMS::Key",
      "Properties": {
        "Description": {
          "Fn::Sub": "KMS key for payment processing ${EnvironmentSuffix}"
        },
        "EnableKeyRotation": true,
        "KeyPolicy": {
          "Version": "2012-10-17",
          "Statement": [
            {
              "Sid": "Enable IAM User Permissions",
              "Effect": "Allow",
              "Principal": {
                "AWS": {
                  "Fn::Sub": "arn:aws:iam::${AWS::AccountId}:root"
                }
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
            "Value": {
              "Fn::Sub": "payment-kms-${EnvironmentSuffix}"
            }
          }
        ]
      }
    },
    "KMSKeyAlias": {
      "Type": "AWS::KMS::Alias",
      "Properties": {
        "AliasName": {
          "Fn::Sub": "alias/payment-${EnvironmentSuffix}"
        },
        "TargetKeyId": {
          "Ref": "KMSKey"
        }
      }
    },
    "DBSecurityGroup": {
      "Type": "AWS::EC2::SecurityGroup",
      "Properties": {
        "GroupDescription": "Security group for Aurora cluster",
        "VpcId": {
          "Ref": "VPCId"
        },
        "SecurityGroupIngress": [
          {
            "IpProtocol": "tcp",
            "FromPort": 3306,
            "ToPort": 3306,
            "SourceSecurityGroupId": {
              "Ref": "LambdaSecurityGroup"
            },
            "Description": "Allow MySQL access from Lambda"
          }
        ],
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "payment-db-sg-${EnvironmentSuffix}"
            }
          }
        ]
      }
    },
    "LambdaSecurityGroup": {
      "Type": "AWS::EC2::SecurityGroup",
      "Properties": {
        "GroupDescription": "Security group for Lambda functions",
        "VpcId": {
          "Ref": "VPCId"
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
              "Fn::Sub": "payment-lambda-sg-${EnvironmentSuffix}"
            }
          }
        ]
      }
    },
    "DBSubnetGroup": {
      "Type": "AWS::RDS::DBSubnetGroup",
      "Properties": {
        "DBSubnetGroupDescription": "Subnet group for Aurora cluster",
        "SubnetIds": {
          "Ref": "PrivateSubnetIds"
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "payment-db-subnet-group-${EnvironmentSuffix}"
            }
          }
        ]
      }
    },
    "DBSecret": {
      "Type": "AWS::SecretsManager::Secret",
      "Properties": {
        "Name": {
          "Fn::Sub": "payment-db-credentials-${EnvironmentSuffix}"
        },
        "Description": "RDS Aurora MySQL credentials",
        "KmsKeyId": {
          "Ref": "KMSKey"
        },
        "SecretString": {
          "Fn::Sub": "{\"username\":\"${DBMasterUsername}\",\"password\":\"${DBMasterPassword}\"}"
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "payment-db-secret-${EnvironmentSuffix}"
            }
          }
        ]
      }
    },
    "DBCluster": {
      "Type": "AWS::RDS::DBCluster",
      "Properties": {
        "Engine": "aurora-mysql",
        "EngineVersion": "8.0.mysql_aurora.3.04.0",
        "DatabaseName": "paymentdb",
        "MasterUsername": {
          "Ref": "DBMasterUsername"
        },
        "MasterUserPassword": {
          "Ref": "DBMasterPassword"
        },
        "DBSubnetGroupName": {
          "Ref": "DBSubnetGroup"
        },
        "VpcSecurityGroupIds": [
          {
            "Ref": "DBSecurityGroup"
          }
        ],
        "StorageEncrypted": true,
        "KmsKeyId": {
          "Ref": "KMSKey"
        },
        "BackupRetentionPeriod": 7,
        "PreferredBackupWindow": "03:00-04:00",
        "PreferredMaintenanceWindow": "mon:04:00-mon:05:00",
        "EnableCloudwatchLogsExports": ["error", "general", "slowquery"],
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "payment-db-cluster-${EnvironmentSuffix}"
            }
          }
        ]
      }
    },
    "DBInstance1": {
      "Type": "AWS::RDS::DBInstance",
      "Properties": {
        "Engine": "aurora-mysql",
        "DBClusterIdentifier": {
          "Ref": "DBCluster"
        },
        "DBInstanceClass": "db.t3.medium",
        "PubliclyAccessible": false,
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "payment-db-instance-1-${EnvironmentSuffix}"
            }
          }
        ]
      }
    },
    "DBInstance2": {
      "Type": "AWS::RDS::DBInstance",
      "Properties": {
        "Engine": "aurora-mysql",
        "DBClusterIdentifier": {
          "Ref": "DBCluster"
        },
        "DBInstanceClass": "db.t3.medium",
        "PubliclyAccessible": false,
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "payment-db-instance-2-${EnvironmentSuffix}"
            }
          }
        ]
      }
    },
    "DBCPUAlarm": {
      "Type": "AWS::CloudWatch::Alarm",
      "Properties": {
        "AlarmName": {
          "Fn::Sub": "payment-db-cpu-alarm-${EnvironmentSuffix}"
        },
        "AlarmDescription": "Alert when DB CPU exceeds 80%",
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
              "Ref": "DBCluster"
            }
          }
        ]
      }
    }
  },
  "Outputs": {
    "DBClusterEndpoint": {
      "Description": "Aurora cluster endpoint",
      "Value": {
        "Fn::GetAtt": ["DBCluster", "Endpoint.Address"]
      }
    },
    "DBSecretArn": {
      "Description": "ARN of database credentials secret",
      "Value": {
        "Ref": "DBSecret"
      }
    },
    "KMSKeyId": {
      "Description": "KMS Key ID",
      "Value": {
        "Ref": "KMSKey"
      }
    },
    "LambdaSecurityGroupId": {
      "Description": "Lambda security group ID",
      "Value": {
        "Ref": "LambdaSecurityGroup"
      }
    }
  }
}
```

## File: lib/application-stack.json

```json
{
  "AWSTemplateFormatVersion": "2010-09-09",
  "Description": "Application infrastructure for payment processing system",
  "Parameters": {
    "EnvironmentSuffix": {
      "Type": "String",
      "Description": "Environment suffix for resource naming"
    },
    "VPCId": {
      "Type": "String",
      "Description": "VPC ID"
    },
    "PrivateSubnetIds": {
      "Type": "CommaDelimitedList",
      "Description": "List of private subnet IDs"
    },
    "DBSecretArn": {
      "Type": "String",
      "Description": "ARN of database credentials secret"
    },
    "DBClusterEndpoint": {
      "Type": "String",
      "Description": "Aurora cluster endpoint"
    },
    "KMSKeyId": {
      "Type": "String",
      "Description": "KMS Key ID for encryption"
    }
  },
  "Resources": {
    "DeadLetterQueue": {
      "Type": "AWS::SQS::Queue",
      "Properties": {
        "QueueName": {
          "Fn::Sub": "payment-dlq-${EnvironmentSuffix}"
        },
        "MessageRetentionPeriod": 1209600,
        "KmsMasterKeyId": {
          "Ref": "KMSKeyId"
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "payment-dlq-${EnvironmentSuffix}"
            }
          }
        ]
      }
    },
    "TransactionQueue": {
      "Type": "AWS::SQS::Queue",
      "Properties": {
        "QueueName": {
          "Fn::Sub": "payment-transaction-queue-${EnvironmentSuffix}"
        },
        "VisibilityTimeout": 300,
        "MessageRetentionPeriod": 345600,
        "KmsMasterKeyId": {
          "Ref": "KMSKeyId"
        },
        "RedrivePolicy": {
          "deadLetterTargetArn": {
            "Fn::GetAtt": ["DeadLetterQueue", "Arn"]
          },
          "maxReceiveCount": 3
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "payment-queue-${EnvironmentSuffix}"
            }
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
          "arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole"
        ],
        "Policies": [
          {
            "PolicyName": "LambdaSecretsAccess",
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
                    "Ref": "DBSecretArn"
                  }
                },
                {
                  "Effect": "Allow",
                  "Action": [
                    "kms:Decrypt",
                    "kms:DescribeKey"
                  ],
                  "Resource": {
                    "Fn::Sub": "arn:aws:kms:${AWS::Region}:${AWS::AccountId}:key/${KMSKeyId}"
                  }
                },
                {
                  "Effect": "Allow",
                  "Action": [
                    "ssm:GetParameter",
                    "ssm:GetParameters"
                  ],
                  "Resource": {
                    "Fn::Sub": "arn:aws:ssm:${AWS::Region}:${AWS::AccountId}:parameter/payment/${EnvironmentSuffix}/*"
                  }
                },
                {
                  "Effect": "Allow",
                  "Action": [
                    "sqs:SendMessage",
                    "sqs:ReceiveMessage",
                    "sqs:DeleteMessage",
                    "sqs:GetQueueAttributes"
                  ],
                  "Resource": [
                    {
                      "Fn::GetAtt": ["TransactionQueue", "Arn"]
                    },
                    {
                      "Fn::GetAtt": ["DeadLetterQueue", "Arn"]
                    }
                  ]
                }
              ]
            }
          }
        ],
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "payment-lambda-role-${EnvironmentSuffix}"
            }
          }
        ]
      }
    },
    "PaymentProcessorFunction": {
      "Type": "AWS::Lambda::Function",
      "Properties": {
        "FunctionName": {
          "Fn::Sub": "payment-processor-${EnvironmentSuffix}"
        },
        "Runtime": "python3.11",
        "Handler": "index.handler",
        "Role": {
          "Fn::GetAtt": ["LambdaExecutionRole", "Arn"]
        },
        "Code": {
          "ZipFile": "import json\nimport os\nimport boto3\nfrom botocore.exceptions import ClientError\n\ndef handler(event, context):\n    secrets_client = boto3.client('secretsmanager')\n    ssm_client = boto3.client('ssm')\n    \n    try:\n        secret_arn = os.environ['DB_SECRET_ARN']\n        secret_response = secrets_client.get_secret_value(SecretId=secret_arn)\n        db_credentials = json.loads(secret_response['SecretString'])\n        \n        environment_suffix = os.environ['ENVIRONMENT_SUFFIX']\n        config_response = ssm_client.get_parameter(\n            Name=f'/payment/{environment_suffix}/config'\n        )\n        \n        return {\n            'statusCode': 200,\n            'body': json.dumps({\n                'message': 'Payment processed successfully',\n                'transactionId': context.request_id\n            })\n        }\n    except ClientError as e:\n        print(f'Error: {e}')\n        return {\n            'statusCode': 500,\n            'body': json.dumps({'error': 'Payment processing failed'})\n        }\n"
        },
        "Environment": {
          "Variables": {
            "DB_SECRET_ARN": {
              "Ref": "DBSecretArn"
            },
            "DB_ENDPOINT": {
              "Ref": "DBClusterEndpoint"
            },
            "ENVIRONMENT_SUFFIX": {
              "Ref": "EnvironmentSuffix"
            },
            "QUEUE_URL": {
              "Ref": "TransactionQueue"
            }
          }
        },
        "VpcConfig": {
          "SecurityGroupIds": [
            {
              "Fn::ImportValue": {
                "Fn::Sub": "${AWS::StackName}-LambdaSecurityGroupId"
              }
            }
          ],
          "SubnetIds": {
            "Ref": "PrivateSubnetIds"
          }
        },
        "Timeout": 60,
        "MemorySize": 512,
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "payment-processor-${EnvironmentSuffix}"
            }
          }
        ]
      }
    },
    "LambdaErrorAlarm": {
      "Type": "AWS::CloudWatch::Alarm",
      "Properties": {
        "AlarmName": {
          "Fn::Sub": "payment-lambda-errors-${EnvironmentSuffix}"
        },
        "AlarmDescription": "Alert when Lambda errors exceed threshold",
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
              "Ref": "PaymentProcessorFunction"
            }
          }
        ]
      }
    },
    "ApiGatewayRole": {
      "Type": "AWS::IAM::Role",
      "Properties": {
        "RoleName": {
          "Fn::Sub": "payment-api-gateway-role-${EnvironmentSuffix}"
        },
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
        "Policies": [
          {
            "PolicyName": "InvokeLambda",
            "PolicyDocument": {
              "Version": "2012-10-17",
              "Statement": [
                {
                  "Effect": "Allow",
                  "Action": "lambda:InvokeFunction",
                  "Resource": {
                    "Fn::GetAtt": ["PaymentProcessorFunction", "Arn"]
                  }
                }
              ]
            }
          }
        ]
      }
    },
    "RestApi": {
      "Type": "AWS::ApiGateway::RestApi",
      "Properties": {
        "Name": {
          "Fn::Sub": "payment-api-${EnvironmentSuffix}"
        },
        "Description": "Payment processing API",
        "EndpointConfiguration": {
          "Types": ["REGIONAL"]
        }
      }
    },
    "ApiKey": {
      "Type": "AWS::ApiGateway::ApiKey",
      "Properties": {
        "Name": {
          "Fn::Sub": "payment-api-key-${EnvironmentSuffix}"
        },
        "Enabled": true
      }
    },
    "UsagePlan": {
      "Type": "AWS::ApiGateway::UsagePlan",
      "DependsOn": "ApiDeployment",
      "Properties": {
        "UsagePlanName": {
          "Fn::Sub": "payment-usage-plan-${EnvironmentSuffix}"
        },
        "ApiStages": [
          {
            "ApiId": {
              "Ref": "RestApi"
            },
            "Stage": "prod"
          }
        ],
        "Throttle": {
          "BurstLimit": 200,
          "RateLimit": 100
        }
      }
    },
    "UsagePlanKey": {
      "Type": "AWS::ApiGateway::UsagePlanKey",
      "Properties": {
        "KeyId": {
          "Ref": "ApiKey"
        },
        "KeyType": "API_KEY",
        "UsagePlanId": {
          "Ref": "UsagePlan"
        }
      }
    },
    "PaymentResource": {
      "Type": "AWS::ApiGateway::Resource",
      "Properties": {
        "RestApiId": {
          "Ref": "RestApi"
        },
        "ParentId": {
          "Fn::GetAtt": ["RestApi", "RootResourceId"]
        },
        "PathPart": "process"
      }
    },
    "PaymentMethod": {
      "Type": "AWS::ApiGateway::Method",
      "Properties": {
        "RestApiId": {
          "Ref": "RestApi"
        },
        "ResourceId": {
          "Ref": "PaymentResource"
        },
        "HttpMethod": "POST",
        "AuthorizationType": "NONE",
        "ApiKeyRequired": true,
        "Integration": {
          "Type": "AWS_PROXY",
          "IntegrationHttpMethod": "POST",
          "Uri": {
            "Fn::Sub": "arn:aws:apigateway:${AWS::Region}:lambda:path/2015-03-31/functions/${PaymentProcessorFunction.Arn}/invocations"
          },
          "Credentials": {
            "Fn::GetAtt": ["ApiGatewayRole", "Arn"]
          }
        }
      }
    },
    "ApiDeployment": {
      "Type": "AWS::ApiGateway::Deployment",
      "DependsOn": "PaymentMethod",
      "Properties": {
        "RestApiId": {
          "Ref": "RestApi"
        },
        "StageName": "prod"
      }
    },
    "ConfigParameter": {
      "Type": "AWS::SSM::Parameter",
      "Properties": {
        "Name": {
          "Fn::Sub": "/payment/${EnvironmentSuffix}/config"
        },
        "Type": "String",
        "Value": "{\"processingTimeout\":30,\"retryAttempts\":3}",
        "Description": "Payment processing configuration",
        "Tags": {
          "Environment": {
            "Ref": "EnvironmentSuffix"
          }
        }
      }
    }
  },
  "Outputs": {
    "APIEndpoint": {
      "Description": "API Gateway endpoint URL",
      "Value": {
        "Fn::Sub": "https://${RestApi}.execute-api.${AWS::Region}.amazonaws.com/prod/process"
      }
    },
    "QueueURL": {
      "Description": "Transaction queue URL",
      "Value": {
        "Ref": "TransactionQueue"
      }
    },
    "LambdaFunctionArn": {
      "Description": "Lambda function ARN",
      "Value": {
        "Fn::GetAtt": ["PaymentProcessorFunction", "Arn"]
      }
    }
  }
}
```

## File: parameters/production.json

```json
{
  "Parameters": [
    {
      "ParameterKey": "EnvironmentSuffix",
      "ParameterValue": "prod"
    },
    {
      "ParameterKey": "Environment",
      "ParameterValue": "production"
    },
    {
      "ParameterKey": "VPCStackTemplateURL",
      "ParameterValue": "https://s3.amazonaws.com/your-bucket/vpc-stack.json"
    },
    {
      "ParameterKey": "DatabaseStackTemplateURL",
      "ParameterValue": "https://s3.amazonaws.com/your-bucket/database-stack.json"
    },
    {
      "ParameterKey": "ApplicationStackTemplateURL",
      "ParameterValue": "https://s3.amazonaws.com/your-bucket/application-stack.json"
    },
    {
      "ParameterKey": "DBMasterUsername",
      "ParameterValue": "admin"
    },
    {
      "ParameterKey": "DBMasterPassword",
      "ParameterValue": "CHANGE_ME_SECURE_PASSWORD"
    }
  ]
}
```

## File: parameters/staging.json

```json
{
  "Parameters": [
    {
      "ParameterKey": "EnvironmentSuffix",
      "ParameterValue": "staging"
    },
    {
      "ParameterKey": "Environment",
      "ParameterValue": "staging"
    },
    {
      "ParameterKey": "VPCStackTemplateURL",
      "ParameterValue": "https://s3.amazonaws.com/your-bucket/vpc-stack.json"
    },
    {
      "ParameterKey": "DatabaseStackTemplateURL",
      "ParameterValue": "https://s3.amazonaws.com/your-bucket/database-stack.json"
    },
    {
      "ParameterKey": "ApplicationStackTemplateURL",
      "ParameterValue": "https://s3.amazonaws.com/your-bucket/application-stack.json"
    },
    {
      "ParameterKey": "DBMasterUsername",
      "ParameterValue": "admin"
    },
    {
      "ParameterKey": "DBMasterPassword",
      "ParameterValue": "CHANGE_ME_SECURE_PASSWORD"
    }
  ]
}
```

## Deployment Instructions

1. Upload nested stack templates to S3:
```bash
aws s3 cp lib/vpc-stack.json s3://your-bucket/
aws s3 cp lib/database-stack.json s3://your-bucket/
aws s3 cp lib/application-stack.json s3://your-bucket/
```

2. Deploy staging environment (us-east-2):
```bash
aws cloudformation create-stack \
  --stack-name payment-processing-staging \
  --template-body file://lib/master-stack.json \
  --parameters file://parameters/staging.json \
  --capabilities CAPABILITY_NAMED_IAM \
  --region us-east-2
```

3. Deploy production environment (us-east-1):
```bash
aws cloudformation create-stack \
  --stack-name payment-processing-prod \
  --template-body file://lib/master-stack.json \
  --parameters file://parameters/production.json \
  --capabilities CAPABILITY_NAMED_IAM \
  --region us-east-1
```

4. Monitor deployment:
```bash
aws cloudformation describe-stacks \
  --stack-name payment-processing-prod \
  --query 'Stacks[0].StackStatus'
```