Hey! Can you create a Pulumi Python script that builds a scalable AWS environment in the us-west-2 region using the default VPC? Here’s what it should do:

- Launch an EC2 instance using the latest Amazon Linux 3 AMI with instance type `t2.micro`.
- Set up an Auto Scaling Group to maintain between 1 and 3 instances based on load.
- Instead of SSH access, configure the instances to be managed securely via AWS Systems Manager (SSM).
- Create an S3 bucket with server-side encryption enabled using AES-256.
- Define an IAM role with permissions allowing EC2 and S3 access, attaching that role to the EC2 instances.
- Enable logging of important actions on the EC2 instances and the S3 bucket.
- Include all IAM roles and policies inline within the Pulumi stack to keep things maintainable.
- Manage everything declaratively using Pulumi Python, following best practices for security and scalability.

Please remember to keep the code clean, budget-concious as well as production ready!
