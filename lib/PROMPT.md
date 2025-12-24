```text
You are an expert AWS Solutions Architect. Your task is to generate a comprehensive AWS CloudFormation template in YAML that automates the deployment and management of a serverless application across multiple environments and regions. This template must adhere to the best practices for multi-environment consistency and reusability, designed to be deployed using AWS StackSets.

**Mission Requirements:**

1.  **Core Resources:** Define a complete set of resources including:
    * An S3 bucket to store Lambda deployment packages. The bucket name should be unique and environment-specific.
    * An AWS Lambda function with a Node.js runtime. Its code should be sourced from the S3 bucket defined above.
    * An API Gateway REST API with a single `/hello` path. This path should be configured with a proxy integration that forwards all requests to the Lambda function.
    * IAM roles and policies that allow API Gateway to invoke the Lambda function and enable CloudWatch logging.

2.  **Multi-Environment Configuration:**
    * Use the `Parameters` section to accept an `EnvironmentName` parameter with allowed values of `dev`, `staging`, and `prod`. Also, accept an `ArtifactBucketName` parameter to specify the bucket for Lambda code.
    * Create a `Mappings` section to define environment-specific constant values. The `EnvironmentName` parameter should be the primary key for the map. Use this map to set properties like the Lambda function's memory size and a prefix for resource names such as `my-app-dev-lambda`.

3.  **Validation and Integrity:**
    * Implement a `Rules` section to perform automated validation on the `Parameters` before deployment. Specifically, create a rule to ensure that the `EnvironmentName` parameter's value is one of the allowed options.
    * Use a `Conditions` section to conditionally create or configure resources. For example, create an additional S3 bucket for access logs, but only when the `EnvironmentName` is `prod`.

4.  **Resource Interconnections:**
    * Ensure all resources are correctly linked. The Lambda function's code should reference the `ArtifactBucketName` parameter.
    * The API Gateway's integration must reference the Lambda function's ARN.
    * The Lambda function's `Environment` variables should be set using values from the `Mappings` section.
    * Use `!Sub` and `!Ref` intrinsic functions for dynamic naming and referencing of resources.

5.  **Expected Output:**
    * A single, well-commented YAML CloudFormation template file that is syntactically valid and can be deployed directly via AWS CloudFormation or a StackSet.
    * The template should include a `Description` and `Outputs` section. The outputs must include the API Gateway's invoke URL and the unique S3 bucket name.
    * All resource names should be dynamically generated based on the `EnvironmentName` and other parameters to prevent naming conflicts.
```