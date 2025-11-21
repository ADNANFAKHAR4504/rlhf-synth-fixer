# CloudFormation Multi-Environment Infrastructure - Complete Implementation

## File: lib/infrastructure-template.json

```json
{
  "AWSTemplateFormatVersion": "2010-09-09",
  "Description": "Multi-environment CloudFormation infrastructure with VPC, ECS Fargate, ALB, and DynamoDB",
  "Parameters": {
    "EnvironmentName": {
      "Type": "String",
      "Default": "dev",
      "AllowedValues": ["dev", "staging", "prod"],
      "Description": "Environment name for resource naming and configuration"
    },
    "EnvironmentSuffix": {
      "Type": "String",
      "Default": "dev-suffix",
      "Description": "Unique suffix for resource names (e.g., dev-20251120, staging-001)"
    },
    "ApplicationName": {
      "Type": "String",
      "Default": "myapp",
      "Description": "Application name for resource naming"
    },
    "ContainerImage": {
      "Type": "String",
      "Default": "nginx:latest",
      "Description": "Docker image for ECS tasks"
    },
    "ContainerPort": {
      "Type": "Number",
      "Default": 80,
      "Description": "Port exposed by container"
    },
    "DesiredCount": {
      "Type": "Number",
      "Default": 2,
      "Description": "Number of ECS tasks to run"
    }
  },
  "Conditions": {
    "IsProduction": {
      "Fn::Equals": [
        {
          "Ref": "EnvironmentName"
        },
        "prod"
      ]
    },
    "IsStaging": {
      "Fn::Equals": [
        {
          "Ref": "EnvironmentName"
        },
        "staging"
      ]
    },
    "IsDev": {
      "Fn::Equals": [
        {
          "Ref": "EnvironmentName"
        },
        "dev"
      ]
    }
  },
  "Mappings": {
    "EnvironmentConfig": {
      "dev": {
        "VpcCidr": "10.0.0.0/16",
        "PublicSubnet1Cidr": "10.0.1.0/24",
        "PublicSubnet2Cidr": "10.0.2.0/24",
        "PrivateSubnet1Cidr": "10.0.11.0/24",
        "PrivateSubnet2Cidr": "10.0.12.0/24",
        "TaskCpu": "256",
        "TaskMemory": "512",
        "DesiredCount": "2",
        "MaxCapacity": "4",
        "MinCapacity": "1"
      },
      "staging": {
        "VpcCidr": "10.1.0.0/16",
        "PublicSubnet1Cidr": "10.1.1.0/24",
        "PublicSubnet2Cidr": "10.1.2.0/24",
        "PrivateSubnet1Cidr": "10.1.11.0/24",
        "PrivateSubnet2Cidr": "10.1.12.0/24",
        "TaskCpu": "512",
        "TaskMemory": "1024",
        "DesiredCount": "3",
        "MaxCapacity": "8",
        "MinCapacity": "2"
      },
      "prod": {
        "VpcCidr": "10.2.0.0/16",
        "PublicSubnet1Cidr": "10.2.1.0/24",
        "PublicSubnet2Cidr": "10.2.2.0/24",
        "PrivateSubnet1Cidr": "10.2.11.0/24",
        "PrivateSubnet2Cidr": "10.2.12.0/24",
        "TaskCpu": "1024",
        "TaskMemory": "2048",
        "DesiredCount": "4",
        "MaxCapacity": "12",
        "MinCapacity": "3"
      }
    }
  },
  "Resources": {
    "VPC": {
      "Type": "AWS::EC2::VPC",
      "Properties": {
        "CidrBlock": {
          "Fn::FindInMap": [
            "EnvironmentConfig",
            {
              "Ref": "EnvironmentName"
            },
            "VpcCidr"
          ]
        },
        "EnableDnsHostnames": true,
        "EnableDnsSupport": true,
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "vpc-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "EnvironmentName"
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
        "CidrBlock": {
          "Fn::FindInMap": [
            "EnvironmentConfig",
            {
              "Ref": "EnvironmentName"
            },
            "PublicSubnet1Cidr"
          ]
        },
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
        "CidrBlock": {
          "Fn::FindInMap": [
            "EnvironmentConfig",
            {
              "Ref": "EnvironmentName"
            },
            "PublicSubnet2Cidr"
          ]
        },
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
        "CidrBlock": {
          "Fn::FindInMap": [
            "EnvironmentConfig",
            {
              "Ref": "EnvironmentName"
            },
            "PrivateSubnet1Cidr"
          ]
        },
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
        "CidrBlock": {
          "Fn::FindInMap": [
            "EnvironmentConfig",
            {
              "Ref": "EnvironmentName"
            },
            "PrivateSubnet2Cidr"
          ]
        },
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
    "EIP": {
      "Type": "AWS::EC2::EIP",
      "DependsOn": "AttachGateway",
      "Properties": {
        "Domain": "vpc",
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "eip-natgw-${EnvironmentSuffix}"
            }
          }
        ]
      }
    },
    "NATGateway": {
      "Type": "AWS::EC2::NatGateway",
      "Properties": {
        "AllocationId": {
          "Fn::GetAtt": [
            "EIP",
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
              "Fn::Sub": "natgw-${EnvironmentSuffix}"
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
      }
    },
    "PrivateRoute": {
      "Type": "AWS::EC2::Route",
      "Properties": {
        "RouteTableId": {
          "Ref": "PrivateRouteTable"
        },
        "DestinationCidrBlock": "0.0.0.0/0",
        "NatGatewayId": {
          "Ref": "NATGateway"
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
    "ALBSecurityGroup": {
      "Type": "AWS::EC2::SecurityGroup",
      "Properties": {
        "GroupDescription": "Security group for Application Load Balancer",
        "VpcId": {
          "Ref": "VPC"
        },
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
    "ECSSecurityGroup": {
      "Type": "AWS::EC2::SecurityGroup",
      "Properties": {
        "GroupDescription": "Security group for ECS tasks",
        "VpcId": {
          "Ref": "VPC"
        },
        "SecurityGroupIngress": [
          {
            "IpProtocol": "tcp",
            "FromPort": {
              "Ref": "ContainerPort"
            },
            "ToPort": {
              "Ref": "ContainerPort"
            },
            "SourceSecurityGroupId": {
              "Ref": "ALBSecurityGroup"
            }
          }
        ],
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "ecs-sg-${EnvironmentSuffix}"
            }
          }
        ]
      }
    },
    "LoadBalancer": {
      "Type": "AWS::ElasticLoadBalancingV2::LoadBalancer",
      "Properties": {
        "Name": {
          "Fn::Sub": "alb-${EnvironmentSuffix}"
        },
        "Type": "application",
        "Scheme": "internet-facing",
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
    "TargetGroup": {
      "Type": "AWS::ElasticLoadBalancingV2::TargetGroup",
      "Properties": {
        "Name": {
          "Fn::Sub": "tg-${EnvironmentSuffix}"
        },
        "Port": {
          "Ref": "ContainerPort"
        },
        "Protocol": "HTTP",
        "VpcId": {
          "Ref": "VPC"
        },
        "TargetType": "ip",
        "HealthCheckEnabled": true,
        "HealthCheckIntervalSeconds": 30,
        "HealthCheckPath": "/",
        "HealthCheckProtocol": "HTTP",
        "HealthCheckTimeoutSeconds": 5,
        "HealthyThresholdCount": 2,
        "UnhealthyThresholdCount": 3,
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
              "Fn::Sub": "tg-${EnvironmentSuffix}"
            }
          }
        ]
      }
    },
    "ListenerHTTP": {
      "Type": "AWS::ElasticLoadBalancingV2::Listener",
      "Properties": {
        "DefaultActions": [
          {
            "Type": "forward",
            "TargetGroupArn": {
              "Ref": "TargetGroup"
            }
          }
        ],
        "LoadBalancerArn": {
          "Ref": "LoadBalancer"
        },
        "Port": 80,
        "Protocol": "HTTP"
      }
    },
    "ECSClusterRole": {
      "Type": "AWS::IAM::Role",
      "Properties": {
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
          "arn:aws:iam::aws:policy/CloudWatchLogsFullAccess"
        ],
        "Policies": [
          {
            "PolicyName": "DynamoDBAccess",
            "PolicyDocument": {
              "Version": "2012-10-17",
              "Statement": [
                {
                  "Effect": "Allow",
                  "Action": [
                    "dynamodb:GetItem",
                    "dynamodb:PutItem",
                    "dynamodb:UpdateItem",
                    "dynamodb:DeleteItem",
                    "dynamodb:Query",
                    "dynamodb:Scan"
                  ],
                  "Resource": {
                    "Fn::GetAtt": [
                      "ApplicationTable",
                      "Arn"
                    ]
                  }
                }
              ]
            }
          },
          {
            "PolicyName": "SSMParameterAccess",
            "PolicyDocument": {
              "Version": "2012-10-17",
              "Statement": [
                {
                  "Effect": "Allow",
                  "Action": [
                    "ssm:GetParameter",
                    "ssm:GetParameters",
                    "ssm:GetParametersByPath"
                  ],
                  "Resource": {
                    "Fn::Sub": "arn:aws:ssm:us-east-1:${AWS::AccountId}:parameter/${ApplicationName}/${EnvironmentName}/*"
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
              "Fn::Sub": "ecs-role-${EnvironmentSuffix}"
            }
          }
        ]
      }
    },
    "ECSCluster": {
      "Type": "AWS::ECS::Cluster",
      "Properties": {
        "ClusterName": {
          "Fn::Sub": "cluster-${EnvironmentSuffix}"
        },
        "ClusterSettings": [
          {
            "Name": "containerInsights",
            "Value": "enabled"
          }
        ],
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "cluster-${EnvironmentSuffix}"
            }
          }
        ]
      }
    },
    "CloudWatchLogGroup": {
      "Type": "AWS::Logs::LogGroup",
      "Properties": {
        "LogGroupName": {
          "Fn::Sub": "/ecs/${ApplicationName}/${EnvironmentSuffix}"
        },
        "RetentionInDays": {
          "Fn::If": [
            "IsProduction",
            30,
            7
          ]
        }
      }
    },
    "ECSTaskDefinition": {
      "Type": "AWS::ECS::TaskDefinition",
      "Properties": {
        "Family": {
          "Fn::Sub": "task-${EnvironmentSuffix}"
        },
        "NetworkMode": "awsvpc",
        "RequiresCompatibilities": [
          "FARGATE"
        ],
        "Cpu": {
          "Fn::FindInMap": [
            "EnvironmentConfig",
            {
              "Ref": "EnvironmentName"
            },
            "TaskCpu"
          ]
        },
        "Memory": {
          "Fn::FindInMap": [
            "EnvironmentConfig",
            {
              "Ref": "EnvironmentName"
            },
            "TaskMemory"
          ]
        },
        "ExecutionRoleArn": {
          "Fn::GetAtt": [
            "ECSClusterRole",
            "Arn"
          ]
        },
        "TaskRoleArn": {
          "Fn::GetAtt": [
            "ECSClusterRole",
            "Arn"
          ]
        },
        "ContainerDefinitions": [
          {
            "Name": {
              "Ref": "ApplicationName"
            },
            "Image": {
              "Ref": "ContainerImage"
            },
            "PortMappings": [
              {
                "ContainerPort": {
                  "Ref": "ContainerPort"
                },
                "Protocol": "tcp"
              }
            ],
            "LogConfiguration": {
              "LogDriver": "awslogs",
              "Options": {
                "awslogs-group": {
                  "Ref": "CloudWatchLogGroup"
                },
                "awslogs-region": "us-east-1",
                "awslogs-stream-prefix": "ecs"
              }
            },
            "Environment": [
              {
                "Name": "ENVIRONMENT",
                "Value": {
                  "Ref": "EnvironmentName"
                }
              },
              {
                "Name": "APPLICATION_NAME",
                "Value": {
                  "Ref": "ApplicationName"
                }
              }
            ]
          }
        ]
      }
    },
    "ECSService": {
      "Type": "AWS::ECS::Service",
      "DependsOn": "ListenerHTTP",
      "Properties": {
        "ServiceName": {
          "Fn::Sub": "svc-${EnvironmentSuffix}"
        },
        "Cluster": {
          "Ref": "ECSCluster"
        },
        "TaskDefinition": {
          "Ref": "ECSTaskDefinition"
        },
        "DesiredCount": {
          "Fn::FindInMap": [
            "EnvironmentConfig",
            {
              "Ref": "EnvironmentName"
            },
            "DesiredCount"
          ]
        },
        "LaunchType": "FARGATE",
        "NetworkConfiguration": {
          "AwsvpcConfiguration": {
            "AssignPublicIp": "DISABLED",
            "Subnets": [
              {
                "Ref": "PrivateSubnet1"
              },
              {
                "Ref": "PrivateSubnet2"
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
            "ContainerName": {
              "Ref": "ApplicationName"
            },
            "ContainerPort": {
              "Ref": "ContainerPort"
            },
            "TargetGroupArn": {
              "Ref": "TargetGroup"
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
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "svc-${EnvironmentSuffix}"
            }
          }
        ]
      }
    },
    "AutoScalingTarget": {
      "Type": "AWS::ApplicationAutoScaling::ScalableTarget",
      "Properties": {
        "MaxCapacity": {
          "Fn::FindInMap": [
            "EnvironmentConfig",
            {
              "Ref": "EnvironmentName"
            },
            "MaxCapacity"
          ]
        },
        "MinCapacity": {
          "Fn::FindInMap": [
            "EnvironmentConfig",
            {
              "Ref": "EnvironmentName"
            },
            "MinCapacity"
          ]
        },
        "ResourceId": {
          "Fn::Sub": "service/${ECSCluster}/${ECSService.Name}"
        },
        "RoleARN": {
          "Fn::Sub": "arn:aws:iam::${AWS::AccountId}:role/aws-service-role/ecs.application-autoscaling.amazonaws.com/AWSServiceRoleForApplicationAutoScaling_ECSService"
        },
        "ScalableDimension": "ecs:service:DesiredCount",
        "ServiceNamespace": "ecs"
      }
    },
    "CPUScalingPolicy": {
      "Type": "AWS::ApplicationAutoScaling::ScalingPolicy",
      "Properties": {
        "PolicyName": {
          "Fn::Sub": "cpu-scaling-${EnvironmentSuffix}"
        },
        "PolicyType": "TargetTrackingScaling",
        "ScalingTargetId": {
          "Ref": "AutoScalingTarget"
        },
        "TargetTrackingScalingPolicyConfiguration": {
          "TargetValue": {
            "Fn::If": [
              "IsProduction",
              70,
              80
            ]
          },
          "PredefinedMetricSpecification": {
            "PredefinedMetricType": "ECSServiceAverageCPUUtilization"
          },
          "ScaleOutCooldown": 60,
          "ScaleInCooldown": 300
        }
      }
    },
    "MemoryScalingPolicy": {
      "Type": "AWS::ApplicationAutoScaling::ScalingPolicy",
      "Properties": {
        "PolicyName": {
          "Fn::Sub": "memory-scaling-${EnvironmentSuffix}"
        },
        "PolicyType": "TargetTrackingScaling",
        "ScalingTargetId": {
          "Ref": "AutoScalingTarget"
        },
        "TargetTrackingScalingPolicyConfiguration": {
          "TargetValue": {
            "Fn::If": [
              "IsProduction",
              80,
              85
            ]
          },
          "PredefinedMetricSpecification": {
            "PredefinedMetricType": "ECSServiceAverageMemoryUtilization"
          },
          "ScaleOutCooldown": 60,
          "ScaleInCooldown": 300
        }
      }
    },
    "ApplicationTable": {
      "Type": "AWS::DynamoDB::Table",
      "Properties": {
        "TableName": {
          "Fn::Sub": "table-${EnvironmentSuffix}"
        },
        "BillingMode": "PAY_PER_REQUEST",
        "AttributeDefinitions": [
          {
            "AttributeName": "PK",
            "AttributeType": "S"
          },
          {
            "AttributeName": "SK",
            "AttributeType": "S"
          }
        ],
        "KeySchema": [
          {
            "AttributeName": "PK",
            "KeyType": "HASH"
          },
          {
            "AttributeName": "SK",
            "KeyType": "RANGE"
          }
        ],
        "StreamSpecification": {
          "StreamViewType": "NEW_AND_OLD_IMAGES"
        },
        "PointInTimeRecoverySpecification": {
          "PointInTimeRecoveryEnabled": true
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "table-${EnvironmentSuffix}"
            }
          }
        ]
      }
    },
    "DynamoDBThrottleAlarm": {
      "Type": "AWS::CloudWatch::Alarm",
      "Properties": {
        "AlarmName": {
          "Fn::Sub": "dynamodb-throttle-${EnvironmentSuffix}"
        },
        "AlarmDescription": "Alert when DynamoDB table is being throttled",
        "MetricName": "UserErrors",
        "Namespace": "AWS/DynamoDB",
        "Statistic": "Sum",
        "Period": 60,
        "EvaluationPeriods": 1,
        "Threshold": 1,
        "ComparisonOperator": "GreaterThanOrEqualToThreshold",
        "Dimensions": [
          {
            "Name": "TableName",
            "Value": {
              "Ref": "ApplicationTable"
            }
          }
        ]
      }
    },
    "SNSTopic": {
      "Type": "AWS::SNS::Topic",
      "Properties": {
        "TopicName": {
          "Fn::Sub": "alerts-${EnvironmentSuffix}"
        },
        "DisplayName": {
          "Fn::Sub": "Alerts for ${EnvironmentSuffix}"
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "alerts-${EnvironmentSuffix}"
            }
          }
        ]
      }
    },
    "ALBTargetHealthAlarm": {
      "Type": "AWS::CloudWatch::Alarm",
      "Properties": {
        "AlarmName": {
          "Fn::Sub": "alb-health-${EnvironmentSuffix}"
        },
        "AlarmDescription": "Alert when ALB has unhealthy targets",
        "MetricName": "UnHealthyHostCount",
        "Namespace": "AWS/ApplicationELB",
        "Statistic": "Average",
        "Period": 60,
        "EvaluationPeriods": 2,
        "Threshold": 1,
        "ComparisonOperator": "GreaterThanOrEqualToThreshold",
        "Dimensions": [
          {
            "Name": "LoadBalancer",
            "Value": {
              "Fn::GetAtt": [
                "LoadBalancer",
                "LoadBalancerFullName"
              ]
            }
          },
          {
            "Name": "TargetGroup",
            "Value": {
              "Fn::GetAtt": [
                "TargetGroup",
                "TargetGroupFullName"
              ]
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
    "ECSCPUUtilizationAlarm": {
      "Type": "AWS::CloudWatch::Alarm",
      "Properties": {
        "AlarmName": {
          "Fn::Sub": "ecs-cpu-${EnvironmentSuffix}"
        },
        "AlarmDescription": "Alert when ECS service CPU is high",
        "MetricName": "CPUUtilization",
        "Namespace": "AWS/ECS",
        "Statistic": "Average",
        "Period": 300,
        "EvaluationPeriods": 2,
        "Threshold": {
          "Fn::If": [
            "IsProduction",
            85,
            90
          ]
        },
        "ComparisonOperator": "GreaterThanThreshold",
        "Dimensions": [
          {
            "Name": "ClusterName",
            "Value": {
              "Ref": "ECSCluster"
            }
          },
          {
            "Name": "ServiceName",
            "Value": {
              "Fn::GetAtt": [
                "ECSService",
                "Name"
              ]
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
    "SSMParameterDatabaseEndpoint": {
      "Type": "AWS::SSM::Parameter",
      "Properties": {
        "Name": {
          "Fn::Sub": "/${ApplicationName}/${EnvironmentName}/database-endpoint"
        },
        "Type": "String",
        "Value": {
          "Fn::GetAtt": [
            "ApplicationTable",
            "Arn"
          ]
        },
        "Description": "DynamoDB table endpoint for application"
      }
    },
    "SSMParameterAPIKey": {
      "Type": "AWS::SSM::Parameter",
      "Properties": {
        "Name": {
          "Fn::Sub": "/${ApplicationName}/${EnvironmentName}/api-key"
        },
        "Type": "SecureString",
        "Value": {
          "Fn::Sub": "key-${EnvironmentSuffix}-placeholder"
        },
        "Description": "API key for external service integration"
      }
    },
    "CloudWatchDashboard": {
      "Type": "AWS::CloudWatch::Dashboard",
      "Properties": {
        "DashboardName": {
          "Fn::Sub": "dashboard-${EnvironmentSuffix}"
        },
        "DashboardBody": {
          "Fn::Sub": "{\"widgets\":[{\"type\":\"metric\",\"properties\":{\"metrics\":[[\"AWS/ECS\",\"CPUUtilization\",{\"stat\":\"Average\"}],[\"AWS/ECS\",\"MemoryUtilization\",{\"stat\":\"Average\"}],[\"AWS/DynamoDB\",\"ConsumedWriteCapacityUnits\",{\"stat\":\"Sum\"}],[\"AWS/ApplicationELB\",\"TargetResponseTime\",{\"stat\":\"Average\"}]],\"period\":300,\"stat\":\"Average\",\"region\":\"us-east-1\",\"title\":\"Application Metrics - ${EnvironmentSuffix}\"}}]}"
        }
      }
    }
  },
  "Outputs": {
    "VPCId": {
      "Description": "VPC ID",
      "Value": {
        "Ref": "VPC"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-VPC-ID"
        }
      }
    },
    "LoadBalancerDNS": {
      "Description": "DNS name of the load balancer",
      "Value": {
        "Fn::GetAtt": [
          "LoadBalancer",
          "DNSName"
        ]
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-ALB-DNS"
        }
      }
    },
    "ECSClusterName": {
      "Description": "ECS Cluster name",
      "Value": {
        "Ref": "ECSCluster"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-Cluster-Name"
        }
      }
    },
    "ECSServiceName": {
      "Description": "ECS Service name",
      "Value": {
        "Fn::GetAtt": [
          "ECSService",
          "Name"
        ]
      }
    },
    "DynamoDBTableName": {
      "Description": "DynamoDB table name",
      "Value": {
        "Ref": "ApplicationTable"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-DDB-Table"
        }
      }
    },
    "DynamoDBStreamArn": {
      "Description": "DynamoDB stream ARN for event processing",
      "Value": {
        "Fn::GetAtt": [
          "ApplicationTable",
          "StreamArn"
        ]
      }
    },
    "CloudWatchLogGroupName": {
      "Description": "CloudWatch Log Group for ECS tasks",
      "Value": {
        "Ref": "CloudWatchLogGroup"
      }
    },
    "SNSTopicArn": {
      "Description": "SNS Topic ARN for alarms",
      "Value": {
        "Ref": "SNSTopic"
      }
    }
  }
}
```

