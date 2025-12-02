# Infrastructure Compliance Scanner

## Objective
Create a Pulumi TypeScript program to scan existing AWS infrastructure and generate a compliance report for resource tagging.

## Requirements

The configuration must:

1. Query all EC2 instances, RDS databases, and S3 buckets across the current AWS account.
2. Check each resource for the presence of mandatory tags: Environment, Owner, CostCenter, and Project.
3. Generate a detailed report showing compliant resources, non-compliant resources, and missing tag details.
4. Calculate the percentage of compliance for each resource type.
5. Export the findings to a JSON file with timestamp.
6. Create a summary dashboard showing total resources scanned and compliance rates.
7. Flag any resources that have been running for more than 90 days without proper tags.
8. Group non-compliant resources by AWS service for easier remediation.
9. Include resource creation dates and regions in the analysis.
10. Provide recommendations for fixing non-compliant resources.

## Subtask
Infrastructure QA and Management

## Category
Infrastructure Analysis/Monitoring
