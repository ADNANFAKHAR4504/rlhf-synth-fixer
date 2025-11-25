# Infrastructure Requirements: Automated Compliance Scanner with Enterprise Features

## Platform and Language (MANDATORY)

**Platform**: Pulumi
**Language**: TypeScript
**Version Requirements**: Pulumi 3.x, TypeScript 4.x+, Node.js 18+

## Background

A financial services company has discovered configuration drift and compliance violations across their multi-region AWS infrastructure. They need an automated analysis tool that can scan their existing resources, identify security misconfigurations, and generate actionable reports for their DevOps team to remediate issues before their upcoming SOC2 audit.

After the initial implementation was deemed too simple, they now require enterprise-grade features including workflow orchestration, security posture management, and automated remediation capabilities.

## Core Infrastructure Requirements (Baseline)

### 1. Multi-Region Resource Scanning Lambda

Deploy a Lambda function that scans AWS resources across three regions: **us-east-1, eu-west-1, ap-southeast-1**.

**Specifications**:
- Runtime: Node.js 18
- Memory: 1024 MB
- Timeout: 5 minutes (300 seconds)
- Enable X-Ray tracing for performance monitoring
- Use AWS Config and AWS APIs to scan resources
- Scan for:
  - Unencrypted S3 buckets
  - Public RDS instances
  - Overly permissive security groups
  - Missing encryption on DynamoDB tables
  - Lambda functions without reserved concurrency
  - CloudWatch Logs without KMS encryption

**IAM Permissions** (least-privilege, no wildcards):
- `config:DescribeConfigRules`
- `config:GetComplianceDetailsByConfigRule`
- `s3:GetBucketEncryption`
- `s3:GetBucketPublicAccessBlock`
- `rds:DescribeDBInstances`
- `ec2:DescribeSecurityGroups`
- `dynamodb:DescribeTable`
- `lambda:GetFunction`
- `logs:DescribeLogGroups`

### 2. Scan History DynamoDB Table

Create a DynamoDB table to track all scan executions and their results.

**Specifications**:
- Table name: `compliance-scan-history-{environmentSuffix}`
- Partition key: `scanId` (String)
- Sort key: `timestamp` (Number)
- Billing mode: ON_DEMAND (to control costs)
- Point-in-time recovery: Enabled
- Encryption: AWS managed KMS key
- Attributes:
  - `scanId`: Unique identifier for each scan
  - `timestamp`: Unix timestamp of scan execution
  - `region`: Region scanned
  - `violationCount`: Number of violations found
  - `resourcesScanned`: Total resources analyzed
  - `status`: COMPLETED | FAILED | IN_PROGRESS

**Global Secondary Indexes**:
- GSI name: `region-timestamp-index`
- Partition key: `region`
- Sort key: `timestamp`

### 3. Compliance Reports S3 Bucket

Store detailed compliance reports in JSON format with versioning enabled.

**Specifications**:
- Bucket name: `compliance-reports-{environmentSuffix}`
- Versioning: Enabled
- Encryption: Server-side encryption using KMS (customer-managed key)
- Public access: Blocked (all public access settings enabled)
- Object structure: `YYYY/MM/DD/scan-{scanId}.json`

**Report Format**:
```json
{
  "scanId": "uuid",
  "timestamp": 1234567890,
  "region": "us-east-1",
  "summary": {
    "total_resources": 150,
    "violations": 12,
    "critical": 3,
    "high": 5,
    "medium": 4
  },
  "violations": [
    {
      "resource_id": "arn:aws:s3:::my-bucket",
      "resource_type": "S3_BUCKET",
      "violation_type": "MISSING_ENCRYPTION",
      "severity": "CRITICAL",
      "description": "S3 bucket does not have encryption enabled",
      "remediation": "Enable server-side encryption using AWS KMS"
    }
  ]
}
```

### 4. EventBridge Scheduled and On-Demand Scanning

Configure EventBridge rules to trigger compliance scans.

**Specifications**:
- **Scheduled Rule**: Daily scans at 2 AM UTC
  - Rule name: `compliance-scanner-daily-{environmentSuffix}`
  - Schedule expression: `cron(0 2 * * ? *)`
  - Target: Scanner Lambda function
  - Input: `{"scanType": "scheduled", "regions": ["us-east-1", "eu-west-1", "ap-southeast-1"]}`

- **On-Demand Rule**: Custom event pattern for manual triggers
  - Rule name: `compliance-scanner-ondemand-{environmentSuffix}`
  - Event pattern:
    ```json
    {
      "source": ["custom.compliance"],
      "detail-type": ["Scan Request"],
      "detail": {
        "scanType": ["manual"]
      }
    }
    ```
  - Target: Scanner Lambda function

