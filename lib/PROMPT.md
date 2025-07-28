You are tasked with setting up a development environment within AWS using CloudFormation.
All resources must be created in the us-west-2 region, within the existing VPC vpc-12345 and using the existing Security Group sg-67890.
Your CloudFormation template must fulfill the following requirements:

Parameterize at least two values in the template to allow future updates.

Tag all resources with Environment: Development.

Create a public S3 bucket with a bucket policy that allows public read access, and enable CloudWatch logging for the bucket.

Deploy a t2.micro EC2 instance associated with the specified security group, in the existing VPC. The EC2 instance:

Must allow SSH access only from 203.0.113.0/24.

Must have a public Elastic IP.

Must have an IAM role attached that allows read-only S3 access (define the role and policy within the same template).

Monitor the EC2 instance's CPU usage using a CloudWatch Alarm. The alarm should trigger if CPU utilization goes above 80% for five consecutive minutes.

Use CloudFormation Outputs to reveal both the S3 bucket name and the EC2 instance’s public IP address.

All IAM roles, policies, and access controls must be defined within the same CloudFormation template.
Your template should be robust and suitable for repeated deployments in a development environment.

Expected Output:
A CloudFormation YAML template that successfully deploys all the above resources, passes all requirements, and returns the required outputs.