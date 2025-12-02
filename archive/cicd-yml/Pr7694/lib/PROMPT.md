# Task: Multi-Account, Multi-Stage CodePipeline for CDK Apps

Create a comprehensive CI/CD pipeline with the following requirements:

## Requirements

**Source:**
- GitHub integration using OIDC (no long-lived keys)
- Branch filters: main -> prod, dev -> dev
- Secure authentication with role assumption

**Build:**
- CodeBuild runs `npm ci && npx cdk synth`
- Integrate cdk-nag security scanning
- Fail pipeline on high security findings
- Validate all security best practices

**Deploy:**
- CloudFormation change sets for each environment
- Multi-stage deployment: dev -> staging -> prod
- Cross-account roles for staging and production
- Manual approval gates before staging and production
- Artifacts encrypted with KMS

**Notifications:**
- Per-stage Slack/Chat webhook notifications
- Report deployment status for each stage
- Include branch and commit information

## Expected Output

A deployable pipeline that:
- Auto-deploys to dev on commit to dev branch
- Auto-deploys to prod on commit to main branch (with approvals)
- Requires manual approval before staging deployment
- Requires manual approval before production deployment
- Provides visibility through notifications at each stage

## Integration Test Focus

The pipeline should demonstrate:
1. End-to-end promotion through all stages
2. Security guardrails with cdk-nag enforcement
3. Cross-account role assumptions
4. Change set safety validations
5. Manual approval gates functionality
