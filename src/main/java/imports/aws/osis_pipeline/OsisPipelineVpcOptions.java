package imports.aws.osis_pipeline;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.051Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.osisPipeline.OsisPipelineVpcOptions")
@software.amazon.jsii.Jsii.Proxy(OsisPipelineVpcOptions.Jsii$Proxy.class)
public interface OsisPipelineVpcOptions extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/osis_pipeline#subnet_ids OsisPipeline#subnet_ids}.
     */
    @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getSubnetIds();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/osis_pipeline#security_group_ids OsisPipeline#security_group_ids}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getSecurityGroupIds() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/osis_pipeline#vpc_endpoint_management OsisPipeline#vpc_endpoint_management}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getVpcEndpointManagement() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link OsisPipelineVpcOptions}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link OsisPipelineVpcOptions}
     */
    public static final class Builder implements software.amazon.jsii.Builder<OsisPipelineVpcOptions> {
        java.util.List<java.lang.String> subnetIds;
        java.util.List<java.lang.String> securityGroupIds;
        java.lang.String vpcEndpointManagement;

        /**
         * Sets the value of {@link OsisPipelineVpcOptions#getSubnetIds}
         * @param subnetIds Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/osis_pipeline#subnet_ids OsisPipeline#subnet_ids}. This parameter is required.
         * @return {@code this}
         */
        public Builder subnetIds(java.util.List<java.lang.String> subnetIds) {
            this.subnetIds = subnetIds;
            return this;
        }

        /**
         * Sets the value of {@link OsisPipelineVpcOptions#getSecurityGroupIds}
         * @param securityGroupIds Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/osis_pipeline#security_group_ids OsisPipeline#security_group_ids}.
         * @return {@code this}
         */
        public Builder securityGroupIds(java.util.List<java.lang.String> securityGroupIds) {
            this.securityGroupIds = securityGroupIds;
            return this;
        }

        /**
         * Sets the value of {@link OsisPipelineVpcOptions#getVpcEndpointManagement}
         * @param vpcEndpointManagement Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/osis_pipeline#vpc_endpoint_management OsisPipeline#vpc_endpoint_management}.
         * @return {@code this}
         */
        public Builder vpcEndpointManagement(java.lang.String vpcEndpointManagement) {
            this.vpcEndpointManagement = vpcEndpointManagement;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link OsisPipelineVpcOptions}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public OsisPipelineVpcOptions build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link OsisPipelineVpcOptions}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements OsisPipelineVpcOptions {
        private final java.util.List<java.lang.String> subnetIds;
        private final java.util.List<java.lang.String> securityGroupIds;
        private final java.lang.String vpcEndpointManagement;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.subnetIds = software.amazon.jsii.Kernel.get(this, "subnetIds", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.securityGroupIds = software.amazon.jsii.Kernel.get(this, "securityGroupIds", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.vpcEndpointManagement = software.amazon.jsii.Kernel.get(this, "vpcEndpointManagement", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.subnetIds = java.util.Objects.requireNonNull(builder.subnetIds, "subnetIds is required");
            this.securityGroupIds = builder.securityGroupIds;
            this.vpcEndpointManagement = builder.vpcEndpointManagement;
        }

        @Override
        public final java.util.List<java.lang.String> getSubnetIds() {
            return this.subnetIds;
        }

        @Override
        public final java.util.List<java.lang.String> getSecurityGroupIds() {
            return this.securityGroupIds;
        }

        @Override
        public final java.lang.String getVpcEndpointManagement() {
            return this.vpcEndpointManagement;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("subnetIds", om.valueToTree(this.getSubnetIds()));
            if (this.getSecurityGroupIds() != null) {
                data.set("securityGroupIds", om.valueToTree(this.getSecurityGroupIds()));
            }
            if (this.getVpcEndpointManagement() != null) {
                data.set("vpcEndpointManagement", om.valueToTree(this.getVpcEndpointManagement()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.osisPipeline.OsisPipelineVpcOptions"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            OsisPipelineVpcOptions.Jsii$Proxy that = (OsisPipelineVpcOptions.Jsii$Proxy) o;

            if (!subnetIds.equals(that.subnetIds)) return false;
            if (this.securityGroupIds != null ? !this.securityGroupIds.equals(that.securityGroupIds) : that.securityGroupIds != null) return false;
            return this.vpcEndpointManagement != null ? this.vpcEndpointManagement.equals(that.vpcEndpointManagement) : that.vpcEndpointManagement == null;
        }

        @Override
        public final int hashCode() {
            int result = this.subnetIds.hashCode();
            result = 31 * result + (this.securityGroupIds != null ? this.securityGroupIds.hashCode() : 0);
            result = 31 * result + (this.vpcEndpointManagement != null ? this.vpcEndpointManagement.hashCode() : 0);
            return result;
        }
    }
}
