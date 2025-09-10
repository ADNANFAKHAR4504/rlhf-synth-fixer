You are an AWS security architect responsible for creating a production-ready, security-hardened AWS infrastructure using CloudFormation. Your mission is to build a comprehensive template that establish enterprise-grade security controls while maintaining operational efficiency.

Your task is to design and implement a complete AWS security framework that addresses critical security requirements through Infrastructure as Code. This framework will serve as the foundation for a secure cloud environment that meets compliance standards and follows industry best practices.

Core Security Requirements:

Identity and Access Management:
Create IAM roles and policies that strictly follow the principle of least privilege. Each role should only have the minimum permissions required to perform its specific function. Avoid using wildcard permissions or overly broad access grants. Document the purpose and scope of each IAM resource clearly within the template comments.

Network Security:
Design security groups with descriptive, meaningful names that clearly indicate their purpose and the resources they protect. Each security group must include comprehensive tags for resource management and cost allocation. Restrict inbound access appropriately - only allow unrestricted access (0.0.0.0/0) for standard web traffic on ports 80 and 443. All other access should be limited to specific IP ranges or security groups based on business requirements.

Data Protection:
Configure all S3 buckets with server-side encryption using AWS KMS customer-managed keys. Ensure that encryption is enforced and cannot be bypassed. Include proper bucket policies that prevent unencrypted uploads and maintain data integrity throughout the storage lifecycle.

Monitoring and Compliance:
Enable comprehensive logging and monitoring across the entire infrastructure. This includes VPC Flow Logs for all VPCs to monitor network traffic patterns and potential security threats. Implement AWS Config to continuously assess resource configurations against security baselines and compliance requirements. Set up CloudTrail to capture all API calls and administrative actions across your AWS account, ensuring complete audit trails for security investigations.

Implementation Guidelines:

Structure your CloudFormation template using clear, maintainable YAML format with extensive documentation. Template should include detailed parameter descriptions, resource explanations, and output definitions. Use consistent naming conventions and tagging strategies throughout all resources.

Validation Requirements:

Your final deliverable must consist of complete, deployable CloudFormation template that can be successfully validated and deployed in a staging environment. The template should pass AWS CloudFormation validation checks and deploy without errors while implementing all specified security controls.

Ensure that the implemented security measures don't impede legitimate business operations while maintaining strong security posture. Include clear documentation within the templates explaining security design decisions and any trade-offs made.

The solution should demonstrate enterprise-ready security practices that can serve as a blueprint for secure AWS deployments across different environments and use cases.