package imports.aws.bedrockagent_prompt;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.176Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.bedrockagentPrompt.BedrockagentPromptVariant")
@software.amazon.jsii.Jsii.Proxy(BedrockagentPromptVariant.Jsii$Proxy.class)
public interface BedrockagentPromptVariant extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_prompt#name BedrockagentPrompt#name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getName();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_prompt#template_type BedrockagentPrompt#template_type}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getTemplateType();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_prompt#additional_model_request_fields BedrockagentPrompt#additional_model_request_fields}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getAdditionalModelRequestFields() {
        return null;
    }

    /**
     * gen_ai_resource block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_prompt#gen_ai_resource BedrockagentPrompt#gen_ai_resource}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getGenAiResource() {
        return null;
    }

    /**
     * inference_configuration block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_prompt#inference_configuration BedrockagentPrompt#inference_configuration}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getInferenceConfiguration() {
        return null;
    }

    /**
     * metadata block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_prompt#metadata BedrockagentPrompt#metadata}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getMetadata() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_prompt#model_id BedrockagentPrompt#model_id}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getModelId() {
        return null;
    }

    /**
     * template_configuration block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_prompt#template_configuration BedrockagentPrompt#template_configuration}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getTemplateConfiguration() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link BedrockagentPromptVariant}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link BedrockagentPromptVariant}
     */
    public static final class Builder implements software.amazon.jsii.Builder<BedrockagentPromptVariant> {
        java.lang.String name;
        java.lang.String templateType;
        java.lang.String additionalModelRequestFields;
        java.lang.Object genAiResource;
        java.lang.Object inferenceConfiguration;
        java.lang.Object metadata;
        java.lang.String modelId;
        java.lang.Object templateConfiguration;

        /**
         * Sets the value of {@link BedrockagentPromptVariant#getName}
         * @param name Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_prompt#name BedrockagentPrompt#name}. This parameter is required.
         * @return {@code this}
         */
        public Builder name(java.lang.String name) {
            this.name = name;
            return this;
        }

        /**
         * Sets the value of {@link BedrockagentPromptVariant#getTemplateType}
         * @param templateType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_prompt#template_type BedrockagentPrompt#template_type}. This parameter is required.
         * @return {@code this}
         */
        public Builder templateType(java.lang.String templateType) {
            this.templateType = templateType;
            return this;
        }

        /**
         * Sets the value of {@link BedrockagentPromptVariant#getAdditionalModelRequestFields}
         * @param additionalModelRequestFields Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_prompt#additional_model_request_fields BedrockagentPrompt#additional_model_request_fields}.
         * @return {@code this}
         */
        public Builder additionalModelRequestFields(java.lang.String additionalModelRequestFields) {
            this.additionalModelRequestFields = additionalModelRequestFields;
            return this;
        }

        /**
         * Sets the value of {@link BedrockagentPromptVariant#getGenAiResource}
         * @param genAiResource gen_ai_resource block.
         *                      Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_prompt#gen_ai_resource BedrockagentPrompt#gen_ai_resource}
         * @return {@code this}
         */
        public Builder genAiResource(com.hashicorp.cdktf.IResolvable genAiResource) {
            this.genAiResource = genAiResource;
            return this;
        }

        /**
         * Sets the value of {@link BedrockagentPromptVariant#getGenAiResource}
         * @param genAiResource gen_ai_resource block.
         *                      Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_prompt#gen_ai_resource BedrockagentPrompt#gen_ai_resource}
         * @return {@code this}
         */
        public Builder genAiResource(java.util.List<? extends imports.aws.bedrockagent_prompt.BedrockagentPromptVariantGenAiResource> genAiResource) {
            this.genAiResource = genAiResource;
            return this;
        }

        /**
         * Sets the value of {@link BedrockagentPromptVariant#getInferenceConfiguration}
         * @param inferenceConfiguration inference_configuration block.
         *                               Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_prompt#inference_configuration BedrockagentPrompt#inference_configuration}
         * @return {@code this}
         */
        public Builder inferenceConfiguration(com.hashicorp.cdktf.IResolvable inferenceConfiguration) {
            this.inferenceConfiguration = inferenceConfiguration;
            return this;
        }

        /**
         * Sets the value of {@link BedrockagentPromptVariant#getInferenceConfiguration}
         * @param inferenceConfiguration inference_configuration block.
         *                               Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_prompt#inference_configuration BedrockagentPrompt#inference_configuration}
         * @return {@code this}
         */
        public Builder inferenceConfiguration(java.util.List<? extends imports.aws.bedrockagent_prompt.BedrockagentPromptVariantInferenceConfiguration> inferenceConfiguration) {
            this.inferenceConfiguration = inferenceConfiguration;
            return this;
        }

        /**
         * Sets the value of {@link BedrockagentPromptVariant#getMetadata}
         * @param metadata metadata block.
         *                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_prompt#metadata BedrockagentPrompt#metadata}
         * @return {@code this}
         */
        public Builder metadata(com.hashicorp.cdktf.IResolvable metadata) {
            this.metadata = metadata;
            return this;
        }

        /**
         * Sets the value of {@link BedrockagentPromptVariant#getMetadata}
         * @param metadata metadata block.
         *                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_prompt#metadata BedrockagentPrompt#metadata}
         * @return {@code this}
         */
        public Builder metadata(java.util.List<? extends imports.aws.bedrockagent_prompt.BedrockagentPromptVariantMetadata> metadata) {
            this.metadata = metadata;
            return this;
        }

        /**
         * Sets the value of {@link BedrockagentPromptVariant#getModelId}
         * @param modelId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_prompt#model_id BedrockagentPrompt#model_id}.
         * @return {@code this}
         */
        public Builder modelId(java.lang.String modelId) {
            this.modelId = modelId;
            return this;
        }

        /**
         * Sets the value of {@link BedrockagentPromptVariant#getTemplateConfiguration}
         * @param templateConfiguration template_configuration block.
         *                              Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_prompt#template_configuration BedrockagentPrompt#template_configuration}
         * @return {@code this}
         */
        public Builder templateConfiguration(com.hashicorp.cdktf.IResolvable templateConfiguration) {
            this.templateConfiguration = templateConfiguration;
            return this;
        }

        /**
         * Sets the value of {@link BedrockagentPromptVariant#getTemplateConfiguration}
         * @param templateConfiguration template_configuration block.
         *                              Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_prompt#template_configuration BedrockagentPrompt#template_configuration}
         * @return {@code this}
         */
        public Builder templateConfiguration(java.util.List<? extends imports.aws.bedrockagent_prompt.BedrockagentPromptVariantTemplateConfiguration> templateConfiguration) {
            this.templateConfiguration = templateConfiguration;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link BedrockagentPromptVariant}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public BedrockagentPromptVariant build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link BedrockagentPromptVariant}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements BedrockagentPromptVariant {
        private final java.lang.String name;
        private final java.lang.String templateType;
        private final java.lang.String additionalModelRequestFields;
        private final java.lang.Object genAiResource;
        private final java.lang.Object inferenceConfiguration;
        private final java.lang.Object metadata;
        private final java.lang.String modelId;
        private final java.lang.Object templateConfiguration;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.name = software.amazon.jsii.Kernel.get(this, "name", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.templateType = software.amazon.jsii.Kernel.get(this, "templateType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.additionalModelRequestFields = software.amazon.jsii.Kernel.get(this, "additionalModelRequestFields", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.genAiResource = software.amazon.jsii.Kernel.get(this, "genAiResource", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.inferenceConfiguration = software.amazon.jsii.Kernel.get(this, "inferenceConfiguration", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.metadata = software.amazon.jsii.Kernel.get(this, "metadata", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.modelId = software.amazon.jsii.Kernel.get(this, "modelId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.templateConfiguration = software.amazon.jsii.Kernel.get(this, "templateConfiguration", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.name = java.util.Objects.requireNonNull(builder.name, "name is required");
            this.templateType = java.util.Objects.requireNonNull(builder.templateType, "templateType is required");
            this.additionalModelRequestFields = builder.additionalModelRequestFields;
            this.genAiResource = builder.genAiResource;
            this.inferenceConfiguration = builder.inferenceConfiguration;
            this.metadata = builder.metadata;
            this.modelId = builder.modelId;
            this.templateConfiguration = builder.templateConfiguration;
        }

        @Override
        public final java.lang.String getName() {
            return this.name;
        }

        @Override
        public final java.lang.String getTemplateType() {
            return this.templateType;
        }

        @Override
        public final java.lang.String getAdditionalModelRequestFields() {
            return this.additionalModelRequestFields;
        }

        @Override
        public final java.lang.Object getGenAiResource() {
            return this.genAiResource;
        }

        @Override
        public final java.lang.Object getInferenceConfiguration() {
            return this.inferenceConfiguration;
        }

        @Override
        public final java.lang.Object getMetadata() {
            return this.metadata;
        }

        @Override
        public final java.lang.String getModelId() {
            return this.modelId;
        }

        @Override
        public final java.lang.Object getTemplateConfiguration() {
            return this.templateConfiguration;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("name", om.valueToTree(this.getName()));
            data.set("templateType", om.valueToTree(this.getTemplateType()));
            if (this.getAdditionalModelRequestFields() != null) {
                data.set("additionalModelRequestFields", om.valueToTree(this.getAdditionalModelRequestFields()));
            }
            if (this.getGenAiResource() != null) {
                data.set("genAiResource", om.valueToTree(this.getGenAiResource()));
            }
            if (this.getInferenceConfiguration() != null) {
                data.set("inferenceConfiguration", om.valueToTree(this.getInferenceConfiguration()));
            }
            if (this.getMetadata() != null) {
                data.set("metadata", om.valueToTree(this.getMetadata()));
            }
            if (this.getModelId() != null) {
                data.set("modelId", om.valueToTree(this.getModelId()));
            }
            if (this.getTemplateConfiguration() != null) {
                data.set("templateConfiguration", om.valueToTree(this.getTemplateConfiguration()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.bedrockagentPrompt.BedrockagentPromptVariant"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            BedrockagentPromptVariant.Jsii$Proxy that = (BedrockagentPromptVariant.Jsii$Proxy) o;

            if (!name.equals(that.name)) return false;
            if (!templateType.equals(that.templateType)) return false;
            if (this.additionalModelRequestFields != null ? !this.additionalModelRequestFields.equals(that.additionalModelRequestFields) : that.additionalModelRequestFields != null) return false;
            if (this.genAiResource != null ? !this.genAiResource.equals(that.genAiResource) : that.genAiResource != null) return false;
            if (this.inferenceConfiguration != null ? !this.inferenceConfiguration.equals(that.inferenceConfiguration) : that.inferenceConfiguration != null) return false;
            if (this.metadata != null ? !this.metadata.equals(that.metadata) : that.metadata != null) return false;
            if (this.modelId != null ? !this.modelId.equals(that.modelId) : that.modelId != null) return false;
            return this.templateConfiguration != null ? this.templateConfiguration.equals(that.templateConfiguration) : that.templateConfiguration == null;
        }

        @Override
        public final int hashCode() {
            int result = this.name.hashCode();
            result = 31 * result + (this.templateType.hashCode());
            result = 31 * result + (this.additionalModelRequestFields != null ? this.additionalModelRequestFields.hashCode() : 0);
            result = 31 * result + (this.genAiResource != null ? this.genAiResource.hashCode() : 0);
            result = 31 * result + (this.inferenceConfiguration != null ? this.inferenceConfiguration.hashCode() : 0);
            result = 31 * result + (this.metadata != null ? this.metadata.hashCode() : 0);
            result = 31 * result + (this.modelId != null ? this.modelId.hashCode() : 0);
            result = 31 * result + (this.templateConfiguration != null ? this.templateConfiguration.hashCode() : 0);
            return result;
        }
    }
}
