# Model Failures and Corrections

This document tracks issues encountered during implementation and their resolutions for training improvement.

## Issue 1: Missing KMS Key Policy for CloudWatch Logs

### What Went Wrong

**Error:** CloudWatch Log Group creation failed with:
```
Resource handler returned message: "The specified KMS key does not exist or is not allowed to be used with Arn 'arn:aws:logs:us-east-1:***:log-group:/ecs/payment-service-pr6906' (Service: CloudWatchLogs, Status Code: 400, Request ID: bd6ca935-483f-4605-b2c3-4d00851a4fd2)"
```

**Initial Implementation:**
```python
# ecs_cluster_construct.py - INCORRECT
self.log_key = kms.Key(
    self,
    f"LogKey-{environment_suffix}",
    description=f"KMS key for CloudWatch Logs encryption - {environment_suffix}",
    enable_key_rotation=True,
    removal_policy=cdk.RemovalPolicy.DESTROY
)
# Missing: KMS key policy statement for CloudWatch Logs service
```

**Evidence:**
- Deployment failed at CloudFormation CREATE_FAILED state
- All three log groups (payment, order, notification) failed simultaneously
- Stack rollback triggered
- Error code: InvalidRequest from CloudWatch Logs service

### Root Cause

When creating a customer-managed KMS key for CloudWatch Logs encryption, the key policy must explicitly grant permissions to the CloudWatch Logs service principal to use the key for encryption operations. By default, KMS keys only grant permissions to the account root user.

CloudWatch Logs needs the following permissions on the KMS key:
- `kms:Encrypt` - To encrypt log data
- `kms:Decrypt` - To decrypt log data for retrieval
- `kms:ReEncrypt*` - For key rotation
- `kms:GenerateDataKey*` - To generate data encryption keys
- `kms:CreateGrant` - For grant-based permissions
- `kms:DescribeKey` - To describe key properties

Additionally, the service principal must be region-specific: `logs.{region}.amazonaws.com`

The condition in the policy ensures the key can only be used for CloudWatch Logs resources in the same account by checking the encryption context.

### Correct Implementation

```python
# ecs_cluster_construct.py - CORRECT
from aws_cdk import aws_iam as iam

# Create KMS key for log encryption with proper policy
self.log_key = kms.Key(
    self,
    f"LogKey-{environment_suffix}",
    description=f"KMS key for CloudWatch Logs encryption - {environment_suffix}",
    enable_key_rotation=True,
    removal_policy=cdk.RemovalPolicy.DESTROY
)

# Grant CloudWatch Logs service permission to use the KMS key
self.log_key.add_to_resource_policy(
    iam.PolicyStatement(
        sid="Allow CloudWatch Logs",
        effect=iam.Effect.ALLOW,
        principals=[
            iam.ServicePrincipal(f"logs.{cdk.Stack.of(self).region}.amazonaws.com")
        ],
        actions=[
            "kms:Encrypt",
            "kms:Decrypt",
            "kms:ReEncrypt*",
            "kms:GenerateDataKey*",
            "kms:CreateGrant",
            "kms:DescribeKey"
        ],
        resources=["*"],
        conditions={
            "ArnLike": {
                "kms:EncryptionContext:aws:logs:arn": f"arn:aws:logs:{cdk.Stack.of(self).region}:{cdk.Stack.of(self).account}:log-group:*"
            }
        }
    )
)
```

### Key Learnings

1. **Always add KMS key policies for service principals**: When using customer-managed KMS keys with AWS services, you must explicitly grant permissions to the service principal in the key policy.

2. **Region-specific service principals**: CloudWatch Logs service principal must be region-specific (e.g., `logs.us-east-1.amazonaws.com`), not just `logs.amazonaws.com`.

3. **Encryption context conditions**: Use conditions to restrict key usage to specific resources (log groups) for better security.

4. **Policy statements should be added immediately after key creation**: Add the policy statement in the same construct where the key is created to avoid dependency issues.

5. **Testing order matters**: KMS key creation succeeds even without proper policies, but dependent resources (log groups) fail when trying to use the key.

---

## Issue 2: ECS Circuit Breaker Triggered - Health Check Failures

### What Went Wrong

