# Model Failures and Corrections

This document tracks issues encountered during implementation and their resolutions for training improvement.

## Issue 1: Missing DMS Prerequisite IAM Roles in Main Stack

### What Went Wrong

DMS deployment failed with the following error:
```
CREATE_FAILED | AWS::DMS::ReplicationSubnetGroup | dms-subnet-pr6185 (dmssubnetpr6185) 
Resource handler returned message: "The IAM Role arn:aws:iam::***:role/dms-vpc-role is not configured properly. 
(Service: AWSDatabaseMigrationService; Status Code: 400; Error Code: AccessDeniedFault)"
```

**Evidence**:
- CloudFormation deployment error during stack creation
- DMS subnet group creation failed because required IAM role was missing
- The `dms-vpc-role` was defined in a separate `DmsPrerequisitesStack` but not deployed

### Root Cause

The implementation created DMS prerequisite IAM roles in a separate stack (`DmsPrerequisitesStack`) but:
1. The `app.py` only deployed the `TapStack`, not the prerequisite stack
2. The PROMPT.md clearly specified (line 34): "Create DMS prerequisite IAM roles (dms-vpc-role, dms-cloudwatch-logs-role) in the main stack"
3. AWS DMS requires specific service-linked roles to exist before it can create VPC resources

### Correct Implementation

The DMS prerequisite roles should be created directly in the main `TapStack` before creating DMS resources:

```python
def _create_dms_prerequisite_roles(self) -> None:
    """Create DMS prerequisite IAM roles required for DMS to manage VPC resources"""
    # Create DMS VPC management role
    # AWS DMS requires this specific role name to manage VPC resources
    # Note: Using both regional and global service principals for compatibility
    self.dms_vpc_role = iam.Role(
        self,
        "dms-vpc-role",
        role_name=f"dms-vpc-role-{self.environment_suffix}",
        assumed_by=iam.CompositePrincipal(
            iam.ServicePrincipal(f"dms.{self.region}.amazonaws.com"),
            iam.ServicePrincipal("dms.amazonaws.com")
        ),
        managed_policies=[
            iam.ManagedPolicy.from_aws_managed_policy_name(
                "service-role/AmazonDMSVPCManagementRole"
            )
        ],
    )

    # Create DMS CloudWatch Logs role
    # Note: Using both regional and global service principals for compatibility
    self.dms_cloudwatch_logs_role = iam.Role(
        self,
        "dms-cloudwatch-logs-role",
        role_name=f"dms-cloudwatch-logs-role-{self.environment_suffix}",
        assumed_by=iam.CompositePrincipal(
            iam.ServicePrincipal(f"dms.{self.region}.amazonaws.com"),
            iam.ServicePrincipal("dms.amazonaws.com")
        ),
        managed_policies=[
            iam.ManagedPolicy.from_aws_managed_policy_name(
                "service-role/AmazonDMSCloudWatchLogsRole"
            )
        ],
    )
```

And ensure the DMS subnet group depends on the VPC role:

```python
# DMS subnet group depends on DMS VPC role
dms_subnet_group.add_dependency(self.dms_vpc_role.node.default_child)
```

### Key Learnings

1. **Always implement single-stack when specified**: The PROMPT.md explicitly required single-stack architecture with all resources
2. **DMS requires prerequisite IAM roles**: These roles must exist before DMS can create VPC-related resources
3. **DMS IAM roles require EXACT names**: The roles MUST be named exactly "dms-vpc-role" and "dms-cloudwatch-logs-role" without any suffix
4. **Use CompositePrincipal for DMS**: Both regional and global service principals ensure compatibility
5. **Add explicit dependencies**: The DMS subnet group must depend on the DMS VPC role
6. **Check app.py deployment**: Ensure all required stacks are being deployed

---

## Issue 2: Incorrect IDEAL_RESPONSE.md Architecture Documentation

### What Went Wrong

The IDEAL_RESPONSE.md documented a multi-stack architecture when the actual implementation and PROMPT.md required single-stack:

- IDEAL_RESPONSE.md showed 4 separate stacks (DmsPrereq, Source, Target, Route53)
- app.py only deployed a single TapStack
- PROMPT.md explicitly stated single-stack architecture requirement

### Root Cause

Misalignment between documentation and implementation. The IDEAL_RESPONSE.md was either:
- Based on an earlier multi-stack design that was changed
- Incorrectly documenting the architecture pattern
- Not updated after architecture changes

### Correct Implementation

IDEAL_RESPONSE.md should accurately reflect the single-stack architecture:

