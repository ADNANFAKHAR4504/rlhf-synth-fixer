package imports.aws.lexv2_models_intent;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.663Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.lexv2ModelsIntent.Lexv2ModelsIntentFulfillmentCodeHookFulfillmentUpdatesSpecification")
@software.amazon.jsii.Jsii.Proxy(Lexv2ModelsIntentFulfillmentCodeHookFulfillmentUpdatesSpecification.Jsii$Proxy.class)
public interface Lexv2ModelsIntentFulfillmentCodeHookFulfillmentUpdatesSpecification extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_intent#active Lexv2ModelsIntent#active}.
     */
    @org.jetbrains.annotations.NotNull java.lang.Object getActive();

    /**
     * start_response block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_intent#start_response Lexv2ModelsIntent#start_response}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getStartResponse() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_intent#timeout_in_seconds Lexv2ModelsIntent#timeout_in_seconds}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getTimeoutInSeconds() {
        return null;
    }

    /**
     * update_response block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_intent#update_response Lexv2ModelsIntent#update_response}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getUpdateResponse() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link Lexv2ModelsIntentFulfillmentCodeHookFulfillmentUpdatesSpecification}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link Lexv2ModelsIntentFulfillmentCodeHookFulfillmentUpdatesSpecification}
     */
    public static final class Builder implements software.amazon.jsii.Builder<Lexv2ModelsIntentFulfillmentCodeHookFulfillmentUpdatesSpecification> {
        java.lang.Object active;
        java.lang.Object startResponse;
        java.lang.Number timeoutInSeconds;
        java.lang.Object updateResponse;

        /**
         * Sets the value of {@link Lexv2ModelsIntentFulfillmentCodeHookFulfillmentUpdatesSpecification#getActive}
         * @param active Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_intent#active Lexv2ModelsIntent#active}. This parameter is required.
         * @return {@code this}
         */
        public Builder active(java.lang.Boolean active) {
            this.active = active;
            return this;
        }

        /**
         * Sets the value of {@link Lexv2ModelsIntentFulfillmentCodeHookFulfillmentUpdatesSpecification#getActive}
         * @param active Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_intent#active Lexv2ModelsIntent#active}. This parameter is required.
         * @return {@code this}
         */
        public Builder active(com.hashicorp.cdktf.IResolvable active) {
            this.active = active;
            return this;
        }

        /**
         * Sets the value of {@link Lexv2ModelsIntentFulfillmentCodeHookFulfillmentUpdatesSpecification#getStartResponse}
         * @param startResponse start_response block.
         *                      Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_intent#start_response Lexv2ModelsIntent#start_response}
         * @return {@code this}
         */
        public Builder startResponse(com.hashicorp.cdktf.IResolvable startResponse) {
            this.startResponse = startResponse;
            return this;
        }

        /**
         * Sets the value of {@link Lexv2ModelsIntentFulfillmentCodeHookFulfillmentUpdatesSpecification#getStartResponse}
         * @param startResponse start_response block.
         *                      Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_intent#start_response Lexv2ModelsIntent#start_response}
         * @return {@code this}
         */
        public Builder startResponse(java.util.List<? extends imports.aws.lexv2_models_intent.Lexv2ModelsIntentFulfillmentCodeHookFulfillmentUpdatesSpecificationStartResponse> startResponse) {
            this.startResponse = startResponse;
            return this;
        }

        /**
         * Sets the value of {@link Lexv2ModelsIntentFulfillmentCodeHookFulfillmentUpdatesSpecification#getTimeoutInSeconds}
         * @param timeoutInSeconds Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_intent#timeout_in_seconds Lexv2ModelsIntent#timeout_in_seconds}.
         * @return {@code this}
         */
        public Builder timeoutInSeconds(java.lang.Number timeoutInSeconds) {
            this.timeoutInSeconds = timeoutInSeconds;
            return this;
        }

        /**
         * Sets the value of {@link Lexv2ModelsIntentFulfillmentCodeHookFulfillmentUpdatesSpecification#getUpdateResponse}
         * @param updateResponse update_response block.
         *                       Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_intent#update_response Lexv2ModelsIntent#update_response}
         * @return {@code this}
         */
        public Builder updateResponse(com.hashicorp.cdktf.IResolvable updateResponse) {
            this.updateResponse = updateResponse;
            return this;
        }

        /**
         * Sets the value of {@link Lexv2ModelsIntentFulfillmentCodeHookFulfillmentUpdatesSpecification#getUpdateResponse}
         * @param updateResponse update_response block.
         *                       Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_intent#update_response Lexv2ModelsIntent#update_response}
         * @return {@code this}
         */
        public Builder updateResponse(java.util.List<? extends imports.aws.lexv2_models_intent.Lexv2ModelsIntentFulfillmentCodeHookFulfillmentUpdatesSpecificationUpdateResponse> updateResponse) {
            this.updateResponse = updateResponse;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link Lexv2ModelsIntentFulfillmentCodeHookFulfillmentUpdatesSpecification}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public Lexv2ModelsIntentFulfillmentCodeHookFulfillmentUpdatesSpecification build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link Lexv2ModelsIntentFulfillmentCodeHookFulfillmentUpdatesSpecification}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements Lexv2ModelsIntentFulfillmentCodeHookFulfillmentUpdatesSpecification {
        private final java.lang.Object active;
        private final java.lang.Object startResponse;
        private final java.lang.Number timeoutInSeconds;
        private final java.lang.Object updateResponse;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.active = software.amazon.jsii.Kernel.get(this, "active", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.startResponse = software.amazon.jsii.Kernel.get(this, "startResponse", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.timeoutInSeconds = software.amazon.jsii.Kernel.get(this, "timeoutInSeconds", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.updateResponse = software.amazon.jsii.Kernel.get(this, "updateResponse", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.active = java.util.Objects.requireNonNull(builder.active, "active is required");
            this.startResponse = builder.startResponse;
            this.timeoutInSeconds = builder.timeoutInSeconds;
            this.updateResponse = builder.updateResponse;
        }

        @Override
        public final java.lang.Object getActive() {
            return this.active;
        }

        @Override
        public final java.lang.Object getStartResponse() {
            return this.startResponse;
        }

        @Override
        public final java.lang.Number getTimeoutInSeconds() {
            return this.timeoutInSeconds;
        }

        @Override
        public final java.lang.Object getUpdateResponse() {
            return this.updateResponse;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("active", om.valueToTree(this.getActive()));
            if (this.getStartResponse() != null) {
                data.set("startResponse", om.valueToTree(this.getStartResponse()));
            }
            if (this.getTimeoutInSeconds() != null) {
                data.set("timeoutInSeconds", om.valueToTree(this.getTimeoutInSeconds()));
            }
            if (this.getUpdateResponse() != null) {
                data.set("updateResponse", om.valueToTree(this.getUpdateResponse()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.lexv2ModelsIntent.Lexv2ModelsIntentFulfillmentCodeHookFulfillmentUpdatesSpecification"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            Lexv2ModelsIntentFulfillmentCodeHookFulfillmentUpdatesSpecification.Jsii$Proxy that = (Lexv2ModelsIntentFulfillmentCodeHookFulfillmentUpdatesSpecification.Jsii$Proxy) o;

            if (!active.equals(that.active)) return false;
            if (this.startResponse != null ? !this.startResponse.equals(that.startResponse) : that.startResponse != null) return false;
            if (this.timeoutInSeconds != null ? !this.timeoutInSeconds.equals(that.timeoutInSeconds) : that.timeoutInSeconds != null) return false;
            return this.updateResponse != null ? this.updateResponse.equals(that.updateResponse) : that.updateResponse == null;
        }

        @Override
        public final int hashCode() {
            int result = this.active.hashCode();
            result = 31 * result + (this.startResponse != null ? this.startResponse.hashCode() : 0);
            result = 31 * result + (this.timeoutInSeconds != null ? this.timeoutInSeconds.hashCode() : 0);
            result = 31 * result + (this.updateResponse != null ? this.updateResponse.hashCode() : 0);
            return result;
        }
    }
}
