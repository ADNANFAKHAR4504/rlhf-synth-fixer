# Security Configuration as Code

**Platform Transformation**: Originally CloudFormation YAML → Transformed to CDK JavaScript per platform enforcement

## Requirements

Design a CDK JavaScript implementation to set up a secure web application infrastructure on AWS. Transform the original CloudFormation requirements to CDK constructs while maintaining all security and infrastructure patterns.

### Core Requirements (Adapted for CDK):

1. **VPC Infrastructure**: Amazon VPC with appropriate subnets, route tables, and internet gateway
2. **Auto Scaling Web Servers**: EC2 instances configured as web servers in a public subnet, using Auto Scaling group for high availability
3. **Load Balancing**: Application Load Balancer (ALB) to distribute incoming traffic to the EC2 instances
4. **Security Groups**: Security group that allows inbound HTTP and HTTPS traffic to the ALB
5. **Latest AMI**: Ensure all EC2 instances are launched with the latest generation Amazon Linux AMI available in the region

### Expected Output:
- Valid CDK JavaScript files implementing the secure web application infrastructure
- Configuration should be deployable using CDK with `cdk deploy` command
- Must pass CDK synthesis and deployment validation
- Follow CDK best practices for security and availability

### Security Best Practices:
- Use CDK constructs that implement security by default
- Apply least privilege principles in IAM roles
- Implement proper resource tagging
- Use CDK removal policies appropriately
- Follow AWS Well-Architected Framework principles

### Architecture Focus:
The solution should demonstrate:
- Scalable and highly available web application deployment
- Proper network segmentation and security controls
- Modern cloud-native patterns using CDK constructs
- Infrastructure as Code best practices

### Deployment Region:
Target deployment region: us-east-1