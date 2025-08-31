package imports.aws.lexv2_models_slot_type;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.812Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.lexv2ModelsSlotType.Lexv2ModelsSlotTypeCompositeSlotTypeSettingSubSlots")
@software.amazon.jsii.Jsii.Proxy(Lexv2ModelsSlotTypeCompositeSlotTypeSettingSubSlots.Jsii$Proxy.class)
public interface Lexv2ModelsSlotTypeCompositeSlotTypeSettingSubSlots extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_slot_type#name Lexv2ModelsSlotType#name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getName();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_slot_type#slot_type_id Lexv2ModelsSlotType#slot_type_id}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getSlotTypeId();

    /**
     * @return a {@link Builder} of {@link Lexv2ModelsSlotTypeCompositeSlotTypeSettingSubSlots}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link Lexv2ModelsSlotTypeCompositeSlotTypeSettingSubSlots}
     */
    public static final class Builder implements software.amazon.jsii.Builder<Lexv2ModelsSlotTypeCompositeSlotTypeSettingSubSlots> {
        java.lang.String name;
        java.lang.String slotTypeId;

        /**
         * Sets the value of {@link Lexv2ModelsSlotTypeCompositeSlotTypeSettingSubSlots#getName}
         * @param name Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_slot_type#name Lexv2ModelsSlotType#name}. This parameter is required.
         * @return {@code this}
         */
        public Builder name(java.lang.String name) {
            this.name = name;
            return this;
        }

        /**
         * Sets the value of {@link Lexv2ModelsSlotTypeCompositeSlotTypeSettingSubSlots#getSlotTypeId}
         * @param slotTypeId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_slot_type#slot_type_id Lexv2ModelsSlotType#slot_type_id}. This parameter is required.
         * @return {@code this}
         */
        public Builder slotTypeId(java.lang.String slotTypeId) {
            this.slotTypeId = slotTypeId;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link Lexv2ModelsSlotTypeCompositeSlotTypeSettingSubSlots}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public Lexv2ModelsSlotTypeCompositeSlotTypeSettingSubSlots build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link Lexv2ModelsSlotTypeCompositeSlotTypeSettingSubSlots}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements Lexv2ModelsSlotTypeCompositeSlotTypeSettingSubSlots {
        private final java.lang.String name;
        private final java.lang.String slotTypeId;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.name = software.amazon.jsii.Kernel.get(this, "name", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.slotTypeId = software.amazon.jsii.Kernel.get(this, "slotTypeId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.name = java.util.Objects.requireNonNull(builder.name, "name is required");
            this.slotTypeId = java.util.Objects.requireNonNull(builder.slotTypeId, "slotTypeId is required");
        }

        @Override
        public final java.lang.String getName() {
            return this.name;
        }

        @Override
        public final java.lang.String getSlotTypeId() {
            return this.slotTypeId;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("name", om.valueToTree(this.getName()));
            data.set("slotTypeId", om.valueToTree(this.getSlotTypeId()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.lexv2ModelsSlotType.Lexv2ModelsSlotTypeCompositeSlotTypeSettingSubSlots"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            Lexv2ModelsSlotTypeCompositeSlotTypeSettingSubSlots.Jsii$Proxy that = (Lexv2ModelsSlotTypeCompositeSlotTypeSettingSubSlots.Jsii$Proxy) o;

            if (!name.equals(that.name)) return false;
            return this.slotTypeId.equals(that.slotTypeId);
        }

        @Override
        public final int hashCode() {
            int result = this.name.hashCode();
            result = 31 * result + (this.slotTypeId.hashCode());
            return result;
        }
    }
}
