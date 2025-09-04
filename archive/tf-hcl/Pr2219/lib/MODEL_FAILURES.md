# Model Failures Analysis

The original `MODEL_RESPONSE.md` Terraform implementation had several deviations from the ideal implementation, impacting correctness and maintainability.

## Key Issues Fixed

### 1. Missing Environment and Project Parameters
- **Issue**: The model hardcoded names like `production-vpc` instead of parameterizing environment and project names.
- **Fix**: Added `var.environment` and `var.project` variables, and interpolated them into all resource names and tags.

---
### 3. Single-AZ Subnet Design
- **Issue**: The model provisioned only one public and one private subnet in a single availability zone.
- **Fix**: Updated to create multiple subnets across all available AZs using `for_each` for high availability.

---

### 4. Overly Permissive Security Group Rules
- **Issue**: The model allowed SSH (`22`) access from `0.0.0.0/0` to the bastion host.
- **Fix**: Restricted SSH ingress to a configurable `allowed_ssh_cidr` variable.

---

### 5. Hardcoded CIDR Ranges
- **Issue**: The model used fixed CIDR blocks (`172.31.0.0/16` for VPC) without flexibility.
- **Fix**: Made VPC and subnet CIDR ranges configurable via variables.

---

### 7. Lack of Lifecycle Management for Random Passwords
- **Issue**: The model’s `random_password` resource could regenerate on every `terraform apply`.
- **Fix**: Added `lifecycle { prevent_destroy = true }` and used `keepers` to control regeneration.

---

### 8. Inconsistent Tagging
- **Issue**: The model used `local.common_tags` inconsistently and hardcoded some `Name` tags.
- **Fix**: Applied `local.common_tags` uniformly and constructed `Name` tags dynamically from variables.

---

### 9. Missing Multi-AZ NAT Gateway Setup
- **Issue**: The model created only a single NAT Gateway for one AZ, reducing redundancy.
- **Fix**: Created NAT Gateways in each public subnet with corresponding route tables for high availability.

---

### 10. Missing Modular Structure
- **Issue**: The model implemented all resources in a single file without logical separation.
- **Fix**: Split the implementation into modules for VPC, security groups, EC2, IAM, and secrets for maintainability.
