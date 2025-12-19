 Starting CDK Deploy to LocalStack...
 LocalStack is running
 Cleaning LocalStack resources...
 LocalStack state reset
 Working directory: /Users/barunmishra/Desktop/projects/personal/turing/iac-test-automations
 CDK project found: cdk.json
 Using CDK command: npx cdk
ℹ Note: CDK v2 requires proper LocalStack endpoint configuration
 Installing dependencies...
 Node.js dependencies installed
 Building TypeScript...

> tap@0.1.0 build
> tsc --skipLibCheck

 TypeScript build completed
 Bootstrapping CDK environment in LocalStack...
 CDK Bootstrap step completed
 Deploying CDK stack:
• Stack Name: TapStackdev
• Environment: dev
• Region: us-east-1
 Deploying CDK stack...

 Synthesis time: 3.17s

TapStackdev: start: Building TapStackdev/Custom::VpcRestrictDefaultSGCustomResourceProvider Code
TapStackdev: success: Built TapStackdev/Custom::VpcRestrictDefaultSGCustomResourceProvider Code
TapStackdev: start: Building TapStackdev/Custom::S3AutoDeleteObjectsCustomResourceProvider Code
TapStackdev: success: Built TapStackdev/Custom::S3AutoDeleteObjectsCustomResourceProvider Code
TapStackdev: start: Building TapStackdev Template
TapStackdev: success: Built TapStackdev Template
TapStackdev: start: Publishing TapStackdev/Custom::VpcRestrictDefaultSGCustomResourceProvider Code (000000000000-us-east-1-fa324105)
TapStackdev: start: Publishing TapStackdev Template (000000000000-us-east-1-7d3807b6)
TapStackdev: start: Publishing TapStackdev/Custom::S3AutoDeleteObjectsCustomResourceProvider Code (000000000000-us-east-1-bbba35f2)
TapStackdev: success: Published TapStackdev Template (000000000000-us-east-1-7d3807b6)
TapStackdev: success: Published TapStackdev/Custom::VpcRestrictDefaultSGCustomResourceProvider Code (000000000000-us-east-1-fa324105)
TapStackdev: success: Published TapStackdev/Custom::S3AutoDeleteObjectsCustomResourceProvider Code (000000000000-us-east-1-bbba35f2)
TapStackdev: deploying... [1/1]
TapStackdev: creating CloudFormation changeset...
TapStackdev | 0/74 | 8:07:19 PM | REVIEW_IN_PROGRESS | AWS::CloudFormation::Stack | TapStackdev User Initiated
 TapStackdev | 1/74 | 8:07:19 PM | CREATE_COMPLETE | AWS::CDK::Metadata | CDKMetadata/Default (CDKMetadata)
 TapStackdev | 1/74 | 8:07:19 PM | CREATE_IN_PROGRESS | AWS::CDK::Metadata | CDKMetadata/Default (CDKMetadata)
 TapStackdev | 1/74 | 8:07:19 PM | CREATE_IN_PROGRESS | AWS::CloudFormation::Stack | TapStackdev
 TapStackdev | 1/74 | 8:07:19 PM | CREATE_IN_PROGRESS | AWS::KMS::Key | SecureCorp-MasterKey-dev (SecureCorpMasterKeydevDFC68877)
 TapStackdev | 1/74 | 8:07:19 PM | CREATE_IN_PROGRESS | AWS::Logs::LogGroup | CloudTrail-LogGroup-dev (CloudTrailLogGroupdevAF10641E)
 TapStackdev | 2/74 | 8:07:19 PM | CREATE_COMPLETE | AWS::KMS::Key | SecureCorp-MasterKey-dev (SecureCorpMasterKeydevDFC68877)
 TapStackdev | 2/74 | 8:07:19 PM | CREATE_IN_PROGRESS | AWS::IAM::Role | Custom::S3AutoDeleteObjectsCustomResourceProvider/Role (CustomS3AutoDeleteObjectsCustomResourceProviderRole3B1BD092)
 TapStackdev | 3/74 | 8:07:19 PM | CREATE_COMPLETE | AWS::Logs::LogGroup | CloudTrail-LogGroup-dev (CloudTrailLogGroupdevAF10641E)
 TapStackdev | 3/74 | 8:07:19 PM | CREATE_IN_PROGRESS | AWS::S3::Bucket | SecureCorp-CloudTrail-Bucket-dev (SecureCorpCloudTrailBucketdev6D300AA0)
 TapStackdev | 4/74 | 8:07:19 PM | CREATE_COMPLETE | AWS::IAM::Role | Custom::S3AutoDeleteObjectsCustomResourceProvider/Role (CustomS3AutoDeleteObjectsCustomResourceProviderRole3B1BD092)
 TapStackdev | 5/74 | 8:07:19 PM | CREATE_COMPLETE | AWS::S3::Bucket | SecureCorp-CloudTrail-Bucket-dev (SecureCorpCloudTrailBucketdev6D300AA0)
 TapStackdev | 5/74 | 8:07:19 PM | CREATE_IN_PROGRESS | AWS::Lambda::Function | Custom::S3AutoDeleteObjectsCustomResourceProvider/Handler (CustomS3AutoDeleteObjectsCustomResourceProviderHandler9D90184F)
 TapStackdev | 6/74 | 8:08:16 PM | CREATE_COMPLETE | AWS::Lambda::Function | Custom::S3AutoDeleteObjectsCustomResourceProvider/Handler (CustomS3AutoDeleteObjectsCustomResourceProviderHandler9D90184F)
 TapStackdev | 6/74 | 8:08:16 PM | CREATE_IN_PROGRESS | AWS::EC2::VPC | SecureCorp-VPC-dev (SecureCorpVPCdev156B25A5)
 TapStackdev | 6/74 | 8:08:17 PM | CREATE_IN_PROGRESS | AWS::IAM::Role | Custom::VpcRestrictDefaultSGCustomResourceProvider/Role (CustomVpcRestrictDefaultSGCustomResourceProviderRole26592FE0)
 TapStackdev | 7/74 | 8:08:17 PM | CREATE_COMPLETE | AWS::EC2::VPC | SecureCorp-VPC-dev (SecureCorpVPCdev156B25A5)
 TapStackdev | 7/74 | 8:08:17 PM | CREATE_IN_PROGRESS | AWS::Lambda::Function | Custom::VpcRestrictDefaultSGCustomResourceProvider/Handler (CustomVpcRestrictDefaultSGCustomResourceProviderHandlerDC833E5E)
 TapStackdev | 8/74 | 8:08:17 PM | CREATE_COMPLETE | AWS::IAM::Role | Custom::VpcRestrictDefaultSGCustomResourceProvider/Role (CustomVpcRestrictDefaultSGCustomResourceProviderRole26592FE0)
 TapStackdev | 9/74 | 8:08:17 PM | CREATE_COMPLETE | AWS::Lambda::Function | Custom::VpcRestrictDefaultSGCustomResourceProvider/Handler (CustomVpcRestrictDefaultSGCustomResourceProviderHandlerDC833E5E)
 TapStackdev | 9/74 | 8:08:17 PM | CREATE_IN_PROGRESS | AWS::IAM::Role | SecureCorp-Admin-Role-dev (SecureCorpAdminRoledev78A62DFA)
 TapStackdev | 9/74 | 8:08:17 PM | CREATE_IN_PROGRESS | AWS::IAM::Policy | SecureCorp-Admin-Role-dev/DefaultPolicy (SecureCorpAdminRoledevDefaultPolicyC6D5F303)
 TapStackdev | 10/74 | 8:08:17 PM | CREATE_COMPLETE | AWS::IAM::Role | SecureCorp-Admin-Role-dev (SecureCorpAdminRoledev78A62DFA)
 TapStackdev | 10/74 | 8:08:17 PM | CREATE_IN_PROGRESS | AWS::IAM::Role | SecureCorp-Auditor-Role-dev (SecureCorpAuditorRoledevF9DFD87E)
 TapStackdev | 11/74 | 8:08:17 PM | CREATE_COMPLETE | AWS::IAM::Policy | SecureCorp-Admin-Role-dev/DefaultPolicy (SecureCorpAdminRoledevDefaultPolicyC6D5F303)
 TapStackdev | 11/74 | 8:08:17 PM | CREATE_IN_PROGRESS | AWS::S3::BucketPolicy | SecureCorp-CloudTrail-Bucket-dev/Policy (SecureCorpCloudTrailBucketdevPolicyACF99604)
 TapStackdev | 12/74 | 8:08:17 PM | CREATE_COMPLETE | AWS::IAM::Role | SecureCorp-Auditor-Role-dev (SecureCorpAuditorRoledevF9DFD87E)
 TapStackdev | 12/74 | 8:08:17 PM | CREATE_IN_PROGRESS | AWS::IAM::Role | SecureCorp-CloudTrail-dev/LogsRole (SecureCorpCloudTraildevLogsRoleA2022FD1)
 TapStackdev | 13/74 | 8:08:17 PM | CREATE_COMPLETE | Custom::S3AutoDeleteObjects | SecureCorp-CloudTrail-Bucket-dev/AutoDeleteObjectsCustomResource/Default (SecureCorpCloudTrailBucketdevAutoDeleteObjectsCustomResourceB86B0E40) Resource type Custom::S3AutoDeleteObjects is not supported but was deployed as a fallback
 TapStackdev | 13/74 | 8:08:17 PM | CREATE_IN_PROGRESS | Custom::S3AutoDeleteObjects | SecureCorp-CloudTrail-Bucket-dev/AutoDeleteObjectsCustomResource/Default (SecureCorpCloudTrailBucketdevAutoDeleteObjectsCustomResourceB86B0E40)
 TapStackdev | 14/74 | 8:08:17 PM | CREATE_COMPLETE | AWS::S3::BucketPolicy | SecureCorp-CloudTrail-Bucket-dev/Policy (SecureCorpCloudTrailBucketdevPolicyACF99604)
 TapStackdev | 14/74 | 8:08:17 PM | CREATE_IN_PROGRESS | AWS::IAM::Policy | SecureCorp-CloudTrail-dev/LogsRole/DefaultPolicy (SecureCorpCloudTraildevLogsRoleDefaultPolicy415AB530)
 TapStackdev | 15/74 | 8:08:17 PM | CREATE_COMPLETE | AWS::IAM::Role | SecureCorp-CloudTrail-dev/LogsRole (SecureCorpCloudTraildevLogsRoleA2022FD1)
 TapStackdev | 16/74 | 8:08:17 PM | CREATE_COMPLETE | AWS::IAM::Policy | SecureCorp-CloudTrail-dev/LogsRole/DefaultPolicy (SecureCorpCloudTraildevLogsRoleDefaultPolicy415AB530)
 TapStackdev | 16/74 | 8:08:17 PM | CREATE_IN_PROGRESS | AWS::S3::Bucket | SecureCorp-Data-dev (SecureCorpDatadev788F9DC8)
 TapStackdev | 17/74 | 8:08:17 PM | CREATE_COMPLETE | AWS::CloudTrail::Trail | SecureCorp-CloudTrail-dev (SecureCorpCloudTraildev803AD43F) Resource type AWS::CloudTrail::Trail is not supported but was deployed as a fallback
 TapStackdev | 17/74 | 8:08:17 PM | CREATE_IN_PROGRESS | AWS::CloudTrail::Trail | SecureCorp-CloudTrail-dev (SecureCorpCloudTraildev803AD43F)
 TapStackdev | 18/74 | 8:08:17 PM | CREATE_COMPLETE | AWS::S3::Bucket | SecureCorp-Data-dev (SecureCorpDatadev788F9DC8)
 TapStackdev | 18/74 | 8:08:17 PM | CREATE_IN_PROGRESS | AWS::EC2::SecurityGroup | SecureCorp-DB-SG-dev (SecureCorpDBSGdev6ECF577C)
 TapStackdev | 18/74 | 8:08:17 PM | CREATE_IN_PROGRESS | AWS::EC2::Subnet | SecureCorp-VPC-dev/SecureCorp-Isolated-devSubnet1/Subnet (SecureCorpVPCdevSecureCorpIsolateddevSubnet1Subnet29958898)
 TapStackdev | 19/74 | 8:08:17 PM | CREATE_COMPLETE | AWS::EC2::SecurityGroup | SecureCorp-DB-SG-dev (SecureCorpDBSGdev6ECF577C)
 TapStackdev | 19/74 | 8:08:17 PM | CREATE_IN_PROGRESS | AWS::EC2::Subnet | SecureCorp-VPC-dev/SecureCorp-Isolated-devSubnet2/Subnet (SecureCorpVPCdevSecureCorpIsolateddevSubnet2SubnetCCEC1D42)
 TapStackdev | 20/74 | 8:08:17 PM | CREATE_COMPLETE | AWS::EC2::Subnet | SecureCorp-VPC-dev/SecureCorp-Isolated-devSubnet1/Subnet (SecureCorpVPCdevSecureCorpIsolateddevSubnet1Subnet29958898)
 TapStackdev | 20/74 | 8:08:17 PM | CREATE_IN_PROGRESS | AWS::EC2::Subnet | SecureCorp-VPC-dev/SecureCorp-Isolated-devSubnet3/Subnet (SecureCorpVPCdevSecureCorpIsolateddevSubnet3SubnetD8A188DD)
 TapStackdev | 21/74 | 8:08:17 PM | CREATE_COMPLETE | AWS::EC2::Subnet | SecureCorp-VPC-dev/SecureCorp-Isolated-devSubnet2/Subnet (SecureCorpVPCdevSecureCorpIsolateddevSubnet2SubnetCCEC1D42)
 TapStackdev | 21/74 | 8:08:17 PM | CREATE_IN_PROGRESS | AWS::SecretsManager::Secret | SecureCorp-Database-dev/Secret (TapStackdevSecureCorpDatabasedevSecret60D6937F3fdaad7efa858a3daf9490cf0a702aeb)
 TapStackdev | 22/74 | 8:08:17 PM | CREATE_COMPLETE | AWS::RDS::DBSubnetGroup | SecureCorp-DB-SubnetGroup-dev/Default (SecureCorpDBSubnetGroupdev) Resource type AWS::RDS::DBSubnetGroup is not supported but was deployed as a fallback
 TapStackdev | 22/74 | 8:08:17 PM | CREATE_IN_PROGRESS | AWS::RDS::DBSubnetGroup | SecureCorp-DB-SubnetGroup-dev/Default (SecureCorpDBSubnetGroupdev)
 TapStackdev | 23/74 | 8:08:17 PM | CREATE_COMPLETE | AWS::EC2::Subnet | SecureCorp-VPC-dev/SecureCorp-Isolated-devSubnet3/Subnet (SecureCorpVPCdevSecureCorpIsolateddevSubnet3SubnetD8A188DD)
 TapStackdev | 24/74 | 8:08:17 PM | CREATE_COMPLETE | AWS::SecretsManager::Secret | SecureCorp-Database-dev/Secret (TapStackdevSecureCorpDatabasedevSecret60D6937F3fdaad7efa858a3daf9490cf0a702aeb)
 TapStackdev | 24/74 | 8:08:17 PM | CREATE_IN_PROGRESS | AWS::IAM::Role | SecureCorp-Database-dev/MonitoringRole (SecureCorpDatabasedevMonitoringRole65D06567)
 TapStackdev | 24/74 | 8:08:17 PM | CREATE_IN_PROGRESS | AWS::S3::BucketPolicy | SecureCorp-Data-dev/Policy (SecureCorpDatadevPolicy7E8525DA)
 TapStackdev | 25/74 | 8:08:17 PM | CREATE_COMPLETE | AWS::SecretsManager::SecretTargetAttachment | SecureCorp-Database-dev/Secret/Attachment (SecureCorpDatabasedevSecretAttachment68881C82)
 TapStackdev | 25/74 | 8:08:17 PM | CREATE_IN_PROGRESS | AWS::SecretsManager::SecretTargetAttachment | SecureCorp-Database-dev/Secret/Attachment (SecureCorpDatabasedevSecretAttachment68881C82)
 TapStackdev | 26/74 | 8:08:17 PM | CREATE_COMPLETE | AWS::RDS::DBInstance | SecureCorp-Database-dev (SecureCorpDatabasedevFD81B339) Resource type AWS::RDS::DBInstance is not supported but was deployed as a fallback
 TapStackdev | 26/74 | 8:08:17 PM | CREATE_IN_PROGRESS | AWS::RDS::DBInstance | SecureCorp-Database-dev (SecureCorpDatabasedevFD81B339)
 TapStackdev | 27/74 | 8:08:17 PM | CREATE_COMPLETE | AWS::IAM::Role | SecureCorp-Database-dev/MonitoringRole (SecureCorpDatabasedevMonitoringRole65D06567)
 TapStackdev | 27/74 | 8:08:17 PM | CREATE_IN_PROGRESS | AWS::IAM::Role | SecureCorp-Developer-Role-dev (SecureCorpDeveloperRoledev007060E4)
 TapStackdev | 28/74 | 8:08:17 PM | CREATE_COMPLETE | Custom::S3AutoDeleteObjects | SecureCorp-Data-dev/AutoDeleteObjectsCustomResource/Default (SecureCorpDatadevAutoDeleteObjectsCustomResource09FDBA2D) Resource type Custom::S3AutoDeleteObjects is not supported but was deployed as a fallback
 TapStackdev | 28/74 | 8:08:17 PM | CREATE_IN_PROGRESS | Custom::S3AutoDeleteObjects | SecureCorp-Data-dev/AutoDeleteObjectsCustomResource/Default (SecureCorpDatadevAutoDeleteObjectsCustomResource09FDBA2D)
 TapStackdev | 29/74 | 8:08:17 PM | CREATE_COMPLETE | AWS::S3::BucketPolicy | SecureCorp-Data-dev/Policy (SecureCorpDatadevPolicy7E8525DA)
 TapStackdev | 29/74 | 8:08:17 PM | CREATE_IN_PROGRESS | AWS::IAM::Policy | SecureCorp-Developer-Role-dev/DefaultPolicy (SecureCorpDeveloperRoledevDefaultPolicy564A5A4F)
 TapStackdev | 30/74 | 8:08:17 PM | CREATE_COMPLETE | AWS::IAM::Role | SecureCorp-Developer-Role-dev (SecureCorpDeveloperRoledev007060E4)
 TapStackdev | 30/74 | 8:08:17 PM | CREATE_IN_PROGRESS | AWS::KMS::Alias | SecureCorp-MasterKey-dev/Alias (SecureCorpMasterKeydevAlias8672F30E)
 TapStackdev | 31/74 | 8:08:17 PM | CREATE_COMPLETE | AWS::IAM::Policy | SecureCorp-Developer-Role-dev/DefaultPolicy (SecureCorpDeveloperRoledevDefaultPolicy564A5A4F)
 TapStackdev | 31/74 | 8:08:17 PM | CREATE_IN_PROGRESS | AWS::IAM::Role | VPC-FlowLogs-Role-dev (VPCFlowLogsRoledevF21C8D41)
 TapStackdev | 32/74 | 8:08:17 PM | CREATE_COMPLETE | AWS::KMS::Alias | SecureCorp-MasterKey-dev/Alias (SecureCorpMasterKeydevAlias8672F30E)
 TapStackdev | 32/74 | 8:08:17 PM | CREATE_IN_PROGRESS | AWS::Logs::LogGroup | VPC-FlowLogs-dev (VPCFlowLogsdev9FD18E6A)
 TapStackdev | 33/74 | 8:08:17 PM | CREATE_COMPLETE | AWS::IAM::Role | VPC-FlowLogs-Role-dev (VPCFlowLogsRoledevF21C8D41)
 TapStackdev | 33/74 | 8:08:17 PM | CREATE_IN_PROGRESS | AWS::EC2::SecurityGroup | SecureCorp-VPC-dev/EC2-VPC-Endpoint-dev/SecurityGroup (SecureCorpVPCdevEC2VPCEndpointdevSecurityGroup34DD672E)
 TapStackdev | 34/74 | 8:08:17 PM | CREATE_COMPLETE | AWS::EC2::FlowLog | SecureCorp-VPC-FlowLogs-dev/FlowLog (SecureCorpVPCFlowLogsdevFlowLogE2767AA7) Resource type AWS::EC2::FlowLog is not supported but was deployed as a fallback
 TapStackdev | 34/74 | 8:08:17 PM | CREATE_IN_PROGRESS | AWS::EC2::FlowLog | SecureCorp-VPC-FlowLogs-dev/FlowLog (SecureCorpVPCFlowLogsdevFlowLogE2767AA7)
 TapStackdev | 35/74 | 8:08:17 PM | CREATE_COMPLETE | AWS::Logs::LogGroup | VPC-FlowLogs-dev (VPCFlowLogsdev9FD18E6A)
 TapStackdev | 35/74 | 8:08:17 PM | CREATE_IN_PROGRESS | AWS::EC2::Subnet | SecureCorp-VPC-dev/SecureCorp-Private-devSubnet1/Subnet (SecureCorpVPCdevSecureCorpPrivatedevSubnet1SubnetE5A2BFF4)
 TapStackdev | 36/74 | 8:08:17 PM | CREATE_COMPLETE | AWS::EC2::SecurityGroup | SecureCorp-VPC-dev/EC2-VPC-Endpoint-dev/SecurityGroup (SecureCorpVPCdevEC2VPCEndpointdevSecurityGroup34DD672E)
 TapStackdev | 36/74 | 8:08:17 PM | CREATE_IN_PROGRESS | AWS::EC2::Subnet | SecureCorp-VPC-dev/SecureCorp-Private-devSubnet2/Subnet (SecureCorpVPCdevSecureCorpPrivatedevSubnet2Subnet03A62FFF)
 TapStackdev | 37/74 | 8:08:17 PM | CREATE_COMPLETE | AWS::EC2::Subnet | SecureCorp-VPC-dev/SecureCorp-Private-devSubnet1/Subnet (SecureCorpVPCdevSecureCorpPrivatedevSubnet1SubnetE5A2BFF4)
 TapStackdev | 37/74 | 8:08:17 PM | CREATE_IN_PROGRESS | AWS::EC2::Subnet | SecureCorp-VPC-dev/SecureCorp-Private-devSubnet3/Subnet (SecureCorpVPCdevSecureCorpPrivatedevSubnet3Subnet4FE3F22F)
 TapStackdev | 38/74 | 8:08:17 PM | CREATE_COMPLETE | AWS::EC2::Subnet | SecureCorp-VPC-dev/SecureCorp-Private-devSubnet2/Subnet (SecureCorpVPCdevSecureCorpPrivatedevSubnet2Subnet03A62FFF)
 TapStackdev | 38/74 | 8:08:17 PM | CREATE_IN_PROGRESS | AWS::EC2::VPCEndpoint | SecureCorp-VPC-dev/EC2-VPC-Endpoint-dev (SecureCorpVPCdevEC2VPCEndpointdevA7BCAB62)
 TapStackdev | 39/74 | 8:08:17 PM | CREATE_COMPLETE | AWS::EC2::Subnet | SecureCorp-VPC-dev/SecureCorp-Private-devSubnet3/Subnet (SecureCorpVPCdevSecureCorpPrivatedevSubnet3Subnet4FE3F22F)
 TapStackdev | 39/74 | 8:08:17 PM | CREATE_IN_PROGRESS | AWS::EC2::InternetGateway | SecureCorp-VPC-dev/IGW (SecureCorpVPCdevIGW164C974C)
 TapStackdev | 40/74 | 8:08:17 PM | CREATE_COMPLETE | AWS::EC2::VPCEndpoint | SecureCorp-VPC-dev/EC2-VPC-Endpoint-dev (SecureCorpVPCdevEC2VPCEndpointdevA7BCAB62)
 TapStackdev | 41/74 | 8:08:17 PM | CREATE_COMPLETE | AWS::EC2::InternetGateway | SecureCorp-VPC-dev/IGW (SecureCorpVPCdevIGW164C974C)
 TapStackdev | 41/74 | 8:08:17 PM | CREATE_IN_PROGRESS | AWS::EC2::SecurityGroup | SecureCorp-VPC-dev/KMS-VPC-Endpoint-dev/SecurityGroup (SecureCorpVPCdevKMSVPCEndpointdevSecurityGroup44BA0DED)
 TapStackdev | 41/74 | 8:08:17 PM | CREATE_IN_PROGRESS | AWS::EC2::VPCEndpoint | SecureCorp-VPC-dev/KMS-VPC-Endpoint-dev (SecureCorpVPCdevKMSVPCEndpointdev0E662BB0)
 TapStackdev | 42/74 | 8:08:17 PM | CREATE_COMPLETE | AWS::EC2::SecurityGroup | SecureCorp-VPC-dev/KMS-VPC-Endpoint-dev/SecurityGroup (SecureCorpVPCdevKMSVPCEndpointdevSecurityGroup44BA0DED)
 TapStackdev | 42/74 | 8:08:17 PM | CREATE_IN_PROGRESS | Custom::VpcRestrictDefaultSG | SecureCorp-VPC-dev/RestrictDefaultSecurityGroupCustomResource/Default (SecureCorpVPCdevRestrictDefaultSecurityGroupCustomResource90E6D1F2)
 TapStackdev | 43/74 | 8:08:17 PM | CREATE_COMPLETE | AWS::EC2::VPCEndpoint | SecureCorp-VPC-dev/KMS-VPC-Endpoint-dev (SecureCorpVPCdevKMSVPCEndpointdev0E662BB0)
 TapStackdev | 43/74 | 8:08:17 PM | CREATE_IN_PROGRESS | AWS::EC2::RouteTable | SecureCorp-VPC-dev/SecureCorp-Private-devSubnet1/RouteTable (SecureCorpVPCdevSecureCorpPrivatedevSubnet1RouteTable6B82B99E)
 TapStackdev | 44/74 | 8:08:17 PM | CREATE_COMPLETE | Custom::VpcRestrictDefaultSG | SecureCorp-VPC-dev/RestrictDefaultSecurityGroupCustomResource/Default (SecureCorpVPCdevRestrictDefaultSecurityGroupCustomResource90E6D1F2) Resource type Custom::VpcRestrictDefaultSG is not supported but was deployed as a fallback
 TapStackdev | 44/74 | 8:08:17 PM | CREATE_IN_PROGRESS | AWS::EC2::RouteTable | SecureCorp-VPC-dev/SecureCorp-Private-devSubnet2/RouteTable (SecureCorpVPCdevSecureCorpPrivatedevSubnet2RouteTable4CFF371C)
 TapStackdev | 45/74 | 8:08:17 PM | CREATE_COMPLETE | AWS::EC2::RouteTable | SecureCorp-VPC-dev/SecureCorp-Private-devSubnet1/RouteTable (SecureCorpVPCdevSecureCorpPrivatedevSubnet1RouteTable6B82B99E)
 TapStackdev | 45/74 | 8:08:17 PM | CREATE_IN_PROGRESS | AWS::EC2::RouteTable | SecureCorp-VPC-dev/SecureCorp-Private-devSubnet3/RouteTable (SecureCorpVPCdevSecureCorpPrivatedevSubnet3RouteTable46B40CB9)
 TapStackdev | 46/74 | 8:08:17 PM | CREATE_COMPLETE | AWS::EC2::RouteTable | SecureCorp-VPC-dev/SecureCorp-Private-devSubnet2/RouteTable (SecureCorpVPCdevSecureCorpPrivatedevSubnet2RouteTable4CFF371C)
 TapStackdev | 46/74 | 8:08:17 PM | CREATE_IN_PROGRESS | AWS::EC2::VPCEndpoint | SecureCorp-VPC-dev/S3-VPC-Endpoint-dev (SecureCorpVPCdevS3VPCEndpointdev72DD33EA)
 TapStackdev | 47/74 | 8:08:17 PM | CREATE_COMPLETE | AWS::EC2::RouteTable | SecureCorp-VPC-dev/SecureCorp-Private-devSubnet3/RouteTable (SecureCorpVPCdevSecureCorpPrivatedevSubnet3RouteTable46B40CB9)
 TapStackdev | 47/74 | 8:08:18 PM | CREATE_IN_PROGRESS | AWS::EC2::SecurityGroup | SecureCorp-VPC-dev/SecretsManager-VPC-Endpoint-dev/SecurityGroup (SecureCorpVPCdevSecretsManagerVPCEndpointdevSecurityGroupCC7523C4)
 TapStackdev | 48/74 | 8:08:18 PM | CREATE_COMPLETE | AWS::EC2::VPCEndpoint | SecureCorp-VPC-dev/S3-VPC-Endpoint-dev (SecureCorpVPCdevS3VPCEndpointdev72DD33EA)
 TapStackdev | 48/74 | 8:08:18 PM | CREATE_IN_PROGRESS | AWS::EC2::VPCEndpoint | SecureCorp-VPC-dev/SecretsManager-VPC-Endpoint-dev (SecureCorpVPCdevSecretsManagerVPCEndpointdev26114C2D)
 TapStackdev | 49/74 | 8:08:18 PM | CREATE_COMPLETE | AWS::EC2::SecurityGroup | SecureCorp-VPC-dev/SecretsManager-VPC-Endpoint-dev/SecurityGroup (SecureCorpVPCdevSecretsManagerVPCEndpointdevSecurityGroupCC7523C4)
 TapStackdev | 49/74 | 8:08:18 PM | CREATE_IN_PROGRESS | AWS::EC2::RouteTable | SecureCorp-VPC-dev/SecureCorp-Isolated-devSubnet1/RouteTable (SecureCorpVPCdevSecureCorpIsolateddevSubnet1RouteTableECAC7251)
 TapStackdev | 50/74 | 8:08:18 PM | CREATE_COMPLETE | AWS::EC2::VPCEndpoint | SecureCorp-VPC-dev/SecretsManager-VPC-Endpoint-dev (SecureCorpVPCdevSecretsManagerVPCEndpointdev26114C2D)
 TapStackdev | 51/74 | 8:08:18 PM | CREATE_COMPLETE | AWS::EC2::RouteTable | SecureCorp-VPC-dev/SecureCorp-Isolated-devSubnet1/RouteTable (SecureCorpVPCdevSecureCorpIsolateddevSubnet1RouteTableECAC7251)
 TapStackdev | 51/74 | 8:08:18 PM | CREATE_IN_PROGRESS | AWS::EC2::SubnetRouteTableAssociation | SecureCorp-VPC-dev/SecureCorp-Isolated-devSubnet1/RouteTableAssociation (SecureCorpVPCdevSecureCorpIsolateddevSubnet1RouteTableAssociation6EEB7B01)
 TapStackdev | 51/74 | 8:08:18 PM | CREATE_IN_PROGRESS | AWS::EC2::RouteTable | SecureCorp-VPC-dev/SecureCorp-Isolated-devSubnet2/RouteTable (SecureCorpVPCdevSecureCorpIsolateddevSubnet2RouteTableD7E9546F)
 TapStackdev | 52/74 | 8:08:18 PM | CREATE_COMPLETE | AWS::EC2::SubnetRouteTableAssociation | SecureCorp-VPC-dev/SecureCorp-Isolated-devSubnet1/RouteTableAssociation (SecureCorpVPCdevSecureCorpIsolateddevSubnet1RouteTableAssociation6EEB7B01)
 TapStackdev | 52/74 | 8:08:18 PM | CREATE_IN_PROGRESS | AWS::EC2::SubnetRouteTableAssociation | SecureCorp-VPC-dev/SecureCorp-Isolated-devSubnet2/RouteTableAssociation (SecureCorpVPCdevSecureCorpIsolateddevSubnet2RouteTableAssociationBAA5ADC3)
 TapStackdev | 53/74 | 8:08:18 PM | CREATE_COMPLETE | AWS::EC2::RouteTable | SecureCorp-VPC-dev/SecureCorp-Isolated-devSubnet2/RouteTable (SecureCorpVPCdevSecureCorpIsolateddevSubnet2RouteTableD7E9546F)
 TapStackdev | 53/74 | 8:08:18 PM | CREATE_IN_PROGRESS | AWS::EC2::RouteTable | SecureCorp-VPC-dev/SecureCorp-Isolated-devSubnet3/RouteTable (SecureCorpVPCdevSecureCorpIsolateddevSubnet3RouteTable0D9C5759)
 TapStackdev | 54/74 | 8:08:18 PM | CREATE_COMPLETE | AWS::EC2::SubnetRouteTableAssociation | SecureCorp-VPC-dev/SecureCorp-Isolated-devSubnet2/RouteTableAssociation (SecureCorpVPCdevSecureCorpIsolateddevSubnet2RouteTableAssociationBAA5ADC3)
 TapStackdev | 54/74 | 8:08:18 PM | CREATE_IN_PROGRESS | AWS::EC2::SubnetRouteTableAssociation | SecureCorp-VPC-dev/SecureCorp-Isolated-devSubnet3/RouteTableAssociation (SecureCorpVPCdevSecureCorpIsolateddevSubnet3RouteTableAssociationBA67DDBA)
 TapStackdev | 55/74 | 8:08:18 PM | CREATE_COMPLETE | AWS::EC2::RouteTable | SecureCorp-VPC-dev/SecureCorp-Isolated-devSubnet3/RouteTable (SecureCorpVPCdevSecureCorpIsolateddevSubnet3RouteTable0D9C5759)
 TapStackdev | 55/74 | 8:08:18 PM | CREATE_IN_PROGRESS | AWS::EC2::SubnetRouteTableAssociation | SecureCorp-VPC-dev/SecureCorp-Private-devSubnet1/RouteTableAssociation (SecureCorpVPCdevSecureCorpPrivatedevSubnet1RouteTableAssociation08FC5F96)
 TapStackdev | 56/74 | 8:08:18 PM | CREATE_COMPLETE | AWS::EC2::SubnetRouteTableAssociation | SecureCorp-VPC-dev/SecureCorp-Isolated-devSubnet3/RouteTableAssociation (SecureCorpVPCdevSecureCorpIsolateddevSubnet3RouteTableAssociationBA67DDBA)
 TapStackdev | 56/74 | 8:08:18 PM | CREATE_IN_PROGRESS | AWS::EC2::SubnetRouteTableAssociation | SecureCorp-VPC-dev/SecureCorp-Private-devSubnet2/RouteTableAssociation (SecureCorpVPCdevSecureCorpPrivatedevSubnet2RouteTableAssociationAD16357F)
 TapStackdev | 57/74 | 8:08:18 PM | CREATE_COMPLETE | AWS::EC2::SubnetRouteTableAssociation | SecureCorp-VPC-dev/SecureCorp-Private-devSubnet1/RouteTableAssociation (SecureCorpVPCdevSecureCorpPrivatedevSubnet1RouteTableAssociation08FC5F96)
 TapStackdev | 57/74 | 8:08:18 PM | CREATE_IN_PROGRESS | AWS::EC2::SubnetRouteTableAssociation | SecureCorp-VPC-dev/SecureCorp-Private-devSubnet3/RouteTableAssociation (SecureCorpVPCdevSecureCorpPrivatedevSubnet3RouteTableAssociationFC7A91A7)
 TapStackdev | 58/74 | 8:08:18 PM | CREATE_COMPLETE | AWS::EC2::SubnetRouteTableAssociation | SecureCorp-VPC-dev/SecureCorp-Private-devSubnet2/RouteTableAssociation (SecureCorpVPCdevSecureCorpPrivatedevSubnet2RouteTableAssociationAD16357F)
 TapStackdev | 58/74 | 8:08:18 PM | CREATE_IN_PROGRESS | AWS::EC2::VPCGatewayAttachment | SecureCorp-VPC-dev/VPCGW (SecureCorpVPCdevVPCGWF81FC994)
 TapStackdev | 59/74 | 8:08:18 PM | CREATE_COMPLETE | AWS::EC2::SubnetRouteTableAssociation | SecureCorp-VPC-dev/SecureCorp-Private-devSubnet3/RouteTableAssociation (SecureCorpVPCdevSecureCorpPrivatedevSubnet3RouteTableAssociationFC7A91A7)
 TapStackdev | 59/74 | 8:08:18 PM | CREATE_IN_PROGRESS | AWS::EC2::RouteTable | SecureCorp-VPC-dev/SecureCorp-Public-devSubnet1/RouteTable (SecureCorpVPCdevSecureCorpPublicdevSubnet1RouteTable983F0CF5)
 TapStackdev | 60/74 | 8:08:18 PM | CREATE_COMPLETE | AWS::EC2::VPCGatewayAttachment | SecureCorp-VPC-dev/VPCGW (SecureCorpVPCdevVPCGWF81FC994)
 TapStackdev | 60/74 | 8:08:18 PM | CREATE_IN_PROGRESS | AWS::EC2::Route | SecureCorp-VPC-dev/SecureCorp-Public-devSubnet1/DefaultRoute (SecureCorpVPCdevSecureCorpPublicdevSubnet1DefaultRoute2E7191F2)
 TapStackdev | 61/74 | 8:08:18 PM | CREATE_COMPLETE | AWS::EC2::RouteTable | SecureCorp-VPC-dev/SecureCorp-Public-devSubnet1/RouteTable (SecureCorpVPCdevSecureCorpPublicdevSubnet1RouteTable983F0CF5)
 TapStackdev | 61/74 | 8:08:18 PM | CREATE_IN_PROGRESS | AWS::EC2::Subnet | SecureCorp-VPC-dev/SecureCorp-Public-devSubnet1/Subnet (SecureCorpVPCdevSecureCorpPublicdevSubnet1Subnet3344C124)
 TapStackdev | 62/74 | 8:08:18 PM | CREATE_COMPLETE | AWS::EC2::Route | SecureCorp-VPC-dev/SecureCorp-Public-devSubnet1/DefaultRoute (SecureCorpVPCdevSecureCorpPublicdevSubnet1DefaultRoute2E7191F2)
 TapStackdev | 63/74 | 8:08:18 PM | CREATE_COMPLETE | AWS::EC2::Subnet | SecureCorp-VPC-dev/SecureCorp-Public-devSubnet1/Subnet (SecureCorpVPCdevSecureCorpPublicdevSubnet1Subnet3344C124)
 TapStackdev | 63/74 | 8:08:18 PM | CREATE_IN_PROGRESS | AWS::EC2::SubnetRouteTableAssociation | SecureCorp-VPC-dev/SecureCorp-Public-devSubnet1/RouteTableAssociation (SecureCorpVPCdevSecureCorpPublicdevSubnet1RouteTableAssociationFF779033)
 TapStackdev | 63/74 | 8:08:18 PM | CREATE_IN_PROGRESS | AWS::EC2::RouteTable | SecureCorp-VPC-dev/SecureCorp-Public-devSubnet2/RouteTable (SecureCorpVPCdevSecureCorpPublicdevSubnet2RouteTable3B4269F6)
 TapStackdev | 64/74 | 8:08:18 PM | CREATE_COMPLETE | AWS::EC2::SubnetRouteTableAssociation | SecureCorp-VPC-dev/SecureCorp-Public-devSubnet1/RouteTableAssociation (SecureCorpVPCdevSecureCorpPublicdevSubnet1RouteTableAssociationFF779033)
 TapStackdev | 64/74 | 8:08:18 PM | CREATE_IN_PROGRESS | AWS::EC2::Route | SecureCorp-VPC-dev/SecureCorp-Public-devSubnet2/DefaultRoute (SecureCorpVPCdevSecureCorpPublicdevSubnet2DefaultRoute37688F3D)
 TapStackdev | 65/74 | 8:08:18 PM | CREATE_COMPLETE | AWS::EC2::RouteTable | SecureCorp-VPC-dev/SecureCorp-Public-devSubnet2/RouteTable (SecureCorpVPCdevSecureCorpPublicdevSubnet2RouteTable3B4269F6)
 TapStackdev | 65/74 | 8:08:18 PM | CREATE_IN_PROGRESS | AWS::EC2::Subnet | SecureCorp-VPC-dev/SecureCorp-Public-devSubnet2/Subnet (SecureCorpVPCdevSecureCorpPublicdevSubnet2Subnet1EE0C0B6)
 TapStackdev | 66/74 | 8:08:18 PM | CREATE_COMPLETE | AWS::EC2::Route | SecureCorp-VPC-dev/SecureCorp-Public-devSubnet2/DefaultRoute (SecureCorpVPCdevSecureCorpPublicdevSubnet2DefaultRoute37688F3D)
 TapStackdev | 66/74 | 8:08:18 PM | CREATE_IN_PROGRESS | AWS::EC2::SubnetRouteTableAssociation | SecureCorp-VPC-dev/SecureCorp-Public-devSubnet2/RouteTableAssociation (SecureCorpVPCdevSecureCorpPublicdevSubnet2RouteTableAssociation66D51B83)
 TapStackdev | 67/74 | 8:08:18 PM | CREATE_COMPLETE | AWS::EC2::Subnet | SecureCorp-VPC-dev/SecureCorp-Public-devSubnet2/Subnet (SecureCorpVPCdevSecureCorpPublicdevSubnet2Subnet1EE0C0B6)
 TapStackdev | 67/74 | 8:08:18 PM | CREATE_IN_PROGRESS | AWS::EC2::RouteTable | SecureCorp-VPC-dev/SecureCorp-Public-devSubnet3/RouteTable (SecureCorpVPCdevSecureCorpPublicdevSubnet3RouteTable57AB131A)
 TapStackdev | 68/74 | 8:08:18 PM | CREATE_COMPLETE | AWS::EC2::SubnetRouteTableAssociation | SecureCorp-VPC-dev/SecureCorp-Public-devSubnet2/RouteTableAssociation (SecureCorpVPCdevSecureCorpPublicdevSubnet2RouteTableAssociation66D51B83)
 TapStackdev | 68/74 | 8:08:18 PM | CREATE_IN_PROGRESS | AWS::EC2::Route | SecureCorp-VPC-dev/SecureCorp-Public-devSubnet3/DefaultRoute (SecureCorpVPCdevSecureCorpPublicdevSubnet3DefaultRouteED3AC718)
 TapStackdev | 69/74 | 8:08:18 PM | CREATE_COMPLETE | AWS::EC2::RouteTable | SecureCorp-VPC-dev/SecureCorp-Public-devSubnet3/RouteTable (SecureCorpVPCdevSecureCorpPublicdevSubnet3RouteTable57AB131A)
 TapStackdev | 70/74 | 8:08:18 PM | CREATE_COMPLETE | AWS::EC2::Route | SecureCorp-VPC-dev/SecureCorp-Public-devSubnet3/DefaultRoute (SecureCorpVPCdevSecureCorpPublicdevSubnet3DefaultRouteED3AC718)
 TapStackdev | 70/74 | 8:08:18 PM | CREATE_IN_PROGRESS | AWS::EC2::Subnet | SecureCorp-VPC-dev/SecureCorp-Public-devSubnet3/Subnet (SecureCorpVPCdevSecureCorpPublicdevSubnet3SubnetD89CB20A)
 TapStackdev | 70/74 | 8:08:18 PM | CREATE_IN_PROGRESS | AWS::EC2::SubnetRouteTableAssociation | SecureCorp-VPC-dev/SecureCorp-Public-devSubnet3/RouteTableAssociation (SecureCorpVPCdevSecureCorpPublicdevSubnet3RouteTableAssociation9D6A73C2)
 TapStackdev | 71/74 | 8:08:18 PM | CREATE_COMPLETE | AWS::EC2::Subnet | SecureCorp-VPC-dev/SecureCorp-Public-devSubnet3/Subnet (SecureCorpVPCdevSecureCorpPublicdevSubnet3SubnetD89CB20A)
 TapStackdev | 71/74 | 8:08:18 PM | CREATE_IN_PROGRESS | AWS::IAM::Policy | VPC-FlowLogs-Role-dev/DefaultPolicy (VPCFlowLogsRoledevDefaultPolicyE2197308)
 TapStackdev | 72/74 | 8:08:18 PM | CREATE_COMPLETE | AWS::EC2::SubnetRouteTableAssociation | SecureCorp-VPC-dev/SecureCorp-Public-devSubnet3/RouteTableAssociation (SecureCorpVPCdevSecureCorpPublicdevSubnet3RouteTableAssociation9D6A73C2)
 TapStackdev | 73/74 | 8:08:18 PM | CREATE_COMPLETE | AWS::IAM::Policy | VPC-FlowLogs-Role-dev/DefaultPolicy (VPCFlowLogsRoledevDefaultPolicyE2197308)
 TapStackdev | 74/74 | 8:08:18 PM | CREATE_COMPLETE | AWS::CloudFormation::Stack | TapStackdev

 TapStackdev

 Deployment time: 60.43s

 Outputs:
