# CloudFormation Template for Loan Processing Web Portal

This CloudFormation JSON template deploys a complete, production-ready loan processing web application infrastructure with high availability, auto-scaling, comprehensive monitoring, and security best practices.

## File: lib/TapStack.json

```json
{
  "AWSTemplateFormatVersion": "2010-09-09",
  "Description": "Loan Processing Web Portal - Production Infrastructure with ECS Fargate, Aurora MySQL, ALB, CloudFront, and Auto Scaling",

  "Parameters": {
    "EnvironmentSuffix": {
      "Type": "String",
      "Description": "Suffix for resource naming to support multiple environments",
      "Default": "prod"
    },
    "VpcCIDR": {
      "Type": "String",
      "Description": "CIDR block for VPC",
      "Default": "10.0.0.0/16"
    },
    "ContainerImage": {
      "Type": "String",
      "Description": "Docker image for ECS tasks",
      "Default": "nginx:latest"
    },
    "ContainerCpu": {
      "Type": "String",
      "Description": "CPU units for ECS task (256, 512, 1024, 2048, 4096)",
      "Default": "512",
      "AllowedValues": ["256", "512", "1024", "2048", "4096"]
    },
    "ContainerMemory": {
      "Type": "String",
      "Description": "Memory for ECS task in MB",
      "Default": "1024",
      "AllowedValues": ["512", "1024", "2048", "4096", "8192"]
    },
    "DBMasterUsername": {
      "Type": "String",
      "Description": "Master username for Aurora database",
      "Default": "admin",
      "MinLength": "1",
      "MaxLength": "16"
    },
    "AlertEmail": {
      "Type": "String",
      "Description": "Email address for CloudWatch alarm notifications",
      "Default": "ops@example.com"
    },
    "FrontendDomain": {
      "Type": "String",
      "Description": "Frontend domain for CORS configuration",
      "Default": "https://example.com"
    }
  },

  "Resources": {
    "VPC": {
      "Type": "AWS::EC2::VPC",
      "Properties": {
        "CidrBlock": {"Ref": "VpcCIDR"},
        "EnableDnsHostnames": true,
        "EnableDnsSupport": true,
        "Tags": [
          {
            "Key": "Name",
            "Value": {"Fn::Sub": "vpc-${EnvironmentSuffix}"}
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
        "AvailabilityZone": {"Fn::Select": [0, {"Fn::GetAZs": ""}]},
        "MapPublicIpOnLaunch": true,
        "Tags": [
          {
            "Key": "Name",
            "Value": {"Fn::Sub": "public-subnet-1-${EnvironmentSuffix}"}
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
            "Value": {"Fn::Sub": "public-subnet-2-${EnvironmentSuffix}"}
          }
        ]
      }
    },

    "PublicSubnet3": {
      "Type": "AWS::EC2::Subnet",
      "Properties": {
        "VpcId": {"Ref": "VPC"},
        "CidrBlock": "10.0.3.0/24",
        "AvailabilityZone": {"Fn::Select": [2, {"Fn::GetAZs": ""}]},
        "MapPublicIpOnLaunch": true,
        "Tags": [
          {
            "Key": "Name",
            "Value": {"Fn::Sub": "public-subnet-3-${EnvironmentSuffix}"}
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
            "Value": {"Fn::Sub": "private-subnet-1-${EnvironmentSuffix}"}
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
            "Value": {"Fn::Sub": "private-subnet-2-${EnvironmentSuffix}"}
          }
        ]
      }
    },

    "PrivateSubnet3": {
      "Type": "AWS::EC2::Subnet",
      "Properties": {
        "VpcId": {"Ref": "VPC"},
        "CidrBlock": "10.0.13.0/24",
        "AvailabilityZone": {"Fn::Select": [2, {"Fn::GetAZs": ""}]},
        "Tags": [
          {
            "Key": "Name",
            "Value": {"Fn::Sub": "private-subnet-3-${EnvironmentSuffix}"}
          }
        ]
      }
    },

    "NatGateway1EIP": {
      "Type": "AWS::EC2::EIP",
      "DependsOn": "AttachGateway",
      "Properties": {
        "Domain": "vpc",
        "Tags": [
          {
            "Key": "Name",
            "Value": {"Fn::Sub": "nat-eip-1-${EnvironmentSuffix}"}
          }
        ]
      }
    },

    "NatGateway2EIP": {
      "Type": "AWS::EC2::EIP",
      "DependsOn": "AttachGateway",
      "Properties": {
        "Domain": "vpc",
        "Tags": [
          {
            "Key": "Name",
            "Value": {"Fn::Sub": "nat-eip-2-${EnvironmentSuffix}"}
          }
        ]
      }
    },

    "NatGateway3EIP": {
      "Type": "AWS::EC2::EIP",
      "DependsOn": "AttachGateway",
      "Properties": {
        "Domain": "vpc",
        "Tags": [
          {
            "Key": "Name",
            "Value": {"Fn::Sub": "nat-eip-3-${EnvironmentSuffix}"}
          }
        ]
      }
    },

    "NatGateway1": {
      "Type": "AWS::EC2::NatGateway",
      "Properties": {
        "AllocationId": {"Fn::GetAtt": ["NatGateway1EIP", "AllocationId"]},
        "SubnetId": {"Ref": "PublicSubnet1"},
        "Tags": [
          {
            "Key": "Name",
            "Value": {"Fn::Sub": "nat-gateway-1-${EnvironmentSuffix}"}
          }
        ]
      }
    },

    "NatGateway2": {
      "Type": "AWS::EC2::NatGateway",
      "Properties": {
        "AllocationId": {"Fn::GetAtt": ["NatGateway2EIP", "AllocationId"]},
        "SubnetId": {"Ref": "PublicSubnet2"},
        "Tags": [
          {
            "Key": "Name",
            "Value": {"Fn::Sub": "nat-gateway-2-${EnvironmentSuffix}"}
          }
        ]
      }
    },

    "NatGateway3": {
      "Type": "AWS::EC2::NatGateway",
      "Properties": {
        "AllocationId": {"Fn::GetAtt": ["NatGateway3EIP", "AllocationId"]},
        "SubnetId": {"Ref": "PublicSubnet3"},
        "Tags": [
          {
            "Key": "Name",
            "Value": {"Fn::Sub": "nat-gateway-3-${EnvironmentSuffix}"}
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

    "PrivateRouteTable1": {
      "Type": "AWS::EC2::RouteTable",
      "Properties": {
        "VpcId": {"Ref": "VPC"},
        "Tags": [
          {
            "Key": "Name",
            "Value": {"Fn::Sub": "private-rt-1-${EnvironmentSuffix}"}
          }
        ]
      }
    },

    "PrivateRoute1": {
      "Type": "AWS::EC2::Route",
      "Properties": {
        "RouteTableId": {"Ref": "PrivateRouteTable1"},
        "DestinationCidrBlock": "0.0.0.0/0",
        "NatGatewayId": {"Ref": "NatGateway1"}
      }
    },

    "PrivateSubnet1RouteTableAssociation": {
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
            "Value": {"Fn::Sub": "private-rt-2-${EnvironmentSuffix}"}
          }
        ]
      }
    },

    "PrivateRoute2": {
      "Type": "AWS::EC2::Route",
      "Properties": {
        "RouteTableId": {"Ref": "PrivateRouteTable2"},
        "DestinationCidrBlock": "0.0.0.0/0",
        "NatGatewayId": {"Ref": "NatGateway2"}
      }
    },

    "PrivateSubnet2RouteTableAssociation": {
      "Type": "AWS::EC2::SubnetRouteTableAssociation",
      "Properties": {
        "SubnetId": {"Ref": "PrivateSubnet2"},
        "RouteTableId": {"Ref": "PrivateRouteTable2"}
      }
    },

    "PrivateRouteTable3": {
      "Type": "AWS::EC2::RouteTable",
      "Properties": {
        "VpcId": {"Ref": "VPC"},
        "Tags": [
          {
            "Key": "Name",
            "Value": {"Fn::Sub": "private-rt-3-${EnvironmentSuffix}"}
          }
        ]
      }
    },

    "PrivateRoute3": {
      "Type": "AWS::EC2::Route",
      "Properties": {
        "RouteTableId": {"Ref": "PrivateRouteTable3"},
        "DestinationCidrBlock": "0.0.0.0/0",
        "NatGatewayId": {"Ref": "NatGateway3"}
      }
    },

    "PrivateSubnet3RouteTableAssociation": {
      "Type": "AWS::EC2::SubnetRouteTableAssociation",
      "Properties": {
        "SubnetId": {"Ref": "PrivateSubnet3"},
        "RouteTableId": {"Ref": "PrivateRouteTable3"}
      }
    },

    "ALBSecurityGroup": {
      "Type": "AWS::EC2::SecurityGroup",
      "Properties": {
        "GroupDescription": "Security group for Application Load Balancer",
        "GroupName": {"Fn::Sub": "alb-sg-${EnvironmentSuffix}"},
        "VpcId": {"Ref": "VPC"},
        "SecurityGroupIngress": [
          {
            "IpProtocol": "tcp",
            "FromPort": 80,
            "ToPort": 80,
            "CidrIp": "0.0.0.0/0"
          },
          {
            "IpProtocol": "tcp",
            "FromPort": 443,
            "ToPort": 443,
            "CidrIp": "0.0.0.0/0"
          }
        ],
        "SecurityGroupEgress": [
          {
            "IpProtocol": "-1",
            "CidrIp": "0.0.0.0/0"
          }
        ],
        "Tags": [
          {
            "Key": "Name",
            "Value": {"Fn::Sub": "alb-sg-${EnvironmentSuffix}"}
          }
        ]
      }
    },

    "ECSSecurityGroup": {
      "Type": "AWS::EC2::SecurityGroup",
      "Properties": {
        "GroupDescription": "Security group for ECS tasks",
        "GroupName": {"Fn::Sub": "ecs-sg-${EnvironmentSuffix}"},
        "VpcId": {"Ref": "VPC"},
        "SecurityGroupIngress": [
          {
            "IpProtocol": "tcp",
            "FromPort": 3000,
            "ToPort": 3000,
            "SourceSecurityGroupId": {"Ref": "ALBSecurityGroup"}
          }
        ],
        "SecurityGroupEgress": [
          {
            "IpProtocol": "-1",
            "CidrIp": "0.0.0.0/0"
          }
        ],
        "Tags": [
          {
            "Key": "Name",
            "Value": {"Fn::Sub": "ecs-sg-${EnvironmentSuffix}"}
          }
        ]
      }
    },

    "RDSSecurityGroup": {
      "Type": "AWS::EC2::SecurityGroup",
      "Properties": {
        "GroupDescription": "Security group for RDS Aurora cluster",
        "GroupName": {"Fn::Sub": "rds-sg-${EnvironmentSuffix}"},
        "VpcId": {"Ref": "VPC"},
        "SecurityGroupIngress": [
          {
            "IpProtocol": "tcp",
            "FromPort": 3306,
            "ToPort": 3306,
            "SourceSecurityGroupId": {"Ref": "ECSSecurityGroup"}
          }
        ],
        "SecurityGroupEgress": [
          {
            "IpProtocol": "-1",
            "CidrIp": "0.0.0.0/0"
          }
        ],
        "Tags": [
          {
            "Key": "Name",
            "Value": {"Fn::Sub": "rds-sg-${EnvironmentSuffix}"}
          }
        ]
      }
    },

    "DBSubnetGroup": {
      "Type": "AWS::RDS::DBSubnetGroup",
      "Properties": {
        "DBSubnetGroupDescription": "Subnet group for Aurora cluster",
        "DBSubnetGroupName": {"Fn::Sub": "db-subnet-group-${EnvironmentSuffix}"},
        "SubnetIds": [
          {"Ref": "PrivateSubnet1"},
          {"Ref": "PrivateSubnet2"},
          {"Ref": "PrivateSubnet3"}
        ],
        "Tags": [
          {
            "Key": "Name",
            "Value": {"Fn::Sub": "db-subnet-group-${EnvironmentSuffix}"}
          }
        ]
      }
    },

    "DBSecret": {
      "Type": "AWS::SecretsManager::Secret",
      "Properties": {
        "Name": {"Fn::Sub": "aurora-credentials-${EnvironmentSuffix}"},
        "Description": "Aurora MySQL database credentials",
        "GenerateSecretString": {
          "SecretStringTemplate": {"Fn::Sub": "{\"username\": \"${DBMasterUsername}\"}"},
          "GenerateStringKey": "password",
          "PasswordLength": 32,
          "ExcludeCharacters": "\"@/\\"
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": {"Fn::Sub": "aurora-secret-${EnvironmentSuffix}"}
          }
        ]
      }
    },

    "DBCluster": {
      "Type": "AWS::RDS::DBCluster",
      "Properties": {
        "Engine": "aurora-mysql",
        "EngineVersion": "8.0.mysql_aurora.3.04.0",
        "DBClusterIdentifier": {"Fn::Sub": "aurora-cluster-${EnvironmentSuffix}"},
        "MasterUsername": {"Fn::Sub": "{{resolve:secretsmanager:${DBSecret}:SecretString:username}}"},
        "MasterUserPassword": {"Fn::Sub": "{{resolve:secretsmanager:${DBSecret}:SecretString:password}}"},
        "DatabaseName": "loandb",
        "BackupRetentionPeriod": 7,
        "PreferredBackupWindow": "03:00-04:00",
        "PreferredMaintenanceWindow": "mon:04:00-mon:05:00",
        "DBSubnetGroupName": {"Ref": "DBSubnetGroup"},
        "VpcSecurityGroupIds": [{"Ref": "RDSSecurityGroup"}],
        "StorageEncrypted": true,
        "DeletionProtection": true,
        "EnableCloudwatchLogsExports": ["error", "slowquery", "audit"],
        "Tags": [
          {
            "Key": "Name",
            "Value": {"Fn::Sub": "aurora-cluster-${EnvironmentSuffix}"}
          }
        ]
      }
    },

    "DBInstance1": {
      "Type": "AWS::RDS::DBInstance",
      "Properties": {
        "Engine": "aurora-mysql",
        "DBClusterIdentifier": {"Ref": "DBCluster"},
        "DBInstanceIdentifier": {"Fn::Sub": "aurora-instance-1-${EnvironmentSuffix}"},
        "DBInstanceClass": "db.t3.medium",
        "PubliclyAccessible": false,
        "AvailabilityZone": {"Fn::Select": [0, {"Fn::GetAZs": ""}]},
        "Tags": [
          {
            "Key": "Name",
            "Value": {"Fn::Sub": "aurora-instance-1-${EnvironmentSuffix}"}
          }
        ]
      }
    },

    "DBInstance2": {
      "Type": "AWS::RDS::DBInstance",
      "Properties": {
        "Engine": "aurora-mysql",
        "DBClusterIdentifier": {"Ref": "DBCluster"},
        "DBInstanceIdentifier": {"Fn::Sub": "aurora-instance-2-${EnvironmentSuffix}"},
        "DBInstanceClass": "db.t3.medium",
        "PubliclyAccessible": false,
        "AvailabilityZone": {"Fn::Select": [1, {"Fn::GetAZs": ""}]},
        "Tags": [
          {
            "Key": "Name",
            "Value": {"Fn::Sub": "aurora-instance-2-${EnvironmentSuffix}"}
          }
        ]
      }
    },

    "SecretRotationSchedule": {
      "Type": "AWS::SecretsManager::RotationSchedule",
      "Properties": {
        "SecretId": {"Ref": "DBSecret"},
        "RotationLambdaARN": {"Fn::Sub": "arn:aws:lambda:${AWS::Region}:${AWS::AccountId}:function:SecretsManagerRDSMySQLRotationSingleUser"},
        "RotationRules": {
          "AutomaticallyAfterDays": 30
        }
      }
    },

    "StaticAssetsBucket": {
      "Type": "AWS::S3::Bucket",
      "Properties": {
        "BucketName": {"Fn::Sub": "loan-app-static-assets-${EnvironmentSuffix}-${AWS::AccountId}"},
        "VersioningConfiguration": {
          "Status": "Enabled"
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
        "CorsConfiguration": {
          "CorsRules": [
            {
              "AllowedOrigins": [{"Ref": "FrontendDomain"}],
              "AllowedMethods": ["GET", "HEAD"],
              "AllowedHeaders": ["*"],
              "MaxAge": 3000
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
            "Key": "Name",
            "Value": {"Fn::Sub": "static-assets-bucket-${EnvironmentSuffix}"}
          }
        ]
      }
    },

    "CloudFrontOAI": {
      "Type": "AWS::CloudFront::CloudFrontOriginAccessIdentity",
      "Properties": {
        "CloudFrontOriginAccessIdentityConfig": {
          "Comment": {"Fn::Sub": "OAI for loan app static assets ${EnvironmentSuffix}"}
        }
      }
    },

    "BucketPolicy": {
      "Type": "AWS::S3::BucketPolicy",
      "Properties": {
        "Bucket": {"Ref": "StaticAssetsBucket"},
        "PolicyDocument": {
          "Statement": [
            {
              "Effect": "Allow",
              "Principal": {
                "CanonicalUser": {"Fn::GetAtt": ["CloudFrontOAI", "S3CanonicalUserId"]}
              },
              "Action": "s3:GetObject",
              "Resource": {"Fn::Sub": "${StaticAssetsBucket.Arn}/*"}
            }
          ]
        }
      }
    },

    "CloudFrontDistribution": {
      "Type": "AWS::CloudFront::Distribution",
      "Properties": {
        "DistributionConfig": {
          "Enabled": true,
          "Comment": {"Fn::Sub": "CDN for loan app static assets ${EnvironmentSuffix}"},
          "DefaultRootObject": "index.html",
          "Origins": [
            {
              "Id": "S3Origin",
              "DomainName": {"Fn::GetAtt": ["StaticAssetsBucket", "RegionalDomainName"]},
              "S3OriginConfig": {
                "OriginAccessIdentity": {"Fn::Sub": "origin-access-identity/cloudfront/${CloudFrontOAI}"}
              }
            }
          ],
          "DefaultCacheBehavior": {
            "TargetOriginId": "S3Origin",
            "ViewerProtocolPolicy": "redirect-to-https",
            "AllowedMethods": ["GET", "HEAD", "OPTIONS"],
            "CachedMethods": ["GET", "HEAD"],
            "ForwardedValues": {
              "QueryString": false,
              "Cookies": {
                "Forward": "none"
              }
            },
            "MinTTL": 0,
            "DefaultTTL": 86400,
            "MaxTTL": 31536000,
            "Compress": true
          },
          "PriceClass": "PriceClass_100",
          "ViewerCertificate": {
            "CloudFrontDefaultCertificate": true
          }
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": {"Fn::Sub": "cloudfront-${EnvironmentSuffix}"}
          }
        ]
      }
    },

    "ECSCluster": {
      "Type": "AWS::ECS::Cluster",
      "Properties": {
        "ClusterName": {"Fn::Sub": "loan-app-cluster-${EnvironmentSuffix}"},
        "ClusterSettings": [
          {
            "Name": "containerInsights",
            "Value": "enabled"
          }
        ],
        "Tags": [
          {
            "Key": "Name",
            "Value": {"Fn::Sub": "ecs-cluster-${EnvironmentSuffix}"}
          }
        ]
      }
    },

    "ECSTaskExecutionRole": {
      "Type": "AWS::IAM::Role",
      "Properties": {
        "RoleName": {"Fn::Sub": "ecs-task-execution-role-${EnvironmentSuffix}"},
        "AssumeRolePolicyDocument": {
          "Version": "2012-10-17",
          "Statement": [
            {
              "Effect": "Allow",
              "Principal": {
                "Service": "ecs-tasks.amazonaws.com"
              },
              "Action": "sts:AssumeRole"
            }
          ]
        },
        "ManagedPolicyArns": [
          "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
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
                    "secretsmanager:GetSecretValue"
                  ],
                  "Resource": {"Ref": "DBSecret"}
                }
              ]
            }
          }
        ],
        "Tags": [
          {
            "Key": "Name",
            "Value": {"Fn::Sub": "ecs-task-execution-role-${EnvironmentSuffix}"}
          }
        ]
      }
    },

    "ECSTaskRole": {
      "Type": "AWS::IAM::Role",
      "Properties": {
        "RoleName": {"Fn::Sub": "ecs-task-role-${EnvironmentSuffix}"},
        "AssumeRolePolicyDocument": {
          "Version": "2012-10-17",
          "Statement": [
            {
              "Effect": "Allow",
              "Principal": {
                "Service": "ecs-tasks.amazonaws.com"
              },
              "Action": "sts:AssumeRole"
            }
          ]
        },
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
                    "s3:ListBucket"
                  ],
                  "Resource": [
                    {"Fn::GetAtt": ["StaticAssetsBucket", "Arn"]},
                    {"Fn::Sub": "${StaticAssetsBucket.Arn}/*"}
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
                    "secretsmanager:GetSecretValue"
                  ],
                  "Resource": {"Ref": "DBSecret"}
                }
              ]
            }
          }
        ],
        "Tags": [
          {
            "Key": "Name",
            "Value": {"Fn::Sub": "ecs-task-role-${EnvironmentSuffix}"}
          }
        ]
      }
    },

    "ECSLogGroup": {
      "Type": "AWS::Logs::LogGroup",
      "Properties": {
        "LogGroupName": {"Fn::Sub": "/ecs/loan-app-${EnvironmentSuffix}"},
        "RetentionInDays": 30
      }
    },

    "ECSTaskDefinition": {
      "Type": "AWS::ECS::TaskDefinition",
      "Properties": {
        "Family": {"Fn::Sub": "loan-app-task-${EnvironmentSuffix}"},
        "NetworkMode": "awsvpc",
        "RequiresCompatibilities": ["FARGATE"],
        "Cpu": {"Ref": "ContainerCpu"},
        "Memory": {"Ref": "ContainerMemory"},
        "ExecutionRoleArn": {"Fn::GetAtt": ["ECSTaskExecutionRole", "Arn"]},
        "TaskRoleArn": {"Fn::GetAtt": ["ECSTaskRole", "Arn"]},
        "ContainerDefinitions": [
          {
            "Name": "loan-app",
            "Image": {"Ref": "ContainerImage"},
            "Essential": true,
            "PortMappings": [
              {
                "ContainerPort": 3000,
                "Protocol": "tcp"
              }
            ],
            "Environment": [
              {
                "Name": "NODE_ENV",
                "Value": "production"
              },
              {
                "Name": "DB_HOST",
                "Value": {"Fn::GetAtt": ["DBCluster", "Endpoint.Address"]}
              },
              {
                "Name": "DB_NAME",
                "Value": "loandb"
              },
              {
                "Name": "S3_BUCKET",
                "Value": {"Ref": "StaticAssetsBucket"}
              }
            ],
            "Secrets": [
              {
                "Name": "DB_USERNAME",
                "ValueFrom": {"Fn::Sub": "${DBSecret}:username::"}
              },
              {
                "Name": "DB_PASSWORD",
                "ValueFrom": {"Fn::Sub": "${DBSecret}:password::"}
              }
            ],
            "LogConfiguration": {
              "LogDriver": "awslogs",
              "Options": {
                "awslogs-group": {"Ref": "ECSLogGroup"},
                "awslogs-region": {"Ref": "AWS::Region"},
                "awslogs-stream-prefix": "ecs"
              }
            },
            "HealthCheck": {
              "Command": ["CMD-SHELL", "curl -f http://localhost:3000/health || exit 1"],
              "Interval": 30,
              "Timeout": 5,
              "Retries": 3,
              "StartPeriod": 60
            }
          }
        ],
        "Tags": [
          {
            "Key": "Name",
            "Value": {"Fn::Sub": "ecs-task-def-${EnvironmentSuffix}"}
          }
        ]
      }
    },

    "ApplicationLoadBalancer": {
      "Type": "AWS::ElasticLoadBalancingV2::LoadBalancer",
      "Properties": {
        "Name": {"Fn::Sub": "loan-app-alb-${EnvironmentSuffix}"},
        "Type": "application",
        "Scheme": "internet-facing",
        "IpAddressType": "ipv4",
        "Subnets": [
          {"Ref": "PublicSubnet1"},
          {"Ref": "PublicSubnet2"},
          {"Ref": "PublicSubnet3"}
        ],
        "SecurityGroups": [{"Ref": "ALBSecurityGroup"}],
        "Tags": [
          {
            "Key": "Name",
            "Value": {"Fn::Sub": "alb-${EnvironmentSuffix}"}
          }
        ]
      }
    },

    "ALBTargetGroup": {
      "Type": "AWS::ElasticLoadBalancingV2::TargetGroup",
      "Properties": {
        "Name": {"Fn::Sub": "loan-app-tg-${EnvironmentSuffix}"},
        "Port": 3000,
        "Protocol": "HTTP",
        "TargetType": "ip",
        "VpcId": {"Ref": "VPC"},
        "HealthCheckEnabled": true,
        "HealthCheckPath": "/health",
        "HealthCheckProtocol": "HTTP",
        "HealthCheckIntervalSeconds": 30,
        "HealthCheckTimeoutSeconds": 5,
        "HealthyThresholdCount": 2,
        "UnhealthyThresholdCount": 3,
        "Matcher": {
          "HttpCode": "200"
        },
        "TargetGroupAttributes": [
          {
            "Key": "deregistration_delay.timeout_seconds",
            "Value": "30"
          }
        ],
        "Tags": [
          {
            "Key": "Name",
            "Value": {"Fn::Sub": "alb-target-group-${EnvironmentSuffix}"}
          }
        ]
      }
    },

    "ALBListener": {
      "Type": "AWS::ElasticLoadBalancingV2::Listener",
      "Properties": {
        "LoadBalancerArn": {"Ref": "ApplicationLoadBalancer"},
        "Port": 80,
        "Protocol": "HTTP",
        "DefaultActions": [
          {
            "Type": "forward",
            "TargetGroupArn": {"Ref": "ALBTargetGroup"}
          }
        ]
      }
    },

    "ECSService": {
      "Type": "AWS::ECS::Service",
      "DependsOn": ["ALBListener"],
      "Properties": {
        "ServiceName": {"Fn::Sub": "loan-app-service-${EnvironmentSuffix}"},
        "Cluster": {"Ref": "ECSCluster"},
        "TaskDefinition": {"Ref": "ECSTaskDefinition"},
        "DesiredCount": 2,
        "LaunchType": "FARGATE",
        "NetworkConfiguration": {
          "AwsvpcConfiguration": {
            "AssignPublicIp": "DISABLED",
            "Subnets": [
              {"Ref": "PrivateSubnet1"},
              {"Ref": "PrivateSubnet2"},
              {"Ref": "PrivateSubnet3"}
            ],
            "SecurityGroups": [{"Ref": "ECSSecurityGroup"}]
          }
        },
        "LoadBalancers": [
          {
            "ContainerName": "loan-app",
            "ContainerPort": 3000,
            "TargetGroupArn": {"Ref": "ALBTargetGroup"}
          }
        ],
        "HealthCheckGracePeriodSeconds": 60,
        "Tags": [
          {
            "Key": "Name",
            "Value": {"Fn::Sub": "ecs-service-${EnvironmentSuffix}"}
          }
        ]
      }
    },

    "ServiceScalingTarget": {
      "Type": "AWS::ApplicationAutoScaling::ScalableTarget",
      "Properties": {
        "MaxCapacity": 10,
        "MinCapacity": 2,
        "ResourceId": {"Fn::Sub": "service/${ECSCluster}/${ECSService.Name}"},
        "RoleARN": {"Fn::Sub": "arn:aws:iam::${AWS::AccountId}:role/aws-service-role/ecs.application-autoscaling.amazonaws.com/AWSServiceRoleForApplicationAutoScaling_ECSService"},
        "ScalableDimension": "ecs:service:DesiredCount",
        "ServiceNamespace": "ecs"
      }
    },

    "ServiceScalingPolicyScaleOut": {
      "Type": "AWS::ApplicationAutoScaling::ScalingPolicy",
      "Properties": {
        "PolicyName": {"Fn::Sub": "ecs-scale-out-${EnvironmentSuffix}"},
        "PolicyType": "StepScaling",
        "ScalingTargetId": {"Ref": "ServiceScalingTarget"},
        "StepScalingPolicyConfiguration": {
          "AdjustmentType": "ChangeInCapacity",
          "Cooldown": 60,
          "MetricAggregationType": "Average",
          "StepAdjustments": [
            {
              "MetricIntervalLowerBound": 0,
              "MetricIntervalUpperBound": 10,
              "ScalingAdjustment": 1
            },
            {
              "MetricIntervalLowerBound": 10,
              "ScalingAdjustment": 2
            }
          ]
        }
      }
    },

    "ServiceScalingPolicyScaleIn": {
      "Type": "AWS::ApplicationAutoScaling::ScalingPolicy",
      "Properties": {
        "PolicyName": {"Fn::Sub": "ecs-scale-in-${EnvironmentSuffix}"},
        "PolicyType": "StepScaling",
        "ScalingTargetId": {"Ref": "ServiceScalingTarget"},
        "StepScalingPolicyConfiguration": {
          "AdjustmentType": "ChangeInCapacity",
          "Cooldown": 300,
          "MetricAggregationType": "Average",
          "StepAdjustments": [
            {
              "MetricIntervalUpperBound": 0,
              "ScalingAdjustment": -1
            }
          ]
        }
      }
    },

    "ScaleOutAlarm": {
      "Type": "AWS::CloudWatch::Alarm",
      "Properties": {
        "AlarmName": {"Fn::Sub": "ecs-scale-out-alarm-${EnvironmentSuffix}"},
        "AlarmDescription": "Trigger scale out when request count is high",
        "MetricName": "RequestCountPerTarget",
        "Namespace": "AWS/ApplicationELB",
        "Statistic": "Sum",
        "Period": 60,
        "EvaluationPeriods": 2,
        "Threshold": 1000,
        "ComparisonOperator": "GreaterThanThreshold",
        "Dimensions": [
          {
            "Name": "TargetGroup",
            "Value": {"Fn::GetAtt": ["ALBTargetGroup", "TargetGroupFullName"]}
          }
        ],
        "AlarmActions": [
          {"Ref": "ServiceScalingPolicyScaleOut"}
        ]
      }
    },

    "ScaleInAlarm": {
      "Type": "AWS::CloudWatch::Alarm",
      "Properties": {
        "AlarmName": {"Fn::Sub": "ecs-scale-in-alarm-${EnvironmentSuffix}"},
        "AlarmDescription": "Trigger scale in when request count is low",
        "MetricName": "RequestCountPerTarget",
        "Namespace": "AWS/ApplicationELB",
        "Statistic": "Sum",
        "Period": 60,
        "EvaluationPeriods": 5,
        "Threshold": 200,
        "ComparisonOperator": "LessThanThreshold",
        "Dimensions": [
          {
            "Name": "TargetGroup",
            "Value": {"Fn::GetAtt": ["ALBTargetGroup", "TargetGroupFullName"]}
          }
        ],
        "AlarmActions": [
          {"Ref": "ServiceScalingPolicyScaleIn"}
        ]
      }
    },

    "AlertTopic": {
      "Type": "AWS::SNS::Topic",
      "Properties": {
        "TopicName": {"Fn::Sub": "loan-app-alerts-${EnvironmentSuffix}"},
        "DisplayName": "Loan App Critical Alerts",
        "Subscription": [
          {
            "Endpoint": {"Ref": "AlertEmail"},
            "Protocol": "email"
          }
        ],
        "Tags": [
          {
            "Key": "Name",
            "Value": {"Fn::Sub": "sns-topic-${EnvironmentSuffix}"}
          }
        ]
      }
    },

    "ECSTaskFailureAlarm": {
      "Type": "AWS::CloudWatch::Alarm",
      "Properties": {
        "AlarmName": {"Fn::Sub": "ecs-task-failure-${EnvironmentSuffix}"},
        "AlarmDescription": "Alert when ECS tasks fail",
        "MetricName": "RunningTaskCount",
        "Namespace": "ECS/ContainerInsights",
        "Statistic": "Average",
        "Period": 60,
        "EvaluationPeriods": 2,
        "Threshold": 1,
        "ComparisonOperator": "LessThanThreshold",
        "Dimensions": [
          {
            "Name": "ClusterName",
            "Value": {"Ref": "ECSCluster"}
          },
          {
            "Name": "ServiceName",
            "Value": {"Fn::GetAtt": ["ECSService", "Name"]}
          }
        ],
        "AlarmActions": [
          {"Ref": "AlertTopic"}
        ],
        "TreatMissingData": "breaching"
      }
    },

    "RDSCPUAlarm": {
      "Type": "AWS::CloudWatch::Alarm",
      "Properties": {
        "AlarmName": {"Fn::Sub": "rds-cpu-high-${EnvironmentSuffix}"},
        "AlarmDescription": "Alert when RDS CPU exceeds 80%",
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
            "Value": {"Ref": "DBCluster"}
          }
        ],
        "AlarmActions": [
          {"Ref": "AlertTopic"}
        ]
      }
    },

    "CloudWatchDashboard": {
      "Type": "AWS::CloudWatch::Dashboard",
      "Properties": {
        "DashboardName": {"Fn::Sub": "loan-app-dashboard-${EnvironmentSuffix}"},
        "DashboardBody": {"Fn::Sub": "{\"widgets\":[{\"type\":\"metric\",\"properties\":{\"metrics\":[[\"AWS/ApplicationELB\",\"RequestCount\",{\"stat\":\"Sum\",\"label\":\"Total Requests\"}],[\"AWS/ApplicationELB\",\"TargetResponseTime\",{\"stat\":\"Average\",\"label\":\"Response Time\"}],[\"AWS/ApplicationELB\",\"HealthyHostCount\",{\"stat\":\"Average\",\"label\":\"Healthy Targets\"}]],\"period\":300,\"stat\":\"Average\",\"region\":\"${AWS::Region}\",\"title\":\"ALB Metrics\",\"yAxis\":{\"left\":{\"min\":0}}}},{\"type\":\"metric\",\"properties\":{\"metrics\":[[\"ECS/ContainerInsights\",\"CpuUtilized\",{\"stat\":\"Average\",\"label\":\"CPU\"}],[\"ECS/ContainerInsights\",\"MemoryUtilized\",{\"stat\":\"Average\",\"label\":\"Memory\"}],[\"ECS/ContainerInsights\",\"RunningTaskCount\",{\"stat\":\"Average\",\"label\":\"Task Count\"}]],\"period\":300,\"stat\":\"Average\",\"region\":\"${AWS::Region}\",\"title\":\"ECS Metrics\",\"yAxis\":{\"left\":{\"min\":0}}}},{\"type\":\"metric\",\"properties\":{\"metrics\":[[\"AWS/RDS\",\"DatabaseConnections\",{\"stat\":\"Average\",\"label\":\"Connections\"}],[\"AWS/RDS\",\"CPUUtilization\",{\"stat\":\"Average\",\"label\":\"CPU %\"}],[\"AWS/RDS\",\"FreeableMemory\",{\"stat\":\"Average\",\"label\":\"Free Memory\"}]],\"period\":300,\"stat\":\"Average\",\"region\":\"${AWS::Region}\",\"title\":\"RDS Metrics\",\"yAxis\":{\"left\":{\"min\":0}}}}]}"}
      }
    }
  },

  "Outputs": {
    "VPCId": {
      "Description": "VPC ID",
      "Value": {"Ref": "VPC"},
      "Export": {
        "Name": {"Fn::Sub": "${AWS::StackName}-VPC"}
      }
    },
    "ALBDNSName": {
      "Description": "Application Load Balancer DNS name",
      "Value": {"Fn::GetAtt": ["ApplicationLoadBalancer", "DNSName"]},
      "Export": {
        "Name": {"Fn::Sub": "${AWS::StackName}-ALB-DNS"}
      }
    },
    "ALBUrl": {
      "Description": "Application Load Balancer URL",
      "Value": {"Fn::Sub": "http://${ApplicationLoadBalancer.DNSName}"}
    },
    "ECSClusterName": {
      "Description": "ECS Cluster Name",
      "Value": {"Ref": "ECSCluster"},
      "Export": {
        "Name": {"Fn::Sub": "${AWS::StackName}-ECS-Cluster"}
      }
    },
    "ECSServiceName": {
      "Description": "ECS Service Name",
      "Value": {"Fn::GetAtt": ["ECSService", "Name"]}
    },
    "DBClusterEndpoint": {
      "Description": "Aurora cluster endpoint",
      "Value": {"Fn::GetAtt": ["DBCluster", "Endpoint.Address"]},
      "Export": {
        "Name": {"Fn::Sub": "${AWS::StackName}-DB-Endpoint"}
      }
    },
    "DBClusterReadEndpoint": {
      "Description": "Aurora cluster read endpoint",
      "Value": {"Fn::GetAtt": ["DBCluster", "ReadEndpoint.Address"]},
      "Export": {
        "Name": {"Fn::Sub": "${AWS::StackName}-DB-Read-Endpoint"}
      }
    },
    "DBSecretArn": {
      "Description": "ARN of database credentials secret",
      "Value": {"Ref": "DBSecret"}
    },
    "StaticAssetsBucketName": {
      "Description": "S3 bucket name for static assets",
      "Value": {"Ref": "StaticAssetsBucket"},
      "Export": {
        "Name": {"Fn::Sub": "${AWS::StackName}-S3-Bucket"}
      }
    },
    "CloudFrontDistributionId": {
      "Description": "CloudFront distribution ID",
      "Value": {"Ref": "CloudFrontDistribution"}
    },
    "CloudFrontDomainName": {
      "Description": "CloudFront distribution domain name",
      "Value": {"Fn::GetAtt": ["CloudFrontDistribution", "DomainName"]},
      "Export": {
        "Name": {"Fn::Sub": "${AWS::StackName}-CloudFront-Domain"}
      }
    },
    "CloudFrontUrl": {
      "Description": "CloudFront URL for static assets",
      "Value": {"Fn::Sub": "https://${CloudFrontDistribution.DomainName}"}
    },
    "SNSTopicArn": {
      "Description": "SNS topic ARN for alerts",
      "Value": {"Ref": "AlertTopic"}
    },
    "CloudWatchDashboardName": {
      "Description": "CloudWatch Dashboard name",
      "Value": {"Ref": "CloudWatchDashboard"}
    },
    "CloudWatchLogGroup": {
      "Description": "CloudWatch Logs group for ECS",
      "Value": {"Ref": "ECSLogGroup"}
    }
  }
}
```

