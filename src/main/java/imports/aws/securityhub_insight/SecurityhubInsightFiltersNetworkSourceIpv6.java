package imports.aws.securityhub_insight;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.398Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.securityhubInsight.SecurityhubInsightFiltersNetworkSourceIpv6")
@software.amazon.jsii.Jsii.Proxy(SecurityhubInsightFiltersNetworkSourceIpv6.Jsii$Proxy.class)
public interface SecurityhubInsightFiltersNetworkSourceIpv6 extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_insight#cidr SecurityhubInsight#cidr}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getCidr();

    /**
     * @return a {@link Builder} of {@link SecurityhubInsightFiltersNetworkSourceIpv6}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link SecurityhubInsightFiltersNetworkSourceIpv6}
     */
    public static final class Builder implements software.amazon.jsii.Builder<SecurityhubInsightFiltersNetworkSourceIpv6> {
        java.lang.String cidr;

        /**
         * Sets the value of {@link SecurityhubInsightFiltersNetworkSourceIpv6#getCidr}
         * @param cidr Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_insight#cidr SecurityhubInsight#cidr}. This parameter is required.
         * @return {@code this}
         */
        public Builder cidr(java.lang.String cidr) {
            this.cidr = cidr;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link SecurityhubInsightFiltersNetworkSourceIpv6}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public SecurityhubInsightFiltersNetworkSourceIpv6 build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link SecurityhubInsightFiltersNetworkSourceIpv6}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements SecurityhubInsightFiltersNetworkSourceIpv6 {
        private final java.lang.String cidr;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.cidr = software.amazon.jsii.Kernel.get(this, "cidr", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.cidr = java.util.Objects.requireNonNull(builder.cidr, "cidr is required");
        }

        @Override
        public final java.lang.String getCidr() {
            return this.cidr;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("cidr", om.valueToTree(this.getCidr()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.securityhubInsight.SecurityhubInsightFiltersNetworkSourceIpv6"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            SecurityhubInsightFiltersNetworkSourceIpv6.Jsii$Proxy that = (SecurityhubInsightFiltersNetworkSourceIpv6.Jsii$Proxy) o;

            return this.cidr.equals(that.cidr);
        }

        @Override
        public final int hashCode() {
            int result = this.cidr.hashCode();
            return result;
        }
    }
}
