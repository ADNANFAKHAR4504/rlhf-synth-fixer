# Model Failures and Issues Found

## Issue 1: Missing EKS Cluster Tagging for Security Group Auto-Discovery

**Severity**: Medium

**Description**: The subnets are tagged with `kubernetes.io/role/elb` and `kubernetes.io/role/internal-elb` for load balancer discovery, but the cluster name tag is missing. EKS requires subnets to be tagged with `kubernetes.io/cluster/<cluster-name>: shared` for proper integration.

**Impact**: Kubernetes services of type LoadBalancer may fail to automatically create ELBs or may not correctly associate them with the appropriate subnets.

**Location**: PublicSubnet1, PublicSubnet2, PrivateSubnet1, PrivateSubnet2 resource definitions

**Fix Required**: Add cluster name tag to all subnets

## Issue 2: IAM Role Names May Conflict

**Severity**: Medium

**Description**: The IAM roles (EKSClusterRole and EKSNodeRole) have explicit RoleNames using the environmentSuffix. If multiple stacks are deployed in the same account with different stack names but the same environmentSuffix, there will be naming conflicts.

**Impact**: Stack creation will fail with "Role already exists" error when attempting to deploy multiple instances.

**Location**: EKSClusterRole and EKSNodeRole resource definitions

**Fix Required**: Either remove explicit RoleName to let CloudFormation auto-generate unique names, or include stack name in the role naming pattern

## Issue 3: Missing KMS Key Deletion Protection

**Severity**: High

**Description**: The KMS key does not have DeletionProtectionEnabled set, and lacks a DeletionPolicy. The constraint specifies all resources must be destroyable, but KMS keys should use a PendingWindowInDays for safe deletion rather than immediate deletion.

**Impact**: KMS key could be deleted immediately during stack deletion, potentially causing data loss if secrets encrypted with this key need to be recovered.

**Location**: EKSKMSKey resource definition

**Fix Required**: Add PendingWindowInDays property to KMS key for safe deletion

## Issue 4: No Resource Dependency Between Node Group and Routes

**Severity**: Medium

**Description**: The EKSNodeGroup depends only on EKSCluster but does not depend on the private route tables or NAT gateways being fully configured. Nodes could attempt to launch before network routing is complete.

**Impact**: Node initialization might fail or timeout if NAT gateways are not ready, causing slower cluster provisioning.

**Location**: EKSNodeGroup resource definition

**Fix Required**: Add DependsOn for PrivateRoute1 and PrivateRoute2 to ensure routing is established

## Issue 5: Missing VPC Flow Logs for Security Monitoring

**Severity**: Low

**Description**: For an expert-level, production-ready EKS deployment, VPC Flow Logs should be enabled for security monitoring and network troubleshooting.

**Impact**: Reduced visibility into network traffic patterns and potential security issues.

**Location**: VPC configuration

**Fix Required**: Add VPC Flow Logs resource with CloudWatch Logs destination

## Issue 6: CloudWatch Log Group Retention Too Short

**Severity**: Low

**Description**: The CloudWatch log group retention is set to 7 days. For production environments, this is typically too short for compliance and troubleshooting purposes.

**Impact**: Important control plane logs may be lost before they can be analyzed for security or operational issues.

**Location**: EKSClusterLogGroup

**Fix Required**: Consider increasing retention to 30 or 90 days for production environments

## Issue 7: No Cluster Endpoint Access Control

**Severity**: Low

**Description**: The cluster has both public and private endpoint access enabled without CIDR restrictions. For enhanced security, public access should be restricted to specific IP ranges.

**Impact**: Cluster API endpoint is accessible from any internet IP address, increasing attack surface.

**Location**: EKSCluster ResourcesVpcConfig

**Fix Required**: Add PublicAccessCidrs parameter to restrict public endpoint access to known IP ranges
