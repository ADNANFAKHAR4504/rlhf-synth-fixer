Deploy is failing now with the below logs:

Run ./scripts/deploy.sh
  ./scripts/deploy.sh
  shell: /usr/bin/bash -e {0}
  env:
    NODE_VERSION: 22.17.0
    GO_VERSION: 1.23.12
    ENVIRONMENT_SUFFIX: pr2695
    S3_RELEASE_BUCKET_NAME: iac-rlhf-aws-release
    TERRAFORM_STATE_BUCKET: iac-rlhf-tf-states
    TERRAFORM_STATE_BUCKET_REGION: us-east-1
    TERRAFORM_STATE_BUCKET_KEY: pr2695
    S3_PRODUCTION_BUCKET_NAME: iac-rlhf-production
    PULUMI_STATE_BUCKET: iac-rlhf-pulumi-states
    PULUMI_BUCKET_REGION: us-east-1
    PULUMI_CONFIG_PASSPHRASE: ***
    PULUMI_ORG: organization
    AWS_REGION: us-east-1
    GOCACHE: /home/runner/work/iac-test-automations/iac-test-automations/.cache/go-build
    GOMODCACHE: /home/runner/work/iac-test-automations/iac-test-automations/.cache/go-mod
    ARTIFACTS_FOUND: true
    pythonLocation: /opt/hostedtoolcache/Python/3.12.11/x64
    PKG_CONFIG_PATH: /opt/hostedtoolcache/Python/3.12.11/x64/lib/pkgconfig
    Python_ROOT_DIR: /opt/hostedtoolcache/Python/3.12.11/x64
    Python2_ROOT_DIR: /opt/hostedtoolcache/Python/3.12.11/x64
    Python3_ROOT_DIR: /opt/hostedtoolcache/Python/3.12.11/x64
    LD_LIBRARY_PATH: /opt/hostedtoolcache/Python/3.12.11/x64/lib
    PIPENV_VENV_IN_PROJECT: 1
    AWS_DEFAULT_REGION: us-east-1
    AWS_ACCESS_KEY_ID: ***
    AWS_SECRET_ACCESS_KEY: ***
    CDK_DEFAULT_REGION: us-east-1
    TERRAFORM_CLI_PATH: /home/runner/work/_temp/9daa7d14-9813-4c8d-8e55-b6e308a4ebcd
    REPOSITORY: TuringGpt/iac-test-automations
    COMMIT_AUTHOR: Akash-TuringOps
    PULUMI_BACKEND_URL: s3://iac-rlhf-pulumi-states?region=us-east-1
🚀 Running deployment...
Project: platform=cdk, language=py
Environment configuration:
  Environment suffix: pr2695
  Repository: TuringGpt/iac-test-automations
  Commit author: Akash-TuringOps
  AWS region: us-east-1
  Terraform state bucket: iac-rlhf-tf-states
  Terraform state bucket region: us-east-1
  Pulumi backend URL: s3://iac-rlhf-pulumi-states?region=us-east-1
  Pulumi organization: organization
=== Bootstrap Phase ===
🚀 Bootstrapping infrastructure...
Project: platform=cdk, language=py
Environment configuration:
  Environment suffix: pr2695
  Repository: TuringGpt/iac-test-automations
  Commit author: Akash-TuringOps
✅ CDK project detected, running CDK bootstrap...

> tap@0.1.0 cdk:bootstrap
> npx cdk bootstrap --context environmentSuffix=${ENVIRONMENT_SUFFIX:-dev}

Warning:  aws-cdk-lib.aws_dynamodb.TableOptions#pointInTimeRecovery is deprecated.
  use `pointInTimeRecoverySpecification` instead
  This API will be removed in the next major release.
 ⏳  Bootstrapping environment aws://***/us-east-1...
Trusted accounts for deployment: (none)
Trusted accounts for lookup: (none)
Using default execution policy of 'arn:aws:iam::aws:policy/AdministratorAccess'. Pass '--cloudformation-execution-policies' to customize.
Bootstrap stack already at version 29. Not downgrading it to version 28 (use --force if you intend to downgrade)
 ✅  Environment aws://***/us-east-1 bootstrapped (no changes).

