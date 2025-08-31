package imports.aws.lexv2_models_bot_version;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.549Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.lexv2ModelsBotVersion.Lexv2ModelsBotVersionLocaleSpecification")
@software.amazon.jsii.Jsii.Proxy(Lexv2ModelsBotVersionLocaleSpecification.Jsii$Proxy.class)
public interface Lexv2ModelsBotVersionLocaleSpecification extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_bot_version#source_bot_version Lexv2ModelsBotVersion#source_bot_version}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getSourceBotVersion();

    /**
     * @return a {@link Builder} of {@link Lexv2ModelsBotVersionLocaleSpecification}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link Lexv2ModelsBotVersionLocaleSpecification}
     */
    public static final class Builder implements software.amazon.jsii.Builder<Lexv2ModelsBotVersionLocaleSpecification> {
        java.lang.String sourceBotVersion;

        /**
         * Sets the value of {@link Lexv2ModelsBotVersionLocaleSpecification#getSourceBotVersion}
         * @param sourceBotVersion Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_bot_version#source_bot_version Lexv2ModelsBotVersion#source_bot_version}. This parameter is required.
         * @return {@code this}
         */
        public Builder sourceBotVersion(java.lang.String sourceBotVersion) {
            this.sourceBotVersion = sourceBotVersion;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link Lexv2ModelsBotVersionLocaleSpecification}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public Lexv2ModelsBotVersionLocaleSpecification build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link Lexv2ModelsBotVersionLocaleSpecification}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements Lexv2ModelsBotVersionLocaleSpecification {
        private final java.lang.String sourceBotVersion;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.sourceBotVersion = software.amazon.jsii.Kernel.get(this, "sourceBotVersion", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.sourceBotVersion = java.util.Objects.requireNonNull(builder.sourceBotVersion, "sourceBotVersion is required");
        }

        @Override
        public final java.lang.String getSourceBotVersion() {
            return this.sourceBotVersion;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("sourceBotVersion", om.valueToTree(this.getSourceBotVersion()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.lexv2ModelsBotVersion.Lexv2ModelsBotVersionLocaleSpecification"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            Lexv2ModelsBotVersionLocaleSpecification.Jsii$Proxy that = (Lexv2ModelsBotVersionLocaleSpecification.Jsii$Proxy) o;

            return this.sourceBotVersion.equals(that.sourceBotVersion);
        }

        @Override
        public final int hashCode() {
            int result = this.sourceBotVersion.hashCode();
            return result;
        }
    }
}
