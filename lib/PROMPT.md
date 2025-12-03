You are an expert AWS CDK (TypeScript) engineer. Generate a single, production‑ready TypeScript AWS CDK v2 file named infrastructure.ts that defines and deploys the exact environment described below. Do NOT change, omit, or reinterpret any of the supplied requirements, constraints, environment values, or naming rules. Every requirement must be implemented verbatim.

High-level goal
- Use AWS CloudFormation via AWS CDK (v2) in TypeScript to provision a secure, highly‑available, monitored cloud environment in any region that satisfies the exact list of requirements and constraints below.

Important naming rule (String suffix)
- All resource physical names that must be unique (S3 bucket names, backups vaults, CloudWatch dashboard names, Secrets Manager secret names, etc.) must append a configurable String suffix.
- Put the suffix in one clear top-of-file configuration variable near the top of the generated TypeScript file:
  - Example: const nameSuffix = '-dev01'; // Change this one value to adjust suffix across all resources
- Document in comments exactly where to change that suffix. Use resource names formatted like {logicalPrefix}{nameSuffix} wherever a physical/visible name is set.

Top-level configuration block (must appear at the top of the file)
- Include a clearly labeled configuration block containing at least:
  - region: 'us-east-1' (must be used)
  - nameSuffix (default value; indicate how to change)
  - ec2AmiId: placeholder string for the required AMI ID (document that the user must replace this with the actual AMI id before deploy)
  - instanceType/defaultAutoScaling settings (min/max)
  - vpcCidr (optional; default if present)
  - logging-retention-days and backup retention defaults
- Document how to change those values in comments.

Required infrastructure (implement each item verbatim)
1. Region
   - All resources must be deployed in any region. Use the CDK env config to target that region.
2. High availability
   - Design a multi‑AZ VPC (minimum two AZs). Create public and private subnets in each AZ to meet multi‑AZ high availability.
3. EC2 instance with AMI and Elastic IP
   - Deploy at least one EC2 instance using the configured ec2AmiId placeholder.
   - Associate an Elastic IP with that instance (or demonstrate a safe pattern to allocate/attach an EIP to the primary instance).
   - Place the instance in the private subnet and provide a public bastion (or NAT) as needed while following least privilege and security best practices.
4. Secrets Manager
   - Use AWS Secrets Manager for all sensitive values needed by the stack (DB passwords, app credentials). Create at least one secret resource and reference it from any resource that needs credentials (do not put plaintext secrets into code).
5. S3 bucket with versioning
   - Create an S3 bucket with versioning enabled and an encryption policy (SSE‑KMS). The bucket name must include the nameSuffix.
   - Enforce secure transport (bucket policy requiring aws:SecureTransport) and block public access by default.
6. CloudWatch alarms for EC2 CPU
   - Create CloudWatch alarm(s) that monitor average CPU utilization on the EC2 instance (or AutoScaling Group) and trigger SNS notifications. Provide an SNS topic (name includes suffix) and show how to subscribe an email endpoint (use placeholder email).
7. IAM role for EC2
   - Define an IAM role (no inline JSON blobs as strings — use CDK IAM constructs) that grants only the minimal permissions necessary for the EC2 instance to:
     - Read secrets from Secrets Manager
     - Write logs to CloudWatch Logs
     - Read S3 objects (if needed)
   - Define any custom policies in code and attach them to the role. Document least‑privilege rationale in comments.
8. Enable logging for all services
   - Enable and demonstrate logging for EC2 (CloudWatch Logs agent or SSM), S3 access logs (or S3 server access logging), AWS Backup audit logs, and any other services created. Create a centralized CloudWatch Log Group (name with suffix) with a reasonable retention period.
9. VPC with public and private subnets
   - Create a VPC that spans at least two AZs with public and private subnets per AZ. Configure route tables and NAT Gateways (or NAT instances) for outbound internet access from private subnets while minimizing NAT cost if documented as an option.
