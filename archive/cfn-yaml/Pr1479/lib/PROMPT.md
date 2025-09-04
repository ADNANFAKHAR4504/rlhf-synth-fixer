I need help building a comprehensive CloudFormation template for our production AWS infrastructure. We're looking to establish a solid foundation in us-east-1 that follows security best practices.

What we're trying to build:

We want a new VPC that spans multiple availability zones for redundancy. The network design should have public subnets with internet access and private subnets protected behind NAT gateways. I'd like to get VPC Flow Logs working too, sending data to a CloudWatch log group with encryption enabled.

For the application layer, we need an internet-facing Network Load Balancer in the public subnets that routes traffic to EC2 instances running in the private subnets. The instances should register automatically with a target group and have proper health monitoring.

We also want a bastion host in one of the public subnets for administrative access. This needs an IAM role with minimal permissions - just enough to work with S3, EC2, and CloudWatch resources.

Security requirements are pretty strict. All instances need security groups that restrict access appropriately. SSH to the bastion should only come from our office IP (we'll parameterize this), and the app instances should only accept traffic from the load balancer - no direct internet exposure.

We'll need an S3 bucket too, locked down with encryption and public access completely blocked.

Some technical preferences:
- Pure CloudFormation YAML only, no CDK or other frameworks
- Use dynamic references for AZs and AMI IDs instead of hardcoding
- Tag everything with Environment=Production
- Include some parameters for SSH IP and instance types
- Would be great to have a brief comment explaining how to verify everything works

The template should pass cfn-lint validation and follow AWS security recommendations. Looking for a single YAML file as the deliverable.