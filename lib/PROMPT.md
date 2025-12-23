our mission is to design and implement a robust, secure, and scalable cloud infrastructure using AWS CDK in Python to host a dynamic web application. The solution must strictly follow best practices for security, high availability, and efficient resource allocation.

 Folder Structure
graphql
Copy
Edit
root/
├── tap.py                     # CDK App entry point
├── lib/
│   └── tap_stack.py           # Main CDK stack logic
└── tests/
    ├── unit/
    │   └── tests_tap_stack.py  # Unit tests for individual constructs
    └── integration/
        └── test_tap_stack.py  # Integration tests for stack output and deployment
 Requirements
️ Infrastructure Setup
Region: us-east-2 (OHIO), must span three availability zones for high availability.

VPC:

Include both public and private subnets across three AZs.

Enable NAT Gateway for internet access from private subnets.

Compute:

Use EC2 instances in private subnets to host a web application.

Attach instances to an Auto Scaling Group based on CPU utilization.

Use an Application Load Balancer (ALB) in public subnets to distribute traffic to EC2 instances.

Database:

Deploy an Amazon RDS instance in private subnet (non-publicly accessible).

Enable KMS encryption for data at rest.

Static File Hosting:

Create an S3 bucket for static files.

Make it publicly accessible only for static content.

Enable bucket encryption using AWS KMS.

Security:

Use Security Groups to control traffic (e.g., ALB allows 80/443, EC2 only from ALB, RDS internal only).

Implement IAM roles and policies following least privilege principles.

Monitoring and Logging:

Enable CloudWatch Logs and Alarms for EC2, RDS, ALB, and Auto Scaling.

Backup and Recovery:

Use AWS Backup to back up RDS and critical data in S3 or EC2 EBS volumes.

Naming Convention:

All resources must follow the format:

php-template
Copy
Edit
<project>-<env>-<resource-type>  
Example: myapp-prod-vpc, myapp-dev-web-asg
️ Configuration
Use Pulumi’s equivalent: CDK’s cdk.json, environment variables, or config YAML to manage:

Resource sizes (EC2 type, RDS class)

Environment (dev/prod)

Project name and tags

 Output Expectations
Your CDK implementation should include:

tap_stack.py: All infrastructure defined modularly and tagged properly.

tap.py: The CDK entry point that synthesizes the app.

tests/unit/tests_tap_stack.py: Unit tests to check individual resource properties.

tests/integration/test_tap_stack.py: Integration tests to validate outputs and full resource relationships.