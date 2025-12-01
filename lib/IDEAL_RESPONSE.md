# Production EKS Cluster Infrastructure - IDEAL Implementation

This implementation provides a complete, self-sufficient CloudFormation solution for deploying a production-ready Amazon EKS cluster with all prerequisites, comprehensive security, monitoring, and operational readiness.

## Architecture Overview

The solution consists of two CloudFormation stacks:
1. **VPC Prerequisites Stack**: Creates VPC, subnets, NAT Gateway with proper tagging
2. **EKS Cluster Stack**: Deploys EKS cluster, managed node groups, IAM roles, OIDC provider, and monitoring

## File: lib/VPCPrerequisite.json

```json
{
  "AWSTemplateFormatVersion": "2010-09-09",
  "Description": "VPC infrastructure prerequisites for EKS cluster deployment",
  "Parameters": {
    "EnvironmentSuffix": {
      "Type": "String",
      "Description": "Unique suffix for resource naming",
      "MinLength": 1,
      "MaxLength": 20,
      "AllowedPattern": "[a-z0-9-]+",
      "ConstraintDescription": "Must contain only lowercase letters, numbers, and hyphens"
    },
    "Environment": {
      "Type": "String",
      "Description": "Environment tag value",
      "Default": "production",
      "AllowedValues": ["development", "staging", "production"]
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
          { "Key": "Name", "Value": { "Fn::Sub": "eks-vpc-${EnvironmentSuffix}" }},
          { "Key": "Environment", "Value": { "Ref": "Environment" }},
          { "Key": { "Fn::Sub": "kubernetes.io/cluster/eks-cluster-${EnvironmentSuffix}" }, "Value": "shared" }
        ]
      }
    },
    "InternetGateway": {
      "Type": "AWS::EC2::InternetGateway",
      "Properties": {
        "Tags": [
          { "Key": "Name", "Value": { "Fn::Sub": "eks-igw-${EnvironmentSuffix}" }}
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
        "CidrBlock": "10.0.1.0/24",
        "AvailabilityZone": "us-east-1a",
        "MapPublicIpOnLaunch": true,
        "Tags": [
          { "Key": "Name", "Value": { "Fn::Sub": "eks-public-subnet-1-${EnvironmentSuffix}" }},
          { "Key": { "Fn::Sub": "kubernetes.io/cluster/eks-cluster-${EnvironmentSuffix}" }, "Value": "shared" },
          { "Key": "kubernetes.io/role/elb", "Value": "1" }
        ]
      }
    },
    "PrivateSubnet1": {
      "Type": "AWS::EC2::Subnet",
      "Properties": {
        "VpcId": { "Ref": "VPC" },
        "CidrBlock": "10.0.10.0/24",
        "AvailabilityZone": "us-east-1a",
        "Tags": [
          { "Key": "Name", "Value": { "Fn::Sub": "eks-private-subnet-1-${EnvironmentSuffix}" }},
          { "Key": { "Fn::Sub": "kubernetes.io/cluster/eks-cluster-${EnvironmentSuffix}" }, "Value": "shared" },
          { "Key": "kubernetes.io/role/internal-elb", "Value": "1" }
        ]
      }
    },
    "PrivateSubnet2": {
      "Type": "AWS::EC2::Subnet",
      "Properties": {
        "VpcId": { "Ref": "VPC" },
        "CidrBlock": "10.0.11.0/24",
        "AvailabilityZone": "us-east-1b",
        "Tags": [
          { "Key": "Name", "Value": { "Fn::Sub": "eks-private-subnet-2-${EnvironmentSuffix}" }},
          { "Key": { "Fn::Sub": "kubernetes.io/cluster/eks-cluster-${EnvironmentSuffix}" }, "Value": "shared" },
          { "Key": "kubernetes.io/role/internal-elb", "Value": "1" }
        ]
      }
    },
    "PrivateSubnet3": {
      "Type": "AWS::EC2::Subnet",
      "Properties": {
        "VpcId": { "Ref": "VPC" },
        "CidrBlock": "10.0.12.0/24",
        "AvailabilityZone": "us-east-1c",
        "Tags": [
          { "Key": "Name", "Value": { "Fn::Sub": "eks-private-subnet-3-${EnvironmentSuffix}" }},
          { "Key": { "Fn::Sub": "kubernetes.io/cluster/eks-cluster-${EnvironmentSuffix}" }, "Value": "shared" },
          { "Key": "kubernetes.io/role/internal-elb", "Value": "1" }
        ]
      }
    },
    "NATGatewayEIP": {
      "Type": "AWS::EC2::EIP",
      "DependsOn": "AttachGateway",
      "Properties": {
        "Domain": "vpc"
      }
    },
    "NATGateway": {
      "Type": "AWS::EC2::NatGateway",
      "Properties": {
        "AllocationId": { "Fn::GetAtt": ["NATGatewayEIP", "AllocationId"] },
        "SubnetId": { "Ref": "PublicSubnet1" },
        "Tags": [
          { "Key": "Name", "Value": { "Fn::Sub": "eks-nat-${EnvironmentSuffix}" }}
        ]
      }
    },
    "PublicRouteTable": {
      "Type": "AWS::EC2::RouteTable",
      "Properties": {
        "VpcId": { "Ref": "VPC" },
        "Tags": [
          { "Key": "Name", "Value": { "Fn::Sub": "eks-public-rt-${EnvironmentSuffix}" }}
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
    "PrivateRouteTable": {
      "Type": "AWS::EC2::RouteTable",
      "Properties": {
        "VpcId": { "Ref": "VPC" },
        "Tags": [
          { "Key": "Name", "Value": { "Fn::Sub": "eks-private-rt-${EnvironmentSuffix}" }}
        ]
      }
    },
    "PrivateRoute": {
      "Type": "AWS::EC2::Route",
      "Properties": {
        "RouteTableId": { "Ref": "PrivateRouteTable" },
        "DestinationCidrBlock": "0.0.0.0/0",
        "NatGatewayId": { "Ref": "NATGateway" }
      }
    },
    "PublicSubnetRouteTableAssociation": {
      "Type": "AWS::EC2::SubnetRouteTableAssociation",
      "Properties": {
        "SubnetId": { "Ref": "PublicSubnet1" },
        "RouteTableId": { "Ref": "PublicRouteTable" }
      }
    },
    "PrivateSubnet1RouteTableAssociation": {
      "Type": "AWS::EC2::SubnetRouteTableAssociation",
      "Properties": {
        "SubnetId": { "Ref": "PrivateSubnet1" },
        "RouteTableId": { "Ref": "PrivateRouteTable" }
      }
    },
    "PrivateSubnet2RouteTableAssociation": {
      "Type": "AWS::EC2::SubnetRouteTableAssociation",
      "Properties": {
        "SubnetId": { "Ref": "PrivateSubnet2" },
        "RouteTableId": { "Ref": "PrivateRouteTable" }
      }
    },
    "PrivateSubnet3RouteTableAssociation": {
      "Type": "AWS::EC2::SubnetRouteTableAssociation",
      "Properties": {
        "SubnetId": { "Ref": "PrivateSubnet3" },
        "RouteTableId": { "Ref": "PrivateRouteTable" }
      }
    }
  },
  "Outputs": {
    "VPCId": {
      "Description": "VPC ID for EKS cluster",
      "Value": { "Ref": "VPC" },
      "Export": { "Name": { "Fn::Sub": "${AWS::StackName}-VPCId" }}
    },
    "PrivateSubnet1Id": {
      "Description": "Private Subnet 1 ID",
      "Value": { "Ref": "PrivateSubnet1" },
      "Export": { "Name": { "Fn::Sub": "${AWS::StackName}-PrivateSubnet1" }}
    },
    "PrivateSubnet2Id": {
      "Description": "Private Subnet 2 ID",
      "Value": { "Ref": "PrivateSubnet2" },
      "Export": { "Name": { "Fn::Sub": "${AWS::StackName}-PrivateSubnet2" }}
    },
    "PrivateSubnet3Id": {
      "Description": "Private Subnet 3 ID",
      "Value": { "Ref": "PrivateSubnet3" },
      "Export": { "Name": { "Fn::Sub": "${AWS::StackName}-PrivateSubnet3" }}
    }
  }
}
```