## Deployment Instructions

1. **Prerequisites**:
   - AWS CLI configured with appropriate credentials
   - Permissions to create VPC, ECS, RDS, S3, CloudFront, and IAM resources
   - A container image pushed to ECR or Docker Hub
   - An email address for SNS notifications

2. **Deploy the stack**:
   ```bash
   aws cloudformation create-stack \
     --stack-name loan-app-prod \
     --template-body file://lib/TapStack.json \
     --parameters \
       ParameterKey=EnvironmentSuffix,ParameterValue=prod \
       ParameterKey=ContainerImage,ParameterValue=YOUR_ECR_IMAGE_URI \
       ParameterKey=AlertEmail,ParameterValue=ops@yourcompany.com \
       ParameterKey=FrontendDomain,ParameterValue=https://yourapp.com \
     --capabilities CAPABILITY_NAMED_IAM \
     --region us-east-2
   ```

3. **Monitor deployment**:
   ```bash
   aws cloudformation describe-stacks \
     --stack-name loan-app-prod \
     --query 'Stacks[0].StackStatus' \
     --region us-east-2
   ```

4. **Get outputs**:
   ```bash
   aws cloudformation describe-stacks \
     --stack-name loan-app-prod \
     --query 'Stacks[0].Outputs' \
     --region us-east-2
   ```

