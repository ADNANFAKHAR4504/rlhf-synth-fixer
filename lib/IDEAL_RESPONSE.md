# Ideal Response - Production VPC Infrastructure

This document describes the ideal implementation for the production VPC infrastructure task.

## Expected Implementation

The ideal solution creates a complete production VPC infrastructure with:

1. **VPC Configuration**
   - CIDR: 10.50.0.0/16
   - DNS hostnames and support enabled
   - Spans 3 availability zones: us-east-1a, us-east-1b, us-east-1c

2. **Subnet Configuration**
   - 3 public subnets: 10.50.1.0/24, 10.50.2.0/24, 10.50.3.0/24
   - 3 private subnets: 10.50.11.0/24, 10.50.12.0/24, 10.50.13.0/24
   - Each subnet in a different AZ for high availability

3. **NAT Instance Implementation**
   - 3 NAT instances (t3.micro) for cost optimization
   - One per public subnet
   - Source/destination check disabled
   - User data configures IP forwarding and iptables
   - Security group allows traffic from private subnets only

4. **Network ACLs**
   - Custom public NACL with explicit rules for HTTP/HTTPS/SSH/ephemeral ports
   - Custom private NACL allowing VPC internal traffic
   - Both with explicit inbound and outbound rules

5. **Routing**
   - 6 dedicated route tables (one per subnet)
   - Public subnets route 0.0.0.0/0 to Internet Gateway
   - Private subnets route 0.0.0.0/0 to NAT instances

6. **VPC Flow Logs**
   - CloudWatch Logs destination
   - 60-second aggregation interval
   - Captures all traffic (accepted and rejected)
   - IAM role with proper permissions

7. **VPC Endpoints**
   - S3 Gateway Endpoint for private subnet access
   - DynamoDB Gateway Endpoint for private subnet access

8. **Security and Compliance**
   - Security groups follow least-privilege (no 0.0.0.0/0)
   - All resources tagged: Environment, Team, CostCenter
   - Resource names include environmentSuffix

## Key Success Criteria

- All 8 constraints from task requirements implemented
- NAT instances (not NAT Gateways) for cost optimization
- 60-second flow log intervals
- Dedicated route tables per subnet
- Custom NACLs with explicit rules
- VPC endpoints in private subnets only
- All resources include environmentSuffix in names

## Testing Requirements

Unit tests should verify:
- VPC created with correct CIDR
- 3 public and 3 private subnets in correct AZs
- 3 NAT instances with source_dest_check=False
- Custom NACLs created and associated
- Flow logs with 60-second interval
- S3 and DynamoDB endpoints created
- All resources properly tagged
- Resource names include environment suffix
