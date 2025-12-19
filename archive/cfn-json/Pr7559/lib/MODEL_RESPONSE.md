# CloudFormation VPC Infrastructure Implementation

This implementation creates a production-ready VPC infrastructure with multi-AZ support, NAT instances, and proper network segmentation for a financial services platform.

## File: lib/vpc-infrastructure.json

```json
{
  "AWSTemplateFormatVersion": "2010-09-09",
  "Description": "Production-ready VPC infrastructure for financial services digital banking platform with multi-AZ support, NAT instances, and comprehensive security controls",
  "Parameters": {
    "EnvironmentName": {
      "Type": "String",
      "Default": "production",
      "AllowedValues": ["development", "staging", "production"],
      "Description": "Environment name for resource tagging and naming"
    },
    "CostCenter": {
      "Type": "String",
      "Default": "digital-banking",
      "AllowedValues": ["digital-banking", "core-banking", "platform-services"],
      "Description": "Cost center for billing and resource allocation"
    },
    "EnvironmentSuffix": {
      "Type": "String",
      "Default": "prod-01",
      "Description": "Unique suffix for resource naming to ensure uniqueness across deployments",
      "MinLength": 1,
      "MaxLength": 20,
      "AllowedPattern": "[a-z0-9-]+",
      "ConstraintDescription": "Must contain only lowercase letters, numbers, and hyphens"
    },
    "ProjectName": {
      "Type": "String",
      "Default": "banking-platform",
      "Description": "Project name for resource tagging"
    }
  },
  "Mappings": {
    "AmazonLinux2AMI": {
      "us-east-1": {
        "AMI": "ami-0c02fb55d7c4945e3"
      },
      "us-west-2": {
        "AMI": "ami-0a38c1c38a15fed74"
      },
      "eu-west-1": {
        "AMI": "ami-0d71ea30463e0ff8d"
      }
    }
  },
  "Resources": {
    "VPC": {
      "Type": "AWS::EC2::VPC",
      "DeletionPolicy": "Delete",
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
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "EnvironmentName"
            }
          },
          {
            "Key": "Project",
            "Value": {
              "Ref": "ProjectName"
            }
          },
          {
            "Key": "CostCenter",
            "Value": {
              "Ref": "CostCenter"
            }
          }
        ]
      }
    },
    "InternetGateway": {
      "Type": "AWS::EC2::InternetGateway",
      "DeletionPolicy": "Delete",
      "Properties": {
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "igw-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "EnvironmentName"
            }
          },
          {
            "Key": "Project",
            "Value": {
              "Ref": "ProjectName"
            }
          },
          {
            "Key": "CostCenter",
            "Value": {
              "Ref": "CostCenter"
            }
          }
        ]
      }
    },
    "VPCGatewayAttachment": {
      "Type": "AWS::EC2::VPCGatewayAttachment",
      "DeletionPolicy": "Delete",
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
      "DeletionPolicy": "Delete",
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
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "EnvironmentName"
            }
          },
          {
            "Key": "Project",
            "Value": {
              "Ref": "ProjectName"
            }
          },
          {
            "Key": "CostCenter",
            "Value": {
              "Ref": "CostCenter"
            }
          },
          {
            "Key": "Type",
            "Value": "Public"
          }
        ]
      }
    },
    "PublicSubnet2": {
      "Type": "AWS::EC2::Subnet",
      "DeletionPolicy": "Delete",
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
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "EnvironmentName"
            }
          },
          {
            "Key": "Project",
            "Value": {
              "Ref": "ProjectName"
            }
          },
          {
            "Key": "CostCenter",
            "Value": {
              "Ref": "CostCenter"
            }
          },
          {
            "Key": "Type",
            "Value": "Public"
          }
        ]
      }
    },
    "PublicSubnet3": {
      "Type": "AWS::EC2::Subnet",
      "DeletionPolicy": "Delete",
      "Properties": {
        "VpcId": {
          "Ref": "VPC"
        },
        "CidrBlock": "10.0.3.0/24",
        "AvailabilityZone": {
          "Fn::Select": [
            2,
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
              "Fn::Sub": "public-subnet-3-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "EnvironmentName"
            }
          },
          {
            "Key": "Project",
            "Value": {
              "Ref": "ProjectName"
            }
          },
          {
            "Key": "CostCenter",
            "Value": {
              "Ref": "CostCenter"
            }
          },
          {
            "Key": "Type",
            "Value": "Public"
          }
        ]
      }
    },
    "PrivateSubnet1": {
      "Type": "AWS::EC2::Subnet",
      "DeletionPolicy": "Delete",
      "Properties": {
        "VpcId": {
          "Ref": "VPC"
        },
        "CidrBlock": "10.0.11.0/24",
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
              "Fn::Sub": "private-subnet-1-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "EnvironmentName"
            }
          },
          {
            "Key": "Project",
            "Value": {
              "Ref": "ProjectName"
            }
          },
          {
            "Key": "CostCenter",
            "Value": {
              "Ref": "CostCenter"
            }
          },
          {
            "Key": "Type",
            "Value": "Private"
          }
        ]
      }
    },
    "PrivateSubnet2": {
      "Type": "AWS::EC2::Subnet",
      "DeletionPolicy": "Delete",
      "Properties": {
        "VpcId": {
          "Ref": "VPC"
        },
        "CidrBlock": "10.0.12.0/24",
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
              "Fn::Sub": "private-subnet-2-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "EnvironmentName"
            }
          },
          {
            "Key": "Project",
            "Value": {
              "Ref": "ProjectName"
            }
          },
          {
            "Key": "CostCenter",
            "Value": {
              "Ref": "CostCenter"
            }
          },
          {
            "Key": "Type",
            "Value": "Private"
          }
        ]
      }
    },
    "PrivateSubnet3": {
      "Type": "AWS::EC2::Subnet",
      "DeletionPolicy": "Delete",
      "Properties": {
        "VpcId": {
          "Ref": "VPC"
        },
        "CidrBlock": "10.0.13.0/24",
        "AvailabilityZone": {
          "Fn::Select": [
            2,
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
              "Fn::Sub": "private-subnet-3-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "EnvironmentName"
            }
          },
          {
            "Key": "Project",
            "Value": {
              "Ref": "ProjectName"
            }
          },
          {
            "Key": "CostCenter",
            "Value": {
              "Ref": "CostCenter"
            }
          },
          {
            "Key": "Type",
            "Value": "Private"
          }
        ]
      }
    },
    "PublicRouteTable": {
      "Type": "AWS::EC2::RouteTable",
      "DeletionPolicy": "Delete",
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
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "EnvironmentName"
            }
          },
          {
            "Key": "Project",
            "Value": {
              "Ref": "ProjectName"
            }
          },
          {
            "Key": "CostCenter",
            "Value": {
              "Ref": "CostCenter"
            }
          }
        ]
      }
    },
    "PublicRoute": {
      "Type": "AWS::EC2::Route",
      "DeletionPolicy": "Delete",
      "DependsOn": "VPCGatewayAttachment",
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
      "DeletionPolicy": "Delete",
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
      "DeletionPolicy": "Delete",
      "Properties": {
        "SubnetId": {
          "Ref": "PublicSubnet2"
        },
        "RouteTableId": {
          "Ref": "PublicRouteTable"
        }
      }
    },
    "PublicSubnet3RouteTableAssociation": {
      "Type": "AWS::EC2::SubnetRouteTableAssociation",
      "DeletionPolicy": "Delete",
      "Properties": {
        "SubnetId": {
          "Ref": "PublicSubnet3"
        },
        "RouteTableId": {
          "Ref": "PublicRouteTable"
        }
      }
    },
    "NATInstanceSecurityGroup": {
      "Type": "AWS::EC2::SecurityGroup",
      "DeletionPolicy": "Delete",
      "Properties": {
        "GroupName": {
          "Fn::Sub": "nat-sg-${EnvironmentSuffix}"
        },
        "GroupDescription": "Security group for NAT instances allowing HTTP/HTTPS from private subnets",
        "VpcId": {
          "Ref": "VPC"
        },
        "SecurityGroupIngress": [
          {
            "IpProtocol": "tcp",
            "FromPort": 80,
            "ToPort": 80,
            "CidrIp": "10.0.11.0/24",
            "Description": "Allow HTTP from private subnet 1"
          },
          {
            "IpProtocol": "tcp",
            "FromPort": 80,
            "ToPort": 80,
            "CidrIp": "10.0.12.0/24",
            "Description": "Allow HTTP from private subnet 2"
          },
          {
            "IpProtocol": "tcp",
            "FromPort": 80,
            "ToPort": 80,
            "CidrIp": "10.0.13.0/24",
            "Description": "Allow HTTP from private subnet 3"
          },
          {
            "IpProtocol": "tcp",
            "FromPort": 443,
            "ToPort": 443,
            "CidrIp": "10.0.11.0/24",
            "Description": "Allow HTTPS from private subnet 1"
          },
          {
            "IpProtocol": "tcp",
            "FromPort": 443,
            "ToPort": 443,
            "CidrIp": "10.0.12.0/24",
            "Description": "Allow HTTPS from private subnet 2"
          },
          {
            "IpProtocol": "tcp",
            "FromPort": 443,
            "ToPort": 443,
            "CidrIp": "10.0.13.0/24",
            "Description": "Allow HTTPS from private subnet 3"
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
              "Fn::Sub": "nat-sg-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "EnvironmentName"
            }
          },
          {
            "Key": "Project",
            "Value": {
              "Ref": "ProjectName"
            }
          },
          {
            "Key": "CostCenter",
            "Value": {
              "Ref": "CostCenter"
            }
          }
        ]
      }
    },
    "NATInstanceRole": {
      "Type": "AWS::IAM::Role",
      "DeletionPolicy": "Delete",
      "Properties": {
        "RoleName": {
          "Fn::Sub": "nat-instance-role-${EnvironmentSuffix}"
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
          "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
        ],
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "nat-instance-role-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "EnvironmentName"
            }
          },
          {
            "Key": "Project",
            "Value": {
              "Ref": "ProjectName"
            }
          },
          {
            "Key": "CostCenter",
            "Value": {
              "Ref": "CostCenter"
            }
          }
        ]
      }
    },
    "NATInstanceProfile": {
      "Type": "AWS::IAM::InstanceProfile",
      "DeletionPolicy": "Delete",
      "Properties": {
        "InstanceProfileName": {
          "Fn::Sub": "nat-instance-profile-${EnvironmentSuffix}"
        },
        "Roles": [
          {
            "Ref": "NATInstanceRole"
          }
        ]
      }
    },
    "NATInstance1": {
      "Type": "AWS::EC2::Instance",
      "DeletionPolicy": "Delete",
      "DependsOn": "VPCGatewayAttachment",
      "Properties": {
        "InstanceType": "t3.micro",
        "ImageId": {
          "Fn::FindInMap": [
            "AmazonLinux2AMI",
            {
              "Ref": "AWS::Region"
            },
            "AMI"
          ]
        },
        "SubnetId": {
          "Ref": "PublicSubnet1"
        },
        "SecurityGroupIds": [
          {
            "Ref": "NATInstanceSecurityGroup"
          }
        ],
        "IamInstanceProfile": {
          "Ref": "NATInstanceProfile"
        },
        "SourceDestCheck": false,
        "UserData": {
          "Fn::Base64": {
            "Fn::Sub": "#!/bin/bash\nyum update -y\nyum install -y iptables-services\nsystemctl enable iptables\nsystemctl start iptables\necho 'net.ipv4.ip_forward = 1' >> /etc/sysctl.conf\nsysctl -p\niptables -t nat -A POSTROUTING -o eth0 -j MASQUERADE\niptables -A FORWARD -i eth0 -o eth0 -m state --state RELATED,ESTABLISHED -j ACCEPT\niptables -A FORWARD -i eth0 -o eth0 -j ACCEPT\nservice iptables save\n"
          }
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "nat-instance-1-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "EnvironmentName"
            }
          },
          {
            "Key": "Project",
            "Value": {
              "Ref": "ProjectName"
            }
          },
          {
            "Key": "CostCenter",
            "Value": {
              "Ref": "CostCenter"
            }
          }
        ]
      }
    },
    "NATInstance2": {
      "Type": "AWS::EC2::Instance",
      "DeletionPolicy": "Delete",
      "DependsOn": "VPCGatewayAttachment",
      "Properties": {
        "InstanceType": "t3.micro",
        "ImageId": {
          "Fn::FindInMap": [
            "AmazonLinux2AMI",
            {
              "Ref": "AWS::Region"
            },
            "AMI"
          ]
        },
        "SubnetId": {
          "Ref": "PublicSubnet2"
        },
        "SecurityGroupIds": [
          {
            "Ref": "NATInstanceSecurityGroup"
          }
        ],
        "IamInstanceProfile": {
          "Ref": "NATInstanceProfile"
        },
        "SourceDestCheck": false,
        "UserData": {
          "Fn::Base64": {
            "Fn::Sub": "#!/bin/bash\nyum update -y\nyum install -y iptables-services\nsystemctl enable iptables\nsystemctl start iptables\necho 'net.ipv4.ip_forward = 1' >> /etc/sysctl.conf\nsysctl -p\niptables -t nat -A POSTROUTING -o eth0 -j MASQUERADE\niptables -A FORWARD -i eth0 -o eth0 -m state --state RELATED,ESTABLISHED -j ACCEPT\niptables -A FORWARD -i eth0 -o eth0 -j ACCEPT\nservice iptables save\n"
          }
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "nat-instance-2-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "EnvironmentName"
            }
          },
          {
            "Key": "Project",
            "Value": {
              "Ref": "ProjectName"
            }
          },
          {
            "Key": "CostCenter",
            "Value": {
              "Ref": "CostCenter"
            }
          }
        ]
      }
    },
    "NATInstance3": {
      "Type": "AWS::EC2::Instance",
      "DeletionPolicy": "Delete",
      "DependsOn": "VPCGatewayAttachment",
      "Properties": {
        "InstanceType": "t3.micro",
        "ImageId": {
          "Fn::FindInMap": [
            "AmazonLinux2AMI",
            {
              "Ref": "AWS::Region"
            },
            "AMI"
          ]
        },
        "SubnetId": {
          "Ref": "PublicSubnet3"
        },
        "SecurityGroupIds": [
          {
            "Ref": "NATInstanceSecurityGroup"
          }
        ],
        "IamInstanceProfile": {
          "Ref": "NATInstanceProfile"
        },
        "SourceDestCheck": false,
        "UserData": {
          "Fn::Base64": {
            "Fn::Sub": "#!/bin/bash\nyum update -y\nyum install -y iptables-services\nsystemctl enable iptables\nsystemctl start iptables\necho 'net.ipv4.ip_forward = 1' >> /etc/sysctl.conf\nsysctl -p\niptables -t nat -A POSTROUTING -o eth0 -j MASQUERADE\niptables -A FORWARD -i eth0 -o eth0 -m state --state RELATED,ESTABLISHED -j ACCEPT\niptables -A FORWARD -i eth0 -o eth0 -j ACCEPT\nservice iptables save\n"
          }
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "nat-instance-3-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "EnvironmentName"
            }
          },
          {
            "Key": "Project",
            "Value": {
              "Ref": "ProjectName"
            }
          },
          {
            "Key": "CostCenter",
            "Value": {
              "Ref": "CostCenter"
            }
          }
        ]
      }
    },
    "PrivateRouteTable1": {
      "Type": "AWS::EC2::RouteTable",
      "DeletionPolicy": "Delete",
      "Properties": {
        "VpcId": {
          "Ref": "VPC"
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "private-rt-1-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "EnvironmentName"
            }
          },
          {
            "Key": "Project",
            "Value": {
              "Ref": "ProjectName"
            }
          },
          {
            "Key": "CostCenter",
            "Value": {
              "Ref": "CostCenter"
            }
          }
        ]
      }
    },
    "PrivateRoute1": {
      "Type": "AWS::EC2::Route",
      "DeletionPolicy": "Delete",
      "Properties": {
        "RouteTableId": {
          "Ref": "PrivateRouteTable1"
        },
        "DestinationCidrBlock": "0.0.0.0/0",
        "InstanceId": {
          "Ref": "NATInstance1"
        }
      }
    },
    "PrivateSubnet1RouteTableAssociation": {
      "Type": "AWS::EC2::SubnetRouteTableAssociation",
      "DeletionPolicy": "Delete",
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
      "DeletionPolicy": "Delete",
      "Properties": {
        "VpcId": {
          "Ref": "VPC"
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "private-rt-2-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "EnvironmentName"
            }
          },
          {
            "Key": "Project",
            "Value": {
              "Ref": "ProjectName"
            }
          },
          {
            "Key": "CostCenter",
            "Value": {
              "Ref": "CostCenter"
            }
          }
        ]
      }
    },
    "PrivateRoute2": {
      "Type": "AWS::EC2::Route",
      "DeletionPolicy": "Delete",
      "Properties": {
        "RouteTableId": {
          "Ref": "PrivateRouteTable2"
        },
        "DestinationCidrBlock": "0.0.0.0/0",
        "InstanceId": {
          "Ref": "NATInstance2"
        }
      }
    },
    "PrivateSubnet2RouteTableAssociation": {
      "Type": "AWS::EC2::SubnetRouteTableAssociation",
      "DeletionPolicy": "Delete",
      "Properties": {
        "SubnetId": {
          "Ref": "PrivateSubnet2"
        },
        "RouteTableId": {
          "Ref": "PrivateRouteTable2"
        }
      }
    },
    "PrivateRouteTable3": {
      "Type": "AWS::EC2::RouteTable",
      "DeletionPolicy": "Delete",
      "Properties": {
        "VpcId": {
          "Ref": "VPC"
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "private-rt-3-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "EnvironmentName"
            }
          },
          {
            "Key": "Project",
            "Value": {
              "Ref": "ProjectName"
            }
          },
          {
            "Key": "CostCenter",
            "Value": {
              "Ref": "CostCenter"
            }
          }
        ]
      }
    },
    "PrivateRoute3": {
      "Type": "AWS::EC2::Route",
      "DeletionPolicy": "Delete",
      "Properties": {
        "RouteTableId": {
          "Ref": "PrivateRouteTable3"
        },
        "DestinationCidrBlock": "0.0.0.0/0",
        "InstanceId": {
          "Ref": "NATInstance3"
        }
      }
    },
    "PrivateSubnet3RouteTableAssociation": {
      "Type": "AWS::EC2::SubnetRouteTableAssociation",
      "DeletionPolicy": "Delete",
      "Properties": {
        "SubnetId": {
          "Ref": "PrivateSubnet3"
        },
        "RouteTableId": {
          "Ref": "PrivateRouteTable3"
        }
      }
    },
    "FlowLogsBucket": {
      "Type": "AWS::S3::Bucket",
      "DeletionPolicy": "Delete",
      "Properties": {
        "BucketName": {
          "Fn::Sub": "vpc-flow-logs-${AWS::AccountId}-${EnvironmentSuffix}"
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
        "LifecycleConfiguration": {
          "Rules": [
            {
              "Id": "DeleteOldLogs",
              "Status": "Enabled",
              "ExpirationInDays": 90
            }
          ]
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "vpc-flow-logs-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "EnvironmentName"
            }
          },
          {
            "Key": "Project",
            "Value": {
              "Ref": "ProjectName"
            }
          },
          {
            "Key": "CostCenter",
            "Value": {
              "Ref": "CostCenter"
            }
          }
        ]
      }
    },
    "FlowLogsBucketPolicy": {
      "Type": "AWS::S3::BucketPolicy",
      "DeletionPolicy": "Delete",
      "Properties": {
        "Bucket": {
          "Ref": "FlowLogsBucket"
        },
        "PolicyDocument": {
          "Version": "2012-10-17",
          "Statement": [
            {
              "Sid": "AWSLogDeliveryWrite",
              "Effect": "Allow",
              "Principal": {
                "Service": "delivery.logs.amazonaws.com"
              },
              "Action": "s3:PutObject",
              "Resource": {
                "Fn::Sub": "${FlowLogsBucket.Arn}/*"
              },
              "Condition": {
                "StringEquals": {
                  "s3:x-amz-acl": "bucket-owner-full-control"
                }
              }
            },
            {
              "Sid": "AWSLogDeliveryAclCheck",
              "Effect": "Allow",
              "Principal": {
                "Service": "delivery.logs.amazonaws.com"
              },
              "Action": "s3:GetBucketAcl",
              "Resource": {
                "Fn::GetAtt": [
                  "FlowLogsBucket",
                  "Arn"
                ]
              }
            }
          ]
        }
      }
    },
    "VPCFlowLog": {
      "Type": "AWS::EC2::FlowLog",
      "DeletionPolicy": "Delete",
      "DependsOn": "FlowLogsBucketPolicy",
      "Properties": {
        "ResourceType": "VPC",
        "ResourceId": {
          "Ref": "VPC"
        },
        "TrafficType": "ALL",
        "LogDestinationType": "s3",
        "LogDestination": {
          "Fn::GetAtt": [
            "FlowLogsBucket",
            "Arn"
          ]
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "vpc-flow-log-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": {
              "Ref": "EnvironmentName"
            }
          },
          {
            "Key": "Project",
            "Value": {
              "Ref": "ProjectName"
            }
          },
          {
            "Key": "CostCenter",
            "Value": {
              "Ref": "CostCenter"
            }
          }
        ]
      }
    },
    "NATInstanceAlarm1": {
      "Type": "AWS::CloudWatch::Alarm",
      "DeletionPolicy": "Delete",
      "Properties": {
        "AlarmName": {
          "Fn::Sub": "nat-instance-1-status-${EnvironmentSuffix}"
        },
        "AlarmDescription": "Alert when NAT instance 1 status check fails",
        "MetricName": "StatusCheckFailed",
        "Namespace": "AWS/EC2",
        "Statistic": "Maximum",
        "Period": 60,
        "EvaluationPeriods": 2,
        "Threshold": 1,
        "ComparisonOperator": "GreaterThanOrEqualToThreshold",
        "Dimensions": [
          {
            "Name": "InstanceId",
            "Value": {
              "Ref": "NATInstance1"
            }
          }
        ]
      }
    },
    "NATInstanceAlarm2": {
      "Type": "AWS::CloudWatch::Alarm",
      "DeletionPolicy": "Delete",
      "Properties": {
        "AlarmName": {
          "Fn::Sub": "nat-instance-2-status-${EnvironmentSuffix}"
        },
        "AlarmDescription": "Alert when NAT instance 2 status check fails",
        "MetricName": "StatusCheckFailed",
        "Namespace": "AWS/EC2",
        "Statistic": "Maximum",
        "Period": 60,
        "EvaluationPeriods": 2,
        "Threshold": 1,
        "ComparisonOperator": "GreaterThanOrEqualToThreshold",
        "Dimensions": [
          {
            "Name": "InstanceId",
            "Value": {
              "Ref": "NATInstance2"
            }
          }
        ]
      }
    },
    "NATInstanceAlarm3": {
      "Type": "AWS::CloudWatch::Alarm",
      "DeletionPolicy": "Delete",
      "Properties": {
        "AlarmName": {
          "Fn::Sub": "nat-instance-3-status-${EnvironmentSuffix}"
        },
        "AlarmDescription": "Alert when NAT instance 3 status check fails",
        "MetricName": "StatusCheckFailed",
        "Namespace": "AWS/EC2",
        "Statistic": "Maximum",
        "Period": 60,
        "EvaluationPeriods": 2,
        "Threshold": 1,
        "ComparisonOperator": "GreaterThanOrEqualToThreshold",
        "Dimensions": [
          {
            "Name": "InstanceId",
            "Value": {
              "Ref": "NATInstance3"
            }
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
          "Fn::Sub": "${AWS::StackName}-PublicSubnet1"
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
          "Fn::Sub": "${AWS::StackName}-PublicSubnet2"
        }
      }
    },
    "PublicSubnet3Id": {
      "Description": "Public Subnet 3 ID",
      "Value": {
        "Ref": "PublicSubnet3"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-PublicSubnet3"
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
          "Fn::Sub": "${AWS::StackName}-PrivateSubnet1"
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
          "Fn::Sub": "${AWS::StackName}-PublicSubnet2"
        }
      }
    },
    "PrivateSubnet3Id": {
      "Description": "Private Subnet 3 ID",
      "Value": {
        "Ref": "PrivateSubnet3"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-PrivateSubnet3"
        }
      }
    },
    "NATInstance1Id": {
      "Description": "NAT Instance 1 ID",
      "Value": {
        "Ref": "NATInstance1"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-NATInstance1"
        }
      }
    },
    "NATInstance2Id": {
      "Description": "NAT Instance 2 ID",
      "Value": {
        "Ref": "NATInstance2"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-NATInstance2"
        }
      }
    },
    "NATInstance3Id": {
      "Description": "NAT Instance 3 ID",
      "Value": {
        "Ref": "NATInstance3"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-NATInstance3"
        }
      }
    },
    "NATSecurityGroupId": {
      "Description": "NAT Instance Security Group ID",
      "Value": {
        "Ref": "NATInstanceSecurityGroup"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-NATSecurityGroup"
        }
      }
    },
    "FlowLogsBucketName": {
      "Description": "VPC Flow Logs S3 Bucket Name",
      "Value": {
        "Ref": "FlowLogsBucket"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-FlowLogsBucket"
        }
      }
    }
  }
}
```

