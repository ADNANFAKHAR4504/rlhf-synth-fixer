{
  "AWSTemplateFormatVersion": "2010-09-09",
  "Description": "ECS Batch Processing System for Transaction Reconciliation with Fargate, ALB, X-Ray, and Auto Scaling - Fully Self-Sufficient",
  "Parameters": {
    "EnvironmentSuffix": {
      "Type": "String",
      "Description": "Unique suffix for resource naming to ensure uniqueness",
      "AllowedPattern": "[a-z0-9-]+",
      "ConstraintDescription": "Must contain only lowercase letters, numbers, and hyphens"
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
              "Fn::Sub": "vpc-${EnvironmentSuffix}"
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
              "Fn::Sub": "igw-${EnvironmentSuffix}"
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
    "PublicSubnet1": {
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
        "MapPublicIpOnLaunch": true,
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "public-subnet-1-${EnvironmentSuffix}"
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
        "CidrBlock": "10.0.2.0/24",
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
              "Fn::Sub": "public-subnet-2-${EnvironmentSuffix}"
            }
          }
        ]
      }
    },
    "PrivateSubnet1": {
      "Type": "AWS::EC2::Subnet",
      "Properties": {
        "VpcId": {
          "Ref": "VPC"
        },
        "CidrBlock": "10.0.3.0/24",
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
              "Fn::Sub": "private-subnet-1-${EnvironmentSuffix}"
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
        "CidrBlock": "10.0.4.0/24",
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
              "Fn::Sub": "private-subnet-2-${EnvironmentSuffix}"
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
              "Fn::Sub": "public-rt-${EnvironmentSuffix}"
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
    "S3Bucket": {
      "Type": "AWS::S3::Bucket",
      "Properties": {
        "BucketName": {
          "Fn::Sub": "ecs-batch-output-${EnvironmentSuffix}-${AWS::AccountId}"
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
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "ecs-batch-output-${EnvironmentSuffix}"
            }
          }
        ]
      }
    },
    "DBSecret": {
      "Type": "AWS::SecretsManager::Secret",
      "Properties": {
        "Name": {
          "Fn::Sub": "db-credentials-${EnvironmentSuffix}"
        },
        "Description": "Database credentials for ECS tasks",
        "SecretString": "{\"username\":\"admin\",\"password\":\"changeme123\",\"engine\":\"postgres\",\"host\":\"localhost\",\"port\":5432,\"dbname\":\"transactions\"}"
      }
    },
    "ECSCluster": {
      "Type": "AWS::ECS::Cluster",
      "Properties": {
        "ClusterName": {
          "Fn::Sub": "ecs-cluster-${EnvironmentSuffix}"
        },
        "ClusterSettings": [
          {
            "Name": "containerInsights",
            "Value": "enabled"
          }
        ],
        "CapacityProviders": [
          "FARGATE",
          "FARGATE_SPOT"
        ],
        "DefaultCapacityProviderStrategy": [
          {
            "CapacityProvider": "FARGATE",
            "Weight": 1,
            "Base": 2
          }
        ],
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "ecs-cluster-${EnvironmentSuffix}"
            }
          }
        ]
      }
    },
    "TaskExecutionRole": {
      "Type": "AWS::IAM::Role",
      "Properties": {
        "RoleName": {
          "Fn::Sub": "ecs-task-execution-role-${EnvironmentSuffix}"
        },
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
                  "Resource": {
                    "Ref": "DBSecret"
                  }
                }
              ]
            }
          }
        ],
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "ecs-task-execution-role-${EnvironmentSuffix}"
            }
          }
        ]
      }
    },
    "TaskRole": {
      "Type": "AWS::IAM::Role",
      "Properties": {
        "RoleName": {
          "Fn::Sub": "ecs-task-role-${EnvironmentSuffix}"
        },
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
            "PolicyName": "S3WriteAccess",
            "PolicyDocument": {
              "Version": "2012-10-17",
              "Statement": [
                {
                  "Effect": "Allow",
                  "Action": [
                    "s3:PutObject",
                    "s3:PutObjectAcl",
                    "s3:GetObject",
                    "s3:ListBucket"
                  ],
                  "Resource": [
                    {
                      "Fn::GetAtt": [
                        "S3Bucket",
                        "Arn"
                      ]
                    },
                    {
                      "Fn::Sub": "${S3Bucket.Arn}/*"
                    }
                  ]
                }
              ]
            }
          },
          {
            "PolicyName": "SecretsManagerRead",
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
                    "Ref": "DBSecret"
                  }
                }
              ]
            }
          },
          {
            "PolicyName": "XRayAccess",
            "PolicyDocument": {
              "Version": "2012-10-17",
              "Statement": [
                {
                  "Effect": "Allow",
                  "Action": [
                    "xray:PutTraceSegments",
                    "xray:PutTelemetryRecords",
                    "xray:GetSamplingRules",
                    "xray:GetSamplingTargets",
                    "xray:GetSamplingStatisticSummaries"
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
            "Value": {
              "Fn::Sub": "ecs-task-role-${EnvironmentSuffix}"
            }
          }
        ]
      }
    },
    "DataIngestionLogGroup": {
      "Type": "AWS::Logs::LogGroup",
      "Properties": {
        "LogGroupName": {
          "Fn::Sub": "/ecs/data-ingestion-${EnvironmentSuffix}"
        },
        "RetentionInDays": 30
      }
    },
    "TransactionProcessingLogGroup": {
      "Type": "AWS::Logs::LogGroup",
      "Properties": {
        "LogGroupName": {
          "Fn::Sub": "/ecs/transaction-processing-${EnvironmentSuffix}"
        },
        "RetentionInDays": 30
      }
    },
    "ReportGenerationLogGroup": {
      "Type": "AWS::Logs::LogGroup",
      "Properties": {
        "LogGroupName": {
          "Fn::Sub": "/ecs/report-generation-${EnvironmentSuffix}"
        },
        "RetentionInDays": 30
      }
    },
    "XRayLogGroup": {
      "Type": "AWS::Logs::LogGroup",
      "Properties": {
        "LogGroupName": {
          "Fn::Sub": "/ecs/xray-${EnvironmentSuffix}"
        },
        "RetentionInDays": 30
      }
    },
    "DataIngestionTaskDefinition": {
      "Type": "AWS::ECS::TaskDefinition",
      "Properties": {
        "Family": {
          "Fn::Sub": "data-ingestion-${EnvironmentSuffix}"
        },
        "NetworkMode": "awsvpc",
        "RequiresCompatibilities": [
          "FARGATE"
        ],
        "Cpu": "1024",
        "Memory": "2048",
        "ExecutionRoleArn": {
          "Fn::GetAtt": [
            "TaskExecutionRole",
            "Arn"
          ]
        },
        "TaskRoleArn": {
          "Fn::GetAtt": [
            "TaskRole",
            "Arn"
          ]
        },
        "ContainerDefinitions": [
          {
            "Name": "data-ingestion",
            "Image": "public.ecr.aws/docker/library/busybox:latest",
            "Essential": true,
            "Memory": 1536,
            "Cpu": 768,
            "Command": [
              "sh",
              "-c",
              "while true; do echo 'Data ingestion running'; sleep 300; done"
            ],
            "Secrets": [
              {
                "Name": "DB_CREDENTIALS",
                "ValueFrom": {
                  "Ref": "DBSecret"
                }
              }
            ],
            "Environment": [
              {
                "Name": "S3_BUCKET",
                "Value": {
                  "Ref": "S3Bucket"
                }
              },
              {
                "Name": "AWS_REGION",
                "Value": "us-east-2"
              },
              {
                "Name": "AWS_XRAY_DAEMON_ADDRESS",
                "Value": "xray-daemon:2000"
              }
            ],
            "LogConfiguration": {
              "LogDriver": "awslogs",
              "Options": {
                "awslogs-group": {
                  "Ref": "DataIngestionLogGroup"
                },
                "awslogs-region": "us-east-2",
                "awslogs-stream-prefix": "data-ingestion"
              }
            },
            "HealthCheck": {
              "Command": [
                "CMD-SHELL",
                "exit 0"
              ],
              "Interval": 30,
              "Timeout": 5,
              "Retries": 3,
              "StartPeriod": 60
            }
          },
          {
            "Name": "xray-daemon",
            "Image": "public.ecr.aws/xray/aws-xray-daemon:latest",
            "Essential": false,
            "Memory": 512,
            "Cpu": 256,
            "PortMappings": [
              {
                "ContainerPort": 2000,
                "Protocol": "udp"
              }
            ],
            "LogConfiguration": {
              "LogDriver": "awslogs",
              "Options": {
                "awslogs-group": {
                  "Ref": "XRayLogGroup"
                },
                "awslogs-region": "us-east-2",
                "awslogs-stream-prefix": "xray-data-ingestion"
              }
            }
          }
        ],
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "data-ingestion-task-${EnvironmentSuffix}"
            }
          }
        ]
      }
    },
    "TransactionProcessingTaskDefinition": {
      "Type": "AWS::ECS::TaskDefinition",
      "Properties": {
        "Family": {
          "Fn::Sub": "transaction-processing-${EnvironmentSuffix}"
        },
        "NetworkMode": "awsvpc",
        "RequiresCompatibilities": [
          "FARGATE"
        ],
        "Cpu": "1024",
        "Memory": "2048",
        "ExecutionRoleArn": {
          "Fn::GetAtt": [
            "TaskExecutionRole",
            "Arn"
          ]
        },
        "TaskRoleArn": {
          "Fn::GetAtt": [
            "TaskRole",
            "Arn"
          ]
        },
        "ContainerDefinitions": [
          {
            "Name": "transaction-processing",
            "Image": "public.ecr.aws/docker/library/busybox:latest",
            "Essential": true,
            "Memory": 1536,
            "Cpu": 768,
            "Command": [
              "sh",
              "-c",
              "while true; do echo 'Transaction processing running'; sleep 300; done"
            ],
            "Secrets": [
              {
                "Name": "DB_CREDENTIALS",
                "ValueFrom": {
                  "Ref": "DBSecret"
                }
              }
            ],
            "Environment": [
              {
                "Name": "S3_BUCKET",
                "Value": {
                  "Ref": "S3Bucket"
                }
              },
              {
                "Name": "AWS_REGION",
                "Value": "us-east-2"
              },
              {
                "Name": "AWS_XRAY_DAEMON_ADDRESS",
                "Value": "xray-daemon:2000"
              }
            ],
            "LogConfiguration": {
              "LogDriver": "awslogs",
              "Options": {
                "awslogs-group": {
                  "Ref": "TransactionProcessingLogGroup"
                },
                "awslogs-region": "us-east-2",
                "awslogs-stream-prefix": "transaction-processing"
              }
            },
            "HealthCheck": {
              "Command": [
                "CMD-SHELL",
                "exit 0"
              ],
              "Interval": 30,
              "Timeout": 5,
              "Retries": 3,
              "StartPeriod": 60
            }
          },
          {
            "Name": "xray-daemon",
            "Image": "public.ecr.aws/xray/aws-xray-daemon:latest",
            "Essential": false,
            "Memory": 512,
            "Cpu": 256,
            "PortMappings": [
              {
                "ContainerPort": 2000,
                "Protocol": "udp"
              }
            ],
            "LogConfiguration": {
              "LogDriver": "awslogs",
              "Options": {
                "awslogs-group": {
                  "Ref": "XRayLogGroup"
                },
                "awslogs-region": "us-east-2",
                "awslogs-stream-prefix": "xray-transaction-processing"
              }
            }
          }
        ],
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "transaction-processing-task-${EnvironmentSuffix}"
            }
          }
        ]
      }
    },
    "ReportGenerationTaskDefinition": {
      "Type": "AWS::ECS::TaskDefinition",
      "Properties": {
        "Family": {
          "Fn::Sub": "report-generation-${EnvironmentSuffix}"
        },
        "NetworkMode": "awsvpc",
        "RequiresCompatibilities": [
          "FARGATE"
        ],
        "Cpu": "1024",
        "Memory": "2048",
        "ExecutionRoleArn": {
          "Fn::GetAtt": [
            "TaskExecutionRole",
            "Arn"
          ]
        },
        "TaskRoleArn": {
          "Fn::GetAtt": [
            "TaskRole",
            "Arn"
          ]
        },
        "ContainerDefinitions": [
          {
            "Name": "report-generation",
            "Image": "public.ecr.aws/nginx/nginx:latest",
            "Essential": true,
            "Memory": 1536,
            "Cpu": 768,
            "PortMappings": [
              {
                "ContainerPort": 80,
                "Protocol": "tcp"
              }
            ],
            "Secrets": [
              {
                "Name": "DB_CREDENTIALS",
                "ValueFrom": {
                  "Ref": "DBSecret"
                }
              }
            ],
            "Environment": [
              {
                "Name": "S3_BUCKET",
                "Value": {
                  "Ref": "S3Bucket"
                }
              },
              {
                "Name": "AWS_REGION",
                "Value": "us-east-2"
              },
              {
                "Name": "AWS_XRAY_DAEMON_ADDRESS",
                "Value": "xray-daemon:2000"
              }
            ],
            "LogConfiguration": {
              "LogDriver": "awslogs",
              "Options": {
                "awslogs-group": {
                  "Ref": "ReportGenerationLogGroup"
                },
                "awslogs-region": "us-east-2",
                "awslogs-stream-prefix": "report-generation"
              }
            },
            "HealthCheck": {
              "Command": [
                "CMD-SHELL",
                "exit 0"
              ],
              "Interval": 30,
              "Timeout": 5,
              "Retries": 3,
              "StartPeriod": 60
            }
          },
          {
            "Name": "xray-daemon",
            "Image": "public.ecr.aws/xray/aws-xray-daemon:latest",
            "Essential": false,
            "Memory": 512,
            "Cpu": 256,
            "PortMappings": [
              {
                "ContainerPort": 2000,
                "Protocol": "udp"
              }
            ],
            "LogConfiguration": {
              "LogDriver": "awslogs",
              "Options": {
                "awslogs-group": {
                  "Ref": "XRayLogGroup"
                },
                "awslogs-region": "us-east-2",
                "awslogs-stream-prefix": "xray-report-generation"
              }
            }
          }
        ],
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "report-generation-task-${EnvironmentSuffix}"
            }
          }
        ]
      }
    },
    "ECSSecurityGroup": {
      "Type": "AWS::EC2::SecurityGroup",
      "Properties": {
        "GroupName": {
          "Fn::Sub": "ecs-tasks-sg-${EnvironmentSuffix}"
        },
        "GroupDescription": "Security group for ECS tasks",
        "VpcId": {
          "Ref": "VPC"
        },
        "SecurityGroupIngress": [
          {
            "IpProtocol": "tcp",
            "FromPort": 80,
            "ToPort": 80,
            "SourceSecurityGroupId": {
              "Ref": "ALBSecurityGroup"
            },
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
            "Value": {
              "Fn::Sub": "ecs-tasks-sg-${EnvironmentSuffix}"
            }
          }
        ]
      }
    },
    "ALBSecurityGroup": {
      "Type": "AWS::EC2::SecurityGroup",
      "Properties": {
        "GroupName": {
          "Fn::Sub": "alb-sg-${EnvironmentSuffix}"
        },
        "GroupDescription": "Security group for Application Load Balancer",
        "VpcId": {
          "Ref": "VPC"
        },
        "SecurityGroupIngress": [
          {
            "IpProtocol": "tcp",
            "FromPort": 80,
            "ToPort": 80,
            "CidrIp": "0.0.0.0/0",
            "Description": "Allow HTTP traffic"
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
            "Value": {
              "Fn::Sub": "alb-sg-${EnvironmentSuffix}"
            }
          }
        ]
      }
    },
    "ApplicationLoadBalancer": {
      "Type": "AWS::ElasticLoadBalancingV2::LoadBalancer",
      "Properties": {
        "Name": {
          "Fn::Sub": "alb-${EnvironmentSuffix}"
        },
        "Type": "application",
        "Scheme": "internet-facing",
        "IpAddressType": "ipv4",
        "Subnets": [
          {
            "Ref": "PublicSubnet1"
          },
          {
            "Ref": "PublicSubnet2"
          }
        ],
        "SecurityGroups": [
          {
            "Ref": "ALBSecurityGroup"
          }
        ],
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "alb-${EnvironmentSuffix}"
            }
          }
        ]
      }
    },
    "ALBTargetGroup": {
      "Type": "AWS::ElasticLoadBalancingV2::TargetGroup",
      "Properties": {
        "Name": {
          "Fn::Sub": "tg-report-gen-${EnvironmentSuffix}"
        },
        "Port": 80,
        "Protocol": "HTTP",
        "TargetType": "ip",
        "VpcId": {
          "Ref": "VPC"
        },
        "HealthCheckEnabled": true,
        "HealthCheckProtocol": "HTTP",
        "HealthCheckPath": "/",
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
            "Value": {
              "Fn::Sub": "tg-report-gen-${EnvironmentSuffix}"
            }
          }
        ]
      }
    },
    "ALBListener": {
      "Type": "AWS::ElasticLoadBalancingV2::Listener",
      "Properties": {
        "LoadBalancerArn": {
          "Ref": "ApplicationLoadBalancer"
        },
        "Port": 80,
        "Protocol": "HTTP",
        "DefaultActions": [
          {
            "Type": "forward",
            "TargetGroupArn": {
              "Ref": "ALBTargetGroup"
            }
          }
        ]
      }
    },
    "DataIngestionService": {
      "Type": "AWS::ECS::Service",
      "Properties": {
        "ServiceName": {
          "Fn::Sub": "data-ingestion-service-${EnvironmentSuffix}"
        },
        "Cluster": {
          "Ref": "ECSCluster"
        },
        "TaskDefinition": {
          "Ref": "DataIngestionTaskDefinition"
        },
        "DesiredCount": 2,
        "LaunchType": "FARGATE",
        "NetworkConfiguration": {
          "AwsvpcConfiguration": {
            "AssignPublicIp": "ENABLED",
            "Subnets": [
              {
                "Ref": "PublicSubnet1"
              },
              {
                "Ref": "PublicSubnet2"
              }
            ],
            "SecurityGroups": [
              {
                "Ref": "ECSSecurityGroup"
              }
            ]
          }
        },
        "DeploymentConfiguration": {
          "MaximumPercent": 200,
          "MinimumHealthyPercent": 100,
          "DeploymentCircuitBreaker": {
            "Enable": true,
            "Rollback": true
          }
        },
        "EnableECSManagedTags": true,
        "PropagateTags": "SERVICE",
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "data-ingestion-service-${EnvironmentSuffix}"
            }
          }
        ]
      }
    },
    "TransactionProcessingService": {
      "Type": "AWS::ECS::Service",
      "Properties": {
        "ServiceName": {
          "Fn::Sub": "transaction-processing-service-${EnvironmentSuffix}"
        },
        "Cluster": {
          "Ref": "ECSCluster"
        },
        "TaskDefinition": {
          "Ref": "TransactionProcessingTaskDefinition"
        },
        "DesiredCount": 2,
        "LaunchType": "FARGATE",
        "NetworkConfiguration": {
          "AwsvpcConfiguration": {
            "AssignPublicIp": "ENABLED",
            "Subnets": [
              {
                "Ref": "PublicSubnet1"
              },
              {
                "Ref": "PublicSubnet2"
              }
            ],
            "SecurityGroups": [
              {
                "Ref": "ECSSecurityGroup"
              }
            ]
          }
        },
        "DeploymentConfiguration": {
          "MaximumPercent": 200,
          "MinimumHealthyPercent": 100,
          "DeploymentCircuitBreaker": {
            "Enable": true,
            "Rollback": true
          }
        },
        "EnableECSManagedTags": true,
        "PropagateTags": "SERVICE",
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "transaction-processing-service-${EnvironmentSuffix}"
            }
          }
        ]
      }
    },
    "ReportGenerationService": {
      "Type": "AWS::ECS::Service",
      "DependsOn": [
        "ALBListener"
      ],
      "Properties": {
        "ServiceName": {
          "Fn::Sub": "report-generation-service-${EnvironmentSuffix}"
        },
        "Cluster": {
          "Ref": "ECSCluster"
        },
        "TaskDefinition": {
          "Ref": "ReportGenerationTaskDefinition"
        },
        "DesiredCount": 2,
        "LaunchType": "FARGATE",
        "NetworkConfiguration": {
          "AwsvpcConfiguration": {
            "AssignPublicIp": "ENABLED",
            "Subnets": [
              {
                "Ref": "PublicSubnet1"
              },
              {
                "Ref": "PublicSubnet2"
              }
            ],
            "SecurityGroups": [
              {
                "Ref": "ECSSecurityGroup"
              }
            ]
          }
        },
        "LoadBalancers": [
          {
            "ContainerName": "report-generation",
            "ContainerPort": 80,
            "TargetGroupArn": {
              "Ref": "ALBTargetGroup"
            }
          }
        ],
        "DeploymentConfiguration": {
          "MaximumPercent": 200,
          "MinimumHealthyPercent": 100,
          "DeploymentCircuitBreaker": {
            "Enable": true,
            "Rollback": true
          }
        },
        "EnableECSManagedTags": true,
        "PropagateTags": "SERVICE",
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "report-generation-service-${EnvironmentSuffix}"
            }
          }
        ]
      }
    },
    "DataIngestionScalableTarget": {
      "Type": "AWS::ApplicationAutoScaling::ScalableTarget",
      "Properties": {
        "MaxCapacity": 10,
        "MinCapacity": 2,
        "ResourceId": {
          "Fn::Join": [
            "/",
            [
              "service",
              {
                "Ref": "ECSCluster"
              },
              {
                "Fn::GetAtt": [
                  "DataIngestionService",
                  "Name"
                ]
              }
            ]
          ]
        },
        "RoleARN": {
          "Fn::Sub": "arn:aws:iam::${AWS::AccountId}:role/aws-service-role/ecs.application-autoscaling.amazonaws.com/AWSServiceRoleForApplicationAutoScaling_ECSService"
        },
        "ScalableDimension": "ecs:service:DesiredCount",
        "ServiceNamespace": "ecs"
      }
    },
    "DataIngestionScaleUpPolicy": {
      "Type": "AWS::ApplicationAutoScaling::ScalingPolicy",
      "Properties": {
        "PolicyName": {
          "Fn::Sub": "data-ingestion-scale-up-${EnvironmentSuffix}"
        },
        "PolicyType": "TargetTrackingScaling",
        "ScalingTargetId": {
          "Ref": "DataIngestionScalableTarget"
        },
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
    "TransactionProcessingScalableTarget": {
      "Type": "AWS::ApplicationAutoScaling::ScalableTarget",
      "Properties": {
        "MaxCapacity": 10,
        "MinCapacity": 2,
        "ResourceId": {
          "Fn::Join": [
            "/",
            [
              "service",
              {
                "Ref": "ECSCluster"
              },
              {
                "Fn::GetAtt": [
                  "TransactionProcessingService",
                  "Name"
                ]
              }
            ]
          ]
        },
        "RoleARN": {
          "Fn::Sub": "arn:aws:iam::${AWS::AccountId}:role/aws-service-role/ecs.application-autoscaling.amazonaws.com/AWSServiceRoleForApplicationAutoScaling_ECSService"
        },
        "ScalableDimension": "ecs:service:DesiredCount",
        "ServiceNamespace": "ecs"
      }
    },
    "TransactionProcessingScaleUpPolicy": {
      "Type": "AWS::ApplicationAutoScaling::ScalingPolicy",
      "Properties": {
        "PolicyName": {
          "Fn::Sub": "transaction-processing-scale-up-${EnvironmentSuffix}"
        },
        "PolicyType": "TargetTrackingScaling",
        "ScalingTargetId": {
          "Ref": "TransactionProcessingScalableTarget"
        },
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
    "ReportGenerationScalableTarget": {
      "Type": "AWS::ApplicationAutoScaling::ScalableTarget",
      "Properties": {
        "MaxCapacity": 10,
        "MinCapacity": 2,
        "ResourceId": {
          "Fn::Join": [
            "/",
            [
              "service",
              {
                "Ref": "ECSCluster"
              },
              {
                "Fn::GetAtt": [
                  "ReportGenerationService",
                  "Name"
                ]
              }
            ]
          ]
        },
        "RoleARN": {
          "Fn::Sub": "arn:aws:iam::${AWS::AccountId}:role/aws-service-role/ecs.application-autoscaling.amazonaws.com/AWSServiceRoleForApplicationAutoScaling_ECSService"
        },
        "ScalableDimension": "ecs:service:DesiredCount",
        "ServiceNamespace": "ecs"
      }
    },
    "ReportGenerationScaleUpPolicy": {
      "Type": "AWS::ApplicationAutoScaling::ScalingPolicy",
      "Properties": {
        "PolicyName": {
          "Fn::Sub": "report-generation-scale-up-${EnvironmentSuffix}"
        },
        "PolicyType": "TargetTrackingScaling",
        "ScalingTargetId": {
          "Ref": "ReportGenerationScalableTarget"
        },
        "TargetTrackingScalingPolicyConfiguration": {
          "TargetValue": 70.0,
          "PredefinedMetricSpecification": {
            "PredefinedMetricType": "ECSServiceAverageCPUUtilization"
          },
          "ScaleInCooldown": 300,
          "ScaleOutCooldown": 60
        }
      }
    }
  },
  "Outputs": {
    "ECSClusterName": {
      "Description": "Name of the ECS Cluster",
      "Value": {
        "Ref": "ECSCluster"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-ECSCluster"
        }
      }
    },
    "LoadBalancerDNS": {
      "Description": "DNS name of the Application Load Balancer",
      "Value": {
        "Fn::GetAtt": [
          "ApplicationLoadBalancer",
          "DNSName"
        ]
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-ALB-DNS"
        }
      }
    },
    "DataIngestionServiceName": {
      "Description": "Name of the Data Ingestion ECS Service",
      "Value": {
        "Fn::GetAtt": [
          "DataIngestionService",
          "Name"
        ]
      }
    },
    "TransactionProcessingServiceName": {
      "Description": "Name of the Transaction Processing ECS Service",
      "Value": {
        "Fn::GetAtt": [
          "TransactionProcessingService",
          "Name"
        ]
      }
    },
    "ReportGenerationServiceName": {
      "Description": "Name of the Report Generation ECS Service",
      "Value": {
        "Fn::GetAtt": [
          "ReportGenerationService",
          "Name"
        ]
      }
    },
    "S3BucketName": {
      "Description": "Name of the S3 bucket for output data",
      "Value": {
        "Ref": "S3Bucket"
      }
    },
    "VPCId": {
      "Description": "VPC ID",
      "Value": {
        "Ref": "VPC"
      }
    },
    "SecretArn": {
      "Description": "ARN of the Secrets Manager secret",
      "Value": {
        "Ref": "DBSecret"
      }
    }
  }
}
