package imports.aws.networkfirewall_tls_inspection_configuration;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.962Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.networkfirewallTlsInspectionConfiguration.NetworkfirewallTlsInspectionConfigurationTlsInspectionConfigurationServerCertificateConfigurationCheckCertificateRevocationStatus")
@software.amazon.jsii.Jsii.Proxy(NetworkfirewallTlsInspectionConfigurationTlsInspectionConfigurationServerCertificateConfigurationCheckCertificateRevocationStatus.Jsii$Proxy.class)
public interface NetworkfirewallTlsInspectionConfigurationTlsInspectionConfigurationServerCertificateConfigurationCheckCertificateRevocationStatus extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/networkfirewall_tls_inspection_configuration#revoked_status_action NetworkfirewallTlsInspectionConfiguration#revoked_status_action}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getRevokedStatusAction() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/networkfirewall_tls_inspection_configuration#unknown_status_action NetworkfirewallTlsInspectionConfiguration#unknown_status_action}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getUnknownStatusAction() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link NetworkfirewallTlsInspectionConfigurationTlsInspectionConfigurationServerCertificateConfigurationCheckCertificateRevocationStatus}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link NetworkfirewallTlsInspectionConfigurationTlsInspectionConfigurationServerCertificateConfigurationCheckCertificateRevocationStatus}
     */
    public static final class Builder implements software.amazon.jsii.Builder<NetworkfirewallTlsInspectionConfigurationTlsInspectionConfigurationServerCertificateConfigurationCheckCertificateRevocationStatus> {
        java.lang.String revokedStatusAction;
        java.lang.String unknownStatusAction;

        /**
         * Sets the value of {@link NetworkfirewallTlsInspectionConfigurationTlsInspectionConfigurationServerCertificateConfigurationCheckCertificateRevocationStatus#getRevokedStatusAction}
         * @param revokedStatusAction Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/networkfirewall_tls_inspection_configuration#revoked_status_action NetworkfirewallTlsInspectionConfiguration#revoked_status_action}.
         * @return {@code this}
         */
        public Builder revokedStatusAction(java.lang.String revokedStatusAction) {
            this.revokedStatusAction = revokedStatusAction;
            return this;
        }

        /**
         * Sets the value of {@link NetworkfirewallTlsInspectionConfigurationTlsInspectionConfigurationServerCertificateConfigurationCheckCertificateRevocationStatus#getUnknownStatusAction}
         * @param unknownStatusAction Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/networkfirewall_tls_inspection_configuration#unknown_status_action NetworkfirewallTlsInspectionConfiguration#unknown_status_action}.
         * @return {@code this}
         */
        public Builder unknownStatusAction(java.lang.String unknownStatusAction) {
            this.unknownStatusAction = unknownStatusAction;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link NetworkfirewallTlsInspectionConfigurationTlsInspectionConfigurationServerCertificateConfigurationCheckCertificateRevocationStatus}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public NetworkfirewallTlsInspectionConfigurationTlsInspectionConfigurationServerCertificateConfigurationCheckCertificateRevocationStatus build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link NetworkfirewallTlsInspectionConfigurationTlsInspectionConfigurationServerCertificateConfigurationCheckCertificateRevocationStatus}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements NetworkfirewallTlsInspectionConfigurationTlsInspectionConfigurationServerCertificateConfigurationCheckCertificateRevocationStatus {
        private final java.lang.String revokedStatusAction;
        private final java.lang.String unknownStatusAction;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.revokedStatusAction = software.amazon.jsii.Kernel.get(this, "revokedStatusAction", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.unknownStatusAction = software.amazon.jsii.Kernel.get(this, "unknownStatusAction", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.revokedStatusAction = builder.revokedStatusAction;
            this.unknownStatusAction = builder.unknownStatusAction;
        }

        @Override
        public final java.lang.String getRevokedStatusAction() {
            return this.revokedStatusAction;
        }

        @Override
        public final java.lang.String getUnknownStatusAction() {
            return this.unknownStatusAction;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getRevokedStatusAction() != null) {
                data.set("revokedStatusAction", om.valueToTree(this.getRevokedStatusAction()));
            }
            if (this.getUnknownStatusAction() != null) {
                data.set("unknownStatusAction", om.valueToTree(this.getUnknownStatusAction()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.networkfirewallTlsInspectionConfiguration.NetworkfirewallTlsInspectionConfigurationTlsInspectionConfigurationServerCertificateConfigurationCheckCertificateRevocationStatus"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            NetworkfirewallTlsInspectionConfigurationTlsInspectionConfigurationServerCertificateConfigurationCheckCertificateRevocationStatus.Jsii$Proxy that = (NetworkfirewallTlsInspectionConfigurationTlsInspectionConfigurationServerCertificateConfigurationCheckCertificateRevocationStatus.Jsii$Proxy) o;

            if (this.revokedStatusAction != null ? !this.revokedStatusAction.equals(that.revokedStatusAction) : that.revokedStatusAction != null) return false;
            return this.unknownStatusAction != null ? this.unknownStatusAction.equals(that.unknownStatusAction) : that.unknownStatusAction == null;
        }

        @Override
        public final int hashCode() {
            int result = this.revokedStatusAction != null ? this.revokedStatusAction.hashCode() : 0;
            result = 31 * result + (this.unknownStatusAction != null ? this.unknownStatusAction.hashCode() : 0);
            return result;
        }
    }
}
