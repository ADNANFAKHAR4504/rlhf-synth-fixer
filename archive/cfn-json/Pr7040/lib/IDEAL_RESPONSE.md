# CloudFormation Three-Tier Web Application Infrastructure

Complete CloudFormation JSON template implementing a production-ready three-tier architecture for a financial services loan application platform

## File: lib/TapStack.json

```json
{
  "AWSTemplateFormatVersion": "2010-09-09",
  "Description": "Three-tier web application infrastructure with VPC, ALB, Auto Scaling, RDS Aurora, CloudFront, WAF, and Secrets Manager",

  "Parameters": {
    "EnvironmentSuffix": {
      "Type": "String",
      "Description": "Suffix to append to all resource names for uniqueness",
      "Default": "dev",
      "AllowedPattern": "[a-z0-9-]+",
      "ConstraintDescription": "Must contain only lowercase letters, numbers, and hyphens"
    },
    "WebInstanceType": {
      "Type": "String",
      "Description": "Instance type for web tier",
      "Default": "t3.medium",
      "AllowedValues": ["t3.small", "t3.medium", "t3.large"]
    },
    "AppInstanceType": {
      "Type": "String",
      "Description": "Instance type for application tier",
      "Default": "t3.large",
      "AllowedValues": ["t3.medium", "t3.large", "t3.xlarge"]
    },
    "DBInstanceClass": {
      "Type": "String",
      "Description": "Database instance class",
      "Default": "db.t3.small",
      "AllowedValues": ["db.t3.small", "db.t3.medium", "db.r5.large"]
    },
    "Environment": {
      "Type": "String",
      "Description": "Environment tag value",
      "Default": "Development",
      "AllowedValues": ["Development", "Staging", "Production"]
    },
    "ApplicationName": {
      "Type": "String",
      "Description": "Application name tag",
      "Default": "LoanApplication"
    },
    "CostCenter": {
      "Type": "String",
      "Description": "Cost center tag",
      "Default": "Finance"
    },
    "DomainName": {
      "Type": "String",
      "Description": "Domain name for CloudFront (must have ACM certificate)",
      "Default": "example.com"
    }
  },

  "Mappings": {
    "RegionMap": {
      "us-east-1": {
        "AmazonLinux2AMI": "ami-0c02fb55b8a541da7"
      }
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
          {"Key": "Name", "Value": {"Fn::Sub": "vpc-${EnvironmentSuffix}"}},
          {"Key": "Environment", "Value": {"Ref": "Environment"}},
          {"Key": "Application", "Value": {"Ref": "ApplicationName"}},
          {"Key": "CostCenter", "Value": {"Ref": "CostCenter"}}
        ]
      }
    },

    "InternetGateway": {
      "Type": "AWS::EC2::InternetGateway",
      "Properties": {
        "Tags": [
          {"Key": "Name", "Value": {"Fn::Sub": "igw-${EnvironmentSuffix}"}},
          {"Key": "Environment", "Value": {"Ref": "Environment"}},
          {"Key": "Application", "Value": {"Ref": "ApplicationName"}},
          {"Key": "CostCenter", "Value": {"Ref": "CostCenter"}}
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
          {"Key": "Name", "Value": {"Fn::Sub": "public-subnet-1-${EnvironmentSuffix}"}},
          {"Key": "Environment", "Value": {"Ref": "Environment"}},
          {"Key": "Application", "Value": {"Ref": "ApplicationName"}},
          {"Key": "CostCenter", "Value": {"Ref": "CostCenter"}}
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
          {"Key": "Name", "Value": {"Fn::Sub": "public-subnet-2-${EnvironmentSuffix}"}},
          {"Key": "Environment", "Value": {"Ref": "Environment"}},
          {"Key": "Application", "Value": {"Ref": "ApplicationName"}},
          {"Key": "CostCenter", "Value": {"Ref": "CostCenter"}}
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
          {"Key": "Name", "Value": {"Fn::Sub": "public-subnet-3-${EnvironmentSuffix}"}},
          {"Key": "Environment", "Value": {"Ref": "Environment"}},
          {"Key": "Application", "Value": {"Ref": "ApplicationName"}},
          {"Key": "CostCenter", "Value": {"Ref": "CostCenter"}}
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
          {"Key": "Name", "Value": {"Fn::Sub": "private-subnet-1-${EnvironmentSuffix}"}},
          {"Key": "Environment", "Value": {"Ref": "Environment"}},
          {"Key": "Application", "Value": {"Ref": "ApplicationName"}},
          {"Key": "CostCenter", "Value": {"Ref": "CostCenter"}}
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
          {"Key": "Name", "Value": {"Fn::Sub": "private-subnet-2-${EnvironmentSuffix}"}},
          {"Key": "Environment", "Value": {"Ref": "Environment"}},
          {"Key": "Application", "Value": {"Ref": "ApplicationName"}},
          {"Key": "CostCenter", "Value": {"Ref": "CostCenter"}}
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
          {"Key": "Name", "Value": {"Fn::Sub": "private-subnet-3-${EnvironmentSuffix}"}},
          {"Key": "Environment", "Value": {"Ref": "Environment"}},
          {"Key": "Application", "Value": {"Ref": "ApplicationName"}},
          {"Key": "CostCenter", "Value": {"Ref": "CostCenter"}}
        ]
      }
    },

    "DatabaseSubnet1": {
      "Type": "AWS::EC2::Subnet",
      "Properties": {
        "VpcId": {"Ref": "VPC"},
        "CidrBlock": "10.0.21.0/24",
        "AvailabilityZone": {"Fn::Select": [0, {"Fn::GetAZs": ""}]},
        "Tags": [
          {"Key": "Name", "Value": {"Fn::Sub": "database-subnet-1-${EnvironmentSuffix}"}},
          {"Key": "Environment", "Value": {"Ref": "Environment"}},
          {"Key": "Application", "Value": {"Ref": "ApplicationName"}},
          {"Key": "CostCenter", "Value": {"Ref": "CostCenter"}}
        ]
      }
    },

    "DatabaseSubnet2": {
      "Type": "AWS::EC2::Subnet",
      "Properties": {
        "VpcId": {"Ref": "VPC"},
        "CidrBlock": "10.0.22.0/24",
        "AvailabilityZone": {"Fn::Select": [1, {"Fn::GetAZs": ""}]},
        "Tags": [
          {"Key": "Name", "Value": {"Fn::Sub": "database-subnet-2-${EnvironmentSuffix}"}},
          {"Key": "Environment", "Value": {"Ref": "Environment"}},
          {"Key": "Application", "Value": {"Ref": "ApplicationName"}},
          {"Key": "CostCenter", "Value": {"Ref": "CostCenter"}}
        ]
      }
    },

    "DatabaseSubnet3": {
      "Type": "AWS::EC2::Subnet",
      "Properties": {
        "VpcId": {"Ref": "VPC"},
        "CidrBlock": "10.0.23.0/24",
        "AvailabilityZone": {"Fn::Select": [2, {"Fn::GetAZs": ""}]},
        "Tags": [
          {"Key": "Name", "Value": {"Fn::Sub": "database-subnet-3-${EnvironmentSuffix}"}},
          {"Key": "Environment", "Value": {"Ref": "Environment"}},
          {"Key": "Application", "Value": {"Ref": "ApplicationName"}},
          {"Key": "CostCenter", "Value": {"Ref": "CostCenter"}}
        ]
      }
    },

    "NATGateway1EIP": {
      "Type": "AWS::EC2::EIP",
      "DependsOn": "AttachGateway",
      "Properties": {
        "Domain": "vpc",
        "Tags": [
          {"Key": "Name", "Value": {"Fn::Sub": "nat-eip-1-${EnvironmentSuffix}"}},
          {"Key": "Environment", "Value": {"Ref": "Environment"}},
          {"Key": "Application", "Value": {"Ref": "ApplicationName"}},
          {"Key": "CostCenter", "Value": {"Ref": "CostCenter"}}
        ]
      }
    },

    "NATGateway1": {
      "Type": "AWS::EC2::NatGateway",
      "Properties": {
        "AllocationId": {"Fn::GetAtt": ["NATGateway1EIP", "AllocationId"]},
        "SubnetId": {"Ref": "PublicSubnet1"},
        "Tags": [
          {"Key": "Name", "Value": {"Fn::Sub": "nat-gateway-1-${EnvironmentSuffix}"}},
          {"Key": "Environment", "Value": {"Ref": "Environment"}},
          {"Key": "Application", "Value": {"Ref": "ApplicationName"}},
          {"Key": "CostCenter", "Value": {"Ref": "CostCenter"}}
        ]
      }
    },

    "PublicRouteTable": {
      "Type": "AWS::EC2::RouteTable",
      "Properties": {
        "VpcId": {"Ref": "VPC"},
        "Tags": [
          {"Key": "Name", "Value": {"Fn::Sub": "public-rt-${EnvironmentSuffix}"}},
          {"Key": "Environment", "Value": {"Ref": "Environment"}},
          {"Key": "Application", "Value": {"Ref": "ApplicationName"}},
          {"Key": "CostCenter", "Value": {"Ref": "CostCenter"}}
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
          {"Key": "Name", "Value": {"Fn::Sub": "private-rt-1-${EnvironmentSuffix}"}},
          {"Key": "Environment", "Value": {"Ref": "Environment"}},
          {"Key": "Application", "Value": {"Ref": "ApplicationName"}},
          {"Key": "CostCenter", "Value": {"Ref": "CostCenter"}}
        ]
      }
    },

    "PrivateRoute1": {
      "Type": "AWS::EC2::Route",
      "Properties": {
        "RouteTableId": {"Ref": "PrivateRouteTable1"},
        "DestinationCidrBlock": "0.0.0.0/0",
        "NatGatewayId": {"Ref": "NATGateway1"}
      }
    },

    "PrivateSubnet1RouteTableAssociation": {
      "Type": "AWS::EC2::SubnetRouteTableAssociation",
      "Properties": {
        "SubnetId": {"Ref": "PrivateSubnet1"},
        "RouteTableId": {"Ref": "PrivateRouteTable1"}
      }
    },

    "PrivateSubnet2RouteTableAssociation": {
      "Type": "AWS::EC2::SubnetRouteTableAssociation",
      "Properties": {
        "SubnetId": {"Ref": "PrivateSubnet2"},
        "RouteTableId": {"Ref": "PrivateRouteTable1"}
      }
    },

    "PrivateSubnet3RouteTableAssociation": {
      "Type": "AWS::EC2::SubnetRouteTableAssociation",
      "Properties": {
        "SubnetId": {"Ref": "PrivateSubnet3"},
        "RouteTableId": {"Ref": "PrivateRouteTable1"}
      }
    },

    "ALBSecurityGroup": {
      "Type": "AWS::EC2::SecurityGroup",
      "Properties": {
        "GroupDescription": "Security group for Application Load Balancer",
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
          {"Key": "Name", "Value": {"Fn::Sub": "alb-sg-${EnvironmentSuffix}"}},
          {"Key": "Environment", "Value": {"Ref": "Environment"}},
          {"Key": "Application", "Value": {"Ref": "ApplicationName"}},
          {"Key": "CostCenter", "Value": {"Ref": "CostCenter"}}
        ]
      }
    },

    "AppSecurityGroup": {
      "Type": "AWS::EC2::SecurityGroup",
      "Properties": {
        "GroupDescription": "Security group for application tier instances",
        "VpcId": {"Ref": "VPC"},
        "SecurityGroupIngress": [
          {
            "IpProtocol": "tcp",
            "FromPort": 80,
            "ToPort": 80,
            "SourceSecurityGroupId": {"Ref": "ALBSecurityGroup"}
          },
          {
            "IpProtocol": "tcp",
            "FromPort": 443,
            "ToPort": 443,
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
          {"Key": "Name", "Value": {"Fn::Sub": "app-sg-${EnvironmentSuffix}"}},
          {"Key": "Environment", "Value": {"Ref": "Environment"}},
          {"Key": "Application", "Value": {"Ref": "ApplicationName"}},
          {"Key": "CostCenter", "Value": {"Ref": "CostCenter"}}
        ]
      }
    },

    "DBSecurityGroup": {
      "Type": "AWS::EC2::SecurityGroup",
      "Properties": {
        "GroupDescription": "Security group for RDS Aurora database",
        "VpcId": {"Ref": "VPC"},
        "SecurityGroupIngress": [
          {
            "IpProtocol": "tcp",
            "FromPort": 3306,
            "ToPort": 3306,
            "SourceSecurityGroupId": {"Ref": "AppSecurityGroup"}
          },
          {
            "IpProtocol": "tcp",
            "FromPort": 3306,
            "ToPort": 3306,
            "SourceSecurityGroupId": {"Ref": "LambdaSecurityGroup"}
          }
        ],
        "SecurityGroupEgress": [
          {
            "IpProtocol": "-1",
            "CidrIp": "0.0.0.0/0"
          }
        ],
        "Tags": [
          {"Key": "Name", "Value": {"Fn::Sub": "db-sg-${EnvironmentSuffix}"}},
          {"Key": "Environment", "Value": {"Ref": "Environment"}},
          {"Key": "Application", "Value": {"Ref": "ApplicationName"}},
          {"Key": "CostCenter", "Value": {"Ref": "CostCenter"}}
        ]
      }
    },

    "LambdaSecurityGroup": {
      "Type": "AWS::EC2::SecurityGroup",
      "Properties": {
        "GroupDescription": "Security group for Lambda rotation function",
        "VpcId": {"Ref": "VPC"},
        "SecurityGroupEgress": [
          {
            "IpProtocol": "-1",
            "CidrIp": "0.0.0.0/0"
          }
        ],
        "Tags": [
          {"Key": "Name", "Value": {"Fn::Sub": "lambda-sg-${EnvironmentSuffix}"}},
          {"Key": "Environment", "Value": {"Ref": "Environment"}},
          {"Key": "Application", "Value": {"Ref": "ApplicationName"}},
          {"Key": "CostCenter", "Value": {"Ref": "CostCenter"}}
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
          {"Ref": "PublicSubnet2"},
          {"Ref": "PublicSubnet3"}
        ],
        "SecurityGroups": [{"Ref": "ALBSecurityGroup"}],
        "Tags": [
          {"Key": "Name", "Value": {"Fn::Sub": "alb-${EnvironmentSuffix}"}},
          {"Key": "Environment", "Value": {"Ref": "Environment"}},
          {"Key": "Application", "Value": {"Ref": "ApplicationName"}},
          {"Key": "CostCenter", "Value": {"Ref": "CostCenter"}}
        ]
      }
    },

    "ALBTargetGroup": {
      "Type": "AWS::ElasticLoadBalancingV2::TargetGroup",
      "Properties": {
        "Name": {"Fn::Sub": "alb-tg-${EnvironmentSuffix}"},
        "Port": 80,
        "Protocol": "HTTP",
        "VpcId": {"Ref": "VPC"},
        "HealthCheckEnabled": true,
        "HealthCheckProtocol": "HTTP",
        "HealthCheckPath": "/",
        "HealthCheckIntervalSeconds": 30,
        "HealthCheckTimeoutSeconds": 5,
        "HealthyThresholdCount": 2,
        "UnhealthyThresholdCount": 3,
        "TargetType": "instance",
        "Tags": [
          {"Key": "Name", "Value": {"Fn::Sub": "alb-tg-${EnvironmentSuffix}"}},
          {"Key": "Environment", "Value": {"Ref": "Environment"}},
          {"Key": "Application", "Value": {"Ref": "ApplicationName"}},
          {"Key": "CostCenter", "Value": {"Ref": "CostCenter"}}
        ]
      }
    },

    "ALBListener": {
      "Type": "AWS::ElasticLoadBalancingV2::Listener",
      "Properties": {
        "DefaultActions": [
          {
            "Type": "forward",
            "TargetGroupArn": {"Ref": "ALBTargetGroup"}
          }
        ],
        "LoadBalancerArn": {"Ref": "ApplicationLoadBalancer"},
        "Port": 80,
        "Protocol": "HTTP"
      }
    },

    "WebACL": {
      "Type": "AWS::WAFv2::WebACL",
      "Properties": {
        "Name": {"Fn::Sub": "waf-acl-${EnvironmentSuffix}"},
        "Scope": "REGIONAL",
        "DefaultAction": {"Allow": {}},
        "Rules": [
          {
            "Name": "SQLInjectionProtection",
            "Priority": 1,
            "Statement": {
              "SqliMatchStatement": {
                "FieldToMatch": {
                  "AllQueryArguments": {}
                },
                "TextTransformations": [
                  {
                    "Priority": 0,
                    "Type": "URL_DECODE"
                  },
                  {
                    "Priority": 1,
                    "Type": "HTML_ENTITY_DECODE"
                  }
                ]
              }
            },
            "Action": {"Block": {}},
            "VisibilityConfig": {
              "SampledRequestsEnabled": true,
              "CloudWatchMetricsEnabled": true,
              "MetricName": "SQLInjectionProtection"
            }
          },
          {
            "Name": "RateLimitRule",
            "Priority": 2,
            "Statement": {
              "RateBasedStatement": {
                "Limit": 2000,
                "AggregateKeyType": "IP"
              }
            },
            "Action": {"Block": {}},
            "VisibilityConfig": {
              "SampledRequestsEnabled": true,
              "CloudWatchMetricsEnabled": true,
              "MetricName": "RateLimitRule"
            }
          }
        ],
        "VisibilityConfig": {
          "SampledRequestsEnabled": true,
          "CloudWatchMetricsEnabled": true,
          "MetricName": {"Fn::Sub": "waf-acl-${EnvironmentSuffix}"}
        },
        "Tags": [
          {"Key": "Name", "Value": {"Fn::Sub": "waf-acl-${EnvironmentSuffix}"}},
          {"Key": "Environment", "Value": {"Ref": "Environment"}},
          {"Key": "Application", "Value": {"Ref": "ApplicationName"}},
          {"Key": "CostCenter", "Value": {"Ref": "CostCenter"}}
        ]
      }
    },

    "WebACLAssociation": {
      "Type": "AWS::WAFv2::WebACLAssociation",
      "Properties": {
        "ResourceArn": {"Ref": "ApplicationLoadBalancer"},
        "WebACLArn": {"Fn::GetAtt": ["WebACL", "Arn"]}
      }
    },

    "LaunchTemplate": {
      "Type": "AWS::EC2::LaunchTemplate",
      "Properties": {
        "LaunchTemplateName": {"Fn::Sub": "launch-template-${EnvironmentSuffix}"},
        "LaunchTemplateData": {
          "ImageId": {"Fn::FindInMap": ["RegionMap", {"Ref": "AWS::Region"}, "AmazonLinux2AMI"]},
          "InstanceType": {"Ref": "AppInstanceType"},
          "SecurityGroupIds": [{"Ref": "AppSecurityGroup"}],
          "IamInstanceProfile": {
            "Arn": {"Fn::GetAtt": ["EC2InstanceProfile", "Arn"]}
          },
          "UserData": {
            "Fn::Base64": {
              "Fn::Sub": "#!/bin/bash\nyum update -y\nyum install -y httpd\nsystemctl start httpd\nsystemctl enable httpd\necho '<h1>Loan Application Server - ${EnvironmentSuffix}</h1>' > /var/www/html/index.html\n"
            }
          },
          "TagSpecifications": [
            {
              "ResourceType": "instance",
              "Tags": [
                {"Key": "Name", "Value": {"Fn::Sub": "app-instance-${EnvironmentSuffix}"}},
                {"Key": "Environment", "Value": {"Ref": "Environment"}},
                {"Key": "Application", "Value": {"Ref": "ApplicationName"}},
                {"Key": "CostCenter", "Value": {"Ref": "CostCenter"}}
              ]
            }
          ]
        }
      }
    },

    "EC2Role": {
      "Type": "AWS::IAM::Role",
      "Properties": {
        "RoleName": {"Fn::Sub": "ec2-role-${EnvironmentSuffix}"},
        "AssumeRolePolicyDocument": {
          "Version": "2012-10-17",
          "Statement": [
            {
              "Effect": "Allow",
              "Principal": {"Service": "ec2.amazonaws.com"},
              "Action": "sts:AssumeRole"
            }
          ]
        },
        "ManagedPolicyArns": [
          "arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy",
          "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
        ],
        "Tags": [
          {"Key": "Name", "Value": {"Fn::Sub": "ec2-role-${EnvironmentSuffix}"}},
          {"Key": "Environment", "Value": {"Ref": "Environment"}},
          {"Key": "Application", "Value": {"Ref": "ApplicationName"}},
          {"Key": "CostCenter", "Value": {"Ref": "CostCenter"}}
        ]
      }
    },

    "EC2InstanceProfile": {
      "Type": "AWS::IAM::InstanceProfile",
      "Properties": {
        "InstanceProfileName": {"Fn::Sub": "ec2-profile-${EnvironmentSuffix}"},
        "Roles": [{"Ref": "EC2Role"}]
      }
    },

    "AutoScalingGroup": {
      "Type": "AWS::AutoScaling::AutoScalingGroup",
      "Properties": {
        "AutoScalingGroupName": {"Fn::Sub": "asg-${EnvironmentSuffix}"},
        "VPCZoneIdentifier": [
          {"Ref": "PrivateSubnet1"},
          {"Ref": "PrivateSubnet2"},
          {"Ref": "PrivateSubnet3"}
        ],
        "LaunchTemplate": {
          "LaunchTemplateId": {"Ref": "LaunchTemplate"},
          "Version": {"Fn::GetAtt": ["LaunchTemplate", "LatestVersionNumber"]}
        },
        "MinSize": 2,
        "MaxSize": 6,
        "DesiredCapacity": 2,
        "HealthCheckType": "ELB",
        "HealthCheckGracePeriod": 300,
        "TargetGroupARNs": [{"Ref": "ALBTargetGroup"}],
        "Tags": [
          {"Key": "Name", "Value": {"Fn::Sub": "asg-instance-${EnvironmentSuffix}"}, "PropagateAtLaunch": true},
          {"Key": "Environment", "Value": {"Ref": "Environment"}, "PropagateAtLaunch": true},
          {"Key": "Application", "Value": {"Ref": "ApplicationName"}, "PropagateAtLaunch": true},
          {"Key": "CostCenter", "Value": {"Ref": "CostCenter"}, "PropagateAtLaunch": true}
        ]
      }
    },

    "ScaleUpPolicy": {
      "Type": "AWS::AutoScaling::ScalingPolicy",
      "Properties": {
        "AutoScalingGroupName": {"Ref": "AutoScalingGroup"},
        "PolicyType": "TargetTrackingScaling",
        "TargetTrackingConfiguration": {
          "PredefinedMetricSpecification": {
            "PredefinedMetricType": "ASGAverageCPUUtilization"
          },
          "TargetValue": 70.0
        }
      }
    },

    "DBSubnetGroup": {
      "Type": "AWS::RDS::DBSubnetGroup",
      "Properties": {
        "DBSubnetGroupName": {"Fn::Sub": "db-subnet-group-${EnvironmentSuffix}"},
        "DBSubnetGroupDescription": "Subnet group for RDS Aurora cluster",
        "SubnetIds": [
          {"Ref": "DatabaseSubnet1"},
          {"Ref": "DatabaseSubnet2"},
          {"Ref": "DatabaseSubnet3"}
        ],
        "Tags": [
          {"Key": "Name", "Value": {"Fn::Sub": "db-subnet-group-${EnvironmentSuffix}"}},
          {"Key": "Environment", "Value": {"Ref": "Environment"}},
          {"Key": "Application", "Value": {"Ref": "ApplicationName"}},
          {"Key": "CostCenter", "Value": {"Ref": "CostCenter"}}
        ]
      }
    },

    "DBSecret": {
      "Type": "AWS::SecretsManager::Secret",
      "Properties": {
        "Name": {"Fn::Sub": "db-credentials-${EnvironmentSuffix}"},
        "Description": "RDS Aurora MySQL database credentials",
        "GenerateSecretString": {
          "SecretStringTemplate": "{\"username\": \"admin\"}",
          "GenerateStringKey": "password",
          "PasswordLength": 32,
          "ExcludeCharacters": "\"@/\\"
        },
        "Tags": [
          {"Key": "Name", "Value": {"Fn::Sub": "db-credentials-${EnvironmentSuffix}"}},
          {"Key": "Environment", "Value": {"Ref": "Environment"}},
          {"Key": "Application", "Value": {"Ref": "ApplicationName"}},
          {"Key": "CostCenter", "Value": {"Ref": "CostCenter"}}
        ]
      }
    },

    "AuroraCluster": {
      "Type": "AWS::RDS::DBCluster",
      "Properties": {
        "DBClusterIdentifier": {"Fn::Sub": "aurora-cluster-${EnvironmentSuffix}"},
        "Engine": "aurora-mysql",
        "EngineVersion": "8.0.mysql_aurora.3.02.0",
        "MasterUsername": {"Fn::Sub": "{{resolve:secretsmanager:${DBSecret}:SecretString:username}}"},
        "MasterUserPassword": {"Fn::Sub": "{{resolve:secretsmanager:${DBSecret}:SecretString:password}}"},
        "DBSubnetGroupName": {"Ref": "DBSubnetGroup"},
        "VpcSecurityGroupIds": [{"Ref": "DBSecurityGroup"}],
        "BackupRetentionPeriod": 7,
        "PreferredBackupWindow": "03:00-04:00",
        "PreferredMaintenanceWindow": "sun:04:00-sun:05:00",
        "StorageEncrypted": true,
        "Tags": [
          {"Key": "Name", "Value": {"Fn::Sub": "aurora-cluster-${EnvironmentSuffix}"}},
          {"Key": "Environment", "Value": {"Ref": "Environment"}},
          {"Key": "Application", "Value": {"Ref": "ApplicationName"}},
          {"Key": "CostCenter", "Value": {"Ref": "CostCenter"}}
        ]
      }
    },

    "AuroraInstance1": {
      "Type": "AWS::RDS::DBInstance",
      "Properties": {
        "DBInstanceIdentifier": {"Fn::Sub": "aurora-instance-1-${EnvironmentSuffix}"},
        "DBClusterIdentifier": {"Ref": "AuroraCluster"},
        "Engine": "aurora-mysql",
        "DBInstanceClass": {"Ref": "DBInstanceClass"},
        "PubliclyAccessible": false,
        "Tags": [
          {"Key": "Name", "Value": {"Fn::Sub": "aurora-instance-1-${EnvironmentSuffix}"}},
          {"Key": "Environment", "Value": {"Ref": "Environment"}},
          {"Key": "Application", "Value": {"Ref": "ApplicationName"}},
          {"Key": "CostCenter", "Value": {"Ref": "CostCenter"}}
        ]
      }
    },

    "AuroraInstance2": {
      "Type": "AWS::RDS::DBInstance",
      "Properties": {
        "DBInstanceIdentifier": {"Fn::Sub": "aurora-instance-2-${EnvironmentSuffix}"},
        "DBClusterIdentifier": {"Ref": "AuroraCluster"},
        "Engine": "aurora-mysql",
        "DBInstanceClass": {"Ref": "DBInstanceClass"},
        "PubliclyAccessible": false,
        "Tags": [
          {"Key": "Name", "Value": {"Fn::Sub": "aurora-instance-2-${EnvironmentSuffix}"}},
          {"Key": "Environment", "Value": {"Ref": "Environment"}},
          {"Key": "Application", "Value": {"Ref": "ApplicationName"}},
          {"Key": "CostCenter", "Value": {"Ref": "CostCenter"}}
        ]
      }
    },

    "AuroraInstance3": {
      "Type": "AWS::RDS::DBInstance",
      "Properties": {
        "DBInstanceIdentifier": {"Fn::Sub": "aurora-instance-3-${EnvironmentSuffix}"},
        "DBClusterIdentifier": {"Ref": "AuroraCluster"},
        "Engine": "aurora-mysql",
        "DBInstanceClass": {"Ref": "DBInstanceClass"},
        "PubliclyAccessible": false,
        "Tags": [
          {"Key": "Name", "Value": {"Fn::Sub": "aurora-instance-3-${EnvironmentSuffix}"}},
          {"Key": "Environment", "Value": {"Ref": "Environment"}},
          {"Key": "Application", "Value": {"Ref": "ApplicationName"}},
          {"Key": "CostCenter", "Value": {"Ref": "CostCenter"}}
        ]
      }
    },

    "SecretTargetAttachment": {
      "Type": "AWS::SecretsManager::SecretTargetAttachment",
      "Properties": {
        "SecretId": {"Ref": "DBSecret"},
        "TargetId": {"Ref": "AuroraCluster"},
        "TargetType": "AWS::RDS::DBCluster"
      }
    },

    "LambdaExecutionRole": {
      "Type": "AWS::IAM::Role",
      "Properties": {
        "RoleName": {"Fn::Sub": "lambda-rotation-role-${EnvironmentSuffix}"},
        "AssumeRolePolicyDocument": {
          "Version": "2012-10-17",
          "Statement": [
            {
              "Effect": "Allow",
              "Principal": {"Service": "lambda.amazonaws.com"},
              "Action": "sts:AssumeRole"
            }
          ]
        },
        "ManagedPolicyArns": [
          "arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole"
        ],
        "Policies": [
          {
            "PolicyName": "SecretsManagerRotationPolicy",
            "PolicyDocument": {
              "Version": "2012-10-17",
              "Statement": [
                {
                  "Effect": "Allow",
                  "Action": [
                    "secretsmanager:DescribeSecret",
                    "secretsmanager:GetSecretValue",
                    "secretsmanager:PutSecretValue",
                    "secretsmanager:UpdateSecretVersionStage"
                  ],
                  "Resource": {"Ref": "DBSecret"}
                },
                {
                  "Effect": "Allow",
                  "Action": [
                    "secretsmanager:GetRandomPassword"
                  ],
                  "Resource": "*"
                }
              ]
            }
          }
        ],
        "Tags": [
          {"Key": "Name", "Value": {"Fn::Sub": "lambda-rotation-role-${EnvironmentSuffix}"}},
          {"Key": "Environment", "Value": {"Ref": "Environment"}},
          {"Key": "Application", "Value": {"Ref": "ApplicationName"}},
          {"Key": "CostCenter", "Value": {"Ref": "CostCenter"}}
        ]
      }
    },

    "RotationLambda": {
      "Type": "AWS::Lambda::Function",
      "Properties": {
        "FunctionName": {"Fn::Sub": "secret-rotation-${EnvironmentSuffix}"},
        "Runtime": "python3.9",
        "Handler": "index.lambda_handler",
        "Role": {"Fn::GetAtt": ["LambdaExecutionRole", "Arn"]},
        "Timeout": 30,
        "VpcConfig": {
          "SecurityGroupIds": [{"Ref": "LambdaSecurityGroup"}],
          "SubnetIds": [
            {"Ref": "PrivateSubnet1"},
            {"Ref": "PrivateSubnet2"},
            {"Ref": "PrivateSubnet3"}
          ]
        },
        "Environment": {
          "Variables": {
            "SECRETS_MANAGER_ENDPOINT": {"Fn::Sub": "https://secretsmanager.${AWS::Region}.amazonaws.com"}
          }
        },
        "Code": {
          "ZipFile": "import json\nimport boto3\nimport os\n\ndef lambda_handler(event, context):\n    service_client = boto3.client('secretsmanager')\n    arn = event['SecretId']\n    token = event['ClientRequestToken']\n    step = event['Step']\n    \n    metadata = service_client.describe_secret(SecretId=arn)\n    if not metadata['RotationEnabled']:\n        raise ValueError(f\"Secret {arn} is not enabled for rotation\")\n    \n    versions = metadata['VersionIdsToStages']\n    if token not in versions:\n        raise ValueError(f\"Secret version {token} has no stage for rotation\")\n    \n    if step == \"createSecret\":\n        create_secret(service_client, arn, token)\n    elif step == \"setSecret\":\n        set_secret(service_client, arn, token)\n    elif step == \"testSecret\":\n        test_secret(service_client, arn, token)\n    elif step == \"finishSecret\":\n        finish_secret(service_client, arn, token)\n    else:\n        raise ValueError(\"Invalid step parameter\")\n\ndef create_secret(service_client, arn, token):\n    service_client.get_secret_value(SecretId=arn, VersionStage=\"AWSCURRENT\")\n    try:\n        service_client.get_secret_value(SecretId=arn, VersionId=token, VersionStage=\"AWSPENDING\")\n    except service_client.exceptions.ResourceNotFoundException:\n        passwd = service_client.get_random_password(ExcludeCharacters='/@\"\\\\\"')\n        current_dict = json.loads(service_client.get_secret_value(SecretId=arn, VersionStage=\"AWSCURRENT\")['SecretString'])\n        current_dict['password'] = passwd['RandomPassword']\n        service_client.put_secret_value(SecretId=arn, ClientRequestToken=token, SecretString=json.dumps(current_dict), VersionStages=['AWSPENDING'])\n\ndef set_secret(service_client, arn, token):\n    pass\n\ndef test_secret(service_client, arn, token):\n    pass\n\ndef finish_secret(service_client, arn, token):\n    metadata = service_client.describe_secret(SecretId=arn)\n    current_version = None\n    for version in metadata[\"VersionIdsToStages\"]:\n        if \"AWSCURRENT\" in metadata[\"VersionIdsToStages\"][version]:\n            if version == token:\n                return\n            current_version = version\n            break\n    service_client.update_secret_version_stage(SecretId=arn, VersionStage=\"AWSCURRENT\", MoveToVersionId=token, RemoveFromVersionId=current_version)\n"
        },
        "Tags": [
          {"Key": "Name", "Value": {"Fn::Sub": "secret-rotation-${EnvironmentSuffix}"}},
          {"Key": "Environment", "Value": {"Ref": "Environment"}},
          {"Key": "Application", "Value": {"Ref": "ApplicationName"}},
          {"Key": "CostCenter", "Value": {"Ref": "CostCenter"}}
        ]
      }
    },

    "LambdaPermission": {
      "Type": "AWS::Lambda::Permission",
      "Properties": {
        "FunctionName": {"Ref": "RotationLambda"},
        "Action": "lambda:InvokeFunction",
        "Principal": "secretsmanager.amazonaws.com"
      }
    },

    "SecretRotationSchedule": {
      "Type": "AWS::SecretsManager::RotationSchedule",
      "DependsOn": "SecretTargetAttachment",
      "Properties": {
        "SecretId": {"Ref": "DBSecret"},
        "RotationLambdaARN": {"Fn::GetAtt": ["RotationLambda", "Arn"]},
        "RotationRules": {
          "AutomaticallyAfterDays": 30
        }
      }
    },

    "StaticContentBucket": {
      "Type": "AWS::S3::Bucket",
      "Properties": {
        "BucketName": {"Fn::Sub": "static-content-${EnvironmentSuffix}-${AWS::AccountId}"},
        "VersioningConfiguration": {
          "Status": "Enabled"
        },
        "LifecycleConfiguration": {
          "Rules": [
            {
              "Id": "TransitionToGlacier",
              "Status": "Enabled",
              "Transitions": [
                {
                  "TransitionInDays": 90,
                  "StorageClass": "GLACIER"
                }
              ]
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
          {"Key": "Name", "Value": {"Fn::Sub": "static-content-${EnvironmentSuffix}"}},
          {"Key": "Environment", "Value": {"Ref": "Environment"}},
          {"Key": "Application", "Value": {"Ref": "ApplicationName"}},
          {"Key": "CostCenter", "Value": {"Ref": "CostCenter"}}
        ]
      }
    },

    "LogsBucket": {
      "Type": "AWS::S3::Bucket",
      "Properties": {
        "BucketName": {"Fn::Sub": "application-logs-${EnvironmentSuffix}-${AWS::AccountId}"},
        "LifecycleConfiguration": {
          "Rules": [
            {
              "Id": "DeleteOldLogs",
              "Status": "Enabled",
              "ExpirationInDays": 90
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
          {"Key": "Name", "Value": {"Fn::Sub": "application-logs-${EnvironmentSuffix}"}},
          {"Key": "Environment", "Value": {"Ref": "Environment"}},
          {"Key": "Application", "Value": {"Ref": "ApplicationName"}},
          {"Key": "CostCenter", "Value": {"Ref": "CostCenter"}}
        ]
      }
    },

    "CloudFrontOAI": {
      "Type": "AWS::CloudFront::CloudFrontOriginAccessIdentity",
      "Properties": {
        "CloudFrontOriginAccessIdentityConfig": {
          "Comment": {"Fn::Sub": "OAI for ${EnvironmentSuffix}"}
        }
      }
    },

    "StaticContentBucketPolicy": {
      "Type": "AWS::S3::BucketPolicy",
      "Properties": {
        "Bucket": {"Ref": "StaticContentBucket"},
        "PolicyDocument": {
          "Statement": [
            {
              "Effect": "Allow",
              "Principal": {
                "CanonicalUser": {"Fn::GetAtt": ["CloudFrontOAI", "S3CanonicalUserId"]}
              },
              "Action": "s3:GetObject",
              "Resource": {"Fn::Sub": "${StaticContentBucket.Arn}/*"}
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
          "Comment": {"Fn::Sub": "CDN for ${EnvironmentSuffix}"},
          "DefaultRootObject": "index.html",
          "Origins": [
            {
              "Id": "S3Origin",
              "DomainName": {"Fn::GetAtt": ["StaticContentBucket", "DomainName"]},
              "S3OriginConfig": {
                "OriginAccessIdentity": {"Fn::Sub": "origin-access-identity/cloudfront/${CloudFrontOAI}"}
              }
            },
            {
              "Id": "ALBOrigin",
              "DomainName": {"Fn::GetAtt": ["ApplicationLoadBalancer", "DNSName"]},
              "CustomOriginConfig": {
                "HTTPPort": 80,
                "HTTPSPort": 443,
                "OriginProtocolPolicy": "http-only"
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
              "Cookies": {"Forward": "none"}
            },
            "MinTTL": 0,
            "DefaultTTL": 86400,
            "MaxTTL": 31536000,
            "Compress": true
          },
          "CacheBehaviors": [
            {
              "PathPattern": "/api/*",
              "TargetOriginId": "ALBOrigin",
              "ViewerProtocolPolicy": "redirect-to-https",
              "AllowedMethods": ["GET", "HEAD", "OPTIONS", "PUT", "POST", "PATCH", "DELETE"],
              "CachedMethods": ["GET", "HEAD"],
              "ForwardedValues": {
                "QueryString": true,
                "Headers": ["*"],
                "Cookies": {"Forward": "all"}
              },
              "MinTTL": 0,
              "DefaultTTL": 0,
              "MaxTTL": 0
            }
          ],
          "ViewerCertificate": {
            "CloudFrontDefaultCertificate": true
          },
          "PriceClass": "PriceClass_100"
        },
        "Tags": [
          {"Key": "Name", "Value": {"Fn::Sub": "cloudfront-${EnvironmentSuffix}"}},
          {"Key": "Environment", "Value": {"Ref": "Environment"}},
          {"Key": "Application", "Value": {"Ref": "ApplicationName"}},
          {"Key": "CostCenter", "Value": {"Ref": "CostCenter"}}
        ]
      }
    },

    "CloudWatchDashboard": {
      "Type": "AWS::CloudWatch::Dashboard",
      "Properties": {
        "DashboardName": {"Fn::Sub": "dashboard-${EnvironmentSuffix}"},
        "DashboardBody": {
          "Fn::Sub": "{\"widgets\":[{\"type\":\"metric\",\"properties\":{\"metrics\":[[\"AWS/ApplicationELB\",\"RequestCount\",{\"stat\":\"Sum\"}],[\".\",\"TargetResponseTime\",{\"stat\":\"Average\"}]],\"period\":300,\"stat\":\"Average\",\"region\":\"${AWS::Region}\",\"title\":\"ALB Metrics\"}},{\"type\":\"metric\",\"properties\":{\"metrics\":[[\"AWS/EC2\",\"CPUUtilization\",{\"stat\":\"Average\"}]],\"period\":300,\"stat\":\"Average\",\"region\":\"${AWS::Region}\",\"title\":\"EC2 CPU Utilization\"}},{\"type\":\"metric\",\"properties\":{\"metrics\":[[\"AWS/RDS\",\"DatabaseConnections\",{\"stat\":\"Sum\"}],[\".\",\"CPUUtilization\",{\"stat\":\"Average\"}]],\"period\":300,\"stat\":\"Average\",\"region\":\"${AWS::Region}\",\"title\":\"RDS Metrics\"}},{\"type\":\"metric\",\"properties\":{\"metrics\":[[\"AWS/CloudFront\",\"Requests\",{\"stat\":\"Sum\"}],[\".\",\"BytesDownloaded\",{\"stat\":\"Sum\"}]],\"period\":300,\"stat\":\"Average\",\"region\":\"us-east-1\",\"title\":\"CloudFront Metrics\"}}]}"
        }
      }
    }
  },

  "Outputs": {
    "VPCId": {
      "Description": "VPC ID",
      "Value": {"Ref": "VPC"},
      "Export": {"Name": {"Fn::Sub": "${AWS::StackName}-VPCId"}}
    },
    "ALBDNSName": {
      "Description": "Application Load Balancer DNS Name",
      "Value": {"Fn::GetAtt": ["ApplicationLoadBalancer", "DNSName"]},
      "Export": {"Name": {"Fn::Sub": "${AWS::StackName}-ALBDNSName"}}
    },
    "CloudFrontDistributionURL": {
      "Description": "CloudFront Distribution URL",
      "Value": {"Fn::GetAtt": ["CloudFrontDistribution", "DomainName"]},
      "Export": {"Name": {"Fn::Sub": "${AWS::StackName}-CloudFrontURL"}}
    },
    "AuroraClusterEndpoint": {
      "Description": "Aurora Cluster Writer Endpoint",
      "Value": {"Fn::GetAtt": ["AuroraCluster", "Endpoint.Address"]},
      "Export": {"Name": {"Fn::Sub": "${AWS::StackName}-AuroraEndpoint"}}
    },
    "AuroraClusterReadEndpoint": {
      "Description": "Aurora Cluster Reader Endpoint",
      "Value": {"Fn::GetAtt": ["AuroraCluster", "ReadEndpoint.Address"]},
      "Export": {"Name": {"Fn::Sub": "${AWS::StackName}-AuroraReadEndpoint"}}
    },
    "StaticContentBucketName": {
      "Description": "S3 Bucket for Static Content",
      "Value": {"Ref": "StaticContentBucket"},
      "Export": {"Name": {"Fn::Sub": "${AWS::StackName}-StaticBucket"}}
    },
    "LogsBucketName": {
      "Description": "S3 Bucket for Application Logs",
      "Value": {"Ref": "LogsBucket"},
      "Export": {"Name": {"Fn::Sub": "${AWS::StackName}-LogsBucket"}}
    },
    "DBSecretArn": {
      "Description": "ARN of Secrets Manager Secret",
      "Value": {"Ref": "DBSecret"},
      "Export": {"Name": {"Fn::Sub": "${AWS::StackName}-DBSecretArn"}}
    },
    "WAFWebACLArn": {
      "Description": "WAF Web ACL ARN",
      "Value": {"Fn::GetAtt": ["WebACL", "Arn"]},
      "Export": {"Name": {"Fn::Sub": "${AWS::StackName}-WAFWebACLArn"}}
    },
    "DashboardURL": {
      "Description": "CloudWatch Dashboard URL",
      "Value": {"Fn::Sub": "https://console.aws.amazon.com/cloudwatch/home?region=${AWS::Region}#dashboards:name=dashboard-${EnvironmentSuffix}"}
    }
  }
}
```
