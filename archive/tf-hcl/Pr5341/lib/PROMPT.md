hey we need to build a secure three-tier VPC architecture for our financial services client who's expanding their cloud presence. They're looking for a production-ready network that maintains strict isolation between tiers while supporting both public-facing applications and internal services. Use Terraform with HCL to implement this infrastructure.

Here's what we're building: a VPC with CIDR block 10.0.0.0/16 that spans three availability zones in us-west-2. We'll need nine subnets total - three public subnets for web-facing resources, three private subnets for application servers, and three database subnets that are completely isolated from the internet. The public subnets will use 10.0.1.0/24, 10.0.2.0/24, and 10.0.3.0/24. Private subnets get 10.0.11.0/24, 10.0.12.0/24, and 10.0.13.0/24. Database subnets use 10.0.21.0/24, 10.0.22.0/24, and 10.0.23.0/24.

For connectivity, we're setting up an Internet Gateway that'll be attached to the VPC for public subnet access. Each public subnet needs its own NAT Gateway - that's three NAT Gateways total - to provide outbound internet access for resources in the private subnets. The database tier won't have any internet connectivity at all.

Configure the route tables carefully. Public subnets should route internet traffic through the Internet Gateway. Private subnets need routes to their respective NAT Gateways for outbound access only. Database subnets should only have local VPC routing - no external routes whatsoever.

We'll also need a DB subnet group containing all three database subnets for RDS deployments. For additional security, implement Network ACLs for the database subnets that explicitly block all inbound traffic from the internet.

Don't forget the compliance requirements. Every resource must be tagged with Environment (use the environmentSuffix variable), Project, and CostCenter tags. The VPC needs DNS hostnames and DNS resolution enabled for internal service discovery.

Make sure the infrastructure is distributed exactly across three availability zones: us-west-2a, us-west-2b, and us-west-2c. This ensures high availability and fault tolerance for the production environment.

The configuration should output the VPC ID, all nine subnet IDs organized by tier, and the DB subnet group name. These outputs will be used by other teams deploying applications into this network.

For file organization, structure the Terraform configuration as follows:

lib/provider.tf - AWS provider configuration and Terraform version constraints
lib/main.tf - All VPC resources including subnets, gateways, route tables, NACLs, and the DB subnet group
Use the environmentSuffix variable consistently in all resource names for environment separation
This needs to be production-ready, so ensure all security best practices are followed, including proper network isolation, least-privilege routing, and comprehensive tagging for cost tracking and compliance.