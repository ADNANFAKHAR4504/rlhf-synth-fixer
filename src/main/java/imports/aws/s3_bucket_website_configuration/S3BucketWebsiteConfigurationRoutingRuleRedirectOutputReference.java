package imports.aws.s3_bucket_website_configuration;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.273Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.s3BucketWebsiteConfiguration.S3BucketWebsiteConfigurationRoutingRuleRedirectOutputReference")
public class S3BucketWebsiteConfigurationRoutingRuleRedirectOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected S3BucketWebsiteConfigurationRoutingRuleRedirectOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected S3BucketWebsiteConfigurationRoutingRuleRedirectOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public S3BucketWebsiteConfigurationRoutingRuleRedirectOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetHostName() {
        software.amazon.jsii.Kernel.call(this, "resetHostName", software.amazon.jsii.NativeType.VOID);
    }

    public void resetHttpRedirectCode() {
        software.amazon.jsii.Kernel.call(this, "resetHttpRedirectCode", software.amazon.jsii.NativeType.VOID);
    }

    public void resetProtocol() {
        software.amazon.jsii.Kernel.call(this, "resetProtocol", software.amazon.jsii.NativeType.VOID);
    }

    public void resetReplaceKeyPrefixWith() {
        software.amazon.jsii.Kernel.call(this, "resetReplaceKeyPrefixWith", software.amazon.jsii.NativeType.VOID);
    }

    public void resetReplaceKeyWith() {
        software.amazon.jsii.Kernel.call(this, "resetReplaceKeyWith", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getHostNameInput() {
        return software.amazon.jsii.Kernel.get(this, "hostNameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getHttpRedirectCodeInput() {
        return software.amazon.jsii.Kernel.get(this, "httpRedirectCodeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getProtocolInput() {
        return software.amazon.jsii.Kernel.get(this, "protocolInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getReplaceKeyPrefixWithInput() {
        return software.amazon.jsii.Kernel.get(this, "replaceKeyPrefixWithInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getReplaceKeyWithInput() {
        return software.amazon.jsii.Kernel.get(this, "replaceKeyWithInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getHostName() {
        return software.amazon.jsii.Kernel.get(this, "hostName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setHostName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "hostName", java.util.Objects.requireNonNull(value, "hostName is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getHttpRedirectCode() {
        return software.amazon.jsii.Kernel.get(this, "httpRedirectCode", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setHttpRedirectCode(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "httpRedirectCode", java.util.Objects.requireNonNull(value, "httpRedirectCode is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getProtocol() {
        return software.amazon.jsii.Kernel.get(this, "protocol", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setProtocol(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "protocol", java.util.Objects.requireNonNull(value, "protocol is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getReplaceKeyPrefixWith() {
        return software.amazon.jsii.Kernel.get(this, "replaceKeyPrefixWith", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setReplaceKeyPrefixWith(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "replaceKeyPrefixWith", java.util.Objects.requireNonNull(value, "replaceKeyPrefixWith is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getReplaceKeyWith() {
        return software.amazon.jsii.Kernel.get(this, "replaceKeyWith", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setReplaceKeyWith(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "replaceKeyWith", java.util.Objects.requireNonNull(value, "replaceKeyWith is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.s3_bucket_website_configuration.S3BucketWebsiteConfigurationRoutingRuleRedirect getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.s3_bucket_website_configuration.S3BucketWebsiteConfigurationRoutingRuleRedirect.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.s3_bucket_website_configuration.S3BucketWebsiteConfigurationRoutingRuleRedirect value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
