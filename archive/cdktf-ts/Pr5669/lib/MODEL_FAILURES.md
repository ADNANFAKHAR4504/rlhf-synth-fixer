# Deployment Issues: MODEL_RESPONSE vs IDEAL_RESPONSE

## Critical

### Reserved AWS Lambda Environment Variable
- The stack set a custom Lambda environment value named `AWS_REGION`.  
- AWS reserves that name, so the deployment failed when Terraform tried to publish the function package.  
- Fix: rename the variable to something neutral (for example `REGION`) and keep the Lambda handler code using `process.env.REGION || process.env.AWS_REGION`.

**Why it matters**  
AWS blocks any attempt to override its reserved environment variables (`AWS_REGION`, `AWS_DEFAULT_REGION`, etc.). The resulting Terraform error is opaque (“could not read package directory”), so this mistake burns time during troubleshooting. We should flag any `AWS_` prefix in generated Lambda env sections.

## Medium

### Missing Stack Outputs
- The generated stack did not emit outputs for the API endpoint, function names, or table name.  
- Integration tests expect those values in `cfn-outputs/flat-outputs.json`, so someone had to capture them manually.

**Suggested fix**  
Add `TerraformOutput` entries for the API ID, endpoint URL, each Lambda name, and the DynamoDB table name. That keeps tests and tooling in sync without extra manual steps.

---

## Quick reference

- Critical count: 1  
- Medium count: 1  
- Root causes: reserved Lambda env var, missing stack outputs  
- Other aspects (VPC, API Gateway, DynamoDB, alarms, DLQs, IAM) matched requirements and deployed cleanly once the env var was corrected.
