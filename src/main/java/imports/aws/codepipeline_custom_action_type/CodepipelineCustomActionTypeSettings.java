package imports.aws.codepipeline_custom_action_type;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.336Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.codepipelineCustomActionType.CodepipelineCustomActionTypeSettings")
@software.amazon.jsii.Jsii.Proxy(CodepipelineCustomActionTypeSettings.Jsii$Proxy.class)
public interface CodepipelineCustomActionTypeSettings extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline_custom_action_type#entity_url_template CodepipelineCustomActionType#entity_url_template}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getEntityUrlTemplate() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline_custom_action_type#execution_url_template CodepipelineCustomActionType#execution_url_template}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getExecutionUrlTemplate() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline_custom_action_type#revision_url_template CodepipelineCustomActionType#revision_url_template}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getRevisionUrlTemplate() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline_custom_action_type#third_party_configuration_url CodepipelineCustomActionType#third_party_configuration_url}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getThirdPartyConfigurationUrl() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link CodepipelineCustomActionTypeSettings}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link CodepipelineCustomActionTypeSettings}
     */
    public static final class Builder implements software.amazon.jsii.Builder<CodepipelineCustomActionTypeSettings> {
        java.lang.String entityUrlTemplate;
        java.lang.String executionUrlTemplate;
        java.lang.String revisionUrlTemplate;
        java.lang.String thirdPartyConfigurationUrl;

        /**
         * Sets the value of {@link CodepipelineCustomActionTypeSettings#getEntityUrlTemplate}
         * @param entityUrlTemplate Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline_custom_action_type#entity_url_template CodepipelineCustomActionType#entity_url_template}.
         * @return {@code this}
         */
        public Builder entityUrlTemplate(java.lang.String entityUrlTemplate) {
            this.entityUrlTemplate = entityUrlTemplate;
            return this;
        }

        /**
         * Sets the value of {@link CodepipelineCustomActionTypeSettings#getExecutionUrlTemplate}
         * @param executionUrlTemplate Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline_custom_action_type#execution_url_template CodepipelineCustomActionType#execution_url_template}.
         * @return {@code this}
         */
        public Builder executionUrlTemplate(java.lang.String executionUrlTemplate) {
            this.executionUrlTemplate = executionUrlTemplate;
            return this;
        }

        /**
         * Sets the value of {@link CodepipelineCustomActionTypeSettings#getRevisionUrlTemplate}
         * @param revisionUrlTemplate Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline_custom_action_type#revision_url_template CodepipelineCustomActionType#revision_url_template}.
         * @return {@code this}
         */
        public Builder revisionUrlTemplate(java.lang.String revisionUrlTemplate) {
            this.revisionUrlTemplate = revisionUrlTemplate;
            return this;
        }

        /**
         * Sets the value of {@link CodepipelineCustomActionTypeSettings#getThirdPartyConfigurationUrl}
         * @param thirdPartyConfigurationUrl Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline_custom_action_type#third_party_configuration_url CodepipelineCustomActionType#third_party_configuration_url}.
         * @return {@code this}
         */
        public Builder thirdPartyConfigurationUrl(java.lang.String thirdPartyConfigurationUrl) {
            this.thirdPartyConfigurationUrl = thirdPartyConfigurationUrl;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link CodepipelineCustomActionTypeSettings}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public CodepipelineCustomActionTypeSettings build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link CodepipelineCustomActionTypeSettings}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements CodepipelineCustomActionTypeSettings {
        private final java.lang.String entityUrlTemplate;
        private final java.lang.String executionUrlTemplate;
        private final java.lang.String revisionUrlTemplate;
        private final java.lang.String thirdPartyConfigurationUrl;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.entityUrlTemplate = software.amazon.jsii.Kernel.get(this, "entityUrlTemplate", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.executionUrlTemplate = software.amazon.jsii.Kernel.get(this, "executionUrlTemplate", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.revisionUrlTemplate = software.amazon.jsii.Kernel.get(this, "revisionUrlTemplate", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.thirdPartyConfigurationUrl = software.amazon.jsii.Kernel.get(this, "thirdPartyConfigurationUrl", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.entityUrlTemplate = builder.entityUrlTemplate;
            this.executionUrlTemplate = builder.executionUrlTemplate;
            this.revisionUrlTemplate = builder.revisionUrlTemplate;
            this.thirdPartyConfigurationUrl = builder.thirdPartyConfigurationUrl;
        }

        @Override
        public final java.lang.String getEntityUrlTemplate() {
            return this.entityUrlTemplate;
        }

        @Override
        public final java.lang.String getExecutionUrlTemplate() {
            return this.executionUrlTemplate;
        }

        @Override
        public final java.lang.String getRevisionUrlTemplate() {
            return this.revisionUrlTemplate;
        }

        @Override
        public final java.lang.String getThirdPartyConfigurationUrl() {
            return this.thirdPartyConfigurationUrl;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getEntityUrlTemplate() != null) {
                data.set("entityUrlTemplate", om.valueToTree(this.getEntityUrlTemplate()));
            }
            if (this.getExecutionUrlTemplate() != null) {
                data.set("executionUrlTemplate", om.valueToTree(this.getExecutionUrlTemplate()));
            }
            if (this.getRevisionUrlTemplate() != null) {
                data.set("revisionUrlTemplate", om.valueToTree(this.getRevisionUrlTemplate()));
            }
            if (this.getThirdPartyConfigurationUrl() != null) {
                data.set("thirdPartyConfigurationUrl", om.valueToTree(this.getThirdPartyConfigurationUrl()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.codepipelineCustomActionType.CodepipelineCustomActionTypeSettings"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            CodepipelineCustomActionTypeSettings.Jsii$Proxy that = (CodepipelineCustomActionTypeSettings.Jsii$Proxy) o;

            if (this.entityUrlTemplate != null ? !this.entityUrlTemplate.equals(that.entityUrlTemplate) : that.entityUrlTemplate != null) return false;
            if (this.executionUrlTemplate != null ? !this.executionUrlTemplate.equals(that.executionUrlTemplate) : that.executionUrlTemplate != null) return false;
            if (this.revisionUrlTemplate != null ? !this.revisionUrlTemplate.equals(that.revisionUrlTemplate) : that.revisionUrlTemplate != null) return false;
            return this.thirdPartyConfigurationUrl != null ? this.thirdPartyConfigurationUrl.equals(that.thirdPartyConfigurationUrl) : that.thirdPartyConfigurationUrl == null;
        }

        @Override
        public final int hashCode() {
            int result = this.entityUrlTemplate != null ? this.entityUrlTemplate.hashCode() : 0;
            result = 31 * result + (this.executionUrlTemplate != null ? this.executionUrlTemplate.hashCode() : 0);
            result = 31 * result + (this.revisionUrlTemplate != null ? this.revisionUrlTemplate.hashCode() : 0);
            result = 31 * result + (this.thirdPartyConfigurationUrl != null ? this.thirdPartyConfigurationUrl.hashCode() : 0);
            return result;
        }
    }
}
