package imports.aws.lexv2_models_slot;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.801Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.lexv2ModelsSlot.Lexv2ModelsSlotValueElicitationSettingSlotResolutionSetting")
@software.amazon.jsii.Jsii.Proxy(Lexv2ModelsSlotValueElicitationSettingSlotResolutionSetting.Jsii$Proxy.class)
public interface Lexv2ModelsSlotValueElicitationSettingSlotResolutionSetting extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_slot#slot_resolution_strategy Lexv2ModelsSlot#slot_resolution_strategy}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getSlotResolutionStrategy();

    /**
     * @return a {@link Builder} of {@link Lexv2ModelsSlotValueElicitationSettingSlotResolutionSetting}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link Lexv2ModelsSlotValueElicitationSettingSlotResolutionSetting}
     */
    public static final class Builder implements software.amazon.jsii.Builder<Lexv2ModelsSlotValueElicitationSettingSlotResolutionSetting> {
        java.lang.String slotResolutionStrategy;

        /**
         * Sets the value of {@link Lexv2ModelsSlotValueElicitationSettingSlotResolutionSetting#getSlotResolutionStrategy}
         * @param slotResolutionStrategy Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_slot#slot_resolution_strategy Lexv2ModelsSlot#slot_resolution_strategy}. This parameter is required.
         * @return {@code this}
         */
        public Builder slotResolutionStrategy(java.lang.String slotResolutionStrategy) {
            this.slotResolutionStrategy = slotResolutionStrategy;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link Lexv2ModelsSlotValueElicitationSettingSlotResolutionSetting}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public Lexv2ModelsSlotValueElicitationSettingSlotResolutionSetting build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link Lexv2ModelsSlotValueElicitationSettingSlotResolutionSetting}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements Lexv2ModelsSlotValueElicitationSettingSlotResolutionSetting {
        private final java.lang.String slotResolutionStrategy;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.slotResolutionStrategy = software.amazon.jsii.Kernel.get(this, "slotResolutionStrategy", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.slotResolutionStrategy = java.util.Objects.requireNonNull(builder.slotResolutionStrategy, "slotResolutionStrategy is required");
        }

        @Override
        public final java.lang.String getSlotResolutionStrategy() {
            return this.slotResolutionStrategy;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("slotResolutionStrategy", om.valueToTree(this.getSlotResolutionStrategy()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.lexv2ModelsSlot.Lexv2ModelsSlotValueElicitationSettingSlotResolutionSetting"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            Lexv2ModelsSlotValueElicitationSettingSlotResolutionSetting.Jsii$Proxy that = (Lexv2ModelsSlotValueElicitationSettingSlotResolutionSetting.Jsii$Proxy) o;

            return this.slotResolutionStrategy.equals(that.slotResolutionStrategy);
        }

        @Override
        public final int hashCode() {
            int result = this.slotResolutionStrategy.hashCode();
            return result;
        }
    }
}
