# Error 1: Security Group Name Invalid (Reserved Prefix)

### Category
Configuration Error - AWS Reserved Naming Constraint

### Severity
Critical - Blocks terraform plan execution

### Description

Terraform validation failed during `terraform plan` with the error:

```
Error: invalid value for name (cannot begin with sg-)

  with aws_security_group.application,
  on main.tf line 34, in resource "aws_security_group" "application":
  34:   name = "sg-application-${var.environment}"
```

The security group name `sg-application-${var.environment}` violates AWS naming constraints. The prefix `sg-` is reserved by AWS for auto-generated security group IDs and cannot be used in custom security group names.

### Root Cause

AWS uses the `sg-` prefix exclusively for security group IDs it generates automatically (e.g., `sg-0a1b2c3d4e5f6`). Custom security group names cannot use this prefix to prevent ambiguity between user-defined names and system-generated identifiers.

**Problematic Code** (lib/main.tf, line 34):

```hcl
resource "aws_security_group" "application" {
  name        = "sg-application-${var.environment}"
  description = "Security group for application tier"
  vpc_id      = aws_vpc.healthcare.id
}
```

### Impact

**Security**: None - This is a naming constraint, not a security vulnerability.

**Cost**: None - No resources created due to validation failure.

**Operational**: Critical - Deployment blocked until resolved.

**Compliance**: None - HIPAA compliance unaffected by naming choice.

### Fix Applied

```hcl
resource "aws_security_group" "application" {
  name        = "application-${var.environment}"
  description = "Security group for application tier"
  vpc_id      = aws_vpc.healthcare.id

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = [aws_vpc.healthcare.cidr_block]
    description = "HTTPS from VPC"
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow all outbound traffic"
  }

  tags = merge(
    var.common_tags,
    {
      Name = "application-${var.environment}"
    }
  )
}
```

**Change**: Removed `sg-` prefix from name attribute. New name: `application-dev` (compliant with AWS constraints).

### Prevention Strategy

1. **Naming Standards Document**: Maintain list of AWS reserved prefixes for all resource types (sg-, vpc-, subnet-, rtb-, acl-, igw-, nat-, eipalloc-).

2. **Code Review Checklist**: Include verification that security group, VPC, and subnet names do not use AWS-reserved prefixes.

3. **Pre-commit Validation**: Add grep check to block `sg-`, `vpc-`, `subnet-` prefixes in resource names before commit.

4. **Terraform Variable Validation**: Add constraint to environment suffix variable to enforce naming standards programmatically.

5. **Documentation**: Update README with examples of correct naming patterns for all networking resources.

---

**Status**: Fixed and validated.

---