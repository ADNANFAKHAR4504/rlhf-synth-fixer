# AWS CloudFormation CDK Python Infrastructure Setup

## Project Overview

As an expert AWS cloud infrastructure engineer in your organization, you are tasked with designing and implementing a complete cloud infrastructure solution using AWS CDK in Python. This infrastructure will support a web application deployment with comprehensive monitoring, security, and content delivery capabilities. The solution should be production ready, following AWS best practices for security, cost optimization, and operational excellence. You have to consider the following:

#### 1. Project Setup

**Initialize your AWS CDK infrastructure with the following specifications:**
- Create a new CDK infrasture using Python as the programming language.
- Configure the infrastructure to target the `us-west-2` AWS region.
- Ensure all CloudFormation templates will deploy to this region.
- Set up proper project structure with clear separation of concerns, stack definitions, constructs, and configurations.

#### 2. Resource Tagging Strategy

**Implement a comprehensive tagging mechanism where:**
- Every single AWS resource created must include the tag `Project: CloudMigration`
- Tags should be applied at the stack level to ensure inheritance.
- Consider implementing a tagging aspect to enforce this requirement programmatically.
- Ensure tags are visible in AWS Cost Explorer and resource group.

#### 3. Network Architecture

**Create a Virtual Private Cloud (VPC) with the following specifications:**

**VPC Configuration:**
- The VPC should have CIDR block with 10.0.0.0/16
- Enable DNS hostnames and DNS resolution
- Implement proper network segmentation

**Subnet Architecture:**
- **Public Subnet:**
  - Configure with a CIDR block that allows sufficient IP addresses
  - Associate with a route table that has a route to an Internet Gateway
  - Enable auto-assign public IPv4 addresses
  - Place in a specific availability zone for predictability

- **Private Subnet:**
  - Configure with a non-overlapping CIDR block
  - Ensure no direct internet access. No IGW route
  - Consider future use case of deploying database servers, backend services into it.
  - Place in the same or different availability zone based on requirements.

**Internet Gateway:**
- Create and attach an Internet Gateway to the VPC
- Ensure proper routing configuration for the public subnet

#### 4. Compute Infrastructure

**EC2 Instance Deployment:**
- Deploy an EC2 instance in the public subnet with these specifications:
  - Instance type should be parameterized but default to `t3.micro`
  - Use the latest Ubuntu AMI
  - Configure the instance with a public IP address
  - Implement proper instance metadata service v2 configuration for security

**User Data Script Requirements:**
- Create a user data script that:
  - Updates the system packages
  - Installs Apache HTTP Server (httpd/apache2)
  - Starts and enables the Apache service
  - Creates a custom index.html page displaying instance information
  - Configures Apache to write logs to a specific directory
  - Installs and configures the CloudWatch agent for custom metrics
  - Sets up log rotation to prevent disk space issues

#### 5. Security Configuration

**Security Group Design:**
- **Web Traffic Security Group:**
  - Allow inbound HTTP (port 80) from anywhere (0.0.0.0/0)
  - Allow inbound HTTPS (port 443) from anywhere for future TLS implementation
  - Configure outbound rules to allow necessary traffic like S3 access

- **SSH Access Security Group:**
  - Restrict SSH (port 22) access to only the IP address `192.168.1.1/32`
  - Implement description fields for all rules for documentation
  - Consider implementing time-based access controls.

**IAM Role and Policies:**
- Create an IAM role for the EC2 instance with:
  - Trust relationship allowing EC2 service to assume the role
  - Managed policy for CloudWatch agent operations
  - Custom policy for S3 bucket write access following the least privilege principle.
  - Permissions to publish custom CloudWatch metrics

#### 6. Storage and Logging Infrastructure

**S3 Bucket Configuration:**
- Create an S3 bucket with this name `cloudmigration-s3`
- **Enable the following features:**
  - Versioning for data integrity and recovery
  - Server-side encryption (SSE-S3 or SSE-KMS)
  - Access logging to a separate logging bucket or prefix
  - Lifecycle policies for log rotation and archival
  - Block all public access settings

**Log Management:**
- Configure Apache logs to be periodically uploaded to S3
- Implement log rotation on the EC2 instance
- Set up S3 lifecycle policies to transition old logs to cheaper storage classes
- Implement AWS Systems Manager for log collection

