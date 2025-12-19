Above prompt caused this error in deploy An error occurred (ValidationError) when calling the CreateChangeSet operation: Template format error: Every Default member must be a string.

```yaml
and lint stage :E2001 {'Fn::Sub': '${AWS::StackName}-${AWS::AccountId}'} is not of type 'string'
lib/TapStack.yml:12:5

W1031 {'Fn::Sub': 'alias/rds-encryption-${RandomSuffix}'} does not match '^(alias/)[a-zA-Z0-9:/_-]+$' when 'Fn::Sub' is resolved
lib/TapStack.yml:132:7

W1031 {'Fn::Sub': 'AppSecurityGroup-${RandomSuffix}'} is not a 'AWS::EC2::SecurityGroup.Name' with pattern '^[a-zA-Z0-9 \\._\\-:\\/()#\\,@\\[\\]+=&;\\{\\}!\\$\\*]+$' when 'Fn::Sub' is resolved
lib/TapStack.yml:139:7

W1031 {'Fn::Sub': 'DBSecurityGroup-${RandomSuffix}'} is not a 'AWS::EC2::SecurityGroup.Name' with pattern '^[a-zA-Z0-9 \\._\\-:\\/()#\\,@\\[\\]+=&;\\{\\}!\\$\\*]+$' when 'Fn::Sub' is resolved
lib/TapStack.yml:167:7

W1031 {'Fn::Sub': 'S3ReadOnlyRole-${RandomSuffix}'} is longer than 64 when 'Fn::Sub' is resolved
lib/TapStack.yml:258:7

W1031 {'Fn::Sub': 'S3ReadOnlyPolicy-${RandomSuffix}'} does not match '^[a-zA-Z0-9+=,.@\\-_]+$' when 'Fn::Sub' is resolved
lib/TapStack.yml:276:7

W1020 'Fn::Sub' isn't needed because there are no variables
lib/TapStack.yml:316:11

W1031 {'Fn::Sub': 'AppLoadBalancer-${RandomSuffix}'} does not match '^([\\p{L}\\p{Z}\\p{N}_.:/=+\\-@]*)$' when 'Fn::Sub' is resolved
lib/TapStack.yml:368:11

W3011 Both 'UpdateReplacePolicy' and 'DeletionPolicy' are needed to protect resource from deletion
lib/TapStack.yml:384:3

W1031 {'Fn::Sub': 'app-database-${RandomSuffix}'} does not match '^$|^[a-zA-Z]{1}(?:-?[a-zA-Z0-9]){0,62}$' when 'Fn::Sub' is resolved
lib/TapStack.yml:388:7

E3691 '8.0' is not one of ['5.7.44-rds.20240408', '5.7.44-rds.20240529', '5.7.44-rds.20240808', '5.7.44-rds.20250103', '5.7.44-rds.20250213', '5.7.44-rds.20250508', '8.0.37', '8.0.39', '8.0.40', '8.0.41', '8.0.42', '8.0.43', '8.4.3', '8.4.4', '8.4.5', '8.4.6']
lib/TapStack.yml:391:7

W1031 {'Fn::Sub': 'cloudtrail-logs-${RandomSuffix}'} is longer than 63 when 'Fn::Sub' is resolved
lib/TapStack.yml:442:7

W1031 {'Fn::Sub': 'cloudtrail-logs-${RandomSuffix}'} does not match '^[a-z0-9][a-z0-9.-]*[a-z0-9]$' when 'Fn::Sub' is resolved
lib/TapStack.yml:442:7

E3003 'IsLogging' is a required property
lib/TapStack.yml:487:5

W1031 {'Fn::Sub': 'AppCloudTrail-${RandomSuffix}'} does not match '(^[a-zA-Z0-9]$)|(^[a-zA-Z0-9]([a-zA-Z0-9\\._-])*[a-zA-Z0-9]$)' when 'Fn::Sub' is resolved
lib/TapStack.yml:488:7

W1031 {'Fn::Sub': 'aws-config-${RandomSuffix}'} does not match '^[a-z0-9][a-z0-9.-]*[a-z0-9]$' when 'Fn::Sub' is resolved
lib/TapStack.yml:519:7

W1031 {'Fn::Sub': 'AppWebACL-${RandomSuffix}'} does not match '^[0-9A-Za-z_-]{1,128}$' when 'Fn::Sub' is resolved
lib/TapStack.yml:615:7

W1031 {'Fn::Sub': 'AppWebACL-${RandomSuffix}'} does not match '^[\\w#:\\.\\-/]+$' when 'Fn::Sub' is resolved
lib/TapStack.yml:647:9

W1031 {'Fn::Sub': '/aws/application/${RandomSuffix}'} does not match '^[.\\-_/#A-Za-z0-9]{1,512}\\Z' when 'Fn::Sub' is resolved
lib/TapStack.yml:653:7

W1031 {'Fn::Sub': 'TrustedAdvisorRole-${RandomSuffix}'} is longer than 64 when 'Fn::Sub' is resolved
lib/TapStack.yml:677:7
```

can you please fix them
