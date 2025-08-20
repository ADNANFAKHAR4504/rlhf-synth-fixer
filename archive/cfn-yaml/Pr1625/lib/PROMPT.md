Hey there! I'm working on setting up a new AWS environment and could really use some help with the CloudFormation template. 

I need to create a secure infrastructure setup in us-west-2 that can handle our application needs. The thing is, I want to make sure we're following all the security best practices from the start - you know how it goes, it's always harder to fix security issues later.

Here's what I'm thinking for the setup:

For the networking piece, I need a VPC that covers two AZs with both public and private subnets. We'll need an Internet Gateway for the public subnets and a NAT Gateway so the private subnets can reach out to the internet when needed (for updates, etc.).

On the compute side, I want to spin up an EC2 instance in one of the public subnets. But here's the important part - I need to be really careful about the security groups. We should only allow HTTP (port 80) and SSH (port 22) access, and even then, only from specific IP ranges. No open access to the world.

For security, I'm planning to use AWS Secrets Manager for storing our app secrets. And I want to set up proper IAM roles with minimal permissions - just what's absolutely necessary for Secrets Manager access and EC2 operations. No broad permissions that could cause security headaches down the road.

I also want to make sure we have good visibility into what's happening. So CloudWatch logging for the EC2 metrics would be great, and VPC Flow Logs to keep an eye on network traffic.

The template should be something we can actually use in production - you know, properly handle all the resource dependencies, make sure everything is secure by default, and easy enough to modify when we need to add more resources later.

Could you help me put together a CloudFormation template (let's call it TapStack.yml) that covers all this? I want to make sure it's solid and follows AWS best practices.
