# CloudFormation Nested Stack Solution for Transaction Processing Infrastructure

This solution implements an optimized CloudFormation nested stack architecture that eliminates circular dependencies, enables rapid deployments, and provides multi-region consistency through StackSets.

## Architecture Overview

The solution splits the monolithic template into 4 nested stacks:
1. **NetworkStack** - VPC, subnets, security groups, VPC endpoints
2. **DatabaseStack** - RDS Aurora MySQL cluster with proper deletion policies
3. **ComputeStack** - Lambda functions using ECR container images, SSM parameters
4. **MonitoringStack** - CloudWatch alarms and rollback triggers

## File: lib/TapStack.json

```json
{
  "AWSTemplateFormatVersion": "2010-09-09",
  "Description": "Main CloudFormation template for optimized transaction processing infrastructure with nested stacks",
  "Parameters": {
    "EnvironmentSuffix": {
      "Type": "String",
      "Description": "Unique suffix for resource names to enable multiple deployments",
      "AllowedPattern": "^[a-z0-9-]{3,20}$",
      "ConstraintDescription": "Must be 3-20 lowercase alphanumeric characters or hyphens"
    },
    "Environment": {
      "Type": "String",
      "Description": "Environment type for conditional resource creation",
      "Default": "dev",
      "AllowedValues": ["dev", "staging", "prod"],
      "ConstraintDescription": "Must be dev, staging, or prod"
    },
    "DBMasterUsername": {
      "Type": "String",
      "Description": "Master username for RDS Aurora cluster",
      "Default": "admin",
      "MinLength": "1",
      "MaxLength": "16",
      "AllowedPattern": "^[a-zA-Z][a-zA-Z0-9]*$",
      "ConstraintDescription": "Must begin with a letter and contain only alphanumeric characters"
    },
    "DBMasterPassword": {
      "Type": "String",
      "Description": "Master password for RDS Aurora cluster",
      "NoEcho": true,
      "MinLength": "8",
      "MaxLength": "41",
      "AllowedPattern": "^[a-zA-Z0-9]*$",
      "ConstraintDescription": "Must contain only alphanumeric characters with length 8-41"
    },
    "EnableMultiAZ": {
      "Type": "String",
      "Description": "Enable Multi-AZ deployment for RDS Aurora",
      "Default": "true",
      "AllowedValues": ["true", "false"]
    },
    "LambdaImageUri": {
      "Type": "String",
      "Description": "ECR image URI for Lambda function (placeholder until first build)",
      "Default": ""
    },
    "TemplatesBucketName": {
      "Type": "String",
      "Description": "S3 bucket name where nested stack templates are stored",
      "AllowedPattern": "^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]$",
      "ConstraintDescription": "Must be a valid S3 bucket name"
    }
  },
  "Conditions": {
    "IsProd": {
      "Fn::Equals": [{"Ref": "Environment"}, "prod"]
    },
    "IsMultiAZ": {
      "Fn::Equals": [{"Ref": "EnableMultiAZ"}, "true"]
    }
  },
  "Resources": {
    "NetworkStack": {
      "Type": "AWS::CloudFormation::Stack",
      "Properties": {
        "TemplateURL": {
          "Fn::Sub": "https://${TemplatesBucketName}.s3.amazonaws.com/NetworkStack.json"
        },
        "Parameters": {
          "EnvironmentSuffix": {"Ref": "EnvironmentSuffix"},
          "Environment": {"Ref": "Environment"}
        },
        "TimeoutInMinutes": 10,
        "Tags": [
          {
            "Key": "Name",
            "Value": {"Fn::Sub": "network-stack-${EnvironmentSuffix}"}
          },
          {
            "Key": "Environment",
            "Value": {"Ref": "Environment"}
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
      "DependsOn": "NetworkStack",
      "Properties": {
        "TemplateURL": {
          "Fn::Sub": "https://${TemplatesBucketName}.s3.amazonaws.com/DatabaseStack.json"
        },
        "Parameters": {
          "EnvironmentSuffix": {"Ref": "EnvironmentSuffix"},
          "Environment": {"Ref": "Environment"},
          "DBMasterUsername": {"Ref": "DBMasterUsername"},
          "DBMasterPassword": {"Ref": "DBMasterPassword"},
          "VpcId": {"Fn::GetAtt": ["NetworkStack", "Outputs.VpcId"]},
          "PrivateSubnet1Id": {"Fn::GetAtt": ["NetworkStack", "Outputs.PrivateSubnet1Id"]},
          "PrivateSubnet2Id": {"Fn::GetAtt": ["NetworkStack", "Outputs.PrivateSubnet2Id"]},
          "PrivateSubnet3Id": {"Fn::GetAtt": ["NetworkStack", "Outputs.PrivateSubnet3Id"]},
          "DatabaseSecurityGroupId": {"Fn::GetAtt": ["NetworkStack", "Outputs.DatabaseSecurityGroupId"]},
          "EnableMultiAZ": {"Ref": "EnableMultiAZ"}
        },
        "TimeoutInMinutes": 30,
        "Tags": [
          {
            "Key": "Name",
            "Value": {"Fn::Sub": "database-stack-${EnvironmentSuffix}"}
          },
          {
            "Key": "Environment",
            "Value": {"Ref": "Environment"}
          },
          {
            "Key": "ManagedBy",
            "Value": "CloudFormation"
          }
        ]
      }
    },
    "ComputeStack": {
      "Type": "AWS::CloudFormation::Stack",
      "DependsOn": ["NetworkStack", "DatabaseStack"],
      "Properties": {
        "TemplateURL": {
          "Fn::Sub": "https://${TemplatesBucketName}.s3.amazonaws.com/ComputeStack.json"
        },
        "Parameters": {
          "EnvironmentSuffix": {"Ref": "EnvironmentSuffix"},
          "Environment": {"Ref": "Environment"},
          "VpcId": {"Fn::GetAtt": ["NetworkStack", "Outputs.VpcId"]},
          "PrivateSubnet1Id": {"Fn::GetAtt": ["NetworkStack", "Outputs.PrivateSubnet1Id"]},
          "PrivateSubnet2Id": {"Fn::GetAtt": ["NetworkStack", "Outputs.PrivateSubnet2Id"]},
          "LambdaSecurityGroupId": {"Fn::GetAtt": ["NetworkStack", "Outputs.LambdaSecurityGroupId"]},
          "DBClusterEndpoint": {"Fn::GetAtt": ["DatabaseStack", "Outputs.DBClusterEndpoint"]},
          "DBClusterPort": {"Fn::GetAtt": ["DatabaseStack", "Outputs.DBClusterPort"]},
          "LambdaImageUri": {"Ref": "LambdaImageUri"}
        },
        "TimeoutInMinutes": 15,
        "Tags": [
          {
            "Key": "Name",
            "Value": {"Fn::Sub": "compute-stack-${EnvironmentSuffix}"}
          },
          {
            "Key": "Environment",
            "Value": {"Ref": "Environment"}
          },
          {
            "Key": "ManagedBy",
            "Value": "CloudFormation"
          }
        ]
      }
    },
    "MonitoringStack": {
      "Type": "AWS::CloudFormation::Stack",
      "DependsOn": ["DatabaseStack", "ComputeStack"],
      "Properties": {
        "TemplateURL": {
          "Fn::Sub": "https://${TemplatesBucketName}.s3.amazonaws.com/MonitoringStack.json"
        },
        "Parameters": {
          "EnvironmentSuffix": {"Ref": "EnvironmentSuffix"},
          "Environment": {"Ref": "Environment"},
          "DBClusterId": {"Fn::GetAtt": ["DatabaseStack", "Outputs.DBClusterId"]},
          "ValidatorLambdaName": {"Fn::GetAtt": ["ComputeStack", "Outputs.ValidatorLambdaName"]},
          "MigrationLambdaName": {"Fn::GetAtt": ["ComputeStack", "Outputs.MigrationLambdaName"]}
        },
        "TimeoutInMinutes": 5,
        "Tags": [
          {
            "Key": "Name",
            "Value": {"Fn::Sub": "monitoring-stack-${EnvironmentSuffix}"}
          },
          {
            "Key": "Environment",
            "Value": {"Ref": "Environment"}
          },
          {
            "Key": "ManagedBy",
            "Value": "CloudFormation"
          }
        ]
      }
    },
    "SessionTable": {
      "Type": "AWS::DynamoDB::Table",
      "Properties": {
        "TableName": {"Fn::Sub": "session-table-${EnvironmentSuffix}"},
        "BillingMode": "PAY_PER_REQUEST",
        "AttributeDefinitions": [
          {
            "AttributeName": "sessionId",
            "AttributeType": "S"
          },
          {
            "AttributeName": "userId",
            "AttributeType": "S"
          }
        ],
        "KeySchema": [
          {
            "AttributeName": "sessionId",
            "KeyType": "HASH"
          }
        ],
        "GlobalSecondaryIndexes": [
          {
            "IndexName": "UserIdIndex",
            "KeySchema": [
              {
                "AttributeName": "userId",
                "KeyType": "HASH"
              }
            ],
            "Projection": {
              "ProjectionType": "ALL"
            }
          }
        ],
        "TimeToLiveSpecification": {
          "Enabled": true,
          "AttributeName": "ttl"
        },
        "PointInTimeRecoverySpecification": {
          "PointInTimeRecoveryEnabled": {"Fn::If": ["IsProd", true, false]}
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": {"Fn::Sub": "session-table-${EnvironmentSuffix}"}
          },
          {
            "Key": "Environment",
            "Value": {"Ref": "Environment"}
          }
        ]
      },
      "DeletionPolicy": "Delete"
    },
    "AuditLogsBucket": {
      "Type": "AWS::S3::Bucket",
      "Properties": {
        "BucketName": {"Fn::Sub": "audit-logs-${EnvironmentSuffix}"},
        "VersioningConfiguration": {
          "Status": "Enabled"
        },
        "LifecycleConfiguration": {
          "Rules": [
            {
              "Id": "DeleteOldVersions",
              "Status": "Enabled",
              "NoncurrentVersionExpirationInDays": 90
            },
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
        "ReplicationConfiguration": {
          "Fn::If": [
            "IsProd",
            {
              "Role": {"Fn::GetAtt": ["S3ReplicationRole", "Arn"]},
              "Rules": [
                {
                  "Id": "ReplicateToSecondaryRegion",
                  "Status": "Enabled",
                  "Priority": 1,
                  "Filter": {
                    "Prefix": ""
                  },
                  "Destination": {
                    "Bucket": {"Fn::Sub": "arn:aws:s3:::audit-logs-${EnvironmentSuffix}-replica"},
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
            },
            {"Ref": "AWS::NoValue"}
          ]
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": {"Fn::Sub": "audit-logs-${EnvironmentSuffix}"}
          },
          {
            "Key": "Environment",
            "Value": {"Ref": "Environment"}
          }
        ]
      },
      "DeletionPolicy": "Delete"
    },
    "S3ReplicationRole": {
      "Type": "AWS::IAM::Role",
      "Condition": "IsProd",
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
        "ManagedPolicyArns": [
          "arn:aws:iam::aws:policy/AmazonS3FullAccess"
        ],
        "Tags": [
          {
            "Key": "Name",
            "Value": {"Fn::Sub": "s3-replication-role-${EnvironmentSuffix}"}
          }
        ]
      }
    }
  },
  "Outputs": {
    "StackName": {
      "Description": "Name of the CloudFormation stack",
      "Value": {"Ref": "AWS::StackName"},
      "Export": {
        "Name": {"Fn::Sub": "${AWS::StackName}-StackName"}
      }
    },
    "VpcId": {
      "Description": "VPC ID from NetworkStack",
      "Value": {"Fn::GetAtt": ["NetworkStack", "Outputs.VpcId"]},
      "Export": {
        "Name": {"Fn::Sub": "${AWS::StackName}-VpcId"}
      }
    },
    "DBClusterEndpoint": {
      "Description": "RDS Aurora cluster endpoint from DatabaseStack",
      "Value": {"Fn::GetAtt": ["DatabaseStack", "Outputs.DBClusterEndpoint"]},
      "Export": {
        "Name": {"Fn::Sub": "${AWS::StackName}-DBClusterEndpoint"}
      }
    },
    "ValidatorLambdaArn": {
      "Description": "ARN of the transaction validator Lambda function",
      "Value": {"Fn::GetAtt": ["ComputeStack", "Outputs.ValidatorLambdaArn"]},
      "Export": {
        "Name": {"Fn::Sub": "${AWS::StackName}-ValidatorLambdaArn"}
      }
    },
    "SessionTableName": {
      "Description": "DynamoDB session table name",
      "Value": {"Ref": "SessionTable"},
      "Export": {
        "Name": {"Fn::Sub": "${AWS::StackName}-SessionTableName"}
      }
    },
    "AuditLogsBucketName": {
      "Description": "S3 bucket name for audit logs",
      "Value": {"Ref": "AuditLogsBucket"},
      "Export": {
        "Name": {"Fn::Sub": "${AWS::StackName}-AuditLogsBucketName"}
      }
    },
    "AuditLogsBucketArn": {
      "Description": "S3 bucket ARN for audit logs",
      "Value": {"Fn::GetAtt": ["AuditLogsBucket", "Arn"]},
      "Export": {
        "Name": {"Fn::Sub": "${AWS::StackName}-AuditLogsBucketArn"}
      }
    }
  }
}
```