## File: lib/TapStack.json (Enhanced)

The main EKS template remains largely the same as the MODEL_RESPONSE with these key additions:

1. **Cluster Autoscaler Tags** added to NodeGroup:
```json
{
  "NodeGroup": {
    "Properties": {
      "Tags": {
        "k8s.io/cluster-autoscaler/enabled": "true",
        "k8s.io/cluster-autoscaler/eks-cluster-${EnvironmentSuffix}": "owned"
      }
    }
  }
}
```

2. **Container Insights Addon**:
```json
{
  "ContainerInsightsAddon": {
    "Type": "AWS::EKS::Addon",
    "Properties": {
      "ClusterName": { "Ref": "EKSCluster" },
      "AddonName": "amazon-cloudwatch-observability",
      "AddonVersion": "v1.5.1-eksbuild.1",
      "ResolveConflicts": "OVERWRITE"
    },
    "DependsOn": ["EKSCluster", "NodeGroup"]
  }
}
```

3. **VPC CNI Addon**:
```json
{
  "VPCCNIAddon": {
    "Type": "AWS::EKS::Addon",
    "Properties": {
      "ClusterName": { "Ref": "EKSCluster" },
      "AddonName": "vpc-cni",
      "AddonVersion": "v1.16.0-eksbuild.1",
      "ResolveConflicts": "OVERWRITE"
    },
    "DependsOn": ["EKSCluster"]
  }
}
```

