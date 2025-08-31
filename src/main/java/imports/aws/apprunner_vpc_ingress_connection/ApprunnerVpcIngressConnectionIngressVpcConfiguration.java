package imports.aws.apprunner_vpc_ingress_connection;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.058Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.apprunnerVpcIngressConnection.ApprunnerVpcIngressConnectionIngressVpcConfiguration")
@software.amazon.jsii.Jsii.Proxy(ApprunnerVpcIngressConnectionIngressVpcConfiguration.Jsii$Proxy.class)
public interface ApprunnerVpcIngressConnectionIngressVpcConfiguration extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apprunner_vpc_ingress_connection#vpc_endpoint_id ApprunnerVpcIngressConnection#vpc_endpoint_id}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getVpcEndpointId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apprunner_vpc_ingress_connection#vpc_id ApprunnerVpcIngressConnection#vpc_id}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getVpcId() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link ApprunnerVpcIngressConnectionIngressVpcConfiguration}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link ApprunnerVpcIngressConnectionIngressVpcConfiguration}
     */
    public static final class Builder implements software.amazon.jsii.Builder<ApprunnerVpcIngressConnectionIngressVpcConfiguration> {
        java.lang.String vpcEndpointId;
        java.lang.String vpcId;

        /**
         * Sets the value of {@link ApprunnerVpcIngressConnectionIngressVpcConfiguration#getVpcEndpointId}
         * @param vpcEndpointId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apprunner_vpc_ingress_connection#vpc_endpoint_id ApprunnerVpcIngressConnection#vpc_endpoint_id}.
         * @return {@code this}
         */
        public Builder vpcEndpointId(java.lang.String vpcEndpointId) {
            this.vpcEndpointId = vpcEndpointId;
            return this;
        }

        /**
         * Sets the value of {@link ApprunnerVpcIngressConnectionIngressVpcConfiguration#getVpcId}
         * @param vpcId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apprunner_vpc_ingress_connection#vpc_id ApprunnerVpcIngressConnection#vpc_id}.
         * @return {@code this}
         */
        public Builder vpcId(java.lang.String vpcId) {
            this.vpcId = vpcId;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link ApprunnerVpcIngressConnectionIngressVpcConfiguration}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public ApprunnerVpcIngressConnectionIngressVpcConfiguration build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link ApprunnerVpcIngressConnectionIngressVpcConfiguration}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements ApprunnerVpcIngressConnectionIngressVpcConfiguration {
        private final java.lang.String vpcEndpointId;
        private final java.lang.String vpcId;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.vpcEndpointId = software.amazon.jsii.Kernel.get(this, "vpcEndpointId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.vpcId = software.amazon.jsii.Kernel.get(this, "vpcId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.vpcEndpointId = builder.vpcEndpointId;
            this.vpcId = builder.vpcId;
        }

        @Override
        public final java.lang.String getVpcEndpointId() {
            return this.vpcEndpointId;
        }

        @Override
        public final java.lang.String getVpcId() {
            return this.vpcId;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getVpcEndpointId() != null) {
                data.set("vpcEndpointId", om.valueToTree(this.getVpcEndpointId()));
            }
            if (this.getVpcId() != null) {
                data.set("vpcId", om.valueToTree(this.getVpcId()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.apprunnerVpcIngressConnection.ApprunnerVpcIngressConnectionIngressVpcConfiguration"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            ApprunnerVpcIngressConnectionIngressVpcConfiguration.Jsii$Proxy that = (ApprunnerVpcIngressConnectionIngressVpcConfiguration.Jsii$Proxy) o;

            if (this.vpcEndpointId != null ? !this.vpcEndpointId.equals(that.vpcEndpointId) : that.vpcEndpointId != null) return false;
            return this.vpcId != null ? this.vpcId.equals(that.vpcId) : that.vpcId == null;
        }

        @Override
        public final int hashCode() {
            int result = this.vpcEndpointId != null ? this.vpcEndpointId.hashCode() : 0;
            result = 31 * result + (this.vpcId != null ? this.vpcId.hashCode() : 0);
            return result;
        }
    }
}
