package imports.aws.networkfirewall_tls_inspection_configuration;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.963Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.networkfirewallTlsInspectionConfiguration.NetworkfirewallTlsInspectionConfigurationTlsInspectionConfigurationServerCertificateConfigurationServerCertificate")
@software.amazon.jsii.Jsii.Proxy(NetworkfirewallTlsInspectionConfigurationTlsInspectionConfigurationServerCertificateConfigurationServerCertificate.Jsii$Proxy.class)
public interface NetworkfirewallTlsInspectionConfigurationTlsInspectionConfigurationServerCertificateConfigurationServerCertificate extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/networkfirewall_tls_inspection_configuration#resource_arn NetworkfirewallTlsInspectionConfiguration#resource_arn}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getResourceArn() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link NetworkfirewallTlsInspectionConfigurationTlsInspectionConfigurationServerCertificateConfigurationServerCertificate}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link NetworkfirewallTlsInspectionConfigurationTlsInspectionConfigurationServerCertificateConfigurationServerCertificate}
     */
    public static final class Builder implements software.amazon.jsii.Builder<NetworkfirewallTlsInspectionConfigurationTlsInspectionConfigurationServerCertificateConfigurationServerCertificate> {
        java.lang.String resourceArn;

        /**
         * Sets the value of {@link NetworkfirewallTlsInspectionConfigurationTlsInspectionConfigurationServerCertificateConfigurationServerCertificate#getResourceArn}
         * @param resourceArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/networkfirewall_tls_inspection_configuration#resource_arn NetworkfirewallTlsInspectionConfiguration#resource_arn}.
         * @return {@code this}
         */
        public Builder resourceArn(java.lang.String resourceArn) {
            this.resourceArn = resourceArn;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link NetworkfirewallTlsInspectionConfigurationTlsInspectionConfigurationServerCertificateConfigurationServerCertificate}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public NetworkfirewallTlsInspectionConfigurationTlsInspectionConfigurationServerCertificateConfigurationServerCertificate build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link NetworkfirewallTlsInspectionConfigurationTlsInspectionConfigurationServerCertificateConfigurationServerCertificate}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements NetworkfirewallTlsInspectionConfigurationTlsInspectionConfigurationServerCertificateConfigurationServerCertificate {
        private final java.lang.String resourceArn;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.resourceArn = software.amazon.jsii.Kernel.get(this, "resourceArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.resourceArn = builder.resourceArn;
        }

        @Override
        public final java.lang.String getResourceArn() {
            return this.resourceArn;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getResourceArn() != null) {
                data.set("resourceArn", om.valueToTree(this.getResourceArn()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.networkfirewallTlsInspectionConfiguration.NetworkfirewallTlsInspectionConfigurationTlsInspectionConfigurationServerCertificateConfigurationServerCertificate"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            NetworkfirewallTlsInspectionConfigurationTlsInspectionConfigurationServerCertificateConfigurationServerCertificate.Jsii$Proxy that = (NetworkfirewallTlsInspectionConfigurationTlsInspectionConfigurationServerCertificateConfigurationServerCertificate.Jsii$Proxy) o;

            return this.resourceArn != null ? this.resourceArn.equals(that.resourceArn) : that.resourceArn == null;
        }

        @Override
        public final int hashCode() {
            int result = this.resourceArn != null ? this.resourceArn.hashCode() : 0;
            return result;
        }
    }
}
