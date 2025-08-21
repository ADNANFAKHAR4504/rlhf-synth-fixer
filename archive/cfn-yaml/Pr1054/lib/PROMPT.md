## Task Overview

You are an expert AWS Cloud Infrastructure engineer tasked with creating a comprehensive, secure CloudFormation YAML template. This template must implement multiple layers of security, compliance, and operational best practices using AWS services.

## Primary Objective

Generate a complete CloudFormation YAML template named `secure-environment.yaml` that establishes a secure AWS environment with strict adherence to security principles and AWS best practices.

## Technical Requirements

## Regional Constraints

*   Deployment Region: All resources must be deployed exclusively in the `us-east-1` region
    
*   Regional Compliance: Ensure all resource configurations are compatible with us-east-1 availability zones
    

## Security Requirements

*   IAM Security: Implement IAM roles and policies following the principle of least privilege
    
*   Data Encryption: Enable server-side encryption for all data storage services
    
*   Network Security: Configure proper VPC isolation with security groups restricting access
    
*   Audit Compliance: Implement comprehensive logging and monitoring for all API activities
    

## Infrastructure Components

## Network Architecture

*   VPC Design: Create a Virtual Private Cloud with proper CIDR allocation
    
*   Subnet Isolation: Deploy at least one public subnet and one private subnet across multiple availability zones
    
*   Network Security: Configure security groups and NACLs for defense in depth
    

## Storage Services

*   S3 Configuration: Deploy S3 bucket with mandatory server-side encryption enabled
    
*   Data Protection: Implement bucket policies preventing unauthorized access
    
*   Versioning: Enable versioning for data protection and compliance
    

## Database Services

*   RDS Configuration: Deploy RDS database instance with security best practices
    
*   Automatic Updates: Enable automatic minor version upgrades for security patches
    
*   Backup Strategy: Configure automated backups and point-in-time recovery
    
*   Network Isolation: Deploy database in private subnets only
    

## Monitoring and Compliance

*   CloudTrail Setup: Configure CloudTrail to log all API calls across the AWS account
    
*   Log Storage: Ensure CloudTrail logs are stored securely with proper retention
    
*   Monitoring: Implement CloudWatch for operational monitoring
    

## Template Structure Requirements
```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: ''
Parameters:
  # Environment and configuration parameters
Conditions:
  # Conditional logic for resource creation
Resources:
  # All infrastructure components defined here
Outputs:
  # Key resource identifiers and endpoints
```

## Implementation Guidelines

## Security Best Practices

1.  Principle of Least Privilege: Every IAM role should have minimal required permissions
    
2.  Defense in Depth: Implement multiple security layers (VPC, Security Groups, IAM, encryption)
    
3.  Audit Trail: Enable comprehensive logging with CloudTrail for all API activities
    
4.  Data Protection: Encrypt all data at rest and in transit
    
5.  Network Segmentation: Proper subnet isolation between public and private resources
    

## Operational Excellence

1.  Resource Tagging: Implement consistent tagging strategy for cost management and organization
    
2.  Parameterization: Use CloudFormation parameters for configurable values
    
3.  Validation: Ensure template passes AWS CloudFormation validation checks
    
4.  Documentation: Include clear descriptions for all resources and configurations
    

## Compliance and Governance

1.  Regional Compliance: All resources must be created in us-east-1 region only
    
2.  Security Standards: Follow AWS Well-Architected Framework security pillar
    
3.  Change Management: Use CloudFormation features like DependsOn and proper resource ordering
    
4.  Error Handling: Implement proper rollback policies and resource dependencies
    

## Deliverable Specifications

## Template Requirements

*   Format: YAML syntax with proper indentation and structure
    
*   Filename: `secure-environment.yaml`
    
*   Validation: Must pass `aws cloudformation validate-template` command
    
*   Completeness: Include all required resources with proper configuration
    

## Resource Naming Convention

*   Use consistent naming pattern: `{Environment}-{Service}-{Purpose}`
    
*   Include stack name references where appropriate
    
*   Ensure names are descriptive and follow AWS naming standards
    

## Expected Resources

1.  VPC with proper CIDR allocation
    
2.  Subnets (public and private) across multiple AZs
    
3.  Internet Gateway and NAT Gateway for connectivity
    
4.  Security Groups with least privilege access rules
    
5.  IAM Roles with minimal required permissions
    
6.  S3 Bucket with server-side encryption
    
7.  RDS Instance with automatic minor version upgrades
    
8.  CloudTrail with comprehensive API logging
    
9.  Route Tables with proper routing configuration
    
10.  CloudWatch resources for monitoring
    

## Success Criteria

Your CloudFormation template must:

1.  Deploy successfully in us-east-1 region without errors
    
2.  Pass AWS CloudFormation validation checks
    
3.  Implement all security requirements as specified
    
4.  Follow AWS best practices and Well-Architected principles
    
5.  Include proper resource tagging and organization
    
6.  Demonstrate comprehensive understanding of AWS security controls
    
7.  Enable automatic minor version upgrades for RDS
    
8.  Configure CloudTrail logging for all API calls
    
9.  Implement server-side encryption for S3 bucket
    
10.  Establish proper VPC isolation with public/private subnet architecture
    

## Constraints and Limitations

*   Region Lock: us-east-1 region only - no cross-region resources
    
*   Security First: Security controls take precedence over convenience
    
*   Compliance Mandatory: All audit and logging requirements must be implemented
    
*   Template Validation: Must pass CloudFormation validation without warnings
    
*   Resource Optimization: Avoid unnecessary resources while meeting all requirements
    

Generate a production-ready CloudFormation YAML template that fully addresses all requirements and demonstrates expert-level understanding of AWS security and infrastructure management principles.