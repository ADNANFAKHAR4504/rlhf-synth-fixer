package imports.aws.codepipeline;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.330Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.codepipeline.CodepipelineStageOnFailureRetryConfiguration")
@software.amazon.jsii.Jsii.Proxy(CodepipelineStageOnFailureRetryConfiguration.Jsii$Proxy.class)
public interface CodepipelineStageOnFailureRetryConfiguration extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#retry_mode Codepipeline#retry_mode}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getRetryMode() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link CodepipelineStageOnFailureRetryConfiguration}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link CodepipelineStageOnFailureRetryConfiguration}
     */
    public static final class Builder implements software.amazon.jsii.Builder<CodepipelineStageOnFailureRetryConfiguration> {
        java.lang.String retryMode;

        /**
         * Sets the value of {@link CodepipelineStageOnFailureRetryConfiguration#getRetryMode}
         * @param retryMode Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline#retry_mode Codepipeline#retry_mode}.
         * @return {@code this}
         */
        public Builder retryMode(java.lang.String retryMode) {
            this.retryMode = retryMode;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link CodepipelineStageOnFailureRetryConfiguration}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public CodepipelineStageOnFailureRetryConfiguration build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link CodepipelineStageOnFailureRetryConfiguration}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements CodepipelineStageOnFailureRetryConfiguration {
        private final java.lang.String retryMode;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.retryMode = software.amazon.jsii.Kernel.get(this, "retryMode", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.retryMode = builder.retryMode;
        }

        @Override
        public final java.lang.String getRetryMode() {
            return this.retryMode;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getRetryMode() != null) {
                data.set("retryMode", om.valueToTree(this.getRetryMode()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.codepipeline.CodepipelineStageOnFailureRetryConfiguration"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            CodepipelineStageOnFailureRetryConfiguration.Jsii$Proxy that = (CodepipelineStageOnFailureRetryConfiguration.Jsii$Proxy) o;

            return this.retryMode != null ? this.retryMode.equals(that.retryMode) : that.retryMode == null;
        }

        @Override
        public final int hashCode() {
            int result = this.retryMode != null ? this.retryMode.hashCode() : 0;
            return result;
        }
    }
}
