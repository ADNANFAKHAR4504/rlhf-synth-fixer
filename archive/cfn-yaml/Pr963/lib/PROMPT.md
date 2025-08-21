## Context

You are an expert AWS Cloud Infrastructure engineer tasked with creating a comprehensive, secure, and resilient CloudFormation template. This template must implement multiple layers of security, operational monitoring, and high availability using AWS best practices.

## Task Requirements

Create a complete CloudFormation template that implements a secure AWS environment with the following mandatory components:

### Security Requirements
- **IAM Security**: Create IAM roles and policies following the principle of least privilege
- **Encryption**: Implement encryption for all data at rest using AWS KMS
- **Network Security**: Configure security groups allowing only HTTP (80) and HTTPS (443) traffic
- **Web Application Firewall**: Integrate AWS WAF for protection against common web exploits
- **S3 Security**: Secure S3 buckets with no public access by default
- **Database Security**: Deploy RDS instance in private subnet with proper isolation

### Infrastructure Requirements
- **High Availability**: Distribute resources across at least two availability zones (us-east-1a, us-east-1b)
- **Monitoring**: Configure CloudWatch for comprehensive logging and monitoring of all components
- **Key Management**: Use AWS KMS for encryption key management
- **Network Architecture**: Implement proper VPC design with public/private subnet separation

### Compliance Constraints
- Deploy in AWS us-east-1 region
- Follow AWS Well-Architected Framework principles
- Ensure IAM policies are attached only to groups and roles, never directly to users
- All infrastructure must be defined using CloudFormation YAML syntax
- Template must be production-ready and pass security validation tests

## Technical Specifications

### Required AWS Services
- **Compute**: EC2 instances with Auto Scaling capabilities
- **Database**: RDS MySQL/PostgreSQL in private subnet
- **Storage**: S3 buckets with proper encryption and access controls 
- **Security**: IAM, KMS, WAF, Security Groups, NACLs
- **Monitoring**: CloudWatch Logs, CloudWatch Metrics, CloudWatch Alarms
- **Networking**: VPC, Subnets, Route Tables, Internet Gateway, NAT Gateway

### Template Structure Requirements
```yaml
AWSTemplateFormatVersion: 2010-09-09
Description: Secure AWS Infrastructure - IaC AWS Nova Model Breaking
Parameters:
Environment and configuration parameters
Mappings:
Region and environment-specific configurations
Conditions:
Conditional logic for resource creation
Resources:
All infrastructure components defined here
Outputs:
Key resource identifiers and endpoints
```
## Implementation Guidelines

### Security Best Practices
1. **Principle of Least Privilege**: Every IAM role should have minimal required permissions
2. **Defense in Depth**: Implement multiple security layers (WAF, Security Groups, NACLs, encryption)
3. **Audit Trail**: Enable CloudTrail and detailed CloudWatch logging
4. **Data Protection**: Encrypt all data at rest and in transit
5. **Network Segmentation**: Proper subnet isolation between public and private resources

### Operational Excellence
1. **Monitoring**: Comprehensive CloudWatch metrics and alarms
2. **Logging**: Centralized logging for all components
3. **Automation**: Use CloudFormation features like DependsOn, Ref, and GetAtt
4. **Tagging**: Consistent resource tagging for cost management and organization

### Reliability and Performance
1. **Multi-AZ**: All critical resources distributed across availability zones
2. **Auto Scaling**: Implement auto scaling for compute resources
3. **Health Checks**: Configure appropriate health checks and recovery mechanisms
4. **Resource Limits**: Set appropriate resource limits and quotas

## Expected Deliverable

A complete, production-ready CloudFormation YAML template that:
- Implements all security requirements
- Follows AWS best practices and Well-Architected principles
- Is deployable in us-east-1 region
- Passes CloudFormation validation
- Includes comprehensive resource tagging
- Provides meaningful outputs for integration
- Implements proper error handling and rollback policies

## Success Criteria

Your template must:
1. Deploy successfully without errors
2. Pass AWS Config security compliance checks
3. Demonstrate proper resource isolation and security controls
4. Show evidence of monitoring and logging capabilities
5. Prove high availability across multiple AZs
6. Validate encryption implementation for all data stores