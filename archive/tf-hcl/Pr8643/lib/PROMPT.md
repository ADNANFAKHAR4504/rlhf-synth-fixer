Hey team,

We're in a complete mess with our infrastructure. We've been manually spinning up resources for dev, staging, and prod, and they're all different now. Last week staging had a different subnet config than prod, and dev was missing a security group. This is getting out of hand.

I need to automate this with Terraform so we deploy identical infrastructure to all three environments. The only differences should be instance sizes - dev can use tiny t3.micro instances, staging needs t3.small, and prod should run on t3.medium or bigger.

Here's what we need to build:

Start with a VPC that has both public and private subnets spread across two availability zones. The public subnets will host our load balancer, and the private subnets will hold our EC2 instances and RDS database. We'll need an internet gateway attached to the VPC so the load balancer can accept traffic from the internet.

For the compute layer, set up an Auto Scaling group with EC2 instances running in the private subnets. These instances will run our application code. Put an Application Load Balancer in the public subnets that forwards incoming HTTP traffic to the EC2 instances. The ALB needs to do health checks on the instances so it only sends traffic to healthy ones.

The EC2 instances need to talk to a MySQL RDS database. The database should sit in the private subnets alongside the app servers. Configure the security groups so that only the EC2 instances can connect to the database on port 3306 - no one else should have access.

We also need an S3 bucket for storing application data like uploaded files. The EC2 instances need read and write access to this bucket. Set up an IAM role for the EC2 instances that grants them permissions to read from and write to the S3 bucket, plus permissions to send logs to CloudWatch.

For networking, the private subnets need NAT gateways so the EC2 instances can make outbound connections to download packages and hit external APIs. Each private subnet should route through its own NAT gateway for redundancy.

Security group setup:
- ALB security group allows inbound traffic on ports 80 and 443 from anywhere on the internet
- EC2 security group only allows inbound traffic on port 80 from the ALB security group
- RDS security group only allows inbound traffic on port 3306 from the EC2 security group
- All outbound traffic allowed for now since we're just getting this working

Make sure every resource gets tagged with Environment, Project, and ManagedBy tags. Also add an environment suffix to all resource names so we can run multiple environments without name collisions. Something like "alb-dev-pr8643" or "rds-prod-pr8643".

For the three environments:
- Dev should use t3.micro EC2 instances and a db.t3.micro RDS with 1-2 instances in the auto scaling group, single AZ to save money
- Staging needs t3.small EC2 and db.t3.small RDS with 2-4 instances, should be multi-AZ so we can test failover
- Prod requires t3.medium or larger EC2 and db.t3.medium RDS with 3-10 instances, definitely multi-AZ for reliability

Put everything in us-east-1. Use gp2 storage for RDS since we're testing with LocalStack and gp3 might not work. Make absolutely sure there's no deletion protection on anything - we need to be able to destroy these environments cleanly for testing.

The Terraform setup should have:
- variables.tf with all the configurable parameters
- provider.tf with the AWS provider configured
- tap_stack.tf with all the actual resource definitions
- dev.tfvars, staging.tfvars, and prod.tfvars with environment-specific values

When I run terraform apply with dev.tfvars, I should get a complete working dev environment with the load balancer routing traffic to the app servers, the app servers connecting to the database, and everything properly tagged and named. Same thing with the other tfvars files.

Can you build this out? Let me know if anything's unclear
