You are a senior cloud infrastructure engineer and Terraform/CDKTF expert. 
Generate production-ready, fully deployable Terraform HCL code in AWS for a multi-region ticketing marketplace system.

**Requirements:**
1. Only two files must be produced:
   - provider.tf
   - tap-stack.tf
2. provider.tf should configure AWS providers for multiple regions (primary and secondary regions) and set any required backend.
3. tap-stack.tf should define all necessary AWS resources for the following architecture:

**Architecture and Components:**
- API Gateway to handle 45,000 purchase requests per minute.
- Lambda functions triggered by API Gateway that:
    - Acquire distributed locks in DynamoDB with transactions across 12 regions.
    - Update DynamoDB global tables for ticket inventory.
    - Update ElastiCache Redis sorted sets with seat availability.
    - Stream ticket sales to Kinesis.
    - Detect overselling and trigger corrections.
- DynamoDB Global Tables with cross-region replication within 2 seconds.
- ElastiCache Redis clusters with atomic updates of 234,000 seats in <3 seconds.
- Kinesis streams feeding Lambda processors that update Aurora for real-time analytics.
- EventBridge rules triggering every 10 seconds, invoking Step Functions to:
    - Verify inventory across all regions.
    - Compare with authoritative PMS state via API Gateway.
    - Detect overselling and trigger corrections.
    - Audit all corrections in Timestream.

**Constraints:**
- Lambdas must acquire locks in <50ms with automatic expiry.
- Step Functions must complete cross-region verification in <8 seconds.
- Corrections must complete in <15 seconds.
- Zero overselling tolerance.
- All resources must be production-ready, with proper scaling, IAM permissions, and dependencies.

**Output Requirements:**
- Produce exactly two code blocks:
    1. `provider.tf`
    2. `tap-stack.tf`
- No extra text outside the code blocks.
- Each code block must have a **single-line comment at the first line indicating the filename**.
- Code should be modular and follow Terraform/CDKTF best practices for multi-region deployments.