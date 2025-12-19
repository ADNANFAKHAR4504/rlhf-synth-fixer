I tried building the CDKTF Go code, but I’m running into some build errors. A couple of packages don’t seem to exist in the provider.
Specifically configdeliveryChannel can’t be found, even though I’m on the latest version of the module.
Same thing with s3bucketencryption.
It looks like the package names in the imports don’t match what’s actually available in the AWS provider for CDKTF. Can you please fix the code?