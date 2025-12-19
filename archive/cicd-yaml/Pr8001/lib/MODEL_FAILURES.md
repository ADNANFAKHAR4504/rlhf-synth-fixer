# Model Response Failures Analysis

## Overview

The generated Pulumi Go code for ECS infrastructure optimization contains **10 critical compilation errors** that completely block deployment. These errors demonstrate fundamental misunderstandings of the Pulumi Go SDK API, type systems, and AWS service integration patterns.

## Critical Failures

### 1. Incorrect CloudWatch MetricAlarm Field Name

**Impact Level**: Critical

**MODEL_RESPONSE Issue**:
```go
_, err = cloudwatch.NewMetricAlarm(ctx, "alarm-id", &cloudwatch.MetricAlarmArgs{
    AlarmName: pulumi.Sprintf("alarm-name-%s", environmentSuffix),
    // ... other fields
})
```

The model used `AlarmName` as a field in `MetricAlarmArgs`, which doesn't exist in the Pulumi AWS SDK v6.

**IDEAL_RESPONSE Fix**:
```go
_, err = cloudwatch.NewMetricAlarm(ctx, "alarm-id", &cloudwatch.MetricAlarmArgs{
    Name: pulumi.Sprintf("alarm-name-%s", environmentSuffix),
    // ... other fields
})
```

**Root Cause**: Confusion between CloudFormation/Terraform field names (`AlarmName`) and Pulumi's Go SDK field names (`Name`). The model failed to consult the actual Pulumi AWS SDK documentation for the correct struct field names.

