Design and implement secure infrastructure using Pulumi with Go that meets strict HIPAA compliance requirements. Can you create single tap_stack.go file as per below requirements -
1. There is requirement to have resources deployed in single region us-west-2. So Please create proper VPC in this region. set specific CIDR for the VPC. VPCs with CIDR blocks: 10.0.0.0/16 for this region.
2. VPCs should have 2 private and 2 public subnets in VPC.
3. Create RDS instance with Multi AZ support and use random master username of 8 characters without special letters and use random master password of 16 charatceters with specical characters.
4. Create Auto scaling group with launch template referring to latest amazon linux 2 AMI.
5. can u also Create S3 bucket to store the static content with versioning enabled
6. Can u Create IAM role with least privilige policy for secure inter-service communication.
7. Configure CloudWatch logging with a retention period of 30 days for the resources being created in this tech stack.
8. Show the outputs for all the resources being created .
9. Define proper provider for us-west-2 to avoid conflicts in resource creations

