package imports.aws.lb_listener_rule;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.532Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.lbListenerRule.LbListenerRuleActionRedirect")
@software.amazon.jsii.Jsii.Proxy(LbListenerRuleActionRedirect.Jsii$Proxy.class)
public interface LbListenerRuleActionRedirect extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener_rule#status_code LbListenerRule#status_code}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getStatusCode();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener_rule#host LbListenerRule#host}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getHost() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener_rule#path LbListenerRule#path}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getPath() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener_rule#port LbListenerRule#port}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getPort() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener_rule#protocol LbListenerRule#protocol}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getProtocol() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener_rule#query LbListenerRule#query}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getQuery() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link LbListenerRuleActionRedirect}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link LbListenerRuleActionRedirect}
     */
    public static final class Builder implements software.amazon.jsii.Builder<LbListenerRuleActionRedirect> {
        java.lang.String statusCode;
        java.lang.String host;
        java.lang.String path;
        java.lang.String port;
        java.lang.String protocol;
        java.lang.String query;

        /**
         * Sets the value of {@link LbListenerRuleActionRedirect#getStatusCode}
         * @param statusCode Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener_rule#status_code LbListenerRule#status_code}. This parameter is required.
         * @return {@code this}
         */
        public Builder statusCode(java.lang.String statusCode) {
            this.statusCode = statusCode;
            return this;
        }

        /**
         * Sets the value of {@link LbListenerRuleActionRedirect#getHost}
         * @param host Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener_rule#host LbListenerRule#host}.
         * @return {@code this}
         */
        public Builder host(java.lang.String host) {
            this.host = host;
            return this;
        }

        /**
         * Sets the value of {@link LbListenerRuleActionRedirect#getPath}
         * @param path Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener_rule#path LbListenerRule#path}.
         * @return {@code this}
         */
        public Builder path(java.lang.String path) {
            this.path = path;
            return this;
        }

        /**
         * Sets the value of {@link LbListenerRuleActionRedirect#getPort}
         * @param port Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener_rule#port LbListenerRule#port}.
         * @return {@code this}
         */
        public Builder port(java.lang.String port) {
            this.port = port;
            return this;
        }

        /**
         * Sets the value of {@link LbListenerRuleActionRedirect#getProtocol}
         * @param protocol Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener_rule#protocol LbListenerRule#protocol}.
         * @return {@code this}
         */
        public Builder protocol(java.lang.String protocol) {
            this.protocol = protocol;
            return this;
        }

        /**
         * Sets the value of {@link LbListenerRuleActionRedirect#getQuery}
         * @param query Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb_listener_rule#query LbListenerRule#query}.
         * @return {@code this}
         */
        public Builder query(java.lang.String query) {
            this.query = query;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link LbListenerRuleActionRedirect}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public LbListenerRuleActionRedirect build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link LbListenerRuleActionRedirect}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements LbListenerRuleActionRedirect {
        private final java.lang.String statusCode;
        private final java.lang.String host;
        private final java.lang.String path;
        private final java.lang.String port;
        private final java.lang.String protocol;
        private final java.lang.String query;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.statusCode = software.amazon.jsii.Kernel.get(this, "statusCode", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.host = software.amazon.jsii.Kernel.get(this, "host", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.path = software.amazon.jsii.Kernel.get(this, "path", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.port = software.amazon.jsii.Kernel.get(this, "port", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.protocol = software.amazon.jsii.Kernel.get(this, "protocol", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.query = software.amazon.jsii.Kernel.get(this, "query", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.statusCode = java.util.Objects.requireNonNull(builder.statusCode, "statusCode is required");
            this.host = builder.host;
            this.path = builder.path;
            this.port = builder.port;
            this.protocol = builder.protocol;
            this.query = builder.query;
        }

        @Override
        public final java.lang.String getStatusCode() {
            return this.statusCode;
        }

        @Override
        public final java.lang.String getHost() {
            return this.host;
        }

        @Override
        public final java.lang.String getPath() {
            return this.path;
        }

        @Override
        public final java.lang.String getPort() {
            return this.port;
        }

        @Override
        public final java.lang.String getProtocol() {
            return this.protocol;
        }

        @Override
        public final java.lang.String getQuery() {
            return this.query;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("statusCode", om.valueToTree(this.getStatusCode()));
            if (this.getHost() != null) {
                data.set("host", om.valueToTree(this.getHost()));
            }
            if (this.getPath() != null) {
                data.set("path", om.valueToTree(this.getPath()));
            }
            if (this.getPort() != null) {
                data.set("port", om.valueToTree(this.getPort()));
            }
            if (this.getProtocol() != null) {
                data.set("protocol", om.valueToTree(this.getProtocol()));
            }
            if (this.getQuery() != null) {
                data.set("query", om.valueToTree(this.getQuery()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.lbListenerRule.LbListenerRuleActionRedirect"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            LbListenerRuleActionRedirect.Jsii$Proxy that = (LbListenerRuleActionRedirect.Jsii$Proxy) o;

            if (!statusCode.equals(that.statusCode)) return false;
            if (this.host != null ? !this.host.equals(that.host) : that.host != null) return false;
            if (this.path != null ? !this.path.equals(that.path) : that.path != null) return false;
            if (this.port != null ? !this.port.equals(that.port) : that.port != null) return false;
            if (this.protocol != null ? !this.protocol.equals(that.protocol) : that.protocol != null) return false;
            return this.query != null ? this.query.equals(that.query) : that.query == null;
        }

        @Override
        public final int hashCode() {
            int result = this.statusCode.hashCode();
            result = 31 * result + (this.host != null ? this.host.hashCode() : 0);
            result = 31 * result + (this.path != null ? this.path.hashCode() : 0);
            result = 31 * result + (this.port != null ? this.port.hashCode() : 0);
            result = 31 * result + (this.protocol != null ? this.protocol.hashCode() : 0);
            result = 31 * result + (this.query != null ? this.query.hashCode() : 0);
            return result;
        }
    }
}
