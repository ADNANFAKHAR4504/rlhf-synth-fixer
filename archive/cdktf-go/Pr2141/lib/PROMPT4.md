Build fails

go build ./tap_stack.go
# command-line-arguments
./tap_stack.go:106:21: undefined: s3bucketversioning.NewS3BucketVersioning
./tap_stack.go:106:107: undefined: s3bucketversioning.S3BucketVersioningConfig
./tap_stack.go:113:44: undefined: s3bucketserversideencryptionconfiguration.NewS3BucketServerSideEncryptionConfiguration
./tap_stack.go:113:176: undefined: s3bucketserversideencryptionconfiguration.S3BucketServerSideEncryptionConfigurationConfig
./tap_stack.go:115:54: undefined: s3bucketserversideencryptionconfiguration.S3BucketServerSideEncryptionConfigurationRule
./tap_stack.go:117:84: undefined: s3bucketserversideencryptionconfiguration.S3BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefault
./tap_stack.go:128:3: unknown field RepositoryDescription in struct literal of type codecommitrepository.CodecommitRepositoryConfig
