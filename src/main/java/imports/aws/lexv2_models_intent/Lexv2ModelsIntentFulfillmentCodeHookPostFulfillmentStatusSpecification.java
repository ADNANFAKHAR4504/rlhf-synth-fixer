package imports.aws.lexv2_models_intent;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.670Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.lexv2ModelsIntent.Lexv2ModelsIntentFulfillmentCodeHookPostFulfillmentStatusSpecification")
@software.amazon.jsii.Jsii.Proxy(Lexv2ModelsIntentFulfillmentCodeHookPostFulfillmentStatusSpecification.Jsii$Proxy.class)
public interface Lexv2ModelsIntentFulfillmentCodeHookPostFulfillmentStatusSpecification extends software.amazon.jsii.JsiiSerializable {

    /**
     * failure_conditional block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_intent#failure_conditional Lexv2ModelsIntent#failure_conditional}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getFailureConditional() {
        return null;
    }

    /**
     * failure_next_step block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_intent#failure_next_step Lexv2ModelsIntent#failure_next_step}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getFailureNextStep() {
        return null;
    }

    /**
     * failure_response block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_intent#failure_response Lexv2ModelsIntent#failure_response}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getFailureResponse() {
        return null;
    }

    /**
     * success_conditional block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_intent#success_conditional Lexv2ModelsIntent#success_conditional}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getSuccessConditional() {
        return null;
    }

    /**
     * success_next_step block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_intent#success_next_step Lexv2ModelsIntent#success_next_step}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getSuccessNextStep() {
        return null;
    }

    /**
     * success_response block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_intent#success_response Lexv2ModelsIntent#success_response}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getSuccessResponse() {
        return null;
    }

    /**
     * timeout_conditional block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_intent#timeout_conditional Lexv2ModelsIntent#timeout_conditional}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getTimeoutConditional() {
        return null;
    }

    /**
     * timeout_next_step block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_intent#timeout_next_step Lexv2ModelsIntent#timeout_next_step}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getTimeoutNextStep() {
        return null;
    }

    /**
     * timeout_response block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_intent#timeout_response Lexv2ModelsIntent#timeout_response}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getTimeoutResponse() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link Lexv2ModelsIntentFulfillmentCodeHookPostFulfillmentStatusSpecification}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link Lexv2ModelsIntentFulfillmentCodeHookPostFulfillmentStatusSpecification}
     */
    public static final class Builder implements software.amazon.jsii.Builder<Lexv2ModelsIntentFulfillmentCodeHookPostFulfillmentStatusSpecification> {
        java.lang.Object failureConditional;
        java.lang.Object failureNextStep;
        java.lang.Object failureResponse;
        java.lang.Object successConditional;
        java.lang.Object successNextStep;
        java.lang.Object successResponse;
        java.lang.Object timeoutConditional;
        java.lang.Object timeoutNextStep;
        java.lang.Object timeoutResponse;

        /**
         * Sets the value of {@link Lexv2ModelsIntentFulfillmentCodeHookPostFulfillmentStatusSpecification#getFailureConditional}
         * @param failureConditional failure_conditional block.
         *                           Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_intent#failure_conditional Lexv2ModelsIntent#failure_conditional}
         * @return {@code this}
         */
        public Builder failureConditional(com.hashicorp.cdktf.IResolvable failureConditional) {
            this.failureConditional = failureConditional;
            return this;
        }

        /**
         * Sets the value of {@link Lexv2ModelsIntentFulfillmentCodeHookPostFulfillmentStatusSpecification#getFailureConditional}
         * @param failureConditional failure_conditional block.
         *                           Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_intent#failure_conditional Lexv2ModelsIntent#failure_conditional}
         * @return {@code this}
         */
        public Builder failureConditional(java.util.List<? extends imports.aws.lexv2_models_intent.Lexv2ModelsIntentFulfillmentCodeHookPostFulfillmentStatusSpecificationFailureConditional> failureConditional) {
            this.failureConditional = failureConditional;
            return this;
        }

