package imports.aws.cloudfront_cache_policy;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.228Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.cloudfrontCachePolicy.CloudfrontCachePolicyParametersInCacheKeyAndForwardedToOriginQueryStringsConfigOutputReference")
public class CloudfrontCachePolicyParametersInCacheKeyAndForwardedToOriginQueryStringsConfigOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected CloudfrontCachePolicyParametersInCacheKeyAndForwardedToOriginQueryStringsConfigOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected CloudfrontCachePolicyParametersInCacheKeyAndForwardedToOriginQueryStringsConfigOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public CloudfrontCachePolicyParametersInCacheKeyAndForwardedToOriginQueryStringsConfigOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void putQueryStrings(final @org.jetbrains.annotations.NotNull imports.aws.cloudfront_cache_policy.CloudfrontCachePolicyParametersInCacheKeyAndForwardedToOriginQueryStringsConfigQueryStrings value) {
        software.amazon.jsii.Kernel.call(this, "putQueryStrings", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetQueryStrings() {
        software.amazon.jsii.Kernel.call(this, "resetQueryStrings", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.cloudfront_cache_policy.CloudfrontCachePolicyParametersInCacheKeyAndForwardedToOriginQueryStringsConfigQueryStringsOutputReference getQueryStrings() {
        return software.amazon.jsii.Kernel.get(this, "queryStrings", software.amazon.jsii.NativeType.forClass(imports.aws.cloudfront_cache_policy.CloudfrontCachePolicyParametersInCacheKeyAndForwardedToOriginQueryStringsConfigQueryStringsOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getQueryStringBehaviorInput() {
        return software.amazon.jsii.Kernel.get(this, "queryStringBehaviorInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.cloudfront_cache_policy.CloudfrontCachePolicyParametersInCacheKeyAndForwardedToOriginQueryStringsConfigQueryStrings getQueryStringsInput() {
        return software.amazon.jsii.Kernel.get(this, "queryStringsInput", software.amazon.jsii.NativeType.forClass(imports.aws.cloudfront_cache_policy.CloudfrontCachePolicyParametersInCacheKeyAndForwardedToOriginQueryStringsConfigQueryStrings.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getQueryStringBehavior() {
        return software.amazon.jsii.Kernel.get(this, "queryStringBehavior", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setQueryStringBehavior(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "queryStringBehavior", java.util.Objects.requireNonNull(value, "queryStringBehavior is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.cloudfront_cache_policy.CloudfrontCachePolicyParametersInCacheKeyAndForwardedToOriginQueryStringsConfig getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.cloudfront_cache_policy.CloudfrontCachePolicyParametersInCacheKeyAndForwardedToOriginQueryStringsConfig.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.cloudfront_cache_policy.CloudfrontCachePolicyParametersInCacheKeyAndForwardedToOriginQueryStringsConfig value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
