# Terraform Infrastructure Setup: Secure AWS VPC with Network Access Controls

## Project Overview
You are tasked with designing and implementing a secure, production-ready AWS infrastructure using Terraform. This environment will serve as the foundation for our organization's cloud-based applications and services, requiring robust security measures and compliance with AWS best practices.

## Infrastructure Requirements

### Network Architecture
Create a comprehensive AWS VPC with the following subnet structure:
- **3 Public Subnets**: Strategically distributed across multiple availability zones for high availability
- **1 Private Subnet**: Isolated from direct internet access for sensitive workloads
- **Proper naming conventions**: Follow organizational standards for resource naming

### Security Implementation
Implement network access controls using AWS Security Groups with the following specifications:
- **Restrictive inbound rules**: Limit incoming traffic to specific IP ranges only
- **Controlled outbound traffic**: Define and restrict outbound connections
- **Least privilege principle**: Grant only necessary network access
- **Documentation**: Clearly document the purpose and scope of each security group rule

### Resource Tagging Strategy
All AWS resources must be tagged consistently with:
- **Environment = Production**: Primary environment identifier
- **Additional tags**: Consider adding tags for cost allocation, ownership, and compliance

### Compliance and Best Practices
Ensure the infrastructure adheres to:
- **AWS Well-Architected Framework**: Follow security, reliability, and operational excellence pillars
- **Security best practices**: Implement proper network segmentation and access controls
- **Terraform best practices**: Use proper state management, variable definitions, and module structure
- **Documentation standards**: Include comprehensive comments and README files

## Technical Constraints
- **Terraform only**: All infrastructure must be defined using Terraform
- **Security Groups**: Must be the primary mechanism for network access control
- **IP-based restrictions**: Implement specific IP range restrictions for security
- **Production readiness**: Infrastructure must be suitable for production workloads

## Expected Deliverables
1. **Complete Terraform configuration**: All necessary .tf files for the infrastructure
2. **Security group definitions**: Properly configured security groups with documented rules
3. **Tagging implementation**: Consistent resource tagging across all components
4. **Documentation**: Clear explanations of the architecture and security measures
5. **Validation**: Terraform plan and apply should execute without errors

## Success Criteria
- Terraform deployment completes successfully without errors
- Network access controls function as specified
- All resources are properly tagged with Environment = Production
- Infrastructure follows AWS security best practices
- Configuration is maintainable and well-documented