TapStackdev.AdminRoleArn = arn:aws:iam::000000000000:role/SecureCorp-Admin-dev
TapStackdev.AuditorRoleArn = arn:aws:iam::000000000000:role/SecureCorp-Auditor-dev
TapStackdev.CloudTrailArn = unknown
TapStackdev.CloudTrailBucketName = tapstackdev-securecorpcloudtrailbuck-1d76f900
TapStackdev.DataBucketArn = arn:aws:s3:::tapstackdev-securecorpdatadev788f9dc-b729a822
TapStackdev.DataBucketName = tapstackdev-securecorpdatadev788f9dc-b729a822
TapStackdev.DatabaseEndpoint = unknown
TapStackdev.DatabasePort = unknown
TapStackdev.DatabaseSecretArn = TapStackdev-SecureCorpDatabasedevSec-f1fdcacb
TapStackdev.DeveloperRoleArn = arn:aws:iam::000000000000:role/SecureCorp-Developer-dev
TapStackdev.KMSKeyArn = arn:aws:kms:us-east-1:000000000000:key/de4a941c-7700-4854-b673-8fba5e64c7f0
TapStackdev.KMSKeyId = de4a941c-7700-4854-b673-8fba5e64c7f0
TapStackdev.VPCEndpointEC2Id = vpce-d7bb3c001808c9bc5
TapStackdev.VPCEndpointKMSId = vpce-c0a0e228fb4d36622
TapStackdev.VPCEndpointS3Id = vpce-d13f864913be56f48
TapStackdev.VPCEndpointSecretsManagerId = vpce-1446d6086fe47ed00
TapStackdev.VPCId = vpc-6371b495d2af0af24
Stack ARN:
arn:aws:cloudformation:us-east-1:000000000000:stack/TapStackdev/74d8b51d-6b41-4c15-bd01-1662a75c4b12

 Total time: 63.6s

