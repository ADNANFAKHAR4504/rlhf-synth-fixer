# CI/CD Pipeline Infrastructure - Pulumi TypeScript Implementation

This implementation creates a comprehensive multi-stage CI/CD pipeline infrastructure for Node.js microservices using Pulumi with TypeScript.

## Architecture Overview

The solution provisions:
- S3 bucket for pipeline artifacts with versioning and KMS encryption
- Two CodePipeline instances (production for main branch, staging for develop branch)
- CodeBuild projects for build and test stages
- Lambda functions for notifications and approval checks
- SNS topics for pipeline notifications and failure alerts
- EventBridge rules to capture pipeline state changes
- IAM roles with least-privilege access for all services

## File Structure

```
lib/
├── index.ts                          # Main infrastructure code
├── lambda/
│   ├── notification/
│   │   ├── index.js                  # Notification Lambda function
│   │   └── package.json              # Dependencies
│   └── approval/
│       ├── index.js                  # Approval check Lambda function
│       └── package.json              # Dependencies
Pulumi.yaml                           # Pulumi project configuration
```

## Implementation Files

The complete infrastructure code has been generated and is available in the following files:
- `Pulumi.yaml` - Project configuration
- `lib/index.ts` - Main infrastructure code (845 lines)
- `lib/lambda/notification/index.js` - Notification Lambda function
- `lib/lambda/notification/package.json` - Lambda dependencies
- `lib/lambda/approval/index.js` - Approval Lambda function
- `lib/lambda/approval/package.json` - Lambda dependencies

## Key Features Implemented

1. **Resource Naming with environmentSuffix**: All resources include `${environmentSuffix}` in their names for uniqueness across deployments

2. **Encryption**: All data at rest encrypted with KMS, all data in transit uses TLS/SSL

3. **Branch-Based Deployments**:
   - Production pipeline for main branch with manual approval gate
   - Staging pipeline for develop branch (auto-deploy)

4. **IAM Least Privilege**: Separate roles for CodePipeline, CodeBuild, and Lambda with minimal required permissions

5. **Notification System**:
   - EventBridge rules capture pipeline state changes
   - SNS topics for general notifications and failure alerts
   - Lambda functions send detailed notifications

6. **Resource Tagging**: All resources tagged with Environment, CostCenter, ManagedBy, and Project tags

7. **Destroyability**: No retention policies or deletion protection - all resources can be cleanly destroyed

8. **Lambda SDK v3**: All Lambda functions use AWS SDK v3 for Node.js 18.x compatibility

## Deployment Instructions

1. Install dependencies:
   ```bash
   npm install
   ```

2. Configure Pulumi stack:
   ```bash
   pulumi stack init dev
   pulumi config set aws:region us-east-1
   pulumi config set environmentSuffix <unique-suffix>
   ```

3. Deploy infrastructure:
   ```bash
   pulumi up
   ```

4. Verify outputs:
   ```bash
   pulumi stack output
   ```

## Testing

The infrastructure can be tested by:
1. Uploading source artifacts to S3 at `source/main.zip` and `source/develop.zip`
2. Pipelines will automatically start upon source changes
3. Production pipeline requires manual approval before deployment
4. Notifications will be sent to SNS topics

## Clean Up

To destroy all resources:
```bash
pulumi destroy
```
