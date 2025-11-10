Context
A multinational corporation is establishing a global AWS infrastructure to support its expanding operations. The company requires a secure and scalable hub-and-spoke network architecture across three AWS regions, ensuring isolated traffic between development and production workloads while maintaining centralized monitoring and DNS resolution.

Requirements
The network architecture should consist of:

Three VPCs in distinct AWS regions — us-east-1 (hub), eu-west-1, and ap-southeast-1 (spokes) — using non-overlapping CIDR blocks.

An AWS Transit Gateway in the hub region to enable cross-region communication with separate route tables for development (10.1.0.0/16) and production (10.2.0.0/16) environments.

Transit Gateway peering attachments between hub and spoke regions with proper route propagation.

Route 53 private hosted zones for DNS resolution across all regions, ensuring environment-specific zones with .internal suffixes.

Systems Manager VPC endpoints (ssm, ssmmessages, ec2messages) for secure management access without Internet Gateways.

Flow Logs for all VPCs, stored in S3 with a custom log format in Parquet and a 5-minute aggregation interval.

NAT instances (not gateways) in the hub region for outbound Internet access, configured with source/destination check disabled and automatic failover between instances.

Transit Gateway blackhole routes to prevent dev-prod traffic crossover.

Consistent tagging on all resources (Environment, Region, and Purpose).

Resource naming must follow {region}-{environment}-{resource-type}-{random-suffix} format.

Actions
Develop a single Terraform configuration named tap-stack.tf that provisions the complete setup.

Use only Terraform resource blocks and data sources (no external or registry modules).

Ensure Terraform 1.5+ compatibility with AWS provider version >= 5.0.

Define S3 lifecycle policies for flow logs and enforce SSE-S3 encryption.

Create isolated route tables per environment with Transit Gateway route propagation limited by environment.

Implement NAT instance failover logic and associate Route 53 zones correctly to each VPC.

Format
Provide only the Terraform code for tap-stack.tf — no explanations, no comments, and no descriptive text. The configuration must be self-contained and ready for direct deployment with terraform apply.

Tone
Professional, directive, and human-readable — suitable for an experienced DevOps engineer executing a production-grade network deployment. Avoid robotic or AI-generated formatting.
