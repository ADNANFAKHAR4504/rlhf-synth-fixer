package imports.aws.sagemaker_flow_definition;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.324Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.sagemakerFlowDefinition.SagemakerFlowDefinitionConfig")
@software.amazon.jsii.Jsii.Proxy(SagemakerFlowDefinitionConfig.Jsii$Proxy.class)
public interface SagemakerFlowDefinitionConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_flow_definition#flow_definition_name SagemakerFlowDefinition#flow_definition_name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getFlowDefinitionName();

    /**
     * human_loop_config block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_flow_definition#human_loop_config SagemakerFlowDefinition#human_loop_config}
     */
    @org.jetbrains.annotations.NotNull imports.aws.sagemaker_flow_definition.SagemakerFlowDefinitionHumanLoopConfig getHumanLoopConfig();

    /**
     * output_config block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_flow_definition#output_config SagemakerFlowDefinition#output_config}
     */
    @org.jetbrains.annotations.NotNull imports.aws.sagemaker_flow_definition.SagemakerFlowDefinitionOutputConfig getOutputConfig();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_flow_definition#role_arn SagemakerFlowDefinition#role_arn}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getRoleArn();

    /**
     * human_loop_activation_config block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_flow_definition#human_loop_activation_config SagemakerFlowDefinition#human_loop_activation_config}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.sagemaker_flow_definition.SagemakerFlowDefinitionHumanLoopActivationConfig getHumanLoopActivationConfig() {
        return null;
    }

    /**
     * human_loop_request_source block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_flow_definition#human_loop_request_source SagemakerFlowDefinition#human_loop_request_source}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.sagemaker_flow_definition.SagemakerFlowDefinitionHumanLoopRequestSource getHumanLoopRequestSource() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_flow_definition#id SagemakerFlowDefinition#id}.
     * <p>
     * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
     * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_flow_definition#tags SagemakerFlowDefinition#tags}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTags() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_flow_definition#tags_all SagemakerFlowDefinition#tags_all}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsAll() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link SagemakerFlowDefinitionConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link SagemakerFlowDefinitionConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<SagemakerFlowDefinitionConfig> {
        java.lang.String flowDefinitionName;
        imports.aws.sagemaker_flow_definition.SagemakerFlowDefinitionHumanLoopConfig humanLoopConfig;
        imports.aws.sagemaker_flow_definition.SagemakerFlowDefinitionOutputConfig outputConfig;
        java.lang.String roleArn;
        imports.aws.sagemaker_flow_definition.SagemakerFlowDefinitionHumanLoopActivationConfig humanLoopActivationConfig;
        imports.aws.sagemaker_flow_definition.SagemakerFlowDefinitionHumanLoopRequestSource humanLoopRequestSource;
        java.lang.String id;
        java.util.Map<java.lang.String, java.lang.String> tags;
        java.util.Map<java.lang.String, java.lang.String> tagsAll;
        java.lang.Object connection;
        java.lang.Object count;
        java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        com.hashicorp.cdktf.ITerraformIterator forEach;
        com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        com.hashicorp.cdktf.TerraformProvider provider;
        java.util.List<java.lang.Object> provisioners;

        /**
         * Sets the value of {@link SagemakerFlowDefinitionConfig#getFlowDefinitionName}
         * @param flowDefinitionName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_flow_definition#flow_definition_name SagemakerFlowDefinition#flow_definition_name}. This parameter is required.
         * @return {@code this}
         */
        public Builder flowDefinitionName(java.lang.String flowDefinitionName) {
            this.flowDefinitionName = flowDefinitionName;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerFlowDefinitionConfig#getHumanLoopConfig}
         * @param humanLoopConfig human_loop_config block. This parameter is required.
         *                        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_flow_definition#human_loop_config SagemakerFlowDefinition#human_loop_config}
         * @return {@code this}
         */
        public Builder humanLoopConfig(imports.aws.sagemaker_flow_definition.SagemakerFlowDefinitionHumanLoopConfig humanLoopConfig) {
            this.humanLoopConfig = humanLoopConfig;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerFlowDefinitionConfig#getOutputConfig}
         * @param outputConfig output_config block. This parameter is required.
         *                     Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_flow_definition#output_config SagemakerFlowDefinition#output_config}
         * @return {@code this}
         */
        public Builder outputConfig(imports.aws.sagemaker_flow_definition.SagemakerFlowDefinitionOutputConfig outputConfig) {
            this.outputConfig = outputConfig;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerFlowDefinitionConfig#getRoleArn}
         * @param roleArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_flow_definition#role_arn SagemakerFlowDefinition#role_arn}. This parameter is required.
         * @return {@code this}
         */
        public Builder roleArn(java.lang.String roleArn) {
            this.roleArn = roleArn;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerFlowDefinitionConfig#getHumanLoopActivationConfig}
         * @param humanLoopActivationConfig human_loop_activation_config block.
         *                                  Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_flow_definition#human_loop_activation_config SagemakerFlowDefinition#human_loop_activation_config}
         * @return {@code this}
         */
        public Builder humanLoopActivationConfig(imports.aws.sagemaker_flow_definition.SagemakerFlowDefinitionHumanLoopActivationConfig humanLoopActivationConfig) {
            this.humanLoopActivationConfig = humanLoopActivationConfig;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerFlowDefinitionConfig#getHumanLoopRequestSource}
         * @param humanLoopRequestSource human_loop_request_source block.
         *                               Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_flow_definition#human_loop_request_source SagemakerFlowDefinition#human_loop_request_source}
         * @return {@code this}
         */
        public Builder humanLoopRequestSource(imports.aws.sagemaker_flow_definition.SagemakerFlowDefinitionHumanLoopRequestSource humanLoopRequestSource) {
            this.humanLoopRequestSource = humanLoopRequestSource;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerFlowDefinitionConfig#getId}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_flow_definition#id SagemakerFlowDefinition#id}.
         *           Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         *           If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * @return {@code this}
         */
        public Builder id(java.lang.String id) {
            this.id = id;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerFlowDefinitionConfig#getTags}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_flow_definition#tags SagemakerFlowDefinition#tags}.
         * @return {@code this}
         */
        public Builder tags(java.util.Map<java.lang.String, java.lang.String> tags) {
            this.tags = tags;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerFlowDefinitionConfig#getTagsAll}
         * @param tagsAll Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_flow_definition#tags_all SagemakerFlowDefinition#tags_all}.
         * @return {@code this}
         */
        public Builder tagsAll(java.util.Map<java.lang.String, java.lang.String> tagsAll) {
            this.tagsAll = tagsAll;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerFlowDefinitionConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerFlowDefinitionConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerFlowDefinitionConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerFlowDefinitionConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerFlowDefinitionConfig#getDependsOn}
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
         * Sets the value of {@link SagemakerFlowDefinitionConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerFlowDefinitionConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerFlowDefinitionConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerFlowDefinitionConfig#getProvisioners}
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
         * @return a new instance of {@link SagemakerFlowDefinitionConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public SagemakerFlowDefinitionConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link SagemakerFlowDefinitionConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements SagemakerFlowDefinitionConfig {
        private final java.lang.String flowDefinitionName;
        private final imports.aws.sagemaker_flow_definition.SagemakerFlowDefinitionHumanLoopConfig humanLoopConfig;
        private final imports.aws.sagemaker_flow_definition.SagemakerFlowDefinitionOutputConfig outputConfig;
        private final java.lang.String roleArn;
        private final imports.aws.sagemaker_flow_definition.SagemakerFlowDefinitionHumanLoopActivationConfig humanLoopActivationConfig;
        private final imports.aws.sagemaker_flow_definition.SagemakerFlowDefinitionHumanLoopRequestSource humanLoopRequestSource;
        private final java.lang.String id;
        private final java.util.Map<java.lang.String, java.lang.String> tags;
        private final java.util.Map<java.lang.String, java.lang.String> tagsAll;
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
            this.flowDefinitionName = software.amazon.jsii.Kernel.get(this, "flowDefinitionName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.humanLoopConfig = software.amazon.jsii.Kernel.get(this, "humanLoopConfig", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_flow_definition.SagemakerFlowDefinitionHumanLoopConfig.class));
            this.outputConfig = software.amazon.jsii.Kernel.get(this, "outputConfig", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_flow_definition.SagemakerFlowDefinitionOutputConfig.class));
            this.roleArn = software.amazon.jsii.Kernel.get(this, "roleArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.humanLoopActivationConfig = software.amazon.jsii.Kernel.get(this, "humanLoopActivationConfig", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_flow_definition.SagemakerFlowDefinitionHumanLoopActivationConfig.class));
            this.humanLoopRequestSource = software.amazon.jsii.Kernel.get(this, "humanLoopRequestSource", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_flow_definition.SagemakerFlowDefinitionHumanLoopRequestSource.class));
            this.id = software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.tags = software.amazon.jsii.Kernel.get(this, "tags", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.tagsAll = software.amazon.jsii.Kernel.get(this, "tagsAll", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
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
            this.flowDefinitionName = java.util.Objects.requireNonNull(builder.flowDefinitionName, "flowDefinitionName is required");
            this.humanLoopConfig = java.util.Objects.requireNonNull(builder.humanLoopConfig, "humanLoopConfig is required");
            this.outputConfig = java.util.Objects.requireNonNull(builder.outputConfig, "outputConfig is required");
            this.roleArn = java.util.Objects.requireNonNull(builder.roleArn, "roleArn is required");
            this.humanLoopActivationConfig = builder.humanLoopActivationConfig;
            this.humanLoopRequestSource = builder.humanLoopRequestSource;
            this.id = builder.id;
            this.tags = builder.tags;
            this.tagsAll = builder.tagsAll;
            this.connection = builder.connection;
            this.count = builder.count;
            this.dependsOn = (java.util.List<com.hashicorp.cdktf.ITerraformDependable>)builder.dependsOn;
            this.forEach = builder.forEach;
            this.lifecycle = builder.lifecycle;
            this.provider = builder.provider;
            this.provisioners = (java.util.List<java.lang.Object>)builder.provisioners;
        }

        @Override
        public final java.lang.String getFlowDefinitionName() {
            return this.flowDefinitionName;
        }

        @Override
        public final imports.aws.sagemaker_flow_definition.SagemakerFlowDefinitionHumanLoopConfig getHumanLoopConfig() {
            return this.humanLoopConfig;
        }

        @Override
        public final imports.aws.sagemaker_flow_definition.SagemakerFlowDefinitionOutputConfig getOutputConfig() {
            return this.outputConfig;
        }

        @Override
        public final java.lang.String getRoleArn() {
            return this.roleArn;
        }

        @Override
        public final imports.aws.sagemaker_flow_definition.SagemakerFlowDefinitionHumanLoopActivationConfig getHumanLoopActivationConfig() {
            return this.humanLoopActivationConfig;
        }

        @Override
        public final imports.aws.sagemaker_flow_definition.SagemakerFlowDefinitionHumanLoopRequestSource getHumanLoopRequestSource() {
            return this.humanLoopRequestSource;
        }

        @Override
        public final java.lang.String getId() {
            return this.id;
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

            data.set("flowDefinitionName", om.valueToTree(this.getFlowDefinitionName()));
            data.set("humanLoopConfig", om.valueToTree(this.getHumanLoopConfig()));
            data.set("outputConfig", om.valueToTree(this.getOutputConfig()));
            data.set("roleArn", om.valueToTree(this.getRoleArn()));
            if (this.getHumanLoopActivationConfig() != null) {
                data.set("humanLoopActivationConfig", om.valueToTree(this.getHumanLoopActivationConfig()));
            }
            if (this.getHumanLoopRequestSource() != null) {
                data.set("humanLoopRequestSource", om.valueToTree(this.getHumanLoopRequestSource()));
            }
            if (this.getId() != null) {
                data.set("id", om.valueToTree(this.getId()));
            }
            if (this.getTags() != null) {
                data.set("tags", om.valueToTree(this.getTags()));
            }
            if (this.getTagsAll() != null) {
                data.set("tagsAll", om.valueToTree(this.getTagsAll()));
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
            struct.set("fqn", om.valueToTree("aws.sagemakerFlowDefinition.SagemakerFlowDefinitionConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            SagemakerFlowDefinitionConfig.Jsii$Proxy that = (SagemakerFlowDefinitionConfig.Jsii$Proxy) o;

            if (!flowDefinitionName.equals(that.flowDefinitionName)) return false;
            if (!humanLoopConfig.equals(that.humanLoopConfig)) return false;
            if (!outputConfig.equals(that.outputConfig)) return false;
            if (!roleArn.equals(that.roleArn)) return false;
            if (this.humanLoopActivationConfig != null ? !this.humanLoopActivationConfig.equals(that.humanLoopActivationConfig) : that.humanLoopActivationConfig != null) return false;
            if (this.humanLoopRequestSource != null ? !this.humanLoopRequestSource.equals(that.humanLoopRequestSource) : that.humanLoopRequestSource != null) return false;
            if (this.id != null ? !this.id.equals(that.id) : that.id != null) return false;
            if (this.tags != null ? !this.tags.equals(that.tags) : that.tags != null) return false;
            if (this.tagsAll != null ? !this.tagsAll.equals(that.tagsAll) : that.tagsAll != null) return false;
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
            int result = this.flowDefinitionName.hashCode();
            result = 31 * result + (this.humanLoopConfig.hashCode());
            result = 31 * result + (this.outputConfig.hashCode());
            result = 31 * result + (this.roleArn.hashCode());
            result = 31 * result + (this.humanLoopActivationConfig != null ? this.humanLoopActivationConfig.hashCode() : 0);
            result = 31 * result + (this.humanLoopRequestSource != null ? this.humanLoopRequestSource.hashCode() : 0);
            result = 31 * result + (this.id != null ? this.id.hashCode() : 0);
            result = 31 * result + (this.tags != null ? this.tags.hashCode() : 0);
            result = 31 * result + (this.tagsAll != null ? this.tagsAll.hashCode() : 0);
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