### 5. Violation Analysis Lambda

Second Lambda function to analyze scan results and identify critical violations.

**Specifications**:
- Runtime: Node.js 18
- Memory: 512 MB
- Timeout: 2 minutes (120 seconds)
- Trigger: S3 event notification when new report uploaded
- Logic:
  - Read compliance report from S3
  - Categorize violations by severity
  - Identify trends (compare with previous scans)
  - Generate actionable recommendations
  - Update DynamoDB with analysis results

### 6. SNS Alert Topics

Create SNS topics for alerting security team on critical findings.

**Specifications**:
- Topic name: `compliance-critical-alerts-{environmentSuffix}`
- Encryption: AWS managed key
- Email subscriptions: security-team@company.com
- Message format: JSON with violation details
- Dead letter queue: SQS queue for failed deliveries

**Alert Conditions**:
- Any CRITICAL severity violation
- More than 10 HIGH severity violations in single scan
- Scanner Lambda failures
- Analysis Lambda failures

### 7. CloudWatch Dashboards

Generate dashboards showing compliance trends and metrics.

**Specifications**:
- Dashboard name: `ComplianceScanner-{environmentSuffix}`
- Widgets:
  - **Violation Trends**: Line graph of violations over time (30 days)
  - **Resource Coverage**: Pie chart of resources scanned by service
  - **Violation Counts by Service**: Bar chart (S3, RDS, EC2, etc.)
  - **Scanner Performance**: Lambda duration and error rates
  - **Regional Distribution**: Violations per region

**Metrics**:
- Custom namespace: `ComplianceScanner`
- Metrics:
  - `ViolationCount` (dimensions: Region, Severity, Service)
  - `ResourcesScanned` (dimensions: Region, Service)
  - `ScanDuration` (dimensions: Region)
  - `ScanErrors` (dimensions: Region, ErrorType)

### 8. CloudWatch Logs Insights Integration

Export scan results in CloudWatch Logs Insights-compatible format.

**Specifications**:
- Log group: `/aws/lambda/compliance-scanner-{environmentSuffix}`
- Retention: 30 days (exactly, for compliance)
- Format: Structured JSON logs
- Sample query:
  ```
  fields @timestamp, violation_type, severity, resource_id
  | filter severity = "CRITICAL"
  | stats count() by resource_type
  ```

### 9. Lambda Layers

Create Lambda layers for shared analysis logic and AWS SDK optimizations.

**Specifications**:
- **Layer 1**: `compliance-analysis-utils-{environmentSuffix}`
  - Content: Common violation detection logic
  - Size: < 10 MB
  - Compatible runtimes: nodejs18.x

- **Layer 2**: `aws-sdk-optimized-{environmentSuffix}`
  - Content: AWS SDK v3 with only required clients
  - Size: < 15 MB
  - Clients: S3, DynamoDB, Config, RDS, EC2

### 10. CloudWatch Alarms

Set up alarms for scanner failures and performance degradation.

**Alarms**:
- **Scanner Lambda Errors**: > 2 errors in 5 minutes → SNS alert
- **Analysis Lambda Errors**: > 2 errors in 5 minutes → SNS alert
- **Scan Duration**: > 4 minutes → SNS alert
- **DynamoDB Throttling**: > 0 throttled requests → SNS alert

### 11. Resource Tagging

Tag all resources with mandatory compliance tags.

**Required Tags**:
- `Environment`: production | staging | development
- `Owner`: security-team
- `CostCenter`: security-operations
- `Compliance`: soc2-audit
- `Application`: compliance-scanner

---

## Enhancement Requirements (Category A - Significant Features)

### ENHANCEMENT 1: AWS Systems Manager (SSM) Integration

#### Parameter Store Configuration Management

Store all scanner configuration in AWS Systems Manager Parameter Store (hierarchical structure).

**Parameters**:
- `/compliance/scanner/config/regions` (String)
  - Value: `["us-east-1", "eu-west-1", "ap-southeast-1"]`
  - Type: String
  - Description: JSON array of regions to scan

- `/compliance/scanner/config/thresholds` (StringList)
  - Values:
    - `critical_violation_threshold=5`
    - `high_violation_threshold=10`
    - `medium_violation_threshold=20`
  - Type: StringList
  - Description: Compliance thresholds for alerting

- `/compliance/scanner/config/remediation-enabled` (String)
  - Value: `true` | `false`
  - Type: String
  - Description: Enable/disable automatic remediation

