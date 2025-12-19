# Web App Infrastructure - Terraform Setup

Working on the IaC AWS Nova project (Batch 004). Need to set up a production web app using Terraform instead of CloudFormation.

## What's needed

Building a Flask web app infrastructure that can handle real traffic. Has to scale, stay up, and not break the bank.

## Main specs

**Region:** us-east-1

### Load balancer setup
- ALB on ports 80 and 443
- ACM cert for HTTPS 
- Health checks configured
- Need the LB URL in outputs

### Auto scaling 
- Min 2, max 5 instances
- Amazon Linux 2 AMI (latest)
- Flask hello world in user data
- Multi-AZ spread

### Database
- Aurora MySQL 
- Multi-AZ for failover
- 7 day backups minimum
- Only app servers can connect

### Security stuff
- EC2 gets IAM role with S3 read for 'webapp-assets' bucket
- SG allows 0.0.0.0/0 on 80/443
- Follow least privilege everywhere

### Cost and ops
- Stay in free tier where we can
- Tag everything: Project=WebAppDeployment
- Name pattern: proj-webapp-[whatever]

## Files needed

Need working Terraform configs:
- main.tf with resources
- variables.tf 
- outputs.tf (especially LB URL)
- Maybe split by component if it makes sense

## Implementation details

VPC setup, launch template with Flask user data, ASG policies, Aurora config, ACM cert setup, ALB with target groups.

User data should install Python/Flask, start a basic hello world app, make sure it runs on boot, and work with health checks.

## End goal

Run terraform apply and get:
- Working HTTP/HTTPS access
- Flask returning hello world
- Auto scaling on CPU
- Secure DB access
- Everything tagged right
- SSL working

This is the start of moving from manual deploys to IaC. Flask is just v1 - more complex apps coming later.

Would be great to see AWS best practices baked in, explanations for security choices, how to test it works, and common gotchas to watch for.

Need this to actually work in production, not just a demo.