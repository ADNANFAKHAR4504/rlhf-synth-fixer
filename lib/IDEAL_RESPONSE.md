# CloudFormation Infrastructure for Containerized Product Catalog API

This solution creates a production-ready containerized product catalog API using ECS Fargate with RDS Aurora Serverless v2 database backend.

## Architecture Overview

The infrastructure includes:
- VPC with public and private subnets across 2 Availability Zones
- Application Load Balancer in public subnets
- ECS Fargate service running in private subnets
- RDS Aurora Serverless v2 PostgreSQL database in private subnets
- Secrets Manager for database credentials
- IAM roles for ECS task execution and application access
- CloudWatch log groups for monitoring

## File: lib/TapStack.json

```json
{
  "AWSTemplateFormatVersion": "2010-09-09",
  "Description": "Production-ready containerized product catalog API with RDS Aurora Serverless v2 database",
  "Parameters": {
    "EnvironmentSuffix": {
      "Type": "String",
      "Description": "Unique suffix for resource naming to avoid conflicts",
      "Default": "dev"
    },
    "VpcCidr": {
      "Type": "String",
      "Description": "CIDR block for VPC",
      "Default": "10.0.0.0/16"
    },
    "ContainerImage": {
      "Type": "String",
      "Description": "Docker image for the product catalog API",
      "Default": "nginx:latest"
    },
    "ContainerPort": {
      "Type": "Number",
      "Description": "Port exposed by the container",
      "Default": 80
    },
    "TaskCpu": {
      "Type": "String",
      "Description": "CPU units for ECS task (256, 512, 1024, 2048, 4096)",
      "Default": "512",
      "AllowedValues": ["256", "512", "1024", "2048", "4096"]
    },
    "TaskMemory": {
      "Type": "String",
      "Description": "Memory for ECS task in MB",
      "Default": "1024",
      "AllowedValues": ["512", "1024", "2048", "4096", "8192"]
    },
    "DesiredCount": {
      "Type": "Number",
      "Description": "Desired number of ECS tasks",
      "Default": 2,
      "MinValue": 1,
      "MaxValue": 10
    },
    "MinCapacity": {
      "Type": "Number",
      "Description": "Minimum number of ECS tasks for auto-scaling",
      "Default": 1,
      "MinValue": 1
    },
    "MaxCapacity": {
      "Type": "Number",
      "Description": "Maximum number of ECS tasks for auto-scaling",
      "Default": 4,
      "MinValue": 1,
      "MaxValue": 20
    },
    "DatabaseName": {
      "Type": "String",
      "Description": "Name of the PostgreSQL database",
      "Default": "productcatalog"
    },
    "DatabaseUsername": {
      "Type": "String",
      "Description": "Master username for database",
      "Default": "dbadmin",
      "NoEcho": true
    },
    "MinDatabaseCapacity": {
      "Type": "Number",
      "Description": "Minimum ACUs for Aurora Serverless v2",
      "Default": 0.5,
      "MinValue": 0.5,
      "MaxValue": 128
    },
    "MaxDatabaseCapacity": {
      "Type": "Number",
      "Description": "Maximum ACUs for Aurora Serverless v2",
      "Default": 2,
      "MinValue": 0.5,
      "MaxValue": 128
    }
  },
  "Resources": {
    "VPC": {
      "Type": "AWS::EC2::VPC",
      "Properties": {
        "CidrBlock": {"Ref": "VpcCidr"},
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
    "NatGatewayEIP": {
      "Type": "AWS::EC2::EIP",
      "DependsOn": "AttachGateway",
      "Properties": {
        "Domain": "vpc",
        "Tags": [
          {
            "Key": "Name",
            "Value": {"Fn::Sub": "nat-eip-${EnvironmentSuffix}"}
          }
        ]
      }
    },
    "NatGateway": {
      "Type": "AWS::EC2::NatGateway",
      "Properties": {
        "AllocationId": {"Fn::GetAtt": ["NatGatewayEIP", "AllocationId"]},
        "SubnetId": {"Ref": "PublicSubnet1"},
        "Tags": [
          {
            "Key": "Name",
            "Value": {"Fn::Sub": "nat-gateway-${EnvironmentSuffix}"}
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
    "PrivateRoute": {
      "Type": "AWS::EC2::Route",
      "Properties": {
        "RouteTableId": {"Ref": "PrivateRouteTable"},
        "DestinationCidrBlock": "0.0.0.0/0",
        "NatGatewayId": {"Ref": "NatGateway"}
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
    "ALBSecurityGroup": {
      "Type": "AWS::EC2::SecurityGroup",
      "Properties": {
        "GroupName": {"Fn::Sub": "alb-sg-${EnvironmentSuffix}"},
        "GroupDescription": "Security group for Application Load Balancer",
        "VpcId": {"Ref": "VPC"},
        "SecurityGroupIngress": [
          {
            "IpProtocol": "tcp",
            "FromPort": 80,
            "ToPort": 80,
            "CidrIp": "0.0.0.0/0",
            "Description": "Allow HTTP traffic from internet"
          }
        ],
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
            "Value": {"Fn::Sub": "alb-sg-${EnvironmentSuffix}"}
          }
        ]
      }
    },
    "ECSSecurityGroup": {
      "Type": "AWS::EC2::SecurityGroup",
      "Properties": {
        "GroupName": {"Fn::Sub": "ecs-sg-${EnvironmentSuffix}"},
        "GroupDescription": "Security group for ECS tasks",
        "VpcId": {"Ref": "VPC"},
        "SecurityGroupIngress": [
          {
            "IpProtocol": "tcp",
            "FromPort": {"Ref": "ContainerPort"},
            "ToPort": {"Ref": "ContainerPort"},
            "SourceSecurityGroupId": {"Ref": "ALBSecurityGroup"},
            "Description": "Allow traffic from ALB"
          }
        ],
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
            "Value": {"Fn::Sub": "ecs-sg-${EnvironmentSuffix}"}
          }
        ]
      }
    },
    "DatabaseSecurityGroup": {
      "Type": "AWS::EC2::SecurityGroup",
      "Properties": {
        "GroupName": {"Fn::Sub": "database-sg-${EnvironmentSuffix}"},
        "GroupDescription": "Security group for RDS database",
        "VpcId": {"Ref": "VPC"},
        "SecurityGroupIngress": [
          {
            "IpProtocol": "tcp",
            "FromPort": 5432,
            "ToPort": 5432,
            "SourceSecurityGroupId": {"Ref": "ECSSecurityGroup"},
            "Description": "Allow PostgreSQL traffic from ECS tasks"
          }
        ],
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
            "Value": {"Fn::Sub": "database-sg-${EnvironmentSuffix}"}
          }
        ]
      }
    },
    "ApplicationLoadBalancer": {
      "Type": "AWS::ElasticLoadBalancingV2::LoadBalancer",
      "Properties": {
        "Name": {"Fn::Sub": "alb-${EnvironmentSuffix}"},
        "Type": "application",
        "Scheme": "internet-facing",
        "IpAddressType": "ipv4",
        "Subnets": [
          {"Ref": "PublicSubnet1"},
          {"Ref": "PublicSubnet2"}
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
        "Name": {"Fn::Sub": "tg-${EnvironmentSuffix}"},
        "Port": {"Ref": "ContainerPort"},
        "Protocol": "HTTP",
        "TargetType": "ip",
        "VpcId": {"Ref": "VPC"},
        "HealthCheckEnabled": true,
        "HealthCheckIntervalSeconds": 30,
        "HealthCheckPath": "/",
        "HealthCheckProtocol": "HTTP",
        "HealthCheckTimeoutSeconds": 5,
        "HealthyThresholdCount": 2,
        "UnhealthyThresholdCount": 3,
        "Matcher": {
          "HttpCode": "200-299"
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": {"Fn::Sub": "tg-${EnvironmentSuffix}"}
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
    "DatabaseSecret": {
      "Type": "AWS::SecretsManager::Secret",
      "Properties": {
        "Name": {"Fn::Sub": "database-credentials-${EnvironmentSuffix}"},
        "Description": "Database credentials for product catalog",
        "GenerateSecretString": {
          "SecretStringTemplate": {"Fn::Sub": "{\"username\":\"${DatabaseUsername}\"}"},
          "GenerateStringKey": "password",
          "PasswordLength": 32,
          "ExcludeCharacters": "\"@/\\"
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": {"Fn::Sub": "database-credentials-${EnvironmentSuffix}"}
          }
        ]
      }
    },
    "DBSubnetGroup": {
      "Type": "AWS::RDS::DBSubnetGroup",
      "Properties": {
        "DBSubnetGroupName": {"Fn::Sub": "db-subnet-group-${EnvironmentSuffix}"},
        "DBSubnetGroupDescription": "Subnet group for RDS Aurora",
        "SubnetIds": [
          {"Ref": "PrivateSubnet1"},
          {"Ref": "PrivateSubnet2"}
        ],
        "Tags": [
          {
            "Key": "Name",
            "Value": {"Fn::Sub": "db-subnet-group-${EnvironmentSuffix}"}
          }
        ]
      }
    },
    "DBCluster": {
      "Type": "AWS::RDS::DBCluster",
      "Properties": {
        "DBClusterIdentifier": {"Fn::Sub": "aurora-cluster-${EnvironmentSuffix}"},
        "Engine": "aurora-postgresql",
        "EngineVersion": "16.1",
        "EngineMode": "provisioned",
        "DatabaseName": {"Ref": "DatabaseName"},
        "MasterUsername": {"Fn::Sub": "{{resolve:secretsmanager:${DatabaseSecret}:SecretString:username}}"},
        "MasterUserPassword": {"Fn::Sub": "{{resolve:secretsmanager:${DatabaseSecret}:SecretString:password}}"},
        "DBSubnetGroupName": {"Ref": "DBSubnetGroup"},
        "VpcSecurityGroupIds": [{"Ref": "DatabaseSecurityGroup"}],
        "BackupRetentionPeriod": 1,
        "PreferredBackupWindow": "03:00-04:00",
        "PreferredMaintenanceWindow": "mon:04:00-mon:05:00",
        "StorageEncrypted": true,
        "ServerlessV2ScalingConfiguration": {
          "MinCapacity": {"Ref": "MinDatabaseCapacity"},
          "MaxCapacity": {"Ref": "MaxDatabaseCapacity"}
        },
        "EnableCloudwatchLogsExports": ["postgresql"],
        "Tags": [
          {
            "Key": "Name",
            "Value": {"Fn::Sub": "aurora-cluster-${EnvironmentSuffix}"}
          }
        ]
      }
    },
    "DBInstance": {
      "Type": "AWS::RDS::DBInstance",
      "Properties": {
        "DBInstanceIdentifier": {"Fn::Sub": "aurora-instance-${EnvironmentSuffix}"},
        "DBClusterIdentifier": {"Ref": "DBCluster"},
        "DBInstanceClass": "db.serverless",
        "Engine": "aurora-postgresql",
        "PubliclyAccessible": false,
        "Tags": [
          {
            "Key": "Name",
            "Value": {"Fn::Sub": "aurora-instance-${EnvironmentSuffix}"}
          }
        ]
      }
    },
    "ECSCluster": {
      "Type": "AWS::ECS::Cluster",
      "Properties": {
        "ClusterName": {"Fn::Sub": "ecs-cluster-${EnvironmentSuffix}"},
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
                    "secretsmanager:GetSecretValue",
                    "secretsmanager:DescribeSecret"
                  ],
                  "Resource": {"Ref": "DatabaseSecret"}
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
            "PolicyName": "ApplicationPermissions",
            "PolicyDocument": {
              "Version": "2012-10-17",
              "Statement": [
                {
                  "Effect": "Allow",
                  "Action": [
                    "secretsmanager:GetSecretValue",
                    "secretsmanager:DescribeSecret"
                  ],
                  "Resource": {"Ref": "DatabaseSecret"}
                },
                {
                  "Effect": "Allow",
                  "Action": [
                    "logs:CreateLogStream",
                    "logs:PutLogEvents"
                  ],
                  "Resource": {"Fn::GetAtt": ["ApplicationLogGroup", "Arn"]}
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
    "ApplicationLogGroup": {
      "Type": "AWS::Logs::LogGroup",
      "Properties": {
        "LogGroupName": {"Fn::Sub": "/ecs/product-catalog-${EnvironmentSuffix}"},
        "RetentionInDays": 7
      }
    },
    "ECSTaskDefinition": {
      "Type": "AWS::ECS::TaskDefinition",
      "Properties": {
        "Family": {"Fn::Sub": "product-catalog-task-${EnvironmentSuffix}"},
        "NetworkMode": "awsvpc",
        "RequiresCompatibilities": ["FARGATE"],
        "Cpu": {"Ref": "TaskCpu"},
        "Memory": {"Ref": "TaskMemory"},
        "ExecutionRoleArn": {"Fn::GetAtt": ["ECSTaskExecutionRole", "Arn"]},
        "TaskRoleArn": {"Fn::GetAtt": ["ECSTaskRole", "Arn"]},
        "ContainerDefinitions": [
          {
            "Name": "product-catalog-api",
            "Image": {"Ref": "ContainerImage"},
            "PortMappings": [
              {
                "ContainerPort": {"Ref": "ContainerPort"},
                "Protocol": "tcp"
              }
            ],
            "Environment": [
              {
                "Name": "DATABASE_NAME",
                "Value": {"Ref": "DatabaseName"}
              },
              {
                "Name": "DATABASE_HOST",
                "Value": {"Fn::GetAtt": ["DBCluster", "Endpoint.Address"]}
              },
              {
                "Name": "DATABASE_PORT",
                "Value": "5432"
              }
            ],
            "Secrets": [
              {
                "Name": "DATABASE_USERNAME",
                "ValueFrom": {"Fn::Sub": "${DatabaseSecret}:username::"}
              },
              {
                "Name": "DATABASE_PASSWORD",
                "ValueFrom": {"Fn::Sub": "${DatabaseSecret}:password::"}
              }
            ],
            "LogConfiguration": {
              "LogDriver": "awslogs",
              "Options": {
                "awslogs-group": {"Ref": "ApplicationLogGroup"},
                "awslogs-region": {"Ref": "AWS::Region"},
                "awslogs-stream-prefix": "ecs"
              }
            },
            "Essential": true
          }
        ],
        "Tags": [
          {
            "Key": "Name",
            "Value": {"Fn::Sub": "product-catalog-task-${EnvironmentSuffix}"}
          }
        ]
      }
    },
    "ECSService": {
      "Type": "AWS::ECS::Service",
      "DependsOn": "ALBListener",
      "Properties": {
        "ServiceName": {"Fn::Sub": "product-catalog-service-${EnvironmentSuffix}"},
        "Cluster": {"Ref": "ECSCluster"},
        "TaskDefinition": {"Ref": "ECSTaskDefinition"},
        "DesiredCount": {"Ref": "DesiredCount"},
        "LaunchType": "FARGATE",
        "NetworkConfiguration": {
          "AwsvpcConfiguration": {
            "AssignPublicIp": "DISABLED",
            "Subnets": [
              {"Ref": "PrivateSubnet1"},
              {"Ref": "PrivateSubnet2"}
            ],
            "SecurityGroups": [{"Ref": "ECSSecurityGroup"}]
          }
        },
        "LoadBalancers": [
          {
            "ContainerName": "product-catalog-api",
            "ContainerPort": {"Ref": "ContainerPort"},
            "TargetGroupArn": {"Ref": "ALBTargetGroup"}
          }
        ],
        "HealthCheckGracePeriodSeconds": 60,
        "Tags": [
          {
            "Key": "Name",
            "Value": {"Fn::Sub": "product-catalog-service-${EnvironmentSuffix}"}
          }
        ]
      }
    },
    "ServiceAutoScalingTarget": {
      "Type": "AWS::ApplicationAutoScaling::ScalableTarget",
      "Properties": {
        "MaxCapacity": {"Ref": "MaxCapacity"},
        "MinCapacity": {"Ref": "MinCapacity"},
        "ResourceId": {"Fn::Sub": "service/${ECSCluster}/${ECSService.Name}"},
        "RoleARN": {"Fn::Sub": "arn:aws:iam::${AWS::AccountId}:role/aws-service-role/ecs.application-autoscaling.amazonaws.com/AWSServiceRoleForApplicationAutoScaling_ECSService"},
        "ScalableDimension": "ecs:service:DesiredCount",
        "ServiceNamespace": "ecs"
      }
    },
    "ServiceScalingPolicyCPU": {
      "Type": "AWS::ApplicationAutoScaling::ScalingPolicy",
      "Properties": {
        "PolicyName": {"Fn::Sub": "cpu-scaling-policy-${EnvironmentSuffix}"},
        "PolicyType": "TargetTrackingScaling",
        "ScalingTargetId": {"Ref": "ServiceAutoScalingTarget"},
        "TargetTrackingScalingPolicyConfiguration": {
          "TargetValue": 70.0,
          "PredefinedMetricSpecification": {
            "PredefinedMetricType": "ECSServiceAverageCPUUtilization"
          },
          "ScaleInCooldown": 300,
          "ScaleOutCooldown": 60
        }
      }
    },
    "ServiceScalingPolicyMemory": {
      "Type": "AWS::ApplicationAutoScaling::ScalingPolicy",
      "Properties": {
        "PolicyName": {"Fn::Sub": "memory-scaling-policy-${EnvironmentSuffix}"},
        "PolicyType": "TargetTrackingScaling",
        "ScalingTargetId": {"Ref": "ServiceAutoScalingTarget"},
        "TargetTrackingScalingPolicyConfiguration": {
          "TargetValue": 80.0,
          "PredefinedMetricSpecification": {
            "PredefinedMetricType": "ECSServiceAverageMemoryUtilization"
          },
          "ScaleInCooldown": 300,
          "ScaleOutCooldown": 60
        }
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
    "PublicSubnet1Id": {
      "Description": "Public Subnet 1 ID",
      "Value": {"Ref": "PublicSubnet1"},
      "Export": {
        "Name": {"Fn::Sub": "${AWS::StackName}-PublicSubnet1"}
      }
    },
    "PublicSubnet2Id": {
      "Description": "Public Subnet 2 ID",
      "Value": {"Ref": "PublicSubnet2"},
      "Export": {
        "Name": {"Fn::Sub": "${AWS::StackName}-PublicSubnet2"}
      }
    },
    "PrivateSubnet1Id": {
      "Description": "Private Subnet 1 ID",
      "Value": {"Ref": "PrivateSubnet1"},
      "Export": {
        "Name": {"Fn::Sub": "${AWS::StackName}-PrivateSubnet1"}
      }
    },
    "PrivateSubnet2Id": {
      "Description": "Private Subnet 2 ID",
      "Value": {"Ref": "PrivateSubnet2"},
      "Export": {
        "Name": {"Fn::Sub": "${AWS::StackName}-PrivateSubnet2"}
      }
    },
    "LoadBalancerDNS": {
      "Description": "DNS name of the Application Load Balancer",
      "Value": {"Fn::GetAtt": ["ApplicationLoadBalancer", "DNSName"]},
      "Export": {
        "Name": {"Fn::Sub": "${AWS::StackName}-ALBDNSName"}
      }
    },
    "LoadBalancerURL": {
      "Description": "URL of the Application Load Balancer",
      "Value": {"Fn::Sub": "http://${ApplicationLoadBalancer.DNSName}"}
    },
    "ECSClusterName": {
      "Description": "Name of the ECS Cluster",
      "Value": {"Ref": "ECSCluster"},
      "Export": {
        "Name": {"Fn::Sub": "${AWS::StackName}-ECSCluster"}
      }
    },
    "ECSServiceName": {
      "Description": "Name of the ECS Service",
      "Value": {"Fn::GetAtt": ["ECSService", "Name"]},
      "Export": {
        "Name": {"Fn::Sub": "${AWS::StackName}-ECSService"}
      }
    },
    "DatabaseClusterEndpoint": {
      "Description": "Aurora cluster endpoint",
      "Value": {"Fn::GetAtt": ["DBCluster", "Endpoint.Address"]},
      "Export": {
        "Name": {"Fn::Sub": "${AWS::StackName}-DatabaseEndpoint"}
      }
    },
    "DatabaseClusterReadEndpoint": {
      "Description": "Aurora cluster read endpoint",
      "Value": {"Fn::GetAtt": ["DBCluster", "ReadEndpoint.Address"]},
      "Export": {
        "Name": {"Fn::Sub": "${AWS::StackName}-DatabaseReadEndpoint"}
      }
    },
    "DatabaseName": {
      "Description": "Database name",
      "Value": {"Ref": "DatabaseName"}
    },
    "DatabaseSecretArn": {
      "Description": "ARN of the database credentials secret",
      "Value": {"Ref": "DatabaseSecret"},
      "Export": {
        "Name": {"Fn::Sub": "${AWS::StackName}-DatabaseSecret"}
      }
    },
    "ApplicationLogGroup": {
      "Description": "CloudWatch log group for application logs",
      "Value": {"Ref": "ApplicationLogGroup"},
      "Export": {
        "Name": {"Fn::Sub": "${AWS::StackName}-LogGroup"}
      }
    }
  }
}
```

