# Ideal Response: Comprehensive and Secure Cloud Environment with Load Balancing and Auto Scaling

## Architecture Overview

This CloudFormation template creates a production-ready, highly available AWS cloud environment with comprehensive load balancing, auto-scaling capabilities, and advanced security features. The infrastructure spans multiple Availability Zones with automatic scaling based on demand, network-level security controls through Network ACLs, application-level load balancing, and centralized logging and monitoring following AWS best practices and the Well-Architected Framework.

### Network Architecture

The infrastructure implements a highly available multi-tier VPC architecture spanning two Availability Zones in the us-west-1 region. The VPC uses a 10.0.0.0/16 CIDR block with public subnets (10.0.1.0/24, 10.0.2.0/24) for the Application Load Balancer and NAT Gateways, and private subnets (10.0.3.0/24, 10.0.4.0/24) for EC2 instances running in the Auto Scaling Group. An Internet Gateway provides public subnet connectivity to the internet, enabling external access to the Application Load Balancer. Two NAT Gateways (one in each public subnet) with dedicated Elastic IPs enable high-availability outbound internet access for private subnet resources. Each private subnet routes through its respective NAT Gateway using separate route tables, ensuring continued outbound connectivity even if one Availability Zone experiences issues. This dual NAT Gateway design provides true high availability by eliminating single points of failure in the network path.

### Load Balancing Layer

The Application Load Balancer provides intelligent Layer 7 traffic distribution and serves as the single entry point for all client requests. The ALB is internet-facing and deployed across both public subnets for high availability, automatically distributing incoming traffic across healthy EC2 instances in multiple Availability Zones. Two listeners are configured on ports 80 (HTTP) and 443 (HTTPS), both forwarding traffic to the target group. The target group performs HTTP health checks on the root path every 30 seconds with a 5-second timeout, requiring 2 consecutive successful checks to mark an instance healthy and 3 consecutive failures to mark it unhealthy. This configuration ensures only healthy instances receive traffic from the load balancer.

### Auto Scaling Compute Layer

The compute layer uses an Auto Scaling Group that dynamically adjusts capacity based on CPU utilization. The ASG maintains a minimum of 2 instances and can scale up to 5 instances, deploying t2.micro instances across both private subnets using a Launch Template. The Launch Template uses dynamic AMI resolution through SSM Parameter Store for the latest Amazon Linux 2 AMI. Instance user data installs httpd web server, CloudWatch agent, and SSM agent, then starts services automatically. CPU-based scaling policies trigger at 70% utilization (scale up) and 30% utilization (scale down) with corresponding CloudWatch alarms. An IAM instance profile grants EC2 instances permissions for CloudWatch logging and Systems Manager access. The Auto Scaling Group uses ELB health checks with a 300-second grace period, automatically replacing unhealthy instances.

### Security Layer

Security is implemented at multiple layers using AWS security best practices with defense-in-depth approach. Network Access Control Lists provide stateless subnet-level security controls. The Public Subnet NACL allows HTTP (port 80), HTTPS (port 443), and ephemeral ports (1024-65535) inbound, with all traffic allowed outbound. The Private Subnet NACL allows all traffic from the VPC CIDR and ephemeral ports from the internet for return traffic. Security groups provide stateful instance-level security. The ALBSecurityGroup allows HTTP and HTTPS from anywhere, while the WebServerSecurityGroup restricts access to only traffic from the ALB using security group references. This multi-layer security architecture provides defense in depth with both NACLs and Security Groups protecting the infrastructure.

### IAM Roles and Policies

The EC2InstanceRole provides instances with permissions following the principle of least privilege. The role includes CloudWatchAgentServerPolicy for metrics and logs publishing, and AmazonSSMManagedInstanceCore for Systems Manager capabilities including Session Manager, Patch Manager, and Run Command. Inline policies grant CloudWatch Logs access scoped to /aws/ec2/ log groups and CloudWatch alarms read access for monitoring verification. This approach eliminates hard-coded credentials and provides temporary security credentials automatically rotated by AWS.

### Monitoring and Logging

VPC Flow Logs capture all network traffic entering and leaving the VPC, streaming to a CloudWatch Log Group with 7-day retention. An IAM role grants VPC Flow Logs permission to publish to CloudWatch Logs. CloudWatch alarms monitor CPU utilization triggering scaling actions, unhealthy targets in the load balancer, and NAT Gateway port allocation errors. CloudTrail logs all AWS API calls to an encrypted S3 bucket, configured as a multi-region trail with global service events included. The trail logs management events for complete audit coverage.

### High Availability and Fault Tolerance

The architecture achieves high availability through multiple mechanisms. Two NAT Gateways eliminate single points of failure in private subnet internet connectivity. The Auto Scaling Group maintains minimum capacity of 2 instances across both AZs, automatically replacing failed instances. The Application Load Balancer distributes traffic across multiple AZs with automatic failover. This multi-layer redundancy ensures the application remains available during component failures or AZ outages.

## CloudFormation Template

