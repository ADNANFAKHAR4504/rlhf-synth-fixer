package imports.aws.lightsail_container_service_deployment_version;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.820Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.lightsailContainerServiceDeploymentVersion.LightsailContainerServiceDeploymentVersionPublicEndpointHealthCheckOutputReference")
public class LightsailContainerServiceDeploymentVersionPublicEndpointHealthCheckOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected LightsailContainerServiceDeploymentVersionPublicEndpointHealthCheckOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected LightsailContainerServiceDeploymentVersionPublicEndpointHealthCheckOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public LightsailContainerServiceDeploymentVersionPublicEndpointHealthCheckOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetHealthyThreshold() {
        software.amazon.jsii.Kernel.call(this, "resetHealthyThreshold", software.amazon.jsii.NativeType.VOID);
    }

    public void resetIntervalSeconds() {
        software.amazon.jsii.Kernel.call(this, "resetIntervalSeconds", software.amazon.jsii.NativeType.VOID);
    }

    public void resetPath() {
        software.amazon.jsii.Kernel.call(this, "resetPath", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSuccessCodes() {
        software.amazon.jsii.Kernel.call(this, "resetSuccessCodes", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTimeoutSeconds() {
        software.amazon.jsii.Kernel.call(this, "resetTimeoutSeconds", software.amazon.jsii.NativeType.VOID);
    }

    public void resetUnhealthyThreshold() {
        software.amazon.jsii.Kernel.call(this, "resetUnhealthyThreshold", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getHealthyThresholdInput() {
        return software.amazon.jsii.Kernel.get(this, "healthyThresholdInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getIntervalSecondsInput() {
        return software.amazon.jsii.Kernel.get(this, "intervalSecondsInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getPathInput() {
        return software.amazon.jsii.Kernel.get(this, "pathInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getSuccessCodesInput() {
        return software.amazon.jsii.Kernel.get(this, "successCodesInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getTimeoutSecondsInput() {
        return software.amazon.jsii.Kernel.get(this, "timeoutSecondsInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getUnhealthyThresholdInput() {
        return software.amazon.jsii.Kernel.get(this, "unhealthyThresholdInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getHealthyThreshold() {
        return software.amazon.jsii.Kernel.get(this, "healthyThreshold", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setHealthyThreshold(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "healthyThreshold", java.util.Objects.requireNonNull(value, "healthyThreshold is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getIntervalSeconds() {
        return software.amazon.jsii.Kernel.get(this, "intervalSeconds", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setIntervalSeconds(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "intervalSeconds", java.util.Objects.requireNonNull(value, "intervalSeconds is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getPath() {
        return software.amazon.jsii.Kernel.get(this, "path", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setPath(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "path", java.util.Objects.requireNonNull(value, "path is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getSuccessCodes() {
        return software.amazon.jsii.Kernel.get(this, "successCodes", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setSuccessCodes(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "successCodes", java.util.Objects.requireNonNull(value, "successCodes is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getTimeoutSeconds() {
        return software.amazon.jsii.Kernel.get(this, "timeoutSeconds", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setTimeoutSeconds(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "timeoutSeconds", java.util.Objects.requireNonNull(value, "timeoutSeconds is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getUnhealthyThreshold() {
        return software.amazon.jsii.Kernel.get(this, "unhealthyThreshold", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setUnhealthyThreshold(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "unhealthyThreshold", java.util.Objects.requireNonNull(value, "unhealthyThreshold is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.lightsail_container_service_deployment_version.LightsailContainerServiceDeploymentVersionPublicEndpointHealthCheck getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.lightsail_container_service_deployment_version.LightsailContainerServiceDeploymentVersionPublicEndpointHealthCheck.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.lightsail_container_service_deployment_version.LightsailContainerServiceDeploymentVersionPublicEndpointHealthCheck value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
