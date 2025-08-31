package imports.aws.networkfirewall_tls_inspection_configuration;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.962Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.networkfirewallTlsInspectionConfiguration.NetworkfirewallTlsInspectionConfigurationTlsInspectionConfiguration")
@software.amazon.jsii.Jsii.Proxy(NetworkfirewallTlsInspectionConfigurationTlsInspectionConfiguration.Jsii$Proxy.class)
public interface NetworkfirewallTlsInspectionConfigurationTlsInspectionConfiguration extends software.amazon.jsii.JsiiSerializable {

    /**
     * server_certificate_configuration block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/networkfirewall_tls_inspection_configuration#server_certificate_configuration NetworkfirewallTlsInspectionConfiguration#server_certificate_configuration}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getServerCertificateConfiguration() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link NetworkfirewallTlsInspectionConfigurationTlsInspectionConfiguration}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link NetworkfirewallTlsInspectionConfigurationTlsInspectionConfiguration}
     */
    public static final class Builder implements software.amazon.jsii.Builder<NetworkfirewallTlsInspectionConfigurationTlsInspectionConfiguration> {
        java.lang.Object serverCertificateConfiguration;

        /**
         * Sets the value of {@link NetworkfirewallTlsInspectionConfigurationTlsInspectionConfiguration#getServerCertificateConfiguration}
         * @param serverCertificateConfiguration server_certificate_configuration block.
         *                                       Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/networkfirewall_tls_inspection_configuration#server_certificate_configuration NetworkfirewallTlsInspectionConfiguration#server_certificate_configuration}
         * @return {@code this}
         */
        public Builder serverCertificateConfiguration(com.hashicorp.cdktf.IResolvable serverCertificateConfiguration) {
            this.serverCertificateConfiguration = serverCertificateConfiguration;
            return this;
        }

        /**
         * Sets the value of {@link NetworkfirewallTlsInspectionConfigurationTlsInspectionConfiguration#getServerCertificateConfiguration}
         * @param serverCertificateConfiguration server_certificate_configuration block.
         *                                       Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/networkfirewall_tls_inspection_configuration#server_certificate_configuration NetworkfirewallTlsInspectionConfiguration#server_certificate_configuration}
         * @return {@code this}
         */
        public Builder serverCertificateConfiguration(java.util.List<? extends imports.aws.networkfirewall_tls_inspection_configuration.NetworkfirewallTlsInspectionConfigurationTlsInspectionConfigurationServerCertificateConfiguration> serverCertificateConfiguration) {
            this.serverCertificateConfiguration = serverCertificateConfiguration;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link NetworkfirewallTlsInspectionConfigurationTlsInspectionConfiguration}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public NetworkfirewallTlsInspectionConfigurationTlsInspectionConfiguration build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link NetworkfirewallTlsInspectionConfigurationTlsInspectionConfiguration}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements NetworkfirewallTlsInspectionConfigurationTlsInspectionConfiguration {
        private final java.lang.Object serverCertificateConfiguration;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.serverCertificateConfiguration = software.amazon.jsii.Kernel.get(this, "serverCertificateConfiguration", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.serverCertificateConfiguration = builder.serverCertificateConfiguration;
        }

        @Override
        public final java.lang.Object getServerCertificateConfiguration() {
            return this.serverCertificateConfiguration;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getServerCertificateConfiguration() != null) {
                data.set("serverCertificateConfiguration", om.valueToTree(this.getServerCertificateConfiguration()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.networkfirewallTlsInspectionConfiguration.NetworkfirewallTlsInspectionConfigurationTlsInspectionConfiguration"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            NetworkfirewallTlsInspectionConfigurationTlsInspectionConfiguration.Jsii$Proxy that = (NetworkfirewallTlsInspectionConfigurationTlsInspectionConfiguration.Jsii$Proxy) o;

            return this.serverCertificateConfiguration != null ? this.serverCertificateConfiguration.equals(that.serverCertificateConfiguration) : that.serverCertificateConfiguration == null;
        }

        @Override
        public final int hashCode() {
            int result = this.serverCertificateConfiguration != null ? this.serverCertificateConfiguration.hashCode() : 0;
            return result;
        }
    }
}
