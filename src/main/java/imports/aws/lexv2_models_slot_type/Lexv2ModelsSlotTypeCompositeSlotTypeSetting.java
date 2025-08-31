package imports.aws.lexv2_models_slot_type;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.812Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.lexv2ModelsSlotType.Lexv2ModelsSlotTypeCompositeSlotTypeSetting")
@software.amazon.jsii.Jsii.Proxy(Lexv2ModelsSlotTypeCompositeSlotTypeSetting.Jsii$Proxy.class)
public interface Lexv2ModelsSlotTypeCompositeSlotTypeSetting extends software.amazon.jsii.JsiiSerializable {

    /**
     * sub_slots block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_slot_type#sub_slots Lexv2ModelsSlotType#sub_slots}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getSubSlots() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link Lexv2ModelsSlotTypeCompositeSlotTypeSetting}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link Lexv2ModelsSlotTypeCompositeSlotTypeSetting}
     */
    public static final class Builder implements software.amazon.jsii.Builder<Lexv2ModelsSlotTypeCompositeSlotTypeSetting> {
        java.lang.Object subSlots;

        /**
         * Sets the value of {@link Lexv2ModelsSlotTypeCompositeSlotTypeSetting#getSubSlots}
         * @param subSlots sub_slots block.
         *                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_slot_type#sub_slots Lexv2ModelsSlotType#sub_slots}
         * @return {@code this}
         */
        public Builder subSlots(com.hashicorp.cdktf.IResolvable subSlots) {
            this.subSlots = subSlots;
            return this;
        }

        /**
         * Sets the value of {@link Lexv2ModelsSlotTypeCompositeSlotTypeSetting#getSubSlots}
         * @param subSlots sub_slots block.
         *                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_slot_type#sub_slots Lexv2ModelsSlotType#sub_slots}
         * @return {@code this}
         */
        public Builder subSlots(java.util.List<? extends imports.aws.lexv2_models_slot_type.Lexv2ModelsSlotTypeCompositeSlotTypeSettingSubSlots> subSlots) {
            this.subSlots = subSlots;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link Lexv2ModelsSlotTypeCompositeSlotTypeSetting}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public Lexv2ModelsSlotTypeCompositeSlotTypeSetting build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link Lexv2ModelsSlotTypeCompositeSlotTypeSetting}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements Lexv2ModelsSlotTypeCompositeSlotTypeSetting {
        private final java.lang.Object subSlots;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.subSlots = software.amazon.jsii.Kernel.get(this, "subSlots", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.subSlots = builder.subSlots;
        }

        @Override
        public final java.lang.Object getSubSlots() {
            return this.subSlots;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getSubSlots() != null) {
                data.set("subSlots", om.valueToTree(this.getSubSlots()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.lexv2ModelsSlotType.Lexv2ModelsSlotTypeCompositeSlotTypeSetting"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            Lexv2ModelsSlotTypeCompositeSlotTypeSetting.Jsii$Proxy that = (Lexv2ModelsSlotTypeCompositeSlotTypeSetting.Jsii$Proxy) o;

            return this.subSlots != null ? this.subSlots.equals(that.subSlots) : that.subSlots == null;
        }

        @Override
        public final int hashCode() {
            int result = this.subSlots != null ? this.subSlots.hashCode() : 0;
            return result;
        }
    }
}
