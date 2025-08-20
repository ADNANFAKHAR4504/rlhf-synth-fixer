# Pulumi AWS Infra – Secure Production Setup in ap-south-1

I’m building a secure AWS setup using Pulumi with TypeScript, and I want it to be clean, production-ready, and scoped specifically to the `ap-south-1` region. Everything should follow AWS security and IAM best practices.

Here’s what I need in the infrastructure:

- A VPC with CIDR `10.0.0.0/16`.
- Two public subnets (`10.0.1.0/24` and `10.0.2.0/24`) in different AZs.
- Security groups that:
  - Allow inbound SSH (port 22) from the internet.
  - Allow HTTP traffic (port 80) from the internet.
- An IAM role for EC2 instances that sticks to the principle of least privilege — only the EC2 actions needed for app deployment.
- CloudTrail should be enabled to log all account activity.
- CloudTrail logs must be stored in an S3 bucket with encryption via AWS KMS.
- A DynamoDB table using **provisioned throughput mode** — I’ll need to specify RCUs and WCUs.
- That DynamoDB table should also be encrypted at rest using KMS.
- Tag everything properly using keys like `Environment`, `Project`, etc.
- Please add comments in the code where it helps clarify structure or intent.
- Use a Pulumi `Provider` to make sure all resources are deployed in `ap-south-1`.

Please provide the Pulumi TypeScript code to implement this setup. No boilerplate or project scaffolding needed — just the core infrastructure logic, with a focus on secure and production-grade defaults.
