I am working on setting up a new AWS environment and need help with the CloudFormation template.

I need to create a secure infrastructure setup in us-east-1 that can handle our application needs. I want to make sure we are following all the security best practices from the start, as it is always harder to fix security issues later.

For the networking piece, I need a VPC that covers two AZs with both public and private subnets. The VPC connects to an Internet Gateway for the public subnets and integrates with a NAT Gateway so the private subnets can reach out to the internet when needed for updates.

On the compute side, I want to spin up an EC2 instance in one of the public subnets. The security groups should only allow HTTP on port 80 and SSH on port 22, and even then, only from specific IP ranges. No open access to the world.

For security, I am planning to use AWS Secrets Manager for storing our app secrets. The EC2 instance connects to Secrets Manager through proper IAM roles with minimal permissions - just what is absolutely necessary for Secrets Manager access and EC2 operations. No broad permissions that could cause security headaches down the road.

I also want to make sure we have good visibility into what is happening. CloudWatch integrates with the EC2 instance for metrics logging, and VPC Flow Logs connect to CloudWatch to keep an eye on network traffic.

The template should properly handle all the resource dependencies, make sure everything is secure by default, and be easy enough to modify when we need to add more resources later.

Could you help me put together a CloudFormation template called TapStack.yml that covers all this following AWS best practices?
