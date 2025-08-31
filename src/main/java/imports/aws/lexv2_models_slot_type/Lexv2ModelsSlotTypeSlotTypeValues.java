package imports.aws.lexv2_models_slot_type;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.813Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.lexv2ModelsSlotType.Lexv2ModelsSlotTypeSlotTypeValues")
@software.amazon.jsii.Jsii.Proxy(Lexv2ModelsSlotTypeSlotTypeValues.Jsii$Proxy.class)
public interface Lexv2ModelsSlotTypeSlotTypeValues extends software.amazon.jsii.JsiiSerializable {

    /**
     * sample_value block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_slot_type#sample_value Lexv2ModelsSlotType#sample_value}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getSampleValue() {
        return null;
    }

    /**
     * synonyms block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_slot_type#synonyms Lexv2ModelsSlotType#synonyms}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getSynonyms() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link Lexv2ModelsSlotTypeSlotTypeValues}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link Lexv2ModelsSlotTypeSlotTypeValues}
     */
    public static final class Builder implements software.amazon.jsii.Builder<Lexv2ModelsSlotTypeSlotTypeValues> {
        java.lang.Object sampleValue;
        java.lang.Object synonyms;

        /**
         * Sets the value of {@link Lexv2ModelsSlotTypeSlotTypeValues#getSampleValue}
         * @param sampleValue sample_value block.
         *                    Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_slot_type#sample_value Lexv2ModelsSlotType#sample_value}
         * @return {@code this}
         */
        public Builder sampleValue(com.hashicorp.cdktf.IResolvable sampleValue) {
            this.sampleValue = sampleValue;
            return this;
        }

        /**
         * Sets the value of {@link Lexv2ModelsSlotTypeSlotTypeValues#getSampleValue}
         * @param sampleValue sample_value block.
         *                    Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_slot_type#sample_value Lexv2ModelsSlotType#sample_value}
         * @return {@code this}
         */
        public Builder sampleValue(java.util.List<? extends imports.aws.lexv2_models_slot_type.Lexv2ModelsSlotTypeSlotTypeValuesSampleValue> sampleValue) {
            this.sampleValue = sampleValue;
            return this;
        }

        /**
         * Sets the value of {@link Lexv2ModelsSlotTypeSlotTypeValues#getSynonyms}
         * @param synonyms synonyms block.
         *                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_slot_type#synonyms Lexv2ModelsSlotType#synonyms}
         * @return {@code this}
         */
        public Builder synonyms(com.hashicorp.cdktf.IResolvable synonyms) {
            this.synonyms = synonyms;
            return this;
        }

        /**
         * Sets the value of {@link Lexv2ModelsSlotTypeSlotTypeValues#getSynonyms}
         * @param synonyms synonyms block.
         *                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_slot_type#synonyms Lexv2ModelsSlotType#synonyms}
         * @return {@code this}
         */
        public Builder synonyms(java.util.List<? extends imports.aws.lexv2_models_slot_type.Lexv2ModelsSlotTypeSlotTypeValuesSynonyms> synonyms) {
            this.synonyms = synonyms;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link Lexv2ModelsSlotTypeSlotTypeValues}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public Lexv2ModelsSlotTypeSlotTypeValues build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link Lexv2ModelsSlotTypeSlotTypeValues}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements Lexv2ModelsSlotTypeSlotTypeValues {
        private final java.lang.Object sampleValue;
        private final java.lang.Object synonyms;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.sampleValue = software.amazon.jsii.Kernel.get(this, "sampleValue", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.synonyms = software.amazon.jsii.Kernel.get(this, "synonyms", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.sampleValue = builder.sampleValue;
            this.synonyms = builder.synonyms;
        }

        @Override
        public final java.lang.Object getSampleValue() {
            return this.sampleValue;
        }

        @Override
        public final java.lang.Object getSynonyms() {
            return this.synonyms;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getSampleValue() != null) {
                data.set("sampleValue", om.valueToTree(this.getSampleValue()));
            }
            if (this.getSynonyms() != null) {
                data.set("synonyms", om.valueToTree(this.getSynonyms()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.lexv2ModelsSlotType.Lexv2ModelsSlotTypeSlotTypeValues"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            Lexv2ModelsSlotTypeSlotTypeValues.Jsii$Proxy that = (Lexv2ModelsSlotTypeSlotTypeValues.Jsii$Proxy) o;

            if (this.sampleValue != null ? !this.sampleValue.equals(that.sampleValue) : that.sampleValue != null) return false;
            return this.synonyms != null ? this.synonyms.equals(that.synonyms) : that.synonyms == null;
        }

        @Override
        public final int hashCode() {
            int result = this.sampleValue != null ? this.sampleValue.hashCode() : 0;
            result = 31 * result + (this.synonyms != null ? this.synonyms.hashCode() : 0);
            return result;
        }
    }
}
