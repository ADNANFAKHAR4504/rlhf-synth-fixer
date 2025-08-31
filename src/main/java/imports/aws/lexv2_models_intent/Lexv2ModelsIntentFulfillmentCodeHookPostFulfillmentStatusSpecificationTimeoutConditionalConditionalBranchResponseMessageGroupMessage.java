package imports.aws.lexv2_models_intent;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.703Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.lexv2ModelsIntent.Lexv2ModelsIntentFulfillmentCodeHookPostFulfillmentStatusSpecificationTimeoutConditionalConditionalBranchResponseMessageGroupMessage")
@software.amazon.jsii.Jsii.Proxy(Lexv2ModelsIntentFulfillmentCodeHookPostFulfillmentStatusSpecificationTimeoutConditionalConditionalBranchResponseMessageGroupMessage.Jsii$Proxy.class)
public interface Lexv2ModelsIntentFulfillmentCodeHookPostFulfillmentStatusSpecificationTimeoutConditionalConditionalBranchResponseMessageGroupMessage extends software.amazon.jsii.JsiiSerializable {

    /**
     * custom_payload block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_intent#custom_payload Lexv2ModelsIntent#custom_payload}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getCustomPayload() {
        return null;
    }

    /**
     * image_response_card block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_intent#image_response_card Lexv2ModelsIntent#image_response_card}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getImageResponseCard() {
        return null;
    }

    /**
     * plain_text_message block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_intent#plain_text_message Lexv2ModelsIntent#plain_text_message}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getPlainTextMessage() {
        return null;
    }

    /**
     * ssml_message block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_intent#ssml_message Lexv2ModelsIntent#ssml_message}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getSsmlMessage() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link Lexv2ModelsIntentFulfillmentCodeHookPostFulfillmentStatusSpecificationTimeoutConditionalConditionalBranchResponseMessageGroupMessage}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link Lexv2ModelsIntentFulfillmentCodeHookPostFulfillmentStatusSpecificationTimeoutConditionalConditionalBranchResponseMessageGroupMessage}
     */
    public static final class Builder implements software.amazon.jsii.Builder<Lexv2ModelsIntentFulfillmentCodeHookPostFulfillmentStatusSpecificationTimeoutConditionalConditionalBranchResponseMessageGroupMessage> {
        java.lang.Object customPayload;
        java.lang.Object imageResponseCard;
        java.lang.Object plainTextMessage;
        java.lang.Object ssmlMessage;

        /**
         * Sets the value of {@link Lexv2ModelsIntentFulfillmentCodeHookPostFulfillmentStatusSpecificationTimeoutConditionalConditionalBranchResponseMessageGroupMessage#getCustomPayload}
         * @param customPayload custom_payload block.
         *                      Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_intent#custom_payload Lexv2ModelsIntent#custom_payload}
         * @return {@code this}
         */
        public Builder customPayload(com.hashicorp.cdktf.IResolvable customPayload) {
            this.customPayload = customPayload;
            return this;
        }

        /**
         * Sets the value of {@link Lexv2ModelsIntentFulfillmentCodeHookPostFulfillmentStatusSpecificationTimeoutConditionalConditionalBranchResponseMessageGroupMessage#getCustomPayload}
         * @param customPayload custom_payload block.
         *                      Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_intent#custom_payload Lexv2ModelsIntent#custom_payload}
         * @return {@code this}
         */
        public Builder customPayload(java.util.List<? extends imports.aws.lexv2_models_intent.Lexv2ModelsIntentFulfillmentCodeHookPostFulfillmentStatusSpecificationTimeoutConditionalConditionalBranchResponseMessageGroupMessageCustomPayload> customPayload) {
            this.customPayload = customPayload;
            return this;
        }

