package imports.aws.elasticsearch_domain;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.180Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.elasticsearchDomain.ElasticsearchDomainDomainEndpointOptionsOutputReference")
public class ElasticsearchDomainDomainEndpointOptionsOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected ElasticsearchDomainDomainEndpointOptionsOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected ElasticsearchDomainDomainEndpointOptionsOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public ElasticsearchDomainDomainEndpointOptionsOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetCustomEndpoint() {
        software.amazon.jsii.Kernel.call(this, "resetCustomEndpoint", software.amazon.jsii.NativeType.VOID);
    }

    public void resetCustomEndpointCertificateArn() {
        software.amazon.jsii.Kernel.call(this, "resetCustomEndpointCertificateArn", software.amazon.jsii.NativeType.VOID);
    }

    public void resetCustomEndpointEnabled() {
        software.amazon.jsii.Kernel.call(this, "resetCustomEndpointEnabled", software.amazon.jsii.NativeType.VOID);
    }

    public void resetEnforceHttps() {
        software.amazon.jsii.Kernel.call(this, "resetEnforceHttps", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTlsSecurityPolicy() {
        software.amazon.jsii.Kernel.call(this, "resetTlsSecurityPolicy", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getCustomEndpointCertificateArnInput() {
        return software.amazon.jsii.Kernel.get(this, "customEndpointCertificateArnInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getCustomEndpointEnabledInput() {
        return software.amazon.jsii.Kernel.get(this, "customEndpointEnabledInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getCustomEndpointInput() {
        return software.amazon.jsii.Kernel.get(this, "customEndpointInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getEnforceHttpsInput() {
        return software.amazon.jsii.Kernel.get(this, "enforceHttpsInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getTlsSecurityPolicyInput() {
        return software.amazon.jsii.Kernel.get(this, "tlsSecurityPolicyInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getCustomEndpoint() {
        return software.amazon.jsii.Kernel.get(this, "customEndpoint", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setCustomEndpoint(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "customEndpoint", java.util.Objects.requireNonNull(value, "customEndpoint is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getCustomEndpointCertificateArn() {
        return software.amazon.jsii.Kernel.get(this, "customEndpointCertificateArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setCustomEndpointCertificateArn(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "customEndpointCertificateArn", java.util.Objects.requireNonNull(value, "customEndpointCertificateArn is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getCustomEndpointEnabled() {
        return software.amazon.jsii.Kernel.get(this, "customEndpointEnabled", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setCustomEndpointEnabled(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "customEndpointEnabled", java.util.Objects.requireNonNull(value, "customEndpointEnabled is required"));
    }

    public void setCustomEndpointEnabled(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "customEndpointEnabled", java.util.Objects.requireNonNull(value, "customEndpointEnabled is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getEnforceHttps() {
        return software.amazon.jsii.Kernel.get(this, "enforceHttps", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setEnforceHttps(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "enforceHttps", java.util.Objects.requireNonNull(value, "enforceHttps is required"));
    }

    public void setEnforceHttps(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "enforceHttps", java.util.Objects.requireNonNull(value, "enforceHttps is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getTlsSecurityPolicy() {
        return software.amazon.jsii.Kernel.get(this, "tlsSecurityPolicy", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setTlsSecurityPolicy(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "tlsSecurityPolicy", java.util.Objects.requireNonNull(value, "tlsSecurityPolicy is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.elasticsearch_domain.ElasticsearchDomainDomainEndpointOptions getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.elasticsearch_domain.ElasticsearchDomainDomainEndpointOptions.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.elasticsearch_domain.ElasticsearchDomainDomainEndpointOptions value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