**AWS Documentation Reference**: [Pulumi AWS CloudWatch MetricAlarm](https://www.pulumi.com/registry/packages/aws/api-docs/cloudwatch/metricalarm/)

**Impact**: All 3 CloudWatch alarms fail to compile. This blocks monitoring and alerting functionality completely.

---

### 2. Non-existent SDK Function: ec2.GetSubnetIds

**Impact Level**: Critical

**MODEL_RESPONSE Issue**:
```go
privateSubnets, err := ec2.GetSubnetIds(ctx, &ec2.GetSubnetIdsArgs{
    VpcId: vpcID,
    Tags: map[string]string{
        "Name": fmt.Sprintf("ecs-private-subnet-*-%s", environmentSuffix),
    },
})
```

The function `ec2.GetSubnetIds` does not exist in Pulumi AWS SDK v6. This function appears in 2 files (ecs_service.go and load_balancer.go).

**IDEAL_RESPONSE Fix**:
```go
// Option 1: Pass subnet IDs from VPC creation
func createECSService(ctx *pulumi.Context, ..., privateSubnetIDs pulumi.StringArrayOutput, ...) {
    // Use privateSubnetIDs directly
}

// Option 2: Use ec2.LookupSubnet for specific subnets
subnet, err := ec2.LookupSubnet(ctx, &ec2.LookupSubnetArgs{
    VpcId: vpcID,
    Tags: map[string]string{"Name": subnetName},
})
```

**Root Cause**: The model hallucinated an API that doesn't exist. Pulumi doesn't have a `GetSubnetIds` plural function; it has `LookupSubnet` (singular) and `GetSubnets` (returns full subnet objects, not just IDs). The model failed to verify the actual SDK API.

**AWS Documentation Reference**: [Pulumi AWS EC2 Functions](https://www.pulumi.com/registry/packages/aws/api-docs/ec2/)

**Deployment Impact**: ECS service and load balancer creation fail completely. Without subnet configuration, no resources can be deployed.

---

### 3. Incorrect Pulumi Output Type Conversion

**Impact Level**: Critical

**MODEL_RESPONSE Issue**:
```go
vpcID = vpc.ID().ToStringOutput().ApplyT(func(id string) string {
    return id
}).(string)
```

This attempts to convert a `pulumi.StringOutput` to a Go `string` using type assertion, which is impossible and causes a compilation error.

**IDEAL_RESPONSE Fix**:
```go
// Store as pulumi.StringOutput
vpcID := vpc.ID().ToStringOutput()

// Update function signatures to accept pulumi.StringOutput
func createVPCEndpoints(ctx *pulumi.Context, vpcID pulumi.StringOutput, ...) {
    // Use vpcID directly in resource creation
}
```

**Root Cause**: Fundamental misunderstanding of Pulumi's asynchronous execution model. In Pulumi, resource outputs are `Output` types that resolve asynchronously during deployment. They cannot be converted to concrete values in the program code. This is a core concept in Pulumi that the model completely missed.

**Pulumi Documentation Reference**: [Understanding Outputs](https://www.pulumi.com/docs/concepts/inputs-outputs/)

**Impact**: The entire program fails to type-check. This error cascades through main.go, vpc_endpoints.go, load_balancer.go, and ecs_service.go.

---

### 4. Type Mismatch in Array Exports

**Impact Level**: Critical

**MODEL_RESPONSE Issue**:
```go
ctx.Export("vpcEndpoints", pulumi.ToStringArray(endpoints))
ctx.Export("ecrRepositories", pulumi.ToStringArray(repositories))
```

where `endpoints` and `repositories` are of type `[]pulumi.StringOutput`. The `pulumi.ToStringArray()` function expects `[]string`, not `[]pulumi.StringOutput`.

**IDEAL_RESPONSE Fix**:
```go
// Option 1: Export count instead
ctx.Export("vpcEndpointCount", pulumi.Int(len(endpoints)))
ctx.Export("ecrRepositoryCount", pulumi.Int(len(repositories)))

// Option 2: Convert each Output individually
ctx.Export("firstRepository", repositories[0])
```

**Root Cause**: Type system confusion. The model didn't understand that `pulumi.StringOutput` is fundamentally different from `string`, and array conversions don't automatically unwrap Output types.

**Impact**: Stack exports fail, preventing integration tests from accessing deployment outputs.

---

### 5. Incorrect VPC ID Parameter Type Propagation

**Impact Level**: High

**MODEL_RESPONSE Issue**:
Function signatures accept `string` for `vpcID` parameter:
```go
func createVPCEndpoints(ctx *pulumi.Context, vpcID string, ...) ([]pulumi.StringOutput, error)
func createLoadBalancer(ctx *pulumi.Context, vpcID string, ...) (...)
func createECSService(ctx *pulumi.Context, ..., vpcID string, ...) (...)
```

But main.go tries to pass `pulumi.StringOutput`:
```go
endpoints, err := createVPCEndpoints(ctx, vpcID, environmentSuffix)
```

**IDEAL_RESPONSE Fix**:
```go
// Update all function signatures to accept pulumi.StringOutput
func createVPCEndpoints(ctx *pulumi.Context, vpcID pulumi.StringOutput, ...) ([]pulumi.StringOutput, error) {
    // Use vpcID directly in SecurityGroupArgs and VpcEndpointArgs
    &ec2.SecurityGroupArgs{
        VpcId: vpcID,  // pulumi.StringOutput is valid here
    }
}
```

**Root Cause**: Incomplete refactoring. The model correctly identified that VPC ID should be an Output type in main.go but failed to update all dependent function signatures and usages.

**Impact**: Type mismatches throughout the codebase prevent compilation. 6+ files affected.

---

## High Priority Failures

### 6. Blue-Green Deployment Configuration Error

**Impact Level**: High

**MODEL_RESPONSE Issue**:
```go
DeploymentController: &ecs.ServiceDeploymentControllerArgs{
    Type: pulumi.String("CODE_DEPLOY"),
},
```

Blue-green deployment with CODE_DEPLOY requires AWS CodeDeploy application and deployment group setup, which are not created in the code.

**IDEAL_RESPONSE Fix**:
```go
// Either use ECS deployment controller
DeploymentController: &ecs.ServiceDeploymentControllerArgs{
    Type: pulumi.String("ECS"),  // Default, supports rolling updates
},

// OR create CodeDeploy resources first
codeDeployApp := codedeploy.NewApplication(ctx, "app", &codedeploy.ApplicationArgs{
    ComputePlatform: pulumi.String("ECS"),
})
// ... deployment group, etc.
```

**Root Cause**: Incomplete implementation of requirement #9 ("Implement blue-green deployment strategy"). The model specified CODE_DEPLOY but didn't create the required CodeDeploy resources.

**PROMPT.md Requirement**: "9. Implement blue-green deployment strategy for zero-downtime updates."

**Impact**: ECS service deployment will fail at runtime with "CodeDeploy application not found" error. Cost: Wasted deployment attempt (~$5).

---

### 7. Missing Subnet Configuration for VPC Endpoints

**Impact Level**: High

**MODEL_RESPONSE Issue**:
Interface VPC endpoints (ECR, CloudWatch, Secrets Manager) require subnet associations, but the code attempts to look up subnets using a non-existent function and provides no fallback.

**IDEAL_RESPONSE Fix**:
```go
// Pass subnet IDs from VPC creation
func createVPC(ctx *pulumi.Context, environmentSuffix string) (*ec2.Vpc, *VPCOutputs, error) {
    // ... create subnets

    return vpc, &VPCOutputs{
        VpcID:            vpc.ID(),
        PrivateSubnetIDs: pulumi.StringArray{privateSubnet1.ID(), privateSubnet2.ID(), privateSubnet3.ID()},
        PublicSubnetIDs:  pulumi.StringArray{publicSubnet1.ID(), publicSubnet2.ID(), publicSubnet3.ID()},
    }, nil
}

// Use in VPC endpoint creation
func createVPCEndpoints(ctx *pulumi.Context, vpcOutputs *VPCOutputs, ...) {
    ecrAPIEndpoint, err := ec2.NewVpcEndpoint(ctx, "ecr-api-endpoint", &ec2.VpcEndpointArgs{
        SubnetIds: vpcOutputs.PrivateSubnetIDs,
        // ...
    })
}
```

**Root Cause**: Poor architecture design. VPC creates subnets but doesn't return them. VPC endpoints try to look them up but use a non-existent function. No data flow between resources.

**PROMPT.md Requirement**: "2. Create VPC endpoints for ECR, S3, CloudWatch Logs, and Secrets Manager."

**Cost/Performance Impact**: Interface endpoints without subnet associations will fail to create. NAT Gateway elimination strategy fails, costing $500/month extra.

---

## Medium Priority Failures

### 8. Capacity Provider Configuration Missing Cluster Association

**Impact Level**: Medium

**MODEL_RESPONSE Issue**:
Capacity providers are created but never associated with the ECS cluster:
```go
spotCP, err := ecs.NewCapacityProvider(ctx, "fargate-spot-cp", &ecs.CapacityProviderArgs{
    Name: pulumi.Sprintf("fargate-spot-%s", environmentSuffix),
})
// No cluster association
```

**IDEAL_RESPONSE Fix**:
```go
// After creating capacity providers, associate with cluster
clusterCapacityProviders := ecs.NewClusterCapacityProviders(ctx, "cluster-cp", &ecs.ClusterCapacityProvidersArgs{
    ClusterName: cluster.Name,
    CapacityProviders: pulumi.StringArray{
        spotCP.Name,
        onDemandCP.Name,
    },
    DefaultCapacityProviderStrategies: ecs.ClusterCapacityProvidersDefaultCapacityProviderStrategyArray{
        &ecs.ClusterCapacityProvidersDefaultCapacityProviderStrategyArgs{
            CapacityProvider: spotCP.Name,
            Weight:           pulumi.Int(70),
        },
    },
})
```

**Root Cause**: Incomplete AWS ECS knowledge. Creating capacity providers doesn't automatically associate them with a cluster. An explicit `ClusterCapacityProviders` resource is required.

**PROMPT.md Requirement**: "1. Define Fargate Spot capacity providers with 70% spot ratio for non-critical services."

**Impact**: Capacity providers exist but aren't used. ECS service falls back to default FARGATE launch type, negating Spot cost savings ($1,200/month lost).

---

### 9. Task Definition Missing Container Image

**Impact Level**: Medium

**MODEL_RESPONSE Issue**:
Task definition references `repositories[0]` (ECR repository URL) but doesn't specify how to use it or which image tag:
```go
taskDef, err := createOptimizedTaskDefinition(ctx, repositories[0], params, environmentSuffix)
```

Inside `task_definition.go`, the container definition likely lacks a proper image reference.

**IDEAL_RESPONSE Fix**:
```go
ContainerDefinitions: pulumi.String(fmt.Sprintf(`[{
    "name": "app",
    "image": "%s:latest",
    "cpu": 256,
    "memory": 512,
    // ...
}]`, repositoryURL)),
```

Or use a placeholder image:
```go
"image": "nginx:latest",  // Placeholder for demo
```

**Root Cause**: Incomplete implementation. The PROMPT specifies optimizing existing infrastructure, but no existing images exist. The code should either use placeholder images or document the dependency.

**PROMPT.md Context**: "Production environment in us-east-1 with existing ECS cluster running 12 microservices"

**Impact**: Task definition may deploy but tasks won't start without valid container images. Deployment appears successful but services are non-functional.

---

### 10. Missing Error Handling for Dependent Resources

**Impact Level**: Medium

**MODEL_RESPONSE Issue**:
VPC endpoints are created before subnets exist, causing potential race conditions:
```go
// Create VPC
vpc, err := createVPC(ctx, environmentSuffix)

// Immediately create VPC endpoints that depend on subnets
endpoints, err := createVPCEndpoints(ctx, vpcID, environmentSuffix)
```

But inside `createVPCEndpoints`, subnet lookup happens without waiting for VPC creation to complete.

**IDEAL_RESPONSE Fix**:
```go
// Explicitly depend on VPC resources
endpoints, err := createVPCEndpoints(ctx, vpcOutputs, environmentSuffix, pulumi.DependsOn([]pulumi.Resource{vpc}))
```

Or structure code to pass subnet IDs explicitly (already addressed in Failure #7).

**Root Cause**: Lack of understanding of Pulumi's implicit dependency management. While Pulumi automatically tracks dependencies through Output types, explicit dependencies or correct data flow is still needed for proper ordering.

**Impact**: Intermittent deployment failures due to race conditions. Subnets may not exist when VPC endpoints try to reference them.

---

## Summary

- **Total failures**: 10 (4 Critical, 2 High, 4 Medium)
- **Files affected**: 6 Go files (main.go, vpc_endpoints.go, ecs_service.go, load_balancer.go, cloudwatch_alarms.go, ecs_cluster.go)
- **Primary knowledge gaps**:
  1. Pulumi Go SDK API (incorrect field names, non-existent functions)
  2. Pulumi Output type system (async execution model)
  3. Go type system (Output vs concrete types, array conversions)
  4. AWS service integration patterns (CodeDeploy setup, capacity provider association, VPC endpoint subnet requirements)
  5. Incomplete requirement implementation (blue-green deployment, subnet data flow)

- **Training value**: **VERY HIGH**
  - Demonstrates critical gaps in Pulumi SDK knowledge
  - Shows fundamental misunderstanding of asynchronous IaC execution
  - Reveals need for API documentation verification
  - Highlights importance of complete requirement implementation
  - Provides clear examples of correct vs incorrect patterns

- **Cost impact if deployed without fixes**: $1,700/month (lost Spot savings + unnecessary NAT Gateway costs)

- **Estimated fix time**: 4-6 hours for experienced Pulumi Go developer
