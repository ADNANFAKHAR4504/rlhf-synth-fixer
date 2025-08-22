# CI/CD setup notes

We need to get our deployment pipeline working. Using Pulumi with TypeScript to define everything.

## What we're building

GitHub repo triggers builds automatically:

- main -> production
- staging -> staging
- feature/\* -> dev

CodeBuild handles the builds. Needs to be Docker-based so everyone gets the same environment.

## Security

Put secrets in AWS Secrets Manager (slack webhook etc). CodeBuild role should only have permissions it actually needs. Don't hardcode anything in buildspecs.

## Test deployment

Add a basic lambda so we can verify deployments work. Pipeline updates it based on branch.

## Notifications

CloudWatch for logs. Slack messages when builds finish (success/fail). EventBridge watches build state changes, triggers notification lambda.

Requirements:

- TypeScript + Pulumi
- CodeBuild, IAM roles, secrets manager
- Multi-environment support
- CloudWatch logging
- Slack integration

Focus on infrastructure code not docs.