        /**
         * Sets the value of {@link Lexv2ModelsIntentFulfillmentCodeHookPostFulfillmentStatusSpecification#getFailureNextStep}
         * @param failureNextStep failure_next_step block.
         *                        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_intent#failure_next_step Lexv2ModelsIntent#failure_next_step}
         * @return {@code this}
         */
        public Builder failureNextStep(com.hashicorp.cdktf.IResolvable failureNextStep) {
            this.failureNextStep = failureNextStep;
            return this;
        }

        /**
         * Sets the value of {@link Lexv2ModelsIntentFulfillmentCodeHookPostFulfillmentStatusSpecification#getFailureNextStep}
         * @param failureNextStep failure_next_step block.
         *                        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_intent#failure_next_step Lexv2ModelsIntent#failure_next_step}
         * @return {@code this}
         */
        public Builder failureNextStep(java.util.List<? extends imports.aws.lexv2_models_intent.Lexv2ModelsIntentFulfillmentCodeHookPostFulfillmentStatusSpecificationFailureNextStep> failureNextStep) {
            this.failureNextStep = failureNextStep;
            return this;
        }

        /**
         * Sets the value of {@link Lexv2ModelsIntentFulfillmentCodeHookPostFulfillmentStatusSpecification#getFailureResponse}
         * @param failureResponse failure_response block.
         *                        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_intent#failure_response Lexv2ModelsIntent#failure_response}
         * @return {@code this}
         */
        public Builder failureResponse(com.hashicorp.cdktf.IResolvable failureResponse) {
            this.failureResponse = failureResponse;
            return this;
        }

        /**
         * Sets the value of {@link Lexv2ModelsIntentFulfillmentCodeHookPostFulfillmentStatusSpecification#getFailureResponse}
         * @param failureResponse failure_response block.
         *                        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_intent#failure_response Lexv2ModelsIntent#failure_response}
         * @return {@code this}
         */
        public Builder failureResponse(java.util.List<? extends imports.aws.lexv2_models_intent.Lexv2ModelsIntentFulfillmentCodeHookPostFulfillmentStatusSpecificationFailureResponse> failureResponse) {
            this.failureResponse = failureResponse;
            return this;
        }

        /**
         * Sets the value of {@link Lexv2ModelsIntentFulfillmentCodeHookPostFulfillmentStatusSpecification#getSuccessConditional}
         * @param successConditional success_conditional block.
         *                           Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_intent#success_conditional Lexv2ModelsIntent#success_conditional}
         * @return {@code this}
         */
        public Builder successConditional(com.hashicorp.cdktf.IResolvable successConditional) {
            this.successConditional = successConditional;
            return this;
        }

        /**
         * Sets the value of {@link Lexv2ModelsIntentFulfillmentCodeHookPostFulfillmentStatusSpecification#getSuccessConditional}
         * @param successConditional success_conditional block.
         *                           Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_intent#success_conditional Lexv2ModelsIntent#success_conditional}
         * @return {@code this}
         */
        public Builder successConditional(java.util.List<? extends imports.aws.lexv2_models_intent.Lexv2ModelsIntentFulfillmentCodeHookPostFulfillmentStatusSpecificationSuccessConditional> successConditional) {
            this.successConditional = successConditional;
            return this;
        }

        /**
         * Sets the value of {@link Lexv2ModelsIntentFulfillmentCodeHookPostFulfillmentStatusSpecification#getSuccessNextStep}
         * @param successNextStep success_next_step block.
         *                        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_intent#success_next_step Lexv2ModelsIntent#success_next_step}
         * @return {@code this}
         */
        public Builder successNextStep(com.hashicorp.cdktf.IResolvable successNextStep) {
            this.successNextStep = successNextStep;
            return this;
        }

