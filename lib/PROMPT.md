## Multi-Region AWS Network Infrastructure

I need to set up a multi-region networking infrastructure in AWS spanning us-east-2 and us-west-2 regions using VPC, EC2 networking components, and NAT services.

For each region, create a VPC that connects to an Internet Gateway for public internet access. The VPC should have both public Subnets and private Subnets distributed across multiple Availability Zones.

Public Subnets need to be associated with a public Route Table that routes traffic through the Internet Gateway. Private Subnets should connect to a NAT Gateway that is provisioned in a public Subnet, allowing outbound internet access without exposing private resources directly.

Each NAT Gateway requires an Elastic IP (EIP) allocation for its public address. The private Route Table should route outbound traffic through the NAT Gateway.

Use the naming convention project-resource-environment for all resources. Output everything to a single main.tf file under lib/main.tf. We already have provider.tf configured with provider aliases for multi-region deployment, so do not include provider blocks in main.tf.
