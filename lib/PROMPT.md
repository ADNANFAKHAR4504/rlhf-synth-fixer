# Terraform Setup for AWS Migration

## Environment  
We’re moving our current multi-tier web application from the on-prem data center into AWS. Everything should be deployed in **us-west-2** and managed with Terraform HCL so it’s easy to reproduce and track. The application has multiple pieces — web servers, databases, networking, and content delivery — all of which we’ll recreate on AWS. The design should support scaling up when needed, stay secure, and line up with AWS best practices for high availability and fault tolerance. Importantly, the migration itself cannot cause downtime.  

## Constraints  
There are a few hard rules we need to stick to:  
- Everything stays inside **us-west-2**.  
- Migration has to be seamless (no downtime).  
- IAM permissions should be minimal, only what’s actually needed.  
- DNS should not change, so existing URLs remain intact.  
- **CloudFront** must be used for global delivery and caching.  
- Database runs on **Amazon RDS**, with backups enabled and replicas if needed.  
- We’ll build inside a **VPC** that has both private and public subnets.  
- **CloudWatch logging** is required with a set retention period for visibility.  

## Proposed Approach  
The idea is to create a secure and reliable AWS environment using Terraform, with all the variables kept in one place for simplicity. The network, compute, database, and monitoring pieces will all be defined in `tap_stack.tf`, while the provider config sits in `provider.tf`. CloudFront will handle performance at the edge, RDS ensures data reliability, and splitting the VPC into public and private subnets keeps things clean. IAM policies will stay tight, and CloudWatch will give us the logging we need. Overall, this should let us migrate with **zero downtime** while following AWS best practices.  

## Folder Structure  
project-root/
└── lib/
├── provider.tf
└── tap_stack.tf # acts as main.tf (resources + variables together)

