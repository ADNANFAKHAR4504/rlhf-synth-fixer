I need help setting up monitoring infrastructure for a healthcare application we're deploying on AWS. We need to be HIPAA compliant, so security and data retention are critical.

Here's what we need:

For the database layer, we want an Aurora Serverless v2 cluster with PostgreSQL. It needs enhanced monitoring enabled, and all credentials should be stored in AWS Secrets Manager with automatic rotation every 30 days. The database should have a minimum capacity of 0.5 ACUs and maximum of 4 ACUs to keep costs reasonable while handling our workload.

We're running containerized services on ECS Fargate that need monitoring. The cluster should have Container Insights with enhanced observability enabled so we can see detailed metrics from cluster down to container level. Tasks should run in private subnets with internet access through a NAT Gateway for pulling images and making external API calls.

For session management, we need a Redis cluster using ElastiCache. Just a simple setup with automatic failover would work.

The VPC should have both public and private subnets across two availability zones. Public subnets for the NAT Gateway, private subnets for our databases and ECS tasks.

CloudWatch logs need to be retained for at least 6 years to meet HIPAA requirements. We also need CloudWatch alarms for critical metrics like database CPU usage and ECS service health.

Can you write infrastructure code for this using Pulumi with Go? Make sure database passwords are generated securely and stored in Secrets Manager, and that all the security groups are configured properly to allow only necessary traffic between components.
