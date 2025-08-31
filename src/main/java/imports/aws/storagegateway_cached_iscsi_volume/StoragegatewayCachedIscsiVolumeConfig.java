package imports.aws.storagegateway_cached_iscsi_volume;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.527Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.storagegatewayCachedIscsiVolume.StoragegatewayCachedIscsiVolumeConfig")
@software.amazon.jsii.Jsii.Proxy(StoragegatewayCachedIscsiVolumeConfig.Jsii$Proxy.class)
public interface StoragegatewayCachedIscsiVolumeConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/storagegateway_cached_iscsi_volume#gateway_arn StoragegatewayCachedIscsiVolume#gateway_arn}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getGatewayArn();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/storagegateway_cached_iscsi_volume#network_interface_id StoragegatewayCachedIscsiVolume#network_interface_id}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getNetworkInterfaceId();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/storagegateway_cached_iscsi_volume#target_name StoragegatewayCachedIscsiVolume#target_name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getTargetName();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/storagegateway_cached_iscsi_volume#volume_size_in_bytes StoragegatewayCachedIscsiVolume#volume_size_in_bytes}.
     */
    @org.jetbrains.annotations.NotNull java.lang.Number getVolumeSizeInBytes();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/storagegateway_cached_iscsi_volume#id StoragegatewayCachedIscsiVolume#id}.
     * <p>
     * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
     * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/storagegateway_cached_iscsi_volume#kms_encrypted StoragegatewayCachedIscsiVolume#kms_encrypted}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getKmsEncrypted() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/storagegateway_cached_iscsi_volume#kms_key StoragegatewayCachedIscsiVolume#kms_key}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getKmsKey() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/storagegateway_cached_iscsi_volume#snapshot_id StoragegatewayCachedIscsiVolume#snapshot_id}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getSnapshotId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/storagegateway_cached_iscsi_volume#source_volume_arn StoragegatewayCachedIscsiVolume#source_volume_arn}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getSourceVolumeArn() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/storagegateway_cached_iscsi_volume#tags StoragegatewayCachedIscsiVolume#tags}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTags() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/storagegateway_cached_iscsi_volume#tags_all StoragegatewayCachedIscsiVolume#tags_all}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsAll() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link StoragegatewayCachedIscsiVolumeConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link StoragegatewayCachedIscsiVolumeConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<StoragegatewayCachedIscsiVolumeConfig> {
        java.lang.String gatewayArn;
        java.lang.String networkInterfaceId;
        java.lang.String targetName;
        java.lang.Number volumeSizeInBytes;
        java.lang.String id;
        java.lang.Object kmsEncrypted;
        java.lang.String kmsKey;
        java.lang.String snapshotId;
        java.lang.String sourceVolumeArn;
        java.util.Map<java.lang.String, java.lang.String> tags;
        java.util.Map<java.lang.String, java.lang.String> tagsAll;
        java.lang.Object connection;
        java.lang.Object count;
        java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        com.hashicorp.cdktf.ITerraformIterator forEach;
        com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        com.hashicorp.cdktf.TerraformProvider provider;
        java.util.List<java.lang.Object> provisioners;

        /**
         * Sets the value of {@link StoragegatewayCachedIscsiVolumeConfig#getGatewayArn}
         * @param gatewayArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/storagegateway_cached_iscsi_volume#gateway_arn StoragegatewayCachedIscsiVolume#gateway_arn}. This parameter is required.
         * @return {@code this}
         */
        public Builder gatewayArn(java.lang.String gatewayArn) {
            this.gatewayArn = gatewayArn;
            return this;
        }

        /**
         * Sets the value of {@link StoragegatewayCachedIscsiVolumeConfig#getNetworkInterfaceId}
         * @param networkInterfaceId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/storagegateway_cached_iscsi_volume#network_interface_id StoragegatewayCachedIscsiVolume#network_interface_id}. This parameter is required.
         * @return {@code this}
         */
        public Builder networkInterfaceId(java.lang.String networkInterfaceId) {
            this.networkInterfaceId = networkInterfaceId;
            return this;
        }

        /**
         * Sets the value of {@link StoragegatewayCachedIscsiVolumeConfig#getTargetName}
         * @param targetName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/storagegateway_cached_iscsi_volume#target_name StoragegatewayCachedIscsiVolume#target_name}. This parameter is required.
         * @return {@code this}
         */
        public Builder targetName(java.lang.String targetName) {
            this.targetName = targetName;
            return this;
        }

        /**
         * Sets the value of {@link StoragegatewayCachedIscsiVolumeConfig#getVolumeSizeInBytes}
         * @param volumeSizeInBytes Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/storagegateway_cached_iscsi_volume#volume_size_in_bytes StoragegatewayCachedIscsiVolume#volume_size_in_bytes}. This parameter is required.
         * @return {@code this}
         */
        public Builder volumeSizeInBytes(java.lang.Number volumeSizeInBytes) {
            this.volumeSizeInBytes = volumeSizeInBytes;
            return this;
        }

        /**
         * Sets the value of {@link StoragegatewayCachedIscsiVolumeConfig#getId}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/storagegateway_cached_iscsi_volume#id StoragegatewayCachedIscsiVolume#id}.
         *           Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         *           If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * @return {@code this}
         */
        public Builder id(java.lang.String id) {
            this.id = id;
            return this;
        }

        /**
         * Sets the value of {@link StoragegatewayCachedIscsiVolumeConfig#getKmsEncrypted}
         * @param kmsEncrypted Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/storagegateway_cached_iscsi_volume#kms_encrypted StoragegatewayCachedIscsiVolume#kms_encrypted}.
         * @return {@code this}
         */
        public Builder kmsEncrypted(java.lang.Boolean kmsEncrypted) {
            this.kmsEncrypted = kmsEncrypted;
            return this;
        }

        /**
         * Sets the value of {@link StoragegatewayCachedIscsiVolumeConfig#getKmsEncrypted}
         * @param kmsEncrypted Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/storagegateway_cached_iscsi_volume#kms_encrypted StoragegatewayCachedIscsiVolume#kms_encrypted}.
         * @return {@code this}
         */
        public Builder kmsEncrypted(com.hashicorp.cdktf.IResolvable kmsEncrypted) {
            this.kmsEncrypted = kmsEncrypted;
            return this;
        }

        /**
         * Sets the value of {@link StoragegatewayCachedIscsiVolumeConfig#getKmsKey}
         * @param kmsKey Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/storagegateway_cached_iscsi_volume#kms_key StoragegatewayCachedIscsiVolume#kms_key}.
         * @return {@code this}
         */
        public Builder kmsKey(java.lang.String kmsKey) {
            this.kmsKey = kmsKey;
            return this;
        }

        /**
         * Sets the value of {@link StoragegatewayCachedIscsiVolumeConfig#getSnapshotId}
         * @param snapshotId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/storagegateway_cached_iscsi_volume#snapshot_id StoragegatewayCachedIscsiVolume#snapshot_id}.
         * @return {@code this}
         */
        public Builder snapshotId(java.lang.String snapshotId) {
            this.snapshotId = snapshotId;
            return this;
        }

        /**
         * Sets the value of {@link StoragegatewayCachedIscsiVolumeConfig#getSourceVolumeArn}
         * @param sourceVolumeArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/storagegateway_cached_iscsi_volume#source_volume_arn StoragegatewayCachedIscsiVolume#source_volume_arn}.
         * @return {@code this}
         */
        public Builder sourceVolumeArn(java.lang.String sourceVolumeArn) {
            this.sourceVolumeArn = sourceVolumeArn;
            return this;
        }

        /**
         * Sets the value of {@link StoragegatewayCachedIscsiVolumeConfig#getTags}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/storagegateway_cached_iscsi_volume#tags StoragegatewayCachedIscsiVolume#tags}.
         * @return {@code this}
         */
        public Builder tags(java.util.Map<java.lang.String, java.lang.String> tags) {
            this.tags = tags;
            return this;
        }

        /**
         * Sets the value of {@link StoragegatewayCachedIscsiVolumeConfig#getTagsAll}
         * @param tagsAll Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/storagegateway_cached_iscsi_volume#tags_all StoragegatewayCachedIscsiVolume#tags_all}.
         * @return {@code this}
         */
        public Builder tagsAll(java.util.Map<java.lang.String, java.lang.String> tagsAll) {
            this.tagsAll = tagsAll;
            return this;
        }

        /**
         * Sets the value of {@link StoragegatewayCachedIscsiVolumeConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link StoragegatewayCachedIscsiVolumeConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link StoragegatewayCachedIscsiVolumeConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link StoragegatewayCachedIscsiVolumeConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link StoragegatewayCachedIscsiVolumeConfig#getDependsOn}
         * @param dependsOn the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        @SuppressWarnings("unchecked")
        public Builder dependsOn(java.util.List<? extends com.hashicorp.cdktf.ITerraformDependable> dependsOn) {
            this.dependsOn = (java.util.List<com.hashicorp.cdktf.ITerraformDependable>)dependsOn;
            return this;
        }

        /**
         * Sets the value of {@link StoragegatewayCachedIscsiVolumeConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link StoragegatewayCachedIscsiVolumeConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link StoragegatewayCachedIscsiVolumeConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link StoragegatewayCachedIscsiVolumeConfig#getProvisioners}
         * @param provisioners the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        @SuppressWarnings("unchecked")
        public Builder provisioners(java.util.List<? extends java.lang.Object> provisioners) {
            this.provisioners = (java.util.List<java.lang.Object>)provisioners;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link StoragegatewayCachedIscsiVolumeConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public StoragegatewayCachedIscsiVolumeConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link StoragegatewayCachedIscsiVolumeConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements StoragegatewayCachedIscsiVolumeConfig {
        private final java.lang.String gatewayArn;
        private final java.lang.String networkInterfaceId;
        private final java.lang.String targetName;
        private final java.lang.Number volumeSizeInBytes;
        private final java.lang.String id;
        private final java.lang.Object kmsEncrypted;
        private final java.lang.String kmsKey;
        private final java.lang.String snapshotId;
        private final java.lang.String sourceVolumeArn;
        private final java.util.Map<java.lang.String, java.lang.String> tags;
        private final java.util.Map<java.lang.String, java.lang.String> tagsAll;
        private final java.lang.Object connection;
        private final java.lang.Object count;
        private final java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        private final com.hashicorp.cdktf.ITerraformIterator forEach;
        private final com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        private final com.hashicorp.cdktf.TerraformProvider provider;
        private final java.util.List<java.lang.Object> provisioners;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.gatewayArn = software.amazon.jsii.Kernel.get(this, "gatewayArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.networkInterfaceId = software.amazon.jsii.Kernel.get(this, "networkInterfaceId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.targetName = software.amazon.jsii.Kernel.get(this, "targetName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.volumeSizeInBytes = software.amazon.jsii.Kernel.get(this, "volumeSizeInBytes", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.id = software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.kmsEncrypted = software.amazon.jsii.Kernel.get(this, "kmsEncrypted", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.kmsKey = software.amazon.jsii.Kernel.get(this, "kmsKey", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.snapshotId = software.amazon.jsii.Kernel.get(this, "snapshotId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.sourceVolumeArn = software.amazon.jsii.Kernel.get(this, "sourceVolumeArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.tags = software.amazon.jsii.Kernel.get(this, "tags", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.tagsAll = software.amazon.jsii.Kernel.get(this, "tagsAll", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.connection = software.amazon.jsii.Kernel.get(this, "connection", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.count = software.amazon.jsii.Kernel.get(this, "count", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.dependsOn = software.amazon.jsii.Kernel.get(this, "dependsOn", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ITerraformDependable.class)));
            this.forEach = software.amazon.jsii.Kernel.get(this, "forEach", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ITerraformIterator.class));
            this.lifecycle = software.amazon.jsii.Kernel.get(this, "lifecycle", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.TerraformResourceLifecycle.class));
            this.provider = software.amazon.jsii.Kernel.get(this, "provider", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.TerraformProvider.class));
            this.provisioners = software.amazon.jsii.Kernel.get(this, "provisioners", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.Object.class)));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        @SuppressWarnings("unchecked")
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.gatewayArn = java.util.Objects.requireNonNull(builder.gatewayArn, "gatewayArn is required");
            this.networkInterfaceId = java.util.Objects.requireNonNull(builder.networkInterfaceId, "networkInterfaceId is required");
            this.targetName = java.util.Objects.requireNonNull(builder.targetName, "targetName is required");
            this.volumeSizeInBytes = java.util.Objects.requireNonNull(builder.volumeSizeInBytes, "volumeSizeInBytes is required");
            this.id = builder.id;
            this.kmsEncrypted = builder.kmsEncrypted;
            this.kmsKey = builder.kmsKey;
            this.snapshotId = builder.snapshotId;
            this.sourceVolumeArn = builder.sourceVolumeArn;
            this.tags = builder.tags;
            this.tagsAll = builder.tagsAll;
            this.connection = builder.connection;
            this.count = builder.count;
            this.dependsOn = (java.util.List<com.hashicorp.cdktf.ITerraformDependable>)builder.dependsOn;
            this.forEach = builder.forEach;
            this.lifecycle = builder.lifecycle;
            this.provider = builder.provider;
            this.provisioners = (java.util.List<java.lang.Object>)builder.provisioners;
        }

        @Override
        public final java.lang.String getGatewayArn() {
            return this.gatewayArn;
        }

        @Override
        public final java.lang.String getNetworkInterfaceId() {
            return this.networkInterfaceId;
        }

        @Override
        public final java.lang.String getTargetName() {
            return this.targetName;
        }

        @Override
        public final java.lang.Number getVolumeSizeInBytes() {
            return this.volumeSizeInBytes;
        }

        @Override
        public final java.lang.String getId() {
            return this.id;
        }

        @Override
        public final java.lang.Object getKmsEncrypted() {
            return this.kmsEncrypted;
        }

        @Override
        public final java.lang.String getKmsKey() {
            return this.kmsKey;
        }

        @Override
        public final java.lang.String getSnapshotId() {
            return this.snapshotId;
        }

        @Override
        public final java.lang.String getSourceVolumeArn() {
            return this.sourceVolumeArn;
        }

        @Override
        public final java.util.Map<java.lang.String, java.lang.String> getTags() {
            return this.tags;
        }

        @Override
        public final java.util.Map<java.lang.String, java.lang.String> getTagsAll() {
            return this.tagsAll;
        }

        @Override
        public final java.lang.Object getConnection() {
            return this.connection;
        }

        @Override
        public final java.lang.Object getCount() {
            return this.count;
        }

        @Override
        public final java.util.List<com.hashicorp.cdktf.ITerraformDependable> getDependsOn() {
            return this.dependsOn;
        }

        @Override
        public final com.hashicorp.cdktf.ITerraformIterator getForEach() {
            return this.forEach;
        }

        @Override
        public final com.hashicorp.cdktf.TerraformResourceLifecycle getLifecycle() {
            return this.lifecycle;
        }

        @Override
        public final com.hashicorp.cdktf.TerraformProvider getProvider() {
            return this.provider;
        }

        @Override
        public final java.util.List<java.lang.Object> getProvisioners() {
            return this.provisioners;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("gatewayArn", om.valueToTree(this.getGatewayArn()));
            data.set("networkInterfaceId", om.valueToTree(this.getNetworkInterfaceId()));
            data.set("targetName", om.valueToTree(this.getTargetName()));
            data.set("volumeSizeInBytes", om.valueToTree(this.getVolumeSizeInBytes()));
            if (this.getId() != null) {
                data.set("id", om.valueToTree(this.getId()));
            }
            if (this.getKmsEncrypted() != null) {
                data.set("kmsEncrypted", om.valueToTree(this.getKmsEncrypted()));
            }
            if (this.getKmsKey() != null) {
                data.set("kmsKey", om.valueToTree(this.getKmsKey()));
            }
            if (this.getSnapshotId() != null) {
                data.set("snapshotId", om.valueToTree(this.getSnapshotId()));
            }
            if (this.getSourceVolumeArn() != null) {
                data.set("sourceVolumeArn", om.valueToTree(this.getSourceVolumeArn()));
            }
            if (this.getTags() != null) {
                data.set("tags", om.valueToTree(this.getTags()));
            }
            if (this.getTagsAll() != null) {
                data.set("tagsAll", om.valueToTree(this.getTagsAll()));
            }
            if (this.getConnection() != null) {
                data.set("connection", om.valueToTree(this.getConnection()));
            }
            if (this.getCount() != null) {
                data.set("count", om.valueToTree(this.getCount()));
            }
            if (this.getDependsOn() != null) {
                data.set("dependsOn", om.valueToTree(this.getDependsOn()));
            }
            if (this.getForEach() != null) {
                data.set("forEach", om.valueToTree(this.getForEach()));
            }
            if (this.getLifecycle() != null) {
                data.set("lifecycle", om.valueToTree(this.getLifecycle()));
            }
            if (this.getProvider() != null) {
                data.set("provider", om.valueToTree(this.getProvider()));
            }
            if (this.getProvisioners() != null) {
                data.set("provisioners", om.valueToTree(this.getProvisioners()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.storagegatewayCachedIscsiVolume.StoragegatewayCachedIscsiVolumeConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            StoragegatewayCachedIscsiVolumeConfig.Jsii$Proxy that = (StoragegatewayCachedIscsiVolumeConfig.Jsii$Proxy) o;

            if (!gatewayArn.equals(that.gatewayArn)) return false;
            if (!networkInterfaceId.equals(that.networkInterfaceId)) return false;
            if (!targetName.equals(that.targetName)) return false;
            if (!volumeSizeInBytes.equals(that.volumeSizeInBytes)) return false;
            if (this.id != null ? !this.id.equals(that.id) : that.id != null) return false;
            if (this.kmsEncrypted != null ? !this.kmsEncrypted.equals(that.kmsEncrypted) : that.kmsEncrypted != null) return false;
            if (this.kmsKey != null ? !this.kmsKey.equals(that.kmsKey) : that.kmsKey != null) return false;
            if (this.snapshotId != null ? !this.snapshotId.equals(that.snapshotId) : that.snapshotId != null) return false;
            if (this.sourceVolumeArn != null ? !this.sourceVolumeArn.equals(that.sourceVolumeArn) : that.sourceVolumeArn != null) return false;
            if (this.tags != null ? !this.tags.equals(that.tags) : that.tags != null) return false;
            if (this.tagsAll != null ? !this.tagsAll.equals(that.tagsAll) : that.tagsAll != null) return false;
            if (this.connection != null ? !this.connection.equals(that.connection) : that.connection != null) return false;
            if (this.count != null ? !this.count.equals(that.count) : that.count != null) return false;
            if (this.dependsOn != null ? !this.dependsOn.equals(that.dependsOn) : that.dependsOn != null) return false;
            if (this.forEach != null ? !this.forEach.equals(that.forEach) : that.forEach != null) return false;
            if (this.lifecycle != null ? !this.lifecycle.equals(that.lifecycle) : that.lifecycle != null) return false;
            if (this.provider != null ? !this.provider.equals(that.provider) : that.provider != null) return false;
            return this.provisioners != null ? this.provisioners.equals(that.provisioners) : that.provisioners == null;
        }

        @Override
        public final int hashCode() {
            int result = this.gatewayArn.hashCode();
            result = 31 * result + (this.networkInterfaceId.hashCode());
            result = 31 * result + (this.targetName.hashCode());
            result = 31 * result + (this.volumeSizeInBytes.hashCode());
            result = 31 * result + (this.id != null ? this.id.hashCode() : 0);
            result = 31 * result + (this.kmsEncrypted != null ? this.kmsEncrypted.hashCode() : 0);
            result = 31 * result + (this.kmsKey != null ? this.kmsKey.hashCode() : 0);
            result = 31 * result + (this.snapshotId != null ? this.snapshotId.hashCode() : 0);
            result = 31 * result + (this.sourceVolumeArn != null ? this.sourceVolumeArn.hashCode() : 0);
            result = 31 * result + (this.tags != null ? this.tags.hashCode() : 0);
            result = 31 * result + (this.tagsAll != null ? this.tagsAll.hashCode() : 0);
            result = 31 * result + (this.connection != null ? this.connection.hashCode() : 0);
            result = 31 * result + (this.count != null ? this.count.hashCode() : 0);
            result = 31 * result + (this.dependsOn != null ? this.dependsOn.hashCode() : 0);
            result = 31 * result + (this.forEach != null ? this.forEach.hashCode() : 0);
            result = 31 * result + (this.lifecycle != null ? this.lifecycle.hashCode() : 0);
            result = 31 * result + (this.provider != null ? this.provider.hashCode() : 0);
            result = 31 * result + (this.provisioners != null ? this.provisioners.hashCode() : 0);
            return result;
        }
    }
}
