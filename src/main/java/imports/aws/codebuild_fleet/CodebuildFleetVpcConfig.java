package imports.aws.codebuild_fleet;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.299Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.codebuildFleet.CodebuildFleetVpcConfig")
@software.amazon.jsii.Jsii.Proxy(CodebuildFleetVpcConfig.Jsii$Proxy.class)
public interface CodebuildFleetVpcConfig extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codebuild_fleet#security_group_ids CodebuildFleet#security_group_ids}.
     */
    @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getSecurityGroupIds();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codebuild_fleet#subnets CodebuildFleet#subnets}.
     */
    @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getSubnets();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codebuild_fleet#vpc_id CodebuildFleet#vpc_id}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getVpcId();

    /**
     * @return a {@link Builder} of {@link CodebuildFleetVpcConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link CodebuildFleetVpcConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<CodebuildFleetVpcConfig> {
        java.util.List<java.lang.String> securityGroupIds;
        java.util.List<java.lang.String> subnets;
        java.lang.String vpcId;

        /**
         * Sets the value of {@link CodebuildFleetVpcConfig#getSecurityGroupIds}
         * @param securityGroupIds Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codebuild_fleet#security_group_ids CodebuildFleet#security_group_ids}. This parameter is required.
         * @return {@code this}
         */
        public Builder securityGroupIds(java.util.List<java.lang.String> securityGroupIds) {
            this.securityGroupIds = securityGroupIds;
            return this;
        }

        /**
         * Sets the value of {@link CodebuildFleetVpcConfig#getSubnets}
         * @param subnets Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codebuild_fleet#subnets CodebuildFleet#subnets}. This parameter is required.
         * @return {@code this}
         */
        public Builder subnets(java.util.List<java.lang.String> subnets) {
            this.subnets = subnets;
            return this;
        }

        /**
         * Sets the value of {@link CodebuildFleetVpcConfig#getVpcId}
         * @param vpcId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codebuild_fleet#vpc_id CodebuildFleet#vpc_id}. This parameter is required.
         * @return {@code this}
         */
        public Builder vpcId(java.lang.String vpcId) {
            this.vpcId = vpcId;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link CodebuildFleetVpcConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public CodebuildFleetVpcConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link CodebuildFleetVpcConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements CodebuildFleetVpcConfig {
        private final java.util.List<java.lang.String> securityGroupIds;
        private final java.util.List<java.lang.String> subnets;
        private final java.lang.String vpcId;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.securityGroupIds = software.amazon.jsii.Kernel.get(this, "securityGroupIds", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.subnets = software.amazon.jsii.Kernel.get(this, "subnets", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.vpcId = software.amazon.jsii.Kernel.get(this, "vpcId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.securityGroupIds = java.util.Objects.requireNonNull(builder.securityGroupIds, "securityGroupIds is required");
            this.subnets = java.util.Objects.requireNonNull(builder.subnets, "subnets is required");
            this.vpcId = java.util.Objects.requireNonNull(builder.vpcId, "vpcId is required");
        }

        @Override
        public final java.util.List<java.lang.String> getSecurityGroupIds() {
            return this.securityGroupIds;
        }

        @Override
        public final java.util.List<java.lang.String> getSubnets() {
            return this.subnets;
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

            data.set("securityGroupIds", om.valueToTree(this.getSecurityGroupIds()));
            data.set("subnets", om.valueToTree(this.getSubnets()));
            data.set("vpcId", om.valueToTree(this.getVpcId()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.codebuildFleet.CodebuildFleetVpcConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            CodebuildFleetVpcConfig.Jsii$Proxy that = (CodebuildFleetVpcConfig.Jsii$Proxy) o;

            if (!securityGroupIds.equals(that.securityGroupIds)) return false;
            if (!subnets.equals(that.subnets)) return false;
            return this.vpcId.equals(that.vpcId);
        }

        @Override
        public final int hashCode() {
            int result = this.securityGroupIds.hashCode();
            result = 31 * result + (this.subnets.hashCode());
            result = 31 * result + (this.vpcId.hashCode());
            return result;
        }
    }
}
