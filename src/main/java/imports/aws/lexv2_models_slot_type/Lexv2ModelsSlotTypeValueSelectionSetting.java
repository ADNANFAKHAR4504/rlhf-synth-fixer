package imports.aws.lexv2_models_slot_type;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.814Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.lexv2ModelsSlotType.Lexv2ModelsSlotTypeValueSelectionSetting")
@software.amazon.jsii.Jsii.Proxy(Lexv2ModelsSlotTypeValueSelectionSetting.Jsii$Proxy.class)
public interface Lexv2ModelsSlotTypeValueSelectionSetting extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_slot_type#resolution_strategy Lexv2ModelsSlotType#resolution_strategy}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getResolutionStrategy();

    /**
     * advanced_recognition_setting block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_slot_type#advanced_recognition_setting Lexv2ModelsSlotType#advanced_recognition_setting}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getAdvancedRecognitionSetting() {
        return null;
    }

    /**
     * regex_filter block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_slot_type#regex_filter Lexv2ModelsSlotType#regex_filter}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getRegexFilter() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link Lexv2ModelsSlotTypeValueSelectionSetting}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link Lexv2ModelsSlotTypeValueSelectionSetting}
     */
    public static final class Builder implements software.amazon.jsii.Builder<Lexv2ModelsSlotTypeValueSelectionSetting> {
        java.lang.String resolutionStrategy;
        java.lang.Object advancedRecognitionSetting;
        java.lang.Object regexFilter;

        /**
         * Sets the value of {@link Lexv2ModelsSlotTypeValueSelectionSetting#getResolutionStrategy}
         * @param resolutionStrategy Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_slot_type#resolution_strategy Lexv2ModelsSlotType#resolution_strategy}. This parameter is required.
         * @return {@code this}
         */
        public Builder resolutionStrategy(java.lang.String resolutionStrategy) {
            this.resolutionStrategy = resolutionStrategy;
            return this;
        }

        /**
         * Sets the value of {@link Lexv2ModelsSlotTypeValueSelectionSetting#getAdvancedRecognitionSetting}
         * @param advancedRecognitionSetting advanced_recognition_setting block.
         *                                   Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_slot_type#advanced_recognition_setting Lexv2ModelsSlotType#advanced_recognition_setting}
         * @return {@code this}
         */
        public Builder advancedRecognitionSetting(com.hashicorp.cdktf.IResolvable advancedRecognitionSetting) {
            this.advancedRecognitionSetting = advancedRecognitionSetting;
            return this;
        }

        /**
         * Sets the value of {@link Lexv2ModelsSlotTypeValueSelectionSetting#getAdvancedRecognitionSetting}
         * @param advancedRecognitionSetting advanced_recognition_setting block.
         *                                   Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_slot_type#advanced_recognition_setting Lexv2ModelsSlotType#advanced_recognition_setting}
         * @return {@code this}
         */
        public Builder advancedRecognitionSetting(java.util.List<? extends imports.aws.lexv2_models_slot_type.Lexv2ModelsSlotTypeValueSelectionSettingAdvancedRecognitionSetting> advancedRecognitionSetting) {
            this.advancedRecognitionSetting = advancedRecognitionSetting;
            return this;
        }

        /**
         * Sets the value of {@link Lexv2ModelsSlotTypeValueSelectionSetting#getRegexFilter}
         * @param regexFilter regex_filter block.
         *                    Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_slot_type#regex_filter Lexv2ModelsSlotType#regex_filter}
         * @return {@code this}
         */
        public Builder regexFilter(com.hashicorp.cdktf.IResolvable regexFilter) {
            this.regexFilter = regexFilter;
            return this;
        }

        /**
         * Sets the value of {@link Lexv2ModelsSlotTypeValueSelectionSetting#getRegexFilter}
         * @param regexFilter regex_filter block.
         *                    Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_slot_type#regex_filter Lexv2ModelsSlotType#regex_filter}
         * @return {@code this}
         */
        public Builder regexFilter(java.util.List<? extends imports.aws.lexv2_models_slot_type.Lexv2ModelsSlotTypeValueSelectionSettingRegexFilter> regexFilter) {
            this.regexFilter = regexFilter;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link Lexv2ModelsSlotTypeValueSelectionSetting}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public Lexv2ModelsSlotTypeValueSelectionSetting build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link Lexv2ModelsSlotTypeValueSelectionSetting}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements Lexv2ModelsSlotTypeValueSelectionSetting {
        private final java.lang.String resolutionStrategy;
        private final java.lang.Object advancedRecognitionSetting;
        private final java.lang.Object regexFilter;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.resolutionStrategy = software.amazon.jsii.Kernel.get(this, "resolutionStrategy", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.advancedRecognitionSetting = software.amazon.jsii.Kernel.get(this, "advancedRecognitionSetting", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.regexFilter = software.amazon.jsii.Kernel.get(this, "regexFilter", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.resolutionStrategy = java.util.Objects.requireNonNull(builder.resolutionStrategy, "resolutionStrategy is required");
            this.advancedRecognitionSetting = builder.advancedRecognitionSetting;
            this.regexFilter = builder.regexFilter;
        }

        @Override
        public final java.lang.String getResolutionStrategy() {
            return this.resolutionStrategy;
        }

        @Override
        public final java.lang.Object getAdvancedRecognitionSetting() {
            return this.advancedRecognitionSetting;
        }

        @Override
        public final java.lang.Object getRegexFilter() {
            return this.regexFilter;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("resolutionStrategy", om.valueToTree(this.getResolutionStrategy()));
            if (this.getAdvancedRecognitionSetting() != null) {
                data.set("advancedRecognitionSetting", om.valueToTree(this.getAdvancedRecognitionSetting()));
            }
            if (this.getRegexFilter() != null) {
                data.set("regexFilter", om.valueToTree(this.getRegexFilter()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.lexv2ModelsSlotType.Lexv2ModelsSlotTypeValueSelectionSetting"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            Lexv2ModelsSlotTypeValueSelectionSetting.Jsii$Proxy that = (Lexv2ModelsSlotTypeValueSelectionSetting.Jsii$Proxy) o;

            if (!resolutionStrategy.equals(that.resolutionStrategy)) return false;
            if (this.advancedRecognitionSetting != null ? !this.advancedRecognitionSetting.equals(that.advancedRecognitionSetting) : that.advancedRecognitionSetting != null) return false;
            return this.regexFilter != null ? this.regexFilter.equals(that.regexFilter) : that.regexFilter == null;
        }

        @Override
        public final int hashCode() {
            int result = this.resolutionStrategy.hashCode();
            result = 31 * result + (this.advancedRecognitionSetting != null ? this.advancedRecognitionSetting.hashCode() : 0);
            result = 31 * result + (this.regexFilter != null ? this.regexFilter.hashCode() : 0);
            return result;
        }
    }
}
