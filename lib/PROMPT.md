Please write a single AWS CloudFormation YAML template that meets the following requirements for setting up a secure web environment in the us-west-2 region:

1. **Language**: Use YAML for the CloudFormation template.
2. **Platform**: AWS CloudFormation, referencing best practices from https://github.com/aws-samples/aws-cloudformation-samples.
3. **Resources**:
   - Deploy a new VPC with an associated Internet Gateway.
   - Within the VPC, deploy an EC2 instance with an Elastic IP address.
   - Configure a security group for the EC2 instance to allow SSH (port 22) access only from a specific IP address (use a parameter to specify the IP, e.g., `AllowedSSHIPAddress`).
   - Attach an IAM role to the EC2 instance granting read-only access to all S3 buckets in the account (use AWS managed policy `AmazonS3ReadOnlyAccess`).
   - Use AWS Systems Manager Parameter Store to store sensitive configuration values (e.g., a configuration string or key) and retrieve them during EC2 instance initialization via user data.
4. **Constraints**:
   - All resources must be defined in a single CloudFormation YAML template.
   - Deploy the infrastructure in the us-west-2 region.
   - Ensure the EC2 instance is deployed within the created VPC.
   - Use standard AWS naming conventions for resources (e.g., include `batchName: Batch 003 -Expert-CloudFormation-YAML`, `projectId: 166`, `projectName: IaC - AWS Nova Model Breaking`, and `Problem ID: Cloud_Environment_Setup_CloudFormation_YAML_9kfhjsre9e3f` in resource tags or descriptions).
   - Validate that all resources are correctly linked (e.g., EC2 instance in the VPC, security group attached, IAM role associated).
   - Ensure the template can be deployed successfully as a child stack.
5. **Output**: Provide a single, complete CloudFormation YAML template that:
   - Includes a comprehensive set of resources (VPC, subnets, Internet Gateway, route tables, EC2 instance, Elastic IP, security group, IAM role, and Parameter Store).
   - Uses AWS Systems Manager Parameter Store to store and retrieve at least one sensitive configuration value (e.g., a configuration string) during EC2 instance initialization.
   - Is validated for syntactic correctness and deployability in the us-west-2 region.
   - Includes comments explaining key sections for clarity.
   - Outputs the EC2 instance's public IP and any other relevant resource IDs.

**Additional Notes**:
- Use a `t3.micro` instance type for the EC2 instance unless otherwise specified.
- Use the latest Amazon Linux 2 AMI for the EC2 instance (retrieved dynamically using `Fn::FindInMap` or a similar method).
- Include a parameter for the SSH key pair name to associate with the EC2 instance.
- Ensure the template follows AWS best practices for security and resource configuration.
- Do not include external files or references outside the single YAML template.
- The template should be self-contained and ready for deployment in a CloudFormation stack.

**Expected Deliverable**: A single CloudFormation YAML file wrapped in the appropriate format, ready for deployment in the us-west-2 region, adhering to all specified requirements and constraints.