NOTICES (What's this? https://github.com/aws/aws-cdk/wiki/CLI-Notices)

34892 CDK CLI will collect telemetry data on command usage starting at version 2.1100.0 (unless opted out)

Overview: We do not collect customer content and we anonymize the
telemetry we do collect. See the attached issue for more
information on what data is collected, why, and how to
opt-out. Telemetry will NOT be collected for any CDK CLI
version prior to version 2.1100.0 - regardless of
opt-in/out. You can also preview the telemetry we will start
collecting by logging it to a local file, by adding
`--unstable=telemetry --telemetry-file=my/local/file` to any
`cdk` command.

Affected versions: cli: ^2.0.0

More information at: https://github.com/aws/aws-cdk/issues/34892

If you don’t want to see a notice anymore, use "cdk acknowledge <id>". For example, "cdk acknowledge 34892".
⏱ Total deployment time: 65s
 Verifying deployment...
 Stack status: CREATE_COMPLETE
 Final Resource Summary:

---

| ListStackResources |
+---------------------------------------------------------------------------------+-----------------------------------------------+------------------+
| CDKMetadata | AWS::CDK::Metadata | CREATE_COMPLETE |
| SecureCorpMasterKeydevDFC68877 | AWS::KMS::Key | CREATE_COMPLETE |
| CloudTrailLogGroupdevAF10641E | AWS::Logs::LogGroup | CREATE_COMPLETE |
| CustomS3AutoDeleteObjectsCustomResourceProviderRole3B1BD092 | AWS::IAM::Role | CREATE_COMPLETE |
| SecureCorpCloudTrailBucketdev6D300AA0 | AWS::S3::Bucket | CREATE_COMPLETE |
| CustomS3AutoDeleteObjectsCustomResourceProviderHandler9D90184F | AWS::Lambda::Function | CREATE_COMPLETE |
| SecureCorpVPCdev156B25A5 | AWS::EC2::VPC | CREATE_COMPLETE |
| CustomVpcRestrictDefaultSGCustomResourceProviderRole26592FE0 | AWS::IAM::Role | CREATE_COMPLETE |
| CustomVpcRestrictDefaultSGCustomResourceProviderHandlerDC833E5E | AWS::Lambda::Function | CREATE_COMPLETE |
| SecureCorpAdminRoledev78A62DFA | AWS::IAM::Role | CREATE_COMPLETE |
| SecureCorpAdminRoledevDefaultPolicyC6D5F303 | AWS::IAM::Policy | CREATE_COMPLETE |
| SecureCorpAuditorRoledevF9DFD87E | AWS::IAM::Role | CREATE_COMPLETE |
:
 Could not retrieve resource summary
 Successfully deployed resources: 73
 Generating stack outputs...
 Outputs saved to cfn-outputs/flat-outputs.json
 Stack Outputs:
• AdminRoleArn: arn:aws:iam::000000000000:role/SecureCorp-Admin-dev
• AuditorRoleArn: arn:aws:iam::000000000000:role/SecureCorp-Auditor-dev
• CloudTrailArn: unknown
• CloudTrailBucketName: tapstackdev-securecorpcloudtrailbuck-1d76f900
• DataBucketArn: arn:aws:s3:::tapstackdev-securecorpdatadev788f9dc-b729a822
• DataBucketName: tapstackdev-securecorpdatadev788f9dc-b729a822
• DatabaseEndpoint: unknown
• DatabasePort: unknown
• DatabaseSecretArn: TapStackdev-SecureCorpDatabasedevSec-f1fdcacb
• DeveloperRoleArn: arn:aws:iam::000000000000:role/SecureCorp-Developer-dev
• KMSKeyArn: arn:aws:kms:us-east-1:000000000000:key/de4a941c-7700-4854-b673-8fba5e64c7f0
• KMSKeyId: de4a941c-7700-4854-b673-8fba5e64c7f0
• VPCEndpointEC2Id: vpce-d7bb3c001808c9bc5
• VPCEndpointKMSId: vpce-c0a0e228fb4d36622
• VPCEndpointS3Id: vpce-d13f864913be56f48
• VPCEndpointSecretsManagerId: vpce-1446d6086fe47ed00
• VPCId: vpc-6371b495d2af0af24
 Deployment Summary:
• Stack: TapStackdev
• Status: CREATE_COMPLETE
• Resources: 73 deployed
• Duration: 65s
• LocalStack: http://localhost:4566
 CDK deployment to LocalStack completed successfully!
