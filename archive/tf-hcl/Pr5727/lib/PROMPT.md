Hey team,

We need to build out a secure AWS infrastructure using Terraform for our production environment. This is a pretty important one - we're looking at a setup that needs to be highly available and follow all the security best practices we've been discussing.

## What We're Building

So basically, we need a production-ready cloud environment with proper network segmentation, secure access controls, monitoring, and all that good stuff. The key things we need to nail down are:

- Principle of least privilege for all IAM stuff
- Everything encrypted at rest (no exceptions)
- Network flow logging so we can see what's happening
- Properly hardened security groups

Quick heads up - everything goes in us-west-1, and we're NOT enabling deletion protection on anything. Management wants to be able to tear this down easily for testing purposes.

## The Network Setup

Alright, so for the networking piece, here's what we need:

Start with a VPC using 10.0.0.0/16 as the CIDR block. Make sure DNS hostnames and DNS support are enabled - we'll need those later.

For subnets, create two public ones in different availability zones. Use 10.0.1.0/24 and 10.0.2.0/24 for those. These should auto-assign public IPs. Then create two private subnets as well - 10.0.10.0/24 and 10.0.11.0/24. Those should NOT get public IPs.

Network gateways are pretty straightforward - attach an Internet Gateway to the VPC for public internet access. Set up a NAT Gateway in one of the public subnets so our private resources can reach out when needed. Don't forget to allocate an Elastic IP for the NAT Gateway.

Routing tables need to be set up properly. Public subnets should route everything to the Internet Gateway, private subnets route through the NAT Gateway. Make sure all the subnet associations are in place.

## Security Controls

This is the important part - security needs to be tight.

We need three security groups set up:

First one is for the bastion host. Only allow SSH from a specific IP (we'll make that configurable). Let all outbound traffic through though.

Second is for web servers. Allow HTTPS from anywhere, but SSH should only come from the bastion. All outbound is fine.

Third is for RDS. Only allow MySQL traffic from the bastion and web security groups. No direct internet access at all.

For IAM, create a role for EC2 instances that can push metrics to CloudWatch, write logs, and grab secrets from Secrets Manager (we'll need that for the database password). Set up an instance profile too.

Also need an IAM role for VPC Flow Logs so it can write to CloudWatch Logs.

## The Compute Stuff

For the EC2 bastion instance, spin up a t3.micro running the latest Amazon Linux 2. Put it in one of the public subnets with the bastion security group attached. Make sure to use the EC2 IAM profile we set up.

The root volume should be gp3, 20 GB, encrypted. Have it delete on termination. Include some user data to update packages, install the CloudWatch agent, MySQL client, and AWS CLI. Get the CloudWatch agent configured and running.

For the database, we need an RDS MySQL instance. Use MySQL 8.0 on a db.t3.micro. Start with 20 GB of gp3 storage but let it autoscale up to 100 GB if needed. Everything needs to be encrypted.

Database config is pretty standard - call it "productiondb", username "admin", generate the password using Terraform's random_password resource (make it 32 characters). Use port 3306.

For networking, create a subnet group with both private subnets and attach the RDS security group. This thing should NOT be publicly accessible.

Make it Multi-AZ for high availability. Set up automated backups with 7 day retention, backup window at 3-4 AM, maintenance on Sunday mornings. Create a final snapshot when we tear it down (with a timestamp in the name).

Enable Performance Insights with 7 day retention. Export error, general, and slow query logs to CloudWatch.

Remember - no deletion protection (per the requirements).

## Secrets and Credentials

Oh, and store those RDS credentials in Secrets Manager. Call it "production-rds-mysql-credentials" with a 7 day recovery window. Store the username, password, endpoint, port, and database name in there as JSON.

## Monitoring and Logging

We need solid monitoring and logging set up.

For VPC Flow Logs, create an S3 bucket with versioning and AES256 encryption turned on. Block all public access. Set up a lifecycle policy - move to STANDARD_IA after 30 days, GLACIER after 90 days, and delete after a year.

Also send Flow Logs to a CloudWatch Log Group called /aws/vpc/flowlogs with 30 day retention. Capture ALL traffic (accept, reject, all of it).

For CloudWatch alarms, create an SNS topic for notifications. Then set up these alarms:
- EC2 CPU over 80%
- EC2 status check failures
- RDS CPU over 75%
- RDS free storage under 2GB

## Tagging and Outputs

Tag everything consistently - at minimum use Name and Type tags. Follow AWS best practices for tagging.

For outputs, we need: vpc_id, bastion_public_ip, bastion_instance_id, rds_endpoint (mark that one sensitive), rds_secret_arn, nat_gateway_ip, sns_topic_arn, flow_logs_s3_bucket, and cloudwatch_log_group. Add descriptions to all of them.

## Important Notes

Just to reiterate the key constraints:
- Everything in us-west-1
- Use Terraform (HCL)
- Put it all in a single file (main.tf or tap_stack.tf works)
- No deletion protection anywhere
- Use AWS Provider version 5.0 or higher

## What We Need

Put together a complete Terraform config with everything above. Make sure it includes the provider setup, all the networking pieces, security groups, the EC2 bastion, RDS database, Secrets Manager integration, VPC Flow Logs, and CloudWatch monitoring.

Add inline comments explaining the security considerations and why things are configured the way they are. This needs to be production-ready, so make sure all the resource dependencies are correct and everything will actually deploy.

The code should pass terraform init, validate, fmt, and plan without any issues. And obviously, it all needs to deploy successfully in us-west-1.

Thanks for taking this on. Feel free to reach out if you have any questions about what we're trying to accomplish here.
