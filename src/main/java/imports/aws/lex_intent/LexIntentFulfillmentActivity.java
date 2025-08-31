package imports.aws.lex_intent;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.543Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.lexIntent.LexIntentFulfillmentActivity")
@software.amazon.jsii.Jsii.Proxy(LexIntentFulfillmentActivity.Jsii$Proxy.class)
public interface LexIntentFulfillmentActivity extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lex_intent#type LexIntent#type}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getType();

    /**
     * code_hook block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lex_intent#code_hook LexIntent#code_hook}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.lex_intent.LexIntentFulfillmentActivityCodeHook getCodeHook() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link LexIntentFulfillmentActivity}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link LexIntentFulfillmentActivity}
     */
    public static final class Builder implements software.amazon.jsii.Builder<LexIntentFulfillmentActivity> {
        java.lang.String type;
        imports.aws.lex_intent.LexIntentFulfillmentActivityCodeHook codeHook;

        /**
         * Sets the value of {@link LexIntentFulfillmentActivity#getType}
         * @param type Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lex_intent#type LexIntent#type}. This parameter is required.
         * @return {@code this}
         */
        public Builder type(java.lang.String type) {
            this.type = type;
            return this;
        }

        /**
         * Sets the value of {@link LexIntentFulfillmentActivity#getCodeHook}
         * @param codeHook code_hook block.
         *                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lex_intent#code_hook LexIntent#code_hook}
         * @return {@code this}
         */
        public Builder codeHook(imports.aws.lex_intent.LexIntentFulfillmentActivityCodeHook codeHook) {
            this.codeHook = codeHook;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link LexIntentFulfillmentActivity}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public LexIntentFulfillmentActivity build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link LexIntentFulfillmentActivity}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements LexIntentFulfillmentActivity {
        private final java.lang.String type;
        private final imports.aws.lex_intent.LexIntentFulfillmentActivityCodeHook codeHook;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.type = software.amazon.jsii.Kernel.get(this, "type", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.codeHook = software.amazon.jsii.Kernel.get(this, "codeHook", software.amazon.jsii.NativeType.forClass(imports.aws.lex_intent.LexIntentFulfillmentActivityCodeHook.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.type = java.util.Objects.requireNonNull(builder.type, "type is required");
            this.codeHook = builder.codeHook;
        }

        @Override
        public final java.lang.String getType() {
            return this.type;
        }

        @Override
        public final imports.aws.lex_intent.LexIntentFulfillmentActivityCodeHook getCodeHook() {
            return this.codeHook;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("type", om.valueToTree(this.getType()));
            if (this.getCodeHook() != null) {
                data.set("codeHook", om.valueToTree(this.getCodeHook()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.lexIntent.LexIntentFulfillmentActivity"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            LexIntentFulfillmentActivity.Jsii$Proxy that = (LexIntentFulfillmentActivity.Jsii$Proxy) o;

            if (!type.equals(that.type)) return false;
            return this.codeHook != null ? this.codeHook.equals(that.codeHook) : that.codeHook == null;
        }

        @Override
        public final int hashCode() {
            int result = this.type.hashCode();
            result = 31 * result + (this.codeHook != null ? this.codeHook.hashCode() : 0);
            return result;
        }
    }
}
