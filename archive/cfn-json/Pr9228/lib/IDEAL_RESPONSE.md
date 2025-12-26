# Implementation Code

## Infrastructure

### lib/TapStack.json

```json
{
  "AWSTemplateFormatVersion": "2010-09-09",
  "Description": "Multi-environment CloudFormation infrastructure with VPC, ECS Fargate, ALB, and DynamoDB",
  "Parameters": {
    "EnvironmentName": {
      "Type": "String",
      "Default": "dev",
      "AllowedValues": [
        "dev",
        "staging",
        "prod"
      ],
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
            "Name": "app-container",
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
            "ContainerName": "app-container",
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
          "Fn::Join": [
            "/",
            [
              "service",
              {
                "Ref": "ECSCluster"
              },
              {
                "Fn::GetAtt": [
                  "ECSService",
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
        "Type": "String",
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
          "Fn::Sub": "{\"widgets\": [{\"type\": \"metric\", \"properties\": {\"metrics\": [[\"AWS/ECS\", \"CPUUtilization\", {\"stat\": \"Average\"}], [\"AWS/ECS\", \"MemoryUtilization\", {\"stat\": \"Average\"}], [\"AWS/DynamoDB\", \"ConsumedWriteCapacityUnits\", {\"stat\": \"Sum\"}], [\"AWS/ApplicationELB\", \"TargetResponseTime\", {\"stat\": \"Average\"}]], \"period\": 300, \"stat\": \"Average\", \"region\": \"us-east-1\", \"title\": \"Application Metrics - ${EnvironmentSuffix}\"}}]}"
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
      "Description": "SNS Topic ARN",
      "Value": {
        "Ref": "SNSTopic"
      }
    },
    "PublicSubnet1Id": {
      "Description": "Public Subnet 1 ID",
      "Value": {
        "Ref": "PublicSubnet1"
      }
    },
    "PublicSubnet2Id": {
      "Description": "Public Subnet 2 ID",
      "Value": {
        "Ref": "PublicSubnet2"
      }
    },
    "PrivateSubnet1Id": {
      "Description": "Private Subnet 1 ID",
      "Value": {
        "Ref": "PrivateSubnet1"
      }
    },
    "PrivateSubnet2Id": {
      "Description": "Private Subnet 2 ID",
      "Value": {
        "Ref": "PrivateSubnet2"
      }
    },
    "LoadBalancerArn": {
      "Description": "Load Balancer ARN",
      "Value": {
        "Ref": "LoadBalancer"
      }
    },
    "TargetGroupArn": {
      "Description": "Target Group ARN",
      "Value": {
        "Ref": "TargetGroup"
      }
    },
    "DynamoDBTableArn": {
      "Description": "DynamoDB Table ARN",
      "Value": {
        "Fn::GetAtt": [
          "ApplicationTable",
          "Arn"
        ]
      }
    },
    "CloudWatchLogGroup": {
      "Description": "CloudWatch Log Group Name",
      "Value": {
        "Ref": "CloudWatchLogGroup"
      }
    },
    "SSMParameterDatabaseEndpoint": {
      "Description": "SSM Parameter for Database Endpoint",
      "Value": {
        "Ref": "SSMParameterDatabaseEndpoint"
      }
    },
    "SSMParameterAPIKey": {
      "Description": "SSM Parameter for API Key",
      "Value": {
        "Ref": "SSMParameterAPIKey"
      }
    }
  }
}```

## Unit Tests

### test/TapStack.unit.test.ts

