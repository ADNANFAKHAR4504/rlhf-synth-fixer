package imports.aws.cloudfront_distribution;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.231Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.cloudfrontDistribution.CloudfrontDistributionDefaultCacheBehaviorForwardedValuesCookiesOutputReference")
public class CloudfrontDistributionDefaultCacheBehaviorForwardedValuesCookiesOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected CloudfrontDistributionDefaultCacheBehaviorForwardedValuesCookiesOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected CloudfrontDistributionDefaultCacheBehaviorForwardedValuesCookiesOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public CloudfrontDistributionDefaultCacheBehaviorForwardedValuesCookiesOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetWhitelistedNames() {
        software.amazon.jsii.Kernel.call(this, "resetWhitelistedNames", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getForwardInput() {
        return software.amazon.jsii.Kernel.get(this, "forwardInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getWhitelistedNamesInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "whitelistedNamesInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getForward() {
        return software.amazon.jsii.Kernel.get(this, "forward", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setForward(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "forward", java.util.Objects.requireNonNull(value, "forward is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getWhitelistedNames() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "whitelistedNames", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setWhitelistedNames(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "whitelistedNames", java.util.Objects.requireNonNull(value, "whitelistedNames is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.cloudfront_distribution.CloudfrontDistributionDefaultCacheBehaviorForwardedValuesCookies getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.cloudfront_distribution.CloudfrontDistributionDefaultCacheBehaviorForwardedValuesCookies.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.cloudfront_distribution.CloudfrontDistributionDefaultCacheBehaviorForwardedValuesCookies value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
