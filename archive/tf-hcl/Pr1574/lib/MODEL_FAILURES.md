# Model Failure Report

This document outlines potential failures for the Terraform stack, categorized by type. It helps identify where issues may arise during initialization, planning, application, or runtime operations.

---

## 1. Provider & Backend Failures
- **Invalid provider configuration** (wrong AWS region, expired/missing credentials).
- **Remote state backend errors**:
  - S3 bucket not created or incorrect region.
  - DynamoDB locking misconfigured.
  - Permissions missing for state read/write.

---

## 2. Variable & Input Failures
- **Undeclared variables**: Referencing `var.vpc_cidr` or others without a declaration.
- **Missing values**: Required variables not set and no defaults provided.
- **Invalid input values**:
  - CIDR validation fails (`0.0.0.0/0` not allowed).
  - Incorrect formats for IPs, IDs, or ARNs.

---

## 3. Resource Creation Failures
- **VPC/Subnets**:
  - Overlapping or invalid CIDR ranges.
  - Requesting more subnets than available AZs.
- **NAT Gateways**:
  - No Elastic IPs available.
  - NAT gateway created in private instead of public subnet.
- **ALB/ASG/EC2**:
  - Launch template references invalid AMI.
  - Nonexistent or unsupported instance types.
  - Target group health checks fail → instances never become healthy.

---

## 4. IAM & Security Failures
- **Policy errors**:
  - Overly restrictive IAM role prevents services from running.
  - Invalid resource ARNs in IAM policy.
- **Security group misconfigurations**:
  - ALB cannot connect to EC2 instances.
  - No outbound access from private subnets.
- **Bastion SSH rules**:
  - CIDR not allowed due to validation block.
  - Missing ingress rule prevents SSH connectivity.

---

## 5. Key Pair Failures
- **Missing AWS Key Pair resource** referenced in EC2.
- **Invalid public key format** → rejected by AWS.
- **Key Pair not attached** → EC2 instances become unreachable.

---

## 6. Deployment Execution Failures
- **Plan file errors**:
  - Running `terraform apply tfplan` without a valid plan file.
  - Plan file missing due to previous failed `plan`.
- **Concurrency issues**:
  - Running multiple `apply` commands without proper locking.
- **State drift**:
  - Manual deletion of AWS resources causes Terraform apply/destroy mismatch.

---

## 7. Runtime / Post-Deployment Failures
- **Auto Scaling failures**:
  - Instances continuously replaced because health checks fail.
- **Networking failures**:
  - Internet Gateway or NAT misconfigured → no internet access.
  - Route tables incorrectly linked.
- **Service unavailability**:
  - ALB created but no healthy targets registered.
- **Quota / Limit issues**:
  - Hitting AWS service quotas (VPCs, subnets, NAT gateways, EC2 instances).
- **Unsupported regional features**:
  - Requested instance types or services not available in selected AWS region.

---

## 8. Warnings & Deprecations
- **Terraform attribute deprecations**:
  - Example: `.name` attribute deprecated on resources.
- **Provider API changes**:
  - New required arguments introduced by AWS provider.
- **Terraform version mismatch**:
  - Plan works in one version, fails in another due to syntax or provider constraints.

---

## ✅ Summary
Failures may occur across:
1. **Provider & backend configuration**  
2. **Variable declarations & validation**  
3. **Resource provisioning (VPC, subnets, NAT, ALB, EC2, ASG)**  
4. **IAM & security misconfigurations**  
5. **Key pair handling**  
6. **Deployment execution & state handling**  
7. **Runtime availability & scaling**  
8. **Deprecations and version mismatches**

This file serves as a reference for troubleshooting issues and validating stack robustness.
