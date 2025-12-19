# Escalation Report: PR #8562 Deploy Job Failure

## Issue Summary
Deploy job is failing because LocalStack services (EC2, ECR, ELB, RDS, AutoScaling) are not enabled.

## Root Cause
The GitHub Actions workflow starts LocalStack with a hardcoded SERVICES list that excludes EC2, ECR, ELB, RDS, and AutoScaling:

```
SERVICES=s3,lambda,dynamodb,cloudformation,iam,sqs,sns,events,logs,cloudwatch,apigateway,secretsmanager,ssm,stepfunctions,kinesis,kms,sts
```

Required services missing:
- ec2 (for VPC, instances, networking)
- ecr (for CDK bootstrap)
- elb (for load balancer)
- rds (for databases)
- autoscaling (for auto scaling groups)

## Attempted Fixes
1. Modified docker-compose.yml to include missing services - **NOT used by CI/CD**
2. Investigated scripts/localstack-start-ci.sh - **Cannot modify (restricted path)**
3. Investigated .github/workflows/ci-cd.yml - **Cannot modify (restricted path)**

## Required Fix
Modify `.github/workflows/ci-cd.yml` at the "Start LocalStack" step (line ~482-486) to export LOCALSTACK_SERVICES before calling the script:

```yaml
      - name: Start LocalStack (if provider is localstack)
        if: ${{ needs.detect-metadata.outputs.provider == 'localstack' }}
        run: |
          # Read services from metadata.json and set LOCALSTACK_SERVICES
          if [[ -f "metadata.json" ]]; then
            AWS_SERVICES=$(jq -r '.aws_services | join(",")' metadata.json)
            export LOCALSTACK_SERVICES="s3,lambda,dynamodb,cloudformation,iam,sqs,sns,events,logs,cloudwatch,apigateway,secretsmanager,ssm,stepfunctions,kinesis,kms,sts,${AWS_SERVICES}"
            echo "Setting LOCALSTACK_SERVICES=${LOCALSTACK_SERVICES}"
          fi
          ./scripts/localstack-start-ci.sh
        env:
          LOCALSTACK_API_KEY: ${{ secrets.LOCALSTACK_API_KEY }}
```

## Agent Constraints
Per guardrails, agent CANNOT modify:
- scripts/ folder (strictly forbidden)
- .github/ folder (restricted path)  
- scripts section in package.json (only dependencies allowed)

## Status
- Iteration: 2 of 3
- Exit Code: 2 (BLOCKED - requires manual intervention)
- All other jobs: PASSING (9/10)
- Deploy job: FAILING (service configuration issue)

## Recommendation
1. Update the workflow as shown above, OR
2. Create a mechanism for per-PR service configuration
3. Test with PR #8562 which requires: vpc, ec2, autoscaling, elb, rds, cloudwatch, sns

