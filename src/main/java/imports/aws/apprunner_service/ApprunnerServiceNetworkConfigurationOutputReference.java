package imports.aws.apprunner_service;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.056Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.apprunnerService.ApprunnerServiceNetworkConfigurationOutputReference")
public class ApprunnerServiceNetworkConfigurationOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected ApprunnerServiceNetworkConfigurationOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected ApprunnerServiceNetworkConfigurationOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public ApprunnerServiceNetworkConfigurationOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void putEgressConfiguration(final @org.jetbrains.annotations.NotNull imports.aws.apprunner_service.ApprunnerServiceNetworkConfigurationEgressConfiguration value) {
        software.amazon.jsii.Kernel.call(this, "putEgressConfiguration", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putIngressConfiguration(final @org.jetbrains.annotations.NotNull imports.aws.apprunner_service.ApprunnerServiceNetworkConfigurationIngressConfiguration value) {
        software.amazon.jsii.Kernel.call(this, "putIngressConfiguration", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetEgressConfiguration() {
        software.amazon.jsii.Kernel.call(this, "resetEgressConfiguration", software.amazon.jsii.NativeType.VOID);
    }

    public void resetIngressConfiguration() {
        software.amazon.jsii.Kernel.call(this, "resetIngressConfiguration", software.amazon.jsii.NativeType.VOID);
    }

    public void resetIpAddressType() {
        software.amazon.jsii.Kernel.call(this, "resetIpAddressType", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.apprunner_service.ApprunnerServiceNetworkConfigurationEgressConfigurationOutputReference getEgressConfiguration() {
        return software.amazon.jsii.Kernel.get(this, "egressConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.apprunner_service.ApprunnerServiceNetworkConfigurationEgressConfigurationOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.apprunner_service.ApprunnerServiceNetworkConfigurationIngressConfigurationOutputReference getIngressConfiguration() {
        return software.amazon.jsii.Kernel.get(this, "ingressConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.apprunner_service.ApprunnerServiceNetworkConfigurationIngressConfigurationOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.apprunner_service.ApprunnerServiceNetworkConfigurationEgressConfiguration getEgressConfigurationInput() {
        return software.amazon.jsii.Kernel.get(this, "egressConfigurationInput", software.amazon.jsii.NativeType.forClass(imports.aws.apprunner_service.ApprunnerServiceNetworkConfigurationEgressConfiguration.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.apprunner_service.ApprunnerServiceNetworkConfigurationIngressConfiguration getIngressConfigurationInput() {
        return software.amazon.jsii.Kernel.get(this, "ingressConfigurationInput", software.amazon.jsii.NativeType.forClass(imports.aws.apprunner_service.ApprunnerServiceNetworkConfigurationIngressConfiguration.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getIpAddressTypeInput() {
        return software.amazon.jsii.Kernel.get(this, "ipAddressTypeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getIpAddressType() {
        return software.amazon.jsii.Kernel.get(this, "ipAddressType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setIpAddressType(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "ipAddressType", java.util.Objects.requireNonNull(value, "ipAddressType is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.apprunner_service.ApprunnerServiceNetworkConfiguration getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.apprunner_service.ApprunnerServiceNetworkConfiguration.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.apprunner_service.ApprunnerServiceNetworkConfiguration value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
