package imports.aws.apprunner_service;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.056Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.apprunnerService.ApprunnerServiceNetworkConfigurationEgressConfigurationOutputReference")
public class ApprunnerServiceNetworkConfigurationEgressConfigurationOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected ApprunnerServiceNetworkConfigurationEgressConfigurationOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected ApprunnerServiceNetworkConfigurationEgressConfigurationOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public ApprunnerServiceNetworkConfigurationEgressConfigurationOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetEgressType() {
        software.amazon.jsii.Kernel.call(this, "resetEgressType", software.amazon.jsii.NativeType.VOID);
    }

    public void resetVpcConnectorArn() {
        software.amazon.jsii.Kernel.call(this, "resetVpcConnectorArn", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getEgressTypeInput() {
        return software.amazon.jsii.Kernel.get(this, "egressTypeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getVpcConnectorArnInput() {
        return software.amazon.jsii.Kernel.get(this, "vpcConnectorArnInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getEgressType() {
        return software.amazon.jsii.Kernel.get(this, "egressType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setEgressType(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "egressType", java.util.Objects.requireNonNull(value, "egressType is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getVpcConnectorArn() {
        return software.amazon.jsii.Kernel.get(this, "vpcConnectorArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setVpcConnectorArn(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "vpcConnectorArn", java.util.Objects.requireNonNull(value, "vpcConnectorArn is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.apprunner_service.ApprunnerServiceNetworkConfigurationEgressConfiguration getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.apprunner_service.ApprunnerServiceNetworkConfigurationEgressConfiguration.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.apprunner_service.ApprunnerServiceNetworkConfigurationEgressConfiguration value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
