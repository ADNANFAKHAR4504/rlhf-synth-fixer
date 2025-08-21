# Secure AWS Cloud Infrastructure
You are an AWS professional. You are tasked with setting up a secure, monitored AWS cloud infrastructure for a web application using CloudFormation CDK. This includes IAM policy configuration, network setup, and monitoring. With 
The Requirements are as follows:
Deploy all resources in the `us-west-2` AWS region.
Implement IAM roles and policies using the principle of least privilege.
Block all public access and enable server-side encryption (SSE-S3).
Set up AWS CloudTrail to log all account activities and store logs in a dedicated, encrypted S3 bucket.
Monitor EC2 CPU utilization and alert if CPU exceeds 80% (Alarms should notify an SNS topic for the DevOps team.)
Create a VPC with private and public subnets.
Each public subnet must have a NAT gateway.
Launch all EC2 instances in private subnets (not public).
Security Groups should only allow inbound HTTP (port 80) and HTTPS (port 443) traffic from a specified CIDR range (e.g., office location).
Deploy RDS instances with multi-AZ (availability zone) support and encrypted storage.
Apply consistent tags to all resources for cost tracking and management.
All resources must be created in a single tap-stack.ts file with the main Stack class named TapStack.
Use a naming format like `projectname-environmentSuffix-resource` for all