package imports.aws.sagemaker_endpoint_configuration;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.322Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.sagemakerEndpointConfiguration.SagemakerEndpointConfigurationShadowProductionVariantsManagedInstanceScalingOutputReference")
public class SagemakerEndpointConfigurationShadowProductionVariantsManagedInstanceScalingOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected SagemakerEndpointConfigurationShadowProductionVariantsManagedInstanceScalingOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected SagemakerEndpointConfigurationShadowProductionVariantsManagedInstanceScalingOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public SagemakerEndpointConfigurationShadowProductionVariantsManagedInstanceScalingOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetMaxInstanceCount() {
        software.amazon.jsii.Kernel.call(this, "resetMaxInstanceCount", software.amazon.jsii.NativeType.VOID);
    }

    public void resetMinInstanceCount() {
        software.amazon.jsii.Kernel.call(this, "resetMinInstanceCount", software.amazon.jsii.NativeType.VOID);
    }

    public void resetStatus() {
        software.amazon.jsii.Kernel.call(this, "resetStatus", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getMaxInstanceCountInput() {
        return software.amazon.jsii.Kernel.get(this, "maxInstanceCountInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getMinInstanceCountInput() {
        return software.amazon.jsii.Kernel.get(this, "minInstanceCountInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getStatusInput() {
        return software.amazon.jsii.Kernel.get(this, "statusInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getMaxInstanceCount() {
        return software.amazon.jsii.Kernel.get(this, "maxInstanceCount", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setMaxInstanceCount(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "maxInstanceCount", java.util.Objects.requireNonNull(value, "maxInstanceCount is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getMinInstanceCount() {
        return software.amazon.jsii.Kernel.get(this, "minInstanceCount", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setMinInstanceCount(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "minInstanceCount", java.util.Objects.requireNonNull(value, "minInstanceCount is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getStatus() {
        return software.amazon.jsii.Kernel.get(this, "status", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setStatus(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "status", java.util.Objects.requireNonNull(value, "status is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.sagemaker_endpoint_configuration.SagemakerEndpointConfigurationShadowProductionVariantsManagedInstanceScaling getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_endpoint_configuration.SagemakerEndpointConfigurationShadowProductionVariantsManagedInstanceScaling.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.sagemaker_endpoint_configuration.SagemakerEndpointConfigurationShadowProductionVariantsManagedInstanceScaling value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
