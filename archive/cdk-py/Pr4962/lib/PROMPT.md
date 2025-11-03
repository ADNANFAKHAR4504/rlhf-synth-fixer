You’re building a complete production-ready web application infrastructure on AWS using the AWS CDK in Python (main.py - single stack). The goal is to design something that’s both secure and scalable, but also cost-conscious and easy to maintain. Everything should be deployed through CloudFormation using CDK constructs.

Start with a solid network foundation — create a Virtual Private Cloud that spans multiple Availability Zones to ensure high availability. Within that VPC, define both public and private subnets, set up proper route tables to control traffic between them, and make sure the architecture can handle failure in one zone without downtime.

For compute, the environment should mix serverless and containerized workloads. Use AWS Lambda functions for lightweight, event-driven processes and assign them the correct IAM roles so they can only do what’s needed. For containerized components, create an ECS cluster using Fargate as the launch type so you don’t have to manage servers. On top of that, include an EC2 Auto Scaling group to handle traditional compute needs that might need scaling under load — make sure it launches instances in at least two availability zones.

Your database layer will rely on Amazon RDS. Configure it for Multi-AZ deployment to keep it resilient and enable automated backups with a retention period of seven days. Database credentials should never be stored in plain text — keep them in AWS Secrets Manager and have your application read them securely. Also, make sure connections to the database happen over SSL/TLS.

For static web assets, use an S3 bucket with versioning and encryption enabled, and sit a CloudFront distribution in front of it for fast, global content delivery. You should also enable encryption at rest for all S3 buckets and RDS databases to comply with security best practices.


Everything you deploy should be tagged consistently — for example, `Environment: Production` and `Owner: TeamX` — so that cost tracking and ownership are clear. Don’t forget to optimize for cost where possible, while keeping resilience and performance intact.

To make this easier to manage across accounts or environments, use CloudFormation stack sets so your infrastructure can be deployed in multiple AWS accounts from a single definition. The entire stack should follow AWS best practices for resilience, security, and high availability.

In short, you’re creating a Python-based AWS CDK application that defines a full production web stack — networking, compute, database, storage, security, monitoring, and deployment — all woven together cleanly and ready for a real-world production rollout.
