# Infrastructure Compliance Scanning System

Hey team,

We need to build an automated infrastructure compliance scanning system for our financial services company. The regulatory environment requires continuous validation of AWS resources against security standards, and we need to generate audit reports for both internal reviews and external auditors. I've been asked to create this infrastructure using **Pulumi with Python** to implement comprehensive compliance monitoring.

The business is focused on automating compliance checks across our EC2, RDS, S3, and IAM resources. Right now, compliance validation is manual and inconsistent, which creates risk during audits. We need to shift to continuous automated scanning with proper alerting and historical tracking so we can demonstrate ongoing compliance to regulators.

The solution needs to evaluate resources every 6 hours against custom compliance rules, maintain a complete history of evaluations for audit trails, alert teams immediately when resources drift out of compliance, and generate detailed JSON reports that auditors can review. The architecture should leverage AWS Config for resource tracking, Lambda for custom validation logic, DynamoDB for historical data, and S3 for report storage.

## What we need to build

Create an automated infrastructure compliance scanning system using **Pulumi with Python** for continuous AWS resource validation and audit reporting.

### Core Requirements

1. **AWS Config Setup**
   - Configure AWS Config with recording enabled for EC2, RDS, S3, and IAM resources
   - Set up configuration recorder with proper IAM service role
   - Configure delivery channel for Config data
   - Enable continuous recording of resource changes

2. **Custom Compliance Rules**
   - Deploy Lambda function to check EC2 instances for required tags
   - Deploy Lambda function to validate S3 bucket encryption is enabled
   - Deploy Lambda function to ensure RDS instances have automated backups enabled
   - Configure AWS Config custom rules that trigger these Lambda functions
   - Implement proper error handling and logging in all Lambda functions

3. **Compliance History Storage**
   - Create DynamoDB table with partition key 'resource_id' (string)
   - Configure sort key 'evaluation_timestamp' (string) for time-series queries
   - Enable point-in-time recovery for data protection
   - Store compliance evaluation results with full resource details

4. **Scheduled Evaluations**
   - Configure CloudWatch Events rule to trigger compliance evaluations every 6 hours
   - Use cron expression: `cron(0 */6 * * ? *)` for 6-hour intervals
   - Set up proper IAM permissions for CloudWatch Events to invoke Config rules
   - Ensure evaluations run reliably and capture results

5. **Compliance Alerting**
   - Create SNS topic for compliance violation notifications
   - Configure email subscription endpoint for security team
   - Set up Lambda functions to publish alerts when non-compliant resources detected
   - Include resource details and violation type in alert messages

6. **Report Generation**
   - Deploy Lambda function that aggregates compliance data from DynamoDB
   - Generate comprehensive JSON reports with all evaluation results
   - Include summary statistics (total resources, compliant count, violation count)
   - Store reports in S3 with timestamp-based naming

7. **Report Storage**
   - Create S3 bucket with versioning enabled for report history
   - Configure bucket encryption using AES-256
   - Set up lifecycle policies if needed for long-term retention
   - Apply proper IAM policies for report access control

### Technical Requirements

- All infrastructure defined using **Pulumi with Python**
- Use **AWS Config** for resource tracking and compliance evaluation
- Use **Lambda** (Python 3.9+) for custom compliance rule logic and report generation
- Use **DynamoDB** for storing compliance evaluation history
- Use **CloudWatch Events** for scheduled evaluations every 6 hours
- Use **SNS** for compliance violation alerts
- Use **S3** for compliance report storage with versioning
- Resource names must include **environmentSuffix** for uniqueness across deployments
- Follow naming convention: `resource-type-environment-suffix` (e.g., `compliance-table-dev`)
- Deploy to **us-east-1** region
- Lambda runtime: Python 3.9 or higher

### Deployment Requirements (CRITICAL)

- **environmentSuffix**: ALL resources must include environmentSuffix in their names for multi-environment support
- **Destroyability**: All resources must be destroyable with no Retain policies (RemovalPolicy.DESTROY in CDK, retain_on_delete=False in Pulumi)
- **AWS Config IAM Role**: Use the correct managed policy `arn:aws:iam::aws:policy/service-role/AWS_ConfigRole` for Config service role
- **GuardDuty Warning**: Do NOT create GuardDuty detector - only one detector allowed per account
- **Lambda Runtime**: Use Python 3.9+ to ensure compatibility with boto3 SDK v3

### Security and IAM Requirements

- Implement IAM least-privilege policies for all Lambda functions
- Config recorder IAM role with AWS_ConfigRole managed policy
- Lambda execution roles with specific permissions:
  - EC2 tag checker: ec2:DescribeInstances, ec2:DescribeTags
  - S3 encryption checker: s3:GetEncryptionConfiguration, s3:ListBuckets
  - RDS backup checker: rds:DescribeDBInstances
  - Report aggregator: dynamodb:Query, dynamodb:Scan, s3:PutObject
- SNS publish permissions for alert Lambda functions
- DynamoDB read/write permissions for compliance data storage

### Resource Tagging

Apply these tags to all resources:
- `Environment:Production`
- `Compliance:Required`
- `ManagedBy:Pulumi`

### Constraints

- All resources must be in us-east-1 region
- Lambda functions must use Python 3.9+ runtime
- CloudWatch Events schedule must be exactly 6 hours (cron expression)
- DynamoDB must use specified partition/sort keys (resource_id, evaluation_timestamp)
- S3 bucket must have versioning enabled
- No GuardDuty detector creation (account-level resource)
- All resources must be destroyable (no Retain deletion policies)
- Config recorder must use service-role/AWS_ConfigRole managed policy

## Success Criteria

- **Functionality**: AWS Config records EC2, RDS, S3, IAM resource changes continuously
- **Compliance Rules**: Three custom Lambda-based Config rules evaluate resources correctly
- **Evaluation Schedule**: CloudWatch Events trigger compliance checks every 6 hours
- **Historical Tracking**: DynamoDB stores all evaluation results with proper keys
- **Alerting**: SNS sends notifications for non-compliant resources
- **Reporting**: Lambda aggregates compliance data and generates JSON reports
- **Report Storage**: S3 stores versioned compliance reports
- **Security**: All Lambda functions use least-privilege IAM roles
- **Resource Naming**: All resources include environmentSuffix
- **Tagging**: Environment:Production, Compliance:Required, ManagedBy:Pulumi applied
- **Destroyability**: All resources can be destroyed without issues
- **Code Quality**: Clean Python code, proper error handling, comprehensive tests

## What to deliver

- Complete Pulumi Python implementation in lib/ directory
- AWS Config setup with configuration recorder and delivery channel
- Three Lambda functions for custom compliance rules (EC2 tags, S3 encryption, RDS backups)
- One Lambda function for report aggregation
- DynamoDB table with correct partition/sort keys
- CloudWatch Events rule with 6-hour schedule
- SNS topic with email subscription configuration
- S3 bucket with versioning enabled
- IAM roles with least-privilege policies for all components
- Proper error handling and logging in all Lambda functions
- Unit tests for all components
- README documentation with deployment instructions
- Exports: Config recorder name, DynamoDB table name, SNS topic ARN, S3 bucket name
