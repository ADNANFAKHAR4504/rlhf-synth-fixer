package imports.aws.spot_instance_request;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.489Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.spotInstanceRequest.SpotInstanceRequestMaintenanceOptionsOutputReference")
public class SpotInstanceRequestMaintenanceOptionsOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected SpotInstanceRequestMaintenanceOptionsOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected SpotInstanceRequestMaintenanceOptionsOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public SpotInstanceRequestMaintenanceOptionsOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
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

    public @org.jetbrains.annotations.Nullable imports.aws.spot_instance_request.SpotInstanceRequestMaintenanceOptions getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.spot_instance_request.SpotInstanceRequestMaintenanceOptions.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.spot_instance_request.SpotInstanceRequestMaintenanceOptions value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
