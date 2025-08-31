package imports.aws.cloudfront_response_headers_policy;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.249Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.cloudfrontResponseHeadersPolicy.CloudfrontResponseHeadersPolicySecurityHeadersConfigStrictTransportSecurityOutputReference")
public class CloudfrontResponseHeadersPolicySecurityHeadersConfigStrictTransportSecurityOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected CloudfrontResponseHeadersPolicySecurityHeadersConfigStrictTransportSecurityOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected CloudfrontResponseHeadersPolicySecurityHeadersConfigStrictTransportSecurityOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public CloudfrontResponseHeadersPolicySecurityHeadersConfigStrictTransportSecurityOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetIncludeSubdomains() {
        software.amazon.jsii.Kernel.call(this, "resetIncludeSubdomains", software.amazon.jsii.NativeType.VOID);
    }

    public void resetPreload() {
        software.amazon.jsii.Kernel.call(this, "resetPreload", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getAccessControlMaxAgeSecInput() {
        return software.amazon.jsii.Kernel.get(this, "accessControlMaxAgeSecInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getIncludeSubdomainsInput() {
        return software.amazon.jsii.Kernel.get(this, "includeSubdomainsInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getOverrideInput() {
        return software.amazon.jsii.Kernel.get(this, "overrideInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getPreloadInput() {
        return software.amazon.jsii.Kernel.get(this, "preloadInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getAccessControlMaxAgeSec() {
        return software.amazon.jsii.Kernel.get(this, "accessControlMaxAgeSec", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setAccessControlMaxAgeSec(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "accessControlMaxAgeSec", java.util.Objects.requireNonNull(value, "accessControlMaxAgeSec is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getIncludeSubdomains() {
        return software.amazon.jsii.Kernel.get(this, "includeSubdomains", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setIncludeSubdomains(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "includeSubdomains", java.util.Objects.requireNonNull(value, "includeSubdomains is required"));
    }

    public void setIncludeSubdomains(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "includeSubdomains", java.util.Objects.requireNonNull(value, "includeSubdomains is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getOverride() {
        return software.amazon.jsii.Kernel.get(this, "override", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setOverride(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "override", java.util.Objects.requireNonNull(value, "override is required"));
    }

    public void setOverride(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "override", java.util.Objects.requireNonNull(value, "override is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getPreload() {
        return software.amazon.jsii.Kernel.get(this, "preload", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setPreload(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "preload", java.util.Objects.requireNonNull(value, "preload is required"));
    }

    public void setPreload(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "preload", java.util.Objects.requireNonNull(value, "preload is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.cloudfront_response_headers_policy.CloudfrontResponseHeadersPolicySecurityHeadersConfigStrictTransportSecurity getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.cloudfront_response_headers_policy.CloudfrontResponseHeadersPolicySecurityHeadersConfigStrictTransportSecurity.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.cloudfront_response_headers_policy.CloudfrontResponseHeadersPolicySecurityHeadersConfigStrictTransportSecurity value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