#### 7. Content Delivery Network

**CloudFront Distribution Setup:**
- Create a CloudFront distribution with the S3 bucket as origin
- **Configure the following:**
  - Origin Access Identity (OAI) or Origin Access Control (OAC) for secure S3 access
  - Appropriate cache behaviors for different content types
  - Custom error pages for better user experience
  - AWS WAF integration for additional security
  - Compression settings for bandwidth optimization
  - Logging to S3 for CloudFront access logs

#### 8. Monitoring and Alerting

**CloudWatch Configuration:**
- **Standard Metrics:**
  - Enable detailed monitoring for the EC2 instance
  - Set up dashboards for visualization

- **Custom Metrics:**
  - Implement memory usage monitoring using CloudWatch agent
  - Configure disk usage monitoring
  - Set up Apache-specific metrics like requests per second,and response times
  - Create custom metric filters for log analysis

**SNS Alerting System:**
- Create an SNS topic for infrastructure alerts
- **Configure CloudWatch Alarms for:**
  - EC2 instance state changes with stopped, terminated
  - High CPU utilization with threshold: 80%
  - High memory usage with threshold: 90%
  - Low disk space with threshold: 20% free
  - Apache service health checks
  - S3 bucket size or request anomalies

#### 9. Stack Parameterization

**Implement CloudFormation parameters for:**
- EC2 instance type with allowed values and default to `t3.micro`
- SSH key pair name with `cloudmigration-cdkpy-task`
- Allowed SSH IP address with default to `192.168.1.1`
- S3 bucket name prefix
- SNS email endpoint for notifications
- Apache configuration parameters
- CloudWatch alarm thresholds

**Parameter Validation:**
- Implement proper parameter constraints
- Use allowed values where applicable
- Provide meaningful parameter descriptions
- Set appropriate default values

### 10. Stack Configuration and Management

**CloudFormation Stack Settings:**
- Configure stack rollback settings to maintain maximum of 2 rollback configurations
- Implement stack termination protection for production deployments
- Set up proper stack dependencies and creation order
- Configure stack update policies for zero-downtime deployments

#### 11. Output Values

**Define CloudFormation outputs for:**
- EC2 Instance ID
- EC2 Instance Public IP Address
- EC2 Instance Public DNS
- S3 Bucket Name
- S3 Bucket ARN
- CloudFront Distribution Domain Name
- CloudFront Distribution ID
- SNS Topic ARN
- VPC ID
- Public Subnet ID
- Private Subnet ID
- Security Group IDs
- IAM Role ARN
- CloudWatch Dashboard URL

#### 12. Best Practices
Consider implementing these best practices:

**Security Best Practices:**
- Implement least privilege access principles
- Use managed AWS services where possible
- Enable encryption at rest and in transit
- Implement proper secret management
- Use Systems Manager Parameter Store or Secrets Manager for sensitive data
- Enable VPC Flow Logs for network monitoring
- Implement AWS Config rules for compliance checking

**Cost Optimization:**
- Use appropriate instance sizing
- Implement auto-shutdown for non-production environments
- Set up budget alerts
- Use S3 lifecycle policies for cost-effective storage
- Implement CloudWatch log retention policies
- Consider Spot instances for non-critical workloads

**Operational Excellence:**
- Implement comprehensive logging and monitoring
- Create runbooks for common operations
- Set up automated backups where applicable
- Implement infrastructure testing
- Use AWS Systems Manager for patch management

#### 13. CDK Application Structure

**Organize your code with:**
- Make sure your code is in one single file
- Reusable constructs for common patterns
- Configuration files for environment-specific settings
- Requirements file with all dependencies


#### 15. Documentation Requirements

**Include in your code:**
- Comprehensive docstrings for all classes and methods
- Inline comments for complex logic
- Architecture diagram as code comments
- Deployment guide with prerequisites
- Troubleshooting section for common issues
- Security considerations and compliance notes


- Ensure idempotency of your deployment
- Handle edge cases and potential failures gracefully
- Consider future scalability requirements
- Implement proper resource naming conventions
- Ensure compliance with AWS service limits

This infrastructure should serve as a foundation for a production-ready web application deployment with enterprise-grade security, monitoring, and content delivery capabilities.