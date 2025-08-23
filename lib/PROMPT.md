# Prompt

We need to set up a secure AWS environment for a web application using the **Go CDK for Terraform**.  
Everything should run in the **us-east-1** region and follow best practices around security, monitoring, and auditing.

Here’s what we’re aiming for:

- All data should be encrypted at rest using **KMS**.  
- Access control should rely on **IAM roles**, never root credentials.  
- The app should live inside a **VPC** with private subnets, not exposed directly to the internet.  
- Our EC2 instances should all be **t3.micro** type and come with **detailed monitoring** enabled.  
- These instances need a role that lets them read from **one specific S3 bucket** (read-only).  
- We need to enforce **SSL/TLS** everywhere so traffic is secure.  
- Monitoring should be in place: set up a **CloudWatch alarm** to watch CPU usage and send an **SNS notification** if it goes over 70%.  
- For auditing, turn on **CloudTrail** so every API call is logged.

The idea is to capture all of this in a single Go CDK Terraform stack file (`tap_stack.go`).  
By the end, we want a deployment that’s isolated, secure, fully monitored, and compliant — something we can feel confident running in production.
