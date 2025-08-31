package imports.aws.glue_trigger;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.306Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.glueTrigger.GlueTriggerPredicate")
@software.amazon.jsii.Jsii.Proxy(GlueTriggerPredicate.Jsii$Proxy.class)
public interface GlueTriggerPredicate extends software.amazon.jsii.JsiiSerializable {

    /**
     * conditions block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_trigger#conditions GlueTrigger#conditions}
     */
    @org.jetbrains.annotations.NotNull java.lang.Object getConditions();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_trigger#logical GlueTrigger#logical}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getLogical() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link GlueTriggerPredicate}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link GlueTriggerPredicate}
     */
    public static final class Builder implements software.amazon.jsii.Builder<GlueTriggerPredicate> {
        java.lang.Object conditions;
        java.lang.String logical;

        /**
         * Sets the value of {@link GlueTriggerPredicate#getConditions}
         * @param conditions conditions block. This parameter is required.
         *                   Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_trigger#conditions GlueTrigger#conditions}
         * @return {@code this}
         */
        public Builder conditions(com.hashicorp.cdktf.IResolvable conditions) {
            this.conditions = conditions;
            return this;
        }

        /**
         * Sets the value of {@link GlueTriggerPredicate#getConditions}
         * @param conditions conditions block. This parameter is required.
         *                   Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_trigger#conditions GlueTrigger#conditions}
         * @return {@code this}
         */
        public Builder conditions(java.util.List<? extends imports.aws.glue_trigger.GlueTriggerPredicateConditions> conditions) {
            this.conditions = conditions;
            return this;
        }

        /**
         * Sets the value of {@link GlueTriggerPredicate#getLogical}
         * @param logical Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_trigger#logical GlueTrigger#logical}.
         * @return {@code this}
         */
        public Builder logical(java.lang.String logical) {
            this.logical = logical;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link GlueTriggerPredicate}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public GlueTriggerPredicate build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link GlueTriggerPredicate}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements GlueTriggerPredicate {
        private final java.lang.Object conditions;
        private final java.lang.String logical;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.conditions = software.amazon.jsii.Kernel.get(this, "conditions", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.logical = software.amazon.jsii.Kernel.get(this, "logical", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.conditions = java.util.Objects.requireNonNull(builder.conditions, "conditions is required");
            this.logical = builder.logical;
        }

        @Override
        public final java.lang.Object getConditions() {
            return this.conditions;
        }

        @Override
        public final java.lang.String getLogical() {
            return this.logical;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("conditions", om.valueToTree(this.getConditions()));
            if (this.getLogical() != null) {
                data.set("logical", om.valueToTree(this.getLogical()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.glueTrigger.GlueTriggerPredicate"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            GlueTriggerPredicate.Jsii$Proxy that = (GlueTriggerPredicate.Jsii$Proxy) o;

            if (!conditions.equals(that.conditions)) return false;
            return this.logical != null ? this.logical.equals(that.logical) : that.logical == null;
        }

        @Override
        public final int hashCode() {
            int result = this.conditions.hashCode();
            result = 31 * result + (this.logical != null ? this.logical.hashCode() : 0);
            return result;
        }
    }
}