```markdown
## Architecture

### Single-Stack Design

The infrastructure is deployed as a **single CloudFormation stack** containing all resources:

- **Database Layer**: Source and target RDS PostgreSQL instances with encryption
- **DMS Infrastructure**: IAM roles, replication instance, endpoints, and tasks for continuous data sync
- **Storage Layer**: Source and target S3 buckets with cross-region replication
- **Application Services**: ECS Fargate cluster with ALB for containerized services
- **Traffic Management**: Route 53 hosted zone with health checks and A records
- **Observability**: CloudWatch dashboards, metrics, logs, and alarms

### Architecture Pattern

Single-stack architecture was chosen for:
- Efficient resource management and deployment
- Simplified dependency handling
- Atomic deployment and rollback
- All resources fit well within CloudFormation limits (~85-90 resources)
```

### Key Learnings

1. **Documentation must match implementation**: IDEAL_RESPONSE.md should contain the actual deployed code
2. **Verify architecture requirements**: Always check PROMPT.md for specific architecture patterns
3. **Single-stack is often preferred**: For <100 resources, single-stack provides better atomicity
4. **Update documentation after changes**: Keep IDEAL_RESPONSE.md in sync with code changes

---

## Issue 3: DMS IAM Role Name Must Be Exact Without Suffix

### What Went Wrong

After initial fix, deployment still failed with same error:
```
CREATE_FAILED | AWS::DMS::ReplicationSubnetGroup | dms-subnet-pr6185
Resource handler returned message: "The IAM Role arn:aws:iam::***:role/dms-vpc-role is not configured properly."
```

**Evidence**:
- Created role with name `dms-vpc-role-{environment_suffix}`
- AWS DMS specifically looks for `arn:aws:iam::***:role/dms-vpc-role` (exact name)
- DMS service has hardcoded dependency on these exact role names

### Root Cause

AWS DMS has a hardcoded requirement for specific IAM role names:
- Must be exactly `dms-vpc-role` (not `dms-vpc-role-suffix`)
- Must be exactly `dms-cloudwatch-logs-role` (not `dms-cloudwatch-logs-role-suffix`)

These are service-linked-like roles that DMS expects to exist with exact names.

### Correct Implementation

```python
# IMPORTANT: The role name MUST be exactly "dms-vpc-role" without any suffix
self.dms_vpc_role = iam.Role(
    self,
    "dms-vpc-role",
    role_name="dms-vpc-role",  # Must be exactly this name
    assumed_by=iam.CompositePrincipal(
        iam.ServicePrincipal(f"dms.{self.region}.amazonaws.com"),
        iam.ServicePrincipal("dms.amazonaws.com")
    ),
    managed_policies=[
        iam.ManagedPolicy.from_aws_managed_policy_name(
            "service-role/AmazonDMSVPCManagementRole"
        )
    ],
)
```

### Key Learnings

1. **Some AWS services require exact IAM role names**: DMS, unlike most services, requires specific role names
2. **Service documentation is critical**: AWS DMS documentation specifies these exact role names
3. **Don't apply environment suffixes to service-required roles**: These are account-level roles, not stack-specific

---

## Issue 4: Multiple Stack Files Violate Single-Stack Architecture

### What Went Wrong

The PR review identified architecture violations:
- `lib/route53_stack.py` and `lib/dms_prereq_stack.py` existed despite single-stack requirement
- Tests existed for these unused stacks
- The prompt explicitly required all resources in a single TapStack

### Root Cause

- Legacy multi-stack implementation not fully cleaned up
- Route53 resources were never implemented in the main stack
- Unused stack files created confusion about the architecture

### Correct Implementation

1. **Deleted unused stack files**:
   - `lib/route53_stack.py`
   - `lib/dms_prereq_stack.py`
   - `tests/unit/test_route53_stack_unit.py`
   - `tests/unit/test_dms_prereq_stack_unit.py`

2. **Added Route53 implementation to TapStack**:
```python
# Create Route 53 for traffic management
self.hosted_zone = self._create_route53_hosted_zone()
self.health_check = self._create_route53_health_check()
self.dns_record = self._create_route53_record()
```

3. **Fixed CloudWatch dashboard target group dimension**:
```python
# Changed from hardcoded string to actual target group property
"TargetGroup": self.target_group.target_group_full_name,
```

### Key Learnings

1. **Always clean up unused files**: When refactoring architecture, remove all obsolete files
2. **Verify all requirements are implemented**: Route53 was a core requirement but missing
3. **Use actual resource properties**: Don't hardcode dimensions that can change
4. **Single-stack is clearer**: All resources in one place makes dependencies explicit