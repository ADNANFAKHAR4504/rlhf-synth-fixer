# Disaster Recovery Infrastructure - MODEL RESPONSE

Complete Pulumi Python implementation for active-passive DR across us-east-1 and us-east-2.

## Architecture Overview

Primary Region (us-east-1): Aurora primary, Lambda, API Gateway, S3
DR Region (us-east-2): Aurora secondary, Lambda, API Gateway, S3
Global: Route 53 failover, DynamoDB global tables, CloudWatch cross-region monitoring

All resource names include environment_suffix for deployment isolation.

## Implementation Files

The infrastructure is organized using Pulumi's ComponentResource pattern with separate modules for primary region, DR region, and global resources.

See extracted code files in lib/ directory for complete implementation.
