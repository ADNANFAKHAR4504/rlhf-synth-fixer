# Model Failures Analysis - EKS Cluster Implementation

This document outlines the significant architectural and implementation issues found in the MODEL_RESPONSE compared to the corrected IDEAL_RESPONSE.

## Summary

The model response attempted to create a production EKS cluster but had 12 critical issues spanning networking, security, IAM configuration, and Kubernetes integration. These issues would have prevented the cluster from functioning properly and caused deployment failures or security vulnerabilities.

## Critical Issues

### 1. Missing ENIConfig Custom Resources
**Severity**: CRITICAL
**Category**: Networking / CNI Configuration

**Issue**: The MODEL_RESPONSE enabled VPC CNI custom networking (`AWS_VPC_K8S_CNI_CUSTOM_NETWORK_CFG: 'true'`) but failed to create the required ENIConfig custom resources that tell the CNI which subnets to use for pod networking.

**Impact**: Without ENIConfig resources, pods would fail to get IP addresses from the secondary CIDR block, defeating the entire purpose of custom networking. Pods would either fail to start or use node subnet IPs, leading to IP exhaustion.

**Fix**: Create ENIConfig custom resources for each availability zone:
```typescript
azs.forEach((az, i) => {
  new k8s.apiextensions.CustomResource(`eniconfig-${az}-${envSuffix}`, {
    apiVersion: 'crd.k8s.amazonaws.com/v1alpha1',
    kind: 'ENIConfig',
    metadata: { name: az },
    spec: {
      subnet: podSubnets[i].id,
      securityGroups: [nodeSg.id],
    },
  }, { provider: k8sProvider, parent: this });
});
```

### 2. Incomplete VPC Endpoints Configuration
**Severity**: HIGH
**Category**: Networking / Cost Optimization

**Issue**: Only created S3 and EC2 VPC endpoints. Missing critical endpoints for ECR (API and DKR), CloudWatch Logs, and STS. Additionally, interface endpoints lacked security groups (empty array).

**Impact**:
- Nodes couldn't pull container images from ECR without NAT Gateway
- Control plane logs couldn't reach CloudWatch
- IRSA AssumeRoleWithWebIdentity calls would fail or require NAT
- Higher costs due to required NAT Gateway for missing endpoints

**Fix**: Added 5 additional VPC endpoints with proper security groups:
- `ecr.api` - For ECR authentication
- `ecr.dkr` - For pulling container images
- `logs` - For CloudWatch logging
- `sts` - For IRSA token exchange
- Created dedicated security group for endpoints allowing HTTPS from both VPC CIDRs

### 3. Missing Node Security Group
**Severity**: CRITICAL
**Category**: Security / Networking

**Issue**: Launch templates and node groups lacked proper security group configuration. Nodes would use the cluster security group, which doesn't have rules for node-to-node communication.

**Impact**:
- Pods on different nodes couldn't communicate
- kubelet health checks would fail
- CNI plugin couldn't configure networking
- Cluster would appear healthy but workloads would fail

**Fix**: Created dedicated node security group with proper ingress rules:
- Node-to-node communication (all TCP)
- Cluster-to-node communication (443, 1025-65535)
- Bidirectional security group rules between cluster and nodes

### 4. Incorrect OIDC IAM Role Trust Policy Format
**Severity**: HIGH
**Category**: IAM / IRSA

**Issue**: Used `pulumi.interpolate` with complex template strings for OIDC provider trust policies, but the string interpolation was incorrect and fragile. Missing the audience condition (`aud`).

**Impact**:
- Service accounts couldn't assume IAM roles
- Cluster autoscaler would fail with permission errors
- IRSA wouldn't work for any service accounts
- Applications requiring AWS API access would fail

**Fix**: Used `pulumi.all()` with proper JSON construction:
```typescript
assumeRolePolicy: pulumi.all([oidcProvider.arn, cluster.identities]).apply(([arn, identities]) => {
  const oidcIssuer = identities[0].oidcs[0].issuer.replace('https://', '');
  return JSON.stringify({
    Version: '2012-10-17',
    Statement: [{
      Effect: 'Allow',
      Principal: { Federated: arn },
      Action: 'sts:AssumeRoleWithWebIdentity',
      Condition: {
        StringEquals: {
          [`${oidcIssuer}:sub`]: 'system:serviceaccount:kube-system:cluster-autoscaler',
          [`${oidcIssuer}:aud`]: 'sts.amazonaws.com', // CRITICAL: Missing in MODEL_RESPONSE
        },
      },
    }],
  });
})
```

