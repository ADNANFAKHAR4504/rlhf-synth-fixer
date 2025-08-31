package imports.aws.cloudformation_stack_set;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.220Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.cloudformationStackSet.CloudformationStackSetAutoDeploymentOutputReference")
public class CloudformationStackSetAutoDeploymentOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected CloudformationStackSetAutoDeploymentOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected CloudformationStackSetAutoDeploymentOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public CloudformationStackSetAutoDeploymentOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetEnabled() {
        software.amazon.jsii.Kernel.call(this, "resetEnabled", software.amazon.jsii.NativeType.VOID);
    }

    public void resetRetainStacksOnAccountRemoval() {
        software.amazon.jsii.Kernel.call(this, "resetRetainStacksOnAccountRemoval", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getEnabledInput() {
        return software.amazon.jsii.Kernel.get(this, "enabledInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getRetainStacksOnAccountRemovalInput() {
        return software.amazon.jsii.Kernel.get(this, "retainStacksOnAccountRemovalInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
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

    public @org.jetbrains.annotations.NotNull java.lang.Object getRetainStacksOnAccountRemoval() {
        return software.amazon.jsii.Kernel.get(this, "retainStacksOnAccountRemoval", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setRetainStacksOnAccountRemoval(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "retainStacksOnAccountRemoval", java.util.Objects.requireNonNull(value, "retainStacksOnAccountRemoval is required"));
    }

    public void setRetainStacksOnAccountRemoval(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "retainStacksOnAccountRemoval", java.util.Objects.requireNonNull(value, "retainStacksOnAccountRemoval is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.cloudformation_stack_set.CloudformationStackSetAutoDeployment getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.cloudformation_stack_set.CloudformationStackSetAutoDeployment.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.cloudformation_stack_set.CloudformationStackSetAutoDeployment value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
