package imports.aws.dms_endpoint;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.013Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.dmsEndpoint.DmsEndpointRedisSettings")
@software.amazon.jsii.Jsii.Proxy(DmsEndpointRedisSettings.Jsii$Proxy.class)
public interface DmsEndpointRedisSettings extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_endpoint#auth_type DmsEndpoint#auth_type}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getAuthType();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_endpoint#port DmsEndpoint#port}.
     */
    @org.jetbrains.annotations.NotNull java.lang.Number getPort();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_endpoint#server_name DmsEndpoint#server_name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getServerName();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_endpoint#auth_password DmsEndpoint#auth_password}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getAuthPassword() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_endpoint#auth_user_name DmsEndpoint#auth_user_name}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getAuthUserName() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_endpoint#ssl_ca_certificate_arn DmsEndpoint#ssl_ca_certificate_arn}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getSslCaCertificateArn() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_endpoint#ssl_security_protocol DmsEndpoint#ssl_security_protocol}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getSslSecurityProtocol() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link DmsEndpointRedisSettings}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link DmsEndpointRedisSettings}
     */
    public static final class Builder implements software.amazon.jsii.Builder<DmsEndpointRedisSettings> {
        java.lang.String authType;
        java.lang.Number port;
        java.lang.String serverName;
        java.lang.String authPassword;
        java.lang.String authUserName;
        java.lang.String sslCaCertificateArn;
        java.lang.String sslSecurityProtocol;

        /**
         * Sets the value of {@link DmsEndpointRedisSettings#getAuthType}
         * @param authType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_endpoint#auth_type DmsEndpoint#auth_type}. This parameter is required.
         * @return {@code this}
         */
        public Builder authType(java.lang.String authType) {
            this.authType = authType;
            return this;
        }

        /**
         * Sets the value of {@link DmsEndpointRedisSettings#getPort}
         * @param port Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_endpoint#port DmsEndpoint#port}. This parameter is required.
         * @return {@code this}
         */
        public Builder port(java.lang.Number port) {
            this.port = port;
            return this;
        }

        /**
         * Sets the value of {@link DmsEndpointRedisSettings#getServerName}
         * @param serverName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_endpoint#server_name DmsEndpoint#server_name}. This parameter is required.
         * @return {@code this}
         */
        public Builder serverName(java.lang.String serverName) {
            this.serverName = serverName;
            return this;
        }

        /**
         * Sets the value of {@link DmsEndpointRedisSettings#getAuthPassword}
         * @param authPassword Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_endpoint#auth_password DmsEndpoint#auth_password}.
         * @return {@code this}
         */
        public Builder authPassword(java.lang.String authPassword) {
            this.authPassword = authPassword;
            return this;
        }

        /**
         * Sets the value of {@link DmsEndpointRedisSettings#getAuthUserName}
         * @param authUserName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_endpoint#auth_user_name DmsEndpoint#auth_user_name}.
         * @return {@code this}
         */
        public Builder authUserName(java.lang.String authUserName) {
            this.authUserName = authUserName;
            return this;
        }

        /**
         * Sets the value of {@link DmsEndpointRedisSettings#getSslCaCertificateArn}
         * @param sslCaCertificateArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_endpoint#ssl_ca_certificate_arn DmsEndpoint#ssl_ca_certificate_arn}.
         * @return {@code this}
         */
        public Builder sslCaCertificateArn(java.lang.String sslCaCertificateArn) {
            this.sslCaCertificateArn = sslCaCertificateArn;
            return this;
        }

        /**
         * Sets the value of {@link DmsEndpointRedisSettings#getSslSecurityProtocol}
         * @param sslSecurityProtocol Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_endpoint#ssl_security_protocol DmsEndpoint#ssl_security_protocol}.
         * @return {@code this}
         */
        public Builder sslSecurityProtocol(java.lang.String sslSecurityProtocol) {
            this.sslSecurityProtocol = sslSecurityProtocol;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link DmsEndpointRedisSettings}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public DmsEndpointRedisSettings build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link DmsEndpointRedisSettings}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements DmsEndpointRedisSettings {
        private final java.lang.String authType;
        private final java.lang.Number port;
        private final java.lang.String serverName;
        private final java.lang.String authPassword;
        private final java.lang.String authUserName;
        private final java.lang.String sslCaCertificateArn;
        private final java.lang.String sslSecurityProtocol;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.authType = software.amazon.jsii.Kernel.get(this, "authType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.port = software.amazon.jsii.Kernel.get(this, "port", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.serverName = software.amazon.jsii.Kernel.get(this, "serverName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.authPassword = software.amazon.jsii.Kernel.get(this, "authPassword", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.authUserName = software.amazon.jsii.Kernel.get(this, "authUserName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.sslCaCertificateArn = software.amazon.jsii.Kernel.get(this, "sslCaCertificateArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.sslSecurityProtocol = software.amazon.jsii.Kernel.get(this, "sslSecurityProtocol", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.authType = java.util.Objects.requireNonNull(builder.authType, "authType is required");
            this.port = java.util.Objects.requireNonNull(builder.port, "port is required");
            this.serverName = java.util.Objects.requireNonNull(builder.serverName, "serverName is required");
            this.authPassword = builder.authPassword;
            this.authUserName = builder.authUserName;
            this.sslCaCertificateArn = builder.sslCaCertificateArn;
            this.sslSecurityProtocol = builder.sslSecurityProtocol;
        }

        @Override
        public final java.lang.String getAuthType() {
            return this.authType;
        }

        @Override
        public final java.lang.Number getPort() {
            return this.port;
        }

        @Override
        public final java.lang.String getServerName() {
            return this.serverName;
        }

        @Override
        public final java.lang.String getAuthPassword() {
            return this.authPassword;
        }

        @Override
        public final java.lang.String getAuthUserName() {
            return this.authUserName;
        }

        @Override
        public final java.lang.String getSslCaCertificateArn() {
            return this.sslCaCertificateArn;
        }

        @Override
        public final java.lang.String getSslSecurityProtocol() {
            return this.sslSecurityProtocol;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("authType", om.valueToTree(this.getAuthType()));
            data.set("port", om.valueToTree(this.getPort()));
            data.set("serverName", om.valueToTree(this.getServerName()));
            if (this.getAuthPassword() != null) {
                data.set("authPassword", om.valueToTree(this.getAuthPassword()));
            }
            if (this.getAuthUserName() != null) {
                data.set("authUserName", om.valueToTree(this.getAuthUserName()));
            }
            if (this.getSslCaCertificateArn() != null) {
                data.set("sslCaCertificateArn", om.valueToTree(this.getSslCaCertificateArn()));
            }
            if (this.getSslSecurityProtocol() != null) {
                data.set("sslSecurityProtocol", om.valueToTree(this.getSslSecurityProtocol()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.dmsEndpoint.DmsEndpointRedisSettings"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            DmsEndpointRedisSettings.Jsii$Proxy that = (DmsEndpointRedisSettings.Jsii$Proxy) o;

            if (!authType.equals(that.authType)) return false;
            if (!port.equals(that.port)) return false;
            if (!serverName.equals(that.serverName)) return false;
            if (this.authPassword != null ? !this.authPassword.equals(that.authPassword) : that.authPassword != null) return false;
            if (this.authUserName != null ? !this.authUserName.equals(that.authUserName) : that.authUserName != null) return false;
            if (this.sslCaCertificateArn != null ? !this.sslCaCertificateArn.equals(that.sslCaCertificateArn) : that.sslCaCertificateArn != null) return false;
            return this.sslSecurityProtocol != null ? this.sslSecurityProtocol.equals(that.sslSecurityProtocol) : that.sslSecurityProtocol == null;
        }

        @Override
        public final int hashCode() {
            int result = this.authType.hashCode();
            result = 31 * result + (this.port.hashCode());
            result = 31 * result + (this.serverName.hashCode());
            result = 31 * result + (this.authPassword != null ? this.authPassword.hashCode() : 0);
            result = 31 * result + (this.authUserName != null ? this.authUserName.hashCode() : 0);
            result = 31 * result + (this.sslCaCertificateArn != null ? this.sslCaCertificateArn.hashCode() : 0);
            result = 31 * result + (this.sslSecurityProtocol != null ? this.sslSecurityProtocol.hashCode() : 0);
            return result;
        }
    }
}