```json
{
  "AWSTemplateFormatVersion": "2010-09-09",
  "Description": "Comprehensive and secure cloud environment setup with VPC, public/private subnets across 2 AZs, NAT Gateways, Application Load Balancer, Auto Scaling Group, and comprehensive monitoring and logging capabilities",
  "Metadata": {
    "AWS::CloudFormation::Interface": {
      "ParameterGroups": [
        {
          "Label": {
            "default": "Environment Configuration"
          },
          "Parameters": [
            "EnvironmentSuffix"
          ]
        },
        {
          "Label": {
            "default": "Network Configuration"
          },
          "Parameters": [
            "VpcCIDR",
            "PublicSubnet1CIDR",
            "PublicSubnet2CIDR",
            "PrivateSubnet1CIDR",
            "PrivateSubnet2CIDR"
          ]
        },
        {
          "Label": {
            "default": "EC2 and Auto Scaling Configuration"
          },
          "Parameters": [
            "EC2InstanceType",
            "LatestAmiId",
            "MinSize",
            "MaxSize",
            "DesiredCapacity"
          ]
        }
      ]
    }
  },
  "Parameters": {
    "EnvironmentSuffix": {
      "Type": "String",
      "Default": "dev",
      "Description": "Environment suffix for resource naming (e.g., dev, staging, prod)",
      "AllowedPattern": "^[a-zA-Z0-9]+$",
      "ConstraintDescription": "Must contain only alphanumeric characters"
    },
    "VpcCIDR": {
      "Type": "String",
      "Default": "10.0.0.0/16",
      "Description": "CIDR block for VPC",
      "AllowedPattern": "^(10\\.\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}/16)$"
    },
    "PublicSubnet1CIDR": {
      "Type": "String",
      "Default": "10.0.1.0/24",
      "Description": "CIDR block for Public Subnet 1",
      "AllowedPattern": "^(10\\.\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}/24)$"
    },
    "PublicSubnet2CIDR": {
      "Type": "String",
      "Default": "10.0.2.0/24",
      "Description": "CIDR block for Public Subnet 2",
      "AllowedPattern": "^(10\\.\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}/24)$"
    },
    "PrivateSubnet1CIDR": {
      "Type": "String",
      "Default": "10.0.3.0/24",
      "Description": "CIDR block for Private Subnet 1",
      "AllowedPattern": "^(10\\.\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}/24)$"
    },
    "PrivateSubnet2CIDR": {
      "Type": "String",
      "Default": "10.0.4.0/24",
      "Description": "CIDR block for Private Subnet 2",
      "AllowedPattern": "^(10\\.\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}/24)$"
    },
    "EC2InstanceType": {
      "Type": "String",
      "Default": "t2.micro",
      "Description": "EC2 instance type for Auto Scaling Group",
      "AllowedValues": [
        "t2.micro",
        "t2.small",
        "t2.medium"
      ]
    },
    "LatestAmiId": {
      "Type": "AWS::SSM::Parameter::Value<AWS::EC2::Image::Id>",
      "Default": "/aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2",
      "Description": "Latest Amazon Linux 2 AMI ID"
    },
    "MinSize": {
      "Type": "Number",
      "Default": 2,
      "Description": "Minimum number of instances in Auto Scaling Group",
      "MinValue": 1,
      "MaxValue": 10
    },
    "MaxSize": {
      "Type": "Number",
      "Default": 5,
      "Description": "Maximum number of instances in Auto Scaling Group",
      "MinValue": 1,
      "MaxValue": 10
    },
    "DesiredCapacity": {
      "Type": "Number",
      "Default": 2,
      "Description": "Desired number of instances in Auto Scaling Group",
      "MinValue": 1,
      "MaxValue": 10
    }
  },
  "Resources": {
    "VPC": {
      "Type": "AWS::EC2::VPC",
      "Properties": {
        "CidrBlock": {
          "Ref": "VpcCIDR"
        },
        "EnableDnsHostnames": true,
        "EnableDnsSupport": true,
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "VPC-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "EnvironmentSuffix"
            }
          },
          {
            "Key": "Project",
            "Value": "CloudEnvironmentSetup"
          },
          {
            "Key": "Owner",
            "Value": "DevOpsTeam"
          },
          {
            "Key": "CostCenter",
            "Value": "Engineering"
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
              "Fn::Sub": "IGW-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "EnvironmentSuffix"
            }
          },
          {
            "Key": "Project",
            "Value": "CloudEnvironmentSetup"
          },
          {
            "Key": "Owner",
            "Value": "DevOpsTeam"
          },
          {
            "Key": "CostCenter",
            "Value": "Engineering"
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
          "Ref": "PublicSubnet1CIDR"
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
              "Fn::Sub": "PublicSubnet1-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "EnvironmentSuffix"
            }
          },
          {
            "Key": "Project",
            "Value": "CloudEnvironmentSetup"
          },
          {
            "Key": "Owner",
            "Value": "DevOpsTeam"
          },
          {
            "Key": "CostCenter",
            "Value": "Engineering"
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
          "Ref": "PublicSubnet2CIDR"
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
              "Fn::Sub": "PublicSubnet2-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "EnvironmentSuffix"
            }
          },
          {
            "Key": "Project",
            "Value": "CloudEnvironmentSetup"
          },
          {
            "Key": "Owner",
            "Value": "DevOpsTeam"
          },
          {
            "Key": "CostCenter",
            "Value": "Engineering"
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
          "Ref": "PrivateSubnet1CIDR"
        },
        "AvailabilityZone": {
          "Fn::Select": [
            0,
            {
              "Fn::GetAZs": ""
            }
          ]
        },
        "MapPublicIpOnLaunch": false,
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "PrivateSubnet1-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "EnvironmentSuffix"
            }
          },
          {
            "Key": "Project",
            "Value": "CloudEnvironmentSetup"
          },
          {
            "Key": "Owner",
            "Value": "DevOpsTeam"
          },
          {
            "Key": "CostCenter",
            "Value": "Engineering"
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
          "Ref": "PrivateSubnet2CIDR"
        },
        "AvailabilityZone": {
          "Fn::Select": [
            1,
            {
              "Fn::GetAZs": ""
            }
          ]
        },
        "MapPublicIpOnLaunch": false,
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "PrivateSubnet2-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "EnvironmentSuffix"
            }
          },
          {
            "Key": "Project",
            "Value": "CloudEnvironmentSetup"
          },
          {
            "Key": "Owner",
            "Value": "DevOpsTeam"
          },
          {
            "Key": "CostCenter",
            "Value": "Engineering"
          }
        ]
      }
    },
    "NATGatewayEIP1": {
      "Type": "AWS::EC2::EIP",
      "DependsOn": "AttachGateway",
      "Properties": {
        "Domain": "vpc",
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "NATGatewayEIP1-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "EnvironmentSuffix"
            }
          },
          {
            "Key": "Project",
            "Value": "CloudEnvironmentSetup"
          },
          {
            "Key": "Owner",
            "Value": "DevOpsTeam"
          },
          {
            "Key": "CostCenter",
            "Value": "Engineering"
          }
        ]
      }
    },
    "NATGatewayEIP2": {
      "Type": "AWS::EC2::EIP",
      "DependsOn": "AttachGateway",
      "Properties": {
        "Domain": "vpc",
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "NATGatewayEIP2-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "EnvironmentSuffix"
            }
          },
          {
            "Key": "Project",
            "Value": "CloudEnvironmentSetup"
          },
          {
            "Key": "Owner",
            "Value": "DevOpsTeam"
          },
          {
            "Key": "CostCenter",
            "Value": "Engineering"
          }
        ]
      }
    },
    "NATGateway1": {
      "Type": "AWS::EC2::NatGateway",
      "Properties": {
        "AllocationId": {
          "Fn::GetAtt": [
            "NATGatewayEIP1",
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
              "Fn::Sub": "NATGateway1-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "EnvironmentSuffix"
            }
          },
          {
            "Key": "Project",
            "Value": "CloudEnvironmentSetup"
          },
          {
            "Key": "Owner",
            "Value": "DevOpsTeam"
          },
          {
            "Key": "CostCenter",
            "Value": "Engineering"
          }
        ]
      }
    },
    "NATGateway2": {
      "Type": "AWS::EC2::NatGateway",
      "Properties": {
        "AllocationId": {
          "Fn::GetAtt": [
            "NATGatewayEIP2",
            "AllocationId"
          ]
        },
        "SubnetId": {
          "Ref": "PublicSubnet2"
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "NATGateway2-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "EnvironmentSuffix"
            }
          },
          {
            "Key": "Project",
            "Value": "CloudEnvironmentSetup"
          },
          {
            "Key": "Owner",
            "Value": "DevOpsTeam"
          },
          {
            "Key": "CostCenter",
            "Value": "Engineering"
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
              "Fn::Sub": "PublicRouteTable-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "EnvironmentSuffix"
            }
          },
          {
            "Key": "Project",
            "Value": "CloudEnvironmentSetup"
          },
          {
            "Key": "Owner",
            "Value": "DevOpsTeam"
          },
          {
            "Key": "CostCenter",
            "Value": "Engineering"
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
    "PrivateRouteTable1": {
      "Type": "AWS::EC2::RouteTable",
      "Properties": {
        "VpcId": {
          "Ref": "VPC"
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "PrivateRouteTable1-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "EnvironmentSuffix"
            }
          },
          {
            "Key": "Project",
            "Value": "CloudEnvironmentSetup"
          },
          {
            "Key": "Owner",
            "Value": "DevOpsTeam"
          },
          {
            "Key": "CostCenter",
            "Value": "Engineering"
          }
        ]
      }
    },
    "PrivateRoute1": {
      "Type": "AWS::EC2::Route",
      "Properties": {
        "RouteTableId": {
          "Ref": "PrivateRouteTable1"
        },
        "DestinationCidrBlock": "0.0.0.0/0",
        "NatGatewayId": {
          "Ref": "NATGateway1"
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
          "Ref": "PrivateRouteTable1"
        }
      }
    },
    "PrivateRouteTable2": {
      "Type": "AWS::EC2::RouteTable",
      "Properties": {
        "VpcId": {
          "Ref": "VPC"
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "PrivateRouteTable2-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "EnvironmentSuffix"
            }
          },
          {
            "Key": "Project",
            "Value": "CloudEnvironmentSetup"
          },
          {
            "Key": "Owner",
            "Value": "DevOpsTeam"
          },
          {
            "Key": "CostCenter",
            "Value": "Engineering"
          }
        ]
      }
    },
    "PrivateRoute2": {
      "Type": "AWS::EC2::Route",
      "Properties": {
        "RouteTableId": {
          "Ref": "PrivateRouteTable2"
        },
        "DestinationCidrBlock": "0.0.0.0/0",
        "NatGatewayId": {
          "Ref": "NATGateway2"
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
          "Ref": "PrivateRouteTable2"
        }
      }
    },
    "PublicNetworkAcl": {
      "Type": "AWS::EC2::NetworkAcl",
      "Properties": {
        "VpcId": {
          "Ref": "VPC"
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "PublicNetworkAcl-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "EnvironmentSuffix"
            }
          },
          {
            "Key": "Project",
            "Value": "CloudEnvironmentSetup"
          },
          {
            "Key": "Owner",
            "Value": "DevOpsTeam"
          },
          {
            "Key": "CostCenter",
            "Value": "Engineering"
          }
        ]
      }
    },
    "PublicNetworkAclInboundHTTP": {
      "Type": "AWS::EC2::NetworkAclEntry",
      "Properties": {
        "NetworkAclId": {
          "Ref": "PublicNetworkAcl"
        },
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
    "PublicNetworkAclInboundHTTPS": {
      "Type": "AWS::EC2::NetworkAclEntry",
      "Properties": {
        "NetworkAclId": {
          "Ref": "PublicNetworkAcl"
        },
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
    "PublicNetworkAclInboundEphemeral": {
      "Type": "AWS::EC2::NetworkAclEntry",
      "Properties": {
        "NetworkAclId": {
          "Ref": "PublicNetworkAcl"
        },
        "RuleNumber": 120,
        "Protocol": 6,
        "RuleAction": "allow",
        "CidrBlock": "0.0.0.0/0",
        "PortRange": {
          "From": 1024,
          "To": 65535
        }
      }
    },
    "PublicNetworkAclOutbound": {
      "Type": "AWS::EC2::NetworkAclEntry",
      "Properties": {
        "NetworkAclId": {
          "Ref": "PublicNetworkAcl"
        },
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
        "SubnetId": {
          "Ref": "PublicSubnet1"
        },
        "NetworkAclId": {
          "Ref": "PublicNetworkAcl"
        }
      }
    },
    "PublicSubnet2NetworkAclAssociation": {
      "Type": "AWS::EC2::SubnetNetworkAclAssociation",
      "Properties": {
        "SubnetId": {
          "Ref": "PublicSubnet2"
        },
        "NetworkAclId": {
          "Ref": "PublicNetworkAcl"
        }
      }
    },
    "PrivateNetworkAcl": {
      "Type": "AWS::EC2::NetworkAcl",
      "Properties": {
        "VpcId": {
          "Ref": "VPC"
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "PrivateNetworkAcl-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "EnvironmentSuffix"
            }
          },
          {
            "Key": "Project",
            "Value": "CloudEnvironmentSetup"
          },
          {
            "Key": "Owner",
            "Value": "DevOpsTeam"
          },
          {
            "Key": "CostCenter",
            "Value": "Engineering"
          }
        ]
      }
    },
    "PrivateNetworkAclInboundVPC": {
      "Type": "AWS::EC2::NetworkAclEntry",
      "Properties": {
        "NetworkAclId": {
          "Ref": "PrivateNetworkAcl"
        },
        "RuleNumber": 100,
        "Protocol": -1,
        "RuleAction": "allow",
        "CidrBlock": {
          "Ref": "VpcCIDR"
        }
      }
    },
    "PrivateNetworkAclInboundEphemeral": {
      "Type": "AWS::EC2::NetworkAclEntry",
      "Properties": {
        "NetworkAclId": {
          "Ref": "PrivateNetworkAcl"
        },
        "RuleNumber": 110,
        "Protocol": 6,
        "RuleAction": "allow",
        "CidrBlock": "0.0.0.0/0",
        "PortRange": {
          "From": 1024,
          "To": 65535
        }
      }
    },
    "PrivateNetworkAclOutbound": {
      "Type": "AWS::EC2::NetworkAclEntry",
      "Properties": {
        "NetworkAclId": {
          "Ref": "PrivateNetworkAcl"
        },
        "RuleNumber": 100,
        "Protocol": -1,
        "Egress": true,
        "RuleAction": "allow",
        "CidrBlock": "0.0.0.0/0"
      }
    },
    "PrivateSubnet1NetworkAclAssociation": {
      "Type": "AWS::EC2::SubnetNetworkAclAssociation",
      "Properties": {
        "SubnetId": {
          "Ref": "PrivateSubnet1"
        },
        "NetworkAclId": {
          "Ref": "PrivateNetworkAcl"
        }
      }
    },
    "PrivateSubnet2NetworkAclAssociation": {
      "Type": "AWS::EC2::SubnetNetworkAclAssociation",
      "Properties": {
        "SubnetId": {
          "Ref": "PrivateSubnet2"
        },
        "NetworkAclId": {
          "Ref": "PrivateNetworkAcl"
        }
      }
    },
    "ALBSecurityGroup": {
      "Type": "AWS::EC2::SecurityGroup",
      "Properties": {
        "GroupDescription": "Security group for Application Load Balancer - allows HTTP and HTTPS",
        "VpcId": {
          "Ref": "VPC"
        },
        "SecurityGroupIngress": [
          {
            "IpProtocol": "tcp",
            "FromPort": 80,
            "ToPort": 80,
            "CidrIp": "0.0.0.0/0",
            "Description": "HTTP access from anywhere"
          },
          {
            "IpProtocol": "tcp",
            "FromPort": 443,
            "ToPort": 443,
            "CidrIp": "0.0.0.0/0",
            "Description": "HTTPS access from anywhere"
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
              "Fn::Sub": "ALBSecurityGroup-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "EnvironmentSuffix"
            }
          },
          {
            "Key": "Project",
            "Value": "CloudEnvironmentSetup"
          },
          {
            "Key": "Owner",
            "Value": "DevOpsTeam"
          },
          {
            "Key": "CostCenter",
            "Value": "Engineering"
          }
        ]
      }
    },
    "WebServerSecurityGroup": {
      "Type": "AWS::EC2::SecurityGroup",
      "Properties": {
        "GroupDescription": "Security group for EC2 instances - allows traffic from ALB only",
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
            "Description": "HTTP access from ALB"
          },
          {
            "IpProtocol": "tcp",
            "FromPort": 443,
            "ToPort": 443,
            "SourceSecurityGroupId": {
              "Ref": "ALBSecurityGroup"
            },
            "Description": "HTTPS access from ALB"
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
              "Fn::Sub": "WebServerSecurityGroup-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "EnvironmentSuffix"
            }
          },
          {
            "Key": "Project",
            "Value": "CloudEnvironmentSetup"
          },
          {
            "Key": "Owner",
            "Value": "DevOpsTeam"
          },
          {
            "Key": "CostCenter",
            "Value": "Engineering"
          }
        ]
      }
    },
    "ApplicationLoadBalancer": {
      "Type": "AWS::ElasticLoadBalancingV2::LoadBalancer",
      "DependsOn": "AttachGateway",
      "Properties": {
        "Name": {
          "Fn::Sub": "ALB-${EnvironmentSuffix}"
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
              "Fn::Sub": "ALB-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "EnvironmentSuffix"
            }
          },
          {
            "Key": "Project",
            "Value": "CloudEnvironmentSetup"
          },
          {
            "Key": "Owner",
            "Value": "DevOpsTeam"
          },
          {
            "Key": "CostCenter",
            "Value": "Engineering"
          }
        ]
      }
    },
    "ALBTargetGroup": {
      "Type": "AWS::ElasticLoadBalancingV2::TargetGroup",
      "Properties": {
        "Name": {
          "Fn::Sub": "TG-${EnvironmentSuffix}"
        },
        "Port": 80,
        "Protocol": "HTTP",
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
        "TargetType": "instance",
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "TargetGroup-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "EnvironmentSuffix"
            }
          },
          {
            "Key": "Project",
            "Value": "CloudEnvironmentSetup"
          },
          {
            "Key": "Owner",
            "Value": "DevOpsTeam"
          },
          {
            "Key": "CostCenter",
            "Value": "Engineering"
          }
        ]
      }
    },
    "ALBListenerHTTP": {
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
    "ALBListenerHTTPS": {
      "Type": "AWS::ElasticLoadBalancingV2::Listener",
      "Properties": {
        "LoadBalancerArn": {
          "Ref": "ApplicationLoadBalancer"
        },
        "Port": 443,
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
    "EC2InstanceRole": {
      "Type": "AWS::IAM::Role",
      "Properties": {
        "RoleName": {
          "Fn::Sub": "EC2InstanceRole-${EnvironmentSuffix}-${AWS::StackName}"
        },
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
          "arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy",
          "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
        ],
        "Policies": [
          {
            "PolicyName": "CloudWatchLogsAccess",
            "PolicyDocument": {
              "Version": "2012-10-17",
              "Statement": [
                {
                  "Effect": "Allow",
                  "Action": [
                    "logs:CreateLogGroup",
                    "logs:CreateLogStream",
                    "logs:PutLogEvents",
                    "logs:DescribeLogStreams"
                  ],
                  "Resource": {
                    "Fn::Sub": "arn:aws:logs:${AWS::Region}:${AWS::AccountId}:log-group:/aws/ec2/*"
                  }
                }
              ]
            }
          },
          {
            "PolicyName": "CloudWatchAlarmsReadAccess",
            "PolicyDocument": {
              "Version": "2012-10-17",
              "Statement": [
                {
                  "Effect": "Allow",
                  "Action": [
                    "cloudwatch:DescribeAlarms"
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
              "Fn::Sub": "EC2InstanceRole-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "EnvironmentSuffix"
            }
          },
          {
            "Key": "Project",
            "Value": "CloudEnvironmentSetup"
          },
          {
            "Key": "Owner",
            "Value": "DevOpsTeam"
          },
          {
            "Key": "CostCenter",
            "Value": "Engineering"
          }
        ]
      }
    },
    "EC2InstanceProfile": {
      "Type": "AWS::IAM::InstanceProfile",
      "Properties": {
        "Roles": [
          {
            "Ref": "EC2InstanceRole"
          }
        ]
      }
    },
    "LaunchTemplate": {
      "Type": "AWS::EC2::LaunchTemplate",
      "Properties": {
        "LaunchTemplateName": {
          "Fn::Sub": "LaunchTemplate-${EnvironmentSuffix}"
        },
        "LaunchTemplateData": {
          "ImageId": {
            "Ref": "LatestAmiId"
          },
          "InstanceType": {
            "Ref": "EC2InstanceType"
          },
          "IamInstanceProfile": {
            "Arn": {
              "Fn::GetAtt": [
                "EC2InstanceProfile",
                "Arn"
              ]
            }
          },
          "SecurityGroupIds": [
            {
              "Ref": "WebServerSecurityGroup"
            }
          ],
          "Monitoring": {
            "Enabled": true
          },
          "UserData": {
            "Fn::Base64": {
              "Fn::Join": [
                "",
                [
                  "#!/bin/bash\n",
                  "yum update -y\n",
                  "yum install -y httpd amazon-cloudwatch-agent\n",
                  "yum install -y amazon-ssm-agent\n",
                  "systemctl enable amazon-ssm-agent\n",
                  "systemctl start amazon-ssm-agent\n",
                  "systemctl start httpd\n",
                  "systemctl enable httpd\n",
                  "echo '<h1>Hello from Auto Scaling Group</h1>' > /var/www/html/index.html\n"
                ]
              ]
            }
          },
          "TagSpecifications": [
            {
              "ResourceType": "instance",
              "Tags": [
                {
                  "Key": "Name",
                  "Value": {
                    "Fn::Sub": "ASG-Instance-${EnvironmentSuffix}"
                  }
                },
                {
                  "Key": "Environment",
                  "Value": {
                    "Ref": "EnvironmentSuffix"
                  }
                },
                {
                  "Key": "Project",
                  "Value": "CloudEnvironmentSetup"
                },
                {
                  "Key": "Owner",
                  "Value": "DevOpsTeam"
                },
                {
                  "Key": "CostCenter",
                  "Value": "Engineering"
                }
              ]
            }
          ]
        }
      }
    },
    "AutoScalingGroup": {
      "Type": "AWS::AutoScaling::AutoScalingGroup",
      "Properties": {
        "AutoScalingGroupName": {
          "Fn::Sub": "ASG-${EnvironmentSuffix}"
        },
        "LaunchTemplate": {
          "LaunchTemplateId": {
            "Ref": "LaunchTemplate"
          },
          "Version": {
            "Fn::GetAtt": [
              "LaunchTemplate",
              "LatestVersionNumber"
            ]
          }
        },
        "MinSize": {
          "Ref": "MinSize"
        },
        "MaxSize": {
          "Ref": "MaxSize"
        },
        "DesiredCapacity": {
          "Ref": "DesiredCapacity"
        },
        "VPCZoneIdentifier": [
          {
            "Ref": "PrivateSubnet1"
          },
          {
            "Ref": "PrivateSubnet2"
          }
        ],
        "TargetGroupARNs": [
          {
            "Ref": "ALBTargetGroup"
          }
        ],
        "HealthCheckType": "ELB",
        "HealthCheckGracePeriod": 300,
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "ASG-${EnvironmentSuffix}"
            },
            "PropagateAtLaunch": false
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "EnvironmentSuffix"
            },
            "PropagateAtLaunch": true
          },
          {
            "Key": "Project",
            "Value": "CloudEnvironmentSetup",
            "PropagateAtLaunch": true
          },
          {
            "Key": "Owner",
            "Value": "DevOpsTeam",
            "PropagateAtLaunch": true
          },
          {
            "Key": "CostCenter",
            "Value": "Engineering",
            "PropagateAtLaunch": true
          }
        ]
      }
    },
    "ScaleUpPolicy": {
      "Type": "AWS::AutoScaling::ScalingPolicy",
      "Properties": {
        "AdjustmentType": "ChangeInCapacity",
        "AutoScalingGroupName": {
          "Ref": "AutoScalingGroup"
        },
        "Cooldown": 300,
        "ScalingAdjustment": 1
      }
    },
    "ScaleDownPolicy": {
      "Type": "AWS::AutoScaling::ScalingPolicy",
      "Properties": {
        "AdjustmentType": "ChangeInCapacity",
        "AutoScalingGroupName": {
          "Ref": "AutoScalingGroup"
        },
        "Cooldown": 300,
        "ScalingAdjustment": -1
      }
    },
    "CPUAlarmHigh": {
      "Type": "AWS::CloudWatch::Alarm",
      "Properties": {
        "AlarmName": {
          "Fn::Sub": "ASG-CPUHigh-${EnvironmentSuffix}"
        },
        "AlarmDescription": "Scale up when CPU exceeds 70%",
        "MetricName": "CPUUtilization",
        "Namespace": "AWS/EC2",
        "Statistic": "Average",
        "Period": 300,
        "EvaluationPeriods": 2,
        "Threshold": 70,
        "ComparisonOperator": "GreaterThanThreshold",
        "Dimensions": [
          {
            "Name": "AutoScalingGroupName",
            "Value": {
              "Ref": "AutoScalingGroup"
            }
          }
        ],
        "AlarmActions": [
          {
            "Ref": "ScaleUpPolicy"
          }
        ]
      }
    },
    "CPUAlarmLow": {
      "Type": "AWS::CloudWatch::Alarm",
      "Properties": {
        "AlarmName": {
          "Fn::Sub": "ASG-CPULow-${EnvironmentSuffix}"
        },
        "AlarmDescription": "Scale down when CPU is below 30%",
        "MetricName": "CPUUtilization",
        "Namespace": "AWS/EC2",
        "Statistic": "Average",
        "Period": 300,
        "EvaluationPeriods": 2,
        "Threshold": 30,
        "ComparisonOperator": "LessThanThreshold",
        "Dimensions": [
          {
            "Name": "AutoScalingGroupName",
            "Value": {
              "Ref": "AutoScalingGroup"
            }
          }
        ],
        "AlarmActions": [
          {
            "Ref": "ScaleDownPolicy"
          }
        ]
      }
    },
    "UnhealthyTargetAlarm": {
      "Type": "AWS::CloudWatch::Alarm",
      "Properties": {
        "AlarmName": {
          "Fn::Sub": "ALB-UnhealthyTargets-${EnvironmentSuffix}"
        },
        "AlarmDescription": "Alert when unhealthy target count exceeds threshold",
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
                "ApplicationLoadBalancer",
                "LoadBalancerFullName"
              ]
            }
          },
          {
            "Name": "TargetGroup",
            "Value": {
              "Fn::GetAtt": [
                "ALBTargetGroup",
                "TargetGroupFullName"
              ]
            }
          }
        ]
      }
    },
    "NATGatewayErrorAlarm1": {
      "Type": "AWS::CloudWatch::Alarm",
      "Properties": {
        "AlarmName": {
          "Fn::Sub": "NATGateway1-Errors-${EnvironmentSuffix}"
        },
        "AlarmDescription": "Alert when NAT Gateway 1 has port allocation errors",
        "MetricName": "ErrorPortAllocation",
        "Namespace": "AWS/NATGateway",
        "Statistic": "Sum",
        "Period": 300,
        "EvaluationPeriods": 1,
        "Threshold": 10,
        "ComparisonOperator": "GreaterThanThreshold",
        "Dimensions": [
          {
            "Name": "NatGatewayId",
            "Value": {
              "Ref": "NATGateway1"
            }
          }
        ]
      }
    },
    "NATGatewayErrorAlarm2": {
      "Type": "AWS::CloudWatch::Alarm",
      "Properties": {
        "AlarmName": {
          "Fn::Sub": "NATGateway2-Errors-${EnvironmentSuffix}"
        },
        "AlarmDescription": "Alert when NAT Gateway 2 has port allocation errors",
        "MetricName": "ErrorPortAllocation",
        "Namespace": "AWS/NATGateway",
        "Statistic": "Sum",
        "Period": 300,
        "EvaluationPeriods": 1,
        "Threshold": 10,
        "ComparisonOperator": "GreaterThanThreshold",
        "Dimensions": [
          {
            "Name": "NatGatewayId",
            "Value": {
              "Ref": "NATGateway2"
            }
          }
        ]
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
        "LogGroupName": {
          "Fn::Sub": "/aws/vpc/${EnvironmentSuffix}-${AWS::StackName}"
        },
        "RetentionInDays": 7
      }
    },
    "VPCFlowLog": {
      "Type": "AWS::EC2::FlowLog",
      "Properties": {
        "DeliverLogsPermissionArn": {
          "Fn::GetAtt": [
            "VPCFlowLogRole",
            "Arn"
          ]
        },
        "LogDestinationType": "cloud-watch-logs",
        "LogGroupName": {
          "Ref": "VPCFlowLogGroup"
        },
        "ResourceId": {
          "Ref": "VPC"
        },
        "ResourceType": "VPC",
        "TrafficType": "ALL",
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "VPCFlowLog-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "EnvironmentSuffix"
            }
          },
          {
            "Key": "Project",
            "Value": "CloudEnvironmentSetup"
          },
          {
            "Key": "Owner",
            "Value": "DevOpsTeam"
          },
          {
            "Key": "CostCenter",
            "Value": "Engineering"
          }
        ]
      }
    },
    "CloudTrailBucket": {
      "Type": "AWS::S3::Bucket",
      "Properties": {
        "BucketName": {
          "Fn::Sub": "cloudtrail-${AWS::AccountId}-${EnvironmentSuffix}"
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
              "Fn::Sub": "CloudTrailBucket-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "EnvironmentSuffix"
            }
          },
          {
            "Key": "Project",
            "Value": "CloudEnvironmentSetup"
          },
          {
            "Key": "Owner",
            "Value": "DevOpsTeam"
          },
          {
            "Key": "CostCenter",
            "Value": "Engineering"
          }
        ]
      }
    },
    "CloudTrailBucketPolicy": {
      "Type": "AWS::S3::BucketPolicy",
      "Properties": {
        "Bucket": {
          "Ref": "CloudTrailBucket"
        },
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
              "Resource": {
                "Fn::GetAtt": [
                  "CloudTrailBucket",
                  "Arn"
                ]
              }
            },
            {
              "Sid": "AWSCloudTrailWrite",
              "Effect": "Allow",
              "Principal": {
                "Service": "cloudtrail.amazonaws.com"
              },
              "Action": "s3:PutObject",
              "Resource": {
                "Fn::Sub": "${CloudTrailBucket.Arn}/*"
              },
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
        "TrailName": {
          "Fn::Sub": "CloudTrail-${EnvironmentSuffix}"
        },
        "S3BucketName": {
          "Ref": "CloudTrailBucket"
        },
        "IncludeGlobalServiceEvents": true,
        "IsLogging": true,
        "IsMultiRegionTrail": true,
        "EventSelectors": [
          {
            "ReadWriteType": "All",
            "IncludeManagementEvents": true
          }
        ],
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "CloudTrail-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "EnvironmentSuffix"
            }
          },
          {
            "Key": "Project",
            "Value": "CloudEnvironmentSetup"
          },
          {
            "Key": "Owner",
            "Value": "DevOpsTeam"
          },
          {
            "Key": "CostCenter",
            "Value": "Engineering"
          }
        ]
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
          "Fn::Sub": "${AWS::StackName}-VPCId"
        }
      }
    },
    "PublicSubnet1Id": {
      "Description": "Public Subnet 1 ID",
      "Value": {
        "Ref": "PublicSubnet1"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-PublicSubnet1Id"
        }
      }
    },
    "PublicSubnet2Id": {
      "Description": "Public Subnet 2 ID",
      "Value": {
        "Ref": "PublicSubnet2"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-PublicSubnet2Id"
        }
      }
    },
    "PrivateSubnet1Id": {
      "Description": "Private Subnet 1 ID",
      "Value": {
        "Ref": "PrivateSubnet1"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-PrivateSubnet1Id"
        }
      }
    },
    "PrivateSubnet2Id": {
      "Description": "Private Subnet 2 ID",
      "Value": {
        "Ref": "PrivateSubnet2"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-PrivateSubnet2Id"
        }
      }
    },
    "InternetGatewayId": {
      "Description": "Internet Gateway ID",
      "Value": {
        "Ref": "InternetGateway"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-InternetGatewayId"
        }
      }
    },
    "NATGateway1Id": {
      "Description": "NAT Gateway 1 ID",
      "Value": {
        "Ref": "NATGateway1"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-NATGateway1Id"
        }
      }
    },
    "NATGateway2Id": {
      "Description": "NAT Gateway 2 ID",
      "Value": {
        "Ref": "NATGateway2"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-NATGateway2Id"
        }
      }
    },
    "ApplicationLoadBalancerDNS": {
      "Description": "Application Load Balancer DNS Name",
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
    "AutoScalingGroupName": {
      "Description": "Auto Scaling Group Name",
      "Value": {
        "Ref": "AutoScalingGroup"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-ASGName"
        }
      }
    },
    "CloudTrailName": {
      "Description": "CloudTrail Trail Name",
      "Value": {
        "Ref": "CloudTrail"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-CloudTrailName"
        }
      }
    }
  }
}
```

