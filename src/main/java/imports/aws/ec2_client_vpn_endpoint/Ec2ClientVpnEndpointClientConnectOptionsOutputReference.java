package imports.aws.ec2_client_vpn_endpoint;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.072Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.ec2ClientVpnEndpoint.Ec2ClientVpnEndpointClientConnectOptionsOutputReference")
public class Ec2ClientVpnEndpointClientConnectOptionsOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected Ec2ClientVpnEndpointClientConnectOptionsOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected Ec2ClientVpnEndpointClientConnectOptionsOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public Ec2ClientVpnEndpointClientConnectOptionsOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetEnabled() {
        software.amazon.jsii.Kernel.call(this, "resetEnabled", software.amazon.jsii.NativeType.VOID);
    }

    public void resetLambdaFunctionArn() {
        software.amazon.jsii.Kernel.call(this, "resetLambdaFunctionArn", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getEnabledInput() {
        return software.amazon.jsii.Kernel.get(this, "enabledInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getLambdaFunctionArnInput() {
        return software.amazon.jsii.Kernel.get(this, "lambdaFunctionArnInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getEnabled() {
        return software.amazon.jsii.Kernel.get(this, "enabled", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setEnabled(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "enabled", java.util.Objects.requireNonNull(value, "enabled is required"));
    }

    public void setEnabled(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "enabled", java.util.Objects.requireNonNull(value, "enabled is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getLambdaFunctionArn() {
        return software.amazon.jsii.Kernel.get(this, "lambdaFunctionArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setLambdaFunctionArn(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "lambdaFunctionArn", java.util.Objects.requireNonNull(value, "lambdaFunctionArn is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.ec2_client_vpn_endpoint.Ec2ClientVpnEndpointClientConnectOptions getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.ec2_client_vpn_endpoint.Ec2ClientVpnEndpointClientConnectOptions.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.ec2_client_vpn_endpoint.Ec2ClientVpnEndpointClientConnectOptions value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
