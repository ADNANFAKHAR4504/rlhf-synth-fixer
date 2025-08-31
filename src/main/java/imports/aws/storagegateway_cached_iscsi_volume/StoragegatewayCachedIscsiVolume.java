package imports.aws.storagegateway_cached_iscsi_volume;

/**
 * Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/storagegateway_cached_iscsi_volume aws_storagegateway_cached_iscsi_volume}.
 */
@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.527Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.storagegatewayCachedIscsiVolume.StoragegatewayCachedIscsiVolume")
public class StoragegatewayCachedIscsiVolume extends com.hashicorp.cdktf.TerraformResource {

    protected StoragegatewayCachedIscsiVolume(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected StoragegatewayCachedIscsiVolume(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    static {
        TF_RESOURCE_TYPE = software.amazon.jsii.JsiiObject.jsiiStaticGet(imports.aws.storagegateway_cached_iscsi_volume.StoragegatewayCachedIscsiVolume.class, "tfResourceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    /**
     * Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/storagegateway_cached_iscsi_volume aws_storagegateway_cached_iscsi_volume} Resource.
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param id The scoped construct ID. This parameter is required.
     * @param config This parameter is required.
     */
    public StoragegatewayCachedIscsiVolume(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String id, final @org.jetbrains.annotations.NotNull imports.aws.storagegateway_cached_iscsi_volume.StoragegatewayCachedIscsiVolumeConfig config) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(id, "id is required"), java.util.Objects.requireNonNull(config, "config is required") });
    }

    /**
     * Generates CDKTF code for importing a StoragegatewayCachedIscsiVolume resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the StoragegatewayCachedIscsiVolume to import. This parameter is required.
     * @param importFromId The id of the existing StoragegatewayCachedIscsiVolume that should be imported. This parameter is required.
     * @param provider ? Optional instance of the provider where the StoragegatewayCachedIscsiVolume to import is found.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId, final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.TerraformProvider provider) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.storagegateway_cached_iscsi_volume.StoragegatewayCachedIscsiVolume.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required"), provider });
    }

    /**
     * Generates CDKTF code for importing a StoragegatewayCachedIscsiVolume resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the StoragegatewayCachedIscsiVolume to import. This parameter is required.
     * @param importFromId The id of the existing StoragegatewayCachedIscsiVolume that should be imported. This parameter is required.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.storagegateway_cached_iscsi_volume.StoragegatewayCachedIscsiVolume.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required") });
    }

    public void resetId() {
        software.amazon.jsii.Kernel.call(this, "resetId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetKmsEncrypted() {
        software.amazon.jsii.Kernel.call(this, "resetKmsEncrypted", software.amazon.jsii.NativeType.VOID);
    }

    public void resetKmsKey() {
        software.amazon.jsii.Kernel.call(this, "resetKmsKey", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSnapshotId() {
        software.amazon.jsii.Kernel.call(this, "resetSnapshotId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSourceVolumeArn() {
        software.amazon.jsii.Kernel.call(this, "resetSourceVolumeArn", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTags() {
        software.amazon.jsii.Kernel.call(this, "resetTags", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTagsAll() {
        software.amazon.jsii.Kernel.call(this, "resetTagsAll", software.amazon.jsii.NativeType.VOID);
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

    public @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable getChapEnabled() {
        return software.amazon.jsii.Kernel.get(this, "chapEnabled", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.IResolvable.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getLunNumber() {
        return software.amazon.jsii.Kernel.get(this, "lunNumber", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getNetworkInterfacePort() {
        return software.amazon.jsii.Kernel.get(this, "networkInterfacePort", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getTargetArn() {
        return software.amazon.jsii.Kernel.get(this, "targetArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getVolumeArn() {
        return software.amazon.jsii.Kernel.get(this, "volumeArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getVolumeId() {
        return software.amazon.jsii.Kernel.get(this, "volumeId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getGatewayArnInput() {
        return software.amazon.jsii.Kernel.get(this, "gatewayArnInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getIdInput() {
        return software.amazon.jsii.Kernel.get(this, "idInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getKmsEncryptedInput() {
        return software.amazon.jsii.Kernel.get(this, "kmsEncryptedInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getKmsKeyInput() {
        return software.amazon.jsii.Kernel.get(this, "kmsKeyInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getNetworkInterfaceIdInput() {
        return software.amazon.jsii.Kernel.get(this, "networkInterfaceIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getSnapshotIdInput() {
        return software.amazon.jsii.Kernel.get(this, "snapshotIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getSourceVolumeArnInput() {
        return software.amazon.jsii.Kernel.get(this, "sourceVolumeArnInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsAllInput() {
        return java.util.Optional.ofNullable((java.util.Map<java.lang.String, java.lang.String>)(software.amazon.jsii.Kernel.get(this, "tagsAllInput", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableMap).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsInput() {
        return java.util.Optional.ofNullable((java.util.Map<java.lang.String, java.lang.String>)(software.amazon.jsii.Kernel.get(this, "tagsInput", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableMap).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getTargetNameInput() {
        return software.amazon.jsii.Kernel.get(this, "targetNameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getVolumeSizeInBytesInput() {
        return software.amazon.jsii.Kernel.get(this, "volumeSizeInBytesInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getGatewayArn() {
        return software.amazon.jsii.Kernel.get(this, "gatewayArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setGatewayArn(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "gatewayArn", java.util.Objects.requireNonNull(value, "gatewayArn is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getId() {
        return software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "id", java.util.Objects.requireNonNull(value, "id is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getKmsEncrypted() {
        return software.amazon.jsii.Kernel.get(this, "kmsEncrypted", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setKmsEncrypted(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "kmsEncrypted", java.util.Objects.requireNonNull(value, "kmsEncrypted is required"));
    }

    public void setKmsEncrypted(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "kmsEncrypted", java.util.Objects.requireNonNull(value, "kmsEncrypted is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getKmsKey() {
        return software.amazon.jsii.Kernel.get(this, "kmsKey", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setKmsKey(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "kmsKey", java.util.Objects.requireNonNull(value, "kmsKey is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getNetworkInterfaceId() {
        return software.amazon.jsii.Kernel.get(this, "networkInterfaceId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setNetworkInterfaceId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "networkInterfaceId", java.util.Objects.requireNonNull(value, "networkInterfaceId is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getSnapshotId() {
        return software.amazon.jsii.Kernel.get(this, "snapshotId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setSnapshotId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "snapshotId", java.util.Objects.requireNonNull(value, "snapshotId is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getSourceVolumeArn() {
        return software.amazon.jsii.Kernel.get(this, "sourceVolumeArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setSourceVolumeArn(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "sourceVolumeArn", java.util.Objects.requireNonNull(value, "sourceVolumeArn is required"));
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

    public @org.jetbrains.annotations.NotNull java.lang.String getTargetName() {
        return software.amazon.jsii.Kernel.get(this, "targetName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setTargetName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "targetName", java.util.Objects.requireNonNull(value, "targetName is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getVolumeSizeInBytes() {
        return software.amazon.jsii.Kernel.get(this, "volumeSizeInBytes", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setVolumeSizeInBytes(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "volumeSizeInBytes", java.util.Objects.requireNonNull(value, "volumeSizeInBytes is required"));
    }

    /**
     * A fluent builder for {@link imports.aws.storagegateway_cached_iscsi_volume.StoragegatewayCachedIscsiVolume}.
     */
    public static final class Builder implements software.amazon.jsii.Builder<imports.aws.storagegateway_cached_iscsi_volume.StoragegatewayCachedIscsiVolume> {
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
        private final imports.aws.storagegateway_cached_iscsi_volume.StoragegatewayCachedIscsiVolumeConfig.Builder config;

