
> tap@0.1.0 localstack:cfn:deploy
> ./scripts/localstack-cloudformation-deploy.sh

[0;32m🚀 Starting CloudFormation Deploy to LocalStack...[0m
[0;32m✅ LocalStack is running[0m
[1;33m🧹 Cleaning LocalStack resources...[0m
[0;32m✅ LocalStack state reset[0m
[1;33m📁 Working directory: /root/iac-test-automations/lib[0m
[0;32m✅ CloudFormation template found: TapStack.yml[0m
[0m uploading template to LocalStack S3...[0m
make_bucket: cf-templates-us-east-1
Completed 12.2 KiB/12.2 KiB (151.5 KiB/s) with 1 file(s) remainingupload: ./TapStack.yml to s3://cf-templates-us-east-1/TapStack.yml
[0;32m✅ Template uploaded to LocalStack S3[0m
[0;36m🔧 Deploying CloudFormation stack:[0m
[0;34m  • Stack Name: tap-stack-localstack[0m
[0;34m  • Environment: dev[0m
[0;34m  • Template: TapStack.yml[0m
[1;33m📦 Creating new stack...[0m
[1;33m⏳ Waiting for stack creation to complete...[0m
[1;33m📦 Creating CloudFormation stack...[0m
[0;32m✅ Stack creation initiated[0m
[0;34m📋 Stack ID: arn:aws:cloudformation:us-east-1:000000000000:stack/tap-stack-localstack/d9a4cba6-3ee6-4ac4-821c-75dc48e78129[0m
[0;36m📊 Monitoring deployment progress...[0m
[0;34m🔄 [10:27:10] S3EncryptionKey (AWS::KMS::Key): CREATE_IN_PROGRESS[0m
[0;32m✅ [10:27:10] S3EncryptionKey (AWS::KMS::Key): CREATE_COMPLETE[0m
[0;34m🔄 [10:27:10] PrimaryDataBucket (AWS::S3::Bucket): CREATE_IN_PROGRESS[0m
[0;32m✅ [10:27:10] PrimaryDataBucket (AWS::S3::Bucket): CREATE_COMPLETE[0m
[0;34m🔄 [10:27:10] PrimaryBucketPolicy (AWS::S3::BucketPolicy): CREATE_IN_PROGRESS[0m
[0;32m✅ [10:27:10] PrimaryBucketPolicy (AWS::S3::BucketPolicy): CREATE_COMPLETE[0m
[0;34m🔄 [10:27:10] SecondaryDataBucket (AWS::S3::Bucket): CREATE_IN_PROGRESS[0m
[0;32m✅ [10:27:10] SecondaryDataBucket (AWS::S3::Bucket): CREATE_COMPLETE[0m
[0;34m🔄 [10:27:10] S3AccessRole (AWS::IAM::Role): CREATE_IN_PROGRESS[0m
[0;32m✅ [10:27:10] S3AccessRole (AWS::IAM::Role): CREATE_COMPLETE[0m
[0;34m🔄 [10:27:10] S3AccessInstanceProfile (AWS::IAM::InstanceProfile): CREATE_IN_PROGRESS[0m
[0;32m✅ [10:27:10] S3AccessInstanceProfile (AWS::IAM::InstanceProfile): CREATE_COMPLETE[0m
[0;34m🔄 [10:27:10] S3EncryptionKeyAlias (AWS::KMS::Alias): CREATE_IN_PROGRESS[0m
[0;32m✅ [10:27:10] S3EncryptionKeyAlias (AWS::KMS::Alias): CREATE_COMPLETE[0m
[0;34m🔄 [10:27:10] SecondaryBucketPolicy (AWS::S3::BucketPolicy): CREATE_IN_PROGRESS[0m
[0;32m✅ [10:27:10] SecondaryBucketPolicy (AWS::S3::BucketPolicy): CREATE_COMPLETE[0m
[0;32m✅ Stack deployment completed successfully![0m
[0;32m⏱️  Total deployment time: 9s[0m
[0;36m📊 Final Resource Summary:[0m
-----------------------------------------------------------------------------
|                            ListStackResources                             |
+-------------------------+-----------------------------+-------------------+
|  S3EncryptionKey        |  AWS::KMS::Key              |  CREATE_COMPLETE  |
|  PrimaryDataBucket      |  AWS::S3::Bucket            |  CREATE_COMPLETE  |
|  PrimaryBucketPolicy    |  AWS::S3::BucketPolicy      |  CREATE_COMPLETE  |
|  SecondaryDataBucket    |  AWS::S3::Bucket            |  CREATE_COMPLETE  |
|  S3AccessRole           |  AWS::IAM::Role             |  CREATE_COMPLETE  |
|  S3AccessInstanceProfile|  AWS::IAM::InstanceProfile  |  CREATE_COMPLETE  |
|  S3EncryptionKeyAlias   |  AWS::KMS::Alias            |  CREATE_COMPLETE  |
|  SecondaryBucketPolicy  |  AWS::S3::BucketPolicy      |  CREATE_COMPLETE  |
+-------------------------+-----------------------------+-------------------+
[0;32m✅ Successfully deployed resources: 8[0m
[1;33m📊 Generating stack outputs...[0m
[0;32m✅ Outputs saved to cfn-outputs/flat-outputs.json[0m
[0;34m📋 Stack Outputs:[0m
  • DeploymentSummary: Secure AWS Infrastructure deployed successfully in us-east-1
- Environment: dev
- KMS Encryption: Enabled for all S3 buckets
- Public Access: Blocked on all S3 buckets
- IAM: Least Privilege Access applied with explicit deny policies
- Region Enforcement: All operations restricted to us-west-2
- Security: HTTPS-only access enforced on all buckets

  • IAMRoleArn: arn:aws:iam::000000000000:role/tap-stack-localstack-S3AccessRole-84fc1eb8
  • IAMRoleName: tap-stack-localstack-S3AccessRole-84fc1eb8
  • InstanceProfileArn: arn:aws:iam::000000000000:instance-profile/tap-stack-localstack-S3AccessInstanceProfile-ca5c87c3
  • KMSKeyArn: arn:aws:kms:us-east-1:000000000000:key/f7450668-49e3-4cef-8c58-e551bbc1f5d4
  • KMSKeyId: f7450668-49e3-4cef-8c58-e551bbc1f5d4
  • PrimaryBucketArn: arn:aws:s3:::secure-data-primary-dev-000000000000-us-east-1
  • PrimaryBucketName: secure-data-primary-dev-000000000000-us-east-1
  • SecondaryBucketArn: arn:aws:s3:::secure-data-secondary-dev-000000000000-us-east-1
  • SecondaryBucketName: secure-data-secondary-dev-000000000000-us-east-1
  • StackRegion: us-east-1
[0;36m🎯 Deployment Summary:[0m
[0;34m  • Stack: tap-stack-localstack[0m
[0;34m  • Status: CREATE_COMPLETE[0m
[0;34m  • Resources: 8 deployed[0m
[0;34m  • Duration: 9s[0m
[0;34m  • LocalStack: http://localhost:4566[0m
[0;32m🎉 CloudFormation deployment to LocalStack completed successfully![0m
