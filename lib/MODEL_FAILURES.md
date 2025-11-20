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

## Issue 2: Deprecated ECR Property `auto_delete_images`

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

## Issue 3: App Mesh Service Discovery Configuration (Pre-existing in MODEL_RESPONSE.md)

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

## Issue 4: Missing CloudMap Namespace in ECS Cluster (Pre-existing in MODEL_RESPONSE.md)

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
| Deprecated ECR Property | Low | API Deprecation | Warning only (future breaking change) |
| App Mesh Service Discovery Misconfiguration | Critical | Architecture | Deployment Failure (MODEL_RESPONSE) |
| Missing CloudMap Namespace | Critical | Missing Prerequisite | Deployment Failure (MODEL_RESPONSE) |

## Training Value

**HIGH** - These failures demonstrate:
1. Critical importance of service-specific KMS key policies
2. Need to keep up with CDK API deprecations
3. Proper integration patterns between AWS services (App Mesh ↔ ECS ↔ CloudMap)
4. Understanding of prerequisite resource configuration

All critical failures were structural issues that prevented deployment. The fixes required deep understanding of AWS service integration patterns, not just syntax corrections.
