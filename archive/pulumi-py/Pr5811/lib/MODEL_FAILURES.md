# Model Failures and Corrections

This document outlines the issues found in the MODEL_RESPONSE and the fixes applied in IDEAL_RESPONSE for the e-commerce product catalog infrastructure.

## Summary

The initial implementation had 12 significant issues related to Pulumi-specific patterns, AWS best practices, and production readiness. All issues were identified and corrected in the IDEAL_RESPONSE.

---

## Issue 1: Deprecated EIP Parameter

**Category**: API Deprecation
**Severity**: High
**Training Score Impact**: -1.0

### Problem
```python
eip = aws.ec2.Eip(
    f"nat-eip-{i}-{environment_suffix}",
    vpc=True,  # ❌ DEPRECATED PARAMETER
    tags={"Name": f"nat-eip-{i}-{environment_suffix}"}
)
```

The `vpc=True` parameter for EIP is deprecated in newer versions of pulumi-aws provider.

### Fix
```python
eip = aws.ec2.Eip(
    f"nat-eip-{i}-{environment_suffix}",
    domain="vpc",  # ✅ CORRECT: Use domain parameter
    tags={"Name": f"nat-eip-{i}-{environment_suffix}"}
)
```

### Learning
Always use the `domain="vpc"` parameter instead of the deprecated `vpc=True` for Elastic IPs in VPC context.

---

## Issue 2: Missing Resource Dependencies

**Category**: Resource Ordering
**Severity**: Critical
**Training Score Impact**: -1.5

### Problem
```python
eip = aws.ec2.Eip(
    f"nat-eip-{i}-{environment_suffix}",
    domain="vpc",
    tags={"Name": f"nat-eip-{i}-{environment_suffix}"}
    # ❌ MISSING: No explicit dependency on IGW
)

nat = aws.ec2.NatGateway(
    f"nat-{i}-{environment_suffix}",
    allocation_id=eip.id,
    subnet_id=self.public_subnets[i].id,
    tags={"Name": f"nat-{i}-{environment_suffix}"}
    # ❌ MISSING: No explicit dependencies
)
```

EIPs require the Internet Gateway to exist first. NAT Gateways need both EIP and IGW. Without explicit dependencies, resources may be created in the wrong order causing deployment failures.

### Fix
```python
eip = aws.ec2.Eip(
    f"nat-eip-{i}-{environment_suffix}",
    domain="vpc",
    tags={"Name": f"nat-eip-{i}-{environment_suffix}"},
    opts=pulumi.ResourceOptions(depends_on=[self.igw])  # ✅ EXPLICIT DEPENDENCY
)

nat = aws.ec2.NatGateway(
    f"nat-{i}-{environment_suffix}",
    allocation_id=eip.id,
    subnet_id=self.public_subnets[i].id,
    tags={"Name": f"nat-{i}-{environment_suffix}"},
    opts=pulumi.ResourceOptions(depends_on=[eip, self.igw])  # ✅ EXPLICIT DEPENDENCIES
)

# Also for private routes
aws.ec2.Route(
    f"private-route-{i}-{environment_suffix}",
    route_table_id=private_rt.id,
    destination_cidr_block="0.0.0.0/0",
    nat_gateway_id=self.nat_gateways[i].id,
    opts=pulumi.ResourceOptions(depends_on=[self.nat_gateways[i]])  # ✅ EXPLICIT DEPENDENCY
)
```

### Learning
Always use `opts=pulumi.ResourceOptions(depends_on=[...])` to explicitly define resource dependencies when the implicit dependency through property references may not be sufficient.

---

## Issue 3: Hardcoded Database Password

**Category**: Security
**Severity**: Critical
**Training Score Impact**: -2.0

### Problem
```python
db_password = "ChangeMe123!"  # ❌ HARDCODED PASSWORD - SECURITY RISK
db_username = "postgres"
```

Hardcoded passwords in infrastructure code are a major security vulnerability and violate security best practices.

### Fix
```python
import random
import string

# ✅ GENERATE RANDOM PASSWORD
db_password = ''.join(random.choices(string.ascii_letters + string.digits, k=20))
db_username = "postgres"
```