- `/compliance/scanner/config/scan-resources` (String)
  - Value: `{"s3": true, "rds": true, "ec2": true, "lambda": true, "dynamodb": true}`
  - Type: String
  - Description: JSON object of resources to scan

- `/compliance/scanner/secrets/security-hub-api-key` (SecureString)
  - Type: SecureString
  - Description: API key for Security Hub integration
  - KMS key: Customer-managed key

**Implementation**:
- Scanner Lambda reads configuration from Parameter Store at startup
- Use `aws-sdk` GetParameter and GetParametersByPath APIs
- Cache parameters for 5 minutes to reduce API calls
- Implement parameter change notifications via EventBridge

#### SSM Automation Documents for Remediation

Create SSM Automation documents for automated remediation of common violations.

**Automation Document 1**: `AWS-RemediateUnencryptedS3Bucket`
```yaml
schemaVersion: "0.3"
description: "Automatically enable encryption on unencrypted S3 bucket"
parameters:
  BucketName:
    type: String
    description: "Name of the S3 bucket to remediate"
  KmsKeyId:
    type: String
    description: "KMS key ID for bucket encryption"
mainSteps:
  - name: EnableBucketEncryption
    action: aws:executeAwsApi
    inputs:
      Service: s3
      Api: PutBucketEncryption
      Bucket: "{{ BucketName }}"
      ServerSideEncryptionConfiguration:
        Rules:
          - ApplyServerSideEncryptionByDefault:
              SSEAlgorithm: "aws:kms"
              KMSMasterKeyID: "{{ KmsKeyId }}"
            BucketKeyEnabled: true
  - name: VerifyEncryption
    action: aws:executeAwsApi
    inputs:
      Service: s3
      Api: GetBucketEncryption
      Bucket: "{{ BucketName }}"
    outputs:
      - Name: EncryptionStatus
        Selector: "$.ServerSideEncryptionConfiguration.Rules[0].ApplyServerSideEncryptionByDefault.SSEAlgorithm"
        Type: String
```

**Automation Document 2**: `AWS-RemediatePublicRDSInstance`
```yaml
schemaVersion: "0.3"
description: "Modify RDS instance to remove public accessibility"
parameters:
  DBInstanceIdentifier:
    type: String
    description: "RDS instance identifier"
mainSteps:
  - name: ModifyDBInstance
    action: aws:executeAwsApi
    inputs:
      Service: rds
      Api: ModifyDBInstance
      DBInstanceIdentifier: "{{ DBInstanceIdentifier }}"
      PubliclyAccessible: false
      ApplyImmediately: true
```

**Automation Document 3**: `AWS-RemediateOverlyPermissiveSecurityGroup`
```yaml
schemaVersion: "0.3"
description: "Revoke 0.0.0.0/0 ingress rules from security group"
parameters:
  SecurityGroupId:
    type: String
    description: "Security group ID to remediate"
mainSteps:
  - name: DescribeSecurityGroup
    action: aws:executeAwsApi
    inputs:
      Service: ec2
      Api: DescribeSecurityGroups
      GroupIds:
        - "{{ SecurityGroupId }}"
    outputs:
      - Name: IngressRules
        Selector: "$.SecurityGroups[0].IpPermissions"
        Type: MapList
  - name: RevokeIngressRules
    action: aws:executeAwsApi
    inputs:
      Service: ec2
      Api: RevokeSecurityGroupIngress
      GroupId: "{{ SecurityGroupId }}"
      IpPermissions: "{{ DescribeSecurityGroup.IngressRules }}"
```

**Remediation Lambda**:
- Function name: `compliance-auto-remediate-{environmentSuffix}`
- Runtime: Node.js 18
- Memory: 256 MB
- Timeout: 5 minutes
- Trigger: SNS topic (critical violations)
- Logic:
  - Receive violation details from SNS
  - Check if remediation is enabled (Parameter Store)
  - Execute appropriate SSM Automation document
  - Log remediation action to DynamoDB
  - Send remediation report via SNS

### ENHANCEMENT 2: Step Functions Orchestration

Replace the simple EventBridge → Lambda pattern with a sophisticated Step Functions state machine.

**State Machine Name**: `ComplianceScannerWorkflow-{environmentSuffix}`

