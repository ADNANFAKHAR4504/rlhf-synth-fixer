# Multi-Environment Infrastructure with Drift Detection

This Pulumi TypeScript project implements a multi-environment deployment system with automated drift detection and configuration validation for a fintech payment processing platform.

## Architecture Overview

The infrastructure is organized into reusable component resources with TypeScript interfaces to enforce configuration consistency:

- **DatabaseComponent**: Aurora PostgreSQL 15.4 clusters with customer-managed KMS encryption
- **LambdaComponent**: Containerized Lambda functions with VPC integration and environment-specific resources
- **SecretsComponent**: Secrets Manager with 30-day automatic rotation
- **MonitoringComponent**: CloudWatch alarms and log groups with environment-specific thresholds
- **NetworkingStack**: Stack references for importing VPC and subnet resources
- **ConfigManifest**: JSON drift detection manifest with SHA-256 hash generation
- **ValidationUtils**: Custom validation functions that fail deployment on configuration drift

## Prerequisites

- Pulumi CLI 3.x or later
- Node.js 18.x or later
- TypeScript 5.x
- AWS CLI configured with appropriate credentials
- Docker for building Lambda container images
- Pre-provisioned networking stacks in each environment (dev, staging, prod)

## Project Structure

```
.
├── bin/
│   └── tap.ts                    # Entry point with environment configuration
├── lib/
│   ├── tap-stack.ts              # Main stack orchestration
│   ├── components/
│   │   ├── database.ts           # Aurora PostgreSQL component
│   │   ├── lambda.ts             # Lambda function component
│   │   ├── secrets.ts            # Secrets Manager component
│   │   ├── monitoring.ts         # CloudWatch monitoring component
│   │   └── networking.ts         # Stack reference component
│   ├── utils/
│   │   ├── validation.ts         # Configuration validation functions
│   │   └── manifest.ts           # Drift detection manifest generation
│   └── lambda/
│       └── payment-processor/    # Lambda function code
│           ├── index.js
│           ├── Dockerfile
│           └── package.json
├── Pulumi.yaml                   # Project configuration with local backend
├── Pulumi.dev.yaml               # Dev environment config
├── Pulumi.staging.yaml           # Staging environment config
└── Pulumi.prod.yaml              # Prod environment config
```

## Environment-Specific Configuration

Each environment has specific configuration requirements enforced by validation functions:

### Development (us-east-2)
- Lambda: 1024MB memory, 0.5 vCPU
- Database: db.t4g.medium (1 instance)
- Error threshold: 10
- Latency threshold: 5000ms

### Staging (us-west-2)
- Lambda: 2048MB memory, 1 vCPU
- Database: db.r6g.large (1 instance)
- Error threshold: 5
- Latency threshold: 3000ms

### Production (us-east-1)
- Lambda: 4096MB memory, 2 vCPU
- Database: db.r6g.large (2 instances for HA)
- Error threshold: 3
- Latency threshold: 2000ms

## Setup and Deployment

### 1. Install Dependencies

```bash
npm install
```

### 2. Build and Push Lambda Container Image

```bash
cd lib/lambda/payment-processor
docker build -t payment-processor:latest .
docker tag payment-processor:latest 123456789012.dkr.ecr.us-east-1.amazonaws.com/payment-processor:latest
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin 123456789012.dkr.ecr.us-east-1.amazonaws.com
docker push 123456789012.dkr.ecr.us-east-1.amazonaws.com/payment-processor:latest
```

### 3. Initialize Pulumi Stack

```bash
# Development
pulumi stack init dev

# Staging
pulumi stack init staging

# Production
pulumi stack init prod
```

### 4. Deploy to Environment

```bash
# Development
pulumi stack select dev
pulumi up

# Staging
pulumi stack select staging
pulumi up

# Production
pulumi stack select prod
pulumi up
```

## Configuration Validation

The project includes compile-time and runtime validation to prevent configuration drift:

### Compile-Time Validation
- TypeScript interfaces enforce type safety on configuration objects
- Environment-specific interfaces ensure correct property types
- Import statements validate component dependencies

### Runtime Validation
Validation functions in `lib/utils/validation.ts` enforce:

- Lambda memory must be 1024MB (dev), 2048MB (staging), or 4096MB (prod)
- Lambda CPU must be 0.5 vCPU (dev), 1 vCPU (staging), or 2 vCPU (prod)
- Database instance classes must be db.t4g.medium (dev) or db.r6g.large (staging/prod)
- Regions must match environment expectations
- Monitoring thresholds must be within acceptable ranges

**Validation occurs at deployment time and will fail the deployment if configurations drift beyond allowed parameters.**

## Drift Detection

Each deployment generates a configuration manifest with SHA-256 hash for drift detection:

### Manifest Structure

```json
{
  "environment": "prod",
  "timestamp": "2025-11-25T18:00:00.000Z",
  "configuration": {
    "lambda": { "memory": 4096, "cpu": 2 },
    "database": { "instanceClass": "db.r6g.large", "engineVersion": "15.4" },
    "secrets": { "rotationDays": 30 },
    "backup": { "retentionDays": 7 },
    "logging": { "retentionDays": 30 },
    "encryption": { "kmsEnabled": true },
    "docker": { "imageUri": "123456789012.dkr.ecr.us-east-1.amazonaws.com/payment-processor:latest" }
  },
  "configHash": "abc123..."
}
```

### Comparing Manifests Across Environments

```bash
# Export manifests
pulumi stack output configManifest --stack dev > dev-manifest.json
pulumi stack output configManifest --stack staging > staging-manifest.json
pulumi stack output configManifest --stack prod > prod-manifest.json

# Compare hashes
jq '.configHash' dev-manifest.json
jq '.configHash' staging-manifest.json
jq '.configHash' prod-manifest.json
```

### CI/CD Integration

The manifest can be used in CI/CD pipelines to:
- Validate environment parity before deployments
- Detect unexpected configuration changes
- Generate deployment approval requirements based on drift
- Audit configuration history

## Stack References

The project uses Pulumi stack references to import networking resources from separate stacks:

```typescript
const networkStack = new pulumi.StackReference('organization/networking-stack/dev');
const vpcId = networkStack.getOutput('vpcId');
const privateSubnetIds = networkStack.getOutput('privateSubnetIds');
const publicSubnetIds = networkStack.getOutput('publicSubnetIds');
const availabilityZones = networkStack.getOutput('availabilityZones');
```

### Prerequisites for Stack References

Networking stacks must be deployed first and export:
- `vpcId`: VPC identifier
- `privateSubnetIds`: Array of private subnet IDs (3 AZs)
- `publicSubnetIds`: Array of public subnet IDs (3 AZs)
- `availabilityZones`: Array of availability zone names

Update `Pulumi.{env}.yaml` with correct stack reference format:
```yaml
TapStack:networkingStackRef: organization/networking-stack/{environment}
```

## Monitoring and Alarms

CloudWatch alarms are configured for each environment:

### Lambda Alarms
- **Errors**: Triggers when error count exceeds threshold (dev: 10, staging: 5, prod: 3)
- **Duration**: Triggers when average duration exceeds threshold (dev: 5000ms, staging: 3000ms, prod: 2000ms)

### Database Alarms
- **CPU Utilization**: Triggers when average CPU exceeds 80%
- **Database Connections**: Triggers when connections exceed threshold (dev/staging: 100, prod: 200)

All alarms send notifications to environment-specific SNS topics.

### Log Groups

CloudWatch log groups with 30-day retention:
- `/aws/lambda/payment-processor-{environmentSuffix}`: Lambda function logs
- `/aws/application/{environment}-{environmentSuffix}`: Application logs

## Secrets Management

Database credentials are managed through AWS Secrets Manager:

### Features
- 30-day automatic rotation schedule (identical across all environments)
- Zero-day recovery window for full destroyability
- Rotation Lambda function with proper IAM permissions
- Secrets naming convention: `{environment}-db-credentials-{environmentSuffix}`

### Accessing Secrets

Lambda functions access secrets through environment variables:
```javascript
const secretArn = process.env.DB_SECRET_ARN;
const secretData = await secretsManager.getSecretValue({ SecretId: secretArn }).promise();
const credentials = JSON.parse(secretData.SecretString);
```

## Resource Naming Convention

All resources include the environmentSuffix parameter for uniqueness:

```
{resource-type}-{environment}-{environmentSuffix}

Examples:
- aurora-cluster-dev-001
- lambda-sg-staging-001
- db-key-prod-001
```

## Destroyability

All resources are configured to be fully destroyable without manual intervention:

- **Aurora clusters**: `skipFinalSnapshot: true`, `deletionProtection: false`
- **Secrets**: `recoveryWindowInDays: 0` (immediate deletion)
- **KMS keys**: `deletionWindowInDays: 7` (minimum for testing)
- **No RETAIN policies**: All resources use default deletion behavior

### Cleanup

```bash
pulumi destroy
```

This command will remove all resources without requiring manual cleanup steps.

## Stack Outputs

Each stack exports the following outputs:

- `databaseEndpoint`: Aurora cluster writer endpoint
- `lambdaFunctionArn`: Lambda function ARN
- `secretArn`: Database secret ARN
- `configManifest`: Full configuration manifest object
- `configHash`: SHA-256 hash of configuration
- `environmentName`: Current environment name (dev/staging/prod)
- `environmentSuffixOutput`: Environment suffix used for resource naming

### Viewing Outputs

```bash
pulumi stack output
pulumi stack output databaseEndpoint
pulumi stack output configHash
```

## Troubleshooting

### Validation Errors

If deployment fails with validation errors:

1. **Check environment configuration**: Verify stack name matches expected environment (dev, staging, prod)
2. **Verify region**: Ensure region in `Pulumi.{env}.yaml` matches expected region for environment
3. **Review configuration values**: Confirm Lambda memory/CPU and database instance class match environment requirements

Example error:
```
Error: Dev environment must use 1024MB Lambda memory, got 2048
```

Fix by updating `bin/tap.ts` environment configuration.

### Stack Reference Errors

If stack references fail:

1. **Verify networking stack is deployed**: `pulumi stack ls` in networking project
2. **Check stack reference format**: Must be `organization/networking-stack/{environment}`
3. **Ensure required exports exist**: Run `pulumi stack output` in networking stack to verify exports

Example error:
```
Error: failed to resolve stack reference
```

Fix by updating `TapStack:networkingStackRef` in `Pulumi.{env}.yaml`.

### Lambda Container Errors

If Lambda deployment fails:

1. **Verify ECR repository exists**: `aws ecr describe-repositories`
2. **Check Docker image is pushed**: `aws ecr list-images --repository-name payment-processor`
3. **Ensure correct IAM permissions**: Lambda execution role needs ECR read access

### KMS Key Permissions

If database encryption fails:

1. **Verify KMS key policy**: Key must allow RDS service to use it
2. **Check IAM permissions**: Deployment role needs KMS permissions
3. **Review key deletion window**: Minimum 7 days for testing, 30 days for production

## Security Considerations

### IAM Policies

- All IAM roles use inline policies (no AWS managed policies)
- Principle of least privilege enforced
- Secrets Manager access limited to specific secret ARNs
- VPC security groups restrict traffic to internal networks only

### Encryption

- Aurora clusters use customer-managed KMS keys
- KMS key rotation enabled automatically
- All data encrypted at rest
- Database credentials stored in Secrets Manager

### Network Security

- Lambda functions deployed in private subnets
- Database security groups allow traffic only from VPC CIDR
- No public accessibility for RDS instances
- VPC endpoints recommended for AWS service access

## Performance Optimization

### Environment-Specific Sizing

The infrastructure scales appropriately per environment:

- **Dev**: Minimal resources for cost optimization
- **Staging**: Production-like sizing for realistic testing
- **Prod**: High-availability configuration with multiple instances

### Cost Optimization

- Aurora Serverless v2 can be considered for dev/staging (requires code changes)
- Burstable instance types (T4g) used for development
- Reserved concurrency limits Lambda scaling costs
- CloudWatch log retention set to 30 days (not indefinite)

## Contributing

When adding new resources:

1. Create component resources in `lib/components/`
2. Add validation logic in `lib/utils/validation.ts`
3. Update manifest generation in `lib/utils/manifest.ts`
4. Include environmentSuffix in all resource names
5. Set all resources to be fully destroyable
6. Add CloudWatch alarms in monitoring component
7. Update this README with new resource documentation

## License

This project is internal infrastructure code for the TAP (Test Automation Platform) project.
