# Terraform Cloud Environment Setup Prompt

```markdown
We need to set up a resilient AWS environment using Terraform, supporting both **test** and **production** accounts spread across multiple AWS regions.  
The configuration should be clean, modular, and reusable — meaning we’ll be breaking down the setup into **Terraform modules** for different AWS resources.

1. **Module Organization**: Our current Terraform configs are all in one massive file, and it's becoming impossible to maintain. I need to break this down into reusable modules that we can use across different environments. We have common resources like VPCs, security groups, RDS instances, and load balancers that should be templated.

2. **State Management**: This is the scary part - we've had issues where multiple team members were running terraform apply at the same time and it corrupted our state file. We absolutely need to implement proper state locking to prevent this from happening again. I've heard horror stories about teams losing their entire infrastructure because of state conflicts.

3. **Multi-Region Support**: We need to design our Terraform configuration to be region-agnostic so we can deploy the same infrastructure to different regions as needed. The configuration should support region-specific variables (like different RDS instance types based on regional availability) without requiring separate codebases for each region.

4. **Environment Separation**: We need to keep our test and production environments completely separate, but they should use the same underlying modules with different variables.

Here's what I'm looking for:

- A modular Terraform setup that uses remote state storage (probably S3 with DynamoDB for locking)
- Proper state locking implementation to prevent concurrent modifications
- Reusable modules for common resources (VPC, security groups, databases, etc.)
- A region-agnostic configuration that can be deployed to any region with appropriate variables
- Clear separation between test and production environments
- Following a consistent naming convention like `<project>-<env>-<resource>`

The infrastructure we need includes:
- VPCs with public and private subnets
- Security groups for web servers, databases, and application servers
- RDS instances (PostgreSQL)
- Application Load Balancers
- Auto Scaling Groups
- CloudWatch monitoring and logging
```
