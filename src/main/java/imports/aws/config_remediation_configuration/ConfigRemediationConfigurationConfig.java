package imports.aws.config_remediation_configuration;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.379Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.configRemediationConfiguration.ConfigRemediationConfigurationConfig")
@software.amazon.jsii.Jsii.Proxy(ConfigRemediationConfigurationConfig.Jsii$Proxy.class)
public interface ConfigRemediationConfigurationConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/config_remediation_configuration#config_rule_name ConfigRemediationConfiguration#config_rule_name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getConfigRuleName();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/config_remediation_configuration#target_id ConfigRemediationConfiguration#target_id}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getTargetId();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/config_remediation_configuration#target_type ConfigRemediationConfiguration#target_type}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getTargetType();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/config_remediation_configuration#automatic ConfigRemediationConfiguration#automatic}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getAutomatic() {
        return null;
    }

    /**
     * execution_controls block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/config_remediation_configuration#execution_controls ConfigRemediationConfiguration#execution_controls}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.config_remediation_configuration.ConfigRemediationConfigurationExecutionControls getExecutionControls() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/config_remediation_configuration#id ConfigRemediationConfiguration#id}.
     * <p>
     * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
     * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/config_remediation_configuration#maximum_automatic_attempts ConfigRemediationConfiguration#maximum_automatic_attempts}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getMaximumAutomaticAttempts() {
        return null;
    }

    /**
     * parameter block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/config_remediation_configuration#parameter ConfigRemediationConfiguration#parameter}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getParameter() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/config_remediation_configuration#resource_type ConfigRemediationConfiguration#resource_type}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getResourceType() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/config_remediation_configuration#retry_attempt_seconds ConfigRemediationConfiguration#retry_attempt_seconds}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getRetryAttemptSeconds() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/config_remediation_configuration#target_version ConfigRemediationConfiguration#target_version}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getTargetVersion() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link ConfigRemediationConfigurationConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link ConfigRemediationConfigurationConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<ConfigRemediationConfigurationConfig> {
        java.lang.String configRuleName;
        java.lang.String targetId;
        java.lang.String targetType;
        java.lang.Object automatic;
        imports.aws.config_remediation_configuration.ConfigRemediationConfigurationExecutionControls executionControls;
        java.lang.String id;
        java.lang.Number maximumAutomaticAttempts;
        java.lang.Object parameter;
        java.lang.String resourceType;
        java.lang.Number retryAttemptSeconds;
        java.lang.String targetVersion;
        java.lang.Object connection;
        java.lang.Object count;
        java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        com.hashicorp.cdktf.ITerraformIterator forEach;
        com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        com.hashicorp.cdktf.TerraformProvider provider;
        java.util.List<java.lang.Object> provisioners;

        /**
         * Sets the value of {@link ConfigRemediationConfigurationConfig#getConfigRuleName}
         * @param configRuleName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/config_remediation_configuration#config_rule_name ConfigRemediationConfiguration#config_rule_name}. This parameter is required.
         * @return {@code this}
         */
        public Builder configRuleName(java.lang.String configRuleName) {
            this.configRuleName = configRuleName;
            return this;
        }

        /**
         * Sets the value of {@link ConfigRemediationConfigurationConfig#getTargetId}
         * @param targetId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/config_remediation_configuration#target_id ConfigRemediationConfiguration#target_id}. This parameter is required.
         * @return {@code this}
         */
        public Builder targetId(java.lang.String targetId) {
            this.targetId = targetId;
            return this;
        }

        /**
         * Sets the value of {@link ConfigRemediationConfigurationConfig#getTargetType}
         * @param targetType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/config_remediation_configuration#target_type ConfigRemediationConfiguration#target_type}. This parameter is required.
         * @return {@code this}
         */
        public Builder targetType(java.lang.String targetType) {
            this.targetType = targetType;
            return this;
        }

        /**
         * Sets the value of {@link ConfigRemediationConfigurationConfig#getAutomatic}
         * @param automatic Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/config_remediation_configuration#automatic ConfigRemediationConfiguration#automatic}.
         * @return {@code this}
         */
        public Builder automatic(java.lang.Boolean automatic) {
            this.automatic = automatic;
            return this;
        }

        /**
         * Sets the value of {@link ConfigRemediationConfigurationConfig#getAutomatic}
         * @param automatic Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/config_remediation_configuration#automatic ConfigRemediationConfiguration#automatic}.
         * @return {@code this}
         */
        public Builder automatic(com.hashicorp.cdktf.IResolvable automatic) {
            this.automatic = automatic;
            return this;
        }

        /**
         * Sets the value of {@link ConfigRemediationConfigurationConfig#getExecutionControls}
         * @param executionControls execution_controls block.
         *                          Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/config_remediation_configuration#execution_controls ConfigRemediationConfiguration#execution_controls}
         * @return {@code this}
         */
        public Builder executionControls(imports.aws.config_remediation_configuration.ConfigRemediationConfigurationExecutionControls executionControls) {
            this.executionControls = executionControls;
            return this;
        }

        /**
         * Sets the value of {@link ConfigRemediationConfigurationConfig#getId}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/config_remediation_configuration#id ConfigRemediationConfiguration#id}.
         *           Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         *           If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * @return {@code this}
         */
        public Builder id(java.lang.String id) {
            this.id = id;
            return this;
        }

        /**
         * Sets the value of {@link ConfigRemediationConfigurationConfig#getMaximumAutomaticAttempts}
         * @param maximumAutomaticAttempts Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/config_remediation_configuration#maximum_automatic_attempts ConfigRemediationConfiguration#maximum_automatic_attempts}.
         * @return {@code this}
         */
        public Builder maximumAutomaticAttempts(java.lang.Number maximumAutomaticAttempts) {
            this.maximumAutomaticAttempts = maximumAutomaticAttempts;
            return this;
        }

        /**
         * Sets the value of {@link ConfigRemediationConfigurationConfig#getParameter}
         * @param parameter parameter block.
         *                  Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/config_remediation_configuration#parameter ConfigRemediationConfiguration#parameter}
         * @return {@code this}
         */
        public Builder parameter(com.hashicorp.cdktf.IResolvable parameter) {
            this.parameter = parameter;
            return this;
        }

        /**
         * Sets the value of {@link ConfigRemediationConfigurationConfig#getParameter}
         * @param parameter parameter block.
         *                  Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/config_remediation_configuration#parameter ConfigRemediationConfiguration#parameter}
         * @return {@code this}
         */
        public Builder parameter(java.util.List<? extends imports.aws.config_remediation_configuration.ConfigRemediationConfigurationParameter> parameter) {
            this.parameter = parameter;
            return this;
        }

        /**
         * Sets the value of {@link ConfigRemediationConfigurationConfig#getResourceType}
         * @param resourceType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/config_remediation_configuration#resource_type ConfigRemediationConfiguration#resource_type}.
         * @return {@code this}
         */
        public Builder resourceType(java.lang.String resourceType) {
            this.resourceType = resourceType;
            return this;
        }

        /**
         * Sets the value of {@link ConfigRemediationConfigurationConfig#getRetryAttemptSeconds}
         * @param retryAttemptSeconds Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/config_remediation_configuration#retry_attempt_seconds ConfigRemediationConfiguration#retry_attempt_seconds}.
         * @return {@code this}
         */
        public Builder retryAttemptSeconds(java.lang.Number retryAttemptSeconds) {
            this.retryAttemptSeconds = retryAttemptSeconds;
            return this;
        }

        /**
         * Sets the value of {@link ConfigRemediationConfigurationConfig#getTargetVersion}
         * @param targetVersion Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/config_remediation_configuration#target_version ConfigRemediationConfiguration#target_version}.
         * @return {@code this}
         */
        public Builder targetVersion(java.lang.String targetVersion) {
            this.targetVersion = targetVersion;
            return this;
        }

        /**
         * Sets the value of {@link ConfigRemediationConfigurationConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link ConfigRemediationConfigurationConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link ConfigRemediationConfigurationConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link ConfigRemediationConfigurationConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link ConfigRemediationConfigurationConfig#getDependsOn}
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
         * Sets the value of {@link ConfigRemediationConfigurationConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link ConfigRemediationConfigurationConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link ConfigRemediationConfigurationConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link ConfigRemediationConfigurationConfig#getProvisioners}
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
         * @return a new instance of {@link ConfigRemediationConfigurationConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public ConfigRemediationConfigurationConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link ConfigRemediationConfigurationConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements ConfigRemediationConfigurationConfig {
        private final java.lang.String configRuleName;
        private final java.lang.String targetId;
        private final java.lang.String targetType;
        private final java.lang.Object automatic;
        private final imports.aws.config_remediation_configuration.ConfigRemediationConfigurationExecutionControls executionControls;
        private final java.lang.String id;
        private final java.lang.Number maximumAutomaticAttempts;
        private final java.lang.Object parameter;
        private final java.lang.String resourceType;
        private final java.lang.Number retryAttemptSeconds;
        private final java.lang.String targetVersion;
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
            this.configRuleName = software.amazon.jsii.Kernel.get(this, "configRuleName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.targetId = software.amazon.jsii.Kernel.get(this, "targetId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.targetType = software.amazon.jsii.Kernel.get(this, "targetType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.automatic = software.amazon.jsii.Kernel.get(this, "automatic", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.executionControls = software.amazon.jsii.Kernel.get(this, "executionControls", software.amazon.jsii.NativeType.forClass(imports.aws.config_remediation_configuration.ConfigRemediationConfigurationExecutionControls.class));
            this.id = software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.maximumAutomaticAttempts = software.amazon.jsii.Kernel.get(this, "maximumAutomaticAttempts", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.parameter = software.amazon.jsii.Kernel.get(this, "parameter", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.resourceType = software.amazon.jsii.Kernel.get(this, "resourceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.retryAttemptSeconds = software.amazon.jsii.Kernel.get(this, "retryAttemptSeconds", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.targetVersion = software.amazon.jsii.Kernel.get(this, "targetVersion", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
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
            this.configRuleName = java.util.Objects.requireNonNull(builder.configRuleName, "configRuleName is required");
            this.targetId = java.util.Objects.requireNonNull(builder.targetId, "targetId is required");
            this.targetType = java.util.Objects.requireNonNull(builder.targetType, "targetType is required");
            this.automatic = builder.automatic;
            this.executionControls = builder.executionControls;
            this.id = builder.id;
            this.maximumAutomaticAttempts = builder.maximumAutomaticAttempts;
            this.parameter = builder.parameter;
            this.resourceType = builder.resourceType;
            this.retryAttemptSeconds = builder.retryAttemptSeconds;
            this.targetVersion = builder.targetVersion;
            this.connection = builder.connection;
            this.count = builder.count;
            this.dependsOn = (java.util.List<com.hashicorp.cdktf.ITerraformDependable>)builder.dependsOn;
            this.forEach = builder.forEach;
            this.lifecycle = builder.lifecycle;
            this.provider = builder.provider;
            this.provisioners = (java.util.List<java.lang.Object>)builder.provisioners;
        }

        @Override
        public final java.lang.String getConfigRuleName() {
            return this.configRuleName;
        }

        @Override
        public final java.lang.String getTargetId() {
            return this.targetId;
        }

        @Override
        public final java.lang.String getTargetType() {
            return this.targetType;
        }

        @Override
        public final java.lang.Object getAutomatic() {
            return this.automatic;
        }

        @Override
        public final imports.aws.config_remediation_configuration.ConfigRemediationConfigurationExecutionControls getExecutionControls() {
            return this.executionControls;
        }

        @Override
        public final java.lang.String getId() {
            return this.id;
        }

        @Override
        public final java.lang.Number getMaximumAutomaticAttempts() {
            return this.maximumAutomaticAttempts;
        }

        @Override
        public final java.lang.Object getParameter() {
            return this.parameter;
        }

        @Override
        public final java.lang.String getResourceType() {
            return this.resourceType;
        }

        @Override
        public final java.lang.Number getRetryAttemptSeconds() {
            return this.retryAttemptSeconds;
        }

        @Override
        public final java.lang.String getTargetVersion() {
            return this.targetVersion;
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

            data.set("configRuleName", om.valueToTree(this.getConfigRuleName()));
            data.set("targetId", om.valueToTree(this.getTargetId()));
            data.set("targetType", om.valueToTree(this.getTargetType()));
            if (this.getAutomatic() != null) {
                data.set("automatic", om.valueToTree(this.getAutomatic()));
            }
            if (this.getExecutionControls() != null) {
                data.set("executionControls", om.valueToTree(this.getExecutionControls()));
            }
            if (this.getId() != null) {
                data.set("id", om.valueToTree(this.getId()));
            }
            if (this.getMaximumAutomaticAttempts() != null) {
                data.set("maximumAutomaticAttempts", om.valueToTree(this.getMaximumAutomaticAttempts()));
            }
            if (this.getParameter() != null) {
                data.set("parameter", om.valueToTree(this.getParameter()));
            }
            if (this.getResourceType() != null) {
                data.set("resourceType", om.valueToTree(this.getResourceType()));
            }
            if (this.getRetryAttemptSeconds() != null) {
                data.set("retryAttemptSeconds", om.valueToTree(this.getRetryAttemptSeconds()));
            }
            if (this.getTargetVersion() != null) {
                data.set("targetVersion", om.valueToTree(this.getTargetVersion()));
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
            struct.set("fqn", om.valueToTree("aws.configRemediationConfiguration.ConfigRemediationConfigurationConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            ConfigRemediationConfigurationConfig.Jsii$Proxy that = (ConfigRemediationConfigurationConfig.Jsii$Proxy) o;

            if (!configRuleName.equals(that.configRuleName)) return false;
            if (!targetId.equals(that.targetId)) return false;
            if (!targetType.equals(that.targetType)) return false;
            if (this.automatic != null ? !this.automatic.equals(that.automatic) : that.automatic != null) return false;
            if (this.executionControls != null ? !this.executionControls.equals(that.executionControls) : that.executionControls != null) return false;
            if (this.id != null ? !this.id.equals(that.id) : that.id != null) return false;
            if (this.maximumAutomaticAttempts != null ? !this.maximumAutomaticAttempts.equals(that.maximumAutomaticAttempts) : that.maximumAutomaticAttempts != null) return false;
            if (this.parameter != null ? !this.parameter.equals(that.parameter) : that.parameter != null) return false;
            if (this.resourceType != null ? !this.resourceType.equals(that.resourceType) : that.resourceType != null) return false;
            if (this.retryAttemptSeconds != null ? !this.retryAttemptSeconds.equals(that.retryAttemptSeconds) : that.retryAttemptSeconds != null) return false;
            if (this.targetVersion != null ? !this.targetVersion.equals(that.targetVersion) : that.targetVersion != null) return false;
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
            int result = this.configRuleName.hashCode();
            result = 31 * result + (this.targetId.hashCode());
            result = 31 * result + (this.targetType.hashCode());
            result = 31 * result + (this.automatic != null ? this.automatic.hashCode() : 0);
            result = 31 * result + (this.executionControls != null ? this.executionControls.hashCode() : 0);
            result = 31 * result + (this.id != null ? this.id.hashCode() : 0);
            result = 31 * result + (this.maximumAutomaticAttempts != null ? this.maximumAutomaticAttempts.hashCode() : 0);
            result = 31 * result + (this.parameter != null ? this.parameter.hashCode() : 0);
            result = 31 * result + (this.resourceType != null ? this.resourceType.hashCode() : 0);
            result = 31 * result + (this.retryAttemptSeconds != null ? this.retryAttemptSeconds.hashCode() : 0);
            result = 31 * result + (this.targetVersion != null ? this.targetVersion.hashCode() : 0);
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
