package imports.aws.finspace_kx_cluster;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.217Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.finspaceKxCluster.FinspaceKxClusterConfig")
@software.amazon.jsii.Jsii.Proxy(FinspaceKxClusterConfig.Jsii$Proxy.class)
public interface FinspaceKxClusterConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_cluster#az_mode FinspaceKxCluster#az_mode}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getAzMode();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_cluster#environment_id FinspaceKxCluster#environment_id}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getEnvironmentId();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_cluster#name FinspaceKxCluster#name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getName();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_cluster#release_label FinspaceKxCluster#release_label}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getReleaseLabel();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_cluster#type FinspaceKxCluster#type}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getType();

    /**
     * vpc_configuration block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_cluster#vpc_configuration FinspaceKxCluster#vpc_configuration}
     */
    @org.jetbrains.annotations.NotNull imports.aws.finspace_kx_cluster.FinspaceKxClusterVpcConfiguration getVpcConfiguration();

    /**
     * auto_scaling_configuration block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_cluster#auto_scaling_configuration FinspaceKxCluster#auto_scaling_configuration}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.finspace_kx_cluster.FinspaceKxClusterAutoScalingConfiguration getAutoScalingConfiguration() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_cluster#availability_zone_id FinspaceKxCluster#availability_zone_id}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getAvailabilityZoneId() {
        return null;
    }

    /**
     * cache_storage_configurations block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_cluster#cache_storage_configurations FinspaceKxCluster#cache_storage_configurations}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getCacheStorageConfigurations() {
        return null;
    }

    /**
     * capacity_configuration block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_cluster#capacity_configuration FinspaceKxCluster#capacity_configuration}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.finspace_kx_cluster.FinspaceKxClusterCapacityConfiguration getCapacityConfiguration() {
        return null;
    }

    /**
     * code block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_cluster#code FinspaceKxCluster#code}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.finspace_kx_cluster.FinspaceKxClusterCode getCode() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_cluster#command_line_arguments FinspaceKxCluster#command_line_arguments}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getCommandLineArguments() {
        return null;
    }

    /**
     * database block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_cluster#database FinspaceKxCluster#database}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getDatabase() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_cluster#description FinspaceKxCluster#description}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDescription() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_cluster#execution_role FinspaceKxCluster#execution_role}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getExecutionRole() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_cluster#id FinspaceKxCluster#id}.
     * <p>
     * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
     * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_cluster#initialization_script FinspaceKxCluster#initialization_script}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getInitializationScript() {
        return null;
    }

    /**
     * savedown_storage_configuration block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_cluster#savedown_storage_configuration FinspaceKxCluster#savedown_storage_configuration}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.finspace_kx_cluster.FinspaceKxClusterSavedownStorageConfiguration getSavedownStorageConfiguration() {
        return null;
    }

    /**
     * scaling_group_configuration block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_cluster#scaling_group_configuration FinspaceKxCluster#scaling_group_configuration}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.finspace_kx_cluster.FinspaceKxClusterScalingGroupConfiguration getScalingGroupConfiguration() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_cluster#tags FinspaceKxCluster#tags}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTags() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_cluster#tags_all FinspaceKxCluster#tags_all}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsAll() {
        return null;
    }

    /**
     * tickerplant_log_configuration block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_cluster#tickerplant_log_configuration FinspaceKxCluster#tickerplant_log_configuration}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getTickerplantLogConfiguration() {
        return null;
    }

    /**
     * timeouts block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_cluster#timeouts FinspaceKxCluster#timeouts}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.finspace_kx_cluster.FinspaceKxClusterTimeouts getTimeouts() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link FinspaceKxClusterConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link FinspaceKxClusterConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<FinspaceKxClusterConfig> {
        java.lang.String azMode;
        java.lang.String environmentId;
        java.lang.String name;
        java.lang.String releaseLabel;
        java.lang.String type;
        imports.aws.finspace_kx_cluster.FinspaceKxClusterVpcConfiguration vpcConfiguration;
        imports.aws.finspace_kx_cluster.FinspaceKxClusterAutoScalingConfiguration autoScalingConfiguration;
        java.lang.String availabilityZoneId;
        java.lang.Object cacheStorageConfigurations;
        imports.aws.finspace_kx_cluster.FinspaceKxClusterCapacityConfiguration capacityConfiguration;
        imports.aws.finspace_kx_cluster.FinspaceKxClusterCode code;
        java.util.Map<java.lang.String, java.lang.String> commandLineArguments;
        java.lang.Object database;
        java.lang.String description;
        java.lang.String executionRole;
        java.lang.String id;
        java.lang.String initializationScript;
        imports.aws.finspace_kx_cluster.FinspaceKxClusterSavedownStorageConfiguration savedownStorageConfiguration;
        imports.aws.finspace_kx_cluster.FinspaceKxClusterScalingGroupConfiguration scalingGroupConfiguration;
        java.util.Map<java.lang.String, java.lang.String> tags;
        java.util.Map<java.lang.String, java.lang.String> tagsAll;
        java.lang.Object tickerplantLogConfiguration;
        imports.aws.finspace_kx_cluster.FinspaceKxClusterTimeouts timeouts;
        java.lang.Object connection;
        java.lang.Object count;
        java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        com.hashicorp.cdktf.ITerraformIterator forEach;
        com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        com.hashicorp.cdktf.TerraformProvider provider;
        java.util.List<java.lang.Object> provisioners;

        /**
         * Sets the value of {@link FinspaceKxClusterConfig#getAzMode}
         * @param azMode Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_cluster#az_mode FinspaceKxCluster#az_mode}. This parameter is required.
         * @return {@code this}
         */
        public Builder azMode(java.lang.String azMode) {
            this.azMode = azMode;
            return this;
        }

        /**
         * Sets the value of {@link FinspaceKxClusterConfig#getEnvironmentId}
         * @param environmentId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_cluster#environment_id FinspaceKxCluster#environment_id}. This parameter is required.
         * @return {@code this}
         */
        public Builder environmentId(java.lang.String environmentId) {
            this.environmentId = environmentId;
            return this;
        }

        /**
         * Sets the value of {@link FinspaceKxClusterConfig#getName}
         * @param name Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_cluster#name FinspaceKxCluster#name}. This parameter is required.
         * @return {@code this}
         */
        public Builder name(java.lang.String name) {
            this.name = name;
            return this;
        }

        /**
         * Sets the value of {@link FinspaceKxClusterConfig#getReleaseLabel}
         * @param releaseLabel Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_cluster#release_label FinspaceKxCluster#release_label}. This parameter is required.
         * @return {@code this}
         */
        public Builder releaseLabel(java.lang.String releaseLabel) {
            this.releaseLabel = releaseLabel;
            return this;
        }

        /**
         * Sets the value of {@link FinspaceKxClusterConfig#getType}
         * @param type Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_cluster#type FinspaceKxCluster#type}. This parameter is required.
         * @return {@code this}
         */
        public Builder type(java.lang.String type) {
            this.type = type;
            return this;
        }

        /**
         * Sets the value of {@link FinspaceKxClusterConfig#getVpcConfiguration}
         * @param vpcConfiguration vpc_configuration block. This parameter is required.
         *                         Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_cluster#vpc_configuration FinspaceKxCluster#vpc_configuration}
         * @return {@code this}
         */
        public Builder vpcConfiguration(imports.aws.finspace_kx_cluster.FinspaceKxClusterVpcConfiguration vpcConfiguration) {
            this.vpcConfiguration = vpcConfiguration;
            return this;
        }

        /**
         * Sets the value of {@link FinspaceKxClusterConfig#getAutoScalingConfiguration}
         * @param autoScalingConfiguration auto_scaling_configuration block.
         *                                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_cluster#auto_scaling_configuration FinspaceKxCluster#auto_scaling_configuration}
         * @return {@code this}
         */
        public Builder autoScalingConfiguration(imports.aws.finspace_kx_cluster.FinspaceKxClusterAutoScalingConfiguration autoScalingConfiguration) {
            this.autoScalingConfiguration = autoScalingConfiguration;
            return this;
        }

        /**
         * Sets the value of {@link FinspaceKxClusterConfig#getAvailabilityZoneId}
         * @param availabilityZoneId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_cluster#availability_zone_id FinspaceKxCluster#availability_zone_id}.
         * @return {@code this}
         */
        public Builder availabilityZoneId(java.lang.String availabilityZoneId) {
            this.availabilityZoneId = availabilityZoneId;
            return this;
        }

        /**
         * Sets the value of {@link FinspaceKxClusterConfig#getCacheStorageConfigurations}
         * @param cacheStorageConfigurations cache_storage_configurations block.
         *                                   Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_cluster#cache_storage_configurations FinspaceKxCluster#cache_storage_configurations}
         * @return {@code this}
         */
        public Builder cacheStorageConfigurations(com.hashicorp.cdktf.IResolvable cacheStorageConfigurations) {
            this.cacheStorageConfigurations = cacheStorageConfigurations;
            return this;
        }

        /**
         * Sets the value of {@link FinspaceKxClusterConfig#getCacheStorageConfigurations}
         * @param cacheStorageConfigurations cache_storage_configurations block.
         *                                   Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_cluster#cache_storage_configurations FinspaceKxCluster#cache_storage_configurations}
         * @return {@code this}
         */
        public Builder cacheStorageConfigurations(java.util.List<? extends imports.aws.finspace_kx_cluster.FinspaceKxClusterCacheStorageConfigurations> cacheStorageConfigurations) {
            this.cacheStorageConfigurations = cacheStorageConfigurations;
            return this;
        }

        /**
         * Sets the value of {@link FinspaceKxClusterConfig#getCapacityConfiguration}
         * @param capacityConfiguration capacity_configuration block.
         *                              Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_cluster#capacity_configuration FinspaceKxCluster#capacity_configuration}
         * @return {@code this}
         */
        public Builder capacityConfiguration(imports.aws.finspace_kx_cluster.FinspaceKxClusterCapacityConfiguration capacityConfiguration) {
            this.capacityConfiguration = capacityConfiguration;
            return this;
        }

        /**
         * Sets the value of {@link FinspaceKxClusterConfig#getCode}
         * @param code code block.
         *             Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_cluster#code FinspaceKxCluster#code}
         * @return {@code this}
         */
        public Builder code(imports.aws.finspace_kx_cluster.FinspaceKxClusterCode code) {
            this.code = code;
            return this;
        }

        /**
         * Sets the value of {@link FinspaceKxClusterConfig#getCommandLineArguments}
         * @param commandLineArguments Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_cluster#command_line_arguments FinspaceKxCluster#command_line_arguments}.
         * @return {@code this}
         */
        public Builder commandLineArguments(java.util.Map<java.lang.String, java.lang.String> commandLineArguments) {
            this.commandLineArguments = commandLineArguments;
            return this;
        }

        /**
         * Sets the value of {@link FinspaceKxClusterConfig#getDatabase}
         * @param database database block.
         *                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_cluster#database FinspaceKxCluster#database}
         * @return {@code this}
         */
        public Builder database(com.hashicorp.cdktf.IResolvable database) {
            this.database = database;
            return this;
        }

        /**
         * Sets the value of {@link FinspaceKxClusterConfig#getDatabase}
         * @param database database block.
         *                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_cluster#database FinspaceKxCluster#database}
         * @return {@code this}
         */
        public Builder database(java.util.List<? extends imports.aws.finspace_kx_cluster.FinspaceKxClusterDatabase> database) {
            this.database = database;
            return this;
        }

        /**
         * Sets the value of {@link FinspaceKxClusterConfig#getDescription}
         * @param description Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_cluster#description FinspaceKxCluster#description}.
         * @return {@code this}
         */
        public Builder description(java.lang.String description) {
            this.description = description;
            return this;
        }

        /**
         * Sets the value of {@link FinspaceKxClusterConfig#getExecutionRole}
         * @param executionRole Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_cluster#execution_role FinspaceKxCluster#execution_role}.
         * @return {@code this}
         */
        public Builder executionRole(java.lang.String executionRole) {
            this.executionRole = executionRole;
            return this;
        }

        /**
         * Sets the value of {@link FinspaceKxClusterConfig#getId}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_cluster#id FinspaceKxCluster#id}.
         *           Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         *           If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * @return {@code this}
         */
        public Builder id(java.lang.String id) {
            this.id = id;
            return this;
        }

        /**
         * Sets the value of {@link FinspaceKxClusterConfig#getInitializationScript}
         * @param initializationScript Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_cluster#initialization_script FinspaceKxCluster#initialization_script}.
         * @return {@code this}
         */
        public Builder initializationScript(java.lang.String initializationScript) {
            this.initializationScript = initializationScript;
            return this;
        }

        /**
         * Sets the value of {@link FinspaceKxClusterConfig#getSavedownStorageConfiguration}
         * @param savedownStorageConfiguration savedown_storage_configuration block.
         *                                     Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_cluster#savedown_storage_configuration FinspaceKxCluster#savedown_storage_configuration}
         * @return {@code this}
         */
        public Builder savedownStorageConfiguration(imports.aws.finspace_kx_cluster.FinspaceKxClusterSavedownStorageConfiguration savedownStorageConfiguration) {
            this.savedownStorageConfiguration = savedownStorageConfiguration;
            return this;
        }

        /**
         * Sets the value of {@link FinspaceKxClusterConfig#getScalingGroupConfiguration}
         * @param scalingGroupConfiguration scaling_group_configuration block.
         *                                  Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_cluster#scaling_group_configuration FinspaceKxCluster#scaling_group_configuration}
         * @return {@code this}
         */
        public Builder scalingGroupConfiguration(imports.aws.finspace_kx_cluster.FinspaceKxClusterScalingGroupConfiguration scalingGroupConfiguration) {
            this.scalingGroupConfiguration = scalingGroupConfiguration;
            return this;
        }

        /**
         * Sets the value of {@link FinspaceKxClusterConfig#getTags}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_cluster#tags FinspaceKxCluster#tags}.
         * @return {@code this}
         */
        public Builder tags(java.util.Map<java.lang.String, java.lang.String> tags) {
            this.tags = tags;
            return this;
        }

        /**
         * Sets the value of {@link FinspaceKxClusterConfig#getTagsAll}
         * @param tagsAll Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_cluster#tags_all FinspaceKxCluster#tags_all}.
         * @return {@code this}
         */
        public Builder tagsAll(java.util.Map<java.lang.String, java.lang.String> tagsAll) {
            this.tagsAll = tagsAll;
            return this;
        }

        /**
         * Sets the value of {@link FinspaceKxClusterConfig#getTickerplantLogConfiguration}
         * @param tickerplantLogConfiguration tickerplant_log_configuration block.
         *                                    Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_cluster#tickerplant_log_configuration FinspaceKxCluster#tickerplant_log_configuration}
         * @return {@code this}
         */
        public Builder tickerplantLogConfiguration(com.hashicorp.cdktf.IResolvable tickerplantLogConfiguration) {
            this.tickerplantLogConfiguration = tickerplantLogConfiguration;
            return this;
        }

        /**
         * Sets the value of {@link FinspaceKxClusterConfig#getTickerplantLogConfiguration}
         * @param tickerplantLogConfiguration tickerplant_log_configuration block.
         *                                    Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_cluster#tickerplant_log_configuration FinspaceKxCluster#tickerplant_log_configuration}
         * @return {@code this}
         */
        public Builder tickerplantLogConfiguration(java.util.List<? extends imports.aws.finspace_kx_cluster.FinspaceKxClusterTickerplantLogConfiguration> tickerplantLogConfiguration) {
            this.tickerplantLogConfiguration = tickerplantLogConfiguration;
            return this;
        }

        /**
         * Sets the value of {@link FinspaceKxClusterConfig#getTimeouts}
         * @param timeouts timeouts block.
         *                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/finspace_kx_cluster#timeouts FinspaceKxCluster#timeouts}
         * @return {@code this}
         */
        public Builder timeouts(imports.aws.finspace_kx_cluster.FinspaceKxClusterTimeouts timeouts) {
            this.timeouts = timeouts;
            return this;
        }

        /**
         * Sets the value of {@link FinspaceKxClusterConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link FinspaceKxClusterConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link FinspaceKxClusterConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link FinspaceKxClusterConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link FinspaceKxClusterConfig#getDependsOn}
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
         * Sets the value of {@link FinspaceKxClusterConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link FinspaceKxClusterConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link FinspaceKxClusterConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link FinspaceKxClusterConfig#getProvisioners}
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
         * @return a new instance of {@link FinspaceKxClusterConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public FinspaceKxClusterConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link FinspaceKxClusterConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements FinspaceKxClusterConfig {
        private final java.lang.String azMode;
        private final java.lang.String environmentId;
        private final java.lang.String name;
        private final java.lang.String releaseLabel;
        private final java.lang.String type;
        private final imports.aws.finspace_kx_cluster.FinspaceKxClusterVpcConfiguration vpcConfiguration;
        private final imports.aws.finspace_kx_cluster.FinspaceKxClusterAutoScalingConfiguration autoScalingConfiguration;
        private final java.lang.String availabilityZoneId;
        private final java.lang.Object cacheStorageConfigurations;
        private final imports.aws.finspace_kx_cluster.FinspaceKxClusterCapacityConfiguration capacityConfiguration;
        private final imports.aws.finspace_kx_cluster.FinspaceKxClusterCode code;
        private final java.util.Map<java.lang.String, java.lang.String> commandLineArguments;
        private final java.lang.Object database;
        private final java.lang.String description;
        private final java.lang.String executionRole;
        private final java.lang.String id;
        private final java.lang.String initializationScript;
        private final imports.aws.finspace_kx_cluster.FinspaceKxClusterSavedownStorageConfiguration savedownStorageConfiguration;
        private final imports.aws.finspace_kx_cluster.FinspaceKxClusterScalingGroupConfiguration scalingGroupConfiguration;
        private final java.util.Map<java.lang.String, java.lang.String> tags;
        private final java.util.Map<java.lang.String, java.lang.String> tagsAll;
        private final java.lang.Object tickerplantLogConfiguration;
        private final imports.aws.finspace_kx_cluster.FinspaceKxClusterTimeouts timeouts;
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
            this.azMode = software.amazon.jsii.Kernel.get(this, "azMode", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.environmentId = software.amazon.jsii.Kernel.get(this, "environmentId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.name = software.amazon.jsii.Kernel.get(this, "name", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.releaseLabel = software.amazon.jsii.Kernel.get(this, "releaseLabel", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.type = software.amazon.jsii.Kernel.get(this, "type", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.vpcConfiguration = software.amazon.jsii.Kernel.get(this, "vpcConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.finspace_kx_cluster.FinspaceKxClusterVpcConfiguration.class));
            this.autoScalingConfiguration = software.amazon.jsii.Kernel.get(this, "autoScalingConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.finspace_kx_cluster.FinspaceKxClusterAutoScalingConfiguration.class));
            this.availabilityZoneId = software.amazon.jsii.Kernel.get(this, "availabilityZoneId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.cacheStorageConfigurations = software.amazon.jsii.Kernel.get(this, "cacheStorageConfigurations", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.capacityConfiguration = software.amazon.jsii.Kernel.get(this, "capacityConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.finspace_kx_cluster.FinspaceKxClusterCapacityConfiguration.class));
            this.code = software.amazon.jsii.Kernel.get(this, "code", software.amazon.jsii.NativeType.forClass(imports.aws.finspace_kx_cluster.FinspaceKxClusterCode.class));
            this.commandLineArguments = software.amazon.jsii.Kernel.get(this, "commandLineArguments", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.database = software.amazon.jsii.Kernel.get(this, "database", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.description = software.amazon.jsii.Kernel.get(this, "description", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.executionRole = software.amazon.jsii.Kernel.get(this, "executionRole", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.id = software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.initializationScript = software.amazon.jsii.Kernel.get(this, "initializationScript", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.savedownStorageConfiguration = software.amazon.jsii.Kernel.get(this, "savedownStorageConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.finspace_kx_cluster.FinspaceKxClusterSavedownStorageConfiguration.class));
            this.scalingGroupConfiguration = software.amazon.jsii.Kernel.get(this, "scalingGroupConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.finspace_kx_cluster.FinspaceKxClusterScalingGroupConfiguration.class));
            this.tags = software.amazon.jsii.Kernel.get(this, "tags", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.tagsAll = software.amazon.jsii.Kernel.get(this, "tagsAll", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.tickerplantLogConfiguration = software.amazon.jsii.Kernel.get(this, "tickerplantLogConfiguration", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.timeouts = software.amazon.jsii.Kernel.get(this, "timeouts", software.amazon.jsii.NativeType.forClass(imports.aws.finspace_kx_cluster.FinspaceKxClusterTimeouts.class));
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
            this.azMode = java.util.Objects.requireNonNull(builder.azMode, "azMode is required");
            this.environmentId = java.util.Objects.requireNonNull(builder.environmentId, "environmentId is required");
            this.name = java.util.Objects.requireNonNull(builder.name, "name is required");
            this.releaseLabel = java.util.Objects.requireNonNull(builder.releaseLabel, "releaseLabel is required");
            this.type = java.util.Objects.requireNonNull(builder.type, "type is required");
            this.vpcConfiguration = java.util.Objects.requireNonNull(builder.vpcConfiguration, "vpcConfiguration is required");
            this.autoScalingConfiguration = builder.autoScalingConfiguration;
            this.availabilityZoneId = builder.availabilityZoneId;
            this.cacheStorageConfigurations = builder.cacheStorageConfigurations;
            this.capacityConfiguration = builder.capacityConfiguration;
            this.code = builder.code;
            this.commandLineArguments = builder.commandLineArguments;
            this.database = builder.database;
            this.description = builder.description;
            this.executionRole = builder.executionRole;
            this.id = builder.id;
            this.initializationScript = builder.initializationScript;
            this.savedownStorageConfiguration = builder.savedownStorageConfiguration;
            this.scalingGroupConfiguration = builder.scalingGroupConfiguration;
            this.tags = builder.tags;
            this.tagsAll = builder.tagsAll;
            this.tickerplantLogConfiguration = builder.tickerplantLogConfiguration;
            this.timeouts = builder.timeouts;
            this.connection = builder.connection;
            this.count = builder.count;
            this.dependsOn = (java.util.List<com.hashicorp.cdktf.ITerraformDependable>)builder.dependsOn;
            this.forEach = builder.forEach;
            this.lifecycle = builder.lifecycle;
            this.provider = builder.provider;
            this.provisioners = (java.util.List<java.lang.Object>)builder.provisioners;
        }

        @Override
        public final java.lang.String getAzMode() {
            return this.azMode;
        }

        @Override
        public final java.lang.String getEnvironmentId() {
            return this.environmentId;
        }

        @Override
        public final java.lang.String getName() {
            return this.name;
        }

        @Override
        public final java.lang.String getReleaseLabel() {
            return this.releaseLabel;
        }

        @Override
        public final java.lang.String getType() {
            return this.type;
        }

        @Override
        public final imports.aws.finspace_kx_cluster.FinspaceKxClusterVpcConfiguration getVpcConfiguration() {
            return this.vpcConfiguration;
        }

        @Override
        public final imports.aws.finspace_kx_cluster.FinspaceKxClusterAutoScalingConfiguration getAutoScalingConfiguration() {
            return this.autoScalingConfiguration;
        }

        @Override
        public final java.lang.String getAvailabilityZoneId() {
            return this.availabilityZoneId;
        }

        @Override
        public final java.lang.Object getCacheStorageConfigurations() {
            return this.cacheStorageConfigurations;
        }

        @Override
        public final imports.aws.finspace_kx_cluster.FinspaceKxClusterCapacityConfiguration getCapacityConfiguration() {
            return this.capacityConfiguration;
        }

        @Override
        public final imports.aws.finspace_kx_cluster.FinspaceKxClusterCode getCode() {
            return this.code;
        }

        @Override
        public final java.util.Map<java.lang.String, java.lang.String> getCommandLineArguments() {
            return this.commandLineArguments;
        }

        @Override
        public final java.lang.Object getDatabase() {
            return this.database;
        }

        @Override
        public final java.lang.String getDescription() {
            return this.description;
        }

        @Override
        public final java.lang.String getExecutionRole() {
            return this.executionRole;
        }

        @Override
        public final java.lang.String getId() {
            return this.id;
        }

        @Override
        public final java.lang.String getInitializationScript() {
            return this.initializationScript;
        }

        @Override
        public final imports.aws.finspace_kx_cluster.FinspaceKxClusterSavedownStorageConfiguration getSavedownStorageConfiguration() {
            return this.savedownStorageConfiguration;
        }

        @Override
        public final imports.aws.finspace_kx_cluster.FinspaceKxClusterScalingGroupConfiguration getScalingGroupConfiguration() {
            return this.scalingGroupConfiguration;
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
        public final java.lang.Object getTickerplantLogConfiguration() {
            return this.tickerplantLogConfiguration;
        }

        @Override
        public final imports.aws.finspace_kx_cluster.FinspaceKxClusterTimeouts getTimeouts() {
            return this.timeouts;
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

            data.set("azMode", om.valueToTree(this.getAzMode()));
            data.set("environmentId", om.valueToTree(this.getEnvironmentId()));
            data.set("name", om.valueToTree(this.getName()));
            data.set("releaseLabel", om.valueToTree(this.getReleaseLabel()));
            data.set("type", om.valueToTree(this.getType()));
            data.set("vpcConfiguration", om.valueToTree(this.getVpcConfiguration()));
            if (this.getAutoScalingConfiguration() != null) {
                data.set("autoScalingConfiguration", om.valueToTree(this.getAutoScalingConfiguration()));
            }
            if (this.getAvailabilityZoneId() != null) {
                data.set("availabilityZoneId", om.valueToTree(this.getAvailabilityZoneId()));
            }
            if (this.getCacheStorageConfigurations() != null) {
                data.set("cacheStorageConfigurations", om.valueToTree(this.getCacheStorageConfigurations()));
            }
            if (this.getCapacityConfiguration() != null) {
                data.set("capacityConfiguration", om.valueToTree(this.getCapacityConfiguration()));
            }
            if (this.getCode() != null) {
                data.set("code", om.valueToTree(this.getCode()));
            }
            if (this.getCommandLineArguments() != null) {
                data.set("commandLineArguments", om.valueToTree(this.getCommandLineArguments()));
            }
            if (this.getDatabase() != null) {
                data.set("database", om.valueToTree(this.getDatabase()));
            }
            if (this.getDescription() != null) {
                data.set("description", om.valueToTree(this.getDescription()));
            }
            if (this.getExecutionRole() != null) {
                data.set("executionRole", om.valueToTree(this.getExecutionRole()));
            }
            if (this.getId() != null) {
                data.set("id", om.valueToTree(this.getId()));
            }
            if (this.getInitializationScript() != null) {
                data.set("initializationScript", om.valueToTree(this.getInitializationScript()));
            }
            if (this.getSavedownStorageConfiguration() != null) {
                data.set("savedownStorageConfiguration", om.valueToTree(this.getSavedownStorageConfiguration()));
            }
            if (this.getScalingGroupConfiguration() != null) {
                data.set("scalingGroupConfiguration", om.valueToTree(this.getScalingGroupConfiguration()));
            }
            if (this.getTags() != null) {
                data.set("tags", om.valueToTree(this.getTags()));
            }
            if (this.getTagsAll() != null) {
                data.set("tagsAll", om.valueToTree(this.getTagsAll()));
            }
            if (this.getTickerplantLogConfiguration() != null) {
                data.set("tickerplantLogConfiguration", om.valueToTree(this.getTickerplantLogConfiguration()));
            }
            if (this.getTimeouts() != null) {
                data.set("timeouts", om.valueToTree(this.getTimeouts()));
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
            struct.set("fqn", om.valueToTree("aws.finspaceKxCluster.FinspaceKxClusterConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            FinspaceKxClusterConfig.Jsii$Proxy that = (FinspaceKxClusterConfig.Jsii$Proxy) o;

            if (!azMode.equals(that.azMode)) return false;
            if (!environmentId.equals(that.environmentId)) return false;
            if (!name.equals(that.name)) return false;
            if (!releaseLabel.equals(that.releaseLabel)) return false;
            if (!type.equals(that.type)) return false;
            if (!vpcConfiguration.equals(that.vpcConfiguration)) return false;
            if (this.autoScalingConfiguration != null ? !this.autoScalingConfiguration.equals(that.autoScalingConfiguration) : that.autoScalingConfiguration != null) return false;
            if (this.availabilityZoneId != null ? !this.availabilityZoneId.equals(that.availabilityZoneId) : that.availabilityZoneId != null) return false;
            if (this.cacheStorageConfigurations != null ? !this.cacheStorageConfigurations.equals(that.cacheStorageConfigurations) : that.cacheStorageConfigurations != null) return false;
            if (this.capacityConfiguration != null ? !this.capacityConfiguration.equals(that.capacityConfiguration) : that.capacityConfiguration != null) return false;
            if (this.code != null ? !this.code.equals(that.code) : that.code != null) return false;
            if (this.commandLineArguments != null ? !this.commandLineArguments.equals(that.commandLineArguments) : that.commandLineArguments != null) return false;
            if (this.database != null ? !this.database.equals(that.database) : that.database != null) return false;
            if (this.description != null ? !this.description.equals(that.description) : that.description != null) return false;
            if (this.executionRole != null ? !this.executionRole.equals(that.executionRole) : that.executionRole != null) return false;
            if (this.id != null ? !this.id.equals(that.id) : that.id != null) return false;
            if (this.initializationScript != null ? !this.initializationScript.equals(that.initializationScript) : that.initializationScript != null) return false;
            if (this.savedownStorageConfiguration != null ? !this.savedownStorageConfiguration.equals(that.savedownStorageConfiguration) : that.savedownStorageConfiguration != null) return false;
            if (this.scalingGroupConfiguration != null ? !this.scalingGroupConfiguration.equals(that.scalingGroupConfiguration) : that.scalingGroupConfiguration != null) return false;
            if (this.tags != null ? !this.tags.equals(that.tags) : that.tags != null) return false;
            if (this.tagsAll != null ? !this.tagsAll.equals(that.tagsAll) : that.tagsAll != null) return false;
            if (this.tickerplantLogConfiguration != null ? !this.tickerplantLogConfiguration.equals(that.tickerplantLogConfiguration) : that.tickerplantLogConfiguration != null) return false;
            if (this.timeouts != null ? !this.timeouts.equals(that.timeouts) : that.timeouts != null) return false;
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
            int result = this.azMode.hashCode();
            result = 31 * result + (this.environmentId.hashCode());
            result = 31 * result + (this.name.hashCode());
            result = 31 * result + (this.releaseLabel.hashCode());
            result = 31 * result + (this.type.hashCode());
            result = 31 * result + (this.vpcConfiguration.hashCode());
            result = 31 * result + (this.autoScalingConfiguration != null ? this.autoScalingConfiguration.hashCode() : 0);
            result = 31 * result + (this.availabilityZoneId != null ? this.availabilityZoneId.hashCode() : 0);
            result = 31 * result + (this.cacheStorageConfigurations != null ? this.cacheStorageConfigurations.hashCode() : 0);
            result = 31 * result + (this.capacityConfiguration != null ? this.capacityConfiguration.hashCode() : 0);
            result = 31 * result + (this.code != null ? this.code.hashCode() : 0);
            result = 31 * result + (this.commandLineArguments != null ? this.commandLineArguments.hashCode() : 0);
            result = 31 * result + (this.database != null ? this.database.hashCode() : 0);
            result = 31 * result + (this.description != null ? this.description.hashCode() : 0);
            result = 31 * result + (this.executionRole != null ? this.executionRole.hashCode() : 0);
            result = 31 * result + (this.id != null ? this.id.hashCode() : 0);
            result = 31 * result + (this.initializationScript != null ? this.initializationScript.hashCode() : 0);
            result = 31 * result + (this.savedownStorageConfiguration != null ? this.savedownStorageConfiguration.hashCode() : 0);
            result = 31 * result + (this.scalingGroupConfiguration != null ? this.scalingGroupConfiguration.hashCode() : 0);
            result = 31 * result + (this.tags != null ? this.tags.hashCode() : 0);
            result = 31 * result + (this.tagsAll != null ? this.tagsAll.hashCode() : 0);
            result = 31 * result + (this.tickerplantLogConfiguration != null ? this.tickerplantLogConfiguration.hashCode() : 0);
            result = 31 * result + (this.timeouts != null ? this.timeouts.hashCode() : 0);
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
