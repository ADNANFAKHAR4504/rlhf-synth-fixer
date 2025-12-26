# Prompt: Generate Secure AWS CloudFormation YAML for secure-config.yaml

You are an expert AWS CloudFormation engineer with extensive experience in security-focused Infrastructure as Code. Your task is to **generate a complete CloudFormation YAML template** that fulfills the exact requirements specified in the "Provided Data" section below.  
**The Provided Data is immutable and must not be altered, omitted, or paraphrased.** All constraints, environment details, and statements must remain exactly as written.

---

## PROVIDED DATA - IMMUTABLE - DO NOT MODIFY

**Constraints:**

Ensure all S3 buckets have server-access logging enabled. | Encrypt all S3 buckets using AWS KMS managed keys. | Implement AWS WAF to protect the CloudFront distribution. | Configure an IAM policy to restrict access based on IP address. | Enable GuardDuty for continuous threat detection. | Setup Network ACLs in the VPC to block suspicious IP ranges. | Ensure RDS instances are not publicly accessible.

**Environment:**

You have been tasked with implementing a security configuration for a company's AWS infrastructure using AWS CloudFormation. The infrastructure includes multiple S3 buckets connected to CloudFront distribution for content delivery, IAM policies, and an Amazon VPC with RDS instances accessible through private subnets. Your objective is to enhance the security posture by applying best practices as code. Specifically, you must:

1. Ensure all S3 buckets have server-access logging enabled.
2. Utilize AWS KMS managed keys to encrypt all S3 buckets.
3. Deploy AWS WAF with specific rules to protect the CloudFront distribution from common web exploits.
4. Create an IAM policy that restricts user access based on IP address.
5. Enable AWS GuardDuty for the account to monitor threats continuously.
6. Implement network ACLs within the VPC to block access from suspicious IP ranges.
7. Ensure that RDS instances are configured not to allow public access.

**Expected output:**  
A YAML-based AWS CloudFormation template that incorporates all the required security configurations. The solution should create or update necessary AWS resources to apply these configurations, ensuring that the infrastructure conforms to the specified constraints.

**Proposed Statement:**

You are working on securing an AWS cloud environment using AWS CloudFormation. The resources include S3 buckets, CloudFront distributions, IAM policies, VPC configurations, AWS GuardDuty, and RDS instances. All configurations should comply with the security best practices in a specific AWS region.

---

## GENERATION INSTRUCTIONS

Follow Anthropic best prompt engineering practices:

1. **Output format** - Provide **only** the complete secure-config.yaml CloudFormation YAML template, with inline comments explaining key security configurations.
2. **No additional commentary** - Do not include explanations outside of YAML comments.
3. **Validation** - Ensure the generated template passes AWS CloudFormation validation with aws cloudformation validate-template and linter checks with cfn-lint.
4. **Parameters** - Include parameters for configurable items such as:
   - Allowed IP ranges
   - Suspicious IP ranges for Network ACL blocking
   - Logging bucket names for S3 server-access logs
   - KMS Key IDs, or auto-generate if not provided
5. **Security best practices** - Implement:
   - Least privilege for IAM roles and policies
   - AWS WAF with common exploit protections like SQL injection and XSS
   - GuardDuty enabled at the account level
   - RDS with PubliclyAccessible set to false
   - All data encrypted at rest with AWS KMS managed keys
   - Network ACLs to explicitly block suspicious IP ranges
6. **Tagging** - Apply consistent tagging with Project, Environment, Owner to all resources for cost tracking and resource identification.
7. **Region** - Ensure the template is compatible with the specified AWS region.
8. **Idempotency** - The template must support repeated deployments without creating duplicate resources.

---

## FINAL TASK FOR AI

Generate the full production-ready CloudFormation YAML template named secure-config.yaml that fully implements every item in the **Provided Data** without modification, adhering to the **Generation Instructions**.  
The output must be valid YAML, self-contained, and immediately deployable via AWS CloudFormation.
