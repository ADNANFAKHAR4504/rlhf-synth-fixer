# Task: Security Configuration as Code - Pulumi Java Implementation

## Task ID: trainr317

## Original Task Description
You are tasked with securing a complex multi-region AWS infrastructure. The environment is multi-account, with VPCs deployed in us-east-1, eu-west-1, and ap-southeast-2.

## Implementation Requirements
Implement the following security configurations using **Pulumi with Java**:

1. **Resource Tagging**: All AWS resources must be tagged with 'Environment' and 'Owner'
2. **Data Encryption at Rest**: Encrypt data at rest using AWS KMS Customer Master Keys (CMKs)
3. **IAM Security**: Ensure that all IAM roles enforce MFA for console access
4. **Network Security**: Use Security Groups to manage network traffic
5. **CloudTrail Logging**: Enable logging of AWS management events with AWS CloudTrail
6. **Data in Transit**: Ensure all data in transit is encrypted using TLS
7. **GuardDuty**: Enable AWS GuardDuty in all regions
8. **SNS Notifications**: Set up automatic notifications for unauthorized API calls using AWS SNS
9. **VPC Flow Logs**: Implement VPC Flow Logs to capture network traffic insights
10. **S3 Security**: Block public access to all S3 buckets

## Platform Specification
- **IaC Tool**: Pulumi
- **Language**: Java
- **Target Cloud**: AWS
- **Regions**: us-east-1, eu-west-1, ap-southeast-2

## Deliverables
1. Complete Pulumi Java project following the exact structure from the example project
2. Main.java implementing all security requirements
3. Unit and integration tests
4. Pulumi.yaml configuration
5. All resources properly tagged and secured

## Constraints
- Must use Pulumi Java SDK
- Must implement all 10 security requirements
- Must support multi-region deployment
- Must follow Java best practices
- Must include comprehensive error handling