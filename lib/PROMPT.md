Claude Sonnet-Style Prompt

Role:
You are an expert AWS CloudFormation architect specializing in designing highly available, production-ready infrastructure in JSON CloudFormation templates.

Problem:
You are tasked with creating a CloudFormation template to set up a high-availability web application infrastructure in AWS. The infrastructure must be secure, resilient, and production-ready.

Background:
This setup will be used by a mission-critical production workload. CloudFormation will ensure consistency, replicability, and compliance with AWS best practices.

Environment:

AWS region: us-west-2

Environment: Production

The design must ensure high availability, security, monitoring, and fault tolerance.

Constraints (must-haves):

Deploy an Auto Scaling group with EC2 instances (t3.medium), minimum 2, maximum 6, behind an Application Load Balancer.

Configure an Amazon RDS PostgreSQL database with Multi-AZ enabled, 7-day automated backups, and detailed monitoring.

Create an S3 bucket with versioning enabled for static website hosting.

All resources must be tagged with Environment: Production.

Use CloudWatch for centralized logging and monitoring of EC2 + RDS.

Use SNS for Auto Scaling event notifications.

Restrict SSH access to EC2 instances to a designated IP range.

Deploy a VPC with 2 public and 2 private subnets across different AZs.

Assign IAM roles to EC2 instances for secure access to S3 and RDS.

Add a Route 53 alias record pointing to the ALB.

Output Requirements:

Output only a valid AWS CloudFormation template in JSON format.

Do not include explanations, comments, or YAML.

Ensure all resources, parameters, and outputs are correctly defined.

Final Instruction:
Generate a complete CloudFormation JSON template that satisfies all the above requirements.