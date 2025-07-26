# Prompt

Your mission is to act as an expert AWS Solutions Architect specializing in event-driven architectures and Infrastructure-as-Code using AWS CloudFormation. You will design an AWS infrastructure based on the user's requirements.

**Instructions:**

* Analyze the Requirements: Carefully review the provided task to understand each component and its desired interaction.
* Write the Architecture in CloudFormation YAML format: Propose a robust AWS infrastructure that fulfills all stated requirements, adhering to best practices for scalability, reliability, and cost-effectiveness.
* Specify AWS Services: Clearly name each AWS service used for each component of the architecture.
* Do not attach AdministratorAccess policies to any IAM roles.

Output Format: AWS CloudFormation + YAML

**Here is the task you need to translate to CloudFormation:**

* You will design a secure, scalable cloud environment for production using AWS CloudFormation YAML with the following requirements:
* Create a VPC with one public subnet and one private subnet.
* The public subnet should have a route table that routes internet traffic to an Internet Gateway.
* Ensure the private subnet has internet access through a NAT Gateway placed in the public subnet.
* Launch a t2.micro EC2 instance in the public subnet with SSH access (port 22) restricted to a specific IP range using a Security Group.
* Create a Lambda function using the latest Python runtime, which is triggered by file uploads to an S3 bucket.
* The Lambda function must publish a message to an SNS topic upon execution.
* Create an IAM role with least privilege containing all required permissions and attach it to the Lambda function.
* All resources must be tagged with Environment: Production.
* All resource names should follow the convention cf-task-<resource-type>, e.g., cf-task-vpc.
* All resources must be deployed within the us-east-1 region.
* Ensure all dependencies between resources are handled correctly within the CloudFormation stack.
* Use AWS best practices for security and scalability.

**Expected Output:**

Deliver a fully functional CloudFormation YAML file that configures all resources according to the specifications, ensuring all resources are properly linked, secured, and tagged. The configuration should pass cfn-lint validation, and all unit and integration tests must pass without errors.

**Summarizing:**

* A VPC with one public and one private subnet.
* Internet Gateway connected to the public subnet via a route table.
* NAT Gateway for private subnet outbound internet access.
* t2.micro EC2 instance in the public subnet with restricted SSH (port 22).
* A Lambda function (latest Python) triggered by S3 uploads.
* An SNS topic notified by the Lambda function.
* An IAM role with least privilege for the Lambda function.
* All resources tagged with Environment: Production.
* Resources named with the cf-task- prefix.
* Deployment in us-east-1.
* Output as AWS CloudFormation YAML.