        /**
         * Sets the value of {@link Lexv2ModelsIntentFulfillmentCodeHookPostFulfillmentStatusSpecificationTimeoutConditionalConditionalBranchResponseMessageGroupMessage#getImageResponseCard}
         * @param imageResponseCard image_response_card block.
         *                          Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_intent#image_response_card Lexv2ModelsIntent#image_response_card}
         * @return {@code this}
         */
        public Builder imageResponseCard(com.hashicorp.cdktf.IResolvable imageResponseCard) {
            this.imageResponseCard = imageResponseCard;
            return this;
        }

        /**
         * Sets the value of {@link Lexv2ModelsIntentFulfillmentCodeHookPostFulfillmentStatusSpecificationTimeoutConditionalConditionalBranchResponseMessageGroupMessage#getImageResponseCard}
         * @param imageResponseCard image_response_card block.
         *                          Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_intent#image_response_card Lexv2ModelsIntent#image_response_card}
         * @return {@code this}
         */
        public Builder imageResponseCard(java.util.List<? extends imports.aws.lexv2_models_intent.Lexv2ModelsIntentFulfillmentCodeHookPostFulfillmentStatusSpecificationTimeoutConditionalConditionalBranchResponseMessageGroupMessageImageResponseCard> imageResponseCard) {
            this.imageResponseCard = imageResponseCard;
            return this;
        }

        /**
         * Sets the value of {@link Lexv2ModelsIntentFulfillmentCodeHookPostFulfillmentStatusSpecificationTimeoutConditionalConditionalBranchResponseMessageGroupMessage#getPlainTextMessage}
         * @param plainTextMessage plain_text_message block.
         *                         Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_intent#plain_text_message Lexv2ModelsIntent#plain_text_message}
         * @return {@code this}
         */
        public Builder plainTextMessage(com.hashicorp.cdktf.IResolvable plainTextMessage) {
            this.plainTextMessage = plainTextMessage;
            return this;
        }

        /**
         * Sets the value of {@link Lexv2ModelsIntentFulfillmentCodeHookPostFulfillmentStatusSpecificationTimeoutConditionalConditionalBranchResponseMessageGroupMessage#getPlainTextMessage}
         * @param plainTextMessage plain_text_message block.
         *                         Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_intent#plain_text_message Lexv2ModelsIntent#plain_text_message}
         * @return {@code this}
         */
        public Builder plainTextMessage(java.util.List<? extends imports.aws.lexv2_models_intent.Lexv2ModelsIntentFulfillmentCodeHookPostFulfillmentStatusSpecificationTimeoutConditionalConditionalBranchResponseMessageGroupMessagePlainTextMessage> plainTextMessage) {
            this.plainTextMessage = plainTextMessage;
            return this;
        }

        /**
         * Sets the value of {@link Lexv2ModelsIntentFulfillmentCodeHookPostFulfillmentStatusSpecificationTimeoutConditionalConditionalBranchResponseMessageGroupMessage#getSsmlMessage}
         * @param ssmlMessage ssml_message block.
         *                    Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_intent#ssml_message Lexv2ModelsIntent#ssml_message}
         * @return {@code this}
         */
        public Builder ssmlMessage(com.hashicorp.cdktf.IResolvable ssmlMessage) {
            this.ssmlMessage = ssmlMessage;
            return this;
        }