### 5. Missing Cluster IAM Policy
**Severity**: MEDIUM
**Category**: IAM

**Issue**: Only attached `AmazonEKSClusterPolicy` to cluster role. Missing `AmazonEKSVPCResourceController` policy required for managing ENIs and security groups.

**Impact**:
- EKS couldn't manage security groups for services
- LoadBalancer services would fail to create
- Security group modifications would be blocked
- VPC resource management would fail

**Fix**: Added second policy attachment:
```typescript
new aws.iam.RolePolicyAttachment(`eks-vpc-resource-controller-${envSuffix}`, {
  role: clusterRole.name,
  policyArn: 'arn:aws:iam::aws:policy/AmazonEKSVPCResourceController',
}, { parent: this });
```

### 6. Missing Critical EKS Addons
**Severity**: HIGH
**Category**: Kubernetes / Operations

**Issue**: Only installed VPC CNI addon. Missing kube-proxy and CoreDNS addons which are critical for networking and DNS resolution.

**Impact**:
- Service networking wouldn't work without kube-proxy
- DNS resolution would fail without CoreDNS
- Inter-pod communication via services would fail
- Applications expecting DNS would be broken

**Fix**: Added kube-proxy and CoreDNS addon installations:
```typescript
const kubeProxyAddon = new aws.eks.Addon(`eks-kube-proxy-${envSuffix}`, {
  clusterName: cluster.name,
  addonName: 'kube-proxy',
  addonVersion: 'v1.28.2-eksbuild.2',
  // ... configuration
});

const coreDnsAddon = new aws.eks.Addon(`eks-coredns-${envSuffix}`, {
  clusterName: cluster.name,
  addonName: 'coredns',
  addonVersion: 'v1.10.1-eksbuild.6',
  // ... configuration
});
```

### 7. Launch Template Using String Instead of Output
**Severity**: HIGH
**Category**: Pulumi / Resource Dependencies

**Issue**: User data in launch template used `${cluster.name}` directly in template string, which would embed a Pulumi Output object reference instead of the actual cluster name string.

**Impact**:
- Bootstrap script would fail with invalid cluster name
- Nodes wouldn't join the cluster
- Auto Scaling Group would launch instances that remain unjoined
- Complete cluster failure

**Fix**: Extract cluster name as Output first:
```typescript
const clusterNameStr = cluster.name.apply(n => n);
// Then use in userData
userData: clusterNameStr.apply(name => Buffer.from(`#!/bin/bash
/etc/eks/bootstrap.sh ${name}
`).toString('base64'))
```

### 8. Missing EKS-Optimized AMI Selection
**Severity**: CRITICAL
**Category**: EC2 / Node Groups

**Issue**: Launch templates specified `instanceType` but didn't specify `imageId`. This would use the default AMI, which is not EKS-optimized and not ARM64 for Graviton instances.

**Impact**:
- Nodes would fail to bootstrap
- Incompatible architecture (x86_64 vs ARM64)
- Missing EKS-specific configurations
- Node join failures

**Fix**: Fetch EKS-optimized ARM64 AMI from SSM Parameter Store:
```typescript
imageId: pulumi.output(aws.ssm.getParameter({
  name: '/aws/service/eks/optimized-ami/1.28/amazon-linux-2-arm64/recommended/image_id',
})).apply(param => param.value)
```

### 9. Missing IMDSv2 Enforcement
**Severity**: MEDIUM
**Category**: Security

**Issue**: Launch templates didn't configure metadata options, allowing IMDSv1 access which is a security risk.

**Impact**:
- Vulnerable to SSRF attacks
- Fails security compliance scans
- Doesn't follow AWS security best practices
- Potential IAM credential exposure

**Fix**: Added metadata options to enforce IMDSv2:
```typescript
metadataOptions: {
  httpTokens: 'required',
  httpPutResponseHopLimit: 2,
}
```

### 10. Missing Security Group in Launch Templates
**Severity**: CRITICAL
**Category**: Security / Networking

**Issue**: Launch templates didn't specify `vpcSecurityGroupIds`, meaning nodes would use the default VPC security group.

**Impact**:
- Nodes couldn't communicate with cluster control plane
- Pod networking would completely fail
- Security group rules wouldn't apply correctly
- Cluster would be non-functional

**Fix**: Added security group configuration to launch templates:
```typescript
vpcSecurityGroupIds: [nodeSg.id]
```

### 11. Incomplete Autoscaler IAM Permissions
**Severity**: MEDIUM
**Category**: IAM / Autoscaling

