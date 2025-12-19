# EKS Cluster Infrastructure - CloudFormation Implementation

This implementation provides a production-ready EKS cluster with managed node groups, OIDC provider, and comprehensive security controls.

## File: lib/eks-cluster.json

```json
{
  "AWSTemplateFormatVersion": "2010-09-09",
  "Description": "Production EKS Cluster with Managed Node Groups",
  "Parameters": {
    "EnvironmentSuffix": {
      "Type": "String",
      "Description": "Unique suffix for resource naming to avoid conflicts",
      "Default": "prod"
    },
    "VpcId": {
      "Type": "AWS::EC2::VPC::Id",
      "Description": "VPC ID where EKS cluster will be deployed"
    },
    "PrivateSubnetIds": {
      "Type": "List<AWS::EC2::Subnet::Id>",
      "Description": "Private subnet IDs for worker nodes (3 subnets across AZs)"
    },
    "KubernetesVersion": {
      "Type": "String",
      "Description": "Kubernetes version for EKS cluster",
      "Default": "1.28",
      "AllowedValues": ["1.28", "1.29", "1.30"]
    }
  },
  "Resources": {
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
            "Value": "Production"
          },
          {
            "Key": "ManagedBy",
            "Value": "CloudFormation"
          }
        ]
      }
    },
    "ClusterSecurityGroup": {
      "Type": "AWS::EC2::SecurityGroup",
      "Properties": {
        "GroupName": {
          "Fn::Sub": "eks-cluster-sg-${EnvironmentSuffix}"
        },
        "GroupDescription": "Security group for EKS cluster control plane",
        "VpcId": {
          "Ref": "VpcId"
        },
        "SecurityGroupIngress": [
          {
            "IpProtocol": "tcp",
            "FromPort": 443,
            "ToPort": 443,
            "CidrIp": "10.0.0.0/8",
            "Description": "Allow HTTPS access from internal CIDR"
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
      "DeletionPolicy": "Retain",
      "Properties": {
        "Name": {
          "Fn::Sub": "eks-cluster-${EnvironmentSuffix}"
        },
        "Version": {
          "Ref": "KubernetesVersion"
        },
        "RoleArn": {
          "Fn::GetAtt": ["EKSClusterRole", "Arn"]
        },
        "ResourcesVpcConfig": {
          "SecurityGroupIds": [
            {
              "Ref": "ClusterSecurityGroup"
            }
          ],
          "SubnetIds": {
            "Ref": "PrivateSubnetIds"
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
      "Properties": {
        "Url": {
          "Fn::GetAtt": ["EKSCluster", "OpenIdConnectIssuerUrl"]
        },
        "ClientIdList": [
          "sts.amazonaws.com"
        ],
        "ThumbprintList": [
          "9e99a48a9960b14926bb7f3b02e22da2b0ab7280"
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
    "GeneralNodeGroup": {
      "Type": "AWS::EKS::Nodegroup",
      "DependsOn": "EKSCluster",
      "Properties": {
        "NodegroupName": {
          "Fn::Sub": "general-nodegroup-${EnvironmentSuffix}"
        },
        "ClusterName": {
          "Ref": "EKSCluster"
        },
        "NodeRole": {
          "Fn::GetAtt": ["NodeGroupRole", "Arn"]
        },
        "Subnets": {
          "Ref": "PrivateSubnetIds"
        },
        "ScalingConfig": {
          "MinSize": 2,
          "MaxSize": 6,
          "DesiredSize": 2
        },
        "InstanceTypes": [
          "t3.large"
        ],
        "AmiType": "AL2_x86_64",
        "Tags": {
          "Environment": "Production",
          "ManagedBy": "CloudFormation",
          "NodeGroup": "General"
        }
      }
    },
    "ComputeNodeGroup": {
      "Type": "AWS::EKS::Nodegroup",
      "DependsOn": "EKSCluster",
      "Properties": {
        "NodegroupName": {
          "Fn::Sub": "compute-nodegroup-${EnvironmentSuffix}"
        },
        "ClusterName": {
          "Ref": "EKSCluster"
        },
        "NodeRole": {
          "Fn::GetAtt": ["NodeGroupRole", "Arn"]
        },
        "Subnets": {
          "Ref": "PrivateSubnetIds"
        },
        "ScalingConfig": {
          "MinSize": 1,
          "MaxSize": 4,
          "DesiredSize": 1
        },
        "InstanceTypes": [
          "c5.xlarge"
        ],
        "AmiType": "AL2_x86_64",
        "Tags": {
          "Environment": "Production",
          "ManagedBy": "CloudFormation",
          "NodeGroup": "Compute"
        }
      }
    },
    "ALBControllerRole": {
      "Type": "AWS::IAM::Role",
      "Properties": {
        "RoleName": {
          "Fn::Sub": "eks-alb-controller-${EnvironmentSuffix}"
        },
        "AssumeRolePolicyDocument": {
          "Version": "2012-10-17",
          "Statement": [
            {
              "Effect": "Allow",
              "Principal": {
                "Federated": {
                  "Fn::GetAtt": ["OIDCProvider", "Arn"]
                }
              },
              "Action": "sts:AssumeRoleWithWebIdentity",
              "Condition": {
                "StringEquals": {
                  "Fn::Sub": [
                    "${OIDCIssuer}:sub",
                    {
                      "OIDCIssuer": {
                        "Fn::Select": [
                          1,
                          {
                            "Fn::Split": [
                              "//",
                              {
                                "Fn::GetAtt": ["EKSCluster", "OpenIdConnectIssuerUrl"]
                              }
                            ]
                          }
                        ]
                      }
                    }
                  ]
                }: "system:serviceaccount:kube-system:aws-load-balancer-controller"
              }
            }
          ]
        },
        "Policies": [
          {
            "PolicyName": "ALBControllerPolicy",
            "PolicyDocument": {
              "Version": "2012-10-17",
              "Statement": [
                {
                  "Effect": "Allow",
                  "Action": [
                    "elasticloadbalancing:CreateLoadBalancer",
                    "elasticloadbalancing:CreateTargetGroup",
                    "elasticloadbalancing:AddTags",
                    "elasticloadbalancing:DescribeLoadBalancers",
                    "elasticloadbalancing:DescribeTargetGroups",
                    "ec2:DescribeSubnets",
                    "ec2:DescribeSecurityGroups"
                  ],
                  "Resource": "*"
                }
              ]
            }
          }
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
    "EBSCSIDriverRole": {
      "Type": "AWS::IAM::Role",
      "Properties": {
        "RoleName": {
          "Fn::Sub": "eks-ebs-csi-driver-${EnvironmentSuffix}"
        },
        "AssumeRolePolicyDocument": {
          "Version": "2012-10-17",
          "Statement": [
            {
              "Effect": "Allow",
              "Principal": {
                "Federated": {
                  "Fn::GetAtt": ["OIDCProvider", "Arn"]
                }
              },
              "Action": "sts:AssumeRoleWithWebIdentity",
              "Condition": {
                "StringEquals": {
                  "Fn::Sub": [
                    "${OIDCIssuer}:sub",
                    {
                      "OIDCIssuer": {
                        "Fn::Select": [
                          1,
                          {
                            "Fn::Split": [
                              "//",
                              {
                                "Fn::GetAtt": ["EKSCluster", "OpenIdConnectIssuerUrl"]
                              }
                            ]
                          }
                        ]
                      }
                    }
                  ]
                }: "system:serviceaccount:kube-system:ebs-csi-controller-sa"
              }
            }
          ]
        },
        "ManagedPolicyArns": [
          "arn:aws:iam::aws:policy/service-role/AmazonEBSCSIDriverPolicy"
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
    "FargateProfile": {
      "Type": "AWS::EKS::FargateProfile",
      "DependsOn": "EKSCluster",
      "Properties": {
        "FargateProfileName": {
          "Fn::Sub": "system-pods-${EnvironmentSuffix}"
        },
        "ClusterName": {
          "Ref": "EKSCluster"
        },
        "PodExecutionRoleArn": {
          "Fn::GetAtt": ["FargatePodExecutionRole", "Arn"]
        },
        "Subnets": {
          "Ref": "PrivateSubnetIds"
        },
        "Selectors": [
          {
            "Namespace": "kube-system",
            "Labels": {
              "k8s-app": "kube-dns"
            }
          }
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
    "FargatePodExecutionRole": {
      "Type": "AWS::IAM::Role",
      "Properties": {
        "RoleName": {
          "Fn::Sub": "eks-fargate-pod-execution-${EnvironmentSuffix}"
        },
        "AssumeRolePolicyDocument": {
          "Version": "2012-10-17",
          "Statement": [
            {
              "Effect": "Allow",
              "Principal": {
                "Service": "eks-fargate-pods.amazonaws.com"
              },
              "Action": "sts:AssumeRole"
            }
          ]
        },
        "ManagedPolicyArns": [
          "arn:aws:iam::aws:policy/AmazonEKSFargatePodExecutionRolePolicy"
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
    "ClusterEndpoint": {
      "Description": "EKS Cluster API Endpoint",
      "Value": {
        "Fn::GetAtt": ["EKSCluster", "Endpoint"]
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
        "Fn::GetAtt": ["EKSCluster", "Arn"]
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-ClusterArn"
        }
      }
    },
    "OIDCIssuerURL": {
      "Description": "OIDC Provider Issuer URL for IRSA",
      "Value": {
        "Fn::GetAtt": ["EKSCluster", "OpenIdConnectIssuerUrl"]
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-OIDCIssuerURL"
        }
      }
    },
    "OIDCProviderArn": {
      "Description": "OIDC Provider ARN",
      "Value": {
        "Fn::GetAtt": ["OIDCProvider", "Arn"]
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-OIDCProviderArn"
        }
      }
    },
    "GeneralNodeGroupArn": {
      "Description": "General Workload Node Group ARN",
      "Value": {
        "Fn::GetAtt": ["GeneralNodeGroup", "Arn"]
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-GeneralNodeGroupArn"
        }
      }
    },
    "ComputeNodeGroupArn": {
      "Description": "Compute-Intensive Workload Node Group ARN",
      "Value": {
        "Fn::GetAtt": ["ComputeNodeGroup", "Arn"]
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-ComputeNodeGroupArn"
        }
      }
    },
    "ALBControllerRoleArn": {
      "Description": "ALB Controller IAM Role ARN for IRSA",
      "Value": {
        "Fn::GetAtt": ["ALBControllerRole", "Arn"]
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-ALBControllerRoleArn"
        }
      }
    },
    "EBSCSIDriverRoleArn": {
      "Description": "EBS CSI Driver IAM Role ARN for IRSA",
      "Value": {
        "Fn::GetAtt": ["EBSCSIDriverRole", "Arn"]
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-EBSCSIDriverRoleArn"
        }
      }
    }
  }
}
```

