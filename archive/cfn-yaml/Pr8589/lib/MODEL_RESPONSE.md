# model_response.md

## Overview
This document describes the expected results when deploying the **TapStack VPC CloudFormation stack**. It complements `model_failure.md` by showing what a successful deployment should produce. The stack provisions a production-grade VPC with high availability networking, internet access, and NAT-based routing for private subnets.

---

## Provisioned Resources
On successful deployment, CloudFormation creates the following AWS resources:

### Networking
- **VPC**  
  - A dedicated VPC with DNS support and hostnames enabled.  
  - Tagged with `Name = <EnvironmentName>-vpc` and `Environment = <EnvironmentName>`.  

- **Subnets**  
  - **2 Public Subnets** across distinct Availability Zones.  
    - Auto-assign public IPs enabled.  
    - Used for internet-facing resources (e.g., ALBs, Bastion hosts).  
  - **2 Private Subnets** across distinct Availability Zones.  
    - No public IPs assigned.  
    - Routed through NAT gateways for outbound access.  

- **Internet Gateway (IGW)**  
  - Provides outbound internet access for public subnets.  
  - Attached to the VPC.  

- **NAT Gateways (2)**  
  - One per public subnet.  
  - Each NAT gateway is backed by an Elastic IP.  
  - Enables instances in private subnets to reach the internet securely.  

### Routing
- **Public Route Table**  
  - Default route (`0.0.0.0/0`) to the Internet Gateway.  
  - Associated with both public subnets.  

- **Private Route Tables (2)**  
  - Each private subnet is associated with a dedicated route table.  
  - Default route (`0.0.0.0/0`) pointing to the NAT Gateway in the same AZ for high availability.  

---

## Stack Outputs
After successful deployment, the stack produces the following outputs:

- **VPCId**  
  - The ID of the newly created VPC.  
  - Example: `vpc-0abc123def456`.  

- **PublicSubnetIds**  
  - A comma-separated list of the two public subnet IDs.  
  - Example: `subnet-0123abcd,subnet-0456efgh`.  

- **PrivateSubnetIds**  
  - A comma-separated list of the two private subnet IDs.  
  - Example: `subnet-0789ijkl,subnet-0912mnop`.  

---

## Expected Behavior
- **Public Subnets**  
  - Instances launched here automatically receive public IPs and can reach the internet directly through the IGW.  

- **Private Subnets**  
  - Instances do not receive public IPs.  
  - Outbound internet connectivity is routed via NAT Gateways.  
  - No inbound internet connectivity possible unless explicitly routed via ALB/NLB in public subnets.  

- **High Availability**  
  - Resources are distributed across two Availability Zones.  
  - Each private subnet has an independent NAT gateway to minimize single points of failure.  

---

## Use Cases
- **Application Deployment**  
  - Place application servers in private subnets with outbound internet via NAT.  
  - Place load balancers or bastion hosts in public subnets.  

- **Security Best Practice**  
  - Minimizes exposure of private workloads.  
  - Uses NAT gateways to enforce egress-only access for private resources.  

---

## Compliance & Extensibility
- Tags applied to all resources for cost allocation and governance.  
- Can be extended to include:
  - Security groups and NACLs.  
  - Bastion hosts or VPN gateways.  
  - RDS/Aurora databases in private subnets.  
  - Application Load Balancers in public subnets.  
