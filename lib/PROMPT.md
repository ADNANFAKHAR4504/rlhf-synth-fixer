You are an expert AWS DevOps Engineer specializing in Infrastructure as Code (IaC) and cloud security. Your task is to generate a single, comprehensive CloudFormation YAML template that provisions a secure AWS infrastructure.

The template must be entirely self-contained, deployable within a single AWS account in the `us-east-1` region, and satisfy all the security and configuration requirements listed below.

### General Requirements

* **Naming Convention**: All resources must adhere to the naming convention: `novamodel-sec-prod-<resource-type>` (e.g., `novamodel-sec-prod-app-sg`).
* **Tagging**: All created resources must be tagged with the following key-value pairs:
    * `Project`: `NovaModelBreaking`
    * `Environment`: `Production`
    * `Owner`: `DevSecOpsTeam`

### Specific Infrastructure and Security Requirements

1.  **VPC and Networking**:
    * Create a foundational VPC with at least two private subnets and two public subnets across different Availability Zones.
    * Ensure RDS instances and Lambda functions are placed within the private subnets.

2.  **IAM (Identity and Access Management)**:
    * Define all IAM roles using `AWS::IAM::Role` and strictly adhere to the **principle of least privilege**. For example, create a specific role for a Lambda function that only allows it to write to a specific DynamoDB table.
    * Ensure that any IAM policies are attached only to roles or groups, with no policies attached directly to users.

3.  **Data Storage and Encryption**:
    * **S3 Buckets**: All defined `AWS::S3::Bucket` resources must have server-side default encryption enabled using `AES-256`.
    * **RDS Instances**: Provision an `AWS::RDS::DBInstance` within the VPC, using a properly configured `DBSubnetGroup`.
    * **EBS Volumes**: Create a customer-managed `AWS::KMS::Key` specifically for encrypting EBS volumes. Any EC2 instances defined should use this key for their volumes.
    * **DynamoDB Tables**: For any `AWS::DynamoDB::Table` resources, ensure Point-in-Time Recovery (PITR) is enabled.

4.  **Compute and API**:
    * **Lambda Functions**: Configure any `AWS::Lambda::Function` to have VPC access, placing them within the private subnets and assigning them a dedicated security group.
    * **API Gateway**: Configure an `AWS::ApiGateway::Stage` to require an API key for access management.

5.  **Logging and Monitoring**:
    * **CloudTrail**: Enable an `AWS::CloudTrail::Trail` to log all management and data events for the entire account. Configure it to deliver logs to a dedicated, encrypted S3 bucket.
    * **CloudFormation Logs**: Include an `AWS::Logs::LogGroup` to specifically record logs generated during the CloudFormation stack's creation, update, and deletion events.

6.  **Network Security**:
    * Define `AWS::EC2::SecurityGroup` resources that allow traffic **only on essential ports**. For example, a web server security group should only allow inbound traffic on ports 80 and 443 from the internet (`0.0.0.0/0`), while an RDS security group should only allow inbound traffic on the database port from the application's security group.

### Expected Output

Produce a single, complete, and valid CloudFormation YAML file that meets all the constraints listed above. The template must correctly reference all resources and manage dependencies to ensure the stack can be created successfully without any errors. The YAML should be well-formatted and include comments where necessary to clarify complex configurations.
