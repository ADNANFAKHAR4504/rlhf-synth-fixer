package imports.aws.imagebuilder_image_recipe;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.360Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.imagebuilderImageRecipe.ImagebuilderImageRecipeBlockDeviceMappingEbsOutputReference")
public class ImagebuilderImageRecipeBlockDeviceMappingEbsOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected ImagebuilderImageRecipeBlockDeviceMappingEbsOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected ImagebuilderImageRecipeBlockDeviceMappingEbsOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public ImagebuilderImageRecipeBlockDeviceMappingEbsOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetDeleteOnTermination() {
        software.amazon.jsii.Kernel.call(this, "resetDeleteOnTermination", software.amazon.jsii.NativeType.VOID);
    }

    public void resetEncrypted() {
        software.amazon.jsii.Kernel.call(this, "resetEncrypted", software.amazon.jsii.NativeType.VOID);
    }

    public void resetIops() {
        software.amazon.jsii.Kernel.call(this, "resetIops", software.amazon.jsii.NativeType.VOID);
    }

    public void resetKmsKeyId() {
        software.amazon.jsii.Kernel.call(this, "resetKmsKeyId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSnapshotId() {
        software.amazon.jsii.Kernel.call(this, "resetSnapshotId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetThroughput() {
        software.amazon.jsii.Kernel.call(this, "resetThroughput", software.amazon.jsii.NativeType.VOID);
    }

    public void resetVolumeSize() {
        software.amazon.jsii.Kernel.call(this, "resetVolumeSize", software.amazon.jsii.NativeType.VOID);
    }

    public void resetVolumeType() {
        software.amazon.jsii.Kernel.call(this, "resetVolumeType", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getDeleteOnTerminationInput() {
        return software.amazon.jsii.Kernel.get(this, "deleteOnTerminationInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getEncryptedInput() {
        return software.amazon.jsii.Kernel.get(this, "encryptedInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getIopsInput() {
        return software.amazon.jsii.Kernel.get(this, "iopsInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getKmsKeyIdInput() {
        return software.amazon.jsii.Kernel.get(this, "kmsKeyIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getSnapshotIdInput() {
        return software.amazon.jsii.Kernel.get(this, "snapshotIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getThroughputInput() {
        return software.amazon.jsii.Kernel.get(this, "throughputInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getVolumeSizeInput() {
        return software.amazon.jsii.Kernel.get(this, "volumeSizeInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getVolumeTypeInput() {
        return software.amazon.jsii.Kernel.get(this, "volumeTypeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDeleteOnTermination() {
        return software.amazon.jsii.Kernel.get(this, "deleteOnTermination", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setDeleteOnTermination(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "deleteOnTermination", java.util.Objects.requireNonNull(value, "deleteOnTermination is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getEncrypted() {
        return software.amazon.jsii.Kernel.get(this, "encrypted", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setEncrypted(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "encrypted", java.util.Objects.requireNonNull(value, "encrypted is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getIops() {
        return software.amazon.jsii.Kernel.get(this, "iops", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setIops(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "iops", java.util.Objects.requireNonNull(value, "iops is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getKmsKeyId() {
        return software.amazon.jsii.Kernel.get(this, "kmsKeyId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setKmsKeyId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "kmsKeyId", java.util.Objects.requireNonNull(value, "kmsKeyId is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getSnapshotId() {
        return software.amazon.jsii.Kernel.get(this, "snapshotId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setSnapshotId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "snapshotId", java.util.Objects.requireNonNull(value, "snapshotId is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getThroughput() {
        return software.amazon.jsii.Kernel.get(this, "throughput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setThroughput(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "throughput", java.util.Objects.requireNonNull(value, "throughput is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getVolumeSize() {
        return software.amazon.jsii.Kernel.get(this, "volumeSize", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setVolumeSize(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "volumeSize", java.util.Objects.requireNonNull(value, "volumeSize is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getVolumeType() {
        return software.amazon.jsii.Kernel.get(this, "volumeType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setVolumeType(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "volumeType", java.util.Objects.requireNonNull(value, "volumeType is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.imagebuilder_image_recipe.ImagebuilderImageRecipeBlockDeviceMappingEbs getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.imagebuilder_image_recipe.ImagebuilderImageRecipeBlockDeviceMappingEbs.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.imagebuilder_image_recipe.ImagebuilderImageRecipeBlockDeviceMappingEbs value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
