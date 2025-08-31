package imports.aws.fsx_ontap_volume;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.254Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.fsxOntapVolume.FsxOntapVolumeSnaplockConfigurationRetentionPeriodOutputReference")
public class FsxOntapVolumeSnaplockConfigurationRetentionPeriodOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected FsxOntapVolumeSnaplockConfigurationRetentionPeriodOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected FsxOntapVolumeSnaplockConfigurationRetentionPeriodOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public FsxOntapVolumeSnaplockConfigurationRetentionPeriodOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void putDefaultRetention(final @org.jetbrains.annotations.NotNull imports.aws.fsx_ontap_volume.FsxOntapVolumeSnaplockConfigurationRetentionPeriodDefaultRetention value) {
        software.amazon.jsii.Kernel.call(this, "putDefaultRetention", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putMaximumRetention(final @org.jetbrains.annotations.NotNull imports.aws.fsx_ontap_volume.FsxOntapVolumeSnaplockConfigurationRetentionPeriodMaximumRetention value) {
        software.amazon.jsii.Kernel.call(this, "putMaximumRetention", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putMinimumRetention(final @org.jetbrains.annotations.NotNull imports.aws.fsx_ontap_volume.FsxOntapVolumeSnaplockConfigurationRetentionPeriodMinimumRetention value) {
        software.amazon.jsii.Kernel.call(this, "putMinimumRetention", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetDefaultRetention() {
        software.amazon.jsii.Kernel.call(this, "resetDefaultRetention", software.amazon.jsii.NativeType.VOID);
    }

    public void resetMaximumRetention() {
        software.amazon.jsii.Kernel.call(this, "resetMaximumRetention", software.amazon.jsii.NativeType.VOID);
    }

    public void resetMinimumRetention() {
        software.amazon.jsii.Kernel.call(this, "resetMinimumRetention", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.fsx_ontap_volume.FsxOntapVolumeSnaplockConfigurationRetentionPeriodDefaultRetentionOutputReference getDefaultRetention() {
        return software.amazon.jsii.Kernel.get(this, "defaultRetention", software.amazon.jsii.NativeType.forClass(imports.aws.fsx_ontap_volume.FsxOntapVolumeSnaplockConfigurationRetentionPeriodDefaultRetentionOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.fsx_ontap_volume.FsxOntapVolumeSnaplockConfigurationRetentionPeriodMaximumRetentionOutputReference getMaximumRetention() {
        return software.amazon.jsii.Kernel.get(this, "maximumRetention", software.amazon.jsii.NativeType.forClass(imports.aws.fsx_ontap_volume.FsxOntapVolumeSnaplockConfigurationRetentionPeriodMaximumRetentionOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.fsx_ontap_volume.FsxOntapVolumeSnaplockConfigurationRetentionPeriodMinimumRetentionOutputReference getMinimumRetention() {
        return software.amazon.jsii.Kernel.get(this, "minimumRetention", software.amazon.jsii.NativeType.forClass(imports.aws.fsx_ontap_volume.FsxOntapVolumeSnaplockConfigurationRetentionPeriodMinimumRetentionOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.fsx_ontap_volume.FsxOntapVolumeSnaplockConfigurationRetentionPeriodDefaultRetention getDefaultRetentionInput() {
        return software.amazon.jsii.Kernel.get(this, "defaultRetentionInput", software.amazon.jsii.NativeType.forClass(imports.aws.fsx_ontap_volume.FsxOntapVolumeSnaplockConfigurationRetentionPeriodDefaultRetention.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.fsx_ontap_volume.FsxOntapVolumeSnaplockConfigurationRetentionPeriodMaximumRetention getMaximumRetentionInput() {
        return software.amazon.jsii.Kernel.get(this, "maximumRetentionInput", software.amazon.jsii.NativeType.forClass(imports.aws.fsx_ontap_volume.FsxOntapVolumeSnaplockConfigurationRetentionPeriodMaximumRetention.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.fsx_ontap_volume.FsxOntapVolumeSnaplockConfigurationRetentionPeriodMinimumRetention getMinimumRetentionInput() {
        return software.amazon.jsii.Kernel.get(this, "minimumRetentionInput", software.amazon.jsii.NativeType.forClass(imports.aws.fsx_ontap_volume.FsxOntapVolumeSnaplockConfigurationRetentionPeriodMinimumRetention.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.fsx_ontap_volume.FsxOntapVolumeSnaplockConfigurationRetentionPeriod getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.fsx_ontap_volume.FsxOntapVolumeSnaplockConfigurationRetentionPeriod.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.fsx_ontap_volume.FsxOntapVolumeSnaplockConfigurationRetentionPeriod value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
