package imports.aws.devicefarm_test_grid_project;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.992Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.devicefarmTestGridProject.DevicefarmTestGridProjectVpcConfig")
@software.amazon.jsii.Jsii.Proxy(DevicefarmTestGridProjectVpcConfig.Jsii$Proxy.class)
public interface DevicefarmTestGridProjectVpcConfig extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/devicefarm_test_grid_project#security_group_ids DevicefarmTestGridProject#security_group_ids}.
     */
    @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getSecurityGroupIds();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/devicefarm_test_grid_project#subnet_ids DevicefarmTestGridProject#subnet_ids}.
     */
    @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getSubnetIds();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/devicefarm_test_grid_project#vpc_id DevicefarmTestGridProject#vpc_id}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getVpcId();

    /**
     * @return a {@link Builder} of {@link DevicefarmTestGridProjectVpcConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link DevicefarmTestGridProjectVpcConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<DevicefarmTestGridProjectVpcConfig> {
        java.util.List<java.lang.String> securityGroupIds;
        java.util.List<java.lang.String> subnetIds;
        java.lang.String vpcId;

        /**
         * Sets the value of {@link DevicefarmTestGridProjectVpcConfig#getSecurityGroupIds}
         * @param securityGroupIds Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/devicefarm_test_grid_project#security_group_ids DevicefarmTestGridProject#security_group_ids}. This parameter is required.
         * @return {@code this}
         */
        public Builder securityGroupIds(java.util.List<java.lang.String> securityGroupIds) {
            this.securityGroupIds = securityGroupIds;
            return this;
        }

        /**
         * Sets the value of {@link DevicefarmTestGridProjectVpcConfig#getSubnetIds}
         * @param subnetIds Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/devicefarm_test_grid_project#subnet_ids DevicefarmTestGridProject#subnet_ids}. This parameter is required.
         * @return {@code this}
         */
        public Builder subnetIds(java.util.List<java.lang.String> subnetIds) {
            this.subnetIds = subnetIds;
            return this;
        }

        /**
         * Sets the value of {@link DevicefarmTestGridProjectVpcConfig#getVpcId}
         * @param vpcId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/devicefarm_test_grid_project#vpc_id DevicefarmTestGridProject#vpc_id}. This parameter is required.
         * @return {@code this}
         */
        public Builder vpcId(java.lang.String vpcId) {
            this.vpcId = vpcId;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link DevicefarmTestGridProjectVpcConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public DevicefarmTestGridProjectVpcConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link DevicefarmTestGridProjectVpcConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements DevicefarmTestGridProjectVpcConfig {
        private final java.util.List<java.lang.String> securityGroupIds;
        private final java.util.List<java.lang.String> subnetIds;
        private final java.lang.String vpcId;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.securityGroupIds = software.amazon.jsii.Kernel.get(this, "securityGroupIds", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.subnetIds = software.amazon.jsii.Kernel.get(this, "subnetIds", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.vpcId = software.amazon.jsii.Kernel.get(this, "vpcId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.securityGroupIds = java.util.Objects.requireNonNull(builder.securityGroupIds, "securityGroupIds is required");
            this.subnetIds = java.util.Objects.requireNonNull(builder.subnetIds, "subnetIds is required");
            this.vpcId = java.util.Objects.requireNonNull(builder.vpcId, "vpcId is required");
        }

        @Override
        public final java.util.List<java.lang.String> getSecurityGroupIds() {
            return this.securityGroupIds;
        }

        @Override
        public final java.util.List<java.lang.String> getSubnetIds() {
            return this.subnetIds;
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
            data.set("subnetIds", om.valueToTree(this.getSubnetIds()));
            data.set("vpcId", om.valueToTree(this.getVpcId()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.devicefarmTestGridProject.DevicefarmTestGridProjectVpcConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            DevicefarmTestGridProjectVpcConfig.Jsii$Proxy that = (DevicefarmTestGridProjectVpcConfig.Jsii$Proxy) o;

            if (!securityGroupIds.equals(that.securityGroupIds)) return false;
            if (!subnetIds.equals(that.subnetIds)) return false;
            return this.vpcId.equals(that.vpcId);
        }

        @Override
        public final int hashCode() {
            int result = this.securityGroupIds.hashCode();
            result = 31 * result + (this.subnetIds.hashCode());
            result = 31 * result + (this.vpcId.hashCode());
            return result;
        }
    }
}
