package imports.aws.fsx_ontap_volume;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.253Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.fsxOntapVolume.FsxOntapVolumeConfig")
@software.amazon.jsii.Jsii.Proxy(FsxOntapVolumeConfig.Jsii$Proxy.class)
public interface FsxOntapVolumeConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_ontap_volume#name FsxOntapVolume#name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getName();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_ontap_volume#storage_virtual_machine_id FsxOntapVolume#storage_virtual_machine_id}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getStorageVirtualMachineId();

    /**
     * aggregate_configuration block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_ontap_volume#aggregate_configuration FsxOntapVolume#aggregate_configuration}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.fsx_ontap_volume.FsxOntapVolumeAggregateConfiguration getAggregateConfiguration() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_ontap_volume#bypass_snaplock_enterprise_retention FsxOntapVolume#bypass_snaplock_enterprise_retention}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getBypassSnaplockEnterpriseRetention() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_ontap_volume#copy_tags_to_backups FsxOntapVolume#copy_tags_to_backups}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getCopyTagsToBackups() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_ontap_volume#final_backup_tags FsxOntapVolume#final_backup_tags}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getFinalBackupTags() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_ontap_volume#id FsxOntapVolume#id}.
     * <p>
     * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
     * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_ontap_volume#junction_path FsxOntapVolume#junction_path}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getJunctionPath() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_ontap_volume#ontap_volume_type FsxOntapVolume#ontap_volume_type}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getOntapVolumeType() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_ontap_volume#security_style FsxOntapVolume#security_style}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getSecurityStyle() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_ontap_volume#size_in_bytes FsxOntapVolume#size_in_bytes}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getSizeInBytes() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_ontap_volume#size_in_megabytes FsxOntapVolume#size_in_megabytes}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getSizeInMegabytes() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_ontap_volume#skip_final_backup FsxOntapVolume#skip_final_backup}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getSkipFinalBackup() {
        return null;
    }

    /**
     * snaplock_configuration block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_ontap_volume#snaplock_configuration FsxOntapVolume#snaplock_configuration}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.fsx_ontap_volume.FsxOntapVolumeSnaplockConfiguration getSnaplockConfiguration() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_ontap_volume#snapshot_policy FsxOntapVolume#snapshot_policy}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getSnapshotPolicy() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_ontap_volume#storage_efficiency_enabled FsxOntapVolume#storage_efficiency_enabled}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getStorageEfficiencyEnabled() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_ontap_volume#tags FsxOntapVolume#tags}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTags() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_ontap_volume#tags_all FsxOntapVolume#tags_all}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsAll() {
        return null;
    }

    /**
     * tiering_policy block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_ontap_volume#tiering_policy FsxOntapVolume#tiering_policy}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.fsx_ontap_volume.FsxOntapVolumeTieringPolicy getTieringPolicy() {
        return null;
    }

    /**
     * timeouts block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_ontap_volume#timeouts FsxOntapVolume#timeouts}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.fsx_ontap_volume.FsxOntapVolumeTimeouts getTimeouts() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_ontap_volume#volume_style FsxOntapVolume#volume_style}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getVolumeStyle() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_ontap_volume#volume_type FsxOntapVolume#volume_type}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getVolumeType() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link FsxOntapVolumeConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link FsxOntapVolumeConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<FsxOntapVolumeConfig> {
        java.lang.String name;
        java.lang.String storageVirtualMachineId;
        imports.aws.fsx_ontap_volume.FsxOntapVolumeAggregateConfiguration aggregateConfiguration;
        java.lang.Object bypassSnaplockEnterpriseRetention;
        java.lang.Object copyTagsToBackups;
        java.util.Map<java.lang.String, java.lang.String> finalBackupTags;
        java.lang.String id;
        java.lang.String junctionPath;
        java.lang.String ontapVolumeType;
        java.lang.String securityStyle;
        java.lang.String sizeInBytes;
        java.lang.Number sizeInMegabytes;
        java.lang.Object skipFinalBackup;
        imports.aws.fsx_ontap_volume.FsxOntapVolumeSnaplockConfiguration snaplockConfiguration;
        java.lang.String snapshotPolicy;
        java.lang.Object storageEfficiencyEnabled;
        java.util.Map<java.lang.String, java.lang.String> tags;
        java.util.Map<java.lang.String, java.lang.String> tagsAll;
        imports.aws.fsx_ontap_volume.FsxOntapVolumeTieringPolicy tieringPolicy;
        imports.aws.fsx_ontap_volume.FsxOntapVolumeTimeouts timeouts;
        java.lang.String volumeStyle;
        java.lang.String volumeType;
        java.lang.Object connection;
        java.lang.Object count;
        java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        com.hashicorp.cdktf.ITerraformIterator forEach;
        com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        com.hashicorp.cdktf.TerraformProvider provider;
        java.util.List<java.lang.Object> provisioners;

        /**
         * Sets the value of {@link FsxOntapVolumeConfig#getName}
         * @param name Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_ontap_volume#name FsxOntapVolume#name}. This parameter is required.
         * @return {@code this}
         */
        public Builder name(java.lang.String name) {
            this.name = name;
            return this;
        }

        /**
         * Sets the value of {@link FsxOntapVolumeConfig#getStorageVirtualMachineId}
         * @param storageVirtualMachineId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_ontap_volume#storage_virtual_machine_id FsxOntapVolume#storage_virtual_machine_id}. This parameter is required.
         * @return {@code this}
         */
        public Builder storageVirtualMachineId(java.lang.String storageVirtualMachineId) {
            this.storageVirtualMachineId = storageVirtualMachineId;
            return this;
        }

        /**
         * Sets the value of {@link FsxOntapVolumeConfig#getAggregateConfiguration}
         * @param aggregateConfiguration aggregate_configuration block.
         *                               Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_ontap_volume#aggregate_configuration FsxOntapVolume#aggregate_configuration}
         * @return {@code this}
         */
        public Builder aggregateConfiguration(imports.aws.fsx_ontap_volume.FsxOntapVolumeAggregateConfiguration aggregateConfiguration) {
            this.aggregateConfiguration = aggregateConfiguration;
            return this;
        }

        /**
         * Sets the value of {@link FsxOntapVolumeConfig#getBypassSnaplockEnterpriseRetention}
         * @param bypassSnaplockEnterpriseRetention Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_ontap_volume#bypass_snaplock_enterprise_retention FsxOntapVolume#bypass_snaplock_enterprise_retention}.
         * @return {@code this}
         */
        public Builder bypassSnaplockEnterpriseRetention(java.lang.Boolean bypassSnaplockEnterpriseRetention) {
            this.bypassSnaplockEnterpriseRetention = bypassSnaplockEnterpriseRetention;
            return this;
        }

        /**
         * Sets the value of {@link FsxOntapVolumeConfig#getBypassSnaplockEnterpriseRetention}
         * @param bypassSnaplockEnterpriseRetention Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_ontap_volume#bypass_snaplock_enterprise_retention FsxOntapVolume#bypass_snaplock_enterprise_retention}.
         * @return {@code this}
         */
        public Builder bypassSnaplockEnterpriseRetention(com.hashicorp.cdktf.IResolvable bypassSnaplockEnterpriseRetention) {
            this.bypassSnaplockEnterpriseRetention = bypassSnaplockEnterpriseRetention;
            return this;
        }

        /**
         * Sets the value of {@link FsxOntapVolumeConfig#getCopyTagsToBackups}
         * @param copyTagsToBackups Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_ontap_volume#copy_tags_to_backups FsxOntapVolume#copy_tags_to_backups}.
         * @return {@code this}
         */
        public Builder copyTagsToBackups(java.lang.Boolean copyTagsToBackups) {
            this.copyTagsToBackups = copyTagsToBackups;
            return this;
        }

        /**
         * Sets the value of {@link FsxOntapVolumeConfig#getCopyTagsToBackups}
         * @param copyTagsToBackups Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_ontap_volume#copy_tags_to_backups FsxOntapVolume#copy_tags_to_backups}.
         * @return {@code this}
         */
        public Builder copyTagsToBackups(com.hashicorp.cdktf.IResolvable copyTagsToBackups) {
            this.copyTagsToBackups = copyTagsToBackups;
            return this;
        }

        /**
         * Sets the value of {@link FsxOntapVolumeConfig#getFinalBackupTags}
         * @param finalBackupTags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_ontap_volume#final_backup_tags FsxOntapVolume#final_backup_tags}.
         * @return {@code this}
         */
        public Builder finalBackupTags(java.util.Map<java.lang.String, java.lang.String> finalBackupTags) {
            this.finalBackupTags = finalBackupTags;
            return this;
        }

        /**
         * Sets the value of {@link FsxOntapVolumeConfig#getId}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_ontap_volume#id FsxOntapVolume#id}.
         *           Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         *           If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * @return {@code this}
         */
        public Builder id(java.lang.String id) {
            this.id = id;
            return this;
        }

        /**
         * Sets the value of {@link FsxOntapVolumeConfig#getJunctionPath}
         * @param junctionPath Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_ontap_volume#junction_path FsxOntapVolume#junction_path}.
         * @return {@code this}
         */
        public Builder junctionPath(java.lang.String junctionPath) {
            this.junctionPath = junctionPath;
            return this;
        }

        /**
         * Sets the value of {@link FsxOntapVolumeConfig#getOntapVolumeType}
         * @param ontapVolumeType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_ontap_volume#ontap_volume_type FsxOntapVolume#ontap_volume_type}.
         * @return {@code this}
         */
        public Builder ontapVolumeType(java.lang.String ontapVolumeType) {
            this.ontapVolumeType = ontapVolumeType;
            return this;
        }

        /**
         * Sets the value of {@link FsxOntapVolumeConfig#getSecurityStyle}
         * @param securityStyle Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_ontap_volume#security_style FsxOntapVolume#security_style}.
         * @return {@code this}
         */
        public Builder securityStyle(java.lang.String securityStyle) {
            this.securityStyle = securityStyle;
            return this;
        }

        /**
         * Sets the value of {@link FsxOntapVolumeConfig#getSizeInBytes}
         * @param sizeInBytes Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_ontap_volume#size_in_bytes FsxOntapVolume#size_in_bytes}.
         * @return {@code this}
         */
        public Builder sizeInBytes(java.lang.String sizeInBytes) {
            this.sizeInBytes = sizeInBytes;
            return this;
        }

        /**
         * Sets the value of {@link FsxOntapVolumeConfig#getSizeInMegabytes}
         * @param sizeInMegabytes Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_ontap_volume#size_in_megabytes FsxOntapVolume#size_in_megabytes}.
         * @return {@code this}
         */
        public Builder sizeInMegabytes(java.lang.Number sizeInMegabytes) {
            this.sizeInMegabytes = sizeInMegabytes;
            return this;
        }

        /**
         * Sets the value of {@link FsxOntapVolumeConfig#getSkipFinalBackup}
         * @param skipFinalBackup Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_ontap_volume#skip_final_backup FsxOntapVolume#skip_final_backup}.
         * @return {@code this}
         */
        public Builder skipFinalBackup(java.lang.Boolean skipFinalBackup) {
            this.skipFinalBackup = skipFinalBackup;
            return this;
        }

        /**
         * Sets the value of {@link FsxOntapVolumeConfig#getSkipFinalBackup}
         * @param skipFinalBackup Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_ontap_volume#skip_final_backup FsxOntapVolume#skip_final_backup}.
         * @return {@code this}
         */
        public Builder skipFinalBackup(com.hashicorp.cdktf.IResolvable skipFinalBackup) {
            this.skipFinalBackup = skipFinalBackup;
            return this;
        }

        /**
         * Sets the value of {@link FsxOntapVolumeConfig#getSnaplockConfiguration}
         * @param snaplockConfiguration snaplock_configuration block.
         *                              Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_ontap_volume#snaplock_configuration FsxOntapVolume#snaplock_configuration}
         * @return {@code this}
         */
        public Builder snaplockConfiguration(imports.aws.fsx_ontap_volume.FsxOntapVolumeSnaplockConfiguration snaplockConfiguration) {
            this.snaplockConfiguration = snaplockConfiguration;
            return this;
        }

        /**
         * Sets the value of {@link FsxOntapVolumeConfig#getSnapshotPolicy}
         * @param snapshotPolicy Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_ontap_volume#snapshot_policy FsxOntapVolume#snapshot_policy}.
         * @return {@code this}
         */
        public Builder snapshotPolicy(java.lang.String snapshotPolicy) {
            this.snapshotPolicy = snapshotPolicy;
            return this;
        }

        /**
         * Sets the value of {@link FsxOntapVolumeConfig#getStorageEfficiencyEnabled}
         * @param storageEfficiencyEnabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_ontap_volume#storage_efficiency_enabled FsxOntapVolume#storage_efficiency_enabled}.
         * @return {@code this}
         */
        public Builder storageEfficiencyEnabled(java.lang.Boolean storageEfficiencyEnabled) {
            this.storageEfficiencyEnabled = storageEfficiencyEnabled;
            return this;
        }

        /**
         * Sets the value of {@link FsxOntapVolumeConfig#getStorageEfficiencyEnabled}
         * @param storageEfficiencyEnabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_ontap_volume#storage_efficiency_enabled FsxOntapVolume#storage_efficiency_enabled}.
         * @return {@code this}
         */
        public Builder storageEfficiencyEnabled(com.hashicorp.cdktf.IResolvable storageEfficiencyEnabled) {
            this.storageEfficiencyEnabled = storageEfficiencyEnabled;
            return this;
        }

        /**
         * Sets the value of {@link FsxOntapVolumeConfig#getTags}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_ontap_volume#tags FsxOntapVolume#tags}.
         * @return {@code this}
         */
        public Builder tags(java.util.Map<java.lang.String, java.lang.String> tags) {
            this.tags = tags;
            return this;
        }

        /**
         * Sets the value of {@link FsxOntapVolumeConfig#getTagsAll}
         * @param tagsAll Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_ontap_volume#tags_all FsxOntapVolume#tags_all}.
         * @return {@code this}
         */
        public Builder tagsAll(java.util.Map<java.lang.String, java.lang.String> tagsAll) {
            this.tagsAll = tagsAll;
            return this;
        }

        /**
         * Sets the value of {@link FsxOntapVolumeConfig#getTieringPolicy}
         * @param tieringPolicy tiering_policy block.
         *                      Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_ontap_volume#tiering_policy FsxOntapVolume#tiering_policy}
         * @return {@code this}
         */
        public Builder tieringPolicy(imports.aws.fsx_ontap_volume.FsxOntapVolumeTieringPolicy tieringPolicy) {
            this.tieringPolicy = tieringPolicy;
            return this;
        }

        /**
         * Sets the value of {@link FsxOntapVolumeConfig#getTimeouts}
         * @param timeouts timeouts block.
         *                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_ontap_volume#timeouts FsxOntapVolume#timeouts}
         * @return {@code this}
         */
        public Builder timeouts(imports.aws.fsx_ontap_volume.FsxOntapVolumeTimeouts timeouts) {
            this.timeouts = timeouts;
            return this;
        }

        /**
         * Sets the value of {@link FsxOntapVolumeConfig#getVolumeStyle}
         * @param volumeStyle Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_ontap_volume#volume_style FsxOntapVolume#volume_style}.
         * @return {@code this}
         */
        public Builder volumeStyle(java.lang.String volumeStyle) {
            this.volumeStyle = volumeStyle;
            return this;
        }

        /**
         * Sets the value of {@link FsxOntapVolumeConfig#getVolumeType}
         * @param volumeType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_ontap_volume#volume_type FsxOntapVolume#volume_type}.
         * @return {@code this}
         */
        public Builder volumeType(java.lang.String volumeType) {
            this.volumeType = volumeType;
            return this;
        }

        /**
         * Sets the value of {@link FsxOntapVolumeConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link FsxOntapVolumeConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link FsxOntapVolumeConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link FsxOntapVolumeConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link FsxOntapVolumeConfig#getDependsOn}
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
         * Sets the value of {@link FsxOntapVolumeConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link FsxOntapVolumeConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link FsxOntapVolumeConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link FsxOntapVolumeConfig#getProvisioners}
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
         * @return a new instance of {@link FsxOntapVolumeConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public FsxOntapVolumeConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link FsxOntapVolumeConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements FsxOntapVolumeConfig {
        private final java.lang.String name;
        private final java.lang.String storageVirtualMachineId;
        private final imports.aws.fsx_ontap_volume.FsxOntapVolumeAggregateConfiguration aggregateConfiguration;
        private final java.lang.Object bypassSnaplockEnterpriseRetention;
        private final java.lang.Object copyTagsToBackups;
        private final java.util.Map<java.lang.String, java.lang.String> finalBackupTags;
        private final java.lang.String id;
        private final java.lang.String junctionPath;
        private final java.lang.String ontapVolumeType;
        private final java.lang.String securityStyle;
        private final java.lang.String sizeInBytes;
        private final java.lang.Number sizeInMegabytes;
        private final java.lang.Object skipFinalBackup;
        private final imports.aws.fsx_ontap_volume.FsxOntapVolumeSnaplockConfiguration snaplockConfiguration;
        private final java.lang.String snapshotPolicy;
        private final java.lang.Object storageEfficiencyEnabled;
        private final java.util.Map<java.lang.String, java.lang.String> tags;
        private final java.util.Map<java.lang.String, java.lang.String> tagsAll;
        private final imports.aws.fsx_ontap_volume.FsxOntapVolumeTieringPolicy tieringPolicy;
        private final imports.aws.fsx_ontap_volume.FsxOntapVolumeTimeouts timeouts;
        private final java.lang.String volumeStyle;
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
            this.storageVirtualMachineId = software.amazon.jsii.Kernel.get(this, "storageVirtualMachineId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.aggregateConfiguration = software.amazon.jsii.Kernel.get(this, "aggregateConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.fsx_ontap_volume.FsxOntapVolumeAggregateConfiguration.class));
            this.bypassSnaplockEnterpriseRetention = software.amazon.jsii.Kernel.get(this, "bypassSnaplockEnterpriseRetention", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.copyTagsToBackups = software.amazon.jsii.Kernel.get(this, "copyTagsToBackups", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.finalBackupTags = software.amazon.jsii.Kernel.get(this, "finalBackupTags", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.id = software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.junctionPath = software.amazon.jsii.Kernel.get(this, "junctionPath", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.ontapVolumeType = software.amazon.jsii.Kernel.get(this, "ontapVolumeType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.securityStyle = software.amazon.jsii.Kernel.get(this, "securityStyle", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.sizeInBytes = software.amazon.jsii.Kernel.get(this, "sizeInBytes", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.sizeInMegabytes = software.amazon.jsii.Kernel.get(this, "sizeInMegabytes", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.skipFinalBackup = software.amazon.jsii.Kernel.get(this, "skipFinalBackup", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.snaplockConfiguration = software.amazon.jsii.Kernel.get(this, "snaplockConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.fsx_ontap_volume.FsxOntapVolumeSnaplockConfiguration.class));
            this.snapshotPolicy = software.amazon.jsii.Kernel.get(this, "snapshotPolicy", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.storageEfficiencyEnabled = software.amazon.jsii.Kernel.get(this, "storageEfficiencyEnabled", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.tags = software.amazon.jsii.Kernel.get(this, "tags", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.tagsAll = software.amazon.jsii.Kernel.get(this, "tagsAll", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.tieringPolicy = software.amazon.jsii.Kernel.get(this, "tieringPolicy", software.amazon.jsii.NativeType.forClass(imports.aws.fsx_ontap_volume.FsxOntapVolumeTieringPolicy.class));
            this.timeouts = software.amazon.jsii.Kernel.get(this, "timeouts", software.amazon.jsii.NativeType.forClass(imports.aws.fsx_ontap_volume.FsxOntapVolumeTimeouts.class));
            this.volumeStyle = software.amazon.jsii.Kernel.get(this, "volumeStyle", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
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
            this.storageVirtualMachineId = java.util.Objects.requireNonNull(builder.storageVirtualMachineId, "storageVirtualMachineId is required");
            this.aggregateConfiguration = builder.aggregateConfiguration;
            this.bypassSnaplockEnterpriseRetention = builder.bypassSnaplockEnterpriseRetention;
            this.copyTagsToBackups = builder.copyTagsToBackups;
            this.finalBackupTags = builder.finalBackupTags;
            this.id = builder.id;
            this.junctionPath = builder.junctionPath;
            this.ontapVolumeType = builder.ontapVolumeType;
            this.securityStyle = builder.securityStyle;
            this.sizeInBytes = builder.sizeInBytes;
            this.sizeInMegabytes = builder.sizeInMegabytes;
            this.skipFinalBackup = builder.skipFinalBackup;
            this.snaplockConfiguration = builder.snaplockConfiguration;
            this.snapshotPolicy = builder.snapshotPolicy;
            this.storageEfficiencyEnabled = builder.storageEfficiencyEnabled;
            this.tags = builder.tags;
            this.tagsAll = builder.tagsAll;
            this.tieringPolicy = builder.tieringPolicy;
            this.timeouts = builder.timeouts;
            this.volumeStyle = builder.volumeStyle;
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
        public final java.lang.String getStorageVirtualMachineId() {
            return this.storageVirtualMachineId;
        }

        @Override
        public final imports.aws.fsx_ontap_volume.FsxOntapVolumeAggregateConfiguration getAggregateConfiguration() {
            return this.aggregateConfiguration;
        }

        @Override
        public final java.lang.Object getBypassSnaplockEnterpriseRetention() {
            return this.bypassSnaplockEnterpriseRetention;
        }

        @Override
        public final java.lang.Object getCopyTagsToBackups() {
            return this.copyTagsToBackups;
        }

        @Override
        public final java.util.Map<java.lang.String, java.lang.String> getFinalBackupTags() {
            return this.finalBackupTags;
        }

        @Override
        public final java.lang.String getId() {
            return this.id;
        }

        @Override
        public final java.lang.String getJunctionPath() {
            return this.junctionPath;
        }

        @Override
        public final java.lang.String getOntapVolumeType() {
            return this.ontapVolumeType;
        }

        @Override
        public final java.lang.String getSecurityStyle() {
            return this.securityStyle;
        }

        @Override
        public final java.lang.String getSizeInBytes() {
            return this.sizeInBytes;
        }

        @Override
        public final java.lang.Number getSizeInMegabytes() {
            return this.sizeInMegabytes;
        }

        @Override
        public final java.lang.Object getSkipFinalBackup() {
            return this.skipFinalBackup;
        }

        @Override
        public final imports.aws.fsx_ontap_volume.FsxOntapVolumeSnaplockConfiguration getSnaplockConfiguration() {
            return this.snaplockConfiguration;
        }

        @Override
        public final java.lang.String getSnapshotPolicy() {
            return this.snapshotPolicy;
        }

        @Override
        public final java.lang.Object getStorageEfficiencyEnabled() {
            return this.storageEfficiencyEnabled;
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
        public final imports.aws.fsx_ontap_volume.FsxOntapVolumeTieringPolicy getTieringPolicy() {
            return this.tieringPolicy;
        }

        @Override
        public final imports.aws.fsx_ontap_volume.FsxOntapVolumeTimeouts getTimeouts() {
            return this.timeouts;
        }

        @Override
        public final java.lang.String getVolumeStyle() {
            return this.volumeStyle;
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
            data.set("storageVirtualMachineId", om.valueToTree(this.getStorageVirtualMachineId()));
            if (this.getAggregateConfiguration() != null) {
                data.set("aggregateConfiguration", om.valueToTree(this.getAggregateConfiguration()));
            }
            if (this.getBypassSnaplockEnterpriseRetention() != null) {
                data.set("bypassSnaplockEnterpriseRetention", om.valueToTree(this.getBypassSnaplockEnterpriseRetention()));
            }
            if (this.getCopyTagsToBackups() != null) {
                data.set("copyTagsToBackups", om.valueToTree(this.getCopyTagsToBackups()));
            }
            if (this.getFinalBackupTags() != null) {
                data.set("finalBackupTags", om.valueToTree(this.getFinalBackupTags()));
            }
            if (this.getId() != null) {
                data.set("id", om.valueToTree(this.getId()));
            }
            if (this.getJunctionPath() != null) {
                data.set("junctionPath", om.valueToTree(this.getJunctionPath()));
            }
            if (this.getOntapVolumeType() != null) {
                data.set("ontapVolumeType", om.valueToTree(this.getOntapVolumeType()));
            }
            if (this.getSecurityStyle() != null) {
                data.set("securityStyle", om.valueToTree(this.getSecurityStyle()));
            }
            if (this.getSizeInBytes() != null) {
                data.set("sizeInBytes", om.valueToTree(this.getSizeInBytes()));
            }
            if (this.getSizeInMegabytes() != null) {
                data.set("sizeInMegabytes", om.valueToTree(this.getSizeInMegabytes()));
            }
            if (this.getSkipFinalBackup() != null) {
                data.set("skipFinalBackup", om.valueToTree(this.getSkipFinalBackup()));
            }
            if (this.getSnaplockConfiguration() != null) {
                data.set("snaplockConfiguration", om.valueToTree(this.getSnaplockConfiguration()));
            }
            if (this.getSnapshotPolicy() != null) {
                data.set("snapshotPolicy", om.valueToTree(this.getSnapshotPolicy()));
            }
            if (this.getStorageEfficiencyEnabled() != null) {
                data.set("storageEfficiencyEnabled", om.valueToTree(this.getStorageEfficiencyEnabled()));
            }
            if (this.getTags() != null) {
                data.set("tags", om.valueToTree(this.getTags()));
            }
            if (this.getTagsAll() != null) {
                data.set("tagsAll", om.valueToTree(this.getTagsAll()));
            }
            if (this.getTieringPolicy() != null) {
                data.set("tieringPolicy", om.valueToTree(this.getTieringPolicy()));
            }
            if (this.getTimeouts() != null) {
                data.set("timeouts", om.valueToTree(this.getTimeouts()));
            }
            if (this.getVolumeStyle() != null) {
                data.set("volumeStyle", om.valueToTree(this.getVolumeStyle()));
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
            struct.set("fqn", om.valueToTree("aws.fsxOntapVolume.FsxOntapVolumeConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            FsxOntapVolumeConfig.Jsii$Proxy that = (FsxOntapVolumeConfig.Jsii$Proxy) o;

            if (!name.equals(that.name)) return false;
            if (!storageVirtualMachineId.equals(that.storageVirtualMachineId)) return false;
            if (this.aggregateConfiguration != null ? !this.aggregateConfiguration.equals(that.aggregateConfiguration) : that.aggregateConfiguration != null) return false;
            if (this.bypassSnaplockEnterpriseRetention != null ? !this.bypassSnaplockEnterpriseRetention.equals(that.bypassSnaplockEnterpriseRetention) : that.bypassSnaplockEnterpriseRetention != null) return false;
            if (this.copyTagsToBackups != null ? !this.copyTagsToBackups.equals(that.copyTagsToBackups) : that.copyTagsToBackups != null) return false;
            if (this.finalBackupTags != null ? !this.finalBackupTags.equals(that.finalBackupTags) : that.finalBackupTags != null) return false;
            if (this.id != null ? !this.id.equals(that.id) : that.id != null) return false;
            if (this.junctionPath != null ? !this.junctionPath.equals(that.junctionPath) : that.junctionPath != null) return false;
            if (this.ontapVolumeType != null ? !this.ontapVolumeType.equals(that.ontapVolumeType) : that.ontapVolumeType != null) return false;
            if (this.securityStyle != null ? !this.securityStyle.equals(that.securityStyle) : that.securityStyle != null) return false;
            if (this.sizeInBytes != null ? !this.sizeInBytes.equals(that.sizeInBytes) : that.sizeInBytes != null) return false;
            if (this.sizeInMegabytes != null ? !this.sizeInMegabytes.equals(that.sizeInMegabytes) : that.sizeInMegabytes != null) return false;
            if (this.skipFinalBackup != null ? !this.skipFinalBackup.equals(that.skipFinalBackup) : that.skipFinalBackup != null) return false;
            if (this.snaplockConfiguration != null ? !this.snaplockConfiguration.equals(that.snaplockConfiguration) : that.snaplockConfiguration != null) return false;
            if (this.snapshotPolicy != null ? !this.snapshotPolicy.equals(that.snapshotPolicy) : that.snapshotPolicy != null) return false;
            if (this.storageEfficiencyEnabled != null ? !this.storageEfficiencyEnabled.equals(that.storageEfficiencyEnabled) : that.storageEfficiencyEnabled != null) return false;
            if (this.tags != null ? !this.tags.equals(that.tags) : that.tags != null) return false;
            if (this.tagsAll != null ? !this.tagsAll.equals(that.tagsAll) : that.tagsAll != null) return false;
            if (this.tieringPolicy != null ? !this.tieringPolicy.equals(that.tieringPolicy) : that.tieringPolicy != null) return false;
            if (this.timeouts != null ? !this.timeouts.equals(that.timeouts) : that.timeouts != null) return false;
            if (this.volumeStyle != null ? !this.volumeStyle.equals(that.volumeStyle) : that.volumeStyle != null) return false;
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
            result = 31 * result + (this.storageVirtualMachineId.hashCode());
            result = 31 * result + (this.aggregateConfiguration != null ? this.aggregateConfiguration.hashCode() : 0);
            result = 31 * result + (this.bypassSnaplockEnterpriseRetention != null ? this.bypassSnaplockEnterpriseRetention.hashCode() : 0);
            result = 31 * result + (this.copyTagsToBackups != null ? this.copyTagsToBackups.hashCode() : 0);
            result = 31 * result + (this.finalBackupTags != null ? this.finalBackupTags.hashCode() : 0);
            result = 31 * result + (this.id != null ? this.id.hashCode() : 0);
            result = 31 * result + (this.junctionPath != null ? this.junctionPath.hashCode() : 0);
            result = 31 * result + (this.ontapVolumeType != null ? this.ontapVolumeType.hashCode() : 0);
            result = 31 * result + (this.securityStyle != null ? this.securityStyle.hashCode() : 0);
            result = 31 * result + (this.sizeInBytes != null ? this.sizeInBytes.hashCode() : 0);
            result = 31 * result + (this.sizeInMegabytes != null ? this.sizeInMegabytes.hashCode() : 0);
            result = 31 * result + (this.skipFinalBackup != null ? this.skipFinalBackup.hashCode() : 0);
            result = 31 * result + (this.snaplockConfiguration != null ? this.snaplockConfiguration.hashCode() : 0);
            result = 31 * result + (this.snapshotPolicy != null ? this.snapshotPolicy.hashCode() : 0);
            result = 31 * result + (this.storageEfficiencyEnabled != null ? this.storageEfficiencyEnabled.hashCode() : 0);
            result = 31 * result + (this.tags != null ? this.tags.hashCode() : 0);
            result = 31 * result + (this.tagsAll != null ? this.tagsAll.hashCode() : 0);
            result = 31 * result + (this.tieringPolicy != null ? this.tieringPolicy.hashCode() : 0);
            result = 31 * result + (this.timeouts != null ? this.timeouts.hashCode() : 0);
            result = 31 * result + (this.volumeStyle != null ? this.volumeStyle.hashCode() : 0);
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
