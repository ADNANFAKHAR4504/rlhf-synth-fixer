You are an expert AWS CDK engineer. I have a CDK project written in TypeScript with the following structure:

tap-infrastructure/
├── bin/
│   └── tap.ts       // entrypoint
├── lib/
│   └── tapstack.ts  // main stack
├── test/
│   └── ...          // tests


Please generate production-ready CDK code in TypeScript inside lib/tapstack.ts that provisions infrastructure with the following requirements:

VPC Setup

Create a VPC in us-east-1 with both public and private subnets across two Availability Zones.

Each public subnet must include a NAT Gateway.

Application Layer

Deploy an Auto Scaling Group (ASG) in the private subnets with a launch configuration for application instances.

Use an Application Load Balancer (ALB) in the public subnets to distribute traffic.

ALB should have HTTP (80) and HTTPS (443) listeners.

HTTPS listener must use an ACM certificate for TLS termination.

Database Layer

Create an RDS PostgreSQL instance deployed in private subnets.

Configure it as a Multi-AZ instance for high availability.

Storage Layer

Create an S3 bucket for storing application assets.

The bucket must be private by default.

IAM & Security

Define IAM roles and policies so that application instances, ALB, and RDS have correct permissions.

Apply Security Groups to restrict inbound traffic: only HTTP/HTTPS from the internet should be allowed.

Ensure outbound rules are restricted according to best practices.

Tagging

Tag all resources with:

Environment: Production

Project: CloudFormationSetup

Prefix all resource names with prod-.

Tests

Under test/, provide CDK assertion tests to verify critical resources exist (VPC, ASG, ALB, RDS, S3 bucket).

Constraints:

Use AWS CDK in TypeScript.

Resources must synthesize to CloudFormation templates.

Code must be written cleanly, modularly, and in production-grade style.

Make sure the final implementation is fully aligned with best practices.