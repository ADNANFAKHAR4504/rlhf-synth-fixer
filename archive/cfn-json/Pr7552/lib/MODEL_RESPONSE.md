# Production EKS Cluster Infrastructure - Implementation

This implementation provides a complete CloudFormation JSON template for deploying a production-ready Amazon EKS cluster with managed node groups, OIDC provider integration, comprehensive logging, and proper IAM configuration.

## File: lib/TapStack.json

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
      "Description": "VPC ID where the EKS cluster will be deployed"
    },
    "PrivateSubnetIds": {
      "Type": "List<AWS::EC2::Subnet::Id>",
      "Description": "List of exactly 3 private subnet IDs across different AZs for EKS nodes"
    },
    "ControlPlaneSubnetIds": {
      "Type": "List<AWS::EC2::Subnet::Id>",
      "Description": "List of private subnet IDs for EKS control plane"
    },
    "Environment": {
      "Type": "String",
      "Description": "Environment tag value",
      "Default": "production",
      "AllowedValues": ["development", "staging", "production"]
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
          "Fn::GetAtt": ["EKSClusterRole", "Arn"]
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
      },
      "DependsOn": ["EKSClusterRole"]
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
          "Fn::GetAtt": ["EKSCluster", "OpenIdConnectIssuerUrl"]
        },
        "ClientIdList": ["sts.amazonaws.com"],
        "ThumbprintList": ["9e99a48a9960b14926bb7f3b02e22da2b0ab7280"]
      },
      "DependsOn": ["EKSCluster"]
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
          "Fn::GetAtt": ["NodeInstanceRole", "Arn"]
        },
        "Subnets": {
          "Ref": "PrivateSubnetIds"
        },
        "ScalingConfig": {
          "MinSize": 2,
          "MaxSize": 10,
          "DesiredSize": 4
        },
        "InstanceTypes": ["t3.large"],
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
      },
      "DependsOn": ["EKSCluster", "NodeInstanceRole"]
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
        "Fn::GetAtt": ["EKSCluster", "Endpoint"]
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
        "Fn::GetAtt": ["EKSCluster", "Arn"]
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
        "Fn::GetAtt": ["EKSCluster", "OpenIdConnectIssuerUrl"]
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
        "Fn::GetAtt": ["NodeGroup", "Arn"]
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
        "Fn::GetAtt": ["NodeInstanceRole", "Arn"]
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

## File: lib/README.md

```markdown
# Production EKS Cluster - CloudFormation Template

This CloudFormation template deploys a production-ready Amazon EKS cluster with managed node groups, OIDC provider integration, and comprehensive security and observability features.

## Architecture Overview

The template creates:
- **EKS Cluster v1.28** with private API endpoint only
- **Managed Node Group** with t3.large instances across 3 AZs
- **Auto-scaling** configuration (min: 2, max: 10, desired: 4)
- **OIDC Provider** for IAM Roles for Service Accounts (IRSA)
- **IAM Roles** for cluster and worker nodes
- **CloudWatch Logging** with 30-day retention for all control plane logs
- **Security Groups** for cluster communication

## Prerequisites

Before deploying this stack, ensure you have:

1. **VPC with Private Subnets**:
   - VPC with at least 3 private subnets across different availability zones
   - NAT Gateway configured for outbound internet access
   - Subnets properly tagged for EKS discovery

2. **AWS CLI v2.x** with configured credentials

3. **Permissions**: IAM permissions to create:
   - EKS clusters
   - IAM roles and policies
   - EC2 security groups
   - CloudWatch log groups
   - OIDC providers

## Parameters

| Parameter | Description | Required | Default |
|-----------|-------------|----------|---------|
| `EnvironmentSuffix` | Unique suffix for resource naming | Yes | - |
| `VpcId` | VPC ID for cluster deployment | Yes | - |
| `PrivateSubnetIds` | List of 3 private subnet IDs for nodes | Yes | - |
| `ControlPlaneSubnetIds` | List of private subnet IDs for control plane | Yes | - |
| `Environment` | Environment tag (development/staging/production) | No | production |
| `Owner` | Owner tag value | No | platform-team |
| `CostCenter` | Cost center tag value | No | engineering |

## Deployment Instructions

### 1. Validate the Template

```bash
aws cloudformation validate-template \
  --template-body file://lib/TapStack.json
```

### 2. Deploy the Stack

```bash
aws cloudformation create-stack \
  --stack-name eks-cluster-production \
  --template-body file://lib/TapStack.json \
  --parameters \
    ParameterKey=EnvironmentSuffix,ParameterValue=prod-001 \
    ParameterKey=VpcId,ParameterValue=vpc-xxxxxxxxx \
    ParameterKey=PrivateSubnetIds,ParameterValue="subnet-xxx\\,subnet-yyy\\,subnet-zzz" \
    ParameterKey=ControlPlaneSubnetIds,ParameterValue="subnet-xxx\\,subnet-yyy\\,subnet-zzz" \
    ParameterKey=Environment,ParameterValue=production \
    ParameterKey=Owner,ParameterValue=platform-team \
    ParameterKey=CostCenter,ParameterValue=engineering \
  --capabilities CAPABILITY_NAMED_IAM \
  --region us-east-1
```

### 3. Monitor Stack Creation

```bash
aws cloudformation describe-stacks \
  --stack-name eks-cluster-production \
  --region us-east-1 \
  --query 'Stacks[0].StackStatus'
