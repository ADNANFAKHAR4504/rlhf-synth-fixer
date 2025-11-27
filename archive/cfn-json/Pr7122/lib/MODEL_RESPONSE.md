# EKS Cluster with Mixed Node Groups - CloudFormation JSON Implementation

This implementation provides a production-grade EKS cluster with both managed and self-managed node groups, following PCI compliance requirements.

## File: lib/eks-cluster.json

```json
{
  "AWSTemplateFormatVersion": "2010-09-09",
  "Description": "Production-grade EKS cluster with mixed node groups for financial services platform",
  "Parameters": {
    "EnvironmentSuffix": {
      "Type": "String",
      "Description": "Unique suffix for resource naming to support multiple environments",
      "Default": "prod",
      "AllowedPattern": "^[a-z0-9-]+$",
      "ConstraintDescription": "Must contain only lowercase letters, numbers, and hyphens"
    },
    "VpcCidr": {
      "Type": "String",
      "Description": "CIDR block for the VPC",
      "Default": "10.0.0.0/16"
    },
    "EKSVersion": {
      "Type": "String",
      "Description": "EKS cluster version",
      "Default": "1.28"
    }
  },
  "Resources": {
    "KMSKey": {
      "Type": "AWS::KMS::Key",
      "Properties": {
        "Description": {
          "Fn::Sub": "KMS key for EKS envelope encryption - ${EnvironmentSuffix}"
        },
        "EnableKeyRotation": true,
        "KeyPolicy": {
          "Version": "2012-10-17",
          "Statement": [
            {
              "Sid": "Enable IAM User Permissions",
              "Effect": "Allow",
              "Principal": {
                "AWS": {
                  "Fn::Sub": "arn:aws:iam::${AWS::AccountId}:root"
                }
              },
              "Action": "kms:*",
              "Resource": "*"
            },
            {
              "Sid": "Allow EKS to use the key",
              "Effect": "Allow",
              "Principal": {
                "Service": "eks.amazonaws.com"
              },
              "Action": [
                "kms:Decrypt",
                "kms:DescribeKey",
                "kms:CreateGrant"
              ],
              "Resource": "*",
              "Condition": {
                "StringEquals": {
                  "aws:SourceAccount": {
                    "Ref": "AWS::AccountId"
                  }
                }
              }
            }
          ]
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "eks-kms-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": "Production"
          },
          {
            "Key": "CostCenter",
            "Value": "Engineering"
          }
        ]
      }
    },
    "KMSKeyAlias": {
      "Type": "AWS::KMS::Alias",
      "Properties": {
        "AliasName": {
          "Fn::Sub": "alias/eks-${EnvironmentSuffix}"
        },
        "TargetKeyId": {
          "Ref": "KMSKey"
        }
      }
    },
    "VPC": {
      "Type": "AWS::EC2::VPC",
      "Properties": {
        "CidrBlock": {
          "Ref": "VpcCidr"
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
              "Fn::Sub": "eks-igw-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": "Production"
          },
          {
            "Key": "CostCenter",
            "Value": "Engineering"
          }
        ]
      }
    },
    "VPCGatewayAttachment": {
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
    "PrivateSubnet1": {
      "Type": "AWS::EC2::Subnet",
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
        "MapPublicIpOnLaunch": false,
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "eks-private-subnet-1-${EnvironmentSuffix}"
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
        "CidrBlock": "10.0.2.0/24",
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
              "Fn::Sub": "eks-private-subnet-2-${EnvironmentSuffix}"
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
            "Key": "CostCenter",
            "Value": "Engineering"
          }
        ]
      }
    },
    "PrivateSubnet3": {
      "Type": "AWS::EC2::Subnet",
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
        "MapPublicIpOnLaunch": false,
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "eks-private-subnet-3-${EnvironmentSuffix}"
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
            "Key": "CostCenter",
            "Value": "Engineering"
          }
        ]
      }
    },
    "PublicSubnet1": {
      "Type": "AWS::EC2::Subnet",
      "Properties": {
        "VpcId": {
          "Ref": "VPC"
        },
        "CidrBlock": "10.0.101.0/24",
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
              "Fn::Sub": "eks-public-subnet-1-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": "Production"
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
        "CidrBlock": "10.0.102.0/24",
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
              "Fn::Sub": "eks-public-subnet-2-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": "Production"
          },
          {
            "Key": "CostCenter",
            "Value": "Engineering"
          }
        ]
      }
    },
    "PublicSubnet3": {
      "Type": "AWS::EC2::Subnet",
      "Properties": {
        "VpcId": {
          "Ref": "VPC"
        },
        "CidrBlock": "10.0.103.0/24",
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
              "Fn::Sub": "eks-public-subnet-3-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": "Production"
          },
          {
            "Key": "CostCenter",
            "Value": "Engineering"
          }
        ]
      }
    },
    "NATGateway1EIP": {
      "Type": "AWS::EC2::EIP",
      "DependsOn": "VPCGatewayAttachment",
      "Properties": {
        "Domain": "vpc",
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "eks-nat-eip-1-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": "Production"
          },
          {
            "Key": "CostCenter",
            "Value": "Engineering"
          }
        ]
      }
    },
    "NATGateway2EIP": {
      "Type": "AWS::EC2::EIP",
      "DependsOn": "VPCGatewayAttachment",
      "Properties": {
        "Domain": "vpc",
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "eks-nat-eip-2-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": "Production"
          },
          {
            "Key": "CostCenter",
            "Value": "Engineering"
          }
        ]
      }
    },
    "NATGateway3EIP": {
      "Type": "AWS::EC2::EIP",
      "DependsOn": "VPCGatewayAttachment",
      "Properties": {
        "Domain": "vpc",
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "eks-nat-eip-3-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": "Production"
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
            "NATGateway1EIP",
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
              "Fn::Sub": "eks-nat-1-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": "Production"
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
            "NATGateway2EIP",
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
              "Fn::Sub": "eks-nat-2-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": "Production"
          },
          {
            "Key": "CostCenter",
            "Value": "Engineering"
          }
        ]
      }
    },
    "NATGateway3": {
      "Type": "AWS::EC2::NatGateway",
      "Properties": {
        "AllocationId": {
          "Fn::GetAtt": [
            "NATGateway3EIP",
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
              "Fn::Sub": "eks-nat-3-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": "Production"
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
              "Fn::Sub": "eks-public-rt-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": "Production"
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
    "PublicSubnet3RouteTableAssociation": {
      "Type": "AWS::EC2::SubnetRouteTableAssociation",
      "Properties": {
        "SubnetId": {
          "Ref": "PublicSubnet3"
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
              "Fn::Sub": "eks-private-rt-1-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": "Production"
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
              "Fn::Sub": "eks-private-rt-2-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": "Production"
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
    "PrivateRouteTable3": {
      "Type": "AWS::EC2::RouteTable",
      "Properties": {
        "VpcId": {
          "Ref": "VPC"
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "eks-private-rt-3-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": "Production"
          },
          {
            "Key": "CostCenter",
            "Value": "Engineering"
          }
        ]
      }
    },
    "PrivateRoute3": {
      "Type": "AWS::EC2::Route",
      "Properties": {
        "RouteTableId": {
          "Ref": "PrivateRouteTable3"
        },
        "DestinationCidrBlock": "0.0.0.0/0",
        "NatGatewayId": {
          "Ref": "NATGateway3"
        }
      }
    },
    "PrivateSubnet3RouteTableAssociation": {
      "Type": "AWS::EC2::SubnetRouteTableAssociation",
      "Properties": {
        "SubnetId": {
          "Ref": "PrivateSubnet3"
        },
        "RouteTableId": {
          "Ref": "PrivateRouteTable3"
        }
      }
    },
    "ClusterSecurityGroup": {
      "Type": "AWS::EC2::SecurityGroup",
      "Properties": {
        "GroupDescription": "Security group for EKS cluster control plane",
        "VpcId": {
          "Ref": "VPC"
        },
        "SecurityGroupEgress": [
          {
            "IpProtocol": "-1",
            "CidrIp": "0.0.0.0/0"
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
            "Key": "CostCenter",
            "Value": "Engineering"
          }
        ]
      }
    },
    "ClusterSecurityGroupIngressFromNodes": {
      "Type": "AWS::EC2::SecurityGroupIngress",
      "Properties": {
        "Description": "Allow nodes to communicate with cluster API Server",
        "GroupId": {
          "Ref": "ClusterSecurityGroup"
        },
        "SourceSecurityGroupId": {
          "Ref": "NodeSecurityGroup"
        },
        "IpProtocol": "tcp",
        "FromPort": 443,
        "ToPort": 443
      }
    },
    "NodeSecurityGroup": {
      "Type": "AWS::EC2::SecurityGroup",
      "Properties": {
        "GroupDescription": "Security group for EKS nodes",
        "VpcId": {
          "Ref": "VPC"
        },
        "SecurityGroupEgress": [
          {
            "IpProtocol": "-1",
            "CidrIp": "0.0.0.0/0"
          }
        ],
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "eks-node-sg-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": "Production"
          },
          {
            "Key": "CostCenter",
            "Value": "Engineering"
          }
        ]
      }
    },
    "NodeSecurityGroupIngressFromCluster": {
      "Type": "AWS::EC2::SecurityGroupIngress",
      "Properties": {
        "Description": "Allow cluster to communicate with nodes",
        "GroupId": {
          "Ref": "NodeSecurityGroup"
        },
        "SourceSecurityGroupId": {
          "Ref": "ClusterSecurityGroup"
        },
        "IpProtocol": "tcp",
        "FromPort": 443,
        "ToPort": 443
      }
    },
    "NodeSecurityGroupIngressFromSelf": {
      "Type": "AWS::EC2::SecurityGroupIngress",
      "Properties": {
        "Description": "Allow nodes to communicate with each other",
        "GroupId": {
          "Ref": "NodeSecurityGroup"
        },
        "SourceSecurityGroupId": {
          "Ref": "NodeSecurityGroup"
        },
        "IpProtocol": "-1"
      }
    },
    "EKSClusterRole": {
      "Type": "AWS::IAM::Role",
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
              "Action": "sts:AssumeRole",
              "Condition": {
                "StringEquals": {
                  "aws:SourceAccount": {
                    "Ref": "AWS::AccountId"
                  }
                }
              }
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
            "Key": "CostCenter",
            "Value": "Engineering"
          }
        ]
      }
    },
    "CloudWatchLogGroup": {
      "Type": "AWS::Logs::LogGroup",
      "Properties": {
        "LogGroupName": {
          "Fn::Sub": "/aws/eks/cluster-${EnvironmentSuffix}/logs"
        },
        "RetentionInDays": 7
      }
    },
    "EKSCluster": {
      "Type": "AWS::EKS::Cluster",
      "Properties": {
        "Name": {
          "Fn::Sub": "eks-cluster-${EnvironmentSuffix}"
        },
        "Version": {
          "Ref": "EKSVersion"
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
              "Ref": "ClusterSecurityGroup"
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
            }
          ],
          "EndpointPrivateAccess": true,
          "EndpointPublicAccess": false
        },
        "EncryptionConfig": [
          {
            "Resources": [
              "secrets"
            ],
            "Provider": {
              "KeyArn": {
                "Fn::GetAtt": [
                  "KMSKey",
                  "Arn"
                ]
              }
            }
          }
        ],
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
            "Key": "CostCenter",
            "Value": "Engineering"
          }
        ]
      },
      "DependsOn": [
        "CloudWatchLogGroup"
      ]
    },
    "OIDCProvider": {
      "Type": "AWS::IAM::OIDCProvider",
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
              "Fn::Sub": "eks-oidc-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": "Production"
          },
          {
            "Key": "CostCenter",
            "Value": "Engineering"
          }
        ]
      }
    },
    "NodeInstanceRole": {
      "Type": "AWS::IAM::Role",
      "Properties": {
        "RoleName": {
          "Fn::Sub": "eks-node-role-${EnvironmentSuffix}"
        },
        "AssumeRolePolicyDocument": {
          "Version": "2012-10-17",
          "Statement": [
            {
              "Effect": "Allow",
              "Principal": {
                "Service": "ec2.amazonaws.com"
              },
              "Action": "sts:AssumeRole",
              "Condition": {
                "StringEquals": {
                  "aws:SourceAccount": {
                    "Ref": "AWS::AccountId"
                  }
                }
              }
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
              "Fn::Sub": "eks-node-role-${EnvironmentSuffix}"
            }
          },
          {
            "Key": "Environment",
            "Value": "Production"
          },
          {
            "Key": "CostCenter",
            "Value": "Engineering"
          }
        ]
      }
    },
    "NodeInstanceProfile": {
      "Type": "AWS::IAM::InstanceProfile",
      "Properties": {
        "InstanceProfileName": {
          "Fn::Sub": "eks-node-instance-profile-${EnvironmentSuffix}"
        },
        "Roles": [
          {
            "Ref": "NodeInstanceRole"
          }
        ]
      }
    },
    "ManagedNodeGroup": {
      "Type": "AWS::EKS::Nodegroup",
      "Properties": {
        "NodegroupName": {
          "Fn::Sub": "eks-managed-ng-${EnvironmentSuffix}"
        },
        "ClusterName": {
          "Ref": "EKSCluster"
        },
        "NodeRole": {
          "Fn::GetAtt": [
            "NodeInstanceRole",
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
          "MinSize": 2,
          "MaxSize": 6,
          "DesiredSize": 2
        },
        "InstanceTypes": [
          "t3.large"
        ],
        "AmiType": "AL2_x86_64",
        "UpdateConfig": {
          "MaxUnavailable": 1
        },
        "LaunchTemplate": {
          "Id": {
            "Ref": "ManagedNodeLaunchTemplate"
          },
          "Version": {
            "Fn::GetAtt": [
              "ManagedNodeLaunchTemplate",
              "LatestVersionNumber"
            ]
          }
        },
        "Tags": {
          "Name": {
            "Fn::Sub": "eks-managed-ng-${EnvironmentSuffix}"
          },
          "Environment": "Production",
          "CostCenter": "Engineering"
        }
      }
    },
    "ManagedNodeLaunchTemplate": {
      "Type": "AWS::EC2::LaunchTemplate",
      "Properties": {
        "LaunchTemplateName": {
          "Fn::Sub": "eks-managed-lt-${EnvironmentSuffix}"
        },
        "LaunchTemplateData": {
          "MetadataOptions": {
            "HttpTokens": "required",
            "HttpPutResponseHopLimit": 1
          },
          "TagSpecifications": [
            {
              "ResourceType": "instance",
              "Tags": [
                {
                  "Key": "Name",
                  "Value": {
                    "Fn::Sub": "eks-managed-node-${EnvironmentSuffix}"
                  }
                },
                {
                  "Key": "Environment",
                  "Value": "Production"
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
    "SelfManagedNodeLaunchTemplate": {
      "Type": "AWS::EC2::LaunchTemplate",
      "Properties": {
        "LaunchTemplateName": {
          "Fn::Sub": "eks-self-managed-lt-${EnvironmentSuffix}"
        },
        "LaunchTemplateData": {
          "ImageId": {
            "Fn::Sub": "{{resolve:ssm:/aws/service/eks/optimized-ami/${EKSVersion}/amazon-linux-2/recommended/image_id}}"
          },
          "InstanceType": "m5.xlarge",
          "IamInstanceProfile": {
            "Arn": {
              "Fn::GetAtt": [
                "NodeInstanceProfile",
                "Arn"
              ]
            }
          },
          "SecurityGroupIds": [
            {
              "Ref": "NodeSecurityGroup"
            }
          ],
          "UserData": {
            "Fn::Base64": {
              "Fn::Sub": "#!/bin/bash\nset -o xtrace\n/etc/eks/bootstrap.sh ${EKSCluster} --kubelet-extra-args '--node-labels=node-type=self-managed'\n"
            }
          },
          "MetadataOptions": {
            "HttpTokens": "required",
            "HttpPutResponseHopLimit": 1
          },
          "TagSpecifications": [
            {
              "ResourceType": "instance",
              "Tags": [
                {
                  "Key": "Name",
                  "Value": {
                    "Fn::Sub": "eks-self-managed-node-${EnvironmentSuffix}"
                  }
                },
                {
                  "Key": "Environment",
                  "Value": "Production"
                },
                {
                  "Key": "CostCenter",
                  "Value": "Engineering"
                },
                {
                  "Key": {
                    "Fn::Sub": "kubernetes.io/cluster/${EKSCluster}"
                  },
                  "Value": "owned"
                }
              ]
            }
          ]
        }
      }
    },
    "SelfManagedNodeAutoScalingGroup": {
      "Type": "AWS::AutoScaling::AutoScalingGroup",
      "Properties": {
        "AutoScalingGroupName": {
          "Fn::Sub": "eks-self-managed-asg-${EnvironmentSuffix}"
        },
        "LaunchTemplate": {
          "LaunchTemplateId": {
            "Ref": "SelfManagedNodeLaunchTemplate"
          },
          "Version": {
            "Fn::GetAtt": [
              "SelfManagedNodeLaunchTemplate",
              "LatestVersionNumber"
            ]
          }
        },
        "MinSize": "1",
        "MaxSize": "4",
        "DesiredCapacity": "2",
        "VPCZoneIdentifier": [
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
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "eks-self-managed-node-${EnvironmentSuffix}"
            },
            "PropagateAtLaunch": true
          },
          {
            "Key": "Environment",
            "Value": "Production",
            "PropagateAtLaunch": true
          },
          {
            "Key": "CostCenter",
            "Value": "Engineering",
            "PropagateAtLaunch": true
          },
          {
            "Key": {
              "Fn::Sub": "kubernetes.io/cluster/${EKSCluster}"
            },
            "Value": "owned",
            "PropagateAtLaunch": true
          }
        ]
      }
    }
  },
  "Outputs": {
    "ClusterName": {
      "Description": "EKS Cluster Name",
      "Value": {
        "Ref": "EKSCluster"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-ClusterName"
        }
      }
    },
    "ClusterArn": {
      "Description": "EKS Cluster ARN",
      "Value": {
        "Fn::GetAtt": [
          "EKSCluster",
          "Arn"
        ]
      }
    },
    "ClusterEndpoint": {
      "Description": "EKS Cluster Endpoint",
      "Value": {
        "Fn::GetAtt": [
          "EKSCluster",
          "Endpoint"
        ]
      }
    },
    "OIDCProviderArn": {
      "Description": "OIDC Provider ARN for IRSA",
      "Value": {
        "Ref": "OIDCProvider"
      }
    },
    "VpcId": {
      "Description": "VPC ID",
      "Value": {
        "Ref": "VPC"
      }
    },
    "PrivateSubnetIds": {
      "Description": "Private Subnet IDs",
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
      }
    },
    "NodeSecurityGroupId": {
      "Description": "Security Group ID for EKS Nodes",
      "Value": {
        "Ref": "NodeSecurityGroup"
      }
    },
    "ManagedNodeGroupName": {
      "Description": "Managed Node Group Name",
      "Value": {
        "Ref": "ManagedNodeGroup"
      }
    },
    "KMSKeyId": {
      "Description": "KMS Key ID for EKS encryption",
      "Value": {
        "Ref": "KMSKey"
      }
    }
  }
}
```

