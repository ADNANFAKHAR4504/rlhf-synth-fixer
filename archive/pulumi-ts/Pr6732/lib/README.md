# Multi-Account Migration Orchestration Framework

A comprehensive Pulumi TypeScript solution for orchestrating AWS multi-account migrations with zero downtime.

## Features

- Cross-account IAM roles with STS temporary credentials (max 1-hour sessions)
- Transit Gateway with AWS RAM sharing for network connectivity
- Step Functions state machine for migration orchestration
- EventBridge for centralized monitoring
- Systems Manager Parameter Store for metadata sharing
- Route 53 health checks for traffic shifting
- AWS Config aggregator for compliance validation
- Custom ComponentResource for migration lifecycle management
- Support for dry-run mode
- Comprehensive error handling and automatic rollback

## Architecture

### Components

1. **IAM Roles** (`iam-roles.ts`): Cross-account roles for legacy, production, staging, development, and orchestrator
2. **Transit Gateway** (`transit-gateway.ts`): Network connectivity with RAM sharing
3. **Step Functions** (`step-functions.ts`): Migration orchestrator state machine
4. **EventBridge** (`eventbridge.ts`): Centralized event monitoring
5. **Parameter Store** (`parameter-store.ts`): Metadata sharing across accounts
6. **Route 53** (`route53.ts`): Health checks for traffic shifting
7. **Config Aggregator** (`config-aggregator.ts`): Compliance validation
8. **Migration Component** (`migration-component.ts`): Custom ComponentResource

## Configuration

### Required Configuration

Create a `Pulumi.<stack>.yaml` file with the following configuration: