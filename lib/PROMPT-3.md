The build failed with below error and please fix this along with other corrections:
error TS2353: Object literal may only specify known properties, and 'days' does not exist in type 'IResolvable | S3BucketLifecycleConfigurationRuleExpiration[]'.

88 days: 90,

```
node_modules/@cdktf/provider-aws/lib/s3-bucket-lifecycle-configuration/index.d.ts:543:14
543 readonly expiration?: S3BucketLifecycleConfigurationRuleExpiration[] | cdktf.IResolvable;
```

The expected type comes from property 'expiration' which is declared here on type 'S3BucketLifecycleConfigurationRule'