**Error:** ECS service deployment failed with circuit breaker triggered:
```
Resource handler returned message: "Error occurred during operation 'ECS Deployment Circuit Breaker was triggered'." 
(RequestToken: ab34b83e-964b-5576-4799-9effbf346081, HandlerErrorCode: GeneralServiceException)
```

**Initial Implementation:**
```python
# microservices_construct.py - INCORRECT health check configuration
target_group = elbv2.ApplicationTargetGroup(
    ...
    health_check=elbv2.HealthCheck(
        path="/health",  # Sample image doesn't have this endpoint
        interval=cdk.Duration.seconds(10),  # Too frequent
        ...
    )
)

# App Mesh virtual node health check
health_check=appmesh.HealthCheck.http(
    path="/health"  # Sample image doesn't have this endpoint
)

# Envoy container with complex health check
envoy_container = task_definition.add_container(
    ...
    essential=True,  # Makes entire task fail if Envoy fails
    health_check=ecs.HealthCheck(
        command=["CMD-SHELL", "curl -s http://localhost:9901/server_info | grep state | grep -q LIVE"],
        ...
    )
)

container.add_container_dependencies(
    ecs.ContainerDependency(
        container=envoy_container,
        condition=ecs.ContainerDependencyCondition.HEALTHY  # Requires Envoy health check to pass
    )
)
```

**Evidence:**
- ECS services attempted to start but all tasks failed health checks
- Circuit breaker detected unhealthy tasks and triggered automatic rollback
- CloudFormation rollback initiated
- Deployment took ~14 minutes before failing

### Root Cause

Multiple issues caused the ECS tasks to fail health checks:

1. **Non-existent health endpoint**: The `amazon/amazon-ecs-sample` container image doesn't expose a `/health` endpoint. Both ALB target group and App Mesh virtual node health checks were looking for this path.

2. **Envoy marked as essential**: When Envoy container is marked `essential=True` and fails its health check, the entire task is marked unhealthy and stopped.

3. **Complex Envoy health check**: The health check command using curl and grep can fail if curl isn't available in the Envoy image or if Envoy hasn't fully started.

4. **Container dependency on healthy Envoy**: Setting `ContainerDependencyCondition.HEALTHY` means the app container won't start until Envoy passes health checks, creating a critical dependency chain.

5. **Too frequent health checks**: 10-second intervals combined with strict thresholds give containers less time to start up properly.

### Correct Implementation

```python
# microservices_construct.py - CORRECT

# App Mesh virtual node - use root path
virtual_node = appmesh.VirtualNode(
    ...
    listeners=[
        appmesh.VirtualNodeListener.http(
            port=port,
            health_check=appmesh.HealthCheck.http(
                healthy_threshold=2,
                unhealthy_threshold=3,
                interval=cdk.Duration.seconds(30),
                timeout=cdk.Duration.seconds(5),
                path="/"  # Use root path for compatibility with sample image
            )
        )
    ]
)

# ALB target group - use root path and longer interval
target_group = elbv2.ApplicationTargetGroup(
    ...
    health_check=elbv2.HealthCheck(
        path="/",  # Use root path for compatibility with sample image
        interval=cdk.Duration.seconds(30),  # Increase interval to reduce check frequency
        timeout=cdk.Duration.seconds(5),
        healthy_threshold_count=2,
        unhealthy_threshold_count=3
    ),
    deregistration_delay=cdk.Duration.seconds(30)
)

# Envoy container - make non-essential and simplify dependency
envoy_container = task_definition.add_container(
    ...
    essential=False,  # Make Envoy non-essential to allow app container to start independently
    # Remove health_check - let Envoy start without strict health validation
    user="1337"
)

# Set container dependency but without health check requirement
container.add_container_dependencies(
    ecs.ContainerDependency(
        container=envoy_container,
        condition=ecs.ContainerDependencyCondition.START  # Only wait for start, not healthy
    )
)
```

### Key Learnings

1. **Health check paths must exist**: Always verify the container image actually exposes the health check endpoint before configuring checks. Use "/" (root) as a safe default for web servers.

2. **Envoy should be non-essential for resilience**: Making Envoy `essential=False` allows the application container to continue running even if Envoy has issues. The service mesh functionality is degraded but the app remains available.

