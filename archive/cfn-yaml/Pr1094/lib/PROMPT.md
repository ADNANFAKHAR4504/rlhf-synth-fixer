I need your help setting up a secure AWS infrastructure for our NovaModel project.

Could you create a complete, self-contained CloudFormation YAML template for our production environment in `us-east-1`? We've got some specific requirements to make sure everything is secure and consistent. Here's a breakdown:

---
### A Few Ground Rules

* **Naming:** Everything should follow this format: `novamodel-sec-prod-<resource-type>`. For example, a security group would be `novamodel-sec-prod-app-sg`.
* **Tagging:** Let's make sure every resource gets these tags:
* `Project`: `NovaModelBreaking`
* `Environment`: `Production`
* `Owner`: `DevSecOpsTeam`

---
### Core Infrastructure Details

1. **VPC Setup:** We need a VPC with two public and two private subnets across different AZs for high availability. The database and Lambda functions should **only** be in the private subnets.

2. **IAM Roles:** Let's stick to the principle of least privilege. All roles should be defined with `AWS::IAM::Role` and have the absolute minimum permissions they need to function. For instance, the Lambda role should only be able to write to its specific DynamoDB table. Also, no policies directly on users, pleaseonly on roles.

3. **Data & Encryption:**
* **S3 Buckets:** Any S3 buckets must have server-side encryption (`AES-256`) enabled by default.
* **RDS Database:** The database instance needs to be provisioned inside our private subnets.
* **EBS Volumes:** We need a customer-managed KMS key created specifically for encrypting the EC2 volumes.
* **DynamoDB:** Any tables should have Point-in-Time Recovery (PITR) enabled.

4. **Compute & API:**
* **Lambda:** Any functions need VPC access, placing them in the private subnets with their own dedicated security group.
* **API Gateway:** The API stage needs to be configured to require an API key.

5. **Logging is key, so:**
* **CloudTrail:** Let's set up a trail to log all management and data events for the whole account, with the logs going to a dedicated, encrypted S3 bucket.
* **CloudFormation Logs:** We should also have a specific log group just for the stack's lifecycle events (create, update, delete).

6. **Network Security:** Security groups should be locked down. The web tier should only allow inbound traffic on ports 80 and 443 from the internet, and the database security group should only allow traffic from the application's security group on the database port.

---
### The Final Result

The goal is a single, clean YAML file that's ready to deploy without errors. Good comments to explain any tricky parts would be a huge help. Thanks!
