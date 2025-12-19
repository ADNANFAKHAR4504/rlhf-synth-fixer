### Reasoning Trace
---

Looking at the prompt requirements, I need to create a CloudFormation template that creates a comprehensive web application stack with:

1. **Multi-AZ High Availability**: VPC with public and private subnets across 3 AZs (us-east-1a, us-east-1b, us-east-1c)
2. **Load Balancer**: Application Load Balancer in public subnets for HTTP/HTTPS traffic
3. **Compute**: Auto Scaling Group with EC2 instances in private subnets (min=2, max=6)
4. **Networking**: Internet Gateway, NAT Gateway, proper routing
5. **Security**: Security groups with proper ingress rules, IAM roles with least privilege
6. **Storage**: S3 bucket for logs with 30-day lifecycle policy
7. **Naming Convention**: `<project-name>-<resource-type>-<unique-id>`
8. **Outputs**: Load Balancer DNS and S3 bucket name

The current TapStack.json only implements a simple DynamoDB table, which doesn't address any of these requirements. I need to create a comprehensive template that matches the prompt exactly.

### Answer
---

```json
{
  "AWSTemplateFormatVersion": "2010-09-09",
  "Description": "Highly available web application stack with ALB, Auto Scaling Group, and S3 logging",
  "Parameters": {
    "EnvironmentSuffix": {
      "Type": "String",
      "Default": "dev",
      "Description": "Environment suffix for resource naming (e.g., dev, staging, prod)",
      "AllowedPattern": "^[a-zA-Z0-9]+$",
      "ConstraintDescription": "Must contain only alphanumeric characters"
    },
    "InstanceType": {
      "Type": "String",
      "Default": "t3.micro",
      "AllowedValues": ["t3.micro", "t3.small", "t3.medium"],
      "Description": "EC2 instance type"
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
            "Value": {"Fn::Sub": "webapp-vpc-${EnvironmentSuffix}"}
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
            "Value": {"Fn::Sub": "webapp-igw-${EnvironmentSuffix}"}
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
        "AvailabilityZone": "us-east-1a",
        "MapPublicIpOnLaunch": true,
        "Tags": [
          {
            "Key": "Name",
            "Value": {"Fn::Sub": "webapp-subnet-public-1a-${EnvironmentSuffix}"}
          }
        ]
      }
    },
    "PublicSubnet2": {
      "Type": "AWS::EC2::Subnet",
      "Properties": {
        "VpcId": {"Ref": "VPC"},
        "CidrBlock": "10.0.2.0/24",
        "AvailabilityZone": "us-east-1b",
        "MapPublicIpOnLaunch": true,
        "Tags": [
          {
            "Key": "Name",
            "Value": {"Fn::Sub": "webapp-subnet-public-1b-${EnvironmentSuffix}"}
          }
        ]
      }
    },
    "PublicSubnet3": {
      "Type": "AWS::EC2::Subnet",
      "Properties": {
        "VpcId": {"Ref": "VPC"},
        "CidrBlock": "10.0.3.0/24",
        "AvailabilityZone": "us-east-1c",
        "MapPublicIpOnLaunch": true,
        "Tags": [
          {
            "Key": "Name",
            "Value": {"Fn::Sub": "webapp-subnet-public-1c-${EnvironmentSuffix}"}
          }
        ]
      }
    },
    "PrivateSubnet1": {
      "Type": "AWS::EC2::Subnet",
      "Properties": {
        "VpcId": {"Ref": "VPC"},
        "CidrBlock": "10.0.11.0/24",
        "AvailabilityZone": "us-east-1a",
        "Tags": [
          {
            "Key": "Name",
            "Value": {"Fn::Sub": "webapp-subnet-private-1a-${EnvironmentSuffix}"}
          }
        ]
      }
    },
    "PrivateSubnet2": {
      "Type": "AWS::EC2::Subnet",
      "Properties": {
        "VpcId": {"Ref": "VPC"},
        "CidrBlock": "10.0.12.0/24",
        "AvailabilityZone": "us-east-1b",
        "Tags": [
          {
            "Key": "Name",
            "Value": {"Fn::Sub": "webapp-subnet-private-1b-${EnvironmentSuffix}"}
          }
        ]
      }
    },
    "PrivateSubnet3": {
      "Type": "AWS::EC2::Subnet",
      "Properties": {
        "VpcId": {"Ref": "VPC"},
        "CidrBlock": "10.0.13.0/24",
        "AvailabilityZone": "us-east-1c",
        "Tags": [
          {
            "Key": "Name",
            "Value": {"Fn::Sub": "webapp-subnet-private-1c-${EnvironmentSuffix}"}
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
            "Value": {"Fn::Sub": "webapp-eip-nat-${EnvironmentSuffix}"}
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
            "Value": {"Fn::Sub": "webapp-nat-${EnvironmentSuffix}"}
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
            "Value": {"Fn::Sub": "webapp-rt-public-${EnvironmentSuffix}"}
          }
        ]
      }
    },
    "PrivateRouteTable": {
      "Type": "AWS::EC2::RouteTable",
      "Properties": {
        "VpcId": {"Ref": "VPC"},
        "Tags": [
          {
            "Key": "Name",
            "Value": {"Fn::Sub": "webapp-rt-private-${EnvironmentSuffix}"}
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
    "PrivateRoute": {
      "Type": "AWS::EC2::Route",
      "Properties": {
        "RouteTableId": {"Ref": "PrivateRouteTable"},
        "DestinationCidrBlock": "0.0.0.0/0",
        "NatGatewayId": {"Ref": "NatGateway"}
      }
    },
    "PublicSubnetRouteTableAssociation1": {
      "Type": "AWS::EC2::SubnetRouteTableAssociation",
      "Properties": {
        "SubnetId": {"Ref": "PublicSubnet1"},
        "RouteTableId": {"Ref": "PublicRouteTable"}
      }
    },
    "PublicSubnetRouteTableAssociation2": {
      "Type": "AWS::EC2::SubnetRouteTableAssociation",
      "Properties": {
        "SubnetId": {"Ref": "PublicSubnet2"},
        "RouteTableId": {"Ref": "PublicRouteTable"}
      }
    },
    "PublicSubnetRouteTableAssociation3": {
      "Type": "AWS::EC2::SubnetRouteTableAssociation",
      "Properties": {
        "SubnetId": {"Ref": "PublicSubnet3"},
        "RouteTableId": {"Ref": "PublicRouteTable"}
      }
    },
    "PrivateSubnetRouteTableAssociation1": {
      "Type": "AWS::EC2::SubnetRouteTableAssociation",
      "Properties": {
        "SubnetId": {"Ref": "PrivateSubnet1"},
        "RouteTableId": {"Ref": "PrivateRouteTable"}
      }
    },
    "PrivateSubnetRouteTableAssociation2": {
      "Type": "AWS::EC2::SubnetRouteTableAssociation",
      "Properties": {
        "SubnetId": {"Ref": "PrivateSubnet2"},
        "RouteTableId": {"Ref": "PrivateRouteTable"}
      }
    },
    "PrivateSubnetRouteTableAssociation3": {
      "Type": "AWS::EC2::SubnetRouteTableAssociation",
      "Properties": {
        "SubnetId": {"Ref": "PrivateSubnet3"},
        "RouteTableId": {"Ref": "PrivateRouteTable"}
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
        "Tags": [
          {
            "Key": "Name",
            "Value": {"Fn::Sub": "webapp-sg-alb-${EnvironmentSuffix}"}
          }
        ]
      }
    },
    "EC2SecurityGroup": {
      "Type": "AWS::EC2::SecurityGroup",
      "Properties": {
        "GroupDescription": "Security group for EC2 instances",
        "VpcId": {"Ref": "VPC"},
        "SecurityGroupIngress": [
          {
            "IpProtocol": "tcp",
            "FromPort": 80,
            "ToPort": 80,
            "SourceSecurityGroupId": {"Ref": "ALBSecurityGroup"}
          }
        ],
        "Tags": [
          {
            "Key": "Name",
            "Value": {"Fn::Sub": "webapp-sg-ec2-${EnvironmentSuffix}"}
          }
        ]
      }
    },
    "LogsBucket": {
      "Type": "AWS::S3::Bucket",
      "DeletionPolicy": "Delete",
      "Properties": {
        "BucketName": {"Fn::Sub": "webapp-logs-${AWS::AccountId}-${AWS::Region}-${EnvironmentSuffix}"},
        "LifecycleConfiguration": {
          "Rules": [
            {
              "Id": "DeleteLogsAfter30Days",
              "Status": "Enabled",
              "ExpirationInDays": 30
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
            "Value": {"Fn::Sub": "webapp-s3-logs-${EnvironmentSuffix}"}
          }
        ]
      }
    },
    "EC2Role": {
      "Type": "AWS::IAM::Role",
      "Properties": {
        "RoleName": {"Fn::Sub": "webapp-role-ec2-${EnvironmentSuffix}"},
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
        "Policies": [
          {
            "PolicyName": {"Fn::Sub": "webapp-policy-s3logs-${EnvironmentSuffix}"},
            "PolicyDocument": {
              "Version": "2012-10-17",
              "Statement": [
                {
                  "Effect": "Allow",
                  "Action": [
                    "s3:PutObject",
                    "s3:GetObject"
                  ],
                  "Resource": {"Fn::Sub": "${LogsBucket}/*"}
                }
              ]
            }
          }
        ],
        "Tags": [
          {
            "Key": "Name",
            "Value": {"Fn::Sub": "webapp-role-ec2-${EnvironmentSuffix}"}
          }
        ]
      }
    },
    "EC2InstanceProfile": {
      "Type": "AWS::IAM::InstanceProfile",
      "Properties": {
        "InstanceProfileName": {"Fn::Sub": "webapp-profile-ec2-${EnvironmentSuffix}"},
        "Roles": [{"Ref": "EC2Role"}]
      }
    },
    "LaunchTemplate": {
      "Type": "AWS::EC2::LaunchTemplate",
      "Properties": {
        "LaunchTemplateName": {"Fn::Sub": "webapp-lt-web-${EnvironmentSuffix}"},
        "LaunchTemplateData": {
          "ImageId": {"Fn::Sub": "{{resolve:ssm:/aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2:1}}"},
          "InstanceType": {"Ref": "InstanceType"},
          "IamInstanceProfile": {
            "Name": {"Ref": "EC2InstanceProfile"}
          },
          "SecurityGroupIds": [{"Ref": "EC2SecurityGroup"}],
          "UserData": {
            "Fn::Base64": {
              "Fn::Sub": "#!/bin/bash\nyum update -y\nyum install -y httpd\nsystemctl start httpd\nsystemctl enable httpd\necho '<h1>Hello from ${AWS::Region}!</h1>' > /var/www/html/index.html\n"
            }
          },
          "TagSpecifications": [
            {
              "ResourceType": "instance",
              "Tags": [
                {
                  "Key": "Name",
                  "Value": {"Fn::Sub": "webapp-ec2-web-${EnvironmentSuffix}"}
                }
              ]
            }
          ]
        }
      }
    },
    "ApplicationLoadBalancer": {
      "Type": "AWS::ElasticLoadBalancingV2::LoadBalancer",
      "Properties": {
        "Name": {"Fn::Sub": "webapp-alb-${EnvironmentSuffix}"},
        "Scheme": "internet-facing",
        "Type": "application",
        "Subnets": [
          {"Ref": "PublicSubnet1"},
          {"Ref": "PublicSubnet2"},
          {"Ref": "PublicSubnet3"}
        ],
        "SecurityGroups": [{"Ref": "ALBSecurityGroup"}],
        "Tags": [
          {
            "Key": "Name",
            "Value": {"Fn::Sub": "webapp-alb-${EnvironmentSuffix}"}
          }
        ]
      }
    },
    "TargetGroup": {
      "Type": "AWS::ElasticLoadBalancingV2::TargetGroup",
      "Properties": {
        "Name": {"Fn::Sub": "webapp-tg-web-${EnvironmentSuffix}"},
        "Protocol": "HTTP",
        "Port": 80,
        "VpcId": {"Ref": "VPC"},
        "HealthCheckProtocol": "HTTP",
        "HealthCheckPath": "/",
        "HealthCheckIntervalSeconds": 30,
        "HealthyThresholdCount": 2,
        "UnhealthyThresholdCount": 5,
        "Tags": [
          {
            "Key": "Name",
            "Value": {"Fn::Sub": "webapp-tg-web-${EnvironmentSuffix}"}
          }
        ]
      }
    },
    "ALBListener": {
      "Type": "AWS::ElasticLoadBalancingV2::Listener",
      "Properties": {
        "DefaultActions": [
          {
            "Type": "forward",
            "TargetGroupArn": {"Ref": "TargetGroup"}
          }
        ],
        "LoadBalancerArn": {"Ref": "ApplicationLoadBalancer"},
        "Port": 80,
        "Protocol": "HTTP"
      }
    },
    "AutoScalingGroup": {
      "Type": "AWS::AutoScaling::AutoScalingGroup",
      "Properties": {
        "AutoScalingGroupName": {"Fn::Sub": "webapp-asg-web-${EnvironmentSuffix}"},
        "LaunchTemplate": {
          "LaunchTemplateId": {"Ref": "LaunchTemplate"},
          "Version": {"Fn::GetAtt": ["LaunchTemplate", "LatestVersionNumber"]}
        },
        "MinSize": "2",
        "MaxSize": "6",
        "DesiredCapacity": "2",
        "VPCZoneIdentifier": [
          {"Ref": "PrivateSubnet1"},
          {"Ref": "PrivateSubnet2"},
          {"Ref": "PrivateSubnet3"}
        ],
        "TargetGroupARNs": [{"Ref": "TargetGroup"}],
        "HealthCheckType": "ELB",
        "HealthCheckGracePeriod": 300,
        "Tags": [
          {
            "Key": "Name",
            "Value": {"Fn::Sub": "webapp-asg-web-${EnvironmentSuffix}"},
            "PropagateAtLaunch": false
          }
        ]
      }
    }
  },
  "Outputs": {
    "LoadBalancerDNS": {
      "Description": "DNS name of the Application Load Balancer",
      "Value": {"Fn::GetAtt": ["ApplicationLoadBalancer", "DNSName"]}
    },
    "S3BucketName": {
      "Description": "Name of the S3 bucket for application logs",
      "Value": {"Ref": "LogsBucket"}
    }
  }
}
```