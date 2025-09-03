```markdown
## Goal
Establish a secure and compliant AWS environment using **a single YAML CloudFormation template**.

## Scope & Responsibilities
1. Implement security best practices for **S3, RDS, EC2, and IAM**.
2. Create a **VPC** with required subnets and security settings (multi-AZ for HA).
3. Set up **CloudFront**, **CloudTrail**, **GuardDuty**, and **AWS WAF** where applicable.
4. Include example **stack outputs** and a **sample deployment command** for parameters.

## Constraints (address all 15)
1. All S3 buckets use **server-side encryption**.
2. IAM roles follow **least privilege**.
3. **CloudFront** distributions have **access logging** enabled.
4. **RDS instances** run in **private subnets** only.
5. **CloudWatch Alarms** for EC2 when **CPU > 80%**.
6. Enforce **MFA** for all IAM users (e.g., via conditional IAM policy).
7. Every EC2 instance is in a **security group** allowing **only SSH (22) and HTTP (80)** inbound.
8. **GuardDuty** enabled across all **supported regions**.
9. All **Lambda functions** have an explicit **timeout**.
10. **CloudTrail** enabled; logs delivered securely to **encrypted S3**.
11. **AWS WAF** attached to all **Application Load Balancers**.
12. **Deletion protection** enabled on all **RDS clusters/instances**.
13. All **EBS volumes** are **encrypted at rest**.
14. **Automated backups/snapshots** enabled for critical **RDS**.
15. **VPC** uses **multi-AZ subnets** for high availability.

## Additional Requirements
- **Regions:** Support deployment in **us-east-1** and **us-west-2** (no hard-coded ARNs/regions).
- **Naming convention:** `projname-env-resource` (e.g., `myapp-prod-bucket`) applied consistently via parameters and mappings.
- Gather necessary **Parameters** (e.g., `ProjectName`, `Environment`, `VpcCidr`, `PublicSubnetCidrs`, `PrivateSubnetCidrs`, `InstanceType`, `KeyName`, etc.).
- Use **Outputs** to surface key resource IDs/ARNs and compliance-relevant flags.

## Output Format
- Deliver **one** CloudFormation **YAML** template that implements everything above.
- Include:
  - `Parameters`, `Mappings` (if needed), `Conditions`, `Resources`, and `Outputs`.
  - Inline comments explaining how each constraint is satisfied.
  - A minimal example **`aws cloudformation deploy`** command showing how to pass required parameters.

## Notes
- Prefer **managed policies** only when unavoidable; otherwise define **least-privilege inline policies**.
- Ensure logs (CloudTrail, ALB/WAF, CloudFront) go to **encrypted S3** with **restricted access** and **lifecycle policies**.
- Avoid deprecated resource types; use current **AWS::** resource specifications.
```