5. **Confirm SNS subscription**:
   - Check the email address specified in AlertEmail parameter
   - Confirm the SNS subscription to receive alerts

6. **Upload static assets to S3**:
   ```bash
   aws s3 sync ./static-assets s3://BUCKET_NAME/ --region us-east-2
   ```

7. **Test the application**:
   - Access the ALB URL from the outputs
   - Verify health endpoint: http://ALB_DNS_NAME/health
   - Test CloudFront distribution for static assets

## Architecture Features

- **Multi-AZ High Availability**: All components deployed across 3 availability zones
- **Auto Scaling**: ECS service scales from 2 to 10 tasks based on ALB request count
- **Security**: Network isolation with security groups, encrypted data at rest and in transit
- **Monitoring**: CloudWatch dashboard with metrics for ALB, ECS, and RDS
- **Alerting**: SNS notifications for task failures and high RDS CPU
- **Secrets Management**: Database credentials in Secrets Manager with automatic rotation
- **Compliance**: 30-day log retention, versioned S3 buckets with lifecycle policies
- **CDN**: CloudFront distribution for low-latency static asset delivery
- **Cost Optimization**: NAT Gateways in each AZ, Aurora with backup retention

## Resource Naming Convention

All resources follow the pattern: `{resource-type}-{environment-suffix}`

Example with EnvironmentSuffix=prod:
- VPC: vpc-prod
- ECS Cluster: loan-app-cluster-prod
- RDS Cluster: aurora-cluster-prod
- S3 Bucket: loan-app-static-assets-prod-{account-id}
- ALB: loan-app-alb-prod

## Clean Up

To delete all resources:

```bash
# First disable deletion protection on RDS cluster
aws rds modify-db-cluster \
  --db-cluster-identifier aurora-cluster-prod \
  --no-deletion-protection \
  --apply-immediately \
  --region us-east-2

# Delete the stack
aws cloudformation delete-stack \
  --stack-name loan-app-prod \
  --region us-east-2
```

Note: S3 bucket must be empty before stack deletion. Use `aws s3 rm s3://BUCKET_NAME --recursive` if needed.
