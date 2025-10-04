We’re designing infrastructure for a startup that expects around 2,000 daily users. The main goals are keeping things cost-optimized, ensuring the app stays up, balancing traffic properly, and having some basic monitoring in place. Nothing crazy enterprise-level, but still solid enough to handle real traffic.

The region to work with is us-west-2. The core building block is a proper VPC (10.0.0.0/16) with the usual setup: two public subnets and two private subnets, each spread across different availability zones. Public subnets get an Internet Gateway, and private ones get a NAT Gateway so they can reach the internet when needed. Route tables and associations should be wired up cleanly to make everything behave.

On the compute side, we’re keeping it small and efficient with t3.micro EC2 instances. These should sit in the private subnets, not exposed directly, but reachable through an Application Load Balancer (HTTP, port 80) in front of them. To keep availability high, the EC2 instances should be part of an Auto Scaling Group that spans at least two AZs.

Security is important. So let’s lock it down like this:

A security group that only allows HTTP (80) traffic and only within the VPC CIDR.

Another security group that allows SSH, but only from a specific trusted CIDR (not wide open).

Static assets should live in S3, but we need to apply a proper bucket policy to restrict access (no wide-open buckets).

For monitoring, add CloudWatch to keep an eye on the EC2 instances so the startup has visibility into what’s going on.

The expectation is to capture all of this in a single tap_stack.tf file. Don’t bother with provider.tf (that’s separate). The Terraform file should include all the variables, locals, resources, outputs, and must be written cleanly enough that it deploys without errors. The outputs should expose useful values like VPC IDs, subnet IDs, ALB DNS name, and so on.

In short:

VPC in us-west-2, CIDR 10.0.0.0/16

2 public + 2 private subnets (multi-AZ)

Internet Gateway + NAT Gateway + route tables wired properly

EC2 (t3.micro) behind Auto Scaling, private subnets

Application Load Balancer for HTTP traffic (port 80)

Security groups restricted to CIDR ranges (HTTP + SSH)

S3 bucket with restricted bucket policy

CloudWatch monitoring for EC2

Everything captured in one tap_stack.tf file, clean and correct

Infrastructure must adhere to AWS best practices

The final Terraform should be able to spin this up smoothly, meet the requirements, and pass any tests for correctness.
