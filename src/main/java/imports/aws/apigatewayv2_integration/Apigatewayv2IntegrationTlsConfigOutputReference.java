package imports.aws.apigatewayv2_integration;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:45.970Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.apigatewayv2Integration.Apigatewayv2IntegrationTlsConfigOutputReference")
public class Apigatewayv2IntegrationTlsConfigOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected Apigatewayv2IntegrationTlsConfigOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected Apigatewayv2IntegrationTlsConfigOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public Apigatewayv2IntegrationTlsConfigOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetServerNameToVerify() {
        software.amazon.jsii.Kernel.call(this, "resetServerNameToVerify", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getServerNameToVerifyInput() {
        return software.amazon.jsii.Kernel.get(this, "serverNameToVerifyInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getServerNameToVerify() {
        return software.amazon.jsii.Kernel.get(this, "serverNameToVerify", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setServerNameToVerify(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "serverNameToVerify", java.util.Objects.requireNonNull(value, "serverNameToVerify is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.apigatewayv2_integration.Apigatewayv2IntegrationTlsConfig getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.apigatewayv2_integration.Apigatewayv2IntegrationTlsConfig.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.apigatewayv2_integration.Apigatewayv2IntegrationTlsConfig value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
