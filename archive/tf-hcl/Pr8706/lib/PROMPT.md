# Production VPC Infrastructure with Transit Gateway

Hey team,

We're building the network foundation for a fintech startup's payment processing platform. They need a production-grade infrastructure that meets strict compliance requirements while enabling secure communication between microservices. The business has asked us to create this using **Terraform with HCL** to deploy in AWS us-east-1.

The core challenge here is building a highly available VPC architecture that spans multiple availability zones with proper network segmentation. We need public subnets for load balancers, private subnets for application workloads, and isolated database subnets with no internet access. The infrastructure must also support future multi-VPC connectivity through Transit Gateway with cross-region peering capabilities.

This isn't just about basic networking - we need deep packet inspection capabilities, controlled internet access through NAT Gateways in each AZ, and comprehensive traffic logging for compliance. All traffic patterns must be monitored and stored securely in S3 with lifecycle policies.

## What we need to build

Create a highly available VPC infrastructure with Transit Gateway connectivity using **Terraform with HCL** for a fintech payment processing platform in the us-east-1 region.

### Core Requirements

1. **VPC Foundation**
   - Create VPC with 10.0.0.0/16 CIDR block
   - Deploy across 3 availability zones in us-east-1
   - All resource names must include environmentSuffix parameter for uniqueness
   - Follow naming convention: resource-type-environment-suffix format

2. **Subnet Architecture**
   - Deploy 3 public subnets: 10.0.1.0/24, 10.0.2.0/24, 10.0.3.0/24
   - Deploy 3 private subnets: 10.0.11.0/24, 10.0.12.0/24, 10.0.13.0/24
   - Deploy 3 database subnets: 10.0.21.0/24, 10.0.22.0/24, 10.0.23.0/24
   - Each AZ must have exactly one subnet of each type
   - Use explicit subnet associations for all route tables

3. **Internet Connectivity**
   - Configure NAT Gateways in each public subnet with Elastic IPs
   - Deploy in high-availability mode across all 3 AZs
   - Provide outbound connectivity for private resources

4. **Transit Gateway**
   - Configure Transit Gateway with cross-region peering support
   - Set up Transit Gateway route tables with propagation disabled
   - Use specific route tables, not default associations

5. **VPC Endpoints**
   - Create VPC Endpoints for S3 using Gateway type
   - Create VPC Endpoints for DynamoDB using Gateway type
   - Enable private DNS for interface endpoints

6. **Network Security**
   - Implement Network ACLs allowing only HTTP/HTTPS/SSH from specific CIDRs
   - Explicitly deny all traffic except required protocols
   - Security group rules must use specific port ranges, no allow-all rules

7. **Traffic Logging**
   - Configure VPC Flow Logs capturing ALL traffic
   - Store logs in S3 bucket with SSE-S3 encryption
   - Implement 7-day lifecycle policy for log retention

### Technical Requirements

- All infrastructure defined using **Terraform with HCL**
- Use **aws_vpc** for VPC creation
- Use **aws_ec2_transit_gateway** for Transit Gateway
- Use **aws_nat_gateway** and **aws_eip** for NAT connectivity
- Use **aws_vpc_endpoint** for S3 and DynamoDB endpoints
- Use **aws_flow_log** for VPC Flow Logs
- Use **aws_network_acl** for network access control
- All names must include environmentSuffix variable for uniqueness
- Deploy to **us-east-1** region
- Terraform version 1.5+ with AWS provider 5.x required
- Use modular structure for better organization

### Deployment Requirements - CRITICAL

- All resources must be destroyable - NO Retain policies
- Use DESTROY removal policies or deletion protection disabled
- Deletion protection must be disabled for development iteration
- Include destroy-time provisioners for proper cleanup
- Ensure all dependencies are properly handled during terraform destroy

### Resource Tagging

All resources must use consistent tagging:
- Environment tag
- Project tag
- Owner tag

### Constraints

- VPC CIDR must be 10.0.0.0/16 with non-overlapping subnet allocations
- All route tables must use explicit subnet associations, no implicit associations
- Network ACLs must explicitly deny all traffic except required protocols
- Transit Gateway attachment must use specific route tables, not default
- No allow-all security group rules
- VPC Flow Logs must store in S3 with SSE-S3 encryption only

## Success Criteria

- **Functionality**: Complete VPC infrastructure deployed across 3 AZs with Transit Gateway
- **High Availability**: NAT Gateways deployed in all availability zones
- **Network Segmentation**: Proper isolation between public, private, and database subnets
- **Security**: Network ACLs and flow logs capturing all traffic
- **Compliance**: All traffic logged to S3 with encryption and lifecycle policies
- **Naming Convention**: All resources include environmentSuffix for uniqueness
- **Destroyability**: All resources can be destroyed without manual intervention

## What to deliver

- Complete Terraform HCL implementation with modular structure
- VPC with proper CIDR allocation and subnet configuration
- Transit Gateway with cross-region peering support
- NAT Gateways with Elastic IPs in all AZs
- VPC Endpoints for S3 and DynamoDB
- Network ACLs with explicit allow/deny rules
- VPC Flow Logs with S3 storage and lifecycle policy
- Output values for critical resource IDs including VPC ID, Transit Gateway ID, and subnet IDs
- Variables file for environmentSuffix and other configurable parameters
- Documentation explaining the architecture and deployment steps