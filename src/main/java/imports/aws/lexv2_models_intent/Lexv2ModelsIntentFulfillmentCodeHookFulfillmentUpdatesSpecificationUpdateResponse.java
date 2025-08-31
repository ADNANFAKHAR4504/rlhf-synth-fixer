package imports.aws.lexv2_models_intent;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.667Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.lexv2ModelsIntent.Lexv2ModelsIntentFulfillmentCodeHookFulfillmentUpdatesSpecificationUpdateResponse")
@software.amazon.jsii.Jsii.Proxy(Lexv2ModelsIntentFulfillmentCodeHookFulfillmentUpdatesSpecificationUpdateResponse.Jsii$Proxy.class)
public interface Lexv2ModelsIntentFulfillmentCodeHookFulfillmentUpdatesSpecificationUpdateResponse extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_intent#frequency_in_seconds Lexv2ModelsIntent#frequency_in_seconds}.
     */
    @org.jetbrains.annotations.NotNull java.lang.Number getFrequencyInSeconds();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_intent#allow_interrupt Lexv2ModelsIntent#allow_interrupt}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getAllowInterrupt() {
        return null;
    }

    /**
     * message_group block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_intent#message_group Lexv2ModelsIntent#message_group}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getMessageGroup() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link Lexv2ModelsIntentFulfillmentCodeHookFulfillmentUpdatesSpecificationUpdateResponse}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link Lexv2ModelsIntentFulfillmentCodeHookFulfillmentUpdatesSpecificationUpdateResponse}
     */
    public static final class Builder implements software.amazon.jsii.Builder<Lexv2ModelsIntentFulfillmentCodeHookFulfillmentUpdatesSpecificationUpdateResponse> {
        java.lang.Number frequencyInSeconds;
        java.lang.Object allowInterrupt;
        java.lang.Object messageGroup;

        /**
         * Sets the value of {@link Lexv2ModelsIntentFulfillmentCodeHookFulfillmentUpdatesSpecificationUpdateResponse#getFrequencyInSeconds}
         * @param frequencyInSeconds Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_intent#frequency_in_seconds Lexv2ModelsIntent#frequency_in_seconds}. This parameter is required.
         * @return {@code this}
         */
        public Builder frequencyInSeconds(java.lang.Number frequencyInSeconds) {
            this.frequencyInSeconds = frequencyInSeconds;
            return this;
        }

        /**
         * Sets the value of {@link Lexv2ModelsIntentFulfillmentCodeHookFulfillmentUpdatesSpecificationUpdateResponse#getAllowInterrupt}
         * @param allowInterrupt Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_intent#allow_interrupt Lexv2ModelsIntent#allow_interrupt}.
         * @return {@code this}
         */
        public Builder allowInterrupt(java.lang.Boolean allowInterrupt) {
            this.allowInterrupt = allowInterrupt;
            return this;
        }

        /**
         * Sets the value of {@link Lexv2ModelsIntentFulfillmentCodeHookFulfillmentUpdatesSpecificationUpdateResponse#getAllowInterrupt}
         * @param allowInterrupt Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_intent#allow_interrupt Lexv2ModelsIntent#allow_interrupt}.
         * @return {@code this}
         */
        public Builder allowInterrupt(com.hashicorp.cdktf.IResolvable allowInterrupt) {
            this.allowInterrupt = allowInterrupt;
            return this;
        }

        /**
         * Sets the value of {@link Lexv2ModelsIntentFulfillmentCodeHookFulfillmentUpdatesSpecificationUpdateResponse#getMessageGroup}
         * @param messageGroup message_group block.
         *                     Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_intent#message_group Lexv2ModelsIntent#message_group}
         * @return {@code this}
         */
        public Builder messageGroup(com.hashicorp.cdktf.IResolvable messageGroup) {
            this.messageGroup = messageGroup;
            return this;
        }

        /**
         * Sets the value of {@link Lexv2ModelsIntentFulfillmentCodeHookFulfillmentUpdatesSpecificationUpdateResponse#getMessageGroup}
         * @param messageGroup message_group block.
         *                     Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_intent#message_group Lexv2ModelsIntent#message_group}
         * @return {@code this}
         */
        public Builder messageGroup(java.util.List<? extends imports.aws.lexv2_models_intent.Lexv2ModelsIntentFulfillmentCodeHookFulfillmentUpdatesSpecificationUpdateResponseMessageGroup> messageGroup) {
            this.messageGroup = messageGroup;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link Lexv2ModelsIntentFulfillmentCodeHookFulfillmentUpdatesSpecificationUpdateResponse}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public Lexv2ModelsIntentFulfillmentCodeHookFulfillmentUpdatesSpecificationUpdateResponse build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link Lexv2ModelsIntentFulfillmentCodeHookFulfillmentUpdatesSpecificationUpdateResponse}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements Lexv2ModelsIntentFulfillmentCodeHookFulfillmentUpdatesSpecificationUpdateResponse {
        private final java.lang.Number frequencyInSeconds;
        private final java.lang.Object allowInterrupt;
        private final java.lang.Object messageGroup;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.frequencyInSeconds = software.amazon.jsii.Kernel.get(this, "frequencyInSeconds", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.allowInterrupt = software.amazon.jsii.Kernel.get(this, "allowInterrupt", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.messageGroup = software.amazon.jsii.Kernel.get(this, "messageGroup", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.frequencyInSeconds = java.util.Objects.requireNonNull(builder.frequencyInSeconds, "frequencyInSeconds is required");
            this.allowInterrupt = builder.allowInterrupt;
            this.messageGroup = builder.messageGroup;
        }

        @Override
        public final java.lang.Number getFrequencyInSeconds() {
            return this.frequencyInSeconds;
        }

        @Override
        public final java.lang.Object getAllowInterrupt() {
            return this.allowInterrupt;
        }

        @Override
        public final java.lang.Object getMessageGroup() {
            return this.messageGroup;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("frequencyInSeconds", om.valueToTree(this.getFrequencyInSeconds()));
            if (this.getAllowInterrupt() != null) {
                data.set("allowInterrupt", om.valueToTree(this.getAllowInterrupt()));
            }
            if (this.getMessageGroup() != null) {
                data.set("messageGroup", om.valueToTree(this.getMessageGroup()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.lexv2ModelsIntent.Lexv2ModelsIntentFulfillmentCodeHookFulfillmentUpdatesSpecificationUpdateResponse"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            Lexv2ModelsIntentFulfillmentCodeHookFulfillmentUpdatesSpecificationUpdateResponse.Jsii$Proxy that = (Lexv2ModelsIntentFulfillmentCodeHookFulfillmentUpdatesSpecificationUpdateResponse.Jsii$Proxy) o;

            if (!frequencyInSeconds.equals(that.frequencyInSeconds)) return false;
            if (this.allowInterrupt != null ? !this.allowInterrupt.equals(that.allowInterrupt) : that.allowInterrupt != null) return false;
            return this.messageGroup != null ? this.messageGroup.equals(that.messageGroup) : that.messageGroup == null;
        }

        @Override
        public final int hashCode() {
            int result = this.frequencyInSeconds.hashCode();
            result = 31 * result + (this.allowInterrupt != null ? this.allowInterrupt.hashCode() : 0);
            result = 31 * result + (this.messageGroup != null ? this.messageGroup.hashCode() : 0);
            return result;
        }
    }
}
