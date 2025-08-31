package imports.aws.vpn_connection;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.631Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.vpnConnection.VpnConnectionTunnel1LogOptions")
@software.amazon.jsii.Jsii.Proxy(VpnConnectionTunnel1LogOptions.Jsii$Proxy.class)
public interface VpnConnectionTunnel1LogOptions extends software.amazon.jsii.JsiiSerializable {

    /**
     * cloudwatch_log_options block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpn_connection#cloudwatch_log_options VpnConnection#cloudwatch_log_options}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.vpn_connection.VpnConnectionTunnel1LogOptionsCloudwatchLogOptions getCloudwatchLogOptions() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link VpnConnectionTunnel1LogOptions}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link VpnConnectionTunnel1LogOptions}
     */
    public static final class Builder implements software.amazon.jsii.Builder<VpnConnectionTunnel1LogOptions> {
        imports.aws.vpn_connection.VpnConnectionTunnel1LogOptionsCloudwatchLogOptions cloudwatchLogOptions;

        /**
         * Sets the value of {@link VpnConnectionTunnel1LogOptions#getCloudwatchLogOptions}
         * @param cloudwatchLogOptions cloudwatch_log_options block.
         *                             Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpn_connection#cloudwatch_log_options VpnConnection#cloudwatch_log_options}
         * @return {@code this}
         */
        public Builder cloudwatchLogOptions(imports.aws.vpn_connection.VpnConnectionTunnel1LogOptionsCloudwatchLogOptions cloudwatchLogOptions) {
            this.cloudwatchLogOptions = cloudwatchLogOptions;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link VpnConnectionTunnel1LogOptions}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public VpnConnectionTunnel1LogOptions build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link VpnConnectionTunnel1LogOptions}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements VpnConnectionTunnel1LogOptions {
        private final imports.aws.vpn_connection.VpnConnectionTunnel1LogOptionsCloudwatchLogOptions cloudwatchLogOptions;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.cloudwatchLogOptions = software.amazon.jsii.Kernel.get(this, "cloudwatchLogOptions", software.amazon.jsii.NativeType.forClass(imports.aws.vpn_connection.VpnConnectionTunnel1LogOptionsCloudwatchLogOptions.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.cloudwatchLogOptions = builder.cloudwatchLogOptions;
        }

        @Override
        public final imports.aws.vpn_connection.VpnConnectionTunnel1LogOptionsCloudwatchLogOptions getCloudwatchLogOptions() {
            return this.cloudwatchLogOptions;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getCloudwatchLogOptions() != null) {
                data.set("cloudwatchLogOptions", om.valueToTree(this.getCloudwatchLogOptions()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.vpnConnection.VpnConnectionTunnel1LogOptions"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            VpnConnectionTunnel1LogOptions.Jsii$Proxy that = (VpnConnectionTunnel1LogOptions.Jsii$Proxy) o;

            return this.cloudwatchLogOptions != null ? this.cloudwatchLogOptions.equals(that.cloudwatchLogOptions) : that.cloudwatchLogOptions == null;
        }

        @Override
        public final int hashCode() {
            int result = this.cloudwatchLogOptions != null ? this.cloudwatchLogOptions.hashCode() : 0;
            return result;
        }
    }
}
