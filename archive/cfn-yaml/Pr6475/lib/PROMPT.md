# Multi-Environment Payment Processing Infrastructure with CloudFormation

## Platform and Language Requirements
**MANDATORY: Use AWS CloudFormation with YAML**

## Task Overview
Create a CloudFormation template to deploy consistent payment processing infrastructure across three environments (dev, staging, prod).

## Background
A financial services company needs to maintain identical infrastructure across development, staging, and production environments for their payment processing system. The environments must be consistent in configuration but allow for size variations based on workload. Compliance requires all environments to have identical security and monitoring configurations.

## Environment Details
Multi-environment AWS deployment across us-east-1 (production), us-west-2 (staging), and eu-west-1 (development). Each environment requires VPC with 3 availability zones, public and private subnets, NAT gateways for private subnet egress. Core services include Application Load Balancer, ECS Fargate for containerized payment processor, RDS Aurora PostgreSQL Multi-AZ cluster for transaction storage. CloudFormation YAML templates with nested stacks, AWS CLI 2.x configured with appropriate IAM permissions. Environments share common base configuration but differ in instance sizes and replica counts.

## MANDATORY REQUIREMENTS (Must complete)

### 1. Nested Stack Architecture (CORE: CloudFormation Nested Stacks)
Create a master stack that orchestrates nested stacks for VPC, compute, and database layers. The master stack should:
- Accept an EnvironmentType parameter (dev|staging|prod)
- Pass parameters to nested stacks
- Use stack exports for cross-stack references
- Coordinate deployment order using DependsOn

### 2. RDS Aurora PostgreSQL (CORE: RDS Aurora)
Deploy RDS Aurora PostgreSQL clusters with environment-specific instance sizes using mappings:
- Dev: db.r5.large, 1 instance
- Staging: db.r5.xlarge, 2 instances (Multi-AZ)
- Prod: db.r5.2xlarge, 3 instances (Multi-AZ)
- Configure automatic backups and encryption at rest
- Set appropriate backup retention periods per environment

### 3. Conditional DeletionPolicy
Use CloudFormation conditions to set:
- Prod: DeletionPolicy: Retain (protect production data)
- Staging: DeletionPolicy: Snapshot (allow restoration)
- Dev: DeletionPolicy: Delete (clean removal)

Apply to RDS clusters, S3 buckets, and other stateful resources.

### 4. Parameter Validation
Implement parameter validation using AllowedValues:
```yaml
Parameters:
  EnvironmentType:
    Type: String
    AllowedValues:
      - dev
      - staging
      - prod
    Description: Environment type for deployment
```

### 5. Cross-Stack References with Exports
Create stack exports for:
- VPC ID
- Public subnet IDs (list)
- Private subnet IDs (list)
- Security group IDs (ALB, ECS, RDS)
- Aurora cluster endpoint
- Aurora reader endpoint

Use Fn::GetAtt and Export to make values available to other stacks.

### 6. Environment-Specific Mappings
Use mappings to define environment-specific values:
```yaml
Mappings:
  EnvironmentConfig:
    dev:
      InstanceType: t3.medium
      DesiredCount: 1
      RDSInstanceClass: db.r5.large
      AlarmThreshold: 80
    staging:
      InstanceType: t3.large
      DesiredCount: 2
      RDSInstanceClass: db.r5.xlarge
      AlarmThreshold: 75
    prod:
      InstanceType: t3.xlarge
      DesiredCount: 5
      RDSInstanceClass: db.r5.2xlarge
      AlarmThreshold: 70
```

### 7. Consistent Tagging Strategy
Apply consistent tags to ALL resources:
- Environment: (dev|staging|prod)
- CostCenter: (payments)
- Application: (payment-processor)
- ManagedBy: CloudFormation

Use Fn::Sub for dynamic tag values based on EnvironmentType parameter.

### 8. CloudWatch Alarms with Environment-Appropriate Thresholds
Configure CloudWatch alarms for:
- ECS Service CPU utilization (threshold from mappings)
- ECS Service Memory utilization (threshold from mappings)
- RDS CPU utilization (threshold from mappings)
- RDS DatabaseConnections (threshold from mappings)
- ALB Target Response Time
- ALB Unhealthy Host Count

Thresholds should vary by environment (prod: stricter, dev: relaxed).

## OPTIONAL ENHANCEMENTS (If time permits)

### AWS Config Rules (OPTIONAL: AWS Config)
Add AWS Config rules to verify environment consistency:
- Check required tags are present on all resources
- Verify encryption is enabled on RDS
- Ensure DeletionPolicy matches environment type
- Validate security group rules

### CloudFormation StackSets (OPTIONAL: StackSets)
Implement CloudFormation StackSets for multi-region deployment:
- Deploy to us-east-1 (prod), us-west-2 (staging), eu-west-1 (dev)
- Maintain consistent configuration across regions
- Enable disaster recovery capabilities

### Systems Manager Parameter Store (OPTIONAL: SSM)
Add Systems Manager Parameter Store for secure configuration:
- Store RDS credentials as SecureString parameters
- Store environment-specific configuration values
- Reference from CloudFormation using dynamic references

## Constraints

1. Use nested stacks to ensure configuration consistency across environments
2. Environment-specific parameters must be passed through a single master parameter file
3. All IAM roles must use condition keys to restrict access based on environment tags
4. CloudWatch alarms must have environment-specific thresholds defined in mappings
5. Use stack exports to share VPC and subnet IDs between environment stacks
6. Implement resource tagging strategy with mandatory Environment and CostCenter tags
7. DeletionPolicy must be set to Retain for production, Snapshot for staging, Delete for dev
8. Use CloudFormation conditions to enable/disable resources based on environment type

## Infrastructure Components

### VPC Stack (Nested)
- VPC with 3 Availability Zones
- Public subnets (3) for ALB
- Private subnets (3) for ECS tasks and RDS
- NAT Gateways (one per AZ) for private subnet egress
- Internet Gateway for public subnet access
- Route tables and associations

### Compute Stack (Nested)
- ECS Cluster
- ECS Task Definition for payment processor
- ECS Service with Fargate launch type
- Application Load Balancer
- Target Group for ECS tasks
- Security groups (ALB, ECS)
- CloudWatch Logs group for ECS tasks

### Database Stack (Nested)
- RDS Aurora PostgreSQL cluster
- Aurora instances (count based on environment)
- DB Subnet Group
- DB Parameter Group
- Security group for RDS
- KMS key for encryption at rest

## Expected Output

CloudFormation YAML templates including:
1. Master stack (master.yml) that orchestrates nested stacks
2. VPC nested stack (vpc.yml)
3. Compute nested stack (compute.yml)
4. Database nested stack (database.yml)

The infrastructure should be deployable to any environment by changing only the EnvironmentType parameter, maintaining complete consistency while allowing size variations.

## Success Criteria

1. All templates validate successfully with aws cloudformation validate-template
2. Stack can be deployed to all three environments (dev, staging, prod)
3. DeletionPolicy varies correctly by environment
4. CloudWatch alarms have appropriate thresholds per environment
5. All resources have required tags
6. Stack exports are created and can be imported by other stacks
7. Unit tests verify template structure and parameter validation
8. Integration tests confirm successful deployment and stack exports