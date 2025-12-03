# Infrastructure QA and Management System

A comprehensive AWS infrastructure compliance monitoring and resource management system built with Pulumi and TypeScript.

## Overview

This system provides automated compliance checking, resource tagging, and inventory management for AWS infrastructure. It helps teams maintain high-quality infrastructure by detecting violations, enforcing tagging standards, and generating detailed compliance reports.

## Features

- **Automated Compliance Monitoring**: Validates resources against security and operational policies
- **Resource Discovery**: Scans all AWS regions for resources with proper pagination
- **Intelligent Tagging**: Automatically applies and standardizes resource tags
- **Comprehensive Reporting**: Generates detailed compliance reports in multiple formats (JSON, HTML, Text)
- **Rate Limiting**: Implements AWS API rate limiting to avoid throttling
- **Error Recovery**: Robust error handling with proper context

## Architecture

### Core Components

1. **ResourceScanner** (`resource-scanner.ts`): Discovers AWS resources across all regions
2. **ComplianceChecker** (`compliance-checker.ts`): Validates resources against compliance policies
3. **TaggingService** (`tagging-service.ts`): Manages resource tagging operations
4. **ReportGenerator** (`report-generator.ts`): Creates compliance and inventory reports
5. **TapStack** (`tap-stack.ts`): Main Pulumi infrastructure stack

### AWS Resources Created

- **S3 Bucket**: Stores compliance reports and inventory data with encryption and versioning
- **IAM Role**: Service role with permissions for resource scanning and tagging
- **SNS Topic**: Alerts for critical compliance violations
- **CloudWatch Log Group**: Operational logs for compliance activities
- **CloudWatch Dashboard**: Visualizes compliance metrics

## Prerequisites

- Node.js >= 20.0.0
- AWS CLI configured with appropriate credentials
- Pulumi CLI installed
- TypeScript 5.x

## Installation

```bash
# Install dependencies
npm install

# Build the project
npm run build

# Run tests
npm test
```

## Deployment

### Using Pulumi

```bash
# Configure Pulumi backend (if not already configured)
export PULUMI_CONFIG_PASSPHRASE="your-passphrase"
export PULUMI_BACKEND_URL="file://~/.pulumi"  # Or use Pulumi cloud

# Deploy the stack
pulumi up --yes --stack dev

# View outputs
pulumi stack output --json
```

### Environment Variables

Required environment variables:

```bash
export AWS_REGION=us-east-1
export ENVIRONMENT_SUFFIX=dev
export REPOSITORY=your-repo
export COMMIT_AUTHOR=your-name
export PR_NUMBER=123
export TEAM=your-team
```

## Usage

### Running Compliance Scan

```typescript
import { ResourceScanner } from './lib/resource-scanner';
import { ComplianceChecker } from './lib/compliance-checker';
import { ReportGenerator } from './lib/report-generator';
import { ResourceType, ScannerConfig } from './lib/types';

// Configure scanner
const config: ScannerConfig = {
  regions: ['us-east-1', 'us-west-2'],
  resourceTypes: [
    ResourceType.S3_BUCKET,
    ResourceType.EC2_INSTANCE,
    ResourceType.RDS_INSTANCE,
    ResourceType.LAMBDA_FUNCTION,
  ],
  maxConcurrentRequests: 5,
};

// Scan resources
const scanner = new ResourceScanner(config);
const resources = await scanner.scanAllResources();

// Check compliance
const checker = new ComplianceChecker();
const report = await checker.checkResources(resources);

// Generate report
const generator = new ReportGenerator();
const jsonReport = generator.generateComplianceReport(report);
console.log(jsonReport);
```

### Applying Tags

```typescript
import { TaggingService } from './lib/tagging-service';
import { RequiredTags } from './lib/types';

const taggingService = new TaggingService('us-east-1');

const defaultTags: Partial<RequiredTags> = {
  Environment: 'prod',
  Team: 'platform',
  Owner: 'ops-team',
  Project: 'infrastructure-qa',
};

const results = await taggingService.applyRequiredTags(resources, defaultTags);
console.log(`Tagged ${results.filter(r => r.success).length} resources`);
```

### Generating Inventory

