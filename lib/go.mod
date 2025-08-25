module cdk.tf/go/stack

go 1.23

require (
	cdk.tf/go/stack/generated/aws/cloudwatchloggroup v0.0.0-00010101000000-000000000000
	cdk.tf/go/stack/generated/aws/flowlog v0.0.0-00010101000000-000000000000
	cdk.tf/go/stack/generated/aws/iampolicy v0.0.0-00010101000000-000000000000
	cdk.tf/go/stack/generated/aws/iamrole v0.0.0-00010101000000-000000000000
	cdk.tf/go/stack/generated/aws/iamrolepolicyattachment v0.0.0-00010101000000-000000000000
	cdk.tf/go/stack/generated/aws/kmsalias v0.0.0-00010101000000-000000000000
	cdk.tf/go/stack/generated/aws/kmskey v0.0.0-00010101000000-000000000000
	cdk.tf/go/stack/generated/aws/lambdafunction v0.0.0-00010101000000-000000000000
	cdk.tf/go/stack/generated/aws/provider v0.0.0-00010101000000-000000000000
	cdk.tf/go/stack/generated/aws/s3bucket v0.0.0-00010101000000-000000000000
	cdk.tf/go/stack/generated/aws/s3bucketserversideencryptionconfiguration v0.0.0-00010101000000-000000000000
	github.com/aws/constructs-go/constructs/v10 v10.3.0
	github.com/aws/jsii-runtime-go v1.95.0
	github.com/hashicorp/terraform-cdk-go/cdktf v0.20.7
)

require (
	cdk.tf/go/stack/generated/aws/cloudwatchloggroup/internal v0.0.0-00010101000000-000000000000 // indirect
	cdk.tf/go/stack/generated/aws/flowlog/internal v0.0.0-00010101000000-000000000000 // indirect
	cdk.tf/go/stack/generated/aws/iampolicy/internal v0.0.0-00010101000000-000000000000 // indirect
	cdk.tf/go/stack/generated/aws/iamrole/internal v0.0.0-00010101000000-000000000000 // indirect
	cdk.tf/go/stack/generated/aws/iamrolepolicyattachment/internal v0.0.0-00010101000000-000000000000 // indirect
	cdk.tf/go/stack/generated/aws/jsii v0.0.0-00010101000000-000000000000 // indirect
	cdk.tf/go/stack/generated/aws/kmsalias/internal v0.0.0-00010101000000-000000000000 // indirect
	cdk.tf/go/stack/generated/aws/kmskey/internal v0.0.0-00010101000000-000000000000 // indirect
	cdk.tf/go/stack/generated/aws/lambdafunction/internal v0.0.0-00010101000000-000000000000 // indirect
	cdk.tf/go/stack/generated/aws/provider/internal v0.0.0-00010101000000-000000000000 // indirect
	cdk.tf/go/stack/generated/aws/s3bucket/internal v0.0.0-00010101000000-000000000000 // indirect
	cdk.tf/go/stack/generated/aws/s3bucketserversideencryptionconfiguration/internal v0.0.0-00010101000000-000000000000 // indirect
	github.com/Masterminds/semver/v3 v3.2.1 // indirect
	github.com/fatih/color v1.16.0 // indirect
	github.com/mattn/go-colorable v0.1.13 // indirect
	github.com/mattn/go-isatty v0.0.20 // indirect
	github.com/yuin/goldmark v1.4.13 // indirect
	golang.org/x/lint v0.0.0-20210508222113-6edffad5e616 // indirect
	golang.org/x/mod v0.14.0 // indirect
	golang.org/x/sys v0.14.0 // indirect
	golang.org/x/tools v0.17.0 // indirect
)

replace (
	cdk.tf/go/stack/generated/aws/cloudwatchloggroup => ../.gen/aws/cloudwatchloggroup
	cdk.tf/go/stack/generated/aws/cloudwatchloggroup/internal => ../.gen/aws/cloudwatchloggroup/internal
	cdk.tf/go/stack/generated/aws/flowlog => ../.gen/aws/flowlog
	cdk.tf/go/stack/generated/aws/flowlog/internal => ../.gen/aws/flowlog/internal
	cdk.tf/go/stack/generated/aws/iampolicy => ../.gen/aws/iampolicy
	cdk.tf/go/stack/generated/aws/iampolicy/internal => ../.gen/aws/iampolicy/internal
	cdk.tf/go/stack/generated/aws/iamrole => ../.gen/aws/iamrole
	cdk.tf/go/stack/generated/aws/iamrole/internal => ../.gen/aws/iamrole/internal
	cdk.tf/go/stack/generated/aws/iamrolepolicyattachment => ../.gen/aws/iamrolepolicyattachment
	cdk.tf/go/stack/generated/aws/iamrolepolicyattachment/internal => ../.gen/aws/iamrolepolicyattachment/internal
	cdk.tf/go/stack/generated/aws/jsii => ../.gen/aws/jsii
	cdk.tf/go/stack/generated/aws/kmsalias => ../.gen/aws/kmsalias
	cdk.tf/go/stack/generated/aws/kmsalias/internal => ../.gen/aws/kmsalias/internal
	cdk.tf/go/stack/generated/aws/kmskey => ../.gen/aws/kmskey
	cdk.tf/go/stack/generated/aws/kmskey/internal => ../.gen/aws/kmskey/internal
	cdk.tf/go/stack/generated/aws/lambdafunction => ../.gen/aws/lambdafunction
	cdk.tf/go/stack/generated/aws/lambdafunction/internal => ../.gen/aws/lambdafunction/internal
	cdk.tf/go/stack/generated/aws/provider => ../.gen/aws/provider
	cdk.tf/go/stack/generated/aws/provider/internal => ../.gen/aws/provider/internal
	cdk.tf/go/stack/generated/aws/s3bucket => ../.gen/aws/s3bucket
	cdk.tf/go/stack/generated/aws/s3bucket/internal => ../.gen/aws/s3bucket/internal
	cdk.tf/go/stack/generated/aws/s3bucketserversideencryptionconfiguration => ../.gen/aws/s3bucketserversideencryptionconfiguration
	cdk.tf/go/stack/generated/aws/s3bucketserversideencryptionconfiguration/internal => ../.gen/aws/s3bucketserversideencryptionconfiguration/internal
)