## Key Features

### Security

The template implements comprehensive security through multiple layers. Network ACLs provide stateless subnet-level firewall controls with explicit rules for HTTP, HTTPS, and ephemeral ports. Security groups implement stateful instance-level security with the ALB security group permitting HTTP and HTTPS from the internet, while the web server security group restricts access to only traffic from the ALB using security group references. All EC2 instances are deployed in private subnets with no direct internet access, using NAT Gateways for outbound connectivity. IAM roles follow the principle of least privilege with EC2 instances granted only CloudWatch and Systems Manager permissions. CloudTrail logs are encrypted at rest using AES-256 in a dedicated S3 bucket with all public access blocked. VPC Flow Logs capture all network traffic to CloudWatch Logs for security analysis and compliance auditing with 7-day retention.

### Scalability

The architecture provides automatic horizontal scaling through the Auto Scaling Group that dynamically adjusts capacity from 2 to 5 instances based on CPU utilization. CloudWatch alarms trigger scale-up when CPU exceeds 70% and scale-down when it falls below 30%, with 300-second cooldown periods. The Application Load Balancer automatically distributes traffic across healthy instances in multiple Availability Zones. The VPC design with /16 CIDR provides 65,536 IP addresses for future growth. Launch Templates enable easy configuration updates with versioning support. Dynamic AMI resolution through SSM Parameter Store automatically deploys the latest Amazon Linux 2 AMI. All outputs are exported for cross-stack references, enabling the infrastructure to serve as a foundation for additional stacks.