## File: lib/deploy.sh

```bash
#!/bin/bash

# CloudFormation deployment script for multi-environment infrastructure

set -e

# Configuration
STACK_NAME="${1:-myapp-infrastructure}"
ENVIRONMENT="${2:-dev}"
TEMPLATE_FILE="./infrastructure-template.json"
AWS_REGION="us-east-1"

# Generate environment-specific suffix
TIMESTAMP=$(date +%s)
ENVIRONMENT_SUFFIX="${ENVIRONMENT}-${TIMESTAMP}"

echo "Deploying CloudFormation stack: ${STACK_NAME}"
echo "Environment: ${ENVIRONMENT}"
echo "Environment Suffix: ${ENVIRONMENT_SUFFIX}"
echo "Region: ${AWS_REGION}"
echo ""

# Validate template
echo "Validating CloudFormation template..."
aws cloudformation validate-template \
  --template-body file://${TEMPLATE_FILE} \
  --region ${AWS_REGION} > /dev/null

echo "✓ Template validation passed"
echo ""

# Deploy stack
echo "Creating/updating CloudFormation stack..."
aws cloudformation deploy \
  --template-file ${TEMPLATE_FILE} \
  --stack-name ${STACK_NAME} \
  --parameter-overrides \
    EnvironmentName=${ENVIRONMENT} \
    EnvironmentSuffix=${ENVIRONMENT_SUFFIX} \
    ApplicationName=myapp \
    ContainerImage=nginx:latest \
    ContainerPort=80 \
  --region ${AWS_REGION} \
  --no-fail-on-empty-changeset \
  --capabilities CAPABILITY_IAM

echo ""
echo "✓ Stack deployment completed"
echo ""

# Display outputs
echo "Stack Outputs:"
aws cloudformation describe-stacks \
  --stack-name ${STACK_NAME} \
  --region ${AWS_REGION} \
  --query 'Stacks[0].Outputs[*].[OutputKey,OutputValue]' \
  --output table
```