**Workflow Definition** (ASL - Amazon States Language):
```json
{
  "Comment": "Multi-region compliance scanning workflow with parallel execution and error handling",
  "StartAt": "ReadConfiguration",
  "States": {
    "ReadConfiguration": {
      "Type": "Task",
      "Resource": "arn:aws:lambda:REGION:ACCOUNT:function:config-reader",
      "ResultPath": "$.config",
      "Next": "ParallelRegionScan",
      "Retry": [
        {
          "ErrorEquals": ["States.TaskFailed"],
          "IntervalSeconds": 2,
          "MaxAttempts": 3,
          "BackoffRate": 2.0
        }
      ],
      "Catch": [
        {
          "ErrorEquals": ["States.ALL"],
          "ResultPath": "$.error",
          "Next": "NotifyFailure"
        }
      ]
    },
    "ParallelRegionScan": {
      "Type": "Parallel",
      "ResultPath": "$.scanResults",
      "Next": "AggregateResults",
      "Branches": [
        {
          "StartAt": "ScanUsEast1",
          "States": {
            "ScanUsEast1": {
              "Type": "Map",
              "ItemsPath": "$.config.services",
              "ResultPath": "$.usEast1Results",
              "MaxConcurrency": 5,
              "Iterator": {
                "StartAt": "ScanService",
                "States": {
                  "ScanService": {
                    "Type": "Task",
                    "Resource": "arn:aws:lambda:us-east-1:ACCOUNT:function:resource-scanner",
                    "Parameters": {
                      "region": "us-east-1",
                      "service.$": "$.serviceName"
                    },
                    "End": true,
                    "Retry": [
                      {
                        "ErrorEquals": ["ThrottlingException"],
                        "IntervalSeconds": 5,
                        "MaxAttempts": 5,
                        "BackoffRate": 2.0
                      }
                    ]
                  }
                }
              },
              "End": true
            }
          }
        },
        {
          "StartAt": "ScanEuWest1",
          "States": {
            "ScanEuWest1": {
              "Type": "Map",
              "ItemsPath": "$.config.services",
              "ResultPath": "$.euWest1Results",
              "MaxConcurrency": 5,
              "Iterator": {
                "StartAt": "ScanService",
                "States": {
                  "ScanService": {
                    "Type": "Task",
                    "Resource": "arn:aws:lambda:eu-west-1:ACCOUNT:function:resource-scanner",
                    "Parameters": {
                      "region": "eu-west-1",
                      "service.$": "$.serviceName"
                    },
                    "End": true,
                    "Retry": [
                      {
                        "ErrorEquals": ["ThrottlingException"],
                        "IntervalSeconds": 5,
                        "MaxAttempts": 5,
                        "BackoffRate": 2.0
                      }
                    ]
                  }
                }
              },
              "End": true
            }
          }
        },
        {
          "StartAt": "ScanApSoutheast1",
          "States": {
            "ScanApSoutheast1": {
              "Type": "Map",
              "ItemsPath": "$.config.services",
              "ResultPath": "$.apSoutheast1Results",
              "MaxConcurrency": 5,
              "Iterator": {
                "StartAt": "ScanService",
                "States": {
                  "ScanService": {
                    "Type": "Task",
                    "Resource": "arn:aws:lambda:ap-southeast-1:ACCOUNT:function:resource-scanner",
                    "Parameters": {
                      "region": "ap-southeast-1",
                      "service.$": "$.serviceName"
                    },
                    "End": true,
                    "Retry": [
                      {
                        "ErrorEquals": ["ThrottlingException"],
                        "IntervalSeconds": 5,
                        "MaxAttempts": 5,
                        "BackoffRate": 2.0
                      }
                    ]
                  }
                }
              },
              "End": true
            }
          }
        }
      ],
      "Catch": [
        {
          "ErrorEquals": ["States.ALL"],
          "ResultPath": "$.error",
          "Next": "PartialScanFailure"
        }
      ]
    },
    "AggregateResults": {
      "Type": "Task",
      "Resource": "arn:aws:lambda:REGION:ACCOUNT:function:results-aggregator",
      "ResultPath": "$.aggregated",
      "Next": "AnalyzeViolations"
    },
    "AnalyzeViolations": {
      "Type": "Task",
      "Resource": "arn:aws:lambda:REGION:ACCOUNT:function:violation-analyzer",
      "ResultPath": "$.analysis",
      "Next": "CheckViolationThreshold"
    },
    "CheckViolationThreshold": {
      "Type": "Choice",
      "Choices": [
        {
          "Variable": "$.analysis.criticalCount",
          "NumericGreaterThan": 0,
          "Next": "TriggerCriticalAlert"
        },
        {
          "Variable": "$.analysis.highCount",
          "NumericGreaterThan": 10,
          "Next": "TriggerHighAlert"
        }
      ],
      "Default": "StoreCleanReport"
    },
    "TriggerCriticalAlert": {
      "Type": "Task",
      "Resource": "arn:aws:states:::sns:publish",
      "Parameters": {
        "TopicArn": "arn:aws:sns:REGION:ACCOUNT:compliance-critical-alerts",
        "Message.$": "$.analysis"
      },
      "ResultPath": "$.alertSent",
      "Next": "TriggerRemediation"
    },
    "TriggerRemediation": {
      "Type": "Task",
      "Resource": "arn:aws:lambda:REGION:ACCOUNT:function:auto-remediate",
      "Parameters": {
        "violations.$": "$.analysis.criticalViolations"
      },
      "ResultPath": "$.remediation",
      "Next": "UpdateDashboard",
      "Catch": [
        {
          "ErrorEquals": ["States.ALL"],
          "ResultPath": "$.remediationError",
          "Next": "UpdateDashboard"
        }
      ]
    },
    "TriggerHighAlert": {
      "Type": "Task",
      "Resource": "arn:aws:states:::sns:publish",
      "Parameters": {
        "TopicArn": "arn:aws:sns:REGION:ACCOUNT:compliance-high-alerts",
        "Message.$": "$.analysis"
      },
      "ResultPath": "$.alertSent",
      "Next": "UpdateDashboard"
    },
    "StoreCleanReport": {
      "Type": "Task",
      "Resource": "arn:aws:states:::s3:putObject",
      "Parameters": {
        "Bucket": "compliance-reports-ENV",
        "Key.$": "$.analysis.reportKey",
        "Body.$": "$.analysis.report"
      },
      "ResultPath": "$.stored",
      "Next": "UpdateDashboard"
    },
    "UpdateDashboard": {
      "Type": "Task",
      "Resource": "arn:aws:lambda:REGION:ACCOUNT:function:dashboard-updater",
      "Parameters": {
        "metrics.$": "$.analysis.metrics"
      },
      "ResultPath": "$.dashboardUpdate",
      "End": true
    },
    "PartialScanFailure": {
      "Type": "Task",
      "Resource": "arn:aws:states:::sns:publish",
      "Parameters": {
        "TopicArn": "arn:aws:sns:REGION:ACCOUNT:compliance-scanner-errors",
        "Message": "Partial scan failure occurred"
      },
      "Next": "UpdateDashboard"
    },
    "NotifyFailure": {
      "Type": "Task",
      "Resource": "arn:aws:states:::sns:publish",
      "Parameters": {
        "TopicArn": "arn:aws:sns:REGION:ACCOUNT:compliance-scanner-errors",
        "Message": "Compliance scan workflow failed"
      },
      "End": true
    }
  }
}
```