### Learning
Always generate random passwords programmatically. Never hardcode credentials in infrastructure code. Consider using Pulumi's `random` provider or Python's random module for password generation.

---

## Issue 4: Incorrect Secrets Manager Reference Format

**Category**: AWS Configuration
**Severity**: High
**Training Score Impact**: -1.5

### Problem
```python
"secrets": [{
    "name": "DATABASE_URL",
    "valueFrom": args[1]  # ❌ INCORRECT: References entire secret, not specific key
}]
```

The task definition references the entire secret ARN without specifying which JSON key to extract. This causes ECS to fail retrieving the secret value.

### Fix
```python
"secrets": [{
    "name": "DATABASE_URL",
    "valueFrom": f"{args[1]}:connection_string::"  # ✅ CORRECT: Key-specific reference
}]
```

### Learning
When referencing Secrets Manager secrets in ECS task definitions, use the format: `arn:aws:secretsmanager:region:account:secret:secret-name:json-key::` to extract a specific key from the JSON secret.

---

## Issue 5: Improper Secret Version Handling

**Category**: Pulumi Output Handling
**Severity**: High
**Training Score Impact**: -1.0

### Problem
```python
self.rds_instance.endpoint.apply(
    lambda endpoint: aws.secretsmanager.SecretVersion(
        f"db-secret-version-{environment_suffix}",
        secret_id=self.db_secret.id,
        secret_string=json.dumps({
            "host": endpoint.split(":")[0],  # ❌ STRING PARSING ON OUTPUT
            # ...
        })
    )
)
```

Using string parsing (`split()`) on Pulumi outputs doesn't work correctly. The `endpoint` includes the port (e.g., `hostname:5432`), but splitting within an `apply()` can be error-prone.

### Fix
```python
self.db_secret_version = pulumi.Output.all(
    self.db_secret.id,
    self.rds_instance.endpoint,
    self.rds_instance.address  # ✅ USE ADDRESS PROPERTY DIRECTLY
).apply(lambda args: aws.secretsmanager.SecretVersion(
    f"db-secret-version-{environment_suffix}",
    secret_id=args[0],
    secret_string=json.dumps({
        "host": args[2],  # ✅ DIRECT ADDRESS WITHOUT PORT
        # ...
    })
))
```

### Learning
Use `Output.all()` to combine multiple Pulumi outputs, and prefer specific properties (like `rds_instance.address`) over parsing composite values.

---

## Issue 6: Missing ECR Force Delete Configuration

**Category**: Resource Management
**Severity**: Medium
**Training Score Impact**: -0.5

### Problem
```python
self.ecr_repository = aws.ecr.Repository(
    f"ecr-repo-{environment_suffix}",
    name=f"product-catalog-{environment_suffix}",
    # ❌ MISSING: force_delete and image_tag_mutability
)
```

Without `force_delete=True`, the ECR repository cannot be deleted if it contains images, requiring manual cleanup.

### Fix
```python
self.ecr_repository = aws.ecr.Repository(
    f"ecr-repo-{environment_suffix}",
    name=f"product-catalog-{environment_suffix}",
    image_tag_mutability="MUTABLE",  # ✅ ALLOW TAG OVERWRITING
    force_delete=True,  # ✅ ALLOW DELETION WITH IMAGES
    # ...
)
```

### Learning
For development and testing environments, set `force_delete=True` on ECR repositories to enable cleanup via `pulumi destroy`.

---

## Issue 7: Missing Container Health Check

**Category**: Production Readiness
**Severity**: Medium
**Training Score Impact**: -1.0

### Problem
```python
{
    "name": "product-catalog",
    "image": f"{args[0]}:latest",
    "portMappings": [{
        "containerPort": 5000,
        "protocol": "tcp"
    }],
    # ❌ MISSING: Container-level health check
}
```

Without a container health check, ECS cannot determine if the application inside the container is actually healthy.

