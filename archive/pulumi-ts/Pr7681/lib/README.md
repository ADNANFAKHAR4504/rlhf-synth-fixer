# IAM Policy Compliance Analyzer

This Pulumi TypeScript project deploys an automated IAM policy compliance analyzer for AWS. It scans existing IAM roles and policies, identifies security compliance issues, and generates detailed reports.

## Features

- **Comprehensive IAM Scanning**: Scans all IAM roles and their attached policies
- **Wildcard Permission Detection**: Identifies overly permissive policies on S3, DynamoDB, and RDS
- **Unused Role Identification**: Flags roles not used in 90+ days
- **Inline Policy Analysis**: Detects inline policies that should be managed policies
- **Cross-Account Access Validation**: Identifies and validates cross-account access patterns
- **Automated Reporting**: Generates JSON compliance reports stored in S3
- **CloudWatch Integration**: Custom metrics and dashboard for monitoring
- **Automated Tagging**: Tags roles with compliance status

## Prerequisites

- Node.js 18.x or later
- Pulumi CLI installed
- AWS credentials configured
- AWS account with appropriate IAM permissions

## Configuration

Create a Pulumi stack and configure the required parameter:

```bash
pulumi stack init dev
pulumi config set environmentSuffix dev123
pulumi config set aws:region us-east-1
```

## Deployment

1. Install dependencies:
```bash
npm install
cd lambda && npm install && cd ..
```

2. Build Lambda function:
```bash
cd lambda
npm run build
cd ..
```

3. Deploy the stack:
```bash
pulumi up
```

4. Note the outputs:
- `reportsBucketName`: S3 bucket containing compliance reports
- `scannerLambdaArn`: ARN of the scanner Lambda function
- `dashboardUrl`: CloudWatch dashboard URL
- `complianceNamespace`: CloudWatch namespace for metrics

## Manual Invocation

To trigger a scan manually:

```bash
aws lambda invoke --function-name iam-scanner-lambda-<environmentSuffix> output.json
```

## Compliance Report Structure

Reports are stored in S3 with the following structure:

```json
{
  "timestamp": "2024-01-15T10:30:00Z",
  "accountId": "123456789012",
  "totalRolesScanned": 150,
  "issues": [
    {
      "roleName": "MyRole",
      "issueType": "WILDCARD_PERMISSION",
      "severity": "HIGH",
      "description": "Policy grants wildcard permissions on s3",
      "recommendation": "Replace wildcard with specific actions"
    }
  ],
  "summary": {
    "compliant": 100,
    "nonCompliant": 30,
    "needsReview": 20,
    "wildcardPermissions": 15,
    "unusedRoles": 10,
    "inlinePolicies": 20,
    "crossAccountAccess": 5
  }
}
```

## Issue Types

- **WILDCARD_PERMISSION**: Policies with wildcard actions on sensitive services
- **UNUSED_ROLE**: Roles not used in 90+ days
- **INLINE_POLICY**: Inline policies that should be managed policies
- **CROSS_ACCOUNT_ACCESS**: Roles with cross-account access

## Compliance Tags

Roles are automatically tagged with:
- `ComplianceStatus`: compliant | non-compliant | needs-review
- `LastScanned`: ISO timestamp of last scan

## CloudWatch Metrics

Available in the `IAMCompliance` namespace:
- TotalRolesScanned
- CompliantRoles
- NonCompliantRoles
- NeedsReviewRoles
- WildcardPermissionsFound
- UnusedRoles
- InlinePolicies
- CrossAccountAccess

## Cleanup

To remove all resources:

```bash
pulumi destroy
```

## Security Considerations

- Lambda function uses read-only IAM permissions (except for tagging)
- Reports are encrypted at rest in S3
- S3 bucket has public access blocked
- Function uses least privilege IAM policies

## Troubleshooting

- Check Lambda logs in CloudWatch Logs
- Verify IAM permissions for the Lambda execution role
- Ensure Lambda timeout is sufficient for large accounts (configured at 300 seconds)
- Check S3 bucket permissions if report upload fails