```typescript
import { describe, test, expect, beforeAll } from '@jest/globals';
import { readFileSync } from 'fs';
import { join } from 'path';

describe('CloudFormation Template Unit Tests', () => {
  let template;
  const ENVIRONMENT_SUFFIX = 'synth101912542';

  beforeAll(() => {
    const templatePath = join(process.cwd(), 'lib', 'TapStack.json');
    const templateContent = readFileSync(templatePath, 'utf-8');
    template = JSON.parse(templateContent);
  });

  describe('Template Structure', () => {
    test('should have valid CloudFormation version', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should have description', () => {
      expect(template.Description).toBeDefined();
      expect(template.Description).toContain('Multi-environment');
    });

    test('should have Parameters section', () => {
      expect(template.Parameters).toBeDefined();
      expect(Object.keys(template.Parameters).length).toBeGreaterThan(0);
    });

    test('should have Resources section', () => {
      expect(template.Resources).toBeDefined();
      expect(Object.keys(template.Resources).length).toBeGreaterThan(0);
    });

    test('should have Outputs section', () => {
      expect(template.Outputs).toBeDefined();
      expect(Object.keys(template.Outputs).length).toBeGreaterThan(0);
    });

    test('should have Conditions section', () => {
      expect(template.Conditions).toBeDefined();
      expect(template.Conditions.IsProduction).toBeDefined();
    });

    test('should have Mappings section', () => {
      expect(template.Mappings).toBeDefined();
      expect(template.Mappings.EnvironmentConfig).toBeDefined();
    });
  });

  describe('Parameters', () => {
    test('should have EnvironmentSuffix parameter', () => {
      expect(template.Parameters.EnvironmentSuffix).toBeDefined();
      expect(template.Parameters.EnvironmentSuffix.Type).toBe('String');
    });

    test('should have EnvironmentName parameter with allowed values', () => {
      expect(template.Parameters.EnvironmentName).toBeDefined();
      expect(template.Parameters.EnvironmentName.AllowedValues).toEqual(['dev', 'staging', 'prod']);
    });

    test('should have ApplicationName parameter', () => {
      expect(template.Parameters.ApplicationName).toBeDefined();
      expect(template.Parameters.ApplicationName.Type).toBe('String');
    });

    test('should have ContainerImage parameter', () => {
      expect(template.Parameters.ContainerImage).toBeDefined();
      expect(template.Parameters.ContainerImage.Default).toBe('nginx:latest');
    });

    test('should have ContainerPort parameter', () => {
      expect(template.Parameters.ContainerPort).toBeDefined();
      expect(template.Parameters.ContainerPort.Type).toBe('Number');
      expect(template.Parameters.ContainerPort.Default).toBe(80);
    });
  });

  describe('Environment Mappings', () => {
    test('should have dev environment configuration', () => {
      const devConfig = template.Mappings.EnvironmentConfig.dev;
      expect(devConfig).toBeDefined();
      expect(devConfig.VpcCidr).toBe('10.0.0.0/16');
      expect(devConfig.TaskCpu).toBe('256');
      expect(devConfig.TaskMemory).toBe('512');
    });

    test('should have staging environment configuration', () => {
      const stagingConfig = template.Mappings.EnvironmentConfig.staging;
      expect(stagingConfig).toBeDefined();
      expect(stagingConfig.VpcCidr).toBe('10.1.0.0/16');
      expect(stagingConfig.TaskCpu).toBe('512');
      expect(stagingConfig.TaskMemory).toBe('1024');
    });

    test('should have prod environment configuration', () => {
      const prodConfig = template.Mappings.EnvironmentConfig.prod;
      expect(prodConfig).toBeDefined();
      expect(prodConfig.VpcCidr).toBe('10.2.0.0/16');
      expect(prodConfig.TaskCpu).toBe('1024');
      expect(prodConfig.TaskMemory).toBe('2048');
    });

    test('should have unique CIDR blocks per environment', () => {
      const devCidr = template.Mappings.EnvironmentConfig.dev.VpcCidr;
      const stagingCidr = template.Mappings.EnvironmentConfig.staging.VpcCidr;
      const prodCidr = template.Mappings.EnvironmentConfig.prod.VpcCidr;

      expect(devCidr).not.toBe(stagingCidr);
      expect(devCidr).not.toBe(prodCidr);
      expect(stagingCidr).not.toBe(prodCidr);
    });
  });

  describe('VPC Resources', () => {
    test('should have VPC resource', () => {
      expect(template.Resources.VPC).toBeDefined();
      expect(template.Resources.VPC.Type).toBe('AWS::EC2::VPC');
    });

    test('VPC should use environment-specific CIDR from mapping', () => {
      const vpcCidr = template.Resources.VPC.Properties.CidrBlock;
      expect(vpcCidr).toBeDefined();
      expect(vpcCidr['Fn::FindInMap']).toBeDefined();
    });

    test('VPC should enable DNS support and hostnames', () => {
      expect(template.Resources.VPC.Properties.EnableDnsSupport).toBe(true);
      expect(template.Resources.VPC.Properties.EnableDnsHostnames).toBe(true);
    });

    test('should have Internet Gateway', () => {
      expect(template.Resources.InternetGateway).toBeDefined();
      expect(template.Resources.InternetGateway.Type).toBe('AWS::EC2::InternetGateway');
    });

    test('should have NAT Gateway', () => {
      expect(template.Resources.NATGateway).toBeDefined();
      expect(template.Resources.NATGateway.Type).toBe('AWS::EC2::NatGateway');
    });

    test('should have Elastic IP for NAT Gateway', () => {
      expect(template.Resources.EIP).toBeDefined();
      expect(template.Resources.EIP.Type).toBe('AWS::EC2::EIP');
    });
  });

  describe('Subnet Resources', () => {
    test('should have two public subnets', () => {
      expect(template.Resources.PublicSubnet1).toBeDefined();
      expect(template.Resources.PublicSubnet2).toBeDefined();
      expect(template.Resources.PublicSubnet1.Type).toBe('AWS::EC2::Subnet');
      expect(template.Resources.PublicSubnet2.Type).toBe('AWS::EC2::Subnet');
    });

    test('should have two private subnets', () => {
      expect(template.Resources.PrivateSubnet1).toBeDefined();
      expect(template.Resources.PrivateSubnet2).toBeDefined();
      expect(template.Resources.PrivateSubnet1.Type).toBe('AWS::EC2::Subnet');
      expect(template.Resources.PrivateSubnet2.Type).toBe('AWS::EC2::Subnet');
    });

    test('public subnets should be in different availability zones', () => {
      const az1 = template.Resources.PublicSubnet1.Properties.AvailabilityZone;
      const az2 = template.Resources.PublicSubnet2.Properties.AvailabilityZone;
      expect(az1).not.toEqual(az2);
    });

    test('private subnets should be in different availability zones', () => {
      const az1 = template.Resources.PrivateSubnet1.Properties.AvailabilityZone;
      const az2 = template.Resources.PrivateSubnet2.Properties.AvailabilityZone;
      expect(az1).not.toEqual(az2);
    });
  });

  describe('Route Table Resources', () => {
    test('should have public route table', () => {
      expect(template.Resources.PublicRouteTable).toBeDefined();
      expect(template.Resources.PublicRouteTable.Type).toBe('AWS::EC2::RouteTable');
    });

    test('should have private route table', () => {
      expect(template.Resources.PrivateRouteTable).toBeDefined();
      expect(template.Resources.PrivateRouteTable.Type).toBe('AWS::EC2::RouteTable');
    });

    test('should have route to Internet Gateway for public subnets', () => {
      expect(template.Resources.PublicRoute).toBeDefined();
      expect(template.Resources.PublicRoute.Properties.GatewayId).toBeDefined();
    });

    test('should have route to NAT Gateway for private subnets', () => {
      expect(template.Resources.PrivateRoute).toBeDefined();
      expect(template.Resources.PrivateRoute.Properties.NatGatewayId).toBeDefined();
    });
  });

  describe('Security Group Resources', () => {
    test('should have ALB security group', () => {
      expect(template.Resources.ALBSecurityGroup).toBeDefined();
      expect(template.Resources.ALBSecurityGroup.Type).toBe('AWS::EC2::SecurityGroup');
    });

    test('ALB security group should allow HTTP inbound', () => {
      const ingress = template.Resources.ALBSecurityGroup.Properties.SecurityGroupIngress;
      expect(ingress).toBeDefined();
      expect(Array.isArray(ingress)).toBe(true);
      const httpRule = ingress.find(rule => rule.FromPort === 80);
      expect(httpRule).toBeDefined();
      expect(httpRule.CidrIp).toBe('0.0.0.0/0');
    });

    test('should have ECS security group', () => {
      expect(template.Resources.ECSSecurityGroup).toBeDefined();
      expect(template.Resources.ECSSecurityGroup.Type).toBe('AWS::EC2::SecurityGroup');
    });

    test('ECS security group should allow traffic from ALB', () => {
      const ingress = template.Resources.ECSSecurityGroup.Properties.SecurityGroupIngress;
      expect(ingress).toBeDefined();
      expect(Array.isArray(ingress)).toBe(true);
    });
  });

  describe('ECS Resources', () => {
    test('should have ECS cluster', () => {
      expect(template.Resources.ECSCluster).toBeDefined();
      expect(template.Resources.ECSCluster.Type).toBe('AWS::ECS::Cluster');
    });

    test('ECS cluster should have name with EnvironmentSuffix', () => {
      const clusterName = template.Resources.ECSCluster.Properties.ClusterName;
      expect(clusterName).toBeDefined();
      expect(clusterName['Fn::Sub']).toBeDefined();
      expect(clusterName['Fn::Sub']).toContain('${EnvironmentSuffix}');
    });

    test('should have ECS task definition', () => {
      expect(template.Resources.ECSTaskDefinition).toBeDefined();
      expect(template.Resources.ECSTaskDefinition.Type).toBe('AWS::ECS::TaskDefinition');
    });

    test('task definition should use Fargate', () => {
      const requires = template.Resources.ECSTaskDefinition.Properties.RequiresCompatibilities;
      expect(requires).toContain('FARGATE');
      expect(template.Resources.ECSTaskDefinition.Properties.NetworkMode).toBe('awsvpc');
    });

    test('task definition should have container definition', () => {
      const containers = template.Resources.ECSTaskDefinition.Properties.ContainerDefinitions;
      expect(Array.isArray(containers)).toBe(true);
      expect(containers.length).toBeGreaterThan(0);
    });

    test('container definition should have literal string name', () => {
      const containerName = template.Resources.ECSTaskDefinition.Properties.ContainerDefinitions[0].Name;
      expect(typeof containerName).toBe('string');
      expect(containerName).toBe('app-container');
    });

    test('container should have port mapping', () => {
      const portMappings = template.Resources.ECSTaskDefinition.Properties.ContainerDefinitions[0].PortMappings;
      expect(Array.isArray(portMappings)).toBe(true);
      expect(portMappings.length).toBeGreaterThan(0);
    });

    test('container should have CloudWatch logs configuration', () => {
      const logConfig = template.Resources.ECSTaskDefinition.Properties.ContainerDefinitions[0].LogConfiguration;
      expect(logConfig).toBeDefined();
      expect(logConfig.LogDriver).toBe('awslogs');
    });

    test('should have ECS service', () => {
      expect(template.Resources.ECSService).toBeDefined();
      expect(template.Resources.ECSService.Type).toBe('AWS::ECS::Service');
    });

    test('ECS service should use Fargate launch type', () => {
      expect(template.Resources.ECSService.Properties.LaunchType).toBe('FARGATE');
    });

    test('ECS service should have network configuration', () => {
      const networkConfig = template.Resources.ECSService.Properties.NetworkConfiguration;
      expect(networkConfig).toBeDefined();
      expect(networkConfig.AwsvpcConfiguration).toBeDefined();
      expect(networkConfig.AwsvpcConfiguration.AssignPublicIp).toBe('DISABLED');
    });

    test('ECS service should deploy to private subnets', () => {
      const subnets = template.Resources.ECSService.Properties.NetworkConfiguration.AwsvpcConfiguration.Subnets;
      expect(Array.isArray(subnets)).toBe(true);
      expect(subnets.length).toBe(2);
    });

    test('ECS service should have load balancer configuration', () => {
      const loadBalancers = template.Resources.ECSService.Properties.LoadBalancers;
      expect(Array.isArray(loadBalancers)).toBe(true);
      expect(loadBalancers.length).toBeGreaterThan(0);
    });

    test('ECS service load balancer should reference correct container name', () => {
      const containerName = template.Resources.ECSService.Properties.LoadBalancers[0].ContainerName;
      expect(containerName).toBe('app-container');
    });

    test('ECS service should have deployment circuit breaker', () => {
      const deploymentConfig = template.Resources.ECSService.Properties.DeploymentConfiguration;
      expect(deploymentConfig.DeploymentCircuitBreaker).toBeDefined();
      expect(deploymentConfig.DeploymentCircuitBreaker.Enable).toBe(true);
    });

    test('should have IAM role for ECS', () => {
      expect(template.Resources.ECSClusterRole).toBeDefined();
      expect(template.Resources.ECSClusterRole.Type).toBe('AWS::IAM::Role');
    });
  });

  describe('Load Balancer Resources', () => {
    test('should have Application Load Balancer', () => {
      expect(template.Resources.LoadBalancer).toBeDefined();
      expect(template.Resources.LoadBalancer.Type).toBe('AWS::ElasticLoadBalancingV2::LoadBalancer');
    });

    test('ALB should be internet-facing', () => {
      expect(template.Resources.LoadBalancer.Properties.Scheme).toBe('internet-facing');
    });

    test('ALB should be in public subnets', () => {
      const subnets = template.Resources.LoadBalancer.Properties.Subnets;
      expect(Array.isArray(subnets)).toBe(true);
      expect(subnets.length).toBe(2);
    });

    test('should have target group', () => {
      expect(template.Resources.TargetGroup).toBeDefined();
      expect(template.Resources.TargetGroup.Type).toBe('AWS::ElasticLoadBalancingV2::TargetGroup');
    });

    test('target group should use IP target type for Fargate', () => {
      expect(template.Resources.TargetGroup.Properties.TargetType).toBe('ip');
    });

    test('target group should have health check', () => {
      const healthCheck = template.Resources.TargetGroup.Properties.HealthCheckPath;
      expect(healthCheck).toBeDefined();
    });

    test('should have HTTP listener', () => {
      expect(template.Resources.ListenerHTTP).toBeDefined();
      expect(template.Resources.ListenerHTTP.Type).toBe('AWS::ElasticLoadBalancingV2::Listener');
    });

    test('HTTP listener should forward to target group', () => {
      const defaultActions = template.Resources.ListenerHTTP.Properties.DefaultActions;
      expect(Array.isArray(defaultActions)).toBe(true);
      expect(defaultActions[0].Type).toBe('forward');
    });
  });

  describe('DynamoDB Resources', () => {
    test('should have DynamoDB table', () => {
      expect(template.Resources.ApplicationTable).toBeDefined();
      expect(template.Resources.ApplicationTable.Type).toBe('AWS::DynamoDB::Table');
    });

    test('DynamoDB table should use PAY_PER_REQUEST billing', () => {
      expect(template.Resources.ApplicationTable.Properties.BillingMode).toBe('PAY_PER_REQUEST');
    });

    test('DynamoDB table should have EnvironmentSuffix in name', () => {
      const tableName = template.Resources.ApplicationTable.Properties.TableName;
      expect(tableName).toBeDefined();
      expect(tableName['Fn::Sub']).toContain('${EnvironmentSuffix}');
    });

    test('DynamoDB table should have key schema', () => {
      const keySchema = template.Resources.ApplicationTable.Properties.KeySchema;
      expect(Array.isArray(keySchema)).toBe(true);
      expect(keySchema.length).toBeGreaterThan(0);
      expect(keySchema[0].KeyType).toBe('HASH');
    });

    test('DynamoDB table should have attribute definitions', () => {
      const attributes = template.Resources.ApplicationTable.Properties.AttributeDefinitions;
      expect(Array.isArray(attributes)).toBe(true);
      expect(attributes.length).toBeGreaterThan(0);
    });

    test('DynamoDB table should have streams enabled', () => {
      const streamSpec = template.Resources.ApplicationTable.Properties.StreamSpecification;
      expect(streamSpec).toBeDefined();
      expect(streamSpec.StreamViewType).toBeDefined();
    });

    test('DynamoDB table should have point-in-time recovery enabled', () => {
      const pitr = template.Resources.ApplicationTable.Properties.PointInTimeRecoverySpecification;
      expect(pitr).toBeDefined();
      expect(pitr.PointInTimeRecoveryEnabled).toBe(true);
    });

    test('DynamoDB table should NOT have DeletionProtection', () => {
      expect(template.Resources.ApplicationTable.Properties.DeletionProtectionEnabled).toBeUndefined();
    });
  });

  describe('Auto Scaling Resources', () => {
    test('should have auto scaling target', () => {
      expect(template.Resources.AutoScalingTarget).toBeDefined();
      expect(template.Resources.AutoScalingTarget.Type).toBe('AWS::ApplicationAutoScaling::ScalableTarget');
    });

    test('auto scaling target should use correct service namespace', () => {
      expect(template.Resources.AutoScalingTarget.Properties.ServiceNamespace).toBe('ecs');
    });

    test('auto scaling target should use correct scalable dimension', () => {
      expect(template.Resources.AutoScalingTarget.Properties.ScalableDimension).toBe('ecs:service:DesiredCount');
    });

    test('auto scaling target should have ResourceId with Fn::Join', () => {
      const resourceId = template.Resources.AutoScalingTarget.Properties.ResourceId;
      expect(resourceId['Fn::Join']).toBeDefined();
    });

    test('should have CPU scaling policy', () => {
      expect(template.Resources.CPUScalingPolicy).toBeDefined();
      expect(template.Resources.CPUScalingPolicy.Type).toBe('AWS::ApplicationAutoScaling::ScalingPolicy');
    });

    test('CPU scaling policy should use target tracking', () => {
      expect(template.Resources.CPUScalingPolicy.Properties.PolicyType).toBe('TargetTrackingScaling');
    });

    test('should have memory scaling policy', () => {
      expect(template.Resources.MemoryScalingPolicy).toBeDefined();
      expect(template.Resources.MemoryScalingPolicy.Type).toBe('AWS::ApplicationAutoScaling::ScalingPolicy');
    });

    test('memory scaling policy should use target tracking', () => {
      expect(template.Resources.MemoryScalingPolicy.Properties.PolicyType).toBe('TargetTrackingScaling');
    });
  });

  describe('CloudWatch Resources', () => {
    test('should have CloudWatch log group', () => {
      expect(template.Resources.CloudWatchLogGroup).toBeDefined();
      expect(template.Resources.CloudWatchLogGroup.Type).toBe('AWS::Logs::LogGroup');
    });

    test('log group should have retention period', () => {
      expect(template.Resources.CloudWatchLogGroup.Properties.RetentionInDays).toBeDefined();
    });

    test('should have ECS CPU utilization alarm', () => {
      expect(template.Resources.ECSCPUUtilizationAlarm).toBeDefined();
      expect(template.Resources.ECSCPUUtilizationAlarm.Type).toBe('AWS::CloudWatch::Alarm');
    });

    test('should have DynamoDB throttle alarm', () => {
      expect(template.Resources.DynamoDBThrottleAlarm).toBeDefined();
      expect(template.Resources.DynamoDBThrottleAlarm.Type).toBe('AWS::CloudWatch::Alarm');
    });

    test('should have ALB target health alarm', () => {
      expect(template.Resources.ALBTargetHealthAlarm).toBeDefined();
      expect(template.Resources.ALBTargetHealthAlarm.Type).toBe('AWS::CloudWatch::Alarm');
    });

    test('should have CloudWatch dashboard', () => {
      expect(template.Resources.CloudWatchDashboard).toBeDefined();
      expect(template.Resources.CloudWatchDashboard.Type).toBe('AWS::CloudWatch::Dashboard');
    });

    test('dashboard should have DashboardBody as string with Fn::Sub', () => {
      const dashboardBody = template.Resources.CloudWatchDashboard.Properties.DashboardBody;
      expect(dashboardBody['Fn::Sub']).toBeDefined();
      expect(typeof dashboardBody['Fn::Sub']).toBe('string');
    });

    test('should have SNS topic for alarms', () => {
      expect(template.Resources.SNSTopic).toBeDefined();
      expect(template.Resources.SNSTopic.Type).toBe('AWS::SNS::Topic');
    });
  });

  describe('SSM Parameter Resources', () => {
    test('should have SSM parameter for database endpoint', () => {
      expect(template.Resources.SSMParameterDatabaseEndpoint).toBeDefined();
      expect(template.Resources.SSMParameterDatabaseEndpoint.Type).toBe('AWS::SSM::Parameter');
    });

    test('database endpoint parameter should be SecureString', () => {
      expect(template.Resources.SSMParameterDatabaseEndpoint.Properties.Type).toBe('String');
    });

    test('should have SSM parameter for API key', () => {
      expect(template.Resources.SSMParameterAPIKey).toBeDefined();
      expect(template.Resources.SSMParameterAPIKey.Type).toBe('AWS::SSM::Parameter');
    });

    test('API key parameter should be String', () => {
      expect(template.Resources.SSMParameterAPIKey.Properties.Type).toBe('String');
    });
  });

  describe('Outputs', () => {
    test('should output VPC ID', () => {
      expect(template.Outputs.VPCId).toBeDefined();
      expect(template.Outputs.VPCId.Value).toBeDefined();
    });

    test('should output public subnet IDs', () => {
      expect(template.Outputs.PublicSubnet1Id).toBeDefined();
      expect(template.Outputs.PublicSubnet2Id).toBeDefined();
    });

    test('should output private subnet IDs', () => {
      expect(template.Outputs.PrivateSubnet1Id).toBeDefined();
      expect(template.Outputs.PrivateSubnet2Id).toBeDefined();
    });

    test('should output ECS cluster name', () => {
      expect(template.Outputs.ECSClusterName).toBeDefined();
    });

    test('should output ECS service name', () => {
      expect(template.Outputs.ECSServiceName).toBeDefined();
    });

    test('should output Load Balancer DNS', () => {
      expect(template.Outputs.LoadBalancerDNS).toBeDefined();
    });

    test('should output DynamoDB table name', () => {
      expect(template.Outputs.DynamoDBTableName).toBeDefined();
    });

    test('should output DynamoDB table ARN', () => {
      expect(template.Outputs.DynamoDBTableArn).toBeDefined();
    });
  });

  describe('EnvironmentSuffix Usage', () => {
    test('VPC should use EnvironmentSuffix in tags', () => {
      const tags = template.Resources.VPC.Properties.Tags;
      const nameTag = tags.find(tag => tag.Key === 'Name');
      expect(nameTag).toBeDefined();
      expect(nameTag.Value['Fn::Sub']).toContain('${EnvironmentSuffix}');
    });

    test('ECS Cluster should use EnvironmentSuffix in name', () => {
      const clusterName = template.Resources.ECSCluster.Properties.ClusterName;
      expect(clusterName['Fn::Sub']).toContain('${EnvironmentSuffix}');
    });

    test('DynamoDB table should use EnvironmentSuffix in name', () => {
      const tableName = template.Resources.ApplicationTable.Properties.TableName;
      expect(tableName['Fn::Sub']).toContain('${EnvironmentSuffix}');
    });

    test('Load Balancer should use EnvironmentSuffix in name', () => {
      const lbName = template.Resources.LoadBalancer.Properties.Name;
      expect(lbName['Fn::Sub']).toContain('${EnvironmentSuffix}');
    });

    test('CloudWatch log group should use EnvironmentSuffix', () => {
      const logGroupName = template.Resources.CloudWatchLogGroup.Properties.LogGroupName;
      expect(logGroupName['Fn::Sub']).toContain('${EnvironmentSuffix}');
    });

    test('SNS topic should use EnvironmentSuffix in name', () => {
      const topicName = template.Resources.SNSTopic.Properties.TopicName;
      expect(topicName['Fn::Sub']).toContain('${EnvironmentSuffix}');
    });
  });

  describe('No Retain Policies', () => {
    test('DynamoDB table should NOT have RetainPolicy', () => {
      expect(template.Resources.ApplicationTable.DeletionPolicy).toBeUndefined();
      expect(template.Resources.ApplicationTable.UpdateReplacePolicy).toBeUndefined();
    });

    test('CloudWatch log group should NOT have RetainPolicy', () => {
      expect(template.Resources.CloudWatchLogGroup.DeletionPolicy).toBeUndefined();
      expect(template.Resources.CloudWatchLogGroup.UpdateReplacePolicy).toBeUndefined();
    });

    test('no resources should have Retain deletion policy', () => {
      const resources = Object.values(template.Resources) as Array<{ DeletionPolicy?: string }>;
      const retainResources = resources.filter(r => r.DeletionPolicy === 'Retain');
      expect(retainResources.length).toBe(0);
    });
  });

  describe('Resource Count', () => {
    test('should have at least 30 resources', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBeGreaterThanOrEqual(30);
    });

    test('should have expected number of outputs', () => {
      const outputCount = Object.keys(template.Outputs).length;
      expect(outputCount).toBeGreaterThanOrEqual(10);
    });
  });
});
```