### Fix
```python
{
    "name": "product-catalog",
    "image": f"{args[0]}:latest",
    "portMappings": [{
        "containerPort": 5000,
        "hostPort": 5000,  # ✅ EXPLICIT HOST PORT
        "protocol": "tcp"
    }],
    "healthCheck": {  # ✅ CONTAINER HEALTH CHECK
        "command": ["CMD-SHELL", "curl -f http://localhost:5000/health || exit 1"],
        "interval": 30,
        "timeout": 5,
        "retries": 3,
        "startPeriod": 60
    }
}
```

### Learning
Always include container-level health checks in ECS task definitions. This is separate from ALB target group health checks and provides faster failure detection.

---

## Issue 8: Wildcard IAM Resource Policy

**Category**: Security
**Severity**: High
**Training Score Impact**: -1.0

### Problem
```python
policy=json.dumps({
    "Version": "2012-10-17",
    "Statement": [{
        "Effect": "Allow",
        "Action": [
            "secretsmanager:GetSecretValue",
            "kms:Decrypt"
        ],
        "Resource": "*"  # ❌ OVERLY PERMISSIVE
    }]
})
```

Using `"Resource": "*"` grants access to all secrets in the account, violating least-privilege principle.

### Fix
```python
policy=pulumi.Output.all(self.db_secret.arn).apply(lambda args: json.dumps({
    "Version": "2012-10-17",
    "Statement": [{
        "Effect": "Allow",
        "Action": [
            "secretsmanager:GetSecretValue",
            "secretsmanager:DescribeSecret"
        ],
        "Resource": args[0]  # ✅ SPECIFIC RESOURCE ARN
    }]
}))
```

### Learning
Always specify exact resource ARNs in IAM policies. Use `Output.all()` when ARNs are Pulumi outputs.

---

## Issue 9: Missing ECS Service Dependencies

**Category**: Resource Ordering
**Severity**: High
**Training Score Impact**: -1.0

### Problem
```python
self.ecs_service = aws.ecs.Service(
    f"ecs-service-{environment_suffix}",
    # ...
    # ❌ MISSING: No depends_on for ALB listener or RDS
)
```

ECS service may start before the ALB listener is ready or before RDS is available, causing deployment failures.

### Fix
```python
self.ecs_service = aws.ecs.Service(
    f"ecs-service-{environment_suffix}",
    # ...
    opts=pulumi.ResourceOptions(
        depends_on=[self.alb_listener, self.rds_instance]  # ✅ EXPLICIT DEPENDENCIES
    )
)
```

### Learning
ECS services should explicitly depend on their load balancer listeners and any databases they connect to.

---

## Issue 10: Missing RDS Backup Configuration

**Category**: Production Readiness
**Severity**: Medium
**Training Score Impact**: -0.5

### Problem
```python
self.rds_instance = aws.rds.Instance(
    f"rds-{environment_suffix}",
    # ...
    # ❌ MISSING: No backup configuration
)
```

Without backup retention, the database has no automated backups, which is risky for production.

### Fix
```python
self.rds_instance = aws.rds.Instance(
    f"rds-{environment_suffix}",
    # ...
    backup_retention_period=7,  # ✅ 7-DAY BACKUP RETENTION
    backup_window="03:00-04:00",  # ✅ BACKUP WINDOW
    maintenance_window="mon:04:00-mon:05:00",  # ✅ MAINTENANCE WINDOW
)
```

### Learning
Always configure backup retention for RDS instances in production environments, even if it's a test system.

---

## Issue 11: Missing ECS Deployment Configuration

**Category**: Production Readiness
**Severity**: Medium
**Training Score Impact**: -0.5

### Problem
```python
self.ecs_service = aws.ecs.Service(
    f"ecs-service-{environment_suffix}",
    # ...
    # ❌ MISSING: No deployment configuration
)
```

Without deployment configuration, ECS uses default values which may not be optimal.

