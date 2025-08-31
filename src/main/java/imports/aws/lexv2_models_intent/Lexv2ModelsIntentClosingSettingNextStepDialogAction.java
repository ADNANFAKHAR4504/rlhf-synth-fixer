package imports.aws.lexv2_models_intent;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.567Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.lexv2ModelsIntent.Lexv2ModelsIntentClosingSettingNextStepDialogAction")
@software.amazon.jsii.Jsii.Proxy(Lexv2ModelsIntentClosingSettingNextStepDialogAction.Jsii$Proxy.class)
public interface Lexv2ModelsIntentClosingSettingNextStepDialogAction extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_intent#type Lexv2ModelsIntent#type}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getType();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_intent#slot_to_elicit Lexv2ModelsIntent#slot_to_elicit}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getSlotToElicit() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_intent#suppress_next_message Lexv2ModelsIntent#suppress_next_message}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getSuppressNextMessage() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link Lexv2ModelsIntentClosingSettingNextStepDialogAction}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link Lexv2ModelsIntentClosingSettingNextStepDialogAction}
     */
    public static final class Builder implements software.amazon.jsii.Builder<Lexv2ModelsIntentClosingSettingNextStepDialogAction> {
        java.lang.String type;
        java.lang.String slotToElicit;
        java.lang.Object suppressNextMessage;

        /**
         * Sets the value of {@link Lexv2ModelsIntentClosingSettingNextStepDialogAction#getType}
         * @param type Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_intent#type Lexv2ModelsIntent#type}. This parameter is required.
         * @return {@code this}
         */
        public Builder type(java.lang.String type) {
            this.type = type;
            return this;
        }

        /**
         * Sets the value of {@link Lexv2ModelsIntentClosingSettingNextStepDialogAction#getSlotToElicit}
         * @param slotToElicit Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_intent#slot_to_elicit Lexv2ModelsIntent#slot_to_elicit}.
         * @return {@code this}
         */
        public Builder slotToElicit(java.lang.String slotToElicit) {
            this.slotToElicit = slotToElicit;
            return this;
        }

        /**
         * Sets the value of {@link Lexv2ModelsIntentClosingSettingNextStepDialogAction#getSuppressNextMessage}
         * @param suppressNextMessage Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_intent#suppress_next_message Lexv2ModelsIntent#suppress_next_message}.
         * @return {@code this}
         */
        public Builder suppressNextMessage(java.lang.Boolean suppressNextMessage) {
            this.suppressNextMessage = suppressNextMessage;
            return this;
        }

        /**
         * Sets the value of {@link Lexv2ModelsIntentClosingSettingNextStepDialogAction#getSuppressNextMessage}
         * @param suppressNextMessage Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_intent#suppress_next_message Lexv2ModelsIntent#suppress_next_message}.
         * @return {@code this}
         */
        public Builder suppressNextMessage(com.hashicorp.cdktf.IResolvable suppressNextMessage) {
            this.suppressNextMessage = suppressNextMessage;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link Lexv2ModelsIntentClosingSettingNextStepDialogAction}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public Lexv2ModelsIntentClosingSettingNextStepDialogAction build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link Lexv2ModelsIntentClosingSettingNextStepDialogAction}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements Lexv2ModelsIntentClosingSettingNextStepDialogAction {
        private final java.lang.String type;
        private final java.lang.String slotToElicit;
        private final java.lang.Object suppressNextMessage;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.type = software.amazon.jsii.Kernel.get(this, "type", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.slotToElicit = software.amazon.jsii.Kernel.get(this, "slotToElicit", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.suppressNextMessage = software.amazon.jsii.Kernel.get(this, "suppressNextMessage", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.type = java.util.Objects.requireNonNull(builder.type, "type is required");
            this.slotToElicit = builder.slotToElicit;
            this.suppressNextMessage = builder.suppressNextMessage;
        }

        @Override
        public final java.lang.String getType() {
            return this.type;
        }

        @Override
        public final java.lang.String getSlotToElicit() {
            return this.slotToElicit;
        }

        @Override
        public final java.lang.Object getSuppressNextMessage() {
            return this.suppressNextMessage;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("type", om.valueToTree(this.getType()));
            if (this.getSlotToElicit() != null) {
                data.set("slotToElicit", om.valueToTree(this.getSlotToElicit()));
            }
            if (this.getSuppressNextMessage() != null) {
                data.set("suppressNextMessage", om.valueToTree(this.getSuppressNextMessage()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.lexv2ModelsIntent.Lexv2ModelsIntentClosingSettingNextStepDialogAction"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            Lexv2ModelsIntentClosingSettingNextStepDialogAction.Jsii$Proxy that = (Lexv2ModelsIntentClosingSettingNextStepDialogAction.Jsii$Proxy) o;

            if (!type.equals(that.type)) return false;
            if (this.slotToElicit != null ? !this.slotToElicit.equals(that.slotToElicit) : that.slotToElicit != null) return false;
            return this.suppressNextMessage != null ? this.suppressNextMessage.equals(that.suppressNextMessage) : that.suppressNextMessage == null;
        }

        @Override
        public final int hashCode() {
            int result = this.type.hashCode();
            result = 31 * result + (this.slotToElicit != null ? this.slotToElicit.hashCode() : 0);
            result = 31 * result + (this.suppressNextMessage != null ? this.suppressNextMessage.hashCode() : 0);
            return result;
        }
    }
}
