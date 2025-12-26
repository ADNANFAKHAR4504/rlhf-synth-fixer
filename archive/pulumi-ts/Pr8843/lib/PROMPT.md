# Pulumi AWS Infrastructure Setup

I'm working on setting up a secure AWS infrastructure using Pulumi and TypeScript. This is meant to be modular, production-ready, and something we can reuse across environments like dev, stage, and prod. Right now, I'm targeting `ap-south-1` as the default region.

What I will be needing in this infra project of mine:

- A new VPC with CIDR range `10.0.0.0/16`
- Two public subnets: `10.0.1.0/24` and `10.0.2.0/24`, which needs to be split across AZs
- IGW that connects to the VPC and a route table routing subnet traffic through the IGW to enable internet access
- A security group attached to the EC2 instance that allows inbound SSH on port 22 only from `203.26.56.90/32` - no open SSH access
- A basic EC2 instance running Amazon Linux 2023, deployed in one of the public subnets, protected by the security group for SSH access
- Pulumi config or env vars for region + SSH CIDRs
- It should always follow consistent resource naming using `<resource>-<env>` convention
- Tags on everything and each resources
- Pulumi provider must explicitly specify the region when creating the infra
- Output the important resources: VPC ID, subnet IDs, SG ID, EC2 public IP

Please provide the Pulumi TypeScript code implementing this setup. The code must be production-ready, follow AWS security standards, and be region-agnostic. Don't worry about boilerplate - just the main infra bits.
