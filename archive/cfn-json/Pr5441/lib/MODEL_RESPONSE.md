### Reasoning Trace

---

This is a comprehensive request for an AWS CloudFormation template. Let me break down the requirements:

1. **VPC and Networking**:
   - VPC with CIDR 10.0.0.0/16 in us-west-1
   - 2 public subnets: 10.0.1.0/24, 10.0.2.0/24
   - 2 private subnets: 10.0.3.0/24, 10.0.4.0/24
   - Across 2 AZs: us-west-1a and us-west-1b
   - Internet Gateway attached to VPC
   - 2 NAT Gateways (one per public subnet) with Elastic IPs
   - Route tables for proper routing

2. **Network Security**:
   - Network ACLs for public and private subnets
   - Security Groups with least privilege principle

3. **Load Balancing**:
   - Application Load Balancer in public subnets
   - Listeners for HTTP (80) and HTTPS (443)
   - Target group for EC2 instances
   - Health checks

4. **Auto Scaling and Compute**:
   - Auto Scaling Group in private subnets
   - Launch Template with t2.micro and Amazon Linux 2
   - Min: 2, Max: 5 instances
   - CPU-based scaling policies
   - CloudWatch monitoring

5. **IAM Roles and Policies**:
   - EC2 instance role with CloudWatch, Systems Manager permissions
   - Instance profile

6. **Resource Tagging**:
   - Environment, Project, Owner, CostCenter tags
   - Applied to all resources

7. **Logging and Monitoring**:
   - VPC Flow Logs
   - CloudTrail
   - CloudWatch alarms
   - CloudWatch Log Groups

8. **Template Features**:

I'll design the template with JSON configuration, incorporating flexible parameters to enhance adaptability. The template will include an Outputs section to provide key resource information and be specifically configured for the us-west-1 region. This approach ensures maximum configurability and ease of deployment across different environments.

### Answer

---

I'll create a comprehensive AWS CloudFormation template that meets all your requirements. This will be a large template, so I'll structure it clearly with all the necessary components.

