package imports.aws.cloudfront_cache_policy;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.228Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.cloudfrontCachePolicy.CloudfrontCachePolicyParametersInCacheKeyAndForwardedToOriginOutputReference")
public class CloudfrontCachePolicyParametersInCacheKeyAndForwardedToOriginOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected CloudfrontCachePolicyParametersInCacheKeyAndForwardedToOriginOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected CloudfrontCachePolicyParametersInCacheKeyAndForwardedToOriginOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public CloudfrontCachePolicyParametersInCacheKeyAndForwardedToOriginOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void putCookiesConfig(final @org.jetbrains.annotations.NotNull imports.aws.cloudfront_cache_policy.CloudfrontCachePolicyParametersInCacheKeyAndForwardedToOriginCookiesConfig value) {
        software.amazon.jsii.Kernel.call(this, "putCookiesConfig", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putHeadersConfig(final @org.jetbrains.annotations.NotNull imports.aws.cloudfront_cache_policy.CloudfrontCachePolicyParametersInCacheKeyAndForwardedToOriginHeadersConfig value) {
        software.amazon.jsii.Kernel.call(this, "putHeadersConfig", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putQueryStringsConfig(final @org.jetbrains.annotations.NotNull imports.aws.cloudfront_cache_policy.CloudfrontCachePolicyParametersInCacheKeyAndForwardedToOriginQueryStringsConfig value) {
        software.amazon.jsii.Kernel.call(this, "putQueryStringsConfig", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetEnableAcceptEncodingBrotli() {
        software.amazon.jsii.Kernel.call(this, "resetEnableAcceptEncodingBrotli", software.amazon.jsii.NativeType.VOID);
    }

    public void resetEnableAcceptEncodingGzip() {
        software.amazon.jsii.Kernel.call(this, "resetEnableAcceptEncodingGzip", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.cloudfront_cache_policy.CloudfrontCachePolicyParametersInCacheKeyAndForwardedToOriginCookiesConfigOutputReference getCookiesConfig() {
        return software.amazon.jsii.Kernel.get(this, "cookiesConfig", software.amazon.jsii.NativeType.forClass(imports.aws.cloudfront_cache_policy.CloudfrontCachePolicyParametersInCacheKeyAndForwardedToOriginCookiesConfigOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.cloudfront_cache_policy.CloudfrontCachePolicyParametersInCacheKeyAndForwardedToOriginHeadersConfigOutputReference getHeadersConfig() {
        return software.amazon.jsii.Kernel.get(this, "headersConfig", software.amazon.jsii.NativeType.forClass(imports.aws.cloudfront_cache_policy.CloudfrontCachePolicyParametersInCacheKeyAndForwardedToOriginHeadersConfigOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.cloudfront_cache_policy.CloudfrontCachePolicyParametersInCacheKeyAndForwardedToOriginQueryStringsConfigOutputReference getQueryStringsConfig() {
        return software.amazon.jsii.Kernel.get(this, "queryStringsConfig", software.amazon.jsii.NativeType.forClass(imports.aws.cloudfront_cache_policy.CloudfrontCachePolicyParametersInCacheKeyAndForwardedToOriginQueryStringsConfigOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.cloudfront_cache_policy.CloudfrontCachePolicyParametersInCacheKeyAndForwardedToOriginCookiesConfig getCookiesConfigInput() {
        return software.amazon.jsii.Kernel.get(this, "cookiesConfigInput", software.amazon.jsii.NativeType.forClass(imports.aws.cloudfront_cache_policy.CloudfrontCachePolicyParametersInCacheKeyAndForwardedToOriginCookiesConfig.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getEnableAcceptEncodingBrotliInput() {
        return software.amazon.jsii.Kernel.get(this, "enableAcceptEncodingBrotliInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getEnableAcceptEncodingGzipInput() {
        return software.amazon.jsii.Kernel.get(this, "enableAcceptEncodingGzipInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.cloudfront_cache_policy.CloudfrontCachePolicyParametersInCacheKeyAndForwardedToOriginHeadersConfig getHeadersConfigInput() {
        return software.amazon.jsii.Kernel.get(this, "headersConfigInput", software.amazon.jsii.NativeType.forClass(imports.aws.cloudfront_cache_policy.CloudfrontCachePolicyParametersInCacheKeyAndForwardedToOriginHeadersConfig.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.cloudfront_cache_policy.CloudfrontCachePolicyParametersInCacheKeyAndForwardedToOriginQueryStringsConfig getQueryStringsConfigInput() {
        return software.amazon.jsii.Kernel.get(this, "queryStringsConfigInput", software.amazon.jsii.NativeType.forClass(imports.aws.cloudfront_cache_policy.CloudfrontCachePolicyParametersInCacheKeyAndForwardedToOriginQueryStringsConfig.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getEnableAcceptEncodingBrotli() {
        return software.amazon.jsii.Kernel.get(this, "enableAcceptEncodingBrotli", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setEnableAcceptEncodingBrotli(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "enableAcceptEncodingBrotli", java.util.Objects.requireNonNull(value, "enableAcceptEncodingBrotli is required"));
    }

    public void setEnableAcceptEncodingBrotli(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "enableAcceptEncodingBrotli", java.util.Objects.requireNonNull(value, "enableAcceptEncodingBrotli is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getEnableAcceptEncodingGzip() {
        return software.amazon.jsii.Kernel.get(this, "enableAcceptEncodingGzip", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setEnableAcceptEncodingGzip(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "enableAcceptEncodingGzip", java.util.Objects.requireNonNull(value, "enableAcceptEncodingGzip is required"));
    }

    public void setEnableAcceptEncodingGzip(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "enableAcceptEncodingGzip", java.util.Objects.requireNonNull(value, "enableAcceptEncodingGzip is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.cloudfront_cache_policy.CloudfrontCachePolicyParametersInCacheKeyAndForwardedToOrigin getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.cloudfront_cache_policy.CloudfrontCachePolicyParametersInCacheKeyAndForwardedToOrigin.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.cloudfront_cache_policy.CloudfrontCachePolicyParametersInCacheKeyAndForwardedToOrigin value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
