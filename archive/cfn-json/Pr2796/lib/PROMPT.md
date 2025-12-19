## Objective
Create a foundational AWS network architecture using AWS CloudFormation in **JSON format** to support a highly available and secure environment.

## Template File Name
`cloud_environment_setup.json`

## Requirements

### 1. VPC
- Create a VPC with the CIDR block: `10.0.0.0/16`.

### 2. Subnets
- **Two Public Subnets**
  - Must reside in different Availability Zones.
  - Assign unique CIDR blocks (e.g., `10.0.1.0/24`, `10.0.2.0/24`).
- **Two Private Subnets**
  - Must reside in different Availability Zones.
  - Assign unique CIDR blocks (e.g., `10.0.3.0/24`, `10.0.4.0/24`).

### 3. Internet Gateway (IGW)
- Create and attach an Internet Gateway to the VPC.
- Configure a route in public subnets' route tables to allow outbound Internet access through the IGW.

### 4. NAT Gateways
- Create **two NAT Gateways**:
  - One in each public subnet.
  - Allocate Elastic IPs for each.
- Create route tables for each private subnet to route outbound traffic through the respective NAT Gateway.

### 5. EC2 Instances
- Launch **EC2 instances in each private subnet**.
- Ensure:
  - No public IPs are assigned.
  - Instances are associated with private subnet route tables.

### 6. Outputs
Provide the following CloudFormation outputs:
- VPC ID
- Public Subnet IDs
- Private Subnet IDs
- NAT Gateway IDs

## Notes
- Ensure all resources are tagged where applicable for easy identification.
- Use parameterized naming conventions for resources where possible.
- Ensure the configuration is valid and deployable in AWS.
