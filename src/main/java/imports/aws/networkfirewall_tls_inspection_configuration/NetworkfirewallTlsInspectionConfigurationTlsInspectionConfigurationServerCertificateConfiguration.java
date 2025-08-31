package imports.aws.networkfirewall_tls_inspection_configuration;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.962Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.networkfirewallTlsInspectionConfiguration.NetworkfirewallTlsInspectionConfigurationTlsInspectionConfigurationServerCertificateConfiguration")
@software.amazon.jsii.Jsii.Proxy(NetworkfirewallTlsInspectionConfigurationTlsInspectionConfigurationServerCertificateConfiguration.Jsii$Proxy.class)
public interface NetworkfirewallTlsInspectionConfigurationTlsInspectionConfigurationServerCertificateConfiguration extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/networkfirewall_tls_inspection_configuration#certificate_authority_arn NetworkfirewallTlsInspectionConfiguration#certificate_authority_arn}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getCertificateAuthorityArn() {
        return null;
    }

    /**
     * check_certificate_revocation_status block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/networkfirewall_tls_inspection_configuration#check_certificate_revocation_status NetworkfirewallTlsInspectionConfiguration#check_certificate_revocation_status}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getCheckCertificateRevocationStatus() {
        return null;
    }

    /**
     * scope block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/networkfirewall_tls_inspection_configuration#scope NetworkfirewallTlsInspectionConfiguration#scope}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getScope() {
        return null;
    }

    /**
     * server_certificate block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/networkfirewall_tls_inspection_configuration#server_certificate NetworkfirewallTlsInspectionConfiguration#server_certificate}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getServerCertificate() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link NetworkfirewallTlsInspectionConfigurationTlsInspectionConfigurationServerCertificateConfiguration}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link NetworkfirewallTlsInspectionConfigurationTlsInspectionConfigurationServerCertificateConfiguration}
     */
    public static final class Builder implements software.amazon.jsii.Builder<NetworkfirewallTlsInspectionConfigurationTlsInspectionConfigurationServerCertificateConfiguration> {
        java.lang.String certificateAuthorityArn;
        java.lang.Object checkCertificateRevocationStatus;
        java.lang.Object scope;
        java.lang.Object serverCertificate;

        /**
         * Sets the value of {@link NetworkfirewallTlsInspectionConfigurationTlsInspectionConfigurationServerCertificateConfiguration#getCertificateAuthorityArn}
         * @param certificateAuthorityArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/networkfirewall_tls_inspection_configuration#certificate_authority_arn NetworkfirewallTlsInspectionConfiguration#certificate_authority_arn}.
         * @return {@code this}
         */
        public Builder certificateAuthorityArn(java.lang.String certificateAuthorityArn) {
            this.certificateAuthorityArn = certificateAuthorityArn;
            return this;
        }

        /**
         * Sets the value of {@link NetworkfirewallTlsInspectionConfigurationTlsInspectionConfigurationServerCertificateConfiguration#getCheckCertificateRevocationStatus}
         * @param checkCertificateRevocationStatus check_certificate_revocation_status block.
         *                                         Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/networkfirewall_tls_inspection_configuration#check_certificate_revocation_status NetworkfirewallTlsInspectionConfiguration#check_certificate_revocation_status}
         * @return {@code this}
         */
        public Builder checkCertificateRevocationStatus(com.hashicorp.cdktf.IResolvable checkCertificateRevocationStatus) {
            this.checkCertificateRevocationStatus = checkCertificateRevocationStatus;
            return this;
        }

        /**
         * Sets the value of {@link NetworkfirewallTlsInspectionConfigurationTlsInspectionConfigurationServerCertificateConfiguration#getCheckCertificateRevocationStatus}
         * @param checkCertificateRevocationStatus check_certificate_revocation_status block.
         *                                         Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/networkfirewall_tls_inspection_configuration#check_certificate_revocation_status NetworkfirewallTlsInspectionConfiguration#check_certificate_revocation_status}
         * @return {@code this}
         */
        public Builder checkCertificateRevocationStatus(java.util.List<? extends imports.aws.networkfirewall_tls_inspection_configuration.NetworkfirewallTlsInspectionConfigurationTlsInspectionConfigurationServerCertificateConfigurationCheckCertificateRevocationStatus> checkCertificateRevocationStatus) {
            this.checkCertificateRevocationStatus = checkCertificateRevocationStatus;
            return this;
        }

        /**
         * Sets the value of {@link NetworkfirewallTlsInspectionConfigurationTlsInspectionConfigurationServerCertificateConfiguration#getScope}
         * @param scope scope block.
         *              Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/networkfirewall_tls_inspection_configuration#scope NetworkfirewallTlsInspectionConfiguration#scope}
         * @return {@code this}
         */
        public Builder scope(com.hashicorp.cdktf.IResolvable scope) {
            this.scope = scope;
            return this;
        }

        /**
         * Sets the value of {@link NetworkfirewallTlsInspectionConfigurationTlsInspectionConfigurationServerCertificateConfiguration#getScope}
         * @param scope scope block.
         *              Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/networkfirewall_tls_inspection_configuration#scope NetworkfirewallTlsInspectionConfiguration#scope}
         * @return {@code this}
         */
        public Builder scope(java.util.List<? extends imports.aws.networkfirewall_tls_inspection_configuration.NetworkfirewallTlsInspectionConfigurationTlsInspectionConfigurationServerCertificateConfigurationScope> scope) {
            this.scope = scope;
            return this;
        }

        /**
         * Sets the value of {@link NetworkfirewallTlsInspectionConfigurationTlsInspectionConfigurationServerCertificateConfiguration#getServerCertificate}
         * @param serverCertificate server_certificate block.
         *                          Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/networkfirewall_tls_inspection_configuration#server_certificate NetworkfirewallTlsInspectionConfiguration#server_certificate}
         * @return {@code this}
         */
        public Builder serverCertificate(com.hashicorp.cdktf.IResolvable serverCertificate) {
            this.serverCertificate = serverCertificate;
            return this;
        }

        /**
         * Sets the value of {@link NetworkfirewallTlsInspectionConfigurationTlsInspectionConfigurationServerCertificateConfiguration#getServerCertificate}
         * @param serverCertificate server_certificate block.
         *                          Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/networkfirewall_tls_inspection_configuration#server_certificate NetworkfirewallTlsInspectionConfiguration#server_certificate}
         * @return {@code this}
         */
        public Builder serverCertificate(java.util.List<? extends imports.aws.networkfirewall_tls_inspection_configuration.NetworkfirewallTlsInspectionConfigurationTlsInspectionConfigurationServerCertificateConfigurationServerCertificate> serverCertificate) {
            this.serverCertificate = serverCertificate;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link NetworkfirewallTlsInspectionConfigurationTlsInspectionConfigurationServerCertificateConfiguration}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public NetworkfirewallTlsInspectionConfigurationTlsInspectionConfigurationServerCertificateConfiguration build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link NetworkfirewallTlsInspectionConfigurationTlsInspectionConfigurationServerCertificateConfiguration}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements NetworkfirewallTlsInspectionConfigurationTlsInspectionConfigurationServerCertificateConfiguration {
        private final java.lang.String certificateAuthorityArn;
        private final java.lang.Object checkCertificateRevocationStatus;
        private final java.lang.Object scope;
        private final java.lang.Object serverCertificate;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.certificateAuthorityArn = software.amazon.jsii.Kernel.get(this, "certificateAuthorityArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.checkCertificateRevocationStatus = software.amazon.jsii.Kernel.get(this, "checkCertificateRevocationStatus", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.scope = software.amazon.jsii.Kernel.get(this, "scope", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.serverCertificate = software.amazon.jsii.Kernel.get(this, "serverCertificate", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.certificateAuthorityArn = builder.certificateAuthorityArn;
            this.checkCertificateRevocationStatus = builder.checkCertificateRevocationStatus;
            this.scope = builder.scope;
            this.serverCertificate = builder.serverCertificate;
        }

        @Override
        public final java.lang.String getCertificateAuthorityArn() {
            return this.certificateAuthorityArn;
        }

        @Override
        public final java.lang.Object getCheckCertificateRevocationStatus() {
            return this.checkCertificateRevocationStatus;
        }

        @Override
        public final java.lang.Object getScope() {
            return this.scope;
        }

        @Override
        public final java.lang.Object getServerCertificate() {
            return this.serverCertificate;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getCertificateAuthorityArn() != null) {
                data.set("certificateAuthorityArn", om.valueToTree(this.getCertificateAuthorityArn()));
            }
            if (this.getCheckCertificateRevocationStatus() != null) {
                data.set("checkCertificateRevocationStatus", om.valueToTree(this.getCheckCertificateRevocationStatus()));
            }
            if (this.getScope() != null) {
                data.set("scope", om.valueToTree(this.getScope()));
            }
            if (this.getServerCertificate() != null) {
                data.set("serverCertificate", om.valueToTree(this.getServerCertificate()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.networkfirewallTlsInspectionConfiguration.NetworkfirewallTlsInspectionConfigurationTlsInspectionConfigurationServerCertificateConfiguration"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            NetworkfirewallTlsInspectionConfigurationTlsInspectionConfigurationServerCertificateConfiguration.Jsii$Proxy that = (NetworkfirewallTlsInspectionConfigurationTlsInspectionConfigurationServerCertificateConfiguration.Jsii$Proxy) o;

            if (this.certificateAuthorityArn != null ? !this.certificateAuthorityArn.equals(that.certificateAuthorityArn) : that.certificateAuthorityArn != null) return false;
            if (this.checkCertificateRevocationStatus != null ? !this.checkCertificateRevocationStatus.equals(that.checkCertificateRevocationStatus) : that.checkCertificateRevocationStatus != null) return false;
            if (this.scope != null ? !this.scope.equals(that.scope) : that.scope != null) return false;
            return this.serverCertificate != null ? this.serverCertificate.equals(that.serverCertificate) : that.serverCertificate == null;
        }

        @Override
        public final int hashCode() {
            int result = this.certificateAuthorityArn != null ? this.certificateAuthorityArn.hashCode() : 0;
            result = 31 * result + (this.checkCertificateRevocationStatus != null ? this.checkCertificateRevocationStatus.hashCode() : 0);
            result = 31 * result + (this.scope != null ? this.scope.hashCode() : 0);
            result = 31 * result + (this.serverCertificate != null ? this.serverCertificate.hashCode() : 0);
            return result;
        }
    }
}