## File: lib/NetworkStack.json

```json
{
  "AWSTemplateFormatVersion": "2010-09-09",
  "Description": "Network stack for VPC, subnets, security groups, and VPC endpoints",
  "Parameters": {
    "EnvironmentSuffix": {
      "Type": "String",
      "Description": "Unique suffix for resource names"
    },
    "Environment": {
      "Type": "String",
      "Description": "Environment type"
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
            "Value": {"Fn::Sub": "vpc-${EnvironmentSuffix}"}
          },
          {
            "Key": "Environment",
            "Value": {"Ref": "Environment"}
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
            "Value": {"Fn::Sub": "igw-${EnvironmentSuffix}"}
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
        "AvailabilityZone": {
          "Fn::Select": [0, {"Fn::GetAZs": ""}]
        },
        "MapPublicIpOnLaunch": true,
        "Tags": [
          {
            "Key": "Name",
            "Value": {"Fn::Sub": "public-subnet-1-${EnvironmentSuffix}"}
          },
          {
            "Key": "Type",
            "Value": "Public"
          }
        ]
      }
    },
    "PublicSubnet2": {
      "Type": "AWS::EC2::Subnet",
      "Properties": {
        "VpcId": {"Ref": "VPC"},
        "CidrBlock": "10.0.2.0/24",
        "AvailabilityZone": {
          "Fn::Select": [1, {"Fn::GetAZs": ""}]
        },
        "MapPublicIpOnLaunch": true,
        "Tags": [
          {
            "Key": "Name",
            "Value": {"Fn::Sub": "public-subnet-2-${EnvironmentSuffix}"}
          },
          {
            "Key": "Type",
            "Value": "Public"
          }
        ]
      }
    },
    "PublicSubnet3": {
      "Type": "AWS::EC2::Subnet",
      "Properties": {
        "VpcId": {"Ref": "VPC"},
        "CidrBlock": "10.0.3.0/24",
        "AvailabilityZone": {
          "Fn::Select": [2, {"Fn::GetAZs": ""}]
        },
        "MapPublicIpOnLaunch": true,
        "Tags": [
          {
            "Key": "Name",
            "Value": {"Fn::Sub": "public-subnet-3-${EnvironmentSuffix}"}
          },
          {
            "Key": "Type",
            "Value": "Public"
          }
        ]
      }
    },
    "PrivateSubnet1": {
      "Type": "AWS::EC2::Subnet",
      "Properties": {
        "VpcId": {"Ref": "VPC"},
        "CidrBlock": "10.0.11.0/24",
        "AvailabilityZone": {
          "Fn::Select": [0, {"Fn::GetAZs": ""}]
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": {"Fn::Sub": "private-subnet-1-${EnvironmentSuffix}"}
          },
          {
            "Key": "Type",
            "Value": "Private"
          }
        ]
      }
    },
    "PrivateSubnet2": {
      "Type": "AWS::EC2::Subnet",
      "Properties": {
        "VpcId": {"Ref": "VPC"},
        "CidrBlock": "10.0.12.0/24",
        "AvailabilityZone": {
          "Fn::Select": [1, {"Fn::GetAZs": ""}]
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": {"Fn::Sub": "private-subnet-2-${EnvironmentSuffix}"}
          },
          {
            "Key": "Type",
            "Value": "Private"
          }
        ]
      }
    },
    "PrivateSubnet3": {
      "Type": "AWS::EC2::Subnet",
      "Properties": {
        "VpcId": {"Ref": "VPC"},
        "CidrBlock": "10.0.13.0/24",
        "AvailabilityZone": {
          "Fn::Select": [2, {"Fn::GetAZs": ""}]
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": {"Fn::Sub": "private-subnet-3-${EnvironmentSuffix}"}
          },
          {
            "Key": "Type",
            "Value": "Private"
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
            "Value": {"Fn::Sub": "public-rt-${EnvironmentSuffix}"}
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
    "PublicSubnet1RouteTableAssociation": {
      "Type": "AWS::EC2::SubnetRouteTableAssociation",
      "Properties": {
        "SubnetId": {"Ref": "PublicSubnet1"},
        "RouteTableId": {"Ref": "PublicRouteTable"}
      }
    },
    "PublicSubnet2RouteTableAssociation": {
      "Type": "AWS::EC2::SubnetRouteTableAssociation",
      "Properties": {
        "SubnetId": {"Ref": "PublicSubnet2"},
        "RouteTableId": {"Ref": "PublicRouteTable"}
      }
    },
    "PublicSubnet3RouteTableAssociation": {
      "Type": "AWS::EC2::SubnetRouteTableAssociation",
      "Properties": {
        "SubnetId": {"Ref": "PublicSubnet3"},
        "RouteTableId": {"Ref": "PublicRouteTable"}
      }
    },
    "PrivateRouteTable": {
      "Type": "AWS::EC2::RouteTable",
      "Properties": {
        "VpcId": {"Ref": "VPC"},
        "Tags": [
          {
            "Key": "Name",
            "Value": {"Fn::Sub": "private-rt-${EnvironmentSuffix}"}
          }
        ]
      }
    },
    "PrivateSubnet1RouteTableAssociation": {
      "Type": "AWS::EC2::SubnetRouteTableAssociation",
      "Properties": {
        "SubnetId": {"Ref": "PrivateSubnet1"},
        "RouteTableId": {"Ref": "PrivateRouteTable"}
      }
    },
    "PrivateSubnet2RouteTableAssociation": {
      "Type": "AWS::EC2::SubnetRouteTableAssociation",
      "Properties": {
        "SubnetId": {"Ref": "PrivateSubnet2"},
        "RouteTableId": {"Ref": "PrivateRouteTable"}
      }
    },
    "PrivateSubnet3RouteTableAssociation": {
      "Type": "AWS::EC2::SubnetRouteTableAssociation",
      "Properties": {
        "SubnetId": {"Ref": "PrivateSubnet3"},
        "RouteTableId": {"Ref": "PrivateRouteTable"}
      }
    },
    "DatabaseSecurityGroup": {
      "Type": "AWS::EC2::SecurityGroup",
      "Properties": {
        "GroupName": {"Fn::Sub": "db-sg-${EnvironmentSuffix}"},
        "GroupDescription": "Security group for RDS Aurora database",
        "VpcId": {"Ref": "VPC"},
        "SecurityGroupIngress": [
          {
            "IpProtocol": "tcp",
            "FromPort": 3306,
            "ToPort": 3306,
            "SourceSecurityGroupId": {"Ref": "LambdaSecurityGroup"},
            "Description": "Allow MySQL from Lambda functions"
          }
        ],
        "Tags": [
          {
            "Key": "Name",
            "Value": {"Fn::Sub": "db-sg-${EnvironmentSuffix}"}
          }
        ]
      }
    },
    "LambdaSecurityGroup": {
      "Type": "AWS::EC2::SecurityGroup",
      "Properties": {
        "GroupName": {"Fn::Sub": "lambda-sg-${EnvironmentSuffix}"},
        "GroupDescription": "Security group for Lambda functions",
        "VpcId": {"Ref": "VPC"},
        "SecurityGroupEgress": [
          {
            "IpProtocol": "tcp",
            "FromPort": 3306,
            "ToPort": 3306,
            "DestinationSecurityGroupId": {"Ref": "DatabaseSecurityGroup"},
            "Description": "Allow MySQL to RDS Aurora"
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
            "Value": {"Fn::Sub": "lambda-sg-${EnvironmentSuffix}"}
          }
        ]
      }
    },
    "S3VPCEndpoint": {
      "Type": "AWS::EC2::VPCEndpoint",
      "Properties": {
        "VpcEndpointType": "Gateway",
        "VpcId": {"Ref": "VPC"},
        "ServiceName": {"Fn::Sub": "com.amazonaws.${AWS::Region}.s3"},
        "RouteTableIds": [
          {"Ref": "PrivateRouteTable"},
          {"Ref": "PublicRouteTable"}
        ]
      }
    },
    "DynamoDBVPCEndpoint": {
      "Type": "AWS::EC2::VPCEndpoint",
      "Properties": {
        "VpcEndpointType": "Gateway",
        "VpcId": {"Ref": "VPC"},
        "ServiceName": {"Fn::Sub": "com.amazonaws.${AWS::Region}.dynamodb"},
        "RouteTableIds": [
          {"Ref": "PrivateRouteTable"},
          {"Ref": "PublicRouteTable"}
        ]
      }
    },
    "ECRVPCEndpoint": {
      "Type": "AWS::EC2::VPCEndpoint",
      "Properties": {
        "VpcEndpointType": "Interface",
        "VpcId": {"Ref": "VPC"},
        "ServiceName": {"Fn::Sub": "com.amazonaws.${AWS::Region}.ecr.dkr"},
        "SubnetIds": [
          {"Ref": "PrivateSubnet1"},
          {"Ref": "PrivateSubnet2"},
          {"Ref": "PrivateSubnet3"}
        ],
        "SecurityGroupIds": [
          {"Ref": "LambdaSecurityGroup"}
        ],
        "PrivateDnsEnabled": true
      }
    },
    "ECRAPIVPCEndpoint": {
      "Type": "AWS::EC2::VPCEndpoint",
      "Properties": {
        "VpcEndpointType": "Interface",
        "VpcId": {"Ref": "VPC"},
        "ServiceName": {"Fn::Sub": "com.amazonaws.${AWS::Region}.ecr.api"},
        "SubnetIds": [
          {"Ref": "PrivateSubnet1"},
          {"Ref": "PrivateSubnet2"},
          {"Ref": "PrivateSubnet3"}
        ],
        "SecurityGroupIds": [
          {"Ref": "LambdaSecurityGroup"}
        ],
        "PrivateDnsEnabled": true
      }
    }
  },
  "Outputs": {
    "VpcId": {
      "Description": "VPC ID",
      "Value": {"Ref": "VPC"},
      "Export": {
        "Name": {"Fn::Sub": "${AWS::StackName}-VpcId"}
      }
    },
    "PublicSubnet1Id": {
      "Description": "Public Subnet 1 ID",
      "Value": {"Ref": "PublicSubnet1"},
      "Export": {
        "Name": {"Fn::Sub": "${AWS::StackName}-PublicSubnet1Id"}
      }
    },
    "PublicSubnet2Id": {
      "Description": "Public Subnet 2 ID",
      "Value": {"Ref": "PublicSubnet2"},
      "Export": {
        "Name": {"Fn::Sub": "${AWS::StackName}-PublicSubnet2Id"}
      }
    },
    "PublicSubnet3Id": {
      "Description": "Public Subnet 3 ID",
      "Value": {"Ref": "PublicSubnet3"},
      "Export": {
        "Name": {"Fn::Sub": "${AWS::StackName}-PublicSubnet3Id"}
      }
    },
    "PrivateSubnet1Id": {
      "Description": "Private Subnet 1 ID",
      "Value": {"Ref": "PrivateSubnet1"},
      "Export": {
        "Name": {"Fn::Sub": "${AWS::StackName}-PrivateSubnet1Id"}
      }
    },
    "PrivateSubnet2Id": {
      "Description": "Private Subnet 2 ID",
      "Value": {"Ref": "PrivateSubnet2"},
      "Export": {
        "Name": {"Fn::Sub": "${AWS::StackName}-PrivateSubnet2Id"}
      }
    },
    "PrivateSubnet3Id": {
      "Description": "Private Subnet 3 ID",
      "Value": {"Ref": "PrivateSubnet3"},
      "Export": {
        "Name": {"Fn::Sub": "${AWS::StackName}-PrivateSubnet3Id"}
      }
    },
    "DatabaseSecurityGroupId": {
      "Description": "Security Group ID for RDS Aurora",
      "Value": {"Ref": "DatabaseSecurityGroup"},
      "Export": {
        "Name": {"Fn::Sub": "${AWS::StackName}-DatabaseSecurityGroupId"}
      }
    },
    "LambdaSecurityGroupId": {
      "Description": "Security Group ID for Lambda functions",
      "Value": {"Ref": "LambdaSecurityGroup"},
      "Export": {
        "Name": {"Fn::Sub": "${AWS::StackName}-LambdaSecurityGroupId"}
      }
    }
  }
}
```

