Hey team,

We've inherited a complete mess of a Terraform setup for our AWS networking infrastructure, and honestly, it's causing us real headaches. Our dev environments keep running out of IP addresses, we've got duplicated code everywhere, and the NAT Gateway costs are way higher than they should be.

Here's the situation:
We're running VPCs across three regions (us-east-1, us-west-2, and eu-central-1), and someone before us just copy-pasted everything with hardcoded values. The VPC peering is broken in places, DNS resolution between VPCs doesn't work properly, and we've got 9 NAT Gateways when we really only need 3. Finance is breathing down our necks about the costs.

What we need you to do:
- Refactor this into a proper modular setup that we can actually maintain
- Get rid of all those hardcoded CIDR blocks and use cidrsubnet() so we stop running out of IPs
- Build a reusable VPC module - no more copy-paste nonsense
- Fix the VPC peering connections with proper route tables and security groups
- Cut our NAT Gateway costs by 60% using a shared egress pattern (1 per region instead of 3)
- Sort out the DNS issues with Route53 Resolver endpoints
- Set up proper state file isolation using S3 backend with workspaces per region
- Add lifecycle rules so nobody accidentally deletes our VPCs
- Implement a real tagging strategy for cost allocation
- Fix those circular dependency issues in the security groups

A few things to keep in mind:
- Must use for_each everywhere, no count parameter allowed
- Terraform version needs to work from 1.5 through 1.7
- We have existing infrastructure that cannot go down during this refactor
- Use data sources to reference existing stuff instead of importing everything
- Naming convention: {environment}-{region}-{resource-type}-{index}
- No local-exec or external data sources please
- No need to put prevent_destroy(for easy cleanup process) on VPCs and Internet Gateways 

What we're expecting from you:

1) main.tf - orchestrates the regional deployments, calls the VPC module for each region
2) variables.tf - defines all the input variables with CIDR calculation logic
3) outputs.tf - exports VPC IDs, subnet IDs, and other important info
4) modules/vpc/main.tf - the actual VPC module with all networking resources
5) modules/vpc/variables.tf - module inputs
6) modules/vpc/outputs.tf - module outputs
7) terraform.tfvars - example values (use placeholders, not real data)
8) refactoring-guide.md - step-by-step instructions on how to apply this without breaking prod
9) cost-analysis.md - breakdown showing how we're achieving the 60% NAT Gateway savings

Format everything properly:
- Use clear comments explaining the why, not just the what
- Each file in a separate code block with the filename at the top
- Include examples in the refactoring guide
- Make sure the module is actually reusable and not region-specific

This is high priority - we need to get this cleaned up before the next audit. Let me know if you have questions about the existing setup.