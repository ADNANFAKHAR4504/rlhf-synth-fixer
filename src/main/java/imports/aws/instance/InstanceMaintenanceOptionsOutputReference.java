package imports.aws.instance;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.392Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.instance.InstanceMaintenanceOptionsOutputReference")
public class InstanceMaintenanceOptionsOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected InstanceMaintenanceOptionsOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected InstanceMaintenanceOptionsOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public InstanceMaintenanceOptionsOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetAutoRecovery() {
        software.amazon.jsii.Kernel.call(this, "resetAutoRecovery", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getAutoRecoveryInput() {
        return software.amazon.jsii.Kernel.get(this, "autoRecoveryInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getAutoRecovery() {
        return software.amazon.jsii.Kernel.get(this, "autoRecovery", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setAutoRecovery(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "autoRecovery", java.util.Objects.requireNonNull(value, "autoRecovery is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.instance.InstanceMaintenanceOptions getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.instance.InstanceMaintenanceOptions.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.instance.InstanceMaintenanceOptions value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
