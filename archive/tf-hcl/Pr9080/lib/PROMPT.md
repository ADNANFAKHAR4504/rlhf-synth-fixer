# AWS Infrastructure Setup with Terraform

## Overview
We need to build a production-ready AWS environment that can handle high traffic loads while maintaining security and reliability. This infrastructure should follow AWS best practices and be designed for scalability from day one.

## Infrastructure Requirements

### Network Foundation
- **VPC Setup**: Create a Virtual Private Cloud with proper CIDR block allocation
- **Subnet Strategy**: Deploy 2 public subnets and 2 private subnets across different Availability Zones for redundancy
- **Internet Connectivity**: Configure Internet Gateway for public subnets to enable outbound internet access
- **Private Network Access**: Set up NAT Gateways in each private subnet with dedicated Elastic IPs for secure outbound connectivity

### Compute Layer
- **EC2 Instances**: Deploy instances in private subnets using a specific AMI ID 
- **Instance Types**: Use the latest generation instance types for optimal performance and cost efficiency
- **Auto Scaling**: Implement CPU-based auto scaling policies to handle traffic spikes and maintain performance
- **Load Distribution**: Configure an Application Load Balancer to distribute incoming traffic across healthy instances

### Security Implementation
- **Security Groups**: Define comprehensive security group rules allowing HTTP and HTTPS traffic to public-facing resources
- **Network ACLs**: Implement network-level access controls for additional security layers
- **Private Subnet Isolation**: Ensure private subnets cannot be directly accessed from the internet

### Resource Management
- **Tagging Strategy**: Apply consistent tagging across all resources with name and environment labels for cost tracking and resource management
- **Output Configuration**: Generate outputs for VPC ID and EC2 instance IDs for integration with other systems

## Technical Specifications

### Region and Availability
- **Primary Region**: us-east-1
- **Availability Zones**: Distribute resources across at least 2 AZs for high availability
- **Cross-AZ Redundancy**: Ensure no single point of failure in the architecture

### Performance Requirements
- **Auto Scaling Triggers**: CPU utilization thresholds for scaling up and down
- **Load Balancer Health Checks**: Configure appropriate health check intervals and thresholds
- **Instance Distribution**: Ensure even distribution of instances across availability zones

### Security Considerations
- **Principle of Least Privilege**: Only allow necessary network access
- **Encryption**: Enable encryption in transit and at rest where applicable
- **Monitoring**: Set up basic monitoring and alerting capabilities

## Deliverables
- **Single Terraform File**: All infrastructure code should be contained in one `tap_stack.tf` file
- **Variable Definitions**: Use variables for configurable values like AMI IDs, instance types, and CIDR blocks
- **Output Section**: Include outputs for key resource identifiers
- **Documentation**: Add comments explaining complex configurations and architectural decisions

## Success Criteria
- Infrastructure deploys successfully without errors
- All resources are properly tagged and organized
- Auto scaling responds to CPU load changes
- Load balancer distributes traffic correctly
- Security groups allow appropriate access while blocking unauthorized traffic
- Resources are distributed across multiple availability zones for redundancy

## Notes
- Consider cost optimization strategies while maintaining performance requirements
- Ensure the infrastructure can be easily modified and scaled in the future
- Follow Terraform best practices for state management and resource naming
- Include proper error handling and validation for critical parameters
