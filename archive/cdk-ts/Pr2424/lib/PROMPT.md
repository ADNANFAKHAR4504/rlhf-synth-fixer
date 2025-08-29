We’re doing this in AWS CDK (TypeScript) and deploying via CloudFormation. Keep the project simple: three files only — bin/tap.ts (app/region wiring), lib/tap-stack.ts (all resources and security controls), and cdk.json (project config). When the model replies, it must return only the code for those three files — no explanations, no comments, nothing extra.

The target is a secure AWS environment that aligns with corporate standards and the CIS AWS Foundations Benchmark. Define everything in TypeScript using CDK constructs. Build a VPC with public and private subnets across multiple AZs. Attach an Internet Gateway for the public side and NAT Gateways for private subnets. EC2 instances must run inside this VPC, and security groups should allow only what’s needed — strictly least privilege. Do the same for all other SGs you define.

Data protection is required everywhere: S3 buckets must block public access and use SSE-S3 for encryption; RDS instances should use KMS encryption, live in private subnets, and only be accessible from approved SGs. EC2 should launch with encrypted EBS volumes. TLS must be enforced where relevant. IAM roles and policies must be least-privilege and scoped only to their intended services.

Monitoring: enable VPC Flow Logs to capture all traffic. Use CloudWatch for metrics, log groups, and alarms, including CPU and memory alarms for EC2 instances (assume the CloudWatch Agent for memory metrics). Logging from services like S3, RDS, and ALB should flow into CloudWatch where possible.

At the edge, expose APIs with API Gateway using AWS-managed TLS certificates (don’t bring in ACM certs here). Place a WAF WebACL in front of the API Gateway and/or CloudFront distributions to guard against common web exploits.

IAM account hygiene is required: enforce MFA on the root account and restrict its usage by creating groups/policies for human access. Make sure tagging (Environment, Project, Owner) is applied to every resource consistently.

This should synth and deploy cleanly with cdk synth and cdk deploy.

Return only the code for bin/tap.ts, lib/tap-stack.ts, and cdk.json.