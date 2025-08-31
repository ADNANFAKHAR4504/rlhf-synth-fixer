package imports.aws.cloudfront_response_headers_policy;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.249Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.cloudfrontResponseHeadersPolicy.CloudfrontResponseHeadersPolicySecurityHeadersConfigOutputReference")
public class CloudfrontResponseHeadersPolicySecurityHeadersConfigOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected CloudfrontResponseHeadersPolicySecurityHeadersConfigOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected CloudfrontResponseHeadersPolicySecurityHeadersConfigOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public CloudfrontResponseHeadersPolicySecurityHeadersConfigOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void putContentSecurityPolicy(final @org.jetbrains.annotations.NotNull imports.aws.cloudfront_response_headers_policy.CloudfrontResponseHeadersPolicySecurityHeadersConfigContentSecurityPolicy value) {
        software.amazon.jsii.Kernel.call(this, "putContentSecurityPolicy", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putContentTypeOptions(final @org.jetbrains.annotations.NotNull imports.aws.cloudfront_response_headers_policy.CloudfrontResponseHeadersPolicySecurityHeadersConfigContentTypeOptions value) {
        software.amazon.jsii.Kernel.call(this, "putContentTypeOptions", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putFrameOptions(final @org.jetbrains.annotations.NotNull imports.aws.cloudfront_response_headers_policy.CloudfrontResponseHeadersPolicySecurityHeadersConfigFrameOptions value) {
        software.amazon.jsii.Kernel.call(this, "putFrameOptions", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putReferrerPolicy(final @org.jetbrains.annotations.NotNull imports.aws.cloudfront_response_headers_policy.CloudfrontResponseHeadersPolicySecurityHeadersConfigReferrerPolicy value) {
        software.amazon.jsii.Kernel.call(this, "putReferrerPolicy", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putStrictTransportSecurity(final @org.jetbrains.annotations.NotNull imports.aws.cloudfront_response_headers_policy.CloudfrontResponseHeadersPolicySecurityHeadersConfigStrictTransportSecurity value) {
        software.amazon.jsii.Kernel.call(this, "putStrictTransportSecurity", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putXssProtection(final @org.jetbrains.annotations.NotNull imports.aws.cloudfront_response_headers_policy.CloudfrontResponseHeadersPolicySecurityHeadersConfigXssProtection value) {
        software.amazon.jsii.Kernel.call(this, "putXssProtection", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetContentSecurityPolicy() {
        software.amazon.jsii.Kernel.call(this, "resetContentSecurityPolicy", software.amazon.jsii.NativeType.VOID);
    }

    public void resetContentTypeOptions() {
        software.amazon.jsii.Kernel.call(this, "resetContentTypeOptions", software.amazon.jsii.NativeType.VOID);
    }

    public void resetFrameOptions() {
        software.amazon.jsii.Kernel.call(this, "resetFrameOptions", software.amazon.jsii.NativeType.VOID);
    }

    public void resetReferrerPolicy() {
        software.amazon.jsii.Kernel.call(this, "resetReferrerPolicy", software.amazon.jsii.NativeType.VOID);
    }

    public void resetStrictTransportSecurity() {
        software.amazon.jsii.Kernel.call(this, "resetStrictTransportSecurity", software.amazon.jsii.NativeType.VOID);
    }

    public void resetXssProtection() {
        software.amazon.jsii.Kernel.call(this, "resetXssProtection", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.cloudfront_response_headers_policy.CloudfrontResponseHeadersPolicySecurityHeadersConfigContentSecurityPolicyOutputReference getContentSecurityPolicy() {
        return software.amazon.jsii.Kernel.get(this, "contentSecurityPolicy", software.amazon.jsii.NativeType.forClass(imports.aws.cloudfront_response_headers_policy.CloudfrontResponseHeadersPolicySecurityHeadersConfigContentSecurityPolicyOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.cloudfront_response_headers_policy.CloudfrontResponseHeadersPolicySecurityHeadersConfigContentTypeOptionsOutputReference getContentTypeOptions() {
        return software.amazon.jsii.Kernel.get(this, "contentTypeOptions", software.amazon.jsii.NativeType.forClass(imports.aws.cloudfront_response_headers_policy.CloudfrontResponseHeadersPolicySecurityHeadersConfigContentTypeOptionsOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.cloudfront_response_headers_policy.CloudfrontResponseHeadersPolicySecurityHeadersConfigFrameOptionsOutputReference getFrameOptions() {
        return software.amazon.jsii.Kernel.get(this, "frameOptions", software.amazon.jsii.NativeType.forClass(imports.aws.cloudfront_response_headers_policy.CloudfrontResponseHeadersPolicySecurityHeadersConfigFrameOptionsOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.cloudfront_response_headers_policy.CloudfrontResponseHeadersPolicySecurityHeadersConfigReferrerPolicyOutputReference getReferrerPolicy() {
        return software.amazon.jsii.Kernel.get(this, "referrerPolicy", software.amazon.jsii.NativeType.forClass(imports.aws.cloudfront_response_headers_policy.CloudfrontResponseHeadersPolicySecurityHeadersConfigReferrerPolicyOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.cloudfront_response_headers_policy.CloudfrontResponseHeadersPolicySecurityHeadersConfigStrictTransportSecurityOutputReference getStrictTransportSecurity() {
        return software.amazon.jsii.Kernel.get(this, "strictTransportSecurity", software.amazon.jsii.NativeType.forClass(imports.aws.cloudfront_response_headers_policy.CloudfrontResponseHeadersPolicySecurityHeadersConfigStrictTransportSecurityOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.cloudfront_response_headers_policy.CloudfrontResponseHeadersPolicySecurityHeadersConfigXssProtectionOutputReference getXssProtection() {
        return software.amazon.jsii.Kernel.get(this, "xssProtection", software.amazon.jsii.NativeType.forClass(imports.aws.cloudfront_response_headers_policy.CloudfrontResponseHeadersPolicySecurityHeadersConfigXssProtectionOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.cloudfront_response_headers_policy.CloudfrontResponseHeadersPolicySecurityHeadersConfigContentSecurityPolicy getContentSecurityPolicyInput() {
        return software.amazon.jsii.Kernel.get(this, "contentSecurityPolicyInput", software.amazon.jsii.NativeType.forClass(imports.aws.cloudfront_response_headers_policy.CloudfrontResponseHeadersPolicySecurityHeadersConfigContentSecurityPolicy.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.cloudfront_response_headers_policy.CloudfrontResponseHeadersPolicySecurityHeadersConfigContentTypeOptions getContentTypeOptionsInput() {
        return software.amazon.jsii.Kernel.get(this, "contentTypeOptionsInput", software.amazon.jsii.NativeType.forClass(imports.aws.cloudfront_response_headers_policy.CloudfrontResponseHeadersPolicySecurityHeadersConfigContentTypeOptions.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.cloudfront_response_headers_policy.CloudfrontResponseHeadersPolicySecurityHeadersConfigFrameOptions getFrameOptionsInput() {
        return software.amazon.jsii.Kernel.get(this, "frameOptionsInput", software.amazon.jsii.NativeType.forClass(imports.aws.cloudfront_response_headers_policy.CloudfrontResponseHeadersPolicySecurityHeadersConfigFrameOptions.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.cloudfront_response_headers_policy.CloudfrontResponseHeadersPolicySecurityHeadersConfigReferrerPolicy getReferrerPolicyInput() {
        return software.amazon.jsii.Kernel.get(this, "referrerPolicyInput", software.amazon.jsii.NativeType.forClass(imports.aws.cloudfront_response_headers_policy.CloudfrontResponseHeadersPolicySecurityHeadersConfigReferrerPolicy.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.cloudfront_response_headers_policy.CloudfrontResponseHeadersPolicySecurityHeadersConfigStrictTransportSecurity getStrictTransportSecurityInput() {
        return software.amazon.jsii.Kernel.get(this, "strictTransportSecurityInput", software.amazon.jsii.NativeType.forClass(imports.aws.cloudfront_response_headers_policy.CloudfrontResponseHeadersPolicySecurityHeadersConfigStrictTransportSecurity.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.cloudfront_response_headers_policy.CloudfrontResponseHeadersPolicySecurityHeadersConfigXssProtection getXssProtectionInput() {
        return software.amazon.jsii.Kernel.get(this, "xssProtectionInput", software.amazon.jsii.NativeType.forClass(imports.aws.cloudfront_response_headers_policy.CloudfrontResponseHeadersPolicySecurityHeadersConfigXssProtection.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.cloudfront_response_headers_policy.CloudfrontResponseHeadersPolicySecurityHeadersConfig getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.cloudfront_response_headers_policy.CloudfrontResponseHeadersPolicySecurityHeadersConfig.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.cloudfront_response_headers_policy.CloudfrontResponseHeadersPolicySecurityHeadersConfig value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