## File: lib/README.md

```markdown
# EKS Cluster Infrastructure

Production-ready Amazon EKS cluster with managed node groups, OIDC provider for IRSA, and comprehensive security controls.

## Architecture

This CloudFormation template deploys:

- **EKS Cluster**: Kubernetes 1.28+ with private API endpoint
- **Managed Node Groups**: Two auto-scaling groups (general and compute workloads)
- **OIDC Provider**: Enables IAM Roles for Service Accounts (IRSA)
- **IAM Roles**: Cluster role, node group role, and service account roles
- **Security Groups**: Restricts access to 10.0.0.0/8 CIDR
- **CloudWatch Logging**: All control plane components logged
- **Optional**: ALB Controller, EBS CSI Driver, and Fargate profile

## Prerequisites

1. AWS Account with appropriate permissions
2. VPC with private subnets across 3 availability zones
3. NAT gateways configured for outbound internet access
4. AWS CLI 2.x installed and configured

## Parameters

- **EnvironmentSuffix**: Unique suffix for resource naming (default: prod)
- **VpcId**: VPC ID where cluster will be deployed
- **PrivateSubnetIds**: List of 3 private subnet IDs
- **KubernetesVersion**: Kubernetes version (1.28, 1.29, or 1.30)

## Deployment

### Deploy the Stack

```bash
aws cloudformation create-stack \
  --stack-name eks-cluster-prod \
  --template-body file://lib/eks-cluster.json \
  --parameters \
    ParameterKey=EnvironmentSuffix,ParameterValue=prod \
    ParameterKey=VpcId,ParameterValue=vpc-xxxxx \
    ParameterKey=PrivateSubnetIds,ParameterValue="subnet-xxx\\,subnet-yyy\\,subnet-zzz" \
    ParameterKey=KubernetesVersion,ParameterValue=1.28 \
  --capabilities CAPABILITY_NAMED_IAM \
  --region us-east-1