```typescript
import { ResourceScanner } from './lib/resource-scanner';
import { ReportGenerator, ReportFormat } from './lib/report-generator';

const scanner = new ResourceScanner(config);
const resources = await scanner.scanAllResources();

const complianceStatuses = new Map();
const inventory = await scanner.generateInventory(resources, complianceStatuses);

const generator = new ReportGenerator();
const htmlReport = generator.generateInventoryReport(inventory, ReportFormat.HTML);
```

## Compliance Policies

### Built-in Policies

1. **Required Tags**: Ensures all resources have Environment, Owner, Team, Project, and CreatedAt tags
2. **S3 Encryption**: Validates S3 buckets have encryption enabled
3. **S3 Public Access**: Ensures S3 buckets block public access
4. **Security Group Rules**: Detects overly permissive security group rules (0.0.0.0/0)
5. **CloudWatch Logging**: Verifies critical resources have logging enabled
6. **Approved Regions**: Ensures resources are only in approved AWS regions

### Whitelisting Resources

To exempt a resource from specific compliance checks, add appropriate tags:

```bash
# Allow public access on S3 bucket
aws s3api put-bucket-tagging --bucket my-bucket --tagging 'TagSet=[{Key=PublicAccessAllowed,Value=true}]'

# Allow open security group
aws ec2 create-tags --resources sg-12345 --tags Key=PublicAccessApproved,Value=true
```

## Testing

```bash
# Run all tests
npm test

# Run unit tests only
npm run test:unit

# Run integration tests
npm run test:integration

# Check test coverage
npm test -- --coverage
```

## Configuration

### Pulumi Configuration

The stack accepts the following configuration parameters:

```yaml
environmentSuffix: dev  # Environment name (dev, staging, prod)
tags:
  Environment: dev
  Team: platform
  Project: infrastructure-qa
```

### Scanner Configuration

Customize the resource scanner behavior:

```typescript
const config: ScannerConfig = {
  regions: ['us-east-1', 'us-west-2', 'eu-west-1'],
  resourceTypes: [
    ResourceType.S3_BUCKET,
    ResourceType.EC2_INSTANCE,
    // Add more resource types
  ],
  excludeResourceIds: ['ignore-this-resource-id'],
  maxConcurrentRequests: 5,  // Rate limiting
  timeout: 30000,  // 30 seconds
};
```

## Monitoring

### CloudWatch Logs

All compliance operations are logged to CloudWatch Logs:

```bash
aws logs tail /aws/compliance/dev --follow
```

### CloudWatch Dashboard

View the compliance dashboard in AWS Console:

```
https://console.aws.amazon.com/cloudwatch/home?region=us-east-1#dashboards:name=compliance-dev
```

### SNS Alerts

Subscribe to compliance alerts:

```bash
aws sns subscribe --topic-arn arn:aws:sns:us-east-1:123456789012:compliance-alerts-dev --protocol email --notification-endpoint your-email@example.com
```

## Troubleshooting

### Rate Limiting Issues

If you encounter AWS API throttling:

1. Reduce `maxConcurrentRequests` in scanner configuration
2. Add delays between API calls
3. Use AWS service quotas to request limit increases

### Missing Permissions

Ensure the IAM role has these permissions:

- `ReadOnlyAccess` (AWS managed policy)
- `tag:*` permissions for resource tagging
- `s3:PutObject` for report storage
- `logs:*` for CloudWatch logging

### Resource Not Found Errors

Some resources may be inaccessible due to:

- Cross-account resources (not in your account)
- Deleted resources (stale references)
- Regional availability (resource not in scanned region)

The scanner handles these gracefully and continues with other resources.

## Best Practices

1. **Scheduled Scans**: Run compliance scans daily or weekly
2. **Tagging Standards**: Enforce consistent tagging across all resources
3. **Incremental Remediation**: Fix critical violations first, then work through lower priorities
4. **Report Storage**: Store reports in S3 for historical trend analysis
5. **Team Ownership**: Assign clear ownership for compliance remediation

## Contributing

When adding new features:

1. Add unit tests with 100% coverage
2. Update documentation
3. Follow TypeScript best practices
4. Use proper error handling with `ComplianceError`
5. Implement rate limiting for AWS API calls

## License

MIT

## Support

For issues or questions:

- Check CloudWatch Logs for detailed error messages
- Review compliance reports for specific violation details
- Consult AWS documentation for service-specific requirements
