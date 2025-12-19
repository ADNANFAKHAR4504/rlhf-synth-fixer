Need to build infrastructure for our job board app using AWS CDK with TypeScript. We're expecting around 3000 users per day and want to deploy this in us-west-1.

Here's what I need:

VPC setup with CIDR 10.20.0.0/16 - needs both public and private subnets across multiple AZs for HA

For the compute side, I want t3.micro EC2 instances running Apache. The user data should handle installing and starting Apache automatically.

Set up an ALB for the front end - it should handle HTTPS on 443. Also want to enable that new Automatic Target Weights feature I read about for better traffic distribution. Need health checks configured too.

Security groups:
- ALB needs to accept HTTPS (443) from the internet
- EC2 instances should only take HTTP from the ALB, plus SSH but only from 10.0.0.0/16

An S3 bucket for static files would be good, with the right policies for web hosting

CloudWatch monitoring is important - track CPU on the EC2s and set up alarms for when instances go unhealthy

Also need EC2 Instance Connect Endpoint so we can SSH without public IPs on the instances

For security, we should add AWS WAF v2 with the Bot Control managed rules on the ALB to stop bots and scrapers. Rate limiting too. WAF logs should go to S3.

One more thing - can you set up CloudWatch Network Monitor between the EC2 instances and ALB? Want near real-time visibility on network performance, TCP metrics for packet loss and latency.

Make sure everything follows AWS best practices for security and high availability.
