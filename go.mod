module github.com/TuringGpt/iac-test-automations

go 1.23.12

require (
	github.com/hashicorp/terraform-cdk-go/cdktf v0.21.0
)

replace (
	github.com/TuringGpt/iac-test-automations/aws/provider => ./.gen/providers/aws/provider
	github.com/TuringGpt/iac-test-automations/aws/cloudwatchloggroup => ./.gen/providers/aws/cloudwatchloggroup
	github.com/TuringGpt/iac-test-automations/aws/iampolicy => ./.gen/providers/aws/iampolicy
	github.com/TuringGpt/iac-test-automations/aws/iamrole => ./.gen/providers/aws/iamrole
	github.com/TuringGpt/iac-test-automations/aws/iamrolepolicyattachment => ./.gen/providers/aws/iamrolepolicyattachment
	github.com/TuringGpt/iac-test-automations/aws/lambdafunction => ./.gen/providers/aws/lambdafunction
	github.com/TuringGpt/iac-test-automations/aws/lambdapermission => ./.gen/providers/aws/lambdapermission
	github.com/TuringGpt/iac-test-automations/aws/s3bucket => ./.gen/providers/aws/s3bucket
	github.com/TuringGpt/iac-test-automations/aws/s3bucketnotification => ./.gen/providers/aws/s3bucketnotification
	github.com/TuringGpt/iac-test-automations/aws/s3bucketpublicaccessblock => ./.gen/providers/aws/s3bucketpublicaccessblock
	github.com/TuringGpt/iac-test-automations/aws/s3bucketserversideencryptionconfiguration => ./.gen/providers/aws/s3bucketserversideencryptionconfiguration
	github.com/TuringGpt/iac-test-automations/aws/s3bucketversioning => ./.gen/providers/aws/s3bucketversioning
)
