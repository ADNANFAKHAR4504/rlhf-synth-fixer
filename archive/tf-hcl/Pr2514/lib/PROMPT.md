# Project #166: Building a Production AWS Web App Infrastructure with Terraform

Hey, I'm stuck on this infrastructure project and could really use some help. We're migrating from CloudFormation to Terraform HCL, and I want to get this right.

## What's the deal?

So basically, I need to set up a full production environment on AWS for our web app. Not just a simple EC2 instance - we're talking the whole nine yards. High availability, proper security, CDN, monitoring, the works. This needs to handle real traffic from day one.

We're deploying in us-west-2 and need to follow AWS best practices. Can't afford any rookie mistakes here.

## Infrastructure Requirements

### Networking Setup
- Need a VPC with at least 2 AZs for redundancy
- Public subnets for the load balancers and NAT gateways  
- Private subnets to keep our app servers and database secure
- NAT Gateway with Elastic IP so private instances can reach the internet
- Security groups that aren't wide open - only what's needed
- Database should ONLY be accessible from app servers, period

### Load Balancer & Traffic
- ALB to handle HTTP/HTTPS traffic
- SSL termination at the load balancer
- Health checks that actually work
- Auto scaling integration

### Storage & CDN
- S3 bucket for static assets (encrypted, obviously)
- CloudFront CDN for global distribution
- Proper S3 bucket policies - no public buckets!
- S3 and CloudFront need to work together seamlessly

### Compute Layer
- EC2 instances for the web app
- Auto Scaling Group for redundancy and scaling
- Launch templates with proper configs
- Multi-AZ deployment (can't have single points of failure)

### Database
- RDS with Multi-AZ failover
- Encrypted storage
- Proper subnet groups
- Backup and maintenance windows configured

### Monitoring
- CloudWatch for CPU, memory, network metrics
- Alarms that actually alert when things go wrong
- Logs enabled everywhere we can
- Auto scaling triggered by real metrics

### Security & IAM
- IAM roles with least privilege (no admin policies!)
- Service-linked roles where needed
- Resource policies locked down

### Operations
- Tags for cost tracking (Environment, Project)
- Consistent naming conventions
- Parameterized configs for different environments

## What I need from you

I need working Terraform files that I can run with `terraform apply` and get a complete infrastructure. Specifically:

### Files needed:
1. Main config with all resources
2. Variables file for customization
3. Outputs for important stuff
4. Maybe split into modules if it makes sense (networking, compute, storage, etc.)

### Technical details:
- VPC CIDR that leaves room for growth
- Subnet sizing that makes sense
- Right instance types for web hosting
- RDS sized for production
- CloudFront optimized for web apps

### Operational stuff:
- Auto scaling that actually responds to load
- CloudWatch alarms with sensible thresholds  
- Security groups that work but aren't overly restrictive
- Backup strategy built in

## What the code should be like

The Terraform code needs to be:
- Production-ready (no hacks or shortcuts)
- Well commented so my team understands it
- Modular and maintainable
- Following Terraform best practices
- Secure by default

## Why this matters

We're moving from clicking around in the console to proper IaC. This will handle production traffic, so it needs to be rock solid. No room for "it works on my machine" here.

Would be great if you could also include:
- Why you made certain architectural choices
- Any cost optimization tips
- Security considerations
- How to test that everything works

Really appreciate any help here. Need to get this infrastructure defined properly so we can stop doing manual deployments and have a solid foundation for our app.

Thanks!