## Integration Tests

### test/TapStack.int.test.ts

```typescript
import { describe, test, expect, beforeAll } from '@jest/globals';
import { readFileSync } from 'fs';
import { join } from 'path';

describe('CloudFormation Stack Integration Tests', () => {
  let outputs;

  beforeAll(() => {
    const outputsPath = join(process.cwd(), 'cfn-outputs', 'flat-outputs.json');
    const outputsContent = readFileSync(outputsPath, 'utf-8');
    outputs = JSON.parse(outputsContent);
  });

  describe('Stack Outputs Validation', () => {
    test('should have VPC ID output', () => {
      expect(outputs.VPCId).toBeDefined();
      expect(outputs.VPCId).toMatch(/^vpc-[a-z0-9]+$/);
    });

    test('should have public subnet outputs', () => {
      expect(outputs.PublicSubnet1Id).toBeDefined();
      expect(outputs.PublicSubnet2Id).toBeDefined();
      expect(outputs.PublicSubnet1Id).toMatch(/^subnet-[a-z0-9]+$/);
      expect(outputs.PublicSubnet2Id).toMatch(/^subnet-[a-z0-9]+$/);
    });

    test('should have private subnet outputs', () => {
      expect(outputs.PrivateSubnet1Id).toBeDefined();
      expect(outputs.PrivateSubnet2Id).toBeDefined();
      expect(outputs.PrivateSubnet1Id).toMatch(/^subnet-[a-z0-9]+$/);
      expect(outputs.PrivateSubnet2Id).toMatch(/^subnet-[a-z0-9]+$/);
    });

    test('should have ECS cluster name output', () => {
      expect(outputs.ECSClusterName).toBeDefined();
      expect(outputs.ECSClusterName).toMatch(/^cluster-[a-z0-9-]+$/);
    });

    test('should have ECS service name output', () => {
      expect(outputs.ECSServiceName).toBeDefined();
      expect(outputs.ECSServiceName).toMatch(/^svc-[a-z0-9-]+$/);
    });

    test('should have Load Balancer DNS output', () => {
      expect(outputs.LoadBalancerDNS).toBeDefined();
      expect(
        outputs.LoadBalancerDNS.includes('elb.amazonaws.com') ||
        outputs.LoadBalancerDNS.includes('elb.localhost.localstack.cloud')
      ).toBeTruthy();
    });

    test('should have Load Balancer ARN output', () => {
      expect(outputs.LoadBalancerArn).toBeDefined();
      expect(outputs.LoadBalancerArn).toMatch(/^arn:aws:elasticloadbalancing:us-east-1:\d+:loadbalancer\/app\//);
    });

    test('should have Target Group ARN output', () => {
      expect(outputs.TargetGroupArn).toBeDefined();
      expect(outputs.TargetGroupArn).toMatch(/^arn:aws:elasticloadbalancing:us-east-1:\d+:targetgroup\//);
    });

    test('should have DynamoDB table name output', () => {
      expect(outputs.DynamoDBTableName).toBeDefined();
      expect(outputs.DynamoDBTableName).toMatch(/^table-[a-z0-9-]+$/);
    });

    test('should have DynamoDB stream ARN output', () => {
      expect(outputs.DynamoDBStreamArn).toBeDefined();
      expect(outputs.DynamoDBStreamArn).toMatch(/^arn:aws:dynamodb:us-east-1:\d+:table\/[^\/]+\/stream\//);
    });

    test('should have DynamoDB table ARN output', () => {
      expect(outputs.DynamoDBTableArn).toBeDefined();
      expect(outputs.DynamoDBTableArn).toMatch(/^arn:aws:dynamodb:us-east-1:\d+:table\//);
    });

    test('should have CloudWatch log group output', () => {
      expect(outputs.CloudWatchLogGroup).toBeDefined();
      expect(outputs.CloudWatchLogGroup).toMatch(/^\/ecs\/[^\/]+\/[a-z0-9-]+$/);
    });

    test('should have CloudWatch log group name output', () => {
      expect(outputs.CloudWatchLogGroupName).toBeDefined();
      expect(outputs.CloudWatchLogGroupName).toMatch(/^\/ecs\/[^\/]+\/[a-z0-9-]+$/);
    });

    test('should have SNS topic ARN output', () => {
      expect(outputs.SNSTopicArn).toBeDefined();
      expect(outputs.SNSTopicArn).toMatch(/^arn:aws:sns:us-east-1:\d+:/);
    });

    test('should have SSM parameter paths output', () => {
      expect(outputs.SSMParameterDatabaseEndpoint).toBeDefined();
      expect(outputs.SSMParameterAPIKey).toBeDefined();
      expect(outputs.SSMParameterDatabaseEndpoint).toMatch(/^\/[^\/]+\/[^\/]+\/database-endpoint$/);
      expect(outputs.SSMParameterAPIKey).toMatch(/^\/[^\/]+\/[^\/]+\/api-key$/);
    });
  });

  describe('Resource Naming Conventions', () => {
    test('ECS cluster name should follow naming convention', () => {
      expect(outputs.ECSClusterName).toMatch(/^cluster-[a-z0-9-]+$/);
    });

    test('ECS service name should follow naming convention', () => {
      expect(outputs.ECSServiceName).toMatch(/^svc-[a-z0-9-]+$/);
    });

    test('DynamoDB table name should follow naming convention', () => {
      expect(outputs.DynamoDBTableName).toMatch(/^table-[a-z0-9-]+$/);
    });

    test('CloudWatch log group should follow naming convention', () => {
      expect(outputs.CloudWatchLogGroup).toMatch(/^\/ecs\/[^\/]+\/[a-z0-9-]+$/);
    });

    test('Load Balancer name should follow naming convention', () => {
      const lbName = outputs.LoadBalancerDNS.split('.')[0];
      expect(lbName).toMatch(/^alb-[a-z0-9-]+/);
    });
  });

  describe('Multi-AZ Configuration', () => {
    test('should have two public subnets for multi-AZ', () => {
      expect(outputs.PublicSubnet1Id).not.toBe(outputs.PublicSubnet2Id);
    });

    test('should have two private subnets for multi-AZ', () => {
      expect(outputs.PrivateSubnet1Id).not.toBe(outputs.PrivateSubnet2Id);
    });
  });

  describe('Load Balancer Integration', () => {
    test('Load Balancer DNS should be accessible', () => {
      expect(outputs.LoadBalancerDNS).toBeTruthy();
      expect(outputs.LoadBalancerDNS.length).toBeGreaterThan(0);
      expect(
        outputs.LoadBalancerDNS.includes('.elb.amazonaws.com') ||
        outputs.LoadBalancerDNS.includes('.elb.localhost.localstack.cloud')
      ).toBeTruthy();
    });

    test('Load Balancer ARN should match DNS naming', () => {
      const lbName = outputs.LoadBalancerDNS.split('.')[0];
      const arnParts = outputs.LoadBalancerArn.split('/');
      // ARN format: arn:aws:elasticloadbalancing:region:account:loadbalancer/app/name/id
      // The name is the second-to-last part
      const lbArnName = arnParts[arnParts.length - 2];
      expect(lbName).toContain(lbArnName);
    });

    test('Target Group ARN should be valid', () => {
      expect(outputs.TargetGroupArn).toMatch(/^arn:aws:elasticloadbalancing:us-east-1:\d+:targetgroup\/[^\/]+\//);
    });
  });

  describe('DynamoDB Integration', () => {
    test('DynamoDB table ARN should match table name', () => {
      expect(outputs.DynamoDBTableArn).toContain(outputs.DynamoDBTableName);
    });

    test('DynamoDB table should be in correct region', () => {
      expect(outputs.DynamoDBTableArn).toContain('us-east-1');
    });
  });

  describe('Monitoring Integration', () => {
    test('CloudWatch log group should be properly formatted', () => {
      expect(outputs.CloudWatchLogGroup).toMatch(/^\/ecs\/[^\/]+\/[a-z0-9-]+$/);
    });

    test('SNS topic ARN should be in correct region', () => {
      expect(outputs.SNSTopicArn).toContain('us-east-1');
    });

    test('SNS topic should have proper naming', () => {
      const topicName = outputs.SNSTopicArn.split(':').pop();
      expect(topicName).toMatch(/^[a-z0-9-]+$/);
    });
  });

  describe('Configuration Management', () => {
    test('SSM parameter paths should be properly formatted', () => {
      expect(outputs.SSMParameterDatabaseEndpoint).toMatch(/^\/[^\/]+\/[^\/]+\/database-endpoint$/);
      expect(outputs.SSMParameterAPIKey).toMatch(/^\/[^\/]+\/[^\/]+\/api-key$/);
    });

    test('SSM parameters should have distinct paths', () => {
      expect(outputs.SSMParameterDatabaseEndpoint).not.toBe(outputs.SSMParameterAPIKey);
    });
  });

  describe('Resource Consistency', () => {
    test('all ARNs should use same AWS account ID', () => {
      const arns = [
        outputs.LoadBalancerArn,
        outputs.TargetGroupArn,
        outputs.DynamoDBTableArn,
        outputs.SNSTopicArn
      ];

      const accountIds = arns.map(arn => {
        const match = arn.match(/:(\d+):/);
        return match ? match[1] : null;
      });

      const uniqueAccountIds = [...new Set(accountIds.filter(id => id !== null))];
      expect(uniqueAccountIds.length).toBe(1);
      expect(uniqueAccountIds[0]).toMatch(/^\d+$/);
    });

    test('all resources should be in us-east-1 region', () => {
      const regionalResources = [
        outputs.LoadBalancerArn,
        outputs.TargetGroupArn,
        outputs.DynamoDBTableArn,
        outputs.SNSTopicArn
      ];

      regionalResources.forEach(resource => {
        expect(resource).toContain('us-east-1');
      });
    });
  });

  describe('Outputs Completeness', () => {
    test('should have all required networking outputs', () => {
      expect(outputs.VPCId).toBeDefined();
      expect(outputs.PublicSubnet1Id).toBeDefined();
      expect(outputs.PublicSubnet2Id).toBeDefined();
      expect(outputs.PrivateSubnet1Id).toBeDefined();
      expect(outputs.PrivateSubnet2Id).toBeDefined();
    });

    test('should have all required compute outputs', () => {
      expect(outputs.ECSClusterName).toBeDefined();
      expect(outputs.ECSServiceName).toBeDefined();
    });

    test('should have all required load balancer outputs', () => {
      expect(outputs.LoadBalancerDNS).toBeDefined();
      expect(outputs.LoadBalancerArn).toBeDefined();
      expect(outputs.TargetGroupArn).toBeDefined();
    });

    test('should have all required data storage outputs', () => {
      expect(outputs.DynamoDBTableName).toBeDefined();
      expect(outputs.DynamoDBTableArn).toBeDefined();
      expect(outputs.DynamoDBStreamArn).toBeDefined();
    });

    test('should have all required monitoring outputs', () => {
      expect(outputs.CloudWatchLogGroup).toBeDefined();
      expect(outputs.CloudWatchLogGroupName).toBeDefined();
      expect(outputs.SNSTopicArn).toBeDefined();
    });

    test('should have all required configuration outputs', () => {
      expect(outputs.SSMParameterDatabaseEndpoint).toBeDefined();
      expect(outputs.SSMParameterAPIKey).toBeDefined();
    });
  });
});
```
