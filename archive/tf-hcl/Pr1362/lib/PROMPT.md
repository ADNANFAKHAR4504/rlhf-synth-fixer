Im standing up a brand‑new, secure AWS stack and I want everything in one file: main.tf. I already have provider.tf that configures the AWS provider using var.aws_region, so dont touch or reference any other files. Put everything else in main.tf: variables, locals, the terraform block (including remote backend), data sources, resources, dynamic logic, and outputs. The file should be valid HCL onlyno comments or prose in the output.

Please target Terraform v1.0.0+. Configure remote state in the terraform block using an S3 backend with bucket prod-terraform-state and DynamoDB state locking. Include a DynamoDB table resource for locking so the table exists (I know backends init before resources; Ill bootstrap as needed, but still include the table so its managed going forward).

Use a consistent prod- prefix on resource names and sensible default tags. Favor least privilege, KMS encryption everywhere, and parameterization where it helps. I dont want separate modules or extra files, but please avoid repetition using locals, maps, for_each, and dynamic blocks so it still feels maintainable.

Region and variables. Default region is us‑west‑1. In this file, declare variable "aws_region" with default "us-west-1" (the provider already reads it from provider.tf). Also declare:

allowed_https_cidrs (list(string)) the only CIDRs allowed to reach the app tier (use for LB ingress).

bastion_ingress_cidrs (list(string)) who can SSH to the bastion.

vpc_cidr (default 10.20.0.0/16).

Sizing knobs for instance types, ASG min/max/desired, RDS class/storage, etc.

Networking. Create a VPC from vpc_cidr. Split into public and private subnets across at least two AZs with sane CIDRs. Attach an Internet Gateway. Put NAT Gateways so private subnets have outbound internet via NAT. All app EC2s launch only in private subnets with no public IPs. Add a bastion host in a public subnet; its the only box you can SSH into, and only from var.bastion_ingress_cidrs.

Security groups and NACLs. App tier security group: allow inbound 443 only from var.allowed_https_cidrs (and health checks from the load balancer if needed). Keep egress minimal/appropriate. The bastion SG allows SSH from var.bastion_ingress_cidrs and can SSH into private instances via SG‑to‑SG rules. Add NACLs where public and private subnets are locked down to required flows only (HTTPS to app tier, SSH to bastion, plus return/ephemeral).

Compute and scale. Put an Auto Scaling Group in private subnets behind a Network Load Balancer (NLB) in public subnets, listening on TCP :443 (TLS is terminated on the instances to avoid ACM). Target group should be TCP:443 against the instances. Scaling policies: scale out when average CPU > 60%, scale in when < 30%. Also add a CloudWatch alarm that fires when ASG CPU > 80% for 5 minutes.

S3, KMS, and logging. Every S3 bucket is KMS‑encrypted with customer‑managed keys created here. I need a general logs bucket (access logs, security change logs, app logs). Block public access (all four flags), require TLS, and deny unencrypted puts. Turn on server access logging (targeting the logs bucket). Use least‑privilege key policies and specific grants for the services and roles that need them.

IAM (roles, not users). Create roles for:

EC2 app instances (read from SSM Parameter Store/Secrets Manager; write logs/metrics as needed).

Lambda (for security/event handling and scheduled checks).
Use AWS managed policies where sensible and inline policies for gapskeep it least privilege. No IAM users.

RDS. Launch PostgreSQL in private subnets, not publicly accessible. Enforce storage encryption, backups ≥ 7 days, deletion protection enabled by default, and enhanced monitoring if practical. The DB security group should only allow traffic from the app tier SG. Make the instance class and storage size variables.

Auditing & events (without CloudTrail). Create EventBridge rules to capture Security Group change API events (CreateSecurityGroup, Authorize/Revoke ingress/egress, DeleteSecurityGroup) using the AWS API Call via CloudTrail event source (no dedicated trail required). Send these to CloudWatch Logs and optionally an SNS topic for notifications. Add CloudWatch alarms for unauthorized API calls and root usage if available via service metrics/logs; otherwise focus on the ASG CPU alarm above.

API (no WAF or ACM). Provide a minimal HTTP API Gateway or keep it out entirelyyour choice. If included, keep it private/internal (VPC‑linked or private integration) and require IAM auth. Do not attach WAF and do not create ACM certificates in this file.

Lambda for security automation. Include one Lambda that either reacts to the SG change events (posts details to CloudWatch/SNS) or runs a periodic compliance check via an EventBridge schedule. It should live in private subnets with NAT access and have a tight role.

Outputs. Please surface the practical stuff: VPC ID; subnet IDs by tier; security group IDs; NLB DNS name; bastion public DNS; ASG name; RDS endpoint; the logs bucket name; API endpoint URL (if created).

Finally, the configuration should pass terraform validate. Double‑check the hard requirements: EC2 only in private subnets with no public IPs; S3 encrypted with CMKs; app tier accepts inbound 443 only from var.allowed_https_cidrs; RDS is private; no CloudTrail, no ACM, no WAF; ASG CPU alarm at >80% for 5 minutes; and the VPC has an attached Internet Gateway. Keep the prod- naming and tagging consistent throughout