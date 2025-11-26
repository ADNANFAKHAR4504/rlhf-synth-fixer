# Production-Ready Amazon EKS Cluster - CloudFormation JSON Implementation

This implementation creates a complete production-ready EKS cluster with VPC networking, managed node groups, IAM roles, OIDC provider, and comprehensive logging.

## File: lib/TapStack.json

```json
{
  "AWSTemplateFormatVersion": "2010-09-09",
  "Description": "Production-Ready Amazon EKS Cluster with Managed Node Groups",
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
            "PublicSubnet3CIDR",
            "PrivateSubnet1CIDR",
            "PrivateSubnet2CIDR",
            "PrivateSubnet3CIDR"
          ]
        },
        {
          "Label": {
            "default": "EKS Configuration"
          },
          "Parameters": [
            "KubernetesVersion",
            "NodeInstanceType",
            "NodeGroupMinSize",
            "NodeGroupMaxSize",
            "NodeGroupDesiredSize"
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
      "Description": "CIDR block for VPC"
    },
    "PublicSubnet1CIDR": {
      "Type": "String",
      "Default": "10.0.1.0/24",
      "Description": "CIDR block for public subnet 1"
    },
    "PublicSubnet2CIDR": {
      "Type": "String",
      "Default": "10.0.2.0/24",
      "Description": "CIDR block for public subnet 2"
    },
    "PublicSubnet3CIDR": {
      "Type": "String",
      "Default": "10.0.3.0/24",
      "Description": "CIDR block for public subnet 3"
    },
    "PrivateSubnet1CIDR": {
      "Type": "String",
      "Default": "10.0.11.0/24",
      "Description": "CIDR block for private subnet 1"
    },
    "PrivateSubnet2CIDR": {
      "Type": "String",
      "Default": "10.0.12.0/24",
      "Description": "CIDR block for private subnet 2"
    },
    "PrivateSubnet3CIDR": {
      "Type": "String",
      "Default": "10.0.13.0/24",
      "Description": "CIDR block for private subnet 3"
    },
    "KubernetesVersion": {
      "Type": "String",
      "Default": "1.28",
      "Description": "Kubernetes version for EKS cluster"
    },
    "NodeInstanceType": {
      "Type": "String",
      "Default": "m5.large",
      "Description": "EC2 instance type for node group"
    },
    "NodeGroupMinSize": {
      "Type": "Number",
      "Default": 2,
      "Description": "Minimum number of nodes in node group"
    },
    "NodeGroupMaxSize": {
      "Type": "Number",
      "Default": 10,
      "Description": "Maximum number of nodes in node group"
    },
    "NodeGroupDesiredSize": {
      "Type": "Number",
      "Default": 3,
      "Description": "Desired number of nodes in node group"
    }
  },
  "Resources": {
    "VPC": {
      "Type": "AWS::EC2::VPC",
      "DeletionPolicy": "Delete",
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
              "Fn::Sub": "eks-vpc-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": "Production"
          },
          {
            "Key": "ManagedBy",
            "Value": "CloudFormation"
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
              "Fn::Sub": "eks-igw-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": "Production"
          },
          {
            "Key": "ManagedBy",
            "Value": "CloudFormation"
          }
        ]
      }
    },
    "InternetGatewayAttachment": {
      "Type": "AWS::EC2::VPCGatewayAttachment",
      "DeletionPolicy": "Delete",
      "Properties": {
        "InternetGatewayId": {
          "Ref": "InternetGateway"
        },
        "VpcId": {
          "Ref": "VPC"
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
        "AvailabilityZone": "us-east-1a",
        "CidrBlock": {
          "Ref": "PublicSubnet1CIDR"
        },
        "MapPublicIpOnLaunch": true,
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "eks-public-subnet-1a-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "kubernetes.io/role/elb",
            "Value": "1"
          },
          {
            "Key": "Environment",
            "Value": "Production"
          },
          {
            "Key": "ManagedBy",
            "Value": "CloudFormation"
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
        "AvailabilityZone": "us-east-1b",
        "CidrBlock": {
          "Ref": "PublicSubnet2CIDR"
        },
        "MapPublicIpOnLaunch": true,
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "eks-public-subnet-1b-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "kubernetes.io/role/elb",
            "Value": "1"
          },
          {
            "Key": "Environment",
            "Value": "Production"
          },
          {
            "Key": "ManagedBy",
            "Value": "CloudFormation"
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
        "AvailabilityZone": "us-east-1c",
        "CidrBlock": {
          "Ref": "PublicSubnet3CIDR"
        },
        "MapPublicIpOnLaunch": true,
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "eks-public-subnet-1c-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "kubernetes.io/role/elb",
            "Value": "1"
          },
          {
            "Key": "Environment",
            "Value": "Production"
          },
          {
            "Key": "ManagedBy",
            "Value": "CloudFormation"
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
        "AvailabilityZone": "us-east-1a",
        "CidrBlock": {
          "Ref": "PrivateSubnet1CIDR"
        },
        "MapPublicIpOnLaunch": false,
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "eks-private-subnet-1a-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "kubernetes.io/role/internal-elb",
            "Value": "1"
          },
          {
            "Key": "Environment",
            "Value": "Production"
          },
          {
            "Key": "ManagedBy",
            "Value": "CloudFormation"
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
        "AvailabilityZone": "us-east-1b",
        "CidrBlock": {
          "Ref": "PrivateSubnet2CIDR"
        },
        "MapPublicIpOnLaunch": false,
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "eks-private-subnet-1b-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "kubernetes.io/role/internal-elb",
            "Value": "1"
          },
          {
            "Key": "Environment",
            "Value": "Production"
          },
          {
            "Key": "ManagedBy",
            "Value": "CloudFormation"
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
        "AvailabilityZone": "us-east-1c",
        "CidrBlock": {
          "Ref": "PrivateSubnet3CIDR"
        },
        "MapPublicIpOnLaunch": false,
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "eks-private-subnet-1c-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "kubernetes.io/role/internal-elb",
            "Value": "1"
          },
          {
            "Key": "Environment",
            "Value": "Production"
          },
          {
            "Key": "ManagedBy",
            "Value": "CloudFormation"
          }
        ]
      }
    },
    "EIPNatGateway1": {
      "Type": "AWS::EC2::EIP",
      "DeletionPolicy": "Delete",
      "DependsOn": "InternetGatewayAttachment",
      "Properties": {
        "Domain": "vpc",
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "eks-eip-nat-1a-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": "Production"
          },
          {
            "Key": "ManagedBy",
            "Value": "CloudFormation"
          }
        ]
      }
    },
    "EIPNatGateway2": {
      "Type": "AWS::EC2::EIP",
      "DeletionPolicy": "Delete",
      "DependsOn": "InternetGatewayAttachment",
      "Properties": {
        "Domain": "vpc",
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "eks-eip-nat-1b-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": "Production"
          },
          {
            "Key": "ManagedBy",
            "Value": "CloudFormation"
          }
        ]
      }
    },
    "EIPNatGateway3": {
      "Type": "AWS::EC2::EIP",
      "DeletionPolicy": "Delete",
      "DependsOn": "InternetGatewayAttachment",
      "Properties": {
        "Domain": "vpc",
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "eks-eip-nat-1c-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": "Production"
          },
          {
            "Key": "ManagedBy",
            "Value": "CloudFormation"
          }
        ]
      }
    },
    "NatGateway1": {
      "Type": "AWS::EC2::NatGateway",
      "DeletionPolicy": "Delete",
      "Properties": {
        "AllocationId": {
          "Fn::GetAtt": [
            "EIPNatGateway1",
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
              "Fn::Sub": "eks-nat-1a-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": "Production"
          },
          {
            "Key": "ManagedBy",
            "Value": "CloudFormation"
          }
        ]
      }
    },
    "NatGateway2": {
      "Type": "AWS::EC2::NatGateway",
      "DeletionPolicy": "Delete",
      "Properties": {
        "AllocationId": {
          "Fn::GetAtt": [
            "EIPNatGateway2",
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
              "Fn::Sub": "eks-nat-1b-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": "Production"
          },
          {
            "Key": "ManagedBy",
            "Value": "CloudFormation"
          }
        ]
      }
    },
    "NatGateway3": {
      "Type": "AWS::EC2::NatGateway",
      "DeletionPolicy": "Delete",
      "Properties": {
        "AllocationId": {
          "Fn::GetAtt": [
            "EIPNatGateway3",
            "AllocationId"
          ]
        },
        "SubnetId": {
          "Ref": "PublicSubnet3"
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "eks-nat-1c-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": "Production"
          },
          {
            "Key": "ManagedBy",
            "Value": "CloudFormation"
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
              "Fn::Sub": "eks-public-rt-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": "Production"
          },
          {
            "Key": "ManagedBy",
            "Value": "CloudFormation"
          }
        ]
      }
    },
    "DefaultPublicRoute": {
      "Type": "AWS::EC2::Route",
      "DeletionPolicy": "Delete",
      "DependsOn": "InternetGatewayAttachment",
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
        "RouteTableId": {
          "Ref": "PublicRouteTable"
        },
        "SubnetId": {
          "Ref": "PublicSubnet1"
        }
      }
    },
    "PublicSubnet2RouteTableAssociation": {
      "Type": "AWS::EC2::SubnetRouteTableAssociation",
      "DeletionPolicy": "Delete",
      "Properties": {
        "RouteTableId": {
          "Ref": "PublicRouteTable"
        },
        "SubnetId": {
          "Ref": "PublicSubnet2"
        }
      }
    },
    "PublicSubnet3RouteTableAssociation": {
      "Type": "AWS::EC2::SubnetRouteTableAssociation",
      "DeletionPolicy": "Delete",
      "Properties": {
        "RouteTableId": {
          "Ref": "PublicRouteTable"
        },
        "SubnetId": {
          "Ref": "PublicSubnet3"
        }
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
              "Fn::Sub": "eks-private-rt-1a-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": "Production"
          },
          {
            "Key": "ManagedBy",
            "Value": "CloudFormation"
          }
        ]
      }
    },
    "DefaultPrivateRoute1": {
      "Type": "AWS::EC2::Route",
      "DeletionPolicy": "Delete",
      "Properties": {
        "RouteTableId": {
          "Ref": "PrivateRouteTable1"
        },
        "DestinationCidrBlock": "0.0.0.0/0",
        "NatGatewayId": {
          "Ref": "NatGateway1"
        }
      }
    },
    "PrivateSubnet1RouteTableAssociation": {
      "Type": "AWS::EC2::SubnetRouteTableAssociation",
      "DeletionPolicy": "Delete",
      "Properties": {
        "RouteTableId": {
          "Ref": "PrivateRouteTable1"
        },
        "SubnetId": {
          "Ref": "PrivateSubnet1"
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
              "Fn::Sub": "eks-private-rt-1b-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": "Production"
          },
          {
            "Key": "ManagedBy",
            "Value": "CloudFormation"
          }
        ]
      }
    },
    "DefaultPrivateRoute2": {
      "Type": "AWS::EC2::Route",
      "DeletionPolicy": "Delete",
      "Properties": {
        "RouteTableId": {
          "Ref": "PrivateRouteTable2"
        },
        "DestinationCidrBlock": "0.0.0.0/0",
        "NatGatewayId": {
          "Ref": "NatGateway2"
        }
      }
    },
    "PrivateSubnet2RouteTableAssociation": {
      "Type": "AWS::EC2::SubnetRouteTableAssociation",
      "DeletionPolicy": "Delete",
      "Properties": {
        "RouteTableId": {
          "Ref": "PrivateRouteTable2"
        },
        "SubnetId": {
          "Ref": "PrivateSubnet2"
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
              "Fn::Sub": "eks-private-rt-1c-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": "Production"
          },
          {
            "Key": "ManagedBy",
            "Value": "CloudFormation"
          }
        ]
      }
    },
    "DefaultPrivateRoute3": {
      "Type": "AWS::EC2::Route",
      "DeletionPolicy": "Delete",
      "Properties": {
        "RouteTableId": {
          "Ref": "PrivateRouteTable3"
        },
        "DestinationCidrBlock": "0.0.0.0/0",
        "NatGatewayId": {
          "Ref": "NatGateway3"
        }
      }
    },
    "PrivateSubnet3RouteTableAssociation": {
      "Type": "AWS::EC2::SubnetRouteTableAssociation",
      "DeletionPolicy": "Delete",
      "Properties": {
        "RouteTableId": {
          "Ref": "PrivateRouteTable3"
        },
        "SubnetId": {
          "Ref": "PrivateSubnet3"
        }
      }
    },
    "EKSClusterRole": {
      "Type": "AWS::IAM::Role",
      "DeletionPolicy": "Delete",
      "Properties": {
        "RoleName": {
          "Fn::Sub": "eks-cluster-role-${EnvironmentSuffix}"
        },
        "AssumeRolePolicyDocument": {
          "Version": "2012-10-17",
          "Statement": [
            {
              "Effect": "Allow",
              "Principal": {
                "Service": "eks.amazonaws.com"
              },
              "Action": "sts:AssumeRole"
            }
          ]
        },
        "ManagedPolicyArns": [
          "arn:aws:iam::aws:policy/AmazonEKSClusterPolicy",
          "arn:aws:iam::aws:policy/AmazonEKSVPCResourceController"
        ],
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "eks-cluster-role-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": "Production"
          },
          {
            "Key": "ManagedBy",
            "Value": "CloudFormation"
          }
        ]
      }
    },
    "EKSClusterSecurityGroup": {
      "Type": "AWS::EC2::SecurityGroup",
      "DeletionPolicy": "Delete",
      "Properties": {
        "GroupName": {
          "Fn::Sub": "eks-cluster-sg-${EnvironmentSuffix}"
        },
        "GroupDescription": "Security group for EKS cluster control plane",
        "VpcId": {
          "Ref": "VPC"
        },
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
              "Fn::Sub": "eks-cluster-sg-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": "Production"
          },
          {
            "Key": "ManagedBy",
            "Value": "CloudFormation"
          }
        ]
      }
    },
    "EKSCluster": {
      "Type": "AWS::EKS::Cluster",
      "DeletionPolicy": "Delete",
      "Properties": {
        "Name": {
          "Fn::Sub": "eks-cluster-${EnvironmentSuffix}"
        },
        "Version": {
          "Ref": "KubernetesVersion"
        },
        "RoleArn": {
          "Fn::GetAtt": [
            "EKSClusterRole",
            "Arn"
          ]
        },
        "ResourcesVpcConfig": {
          "SecurityGroupIds": [
            {
              "Ref": "EKSClusterSecurityGroup"
            }
          ],
          "SubnetIds": [
            {
              "Ref": "PrivateSubnet1"
            },
            {
              "Ref": "PrivateSubnet2"
            },
            {
              "Ref": "PrivateSubnet3"
            },
            {
              "Ref": "PublicSubnet1"
            },
            {
              "Ref": "PublicSubnet2"
            },
            {
              "Ref": "PublicSubnet3"
            }
          ],
          "EndpointPublicAccess": true,
          "EndpointPrivateAccess": true,
          "PublicAccessCidrs": [
            "0.0.0.0/0"
          ]
        },
        "Logging": {
          "ClusterLogging": {
            "EnabledTypes": [
              {
                "Type": "api"
              },
              {
                "Type": "audit"
              },
              {
                "Type": "authenticator"
              },
              {
                "Type": "controllerManager"
              },
              {
                "Type": "scheduler"
              }
            ]
          }
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "eks-cluster-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": "Production"
          },
          {
            "Key": "ManagedBy",
            "Value": "CloudFormation"
          }
        ]
      }
    },
    "OIDCProvider": {
      "Type": "AWS::IAM::OIDCProvider",
      "DeletionPolicy": "Delete",
      "Properties": {
        "Url": {
          "Fn::GetAtt": [
            "EKSCluster",
            "OpenIdConnectIssuerUrl"
          ]
        },
        "ClientIdList": [
          "sts.amazonaws.com"
        ],
        "ThumbprintList": [
          "9e99a48a9960b14926bb7f3b02e22da2b0ab7280"
        ],
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "eks-oidc-provider-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": "Production"
          },
          {
            "Key": "ManagedBy",
            "Value": "CloudFormation"
          }
        ]
      }
    },
    "NodeGroupRole": {
      "Type": "AWS::IAM::Role",
      "DeletionPolicy": "Delete",
      "Properties": {
        "RoleName": {
          "Fn::Sub": "eks-nodegroup-role-${EnvironmentSuffix}"
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
          "arn:aws:iam::aws:policy/AmazonEKSWorkerNodePolicy",
          "arn:aws:iam::aws:policy/AmazonEKS_CNI_Policy",
          "arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly",
          "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
        ],
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "eks-nodegroup-role-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": "Production"
          },
          {
            "Key": "ManagedBy",
            "Value": "CloudFormation"
          }
        ]
      }
    },
    "NodeLaunchTemplate": {
      "Type": "AWS::EC2::LaunchTemplate",
      "DeletionPolicy": "Delete",
      "Properties": {
        "LaunchTemplateName": {
          "Fn::Sub": "eks-node-lt-${EnvironmentSuffix}"
        },
        "LaunchTemplateData": {
          "MetadataOptions": {
            "HttpTokens": "required",
            "HttpPutResponseHopLimit": 1,
            "HttpEndpoint": "enabled"
          },
          "BlockDeviceMappings": [
            {
              "DeviceName": "/dev/xvda",
              "Ebs": {
                "VolumeSize": 20,
                "VolumeType": "gp3",
                "DeleteOnTermination": true,
                "Encrypted": true
              }
            }
          ],
          "TagSpecifications": [
            {
              "ResourceType": "instance",
              "Tags": [
                {
                  "Key": "Name",
                  "Value": {
                    "Fn::Sub": "eks-node-${EnvironmentSuffix}"
                  }
                },
                {
                  "Key": "Environment",
                  "Value": "Production"
                },
                {
                  "Key": "ManagedBy",
                  "Value": "CloudFormation"
                }
              ]
            },
            {
              "ResourceType": "volume",
              "Tags": [
                {
                  "Key": "Name",
                  "Value": {
                    "Fn::Sub": "eks-node-volume-${EnvironmentSuffix}"
                  }
                },
                {
                  "Key": "Environment",
                  "Value": "Production"
                },
                {
                  "Key": "ManagedBy",
                  "Value": "CloudFormation"
                }
              ]
            }
          ]
        },
        "TagSpecifications": [
          {
            "ResourceType": "launch-template",
            "Tags": [
              {
                "Key": "Name",
                "Value": {
                  "Fn::Sub": "eks-node-lt-${EnvironmentSuffix}"
                }
              },
              {
                "Key": "Environment",
                "Value": "Production"
              },
              {
                "Key": "ManagedBy",
                "Value": "CloudFormation"
              }
            ]
          }
        ]
      }
    },
    "EKSNodeGroup": {
      "Type": "AWS::EKS::Nodegroup",
      "DeletionPolicy": "Delete",
      "DependsOn": [
        "EKSCluster",
        "NodeGroupRole"
      ],
      "Properties": {
        "NodegroupName": {
          "Fn::Sub": "eks-nodegroup-${EnvironmentSuffix}"
        },
        "ClusterName": {
          "Ref": "EKSCluster"
        },
        "NodeRole": {
          "Fn::GetAtt": [
            "NodeGroupRole",
            "Arn"
          ]
        },
        "Subnets": [
          {
            "Ref": "PrivateSubnet1"
          },
          {
            "Ref": "PrivateSubnet2"
          },
          {
            "Ref": "PrivateSubnet3"
          }
        ],
        "ScalingConfig": {
          "MinSize": {
            "Ref": "NodeGroupMinSize"
          },
          "MaxSize": {
            "Ref": "NodeGroupMaxSize"
          },
          "DesiredSize": {
            "Ref": "NodeGroupDesiredSize"
          }
        },
        "InstanceTypes": [
          {
            "Ref": "NodeInstanceType"
          }
        ],
        "AmiType": "AL2_x86_64",
        "LaunchTemplate": {
          "Id": {
            "Ref": "NodeLaunchTemplate"
          },
          "Version": {
            "Fn::GetAtt": [
              "NodeLaunchTemplate",
              "LatestVersionNumber"
            ]
          }
        },
        "UpdateConfig": {
          "MaxUnavailable": 1
        },
        "Tags": {
          "Name": {
            "Fn::Sub": "eks-nodegroup-${EnvironmentSuffix}"
          },
          "Environment": "Production",
          "ManagedBy": "CloudFormation"
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
          "Fn::Sub": "${AWS::StackName}-VPCId"
        }
      }
    },
    "PublicSubnets": {
      "Description": "Public subnet IDs",
      "Value": {
        "Fn::Join": [
          ",",
          [
            {
              "Ref": "PublicSubnet1"
            },
            {
              "Ref": "PublicSubnet2"
            },
            {
              "Ref": "PublicSubnet3"
            }
          ]
        ]
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-PublicSubnets"
        }
      }
    },
    "PrivateSubnets": {
      "Description": "Private subnet IDs",
      "Value": {
        "Fn::Join": [
          ",",
          [
            {
              "Ref": "PrivateSubnet1"
            },
            {
              "Ref": "PrivateSubnet2"
            },
            {
              "Ref": "PrivateSubnet3"
            }
          ]
        ]
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-PrivateSubnets"
        }
      }
    },
    "EKSClusterName": {
      "Description": "EKS Cluster Name",
      "Value": {
        "Ref": "EKSCluster"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-EKSClusterName"
        }
      }
    },
    "EKSClusterEndpoint": {
      "Description": "EKS Cluster Endpoint",
      "Value": {
        "Fn::GetAtt": [
          "EKSCluster",
          "Endpoint"
        ]
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-EKSClusterEndpoint"
        }
      }
    },
    "EKSClusterArn": {
      "Description": "EKS Cluster ARN",
      "Value": {
        "Fn::GetAtt": [
          "EKSCluster",
          "Arn"
        ]
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-EKSClusterArn"
        }
      }
    },
    "OIDCProviderArn": {
      "Description": "OIDC Provider ARN for IRSA",
      "Value": {
        "Ref": "OIDCProvider"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-OIDCProviderArn"
        }
      }
    },
    "OIDCIssuerURL": {
      "Description": "OIDC Issuer URL",
      "Value": {
        "Fn::GetAtt": [
          "EKSCluster",
          "OpenIdConnectIssuerUrl"
        ]
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-OIDCIssuerURL"
        }
      }
    },
    "NodeGroupArn": {
      "Description": "EKS Node Group ARN",
      "Value": {
        "Fn::GetAtt": [
          "EKSNodeGroup",
          "Arn"
        ]
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-NodeGroupArn"
        }
      }
    },
    "NodeGroupName": {
      "Description": "EKS Node Group Name",
      "Value": {
        "Ref": "EKSNodeGroup"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-NodeGroupName"
        }
      }
    },
    "ClusterSecurityGroupId": {
      "Description": "Security Group ID for EKS Cluster",
      "Value": {
        "Ref": "EKSClusterSecurityGroup"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-ClusterSecurityGroupId"
        }
      }
    },
    "EnvironmentSuffix": {
      "Description": "Environment suffix used for this deployment",
      "Value": {
        "Ref": "EnvironmentSuffix"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-EnvironmentSuffix"
        }
      }
    }
  }
}
```

