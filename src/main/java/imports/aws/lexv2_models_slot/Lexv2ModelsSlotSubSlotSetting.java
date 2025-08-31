package imports.aws.lexv2_models_slot;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.778Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.lexv2ModelsSlot.Lexv2ModelsSlotSubSlotSetting")
@software.amazon.jsii.Jsii.Proxy(Lexv2ModelsSlotSubSlotSetting.Jsii$Proxy.class)
public interface Lexv2ModelsSlotSubSlotSetting extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_slot#expression Lexv2ModelsSlot#expression}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getExpression() {
        return null;
    }

    /**
     * slot_specification block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_slot#slot_specification Lexv2ModelsSlot#slot_specification}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getSlotSpecification() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link Lexv2ModelsSlotSubSlotSetting}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link Lexv2ModelsSlotSubSlotSetting}
     */
    public static final class Builder implements software.amazon.jsii.Builder<Lexv2ModelsSlotSubSlotSetting> {
        java.lang.String expression;
        java.lang.Object slotSpecification;

        /**
         * Sets the value of {@link Lexv2ModelsSlotSubSlotSetting#getExpression}
         * @param expression Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_slot#expression Lexv2ModelsSlot#expression}.
         * @return {@code this}
         */
        public Builder expression(java.lang.String expression) {
            this.expression = expression;
            return this;
        }

        /**
         * Sets the value of {@link Lexv2ModelsSlotSubSlotSetting#getSlotSpecification}
         * @param slotSpecification slot_specification block.
         *                          Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_slot#slot_specification Lexv2ModelsSlot#slot_specification}
         * @return {@code this}
         */
        public Builder slotSpecification(com.hashicorp.cdktf.IResolvable slotSpecification) {
            this.slotSpecification = slotSpecification;
            return this;
        }

        /**
         * Sets the value of {@link Lexv2ModelsSlotSubSlotSetting#getSlotSpecification}
         * @param slotSpecification slot_specification block.
         *                          Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_slot#slot_specification Lexv2ModelsSlot#slot_specification}
         * @return {@code this}
         */
        public Builder slotSpecification(java.util.List<? extends imports.aws.lexv2_models_slot.Lexv2ModelsSlotSubSlotSettingSlotSpecification> slotSpecification) {
            this.slotSpecification = slotSpecification;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link Lexv2ModelsSlotSubSlotSetting}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public Lexv2ModelsSlotSubSlotSetting build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link Lexv2ModelsSlotSubSlotSetting}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements Lexv2ModelsSlotSubSlotSetting {
        private final java.lang.String expression;
        private final java.lang.Object slotSpecification;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.expression = software.amazon.jsii.Kernel.get(this, "expression", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.slotSpecification = software.amazon.jsii.Kernel.get(this, "slotSpecification", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.expression = builder.expression;
            this.slotSpecification = builder.slotSpecification;
        }

        @Override
        public final java.lang.String getExpression() {
            return this.expression;
        }

        @Override
        public final java.lang.Object getSlotSpecification() {
            return this.slotSpecification;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getExpression() != null) {
                data.set("expression", om.valueToTree(this.getExpression()));
            }
            if (this.getSlotSpecification() != null) {
                data.set("slotSpecification", om.valueToTree(this.getSlotSpecification()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.lexv2ModelsSlot.Lexv2ModelsSlotSubSlotSetting"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            Lexv2ModelsSlotSubSlotSetting.Jsii$Proxy that = (Lexv2ModelsSlotSubSlotSetting.Jsii$Proxy) o;

            if (this.expression != null ? !this.expression.equals(that.expression) : that.expression != null) return false;
            return this.slotSpecification != null ? this.slotSpecification.equals(that.slotSpecification) : that.slotSpecification == null;
        }

        @Override
        public final int hashCode() {
            int result = this.expression != null ? this.expression.hashCode() : 0;
            result = 31 * result + (this.slotSpecification != null ? this.slotSpecification.hashCode() : 0);
            return result;
        }
    }
}
