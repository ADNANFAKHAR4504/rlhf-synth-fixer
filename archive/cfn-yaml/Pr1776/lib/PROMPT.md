I need to create an AWS CloudFormation template for a production web app that needs to run in us-east-1 and us-west-2.

Here's what I need:

1. Networking - VPC with 10.0.0.0/16, public and private subnets across multiple AZs
2. Load balancing - ALB with HTTPS and SSL cert management 
3. Compute - Auto scaling group with t3.micro instances, min 2 max 6
4. Database - RDS MySQL with Multi-AZ for HA
5. Monitoring - CloudWatch alarms for key metrics
6. Storage - S3 buckets with AES-256 encryption
7. Security - IAM roles with least privilege
8. Compliance - tag everything with environment:production

I want to use CloudFormation's new optimistic stabilization feature to speed up deployments. The template should handle errors properly, follow AWS Well-Architected principles, and work in both regions.

Give me the complete CloudFormation YAML template. Keep it to one file if possible but make sure it's production ready.