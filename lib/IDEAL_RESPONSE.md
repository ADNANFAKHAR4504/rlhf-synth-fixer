# IDEAL RESPONSE - Production-Ready Code

This document contains the corrected, production-ready infrastructure code with all issues fixed.

## File: lib/TapStack.json

```json
{
  "AWSTemplateFormatVersion": "2010-09-09",
  "Description": "EKS Cluster Infrastructure with Hybrid Node Group Architecture - Production Ready",
  "Parameters": {
    "EnvironmentSuffix": {
      "Type": "String",
      "Description": "Unique suffix for resource naming to avoid conflicts",
      "MinLength": 1
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
            "Value": {
              "Fn::Sub": "eks-vpc-${EnvironmentSuffix}"
            }
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
        "CidrBlock": "10.0.10.0/24",
        "AvailabilityZone": {
          "Fn::Select": [
            0,
            {
              "Fn::GetAZs": {
                "Ref": "AWS::Region"
              }
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
              "Fn::GetAZs": {
                "Ref": "AWS::Region"
              }
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
              "Fn::GetAZs": {
                "Ref": "AWS::Region"
              }
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
              "Fn::GetAZs": {
                "Ref": "AWS::Region"
              }
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
          }
        ]
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
    "PrivateSubnetRouteTableAssociation1": {
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
    "PrivateSubnetRouteTableAssociation2": {
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
    "PrivateSubnetRouteTableAssociation3": {
      "Type": "AWS::EC2::SubnetRouteTableAssociation",
      "Properties": {
        "SubnetId": {
          "Ref": "PrivateSubnet3"
        },
        "RouteTableId": {
          "Ref": "PrivateRouteTable"
        }
      }
    },
    "ClusterSecurityGroup": {
      "Type": "AWS::EC2::SecurityGroup",
      "Properties": {
        "GroupDescription": "Security group for EKS cluster",
        "VpcId": {
          "Ref": "VPC"
        },
        "SecurityGroupIngress": [
          {
            "IpProtocol": "tcp",
            "FromPort": 443,
            "ToPort": 443,
            "CidrIp": "10.0.0.0/16"
          }
        ],
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "cluster-sg-${EnvironmentSuffix}"
            }
          }
        ]
      }
    },
    "NodeSecurityGroup": {
      "Type": "AWS::EC2::SecurityGroup",
      "Properties": {
        "GroupDescription": "Security group for EKS nodes",
        "VpcId": {
          "Ref": "VPC"
        },
        "SecurityGroupIngress": [
          {
            "IpProtocol": "-1",
            "SourceSecurityGroupId": {
              "Ref": "ClusterSecurityGroup"
            }
          }
        ],
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "node-sg-${EnvironmentSuffix}"
            }
          },
          {
            "Key": {
              "Fn::Sub": "kubernetes.io/cluster/eks-cluster-${EnvironmentSuffix}"
            },
            "Value": "owned"
          }
        ]
      }
    },
    "NodeSecurityGroupSelfIngress": {
      "Type": "AWS::EC2::SecurityGroupIngress",
      "Properties": {
        "GroupId": {
          "Ref": "NodeSecurityGroup"
        },
        "IpProtocol": "-1",
        "SourceSecurityGroupId": {
          "Ref": "NodeSecurityGroup"
        }
      }
    },
    "ClusterToNodeSecurityGroupIngress": {
      "Type": "AWS::EC2::SecurityGroupIngress",
      "Properties": {
        "GroupId": {
          "Ref": "ClusterSecurityGroup"
        },
        "IpProtocol": "tcp",
        "FromPort": 443,
        "ToPort": 443,
        "SourceSecurityGroupId": {
          "Ref": "NodeSecurityGroup"
        }
      }
    },
    "EncryptionKey": {
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
              "Resource": "*"
            }
          ]
        }
      }
    },
    "EncryptionKeyAlias": {
      "Type": "AWS::KMS::Alias",
      "Properties": {
        "AliasName": {
          "Fn::Sub": "alias/eks-encryption-${EnvironmentSuffix}"
        },
        "TargetKeyId": {
          "Ref": "EncryptionKey"
        }
      }
    },
    "ClusterRole": {
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
              "Action": "sts:AssumeRole"
            }
          ]
        },
        "ManagedPolicyArns": [
          "arn:aws:iam::aws:policy/AmazonEKSClusterPolicy",
          "arn:aws:iam::aws:policy/AmazonEKSVPCResourceController"
        ]
      }
    },
    "EKSCluster": {
      "Type": "AWS::EKS::Cluster",
      "Properties": {
        "Name": {
          "Fn::Sub": "eks-cluster-${EnvironmentSuffix}"
        },
        "Version": "1.28",
        "RoleArn": {
          "Fn::GetAtt": [
            "ClusterRole",
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
                  "EncryptionKey",
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
                "Type": "controllerManager"
              }
            ]
          }
        }
      }
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
        ]
      }
    },
    "NodeRole": {
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
              "Action": "sts:AssumeRole"
            }
          ]
        },
        "ManagedPolicyArns": [
          "arn:aws:iam::aws:policy/AmazonEKSWorkerNodePolicy",
          "arn:aws:iam::aws:policy/AmazonEKS_CNI_Policy",
          "arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly",
          "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
        ]
      }
    },
    "NodeInstanceProfile": {
      "Type": "AWS::IAM::InstanceProfile",
      "Properties": {
        "InstanceProfileName": {
          "Fn::Sub": "eks-node-profile-${EnvironmentSuffix}"
        },
        "Roles": [
          {
            "Ref": "NodeRole"
          }
        ]
      }
    },
    "ManagedNodeGroup": {
      "Type": "AWS::EKS::Nodegroup",
      "DependsOn": [
        "OIDCProvider"
      ],
      "Properties": {
        "ClusterName": {
          "Ref": "EKSCluster"
        },
        "NodegroupName": {
          "Fn::Sub": "managed-nodes-${EnvironmentSuffix}"
        },
        "NodeRole": {
          "Fn::GetAtt": [
            "NodeRole",
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
          "t3.medium"
        ],
        "AmiType": "AL2_x86_64",
        "Tags": {
          "Name": {
            "Fn::Sub": "managed-node-${EnvironmentSuffix}"
          },
          "Environment": {
            "Ref": "EnvironmentSuffix"
          }
        }
      }
    },
    "SelfManagedLaunchTemplate": {
      "Type": "AWS::EC2::LaunchTemplate",
      "Properties": {
        "LaunchTemplateName": {
          "Fn::Sub": "self-managed-lt-${EnvironmentSuffix}"
        },
        "LaunchTemplateData": {
          "InstanceType": "m5.large",
          "ImageId": "ami-045c6703d28f6bd2a",
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
          "MetadataOptions": {
            "HttpTokens": "required",
            "HttpPutResponseHopLimit": 1
          },
          "UserData": {
            "Fn::Base64": {
              "Fn::Sub": "#!/bin/bash\nset -o xtrace\n/etc/eks/bootstrap.sh ${EKSCluster}\n/opt/aws/bin/cfn-signal --exit-code $? --stack ${AWS::StackName} --resource SelfManagedAutoScalingGroup --region ${AWS::Region}\n"
            }
          },
          "TagSpecifications": [
            {
              "ResourceType": "instance",
              "Tags": [
                {
                  "Key": "Name",
                  "Value": {
                    "Fn::Sub": "self-managed-node-${EnvironmentSuffix}"
                  }
                },
                {
                  "Key": {
                    "Fn::Sub": "kubernetes.io/cluster/eks-cluster-${EnvironmentSuffix}"
                  },
                  "Value": "owned"
                }
              ]
            }
          ]
        }
      }
    },
    "SelfManagedAutoScalingGroup": {
      "Type": "AWS::AutoScaling::AutoScalingGroup",
      "DependsOn": [
        "OIDCProvider"
      ],
      "Properties": {
        "AutoScalingGroupName": {
          "Fn::Sub": "self-managed-asg-${EnvironmentSuffix}"
        },
        "LaunchTemplate": {
          "LaunchTemplateId": {
            "Ref": "SelfManagedLaunchTemplate"
          },
          "Version": {
            "Fn::GetAtt": [
              "SelfManagedLaunchTemplate",
              "LatestVersionNumber"
            ]
          }
        },
        "MinSize": "1",
        "MaxSize": "3",
        "DesiredCapacity": "1",
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
              "Fn::Sub": "self-managed-node-${EnvironmentSuffix}"
            },
            "PropagateAtLaunch": true
          },
          {
            "Key": {
              "Fn::Sub": "kubernetes.io/cluster/eks-cluster-${EnvironmentSuffix}"
            },
            "Value": "owned",
            "PropagateAtLaunch": true
          }
        ]
      }
    },
    "InternetGateway": {
      "Type": "AWS::EC2::InternetGateway"
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
    "PublicSubnet1Association": {
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
    "NATElasticIP": {
      "Type": "AWS::EC2::EIP",
      "Properties": {
        "Domain": "vpc"
      }
    },
    "NATGateway": {
      "Type": "AWS::EC2::NatGateway",
      "Properties": {
        "SubnetId": {
          "Ref": "PublicSubnet1"
        },
        "AllocationId": {
          "Fn::GetAtt": [
            "NATElasticIP",
            "AllocationId"
          ]
        }
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
    }
  },
  "Outputs": {
    "ClusterName": {
      "Description": "Name of the EKS cluster",
      "Value": {
        "Ref": "EKSCluster"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-ClusterName"
        }
      }
    },
    "ClusterEndpoint": {
      "Description": "Endpoint for EKS cluster",
      "Value": {
        "Fn::GetAtt": [
          "EKSCluster",
          "Endpoint"
        ]
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-ClusterEndpoint"
        }
      }
    },
    "ClusterArn": {
      "Description": "ARN of the EKS cluster",
      "Value": {
        "Fn::GetAtt": [
          "EKSCluster",
          "Arn"
        ]
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-ClusterArn"
        }
      }
    },
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
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-PrivateSubnetIds"
        }
      }
    },
    "OIDCProviderArn": {
      "Description": "ARN of the OIDC Provider",
      "Value": {
        "Ref": "OIDCProvider"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-OIDCProviderArn"
        }
      }
    },
    "NodeRoleArn": {
      "Description": "ARN of the Node IAM Role",
      "Value": {
        "Fn::GetAtt": [
          "NodeRole",
          "Arn"
        ]
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-NodeRoleArn"
        }
      }
    },
    "EncryptionKeyArn": {
      "Description": "ARN of the KMS encryption key",
      "Value": {
        "Fn::GetAtt": [
          "EncryptionKey",
          "Arn"
        ]
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-EncryptionKeyArn"
        }
      }
    }
  }
}
```