**Key Features**:
- **Parallel State**: Scan all 3 regions simultaneously (reduces total scan time by 66%)
- **Map State**: Iterate over each AWS service type within each region
- **Choice State**: Branch based on violation severity
- **Retry Configuration**: Exponential backoff for transient failures (3 retries with 2x backoff)
- **Catch Configuration**: Graceful error handling with notification
- **X-Ray Tracing**: Enable for entire workflow execution
- **CloudWatch Integration**: Log all state transitions

**EventBridge Trigger**:
- Replace direct Lambda invocation with Step Functions StartExecution
- Rule target: Step Functions state machine ARN
- Input transformer: Convert EventBridge event to state machine input

**Monitoring**:
- CloudWatch metrics for execution duration, failures, throttling
- SNS notifications on workflow failures
- Execution history retained for 90 days

### ENHANCEMENT 3: AWS Security Hub Integration

Integrate with AWS Security Hub to centralize security findings and map to compliance frameworks.

**Security Hub Setup**:
- Enable Security Hub in all 3 regions (us-east-1, eu-west-1, ap-southeast-1)
- Enable standards:
  - AWS Foundational Security Best Practices v1.0.0
  - CIS AWS Foundations Benchmark v1.4.0
  - PCI DSS v3.2.1
- Aggregate findings to us-east-1 (central region)
- Create custom product integration: `custom/compliance-scanner`

