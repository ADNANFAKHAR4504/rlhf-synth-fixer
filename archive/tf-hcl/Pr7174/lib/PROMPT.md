Hey team,

We've got a request from a financial services client who's dealing with the pain of manual infrastructure compliance reviews. They're trying to meet SOC 2 requirements but their current approach is eating up time and introducing errors. They need something automated that can continuously monitor their Terraform-deployed resources against security policies.

The business wants us to build an automated infrastructure compliance analysis system that scans their AWS resources across multiple regions. They're particularly focused on EC2 instances, RDS databases, and S3 buckets. The compliance checks need to happen automatically and alert them when something's out of policy.

I've been asked to create this using **Terraform with HCL** to keep everything infrastructure-as-code and reproducible.

## What we need to build

Create an automated compliance scanning system using **Terraform with HCL** that monitors AWS infrastructure against security policies for SOC 2 compliance.

### Core Requirements

1. **AWS Config Deployment**
   - Deploy AWS Config with custom rules across all regions
   - Scan EC2 instances, RDS databases, and S3 buckets
   - Enable Config recording for EC2, RDS, S3, and IAM resource types only
   - Implement Config aggregator to collect data from us-east-1, us-west-2, and eu-west-1
   - Config rules must evaluate resources within 15 minutes of creation or modification

2. **Lambda-Based Compliance Evaluation**
   - Create Lambda functions using Python 3.9 runtime
   - Evaluate compliance rules for encryption, tagging, and backup policies
   - Functions must use ARM-based Graviton2 processors for cost optimization
   - Configure 30-second timeout limits to prevent runaway executions
   - Configure Lambda functions to run compliance checks every 6 hours

3. **Compliance Data Storage**
   - Configure S3 bucket with versioning enabled
   - Store Config snapshots and compliance reports
   - Use SSE-S3 encryption and block all public access
   - Use unique S3 prefixes for each region to avoid conflicts

4. **Notification System**
   - Set up SNS topic for non-compliant resource notifications
   - Configure email subscription for alerts

5. **IAM Security**
   - Create IAM roles with least-privilege policies for Config
   - Create IAM roles with least-privilege policies for Lambda execution
   - Follow AWS security best practices

### Technical Requirements

- All infrastructure defined using **Terraform with HCL**
- Use **AWS Config** for continuous compliance monitoring
- Use **Lambda** with Python 3.9 for custom compliance rules
- Use **S3** for storing compliance snapshots and reports
- Use **SNS** for alerting on non-compliant resources
- Multi-region deployment: us-east-1, us-west-2, eu-west-1
- Resource names must include **environmentSuffix** for uniqueness
- Follow naming convention: resource-type-environment-suffix
- Use Terraform data sources to dynamically fetch AWS account ID and region
- All resources must be destroyable (no Retain policies)
- Include proper error handling and logging

### Deployment Requirements (CRITICAL)

- All resources MUST include environmentSuffix parameter for unique naming
- RemovalPolicy must be set to DESTROY (no RETAIN policies allowed)
- AWS Config: Use correct IAM policy service-role/AWS_ConfigRole for Config service
- AWS Config: Do not create GuardDuty detector (account-level limit of one detector)
- Lambda functions: Node.js 18+ requires AWS SDK v3 (not bundled by default)

### Constraints

- Lambda functions must use ARM-based Graviton2 processors
- Lambda functions must have 30-second timeout limits
- Config rules evaluate resources within 15 minutes
- S3 bucket must use SSE-S3 encryption
- S3 bucket must block all public access
- Config delivery channel must use unique S3 prefixes per region
- VPC endpoints required for private Lambda execution
- Service Control Policies should allow Config and Lambda operations

### Optional Enhancements

If time permits, consider these additions:
- EventBridge rules to trigger immediate scans on resource changes (enables real-time compliance)
- Systems Manager Parameter Store for storing compliance thresholds (improves configuration management)
- Step Functions workflow for multi-stage compliance remediation (adds automated remediation)

## Success Criteria

- **Functionality**: AWS Config deployed and recording in all three regions
- **Compliance Evaluation**: Lambda functions successfully evaluate encryption, tagging, and backup policies
- **Data Collection**: Config aggregator collecting data from all regions
- **Alerting**: SNS notifications sent when resources are non-compliant
- **Security**: IAM roles follow least-privilege principle
- **Storage**: S3 bucket properly configured with versioning and encryption
- **Resource Naming**: All resources include environmentSuffix for uniqueness
- **Code Quality**: HCL code is well-structured, tested, and documented
- **Multi-region**: Solution works across us-east-1, us-west-2, and eu-west-1

## What to deliver

- Complete Terraform HCL implementation
- AWS Config configuration for multi-region deployment
- Lambda functions in Python 3.9 for compliance evaluation
- S3 bucket configuration for compliance data storage
- SNS topic and subscription setup
- IAM roles and policies
- Config aggregator setup
- Documentation and deployment instructions
- Unit tests for Lambda functions