```json
{
  "AWSTemplateFormatVersion": "2010-09-09",
  "Description": "Comprehensive and secure cloud environment setup with VPC, ALB, Auto Scaling, and monitoring",

  "Parameters": {
    "VPCCIDRBlock": {
      "Type": "String",
      "Default": "10.0.0.0/16",
      "Description": "CIDR block for the VPC"
    },
    "PublicSubnet1CIDRBlock": {
      "Type": "String",
      "Default": "10.0.1.0/24",
      "Description": "CIDR block for public subnet 1"
    },
    "PublicSubnet2CIDRBlock": {
      "Type": "String",
      "Default": "10.0.2.0/24",
      "Description": "CIDR block for public subnet 2"
    },
    "PrivateSubnet1CIDRBlock": {
      "Type": "String",
      "Default": "10.0.3.0/24",
      "Description": "CIDR block for private subnet 1"
    },
    "PrivateSubnet2CIDRBlock": {
      "Type": "String",
      "Default": "10.0.4.0/24",
      "Description": "CIDR block for private subnet 2"
    },
    "InstanceType": {
      "Type": "String",
      "Default": "t2.micro",
      "Description": "EC2 instance type"
    },
    "MinSize": {
      "Type": "Number",
      "Default": 2,
      "Description": "Minimum number of instances in Auto Scaling Group"
    },
    "MaxSize": {
      "Type": "Number",
      "Default": 5,
      "Description": "Maximum number of instances in Auto Scaling Group"
    },
    "Environment": {
      "Type": "String",
      "Default": "Production",
      "AllowedValues": ["Production", "Development", "Testing"],
      "Description": "Environment tag value"
    },
    "Project": {
      "Type": "String",
      "Default": "CloudEnvironmentSetup",
      "Description": "Project tag value"
    },
    "Owner": {
      "Type": "String",
      "Default": "DevOps",
      "Description": "Owner tag value"
    },
    "CostCenter": {
      "Type": "String",
      "Default": "Engineering",
      "Description": "Cost center tag value"
    }
  },

  "Mappings": {
    "AWSRegionToAMI": {
      "us-west-1": {
        "AMI": "ami-0d5eff06f840b45e9"
      }
    }
  },

  "Resources": {
    "VPC": {
      "Type": "AWS::EC2::VPC",
      "Properties": {
        "CidrBlock": { "Ref": "VPCCIDRBlock" },
        "EnableDnsHostnames": true,
        "EnableDnsSupport": true,
        "Tags": [
          { "Key": "Name", "Value": "CloudEnvironmentVPC" },
          { "Key": "Environment", "Value": { "Ref": "Environment" } },
          { "Key": "Project", "Value": { "Ref": "Project" } },
          { "Key": "Owner", "Value": { "Ref": "Owner" } },
          { "Key": "CostCenter", "Value": { "Ref": "CostCenter" } }
        ]
      }
    },

    "InternetGateway": {
      "Type": "AWS::EC2::InternetGateway",
      "Properties": {
        "Tags": [
          { "Key": "Name", "Value": "CloudEnvironmentIGW" },
          { "Key": "Environment", "Value": { "Ref": "Environment" } },
          { "Key": "Project", "Value": { "Ref": "Project" } },
          { "Key": "Owner", "Value": { "Ref": "Owner" } },
          { "Key": "CostCenter", "Value": { "Ref": "CostCenter" } }
        ]
      }
    },

    "AttachGateway": {
      "Type": "AWS::EC2::VPCGatewayAttachment",
      "Properties": {
        "VpcId": { "Ref": "VPC" },
        "InternetGatewayId": { "Ref": "InternetGateway" }
      }
    },

    "PublicSubnet1": {
      "Type": "AWS::EC2::Subnet",
      "Properties": {
        "VpcId": { "Ref": "VPC" },
        "CidrBlock": { "Ref": "PublicSubnet1CIDRBlock" },
        "AvailabilityZone": "us-west-1a",
        "MapPublicIpOnLaunch": true,
        "Tags": [
          { "Key": "Name", "Value": "PublicSubnet1" },
          { "Key": "Environment", "Value": { "Ref": "Environment" } },
          { "Key": "Project", "Value": { "Ref": "Project" } },
          { "Key": "Owner", "Value": { "Ref": "Owner" } },
          { "Key": "CostCenter", "Value": { "Ref": "CostCenter" } }
        ]
      }
    },

    "PublicSubnet2": {
      "Type": "AWS::EC2::Subnet",
      "Properties": {
        "VpcId": { "Ref": "VPC" },
        "CidrBlock": { "Ref": "PublicSubnet2CIDRBlock" },
        "AvailabilityZone": "us-west-1b",
        "MapPublicIpOnLaunch": true,
        "Tags": [
          { "Key": "Name", "Value": "PublicSubnet2" },
          { "Key": "Environment", "Value": { "Ref": "Environment" } },
          { "Key": "Project", "Value": { "Ref": "Project" } },
          { "Key": "Owner", "Value": { "Ref": "Owner" } },
          { "Key": "CostCenter", "Value": { "Ref": "CostCenter" } }
        ]
      }
    },

    "PrivateSubnet1": {
      "Type": "AWS::EC2::Subnet",
      "Properties": {
        "VpcId": { "Ref": "VPC" },
        "CidrBlock": { "Ref": "PrivateSubnet1CIDRBlock" },
        "AvailabilityZone": "us-west-1a",
        "Tags": [
          { "Key": "Name", "Value": "PrivateSubnet1" },
          { "Key": "Environment", "Value": { "Ref": "Environment" } },
          { "Key": "Project", "Value": { "Ref": "Project" } },
          { "Key": "Owner", "Value": { "Ref": "Owner" } },
          { "Key": "CostCenter", "Value": { "Ref": "CostCenter" } }
        ]
      }
    },

    "PrivateSubnet2": {
      "Type": "AWS::EC2::Subnet",
      "Properties": {
        "VpcId": { "Ref": "VPC" },
        "CidrBlock": { "Ref": "PrivateSubnet2CIDRBlock" },
        "AvailabilityZone": "us-west-1b",
        "Tags": [
          { "Key": "Name", "Value": "PrivateSubnet2" },
          { "Key": "Environment", "Value": { "Ref": "Environment" } },
          { "Key": "Project", "Value": { "Ref": "Project" } },
          { "Key": "Owner", "Value": { "Ref": "Owner" } },
          { "Key": "CostCenter", "Value": { "Ref": "CostCenter" } }
        ]
      }
    },

    "EIP1": {
      "Type": "AWS::EC2::EIP",
      "DependsOn": "AttachGateway",
      "Properties": {
        "Domain": "vpc",
        "Tags": [
          { "Key": "Name", "Value": "NATGW1-EIP" },
          { "Key": "Environment", "Value": { "Ref": "Environment" } },
          { "Key": "Project", "Value": { "Ref": "Project" } },
          { "Key": "Owner", "Value": { "Ref": "Owner" } },
          { "Key": "CostCenter", "Value": { "Ref": "CostCenter" } }
        ]
      }
    },

    "EIP2": {
      "Type": "AWS::EC2::EIP",
      "DependsOn": "AttachGateway",
      "Properties": {
        "Domain": "vpc",
        "Tags": [
          { "Key": "Name", "Value": "NATGW2-EIP" },
          { "Key": "Environment", "Value": { "Ref": "Environment" } },
          { "Key": "Project", "Value": { "Ref": "Project" } },
          { "Key": "Owner", "Value": { "Ref": "Owner" } },
          { "Key": "CostCenter", "Value": { "Ref": "CostCenter" } }
        ]
      }
    },

    "NATGateway1": {
      "Type": "AWS::EC2::NatGateway",
      "Properties": {
        "AllocationId": { "Fn::GetAtt": ["EIP1", "AllocationId"] },
        "SubnetId": { "Ref": "PublicSubnet1" },
        "Tags": [
          { "Key": "Name", "Value": "NATGateway1" },
          { "Key": "Environment", "Value": { "Ref": "Environment" } },
          { "Key": "Project", "Value": { "Ref": "Project" } },
          { "Key": "Owner", "Value": { "Ref": "Owner" } },
          { "Key": "CostCenter", "Value": { "Ref": "CostCenter" } }
        ]
      }
    },

    "NATGateway2": {
      "Type": "AWS::EC2::NatGateway",
      "Properties": {
        "AllocationId": { "Fn::GetAtt": ["EIP2", "AllocationId"] },
        "SubnetId": { "Ref": "PublicSubnet2" },
        "Tags": [
          { "Key": "Name", "Value": "NATGateway2" },
          { "Key": "Environment", "Value": { "Ref": "Environment" } },
          { "Key": "Project", "Value": { "Ref": "Project" } },
          { "Key": "Owner", "Value": { "Ref": "Owner" } },
          { "Key": "CostCenter", "Value": { "Ref": "CostCenter" } }
        ]
      }
    },

    "PublicRouteTable": {
      "Type": "AWS::EC2::RouteTable",
      "Properties": {
        "VpcId": { "Ref": "VPC" },
        "Tags": [
          { "Key": "Name", "Value": "PublicRouteTable" },
          { "Key": "Environment", "Value": { "Ref": "Environment" } },
          { "Key": "Project", "Value": { "Ref": "Project" } },
          { "Key": "Owner", "Value": { "Ref": "Owner" } },
          { "Key": "CostCenter", "Value": { "Ref": "CostCenter" } }
        ]
      }
    },

    "PrivateRouteTable1": {
      "Type": "AWS::EC2::RouteTable",
      "Properties": {
        "VpcId": { "Ref": "VPC" },
        "Tags": [
          { "Key": "Name", "Value": "PrivateRouteTable1" },
          { "Key": "Environment", "Value": { "Ref": "Environment" } },
          { "Key": "Project", "Value": { "Ref": "Project" } },
          { "Key": "Owner", "Value": { "Ref": "Owner" } },
          { "Key": "CostCenter", "Value": { "Ref": "CostCenter" } }
        ]
      }
    },

    "PrivateRouteTable2": {
      "Type": "AWS::EC2::RouteTable",
      "Properties": {
        "VpcId": { "Ref": "VPC" },
        "Tags": [
          { "Key": "Name", "Value": "PrivateRouteTable2" },
          { "Key": "Environment", "Value": { "Ref": "Environment" } },
          { "Key": "Project", "Value": { "Ref": "Project" } },
          { "Key": "Owner", "Value": { "Ref": "Owner" } },
          { "Key": "CostCenter", "Value": { "Ref": "CostCenter" } }
        ]
      }
    },

    "PublicRoute": {
      "Type": "AWS::EC2::Route",
      "DependsOn": "AttachGateway",
      "Properties": {
        "RouteTableId": { "Ref": "PublicRouteTable" },
        "DestinationCidrBlock": "0.0.0.0/0",
        "GatewayId": { "Ref": "InternetGateway" }
      }
    },

    "PrivateRoute1": {
      "Type": "AWS::EC2::Route",
      "Properties": {
        "RouteTableId": { "Ref": "PrivateRouteTable1" },
        "DestinationCidrBlock": "0.0.0.0/0",
        "NatGatewayId": { "Ref": "NATGateway1" }
      }
    },

    "PrivateRoute2": {
      "Type": "AWS::EC2::Route",
      "Properties": {
        "RouteTableId": { "Ref": "PrivateRouteTable2" },
        "DestinationCidrBlock": "0.0.0.0/0",
        "NatGatewayId": { "Ref": "NATGateway2" }
      }
    },

    "PublicSubnetRouteTableAssociation1": {
      "Type": "AWS::EC2::SubnetRouteTableAssociation",
      "Properties": {
        "SubnetId": { "Ref": "PublicSubnet1" },
        "RouteTableId": { "Ref": "PublicRouteTable" }
      }
    },

    "PublicSubnetRouteTableAssociation2": {
      "Type": "AWS::EC2::SubnetRouteTableAssociation",
      "Properties": {
        "SubnetId": { "Ref": "PublicSubnet2" },
        "RouteTableId": { "Ref": "PublicRouteTable" }
      }
    },

    "PrivateSubnetRouteTableAssociation1": {
      "Type": "AWS::EC2::SubnetRouteTableAssociation",
      "Properties": {
        "SubnetId": { "Ref": "PrivateSubnet1" },
        "RouteTableId": { "Ref": "PrivateRouteTable1" }
      }
    },

    "PrivateSubnetRouteTableAssociation2": {
      "Type": "AWS::EC2::SubnetRouteTableAssociation",
      "Properties": {
        "SubnetId": { "Ref": "PrivateSubnet2" },
        "RouteTableId": { "Ref": "PrivateRouteTable2" }
      }
    },

    "PublicNetworkAcl": {
      "Type": "AWS::EC2::NetworkAcl",
      "Properties": {
        "VpcId": { "Ref": "VPC" },
        "Tags": [
          { "Key": "Name", "Value": "PublicNetworkAcl" },
          { "Key": "Environment", "Value": { "Ref": "Environment" } },
          { "Key": "Project", "Value": { "Ref": "Project" } },
          { "Key": "Owner", "Value": { "Ref": "Owner" } },
          { "Key": "CostCenter", "Value": { "Ref": "CostCenter" } }
        ]
      }
    },

    "PublicInboundNetworkAclEntry": {
      "Type": "AWS::EC2::NetworkAclEntry",
      "Properties": {
        "NetworkAclId": { "Ref": "PublicNetworkAcl" },
        "RuleNumber": 100,
        "Protocol": -1,
        "RuleAction": "allow",
        "CidrBlock": "0.0.0.0/0"
      }
    },

    "PublicOutboundNetworkAclEntry": {
      "Type": "AWS::EC2::NetworkAclEntry",
      "Properties": {
        "NetworkAclId": { "Ref": "PublicNetworkAcl" },
        "RuleNumber": 100,
        "Protocol": -1,
        "Egress": true,
        "RuleAction": "allow",
        "CidrBlock": "0.0.0.0/0"
      }
    },

    "PrivateNetworkAcl": {
      "Type": "AWS::EC2::NetworkAcl",
      "Properties": {
        "VpcId": { "Ref": "VPC" },
        "Tags": [
          { "Key": "Name", "Value": "PrivateNetworkAcl" },
          { "Key": "Environment", "Value": { "Ref": "Environment" } },
          { "Key": "Project", "Value": { "Ref": "Project" } },
          { "Key": "Owner", "Value": { "Ref": "Owner" } },
          { "Key": "CostCenter", "Value": { "Ref": "CostCenter" } }
        ]
      }
    },

    "PrivateInboundNetworkAclEntry": {
      "Type": "AWS::EC2::NetworkAclEntry",
      "Properties": {
        "NetworkAclId": { "Ref": "PrivateNetworkAcl" },
        "RuleNumber": 100,
        "Protocol": -1,
        "RuleAction": "allow",
        "CidrBlock": { "Ref": "VPCCIDRBlock" }
      }
    },

    "PrivateOutboundNetworkAclEntry": {
      "Type": "AWS::EC2::NetworkAclEntry",
      "Properties": {
        "NetworkAclId": { "Ref": "PrivateNetworkAcl" },
        "RuleNumber": 100,
        "Protocol": -1,
        "Egress": true,
        "RuleAction": "allow",
        "CidrBlock": "0.0.0.0/0"
      }
    },

    "PublicSubnetNetworkAclAssociation1": {
      "Type": "AWS::EC2::SubnetNetworkAclAssociation",
      "Properties": {
        "SubnetId": { "Ref": "PublicSubnet1" },
        "NetworkAclId": { "Ref": "PublicNetworkAcl" }
      }
    },

    "PublicSubnetNetworkAclAssociation2": {
      "Type": "AWS::EC2::SubnetNetworkAclAssociation",
      "Properties": {
        "SubnetId": { "Ref": "PublicSubnet2" },
        "NetworkAclId": { "Ref": "PublicNetworkAcl" }
      }
    },

    "PrivateSubnetNetworkAclAssociation1": {
      "Type": "AWS::EC2::SubnetNetworkAclAssociation",
      "Properties": {
        "SubnetId": { "Ref": "PrivateSubnet1" },
        "NetworkAclId": { "Ref": "PrivateNetworkAcl" }
      }
    },

    "PrivateSubnetNetworkAclAssociation2": {
      "Type": "AWS::EC2::SubnetNetworkAclAssociation",
      "Properties": {
        "SubnetId": { "Ref": "PrivateSubnet2" },
        "NetworkAclId": { "Ref": "PrivateNetworkAcl" }
      }
    },

    "ALBSecurityGroup": {
      "Type": "AWS::EC2::SecurityGroup",
      "Properties": {
        "GroupDescription": "Security group for Application Load Balancer",
        "VpcId": { "Ref": "VPC" },
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
          { "Key": "Name", "Value": "ALBSecurityGroup" },
          { "Key": "Environment", "Value": { "Ref": "Environment" } },
          { "Key": "Project", "Value": { "Ref": "Project" } },
          { "Key": "Owner", "Value": { "Ref": "Owner" } },
          { "Key": "CostCenter", "Value": { "Ref": "CostCenter" } }
        ]
      }
    },

    "EC2SecurityGroup": {
      "Type": "AWS::EC2::SecurityGroup",
      "Properties": {
        "GroupDescription": "Security group for EC2 instances",
        "VpcId": { "Ref": "VPC" },
        "SecurityGroupIngress": [
          {
            "IpProtocol": "tcp",
            "FromPort": 80,
            "ToPort": 80,
            "SourceSecurityGroupId": { "Ref": "ALBSecurityGroup" }
          },
          {
            "IpProtocol": "tcp",
            "FromPort": 443,
            "ToPort": 443,
            "SourceSecurityGroupId": { "Ref": "ALBSecurityGroup" }
          }
        ],
        "Tags": [
          { "Key": "Name", "Value": "EC2SecurityGroup" },
          { "Key": "Environment", "Value": { "Ref": "Environment" } },
          { "Key": "Project", "Value": { "Ref": "Project" } },
          { "Key": "Owner", "Value": { "Ref": "Owner" } },
          { "Key": "CostCenter", "Value": { "Ref": "CostCenter" } }
        ]
      }
    },

    "EC2Role": {
      "Type": "AWS::IAM::Role",
      "Properties": {
        "AssumeRolePolicyDocument": {
          "Version": "2012-10-17",
          "Statement": [
            {
              "Effect": "Allow",
              "Principal": {
                "Service": ["ec2.amazonaws.com"]
              },
              "Action": ["sts:AssumeRole"]
            }
          ]
        },
        "ManagedPolicyArns": [
          "arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy",
          "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
        ],
        "Tags": [
          { "Key": "Name", "Value": "EC2Role" },
          { "Key": "Environment", "Value": { "Ref": "Environment" } },
          { "Key": "Project", "Value": { "Ref": "Project" } },
          { "Key": "Owner", "Value": { "Ref": "Owner" } },
          { "Key": "CostCenter", "Value": { "Ref": "CostCenter" } }
        ]
      }
    },

    "EC2InstanceProfile": {
      "Type": "AWS::IAM::InstanceProfile",
      "Properties": {
        "Roles": [{ "Ref": "EC2Role" }]
      }
    },

    "ApplicationLoadBalancer": {
      "Type": "AWS::ElasticLoadBalancingV2::LoadBalancer",
      "Properties": {
        "Name": "CloudEnvironmentALB",
        "Type": "application",
        "Scheme": "internet-facing",
        "SecurityGroups": [{ "Ref": "ALBSecurityGroup" }],
        "Subnets": [{ "Ref": "PublicSubnet1" }, { "Ref": "PublicSubnet2" }],
        "Tags": [
          { "Key": "Name", "Value": "CloudEnvironmentALB" },
          { "Key": "Environment", "Value": { "Ref": "Environment" } },
          { "Key": "Project", "Value": { "Ref": "Project" } },
          { "Key": "Owner", "Value": { "Ref": "Owner" } },
          { "Key": "CostCenter", "Value": { "Ref": "CostCenter" } }
        ]
      }
    },

    "TargetGroup": {
      "Type": "AWS::ElasticLoadBalancingV2::TargetGroup",
      "Properties": {
        "Name": "CloudEnvironmentTG",
        "Port": 80,
        "Protocol": "HTTP",
        "VpcId": { "Ref": "VPC" },
        "HealthCheckEnabled": true,
        "HealthCheckPath": "/",
        "HealthCheckProtocol": "HTTP",
        "HealthCheckIntervalSeconds": 30,
        "HealthCheckTimeoutSeconds": 10,
        "HealthyThresholdCount": 3,
        "UnhealthyThresholdCount": 3,
        "Tags": [
          { "Key": "Name", "Value": "CloudEnvironmentTG" },
          { "Key": "Environment", "Value": { "Ref": "Environment" } },
          { "Key": "Project", "Value": { "Ref": "Project" } },
          { "Key": "Owner", "Value": { "Ref": "Owner" } },
          { "Key": "CostCenter", "Value": { "Ref": "CostCenter" } }
        ]
      }
    },

    "HTTPListener": {
      "Type": "AWS::ElasticLoadBalancingV2::Listener",
      "Properties": {
        "DefaultActions": [
          {
            "Type": "forward",
            "TargetGroupArn": { "Ref": "TargetGroup" }
          }
        ],
        "LoadBalancerArn": { "Ref": "ApplicationLoadBalancer" },
        "Port": 80,
        "Protocol": "HTTP"
      }
    },

    "LaunchTemplate": {
      "Type": "AWS::EC2::LaunchTemplate",
      "Properties": {
        "LaunchTemplateName": "CloudEnvironmentLT",
        "LaunchTemplateData": {
          "ImageId": {
            "Fn::FindInMap": ["AWSRegionToAMI", "us-west-1", "AMI"]
          },
          "InstanceType": { "Ref": "InstanceType" },
          "IamInstanceProfile": {
            "Arn": { "Fn::GetAtt": ["EC2InstanceProfile", "Arn"] }
          },
          "SecurityGroupIds": [{ "Ref": "EC2SecurityGroup" }],
          "Monitoring": {
            "Enabled": true
          },
          "TagSpecifications": [
            {
              "ResourceType": "instance",
              "Tags": [
                { "Key": "Name", "Value": "CloudEnvironmentInstance" },
                { "Key": "Environment", "Value": { "Ref": "Environment" } },
                { "Key": "Project", "Value": { "Ref": "Project" } },
                { "Key": "Owner", "Value": { "Ref": "Owner" } },
                { "Key": "CostCenter", "Value": { "Ref": "CostCenter" } }
              ]
            }
          ],
          "UserData": {
            "Fn::Base64": {
              "Fn::Join": [
                "",
                [
                  "#!/bin/bash\n",
                  "yum update -y\n",
                  "yum install -y amazon-cloudwatch-agent\n",
                  "yum install -y httpd\n",
                  "systemctl start httpd\n",
                  "systemctl enable httpd\n",
                  "echo '<h1>Hello from CloudEnvironment</h1>' > /var/www/html/index.html\n"
                ]
              ]
            }
          }
        }
      }
    },

    "AutoScalingGroup": {
      "Type": "AWS::AutoScaling::AutoScalingGroup",
      "Properties": {
        "AutoScalingGroupName": "CloudEnvironmentASG",
        "LaunchTemplate": {
          "LaunchTemplateId": { "Ref": "LaunchTemplate" },
          "Version": "$Latest"
        },
        "MinSize": { "Ref": "MinSize" },
        "MaxSize": { "Ref": "MaxSize" },
        "DesiredCapacity": { "Ref": "MinSize" },
        "VPCZoneIdentifier": [
          { "Ref": "PrivateSubnet1" },
          { "Ref": "PrivateSubnet2" }
        ],
        "TargetGroupARNs": [{ "Ref": "TargetGroup" }],
        "HealthCheckType": "ELB",
        "HealthCheckGracePeriod": 300,
        "Tags": [
          {
            "Key": "Name",
            "Value": "CloudEnvironmentASG",
            "PropagateAtLaunch": false
          },
          {
            "Key": "Environment",
            "Value": { "Ref": "Environment" },
            "PropagateAtLaunch": true
          },
          {
            "Key": "Project",
            "Value": { "Ref": "Project" },
            "PropagateAtLaunch": true
          },
          {
            "Key": "Owner",
            "Value": { "Ref": "Owner" },
            "PropagateAtLaunch": true
          },
          {
            "Key": "CostCenter",
            "Value": { "Ref": "CostCenter" },
            "PropagateAtLaunch": true
          }
        ]
      }
    },

    "ScaleUpPolicy": {
      "Type": "AWS::AutoScaling::ScalingPolicy",
      "Properties": {
        "AdjustmentType": "ChangeInCapacity",
        "AutoScalingGroupName": { "Ref": "AutoScalingGroup" },
        "Cooldown": 300,
        "ScalingAdjustment": 1
      }
    },

    "ScaleDownPolicy": {
      "Type": "AWS::AutoScaling::ScalingPolicy",
      "Properties": {
        "AdjustmentType": "ChangeInCapacity",
        "AutoScalingGroupName": { "Ref": "AutoScalingGroup" },
        "Cooldown": 300,
        "ScalingAdjustment": -1
      }
    },

    "CPUAlarmHigh": {
      "Type": "AWS::CloudWatch::Alarm",
      "Properties": {
        "AlarmDescription": "Scale-up if CPU > 80% for 5 minutes",
        "MetricName": "CPUUtilization",
        "Namespace": "AWS/EC2",
        "Statistic": "Average",
        "Period": 300,
        "EvaluationPeriods": 1,
        "Threshold": 80,
        "AlarmActions": [{ "Ref": "ScaleUpPolicy" }],
        "Dimensions": [
          {
            "Name": "AutoScalingGroupName",
            "Value": { "Ref": "AutoScalingGroup" }
          }
        ],
        "ComparisonOperator": "GreaterThanThreshold"
      }
    },

    "CPUAlarmLow": {
      "Type": "AWS::CloudWatch::Alarm",
      "Properties": {
        "AlarmDescription": "Scale-down if CPU < 20% for 5 minutes",
        "MetricName": "CPUUtilization",
        "Namespace": "AWS/EC2",
        "Statistic": "Average",
        "Period": 300,
        "EvaluationPeriods": 1,
        "Threshold": 20,
        "AlarmActions": [{ "Ref": "ScaleDownPolicy" }],
        "Dimensions": [
          {
            "Name": "AutoScalingGroupName",
            "Value": { "Ref": "AutoScalingGroup" }
          }
        ],
        "ComparisonOperator": "LessThanThreshold"
      }
    },

    "VPCFlowLogRole": {
      "Type": "AWS::IAM::Role",
      "Properties": {
        "AssumeRolePolicyDocument": {
          "Version": "2012-10-17",
          "Statement": [
            {
              "Effect": "Allow",
              "Principal": {
                "Service": "vpc-flow-logs.amazonaws.com"
              },
              "Action": "sts:AssumeRole"
            }
          ]
        },
        "Policies": [
          {
            "PolicyName": "CloudWatchLogPolicy",
            "PolicyDocument": {
              "Version": "2012-10-17",
              "Statement": [
                {
                  "Effect": "Allow",
                  "Action": [
                    "logs:CreateLogGroup",
                    "logs:CreateLogStream",
                    "logs:PutLogEvents",
                    "logs:DescribeLogGroups",
                    "logs:DescribeLogStreams"
                  ],
                  "Resource": "*"
                }
              ]
            }
          }
        ]
      }
    },

    "VPCFlowLogGroup": {
      "Type": "AWS::Logs::LogGroup",
      "Properties": {
        "LogGroupName": "/aws/vpc/flowlogs",
        "RetentionInDays": 7,
        "Tags": [
          { "Key": "Name", "Value": "VPCFlowLogGroup" },
          { "Key": "Environment", "Value": { "Ref": "Environment" } },
          { "Key": "Project", "Value": { "Ref": "Project" } },
          { "Key": "Owner", "Value": { "Ref": "Owner" } },
          { "Key": "CostCenter", "Value": { "Ref": "CostCenter" } }
        ]
      }
    },

    "VPCFlowLog": {
      "Type": "AWS::EC2::FlowLog",
      "Properties": {
        "DeliverLogsPermissionArn": { "Fn::GetAtt": ["VPCFlowLogRole", "Arn"] },
        "LogDestinationType": "cloud-watch-logs",
        "LogGroupName": { "Ref": "VPCFlowLogGroup" },
        "ResourceId": { "Ref": "VPC" },
        "ResourceType": "VPC",
        "TrafficType": "ALL",
        "Tags": [
          { "Key": "Name", "Value": "VPCFlowLog" },
          { "Key": "Environment", "Value": { "Ref": "Environment" } },
          { "Key": "Project", "Value": { "Ref": "Project" } },
          { "Key": "Owner", "Value": { "Ref": "Owner" } },
          { "Key": "CostCenter", "Value": { "Ref": "CostCenter" } }
        ]
      }
    },

    "CloudTrailS3Bucket": {
      "Type": "AWS::S3::Bucket",
      "Properties": {
        "BucketName": {
          "Fn::Sub": "cloudtrail-logs-${AWS::AccountId}-${AWS::Region}"
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
          { "Key": "Name", "Value": "CloudTrailBucket" },
          { "Key": "Environment", "Value": { "Ref": "Environment" } },
          { "Key": "Project", "Value": { "Ref": "Project" } },
          { "Key": "Owner", "Value": { "Ref": "Owner" } },
          { "Key": "CostCenter", "Value": { "Ref": "CostCenter" } }
        ]
      }
    },

    "CloudTrailBucketPolicy": {
      "Type": "AWS::S3::BucketPolicy",
      "Properties": {
        "Bucket": { "Ref": "CloudTrailS3Bucket" },
        "PolicyDocument": {
          "Version": "2012-10-17",
          "Statement": [
            {
              "Sid": "AWSCloudTrailAclCheck",
              "Effect": "Allow",
              "Principal": {
                "Service": "cloudtrail.amazonaws.com"
              },
              "Action": "s3:GetBucketAcl",
              "Resource": { "Fn::GetAtt": ["CloudTrailS3Bucket", "Arn"] }
            },
            {
              "Sid": "AWSCloudTrailWrite",
              "Effect": "Allow",
              "Principal": {
                "Service": "cloudtrail.amazonaws.com"
              },
              "Action": "s3:PutObject",
              "Resource": { "Fn::Sub": "${CloudTrailS3Bucket.Arn}/*" },
              "Condition": {
                "StringEquals": {
                  "s3:x-amz-acl": "bucket-owner-full-control"
                }
              }
            }
          ]
        }
      }
    },

    "CloudTrail": {
      "Type": "AWS::CloudTrail::Trail",
      "DependsOn": "CloudTrailBucketPolicy",
      "Properties": {
        "TrailName": "CloudEnvironmentTrail",
        "S3BucketName": { "Ref": "CloudTrailS3Bucket" },
        "IsLogging": true,
        "IsMultiRegionTrail": false,
        "EventSelectors": [
          {
            "ReadWriteType": "All",
            "IncludeManagementEvents": true
          }
        ],
        "Tags": [
          { "Key": "Name", "Value": "CloudEnvironmentTrail" },
          { "Key": "Environment", "Value": { "Ref": "Environment" } },
          { "Key": "Project", "Value": { "Ref": "Project" } },
          { "Key": "Owner", "Value": { "Ref": "Owner" } },
          { "Key": "CostCenter", "Value": { "Ref": "CostCenter" } }
        ]
      }
    },

    "UnhealthyHostAlarm": {
      "Type": "AWS::CloudWatch::Alarm",
      "Properties": {
        "AlarmDescription": "Alert when unhealthy hosts detected in target group",
        "MetricName": "UnHealthyHostCount",
        "Namespace": "AWS/ApplicationELB",
        "Statistic": "Average",
        "Period": 60,
        "EvaluationPeriods": 2,
        "Threshold": 0,
        "ComparisonOperator": "GreaterThanThreshold",
        "Dimensions": [
          {
            "Name": "TargetGroup",
            "Value": { "Fn::GetAtt": ["TargetGroup", "TargetGroupFullName"] }
          },
          {
            "Name": "LoadBalancer",
            "Value": {
              "Fn::GetAtt": ["ApplicationLoadBalancer", "LoadBalancerFullName"]
            }
          }
        ]
      }
    },

    "NATGatewayErrorAlarm": {
      "Type": "AWS::CloudWatch::Alarm",
      "Properties": {
        "AlarmDescription": "Alert when NAT Gateway has packet drop errors",
        "MetricName": "PacketsDropCount",
        "Namespace": "AWS/EC2",
        "Statistic": "Sum",
        "Period": 300,
        "EvaluationPeriods": 1,
        "Threshold": 100,
        "ComparisonOperator": "GreaterThanThreshold",
        "Dimensions": [
          {
            "Name": "NatGatewayId",
            "Value": { "Ref": "NATGateway1" }
          }
        ]
      }
    }
  },

  "Outputs": {
    "VPCId": {
      "Description": "VPC ID",
      "Value": { "Ref": "VPC" },
      "Export": {
        "Name": { "Fn::Sub": "${AWS::StackName}-VPC-ID" }
      }
    },
    "PublicSubnet1Id": {
      "Description": "Public Subnet 1 ID",
      "Value": { "Ref": "PublicSubnet1" },
      "Export": {
        "Name": { "Fn::Sub": "${AWS::StackName}-PublicSubnet1-ID" }
      }
    },
    "PublicSubnet2Id": {
      "Description": "Public Subnet 2 ID",
      "Value": { "Ref": "PublicSubnet2" },
      "Export": {
        "Name": { "Fn::Sub": "${AWS::StackName}-PublicSubnet2-ID" }
      }
    },
    "PrivateSubnet1Id": {
      "Description": "Private Subnet 1 ID",
      "Value": { "Ref": "PrivateSubnet1" },
      "Export": {
        "Name": { "Fn::Sub": "${AWS::StackName}-PrivateSubnet1-ID" }
      }
    },
    "PrivateSubnet2Id": {
      "Description": "Private Subnet 2 ID",
      "Value": { "Ref": "PrivateSubnet2" },
      "Export": {
        "Name": { "Fn::Sub": "${AWS::StackName}-PrivateSubnet2-ID" }
      }
    },
    "InternetGatewayId": {
      "Description": "Internet Gateway ID",
      "Value": { "Ref": "InternetGateway" },
      "Export": {
        "Name": { "Fn::Sub": "${AWS::StackName}-IGW-ID" }
      }
    },
    "NATGateway1Id": {
      "Description": "NAT Gateway 1 ID",
      "Value": { "Ref": "NATGateway1" },
      "Export": {
        "Name": { "Fn::Sub": "${AWS::StackName}-NATGateway1-ID" }
      }
    },
    "NATGateway2Id": {
      "Description": "NAT Gateway 2 ID",
      "Value": { "Ref": "NATGateway2" },
      "Export": {
        "Name": { "Fn::Sub": "${AWS::StackName}-NATGateway2-ID" }
      }
    },
    "LoadBalancerDNS": {
      "Description": "Application Load Balancer DNS Name",
      "Value": { "Fn::GetAtt": ["ApplicationLoadBalancer", "DNSName"] },
      "Export": {
        "Name": { "Fn::Sub": "${AWS::StackName}-ALB-DNS" }
      }
    },
    "AutoScalingGroupName": {
      "Description": "Auto Scaling Group Name",
      "Value": { "Ref": "AutoScalingGroup" },
      "Export": {
        "Name": { "Fn::Sub": "${AWS::StackName}-ASG-Name" }
      }
    },
    "CloudTrailName": {
      "Description": "CloudTrail Trail Name",
      "Value": { "Ref": "CloudTrail" },
      "Export": {
        "Name": { "Fn::Sub": "${AWS::StackName}-CloudTrail-Name" }
      }
    }
  }
}
```

