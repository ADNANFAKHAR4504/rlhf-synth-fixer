package imports.aws.lexv2_models_slot;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.785Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.lexv2ModelsSlot.Lexv2ModelsSlotSubSlotSettingSlotSpecificationValueElicitationSettingWaitAndContinueSpecification")
@software.amazon.jsii.Jsii.Proxy(Lexv2ModelsSlotSubSlotSettingSlotSpecificationValueElicitationSettingWaitAndContinueSpecification.Jsii$Proxy.class)
public interface Lexv2ModelsSlotSubSlotSettingSlotSpecificationValueElicitationSettingWaitAndContinueSpecification extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_slot#active Lexv2ModelsSlot#active}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getActive() {
        return null;
    }

    /**
     * continue_response block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_slot#continue_response Lexv2ModelsSlot#continue_response}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getContinueResponse() {
        return null;
    }

    /**
     * still_waiting_response block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_slot#still_waiting_response Lexv2ModelsSlot#still_waiting_response}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getStillWaitingResponse() {
        return null;
    }

    /**
     * waiting_response block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_slot#waiting_response Lexv2ModelsSlot#waiting_response}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getWaitingResponse() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link Lexv2ModelsSlotSubSlotSettingSlotSpecificationValueElicitationSettingWaitAndContinueSpecification}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link Lexv2ModelsSlotSubSlotSettingSlotSpecificationValueElicitationSettingWaitAndContinueSpecification}
     */
    public static final class Builder implements software.amazon.jsii.Builder<Lexv2ModelsSlotSubSlotSettingSlotSpecificationValueElicitationSettingWaitAndContinueSpecification> {
        java.lang.Object active;
        java.lang.Object continueResponse;
        java.lang.Object stillWaitingResponse;
        java.lang.Object waitingResponse;

        /**
         * Sets the value of {@link Lexv2ModelsSlotSubSlotSettingSlotSpecificationValueElicitationSettingWaitAndContinueSpecification#getActive}
         * @param active Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_slot#active Lexv2ModelsSlot#active}.
         * @return {@code this}
         */
        public Builder active(java.lang.Boolean active) {
            this.active = active;
            return this;
        }

        /**
         * Sets the value of {@link Lexv2ModelsSlotSubSlotSettingSlotSpecificationValueElicitationSettingWaitAndContinueSpecification#getActive}
         * @param active Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_slot#active Lexv2ModelsSlot#active}.
         * @return {@code this}
         */
        public Builder active(com.hashicorp.cdktf.IResolvable active) {
            this.active = active;
            return this;
        }

        /**
         * Sets the value of {@link Lexv2ModelsSlotSubSlotSettingSlotSpecificationValueElicitationSettingWaitAndContinueSpecification#getContinueResponse}
         * @param continueResponse continue_response block.
         *                         Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_slot#continue_response Lexv2ModelsSlot#continue_response}
         * @return {@code this}
         */
        public Builder continueResponse(com.hashicorp.cdktf.IResolvable continueResponse) {
            this.continueResponse = continueResponse;
            return this;
        }

        /**
         * Sets the value of {@link Lexv2ModelsSlotSubSlotSettingSlotSpecificationValueElicitationSettingWaitAndContinueSpecification#getContinueResponse}
         * @param continueResponse continue_response block.
         *                         Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_slot#continue_response Lexv2ModelsSlot#continue_response}
         * @return {@code this}
         */
        public Builder continueResponse(java.util.List<? extends imports.aws.lexv2_models_slot.Lexv2ModelsSlotSubSlotSettingSlotSpecificationValueElicitationSettingWaitAndContinueSpecificationContinueResponse> continueResponse) {
            this.continueResponse = continueResponse;
            return this;
        }

        /**
         * Sets the value of {@link Lexv2ModelsSlotSubSlotSettingSlotSpecificationValueElicitationSettingWaitAndContinueSpecification#getStillWaitingResponse}
         * @param stillWaitingResponse still_waiting_response block.
         *                             Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_slot#still_waiting_response Lexv2ModelsSlot#still_waiting_response}
         * @return {@code this}
         */
        public Builder stillWaitingResponse(com.hashicorp.cdktf.IResolvable stillWaitingResponse) {
            this.stillWaitingResponse = stillWaitingResponse;
            return this;
        }

        /**
         * Sets the value of {@link Lexv2ModelsSlotSubSlotSettingSlotSpecificationValueElicitationSettingWaitAndContinueSpecification#getStillWaitingResponse}
         * @param stillWaitingResponse still_waiting_response block.
         *                             Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_slot#still_waiting_response Lexv2ModelsSlot#still_waiting_response}
         * @return {@code this}
         */
        public Builder stillWaitingResponse(java.util.List<? extends imports.aws.lexv2_models_slot.Lexv2ModelsSlotSubSlotSettingSlotSpecificationValueElicitationSettingWaitAndContinueSpecificationStillWaitingResponse> stillWaitingResponse) {
            this.stillWaitingResponse = stillWaitingResponse;
            return this;
        }

        /**
         * Sets the value of {@link Lexv2ModelsSlotSubSlotSettingSlotSpecificationValueElicitationSettingWaitAndContinueSpecification#getWaitingResponse}
         * @param waitingResponse waiting_response block.
         *                        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_slot#waiting_response Lexv2ModelsSlot#waiting_response}
         * @return {@code this}
         */
        public Builder waitingResponse(com.hashicorp.cdktf.IResolvable waitingResponse) {
            this.waitingResponse = waitingResponse;
            return this;
        }

        /**
         * Sets the value of {@link Lexv2ModelsSlotSubSlotSettingSlotSpecificationValueElicitationSettingWaitAndContinueSpecification#getWaitingResponse}
         * @param waitingResponse waiting_response block.
         *                        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_slot#waiting_response Lexv2ModelsSlot#waiting_response}
         * @return {@code this}
         */
        public Builder waitingResponse(java.util.List<? extends imports.aws.lexv2_models_slot.Lexv2ModelsSlotSubSlotSettingSlotSpecificationValueElicitationSettingWaitAndContinueSpecificationWaitingResponse> waitingResponse) {
            this.waitingResponse = waitingResponse;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link Lexv2ModelsSlotSubSlotSettingSlotSpecificationValueElicitationSettingWaitAndContinueSpecification}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public Lexv2ModelsSlotSubSlotSettingSlotSpecificationValueElicitationSettingWaitAndContinueSpecification build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link Lexv2ModelsSlotSubSlotSettingSlotSpecificationValueElicitationSettingWaitAndContinueSpecification}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements Lexv2ModelsSlotSubSlotSettingSlotSpecificationValueElicitationSettingWaitAndContinueSpecification {
        private final java.lang.Object active;
        private final java.lang.Object continueResponse;
        private final java.lang.Object stillWaitingResponse;
        private final java.lang.Object waitingResponse;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.active = software.amazon.jsii.Kernel.get(this, "active", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.continueResponse = software.amazon.jsii.Kernel.get(this, "continueResponse", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.stillWaitingResponse = software.amazon.jsii.Kernel.get(this, "stillWaitingResponse", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.waitingResponse = software.amazon.jsii.Kernel.get(this, "waitingResponse", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.active = builder.active;
            this.continueResponse = builder.continueResponse;
            this.stillWaitingResponse = builder.stillWaitingResponse;
            this.waitingResponse = builder.waitingResponse;
        }

        @Override
        public final java.lang.Object getActive() {
            return this.active;
        }

        @Override
        public final java.lang.Object getContinueResponse() {
            return this.continueResponse;
        }

        @Override
        public final java.lang.Object getStillWaitingResponse() {
            return this.stillWaitingResponse;
        }

        @Override
        public final java.lang.Object getWaitingResponse() {
            return this.waitingResponse;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getActive() != null) {
                data.set("active", om.valueToTree(this.getActive()));
            }
            if (this.getContinueResponse() != null) {
                data.set("continueResponse", om.valueToTree(this.getContinueResponse()));
            }
            if (this.getStillWaitingResponse() != null) {
                data.set("stillWaitingResponse", om.valueToTree(this.getStillWaitingResponse()));
            }
            if (this.getWaitingResponse() != null) {
                data.set("waitingResponse", om.valueToTree(this.getWaitingResponse()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.lexv2ModelsSlot.Lexv2ModelsSlotSubSlotSettingSlotSpecificationValueElicitationSettingWaitAndContinueSpecification"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            Lexv2ModelsSlotSubSlotSettingSlotSpecificationValueElicitationSettingWaitAndContinueSpecification.Jsii$Proxy that = (Lexv2ModelsSlotSubSlotSettingSlotSpecificationValueElicitationSettingWaitAndContinueSpecification.Jsii$Proxy) o;

            if (this.active != null ? !this.active.equals(that.active) : that.active != null) return false;
            if (this.continueResponse != null ? !this.continueResponse.equals(that.continueResponse) : that.continueResponse != null) return false;
            if (this.stillWaitingResponse != null ? !this.stillWaitingResponse.equals(that.stillWaitingResponse) : that.stillWaitingResponse != null) return false;
            return this.waitingResponse != null ? this.waitingResponse.equals(that.waitingResponse) : that.waitingResponse == null;
        }

        @Override
        public final int hashCode() {
            int result = this.active != null ? this.active.hashCode() : 0;
            result = 31 * result + (this.continueResponse != null ? this.continueResponse.hashCode() : 0);
            result = 31 * result + (this.stillWaitingResponse != null ? this.stillWaitingResponse.hashCode() : 0);
            result = 31 * result + (this.waitingResponse != null ? this.waitingResponse.hashCode() : 0);
            return result;
        }
    }
}
