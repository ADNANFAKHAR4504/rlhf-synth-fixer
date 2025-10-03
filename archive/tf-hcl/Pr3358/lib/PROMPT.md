# AWS Regulatory Reporting System - Terraform IaC Task

## Role

You are an expert AWS Solutions Architect and Terraform (HCL) specialist.

## Goal

Generate a production-ready Terraform HCL configuration that deploys a regulatory reporting system in us-east-1, processing financial data from 100 sources and generating 50 compliance reports daily with audit trails, lineage, and governance.

## Deliverable

- One self-contained HCL codebase with clear modules/resources/outputs
- Must be deployable with `terraform apply` without further editing
- Include comments explaining each major resource

## Architecture (must include)

### S3 (Data Lake)

- **IngestionBucket** for raw data with event notifications
- **ArchiveBucket** with Object Lock (compliance mode) for immutable report storage
- Versioning and encryption (KMS)

### Glue (Catalog & ETL)

- Glue Catalog with crawlers
- ETL jobs with job bookmarks for incremental loads
- Glue DataBrew for data profiling and quality rules

### Lake Formation (Governance)

- Fine-grained access control (down to column level)
- Integrated with Glue Catalog and IAM roles

### Lambda (Python 3.11)

- Data validation Lambda triggered on ingestion
- Data quality check Lambda for additional rules
- Error handling with DLQs

### Step Functions

- Workflow for compliance report generation (ETL → Validation → Athena query → Report → Archive)
- Retry policies, error catching, DLQ

### Athena

- Workgroups for cost control and performance isolation
- Queries linked to Glue Catalog

### QuickSight

- Dashboards and reports from Athena datasets
- Secure access with IAM/SSO integration

### DynamoDB (Metadata & Lineage)

- Table to store report metadata: source, timestamp, reportId, lineage, status
- GSIs for querying by source or compliance type

### Macie

- Data discovery and PII detection on S3 ingestion bucket

### Audit & Monitoring

- CloudTrail with data events for S3 (audit logging)
- CloudWatch Logs & Insights for Lambda and Step Functions analysis
- Retain audit logs 10 years

### Notifications & Delivery

- SNS for report completion notifications
- SES for emailing reports

### Security

- KMS CMKs with custom key policies for S3, Glue, Athena, DynamoDB, and QuickSight
- Secrets Manager for data source credentials
- Config rules for compliance
- All data encrypted in transit and at rest

### Scheduling

- EventBridge rule for scheduled report generation

## Functional Requirements

- Data lineage tracking using Glue + DynamoDB
- Glue job bookmarks for incremental ETL
- Lake Formation column-level permissions
- S3 Object Lock compliance mode for immutable archived reports
- Macie for PII detection
- Data quality validation: Lambda + Glue DataBrew
- CloudTrail logs retained for 10 years
- Athena workgroups for cost/performance governance

## Template Requirements

### Variables:

- region, environment (default prod), KMS key ARN, S3 bucket names, DynamoDB table name, email recipients

### Outputs:

- ingestion bucket ARN, archive bucket ARN, Glue Catalog ID, Lake Formation data lake ARN, Athena workgroup, QuickSight dashboard URL, DynamoDB table ARN, Step Functions ARN, CloudTrail ARN, SNS topic ARN

### Tags:

- Environment=prod, Compliance=Yes, Owner, CostCenter

## Output Format

Return only the Terraform HCL code (no prose), fully deployable, with comments explaining each major block.
