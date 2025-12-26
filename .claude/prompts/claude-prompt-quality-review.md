# Claude Prompt Quality Review

You are reviewing a pull request to validate that the prompt describes expert-grade infrastructure with service connectivity.

## Your Task

Validate that `lib/PROMPT.md` meets quality standards for AWS infrastructure training data.

## Step 1: Run Prompt Quality Validation Script

**MANDATORY**: Execute the prompt quality validation script:

```bash
bash .claude/scripts/claude-validate-prompt-quality.sh
```

**Check the exit code:**
- Exit code 0: Validation PASSED
- Exit code 1: Validation FAILED

## Step 2: Analyze and Apply Intelligence

**Before posting your review, consider:**

1. **Subcategory Context**: What is the task's subcategory? Does it make sense for this type of task?
2. **Connector Quality**: Does the prompt describe HOW services integrate, regardless of exact phrasing?
3. **Flexibility**: Don't penalize prompts that are well-structured but different from the examples
4. **Real-World Scenarios**: Does the prompt reflect a realistic infrastructure scenario?

**Your role is to:**
- ✅ Validate that prompts describe service connectivity and integration
- ✅ Ensure prompts are human-written (not LLM-generated with formal indicators)
- ✅ Check security best practices when relevant
- ❌ NOT require prompts to exactly match example templates
- ❌ NOT fail prompts that are well-structured but use different approaches
- ❌ NOT apply rigid rules without considering context

## Step 3: Post Review Comment

You MUST post a GitHub comment on this PR with your findings.

### If Validation PASSED:

Post this comment:

```markdown
## ✅ Prompt Quality Review - PASSED

### Validation Results

The prompt quality validation has passed all checks.

**Script Output:**
```
[Paste the full output from claude-validate-prompt-quality.sh]
```

### Analysis

- ✅ Prompt describes AWS service connectivity and integration
- ✅ Multi-service architecture with clear service interactions
- ✅ Connector-based structure showing HOW services work together
- ✅ Security validation (conditional based on prompt focus)
- ✅ No LLM-generated content detected (no emojis, en/em dashes, brackets, formal abbreviations)

### Quality Assessment

**Strengths:**
[Briefly describe what makes this prompt high-quality - e.g., "Clear data flow from S3 → Lambda → DynamoDB", "Well-defined security boundaries", "Realistic multi-environment scenario"]

**Subcategory Alignment:**
[Note if the prompt aligns well with examples for its subcategory, or if it follows good connector-based principles despite being a different type]

This prompt meets the quality bar for expert training data.
```

### If Validation FAILED:

Post this comment:

