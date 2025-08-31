package imports.aws.codepipeline_webhook;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.337Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.codepipelineWebhook.CodepipelineWebhookFilter")
@software.amazon.jsii.Jsii.Proxy(CodepipelineWebhookFilter.Jsii$Proxy.class)
public interface CodepipelineWebhookFilter extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline_webhook#json_path CodepipelineWebhook#json_path}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getJsonPath();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline_webhook#match_equals CodepipelineWebhook#match_equals}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getMatchEquals();

    /**
     * @return a {@link Builder} of {@link CodepipelineWebhookFilter}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link CodepipelineWebhookFilter}
     */
    public static final class Builder implements software.amazon.jsii.Builder<CodepipelineWebhookFilter> {
        java.lang.String jsonPath;
        java.lang.String matchEquals;

        /**
         * Sets the value of {@link CodepipelineWebhookFilter#getJsonPath}
         * @param jsonPath Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline_webhook#json_path CodepipelineWebhook#json_path}. This parameter is required.
         * @return {@code this}
         */
        public Builder jsonPath(java.lang.String jsonPath) {
            this.jsonPath = jsonPath;
            return this;
        }

        /**
         * Sets the value of {@link CodepipelineWebhookFilter#getMatchEquals}
         * @param matchEquals Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline_webhook#match_equals CodepipelineWebhook#match_equals}. This parameter is required.
         * @return {@code this}
         */
        public Builder matchEquals(java.lang.String matchEquals) {
            this.matchEquals = matchEquals;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link CodepipelineWebhookFilter}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public CodepipelineWebhookFilter build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link CodepipelineWebhookFilter}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements CodepipelineWebhookFilter {
        private final java.lang.String jsonPath;
        private final java.lang.String matchEquals;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.jsonPath = software.amazon.jsii.Kernel.get(this, "jsonPath", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.matchEquals = software.amazon.jsii.Kernel.get(this, "matchEquals", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.jsonPath = java.util.Objects.requireNonNull(builder.jsonPath, "jsonPath is required");
            this.matchEquals = java.util.Objects.requireNonNull(builder.matchEquals, "matchEquals is required");
        }

        @Override
        public final java.lang.String getJsonPath() {
            return this.jsonPath;
        }

        @Override
        public final java.lang.String getMatchEquals() {
            return this.matchEquals;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("jsonPath", om.valueToTree(this.getJsonPath()));
            data.set("matchEquals", om.valueToTree(this.getMatchEquals()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.codepipelineWebhook.CodepipelineWebhookFilter"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            CodepipelineWebhookFilter.Jsii$Proxy that = (CodepipelineWebhookFilter.Jsii$Proxy) o;

            if (!jsonPath.equals(that.jsonPath)) return false;
            return this.matchEquals.equals(that.matchEquals);
        }

        @Override
        public final int hashCode() {
            int result = this.jsonPath.hashCode();
            result = 31 * result + (this.matchEquals.hashCode());
            return result;
        }
    }
}
