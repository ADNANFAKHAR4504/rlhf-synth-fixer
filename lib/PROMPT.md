I want to define a **secure AWS infrastructure** using the **AWS CDK with Python**, where CloudFormation will manage the underlying templates.  
The folder layout will be simple: the root contains an entry file `tap.py`, and under `lib/` I’ll have the main stack implementation in `tap_stack.py`.  

The goal is to build a **security-focused architecture** for a web application. Here’s what I need included:  

- A **VPC** with CIDR block `10.0.0.0/16`, containing both public and private subnets across two Availability Zones.  
- **EC2 instances** deployed into the private subnets, accessible only through a **bastion host**.  
- An **Application Load Balancer (ALB)** protected by an **AWS Web Application Firewall (WAF)**.  
- Proper **IAM roles** attached to EC2 instances that allow defined S3 access, using AWS managed policies wherever possible.  
- An **RDS database** launched in a multi-subnet group, encrypted with KMS, and locked down so it only accepts traffic from the application components (not from the internet).  
- **Lambda functions** running inside the private subnets to process application data.  
- **AWS Backup** configured to automate snapshots for both EC2 and RDS resources.  
- **VPC Flow Logs** enabled with logs published to CloudWatch Logs.  

Every resource should follow AWS security best practices, and all must be tagged with `Project: SecureDeployment`. The setup should ensure the application is **secure, highly available, and testable**.  

Finally, I expect the output to be a **Python CDK implementation** (`tap.py` and `lib/tap_stack.py`) that provisions this entire stack. The deployment should pass validation in AWS, meet all security constraints, and allow for smooth connectivity between application components.  