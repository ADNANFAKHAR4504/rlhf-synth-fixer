Build a Service Discovery System with AWS CDK

Need to create a comprehensive AWS CDK application using JavaScript for a service discovery system. This should be a single stack that enables services in a VPC to find and communicate with each other securely.

The scenario is building infrastructure for a microservices application in one AWS region. Services like order processing and user authentication need to discover private endpoints of other internal APIs within the VPC. Everything should be secure with traffic on private AWS backbone and sensitive data encrypted.

Infrastructure Requirements:

CDK App Configuration
- Read context values: appName (string for resource naming), vpcCidrBlock (CIDR for VPC), enableHttps (boolean flag, default false), domainName (string for domain when HTTPS enabled, default null)

Security Foundation  
- AWS Managed KMS Key for encrypting sensitive data and logs
- Parameter Store entry as SecureString encrypted with the KMS Key

VPC and Private Networking
- VPC with two public and two private subnets across two AZs
- VPC Flow Logs delivered to encrypted S3 bucket  
- Default network ACL for VPC with restrictive rules

Service and Load Balancing
- Internal ALB in private subnets with HTTP listener on port 80
- If enableHttps is true: create ACM certificate for domain, handle DNS validation, add HTTPS listener on port 443
- If enableHttps is false: skip HTTPS listener and certificate
- ALB access logging to encrypted S3 bucket

Service Discovery with AWS Cloud Map
- Private DNS namespace associated with VPC
- Cloud Map service in the namespace 
- Register ALB DNS name as instance in Cloud Map service
- Health checks configured to target ALB for automatic removal of unhealthy instances

IAM Roles
- IAM Role for service instances with least privilege permissions to read the specific SecureString from Parameter Store

Output: Complete AWS CDK project for JavaScript with proper structure.
