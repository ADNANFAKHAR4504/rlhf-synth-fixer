# Project Requirements: AWS Nova Model Infrastructure

We need to build a multi-tier VPC architecture on AWS for our "IaC - AWS Nova Model Breaking" project. The infrastructure should be secure, scalable, and follow our naming conventions to avoid conflicts with other environments.

## Background

Our team is working on a new application that requires a proper cloud infrastructure setup. We've decided to use AWS CDK with TypeScript since our developers are already familiar with it. The infrastructure needs to support both development and eventual production workloads.

## What We Need

### Network Infrastructure
We want a VPC with a 10.0.0.0/16 CIDR block. The setup should include:
- One public subnet for resources that need internet access
- Two private subnets for our application components
- Subnets distributed across at least two availability zones for redundancy
- A NAT Gateway so private resources can reach the internet when needed

### Security Setup
For security, we need a security group that only allows:
- HTTP traffic on port 80
- SSH access on port 22  
- Everything else should be blocked by default

### Application Components
The main application will run on a Lambda function that:
- Lives in one of the private subnets for security
- Gets triggered when files are uploaded to our S3 bucket
- Only has the permissions it needs (read S3, write to CloudWatch logs)

### Database
We'll need a MySQL RDS instance that:
- Is deployed across multiple availability zones for high availability
- Sits in a private subnet for security
- Has configurable instance type and storage size

### Operational Requirements
All our resources should:
- Follow our naming convention with app name, purpose, environment, and a unique suffix
- Be tagged with Environment: Development
- Have configurable parameters so we can adjust things like instance sizes later

We also need to output the important IDs (VPC, subnets, security groups) so other teams can reference them.

## Technical Details

We're using AWS CDK with TypeScript since our team is most comfortable with that stack. The infrastructure should be flexible enough to handle different environments by using parameters for things like instance types and database sizes.

## Deliverables

When this is complete, we should have:
- A working CDK TypeScript application that deploys all the infrastructure
- Proper security configurations with minimal required permissions
- All resources properly tagged for cost tracking and environment identification
- Output values that other teams can use to integrate with our infrastructure
- Clean, maintainable code that follows TypeScript best practices

The infrastructure should deploy successfully using standard CDK commands and be ready for our development team to start using immediately.