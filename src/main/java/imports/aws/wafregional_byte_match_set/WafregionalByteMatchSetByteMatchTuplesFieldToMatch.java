package imports.aws.wafregional_byte_match_set;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.649Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.wafregionalByteMatchSet.WafregionalByteMatchSetByteMatchTuplesFieldToMatch")
@software.amazon.jsii.Jsii.Proxy(WafregionalByteMatchSetByteMatchTuplesFieldToMatch.Jsii$Proxy.class)
public interface WafregionalByteMatchSetByteMatchTuplesFieldToMatch extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafregional_byte_match_set#type WafregionalByteMatchSet#type}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getType();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafregional_byte_match_set#data WafregionalByteMatchSet#data}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getData() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link WafregionalByteMatchSetByteMatchTuplesFieldToMatch}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link WafregionalByteMatchSetByteMatchTuplesFieldToMatch}
     */
    public static final class Builder implements software.amazon.jsii.Builder<WafregionalByteMatchSetByteMatchTuplesFieldToMatch> {
        java.lang.String type;
        java.lang.String data;

        /**
         * Sets the value of {@link WafregionalByteMatchSetByteMatchTuplesFieldToMatch#getType}
         * @param type Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafregional_byte_match_set#type WafregionalByteMatchSet#type}. This parameter is required.
         * @return {@code this}
         */
        public Builder type(java.lang.String type) {
            this.type = type;
            return this;
        }

        /**
         * Sets the value of {@link WafregionalByteMatchSetByteMatchTuplesFieldToMatch#getData}
         * @param data Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/wafregional_byte_match_set#data WafregionalByteMatchSet#data}.
         * @return {@code this}
         */
        public Builder data(java.lang.String data) {
            this.data = data;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link WafregionalByteMatchSetByteMatchTuplesFieldToMatch}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public WafregionalByteMatchSetByteMatchTuplesFieldToMatch build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link WafregionalByteMatchSetByteMatchTuplesFieldToMatch}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements WafregionalByteMatchSetByteMatchTuplesFieldToMatch {
        private final java.lang.String type;
        private final java.lang.String data;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.type = software.amazon.jsii.Kernel.get(this, "type", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.data = software.amazon.jsii.Kernel.get(this, "data", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.type = java.util.Objects.requireNonNull(builder.type, "type is required");
            this.data = builder.data;
        }

        @Override
        public final java.lang.String getType() {
            return this.type;
        }

        @Override
        public final java.lang.String getData() {
            return this.data;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("type", om.valueToTree(this.getType()));
            if (this.getData() != null) {
                data.set("data", om.valueToTree(this.getData()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.wafregionalByteMatchSet.WafregionalByteMatchSetByteMatchTuplesFieldToMatch"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            WafregionalByteMatchSetByteMatchTuplesFieldToMatch.Jsii$Proxy that = (WafregionalByteMatchSetByteMatchTuplesFieldToMatch.Jsii$Proxy) o;

            if (!type.equals(that.type)) return false;
            return this.data != null ? this.data.equals(that.data) : that.data == null;
        }

        @Override
        public final int hashCode() {
            int result = this.type.hashCode();
            result = 31 * result + (this.data != null ? this.data.hashCode() : 0);
            return result;
        }
    }
}
