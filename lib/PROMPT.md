# AWS CloudFormation Infrastructure as Code Challenge

## Objective

You are an AWS Cloud Engineer tasked with provisioning a secure, development-ready web hosting environment using AWS CloudFormation. Your solution must demonstrate best practices for cloud infrastructure, security, and operational monitoring.

## Requirements

### Networking Infrastructure

- **VPC**: Define a new Virtual Private Cloud with appropriate CIDR block like 10.0.0.0/16
- **Multi-AZ Design**: Create at least two public subnets, each in a different Availability Zone for high availability
- **Internet Gateway**: Ensure proper internet connectivity for public resources
- **Route Tables**: Configure routing for public subnet access to the internet

### Security Configuration

- **Security Groups**:
  - Allow inbound HTTP traffic on port 80 from anywhere via 0.0.0.0/0
  - Allow inbound SSH traffic on port 22 from a specified CIDR/IP range that should be parameterized
  - Apply principle of least privilege
- **Key Pair**: Use parameterized EC2 key pair for secure access
- **Network ACLs**: Consider additional network-level security if needed

### Compute Resources

- **EC2 Instance**:
  - Launch at least one EC2 instance with a public IP address
  - Use latest Amazon Linux 2 or Amazon Linux 2023 AMI
  - Instance type should be t2.micro or t3.micro for cost-effectiveness
  - Deploy in one of the public subnets
  - Associate with appropriate security group and IAM role

### Storage & Data Management

- **S3 Bucket**:
  - Provision with versioning enabled
  - Enable server-side encryption using AES-256 or KMS
  - Apply appropriate bucket policies
  - Use unique naming convention

### Access Management and IAM

- **IAM Role**: Create EC2 service role with necessary permissions
- **IAM Policies**: Define least-privilege policies for S3 bucket access. The EC2 instance should only be able to perform specific S3 actions like s3:GetObject and s3:PutObject on the designated bucket - not broad permissions like s3:* on all resources
- **Instance Profile**: Attach IAM role to EC2 instance for secure API access without hardcoded credentials

### Monitoring & Alerting

- **CloudWatch Monitoring**: Enable detailed monitoring for EC2 instance
- **Custom Alarms**:
  - Configure alarm for CPU utilization exceeding 70% over 5-minute period
  - Include appropriate alarm actions and notifications
- **Logs**: Consider CloudWatch Logs for application monitoring

### Resource Organization

- **Tagging Strategy**:
  - Tag ALL resources with Environment: Development
  - Add additional tags for cost allocation and management
- **Naming Convention**:
  - Use consistent naming pattern: ResourceType-Environment-UniqueId
  - Like VPC-Development-001 or EC2-Development-WebServer

### Template Outputs

Provide the following outputs for integration and reference:

- **VPC ID**: Reference to the created VPC
- **Subnet IDs**: References to all created subnets
- **EC2 Instance Public IP**: For direct access and testing
- **S3 Bucket Name**: For application integration
- **Security Group ID**: For potential additional resources

## Validation Requirements

### Template Validation

- Template must be syntactically valid YAML
- Must pass aws cloudformation validate-template command
- Must deploy successfully without errors
- All dependencies and references must be correct

### Testing Criteria

- EC2 instance must be accessible via SSH and HTTP
- S3 bucket must be functional with proper permissions
- CloudWatch alarm must trigger appropriately when CPU exceeds threshold
- All security groups must function as intended
- Resource tagging must be consistent and complete

## Technical Constraints

### Regional Requirements

- **Primary Region**: us-east-1 unless otherwise specified
- **Availability Zones**: Use dynamic AZ selection with !GetAZs function
- Consider cross-AZ redundancy for critical components

### Best Practices

- **Security**: Implement defense in depth with multiple security layers
- **Cost Optimization**: Use appropriate instance sizes and storage classes
- **Reliability**: Design for fault tolerance where applicable
- **Performance**: Optimize for expected workload
- **Operational Excellence**: Include monitoring and logging

### Parameters & Flexibility

Use CloudFormation Parameters for:

- SSH allowed IP/CIDR range
- Unique resource identifiers
- Instance type with appropriate defaults
- Environment designation
- Key pair name

## Deliverables

1. **Complete CloudFormation Template** in YAML format
2. **Parameter Documentation** explaining each configurable value
3. **Resource Dependency Map** showing relationships between resources
4. **Security Considerations** document outlining implemented protections
5. **Deployment Instructions** with validation steps

## Success Criteria

Your solution will be evaluated on:

- Functional completeness - all requirements met
- Security implementation - least privilege, proper isolation
- Code quality - readable, maintainable, well-documented
- Best practices adherence - AWS Well-Architected principles
- Operational readiness - monitoring, alerting, logging

## How Services Connect

The infrastructure creates an integrated system where:

- The VPC provides network isolation and contains public subnets across multiple availability zones
- The Internet Gateway attaches to the VPC and enables outbound internet access through route tables
- EC2 instances launch in public subnets and receive public IPs for direct internet access
- Security groups control inbound traffic to EC2 instances by filtering HTTP and SSH connections
- The IAM role attaches to EC2 instances via instance profile, granting them permissions to interact with the S3 bucket
- EC2 instances use the IAM role to authenticate API calls to S3 for storing and retrieving objects
- CloudWatch monitoring collects metrics from EC2 instances and triggers alarms when CPU utilization crosses defined thresholds
- S3 bucket policies work together with IAM roles to enforce access controls and encryption requirements
