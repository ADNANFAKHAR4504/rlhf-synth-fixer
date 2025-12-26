Create a production-ready VPC network infrastructure using AWS CloudFormation that spans multiple availability zones for high availability. The network should support both public-facing and private backend workloads with proper isolation.

## Network Architecture

Design a VPC where public subnets connect directly to the internet through an Internet Gateway, enabling web servers and load balancers to receive external traffic. Private subnets should route outbound traffic through NAT Gateways placed in each availability zone, allowing backend services to download updates and reach external APIs without exposing them to inbound internet connections.

## Infrastructure Requirements

Deploy the VPC across two availability zones with matching subnet pairs in each zone. Public subnets need routes that direct internet-bound traffic to the Internet Gateway, while private subnets route through NAT Gateways for outbound-only connectivity.

Configure security groups that allow web traffic to reach public resources and enable private instances to communicate with each other within the VPC. Network ACLs should provide an additional layer of defense at the subnet boundary, permitting necessary traffic flows while blocking everything else by default.

## Expected Resources

The CloudFormation template should provision the complete network stack including the VPC, public and private subnets in each availability zone, an Internet Gateway attached to the VPC, NAT Gateways with Elastic IPs in each public subnet, route tables that direct traffic appropriately, security groups for common workload patterns, and network ACLs with explicit allow rules for required traffic.

## Deployment Notes

Use CloudFormation parameters to allow customization of CIDR blocks and environment naming. Export key resource IDs so other stacks can reference this network infrastructure. Ensure all resources follow AWS tagging best practices for cost allocation and resource management.
