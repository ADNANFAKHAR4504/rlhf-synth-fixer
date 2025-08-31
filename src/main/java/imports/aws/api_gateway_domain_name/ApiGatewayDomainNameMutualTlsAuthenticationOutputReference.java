package imports.aws.api_gateway_domain_name;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:45.946Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.apiGatewayDomainName.ApiGatewayDomainNameMutualTlsAuthenticationOutputReference")
public class ApiGatewayDomainNameMutualTlsAuthenticationOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected ApiGatewayDomainNameMutualTlsAuthenticationOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected ApiGatewayDomainNameMutualTlsAuthenticationOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public ApiGatewayDomainNameMutualTlsAuthenticationOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetTruststoreVersion() {
        software.amazon.jsii.Kernel.call(this, "resetTruststoreVersion", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getTruststoreUriInput() {
        return software.amazon.jsii.Kernel.get(this, "truststoreUriInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getTruststoreVersionInput() {
        return software.amazon.jsii.Kernel.get(this, "truststoreVersionInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getTruststoreUri() {
        return software.amazon.jsii.Kernel.get(this, "truststoreUri", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setTruststoreUri(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "truststoreUri", java.util.Objects.requireNonNull(value, "truststoreUri is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getTruststoreVersion() {
        return software.amazon.jsii.Kernel.get(this, "truststoreVersion", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setTruststoreVersion(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "truststoreVersion", java.util.Objects.requireNonNull(value, "truststoreVersion is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.api_gateway_domain_name.ApiGatewayDomainNameMutualTlsAuthentication getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.api_gateway_domain_name.ApiGatewayDomainNameMutualTlsAuthentication.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.api_gateway_domain_name.ApiGatewayDomainNameMutualTlsAuthentication value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
