package imports.aws.cloudfront_distribution;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.231Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.cloudfrontDistribution.CloudfrontDistributionDefaultCacheBehaviorForwardedValuesOutputReference")
public class CloudfrontDistributionDefaultCacheBehaviorForwardedValuesOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected CloudfrontDistributionDefaultCacheBehaviorForwardedValuesOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected CloudfrontDistributionDefaultCacheBehaviorForwardedValuesOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public CloudfrontDistributionDefaultCacheBehaviorForwardedValuesOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void putCookies(final @org.jetbrains.annotations.NotNull imports.aws.cloudfront_distribution.CloudfrontDistributionDefaultCacheBehaviorForwardedValuesCookies value) {
        software.amazon.jsii.Kernel.call(this, "putCookies", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetHeaders() {
        software.amazon.jsii.Kernel.call(this, "resetHeaders", software.amazon.jsii.NativeType.VOID);
    }

    public void resetQueryStringCacheKeys() {
        software.amazon.jsii.Kernel.call(this, "resetQueryStringCacheKeys", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.cloudfront_distribution.CloudfrontDistributionDefaultCacheBehaviorForwardedValuesCookiesOutputReference getCookies() {
        return software.amazon.jsii.Kernel.get(this, "cookies", software.amazon.jsii.NativeType.forClass(imports.aws.cloudfront_distribution.CloudfrontDistributionDefaultCacheBehaviorForwardedValuesCookiesOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.cloudfront_distribution.CloudfrontDistributionDefaultCacheBehaviorForwardedValuesCookies getCookiesInput() {
        return software.amazon.jsii.Kernel.get(this, "cookiesInput", software.amazon.jsii.NativeType.forClass(imports.aws.cloudfront_distribution.CloudfrontDistributionDefaultCacheBehaviorForwardedValuesCookies.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getHeadersInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "headersInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getQueryStringCacheKeysInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "queryStringCacheKeysInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getQueryStringInput() {
        return software.amazon.jsii.Kernel.get(this, "queryStringInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getHeaders() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "headers", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setHeaders(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "headers", java.util.Objects.requireNonNull(value, "headers is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getQueryString() {
        return software.amazon.jsii.Kernel.get(this, "queryString", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setQueryString(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "queryString", java.util.Objects.requireNonNull(value, "queryString is required"));
    }

    public void setQueryString(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "queryString", java.util.Objects.requireNonNull(value, "queryString is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getQueryStringCacheKeys() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "queryStringCacheKeys", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setQueryStringCacheKeys(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "queryStringCacheKeys", java.util.Objects.requireNonNull(value, "queryStringCacheKeys is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.cloudfront_distribution.CloudfrontDistributionDefaultCacheBehaviorForwardedValues getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.cloudfront_distribution.CloudfrontDistributionDefaultCacheBehaviorForwardedValues.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.cloudfront_distribution.CloudfrontDistributionDefaultCacheBehaviorForwardedValues value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
