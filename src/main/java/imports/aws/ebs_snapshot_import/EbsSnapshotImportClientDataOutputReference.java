package imports.aws.ebs_snapshot_import;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.064Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.ebsSnapshotImport.EbsSnapshotImportClientDataOutputReference")
public class EbsSnapshotImportClientDataOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected EbsSnapshotImportClientDataOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected EbsSnapshotImportClientDataOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public EbsSnapshotImportClientDataOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetComment() {
        software.amazon.jsii.Kernel.call(this, "resetComment", software.amazon.jsii.NativeType.VOID);
    }

    public void resetUploadEnd() {
        software.amazon.jsii.Kernel.call(this, "resetUploadEnd", software.amazon.jsii.NativeType.VOID);
    }

    public void resetUploadSize() {
        software.amazon.jsii.Kernel.call(this, "resetUploadSize", software.amazon.jsii.NativeType.VOID);
    }

    public void resetUploadStart() {
        software.amazon.jsii.Kernel.call(this, "resetUploadStart", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getCommentInput() {
        return software.amazon.jsii.Kernel.get(this, "commentInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getUploadEndInput() {
        return software.amazon.jsii.Kernel.get(this, "uploadEndInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getUploadSizeInput() {
        return software.amazon.jsii.Kernel.get(this, "uploadSizeInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getUploadStartInput() {
        return software.amazon.jsii.Kernel.get(this, "uploadStartInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getComment() {
        return software.amazon.jsii.Kernel.get(this, "comment", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setComment(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "comment", java.util.Objects.requireNonNull(value, "comment is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getUploadEnd() {
        return software.amazon.jsii.Kernel.get(this, "uploadEnd", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setUploadEnd(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "uploadEnd", java.util.Objects.requireNonNull(value, "uploadEnd is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getUploadSize() {
        return software.amazon.jsii.Kernel.get(this, "uploadSize", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setUploadSize(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "uploadSize", java.util.Objects.requireNonNull(value, "uploadSize is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getUploadStart() {
        return software.amazon.jsii.Kernel.get(this, "uploadStart", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setUploadStart(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "uploadStart", java.util.Objects.requireNonNull(value, "uploadStart is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.ebs_snapshot_import.EbsSnapshotImportClientData getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.ebs_snapshot_import.EbsSnapshotImportClientData.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.ebs_snapshot_import.EbsSnapshotImportClientData value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