## File: lib/README.md

```markdown
# Multi-Environment CloudFormation Infrastructure

This directory contains the CloudFormation template for deploying a complete multi-environment application infrastructure with VPC, ECS Fargate, ALB, and DynamoDB.

## Architecture Overview

- **VPC**: Environment-specific CIDR blocks (dev: 10.0.0.0/16, staging: 10.1.0.0/16, prod: 10.2.0.0/16)
- **Public Subnets**: ALB deployment across 2 AZs
- **Private Subnets**: ECS Fargate tasks with NAT Gateway egress
- **ECS Fargate**: Container orchestration with auto-scaling
- **Application Load Balancer**: Distributes traffic across ECS tasks
- **DynamoDB On-Demand**: Fast deployment, no RDS provisioning delay
- **CloudWatch**: Comprehensive monitoring and alarms
- **Systems Manager**: Environment-specific parameter storage

## Prerequisites

- AWS CLI v2 or later
- jq (for JSON processing)
- Appropriate IAM permissions for CloudFormation, ECS, DynamoDB, etc.

## Deployment

### Deploy Development Environment

```bash
./deploy.sh myapp-dev dev
```

### Deploy Staging Environment

```bash
./deploy.sh myapp-staging staging
```

### Deploy Production Environment

```bash
./deploy.sh myapp-prod prod
```

## Template Parameters

| Parameter | Default | Description |
|-----------|---------|-------------|
| EnvironmentName | dev | Environment: dev, staging, or prod |
| EnvironmentSuffix | dev-suffix | Unique suffix for resource naming |
| ApplicationName | myapp | Application name for resource naming |
| ContainerImage | nginx:latest | Docker image URI |
| ContainerPort | 80 | Container port |
| DesiredCount | 2 | Initial number of ECS tasks |

## Stack Outputs

- **VPCId**: VPC identifier
- **LoadBalancerDNS**: ALB endpoint
- **ECSClusterName**: ECS cluster name
- **ECSServiceName**: ECS service name
- **DynamoDBTableName**: DynamoDB table name
- **DynamoDBStreamArn**: Stream ARN for event processing
- **CloudWatchLogGroupName**: Log group name
- **SNSTopicArn**: SNS topic for alarms

## Cleanup

To delete the stack and remove all resources:

```bash
aws cloudformation delete-stack \
  --stack-name myapp-dev \
  --region us-east-1
