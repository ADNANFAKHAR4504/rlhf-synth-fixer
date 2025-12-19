# model_response

## Summary

This response delivers a secure, self-contained CloudFormation design that creates:

* A new VPC with public/private subnets, IGW, NAT, and proper routing.
* An Application Load Balancer with conditional HTTPS:
  When a valid ACM ARN is provided, only HTTPS (443) is exposed; otherwise, it temporarily exposes HTTP (80) to allow a frictionless first deploy and can be updated to HTTPS later.
* Two S3 buckets: an application bucket (protected by least-privilege IAM) and a centralized logs bucket for ALB and S3 server access logs. Both have versioning, public access blocks, and default encryption.
* A tightly scoped IAM role for EC2 restricted to `s3:ListBucket` on the application bucket and `s3:GetObject`/`s3:PutObject` on its objects, staying within the six-statement limit.
* Consistent naming with `<project>-<resource>-<environment>` and universal tagging with `Environment`, `Project`, and `Owner`.
* Outputs for key ARNs, names, IDs, and endpoints.

## How the requirements are satisfied

* **IAM S3 policy** limits actions precisely to `ListBucket`, `GetObject`, and `PutObject`, scoped to the single application bucket and its objects. Trust is granted to `ec2.amazonaws.com` via the role’s assume-role policy.
* **Security Groups** expose only the necessary port. Under normal operation with a certificate, only 443 is opened to the world; app instances accept only traffic from the ALB SG on the app port.
* **VPC isolation** uses a fresh VPC, subnets across AZs, IGW for ingress to ALB, NAT for private egress, and correct route associations.
* **ALB with SSL** attaches an ACM certificate when provided and enables access logging into the logs bucket. The bucket policy is aligned with the log prefix and includes both log-delivery principals.
* **S3 versioning** is enabled on both buckets; public access is blocked; default encryption is enabled.
* **Parameterization** includes project, environment, owner, network CIDRs, app port, and an optional ACM ARN. Bucket names are generated deterministically from these inputs to remain DNS-compliant.
* **Outputs** return useful identifiers and ARNs for downstream automation.
* **Macros** are not required; native intrinsics provide clean name templating and conditions.

## Notable implementation choices

* **Conditional HTTPS** avoids deployment failures in environments where an ACM certificate is not yet issued, while still encouraging HTTPS-only operation as the target state.
* **Prefix-aware ALB log policy** ensures the ALB can write exactly to the configured path within the logs bucket and no broader.
* **Ownership controls and ACL condition** on the logs bucket are set to ensure log delivery succeeds with `bucket-owner-full-control`.
* **Minimal IAM surface** meets the six-statement cap and keeps S3 access strictly to the required actions.

## Operational notes

* For production, supply a valid ACM certificate ARN in the same region as the stack. After updating that parameter, the stack will serve HTTPS on port 443 and remove HTTP exposure.
* Bucket names are derived to stay within DNS limits and avoid collisions; if necessary, adjust the project or environment strings to ensure uniqueness.
* All outputs are stable and descriptive to streamline integration testing, observability setup, and downstream provisioning.