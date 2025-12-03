# Infrastructure QA and Management System

Hey there! I need help building a comprehensive AWS infrastructure compliance monitoring and resource management system using Pulumi and TypeScript. This is a hard complexity task that requires careful attention to AWS best practices, compliance standards, and operational excellence.

## What I'm Looking For

I want to create a system that helps our team maintain high-quality infrastructure by:

1. Monitoring our AWS resources for compliance with company standards
2. Automatically tagging resources with proper metadata
3. Detecting untagged or improperly configured resources
4. Generating compliance reports for audit purposes
5. Managing resource lifecycle and cleanup recommendations

## Core Requirements

### 1. Resource Tagging System

I need a robust tagging system that ensures ALL AWS resources have proper metadata:

- Environment tags (dev, staging, prod)
- Owner/Team information
- Cost center allocation
- Creation timestamp
- Project/Application name
- Compliance status

The system should detect resources missing required tags and flag them for remediation.

### 2. Compliance Monitoring

Build a compliance checker that validates:

- All S3 buckets have encryption enabled
- All S3 buckets block public access (unless explicitly whitelisted)
- EC2 instances use approved AMIs
- Security groups don't have overly permissive rules (0.0.0.0/0 access)
- IAM roles follow least-privilege principle
- Resources are in approved regions
- CloudWatch logging is enabled for critical resources

### 3. Resource Discovery and Inventory

Create a resource discovery service that:

- Scans all AWS regions we operate in
- Catalogs all resources by type (EC2, S3, RDS, Lambda, etc.)
- Tracks resource age and usage patterns
- Identifies orphaned resources (no longer needed)
- Generates inventory reports in JSON format

### 4. Automated Compliance Reports

The system should generate comprehensive reports showing:

- Total resources by type and region
- Compliance score (percentage of compliant resources)
- List of non-compliant resources with specific violations
- Recommendations for remediation
- Historical trend data (improving or degrading)

### 5. Resource Cost Tracking

Implement basic cost tracking features:

- Tag-based cost allocation
- Identify untagged resources affecting cost visibility
- Report on resource distribution by team/project
- Flag potentially expensive misconfigurations

## Technical Requirements

### AWS Services to Use

- Use AWS SDK v3 for Node.js
- Interact with EC2, S3, IAM, and CloudWatch APIs
- Use AWS Resource Groups Tagging API for bulk operations
- Implement proper pagination for large result sets
- Handle rate limiting gracefully

### Infrastructure Components

Create the following Pulumi resources:

1. **S3 Bucket for Reports**: Store compliance reports and inventory data
2. **IAM Role**: Service role with necessary permissions for resource scanning
3. **Lambda Functions** (optional): For scheduled compliance checks
4. **CloudWatch Dashboard**: Visualize compliance metrics
5. **SNS Topic**: For alerting on compliance violations

### Code Organization

Please organize the code properly:

- `lib/tap-stack.ts`: Main Pulumi stack orchestration
- `lib/compliance-checker.ts`: Compliance validation logic
- `lib/resource-scanner.ts`: AWS resource discovery
- `lib/tagging-service.ts`: Automated tagging functionality
- `lib/report-generator.ts`: Generate compliance reports
- `lib/types.ts`: TypeScript interfaces and types

### Quality Standards

This is critical infrastructure code, so please ensure:

- Full TypeScript type safety (no `any` types)
- Comprehensive error handling with proper error types
- Unit tests with 100% coverage
- Integration tests using real AWS outputs
- Proper logging and monitoring
- Rate limiting for AWS API calls
- Pagination for large result sets
- Retry logic for transient failures

## Non-Functional Requirements

### Performance

- Resource scans should complete within 5 minutes for typical environments
- Reports should generate in under 30 seconds
- API calls should implement exponential backoff

### Reliability

- Handle AWS service throttling gracefully
- Implement proper error recovery
- Log all errors with context for debugging
- No data loss in report generation

### Security

- Use IAM roles, not access keys
- Follow least-privilege principle
- Encrypt all data at rest
- Use secure transmission (HTTPS only)
- Audit all compliance check activities

### Maintainability

- Clear, self-documenting code
- Comprehensive JSDoc comments
- README with setup instructions
- Examples of running compliance checks
- Troubleshooting guide

## Example Use Cases

### Use Case 1: Daily Compliance Scan

A scheduled job runs daily to:
1. Scan all regions for resources
2. Check compliance against policies
3. Generate a report
4. Send alerts for critical violations
5. Store report in S3

### Use Case 2: New Resource Validation

When a new resource is created:
1. Verify it has required tags
2. Check compliance with policies
3. Either approve or flag for remediation
4. Log the validation result

### Use Case 3: Quarterly Audit

For audit purposes:
1. Generate comprehensive inventory
2. Export compliance history
3. Show trend analysis
4. Identify improvement areas
5. Document remediation actions

## What Success Looks Like

I'll know this is working well when:

- All resources are properly tagged with metadata
- Compliance violations are detected within 24 hours
- Reports are accurate and actionable
- The system handles 1000+ resources efficiently
- No false positives in compliance checks
- Easy to add new compliance rules
- Clear documentation for the team

## Important Notes

- Please use actual AWS SDK calls, not mock/placeholder code
- Implement proper pagination - don't assume small result sets
- Handle rate limiting - AWS APIs have strict limits
- Use accurate resource counts, not hardcoded values
- Follow TypeScript best practices throughout
- Make it production-ready, not just a demo

## Known Pitfalls to Avoid

Based on previous attempts, please avoid:

1. Creating only markdown documentation - I need actual TypeScript implementation files
2. Putting AWS SDK packages in devDependencies - they should be in dependencies
3. Using `any` type - maintain full type safety
4. Hardcoding values like "1000 resources" - use actual counts
5. Missing error type annotations
6. Unused import statements
7. Not handling pagination properly
8. Not implementing rate limiting

Thanks for helping me build this! Let me know if you need any clarification on the requirements.
