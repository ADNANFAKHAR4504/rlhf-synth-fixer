Hey team,

We've got a compliance problem across our AWS accounts. Our finance and security teams keep asking about resource tagging, and right now we have no good way to answer them. Resources are being created without proper tags, making it impossible to track costs by project or identify resource owners. We need visibility into what's compliant and what's not.

I've been tasked with building a compliance scanner that can look across our EC2 instances, RDS databases, and S3 buckets to check if they have the mandatory tags we require. The business wants this built as a **Pulumi with TypeScript** program so it fits into our existing infrastructure-as-code workflow.

The goal is simple: scan our existing AWS resources and tell us which ones are properly tagged and which ones need attention. We need this data exported in a format that our ops team can use to remediate issues, and we want to track compliance percentages over time.

## What we need to build

Create a compliance scanning system using **Pulumi with TypeScript** that analyzes existing AWS infrastructure and generates tagging compliance reports.

### Core Requirements

1. **Resource Discovery**
   - Query all EC2 instances across the account
   - Query all RDS databases (both instances and clusters)
   - Query all S3 buckets
   - Collect resource metadata including creation dates and regions

2. **Tag Compliance Checking**
   - Check each resource for mandatory tags: Environment, Owner, CostCenter, Project
   - Identify which specific tags are missing on non-compliant resources
   - Calculate compliance percentage for each resource type
   - Flag resources running more than 90 days without proper tags

3. **Reporting and Analysis**
   - Generate detailed report showing compliant vs non-compliant resources
   - Group non-compliant resources by AWS service for easier remediation
   - Export findings to JSON file with timestamp
   - Create summary dashboard with total resources scanned and compliance rates
   - Provide actionable recommendations for fixing non-compliant resources

### Technical Requirements

- All code using **Pulumi with TypeScript**
- Use AWS SDK to query existing resources (not create new ones)
- Resource naming must include **environmentSuffix** for uniqueness
- Follow naming convention: `{resource-type}-environment-suffix`
- Deploy to **us-east-1** region (default)
- Handle pagination for large resource sets
- Include proper error handling for API failures
- Support filtering by region if needed

### Constraints

- Read-only operations (no resource modifications)
- Must handle resources across multiple regions if specified
- Efficient API usage (minimize AWS API calls)
- All outputs must be destroyable (no Retain policies)
- Report generation should complete within reasonable time
- Support running as scheduled task or on-demand

## Success Criteria

- **Functionality**: Successfully queries EC2, RDS, and S3 resources across account
- **Accuracy**: Correctly identifies missing tags and calculates compliance percentages
- **Performance**: Completes scan within reasonable timeframe (under 5 minutes for typical account)
- **Reliability**: Handles API errors and rate limits gracefully
- **Reporting**: Generates clear, actionable reports in JSON format
- **Resource Naming**: All resources include environmentSuffix
- **Code Quality**: TypeScript, well-tested, documented

## What to deliver

- Complete Pulumi TypeScript implementation
- Resource scanning logic for EC2, RDS, S3
- Tag compliance validation engine
- Report generation with JSON export
- Summary dashboard with compliance metrics
- Remediation recommendations
- Unit tests for all components
- Documentation and usage instructions
