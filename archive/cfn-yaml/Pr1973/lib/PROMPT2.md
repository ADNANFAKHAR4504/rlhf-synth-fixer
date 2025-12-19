I'm facing some linting issues. Here are the errors.

W2001 Parameter OrganizationId not used. lib\TapStack.yml:27:3

W2001 Parameter MasterAccountId not used. lib\TapStack.yml:31:3

E3003 'IsLogging' is a required property lib\TapStack.yml:211:5

E3030 'AWS::S3::Bucket' is not one of ['AWS::Lambda::Function', 'AWS::S3::Object', 'AWS::DynamoDB::Table', 'AWS::S3Outposts::Object', 'AWS::ManagedBlockchain::Node', 'AWS::S3ObjectLambda::AccessPoint', 'AWS::EC2::Snapshot', 'AWS::S3::AccessPoint', 'AWS::DynamoDB::Stream'] lib\TapStack.yml:227:15

E3002 Additional properties are not allowed ('DependsOn' was unexpected) lib\TapStack.yml:465:7

E1019 'aws:username' is not one of ['VpcCidr', 'PublicSubnetCidr', 'PrivateSubnetCidr', 'Environment', 'OrganizationId', 'MasterAccountId', 'KmsKeyId', 'SecurityKmsKey', 'SecurityKmsKeyAlias', 'SecurityVpc', 'PublicSubnet', 'PrivateSubnet', 'InternetGateway', 'AttachGateway', 'PublicRouteTable', 'PublicRoute', 'PublicSubnetRouteTableAssociation', 'CloudTrailLogsBucket', 'CloudTrailLogsBucketPolicy', 'SecurityCloudTrail', 'EC2InstanceRole', 'EC2InstanceProfile', 'AccessKeyRotationRole', 'SecurityNotificationTopic', 'AccessKeyRotationFunction', 'AccessKeyRotationSchedule', 'AccessKeyRotationPermission', 'ConfigServiceRole', 'ConfigBucket', 'ConfigBucketPolicy', 'ConfigurationRecorder', 'ConfigDeliveryChannel', 'SecurityGroupConfigRule', 'MFAEnforcementPolicy', 'SecurityHub', 'CISStandard', 'DatabasePasswordParameter', 'RDSSubnetGroup', 'RDSSecurityGroup', 'EC2SecurityGroup', 'ApplicationLoadBalancer', 'ALBSecurityGroup', 'HTTPSListener', 'HTTPListener', 'SSLCertificate', 'EBSEncryptionByDefault', 'EBSDefaultKmsKey', 'AWS::AccountId', 'AWS::NoValue', 'AWS::NotificationARNs', 'AWS::Partition', 'AWS::Region', 'AWS::StackId', 'AWS::StackName', 'AWS::URLSuffix'] lib\TapStack.yml:488:13

E1019 'aws:username' is not one of ['VpcCidr', 'PublicSubnetCidr', 'PrivateSubnetCidr', 'Environment', 'OrganizationId', 'MasterAccountId', 'KmsKeyId', 'SecurityKmsKey', 'SecurityKmsKeyAlias', 'SecurityVpc', 'PublicSubnet', 'PrivateSubnet', 'InternetGateway', 'AttachGateway', 'PublicRouteTable', 'PublicRoute', 'PublicSubnetRouteTableAssociation', 'CloudTrailLogsBucket', 'CloudTrailLogsBucketPolicy', 'SecurityCloudTrail', 'EC2InstanceRole', 'EC2InstanceProfile', 'AccessKeyRotationRole', 'SecurityNotificationTopic', 'AccessKeyRotationFunction', 'AccessKeyRotationSchedule', 'AccessKeyRotationPermission', 'ConfigServiceRole', 'ConfigBucket', 'ConfigBucketPolicy', 'ConfigurationRecorder', 'ConfigDeliveryChannel', 'SecurityGroupConfigRule', 'MFAEnforcementPolicy', 'SecurityHub', 'CISStandard', 'DatabasePasswordParameter', 'RDSSubnetGroup', 'RDSSecurityGroup', 'EC2SecurityGroup', 'ApplicationLoadBalancer', 'ALBSecurityGroup', 'HTTPSListener', 'HTTPListener', 'SSLCertificate', 'EBSEncryptionByDefault', 'EBSDefaultKmsKey', 'AWS::AccountId', 'AWS::NoValue', 'AWS::NotificationARNs', 'AWS::Partition', 'AWS::Region', 'AWS::StackId', 'AWS::StackName', 'AWS::URLSuffix'] lib\TapStack.yml:497:13

E3012 [{'Key': 'Environment', 'Value': {'Ref': 'Environment'}}] is not of type 'object' lib\TapStack.yml:519:7

E3030 'SecureString' is not one of ['String', 'StringList'] lib\TapStack.yml:535:7

E3002 Additional properties are not allowed ('KeyId' was unexpected) lib\TapStack.yml:538:7

E3680 expected minimum item count: 2, found: 1 lib\TapStack.yml:600:7

E3006 Resource type 'AWS::EC2::EBSEncryptionByDefault' does not exist in 'us-east-1' lib\TapStack.yml:670:5