**ASFF Finding Format**:
```typescript
interface SecurityHubFinding {
  SchemaVersion: "2018-10-08";
  Id: string; // Unique finding ID
  ProductArn: string; // arn:aws:securityhub:REGION:ACCOUNT:product/custom/compliance-scanner
  ProductName: "Compliance Scanner";
  CompanyName: "Financial Services Inc";
  GeneratorId: string; // Scanner Lambda ARN
  AwsAccountId: string;
  Types: string[]; // ["Software and Configuration Checks/AWS Security Best Practices"]
  FirstObservedAt: string; // ISO 8601 timestamp
  LastObservedAt: string;
  CreatedAt: string;
  UpdatedAt: string;
  Severity: {
    Label: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "INFORMATIONAL";
    Normalized: number; // 0-100
    Original: string;
  };
  Confidence: number; // 0-100
  Criticality: number; // 0-100
  Title: string;
  Description: string;
  Remediation: {
    Recommendation: {
      Text: string;
      Url: string;
    };
  };
  ProductFields: {
    ScanId: string;
    Region: string;
    ResourceType: string;
  };
  Resources: Array<{
    Type: string; // "AwsS3Bucket", "AwsRdsDbInstance", etc.
    Id: string; // ARN
    Partition: "aws";
    Region: string;
    Details: any; // Resource-specific details
  }>;
  Compliance: {
    Status: "PASSED" | "FAILED" | "WARNING" | "NOT_AVAILABLE";
    RelatedRequirements: string[]; // ["PCI DSS v3.2.1/3.4", "CIS AWS v1.4.0/2.1.5"]
    StatusReasons: Array<{
      ReasonCode: string;
      Description: string;
    }>;
  };
  RecordState: "ACTIVE" | "ARCHIVED";
  Workflow: {
    Status: "NEW" | "NOTIFIED" | "RESOLVED" | "SUPPRESSED";
  };
  WorkflowState: "NEW" | "ASSIGNED" | "IN_PROGRESS" | "DEFERRED" | "RESOLVED";
  Note: {
    Text: string;
    UpdatedBy: string;
    UpdatedAt: string;
  };
}
```

**Compliance Mapping**:

Violation: **Unencrypted S3 Bucket**
- CIS AWS v1.4.0: Control 2.1.1 "Ensure S3 bucket encryption is enabled"
- PCI DSS v3.2.1: Requirement 3.4 "Render PAN unreadable anywhere it is stored"
- NIST 800-53: SC-28 "Protection of Information at Rest"
- AWS FSBP: S3.4 "S3 buckets should have server-side encryption enabled"

Violation: **Public RDS Instance**
- CIS AWS v1.4.0: Control 2.3.1 "Ensure RDS instances are not publicly accessible"
- PCI DSS v3.2.1: Requirement 1.2.1 "Restrict inbound and outbound traffic"
- NIST 800-53: AC-4 "Information Flow Enforcement"
- AWS FSBP: RDS.2 "RDS DB instances should prohibit public access"

Violation: **Overly Permissive Security Group (0.0.0.0/0)**
- CIS AWS v1.4.0: Control 5.1 "Ensure no security groups allow ingress from 0.0.0.0/0 to port 22"
- PCI DSS v3.2.1: Requirement 1.3.1 "Implement DMZ to limit inbound traffic"
- NIST 800-53: AC-3 "Access Enforcement"
- AWS FSBP: EC2.18 "Security groups should not allow unrestricted access to ports with high risk"

**Security Hub Lambda Integration**:
- Function name: `security-hub-publisher-{environmentSuffix}`
- Runtime: Node.js 18
- Memory: 256 MB
- Timeout: 2 minutes
- Trigger: S3 event (new compliance report uploaded)
- Logic:
  - Read compliance report from S3
  - Convert each violation to ASFF format
  - Batch import findings to Security Hub (max 100 per batch)
  - Update finding workflow state
  - Create custom insights for compliance trends

**Custom Insights**:
- Insight name: "Critical Compliance Violations by Service"
  - Group by: `ProductFields.ResourceType`
  - Filters: `Severity.Label = CRITICAL`, `RecordState = ACTIVE`

- Insight name: "PCI DSS Compliance Status"
  - Group by: `Compliance.Status`
  - Filters: `Compliance.RelatedRequirements contains "PCI DSS"`

- Insight name: "Unresolved Findings by Region"
  - Group by: `Resources.Region`
  - Filters: `Workflow.Status != RESOLVED`

**IAM Permissions** (Security Hub Lambda):
- `securityhub:BatchImportFindings`
- `securityhub:BatchUpdateFindings`
- `securityhub:GetFindings`
- `securityhub:CreateInsight`

### ENHANCEMENT 4: S3 Lifecycle and Intelligent Tiering

Implement sophisticated S3 lifecycle policies and Intelligent-Tiering for cost optimization.

