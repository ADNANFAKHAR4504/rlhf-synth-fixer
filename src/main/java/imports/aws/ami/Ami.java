package imports.aws.ami;

/**
 * Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ami aws_ami}.
 */
@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:45.922Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.ami.Ami")
public class Ami extends com.hashicorp.cdktf.TerraformResource {

    protected Ami(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected Ami(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    static {
        TF_RESOURCE_TYPE = software.amazon.jsii.JsiiObject.jsiiStaticGet(imports.aws.ami.Ami.class, "tfResourceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    /**
     * Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ami aws_ami} Resource.
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param id The scoped construct ID. This parameter is required.
     * @param config This parameter is required.
     */
    public Ami(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String id, final @org.jetbrains.annotations.NotNull imports.aws.ami.AmiConfig config) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(id, "id is required"), java.util.Objects.requireNonNull(config, "config is required") });
    }

    /**
     * Generates CDKTF code for importing a Ami resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the Ami to import. This parameter is required.
     * @param importFromId The id of the existing Ami that should be imported. This parameter is required.
     * @param provider ? Optional instance of the provider where the Ami to import is found.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId, final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.TerraformProvider provider) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.ami.Ami.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required"), provider });
    }

    /**
     * Generates CDKTF code for importing a Ami resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the Ami to import. This parameter is required.
     * @param importFromId The id of the existing Ami that should be imported. This parameter is required.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.ami.Ami.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required") });
    }

    public void putEbsBlockDevice(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.ami.AmiEbsBlockDevice>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.ami.AmiEbsBlockDevice> __cast_cd4240 = (java.util.List<imports.aws.ami.AmiEbsBlockDevice>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.ami.AmiEbsBlockDevice __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putEbsBlockDevice", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putEphemeralBlockDevice(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.ami.AmiEphemeralBlockDevice>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.ami.AmiEphemeralBlockDevice> __cast_cd4240 = (java.util.List<imports.aws.ami.AmiEphemeralBlockDevice>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.ami.AmiEphemeralBlockDevice __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putEphemeralBlockDevice", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putTimeouts(final @org.jetbrains.annotations.NotNull imports.aws.ami.AmiTimeouts value) {
        software.amazon.jsii.Kernel.call(this, "putTimeouts", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetArchitecture() {
        software.amazon.jsii.Kernel.call(this, "resetArchitecture", software.amazon.jsii.NativeType.VOID);
    }

    public void resetBootMode() {
        software.amazon.jsii.Kernel.call(this, "resetBootMode", software.amazon.jsii.NativeType.VOID);
    }

    public void resetDeprecationTime() {
        software.amazon.jsii.Kernel.call(this, "resetDeprecationTime", software.amazon.jsii.NativeType.VOID);
    }

    public void resetDescription() {
        software.amazon.jsii.Kernel.call(this, "resetDescription", software.amazon.jsii.NativeType.VOID);
    }

    public void resetEbsBlockDevice() {
        software.amazon.jsii.Kernel.call(this, "resetEbsBlockDevice", software.amazon.jsii.NativeType.VOID);
    }

    public void resetEnaSupport() {
        software.amazon.jsii.Kernel.call(this, "resetEnaSupport", software.amazon.jsii.NativeType.VOID);
    }

    public void resetEphemeralBlockDevice() {
        software.amazon.jsii.Kernel.call(this, "resetEphemeralBlockDevice", software.amazon.jsii.NativeType.VOID);
    }

    public void resetId() {
        software.amazon.jsii.Kernel.call(this, "resetId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetImageLocation() {
        software.amazon.jsii.Kernel.call(this, "resetImageLocation", software.amazon.jsii.NativeType.VOID);
    }

    public void resetImdsSupport() {
        software.amazon.jsii.Kernel.call(this, "resetImdsSupport", software.amazon.jsii.NativeType.VOID);
    }

    public void resetKernelId() {
        software.amazon.jsii.Kernel.call(this, "resetKernelId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetRamdiskId() {
        software.amazon.jsii.Kernel.call(this, "resetRamdiskId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetRootDeviceName() {
        software.amazon.jsii.Kernel.call(this, "resetRootDeviceName", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSriovNetSupport() {
        software.amazon.jsii.Kernel.call(this, "resetSriovNetSupport", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTags() {
        software.amazon.jsii.Kernel.call(this, "resetTags", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTagsAll() {
        software.amazon.jsii.Kernel.call(this, "resetTagsAll", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTimeouts() {
        software.amazon.jsii.Kernel.call(this, "resetTimeouts", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTpmSupport() {
        software.amazon.jsii.Kernel.call(this, "resetTpmSupport", software.amazon.jsii.NativeType.VOID);
    }

    public void resetUefiData() {
        software.amazon.jsii.Kernel.call(this, "resetUefiData", software.amazon.jsii.NativeType.VOID);
    }

    public void resetVirtualizationType() {
        software.amazon.jsii.Kernel.call(this, "resetVirtualizationType", software.amazon.jsii.NativeType.VOID);
    }

    @Override
    protected @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.Object> synthesizeAttributes() {
        return java.util.Collections.unmodifiableMap(software.amazon.jsii.Kernel.call(this, "synthesizeAttributes", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.Object.class))));
    }

    @Override
    protected @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.Object> synthesizeHclAttributes() {
        return java.util.Collections.unmodifiableMap(software.amazon.jsii.Kernel.call(this, "synthesizeHclAttributes", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.Object.class))));
    }

    public final static java.lang.String TF_RESOURCE_TYPE;

    public @org.jetbrains.annotations.NotNull java.lang.String getArn() {
        return software.amazon.jsii.Kernel.get(this, "arn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.ami.AmiEbsBlockDeviceList getEbsBlockDevice() {
        return software.amazon.jsii.Kernel.get(this, "ebsBlockDevice", software.amazon.jsii.NativeType.forClass(imports.aws.ami.AmiEbsBlockDeviceList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.ami.AmiEphemeralBlockDeviceList getEphemeralBlockDevice() {
        return software.amazon.jsii.Kernel.get(this, "ephemeralBlockDevice", software.amazon.jsii.NativeType.forClass(imports.aws.ami.AmiEphemeralBlockDeviceList.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getHypervisor() {
        return software.amazon.jsii.Kernel.get(this, "hypervisor", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getImageOwnerAlias() {
        return software.amazon.jsii.Kernel.get(this, "imageOwnerAlias", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getImageType() {
        return software.amazon.jsii.Kernel.get(this, "imageType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getLastLaunchedTime() {
        return software.amazon.jsii.Kernel.get(this, "lastLaunchedTime", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable getManageEbsSnapshots() {
        return software.amazon.jsii.Kernel.get(this, "manageEbsSnapshots", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.IResolvable.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getOwnerId() {
        return software.amazon.jsii.Kernel.get(this, "ownerId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getPlatform() {
        return software.amazon.jsii.Kernel.get(this, "platform", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getPlatformDetails() {
        return software.amazon.jsii.Kernel.get(this, "platformDetails", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable getPublicValue() {
        return software.amazon.jsii.Kernel.get(this, "public", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.IResolvable.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getRootSnapshotId() {
        return software.amazon.jsii.Kernel.get(this, "rootSnapshotId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.ami.AmiTimeoutsOutputReference getTimeouts() {
        return software.amazon.jsii.Kernel.get(this, "timeouts", software.amazon.jsii.NativeType.forClass(imports.aws.ami.AmiTimeoutsOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getUsageOperation() {
        return software.amazon.jsii.Kernel.get(this, "usageOperation", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getArchitectureInput() {
        return software.amazon.jsii.Kernel.get(this, "architectureInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getBootModeInput() {
        return software.amazon.jsii.Kernel.get(this, "bootModeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getDeprecationTimeInput() {
        return software.amazon.jsii.Kernel.get(this, "deprecationTimeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getDescriptionInput() {
        return software.amazon.jsii.Kernel.get(this, "descriptionInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getEbsBlockDeviceInput() {
        return software.amazon.jsii.Kernel.get(this, "ebsBlockDeviceInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getEnaSupportInput() {
        return software.amazon.jsii.Kernel.get(this, "enaSupportInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getEphemeralBlockDeviceInput() {
        return software.amazon.jsii.Kernel.get(this, "ephemeralBlockDeviceInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getIdInput() {
        return software.amazon.jsii.Kernel.get(this, "idInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getImageLocationInput() {
        return software.amazon.jsii.Kernel.get(this, "imageLocationInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getImdsSupportInput() {
        return software.amazon.jsii.Kernel.get(this, "imdsSupportInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getKernelIdInput() {
        return software.amazon.jsii.Kernel.get(this, "kernelIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getNameInput() {
        return software.amazon.jsii.Kernel.get(this, "nameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getRamdiskIdInput() {
        return software.amazon.jsii.Kernel.get(this, "ramdiskIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getRootDeviceNameInput() {
        return software.amazon.jsii.Kernel.get(this, "rootDeviceNameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getSriovNetSupportInput() {
        return software.amazon.jsii.Kernel.get(this, "sriovNetSupportInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsAllInput() {
        return java.util.Optional.ofNullable((java.util.Map<java.lang.String, java.lang.String>)(software.amazon.jsii.Kernel.get(this, "tagsAllInput", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableMap).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsInput() {
        return java.util.Optional.ofNullable((java.util.Map<java.lang.String, java.lang.String>)(software.amazon.jsii.Kernel.get(this, "tagsInput", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableMap).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getTimeoutsInput() {
        return software.amazon.jsii.Kernel.get(this, "timeoutsInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getTpmSupportInput() {
        return software.amazon.jsii.Kernel.get(this, "tpmSupportInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getUefiDataInput() {
        return software.amazon.jsii.Kernel.get(this, "uefiDataInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getVirtualizationTypeInput() {
        return software.amazon.jsii.Kernel.get(this, "virtualizationTypeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getArchitecture() {
        return software.amazon.jsii.Kernel.get(this, "architecture", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setArchitecture(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "architecture", java.util.Objects.requireNonNull(value, "architecture is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getBootMode() {
        return software.amazon.jsii.Kernel.get(this, "bootMode", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setBootMode(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "bootMode", java.util.Objects.requireNonNull(value, "bootMode is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDeprecationTime() {
        return software.amazon.jsii.Kernel.get(this, "deprecationTime", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setDeprecationTime(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "deprecationTime", java.util.Objects.requireNonNull(value, "deprecationTime is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDescription() {
        return software.amazon.jsii.Kernel.get(this, "description", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setDescription(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "description", java.util.Objects.requireNonNull(value, "description is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getEnaSupport() {
        return software.amazon.jsii.Kernel.get(this, "enaSupport", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setEnaSupport(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "enaSupport", java.util.Objects.requireNonNull(value, "enaSupport is required"));
    }

    public void setEnaSupport(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "enaSupport", java.util.Objects.requireNonNull(value, "enaSupport is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getId() {
        return software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "id", java.util.Objects.requireNonNull(value, "id is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getImageLocation() {
        return software.amazon.jsii.Kernel.get(this, "imageLocation", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setImageLocation(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "imageLocation", java.util.Objects.requireNonNull(value, "imageLocation is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getImdsSupport() {
        return software.amazon.jsii.Kernel.get(this, "imdsSupport", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setImdsSupport(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "imdsSupport", java.util.Objects.requireNonNull(value, "imdsSupport is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getKernelId() {
        return software.amazon.jsii.Kernel.get(this, "kernelId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setKernelId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "kernelId", java.util.Objects.requireNonNull(value, "kernelId is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getName() {
        return software.amazon.jsii.Kernel.get(this, "name", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "name", java.util.Objects.requireNonNull(value, "name is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getRamdiskId() {
        return software.amazon.jsii.Kernel.get(this, "ramdiskId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setRamdiskId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "ramdiskId", java.util.Objects.requireNonNull(value, "ramdiskId is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getRootDeviceName() {
        return software.amazon.jsii.Kernel.get(this, "rootDeviceName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setRootDeviceName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "rootDeviceName", java.util.Objects.requireNonNull(value, "rootDeviceName is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getSriovNetSupport() {
        return software.amazon.jsii.Kernel.get(this, "sriovNetSupport", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setSriovNetSupport(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "sriovNetSupport", java.util.Objects.requireNonNull(value, "sriovNetSupport is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> getTags() {
        return java.util.Collections.unmodifiableMap(software.amazon.jsii.Kernel.get(this, "tags", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setTags(final @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "tags", java.util.Objects.requireNonNull(value, "tags is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> getTagsAll() {
        return java.util.Collections.unmodifiableMap(software.amazon.jsii.Kernel.get(this, "tagsAll", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setTagsAll(final @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "tagsAll", java.util.Objects.requireNonNull(value, "tagsAll is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getTpmSupport() {
        return software.amazon.jsii.Kernel.get(this, "tpmSupport", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setTpmSupport(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "tpmSupport", java.util.Objects.requireNonNull(value, "tpmSupport is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getUefiData() {
        return software.amazon.jsii.Kernel.get(this, "uefiData", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setUefiData(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "uefiData", java.util.Objects.requireNonNull(value, "uefiData is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getVirtualizationType() {
        return software.amazon.jsii.Kernel.get(this, "virtualizationType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setVirtualizationType(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "virtualizationType", java.util.Objects.requireNonNull(value, "virtualizationType is required"));
    }

    /**
     * A fluent builder for {@link imports.aws.ami.Ami}.
     */
    public static final class Builder implements software.amazon.jsii.Builder<imports.aws.ami.Ami> {
        /**
         * @return a new instance of {@link Builder}.
         * @param scope The scope in which to define this construct. This parameter is required.
         * @param id The scoped construct ID. This parameter is required.
         */
        public static Builder create(final software.constructs.Construct scope, final java.lang.String id) {
            return new Builder(scope, id);
        }

