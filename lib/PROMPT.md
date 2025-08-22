write a Python application for the AWS CDK. The CDK stack needs to be organised like lib/Tapstack.py and the tap.py file at the root folder.

Set up a VPC with a minimum of two availability zones. use both private and public subnets. Route tables should be set up to respectiv separate private and public traffic.
Set up a security group of EC2 instances that will automatically scale. Install an elb behind EC2 instances.
Enable server-side encryption when creating S3 buckets. All public access should be block. Set up DynamoDB tables with point-in-time recovery activated.
RDS databases should be installed inside private subnets. Make sure that databases cannot be accessed directly from the internet. Use AWS Secrets Manager to store private information, such as database passwords.
Enforce least privilege access by clearly defining IAM roles. use AWS Config as well. Integrate AWS WAF with a CloudFront so that attacks can be prvent.

use US-West-2 region for deployment. No sensitive service or database should be accessible over the internet. It is necessary to use consistent naming conventions like Format: resource-type-project-name

Using at least two availability zones for high availability. EC2 instances operating in an Auto Scaling group behind a load balancer, and needed IAM roles enforcing least-privilege permissions are all components of the stack. Storage services such as S3 and DynamoDB will be provisioned with encryption and recovery features should be there.

For automated deployment, all resources will be defined in Python CDK constructs within lib/Tapstack.py and synth via tap.py into respective CloudFormation templates.