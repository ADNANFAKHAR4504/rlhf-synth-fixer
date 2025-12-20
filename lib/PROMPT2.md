The above prompt is failing with these

E3002 Additional properties are not allowed ('CloudWatchConfigurations' was unexpected)
lib/TapStack.yml:322:9

E1019 'aws:username' is not one of ['Environment', 'Owner', 'Project', 'AllowedCIDR', 'DBUsername', 'DBPassword', 'KMSKey', 'KMSKeyAlias', 'VPC', 'InternetGateway', 'AttachGateway', 'PublicSubnet1', 'PublicSubnet2', 'PrivateSubnet1', 'PrivateSubnet2', 'PublicRouteTable', 'PublicRoute', 'PublicSubnetRouteTableAssociation1', 'PublicSubnetRouteTableAssociation2', 'WebServerSecurityGroup', 'BastionSecurityGroup', 'DatabaseSecurityGroup', 'S3Bucket', 'S3LoggingBucket', 'S3LogGroup', 'EC2Role', 'EC2InstanceProfile', 'DeveloperGroup', 'DBSubnetGroup', 'RDSDatabase', 'CloudTrailLogGroup', 'CloudTrailLogStream', 'CloudTrailRole', 'CloudTrail', 'CloudTrailBucket', 'CloudTrailBucketPolicy', 'LaunchTemplate', 'AWS::AccountId', 'AWS::NoValue', 'AWS::NotificationARNs', 'AWS::Partition', 'AWS::Region', 'AWS::StackId', 'AWS::StackName', 'AWS::URLSuffix']
lib/TapStack.yml:430:17

E1019 'aws:username' is not one of ['Environment', 'Owner', 'Project', 'AllowedCIDR', 'DBUsername', 'DBPassword', 'KMSKey', 'KMSKeyAlias', 'VPC', 'InternetGateway', 'AttachGateway', 'PublicSubnet1', 'PublicSubnet2', 'PrivateSubnet1', 'PrivateSubnet2', 'PublicRouteTable', 'PublicRoute', 'PublicSubnetRouteTableAssociation1', 'PublicSubnetRouteTableAssociation2', 'WebServerSecurityGroup', 'BastionSecurityGroup', 'DatabaseSecurityGroup', 'S3Bucket', 'S3LoggingBucket', 'S3LogGroup', 'EC2Role', 'EC2InstanceProfile', 'DeveloperGroup', 'DBSubnetGroup', 'RDSDatabase', 'CloudTrailLogGroup', 'CloudTrailLogStream', 'CloudTrailRole', 'CloudTrail', 'CloudTrailBucket', 'CloudTrailBucketPolicy', 'LaunchTemplate', 'AWS::AccountId', 'AWS::NoValue', 'AWS::NotificationARNs', 'AWS::Partition', 'AWS::Region', 'AWS::StackId', 'AWS::StackName', 'AWS::URLSuffix']
lib/TapStack.yml:439:17

W3011 Both 'UpdateReplacePolicy' and 'DeletionPolicy' are needed to protect resource from deletion
lib/TapStack.yml:475:3

E3691 '8.0' is not one of ['5.7.44-rds.20240408', '5.7.44-rds.20240529', '5.7.44-rds.20240808', '5.7.44-rds.20250103', '5.7.44-rds.20250213', '5.7.44-rds.20250508', '8.0.37', '8.0.39', '8.0.40', '8.0.41', '8.0.42', '8.0.43', '8.4.3', '8.4.4', '8.4.5', '8.4.6']
lib/TapStack.yml:482:7

W1011 Use dynamic references over parameters for secrets
lib/TapStack.yml:488:7

E3003 'IsLogging' is a required property
lib/TapStack.yml:542:5

An error occurred (ValidationError) when calling the CreateChangeSet operation: Parameters: [DBPassword, Environment] must have values

Please fix these
