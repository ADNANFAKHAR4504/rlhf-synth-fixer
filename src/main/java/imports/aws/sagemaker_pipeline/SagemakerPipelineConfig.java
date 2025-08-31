package imports.aws.sagemaker_pipeline;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.339Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.sagemakerPipeline.SagemakerPipelineConfig")
@software.amazon.jsii.Jsii.Proxy(SagemakerPipelineConfig.Jsii$Proxy.class)
public interface SagemakerPipelineConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_pipeline#pipeline_display_name SagemakerPipeline#pipeline_display_name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getPipelineDisplayName();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_pipeline#pipeline_name SagemakerPipeline#pipeline_name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getPipelineName();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_pipeline#id SagemakerPipeline#id}.
     * <p>
     * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
     * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getId() {
        return null;
    }

    /**
     * parallelism_configuration block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_pipeline#parallelism_configuration SagemakerPipeline#parallelism_configuration}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.sagemaker_pipeline.SagemakerPipelineParallelismConfiguration getParallelismConfiguration() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_pipeline#pipeline_definition SagemakerPipeline#pipeline_definition}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getPipelineDefinition() {
        return null;
    }

    /**
     * pipeline_definition_s3_location block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_pipeline#pipeline_definition_s3_location SagemakerPipeline#pipeline_definition_s3_location}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.sagemaker_pipeline.SagemakerPipelinePipelineDefinitionS3Location getPipelineDefinitionS3Location() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_pipeline#pipeline_description SagemakerPipeline#pipeline_description}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getPipelineDescription() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_pipeline#role_arn SagemakerPipeline#role_arn}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getRoleArn() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_pipeline#tags SagemakerPipeline#tags}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTags() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_pipeline#tags_all SagemakerPipeline#tags_all}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsAll() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link SagemakerPipelineConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link SagemakerPipelineConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<SagemakerPipelineConfig> {
        java.lang.String pipelineDisplayName;
        java.lang.String pipelineName;
        java.lang.String id;
        imports.aws.sagemaker_pipeline.SagemakerPipelineParallelismConfiguration parallelismConfiguration;
        java.lang.String pipelineDefinition;
        imports.aws.sagemaker_pipeline.SagemakerPipelinePipelineDefinitionS3Location pipelineDefinitionS3Location;
        java.lang.String pipelineDescription;
        java.lang.String roleArn;
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
         * Sets the value of {@link SagemakerPipelineConfig#getPipelineDisplayName}
         * @param pipelineDisplayName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_pipeline#pipeline_display_name SagemakerPipeline#pipeline_display_name}. This parameter is required.
         * @return {@code this}
         */
        public Builder pipelineDisplayName(java.lang.String pipelineDisplayName) {
            this.pipelineDisplayName = pipelineDisplayName;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerPipelineConfig#getPipelineName}
         * @param pipelineName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_pipeline#pipeline_name SagemakerPipeline#pipeline_name}. This parameter is required.
         * @return {@code this}
         */
        public Builder pipelineName(java.lang.String pipelineName) {
            this.pipelineName = pipelineName;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerPipelineConfig#getId}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_pipeline#id SagemakerPipeline#id}.
         *           Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         *           If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * @return {@code this}
         */
        public Builder id(java.lang.String id) {
            this.id = id;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerPipelineConfig#getParallelismConfiguration}
         * @param parallelismConfiguration parallelism_configuration block.
         *                                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_pipeline#parallelism_configuration SagemakerPipeline#parallelism_configuration}
         * @return {@code this}
         */
        public Builder parallelismConfiguration(imports.aws.sagemaker_pipeline.SagemakerPipelineParallelismConfiguration parallelismConfiguration) {
            this.parallelismConfiguration = parallelismConfiguration;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerPipelineConfig#getPipelineDefinition}
         * @param pipelineDefinition Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_pipeline#pipeline_definition SagemakerPipeline#pipeline_definition}.
         * @return {@code this}
         */
        public Builder pipelineDefinition(java.lang.String pipelineDefinition) {
            this.pipelineDefinition = pipelineDefinition;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerPipelineConfig#getPipelineDefinitionS3Location}
         * @param pipelineDefinitionS3Location pipeline_definition_s3_location block.
         *                                     Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_pipeline#pipeline_definition_s3_location SagemakerPipeline#pipeline_definition_s3_location}
         * @return {@code this}
         */
        public Builder pipelineDefinitionS3Location(imports.aws.sagemaker_pipeline.SagemakerPipelinePipelineDefinitionS3Location pipelineDefinitionS3Location) {
            this.pipelineDefinitionS3Location = pipelineDefinitionS3Location;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerPipelineConfig#getPipelineDescription}
         * @param pipelineDescription Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_pipeline#pipeline_description SagemakerPipeline#pipeline_description}.
         * @return {@code this}
         */
        public Builder pipelineDescription(java.lang.String pipelineDescription) {
            this.pipelineDescription = pipelineDescription;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerPipelineConfig#getRoleArn}
         * @param roleArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_pipeline#role_arn SagemakerPipeline#role_arn}.
         * @return {@code this}
         */
        public Builder roleArn(java.lang.String roleArn) {
            this.roleArn = roleArn;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerPipelineConfig#getTags}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_pipeline#tags SagemakerPipeline#tags}.
         * @return {@code this}
         */
        public Builder tags(java.util.Map<java.lang.String, java.lang.String> tags) {
            this.tags = tags;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerPipelineConfig#getTagsAll}
         * @param tagsAll Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_pipeline#tags_all SagemakerPipeline#tags_all}.
         * @return {@code this}
         */
        public Builder tagsAll(java.util.Map<java.lang.String, java.lang.String> tagsAll) {
            this.tagsAll = tagsAll;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerPipelineConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerPipelineConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerPipelineConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerPipelineConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerPipelineConfig#getDependsOn}
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
         * Sets the value of {@link SagemakerPipelineConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerPipelineConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerPipelineConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link SagemakerPipelineConfig#getProvisioners}
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
         * @return a new instance of {@link SagemakerPipelineConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public SagemakerPipelineConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link SagemakerPipelineConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements SagemakerPipelineConfig {
        private final java.lang.String pipelineDisplayName;
        private final java.lang.String pipelineName;
        private final java.lang.String id;
        private final imports.aws.sagemaker_pipeline.SagemakerPipelineParallelismConfiguration parallelismConfiguration;
        private final java.lang.String pipelineDefinition;
        private final imports.aws.sagemaker_pipeline.SagemakerPipelinePipelineDefinitionS3Location pipelineDefinitionS3Location;
        private final java.lang.String pipelineDescription;
        private final java.lang.String roleArn;
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
            this.pipelineDisplayName = software.amazon.jsii.Kernel.get(this, "pipelineDisplayName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.pipelineName = software.amazon.jsii.Kernel.get(this, "pipelineName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.id = software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.parallelismConfiguration = software.amazon.jsii.Kernel.get(this, "parallelismConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_pipeline.SagemakerPipelineParallelismConfiguration.class));
            this.pipelineDefinition = software.amazon.jsii.Kernel.get(this, "pipelineDefinition", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.pipelineDefinitionS3Location = software.amazon.jsii.Kernel.get(this, "pipelineDefinitionS3Location", software.amazon.jsii.NativeType.forClass(imports.aws.sagemaker_pipeline.SagemakerPipelinePipelineDefinitionS3Location.class));
            this.pipelineDescription = software.amazon.jsii.Kernel.get(this, "pipelineDescription", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.roleArn = software.amazon.jsii.Kernel.get(this, "roleArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
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
            this.pipelineDisplayName = java.util.Objects.requireNonNull(builder.pipelineDisplayName, "pipelineDisplayName is required");
            this.pipelineName = java.util.Objects.requireNonNull(builder.pipelineName, "pipelineName is required");
            this.id = builder.id;
            this.parallelismConfiguration = builder.parallelismConfiguration;
            this.pipelineDefinition = builder.pipelineDefinition;
            this.pipelineDefinitionS3Location = builder.pipelineDefinitionS3Location;
            this.pipelineDescription = builder.pipelineDescription;
            this.roleArn = builder.roleArn;
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
        public final java.lang.String getPipelineDisplayName() {
            return this.pipelineDisplayName;
        }

        @Override
        public final java.lang.String getPipelineName() {
            return this.pipelineName;
        }

        @Override
        public final java.lang.String getId() {
            return this.id;
        }

        @Override
        public final imports.aws.sagemaker_pipeline.SagemakerPipelineParallelismConfiguration getParallelismConfiguration() {
            return this.parallelismConfiguration;
        }

        @Override
        public final java.lang.String getPipelineDefinition() {
            return this.pipelineDefinition;
        }

        @Override
        public final imports.aws.sagemaker_pipeline.SagemakerPipelinePipelineDefinitionS3Location getPipelineDefinitionS3Location() {
            return this.pipelineDefinitionS3Location;
        }

        @Override
        public final java.lang.String getPipelineDescription() {
            return this.pipelineDescription;
        }

        @Override
        public final java.lang.String getRoleArn() {
            return this.roleArn;
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

            data.set("pipelineDisplayName", om.valueToTree(this.getPipelineDisplayName()));
            data.set("pipelineName", om.valueToTree(this.getPipelineName()));
            if (this.getId() != null) {
                data.set("id", om.valueToTree(this.getId()));
            }
            if (this.getParallelismConfiguration() != null) {
                data.set("parallelismConfiguration", om.valueToTree(this.getParallelismConfiguration()));
            }
            if (this.getPipelineDefinition() != null) {
                data.set("pipelineDefinition", om.valueToTree(this.getPipelineDefinition()));
            }
            if (this.getPipelineDefinitionS3Location() != null) {
                data.set("pipelineDefinitionS3Location", om.valueToTree(this.getPipelineDefinitionS3Location()));
            }
            if (this.getPipelineDescription() != null) {
                data.set("pipelineDescription", om.valueToTree(this.getPipelineDescription()));
            }
            if (this.getRoleArn() != null) {
                data.set("roleArn", om.valueToTree(this.getRoleArn()));
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
            struct.set("fqn", om.valueToTree("aws.sagemakerPipeline.SagemakerPipelineConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            SagemakerPipelineConfig.Jsii$Proxy that = (SagemakerPipelineConfig.Jsii$Proxy) o;

            if (!pipelineDisplayName.equals(that.pipelineDisplayName)) return false;
            if (!pipelineName.equals(that.pipelineName)) return false;
            if (this.id != null ? !this.id.equals(that.id) : that.id != null) return false;
            if (this.parallelismConfiguration != null ? !this.parallelismConfiguration.equals(that.parallelismConfiguration) : that.parallelismConfiguration != null) return false;
            if (this.pipelineDefinition != null ? !this.pipelineDefinition.equals(that.pipelineDefinition) : that.pipelineDefinition != null) return false;
            if (this.pipelineDefinitionS3Location != null ? !this.pipelineDefinitionS3Location.equals(that.pipelineDefinitionS3Location) : that.pipelineDefinitionS3Location != null) return false;
            if (this.pipelineDescription != null ? !this.pipelineDescription.equals(that.pipelineDescription) : that.pipelineDescription != null) return false;
            if (this.roleArn != null ? !this.roleArn.equals(that.roleArn) : that.roleArn != null) return false;
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
            int result = this.pipelineDisplayName.hashCode();
            result = 31 * result + (this.pipelineName.hashCode());
            result = 31 * result + (this.id != null ? this.id.hashCode() : 0);
            result = 31 * result + (this.parallelismConfiguration != null ? this.parallelismConfiguration.hashCode() : 0);
            result = 31 * result + (this.pipelineDefinition != null ? this.pipelineDefinition.hashCode() : 0);
            result = 31 * result + (this.pipelineDefinitionS3Location != null ? this.pipelineDefinitionS3Location.hashCode() : 0);
            result = 31 * result + (this.pipelineDescription != null ? this.pipelineDescription.hashCode() : 0);
            result = 31 * result + (this.roleArn != null ? this.roleArn.hashCode() : 0);
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
