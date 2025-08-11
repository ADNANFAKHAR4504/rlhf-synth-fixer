You are an expert AWS Solutions Architect with deep expertise in Infrastructure as Code (IaC) using AWS CDK (TypeScript). Your task is to design and generate a complete, self-contained AWS infrastructure solution based on the user's requirements.

## Problem Statement

As a cloud engineer, your task is to set up a basic cloud environment using AWS CDK and TypeScript. Ensure the environment consists of the following components:

1. **S3 Bucket Configuration**
   - Create an S3 bucket with versioning enabled
   - Configure the bucket with `blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL` to ensure it remains private

2. **EC2 Instance Setup**
   - Deploy a 't2.micro' EC2 instance in the 'us-east-1' region
   - Use the latest Amazon Linux 2 AMI for the EC2 instance
   - Since a custom VPC is not requested, deploy the EC2 instance into the default VPC for simplicity

3. **Elastic IP Association**
   - Create an Elastic IP and associate it with the EC2 instance

4. **Security Group Configuration**
   - Create a dedicated Security Group for the EC2 instance
   - Configure the Security Group with an ingress rule allowing traffic on port 22 (SSH) **only** from a specific IP address
   - To avoid hardcoding the IP address, define it as a CDK `CfnParameter` so it can be provided at deployment time

5. **IAM Role and Permissions**
   - Create an IAM Role for the EC2 instance
   - Grant this IAM Role specific permissions to read and write to the newly created S3 bucket (e.g., using `bucket.grantReadWrite(instanceRole)`)
   - Attach this IAM Role to the EC2 instance as its instance profile

6. **Resource Organization**
   - Every resource must include Tags for organization
   - The entire setup should deploy and tear down cleanly without errors

## Technical Constraints

- **Tool**: AWS CDK
- **Language**: TypeScript
- **Cloud Provider**: AWS
- **Region**: us-east-1
- **Template**: Single, self-contained file that can be deployed directly
- **Stack Naming**: Use `TapStack${ENVIRONMENT_SUFFIX}` pattern for environment-specific deployments
- **Context Support**: Stack must support `environmentSuffix` context parameter from CDK commands

## Implementation Requirements

### 1. Architectural Design

Before writing any code, provide a brief summary of the proposed architecture inside a `<thinking>` block. Describe the EC2 instance, S3 bucket, IAM Role, Security Group, and Elastic IP, and explain how the IAM Role connects the EC2 instance to the S3 bucket.

### 2. Code Implementation

Generate a **single, self-contained, and runnable AWS CDK file** using TypeScript that implements all the required components. The implementation must:

- Support environment-specific deployments using `environmentSuffix` context
- Generate stack outputs in a format compatible with CI/CD pipeline output collection

### 3. Security Best Practices

- Implement the principle of least privilege for IAM permissions
- Ensure proper security group configurations
- Use parameters for sensitive or environment-specific values

## Deliverables

Generate a complete CDK TypeScript solution that:

1. **Is immediately deployable** - No placeholder text or manual modifications required
2. **Follows AWS best practices** - Proper security groups, IAM roles, and resource tagging
3. **Uses dynamic references** - Parameters and CDK constructs where appropriate
4. **Includes proper documentation** - Clear resource naming and code comments
5. **Passes validation** - Code should compile and deploy successfully
6. **Implements proper tagging** - All resources tagged for organization and cost tracking

## Output Requirements

- The entire solution **must** be contained within a single TypeScript file
- The code must be complete and self-contained. Include all necessary CDK imports (from `aws-cdk-lib`), the `Stack` class definition, the `App` instantiation, and the creation of the stack all in one block
- Use a `CfnParameter` to accept the allowed SSH IP address as input
- Use the `aws-ec2.InstanceType.of()` method to specify the `t2.micro` instance type
- Use the latest Amazon Linux 2 AMI for the EC2 instance
- Use the `Tags.of(this).add('Key', 'Value')` construct to apply tags to all created resources (the Stack, S3 Bucket, EC2 Instance, etc.)
- The code should be runnable (e.g., via `npx ts-node your-file.ts` and then `cdk deploy`) after installing dependencies

### CI/CD Pipeline Integration Requirements

- **Stack Name**: Must use `TapStack${environmentSuffix}` naming pattern where `environmentSuffix` comes from CDK context
- **Environment Context**: Support `this.node.tryGetContext('environmentSuffix')` for environment-specific deployments
- **Stack Outputs**: Include key resource identifiers as CloudFormation outputs for CI/CD pipeline consumption
- **Tagging Strategy**: Include standard tags compatible with CI/CD pipeline expectations (Repository, CommitAuthor, Environment)
- **Testing Integration**: Structure must support unit tests using Jest and integration tests with AWS SDK v3
