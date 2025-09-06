Common Model Failures

Overview
This document outlines common failure patterns when generating AWS security architecture Terraform code.

Critical Failures

1. File Structure Violations
Creating additional files beyond provider.tf and tap_stack.tf
- Models often create variables.tf, outputs.tf, terraform.tfvars
- Requirement explicitly states only 2 files

Using modules or external dependencies
- Code must be self-contained and runnable
- No module calls or external references

2. Terraform Syntax Errors
Invalid HCL syntax that fails terraform validate
- Missing quotes, brackets, or commas
- Incorrect resource block structure
- Invalid interpolation syntax

Provider configuration errors
- Missing required_providers block
- Incorrect provider aliases
- Missing default_tags configuration

3. Multi-Region Implementation Failures
Hardcoded regions instead of using variables/locals
- Not using for_each over regions
- Duplicating resources instead of iterating

Incorrect provider scoping
- Using default provider for all regions
- Missing provider aliases in resource blocks
- Incorrect provider reference syntax

4. Security Control Omissions
Missing required security controls
- Failing to implement all 10 specified controls
- Partial implementation without full coverage

Weak security configurations
- Using AWS managed keys instead of CMK
- Missing encryption configurations
- Overly permissive IAM policies

5. Naming Convention Violations
Inconsistent naming patterns
- Not following {project}-{environment}-{component} format
- Hardcoded names instead of using locals
- Missing or incorrect resource naming

6. IAM and Permission Issues
Overly broad IAM policies
- Using wildcard permissions unnecessarily
- Not following principle of least privilege
- Missing condition blocks for security

Missing service-linked roles
- Not creating required IAM roles for services
- Incorrect assume role policies
- Missing policy attachments

7. Resource Dependency Problems
Missing explicit dependencies
- Resources failing due to dependencies ordering
- Not using depends_on where required
- Circular dependencies

Data source failures
- Not handling cases where data sources return empty
- Missing fallback logic for optional resources

8. Tagging Inconsistencies
Missing or inconsistent tags
- Not using default_tags in provider
- Missing required Environment/Owner tags
- Inconsistent tag values across resources

9. Output Specification Failures
Missing required outputs
- Not providing ARNs/IDs for key resources
- Incorrect output value references
- Missing output descriptions

10. CloudFormation References
Including CloudFormation code
- Requirement explicitly states Terraform HCL only
- No CloudFormation templates or references allowed

Subtle Failures

1. KMS Key Policy Issues
Insufficient key policies for services
- Missing CloudTrail permissions
- Missing CloudWatch Logs permissions
- Not allowing root account access

2. S3 Bucket Policy Problems
Missing TLS enforcement
- Not including aws:SecureTransport condition
- Allowing unencrypted access

Incorrect CloudTrail permissions
- Missing GetBucketAcl permission
- Incorrect resource ARN formats

3. CloudWatch Integration Issues
Missing log group creation
- CloudTrail integration failing
- Incorrect log group ARN format

KMS encryption not applied to logs