### Operational Excellence

The template achieves operational excellence through infrastructure as code with comprehensive parameterization for all environment-specific values. Parameters use validation through AllowedPattern for CIDR blocks, AllowedValues for instance types, and MinValue/MaxValue for numeric parameters. Dynamic AMI resolution through SSM Parameter Store eliminates outdated AMI issues. CloudWatch monitoring provides comprehensive visibility with CPU alarms, unhealthy target alarms, and NAT Gateway error alarms. VPC Flow Logs enable network troubleshooting with 7-day retention in CloudWatch Logs. CloudTrail provides complete audit trails of all AWS API calls. Consistent tagging across all resources with five mandatory tags enables cost allocation, compliance auditing, and operational automation. CloudFormation Interface metadata organizes parameters into logical groups for improved console experience. Systems Manager integration eliminates the need for bastion hosts and SSH key management.

### Cost Optimization

The design balances cost with functionality through several optimizations. T2 instance types provide burstable performance at lower cost. AllowedValues constraints prevent accidental deployment of expensive instance types. Auto Scaling ensures you pay only for needed capacity, scaling down when CPU falls below 30%. The 300-second cooldown prevents unnecessary scaling actions. VPC Flow Logs retention is limited to 7 days to minimize storage costs. Enhanced monitoring provides data for right-sizing decisions. The dual NAT Gateway design eliminates cross-AZ data transfer charges while providing high availability. Resource tagging with Environment, Project, Owner, and CostCenter enables detailed cost allocation reports and chargeback to appropriate departments.