        /**
         * Sets the value of {@link Lexv2ModelsIntentFulfillmentCodeHookPostFulfillmentStatusSpecification#getSuccessNextStep}
         * @param successNextStep success_next_step block.
         *                        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_intent#success_next_step Lexv2ModelsIntent#success_next_step}
         * @return {@code this}
         */
        public Builder successNextStep(java.util.List<? extends imports.aws.lexv2_models_intent.Lexv2ModelsIntentFulfillmentCodeHookPostFulfillmentStatusSpecificationSuccessNextStep> successNextStep) {
            this.successNextStep = successNextStep;
            return this;
        }

        /**
         * Sets the value of {@link Lexv2ModelsIntentFulfillmentCodeHookPostFulfillmentStatusSpecification#getSuccessResponse}
         * @param successResponse success_response block.
         *                        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_intent#success_response Lexv2ModelsIntent#success_response}
         * @return {@code this}
         */
        public Builder successResponse(com.hashicorp.cdktf.IResolvable successResponse) {
            this.successResponse = successResponse;
            return this;
        }

        /**
         * Sets the value of {@link Lexv2ModelsIntentFulfillmentCodeHookPostFulfillmentStatusSpecification#getSuccessResponse}
         * @param successResponse success_response block.
         *                        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_intent#success_response Lexv2ModelsIntent#success_response}
         * @return {@code this}
         */
        public Builder successResponse(java.util.List<? extends imports.aws.lexv2_models_intent.Lexv2ModelsIntentFulfillmentCodeHookPostFulfillmentStatusSpecificationSuccessResponse> successResponse) {
            this.successResponse = successResponse;
            return this;
        }

        /**
         * Sets the value of {@link Lexv2ModelsIntentFulfillmentCodeHookPostFulfillmentStatusSpecification#getTimeoutConditional}
         * @param timeoutConditional timeout_conditional block.
         *                           Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_intent#timeout_conditional Lexv2ModelsIntent#timeout_conditional}
         * @return {@code this}
         */
        public Builder timeoutConditional(com.hashicorp.cdktf.IResolvable timeoutConditional) {
            this.timeoutConditional = timeoutConditional;
            return this;
        }

        /**
         * Sets the value of {@link Lexv2ModelsIntentFulfillmentCodeHookPostFulfillmentStatusSpecification#getTimeoutConditional}
         * @param timeoutConditional timeout_conditional block.
         *                           Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_intent#timeout_conditional Lexv2ModelsIntent#timeout_conditional}
         * @return {@code this}
         */
        public Builder timeoutConditional(java.util.List<? extends imports.aws.lexv2_models_intent.Lexv2ModelsIntentFulfillmentCodeHookPostFulfillmentStatusSpecificationTimeoutConditional> timeoutConditional) {
            this.timeoutConditional = timeoutConditional;
            return this;
        }

        /**
         * Sets the value of {@link Lexv2ModelsIntentFulfillmentCodeHookPostFulfillmentStatusSpecification#getTimeoutNextStep}
         * @param timeoutNextStep timeout_next_step block.
         *                        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_intent#timeout_next_step Lexv2ModelsIntent#timeout_next_step}
         * @return {@code this}
         */
        public Builder timeoutNextStep(com.hashicorp.cdktf.IResolvable timeoutNextStep) {
            this.timeoutNextStep = timeoutNextStep;
            return this;
        }

        /**
         * Sets the value of {@link Lexv2ModelsIntentFulfillmentCodeHookPostFulfillmentStatusSpecification#getTimeoutNextStep}
         * @param timeoutNextStep timeout_next_step block.
         *                        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_intent#timeout_next_step Lexv2ModelsIntent#timeout_next_step}
         * @return {@code this}
         */
        public Builder timeoutNextStep(java.util.List<? extends imports.aws.lexv2_models_intent.Lexv2ModelsIntentFulfillmentCodeHookPostFulfillmentStatusSpecificationTimeoutNextStep> timeoutNextStep) {
            this.timeoutNextStep = timeoutNextStep;
            return this;
        }

