## Scenario

We're building a CloudWatch analytics system for an enterprise client who's dealing with about 100k interactions daily across their APIs and databases. They need proper monitoring with custom dashboards and alerts that actually work proactively.

## What We Need

The infrastructure should handle metrics from API Gateway, Lambda functions, and RDS instances. We need real-time visibility into what's happening and get notified before things go south.

Key components:

- CloudWatch Dashboards showing the metrics that matter (latency, error rates, throughput)
- Alarms set up for latency spikes and error thresholds
- SNS for sending alerts to the ops team
- DynamoDB to store aggregated logs (helps with long-term analysis)
- EventBridge to schedule metric aggregation jobs
- Proper IAM setup so services can talk to each other securely

## Things to Keep in Mind

Use Terraform for everything. We want this repeatable and version controlled.

Follow AWS best practices but keep it practical - we don't need over-engineered solutions. IAM policies should be tight (least privilege), resources need proper encryption, and everything should be tagged for cost tracking.

The system needs to handle high volume without breaking the bank, so optimize for cost where it makes sense. High availability is important but don't go overboard.

## What to Deliver

1) main.tf - core resources (CloudWatch, SNS, DynamoDB, EventBridge, and the services we're monitoring)
2) provider.tf - AWS provider config
3) variables.tf - make things configurable (region, alarm thresholds, email addresses for alerts, etc.)
4) outputs.tf - export useful stuff like dashboard URLs, alarm ARNs, SNS topic ARNs, DynamoDB table name
5) iam.tf - roles and policies
6) monitoring.tf - CloudWatch dashboards, alarms, metric filters
7) deployment-guide.md - how to actually deploy this thing (prerequisites, terraform commands, gotchas)
8) architecture-diagram.md - document the architecture and how data flows through the system

## Format

Put each file in its own code block with the filename at the top:

```hcl
# main.tf
...
