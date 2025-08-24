# CloudFormation Template Generation Prompt

You are an AWS CloudFormation expert. Generate a single, production-ready CloudFormation YAML template that provisions a secure, highly available web application baseline as described below. Output only the YAML template—no extra text, comments, or explanations.

## Requirements

**Region:**  
Deploy in us-east-1 (assume the stack is launched there; do not parameterize the region).

**Tagging:**  
Tag every resource with `Environment: Production`.

### Networking

- Create a VPC with CIDR `10.0.0.0/16`.
- Create two public subnets in distinct AZs and two private subnets in distinct AZs (use `/24` CIDRs: `10.0.0.0/24`, `10.0.1.0/24`, `10.0.10.0/24`, `10.0.11.0/24`).
- Attach an Internet Gateway to the VPC.
- Create two NAT Gateways (one per public subnet) with associated Elastic IPs.
- Route tables:
  - Public subnets route `0.0.0.0/0` to the Internet Gateway.
  - Private subnets route `0.0.0.0/0` to their AZ’s NAT Gateway (one-to-one mapping for high availability).

### Load Balancing & Compute

- Application Load Balancer spanning both public subnets.
- Target Group (HTTP on port 80).
- Listener: HTTP :80 forwarding to the Target Group.
- Launch Template for EC2 using the latest Amazon Linux 2 AMI via SSM Parameter `/aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2`. UserData should install and start a simple HTTP service responding on port 80 (e.g., `python3 -m http.server 80`).
- Auto Scaling Group in the private subnets with:
  - MinCapacity 2, DesiredCapacity 2, MaxCapacity 4
  - Health checks integrated with the Target Group

### Database

- An RDS instance (MySQL) deployed in the private tier:
  - Use a DBSubnetGroup covering the two private subnets.
  - Single-AZ is acceptable, but subnets must be private.
  - Store non-sensitive defaults via Parameters. Do not hardcode secrets; use a dummy default for username and reference a secret for the password.

### Security

- Security Groups:
  - ALB SG: allow inbound 80 from the internet; allow outbound to targets.
  - EC2 SG: allow inbound 80 only from the ALB SG; allow egress to the DB port.
  - RDS SG: allow inbound on the DB port only from the EC2 SG.
- No public IPs on instances in private subnets.

### Outputs

- Export at least the ALB DNS Name, VPC ID, PublicSubnet IDs, PrivateSubnet IDs, and RDS Endpoint.

### Conventions & Constraints

- Use intrinsic functions (`Ref`, `Fn::Sub`, `Fn::GetAtt`) appropriately; avoid hardcoded ARNs.
- Use SSM to resolve the Amazon Linux 2 AMI.
- Ensure the ALB’s Target Group type matches the instances (instance targets).
- Ensure route-table associations are correct and AZ-aware.
- Ensure all resources include the tag: `Environment: Production`.

## Deliverable

Only the final valid CloudFormation YAML document, starting with `AWSTemplateFormatVersion`, no comments or prose