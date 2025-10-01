```json
{
  "AWSTemplateFormatVersion": "2010-09-09",
  "Description": "CloudFormation template to deploy a containerized web application using ECS, Fargate, ALB, and Route 53.",
  "Parameters": {
    "VpcCidrBlock": {
      "Type": "String",
      "Default": "10.0.0.0/16",
      "Description": "CIDR block for the VPC."
    },
    "PublicSubnet1Cidr": {
      "Type": "String",
      "Default": "10.0.1.0/24",
      "Description": "CIDR block for the first public subnet."
    },
    "PublicSubnet2Cidr": {
      "Type": "String",
      "Default": "10.0.2.0/24",
      "Description": "CIDR block for the second public subnet."
    },
    "PrivateSubnet1Cidr": {
      "Type": "String",
      "Default": "10.0.3.0/24",
      "Description": "CIDR block for the first private subnet."
    },
    "PrivateSubnet2Cidr": {
      "Type": "String",
      "Default": "10.0.4.0/24",
      "Description": "CIDR block for the second private subnet."
    },
    "ImageEcrRepositoryName": {
      "Type": "String",
      "Default": "my-web-app-repo",
      "Description": "Name of the ECR repository for the application container image."
    },
    "DomainName": {
      "Type": "String",
      "Description": "Your custom domain name for Route 53."
    },
    "HostedZoneId": {
      "Type": "String",
      "Description": "The Route 53 Hosted Zone ID for your custom domain."
    }
  },
  "Resources": {
    "VPC": {
      "Type": "AWS::EC2::VPC",
      "Properties": {
        "CidrBlock": {
          "Ref": "VpcCidrBlock"
        },
        "EnableDnsSupport": true,
        "EnableDnsHostnames": true,
        "Tags": [
          {
            "Key": "Environment",
            "Value": "Production"
          }
        ]
      }
    },
    "InternetGateway": {
      "Type": "AWS::EC2::InternetGateway",
      "Properties": {
        "Tags": [
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
          "Ref": "PublicSubnet1Cidr"
        },
        "AvailabilityZone": {
          "Fn::Select": [
            "0",
            {
              "Fn::GetAZs": ""
            }
          ]
        },
        "Tags": [
          {
            "Key": "Environment",
            "Value": "Production"
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
          "Ref": "PublicSubnet2Cidr"
        },
        "AvailabilityZone": {
          "Fn::Select": [
            "1",
            {
              "Fn::GetAZs": ""
            }
          ]
        },
        "Tags": [
          {
            "Key": "Environment",
            "Value": "Production"
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
          "Ref": "PrivateSubnet1Cidr"
        },
        "AvailabilityZone": {
          "Fn::Select": [
            "0",
            {
              "Fn::GetAZs": ""
            }
          ]
        },
        "Tags": [
          {
            "Key": "Environment",
            "Value": "Production"
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
          "Ref": "PrivateSubnet2Cidr"
        },
        "AvailabilityZone": {
          "Fn::Select": [
            "1",
            {
              "Fn::GetAZs": ""
            }
          ]
        },
        "Tags": [
          {
            "Key": "Environment",
            "Value": "Production"
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
            "Key": "Environment",
            "Value": "Production"
          }
        ]
      }
    },
    "PublicRoute": {
      "Type": "AWS::EC2::Route",
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
            "Key": "Environment",
            "Value": "Production"
          }
        ]
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
    "EcrRepository": {
      "Type": "AWS::ECR::Repository",
      "Properties": {
        "RepositoryName": {
          "Ref": "ImageEcrRepositoryName"
        },
        "Tags": [
          {
            "Key": "Environment",
            "Value": "Production"
          }
        ]
      }
    },
    "ECSCluster": {
      "Type": "AWS::ECS::Cluster",
      "Properties": {
        "ClusterName": "WebApp-Cluster",
        "Tags": [
          {
            "Key": "Environment",
            "Value": "Production"
          }
        ]
      }
    },
    "TaskExecutionRole": {
      "Type": "AWS::IAM::Role",
      "Properties": {
        "RoleName": "ecs-task-execution-role",
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
        "Tags": [
          {
            "Key": "Environment",
            "Value": "Production"
          }
        ]
      }
    },
    "TaskRole": {
      "Type": "AWS::IAM::Role",
      "Properties": {
        "RoleName": "ecs-task-role",
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
            "PolicyName": "Allow-CloudWatch-Logs",
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
            "Key": "Environment",
            "Value": "Production"
          }
        ]
      }
    },
    "LogGroup": {
      "Type": "AWS::Logs::LogGroup",
      "Properties": {
        "LogGroupName": "/ecs/webapp",
        "Tags": [
          {
            "Key": "Environment",
            "Value": "Production"
          }
        ]
      }
    },
    "TaskDefinition": {
      "Type": "AWS::ECS::TaskDefinition",
      "Properties": {
        "Family": "webapp-task-definition",
        "NetworkMode": "awsvpc",
        "RequiresCompatibilities": [
          "FARGATE"
        ],
        "Cpu": "256",
        "Memory": "512",
        "ExecutionRoleArn": {
          "Ref": "TaskExecutionRole"
        },
        "TaskRoleArn": {
          "Ref": "TaskRole"
        },
        "ContainerDefinitions": [
          {
            "Name": "webapp-container",
            "Image": {
              "Fn::Join": [
                "",
                [
                  {
                    "Fn::ImportValue": "ECR-Repository-URI"
                  },
                  ":latest"
                ]
              ]
            },
            "PortMappings": [
              {
                "ContainerPort": 80
              }
            ],
            "LogConfiguration": {
              "LogDriver": "awslogs",
              "Options": {
                "awslogs-group": {
                  "Ref": "LogGroup"
                },
                "awslogs-region": {
                  "Ref": "AWS::Region"
                },
                "awslogs-stream-prefix": "ecs"
              }
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
    "ALBSecurityGroup": {
      "Type": "AWS::EC2::SecurityGroup",
      "Properties": {
        "GroupName": "ALB-SecurityGroup",
        "GroupDescription": "Security group for the Application Load Balancer.",
        "VpcId": {
          "Ref": "VPC"
        },
        "SecurityGroupIngress": [
          {
            "IpProtocol": "tcp",
            "FromPort": 80,
            "ToPort": 80,
            "CidrIp": "0.0.0.0/0"
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
    "ECSSecurityGroup": {
      "Type": "AWS::EC2::SecurityGroup",
      "Properties": {
        "GroupName": "ECS-SecurityGroup",
        "GroupDescription": "Security group for ECS tasks.",
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
    "ALB": {
      "Type": "AWS::ElasticLoadBalancingV2::LoadBalancer",
      "Properties": {
        "Name": "WebApp-ALB",
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
            "Key": "Environment",
            "Value": "Production"
          }
        ]
      }
    },
    "TargetGroup": {
      "Type": "AWS::ElasticLoadBalancingV2::TargetGroup",
      "Properties": {
        "Name": "WebApp-TargetGroup",
        "VpcId": {
          "Ref": "VPC"
        },
        "Port": 80,
        "Protocol": "HTTP",
        "Tags": [
          {
            "Key": "Environment",
            "Value": "Production"
          }
        ]
      }
    },
    "Listener": {
      "Type": "AWS::ElasticLoadBalancingV2::Listener",
      "Properties": {
        "LoadBalancerArn": {
          "Ref": "ALB"
        },
        "Port": 80,
        "Protocol": "HTTP",
        "DefaultActions": [
          {
            "Type": "forward",
            "TargetGroupArn": {
              "Ref": "TargetGroup"
            }
          }
        ]
      }
    },
    "ECSService": {
      "Type": "AWS::ECS::Service",
      "Properties": {
        "ServiceName": "WebApp-Service",
        "Cluster": {
          "Ref": "ECSCluster"
        },
        "TaskDefinition": {
          "Ref": "TaskDefinition"
        },
        "LaunchType": "FARGATE",
        "DesiredCount": 2,
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
            "ContainerName": "webapp-container",
            "ContainerPort": 80,
            "TargetGroupArn": {
              "Ref": "TargetGroup"
            }
          }
        ],
        "Tags": [
          {
            "Key": "Environment",
            "Value": "Production"
          }
        ]
      },
      "DependsOn": [
        "Listener",
        "TargetGroup"
      ]
    },
    "ScalingTarget": {
      "Type": "AWS::ApplicationAutoScaling::ScalableTarget",
      "Properties": {
        "MaxCapacity": 4,
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
                  "ECSService",
                  "Name"
                ]
              }
            ]
          ]
        },
        "ScalableDimension": "ecs:service:DesiredCount",
        "ServiceNamespace": "ecs",
        "RoleARN": {
          "Fn::Join": [
            "",
            [
              "arn:aws:iam::",
              {
                "Ref": "AWS::AccountId"
              },
              ":role/aws-service-role/ecs.application-autoscaling.amazonaws.com/AWSServiceRoleForApplicationAutoScaling_ECSService"
            ]
          ]
        },
        "Tags": [
          {
            "Key": "Environment",
            "Value": "Production"
          }
        ]
      }
    },
    "ScalingPolicyCPU": {
      "Type": "AWS::ApplicationAutoScaling::ScalingPolicy",
      "Properties": {
        "PolicyName": "WebApp-CPU-ScalingPolicy",
        "PolicyType": "TargetTrackingScaling",
        "ScalingTargetId": {
          "Ref": "ScalingTarget"
        },
        "TargetTrackingScalingConfiguration": {
          "PredefinedMetricSpecification": {
            "PredefinedMetricType": "ECSServiceAverageCPUUtilization"
          },
          "TargetValue": 50
        }
      }
    },
    "Route53Record": {
      "Type": "AWS::Route53::RecordSet",
      "Properties": {
        "HostedZoneId": {
          "Ref": "HostedZoneId"
        },
        "Name": {
          "Ref": "DomainName"
        },
        "Type": "A",
        "AliasTarget": {
          "HostedZoneId": {
            "Fn::GetAtt": [
              "ALB",
              "CanonicalHostedZoneID"
            ]
          },
          "DNSName": {
            "Fn::GetAtt": [
              "ALB",
              "DNSName"
            ]
          }
        }
      }
    }
  },
  "Outputs": {
    "VPCId": {
      "Description": "The ID of the VPC.",
      "Value": {
        "Ref": "VPC"
      }
    },
    "PublicSubnet1Id": {
      "Description": "The ID of the first public subnet.",
      "Value": {
        "Ref": "PublicSubnet1"
      }
    },
    "PublicSubnet2Id": {
      "Description": "The ID of the second public subnet.",
      "Value": {
        "Ref": "PublicSubnet2"
      }
    },
    "PrivateSubnet1Id": {
      "Description": "The ID of the first private subnet.",
      "Value": {
        "Ref": "PrivateSubnet1"
      }
    },
    "PrivateSubnet2Id": {
      "Description": "The ID of the second private subnet.",
      "Value": {
        "Ref": "PrivateSubnet2"
      }
    },
    "EcrRepositoryUri": {
      "Description": "The URI of the ECR repository.",
      "Value": {
        "Fn::GetAtt": [
          "EcrRepository",
          "RepositoryUri"
        ]
      }
    },
    "ECSClusterName": {
      "Description": "The name of the ECS cluster.",
      "Value": {
        "Ref": "ECSCluster"
      }
    },
    "ECSServiceName": {
      "Description": "The name of the ECS service.",
      "Value": {
        "Fn::GetAtt": [
          "ECSService",
          "Name"
        ]
      }
    },
    "ALBDNSName": {
      "Description": "The DNS name of the Application Load Balancer.",
      "Value": {
        "Fn::GetAtt": [
          "ALB",
          "DNSName"
        ]
      }
    }
  }
}
```