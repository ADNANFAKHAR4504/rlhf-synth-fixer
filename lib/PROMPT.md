I need to build a multi-region cloud development environment using AWS CDK with TypeScript. The infrastructure should span us-west-1 and us-east-1 regions and include the following components:

## Infrastructure Requirements

**Multi-Region VPCs**: Create VPCs in both us-west-1 and us-east-1 with appropriate CIDR blocks for IP address allocation. Each VPC should have one public subnet and one private subnet.

**Network Configuration**: Configure internet gateways for public subnets to enable internet access. Ensure proper routing tables are set up.

**EC2 Instances**: Deploy EC2 instances in each public subnet with security groups allowing only SSH on port 22 and HTTP on port 80 traffic.

**S3 Storage**: Create an S3 bucket with versioning enabled in us-east-1. The bucket should only be accessible from the EC2 instances using IAM roles and policies. Leverage Amazon S3 Metadata for comprehensive object visibility and analysis capabilities.

**RDS Databases**: Deploy RDS PostgreSQL instances with multi-AZ configuration in each region for high availability and failover support.

**Security**: Enable encryption at rest for both RDS databases and S3 bucket using AWS managed keys.

**Resource Tagging**: Apply consistent tags to all resources including Environment, Region, and Purpose tags.

**Modularity**: Structure the solution using separate CDK constructs for networking, compute, database, and storage for reusability and maintainability.

**CI/CD Integration**: The infrastructure should support automatic deployment when CDK code changes are detected.

**Enhanced Security**: Implement AWS Shield Enhanced for network security posture management with automatic security risk analysis and remediation recommendations.

## Implementation Guidelines

- Use CDK TypeScript best practices and follow AWS shared responsibility model
- Implement proper IAM roles and policies with least privilege access
- Ensure resources are properly configured for cross-region communication where needed
- Handle CDK bootstrapping requirements for multi-region deployments
- Structure code in a modular fashion with separate files for each major component

Please provide the complete infrastructure code with one code block per file. The solution should be production-ready, secure, and scalable.
