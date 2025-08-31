package imports.aws.networkfirewall_tls_inspection_configuration;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.962Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.networkfirewallTlsInspectionConfiguration.NetworkfirewallTlsInspectionConfigurationTlsInspectionConfigurationServerCertificateConfigurationScope")
@software.amazon.jsii.Jsii.Proxy(NetworkfirewallTlsInspectionConfigurationTlsInspectionConfigurationServerCertificateConfigurationScope.Jsii$Proxy.class)
public interface NetworkfirewallTlsInspectionConfigurationTlsInspectionConfigurationServerCertificateConfigurationScope extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/networkfirewall_tls_inspection_configuration#protocols NetworkfirewallTlsInspectionConfiguration#protocols}.
     */
    @org.jetbrains.annotations.NotNull java.util.List<java.lang.Number> getProtocols();

    /**
     * destination block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/networkfirewall_tls_inspection_configuration#destination NetworkfirewallTlsInspectionConfiguration#destination}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getDestination() {
        return null;
    }

    /**
     * destination_ports block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/networkfirewall_tls_inspection_configuration#destination_ports NetworkfirewallTlsInspectionConfiguration#destination_ports}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getDestinationPorts() {
        return null;
    }

    /**
     * source block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/networkfirewall_tls_inspection_configuration#source NetworkfirewallTlsInspectionConfiguration#source}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getSource() {
        return null;
    }

    /**
     * source_ports block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/networkfirewall_tls_inspection_configuration#source_ports NetworkfirewallTlsInspectionConfiguration#source_ports}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getSourcePorts() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link NetworkfirewallTlsInspectionConfigurationTlsInspectionConfigurationServerCertificateConfigurationScope}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link NetworkfirewallTlsInspectionConfigurationTlsInspectionConfigurationServerCertificateConfigurationScope}
     */
    public static final class Builder implements software.amazon.jsii.Builder<NetworkfirewallTlsInspectionConfigurationTlsInspectionConfigurationServerCertificateConfigurationScope> {
        java.util.List<java.lang.Number> protocols;
        java.lang.Object destination;
        java.lang.Object destinationPorts;
        java.lang.Object source;
        java.lang.Object sourcePorts;

        /**
         * Sets the value of {@link NetworkfirewallTlsInspectionConfigurationTlsInspectionConfigurationServerCertificateConfigurationScope#getProtocols}
         * @param protocols Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/networkfirewall_tls_inspection_configuration#protocols NetworkfirewallTlsInspectionConfiguration#protocols}. This parameter is required.
         * @return {@code this}
         */
        @SuppressWarnings("unchecked")
        public Builder protocols(java.util.List<? extends java.lang.Number> protocols) {
            this.protocols = (java.util.List<java.lang.Number>)protocols;
            return this;
        }

        /**
         * Sets the value of {@link NetworkfirewallTlsInspectionConfigurationTlsInspectionConfigurationServerCertificateConfigurationScope#getDestination}
         * @param destination destination block.
         *                    Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/networkfirewall_tls_inspection_configuration#destination NetworkfirewallTlsInspectionConfiguration#destination}
         * @return {@code this}
         */
        public Builder destination(com.hashicorp.cdktf.IResolvable destination) {
            this.destination = destination;
            return this;
        }

        /**
         * Sets the value of {@link NetworkfirewallTlsInspectionConfigurationTlsInspectionConfigurationServerCertificateConfigurationScope#getDestination}
         * @param destination destination block.
         *                    Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/networkfirewall_tls_inspection_configuration#destination NetworkfirewallTlsInspectionConfiguration#destination}
         * @return {@code this}
         */
        public Builder destination(java.util.List<? extends imports.aws.networkfirewall_tls_inspection_configuration.NetworkfirewallTlsInspectionConfigurationTlsInspectionConfigurationServerCertificateConfigurationScopeDestination> destination) {
            this.destination = destination;
            return this;
        }

        /**
         * Sets the value of {@link NetworkfirewallTlsInspectionConfigurationTlsInspectionConfigurationServerCertificateConfigurationScope#getDestinationPorts}
         * @param destinationPorts destination_ports block.
         *                         Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/networkfirewall_tls_inspection_configuration#destination_ports NetworkfirewallTlsInspectionConfiguration#destination_ports}
         * @return {@code this}
         */
        public Builder destinationPorts(com.hashicorp.cdktf.IResolvable destinationPorts) {
            this.destinationPorts = destinationPorts;
            return this;
        }

        /**
         * Sets the value of {@link NetworkfirewallTlsInspectionConfigurationTlsInspectionConfigurationServerCertificateConfigurationScope#getDestinationPorts}
         * @param destinationPorts destination_ports block.
         *                         Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/networkfirewall_tls_inspection_configuration#destination_ports NetworkfirewallTlsInspectionConfiguration#destination_ports}
         * @return {@code this}
         */
        public Builder destinationPorts(java.util.List<? extends imports.aws.networkfirewall_tls_inspection_configuration.NetworkfirewallTlsInspectionConfigurationTlsInspectionConfigurationServerCertificateConfigurationScopeDestinationPorts> destinationPorts) {
            this.destinationPorts = destinationPorts;
            return this;
        }

        /**
         * Sets the value of {@link NetworkfirewallTlsInspectionConfigurationTlsInspectionConfigurationServerCertificateConfigurationScope#getSource}
         * @param source source block.
         *               Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/networkfirewall_tls_inspection_configuration#source NetworkfirewallTlsInspectionConfiguration#source}
         * @return {@code this}
         */
        public Builder source(com.hashicorp.cdktf.IResolvable source) {
            this.source = source;
            return this;
        }

        /**
         * Sets the value of {@link NetworkfirewallTlsInspectionConfigurationTlsInspectionConfigurationServerCertificateConfigurationScope#getSource}
         * @param source source block.
         *               Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/networkfirewall_tls_inspection_configuration#source NetworkfirewallTlsInspectionConfiguration#source}
         * @return {@code this}
         */
        public Builder source(java.util.List<? extends imports.aws.networkfirewall_tls_inspection_configuration.NetworkfirewallTlsInspectionConfigurationTlsInspectionConfigurationServerCertificateConfigurationScopeSource> source) {
            this.source = source;
            return this;
        }

        /**
         * Sets the value of {@link NetworkfirewallTlsInspectionConfigurationTlsInspectionConfigurationServerCertificateConfigurationScope#getSourcePorts}
         * @param sourcePorts source_ports block.
         *                    Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/networkfirewall_tls_inspection_configuration#source_ports NetworkfirewallTlsInspectionConfiguration#source_ports}
         * @return {@code this}
         */
        public Builder sourcePorts(com.hashicorp.cdktf.IResolvable sourcePorts) {
            this.sourcePorts = sourcePorts;
            return this;
        }

        /**
         * Sets the value of {@link NetworkfirewallTlsInspectionConfigurationTlsInspectionConfigurationServerCertificateConfigurationScope#getSourcePorts}
         * @param sourcePorts source_ports block.
         *                    Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/networkfirewall_tls_inspection_configuration#source_ports NetworkfirewallTlsInspectionConfiguration#source_ports}
         * @return {@code this}
         */
        public Builder sourcePorts(java.util.List<? extends imports.aws.networkfirewall_tls_inspection_configuration.NetworkfirewallTlsInspectionConfigurationTlsInspectionConfigurationServerCertificateConfigurationScopeSourcePorts> sourcePorts) {
            this.sourcePorts = sourcePorts;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link NetworkfirewallTlsInspectionConfigurationTlsInspectionConfigurationServerCertificateConfigurationScope}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public NetworkfirewallTlsInspectionConfigurationTlsInspectionConfigurationServerCertificateConfigurationScope build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link NetworkfirewallTlsInspectionConfigurationTlsInspectionConfigurationServerCertificateConfigurationScope}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements NetworkfirewallTlsInspectionConfigurationTlsInspectionConfigurationServerCertificateConfigurationScope {
        private final java.util.List<java.lang.Number> protocols;
        private final java.lang.Object destination;
        private final java.lang.Object destinationPorts;
        private final java.lang.Object source;
        private final java.lang.Object sourcePorts;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.protocols = software.amazon.jsii.Kernel.get(this, "protocols", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.Number.class)));
            this.destination = software.amazon.jsii.Kernel.get(this, "destination", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.destinationPorts = software.amazon.jsii.Kernel.get(this, "destinationPorts", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.source = software.amazon.jsii.Kernel.get(this, "source", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.sourcePorts = software.amazon.jsii.Kernel.get(this, "sourcePorts", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        @SuppressWarnings("unchecked")
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.protocols = (java.util.List<java.lang.Number>)java.util.Objects.requireNonNull(builder.protocols, "protocols is required");
            this.destination = builder.destination;
            this.destinationPorts = builder.destinationPorts;
            this.source = builder.source;
            this.sourcePorts = builder.sourcePorts;
        }

        @Override
        public final java.util.List<java.lang.Number> getProtocols() {
            return this.protocols;
        }

        @Override
        public final java.lang.Object getDestination() {
            return this.destination;
        }

        @Override
        public final java.lang.Object getDestinationPorts() {
            return this.destinationPorts;
        }

        @Override
        public final java.lang.Object getSource() {
            return this.source;
        }

        @Override
        public final java.lang.Object getSourcePorts() {
            return this.sourcePorts;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("protocols", om.valueToTree(this.getProtocols()));
            if (this.getDestination() != null) {
                data.set("destination", om.valueToTree(this.getDestination()));
            }
            if (this.getDestinationPorts() != null) {
                data.set("destinationPorts", om.valueToTree(this.getDestinationPorts()));
            }
            if (this.getSource() != null) {
                data.set("source", om.valueToTree(this.getSource()));
            }
            if (this.getSourcePorts() != null) {
                data.set("sourcePorts", om.valueToTree(this.getSourcePorts()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.networkfirewallTlsInspectionConfiguration.NetworkfirewallTlsInspectionConfigurationTlsInspectionConfigurationServerCertificateConfigurationScope"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            NetworkfirewallTlsInspectionConfigurationTlsInspectionConfigurationServerCertificateConfigurationScope.Jsii$Proxy that = (NetworkfirewallTlsInspectionConfigurationTlsInspectionConfigurationServerCertificateConfigurationScope.Jsii$Proxy) o;

            if (!protocols.equals(that.protocols)) return false;
            if (this.destination != null ? !this.destination.equals(that.destination) : that.destination != null) return false;
            if (this.destinationPorts != null ? !this.destinationPorts.equals(that.destinationPorts) : that.destinationPorts != null) return false;
            if (this.source != null ? !this.source.equals(that.source) : that.source != null) return false;
            return this.sourcePorts != null ? this.sourcePorts.equals(that.sourcePorts) : that.sourcePorts == null;
        }

        @Override
        public final int hashCode() {
            int result = this.protocols.hashCode();
            result = 31 * result + (this.destination != null ? this.destination.hashCode() : 0);
            result = 31 * result + (this.destinationPorts != null ? this.destinationPorts.hashCode() : 0);
            result = 31 * result + (this.source != null ? this.source.hashCode() : 0);
            result = 31 * result + (this.sourcePorts != null ? this.sourcePorts.hashCode() : 0);
            return result;
        }
    }
}
