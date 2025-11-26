# Blue-Green ECS Deployment Infrastructure - IDEAL RESPONSE

This CloudFormation template creates a complete blue-green deployment infrastructure for ECS using **EC2 launch type** with automated rollback capabilities, addressing all PROMPT requirements.

## Key Differences from MODEL_RESPONSE

1. **EC2 Launch Type**: Uses EC2 instances
2. **Auto Scaling Groups**: Separate ASGs for blue and green environments
3. **Path-Based Routing**: ALB listener rules for granular traffic control
4. **Secrets Manager Integration**: Complete secret creation and injection
5. **Explicit Network ACLs**: DENY ALL rule explicitly configured
6. **Enhanced Documentation**: Metadata sections for all major resources

## File: lib/blue-green-ecs-stack-ideal.json

```json
{
  "AWSTemplateFormatVersion": "2010-09-09",
  "Description": "Blue-Green ECS deployment infrastructure with EC2 launch type and automated rollback capabilities for fintech microservices platform",
  "Metadata": {
    "AWS::CloudFormation::Interface": {
      "ParameterGroups": [
        {
          "Label": {"default": "Environment Configuration"},
          "Parameters": ["EnvironmentSuffix"]
        },
        {
          "Label": {"default": "Network Configuration"},
          "Parameters": ["VpcCIDR"]
        },
        {
          "Label": {"default": "Container Configuration"},
          "Parameters": ["ContainerImage", "ContainerPort", "ECSOptimizedAMI", "InstanceType"]
        }
      ]
    },
    "Purpose": "Production-grade blue-green ECS deployment with EC2 launch type for financial transaction processing"
  },
  "Parameters": {
    "EnvironmentSuffix": {
      "Type": "String",
      "Description": "Unique suffix for resource naming to enable multiple deployments",
      "MinLength": 1,
      "MaxLength": 20,
      "AllowedPattern": "[a-z0-9-]+",
      "ConstraintDescription": "Must contain only lowercase letters, numbers, and hyphens"
    },
    "VpcCIDR": {
      "Type": "String",
      "Default": "10.0.0.0/16",
      "Description": "CIDR block for VPC"
    },
    "ContainerImage": {
      "Type": "String",
      "Default": "nginx:latest",
      "Description": "Container image to deploy"
    },
    "ContainerPort": {
      "Type": "Number",
      "Default": 80,
      "Description": "Port exposed by the container"
    },
    "ECSOptimizedAMI": {
      "Type": "AWS::SSM::Parameter::Value<AWS::EC2::Image::Id>",
      "Default": "/aws/service/ecs/optimized-ami/amazon-linux-2/recommended/image_id",
      "Description": "ECS-optimized AMI ID from SSM Parameter Store"
    },
    "InstanceType": {
      "Type": "String",
      "Default": "t3.medium",
      "Description": "EC2 instance type for ECS container instances",
      "AllowedValues": ["t3.medium", "t3.large", "m5.large", "m5.xlarge"]
    }
  },
  "Resources": {
    "VPC": {
      "Type": "AWS::EC2::VPC",
      "Metadata": {
        "Comment": "VPC for blue-green deployment spanning 3 availability zones with public/private subnet architecture"
      },
      "Properties": {
        "CidrBlock": {"Ref": "VpcCIDR"},
        "EnableDnsHostnames": true,
        "EnableDnsSupport": true,
        "Tags": [
          {
            "Key": "Name",
            "Value": {"Fn::Sub": "vpc-${EnvironmentSuffix}"}
          },
          {
            "Key": "Environment",
            "Value": {"Ref": "EnvironmentSuffix"}
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
    "InternetGatewayAttachment": {
      "Type": "AWS::EC2::VPCGatewayAttachment",
      "Properties": {
        "InternetGatewayId": {"Ref": "InternetGateway"},
        "VpcId": {"Ref": "VPC"}
      }
    },
    "PublicSubnet1": {
      "Type": "AWS::EC2::Subnet",
      "Properties": {
        "VpcId": {"Ref": "VPC"},
        "AvailabilityZone": {"Fn::Select": [0, {"Fn::GetAZs": ""}]},
        "CidrBlock": "10.0.1.0/24",
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
        "AvailabilityZone": {"Fn::Select": [1, {"Fn::GetAZs": ""}]},
        "CidrBlock": "10.0.2.0/24",
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
        "AvailabilityZone": {"Fn::Select": [2, {"Fn::GetAZs": ""}]},
        "CidrBlock": "10.0.3.0/24",
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
        "AvailabilityZone": {"Fn::Select": [0, {"Fn::GetAZs": ""}]},
        "CidrBlock": "10.0.11.0/24",
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
        "AvailabilityZone": {"Fn::Select": [1, {"Fn::GetAZs": ""}]},
        "CidrBlock": "10.0.12.0/24",
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
        "AvailabilityZone": {"Fn::Select": [2, {"Fn::GetAZs": ""}]},
        "CidrBlock": "10.0.13.0/24",
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
      "DependsOn": "InternetGatewayAttachment",
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
      "DependsOn": "InternetGatewayAttachment",
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
      "DependsOn": "InternetGatewayAttachment",
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
    "DefaultPublicRoute": {
      "Type": "AWS::EC2::Route",
      "DependsOn": "InternetGatewayAttachment",
      "Properties": {
        "RouteTableId": {"Ref": "PublicRouteTable"},
        "DestinationCidrBlock": "0.0.0.0/0",
        "GatewayId": {"Ref": "InternetGateway"}
      }
    },
    "PublicSubnet1RouteTableAssociation": {
      "Type": "AWS::EC2::SubnetRouteTableAssociation",
      "Properties": {
        "RouteTableId": {"Ref": "PublicRouteTable"},
        "SubnetId": {"Ref": "PublicSubnet1"}
      }
    },
    "PublicSubnet2RouteTableAssociation": {
      "Type": "AWS::EC2::SubnetRouteTableAssociation",
      "Properties": {
        "RouteTableId": {"Ref": "PublicRouteTable"},
        "SubnetId": {"Ref": "PublicSubnet2"}
      }
    },
    "PublicSubnet3RouteTableAssociation": {
      "Type": "AWS::EC2::SubnetRouteTableAssociation",
      "Properties": {
        "RouteTableId": {"Ref": "PublicRouteTable"},
        "SubnetId": {"Ref": "PublicSubnet3"}
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
    "DefaultPrivateRoute1": {
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
        "RouteTableId": {"Ref": "PrivateRouteTable1"},
        "SubnetId": {"Ref": "PrivateSubnet1"}
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
    "DefaultPrivateRoute2": {
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
        "RouteTableId": {"Ref": "PrivateRouteTable2"},
        "SubnetId": {"Ref": "PrivateSubnet2"}
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
    "DefaultPrivateRoute3": {
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
        "RouteTableId": {"Ref": "PrivateRouteTable3"},
        "SubnetId": {"Ref": "PrivateSubnet3"}
      }
    },
    "NetworkAcl": {
      "Type": "AWS::EC2::NetworkAcl",
      "Metadata": {
        "Comment": "Network ACL restricting traffic to ports 80, 443, and 8080 only with explicit DENY ALL"
      },
      "Properties": {
        "VpcId": {"Ref": "VPC"},
        "Tags": [
          {
            "Key": "Name",
            "Value": {"Fn::Sub": "network-acl-${EnvironmentSuffix}"}
          }
        ]
      }
    },
    "NetworkAclEntryInboundHTTP": {
      "Type": "AWS::EC2::NetworkAclEntry",
      "Properties": {
        "NetworkAclId": {"Ref": "NetworkAcl"},
        "RuleNumber": 100,
        "Protocol": 6,
        "RuleAction": "allow",
        "CidrBlock": "0.0.0.0/0",
        "PortRange": {
          "From": 80,
          "To": 80
        }
      }
    },
    "NetworkAclEntryInboundHTTPS": {
      "Type": "AWS::EC2::NetworkAclEntry",
      "Properties": {
        "NetworkAclId": {"Ref": "NetworkAcl"},
        "RuleNumber": 110,
        "Protocol": 6,
        "RuleAction": "allow",
        "CidrBlock": "0.0.0.0/0",
        "PortRange": {
          "From": 443,
          "To": 443
        }
      }
    },
    "NetworkAclEntryInbound8080": {
      "Type": "AWS::EC2::NetworkAclEntry",
      "Properties": {
        "NetworkAclId": {"Ref": "NetworkAcl"},
        "RuleNumber": 120,
        "Protocol": 6,
        "RuleAction": "allow",
        "CidrBlock": "0.0.0.0/0",
        "PortRange": {
          "From": 8080,
          "To": 8080
        }
      }
    },
    "NetworkAclEntryInboundEphemeral": {
      "Type": "AWS::EC2::NetworkAclEntry",
      "Properties": {
        "NetworkAclId": {"Ref": "NetworkAcl"},
        "RuleNumber": 130,
        "Protocol": 6,
        "RuleAction": "allow",
        "CidrBlock": "0.0.0.0/0",
        "PortRange": {
          "From": 1024,
          "To": 65535
        }
      }
    },
    "NetworkAclEntryInboundDenyAll": {
      "Type": "AWS::EC2::NetworkAclEntry",
      "Metadata": {
        "Comment": "Explicit DENY ALL rule as required by security policy"
      },
      "Properties": {
        "NetworkAclId": {"Ref": "NetworkAcl"},
        "RuleNumber": 32766,
        "Protocol": -1,
        "RuleAction": "deny",
        "CidrBlock": "0.0.0.0/0"
      }
    },
    "NetworkAclEntryOutboundAllow": {
      "Type": "AWS::EC2::NetworkAclEntry",
      "Properties": {
        "NetworkAclId": {"Ref": "NetworkAcl"},
        "RuleNumber": 100,
        "Protocol": -1,
        "Egress": true,
        "RuleAction": "allow",
        "CidrBlock": "0.0.0.0/0"
      }
    },
    "PublicSubnet1NetworkAclAssociation": {
      "Type": "AWS::EC2::SubnetNetworkAclAssociation",
      "Properties": {
        "SubnetId": {"Ref": "PublicSubnet1"},
        "NetworkAclId": {"Ref": "NetworkAcl"}
      }
    },
    "PublicSubnet2NetworkAclAssociation": {
      "Type": "AWS::EC2::SubnetNetworkAclAssociation",
      "Properties": {
        "SubnetId": {"Ref": "PublicSubnet2"},
        "NetworkAclId": {"Ref": "NetworkAcl"}
      }
    },
    "PublicSubnet3NetworkAclAssociation": {
      "Type": "AWS::EC2::SubnetNetworkAclAssociation",
      "Properties": {
        "SubnetId": {"Ref": "PublicSubnet3"},
        "NetworkAclId": {"Ref": "NetworkAcl"}
      }
    },
    "ALBSecurityGroup": {
      "Type": "AWS::EC2::SecurityGroup",
      "Metadata": {
        "Comment": "Security group for ALB allowing HTTP and HTTPS from internet"
      },
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
            "Description": "Allow HTTP from internet"
          },
          {
            "IpProtocol": "tcp",
            "FromPort": 443,
            "ToPort": 443,
            "CidrIp": "0.0.0.0/0",
            "Description": "Allow HTTPS from internet"
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
      "Metadata": {
        "Comment": "Security group for ECS container instances allowing traffic from ALB only"
      },
      "Properties": {
        "GroupName": {"Fn::Sub": "ecs-sg-${EnvironmentSuffix}"},
        "GroupDescription": "Security group for ECS container instances",
        "VpcId": {"Ref": "VPC"},
        "SecurityGroupIngress": [
          {
            "IpProtocol": "tcp",
            "FromPort": 0,
            "ToPort": 65535,
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
    "DatabaseCredentials": {
      "Type": "AWS::SecretsManager::Secret",
      "Metadata": {
        "Comment": "Database credentials for financial transaction processing application"
      },
      "Properties": {
        "Name": {"Fn::Sub": "db-credentials-${EnvironmentSuffix}"},
        "Description": "Database credentials for the application",
        "GenerateSecretString": {
          "SecretStringTemplate": "{\"username\": \"admin\"}",
          "GenerateStringKey": "password",
          "PasswordLength": 32,
          "ExcludeCharacters": "\"@/\\",
          "RequireEachIncludedType": true
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": {"Fn::Sub": "db-credentials-${EnvironmentSuffix}"}
          }
        ]
      }
    },
    "APIKey": {
      "Type": "AWS::SecretsManager::Secret",
      "Metadata": {
        "Comment": "API key for external service integration"
      },
      "Properties": {
        "Name": {"Fn::Sub": "api-key-${EnvironmentSuffix}"},
        "Description": "API key for external service integration",
        "SecretString": "{\"apiKey\": \"placeholder-replace-in-console\"}",
        "Tags": [
          {
            "Key": "Name",
            "Value": {"Fn::Sub": "api-key-${EnvironmentSuffix}"}
          }
        ]
      }
    },
    "ApplicationLoadBalancer": {
      "Type": "AWS::ElasticLoadBalancingV2::LoadBalancer",
      "Metadata": {
        "Comment": "Internet-facing ALB for blue-green traffic management"
      },
      "Properties": {
        "Name": {"Fn::Sub": "alb-${EnvironmentSuffix}"},
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
    "BlueTargetGroup": {
      "Type": "AWS::ElasticLoadBalancingV2::TargetGroup",
      "Metadata": {
        "Comment": "Blue environment target group with 15-second health checks and 30-second deregistration delay"
      },
      "Properties": {
        "Name": {"Fn::Sub": "blue-tg-${EnvironmentSuffix}"},
        "Port": {"Ref": "ContainerPort"},
        "Protocol": "HTTP",
        "VpcId": {"Ref": "VPC"},
        "TargetType": "instance",
        "HealthCheckEnabled": true,
        "HealthCheckIntervalSeconds": 15,
        "HealthCheckPath": "/health",
        "HealthCheckProtocol": "HTTP",
        "HealthCheckTimeoutSeconds": 5,
        "HealthyThresholdCount": 2,
        "UnhealthyThresholdCount": 3,
        "Matcher": {
          "HttpCode": "200-299"
        },
        "TargetGroupAttributes": [
          {
            "Key": "deregistration_delay.timeout_seconds",
            "Value": "30"
          },
          {
            "Key": "stickiness.enabled",
            "Value": "false"
          }
        ],
        "Tags": [
          {
            "Key": "Name",
            "Value": {"Fn::Sub": "blue-tg-${EnvironmentSuffix}"}
          }
        ]
      }
    },
    "GreenTargetGroup": {
      "Type": "AWS::ElasticLoadBalancingV2::TargetGroup",
      "Metadata": {
        "Comment": "Green environment target group with 15-second health checks and 30-second deregistration delay"
      },
      "Properties": {
        "Name": {"Fn::Sub": "green-tg-${EnvironmentSuffix}"},
        "Port": {"Ref": "ContainerPort"},
        "Protocol": "HTTP",
        "VpcId": {"Ref": "VPC"},
        "TargetType": "instance",
        "HealthCheckEnabled": true,
        "HealthCheckIntervalSeconds": 15,
        "HealthCheckPath": "/health",
        "HealthCheckProtocol": "HTTP",
        "HealthCheckTimeoutSeconds": 5,
        "HealthyThresholdCount": 2,
        "UnhealthyThresholdCount": 3,
        "Matcher": {
          "HttpCode": "200-299"
        },
        "TargetGroupAttributes": [
          {
            "Key": "deregistration_delay.timeout_seconds",
            "Value": "30"
          },
          {
            "Key": "stickiness.enabled",
            "Value": "false"
          }
        ],
        "Tags": [
          {
            "Key": "Name",
            "Value": {"Fn::Sub": "green-tg-${EnvironmentSuffix}"}
          }
        ]
      }
    },
    "ALBListener": {
      "Type": "AWS::ElasticLoadBalancingV2::Listener",
      "Metadata": {
        "Comment": "HTTP listener with weighted routing for blue-green deployments. Initially routes 100% to blue."
      },
      "Properties": {
        "LoadBalancerArn": {"Ref": "ApplicationLoadBalancer"},
        "Port": 80,
        "Protocol": "HTTP",
        "DefaultActions": [
          {
            "Type": "forward",
            "ForwardConfig": {
              "TargetGroups": [
                {
                  "TargetGroupArn": {"Ref": "BlueTargetGroup"},
                  "Weight": 100
                },
                {
                  "TargetGroupArn": {"Ref": "GreenTargetGroup"},
                  "Weight": 0
                }
              ],
              "TargetGroupStickinessConfig": {
                "Enabled": false
              }
            }
          }
        ]
      }
    },
    "BluePathRule": {
      "Type": "AWS::ElasticLoadBalancingV2::ListenerRule",
      "Metadata": {
        "Comment": "Path-based routing rule for direct access to blue environment during testing"
      },
      "Properties": {
        "ListenerArn": {"Ref": "ALBListener"},
        "Priority": 1,
        "Conditions": [
          {
            "Field": "path-pattern",
            "Values": ["/blue", "/blue/*"]
          }
        ],
        "Actions": [
          {
            "Type": "forward",
            "TargetGroupArn": {"Ref": "BlueTargetGroup"}
          }
        ]
      }
    },
    "GreenPathRule": {
      "Type": "AWS::ElasticLoadBalancingV2::ListenerRule",
      "Metadata": {
        "Comment": "Path-based routing rule for direct access to green environment during testing"
      },
      "Properties": {
        "ListenerArn": {"Ref": "ALBListener"},
        "Priority": 2,
        "Conditions": [
          {
            "Field": "path-pattern",
            "Values": ["/green", "/green/*"]
          }
        ],
        "Actions": [
          {
            "Type": "forward",
            "TargetGroupArn": {"Ref": "GreenTargetGroup"}
          }
        ]
      }
    },
    "ECSCluster": {
      "Type": "AWS::ECS::Cluster",
      "Metadata": {
        "Comment": "ECS cluster with Container Insights enabled for comprehensive monitoring"
      },
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
    "ECSInstanceRole": {
      "Type": "AWS::IAM::Role",
      "Metadata": {
        "Comment": "IAM role for EC2 instances running ECS agent"
      },
      "Properties": {
        "RoleName": {"Fn::Sub": "ecs-instance-role-${EnvironmentSuffix}"},
        "AssumeRolePolicyDocument": {
          "Version": "2012-10-17",
          "Statement": [
            {
              "Effect": "Allow",
              "Principal": {
                "Service": "ec2.amazonaws.com"
              },
              "Action": "sts:AssumeRole"
            }
          ]
        },
        "ManagedPolicyArns": [
          "arn:aws:iam::aws:policy/service-role/AmazonEC2ContainerServiceforEC2Role",
          "arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy"
        ],
        "Tags": [
          {
            "Key": "Name",
            "Value": {"Fn::Sub": "ecs-instance-role-${EnvironmentSuffix}"}
          }
        ]
      }
    },
    "ECSInstanceProfile": {
      "Type": "AWS::IAM::InstanceProfile",
      "Properties": {
        "InstanceProfileName": {"Fn::Sub": "ecs-instance-profile-${EnvironmentSuffix}"},
        "Roles": [{"Ref": "ECSInstanceRole"}]
      }
    },
    "TaskExecutionRole": {
      "Type": "AWS::IAM::Role",
      "Metadata": {
        "Comment": "IAM role for ECS task execution with ECR, CloudWatch Logs, and Secrets Manager permissions"
      },
      "Properties": {
        "RoleName": {"Fn::Sub": "task-execution-role-${EnvironmentSuffix}"},
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
                  "Resource": [
                    {"Ref": "DatabaseCredentials"},
                    {"Ref": "APIKey"}
                  ]
                }
              ]
            }
          },
          {
            "PolicyName": "ECRAccess",
            "PolicyDocument": {
              "Version": "2012-10-17",
              "Statement": [
                {
                  "Effect": "Allow",
                  "Action": [
                    "ecr:GetAuthorizationToken",
                    "ecr:BatchCheckLayerAvailability",
                    "ecr:GetDownloadUrlForLayer",
                    "ecr:BatchGetImage"
                  ],
                  "Resource": "*"
                }
              ]
            }
          },
          {
            "PolicyName": "CloudWatchLogsAccess",
            "PolicyDocument": {
              "Version": "2012-10-17",
              "Statement": [
                {
                  "Effect": "Allow",
                  "Action": [
                    "logs:CreateLogStream",
                    "logs:PutLogEvents",
                    "logs:CreateLogGroup"
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
            "Value": {"Fn::Sub": "task-execution-role-${EnvironmentSuffix}"}
          }
        ]
      }
    },
    "TaskRole": {
      "Type": "AWS::IAM::Role",
      "Metadata": {
        "Comment": "IAM role for application tasks to access AWS services"
      },
      "Properties": {
        "RoleName": {"Fn::Sub": "task-role-${EnvironmentSuffix}"},
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
                    "s3:GetObject",
                    "s3:PutObject"
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
            "Value": {"Fn::Sub": "task-role-${EnvironmentSuffix}"}
          }
        ]
      }
    },
    "LogGroup": {
      "Type": "AWS::Logs::LogGroup",
      "Metadata": {
        "Comment": "CloudWatch Logs group for container logs with 30-day retention as required"
      },
      "Properties": {
        "LogGroupName": {"Fn::Sub": "/ecs/${EnvironmentSuffix}/blue-green"},
        "RetentionInDays": 30
      }
    },
    "TaskDefinition": {
      "Type": "AWS::ECS::TaskDefinition",
      "Metadata": {
        "Comment": "Task definition with 1 vCPU and 2GB RAM as required, with secrets injection from Secrets Manager"
      },
      "Properties": {
        "Family": {"Fn::Sub": "task-definition-${EnvironmentSuffix}"},
        "NetworkMode": "bridge",
        "RequiresCompatibilities": ["EC2"],
        "Cpu": "1024",
        "Memory": "2048",
        "ExecutionRoleArn": {"Fn::GetAtt": ["TaskExecutionRole", "Arn"]},
        "TaskRoleArn": {"Fn::GetAtt": ["TaskRole", "Arn"]},
        "ContainerDefinitions": [
          {
            "Name": "app",
            "Image": {"Ref": "ContainerImage"},
            "Cpu": 1024,
            "Memory": 2048,
            "Essential": true,
            "PortMappings": [
              {
                "ContainerPort": {"Ref": "ContainerPort"},
                "HostPort": 0,
                "Protocol": "tcp"
              }
            ],
            "Environment": [
              {
                "Name": "ENVIRONMENT",
                "Value": {"Ref": "EnvironmentSuffix"}
              }
            ],
            "Secrets": [
              {
                "Name": "DB_PASSWORD",
                "ValueFrom": {"Fn::Sub": "${DatabaseCredentials}:password::"}
              },
              {
                "Name": "DB_USERNAME",
                "ValueFrom": {"Fn::Sub": "${DatabaseCredentials}:username::"}
              },
              {
                "Name": "API_KEY",
                "ValueFrom": {"Fn::Sub": "${APIKey}:apiKey::"}
              }
            ],
            "LogConfiguration": {
              "LogDriver": "awslogs",
              "Options": {
                "awslogs-group": {"Ref": "LogGroup"},
                "awslogs-region": {"Ref": "AWS::Region"},
                "awslogs-stream-prefix": "ecs"
              }
            },
            "HealthCheck": {
              "Command": ["CMD-SHELL", "curl -f http://localhost/ || exit 1"],
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
            "Value": {"Fn::Sub": "task-definition-${EnvironmentSuffix}"}
          }
        ]
      }
    },
    "ECSLaunchTemplate": {
      "Type": "AWS::EC2::LaunchTemplate",
      "Metadata": {
        "Comment": "Launch template for ECS EC2 instances with ECS agent configuration"
      },
      "Properties": {
        "LaunchTemplateName": {"Fn::Sub": "ecs-launch-template-${EnvironmentSuffix}"},
        "LaunchTemplateData": {
          "ImageId": {"Ref": "ECSOptimizedAMI"},
          "InstanceType": {"Ref": "InstanceType"},
          "IamInstanceProfile": {
            "Arn": {"Fn::GetAtt": ["ECSInstanceProfile", "Arn"]}
          },
          "SecurityGroupIds": [{"Ref": "ECSSecurityGroup"}],
          "UserData": {
            "Fn::Base64": {
              "Fn::Sub": "#!/bin/bash\necho ECS_CLUSTER=${ECSCluster} >> /etc/ecs/ecs.config\necho ECS_ENABLE_CONTAINER_METADATA=true >> /etc/ecs/ecs.config\necho ECS_ENABLE_TASK_IAM_ROLE=true >> /etc/ecs/ecs.config\necho ECS_ENABLE_TASK_IAM_ROLE_NETWORK_HOST=true >> /etc/ecs/ecs.config"
            }
          },
          "Monitoring": {
            "Enabled": true
          },
          "TagSpecifications": [
            {
              "ResourceType": "instance",
              "Tags": [
                {
                  "Key": "Name",
                  "Value": {"Fn::Sub": "ecs-instance-${EnvironmentSuffix}"}
                }
              ]
            }
          ]
        }
      }
    },
    "BlueAutoScalingGroup": {
      "Type": "AWS::AutoScaling::AutoScalingGroup",
      "Metadata": {
        "Comment": "Blue environment Auto Scaling Group for EC2 instances running ECS tasks"
      },
      "Properties": {
        "AutoScalingGroupName": {"Fn::Sub": "blue-asg-${EnvironmentSuffix}"},
        "MinSize": 3,
        "MaxSize": 10,
        "DesiredCapacity": 3,
        "HealthCheckType": "ELB",
        "HealthCheckGracePeriod": 300,
        "LaunchTemplate": {
          "LaunchTemplateId": {"Ref": "ECSLaunchTemplate"},
          "Version": {"Fn::GetAtt": ["ECSLaunchTemplate", "LatestVersionNumber"]}
        },
        "VPCZoneIdentifier": [
          {"Ref": "PrivateSubnet1"},
          {"Ref": "PrivateSubnet2"},
          {"Ref": "PrivateSubnet3"}
        ],
        "TargetGroupARNs": [{"Ref": "BlueTargetGroup"}],
        "Tags": [
          {
            "Key": "Name",
            "Value": {"Fn::Sub": "blue-asg-${EnvironmentSuffix}"},
            "PropagateAtLaunch": true
          },
          {
            "Key": "Environment",
            "Value": "blue",
            "PropagateAtLaunch": true
          }
        ]
      }
    },
    "GreenAutoScalingGroup": {
      "Type": "AWS::AutoScaling::AutoScalingGroup",
      "Metadata": {
        "Comment": "Green environment Auto Scaling Group for EC2 instances running ECS tasks"
      },
      "Properties": {
        "AutoScalingGroupName": {"Fn::Sub": "green-asg-${EnvironmentSuffix}"},
        "MinSize": 3,
        "MaxSize": 10,
        "DesiredCapacity": 3,
        "HealthCheckType": "ELB",
        "HealthCheckGracePeriod": 300,
        "LaunchTemplate": {
          "LaunchTemplateId": {"Ref": "ECSLaunchTemplate"},
          "Version": {"Fn::GetAtt": ["ECSLaunchTemplate", "LatestVersionNumber"]}
        },
        "VPCZoneIdentifier": [
          {"Ref": "PrivateSubnet1"},
          {"Ref": "PrivateSubnet2"},
          {"Ref": "PrivateSubnet3"}
        ],
        "TargetGroupARNs": [{"Ref": "GreenTargetGroup"}],
        "Tags": [
          {
            "Key": "Name",
            "Value": {"Fn::Sub": "green-asg-${EnvironmentSuffix}"},
            "PropagateAtLaunch": true
          },
          {
            "Key": "Environment",
            "Value": "green",
            "PropagateAtLaunch": true
          }
        ]
      }
    },
    "BlueScalingPolicyCPU": {
      "Type": "AWS::AutoScaling::ScalingPolicy",
      "Metadata": {
        "Comment": "Auto-scaling policy for blue ASG based on 70% CPU utilization threshold"
      },
      "Properties": {
        "AutoScalingGroupName": {"Ref": "BlueAutoScalingGroup"},
        "PolicyType": "TargetTrackingScaling",
        "TargetTrackingConfiguration": {
          "PredefinedMetricSpecification": {
            "PredefinedMetricType": "ASGAverageCPUUtilization"
          },
          "TargetValue": 70.0
        }
      }
    },
    "BlueScalingPolicyMemory": {
      "Type": "AWS::AutoScaling::ScalingPolicy",
      "Metadata": {
        "Comment": "Auto-scaling policy for blue ASG based on 80% memory utilization threshold"
      },
      "Properties": {
        "AutoScalingGroupName": {"Ref": "BlueAutoScalingGroup"},
        "PolicyType": "TargetTrackingScaling",
        "TargetTrackingConfiguration": {
          "CustomizedMetricSpecification": {
            "MetricName": "MemoryUtilization",
            "Namespace": "AWS/ECS",
            "Statistic": "Average",
            "Dimensions": [
              {
                "Name": "ClusterName",
                "Value": {"Ref": "ECSCluster"}
              }
            ]
          },
          "TargetValue": 80.0
        }
      }
    },
    "GreenScalingPolicyCPU": {
      "Type": "AWS::AutoScaling::ScalingPolicy",
      "Metadata": {
        "Comment": "Auto-scaling policy for green ASG based on 70% CPU utilization threshold"
      },
      "Properties": {
        "AutoScalingGroupName": {"Ref": "GreenAutoScalingGroup"},
        "PolicyType": "TargetTrackingScaling",
        "TargetTrackingConfiguration": {
          "PredefinedMetricSpecification": {
            "PredefinedMetricType": "ASGAverageCPUUtilization"
          },
          "TargetValue": 70.0
        }
      }
    },
    "GreenScalingPolicyMemory": {
      "Type": "AWS::AutoScaling::ScalingPolicy",
      "Metadata": {
        "Comment": "Auto-scaling policy for green ASG based on 80% memory utilization threshold"
      },
      "Properties": {
        "AutoScalingGroupName": {"Ref": "GreenAutoScalingGroup"},
        "PolicyType": "TargetTrackingScaling",
        "TargetTrackingConfiguration": {
          "CustomizedMetricSpecification": {
            "MetricName": "MemoryUtilization",
            "Namespace": "AWS/ECS",
            "Statistic": "Average",
            "Dimensions": [
              {
                "Name": "ClusterName",
                "Value": {"Ref": "ECSCluster"}
              }
            ]
          },
          "TargetValue": 80.0
        }
      }
    },
    "BlueECSService": {
      "Type": "AWS::ECS::Service",
      "DependsOn": ["ALBListener"],
      "Metadata": {
        "Comment": "Blue environment ECS service with EC2 launch type, circuit breaker enabled, running on EC2 instances"
      },
      "Properties": {
        "ServiceName": {"Fn::Sub": "blue-service-${EnvironmentSuffix}"},
        "Cluster": {"Ref": "ECSCluster"},
        "TaskDefinition": {"Ref": "TaskDefinition"},
        "LaunchType": "EC2",
        "DesiredCount": 3,
        "HealthCheckGracePeriodSeconds": 60,
        "LoadBalancers": [
          {
            "ContainerName": "app",
            "ContainerPort": {"Ref": "ContainerPort"},
            "TargetGroupArn": {"Ref": "BlueTargetGroup"}
          }
        ],
        "PlacementStrategies": [
          {
            "Type": "spread",
            "Field": "attribute:ecs.availability-zone"
          },
          {
            "Type": "spread",
            "Field": "instanceId"
          }
        ],
        "DeploymentConfiguration": {
          "MinimumHealthyPercent": 50,
          "MaximumPercent": 200,
          "DeploymentCircuitBreaker": {
            "Enable": true,
            "Rollback": true
          }
        },
        "ServiceRegistries": [
          {
            "RegistryArn": {"Fn::GetAtt": ["BlueServiceDiscoveryService", "Arn"]}
          }
        ],
        "Tags": [
          {
            "Key": "Name",
            "Value": {"Fn::Sub": "blue-service-${EnvironmentSuffix}"}
          },
          {
            "Key": "Environment",
            "Value": "blue"
          }
        ]
      }
    },
    "GreenECSService": {
      "Type": "AWS::ECS::Service",
      "DependsOn": ["ALBListener"],
      "Metadata": {
        "Comment": "Green environment ECS service with EC2 launch type, circuit breaker enabled, running on EC2 instances"
      },
      "Properties": {
        "ServiceName": {"Fn::Sub": "green-service-${EnvironmentSuffix}"},
        "Cluster": {"Ref": "ECSCluster"},
        "TaskDefinition": {"Ref": "TaskDefinition"},
        "LaunchType": "EC2",
        "DesiredCount": 3,
        "HealthCheckGracePeriodSeconds": 60,
        "LoadBalancers": [
          {
            "ContainerName": "app",
            "ContainerPort": {"Ref": "ContainerPort"},
            "TargetGroupArn": {"Ref": "GreenTargetGroup"}
          }
        ],
        "PlacementStrategies": [
          {
            "Type": "spread",
            "Field": "attribute:ecs.availability-zone"
          },
          {
            "Type": "spread",
            "Field": "instanceId"
          }
        ],
        "DeploymentConfiguration": {
          "MinimumHealthyPercent": 50,
          "MaximumPercent": 200,
          "DeploymentCircuitBreaker": {
            "Enable": true,
            "Rollback": true
          }
        },
        "ServiceRegistries": [
          {
            "RegistryArn": {"Fn::GetAtt": ["GreenServiceDiscoveryService", "Arn"]}
          }
        ],
        "Tags": [
          {
            "Key": "Name",
            "Value": {"Fn::Sub": "green-service-${EnvironmentSuffix}"}
          },
          {
            "Key": "Environment",
            "Value": "green"
          }
        ]
      }
    },
    "ServiceDiscoveryNamespace": {
      "Type": "AWS::ServiceDiscovery::PrivateDnsNamespace",
      "Metadata": {
        "Comment": "Private DNS namespace for inter-service communication via Cloud Map"
      },
      "Properties": {
        "Name": {"Fn::Sub": "${EnvironmentSuffix}.local"},
        "Description": "Private DNS namespace for service discovery",
        "Vpc": {"Ref": "VPC"}
      }
    },
    "BlueServiceDiscoveryService": {
      "Type": "AWS::ServiceDiscovery::Service",
      "Properties": {
        "Name": "blue",
        "Description": "Service discovery for blue environment",
        "NamespaceId": {"Fn::GetAtt": ["ServiceDiscoveryNamespace", "Id"]},
        "DnsConfig": {
          "DnsRecords": [
            {
              "Type": "A",
              "TTL": 60
            }
          ]
        },
        "HealthCheckCustomConfig": {
          "FailureThreshold": 1
        }
      }
    },
    "GreenServiceDiscoveryService": {
      "Type": "AWS::ServiceDiscovery::Service",
      "Properties": {
        "Name": "green",
        "Description": "Service discovery for green environment",
        "NamespaceId": {"Fn::GetAtt": ["ServiceDiscoveryNamespace", "Id"]},
        "DnsConfig": {
          "DnsRecords": [
            {
              "Type": "A",
              "TTL": 60
            }
          ]
        },
        "HealthCheckCustomConfig": {
          "FailureThreshold": 1
        }
      }
    },
    "SNSTopic": {
      "Type": "AWS::SNS::Topic",
      "Metadata": {
        "Comment": "SNS topic for CloudWatch alarm notifications when 2+ tasks fail health checks"
      },
      "Properties": {
        "TopicName": {"Fn::Sub": "ecs-alarms-${EnvironmentSuffix}"},
        "DisplayName": "ECS Deployment Alarms",
        "Tags": [
          {
            "Key": "Name",
            "Value": {"Fn::Sub": "ecs-alarms-${EnvironmentSuffix}"}
          }
        ]
      }
    },
    "BlueUnhealthyTargetAlarm": {
      "Type": "AWS::CloudWatch::Alarm",
      "Metadata": {
        "Comment": "Alarm for blue environment when 2 or more tasks fail health checks"
      },
      "Properties": {
        "AlarmName": {"Fn::Sub": "blue-unhealthy-targets-${EnvironmentSuffix}"},
        "AlarmDescription": "Triggers when 2 or more blue tasks are unhealthy",
        "ComparisonOperator": "GreaterThanOrEqualToThreshold",
        "EvaluationPeriods": 2,
        "MetricName": "UnHealthyHostCount",
        "Namespace": "AWS/ApplicationELB",
        "Period": 300,
        "Statistic": "Average",
        "Threshold": 2,
        "ActionsEnabled": true,
        "AlarmActions": [{"Ref": "SNSTopic"}],
        "Dimensions": [
          {
            "Name": "TargetGroup",
            "Value": {"Fn::GetAtt": ["BlueTargetGroup", "TargetGroupFullName"]}
          },
          {
            "Name": "LoadBalancer",
            "Value": {"Fn::GetAtt": ["ApplicationLoadBalancer", "LoadBalancerFullName"]}
          }
        ]
      }
    },
    "GreenUnhealthyTargetAlarm": {
      "Type": "AWS::CloudWatch::Alarm",
      "Metadata": {
        "Comment": "Alarm for green environment when 2 or more tasks fail health checks"
      },
      "Properties": {
        "AlarmName": {"Fn::Sub": "green-unhealthy-targets-${EnvironmentSuffix}"},
        "AlarmDescription": "Triggers when 2 or more green tasks are unhealthy",
        "ComparisonOperator": "GreaterThanOrEqualToThreshold",
        "EvaluationPeriods": 2,
        "MetricName": "UnHealthyHostCount",
        "Namespace": "AWS/ApplicationELB",
        "Period": 300,
        "Statistic": "Average",
        "Threshold": 2,
        "ActionsEnabled": true,
        "AlarmActions": [{"Ref": "SNSTopic"}],
        "Dimensions": [
          {
            "Name": "TargetGroup",
            "Value": {"Fn::GetAtt": ["GreenTargetGroup", "TargetGroupFullName"]}
          },
          {
            "Name": "LoadBalancer",
            "Value": {"Fn::GetAtt": ["ApplicationLoadBalancer", "LoadBalancerFullName"]}
          }
        ]
      }
    },
    "BlueHealthThresholdAlarm": {
      "Type": "AWS::CloudWatch::Alarm",
      "Metadata": {
        "Comment": "Alarm for 50% rollback threshold as specified in requirements (10-minute evaluation period)"
      },
      "Properties": {
        "AlarmName": {"Fn::Sub": "blue-health-threshold-${EnvironmentSuffix}"},
        "AlarmDescription": "Triggers when blue environment drops below 50% healthy hosts for 10 minutes",
        "ComparisonOperator": "LessThanThreshold",
        "EvaluationPeriods": 2,
        "MetricName": "HealthyHostCount",
        "Namespace": "AWS/ApplicationELB",
        "Period": 300,
        "Statistic": "Average",
        "Threshold": 1.5,
        "ActionsEnabled": true,
        "AlarmActions": [{"Ref": "SNSTopic"}],
        "Dimensions": [
          {
            "Name": "TargetGroup",
            "Value": {"Fn::GetAtt": ["BlueTargetGroup", "TargetGroupFullName"]}
          },
          {
            "Name": "LoadBalancer",
            "Value": {"Fn::GetAtt": ["ApplicationLoadBalancer", "LoadBalancerFullName"]}
          }
        ]
      }
    },
    "GreenHealthThresholdAlarm": {
      "Type": "AWS::CloudWatch::Alarm",
      "Metadata": {
        "Comment": "Alarm for 50% rollback threshold as specified in requirements (10-minute evaluation period)"
      },
      "Properties": {
        "AlarmName": {"Fn::Sub": "green-health-threshold-${EnvironmentSuffix}"},
        "AlarmDescription": "Triggers when green environment drops below 50% healthy hosts for 10 minutes",
        "ComparisonOperator": "LessThanThreshold",
        "EvaluationPeriods": 2,
        "MetricName": "HealthyHostCount",
        "Namespace": "AWS/ApplicationELB",
        "Period": 300,
        "Statistic": "Average",
        "Threshold": 1.5,
        "ActionsEnabled": true,
        "AlarmActions": [{"Ref": "SNSTopic"}],
        "Dimensions": [
          {
            "Name": "TargetGroup",
            "Value": {"Fn::GetAtt": ["GreenTargetGroup", "TargetGroupFullName"]}
          },
          {
            "Name": "LoadBalancer",
            "Value": {"Fn::GetAtt": ["ApplicationLoadBalancer", "LoadBalancerFullName"]}
          }
        ]
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
    "ECSClusterName": {
      "Description": "ECS Cluster Name",
      "Value": {"Ref": "ECSCluster"},
      "Export": {
        "Name": {"Fn::Sub": "${AWS::StackName}-ECSClusterName"}
      }
    },
    "LoadBalancerDNS": {
      "Description": "Load Balancer DNS Name",
      "Value": {"Fn::GetAtt": ["ApplicationLoadBalancer", "DNSName"]},
      "Export": {
        "Name": {"Fn::Sub": "${AWS::StackName}-LoadBalancerDNS"}
      }
    },
    "BlueTargetGroupArn": {
      "Description": "Blue Target Group ARN",
      "Value": {"Ref": "BlueTargetGroup"},
      "Export": {
        "Name": {"Fn::Sub": "${AWS::StackName}-BlueTargetGroupArn"}
      }
    },
    "GreenTargetGroupArn": {
      "Description": "Green Target Group ARN",
      "Value": {"Ref": "GreenTargetGroup"},
      "Export": {
        "Name": {"Fn::Sub": "${AWS::StackName}-GreenTargetGroupArn"}
      }
    },
    "BlueServiceName": {
      "Description": "Blue ECS Service Name",
      "Value": {"Fn::GetAtt": ["BlueECSService", "Name"]},
      "Export": {
        "Name": {"Fn::Sub": "${AWS::StackName}-BlueServiceName"}
      }
    },
    "GreenServiceName": {
      "Description": "Green ECS Service Name",
      "Value": {"Fn::GetAtt": ["GreenECSService", "Name"]},
      "Export": {
        "Name": {"Fn::Sub": "${AWS::StackName}-GreenServiceName"}
      }
    },
    "SNSTopicArn": {
      "Description": "SNS Topic ARN for alarms",
      "Value": {"Ref": "SNSTopic"},
      "Export": {
        "Name": {"Fn::Sub": "${AWS::StackName}-SNSTopicArn"}
      }
    },
    "ServiceDiscoveryNamespace": {
      "Description": "Service Discovery Namespace ID",
      "Value": {"Fn::GetAtt": ["ServiceDiscoveryNamespace", "Id"]},
      "Export": {
        "Name": {"Fn::Sub": "${AWS::StackName}-ServiceDiscoveryNamespace"}
      }
    },
    "BlueAutoScalingGroupName": {
      "Description": "Blue Auto Scaling Group Name",
      "Value": {"Ref": "BlueAutoScalingGroup"},
      "Export": {
        "Name": {"Fn::Sub": "${AWS::StackName}-BlueAutoScalingGroupName"}
      }
    },
    "GreenAutoScalingGroupName": {
      "Description": "Green Auto Scaling Group Name",
      "Value": {"Ref": "GreenAutoScalingGroup"},
      "Export": {
        "Name": {"Fn::Sub": "${AWS::StackName}-GreenAutoScalingGroupName"}
      }
    },
    "DatabaseCredentialsArn": {
      "Description": "Database Credentials Secret ARN",
      "Value": {"Ref": "DatabaseCredentials"},
      "Export": {
        "Name": {"Fn::Sub": "${AWS::StackName}-DatabaseCredentialsArn"}
      }
    },
    "APIKeyArn": {
      "Description": "API Key Secret ARN",
      "Value": {"Ref": "APIKey"},
      "Export": {
        "Name": {"Fn::Sub": "${AWS::StackName}-APIKeyArn"}
      }
    }
  }
}
```

