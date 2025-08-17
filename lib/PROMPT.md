you are a senior AWS CloudFormation engineer, and your goal is to create a single, production-ready CloudFormation template in YAML.  will build a foundational, secure, multi-zone AWS environment in the us-east-1 region.

The Architecture
The stack will set up a new VPC and span it across multiple availability zones for high availability. It will include a pair of public subnets (with an Internet Gateway) and a pair of private subnets (with NAT Gateways) to handle network traffic. To ensure visibility into our network, Also configure VPC Flow Logs to be sent to an encrypted CloudWatch Logs group.

To serve our application, an internet-facing Network Load Balancer (NLB) will sit in the public subnets. This NLB will forward traffic to a fleet of EC2 instances running in the secure, private subnets. These instances will be automatically registered with a target group and configured for health checks.

For operational tasks, you can  include a single public Bastion Host in one of the public subnets. This instance will have a carefully crafted, least-privilege IAM role that provides just enough access to manage resources like S3, EC2, and CloudWatch.

Security is paramount. All EC2 instances will have Security Groups that limit access. The bastion host will only allow SSH from a specific, parameterized IP address, and the application instances will only accept traffic from the NLB, with no direct internet access.

Finally, set up a secure S3 bucket with encryption and public access blocked at the bucket level.

Key Details
The entire stack must be built using pure CloudFormation YAML, without external tools like CDK or SAM.

 make sure to use dynamic lookups for things like Availability Zones and the Amazon Linux 2 AMI to avoid hardcoding any values.

Every resource will be tagged with Environment=Production.

The template will include a short runbook as a comment, explaining how to test the stack after deployment.

Also include a few validated parameters for user input, such as the allowed SSH IP and the instance type.

Confirm that the template passes cfn-lint and meets all the security best practices I've outlined.

The final output will be a single file containing only the YAML template itself.