## File: lib/README.md

```markdown
# VPC Infrastructure for Digital Banking Platform

This CloudFormation template creates a production-ready VPC infrastructure for a financial services digital banking platform with multi-AZ support, NAT instances, and comprehensive security controls.

## Architecture Overview

The infrastructure creates:
- VPC with CIDR block 10.0.0.0/16
- 3 public subnets across 3 availability zones
- 3 private subnets across 3 availability zones
- Internet Gateway for public internet access
- 3 NAT instances (t3.micro) for private subnet internet access
- Security groups with strict access controls
- VPC Flow Logs to S3 for security monitoring
- CloudWatch alarms for NAT instance health monitoring
- Systems Manager Session Manager support for secure access

## Prerequisites

- AWS CLI configured with appropriate credentials
- Permissions for VPC, EC2, S3, IAM, CloudWatch, and CloudFormation services
- Target region: us-east-1 (or update AMI mappings for other regions)

## Deployment

### Deploy the Stack

```bash
aws cloudformation create-stack \
  --stack-name banking-platform-vpc \
  --template-body file://vpc-infrastructure.json \
  --parameters \
    ParameterKey=EnvironmentName,ParameterValue=production \
    ParameterKey=CostCenter,ParameterValue=digital-banking \
    ParameterKey=EnvironmentSuffix,ParameterValue=prod-01 \
    ParameterKey=ProjectName,ParameterValue=banking-platform \
  --capabilities CAPABILITY_NAMED_IAM \
  --region us-east-1