## File: lib/README.md

```markdown
# Production-Ready Amazon EKS Cluster

This CloudFormation template deploys a production-ready Amazon EKS cluster with managed node groups, VPC networking, and comprehensive security configurations.

## Architecture

The solution creates:

- **VPC**: A new VPC with 3 public and 3 private subnets across 3 availability zones
- **EKS Cluster**: Kubernetes 1.28 cluster with full logging enabled
- **Managed Node Group**: Auto-scaling node group (2-10 nodes) with m5.large instances
- **NAT Gateways**: One NAT Gateway per AZ for high availability
- **IAM Roles**: Least-privilege roles for cluster and node groups
- **OIDC Provider**: For IAM Roles for Service Accounts (IRSA)
- **Launch Template**: Enforces IMDSv2 for enhanced security
- **CloudWatch Logging**: All cluster logs sent to CloudWatch

## Prerequisites

- AWS CLI 2.x or later
- kubectl 1.28.x or later
- AWS account with appropriate permissions
- Sufficient service quotas for VPC, EKS, and EC2 resources

## Parameters

- **EnvironmentSuffix**: Environment identifier (e.g., dev, staging, prod)
- **VpcCIDR**: CIDR block for VPC (default: 10.0.0.0/16)
- **PublicSubnet1/2/3CIDR**: CIDR blocks for public subnets
- **PrivateSubnet1/2/3CIDR**: CIDR blocks for private subnets
- **KubernetesVersion**: Kubernetes version (default: 1.28)
- **NodeInstanceType**: EC2 instance type for nodes (default: m5.large)
- **NodeGroupMinSize**: Minimum nodes (default: 2)
- **NodeGroupMaxSize**: Maximum nodes (default: 10)
- **NodeGroupDesiredSize**: Desired nodes (default: 3)

## Deployment

### Step 1: Deploy the CloudFormation Stack

```bash
aws cloudformation create-stack \
  --stack-name eks-cluster-prod \
  --template-body file://TapStack.json \
  --parameters ParameterKey=EnvironmentSuffix,ParameterValue=prod \
  --capabilities CAPABILITY_NAMED_IAM \
  --region us-east-1
