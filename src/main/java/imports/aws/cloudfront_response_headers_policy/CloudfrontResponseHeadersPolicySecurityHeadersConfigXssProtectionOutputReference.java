package imports.aws.cloudfront_response_headers_policy;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.249Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.cloudfrontResponseHeadersPolicy.CloudfrontResponseHeadersPolicySecurityHeadersConfigXssProtectionOutputReference")
public class CloudfrontResponseHeadersPolicySecurityHeadersConfigXssProtectionOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected CloudfrontResponseHeadersPolicySecurityHeadersConfigXssProtectionOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected CloudfrontResponseHeadersPolicySecurityHeadersConfigXssProtectionOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public CloudfrontResponseHeadersPolicySecurityHeadersConfigXssProtectionOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetModeBlock() {
        software.amazon.jsii.Kernel.call(this, "resetModeBlock", software.amazon.jsii.NativeType.VOID);
    }

    public void resetReportUri() {
        software.amazon.jsii.Kernel.call(this, "resetReportUri", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getModeBlockInput() {
        return software.amazon.jsii.Kernel.get(this, "modeBlockInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getOverrideInput() {
        return software.amazon.jsii.Kernel.get(this, "overrideInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getProtectionInput() {
        return software.amazon.jsii.Kernel.get(this, "protectionInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getReportUriInput() {
        return software.amazon.jsii.Kernel.get(this, "reportUriInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getModeBlock() {
        return software.amazon.jsii.Kernel.get(this, "modeBlock", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setModeBlock(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "modeBlock", java.util.Objects.requireNonNull(value, "modeBlock is required"));
    }

    public void setModeBlock(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "modeBlock", java.util.Objects.requireNonNull(value, "modeBlock is required"));
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

    public @org.jetbrains.annotations.NotNull java.lang.Object getProtection() {
        return software.amazon.jsii.Kernel.get(this, "protection", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setProtection(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "protection", java.util.Objects.requireNonNull(value, "protection is required"));
    }

    public void setProtection(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "protection", java.util.Objects.requireNonNull(value, "protection is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getReportUri() {
        return software.amazon.jsii.Kernel.get(this, "reportUri", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setReportUri(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "reportUri", java.util.Objects.requireNonNull(value, "reportUri is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.cloudfront_response_headers_policy.CloudfrontResponseHeadersPolicySecurityHeadersConfigXssProtection getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.cloudfront_response_headers_policy.CloudfrontResponseHeadersPolicySecurityHeadersConfigXssProtection.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.cloudfront_response_headers_policy.CloudfrontResponseHeadersPolicySecurityHeadersConfigXssProtection value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