## File: lib/DatabaseStack.json

```json
{
  "AWSTemplateFormatVersion": "2010-09-09",
  "Description": "Database stack for RDS Aurora MySQL cluster",
  "Parameters": {
    "EnvironmentSuffix": {
      "Type": "String",
      "Description": "Unique suffix for resource names"
    },
    "Environment": {
      "Type": "String",
      "Description": "Environment type"
    },
    "DBMasterUsername": {
      "Type": "String",
      "Description": "Master username for RDS Aurora"
    },
    "DBMasterPassword": {
      "Type": "String",
      "Description": "Master password for RDS Aurora",
      "NoEcho": true
    },
    "VpcId": {
      "Type": "String",
      "Description": "VPC ID from NetworkStack"
    },
    "PrivateSubnet1Id": {
      "Type": "String",
      "Description": "Private Subnet 1 ID"
    },
    "PrivateSubnet2Id": {
      "Type": "String",
      "Description": "Private Subnet 2 ID"
    },
    "PrivateSubnet3Id": {
      "Type": "String",
      "Description": "Private Subnet 3 ID"
    },
    "DatabaseSecurityGroupId": {
      "Type": "String",
      "Description": "Security Group ID for database"
    },
    "EnableMultiAZ": {
      "Type": "String",
      "Description": "Enable Multi-AZ deployment"
    }
  },
  "Conditions": {
    "IsMultiAZ": {
      "Fn::Equals": [{"Ref": "EnableMultiAZ"}, "true"]
    }
  },
  "Resources": {
    "DBSubnetGroup": {
      "Type": "AWS::RDS::DBSubnetGroup",
      "Properties": {
        "DBSubnetGroupName": {"Fn::Sub": "db-subnet-group-${EnvironmentSuffix}"},
        "DBSubnetGroupDescription": "Subnet group for RDS Aurora cluster",
        "SubnetIds": [
          {"Ref": "PrivateSubnet1Id"},
          {"Ref": "PrivateSubnet2Id"},
          {"Ref": "PrivateSubnet3Id"}
        ],
        "Tags": [
          {
            "Key": "Name",
            "Value": {"Fn::Sub": "db-subnet-group-${EnvironmentSuffix}"}
          }
        ]
      }
    },
    "DBClusterParameterGroup": {
      "Type": "AWS::RDS::DBClusterParameterGroup",
      "Properties": {
        "Description": "Custom parameter group for Aurora MySQL cluster",
        "Family": "aurora-mysql8.0",
        "Parameters": {
          "max_connections": "1000",
          "innodb_buffer_pool_size": "{DBInstanceClassMemory*3/4}",
          "character_set_server": "utf8mb4",
          "collation_server": "utf8mb4_unicode_ci"
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": {"Fn::Sub": "db-cluster-param-group-${EnvironmentSuffix}"}
          }
        ]
      }
    },
    "DBCluster": {
      "Type": "AWS::RDS::DBCluster",
      "Properties": {
        "DBClusterIdentifier": {"Fn::Sub": "aurora-cluster-${EnvironmentSuffix}"},
        "Engine": "aurora-mysql",
        "EngineVersion": "8.0.mysql_aurora.3.04.0",
        "MasterUsername": {"Ref": "DBMasterUsername"},
        "MasterUserPassword": {"Ref": "DBMasterPassword"},
        "DatabaseName": "transactions",
        "Port": 3306,
        "DBSubnetGroupName": {"Ref": "DBSubnetGroup"},
        "VpcSecurityGroupIds": [
          {"Ref": "DatabaseSecurityGroupId"}
        ],
        "DBClusterParameterGroupName": {"Ref": "DBClusterParameterGroup"},
        "BackupRetentionPeriod": 7,
        "PreferredBackupWindow": "03:00-04:00",
        "PreferredMaintenanceWindow": "mon:04:00-mon:05:00",
        "EnableCloudwatchLogsExports": ["error", "slowquery", "general"],
        "DeletionProtection": false,
        "StorageEncrypted": true,
        "Tags": [
          {
            "Key": "Name",
            "Value": {"Fn::Sub": "aurora-cluster-${EnvironmentSuffix}"}
          },
          {
            "Key": "Environment",
            "Value": {"Ref": "Environment"}
          }
        ]
      },
      "DeletionPolicy": "Snapshot",
      "UpdateReplacePolicy": "Snapshot"
    },
    "DBInstance1": {
      "Type": "AWS::RDS::DBInstance",
      "Properties": {
        "DBInstanceIdentifier": {"Fn::Sub": "aurora-instance-1-${EnvironmentSuffix}"},
        "DBClusterIdentifier": {"Ref": "DBCluster"},
        "Engine": "aurora-mysql",
        "DBInstanceClass": "db.t3.medium",
        "PubliclyAccessible": false,
        "EnablePerformanceInsights": true,
        "PerformanceInsightsRetentionPeriod": 7,
        "Tags": [
          {
            "Key": "Name",
            "Value": {"Fn::Sub": "aurora-instance-1-${EnvironmentSuffix}"}
          }
        ]
      },
      "DeletionPolicy": "Delete"
    },
    "DBInstance2": {
      "Type": "AWS::RDS::DBInstance",
      "Condition": "IsMultiAZ",
      "Properties": {
        "DBInstanceIdentifier": {"Fn::Sub": "aurora-instance-2-${EnvironmentSuffix}"},
        "DBClusterIdentifier": {"Ref": "DBCluster"},
        "Engine": "aurora-mysql",
        "DBInstanceClass": "db.t3.medium",
        "PubliclyAccessible": false,
        "EnablePerformanceInsights": true,
        "PerformanceInsightsRetentionPeriod": 7,
        "Tags": [
          {
            "Key": "Name",
            "Value": {"Fn::Sub": "aurora-instance-2-${EnvironmentSuffix}"}
          }
        ]
      },
      "DeletionPolicy": "Delete"
    }
  },
  "Outputs": {
    "DBClusterId": {
      "Description": "RDS Aurora Cluster ID",
      "Value": {"Ref": "DBCluster"},
      "Export": {
        "Name": {"Fn::Sub": "${AWS::StackName}-DBClusterId"}
      }
    },
    "DBClusterEndpoint": {
      "Description": "RDS Aurora Cluster Endpoint",
      "Value": {"Fn::GetAtt": ["DBCluster", "Endpoint.Address"]},
      "Export": {
        "Name": {"Fn::Sub": "${AWS::StackName}-DBClusterEndpoint"}
      }
    },
    "DBClusterPort": {
      "Description": "RDS Aurora Cluster Port",
      "Value": {"Fn::GetAtt": ["DBCluster", "Endpoint.Port"]},
      "Export": {
        "Name": {"Fn::Sub": "${AWS::StackName}-DBClusterPort"}
      }
    },
    "DBClusterReadEndpoint": {
      "Description": "RDS Aurora Cluster Read Endpoint",
      "Value": {"Fn::GetAtt": ["DBCluster", "ReadEndpoint.Address"]},
      "Export": {
        "Name": {"Fn::Sub": "${AWS::StackName}-DBClusterReadEndpoint"}
      }
    }
  }
}
```

## File: lib/ComputeStack.json

```json
{
  "AWSTemplateFormatVersion": "2010-09-09",
  "Description": "Compute stack for Lambda functions and ECR repositories",
  "Parameters": {
    "EnvironmentSuffix": {
      "Type": "String",
      "Description": "Unique suffix for resource names"
    },
    "Environment": {
      "Type": "String",
      "Description": "Environment type"
    },
    "VpcId": {
      "Type": "String",
      "Description": "VPC ID from NetworkStack"
    },
    "PrivateSubnet1Id": {
      "Type": "String",
      "Description": "Private Subnet 1 ID"
    },
    "PrivateSubnet2Id": {
      "Type": "String",
      "Description": "Private Subnet 2 ID"
    },
    "LambdaSecurityGroupId": {
      "Type": "String",
      "Description": "Security Group ID for Lambda"
    },
    "DBClusterEndpoint": {
      "Type": "String",
      "Description": "RDS Aurora cluster endpoint"
    },
    "DBClusterPort": {
      "Type": "String",
      "Description": "RDS Aurora cluster port"
    },
    "LambdaImageUri": {
      "Type": "String",
      "Description": "ECR image URI for Lambda function"
    }
  },
  "Conditions": {
    "HasLambdaImage": {
      "Fn::Not": [{"Fn::Equals": [{"Ref": "LambdaImageUri"}, ""]}]
    }
  },
  "Resources": {
    "ValidatorECRRepository": {
      "Type": "AWS::ECR::Repository",
      "Properties": {
        "RepositoryName": {"Fn::Sub": "transaction-validator-${EnvironmentSuffix}"},
        "ImageScanningConfiguration": {
          "ScanOnPush": true
        },
        "LifecyclePolicy": {
          "LifecyclePolicyText": "{\"rules\":[{\"rulePriority\":1,\"description\":\"Keep last 10 images\",\"selection\":{\"tagStatus\":\"any\",\"countType\":\"imageCountMoreThan\",\"countNumber\":10},\"action\":{\"type\":\"expire\"}}]}"
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": {"Fn::Sub": "transaction-validator-${EnvironmentSuffix}"}
          }
        ]
      },
      "DeletionPolicy": "Delete"
    },
    "MigrationECRRepository": {
      "Type": "AWS::ECR::Repository",
      "Properties": {
        "RepositoryName": {"Fn::Sub": "db-migration-${EnvironmentSuffix}"},
        "ImageScanningConfiguration": {
          "ScanOnPush": true
        },
        "LifecyclePolicy": {
          "LifecyclePolicyText": "{\"rules\":[{\"rulePriority\":1,\"description\":\"Keep last 5 images\",\"selection\":{\"tagStatus\":\"any\",\"countType\":\"imageCountMoreThan\",\"countNumber\":5},\"action\":{\"type\":\"expire\"}}]}"
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": {"Fn::Sub": "db-migration-${EnvironmentSuffix}"}
          }
        ]
      },
      "DeletionPolicy": "Delete"
    },
    "DBEndpointParameter": {
      "Type": "AWS::SSM::Parameter",
      "Properties": {
        "Name": {"Fn::Sub": "/transaction-processing/${EnvironmentSuffix}/db-endpoint"},
        "Type": "String",
        "Value": {"Ref": "DBClusterEndpoint"},
        "Description": "RDS Aurora cluster endpoint for Lambda functions",
        "Tags": {
          "Name": {"Fn::Sub": "db-endpoint-param-${EnvironmentSuffix}"},
          "Environment": {"Ref": "Environment"}
        }
      }
    },
    "DBPortParameter": {
      "Type": "AWS::SSM::Parameter",
      "Properties": {
        "Name": {"Fn::Sub": "/transaction-processing/${EnvironmentSuffix}/db-port"},
        "Type": "String",
        "Value": {"Ref": "DBClusterPort"},
        "Description": "RDS Aurora cluster port for Lambda functions",
        "Tags": {
          "Name": {"Fn::Sub": "db-port-param-${EnvironmentSuffix}"},
          "Environment": {"Ref": "Environment"}
        }
      }
    },
    "LambdaExecutionRole": {
      "Type": "AWS::IAM::Role",
      "Properties": {
        "RoleName": {"Fn::Sub": "lambda-execution-role-${EnvironmentSuffix}"},
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
          "arn:aws:iam::aws:policy/AWSXRayDaemonWriteAccess"
        ],
        "Policies": [
          {
            "PolicyName": "SSMParameterAccess",
            "PolicyDocument": {
              "Version": "2012-10-17",
              "Statement": [
                {
                  "Effect": "Allow",
                  "Action": [
                    "ssm:GetParameter",
                    "ssm:GetParameters"
                  ],
                  "Resource": [
                    {"Fn::Sub": "arn:aws:ssm:${AWS::Region}:${AWS::AccountId}:parameter/transaction-processing/${EnvironmentSuffix}/*"}
                  ]
                }
              ]
            }
          },
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
                  "Resource": [
                    {"Fn::Sub": "arn:aws:dynamodb:${AWS::Region}:${AWS::AccountId}:table/session-table-${EnvironmentSuffix}"}
                  ]
                }
              ]
            }
          },
          {
            "PolicyName": "S3AuditAccess",
            "PolicyDocument": {
              "Version": "2012-10-17",
              "Statement": [
                {
                  "Effect": "Allow",
                  "Action": [
                    "s3:PutObject",
                    "s3:GetObject"
                  ],
                  "Resource": [
                    {"Fn::Sub": "arn:aws:s3:::audit-logs-${EnvironmentSuffix}/*"}
                  ]
                }
              ]
            }
          }
        ],
        "Tags": [
          {
            "Key": "Name",
            "Value": {"Fn::Sub": "lambda-execution-role-${EnvironmentSuffix}"}
          }
        ]
      }
    },
    "ValidatorLambdaFunction": {
      "Type": "AWS::Lambda::Function",
      "Condition": "HasLambdaImage",
      "Properties": {
        "FunctionName": {"Fn::Sub": "transaction-validator-${EnvironmentSuffix}"},
        "PackageType": "Image",
        "Code": {
          "ImageUri": {"Ref": "LambdaImageUri"}
        },
        "Role": {"Fn::GetAtt": ["LambdaExecutionRole", "Arn"]},
        "Timeout": 30,
        "MemorySize": 512,
        "Environment": {
          "Variables": {
            "ENVIRONMENT": {"Ref": "Environment"},
            "ENVIRONMENT_SUFFIX": {"Ref": "EnvironmentSuffix"},
            "DB_ENDPOINT_PARAM": {"Fn::Sub": "/transaction-processing/${EnvironmentSuffix}/db-endpoint"},
            "DB_PORT_PARAM": {"Fn::Sub": "/transaction-processing/${EnvironmentSuffix}/db-port"},
            "SESSION_TABLE": {"Fn::Sub": "session-table-${EnvironmentSuffix}"},
            "AUDIT_BUCKET": {"Fn::Sub": "audit-logs-${EnvironmentSuffix}"}
          }
        },
        "VpcConfig": {
          "SecurityGroupIds": [{"Ref": "LambdaSecurityGroupId"}],
          "SubnetIds": [
            {"Ref": "PrivateSubnet1Id"},
            {"Ref": "PrivateSubnet2Id"}
          ]
        },
        "TracingConfig": {
          "Mode": "Active"
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": {"Fn::Sub": "transaction-validator-${EnvironmentSuffix}"}
          },
          {
            "Key": "Environment",
            "Value": {"Ref": "Environment"}
          }
        ]
      },
      "DependsOn": ["DBEndpointParameter", "DBPortParameter"]
    },
    "MigrationLambdaRole": {
      "Type": "AWS::IAM::Role",
      "Properties": {
        "RoleName": {"Fn::Sub": "migration-lambda-role-${EnvironmentSuffix}"},
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
            "PolicyName": "SSMParameterAccess",
            "PolicyDocument": {
              "Version": "2012-10-17",
              "Statement": [
                {
                  "Effect": "Allow",
                  "Action": [
                    "ssm:GetParameter"
                  ],
                  "Resource": [
                    {"Fn::Sub": "arn:aws:ssm:${AWS::Region}:${AWS::AccountId}:parameter/transaction-processing/${EnvironmentSuffix}/*"}
                  ]
                }
              ]
            }
          }
        ],
        "Tags": [
          {
            "Key": "Name",
            "Value": {"Fn::Sub": "migration-lambda-role-${EnvironmentSuffix}"}
          }
        ]
      }
    },
    "MigrationLambdaFunction": {
      "Type": "AWS::Lambda::Function",
      "Condition": "HasLambdaImage",
      "Properties": {
        "FunctionName": {"Fn::Sub": "db-migration-${EnvironmentSuffix}"},
        "PackageType": "Image",
        "Code": {
          "ImageUri": {"Ref": "LambdaImageUri"}
        },
        "Role": {"Fn::GetAtt": ["MigrationLambdaRole", "Arn"]},
        "Timeout": 300,
        "MemorySize": 256,
        "Environment": {
          "Variables": {
            "ENVIRONMENT": {"Ref": "Environment"},
            "ENVIRONMENT_SUFFIX": {"Ref": "EnvironmentSuffix"},
            "DB_ENDPOINT_PARAM": {"Fn::Sub": "/transaction-processing/${EnvironmentSuffix}/db-endpoint"},
            "DB_PORT_PARAM": {"Fn::Sub": "/transaction-processing/${EnvironmentSuffix}/db-port"}
          }
        },
        "VpcConfig": {
          "SecurityGroupIds": [{"Ref": "LambdaSecurityGroupId"}],
          "SubnetIds": [
            {"Ref": "PrivateSubnet1Id"},
            {"Ref": "PrivateSubnet2Id"}
          ]
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": {"Fn::Sub": "db-migration-${EnvironmentSuffix}"}
          },
          {
            "Key": "Environment",
            "Value": {"Ref": "Environment"}
          }
        ]
      },
      "DependsOn": ["DBEndpointParameter", "DBPortParameter"]
    },
    "DBMigrationCustomResource": {
      "Type": "Custom::DBMigration",
      "Condition": "HasLambdaImage",
      "Properties": {
        "ServiceToken": {"Fn::GetAtt": ["MigrationLambdaFunction", "Arn"]},
        "DBEndpoint": {"Ref": "DBClusterEndpoint"},
        "DBPort": {"Ref": "DBClusterPort"},
        "Version": "1.0.0"
      }
    }
  },
  "Outputs": {
    "ValidatorECRRepositoryUri": {
      "Description": "ECR repository URI for transaction validator",
      "Value": {"Fn::GetAtt": ["ValidatorECRRepository", "RepositoryUri"]},
      "Export": {
        "Name": {"Fn::Sub": "${AWS::StackName}-ValidatorECRRepositoryUri"}
      }
    },
    "MigrationECRRepositoryUri": {
      "Description": "ECR repository URI for database migration",
      "Value": {"Fn::GetAtt": ["MigrationECRRepository", "RepositoryUri"]},
      "Export": {
        "Name": {"Fn::Sub": "${AWS::StackName}-MigrationECRRepositoryUri"}
      }
    },
    "ValidatorLambdaArn": {
      "Description": "ARN of transaction validator Lambda function",
      "Value": {
        "Fn::If": [
          "HasLambdaImage",
          {"Fn::GetAtt": ["ValidatorLambdaFunction", "Arn"]},
          "NotCreated"
        ]
      },
      "Export": {
        "Name": {"Fn::Sub": "${AWS::StackName}-ValidatorLambdaArn"}
      }
    },
    "ValidatorLambdaName": {
      "Description": "Name of transaction validator Lambda function",
      "Value": {
        "Fn::If": [
          "HasLambdaImage",
          {"Ref": "ValidatorLambdaFunction"},
          "NotCreated"
        ]
      },
      "Export": {
        "Name": {"Fn::Sub": "${AWS::StackName}-ValidatorLambdaName"}
      }
    },
    "MigrationLambdaArn": {
      "Description": "ARN of database migration Lambda function",
      "Value": {
        "Fn::If": [
          "HasLambdaImage",
          {"Fn::GetAtt": ["MigrationLambdaFunction", "Arn"]},
          "NotCreated"
        ]
      },
      "Export": {
        "Name": {"Fn::Sub": "${AWS::StackName}-MigrationLambdaArn"}
      }
    },
    "MigrationLambdaName": {
      "Description": "Name of database migration Lambda function",
      "Value": {
        "Fn::If": [
          "HasLambdaImage",
          {"Ref": "MigrationLambdaFunction"},
          "NotCreated"
        ]
      },
      "Export": {
        "Name": {"Fn::Sub": "${AWS::StackName}-MigrationLambdaName"}
      }
    },
    "DBEndpointParameterName": {
      "Description": "SSM parameter name for database endpoint",
      "Value": {"Ref": "DBEndpointParameter"},
      "Export": {
        "Name": {"Fn::Sub": "${AWS::StackName}-DBEndpointParameterName"}
      }
    }
  }
}
```

