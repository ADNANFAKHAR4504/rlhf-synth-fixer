package imports.aws.data_aws_cloudfront_cache_policy;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.501Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.dataAwsCloudfrontCachePolicy.DataAwsCloudfrontCachePolicyParametersInCacheKeyAndForwardedToOriginOutputReference")
public class DataAwsCloudfrontCachePolicyParametersInCacheKeyAndForwardedToOriginOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected DataAwsCloudfrontCachePolicyParametersInCacheKeyAndForwardedToOriginOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected DataAwsCloudfrontCachePolicyParametersInCacheKeyAndForwardedToOriginOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     * @param complexObjectIndex the index of this item in the list. This parameter is required.
     * @param complexObjectIsFromSet whether the list is wrapping a set (will add tolist() to be able to access an item via an index). This parameter is required.
     */
    public DataAwsCloudfrontCachePolicyParametersInCacheKeyAndForwardedToOriginOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute, final @org.jetbrains.annotations.NotNull java.lang.Number complexObjectIndex, final @org.jetbrains.annotations.NotNull java.lang.Boolean complexObjectIsFromSet) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required"), java.util.Objects.requireNonNull(complexObjectIndex, "complexObjectIndex is required"), java.util.Objects.requireNonNull(complexObjectIsFromSet, "complexObjectIsFromSet is required") });
    }

    public @org.jetbrains.annotations.NotNull imports.aws.data_aws_cloudfront_cache_policy.DataAwsCloudfrontCachePolicyParametersInCacheKeyAndForwardedToOriginCookiesConfigList getCookiesConfig() {
        return software.amazon.jsii.Kernel.get(this, "cookiesConfig", software.amazon.jsii.NativeType.forClass(imports.aws.data_aws_cloudfront_cache_policy.DataAwsCloudfrontCachePolicyParametersInCacheKeyAndForwardedToOriginCookiesConfigList.class));
    }

    public @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable getEnableAcceptEncodingBrotli() {
        return software.amazon.jsii.Kernel.get(this, "enableAcceptEncodingBrotli", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.IResolvable.class));
    }

    public @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable getEnableAcceptEncodingGzip() {
        return software.amazon.jsii.Kernel.get(this, "enableAcceptEncodingGzip", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.IResolvable.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.data_aws_cloudfront_cache_policy.DataAwsCloudfrontCachePolicyParametersInCacheKeyAndForwardedToOriginHeadersConfigList getHeadersConfig() {
        return software.amazon.jsii.Kernel.get(this, "headersConfig", software.amazon.jsii.NativeType.forClass(imports.aws.data_aws_cloudfront_cache_policy.DataAwsCloudfrontCachePolicyParametersInCacheKeyAndForwardedToOriginHeadersConfigList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.data_aws_cloudfront_cache_policy.DataAwsCloudfrontCachePolicyParametersInCacheKeyAndForwardedToOriginQueryStringsConfigList getQueryStringsConfig() {
        return software.amazon.jsii.Kernel.get(this, "queryStringsConfig", software.amazon.jsii.NativeType.forClass(imports.aws.data_aws_cloudfront_cache_policy.DataAwsCloudfrontCachePolicyParametersInCacheKeyAndForwardedToOriginQueryStringsConfigList.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.data_aws_cloudfront_cache_policy.DataAwsCloudfrontCachePolicyParametersInCacheKeyAndForwardedToOrigin getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.data_aws_cloudfront_cache_policy.DataAwsCloudfrontCachePolicyParametersInCacheKeyAndForwardedToOrigin.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.data_aws_cloudfront_cache_policy.DataAwsCloudfrontCachePolicyParametersInCacheKeyAndForwardedToOrigin value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
