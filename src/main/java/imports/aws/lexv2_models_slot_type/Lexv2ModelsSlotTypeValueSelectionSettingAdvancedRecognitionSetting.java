package imports.aws.lexv2_models_slot_type;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.816Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.lexv2ModelsSlotType.Lexv2ModelsSlotTypeValueSelectionSettingAdvancedRecognitionSetting")
@software.amazon.jsii.Jsii.Proxy(Lexv2ModelsSlotTypeValueSelectionSettingAdvancedRecognitionSetting.Jsii$Proxy.class)
public interface Lexv2ModelsSlotTypeValueSelectionSettingAdvancedRecognitionSetting extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_slot_type#audio_recognition_strategy Lexv2ModelsSlotType#audio_recognition_strategy}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getAudioRecognitionStrategy() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link Lexv2ModelsSlotTypeValueSelectionSettingAdvancedRecognitionSetting}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link Lexv2ModelsSlotTypeValueSelectionSettingAdvancedRecognitionSetting}
     */
    public static final class Builder implements software.amazon.jsii.Builder<Lexv2ModelsSlotTypeValueSelectionSettingAdvancedRecognitionSetting> {
        java.lang.String audioRecognitionStrategy;

        /**
         * Sets the value of {@link Lexv2ModelsSlotTypeValueSelectionSettingAdvancedRecognitionSetting#getAudioRecognitionStrategy}
         * @param audioRecognitionStrategy Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_slot_type#audio_recognition_strategy Lexv2ModelsSlotType#audio_recognition_strategy}.
         * @return {@code this}
         */
        public Builder audioRecognitionStrategy(java.lang.String audioRecognitionStrategy) {
            this.audioRecognitionStrategy = audioRecognitionStrategy;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link Lexv2ModelsSlotTypeValueSelectionSettingAdvancedRecognitionSetting}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public Lexv2ModelsSlotTypeValueSelectionSettingAdvancedRecognitionSetting build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link Lexv2ModelsSlotTypeValueSelectionSettingAdvancedRecognitionSetting}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements Lexv2ModelsSlotTypeValueSelectionSettingAdvancedRecognitionSetting {
        private final java.lang.String audioRecognitionStrategy;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.audioRecognitionStrategy = software.amazon.jsii.Kernel.get(this, "audioRecognitionStrategy", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.audioRecognitionStrategy = builder.audioRecognitionStrategy;
        }

        @Override
        public final java.lang.String getAudioRecognitionStrategy() {
            return this.audioRecognitionStrategy;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getAudioRecognitionStrategy() != null) {
                data.set("audioRecognitionStrategy", om.valueToTree(this.getAudioRecognitionStrategy()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.lexv2ModelsSlotType.Lexv2ModelsSlotTypeValueSelectionSettingAdvancedRecognitionSetting"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            Lexv2ModelsSlotTypeValueSelectionSettingAdvancedRecognitionSetting.Jsii$Proxy that = (Lexv2ModelsSlotTypeValueSelectionSettingAdvancedRecognitionSetting.Jsii$Proxy) o;

            return this.audioRecognitionStrategy != null ? this.audioRecognitionStrategy.equals(that.audioRecognitionStrategy) : that.audioRecognitionStrategy == null;
        }

        @Override
        public final int hashCode() {
            int result = this.audioRecognitionStrategy != null ? this.audioRecognitionStrategy.hashCode() : 0;
            return result;
        }
    }
}