NOTICES         (What's this? https://github.com/aws/aws-cdk/wiki/CLI-Notices)

34892	CDK CLI will collect telemetry data on command usage starting at version 2.1100.0 (unless opted out)

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
✅ Bootstrap completed successfully
=== Deploy Phase ===
✅ CDK project detected, running CDK deploy...

> tap@0.1.0 cdk:deploy
> npx cdk deploy --all --require-approval never --context environmentSuffix=${ENVIRONMENT_SUFFIX:-dev}

Warning:  aws-cdk-lib.aws_dynamodb.TableOptions#pointInTimeRecovery is deprecated.
  use `pointInTimeRecoverySpecification` instead
  This API will be removed in the next major release.

✨  Synthesis time: 8.57s

tap-serverless-pr2695: start: Building tap-serverless-pr2695 Template
tap-serverless-pr2695: success: Built tap-serverless-pr2695 Template
tap-serverless-pr2695: start: Publishing tap-serverless-pr2695 Template (current_account-us-east-1)
tap-serverless-pr2695: success: Published tap-serverless-pr2695 Template (current_account-us-east-1)
tap-serverless-pr2695: deploying... [1/1]
tap-serverless-pr2695: creating CloudFormation changeset...
tap-serverless-pr2695 |  0/71 | 7:57:39 AM | REVIEW_IN_PROGRESS   | AWS::CloudFormation::Stack            | tap-serverless-pr2695 User Initiated
tap-serverless-pr2695 |  0/71 | 7:57:50 AM | CREATE_IN_PROGRESS   | AWS::CloudFormation::Stack            | tap-serverless-pr2695 User Initiated
tap-serverless-pr2695 |  0/71 | 7:57:54 AM | CREATE_IN_PROGRESS   | AWS::EC2::EIP                         | TapVpc/publicSubnet2/EIP (TapVpcpublicSubnet2EIP15B6A591) 
tap-serverless-pr2695 |  0/71 | 7:57:54 AM | CREATE_IN_PROGRESS   | AWS::IAM::Role                        | LambdaExecutionRole (LambdaExecutionRoleD5C26073) 
tap-serverless-pr2695 |  0/71 | 7:57:54 AM | CREATE_IN_PROGRESS   | AWS::CDK::Metadata                    | CDKMetadata/Default (CDKMetadata) 
tap-serverless-pr2695 |  0/71 | 7:57:54 AM | CREATE_IN_PROGRESS   | AWS::S3::Bucket                       | TapDataBucket (TapDataBucket9D019609) 
tap-serverless-pr2695 |  0/71 | 7:57:54 AM | CREATE_IN_PROGRESS   | AWS::DynamoDB::Table                  | TapTable (TapTable1BC71E11) 
tap-serverless-pr2695 |  0/71 | 7:57:54 AM | CREATE_IN_PROGRESS   | AWS::S3::Bucket                       | TapLogsBucket (TapLogsBucketB5189C7B) 
tap-serverless-pr2695 |  0/71 | 7:57:54 AM | CREATE_IN_PROGRESS   | AWS::ApiGateway::RestApi              | TapApi (TapApiB09BF2B2) 
tap-serverless-pr2695 |  0/71 | 7:57:54 AM | CREATE_IN_PROGRESS   | AWS::EC2::EIP                         | TapVpc/publicSubnet1/EIP (TapVpcpublicSubnet1EIP45C8CEBC) 
tap-serverless-pr2695 |  0/71 | 7:57:54 AM | CREATE_IN_PROGRESS   | AWS::SQS::Queue                       | TapDLQ (TapDLQ73E7E7BC) 
tap-serverless-pr2695 |  0/71 | 7:57:54 AM | CREATE_IN_PROGRESS   | AWS::EC2::InternetGateway             | TapVpc/IGW (TapVpcIGWD6C67C56) 
tap-serverless-pr2695 |  0/71 | 7:57:54 AM | CREATE_IN_PROGRESS   | AWS::EC2::VPC                         | TapVpc (TapVpc8B8CDDDF) 
tap-serverless-pr2695 |  0/71 | 7:57:54 AM | CREATE_IN_PROGRESS   | AWS::Events::EventBus                 | TapEventBus (TapEventBus81D3F9DA) 
tap-serverless-pr2695 |  0/71 | 7:57:55 AM | CREATE_IN_PROGRESS   | AWS::CDK::Metadata                    | CDKMetadata/Default (CDKMetadata) Resource creation Initiated
tap-serverless-pr2695 |  0/71 | 7:57:55 AM | CREATE_IN_PROGRESS   | AWS::IAM::Role                        | LambdaExecutionRole (LambdaExecutionRoleD5C26073) Resource creation Initiated
tap-serverless-pr2695 |  0/71 | 7:57:55 AM | CREATE_IN_PROGRESS   | AWS::Events::EventBus                 | TapEventBus (TapEventBus81D3F9DA) Resource creation Initiated
tap-serverless-pr2695 |  1/71 | 7:57:55 AM | CREATE_COMPLETE      | AWS::CDK::Metadata                    | CDKMetadata/Default (CDKMetadata) 
tap-serverless-pr2695 |  1/71 | 7:57:55 AM | CREATE_IN_PROGRESS   | AWS::EC2::EIP                         | TapVpc/publicSubnet2/EIP (TapVpcpublicSubnet2EIP15B6A591) Resource creation Initiated
tap-serverless-pr2695 |  1/71 | 7:57:55 AM | CREATE_IN_PROGRESS   | AWS::EC2::InternetGateway             | TapVpc/IGW (TapVpcIGWD6C67C56) Resource creation Initiated
tap-serverless-pr2695 |  1/71 | 7:57:55 AM | CREATE_IN_PROGRESS   | AWS::EC2::EIP                         | TapVpc/publicSubnet1/EIP (TapVpcpublicSubnet1EIP45C8CEBC) Resource creation Initiated
tap-serverless-pr2695 |  1/71 | 7:57:55 AM | CREATE_IN_PROGRESS   | AWS::SQS::Queue                       | TapDLQ (TapDLQ73E7E7BC) Resource creation Initiated
tap-serverless-pr2695 |  1/71 | 7:57:55 AM | CREATE_IN_PROGRESS   | AWS::S3::Bucket                       | TapLogsBucket (TapLogsBucketB5189C7B) Resource creation Initiated
tap-serverless-pr2695 |  1/71 | 7:57:56 AM | CREATE_IN_PROGRESS   | AWS::ApiGateway::RestApi              | TapApi (TapApiB09BF2B2) Resource creation Initiated
tap-serverless-pr2695 |  1/71 | 7:57:56 AM | CREATE_IN_PROGRESS   | AWS::S3::Bucket                       | TapDataBucket (TapDataBucket9D019609) Resource creation Initiated
tap-serverless-pr2695 |  1/71 | 7:57:56 AM | CREATE_IN_PROGRESS   | AWS::EC2::VPC                         | TapVpc (TapVpc8B8CDDDF) Resource creation Initiated
tap-serverless-pr2695 |  1/71 | 7:57:56 AM | CREATE_IN_PROGRESS   | AWS::DynamoDB::Table                  | TapTable (TapTable1BC71E11) Resource creation Initiated
tap-serverless-pr2695 |  1/71 | 7:57:56 AM | CREATE_IN_PROGRESS   | AWS::EC2::EIP                         | TapVpc/publicSubnet2/EIP (TapVpcpublicSubnet2EIP15B6A591) Eventual consistency check initiated
tap-serverless-pr2695 |  1/71 | 7:57:56 AM | CREATE_IN_PROGRESS   | AWS::EC2::InternetGateway             | TapVpc/IGW (TapVpcIGWD6C67C56) Eventual consistency check initiated
tap-serverless-pr2695 |  1/71 | 7:57:56 AM | CREATE_IN_PROGRESS   | AWS::EC2::EIP                         | TapVpc/publicSubnet1/EIP (TapVpcpublicSubnet1EIP45C8CEBC) Eventual consistency check initiated
tap-serverless-pr2695 |  1/71 | 7:57:56 AM | CREATE_IN_PROGRESS   | AWS::SQS::Queue                       | TapDLQ (TapDLQ73E7E7BC) Eventual consistency check initiated
tap-serverless-pr2695 |  2/71 | 7:57:56 AM | CREATE_COMPLETE      | AWS::ApiGateway::RestApi              | TapApi (TapApiB09BF2B2) 
tap-serverless-pr2695 |  2/71 | 7:57:57 AM | CREATE_IN_PROGRESS   | AWS::SQS::Queue                       | TapQueue (TapQueueC7392422) 
tap-serverless-pr2695 |  3/71 | 7:57:57 AM | CREATE_COMPLETE      | AWS::Events::EventBus                 | TapEventBus (TapEventBus81D3F9DA) 
tap-serverless-pr2695 |  3/71 | 7:57:57 AM | CREATE_IN_PROGRESS   | AWS::ApiGateway::Resource             | TapApi/Default/data (TapApidataDBF2509A) 
tap-serverless-pr2695 |  3/71 | 7:57:57 AM | CREATE_IN_PROGRESS   | AWS::ApiGateway::Method               | TapApi/Default/OPTIONS (TapApiOPTIONSB94F68C8) 
tap-serverless-pr2695 |  3/71 | 7:57:57 AM | CREATE_IN_PROGRESS   | AWS::ApiGateway::Resource             | TapApi/Default/health (TapApihealth220A0B30) 
tap-serverless-pr2695 |  3/71 | 7:57:58 AM | CREATE_IN_PROGRESS   | AWS::SQS::Queue                       | TapQueue (TapQueueC7392422) Resource creation Initiated
tap-serverless-pr2695 |  3/71 | 7:57:58 AM | CREATE_IN_PROGRESS   | AWS::ApiGateway::Resource             | TapApi/Default/data (TapApidataDBF2509A) Resource creation Initiated
tap-serverless-pr2695 |  3/71 | 7:57:58 AM | CREATE_IN_PROGRESS   | AWS::ApiGateway::Method               | TapApi/Default/OPTIONS (TapApiOPTIONSB94F68C8) Resource creation Initiated
tap-serverless-pr2695 |  3/71 | 7:57:58 AM | CREATE_IN_PROGRESS   | AWS::ApiGateway::Resource             | TapApi/Default/health (TapApihealth220A0B30) Resource creation Initiated
tap-serverless-pr2695 |  3/71 | 7:57:58 AM | CREATE_IN_PROGRESS   | AWS::SQS::Queue                       | TapQueue (TapQueueC7392422) Eventual consistency check initiated
tap-serverless-pr2695 |  4/71 | 7:57:59 AM | CREATE_COMPLETE      | AWS::ApiGateway::Resource             | TapApi/Default/data (TapApidataDBF2509A) 
tap-serverless-pr2695 |  5/71 | 7:57:59 AM | CREATE_COMPLETE      | AWS::ApiGateway::Resource             | TapApi/Default/health (TapApihealth220A0B30) 
tap-serverless-pr2695 |  5/71 | 7:57:59 AM | CREATE_IN_PROGRESS   | AWS::ApiGateway::Method               | TapApi/Default/data/OPTIONS (TapApidataOPTIONS8AC2AAB1) 
tap-serverless-pr2695 |  5/71 | 7:57:59 AM | CREATE_IN_PROGRESS   | AWS::ApiGateway::Method               | TapApi/Default/health/OPTIONS (TapApihealthOPTIONS79896050) 
tap-serverless-pr2695 |  5/71 | 7:58:00 AM | CREATE_IN_PROGRESS   | AWS::ApiGateway::Method               | TapApi/Default/data/OPTIONS (TapApidataOPTIONS8AC2AAB1) Resource creation Initiated
tap-serverless-pr2695 |  5/71 | 7:58:00 AM | CREATE_IN_PROGRESS   | AWS::ApiGateway::Method               | TapApi/Default/health/OPTIONS (TapApihealthOPTIONS79896050) Resource creation Initiated
tap-serverless-pr2695 |  6/71 | 7:58:00 AM | CREATE_COMPLETE      | AWS::ApiGateway::Method               | TapApi/Default/OPTIONS (TapApiOPTIONSB94F68C8) 
tap-serverless-pr2695 |  7/71 | 7:58:02 AM | CREATE_COMPLETE      | AWS::ApiGateway::Method               | TapApi/Default/data/OPTIONS (TapApidataOPTIONS8AC2AAB1) 
tap-serverless-pr2695 |  8/71 | 7:58:02 AM | CREATE_COMPLETE      | AWS::ApiGateway::Method               | TapApi/Default/health/OPTIONS (TapApihealthOPTIONS79896050) 
tap-serverless-pr2695 |  9/71 | 7:58:08 AM | CREATE_COMPLETE      | AWS::EC2::VPC                         | TapVpc (TapVpc8B8CDDDF) 
tap-serverless-pr2695 |  9/71 | 7:58:08 AM | CREATE_IN_PROGRESS   | AWS::EC2::Subnet                      | TapVpc/privateSubnet1/Subnet (TapVpcprivateSubnet1Subnet12EE2EB8) 
tap-serverless-pr2695 |  9/71 | 7:58:08 AM | CREATE_IN_PROGRESS   | AWS::EC2::SecurityGroup               | LambdaSecurityGroup (LambdaSecurityGroup0BD9FC99) 
tap-serverless-pr2695 |  9/71 | 7:58:08 AM | CREATE_IN_PROGRESS   | AWS::EC2::Subnet                      | TapVpc/privateSubnet2/Subnet (TapVpcprivateSubnet2SubnetF743A890) 
tap-serverless-pr2695 |  9/71 | 7:58:08 AM | CREATE_IN_PROGRESS   | AWS::EC2::VPCGatewayAttachment        | TapVpc/VPCGW (TapVpcVPCGWDFDBCCBD) 
tap-serverless-pr2695 |  9/71 | 7:58:08 AM | CREATE_IN_PROGRESS   | AWS::EC2::Subnet                      | TapVpc/publicSubnet2/Subnet (TapVpcpublicSubnet2Subnet9CE016D7) 
tap-serverless-pr2695 |  9/71 | 7:58:08 AM | CREATE_IN_PROGRESS   | AWS::EC2::RouteTable                  | TapVpc/publicSubnet2/RouteTable (TapVpcpublicSubnet2RouteTable454CFF68) 
tap-serverless-pr2695 |  9/71 | 7:58:08 AM | CREATE_IN_PROGRESS   | AWS::EC2::RouteTable                  | TapVpc/privateSubnet2/RouteTable (TapVpcprivateSubnet2RouteTable89F7D7BF) 
tap-serverless-pr2695 |  9/71 | 7:58:08 AM | CREATE_IN_PROGRESS   | AWS::EC2::RouteTable                  | TapVpc/privateSubnet1/RouteTable (TapVpcprivateSubnet1RouteTable262C1F9D) 
tap-serverless-pr2695 |  9/71 | 7:58:08 AM | CREATE_IN_PROGRESS   | AWS::EC2::RouteTable                  | TapVpc/publicSubnet1/RouteTable (TapVpcpublicSubnet1RouteTable9186A90D) 
tap-serverless-pr2695 |  9/71 | 7:58:08 AM | CREATE_IN_PROGRESS   | AWS::EC2::Subnet                      | TapVpc/publicSubnet1/Subnet (TapVpcpublicSubnet1Subnet4F8D84E8) 
tap-serverless-pr2695 | 10/71 | 7:58:09 AM | CREATE_COMPLETE      | AWS::S3::Bucket                       | TapLogsBucket (TapLogsBucketB5189C7B) 
tap-serverless-pr2695 | 10/71 | 7:58:09 AM | CREATE_IN_PROGRESS   | AWS::IAM::Role                        | Custom::VpcRestrictDefaultSGCustomResourceProvider/Role (CustomVpcRestrictDefaultSGCustomResourceProviderRole26592FE0) 
tap-serverless-pr2695 | 10/71 | 7:58:09 AM | CREATE_IN_PROGRESS   | AWS::EC2::RouteTable                  | TapVpc/privateSubnet2/RouteTable (TapVpcprivateSubnet2RouteTable89F7D7BF) Resource creation Initiated
tap-serverless-pr2695 | 10/71 | 7:58:09 AM | CREATE_IN_PROGRESS   | AWS::EC2::VPCGatewayAttachment        | TapVpc/VPCGW (TapVpcVPCGWDFDBCCBD) Resource creation Initiated
tap-serverless-pr2695 | 10/71 | 7:58:09 AM | CREATE_IN_PROGRESS   | AWS::EC2::RouteTable                  | TapVpc/publicSubnet2/RouteTable (TapVpcpublicSubnet2RouteTable454CFF68) Resource creation Initiated
tap-serverless-pr2695 | 10/71 | 7:58:09 AM | CREATE_IN_PROGRESS   | AWS::EC2::RouteTable                  | TapVpc/privateSubnet1/RouteTable (TapVpcprivateSubnet1RouteTable262C1F9D) Resource creation Initiated
tap-serverless-pr2695 | 10/71 | 7:58:09 AM | CREATE_IN_PROGRESS   | AWS::EC2::RouteTable                  | TapVpc/publicSubnet1/RouteTable (TapVpcpublicSubnet1RouteTable9186A90D) Resource creation Initiated
tap-serverless-pr2695 | 10/71 | 7:58:09 AM | CREATE_IN_PROGRESS   | AWS::EC2::Subnet                      | TapVpc/privateSubnet2/Subnet (TapVpcprivateSubnet2SubnetF743A890) Resource creation Initiated
tap-serverless-pr2695 | 10/71 | 7:58:10 AM | CREATE_IN_PROGRESS   | AWS::EC2::Subnet                      | TapVpc/publicSubnet1/Subnet (TapVpcpublicSubnet1Subnet4F8D84E8) Resource creation Initiated
tap-serverless-pr2695 | 10/71 | 7:58:10 AM | CREATE_IN_PROGRESS   | AWS::EC2::Subnet                      | TapVpc/privateSubnet1/Subnet (TapVpcprivateSubnet1Subnet12EE2EB8) Resource creation Initiated
tap-serverless-pr2695 | 10/71 | 7:58:10 AM | CREATE_IN_PROGRESS   | AWS::EC2::Subnet                      | TapVpc/publicSubnet2/Subnet (TapVpcpublicSubnet2Subnet9CE016D7) Resource creation Initiated
tap-serverless-pr2695 | 10/71 | 7:58:10 AM | CREATE_IN_PROGRESS   | AWS::EC2::RouteTable                  | TapVpc/privateSubnet2/RouteTable (TapVpcprivateSubnet2RouteTable89F7D7BF) Eventual consistency check initiated
tap-serverless-pr2695 | 11/71 | 7:58:10 AM | CREATE_COMPLETE      | AWS::S3::Bucket                       | TapDataBucket (TapDataBucket9D019609) 
tap-serverless-pr2695 | 11/71 | 7:58:10 AM | CREATE_IN_PROGRESS   | AWS::EC2::RouteTable                  | TapVpc/publicSubnet2/RouteTable (TapVpcpublicSubnet2RouteTable454CFF68) Eventual consistency check initiated
tap-serverless-pr2695 | 11/71 | 7:58:10 AM | CREATE_IN_PROGRESS   | AWS::EC2::RouteTable                  | TapVpc/publicSubnet1/RouteTable (TapVpcpublicSubnet1RouteTable9186A90D) Eventual consistency check initiated
tap-serverless-pr2695 | 11/71 | 7:58:10 AM | CREATE_IN_PROGRESS   | AWS::EC2::RouteTable                  | TapVpc/privateSubnet1/RouteTable (TapVpcprivateSubnet1RouteTable262C1F9D) Eventual consistency check initiated
tap-serverless-pr2695 | 11/71 | 7:58:10 AM | CREATE_IN_PROGRESS   | AWS::IAM::Role                        | Custom::VpcRestrictDefaultSGCustomResourceProvider/Role (CustomVpcRestrictDefaultSGCustomResourceProviderRole26592FE0) Resource creation Initiated
tap-serverless-pr2695 | 11/71 | 7:58:11 AM | CREATE_IN_PROGRESS   | AWS::EC2::VPCEndpoint                 | TapVpc/DynamoDbEndpoint (TapVpcDynamoDbEndpoint23258B7F) 
tap-serverless-pr2695 | 11/71 | 7:58:11 AM | CREATE_IN_PROGRESS   | AWS::EC2::VPCEndpoint                 | TapVpc/S3Endpoint (TapVpcS3Endpoint3CA67D81) 
tap-serverless-pr2695 | 11/71 | 7:58:11 AM | CREATE_IN_PROGRESS   | AWS::EC2::SecurityGroup               | LambdaSecurityGroup (LambdaSecurityGroup0BD9FC99) Resource creation Initiated
tap-serverless-pr2695 | 12/71 | 7:58:11 AM | CREATE_COMPLETE      | AWS::EC2::InternetGateway             | TapVpc/IGW (TapVpcIGWD6C67C56) 
tap-serverless-pr2695 | 13/71 | 7:58:11 AM | CREATE_COMPLETE      | AWS::EC2::VPCGatewayAttachment        | TapVpc/VPCGW (TapVpcVPCGWDFDBCCBD) 
tap-serverless-pr2695 | 14/71 | 7:58:11 AM | CREATE_COMPLETE      | AWS::EC2::EIP                         | TapVpc/publicSubnet2/EIP (TapVpcpublicSubnet2EIP15B6A591) 
tap-serverless-pr2695 | 15/71 | 7:58:12 AM | CREATE_COMPLETE      | AWS::IAM::Role                        | LambdaExecutionRole (LambdaExecutionRoleD5C26073) 
tap-serverless-pr2695 | 16/71 | 7:58:12 AM | CREATE_COMPLETE      | AWS::EC2::EIP                         | TapVpc/publicSubnet1/EIP (TapVpcpublicSubnet1EIP45C8CEBC) 
tap-serverless-pr2695 | 17/71 | 7:58:13 AM | CREATE_COMPLETE      | AWS::EC2::Subnet                      | TapVpc/privateSubnet2/Subnet (TapVpcprivateSubnet2SubnetF743A890) 
tap-serverless-pr2695 | 18/71 | 7:58:13 AM | CREATE_COMPLETE      | AWS::EC2::Subnet                      | TapVpc/privateSubnet1/Subnet (TapVpcprivateSubnet1Subnet12EE2EB8) 
tap-serverless-pr2695 | 19/71 | 7:58:13 AM | CREATE_COMPLETE      | AWS::EC2::Subnet                      | TapVpc/publicSubnet1/Subnet (TapVpcpublicSubnet1Subnet4F8D84E8) 
tap-serverless-pr2695 | 20/71 | 7:58:13 AM | CREATE_COMPLETE      | AWS::EC2::Subnet                      | TapVpc/publicSubnet2/Subnet (TapVpcpublicSubnet2Subnet9CE016D7) 
tap-serverless-pr2695 | 20/71 | 7:58:13 AM | CREATE_IN_PROGRESS   | AWS::EC2::SubnetRouteTableAssociation | TapVpc/privateSubnet1/RouteTableAssociation (TapVpcprivateSubnet1RouteTableAssociationEA1E1697) 
tap-serverless-pr2695 | 20/71 | 7:58:13 AM | CREATE_IN_PROGRESS   | AWS::EC2::SubnetRouteTableAssociation | TapVpc/privateSubnet2/RouteTableAssociation (TapVpcprivateSubnet2RouteTableAssociationFA4D2A75) 
tap-serverless-pr2695 | 20/71 | 7:58:14 AM | CREATE_IN_PROGRESS   | AWS::EC2::VPCEndpoint                 | TapVpc/DynamoDbEndpoint (TapVpcDynamoDbEndpoint23258B7F) Resource creation Initiated
tap-serverless-pr2695 | 20/71 | 7:58:14 AM | CREATE_IN_PROGRESS   | AWS::EC2::SubnetRouteTableAssociation | TapVpc/publicSubnet1/RouteTableAssociation (TapVpcpublicSubnet1RouteTableAssociation845CF324) 
tap-serverless-pr2695 | 20/71 | 7:58:14 AM | CREATE_IN_PROGRESS   | AWS::EC2::VPCEndpoint                 | TapVpc/S3Endpoint (TapVpcS3Endpoint3CA67D81) Resource creation Initiated
tap-serverless-pr2695 | 20/71 | 7:58:14 AM | CREATE_IN_PROGRESS   | AWS::EC2::SubnetRouteTableAssociation | TapVpc/publicSubnet2/RouteTableAssociation (TapVpcpublicSubnet2RouteTableAssociation6746B76F) 
tap-serverless-pr2695 | 21/71 | 7:58:14 AM | CREATE_COMPLETE      | AWS::EC2::VPCEndpoint                 | TapVpc/DynamoDbEndpoint (TapVpcDynamoDbEndpoint23258B7F) 
tap-serverless-pr2695 | 22/71 | 7:58:14 AM | CREATE_COMPLETE      | AWS::EC2::VPCEndpoint                 | TapVpc/S3Endpoint (TapVpcS3Endpoint3CA67D81) 
tap-serverless-pr2695 | 22/71 | 7:58:15 AM | CREATE_IN_PROGRESS   | AWS::EC2::SubnetRouteTableAssociation | TapVpc/privateSubnet2/RouteTableAssociation (TapVpcprivateSubnet2RouteTableAssociationFA4D2A75) Resource creation Initiated
tap-serverless-pr2695 | 22/71 | 7:58:15 AM | CREATE_IN_PROGRESS   | AWS::EC2::SubnetRouteTableAssociation | TapVpc/privateSubnet1/RouteTableAssociation (TapVpcprivateSubnet1RouteTableAssociationEA1E1697) Resource creation Initiated
tap-serverless-pr2695 | 22/71 | 7:58:15 AM | CREATE_IN_PROGRESS   | AWS::EC2::SubnetRouteTableAssociation | TapVpc/publicSubnet2/RouteTableAssociation (TapVpcpublicSubnet2RouteTableAssociation6746B76F) Resource creation Initiated
tap-serverless-pr2695 | 22/71 | 7:58:15 AM | CREATE_IN_PROGRESS   | AWS::EC2::SubnetRouteTableAssociation | TapVpc/publicSubnet1/RouteTableAssociation (TapVpcpublicSubnet1RouteTableAssociation845CF324) Resource creation Initiated
tap-serverless-pr2695 | 23/71 | 7:58:15 AM | CREATE_COMPLETE      | AWS::EC2::SubnetRouteTableAssociation | TapVpc/privateSubnet2/RouteTableAssociation (TapVpcprivateSubnet2RouteTableAssociationFA4D2A75) 
tap-serverless-pr2695 | 24/71 | 7:58:15 AM | CREATE_COMPLETE      | AWS::EC2::SubnetRouteTableAssociation | TapVpc/privateSubnet1/RouteTableAssociation (TapVpcprivateSubnet1RouteTableAssociationEA1E1697) 
tap-serverless-pr2695 | 25/71 | 7:58:15 AM | CREATE_COMPLETE      | AWS::EC2::SubnetRouteTableAssociation | TapVpc/publicSubnet2/RouteTableAssociation (TapVpcpublicSubnet2RouteTableAssociation6746B76F) 
tap-serverless-pr2695 | 26/71 | 7:58:16 AM | CREATE_COMPLETE      | AWS::EC2::SubnetRouteTableAssociation | TapVpc/publicSubnet1/RouteTableAssociation (TapVpcpublicSubnet1RouteTableAssociation845CF324) 
tap-serverless-pr2695 | 27/71 | 7:58:18 AM | CREATE_COMPLETE      | AWS::EC2::SecurityGroup               | LambdaSecurityGroup (LambdaSecurityGroup0BD9FC99) 
tap-serverless-pr2695 | 28/71 | 7:58:20 AM | CREATE_COMPLETE      | AWS::EC2::RouteTable                  | TapVpc/publicSubnet2/RouteTable (TapVpcpublicSubnet2RouteTable454CFF68) 
tap-serverless-pr2695 | 29/71 | 7:58:20 AM | CREATE_COMPLETE      | AWS::EC2::RouteTable                  | TapVpc/privateSubnet1/RouteTable (TapVpcprivateSubnet1RouteTable262C1F9D) 
tap-serverless-pr2695 | 30/71 | 7:58:20 AM | CREATE_COMPLETE      | AWS::EC2::RouteTable                  | TapVpc/privateSubnet2/RouteTable (TapVpcprivateSubnet2RouteTable89F7D7BF) 
tap-serverless-pr2695 | 31/71 | 7:58:20 AM | CREATE_COMPLETE      | AWS::EC2::RouteTable                  | TapVpc/publicSubnet1/RouteTable (TapVpcpublicSubnet1RouteTable9186A90D) 
tap-serverless-pr2695 | 31/71 | 7:58:21 AM | CREATE_IN_PROGRESS   | AWS::EC2::Route                       | TapVpc/publicSubnet2/DefaultRoute (TapVpcpublicSubnet2DefaultRouteE0B90472) 
tap-serverless-pr2695 | 31/71 | 7:58:21 AM | CREATE_IN_PROGRESS   | AWS::EC2::Route                       | TapVpc/publicSubnet1/DefaultRoute (TapVpcpublicSubnet1DefaultRouteF9DDCC94) 
tap-serverless-pr2695 | 31/71 | 7:58:22 AM | CREATE_IN_PROGRESS   | AWS::EC2::Route                       | TapVpc/publicSubnet2/DefaultRoute (TapVpcpublicSubnet2DefaultRouteE0B90472) Resource creation Initiated
tap-serverless-pr2695 | 31/71 | 7:58:22 AM | CREATE_IN_PROGRESS   | AWS::EC2::Route                       | TapVpc/publicSubnet1/DefaultRoute (TapVpcpublicSubnet1DefaultRouteF9DDCC94) Resource creation Initiated
tap-serverless-pr2695 | 32/71 | 7:58:23 AM | CREATE_COMPLETE      | AWS::EC2::Route                       | TapVpc/publicSubnet1/DefaultRoute (TapVpcpublicSubnet1DefaultRouteF9DDCC94) 
tap-serverless-pr2695 | 32/71 | 7:58:24 AM | CREATE_IN_PROGRESS   | AWS::EC2::NatGateway                  | TapVpc/publicSubnet1/NATGateway (TapVpcpublicSubnet1NATGateway6462C64F) 
tap-serverless-pr2695 | 33/71 | 7:58:24 AM | CREATE_COMPLETE      | AWS::EC2::Route                       | TapVpc/publicSubnet2/DefaultRoute (TapVpcpublicSubnet2DefaultRouteE0B90472) 
tap-serverless-pr2695 | 33/71 | 7:58:25 AM | CREATE_IN_PROGRESS   | AWS::EC2::NatGateway                  | TapVpc/publicSubnet2/NATGateway (TapVpcpublicSubnet2NATGatewayF04294B4) 
tap-serverless-pr2695 | 33/71 | 7:58:25 AM | CREATE_IN_PROGRESS   | AWS::EC2::NatGateway                  | TapVpc/publicSubnet1/NATGateway (TapVpcpublicSubnet1NATGateway6462C64F) Resource creation Initiated
tap-serverless-pr2695 | 33/71 | 7:58:26 AM | CREATE_IN_PROGRESS   | AWS::EC2::NatGateway                  | TapVpc/publicSubnet2/NATGateway (TapVpcpublicSubnet2NATGatewayF04294B4) Resource creation Initiated
tap-serverless-pr2695 | 34/71 | 7:58:26 AM | CREATE_COMPLETE      | AWS::SQS::Queue                       | TapDLQ (TapDLQ73E7E7BC) 
tap-serverless-pr2695 | 35/71 | 7:58:27 AM | CREATE_COMPLETE      | AWS::IAM::Role                        | Custom::VpcRestrictDefaultSGCustomResourceProvider/Role (CustomVpcRestrictDefaultSGCustomResourceProviderRole26592FE0) 
tap-serverless-pr2695 | 35/71 | 7:58:28 AM | CREATE_IN_PROGRESS   | AWS::Lambda::Function                 | Custom::VpcRestrictDefaultSGCustomResourceProvider/Handler (CustomVpcRestrictDefaultSGCustomResourceProviderHandlerDC833E5E) 
tap-serverless-pr2695 | 36/71 | 7:58:28 AM | CREATE_COMPLETE      | AWS::SQS::Queue                       | TapQueue (TapQueueC7392422) 
tap-serverless-pr2695 | 36/71 | 7:58:29 AM | CREATE_IN_PROGRESS   | AWS::Lambda::Function                 | Custom::VpcRestrictDefaultSGCustomResourceProvider/Handler (CustomVpcRestrictDefaultSGCustomResourceProviderHandlerDC833E5E) Resource creation Initiated
tap-serverless-pr2695 | 36/71 | 7:58:30 AM | CREATE_IN_PROGRESS   | AWS::Lambda::Function                 | Custom::VpcRestrictDefaultSGCustomResourceProvider/Handler (CustomVpcRestrictDefaultSGCustomResourceProviderHandlerDC833E5E) Eventual consistency check initiated
tap-serverless-pr2695 | 37/71 | 7:58:36 AM | CREATE_COMPLETE      | AWS::Lambda::Function                 | Custom::VpcRestrictDefaultSGCustomResourceProvider/Handler (CustomVpcRestrictDefaultSGCustomResourceProviderHandlerDC833E5E) 
tap-serverless-pr2695 | 37/71 | 7:58:36 AM | CREATE_IN_PROGRESS   | Custom::VpcRestrictDefaultSG          | TapVpc/RestrictDefaultSecurityGroupCustomResource/Default (TapVpcRestrictDefaultSecurityGroupCustomResource2332DAD5) 
tap-serverless-pr2695 | 38/71 | 7:58:38 AM | CREATE_COMPLETE      | AWS::DynamoDB::Table                  | TapTable (TapTable1BC71E11) 
tap-serverless-pr2695 | 38/71 | 7:58:41 AM | CREATE_IN_PROGRESS   | AWS::IAM::Policy                      | LambdaExecutionRole/DefaultPolicy (LambdaExecutionRoleDefaultPolicy6D69732F) 
tap-serverless-pr2695 | 38/71 | 7:58:42 AM | CREATE_IN_PROGRESS   | AWS::IAM::Policy                      | LambdaExecutionRole/DefaultPolicy (LambdaExecutionRoleDefaultPolicy6D69732F) Resource creation Initiated
tap-serverless-pr2695 | 38/71 | 7:58:46 AM | CREATE_IN_PROGRESS   | Custom::VpcRestrictDefaultSG          | TapVpc/RestrictDefaultSecurityGroupCustomResource/Default (TapVpcRestrictDefaultSecurityGroupCustomResource2332DAD5) Resource creation Initiated
tap-serverless-pr2695 | 39/71 | 7:58:46 AM | CREATE_COMPLETE      | Custom::VpcRestrictDefaultSG          | TapVpc/RestrictDefaultSecurityGroupCustomResource/Default (TapVpcRestrictDefaultSecurityGroupCustomResource2332DAD5) 
tap-serverless-pr2695 | 40/71 | 7:58:58 AM | CREATE_COMPLETE      | AWS::IAM::Policy                      | LambdaExecutionRole/DefaultPolicy (LambdaExecutionRoleDefaultPolicy6D69732F) 
tap-serverless-pr2695 | 41/71 | 8:00:00 AM | CREATE_COMPLETE      | AWS::EC2::NatGateway                  | TapVpc/publicSubnet1/NATGateway (TapVpcpublicSubnet1NATGateway6462C64F) 
tap-serverless-pr2695 | 41/71 | 8:00:00 AM | CREATE_IN_PROGRESS   | AWS::EC2::Route                       | TapVpc/privateSubnet1/DefaultRoute (TapVpcprivateSubnet1DefaultRoute91B7C4A1) 
tap-serverless-pr2695 | 41/71 | 8:00:02 AM | CREATE_IN_PROGRESS   | AWS::EC2::Route                       | TapVpc/privateSubnet1/DefaultRoute (TapVpcprivateSubnet1DefaultRoute91B7C4A1) Resource creation Initiated
tap-serverless-pr2695 | 42/71 | 8:00:02 AM | CREATE_COMPLETE      | AWS::EC2::Route                       | TapVpc/privateSubnet1/DefaultRoute (TapVpcprivateSubnet1DefaultRoute91B7C4A1) 
tap-serverless-pr2695 | 43/71 | 8:00:11 AM | CREATE_COMPLETE      | AWS::EC2::NatGateway                  | TapVpc/publicSubnet2/NATGateway (TapVpcpublicSubnet2NATGatewayF04294B4) 
tap-serverless-pr2695 | 43/71 | 8:00:12 AM | CREATE_IN_PROGRESS   | AWS::EC2::Route                       | TapVpc/privateSubnet2/DefaultRoute (TapVpcprivateSubnet2DefaultRoute64DBAF67) 
tap-serverless-pr2695 | 43/71 | 8:00:13 AM | CREATE_IN_PROGRESS   | AWS::EC2::Route                       | TapVpc/privateSubnet2/DefaultRoute (TapVpcprivateSubnet2DefaultRoute64DBAF67) Resource creation Initiated
tap-serverless-pr2695 | 44/71 | 8:00:14 AM | CREATE_COMPLETE      | AWS::EC2::Route                       | TapVpc/privateSubnet2/DefaultRoute (TapVpcprivateSubnet2DefaultRoute64DBAF67) 
tap-serverless-pr2695 | 44/71 | 8:00:15 AM | CREATE_IN_PROGRESS   | AWS::Lambda::Function                 | EventProcessor (EventProcessorD4153CB5) 
tap-serverless-pr2695 | 44/71 | 8:00:15 AM | CREATE_IN_PROGRESS   | AWS::Lambda::Function                 | ApiHandler (ApiHandler5E7490E8) 
tap-serverless-pr2695 | 44/71 | 8:00:15 AM | CREATE_IN_PROGRESS   | AWS::Lambda::Function                 | AsyncProcessor (AsyncProcessorA49E4D20) 
tap-serverless-pr2695 | 44/71 | 8:00:16 AM | CREATE_IN_PROGRESS   | AWS::Lambda::Function                 | EventProcessor (EventProcessorD4153CB5) Resource creation Initiated
tap-serverless-pr2695 | 44/71 | 8:00:16 AM | CREATE_IN_PROGRESS   | AWS::Lambda::Function                 | ApiHandler (ApiHandler5E7490E8) Resource creation Initiated
tap-serverless-pr2695 | 44/71 | 8:00:16 AM | CREATE_IN_PROGRESS   | AWS::Lambda::Function                 | AsyncProcessor (AsyncProcessorA49E4D20) Resource creation Initiated
tap-serverless-pr2695 | 44/71 | 8:00:25 AM | CREATE_IN_PROGRESS   | AWS::Lambda::Function                 | EventProcessor (EventProcessorD4153CB5) Eventual consistency check initiated
tap-serverless-pr2695 | 44/71 | 8:00:25 AM | CREATE_IN_PROGRESS   | AWS::Lambda::Function                 | AsyncProcessor (AsyncProcessorA49E4D20) Eventual consistency check initiated
tap-serverless-pr2695 | 44/71 | 8:00:26 AM | CREATE_IN_PROGRESS   | AWS::Lambda::Function                 | ApiHandler (ApiHandler5E7490E8) Eventual consistency check initiated
tap-serverless-pr2695 | 44/71 | 8:00:26 AM | CREATE_IN_PROGRESS   | AWS::Logs::LogGroup                   | event_processorLogGroup (eventprocessorLogGroup9D025730) 
tap-serverless-pr2695 | 44/71 | 8:00:26 AM | CREATE_IN_PROGRESS   | AWS::Events::Rule                     | CustomEventRule (CustomEventRule45BCD3C5) 
tap-serverless-pr2695 | 44/71 | 8:00:26 AM | CREATE_IN_PROGRESS   | AWS::Logs::LogGroup                   | async_processorLogGroup (asyncprocessorLogGroup95FB485B) 
tap-serverless-pr2695 | 44/71 | 8:00:26 AM | CREATE_IN_PROGRESS   | AWS::Logs::LogGroup                   | api_handlerLogGroup (apihandlerLogGroup86D2BA7C) 
tap-serverless-pr2695 | 44/71 | 8:00:26 AM | CREATE_IN_PROGRESS   | AWS::Lambda::Permission               | TapApi/Default/health/GET/ApiPermission.Test.tapserverlesspr2695TapApi74340F7B.GET..health (TapApihealthGETApiPermissionTesttapserverlesspr2695TapApi74340F7BGEThealth4F0CA36C) 
tap-serverless-pr2695 | 44/71 | 8:00:26 AM | CREATE_IN_PROGRESS   | AWS::ApiGateway::Method               | TapApi/Default/ANY (TapApiANYEF213297) 
tap-serverless-pr2695 | 44/71 | 8:00:26 AM | CREATE_IN_PROGRESS   | AWS::Lambda::Permission               | TapApi/Default/data/POST/ApiPermission.Test.tapserverlesspr2695TapApi74340F7B.POST..data (TapApidataPOSTApiPermissionTesttapserverlesspr2695TapApi74340F7BPOSTdata077AC762) 
tap-serverless-pr2695 | 44/71 | 8:00:26 AM | CREATE_IN_PROGRESS   | AWS::ApiGateway::Method               | TapApi/Default/data/POST (TapApidataPOST3898BB61) 
tap-serverless-pr2695 | 44/71 | 8:00:26 AM | CREATE_IN_PROGRESS   | AWS::Lambda::Permission               | TapApi/Default/data/GET/ApiPermission.Test.tapserverlesspr2695TapApi74340F7B.GET..data (TapApidataGETApiPermissionTesttapserverlesspr2695TapApi74340F7BGETdata93CE6B30) 
tap-serverless-pr2695 | 44/71 | 8:00:26 AM | CREATE_IN_PROGRESS   | AWS::ApiGateway::Method               | TapApi/Default/data/GET (TapApidataGET6EA6C63C) 
tap-serverless-pr2695 | 44/71 | 8:00:26 AM | CREATE_IN_PROGRESS   | AWS::Lambda::Permission               | TapApi/Default/ANY/ApiPermission.Test.tapserverlesspr2695TapApi74340F7B.ANY.. (TapApiANYApiPermissionTesttapserverlesspr2695TapApi74340F7BANY10504E3A) 
tap-serverless-pr2695 | 44/71 | 8:00:26 AM | CREATE_IN_PROGRESS   | AWS::ApiGateway::Method               | TapApi/Default/health/GET (TapApihealthGETC9115B6F) 
tap-serverless-pr2695 | 44/71 | 8:00:26 AM | CREATE_IN_PROGRESS   | AWS::Logs::LogGroup                   | event_processorLogGroup (eventprocessorLogGroup9D025730) Resource creation Initiated
tap-serverless-pr2695 | 44/71 | 8:00:27 AM | CREATE_IN_PROGRESS   | AWS::Logs::LogGroup                   | async_processorLogGroup (asyncprocessorLogGroup95FB485B) Resource creation Initiated
tap-serverless-pr2695 | 44/71 | 8:00:27 AM | CREATE_IN_PROGRESS   | AWS::Events::Rule                     | CustomEventRule (CustomEventRule45BCD3C5) Resource creation Initiated
tap-serverless-pr2695 | 44/71 | 8:00:27 AM | CREATE_IN_PROGRESS   | AWS::Logs::LogGroup                   | api_handlerLogGroup (apihandlerLogGroup86D2BA7C) Resource creation Initiated
tap-serverless-pr2695 | 44/71 | 8:00:27 AM | CREATE_IN_PROGRESS   | AWS::ApiGateway::Method               | TapApi/Default/data/GET (TapApidataGET6EA6C63C) Resource creation Initiated
tap-serverless-pr2695 | 44/71 | 8:00:27 AM | CREATE_IN_PROGRESS   | AWS::ApiGateway::Method               | TapApi/Default/data/POST (TapApidataPOST3898BB61) Resource creation Initiated
tap-serverless-pr2695 | 44/71 | 8:00:27 AM | CREATE_IN_PROGRESS   | AWS::Lambda::Permission               | TapApi/Default/health/GET/ApiPermission.Test.tapserverlesspr2695TapApi74340F7B.GET..health (TapApihealthGETApiPermissionTesttapserverlesspr2695TapApi74340F7BGEThealth4F0CA36C) Resource creation Initiated
tap-serverless-pr2695 | 44/71 | 8:00:27 AM | CREATE_IN_PROGRESS   | AWS::ApiGateway::Method               | TapApi/Default/health/GET (TapApihealthGETC9115B6F) Resource creation Initiated
tap-serverless-pr2695 | 44/71 | 8:00:27 AM | CREATE_IN_PROGRESS   | AWS::Lambda::Permission               | TapApi/Default/ANY/ApiPermission.Test.tapserverlesspr2695TapApi74340F7B.ANY.. (TapApiANYApiPermissionTesttapserverlesspr2695TapApi74340F7BANY10504E3A) Resource creation Initiated
tap-serverless-pr2695 | 44/71 | 8:00:27 AM | CREATE_IN_PROGRESS   | AWS::ApiGateway::Method               | TapApi/Default/ANY (TapApiANYEF213297) Resource creation Initiated
tap-serverless-pr2695 | 44/71 | 8:00:27 AM | CREATE_IN_PROGRESS   | AWS::Lambda::Permission               | TapApi/Default/data/POST/ApiPermission.Test.tapserverlesspr2695TapApi74340F7B.POST..data (TapApidataPOSTApiPermissionTesttapserverlesspr2695TapApi74340F7BPOSTdata077AC762) Resource creation Initiated
tap-serverless-pr2695 | 44/71 | 8:00:27 AM | CREATE_IN_PROGRESS   | AWS::Lambda::Permission               | TapApi/Default/data/GET/ApiPermission.Test.tapserverlesspr2695TapApi74340F7B.GET..data (TapApidataGETApiPermissionTesttapserverlesspr2695TapApi74340F7BGETdata93CE6B30) Resource creation Initiated
tap-serverless-pr2695 | 45/71 | 8:00:28 AM | CREATE_COMPLETE      | AWS::Lambda::Permission               | TapApi/Default/health/GET/ApiPermission.Test.tapserverlesspr2695TapApi74340F7B.GET..health (TapApihealthGETApiPermissionTesttapserverlesspr2695TapApi74340F7BGEThealth4F0CA36C) 
tap-serverless-pr2695 | 46/71 | 8:00:28 AM | CREATE_COMPLETE      | AWS::Lambda::Permission               | TapApi/Default/ANY/ApiPermission.Test.tapserverlesspr2695TapApi74340F7B.ANY.. (TapApiANYApiPermissionTesttapserverlesspr2695TapApi74340F7BANY10504E3A) 
tap-serverless-pr2695 | 47/71 | 8:00:28 AM | CREATE_COMPLETE      | AWS::Lambda::Permission               | TapApi/Default/data/POST/ApiPermission.Test.tapserverlesspr2695TapApi74340F7B.POST..data (TapApidataPOSTApiPermissionTesttapserverlesspr2695TapApi74340F7BPOSTdata077AC762) 
tap-serverless-pr2695 | 48/71 | 8:00:28 AM | CREATE_COMPLETE      | AWS::Lambda::Permission               | TapApi/Default/data/GET/ApiPermission.Test.tapserverlesspr2695TapApi74340F7B.GET..data (TapApidataGETApiPermissionTesttapserverlesspr2695TapApi74340F7BGETdata93CE6B30) 
tap-serverless-pr2695 | 49/71 | 8:00:29 AM | CREATE_COMPLETE      | AWS::ApiGateway::Method               | TapApi/Default/data/POST (TapApidataPOST3898BB61) 
tap-serverless-pr2695 | 50/71 | 8:00:29 AM | CREATE_COMPLETE      | AWS::ApiGateway::Method               | TapApi/Default/data/GET (TapApidataGET6EA6C63C) 
tap-serverless-pr2695 | 51/71 | 8:00:29 AM | CREATE_COMPLETE      | AWS::ApiGateway::Method               | TapApi/Default/health/GET (TapApihealthGETC9115B6F) 
tap-serverless-pr2695 | 52/71 | 8:00:29 AM | CREATE_COMPLETE      | AWS::ApiGateway::Method               | TapApi/Default/ANY (TapApiANYEF213297) 
tap-serverless-pr2695 | 52/71 | 8:00:35 AM | CREATE_IN_PROGRESS   | AWS::Logs::LogGroup                   | async_processorLogGroup (asyncprocessorLogGroup95FB485B) Eventual consistency check initiated
tap-serverless-pr2695 | 52/71 | 8:00:35 AM | CREATE_IN_PROGRESS   | AWS::Logs::LogGroup                   | event_processorLogGroup (eventprocessorLogGroup9D025730) Eventual consistency check initiated
tap-serverless-pr2695 | 52/71 | 8:00:36 AM | CREATE_IN_PROGRESS   | AWS::Logs::LogGroup                   | api_handlerLogGroup (apihandlerLogGroup86D2BA7C) Eventual consistency check initiated
tap-serverless-pr2695 | 53/71 | 8:00:36 AM | CREATE_COMPLETE      | AWS::Logs::LogGroup                   | event_processorLogGroup (eventprocessorLogGroup9D025730) 
tap-serverless-pr2695 | 54/71 | 8:00:36 AM | CREATE_COMPLETE      | AWS::Logs::LogGroup                   | async_processorLogGroup (asyncprocessorLogGroup95FB485B) 
tap-serverless-pr2695 | 55/71 | 8:00:36 AM | CREATE_COMPLETE      | AWS::Logs::LogGroup                   | api_handlerLogGroup (apihandlerLogGroup86D2BA7C) 
tap-serverless-pr2695 | 56/71 | 8:01:28 AM | CREATE_COMPLETE      | AWS::Events::Rule                     | CustomEventRule (CustomEventRule45BCD3C5) 
tap-serverless-pr2695 | 56/71 | 8:01:29 AM | CREATE_IN_PROGRESS   | AWS::Lambda::Permission               | CustomEventRule/AllowEventRuletapserverlesspr2695EventProcessorCE808E4B (CustomEventRuleAllowEventRuletapserverlesspr2695EventProcessorCE808E4B38477DE5) 
tap-serverless-pr2695 | 56/71 | 8:01:30 AM | CREATE_IN_PROGRESS   | AWS::Lambda::Permission               | CustomEventRule/AllowEventRuletapserverlesspr2695EventProcessorCE808E4B (CustomEventRuleAllowEventRuletapserverlesspr2695EventProcessorCE808E4B38477DE5) Resource creation Initiated
tap-serverless-pr2695 | 57/71 | 8:01:30 AM | CREATE_COMPLETE      | AWS::Lambda::Permission               | CustomEventRule/AllowEventRuletapserverlesspr2695EventProcessorCE808E4B (CustomEventRuleAllowEventRuletapserverlesspr2695EventProcessorCE808E4B38477DE5) 
tap-serverless-pr2695 | 58/71 | 8:04:03 AM | CREATE_COMPLETE      | AWS::Lambda::Function                 | EventProcessor (EventProcessorD4153CB5) 
tap-serverless-pr2695 | 58/71 | 8:04:03 AM | CREATE_IN_PROGRESS   | AWS::Logs::LogGroup                   | EventProcessor/LogGroup (EventProcessorLogGroup3C19E083) 
tap-serverless-pr2695 | 59/71 | 8:04:04 AM | CREATE_COMPLETE      | AWS::Lambda::Function                 | AsyncProcessor (AsyncProcessorA49E4D20) 
tap-serverless-pr2695 | 59/71 | 8:04:04 AM | CREATE_FAILED        | AWS::Logs::LogGroup                   | EventProcessor/LogGroup (EventProcessorLogGroup3C19E083) /aws/lambda/tap-serverless-pr2695-event-processor already exists in stack arn:aws:cloudformation:us-east-1:***:stack/tap-serverless-pr2695/d3e21770-8964-11f0-a4fe-0affde17201b
tap-serverless-pr2695 | 59/71 | 8:04:04 AM | CREATE_FAILED        | AWS::Lambda::Function                 | ApiHandler (ApiHandler5E7490E8) Resource creation cancelled
tap-serverless-pr2695 | 59/71 | 8:04:06 AM | ROLLBACK_IN_PROGRESS | AWS::CloudFormation::Stack            | tap-serverless-pr2695 The following resource(s) failed to create: [ApiHandler5E7490E8, EventProcessorLogGroup3C19E083]. Rollback requested by user.
tap-serverless-pr2695 | 59/71 | 8:04:08 AM | DELETE_IN_PROGRESS   | AWS::Logs::LogGroup                   | api_handlerLogGroup (apihandlerLogGroup86D2BA7C) 
tap-serverless-pr2695 | 59/71 | 8:04:08 AM | DELETE_IN_PROGRESS   | AWS::Logs::LogGroup                   | async_processorLogGroup (asyncprocessorLogGroup95FB485B) 
tap-serverless-pr2695 | 59/71 | 8:04:08 AM | DELETE_IN_PROGRESS   | AWS::ApiGateway::Method               | TapApi/Default/health/GET (TapApihealthGETC9115B6F) 
tap-serverless-pr2695 | 59/71 | 8:04:08 AM | DELETE_IN_PROGRESS   | AWS::EC2::VPCEndpoint                 | TapVpc/DynamoDbEndpoint (TapVpcDynamoDbEndpoint23258B7F) 
tap-serverless-pr2695 | 59/71 | 8:04:08 AM | DELETE_IN_PROGRESS   | AWS::Lambda::Permission               | TapApi/Default/data/GET/ApiPermission.Test.tapserverlesspr2695TapApi74340F7B.GET..data (TapApidataGETApiPermissionTesttapserverlesspr2695TapApi74340F7BGETdata93CE6B30) 
tap-serverless-pr2695 | 59/71 | 8:04:08 AM | DELETE_IN_PROGRESS   | AWS::ApiGateway::Method               | TapApi/Default/data/POST (TapApidataPOST3898BB61) 
tap-serverless-pr2695 | 59/71 | 8:04:08 AM | DELETE_IN_PROGRESS   | AWS::ApiGateway::Method               | TapApi/Default/data/GET (TapApidataGET6EA6C63C) 
tap-serverless-pr2695 | 59/71 | 8:04:08 AM | DELETE_IN_PROGRESS   | AWS::ApiGateway::Method               | TapApi/Default/data/OPTIONS (TapApidataOPTIONS8AC2AAB1) 
tap-serverless-pr2695 | 59/71 | 8:04:08 AM | DELETE_IN_PROGRESS   | AWS::ApiGateway::Method               | TapApi/Default/OPTIONS (TapApiOPTIONSB94F68C8) 
tap-serverless-pr2695 | 59/71 | 8:04:08 AM | DELETE_IN_PROGRESS   | AWS::ApiGateway::Method               | TapApi/Default/health/OPTIONS (TapApihealthOPTIONS79896050) 
tap-serverless-pr2695 | 59/71 | 8:04:08 AM | DELETE_IN_PROGRESS   | AWS::ApiGateway::Method               | TapApi/Default/ANY (TapApiANYEF213297) 
tap-serverless-pr2695 | 59/71 | 8:04:08 AM | DELETE_IN_PROGRESS   | AWS::Lambda::Permission               | TapApi/Default/ANY/ApiPermission.Test.tapserverlesspr2695TapApi74340F7B.ANY.. (TapApiANYApiPermissionTesttapserverlesspr2695TapApi74340F7BANY10504E3A) 
tap-serverless-pr2695 | 59/71 | 8:04:08 AM | DELETE_IN_PROGRESS   | Custom::VpcRestrictDefaultSG          | TapVpc/RestrictDefaultSecurityGroupCustomResource/Default (TapVpcRestrictDefaultSecurityGroupCustomResource2332DAD5) 
tap-serverless-pr2695 | 59/71 | 8:04:08 AM | DELETE_IN_PROGRESS   | AWS::Lambda::Permission               | TapApi/Default/data/POST/ApiPermission.Test.tapserverlesspr2695TapApi74340F7B.POST..data (TapApidataPOSTApiPermissionTesttapserverlesspr2695TapApi74340F7BPOSTdata077AC762) 
tap-serverless-pr2695 | 59/71 | 8:04:08 AM | DELETE_IN_PROGRESS   | AWS::Logs::LogGroup                   | event_processorLogGroup (eventprocessorLogGroup9D025730) 
tap-serverless-pr2695 | 59/71 | 8:04:08 AM | DELETE_IN_PROGRESS   | AWS::Lambda::Permission               | TapApi/Default/health/GET/ApiPermission.Test.tapserverlesspr2695TapApi74340F7B.GET..health (TapApihealthGETApiPermissionTesttapserverlesspr2695TapApi74340F7BGEThealth4F0CA36C) 
tap-serverless-pr2695 | 59/71 | 8:04:08 AM | DELETE_IN_PROGRESS   | AWS::Lambda::Permission               | CustomEventRule/AllowEventRuletapserverlesspr2695EventProcessorCE808E4B (CustomEventRuleAllowEventRuletapserverlesspr2695EventProcessorCE808E4B38477DE5) 
tap-serverless-pr2695 | 59/71 | 8:04:08 AM | DELETE_IN_PROGRESS   | AWS::EC2::VPCEndpoint                 | TapVpc/S3Endpoint (TapVpcS3Endpoint3CA67D81) 
tap-serverless-pr2695 | 59/71 | 8:04:08 AM | DELETE_IN_PROGRESS   | AWS::CDK::Metadata                    | CDKMetadata/Default (CDKMetadata) 
tap-serverless-pr2695 | 59/71 | 8:04:08 AM | DELETE_SKIPPED       | AWS::Logs::LogGroup                   | EventProcessor/LogGroup (EventProcessorLogGroup3C19E083) 
tap-serverless-pr2695 | 58/71 | 8:04:09 AM | DELETE_COMPLETE      | AWS::ApiGateway::Method               | TapApi/Default/data/POST (TapApidataPOST3898BB61) 
tap-serverless-pr2695 | 57/71 | 8:04:09 AM | DELETE_COMPLETE      | AWS::Logs::LogGroup                   | async_processorLogGroup (asyncprocessorLogGroup95FB485B) 
tap-serverless-pr2695 | 56/71 | 8:04:09 AM | DELETE_COMPLETE      | AWS::Logs::LogGroup                   | api_handlerLogGroup (apihandlerLogGroup86D2BA7C) 
tap-serverless-pr2695 | 55/71 | 8:04:09 AM | DELETE_COMPLETE      | AWS::ApiGateway::Method               | TapApi/Default/health/GET (TapApihealthGETC9115B6F) 
tap-serverless-pr2695 | 54/71 | 8:04:09 AM | DELETE_COMPLETE      | AWS::ApiGateway::Method               | TapApi/Default/ANY (TapApiANYEF213297) 
tap-serverless-pr2695 | 53/71 | 8:04:09 AM | DELETE_COMPLETE      | AWS::Logs::LogGroup                   | event_processorLogGroup (eventprocessorLogGroup9D025730) 
tap-serverless-pr2695 | 52/71 | 8:04:09 AM | DELETE_COMPLETE      | AWS::Lambda::Permission               | TapApi/Default/ANY/ApiPermission.Test.tapserverlesspr2695TapApi74340F7B.ANY.. (TapApiANYApiPermissionTesttapserverlesspr2695TapApi74340F7BANY10504E3A) 
tap-serverless-pr2695 | 51/71 | 8:04:09 AM | DELETE_COMPLETE      | AWS::ApiGateway::Method               | TapApi/Default/data/OPTIONS (TapApidataOPTIONS8AC2AAB1) 
tap-serverless-pr2695 | 50/71 | 8:04:09 AM | DELETE_COMPLETE      | AWS::ApiGateway::Method               | TapApi/Default/OPTIONS (TapApiOPTIONSB94F68C8) 
tap-serverless-pr2695 | 49/71 | 8:04:09 AM | DELETE_COMPLETE      | AWS::ApiGateway::Method               | TapApi/Default/health/OPTIONS (TapApihealthOPTIONS79896050) 
tap-serverless-pr2695 | 48/71 | 8:04:09 AM | DELETE_COMPLETE      | AWS::Lambda::Permission               | TapApi/Default/data/GET/ApiPermission.Test.tapserverlesspr2695TapApi74340F7B.GET..data (TapApidataGETApiPermissionTesttapserverlesspr2695TapApi74340F7BGETdata93CE6B30) 
tap-serverless-pr2695 | 47/71 | 8:04:09 AM | DELETE_COMPLETE      | AWS::Lambda::Permission               | CustomEventRule/AllowEventRuletapserverlesspr2695EventProcessorCE808E4B (CustomEventRuleAllowEventRuletapserverlesspr2695EventProcessorCE808E4B38477DE5) 
tap-serverless-pr2695 | 46/71 | 8:04:09 AM | DELETE_COMPLETE      | AWS::ApiGateway::Method               | TapApi/Default/data/GET (TapApidataGET6EA6C63C) 
tap-serverless-pr2695 | 45/71 | 8:04:09 AM | DELETE_COMPLETE      | AWS::CDK::Metadata                    | CDKMetadata/Default (CDKMetadata) 
tap-serverless-pr2695 | 44/71 | 8:04:09 AM | DELETE_COMPLETE      | AWS::Lambda::Permission               | TapApi/Default/health/GET/ApiPermission.Test.tapserverlesspr2695TapApi74340F7B.GET..health (TapApihealthGETApiPermissionTesttapserverlesspr2695TapApi74340F7BGEThealth4F0CA36C) 
tap-serverless-pr2695 | 44/71 | 8:04:09 AM | DELETE_IN_PROGRESS   | AWS::Lambda::Function                 | AsyncProcessor (AsyncProcessorA49E4D20) 
tap-serverless-pr2695 | 43/71 | 8:04:09 AM | DELETE_COMPLETE      | AWS::Lambda::Permission               | TapApi/Default/data/POST/ApiPermission.Test.tapserverlesspr2695TapApi74340F7B.POST..data (TapApidataPOSTApiPermissionTesttapserverlesspr2695TapApi74340F7BPOSTdata077AC762) 
tap-serverless-pr2695 | 42/71 | 8:04:09 AM | DELETE_COMPLETE      | AWS::EC2::VPCEndpoint                 | TapVpc/S3Endpoint (TapVpcS3Endpoint3CA67D81) 
tap-serverless-pr2695 | 42/71 | 8:04:09 AM | DELETE_IN_PROGRESS   | AWS::ApiGateway::Resource             | TapApi/Default/health (TapApihealth220A0B30) 
tap-serverless-pr2695 | 42/71 | 8:04:09 AM | DELETE_IN_PROGRESS   | AWS::Events::Rule                     | CustomEventRule (CustomEventRule45BCD3C5) 
tap-serverless-pr2695 | 42/71 | 8:04:10 AM | DELETE_IN_PROGRESS   | AWS::ApiGateway::Resource             | TapApi/Default/data (TapApidataDBF2509A) 
tap-serverless-pr2695 | 41/71 | 8:04:10 AM | DELETE_COMPLETE      | AWS::EC2::VPCEndpoint                 | TapVpc/DynamoDbEndpoint (TapVpcDynamoDbEndpoint23258B7F) 
tap-serverless-pr2695 | 41/71 | 8:04:10 AM | DELETE_IN_PROGRESS   | AWS::Lambda::Function                 | ApiHandler (ApiHandler5E7490E8) 
tap-serverless-pr2695 | 40/71 | 8:04:10 AM | DELETE_COMPLETE      | AWS::ApiGateway::Resource             | TapApi/Default/health (TapApihealth220A0B30) 
tap-serverless-pr2695 | 39/71 | 8:04:11 AM | DELETE_COMPLETE      | AWS::ApiGateway::Resource             | TapApi/Default/data (TapApidataDBF2509A) 
tap-serverless-pr2695 | 39/71 | 8:04:11 AM | DELETE_IN_PROGRESS   | AWS::ApiGateway::RestApi              | TapApi (TapApiB09BF2B2) 
tap-serverless-pr2695 | 38/71 | 8:04:11 AM | DELETE_COMPLETE      | Custom::VpcRestrictDefaultSG          | TapVpc/RestrictDefaultSecurityGroupCustomResource/Default (TapVpcRestrictDefaultSecurityGroupCustomResource2332DAD5) 
tap-serverless-pr2695 | 38/71 | 8:04:11 AM | DELETE_IN_PROGRESS   | AWS::Lambda::Function                 | Custom::VpcRestrictDefaultSGCustomResourceProvider/Handler (CustomVpcRestrictDefaultSGCustomResourceProviderHandlerDC833E5E) 
tap-serverless-pr2695 | 37/71 | 8:04:12 AM | DELETE_COMPLETE      | AWS::ApiGateway::RestApi              | TapApi (TapApiB09BF2B2) 
tap-serverless-pr2695 | 36/71 | 8:04:15 AM | DELETE_COMPLETE      | AWS::Lambda::Function                 | Custom::VpcRestrictDefaultSGCustomResourceProvider/Handler (CustomVpcRestrictDefaultSGCustomResourceProviderHandlerDC833E5E) 
tap-serverless-pr2695 | 36/71 | 8:04:16 AM | DELETE_IN_PROGRESS   | AWS::IAM::Role                        | Custom::VpcRestrictDefaultSGCustomResourceProvider/Role (CustomVpcRestrictDefaultSGCustomResourceProviderRole26592FE0) 
tap-serverless-pr2695 | 35/71 | 8:04:18 AM | DELETE_COMPLETE      | AWS::Lambda::Function                 | AsyncProcessor (AsyncProcessorA49E4D20) 
tap-serverless-pr2695 | 34/71 | 8:04:28 AM | DELETE_COMPLETE      | AWS::IAM::Role                        | Custom::VpcRestrictDefaultSGCustomResourceProvider/Role (CustomVpcRestrictDefaultSGCustomResourceProviderRole26592FE0) 
tap-serverless-pr2695 | 33/71 | 8:04:41 AM | DELETE_COMPLETE      | AWS::Events::Rule                     | CustomEventRule (CustomEventRule45BCD3C5) 
tap-serverless-pr2695 | 33/71 | 8:04:41 AM | DELETE_IN_PROGRESS   | AWS::Lambda::Function                 | EventProcessor (EventProcessorD4153CB5) 
tap-serverless-pr2695 | 32/71 | 8:05:54 AM | DELETE_COMPLETE      | AWS::Lambda::Function                 | EventProcessor (EventProcessorD4153CB5) 
tap-serverless-pr2695 | 33/71 | 8:05:54 AM | DELETE_COMPLETE      | AWS::Lambda::Function                 | ApiHandler (ApiHandler5E7490E8) 
tap-serverless-pr2695 | 33/71 | 8:05:54 AM | DELETE_IN_PROGRESS   | AWS::EC2::SubnetRouteTableAssociation | TapVpc/privateSubnet1/RouteTableAssociation (TapVpcprivateSubnet1RouteTableAssociationEA1E1697) 
tap-serverless-pr2695 | 33/71 | 8:05:54 AM | DELETE_IN_PROGRESS   | AWS::EC2::SecurityGroup               | LambdaSecurityGroup (LambdaSecurityGroup0BD9FC99) 
tap-serverless-pr2695 | 33/71 | 8:05:54 AM | DELETE_IN_PROGRESS   | AWS::EC2::Route                       | TapVpc/privateSubnet1/DefaultRoute (TapVpcprivateSubnet1DefaultRoute91B7C4A1) 
tap-serverless-pr2695 | 33/71 | 8:05:54 AM | DELETE_IN_PROGRESS   | AWS::EC2::SubnetRouteTableAssociation | TapVpc/privateSubnet2/RouteTableAssociation (TapVpcprivateSubnet2RouteTableAssociationFA4D2A75) 
tap-serverless-pr2695 | 33/71 | 8:05:54 AM | DELETE_IN_PROGRESS   | AWS::EC2::Route                       | TapVpc/privateSubnet2/DefaultRoute (TapVpcprivateSubnet2DefaultRoute64DBAF67) 
tap-serverless-pr2695 | 33/71 | 8:05:54 AM | DELETE_IN_PROGRESS   | AWS::IAM::Policy                      | LambdaExecutionRole/DefaultPolicy (LambdaExecutionRoleDefaultPolicy6D69732F) 
tap-serverless-pr2695 | 32/71 | 8:05:55 AM | DELETE_COMPLETE      | AWS::IAM::Policy                      | LambdaExecutionRole/DefaultPolicy (LambdaExecutionRoleDefaultPolicy6D69732F) 
tap-serverless-pr2695 | 31/71 | 8:05:56 AM | DELETE_COMPLETE      | AWS::EC2::SecurityGroup               | LambdaSecurityGroup (LambdaSecurityGroup0BD9FC99) 
tap-serverless-pr2695 | 30/71 | 8:05:56 AM | DELETE_COMPLETE      | AWS::EC2::Route                       | TapVpc/privateSubnet1/DefaultRoute (TapVpcprivateSubnet1DefaultRoute91B7C4A1) 
tap-serverless-pr2695 | 29/71 | 8:05:56 AM | DELETE_COMPLETE      | AWS::EC2::Route                       | TapVpc/privateSubnet2/DefaultRoute (TapVpcprivateSubnet2DefaultRoute64DBAF67) 
tap-serverless-pr2695 | 29/71 | 8:05:56 AM | DELETE_IN_PROGRESS   | AWS::IAM::Role                        | LambdaExecutionRole (LambdaExecutionRoleD5C26073) 
tap-serverless-pr2695 | 29/71 | 8:05:56 AM | DELETE_IN_PROGRESS   | AWS::SQS::Queue                       | TapQueue (TapQueueC7392422) 
tap-serverless-pr2695 | 29/71 | 8:05:56 AM | DELETE_IN_PROGRESS   | AWS::Events::EventBus                 | TapEventBus (TapEventBus81D3F9DA) 
tap-serverless-pr2695 | 29/71 | 8:05:56 AM | DELETE_SKIPPED       | AWS::DynamoDB::Table                  | TapTable (TapTable1BC71E11) 
tap-serverless-pr2695 | 29/71 | 8:05:56 AM | DELETE_SKIPPED       | AWS::S3::Bucket                       | TapLogsBucket (TapLogsBucketB5189C7B) 
tap-serverless-pr2695 | 29/71 | 8:05:56 AM | DELETE_SKIPPED       | AWS::S3::Bucket                       | TapDataBucket (TapDataBucket9D019609) 
tap-serverless-pr2695 | 29/71 | 8:05:56 AM | DELETE_IN_PROGRESS   | AWS::EC2::NatGateway                  | TapVpc/publicSubnet2/NATGateway (TapVpcpublicSubnet2NATGatewayF04294B4) 
tap-serverless-pr2695 | 29/71 | 8:05:56 AM | DELETE_IN_PROGRESS   | AWS::EC2::NatGateway                  | TapVpc/publicSubnet1/NATGateway (TapVpcpublicSubnet1NATGateway6462C64F) 
tap-serverless-pr2695 | 28/71 | 8:05:57 AM | DELETE_COMPLETE      | AWS::Events::EventBus                 | TapEventBus (TapEventBus81D3F9DA) 
tap-serverless-pr2695 | 27/71 | 8:06:06 AM | DELETE_COMPLETE      | AWS::IAM::Role                        | LambdaExecutionRole (LambdaExecutionRoleD5C26073) 
tap-serverless-pr2695 | 26/71 | 8:06:11 AM | DELETE_COMPLETE      | AWS::EC2::SubnetRouteTableAssociation | TapVpc/privateSubnet1/RouteTableAssociation (TapVpcprivateSubnet1RouteTableAssociationEA1E1697) 
tap-serverless-pr2695 | 26/71 | 8:06:11 AM | DELETE_IN_PROGRESS   | AWS::EC2::Subnet                      | TapVpc/privateSubnet1/Subnet (TapVpcprivateSubnet1Subnet12EE2EB8) 
tap-serverless-pr2695 | 26/71 | 8:06:11 AM | DELETE_IN_PROGRESS   | AWS::EC2::RouteTable                  | TapVpc/privateSubnet1/RouteTable (TapVpcprivateSubnet1RouteTable262C1F9D) 
tap-serverless-pr2695 | 25/71 | 8:06:12 AM | DELETE_COMPLETE      | AWS::EC2::RouteTable                  | TapVpc/privateSubnet1/RouteTable (TapVpcprivateSubnet1RouteTable262C1F9D) 
tap-serverless-pr2695 | 24/71 | 8:06:12 AM | DELETE_COMPLETE      | AWS::EC2::Subnet                      | TapVpc/privateSubnet1/Subnet (TapVpcprivateSubnet1Subnet12EE2EB8) 
tap-serverless-pr2695 | 23/71 | 8:06:21 AM | DELETE_COMPLETE      | AWS::EC2::SubnetRouteTableAssociation | TapVpc/privateSubnet2/RouteTableAssociation (TapVpcprivateSubnet2RouteTableAssociationFA4D2A75) 
tap-serverless-pr2695 | 23/71 | 8:06:21 AM | DELETE_IN_PROGRESS   | AWS::EC2::RouteTable                  | TapVpc/privateSubnet2/RouteTable (TapVpcprivateSubnet2RouteTable89F7D7BF) 
tap-serverless-pr2695 | 23/71 | 8:06:21 AM | DELETE_IN_PROGRESS   | AWS::EC2::Subnet                      | TapVpc/privateSubnet2/Subnet (TapVpcprivateSubnet2SubnetF743A890) 
tap-serverless-pr2695 | 22/71 | 8:06:23 AM | DELETE_COMPLETE      | AWS::EC2::RouteTable                  | TapVpc/privateSubnet2/RouteTable (TapVpcprivateSubnet2RouteTable89F7D7BF) 
tap-serverless-pr2695 | 21/71 | 8:06:23 AM | DELETE_COMPLETE      | AWS::EC2::Subnet                      | TapVpc/privateSubnet2/Subnet (TapVpcprivateSubnet2SubnetF743A890) 
tap-serverless-pr2695 | 20/71 | 8:06:27 AM | DELETE_COMPLETE      | AWS::SQS::Queue                       | TapQueue (TapQueueC7392422) 
tap-serverless-pr2695 | 20/71 | 8:06:27 AM | DELETE_IN_PROGRESS   | AWS::SQS::Queue                       | TapDLQ (TapDLQ73E7E7BC) 
tap-serverless-pr2695 | 19/71 | 8:06:44 AM | DELETE_COMPLETE      | AWS::EC2::NatGateway                  | TapVpc/publicSubnet1/NATGateway (TapVpcpublicSubnet1NATGateway6462C64F) 
tap-serverless-pr2695 | 19/71 | 8:06:45 AM | DELETE_IN_PROGRESS   | AWS::EC2::SubnetRouteTableAssociation | TapVpc/publicSubnet1/RouteTableAssociation (TapVpcpublicSubnet1RouteTableAssociation845CF324) 
tap-serverless-pr2695 | 19/71 | 8:06:45 AM | DELETE_IN_PROGRESS   | AWS::EC2::EIP                         | TapVpc/publicSubnet1/EIP (TapVpcpublicSubnet1EIP45C8CEBC) 
tap-serverless-pr2695 | 19/71 | 8:06:45 AM | DELETE_IN_PROGRESS   | AWS::EC2::Route                       | TapVpc/publicSubnet1/DefaultRoute (TapVpcpublicSubnet1DefaultRouteF9DDCC94) 
tap-serverless-pr2695 | 18/71 | 8:06:46 AM | DELETE_COMPLETE      | AWS::EC2::Route                       | TapVpc/publicSubnet1/DefaultRoute (TapVpcpublicSubnet1DefaultRouteF9DDCC94) 
tap-serverless-pr2695 | 17/71 | 8:06:46 AM | DELETE_COMPLETE      | AWS::EC2::EIP                         | TapVpc/publicSubnet1/EIP (TapVpcpublicSubnet1EIP45C8CEBC) 
tap-serverless-pr2695 | 16/71 | 8:06:58 AM | DELETE_COMPLETE      | AWS::SQS::Queue                       | TapDLQ (TapDLQ73E7E7BC) 
tap-serverless-pr2695 | 15/71 | 8:07:00 AM | DELETE_COMPLETE      | AWS::EC2::NatGateway                  | TapVpc/publicSubnet2/NATGateway (TapVpcpublicSubnet2NATGatewayF04294B4) 
tap-serverless-pr2695 | 15/71 | 8:07:00 AM | DELETE_IN_PROGRESS   | AWS::EC2::Route                       | TapVpc/publicSubnet2/DefaultRoute (TapVpcpublicSubnet2DefaultRouteE0B90472) 
tap-serverless-pr2695 | 15/71 | 8:07:00 AM | DELETE_IN_PROGRESS   | AWS::EC2::EIP                         | TapVpc/publicSubnet2/EIP (TapVpcpublicSubnet2EIP15B6A591) 
tap-serverless-pr2695 | 15/71 | 8:07:00 AM | DELETE_IN_PROGRESS   | AWS::EC2::SubnetRouteTableAssociation | TapVpc/publicSubnet2/RouteTableAssociation (TapVpcpublicSubnet2RouteTableAssociation6746B76F) 
tap-serverless-pr2695 | 14/71 | 8:07:01 AM | DELETE_COMPLETE      | AWS::EC2::SubnetRouteTableAssociation | TapVpc/publicSubnet1/RouteTableAssociation (TapVpcpublicSubnet1RouteTableAssociation845CF324) 
tap-serverless-pr2695 | 14/71 | 8:07:01 AM | DELETE_IN_PROGRESS   | AWS::EC2::Subnet                      | TapVpc/publicSubnet1/Subnet (TapVpcpublicSubnet1Subnet4F8D84E8) 
tap-serverless-pr2695 | 13/71 | 8:07:02 AM | DELETE_COMPLETE      | AWS::EC2::Route                       | TapVpc/publicSubnet2/DefaultRoute (TapVpcpublicSubnet2DefaultRouteE0B90472) 
tap-serverless-pr2695 | 13/71 | 8:07:02 AM | DELETE_IN_PROGRESS   | AWS::EC2::RouteTable                  | TapVpc/publicSubnet1/RouteTable (TapVpcpublicSubnet1RouteTable9186A90D) 
tap-serverless-pr2695 | 12/71 | 8:07:02 AM | DELETE_COMPLETE      | AWS::EC2::EIP                         | TapVpc/publicSubnet2/EIP (TapVpcpublicSubnet2EIP15B6A591) 
tap-serverless-pr2695 | 12/71 | 8:07:02 AM | DELETE_IN_PROGRESS   | AWS::EC2::VPCGatewayAttachment        | TapVpc/VPCGW (TapVpcVPCGWDFDBCCBD) 
tap-serverless-pr2695 | 11/71 | 8:07:03 AM | DELETE_COMPLETE      | AWS::EC2::RouteTable                  | TapVpc/publicSubnet1/RouteTable (TapVpcpublicSubnet1RouteTable9186A90D) 
tap-serverless-pr2695 | 10/71 | 8:07:03 AM | DELETE_COMPLETE      | AWS::EC2::Subnet                      | TapVpc/publicSubnet1/Subnet (TapVpcpublicSubnet1Subnet4F8D84E8) 
tap-serverless-pr2695 |  9/71 | 8:07:03 AM | DELETE_COMPLETE      | AWS::EC2::VPCGatewayAttachment        | TapVpc/VPCGW (TapVpcVPCGWDFDBCCBD) 
tap-serverless-pr2695 |  9/71 | 8:07:04 AM | DELETE_IN_PROGRESS   | AWS::EC2::InternetGateway             | TapVpc/IGW (TapVpcIGWD6C67C56) 
tap-serverless-pr2695 |  8/71 | 8:07:05 AM | DELETE_COMPLETE      | AWS::EC2::InternetGateway             | TapVpc/IGW (TapVpcIGWD6C67C56) 
tap-serverless-pr2695 |  7/71 | 8:07:17 AM | DELETE_COMPLETE      | AWS::EC2::SubnetRouteTableAssociation | TapVpc/publicSubnet2/RouteTableAssociation (TapVpcpublicSubnet2RouteTableAssociation6746B76F) 
tap-serverless-pr2695 |  7/71 | 8:07:17 AM | DELETE_IN_PROGRESS   | AWS::EC2::RouteTable                  | TapVpc/publicSubnet2/RouteTable (TapVpcpublicSubnet2RouteTable454CFF68) 
tap-serverless-pr2695 |  7/71 | 8:07:17 AM | DELETE_IN_PROGRESS   | AWS::EC2::Subnet                      | TapVpc/publicSubnet2/Subnet (TapVpcpublicSubnet2Subnet9CE016D7) 
tap-serverless-pr2695 |  6/71 | 8:07:18 AM | DELETE_COMPLETE      | AWS::EC2::RouteTable                  | TapVpc/publicSubnet2/RouteTable (TapVpcpublicSubnet2RouteTable454CFF68) 
tap-serverless-pr2695 |  5/71 | 8:07:19 AM | DELETE_COMPLETE      | AWS::EC2::Subnet                      | TapVpc/publicSubnet2/Subnet (TapVpcpublicSubnet2Subnet9CE016D7) 
tap-serverless-pr2695 |  5/71 | 8:07:19 AM | DELETE_IN_PROGRESS   | AWS::EC2::VPC                         | TapVpc (TapVpc8B8CDDDF) 
tap-serverless-pr2695 |  4/71 | 8:07:21 AM | DELETE_COMPLETE      | AWS::EC2::VPC                         | TapVpc (TapVpc8B8CDDDF) 
tap-serverless-pr2695 |  5/71 | 8:07:21 AM | ROLLBACK_COMPLETE    | AWS::CloudFormation::Stack            | tap-serverless-pr2695 

Failed resources:
tap-serverless-pr2695 | 8:04:04 AM | CREATE_FAILED        | AWS::Logs::LogGroup                   | EventProcessor/LogGroup (EventProcessorLogGroup3C19E083) /aws/lambda/tap-serverless-pr2695-event-processor already exists in stack arn:aws:cloudformation:us-east-1:***:stack/tap-serverless-pr2695/d3e21770-8964-11f0-a4fe-0affde17201b

NOTICES         (What's this? https://github.com/aws/aws-cdk/wiki/CLI-Notices)

34892	CDK CLI will collect telemetry data on command usage starting at version 2.1100.0 (unless opted out)

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

Fix it.