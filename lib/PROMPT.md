You are an AWS Infrastructure Engineer.

Your task is to write a CloudFormation YAML template to deploy a scalable, production-ready web application in the us-west-2 region. The solution must meet the following requirements:

Networking & Security

Create all required networking resources (VPC, subnets, route tables, etc.) as needed.

Define security groups to allow inbound internet traffic on HTTP (port 80) and HTTPS (port 443) to the application load balancer.

Allow the EC2 instances to receive traffic only from the load balancer.

Ensure all resources are tagged with Environment: Production.

Compute & Load Balancing

Use the latest Amazon Linux 2 AMI in us-west-2 for your EC2 instances.

Create a Launch Template for the EC2 instances that pulls application code from a public S3 bucket during startup.

Set up an Auto Scaling Group with a minimum of 2 instances and a maximum of 4.

Deploy an Application Load Balancer (ALB) to distribute incoming traffic across EC2 instances, supporting both HTTP and HTTPS.

Outputs

Output the Load Balancer DNS name.

Output the Application URL (using the ALB DNS name and HTTP/HTTPS).

Best Practices

All resources must be created in the us-west-2 region.

Ensure the template is valid YAML and will deploy successfully in CloudFormation without manual modification.

Tag all resources with Environment: Production.

Expected Output:
A complete and valid CloudFormation YAML template that fulfills all requirements and passes CloudFormation validation checks.