## Deployment Instructions

1. Save the CloudFormation template to `lib/TapStack.json`

2. Deploy the stack using AWS CLI:
   ```bash
   aws cloudformation create-stack \
     --stack-name product-catalog-stack \
     --template-body file://lib/TapStack.json \
     --parameters ParameterKey=EnvironmentSuffix,ParameterValue=dev \
     --capabilities CAPABILITY_NAMED_IAM \
     --region us-east-1
   ```

3. Monitor the stack creation:
   ```bash
   aws cloudformation describe-stacks \
     --stack-name product-catalog-stack \
     --region us-east-1
   ```

4. Get the ALB DNS name from outputs:
   ```bash
   aws cloudformation describe-stacks \
     --stack-name product-catalog-stack \
     --query 'Stacks[0].Outputs[?OutputKey==`LoadBalancerURL`].OutputValue' \
     --output text \
     --region us-east-1
   ```

5. Access the application via the ALB URL

## Resource Overview

The template creates the following AWS resources:

**Networking (12 resources)**:
- 1 VPC
- 1 Internet Gateway
- 2 Public Subnets (Multi-AZ)
- 2 Private Subnets (Multi-AZ)
- 1 NAT Gateway with Elastic IP
- 2 Route Tables (public and private)
- 4 Route Table Associations

