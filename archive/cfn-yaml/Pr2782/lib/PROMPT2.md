Your provided TapStack.yml stack is giving CloudFormation lint errors. Please fix them and provide me a fully updated, lint-clean version of the YAML file:

Parameter DBPassword is used as MasterUserPassword, but currently defined as AWS::SSM::Parameter::Value<String> without NoEcho: true. Error:

W2501 Parameter DBPassword used as MasterUserPassword, therefore NoEcho should be True
lib/TapStack.yml:40:3


Instead of a plain parameter for secrets, dynamic references (SSM SecureString) should be used. Error:

W1011 Use dynamic references over parameters for secrets
lib/TapStack.yml:291:7


The AWSConfigRole ARN is invalid, since it must be a proper IAM role ARN, not a managed policy. Error:

E1156 'arn:aws:iam::aws:policy/service-role/AWSConfigRole' is not a 'AWS::IAM::Role.Arn'
lib/TapStack.yml:332:7


Please update the stack to:

Fix the DBPassword parameter to use NoEcho: true and leverage SSM dynamic references for secure secret retrieval.

Correct the AWS Config recorder role to provision a valid IAM role (AWS::IAM::Role) with required policies instead of using a managed policy ARN directly.

Ensure all fixes pass cfn-lint and aws cloudformation validate-template without warnings or errors.