package imports.aws.lex_bot;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.540Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.lexBot.LexBotIntent")
@software.amazon.jsii.Jsii.Proxy(LexBotIntent.Jsii$Proxy.class)
public interface LexBotIntent extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lex_bot#intent_name LexBot#intent_name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getIntentName();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lex_bot#intent_version LexBot#intent_version}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getIntentVersion();

    /**
     * @return a {@link Builder} of {@link LexBotIntent}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link LexBotIntent}
     */
    public static final class Builder implements software.amazon.jsii.Builder<LexBotIntent> {
        java.lang.String intentName;
        java.lang.String intentVersion;

        /**
         * Sets the value of {@link LexBotIntent#getIntentName}
         * @param intentName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lex_bot#intent_name LexBot#intent_name}. This parameter is required.
         * @return {@code this}
         */
        public Builder intentName(java.lang.String intentName) {
            this.intentName = intentName;
            return this;
        }

        /**
         * Sets the value of {@link LexBotIntent#getIntentVersion}
         * @param intentVersion Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lex_bot#intent_version LexBot#intent_version}. This parameter is required.
         * @return {@code this}
         */
        public Builder intentVersion(java.lang.String intentVersion) {
            this.intentVersion = intentVersion;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link LexBotIntent}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public LexBotIntent build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link LexBotIntent}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements LexBotIntent {
        private final java.lang.String intentName;
        private final java.lang.String intentVersion;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.intentName = software.amazon.jsii.Kernel.get(this, "intentName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.intentVersion = software.amazon.jsii.Kernel.get(this, "intentVersion", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.intentName = java.util.Objects.requireNonNull(builder.intentName, "intentName is required");
            this.intentVersion = java.util.Objects.requireNonNull(builder.intentVersion, "intentVersion is required");
        }

        @Override
        public final java.lang.String getIntentName() {
            return this.intentName;
        }

        @Override
        public final java.lang.String getIntentVersion() {
            return this.intentVersion;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("intentName", om.valueToTree(this.getIntentName()));
            data.set("intentVersion", om.valueToTree(this.getIntentVersion()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.lexBot.LexBotIntent"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            LexBotIntent.Jsii$Proxy that = (LexBotIntent.Jsii$Proxy) o;

            if (!intentName.equals(that.intentName)) return false;
            return this.intentVersion.equals(that.intentVersion);
        }

        @Override
        public final int hashCode() {
            int result = this.intentName.hashCode();
            result = 31 * result + (this.intentVersion.hashCode());
            return result;
        }
    }
}
