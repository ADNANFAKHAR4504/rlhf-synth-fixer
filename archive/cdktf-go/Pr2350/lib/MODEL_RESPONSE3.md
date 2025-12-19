The issue is with the S3 bucket encryption import. In newer versions of the AWS provider, the S3 bucket encryption configuration has been moved. Here are the updates needed:

## Import Changes

Replace this import:
```go
"github.com/cdktf/cdktf-provider-aws-go/aws/v19/s3bucketencryption"
```

With:
```go
"github.com/cdktf/cdktf-provider-aws-go/aws/v19/s3bucketserversideencryptionconfiguration"
```

## Code Changes

Replace all instances of:
```go
s3bucketencryption.NewS3BucketServerSideEncryptionConfiguration
```

With:
```go
s3bucketserversideencryptionconfiguration.NewS3BucketServerSideEncryptionConfiguration
```

And replace:
```go
s3bucketencryption.S3BucketServerSideEncryptionConfigurationConfig
```

With:
```go
s3bucketserversideencryptionconfiguration.S3BucketServerSideEncryptionConfigurationConfig
```

And replace:
```go
s3bucketencryption.S3BucketServerSideEncryptionConfigurationRule
```

With:
```go
s3bucketserversideencryptionconfiguration.S3BucketServerSideEncryptionConfigurationRule
```

And replace:
```go
s3bucketencryption.S3BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefault
```

With:
```go
s3bucketserversideencryptionconfiguration.S3BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefault
```

These changes should resolve the import error you're encountering.