What you’ll get

A single file, TapStack.yml, that creates an all-new, production-style stack in us-east-1 with:

VPC + 6 subnets (2 public, 2 private-app, 2 private-db), IGW, 2 NATs, routing

Security groups that restrict traffic correctly

Internet-facing ALB (HTTP 80), access logs to an encrypted S3 bucket

ASG of Amazon Linux 2 EC2 instances (Min=2 / Max=6 / Desired=2) with detailed monitoring

Launch Template using a safe SSM AMI alias parameter

CloudWatch Logs (nginx + system logs) via IAM role & awslogs agent

RDS MySQL 8.0.43 (Multi-AZ, encrypted, deletion protection, snapshot on replace/delete)

Consistent tagging: Environment: Production across resources

Clear and useful Outputs for integration and smoke-testing

Key safety choices baked in

AMI resolution via SSM (AmiId parameter) to avoid missing aliases

Optional KeyPair: if you don’t provide KeyName, the Launch Template omits it (no validation failures)

Secrets Manager for DB password + dynamic reference in the RDS resource (no plaintext parameters)

ALB access logs policy uses the correct us-east-1 principal and required ACL condition

RDS with DeletionPolicy + UpdateReplacePolicy = Snapshot

How to run it (high level)

Lint locally:

cfn-lint TapStack.yml

Create stack (no SSH):

aws cloudformation create-stack --stack-name TapStackProd --template-body file://TapStack.yml --capabilities CAPABILITY_NAMED_IAM

(Optional) Create stack with a real SSH KeyPair:

aws cloudformation create-stack --stack-name TapStackProd --template-body file://TapStack.yml --parameters ParameterKey=KeyName,ParameterValue=YourKeyPairName --capabilities CAPABILITY_NAMED_IAM

Get outputs:

aws cloudformation describe-stacks --stack-name TapStackProd

Post-deploy smoke tests

Hit AlbDnsName on port 80 and confirm the nginx “Hello from TapStack” page

Check /tapstack/app log group for nginx and system logs

Verify the S3 bucket is receiving ALB logs under alb-logs/AWSLogs/<accountId>/

Confirm RDS endpoint resolves and only accepts 3306 from the App SG

Troubleshooting tips

ChangeSet failure (AMI alias): keep the default AmiId value (gp2 alias) or supply a valid AMI ID in us-east-1

KeyPair error: either leave KeyName empty or ensure the KeyPair exists in us-east-1

Engine version error: choose a value allowed by CloudFormation (e.g., 8.0.43)

Access logs missing: recheck the bucket policy principal and ACL condition