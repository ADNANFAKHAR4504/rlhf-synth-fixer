# Infrastructure Changes Required - MODEL_RESPONSE to IDEAL_RESPONSE

## Executive Summary

**CHANGE ASSESSMENT: 14 Infrastructure Modifications Required**

The MODEL_RESPONSE implementation requires significant architectural changes to achieve proper multi-region deployment with cross-region resource sharing, VPC peering, and Custom Resource-based configuration management. The changes focus on replacing CloudFormation exports with SSM Parameter Store, implementing Custom Resource Lambdas for asynchronous operations, and ensuring proper resource isolation and dependencies.

## Phase 1: Stack Architecture Changes

**STATUS: REQUIRED**

| Change                          | Component     | Impact | Priority |
| ------------------------------- | ------------- | ------ | -------- |
| Multi-region stack separation   | bin/tap.ts    | High   | Critical |
| Props interface simplification  | TapStackProps | Medium | High     |
| Resource naming standardization | All resources | Medium | High     |

### Required Changes

1. **Create two separate stacks in bin/tap.ts for source region (us-east-1) and target region (us-east-2) instead of a single stack. Add stack dependency with targetStack.addDependency(sourceStack). Use environmentSuffix from context instead of stackPrefix. Add Tags for Environment, Repository, and Author.**

2. **Update TapStackProps interface to use environmentSuffix, isSourceRegion, sourceRegion, and targetRegion. Remove crossRegionResources, replicationConfig, migrationPhases, logsRetentionDays, and stackPrefix props.**

3. **Use environmentSuffix for all resource naming instead of stackPrefix. Format: tap-{resource}-{environmentSuffix}. Update all resource IDs and names accordingly.**

## Phase 2: Cross-Region Resource Sharing

**STATUS: REQUIRED**

| Change                          | Component                       | Impact | Priority |
| ------------------------------- | ------------------------------- | ------ | -------- |
| Replace CloudFormation exports  | Cross-region references         | High   | Critical |
| SSM Parameter Store integration | DynamoDB table name, VPC ID     | High   | Critical |
| Custom Resource Lambda for SSM  | Target region parameter reading | Medium | High     |

### Required Changes

4. **Replace CloudFormation exports and Fn.importValue with SSM Parameter Store for cross-region value sharing. Create SSM StringParameter in source region for VPC ID at /tap/{environmentSuffix}/vpc/id. In target region, create Custom Resource Lambda (Node.js 16.x runtime) with retry logic to read SSM parameters from source region. Use Custom Resource Provider pattern to fetch values.**

5. **Create DynamoDB Global Table only in source region with replicationRegions: [targetRegion] and AWS_MANAGED encryption. In target region, use SSM Parameter Store and Custom Resource Lambda to read table name from source region instead of Fn.importValue. Create SSM StringParameter in source region for table name at /tap/{environmentSuffix}/dynamodb/table-name.**

## Phase 3: Asynchronous Resource Configuration

**STATUS: REQUIRED**

| Change                         | Component                     | Impact | Priority |
| ------------------------------ | ----------------------------- | ------ | -------- |
| S3 replication Custom Resource | S3 cross-region replication   | High   | Critical |
| VPC peering Custom Resource    | Cross-region VPC connectivity | High   | Critical |

### Required Changes

6. **Replace direct S3 replication configuration with Custom Resource Lambda (Node.js 16.x runtime). Lambda should check if target bucket exists before configuring replication. If target bucket does not exist, return success immediately to allow source stack deployment. Configure replication only when target bucket is available.**

7. **Replace CfnVPCPeeringConnection with Custom Resource Lambda (Node.js 16.x runtime) for VPC peering management. Lambda must handle creation in source region, acceptance in target region with retry logic, status polling until active, deletion of failed/rejected/expired connections with verification, reuse of existing active connections, and acceptance of pending connections. Add routes in target region private subnets with dependency on peering Custom Resource.**

## Phase 4: Network Configuration

**STATUS: REQUIRED**