## File: lib/MonitoringStack.json

```json
{
  "AWSTemplateFormatVersion": "2010-09-09",
  "Description": "Monitoring stack for CloudWatch alarms and rollback triggers",
  "Parameters": {
    "EnvironmentSuffix": {
      "Type": "String",
      "Description": "Unique suffix for resource names"
    },
    "Environment": {
      "Type": "String",
      "Description": "Environment type"
    },
    "DBClusterId": {
      "Type": "String",
      "Description": "RDS Aurora cluster ID"
    },
    "ValidatorLambdaName": {
      "Type": "String",
      "Description": "Name of validator Lambda function"
    },
    "MigrationLambdaName": {
      "Type": "String",
      "Description": "Name of migration Lambda function"
    }
  },
  "Conditions": {
    "HasValidatorLambda": {
      "Fn::Not": [{"Fn::Equals": [{"Ref": "ValidatorLambdaName"}, "NotCreated"]}]
    },
    "HasMigrationLambda": {
      "Fn::Not": [{"Fn::Equals": [{"Ref": "MigrationLambdaName"}, "NotCreated"]}]
    }
  },
  "Resources": {
    "AlarmSNSTopic": {
      "Type": "AWS::SNS::Topic",
      "Properties": {
        "TopicName": {"Fn::Sub": "cfn-alarms-${EnvironmentSuffix}"},
        "DisplayName": "CloudFormation Rollback Alarms",
        "Tags": [
          {
            "Key": "Name",
            "Value": {"Fn::Sub": "cfn-alarms-${EnvironmentSuffix}"}
          }
        ]
      }
    },
    "RDSConnectionCountAlarm": {
      "Type": "AWS::CloudWatch::Alarm",
      "Properties": {
        "AlarmName": {"Fn::Sub": "rds-connection-count-${EnvironmentSuffix}"},
        "AlarmDescription": "Trigger rollback if RDS connection count exceeds threshold",
        "MetricName": "DatabaseConnections",
        "Namespace": "AWS/RDS",
        "Statistic": "Average",
        "Period": 60,
        "EvaluationPeriods": 2,
        "Threshold": 800,
        "ComparisonOperator": "GreaterThanThreshold",
        "Dimensions": [
          {
            "Name": "DBClusterIdentifier",
            "Value": {"Ref": "DBClusterId"}
          }
        ],
        "AlarmActions": [
          {"Ref": "AlarmSNSTopic"}
        ],
        "TreatMissingData": "notBreaching"
      }
    },
    "RDSCPUUtilizationAlarm": {
      "Type": "AWS::CloudWatch::Alarm",
      "Properties": {
        "AlarmName": {"Fn::Sub": "rds-cpu-utilization-${EnvironmentSuffix}"},
        "AlarmDescription": "Trigger rollback if RDS CPU utilization is too high",
        "MetricName": "CPUUtilization",
        "Namespace": "AWS/RDS",
        "Statistic": "Average",
        "Period": 300,
        "EvaluationPeriods": 2,
        "Threshold": 85,
        "ComparisonOperator": "GreaterThanThreshold",
        "Dimensions": [
          {
            "Name": "DBClusterIdentifier",
            "Value": {"Ref": "DBClusterId"}
          }
        ],
        "AlarmActions": [
          {"Ref": "AlarmSNSTopic"}
        ],
        "TreatMissingData": "notBreaching"
      }
    },
    "ValidatorLambdaErrorAlarm": {
      "Type": "AWS::CloudWatch::Alarm",
      "Condition": "HasValidatorLambda",
      "Properties": {
        "AlarmName": {"Fn::Sub": "validator-lambda-errors-${EnvironmentSuffix}"},
        "AlarmDescription": "Trigger rollback if validator Lambda error rate is too high",
        "MetricName": "Errors",
        "Namespace": "AWS/Lambda",
        "Statistic": "Sum",
        "Period": 60,
        "EvaluationPeriods": 2,
        "Threshold": 5,
        "ComparisonOperator": "GreaterThanThreshold",
        "Dimensions": [
          {
            "Name": "FunctionName",
            "Value": {"Ref": "ValidatorLambdaName"}
          }
        ],
        "AlarmActions": [
          {"Ref": "AlarmSNSTopic"}
        ],
        "TreatMissingData": "notBreaching"
      }
    },
    "ValidatorLambdaThrottleAlarm": {
      "Type": "AWS::CloudWatch::Alarm",
      "Condition": "HasValidatorLambda",
      "Properties": {
        "AlarmName": {"Fn::Sub": "validator-lambda-throttles-${EnvironmentSuffix}"},
        "AlarmDescription": "Alert when validator Lambda is being throttled",
        "MetricName": "Throttles",
        "Namespace": "AWS/Lambda",
        "Statistic": "Sum",
        "Period": 60,
        "EvaluationPeriods": 1,
        "Threshold": 1,
        "ComparisonOperator": "GreaterThanThreshold",
        "Dimensions": [
          {
            "Name": "FunctionName",
            "Value": {"Ref": "ValidatorLambdaName"}
          }
        ],
        "AlarmActions": [
          {"Ref": "AlarmSNSTopic"}
        ],
        "TreatMissingData": "notBreaching"
      }
    },
    "MigrationLambdaErrorAlarm": {
      "Type": "AWS::CloudWatch::Alarm",
      "Condition": "HasMigrationLambda",
      "Properties": {
        "AlarmName": {"Fn::Sub": "migration-lambda-errors-${EnvironmentSuffix}"},
        "AlarmDescription": "Trigger rollback if migration Lambda fails",
        "MetricName": "Errors",
        "Namespace": "AWS/Lambda",
        "Statistic": "Sum",
        "Period": 60,
        "EvaluationPeriods": 1,
        "Threshold": 1,
        "ComparisonOperator": "GreaterThanThreshold",
        "Dimensions": [
          {
            "Name": "FunctionName",
            "Value": {"Ref": "MigrationLambdaName"}
          }
        ],
        "AlarmActions": [
          {"Ref": "AlarmSNSTopic"}
        ],
        "TreatMissingData": "notBreaching"
      }
    },
    "DashboardDashboard": {
      "Type": "AWS::CloudWatch::Dashboard",
      "Properties": {
        "DashboardName": {"Fn::Sub": "transaction-processing-${EnvironmentSuffix}"},
        "DashboardBody": {
          "Fn::Sub": [
            "{\"widgets\":[{\"type\":\"metric\",\"properties\":{\"metrics\":[[\"AWS/RDS\",\"DatabaseConnections\",{\"stat\":\"Average\",\"label\":\"DB Connections\"}]],\"period\":300,\"stat\":\"Average\",\"region\":\"${AWS::Region}\",\"title\":\"RDS Connections\"}},{\"type\":\"metric\",\"properties\":{\"metrics\":[[\"AWS/Lambda\",\"Errors\",{\"stat\":\"Sum\",\"label\":\"Lambda Errors\"}]],\"period\":300,\"stat\":\"Sum\",\"region\":\"${AWS::Region}\",\"title\":\"Lambda Errors\"}}]}",
            {}
          ]
        }
      }
    }
  },
  "Outputs": {
    "AlarmSNSTopicArn": {
      "Description": "ARN of SNS topic for CloudWatch alarms",
      "Value": {"Ref": "AlarmSNSTopic"},
      "Export": {
        "Name": {"Fn::Sub": "${AWS::StackName}-AlarmSNSTopicArn"}
      }
    },
    "RDSConnectionCountAlarmName": {
      "Description": "Name of RDS connection count alarm",
      "Value": {"Ref": "RDSConnectionCountAlarm"},
      "Export": {
        "Name": {"Fn::Sub": "${AWS::StackName}-RDSConnectionCountAlarmName"}
      }
    },
    "ValidatorLambdaErrorAlarmName": {
      "Description": "Name of validator Lambda error alarm",
      "Value": {
        "Fn::If": [
          "HasValidatorLambda",
          {"Ref": "ValidatorLambdaErrorAlarm"},
          "NotCreated"
        ]
      },
      "Export": {
        "Name": {"Fn::Sub": "${AWS::StackName}-ValidatorLambdaErrorAlarmName"}
      }
    }
  }
}
```

