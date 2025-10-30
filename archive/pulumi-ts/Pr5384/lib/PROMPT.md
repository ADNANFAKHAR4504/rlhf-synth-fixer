# Infrastructure Setup for New Production Environment

Got a request from our startup client - they need their first real production setup on AWS. They've been testing things out in dev mode but now need something proper that can actually handle customer traffic. Management wants us to use Pulumi with TypeScript since they like having everything in code.

The client is pretty nervous about this being their first production launch. They want to make sure everything is secure and follows AWS best practices. Budget is tight but they also don't want to cut corners on redundancy or security. It's the usual balancing act.

## What they're asking for

Build out a complete AWS environment using Pulumi and TypeScript. They need the basics - networking, compute that can scale, a database, and somewhere to store files. Everything should be isolated properly and follow security best practices.

### Network Setup

Set up a VPC with 10.0.0.0/16 as the IP range. They want things spread across two availability zones for redundancy. Split it up with public subnets (10.0.1.0/24 and 10.0.2.0/24) for anything that needs to talk to the internet, and private subnets (10.0.11.0/24 and 10.0.12.0/24) for the application servers and database.

Need an Internet Gateway so things in public subnets can reach the internet. Put NAT Gateways in each AZ so the private subnet resources can make outbound connections when they need to. Make sure to set up route tables explicitly for everything - don't rely on default routes.

### Load Balancer

Put an Application Load Balancer in the public subnets. Set it up to listen on port 80 and distribute traffic to the application servers. Configure health checks so it knows when instances are having problems. Create a target group that the auto scaling group can register instances with.

### Application Servers

Set up an Auto Scaling Group with t3.micro instances running in the private subnets. Keep at least 2 running at all times, but let it scale up to 4 if traffic picks up. Use a launch template (not the old launch configuration style). The instances should use Amazon Linux 2023 AMI. Make sure they're spread across both availability zones.

### Database

Deploy RDS PostgreSQL 14.x using db.t3.micro instance size. Put it in the private subnets with a subnet group that spans both AZs. Turn on encryption at rest using AWS managed keys. Configure automated backups. They want the database locked down so only the application servers can talk to it.

### File Storage

Create an S3 bucket for storing application files and assets. Turn on versioning so they can recover if something gets accidentally deleted. Set up a lifecycle policy to move older files to cheaper storage tiers. Block all public access - this bucket should only be accessible from within AWS. Enable server-side encryption.

### Logging

Set up CloudWatch Log Groups for application logs and infrastructure logs. Keep logs around for 7 days - that should be enough for troubleshooting without running up costs.

### Security

This is important - they're worried about security since it's customer data. Set up security groups that only allow the minimum necessary traffic:
- ALB should only accept HTTP from the internet
- Application servers should only accept traffic from the ALB
- Database should only accept PostgreSQL connections from the application servers
- Everything should have explicit egress rules

Create IAM roles for the EC2 instances so they can write to CloudWatch Logs and access the S3 bucket. Use managed policies where it makes sense.

## Technical Details

Everything needs to be in Pulumi using TypeScript. Use the @pulumi/aws provider version 6.x or newer. Deploy everything to ap-northeast-1 region.

For naming, all resources need to include an environmentSuffix parameter so they can deploy multiple copies without conflicts. Follow the pattern: resourceType-${environmentSuffix}

Tag everything with Environment: production and ManagedBy: pulumi

Important: Don't set up any deletion protection or retain policies. They want to be able to tear down test environments cleanly. Same goes for the RDS final snapshot - skip it so we can destroy cleanly.

Export the important values as Pulumi stack outputs: VPC ID, ALB DNS name, and S3 bucket name. They'll need these for other tools and scripts.

## Implementation Notes

Use launch templates for the Auto Scaling Group, not launch configurations (those are legacy now).

For the EC2 instances, use Amazon Linux 2023 AMI - it's the latest.

Make sure route tables are explicitly created and associated. Don't rely on default route table associations.

Add comments in the code explaining what each resource does and why it's configured that way. They'll have other engineers looking at this later who might not be AWS experts.

## What Success Looks Like

When this is done, they should be able to deploy it and have:
- A working multi-AZ network with proper public/private separation
- Load balancer distributing traffic to auto-scaled application servers
- Database that's encrypted and backed up automatically
- Secure file storage with versioning
- Logs being captured for troubleshooting
- Everything properly locked down with security groups
- The ability to tear it all down and redeploy cleanly

The code should be clean TypeScript that follows Pulumi conventions. Include unit tests and integration tests so we can verify everything works.

## Deliverables

Put the implementation in lib/tap-stack.ts. Include:
- VPC with subnets across two AZs
- Internet Gateway and NAT Gateways with routing
- Application Load Balancer with HTTP listener
- Auto Scaling Group (min 2, max 4, t3.micro instances)
- RDS PostgreSQL 14.x with encryption and backups
- S3 bucket with versioning and lifecycle rules
- CloudWatch Log Groups with 7-day retention
- Security groups configured for least privilege
- IAM roles for EC2 instances
- Stack outputs for VPC ID, ALB DNS, and S3 bucket name
- Unit tests covering all components
- Integration tests that verify the deployed resources
- Documentation explaining how to deploy and what gets created
