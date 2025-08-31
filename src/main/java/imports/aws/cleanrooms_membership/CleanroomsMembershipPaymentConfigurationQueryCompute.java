package imports.aws.cleanrooms_membership;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.217Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.cleanroomsMembership.CleanroomsMembershipPaymentConfigurationQueryCompute")
@software.amazon.jsii.Jsii.Proxy(CleanroomsMembershipPaymentConfigurationQueryCompute.Jsii$Proxy.class)
public interface CleanroomsMembershipPaymentConfigurationQueryCompute extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cleanrooms_membership#is_responsible CleanroomsMembership#is_responsible}.
     */
    @org.jetbrains.annotations.NotNull java.lang.Object getIsResponsible();

    /**
     * @return a {@link Builder} of {@link CleanroomsMembershipPaymentConfigurationQueryCompute}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link CleanroomsMembershipPaymentConfigurationQueryCompute}
     */
    public static final class Builder implements software.amazon.jsii.Builder<CleanroomsMembershipPaymentConfigurationQueryCompute> {
        java.lang.Object isResponsible;

        /**
         * Sets the value of {@link CleanroomsMembershipPaymentConfigurationQueryCompute#getIsResponsible}
         * @param isResponsible Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cleanrooms_membership#is_responsible CleanroomsMembership#is_responsible}. This parameter is required.
         * @return {@code this}
         */
        public Builder isResponsible(java.lang.Boolean isResponsible) {
            this.isResponsible = isResponsible;
            return this;
        }

        /**
         * Sets the value of {@link CleanroomsMembershipPaymentConfigurationQueryCompute#getIsResponsible}
         * @param isResponsible Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cleanrooms_membership#is_responsible CleanroomsMembership#is_responsible}. This parameter is required.
         * @return {@code this}
         */
        public Builder isResponsible(com.hashicorp.cdktf.IResolvable isResponsible) {
            this.isResponsible = isResponsible;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link CleanroomsMembershipPaymentConfigurationQueryCompute}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public CleanroomsMembershipPaymentConfigurationQueryCompute build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link CleanroomsMembershipPaymentConfigurationQueryCompute}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements CleanroomsMembershipPaymentConfigurationQueryCompute {
        private final java.lang.Object isResponsible;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.isResponsible = software.amazon.jsii.Kernel.get(this, "isResponsible", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.isResponsible = java.util.Objects.requireNonNull(builder.isResponsible, "isResponsible is required");
        }

        @Override
        public final java.lang.Object getIsResponsible() {
            return this.isResponsible;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("isResponsible", om.valueToTree(this.getIsResponsible()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.cleanroomsMembership.CleanroomsMembershipPaymentConfigurationQueryCompute"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            CleanroomsMembershipPaymentConfigurationQueryCompute.Jsii$Proxy that = (CleanroomsMembershipPaymentConfigurationQueryCompute.Jsii$Proxy) o;

            return this.isResponsible.equals(that.isResponsible);
        }

        @Override
        public final int hashCode() {
            int result = this.isResponsible.hashCode();
            return result;
        }
    }
}
