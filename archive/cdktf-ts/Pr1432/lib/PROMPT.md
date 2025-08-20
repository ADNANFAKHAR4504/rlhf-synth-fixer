Need CDKTF (TypeScript) code to build secure, consistent AWS infra across a region: us-east-1. Infra must be monolithic, resilient, and follow Terraform best practices with strong focus on IAM, SG rules, and remote state management.

Main goals:

- One VPC per region (10.0.0.0/16)

- At least 2 subnets per VPC (/24 each, unique values per subnet)

- One S3 bucket per region (versioning enabled)

- One EC2 instance per region (t2.micro, Amazon Linux 2 AMI)

- IAM roles so EC2 to S3 read/write access in same region

- Security groups only allow inbound HTTP + SSH from 203.0.113.0/24

Modularity & State but code should be in same stack file:

- Use modules for each region (VPC, subnets, S3, EC2, IAM)

- Remote backend for state.

- Ensure regional deployments remain consistent and can operate independently

Tagging:

- Apply consistent tags to all resources:

- Environment: Production

- Application: WebApp

- Owner: DevOps Team

Constraints:

- Must deploy the same set of resources across a region with identical configurations.

- Strong emphasis on security and least-privilege IAM roles

- Code must synthesize and apply cleanly (cdktf synth, terraform plan/apply) with no errors

- Configs should be structured for reusability and long-term maintainability"