## File: lib/README.md (Enhanced)

```markdown
# Production EKS Cluster - Complete CloudFormation Solution

## Quick Start

### Step 1: Deploy VPC Prerequisites
```bash
aws cloudformation create-stack \
  --stack-name EKSVPCPrerequisite-${ENVIRONMENT_SUFFIX} \
  --template-body file://lib/VPCPrerequisite.json \
  --parameters ParameterKey=EnvironmentSuffix,ParameterValue=${ENVIRONMENT_SUFFIX} \
  --region us-east-1

# Wait for completion (3-5 minutes)
aws cloudformation wait stack-create-complete \
  --stack-name EKSVPCPrerequisite-${ENVIRONMENT_SUFFIX}
```

### Step 2: Get VPC Stack Outputs
```bash
VPC_ID=$(aws cloudformation describe-stacks \
  --stack-name EKSVPCPrerequisite-${ENVIRONMENT_SUFFIX} \
  --query 'Stacks[0].Outputs[?OutputKey==`VPCId`].OutputValue' \
  --output text)

PRIVATE_SUBNET_1=$(aws cloudformation describe-stacks \
  --stack-name EKSVPCPrerequisite-${ENVIRONMENT_SUFFIX} \
  --query 'Stacks[0].Outputs[?OutputKey==`PrivateSubnet1Id`].OutputValue' \
  --output text)

PRIVATE_SUBNET_2=$(aws cloudformation describe-stacks \
  --stack-name EKSVPCPrerequisite-${ENVIRONMENT_SUFFIX} \
  --query 'Stacks[0].Outputs[?OutputKey==`PrivateSubnet2Id`].OutputValue' \
  --output text)

PRIVATE_SUBNET_3=$(aws cloudformation describe-stacks \
  --stack-name EKSVPCPrerequisite-${ENVIRONMENT_SUFFIX} \
  --query 'Stacks[0].Outputs[?OutputKey==`PrivateSubnet3Id`].OutputValue' \
  --output text)
```

### Step 3: Deploy EKS Cluster
```bash
aws cloudformation create-stack \
  --stack-name TapStack${ENVIRONMENT_SUFFIX} \
  --template-body file://lib/TapStack.json \
  --parameters \
    ParameterKey=EnvironmentSuffix,ParameterValue=${ENVIRONMENT_SUFFIX} \
    ParameterKey=VpcId,ParameterValue=${VPC_ID} \
    ParameterKey=PrivateSubnetIds,ParameterValue="${PRIVATE_SUBNET_1}\\,${PRIVATE_SUBNET_2}\\,${PRIVATE_SUBNET_3}" \
    ParameterKey=ControlPlaneSubnetIds,ParameterValue="${PRIVATE_SUBNET_1}\\,${PRIVATE_SUBNET_2}\\,${PRIVATE_SUBNET_3}" \
  --capabilities CAPABILITY_NAMED_IAM \
  --region us-east-1

# Wait for completion (15-20 minutes)
aws cloudformation wait stack-create-complete \
  --stack-name TapStack${ENVIRONMENT_SUFFIX}
```

### Step 4: Configure kubectl Access

Since the cluster has a private endpoint, you need to access it from within the VPC:

**Option A: AWS Systems Manager Session Manager** (Recommended)
```bash
# Launch session to any EC2 instance in the same VPC
aws ssm start-session --target i-xxxxxxxxx