```

### Monitor Deployment

```bash
aws cloudformation describe-stacks \
  --stack-name eks-cluster-prod \
  --query 'Stacks[0].StackStatus' \
  --region us-east-1
```

### Get Outputs

```bash
aws cloudformation describe-stacks \
  --stack-name eks-cluster-prod \
  --query 'Stacks[0].Outputs' \
  --region us-east-1
```

## Configure kubectl

After deployment, configure kubectl to access the cluster:

```bash
aws eks update-kubeconfig \
  --name eks-cluster-prod \
  --region us-east-1
```

## Verify Deployment

```bash
# Check cluster status
kubectl get nodes

# Check system pods
kubectl get pods -n kube-system

# Verify OIDC provider
aws eks describe-cluster \
  --name eks-cluster-prod \
  --query 'cluster.identity.oidc.issuer' \
  --region us-east-1
```

## Resources Created

### Core Resources

- EKS Cluster with private API endpoint
- OIDC Identity Provider
- 2 Managed Node Groups (general and compute)
- IAM roles for cluster and node groups
- Security group for cluster control plane

### Optional Resources

- ALB Controller IAM role (for Kubernetes Ingress)
- EBS CSI Driver IAM role (for persistent volumes)
- Fargate profile (for system pods)

## Security Features

- Private API endpoint (no public access)
- Access restricted to 10.0.0.0/8 CIDR blocks
- Node groups in private subnets
- IAM roles following least privilege principle
- CloudWatch logging for all control plane components
- IRSA enabled for pod-level IAM permissions

## Scaling Configuration

### General Node Group

- Instance Type: t3.large
- Min Nodes: 2
- Max Nodes: 6
- Desired: 2

### Compute Node Group

- Instance Type: c5.xlarge
- Min Nodes: 1
- Max Nodes: 4
- Desired: 1

## Cleanup

To delete the stack:

```bash
# First, delete all Kubernetes resources
kubectl delete all --all --all-namespaces

