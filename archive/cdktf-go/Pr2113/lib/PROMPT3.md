Again failing at synth stage:
> tap@0.1.0 cdktf:get
> cdktf get

go: github.com/TuringGpt/iac-test-automations/lib imports
	github.com/hashicorp/terraform-cdk-go/cdktf/aws: module github.com/hashicorp/terraform-cdk-go/cdktf@latest found (v0.21.0), but does not contain package github.com/hashicorp/terraform-cdk-go/cdktf/aws
go: github.com/TuringGpt/iac-test-automations/lib imports
	github.com/hashicorp/terraform-provider-aws/provider: module github.com/hashicorp/terraform-provider-aws@latest found (v1.60.0), but does not contain package github.com/hashicorp/terraform-provider-aws/provider
Error: Process completed with exit code 1.


Lint stage error below:

Run ./scripts/lint.sh
go: github.com/TuringGpt/iac-test-automations/lib imports
	github.com/hashicorp/terraform-cdk-go/cdktf/aws: module github.com/hashicorp/terraform-cdk-go/cdktf@latest found (v0.21.0), but does not contain package github.com/hashicorp/terraform-cdk-go/cdktf/aws
go: github.com/TuringGpt/iac-test-automations/lib imports
	github.com/hashicorp/terraform-provider-aws/provider: module github.com/hashicorp/terraform-provider-aws@latest found (v1.60.0), but does not contain package github.com/hashicorp/terraform-provider-aws/provider
Error: Process completed with exit code 1.