## File: lib/lambda/validator.py

```python
import json
import os
import boto3
import pymysql
from datetime import datetime

# Initialize AWS clients
ssm = boto3.client('ssm')
dynamodb = boto3.resource('dynamodb')
s3 = boto3.client('s3')

# Environment variables
ENVIRONMENT = os.environ.get('ENVIRONMENT', 'dev')
ENVIRONMENT_SUFFIX = os.environ.get('ENVIRONMENT_SUFFIX')
DB_ENDPOINT_PARAM = os.environ.get('DB_ENDPOINT_PARAM')
DB_PORT_PARAM = os.environ.get('DB_PORT_PARAM')
SESSION_TABLE = os.environ.get('SESSION_TABLE')
AUDIT_BUCKET = os.environ.get('AUDIT_BUCKET')

# Cache for database connection
db_connection = None

def get_db_config():
    """Retrieve database configuration from SSM Parameter Store"""
    try:
        db_endpoint = ssm.get_parameter(Name=DB_ENDPOINT_PARAM)['Parameter']['Value']
        db_port = int(ssm.get_parameter(Name=DB_PORT_PARAM)['Parameter']['Value'])

        return {
            'host': db_endpoint,
            'port': db_port,
            'user': os.environ.get('DB_USER', 'admin'),
            'password': os.environ.get('DB_PASSWORD'),
            'database': 'transactions'
        }
    except Exception as e:
        print(f"Error retrieving DB config from SSM: {str(e)}")
        raise

def get_db_connection():
    """Get or create database connection"""
    global db_connection

    if db_connection is None or not db_connection.open:
        db_config = get_db_config()
        db_connection = pymysql.connect(
            host=db_config['host'],
            port=db_config['port'],
            user=db_config['user'],
            password=db_config['password'],
            database=db_config['database'],
            connect_timeout=5
        )

    return db_connection

def validate_transaction(transaction_data):
    """Validate transaction against business rules"""
    required_fields = ['transaction_id', 'amount', 'currency', 'user_id']

    for field in required_fields:
        if field not in transaction_data:
            return False, f"Missing required field: {field}"

    if transaction_data['amount'] <= 0:
        return False, "Transaction amount must be positive"

    if transaction_data['currency'] not in ['USD', 'EUR', 'GBP']:
        return False, "Unsupported currency"

    return True, "Transaction valid"

def store_session(user_id, transaction_id):
    """Store session information in DynamoDB"""
    try:
        table = dynamodb.Table(SESSION_TABLE)
        table.put_item(
            Item={
                'sessionId': transaction_id,
                'userId': user_id,
                'timestamp': int(datetime.utcnow().timestamp()),
                'ttl': int(datetime.utcnow().timestamp()) + 86400  # 24 hours TTL
            }
        )
        return True
    except Exception as e:
        print(f"Error storing session: {str(e)}")
        return False

def write_audit_log(transaction_data, validation_result):
    """Write audit log to S3"""
    try:
        audit_record = {
            'timestamp': datetime.utcnow().isoformat(),
            'transaction_id': transaction_data.get('transaction_id'),
            'user_id': transaction_data.get('user_id'),
            'validation_result': validation_result,
            'environment': ENVIRONMENT
        }

        key = f"audits/{datetime.utcnow().strftime('%Y/%m/%d')}/{transaction_data['transaction_id']}.json"

        s3.put_object(
            Bucket=AUDIT_BUCKET,
            Key=key,
            Body=json.dumps(audit_record),
            ContentType='application/json'
        )
        return True
    except Exception as e:
        print(f"Error writing audit log: {str(e)}")
        return False

def persist_to_database(transaction_data):
    """Persist validated transaction to RDS Aurora"""
    try:
        conn = get_db_connection()
        with conn.cursor() as cursor:
            sql = """
                INSERT INTO transactions (transaction_id, user_id, amount, currency, created_at)
                VALUES (%s, %s, %s, %s, %s)
            """
            cursor.execute(sql, (
                transaction_data['transaction_id'],
                transaction_data['user_id'],
                transaction_data['amount'],
                transaction_data['currency'],
                datetime.utcnow()
            ))
        conn.commit()
        return True
    except Exception as e:
        print(f"Error persisting to database: {str(e)}")
        return False

def lambda_handler(event, context):
    """Main Lambda handler for transaction validation"""
    try:
        # Parse input
        if 'body' in event:
            transaction_data = json.loads(event['body'])
        else:
            transaction_data = event

        print(f"Processing transaction: {transaction_data.get('transaction_id')}")

        # Validate transaction
        is_valid, message = validate_transaction(transaction_data)

        if not is_valid:
            write_audit_log(transaction_data, {'valid': False, 'reason': message})
            return {
                'statusCode': 400,
                'body': json.dumps({
                    'error': message,
                    'transaction_id': transaction_data.get('transaction_id')
                })
            }

        # Store session
        store_session(transaction_data['user_id'], transaction_data['transaction_id'])

        # Persist to database
        if not persist_to_database(transaction_data):
            raise Exception("Failed to persist transaction to database")

        # Write audit log
        write_audit_log(transaction_data, {'valid': True, 'message': 'Transaction processed successfully'})

        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Transaction validated and processed successfully',
                'transaction_id': transaction_data['transaction_id']
            })
        }

    except Exception as e:
        print(f"Error processing transaction: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({
                'error': 'Internal server error',
                'details': str(e)
            })
        }
```

