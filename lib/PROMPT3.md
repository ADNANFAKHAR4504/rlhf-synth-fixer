Again i received some build errors when trying to build the CDKTF code, please help me fix the above errors:
- `undefined: s3bucketserversideencryptionconfiguration.NewS3BucketServerSideEncryptionConfiguration`  
- `undefined: s3bucketserversideencryptionconfiguration.S3BucketServerSideEncryptionConfigurationConfig`  
- `undefined: s3bucketserversideencryptionconfiguration.S3BucketServerSideEncryptionConfigurationRule`  
- `undefined: s3bucketserversideencryptionconfiguration.S3BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefault`
- `azs declared and not used` 
- `cannot use jsii.String("80") (value of type *string) as *float64 value in struct literal`
- The same `s3bucketserversideencryptionconfiguration` references are reported again, confirming the package or constructor does not exist in the provider.
Can you please help me fixing this build errors and comply with all the requirements?