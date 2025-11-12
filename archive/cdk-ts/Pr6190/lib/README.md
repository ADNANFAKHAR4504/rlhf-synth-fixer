# Database Migration Infrastructure

## Overview

This CDK TypeScript stack provides a complete solution for migrating an RDS MySQL database to Aurora MySQL using AWS Database Migration Service (DMS). The infrastructure includes:

- **Aurora MySQL Cluster**: Production-grade cluster with one writer and one reader instance
- **DMS Replication**: Automated migration with full load and CDC (Change Data Capture)
- **Security**: KMS encryption, Secrets Manager integration, and VPC isolation
- **Monitoring**: CloudWatch alarms for task failures and replication lag
- **Validation**: Lambda function for post-migration data consistency checks

## Architecture
