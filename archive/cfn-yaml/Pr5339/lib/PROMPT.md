Create a CloudFormation template in Yaml that provisions a consistent and secure infrastructure setup for three environments Dev, Staging, and Production. each environment must be independently managd and scaled but maintain identical configurations and functionalities, following aws best practices for automation security and montioring.

Requirements:

-define identical networking and compute resources (VPCs, EC2 instances, and RDS instances for the environments

-ensure RDS instances have consistent backup settings encryption enabled and Multi az configuration.

-use IAM roles and Security Groups to enforce secure isolated access between resources within each environment

Deploy separate S3 buckets for each environment with consistent naming conventions prefixed by environment names.

-Implement CloudWatch Alarms for EC2 CPU utilization exceeding 75% in all environments.

-create and then configure Security Groups to allow SSH only from a specified IP range and HTTP access from anywhere

-create a Elastic Load Balancer in front of EC2 instances for each environment.

-store AMI IDs and database credentials securely using AWS Systems Manager Parameter Store.

-Enable CloudTrail and send logs to an encrypted S3 bucket for centralized compliance monitoring.

-make sure of cost optimization through consistent Reserved Instance usage for EC2 and RDS resources.

-do tag all resources with standard keys: Environment, Project, and Owner for cost allocation and management

-make sure that there is environment isolation with no peering or shared resources between Dev, staging, and Production

-Create Lambda functions in each environment to automate regular RDS database snapshots

-Ensure all configurations are consistent reproducible and require no manual post-deployment changes.

-Validate the template to confirm successful deployment and parity across all environments

Expected Output:
Create a single Yaml cloudFormation file that automatically deploys a consistent isolated and fully functional environment; passing AWS CloudFormation validation checks and ready for direct deployment
Create a single template which can be used with any environment to setup that specific environment