```

### Step 2: Wait for Stack Creation

```bash
aws cloudformation wait stack-create-complete \
  --stack-name eks-cluster-prod \
  --region us-east-1
```

This typically takes 15-20 minutes.

### Step 3: Configure kubectl

```bash
# Get cluster name from outputs
CLUSTER_NAME=$(aws cloudformation describe-stacks \
  --stack-name eks-cluster-prod \
  --query "Stacks[0].Outputs[?OutputKey=='EKSClusterName'].OutputValue" \
  --output text \
  --region us-east-1)

# Update kubeconfig
aws eks update-kubeconfig \
  --name $CLUSTER_NAME \
  --region us-east-1
```

### Step 4: Verify Cluster

```bash
# Check cluster status
kubectl get nodes

# Check system pods
kubectl get pods -n kube-system

# Check cluster info
kubectl cluster-info
```

## Security Features

1. **IMDSv2 Enforcement**: All nodes use IMDSv2 with hop limit of 1
2. **Private Node Placement**: Nodes deployed in private subnets
3. **Least Privilege IAM**: Minimal IAM permissions for cluster and nodes
4. **Comprehensive Logging**: All 5 log types enabled (api, audit, authenticator, controllerManager, scheduler)
5. **OIDC Provider**: Enables IRSA for pod-level IAM permissions
6. **Encrypted EBS**: Node volumes encrypted with AWS managed keys
7. **Security Groups**: Dedicated security group for cluster control plane

## Networking

- **VPC**: 10.0.0.0/16
- **Public Subnets**: 10.0.1.0/24, 10.0.2.0/24, 10.0.3.0/24
- **Private Subnets**: 10.0.11.0/24, 10.0.12.0/24, 10.0.13.0/24
- **NAT Gateways**: One per AZ for high availability
- **Internet Gateway**: For public subnet internet access

## Auto-Scaling

The managed node group automatically scales between 2-10 nodes based on resource demands. You can configure Cluster Autoscaler or Karpenter for advanced scaling policies.

## Outputs

The stack provides these outputs:

- **EKSClusterEndpoint**: API server endpoint URL
- **OIDCIssuerURL**: OIDC provider issuer URL for IRSA
- **NodeGroupArn**: ARN of the managed node group
- **VPCId**: VPC identifier
- **PublicSubnets**: Comma-separated public subnet IDs
- **PrivateSubnets**: Comma-separated private subnet IDs

## Cleanup

To delete all resources:

```bash
aws cloudformation delete-stack \
  --stack-name eks-cluster-prod \
  --region us-east-1

