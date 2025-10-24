# Hey team! 

We need to set up a production infrastructure template for our multi-tier application. Here's what we're looking to build:

I've been talking with the platform team, and they want us to create a CloudFormation template that we can use across different AWS accounts and environments. The key thing they emphasized is that it needs to be super flexible (you know how each team has their own requirements) and completely automated - no manual clicking around in the console.

## What we need to build

### First up - Network Setup

The networking folks want us to set up a proper VPC layout. They've asked for:

- A fresh VPC that teams can configure with their own CIDR range (let's default to `10.0.0.0/16` for now)
- We'll need 4 subnets spread across two AZs (you know, for high availability ):
  - 2 public subnets for our load balancers
  - 2 private subnets for the actual workloads
- Teams should be able to pick their own subnet ranges
- Standard stuff like Internet Gateway for public access
- NAT Gateways in the public subnets (with Elastic IPs) so our private resources can reach the internet

### Load Balancer Configuration

For the frontend traffic handling:
- We're going with a Network Load Balancer (NLB) in the public subnets
- It'll handle the usual HTTP/HTTPS traffic
- The cool part is it'll automatically manage Elastic IPs
- And of course, it needs to work smoothly with our Auto Scaling Group

### EC2 & Auto Scaling Setup

For the application servers:
- We'll use Amazon Linux 2 (pulling from SSM Parameter Store to always get the latest)
- Need to set up EC2 key pairs automatically - no manual key creation!
- Auto Scaling Group spread across AZs (because who doesn't love high availability?)
- Security-wise, we're keeping it tight:
  - Only allowing traffic from our NLB on ports 80 and 443

### Database Stuff

The database team has some specific requirements:
- They want either MySQL or PostgreSQL (their choice) with Multi-AZ enabled
- It has to be in our private subnets (security first! )
- Absolutely no public access allowed
- Only the EC2 instances should be able to talk to it

### Storage Requirements

For S3 storage:
- Security team insists on encryption (either SSE-S3 or SSE-KMS)
- Buckets need to be private - no public access allowed!

### Monitoring & Logging (Because DevOps Will Ask! )

We need some basic observability set up:
- VPC Flow Logs going to either S3 or CloudWatch
- And please, please don't forget the tags! You know how the cost team gets... 
  - Project
  - Environment
  - Owner
  - Whatever else makes sense

## The Multi-Account Thing

Here's the tricky part - this needs to work across different AWS accounts. So:

- No hardcoding anything! (I'm looking at you, Account IDs and ARNs )
- Everything needs to be dynamic and flexible
- Use parameters where you can
- Leverage those AWS pseudo parameters (you know, `AWS::AccountId`, `AWS::Region`, etc.)
- And don't forget about SSM and Secrets Manager for the dynamic stuff

## What Success Looks Like

When you're done, we should have:

1. A solid CloudFormation template that anyone can just grab and deploy
2. It should work through both:
   - The AWS Console (for the clicky people)
   - AWS CLI (for the cool kids )

### This Should Create Everything We Need

The template needs to set up the whole shebang:
- All the network stuff (VPC, subnets, gateways, load balancer)
- The compute layer with auto-scaling
- A proper database that won't fall over
- Secure S3 storage
- And all the logging our security team loves

### The Customizable Bits

We need to make sure teams can easily customize:
- Their network ranges
- EC2 key pairs
- Instance sizes
- Database creds
- Pretty much anything that might need tweaking

## Technical Stuff You Should Know

1. For the AMI, we're standardizing on this one:
   ```
   /aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2
   ```
   (It's in SSM Parameter Store, so it's always up to date )

2. Before you ship it:
   - Run it through `cfn-lint` (save us from those embarrassing validation errors!)
   - Test it with `aws cloudformation validate-template`

## What's the Definition of Done?

You'll know you're done when you have a template that:
- Has all the pieces we talked about
- Uses those dynamic parameters (no hardcoding!)
- Routes traffic properly through the NLB
- Has all our required tags
- And most importantly - just works when you run it! 

Let me know if you need any clarification or run into any roadblocks! 