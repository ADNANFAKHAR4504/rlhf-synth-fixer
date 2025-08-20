# CloudFormation YAML Template Prompt

## Objective

Generate an AWS CloudFormation template in YAML format to set up a secure networking environment in the `us-east-1` region.

## Constraints

The template must **strictly adhere** to the following requirements without modifying any provided details:

1. **VPC**
- Create a VPC with CIDR block: `10.0.0.0/16`.

2. **Public Subnets**
- Deploy two public subnets with the following CIDR blocks:
- `10.0.1.0/24` in one availability zone.
- `10.0.2.0/24` in another availability zone.

3. **Private Subnets**
- Deploy two private subnets with the following CIDR blocks:
- `10.0.3.0/24` in one availability zone.
- `10.0.4.0/24` in another availability zone.

4. **Internet Gateway**
- Attach an Internet Gateway to the VPC to enable public internet access.

5. **Routing Tables**
- Create separate routing tables:
- Public routing table must route internet-bound traffic to the Internet Gateway.
- Private routing table must route traffic through a NAT Gateway.

6. **NAT Gateway**
- Deploy a NAT Gateway in one of the public subnets to enable internet access for private subnets.

7. **Subnet Associations**
- Associate each routing table with the corresponding public or private subnets.

8. **Security Groups**
- Allow inbound EC2 TCP traffic to public subnets on:
- Port `80` (HTTP)
- Port `22` (SSH)

9. **Region**
- All resources must be created in the AWS region: `us-east-1`.

## Output Requirements

- The output must be a **complete, syntactically correct CloudFormation YAML template**.
- It should be **ready for deployment** without errors.
- **Do not alter** any CIDR blocks, availability zone assignments, or port rules.
- Output **only** the YAML CloudFormation template no additional explanations or notes.
