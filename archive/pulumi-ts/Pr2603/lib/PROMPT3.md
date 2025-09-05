The code you provided failed with the below mentioned errors - 

```bash
Diagnostics:
  pulumi:pulumi:Stack (TapStack-TapStackpr2490):
    error: update failed
  aws:s3:Bucket (static-content-pr2490):
    warning: urn:pulumi:TapStackpr2490::TapStack::aws:s3/bucket:Bucket::static-content-pr2490 verification warning: versioning is deprecated. Use the aws_s3_bucket_versioning resource instead.
  aws:cloudfront:Distribution (cdn-pr2490):
    error:   sdk-v2/provider2.go:572: sdk.helper_schema: creating CloudFront Distribution: operation error CloudFront: CreateDistributionWithTags, https response error StatusCode: 400, RequestID: ecde7166-afa6-422d-915b-2d0f6f2f2464, InvalidArgument: The parameter originId is too big.: provider=aws@7.5.0
    error: 1 error occurred:
    	* creating CloudFront Distribution: operation error CloudFront: CreateDistributionWithTags, https response error StatusCode: 400, RequestID: ecde7166-afa6-422d-915b-2d0f6f2f2464, InvalidArgument: The parameter originId is too big.
Resources:
    + 13 created
Duration: 25s
```
