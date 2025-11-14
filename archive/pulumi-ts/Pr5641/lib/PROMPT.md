# Database Migration Infrastructure with Pulumi TypeScript

Hey team,

We need to migrate a legacy PHP application from our on-premises data center to AWS. The app currently runs on MySQL 5.7, and the business is asking us to create a comprehensive migration infrastructure that ensures data integrity and minimal downtime. This is a critical project for the company's cloud transformation initiative.

The challenge here is building a robust migration environment that supports a phased approach. We need secure access patterns, proper backup strategies, and comprehensive monitoring across multiple regions. The business has emphasized that this must be production-ready with disaster recovery capabilities.

## What we need to build

Create a database migration infrastructure using **Pulumi with TypeScript** for migrating an on-premises application stack to AWS. The configuration must:

### Core Requirements

1. Set up a VPC with public and private subnets across 2 availability zones for the migration environment.
2. Deploy an RDS MySQL 5.7 instance in the private subnets with automated backups enabled.
3. Create an EC2 bastion host in the public subnet for secure database access during migration.
4. Configure security groups allowing SSH access to bastion from specific IPs and MySQL access from bastion to RDS.
5. Implement an S3 bucket for storing database dumps with versioning enabled.
6. Set up IAM roles and policies for EC2 instances to access S3 for backup operations.
7. Create Route53 private hosted zone for internal DNS resolution.
8. Output the RDS endpoint, bastion public IP, and S3 bucket name for migration scripts.

### Advanced Requirements

11. Implement multi-region deployment with automatic failover configuration.
12. Set up comprehensive monitoring with custom CloudWatch dashboards and composite alarms.
13. Configure AWS Certificate Manager for SSL/TLS certificate management with auto-renewal.
14. Deploy AWS Secrets Manager with cross-region replication for high availability.
15. Implement AWS KMS with customer-managed keys and automatic key rotation.
16. Set up VPC peering connections with Transit Gateway for hub-and-spoke architecture.
17. Configure AWS PrivateLink endpoints for secure service-to-service communication.
18. Deploy Amazon CloudWatch Logs Insights queries for automated log analysis and alerting.

## Technical Specifications

### Region and Availability

- Primary region: ap-northeast-2
- AWS environment for migrating on-premises workloads
- VPC spans 2 AZs with public/private subnet pairs
- NAT gateways for outbound connectivity from private subnets

### Resource Specifications

- **RDS instance**: db.t3.medium instance class with 100GB encrypted storage, Multi-AZ configuration
- **Bastion host**: Amazon Linux 2023 AMI and t3.micro instance type
- **VPC CIDR**: 10.0.0.0/16 with /24 subnets
- **S3 bucket**: Lifecycle policy to transition objects to Glacier after 30 days

### Resource Naming and Configuration

- All resource names MUST include environmentSuffix for uniqueness across deployments
- Follow naming convention: `{resource-type}-{environment-suffix}`
- Environment suffix enables multiple isolated deployments in the same AWS account
- All resources must be destroyable (no Retain policies)

### Compliance and Best Practices

- All resources must be tagged with Environment=migration and Project=legacy-app
- Must implement infrastructure as code testing using Pulumi's testing framework
- All resources must support disaster recovery with RTO < 1 hour and RPO < 15 minutes
- Implement cost allocation tags and AWS Cost Explorer integration for budget tracking
- Must include comprehensive documentation with architecture diagrams exported as code
- Implement automated security scanning in CI/CD pipeline before deployment
- All secrets and credentials must use automatic rotation with zero-downtime updates
- Must implement infrastructure drift detection with automated remediation
- Deploy resources across multiple regions for high availability and disaster recovery

## Technology Stack

- **Pulumi**: 3.x
- **TypeScript**: Latest
- **Node.js**: 16+
- **AWS CLI**: Configured with appropriate credentials

## Expected Output

A Pulumi stack that provisions the complete migration infrastructure with proper networking isolation, secure access patterns, and backup capabilities to support a safe database migration process.

The infrastructure must include:
- VPC with proper network segmentation
- RDS MySQL 5.7 in Multi-AZ configuration
- EC2 bastion host for secure access
- S3 for backup storage with proper lifecycle policies
- Comprehensive monitoring and alerting
- Multi-region deployment with failover
- Proper security controls and encryption
- Complete infrastructure testing

## Validation Criteria

- All resources must be deployable using Pulumi TypeScript
- VPC must span exactly 2 availability zones
- RDS must be in Multi-AZ configuration with automated backups
- Security groups must follow least privilege principle
- All data must be encrypted at rest and in transit
- Infrastructure must pass all unit and integration tests
- Deployment must be repeatable and idempotent
