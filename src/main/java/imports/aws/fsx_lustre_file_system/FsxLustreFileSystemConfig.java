package imports.aws.fsx_lustre_file_system;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.245Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.fsxLustreFileSystem.FsxLustreFileSystemConfig")
@software.amazon.jsii.Jsii.Proxy(FsxLustreFileSystemConfig.Jsii$Proxy.class)
public interface FsxLustreFileSystemConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_lustre_file_system#subnet_ids FsxLustreFileSystem#subnet_ids}.
     */
    @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getSubnetIds();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_lustre_file_system#auto_import_policy FsxLustreFileSystem#auto_import_policy}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getAutoImportPolicy() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_lustre_file_system#automatic_backup_retention_days FsxLustreFileSystem#automatic_backup_retention_days}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getAutomaticBackupRetentionDays() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_lustre_file_system#backup_id FsxLustreFileSystem#backup_id}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getBackupId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_lustre_file_system#copy_tags_to_backups FsxLustreFileSystem#copy_tags_to_backups}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getCopyTagsToBackups() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_lustre_file_system#daily_automatic_backup_start_time FsxLustreFileSystem#daily_automatic_backup_start_time}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDailyAutomaticBackupStartTime() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_lustre_file_system#data_compression_type FsxLustreFileSystem#data_compression_type}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDataCompressionType() {
        return null;
    }

    /**
     * data_read_cache_configuration block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_lustre_file_system#data_read_cache_configuration FsxLustreFileSystem#data_read_cache_configuration}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.fsx_lustre_file_system.FsxLustreFileSystemDataReadCacheConfiguration getDataReadCacheConfiguration() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_lustre_file_system#deployment_type FsxLustreFileSystem#deployment_type}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDeploymentType() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_lustre_file_system#drive_cache_type FsxLustreFileSystem#drive_cache_type}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDriveCacheType() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_lustre_file_system#efa_enabled FsxLustreFileSystem#efa_enabled}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getEfaEnabled() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_lustre_file_system#export_path FsxLustreFileSystem#export_path}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getExportPath() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_lustre_file_system#file_system_type_version FsxLustreFileSystem#file_system_type_version}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getFileSystemTypeVersion() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_lustre_file_system#final_backup_tags FsxLustreFileSystem#final_backup_tags}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getFinalBackupTags() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_lustre_file_system#id FsxLustreFileSystem#id}.
     * <p>
     * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
     * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_lustre_file_system#imported_file_chunk_size FsxLustreFileSystem#imported_file_chunk_size}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getImportedFileChunkSize() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_lustre_file_system#import_path FsxLustreFileSystem#import_path}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getImportPath() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_lustre_file_system#kms_key_id FsxLustreFileSystem#kms_key_id}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getKmsKeyId() {
        return null;
    }

    /**
     * log_configuration block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_lustre_file_system#log_configuration FsxLustreFileSystem#log_configuration}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.fsx_lustre_file_system.FsxLustreFileSystemLogConfiguration getLogConfiguration() {
        return null;
    }

    /**
     * metadata_configuration block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_lustre_file_system#metadata_configuration FsxLustreFileSystem#metadata_configuration}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.fsx_lustre_file_system.FsxLustreFileSystemMetadataConfiguration getMetadataConfiguration() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_lustre_file_system#per_unit_storage_throughput FsxLustreFileSystem#per_unit_storage_throughput}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getPerUnitStorageThroughput() {
        return null;
    }

    /**
     * root_squash_configuration block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_lustre_file_system#root_squash_configuration FsxLustreFileSystem#root_squash_configuration}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.fsx_lustre_file_system.FsxLustreFileSystemRootSquashConfiguration getRootSquashConfiguration() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_lustre_file_system#security_group_ids FsxLustreFileSystem#security_group_ids}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getSecurityGroupIds() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_lustre_file_system#skip_final_backup FsxLustreFileSystem#skip_final_backup}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getSkipFinalBackup() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_lustre_file_system#storage_capacity FsxLustreFileSystem#storage_capacity}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getStorageCapacity() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_lustre_file_system#storage_type FsxLustreFileSystem#storage_type}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getStorageType() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_lustre_file_system#tags FsxLustreFileSystem#tags}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTags() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_lustre_file_system#tags_all FsxLustreFileSystem#tags_all}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsAll() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_lustre_file_system#throughput_capacity FsxLustreFileSystem#throughput_capacity}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getThroughputCapacity() {
        return null;
    }

    /**
     * timeouts block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_lustre_file_system#timeouts FsxLustreFileSystem#timeouts}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.fsx_lustre_file_system.FsxLustreFileSystemTimeouts getTimeouts() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_lustre_file_system#weekly_maintenance_start_time FsxLustreFileSystem#weekly_maintenance_start_time}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getWeeklyMaintenanceStartTime() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link FsxLustreFileSystemConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link FsxLustreFileSystemConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<FsxLustreFileSystemConfig> {
        java.util.List<java.lang.String> subnetIds;
        java.lang.String autoImportPolicy;
        java.lang.Number automaticBackupRetentionDays;
        java.lang.String backupId;
        java.lang.Object copyTagsToBackups;
        java.lang.String dailyAutomaticBackupStartTime;
        java.lang.String dataCompressionType;
        imports.aws.fsx_lustre_file_system.FsxLustreFileSystemDataReadCacheConfiguration dataReadCacheConfiguration;
        java.lang.String deploymentType;
        java.lang.String driveCacheType;
        java.lang.Object efaEnabled;
        java.lang.String exportPath;
        java.lang.String fileSystemTypeVersion;
        java.util.Map<java.lang.String, java.lang.String> finalBackupTags;
        java.lang.String id;
        java.lang.Number importedFileChunkSize;
        java.lang.String importPath;
        java.lang.String kmsKeyId;
        imports.aws.fsx_lustre_file_system.FsxLustreFileSystemLogConfiguration logConfiguration;
        imports.aws.fsx_lustre_file_system.FsxLustreFileSystemMetadataConfiguration metadataConfiguration;
        java.lang.Number perUnitStorageThroughput;
        imports.aws.fsx_lustre_file_system.FsxLustreFileSystemRootSquashConfiguration rootSquashConfiguration;
        java.util.List<java.lang.String> securityGroupIds;
        java.lang.Object skipFinalBackup;
        java.lang.Number storageCapacity;
        java.lang.String storageType;
        java.util.Map<java.lang.String, java.lang.String> tags;
        java.util.Map<java.lang.String, java.lang.String> tagsAll;
        java.lang.Number throughputCapacity;
        imports.aws.fsx_lustre_file_system.FsxLustreFileSystemTimeouts timeouts;
        java.lang.String weeklyMaintenanceStartTime;
        java.lang.Object connection;
        java.lang.Object count;
        java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        com.hashicorp.cdktf.ITerraformIterator forEach;
        com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        com.hashicorp.cdktf.TerraformProvider provider;
        java.util.List<java.lang.Object> provisioners;

        /**
         * Sets the value of {@link FsxLustreFileSystemConfig#getSubnetIds}
         * @param subnetIds Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_lustre_file_system#subnet_ids FsxLustreFileSystem#subnet_ids}. This parameter is required.
         * @return {@code this}
         */
        public Builder subnetIds(java.util.List<java.lang.String> subnetIds) {
            this.subnetIds = subnetIds;
            return this;
        }

        /**
         * Sets the value of {@link FsxLustreFileSystemConfig#getAutoImportPolicy}
         * @param autoImportPolicy Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_lustre_file_system#auto_import_policy FsxLustreFileSystem#auto_import_policy}.
         * @return {@code this}
         */
        public Builder autoImportPolicy(java.lang.String autoImportPolicy) {
            this.autoImportPolicy = autoImportPolicy;
            return this;
        }

        /**
         * Sets the value of {@link FsxLustreFileSystemConfig#getAutomaticBackupRetentionDays}
         * @param automaticBackupRetentionDays Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_lustre_file_system#automatic_backup_retention_days FsxLustreFileSystem#automatic_backup_retention_days}.
         * @return {@code this}
         */
        public Builder automaticBackupRetentionDays(java.lang.Number automaticBackupRetentionDays) {
            this.automaticBackupRetentionDays = automaticBackupRetentionDays;
            return this;
        }

        /**
         * Sets the value of {@link FsxLustreFileSystemConfig#getBackupId}
         * @param backupId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_lustre_file_system#backup_id FsxLustreFileSystem#backup_id}.
         * @return {@code this}
         */
        public Builder backupId(java.lang.String backupId) {
            this.backupId = backupId;
            return this;
        }

        /**
         * Sets the value of {@link FsxLustreFileSystemConfig#getCopyTagsToBackups}
         * @param copyTagsToBackups Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_lustre_file_system#copy_tags_to_backups FsxLustreFileSystem#copy_tags_to_backups}.
         * @return {@code this}
         */
        public Builder copyTagsToBackups(java.lang.Boolean copyTagsToBackups) {
            this.copyTagsToBackups = copyTagsToBackups;
            return this;
        }

        /**
         * Sets the value of {@link FsxLustreFileSystemConfig#getCopyTagsToBackups}
         * @param copyTagsToBackups Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_lustre_file_system#copy_tags_to_backups FsxLustreFileSystem#copy_tags_to_backups}.
         * @return {@code this}
         */
        public Builder copyTagsToBackups(com.hashicorp.cdktf.IResolvable copyTagsToBackups) {
            this.copyTagsToBackups = copyTagsToBackups;
            return this;
        }

        /**
         * Sets the value of {@link FsxLustreFileSystemConfig#getDailyAutomaticBackupStartTime}
         * @param dailyAutomaticBackupStartTime Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_lustre_file_system#daily_automatic_backup_start_time FsxLustreFileSystem#daily_automatic_backup_start_time}.
         * @return {@code this}
         */
        public Builder dailyAutomaticBackupStartTime(java.lang.String dailyAutomaticBackupStartTime) {
            this.dailyAutomaticBackupStartTime = dailyAutomaticBackupStartTime;
            return this;
        }

        /**
         * Sets the value of {@link FsxLustreFileSystemConfig#getDataCompressionType}
         * @param dataCompressionType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_lustre_file_system#data_compression_type FsxLustreFileSystem#data_compression_type}.
         * @return {@code this}
         */
        public Builder dataCompressionType(java.lang.String dataCompressionType) {
            this.dataCompressionType = dataCompressionType;
            return this;
        }

        /**
         * Sets the value of {@link FsxLustreFileSystemConfig#getDataReadCacheConfiguration}
         * @param dataReadCacheConfiguration data_read_cache_configuration block.
         *                                   Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_lustre_file_system#data_read_cache_configuration FsxLustreFileSystem#data_read_cache_configuration}
         * @return {@code this}
         */
        public Builder dataReadCacheConfiguration(imports.aws.fsx_lustre_file_system.FsxLustreFileSystemDataReadCacheConfiguration dataReadCacheConfiguration) {
            this.dataReadCacheConfiguration = dataReadCacheConfiguration;
            return this;
        }

        /**
         * Sets the value of {@link FsxLustreFileSystemConfig#getDeploymentType}
         * @param deploymentType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_lustre_file_system#deployment_type FsxLustreFileSystem#deployment_type}.
         * @return {@code this}
         */
        public Builder deploymentType(java.lang.String deploymentType) {
            this.deploymentType = deploymentType;
            return this;
        }

        /**
         * Sets the value of {@link FsxLustreFileSystemConfig#getDriveCacheType}
         * @param driveCacheType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_lustre_file_system#drive_cache_type FsxLustreFileSystem#drive_cache_type}.
         * @return {@code this}
         */
        public Builder driveCacheType(java.lang.String driveCacheType) {
            this.driveCacheType = driveCacheType;
            return this;
        }

        /**
         * Sets the value of {@link FsxLustreFileSystemConfig#getEfaEnabled}
         * @param efaEnabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_lustre_file_system#efa_enabled FsxLustreFileSystem#efa_enabled}.
         * @return {@code this}
         */
        public Builder efaEnabled(java.lang.Boolean efaEnabled) {
            this.efaEnabled = efaEnabled;
            return this;
        }

        /**
         * Sets the value of {@link FsxLustreFileSystemConfig#getEfaEnabled}
         * @param efaEnabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_lustre_file_system#efa_enabled FsxLustreFileSystem#efa_enabled}.
         * @return {@code this}
         */
        public Builder efaEnabled(com.hashicorp.cdktf.IResolvable efaEnabled) {
            this.efaEnabled = efaEnabled;
            return this;
        }

        /**
         * Sets the value of {@link FsxLustreFileSystemConfig#getExportPath}
         * @param exportPath Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_lustre_file_system#export_path FsxLustreFileSystem#export_path}.
         * @return {@code this}
         */
        public Builder exportPath(java.lang.String exportPath) {
            this.exportPath = exportPath;
            return this;
        }

        /**
         * Sets the value of {@link FsxLustreFileSystemConfig#getFileSystemTypeVersion}
         * @param fileSystemTypeVersion Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_lustre_file_system#file_system_type_version FsxLustreFileSystem#file_system_type_version}.
         * @return {@code this}
         */
        public Builder fileSystemTypeVersion(java.lang.String fileSystemTypeVersion) {
            this.fileSystemTypeVersion = fileSystemTypeVersion;
            return this;
        }

        /**
         * Sets the value of {@link FsxLustreFileSystemConfig#getFinalBackupTags}
         * @param finalBackupTags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_lustre_file_system#final_backup_tags FsxLustreFileSystem#final_backup_tags}.
         * @return {@code this}
         */
        public Builder finalBackupTags(java.util.Map<java.lang.String, java.lang.String> finalBackupTags) {
            this.finalBackupTags = finalBackupTags;
            return this;
        }

        /**
         * Sets the value of {@link FsxLustreFileSystemConfig#getId}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_lustre_file_system#id FsxLustreFileSystem#id}.
         *           Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         *           If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * @return {@code this}
         */
        public Builder id(java.lang.String id) {
            this.id = id;
            return this;
        }

        /**
         * Sets the value of {@link FsxLustreFileSystemConfig#getImportedFileChunkSize}
         * @param importedFileChunkSize Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_lustre_file_system#imported_file_chunk_size FsxLustreFileSystem#imported_file_chunk_size}.
         * @return {@code this}
         */
        public Builder importedFileChunkSize(java.lang.Number importedFileChunkSize) {
            this.importedFileChunkSize = importedFileChunkSize;
            return this;
        }

        /**
         * Sets the value of {@link FsxLustreFileSystemConfig#getImportPath}
         * @param importPath Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_lustre_file_system#import_path FsxLustreFileSystem#import_path}.
         * @return {@code this}
         */
        public Builder importPath(java.lang.String importPath) {
            this.importPath = importPath;
            return this;
        }

        /**
         * Sets the value of {@link FsxLustreFileSystemConfig#getKmsKeyId}
         * @param kmsKeyId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_lustre_file_system#kms_key_id FsxLustreFileSystem#kms_key_id}.
         * @return {@code this}
         */
        public Builder kmsKeyId(java.lang.String kmsKeyId) {
            this.kmsKeyId = kmsKeyId;
            return this;
        }

        /**
         * Sets the value of {@link FsxLustreFileSystemConfig#getLogConfiguration}
         * @param logConfiguration log_configuration block.
         *                         Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_lustre_file_system#log_configuration FsxLustreFileSystem#log_configuration}
         * @return {@code this}
         */
        public Builder logConfiguration(imports.aws.fsx_lustre_file_system.FsxLustreFileSystemLogConfiguration logConfiguration) {
            this.logConfiguration = logConfiguration;
            return this;
        }

        /**
         * Sets the value of {@link FsxLustreFileSystemConfig#getMetadataConfiguration}
         * @param metadataConfiguration metadata_configuration block.
         *                              Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_lustre_file_system#metadata_configuration FsxLustreFileSystem#metadata_configuration}
         * @return {@code this}
         */
        public Builder metadataConfiguration(imports.aws.fsx_lustre_file_system.FsxLustreFileSystemMetadataConfiguration metadataConfiguration) {
            this.metadataConfiguration = metadataConfiguration;
            return this;
        }

        /**
         * Sets the value of {@link FsxLustreFileSystemConfig#getPerUnitStorageThroughput}
         * @param perUnitStorageThroughput Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_lustre_file_system#per_unit_storage_throughput FsxLustreFileSystem#per_unit_storage_throughput}.
         * @return {@code this}
         */
        public Builder perUnitStorageThroughput(java.lang.Number perUnitStorageThroughput) {
            this.perUnitStorageThroughput = perUnitStorageThroughput;
            return this;
        }

        /**
         * Sets the value of {@link FsxLustreFileSystemConfig#getRootSquashConfiguration}
         * @param rootSquashConfiguration root_squash_configuration block.
         *                                Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_lustre_file_system#root_squash_configuration FsxLustreFileSystem#root_squash_configuration}
         * @return {@code this}
         */
        public Builder rootSquashConfiguration(imports.aws.fsx_lustre_file_system.FsxLustreFileSystemRootSquashConfiguration rootSquashConfiguration) {
            this.rootSquashConfiguration = rootSquashConfiguration;
            return this;
        }

        /**
         * Sets the value of {@link FsxLustreFileSystemConfig#getSecurityGroupIds}
         * @param securityGroupIds Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_lustre_file_system#security_group_ids FsxLustreFileSystem#security_group_ids}.
         * @return {@code this}
         */
        public Builder securityGroupIds(java.util.List<java.lang.String> securityGroupIds) {
            this.securityGroupIds = securityGroupIds;
            return this;
        }

        /**
         * Sets the value of {@link FsxLustreFileSystemConfig#getSkipFinalBackup}
         * @param skipFinalBackup Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_lustre_file_system#skip_final_backup FsxLustreFileSystem#skip_final_backup}.
         * @return {@code this}
         */
        public Builder skipFinalBackup(java.lang.Boolean skipFinalBackup) {
            this.skipFinalBackup = skipFinalBackup;
            return this;
        }

        /**
         * Sets the value of {@link FsxLustreFileSystemConfig#getSkipFinalBackup}
         * @param skipFinalBackup Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_lustre_file_system#skip_final_backup FsxLustreFileSystem#skip_final_backup}.
         * @return {@code this}
         */
        public Builder skipFinalBackup(com.hashicorp.cdktf.IResolvable skipFinalBackup) {
            this.skipFinalBackup = skipFinalBackup;
            return this;
        }

        /**
         * Sets the value of {@link FsxLustreFileSystemConfig#getStorageCapacity}
         * @param storageCapacity Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_lustre_file_system#storage_capacity FsxLustreFileSystem#storage_capacity}.
         * @return {@code this}
         */
        public Builder storageCapacity(java.lang.Number storageCapacity) {
            this.storageCapacity = storageCapacity;
            return this;
        }

        /**
         * Sets the value of {@link FsxLustreFileSystemConfig#getStorageType}
         * @param storageType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_lustre_file_system#storage_type FsxLustreFileSystem#storage_type}.
         * @return {@code this}
         */
        public Builder storageType(java.lang.String storageType) {
            this.storageType = storageType;
            return this;
        }

        /**
         * Sets the value of {@link FsxLustreFileSystemConfig#getTags}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_lustre_file_system#tags FsxLustreFileSystem#tags}.
         * @return {@code this}
         */
        public Builder tags(java.util.Map<java.lang.String, java.lang.String> tags) {
            this.tags = tags;
            return this;
        }

        /**
         * Sets the value of {@link FsxLustreFileSystemConfig#getTagsAll}
         * @param tagsAll Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_lustre_file_system#tags_all FsxLustreFileSystem#tags_all}.
         * @return {@code this}
         */
        public Builder tagsAll(java.util.Map<java.lang.String, java.lang.String> tagsAll) {
            this.tagsAll = tagsAll;
            return this;
        }

        /**
         * Sets the value of {@link FsxLustreFileSystemConfig#getThroughputCapacity}
         * @param throughputCapacity Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_lustre_file_system#throughput_capacity FsxLustreFileSystem#throughput_capacity}.
         * @return {@code this}
         */
        public Builder throughputCapacity(java.lang.Number throughputCapacity) {
            this.throughputCapacity = throughputCapacity;
            return this;
        }

        /**
         * Sets the value of {@link FsxLustreFileSystemConfig#getTimeouts}
         * @param timeouts timeouts block.
         *                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_lustre_file_system#timeouts FsxLustreFileSystem#timeouts}
         * @return {@code this}
         */
        public Builder timeouts(imports.aws.fsx_lustre_file_system.FsxLustreFileSystemTimeouts timeouts) {
            this.timeouts = timeouts;
            return this;
        }

        /**
         * Sets the value of {@link FsxLustreFileSystemConfig#getWeeklyMaintenanceStartTime}
         * @param weeklyMaintenanceStartTime Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_lustre_file_system#weekly_maintenance_start_time FsxLustreFileSystem#weekly_maintenance_start_time}.
         * @return {@code this}
         */
        public Builder weeklyMaintenanceStartTime(java.lang.String weeklyMaintenanceStartTime) {
            this.weeklyMaintenanceStartTime = weeklyMaintenanceStartTime;
            return this;
        }

        /**
         * Sets the value of {@link FsxLustreFileSystemConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link FsxLustreFileSystemConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link FsxLustreFileSystemConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link FsxLustreFileSystemConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link FsxLustreFileSystemConfig#getDependsOn}
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
         * Sets the value of {@link FsxLustreFileSystemConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link FsxLustreFileSystemConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link FsxLustreFileSystemConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link FsxLustreFileSystemConfig#getProvisioners}
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
         * @return a new instance of {@link FsxLustreFileSystemConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public FsxLustreFileSystemConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link FsxLustreFileSystemConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements FsxLustreFileSystemConfig {
        private final java.util.List<java.lang.String> subnetIds;
        private final java.lang.String autoImportPolicy;
        private final java.lang.Number automaticBackupRetentionDays;
        private final java.lang.String backupId;
        private final java.lang.Object copyTagsToBackups;
        private final java.lang.String dailyAutomaticBackupStartTime;
        private final java.lang.String dataCompressionType;
        private final imports.aws.fsx_lustre_file_system.FsxLustreFileSystemDataReadCacheConfiguration dataReadCacheConfiguration;
        private final java.lang.String deploymentType;
        private final java.lang.String driveCacheType;
        private final java.lang.Object efaEnabled;
        private final java.lang.String exportPath;
        private final java.lang.String fileSystemTypeVersion;
        private final java.util.Map<java.lang.String, java.lang.String> finalBackupTags;
        private final java.lang.String id;
        private final java.lang.Number importedFileChunkSize;
        private final java.lang.String importPath;
        private final java.lang.String kmsKeyId;
        private final imports.aws.fsx_lustre_file_system.FsxLustreFileSystemLogConfiguration logConfiguration;
        private final imports.aws.fsx_lustre_file_system.FsxLustreFileSystemMetadataConfiguration metadataConfiguration;
        private final java.lang.Number perUnitStorageThroughput;
        private final imports.aws.fsx_lustre_file_system.FsxLustreFileSystemRootSquashConfiguration rootSquashConfiguration;
        private final java.util.List<java.lang.String> securityGroupIds;
        private final java.lang.Object skipFinalBackup;
        private final java.lang.Number storageCapacity;
        private final java.lang.String storageType;
        private final java.util.Map<java.lang.String, java.lang.String> tags;
        private final java.util.Map<java.lang.String, java.lang.String> tagsAll;
        private final java.lang.Number throughputCapacity;
        private final imports.aws.fsx_lustre_file_system.FsxLustreFileSystemTimeouts timeouts;
        private final java.lang.String weeklyMaintenanceStartTime;
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
            this.subnetIds = software.amazon.jsii.Kernel.get(this, "subnetIds", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.autoImportPolicy = software.amazon.jsii.Kernel.get(this, "autoImportPolicy", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.automaticBackupRetentionDays = software.amazon.jsii.Kernel.get(this, "automaticBackupRetentionDays", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.backupId = software.amazon.jsii.Kernel.get(this, "backupId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.copyTagsToBackups = software.amazon.jsii.Kernel.get(this, "copyTagsToBackups", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.dailyAutomaticBackupStartTime = software.amazon.jsii.Kernel.get(this, "dailyAutomaticBackupStartTime", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.dataCompressionType = software.amazon.jsii.Kernel.get(this, "dataCompressionType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.dataReadCacheConfiguration = software.amazon.jsii.Kernel.get(this, "dataReadCacheConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.fsx_lustre_file_system.FsxLustreFileSystemDataReadCacheConfiguration.class));
            this.deploymentType = software.amazon.jsii.Kernel.get(this, "deploymentType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.driveCacheType = software.amazon.jsii.Kernel.get(this, "driveCacheType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.efaEnabled = software.amazon.jsii.Kernel.get(this, "efaEnabled", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.exportPath = software.amazon.jsii.Kernel.get(this, "exportPath", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.fileSystemTypeVersion = software.amazon.jsii.Kernel.get(this, "fileSystemTypeVersion", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.finalBackupTags = software.amazon.jsii.Kernel.get(this, "finalBackupTags", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.id = software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.importedFileChunkSize = software.amazon.jsii.Kernel.get(this, "importedFileChunkSize", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.importPath = software.amazon.jsii.Kernel.get(this, "importPath", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.kmsKeyId = software.amazon.jsii.Kernel.get(this, "kmsKeyId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.logConfiguration = software.amazon.jsii.Kernel.get(this, "logConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.fsx_lustre_file_system.FsxLustreFileSystemLogConfiguration.class));
            this.metadataConfiguration = software.amazon.jsii.Kernel.get(this, "metadataConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.fsx_lustre_file_system.FsxLustreFileSystemMetadataConfiguration.class));
            this.perUnitStorageThroughput = software.amazon.jsii.Kernel.get(this, "perUnitStorageThroughput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.rootSquashConfiguration = software.amazon.jsii.Kernel.get(this, "rootSquashConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.fsx_lustre_file_system.FsxLustreFileSystemRootSquashConfiguration.class));
            this.securityGroupIds = software.amazon.jsii.Kernel.get(this, "securityGroupIds", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.skipFinalBackup = software.amazon.jsii.Kernel.get(this, "skipFinalBackup", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.storageCapacity = software.amazon.jsii.Kernel.get(this, "storageCapacity", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.storageType = software.amazon.jsii.Kernel.get(this, "storageType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.tags = software.amazon.jsii.Kernel.get(this, "tags", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.tagsAll = software.amazon.jsii.Kernel.get(this, "tagsAll", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.throughputCapacity = software.amazon.jsii.Kernel.get(this, "throughputCapacity", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.timeouts = software.amazon.jsii.Kernel.get(this, "timeouts", software.amazon.jsii.NativeType.forClass(imports.aws.fsx_lustre_file_system.FsxLustreFileSystemTimeouts.class));
            this.weeklyMaintenanceStartTime = software.amazon.jsii.Kernel.get(this, "weeklyMaintenanceStartTime", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
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
            this.subnetIds = java.util.Objects.requireNonNull(builder.subnetIds, "subnetIds is required");
            this.autoImportPolicy = builder.autoImportPolicy;
            this.automaticBackupRetentionDays = builder.automaticBackupRetentionDays;
            this.backupId = builder.backupId;
            this.copyTagsToBackups = builder.copyTagsToBackups;
            this.dailyAutomaticBackupStartTime = builder.dailyAutomaticBackupStartTime;
            this.dataCompressionType = builder.dataCompressionType;
            this.dataReadCacheConfiguration = builder.dataReadCacheConfiguration;
            this.deploymentType = builder.deploymentType;
            this.driveCacheType = builder.driveCacheType;
            this.efaEnabled = builder.efaEnabled;
            this.exportPath = builder.exportPath;
            this.fileSystemTypeVersion = builder.fileSystemTypeVersion;
            this.finalBackupTags = builder.finalBackupTags;
            this.id = builder.id;
            this.importedFileChunkSize = builder.importedFileChunkSize;
            this.importPath = builder.importPath;
            this.kmsKeyId = builder.kmsKeyId;
            this.logConfiguration = builder.logConfiguration;
            this.metadataConfiguration = builder.metadataConfiguration;
            this.perUnitStorageThroughput = builder.perUnitStorageThroughput;
            this.rootSquashConfiguration = builder.rootSquashConfiguration;
            this.securityGroupIds = builder.securityGroupIds;
            this.skipFinalBackup = builder.skipFinalBackup;
            this.storageCapacity = builder.storageCapacity;
            this.storageType = builder.storageType;
            this.tags = builder.tags;
            this.tagsAll = builder.tagsAll;
            this.throughputCapacity = builder.throughputCapacity;
            this.timeouts = builder.timeouts;
            this.weeklyMaintenanceStartTime = builder.weeklyMaintenanceStartTime;
            this.connection = builder.connection;
            this.count = builder.count;
            this.dependsOn = (java.util.List<com.hashicorp.cdktf.ITerraformDependable>)builder.dependsOn;
            this.forEach = builder.forEach;
            this.lifecycle = builder.lifecycle;
            this.provider = builder.provider;
            this.provisioners = (java.util.List<java.lang.Object>)builder.provisioners;
        }

        @Override
        public final java.util.List<java.lang.String> getSubnetIds() {
            return this.subnetIds;
        }

        @Override
        public final java.lang.String getAutoImportPolicy() {
            return this.autoImportPolicy;
        }

        @Override
        public final java.lang.Number getAutomaticBackupRetentionDays() {
            return this.automaticBackupRetentionDays;
        }

        @Override
        public final java.lang.String getBackupId() {
            return this.backupId;
        }

        @Override
        public final java.lang.Object getCopyTagsToBackups() {
            return this.copyTagsToBackups;
        }

        @Override
        public final java.lang.String getDailyAutomaticBackupStartTime() {
            return this.dailyAutomaticBackupStartTime;
        }

        @Override
        public final java.lang.String getDataCompressionType() {
            return this.dataCompressionType;
        }

        @Override
        public final imports.aws.fsx_lustre_file_system.FsxLustreFileSystemDataReadCacheConfiguration getDataReadCacheConfiguration() {
            return this.dataReadCacheConfiguration;
        }

        @Override
        public final java.lang.String getDeploymentType() {
            return this.deploymentType;
        }

        @Override
        public final java.lang.String getDriveCacheType() {
            return this.driveCacheType;
        }

        @Override
        public final java.lang.Object getEfaEnabled() {
            return this.efaEnabled;
        }

        @Override
        public final java.lang.String getExportPath() {
            return this.exportPath;
        }

        @Override
        public final java.lang.String getFileSystemTypeVersion() {
            return this.fileSystemTypeVersion;
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
        public final java.lang.Number getImportedFileChunkSize() {
            return this.importedFileChunkSize;
        }

        @Override
        public final java.lang.String getImportPath() {
            return this.importPath;
        }

        @Override
        public final java.lang.String getKmsKeyId() {
            return this.kmsKeyId;
        }

        @Override
        public final imports.aws.fsx_lustre_file_system.FsxLustreFileSystemLogConfiguration getLogConfiguration() {
            return this.logConfiguration;
        }

        @Override
        public final imports.aws.fsx_lustre_file_system.FsxLustreFileSystemMetadataConfiguration getMetadataConfiguration() {
            return this.metadataConfiguration;
        }

        @Override
        public final java.lang.Number getPerUnitStorageThroughput() {
            return this.perUnitStorageThroughput;
        }

        @Override
        public final imports.aws.fsx_lustre_file_system.FsxLustreFileSystemRootSquashConfiguration getRootSquashConfiguration() {
            return this.rootSquashConfiguration;
        }

        @Override
        public final java.util.List<java.lang.String> getSecurityGroupIds() {
            return this.securityGroupIds;
        }

        @Override
        public final java.lang.Object getSkipFinalBackup() {
            return this.skipFinalBackup;
        }

        @Override
        public final java.lang.Number getStorageCapacity() {
            return this.storageCapacity;
        }

        @Override
        public final java.lang.String getStorageType() {
            return this.storageType;
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
        public final java.lang.Number getThroughputCapacity() {
            return this.throughputCapacity;
        }

        @Override
        public final imports.aws.fsx_lustre_file_system.FsxLustreFileSystemTimeouts getTimeouts() {
            return this.timeouts;
        }

        @Override
        public final java.lang.String getWeeklyMaintenanceStartTime() {
            return this.weeklyMaintenanceStartTime;
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

            data.set("subnetIds", om.valueToTree(this.getSubnetIds()));
            if (this.getAutoImportPolicy() != null) {
                data.set("autoImportPolicy", om.valueToTree(this.getAutoImportPolicy()));
            }
            if (this.getAutomaticBackupRetentionDays() != null) {
                data.set("automaticBackupRetentionDays", om.valueToTree(this.getAutomaticBackupRetentionDays()));
            }
            if (this.getBackupId() != null) {
                data.set("backupId", om.valueToTree(this.getBackupId()));
            }
            if (this.getCopyTagsToBackups() != null) {
                data.set("copyTagsToBackups", om.valueToTree(this.getCopyTagsToBackups()));
            }
            if (this.getDailyAutomaticBackupStartTime() != null) {
                data.set("dailyAutomaticBackupStartTime", om.valueToTree(this.getDailyAutomaticBackupStartTime()));
            }
            if (this.getDataCompressionType() != null) {
                data.set("dataCompressionType", om.valueToTree(this.getDataCompressionType()));
            }
            if (this.getDataReadCacheConfiguration() != null) {
                data.set("dataReadCacheConfiguration", om.valueToTree(this.getDataReadCacheConfiguration()));
            }
            if (this.getDeploymentType() != null) {
                data.set("deploymentType", om.valueToTree(this.getDeploymentType()));
            }
            if (this.getDriveCacheType() != null) {
                data.set("driveCacheType", om.valueToTree(this.getDriveCacheType()));
            }
            if (this.getEfaEnabled() != null) {
                data.set("efaEnabled", om.valueToTree(this.getEfaEnabled()));
            }
            if (this.getExportPath() != null) {
                data.set("exportPath", om.valueToTree(this.getExportPath()));
            }
            if (this.getFileSystemTypeVersion() != null) {
                data.set("fileSystemTypeVersion", om.valueToTree(this.getFileSystemTypeVersion()));
            }
            if (this.getFinalBackupTags() != null) {
                data.set("finalBackupTags", om.valueToTree(this.getFinalBackupTags()));
            }
            if (this.getId() != null) {
                data.set("id", om.valueToTree(this.getId()));
            }
            if (this.getImportedFileChunkSize() != null) {
                data.set("importedFileChunkSize", om.valueToTree(this.getImportedFileChunkSize()));
            }
            if (this.getImportPath() != null) {
                data.set("importPath", om.valueToTree(this.getImportPath()));
            }
            if (this.getKmsKeyId() != null) {
                data.set("kmsKeyId", om.valueToTree(this.getKmsKeyId()));
            }
            if (this.getLogConfiguration() != null) {
                data.set("logConfiguration", om.valueToTree(this.getLogConfiguration()));
            }
            if (this.getMetadataConfiguration() != null) {
                data.set("metadataConfiguration", om.valueToTree(this.getMetadataConfiguration()));
            }
            if (this.getPerUnitStorageThroughput() != null) {
                data.set("perUnitStorageThroughput", om.valueToTree(this.getPerUnitStorageThroughput()));
            }
            if (this.getRootSquashConfiguration() != null) {
                data.set("rootSquashConfiguration", om.valueToTree(this.getRootSquashConfiguration()));
            }
            if (this.getSecurityGroupIds() != null) {
                data.set("securityGroupIds", om.valueToTree(this.getSecurityGroupIds()));
            }
            if (this.getSkipFinalBackup() != null) {
                data.set("skipFinalBackup", om.valueToTree(this.getSkipFinalBackup()));
            }
            if (this.getStorageCapacity() != null) {
                data.set("storageCapacity", om.valueToTree(this.getStorageCapacity()));
            }
            if (this.getStorageType() != null) {
                data.set("storageType", om.valueToTree(this.getStorageType()));
            }
            if (this.getTags() != null) {
                data.set("tags", om.valueToTree(this.getTags()));
            }
            if (this.getTagsAll() != null) {
                data.set("tagsAll", om.valueToTree(this.getTagsAll()));
            }
            if (this.getThroughputCapacity() != null) {
                data.set("throughputCapacity", om.valueToTree(this.getThroughputCapacity()));
            }
            if (this.getTimeouts() != null) {
                data.set("timeouts", om.valueToTree(this.getTimeouts()));
            }
            if (this.getWeeklyMaintenanceStartTime() != null) {
                data.set("weeklyMaintenanceStartTime", om.valueToTree(this.getWeeklyMaintenanceStartTime()));
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
            struct.set("fqn", om.valueToTree("aws.fsxLustreFileSystem.FsxLustreFileSystemConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            FsxLustreFileSystemConfig.Jsii$Proxy that = (FsxLustreFileSystemConfig.Jsii$Proxy) o;

            if (!subnetIds.equals(that.subnetIds)) return false;
            if (this.autoImportPolicy != null ? !this.autoImportPolicy.equals(that.autoImportPolicy) : that.autoImportPolicy != null) return false;
            if (this.automaticBackupRetentionDays != null ? !this.automaticBackupRetentionDays.equals(that.automaticBackupRetentionDays) : that.automaticBackupRetentionDays != null) return false;
            if (this.backupId != null ? !this.backupId.equals(that.backupId) : that.backupId != null) return false;
            if (this.copyTagsToBackups != null ? !this.copyTagsToBackups.equals(that.copyTagsToBackups) : that.copyTagsToBackups != null) return false;
            if (this.dailyAutomaticBackupStartTime != null ? !this.dailyAutomaticBackupStartTime.equals(that.dailyAutomaticBackupStartTime) : that.dailyAutomaticBackupStartTime != null) return false;
            if (this.dataCompressionType != null ? !this.dataCompressionType.equals(that.dataCompressionType) : that.dataCompressionType != null) return false;
            if (this.dataReadCacheConfiguration != null ? !this.dataReadCacheConfiguration.equals(that.dataReadCacheConfiguration) : that.dataReadCacheConfiguration != null) return false;
            if (this.deploymentType != null ? !this.deploymentType.equals(that.deploymentType) : that.deploymentType != null) return false;
            if (this.driveCacheType != null ? !this.driveCacheType.equals(that.driveCacheType) : that.driveCacheType != null) return false;
            if (this.efaEnabled != null ? !this.efaEnabled.equals(that.efaEnabled) : that.efaEnabled != null) return false;
            if (this.exportPath != null ? !this.exportPath.equals(that.exportPath) : that.exportPath != null) return false;
            if (this.fileSystemTypeVersion != null ? !this.fileSystemTypeVersion.equals(that.fileSystemTypeVersion) : that.fileSystemTypeVersion != null) return false;
            if (this.finalBackupTags != null ? !this.finalBackupTags.equals(that.finalBackupTags) : that.finalBackupTags != null) return false;
            if (this.id != null ? !this.id.equals(that.id) : that.id != null) return false;
            if (this.importedFileChunkSize != null ? !this.importedFileChunkSize.equals(that.importedFileChunkSize) : that.importedFileChunkSize != null) return false;
            if (this.importPath != null ? !this.importPath.equals(that.importPath) : that.importPath != null) return false;
            if (this.kmsKeyId != null ? !this.kmsKeyId.equals(that.kmsKeyId) : that.kmsKeyId != null) return false;
            if (this.logConfiguration != null ? !this.logConfiguration.equals(that.logConfiguration) : that.logConfiguration != null) return false;
            if (this.metadataConfiguration != null ? !this.metadataConfiguration.equals(that.metadataConfiguration) : that.metadataConfiguration != null) return false;
            if (this.perUnitStorageThroughput != null ? !this.perUnitStorageThroughput.equals(that.perUnitStorageThroughput) : that.perUnitStorageThroughput != null) return false;
            if (this.rootSquashConfiguration != null ? !this.rootSquashConfiguration.equals(that.rootSquashConfiguration) : that.rootSquashConfiguration != null) return false;
            if (this.securityGroupIds != null ? !this.securityGroupIds.equals(that.securityGroupIds) : that.securityGroupIds != null) return false;
            if (this.skipFinalBackup != null ? !this.skipFinalBackup.equals(that.skipFinalBackup) : that.skipFinalBackup != null) return false;
            if (this.storageCapacity != null ? !this.storageCapacity.equals(that.storageCapacity) : that.storageCapacity != null) return false;
            if (this.storageType != null ? !this.storageType.equals(that.storageType) : that.storageType != null) return false;
            if (this.tags != null ? !this.tags.equals(that.tags) : that.tags != null) return false;
            if (this.tagsAll != null ? !this.tagsAll.equals(that.tagsAll) : that.tagsAll != null) return false;
            if (this.throughputCapacity != null ? !this.throughputCapacity.equals(that.throughputCapacity) : that.throughputCapacity != null) return false;
            if (this.timeouts != null ? !this.timeouts.equals(that.timeouts) : that.timeouts != null) return false;
            if (this.weeklyMaintenanceStartTime != null ? !this.weeklyMaintenanceStartTime.equals(that.weeklyMaintenanceStartTime) : that.weeklyMaintenanceStartTime != null) return false;
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
            int result = this.subnetIds.hashCode();
            result = 31 * result + (this.autoImportPolicy != null ? this.autoImportPolicy.hashCode() : 0);
            result = 31 * result + (this.automaticBackupRetentionDays != null ? this.automaticBackupRetentionDays.hashCode() : 0);
            result = 31 * result + (this.backupId != null ? this.backupId.hashCode() : 0);
            result = 31 * result + (this.copyTagsToBackups != null ? this.copyTagsToBackups.hashCode() : 0);
            result = 31 * result + (this.dailyAutomaticBackupStartTime != null ? this.dailyAutomaticBackupStartTime.hashCode() : 0);
            result = 31 * result + (this.dataCompressionType != null ? this.dataCompressionType.hashCode() : 0);
            result = 31 * result + (this.dataReadCacheConfiguration != null ? this.dataReadCacheConfiguration.hashCode() : 0);
            result = 31 * result + (this.deploymentType != null ? this.deploymentType.hashCode() : 0);
            result = 31 * result + (this.driveCacheType != null ? this.driveCacheType.hashCode() : 0);
            result = 31 * result + (this.efaEnabled != null ? this.efaEnabled.hashCode() : 0);
            result = 31 * result + (this.exportPath != null ? this.exportPath.hashCode() : 0);
            result = 31 * result + (this.fileSystemTypeVersion != null ? this.fileSystemTypeVersion.hashCode() : 0);
            result = 31 * result + (this.finalBackupTags != null ? this.finalBackupTags.hashCode() : 0);
            result = 31 * result + (this.id != null ? this.id.hashCode() : 0);
            result = 31 * result + (this.importedFileChunkSize != null ? this.importedFileChunkSize.hashCode() : 0);
            result = 31 * result + (this.importPath != null ? this.importPath.hashCode() : 0);
            result = 31 * result + (this.kmsKeyId != null ? this.kmsKeyId.hashCode() : 0);
            result = 31 * result + (this.logConfiguration != null ? this.logConfiguration.hashCode() : 0);
            result = 31 * result + (this.metadataConfiguration != null ? this.metadataConfiguration.hashCode() : 0);
            result = 31 * result + (this.perUnitStorageThroughput != null ? this.perUnitStorageThroughput.hashCode() : 0);
            result = 31 * result + (this.rootSquashConfiguration != null ? this.rootSquashConfiguration.hashCode() : 0);
            result = 31 * result + (this.securityGroupIds != null ? this.securityGroupIds.hashCode() : 0);
            result = 31 * result + (this.skipFinalBackup != null ? this.skipFinalBackup.hashCode() : 0);
            result = 31 * result + (this.storageCapacity != null ? this.storageCapacity.hashCode() : 0);
            result = 31 * result + (this.storageType != null ? this.storageType.hashCode() : 0);
            result = 31 * result + (this.tags != null ? this.tags.hashCode() : 0);
            result = 31 * result + (this.tagsAll != null ? this.tagsAll.hashCode() : 0);
            result = 31 * result + (this.throughputCapacity != null ? this.throughputCapacity.hashCode() : 0);
            result = 31 * result + (this.timeouts != null ? this.timeouts.hashCode() : 0);
            result = 31 * result + (this.weeklyMaintenanceStartTime != null ? this.weeklyMaintenanceStartTime.hashCode() : 0);
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
