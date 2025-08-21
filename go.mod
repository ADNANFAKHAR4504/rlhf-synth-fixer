module github.com/TuringGpt/iac-test-automations

go 1.23.12

require (
	github.com/hashicorp/terraform-cdk-go/cdktf v0.21.0
)

replace (
	github.com/TuringGpt/iac-test-automations/aws/provider => ./.gen/aws/provider
	github.com/TuringGpt/iac-test-automations/aws/cloudwatchloggroup => ./.gen/aws/cloudwatchloggroup
	github.com/TuringGpt/iac-test-automations/aws/iampolicy => ./.gen/aws/iampolicy
	github.com/TuringGpt/iac-test-automations/aws/iamrole => ./.gen/aws/iamrole
	github.com/TuringGpt/iac-test-automations/aws/iamrolepolicyattachment => ./.gen/aws/iamrolepolicyattachment
	github.com/TuringGpt/iac-test-automations/aws/lambdafunction => ./.gen/aws/lambdafunction
	github.com/TuringGpt/iac-test-automations/aws/lambdapermission => ./.gen/aws/lambdapermission
	github.com/TuringGpt/iac-test-automations/aws/s3bucket => ./.gen/aws/s3bucket
	github.com/TuringGpt/iac-test-automations/aws/s3bucketnotification => ./.gen/aws/s3bucketnotification
	github.com/TuringGpt/iac-test-automations/aws/s3bucketpublicaccessblock => ./.gen/aws/s3bucketpublicaccessblock
	github.com/TuringGpt/iac-test-automations/aws/s3bucketserversideencryptionconfiguration => ./.gen/aws/s3bucketserversideencryptionconfiguration
	github.com/TuringGpt/iac-test-automations/aws/s3bucketversioning => ./.gen/aws/s3bucketversioning
)
