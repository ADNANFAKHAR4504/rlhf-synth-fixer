package imports.aws.ecs_service;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.132Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.ecsService.EcsServiceServiceConnectConfigurationServiceTimeoutOutputReference")
public class EcsServiceServiceConnectConfigurationServiceTimeoutOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected EcsServiceServiceConnectConfigurationServiceTimeoutOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected EcsServiceServiceConnectConfigurationServiceTimeoutOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public EcsServiceServiceConnectConfigurationServiceTimeoutOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetIdleTimeoutSeconds() {
        software.amazon.jsii.Kernel.call(this, "resetIdleTimeoutSeconds", software.amazon.jsii.NativeType.VOID);
    }

    public void resetPerRequestTimeoutSeconds() {
        software.amazon.jsii.Kernel.call(this, "resetPerRequestTimeoutSeconds", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getIdleTimeoutSecondsInput() {
        return software.amazon.jsii.Kernel.get(this, "idleTimeoutSecondsInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getPerRequestTimeoutSecondsInput() {
        return software.amazon.jsii.Kernel.get(this, "perRequestTimeoutSecondsInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getIdleTimeoutSeconds() {
        return software.amazon.jsii.Kernel.get(this, "idleTimeoutSeconds", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setIdleTimeoutSeconds(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "idleTimeoutSeconds", java.util.Objects.requireNonNull(value, "idleTimeoutSeconds is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getPerRequestTimeoutSeconds() {
        return software.amazon.jsii.Kernel.get(this, "perRequestTimeoutSeconds", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setPerRequestTimeoutSeconds(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "perRequestTimeoutSeconds", java.util.Objects.requireNonNull(value, "perRequestTimeoutSeconds is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.ecs_service.EcsServiceServiceConnectConfigurationServiceTimeout getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.ecs_service.EcsServiceServiceConnectConfigurationServiceTimeout.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.ecs_service.EcsServiceServiceConnectConfigurationServiceTimeout value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