# Then delete the CloudFormation stack
aws cloudformation delete-stack \
  --stack-name eks-cluster-prod \
  --region us-east-1
```

**Note**: The EKS cluster resource has a Retain deletion policy for safety. You may need to manually delete it from the AWS console after verifying all dependent resources are cleaned up.

## Troubleshooting

### Node Group Not Joining

```bash
# Check node group status
aws eks describe-nodegroup \
  --cluster-name eks-cluster-prod \
  --nodegroup-name general-nodegroup-prod \
  --region us-east-1

# Check CloudWatch logs
aws logs tail /aws/eks/eks-cluster-prod/cluster --follow
```

### IRSA Issues

```bash
# Verify OIDC provider is configured
aws iam list-open-id-connect-providers

# Check service account annotations
kubectl describe serviceaccount -n kube-system
```

## Outputs

- **ClusterName**: EKS cluster name
- **ClusterEndpoint**: API server endpoint
- **ClusterArn**: Cluster ARN
- **OIDCIssuerURL**: OIDC issuer URL for IRSA
- **OIDCProviderArn**: OIDC provider ARN
- **GeneralNodeGroupArn**: General workload node group ARN
- **ComputeNodeGroupArn**: Compute workload node group ARN
- **ALBControllerRoleArn**: ALB controller role ARN
- **EBSCSIDriverRoleArn**: EBS CSI driver role ARN
```
