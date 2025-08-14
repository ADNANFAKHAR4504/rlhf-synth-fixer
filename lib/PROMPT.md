# Help with AWS CloudFormation Template

Hey, I'm working with a dev team that keeps running into issues with their AWS setups. They've been clicking through the console to create environments, and it's getting messy. Different people set things up differently, and we keep having configuration drift issues.

## What we're looking for

We need a CloudFormation template that sets up a basic but solid environment. Here's what the team wants:

**Network stuff:**
- Fresh VPC in us-east-1 with 10.0.0.0/16
- Two public subnets in different availability zones  
- Two private subnets also spread across AZs
- Internet gateway for the public subnets
- NAT gateway in one of the public subnets so private resources can get out to the internet

**Servers and security:**
- EC2 instances running in the private subnets (using latest Amazon Linux 2)
- Security groups that only allow SSH from our office IP
- Route tables configured properly so everything can talk to each other and reach the internet when needed

**Keeping things organized:**
- Tag everything with 'ProjectX-' so we can track it easily
- Use clear, descriptive names for resources

## What I need from you

Can you create a YAML CloudFormation template that covers all this? It needs to:
- Actually work when we deploy it (we'll test it first obviously)
- Have good comments so the team understands what's happening
- Follow AWS best practices
- Be something we can maintain and modify later

The team isn't super advanced with AWS, so simpler is better than clever if that makes sense.

## How to structure your response

Could you give me:
1. Quick explanation of how you approached the design
2. The full template with comments
3. What outputs would be helpful for us
4. Any heads up about the deployment process

Thanks! This will really help us standardize our infrastructure setup.
