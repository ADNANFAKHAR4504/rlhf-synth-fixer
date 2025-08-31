package imports.aws.fsx_ontap_file_system;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.246Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.fsxOntapFileSystem.FsxOntapFileSystemConfig")
@software.amazon.jsii.Jsii.Proxy(FsxOntapFileSystemConfig.Jsii$Proxy.class)
public interface FsxOntapFileSystemConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_ontap_file_system#deployment_type FsxOntapFileSystem#deployment_type}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getDeploymentType();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_ontap_file_system#preferred_subnet_id FsxOntapFileSystem#preferred_subnet_id}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getPreferredSubnetId();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_ontap_file_system#storage_capacity FsxOntapFileSystem#storage_capacity}.
     */
    @org.jetbrains.annotations.NotNull java.lang.Number getStorageCapacity();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_ontap_file_system#subnet_ids FsxOntapFileSystem#subnet_ids}.
     */
    @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getSubnetIds();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_ontap_file_system#automatic_backup_retention_days FsxOntapFileSystem#automatic_backup_retention_days}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getAutomaticBackupRetentionDays() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_ontap_file_system#daily_automatic_backup_start_time FsxOntapFileSystem#daily_automatic_backup_start_time}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDailyAutomaticBackupStartTime() {
        return null;
    }

    /**
     * disk_iops_configuration block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_ontap_file_system#disk_iops_configuration FsxOntapFileSystem#disk_iops_configuration}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.fsx_ontap_file_system.FsxOntapFileSystemDiskIopsConfiguration getDiskIopsConfiguration() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_ontap_file_system#endpoint_ip_address_range FsxOntapFileSystem#endpoint_ip_address_range}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getEndpointIpAddressRange() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_ontap_file_system#fsx_admin_password FsxOntapFileSystem#fsx_admin_password}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getFsxAdminPassword() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_ontap_file_system#ha_pairs FsxOntapFileSystem#ha_pairs}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getHaPairs() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_ontap_file_system#id FsxOntapFileSystem#id}.
     * <p>
     * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
     * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_ontap_file_system#kms_key_id FsxOntapFileSystem#kms_key_id}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getKmsKeyId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_ontap_file_system#route_table_ids FsxOntapFileSystem#route_table_ids}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getRouteTableIds() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_ontap_file_system#security_group_ids FsxOntapFileSystem#security_group_ids}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getSecurityGroupIds() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_ontap_file_system#storage_type FsxOntapFileSystem#storage_type}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getStorageType() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_ontap_file_system#tags FsxOntapFileSystem#tags}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTags() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_ontap_file_system#tags_all FsxOntapFileSystem#tags_all}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsAll() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_ontap_file_system#throughput_capacity FsxOntapFileSystem#throughput_capacity}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getThroughputCapacity() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_ontap_file_system#throughput_capacity_per_ha_pair FsxOntapFileSystem#throughput_capacity_per_ha_pair}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getThroughputCapacityPerHaPair() {
        return null;
    }

    /**
     * timeouts block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_ontap_file_system#timeouts FsxOntapFileSystem#timeouts}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.fsx_ontap_file_system.FsxOntapFileSystemTimeouts getTimeouts() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_ontap_file_system#weekly_maintenance_start_time FsxOntapFileSystem#weekly_maintenance_start_time}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getWeeklyMaintenanceStartTime() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link FsxOntapFileSystemConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link FsxOntapFileSystemConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<FsxOntapFileSystemConfig> {
        java.lang.String deploymentType;
        java.lang.String preferredSubnetId;
        java.lang.Number storageCapacity;
        java.util.List<java.lang.String> subnetIds;
        java.lang.Number automaticBackupRetentionDays;
        java.lang.String dailyAutomaticBackupStartTime;
        imports.aws.fsx_ontap_file_system.FsxOntapFileSystemDiskIopsConfiguration diskIopsConfiguration;
        java.lang.String endpointIpAddressRange;
        java.lang.String fsxAdminPassword;
        java.lang.Number haPairs;
        java.lang.String id;
        java.lang.String kmsKeyId;
        java.util.List<java.lang.String> routeTableIds;
        java.util.List<java.lang.String> securityGroupIds;
        java.lang.String storageType;
        java.util.Map<java.lang.String, java.lang.String> tags;
        java.util.Map<java.lang.String, java.lang.String> tagsAll;
        java.lang.Number throughputCapacity;
        java.lang.Number throughputCapacityPerHaPair;
        imports.aws.fsx_ontap_file_system.FsxOntapFileSystemTimeouts timeouts;
        java.lang.String weeklyMaintenanceStartTime;
        java.lang.Object connection;
        java.lang.Object count;
        java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        com.hashicorp.cdktf.ITerraformIterator forEach;
        com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        com.hashicorp.cdktf.TerraformProvider provider;
        java.util.List<java.lang.Object> provisioners;

        /**
         * Sets the value of {@link FsxOntapFileSystemConfig#getDeploymentType}
         * @param deploymentType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_ontap_file_system#deployment_type FsxOntapFileSystem#deployment_type}. This parameter is required.
         * @return {@code this}
         */
        public Builder deploymentType(java.lang.String deploymentType) {
            this.deploymentType = deploymentType;
            return this;
        }

        /**
         * Sets the value of {@link FsxOntapFileSystemConfig#getPreferredSubnetId}
         * @param preferredSubnetId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_ontap_file_system#preferred_subnet_id FsxOntapFileSystem#preferred_subnet_id}. This parameter is required.
         * @return {@code this}
         */
        public Builder preferredSubnetId(java.lang.String preferredSubnetId) {
            this.preferredSubnetId = preferredSubnetId;
            return this;
        }

        /**
         * Sets the value of {@link FsxOntapFileSystemConfig#getStorageCapacity}
         * @param storageCapacity Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_ontap_file_system#storage_capacity FsxOntapFileSystem#storage_capacity}. This parameter is required.
         * @return {@code this}
         */
        public Builder storageCapacity(java.lang.Number storageCapacity) {
            this.storageCapacity = storageCapacity;
            return this;
        }

        /**
         * Sets the value of {@link FsxOntapFileSystemConfig#getSubnetIds}
         * @param subnetIds Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_ontap_file_system#subnet_ids FsxOntapFileSystem#subnet_ids}. This parameter is required.
         * @return {@code this}
         */
        public Builder subnetIds(java.util.List<java.lang.String> subnetIds) {
            this.subnetIds = subnetIds;
            return this;
        }

        /**
         * Sets the value of {@link FsxOntapFileSystemConfig#getAutomaticBackupRetentionDays}
         * @param automaticBackupRetentionDays Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_ontap_file_system#automatic_backup_retention_days FsxOntapFileSystem#automatic_backup_retention_days}.
         * @return {@code this}
         */
        public Builder automaticBackupRetentionDays(java.lang.Number automaticBackupRetentionDays) {
            this.automaticBackupRetentionDays = automaticBackupRetentionDays;
            return this;
        }

        /**
         * Sets the value of {@link FsxOntapFileSystemConfig#getDailyAutomaticBackupStartTime}
         * @param dailyAutomaticBackupStartTime Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_ontap_file_system#daily_automatic_backup_start_time FsxOntapFileSystem#daily_automatic_backup_start_time}.
         * @return {@code this}
         */
        public Builder dailyAutomaticBackupStartTime(java.lang.String dailyAutomaticBackupStartTime) {
            this.dailyAutomaticBackupStartTime = dailyAutomaticBackupStartTime;
            return this;
        }

        /**
         * Sets the value of {@link FsxOntapFileSystemConfig#getDiskIopsConfiguration}
         * @param diskIopsConfiguration disk_iops_configuration block.
         *                              Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_ontap_file_system#disk_iops_configuration FsxOntapFileSystem#disk_iops_configuration}
         * @return {@code this}
         */
        public Builder diskIopsConfiguration(imports.aws.fsx_ontap_file_system.FsxOntapFileSystemDiskIopsConfiguration diskIopsConfiguration) {
            this.diskIopsConfiguration = diskIopsConfiguration;
            return this;
        }

        /**
         * Sets the value of {@link FsxOntapFileSystemConfig#getEndpointIpAddressRange}
         * @param endpointIpAddressRange Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_ontap_file_system#endpoint_ip_address_range FsxOntapFileSystem#endpoint_ip_address_range}.
         * @return {@code this}
         */
        public Builder endpointIpAddressRange(java.lang.String endpointIpAddressRange) {
            this.endpointIpAddressRange = endpointIpAddressRange;
            return this;
        }

        /**
         * Sets the value of {@link FsxOntapFileSystemConfig#getFsxAdminPassword}
         * @param fsxAdminPassword Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_ontap_file_system#fsx_admin_password FsxOntapFileSystem#fsx_admin_password}.
         * @return {@code this}
         */
        public Builder fsxAdminPassword(java.lang.String fsxAdminPassword) {
            this.fsxAdminPassword = fsxAdminPassword;
            return this;
        }

        /**
         * Sets the value of {@link FsxOntapFileSystemConfig#getHaPairs}
         * @param haPairs Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_ontap_file_system#ha_pairs FsxOntapFileSystem#ha_pairs}.
         * @return {@code this}
         */
        public Builder haPairs(java.lang.Number haPairs) {
            this.haPairs = haPairs;
            return this;
        }

        /**
         * Sets the value of {@link FsxOntapFileSystemConfig#getId}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_ontap_file_system#id FsxOntapFileSystem#id}.
         *           Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         *           If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * @return {@code this}
         */
        public Builder id(java.lang.String id) {
            this.id = id;
            return this;
        }

        /**
         * Sets the value of {@link FsxOntapFileSystemConfig#getKmsKeyId}
         * @param kmsKeyId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_ontap_file_system#kms_key_id FsxOntapFileSystem#kms_key_id}.
         * @return {@code this}
         */
        public Builder kmsKeyId(java.lang.String kmsKeyId) {
            this.kmsKeyId = kmsKeyId;
            return this;
        }

        /**
         * Sets the value of {@link FsxOntapFileSystemConfig#getRouteTableIds}
         * @param routeTableIds Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_ontap_file_system#route_table_ids FsxOntapFileSystem#route_table_ids}.
         * @return {@code this}
         */
        public Builder routeTableIds(java.util.List<java.lang.String> routeTableIds) {
            this.routeTableIds = routeTableIds;
            return this;
        }

        /**
         * Sets the value of {@link FsxOntapFileSystemConfig#getSecurityGroupIds}
         * @param securityGroupIds Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_ontap_file_system#security_group_ids FsxOntapFileSystem#security_group_ids}.
         * @return {@code this}
         */
        public Builder securityGroupIds(java.util.List<java.lang.String> securityGroupIds) {
            this.securityGroupIds = securityGroupIds;
            return this;
        }

        /**
         * Sets the value of {@link FsxOntapFileSystemConfig#getStorageType}
         * @param storageType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_ontap_file_system#storage_type FsxOntapFileSystem#storage_type}.
         * @return {@code this}
         */
        public Builder storageType(java.lang.String storageType) {
            this.storageType = storageType;
            return this;
        }

        /**
         * Sets the value of {@link FsxOntapFileSystemConfig#getTags}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_ontap_file_system#tags FsxOntapFileSystem#tags}.
         * @return {@code this}
         */
        public Builder tags(java.util.Map<java.lang.String, java.lang.String> tags) {
            this.tags = tags;
            return this;
        }

        /**
         * Sets the value of {@link FsxOntapFileSystemConfig#getTagsAll}
         * @param tagsAll Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_ontap_file_system#tags_all FsxOntapFileSystem#tags_all}.
         * @return {@code this}
         */
        public Builder tagsAll(java.util.Map<java.lang.String, java.lang.String> tagsAll) {
            this.tagsAll = tagsAll;
            return this;
        }

        /**
         * Sets the value of {@link FsxOntapFileSystemConfig#getThroughputCapacity}
         * @param throughputCapacity Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_ontap_file_system#throughput_capacity FsxOntapFileSystem#throughput_capacity}.
         * @return {@code this}
         */
        public Builder throughputCapacity(java.lang.Number throughputCapacity) {
            this.throughputCapacity = throughputCapacity;
            return this;
        }

        /**
         * Sets the value of {@link FsxOntapFileSystemConfig#getThroughputCapacityPerHaPair}
         * @param throughputCapacityPerHaPair Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_ontap_file_system#throughput_capacity_per_ha_pair FsxOntapFileSystem#throughput_capacity_per_ha_pair}.
         * @return {@code this}
         */
        public Builder throughputCapacityPerHaPair(java.lang.Number throughputCapacityPerHaPair) {
            this.throughputCapacityPerHaPair = throughputCapacityPerHaPair;
            return this;
        }

        /**
         * Sets the value of {@link FsxOntapFileSystemConfig#getTimeouts}
         * @param timeouts timeouts block.
         *                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_ontap_file_system#timeouts FsxOntapFileSystem#timeouts}
         * @return {@code this}
         */
        public Builder timeouts(imports.aws.fsx_ontap_file_system.FsxOntapFileSystemTimeouts timeouts) {
            this.timeouts = timeouts;
            return this;
        }

        /**
         * Sets the value of {@link FsxOntapFileSystemConfig#getWeeklyMaintenanceStartTime}
         * @param weeklyMaintenanceStartTime Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_ontap_file_system#weekly_maintenance_start_time FsxOntapFileSystem#weekly_maintenance_start_time}.
         * @return {@code this}
         */
        public Builder weeklyMaintenanceStartTime(java.lang.String weeklyMaintenanceStartTime) {
            this.weeklyMaintenanceStartTime = weeklyMaintenanceStartTime;
            return this;
        }

        /**
         * Sets the value of {@link FsxOntapFileSystemConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link FsxOntapFileSystemConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link FsxOntapFileSystemConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link FsxOntapFileSystemConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link FsxOntapFileSystemConfig#getDependsOn}
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
         * Sets the value of {@link FsxOntapFileSystemConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link FsxOntapFileSystemConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link FsxOntapFileSystemConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link FsxOntapFileSystemConfig#getProvisioners}
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
         * @return a new instance of {@link FsxOntapFileSystemConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public FsxOntapFileSystemConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link FsxOntapFileSystemConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements FsxOntapFileSystemConfig {
        private final java.lang.String deploymentType;
        private final java.lang.String preferredSubnetId;
        private final java.lang.Number storageCapacity;
        private final java.util.List<java.lang.String> subnetIds;
        private final java.lang.Number automaticBackupRetentionDays;
        private final java.lang.String dailyAutomaticBackupStartTime;
        private final imports.aws.fsx_ontap_file_system.FsxOntapFileSystemDiskIopsConfiguration diskIopsConfiguration;
        private final java.lang.String endpointIpAddressRange;
        private final java.lang.String fsxAdminPassword;
        private final java.lang.Number haPairs;
        private final java.lang.String id;
        private final java.lang.String kmsKeyId;
        private final java.util.List<java.lang.String> routeTableIds;
        private final java.util.List<java.lang.String> securityGroupIds;
        private final java.lang.String storageType;
        private final java.util.Map<java.lang.String, java.lang.String> tags;
        private final java.util.Map<java.lang.String, java.lang.String> tagsAll;
        private final java.lang.Number throughputCapacity;
        private final java.lang.Number throughputCapacityPerHaPair;
        private final imports.aws.fsx_ontap_file_system.FsxOntapFileSystemTimeouts timeouts;
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
            this.deploymentType = software.amazon.jsii.Kernel.get(this, "deploymentType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.preferredSubnetId = software.amazon.jsii.Kernel.get(this, "preferredSubnetId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.storageCapacity = software.amazon.jsii.Kernel.get(this, "storageCapacity", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.subnetIds = software.amazon.jsii.Kernel.get(this, "subnetIds", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.automaticBackupRetentionDays = software.amazon.jsii.Kernel.get(this, "automaticBackupRetentionDays", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.dailyAutomaticBackupStartTime = software.amazon.jsii.Kernel.get(this, "dailyAutomaticBackupStartTime", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.diskIopsConfiguration = software.amazon.jsii.Kernel.get(this, "diskIopsConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.fsx_ontap_file_system.FsxOntapFileSystemDiskIopsConfiguration.class));
            this.endpointIpAddressRange = software.amazon.jsii.Kernel.get(this, "endpointIpAddressRange", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.fsxAdminPassword = software.amazon.jsii.Kernel.get(this, "fsxAdminPassword", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.haPairs = software.amazon.jsii.Kernel.get(this, "haPairs", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.id = software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.kmsKeyId = software.amazon.jsii.Kernel.get(this, "kmsKeyId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.routeTableIds = software.amazon.jsii.Kernel.get(this, "routeTableIds", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.securityGroupIds = software.amazon.jsii.Kernel.get(this, "securityGroupIds", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.storageType = software.amazon.jsii.Kernel.get(this, "storageType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.tags = software.amazon.jsii.Kernel.get(this, "tags", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.tagsAll = software.amazon.jsii.Kernel.get(this, "tagsAll", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.throughputCapacity = software.amazon.jsii.Kernel.get(this, "throughputCapacity", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.throughputCapacityPerHaPair = software.amazon.jsii.Kernel.get(this, "throughputCapacityPerHaPair", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.timeouts = software.amazon.jsii.Kernel.get(this, "timeouts", software.amazon.jsii.NativeType.forClass(imports.aws.fsx_ontap_file_system.FsxOntapFileSystemTimeouts.class));
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
            this.deploymentType = java.util.Objects.requireNonNull(builder.deploymentType, "deploymentType is required");
            this.preferredSubnetId = java.util.Objects.requireNonNull(builder.preferredSubnetId, "preferredSubnetId is required");
            this.storageCapacity = java.util.Objects.requireNonNull(builder.storageCapacity, "storageCapacity is required");
            this.subnetIds = java.util.Objects.requireNonNull(builder.subnetIds, "subnetIds is required");
            this.automaticBackupRetentionDays = builder.automaticBackupRetentionDays;
            this.dailyAutomaticBackupStartTime = builder.dailyAutomaticBackupStartTime;
            this.diskIopsConfiguration = builder.diskIopsConfiguration;
            this.endpointIpAddressRange = builder.endpointIpAddressRange;
            this.fsxAdminPassword = builder.fsxAdminPassword;
            this.haPairs = builder.haPairs;
            this.id = builder.id;
            this.kmsKeyId = builder.kmsKeyId;
            this.routeTableIds = builder.routeTableIds;
            this.securityGroupIds = builder.securityGroupIds;
            this.storageType = builder.storageType;
            this.tags = builder.tags;
            this.tagsAll = builder.tagsAll;
            this.throughputCapacity = builder.throughputCapacity;
            this.throughputCapacityPerHaPair = builder.throughputCapacityPerHaPair;
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
        public final java.lang.String getDeploymentType() {
            return this.deploymentType;
        }

        @Override
        public final java.lang.String getPreferredSubnetId() {
            return this.preferredSubnetId;
        }

        @Override
        public final java.lang.Number getStorageCapacity() {
            return this.storageCapacity;
        }

        @Override
        public final java.util.List<java.lang.String> getSubnetIds() {
            return this.subnetIds;
        }

        @Override
        public final java.lang.Number getAutomaticBackupRetentionDays() {
            return this.automaticBackupRetentionDays;
        }

        @Override
        public final java.lang.String getDailyAutomaticBackupStartTime() {
            return this.dailyAutomaticBackupStartTime;
        }

        @Override
        public final imports.aws.fsx_ontap_file_system.FsxOntapFileSystemDiskIopsConfiguration getDiskIopsConfiguration() {
            return this.diskIopsConfiguration;
        }

        @Override
        public final java.lang.String getEndpointIpAddressRange() {
            return this.endpointIpAddressRange;
        }

        @Override
        public final java.lang.String getFsxAdminPassword() {
            return this.fsxAdminPassword;
        }

        @Override
        public final java.lang.Number getHaPairs() {
            return this.haPairs;
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
        public final java.util.List<java.lang.String> getRouteTableIds() {
            return this.routeTableIds;
        }

        @Override
        public final java.util.List<java.lang.String> getSecurityGroupIds() {
            return this.securityGroupIds;
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
        public final java.lang.Number getThroughputCapacityPerHaPair() {
            return this.throughputCapacityPerHaPair;
        }

        @Override
        public final imports.aws.fsx_ontap_file_system.FsxOntapFileSystemTimeouts getTimeouts() {
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

            data.set("deploymentType", om.valueToTree(this.getDeploymentType()));
            data.set("preferredSubnetId", om.valueToTree(this.getPreferredSubnetId()));
            data.set("storageCapacity", om.valueToTree(this.getStorageCapacity()));
            data.set("subnetIds", om.valueToTree(this.getSubnetIds()));
            if (this.getAutomaticBackupRetentionDays() != null) {
                data.set("automaticBackupRetentionDays", om.valueToTree(this.getAutomaticBackupRetentionDays()));
            }
            if (this.getDailyAutomaticBackupStartTime() != null) {
                data.set("dailyAutomaticBackupStartTime", om.valueToTree(this.getDailyAutomaticBackupStartTime()));
            }
            if (this.getDiskIopsConfiguration() != null) {
                data.set("diskIopsConfiguration", om.valueToTree(this.getDiskIopsConfiguration()));
            }
            if (this.getEndpointIpAddressRange() != null) {
                data.set("endpointIpAddressRange", om.valueToTree(this.getEndpointIpAddressRange()));
            }
            if (this.getFsxAdminPassword() != null) {
                data.set("fsxAdminPassword", om.valueToTree(this.getFsxAdminPassword()));
            }
            if (this.getHaPairs() != null) {
                data.set("haPairs", om.valueToTree(this.getHaPairs()));
            }
            if (this.getId() != null) {
                data.set("id", om.valueToTree(this.getId()));
            }
            if (this.getKmsKeyId() != null) {
                data.set("kmsKeyId", om.valueToTree(this.getKmsKeyId()));
            }
            if (this.getRouteTableIds() != null) {
                data.set("routeTableIds", om.valueToTree(this.getRouteTableIds()));
            }
            if (this.getSecurityGroupIds() != null) {
                data.set("securityGroupIds", om.valueToTree(this.getSecurityGroupIds()));
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
            if (this.getThroughputCapacityPerHaPair() != null) {
                data.set("throughputCapacityPerHaPair", om.valueToTree(this.getThroughputCapacityPerHaPair()));
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
            struct.set("fqn", om.valueToTree("aws.fsxOntapFileSystem.FsxOntapFileSystemConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            FsxOntapFileSystemConfig.Jsii$Proxy that = (FsxOntapFileSystemConfig.Jsii$Proxy) o;

            if (!deploymentType.equals(that.deploymentType)) return false;
            if (!preferredSubnetId.equals(that.preferredSubnetId)) return false;
            if (!storageCapacity.equals(that.storageCapacity)) return false;
            if (!subnetIds.equals(that.subnetIds)) return false;
            if (this.automaticBackupRetentionDays != null ? !this.automaticBackupRetentionDays.equals(that.automaticBackupRetentionDays) : that.automaticBackupRetentionDays != null) return false;
            if (this.dailyAutomaticBackupStartTime != null ? !this.dailyAutomaticBackupStartTime.equals(that.dailyAutomaticBackupStartTime) : that.dailyAutomaticBackupStartTime != null) return false;
            if (this.diskIopsConfiguration != null ? !this.diskIopsConfiguration.equals(that.diskIopsConfiguration) : that.diskIopsConfiguration != null) return false;
            if (this.endpointIpAddressRange != null ? !this.endpointIpAddressRange.equals(that.endpointIpAddressRange) : that.endpointIpAddressRange != null) return false;
            if (this.fsxAdminPassword != null ? !this.fsxAdminPassword.equals(that.fsxAdminPassword) : that.fsxAdminPassword != null) return false;
            if (this.haPairs != null ? !this.haPairs.equals(that.haPairs) : that.haPairs != null) return false;
            if (this.id != null ? !this.id.equals(that.id) : that.id != null) return false;
            if (this.kmsKeyId != null ? !this.kmsKeyId.equals(that.kmsKeyId) : that.kmsKeyId != null) return false;
            if (this.routeTableIds != null ? !this.routeTableIds.equals(that.routeTableIds) : that.routeTableIds != null) return false;
            if (this.securityGroupIds != null ? !this.securityGroupIds.equals(that.securityGroupIds) : that.securityGroupIds != null) return false;
            if (this.storageType != null ? !this.storageType.equals(that.storageType) : that.storageType != null) return false;
            if (this.tags != null ? !this.tags.equals(that.tags) : that.tags != null) return false;
            if (this.tagsAll != null ? !this.tagsAll.equals(that.tagsAll) : that.tagsAll != null) return false;
            if (this.throughputCapacity != null ? !this.throughputCapacity.equals(that.throughputCapacity) : that.throughputCapacity != null) return false;
            if (this.throughputCapacityPerHaPair != null ? !this.throughputCapacityPerHaPair.equals(that.throughputCapacityPerHaPair) : that.throughputCapacityPerHaPair != null) return false;
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
            int result = this.deploymentType.hashCode();
            result = 31 * result + (this.preferredSubnetId.hashCode());
            result = 31 * result + (this.storageCapacity.hashCode());
            result = 31 * result + (this.subnetIds.hashCode());
            result = 31 * result + (this.automaticBackupRetentionDays != null ? this.automaticBackupRetentionDays.hashCode() : 0);
            result = 31 * result + (this.dailyAutomaticBackupStartTime != null ? this.dailyAutomaticBackupStartTime.hashCode() : 0);
            result = 31 * result + (this.diskIopsConfiguration != null ? this.diskIopsConfiguration.hashCode() : 0);
            result = 31 * result + (this.endpointIpAddressRange != null ? this.endpointIpAddressRange.hashCode() : 0);
            result = 31 * result + (this.fsxAdminPassword != null ? this.fsxAdminPassword.hashCode() : 0);
            result = 31 * result + (this.haPairs != null ? this.haPairs.hashCode() : 0);
            result = 31 * result + (this.id != null ? this.id.hashCode() : 0);
            result = 31 * result + (this.kmsKeyId != null ? this.kmsKeyId.hashCode() : 0);
            result = 31 * result + (this.routeTableIds != null ? this.routeTableIds.hashCode() : 0);
            result = 31 * result + (this.securityGroupIds != null ? this.securityGroupIds.hashCode() : 0);
            result = 31 * result + (this.storageType != null ? this.storageType.hashCode() : 0);
            result = 31 * result + (this.tags != null ? this.tags.hashCode() : 0);
            result = 31 * result + (this.tagsAll != null ? this.tagsAll.hashCode() : 0);
            result = 31 * result + (this.throughputCapacity != null ? this.throughputCapacity.hashCode() : 0);
            result = 31 * result + (this.throughputCapacityPerHaPair != null ? this.throughputCapacityPerHaPair.hashCode() : 0);
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
