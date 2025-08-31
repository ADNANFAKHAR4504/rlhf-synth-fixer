package imports.aws.lexv2_models_slot_type;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.813Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.lexv2ModelsSlotType.Lexv2ModelsSlotTypeExternalSourceSetting")
@software.amazon.jsii.Jsii.Proxy(Lexv2ModelsSlotTypeExternalSourceSetting.Jsii$Proxy.class)
public interface Lexv2ModelsSlotTypeExternalSourceSetting extends software.amazon.jsii.JsiiSerializable {

    /**
     * grammar_slot_type_setting block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_slot_type#grammar_slot_type_setting Lexv2ModelsSlotType#grammar_slot_type_setting}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getGrammarSlotTypeSetting() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link Lexv2ModelsSlotTypeExternalSourceSetting}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link Lexv2ModelsSlotTypeExternalSourceSetting}
     */
    public static final class Builder implements software.amazon.jsii.Builder<Lexv2ModelsSlotTypeExternalSourceSetting> {
        java.lang.Object grammarSlotTypeSetting;

        /**
         * Sets the value of {@link Lexv2ModelsSlotTypeExternalSourceSetting#getGrammarSlotTypeSetting}
         * @param grammarSlotTypeSetting grammar_slot_type_setting block.
         *                               Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_slot_type#grammar_slot_type_setting Lexv2ModelsSlotType#grammar_slot_type_setting}
         * @return {@code this}
         */
        public Builder grammarSlotTypeSetting(com.hashicorp.cdktf.IResolvable grammarSlotTypeSetting) {
            this.grammarSlotTypeSetting = grammarSlotTypeSetting;
            return this;
        }

        /**
         * Sets the value of {@link Lexv2ModelsSlotTypeExternalSourceSetting#getGrammarSlotTypeSetting}
         * @param grammarSlotTypeSetting grammar_slot_type_setting block.
         *                               Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_slot_type#grammar_slot_type_setting Lexv2ModelsSlotType#grammar_slot_type_setting}
         * @return {@code this}
         */
        public Builder grammarSlotTypeSetting(java.util.List<? extends imports.aws.lexv2_models_slot_type.Lexv2ModelsSlotTypeExternalSourceSettingGrammarSlotTypeSetting> grammarSlotTypeSetting) {
            this.grammarSlotTypeSetting = grammarSlotTypeSetting;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link Lexv2ModelsSlotTypeExternalSourceSetting}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public Lexv2ModelsSlotTypeExternalSourceSetting build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link Lexv2ModelsSlotTypeExternalSourceSetting}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements Lexv2ModelsSlotTypeExternalSourceSetting {
        private final java.lang.Object grammarSlotTypeSetting;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.grammarSlotTypeSetting = software.amazon.jsii.Kernel.get(this, "grammarSlotTypeSetting", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.grammarSlotTypeSetting = builder.grammarSlotTypeSetting;
        }

        @Override
        public final java.lang.Object getGrammarSlotTypeSetting() {
            return this.grammarSlotTypeSetting;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getGrammarSlotTypeSetting() != null) {
                data.set("grammarSlotTypeSetting", om.valueToTree(this.getGrammarSlotTypeSetting()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.lexv2ModelsSlotType.Lexv2ModelsSlotTypeExternalSourceSetting"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            Lexv2ModelsSlotTypeExternalSourceSetting.Jsii$Proxy that = (Lexv2ModelsSlotTypeExternalSourceSetting.Jsii$Proxy) o;

            return this.grammarSlotTypeSetting != null ? this.grammarSlotTypeSetting.equals(that.grammarSlotTypeSetting) : that.grammarSlotTypeSetting == null;
        }

        @Override
        public final int hashCode() {
            int result = this.grammarSlotTypeSetting != null ? this.grammarSlotTypeSetting.hashCode() : 0;
            return result;
        }
    }
}
