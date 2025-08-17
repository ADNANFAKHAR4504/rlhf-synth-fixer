# Model Failures Analysis

The original `MODEL_RESPONSE.md` implementation of the Terraform module had several shortcomings that prevented it from meeting the project’s infrastructure and QA requirements:

## Key Issues Fixed

### 1. Inconsistent Naming Convention
- **Issue**: Some resources use `${var.project}`, while others are hardcoded with `"production-"` prefixes (e.g., `production-vpc`, `production-bastion-host`).
- **Fix**: Standardize naming by interpolating `${var.project}` or `${var.environment}` across all resources for consistency.

---

### 2. Hardcoded Key Pair Name
- **Issue**: `key_pair_name` is hardcoded as `"prod-key"`, which is insecure and environment-specific.
- **Fix**: Create/manage key pairs with Terraform (`aws_key_pair`) or expose as an input variable for CI/CD pipeline injection.

---

### 3. Sensitive Data Management
- **Issue**: While database password is stored in AWS Secrets Manager, the key pair name is hardcoded and not securely managed.
- **Fix**: Store all sensitive values (like key pair names) in variables or inject via CI/CD pipeline.

---

### 4. Security Group Rules
- **Issue**: Bastion host security group allows unrestricted SSH (`22`) access from `0.0.0.0/0`.
- **Fix**: Restrict SSH ingress to trusted IP CIDRs (e.g., office IPs or VPN ranges).

---

### 5. Limited Availability Zone Usage
- **Issue**: Only one public subnet and one private subnet are provisioned in a single AZ, reducing redundancy.
- **Fix**: Use `for_each` or `count` to provision subnets across multiple availability zones for HA (High Availability).

---

### 6. CIDR Allocation
- **Issue**: VPC CIDR `172.31.0.0/16` and subnets `/20` are common and may conflict with default AWS ranges.
- **Fix**: Use uncommon CIDRs (e.g., `10.2.0.0/20`) to minimize conflicts with existing environments.

---

### 7. EC2 User Data
- **Issue**: EC2 user data only updates packages and installs `aws-cli`, offering minimal bootstrap configuration.
- **Fix**: Extend user data to include application setup, monitoring agents, logging configuration, etc.

---

### 8. IAM Policy Scope
- **Issue**: IAM role grants broad `secretsmanager:GetSecretValue` access to a specific secret, but does not enforce additional constraints.
- **Fix**: Restrict secret access with resource tags, prefixes, or condition keys for tighter least-privilege enforcement.

---

### 9. Tagging Consistency
- **Issue**: Although `local.common_tags` is applied, `Name` tags are hardcoded (e.g., `"production-nat-gateway"`).
- **Fix**: Parameterize `Name` tags using `${var.project}` or `${var.environment}` for consistency across deployments.

--