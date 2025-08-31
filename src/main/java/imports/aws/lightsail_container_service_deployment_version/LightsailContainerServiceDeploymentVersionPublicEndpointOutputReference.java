package imports.aws.lightsail_container_service_deployment_version;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.820Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.lightsailContainerServiceDeploymentVersion.LightsailContainerServiceDeploymentVersionPublicEndpointOutputReference")
public class LightsailContainerServiceDeploymentVersionPublicEndpointOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected LightsailContainerServiceDeploymentVersionPublicEndpointOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected LightsailContainerServiceDeploymentVersionPublicEndpointOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public LightsailContainerServiceDeploymentVersionPublicEndpointOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void putHealthCheck(final @org.jetbrains.annotations.NotNull imports.aws.lightsail_container_service_deployment_version.LightsailContainerServiceDeploymentVersionPublicEndpointHealthCheck value) {
        software.amazon.jsii.Kernel.call(this, "putHealthCheck", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public @org.jetbrains.annotations.NotNull imports.aws.lightsail_container_service_deployment_version.LightsailContainerServiceDeploymentVersionPublicEndpointHealthCheckOutputReference getHealthCheck() {
        return software.amazon.jsii.Kernel.get(this, "healthCheck", software.amazon.jsii.NativeType.forClass(imports.aws.lightsail_container_service_deployment_version.LightsailContainerServiceDeploymentVersionPublicEndpointHealthCheckOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getContainerNameInput() {
        return software.amazon.jsii.Kernel.get(this, "containerNameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getContainerPortInput() {
        return software.amazon.jsii.Kernel.get(this, "containerPortInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.lightsail_container_service_deployment_version.LightsailContainerServiceDeploymentVersionPublicEndpointHealthCheck getHealthCheckInput() {
        return software.amazon.jsii.Kernel.get(this, "healthCheckInput", software.amazon.jsii.NativeType.forClass(imports.aws.lightsail_container_service_deployment_version.LightsailContainerServiceDeploymentVersionPublicEndpointHealthCheck.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getContainerName() {
        return software.amazon.jsii.Kernel.get(this, "containerName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setContainerName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "containerName", java.util.Objects.requireNonNull(value, "containerName is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getContainerPort() {
        return software.amazon.jsii.Kernel.get(this, "containerPort", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setContainerPort(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "containerPort", java.util.Objects.requireNonNull(value, "containerPort is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.lightsail_container_service_deployment_version.LightsailContainerServiceDeploymentVersionPublicEndpoint getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.lightsail_container_service_deployment_version.LightsailContainerServiceDeploymentVersionPublicEndpoint.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.lightsail_container_service_deployment_version.LightsailContainerServiceDeploymentVersionPublicEndpoint value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