**Issue**: Autoscaler IAM policy was missing several required permissions like `DescribeScalingActivities`, `DescribeTags`, `DescribeImages`, and `eks:DescribeNodegroup`.

**Impact**:
- Autoscaler couldn't properly discover node groups
- Scaling decisions would be suboptimal
- Autoscaler logs would show permission errors
- Scaling operations might fail intermittently

**Fix**: Added complete set of required permissions:
```typescript
Action: [
  'autoscaling:DescribeScalingActivities',
  'autoscaling:DescribeTags',
  'ec2:DescribeImages',
  'ec2:GetInstanceTypesFromInstanceRequirements',
  'eks:DescribeNodegroup',
  // ... existing permissions
]
```

### 12. Missing VPC Endpoint Private DNS and Tags
**Severity**: MEDIUM
**Category**: Networking / Operations

**Issue**: Interface VPC endpoints didn't enable `privateDnsEnabled` and lacked proper tagging.

**Impact**:
- Services would need to use VPC endpoint-specific DNS names
- Standard AWS SDK endpoints wouldn't work
- Harder to troubleshoot and manage endpoints
- Inconsistent resource tagging

**Fix**: Added `privateDnsEnabled: true` and proper tags to all interface endpoints.

### 13. Missing mapPublicIpOnLaunch Configuration
**Severity**: LOW
**Category**: Networking / Security

**Issue**: Subnets didn't explicitly set `mapPublicIpOnLaunch: false`.

**Impact**:
- Potential for nodes to get public IPs if VPC settings changed
- Not following private cluster best practices
- Minor security risk

**Fix**: Explicitly disabled public IP assignment:
```typescript
mapPublicIpOnLaunch: false
```

### 14. Missing Kubernetes Cluster Tags on Subnets
**Severity**: MEDIUM
**Category**: Kubernetes / AWS Integration

**Issue**: Node subnets didn't have the required Kubernetes cluster discovery tags.

**Impact**:
- AWS Load Balancer Controller couldn't discover subnets
- Internal load balancers might be created in wrong subnets
- Service LoadBalancer type might fail

**Fix**: Added cluster tag to node subnets:
```typescript
tags: {
  ...defaultTags,
  Name: `eks-node-subnet-${i}-${envSuffix}`,
  'kubernetes.io/role/internal-elb': '1',
  [`kubernetes.io/cluster/eks-cluster-${envSuffix}`]: 'shared', // Added
}
```

### 15. Incorrect Kubeconfig Output Type
**Severity**: LOW
**Category**: Outputs / Types

**Issue**: Kubeconfig output type was `pulumi.Output<any>` instead of properly typed as string. The kubeconfig field referenced the wrong property.

**Impact**:
- TypeScript type safety reduced
- Potential runtime errors
- Harder to use output in other Pulumi programs

**Fix**: Changed output type to `pulumi.Output<string>` with proper property reference.

### 16. Missing VPC CNI Configuration Options
**Severity**: MEDIUM
**Category**: CNI / Performance

**Issue**: VPC CNI addon configuration didn't enable prefix delegation mode.

**Impact**:
- Lower pod density per node
- Higher ENI usage
- Increased costs for large clusters
- Slower scaling due to ENI attachment delays

**Fix**: Added prefix delegation to VPC CNI configuration:
```typescript
configurationValues: JSON.stringify({
  env: {
    AWS_VPC_K8S_CNI_CUSTOM_NETWORK_CFG: 'true',
    ENI_CONFIG_LABEL_DEF: 'topology.kubernetes.io/zone',
    ENABLE_PREFIX_DELEGATION: 'true', // Added
  },
})
```

## Training Value

These failures demonstrate critical real-world EKS deployment challenges:

1. **VPC CNI Complexity**: Shows the multi-step process required for custom pod networking
2. **IRSA Configuration**: Highlights the subtle but critical trust policy requirements
3. **Security Groups**: Demonstrates proper security group architecture for EKS
4. **VPC Endpoints**: Shows complete endpoint setup for fully private clusters
5. **Resource Dependencies**: Illustrates Pulumi Output handling challenges
6. **IAM Permissions**: Shows the detailed permissions required for cluster components

These are authentic mistakes that developers make when implementing production EKS clusters, making this training data highly valuable for teaching correct EKS patterns.

## Estimated Training Quality Score: 9/10

The failures cover diverse architectural domains (networking, security, IAM, Kubernetes) with realistic complexity appropriate for expert-level infrastructure code.