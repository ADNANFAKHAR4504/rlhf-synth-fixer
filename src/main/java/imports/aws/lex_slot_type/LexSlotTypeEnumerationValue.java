package imports.aws.lex_slot_type;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.547Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.lexSlotType.LexSlotTypeEnumerationValue")
@software.amazon.jsii.Jsii.Proxy(LexSlotTypeEnumerationValue.Jsii$Proxy.class)
public interface LexSlotTypeEnumerationValue extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lex_slot_type#value LexSlotType#value}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getValue();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lex_slot_type#synonyms LexSlotType#synonyms}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getSynonyms() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link LexSlotTypeEnumerationValue}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link LexSlotTypeEnumerationValue}
     */
    public static final class Builder implements software.amazon.jsii.Builder<LexSlotTypeEnumerationValue> {
        java.lang.String value;
        java.util.List<java.lang.String> synonyms;

        /**
         * Sets the value of {@link LexSlotTypeEnumerationValue#getValue}
         * @param value Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lex_slot_type#value LexSlotType#value}. This parameter is required.
         * @return {@code this}
         */
        public Builder value(java.lang.String value) {
            this.value = value;
            return this;
        }

        /**
         * Sets the value of {@link LexSlotTypeEnumerationValue#getSynonyms}
         * @param synonyms Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lex_slot_type#synonyms LexSlotType#synonyms}.
         * @return {@code this}
         */
        public Builder synonyms(java.util.List<java.lang.String> synonyms) {
            this.synonyms = synonyms;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link LexSlotTypeEnumerationValue}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public LexSlotTypeEnumerationValue build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link LexSlotTypeEnumerationValue}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements LexSlotTypeEnumerationValue {
        private final java.lang.String value;
        private final java.util.List<java.lang.String> synonyms;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.value = software.amazon.jsii.Kernel.get(this, "value", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.synonyms = software.amazon.jsii.Kernel.get(this, "synonyms", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.value = java.util.Objects.requireNonNull(builder.value, "value is required");
            this.synonyms = builder.synonyms;
        }

        @Override
        public final java.lang.String getValue() {
            return this.value;
        }

        @Override
        public final java.util.List<java.lang.String> getSynonyms() {
            return this.synonyms;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("value", om.valueToTree(this.getValue()));
            if (this.getSynonyms() != null) {
                data.set("synonyms", om.valueToTree(this.getSynonyms()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.lexSlotType.LexSlotTypeEnumerationValue"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            LexSlotTypeEnumerationValue.Jsii$Proxy that = (LexSlotTypeEnumerationValue.Jsii$Proxy) o;

            if (!value.equals(that.value)) return false;
            return this.synonyms != null ? this.synonyms.equals(that.synonyms) : that.synonyms == null;
        }

        @Override
        public final int hashCode() {
            int result = this.value.hashCode();
            result = 31 * result + (this.synonyms != null ? this.synonyms.hashCode() : 0);
            return result;
        }
    }
}
