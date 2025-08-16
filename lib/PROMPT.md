Prompt: Generate CloudFormation (YAML) IaC — lib/tapstack.yaml

You are an expert Infrastructure-as-Code (IaC) generator. Follow Anthropic Claude–style best practices: be explicit, deterministic, and constraint-driven. Think through the solution internally, but output only the final YAML file as requested—no explanations.

Goal

Produce a single CloudFormation YAML template that creates a secure, production-ready application environment in AWS, respecting all constraints below.

Folder Structure (must adhere)
└── lib/
    └── tapstack.yaml  # Main stack definition (CloudFormation YAML)

Inputs (verbatim; do not alter any text below)

Environment:
Develop a CloudFormation YAML template to set up a secure, production-ready application environment within AWS. The environment must adhere to the following requirements: 1) Deploy all resources in the us-east-1 region; 2) Use an existing VPC identified by VPC ID vpc-12345abcde; 3) EC2 instances must run on the latest Amazon Linux 2 AMI; 4) Configure security groups to only allow inbound SSH and HTTPS traffic; 5) All resources must be tagged with 'Environment:Production'; 6) Any S3 Buckets created must have server-side encryption enabled; 7) Use YAML formatting for CloudFormation templates. Expected output is a YAML file that passes validation and successfully creates the desired infrastructure in AWS.

Constraints Items:
Use AWS CloudFormation YAML templates. | Deploy resources in the us-east-1 region. | Resources must be tagged with Environment:Production. | Use an existing VPC identified by VPC ID vpc-12345abcde. | Security groups should allow inbound SSH and HTTPS traffic only. | S3 Bucket must have server-side encryption enabled. | Use latest Amazon Linux 2 AMI for EC2 instances.

Proposed Statement:
The goal is to deploy an application environment in AWS using CloudFormation. This should be done entirely with YAML templates, within the us-east-1 region, using an existing VPC and properly configured security groups, EC2 instances, and S3 buckets.

Important: The three blocks above are provided data. Do not change, rephrase, or omit any part of them. You may reference them, but they must remain intact.

What to Build (minimum viable, production-ready)

Create resources that collectively satisfy the inputs:

Security Group in VPC vpc-12345abcde that:

Allows inbound TCP 22 (SSH) and 443 (HTTPS) only (from 0.0.0.0/0 unless constrained by parameter).

Allows all outbound traffic.

Is tagged with Environment:Production.

EC2 Instance that:

Launches in us-east-1.

Uses the latest Amazon Linux 2 AMI (resolve via SSM public parameter; do not hardcode an AMI ID).

Associates to the above Security Group.

Launches in a subnet belonging to vpc-12345abcde (accept SubnetId as a parameter).

Is tagged with Environment:Production.

S3 Bucket (for application assets/logs or similar) that:

Has server-side encryption enabled (SSE-S3 at minimum).

Is tagged with Environment:Production.

Template Requirements

Format: Valid CloudFormation YAML only (no JSON, no prose).

Sections: Use Description, Parameters, Mappings (if needed), Resources, and Outputs.

Region: Ensure compatibility with us-east-1.

Parameters (recommended):

VpcId with Default = vpc-12345abcde and a constraint description indicating it must be the existing VPC.

SubnetId (string) — instruct that it must belong to vpc-12345abcde.

InstanceType (default like t3.micro).

IngressCidrSsh and IngressCidrHttps (defaults 0.0.0.0/0), but restricted to ports 22 and 443 only.

Latest Amazon Linux 2 AMI: Resolve via SSM parameter type
{{AWS::SSM::Parameter::Value<AWS::EC2::Image::Id>}} referencing
/aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2.

Tags: Add Environment:Production to every taggable resource.

Security: Only SSH (22) and HTTPS (443) inbound; no other inbound rules.

SSE on S3: Use bucket-level BucketEncryption with AES256.

Outputs: Provide at least:

SecurityGroupId

InstanceId

InstancePublicIp (if applicable)

BucketName

Quality Bar & Self-Checks (perform internally; do not print)

The YAML must validate with aws cloudformation validate-template.

The template must be idempotent and deployable in us-east-1.

No resources violate the inbound rule constraint (only 22 and 443).

All resources include the Environment:Production tag.

AMI lookup uses SSM parameter (no hardcoded AMI).

S3 bucket has server-side encryption.

VPC is the existing one: vpc-12345abcde.

Output Format (strict)

Output only the final CloudFormation YAML for lib/tapstack.yaml in a single fenced code block:

Use triple backticks with yaml.

Do not include any explanations, comments, or extra text before/after the code block.

The YAML must be complete and ready to deploy.