**Compliance Reports Bucket Lifecycle Policy**:
```typescript
const lifecycleRules = [
  {
    id: "transition-to-ia",
    status: "Enabled",
    transitions: [
      {
        days: 30,
        storageClass: "STANDARD_IA" // Infrequent Access after 30 days
      },
      {
        days: 90,
        storageClass: "INTELLIGENT_TIERING" // Auto-optimization after 90 days
      },
      {
        days: 365,
        storageClass: "GLACIER_DEEP_ARCHIVE" // Long-term retention after 1 year
      }
    ]
  },
  {
    id: "delete-old-versions",
    status: "Enabled",
    noncurrentVersionTransitions: [
      {
        noncurrentDays: 30,
        storageClass: "GLACIER"
      }
    ],
    noncurrentVersionExpiration: {
      noncurrentDays: 90 // Delete old versions after 90 days
    }
  },
  {
    id: "expire-incomplete-multipart-uploads",
    status: "Enabled",
    abortIncompleteMultipartUpload: {
      daysAfterInitiation: 7
    }
  }
];
```

**Intelligent-Tiering Configuration**:
```typescript
const intelligentTieringConfig = {
  id: "compliance-reports-tiering",
  status: "Enabled",
  tierings: [
    {
      days: 90,
      accessTier: "ARCHIVE_ACCESS" // Archive tier after 90 days of no access
    },
    {
      days: 180,
      accessTier: "DEEP_ARCHIVE_ACCESS" // Deep Archive after 180 days of no access
    }
  ]
};
```

**S3 Access Logging**:
- Target bucket: `compliance-scanner-access-logs-{environmentSuffix}`
- Log object key prefix: `access-logs/`
- Format: S3 server access logs format
- Purpose: Track who accessed compliance reports and when

**S3 Object Lock** (Compliance Mode):
```typescript
const objectLockConfig = {
  objectLockEnabled: "Enabled",
  rule: {
    defaultRetention: {
      mode: "COMPLIANCE", // Cannot be deleted even by root
      years: 7 // 7-year retention for financial compliance
    }
  }
};
```

**S3 Bucket Metrics**:
- Enable storage class analysis
- Export to S3 Analytics for cost optimization recommendations
- Track access patterns with CloudWatch metrics

**Cost Optimization**:
- STANDARD (0-30 days): $0.023/GB/month
- STANDARD_IA (31-90 days): $0.0125/GB/month (46% savings)
- INTELLIGENT_TIERING (91-365 days): Auto-optimized (up to 75% savings)
- GLACIER_DEEP_ARCHIVE (365+ days): $0.00099/GB/month (95% savings)

**Estimated Savings**:
- 1 TB of compliance reports per year
- Without lifecycle: $23/month × 12 = $276/year
- With lifecycle: $15/month average = $180/year
- Savings: $96/year (35% reduction)

**Athena Integration** (for Access Logs):
```sql
CREATE EXTERNAL TABLE compliance_access_logs (
  bucket_owner STRING,
  bucket STRING,
  request_datetime STRING,
  remote_ip STRING,
  requester STRING,
  request_id STRING,
  operation STRING,
  key STRING,
  request_uri STRING,
  http_status INT,
  error_code STRING,
  bytes_sent BIGINT
)
ROW FORMAT SERDE 'org.apache.hadoop.hive.serde2.RegexSerDe'
WITH SERDEPROPERTIES (
  'serialization.format' = '1',
  'input.regex' = '([^ ]*) ([^ ]*) \\[(.*?)\\] ([^ ]*) ([^ ]*) ([^ ]*) ([^ ]*) ([^ ]*) (\"[^\"]*\"|-) ([^ ]*) ([^ ]*) ([^ ]*) ([^ ]*) ([^ ]*) ([^ ]*) (\"[^\"]*\"|-) ([^ ]*)(?: ([^ ]*) ([^ ]*) ([^ ]*) ([^ ]*) ([^ ]*) ([^ ]*))?.*$'
)
LOCATION 's3://compliance-scanner-access-logs-ENV/access-logs/';
```

**Access Pattern Queries**:
```sql
-- Top 10 most accessed compliance reports
SELECT key, COUNT(*) as access_count
FROM compliance_access_logs
WHERE operation = 'REST.GET.OBJECT'
GROUP BY key
ORDER BY access_count DESC
LIMIT 10;

-- Access by time of day
SELECT HOUR(from_iso8601_timestamp(request_datetime)) as hour,
       COUNT(*) as requests
FROM compliance_access_logs
GROUP BY HOUR(from_iso8601_timestamp(request_datetime))
ORDER BY hour;
```

---

## Deployment Environment

**Regions**: us-east-1 (primary), eu-west-1, ap-southeast-1
**Primary Region**: us-east-1 (for centralized aggregation)

**AWS Services Required**:
- Lambda
- DynamoDB
- S3
- EventBridge
- SNS
- CloudWatch
- IAM
- KMS
- AWS Systems Manager (Parameter Store, Automation)
- AWS Step Functions
- AWS Security Hub
- Amazon Athena (for S3 access log analysis)

