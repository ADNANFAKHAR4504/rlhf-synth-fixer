# AWS CloudFormation Infrastructure Generation Prompt

## Objective

Generate a **complete, production-ready AWS CloudFormation YAML template** named `secure_infrastructure.yaml` that creates a secure, multi-region infrastructure adhering to AWS security best practices and organizational requirements. All infrastructure requirements should be defined mandatorily.

## Infrastructure Requirements

### **Global Configuration**

- **Regions**: Deploy across `us-east-1` and `eu-central-1`
- **Naming Conventions**:
    - S3 buckets: `prod-{bucket-name}`
    - IAM roles: `role-{role-name}`
    - VPCs: `vpc-prod-{region}`
- **KMS Keys**: Use existing Customer Managed Key IDs (provided via CloudFormation parameters)


### **Network Infrastructure**

- **VPC per region** with CIDR blocks that don't overlap
- **Subnets per VPC**:
    - Minimum 2 public subnets (each with NAT Gateway)
    - Minimum 2 private subnets
    - Distribute across different Availability Zones
- **Route tables** properly configured for public/private subnet routing


### **Storage \& Data Security**

- **S3 Buckets**:
    - AES-256 server-side encryption enabled
    - Versioning enabled on all buckets
    - Block public access settings enforced
- **RDS Instances**:
    - Encryption at rest enabled using KMS CMK
    - Instance types: `db.m5.large` or `db.m5.xlarge` only
    - Deploy in private subnets with DB subnet groups
    - Multi-AZ deployment for high availability


### **Compute \& Container Services**

- **EC2 Instances**:
    - Attach IAM roles (no hardcoded access keys)
    - Deploy in private subnets
    - Instance profiles with least privilege permissions
- **ECS Clusters**:
    - Service auto-scaling policies based on:
        - CPU utilization thresholds
        - Queue depth metrics
    - Task definitions with proper resource limits


### **Security \& Access Management**

- **IAM Roles \& Policies**:
    - Implement principle of least privilege
    - Separate roles for EC2, ECS, and RDS services
- **Security Groups**:
    - Restrictive inbound/outbound rules
    - Port access limited to specific IP ranges
    - No 0.0.0.0/0 access except where absolutely necessary
- **KMS Configuration**:
    - Use provided Customer Managed Key IDs
    - Enable automatic key rotation
    - Proper key policies for cross-service access


### **Monitoring \& Logging**

- **CloudTrail**:
    - Log all S3 bucket API activities
    - Store logs in dedicated S3 bucket with encryption
- **CloudWatch**:
    - **EC2 metrics**: CPU utilization, memory usage, disk I/O
    - **RDS metrics**: Response latency, database connections, read/write requests
    - **ECS metrics**: CPU/memory utilization, task count
    - Create alarms for critical thresholds
- **Log Groups** with appropriate retention policies


## Technical Specifications

### **Template Structure Requirements**

- Use CloudFormation **Parameters** for:
    - KMS Key IDs
    - Environment name
    - CIDR blocks
    - Instance types
- Include **Outputs** for:
    - VPC IDs
    - Subnet IDs
    - Security Group IDs
    - S3 bucket names
    - RDS endpoints
- Add **Conditions** for region-specific resources
- Use **Mappings** for AMI IDs and AZ selections


### **Validation \& Deployment**

- Template must pass: `aws cloudformation validate-template`
- Successfully deploy with: `aws cloudformation create-stack`
- Include proper **DependsOn** attributes for resource creation order
- Use **Ref** and **GetAtt** functions appropriately
- Implement **stack deletion protection** for critical resources


### **Resource Tagging**

- Apply consistent tags across all resources:
    - `Environment: Production`
    - `Project: IaC-AWS-Nova-Model`
    - `ManagedBy: CloudFormation`
    - `Region: {aws-region}`


## Expected Deliverable

A **single, comprehensive CloudFormation YAML file** that creates all specified infrastructure components while maintaining security best practices, proper resource dependencies, and successful validation/deployment capabilities across both target regions. The template should be **ready for deployment without errors**. Do **not generalize** or change any given CIDR blocks, security rules, tags, encryption settings, or policy restrictions. Do **not include** additional explanation, commentary, or non-YAML content. Output only the **CloudFormation YAML code**.

