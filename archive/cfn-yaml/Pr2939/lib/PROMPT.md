# AWS CloudFormation Secure Infrastructure Deployment Prompt

## Project Overview

**Project Name:** IaC - AWS Nova Model Breaking  
**Objective:** Deploy a secure, production-ready cloud infrastructure in AWS using CloudFormation templates  
**Target Region:** us-east-1  
**Primary Services:** VPC, EC2, S3, RDS, DynamoDB, Lambda, CloudFront, and additional AWS-managed services

## Core Requirements

### Infrastructure Architecture

You are tasked with creating a comprehensive CloudFormation YAML template that deploys a secure web application environment in AWS. The infrastructure must be designed with security as the primary concern, implementing defense-in-depth strategies and adhering to AWS security best practices.

### Primary Components

- **VPC Configuration:** Deploy the application within a custom VPC with restricted network access
- **Compute Layer:** EC2 instances for web application hosting
- **Storage Layer:** S3 buckets for static content and data storage
- **Database Layer:** RDS instances for relational data with high availability
- **NoSQL Layer:** DynamoDB tables for scalable data storage
- **Serverless Layer:** Lambda functions for event-driven processing
- **CDN Layer:** CloudFront distributions for global content delivery
- **Monitoring Layer:** CloudWatch for observability and alerting

## Security Constraints & Requirements

### Network Security

1. **VPC Traffic Restriction:** The VPC must allow communication only on port 443 (HTTPS)
2. **Security Groups:** Associate security groups with EC2 instances that restrict traffic to specified CIDR blocks
3. **Route 53 DNS Security:** Restrict Route 53 DNS query resolutions to specific CIDR blocks

### Data Protection & Encryption

4. **S3 Encryption:** All data stored in S3 buckets must be encrypted using AWS KMS keys
5. **EBS Volume Encryption:** Ensure all EBS volumes used by EC2 instances are encrypted
6. **DynamoDB Encryption:** Enable server-side encryption on all DynamoDB tables
7. **Elasticsearch Security:** Ensure Elasticsearch domains are accessible only via HTTPS

### Access Control & Authentication

8. **IAM MFA Requirement:** All IAM roles must include MFA as a policy requirement
9. **Lambda Least Privilege:** Ensure Lambda functions have minimal required permissions to access only specified resources

### High Availability & Backup

10. **RDS Multi-AZ:** Enable Multi-AZ deployment for all RDS instances
11. **RDS Backup Strategy:** Create automated backup plans for RDS instances with daily snapshots

### Security Monitoring & Compliance

12. **AWS WAF Protection:** Utilize AWS WAF to protect the application from common web exploits
13. **CloudFront Encryption:** CloudFront distributions must use encryption protocols to secure data between users and origin
14. **CloudWatch Monitoring:** Set up CloudWatch alarms to monitor and alert on unauthorized API calls
15. **AWS Config Compliance:** Use AWS Config to monitor infrastructure changes and validate configurations
16. **CloudTrail Logging:** Enable detailed logging for all S3 buckets using CloudTrail

## Technical Specifications

### CloudFormation Template Requirements

- **Format:** Complete YAML template
- **Region:** us-east-1
- **Deployment:** Single-stack deployment capability
- **Parameters:** Configurable parameters for environment-specific values
- **Outputs:** Clear outputs for resource identification and integration

### Security Architecture Principles

- **Zero Trust Model:** Implement least privilege access throughout
- **Encryption at Rest:** All persistent storage must be encrypted
- **Encryption in Transit:** All communications must use TLS/HTTPS
- **Defense in Depth:** Multiple layers of security controls
- **Compliance Ready:** Infrastructure must support common compliance frameworks

### Performance & Scalability Considerations

- **Auto Scaling:** Implement auto-scaling groups for EC2 instances
- **Load Balancing:** Use Application Load Balancers for traffic distribution
- **Database Scaling:** Configure RDS for read replicas and scaling
- **CDN Optimization:** Optimize CloudFront for global performance

## Expected Deliverables

### Primary Output

A complete, production-ready CloudFormation YAML template that:

- Successfully deploys all specified infrastructure components
- Implements all 16 security constraints and requirements
- Follows AWS Well-Architected Framework principles
- Includes comprehensive error handling and rollback capabilities
- Provides clear documentation and parameter descriptions

### Template Structure Requirements

1. **Parameters Section:** Environment-specific configuration values
2. **Conditions Section:** Conditional resource creation logic
3. **Resources Section:** All AWS resources with proper dependencies
4. **Outputs Section:** Key resource identifiers and connection information
5. **Metadata Section:** Template documentation and usage instructions

### Validation Criteria

The template must:

- Deploy without errors in us-east-1 region
- Pass CloudFormation validation checks
- Implement all security requirements as specified
- Support parameterized deployment for different environments
- Include proper resource tagging for cost management and compliance

## Success Metrics

- **Security Compliance:** 100% adherence to all 16 security constraints
- **Deployment Success:** Template deploys cleanly without manual intervention
- **Resource Optimization:** Efficient use of AWS services and cost optimization
- **Documentation Quality:** Clear, comprehensive template documentation
- **Maintainability:** Well-structured, readable, and maintainable code

## Additional Considerations

- Implement proper resource naming conventions
- Include comprehensive resource tagging strategy
- Ensure template supports multiple environment deployments
- Provide clear instructions for template customization
- Include monitoring and alerting setup
- Consider disaster recovery and backup strategies

---

**Note:** This prompt requires a sophisticated understanding of AWS services, security best practices, and CloudFormation template development. The resulting template should be production-ready and demonstrate expert-level AWS infrastructure design capabilities.
