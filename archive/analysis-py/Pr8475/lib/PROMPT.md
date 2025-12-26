Hey team,

We need to build an infrastructure compliance scanner that analyzes our existing AWS resources in production. The security and compliance teams have been asking for automated visibility into our EC2 infrastructure, and we need something that can run regularly to catch issues before they become problems. I've been asked to create this using TypeScript with Pulumi, leveraging the AWS SDK to scan existing resources rather than creating new ones.

The goal is to identify common compliance violations across our EC2 fleet - things like unencrypted volumes, overly permissive security groups, missing mandatory tags, unapproved AMIs, and disabled monitoring. We also need to track compliance metrics in CloudWatch so the operations team can set up dashboards and alerts.

This is essentially a read-only infrastructure scanner that generates comprehensive compliance reports. It needs to be thorough but also fast enough to run in CI/CD pipelines or as scheduled Lambda functions.

## What we need to build

Create an AWS infrastructure compliance scanner using Pulumi with TypeScript that analyzes existing resources and identifies violations.

The scanner needs to check EC2 instances for unencrypted EBS volumes. Iterate through all instances in the region, examine their attached volumes, and flag any that aren't encrypted. Report should include the volume IDs and which instance they're attached to.

For security groups, we need to validate that no EC2 instance security groups have unrestricted inbound access on sensitive ports. Check for rules allowing 0.0.0.0/0 on SSH port 22, RDP port 3389, and MySQL port 3306. If found, report the security group ID, the rule details, and which instances are using that group. This is critical because we've had incidents where developers accidentally opened these ports publicly during testing.

Tag compliance is another requirement. Every EC2 instance must have Environment, Owner, and CostCenter tags for our billing and governance processes. Scan all instances and report which ones are missing these tags, along with details on what's missing. Our finance team needs this for cost allocation.

AMI validation should check if instances are running approved AMIs. We maintain a list of approved AMI IDs that have passed our security hardening process. Flag any instance using an AMI not on the approved list, including the current AMI ID and instance details. Unapproved AMIs haven't gone through our security review and could have vulnerabilities or misconfigurations.

Check SSM agent status for all EC2 instances. We need the agent installed and running for patch management and remote access. Query the Systems Manager API to verify agent connectivity and online status. Report instances where the agent is disconnected or missing entirely.

VPC flow logs need to be enabled on all VPCs for security monitoring and incident response. Check each VPC in the region to verify flow logs are configured and active. If not enabled, report the VPC ID so we can remediate. Our security team reviews these logs for suspicious network patterns.

The scanner should generate a structured JSON report with all findings. Include resource IDs, violation type, severity level, and timestamp for each issue discovered. Organize findings by resource type and compliance check category. Output can go to an S3 bucket or local file system depending on how it's deployed.

Export compliance metrics to CloudWatch so ops can build dashboards and set up alerts. Calculate compliance percentage by resource type - like what percent of EC2 instances have encrypted volumes, what percent have all required tags, and so on. Track total resources scanned, violations found, and overall compliance rate. This gives leadership visibility into our security posture over time.

Build this with Pulumi and TypeScript, using AWS SDK v3 for all the resource queries. Default to us-east-1 but make the region configurable. Any resources created for the scanner itself should include an environmentSuffix parameter in the name for uniqueness across environments. Keep the infrastructure minimal since this is mainly a scanning tool, not a deployment.

Make sure to handle AWS API rate limits gracefully with exponential backoff and retry logic. Support pagination when querying large resource sets - some of our accounts have hundreds of instances. Use least-privilege IAM permissions, only read access to EC2, SSM, VPC, and CloudWatch. No hardcoded credentials, follow standard AWS credential chain.

Error handling is important - if a permission is missing or a resource is unavailable, log it but continue scanning other resources. We don't want one failure to block the entire scan. The JSON report must be valid and parseable by downstream tools we're integrating with.

Target execution time under 5 minutes for environments with up to 100 instances. This needs to run in CI/CD without causing timeouts.

Deliver a complete Pulumi TypeScript implementation with all the scanning logic, report generation, and CloudWatch metrics export. Include unit tests for the core scanning functions. Add deployment documentation covering how to set it up and run it. Make sure everything is destroyable - no DeletionPolicy=Retain settings that would leave resources behind.

The security team will review the implementation to ensure we're following AWS best practices for read-only access and handling sensitive compliance data appropriately.
