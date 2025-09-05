The template you gave me has the following lint errors:
E3014 Only one of ['CidrIp', 'CidrIpv6', 'DestinationSecurityGroupId', 'DestinationPrefixListId'] is a required property
lib\TapStack.yml:331:11

E3002 Additional properties are not allowed ('SourceSecurityGroupId' was unexpected)
lib\TapStack.yml:334:11

E3006 Resource type 'AWS::IAM::AccountPasswordPolicy' does not exist in 'us-east-1'
lib\TapStack.yml:342:5

E3002 Additional properties are not allowed ('CloudWatchConfigurations' was unexpected)        
lib\TapStack.yml:436:9

W3011 Both 'UpdateReplacePolicy' and 'DeletionPolicy' are needed to protect resource from deletion
lib\TapStack.yml:482:3

E3691 '8.0.35' is not one of ['5.7.44', '5.7.44-rds.20240408', '5.7.44-rds.20240529', '5.7.44-rds.20240808', '5.7.44-rds.20250103', '5.7.44-rds.20250213', '5.7.44-rds.20250508', '8.0.37', '8.0.39', '8.0.40', '8.0.41', '8.0.42', '8.0.43', '8.4.3', '8.4.4', '8.4.5', '8.4.6']
lib\TapStack.yml:489:7

W1011 Use dynamic references over parameters for secrets
lib\TapStack.yml:491:7

E3003 'IsLogging' is a required property
lib\TapStack.yml:591:5

Fix this and give me the complete template