### Fix
```python
self.ecs_service = aws.ecs.Service(
    f"ecs-service-{environment_suffix}",
    # ...
    health_check_grace_period_seconds=60,  # ✅ GRACE PERIOD
    deployment_configuration=aws.ecs.ServiceDeploymentConfigurationArgs(
        maximum_percent=200,  # ✅ ALLOW DOUBLE CAPACITY DURING DEPLOYMENT
        minimum_healthy_percent=100  # ✅ MAINTAIN FULL CAPACITY
    ),
)
```

### Learning
Always specify deployment configuration for ECS services to control rolling update behavior.

---

## Issue 12: Missing Auto Scaling Target Dependency

**Category**: Resource Ordering
**Severity**: Low
**Training Score Impact**: -0.5

### Problem
```python
self.autoscaling_target = aws.appautoscaling.Target(
    f"ecs-autoscaling-target-{environment_suffix}",
    # ...
    # ❌ MISSING: No depends_on for ECS service
)
```

Auto scaling target should wait for the ECS service to be created.

### Fix
```python
self.autoscaling_target = aws.appautoscaling.Target(
    f"ecs-autoscaling-target-{environment_suffix}",
    # ...
    opts=pulumi.ResourceOptions(depends_on=[self.ecs_service])  # ✅ EXPLICIT DEPENDENCY
)
```

### Learning
Auto scaling targets should explicitly depend on the service they're scaling.

---

## Issue 13: Missing Security Group Rule Descriptions

**Category**: Documentation
**Severity**: Low
**Training Score Impact**: -0.5

### Problem
```python
aws.ec2.SecurityGroupRule(
    f"ecs-from-alb-{environment_suffix}",
    type="ingress",
    from_port=5000,
    to_port=5000,
    protocol="tcp",
    source_security_group_id=self.alb_sg.id,
    security_group_id=self.ecs_sg.id
    # ❌ MISSING: No description
)
```

### Fix
```python
aws.ec2.SecurityGroupRule(
    f"ecs-from-alb-{environment_suffix}",
    type="ingress",
    from_port=5000,
    to_port=5000,
    protocol="tcp",
    source_security_group_id=self.alb_sg.id,
    security_group_id=self.ecs_sg.id,
    description="Allow ALB to reach ECS tasks"  # ✅ DESCRIPTIVE TEXT
)
```

### Learning
Always add descriptions to security group rules for better documentation and auditability.

---

## Training Impact Summary

| Issue | Category | Impact | Cumulative |
|-------|----------|--------|------------|
| Deprecated EIP parameter | API Deprecation | -1.0 | -1.0 |
| Missing dependencies | Resource Ordering | -1.5 | -2.5 |
| Hardcoded password | Security | -2.0 | -4.5 |
| Incorrect secret reference | AWS Config | -1.5 | -6.0 |
| Secret version handling | Pulumi Outputs | -1.0 | -7.0 |
| Missing force_delete | Resource Mgmt | -0.5 | -7.5 |
| No container health check | Production Ready | -1.0 | -8.5 |
| Wildcard IAM policy | Security | -1.0 | -9.5 |
| Missing service deps | Resource Ordering | -1.0 | -10.5 |
| No RDS backup config | Production Ready | -0.5 | -11.0 |
| No deployment config | Production Ready | -0.5 | -11.5 |
| Missing autoscaling dep | Resource Ordering | -0.5 | -12.0 |
| No SG descriptions | Documentation | -0.5 | -12.5 |

**Total Training Score Impact**: -12.5 points

**Expected Training Quality**: After corrections, the implementation should achieve a training quality score of ≥8, making it suitable for model training on production-grade Pulumi infrastructure patterns.

---

## Key Takeaways for Model Training

1. **Pulumi-specific patterns**: Always use `Output.all()` for combining outputs, and `ResourceOptions(depends_on=[...])` for explicit dependencies
2. **Security best practices**: Never hardcode credentials, always use specific resource ARNs in IAM policies
3. **AWS service configuration**: Understand service-specific requirements (ECS secret format, RDS backup config, etc.)
4. **Production readiness**: Include health checks, deployment configurations, backup settings
5. **Resource lifecycle**: Configure deletion protection and force_delete appropriately for testing vs production
6. **Documentation**: Add descriptions to all security rules and resources for maintainability
