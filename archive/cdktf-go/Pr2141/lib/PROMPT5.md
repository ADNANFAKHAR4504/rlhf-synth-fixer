Build fails

go build ./tap_stack.go
# command-line-arguments
./tap_stack.go:99:38: cannot use []*s3bucket.S3BucketServerSideEncryptionConfiguration{…} (value of type []*s3bucket.S3BucketServerSideEncryptionConfiguration) as *s3bucket.S3BucketServerSideEncryptionConfiguration value in struct literal
./tap_stack.go:101:11: cannot use []*s3bucket.S3BucketServerSideEncryptionConfigurationRule{…} (value of type []*s3bucket.S3BucketServerSideEncryptionConfigurationRule) as *s3bucket.S3BucketServerSideEncryptionConfigurationRule value in struct literal
