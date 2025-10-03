Problem: Create a feedback system in us-east-1 with API Gateway for submission endpoints, Lambda (Python 3.10) for data processing, Comprehend for sentiment analysis, DynamoDB for responses with GSI, S3 for report storage, EventBridge scheduled rules for weekly report generation, SES for report delivery, CloudWatch for metrics, and IAM roles for service access.

language: Yaml
platform: CloudFormation


constraint_items: Use Comprehend for automated sentiment analysis; store responses with GSI for efficient querying; schedule weekly report generation with EventBridge; deliver reports via SES; implement input validation in Lambda.

### 2. Cross-Account Executability
- All tasks must be fully executable across AWS accounts without modification
- Avoid assumptions tied to a single account or region

### 3. Hardcoding
- **No hardcoded values** (e.g., account IDs, ARNs, region names)
- Use parameters, environment variables, or configuration files instead
- Anything hardcoded is a **critical review concern**

### 4. Lambda Use Cases
- If a Lambda function is included, it should demonstrate a **real-world use case** (e.g., log processing, event transformation, cost monitoring)
- Avoid trivial examples like "Hello World"
- The surrounding infrastructure should feel **professional and production-oriented**, even if simplified

### 5. Resource Tagging
- Use iac-rlhf-amazon tag for all resource creation

# output
- needed prompt.md file which can provide as input to other ai model
- promt should look like human generated not ai generated
- also add existing code file present in lib folder and as in promt to update the same file
- Also strictly mention in propt that it should update the existing code only dont create new stacks or provide output by updating existing given stack
