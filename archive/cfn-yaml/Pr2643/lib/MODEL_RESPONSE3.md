The deployment failed because two required parameters — KeyName and CertificateArn — were not provided at stack creation time.

Root Cause

In the CloudFormation template, these parameters were declared without default values or conditions:

KeyName:
  Type: AWS::EC2::KeyPair::KeyName
  Description: Name of an existing EC2 KeyPair

CertificateArn:
  Type: String
  Description: ACM certificate ARN for HTTPS


KeyName is mandatory when launching EC2 instances if SSH access is enabled, but in automated or demo deployments this is often not required.

CertificateArn is mandatory when attaching an HTTPS listener to the Application Load Balancer, but it must point to an ACM certificate provisioned in the same region (us-east-1 in this case).

Without explicit values, CloudFormation throws a ValidationError during CreateChangeSet.

Correct Fix

Two approaches can resolve this issue:

Provide values at deployment

Pass both parameters when creating the stack:

aws cloudformation create-stack \
  --stack-name TapStack \
  --template-body file://TapStack.yml \
  --parameters ParameterKey=KeyName,ParameterValue=MyKeyPair \
               ParameterKey=CertificateArn,ParameterValue=arn:aws:acm:us-east-1:123456789012:certificate/abc-123


Make parameters optional in the template

Add Default: "" to both parameters.

Use Conditions so that the resources depending on them are created only if values are provided. For example:

Parameters:
  KeyName:
    Type: String
    Default: ""
    Description: (Optional) EC2 KeyPair for SSH access
  CertificateArn:
    Type: String
    Default: ""
    Description: (Optional) ACM certificate ARN for HTTPS

Conditions:
  HasKeyName: !Not [!Equals [!Ref KeyName, ""]]
  HasCertificate: !Not [!Equals [!Ref CertificateArn, ""]]


Update the Launch Template and Listener resources to check these conditions.

Outcome

With option (1), the stack requires explicit values each deployment but is stricter and production-ready.

With option (2), the template becomes more flexible:

If KeyName is not provided, EC2 instances launch without SSH access (more secure by default).

If CertificateArn is not provided, the ALB listener can fall back to HTTP or skip creation until a certificate is available.