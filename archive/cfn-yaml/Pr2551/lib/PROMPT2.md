Your provided TapStack.yml is giving CloudFormation linting errors. Please fix the template so that it passes cfn-lint validation without issues.

The exact errors are:

W3687 ['FromPort', 'ToPort'] are ignored when using 'IpProtocol' value -1
lib/TapStack.yml:165:11

E3030 'SecureString' is not one of ['String', 'StringList']
lib/TapStack.yml:233:7

E3002 Additional properties are not allowed ('KeyId' was unexpected)
lib/TapStack.yml:235:7

E3003 'IsLogging' is a required property
lib/TapStack.yml:251:5


Requirements for the fix:

Remove FromPort/ToPort when IpProtocol: -1.

Use a supported Type for SSM parameters (String or StringList), but still ensure secure storage best practices are followed.

Remove the unsupported KeyId property in AWS::SSM::Parameter.

Add the required IsLogging: true property for the AWS::CloudTrail::Trail resource.