## File: lib/README.md

```markdown
# EKS Cluster with Mixed Node Groups

This CloudFormation template deploys a production-grade Amazon EKS cluster with both managed and self-managed node groups, designed for financial services microservices requiring PCI compliance.

## Architecture

- **EKS Cluster**: Version 1.28 with private endpoint access only
- **Managed Node Group**: t3.large instances (2-6 nodes) with IMDSv2
- **Self-Managed Node Group**: m5.xlarge instances (1-4 nodes) with IMDSv2
- **VPC**: 10.0.0.0/16 CIDR with 3 private subnets across availability zones
- **High Availability**: NAT Gateway in each AZ
- **Security**: KMS encryption, CloudWatch logging, least privilege IAM roles
- **IRSA**: OIDC provider for IAM Roles for Service Accounts

## Parameters

- `EnvironmentSuffix`: Unique suffix for resource naming (default: prod)
- `VpcCidr`: CIDR block for VPC (default: 10.0.0.0/16)
- `EKSVersion`: EKS cluster version (default: 1.28)

## Deployment

### Prerequisites

1. AWS CLI 2.x configured with appropriate credentials
2. IAM permissions to create EKS, VPC, EC2, IAM, KMS resources
3. kubectl 1.28+ for cluster access

### Deploy Stack

```bash
aws cloudformation create-stack \
  --stack-name eks-cluster-prod \
  --template-body file://lib/eks-cluster.json \
  --parameters ParameterKey=EnvironmentSuffix,ParameterValue=prod \
  --capabilities CAPABILITY_NAMED_IAM \
  --region us-east-1
