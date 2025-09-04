# MODEL_FAILURES.md

## Common Model Failures for AWS Nova Model Breaking (Pulumi Python)

This document lists typical model failures, misconfigurations, and compliance issues encountered when building secure AWS infrastructure for production using Pulumi in Python. Use this as a checklist to avoid common pitfalls and ensure robust, compliant deployments.

---

### 1. VPC & Networking
- **VPC not created in `us-east-1` region**
- **Subnets not distributed across multiple Availability Zones**
- **Missing or misconfigured Internet Gateway**
- **Route tables not associated with subnets**
- **No NAT Gateway for private subnet outbound access**

### 2. Security Groups
- **Security group allows inbound traffic on ports other than 80/443**
- **Missing egress rules for outbound traffic**
- **Security group not attached to EC2 or Lambda resources**

### 3. EC2 Instances & IAM Roles
- **EC2 instances lack unique IAM roles**
- **IAM roles missing required policies (e.g., CloudWatchAgentServerPolicy)**
- **EBS volumes not encrypted with KMS**
- **User data script missing or not PEP8 compliant**


### 4. API Gateway & Logging
- API Gateway logging to CloudWatch is correctly implemented with proper resource dependencies.
- CloudWatch log group for API Gateway is encrypted with KMS.
- IAM role for API Gateway CloudWatch logging is correctly attached.

### 5. Encryption (KMS)
- **KMS key not created or not used for log/volume encryption**
- **KMS key policy too permissive or missing required principals**
- **No KMS alias for key management**


### 6. Health Monitoring (Lambda)
- Lambda function is scheduled using EventBridge rule (every 5 minutes).
- Lambda is configured with VPC and security group.
- Lambda IAM role includes all required permissions for EC2, CloudWatch, and VPC actions.
- CloudWatch log group for Lambda is encrypted with KMS.


### 9. Resource Tagging & Config Management
- All resources are tagged with `Environment: Production`.
- Pulumi config is used for environment-specific variables.
- Resource names follow clear naming conventions.

### 8. Code Quality & Compliance
- **Missing type annotations in Python code**
- **Code not PEP8 compliant**
- **Pulumi exports not set for key resources**

---


## How to Avoid These Failures
- Set region to `us-east-1` in Pulumi config (already enforced).
- Use Pulumi's config and stack management for environment variables (already implemented).
- Tag all resources with `Environment: Production` (already implemented).
- Encrypt all sensitive resources with KMS (already implemented).
- Restrict security group rules to only required ports (already implemented).
- Use managed services (API Gateway, Lambda, CloudWatch) for operational efficiency (already implemented).
- Validate code with PEP8 and type annotations.
- Export key resource IDs and endpoints for visibility (already implemented).

---

## References
- [PROMPT.md](PROMPT.md)
- [MODEL_RESPONSE.md](MODEL_RESPONSE.md)
- [Pulumi AWS Documentation](https://www.pulumi.com/docs/reference/pkg/aws/)
- [PEP8 Style Guide](https://peps.python.org/pep-0008/)