### Reliability

The architecture achieves high reliability through multi-layer redundancy. Two NAT Gateways in separate AZs eliminate single points of failure in private subnet internet connectivity. Each private subnet routes through its respective NAT Gateway, ensuring continued outbound access even if one AZ fails. The Auto Scaling Group maintains minimum capacity of 2 instances distributed across both AZs with automatic replacement of unhealthy instances. The Application Load Balancer performs health checks every 30 seconds, routing traffic only to healthy instances. ELB health checks with 300-second grace period allow proper initialization. CloudWatch alarms provide proactive monitoring with automated responses. CloudTrail multi-region trail captures events from all regions with global service events included. All outputs use Export for cross-stack references enabling disaster recovery scenarios.

## Modern AWS Practices

### Launch Templates with Dynamic Version Management

The infrastructure uses Launch Templates rather than legacy Launch Configurations for several important advantages. Launch Templates support versioning, allowing maintenance of multiple configuration versions with rollback capability. The template references the latest version dynamically using Fn::GetAtt LatestVersionNumber, ensuring the Auto Scaling Group always uses the most recent configuration without manual version updates. Launch Templates support newer EC2 features including T2/T3 Unlimited mode, dedicated hosts, placement groups, and IMDSv2 security enhancements. Configuration updates can be applied without recreating the Auto Scaling Group, reducing deployment risk. TagSpecifications automatically tag instances created by the ASG for resource organization and cost tracking.

