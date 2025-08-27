# Security Configuration as Code - CDKTF+Go Implementation

You are tasked with configuring security as code for a company's AWS infrastructure using CDKTF with Go. The primary focus is to ensure the security and compliance of several resources. Specifically, you must ensure:

## Requirements

1. **Logging**: Enable logging for all lambda resources to maintain operational visibility
2. **S3 Encryption**: All S3 buckets used must have server-side encryption enabled to protect stored data
3. **KMS Management**: Manage encryption keys using AWS KMS to control access and use of encrypted resources
4. **IAM Least Privilege**: IAM roles should have policies defined that adhere strictly to the principle of least privilege, minimizing the potential for unauthorized access
5. **VPC** Add a VPC in the us-east-1 region with 2 public and private subnets
5. **VPC Flow Logs**: Enable VPC Flow Logs to continuously monitor and log all traffic in and out of the the VPC

## Environment Details

- **Region**: AWS US-East-1 (N. Virginia)
- **Naming Convention**: Use 'prod-*' for production resources
- **Compliance**: Resources should adhere to company policies regarding encryption and monitoring

## Expected Output

Create a CDKTF+Go implementation that:
- Uses proper Go modules and CDKTF patterns
- Implements all security requirements listed above
- Passes deployment validation
- Includes comprehensive tests (unit and integration)
- Follows Go best practices and security standards

## Background

Security configuration as code assists in automating security practices and enforces standards across cloud environments. This implementation should demonstrate enterprise-grade security practices using infrastructure as code principles.

## Constraints

- All resources must be properly tagged
- Encryption must be enabled at rest and in transit where applicable
- Monitoring and logging must be comprehensive
- Access controls must follow principle of least privilege
- Infrastructure must be repeatable and maintainable
