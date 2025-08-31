package imports.aws.ecs_service;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.131Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.ecsService.EcsServiceDeploymentCircuitBreakerOutputReference")
public class EcsServiceDeploymentCircuitBreakerOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected EcsServiceDeploymentCircuitBreakerOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected EcsServiceDeploymentCircuitBreakerOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public EcsServiceDeploymentCircuitBreakerOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getEnableInput() {
        return software.amazon.jsii.Kernel.get(this, "enableInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getRollbackInput() {
        return software.amazon.jsii.Kernel.get(this, "rollbackInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getEnable() {
        return software.amazon.jsii.Kernel.get(this, "enable", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setEnable(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "enable", java.util.Objects.requireNonNull(value, "enable is required"));
    }

    public void setEnable(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "enable", java.util.Objects.requireNonNull(value, "enable is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getRollback() {
        return software.amazon.jsii.Kernel.get(this, "rollback", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setRollback(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "rollback", java.util.Objects.requireNonNull(value, "rollback is required"));
    }

    public void setRollback(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "rollback", java.util.Objects.requireNonNull(value, "rollback is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.ecs_service.EcsServiceDeploymentCircuitBreaker getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.ecs_service.EcsServiceDeploymentCircuitBreaker.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.ecs_service.EcsServiceDeploymentCircuitBreaker value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
