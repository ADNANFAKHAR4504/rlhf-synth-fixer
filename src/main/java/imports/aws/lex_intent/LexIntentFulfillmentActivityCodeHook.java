package imports.aws.lex_intent;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.543Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.lexIntent.LexIntentFulfillmentActivityCodeHook")
@software.amazon.jsii.Jsii.Proxy(LexIntentFulfillmentActivityCodeHook.Jsii$Proxy.class)
public interface LexIntentFulfillmentActivityCodeHook extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lex_intent#message_version LexIntent#message_version}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getMessageVersion();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lex_intent#uri LexIntent#uri}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getUri();

    /**
     * @return a {@link Builder} of {@link LexIntentFulfillmentActivityCodeHook}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link LexIntentFulfillmentActivityCodeHook}
     */
    public static final class Builder implements software.amazon.jsii.Builder<LexIntentFulfillmentActivityCodeHook> {
        java.lang.String messageVersion;
        java.lang.String uri;

        /**
         * Sets the value of {@link LexIntentFulfillmentActivityCodeHook#getMessageVersion}
         * @param messageVersion Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lex_intent#message_version LexIntent#message_version}. This parameter is required.
         * @return {@code this}
         */
        public Builder messageVersion(java.lang.String messageVersion) {
            this.messageVersion = messageVersion;
            return this;
        }

        /**
         * Sets the value of {@link LexIntentFulfillmentActivityCodeHook#getUri}
         * @param uri Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lex_intent#uri LexIntent#uri}. This parameter is required.
         * @return {@code this}
         */
        public Builder uri(java.lang.String uri) {
            this.uri = uri;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link LexIntentFulfillmentActivityCodeHook}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public LexIntentFulfillmentActivityCodeHook build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link LexIntentFulfillmentActivityCodeHook}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements LexIntentFulfillmentActivityCodeHook {
        private final java.lang.String messageVersion;
        private final java.lang.String uri;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.messageVersion = software.amazon.jsii.Kernel.get(this, "messageVersion", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.uri = software.amazon.jsii.Kernel.get(this, "uri", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.messageVersion = java.util.Objects.requireNonNull(builder.messageVersion, "messageVersion is required");
            this.uri = java.util.Objects.requireNonNull(builder.uri, "uri is required");
        }

        @Override
        public final java.lang.String getMessageVersion() {
            return this.messageVersion;
        }

        @Override
        public final java.lang.String getUri() {
            return this.uri;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("messageVersion", om.valueToTree(this.getMessageVersion()));
            data.set("uri", om.valueToTree(this.getUri()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.lexIntent.LexIntentFulfillmentActivityCodeHook"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            LexIntentFulfillmentActivityCodeHook.Jsii$Proxy that = (LexIntentFulfillmentActivityCodeHook.Jsii$Proxy) o;

            if (!messageVersion.equals(that.messageVersion)) return false;
            return this.uri.equals(that.uri);
        }

        @Override
        public final int hashCode() {
            int result = this.messageVersion.hashCode();
            result = 31 * result + (this.uri.hashCode());
            return result;
        }
    }
}