        private Builder(final software.constructs.Construct scope, final java.lang.String id) {
            this.scope = scope;
            this.id = id;
            this.config = new imports.aws.storagegateway_cached_iscsi_volume.StoragegatewayCachedIscsiVolumeConfig.Builder();
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
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/storagegateway_cached_iscsi_volume#gateway_arn StoragegatewayCachedIscsiVolume#gateway_arn}.
         * <p>
         * @return {@code this}
         * @param gatewayArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/storagegateway_cached_iscsi_volume#gateway_arn StoragegatewayCachedIscsiVolume#gateway_arn}. This parameter is required.
         */
        public Builder gatewayArn(final java.lang.String gatewayArn) {
            this.config.gatewayArn(gatewayArn);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/storagegateway_cached_iscsi_volume#network_interface_id StoragegatewayCachedIscsiVolume#network_interface_id}.
         * <p>
         * @return {@code this}
         * @param networkInterfaceId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/storagegateway_cached_iscsi_volume#network_interface_id StoragegatewayCachedIscsiVolume#network_interface_id}. This parameter is required.
         */
        public Builder networkInterfaceId(final java.lang.String networkInterfaceId) {
            this.config.networkInterfaceId(networkInterfaceId);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/storagegateway_cached_iscsi_volume#target_name StoragegatewayCachedIscsiVolume#target_name}.
         * <p>
         * @return {@code this}
         * @param targetName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/storagegateway_cached_iscsi_volume#target_name StoragegatewayCachedIscsiVolume#target_name}. This parameter is required.
         */
        public Builder targetName(final java.lang.String targetName) {
            this.config.targetName(targetName);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/storagegateway_cached_iscsi_volume#volume_size_in_bytes StoragegatewayCachedIscsiVolume#volume_size_in_bytes}.
         * <p>
         * @return {@code this}
         * @param volumeSizeInBytes Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/storagegateway_cached_iscsi_volume#volume_size_in_bytes StoragegatewayCachedIscsiVolume#volume_size_in_bytes}. This parameter is required.
         */
        public Builder volumeSizeInBytes(final java.lang.Number volumeSizeInBytes) {
            this.config.volumeSizeInBytes(volumeSizeInBytes);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/storagegateway_cached_iscsi_volume#id StoragegatewayCachedIscsiVolume#id}.
         * <p>
         * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * <p>
         * @return {@code this}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/storagegateway_cached_iscsi_volume#id StoragegatewayCachedIscsiVolume#id}. This parameter is required.
         */
        public Builder id(final java.lang.String id) {
            this.config.id(id);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/storagegateway_cached_iscsi_volume#kms_encrypted StoragegatewayCachedIscsiVolume#kms_encrypted}.
         * <p>
         * @return {@code this}
         * @param kmsEncrypted Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/storagegateway_cached_iscsi_volume#kms_encrypted StoragegatewayCachedIscsiVolume#kms_encrypted}. This parameter is required.
         */
        public Builder kmsEncrypted(final java.lang.Boolean kmsEncrypted) {
            this.config.kmsEncrypted(kmsEncrypted);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/storagegateway_cached_iscsi_volume#kms_encrypted StoragegatewayCachedIscsiVolume#kms_encrypted}.
         * <p>
         * @return {@code this}
         * @param kmsEncrypted Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/storagegateway_cached_iscsi_volume#kms_encrypted StoragegatewayCachedIscsiVolume#kms_encrypted}. This parameter is required.
         */
        public Builder kmsEncrypted(final com.hashicorp.cdktf.IResolvable kmsEncrypted) {
            this.config.kmsEncrypted(kmsEncrypted);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/storagegateway_cached_iscsi_volume#kms_key StoragegatewayCachedIscsiVolume#kms_key}.
         * <p>
         * @return {@code this}
         * @param kmsKey Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/storagegateway_cached_iscsi_volume#kms_key StoragegatewayCachedIscsiVolume#kms_key}. This parameter is required.
         */
        public Builder kmsKey(final java.lang.String kmsKey) {
            this.config.kmsKey(kmsKey);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/storagegateway_cached_iscsi_volume#snapshot_id StoragegatewayCachedIscsiVolume#snapshot_id}.
         * <p>
         * @return {@code this}
         * @param snapshotId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/storagegateway_cached_iscsi_volume#snapshot_id StoragegatewayCachedIscsiVolume#snapshot_id}. This parameter is required.
         */
        public Builder snapshotId(final java.lang.String snapshotId) {
            this.config.snapshotId(snapshotId);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/storagegateway_cached_iscsi_volume#source_volume_arn StoragegatewayCachedIscsiVolume#source_volume_arn}.
         * <p>
         * @return {@code this}
         * @param sourceVolumeArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/storagegateway_cached_iscsi_volume#source_volume_arn StoragegatewayCachedIscsiVolume#source_volume_arn}. This parameter is required.
         */
        public Builder sourceVolumeArn(final java.lang.String sourceVolumeArn) {
            this.config.sourceVolumeArn(sourceVolumeArn);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/storagegateway_cached_iscsi_volume#tags StoragegatewayCachedIscsiVolume#tags}.
         * <p>
         * @return {@code this}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/storagegateway_cached_iscsi_volume#tags StoragegatewayCachedIscsiVolume#tags}. This parameter is required.
         */
        public Builder tags(final java.util.Map<java.lang.String, java.lang.String> tags) {
            this.config.tags(tags);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/storagegateway_cached_iscsi_volume#tags_all StoragegatewayCachedIscsiVolume#tags_all}.
         * <p>
         * @return {@code this}
         * @param tagsAll Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/storagegateway_cached_iscsi_volume#tags_all StoragegatewayCachedIscsiVolume#tags_all}. This parameter is required.
         */
        public Builder tagsAll(final java.util.Map<java.lang.String, java.lang.String> tagsAll) {
            this.config.tagsAll(tagsAll);
            return this;
        }

        /**
         * @return a newly built instance of {@link imports.aws.storagegateway_cached_iscsi_volume.StoragegatewayCachedIscsiVolume}.
         */
        @Override
        public imports.aws.storagegateway_cached_iscsi_volume.StoragegatewayCachedIscsiVolume build() {
            return new imports.aws.storagegateway_cached_iscsi_volume.StoragegatewayCachedIscsiVolume(
                this.scope,
                this.id,
                this.config.build()
            );
        }
    }
}
