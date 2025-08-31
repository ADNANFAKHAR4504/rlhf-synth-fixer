package imports.aws.lightsail_distribution;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.827Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.lightsailDistribution.LightsailDistributionCacheBehaviorSettingsOutputReference")
public class LightsailDistributionCacheBehaviorSettingsOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected LightsailDistributionCacheBehaviorSettingsOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected LightsailDistributionCacheBehaviorSettingsOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public LightsailDistributionCacheBehaviorSettingsOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void putForwardedCookies(final @org.jetbrains.annotations.NotNull imports.aws.lightsail_distribution.LightsailDistributionCacheBehaviorSettingsForwardedCookies value) {
        software.amazon.jsii.Kernel.call(this, "putForwardedCookies", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putForwardedHeaders(final @org.jetbrains.annotations.NotNull imports.aws.lightsail_distribution.LightsailDistributionCacheBehaviorSettingsForwardedHeaders value) {
        software.amazon.jsii.Kernel.call(this, "putForwardedHeaders", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putForwardedQueryStrings(final @org.jetbrains.annotations.NotNull imports.aws.lightsail_distribution.LightsailDistributionCacheBehaviorSettingsForwardedQueryStrings value) {
        software.amazon.jsii.Kernel.call(this, "putForwardedQueryStrings", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetAllowedHttpMethods() {
        software.amazon.jsii.Kernel.call(this, "resetAllowedHttpMethods", software.amazon.jsii.NativeType.VOID);
    }

    public void resetCachedHttpMethods() {
        software.amazon.jsii.Kernel.call(this, "resetCachedHttpMethods", software.amazon.jsii.NativeType.VOID);
    }

    public void resetDefaultTtl() {
        software.amazon.jsii.Kernel.call(this, "resetDefaultTtl", software.amazon.jsii.NativeType.VOID);
    }

    public void resetForwardedCookies() {
        software.amazon.jsii.Kernel.call(this, "resetForwardedCookies", software.amazon.jsii.NativeType.VOID);
    }

    public void resetForwardedHeaders() {
        software.amazon.jsii.Kernel.call(this, "resetForwardedHeaders", software.amazon.jsii.NativeType.VOID);
    }

    public void resetForwardedQueryStrings() {
        software.amazon.jsii.Kernel.call(this, "resetForwardedQueryStrings", software.amazon.jsii.NativeType.VOID);
    }

    public void resetMaximumTtl() {
        software.amazon.jsii.Kernel.call(this, "resetMaximumTtl", software.amazon.jsii.NativeType.VOID);
    }

    public void resetMinimumTtl() {
        software.amazon.jsii.Kernel.call(this, "resetMinimumTtl", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.lightsail_distribution.LightsailDistributionCacheBehaviorSettingsForwardedCookiesOutputReference getForwardedCookies() {
        return software.amazon.jsii.Kernel.get(this, "forwardedCookies", software.amazon.jsii.NativeType.forClass(imports.aws.lightsail_distribution.LightsailDistributionCacheBehaviorSettingsForwardedCookiesOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.lightsail_distribution.LightsailDistributionCacheBehaviorSettingsForwardedHeadersOutputReference getForwardedHeaders() {
        return software.amazon.jsii.Kernel.get(this, "forwardedHeaders", software.amazon.jsii.NativeType.forClass(imports.aws.lightsail_distribution.LightsailDistributionCacheBehaviorSettingsForwardedHeadersOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.lightsail_distribution.LightsailDistributionCacheBehaviorSettingsForwardedQueryStringsOutputReference getForwardedQueryStrings() {
        return software.amazon.jsii.Kernel.get(this, "forwardedQueryStrings", software.amazon.jsii.NativeType.forClass(imports.aws.lightsail_distribution.LightsailDistributionCacheBehaviorSettingsForwardedQueryStringsOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getAllowedHttpMethodsInput() {
        return software.amazon.jsii.Kernel.get(this, "allowedHttpMethodsInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getCachedHttpMethodsInput() {
        return software.amazon.jsii.Kernel.get(this, "cachedHttpMethodsInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getDefaultTtlInput() {
        return software.amazon.jsii.Kernel.get(this, "defaultTtlInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.lightsail_distribution.LightsailDistributionCacheBehaviorSettingsForwardedCookies getForwardedCookiesInput() {
        return software.amazon.jsii.Kernel.get(this, "forwardedCookiesInput", software.amazon.jsii.NativeType.forClass(imports.aws.lightsail_distribution.LightsailDistributionCacheBehaviorSettingsForwardedCookies.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.lightsail_distribution.LightsailDistributionCacheBehaviorSettingsForwardedHeaders getForwardedHeadersInput() {
        return software.amazon.jsii.Kernel.get(this, "forwardedHeadersInput", software.amazon.jsii.NativeType.forClass(imports.aws.lightsail_distribution.LightsailDistributionCacheBehaviorSettingsForwardedHeaders.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.lightsail_distribution.LightsailDistributionCacheBehaviorSettingsForwardedQueryStrings getForwardedQueryStringsInput() {
        return software.amazon.jsii.Kernel.get(this, "forwardedQueryStringsInput", software.amazon.jsii.NativeType.forClass(imports.aws.lightsail_distribution.LightsailDistributionCacheBehaviorSettingsForwardedQueryStrings.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getMaximumTtlInput() {
        return software.amazon.jsii.Kernel.get(this, "maximumTtlInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getMinimumTtlInput() {
        return software.amazon.jsii.Kernel.get(this, "minimumTtlInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getAllowedHttpMethods() {
        return software.amazon.jsii.Kernel.get(this, "allowedHttpMethods", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setAllowedHttpMethods(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "allowedHttpMethods", java.util.Objects.requireNonNull(value, "allowedHttpMethods is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getCachedHttpMethods() {
        return software.amazon.jsii.Kernel.get(this, "cachedHttpMethods", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setCachedHttpMethods(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "cachedHttpMethods", java.util.Objects.requireNonNull(value, "cachedHttpMethods is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getDefaultTtl() {
        return software.amazon.jsii.Kernel.get(this, "defaultTtl", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setDefaultTtl(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "defaultTtl", java.util.Objects.requireNonNull(value, "defaultTtl is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getMaximumTtl() {
        return software.amazon.jsii.Kernel.get(this, "maximumTtl", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setMaximumTtl(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "maximumTtl", java.util.Objects.requireNonNull(value, "maximumTtl is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getMinimumTtl() {
        return software.amazon.jsii.Kernel.get(this, "minimumTtl", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setMinimumTtl(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "minimumTtl", java.util.Objects.requireNonNull(value, "minimumTtl is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.lightsail_distribution.LightsailDistributionCacheBehaviorSettings getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.lightsail_distribution.LightsailDistributionCacheBehaviorSettings.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.lightsail_distribution.LightsailDistributionCacheBehaviorSettings value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
