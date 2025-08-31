package imports.aws.lexv2_models_intent;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.777Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.lexv2ModelsIntent.Lexv2ModelsIntentSlotPriority")
@software.amazon.jsii.Jsii.Proxy(Lexv2ModelsIntentSlotPriority.Jsii$Proxy.class)
public interface Lexv2ModelsIntentSlotPriority extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_intent#priority Lexv2ModelsIntent#priority}.
     */
    @org.jetbrains.annotations.NotNull java.lang.Number getPriority();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_intent#slot_id Lexv2ModelsIntent#slot_id}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getSlotId();

    /**
     * @return a {@link Builder} of {@link Lexv2ModelsIntentSlotPriority}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link Lexv2ModelsIntentSlotPriority}
     */
    public static final class Builder implements software.amazon.jsii.Builder<Lexv2ModelsIntentSlotPriority> {
        java.lang.Number priority;
        java.lang.String slotId;

        /**
         * Sets the value of {@link Lexv2ModelsIntentSlotPriority#getPriority}
         * @param priority Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_intent#priority Lexv2ModelsIntent#priority}. This parameter is required.
         * @return {@code this}
         */
        public Builder priority(java.lang.Number priority) {
            this.priority = priority;
            return this;
        }

        /**
         * Sets the value of {@link Lexv2ModelsIntentSlotPriority#getSlotId}
         * @param slotId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lexv2models_intent#slot_id Lexv2ModelsIntent#slot_id}. This parameter is required.
         * @return {@code this}
         */
        public Builder slotId(java.lang.String slotId) {
            this.slotId = slotId;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link Lexv2ModelsIntentSlotPriority}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public Lexv2ModelsIntentSlotPriority build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link Lexv2ModelsIntentSlotPriority}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements Lexv2ModelsIntentSlotPriority {
        private final java.lang.Number priority;
        private final java.lang.String slotId;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.priority = software.amazon.jsii.Kernel.get(this, "priority", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.slotId = software.amazon.jsii.Kernel.get(this, "slotId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.priority = java.util.Objects.requireNonNull(builder.priority, "priority is required");
            this.slotId = java.util.Objects.requireNonNull(builder.slotId, "slotId is required");
        }

        @Override
        public final java.lang.Number getPriority() {
            return this.priority;
        }

        @Override
        public final java.lang.String getSlotId() {
            return this.slotId;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("priority", om.valueToTree(this.getPriority()));
            data.set("slotId", om.valueToTree(this.getSlotId()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.lexv2ModelsIntent.Lexv2ModelsIntentSlotPriority"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            Lexv2ModelsIntentSlotPriority.Jsii$Proxy that = (Lexv2ModelsIntentSlotPriority.Jsii$Proxy) o;

            if (!priority.equals(that.priority)) return false;
            return this.slotId.equals(that.slotId);
        }

        @Override
        public final int hashCode() {
            int result = this.priority.hashCode();
            result = 31 * result + (this.slotId.hashCode());
            return result;
        }
    }
}
