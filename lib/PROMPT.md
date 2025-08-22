What I Want to Build
I need to set up a web app on AWS using Terraform. The goal is to have something that’s secure, scalable, and ready for production—not just a demo.

What I Need
Use AWS for everything.
I want a VPC that’s split across at least two availability zones, with both public and private subnets (at least two of each).
Private subnets should have internet access, so set up NAT gateways.
The app should run on EC2s in an auto scaling group (minimum two instances), and traffic should go through a load balancer.
I want a Postgres database (RDS), and it should have backups turned on.
EC2s should use IAM roles for permissions, and only allow HTTPS traffic from the outside.
Store all app config in SSM Parameter Store (don’t put secrets in the code).
Set up CloudWatch for logs and monitoring.
Tag everything with the environment and project name.
Use modules if it makes things cleaner, but keep it in one file for now.
Make sure it’s easy to scale and manage access with IAM.
Deliverable
All the Terraform should be in a single file called tap_stack.tf. Please make sure every resource name starts with 274789 so it’s unique.