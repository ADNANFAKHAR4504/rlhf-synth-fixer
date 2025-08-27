# Help with AWS Migration - Need CDK + Go Infrastructure

## What I'm Trying to Do

Hey, so we're finally moving our old on-prem app to AWS and I'm tasked with building out the infrastructure. Management decided we should use CDK with Go instead of CloudFormation because our team is way more comfortable with Go, and honestly, writing infrastructure in a real programming language sounds way better than wrestling with YAML.

The thing is, I've done some basic AWS stuff before but never a full migration like this, and definitely not with CDK. I need to get this right because it's going into production and my boss is already nervous about the timeline.

## Our Current Setup

Right now we have a pretty standard three-tier setup on-premises:
- Web servers behind a load balancer
- App servers in the middle
- MySQL database on the backend (we're actually considering switching between MySQL and PostgreSQL)
- Everything sits in our data center with some basic firewalls

It works fine but we're hitting capacity limits and the hardware is getting old. Plus, our CEO keeps asking about "cloud scalability" after reading some article.

## What I Need to Build in AWS

I've been reading AWS docs and talking to our solutions architect, and here's what we need:

**Networking stuff:**
- VPC in us-east-1 (that's what our SA recommended) with proper CIDR blocks (10.0.0.0/16 should work)
- Public subnets for the web servers and load balancer (with /24 CIDR masks)
- Private isolated subnets for our database servers (with /24 CIDR masks)
- Need it across at least 2 AZs for redundancy
- Internet gateway for public subnets
- VPC endpoints for S3 to save on transfer costs
- DNS hostnames and DNS support enabled for proper hostname resolution

**Application layer:**
- EC2 instances for web servers (t3.micro should be fine for now, we can scale up later)
- Instance profile with proper IAM roles (need SSM access for management)
- Security groups properly configured for web traffic (ports 80, 443)
- SSH access restricted to our office IP (we'll provide this as a parameter)
- User data script to install Apache and display a simple web page
- EC2 instances should be in public subnets for now (we'll add ALB later)

**Database:**
- RDS MySQL instance (version 8.0, we decided on MySQL after all)
- Instance type db.t3.small (burstable performance should be fine)
- Needs to be in its own subnet group in private isolated subnets
- Multi-AZ for high availability
- Proper security groups so only web servers can reach it (port 3306)
- Automated backups with 7 day retention
- Database name should be 'cfdb'
- Admin username 'admin' with a secure password stored in Secrets Manager
- 20GB GP2 storage initially
- Performance monitoring enabled (60 second intervals)

**Other stuff we need:**
- S3 bucket for static assets with versioning enabled
- S3 bucket for access logs (separate from the main bucket)
- Both buckets should have server-side encryption (S3 managed)
- Block all public access on both buckets
- CloudWatch alarm for RDS CPU utilization (alert if over 75% for 2 periods)
- Security groups that only allow traffic where needed
- Proper tagging for all resources (Environment, Project tags)
- VPC Gateway Endpoint for S3 to reduce costs
- All resources should have deletion protection disabled for testing (we'll enable it in prod)

## My Specific Problems

1. **Project structure** - I have no idea how to organize a CDK Go project. Should I put everything in the main stack or use nested stacks? How do I handle different environments?

2. **CDK patterns** - I've looked at some examples but they're all pretty basic. How do you handle complex dependencies between resources?

3. **Security groups** - I know I need them but I'm not sure about the best practices for a multi-tier app

4. **Auto Scaling** - Never set this up before. What metrics should I use? How do I make sure it doesn't go crazy and cost us a fortune?

5. **RDS setup** - I know it needs to be in private subnets but I'm fuzzy on the subnet group configuration and how to properly store the password

6. **S3 and VPC Endpoints** - How do I set up the VPC endpoint for S3? Do I need special policies?

## What Would Really Help

If you could show me:
- A complete working example that I can actually deploy
- How to structure the Go code so it's maintainable
- The security group rules that make sense for this architecture
- How to properly configure S3 buckets with logging and encryption
- Any gotchas or common mistakes to avoid

I'm not looking for a tutorial - I can read the docs. I need working code that follows best practices so I don't mess this up. Our go-live is in 6 weeks and I still need time for testing.

Also, if there are any specific CDK patterns or Go idioms I should know about, that would be awesome. I want this to be something the team can maintain and extend later. We need proper CloudFormation outputs too so we can see the resource IDs and endpoints after deployment.

Thanks for any help! This migration is a big deal for our company and I really want to get it right.