```markdown
## ❌ Prompt Quality Review - FAILED

### Validation Results

The prompt quality validation has failed.

**Script Output:**
```
[Paste the full output from claude-validate-prompt-quality.sh]
```

### Issues Found

[List the specific issues from the script output with intelligent analysis]

### Analysis and Recommendations

**Critical Issues:**
[List issues that must be fixed - e.g., LLM-generated indicators, lack of service connectivity]

**Context-Specific Guidance:**
[Provide recommendations based on the task's subcategory. For example:
- For Security Configuration: "Describe how IAM policies connect to resources, how encryption keys protect data flows"
- For CI/CD Pipeline: "Show pipeline stage progression and how each stage connects to deployment targets"
- For Multi-Environment: "Explain how the same services are connected across dev/staging/prod"]

### How to Fix

1. Review the script output above for specific failures
2. Update `lib/PROMPT.md` to address the issues
3. **Ensure the prompt describes HOW AWS services connect and integrate**, not just listing them
4. **Remove LLM-generated indicators:**
   - Remove emojis
   - Replace en dashes (–) and em dashes (—) with regular hyphens (-)
   - Remove square brackets [ ] completely
   - Limit round/curly brackets to maximum 1 pair
   - Remove formal abbreviations like "e.g.", "i.e.", "etc."
   - Use natural, conversational language
5. **Security considerations**: Only required if the prompt is security-focused (IAM, security groups, encryption, etc.)
6. Push your changes

### Examples

**Good prompts (connector-based):**
> "Deploy an S3 bucket that triggers a Lambda function when files are uploaded. The Lambda should process the data and write results to DynamoDB."

> "Create an API Gateway that invokes Lambda functions, with Lambda writing events to EventBridge for downstream processing."

> "S3 bucket connected to EventBridge, which triggers a Lambda function to process uploads and store metadata in DynamoDB."

**Bad prompts (generic/plain - no connectors):**
> "Deploy S3 and Lambda"

> "Create EC2 instances and RDS database"

**LLM-generated indicators to avoid:**
> "Deploy an S3 bucket – which triggers a Lambda – that processes files (e.g., images) and stores results [optional: in DynamoDB]."
(Contains: em dash, en dash, e.g., square brackets, excessive round brackets)

---

## Subcategory-Specific Prompt Quality Examples

**IMPORTANT: Use Intelligence and Judgment**

The following examples demonstrate the expected quality and connector-based structure for **some common subcategories**. These are **examples of the QUALITY and STRUCTURE to follow, NOT exact templates to copy**.

**Key Guidelines:**
- **Be flexible**: Prompts don't need to match these examples exactly
- **Focus on principles**: Look for connector-based structure, service integration, and data flow
- **Not exhaustive**: These examples cover common subcategories, but there are others (Serverless Infrastructure, Web Application Deployment, Failure Recovery, etc.)
- **Apply general principles**: If a subcategory isn't listed here, use the general connector-based examples at the top of this document
- **Context matters**: A prompt for "Cloud Environment Setup" or "Web Application Deployment" will look different from "Security Configuration" - that's expected and fine
- **Quality over similarity**: Judge the prompt based on whether it describes HOW services connect and work together, not whether it matches these examples word-for-word

### Security Configuration as Code

**Example of good quality (Pr5351 - CloudFormation):**
> Creates an encrypted S3 bucket with public access blocked and a bucket policy rejecting unencrypted uploads. Enables EBS default encryption via KMS. Applies an IAM policy requiring MFA for IAM users (deny actions without aws:MultiFactorAuthPresent). Deploys AWS Config rules (managed or custom) validating encryption for S3 and EBS.

**Example of good quality (Pr5112 - CDK TypeScript):**
> Every customer transaction published as an event to a Kinesis Data Stream. This stream consumed by a Triage Lambda function. Lambda queries ElastiCache for Redis cluster to check for velocity fraud, queries Amazon Verified Permissions backed by DynamoDB table, and invokes a SageMaker endpoint. If risk threshold exceeded, Triage Lambda triggers AWS Step Functions workflow to orchestrate automated investigation. Step Functions kicks off Athena query against transaction data lake in S3, queries Neptune graph database to traverse customer relationships, invokes Scoring Lambda that connects to Aurora RDS database, and uses Amazon Bedrock to summarize findings. Based on high score, workflow forks to invoke Lambda that calls external API Gateway, publish finding to AWS Security Hub, and archive evidence into Amazon OpenSearch Serverless.

**Key characteristics:**
- Describes HOW services connect (Lambda → queries → Redis, DynamoDB, SageMaker)
- Shows data flow (Kinesis → Lambda → Step Functions → parallel queries)
- Emphasizes integration patterns (triggers, queries, connections)

### CI/CD Pipeline

**Example of good quality (Pr5600 - CodePipeline):**
> GitHub integration using OIDC with role assumption. CodeBuild runs npm ci and npx cdk synth, integrating cdk-nag security scanning that fails pipeline on high security findings. CloudFormation change sets for each environment with multi-stage deployment: dev to staging to prod. Cross-account roles for staging and production. Manual approval gates before staging and production. Per-stage Slack webhook notifications reporting deployment status for each stage.

**Example of good quality (Pr6144 - GitLab CI):**
> GitLab OIDC with AWS using STS assume-role-with-web-identity for all AWS operations. Pipeline stages progress through validation, build with CDK synthesis, testing with coverage reporting, security scanning with Semgrep and Trufflehog, compliance checks with Checkov and Prowler, dev deployment, integration testing, canary deployment with 10% traffic split, smoke testing monitoring canary metrics with Datadog, staging deployment using blue-green strategy, E2E testing with Cypress, production approvals requiring both security and product team, production deployment with kubectl/EKS, monitoring with Sentry release and synthetic tests, and manual rollback capability.

**Key characteristics:**
- Shows pipeline flow and stage progression
- Describes integration between stages (build → test → deploy → monitor)
- Explains approval gates and deployment strategies

### Multi-Environment Consistency

**Example of good quality (Pr5071 - Terraform):**
> DDB Stream triggers validator Lambda that puts records to Kinesis. Kinesis consumed by processor Lambda that updates Redis. EventBridge Rule triggers SFN StartExecution. SFN invokes Lambda to query Aurora readers, apply business-rule checks, and publish conflicts to SNS. SNS to SQS subscription consumed by reconciliation Lambda that updates sources and writes lineage to Neptune.

**Example of good quality (Pr5100 - Terraform):**
> API Gateway manages purchase requests triggering Lambda functions that acquire distributed locks in DynamoDB with transactions across regions, update DynamoDB global tables for ticket inventory, update ElastiCache Redis sorted sets with seat availability, stream ticket sales to Kinesis, and detect overselling to trigger corrections. Kinesis streams feed Lambda processors that update Aurora for real-time analytics. EventBridge rules triggered every 10 seconds invoke Step Functions to verify inventory across all regions, compare with authoritative PMS state via API Gateway, detect overselling and trigger corrections, and audit all corrections in Timestream.

**Key characteristics:**
- Same topology across environments with only capacity differences
- Shows service orchestration and data flow
- Describes cross-service dependencies

### IaC Diagnosis/Edits

**Example of good quality (Pr5234 - CDK Java):**
> Lambda function runs in private subnets with VPC configuration. Lambda needs S3 GetObject and GetObjectVersion on input path, PutObject on output path, ListBucket with condition restricting to input and output prefixes, CloudWatch CreateLogStream and PutLogEvents on specific log group, SSM GetParameter on parameter path, and VPC execution permissions for network interfaces created dynamically.

**Key characteristics:**
- Focuses on fixing or optimizing existing infrastructure
- Describes least-privilege IAM scoping
- Explains resource relationships and dependencies

### IaC Optimization

**Example of good quality (Pr5135 - CDK TypeScript with optimize.py):**
> Scale down Aurora Database by reducing minCapacity from 2 to 0.5 ACU, maxCapacity from 4 to 1 ACU, and backup retention from 14 to 1 day. Reduce ElastiCache Redis numCacheClusters from 3 to 2 nodes. Reduce ECS Fargate desiredCount from 3 to 2 tasks. Use boto to apply optimizations by modifying Aurora Serverless v2 cluster capacity, updating ElastiCache replication group, and updating ECS service desired count.

**Key characteristics:**
- Describes specific optimization targets
- Shows before/after resource configurations
- Focuses on cost reduction or performance tuning

### Infrastructure Analysis/Monitoring

**Example of good quality (Pr5548 - Python/Boto3):**
> Script uses IAM Access Advisor get_access_key_last_used to find stale access keys, checks IAM users for MFA device attachment distinguishing console vs programmatic-only users, iterates through customer-managed IAM policies using IAM Access Analyzer ValidatePolicy API to check for SECURITY_WARNING findings, examines IAM roles trust relationships to identify external account access extracting account IDs from AssumeRolePrincipal statements, and generates iam_compliance_report.json and iam_compliance_report.csv with findings.

**Example of good quality (Pr5426 - Python/Boto3):**
> Script checks CloudWatch RequestCount over last 14 days to find idle ALBs, checks NAT Gateway BytesProcessed for last 30 days and verifies AZ has private subnets, finds S3 buckets with versioning but no non-current version expiration policy and checks buckets over 1 TB for lifecycle rules to Glacier, identifies unassociated EIPs and EIPs attached to stopped EC2 instances, skips resources with CostCenter tag set to R&D, and outputs finops_report.json with ResourceId, Region, WasteType, and EstimatedMonthlySavings.

**Key characteristics:**
- Describes analysis methodology and data sources
- Shows how different AWS APIs are queried
- Explains report generation and filtering logic
```

