package imports.aws.lexv2_models_slot;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.778Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.lexv2ModelsSlot.Lexv2ModelsSlotMultipleValuesSetting")
@software.amazon.jsii.Jsii.Proxy(Lexv2ModelsSlotMultipleValuesSetting.Jsii$Proxy.class)
public interface Lexv2ModelsSlotMultipleValuesSetting extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_slot#allow_multiple_values Lexv2ModelsSlot#allow_multiple_values}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getAllowMultipleValues() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link Lexv2ModelsSlotMultipleValuesSetting}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link Lexv2ModelsSlotMultipleValuesSetting}
     */
    public static final class Builder implements software.amazon.jsii.Builder<Lexv2ModelsSlotMultipleValuesSetting> {
        java.lang.Object allowMultipleValues;

        /**
         * Sets the value of {@link Lexv2ModelsSlotMultipleValuesSetting#getAllowMultipleValues}
         * @param allowMultipleValues Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_slot#allow_multiple_values Lexv2ModelsSlot#allow_multiple_values}.
         * @return {@code this}
         */
        public Builder allowMultipleValues(java.lang.Boolean allowMultipleValues) {
            this.allowMultipleValues = allowMultipleValues;
            return this;
        }

        /**
         * Sets the value of {@link Lexv2ModelsSlotMultipleValuesSetting#getAllowMultipleValues}
         * @param allowMultipleValues Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_slot#allow_multiple_values Lexv2ModelsSlot#allow_multiple_values}.
         * @return {@code this}
         */
        public Builder allowMultipleValues(com.hashicorp.cdktf.IResolvable allowMultipleValues) {
            this.allowMultipleValues = allowMultipleValues;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link Lexv2ModelsSlotMultipleValuesSetting}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public Lexv2ModelsSlotMultipleValuesSetting build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link Lexv2ModelsSlotMultipleValuesSetting}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements Lexv2ModelsSlotMultipleValuesSetting {
        private final java.lang.Object allowMultipleValues;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.allowMultipleValues = software.amazon.jsii.Kernel.get(this, "allowMultipleValues", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.allowMultipleValues = builder.allowMultipleValues;
        }

        @Override
        public final java.lang.Object getAllowMultipleValues() {
            return this.allowMultipleValues;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getAllowMultipleValues() != null) {
                data.set("allowMultipleValues", om.valueToTree(this.getAllowMultipleValues()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.lexv2ModelsSlot.Lexv2ModelsSlotMultipleValuesSetting"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            Lexv2ModelsSlotMultipleValuesSetting.Jsii$Proxy that = (Lexv2ModelsSlotMultipleValuesSetting.Jsii$Proxy) o;

            return this.allowMultipleValues != null ? this.allowMultipleValues.equals(that.allowMultipleValues) : that.allowMultipleValues == null;
        }

        @Override
        public final int hashCode() {
            int result = this.allowMultipleValues != null ? this.allowMultipleValues.hashCode() : 0;
            return result;
        }
    }
}