## Key Features of this CloudFormation Template

### 1. **Comprehensive Networking Architecture**

- Creates a VPC with public and private subnets across two availability zones
- Implements dual NAT Gateways for high availability
- Configures proper routing tables for public and private subnet traffic

### 2. **Security Best Practices**

- Network ACLs control traffic at the subnet level
- Security groups implement least privilege access
- Private subnets isolate EC2 instances from direct internet access
- All traffic flows through the Application Load Balancer

### 3. **Scalability and High Availability**

- Auto Scaling Group manages EC2 instances across multiple AZs
- CPU-based scaling policies automatically adjust capacity
- Application Load Balancer distributes traffic evenly

### 4. **Monitoring and Logging**

- VPC Flow Logs capture network traffic information
- CloudTrail logs all API calls
- CloudWatch alarms monitor critical metrics
- Detailed monitoring enabled for all EC2 instances

### 5. **Resource Organization**

- Consistent tagging strategy across all resources
- Parameterized values for easy customization
- Organized outputs for easy reference

### 6. **IAM Security**

- EC2 instances use IAM roles instead of access keys
- Minimal permissions granted following least privilege principle
- Systems Manager access enabled for secure instance management

## Deployment Instructions

1. **Save the template** as `cloud-environment.json`

2. **Deploy via AWS CLI**:

```bash
aws cloudformation create-stack \
  --stack-name cloud-environment \
  --template-body file://cloud-environment.json \
  --parameters \
    ParameterKey=Environment,ParameterValue=Production \
    ParameterKey=Owner,ParameterValue=YourName \
    ParameterKey=CostCenter,ParameterValue=Engineering \
  --capabilities CAPABILITY_IAM \
  --region us-west-1
```

3. **Monitor deployment**:

```bash
aws cloudformation describe-stacks \
  --stack-name cloud-environment \
  --region us-west-1
```

## Post-Deployment Considerations

1. **SSL/TLS Configuration**: Add an HTTPS listener to the ALB with an SSL certificate from AWS Certificate Manager
2. **Domain Configuration**: Point your domain to the ALB DNS name
3. **Application Deployment**: Deploy your application to the EC2 instances
4. **Backup Strategy**: Implement regular snapshots of EBS volumes
5. **Cost Optimization**: Review and adjust instance types and scaling policies based on actual usage

This template provides a solid foundation for a production-ready AWS environment with security, scalability, and monitoring built-in from the start.
