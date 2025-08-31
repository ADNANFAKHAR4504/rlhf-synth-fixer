package imports.aws.cleanrooms_membership;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.217Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.cleanroomsMembership.CleanroomsMembershipPaymentConfiguration")
@software.amazon.jsii.Jsii.Proxy(CleanroomsMembershipPaymentConfiguration.Jsii$Proxy.class)
public interface CleanroomsMembershipPaymentConfiguration extends software.amazon.jsii.JsiiSerializable {

    /**
     * query_compute block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cleanrooms_membership#query_compute CleanroomsMembership#query_compute}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getQueryCompute() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link CleanroomsMembershipPaymentConfiguration}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link CleanroomsMembershipPaymentConfiguration}
     */
    public static final class Builder implements software.amazon.jsii.Builder<CleanroomsMembershipPaymentConfiguration> {
        java.lang.Object queryCompute;

        /**
         * Sets the value of {@link CleanroomsMembershipPaymentConfiguration#getQueryCompute}
         * @param queryCompute query_compute block.
         *                     Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cleanrooms_membership#query_compute CleanroomsMembership#query_compute}
         * @return {@code this}
         */
        public Builder queryCompute(com.hashicorp.cdktf.IResolvable queryCompute) {
            this.queryCompute = queryCompute;
            return this;
        }

        /**
         * Sets the value of {@link CleanroomsMembershipPaymentConfiguration#getQueryCompute}
         * @param queryCompute query_compute block.
         *                     Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cleanrooms_membership#query_compute CleanroomsMembership#query_compute}
         * @return {@code this}
         */
        public Builder queryCompute(java.util.List<? extends imports.aws.cleanrooms_membership.CleanroomsMembershipPaymentConfigurationQueryCompute> queryCompute) {
            this.queryCompute = queryCompute;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link CleanroomsMembershipPaymentConfiguration}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public CleanroomsMembershipPaymentConfiguration build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link CleanroomsMembershipPaymentConfiguration}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements CleanroomsMembershipPaymentConfiguration {
        private final java.lang.Object queryCompute;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.queryCompute = software.amazon.jsii.Kernel.get(this, "queryCompute", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.queryCompute = builder.queryCompute;
        }

        @Override
        public final java.lang.Object getQueryCompute() {
            return this.queryCompute;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getQueryCompute() != null) {
                data.set("queryCompute", om.valueToTree(this.getQueryCompute()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.cleanroomsMembership.CleanroomsMembershipPaymentConfiguration"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            CleanroomsMembershipPaymentConfiguration.Jsii$Proxy that = (CleanroomsMembershipPaymentConfiguration.Jsii$Proxy) o;

            return this.queryCompute != null ? this.queryCompute.equals(that.queryCompute) : that.queryCompute == null;
        }

        @Override
        public final int hashCode() {
            int result = this.queryCompute != null ? this.queryCompute.hashCode() : 0;
            return result;
        }
    }
}
