# Single-Region Infrastructure Deployment

Hey team,

We need to build a comprehensive infrastructure deployment system for a financial services company. I've been asked to create this using **CDKTF with Python**. The business is running a trading platform in the ap-southeast-1 region and needs a robust, scalable infrastructure setup with proper security, monitoring, and compliance controls.

The company currently needs to establish their infrastructure foundation in a single region with proper encryption, networking, database, and compute capabilities. They're dealing with strict regulatory requirements and need to demonstrate infrastructure security and reliability.

## What we need to build

Create an infrastructure deployment system using **CDKTF with Python** that provisions a complete infrastructure stack in the ap-southeast-1 AWS region with proper security, monitoring, and compliance configurations. This needs to support a financial services trading platform with strict data security requirements.

### Core Requirements

1. **Stack Structure**
   - Define a single stack structure for ap-southeast-1 region
   - Support CIDR blocks, KMS key ARNs for encryption
   - Modular design for easy maintenance and updates

2. **Network Infrastructure**
   - Create VPC in ap-southeast-1 region
   - Use CIDR range: 10.0.0.0/16
   - Deploy 3 private and 3 public subnets across availability zones
   - Set up Internet Gateway and proper routing

3. **Database Layer**
   - Deploy RDS Aurora MySQL cluster in ap-southeast-1
   - Configure automated backups with encrypted snapshots
   - Enable point-in-time recovery for all database instances
   - Use KMS encryption for data at rest

4. **Serverless Compute**
   - Set up Lambda functions that process data from S3 buckets
   - Configure IAM roles for Lambda execution
   - Use environment-specific IAM permissions following least privilege
   - Enable CloudWatch logging for all functions

5. **API Layer**
   - Configure API Gateway HTTP endpoint
   - Set up Lambda integration for API routes
   - Implement proper stage configuration

6. **State Management**
   - Implement DynamoDB table for session state management
   - Configure point-in-time recovery for DynamoDB table
   - Enable encryption at rest with KMS

7. **Environment Management**
   - Use environment suffix to manage different environments
   - Support environment separation (dev, staging, prod)
   - Enable environment-based resource naming

8. **Storage Layer**
   - Create S3 buckets for application data storage
   - Apply KMS encryption keys for data at rest
   - Configure lifecycle policies for cost optimization (90-day expiration)
   - Enable versioning for data protection

9. **Monitoring and Alerting**
   - Configure CloudWatch alarms for RDS CPU utilization
   - Set up Lambda error monitoring
   - Alert on DynamoDB throttling issues
   - Implement logging for all critical resources

10. **Validation and Safety**
    - Implement variable validation for CIDR format
    - Ensure required tags are present on all resources
    - Validate configuration parameters

11. **State Backend**
    - Configure S3 backend for remote state storage
    - Implement DynamoDB state locking to prevent concurrent modifications
    - Use encryption for state files

### Technical Requirements

- All infrastructure defined using **CDKTF with Python**
- Use AWS provider for resource provisioning
- Resource names must include **environmentSuffix** for uniqueness
- Follow naming convention: `{resource-type}-{environment-suffix}`
- Deploy to ap-southeast-1 region
- Use Python for all infrastructure code and stack definitions
- Main entry point: tap.py
- Stack definition: lib/tap_stack.py
- VPC CIDR block: 10.0.0.0/16

### AWS Services

- VPC (Virtual Private Cloud)
- RDS Aurora MySQL
- Lambda
- S3 (Simple Storage Service)
- API Gateway (HTTP API)
- DynamoDB
- KMS (Key Management Service)
- IAM (Identity and Access Management)
- CloudWatch
- VPC Endpoints
- Internet Gateway
- Security Groups

### Constraints

- RDS instances must use encrypted storage with KMS
- VPC must use CIDR block 10.0.0.0/16
- All S3 buckets must use KMS encryption
- Lambda functions must use environment-specific IAM roles
- DynamoDB tables must have point-in-time recovery enabled
- All resources must be tagged with Environment, Region, and CostCenter
- All resources must be destroyable for CI/CD workflows (no Retain policies)
- Implement remote state locking with DynamoDB
- Follow principle of least privilege for all IAM roles
- Enable appropriate logging and monitoring for compliance
- S3 lifecycle policies must expire objects after 90 days
- Lambda timeout set to 30 seconds, memory size 256MB

## Success Criteria

- **Functionality**: Successfully deploys complete infrastructure in ap-southeast-1 region
- **Performance**: Infrastructure supports efficient data processing and API operations
- **Reliability**: Includes automated backups, point-in-time recovery mechanisms
- **Security**: Implements encryption at rest and in transit, follows least privilege IAM principles
- **Monitoring**: CloudWatch alarms properly configured for RDS, Lambda, and DynamoDB
- **Resource Naming**: All resources include environmentSuffix following naming convention
- **Environment Management**: Successfully supports environment separation using environment suffix
- **Code Quality**: Python code is well-structured, modular, tested, and documented

## What to deliver

- Complete CDKTF Python implementation with modular structure
- Main entry point (tap.py) that orchestrates single-region deployment
- Stack definition (lib/tap_stack.py) with all required AWS resources
- VPC configuration with CIDR 10.0.0.0/16
- RDS Aurora MySQL cluster with encryption and backups
- Lambda functions with S3 bucket integration
- API Gateway HTTP endpoint with Lambda integration
- DynamoDB table for session management with encryption
- S3 buckets with KMS encryption and lifecycle policies
- CloudWatch alarms for monitoring (RDS CPU, Lambda errors, DynamoDB throttles)
- IAM roles and policies following least privilege
- Variable validation logic for CIDR format
- Remote state configuration with S3 backend and DynamoDB locking
- Documentation covering deployment process and architecture
- Unit tests for infrastructure components
