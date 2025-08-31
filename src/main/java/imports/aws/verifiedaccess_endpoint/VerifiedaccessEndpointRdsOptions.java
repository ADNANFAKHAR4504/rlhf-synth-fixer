package imports.aws.verifiedaccess_endpoint;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.573Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.verifiedaccessEndpoint.VerifiedaccessEndpointRdsOptions")
@software.amazon.jsii.Jsii.Proxy(VerifiedaccessEndpointRdsOptions.Jsii$Proxy.class)
public interface VerifiedaccessEndpointRdsOptions extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/verifiedaccess_endpoint#port VerifiedaccessEndpoint#port}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getPort() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/verifiedaccess_endpoint#protocol VerifiedaccessEndpoint#protocol}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getProtocol() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/verifiedaccess_endpoint#rds_db_cluster_arn VerifiedaccessEndpoint#rds_db_cluster_arn}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getRdsDbClusterArn() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/verifiedaccess_endpoint#rds_db_instance_arn VerifiedaccessEndpoint#rds_db_instance_arn}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getRdsDbInstanceArn() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/verifiedaccess_endpoint#rds_db_proxy_arn VerifiedaccessEndpoint#rds_db_proxy_arn}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getRdsDbProxyArn() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/verifiedaccess_endpoint#rds_endpoint VerifiedaccessEndpoint#rds_endpoint}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getRdsEndpoint() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/verifiedaccess_endpoint#subnet_ids VerifiedaccessEndpoint#subnet_ids}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getSubnetIds() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link VerifiedaccessEndpointRdsOptions}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link VerifiedaccessEndpointRdsOptions}
     */
    public static final class Builder implements software.amazon.jsii.Builder<VerifiedaccessEndpointRdsOptions> {
        java.lang.Number port;
        java.lang.String protocol;
        java.lang.String rdsDbClusterArn;
        java.lang.String rdsDbInstanceArn;
        java.lang.String rdsDbProxyArn;
        java.lang.String rdsEndpoint;
        java.util.List<java.lang.String> subnetIds;

        /**
         * Sets the value of {@link VerifiedaccessEndpointRdsOptions#getPort}
         * @param port Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/verifiedaccess_endpoint#port VerifiedaccessEndpoint#port}.
         * @return {@code this}
         */
        public Builder port(java.lang.Number port) {
            this.port = port;
            return this;
        }

        /**
         * Sets the value of {@link VerifiedaccessEndpointRdsOptions#getProtocol}
         * @param protocol Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/verifiedaccess_endpoint#protocol VerifiedaccessEndpoint#protocol}.
         * @return {@code this}
         */
        public Builder protocol(java.lang.String protocol) {
            this.protocol = protocol;
            return this;
        }

        /**
         * Sets the value of {@link VerifiedaccessEndpointRdsOptions#getRdsDbClusterArn}
         * @param rdsDbClusterArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/verifiedaccess_endpoint#rds_db_cluster_arn VerifiedaccessEndpoint#rds_db_cluster_arn}.
         * @return {@code this}
         */
        public Builder rdsDbClusterArn(java.lang.String rdsDbClusterArn) {
            this.rdsDbClusterArn = rdsDbClusterArn;
            return this;
        }

        /**
         * Sets the value of {@link VerifiedaccessEndpointRdsOptions#getRdsDbInstanceArn}
         * @param rdsDbInstanceArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/verifiedaccess_endpoint#rds_db_instance_arn VerifiedaccessEndpoint#rds_db_instance_arn}.
         * @return {@code this}
         */
        public Builder rdsDbInstanceArn(java.lang.String rdsDbInstanceArn) {
            this.rdsDbInstanceArn = rdsDbInstanceArn;
            return this;
        }

        /**
         * Sets the value of {@link VerifiedaccessEndpointRdsOptions#getRdsDbProxyArn}
         * @param rdsDbProxyArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/verifiedaccess_endpoint#rds_db_proxy_arn VerifiedaccessEndpoint#rds_db_proxy_arn}.
         * @return {@code this}
         */
        public Builder rdsDbProxyArn(java.lang.String rdsDbProxyArn) {
            this.rdsDbProxyArn = rdsDbProxyArn;
            return this;
        }

        /**
         * Sets the value of {@link VerifiedaccessEndpointRdsOptions#getRdsEndpoint}
         * @param rdsEndpoint Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/verifiedaccess_endpoint#rds_endpoint VerifiedaccessEndpoint#rds_endpoint}.
         * @return {@code this}
         */
        public Builder rdsEndpoint(java.lang.String rdsEndpoint) {
            this.rdsEndpoint = rdsEndpoint;
            return this;
        }

        /**
         * Sets the value of {@link VerifiedaccessEndpointRdsOptions#getSubnetIds}
         * @param subnetIds Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/verifiedaccess_endpoint#subnet_ids VerifiedaccessEndpoint#subnet_ids}.
         * @return {@code this}
         */
        public Builder subnetIds(java.util.List<java.lang.String> subnetIds) {
            this.subnetIds = subnetIds;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link VerifiedaccessEndpointRdsOptions}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public VerifiedaccessEndpointRdsOptions build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link VerifiedaccessEndpointRdsOptions}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements VerifiedaccessEndpointRdsOptions {
        private final java.lang.Number port;
        private final java.lang.String protocol;
        private final java.lang.String rdsDbClusterArn;
        private final java.lang.String rdsDbInstanceArn;
        private final java.lang.String rdsDbProxyArn;
        private final java.lang.String rdsEndpoint;
        private final java.util.List<java.lang.String> subnetIds;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.port = software.amazon.jsii.Kernel.get(this, "port", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.protocol = software.amazon.jsii.Kernel.get(this, "protocol", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.rdsDbClusterArn = software.amazon.jsii.Kernel.get(this, "rdsDbClusterArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.rdsDbInstanceArn = software.amazon.jsii.Kernel.get(this, "rdsDbInstanceArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.rdsDbProxyArn = software.amazon.jsii.Kernel.get(this, "rdsDbProxyArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.rdsEndpoint = software.amazon.jsii.Kernel.get(this, "rdsEndpoint", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.subnetIds = software.amazon.jsii.Kernel.get(this, "subnetIds", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.port = builder.port;
            this.protocol = builder.protocol;
            this.rdsDbClusterArn = builder.rdsDbClusterArn;
            this.rdsDbInstanceArn = builder.rdsDbInstanceArn;
            this.rdsDbProxyArn = builder.rdsDbProxyArn;
            this.rdsEndpoint = builder.rdsEndpoint;
            this.subnetIds = builder.subnetIds;
        }

        @Override
        public final java.lang.Number getPort() {
            return this.port;
        }

        @Override
        public final java.lang.String getProtocol() {
            return this.protocol;
        }

        @Override
        public final java.lang.String getRdsDbClusterArn() {
            return this.rdsDbClusterArn;
        }

        @Override
        public final java.lang.String getRdsDbInstanceArn() {
            return this.rdsDbInstanceArn;
        }

        @Override
        public final java.lang.String getRdsDbProxyArn() {
            return this.rdsDbProxyArn;
        }

        @Override
        public final java.lang.String getRdsEndpoint() {
            return this.rdsEndpoint;
        }

        @Override
        public final java.util.List<java.lang.String> getSubnetIds() {
            return this.subnetIds;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getPort() != null) {
                data.set("port", om.valueToTree(this.getPort()));
            }
            if (this.getProtocol() != null) {
                data.set("protocol", om.valueToTree(this.getProtocol()));
            }
            if (this.getRdsDbClusterArn() != null) {
                data.set("rdsDbClusterArn", om.valueToTree(this.getRdsDbClusterArn()));
            }
            if (this.getRdsDbInstanceArn() != null) {
                data.set("rdsDbInstanceArn", om.valueToTree(this.getRdsDbInstanceArn()));
            }
            if (this.getRdsDbProxyArn() != null) {
                data.set("rdsDbProxyArn", om.valueToTree(this.getRdsDbProxyArn()));
            }
            if (this.getRdsEndpoint() != null) {
                data.set("rdsEndpoint", om.valueToTree(this.getRdsEndpoint()));
            }
            if (this.getSubnetIds() != null) {
                data.set("subnetIds", om.valueToTree(this.getSubnetIds()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.verifiedaccessEndpoint.VerifiedaccessEndpointRdsOptions"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            VerifiedaccessEndpointRdsOptions.Jsii$Proxy that = (VerifiedaccessEndpointRdsOptions.Jsii$Proxy) o;

            if (this.port != null ? !this.port.equals(that.port) : that.port != null) return false;
            if (this.protocol != null ? !this.protocol.equals(that.protocol) : that.protocol != null) return false;
            if (this.rdsDbClusterArn != null ? !this.rdsDbClusterArn.equals(that.rdsDbClusterArn) : that.rdsDbClusterArn != null) return false;
            if (this.rdsDbInstanceArn != null ? !this.rdsDbInstanceArn.equals(that.rdsDbInstanceArn) : that.rdsDbInstanceArn != null) return false;
            if (this.rdsDbProxyArn != null ? !this.rdsDbProxyArn.equals(that.rdsDbProxyArn) : that.rdsDbProxyArn != null) return false;
            if (this.rdsEndpoint != null ? !this.rdsEndpoint.equals(that.rdsEndpoint) : that.rdsEndpoint != null) return false;
            return this.subnetIds != null ? this.subnetIds.equals(that.subnetIds) : that.subnetIds == null;
        }

        @Override
        public final int hashCode() {
            int result = this.port != null ? this.port.hashCode() : 0;
            result = 31 * result + (this.protocol != null ? this.protocol.hashCode() : 0);
            result = 31 * result + (this.rdsDbClusterArn != null ? this.rdsDbClusterArn.hashCode() : 0);
            result = 31 * result + (this.rdsDbInstanceArn != null ? this.rdsDbInstanceArn.hashCode() : 0);
            result = 31 * result + (this.rdsDbProxyArn != null ? this.rdsDbProxyArn.hashCode() : 0);
            result = 31 * result + (this.rdsEndpoint != null ? this.rdsEndpoint.hashCode() : 0);
            result = 31 * result + (this.subnetIds != null ? this.subnetIds.hashCode() : 0);
            return result;
        }
    }
}
