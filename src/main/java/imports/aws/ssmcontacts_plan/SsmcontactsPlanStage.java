package imports.aws.ssmcontacts_plan;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.508Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.ssmcontactsPlan.SsmcontactsPlanStage")
@software.amazon.jsii.Jsii.Proxy(SsmcontactsPlanStage.Jsii$Proxy.class)
public interface SsmcontactsPlanStage extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssmcontacts_plan#duration_in_minutes SsmcontactsPlan#duration_in_minutes}.
     */
    @org.jetbrains.annotations.NotNull java.lang.Number getDurationInMinutes();

    /**
     * target block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssmcontacts_plan#target SsmcontactsPlan#target}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getTarget() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link SsmcontactsPlanStage}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link SsmcontactsPlanStage}
     */
    public static final class Builder implements software.amazon.jsii.Builder<SsmcontactsPlanStage> {
        java.lang.Number durationInMinutes;
        java.lang.Object target;

        /**
         * Sets the value of {@link SsmcontactsPlanStage#getDurationInMinutes}
         * @param durationInMinutes Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssmcontacts_plan#duration_in_minutes SsmcontactsPlan#duration_in_minutes}. This parameter is required.
         * @return {@code this}
         */
        public Builder durationInMinutes(java.lang.Number durationInMinutes) {
            this.durationInMinutes = durationInMinutes;
            return this;
        }

        /**
         * Sets the value of {@link SsmcontactsPlanStage#getTarget}
         * @param target target block.
         *               Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssmcontacts_plan#target SsmcontactsPlan#target}
         * @return {@code this}
         */
        public Builder target(com.hashicorp.cdktf.IResolvable target) {
            this.target = target;
            return this;
        }

        /**
         * Sets the value of {@link SsmcontactsPlanStage#getTarget}
         * @param target target block.
         *               Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssmcontacts_plan#target SsmcontactsPlan#target}
         * @return {@code this}
         */
        public Builder target(java.util.List<? extends imports.aws.ssmcontacts_plan.SsmcontactsPlanStageTarget> target) {
            this.target = target;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link SsmcontactsPlanStage}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public SsmcontactsPlanStage build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link SsmcontactsPlanStage}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements SsmcontactsPlanStage {
        private final java.lang.Number durationInMinutes;
        private final java.lang.Object target;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.durationInMinutes = software.amazon.jsii.Kernel.get(this, "durationInMinutes", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.target = software.amazon.jsii.Kernel.get(this, "target", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.durationInMinutes = java.util.Objects.requireNonNull(builder.durationInMinutes, "durationInMinutes is required");
            this.target = builder.target;
        }

        @Override
        public final java.lang.Number getDurationInMinutes() {
            return this.durationInMinutes;
        }

        @Override
        public final java.lang.Object getTarget() {
            return this.target;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("durationInMinutes", om.valueToTree(this.getDurationInMinutes()));
            if (this.getTarget() != null) {
                data.set("target", om.valueToTree(this.getTarget()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.ssmcontactsPlan.SsmcontactsPlanStage"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            SsmcontactsPlanStage.Jsii$Proxy that = (SsmcontactsPlanStage.Jsii$Proxy) o;

            if (!durationInMinutes.equals(that.durationInMinutes)) return false;
            return this.target != null ? this.target.equals(that.target) : that.target == null;
        }

        @Override
        public final int hashCode() {
            int result = this.durationInMinutes.hashCode();
            result = 31 * result + (this.target != null ? this.target.hashCode() : 0);
            return result;
        }
    }
}
