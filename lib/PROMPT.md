Act as an expert AWS cloud architect and CDK developer. Help me design and implement a secure, highly available infrastructure using AWS CDK in Python. The environment must meet the following requirements:

Multi-region deployment across us-east-1 and us-west-2 to ensure high availability.

VPCs in each region to provide network isolation and security for application components.

Use managed database services (e.g., Amazon RDS or Aurora) with automated backups retained for at least 7 days.

Implement application load balancing across multiple Availability Zones (AZs) within each region.

Ensure data at rest encryption using customer-managed AWS KMS keys.

Use Route 53 for automated DNS management and failover routing between the two regions.

Enable CloudWatch monitoring and logging for all services to comply with AWS security best practices.

Your task:

Provide a CDK (Python) project structure with example stacks/modules implementing these requirements.

Explain any design decisions, such as failover handling, region-specific deployment logic, and use of constructs.

Where appropriate, include construct classes, stack splitting logic, and IAM/KMS configuration to meet the security goals.

Please focus on infrastructure-as-code best practices, modular design, and reusability across regions.