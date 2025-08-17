Act as a senior AWS CloudFormation engineer.

Goal Produce a single CloudFormation YAML template named secure_infrastructure.yaml that deploys a secure, production-ready baseline in us-east-1.

Language & Platform

Language: YAML
Platform: AWS CloudFormation (no CDK/SAM)
Architecture (must implement all)

VPC (secure, multi-AZ)
New VPC (e.g., 10.0.0.0/16) in us-east-1.
2 public and 2 private subnets across distinct AZs (use !GetAZs + !Select; do not hardcode AZ names).
Internet Gateway for public subnets, NAT Gateway for private subnets.
Route tables and associations for public/private subnets.
VPC Flow Logs → CloudWatch Logs (encrypted), with an IAM role/policy for delivery and a LogGroup with retention.
Network Load Balancer (NLB)
Internet-facing NLB spanning both public subnets.
Target Group (TCP) with health checks.
Listener (TCP, e.g., port 80 or 8080) forwarding to the target group.
Multiple EC2 instances in private subnets registered to the TG (launched in different AZs for HA).
EC2 (public bastion / utility)
One EC2 instance in a public subnet with an IAM Instance Profile.
IAM Role permissions (least privilege): access to *S3 (read/write as appropriate), EC2 (Describe), and CloudWatch (logs + metrics)**.
UserData can install a simple web or bootstrap agent (optional, but include basic health endpoint if using HTTP TG elsewhere).
Security Groups
All EC2 instances: inbound SSH (22) only from a specific IP/CIDR (use a parameter like AllowedSSHIp with CIDR validation).
For NLB-backed instances: allow application port only from the NLB’s SG; deny internet ingress to these instances.
Egress should be least-privilege or default allow to 0.0.0.0/0 as appropriate.
S3
Create an S3 bucket with server-side encryption (SSE-S3 or SSE-KMS; prefer KMS).
Block all public access at bucket level.
Add tags and (optional) lifecycle/ownership controls if needed.
Tagging
Apply Environment=Production to all resources that support tagging.
Region & Robustness

Assume deployment in us-east-1; add a Condition to fail if ${AWS::Region} != us-east-1.
Avoid hardcoded AZ names; use !GetAZs.
Use dynamic AMI via SSM parameter for Amazon Linux 2 (no hardcoded AMI IDs).
Security Best Practices (must show explicitly in template)

Least-privilege IAM policies for the EC2 role and Flow Logs delivery.
No public access to private-tier instances; NLB handles ingress.
Encrypted CloudWatch LogGroup for Flow Logs; set retention (e.g., 30+ days).
S3 bucket public access block enabled; encryption required.
NACLs optional; if included, keep conservative rules and document them in comments.
Template Requirements

No external tools; pure CloudFormation YAML.
Include helpful comments explaining each major block.
Add Outputs for: VPC ID, Public/Private Subnet IDs, NLB ARN & DNS, Target Group ARN, Public EC2 InstanceId/PublicIP, S3 Bucket Name, VPC Flow Logs LogGroup.
Add Metadata or comments with a short runbook (how to test reachability and logs).
Parameters (minimal, validated)

AllowedSSHIp (String, CIDR; e.g., default “203.0.113.10/32”; regex validation).
(Optional) InstanceType (default t3.micro).
Keep other values self-contained to ensure easy deployment.
Validation & Tests (embed as YAML comments at bottom)

cfn-lint passes; no W30xx warnings for hardcoded AZs.
Stack creates successfully in us-east-1.
Verify:
EC2 (public) reachable via SSH only from AllowedSSHIp.
NLB DNS name returns healthy target status (targets are instances in private subnets).
Flow Logs delivering entries to CloudWatch Logs.
S3 bucket encryption status = Enabled; public access blocked.
All resources carry Environment=Production tag.
Return Format

Return only the final file content, named secure_infrastructure.yaml (no extra prose).
Use intrinsic functions correctly, include DependsOn only when necessary to avoid circular dependencies.