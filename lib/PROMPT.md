# Pulumi AWS Infrastructure Setup (Human-style prompt)

I'm setting up a secure and modular AWS environment using Pulumi with TypeScript. The goal is to follow AWS security best practices and keep things region-agnostic, but I'll start by deploying in `ap-south-1`. I want the code to be production-ready and reusable across environments like `dev`, `stage`, and `prod`.

Here’s what I’m trying to build:

- A new VPC with the CIDR block `10.0.0.0/16`.
- Two public subnets: `10.0.1.0/24` and `10.0.2.0/24`, spread across different availability zones.
- An Internet Gateway atached to the VPC.
- A route table linked to the IGW, associated with both public subnets to enable outbound internet access.
- A security group that allows SSH only from a specific trusted CIDR (e.g., `203.26.56.90/32`). No broad SSH access.
- An EC2 instance (Amazon Linux 2023) in one of the public subnets, associated with the security group. Should be publicly reachable via SSH (but only from that CIDR).
- Use Pulumi config or environment variables to provide values like allowed SSH CIDRs and the target region.
- All resources should be tagged and named using the `<resource>-<environment>` convention.
- Everything should be created using a Pulumi provider configured for the chosen region.
- Finally, export all the important outputs: VPC ID, subnet IDs, security group ID, and the EC2 instance public IP.

Please avoid scaffolding/boilerplate and focus just on the core infrastructure logic.

Thanks!

Please provide the Pulumi TypeScript code implementing this setup. The code must be production-ready, follow AWS security standards, and be region-agnostic. Avoid boilerplate scaffolding — focus only on the core infrastructure logic.
