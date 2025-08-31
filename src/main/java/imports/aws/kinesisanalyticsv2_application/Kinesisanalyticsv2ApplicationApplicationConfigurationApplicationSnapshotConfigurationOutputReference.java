package imports.aws.kinesisanalyticsv2_application;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.469Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.kinesisanalyticsv2Application.Kinesisanalyticsv2ApplicationApplicationConfigurationApplicationSnapshotConfigurationOutputReference")
public class Kinesisanalyticsv2ApplicationApplicationConfigurationApplicationSnapshotConfigurationOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected Kinesisanalyticsv2ApplicationApplicationConfigurationApplicationSnapshotConfigurationOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected Kinesisanalyticsv2ApplicationApplicationConfigurationApplicationSnapshotConfigurationOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public Kinesisanalyticsv2ApplicationApplicationConfigurationApplicationSnapshotConfigurationOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getSnapshotsEnabledInput() {
        return software.amazon.jsii.Kernel.get(this, "snapshotsEnabledInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getSnapshotsEnabled() {
        return software.amazon.jsii.Kernel.get(this, "snapshotsEnabled", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setSnapshotsEnabled(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "snapshotsEnabled", java.util.Objects.requireNonNull(value, "snapshotsEnabled is required"));
    }

    public void setSnapshotsEnabled(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "snapshotsEnabled", java.util.Objects.requireNonNull(value, "snapshotsEnabled is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.kinesisanalyticsv2_application.Kinesisanalyticsv2ApplicationApplicationConfigurationApplicationSnapshotConfiguration getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.kinesisanalyticsv2_application.Kinesisanalyticsv2ApplicationApplicationConfigurationApplicationSnapshotConfiguration.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.kinesisanalyticsv2_application.Kinesisanalyticsv2ApplicationApplicationConfigurationApplicationSnapshotConfiguration value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
