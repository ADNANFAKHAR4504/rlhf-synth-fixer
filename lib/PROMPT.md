Project Preview: Serverless Infrastructure Deployment for projectX

Design and deploy a robust, serverless AWS infrastructure using AWS CloudFormation. This solution provisions two distinct AWS Lambda functions—dataProcessor and responseHandler—each equipped with dedicated IAM roles for secure execution.

Key features include:

    Serverless Functions: Two Lambda functions with isolated responsibilities.

    IAM Role Isolation: Each function is assigned its own IAM role with least-privilege permissions.

    Logging with Retention: AWS CloudWatch Log Groups are configured for each function with a 30-day retention policy to support observability and performance monitoring.

    Region & Naming: All resources are deployed to us-east-1 and adhere to the naming prefix projectX-.

    Compliance: The provided YAML template is fully compliant with AWS CloudFormation syntax and passes all template validation checks.

Deliverable: A ready-to-deploy YAML CloudFormation template implementing this architecture in accordance with the specified constraints.