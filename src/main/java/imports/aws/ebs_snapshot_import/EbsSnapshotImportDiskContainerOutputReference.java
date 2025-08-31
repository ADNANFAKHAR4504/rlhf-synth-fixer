package imports.aws.ebs_snapshot_import;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.064Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.ebsSnapshotImport.EbsSnapshotImportDiskContainerOutputReference")
public class EbsSnapshotImportDiskContainerOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected EbsSnapshotImportDiskContainerOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected EbsSnapshotImportDiskContainerOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public EbsSnapshotImportDiskContainerOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void putUserBucket(final @org.jetbrains.annotations.NotNull imports.aws.ebs_snapshot_import.EbsSnapshotImportDiskContainerUserBucket value) {
        software.amazon.jsii.Kernel.call(this, "putUserBucket", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetDescription() {
        software.amazon.jsii.Kernel.call(this, "resetDescription", software.amazon.jsii.NativeType.VOID);
    }

    public void resetUrl() {
        software.amazon.jsii.Kernel.call(this, "resetUrl", software.amazon.jsii.NativeType.VOID);
    }

    public void resetUserBucket() {
        software.amazon.jsii.Kernel.call(this, "resetUserBucket", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.ebs_snapshot_import.EbsSnapshotImportDiskContainerUserBucketOutputReference getUserBucket() {
        return software.amazon.jsii.Kernel.get(this, "userBucket", software.amazon.jsii.NativeType.forClass(imports.aws.ebs_snapshot_import.EbsSnapshotImportDiskContainerUserBucketOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getDescriptionInput() {
        return software.amazon.jsii.Kernel.get(this, "descriptionInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getFormatInput() {
        return software.amazon.jsii.Kernel.get(this, "formatInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getUrlInput() {
        return software.amazon.jsii.Kernel.get(this, "urlInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.ebs_snapshot_import.EbsSnapshotImportDiskContainerUserBucket getUserBucketInput() {
        return software.amazon.jsii.Kernel.get(this, "userBucketInput", software.amazon.jsii.NativeType.forClass(imports.aws.ebs_snapshot_import.EbsSnapshotImportDiskContainerUserBucket.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDescription() {
        return software.amazon.jsii.Kernel.get(this, "description", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setDescription(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "description", java.util.Objects.requireNonNull(value, "description is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getFormat() {
        return software.amazon.jsii.Kernel.get(this, "format", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setFormat(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "format", java.util.Objects.requireNonNull(value, "format is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getUrl() {
        return software.amazon.jsii.Kernel.get(this, "url", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setUrl(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "url", java.util.Objects.requireNonNull(value, "url is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.ebs_snapshot_import.EbsSnapshotImportDiskContainer getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.ebs_snapshot_import.EbsSnapshotImportDiskContainer.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.ebs_snapshot_import.EbsSnapshotImportDiskContainer value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
