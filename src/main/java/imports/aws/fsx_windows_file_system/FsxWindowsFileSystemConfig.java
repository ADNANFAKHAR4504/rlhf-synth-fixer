package imports.aws.fsx_windows_file_system;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.258Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.fsxWindowsFileSystem.FsxWindowsFileSystemConfig")
@software.amazon.jsii.Jsii.Proxy(FsxWindowsFileSystemConfig.Jsii$Proxy.class)
public interface FsxWindowsFileSystemConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_windows_file_system#subnet_ids FsxWindowsFileSystem#subnet_ids}.
     */
    @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getSubnetIds();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_windows_file_system#throughput_capacity FsxWindowsFileSystem#throughput_capacity}.
     */
    @org.jetbrains.annotations.NotNull java.lang.Number getThroughputCapacity();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_windows_file_system#active_directory_id FsxWindowsFileSystem#active_directory_id}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getActiveDirectoryId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_windows_file_system#aliases FsxWindowsFileSystem#aliases}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getAliases() {
        return null;
    }

    /**
     * audit_log_configuration block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_windows_file_system#audit_log_configuration FsxWindowsFileSystem#audit_log_configuration}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.fsx_windows_file_system.FsxWindowsFileSystemAuditLogConfiguration getAuditLogConfiguration() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_windows_file_system#automatic_backup_retention_days FsxWindowsFileSystem#automatic_backup_retention_days}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getAutomaticBackupRetentionDays() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_windows_file_system#backup_id FsxWindowsFileSystem#backup_id}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getBackupId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_windows_file_system#copy_tags_to_backups FsxWindowsFileSystem#copy_tags_to_backups}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getCopyTagsToBackups() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_windows_file_system#daily_automatic_backup_start_time FsxWindowsFileSystem#daily_automatic_backup_start_time}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDailyAutomaticBackupStartTime() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_windows_file_system#deployment_type FsxWindowsFileSystem#deployment_type}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDeploymentType() {
        return null;
    }

    /**
     * disk_iops_configuration block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_windows_file_system#disk_iops_configuration FsxWindowsFileSystem#disk_iops_configuration}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.fsx_windows_file_system.FsxWindowsFileSystemDiskIopsConfiguration getDiskIopsConfiguration() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_windows_file_system#final_backup_tags FsxWindowsFileSystem#final_backup_tags}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getFinalBackupTags() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_windows_file_system#id FsxWindowsFileSystem#id}.
     * <p>
     * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
     * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_windows_file_system#kms_key_id FsxWindowsFileSystem#kms_key_id}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getKmsKeyId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_windows_file_system#preferred_subnet_id FsxWindowsFileSystem#preferred_subnet_id}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getPreferredSubnetId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_windows_file_system#security_group_ids FsxWindowsFileSystem#security_group_ids}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getSecurityGroupIds() {
        return null;
    }

    /**
     * self_managed_active_directory block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_windows_file_system#self_managed_active_directory FsxWindowsFileSystem#self_managed_active_directory}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.fsx_windows_file_system.FsxWindowsFileSystemSelfManagedActiveDirectory getSelfManagedActiveDirectory() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_windows_file_system#skip_final_backup FsxWindowsFileSystem#skip_final_backup}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getSkipFinalBackup() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_windows_file_system#storage_capacity FsxWindowsFileSystem#storage_capacity}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getStorageCapacity() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_windows_file_system#storage_type FsxWindowsFileSystem#storage_type}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getStorageType() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_windows_file_system#tags FsxWindowsFileSystem#tags}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTags() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_windows_file_system#tags_all FsxWindowsFileSystem#tags_all}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsAll() {
        return null;
    }

    /**
     * timeouts block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_windows_file_system#timeouts FsxWindowsFileSystem#timeouts}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.fsx_windows_file_system.FsxWindowsFileSystemTimeouts getTimeouts() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_windows_file_system#weekly_maintenance_start_time FsxWindowsFileSystem#weekly_maintenance_start_time}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getWeeklyMaintenanceStartTime() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link FsxWindowsFileSystemConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link FsxWindowsFileSystemConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<FsxWindowsFileSystemConfig> {
        java.util.List<java.lang.String> subnetIds;
        java.lang.Number throughputCapacity;
        java.lang.String activeDirectoryId;
        java.util.List<java.lang.String> aliases;
        imports.aws.fsx_windows_file_system.FsxWindowsFileSystemAuditLogConfiguration auditLogConfiguration;
        java.lang.Number automaticBackupRetentionDays;
        java.lang.String backupId;
        java.lang.Object copyTagsToBackups;
        java.lang.String dailyAutomaticBackupStartTime;
        java.lang.String deploymentType;
        imports.aws.fsx_windows_file_system.FsxWindowsFileSystemDiskIopsConfiguration diskIopsConfiguration;
        java.util.Map<java.lang.String, java.lang.String> finalBackupTags;
        java.lang.String id;
        java.lang.String kmsKeyId;
        java.lang.String preferredSubnetId;
        java.util.List<java.lang.String> securityGroupIds;
        imports.aws.fsx_windows_file_system.FsxWindowsFileSystemSelfManagedActiveDirectory selfManagedActiveDirectory;
        java.lang.Object skipFinalBackup;
        java.lang.Number storageCapacity;
        java.lang.String storageType;
        java.util.Map<java.lang.String, java.lang.String> tags;
        java.util.Map<java.lang.String, java.lang.String> tagsAll;
        imports.aws.fsx_windows_file_system.FsxWindowsFileSystemTimeouts timeouts;
        java.lang.String weeklyMaintenanceStartTime;
        java.lang.Object connection;
        java.lang.Object count;
        java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        com.hashicorp.cdktf.ITerraformIterator forEach;
        com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        com.hashicorp.cdktf.TerraformProvider provider;
        java.util.List<java.lang.Object> provisioners;

        /**
         * Sets the value of {@link FsxWindowsFileSystemConfig#getSubnetIds}
         * @param subnetIds Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_windows_file_system#subnet_ids FsxWindowsFileSystem#subnet_ids}. This parameter is required.
         * @return {@code this}
         */
        public Builder subnetIds(java.util.List<java.lang.String> subnetIds) {
            this.subnetIds = subnetIds;
            return this;
        }

        /**
         * Sets the value of {@link FsxWindowsFileSystemConfig#getThroughputCapacity}
         * @param throughputCapacity Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_windows_file_system#throughput_capacity FsxWindowsFileSystem#throughput_capacity}. This parameter is required.
         * @return {@code this}
         */
        public Builder throughputCapacity(java.lang.Number throughputCapacity) {
            this.throughputCapacity = throughputCapacity;
            return this;
        }

        /**
         * Sets the value of {@link FsxWindowsFileSystemConfig#getActiveDirectoryId}
         * @param activeDirectoryId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_windows_file_system#active_directory_id FsxWindowsFileSystem#active_directory_id}.
         * @return {@code this}
         */
        public Builder activeDirectoryId(java.lang.String activeDirectoryId) {
            this.activeDirectoryId = activeDirectoryId;
            return this;
        }

        /**
         * Sets the value of {@link FsxWindowsFileSystemConfig#getAliases}
         * @param aliases Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_windows_file_system#aliases FsxWindowsFileSystem#aliases}.
         * @return {@code this}
         */
        public Builder aliases(java.util.List<java.lang.String> aliases) {
            this.aliases = aliases;
            return this;
        }

        /**
         * Sets the value of {@link FsxWindowsFileSystemConfig#getAuditLogConfiguration}
         * @param auditLogConfiguration audit_log_configuration block.
         *                              Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_windows_file_system#audit_log_configuration FsxWindowsFileSystem#audit_log_configuration}
         * @return {@code this}
         */
        public Builder auditLogConfiguration(imports.aws.fsx_windows_file_system.FsxWindowsFileSystemAuditLogConfiguration auditLogConfiguration) {
            this.auditLogConfiguration = auditLogConfiguration;
            return this;
        }

        /**
         * Sets the value of {@link FsxWindowsFileSystemConfig#getAutomaticBackupRetentionDays}
         * @param automaticBackupRetentionDays Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_windows_file_system#automatic_backup_retention_days FsxWindowsFileSystem#automatic_backup_retention_days}.
         * @return {@code this}
         */
        public Builder automaticBackupRetentionDays(java.lang.Number automaticBackupRetentionDays) {
            this.automaticBackupRetentionDays = automaticBackupRetentionDays;
            return this;
        }

        /**
         * Sets the value of {@link FsxWindowsFileSystemConfig#getBackupId}
         * @param backupId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_windows_file_system#backup_id FsxWindowsFileSystem#backup_id}.
         * @return {@code this}
         */
        public Builder backupId(java.lang.String backupId) {
            this.backupId = backupId;
            return this;
        }

        /**
         * Sets the value of {@link FsxWindowsFileSystemConfig#getCopyTagsToBackups}
         * @param copyTagsToBackups Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_windows_file_system#copy_tags_to_backups FsxWindowsFileSystem#copy_tags_to_backups}.
         * @return {@code this}
         */
        public Builder copyTagsToBackups(java.lang.Boolean copyTagsToBackups) {
            this.copyTagsToBackups = copyTagsToBackups;
            return this;
        }

        /**
         * Sets the value of {@link FsxWindowsFileSystemConfig#getCopyTagsToBackups}
         * @param copyTagsToBackups Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_windows_file_system#copy_tags_to_backups FsxWindowsFileSystem#copy_tags_to_backups}.
         * @return {@code this}
         */
        public Builder copyTagsToBackups(com.hashicorp.cdktf.IResolvable copyTagsToBackups) {
            this.copyTagsToBackups = copyTagsToBackups;
            return this;
        }

        /**
         * Sets the value of {@link FsxWindowsFileSystemConfig#getDailyAutomaticBackupStartTime}
         * @param dailyAutomaticBackupStartTime Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_windows_file_system#daily_automatic_backup_start_time FsxWindowsFileSystem#daily_automatic_backup_start_time}.
         * @return {@code this}
         */
        public Builder dailyAutomaticBackupStartTime(java.lang.String dailyAutomaticBackupStartTime) {
            this.dailyAutomaticBackupStartTime = dailyAutomaticBackupStartTime;
            return this;
        }

        /**
         * Sets the value of {@link FsxWindowsFileSystemConfig#getDeploymentType}
         * @param deploymentType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_windows_file_system#deployment_type FsxWindowsFileSystem#deployment_type}.
         * @return {@code this}
         */
        public Builder deploymentType(java.lang.String deploymentType) {
            this.deploymentType = deploymentType;
            return this;
        }

        /**
         * Sets the value of {@link FsxWindowsFileSystemConfig#getDiskIopsConfiguration}
         * @param diskIopsConfiguration disk_iops_configuration block.
         *                              Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_windows_file_system#disk_iops_configuration FsxWindowsFileSystem#disk_iops_configuration}
         * @return {@code this}
         */
        public Builder diskIopsConfiguration(imports.aws.fsx_windows_file_system.FsxWindowsFileSystemDiskIopsConfiguration diskIopsConfiguration) {
            this.diskIopsConfiguration = diskIopsConfiguration;
            return this;
        }

        /**
         * Sets the value of {@link FsxWindowsFileSystemConfig#getFinalBackupTags}
         * @param finalBackupTags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_windows_file_system#final_backup_tags FsxWindowsFileSystem#final_backup_tags}.
         * @return {@code this}
         */
        public Builder finalBackupTags(java.util.Map<java.lang.String, java.lang.String> finalBackupTags) {
            this.finalBackupTags = finalBackupTags;
            return this;
        }

        /**
         * Sets the value of {@link FsxWindowsFileSystemConfig#getId}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_windows_file_system#id FsxWindowsFileSystem#id}.
         *           Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         *           If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * @return {@code this}
         */
        public Builder id(java.lang.String id) {
            this.id = id;
            return this;
        }

        /**
         * Sets the value of {@link FsxWindowsFileSystemConfig#getKmsKeyId}
         * @param kmsKeyId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_windows_file_system#kms_key_id FsxWindowsFileSystem#kms_key_id}.
         * @return {@code this}
         */
        public Builder kmsKeyId(java.lang.String kmsKeyId) {
            this.kmsKeyId = kmsKeyId;
            return this;
        }

        /**
         * Sets the value of {@link FsxWindowsFileSystemConfig#getPreferredSubnetId}
         * @param preferredSubnetId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_windows_file_system#preferred_subnet_id FsxWindowsFileSystem#preferred_subnet_id}.
         * @return {@code this}
         */
        public Builder preferredSubnetId(java.lang.String preferredSubnetId) {
            this.preferredSubnetId = preferredSubnetId;
            return this;
        }

        /**
         * Sets the value of {@link FsxWindowsFileSystemConfig#getSecurityGroupIds}
         * @param securityGroupIds Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_windows_file_system#security_group_ids FsxWindowsFileSystem#security_group_ids}.
         * @return {@code this}
         */
        public Builder securityGroupIds(java.util.List<java.lang.String> securityGroupIds) {
            this.securityGroupIds = securityGroupIds;
            return this;
        }

        /**
         * Sets the value of {@link FsxWindowsFileSystemConfig#getSelfManagedActiveDirectory}
         * @param selfManagedActiveDirectory self_managed_active_directory block.
         *                                   Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_windows_file_system#self_managed_active_directory FsxWindowsFileSystem#self_managed_active_directory}
         * @return {@code this}
         */
        public Builder selfManagedActiveDirectory(imports.aws.fsx_windows_file_system.FsxWindowsFileSystemSelfManagedActiveDirectory selfManagedActiveDirectory) {
            this.selfManagedActiveDirectory = selfManagedActiveDirectory;
            return this;
        }

        /**
         * Sets the value of {@link FsxWindowsFileSystemConfig#getSkipFinalBackup}
         * @param skipFinalBackup Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_windows_file_system#skip_final_backup FsxWindowsFileSystem#skip_final_backup}.
         * @return {@code this}
         */
        public Builder skipFinalBackup(java.lang.Boolean skipFinalBackup) {
            this.skipFinalBackup = skipFinalBackup;
            return this;
        }

        /**
         * Sets the value of {@link FsxWindowsFileSystemConfig#getSkipFinalBackup}
         * @param skipFinalBackup Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_windows_file_system#skip_final_backup FsxWindowsFileSystem#skip_final_backup}.
         * @return {@code this}
         */
        public Builder skipFinalBackup(com.hashicorp.cdktf.IResolvable skipFinalBackup) {
            this.skipFinalBackup = skipFinalBackup;
            return this;
        }

        /**
         * Sets the value of {@link FsxWindowsFileSystemConfig#getStorageCapacity}
         * @param storageCapacity Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_windows_file_system#storage_capacity FsxWindowsFileSystem#storage_capacity}.
         * @return {@code this}
         */
        public Builder storageCapacity(java.lang.Number storageCapacity) {
            this.storageCapacity = storageCapacity;
            return this;
        }

        /**
         * Sets the value of {@link FsxWindowsFileSystemConfig#getStorageType}
         * @param storageType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_windows_file_system#storage_type FsxWindowsFileSystem#storage_type}.
         * @return {@code this}
         */
        public Builder storageType(java.lang.String storageType) {
            this.storageType = storageType;
            return this;
        }

        /**
         * Sets the value of {@link FsxWindowsFileSystemConfig#getTags}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_windows_file_system#tags FsxWindowsFileSystem#tags}.
         * @return {@code this}
         */
        public Builder tags(java.util.Map<java.lang.String, java.lang.String> tags) {
            this.tags = tags;
            return this;
        }

        /**
         * Sets the value of {@link FsxWindowsFileSystemConfig#getTagsAll}
         * @param tagsAll Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_windows_file_system#tags_all FsxWindowsFileSystem#tags_all}.
         * @return {@code this}
         */
        public Builder tagsAll(java.util.Map<java.lang.String, java.lang.String> tagsAll) {
            this.tagsAll = tagsAll;
            return this;
        }

        /**
         * Sets the value of {@link FsxWindowsFileSystemConfig#getTimeouts}
         * @param timeouts timeouts block.
         *                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_windows_file_system#timeouts FsxWindowsFileSystem#timeouts}
         * @return {@code this}
         */
        public Builder timeouts(imports.aws.fsx_windows_file_system.FsxWindowsFileSystemTimeouts timeouts) {
            this.timeouts = timeouts;
            return this;
        }

        /**
         * Sets the value of {@link FsxWindowsFileSystemConfig#getWeeklyMaintenanceStartTime}
         * @param weeklyMaintenanceStartTime Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_windows_file_system#weekly_maintenance_start_time FsxWindowsFileSystem#weekly_maintenance_start_time}.
         * @return {@code this}
         */
        public Builder weeklyMaintenanceStartTime(java.lang.String weeklyMaintenanceStartTime) {
            this.weeklyMaintenanceStartTime = weeklyMaintenanceStartTime;
            return this;
        }

        /**
         * Sets the value of {@link FsxWindowsFileSystemConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link FsxWindowsFileSystemConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link FsxWindowsFileSystemConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link FsxWindowsFileSystemConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link FsxWindowsFileSystemConfig#getDependsOn}
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
         * Sets the value of {@link FsxWindowsFileSystemConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link FsxWindowsFileSystemConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link FsxWindowsFileSystemConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link FsxWindowsFileSystemConfig#getProvisioners}
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
         * @return a new instance of {@link FsxWindowsFileSystemConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public FsxWindowsFileSystemConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link FsxWindowsFileSystemConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements FsxWindowsFileSystemConfig {
        private final java.util.List<java.lang.String> subnetIds;
        private final java.lang.Number throughputCapacity;
        private final java.lang.String activeDirectoryId;
        private final java.util.List<java.lang.String> aliases;
        private final imports.aws.fsx_windows_file_system.FsxWindowsFileSystemAuditLogConfiguration auditLogConfiguration;
        private final java.lang.Number automaticBackupRetentionDays;
        private final java.lang.String backupId;
        private final java.lang.Object copyTagsToBackups;
        private final java.lang.String dailyAutomaticBackupStartTime;
        private final java.lang.String deploymentType;
        private final imports.aws.fsx_windows_file_system.FsxWindowsFileSystemDiskIopsConfiguration diskIopsConfiguration;
        private final java.util.Map<java.lang.String, java.lang.String> finalBackupTags;
        private final java.lang.String id;
        private final java.lang.String kmsKeyId;
        private final java.lang.String preferredSubnetId;
        private final java.util.List<java.lang.String> securityGroupIds;
        private final imports.aws.fsx_windows_file_system.FsxWindowsFileSystemSelfManagedActiveDirectory selfManagedActiveDirectory;
        private final java.lang.Object skipFinalBackup;
        private final java.lang.Number storageCapacity;
        private final java.lang.String storageType;
        private final java.util.Map<java.lang.String, java.lang.String> tags;
        private final java.util.Map<java.lang.String, java.lang.String> tagsAll;
        private final imports.aws.fsx_windows_file_system.FsxWindowsFileSystemTimeouts timeouts;
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
            this.throughputCapacity = software.amazon.jsii.Kernel.get(this, "throughputCapacity", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.activeDirectoryId = software.amazon.jsii.Kernel.get(this, "activeDirectoryId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.aliases = software.amazon.jsii.Kernel.get(this, "aliases", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.auditLogConfiguration = software.amazon.jsii.Kernel.get(this, "auditLogConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.fsx_windows_file_system.FsxWindowsFileSystemAuditLogConfiguration.class));
            this.automaticBackupRetentionDays = software.amazon.jsii.Kernel.get(this, "automaticBackupRetentionDays", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.backupId = software.amazon.jsii.Kernel.get(this, "backupId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.copyTagsToBackups = software.amazon.jsii.Kernel.get(this, "copyTagsToBackups", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.dailyAutomaticBackupStartTime = software.amazon.jsii.Kernel.get(this, "dailyAutomaticBackupStartTime", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.deploymentType = software.amazon.jsii.Kernel.get(this, "deploymentType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.diskIopsConfiguration = software.amazon.jsii.Kernel.get(this, "diskIopsConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.fsx_windows_file_system.FsxWindowsFileSystemDiskIopsConfiguration.class));
            this.finalBackupTags = software.amazon.jsii.Kernel.get(this, "finalBackupTags", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.id = software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.kmsKeyId = software.amazon.jsii.Kernel.get(this, "kmsKeyId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.preferredSubnetId = software.amazon.jsii.Kernel.get(this, "preferredSubnetId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.securityGroupIds = software.amazon.jsii.Kernel.get(this, "securityGroupIds", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.selfManagedActiveDirectory = software.amazon.jsii.Kernel.get(this, "selfManagedActiveDirectory", software.amazon.jsii.NativeType.forClass(imports.aws.fsx_windows_file_system.FsxWindowsFileSystemSelfManagedActiveDirectory.class));
            this.skipFinalBackup = software.amazon.jsii.Kernel.get(this, "skipFinalBackup", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.storageCapacity = software.amazon.jsii.Kernel.get(this, "storageCapacity", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.storageType = software.amazon.jsii.Kernel.get(this, "storageType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.tags = software.amazon.jsii.Kernel.get(this, "tags", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.tagsAll = software.amazon.jsii.Kernel.get(this, "tagsAll", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.timeouts = software.amazon.jsii.Kernel.get(this, "timeouts", software.amazon.jsii.NativeType.forClass(imports.aws.fsx_windows_file_system.FsxWindowsFileSystemTimeouts.class));
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
            this.throughputCapacity = java.util.Objects.requireNonNull(builder.throughputCapacity, "throughputCapacity is required");
            this.activeDirectoryId = builder.activeDirectoryId;
            this.aliases = builder.aliases;
            this.auditLogConfiguration = builder.auditLogConfiguration;
            this.automaticBackupRetentionDays = builder.automaticBackupRetentionDays;
            this.backupId = builder.backupId;
            this.copyTagsToBackups = builder.copyTagsToBackups;
            this.dailyAutomaticBackupStartTime = builder.dailyAutomaticBackupStartTime;
            this.deploymentType = builder.deploymentType;
            this.diskIopsConfiguration = builder.diskIopsConfiguration;
            this.finalBackupTags = builder.finalBackupTags;
            this.id = builder.id;
            this.kmsKeyId = builder.kmsKeyId;
            this.preferredSubnetId = builder.preferredSubnetId;
            this.securityGroupIds = builder.securityGroupIds;
            this.selfManagedActiveDirectory = builder.selfManagedActiveDirectory;
            this.skipFinalBackup = builder.skipFinalBackup;
            this.storageCapacity = builder.storageCapacity;
            this.storageType = builder.storageType;
            this.tags = builder.tags;
            this.tagsAll = builder.tagsAll;
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
        public final java.lang.Number getThroughputCapacity() {
            return this.throughputCapacity;
        }

        @Override
        public final java.lang.String getActiveDirectoryId() {
            return this.activeDirectoryId;
        }

        @Override
        public final java.util.List<java.lang.String> getAliases() {
            return this.aliases;
        }

        @Override
        public final imports.aws.fsx_windows_file_system.FsxWindowsFileSystemAuditLogConfiguration getAuditLogConfiguration() {
            return this.auditLogConfiguration;
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
        public final java.lang.String getDeploymentType() {
            return this.deploymentType;
        }

        @Override
        public final imports.aws.fsx_windows_file_system.FsxWindowsFileSystemDiskIopsConfiguration getDiskIopsConfiguration() {
            return this.diskIopsConfiguration;
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
        public final java.lang.String getKmsKeyId() {
            return this.kmsKeyId;
        }

        @Override
        public final java.lang.String getPreferredSubnetId() {
            return this.preferredSubnetId;
        }

        @Override
        public final java.util.List<java.lang.String> getSecurityGroupIds() {
            return this.securityGroupIds;
        }

        @Override
        public final imports.aws.fsx_windows_file_system.FsxWindowsFileSystemSelfManagedActiveDirectory getSelfManagedActiveDirectory() {
            return this.selfManagedActiveDirectory;
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
        public final imports.aws.fsx_windows_file_system.FsxWindowsFileSystemTimeouts getTimeouts() {
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
            data.set("throughputCapacity", om.valueToTree(this.getThroughputCapacity()));
            if (this.getActiveDirectoryId() != null) {
                data.set("activeDirectoryId", om.valueToTree(this.getActiveDirectoryId()));
            }
            if (this.getAliases() != null) {
                data.set("aliases", om.valueToTree(this.getAliases()));
            }
            if (this.getAuditLogConfiguration() != null) {
                data.set("auditLogConfiguration", om.valueToTree(this.getAuditLogConfiguration()));
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
            if (this.getDeploymentType() != null) {
                data.set("deploymentType", om.valueToTree(this.getDeploymentType()));
            }
            if (this.getDiskIopsConfiguration() != null) {
                data.set("diskIopsConfiguration", om.valueToTree(this.getDiskIopsConfiguration()));
            }
            if (this.getFinalBackupTags() != null) {
                data.set("finalBackupTags", om.valueToTree(this.getFinalBackupTags()));
            }
            if (this.getId() != null) {
                data.set("id", om.valueToTree(this.getId()));
            }
            if (this.getKmsKeyId() != null) {
                data.set("kmsKeyId", om.valueToTree(this.getKmsKeyId()));
            }
            if (this.getPreferredSubnetId() != null) {
                data.set("preferredSubnetId", om.valueToTree(this.getPreferredSubnetId()));
            }
            if (this.getSecurityGroupIds() != null) {
                data.set("securityGroupIds", om.valueToTree(this.getSecurityGroupIds()));
            }
            if (this.getSelfManagedActiveDirectory() != null) {
                data.set("selfManagedActiveDirectory", om.valueToTree(this.getSelfManagedActiveDirectory()));
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
            struct.set("fqn", om.valueToTree("aws.fsxWindowsFileSystem.FsxWindowsFileSystemConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            FsxWindowsFileSystemConfig.Jsii$Proxy that = (FsxWindowsFileSystemConfig.Jsii$Proxy) o;

            if (!subnetIds.equals(that.subnetIds)) return false;
            if (!throughputCapacity.equals(that.throughputCapacity)) return false;
            if (this.activeDirectoryId != null ? !this.activeDirectoryId.equals(that.activeDirectoryId) : that.activeDirectoryId != null) return false;
            if (this.aliases != null ? !this.aliases.equals(that.aliases) : that.aliases != null) return false;
            if (this.auditLogConfiguration != null ? !this.auditLogConfiguration.equals(that.auditLogConfiguration) : that.auditLogConfiguration != null) return false;
            if (this.automaticBackupRetentionDays != null ? !this.automaticBackupRetentionDays.equals(that.automaticBackupRetentionDays) : that.automaticBackupRetentionDays != null) return false;
            if (this.backupId != null ? !this.backupId.equals(that.backupId) : that.backupId != null) return false;
            if (this.copyTagsToBackups != null ? !this.copyTagsToBackups.equals(that.copyTagsToBackups) : that.copyTagsToBackups != null) return false;
            if (this.dailyAutomaticBackupStartTime != null ? !this.dailyAutomaticBackupStartTime.equals(that.dailyAutomaticBackupStartTime) : that.dailyAutomaticBackupStartTime != null) return false;
            if (this.deploymentType != null ? !this.deploymentType.equals(that.deploymentType) : that.deploymentType != null) return false;
            if (this.diskIopsConfiguration != null ? !this.diskIopsConfiguration.equals(that.diskIopsConfiguration) : that.diskIopsConfiguration != null) return false;
            if (this.finalBackupTags != null ? !this.finalBackupTags.equals(that.finalBackupTags) : that.finalBackupTags != null) return false;
            if (this.id != null ? !this.id.equals(that.id) : that.id != null) return false;
            if (this.kmsKeyId != null ? !this.kmsKeyId.equals(that.kmsKeyId) : that.kmsKeyId != null) return false;
            if (this.preferredSubnetId != null ? !this.preferredSubnetId.equals(that.preferredSubnetId) : that.preferredSubnetId != null) return false;
            if (this.securityGroupIds != null ? !this.securityGroupIds.equals(that.securityGroupIds) : that.securityGroupIds != null) return false;
            if (this.selfManagedActiveDirectory != null ? !this.selfManagedActiveDirectory.equals(that.selfManagedActiveDirectory) : that.selfManagedActiveDirectory != null) return false;
            if (this.skipFinalBackup != null ? !this.skipFinalBackup.equals(that.skipFinalBackup) : that.skipFinalBackup != null) return false;
            if (this.storageCapacity != null ? !this.storageCapacity.equals(that.storageCapacity) : that.storageCapacity != null) return false;
            if (this.storageType != null ? !this.storageType.equals(that.storageType) : that.storageType != null) return false;
            if (this.tags != null ? !this.tags.equals(that.tags) : that.tags != null) return false;
            if (this.tagsAll != null ? !this.tagsAll.equals(that.tagsAll) : that.tagsAll != null) return false;
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
            result = 31 * result + (this.throughputCapacity.hashCode());
            result = 31 * result + (this.activeDirectoryId != null ? this.activeDirectoryId.hashCode() : 0);
            result = 31 * result + (this.aliases != null ? this.aliases.hashCode() : 0);
            result = 31 * result + (this.auditLogConfiguration != null ? this.auditLogConfiguration.hashCode() : 0);
            result = 31 * result + (this.automaticBackupRetentionDays != null ? this.automaticBackupRetentionDays.hashCode() : 0);
            result = 31 * result + (this.backupId != null ? this.backupId.hashCode() : 0);
            result = 31 * result + (this.copyTagsToBackups != null ? this.copyTagsToBackups.hashCode() : 0);
            result = 31 * result + (this.dailyAutomaticBackupStartTime != null ? this.dailyAutomaticBackupStartTime.hashCode() : 0);
            result = 31 * result + (this.deploymentType != null ? this.deploymentType.hashCode() : 0);
            result = 31 * result + (this.diskIopsConfiguration != null ? this.diskIopsConfiguration.hashCode() : 0);
            result = 31 * result + (this.finalBackupTags != null ? this.finalBackupTags.hashCode() : 0);
            result = 31 * result + (this.id != null ? this.id.hashCode() : 0);
            result = 31 * result + (this.kmsKeyId != null ? this.kmsKeyId.hashCode() : 0);
            result = 31 * result + (this.preferredSubnetId != null ? this.preferredSubnetId.hashCode() : 0);
            result = 31 * result + (this.securityGroupIds != null ? this.securityGroupIds.hashCode() : 0);
            result = 31 * result + (this.selfManagedActiveDirectory != null ? this.selfManagedActiveDirectory.hashCode() : 0);
            result = 31 * result + (this.skipFinalBackup != null ? this.skipFinalBackup.hashCode() : 0);
            result = 31 * result + (this.storageCapacity != null ? this.storageCapacity.hashCode() : 0);
            result = 31 * result + (this.storageType != null ? this.storageType.hashCode() : 0);
            result = 31 * result + (this.tags != null ? this.tags.hashCode() : 0);
            result = 31 * result + (this.tagsAll != null ? this.tagsAll.hashCode() : 0);
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
