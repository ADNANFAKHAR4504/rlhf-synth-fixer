Create an AWS CloudFormation template in JSON that sets up a secure, highly available infrastructure for a web application in the us-west-1 region.

Here are the requirements for the setup:

VPC and Networking: Set up a VPC with subnets spread across different availability zones to maintain availability and failure resilience. Configure the VPC to host different tiers of the application across multiple Availability Zones.

EC2 Instances and Security Groups: Deploy EC2 instances with security groups configured to control the inbound and outbound traffic. Enforce usage of security groups to restrict traffic appropriately for the web application tier.

IAM Roles and Policies: Use AWS IAM to enforce the principle of least privilege by defining necessary roles and policies. Ensure that roles are precisely scoped to grant only the permissions required for each component.

S3 Storage Security: Create S3 buckets with server-side encryption (SSE) using AWS KMS keys. Enable versioning and access logging for all S3 buckets to ensure data protection and traceability.

CloudTrail Logging: Enable AWS CloudTrail to track all account activities, specifically logging management events. Ensure comprehensive audit logging is in place for compliance and security monitoring.

API Gateway and WAF: Deploy an API Gateway endpoint and utilize AWS WAF to protect it from common web exploits. Configure appropriate rules to filter malicious traffic.

DDoS Protection: Securely integrate AWS Shield for DDoS protection for outward-facing components of the infrastructure to safeguard against distributed denial-of-service attacks.

Compliance Monitoring: Define and apply AWS Config rules for real-time monitoring and compliance checks of the infrastructure components. Ensure continuous monitoring of changes in the deployed resources.

Logging and Traceability: Implement logging for all aspects of the infrastructure to ensure complete traceability of actions and events across all services.

Please ensure the final JSON CloudFormation template is valid, follows AWS security best practices, and would pass standard AWS CloudFormation validation tests. All resources must be deployed in the us-west-1 region.
