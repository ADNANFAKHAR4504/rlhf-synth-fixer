# Hey, need the COMPLETE Terraform code in one file

So I got a partial response, but it's incomplete and cuts off in the middle. The response stops at line 1023 where it's defining an ALB listener and just says `ssl_` and then nothing.

## What's missing from the current response:

1. **Compute module is cut off** - The ALB listener configuration is incomplete, missing the SSL certificate configuration and the rest of the compute resources
2. **No Auto Scaling Group** - Should have ASG, Launch Template, EC2 instances
3. **No CloudWatch monitoring** - Missing alarms, metrics, logging
4. **No IAM roles** - Missing EC2 instance roles, Auto Scaling roles
5. **User data scripts** - No EC2 bootstrap scripts
6. **Complete outputs** - Outputs are incomplete

## What I need:

**Give me ONE COMPLETE main.tf file** that has everything in it. Don't split it into modules this time - I want it all in a single file so I can just run `terraform apply` and get the full infrastructure.

The file should include:

### Core Infrastructure:

- VPC with public/private subnets across 2 AZs
- Internet Gateway and NAT Gateways
- Route tables and associations
- Security groups (ALB, EC2, RDS)

### Load Balancer & Auto Scaling:

- Application Load Balancer with HTTPS listener
- Target Group with health checks
- Auto Scaling Group with Launch Template
- EC2 instances with proper user data

### Storage & CDN:

- S3 bucket for static assets (encrypted)
- CloudFront distribution
- Proper S3 bucket policies

### Database:

- RDS MySQL with Multi-AZ
- DB subnet group
- Secrets Manager for password

### Monitoring:

- CloudWatch alarms for CPU, memory
- Auto Scaling policies
- CloudWatch logs

### Security:

- IAM roles and policies
- KMS keys if needed
- Least privilege access

## Requirements:

1. **Production ready** - No shortcuts, proper error handling
2. **All defaults set** - Every variable should have a sensible default
3. **Complete file** - Don't cut it off this time!
4. **Well commented** - Explain what each section does
5. **Works out of the box** - Should deploy successfully with just `terraform apply`

I'm tired of incomplete responses. Give me the FULL working code in one shot. The previous response was great up to where it stopped, so just continue from there and give me everything in a single main.tf file.

Make sure to include:

- Complete ALB configuration with SSL
- Full Auto Scaling setup
- All CloudWatch monitoring
- Complete IAM roles
- Working user data for EC2
- All outputs I'll need

Thanks!
