Hey team,

We're building out a hub-and-spoke network architecture for a financial services company that's expanding their AWS footprint. They need a solid foundation that allows multiple workloads to communicate in a controlled way while maintaining strict security boundaries. The business is starting in us-east-2 and planning to expand to eu-west-1 and ap-southeast-1 later, so we need an architecture that scales.

The key challenge here is they want isolated workload environments that can still reach shared services and the internet, but they absolutely cannot have spoke-to-spoke traffic. Think of it like a wheel - everything goes through the hub, but the spokes don't talk to each other directly. This gives them the segmentation they need for compliance while keeping management centralized.

I've been asked to implement this using **CloudFormation with YAML** since that's what their ops team is standardized on. They want everything defined declaratively so they can version control it and replicate the pattern across regions.

## What we need to build

Create a hub-and-spoke network infrastructure using **CloudFormation with YAML** that provides centralized routing and controlled inter-VPC communication through AWS Transit Gateway.

### Core Network Infrastructure

1. **Hub VPC Architecture**
   - Create hub VPC with CIDR 10.0.0.0/16
   - Deploy 3 public subnets across different availability zones
   - Each subnet should be /24 for shared services
   - Include Internet Gateway for public internet access
   - Set up NAT Gateways in each public subnet for spoke internet access

2. **Spoke VPC Architecture**
   - Create first spoke VPC with CIDR 10.1.0.0/16
   - Create second spoke VPC with CIDR 10.2.0.0/16
   - Each spoke VPC must have exactly 3 private subnets across different AZs
   - Each subnet should be /24 CIDR blocks
   - No direct internet access from spokes

3. **Transit Gateway Configuration**
   - Deploy AWS Transit Gateway as central routing hub
   - Attach all three VPCs to the Transit Gateway
   - Configure Transit Gateway route tables to allow hub-to-spoke communication
   - Prevent spoke-to-spoke traffic through route table isolation
   - Ensure proper route propagation for centralized internet access

### Security and Access Control

4. **Security Groups**
   - Create security group allowing HTTPS on port 443 between all VPCs
   - Create security group allowing SSH on port 22 from hub to spokes only
   - No SSH access between spokes
   - Proper ingress and egress rules for Transit Gateway traffic

5. **VPC Endpoints for Management**
   - Create VPC endpoints for Systems Manager in each VPC
   - Create VPC endpoints for SSM Messages in each VPC
   - Create VPC endpoints for EC2 Messages in each VPC
   - This avoids internet-bound management traffic and keeps it private

### Monitoring and Compliance

6. **VPC Flow Logs**
   - Set up VPC Flow Logs for all three VPCs
   - Store logs in a centralized S3 bucket
   - Use Parquet format for efficient querying
   - Enable logging for both accepted and rejected traffic

### Technical Requirements

- All infrastructure defined using **CloudFormation with YAML**
- Use **AWS Transit Gateway** for inter-VPC routing instead of VPC peering
- Use **EC2 VPC** resources for VPC creation
- Use **EC2 Subnets** for network segmentation
- Use **Transit Gateway Attachments** to connect VPCs
- Use **Transit Gateway Route Tables** for hub-spoke routing control
- Use **VPC Endpoints** for Systems Manager access
- Use **S3** for Flow Logs storage
- Use **NAT Gateway** for outbound internet access from spokes
- Names must include **environmentSuffix** parameter for uniqueness
- Follow naming convention: resource-type-environment-suffix
- Deploy to **us-east-2** region

### Deployment Requirements - Must Follow

- All resources must include the environmentSuffix parameter for multi-environment support
- All resources must be destroyable with DeletionPolicy: Delete
- No Retain policies allowed - this enables clean teardown for testing
- Proper IAM roles and permissions for VPC Flow Logs
- Route tables must be properly configured for Transit Gateway routing
- Security groups must reference VPC CIDRs correctly

### Constraints

- Transit Gateway routing must prevent direct spoke-to-spoke communication
- Each spoke VPC must have exactly 3 subnets across different AZs
- All subnets must use /24 CIDR blocks
- SSM endpoints required in each VPC to avoid internet-bound management traffic
- Flow Logs must use Parquet format for efficient storage and querying
- All resources must have Environment, CostCenter, and DataClassification tags
- Export all critical networking identifiers using CloudFormation Outputs

## Success Criteria

- **Functionality**: Hub VPC routes traffic to spokes through Transit Gateway
- **Functionality**: Spokes can reach internet through hub NAT Gateways
- **Functionality**: Spokes cannot communicate directly with each other
- **Security**: VPC endpoints enable private Systems Manager access
- **Monitoring**: Flow Logs capture all network traffic to S3 in Parquet format
- **Compliance**: All resources properly tagged with required metadata
- **Naming**: All resources include environmentSuffix for uniqueness
- **Code Quality**: Clean CloudFormation YAML, well-structured, fully documented
- **Outputs**: Export VPC IDs, subnet IDs, Transit Gateway ID, route table IDs

## What to deliver

- Complete CloudFormation YAML implementation in lib/TapStack.yml
- Hub VPC with 3 public subnets and NAT Gateways
- Two spoke VPCs with 3 private subnets each
- Transit Gateway with proper route table configuration
- VPC endpoints for Systems Manager in all VPCs
- VPC Flow Logs writing to S3 in Parquet format
- Security groups for HTTPS and SSH access control
- CloudFormation Outputs for all critical resource identifiers
- Proper tagging and naming conventions throughout
- Documentation of architecture and deployment process
