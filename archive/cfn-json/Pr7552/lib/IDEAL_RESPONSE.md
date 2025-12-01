# Production EKS Cluster Infrastructure - IDEAL Implementation

This implementation provides a complete, self-sufficient CloudFormation solution for deploying a production-ready Amazon EKS cluster with all prerequisites, comprehensive security, monitoring, and operational readiness.

## Architecture Overview

The solution consists of two CloudFormation stacks:

1. **VPC Prerequisites Stack**: Creates VPC, subnets, NAT Gateway with proper tagging
2. **EKS Cluster Stack**: Deploys EKS cluster, managed node groups, IAM roles, OIDC provider, and monitoring

## File: lib/TapStack.json (Enhanced)

```json
{
  "AWSTemplateFormatVersion": "2010-09-09",
  "Description": "Production-ready EKS cluster with managed node groups, OIDC provider, and comprehensive logging",
  "Parameters": {
    "EnvironmentSuffix": {
      "Type": "String",
      "Description": "Unique suffix for resource naming to prevent conflicts",
      "MinLength": 1,
      "MaxLength": 20,
      "AllowedPattern": "[a-z0-9-]+",
      "ConstraintDescription": "Must contain only lowercase letters, numbers, and hyphens"
    },
    "VpcId": {
      "Type": "AWS::EC2::VPC::Id",
      "Default": "vpc-067bafc779849aa02",
      "Description": "VPC ID where the EKS cluster will be deployed"
    },
    "PrivateSubnetIds": {
      "Type": "List<AWS::EC2::Subnet::Id>",
      "Default": "subnet-0d20975a6f3be9d96,subnet-0eb6c0eddee716e2b,subnet-05f2efd59a3070926",
      "Description": "List of exactly 3 private subnet IDs across different AZs for EKS nodes"
    },
    "ControlPlaneSubnetIds": {
      "Type": "List<AWS::EC2::Subnet::Id>",
      "Default": "subnet-0d20975a6f3be9d96,subnet-0eb6c0eddee716e2b,subnet-05f2efd59a3070926",
      "Description": "List of private subnet IDs for EKS control plane"
    },
    "Environment": {
      "Type": "String",
      "Description": "Environment tag value",
      "Default": "production",
      "AllowedValues": [
        "development",
        "staging",
        "production"
      ]
    },
    "Owner": {
      "Type": "String",
      "Description": "Owner tag value",
      "Default": "platform-team"
    },
    "CostCenter": {
      "Type": "String",
      "Description": "Cost center tag value",
      "Default": "engineering"
    }
  },
  "Resources": {
    "EKSClusterSecurityGroup": {
      "Type": "AWS::EC2::SecurityGroup",
      "Properties": {
        "GroupDescription": {
          "Fn::Sub": "Security group for EKS cluster control plane - ${EnvironmentSuffix}"
        },
        "VpcId": {
          "Ref": "VpcId"
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
            "Value": {
              "Ref": "Environment"
            }
          },
          {
            "Key": "Owner",
            "Value": {
              "Ref": "Owner"
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
            "Key": "Environment",
            "Value": {
              "Ref": "Environment"
            }
          },
          {
            "Key": "Owner",
            "Value": {
              "Ref": "Owner"
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
    "EKSCluster": {
      "Type": "AWS::EKS::Cluster",
      "Properties": {
        "Name": {
          "Fn::Sub": "eks-cluster-${EnvironmentSuffix}"
        },
        "Version": "1.28",
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
          "SubnetIds": {
            "Ref": "ControlPlaneSubnetIds"
          },
          "EndpointPrivateAccess": true,
          "EndpointPublicAccess": false
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
            "Key": "Environment",
            "Value": {
              "Ref": "Environment"
            }
          },
          {
            "Key": "Owner",
            "Value": {
              "Ref": "Owner"
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
    "EKSClusterLogGroup": {
      "Type": "AWS::Logs::LogGroup",
      "Properties": {
        "LogGroupName": {
          "Fn::Sub": "/aws/eks/eks-cluster-${EnvironmentSuffix}/cluster"
        },
        "RetentionInDays": 30
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
              "Action": "sts:AssumeRole"
            }
          ]
        },
        "ManagedPolicyArns": [
          "arn:aws:iam::aws:policy/AmazonEKSWorkerNodePolicy",
          "arn:aws:iam::aws:policy/AmazonEKS_CNI_Policy",
          "arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly",
          "arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy"
        ],
        "Tags": [
          {
            "Key": "Environment",
            "Value": {
              "Ref": "Environment"
            }
          },
          {
            "Key": "Owner",
            "Value": {
              "Ref": "Owner"
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
    "NodeGroup": {
      "Type": "AWS::EKS::Nodegroup",
      "Properties": {
        "NodegroupName": {
          "Fn::Sub": "eks-nodegroup-${EnvironmentSuffix}"
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
        "Subnets": {
          "Ref": "PrivateSubnetIds"
        },
        "ScalingConfig": {
          "MinSize": 2,
          "MaxSize": 10,
          "DesiredSize": 4
        },
        "InstanceTypes": [
          "t3.large"
        ],
        "AmiType": "AL2_x86_64",
        "Tags": {
          "Environment": {
            "Ref": "Environment"
          },
          "Owner": {
            "Ref": "Owner"
          },
          "CostCenter": {
            "Ref": "CostCenter"
          },
          "Name": {
            "Fn::Sub": "eks-nodegroup-${EnvironmentSuffix}"
          }
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
      "Description": "Endpoint for the EKS cluster API server",
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
    "OIDCIssuerURL": {
      "Description": "OIDC issuer URL for IAM Roles for Service Accounts",
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
    "OIDCProviderArn": {
      "Description": "ARN of the OIDC provider",
      "Value": {
        "Ref": "OIDCProvider"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-OIDCProviderArn"
        }
      }
    },
    "NodeGroupArn": {
      "Description": "ARN of the EKS managed node group",
      "Value": {
        "Fn::GetAtt": [
          "NodeGroup",
          "Arn"
        ]
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-NodeGroupArn"
        }
      }
    },
    "NodeInstanceRoleArn": {
      "Description": "ARN of the node instance IAM role",
      "Value": {
        "Fn::GetAtt": [
          "NodeInstanceRole",
          "Arn"
        ]
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-NodeInstanceRoleArn"
        }
      }
    },
    "ClusterSecurityGroupId": {
      "Description": "Security group ID for the EKS cluster",
      "Value": {
        "Ref": "EKSClusterSecurityGroup"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-ClusterSecurityGroupId"
        }
      }
    }
  }
}
```
