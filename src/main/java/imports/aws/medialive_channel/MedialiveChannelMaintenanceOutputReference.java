package imports.aws.medialive_channel;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.890Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.medialiveChannel.MedialiveChannelMaintenanceOutputReference")
public class MedialiveChannelMaintenanceOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected MedialiveChannelMaintenanceOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected MedialiveChannelMaintenanceOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public MedialiveChannelMaintenanceOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getMaintenanceDayInput() {
        return software.amazon.jsii.Kernel.get(this, "maintenanceDayInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getMaintenanceStartTimeInput() {
        return software.amazon.jsii.Kernel.get(this, "maintenanceStartTimeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getMaintenanceDay() {
        return software.amazon.jsii.Kernel.get(this, "maintenanceDay", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setMaintenanceDay(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "maintenanceDay", java.util.Objects.requireNonNull(value, "maintenanceDay is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getMaintenanceStartTime() {
        return software.amazon.jsii.Kernel.get(this, "maintenanceStartTime", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setMaintenanceStartTime(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "maintenanceStartTime", java.util.Objects.requireNonNull(value, "maintenanceStartTime is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.medialive_channel.MedialiveChannelMaintenance getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.medialive_channel.MedialiveChannelMaintenance.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.medialive_channel.MedialiveChannelMaintenance value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