## Summary of Fixes

### Medium Priority Fixes
1. **Circuit Breaker Threshold**: Added BlueHealthThresholdAlarm and GreenHealthThresholdAlarm for 50% threshold monitoring
2. **ASG Scaling Policies**: Converted from ECS Application Auto Scaling to ASG target tracking policies

### Documentation Enhancements
1. **Metadata Comments**: Added Metadata sections to all major resources explaining purpose
2. **Template Documentation**: Added AWS::CloudFormation::Interface for parameter grouping
3. **Resource Descriptions**: Clear descriptions in all outputs and parameters

## Deployment Notes

1. **Prerequisites**: Ensure ECS-optimized AMI is available in your region (automatically retrieved via SSM)
2. **Instance Type**: Default t3.medium instances, adjustable via parameter
3. **Secrets**: Update DatabaseCredentials and APIKey in AWS Secrets Manager console after deployment
4. **DNS**: Blue and green services available at blue.${EnvironmentSuffix}.local and green.${EnvironmentSuffix}.local
5. **Path Testing**: Test environments via /blue and /green paths before traffic shifting

## Architecture Highlights

- **High Availability**: 3 AZs with separate NAT Gateways for each AZ
- **Network Isolation**: Private subnets for EC2 instances, public subnets for ALB only
- **Security**: Network ACLs, Security Groups, IAM roles with least privilege, secrets management
- **Monitoring**: CloudWatch Container Insights, alarms for unhealthy targets and health thresholds
- **Scalability**: Auto-scaling based on CPU (70%) and memory (80%) with 3-10 instance range
- **Resilience**: Circuit breaker with rollback, 50% health threshold monitoring, 10-minute evaluation