        /**
         * Sets the value of {@link Lexv2ModelsIntentFulfillmentCodeHookPostFulfillmentStatusSpecification#getTimeoutResponse}
         * @param timeoutResponse timeout_response block.
         *                        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_intent#timeout_response Lexv2ModelsIntent#timeout_response}
         * @return {@code this}
         */
        public Builder timeoutResponse(com.hashicorp.cdktf.IResolvable timeoutResponse) {
            this.timeoutResponse = timeoutResponse;
            return this;
        }

        /**
         * Sets the value of {@link Lexv2ModelsIntentFulfillmentCodeHookPostFulfillmentStatusSpecification#getTimeoutResponse}
         * @param timeoutResponse timeout_response block.
         *                        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_intent#timeout_response Lexv2ModelsIntent#timeout_response}
         * @return {@code this}
         */
        public Builder timeoutResponse(java.util.List<? extends imports.aws.lexv2_models_intent.Lexv2ModelsIntentFulfillmentCodeHookPostFulfillmentStatusSpecificationTimeoutResponse> timeoutResponse) {
            this.timeoutResponse = timeoutResponse;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link Lexv2ModelsIntentFulfillmentCodeHookPostFulfillmentStatusSpecification}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public Lexv2ModelsIntentFulfillmentCodeHookPostFulfillmentStatusSpecification build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link Lexv2ModelsIntentFulfillmentCodeHookPostFulfillmentStatusSpecification}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements Lexv2ModelsIntentFulfillmentCodeHookPostFulfillmentStatusSpecification {
        private final java.lang.Object failureConditional;
        private final java.lang.Object failureNextStep;
        private final java.lang.Object failureResponse;
        private final java.lang.Object successConditional;
        private final java.lang.Object successNextStep;
        private final java.lang.Object successResponse;
        private final java.lang.Object timeoutConditional;
        private final java.lang.Object timeoutNextStep;
        private final java.lang.Object timeoutResponse;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.failureConditional = software.amazon.jsii.Kernel.get(this, "failureConditional", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.failureNextStep = software.amazon.jsii.Kernel.get(this, "failureNextStep", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.failureResponse = software.amazon.jsii.Kernel.get(this, "failureResponse", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.successConditional = software.amazon.jsii.Kernel.get(this, "successConditional", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.successNextStep = software.amazon.jsii.Kernel.get(this, "successNextStep", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.successResponse = software.amazon.jsii.Kernel.get(this, "successResponse", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.timeoutConditional = software.amazon.jsii.Kernel.get(this, "timeoutConditional", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.timeoutNextStep = software.amazon.jsii.Kernel.get(this, "timeoutNextStep", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.timeoutResponse = software.amazon.jsii.Kernel.get(this, "timeoutResponse", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.failureConditional = builder.failureConditional;
            this.failureNextStep = builder.failureNextStep;
            this.failureResponse = builder.failureResponse;
            this.successConditional = builder.successConditional;
            this.successNextStep = builder.successNextStep;
            this.successResponse = builder.successResponse;
            this.timeoutConditional = builder.timeoutConditional;
            this.timeoutNextStep = builder.timeoutNextStep;
            this.timeoutResponse = builder.timeoutResponse;
        }

        @Override
        public final java.lang.Object getFailureConditional() {
            return this.failureConditional;
        }

        @Override
        public final java.lang.Object getFailureNextStep() {
            return this.failureNextStep;
        }

        @Override
        public final java.lang.Object getFailureResponse() {
            return this.failureResponse;
        }

        @Override
        public final java.lang.Object getSuccessConditional() {
            return this.successConditional;
        }

        @Override
        public final java.lang.Object getSuccessNextStep() {
            return this.successNextStep;
        }

        @Override
        public final java.lang.Object getSuccessResponse() {
            return this.successResponse;
        }

        @Override
        public final java.lang.Object getTimeoutConditional() {
            return this.timeoutConditional;
        }

        @Override
        public final java.lang.Object getTimeoutNextStep() {
            return this.timeoutNextStep;
        }

        @Override
        public final java.lang.Object getTimeoutResponse() {
            return this.timeoutResponse;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getFailureConditional() != null) {
                data.set("failureConditional", om.valueToTree(this.getFailureConditional()));
            }
            if (this.getFailureNextStep() != null) {
                data.set("failureNextStep", om.valueToTree(this.getFailureNextStep()));
            }
            if (this.getFailureResponse() != null) {
                data.set("failureResponse", om.valueToTree(this.getFailureResponse()));
            }
            if (this.getSuccessConditional() != null) {
                data.set("successConditional", om.valueToTree(this.getSuccessConditional()));
            }
            if (this.getSuccessNextStep() != null) {
                data.set("successNextStep", om.valueToTree(this.getSuccessNextStep()));
            }
            if (this.getSuccessResponse() != null) {
                data.set("successResponse", om.valueToTree(this.getSuccessResponse()));
            }
            if (this.getTimeoutConditional() != null) {
                data.set("timeoutConditional", om.valueToTree(this.getTimeoutConditional()));
            }
            if (this.getTimeoutNextStep() != null) {
                data.set("timeoutNextStep", om.valueToTree(this.getTimeoutNextStep()));
            }
            if (this.getTimeoutResponse() != null) {
                data.set("timeoutResponse", om.valueToTree(this.getTimeoutResponse()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.lexv2ModelsIntent.Lexv2ModelsIntentFulfillmentCodeHookPostFulfillmentStatusSpecification"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            Lexv2ModelsIntentFulfillmentCodeHookPostFulfillmentStatusSpecification.Jsii$Proxy that = (Lexv2ModelsIntentFulfillmentCodeHookPostFulfillmentStatusSpecification.Jsii$Proxy) o;

            if (this.failureConditional != null ? !this.failureConditional.equals(that.failureConditional) : that.failureConditional != null) return false;
            if (this.failureNextStep != null ? !this.failureNextStep.equals(that.failureNextStep) : that.failureNextStep != null) return false;
            if (this.failureResponse != null ? !this.failureResponse.equals(that.failureResponse) : that.failureResponse != null) return false;
            if (this.successConditional != null ? !this.successConditional.equals(that.successConditional) : that.successConditional != null) return false;
            if (this.successNextStep != null ? !this.successNextStep.equals(that.successNextStep) : that.successNextStep != null) return false;
            if (this.successResponse != null ? !this.successResponse.equals(that.successResponse) : that.successResponse != null) return false;
            if (this.timeoutConditional != null ? !this.timeoutConditional.equals(that.timeoutConditional) : that.timeoutConditional != null) return false;
            if (this.timeoutNextStep != null ? !this.timeoutNextStep.equals(that.timeoutNextStep) : that.timeoutNextStep != null) return false;
            return this.timeoutResponse != null ? this.timeoutResponse.equals(that.timeoutResponse) : that.timeoutResponse == null;
        }

        @Override
        public final int hashCode() {
            int result = this.failureConditional != null ? this.failureConditional.hashCode() : 0;
            result = 31 * result + (this.failureNextStep != null ? this.failureNextStep.hashCode() : 0);
            result = 31 * result + (this.failureResponse != null ? this.failureResponse.hashCode() : 0);
            result = 31 * result + (this.successConditional != null ? this.successConditional.hashCode() : 0);
            result = 31 * result + (this.successNextStep != null ? this.successNextStep.hashCode() : 0);
            result = 31 * result + (this.successResponse != null ? this.successResponse.hashCode() : 0);
            result = 31 * result + (this.timeoutConditional != null ? this.timeoutConditional.hashCode() : 0);
            result = 31 * result + (this.timeoutNextStep != null ? this.timeoutNextStep.hashCode() : 0);
            result = 31 * result + (this.timeoutResponse != null ? this.timeoutResponse.hashCode() : 0);
            return result;
        }
    }
}
