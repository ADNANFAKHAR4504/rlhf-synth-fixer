its showing error in lint and deploy stages 

lint 

Running linting for platform: cfn, language: json
CloudFormation project detected, running CloudFormation validation...
E8005 {'Fn::Select': [0, {'Fn::Split': [':', {'Ref': 'SNSOperationsTopicNameOrArn'}]}]} is not of type 'boolean'
lib/TapStack.json:50:9

W3005 'ECSTaskDefinition' dependency already enforced by a 'Ref' at 'Resources/ECSService/Properties/TaskDefinition'
lib/TapStack.json:709:9

Error: Process completed with exit code 6.

deploy 

Uploading to pr2888/1068c32e4b8579a004357d3e319b2750.template  31224 / 31224.0  (100.00%)
An error occurred (ValidationError) when calling the CreateChangeSet operation: Parameters: [SNSOperationsTopicNameOrArn, GitRepository] must have values
Error: Process completed with exit code 254.