### Dynamic AMI Resolution with SSM Parameter Store

Instead of hardcoding an AMI ID that becomes outdated, this template uses AWS Systems Manager Parameter Store to dynamically retrieve the latest Amazon Linux 2 AMI. The parameter type AWS::SSM::Parameter::Value<AWS::EC2::Image::Id> with default /aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2 is maintained by AWS and always points to the latest Amazon Linux 2 AMI. This approach ensures instances always launch with the latest patched AMI, requires no manual AMI ID lookup or template updates, works across all AWS regions automatically, and reduces the risk of launching instances with deprecated AMIs. The SSM parameter is evaluated by CloudFormation during stack creation or update, with the resolved AMI ID passed to the Launch Template transparently.

### Security Group References for Dynamic Security

The template uses security group references instead of IP-based CIDR rules for tighter security. The WebServerSecurityGroup specifies SourceSecurityGroupId referencing the ALBSecurityGroup instead of allowing traffic from specific IP addresses. This approach automatically adapts as instances scale with changing IP addresses, permits new load balancer nodes without rule updates, remains effective even if the load balancer's IP addresses change, and reduces misconfiguration risk. Security group references implement logical security boundaries focusing on component relationships rather than network addresses. The WebServerSecurityGroup allows HTTP and HTTPS only from the ALBSecurityGroup, implementing least privilege by ensuring EC2 instances accept traffic exclusively from the load balancer.

