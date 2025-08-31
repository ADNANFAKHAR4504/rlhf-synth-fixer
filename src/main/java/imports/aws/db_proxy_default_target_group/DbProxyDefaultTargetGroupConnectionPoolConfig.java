package imports.aws.db_proxy_default_target_group;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.974Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.dbProxyDefaultTargetGroup.DbProxyDefaultTargetGroupConnectionPoolConfig")
@software.amazon.jsii.Jsii.Proxy(DbProxyDefaultTargetGroupConnectionPoolConfig.Jsii$Proxy.class)
public interface DbProxyDefaultTargetGroupConnectionPoolConfig extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/db_proxy_default_target_group#connection_borrow_timeout DbProxyDefaultTargetGroup#connection_borrow_timeout}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getConnectionBorrowTimeout() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/db_proxy_default_target_group#init_query DbProxyDefaultTargetGroup#init_query}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getInitQuery() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/db_proxy_default_target_group#max_connections_percent DbProxyDefaultTargetGroup#max_connections_percent}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getMaxConnectionsPercent() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/db_proxy_default_target_group#max_idle_connections_percent DbProxyDefaultTargetGroup#max_idle_connections_percent}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getMaxIdleConnectionsPercent() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/db_proxy_default_target_group#session_pinning_filters DbProxyDefaultTargetGroup#session_pinning_filters}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getSessionPinningFilters() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link DbProxyDefaultTargetGroupConnectionPoolConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link DbProxyDefaultTargetGroupConnectionPoolConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<DbProxyDefaultTargetGroupConnectionPoolConfig> {
        java.lang.Number connectionBorrowTimeout;
        java.lang.String initQuery;
        java.lang.Number maxConnectionsPercent;
        java.lang.Number maxIdleConnectionsPercent;
        java.util.List<java.lang.String> sessionPinningFilters;

        /**
         * Sets the value of {@link DbProxyDefaultTargetGroupConnectionPoolConfig#getConnectionBorrowTimeout}
         * @param connectionBorrowTimeout Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/db_proxy_default_target_group#connection_borrow_timeout DbProxyDefaultTargetGroup#connection_borrow_timeout}.
         * @return {@code this}
         */
        public Builder connectionBorrowTimeout(java.lang.Number connectionBorrowTimeout) {
            this.connectionBorrowTimeout = connectionBorrowTimeout;
            return this;
        }

        /**
         * Sets the value of {@link DbProxyDefaultTargetGroupConnectionPoolConfig#getInitQuery}
         * @param initQuery Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/db_proxy_default_target_group#init_query DbProxyDefaultTargetGroup#init_query}.
         * @return {@code this}
         */
        public Builder initQuery(java.lang.String initQuery) {
            this.initQuery = initQuery;
            return this;
        }

        /**
         * Sets the value of {@link DbProxyDefaultTargetGroupConnectionPoolConfig#getMaxConnectionsPercent}
         * @param maxConnectionsPercent Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/db_proxy_default_target_group#max_connections_percent DbProxyDefaultTargetGroup#max_connections_percent}.
         * @return {@code this}
         */
        public Builder maxConnectionsPercent(java.lang.Number maxConnectionsPercent) {
            this.maxConnectionsPercent = maxConnectionsPercent;
            return this;
        }

        /**
         * Sets the value of {@link DbProxyDefaultTargetGroupConnectionPoolConfig#getMaxIdleConnectionsPercent}
         * @param maxIdleConnectionsPercent Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/db_proxy_default_target_group#max_idle_connections_percent DbProxyDefaultTargetGroup#max_idle_connections_percent}.
         * @return {@code this}
         */
        public Builder maxIdleConnectionsPercent(java.lang.Number maxIdleConnectionsPercent) {
            this.maxIdleConnectionsPercent = maxIdleConnectionsPercent;
            return this;
        }

        /**
         * Sets the value of {@link DbProxyDefaultTargetGroupConnectionPoolConfig#getSessionPinningFilters}
         * @param sessionPinningFilters Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/db_proxy_default_target_group#session_pinning_filters DbProxyDefaultTargetGroup#session_pinning_filters}.
         * @return {@code this}
         */
        public Builder sessionPinningFilters(java.util.List<java.lang.String> sessionPinningFilters) {
            this.sessionPinningFilters = sessionPinningFilters;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link DbProxyDefaultTargetGroupConnectionPoolConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public DbProxyDefaultTargetGroupConnectionPoolConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link DbProxyDefaultTargetGroupConnectionPoolConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements DbProxyDefaultTargetGroupConnectionPoolConfig {
        private final java.lang.Number connectionBorrowTimeout;
        private final java.lang.String initQuery;
        private final java.lang.Number maxConnectionsPercent;
        private final java.lang.Number maxIdleConnectionsPercent;
        private final java.util.List<java.lang.String> sessionPinningFilters;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.connectionBorrowTimeout = software.amazon.jsii.Kernel.get(this, "connectionBorrowTimeout", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.initQuery = software.amazon.jsii.Kernel.get(this, "initQuery", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.maxConnectionsPercent = software.amazon.jsii.Kernel.get(this, "maxConnectionsPercent", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.maxIdleConnectionsPercent = software.amazon.jsii.Kernel.get(this, "maxIdleConnectionsPercent", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.sessionPinningFilters = software.amazon.jsii.Kernel.get(this, "sessionPinningFilters", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.connectionBorrowTimeout = builder.connectionBorrowTimeout;
            this.initQuery = builder.initQuery;
            this.maxConnectionsPercent = builder.maxConnectionsPercent;
            this.maxIdleConnectionsPercent = builder.maxIdleConnectionsPercent;
            this.sessionPinningFilters = builder.sessionPinningFilters;
        }

        @Override
        public final java.lang.Number getConnectionBorrowTimeout() {
            return this.connectionBorrowTimeout;
        }

        @Override
        public final java.lang.String getInitQuery() {
            return this.initQuery;
        }

        @Override
        public final java.lang.Number getMaxConnectionsPercent() {
            return this.maxConnectionsPercent;
        }

        @Override
        public final java.lang.Number getMaxIdleConnectionsPercent() {
            return this.maxIdleConnectionsPercent;
        }

        @Override
        public final java.util.List<java.lang.String> getSessionPinningFilters() {
            return this.sessionPinningFilters;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getConnectionBorrowTimeout() != null) {
                data.set("connectionBorrowTimeout", om.valueToTree(this.getConnectionBorrowTimeout()));
            }
            if (this.getInitQuery() != null) {
                data.set("initQuery", om.valueToTree(this.getInitQuery()));
            }
            if (this.getMaxConnectionsPercent() != null) {
                data.set("maxConnectionsPercent", om.valueToTree(this.getMaxConnectionsPercent()));
            }
            if (this.getMaxIdleConnectionsPercent() != null) {
                data.set("maxIdleConnectionsPercent", om.valueToTree(this.getMaxIdleConnectionsPercent()));
            }
            if (this.getSessionPinningFilters() != null) {
                data.set("sessionPinningFilters", om.valueToTree(this.getSessionPinningFilters()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.dbProxyDefaultTargetGroup.DbProxyDefaultTargetGroupConnectionPoolConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            DbProxyDefaultTargetGroupConnectionPoolConfig.Jsii$Proxy that = (DbProxyDefaultTargetGroupConnectionPoolConfig.Jsii$Proxy) o;

            if (this.connectionBorrowTimeout != null ? !this.connectionBorrowTimeout.equals(that.connectionBorrowTimeout) : that.connectionBorrowTimeout != null) return false;
            if (this.initQuery != null ? !this.initQuery.equals(that.initQuery) : that.initQuery != null) return false;
            if (this.maxConnectionsPercent != null ? !this.maxConnectionsPercent.equals(that.maxConnectionsPercent) : that.maxConnectionsPercent != null) return false;
            if (this.maxIdleConnectionsPercent != null ? !this.maxIdleConnectionsPercent.equals(that.maxIdleConnectionsPercent) : that.maxIdleConnectionsPercent != null) return false;
            return this.sessionPinningFilters != null ? this.sessionPinningFilters.equals(that.sessionPinningFilters) : that.sessionPinningFilters == null;
        }

        @Override
        public final int hashCode() {
            int result = this.connectionBorrowTimeout != null ? this.connectionBorrowTimeout.hashCode() : 0;
            result = 31 * result + (this.initQuery != null ? this.initQuery.hashCode() : 0);
            result = 31 * result + (this.maxConnectionsPercent != null ? this.maxConnectionsPercent.hashCode() : 0);
            result = 31 * result + (this.maxIdleConnectionsPercent != null ? this.maxIdleConnectionsPercent.hashCode() : 0);
            result = 31 * result + (this.sessionPinningFilters != null ? this.sessionPinningFilters.hashCode() : 0);
            return result;
        }
    }
}