## Step 4: Provide Additional Recommendations (Optional)

**If you notice opportunities for improvement even when validation passes:**

Consider adding a "Suggestions for Enhancement" section to your comment:
- Could the prompt be more specific about service integration patterns?
- Are there additional connector details that would improve clarity?
- Does the prompt capture realistic production scenarios?

**Remember:** The goal is to help create high-quality training data, not to enforce rigid templates. Use your judgment to provide valuable, actionable feedback.

## Step 5: Exit Appropriately

- If validation PASSED: Continue normally (exit 0)
- If validation FAILED: After posting the comment, exit with code 1 to fail the job

## Best Practices for Excellent QA Delivery

**1. Thoroughness**
- Read the ENTIRE PROMPT.md file, don't just skim
- Run the validation script and analyze ALL output
- Check metadata.json for subcategory context
- Look for both obvious and subtle issues

**2. Context-Aware Judgment**
- Consider what subcategory this task belongs to
- Apply appropriate standards for that type of task
- Don't rigidly apply examples meant for different subcategories
- Recognize that "Web Application Deployment" will look different from "Security Configuration"

**3. Constructive Feedback**
- When validation passes, highlight specific strengths
- When validation fails, provide actionable, specific guidance
- Reference relevant examples from the review document
- Explain WHY something is an issue, not just WHAT the issue is

**4. Quality Focus Areas**
- **Service Integration**: Does it describe HOW services connect?
- **Data Flow**: Is the path of data through services clear?
- **Human-Written**: Does it avoid LLM indicators (emojis, en/em dashes, brackets, formal abbreviations)?
- **Realistic Scenarios**: Does it reflect real-world production patterns?
- **Security Context**: When relevant, does it describe security boundaries and controls?

**5. Recommendations for Enhancement** (even when passing)
- Could service integration be more explicit?
- Are there missing connector details that would help?
- Does the prompt describe a realistic production scenario?
- Would additional context about service relationships improve clarity?

**6. Professional Communication**
- Be clear and direct
- Provide specific line references when possible
- Balance criticism with recognition of strengths
- Remember: the goal is to help create high-quality training data, not to find faults

## CRITICAL

You MUST post a GitHub comment. Do not proceed without posting your review.
