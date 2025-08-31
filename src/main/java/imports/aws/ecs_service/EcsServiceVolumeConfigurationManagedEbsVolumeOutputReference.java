package imports.aws.ecs_service;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.133Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.ecsService.EcsServiceVolumeConfigurationManagedEbsVolumeOutputReference")
public class EcsServiceVolumeConfigurationManagedEbsVolumeOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected EcsServiceVolumeConfigurationManagedEbsVolumeOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected EcsServiceVolumeConfigurationManagedEbsVolumeOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public EcsServiceVolumeConfigurationManagedEbsVolumeOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void putTagSpecifications(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.ecs_service.EcsServiceVolumeConfigurationManagedEbsVolumeTagSpecifications>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.ecs_service.EcsServiceVolumeConfigurationManagedEbsVolumeTagSpecifications> __cast_cd4240 = (java.util.List<imports.aws.ecs_service.EcsServiceVolumeConfigurationManagedEbsVolumeTagSpecifications>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.ecs_service.EcsServiceVolumeConfigurationManagedEbsVolumeTagSpecifications __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putTagSpecifications", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetEncrypted() {
        software.amazon.jsii.Kernel.call(this, "resetEncrypted", software.amazon.jsii.NativeType.VOID);
    }

    public void resetFileSystemType() {
        software.amazon.jsii.Kernel.call(this, "resetFileSystemType", software.amazon.jsii.NativeType.VOID);
    }

    public void resetIops() {
        software.amazon.jsii.Kernel.call(this, "resetIops", software.amazon.jsii.NativeType.VOID);
    }

    public void resetKmsKeyId() {
        software.amazon.jsii.Kernel.call(this, "resetKmsKeyId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSizeInGb() {
        software.amazon.jsii.Kernel.call(this, "resetSizeInGb", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSnapshotId() {
        software.amazon.jsii.Kernel.call(this, "resetSnapshotId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTagSpecifications() {
        software.amazon.jsii.Kernel.call(this, "resetTagSpecifications", software.amazon.jsii.NativeType.VOID);
    }

    public void resetThroughput() {
        software.amazon.jsii.Kernel.call(this, "resetThroughput", software.amazon.jsii.NativeType.VOID);
    }

    public void resetVolumeInitializationRate() {
        software.amazon.jsii.Kernel.call(this, "resetVolumeInitializationRate", software.amazon.jsii.NativeType.VOID);
    }

    public void resetVolumeType() {
        software.amazon.jsii.Kernel.call(this, "resetVolumeType", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.NotNull imports.aws.ecs_service.EcsServiceVolumeConfigurationManagedEbsVolumeTagSpecificationsList getTagSpecifications() {
        return software.amazon.jsii.Kernel.get(this, "tagSpecifications", software.amazon.jsii.NativeType.forClass(imports.aws.ecs_service.EcsServiceVolumeConfigurationManagedEbsVolumeTagSpecificationsList.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getEncryptedInput() {
        return software.amazon.jsii.Kernel.get(this, "encryptedInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getFileSystemTypeInput() {
        return software.amazon.jsii.Kernel.get(this, "fileSystemTypeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getIopsInput() {
        return software.amazon.jsii.Kernel.get(this, "iopsInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getKmsKeyIdInput() {
        return software.amazon.jsii.Kernel.get(this, "kmsKeyIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getRoleArnInput() {
        return software.amazon.jsii.Kernel.get(this, "roleArnInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getSizeInGbInput() {
        return software.amazon.jsii.Kernel.get(this, "sizeInGbInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getSnapshotIdInput() {
        return software.amazon.jsii.Kernel.get(this, "snapshotIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getTagSpecificationsInput() {
        return software.amazon.jsii.Kernel.get(this, "tagSpecificationsInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getThroughputInput() {
        return software.amazon.jsii.Kernel.get(this, "throughputInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getVolumeInitializationRateInput() {
        return software.amazon.jsii.Kernel.get(this, "volumeInitializationRateInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getVolumeTypeInput() {
        return software.amazon.jsii.Kernel.get(this, "volumeTypeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getEncrypted() {
        return software.amazon.jsii.Kernel.get(this, "encrypted", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setEncrypted(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "encrypted", java.util.Objects.requireNonNull(value, "encrypted is required"));
    }

    public void setEncrypted(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "encrypted", java.util.Objects.requireNonNull(value, "encrypted is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getFileSystemType() {
        return software.amazon.jsii.Kernel.get(this, "fileSystemType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setFileSystemType(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "fileSystemType", java.util.Objects.requireNonNull(value, "fileSystemType is required"));
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

    public @org.jetbrains.annotations.NotNull java.lang.String getRoleArn() {
        return software.amazon.jsii.Kernel.get(this, "roleArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setRoleArn(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "roleArn", java.util.Objects.requireNonNull(value, "roleArn is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getSizeInGb() {
        return software.amazon.jsii.Kernel.get(this, "sizeInGb", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setSizeInGb(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "sizeInGb", java.util.Objects.requireNonNull(value, "sizeInGb is required"));
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

    public @org.jetbrains.annotations.NotNull java.lang.Number getVolumeInitializationRate() {
        return software.amazon.jsii.Kernel.get(this, "volumeInitializationRate", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setVolumeInitializationRate(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "volumeInitializationRate", java.util.Objects.requireNonNull(value, "volumeInitializationRate is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getVolumeType() {
        return software.amazon.jsii.Kernel.get(this, "volumeType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setVolumeType(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "volumeType", java.util.Objects.requireNonNull(value, "volumeType is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.ecs_service.EcsServiceVolumeConfigurationManagedEbsVolume getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.ecs_service.EcsServiceVolumeConfigurationManagedEbsVolume.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.ecs_service.EcsServiceVolumeConfigurationManagedEbsVolume value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
