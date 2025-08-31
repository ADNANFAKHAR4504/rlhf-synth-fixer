package imports.aws.cloudfront_response_headers_policy;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.249Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.cloudfrontResponseHeadersPolicy.CloudfrontResponseHeadersPolicySecurityHeadersConfigContentSecurityPolicyOutputReference")
public class CloudfrontResponseHeadersPolicySecurityHeadersConfigContentSecurityPolicyOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected CloudfrontResponseHeadersPolicySecurityHeadersConfigContentSecurityPolicyOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected CloudfrontResponseHeadersPolicySecurityHeadersConfigContentSecurityPolicyOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public CloudfrontResponseHeadersPolicySecurityHeadersConfigContentSecurityPolicyOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getContentSecurityPolicyInput() {
        return software.amazon.jsii.Kernel.get(this, "contentSecurityPolicyInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getOverrideInput() {
        return software.amazon.jsii.Kernel.get(this, "overrideInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getContentSecurityPolicy() {
        return software.amazon.jsii.Kernel.get(this, "contentSecurityPolicy", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setContentSecurityPolicy(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "contentSecurityPolicy", java.util.Objects.requireNonNull(value, "contentSecurityPolicy is required"));
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

    public @org.jetbrains.annotations.Nullable imports.aws.cloudfront_response_headers_policy.CloudfrontResponseHeadersPolicySecurityHeadersConfigContentSecurityPolicy getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.cloudfront_response_headers_policy.CloudfrontResponseHeadersPolicySecurityHeadersConfigContentSecurityPolicy.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.cloudfront_response_headers_policy.CloudfrontResponseHeadersPolicySecurityHeadersConfigContentSecurityPolicy value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
