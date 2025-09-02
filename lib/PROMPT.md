You are an expert AWS solutions architect. I need you to generate a production-grade AWS CloudFormation template in JSON. The template should set up a scalable, secure, and SOC2-compliant AWS environment in the us-east-1 region with the following requirements:

Networking

Create a VPC with public and private subnets.

Configure routing, Internet Gateway, and a NAT Gateway for outbound traffic from the private subnet.

Apply Security Groups and NACLs to enforce least-privilege and secure communication between services.

Database

Deploy an Amazon RDS instance in the private subnet.

Ensure RDS storage is encrypted with KMS.

Compute & Scaling

Set up an ECS cluster for containerized applications.

Place an Application Load Balancer (ALB) in front of the ECS cluster.

Configure an Auto Scaling Group to manage ECS container instances.

Security & Access Control

Use IAM roles and policies with deny-all by default, granting only explicit permissions as needed.

Implement Resource Access Manager (RAM) to share resources across AWS accounts.

Monitoring & Logging

Enable and configure AWS CloudTrail for auditing.

Enable Amazon CloudWatch metrics for infrastructure health and performance.

Create S3 buckets for application logs, with lifecycle policies to manage storage.

Compliance & Management

Ensure all resources are tagged according to company standards for cost tracking and identification.

Confirm the entire environment is SOC2-compliant, with encryption enforced for data at rest and in transit.

Constraints:

The entire setup must be defined using CloudFormation JSON.

The template must pass security and performance tests.

Use company naming conventions for all resources.

Expected Output:
Provide the complete json CloudFormation template with all the above configurations.
