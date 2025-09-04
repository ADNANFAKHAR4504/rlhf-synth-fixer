I need to create a VPC infrastructure in AWS that spans two availability zones in the us-west-2 region for a development environment. 

The infrastructure should include:

1. A VPC with public and private subnets in two availability zones
2. Internet gateway for public subnet internet access
3. NAT gateways in each public subnet for private subnet outbound traffic
4. Route tables properly configured for public and private subnets
5. All public IP addresses should use Elastic IPs
6. Enable full ICMP traffic for troubleshooting in both subnet types

I want to use some of the latest AWS networking features available in 2025. Please include VPC Lattice for service connectivity and IPv6 dual-stack support where appropriate to keep the infrastructure modern.

Make sure to add proper resource tagging for cost tracking and identification. The infrastructure should be suitable for a development environment with quick deployment times.

Please provide infrastructure code with one code block per file. Use CDK TypeScript for the implementation.