**Version Requirements**:
- Pulumi CLI: 3.x
- TypeScript: 4.x or higher
- Node.js: 18.x
- AWS Provider: Latest

---

## Critical Constraints

1. **Platform Compliance**: Must use **Pulumi with TypeScript** (non-negotiable)

2. **Resource Naming**: All resources MUST include `environmentSuffix` parameter
   - Format: `{resource-name}-{environmentSuffix}`
   - Example: `compliance-scanner-prod`, `compliance-reports-staging`

3. **IAM Least-Privilege**: No wildcard permissions (`*`) allowed
   - Specify exact actions and resources
   - Use resource ARNs in IAM policies

4. **Encryption Requirements**:
   - S3: Server-side encryption with KMS (customer-managed keys)
   - DynamoDB: AWS managed KMS keys
   - Lambda environment variables: KMS encryption if containing secrets
   - CloudWatch Logs: KMS encryption

5. **X-Ray Tracing**: MUST be enabled on all Lambda functions

6. **CloudWatch Logs Retention**: Exactly 30 days (compliance requirement)

7. **DynamoDB Billing**: ON_DEMAND mode only (to control costs)

8. **Resource Tagging**: All resources MUST have these tags:
   - `Environment`
   - `Owner`
   - `CostCenter`
   - `Compliance`
   - `Application`

9. **Lambda Timeout Limits**:
   - Scanner Lambda: 5 minutes maximum
   - Analysis Lambda: 2 minutes maximum

10. **Multi-Region Scanning**: MUST scan all 3 regions (us-east-1, eu-west-1, ap-southeast-1)

11. **Parameter Store Configuration**: All scanner configuration MUST be stored in Parameter Store (no hardcoded values)

12. **Step Functions Integration**: EventBridge MUST trigger Step Functions (not direct Lambda invocation)

13. **Security Hub Publishing**: All compliance violations MUST be published to Security Hub in ASFF format

14. **S3 Lifecycle Policies**: Compliance reports MUST follow the defined lifecycle transitions

15. **SSM Automation Documents**: MUST create automation documents for S3 encryption, RDS public access, and security group remediation

---

## Expected Outputs

The Pulumi program must export the following stack outputs:

1. `scannerLambdaArn`: ARN of the scanner Lambda function
2. `analysisLambdaArn`: ARN of the analysis Lambda function
3. `remediationLambdaArn`: ARN of the remediation Lambda function
4. `scanHistoryTableName`: Name of the DynamoDB scan history table
5. `complianceReportsBucket`: Name of the S3 compliance reports bucket
6. `accessLogsBucket`: Name of the S3 access logs bucket
7. `criticalAlertTopicArn`: ARN of the SNS critical alerts topic
8. `dashboardUrl`: URL to the CloudWatch dashboard
9. `stepFunctionArn`: ARN of the Step Functions state machine
10. `securityHubProductArn`: ARN of the custom Security Hub product
11. `parameterStorePrefix`: Parameter Store hierarchical prefix
12. `automationDocuments`: List of SSM Automation document names

---

## Success Criteria

The infrastructure deployment is considered successful when:

1. All Lambda functions deploy without errors
2. DynamoDB table is created with correct schema
3. S3 buckets are created with encryption and lifecycle policies
4. EventBridge rules are created and enabled
5. SNS topics have email subscriptions configured
6. CloudWatch dashboard displays all widgets correctly
7. CloudWatch alarms are in OK state
8. All resources are tagged appropriately
9. IAM policies follow least-privilege principle
10. X-Ray tracing is enabled and functional
11. **Parameter Store contains all configuration parameters**
12. **SSM Automation documents are created and executable**
13. **Step Functions state machine deploys and passes validation**
14. **Security Hub is enabled with custom product integration**
15. **S3 lifecycle policies are active**
16. **Intelligent-Tiering configuration is enabled**
17. Test execution: Trigger manual scan via EventBridge custom event
18. Verify: Scan completes, results stored in S3, alerts sent via SNS, findings published to Security Hub
19. Performance: Entire scan workflow completes in < 10 minutes
20. Cost: Infrastructure operates within budget constraints
21. Compliance: All resources meet SOC2 audit requirements

---

## Notes

- This is an **ENHANCEMENT ITERATION** of a previously completed task
- Goal: Increase training quality from 5/10 to ≥8/10 by adding significant enterprise features
- All baseline requirements MUST be implemented
- All 4 enhancement features MUST be implemented
- Focus on demonstrating complex AWS integrations and enterprise patterns
- Maintain 100% test coverage requirement
- Follow all AWS best practices
- Document all architectural decisions in code comments
