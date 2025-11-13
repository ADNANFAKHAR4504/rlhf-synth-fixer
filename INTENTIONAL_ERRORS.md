# Intentional Errors in MODEL_RESPONSE.md

This document lists all intentional errors included in the MODEL_RESPONSE.md for training purposes.

## Critical Errors (High Impact)

### 1. Missing Calico CNI Installation
**Location**: `lib/eks_addons.py`
**Error**: Task explicitly requires Calico CNI instead of AWS VPC CNI, but addon is not installed
**Impact**: Network policy enforcement requirements not met

### 2. Node Group Taint Effect Incorrect
**Location**: `lib/eks_node_groups.py` (lines for critical and batch node groups)
**Error**: Using `"NO_SCHEDULE"` instead of `"NoSchedule"` 
**Impact**: Taints won't work correctly, pods will be scheduled incorrectly

### 3. Invalid Node Group Capacity Type
**Location**: `lib/eks_node_groups.py` (general node group)
**Error**: Using `capacity_type="MIXED"` which is not valid. Should use "ON_DEMAND" or "SPOT"
**Impact**: Node group creation will fail

### 4. Missing VPC Endpoint Security Group
**Location**: `lib/vpc_stack.py`
**Error**: ECR VPC endpoint has empty `security_group_ids=[]`
**Impact**: VPC endpoint may not be accessible from EKS nodes

### 5. CloudWatch Logs Missing KMS Encryption
**Location**: `lib/eks_cluster.py`
**Error**: Log groups created without `kms_key_id` parameter despite KMS key being passed in
**Impact**: Compliance requirement for encrypted logs not met

### 6. Missing Public Access CIDR Restrictions
**Location**: `lib/eks_cluster.py`
**Error**: `endpoint_public_access=True` without `public_access_cidrs` configuration
**Impact**: EKS API endpoint open to entire internet, security risk

## Medium Errors (Moderate Impact)

### 7. KMS Key Policy Missing EKS Service Principal
**Location**: `lib/kms_encryption.py`
**Error**: Cluster KMS key policy only allows IAM root, missing EKS service principal
**Impact**: EKS may not be able to use the KMS key for encryption

### 8. IRSA Assume Role Condition Incorrect
**Location**: `lib/irsa_roles.py` (all IRSA roles)
**Error**: Using `:sub` condition instead of should also check `:aud` for proper OIDC validation
**Impact**: Potential security issue with role assumption

### 9. Overly Broad IAM Permissions
**Location**: `lib/irsa_roles.py` (autoscaler and ALB controller)
**Error**: Using wildcard permissions like `"autoscaling:*"` and `"ec2:*"`
**Impact**: Violates least privilege principle, security risk

### 10. Missing Environment Suffix in Some Resources
**Location**: `lib/irsa_roles.py` (ALB controller role and policy)
**Error**: Names like `"eks-alb-controller"` missing `environment_suffix`
**Impact**: Resource name conflicts in parallel deployments

### 11. Missing Environment Suffix in Tenant KMS Keys
**Location**: `lib/kms_encryption.py` 
**Error**: Tenant KMS key tags and aliases missing `environment_suffix`
**Impact**: Resource name conflicts

## Low Errors (Minor Impact / Configuration Issues)

### 12. Hardcoded OIDC Thumbprint
**Location**: `lib/eks_cluster.py`
**Error**: Thumbprint list hardcoded to `["9e99a48a9960b14926bb7f3b02e22da2b0ab7280"]`
**Impact**: May not match actual OIDC provider, IRSA might fail

### 13. Hardcoded Bottlerocket AMI Path
**Location**: `lib/eks_node_groups.py`
**Error**: AMI parameter path hardcoded, might not exist for region/version combination
**Impact**: Node group creation might fail if path doesn't exist

### 14. Missing EKS Addon Versions
**Location**: `lib/eks_addons.py`
**Error**: No `addon_version` specified for CoreDNS, kube-proxy, EBS CSI
**Impact**: May get incompatible addon versions

### 15. EBS CSI Driver Missing IRSA Role
**Location**: `lib/eks_addons.py`
**Error**: EBS CSI addon created without `service_account_role_arn`
**Impact**: EBS CSI driver won't have permissions to manage volumes

### 16. CloudWatch Container Insights Not Actually Enabled
**Location**: `lib/monitoring.py`
**Error**: Alarms created for ContainerInsights namespace but Container Insights not configured
**Impact**: Alarms won't trigger, metrics won't exist

## Missing Features (Requirements Not Implemented)

### 17. Pod Security Standards Not Implemented
**Requirement**: Implement pod security standards at namespace level
**Status**: Not implemented in code

### 18. Azure AD Integration Not Implemented
**Requirement**: Configure OIDC provider integration with Azure AD
**Status**: Not implemented in code

### 19. Secrets Manager Integration Missing
**Requirement**: Integrate AWS Secrets Manager with external secrets operator
**Status**: Not implemented in code

### 20. Cluster Autoscaler Configuration Missing
**Requirement**: Implement cluster autoscaler with priority expander
**Status**: IRSA role created but autoscaler itself not deployed

### 21. Dedicated Pod Subnets Not Implemented
**Requirement**: Set up dedicated pod subnets (100.64.0.0/16)
**Status**: Not implemented - using node subnets for pods

## Total Error Count: 21 intentional errors
- Critical: 6 errors
- Medium: 6 errors  
- Low: 6 errors
- Missing Features: 3 major features

These errors provide good training opportunities covering:
- Platform-specific syntax errors (CDKTF Python)
- AWS service configuration mistakes
- Security and compliance issues
- IAM and IRSA common mistakes
- Resource naming and tagging issues
- Missing required features
