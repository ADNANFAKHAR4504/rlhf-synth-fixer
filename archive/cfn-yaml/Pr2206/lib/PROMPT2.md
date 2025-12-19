# Turn 2 Prompt

The CloudFormation template you provided has several issues that prevent it from being production-ready and portable:

1. **Hard-coded Availability Zones**: You specified "us-west-2a" and "us-west-2b" directly in the subnets. This makes the template not portable to other regions. Please use dynamic AZ selection with `!GetAZs` or `Fn::GetAZs`.

2. **Outdated AMI ID**: The AMI ID "ami-0c02fb55956c7d316" in your RegionMap is hard-coded and may be outdated. Please use AWS Systems Manager Parameter Store to dynamically fetch the latest Amazon Linux 2 AMI ID.

3. **Required Manual Parameters**: The template requires manual input for KeyPairName and DBPassword, making it not fully automated. Please either make the KeyPair optional or create one automatically, and generate a secure password automatically.

4. **Missing Template Validation**: Please ensure the template passes AWS CloudFormation validation using `aws cloudformation validate-template`.

Please provide an improved version of the CloudFormation template that addresses all these portability and automation issues.