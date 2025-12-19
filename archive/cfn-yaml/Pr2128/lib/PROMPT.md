# AWS Infrastructure as Code Generation Prompt

You are a Senior AWS Cloud Engineer with expertise in CloudFormation template development. Your task is to generate a comprehensive, production-ready CloudFormation YAML template for a company's infrastructure migration project.

## Mission Statement

Design and implement a multi-region AWS infrastructure stack that supports a company's major cloud migration initiative. The infrastructure must be highly available, secure, compliant, and scalable across both us-east-1 and us-west-2 regions.

## Core Requirements

### 1. Multi-Region Architecture

- Deploy resources across **us-east-1** and **us-west-2** regions
- Implement cross-region redundancy and failover capabilities
- Ensure data replication and synchronization between regions

### 2. Network Infrastructure

- **VPC Configuration**: Create VPC with CIDR block `10.0.0.0/16`
- **Subnet Design**: Implement subnets spanning multiple availability zones for redundancy
  - Public subnets: For load balancers and NAT gateways
  - Private subnets: For application servers and databases
  - Database subnets: Isolated subnets for RDS instances
- **Route Tables**: Configure appropriate routing for public/private access

### 3. Security Framework

- **Security Groups**: Implement restrictive security groups allowing inbound traffic only from company-regulated IP addresses
- **IAM Roles**: Design roles following the principle of least privilege
- **Encryption**: Enable server-side encryption for all S3 buckets using AWS KMS
- **Network ACLs**: Additional layer of security for network-level protection

### 4. Database Layer

- **RDS MySQL**: Deploy MySQL instances with Multi-AZ configuration for high availability
- **Database Security**: Implement proper subnet groups and security configurations
- **Backup Strategy**: Configure automated backups and maintenance windows

### 5. Compute Infrastructure

- **EC2 Instances**: Deploy with termination protection enabled for testing safety
- **Auto Scaling**: Configure Auto Scaling Groups to handle traffic variations
- **Instance Types**: Use appropriate instance types for workload requirements

### 6. Load Balancing & Traffic Distribution

- **Elastic Load Balancer (ELB)**: Implement Application Load Balancer for traffic distribution
- **Target Groups**: Configure health checks and routing rules
- **SSL/TLS**: Implement HTTPS termination at load balancer level

### 7. DNS & Routing

- **Route 53**: Configure hosted zones for DNS management
- **Failover Configuration**: Implement DNS-based failover between regions
- **Health Checks**: Set up Route 53 health checks for automatic failover

### 8. Monitoring & Logging

- **CloudWatch**: Centralize all logs and metrics
- **CloudTrail**: Enable comprehensive API activity monitoring
- **Alarms**: Configure CloudWatch alarms for critical metrics
- **Log Groups**: Organize logs by service and application

### 9. Parameter Management

- **Parameter Store**: Use AWS Systems Manager Parameter Store for sensitive configuration data
- **Secrets Manager**: Implement for database credentials and API keys

### 10. Compliance & Standards

- **Tagging Strategy**: Apply consistent tags across all resources:
  - `Project: Migration`
  - `Creator: CloudEngineer`
  - Additional operational tags (Environment, CostCenter, etc.)
- **AWS Trusted Advisor**: Ensure template follows recommendations for security, cost optimization, and performance

## Technical Constraints

1. **Regional Deployment**: Must support both us-east-1 and us-west-2 regions
2. **Network CIDR**: VPC must use 10.0.0.0/16 CIDR block
3. **Security**: No public internet access except through controlled entry points
4. **Encryption**: All data at rest and in transit must be encrypted
5. **High Availability**: All critical components must have redundancy
6. **Scalability**: Infrastructure must auto-scale based on demand
7. **Monitoring**: Complete observability across all components

## Expected Deliverables

Generate a CloudFormation YAML template that:

1. **Deploys Successfully**: Template must deploy without errors in both target regions
2. **Follows Best Practices**: Adheres to AWS Well-Architected Framework principles
3. **Is Production Ready**: Includes proper error handling, rollback capabilities, and resource dependencies
4. **Is Well Documented**: Includes comprehensive descriptions, parameters, and outputs
5. **Is Modular**: Uses nested stacks or cross-stack references where appropriate

## Template Structure Requirements

```yaml
# Required sections:
- AWSTemplateFormatVersion: '2010-09-09'
- Description: Comprehensive infrastructure migration stack
- Parameters: Input parameters for customization
- Mappings: Region-specific configurations
- Conditions: Logic for conditional resource creation
- Resources: All AWS resources with proper dependencies
- Outputs: Key resource identifiers and endpoints
```

## Success Criteria

- Template validates using `aws cloudformation validate-template`
- Resources deploy successfully in both regions
- All security requirements are implemented
- High availability is achieved across AZs and regions
- Monitoring and logging capture all required events
- Auto Scaling responds appropriately to load changes
- Failover mechanisms work as designed
- All resources are properly tagged
- Compliance requirements are met

Generate a comprehensive CloudFormation YAML template that fulfills all these requirements and can serve as the foundation for a production-grade AWS infrastructure migration.