```

Monitor deletion:

```bash
aws cloudformation wait stack-delete-complete \
  --stack-name myapp-dev \
  --region us-east-1
```

## Environment-Specific Configuration

Configuration differences by environment:

- **Dev**: 1-4 tasks, 256 CPU, 512 MB memory, 7-day log retention
- **Staging**: 2-8 tasks, 512 CPU, 1024 MB memory, 7-day log retention
- **Production**: 3-12 tasks, 1024 CPU, 2048 MB memory, 30-day log retention

## Monitoring

Access CloudWatch Dashboard:

1. Console → CloudWatch → Dashboards
2. Select dashboard named `dashboard-{EnvironmentSuffix}`

Alarms are configured for:
- ALB target health
- ECS CPU utilization
- DynamoDB throttling

## Best Practices

1. **Resource Naming**: All resources include environmentSuffix for uniqueness
2. **Destroyability**: No Retain policies; clean deletion with delete-stack
3. **Security**: Private subnets for compute, IAM roles properly scoped
4. **Monitoring**: Alarms integrated with SNS for notifications
5. **Cost Optimization**: DynamoDB On-Demand for flexible billing
```

## Additional Files

### File: lib/validate.sh

```bash
#!/bin/bash

# Validation script for CloudFormation template

set -e

TEMPLATE_FILE="./infrastructure-template.json"
AWS_REGION="us-east-1"

echo "Validating CloudFormation template structure..."

# Check JSON validity
jq empty ${TEMPLATE_FILE}
echo "✓ JSON syntax valid"

# Validate with CloudFormation
aws cloudformation validate-template \
  --template-body file://${TEMPLATE_FILE} \
  --region ${AWS_REGION} > /dev/null

echo "✓ CloudFormation template valid"

# Check for required sections
for section in "AWSTemplateFormatVersion" "Description" "Parameters" "Conditions" "Resources" "Outputs"; do
  if jq -e ".${section}" ${TEMPLATE_FILE} > /dev/null; then
    echo "✓ Section ${section} present"
  else
    echo "✗ Missing section: ${section}"
    exit 1
  fi
done

# Check environmentSuffix usage
SUFFIX_COUNT=$(jq 'path(.. | select(. == "EnvironmentSuffix")) | length' ${TEMPLATE_FILE} | wc -l)
echo "✓ EnvironmentSuffix referenced ${SUFFIX_COUNT} times"

echo ""
echo "All validations passed!"
```
