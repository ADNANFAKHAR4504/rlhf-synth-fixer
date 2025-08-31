package imports.aws.cloudfront_cache_policy;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.227Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.cloudfrontCachePolicy.CloudfrontCachePolicyParametersInCacheKeyAndForwardedToOriginCookiesConfigOutputReference")
public class CloudfrontCachePolicyParametersInCacheKeyAndForwardedToOriginCookiesConfigOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected CloudfrontCachePolicyParametersInCacheKeyAndForwardedToOriginCookiesConfigOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected CloudfrontCachePolicyParametersInCacheKeyAndForwardedToOriginCookiesConfigOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public CloudfrontCachePolicyParametersInCacheKeyAndForwardedToOriginCookiesConfigOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void putCookies(final @org.jetbrains.annotations.NotNull imports.aws.cloudfront_cache_policy.CloudfrontCachePolicyParametersInCacheKeyAndForwardedToOriginCookiesConfigCookies value) {
        software.amazon.jsii.Kernel.call(this, "putCookies", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetCookies() {
        software.amazon.jsii.Kernel.call(this, "resetCookies", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.cloudfront_cache_policy.CloudfrontCachePolicyParametersInCacheKeyAndForwardedToOriginCookiesConfigCookiesOutputReference getCookies() {
        return software.amazon.jsii.Kernel.get(this, "cookies", software.amazon.jsii.NativeType.forClass(imports.aws.cloudfront_cache_policy.CloudfrontCachePolicyParametersInCacheKeyAndForwardedToOriginCookiesConfigCookiesOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getCookieBehaviorInput() {
        return software.amazon.jsii.Kernel.get(this, "cookieBehaviorInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.cloudfront_cache_policy.CloudfrontCachePolicyParametersInCacheKeyAndForwardedToOriginCookiesConfigCookies getCookiesInput() {
        return software.amazon.jsii.Kernel.get(this, "cookiesInput", software.amazon.jsii.NativeType.forClass(imports.aws.cloudfront_cache_policy.CloudfrontCachePolicyParametersInCacheKeyAndForwardedToOriginCookiesConfigCookies.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getCookieBehavior() {
        return software.amazon.jsii.Kernel.get(this, "cookieBehavior", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setCookieBehavior(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "cookieBehavior", java.util.Objects.requireNonNull(value, "cookieBehavior is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.cloudfront_cache_policy.CloudfrontCachePolicyParametersInCacheKeyAndForwardedToOriginCookiesConfig getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.cloudfront_cache_policy.CloudfrontCachePolicyParametersInCacheKeyAndForwardedToOriginCookiesConfig.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.cloudfront_cache_policy.CloudfrontCachePolicyParametersInCacheKeyAndForwardedToOriginCookiesConfig value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