10. AWS Backup
    - Create an AWS Backup plan and backup vault, and assign backup selections that include EC2 (instance AMI or EBS volumes), RDS (if included; RDS optional but ensure backups support it if present), and EFS (if created). Use KMS for backup encryption. Use nameSuffix for vault names.
11. Auto Scaling for EC2
    - Implement an AutoScalingGroup or CDK AutoScaling construct for the EC2 instance(s) with sensible default min/max sizes and CPU-based target tracking scaling policies. Ensure cross‑AZ scaling and health checks for zero‑downtime updates.
12. IAM roles & policies in code
    - Define all IAM roles and policies using CDK constructs in code (no out-of-band console/manual resources). Attach policies with least privilege and document them inline.
13. Security best practices
    - Security groups should follow least privilege (only allow necessary inbound ports, e.g., SSH from a configurable admin CIDR, app ports from ALB, etc.). Use NACLs where appropriate with documented rationale.
14. Outputs & stack metadata
    - Provide CloudFormation outputs listing key resource identifiers: VPC ID, subnet IDs, EC2 instance ID(s), AutoScalingGroup name, ALB DNS (if created), S3 bucket name, Secrets Manager secret ARNs, CloudWatch Log Group names, SNS Topic ARN, Backup vault name, and IAM role ARNs. Make sure output names include the nameSuffix when applicable.

Implementation quality & deliverables
- Produce a single TypeScript file named infrastructure.ts that:
  - Is compatible with CDK v2 and Node.js 18+.
  - Contains comprehensive comments explaining design choices and where to change configuration values (region, nameSuffix, AMI id, instance types, min/max ASG sizes, admin CIDR for SSH).
  - Uses constructs and is modular/idiomatic TypeScript (you may use nested constructs in one file; keep everything in one file per deliverable requirement).
  - Provides a top-of-file "post-deployment validation checklist" as comments showing how to verify:
    - S3 versioning and encryption
    - Secrets Manager secrets present and accessible via IAM role
    - CloudWatch alarms firing
    - AutoScaling behavior (scale out/in)
    - AWS Backup job status and restore test steps
  - Uses CDK best practices for naming, tagging (add tags: Environment, Name, Owner), and resource policies.
- Include CloudFormation stack outputs as described above (physical resource identifiers).
- Ensure that the generated template will synth (cdk synth) without errors and is deployable (cdk deploy) assuming the user fills in the ec2AmiId and has appropriate AWS credentials.

Constraints (must be followed verbatim)
- Ensure all resources are deployed in 'any region'.
- Use the AWS CDK to define cloud infrastructure in TypeScript.
- Implement a multi-AZ architecture for high availability.
- Include at least one EC2 instance with a specified AMI ID (use the ec2AmiId configuration variable).
- Attach an Elastic IP to the EC2 instance.
- Use AWS Secrets Manager to manage sensitive data.
- Create an S3 bucket with versioning enabled.
- Configure CloudWatch alarms for EC2 instance CPU utilization.
- Set up an IAM role with necessary permissions for the EC2 instance.
- Enable logging for all services used.
- Create a VPC with public and private subnets.
- Utilize AWS Backup for EC2, RDS, and EFS resources (if present).
- Implement auto-scaling for the EC2 instance.
- Ensure all IAM roles and policies are defined as code.

Testing & validation notes (include these as comments in the TypeScript file)
- Document how to run:
  - cdk synth
  - cdk deploy (per-stack or --all)
  - Basic smoke tests (SSH/SSM access to instance, curl ALB endpoint, check CloudWatch logs).
- Explain how to roll back (cdk destroy) and any precautions (RDS/EBS/EFS data retention).

Final enforcement (MUST be obeyed)
- Do NOT change any of the requirements, constraints, or environment values provided in this prompt.
- Ensure the String suffix is appended to resource names where needed; put the editable suffix in one location at the top of the file and document how to change it.
- Produce only TypeScript CDK code (CloudFormation via CDK). Do not output Terraform, Pulumi, or any other IaC.
- The generated TypeScript file must synthesize cleanly (cdk synth) and be deployable (cdk deploy) given valid AWS credentials and that the user supplies the AMI ID placeholder.

