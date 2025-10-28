Create an AWS CloudFormation template in YAML for a production-ready web application environment.

Here are the requirements for the setup:

VPC and Networking: Design a Virtual Private Cloud with at least two public subnets and two private subnets spread across multiple availability zones in the us-west-1 region. Set up an Internet Gateway to provide internet access for the public subnets. Create NAT Gateways in the public subnets to allow outbound internet connectivity for resources in the private subnets. Configure appropriate route tables for both public and private subnets to ensure proper traffic flow. All networking resources should follow the 'prod-' naming convention followed by the respective service name.

Auto Scaling and Compute: Implement an Auto Scaling Group for EC2 instances that can scale based on CPU utilization metrics. The Auto Scaling configuration should automatically adjust the number of instances to handle varying application loads efficiently. Deploy EC2 instances with appropriate security groups that allow necessary inbound and outbound traffic. Ensure all compute resources are named with the 'prod-' prefix followed by the service identifier.

Load Balancing: Set up an Application Load Balancer to distribute incoming traffic across the EC2 instances in the Auto Scaling Group. Configure the ALB with an SSL certificate from AWS Certificate Manager to enable secure HTTPS connections. The load balancer should be deployed across multiple availability zones for high availability and fault tolerance. Apply the 'prod-' naming convention to the ALB and related resources.

IAM Roles: Create IAM roles that follow the least privilege principle for EC2 instances and other services. The EC2 instances must assume an IAM role with only the necessary permissions required for their function. Ensure that the IAM policies are tightly scoped to prevent unnecessary access to AWS resources. Name the IAM roles with the 'prod-' prefix.

Database: Set up an RDS database instance using the db.t3.micro instance class for cost-effectiveness. Deploy the RDS instance in the private subnets to ensure it is not directly accessible from the internet. Configure appropriate security groups to allow database connections only from the application EC2 instances. Follow the 'prod-' naming convention for the RDS instance and related resources.

Storage: Create an S3 bucket for storage needs with logging enabled for all bucket access. Implement proper bucket policies and access controls to secure the stored data. Configure S3 access logging to track all requests made to the bucket for audit and compliance purposes. The S3 bucket should be named following the 'prod-' prefix convention.

Monitoring and Logging: Enable CloudWatch monitoring for the application environment. Implement a CloudWatch alarm specifically to detect any 5xx errors from the application. This alarm should trigger notifications when server-side errors occur, allowing for quick response to application issues. Configure appropriate CloudWatch metrics and logging for all critical components of the infrastructure.

Template Features: Use CloudFormation to manage the infrastructure as code in YAML syntax. Ensure all resources are deployed in the us-west-1 region. Apply consistent resource naming conventions with the 'prod-' prefix followed by the service name throughout the template. Use parameters for configurable values to make the template flexible and reusable. Include an Outputs section to display important resource identifiers after deployment.

Please ensure the final YAML template is valid and would pass standard AWS CloudFormation validation tests.
