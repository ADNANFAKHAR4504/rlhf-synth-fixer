package imports.aws.lexv2_models_slot;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.778Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.lexv2ModelsSlot.Lexv2ModelsSlotSubSlotSettingSlotSpecification")
@software.amazon.jsii.Jsii.Proxy(Lexv2ModelsSlotSubSlotSettingSlotSpecification.Jsii$Proxy.class)
public interface Lexv2ModelsSlotSubSlotSettingSlotSpecification extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_slot#map_block_key Lexv2ModelsSlot#map_block_key}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getMapBlockKey();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_slot#slot_type_id Lexv2ModelsSlot#slot_type_id}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getSlotTypeId();

    /**
     * value_elicitation_setting block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_slot#value_elicitation_setting Lexv2ModelsSlot#value_elicitation_setting}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getValueElicitationSetting() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link Lexv2ModelsSlotSubSlotSettingSlotSpecification}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link Lexv2ModelsSlotSubSlotSettingSlotSpecification}
     */
    public static final class Builder implements software.amazon.jsii.Builder<Lexv2ModelsSlotSubSlotSettingSlotSpecification> {
        java.lang.String mapBlockKey;
        java.lang.String slotTypeId;
        java.lang.Object valueElicitationSetting;

        /**
         * Sets the value of {@link Lexv2ModelsSlotSubSlotSettingSlotSpecification#getMapBlockKey}
         * @param mapBlockKey Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_slot#map_block_key Lexv2ModelsSlot#map_block_key}. This parameter is required.
         * @return {@code this}
         */
        public Builder mapBlockKey(java.lang.String mapBlockKey) {
            this.mapBlockKey = mapBlockKey;
            return this;
        }

        /**
         * Sets the value of {@link Lexv2ModelsSlotSubSlotSettingSlotSpecification#getSlotTypeId}
         * @param slotTypeId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_slot#slot_type_id Lexv2ModelsSlot#slot_type_id}. This parameter is required.
         * @return {@code this}
         */
        public Builder slotTypeId(java.lang.String slotTypeId) {
            this.slotTypeId = slotTypeId;
            return this;
        }

        /**
         * Sets the value of {@link Lexv2ModelsSlotSubSlotSettingSlotSpecification#getValueElicitationSetting}
         * @param valueElicitationSetting value_elicitation_setting block.
         *                                Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_slot#value_elicitation_setting Lexv2ModelsSlot#value_elicitation_setting}
         * @return {@code this}
         */
        public Builder valueElicitationSetting(com.hashicorp.cdktf.IResolvable valueElicitationSetting) {
            this.valueElicitationSetting = valueElicitationSetting;
            return this;
        }

        /**
         * Sets the value of {@link Lexv2ModelsSlotSubSlotSettingSlotSpecification#getValueElicitationSetting}
         * @param valueElicitationSetting value_elicitation_setting block.
         *                                Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_slot#value_elicitation_setting Lexv2ModelsSlot#value_elicitation_setting}
         * @return {@code this}
         */
        public Builder valueElicitationSetting(java.util.List<? extends imports.aws.lexv2_models_slot.Lexv2ModelsSlotSubSlotSettingSlotSpecificationValueElicitationSetting> valueElicitationSetting) {
            this.valueElicitationSetting = valueElicitationSetting;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link Lexv2ModelsSlotSubSlotSettingSlotSpecification}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public Lexv2ModelsSlotSubSlotSettingSlotSpecification build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link Lexv2ModelsSlotSubSlotSettingSlotSpecification}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements Lexv2ModelsSlotSubSlotSettingSlotSpecification {
        private final java.lang.String mapBlockKey;
        private final java.lang.String slotTypeId;
        private final java.lang.Object valueElicitationSetting;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.mapBlockKey = software.amazon.jsii.Kernel.get(this, "mapBlockKey", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.slotTypeId = software.amazon.jsii.Kernel.get(this, "slotTypeId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.valueElicitationSetting = software.amazon.jsii.Kernel.get(this, "valueElicitationSetting", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.mapBlockKey = java.util.Objects.requireNonNull(builder.mapBlockKey, "mapBlockKey is required");
            this.slotTypeId = java.util.Objects.requireNonNull(builder.slotTypeId, "slotTypeId is required");
            this.valueElicitationSetting = builder.valueElicitationSetting;
        }

        @Override
        public final java.lang.String getMapBlockKey() {
            return this.mapBlockKey;
        }

        @Override
        public final java.lang.String getSlotTypeId() {
            return this.slotTypeId;
        }

        @Override
        public final java.lang.Object getValueElicitationSetting() {
            return this.valueElicitationSetting;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("mapBlockKey", om.valueToTree(this.getMapBlockKey()));
            data.set("slotTypeId", om.valueToTree(this.getSlotTypeId()));
            if (this.getValueElicitationSetting() != null) {
                data.set("valueElicitationSetting", om.valueToTree(this.getValueElicitationSetting()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.lexv2ModelsSlot.Lexv2ModelsSlotSubSlotSettingSlotSpecification"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            Lexv2ModelsSlotSubSlotSettingSlotSpecification.Jsii$Proxy that = (Lexv2ModelsSlotSubSlotSettingSlotSpecification.Jsii$Proxy) o;

            if (!mapBlockKey.equals(that.mapBlockKey)) return false;
            if (!slotTypeId.equals(that.slotTypeId)) return false;
            return this.valueElicitationSetting != null ? this.valueElicitationSetting.equals(that.valueElicitationSetting) : that.valueElicitationSetting == null;
        }

        @Override
        public final int hashCode() {
            int result = this.mapBlockKey.hashCode();
            result = 31 * result + (this.slotTypeId.hashCode());
            result = 31 * result + (this.valueElicitationSetting != null ? this.valueElicitationSetting.hashCode() : 0);
            return result;
        }
    }
}
