# Secure Multi-Tier Infrastructure using AWS CDK JavaScript

I need help creating a secure multi-tier infrastructure deployment using AWS CDK JavaScript (.mjs files). This infrastructure needs to follow enterprise security best practices and meet compliance requirements for a highly regulated application in the us-east-1 region.

## Network Architecture Requirements

Create a VPC with proper network segmentation:
- At least two public subnets in different Availability Zones  
- At least two private subnets in different Availability Zones
- Implement network segmentation policies for security isolation
- Configure proper routing and NAT gateways for private subnet internet access

## Security Access Requirements  

Deploy a bastion host for secure access:
- Place bastion host in one of the public subnets
- Configure security groups with minimal required access
- Enable secure SSH access to private subnet resources
- Follow principle of least privilege for all access controls

## Storage Security

All S3 buckets must have:
- Server-side encryption enabled by default
- Appropriate bucket policies and access controls
- Public access blocked by default
- Secure configuration following AWS best practices

## IAM Security

Implement strict IAM controls:
- Apply IAM roles to all EC2 instances and services
- Follow principle of least privilege for all policies  
- No hardcoded credentials anywhere in the infrastructure
- Avoid overly permissive policies

## Monitoring and Alerting

Set up comprehensive monitoring:
- CloudWatch alarms for EC2 instance CPU utilization
- SNS notifications when CPU usage exceeds 80%
- Use CloudWatch Network Synthetic Monitor for proactive network connectivity monitoring between VPCs
- Implement comprehensive logging for security audit purposes
- Consider using AWS Shield for enhanced network security analysis

## Compliance and Best Practices

Ensure all resources:
- Are confined within the us-east-1 region
- Follow company naming conventions  
- Implement proper network segmentation policies
- Apply appropriate resource tagging for governance
- Use AWS Certificate Manager for SSL/TLS certificates where applicable

Please provide infrastructure code using CDK JavaScript with .mjs file extensions. Include one code block per file, ensuring the code can be directly copied and pasted. The main stack should be in tap-stack.mjs and work with the existing bin/tap.mjs entry point.