| Change                    | Component            | Impact | Priority |
| ------------------------- | -------------------- | ------ | -------- |
| VPC CIDR block separation | VPC configuration    | High   | Critical |
| Route table configuration | Cross-region routing | Medium | High     |

### Required Changes

8. **Use different VPC CIDR blocks to avoid overlap: 10.0.0.0/16 for source region and 10.1.0.0/16 for target region. Set cidr property explicitly on Vpc construct. Update route destinationCidrBlock in target region to point to source VPC CIDR (10.0.0.0/16).**

## Phase 5: Security and Permissions

**STATUS: REQUIRED**

| Change                               | Component                       | Impact | Priority |
| ------------------------------------ | ------------------------------- | ------ | -------- |
| DynamoDB ReplicaProvider permissions | Cross-region replica management | Medium | High     |
| Target region Lambda permissions     | DynamoDB access                 | Medium | High     |

### Required Changes

9. **Implement CDK Aspect to grant DynamoDB ReplicaProvider IAM Role and Policy cross-region permissions for dynamodb:DeleteTableReplica and related actions. Aspect should detect ReplicaProvider roles and policies by path or name and add wildcard region permissions.**

10. **In target region, replace transactionsTable.grantReadWriteData with explicit IAM policy statements using regional table ARN (arn:aws:dynamodb:{currentRegion}:{account}:table/{tableName}). Grant permissions to regional replica of Global Table, not imported table reference.**

## Phase 6: Runtime and Configuration

**STATUS: REQUIRED**

| Change                   | Component                      | Impact | Priority |
| ------------------------ | ------------------------------ | ------ | -------- |
| Lambda runtime selection | Custom Resource vs Application | Medium | High     |
| Context simplification   | cdk.json configuration         | Low    | Medium   |
| Removal policies         | Test environment cleanup       | Low    | Medium   |

### Required Changes

11. **Use Node.js 16.x runtime for Custom Resource Lambdas (S3 replication, SSM reader, VPC peering) to support AWS SDK v2. Use Node.js 18.x runtime for application Lambdas (processor, validator).**

12. **Update Lambda environment variables to use tableNameResource.getAttString('Value') in target region instead of Fn.importValue. Include SOURCE_REGION, TARGET_REGION, and CURRENT_REGION in all Lambda functions.**

13. **Simplify cdk.json context by removing custom context values (account, emailSubscribers, crossRegionResources, replicationConfig, migrationPhases, logsRetentionDays). Keep only CDK feature flags and use environmentSuffix from context or default to 'dev'.**

14. **Update resource removal policies: set KMS key and DynamoDB table to DESTROY for test environment. Set S3 bucket autoDeleteObjects to true and removalPolicy to DESTROY. Set LogGroup removalPolicy to DESTROY.**

## Summary of Critical Changes

### High Priority Changes (Deployment Blockers)

1. Multi-region stack separation with proper dependencies
2. SSM Parameter Store replacement for CloudFormation exports
3. Custom Resource Lambda for S3 replication configuration
4. Custom Resource Lambda for VPC peering management
5. VPC CIDR block separation to avoid overlap

### Medium Priority Changes (Functionality Improvements)

6. DynamoDB Global Table with SSM-based table name sharing
7. CDK Aspect for DynamoDB ReplicaProvider permissions
8. Explicit IAM permissions for target region Lambda
9. Lambda runtime selection (Node.js 16.x for Custom Resources)
10. Lambda environment variable updates

### Low Priority Changes (Configuration Cleanup)

11. Resource naming standardization with environmentSuffix
12. cdk.json context simplification
13. Removal policy updates for test environment

## Implementation Order

1. **Phase 1**: Stack architecture and props interface changes
2. **Phase 2**: SSM Parameter Store implementation for cross-region sharing
3. **Phase 3**: Custom Resource Lambdas for S3 and VPC peering
4. **Phase 4**: Network configuration (VPC CIDR blocks)
5. **Phase 5**: Security and permissions updates
6. **Phase 6**: Runtime and configuration cleanup