```

### Monitor Deployment

```bash
aws cloudformation describe-stacks \
  --stack-name eks-cluster-prod \
  --region us-east-1 \
  --query 'Stacks[0].StackStatus'
```

Deployment typically takes 20-25 minutes.

### Configure kubectl

After deployment, configure kubectl to access the cluster:

```bash
aws eks update-kubeconfig \
  --name eks-cluster-prod \
  --region us-east-1
```

### Verify Cluster

```bash
# Check cluster status
kubectl get nodes

# Verify both node groups are present
kubectl get nodes --label-columns=node-type
```

## Security Features

- **Private Endpoint**: EKS API server accessible only from within VPC
- **IMDSv2**: Enforced on all EC2 instances with hop limit of 1
- **KMS Encryption**: Envelope encryption for Kubernetes secrets
- **CloudWatch Logging**: All EKS log types enabled (api, audit, authenticator, controllerManager, scheduler)
- **Security Groups**: Least privilege rules (port 443 only between nodes and control plane)
- **IAM Conditions**: aws:SourceAccount condition on all service roles

## Resource Naming

All resources follow the naming convention: `{resource-type}-{purpose}-{EnvironmentSuffix}`

Examples:
- EKS Cluster: `eks-cluster-prod`
- VPC: `eks-vpc-prod`
- Managed Node Group: `eks-managed-ng-prod`

## Monitoring

CloudWatch log group created at: `/aws/eks/cluster-{EnvironmentSuffix}/logs`

View logs:
```bash
aws logs tail /aws/eks/cluster-prod/logs --follow
```

## Scaling

### Managed Node Group
```bash
aws eks update-nodegroup-config \
  --cluster-name eks-cluster-prod \
  --nodegroup-name eks-managed-ng-prod \
  --scaling-config minSize=3,maxSize=8,desiredSize=4