```

### Monitor Deployment

```bash
aws cloudformation describe-stacks \
  --stack-name banking-platform-vpc \
  --region us-east-1 \
  --query 'Stacks[0].StackStatus'
```

### Get Stack Outputs

```bash
aws cloudformation describe-stacks \
  --stack-name banking-platform-vpc \
  --region us-east-1 \
  --query 'Stacks[0].Outputs'
```

## Parameters

- **EnvironmentName**: Environment name (development, staging, production)
- **CostCenter**: Cost center for billing (digital-banking, core-banking, platform-services)
- **EnvironmentSuffix**: Unique suffix for resource naming (default: prod-01)
- **ProjectName**: Project name for tagging (default: banking-platform)

## Outputs

- **VPCId**: VPC identifier
- **PublicSubnet1Id, PublicSubnet2Id, PublicSubnet3Id**: Public subnet IDs
- **PrivateSubnet1Id, PrivateSubnet2Id, PrivateSubnet3Id**: Private subnet IDs
- **NATInstance1Id, NATInstance2Id, NATInstance3Id**: NAT instance IDs
- **NATSecurityGroupId**: Security group ID for NAT instances
- **FlowLogsBucketName**: S3 bucket name for VPC flow logs

## Resource Naming

All resources include the EnvironmentSuffix parameter for uniqueness:
- VPC: `vpc-{EnvironmentSuffix}`
- Public Subnets: `public-subnet-{1-3}-{EnvironmentSuffix}`
- Private Subnets: `private-subnet-{1-3}-{EnvironmentSuffix}`
- NAT Instances: `nat-instance-{1-3}-{EnvironmentSuffix}`
- Security Group: `nat-sg-{EnvironmentSuffix}`

## Security Features

1. **Network Isolation**: Separate public and private subnets with controlled routing
2. **Security Groups**: NAT instances only allow HTTP/HTTPS from private subnets
3. **VPC Flow Logs**: All network traffic logged to encrypted S3 bucket
4. **Session Manager**: Secure access to NAT instances without SSH keys
5. **CloudWatch Alarms**: Health monitoring for NAT instances
6. **Encryption**: S3 bucket encryption enabled for flow logs

## Cost Optimization

- Uses t3.micro instances for NAT (instead of NAT Gateway)
- VPC Flow Logs with 90-day retention policy
- No unnecessary resources or reserved capacity

## Cleanup

```bash
# Empty the flow logs bucket first
aws s3 rm s3://vpc-flow-logs-{ACCOUNT_ID}-{EnvironmentSuffix} --recursive

# Delete the stack
aws cloudformation delete-stack \
  --stack-name banking-platform-vpc \
  --region us-east-1

# Monitor deletion
aws cloudformation wait stack-delete-complete \
  --stack-name banking-platform-vpc \
  --region us-east-1
```

## Testing

Run the integration tests:

```bash
npm test
```

## Compliance

All resources include required tags:
- Environment
- Project
- CostCenter

All resources have DeletionPolicy set to Delete for clean stack removal.
```
