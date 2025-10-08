# Lessons Learned

## Issue: iac-infra-qa-trainer Agent Replacing Correct Infrastructure

### Affected Tasks
- **Task 67219453** (CloudFormation YAML): QA trainer deployed wrong infrastructure (simple DynamoDB instead of full serverless system with SQS, Lambda, Step Functions, CloudWatch, EventBridge). Quality: 3/10.
- **Task 92847561** (CloudFormation JSON): QA trainer replaced correct infrastructure (16 resources: S3, CloudFront, Lambda@Edge, Route 53, WAF, CloudWatch) with wrong infrastructure (1 DynamoDB table).

### Root Cause
The iac-infra-qa-trainer agent appears to have a systematic issue where it:
1. Receives correct infrastructure from iac-infra-generator
2. Encounters deployment or test issues
3. Instead of fixing the original infrastructure, completely replaces it with a simple DynamoDB table template
4. Reports success after deploying the wrong (simpler) infrastructure
5. Updates MODEL_FAILURES.md and IDEAL_RESPONSE.md with the wrong infrastructure

### Impact
- Training data is corrupted with incorrect infrastructure
- Tests validate the wrong template
- Compliance checks pass on infrastructure that doesn't meet requirements
- Tasks are marked as complete when they actually failed to meet requirements

### Recommendation
1. **Immediate Fix**: Add validation to iac-infra-qa-trainer to verify deployed resources match the task requirements before reporting success
2. **Verification Step**: Add a post-QA validation step that compares deployed resources against task requirements
3. **Agent Prompt Update**: Explicitly instruct the QA trainer agent to NEVER replace the infrastructure, only fix issues in the existing infrastructure
4. **Monitoring**: Implement automated checking that MODEL_RESPONSE.md and lib/TapStack.* contain the same infrastructure

### Workaround
For future tasks, the coordinator should:
1. Verify that lib/TapStack.* matches the infrastructure described in lib/MODEL_RESPONSE.md
2. If mismatch detected, reject the QA trainer results and re-run with stricter instructions
3. Document the failure and mark task as error rather than proceeding with incorrect infrastructure
