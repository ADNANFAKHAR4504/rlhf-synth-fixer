You are an expert AWS Cloud Architect specializing in Infrastructure as Code (IaC) and serverless design. Your task is to generate a CloudFormation template using YAML that defines a robust, production-ready serverless architecture on AWS. The architecture should meet the following requirements:

1. **AWS Lambda Functions**:
   - Implement Lambda functions for application logic.
   - Each Lambda must not exceed **256MB of memory**.

2. **API Gateway Integration**:
   - Configure API Gateway to handle incoming HTTP requests.
   - Ensure it correctly integrates with the Lambda functions.

3. **Multi-Region Deployment**:
   - Deploy the infrastructure across **two regions**: `us-east-1` and `us-west-2`.
   - Ensure services are highly available across these regions.

4. **Tagging**:
   - All created resources must be tagged with:

     ```yaml
     Environment: Production
     ```

5. **Monitoring and Logging**:
   - Enable **CloudWatch logging** for all Lambda executions to support monitoring and debugging.

**Constraints**:

- Must be multi-region (`us-east-1` and `us-west-2`).
- Lambda functions must stay within the 256MB memory limit.
- API Gateway must handle HTTP requests.
- All resources must be tagged with `Environment: Production`.
- CloudWatch logging must be enabled for Lambda.

**Expected Output**:
A **fully functional CloudFormation YAML template** that:

- Successfully creates and configures all defined resources.
- Passes `aws cloudformation validate-template` without errors.
- Reflects best practices for production workloads.

**Project Context**:

- **Project Name**: _IaC - AWS Nova Model Breaking_
- **Difficulty**: Expert level.
- **Problem Statement**: Design a serverless infrastructure deployed in both `us-east-1` and `us-west-2`, strictly following the constraints around memory, tagging, API Gateway integration, and CloudWatch logging.
