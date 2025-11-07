# Model Failures and Issues

## Critical Issue: KMS Key Policy Missing Auto Scaling Service Principal

### Error Encountered
```
Error: waiting for EKS Node Group (eks-cluster-synthar3eg:node-group-synthar3eg) create: unexpected state 'CREATE_FAILED', wanted target 'ACTIVE'.
last error: AsgInstanceLaunchFailures: Instance became unhealthy while waiting for instance to be in InService state.
Termination Reason: Client.InvalidKMSKey.InvalidState: The KMS key provided is in an incorrect state
```

### Root Cause
The KMS key created for EBS volume encryption does not include the necessary permissions for the AWS Auto Scaling service to use it. When the EKS managed node group attempts to launch EC2 instances with encrypted EBS volumes using a launch template, the Auto Scaling service needs explicit permission to use the KMS key for encryption operations.

###  Impact
- Node group creation fails after 35+ minutes
- Deployment cannot complete
- Infrastructure must be destroyed and recreated with corrected KMS policy

### Solution Required
The KMS key policy in `lib/eks-cluster.tf` needs to include a statement that grants the Auto Scaling service principal (`autoscaling.amazonaws.com`) permission to use the key. The policy should allow:
- `kms:Decrypt`
- `kms:Encrypt`
- `kms:ReEncrypt*`
- `kms:GenerateDataKey*`
- `kms:CreateGrant`
- `kms:DescribeKey`

Additionally, the policy should be conditioned on the Auto Scaling service creating grants on behalf of the EC2 service.

### Deployment Timeline
- Initial terraform apply started: 12:26 PM
- Node group creation started: ~12:35 PM (after 9min cluster creation)
- Node group failed: 13:09 PM (after 34 minutes)
- Total deployment attempt: ~43 minutes before failure

### Lessons Learned
1. KMS keys used for EBS encryption in EKS node groups require explicit service principal permissions
2. The Auto Scaling service needs `CreateGrant` permission to delegate key usage to EC2 instances
3. Terraform validation and plan do not catch runtime IAM/KMS permission issues
4. EKS node group deployments can take 30+ minutes before failing, making iterative testing time-consuming

### Fix Applied (Iteration 1 - INCOMPLETE)
Initially updated `lib/eks-cluster.tf` to include Auto Scaling service principal permissions. However, this failed again with the same error.

### Root Cause Analysis (Deeper Investigation)
After the second failure, identified that AWS Auto Scaling uses a **service-linked role** rather than the service principal directly for KMS operations. The Auto Scaling service-linked role (`AWSServiceRoleForAutoScaling`) needs explicit permission to:
1. Use the KMS key for encryption operations
2. Create grants that allow EC2 to use the key for EBS volumes

### Fix Applied (Iteration 2 - SUCCESSFUL)
Updated `lib/eks-cluster.tf` with the correct KMS key policy using four statements:
1. Root account permissions (required for key management)
2. Service-linked role permissions for Auto Scaling (grants decrypt, encrypt, generate data key, create grant)
3. Grant creation with condition (allows creating grants for AWS resources only)
4. EKS service permissions (required for secrets encryption)

The key now explicitly grants the Auto Scaling service-linked role ARN permissions instead of the service principal, which is the correct approach for EBS encryption in launch templates.

### Deployment Results (Third Attempt - SUCCESS)
**Deployment Time**: ~12 minutes total
- EKS cluster creation: 9m 53s
- Node group creation: 1m 41s (vs 35+ minutes to fail in previous attempts)
- All 3 EKS addons installed successfully

**Final Status**:
- ✅ EKS Cluster: ACTIVE (Kubernetes 1.28)
- ✅ Node Group: ACTIVE (3 t4g.medium instances across 3 AZs)
- ✅ Encrypted EBS volumes: Working correctly with KMS key
- ✅ VPC CNI with prefix delegation: Enabled
- ✅ CoreDNS, kube-proxy: Installed
- ✅ No health issues detected

### Key Lessons for Future EKS Deployments
1. **Service-Linked Roles vs Service Principals**: When using customer-managed KMS keys for EBS encryption in EKS node groups, grant permissions to the Auto Scaling service-linked role ARN (`arn:aws:iam::ACCOUNT:role/aws-service-role/autoscaling.amazonaws.com/AWSServiceRoleForAutoScaling`), not the service principal
2. **Grant Permissions**: Include `kms:CreateGrant` with condition `kms:GrantIsForAWSResource = true` to allow Auto Scaling to delegate key usage to EC2 instances
3. **Testing Cycle Time**: EKS node group failures can take 30+ minutes to surface, making iterative debugging very time-consuming
4. **Addon Version Compatibility**: Always verify EKS addon versions are compatible with the specific Kubernetes version being deployed