package imports.aws.service_discovery_service;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.428Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.serviceDiscoveryService.ServiceDiscoveryServiceHealthCheckConfigOutputReference")
public class ServiceDiscoveryServiceHealthCheckConfigOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected ServiceDiscoveryServiceHealthCheckConfigOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected ServiceDiscoveryServiceHealthCheckConfigOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public ServiceDiscoveryServiceHealthCheckConfigOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetFailureThreshold() {
        software.amazon.jsii.Kernel.call(this, "resetFailureThreshold", software.amazon.jsii.NativeType.VOID);
    }

    public void resetResourcePath() {
        software.amazon.jsii.Kernel.call(this, "resetResourcePath", software.amazon.jsii.NativeType.VOID);
    }

    public void resetType() {
        software.amazon.jsii.Kernel.call(this, "resetType", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getFailureThresholdInput() {
        return software.amazon.jsii.Kernel.get(this, "failureThresholdInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getResourcePathInput() {
        return software.amazon.jsii.Kernel.get(this, "resourcePathInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getTypeInput() {
        return software.amazon.jsii.Kernel.get(this, "typeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getFailureThreshold() {
        return software.amazon.jsii.Kernel.get(this, "failureThreshold", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setFailureThreshold(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "failureThreshold", java.util.Objects.requireNonNull(value, "failureThreshold is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getResourcePath() {
        return software.amazon.jsii.Kernel.get(this, "resourcePath", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setResourcePath(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "resourcePath", java.util.Objects.requireNonNull(value, "resourcePath is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getType() {
        return software.amazon.jsii.Kernel.get(this, "type", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setType(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "type", java.util.Objects.requireNonNull(value, "type is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.service_discovery_service.ServiceDiscoveryServiceHealthCheckConfig getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.service_discovery_service.ServiceDiscoveryServiceHealthCheckConfig.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.service_discovery_service.ServiceDiscoveryServiceHealthCheckConfig value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
