```json
{
  "AWSTemplateFormatVersion": "2010-09-09",
  "Description": "Production-grade web application infrastructure with high availability, security, and scalability",
  "Parameters": {
    "EnvironmentSuffix": {
      "Type": "String",
      "Default": "prod",
      "Description": "Environment suffix for resource naming to avoid conflicts",
      "AllowedPattern": "^[a-zA-Z0-9]+$",
      "ConstraintDescription": "Must contain only alphanumeric characters"
    },
    "DBUsername": {
      "Type": "String",
      "Default": "admin",
      "Description": "Database administrator username",
      "MinLength": 1,
      "MaxLength": 16,
      "AllowedPattern": "^[a-zA-Z][a-zA-Z0-9]*$"
    },
    "DBPassword": {
      "Type": "String",
      "NoEcho": true,
      "MinLength": 8,
      "MaxLength": 41,
      "Description": "Database administrator password (8-41 characters)",
      "AllowedPattern": "^[a-zA-Z0-9]*$"
    },
    "DomainName": {
      "Type": "String",
      "Description": "Domain name for the application",
      "AllowedPattern": "^[a-zA-Z0-9.-]+$"
    }
  },
  "Resources": {
    "ProductionVPC": {
      "Type": "AWS::EC2::VPC",
      "DeletionPolicy": "Delete",
      "UpdateReplacePolicy": "Delete",
      "Properties": {
        "CidrBlock": "10.0.0.0/16",
        "EnableDnsHostnames": true,
        "EnableDnsSupport": true,
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "Production-VPC-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": "Production"
          }
        ]
      }
    },
    "InternetGateway": {
      "Type": "AWS::EC2::InternetGateway",
      "DeletionPolicy": "Delete",
      "UpdateReplacePolicy": "Delete",
      "Properties": {
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "Production-IGW-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": "Production"
          }
        ]
      }
    },
    "AttachGateway": {
      "Type": "AWS::EC2::VPCGatewayAttachment",
      "Properties": {
        "VpcId": {
          "Ref": "ProductionVPC"
        },
        "InternetGatewayId": {
          "Ref": "InternetGateway"
        }
      }
    },
    "PublicSubnet1": {
      "Type": "AWS::EC2::Subnet",
      "DeletionPolicy": "Delete",
      "UpdateReplacePolicy": "Delete",
      "Properties": {
        "VpcId": {
          "Ref": "ProductionVPC"
        },
        "CidrBlock": "10.0.1.0/24",
        "AvailabilityZone": "us-east-1a",
        "MapPublicIpOnLaunch": true,
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "Public-Subnet-1-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": "Production"
          }
        ]
      }
    },
    "PublicSubnet2": {
      "Type": "AWS::EC2::Subnet",
      "DeletionPolicy": "Delete",
      "UpdateReplacePolicy": "Delete",
      "Properties": {
        "VpcId": {
          "Ref": "ProductionVPC"
        },
        "CidrBlock": "10.0.2.0/24",
        "AvailabilityZone": "us-east-1b",
        "MapPublicIpOnLaunch": true,
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "Public-Subnet-2-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": "Production"
          }
        ]
      }
    },
    "PrivateSubnet1": {
      "Type": "AWS::EC2::Subnet",
      "DeletionPolicy": "Delete",
      "UpdateReplacePolicy": "Delete",
      "Properties": {
        "VpcId": {
          "Ref": "ProductionVPC"
        },
        "CidrBlock": "10.0.3.0/24",
        "AvailabilityZone": "us-east-1a",
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "Private-Subnet-1-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": "Production"
          }
        ]
      }
    },
    "PrivateSubnet2": {
      "Type": "AWS::EC2::Subnet",
      "DeletionPolicy": "Delete",
      "UpdateReplacePolicy": "Delete",
      "Properties": {
        "VpcId": {
          "Ref": "ProductionVPC"
        },
        "CidrBlock": "10.0.4.0/24",
        "AvailabilityZone": "us-east-1b",
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "Private-Subnet-2-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": "Production"
          }
        ]
      }
    },
    "PublicRouteTable": {
      "Type": "AWS::EC2::RouteTable",
      "DeletionPolicy": "Delete",
      "UpdateReplacePolicy": "Delete",
      "Properties": {
        "VpcId": {
          "Ref": "ProductionVPC"
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "Public-Route-Table-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": "Production"
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
    "PublicSubnetRouteTableAssociation1": {
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
    "PublicSubnetRouteTableAssociation2": {
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
    "NATGateway1EIP": {
      "Type": "AWS::EC2::EIP",
      "DependsOn": "AttachGateway",
      "DeletionPolicy": "Delete",
      "UpdateReplacePolicy": "Delete",
      "Properties": {
        "Domain": "vpc",
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "NAT-Gateway-1-EIP-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": "Production"
          }
        ]
      }
    },
    "NATGateway1": {
      "Type": "AWS::EC2::NatGateway",
      "DeletionPolicy": "Delete",
      "UpdateReplacePolicy": "Delete",
      "Properties": {
        "AllocationId": {
          "Fn::GetAtt": [
            "NATGateway1EIP",
            "AllocationId"
          ]
        },
        "SubnetId": {
          "Ref": "PublicSubnet1"
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "NAT-Gateway-1-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": "Production"
          }
        ]
      }
    },
    "PrivateRouteTable1": {
      "Type": "AWS::EC2::RouteTable",
      "DeletionPolicy": "Delete",
      "UpdateReplacePolicy": "Delete",
      "Properties": {
        "VpcId": {
          "Ref": "ProductionVPC"
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "Private-Route-Table-1-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": "Production"
          }
        ]
      }
    },
    "DefaultPrivateRoute1": {
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
    "PrivateSubnetRouteTableAssociation1": {
      "Type": "AWS::EC2::SubnetRouteTableAssociation",
      "Properties": {
        "RouteTableId": {
          "Ref": "PrivateRouteTable1"
        },
        "SubnetId": {
          "Ref": "PrivateSubnet1"
        }
      }
    },
    "PrivateSubnetRouteTableAssociation2": {
      "Type": "AWS::EC2::SubnetRouteTableAssociation",
      "Properties": {
        "RouteTableId": {
          "Ref": "PrivateRouteTable1"
        },
        "SubnetId": {
          "Ref": "PrivateSubnet2"
        }
      }
    },
    "WebServerSecurityGroup": {
      "Type": "AWS::EC2::SecurityGroup",
      "DeletionPolicy": "Delete",
      "UpdateReplacePolicy": "Delete",
      "Properties": {
        "GroupName": {
          "Fn::Sub": "WebServer-SecurityGroup-${EnvironmentSuffix}"
        },
        "GroupDescription": "Security group for web servers - only HTTPS allowed",
        "VpcId": {
          "Ref": "ProductionVPC"
        },
        "SecurityGroupIngress": [
          {
            "IpProtocol": "tcp",
            "FromPort": 443,
            "ToPort": 443,
            "SourceSecurityGroupId": {
              "Ref": "LoadBalancerSecurityGroup"
            },
            "Description": "HTTPS from Load Balancer only"
          }
        ],
        "SecurityGroupEgress": [
          {
            "IpProtocol": "tcp",
            "FromPort": 443,
            "ToPort": 443,
            "CidrIp": "0.0.0.0/0",
            "Description": "HTTPS outbound"
          },
          {
            "IpProtocol": "tcp",
            "FromPort": 80,
            "ToPort": 80,
            "CidrIp": "0.0.0.0/0",
            "Description": "HTTP outbound for updates"
          }
        ],
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "WebServer-SecurityGroup-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": "Production"
          }
        ]
      }
    },
    "LoadBalancerSecurityGroup": {
      "Type": "AWS::EC2::SecurityGroup",
      "DeletionPolicy": "Delete",
      "UpdateReplacePolicy": "Delete",
      "Properties": {
        "GroupName": {
          "Fn::Sub": "LoadBalancer-SecurityGroup-${EnvironmentSuffix}"
        },
        "GroupDescription": "Security group for load balancer",
        "VpcId": {
          "Ref": "ProductionVPC"
        },
        "SecurityGroupIngress": [
          {
            "IpProtocol": "tcp",
            "FromPort": 443,
            "ToPort": 443,
            "CidrIp": "0.0.0.0/0",
            "Description": "HTTPS from internet"
          }
        ],
        "SecurityGroupEgress": [
          {
            "IpProtocol": "tcp",
            "FromPort": 443,
            "ToPort": 443,
            "DestinationSecurityGroupId": {
              "Ref": "WebServerSecurityGroup"
            },
            "Description": "HTTPS to web servers"
          }
        ],
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "LoadBalancer-SecurityGroup-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": "Production"
          }
        ]
      }
    },
    "DatabaseSecurityGroup": {
      "Type": "AWS::EC2::SecurityGroup",
      "DeletionPolicy": "Delete",
      "UpdateReplacePolicy": "Delete",
      "Properties": {
        "GroupName": {
          "Fn::Sub": "Database-SecurityGroup-${EnvironmentSuffix}"
        },
        "GroupDescription": "Security group for RDS database",
        "VpcId": {
          "Ref": "ProductionVPC"
        },
        "SecurityGroupIngress": [
          {
            "IpProtocol": "tcp",
            "FromPort": 3306,
            "ToPort": 3306,
            "SourceSecurityGroupId": {
              "Ref": "WebServerSecurityGroup"
            },
            "Description": "MySQL from web servers"
          },
          {
            "IpProtocol": "tcp",
            "FromPort": 3306,
            "ToPort": 3306,
            "SourceSecurityGroupId": {
              "Ref": "LambdaSecurityGroup"
            },
            "Description": "MySQL from Lambda functions"
          }
        ],
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "Database-SecurityGroup-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": "Production"
          }
        ]
      }
    },
    "RedisSecurityGroup": {
      "Type": "AWS::EC2::SecurityGroup",
      "DeletionPolicy": "Delete",
      "UpdateReplacePolicy": "Delete",
      "Properties": {
        "GroupName": {
          "Fn::Sub": "Redis-SecurityGroup-${EnvironmentSuffix}"
        },
        "GroupDescription": "Security group for Redis cluster",
        "VpcId": {
          "Ref": "ProductionVPC"
        },
        "SecurityGroupIngress": [
          {
            "IpProtocol": "tcp",
            "FromPort": 6379,
            "ToPort": 6379,
            "SourceSecurityGroupId": {
              "Ref": "WebServerSecurityGroup"
            },
            "Description": "Redis from web servers"
          },
          {
            "IpProtocol": "tcp",
            "FromPort": 6379,
            "ToPort": 6379,
            "SourceSecurityGroupId": {
              "Ref": "LambdaSecurityGroup"
            },
            "Description": "Redis from Lambda functions"
          }
        ],
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "Redis-SecurityGroup-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": "Production"
          }
        ]
      }
    },
    "LambdaSecurityGroup": {
      "Type": "AWS::EC2::SecurityGroup",
      "DeletionPolicy": "Delete",
      "UpdateReplacePolicy": "Delete",
      "Properties": {
        "GroupName": {
          "Fn::Sub": "Lambda-SecurityGroup-${EnvironmentSuffix}"
        },
        "GroupDescription": "Security group for Lambda functions",
        "VpcId": {
          "Ref": "ProductionVPC"
        },
        "SecurityGroupEgress": [
          {
            "IpProtocol": "tcp",
            "FromPort": 443,
            "ToPort": 443,
            "CidrIp": "0.0.0.0/0",
            "Description": "HTTPS outbound"
          },
          {
            "IpProtocol": "tcp",
            "FromPort": 3306,
            "ToPort": 3306,
            "DestinationSecurityGroupId": {
              "Ref": "DatabaseSecurityGroup"
            },
            "Description": "MySQL to database"
          },
          {
            "IpProtocol": "tcp",
            "FromPort": 6379,
            "ToPort": 6379,
            "DestinationSecurityGroupId": {
              "Ref": "RedisSecurityGroup"
            },
            "Description": "Redis to cache"
          }
        ],
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "Lambda-SecurityGroup-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": "Production"
          }
        ]
      }
    },
    "S3Bucket": {
      "Type": "AWS::S3::Bucket",
      "DeletionPolicy": "Delete",
      "UpdateReplacePolicy": "Delete",
      "Properties": {
        "BucketName": {
          "Fn::Sub": "production-app-bucket-${AWS::AccountId}-${AWS::Region}-${EnvironmentSuffix}"
        },
        "VersioningConfiguration": {
          "Status": "Enabled"
        },
        "BucketEncryption": {
          "ServerSideEncryptionConfiguration": [
            {
              "ServerSideEncryptionByDefault": {
                "SSEAlgorithm": "AES256"
              },
              "BucketKeyEnabled": true
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
              "NoncurrentVersionExpirationInDays": 30
            }
          ]
        },
        "NotificationConfiguration": {
          "LambdaConfigurations": [
            {
              "Event": "s3:ObjectCreated:*",
              "Function": {
                "Fn::GetAtt": [
                  "LambdaFunction",
                  "Arn"
                ]
              }
            }
          ]
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "Production-S3-Bucket-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": "Production"
          }
        ]
      }
    },
    "ApplicationLoadBalancer": {
      "Type": "AWS::ElasticLoadBalancingV2::LoadBalancer",
      "DeletionPolicy": "Delete",
      "UpdateReplacePolicy": "Delete",
      "Properties": {
        "Name": {
          "Fn::Sub": "Production-ALB-${EnvironmentSuffix}"
        },
        "Scheme": "internet-facing",
        "Type": "application",
        "SecurityGroups": [
          {
            "Ref": "LoadBalancerSecurityGroup"
          }
        ],
        "Subnets": [
          {
            "Ref": "PublicSubnet1"
          },
          {
            "Ref": "PublicSubnet2"
          }
        ],
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "Production-ALB-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": "Production"
          }
        ]
      }
    },
    "DBSubnetGroup": {
      "Type": "AWS::RDS::DBSubnetGroup",
      "DeletionPolicy": "Delete",
      "UpdateReplacePolicy": "Delete",
      "Properties": {
        "DBSubnetGroupName": {
          "Fn::Sub": "production-db-subnet-group-${EnvironmentSuffix}"
        },
        "DBSubnetGroupDescription": "Subnet group for RDS database",
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
              "Fn::Sub": "Production-DB-SubnetGroup-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": "Production"
          }
        ]
      }
    },
    "RDSInstance": {
      "Type": "AWS::RDS::DBInstance",
      "DeletionPolicy": "Delete",
      "UpdateReplacePolicy": "Delete",
      "Properties": {
        "DBInstanceIdentifier": {
          "Fn::Sub": "production-database-${EnvironmentSuffix}"
        },
        "DBInstanceClass": "db.t3.micro",
        "Engine": "mysql",
        "EngineVersion": "8.0.35",
        "MasterUsername": {
          "Ref": "DBUsername"
        },
        "MasterUserPassword": {
          "Ref": "DBPassword"
        },
        "AllocatedStorage": "20",
        "MaxAllocatedStorage": 100,
        "StorageType": "gp3",
        "StorageEncrypted": true,
        "MultiAZ": true,
        "VPCSecurityGroups": [
          {
            "Ref": "DatabaseSecurityGroup"
          }
        ],
        "DBSubnetGroupName": {
          "Ref": "DBSubnetGroup"
        },
        "BackupRetentionPeriod": 7,
        "PreferredBackupWindow": "03:00-04:00",
        "PreferredMaintenanceWindow": "sun:04:00-sun:05:00",
        "DeletionProtection": false,
        "EnablePerformanceInsights": true,
        "PerformanceInsightsRetentionPeriod": 7,
        "MonitoringInterval": 60,
        "MonitoringRoleArn": {
          "Fn::GetAtt": [
            "RDSMonitoringRole",
            "Arn"
          ]
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "Production-Database-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": "Production"
          }
        ]
      }
    },
    "RDSMonitoringRole": {
      "Type": "AWS::IAM::Role",
      "Properties": {
        "AssumeRolePolicyDocument": {
          "Version": "2012-10-17",
          "Statement": [
            {
              "Effect": "Allow",
              "Principal": {
                "Service": "monitoring.rds.amazonaws.com"
              },
              "Action": "sts:AssumeRole"
            }
          ]
        },
        "ManagedPolicyArns": [
          "arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole"
        ],
        "Tags": [
          {
            "Key": "Environment",
            "Value": "Production"
          }
        ]
      }
    },
    "RedisSubnetGroup": {
      "Type": "AWS::ElastiCache::SubnetGroup",
      "DeletionPolicy": "Delete",
      "UpdateReplacePolicy": "Delete",
      "Properties": {
        "CacheSubnetGroupName": {
          "Fn::Sub": "production-redis-subnet-group-${EnvironmentSuffix}"
        },
        "Description": "Subnet group for Redis cluster",
        "SubnetIds": [
          {
            "Ref": "PrivateSubnet1"
          },
          {
            "Ref": "PrivateSubnet2"
          }
        ]
      }
    },
    "RedisCluster": {
      "Type": "AWS::ElastiCache::CacheCluster",
      "DeletionPolicy": "Delete",
      "UpdateReplacePolicy": "Delete",
      "Properties": {
        "ClusterName": {
          "Fn::Sub": "production-redis-${EnvironmentSuffix}"
        },
        "CacheNodeType": "cache.t3.micro",
        "Engine": "redis",
        "NumCacheNodes": 1,
        "VpcSecurityGroupIds": [
          {
            "Ref": "RedisSecurityGroup"
          }
        ],
        "CacheSubnetGroupName": {
          "Ref": "RedisSubnetGroup"
        },
        "SnapshotRetentionLimit": 1,
        "PreferredMaintenanceWindow": "sun:05:00-sun:06:00",
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "Production-Redis-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": "Production"
          }
        ]
      }
    },
    "LambdaExecutionRole": {
      "Type": "AWS::IAM::Role",
      "Properties": {
        "RoleName": {
          "Fn::Sub": "LambdaExecutionRole-${EnvironmentSuffix}"
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
            "PolicyName": "S3Access",
            "PolicyDocument": {
              "Version": "2012-10-17",
              "Statement": [
                {
                  "Effect": "Allow",
                  "Action": [
                    "s3:GetObject",
                    "s3:PutObject",
                    "s3:DeleteObject"
                  ],
                  "Resource": {
                    "Fn::Sub": "${S3Bucket}/*"
                  }
                },
                {
                  "Effect": "Allow",
                  "Action": [
                    "s3:ListBucket"
                  ],
                  "Resource": {
                    "Ref": "S3Bucket"
                  }
                }
              ]
            }
          },
          {
            "PolicyName": "SNSPublish",
            "PolicyDocument": {
              "Version": "2012-10-17",
              "Statement": [
                {
                  "Effect": "Allow",
                  "Action": [
                    "sns:Publish"
                  ],
                  "Resource": {
                    "Ref": "SNSTopic"
                  }
                }
              ]
            }
          }
        ],
        "Tags": [
          {
            "Key": "Environment",
            "Value": "Production"
          }
        ]
      }
    },
    "LambdaFunction": {
      "Type": "AWS::Lambda::Function",
      "DeletionPolicy": "Delete",
      "UpdateReplacePolicy": "Delete",
      "Properties": {
        "FunctionName": {
          "Fn::Sub": "ProductionLambdaFunction-${EnvironmentSuffix}"
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
          "ZipFile": "import json\nimport boto3\nimport logging\n\nlogger = logging.getLogger()\nlogger.setLevel(logging.INFO)\n\ndef lambda_handler(event, context):\n    logger.info(f'Received event: {json.dumps(event)}')\n    \n    try:\n        # Process the event\n        response = {\n            'statusCode': 200,\n            'headers': {\n                'Content-Type': 'application/json',\n                'Access-Control-Allow-Origin': '*'\n            },\n            'body': json.dumps({\n                'message': 'Hello from Lambda!',\n                'event': event\n            })\n        }\n        return response\n    except Exception as e:\n        logger.error(f'Error processing request: {str(e)}')\n        return {\n            'statusCode': 500,\n            'headers': {\n                'Content-Type': 'application/json',\n                'Access-Control-Allow-Origin': '*'\n            },\n            'body': json.dumps({\n                'error': 'Internal server error'\n            })\n        }\n"
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
        "Environment": {
          "Variables": {
            "ENVIRONMENT": "Production",
            "S3_BUCKET": {
              "Ref": "S3Bucket"
            },
            "SNS_TOPIC_ARN": {
              "Ref": "SNSTopic"
            }
          }
        },
        "ReservedConcurrencyLimit": 10,
        "DeadLetterConfig": {
          "TargetArn": {
            "Fn::GetAtt": [
              "LambdaDLQ",
              "Arn"
            ]
          }
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "Production-Lambda-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": "Production"
          }
        ]
      }
    },
    "LambdaDLQ": {
      "Type": "AWS::SQS::Queue",
      "DeletionPolicy": "Delete",
      "UpdateReplacePolicy": "Delete",
      "Properties": {
        "QueueName": {
          "Fn::Sub": "lambda-dlq-${EnvironmentSuffix}"
        },
        "MessageRetentionPeriod": 1209600,
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "Lambda-DLQ-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": "Production"
          }
        ]
      }
    },
    "S3BucketNotificationPermission": {
      "Type": "AWS::Lambda::Permission",
      "Properties": {
        "FunctionName": {
          "Ref": "LambdaFunction"
        },
        "Action": "lambda:InvokeFunction",
        "Principal": "s3.amazonaws.com",
        "SourceArn": {
          "Fn::GetAtt": [
            "S3Bucket",
            "Arn"
          ]
        }
      }
    },
    "ApiGateway": {
      "Type": "AWS::ApiGateway::RestApi",
      "DeletionPolicy": "Delete",
      "UpdateReplacePolicy": "Delete",
      "Properties": {
        "Name": {
          "Fn::Sub": "ProductionAPI-${EnvironmentSuffix}"
        },
        "Description": "Production API Gateway",
        "EndpointConfiguration": {
          "Types": [
            "REGIONAL"
          ]
        },
        "Policy": {
          "Version": "2012-10-17",
          "Statement": [
            {
              "Effect": "Allow",
              "Principal": "*",
              "Action": "execute-api:Invoke",
              "Resource": "execute-api:/*"
            }
          ]
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "Production-API-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": "Production"
          }
        ]
      }
    },
    "ApiGatewayResource": {
      "Type": "AWS::ApiGateway::Resource",
      "Properties": {
        "RestApiId": {
          "Ref": "ApiGateway"
        },
        "ParentId": {
          "Fn::GetAtt": [
            "ApiGateway",
            "RootResourceId"
          ]
        },
        "PathPart": "api"
      }
    },
    "ApiGatewayMethod": {
      "Type": "AWS::ApiGateway::Method",
      "Properties": {
        "RestApiId": {
          "Ref": "ApiGateway"
        },
        "ResourceId": {
          "Ref": "ApiGatewayResource"
        },
        "HttpMethod": "GET",
        "AuthorizationType": "NONE",
        "Integration": {
          "Type": "AWS_PROXY",
          "IntegrationHttpMethod": "POST",
          "Uri": {
            "Fn::Sub": "arn:aws:apigateway:${AWS::Region}:lambda:path/2015-03-31/functions/${LambdaFunction.Arn}/invocations"
          }
        },
        "MethodResponses": [
          {
            "StatusCode": "200",
            "ResponseModels": {
              "application/json": "Empty"
            },
            "ResponseParameters": {
              "method.response.header.Access-Control-Allow-Origin": false
            }
          }
        ]
      }
    },
    "ApiGatewayDeployment": {
      "Type": "AWS::ApiGateway::Deployment",
      "DependsOn": "ApiGatewayMethod",
      "Properties": {
        "RestApiId": {
          "Ref": "ApiGateway"
        },
        "StageName": "prod"
      }
    },
    "LambdaApiGatewayPermission": {
      "Type": "AWS::Lambda::Permission",
      "Properties": {
        "FunctionName": {
          "Ref": "LambdaFunction"
        },
        "Action": "lambda:InvokeFunction",
        "Principal": "apigateway.amazonaws.com",
        "SourceArn": {
          "Fn::Sub": "arn:aws:execute-api:${AWS::Region}:${AWS::AccountId}:${ApiGateway}/*/*"
        }
      }
    },
    "SNSTopic": {
      "Type": "AWS::SNS::Topic",
      "DeletionPolicy": "Delete",
      "UpdateReplacePolicy": "Delete",
      "Properties": {
        "TopicName": {
          "Fn::Sub": "production-notifications-${EnvironmentSuffix}"
        },
        "DisplayName": "Production Notifications",
        "KmsMasterKeyId": "alias/aws/sns",
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "Production-SNS-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": "Production"
          }
        ]
      }
    },
    "CloudWatchLogGroup": {
      "Type": "AWS::Logs::LogGroup",
      "DeletionPolicy": "Delete",
      "UpdateReplacePolicy": "Delete",
      "Properties": {
        "LogGroupName": {
          "Fn::Sub": "/aws/lambda/ProductionLambdaFunction-${EnvironmentSuffix}"
        },
        "RetentionInDays": 14,
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "Production-LogGroup-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": "Production"
          }
        ]
      }
    },
    "CPUAlarmHigh": {
      "Type": "AWS::CloudWatch::Alarm",
      "DeletionPolicy": "Delete",
      "UpdateReplacePolicy": "Delete",
      "Properties": {
        "AlarmName": {
          "Fn::Sub": "CPU-High-${EnvironmentSuffix}"
        },
        "AlarmDescription": "Alarm when CPU exceeds 70%",
        "AlarmActions": [
          {
            "Ref": "SNSTopic"
          }
        ],
        "MetricName": "CPUUtilization",
        "Namespace": "AWS/Lambda",
        "Statistic": "Average",
        "Period": 300,
        "EvaluationPeriods": 2,
        "Threshold": 70,
        "ComparisonOperator": "GreaterThanThreshold",
        "Dimensions": [
          {
            "Name": "FunctionName",
            "Value": {
              "Ref": "LambdaFunction"
            }
          }
        ]
      }
    },
    "HostedZone": {
      "Type": "AWS::Route53::HostedZone",
      "DeletionPolicy": "Delete",
      "UpdateReplacePolicy": "Delete",
      "Properties": {
        "Name": {
          "Ref": "DomainName"
        },
        "HostedZoneConfig": {
          "Comment": {
            "Fn::Sub": "Hosted zone for ${DomainName} - ${EnvironmentSuffix}"
          }
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "Production-HostedZone-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": "Production"
          }
        ]
      }
    },
    "CloudFrontDistribution": {
      "Type": "AWS::CloudFront::Distribution",
      "DeletionPolicy": "Delete",
      "UpdateReplacePolicy": "Delete",
      "Properties": {
        "DistributionConfig": {
          "Comment": {
            "Fn::Sub": "CloudFront distribution for ${DomainName} - ${EnvironmentSuffix}"
          },
          "DefaultCacheBehavior": {
            "TargetOriginId": "ALBOrigin",
            "ViewerProtocolPolicy": "redirect-to-https",
            "CachePolicyId": "4135ea2d-6df8-44a3-9df3-4b5a84be39ad",
            "OriginRequestPolicyId": "88a5eaf4-2fd4-4709-b370-b4c650ea3fcf",
            "Compress": true
          },
          "Origins": [
            {
              "Id": "ALBOrigin",
              "DomainName": {
                "Fn::GetAtt": [
                  "ApplicationLoadBalancer",
                  "DNSName"
                ]
              },
              "CustomOriginConfig": {
                "HTTPPort": 80,
                "HTTPSPort": 443,
                "OriginProtocolPolicy": "https-only",
                "OriginSSLProtocols": [
                  "TLSv1.2"
                ]
              }
            }
          ],
          "Enabled": true,
          "HttpVersion": "http2",
          "PriceClass": "PriceClass_100",
          "ViewerCertificate": {
            "CloudFrontDefaultCertificate": true
          }
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "Production-CloudFront-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": "Production"
          }
        ]
      }
    }
  },
  "Outputs": {
    "VPCId": {
      "Description": "VPC ID",
      "Value": {
        "Ref": "ProductionVPC"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-VPC-ID"
        }
      }
    },
    "LoadBalancerDNS": {
      "Description": "Load Balancer DNS Name",
      "Value": {
        "Fn::GetAtt": [
          "ApplicationLoadBalancer",
          "DNSName"
        ]
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-LoadBalancer-DNS"
        }
      }
    },
    "DatabaseEndpoint": {
      "Description": "RDS Database Endpoint",
      "Value": {
        "Fn::GetAtt": [
          "RDSInstance",
          "Endpoint.Address"
        ]
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-Database-Endpoint"
        }
      }
    },
    "RedisEndpoint": {
      "Description": "Redis Cluster Endpoint",
      "Value": {
        "Fn::GetAtt": [
          "RedisCluster",
          "RedisEndpoint.Address"
        ]
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-Redis-Endpoint"
        }
      }
    },
    "S3BucketName": {
      "Description": "S3 Bucket Name",
      "Value": {
        "Ref": "S3Bucket"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-S3-Bucket"
        }
      }
    },
    "LambdaFunctionArn": {
      "Description": "Lambda Function ARN",
      "Value": {
        "Fn::GetAtt": [
          "LambdaFunction",
          "Arn"
        ]
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-Lambda-ARN"
        }
      }
    },
    "ApiGatewayURL": {
      "Description": "API Gateway URL",
      "Value": {
        "Fn::Sub": "https://${ApiGateway}.execute-api.${AWS::Region}.amazonaws.com/prod/api"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-API-URL"
        }
      }
    },
    "SNSTopicArn": {
      "Description": "SNS Topic ARN",
      "Value": {
        "Ref": "SNSTopic"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-SNS-ARN"
        }
      }
    },
    "CloudFrontURL": {
      "Description": "CloudFront Distribution URL",
      "Value": {
        "Fn::Sub": "https://${CloudFrontDistribution.DomainName}"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-CloudFront-URL"
        }
      }
    },
    "HostedZoneId": {
      "Description": "Route 53 Hosted Zone ID",
      "Value": {
        "Ref": "HostedZone"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-HostedZone-ID"
        }
      }
    }
  }
}
```