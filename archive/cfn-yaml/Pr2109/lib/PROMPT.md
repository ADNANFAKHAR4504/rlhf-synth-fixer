You are an Expert Infrastructure Engineer specializing in AWS CloudFormation, tasked with designing a highly secure, compliant, and scalable infrastructure for a web application handling sensitive data under HIPAA and PCI DSS regulations.

Create a comprehensive, production-ready AWS CloudFormation template in YAML that deploys a multi-region infrastructure stack for a high-security web application. The template must meet stringent compliance requirements while ensuring high availability, security, and operational efficiency.

Key Requirements & Constraints:

Compliance & Security:
All resources must be configured to comply with HIPAA and PCI DSS standards.
Implement encryption at rest (using AWS KMS-managed keys) and in transit (using TLS/SSL) for all data resources.
Use security best practices, such as least privilege IAM roles, secure network configurations (VPC, subnets, security groups), and encrypted storage.
High Availability & Multi-Region:
Design the infrastructure to be highly available by distributing resources across at least two AWS regions (e.g., 'us-east-1' and 'us-west-2').
Ensure resources like databases, storage, and compute are replicated or failover-enabled across regions.
Deployment Strategies:
This may involve using AWS CodeDeploy, Lambda functions, or weighted Route 53 records.
Incorporate rollback safety for all resources to handle deployment failures gracefully.
Operational Management:
Implement automated notifications via SNS for any CloudFormation stack status changes (e.g., CREATE_FAILED, UPDATE_ROLLBACK_COMPLETE).
Use AWS Systems Manager Parameter Store to manage environment-specific configurations (e.g., database endpoints, API keys) for smooth migrations between environments.
Tag all resources appropriately for cost allocation and management (e.g., Environment: Production, CostCenter: Compliance).
Serverless & Scalability:
Incorporate AWS Lambda functions for serverless processes where optimal, ensuring they are scalable and performant (e.g., using provisioned concurrency).
Design compute resources (e.g., EC2 instances, ECS services) to scale based on load.
Monitoring & Logging:
Establish a monitoring and logging system using AWS CloudWatch, including dashboards, alarms, and log groups for application and resource performance.
Ensure all critical metrics are tracked and alerts are set up for anomalies.
Template Quality:
The template must be reusable, allowing for rapid spin-up of identical environments with minimal changes (e.g., using parameters and mappings).
Pass all AWS CloudFormation syntax and structural validations (aws cloudformation validate-template).
Use YAML syntax exclusively and include necessary sections (Parameters, Mappings, Resources, Outputs).
Deliverable: A single, well-structured, and validated YAML file named secure_infrastructure.yaml that defines the entire infrastructure stack.

The template must demonstrate expert-level design, incorporating all constraints while maintaining clarity, efficiency, and best practices. Focus on practical implementation that ensures data protection, compliance, and high availability across regions.
