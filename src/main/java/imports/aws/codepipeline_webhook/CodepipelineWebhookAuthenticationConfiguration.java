package imports.aws.codepipeline_webhook;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.337Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.codepipelineWebhook.CodepipelineWebhookAuthenticationConfiguration")
@software.amazon.jsii.Jsii.Proxy(CodepipelineWebhookAuthenticationConfiguration.Jsii$Proxy.class)
public interface CodepipelineWebhookAuthenticationConfiguration extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline_webhook#allowed_ip_range CodepipelineWebhook#allowed_ip_range}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getAllowedIpRange() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline_webhook#secret_token CodepipelineWebhook#secret_token}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getSecretToken() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link CodepipelineWebhookAuthenticationConfiguration}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link CodepipelineWebhookAuthenticationConfiguration}
     */
    public static final class Builder implements software.amazon.jsii.Builder<CodepipelineWebhookAuthenticationConfiguration> {
        java.lang.String allowedIpRange;
        java.lang.String secretToken;

        /**
         * Sets the value of {@link CodepipelineWebhookAuthenticationConfiguration#getAllowedIpRange}
         * @param allowedIpRange Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline_webhook#allowed_ip_range CodepipelineWebhook#allowed_ip_range}.
         * @return {@code this}
         */
        public Builder allowedIpRange(java.lang.String allowedIpRange) {
            this.allowedIpRange = allowedIpRange;
            return this;
        }

        /**
         * Sets the value of {@link CodepipelineWebhookAuthenticationConfiguration#getSecretToken}
         * @param secretToken Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codepipeline_webhook#secret_token CodepipelineWebhook#secret_token}.
         * @return {@code this}
         */
        public Builder secretToken(java.lang.String secretToken) {
            this.secretToken = secretToken;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link CodepipelineWebhookAuthenticationConfiguration}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public CodepipelineWebhookAuthenticationConfiguration build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link CodepipelineWebhookAuthenticationConfiguration}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements CodepipelineWebhookAuthenticationConfiguration {
        private final java.lang.String allowedIpRange;
        private final java.lang.String secretToken;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.allowedIpRange = software.amazon.jsii.Kernel.get(this, "allowedIpRange", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.secretToken = software.amazon.jsii.Kernel.get(this, "secretToken", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.allowedIpRange = builder.allowedIpRange;
            this.secretToken = builder.secretToken;
        }

        @Override
        public final java.lang.String getAllowedIpRange() {
            return this.allowedIpRange;
        }

        @Override
        public final java.lang.String getSecretToken() {
            return this.secretToken;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getAllowedIpRange() != null) {
                data.set("allowedIpRange", om.valueToTree(this.getAllowedIpRange()));
            }
            if (this.getSecretToken() != null) {
                data.set("secretToken", om.valueToTree(this.getSecretToken()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.codepipelineWebhook.CodepipelineWebhookAuthenticationConfiguration"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            CodepipelineWebhookAuthenticationConfiguration.Jsii$Proxy that = (CodepipelineWebhookAuthenticationConfiguration.Jsii$Proxy) o;

            if (this.allowedIpRange != null ? !this.allowedIpRange.equals(that.allowedIpRange) : that.allowedIpRange != null) return false;
            return this.secretToken != null ? this.secretToken.equals(that.secretToken) : that.secretToken == null;
        }

        @Override
        public final int hashCode() {
            int result = this.allowedIpRange != null ? this.allowedIpRange.hashCode() : 0;
            result = 31 * result + (this.secretToken != null ? this.secretToken.hashCode() : 0);
            return result;
        }
    }
}
