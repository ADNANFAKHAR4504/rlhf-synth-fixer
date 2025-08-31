package imports.aws.vpn_connection;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.631Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.vpnConnection.VpnConnectionTunnel1LogOptionsCloudwatchLogOptions")
@software.amazon.jsii.Jsii.Proxy(VpnConnectionTunnel1LogOptionsCloudwatchLogOptions.Jsii$Proxy.class)
public interface VpnConnectionTunnel1LogOptionsCloudwatchLogOptions extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpn_connection#log_enabled VpnConnection#log_enabled}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getLogEnabled() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpn_connection#log_group_arn VpnConnection#log_group_arn}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getLogGroupArn() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpn_connection#log_output_format VpnConnection#log_output_format}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getLogOutputFormat() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link VpnConnectionTunnel1LogOptionsCloudwatchLogOptions}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link VpnConnectionTunnel1LogOptionsCloudwatchLogOptions}
     */
    public static final class Builder implements software.amazon.jsii.Builder<VpnConnectionTunnel1LogOptionsCloudwatchLogOptions> {
        java.lang.Object logEnabled;
        java.lang.String logGroupArn;
        java.lang.String logOutputFormat;

        /**
         * Sets the value of {@link VpnConnectionTunnel1LogOptionsCloudwatchLogOptions#getLogEnabled}
         * @param logEnabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpn_connection#log_enabled VpnConnection#log_enabled}.
         * @return {@code this}
         */
        public Builder logEnabled(java.lang.Boolean logEnabled) {
            this.logEnabled = logEnabled;
            return this;
        }

        /**
         * Sets the value of {@link VpnConnectionTunnel1LogOptionsCloudwatchLogOptions#getLogEnabled}
         * @param logEnabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpn_connection#log_enabled VpnConnection#log_enabled}.
         * @return {@code this}
         */
        public Builder logEnabled(com.hashicorp.cdktf.IResolvable logEnabled) {
            this.logEnabled = logEnabled;
            return this;
        }

        /**
         * Sets the value of {@link VpnConnectionTunnel1LogOptionsCloudwatchLogOptions#getLogGroupArn}
         * @param logGroupArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpn_connection#log_group_arn VpnConnection#log_group_arn}.
         * @return {@code this}
         */
        public Builder logGroupArn(java.lang.String logGroupArn) {
            this.logGroupArn = logGroupArn;
            return this;
        }

        /**
         * Sets the value of {@link VpnConnectionTunnel1LogOptionsCloudwatchLogOptions#getLogOutputFormat}
         * @param logOutputFormat Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpn_connection#log_output_format VpnConnection#log_output_format}.
         * @return {@code this}
         */
        public Builder logOutputFormat(java.lang.String logOutputFormat) {
            this.logOutputFormat = logOutputFormat;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link VpnConnectionTunnel1LogOptionsCloudwatchLogOptions}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public VpnConnectionTunnel1LogOptionsCloudwatchLogOptions build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link VpnConnectionTunnel1LogOptionsCloudwatchLogOptions}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements VpnConnectionTunnel1LogOptionsCloudwatchLogOptions {
        private final java.lang.Object logEnabled;
        private final java.lang.String logGroupArn;
        private final java.lang.String logOutputFormat;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.logEnabled = software.amazon.jsii.Kernel.get(this, "logEnabled", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.logGroupArn = software.amazon.jsii.Kernel.get(this, "logGroupArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.logOutputFormat = software.amazon.jsii.Kernel.get(this, "logOutputFormat", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.logEnabled = builder.logEnabled;
            this.logGroupArn = builder.logGroupArn;
            this.logOutputFormat = builder.logOutputFormat;
        }

        @Override
        public final java.lang.Object getLogEnabled() {
            return this.logEnabled;
        }

        @Override
        public final java.lang.String getLogGroupArn() {
            return this.logGroupArn;
        }

        @Override
        public final java.lang.String getLogOutputFormat() {
            return this.logOutputFormat;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getLogEnabled() != null) {
                data.set("logEnabled", om.valueToTree(this.getLogEnabled()));
            }
            if (this.getLogGroupArn() != null) {
                data.set("logGroupArn", om.valueToTree(this.getLogGroupArn()));
            }
            if (this.getLogOutputFormat() != null) {
                data.set("logOutputFormat", om.valueToTree(this.getLogOutputFormat()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.vpnConnection.VpnConnectionTunnel1LogOptionsCloudwatchLogOptions"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            VpnConnectionTunnel1LogOptionsCloudwatchLogOptions.Jsii$Proxy that = (VpnConnectionTunnel1LogOptionsCloudwatchLogOptions.Jsii$Proxy) o;

            if (this.logEnabled != null ? !this.logEnabled.equals(that.logEnabled) : that.logEnabled != null) return false;
            if (this.logGroupArn != null ? !this.logGroupArn.equals(that.logGroupArn) : that.logGroupArn != null) return false;
            return this.logOutputFormat != null ? this.logOutputFormat.equals(that.logOutputFormat) : that.logOutputFormat == null;
        }

        @Override
        public final int hashCode() {
            int result = this.logEnabled != null ? this.logEnabled.hashCode() : 0;
            result = 31 * result + (this.logGroupArn != null ? this.logGroupArn.hashCode() : 0);
            result = 31 * result + (this.logOutputFormat != null ? this.logOutputFormat.hashCode() : 0);
            return result;
        }
    }
}
