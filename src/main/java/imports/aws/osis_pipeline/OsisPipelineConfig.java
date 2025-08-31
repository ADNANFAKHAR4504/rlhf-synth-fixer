package imports.aws.osis_pipeline;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.050Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.osisPipeline.OsisPipelineConfig")
@software.amazon.jsii.Jsii.Proxy(OsisPipelineConfig.Jsii$Proxy.class)
public interface OsisPipelineConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/osis_pipeline#max_units OsisPipeline#max_units}.
     */
    @org.jetbrains.annotations.NotNull java.lang.Number getMaxUnits();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/osis_pipeline#min_units OsisPipeline#min_units}.
     */
    @org.jetbrains.annotations.NotNull java.lang.Number getMinUnits();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/osis_pipeline#pipeline_configuration_body OsisPipeline#pipeline_configuration_body}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getPipelineConfigurationBody();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/osis_pipeline#pipeline_name OsisPipeline#pipeline_name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getPipelineName();

    /**
     * buffer_options block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/osis_pipeline#buffer_options OsisPipeline#buffer_options}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getBufferOptions() {
        return null;
    }

    /**
     * encryption_at_rest_options block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/osis_pipeline#encryption_at_rest_options OsisPipeline#encryption_at_rest_options}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getEncryptionAtRestOptions() {
        return null;
    }

    /**
     * log_publishing_options block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/osis_pipeline#log_publishing_options OsisPipeline#log_publishing_options}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getLogPublishingOptions() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/osis_pipeline#tags OsisPipeline#tags}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTags() {
        return null;
    }

    /**
     * timeouts block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/osis_pipeline#timeouts OsisPipeline#timeouts}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.osis_pipeline.OsisPipelineTimeouts getTimeouts() {
        return null;
    }

    /**
     * vpc_options block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/osis_pipeline#vpc_options OsisPipeline#vpc_options}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getVpcOptions() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link OsisPipelineConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link OsisPipelineConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<OsisPipelineConfig> {
        java.lang.Number maxUnits;
        java.lang.Number minUnits;
        java.lang.String pipelineConfigurationBody;
        java.lang.String pipelineName;
        java.lang.Object bufferOptions;
        java.lang.Object encryptionAtRestOptions;
        java.lang.Object logPublishingOptions;
        java.util.Map<java.lang.String, java.lang.String> tags;
        imports.aws.osis_pipeline.OsisPipelineTimeouts timeouts;
        java.lang.Object vpcOptions;
        java.lang.Object connection;
        java.lang.Object count;
        java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        com.hashicorp.cdktf.ITerraformIterator forEach;
        com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        com.hashicorp.cdktf.TerraformProvider provider;
        java.util.List<java.lang.Object> provisioners;

        /**
         * Sets the value of {@link OsisPipelineConfig#getMaxUnits}
         * @param maxUnits Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/osis_pipeline#max_units OsisPipeline#max_units}. This parameter is required.
         * @return {@code this}
         */
        public Builder maxUnits(java.lang.Number maxUnits) {
            this.maxUnits = maxUnits;
            return this;
        }

        /**
         * Sets the value of {@link OsisPipelineConfig#getMinUnits}
         * @param minUnits Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/osis_pipeline#min_units OsisPipeline#min_units}. This parameter is required.
         * @return {@code this}
         */
        public Builder minUnits(java.lang.Number minUnits) {
            this.minUnits = minUnits;
            return this;
        }

        /**
         * Sets the value of {@link OsisPipelineConfig#getPipelineConfigurationBody}
         * @param pipelineConfigurationBody Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/osis_pipeline#pipeline_configuration_body OsisPipeline#pipeline_configuration_body}. This parameter is required.
         * @return {@code this}
         */
        public Builder pipelineConfigurationBody(java.lang.String pipelineConfigurationBody) {
            this.pipelineConfigurationBody = pipelineConfigurationBody;
            return this;
        }

        /**
         * Sets the value of {@link OsisPipelineConfig#getPipelineName}
         * @param pipelineName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/osis_pipeline#pipeline_name OsisPipeline#pipeline_name}. This parameter is required.
         * @return {@code this}
         */
        public Builder pipelineName(java.lang.String pipelineName) {
            this.pipelineName = pipelineName;
            return this;
        }

        /**
         * Sets the value of {@link OsisPipelineConfig#getBufferOptions}
         * @param bufferOptions buffer_options block.
         *                      Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/osis_pipeline#buffer_options OsisPipeline#buffer_options}
         * @return {@code this}
         */
        public Builder bufferOptions(com.hashicorp.cdktf.IResolvable bufferOptions) {
            this.bufferOptions = bufferOptions;
            return this;
        }

        /**
         * Sets the value of {@link OsisPipelineConfig#getBufferOptions}
         * @param bufferOptions buffer_options block.
         *                      Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/osis_pipeline#buffer_options OsisPipeline#buffer_options}
         * @return {@code this}
         */
        public Builder bufferOptions(java.util.List<? extends imports.aws.osis_pipeline.OsisPipelineBufferOptions> bufferOptions) {
            this.bufferOptions = bufferOptions;
            return this;
        }

        /**
         * Sets the value of {@link OsisPipelineConfig#getEncryptionAtRestOptions}
         * @param encryptionAtRestOptions encryption_at_rest_options block.
         *                                Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/osis_pipeline#encryption_at_rest_options OsisPipeline#encryption_at_rest_options}
         * @return {@code this}
         */
        public Builder encryptionAtRestOptions(com.hashicorp.cdktf.IResolvable encryptionAtRestOptions) {
            this.encryptionAtRestOptions = encryptionAtRestOptions;
            return this;
        }

        /**
         * Sets the value of {@link OsisPipelineConfig#getEncryptionAtRestOptions}
         * @param encryptionAtRestOptions encryption_at_rest_options block.
         *                                Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/osis_pipeline#encryption_at_rest_options OsisPipeline#encryption_at_rest_options}
         * @return {@code this}
         */
        public Builder encryptionAtRestOptions(java.util.List<? extends imports.aws.osis_pipeline.OsisPipelineEncryptionAtRestOptions> encryptionAtRestOptions) {
            this.encryptionAtRestOptions = encryptionAtRestOptions;
            return this;
        }

        /**
         * Sets the value of {@link OsisPipelineConfig#getLogPublishingOptions}
         * @param logPublishingOptions log_publishing_options block.
         *                             Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/osis_pipeline#log_publishing_options OsisPipeline#log_publishing_options}
         * @return {@code this}
         */
        public Builder logPublishingOptions(com.hashicorp.cdktf.IResolvable logPublishingOptions) {
            this.logPublishingOptions = logPublishingOptions;
            return this;
        }

        /**
         * Sets the value of {@link OsisPipelineConfig#getLogPublishingOptions}
         * @param logPublishingOptions log_publishing_options block.
         *                             Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/osis_pipeline#log_publishing_options OsisPipeline#log_publishing_options}
         * @return {@code this}
         */
        public Builder logPublishingOptions(java.util.List<? extends imports.aws.osis_pipeline.OsisPipelineLogPublishingOptions> logPublishingOptions) {
            this.logPublishingOptions = logPublishingOptions;
            return this;
        }

        /**
         * Sets the value of {@link OsisPipelineConfig#getTags}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/osis_pipeline#tags OsisPipeline#tags}.
         * @return {@code this}
         */
        public Builder tags(java.util.Map<java.lang.String, java.lang.String> tags) {
            this.tags = tags;
            return this;
        }

        /**
         * Sets the value of {@link OsisPipelineConfig#getTimeouts}
         * @param timeouts timeouts block.
         *                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/osis_pipeline#timeouts OsisPipeline#timeouts}
         * @return {@code this}
         */
        public Builder timeouts(imports.aws.osis_pipeline.OsisPipelineTimeouts timeouts) {
            this.timeouts = timeouts;
            return this;
        }

        /**
         * Sets the value of {@link OsisPipelineConfig#getVpcOptions}
         * @param vpcOptions vpc_options block.
         *                   Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/osis_pipeline#vpc_options OsisPipeline#vpc_options}
         * @return {@code this}
         */
        public Builder vpcOptions(com.hashicorp.cdktf.IResolvable vpcOptions) {
            this.vpcOptions = vpcOptions;
            return this;
        }

        /**
         * Sets the value of {@link OsisPipelineConfig#getVpcOptions}
         * @param vpcOptions vpc_options block.
         *                   Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/osis_pipeline#vpc_options OsisPipeline#vpc_options}
         * @return {@code this}
         */
        public Builder vpcOptions(java.util.List<? extends imports.aws.osis_pipeline.OsisPipelineVpcOptions> vpcOptions) {
            this.vpcOptions = vpcOptions;
            return this;
        }

        /**
         * Sets the value of {@link OsisPipelineConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link OsisPipelineConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link OsisPipelineConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link OsisPipelineConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link OsisPipelineConfig#getDependsOn}
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
         * Sets the value of {@link OsisPipelineConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link OsisPipelineConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link OsisPipelineConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link OsisPipelineConfig#getProvisioners}
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
         * @return a new instance of {@link OsisPipelineConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public OsisPipelineConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link OsisPipelineConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements OsisPipelineConfig {
        private final java.lang.Number maxUnits;
        private final java.lang.Number minUnits;
        private final java.lang.String pipelineConfigurationBody;
        private final java.lang.String pipelineName;
        private final java.lang.Object bufferOptions;
        private final java.lang.Object encryptionAtRestOptions;
        private final java.lang.Object logPublishingOptions;
        private final java.util.Map<java.lang.String, java.lang.String> tags;
        private final imports.aws.osis_pipeline.OsisPipelineTimeouts timeouts;
        private final java.lang.Object vpcOptions;
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
            this.maxUnits = software.amazon.jsii.Kernel.get(this, "maxUnits", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.minUnits = software.amazon.jsii.Kernel.get(this, "minUnits", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.pipelineConfigurationBody = software.amazon.jsii.Kernel.get(this, "pipelineConfigurationBody", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.pipelineName = software.amazon.jsii.Kernel.get(this, "pipelineName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.bufferOptions = software.amazon.jsii.Kernel.get(this, "bufferOptions", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.encryptionAtRestOptions = software.amazon.jsii.Kernel.get(this, "encryptionAtRestOptions", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.logPublishingOptions = software.amazon.jsii.Kernel.get(this, "logPublishingOptions", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.tags = software.amazon.jsii.Kernel.get(this, "tags", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.timeouts = software.amazon.jsii.Kernel.get(this, "timeouts", software.amazon.jsii.NativeType.forClass(imports.aws.osis_pipeline.OsisPipelineTimeouts.class));
            this.vpcOptions = software.amazon.jsii.Kernel.get(this, "vpcOptions", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
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
            this.maxUnits = java.util.Objects.requireNonNull(builder.maxUnits, "maxUnits is required");
            this.minUnits = java.util.Objects.requireNonNull(builder.minUnits, "minUnits is required");
            this.pipelineConfigurationBody = java.util.Objects.requireNonNull(builder.pipelineConfigurationBody, "pipelineConfigurationBody is required");
            this.pipelineName = java.util.Objects.requireNonNull(builder.pipelineName, "pipelineName is required");
            this.bufferOptions = builder.bufferOptions;
            this.encryptionAtRestOptions = builder.encryptionAtRestOptions;
            this.logPublishingOptions = builder.logPublishingOptions;
            this.tags = builder.tags;
            this.timeouts = builder.timeouts;
            this.vpcOptions = builder.vpcOptions;
            this.connection = builder.connection;
            this.count = builder.count;
            this.dependsOn = (java.util.List<com.hashicorp.cdktf.ITerraformDependable>)builder.dependsOn;
            this.forEach = builder.forEach;
            this.lifecycle = builder.lifecycle;
            this.provider = builder.provider;
            this.provisioners = (java.util.List<java.lang.Object>)builder.provisioners;
        }

        @Override
        public final java.lang.Number getMaxUnits() {
            return this.maxUnits;
        }

        @Override
        public final java.lang.Number getMinUnits() {
            return this.minUnits;
        }

        @Override
        public final java.lang.String getPipelineConfigurationBody() {
            return this.pipelineConfigurationBody;
        }

        @Override
        public final java.lang.String getPipelineName() {
            return this.pipelineName;
        }

        @Override
        public final java.lang.Object getBufferOptions() {
            return this.bufferOptions;
        }

        @Override
        public final java.lang.Object getEncryptionAtRestOptions() {
            return this.encryptionAtRestOptions;
        }

        @Override
        public final java.lang.Object getLogPublishingOptions() {
            return this.logPublishingOptions;
        }

        @Override
        public final java.util.Map<java.lang.String, java.lang.String> getTags() {
            return this.tags;
        }

        @Override
        public final imports.aws.osis_pipeline.OsisPipelineTimeouts getTimeouts() {
            return this.timeouts;
        }

        @Override
        public final java.lang.Object getVpcOptions() {
            return this.vpcOptions;
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

            data.set("maxUnits", om.valueToTree(this.getMaxUnits()));
            data.set("minUnits", om.valueToTree(this.getMinUnits()));
            data.set("pipelineConfigurationBody", om.valueToTree(this.getPipelineConfigurationBody()));
            data.set("pipelineName", om.valueToTree(this.getPipelineName()));
            if (this.getBufferOptions() != null) {
                data.set("bufferOptions", om.valueToTree(this.getBufferOptions()));
            }
            if (this.getEncryptionAtRestOptions() != null) {
                data.set("encryptionAtRestOptions", om.valueToTree(this.getEncryptionAtRestOptions()));
            }
            if (this.getLogPublishingOptions() != null) {
                data.set("logPublishingOptions", om.valueToTree(this.getLogPublishingOptions()));
            }
            if (this.getTags() != null) {
                data.set("tags", om.valueToTree(this.getTags()));
            }
            if (this.getTimeouts() != null) {
                data.set("timeouts", om.valueToTree(this.getTimeouts()));
            }
            if (this.getVpcOptions() != null) {
                data.set("vpcOptions", om.valueToTree(this.getVpcOptions()));
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
            struct.set("fqn", om.valueToTree("aws.osisPipeline.OsisPipelineConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            OsisPipelineConfig.Jsii$Proxy that = (OsisPipelineConfig.Jsii$Proxy) o;

            if (!maxUnits.equals(that.maxUnits)) return false;
            if (!minUnits.equals(that.minUnits)) return false;
            if (!pipelineConfigurationBody.equals(that.pipelineConfigurationBody)) return false;
            if (!pipelineName.equals(that.pipelineName)) return false;
            if (this.bufferOptions != null ? !this.bufferOptions.equals(that.bufferOptions) : that.bufferOptions != null) return false;
            if (this.encryptionAtRestOptions != null ? !this.encryptionAtRestOptions.equals(that.encryptionAtRestOptions) : that.encryptionAtRestOptions != null) return false;
            if (this.logPublishingOptions != null ? !this.logPublishingOptions.equals(that.logPublishingOptions) : that.logPublishingOptions != null) return false;
            if (this.tags != null ? !this.tags.equals(that.tags) : that.tags != null) return false;
            if (this.timeouts != null ? !this.timeouts.equals(that.timeouts) : that.timeouts != null) return false;
            if (this.vpcOptions != null ? !this.vpcOptions.equals(that.vpcOptions) : that.vpcOptions != null) return false;
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
            int result = this.maxUnits.hashCode();
            result = 31 * result + (this.minUnits.hashCode());
            result = 31 * result + (this.pipelineConfigurationBody.hashCode());
            result = 31 * result + (this.pipelineName.hashCode());
            result = 31 * result + (this.bufferOptions != null ? this.bufferOptions.hashCode() : 0);
            result = 31 * result + (this.encryptionAtRestOptions != null ? this.encryptionAtRestOptions.hashCode() : 0);
            result = 31 * result + (this.logPublishingOptions != null ? this.logPublishingOptions.hashCode() : 0);
            result = 31 * result + (this.tags != null ? this.tags.hashCode() : 0);
            result = 31 * result + (this.timeouts != null ? this.timeouts.hashCode() : 0);
            result = 31 * result + (this.vpcOptions != null ? this.vpcOptions.hashCode() : 0);
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
