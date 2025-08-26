# CDKTF Go Build Errors

When trying to build the CDKTF Go code, i still have some building errors, please help me fix it:

- **Missing imports / undefined references**  
  - `undefined: s3bucketserversideencryptionconfiguration.NewS3BucketServerSideEncryptionConfiguration`  
  - `undefined: s3bucketserversideencryptionconfiguration.S3BucketServerSideEncryptionConfigurationConfig`  
  - `undefined: s3bucketserversideencryptionconfiguration.S3BucketServerSideEncryptionConfigurationRule`  
  - `undefined: s3bucketserversideencryptionconfiguration.S3BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefault`

- **Unused variable**  
  - `azs declared and not used`

- **Type mismatch**  
  - `cannot use jsii.String("80") (value of type *string) as *float64 value in struct literal`

- **Repeated undefined errors (same as above)**  
  - The same `s3bucketserversideencryptionconfiguration` references are reported again, confirming the package or constructor does not exist in the provider.


Return to me the fixed working Go code please