# Then configure kubectl
aws eks update-kubeconfig --name eks-cluster-${ENVIRONMENT_SUFFIX} --region us-east-1
```

**Option B: VPN or Direct Connect**
Configure AWS Client VPN or use existing Direct Connect connection.

## Post-Deployment Configuration

### Install Cluster Autoscaler
```bash
kubectl apply -f https://raw.githubusercontent.com/kubernetes/autoscaler/master/cluster-autoscaler/cloudprovider/aws/examples/cluster-autoscaler-autodiscover.yaml

kubectl -n kube-system annotate deployment.apps/cluster-autoscaler \
  cluster-autoscaler.kubernetes.io/safe-to-evict="false"

kubectl -n kube-system set image deployment.apps/cluster-autoscaler \
  cluster-autoscaler=registry.k8s.io/autoscaling/cluster-autoscaler:v1.28.2
```

### Configure Pod Security Standards
```bash
kubectl label namespace default \
  pod-security.kubernetes.io/enforce=restricted \
  pod-security.kubernetes.io/audit=restricted \
  pod-security.kubernetes.io/warn=restricted
```

### Verify Container Insights
```bash
# Check CloudWatch metrics
aws cloudwatch list-metrics \
  --namespace ContainerInsights \
  --dimensions Name=ClusterName,Value=eks-cluster-${ENVIRONMENT_SUFFIX}
```

## Cost Optimization

**Estimated Monthly Cost**:
- VPC: ~$45/month (NAT Gateway)
- EKS Control Plane: $73/month
- Worker Nodes (4 × t3.large): ~$240/month
- CloudWatch Logs: ~$5-15/month
- Container Insights: ~$10-30/month
- **Total: ~$373-403/month**

**Optimization Tips**:
1. Use Cluster Autoscaler to scale down during off-hours
2. Consider Spot Instances for non-production workloads
3. Enable VPC Flow Logs only for troubleshooting
4. Use log retention policies to reduce CloudWatch costs

## Security Best Practices

1. **Network Policies**: Implement Calico or Cilium for pod-to-pod security
2. **Secrets Management**: Use AWS Secrets Manager with IRSA
3. **RBAC**: Configure role-based access control
4. **Image Scanning**: Enable ECR image scanning
5. **Pod Security**: Enforce Pod Security Standards

## Monitoring and Observability

- **Container Insights**: Enabled via EKS addon
- **Control Plane Logs**: All 5 log types enabled with 30-day retention
- **CloudWatch Metrics**: Pod/node metrics available
- **Prometheus**: Optionally install for application metrics

## Troubleshooting

### Cannot access cluster
- Ensure you're connecting from within the VPC (private endpoint only)
- Verify security group rules allow traffic
- Check IAM permissions for aws-auth ConfigMap

### Pods not scheduling
- Check node group status: `kubectl get nodes`
- Verify auto-scaling configuration
- Check pod resource requests

### High costs
- Review unused resources with AWS Cost Explorer
- Enable Cluster Autoscaler
- Consider Spot Instances for dev/test

## References

- [Amazon EKS Best Practices Guide](https://aws.github.io/aws-eks-best-practices/)
- [EKS Workshop](https://www.eksworkshop.com/)
- [Kubernetes Documentation](https://kubernetes.io/docs/)
```

## Key Improvements Over MODEL_RESPONSE

1. **Complete VPC Prerequisites**: Self-contained solution with VPC, subnets, NAT Gateway
2. **Proper Subnet Tagging**: EKS auto-discovery tags included
3. **Access Documentation**: Clear instructions for private cluster access
4. **Monitoring**: Container Insights addon included
5. **Autoscaling Tags**: Cluster Autoscaler tags on node group
6. **Post-Deployment Guide**: Security, monitoring, and operational setup
7. **Cost Transparency**: Clear cost breakdown and optimization tips
8. **Troubleshooting**: Common issues and solutions

## Deployment Flow

```
1. VPC Prerequisites (3-5 min)
   ↓
2. Get VPC Outputs
   ↓
3. Deploy EKS Cluster (15-20 min)
   ↓
4. Configure kubectl Access
   ↓
5. Post-Deployment Setup (10-15 min)
   - Cluster Autoscaler
   - Pod Security Standards
   - Network Policies
```

**Total Time: 30-40 minutes**

This solution is production-ready, fully documented, and follows AWS best practices for EKS deployments.
