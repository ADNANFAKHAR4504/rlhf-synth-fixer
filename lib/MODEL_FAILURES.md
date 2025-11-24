# Model Failures and Fixes

### Issue — EKS Auto Mode InvalidParameterException (observed during apply)

**Error:**

```
Error: creating EKS Cluster (prod-eks-cluster-pr7054): operation error EKS: CreateCluster, https response error StatusCode: 400, RequestID: 55666654-b12a-4dc4-b4cc-e01f57de9c1b, InvalidParameterException: EKS Auto Mode is only supported for cluster version 1.29 or above.
```

**Root Cause:**

AWS returned an InvalidParameterException indicating "EKS Auto Mode" was being requested for the cluster. EKS Auto Mode requires the cluster Kubernetes version to be >= 1.29. The Terraform configuration (provider/tooling and addon versions) caused the AWS API to expect Auto Mode.

**Fix:**

1. Updated `variables.tf` to bump `var.kubernetes_version` to **1.32** so the cluster meets the AWS requirement.
2. Left a note in `variables.tf` explaining the change and tradeoffs (we can revert and refactor if strict 1.28 is required).

