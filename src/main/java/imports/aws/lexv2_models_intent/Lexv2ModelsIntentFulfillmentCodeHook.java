package imports.aws.lexv2_models_intent;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.663Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.lexv2ModelsIntent.Lexv2ModelsIntentFulfillmentCodeHook")
@software.amazon.jsii.Jsii.Proxy(Lexv2ModelsIntentFulfillmentCodeHook.Jsii$Proxy.class)
public interface Lexv2ModelsIntentFulfillmentCodeHook extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_intent#enabled Lexv2ModelsIntent#enabled}.
     */
    @org.jetbrains.annotations.NotNull java.lang.Object getEnabled();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_intent#active Lexv2ModelsIntent#active}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getActive() {
        return null;
    }

    /**
     * fulfillment_updates_specification block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_intent#fulfillment_updates_specification Lexv2ModelsIntent#fulfillment_updates_specification}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getFulfillmentUpdatesSpecification() {
        return null;
    }

    /**
     * post_fulfillment_status_specification block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_intent#post_fulfillment_status_specification Lexv2ModelsIntent#post_fulfillment_status_specification}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getPostFulfillmentStatusSpecification() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link Lexv2ModelsIntentFulfillmentCodeHook}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link Lexv2ModelsIntentFulfillmentCodeHook}
     */
    public static final class Builder implements software.amazon.jsii.Builder<Lexv2ModelsIntentFulfillmentCodeHook> {
        java.lang.Object enabled;
        java.lang.Object active;
        java.lang.Object fulfillmentUpdatesSpecification;
        java.lang.Object postFulfillmentStatusSpecification;

        /**
         * Sets the value of {@link Lexv2ModelsIntentFulfillmentCodeHook#getEnabled}
         * @param enabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_intent#enabled Lexv2ModelsIntent#enabled}. This parameter is required.
         * @return {@code this}
         */
        public Builder enabled(java.lang.Boolean enabled) {
            this.enabled = enabled;
            return this;
        }

        /**
         * Sets the value of {@link Lexv2ModelsIntentFulfillmentCodeHook#getEnabled}
         * @param enabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_intent#enabled Lexv2ModelsIntent#enabled}. This parameter is required.
         * @return {@code this}
         */
        public Builder enabled(com.hashicorp.cdktf.IResolvable enabled) {
            this.enabled = enabled;
            return this;
        }

        /**
         * Sets the value of {@link Lexv2ModelsIntentFulfillmentCodeHook#getActive}
         * @param active Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_intent#active Lexv2ModelsIntent#active}.
         * @return {@code this}
         */
        public Builder active(java.lang.Boolean active) {
            this.active = active;
            return this;
        }

        /**
         * Sets the value of {@link Lexv2ModelsIntentFulfillmentCodeHook#getActive}
         * @param active Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_intent#active Lexv2ModelsIntent#active}.
         * @return {@code this}
         */
        public Builder active(com.hashicorp.cdktf.IResolvable active) {
            this.active = active;
            return this;
        }

        /**
         * Sets the value of {@link Lexv2ModelsIntentFulfillmentCodeHook#getFulfillmentUpdatesSpecification}
         * @param fulfillmentUpdatesSpecification fulfillment_updates_specification block.
         *                                        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_intent#fulfillment_updates_specification Lexv2ModelsIntent#fulfillment_updates_specification}
         * @return {@code this}
         */
        public Builder fulfillmentUpdatesSpecification(com.hashicorp.cdktf.IResolvable fulfillmentUpdatesSpecification) {
            this.fulfillmentUpdatesSpecification = fulfillmentUpdatesSpecification;
            return this;
        }

        /**
         * Sets the value of {@link Lexv2ModelsIntentFulfillmentCodeHook#getFulfillmentUpdatesSpecification}
         * @param fulfillmentUpdatesSpecification fulfillment_updates_specification block.
         *                                        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_intent#fulfillment_updates_specification Lexv2ModelsIntent#fulfillment_updates_specification}
         * @return {@code this}
         */
        public Builder fulfillmentUpdatesSpecification(java.util.List<? extends imports.aws.lexv2_models_intent.Lexv2ModelsIntentFulfillmentCodeHookFulfillmentUpdatesSpecification> fulfillmentUpdatesSpecification) {
            this.fulfillmentUpdatesSpecification = fulfillmentUpdatesSpecification;
            return this;
        }

        /**
         * Sets the value of {@link Lexv2ModelsIntentFulfillmentCodeHook#getPostFulfillmentStatusSpecification}
         * @param postFulfillmentStatusSpecification post_fulfillment_status_specification block.
         *                                           Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_intent#post_fulfillment_status_specification Lexv2ModelsIntent#post_fulfillment_status_specification}
         * @return {@code this}
         */
        public Builder postFulfillmentStatusSpecification(com.hashicorp.cdktf.IResolvable postFulfillmentStatusSpecification) {
            this.postFulfillmentStatusSpecification = postFulfillmentStatusSpecification;
            return this;
        }

        /**
         * Sets the value of {@link Lexv2ModelsIntentFulfillmentCodeHook#getPostFulfillmentStatusSpecification}
         * @param postFulfillmentStatusSpecification post_fulfillment_status_specification block.
         *                                           Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_intent#post_fulfillment_status_specification Lexv2ModelsIntent#post_fulfillment_status_specification}
         * @return {@code this}
         */
        public Builder postFulfillmentStatusSpecification(java.util.List<? extends imports.aws.lexv2_models_intent.Lexv2ModelsIntentFulfillmentCodeHookPostFulfillmentStatusSpecification> postFulfillmentStatusSpecification) {
            this.postFulfillmentStatusSpecification = postFulfillmentStatusSpecification;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link Lexv2ModelsIntentFulfillmentCodeHook}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public Lexv2ModelsIntentFulfillmentCodeHook build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link Lexv2ModelsIntentFulfillmentCodeHook}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements Lexv2ModelsIntentFulfillmentCodeHook {
        private final java.lang.Object enabled;
        private final java.lang.Object active;
        private final java.lang.Object fulfillmentUpdatesSpecification;
        private final java.lang.Object postFulfillmentStatusSpecification;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.enabled = software.amazon.jsii.Kernel.get(this, "enabled", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.active = software.amazon.jsii.Kernel.get(this, "active", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.fulfillmentUpdatesSpecification = software.amazon.jsii.Kernel.get(this, "fulfillmentUpdatesSpecification", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.postFulfillmentStatusSpecification = software.amazon.jsii.Kernel.get(this, "postFulfillmentStatusSpecification", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.enabled = java.util.Objects.requireNonNull(builder.enabled, "enabled is required");
            this.active = builder.active;
            this.fulfillmentUpdatesSpecification = builder.fulfillmentUpdatesSpecification;
            this.postFulfillmentStatusSpecification = builder.postFulfillmentStatusSpecification;
        }

        @Override
        public final java.lang.Object getEnabled() {
            return this.enabled;
        }

        @Override
        public final java.lang.Object getActive() {
            return this.active;
        }

        @Override
        public final java.lang.Object getFulfillmentUpdatesSpecification() {
            return this.fulfillmentUpdatesSpecification;
        }

        @Override
        public final java.lang.Object getPostFulfillmentStatusSpecification() {
            return this.postFulfillmentStatusSpecification;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("enabled", om.valueToTree(this.getEnabled()));
            if (this.getActive() != null) {
                data.set("active", om.valueToTree(this.getActive()));
            }
            if (this.getFulfillmentUpdatesSpecification() != null) {
                data.set("fulfillmentUpdatesSpecification", om.valueToTree(this.getFulfillmentUpdatesSpecification()));
            }
            if (this.getPostFulfillmentStatusSpecification() != null) {
                data.set("postFulfillmentStatusSpecification", om.valueToTree(this.getPostFulfillmentStatusSpecification()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.lexv2ModelsIntent.Lexv2ModelsIntentFulfillmentCodeHook"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            Lexv2ModelsIntentFulfillmentCodeHook.Jsii$Proxy that = (Lexv2ModelsIntentFulfillmentCodeHook.Jsii$Proxy) o;

            if (!enabled.equals(that.enabled)) return false;
            if (this.active != null ? !this.active.equals(that.active) : that.active != null) return false;
            if (this.fulfillmentUpdatesSpecification != null ? !this.fulfillmentUpdatesSpecification.equals(that.fulfillmentUpdatesSpecification) : that.fulfillmentUpdatesSpecification != null) return false;
            return this.postFulfillmentStatusSpecification != null ? this.postFulfillmentStatusSpecification.equals(that.postFulfillmentStatusSpecification) : that.postFulfillmentStatusSpecification == null;
        }

        @Override
        public final int hashCode() {
            int result = this.enabled.hashCode();
            result = 31 * result + (this.active != null ? this.active.hashCode() : 0);
            result = 31 * result + (this.fulfillmentUpdatesSpecification != null ? this.fulfillmentUpdatesSpecification.hashCode() : 0);
            result = 31 * result + (this.postFulfillmentStatusSpecification != null ? this.postFulfillmentStatusSpecification.hashCode() : 0);
            return result;
        }
    }
}
