package imports.aws.transfer_server;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.564Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.transferServer.TransferServerProtocolDetails")
@software.amazon.jsii.Jsii.Proxy(TransferServerProtocolDetails.Jsii$Proxy.class)
public interface TransferServerProtocolDetails extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_server#as2_transports TransferServer#as2_transports}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getAs2Transports() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_server#passive_ip TransferServer#passive_ip}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getPassiveIp() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_server#set_stat_option TransferServer#set_stat_option}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getSetStatOption() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_server#tls_session_resumption_mode TransferServer#tls_session_resumption_mode}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getTlsSessionResumptionMode() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link TransferServerProtocolDetails}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link TransferServerProtocolDetails}
     */
    public static final class Builder implements software.amazon.jsii.Builder<TransferServerProtocolDetails> {
        java.util.List<java.lang.String> as2Transports;
        java.lang.String passiveIp;
        java.lang.String setStatOption;
        java.lang.String tlsSessionResumptionMode;

        /**
         * Sets the value of {@link TransferServerProtocolDetails#getAs2Transports}
         * @param as2Transports Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_server#as2_transports TransferServer#as2_transports}.
         * @return {@code this}
         */
        public Builder as2Transports(java.util.List<java.lang.String> as2Transports) {
            this.as2Transports = as2Transports;
            return this;
        }

        /**
         * Sets the value of {@link TransferServerProtocolDetails#getPassiveIp}
         * @param passiveIp Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_server#passive_ip TransferServer#passive_ip}.
         * @return {@code this}
         */
        public Builder passiveIp(java.lang.String passiveIp) {
            this.passiveIp = passiveIp;
            return this;
        }

        /**
         * Sets the value of {@link TransferServerProtocolDetails#getSetStatOption}
         * @param setStatOption Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_server#set_stat_option TransferServer#set_stat_option}.
         * @return {@code this}
         */
        public Builder setStatOption(java.lang.String setStatOption) {
            this.setStatOption = setStatOption;
            return this;
        }

        /**
         * Sets the value of {@link TransferServerProtocolDetails#getTlsSessionResumptionMode}
         * @param tlsSessionResumptionMode Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_server#tls_session_resumption_mode TransferServer#tls_session_resumption_mode}.
         * @return {@code this}
         */
        public Builder tlsSessionResumptionMode(java.lang.String tlsSessionResumptionMode) {
            this.tlsSessionResumptionMode = tlsSessionResumptionMode;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link TransferServerProtocolDetails}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public TransferServerProtocolDetails build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link TransferServerProtocolDetails}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements TransferServerProtocolDetails {
        private final java.util.List<java.lang.String> as2Transports;
        private final java.lang.String passiveIp;
        private final java.lang.String setStatOption;
        private final java.lang.String tlsSessionResumptionMode;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.as2Transports = software.amazon.jsii.Kernel.get(this, "as2Transports", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.passiveIp = software.amazon.jsii.Kernel.get(this, "passiveIp", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.setStatOption = software.amazon.jsii.Kernel.get(this, "setStatOption", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.tlsSessionResumptionMode = software.amazon.jsii.Kernel.get(this, "tlsSessionResumptionMode", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.as2Transports = builder.as2Transports;
            this.passiveIp = builder.passiveIp;
            this.setStatOption = builder.setStatOption;
            this.tlsSessionResumptionMode = builder.tlsSessionResumptionMode;
        }

        @Override
        public final java.util.List<java.lang.String> getAs2Transports() {
            return this.as2Transports;
        }

        @Override
        public final java.lang.String getPassiveIp() {
            return this.passiveIp;
        }

        @Override
        public final java.lang.String getSetStatOption() {
            return this.setStatOption;
        }

        @Override
        public final java.lang.String getTlsSessionResumptionMode() {
            return this.tlsSessionResumptionMode;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getAs2Transports() != null) {
                data.set("as2Transports", om.valueToTree(this.getAs2Transports()));
            }
            if (this.getPassiveIp() != null) {
                data.set("passiveIp", om.valueToTree(this.getPassiveIp()));
            }
            if (this.getSetStatOption() != null) {
                data.set("setStatOption", om.valueToTree(this.getSetStatOption()));
            }
            if (this.getTlsSessionResumptionMode() != null) {
                data.set("tlsSessionResumptionMode", om.valueToTree(this.getTlsSessionResumptionMode()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.transferServer.TransferServerProtocolDetails"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            TransferServerProtocolDetails.Jsii$Proxy that = (TransferServerProtocolDetails.Jsii$Proxy) o;

            if (this.as2Transports != null ? !this.as2Transports.equals(that.as2Transports) : that.as2Transports != null) return false;
            if (this.passiveIp != null ? !this.passiveIp.equals(that.passiveIp) : that.passiveIp != null) return false;
            if (this.setStatOption != null ? !this.setStatOption.equals(that.setStatOption) : that.setStatOption != null) return false;
            return this.tlsSessionResumptionMode != null ? this.tlsSessionResumptionMode.equals(that.tlsSessionResumptionMode) : that.tlsSessionResumptionMode == null;
        }

        @Override
        public final int hashCode() {
            int result = this.as2Transports != null ? this.as2Transports.hashCode() : 0;
            result = 31 * result + (this.passiveIp != null ? this.passiveIp.hashCode() : 0);
            result = 31 * result + (this.setStatOption != null ? this.setStatOption.hashCode() : 0);
            result = 31 * result + (this.tlsSessionResumptionMode != null ? this.tlsSessionResumptionMode.hashCode() : 0);
            return result;
        }
    }
}
