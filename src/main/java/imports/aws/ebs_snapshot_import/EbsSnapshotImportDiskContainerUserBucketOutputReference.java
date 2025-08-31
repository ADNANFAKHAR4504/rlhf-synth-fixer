package imports.aws.ebs_snapshot_import;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.064Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.ebsSnapshotImport.EbsSnapshotImportDiskContainerUserBucketOutputReference")
public class EbsSnapshotImportDiskContainerUserBucketOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected EbsSnapshotImportDiskContainerUserBucketOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected EbsSnapshotImportDiskContainerUserBucketOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public EbsSnapshotImportDiskContainerUserBucketOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getS3BucketInput() {
        return software.amazon.jsii.Kernel.get(this, "s3BucketInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getS3KeyInput() {
        return software.amazon.jsii.Kernel.get(this, "s3KeyInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getS3Bucket() {
        return software.amazon.jsii.Kernel.get(this, "s3Bucket", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setS3Bucket(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "s3Bucket", java.util.Objects.requireNonNull(value, "s3Bucket is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getS3Key() {
        return software.amazon.jsii.Kernel.get(this, "s3Key", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setS3Key(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "s3Key", java.util.Objects.requireNonNull(value, "s3Key is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.ebs_snapshot_import.EbsSnapshotImportDiskContainerUserBucket getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.ebs_snapshot_import.EbsSnapshotImportDiskContainerUserBucket.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.ebs_snapshot_import.EbsSnapshotImportDiskContainerUserBucket value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
