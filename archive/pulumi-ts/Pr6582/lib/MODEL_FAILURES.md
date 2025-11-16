# Model Response Failures Analysis

This document analyzes the critical failures discovered during the QA validation process for the EKS infrastructure deployment using Pulumi TypeScript.

## Deployment Summary

**Platform**: Pulumi
**Language**: TypeScript
**Region**: us-east-1
**Total Deployment Attempts**: 3
**Final Status**: FAILED - Multiple Critical Issues

### Attempt Timeline

1. **Attempt 1**: Failed - Node groups could not join cluster (Bottlerocket AMI configuration issue)
2. **Attempt 2**: Failed - Same node group issue, plus Calico helm timeout
3. **Attempt 3**: Failed - AWS Quota limit (Elastic IPs) due to incomplete cleanup from previous attempts

## Critical Failures

### 1. Bottlerocket AMI Without Required User Data

**Impact Level**: Critical

**MODEL_RESPONSE Issue**:
The code in `lib/node-groups-stack.ts` uses Bottlerocket AMI with custom launch templates but does not provide the required user data for EKS cluster joining:

```typescript
// Lines 38-45 in MODEL_RESPONSE
const bottlerocketAmi = aws.ec2.getAmiOutput({
  mostRecent: true,
  owners: ['amazon'],
  filters: [
    { name: 'name', values: ['bottlerocket-aws-k8s-1.28-x86_64-*'] },
    { name: 'virtualization-type', values: ['hvm'] },
  ],
});

// Lines 109-148: Launch template WITHOUT user data
const generalLaunchTemplate = new aws.ec2.LaunchTemplate(
  `eks-general-lt-${environmentSuffix}`,
  {
    imageId: bottlerocketAmi.id,
    instanceType: 't3.large',
    // ... NO userData field specified
  }
);
```

**IDEAL_RESPONSE Fix**:
Remove custom launch templates and use EKS-managed node groups with default configuration:

```typescript
// No custom launch template or Bottlerocket AMI required
const generalNodeGroup = new aws.eks.NodeGroup(
  `eks-general-ng-${environmentSuffix}`,
  {
    clusterName: clusterName,
    nodeGroupName: `general-${environmentSuffix}`,
    nodeRoleArn: nodeRole.apply(r => r.arn),
    subnetIds: privateSubnetIds,
    instanceTypes: ['t3.large'],  // Direct instance type specification
    diskSize: 100,                 // EKS manages the AMI and user data
    scalingConfig: {
      minSize: 2,
      maxSize: 10,
      desiredSize: 2,
    },
    labels: {
      workload: 'general',
    },
  }
);
```

**Root Cause**:
Bottlerocket AMI requires specific TOML-formatted user data to configure the Kubernetes cluster endpoint, certificate, and other bootstrap parameters. Without this user data, EC2 instances launch but cannot join the EKS cluster, resulting in "NodeCreationFailure: Instances failed to join the kubernetes cluster".

**AWS Documentation Reference**:
https://docs.aws.amazon.com/eks/latest/userguide/launch-templates.html#launch-template-custom-ami

**Deployment Impact**:
- Both node groups (general and compute) failed with status CREATE_FAILED
- Error message: "NodeCreationFailure: Instances failed to join the kubernetes cluster"
- Deployment blocked - no worker nodes available for workload scheduling
- Total wasted time: ~30 minutes per attempt (2 attempts = ~60 minutes)

---

### 2. Unresolved Pulumi Output in Tag Template Literal

**Impact Level**: High

**MODEL_RESPONSE Issue**:
In `lib/node-groups-stack.ts`, lines 212-218 and 243-249, the code uses a Pulumi Output value (`clusterName`) directly in a template literal within tags:

```typescript
// Incorrect - clusterName is pulumi.Output<string>
tags: pulumi.all([tags]).apply(([t]) => ({
  ...t,
  'k8s.io/cluster-autoscaler/enabled': 'true',
  [`k8s.io/cluster-autoscaler/${clusterName}`]: 'owned',  // ERROR: clusterName not resolved
  'k8s.io/cluster-autoscaler/node-template/label/workload': 'general',
  priority: '10',
})),
```

**IDEAL_RESPONSE Fix**:
Include `clusterName` in the `pulumi.all()` array to properly resolve the Output:

```typescript
// Correct - clusterName properly resolved in apply context
tags: pulumi.all([tags, clusterName]).apply(([t, cn]) => ({
  ...t,
  'k8s.io/cluster-autoscaler/enabled': 'true',
  [`k8s.io/cluster-autoscaler/${cn}`]: 'owned',  // cn is resolved string value
  'k8s.io/cluster-autoscaler/node-template/label/workload': 'general',
  priority: '10',
})),
```

**Root Cause**:
Pulumi's Output<T> type represents values that are not yet known during the program execution. When used in a template literal without being unwrapped via `apply()`, it creates an invalid tag key containing the object representation instead of the actual cluster name string.

**Deployment Impact**:
- API error: "invalid character '\\n' in string literal" (400 Bad Request from EKS API)
- Node group creation failed in first deployment attempt
- Required code fix and redeployment

---

### 3. Calico Helm Chart Timeout

**Impact Level**: High

**MODEL_RESPONSE Issue**:
In `lib/calico-stack.ts` and `lib/tap-stack.ts`, the Calico helm chart is deployed immediately after the EKS cluster is created, without waiting for node groups to be ready:

