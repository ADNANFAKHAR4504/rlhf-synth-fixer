# Infrastructure as Code Challenge: Secure Cloud Infrastructure with Pulumi Go

## Overview

You've been tasked with designing and deploying a comprehensive cloud infrastructure solution using Pulumi Go. This infrastructure needs to support a production application with strict security requirements and monitoring capabilities.

## Requirements

### Core Infrastructure Components

**1. Database Layer**
- Deploy an Amazon RDS instance (PostgreSQL recommended) in the us-east-1 region
- Configure automatic backups with a 7-day retention period
- Ensure the RDS instance is NOT publicly accessible
- Use a secure subnet configuration with proper security groups

**2. Storage Layer**
- Create multiple S3 buckets with the following specifications:
  - All buckets must have the prefix 'prod-' in their names
  - Enable server access logs on ALL buckets
  - Implement versioning on at least one bucket (recommend the main application data bucket)
  - Configure proper bucket policies and encryption
  - Set up lifecycle policies for cost optimization

**3. Security & Access Control**
- Implement IAM roles for EC2 instances to access S3 buckets (no hardcoded credentials)
- Create security groups with the suffix '-sg' following your naming convention
- Configure security groups to restrict traffic appropriately:
  - Database access only from application tier
  - Web traffic on standard ports (80, 443)
  - Administrative access on specific ports
- Set up Network ACLs (NACLs) for additional network security

**4. Monitoring & Observability**
- Deploy Amazon CloudWatch for comprehensive monitoring
- Set up monitoring for:
  - RDS instance metrics (CPU, memory, connections, storage)
  - EC2 instance metrics (CPU, memory, network, disk)
  - Custom application metrics
- Configure CloudWatch alarms for critical thresholds
- Set up CloudWatch dashboards for operational visibility

### Technical Constraints

**Pulumi Go Implementation**
- Use Pulumi Go SDK (not TypeScript or other languages)
- Structure the code with proper error handling
- Implement resource dependencies correctly
- Use Pulumi's configuration system for environment-specific values

**AWS Region & Naming**
- Deploy all resources in us-east-1 region
- Follow strict naming conventions:
  - S3 buckets: 'prod-' prefix
  - Security groups: '-sg' suffix
  - Use consistent tagging strategy
  - Implement proper resource naming patterns

**Security Requirements**
- RDS instance must be in private subnets
- No public access to database
- IAM roles with least privilege principle
- Encrypted storage for sensitive data
- Proper VPC configuration with public/private subnets

### Expected Outputs

The Pulumi stack must export the following information:
- RDS endpoint (for application configuration)
- S3 bucket names (for application access)
- Security group IDs (for reference)
- CloudWatch dashboard URLs
- IAM role ARNs (for EC2 instance profiles)

## Success Criteria

1. **Deployment Success**: All resources deploy without errors
2. **Security Compliance**: No publicly accessible sensitive resources
3. **Monitoring Setup**: CloudWatch monitoring active for all critical resources
4. **Access Control**: IAM roles properly configured for EC2-S3 access
5. **Naming Convention**: All resources follow specified naming patterns
6. **Output Validation**: Stack outputs provide all required resource information

## Additional Considerations

- Consider cost optimization strategies (reserved instances, lifecycle policies)
- Implement proper error handling and resource cleanup
- Document any assumptions about network architecture
- Consider disaster recovery aspects (backup strategies, multi-AZ deployment)
- Ensure the solution is scalable for future growth

## Deliverables

1. A single Pulumi Go file (`main.go`) containing the complete infrastructure definition
2. Proper resource tagging and naming
3. Comprehensive stack outputs
4. Documentation of any architectural decisions or assumptions

This infrastructure should be production-ready and follow AWS best practices for security, monitoring, and operational excellence.
