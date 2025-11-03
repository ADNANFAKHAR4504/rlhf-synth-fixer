# Task: IaC Program Optimization

## Problem Statement

Create a Pulumi TypeScript program to optimize and fix an existing DynamoDB infrastructure. The configuration must:

1. Refactor three existing DynamoDB tables (events, sessions, users) to use on-demand billing mode instead of provisioned capacity.
2. Implement consistent tagging across all tables with Environment, Team, and CostCenter tags.
3. Add point-in-time recovery for the users table only.
4. Configure contributor insights for the events table to identify hot partition keys.
5. Set up CloudWatch alarms for UserErrors and SystemErrors metrics on all tables.
6. Create a global secondary index on the sessions table with partition key 'userId' and sort key 'timestamp'.
7. Enable DynamoDB Streams on the events table with NEW_AND_OLD_IMAGES view type.
8. Implement proper IAM roles with least-privilege access for read and write operations.
9. Add table-level encryption using AWS managed keys for all tables.
10. Export stack outputs for table names, ARNs, and stream ARNs.

Expected output: A refactored Pulumi program that addresses all performance and operational issues, reduces costs through on-demand billing, and provides better monitoring and security controls.

## Context

A data analytics startup has an existing Pulumi TypeScript infrastructure that manages their DynamoDB tables for real-time event processing. The current implementation has performance issues, inconsistent tagging, and lacks proper monitoring, causing increased costs and operational difficulties.

## Infrastructure Details

AWS deployment in ap-southeast-2 region focusing on DynamoDB optimization. Uses three existing DynamoDB tables (events, sessions, users) that need refactoring from provisioned to on-demand billing. Requires Pulumi 3.x with TypeScript, Node.js 16+, and AWS CLI configured. Infrastructure includes CloudWatch for monitoring with alarms on key metrics, IAM roles for secure access, and DynamoDB Streams for event processing. Tables use AWS managed encryption keys.

## Constraints

- Must preserve existing table names to avoid breaking downstream applications
- CloudWatch alarms must trigger when UserErrors exceed 5 per minute
- Global secondary index on sessions table must project ALL attributes
- IAM roles must follow naming convention: dynamodb-{tableName}-{read|write}-role
- All resources must be tagged with mandatory tags: Environment, Team, CostCenter
- Use Pulumi's apply() method for any computed values in tags
- DynamoDB Streams must have a retention period of exactly 24 hours
- Contributor insights must be enabled only on the events table due to cost constraints
- Point-in-time recovery backup window must be set to 35 days for the users table
- Stack outputs must be exported with specific names: tableNames, tableArns, streamArns
