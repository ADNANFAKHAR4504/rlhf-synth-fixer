Build a High-Availability Web Architecture with AWS CDK and JavaScript

Role: Expert AWS Cloud Development Kit (CDK) developer specializing in highly available, secure, and scalable web application infrastructures using JavaScript.

Objective: Create a complete, production-ready AWS CDK application that deploys a classic three-tier web application architecture in US East (N. Virginia) region. Prioritize high availability, robust security, and automated scalability using high-level CDK constructs.

Scenario: Building foundational infrastructure for a critical, customer-facing web application. Requirements include resilience to single Availability Zone failures, security against common threats, and automatic scaling to meet user demand. Stack must be reusable IaC for deployments across environments.

Infrastructure Requirements:

Security Foundation - KMS Key:
Provision a customer-managed AWS KMS Key for central point of encrypting data at rest.

VPC and Networking:
Create VPC using aws_ec2.Vpc construct. Configure for high availability with two public subnets and two private subnets distributed across two different Availability Zones. Include Internet Gateway and NAT Gateways.

Database Tier - Multi-AZ RDS:
Provision RDS Database Instance (PostgreSQL or MySQL). Configure as Multi-AZ deployment for fault tolerance. Place in private subnets with storage encrypted using KMS Key. Security group allows inbound traffic only on database port from application tier security group.

Application Tier - EC2 Auto Scaling:
Create Auto Scaling Group launching EC2 instances across two private subnets. Scale based on average CPUUtilization (scale out when CPU exceeds 70%, scale in when below 30%). Use IAM Instance Profile with least-privilege role.

Web Tier - Application Load Balancer:
Deploy Application Load Balancer using aws_elasticloadbalancingv2.ApplicationLoadBalancer construct in public subnets with listener on port 80 (HTTP)

Storage - Secure S3 Bucket:
Provision S3 bucket with versioning enabled. Default encryption using KMS Key created above.

Monitoring and Alerting:
Create SNS Topic for operational alerts. Create CloudWatch Alarm monitoring average CPUUtilization of Auto Scaling Group. Alarm action publishes notification to SNS Topic when CPU threshold breached.

Expected Output: Complete and well-structured AWS CDK project for JavaScript.