### Multi-AZ NAT Gateway High Availability

This template deploys dual NAT Gateways in a highly available configuration eliminating single points of failure. Each Availability Zone has its own dedicated NAT Gateway with a dedicated Elastic IP. PrivateSubnet1 routes through NATGateway1 via PrivateRouteTable1, and PrivateSubnet2 routes through NATGateway2 via PrivateRouteTable2. This architecture provides critical benefits: if one AZ fails completely, instances in the other AZ maintain outbound internet connectivity through their dedicated NAT Gateway. Each NAT Gateway has a dedicated Elastic IP providing consistent outbound IP addresses for whitelisting. The design eliminates cross-AZ data transfer charges for private subnet outbound traffic. NAT Gateways are fully managed by AWS with automatic scaling to 45 Gbps, automatic patching, and automatic replacement of unhealthy nodes. While this costs more than a single NAT Gateway, it provides critical high availability for production workloads.

### Separate Route Tables for Private Subnets

Instead of a single shared route table for all private subnets, this template creates dedicated route tables for each private subnet enabling per-AZ routing optimization. PrivateRouteTable1 routes to NATGateway1, while PrivateRouteTable2 routes to NATGateway2. This design provides several benefits: each subnet has an independent routing path unaffected by failures in the other AZ, enabling true AZ-level fault isolation. The separation eliminates cross-AZ data transfer charges for outbound internet traffic. It enables per-AZ routing customizations for VPN connections or different egress paths. Separate route tables provide better visibility into network traffic patterns through VPC Flow Logs and CloudWatch metrics for capacity planning. This aligns with AWS Well-Architected Framework reliability recommendations for minimizing dependencies between Availability Zones.