## File: lib/lambda/migration.py

```python
import json
import os
import boto3
import pymysql
import cfnresponse
from datetime import datetime

# Initialize AWS clients
ssm = boto3.client('ssm')

# Environment variables
DB_ENDPOINT_PARAM = os.environ.get('DB_ENDPOINT_PARAM')
DB_PORT_PARAM = os.environ.get('DB_PORT_PARAM')

def get_db_config():
    """Retrieve database configuration from SSM Parameter Store"""
    try:
        db_endpoint = ssm.get_parameter(Name=DB_ENDPOINT_PARAM)['Parameter']['Value']
        db_port = int(ssm.get_parameter(Name=DB_PORT_PARAM)['Parameter']['Value'])

        return {
            'host': db_endpoint,
            'port': db_port,
            'user': os.environ.get('DB_USER', 'admin'),
            'password': os.environ.get('DB_PASSWORD'),
            'database': 'transactions'
        }
    except Exception as e:
        print(f"Error retrieving DB config from SSM: {str(e)}")
        raise

def run_migrations(connection):
    """Run database schema migrations"""
    migrations = [
        """
        CREATE TABLE IF NOT EXISTS transactions (
            id BIGINT AUTO_INCREMENT PRIMARY KEY,
            transaction_id VARCHAR(255) UNIQUE NOT NULL,
            user_id VARCHAR(255) NOT NULL,
            amount DECIMAL(10, 2) NOT NULL,
            currency VARCHAR(3) NOT NULL,
            status VARCHAR(50) DEFAULT 'pending',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_user_id (user_id),
            INDEX idx_transaction_id (transaction_id),
            INDEX idx_created_at (created_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        """,
        """
        CREATE TABLE IF NOT EXISTS migration_history (
            id INT AUTO_INCREMENT PRIMARY KEY,
            version VARCHAR(50) NOT NULL,
            applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE KEY unique_version (version)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        """
    ]

    try:
        with connection.cursor() as cursor:
            for migration in migrations:
                print(f"Executing migration: {migration[:50]}...")
                cursor.execute(migration)

            # Record migration version
            version = os.environ.get('MIGRATION_VERSION', '1.0.0')
            cursor.execute(
                "INSERT IGNORE INTO migration_history (version) VALUES (%s)",
                (version,)
            )

        connection.commit()
        print("Migrations completed successfully")
        return True

    except Exception as e:
        print(f"Error running migrations: {str(e)}")
        connection.rollback()
        raise

def lambda_handler(event, context):
    """Custom resource handler for database migrations"""
    print(f"Received event: {json.dumps(event)}")

    response_status = cfnresponse.SUCCESS
    response_data = {}

    try:
        request_type = event['RequestType']

        if request_type in ['Create', 'Update']:
            # Get database configuration
            db_config = get_db_config()

            # Connect to database
            connection = pymysql.connect(
                host=db_config['host'],
                port=db_config['port'],
                user=db_config['user'],
                password=db_config['password'],
                database=db_config['database'],
                connect_timeout=10
            )

            print("Connected to database successfully")

            # Run migrations
            run_migrations(connection)

            connection.close()

            response_data['Message'] = 'Database migrations completed successfully'

        elif request_type == 'Delete':
            print("Delete request received - no action required")
            response_data['Message'] = 'Delete request processed (no-op)'

    except Exception as e:
        print(f"Error in custom resource handler: {str(e)}")
        response_status = cfnresponse.FAILED
        response_data['Error'] = str(e)

    finally:
        cfnresponse.send(event, context, response_status, response_data)
```

