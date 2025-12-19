I need to deploy a web application on AWS using Terraform HCL in the us-west-2 region. The application is part of an e-commerce platform that requires PCI-DSS compliance for storing sensitive data.

Here are the specific requirements:

1. Create a VPC with CIDR block 10.0.0.0/16 in us-west-2 region
2. Deploy two application server EC2 instances behind an Application Load Balancer across two availability zones for fault tolerance
3. Implement auto-scaling policy based on CPU utilization to manage load and optimize costs
4. Use Amazon RDS for database management with multi-AZ deployments for failover
5. Ensure PCI-DSS compliance by encrypting all data at rest using KMS managed keys
6. Use appropriate security groups to restrict access
7. Follow naming convention 'projectname-component-environment' for all resources
8. Tag all resources with appropriate environment and project identifiers

Additional considerations:
- The web application needs to handle variable traffic loads efficiently
- Database should be configured for high availability and automatic failover
- All storage must be encrypted to meet compliance requirements
- Security groups should follow least privilege access principles
- Use the latest Terraform AWS provider features including multi-region support capabilities
- Consider using AWS Parallel Computing Service for any compute-intensive workloads if applicable

Please provide Terraform HCL configuration files that define and provision this infrastructure. The configuration should be production-ready and follow Terraform best practices for resource organization.