aws cloudformation wait stack-delete-complete \
  --stack-name eks-cluster-prod \
  --region us-east-1
```

## Cost Considerations

Primary cost drivers:

1. **EKS Cluster**: $0.10/hour (~$73/month)
2. **EC2 Instances**: 3 x m5.large (~$300/month)
3. **NAT Gateways**: 3 x $0.045/hour (~$100/month)
4. **EBS Volumes**: 3 x 20GB gp3 (~$6/month)
5. **Data Transfer**: Variable based on usage

Total estimated cost: ~$480-500/month for base infrastructure.

## Troubleshooting

### Nodes Not Joining Cluster

1. Check node IAM role has correct policies
2. Verify security group rules allow node-to-control-plane communication
3. Check CloudWatch logs for node bootstrap errors

### kubectl Connection Issues

1. Verify kubeconfig is correct: `kubectl config view`
2. Check AWS credentials: `aws sts get-caller-identity`
3. Verify cluster endpoint is accessible

### OIDC Provider Issues

1. Verify thumbprint is correct
2. Check OIDC provider ARN in IAM console
3. Ensure trust relationship in service account roles references correct OIDC provider

## Best Practices

1. **Use IRSA**: Assign IAM roles to service accounts instead of node-level permissions
2. **Enable Pod Security Standards**: Use PSS admission controller
3. **Monitor Logs**: Review CloudWatch logs regularly
4. **Update Regularly**: Keep cluster and nodes updated to latest versions
5. **Use Secrets Manager**: Store sensitive data in AWS Secrets Manager, not ConfigMaps
6. **Implement Network Policies**: Control pod-to-pod communication
7. **Enable Container Insights**: For enhanced monitoring

## Additional Add-ons

Consider installing these add-ons:

1. **AWS Load Balancer Controller**: For Ingress and Service load balancing
2. **EBS CSI Driver**: For persistent volume support
3. **Cluster Autoscaler**: For automatic node scaling
4. **Metrics Server**: For HPA and resource metrics
5. **CoreDNS**: Already installed for service discovery

## References

- [Amazon EKS User Guide](https://docs.aws.amazon.com/eks/latest/userguide/)
- [EKS Best Practices](https://aws.github.io/aws-eks-best-practices/)
- [IAM Roles for Service Accounts](https://docs.aws.amazon.com/eks/latest/userguide/iam-roles-for-service-accounts.html)
```
