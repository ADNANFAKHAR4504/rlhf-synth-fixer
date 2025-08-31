package imports.aws.data_aws_rds_orderable_db_instance;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.817Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.dataAwsRdsOrderableDbInstance.DataAwsRdsOrderableDbInstanceConfig")
@software.amazon.jsii.Jsii.Proxy(DataAwsRdsOrderableDbInstanceConfig.Jsii$Proxy.class)
public interface DataAwsRdsOrderableDbInstanceConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/rds_orderable_db_instance#engine DataAwsRdsOrderableDbInstance#engine}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getEngine();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/rds_orderable_db_instance#availability_zone_group DataAwsRdsOrderableDbInstance#availability_zone_group}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getAvailabilityZoneGroup() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/rds_orderable_db_instance#engine_latest_version DataAwsRdsOrderableDbInstance#engine_latest_version}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getEngineLatestVersion() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/rds_orderable_db_instance#engine_version DataAwsRdsOrderableDbInstance#engine_version}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getEngineVersion() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/rds_orderable_db_instance#id DataAwsRdsOrderableDbInstance#id}.
     * <p>
     * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
     * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/rds_orderable_db_instance#instance_class DataAwsRdsOrderableDbInstance#instance_class}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getInstanceClass() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/rds_orderable_db_instance#license_model DataAwsRdsOrderableDbInstance#license_model}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getLicenseModel() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/rds_orderable_db_instance#preferred_engine_versions DataAwsRdsOrderableDbInstance#preferred_engine_versions}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getPreferredEngineVersions() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/rds_orderable_db_instance#preferred_instance_classes DataAwsRdsOrderableDbInstance#preferred_instance_classes}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getPreferredInstanceClasses() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/rds_orderable_db_instance#read_replica_capable DataAwsRdsOrderableDbInstance#read_replica_capable}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getReadReplicaCapable() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/rds_orderable_db_instance#storage_type DataAwsRdsOrderableDbInstance#storage_type}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getStorageType() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/rds_orderable_db_instance#supported_engine_modes DataAwsRdsOrderableDbInstance#supported_engine_modes}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getSupportedEngineModes() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/rds_orderable_db_instance#supported_network_types DataAwsRdsOrderableDbInstance#supported_network_types}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getSupportedNetworkTypes() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/rds_orderable_db_instance#supports_clusters DataAwsRdsOrderableDbInstance#supports_clusters}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getSupportsClusters() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/rds_orderable_db_instance#supports_enhanced_monitoring DataAwsRdsOrderableDbInstance#supports_enhanced_monitoring}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getSupportsEnhancedMonitoring() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/rds_orderable_db_instance#supports_global_databases DataAwsRdsOrderableDbInstance#supports_global_databases}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getSupportsGlobalDatabases() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/rds_orderable_db_instance#supports_iam_database_authentication DataAwsRdsOrderableDbInstance#supports_iam_database_authentication}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getSupportsIamDatabaseAuthentication() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/rds_orderable_db_instance#supports_iops DataAwsRdsOrderableDbInstance#supports_iops}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getSupportsIops() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/rds_orderable_db_instance#supports_kerberos_authentication DataAwsRdsOrderableDbInstance#supports_kerberos_authentication}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getSupportsKerberosAuthentication() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/rds_orderable_db_instance#supports_multi_az DataAwsRdsOrderableDbInstance#supports_multi_az}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getSupportsMultiAz() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/rds_orderable_db_instance#supports_performance_insights DataAwsRdsOrderableDbInstance#supports_performance_insights}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getSupportsPerformanceInsights() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/rds_orderable_db_instance#supports_storage_autoscaling DataAwsRdsOrderableDbInstance#supports_storage_autoscaling}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getSupportsStorageAutoscaling() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/rds_orderable_db_instance#supports_storage_encryption DataAwsRdsOrderableDbInstance#supports_storage_encryption}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getSupportsStorageEncryption() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/rds_orderable_db_instance#vpc DataAwsRdsOrderableDbInstance#vpc}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getVpc() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link DataAwsRdsOrderableDbInstanceConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link DataAwsRdsOrderableDbInstanceConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<DataAwsRdsOrderableDbInstanceConfig> {
        java.lang.String engine;
        java.lang.String availabilityZoneGroup;
        java.lang.Object engineLatestVersion;
        java.lang.String engineVersion;
        java.lang.String id;
        java.lang.String instanceClass;
        java.lang.String licenseModel;
        java.util.List<java.lang.String> preferredEngineVersions;
        java.util.List<java.lang.String> preferredInstanceClasses;
        java.lang.Object readReplicaCapable;
        java.lang.String storageType;
        java.util.List<java.lang.String> supportedEngineModes;
        java.util.List<java.lang.String> supportedNetworkTypes;
        java.lang.Object supportsClusters;
        java.lang.Object supportsEnhancedMonitoring;
        java.lang.Object supportsGlobalDatabases;
        java.lang.Object supportsIamDatabaseAuthentication;
        java.lang.Object supportsIops;
        java.lang.Object supportsKerberosAuthentication;
        java.lang.Object supportsMultiAz;
        java.lang.Object supportsPerformanceInsights;
        java.lang.Object supportsStorageAutoscaling;
        java.lang.Object supportsStorageEncryption;
        java.lang.Object vpc;
        java.lang.Object connection;
        java.lang.Object count;
        java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        com.hashicorp.cdktf.ITerraformIterator forEach;
        com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        com.hashicorp.cdktf.TerraformProvider provider;
        java.util.List<java.lang.Object> provisioners;

        /**
         * Sets the value of {@link DataAwsRdsOrderableDbInstanceConfig#getEngine}
         * @param engine Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/rds_orderable_db_instance#engine DataAwsRdsOrderableDbInstance#engine}. This parameter is required.
         * @return {@code this}
         */
        public Builder engine(java.lang.String engine) {
            this.engine = engine;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsRdsOrderableDbInstanceConfig#getAvailabilityZoneGroup}
         * @param availabilityZoneGroup Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/rds_orderable_db_instance#availability_zone_group DataAwsRdsOrderableDbInstance#availability_zone_group}.
         * @return {@code this}
         */
        public Builder availabilityZoneGroup(java.lang.String availabilityZoneGroup) {
            this.availabilityZoneGroup = availabilityZoneGroup;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsRdsOrderableDbInstanceConfig#getEngineLatestVersion}
         * @param engineLatestVersion Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/rds_orderable_db_instance#engine_latest_version DataAwsRdsOrderableDbInstance#engine_latest_version}.
         * @return {@code this}
         */
        public Builder engineLatestVersion(java.lang.Boolean engineLatestVersion) {
            this.engineLatestVersion = engineLatestVersion;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsRdsOrderableDbInstanceConfig#getEngineLatestVersion}
         * @param engineLatestVersion Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/rds_orderable_db_instance#engine_latest_version DataAwsRdsOrderableDbInstance#engine_latest_version}.
         * @return {@code this}
         */
        public Builder engineLatestVersion(com.hashicorp.cdktf.IResolvable engineLatestVersion) {
            this.engineLatestVersion = engineLatestVersion;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsRdsOrderableDbInstanceConfig#getEngineVersion}
         * @param engineVersion Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/rds_orderable_db_instance#engine_version DataAwsRdsOrderableDbInstance#engine_version}.
         * @return {@code this}
         */
        public Builder engineVersion(java.lang.String engineVersion) {
            this.engineVersion = engineVersion;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsRdsOrderableDbInstanceConfig#getId}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/rds_orderable_db_instance#id DataAwsRdsOrderableDbInstance#id}.
         *           Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         *           If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * @return {@code this}
         */
        public Builder id(java.lang.String id) {
            this.id = id;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsRdsOrderableDbInstanceConfig#getInstanceClass}
         * @param instanceClass Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/rds_orderable_db_instance#instance_class DataAwsRdsOrderableDbInstance#instance_class}.
         * @return {@code this}
         */
        public Builder instanceClass(java.lang.String instanceClass) {
            this.instanceClass = instanceClass;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsRdsOrderableDbInstanceConfig#getLicenseModel}
         * @param licenseModel Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/rds_orderable_db_instance#license_model DataAwsRdsOrderableDbInstance#license_model}.
         * @return {@code this}
         */
        public Builder licenseModel(java.lang.String licenseModel) {
            this.licenseModel = licenseModel;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsRdsOrderableDbInstanceConfig#getPreferredEngineVersions}
         * @param preferredEngineVersions Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/rds_orderable_db_instance#preferred_engine_versions DataAwsRdsOrderableDbInstance#preferred_engine_versions}.
         * @return {@code this}
         */
        public Builder preferredEngineVersions(java.util.List<java.lang.String> preferredEngineVersions) {
            this.preferredEngineVersions = preferredEngineVersions;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsRdsOrderableDbInstanceConfig#getPreferredInstanceClasses}
         * @param preferredInstanceClasses Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/rds_orderable_db_instance#preferred_instance_classes DataAwsRdsOrderableDbInstance#preferred_instance_classes}.
         * @return {@code this}
         */
        public Builder preferredInstanceClasses(java.util.List<java.lang.String> preferredInstanceClasses) {
            this.preferredInstanceClasses = preferredInstanceClasses;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsRdsOrderableDbInstanceConfig#getReadReplicaCapable}
         * @param readReplicaCapable Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/rds_orderable_db_instance#read_replica_capable DataAwsRdsOrderableDbInstance#read_replica_capable}.
         * @return {@code this}
         */
        public Builder readReplicaCapable(java.lang.Boolean readReplicaCapable) {
            this.readReplicaCapable = readReplicaCapable;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsRdsOrderableDbInstanceConfig#getReadReplicaCapable}
         * @param readReplicaCapable Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/rds_orderable_db_instance#read_replica_capable DataAwsRdsOrderableDbInstance#read_replica_capable}.
         * @return {@code this}
         */
        public Builder readReplicaCapable(com.hashicorp.cdktf.IResolvable readReplicaCapable) {
            this.readReplicaCapable = readReplicaCapable;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsRdsOrderableDbInstanceConfig#getStorageType}
         * @param storageType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/rds_orderable_db_instance#storage_type DataAwsRdsOrderableDbInstance#storage_type}.
         * @return {@code this}
         */
        public Builder storageType(java.lang.String storageType) {
            this.storageType = storageType;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsRdsOrderableDbInstanceConfig#getSupportedEngineModes}
         * @param supportedEngineModes Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/rds_orderable_db_instance#supported_engine_modes DataAwsRdsOrderableDbInstance#supported_engine_modes}.
         * @return {@code this}
         */
        public Builder supportedEngineModes(java.util.List<java.lang.String> supportedEngineModes) {
            this.supportedEngineModes = supportedEngineModes;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsRdsOrderableDbInstanceConfig#getSupportedNetworkTypes}
         * @param supportedNetworkTypes Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/rds_orderable_db_instance#supported_network_types DataAwsRdsOrderableDbInstance#supported_network_types}.
         * @return {@code this}
         */
        public Builder supportedNetworkTypes(java.util.List<java.lang.String> supportedNetworkTypes) {
            this.supportedNetworkTypes = supportedNetworkTypes;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsRdsOrderableDbInstanceConfig#getSupportsClusters}
         * @param supportsClusters Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/rds_orderable_db_instance#supports_clusters DataAwsRdsOrderableDbInstance#supports_clusters}.
         * @return {@code this}
         */
        public Builder supportsClusters(java.lang.Boolean supportsClusters) {
            this.supportsClusters = supportsClusters;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsRdsOrderableDbInstanceConfig#getSupportsClusters}
         * @param supportsClusters Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/rds_orderable_db_instance#supports_clusters DataAwsRdsOrderableDbInstance#supports_clusters}.
         * @return {@code this}
         */
        public Builder supportsClusters(com.hashicorp.cdktf.IResolvable supportsClusters) {
            this.supportsClusters = supportsClusters;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsRdsOrderableDbInstanceConfig#getSupportsEnhancedMonitoring}
         * @param supportsEnhancedMonitoring Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/rds_orderable_db_instance#supports_enhanced_monitoring DataAwsRdsOrderableDbInstance#supports_enhanced_monitoring}.
         * @return {@code this}
         */
        public Builder supportsEnhancedMonitoring(java.lang.Boolean supportsEnhancedMonitoring) {
            this.supportsEnhancedMonitoring = supportsEnhancedMonitoring;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsRdsOrderableDbInstanceConfig#getSupportsEnhancedMonitoring}
         * @param supportsEnhancedMonitoring Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/rds_orderable_db_instance#supports_enhanced_monitoring DataAwsRdsOrderableDbInstance#supports_enhanced_monitoring}.
         * @return {@code this}
         */
        public Builder supportsEnhancedMonitoring(com.hashicorp.cdktf.IResolvable supportsEnhancedMonitoring) {
            this.supportsEnhancedMonitoring = supportsEnhancedMonitoring;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsRdsOrderableDbInstanceConfig#getSupportsGlobalDatabases}
         * @param supportsGlobalDatabases Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/rds_orderable_db_instance#supports_global_databases DataAwsRdsOrderableDbInstance#supports_global_databases}.
         * @return {@code this}
         */
        public Builder supportsGlobalDatabases(java.lang.Boolean supportsGlobalDatabases) {
            this.supportsGlobalDatabases = supportsGlobalDatabases;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsRdsOrderableDbInstanceConfig#getSupportsGlobalDatabases}
         * @param supportsGlobalDatabases Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/rds_orderable_db_instance#supports_global_databases DataAwsRdsOrderableDbInstance#supports_global_databases}.
         * @return {@code this}
         */
        public Builder supportsGlobalDatabases(com.hashicorp.cdktf.IResolvable supportsGlobalDatabases) {
            this.supportsGlobalDatabases = supportsGlobalDatabases;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsRdsOrderableDbInstanceConfig#getSupportsIamDatabaseAuthentication}
         * @param supportsIamDatabaseAuthentication Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/rds_orderable_db_instance#supports_iam_database_authentication DataAwsRdsOrderableDbInstance#supports_iam_database_authentication}.
         * @return {@code this}
         */
        public Builder supportsIamDatabaseAuthentication(java.lang.Boolean supportsIamDatabaseAuthentication) {
            this.supportsIamDatabaseAuthentication = supportsIamDatabaseAuthentication;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsRdsOrderableDbInstanceConfig#getSupportsIamDatabaseAuthentication}
         * @param supportsIamDatabaseAuthentication Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/rds_orderable_db_instance#supports_iam_database_authentication DataAwsRdsOrderableDbInstance#supports_iam_database_authentication}.
         * @return {@code this}
         */
        public Builder supportsIamDatabaseAuthentication(com.hashicorp.cdktf.IResolvable supportsIamDatabaseAuthentication) {
            this.supportsIamDatabaseAuthentication = supportsIamDatabaseAuthentication;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsRdsOrderableDbInstanceConfig#getSupportsIops}
         * @param supportsIops Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/rds_orderable_db_instance#supports_iops DataAwsRdsOrderableDbInstance#supports_iops}.
         * @return {@code this}
         */
        public Builder supportsIops(java.lang.Boolean supportsIops) {
            this.supportsIops = supportsIops;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsRdsOrderableDbInstanceConfig#getSupportsIops}
         * @param supportsIops Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/rds_orderable_db_instance#supports_iops DataAwsRdsOrderableDbInstance#supports_iops}.
         * @return {@code this}
         */
        public Builder supportsIops(com.hashicorp.cdktf.IResolvable supportsIops) {
            this.supportsIops = supportsIops;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsRdsOrderableDbInstanceConfig#getSupportsKerberosAuthentication}
         * @param supportsKerberosAuthentication Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/rds_orderable_db_instance#supports_kerberos_authentication DataAwsRdsOrderableDbInstance#supports_kerberos_authentication}.
         * @return {@code this}
         */
        public Builder supportsKerberosAuthentication(java.lang.Boolean supportsKerberosAuthentication) {
            this.supportsKerberosAuthentication = supportsKerberosAuthentication;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsRdsOrderableDbInstanceConfig#getSupportsKerberosAuthentication}
         * @param supportsKerberosAuthentication Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/rds_orderable_db_instance#supports_kerberos_authentication DataAwsRdsOrderableDbInstance#supports_kerberos_authentication}.
         * @return {@code this}
         */
        public Builder supportsKerberosAuthentication(com.hashicorp.cdktf.IResolvable supportsKerberosAuthentication) {
            this.supportsKerberosAuthentication = supportsKerberosAuthentication;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsRdsOrderableDbInstanceConfig#getSupportsMultiAz}
         * @param supportsMultiAz Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/rds_orderable_db_instance#supports_multi_az DataAwsRdsOrderableDbInstance#supports_multi_az}.
         * @return {@code this}
         */
        public Builder supportsMultiAz(java.lang.Boolean supportsMultiAz) {
            this.supportsMultiAz = supportsMultiAz;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsRdsOrderableDbInstanceConfig#getSupportsMultiAz}
         * @param supportsMultiAz Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/rds_orderable_db_instance#supports_multi_az DataAwsRdsOrderableDbInstance#supports_multi_az}.
         * @return {@code this}
         */
        public Builder supportsMultiAz(com.hashicorp.cdktf.IResolvable supportsMultiAz) {
            this.supportsMultiAz = supportsMultiAz;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsRdsOrderableDbInstanceConfig#getSupportsPerformanceInsights}
         * @param supportsPerformanceInsights Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/rds_orderable_db_instance#supports_performance_insights DataAwsRdsOrderableDbInstance#supports_performance_insights}.
         * @return {@code this}
         */
        public Builder supportsPerformanceInsights(java.lang.Boolean supportsPerformanceInsights) {
            this.supportsPerformanceInsights = supportsPerformanceInsights;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsRdsOrderableDbInstanceConfig#getSupportsPerformanceInsights}
         * @param supportsPerformanceInsights Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/rds_orderable_db_instance#supports_performance_insights DataAwsRdsOrderableDbInstance#supports_performance_insights}.
         * @return {@code this}
         */
        public Builder supportsPerformanceInsights(com.hashicorp.cdktf.IResolvable supportsPerformanceInsights) {
            this.supportsPerformanceInsights = supportsPerformanceInsights;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsRdsOrderableDbInstanceConfig#getSupportsStorageAutoscaling}
         * @param supportsStorageAutoscaling Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/rds_orderable_db_instance#supports_storage_autoscaling DataAwsRdsOrderableDbInstance#supports_storage_autoscaling}.
         * @return {@code this}
         */
        public Builder supportsStorageAutoscaling(java.lang.Boolean supportsStorageAutoscaling) {
            this.supportsStorageAutoscaling = supportsStorageAutoscaling;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsRdsOrderableDbInstanceConfig#getSupportsStorageAutoscaling}
         * @param supportsStorageAutoscaling Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/rds_orderable_db_instance#supports_storage_autoscaling DataAwsRdsOrderableDbInstance#supports_storage_autoscaling}.
         * @return {@code this}
         */
        public Builder supportsStorageAutoscaling(com.hashicorp.cdktf.IResolvable supportsStorageAutoscaling) {
            this.supportsStorageAutoscaling = supportsStorageAutoscaling;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsRdsOrderableDbInstanceConfig#getSupportsStorageEncryption}
         * @param supportsStorageEncryption Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/rds_orderable_db_instance#supports_storage_encryption DataAwsRdsOrderableDbInstance#supports_storage_encryption}.
         * @return {@code this}
         */
        public Builder supportsStorageEncryption(java.lang.Boolean supportsStorageEncryption) {
            this.supportsStorageEncryption = supportsStorageEncryption;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsRdsOrderableDbInstanceConfig#getSupportsStorageEncryption}
         * @param supportsStorageEncryption Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/rds_orderable_db_instance#supports_storage_encryption DataAwsRdsOrderableDbInstance#supports_storage_encryption}.
         * @return {@code this}
         */
        public Builder supportsStorageEncryption(com.hashicorp.cdktf.IResolvable supportsStorageEncryption) {
            this.supportsStorageEncryption = supportsStorageEncryption;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsRdsOrderableDbInstanceConfig#getVpc}
         * @param vpc Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/rds_orderable_db_instance#vpc DataAwsRdsOrderableDbInstance#vpc}.
         * @return {@code this}
         */
        public Builder vpc(java.lang.Boolean vpc) {
            this.vpc = vpc;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsRdsOrderableDbInstanceConfig#getVpc}
         * @param vpc Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/rds_orderable_db_instance#vpc DataAwsRdsOrderableDbInstance#vpc}.
         * @return {@code this}
         */
        public Builder vpc(com.hashicorp.cdktf.IResolvable vpc) {
            this.vpc = vpc;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsRdsOrderableDbInstanceConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsRdsOrderableDbInstanceConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsRdsOrderableDbInstanceConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsRdsOrderableDbInstanceConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsRdsOrderableDbInstanceConfig#getDependsOn}
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
         * Sets the value of {@link DataAwsRdsOrderableDbInstanceConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsRdsOrderableDbInstanceConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsRdsOrderableDbInstanceConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link DataAwsRdsOrderableDbInstanceConfig#getProvisioners}
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
         * @return a new instance of {@link DataAwsRdsOrderableDbInstanceConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public DataAwsRdsOrderableDbInstanceConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link DataAwsRdsOrderableDbInstanceConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements DataAwsRdsOrderableDbInstanceConfig {
        private final java.lang.String engine;
        private final java.lang.String availabilityZoneGroup;
        private final java.lang.Object engineLatestVersion;
        private final java.lang.String engineVersion;
        private final java.lang.String id;
        private final java.lang.String instanceClass;
        private final java.lang.String licenseModel;
        private final java.util.List<java.lang.String> preferredEngineVersions;
        private final java.util.List<java.lang.String> preferredInstanceClasses;
        private final java.lang.Object readReplicaCapable;
        private final java.lang.String storageType;
        private final java.util.List<java.lang.String> supportedEngineModes;
        private final java.util.List<java.lang.String> supportedNetworkTypes;
        private final java.lang.Object supportsClusters;
        private final java.lang.Object supportsEnhancedMonitoring;
        private final java.lang.Object supportsGlobalDatabases;
        private final java.lang.Object supportsIamDatabaseAuthentication;
        private final java.lang.Object supportsIops;
        private final java.lang.Object supportsKerberosAuthentication;
        private final java.lang.Object supportsMultiAz;
        private final java.lang.Object supportsPerformanceInsights;
        private final java.lang.Object supportsStorageAutoscaling;
        private final java.lang.Object supportsStorageEncryption;
        private final java.lang.Object vpc;
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
            this.engine = software.amazon.jsii.Kernel.get(this, "engine", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.availabilityZoneGroup = software.amazon.jsii.Kernel.get(this, "availabilityZoneGroup", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.engineLatestVersion = software.amazon.jsii.Kernel.get(this, "engineLatestVersion", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.engineVersion = software.amazon.jsii.Kernel.get(this, "engineVersion", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.id = software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.instanceClass = software.amazon.jsii.Kernel.get(this, "instanceClass", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.licenseModel = software.amazon.jsii.Kernel.get(this, "licenseModel", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.preferredEngineVersions = software.amazon.jsii.Kernel.get(this, "preferredEngineVersions", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.preferredInstanceClasses = software.amazon.jsii.Kernel.get(this, "preferredInstanceClasses", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.readReplicaCapable = software.amazon.jsii.Kernel.get(this, "readReplicaCapable", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.storageType = software.amazon.jsii.Kernel.get(this, "storageType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.supportedEngineModes = software.amazon.jsii.Kernel.get(this, "supportedEngineModes", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.supportedNetworkTypes = software.amazon.jsii.Kernel.get(this, "supportedNetworkTypes", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.supportsClusters = software.amazon.jsii.Kernel.get(this, "supportsClusters", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.supportsEnhancedMonitoring = software.amazon.jsii.Kernel.get(this, "supportsEnhancedMonitoring", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.supportsGlobalDatabases = software.amazon.jsii.Kernel.get(this, "supportsGlobalDatabases", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.supportsIamDatabaseAuthentication = software.amazon.jsii.Kernel.get(this, "supportsIamDatabaseAuthentication", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.supportsIops = software.amazon.jsii.Kernel.get(this, "supportsIops", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.supportsKerberosAuthentication = software.amazon.jsii.Kernel.get(this, "supportsKerberosAuthentication", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.supportsMultiAz = software.amazon.jsii.Kernel.get(this, "supportsMultiAz", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.supportsPerformanceInsights = software.amazon.jsii.Kernel.get(this, "supportsPerformanceInsights", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.supportsStorageAutoscaling = software.amazon.jsii.Kernel.get(this, "supportsStorageAutoscaling", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.supportsStorageEncryption = software.amazon.jsii.Kernel.get(this, "supportsStorageEncryption", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.vpc = software.amazon.jsii.Kernel.get(this, "vpc", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
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
            this.engine = java.util.Objects.requireNonNull(builder.engine, "engine is required");
            this.availabilityZoneGroup = builder.availabilityZoneGroup;
            this.engineLatestVersion = builder.engineLatestVersion;
            this.engineVersion = builder.engineVersion;
            this.id = builder.id;
            this.instanceClass = builder.instanceClass;
            this.licenseModel = builder.licenseModel;
            this.preferredEngineVersions = builder.preferredEngineVersions;
            this.preferredInstanceClasses = builder.preferredInstanceClasses;
            this.readReplicaCapable = builder.readReplicaCapable;
            this.storageType = builder.storageType;
            this.supportedEngineModes = builder.supportedEngineModes;
            this.supportedNetworkTypes = builder.supportedNetworkTypes;
            this.supportsClusters = builder.supportsClusters;
            this.supportsEnhancedMonitoring = builder.supportsEnhancedMonitoring;
            this.supportsGlobalDatabases = builder.supportsGlobalDatabases;
            this.supportsIamDatabaseAuthentication = builder.supportsIamDatabaseAuthentication;
            this.supportsIops = builder.supportsIops;
            this.supportsKerberosAuthentication = builder.supportsKerberosAuthentication;
            this.supportsMultiAz = builder.supportsMultiAz;
            this.supportsPerformanceInsights = builder.supportsPerformanceInsights;
            this.supportsStorageAutoscaling = builder.supportsStorageAutoscaling;
            this.supportsStorageEncryption = builder.supportsStorageEncryption;
            this.vpc = builder.vpc;
            this.connection = builder.connection;
            this.count = builder.count;
            this.dependsOn = (java.util.List<com.hashicorp.cdktf.ITerraformDependable>)builder.dependsOn;
            this.forEach = builder.forEach;
            this.lifecycle = builder.lifecycle;
            this.provider = builder.provider;
            this.provisioners = (java.util.List<java.lang.Object>)builder.provisioners;
        }

        @Override
        public final java.lang.String getEngine() {
            return this.engine;
        }

        @Override
        public final java.lang.String getAvailabilityZoneGroup() {
            return this.availabilityZoneGroup;
        }

        @Override
        public final java.lang.Object getEngineLatestVersion() {
            return this.engineLatestVersion;
        }

        @Override
        public final java.lang.String getEngineVersion() {
            return this.engineVersion;
        }

        @Override
        public final java.lang.String getId() {
            return this.id;
        }

        @Override
        public final java.lang.String getInstanceClass() {
            return this.instanceClass;
        }

        @Override
        public final java.lang.String getLicenseModel() {
            return this.licenseModel;
        }

        @Override
        public final java.util.List<java.lang.String> getPreferredEngineVersions() {
            return this.preferredEngineVersions;
        }

        @Override
        public final java.util.List<java.lang.String> getPreferredInstanceClasses() {
            return this.preferredInstanceClasses;
        }

        @Override
        public final java.lang.Object getReadReplicaCapable() {
            return this.readReplicaCapable;
        }

        @Override
        public final java.lang.String getStorageType() {
            return this.storageType;
        }

        @Override
        public final java.util.List<java.lang.String> getSupportedEngineModes() {
            return this.supportedEngineModes;
        }

        @Override
        public final java.util.List<java.lang.String> getSupportedNetworkTypes() {
            return this.supportedNetworkTypes;
        }

        @Override
        public final java.lang.Object getSupportsClusters() {
            return this.supportsClusters;
        }

        @Override
        public final java.lang.Object getSupportsEnhancedMonitoring() {
            return this.supportsEnhancedMonitoring;
        }

        @Override
        public final java.lang.Object getSupportsGlobalDatabases() {
            return this.supportsGlobalDatabases;
        }

        @Override
        public final java.lang.Object getSupportsIamDatabaseAuthentication() {
            return this.supportsIamDatabaseAuthentication;
        }

        @Override
        public final java.lang.Object getSupportsIops() {
            return this.supportsIops;
        }

        @Override
        public final java.lang.Object getSupportsKerberosAuthentication() {
            return this.supportsKerberosAuthentication;
        }

        @Override
        public final java.lang.Object getSupportsMultiAz() {
            return this.supportsMultiAz;
        }

        @Override
        public final java.lang.Object getSupportsPerformanceInsights() {
            return this.supportsPerformanceInsights;
        }

        @Override
        public final java.lang.Object getSupportsStorageAutoscaling() {
            return this.supportsStorageAutoscaling;
        }

        @Override
        public final java.lang.Object getSupportsStorageEncryption() {
            return this.supportsStorageEncryption;
        }

        @Override
        public final java.lang.Object getVpc() {
            return this.vpc;
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

            data.set("engine", om.valueToTree(this.getEngine()));
            if (this.getAvailabilityZoneGroup() != null) {
                data.set("availabilityZoneGroup", om.valueToTree(this.getAvailabilityZoneGroup()));
            }
            if (this.getEngineLatestVersion() != null) {
                data.set("engineLatestVersion", om.valueToTree(this.getEngineLatestVersion()));
            }
            if (this.getEngineVersion() != null) {
                data.set("engineVersion", om.valueToTree(this.getEngineVersion()));
            }
            if (this.getId() != null) {
                data.set("id", om.valueToTree(this.getId()));
            }
            if (this.getInstanceClass() != null) {
                data.set("instanceClass", om.valueToTree(this.getInstanceClass()));
            }
            if (this.getLicenseModel() != null) {
                data.set("licenseModel", om.valueToTree(this.getLicenseModel()));
            }
            if (this.getPreferredEngineVersions() != null) {
                data.set("preferredEngineVersions", om.valueToTree(this.getPreferredEngineVersions()));
            }
            if (this.getPreferredInstanceClasses() != null) {
                data.set("preferredInstanceClasses", om.valueToTree(this.getPreferredInstanceClasses()));
            }
            if (this.getReadReplicaCapable() != null) {
                data.set("readReplicaCapable", om.valueToTree(this.getReadReplicaCapable()));
            }
            if (this.getStorageType() != null) {
                data.set("storageType", om.valueToTree(this.getStorageType()));
            }
            if (this.getSupportedEngineModes() != null) {
                data.set("supportedEngineModes", om.valueToTree(this.getSupportedEngineModes()));
            }
            if (this.getSupportedNetworkTypes() != null) {
                data.set("supportedNetworkTypes", om.valueToTree(this.getSupportedNetworkTypes()));
            }
            if (this.getSupportsClusters() != null) {
                data.set("supportsClusters", om.valueToTree(this.getSupportsClusters()));
            }
            if (this.getSupportsEnhancedMonitoring() != null) {
                data.set("supportsEnhancedMonitoring", om.valueToTree(this.getSupportsEnhancedMonitoring()));
            }
            if (this.getSupportsGlobalDatabases() != null) {
                data.set("supportsGlobalDatabases", om.valueToTree(this.getSupportsGlobalDatabases()));
            }
            if (this.getSupportsIamDatabaseAuthentication() != null) {
                data.set("supportsIamDatabaseAuthentication", om.valueToTree(this.getSupportsIamDatabaseAuthentication()));
            }
            if (this.getSupportsIops() != null) {
                data.set("supportsIops", om.valueToTree(this.getSupportsIops()));
            }
            if (this.getSupportsKerberosAuthentication() != null) {
                data.set("supportsKerberosAuthentication", om.valueToTree(this.getSupportsKerberosAuthentication()));
            }
            if (this.getSupportsMultiAz() != null) {
                data.set("supportsMultiAz", om.valueToTree(this.getSupportsMultiAz()));
            }
            if (this.getSupportsPerformanceInsights() != null) {
                data.set("supportsPerformanceInsights", om.valueToTree(this.getSupportsPerformanceInsights()));
            }
            if (this.getSupportsStorageAutoscaling() != null) {
                data.set("supportsStorageAutoscaling", om.valueToTree(this.getSupportsStorageAutoscaling()));
            }
            if (this.getSupportsStorageEncryption() != null) {
                data.set("supportsStorageEncryption", om.valueToTree(this.getSupportsStorageEncryption()));
            }
            if (this.getVpc() != null) {
                data.set("vpc", om.valueToTree(this.getVpc()));
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
            struct.set("fqn", om.valueToTree("aws.dataAwsRdsOrderableDbInstance.DataAwsRdsOrderableDbInstanceConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            DataAwsRdsOrderableDbInstanceConfig.Jsii$Proxy that = (DataAwsRdsOrderableDbInstanceConfig.Jsii$Proxy) o;

            if (!engine.equals(that.engine)) return false;
            if (this.availabilityZoneGroup != null ? !this.availabilityZoneGroup.equals(that.availabilityZoneGroup) : that.availabilityZoneGroup != null) return false;
            if (this.engineLatestVersion != null ? !this.engineLatestVersion.equals(that.engineLatestVersion) : that.engineLatestVersion != null) return false;
            if (this.engineVersion != null ? !this.engineVersion.equals(that.engineVersion) : that.engineVersion != null) return false;
            if (this.id != null ? !this.id.equals(that.id) : that.id != null) return false;
            if (this.instanceClass != null ? !this.instanceClass.equals(that.instanceClass) : that.instanceClass != null) return false;
            if (this.licenseModel != null ? !this.licenseModel.equals(that.licenseModel) : that.licenseModel != null) return false;
            if (this.preferredEngineVersions != null ? !this.preferredEngineVersions.equals(that.preferredEngineVersions) : that.preferredEngineVersions != null) return false;
            if (this.preferredInstanceClasses != null ? !this.preferredInstanceClasses.equals(that.preferredInstanceClasses) : that.preferredInstanceClasses != null) return false;
            if (this.readReplicaCapable != null ? !this.readReplicaCapable.equals(that.readReplicaCapable) : that.readReplicaCapable != null) return false;
            if (this.storageType != null ? !this.storageType.equals(that.storageType) : that.storageType != null) return false;
            if (this.supportedEngineModes != null ? !this.supportedEngineModes.equals(that.supportedEngineModes) : that.supportedEngineModes != null) return false;
            if (this.supportedNetworkTypes != null ? !this.supportedNetworkTypes.equals(that.supportedNetworkTypes) : that.supportedNetworkTypes != null) return false;
            if (this.supportsClusters != null ? !this.supportsClusters.equals(that.supportsClusters) : that.supportsClusters != null) return false;
            if (this.supportsEnhancedMonitoring != null ? !this.supportsEnhancedMonitoring.equals(that.supportsEnhancedMonitoring) : that.supportsEnhancedMonitoring != null) return false;
            if (this.supportsGlobalDatabases != null ? !this.supportsGlobalDatabases.equals(that.supportsGlobalDatabases) : that.supportsGlobalDatabases != null) return false;
            if (this.supportsIamDatabaseAuthentication != null ? !this.supportsIamDatabaseAuthentication.equals(that.supportsIamDatabaseAuthentication) : that.supportsIamDatabaseAuthentication != null) return false;
            if (this.supportsIops != null ? !this.supportsIops.equals(that.supportsIops) : that.supportsIops != null) return false;
            if (this.supportsKerberosAuthentication != null ? !this.supportsKerberosAuthentication.equals(that.supportsKerberosAuthentication) : that.supportsKerberosAuthentication != null) return false;
            if (this.supportsMultiAz != null ? !this.supportsMultiAz.equals(that.supportsMultiAz) : that.supportsMultiAz != null) return false;
            if (this.supportsPerformanceInsights != null ? !this.supportsPerformanceInsights.equals(that.supportsPerformanceInsights) : that.supportsPerformanceInsights != null) return false;
            if (this.supportsStorageAutoscaling != null ? !this.supportsStorageAutoscaling.equals(that.supportsStorageAutoscaling) : that.supportsStorageAutoscaling != null) return false;
            if (this.supportsStorageEncryption != null ? !this.supportsStorageEncryption.equals(that.supportsStorageEncryption) : that.supportsStorageEncryption != null) return false;
            if (this.vpc != null ? !this.vpc.equals(that.vpc) : that.vpc != null) return false;
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
            int result = this.engine.hashCode();
            result = 31 * result + (this.availabilityZoneGroup != null ? this.availabilityZoneGroup.hashCode() : 0);
            result = 31 * result + (this.engineLatestVersion != null ? this.engineLatestVersion.hashCode() : 0);
            result = 31 * result + (this.engineVersion != null ? this.engineVersion.hashCode() : 0);
            result = 31 * result + (this.id != null ? this.id.hashCode() : 0);
            result = 31 * result + (this.instanceClass != null ? this.instanceClass.hashCode() : 0);
            result = 31 * result + (this.licenseModel != null ? this.licenseModel.hashCode() : 0);
            result = 31 * result + (this.preferredEngineVersions != null ? this.preferredEngineVersions.hashCode() : 0);
            result = 31 * result + (this.preferredInstanceClasses != null ? this.preferredInstanceClasses.hashCode() : 0);
            result = 31 * result + (this.readReplicaCapable != null ? this.readReplicaCapable.hashCode() : 0);
            result = 31 * result + (this.storageType != null ? this.storageType.hashCode() : 0);
            result = 31 * result + (this.supportedEngineModes != null ? this.supportedEngineModes.hashCode() : 0);
            result = 31 * result + (this.supportedNetworkTypes != null ? this.supportedNetworkTypes.hashCode() : 0);
            result = 31 * result + (this.supportsClusters != null ? this.supportsClusters.hashCode() : 0);
            result = 31 * result + (this.supportsEnhancedMonitoring != null ? this.supportsEnhancedMonitoring.hashCode() : 0);
            result = 31 * result + (this.supportsGlobalDatabases != null ? this.supportsGlobalDatabases.hashCode() : 0);
            result = 31 * result + (this.supportsIamDatabaseAuthentication != null ? this.supportsIamDatabaseAuthentication.hashCode() : 0);
            result = 31 * result + (this.supportsIops != null ? this.supportsIops.hashCode() : 0);
            result = 31 * result + (this.supportsKerberosAuthentication != null ? this.supportsKerberosAuthentication.hashCode() : 0);
            result = 31 * result + (this.supportsMultiAz != null ? this.supportsMultiAz.hashCode() : 0);
            result = 31 * result + (this.supportsPerformanceInsights != null ? this.supportsPerformanceInsights.hashCode() : 0);
            result = 31 * result + (this.supportsStorageAutoscaling != null ? this.supportsStorageAutoscaling.hashCode() : 0);
            result = 31 * result + (this.supportsStorageEncryption != null ? this.supportsStorageEncryption.hashCode() : 0);
            result = 31 * result + (this.vpc != null ? this.vpc.hashCode() : 0);
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
