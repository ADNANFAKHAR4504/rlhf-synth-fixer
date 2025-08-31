package imports.aws.mwaa_environment;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.922Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.mwaaEnvironment.MwaaEnvironmentConfig")
@software.amazon.jsii.Jsii.Proxy(MwaaEnvironmentConfig.Jsii$Proxy.class)
public interface MwaaEnvironmentConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mwaa_environment#dag_s3_path MwaaEnvironment#dag_s3_path}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getDagS3Path();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mwaa_environment#execution_role_arn MwaaEnvironment#execution_role_arn}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getExecutionRoleArn();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mwaa_environment#name MwaaEnvironment#name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getName();

    /**
     * network_configuration block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mwaa_environment#network_configuration MwaaEnvironment#network_configuration}
     */
    @org.jetbrains.annotations.NotNull imports.aws.mwaa_environment.MwaaEnvironmentNetworkConfiguration getNetworkConfiguration();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mwaa_environment#source_bucket_arn MwaaEnvironment#source_bucket_arn}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getSourceBucketArn();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mwaa_environment#airflow_configuration_options MwaaEnvironment#airflow_configuration_options}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getAirflowConfigurationOptions() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mwaa_environment#airflow_version MwaaEnvironment#airflow_version}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getAirflowVersion() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mwaa_environment#endpoint_management MwaaEnvironment#endpoint_management}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getEndpointManagement() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mwaa_environment#environment_class MwaaEnvironment#environment_class}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getEnvironmentClass() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mwaa_environment#id MwaaEnvironment#id}.
     * <p>
     * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
     * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mwaa_environment#kms_key MwaaEnvironment#kms_key}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getKmsKey() {
        return null;
    }

    /**
     * logging_configuration block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mwaa_environment#logging_configuration MwaaEnvironment#logging_configuration}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.mwaa_environment.MwaaEnvironmentLoggingConfiguration getLoggingConfiguration() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mwaa_environment#max_webservers MwaaEnvironment#max_webservers}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getMaxWebservers() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mwaa_environment#max_workers MwaaEnvironment#max_workers}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getMaxWorkers() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mwaa_environment#min_webservers MwaaEnvironment#min_webservers}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getMinWebservers() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mwaa_environment#min_workers MwaaEnvironment#min_workers}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getMinWorkers() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mwaa_environment#plugins_s3_object_version MwaaEnvironment#plugins_s3_object_version}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getPluginsS3ObjectVersion() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mwaa_environment#plugins_s3_path MwaaEnvironment#plugins_s3_path}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getPluginsS3Path() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mwaa_environment#requirements_s3_object_version MwaaEnvironment#requirements_s3_object_version}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getRequirementsS3ObjectVersion() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mwaa_environment#requirements_s3_path MwaaEnvironment#requirements_s3_path}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getRequirementsS3Path() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mwaa_environment#schedulers MwaaEnvironment#schedulers}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getSchedulers() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mwaa_environment#startup_script_s3_object_version MwaaEnvironment#startup_script_s3_object_version}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getStartupScriptS3ObjectVersion() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mwaa_environment#startup_script_s3_path MwaaEnvironment#startup_script_s3_path}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getStartupScriptS3Path() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mwaa_environment#tags MwaaEnvironment#tags}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTags() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mwaa_environment#tags_all MwaaEnvironment#tags_all}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsAll() {
        return null;
    }

    /**
     * timeouts block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mwaa_environment#timeouts MwaaEnvironment#timeouts}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.mwaa_environment.MwaaEnvironmentTimeouts getTimeouts() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mwaa_environment#webserver_access_mode MwaaEnvironment#webserver_access_mode}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getWebserverAccessMode() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mwaa_environment#weekly_maintenance_window_start MwaaEnvironment#weekly_maintenance_window_start}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getWeeklyMaintenanceWindowStart() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link MwaaEnvironmentConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link MwaaEnvironmentConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<MwaaEnvironmentConfig> {
        java.lang.String dagS3Path;
        java.lang.String executionRoleArn;
        java.lang.String name;
        imports.aws.mwaa_environment.MwaaEnvironmentNetworkConfiguration networkConfiguration;
        java.lang.String sourceBucketArn;
        java.util.Map<java.lang.String, java.lang.String> airflowConfigurationOptions;
        java.lang.String airflowVersion;
        java.lang.String endpointManagement;
        java.lang.String environmentClass;
        java.lang.String id;
        java.lang.String kmsKey;
        imports.aws.mwaa_environment.MwaaEnvironmentLoggingConfiguration loggingConfiguration;
        java.lang.Number maxWebservers;
        java.lang.Number maxWorkers;
        java.lang.Number minWebservers;
        java.lang.Number minWorkers;
        java.lang.String pluginsS3ObjectVersion;
        java.lang.String pluginsS3Path;
        java.lang.String requirementsS3ObjectVersion;
        java.lang.String requirementsS3Path;
        java.lang.Number schedulers;
        java.lang.String startupScriptS3ObjectVersion;
        java.lang.String startupScriptS3Path;
        java.util.Map<java.lang.String, java.lang.String> tags;
        java.util.Map<java.lang.String, java.lang.String> tagsAll;
        imports.aws.mwaa_environment.MwaaEnvironmentTimeouts timeouts;
        java.lang.String webserverAccessMode;
        java.lang.String weeklyMaintenanceWindowStart;
        java.lang.Object connection;
        java.lang.Object count;
        java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        com.hashicorp.cdktf.ITerraformIterator forEach;
        com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        com.hashicorp.cdktf.TerraformProvider provider;
        java.util.List<java.lang.Object> provisioners;

        /**
         * Sets the value of {@link MwaaEnvironmentConfig#getDagS3Path}
         * @param dagS3Path Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mwaa_environment#dag_s3_path MwaaEnvironment#dag_s3_path}. This parameter is required.
         * @return {@code this}
         */
        public Builder dagS3Path(java.lang.String dagS3Path) {
            this.dagS3Path = dagS3Path;
            return this;
        }

        /**
         * Sets the value of {@link MwaaEnvironmentConfig#getExecutionRoleArn}
         * @param executionRoleArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mwaa_environment#execution_role_arn MwaaEnvironment#execution_role_arn}. This parameter is required.
         * @return {@code this}
         */
        public Builder executionRoleArn(java.lang.String executionRoleArn) {
            this.executionRoleArn = executionRoleArn;
            return this;
        }

        /**
         * Sets the value of {@link MwaaEnvironmentConfig#getName}
         * @param name Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mwaa_environment#name MwaaEnvironment#name}. This parameter is required.
         * @return {@code this}
         */
        public Builder name(java.lang.String name) {
            this.name = name;
            return this;
        }

        /**
         * Sets the value of {@link MwaaEnvironmentConfig#getNetworkConfiguration}
         * @param networkConfiguration network_configuration block. This parameter is required.
         *                             Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mwaa_environment#network_configuration MwaaEnvironment#network_configuration}
         * @return {@code this}
         */
        public Builder networkConfiguration(imports.aws.mwaa_environment.MwaaEnvironmentNetworkConfiguration networkConfiguration) {
            this.networkConfiguration = networkConfiguration;
            return this;
        }

        /**
         * Sets the value of {@link MwaaEnvironmentConfig#getSourceBucketArn}
         * @param sourceBucketArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mwaa_environment#source_bucket_arn MwaaEnvironment#source_bucket_arn}. This parameter is required.
         * @return {@code this}
         */
        public Builder sourceBucketArn(java.lang.String sourceBucketArn) {
            this.sourceBucketArn = sourceBucketArn;
            return this;
        }

        /**
         * Sets the value of {@link MwaaEnvironmentConfig#getAirflowConfigurationOptions}
         * @param airflowConfigurationOptions Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mwaa_environment#airflow_configuration_options MwaaEnvironment#airflow_configuration_options}.
         * @return {@code this}
         */
        public Builder airflowConfigurationOptions(java.util.Map<java.lang.String, java.lang.String> airflowConfigurationOptions) {
            this.airflowConfigurationOptions = airflowConfigurationOptions;
            return this;
        }

        /**
         * Sets the value of {@link MwaaEnvironmentConfig#getAirflowVersion}
         * @param airflowVersion Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mwaa_environment#airflow_version MwaaEnvironment#airflow_version}.
         * @return {@code this}
         */
        public Builder airflowVersion(java.lang.String airflowVersion) {
            this.airflowVersion = airflowVersion;
            return this;
        }

        /**
         * Sets the value of {@link MwaaEnvironmentConfig#getEndpointManagement}
         * @param endpointManagement Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mwaa_environment#endpoint_management MwaaEnvironment#endpoint_management}.
         * @return {@code this}
         */
        public Builder endpointManagement(java.lang.String endpointManagement) {
            this.endpointManagement = endpointManagement;
            return this;
        }

        /**
         * Sets the value of {@link MwaaEnvironmentConfig#getEnvironmentClass}
         * @param environmentClass Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mwaa_environment#environment_class MwaaEnvironment#environment_class}.
         * @return {@code this}
         */
        public Builder environmentClass(java.lang.String environmentClass) {
            this.environmentClass = environmentClass;
            return this;
        }

        /**
         * Sets the value of {@link MwaaEnvironmentConfig#getId}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mwaa_environment#id MwaaEnvironment#id}.
         *           Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         *           If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * @return {@code this}
         */
        public Builder id(java.lang.String id) {
            this.id = id;
            return this;
        }

        /**
         * Sets the value of {@link MwaaEnvironmentConfig#getKmsKey}
         * @param kmsKey Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mwaa_environment#kms_key MwaaEnvironment#kms_key}.
         * @return {@code this}
         */
        public Builder kmsKey(java.lang.String kmsKey) {
            this.kmsKey = kmsKey;
            return this;
        }

        /**
         * Sets the value of {@link MwaaEnvironmentConfig#getLoggingConfiguration}
         * @param loggingConfiguration logging_configuration block.
         *                             Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mwaa_environment#logging_configuration MwaaEnvironment#logging_configuration}
         * @return {@code this}
         */
        public Builder loggingConfiguration(imports.aws.mwaa_environment.MwaaEnvironmentLoggingConfiguration loggingConfiguration) {
            this.loggingConfiguration = loggingConfiguration;
            return this;
        }

        /**
         * Sets the value of {@link MwaaEnvironmentConfig#getMaxWebservers}
         * @param maxWebservers Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mwaa_environment#max_webservers MwaaEnvironment#max_webservers}.
         * @return {@code this}
         */
        public Builder maxWebservers(java.lang.Number maxWebservers) {
            this.maxWebservers = maxWebservers;
            return this;
        }

        /**
         * Sets the value of {@link MwaaEnvironmentConfig#getMaxWorkers}
         * @param maxWorkers Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mwaa_environment#max_workers MwaaEnvironment#max_workers}.
         * @return {@code this}
         */
        public Builder maxWorkers(java.lang.Number maxWorkers) {
            this.maxWorkers = maxWorkers;
            return this;
        }

        /**
         * Sets the value of {@link MwaaEnvironmentConfig#getMinWebservers}
         * @param minWebservers Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mwaa_environment#min_webservers MwaaEnvironment#min_webservers}.
         * @return {@code this}
         */
        public Builder minWebservers(java.lang.Number minWebservers) {
            this.minWebservers = minWebservers;
            return this;
        }

        /**
         * Sets the value of {@link MwaaEnvironmentConfig#getMinWorkers}
         * @param minWorkers Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mwaa_environment#min_workers MwaaEnvironment#min_workers}.
         * @return {@code this}
         */
        public Builder minWorkers(java.lang.Number minWorkers) {
            this.minWorkers = minWorkers;
            return this;
        }

        /**
         * Sets the value of {@link MwaaEnvironmentConfig#getPluginsS3ObjectVersion}
         * @param pluginsS3ObjectVersion Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mwaa_environment#plugins_s3_object_version MwaaEnvironment#plugins_s3_object_version}.
         * @return {@code this}
         */
        public Builder pluginsS3ObjectVersion(java.lang.String pluginsS3ObjectVersion) {
            this.pluginsS3ObjectVersion = pluginsS3ObjectVersion;
            return this;
        }

        /**
         * Sets the value of {@link MwaaEnvironmentConfig#getPluginsS3Path}
         * @param pluginsS3Path Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mwaa_environment#plugins_s3_path MwaaEnvironment#plugins_s3_path}.
         * @return {@code this}
         */
        public Builder pluginsS3Path(java.lang.String pluginsS3Path) {
            this.pluginsS3Path = pluginsS3Path;
            return this;
        }

        /**
         * Sets the value of {@link MwaaEnvironmentConfig#getRequirementsS3ObjectVersion}
         * @param requirementsS3ObjectVersion Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mwaa_environment#requirements_s3_object_version MwaaEnvironment#requirements_s3_object_version}.
         * @return {@code this}
         */
        public Builder requirementsS3ObjectVersion(java.lang.String requirementsS3ObjectVersion) {
            this.requirementsS3ObjectVersion = requirementsS3ObjectVersion;
            return this;
        }

        /**
         * Sets the value of {@link MwaaEnvironmentConfig#getRequirementsS3Path}
         * @param requirementsS3Path Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mwaa_environment#requirements_s3_path MwaaEnvironment#requirements_s3_path}.
         * @return {@code this}
         */
        public Builder requirementsS3Path(java.lang.String requirementsS3Path) {
            this.requirementsS3Path = requirementsS3Path;
            return this;
        }

        /**
         * Sets the value of {@link MwaaEnvironmentConfig#getSchedulers}
         * @param schedulers Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mwaa_environment#schedulers MwaaEnvironment#schedulers}.
         * @return {@code this}
         */
        public Builder schedulers(java.lang.Number schedulers) {
            this.schedulers = schedulers;
            return this;
        }

        /**
         * Sets the value of {@link MwaaEnvironmentConfig#getStartupScriptS3ObjectVersion}
         * @param startupScriptS3ObjectVersion Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mwaa_environment#startup_script_s3_object_version MwaaEnvironment#startup_script_s3_object_version}.
         * @return {@code this}
         */
        public Builder startupScriptS3ObjectVersion(java.lang.String startupScriptS3ObjectVersion) {
            this.startupScriptS3ObjectVersion = startupScriptS3ObjectVersion;
            return this;
        }

        /**
         * Sets the value of {@link MwaaEnvironmentConfig#getStartupScriptS3Path}
         * @param startupScriptS3Path Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mwaa_environment#startup_script_s3_path MwaaEnvironment#startup_script_s3_path}.
         * @return {@code this}
         */
        public Builder startupScriptS3Path(java.lang.String startupScriptS3Path) {
            this.startupScriptS3Path = startupScriptS3Path;
            return this;
        }

        /**
         * Sets the value of {@link MwaaEnvironmentConfig#getTags}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mwaa_environment#tags MwaaEnvironment#tags}.
         * @return {@code this}
         */
        public Builder tags(java.util.Map<java.lang.String, java.lang.String> tags) {
            this.tags = tags;
            return this;
        }

        /**
         * Sets the value of {@link MwaaEnvironmentConfig#getTagsAll}
         * @param tagsAll Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mwaa_environment#tags_all MwaaEnvironment#tags_all}.
         * @return {@code this}
         */
        public Builder tagsAll(java.util.Map<java.lang.String, java.lang.String> tagsAll) {
            this.tagsAll = tagsAll;
            return this;
        }

        /**
         * Sets the value of {@link MwaaEnvironmentConfig#getTimeouts}
         * @param timeouts timeouts block.
         *                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mwaa_environment#timeouts MwaaEnvironment#timeouts}
         * @return {@code this}
         */
        public Builder timeouts(imports.aws.mwaa_environment.MwaaEnvironmentTimeouts timeouts) {
            this.timeouts = timeouts;
            return this;
        }

        /**
         * Sets the value of {@link MwaaEnvironmentConfig#getWebserverAccessMode}
         * @param webserverAccessMode Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mwaa_environment#webserver_access_mode MwaaEnvironment#webserver_access_mode}.
         * @return {@code this}
         */
        public Builder webserverAccessMode(java.lang.String webserverAccessMode) {
            this.webserverAccessMode = webserverAccessMode;
            return this;
        }

        /**
         * Sets the value of {@link MwaaEnvironmentConfig#getWeeklyMaintenanceWindowStart}
         * @param weeklyMaintenanceWindowStart Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mwaa_environment#weekly_maintenance_window_start MwaaEnvironment#weekly_maintenance_window_start}.
         * @return {@code this}
         */
        public Builder weeklyMaintenanceWindowStart(java.lang.String weeklyMaintenanceWindowStart) {
            this.weeklyMaintenanceWindowStart = weeklyMaintenanceWindowStart;
            return this;
        }

        /**
         * Sets the value of {@link MwaaEnvironmentConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link MwaaEnvironmentConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link MwaaEnvironmentConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link MwaaEnvironmentConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link MwaaEnvironmentConfig#getDependsOn}
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
         * Sets the value of {@link MwaaEnvironmentConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link MwaaEnvironmentConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link MwaaEnvironmentConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link MwaaEnvironmentConfig#getProvisioners}
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
         * @return a new instance of {@link MwaaEnvironmentConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public MwaaEnvironmentConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link MwaaEnvironmentConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements MwaaEnvironmentConfig {
        private final java.lang.String dagS3Path;
        private final java.lang.String executionRoleArn;
        private final java.lang.String name;
        private final imports.aws.mwaa_environment.MwaaEnvironmentNetworkConfiguration networkConfiguration;
        private final java.lang.String sourceBucketArn;
        private final java.util.Map<java.lang.String, java.lang.String> airflowConfigurationOptions;
        private final java.lang.String airflowVersion;
        private final java.lang.String endpointManagement;
        private final java.lang.String environmentClass;
        private final java.lang.String id;
        private final java.lang.String kmsKey;
        private final imports.aws.mwaa_environment.MwaaEnvironmentLoggingConfiguration loggingConfiguration;
        private final java.lang.Number maxWebservers;
        private final java.lang.Number maxWorkers;
        private final java.lang.Number minWebservers;
        private final java.lang.Number minWorkers;
        private final java.lang.String pluginsS3ObjectVersion;
        private final java.lang.String pluginsS3Path;
        private final java.lang.String requirementsS3ObjectVersion;
        private final java.lang.String requirementsS3Path;
        private final java.lang.Number schedulers;
        private final java.lang.String startupScriptS3ObjectVersion;
        private final java.lang.String startupScriptS3Path;
        private final java.util.Map<java.lang.String, java.lang.String> tags;
        private final java.util.Map<java.lang.String, java.lang.String> tagsAll;
        private final imports.aws.mwaa_environment.MwaaEnvironmentTimeouts timeouts;
        private final java.lang.String webserverAccessMode;
        private final java.lang.String weeklyMaintenanceWindowStart;
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
            this.dagS3Path = software.amazon.jsii.Kernel.get(this, "dagS3Path", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.executionRoleArn = software.amazon.jsii.Kernel.get(this, "executionRoleArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.name = software.amazon.jsii.Kernel.get(this, "name", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.networkConfiguration = software.amazon.jsii.Kernel.get(this, "networkConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.mwaa_environment.MwaaEnvironmentNetworkConfiguration.class));
            this.sourceBucketArn = software.amazon.jsii.Kernel.get(this, "sourceBucketArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.airflowConfigurationOptions = software.amazon.jsii.Kernel.get(this, "airflowConfigurationOptions", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.airflowVersion = software.amazon.jsii.Kernel.get(this, "airflowVersion", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.endpointManagement = software.amazon.jsii.Kernel.get(this, "endpointManagement", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.environmentClass = software.amazon.jsii.Kernel.get(this, "environmentClass", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.id = software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.kmsKey = software.amazon.jsii.Kernel.get(this, "kmsKey", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.loggingConfiguration = software.amazon.jsii.Kernel.get(this, "loggingConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.mwaa_environment.MwaaEnvironmentLoggingConfiguration.class));
            this.maxWebservers = software.amazon.jsii.Kernel.get(this, "maxWebservers", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.maxWorkers = software.amazon.jsii.Kernel.get(this, "maxWorkers", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.minWebservers = software.amazon.jsii.Kernel.get(this, "minWebservers", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.minWorkers = software.amazon.jsii.Kernel.get(this, "minWorkers", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.pluginsS3ObjectVersion = software.amazon.jsii.Kernel.get(this, "pluginsS3ObjectVersion", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.pluginsS3Path = software.amazon.jsii.Kernel.get(this, "pluginsS3Path", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.requirementsS3ObjectVersion = software.amazon.jsii.Kernel.get(this, "requirementsS3ObjectVersion", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.requirementsS3Path = software.amazon.jsii.Kernel.get(this, "requirementsS3Path", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.schedulers = software.amazon.jsii.Kernel.get(this, "schedulers", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.startupScriptS3ObjectVersion = software.amazon.jsii.Kernel.get(this, "startupScriptS3ObjectVersion", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.startupScriptS3Path = software.amazon.jsii.Kernel.get(this, "startupScriptS3Path", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.tags = software.amazon.jsii.Kernel.get(this, "tags", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.tagsAll = software.amazon.jsii.Kernel.get(this, "tagsAll", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.timeouts = software.amazon.jsii.Kernel.get(this, "timeouts", software.amazon.jsii.NativeType.forClass(imports.aws.mwaa_environment.MwaaEnvironmentTimeouts.class));
            this.webserverAccessMode = software.amazon.jsii.Kernel.get(this, "webserverAccessMode", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.weeklyMaintenanceWindowStart = software.amazon.jsii.Kernel.get(this, "weeklyMaintenanceWindowStart", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
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
            this.dagS3Path = java.util.Objects.requireNonNull(builder.dagS3Path, "dagS3Path is required");
            this.executionRoleArn = java.util.Objects.requireNonNull(builder.executionRoleArn, "executionRoleArn is required");
            this.name = java.util.Objects.requireNonNull(builder.name, "name is required");
            this.networkConfiguration = java.util.Objects.requireNonNull(builder.networkConfiguration, "networkConfiguration is required");
            this.sourceBucketArn = java.util.Objects.requireNonNull(builder.sourceBucketArn, "sourceBucketArn is required");
            this.airflowConfigurationOptions = builder.airflowConfigurationOptions;
            this.airflowVersion = builder.airflowVersion;
            this.endpointManagement = builder.endpointManagement;
            this.environmentClass = builder.environmentClass;
            this.id = builder.id;
            this.kmsKey = builder.kmsKey;
            this.loggingConfiguration = builder.loggingConfiguration;
            this.maxWebservers = builder.maxWebservers;
            this.maxWorkers = builder.maxWorkers;
            this.minWebservers = builder.minWebservers;
            this.minWorkers = builder.minWorkers;
            this.pluginsS3ObjectVersion = builder.pluginsS3ObjectVersion;
            this.pluginsS3Path = builder.pluginsS3Path;
            this.requirementsS3ObjectVersion = builder.requirementsS3ObjectVersion;
            this.requirementsS3Path = builder.requirementsS3Path;
            this.schedulers = builder.schedulers;
            this.startupScriptS3ObjectVersion = builder.startupScriptS3ObjectVersion;
            this.startupScriptS3Path = builder.startupScriptS3Path;
            this.tags = builder.tags;
            this.tagsAll = builder.tagsAll;
            this.timeouts = builder.timeouts;
            this.webserverAccessMode = builder.webserverAccessMode;
            this.weeklyMaintenanceWindowStart = builder.weeklyMaintenanceWindowStart;
            this.connection = builder.connection;
            this.count = builder.count;
            this.dependsOn = (java.util.List<com.hashicorp.cdktf.ITerraformDependable>)builder.dependsOn;
            this.forEach = builder.forEach;
            this.lifecycle = builder.lifecycle;
            this.provider = builder.provider;
            this.provisioners = (java.util.List<java.lang.Object>)builder.provisioners;
        }

        @Override
        public final java.lang.String getDagS3Path() {
            return this.dagS3Path;
        }

        @Override
        public final java.lang.String getExecutionRoleArn() {
            return this.executionRoleArn;
        }

        @Override
        public final java.lang.String getName() {
            return this.name;
        }

        @Override
        public final imports.aws.mwaa_environment.MwaaEnvironmentNetworkConfiguration getNetworkConfiguration() {
            return this.networkConfiguration;
        }

        @Override
        public final java.lang.String getSourceBucketArn() {
            return this.sourceBucketArn;
        }

        @Override
        public final java.util.Map<java.lang.String, java.lang.String> getAirflowConfigurationOptions() {
            return this.airflowConfigurationOptions;
        }

        @Override
        public final java.lang.String getAirflowVersion() {
            return this.airflowVersion;
        }

        @Override
        public final java.lang.String getEndpointManagement() {
            return this.endpointManagement;
        }

        @Override
        public final java.lang.String getEnvironmentClass() {
            return this.environmentClass;
        }

        @Override
        public final java.lang.String getId() {
            return this.id;
        }

        @Override
        public final java.lang.String getKmsKey() {
            return this.kmsKey;
        }

        @Override
        public final imports.aws.mwaa_environment.MwaaEnvironmentLoggingConfiguration getLoggingConfiguration() {
            return this.loggingConfiguration;
        }

        @Override
        public final java.lang.Number getMaxWebservers() {
            return this.maxWebservers;
        }

        @Override
        public final java.lang.Number getMaxWorkers() {
            return this.maxWorkers;
        }

        @Override
        public final java.lang.Number getMinWebservers() {
            return this.minWebservers;
        }

        @Override
        public final java.lang.Number getMinWorkers() {
            return this.minWorkers;
        }

        @Override
        public final java.lang.String getPluginsS3ObjectVersion() {
            return this.pluginsS3ObjectVersion;
        }

        @Override
        public final java.lang.String getPluginsS3Path() {
            return this.pluginsS3Path;
        }

        @Override
        public final java.lang.String getRequirementsS3ObjectVersion() {
            return this.requirementsS3ObjectVersion;
        }

        @Override
        public final java.lang.String getRequirementsS3Path() {
            return this.requirementsS3Path;
        }

        @Override
        public final java.lang.Number getSchedulers() {
            return this.schedulers;
        }

        @Override
        public final java.lang.String getStartupScriptS3ObjectVersion() {
            return this.startupScriptS3ObjectVersion;
        }

        @Override
        public final java.lang.String getStartupScriptS3Path() {
            return this.startupScriptS3Path;
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
        public final imports.aws.mwaa_environment.MwaaEnvironmentTimeouts getTimeouts() {
            return this.timeouts;
        }

        @Override
        public final java.lang.String getWebserverAccessMode() {
            return this.webserverAccessMode;
        }

        @Override
        public final java.lang.String getWeeklyMaintenanceWindowStart() {
            return this.weeklyMaintenanceWindowStart;
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

            data.set("dagS3Path", om.valueToTree(this.getDagS3Path()));
            data.set("executionRoleArn", om.valueToTree(this.getExecutionRoleArn()));
            data.set("name", om.valueToTree(this.getName()));
            data.set("networkConfiguration", om.valueToTree(this.getNetworkConfiguration()));
            data.set("sourceBucketArn", om.valueToTree(this.getSourceBucketArn()));
            if (this.getAirflowConfigurationOptions() != null) {
                data.set("airflowConfigurationOptions", om.valueToTree(this.getAirflowConfigurationOptions()));
            }
            if (this.getAirflowVersion() != null) {
                data.set("airflowVersion", om.valueToTree(this.getAirflowVersion()));
            }
            if (this.getEndpointManagement() != null) {
                data.set("endpointManagement", om.valueToTree(this.getEndpointManagement()));
            }
            if (this.getEnvironmentClass() != null) {
                data.set("environmentClass", om.valueToTree(this.getEnvironmentClass()));
            }
            if (this.getId() != null) {
                data.set("id", om.valueToTree(this.getId()));
            }
            if (this.getKmsKey() != null) {
                data.set("kmsKey", om.valueToTree(this.getKmsKey()));
            }
            if (this.getLoggingConfiguration() != null) {
                data.set("loggingConfiguration", om.valueToTree(this.getLoggingConfiguration()));
            }
            if (this.getMaxWebservers() != null) {
                data.set("maxWebservers", om.valueToTree(this.getMaxWebservers()));
            }
            if (this.getMaxWorkers() != null) {
                data.set("maxWorkers", om.valueToTree(this.getMaxWorkers()));
            }
            if (this.getMinWebservers() != null) {
                data.set("minWebservers", om.valueToTree(this.getMinWebservers()));
            }
            if (this.getMinWorkers() != null) {
                data.set("minWorkers", om.valueToTree(this.getMinWorkers()));
            }
            if (this.getPluginsS3ObjectVersion() != null) {
                data.set("pluginsS3ObjectVersion", om.valueToTree(this.getPluginsS3ObjectVersion()));
            }
            if (this.getPluginsS3Path() != null) {
                data.set("pluginsS3Path", om.valueToTree(this.getPluginsS3Path()));
            }
            if (this.getRequirementsS3ObjectVersion() != null) {
                data.set("requirementsS3ObjectVersion", om.valueToTree(this.getRequirementsS3ObjectVersion()));
            }
            if (this.getRequirementsS3Path() != null) {
                data.set("requirementsS3Path", om.valueToTree(this.getRequirementsS3Path()));
            }
            if (this.getSchedulers() != null) {
                data.set("schedulers", om.valueToTree(this.getSchedulers()));
            }
            if (this.getStartupScriptS3ObjectVersion() != null) {
                data.set("startupScriptS3ObjectVersion", om.valueToTree(this.getStartupScriptS3ObjectVersion()));
            }
            if (this.getStartupScriptS3Path() != null) {
                data.set("startupScriptS3Path", om.valueToTree(this.getStartupScriptS3Path()));
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
            if (this.getWebserverAccessMode() != null) {
                data.set("webserverAccessMode", om.valueToTree(this.getWebserverAccessMode()));
            }
            if (this.getWeeklyMaintenanceWindowStart() != null) {
                data.set("weeklyMaintenanceWindowStart", om.valueToTree(this.getWeeklyMaintenanceWindowStart()));
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
            struct.set("fqn", om.valueToTree("aws.mwaaEnvironment.MwaaEnvironmentConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            MwaaEnvironmentConfig.Jsii$Proxy that = (MwaaEnvironmentConfig.Jsii$Proxy) o;

            if (!dagS3Path.equals(that.dagS3Path)) return false;
            if (!executionRoleArn.equals(that.executionRoleArn)) return false;
            if (!name.equals(that.name)) return false;
            if (!networkConfiguration.equals(that.networkConfiguration)) return false;
            if (!sourceBucketArn.equals(that.sourceBucketArn)) return false;
            if (this.airflowConfigurationOptions != null ? !this.airflowConfigurationOptions.equals(that.airflowConfigurationOptions) : that.airflowConfigurationOptions != null) return false;
            if (this.airflowVersion != null ? !this.airflowVersion.equals(that.airflowVersion) : that.airflowVersion != null) return false;
            if (this.endpointManagement != null ? !this.endpointManagement.equals(that.endpointManagement) : that.endpointManagement != null) return false;
            if (this.environmentClass != null ? !this.environmentClass.equals(that.environmentClass) : that.environmentClass != null) return false;
            if (this.id != null ? !this.id.equals(that.id) : that.id != null) return false;
            if (this.kmsKey != null ? !this.kmsKey.equals(that.kmsKey) : that.kmsKey != null) return false;
            if (this.loggingConfiguration != null ? !this.loggingConfiguration.equals(that.loggingConfiguration) : that.loggingConfiguration != null) return false;
            if (this.maxWebservers != null ? !this.maxWebservers.equals(that.maxWebservers) : that.maxWebservers != null) return false;
            if (this.maxWorkers != null ? !this.maxWorkers.equals(that.maxWorkers) : that.maxWorkers != null) return false;
            if (this.minWebservers != null ? !this.minWebservers.equals(that.minWebservers) : that.minWebservers != null) return false;
            if (this.minWorkers != null ? !this.minWorkers.equals(that.minWorkers) : that.minWorkers != null) return false;
            if (this.pluginsS3ObjectVersion != null ? !this.pluginsS3ObjectVersion.equals(that.pluginsS3ObjectVersion) : that.pluginsS3ObjectVersion != null) return false;
            if (this.pluginsS3Path != null ? !this.pluginsS3Path.equals(that.pluginsS3Path) : that.pluginsS3Path != null) return false;
            if (this.requirementsS3ObjectVersion != null ? !this.requirementsS3ObjectVersion.equals(that.requirementsS3ObjectVersion) : that.requirementsS3ObjectVersion != null) return false;
            if (this.requirementsS3Path != null ? !this.requirementsS3Path.equals(that.requirementsS3Path) : that.requirementsS3Path != null) return false;
            if (this.schedulers != null ? !this.schedulers.equals(that.schedulers) : that.schedulers != null) return false;
            if (this.startupScriptS3ObjectVersion != null ? !this.startupScriptS3ObjectVersion.equals(that.startupScriptS3ObjectVersion) : that.startupScriptS3ObjectVersion != null) return false;
            if (this.startupScriptS3Path != null ? !this.startupScriptS3Path.equals(that.startupScriptS3Path) : that.startupScriptS3Path != null) return false;
            if (this.tags != null ? !this.tags.equals(that.tags) : that.tags != null) return false;
            if (this.tagsAll != null ? !this.tagsAll.equals(that.tagsAll) : that.tagsAll != null) return false;
            if (this.timeouts != null ? !this.timeouts.equals(that.timeouts) : that.timeouts != null) return false;
            if (this.webserverAccessMode != null ? !this.webserverAccessMode.equals(that.webserverAccessMode) : that.webserverAccessMode != null) return false;
            if (this.weeklyMaintenanceWindowStart != null ? !this.weeklyMaintenanceWindowStart.equals(that.weeklyMaintenanceWindowStart) : that.weeklyMaintenanceWindowStart != null) return false;
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
            int result = this.dagS3Path.hashCode();
            result = 31 * result + (this.executionRoleArn.hashCode());
            result = 31 * result + (this.name.hashCode());
            result = 31 * result + (this.networkConfiguration.hashCode());
            result = 31 * result + (this.sourceBucketArn.hashCode());
            result = 31 * result + (this.airflowConfigurationOptions != null ? this.airflowConfigurationOptions.hashCode() : 0);
            result = 31 * result + (this.airflowVersion != null ? this.airflowVersion.hashCode() : 0);
            result = 31 * result + (this.endpointManagement != null ? this.endpointManagement.hashCode() : 0);
            result = 31 * result + (this.environmentClass != null ? this.environmentClass.hashCode() : 0);
            result = 31 * result + (this.id != null ? this.id.hashCode() : 0);
            result = 31 * result + (this.kmsKey != null ? this.kmsKey.hashCode() : 0);
            result = 31 * result + (this.loggingConfiguration != null ? this.loggingConfiguration.hashCode() : 0);
            result = 31 * result + (this.maxWebservers != null ? this.maxWebservers.hashCode() : 0);
            result = 31 * result + (this.maxWorkers != null ? this.maxWorkers.hashCode() : 0);
            result = 31 * result + (this.minWebservers != null ? this.minWebservers.hashCode() : 0);
            result = 31 * result + (this.minWorkers != null ? this.minWorkers.hashCode() : 0);
            result = 31 * result + (this.pluginsS3ObjectVersion != null ? this.pluginsS3ObjectVersion.hashCode() : 0);
            result = 31 * result + (this.pluginsS3Path != null ? this.pluginsS3Path.hashCode() : 0);
            result = 31 * result + (this.requirementsS3ObjectVersion != null ? this.requirementsS3ObjectVersion.hashCode() : 0);
            result = 31 * result + (this.requirementsS3Path != null ? this.requirementsS3Path.hashCode() : 0);
            result = 31 * result + (this.schedulers != null ? this.schedulers.hashCode() : 0);
            result = 31 * result + (this.startupScriptS3ObjectVersion != null ? this.startupScriptS3ObjectVersion.hashCode() : 0);
            result = 31 * result + (this.startupScriptS3Path != null ? this.startupScriptS3Path.hashCode() : 0);
            result = 31 * result + (this.tags != null ? this.tags.hashCode() : 0);
            result = 31 * result + (this.tagsAll != null ? this.tagsAll.hashCode() : 0);
            result = 31 * result + (this.timeouts != null ? this.timeouts.hashCode() : 0);
            result = 31 * result + (this.webserverAccessMode != null ? this.webserverAccessMode.hashCode() : 0);
            result = 31 * result + (this.weeklyMaintenanceWindowStart != null ? this.weeklyMaintenanceWindowStart.hashCode() : 0);
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
