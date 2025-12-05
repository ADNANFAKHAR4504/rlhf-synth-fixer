# CodeCommit Repository Management Solution

Optimized Pulumi TypeScript solution for managing AWS CodeCommit repositories with parallel operations, retry logic, comprehensive error handling, and monitoring.

## Features

1. **Parallel Repository Creation**: Uses Promise.all() for concurrent operations
2. **Retry Logic**: Exponential backoff for API rate limiting
3. **Error Handling**: Continues deployment when individual repositories fail
4. **External Configuration**: Repository definitions in separate JSON file
5. **Consistent Tagging**: Automated resource tagging with naming conventions
6. **CloudWatch Monitoring**: Size monitoring alarms for each repository
7. **Least-Privilege IAM**: Contributor role with minimal required permissions
8. **Orphaned Repository Detection**: Mechanism to identify unused repositories
9. **Output Exports**: Complete repository URLs and ARNs
10. **Cross-Stack Sharing**: StackReference support for sharing data

## Prerequisites

- Node.js 20+
- Pulumi CLI
- AWS CLI configured
- AWS credentials with appropriate permissions

## Configuration

### Repository Configuration (repositories-config.json)

Edit `lib/repositories-config.json` to add/remove/modify repositories:

```json
{
  "repositories": [
    {
      "name": "my-repo",
      "description": "Repository description",
      "defaultBranch": "main",
      "tags": {
        "Application": "MyApp",
        "Team": "MyTeam"
      },
      "sizeAlarmThresholdMB": 500
    }
  ]
}
```

### Stack Configuration

Set required configuration:

```bash
pulumi config set environmentSuffix dev
pulumi config set aws:region us-east-1
```

## Deployment

### Initialize Stack

```bash
cd lib
pulumi stack init dev
pulumi config set environmentSuffix dev
pulumi config set aws:region us-east-1
```

### Preview Changes

```bash
pulumi preview
```

### Deploy

```bash
pulumi up
```

### Destroy

```bash
pulumi destroy
```

## Architecture

### Components

1. **Repository Manager** (`index.ts`)
   - Parallel repository creation with Promise.all()
   - Retry logic with exponential backoff
   - Error handling that continues on failures

2. **Retry Utilities** (`retry-utils.ts`)
   - Configurable retry mechanism
   - Exponential backoff implementation
   - Rate limiting detection

3. **IAM Roles** (in `index.ts`)
   - Least-privilege contributor role
   - Scoped to created repositories only

4. **CloudWatch Alarms** (in `index.ts`)
   - Per-repository size monitoring
   - Configurable thresholds

5. **Stack Reference** (`stack-reference-example.ts`)
   - Cross-stack data sharing example
   - Reusable repository information

## Exports

The stack exports the following outputs:

- `repositoryCloneUrls`: HTTP and SSH clone URLs for each repository
- `repositoryArns`: ARNs of all created repositories
- `repositoryNames`: Names of all repositories
- `alarmArns`: ARNs of CloudWatch alarms
- `contributorRoleArn`: ARN of the IAM contributor role
- `contributorRoleName`: Name of the IAM contributor role
- `deploymentSummary`: Summary of deployment results
- `stackReference`: Object containing all outputs for cross-stack reference

## Using Stack Outputs

### View Outputs

```bash
pulumi stack output
```

### Access Specific Output

```bash
pulumi stack output repositoryCloneUrls
pulumi stack output contributorRoleArn
```

### Use in Another Stack

```typescript
const codecommitStack = new pulumi.StackReference('codecommit-repos-dev');
const repoArns = codecommitStack.getOutput('repositoryArns');
```

## Error Handling

The solution implements robust error handling:

1. **Retry Logic**: Automatically retries failed API calls with exponential backoff
2. **Continue on Failure**: Individual repository failures don't stop deployment
3. **Error Reporting**: Failed repositories are logged and included in deployment summary
4. **Rate Limiting**: Detects and handles AWS API rate limiting

## Monitoring

### CloudWatch Alarms

Each repository has a CloudWatch alarm monitoring:
- **Metric**: Repository size in bytes
- **Threshold**: Configurable per repository (MB)
- **Evaluation**: 5-minute periods
- **Action**: Alarm state when threshold exceeded

### View Alarms

```bash
aws cloudwatch describe-alarms --alarm-name-prefix "frontend-app-dev"
```

## Security

### IAM Role Permissions

The contributor role has least-privilege access:

**Allowed Actions**:
- Read operations (Get*, List*, BatchGet*)
- Git operations (GitPull, GitPush)
- Branch management (CreateBranch, DeleteBranch)
- Pull request operations (limited)

**Not Allowed**:
- Repository deletion
- Repository settings modification
- Admin-level operations

## Cleanup

### Manual Orphaned Repository Cleanup

To remove repositories not in configuration:

```bash
# List all repositories
aws codecommit list-repositories --region us-east-1

# Delete orphaned repository
aws codecommit delete-repository --repository-name repo-name-dev
```

### Full Stack Cleanup

```bash
pulumi destroy --yes
pulumi stack rm dev --yes
```

## Troubleshooting

### Rate Limiting Errors

If you encounter rate limiting:
- Retry logic automatically handles this
- Check CloudTrail for API call patterns
- Consider reducing parallel operations

### Repository Creation Failures

Check deployment summary output:
```bash
pulumi stack output deploymentSummary
```

### Permission Issues

Ensure your AWS credentials have:
- `codecommit:*` permissions
- `iam:*` permissions for role creation
- `cloudwatch:*` permissions for alarms

## Testing

Tests are located in the `tests/` directory. See test documentation for details.

## Contributing

Follow the project's contribution guidelines for making changes.

## License

MIT