        /**
         * Sets the value of {@link Lexv2ModelsIntentFulfillmentCodeHookPostFulfillmentStatusSpecificationTimeoutConditionalConditionalBranchResponseMessageGroupMessage#getSsmlMessage}
         * @param ssmlMessage ssml_message block.
         *                    Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_intent#ssml_message Lexv2ModelsIntent#ssml_message}
         * @return {@code this}
         */
        public Builder ssmlMessage(java.util.List<? extends imports.aws.lexv2_models_intent.Lexv2ModelsIntentFulfillmentCodeHookPostFulfillmentStatusSpecificationTimeoutConditionalConditionalBranchResponseMessageGroupMessageSsmlMessage> ssmlMessage) {
            this.ssmlMessage = ssmlMessage;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link Lexv2ModelsIntentFulfillmentCodeHookPostFulfillmentStatusSpecificationTimeoutConditionalConditionalBranchResponseMessageGroupMessage}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public Lexv2ModelsIntentFulfillmentCodeHookPostFulfillmentStatusSpecificationTimeoutConditionalConditionalBranchResponseMessageGroupMessage build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link Lexv2ModelsIntentFulfillmentCodeHookPostFulfillmentStatusSpecificationTimeoutConditionalConditionalBranchResponseMessageGroupMessage}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements Lexv2ModelsIntentFulfillmentCodeHookPostFulfillmentStatusSpecificationTimeoutConditionalConditionalBranchResponseMessageGroupMessage {
        private final java.lang.Object customPayload;
        private final java.lang.Object imageResponseCard;
        private final java.lang.Object plainTextMessage;
        private final java.lang.Object ssmlMessage;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.customPayload = software.amazon.jsii.Kernel.get(this, "customPayload", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.imageResponseCard = software.amazon.jsii.Kernel.get(this, "imageResponseCard", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.plainTextMessage = software.amazon.jsii.Kernel.get(this, "plainTextMessage", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.ssmlMessage = software.amazon.jsii.Kernel.get(this, "ssmlMessage", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.customPayload = builder.customPayload;
            this.imageResponseCard = builder.imageResponseCard;
            this.plainTextMessage = builder.plainTextMessage;
            this.ssmlMessage = builder.ssmlMessage;
        }

        @Override
        public final java.lang.Object getCustomPayload() {
            return this.customPayload;
        }

        @Override
        public final java.lang.Object getImageResponseCard() {
            return this.imageResponseCard;
        }

        @Override
        public final java.lang.Object getPlainTextMessage() {
            return this.plainTextMessage;
        }

        @Override
        public final java.lang.Object getSsmlMessage() {
            return this.ssmlMessage;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getCustomPayload() != null) {
                data.set("customPayload", om.valueToTree(this.getCustomPayload()));
            }
            if (this.getImageResponseCard() != null) {
                data.set("imageResponseCard", om.valueToTree(this.getImageResponseCard()));
            }
            if (this.getPlainTextMessage() != null) {
                data.set("plainTextMessage", om.valueToTree(this.getPlainTextMessage()));
            }
            if (this.getSsmlMessage() != null) {
                data.set("ssmlMessage", om.valueToTree(this.getSsmlMessage()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.lexv2ModelsIntent.Lexv2ModelsIntentFulfillmentCodeHookPostFulfillmentStatusSpecificationTimeoutConditionalConditionalBranchResponseMessageGroupMessage"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            Lexv2ModelsIntentFulfillmentCodeHookPostFulfillmentStatusSpecificationTimeoutConditionalConditionalBranchResponseMessageGroupMessage.Jsii$Proxy that = (Lexv2ModelsIntentFulfillmentCodeHookPostFulfillmentStatusSpecificationTimeoutConditionalConditionalBranchResponseMessageGroupMessage.Jsii$Proxy) o;

            if (this.customPayload != null ? !this.customPayload.equals(that.customPayload) : that.customPayload != null) return false;
            if (this.imageResponseCard != null ? !this.imageResponseCard.equals(that.imageResponseCard) : that.imageResponseCard != null) return false;
            if (this.plainTextMessage != null ? !this.plainTextMessage.equals(that.plainTextMessage) : that.plainTextMessage != null) return false;
            return this.ssmlMessage != null ? this.ssmlMessage.equals(that.ssmlMessage) : that.ssmlMessage == null;
        }

        @Override
        public final int hashCode() {
            int result = this.customPayload != null ? this.customPayload.hashCode() : 0;
            result = 31 * result + (this.imageResponseCard != null ? this.imageResponseCard.hashCode() : 0);
            result = 31 * result + (this.plainTextMessage != null ? this.plainTextMessage.hashCode() : 0);
            result = 31 * result + (this.ssmlMessage != null ? this.ssmlMessage.hashCode() : 0);
            return result;
        }
    }
}