```typescript
// lib/tap-stack.ts, lines 105-114
const calicoStack = new CalicoStack(
  'calico-cni',
  {
    environmentSuffix,
    kubeconfig: eksCluster.kubeconfig,
    clusterOidcProvider: eksCluster.oidcProvider,
  },
  { parent: this }  // No dependsOn for node groups!
);
```

**IDEAL_RESPONSE Fix**:
Add explicit dependency on node groups:

```typescript
const calicoStack = new CalicoStack(
  'calico-cni',
  {
    environmentSuffix,
    kubeconfig: eksCluster.kubeconfig,
    clusterOidcProvider: eksCluster.oidcProvider,
  },
  {
    parent: this,
    dependsOn: [nodeGroups]  // Wait for nodes to be available
  }
);
```

**Root Cause**:
Helm charts deploy Kubernetes resources (DaemonSets, Deployments) that require worker nodes to schedule pods. If Helm attempts to install before nodes are available and ready, the installation times out waiting for pods to become ready.

**Deployment Impact**:
- Helm release status: FAILED
- Error: "context deadline exceeded" after 378 seconds (6.3 minutes)
- Calico CNI not installed, affecting pod networking
- Subsequent K8s resources (autoscaler, LB controller, network policies) also failed

---

### 4. Incomplete Resource Cleanup Between Deployments

**Impact Level**: Medium

**MODEL_RESPONSE Issue**:
The code does not include proper cleanup mechanisms or stack state management. When deployments fail partway through, resources remain in AWS but Pulumi state becomes corrupted or incomplete.

**Observed Symptoms**:
- Attempt 3 failed with: "AddressLimitExceeded: The maximum number of addresses has been reached"
- 5 Elastic IPs from previous attempts still allocated
- 3 NAT Gateways from previous attempts still running
- VPC, subnets, route tables, and security groups orphaned
- IAM roles and policies left behind

**IDEAL_RESPONSE Fix**:
The code should include:
1. Proper error handling and rollback mechanisms
2. Stack state management to track partial deployments
3. Cleanup scripts or destroy operations before retry
4. Resource tags for easier identification and bulk cleanup

**Root Cause**:
When Pulumi deployments fail mid-execution (especially with EKS which takes 10-15 minutes), resources are created but not tracked in the stack state if the deployment errors before completion. This leaves orphaned resources that consume quotas and incur costs.

**Cost/Performance Impact**:
- 3 NAT Gateways: ~$0.045/hour × 3 = $0.135/hour (~$97/month if left running)
- 5 Elastic IPs: $0.005/hour × 5 = $0.025/hour (~$18/month)
- Blocked subsequent deployments due to quota limits
- Required manual AWS CLI cleanup scripts

---

### 5. Missing Dependency Chain for Kubernetes Resources

**Impact Level**: Medium

**MODEL_RESPONSE Issue**:
Multiple Kubernetes resource stacks (cluster-autoscaler, load-balancer-controller, network-policies) are created in parallel without explicit dependencies on:
1. Node groups being ready
2. Calico CNI being installed and functional

```typescript
// lib/tap-stack.ts, lines 116-158
const _autoscalerStack = new ClusterAutoscalerStack(...);
const _lbControllerStack = new LoadBalancerControllerStack(...);
const _networkPolicies = new NetworkPoliciesStack(...);
// All depend on calicoStack, but NOT on nodeGroups being ACTIVE
```

**IDEAL_RESPONSE Fix**:
```typescript
// Ensure nodes are ready first
const nodeGroups = new NodeGroupsStack(...);

// Then install CNI
const calicoStack = new CalicoStack(
  ...,
  { parent: this, dependsOn: [nodeGroups] }
);

// Finally install other K8s resources
const _autoscalerStack = new ClusterAutoscalerStack(
  ...,
  { parent: this, dependsOn: [calicoStack, nodeGroups] }
);
```

**Root Cause**:
Pulumi executes resource creation in parallel when dependencies are not explicitly declared. This optimization backfires when the creation order matters for functional correctness (nodes → CNI → workloads).

**Deployment Impact**:
- Kubernetes providers fail to connect
- Helm releases time out
- Deployment becomes non-deterministic (works sometimes, fails others)

---

## Summary

- **Total failures identified**: 5 (3 Critical, 2 High, 0 Medium, 0 Low)
- **Primary knowledge gaps**:
  1. Bottlerocket AMI configuration requirements for EKS
  2. Pulumi Output handling in template literals and dynamic keys
  3. Kubernetes resource deployment dependencies and timing

- **Training value**: HIGH
  - Multiple fundamental misunderstandings of EKS node bootstrapping
  - Pulumi-specific programming model issues (Output unwrapping)
  - Infrastructure orchestration and dependency management gaps
  - Resource lifecycle management and cleanup requirements

## Recommended Model Training Focus

1. **AWS EKS Best Practices**:
   - When to use custom launch templates vs. managed node groups
   - Bottlerocket AMI bootstrap requirements
   - Node group healthcheck and join failures troubleshooting

2. **Pulumi Programming Model**:
   - Proper use of `pulumi.all()` for combining multiple Outputs
   - Output unwrapping in apply() contexts
   - Template literal handling with Output values

3. **Kubernetes Deployment Orchestration**:
   - CNI installation timing and dependencies
   - Helm chart readiness and timeout configuration
   - Node availability requirements for workload scheduling

4. **Infrastructure State Management**:
   - Partial deployment failure handling
   - Resource cleanup and orphan prevention
   - Quota management and pre-flight checks

This implementation would require significant rework to be production-ready. The issues identified are not minor configuration problems but fundamental architecture and implementation errors that prevent successful deployment.
