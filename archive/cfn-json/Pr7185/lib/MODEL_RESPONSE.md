# Multi-OS EKS Cluster with Enhanced Security Controls

This CloudFormation template creates a production-ready Amazon EKS cluster that supports both Linux and Windows workloads with comprehensive security controls for financial services applications.

## Implementation

### File: lib/TapStack.json

Complete CloudFormation JSON template implementing all mandatory requirements.

```json
{
  "AWSTemplateFormatVersion": "2010-09-09",
  "Description": "Multi-OS EKS cluster with enhanced security controls for financial services microservices platform",
  "Parameters": {
    "EnvironmentSuffix": {
      "Type": "String",
      "Description": "Unique suffix for resource naming to support multiple environments",
      "MinLength": 3,
      "MaxLength": 10,
      "AllowedPattern": "[a-z0-9-]+",
      "Default": "prod"
    },
    "VpcId": {
      "Type": "AWS::EC2::VPC::Id",
      "Description": "VPC ID where the EKS cluster will be deployed"
    },
    "PrivateSubnetIds": {
      "Type": "List<AWS::EC2::Subnet::Id>",
      "Description": "List of private subnet IDs across 3 availability zones"
    },
    "EksVersion": {
      "Type": "String",
      "Description": "EKS cluster version",
      "Default": "1.28",
      "AllowedValues": ["1.28", "1.29", "1.30"]
    },
    "LinuxInstanceType": {
      "Type": "String",
      "Description": "Instance type for Linux node group",
      "Default": "t3.medium"
    },
    "WindowsInstanceType": {
      "Type": "String",
      "Description": "Instance type for Windows node group",
      "Default": "t3.large"
    }
  },
  "Resources": {
    "EksKmsKey": {
      "Type": "AWS::KMS::Key",
      "Properties": {
        "Description": "KMS key for EKS secrets and control plane log encryption",
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
            },
            {
              "Sid": "Allow CloudWatch Logs",
              "Effect": "Allow",
              "Principal": {
                "Service": {
                  "Fn::Sub": "logs.${AWS::Region}.amazonaws.com"
                }
              },
              "Action": [
                "kms:Encrypt",
                "kms:Decrypt",
                "kms:ReEncrypt*",
                "kms:GenerateDataKey*",
                "kms:CreateGrant",
                "kms:DescribeKey"
              ],
              "Resource": "*",
              "Condition": {
                "ArnLike": {
                  "kms:EncryptionContext:aws:logs:arn": {
                    "Fn::Sub": "arn:aws:logs:${AWS::Region}:${AWS::AccountId}:*"
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
            "Key": "ManagedBy",
            "Value": "CloudFormation"
          }
        ]
      },
      "DeletionPolicy": "Delete"
    },
    "EksKmsKeyAlias": {
      "Type": "AWS::KMS::Alias",
      "Properties": {
        "AliasName": {
          "Fn::Sub": "alias/eks-${EnvironmentSuffix}"
        },
        "TargetKeyId": {
          "Ref": "EksKmsKey"
        }
      }
    },
    "EksClusterRole": {
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
            "Value": "Production"
          },
          {
            "Key": "ManagedBy",
            "Value": "CloudFormation"
          }
        ]
      }
    },
    "EksClusterSecurityGroup": {
      "Type": "AWS::EC2::SecurityGroup",
      "Properties": {
        "GroupName": {
          "Fn::Sub": "eks-cluster-sg-${EnvironmentSuffix}"
        },
        "GroupDescription": "Security group for EKS cluster control plane",
        "VpcId": {
          "Ref": "VpcId"
        },
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
    "EksCluster": {
      "Type": "AWS::EKS::Cluster",
      "Properties": {
        "Name": {
          "Fn::Sub": "eks-cluster-${EnvironmentSuffix}"
        },
        "Version": {
          "Ref": "EksVersion"
        },
        "RoleArn": {
          "Fn::GetAtt": ["EksClusterRole", "Arn"]
        },
        "ResourcesVpcConfig": {
          "EndpointPrivateAccess": true,
          "EndpointPublicAccess": false,
          "SubnetIds": {
            "Ref": "PrivateSubnetIds"
          },
          "SecurityGroupIds": [
            {
              "Ref": "EksClusterSecurityGroup"
            }
          ]
        },
        "EncryptionConfig": [
          {
            "Provider": {
              "KeyArn": {
                "Fn::GetAtt": ["EksKmsKey", "Arn"]
              }
            },
            "Resources": ["secrets"]
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
            "Key": "Environment",
            "Value": "Production"
          },
          {
            "Key": "ManagedBy",
            "Value": "CloudFormation"
          }
        ]
      },
      "DeletionPolicy": "Delete"
    },
    "EksOidcProvider": {
      "Type": "AWS::IAM::OIDCProvider",
      "DependsOn": ["EksCluster"],
      "Properties": {
        "Url": {
          "Fn::GetAtt": ["EksCluster", "OpenIdConnectIssuerUrl"]
        },
        "ClientIdList": ["sts.amazonaws.com"],
        "ThumbprintList": ["9e99a48a9960b14926bb7f3b02e22da2b0ab7280"],
        "Tags": [
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
          "arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly"
        ],
        "Tags": [
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
    "LinuxLaunchTemplate": {
      "Type": "AWS::EC2::LaunchTemplate",
      "Properties": {
        "LaunchTemplateName": {
          "Fn::Sub": "eks-linux-lt-${EnvironmentSuffix}"
        },
        "LaunchTemplateData": {
          "MetadataOptions": {
            "HttpTokens": "required",
            "HttpPutResponseHopLimit": 1,
            "HttpEndpoint": "enabled"
          },
          "TagSpecifications": [
            {
              "ResourceType": "instance",
              "Tags": [
                {
                  "Key": "Name",
                  "Value": {
                    "Fn::Sub": "eks-linux-node-${EnvironmentSuffix}"
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
                  "Fn::Sub": "eks-linux-lt-${EnvironmentSuffix}"
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
    "WindowsLaunchTemplate": {
      "Type": "AWS::EC2::LaunchTemplate",
      "Properties": {
        "LaunchTemplateName": {
          "Fn::Sub": "eks-windows-lt-${EnvironmentSuffix}"
        },
        "LaunchTemplateData": {
          "MetadataOptions": {
            "HttpTokens": "required",
            "HttpPutResponseHopLimit": 1,
            "HttpEndpoint": "enabled"
          },
          "TagSpecifications": [
            {
              "ResourceType": "instance",
              "Tags": [
                {
                  "Key": "Name",
                  "Value": {
                    "Fn::Sub": "eks-windows-node-${EnvironmentSuffix}"
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
                  "Fn::Sub": "eks-windows-lt-${EnvironmentSuffix}"
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
    "LinuxNodeGroup": {
      "Type": "AWS::EKS::Nodegroup",
      "DependsOn": ["EksCluster"],
      "Properties": {
        "NodegroupName": {
          "Fn::Sub": "linux-nodegroup-${EnvironmentSuffix}"
        },
        "ClusterName": {
          "Ref": "EksCluster"
        },
        "NodeRole": {
          "Fn::GetAtt": ["NodeGroupRole", "Arn"]
        },
        "Subnets": {
          "Ref": "PrivateSubnetIds"
        },
        "AmiType": "AL2_x86_64",
        "InstanceTypes": [
          {
            "Ref": "LinuxInstanceType"
          }
        ],
        "ScalingConfig": {
          "MinSize": 2,
          "MaxSize": 10,
          "DesiredSize": 3
        },
        "CapacityType": "SPOT",
        "LaunchTemplate": {
          "Id": {
            "Ref": "LinuxLaunchTemplate"
          }
        },
        "Tags": {
          "Environment": "Production",
          "ManagedBy": "CloudFormation",
          "Name": {
            "Fn::Sub": "linux-nodegroup-${EnvironmentSuffix}"
          }
        }
      },
      "DeletionPolicy": "Delete"
    },
    "WindowsNodeGroup": {
      "Type": "AWS::EKS::Nodegroup",
      "DependsOn": ["LinuxNodeGroup", "NodeGroupRole"],
      "Properties": {
        "NodegroupName": {
          "Fn::Sub": "windows-nodegroup-${EnvironmentSuffix}"
        },
        "ClusterName": {
          "Ref": "EksCluster"
        },
        "NodeRole": {
          "Fn::GetAtt": ["NodeGroupRole", "Arn"]
        },
        "Subnets": {
          "Ref": "PrivateSubnetIds"
        },
        "AmiType": "WINDOWS_CORE_2022_x86_64",
        "InstanceTypes": [
          {
            "Ref": "WindowsInstanceType"
          }
        ],
        "ScalingConfig": {
          "MinSize": 1,
          "MaxSize": 5,
          "DesiredSize": 2
        },
        "CapacityType": "SPOT",
        "LaunchTemplate": {
          "Id": {
            "Ref": "WindowsLaunchTemplate"
          }
        },
        "Tags": {
          "Environment": "Production",
          "ManagedBy": "CloudFormation",
          "Name": {
            "Fn::Sub": "windows-nodegroup-${EnvironmentSuffix}"
          }
        }
      },
      "DeletionPolicy": "Delete"
    },
    "VpcCniAddon": {
      "Type": "AWS::EKS::Addon",
      "DependsOn": ["EksCluster"],
      "Properties": {
        "AddonName": "vpc-cni",
        "ClusterName": {
          "Ref": "EksCluster"
        },
        "ResolveConflicts": "OVERWRITE",
        "ConfigurationValues": "{\"env\":{\"ENABLE_PREFIX_DELEGATION\":\"true\"}}",
        "Tags": [
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
    "KubeProxyAddon": {
      "Type": "AWS::EKS::Addon",
      "DependsOn": ["EksCluster"],
      "Properties": {
        "AddonName": "kube-proxy",
        "ClusterName": {
          "Ref": "EksCluster"
        },
        "ResolveConflicts": "OVERWRITE",
        "Tags": [
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
    "CoreDnsAddon": {
      "Type": "AWS::EKS::Addon",
      "DependsOn": ["LinuxNodeGroup"],
      "Properties": {
        "AddonName": "coredns",
        "ClusterName": {
          "Ref": "EksCluster"
        },
        "ResolveConflicts": "OVERWRITE",
        "Tags": [
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
    }
  },
  "Outputs": {
    "ClusterName": {
      "Description": "EKS Cluster Name",
      "Value": {
        "Ref": "EksCluster"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-ClusterName"
        }
      }
    },
    "ClusterEndpoint": {
      "Description": "EKS Cluster API Endpoint",
      "Value": {
        "Fn::GetAtt": ["EksCluster", "Endpoint"]
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-ClusterEndpoint"
        }
      }
    },
    "ClusterArn": {
      "Description": "EKS Cluster ARN",
      "Value": {
        "Fn::GetAtt": ["EksCluster", "Arn"]
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-ClusterArn"
        }
      }
    },
    "OidcIssuerUrl": {
      "Description": "OIDC Provider URL for IRSA",
      "Value": {
        "Fn::GetAtt": ["EksCluster", "OpenIdConnectIssuerUrl"]
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-OidcIssuerUrl"
        }
      }
    },
    "OidcProviderArn": {
      "Description": "OIDC Provider ARN",
      "Value": {
        "Ref": "EksOidcProvider"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-OidcProviderArn"
        }
      }
    },
    "LinuxNodeGroupArn": {
      "Description": "Linux Node Group ARN",
      "Value": {
        "Fn::GetAtt": ["LinuxNodeGroup", "Arn"]
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-LinuxNodeGroupArn"
        }
      }
    },
    "WindowsNodeGroupArn": {
      "Description": "Windows Node Group ARN",
      "Value": {
        "Fn::GetAtt": ["WindowsNodeGroup", "Arn"]
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-WindowsNodeGroupArn"
        }
      }
    },
    "KmsKeyArn": {
      "Description": "KMS Key ARN for EKS encryption",
      "Value": {
        "Fn::GetAtt": ["EksKmsKey", "Arn"]
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-KmsKeyArn"
        }
      }
    },
    "ClusterSecurityGroupId": {
      "Description": "Security Group ID for EKS Cluster",
      "Value": {
        "Ref": "EksClusterSecurityGroup"
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

## Initial Implementation Notes

This version represents the initial code generation with the following characteristics:

### Redundant Dependencies (cfn-lint W3005)

The template includes several redundant DependsOn declarations:
- **EksOidcProvider**: DependsOn EksCluster (redundant - GetAtt already creates dependency)
- **LinuxNodeGroup**: DependsOn EksCluster (redundant - Ref already creates dependency)
- **WindowsNodeGroup**: DependsOn NodeGroupRole (redundant - GetAtt already creates dependency)
- **VpcCniAddon**: DependsOn EksCluster (redundant - Ref already creates dependency)
- **KubeProxyAddon**: DependsOn EksCluster (redundant - Ref already creates dependency)

These will trigger cfn-lint warnings and should be cleaned up.

### Missing UpdateReplacePolicy

The EksKmsKey resource only has DeletionPolicy: Delete but is missing UpdateReplacePolicy: Delete, which should match for consistency in resource lifecycle management.

### Implementation Quality

While the template implements all 10 mandatory requirements correctly, the code quality needs improvement:
- Excessive explicit dependencies create maintenance burden
- Resource ordering could be more logical
- Some CloudFormation best practices not fully applied

### Requirements Met

All mandatory requirements are implemented:
1. EKS cluster with private API endpoint
2. Two managed node groups (Linux and Windows)
3. KMS encryption for secrets
4. All control plane log types enabled
5. Custom launch templates with IMDSv2 enforcement
6. Spot instance usage (100% Spot)
7. OIDC provider for IRSA
8. VPC CNI addon with prefix delegation
9. Resource tagging
10. Required outputs

### Next Steps for Improvement

1. Remove redundant DependsOn declarations
2. Add UpdateReplacePolicy to EksKmsKey
3. Improve code organization and documentation
4. Validate with cfn-lint to ensure zero warnings
5. Ensure tests accurately reflect EKS infrastructure (not DynamoDB)