**Security (3 resources)**:
- ALB Security Group
- ECS Security Group
- Database Security Group

**Load Balancing (3 resources)**:
- Application Load Balancer
- Target Group
- HTTP Listener

**Container Platform (6 resources)**:
- ECS Cluster with Container Insights
- ECS Task Definition
- ECS Service
- Task Execution IAM Role
- Task IAM Role
- CloudWatch Log Group

**Database (4 resources)**:
- Aurora Serverless v2 Cluster
- Aurora Instance
- DB Subnet Group
- Secrets Manager Secret

**Auto Scaling (3 resources)**:
- Scalable Target
- CPU-based Scaling Policy
- Memory-based Scaling Policy

**Total: 31 CloudFormation resources**

## Key Features

1. **High Availability**: Multi-AZ deployment across 2 Availability Zones
2. **Serverless Components**: Fargate and Aurora Serverless v2 for cost optimization
3. **Security**:
   - Private subnets for application and database
   - Security groups with least privilege
   - Secrets Manager for credentials
   - Encryption at rest for database
4. **Scalability**: Auto-scaling based on CPU and memory metrics
5. **Observability**: CloudWatch logs with Container Insights
6. **Flexibility**: Parameterized for different environments
7. **Resource Naming**: All resources include environmentSuffix for uniqueness

## Cost Considerations

- **Aurora Serverless v2**: ~$0.12/ACU-hour (0.5-2 ACUs = $0.06-$0.24/hour)
- **Fargate**: ~$0.04/vCPU-hour + ~$0.004/GB-hour (2 tasks = ~$0.10/hour)
- **NAT Gateway**: ~$0.045/hour + data transfer
- **ALB**: ~$0.0225/hour + LCU charges
- **Total estimated**: ~$5-10/day depending on usage