## File: lib/lambda/Dockerfile

```dockerfile
FROM public.ecr.aws/lambda/python:3.11

# Install system dependencies
RUN yum update -y && \
    yum install -y gcc python3-devel mysql-devel && \
    yum clean all

# Copy requirements
COPY requirements.txt ${LAMBDA_TASK_ROOT}/

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy Lambda function code
COPY validator.py ${LAMBDA_TASK_ROOT}/
COPY migration.py ${LAMBDA_TASK_ROOT}/

# Set the Lambda handler
CMD [ "validator.lambda_handler" ]
```

## File: lib/lambda/requirements.txt

```
boto3==1.34.18
pymysql==1.1.0
cfnresponse==1.1.2
```

## File: lib/README.md

```markdown
# Transaction Processing Infrastructure - CloudFormation Nested Stacks

This solution provides an optimized CloudFormation nested stack architecture for a transaction processing system spanning multiple AWS regions.

## Architecture

The infrastructure is split into 4 nested stacks:

1. **NetworkStack** - VPC, subnets, security groups, VPC endpoints
2. **DatabaseStack** - RDS Aurora MySQL cluster with proper deletion policies
3. **ComputeStack** - Lambda functions using ECR container images, SSM parameters
4. **MonitoringStack** - CloudWatch alarms and rollback triggers

## Key Features

- **Circular Dependency Resolution**: Lambda functions read RDS endpoint from SSM Parameter Store instead of direct references
- **Fast Deployments**: Nested stack architecture enables parallel deployment and faster updates
- **Container-based Lambda**: All Lambda functions use ECR container images for faster updates
- **Rollback Protection**: CloudWatch alarms trigger automatic rollback on failure
- **Multi-Region Ready**: Uses CloudFormation StackSets for consistent multi-region deployment
- **Proper Resource Naming**: All resources include environmentSuffix parameter for uniqueness

## Prerequisites

1. AWS CLI configured with appropriate credentials
2. S3 bucket for storing nested stack templates
3. ECR repositories with Lambda container images built
4. Database credentials stored securely

## Deployment

### Step 1: Build and Push Lambda Container Images

```bash
# Build validator Lambda image
cd lib/lambda
docker build -t transaction-validator:latest .

# Tag and push to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <account-id>.dkr.ecr.us-east-1.amazonaws.com
docker tag transaction-validator:latest <account-id>.dkr.ecr.us-east-1.amazonaws.com/transaction-validator-<suffix>:latest
docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/transaction-validator-<suffix>:latest
```

### Step 2: Upload Nested Stack Templates to S3

```bash
# Upload all nested stack templates
aws s3 cp lib/NetworkStack.json s3://<templates-bucket>/NetworkStack.json
aws s3 cp lib/DatabaseStack.json s3://<templates-bucket>/DatabaseStack.json
aws s3 cp lib/ComputeStack.json s3://<templates-bucket>/ComputeStack.json
aws s3 cp lib/MonitoringStack.json s3://<templates-bucket>/MonitoringStack.json
```

### Step 3: Deploy Main Stack

```bash
aws cloudformation create-stack \
  --stack-name transaction-processing-dev \
  --template-body file://lib/TapStack.json \
  --parameters \
    ParameterKey=EnvironmentSuffix,ParameterValue=dev-001 \
    ParameterKey=Environment,ParameterValue=dev \
    ParameterKey=DBMasterUsername,ParameterValue=admin \
    ParameterKey=DBMasterPassword,ParameterValue=<secure-password> \
    ParameterKey=LambdaImageUri,ParameterValue=<ecr-image-uri> \
    ParameterKey=TemplatesBucketName,ParameterValue=<templates-bucket> \
  --capabilities CAPABILITY_NAMED_IAM \
  --region us-east-1
```

### Step 4: Monitor Deployment

```bash
aws cloudformation describe-stacks \
  --stack-name transaction-processing-dev \
  --region us-east-1 \
  --query 'Stacks[0].StackStatus'
```

## Multi-Region Deployment with StackSets

```bash
# Create StackSet
aws cloudformation create-stack-set \
  --stack-set-name transaction-processing-multi-region \
  --template-body file://lib/TapStack.json \
  --capabilities CAPABILITY_NAMED_IAM

# Deploy to multiple regions
aws cloudformation create-stack-instances \
  --stack-set-name transaction-processing-multi-region \
  --accounts <account-id> \
  --regions us-east-1 eu-west-1 \
  --parameter-overrides \
    ParameterKey=EnvironmentSuffix,ParameterValue=prod-001 \
    ParameterKey=Environment,ParameterValue=prod
```

## Testing

The solution includes comprehensive tests in the test/ directory:

```bash
# Run unit tests
npm test

# Run integration tests
npm run test:integration
```

## Cleanup

```bash
# Delete main stack (nested stacks will be deleted automatically)
aws cloudformation delete-stack \
  --stack-name transaction-processing-dev \
  --region us-east-1

# Note: RDS Aurora cluster will create a final snapshot due to DeletionPolicy: Snapshot
```

## Troubleshooting

### Circular Dependency Errors

If you encounter circular dependency errors, ensure that:
- Lambda functions use SSM Parameter Store to read RDS endpoint
- DependsOn attributes are properly configured in nested stacks

### Deployment Timeouts

If deployment exceeds 15 minutes:
- Check CloudWatch Logs for Lambda function errors
- Verify RDS Aurora cluster is not stuck in "creating" state
- Ensure VPC endpoints are properly configured

### Rollback Triggered

If automatic rollback is triggered:
- Check CloudWatch Alarms for breached thresholds
- Review Lambda error logs in CloudWatch Logs
- Verify RDS connection count is within limits

## Monitoring

Access the CloudWatch Dashboard:
- Dashboard Name: `transaction-processing-<environmentSuffix>`
- Metrics: RDS connections, Lambda errors, Lambda throttles

## Security

- All database credentials use NoEcho parameters
- RDS Aurora uses encryption at rest
- S3 buckets have encryption and public access blocked
- Lambda functions use least privilege IAM roles
- Security groups follow least privilege principle
