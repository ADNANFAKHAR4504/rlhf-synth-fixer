Hi, We need some help setting up a secure and production-ready infrastructure on AWS using Terraform. Security is our top priority, so we want to make sure we're following all the best practices.

We're looking to build out a full environment that can be used for both staging and production, and it needs to be deployable in both `us-east-1` and `eu-west-1`.

Here's a rundown of what we need:

We need a solid network foundation with a VPC that has both public and private subnets spread across a couple of availability zones. Our application servers will be EC2 instances, and we need to make sure their EBS volumes are encrypted. For our database, we're thinking of using RDS (either MySQL or PostgreSQL), and that needs to be encrypted as well.

We'll also be using S3 for data storage, so those buckets need to be locked down and private. We're also planning on running some Lambda functions, and they'll need to be able to run inside our VPC and connect to the database.

On the security front, we need to make sure we're using IAM roles and policies that follow the principle of least privilege. All our encryption should be managed with customer-managed KMS keys, and we need to have key rotation enabled. For network security, we'll need separate security groups for each part of the infrastructure (ALB, EC2, RDS), and they should be chained together correctly. For example, the ALB should be able to talk to the EC2 instances, and the EC2 instances should be able to talk to the RDS database. We also need to restrict SSH access to our EC2 instances to a specific set of IP addresses.

For monitoring, we'd like to have CloudWatch set up to collect logs and send alerts. We'll need an alarm for high CPU usage on our EC2 instances that sends a notification to an SNS topic. And, of course, we need to make sure all our resources are tagged properly so we can keep track of everything.

We're looking for a complete Terraform configuration, so we'll need the `modules/data.tf`,`modules/security.tf`,`modules/monitoring.tf`, `vars.tf`, `outputs.tf`,`tap_stack.tf` and any other files you think are necessary to keep the code organized.

Many thanks for your help!