3. **Container dependencies should use START, not HEALTHY**: Using `ContainerDependencyCondition.START` instead of `HEALTHY` avoids creating brittle dependency chains. The app waits for Envoy to start but doesn't require it to pass health checks.

4. **Health check intervals should be reasonable**: 30-second intervals give containers more time to start up and reduce the load on target applications. Too frequent checks (10 seconds) can cause false positives during startup.

5. **Circuit breaker protects but can fail deployments**: ECS circuit breaker is a safety feature that automatically rolls back failed deployments, but it means your tasks must be able to pass health checks reliably.

6. **Test with actual container images**: Sample images may not have all the features (like health endpoints) that production images have. Configuration should be compatible with the images being used.

---

## Issue 3: Deprecated ECR Property `auto_delete_images`

### What Went Wrong

**Warning during synthesis:**
```
Warning: aws-cdk-lib.aws_ecr.RepositoryProps#autoDeleteImages is deprecated.
  Use `emptyOnDelete` instead.
  This API will be removed in the next major release.
```

**Initial Implementation:**
```python
# ecr_construct.py - INCORRECT (deprecated)
repo = ecr.Repository(
    self,
    f"Repo{service_name.capitalize()}-{environment_suffix}",
    repository_name=f"{service_name}-service-{environment_suffix}",
    image_scan_on_push=True,
    encryption=ecr.RepositoryEncryption.AES_256,
    removal_policy=cdk.RemovalPolicy.DESTROY,
    auto_delete_images=True,  # DEPRECATED
    lifecycle_rules=[...]
)
```

### Root Cause

