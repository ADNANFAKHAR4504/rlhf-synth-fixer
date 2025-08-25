The code generated has an error in its dependencies

...
go: found github.com/cdktf/cdktf-provider-aws-go/aws/v19/vpc in github.com/cdktf/cdktf-provider-aws-go/aws/v19 v19.65.1
go: finding module for package github.com/cdktf/cdktf-provider-aws-go/aws/v19/s3bucketencryption
go: finding module for package github.com/cdktf/cdktf-provider-aws-go/aws/v19/configdeliveryChannel
go: github.com/example/tap/lib imports
        github.com/cdktf/cdktf-provider-aws-go/aws/v19/configdeliveryChannel: module github.com/cdktf/cdktf-provider-aws-go/aws/v19@latest found (v19.65.1), but does not contain package github.com/cdktf/cdktf-provider-aws-go/aws/v19/configdeliveryChannel
go: github.com/example/tap/lib imports
        github.com/cdktf/cdktf-provider-aws-go/aws/v19/s3bucketencryption: module github.com/cdktf/cdktf-provider-aws-go/aws/v19@latest found (v19.65.1), but does not contain package github.com/cdktf/cdktf-provider-aws-go/aws/v19/s3bucketencryption