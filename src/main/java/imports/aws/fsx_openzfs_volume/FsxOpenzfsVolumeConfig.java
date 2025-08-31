package imports.aws.fsx_openzfs_volume;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.256Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.fsxOpenzfsVolume.FsxOpenzfsVolumeConfig")
@software.amazon.jsii.Jsii.Proxy(FsxOpenzfsVolumeConfig.Jsii$Proxy.class)
public interface FsxOpenzfsVolumeConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_openzfs_volume#name FsxOpenzfsVolume#name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getName();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_openzfs_volume#parent_volume_id FsxOpenzfsVolume#parent_volume_id}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getParentVolumeId();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_openzfs_volume#copy_tags_to_snapshots FsxOpenzfsVolume#copy_tags_to_snapshots}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getCopyTagsToSnapshots() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_openzfs_volume#data_compression_type FsxOpenzfsVolume#data_compression_type}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDataCompressionType() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_openzfs_volume#delete_volume_options FsxOpenzfsVolume#delete_volume_options}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getDeleteVolumeOptions() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_openzfs_volume#id FsxOpenzfsVolume#id}.
     * <p>
     * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
     * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getId() {
        return null;
    }

    /**
     * nfs_exports block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_openzfs_volume#nfs_exports FsxOpenzfsVolume#nfs_exports}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.fsx_openzfs_volume.FsxOpenzfsVolumeNfsExports getNfsExports() {
        return null;
    }

    /**
     * origin_snapshot block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_openzfs_volume#origin_snapshot FsxOpenzfsVolume#origin_snapshot}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.fsx_openzfs_volume.FsxOpenzfsVolumeOriginSnapshot getOriginSnapshot() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_openzfs_volume#read_only FsxOpenzfsVolume#read_only}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getReadOnly() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_openzfs_volume#record_size_kib FsxOpenzfsVolume#record_size_kib}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getRecordSizeKib() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_openzfs_volume#storage_capacity_quota_gib FsxOpenzfsVolume#storage_capacity_quota_gib}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getStorageCapacityQuotaGib() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_openzfs_volume#storage_capacity_reservation_gib FsxOpenzfsVolume#storage_capacity_reservation_gib}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getStorageCapacityReservationGib() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_openzfs_volume#tags FsxOpenzfsVolume#tags}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTags() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_openzfs_volume#tags_all FsxOpenzfsVolume#tags_all}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsAll() {
        return null;
    }

    /**
     * timeouts block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_openzfs_volume#timeouts FsxOpenzfsVolume#timeouts}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.fsx_openzfs_volume.FsxOpenzfsVolumeTimeouts getTimeouts() {
        return null;
    }

    /**
     * user_and_group_quotas block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_openzfs_volume#user_and_group_quotas FsxOpenzfsVolume#user_and_group_quotas}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getUserAndGroupQuotas() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_openzfs_volume#volume_type FsxOpenzfsVolume#volume_type}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getVolumeType() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link FsxOpenzfsVolumeConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link FsxOpenzfsVolumeConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<FsxOpenzfsVolumeConfig> {
        java.lang.String name;
        java.lang.String parentVolumeId;
        java.lang.Object copyTagsToSnapshots;
        java.lang.String dataCompressionType;
        java.util.List<java.lang.String> deleteVolumeOptions;
        java.lang.String id;
        imports.aws.fsx_openzfs_volume.FsxOpenzfsVolumeNfsExports nfsExports;
        imports.aws.fsx_openzfs_volume.FsxOpenzfsVolumeOriginSnapshot originSnapshot;
        java.lang.Object readOnly;
        java.lang.Number recordSizeKib;
        java.lang.Number storageCapacityQuotaGib;
        java.lang.Number storageCapacityReservationGib;
        java.util.Map<java.lang.String, java.lang.String> tags;
        java.util.Map<java.lang.String, java.lang.String> tagsAll;
        imports.aws.fsx_openzfs_volume.FsxOpenzfsVolumeTimeouts timeouts;
        java.lang.Object userAndGroupQuotas;
        java.lang.String volumeType;
        java.lang.Object connection;
        java.lang.Object count;
        java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        com.hashicorp.cdktf.ITerraformIterator forEach;
        com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        com.hashicorp.cdktf.TerraformProvider provider;
        java.util.List<java.lang.Object> provisioners;

        /**
         * Sets the value of {@link FsxOpenzfsVolumeConfig#getName}
         * @param name Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_openzfs_volume#name FsxOpenzfsVolume#name}. This parameter is required.
         * @return {@code this}
         */
        public Builder name(java.lang.String name) {
            this.name = name;
            return this;
        }

        /**
         * Sets the value of {@link FsxOpenzfsVolumeConfig#getParentVolumeId}
         * @param parentVolumeId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_openzfs_volume#parent_volume_id FsxOpenzfsVolume#parent_volume_id}. This parameter is required.
         * @return {@code this}
         */
        public Builder parentVolumeId(java.lang.String parentVolumeId) {
            this.parentVolumeId = parentVolumeId;
            return this;
        }

        /**
         * Sets the value of {@link FsxOpenzfsVolumeConfig#getCopyTagsToSnapshots}
         * @param copyTagsToSnapshots Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_openzfs_volume#copy_tags_to_snapshots FsxOpenzfsVolume#copy_tags_to_snapshots}.
         * @return {@code this}
         */
        public Builder copyTagsToSnapshots(java.lang.Boolean copyTagsToSnapshots) {
            this.copyTagsToSnapshots = copyTagsToSnapshots;
            return this;
        }

        /**
         * Sets the value of {@link FsxOpenzfsVolumeConfig#getCopyTagsToSnapshots}
         * @param copyTagsToSnapshots Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_openzfs_volume#copy_tags_to_snapshots FsxOpenzfsVolume#copy_tags_to_snapshots}.
         * @return {@code this}
         */
        public Builder copyTagsToSnapshots(com.hashicorp.cdktf.IResolvable copyTagsToSnapshots) {
            this.copyTagsToSnapshots = copyTagsToSnapshots;
            return this;
        }

        /**
         * Sets the value of {@link FsxOpenzfsVolumeConfig#getDataCompressionType}
         * @param dataCompressionType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_openzfs_volume#data_compression_type FsxOpenzfsVolume#data_compression_type}.
         * @return {@code this}
         */
        public Builder dataCompressionType(java.lang.String dataCompressionType) {
            this.dataCompressionType = dataCompressionType;
            return this;
        }

        /**
         * Sets the value of {@link FsxOpenzfsVolumeConfig#getDeleteVolumeOptions}
         * @param deleteVolumeOptions Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_openzfs_volume#delete_volume_options FsxOpenzfsVolume#delete_volume_options}.
         * @return {@code this}
         */
        public Builder deleteVolumeOptions(java.util.List<java.lang.String> deleteVolumeOptions) {
            this.deleteVolumeOptions = deleteVolumeOptions;
            return this;
        }

        /**
         * Sets the value of {@link FsxOpenzfsVolumeConfig#getId}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_openzfs_volume#id FsxOpenzfsVolume#id}.
         *           Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         *           If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * @return {@code this}
         */
        public Builder id(java.lang.String id) {
            this.id = id;
            return this;
        }

        /**
         * Sets the value of {@link FsxOpenzfsVolumeConfig#getNfsExports}
         * @param nfsExports nfs_exports block.
         *                   Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_openzfs_volume#nfs_exports FsxOpenzfsVolume#nfs_exports}
         * @return {@code this}
         */
        public Builder nfsExports(imports.aws.fsx_openzfs_volume.FsxOpenzfsVolumeNfsExports nfsExports) {
            this.nfsExports = nfsExports;
            return this;
        }

        /**
         * Sets the value of {@link FsxOpenzfsVolumeConfig#getOriginSnapshot}
         * @param originSnapshot origin_snapshot block.
         *                       Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_openzfs_volume#origin_snapshot FsxOpenzfsVolume#origin_snapshot}
         * @return {@code this}
         */
        public Builder originSnapshot(imports.aws.fsx_openzfs_volume.FsxOpenzfsVolumeOriginSnapshot originSnapshot) {
            this.originSnapshot = originSnapshot;
            return this;
        }

        /**
         * Sets the value of {@link FsxOpenzfsVolumeConfig#getReadOnly}
         * @param readOnly Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_openzfs_volume#read_only FsxOpenzfsVolume#read_only}.
         * @return {@code this}
         */
        public Builder readOnly(java.lang.Boolean readOnly) {
            this.readOnly = readOnly;
            return this;
        }

        /**
         * Sets the value of {@link FsxOpenzfsVolumeConfig#getReadOnly}
         * @param readOnly Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_openzfs_volume#read_only FsxOpenzfsVolume#read_only}.
         * @return {@code this}
         */
        public Builder readOnly(com.hashicorp.cdktf.IResolvable readOnly) {
            this.readOnly = readOnly;
            return this;
        }

        /**
         * Sets the value of {@link FsxOpenzfsVolumeConfig#getRecordSizeKib}
         * @param recordSizeKib Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_openzfs_volume#record_size_kib FsxOpenzfsVolume#record_size_kib}.
         * @return {@code this}
         */
        public Builder recordSizeKib(java.lang.Number recordSizeKib) {
            this.recordSizeKib = recordSizeKib;
            return this;
        }

        /**
         * Sets the value of {@link FsxOpenzfsVolumeConfig#getStorageCapacityQuotaGib}
         * @param storageCapacityQuotaGib Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_openzfs_volume#storage_capacity_quota_gib FsxOpenzfsVolume#storage_capacity_quota_gib}.
         * @return {@code this}
         */
        public Builder storageCapacityQuotaGib(java.lang.Number storageCapacityQuotaGib) {
            this.storageCapacityQuotaGib = storageCapacityQuotaGib;
            return this;
        }

        /**
         * Sets the value of {@link FsxOpenzfsVolumeConfig#getStorageCapacityReservationGib}
         * @param storageCapacityReservationGib Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_openzfs_volume#storage_capacity_reservation_gib FsxOpenzfsVolume#storage_capacity_reservation_gib}.
         * @return {@code this}
         */
        public Builder storageCapacityReservationGib(java.lang.Number storageCapacityReservationGib) {
            this.storageCapacityReservationGib = storageCapacityReservationGib;
            return this;
        }

        /**
         * Sets the value of {@link FsxOpenzfsVolumeConfig#getTags}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_openzfs_volume#tags FsxOpenzfsVolume#tags}.
         * @return {@code this}
         */
        public Builder tags(java.util.Map<java.lang.String, java.lang.String> tags) {
            this.tags = tags;
            return this;
        }

        /**
         * Sets the value of {@link FsxOpenzfsVolumeConfig#getTagsAll}
         * @param tagsAll Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_openzfs_volume#tags_all FsxOpenzfsVolume#tags_all}.
         * @return {@code this}
         */
        public Builder tagsAll(java.util.Map<java.lang.String, java.lang.String> tagsAll) {
            this.tagsAll = tagsAll;
            return this;
        }

        /**
         * Sets the value of {@link FsxOpenzfsVolumeConfig#getTimeouts}
         * @param timeouts timeouts block.
         *                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_openzfs_volume#timeouts FsxOpenzfsVolume#timeouts}
         * @return {@code this}
         */
        public Builder timeouts(imports.aws.fsx_openzfs_volume.FsxOpenzfsVolumeTimeouts timeouts) {
            this.timeouts = timeouts;
            return this;
        }

        /**
         * Sets the value of {@link FsxOpenzfsVolumeConfig#getUserAndGroupQuotas}
         * @param userAndGroupQuotas user_and_group_quotas block.
         *                           Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_openzfs_volume#user_and_group_quotas FsxOpenzfsVolume#user_and_group_quotas}
         * @return {@code this}
         */
        public Builder userAndGroupQuotas(com.hashicorp.cdktf.IResolvable userAndGroupQuotas) {
            this.userAndGroupQuotas = userAndGroupQuotas;
            return this;
        }

        /**
         * Sets the value of {@link FsxOpenzfsVolumeConfig#getUserAndGroupQuotas}
         * @param userAndGroupQuotas user_and_group_quotas block.
         *                           Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_openzfs_volume#user_and_group_quotas FsxOpenzfsVolume#user_and_group_quotas}
         * @return {@code this}
         */
        public Builder userAndGroupQuotas(java.util.List<? extends imports.aws.fsx_openzfs_volume.FsxOpenzfsVolumeUserAndGroupQuotas> userAndGroupQuotas) {
            this.userAndGroupQuotas = userAndGroupQuotas;
            return this;
        }

        /**
         * Sets the value of {@link FsxOpenzfsVolumeConfig#getVolumeType}
         * @param volumeType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_openzfs_volume#volume_type FsxOpenzfsVolume#volume_type}.
         * @return {@code this}
         */
        public Builder volumeType(java.lang.String volumeType) {
            this.volumeType = volumeType;
            return this;
        }

        /**
         * Sets the value of {@link FsxOpenzfsVolumeConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link FsxOpenzfsVolumeConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link FsxOpenzfsVolumeConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link FsxOpenzfsVolumeConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link FsxOpenzfsVolumeConfig#getDependsOn}
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
         * Sets the value of {@link FsxOpenzfsVolumeConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link FsxOpenzfsVolumeConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link FsxOpenzfsVolumeConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link FsxOpenzfsVolumeConfig#getProvisioners}
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
         * @return a new instance of {@link FsxOpenzfsVolumeConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public FsxOpenzfsVolumeConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link FsxOpenzfsVolumeConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements FsxOpenzfsVolumeConfig {
        private final java.lang.String name;
        private final java.lang.String parentVolumeId;
        private final java.lang.Object copyTagsToSnapshots;
        private final java.lang.String dataCompressionType;
        private final java.util.List<java.lang.String> deleteVolumeOptions;
        private final java.lang.String id;
        private final imports.aws.fsx_openzfs_volume.FsxOpenzfsVolumeNfsExports nfsExports;
        private final imports.aws.fsx_openzfs_volume.FsxOpenzfsVolumeOriginSnapshot originSnapshot;
        private final java.lang.Object readOnly;
        private final java.lang.Number recordSizeKib;
        private final java.lang.Number storageCapacityQuotaGib;
        private final java.lang.Number storageCapacityReservationGib;
        private final java.util.Map<java.lang.String, java.lang.String> tags;
        private final java.util.Map<java.lang.String, java.lang.String> tagsAll;
        private final imports.aws.fsx_openzfs_volume.FsxOpenzfsVolumeTimeouts timeouts;
        private final java.lang.Object userAndGroupQuotas;
        private final java.lang.String volumeType;
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
            this.name = software.amazon.jsii.Kernel.get(this, "name", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.parentVolumeId = software.amazon.jsii.Kernel.get(this, "parentVolumeId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.copyTagsToSnapshots = software.amazon.jsii.Kernel.get(this, "copyTagsToSnapshots", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.dataCompressionType = software.amazon.jsii.Kernel.get(this, "dataCompressionType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.deleteVolumeOptions = software.amazon.jsii.Kernel.get(this, "deleteVolumeOptions", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.id = software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.nfsExports = software.amazon.jsii.Kernel.get(this, "nfsExports", software.amazon.jsii.NativeType.forClass(imports.aws.fsx_openzfs_volume.FsxOpenzfsVolumeNfsExports.class));
            this.originSnapshot = software.amazon.jsii.Kernel.get(this, "originSnapshot", software.amazon.jsii.NativeType.forClass(imports.aws.fsx_openzfs_volume.FsxOpenzfsVolumeOriginSnapshot.class));
            this.readOnly = software.amazon.jsii.Kernel.get(this, "readOnly", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.recordSizeKib = software.amazon.jsii.Kernel.get(this, "recordSizeKib", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.storageCapacityQuotaGib = software.amazon.jsii.Kernel.get(this, "storageCapacityQuotaGib", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.storageCapacityReservationGib = software.amazon.jsii.Kernel.get(this, "storageCapacityReservationGib", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.tags = software.amazon.jsii.Kernel.get(this, "tags", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.tagsAll = software.amazon.jsii.Kernel.get(this, "tagsAll", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.timeouts = software.amazon.jsii.Kernel.get(this, "timeouts", software.amazon.jsii.NativeType.forClass(imports.aws.fsx_openzfs_volume.FsxOpenzfsVolumeTimeouts.class));
            this.userAndGroupQuotas = software.amazon.jsii.Kernel.get(this, "userAndGroupQuotas", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.volumeType = software.amazon.jsii.Kernel.get(this, "volumeType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
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
            this.name = java.util.Objects.requireNonNull(builder.name, "name is required");
            this.parentVolumeId = java.util.Objects.requireNonNull(builder.parentVolumeId, "parentVolumeId is required");
            this.copyTagsToSnapshots = builder.copyTagsToSnapshots;
            this.dataCompressionType = builder.dataCompressionType;
            this.deleteVolumeOptions = builder.deleteVolumeOptions;
            this.id = builder.id;
            this.nfsExports = builder.nfsExports;
            this.originSnapshot = builder.originSnapshot;
            this.readOnly = builder.readOnly;
            this.recordSizeKib = builder.recordSizeKib;
            this.storageCapacityQuotaGib = builder.storageCapacityQuotaGib;
            this.storageCapacityReservationGib = builder.storageCapacityReservationGib;
            this.tags = builder.tags;
            this.tagsAll = builder.tagsAll;
            this.timeouts = builder.timeouts;
            this.userAndGroupQuotas = builder.userAndGroupQuotas;
            this.volumeType = builder.volumeType;
            this.connection = builder.connection;
            this.count = builder.count;
            this.dependsOn = (java.util.List<com.hashicorp.cdktf.ITerraformDependable>)builder.dependsOn;
            this.forEach = builder.forEach;
            this.lifecycle = builder.lifecycle;
            this.provider = builder.provider;
            this.provisioners = (java.util.List<java.lang.Object>)builder.provisioners;
        }

        @Override
        public final java.lang.String getName() {
            return this.name;
        }

        @Override
        public final java.lang.String getParentVolumeId() {
            return this.parentVolumeId;
        }

        @Override
        public final java.lang.Object getCopyTagsToSnapshots() {
            return this.copyTagsToSnapshots;
        }

        @Override
        public final java.lang.String getDataCompressionType() {
            return this.dataCompressionType;
        }

        @Override
        public final java.util.List<java.lang.String> getDeleteVolumeOptions() {
            return this.deleteVolumeOptions;
        }

        @Override
        public final java.lang.String getId() {
            return this.id;
        }

        @Override
        public final imports.aws.fsx_openzfs_volume.FsxOpenzfsVolumeNfsExports getNfsExports() {
            return this.nfsExports;
        }

        @Override
        public final imports.aws.fsx_openzfs_volume.FsxOpenzfsVolumeOriginSnapshot getOriginSnapshot() {
            return this.originSnapshot;
        }

        @Override
        public final java.lang.Object getReadOnly() {
            return this.readOnly;
        }

        @Override
        public final java.lang.Number getRecordSizeKib() {
            return this.recordSizeKib;
        }

        @Override
        public final java.lang.Number getStorageCapacityQuotaGib() {
            return this.storageCapacityQuotaGib;
        }

        @Override
        public final java.lang.Number getStorageCapacityReservationGib() {
            return this.storageCapacityReservationGib;
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
        public final imports.aws.fsx_openzfs_volume.FsxOpenzfsVolumeTimeouts getTimeouts() {
            return this.timeouts;
        }

        @Override
        public final java.lang.Object getUserAndGroupQuotas() {
            return this.userAndGroupQuotas;
        }

        @Override
        public final java.lang.String getVolumeType() {
            return this.volumeType;
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

            data.set("name", om.valueToTree(this.getName()));
            data.set("parentVolumeId", om.valueToTree(this.getParentVolumeId()));
            if (this.getCopyTagsToSnapshots() != null) {
                data.set("copyTagsToSnapshots", om.valueToTree(this.getCopyTagsToSnapshots()));
            }
            if (this.getDataCompressionType() != null) {
                data.set("dataCompressionType", om.valueToTree(this.getDataCompressionType()));
            }
            if (this.getDeleteVolumeOptions() != null) {
                data.set("deleteVolumeOptions", om.valueToTree(this.getDeleteVolumeOptions()));
            }
            if (this.getId() != null) {
                data.set("id", om.valueToTree(this.getId()));
            }
            if (this.getNfsExports() != null) {
                data.set("nfsExports", om.valueToTree(this.getNfsExports()));
            }
            if (this.getOriginSnapshot() != null) {
                data.set("originSnapshot", om.valueToTree(this.getOriginSnapshot()));
            }
            if (this.getReadOnly() != null) {
                data.set("readOnly", om.valueToTree(this.getReadOnly()));
            }
            if (this.getRecordSizeKib() != null) {
                data.set("recordSizeKib", om.valueToTree(this.getRecordSizeKib()));
            }
            if (this.getStorageCapacityQuotaGib() != null) {
                data.set("storageCapacityQuotaGib", om.valueToTree(this.getStorageCapacityQuotaGib()));
            }
            if (this.getStorageCapacityReservationGib() != null) {
                data.set("storageCapacityReservationGib", om.valueToTree(this.getStorageCapacityReservationGib()));
            }
            if (this.getTags() != null) {
                data.set("tags", om.valueToTree(this.getTags()));
            }
            if (this.getTagsAll() != null) {
                data.set("tagsAll", om.valueToTree(this.getTagsAll()));
            }
            if (this.getTimeouts() != null) {
                data.set("timeouts", om.valueToTree(this.getTimeouts()));
            }
            if (this.getUserAndGroupQuotas() != null) {
                data.set("userAndGroupQuotas", om.valueToTree(this.getUserAndGroupQuotas()));
            }
            if (this.getVolumeType() != null) {
                data.set("volumeType", om.valueToTree(this.getVolumeType()));
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
            struct.set("fqn", om.valueToTree("aws.fsxOpenzfsVolume.FsxOpenzfsVolumeConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            FsxOpenzfsVolumeConfig.Jsii$Proxy that = (FsxOpenzfsVolumeConfig.Jsii$Proxy) o;

            if (!name.equals(that.name)) return false;
            if (!parentVolumeId.equals(that.parentVolumeId)) return false;
            if (this.copyTagsToSnapshots != null ? !this.copyTagsToSnapshots.equals(that.copyTagsToSnapshots) : that.copyTagsToSnapshots != null) return false;
            if (this.dataCompressionType != null ? !this.dataCompressionType.equals(that.dataCompressionType) : that.dataCompressionType != null) return false;
            if (this.deleteVolumeOptions != null ? !this.deleteVolumeOptions.equals(that.deleteVolumeOptions) : that.deleteVolumeOptions != null) return false;
            if (this.id != null ? !this.id.equals(that.id) : that.id != null) return false;
            if (this.nfsExports != null ? !this.nfsExports.equals(that.nfsExports) : that.nfsExports != null) return false;
            if (this.originSnapshot != null ? !this.originSnapshot.equals(that.originSnapshot) : that.originSnapshot != null) return false;
            if (this.readOnly != null ? !this.readOnly.equals(that.readOnly) : that.readOnly != null) return false;
            if (this.recordSizeKib != null ? !this.recordSizeKib.equals(that.recordSizeKib) : that.recordSizeKib != null) return false;
            if (this.storageCapacityQuotaGib != null ? !this.storageCapacityQuotaGib.equals(that.storageCapacityQuotaGib) : that.storageCapacityQuotaGib != null) return false;
            if (this.storageCapacityReservationGib != null ? !this.storageCapacityReservationGib.equals(that.storageCapacityReservationGib) : that.storageCapacityReservationGib != null) return false;
            if (this.tags != null ? !this.tags.equals(that.tags) : that.tags != null) return false;
            if (this.tagsAll != null ? !this.tagsAll.equals(that.tagsAll) : that.tagsAll != null) return false;
            if (this.timeouts != null ? !this.timeouts.equals(that.timeouts) : that.timeouts != null) return false;
            if (this.userAndGroupQuotas != null ? !this.userAndGroupQuotas.equals(that.userAndGroupQuotas) : that.userAndGroupQuotas != null) return false;
            if (this.volumeType != null ? !this.volumeType.equals(that.volumeType) : that.volumeType != null) return false;
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
            int result = this.name.hashCode();
            result = 31 * result + (this.parentVolumeId.hashCode());
            result = 31 * result + (this.copyTagsToSnapshots != null ? this.copyTagsToSnapshots.hashCode() : 0);
            result = 31 * result + (this.dataCompressionType != null ? this.dataCompressionType.hashCode() : 0);
            result = 31 * result + (this.deleteVolumeOptions != null ? this.deleteVolumeOptions.hashCode() : 0);
            result = 31 * result + (this.id != null ? this.id.hashCode() : 0);
            result = 31 * result + (this.nfsExports != null ? this.nfsExports.hashCode() : 0);
            result = 31 * result + (this.originSnapshot != null ? this.originSnapshot.hashCode() : 0);
            result = 31 * result + (this.readOnly != null ? this.readOnly.hashCode() : 0);
            result = 31 * result + (this.recordSizeKib != null ? this.recordSizeKib.hashCode() : 0);
            result = 31 * result + (this.storageCapacityQuotaGib != null ? this.storageCapacityQuotaGib.hashCode() : 0);
            result = 31 * result + (this.storageCapacityReservationGib != null ? this.storageCapacityReservationGib.hashCode() : 0);
            result = 31 * result + (this.tags != null ? this.tags.hashCode() : 0);
            result = 31 * result + (this.tagsAll != null ? this.tagsAll.hashCode() : 0);
            result = 31 * result + (this.timeouts != null ? this.timeouts.hashCode() : 0);
            result = 31 * result + (this.userAndGroupQuotas != null ? this.userAndGroupQuotas.hashCode() : 0);
            result = 31 * result + (this.volumeType != null ? this.volumeType.hashCode() : 0);
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