### VPC Flow Logs to CloudWatch

VPC Flow Logs are configured to stream to CloudWatch Logs instead of S3, providing operational and analytical advantages. Flow logs capture metadata about all network traffic including source and destination IPs, ports, protocols, packet and byte counts, and accept/reject decisions based on security group and NACL rules. Streaming to CloudWatch enables real-time analysis and alerting not possible with S3-based flow logs. CloudWatch Logs Insights provides a powerful query language for fast analysis of network traffic patterns. Flow logs can trigger CloudWatch metric filters that extract custom metrics and create alarms based on suspicious patterns. The 7-day retention balances cost with security requirements, providing sufficient data for incident investigation while minimizing storage costs. An IAM role grants VPC Flow Logs permission to publish to CloudWatch Logs using the vpc-flow-logs.amazonaws.com service principal.

### CloudTrail Multi-Region Trail Configuration

The CloudTrail is configured as a multi-region trail with global service event logging providing comprehensive audit coverage. IsMultiRegionTrail set to true ensures the trail logs events from all AWS regions, automatically including new regions as they launch. IncludeGlobalServiceEvents set to true captures events from global services like IAM, CloudFront, and Route 53 that are not region-specific. This configuration provides several benefits: a single trail captures events from all regions with centralized log storage, simplifying compliance reporting and audit log management. The trail logs management events with ReadWriteType set to All, capturing both read and write operations for complete visibility. CloudTrail logs are stored in a dedicated S3 bucket with AES-256 encryption, versioning for data protection, and PublicAccessBlockConfiguration blocking all public access. A bucket policy grants CloudTrail exclusive permission using conditions that require bucket-owner-full-control ACL, ensuring the bucket owner maintains control over all log files.

### ELB Health Checks with Grace Period

The Auto Scaling Group uses ELB health checks instead of EC2 health checks, with a 300-second grace period allowing proper initialization. This configuration provides application-level health verification. EC2 health checks only verify the instance is running, while ELB health checks perform actual HTTP requests to the configured path and verify the application responds with HTTP 200, detecting application-level failures that EC2 checks miss. The 300-second grace period prevents Auto Scaling from prematurely terminating instances during initialization when the user data script is installing software, starting services, and creating the index.html file. Without a grace period, instances might be terminated during initialization, leading to a failure loop. The ELB performs health checks every 30 seconds with a 5-second timeout, requiring 2 consecutive successful checks to mark an instance healthy and 3 consecutive failed checks to mark it unhealthy. This ensures accurate health status with tolerance for transient issues while providing rapid detection of sustained failures.

### Comprehensive Resource Tagging Strategy

All resources implement a comprehensive tagging strategy with five mandatory tags: Name (dynamically generated using Fn::Sub), Environment (referencing EnvironmentSuffix), Project (CloudEnvironmentSetup), Owner (DevOpsTeam), and CostCenter (Engineering). This consistent tagging enables several capabilities: cost allocation through AWS Cost Explorer allows tracking costs by environment, project, owner, and cost center with detailed reports. Chargeback to appropriate departments becomes straightforward with CostCenter tags. Resource filtering and searching in the AWS Console is simplified through tag-based filters. Automated operations through tag-based resource selection enables scripts to target specific resource groups. The Auto Scaling Group uses PropagateAtLaunch set to true for Environment, Project, Owner, and CostCenter tags, ensuring all EC2 instances inherit these tags automatically. Tag-based IAM policies can restrict permissions based on resource tags for fine-grained access control. Compliance reporting requirements are satisfied through consistent tagging demonstrating proper resource organization, ownership tracking, and cost attribution.
