# Model Failures and Fixes

## Issue 1 — EKS Auto Mode InvalidParameterException

**Error:**

```text
Error: creating EKS Cluster (prod-eks-cluster-pr7054): operation error EKS: CreateCluster, https response error StatusCode: 400, RequestID: 55666654-b12a-4dc4-b4cc-e01f57de9c1b, InvalidParameterException: EKS Auto Mode is only supported for cluster version 1.29 or above.
```

**Root Cause:**

AWS returned an InvalidParameterException indicating "EKS Auto Mode" was being requested for the cluster.
EKS Auto Mode requires the cluster Kubernetes version to be >= 1.29. The Terraform configuration
(provider/tooling and addon versions) caused the AWS API to expect Auto Mode.

**Fix:**
Updated `variables.tf` to bump `var.kubernetes_version` to **1.32** so the cluster meets the AWS requirement.

## Issue 2 — Auto Scaling KMS Authorization Failure

**The Error:**
If this configuration were deployed with encrypted EBS volumes (a standard requirement), the Auto Scaling Group
would fail to launch any instances. The ASG activity history would show `Client.InternalError: Client error on launch`.

**The Reason:**
The model implemented standard EC2/ASG resources but failed to include a KMS Key Policy. When using a Customer
Managed Key (CMK) for EBS encryption in an Auto Scaling Group, the AWS **Service-Linked Role for Auto Scaling**
(`AWSServiceRoleForAutoScaling`) must be explicitly granted permission to use the key. Without this specific
policy statement, the Auto Scaling service cannot decrypt the key to generate the volume for the new instance.

**The Fix:**
You must create a specific KMS Key Policy that allows the Auto Scaling service principal to create grants
and generate data keys.

**Code Fix:**

```hcl
resource "aws_kms_key_policy" "main" {
  key_id = aws_kms_key.main.id
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      # ... (standard root permissions) ...
      {
        Sid    = "Allow Auto Scaling service-linked role to use the key"
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:role/aws-service-role/autoscaling.amazonaws.com/AWSServiceRoleForAutoScaling"
        }
        Action = [
          "kms:Encrypt",
          "kms:Decrypt",
          "kms:ReEncrypt*",
          "kms:GenerateDataKey*",
          "kms:DescribeKey"
        ]
        Resource = "*"
      },
      {
        Sid    = "Allow Auto Scaling service to create grants"
        Effect = "Allow"
        Principal = {
          Service = "autoscaling.amazonaws.com"
        }
        Action = [
          "kms:CreateGrant",
          "kms:ListGrants"
        ]
        Resource = "*"
        Condition = {
          Bool = { "kms:GrantIsForAWSResource" = "true" }
        }
      }
    ]
  })
}
```

## Issue 3 — Pod IP Exhaustion (CNI Configuration Failure)

**The Error:**
In a Kubernetes environment, deployments would fail with `FailedCreatePodSandBox` errors, or nodes would sit
idle unable to schedule pods despite having available CPU/RAM.

**The Reason:**
The model provided a generic network setup. However, EKS networking (via the VPC CNI plugin) assigns a real
VPC IP address to every Pod. By default, the number of Pods is strictly limited by the number of ENIs and
secondary IPs supported by the EC2 instance type (e.g., an `m5.large` supports relatively few). The Ideal
architecture requires **Prefix Delegation**, which assigns `/28` prefixes to network interfaces, significantly
increasing the density of Pods per node. The model missed this CNI configuration entirely.

**The Fix:**
Explicitly configure the `vpc-cni` EKS addon and set the environment variables to enable prefix delegation.

**Code Fix:**

```hcl
resource "aws_eks_addon" "vpc_cni" {
  cluster_name = aws_eks_cluster.main.name
  addon_name   = "vpc-cni"
  
  # This configuration block is critical for high pod density
  configuration_values = jsonencode({
    env = {
      ENABLE_PREFIX_DELEGATION = "true"
      WARM_PREFIX_TARGET       = "1"
    }
  })
}
```
