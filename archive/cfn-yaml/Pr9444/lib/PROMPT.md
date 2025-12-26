# Production Secure Environment - CloudFormation YAML

Create a CloudFormation template in YAML that sets up a secure AWS environment for production use in us-east-1. All resource names should start with the prefix ProdEnv.

## VPC Configuration

Set up a VPC with only private subnets - no public subnets or Internet Gateways. The VPC connects to AWS services through VPC Endpoints instead of internet access. Include at least two private subnets across two different Availability Zones for high availability. The private subnets route traffic through the VPC Endpoints to reach S3 and CloudWatch.

## EC2 Instances

Launch EC2 instances inside the private VPC. The EC2 instances connect to S3 using an IAM Role attached via Instance Profile. The role grants GetObject and PutObject permissions on the ProdEnvDataBucket. Do not hardcode any access keys - the instances authenticate using the IAM role.

## CloudWatch Monitoring

Configure CloudWatch Alarms that monitor each EC2 instance. The alarms track CPUUtilization and trigger when it exceeds 80 percent. When triggered, the alarm publishes a notification to an SNS topic called ProdEnvCpuAlertTopic. The CloudWatch agent on EC2 sends metrics through the VPC Endpoint.

## SNS Topic

Create an SNS topic that receives alerts from CloudWatch alarms. The topic subscribes to an email endpoint that can be passed as a parameter. When CPU threshold is breached, SNS delivers the alert to the subscribed email address.

## Security Requirements

Follow AWS security best practices with least privilege access. The security group allows only internal VPC traffic on ports 22, 80, and 443. All S3 buckets must have encryption enabled and public access blocked. Tag all resources with environment and project details.

## Output

The template should output the VPC ID, S3 bucket name, SNS topic ARN, and both EC2 instance IDs.
