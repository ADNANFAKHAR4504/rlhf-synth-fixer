package imports.aws.opsworks_stack;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.039Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.opsworksStack.OpsworksStackConfig")
@software.amazon.jsii.Jsii.Proxy(OpsworksStackConfig.Jsii$Proxy.class)
public interface OpsworksStackConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_stack#default_instance_profile_arn OpsworksStack#default_instance_profile_arn}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getDefaultInstanceProfileArn();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_stack#name OpsworksStack#name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getName();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_stack#region OpsworksStack#region}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getRegion();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_stack#service_role_arn OpsworksStack#service_role_arn}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getServiceRoleArn();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_stack#agent_version OpsworksStack#agent_version}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getAgentVersion() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_stack#berkshelf_version OpsworksStack#berkshelf_version}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getBerkshelfVersion() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_stack#color OpsworksStack#color}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getColor() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_stack#configuration_manager_name OpsworksStack#configuration_manager_name}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getConfigurationManagerName() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_stack#configuration_manager_version OpsworksStack#configuration_manager_version}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getConfigurationManagerVersion() {
        return null;
    }

    /**
     * custom_cookbooks_source block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_stack#custom_cookbooks_source OpsworksStack#custom_cookbooks_source}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.opsworks_stack.OpsworksStackCustomCookbooksSource getCustomCookbooksSource() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_stack#custom_json OpsworksStack#custom_json}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getCustomJson() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_stack#default_availability_zone OpsworksStack#default_availability_zone}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDefaultAvailabilityZone() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_stack#default_os OpsworksStack#default_os}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDefaultOs() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_stack#default_root_device_type OpsworksStack#default_root_device_type}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDefaultRootDeviceType() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_stack#default_ssh_key_name OpsworksStack#default_ssh_key_name}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDefaultSshKeyName() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_stack#default_subnet_id OpsworksStack#default_subnet_id}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDefaultSubnetId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_stack#hostname_theme OpsworksStack#hostname_theme}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getHostnameTheme() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_stack#id OpsworksStack#id}.
     * <p>
     * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
     * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_stack#manage_berkshelf OpsworksStack#manage_berkshelf}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getManageBerkshelf() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_stack#tags OpsworksStack#tags}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTags() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_stack#tags_all OpsworksStack#tags_all}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsAll() {
        return null;
    }

    /**
     * timeouts block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_stack#timeouts OpsworksStack#timeouts}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.opsworks_stack.OpsworksStackTimeouts getTimeouts() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_stack#use_custom_cookbooks OpsworksStack#use_custom_cookbooks}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getUseCustomCookbooks() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_stack#use_opsworks_security_groups OpsworksStack#use_opsworks_security_groups}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getUseOpsworksSecurityGroups() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_stack#vpc_id OpsworksStack#vpc_id}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getVpcId() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link OpsworksStackConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link OpsworksStackConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<OpsworksStackConfig> {
        java.lang.String defaultInstanceProfileArn;
        java.lang.String name;
        java.lang.String region;
        java.lang.String serviceRoleArn;
        java.lang.String agentVersion;
        java.lang.String berkshelfVersion;
        java.lang.String color;
        java.lang.String configurationManagerName;
        java.lang.String configurationManagerVersion;
        imports.aws.opsworks_stack.OpsworksStackCustomCookbooksSource customCookbooksSource;
        java.lang.String customJson;
        java.lang.String defaultAvailabilityZone;
        java.lang.String defaultOs;
        java.lang.String defaultRootDeviceType;
        java.lang.String defaultSshKeyName;
        java.lang.String defaultSubnetId;
        java.lang.String hostnameTheme;
        java.lang.String id;
        java.lang.Object manageBerkshelf;
        java.util.Map<java.lang.String, java.lang.String> tags;
        java.util.Map<java.lang.String, java.lang.String> tagsAll;
        imports.aws.opsworks_stack.OpsworksStackTimeouts timeouts;
        java.lang.Object useCustomCookbooks;
        java.lang.Object useOpsworksSecurityGroups;
        java.lang.String vpcId;
        java.lang.Object connection;
        java.lang.Object count;
        java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        com.hashicorp.cdktf.ITerraformIterator forEach;
        com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        com.hashicorp.cdktf.TerraformProvider provider;
        java.util.List<java.lang.Object> provisioners;

        /**
         * Sets the value of {@link OpsworksStackConfig#getDefaultInstanceProfileArn}
         * @param defaultInstanceProfileArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_stack#default_instance_profile_arn OpsworksStack#default_instance_profile_arn}. This parameter is required.
         * @return {@code this}
         */
        public Builder defaultInstanceProfileArn(java.lang.String defaultInstanceProfileArn) {
            this.defaultInstanceProfileArn = defaultInstanceProfileArn;
            return this;
        }

        /**
         * Sets the value of {@link OpsworksStackConfig#getName}
         * @param name Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_stack#name OpsworksStack#name}. This parameter is required.
         * @return {@code this}
         */
        public Builder name(java.lang.String name) {
            this.name = name;
            return this;
        }

        /**
         * Sets the value of {@link OpsworksStackConfig#getRegion}
         * @param region Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_stack#region OpsworksStack#region}. This parameter is required.
         * @return {@code this}
         */
        public Builder region(java.lang.String region) {
            this.region = region;
            return this;
        }

        /**
         * Sets the value of {@link OpsworksStackConfig#getServiceRoleArn}
         * @param serviceRoleArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_stack#service_role_arn OpsworksStack#service_role_arn}. This parameter is required.
         * @return {@code this}
         */
        public Builder serviceRoleArn(java.lang.String serviceRoleArn) {
            this.serviceRoleArn = serviceRoleArn;
            return this;
        }

        /**
         * Sets the value of {@link OpsworksStackConfig#getAgentVersion}
         * @param agentVersion Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_stack#agent_version OpsworksStack#agent_version}.
         * @return {@code this}
         */
        public Builder agentVersion(java.lang.String agentVersion) {
            this.agentVersion = agentVersion;
            return this;
        }

        /**
         * Sets the value of {@link OpsworksStackConfig#getBerkshelfVersion}
         * @param berkshelfVersion Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_stack#berkshelf_version OpsworksStack#berkshelf_version}.
         * @return {@code this}
         */
        public Builder berkshelfVersion(java.lang.String berkshelfVersion) {
            this.berkshelfVersion = berkshelfVersion;
            return this;
        }

        /**
         * Sets the value of {@link OpsworksStackConfig#getColor}
         * @param color Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_stack#color OpsworksStack#color}.
         * @return {@code this}
         */
        public Builder color(java.lang.String color) {
            this.color = color;
            return this;
        }

        /**
         * Sets the value of {@link OpsworksStackConfig#getConfigurationManagerName}
         * @param configurationManagerName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_stack#configuration_manager_name OpsworksStack#configuration_manager_name}.
         * @return {@code this}
         */
        public Builder configurationManagerName(java.lang.String configurationManagerName) {
            this.configurationManagerName = configurationManagerName;
            return this;
        }

        /**
         * Sets the value of {@link OpsworksStackConfig#getConfigurationManagerVersion}
         * @param configurationManagerVersion Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_stack#configuration_manager_version OpsworksStack#configuration_manager_version}.
         * @return {@code this}
         */
        public Builder configurationManagerVersion(java.lang.String configurationManagerVersion) {
            this.configurationManagerVersion = configurationManagerVersion;
            return this;
        }

        /**
         * Sets the value of {@link OpsworksStackConfig#getCustomCookbooksSource}
         * @param customCookbooksSource custom_cookbooks_source block.
         *                              Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_stack#custom_cookbooks_source OpsworksStack#custom_cookbooks_source}
         * @return {@code this}
         */
        public Builder customCookbooksSource(imports.aws.opsworks_stack.OpsworksStackCustomCookbooksSource customCookbooksSource) {
            this.customCookbooksSource = customCookbooksSource;
            return this;
        }

        /**
         * Sets the value of {@link OpsworksStackConfig#getCustomJson}
         * @param customJson Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_stack#custom_json OpsworksStack#custom_json}.
         * @return {@code this}
         */
        public Builder customJson(java.lang.String customJson) {
            this.customJson = customJson;
            return this;
        }

        /**
         * Sets the value of {@link OpsworksStackConfig#getDefaultAvailabilityZone}
         * @param defaultAvailabilityZone Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_stack#default_availability_zone OpsworksStack#default_availability_zone}.
         * @return {@code this}
         */
        public Builder defaultAvailabilityZone(java.lang.String defaultAvailabilityZone) {
            this.defaultAvailabilityZone = defaultAvailabilityZone;
            return this;
        }

        /**
         * Sets the value of {@link OpsworksStackConfig#getDefaultOs}
         * @param defaultOs Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_stack#default_os OpsworksStack#default_os}.
         * @return {@code this}
         */
        public Builder defaultOs(java.lang.String defaultOs) {
            this.defaultOs = defaultOs;
            return this;
        }

        /**
         * Sets the value of {@link OpsworksStackConfig#getDefaultRootDeviceType}
         * @param defaultRootDeviceType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_stack#default_root_device_type OpsworksStack#default_root_device_type}.
         * @return {@code this}
         */
        public Builder defaultRootDeviceType(java.lang.String defaultRootDeviceType) {
            this.defaultRootDeviceType = defaultRootDeviceType;
            return this;
        }

        /**
         * Sets the value of {@link OpsworksStackConfig#getDefaultSshKeyName}
         * @param defaultSshKeyName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_stack#default_ssh_key_name OpsworksStack#default_ssh_key_name}.
         * @return {@code this}
         */
        public Builder defaultSshKeyName(java.lang.String defaultSshKeyName) {
            this.defaultSshKeyName = defaultSshKeyName;
            return this;
        }

        /**
         * Sets the value of {@link OpsworksStackConfig#getDefaultSubnetId}
         * @param defaultSubnetId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_stack#default_subnet_id OpsworksStack#default_subnet_id}.
         * @return {@code this}
         */
        public Builder defaultSubnetId(java.lang.String defaultSubnetId) {
            this.defaultSubnetId = defaultSubnetId;
            return this;
        }

        /**
         * Sets the value of {@link OpsworksStackConfig#getHostnameTheme}
         * @param hostnameTheme Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_stack#hostname_theme OpsworksStack#hostname_theme}.
         * @return {@code this}
         */
        public Builder hostnameTheme(java.lang.String hostnameTheme) {
            this.hostnameTheme = hostnameTheme;
            return this;
        }

        /**
         * Sets the value of {@link OpsworksStackConfig#getId}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_stack#id OpsworksStack#id}.
         *           Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         *           If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * @return {@code this}
         */
        public Builder id(java.lang.String id) {
            this.id = id;
            return this;
        }

        /**
         * Sets the value of {@link OpsworksStackConfig#getManageBerkshelf}
         * @param manageBerkshelf Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_stack#manage_berkshelf OpsworksStack#manage_berkshelf}.
         * @return {@code this}
         */
        public Builder manageBerkshelf(java.lang.Boolean manageBerkshelf) {
            this.manageBerkshelf = manageBerkshelf;
            return this;
        }

        /**
         * Sets the value of {@link OpsworksStackConfig#getManageBerkshelf}
         * @param manageBerkshelf Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_stack#manage_berkshelf OpsworksStack#manage_berkshelf}.
         * @return {@code this}
         */
        public Builder manageBerkshelf(com.hashicorp.cdktf.IResolvable manageBerkshelf) {
            this.manageBerkshelf = manageBerkshelf;
            return this;
        }

        /**
         * Sets the value of {@link OpsworksStackConfig#getTags}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_stack#tags OpsworksStack#tags}.
         * @return {@code this}
         */
        public Builder tags(java.util.Map<java.lang.String, java.lang.String> tags) {
            this.tags = tags;
            return this;
        }

        /**
         * Sets the value of {@link OpsworksStackConfig#getTagsAll}
         * @param tagsAll Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_stack#tags_all OpsworksStack#tags_all}.
         * @return {@code this}
         */
        public Builder tagsAll(java.util.Map<java.lang.String, java.lang.String> tagsAll) {
            this.tagsAll = tagsAll;
            return this;
        }

        /**
         * Sets the value of {@link OpsworksStackConfig#getTimeouts}
         * @param timeouts timeouts block.
         *                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_stack#timeouts OpsworksStack#timeouts}
         * @return {@code this}
         */
        public Builder timeouts(imports.aws.opsworks_stack.OpsworksStackTimeouts timeouts) {
            this.timeouts = timeouts;
            return this;
        }

        /**
         * Sets the value of {@link OpsworksStackConfig#getUseCustomCookbooks}
         * @param useCustomCookbooks Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_stack#use_custom_cookbooks OpsworksStack#use_custom_cookbooks}.
         * @return {@code this}
         */
        public Builder useCustomCookbooks(java.lang.Boolean useCustomCookbooks) {
            this.useCustomCookbooks = useCustomCookbooks;
            return this;
        }

        /**
         * Sets the value of {@link OpsworksStackConfig#getUseCustomCookbooks}
         * @param useCustomCookbooks Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_stack#use_custom_cookbooks OpsworksStack#use_custom_cookbooks}.
         * @return {@code this}
         */
        public Builder useCustomCookbooks(com.hashicorp.cdktf.IResolvable useCustomCookbooks) {
            this.useCustomCookbooks = useCustomCookbooks;
            return this;
        }

        /**
         * Sets the value of {@link OpsworksStackConfig#getUseOpsworksSecurityGroups}
         * @param useOpsworksSecurityGroups Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_stack#use_opsworks_security_groups OpsworksStack#use_opsworks_security_groups}.
         * @return {@code this}
         */
        public Builder useOpsworksSecurityGroups(java.lang.Boolean useOpsworksSecurityGroups) {
            this.useOpsworksSecurityGroups = useOpsworksSecurityGroups;
            return this;
        }

        /**
         * Sets the value of {@link OpsworksStackConfig#getUseOpsworksSecurityGroups}
         * @param useOpsworksSecurityGroups Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_stack#use_opsworks_security_groups OpsworksStack#use_opsworks_security_groups}.
         * @return {@code this}
         */
        public Builder useOpsworksSecurityGroups(com.hashicorp.cdktf.IResolvable useOpsworksSecurityGroups) {
            this.useOpsworksSecurityGroups = useOpsworksSecurityGroups;
            return this;
        }

        /**
         * Sets the value of {@link OpsworksStackConfig#getVpcId}
         * @param vpcId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_stack#vpc_id OpsworksStack#vpc_id}.
         * @return {@code this}
         */
        public Builder vpcId(java.lang.String vpcId) {
            this.vpcId = vpcId;
            return this;
        }

        /**
         * Sets the value of {@link OpsworksStackConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link OpsworksStackConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link OpsworksStackConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link OpsworksStackConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link OpsworksStackConfig#getDependsOn}
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
         * Sets the value of {@link OpsworksStackConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link OpsworksStackConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link OpsworksStackConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link OpsworksStackConfig#getProvisioners}
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
         * @return a new instance of {@link OpsworksStackConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public OpsworksStackConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link OpsworksStackConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements OpsworksStackConfig {
        private final java.lang.String defaultInstanceProfileArn;
        private final java.lang.String name;
        private final java.lang.String region;
        private final java.lang.String serviceRoleArn;
        private final java.lang.String agentVersion;
        private final java.lang.String berkshelfVersion;
        private final java.lang.String color;
        private final java.lang.String configurationManagerName;
        private final java.lang.String configurationManagerVersion;
        private final imports.aws.opsworks_stack.OpsworksStackCustomCookbooksSource customCookbooksSource;
        private final java.lang.String customJson;
        private final java.lang.String defaultAvailabilityZone;
        private final java.lang.String defaultOs;
        private final java.lang.String defaultRootDeviceType;
        private final java.lang.String defaultSshKeyName;
        private final java.lang.String defaultSubnetId;
        private final java.lang.String hostnameTheme;
        private final java.lang.String id;
        private final java.lang.Object manageBerkshelf;
        private final java.util.Map<java.lang.String, java.lang.String> tags;
        private final java.util.Map<java.lang.String, java.lang.String> tagsAll;
        private final imports.aws.opsworks_stack.OpsworksStackTimeouts timeouts;
        private final java.lang.Object useCustomCookbooks;
        private final java.lang.Object useOpsworksSecurityGroups;
        private final java.lang.String vpcId;
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
            this.defaultInstanceProfileArn = software.amazon.jsii.Kernel.get(this, "defaultInstanceProfileArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.name = software.amazon.jsii.Kernel.get(this, "name", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.region = software.amazon.jsii.Kernel.get(this, "region", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.serviceRoleArn = software.amazon.jsii.Kernel.get(this, "serviceRoleArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.agentVersion = software.amazon.jsii.Kernel.get(this, "agentVersion", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.berkshelfVersion = software.amazon.jsii.Kernel.get(this, "berkshelfVersion", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.color = software.amazon.jsii.Kernel.get(this, "color", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.configurationManagerName = software.amazon.jsii.Kernel.get(this, "configurationManagerName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.configurationManagerVersion = software.amazon.jsii.Kernel.get(this, "configurationManagerVersion", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.customCookbooksSource = software.amazon.jsii.Kernel.get(this, "customCookbooksSource", software.amazon.jsii.NativeType.forClass(imports.aws.opsworks_stack.OpsworksStackCustomCookbooksSource.class));
            this.customJson = software.amazon.jsii.Kernel.get(this, "customJson", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.defaultAvailabilityZone = software.amazon.jsii.Kernel.get(this, "defaultAvailabilityZone", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.defaultOs = software.amazon.jsii.Kernel.get(this, "defaultOs", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.defaultRootDeviceType = software.amazon.jsii.Kernel.get(this, "defaultRootDeviceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.defaultSshKeyName = software.amazon.jsii.Kernel.get(this, "defaultSshKeyName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.defaultSubnetId = software.amazon.jsii.Kernel.get(this, "defaultSubnetId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.hostnameTheme = software.amazon.jsii.Kernel.get(this, "hostnameTheme", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.id = software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.manageBerkshelf = software.amazon.jsii.Kernel.get(this, "manageBerkshelf", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.tags = software.amazon.jsii.Kernel.get(this, "tags", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.tagsAll = software.amazon.jsii.Kernel.get(this, "tagsAll", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.timeouts = software.amazon.jsii.Kernel.get(this, "timeouts", software.amazon.jsii.NativeType.forClass(imports.aws.opsworks_stack.OpsworksStackTimeouts.class));
            this.useCustomCookbooks = software.amazon.jsii.Kernel.get(this, "useCustomCookbooks", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.useOpsworksSecurityGroups = software.amazon.jsii.Kernel.get(this, "useOpsworksSecurityGroups", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.vpcId = software.amazon.jsii.Kernel.get(this, "vpcId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
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
            this.defaultInstanceProfileArn = java.util.Objects.requireNonNull(builder.defaultInstanceProfileArn, "defaultInstanceProfileArn is required");
            this.name = java.util.Objects.requireNonNull(builder.name, "name is required");
            this.region = java.util.Objects.requireNonNull(builder.region, "region is required");
            this.serviceRoleArn = java.util.Objects.requireNonNull(builder.serviceRoleArn, "serviceRoleArn is required");
            this.agentVersion = builder.agentVersion;
            this.berkshelfVersion = builder.berkshelfVersion;
            this.color = builder.color;
            this.configurationManagerName = builder.configurationManagerName;
            this.configurationManagerVersion = builder.configurationManagerVersion;
            this.customCookbooksSource = builder.customCookbooksSource;
            this.customJson = builder.customJson;
            this.defaultAvailabilityZone = builder.defaultAvailabilityZone;
            this.defaultOs = builder.defaultOs;
            this.defaultRootDeviceType = builder.defaultRootDeviceType;
            this.defaultSshKeyName = builder.defaultSshKeyName;
            this.defaultSubnetId = builder.defaultSubnetId;
            this.hostnameTheme = builder.hostnameTheme;
            this.id = builder.id;
            this.manageBerkshelf = builder.manageBerkshelf;
            this.tags = builder.tags;
            this.tagsAll = builder.tagsAll;
            this.timeouts = builder.timeouts;
            this.useCustomCookbooks = builder.useCustomCookbooks;
            this.useOpsworksSecurityGroups = builder.useOpsworksSecurityGroups;
            this.vpcId = builder.vpcId;
            this.connection = builder.connection;
            this.count = builder.count;
            this.dependsOn = (java.util.List<com.hashicorp.cdktf.ITerraformDependable>)builder.dependsOn;
            this.forEach = builder.forEach;
            this.lifecycle = builder.lifecycle;
            this.provider = builder.provider;
            this.provisioners = (java.util.List<java.lang.Object>)builder.provisioners;
        }

        @Override
        public final java.lang.String getDefaultInstanceProfileArn() {
            return this.defaultInstanceProfileArn;
        }

        @Override
        public final java.lang.String getName() {
            return this.name;
        }

        @Override
        public final java.lang.String getRegion() {
            return this.region;
        }

        @Override
        public final java.lang.String getServiceRoleArn() {
            return this.serviceRoleArn;
        }

        @Override
        public final java.lang.String getAgentVersion() {
            return this.agentVersion;
        }

        @Override
        public final java.lang.String getBerkshelfVersion() {
            return this.berkshelfVersion;
        }

        @Override
        public final java.lang.String getColor() {
            return this.color;
        }

        @Override
        public final java.lang.String getConfigurationManagerName() {
            return this.configurationManagerName;
        }

        @Override
        public final java.lang.String getConfigurationManagerVersion() {
            return this.configurationManagerVersion;
        }

        @Override
        public final imports.aws.opsworks_stack.OpsworksStackCustomCookbooksSource getCustomCookbooksSource() {
            return this.customCookbooksSource;
        }

        @Override
        public final java.lang.String getCustomJson() {
            return this.customJson;
        }

        @Override
        public final java.lang.String getDefaultAvailabilityZone() {
            return this.defaultAvailabilityZone;
        }

        @Override
        public final java.lang.String getDefaultOs() {
            return this.defaultOs;
        }

        @Override
        public final java.lang.String getDefaultRootDeviceType() {
            return this.defaultRootDeviceType;
        }

        @Override
        public final java.lang.String getDefaultSshKeyName() {
            return this.defaultSshKeyName;
        }

        @Override
        public final java.lang.String getDefaultSubnetId() {
            return this.defaultSubnetId;
        }

        @Override
        public final java.lang.String getHostnameTheme() {
            return this.hostnameTheme;
        }

        @Override
        public final java.lang.String getId() {
            return this.id;
        }

        @Override
        public final java.lang.Object getManageBerkshelf() {
            return this.manageBerkshelf;
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
        public final imports.aws.opsworks_stack.OpsworksStackTimeouts getTimeouts() {
            return this.timeouts;
        }

        @Override
        public final java.lang.Object getUseCustomCookbooks() {
            return this.useCustomCookbooks;
        }

        @Override
        public final java.lang.Object getUseOpsworksSecurityGroups() {
            return this.useOpsworksSecurityGroups;
        }

        @Override
        public final java.lang.String getVpcId() {
            return this.vpcId;
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

            data.set("defaultInstanceProfileArn", om.valueToTree(this.getDefaultInstanceProfileArn()));
            data.set("name", om.valueToTree(this.getName()));
            data.set("region", om.valueToTree(this.getRegion()));
            data.set("serviceRoleArn", om.valueToTree(this.getServiceRoleArn()));
            if (this.getAgentVersion() != null) {
                data.set("agentVersion", om.valueToTree(this.getAgentVersion()));
            }
            if (this.getBerkshelfVersion() != null) {
                data.set("berkshelfVersion", om.valueToTree(this.getBerkshelfVersion()));
            }
            if (this.getColor() != null) {
                data.set("color", om.valueToTree(this.getColor()));
            }
            if (this.getConfigurationManagerName() != null) {
                data.set("configurationManagerName", om.valueToTree(this.getConfigurationManagerName()));
            }
            if (this.getConfigurationManagerVersion() != null) {
                data.set("configurationManagerVersion", om.valueToTree(this.getConfigurationManagerVersion()));
            }
            if (this.getCustomCookbooksSource() != null) {
                data.set("customCookbooksSource", om.valueToTree(this.getCustomCookbooksSource()));
            }
            if (this.getCustomJson() != null) {
                data.set("customJson", om.valueToTree(this.getCustomJson()));
            }
            if (this.getDefaultAvailabilityZone() != null) {
                data.set("defaultAvailabilityZone", om.valueToTree(this.getDefaultAvailabilityZone()));
            }
            if (this.getDefaultOs() != null) {
                data.set("defaultOs", om.valueToTree(this.getDefaultOs()));
            }
            if (this.getDefaultRootDeviceType() != null) {
                data.set("defaultRootDeviceType", om.valueToTree(this.getDefaultRootDeviceType()));
            }
            if (this.getDefaultSshKeyName() != null) {
                data.set("defaultSshKeyName", om.valueToTree(this.getDefaultSshKeyName()));
            }
            if (this.getDefaultSubnetId() != null) {
                data.set("defaultSubnetId", om.valueToTree(this.getDefaultSubnetId()));
            }
            if (this.getHostnameTheme() != null) {
                data.set("hostnameTheme", om.valueToTree(this.getHostnameTheme()));
            }
            if (this.getId() != null) {
                data.set("id", om.valueToTree(this.getId()));
            }
            if (this.getManageBerkshelf() != null) {
                data.set("manageBerkshelf", om.valueToTree(this.getManageBerkshelf()));
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
            if (this.getUseCustomCookbooks() != null) {
                data.set("useCustomCookbooks", om.valueToTree(this.getUseCustomCookbooks()));
            }
            if (this.getUseOpsworksSecurityGroups() != null) {
                data.set("useOpsworksSecurityGroups", om.valueToTree(this.getUseOpsworksSecurityGroups()));
            }
            if (this.getVpcId() != null) {
                data.set("vpcId", om.valueToTree(this.getVpcId()));
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
            struct.set("fqn", om.valueToTree("aws.opsworksStack.OpsworksStackConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            OpsworksStackConfig.Jsii$Proxy that = (OpsworksStackConfig.Jsii$Proxy) o;

            if (!defaultInstanceProfileArn.equals(that.defaultInstanceProfileArn)) return false;
            if (!name.equals(that.name)) return false;
            if (!region.equals(that.region)) return false;
            if (!serviceRoleArn.equals(that.serviceRoleArn)) return false;
            if (this.agentVersion != null ? !this.agentVersion.equals(that.agentVersion) : that.agentVersion != null) return false;
            if (this.berkshelfVersion != null ? !this.berkshelfVersion.equals(that.berkshelfVersion) : that.berkshelfVersion != null) return false;
            if (this.color != null ? !this.color.equals(that.color) : that.color != null) return false;
            if (this.configurationManagerName != null ? !this.configurationManagerName.equals(that.configurationManagerName) : that.configurationManagerName != null) return false;
            if (this.configurationManagerVersion != null ? !this.configurationManagerVersion.equals(that.configurationManagerVersion) : that.configurationManagerVersion != null) return false;
            if (this.customCookbooksSource != null ? !this.customCookbooksSource.equals(that.customCookbooksSource) : that.customCookbooksSource != null) return false;
            if (this.customJson != null ? !this.customJson.equals(that.customJson) : that.customJson != null) return false;
            if (this.defaultAvailabilityZone != null ? !this.defaultAvailabilityZone.equals(that.defaultAvailabilityZone) : that.defaultAvailabilityZone != null) return false;
            if (this.defaultOs != null ? !this.defaultOs.equals(that.defaultOs) : that.defaultOs != null) return false;
            if (this.defaultRootDeviceType != null ? !this.defaultRootDeviceType.equals(that.defaultRootDeviceType) : that.defaultRootDeviceType != null) return false;
            if (this.defaultSshKeyName != null ? !this.defaultSshKeyName.equals(that.defaultSshKeyName) : that.defaultSshKeyName != null) return false;
            if (this.defaultSubnetId != null ? !this.defaultSubnetId.equals(that.defaultSubnetId) : that.defaultSubnetId != null) return false;
            if (this.hostnameTheme != null ? !this.hostnameTheme.equals(that.hostnameTheme) : that.hostnameTheme != null) return false;
            if (this.id != null ? !this.id.equals(that.id) : that.id != null) return false;
            if (this.manageBerkshelf != null ? !this.manageBerkshelf.equals(that.manageBerkshelf) : that.manageBerkshelf != null) return false;
            if (this.tags != null ? !this.tags.equals(that.tags) : that.tags != null) return false;
            if (this.tagsAll != null ? !this.tagsAll.equals(that.tagsAll) : that.tagsAll != null) return false;
            if (this.timeouts != null ? !this.timeouts.equals(that.timeouts) : that.timeouts != null) return false;
            if (this.useCustomCookbooks != null ? !this.useCustomCookbooks.equals(that.useCustomCookbooks) : that.useCustomCookbooks != null) return false;
            if (this.useOpsworksSecurityGroups != null ? !this.useOpsworksSecurityGroups.equals(that.useOpsworksSecurityGroups) : that.useOpsworksSecurityGroups != null) return false;
            if (this.vpcId != null ? !this.vpcId.equals(that.vpcId) : that.vpcId != null) return false;
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
            int result = this.defaultInstanceProfileArn.hashCode();
            result = 31 * result + (this.name.hashCode());
            result = 31 * result + (this.region.hashCode());
            result = 31 * result + (this.serviceRoleArn.hashCode());
            result = 31 * result + (this.agentVersion != null ? this.agentVersion.hashCode() : 0);
            result = 31 * result + (this.berkshelfVersion != null ? this.berkshelfVersion.hashCode() : 0);
            result = 31 * result + (this.color != null ? this.color.hashCode() : 0);
            result = 31 * result + (this.configurationManagerName != null ? this.configurationManagerName.hashCode() : 0);
            result = 31 * result + (this.configurationManagerVersion != null ? this.configurationManagerVersion.hashCode() : 0);
            result = 31 * result + (this.customCookbooksSource != null ? this.customCookbooksSource.hashCode() : 0);
            result = 31 * result + (this.customJson != null ? this.customJson.hashCode() : 0);
            result = 31 * result + (this.defaultAvailabilityZone != null ? this.defaultAvailabilityZone.hashCode() : 0);
            result = 31 * result + (this.defaultOs != null ? this.defaultOs.hashCode() : 0);
            result = 31 * result + (this.defaultRootDeviceType != null ? this.defaultRootDeviceType.hashCode() : 0);
            result = 31 * result + (this.defaultSshKeyName != null ? this.defaultSshKeyName.hashCode() : 0);
            result = 31 * result + (this.defaultSubnetId != null ? this.defaultSubnetId.hashCode() : 0);
            result = 31 * result + (this.hostnameTheme != null ? this.hostnameTheme.hashCode() : 0);
            result = 31 * result + (this.id != null ? this.id.hashCode() : 0);
            result = 31 * result + (this.manageBerkshelf != null ? this.manageBerkshelf.hashCode() : 0);
            result = 31 * result + (this.tags != null ? this.tags.hashCode() : 0);
            result = 31 * result + (this.tagsAll != null ? this.tagsAll.hashCode() : 0);
            result = 31 * result + (this.timeouts != null ? this.timeouts.hashCode() : 0);
            result = 31 * result + (this.useCustomCookbooks != null ? this.useCustomCookbooks.hashCode() : 0);
            result = 31 * result + (this.useOpsworksSecurityGroups != null ? this.useOpsworksSecurityGroups.hashCode() : 0);
            result = 31 * result + (this.vpcId != null ? this.vpcId.hashCode() : 0);
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