AWS CDK is deprecating the `auto_delete_images` property in favor of `empty_on_delete` to align with naming conventions across other CDK constructs (similar to S3 bucket's `auto_delete_objects`).

### Correct Implementation

```python
# ecr_construct.py - CORRECT
repo = ecr.Repository(
    self,
    f"Repo{service_name.capitalize()}-{environment_suffix}",
    repository_name=f"{service_name}-service-{environment_suffix}",
    image_scan_on_push=True,
    encryption=ecr.RepositoryEncryption.AES_256,
    removal_policy=cdk.RemovalPolicy.DESTROY,
    empty_on_delete=True,  # CORRECT - Updated property name
    lifecycle_rules=[
        ecr.LifecycleRule(
            description="Keep only last 10 images",
            max_image_count=10,
            rule_priority=1
        )
    ]
)
```

### Key Learnings

1. **Monitor CDK deprecation warnings**: Even though they don't fail deployment, they indicate code that will break in future CDK versions.

2. **Property naming consistency**: CDK is moving toward consistent naming: `empty_on_delete` for ECR, `auto_delete_objects` for S3, etc.

3. **Update before major versions**: Deprecation warnings should be fixed before upgrading to next major CDK version to avoid breaking changes.

---

## Issue 4: App Mesh Service Discovery Configuration (Pre-existing in MODEL_RESPONSE.md)

### What Went Wrong

**Error:** Virtual node creation attempted to use CloudMap service discovery with a helper method that returned `None`:

```python
# microservices_construct.py - INCORRECT (from MODEL_RESPONSE)
service_discovery=appmesh.ServiceDiscovery.cloud_map(
    service=self._create_cloud_map_service(
        cluster,
        service_name,
        environment_suffix
    )
)

def _create_cloud_map_service(...):
    return None  # Will be created by ECS service cloud_map_options
```

**Error Message:**
```
"Passed to parameter service of static method aws-cdk-lib.aws_appmesh.ServiceDiscovery.cloudMap: 
Unable to deserialize value as aws-cdk-lib.aws_servicediscovery.IService - 
A value is required (type is non-optional)"
```

### Root Cause

The model attempted to integrate App Mesh CloudMap service discovery with ECS CloudMap registration incorrectly. While ECS services can automatically register with CloudMap via `cloud_map_options`, App Mesh virtual nodes require either:
1. A pre-existing CloudMap service reference, OR
2. DNS-based service discovery

Returning `None` from the helper method is invalid because `ServiceDiscovery.cloud_map()` requires a valid `IService` instance.

### Correct Implementation

```python
# microservices_construct.py - CORRECT
# Use DNS-based service discovery that matches CloudMap namespace
virtual_node = appmesh.VirtualNode(
    self,
    f"VirtualNode{service_name.capitalize()}-{environment_suffix}",
    mesh=mesh,
    virtual_node_name=f"{service_name}-node-{environment_suffix}",
    service_discovery=appmesh.ServiceDiscovery.dns(
        hostname=f"{service_name}.{environment_suffix}.local"
    ),
    listeners=[...]
)

# ECS service registers with CloudMap automatically
service = ecs.FargateService(
    ...
    cloud_map_options=ecs.CloudMapOptions(
        name=service_name  # Registers as {service_name}.{environment_suffix}.local
    )
)
```

### Key Learnings

1. **App Mesh and ECS CloudMap integration**: ECS services register with CloudMap automatically. App Mesh virtual nodes use DNS to resolve these registered services.

2. **DNS hostname format**: The DNS hostname in App Mesh must match the CloudMap service registration: `{service-name}.{namespace}`.

3. **Don't create CloudMap services manually**: When using ECS with CloudMap, let the ECS service create and manage the CloudMap service via `cloud_map_options`.

4. **Remove unused helper methods**: The `_create_cloud_map_service()` method was removed as it's not needed with DNS-based service discovery.

---

## Issue 5: Missing CloudMap Namespace in ECS Cluster (Pre-existing in MODEL_RESPONSE.md)

### What Went Wrong

**Error:**
```
"Cannot enable service discovery if a Cloudmap Namespace has not been created in the cluster."
```

**Initial Implementation:**
```python
# ecs_cluster_construct.py - INCORRECT
self.cluster = ecs.Cluster(
    self,
    f"Cluster-{environment_suffix}",
    cluster_name=f"microservices-cluster-{environment_suffix}",
    vpc=vpc,
    container_insights=True,
    enable_fargate_capacity_providers=True
)
# Missing: default_cloud_map_namespace
```

### Root Cause

ECS services using `cloud_map_options` for service discovery require the ECS cluster to have a `default_cloud_map_namespace` configured. This namespace is where services register their DNS records.

### Correct Implementation

```python
# ecs_cluster_construct.py - CORRECT
self.cluster = ecs.Cluster(
    self,
    f"Cluster-{environment_suffix}",
    cluster_name=f"microservices-cluster-{environment_suffix}",
    vpc=vpc,
    container_insights=True,
    enable_fargate_capacity_providers=True,
    default_cloud_map_namespace=ecs.CloudMapNamespaceOptions(
        name=f"{environment_suffix}.local",
        vpc=vpc
    )
)
```

### Key Learnings

1. **CloudMap namespace is a prerequisite**: Always configure `default_cloud_map_namespace` when planning to use ECS service discovery.

2. **Namespace naming**: Use `.local` suffix for private DNS namespaces. The format `{environment_suffix}.local` allows multiple parallel deployments.

3. **VPC association required**: CloudMap private DNS namespaces must be associated with a VPC.

---

## Summary of Issues

| Issue | Severity | Type | Impact |
|-------|----------|------|--------|
| Missing KMS Key Policy for CloudWatch Logs | Critical | Security/Permissions | Deployment Failure |
| ECS Circuit Breaker Triggered - Health Check Failures | Critical | Configuration | Deployment Failure |
| Deprecated ECR Property | Low | API Deprecation | Warning only (future breaking change) |
| App Mesh Service Discovery Misconfiguration | Critical | Architecture | Deployment Failure (MODEL_RESPONSE) |
| Missing CloudMap Namespace | Critical | Missing Prerequisite | Deployment Failure (MODEL_RESPONSE) |

## Training Value

**HIGH** - These failures demonstrate:
1. Critical importance of service-specific KMS key policies
2. Health check configuration must match actual container capabilities
3. Container dependency management (essential vs non-essential, START vs HEALTHY)
4. Need to keep up with CDK API deprecations
5. Proper integration patterns between AWS services (App Mesh ↔ ECS ↔ CloudMap)
6. Understanding of prerequisite resource configuration

All critical failures were structural issues that prevented deployment. The fixes required deep understanding of:
- AWS service integration patterns
- ECS task lifecycle and health check behavior
- Container dependency management
- Service mesh sidecar proxy configuration
