# AWS Failure Recovery & High Availability Infra - CloudFormation TypeScript

## Mission Statement

Act as an **expert AWS Solutions Architect** and generate a TypeScript-based CloudFormation (AWS CDK) Infrastructure as Code (IaC) solution for a stateful, highly available web application. All requirements and constraints must remain **intact and unchanged**. Ensure a **string suffix is appended to resource names where needed** for uniqueness and compliance.

---

## Instructions

1. **Analyze the Requirements**
   - Carefully review all requirements and constraints. **Do not** omit, modify, or alter any provided data.

2. **Write the Architecture in CloudFormation TypeScript Format**
   - Use AWS CDK in TypeScript to define all resources and configurations.

3. **Specify AWS Services**
   - Explicitly name/configure each AWS service: EC2, Elastic Load Balancer, Auto Scaling, RDS (MySQL), VPC, S3, CloudWatch, IAM, Route 53, Network ACLs, Security Groups, KMS.

4. **Enforce Resource Naming, Security & High Availability**
   - **Resource Naming**: All resources must follow the convention `'prod-service-role-stringSuffix'`, appending a string suffix for uniqueness.
   - **Security**: Use IAM roles, Security Groups, and Network ACLs for least privilege. Encrypt all data at rest and in transit (AWS KMS).
   - **High Availability & Recovery**: Multi-AZ setup for EC2, RDS, ELB, Route 53 DNS failover, and automated recovery for failed instances.

5. **Output Format**
   - **CloudFormation + TypeScript (AWS CDK)**

---

## Task Requirements

Design and implement an automated, failure-recovery, highly available infrastructure for a stateful web application using **AWS CloudFormation & TypeScript (AWS CDK)** in AWS account `123456789012`.

### Core Requirements

1. **VPC**
   - Name: `prod-app-vpc`
   - CIDR: `10.0.0.0/16`
   - Minimum 2 public subnets, 2 private subnets (across different AZs)
   - Route tables for internal communication
   - Security Groups & NACLs restrict inbound/outbound traffic to required ports

2. **EC2 & Auto Scaling**
   - Auto Scaling Group spans multiple AZs
   - EC2 instances with IAM roles for S3 log access
   - Cross-zone load balancing enabled
   - Rolling updates and zero-downtime deployments

3. **Elastic Load Balancer**
   - Distributes traffic across EC2s in multiple AZs
   - Session persistence for user connections
   - Health checks for instance recovery

4. **Amazon RDS (MySQL)**
   - Multi-AZ deployment for failover
   - Automated backups (min. 7 days retention)
   - Data replication and encrypted storage

5. **S3 Logging**
   - Store application logs in S3
   - Lifecycle rules: move logs to Glacier after 30 days

6. **CloudWatch Monitoring**
   - Monitor EC2, RDS for performance
   - Alarms for failure conditions
   - Notification on performance degradation

7. **Route 53**
   - DNS failover
   - Health checks for endpoints

8. **Security**
   - IAM roles for EC2
   - Security Groups & NACLs for least privilege
   - Encrypt all data at rest and in transit (AWS KMS)

9. **CloudFormation Stack Management**
   - Infrastructure as code with update support & zero-downtime
   - Modular design for scalability

10. **Outputs**
    - Export Instance IDs, ELB DNS name, RDS endpoint, VPC ID, Subnet IDs, and Security Group IDs

---

## Constraints

- All resources must be deployed to **us-east-1 (primary)** and **us-west-2 (secondary)** regions.
- All subnets must be properly associated with the VPC and have route tables for internal communication.
- Support auto-scaling based on CPU utilization.
- S3 lifecycle policies for log archiving.
- CloudWatch alarms and monitoring for EC2 and RDS.
- Rolling updates and zero-downtime must be supported.
- Route 53 for DNS failover and health checks.
- Data encryption at rest/in transit (AWS KMS).
- Detailed stack outputs listing all critical resource identifiers.
- Use AWS account ID: `123456789012`.

---

## Solution Requirements

- **Single, deployable TypeScript CDK application**
- All configuration, resource definitions, IAM roles, tags, security, and outputs included
- Output must confirm creation/configuration of each resource

---

## Success Criteria

- **High Availability & Recovery**: Multi-AZ, automated failover, health checks
- **Security**: IAM, Security Groups, NACLs, KMS encryption
- **Compliance**: All requirements/constraints implemented exactly as specified
- **Operational Excellence**: Clean, maintainable, well-documented TypeScript code
- **Resource Uniqueness**: All resource names include a string suffix
- **Deployment**: TypeScript file compiles, deploys, and outputs all critical identifiers

---

## Expected Deliverables

- Complete AWS CDK TypeScript stack implementation
- Resource definitions for EC2, ELB, Auto Scaling, RDS, VPC, S3, CloudWatch, IAM, Route 53
- Resource naming with a string suffix for uniqueness
- Outputs for Instance IDs, ELB DNS, RDS endpoints, VPC ID, Subnet IDs, Security Group IDs
- Documentation for deployment, outputs, and operational runbooks

---