        private final software.constructs.Construct scope;
        private final java.lang.String id;
        private final imports.aws.ami.AmiConfig.Builder config;

        private Builder(final software.constructs.Construct scope, final java.lang.String id) {
            this.scope = scope;
            this.id = id;
            this.config = new imports.aws.ami.AmiConfig.Builder();
        }

        /**
         * @return {@code this}
         * @param connection This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(final com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.config.connection(connection);
            return this;
        }
        /**
         * @return {@code this}
         * @param connection This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(final com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.config.connection(connection);
            return this;
        }

        /**
         * @return {@code this}
         * @param count This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(final java.lang.Number count) {
            this.config.count(count);
            return this;
        }
        /**
         * @return {@code this}
         * @param count This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(final com.hashicorp.cdktf.TerraformCount count) {
            this.config.count(count);
            return this;
        }

        /**
         * @return {@code this}
         * @param dependsOn This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder dependsOn(final java.util.List<? extends com.hashicorp.cdktf.ITerraformDependable> dependsOn) {
            this.config.dependsOn(dependsOn);
            return this;
        }

        /**
         * @return {@code this}
         * @param forEach This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(final com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.config.forEach(forEach);
            return this;
        }

        /**
         * @return {@code this}
         * @param lifecycle This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(final com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.config.lifecycle(lifecycle);
            return this;
        }

        /**
         * @return {@code this}
         * @param provider This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(final com.hashicorp.cdktf.TerraformProvider provider) {
            this.config.provider(provider);
            return this;
        }

        /**
         * @return {@code this}
         * @param provisioners This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provisioners(final java.util.List<? extends java.lang.Object> provisioners) {
            this.config.provisioners(provisioners);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ami#name Ami#name}.
         * <p>
         * @return {@code this}
         * @param name Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ami#name Ami#name}. This parameter is required.
         */
        public Builder name(final java.lang.String name) {
            this.config.name(name);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ami#architecture Ami#architecture}.
         * <p>
         * @return {@code this}
         * @param architecture Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ami#architecture Ami#architecture}. This parameter is required.
         */
        public Builder architecture(final java.lang.String architecture) {
            this.config.architecture(architecture);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ami#boot_mode Ami#boot_mode}.
         * <p>
         * @return {@code this}
         * @param bootMode Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ami#boot_mode Ami#boot_mode}. This parameter is required.
         */
        public Builder bootMode(final java.lang.String bootMode) {
            this.config.bootMode(bootMode);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ami#deprecation_time Ami#deprecation_time}.
         * <p>
         * @return {@code this}
         * @param deprecationTime Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ami#deprecation_time Ami#deprecation_time}. This parameter is required.
         */
        public Builder deprecationTime(final java.lang.String deprecationTime) {
            this.config.deprecationTime(deprecationTime);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ami#description Ami#description}.
         * <p>
         * @return {@code this}
         * @param description Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ami#description Ami#description}. This parameter is required.
         */
        public Builder description(final java.lang.String description) {
            this.config.description(description);
            return this;
        }

        /**
         * ebs_block_device block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ami#ebs_block_device Ami#ebs_block_device}
         * <p>
         * @return {@code this}
         * @param ebsBlockDevice ebs_block_device block. This parameter is required.
         */
        public Builder ebsBlockDevice(final com.hashicorp.cdktf.IResolvable ebsBlockDevice) {
            this.config.ebsBlockDevice(ebsBlockDevice);
            return this;
        }
        /**
         * ebs_block_device block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ami#ebs_block_device Ami#ebs_block_device}
         * <p>
         * @return {@code this}
         * @param ebsBlockDevice ebs_block_device block. This parameter is required.
         */
        public Builder ebsBlockDevice(final java.util.List<? extends imports.aws.ami.AmiEbsBlockDevice> ebsBlockDevice) {
            this.config.ebsBlockDevice(ebsBlockDevice);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ami#ena_support Ami#ena_support}.
         * <p>
         * @return {@code this}
         * @param enaSupport Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ami#ena_support Ami#ena_support}. This parameter is required.
         */
        public Builder enaSupport(final java.lang.Boolean enaSupport) {
            this.config.enaSupport(enaSupport);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ami#ena_support Ami#ena_support}.
         * <p>
         * @return {@code this}
         * @param enaSupport Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ami#ena_support Ami#ena_support}. This parameter is required.
         */
        public Builder enaSupport(final com.hashicorp.cdktf.IResolvable enaSupport) {
            this.config.enaSupport(enaSupport);
            return this;
        }

        /**
         * ephemeral_block_device block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ami#ephemeral_block_device Ami#ephemeral_block_device}
         * <p>
         * @return {@code this}
         * @param ephemeralBlockDevice ephemeral_block_device block. This parameter is required.
         */
        public Builder ephemeralBlockDevice(final com.hashicorp.cdktf.IResolvable ephemeralBlockDevice) {
            this.config.ephemeralBlockDevice(ephemeralBlockDevice);
            return this;
        }
        /**
         * ephemeral_block_device block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ami#ephemeral_block_device Ami#ephemeral_block_device}
         * <p>
         * @return {@code this}
         * @param ephemeralBlockDevice ephemeral_block_device block. This parameter is required.
         */
        public Builder ephemeralBlockDevice(final java.util.List<? extends imports.aws.ami.AmiEphemeralBlockDevice> ephemeralBlockDevice) {
            this.config.ephemeralBlockDevice(ephemeralBlockDevice);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ami#id Ami#id}.
         * <p>
         * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * <p>
         * @return {@code this}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ami#id Ami#id}. This parameter is required.
         */
        public Builder id(final java.lang.String id) {
            this.config.id(id);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ami#image_location Ami#image_location}.
         * <p>
         * @return {@code this}
         * @param imageLocation Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ami#image_location Ami#image_location}. This parameter is required.
         */
        public Builder imageLocation(final java.lang.String imageLocation) {
            this.config.imageLocation(imageLocation);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ami#imds_support Ami#imds_support}.
         * <p>
         * @return {@code this}
         * @param imdsSupport Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ami#imds_support Ami#imds_support}. This parameter is required.
         */
        public Builder imdsSupport(final java.lang.String imdsSupport) {
            this.config.imdsSupport(imdsSupport);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ami#kernel_id Ami#kernel_id}.
         * <p>
         * @return {@code this}
         * @param kernelId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ami#kernel_id Ami#kernel_id}. This parameter is required.
         */
        public Builder kernelId(final java.lang.String kernelId) {
            this.config.kernelId(kernelId);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ami#ramdisk_id Ami#ramdisk_id}.
         * <p>
         * @return {@code this}
         * @param ramdiskId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ami#ramdisk_id Ami#ramdisk_id}. This parameter is required.
         */
        public Builder ramdiskId(final java.lang.String ramdiskId) {
            this.config.ramdiskId(ramdiskId);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ami#root_device_name Ami#root_device_name}.
         * <p>
         * @return {@code this}
         * @param rootDeviceName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ami#root_device_name Ami#root_device_name}. This parameter is required.
         */
        public Builder rootDeviceName(final java.lang.String rootDeviceName) {
            this.config.rootDeviceName(rootDeviceName);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ami#sriov_net_support Ami#sriov_net_support}.
         * <p>
         * @return {@code this}
         * @param sriovNetSupport Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ami#sriov_net_support Ami#sriov_net_support}. This parameter is required.
         */
        public Builder sriovNetSupport(final java.lang.String sriovNetSupport) {
            this.config.sriovNetSupport(sriovNetSupport);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ami#tags Ami#tags}.
         * <p>
         * @return {@code this}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ami#tags Ami#tags}. This parameter is required.
         */
        public Builder tags(final java.util.Map<java.lang.String, java.lang.String> tags) {
            this.config.tags(tags);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ami#tags_all Ami#tags_all}.
         * <p>
         * @return {@code this}
         * @param tagsAll Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ami#tags_all Ami#tags_all}. This parameter is required.
         */
        public Builder tagsAll(final java.util.Map<java.lang.String, java.lang.String> tagsAll) {
            this.config.tagsAll(tagsAll);
            return this;
        }

        /**
         * timeouts block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ami#timeouts Ami#timeouts}
         * <p>
         * @return {@code this}
         * @param timeouts timeouts block. This parameter is required.
         */
        public Builder timeouts(final imports.aws.ami.AmiTimeouts timeouts) {
            this.config.timeouts(timeouts);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ami#tpm_support Ami#tpm_support}.
         * <p>
         * @return {@code this}
         * @param tpmSupport Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ami#tpm_support Ami#tpm_support}. This parameter is required.
         */
        public Builder tpmSupport(final java.lang.String tpmSupport) {
            this.config.tpmSupport(tpmSupport);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ami#uefi_data Ami#uefi_data}.
         * <p>
         * @return {@code this}
         * @param uefiData Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ami#uefi_data Ami#uefi_data}. This parameter is required.
         */
        public Builder uefiData(final java.lang.String uefiData) {
            this.config.uefiData(uefiData);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ami#virtualization_type Ami#virtualization_type}.
         * <p>
         * @return {@code this}
         * @param virtualizationType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ami#virtualization_type Ami#virtualization_type}. This parameter is required.
         */
        public Builder virtualizationType(final java.lang.String virtualizationType) {
            this.config.virtualizationType(virtualizationType);
            return this;
        }

        /**
         * @return a newly built instance of {@link imports.aws.ami.Ami}.
         */
        @Override
        public imports.aws.ami.Ami build() {
            return new imports.aws.ami.Ami(
                this.scope,
                this.id,
                this.config.build()
            );
        }
    }
}
