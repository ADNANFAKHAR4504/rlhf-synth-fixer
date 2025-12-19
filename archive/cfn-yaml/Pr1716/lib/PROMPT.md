# Create an AWS CloudFormation template in YAML for a web application environment

The template must meet these requirements:

* All resources must be deployed in the `us-east-1` region.
* It should include an Application Load Balancer (ALB) that can handle both
  HTTP and HTTPS traffic.
* The web application will be hosted on EC2 instances.
* Ensure the EC2 instances have a publicly accessible SSH port (port 22) for
  administrative access.

Additionally, please make sure the template:

* Exports useful outputs like the public IP of the EC2 instance, the DNS
  name of the ALB, and the security group ID.
* Includes comments explaining any choices made for security or high availability.
* Is modular, readable, and follows AWS best practices.
* The final YAML file should pass `cfn-lint` and be ready to deploy.