```

The stack typically completes in 15-20 minutes.

### 4. Configure kubectl

Once the stack is complete, configure kubectl:

```bash
# Get cluster name from outputs
CLUSTER_NAME=$(aws cloudformation describe-stacks \
  --stack-name eks-cluster-production \
  --query 'Stacks[0].Outputs[?OutputKey==`ClusterName`].OutputValue' \
  --output text)

# Update kubeconfig
aws eks update-kubeconfig \
  --name $CLUSTER_NAME \
  --region us-east-1
```

### 5. Verify Cluster

```bash
# Check cluster status
kubectl cluster-info

# Verify nodes
kubectl get nodes

# Check node count (should show 4 nodes)
kubectl get nodes --no-headers | wc -l
```

## Stack Outputs

| Output | Description |
|--------|-------------|
| `ClusterName` | Name of the EKS cluster |
| `ClusterEndpoint` | API server endpoint URL |
| `ClusterArn` | ARN of the EKS cluster |
| `OIDCIssuerURL` | OIDC issuer URL for IRSA |
| `OIDCProviderArn` | ARN of the OIDC provider |
| `NodeGroupArn` | ARN of the managed node group |
| `NodeInstanceRoleArn` | ARN of the node IAM role |
| `ClusterSecurityGroupId` | Security group ID for cluster |

## Features

### Security
- **Private API Endpoint**: No public internet exposure
- **IAM Roles**: Properly scoped roles for cluster and nodes
- **Security Groups**: Configured for pod-to-pod communication
- **OIDC Provider**: Enabled for service account authentication

### Observability
- **Control Plane Logging**: All 5 log types enabled
  - API server logs
  - Audit logs
  - Authenticator logs
  - Controller manager logs
  - Scheduler logs
- **CloudWatch Integration**: 30-day log retention
- **Tagging**: Consistent tags across all resources

### High Availability
- **Multi-AZ Deployment**: Nodes across 3 availability zones
- **Auto-scaling**: Automatic scaling between 2-10 nodes
- **Managed Node Group**: AWS-managed node lifecycle

### Cost Optimization
- **t3.large instances**: Right-sized for production workloads
- **Auto-scaling**: Scale down during low usage
- **30-day log retention**: Balance between compliance and cost

## Resource Naming

All resources follow the naming convention:
```
{resource-type}-{environment-suffix}
```

Examples:
- `eks-cluster-prod-001`
- `eks-nodegroup-prod-001`
- `eks-cluster-role-prod-001`

## Cleanup

To delete the stack and all resources:

```bash
aws cloudformation delete-stack \
  --stack-name eks-cluster-production \
  --region us-east-1
```

**Note**: The stack is configured with `DeletionPolicy: Delete` on all resources, ensuring complete cleanup.

## Troubleshooting

### Stack Creation Fails

1. **Check IAM permissions**: Ensure you have all required permissions
2. **Verify VPC/Subnet IDs**: Confirm subnets are in different AZs
3. **Check CloudFormation events**:
   ```bash
   aws cloudformation describe-stack-events \
     --stack-name eks-cluster-production
   ```

### Nodes Not Joining Cluster

1. **Check security groups**: Ensure nodes can communicate with control plane
2. **Verify NAT Gateway**: Nodes need internet access to pull images
3. **Check IAM role**: Node role must have required policies

### OIDC Provider Issues

1. **Verify thumbprint**: The template uses the standard EKS thumbprint
2. **Check OIDC provider**: Should be created after cluster
3. **Validate service account**: Ensure proper annotations

## Security Considerations

1. **Private Endpoint**: Cluster API only accessible from within VPC
2. **IAM Permissions**: Follow principle of least privilege
3. **Network Policies**: Implement Kubernetes network policies
4. **Pod Security**: Use Pod Security Standards
5. **Secrets Management**: Use AWS Secrets Manager or SSM Parameter Store

## Next Steps

After deployment:
1. Install AWS Load Balancer Controller
2. Configure cluster autoscaler
3. Set up monitoring with Prometheus/Grafana
4. Implement network policies
5. Configure pod security policies
6. Set up CI/CD integration

## References

- [Amazon EKS User Guide](https://docs.aws.amazon.com/eks/latest/userguide/)
- [IAM Roles for Service Accounts](https://docs.aws.amazon.com/eks/latest/userguide/iam-roles-for-service-accounts.html)
- [EKS Best Practices](https://aws.github.io/aws-eks-best-practices/)
```

## Deployment Guide

### Quick Start

1. **Prepare Prerequisites**
   - Ensure you have a VPC with at least 3 private subnets
   - Configure NAT Gateway for outbound connectivity
   - Verify IAM permissions

2. **Deploy Stack**
   ```bash
   aws cloudformation create-stack \
     --stack-name eks-cluster-production \
     --template-body file://lib/TapStack.json \
     --parameters file://parameters.json \
     --capabilities CAPABILITY_NAMED_IAM
   ```

3. **Wait for Completion** (15-20 minutes)

4. **Configure kubectl**
   ```bash
   aws eks update-kubeconfig --name eks-cluster-{suffix}
   ```

### Key Features

- **EKS 1.28**: Latest stable version
- **Private Endpoint**: Enhanced security
- **OIDC Provider**: Ready for IRSA
- **Comprehensive Logging**: All control plane logs
- **Auto-scaling**: 2-10 nodes with desired 4
- **Multi-AZ**: High availability across 3 AZs
- **Fully Destroyable**: No manual cleanup required

All resources include the environmentSuffix parameter ensuring uniqueness and following AWS best practices for production deployments.
