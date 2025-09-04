I need comprehensive AWS CDK JavaScript infrastructure that implements security configuration as code for a production environment in the us-west-2 region. The solution must follow AWS security best practices and include modern security features.

## Core Security Requirements

### IAM Security with Least Privilege
Create IAM roles and policies that strictly follow the principle of least privilege. Each role should only have the minimum permissions necessary for its specific function. Implement proper resource-based policies and use condition keys to restrict access based on context like source IP, time, and MFA requirements.

### Data Encryption with AWS KMS
Implement comprehensive data encryption at rest using AWS Key Management Service (KMS). Use customer-managed KMS keys with proper key policies that follow least privilege principles. Enable automatic key rotation and ensure all storage services (S3 buckets, EBS volumes) are encrypted with these keys. Include HMAC support for message authentication where applicable.

### Compliance Monitoring with AWS Config
Deploy AWS Config with proactive compliance monitoring using managed rules. Implement rules that check for security best practices including encrypted storage, proper IAM configurations, and network security settings. Use Config rules that support proactive compliance mode to prevent non-compliant resources from being deployed.

### Resource Tagging Strategy
Tag all resources with mandatory "Owner" and "Purpose" tags. Implement additional tags for cost allocation, environment classification, and compliance tracking. Use tag-based access control policies where appropriate.

## Modern AWS Security Features to Include

### Advanced KMS Features
Utilize AWS KMS asymmetric keys for digital signing and verification operations. Implement encryption context for additional security layers. Configure multi-region keys if cross-region replication is needed for disaster recovery.

### Proactive Config Rules
Use AWS Config's new proactive evaluation mode to validate resource configurations before deployment. This prevents non-compliant resources from being created in the first place rather than detecting them after creation.

## Technical Requirements

### Infrastructure Code Structure
Provide AWS CDK JavaScript code that creates separate stacks for different security domains (IAM, encryption, monitoring). Use proper CDK constructs and follow JavaScript ES6+ syntax. Ensure all code can be deployed with standard CDK commands.

### Security Monitoring
Include CloudTrail configuration for comprehensive API logging. Set up CloudWatch alarms for security-related events. Configure SNS notifications for compliance violations detected by Config rules.

### Network Security
Implement VPC security groups with restrictive ingress rules. Use NACLs for additional network-level security. Enable VPC Flow Logs for network monitoring.

## Deployment Requirements

All resources must be deployed in the us-west-2 region. The infrastructure should be production-ready and follow CDK best practices for resource naming and organization. Include proper error handling and resource dependencies.

Please provide complete, deployable AWS CDK JavaScript code that implements these security requirements. Structure the code with one file per major security component and ensure all resources are properly tagged and encrypted.