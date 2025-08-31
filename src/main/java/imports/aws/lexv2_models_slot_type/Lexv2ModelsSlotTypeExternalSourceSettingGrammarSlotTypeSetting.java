package imports.aws.lexv2_models_slot_type;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.813Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.lexv2ModelsSlotType.Lexv2ModelsSlotTypeExternalSourceSettingGrammarSlotTypeSetting")
@software.amazon.jsii.Jsii.Proxy(Lexv2ModelsSlotTypeExternalSourceSettingGrammarSlotTypeSetting.Jsii$Proxy.class)
public interface Lexv2ModelsSlotTypeExternalSourceSettingGrammarSlotTypeSetting extends software.amazon.jsii.JsiiSerializable {

    /**
     * source block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_slot_type#source Lexv2ModelsSlotType#source}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getSource() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link Lexv2ModelsSlotTypeExternalSourceSettingGrammarSlotTypeSetting}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link Lexv2ModelsSlotTypeExternalSourceSettingGrammarSlotTypeSetting}
     */
    public static final class Builder implements software.amazon.jsii.Builder<Lexv2ModelsSlotTypeExternalSourceSettingGrammarSlotTypeSetting> {
        java.lang.Object source;

        /**
         * Sets the value of {@link Lexv2ModelsSlotTypeExternalSourceSettingGrammarSlotTypeSetting#getSource}
         * @param source source block.
         *               Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_slot_type#source Lexv2ModelsSlotType#source}
         * @return {@code this}
         */
        public Builder source(com.hashicorp.cdktf.IResolvable source) {
            this.source = source;
            return this;
        }

        /**
         * Sets the value of {@link Lexv2ModelsSlotTypeExternalSourceSettingGrammarSlotTypeSetting#getSource}
         * @param source source block.
         *               Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_slot_type#source Lexv2ModelsSlotType#source}
         * @return {@code this}
         */
        public Builder source(java.util.List<? extends imports.aws.lexv2_models_slot_type.Lexv2ModelsSlotTypeExternalSourceSettingGrammarSlotTypeSettingSource> source) {
            this.source = source;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link Lexv2ModelsSlotTypeExternalSourceSettingGrammarSlotTypeSetting}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public Lexv2ModelsSlotTypeExternalSourceSettingGrammarSlotTypeSetting build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link Lexv2ModelsSlotTypeExternalSourceSettingGrammarSlotTypeSetting}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements Lexv2ModelsSlotTypeExternalSourceSettingGrammarSlotTypeSetting {
        private final java.lang.Object source;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.source = software.amazon.jsii.Kernel.get(this, "source", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.source = builder.source;
        }

        @Override
        public final java.lang.Object getSource() {
            return this.source;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getSource() != null) {
                data.set("source", om.valueToTree(this.getSource()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.lexv2ModelsSlotType.Lexv2ModelsSlotTypeExternalSourceSettingGrammarSlotTypeSetting"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            Lexv2ModelsSlotTypeExternalSourceSettingGrammarSlotTypeSetting.Jsii$Proxy that = (Lexv2ModelsSlotTypeExternalSourceSettingGrammarSlotTypeSetting.Jsii$Proxy) o;

            return this.source != null ? this.source.equals(that.source) : that.source == null;
        }

        @Override
        public final int hashCode() {
            int result = this.source != null ? this.source.hashCode() : 0;
            return result;
        }
    }
}
