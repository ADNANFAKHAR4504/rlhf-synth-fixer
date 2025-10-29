Hey team,

We're working with a financial services client who needs to lock down their AWS environment to meet PCI-DSS requirements. They've been running pretty loose with permissions and security controls, and now they need a complete overhaul to implement zero-trust architecture across their multi-account setup.

The main pain point is that their dev teams have been creating resources all over the place - random regions, no encryption, inconsistent tagging, you name it. Their auditors are not happy, and we need to fix this before their next compliance review in Q2.

Here's what we need to build:

**IAM and Access Control:**
- Set up proper role separation for devs, ops, and security teams - each with their own IAM roles
- All role assumptions must require MFA (no exceptions this time)
- Create permission boundaries so developers can't accidentally give themselves admin access
- A cross-account audit role for the security team to read everything without being able to change anything
- Password policy that's actually secure: 14+ characters, mix of everything (upper, lower, numbers, symbols)

**Regional Lockdown:**
- They can only use us-east-1 and us-west-2 (that's where their data centers are)
- Need SCPs at the organization level to prevent anyone from spinning up resources in other regions
- This needs to be enforced at the SCP level, not just IAM policies

**Encryption Everything:**
- KMS keys for S3, RDS, and EBS volumes with auto-rotation enabled
- Keys should be locked down - only accessible within the organization (use that aws:PrincipalOrgID trick)
- Different keys for different purposes, not one master key for everything

**Monitoring and Compliance:**
- CloudWatch alarms for sketchy stuff: unauthorized API calls, root account usage (they shouldn't be using root at all)
- AWS Config rules to continuously monitor compliance
- All CloudWatch logs need 365-day retention and must be encrypted with KMS
- Need proper audit trails for everything

**Secure Access:**
- Systems Manager Session Manager for EC2 access - no more SSH keys floating around
- VPC endpoints are already configured for private API access, so use those

**Tagging Enforcement:**
- Every resource must have: Environment, Owner, and CostCenter tags
- This should be enforced through tag policies, not just documentation

**Technical Requirements:**
- Terraform 1.5 or higher
- AWS provider 5.x
- Use data sources to pull in the AWS Organizations structure - don't hardcode account IDs
- Set up locals for naming conventions so everything is consistent
- No wildcard permissions (*) on production resources - least privilege only
- Make it modular so we can deploy this across multiple accounts

**What I need from you:**

Files to create:
1. iam.tf - All the IAM roles, policies, password policy, permission boundaries
2. kms.tf - KMS keys with rotation and proper policies
3. scp.tf - Service Control Policies for regional restrictions
4. cloudwatch.tf - Alarms and monitoring setup
5. config.tf - AWS Config rules for compliance monitoring
6. session-manager.tf - Systems Manager configuration
7. tagging.tf - Tag enforcement policies
8. audit-role.tf - Cross-account audit role setup
9. variables.tf - All input variables with sensible defaults
10. outputs.tf - Important outputs like role ARNs, KMS key IDs
11. locals.tf - Naming conventions and reusable values

Make sure everything follows the least-privilege principle. The security team is going to review this with a fine-tooth comb, so no shortcuts. Also, keep the code clean and well-commented - other teams will need to understand and maintain this.

Thanks!