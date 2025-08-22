Insert here the prompt that made the model fail.You are an expert AWS Solutions Architect. Your goal is to generate a production-grade CloudFormation YAML template that sets up a complete networking environment in AWS based on the following infrastructure design and functional requirements:

Functional Requirements:
VPC and Subnet Layout:

Create a VPC spanning two Availability Zones (AZs) in a specified region.

For each AZ, create:

One public subnet

One private subnet

Internet and NAT Gateways:

Attach an Internet Gateway (IGW) to the VPC.

Create two NAT Gateways (one in each public subnet).

Ensure:

Public subnets route internet traffic via the IGW.

Private subnets route internet traffic via their respective NAT Gateway.

Security and Access:

Allow full ICMP traffic (inbound and outbound) in all public and private subnets (to aid in troubleshooting, e.g., for ping).

Associate Route Tables correctly for each subnet type (public/private).

IP Addressing:

Use Elastic IPs (EIPs) for:

Internet Gateway NAT translation (i.e., each NAT Gateway uses an EIP).

All public IPs must be static.

Tagging:

Apply Tags across all AWS resources. Tags should include at least:

Name

Environment

Project

Owner

Output Requirements:
A CloudFormation YAML template that:

Is deployable without modification

Passes deployment with aws cloudformation deploy (or equivalent) without error

Fulfills all specified functional requirements

Optional: Use parameters for region, CIDR blocks, environment name, and tags for reusability.

Implementation Notes:
Use !Ref and !Sub for dynamic references.

Use Mappings or Parameters for AZs and CIDR blocks if applicable.

Ensure proper dependency ordering using DependsOn or implicit resource linking.

Ensure all networking and routing configurations are logically and functionally correct.