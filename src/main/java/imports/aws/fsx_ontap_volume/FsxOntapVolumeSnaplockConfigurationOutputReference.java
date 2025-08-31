package imports.aws.fsx_ontap_volume;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.253Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.fsxOntapVolume.FsxOntapVolumeSnaplockConfigurationOutputReference")
public class FsxOntapVolumeSnaplockConfigurationOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected FsxOntapVolumeSnaplockConfigurationOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected FsxOntapVolumeSnaplockConfigurationOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public FsxOntapVolumeSnaplockConfigurationOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void putAutocommitPeriod(final @org.jetbrains.annotations.NotNull imports.aws.fsx_ontap_volume.FsxOntapVolumeSnaplockConfigurationAutocommitPeriod value) {
        software.amazon.jsii.Kernel.call(this, "putAutocommitPeriod", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putRetentionPeriod(final @org.jetbrains.annotations.NotNull imports.aws.fsx_ontap_volume.FsxOntapVolumeSnaplockConfigurationRetentionPeriod value) {
        software.amazon.jsii.Kernel.call(this, "putRetentionPeriod", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetAuditLogVolume() {
        software.amazon.jsii.Kernel.call(this, "resetAuditLogVolume", software.amazon.jsii.NativeType.VOID);
    }

    public void resetAutocommitPeriod() {
        software.amazon.jsii.Kernel.call(this, "resetAutocommitPeriod", software.amazon.jsii.NativeType.VOID);
    }

    public void resetPrivilegedDelete() {
        software.amazon.jsii.Kernel.call(this, "resetPrivilegedDelete", software.amazon.jsii.NativeType.VOID);
    }

    public void resetRetentionPeriod() {
        software.amazon.jsii.Kernel.call(this, "resetRetentionPeriod", software.amazon.jsii.NativeType.VOID);
    }

    public void resetVolumeAppendModeEnabled() {
        software.amazon.jsii.Kernel.call(this, "resetVolumeAppendModeEnabled", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.fsx_ontap_volume.FsxOntapVolumeSnaplockConfigurationAutocommitPeriodOutputReference getAutocommitPeriod() {
        return software.amazon.jsii.Kernel.get(this, "autocommitPeriod", software.amazon.jsii.NativeType.forClass(imports.aws.fsx_ontap_volume.FsxOntapVolumeSnaplockConfigurationAutocommitPeriodOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.fsx_ontap_volume.FsxOntapVolumeSnaplockConfigurationRetentionPeriodOutputReference getRetentionPeriod() {
        return software.amazon.jsii.Kernel.get(this, "retentionPeriod", software.amazon.jsii.NativeType.forClass(imports.aws.fsx_ontap_volume.FsxOntapVolumeSnaplockConfigurationRetentionPeriodOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getAuditLogVolumeInput() {
        return software.amazon.jsii.Kernel.get(this, "auditLogVolumeInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.fsx_ontap_volume.FsxOntapVolumeSnaplockConfigurationAutocommitPeriod getAutocommitPeriodInput() {
        return software.amazon.jsii.Kernel.get(this, "autocommitPeriodInput", software.amazon.jsii.NativeType.forClass(imports.aws.fsx_ontap_volume.FsxOntapVolumeSnaplockConfigurationAutocommitPeriod.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getPrivilegedDeleteInput() {
        return software.amazon.jsii.Kernel.get(this, "privilegedDeleteInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.fsx_ontap_volume.FsxOntapVolumeSnaplockConfigurationRetentionPeriod getRetentionPeriodInput() {
        return software.amazon.jsii.Kernel.get(this, "retentionPeriodInput", software.amazon.jsii.NativeType.forClass(imports.aws.fsx_ontap_volume.FsxOntapVolumeSnaplockConfigurationRetentionPeriod.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getSnaplockTypeInput() {
        return software.amazon.jsii.Kernel.get(this, "snaplockTypeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getVolumeAppendModeEnabledInput() {
        return software.amazon.jsii.Kernel.get(this, "volumeAppendModeEnabledInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getAuditLogVolume() {
        return software.amazon.jsii.Kernel.get(this, "auditLogVolume", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setAuditLogVolume(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "auditLogVolume", java.util.Objects.requireNonNull(value, "auditLogVolume is required"));
    }

    public void setAuditLogVolume(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "auditLogVolume", java.util.Objects.requireNonNull(value, "auditLogVolume is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getPrivilegedDelete() {
        return software.amazon.jsii.Kernel.get(this, "privilegedDelete", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setPrivilegedDelete(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "privilegedDelete", java.util.Objects.requireNonNull(value, "privilegedDelete is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getSnaplockType() {
        return software.amazon.jsii.Kernel.get(this, "snaplockType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setSnaplockType(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "snaplockType", java.util.Objects.requireNonNull(value, "snaplockType is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getVolumeAppendModeEnabled() {
        return software.amazon.jsii.Kernel.get(this, "volumeAppendModeEnabled", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setVolumeAppendModeEnabled(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "volumeAppendModeEnabled", java.util.Objects.requireNonNull(value, "volumeAppendModeEnabled is required"));
    }

    public void setVolumeAppendModeEnabled(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "volumeAppendModeEnabled", java.util.Objects.requireNonNull(value, "volumeAppendModeEnabled is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.fsx_ontap_volume.FsxOntapVolumeSnaplockConfiguration getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.fsx_ontap_volume.FsxOntapVolumeSnaplockConfiguration.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.fsx_ontap_volume.FsxOntapVolumeSnaplockConfiguration value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
