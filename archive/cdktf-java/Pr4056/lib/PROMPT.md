Build a Java-based CDK for Terraform project that migrates multiple EC2 instances from an existing VPC to a newly designed VPC in the us-east-1 region without downtime. 

Requirements:
The new VPC must include two public and two private subnets distributed across different availability zones, a NAT Gateway to provide internet access to private instances, and secure networking configurations that allow SSH access only from a specific IP address. 
EC2 instances should use a security group that denies all inbound traffic by default and leverage IAM roles granting least-privilege access. 
Distribute application traffic across availability zones using an Elastic Load Balancer and enable monitoring with CloudWatch alarms that trigger when CPU utilization exceeds 80 percent. 
All data must be encrypted using AWS Key Management Service, and the deployment should ensure that updates can be performed without manual interruption. 
Define outputs for the VPC ID and public subnet IDs for use in downstream modules or future integrations.

Design:
The solution should follow a modular structure by organizing all reusable infrastructure definitions within a construct package.
Avoid hardcoded values and use modern Java records to manage configuration settings cleanly and type-safely.