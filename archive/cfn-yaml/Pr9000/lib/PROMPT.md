I need a CloudFormation YAML template for a secure web application stack.

Traffic flow

- Internet users connect to an internet facing Application Load Balancer in public subnets.
- The load balancer forwards requests to EC2 instances in an Auto Scaling group in private subnets.
- The application on the instances reads and writes data to an RDS database in private subnets.
- The instances serve static assets from an S3 bucket using an instance IAM role with least privilege.
- The instances send application and system logs to CloudWatch Logs.
- AWS Config records configuration changes and delivers snapshots to an S3 bucket.

Build the template with these requirements

- A VPC with public and private subnets across at least two Availability Zones.
- An internet gateway and routes for the public subnets.
- Private subnet outbound access for instance updates using a NAT gateway.
- An Application Load Balancer in the public subnets with listeners on port 80 and port 443, redirecting port 80 to port 443.
- A target group and Auto Scaling group for the web tier in private subnets.
- Security groups that reflect the connectivity described above.
  - The load balancer security group allows inbound 80 and 443 from the internet.
  - The instance security group allows inbound only from the load balancer security group.
  - The database security group allows inbound only from the instance security group.
- An RDS database instance with encryption at rest using a customer managed KMS key and automated backups enabled.
- An S3 bucket for static content with server side encryption using AES256, public access blocked, and a bucket policy that only permits access from the instance IAM role.
- An IAM role and instance profile for the EC2 instances with least privilege permissions scoped to the static content bucket and CloudWatch Logs.
- CloudWatch Logs configuration so the EC2 instances ship logs into a log group.
- AWS Config recorder, delivery channel, and an S3 bucket for Config data.
- SSH should not be open to the world. If you include SSH, restrict it to a single CIDR parameter.
- If you include API Gateway, ensure it enforces HTTPS only.

Security expectations

- Do not grant wildcard admin policies.
- Keep data encrypted at rest.
- Use least privilege everywhere.

Constraints

- Output only a valid CloudFormation YAML template.
- Use only CloudFormation native resources.
- The template must pass aws cloudformation validate-template.
