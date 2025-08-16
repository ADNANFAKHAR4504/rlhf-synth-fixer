## Financial App Infrastructure Requirements

We need to build a secure cloud infrastructure for our financial services application using Terraform. The infrastructure must meet strict compliance and security requirements.

### Core Requirements

- All infrastructure components defined in Terraform HCL
- Multi-region deployment for high availability and disaster recovery
- Data encryption at rest using AWS KMS with customer-managed keys
- IAM roles and policies following least privilege access principles
- VPC architecture with segregated public and private subnets
- Comprehensive logging and monitoring via AWS CloudWatch

### Deliverables

Terraform configuration files that validate successfully and deploy without errors:

- provider.tf - AWS provider and region configuration
- tap_stack.tf - Main infrastructure stack
- outputs.tf - Resource outputs for integration

The solution should be production-ready and follow AWS best practices for financial services workloads.