```

### Self-Managed Node Group
```bash
aws autoscaling set-desired-capacity \
  --auto-scaling-group-name eks-self-managed-asg-prod \
  --desired-capacity 3
```

## IRSA (IAM Roles for Service Accounts)

The OIDC provider is configured for IRSA. Create service account roles:

```bash
# Get OIDC provider URL
OIDC_PROVIDER=$(aws eks describe-cluster --name eks-cluster-prod --query "cluster.identity.oidc.issuer" --output text | sed -e "s/^https:\/\///")

# Create IAM role with trust policy for service account
# See AWS documentation: https://docs.aws.amazon.com/eks/latest/userguide/iam-roles-for-service-accounts.html
```

## Cost Optimization

- Use Spot instances for self-managed node group (optional)
- Right-size instance types based on workload requirements
- Enable Cluster Autoscaler for automatic scaling
- Review CloudWatch log retention (currently 7 days)

## Cleanup

Delete the stack:

```bash
aws cloudformation delete-stack \
  --stack-name eks-cluster-prod \
  --region us-east-1
```

Note: All resources are configured to be destroyable (no retention policies).

## Outputs

- `ClusterName`: EKS cluster name
- `ClusterArn`: EKS cluster ARN
- `ClusterEndpoint`: API server endpoint (private only)
- `OIDCProviderArn`: OIDC provider ARN for IRSA
- `VpcId`: VPC identifier
- `PrivateSubnetIds`: Comma-separated private subnet IDs
- `NodeSecurityGroupId`: Security group for nodes
- `ManagedNodeGroupName`: Managed node group name
- `KMSKeyId`: KMS key for encryption

## Support

For issues or questions, refer to:
- [EKS Documentation](https://docs.aws.amazon.com/eks/)
- [CloudFormation Reference](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/)
```
