package imports.aws.msk_replicator;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.912Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.mskReplicator.MskReplicatorKafkaClusterVpcConfig")
@software.amazon.jsii.Jsii.Proxy(MskReplicatorKafkaClusterVpcConfig.Jsii$Proxy.class)
public interface MskReplicatorKafkaClusterVpcConfig extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/msk_replicator#subnet_ids MskReplicator#subnet_ids}.
     */
    @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getSubnetIds();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/msk_replicator#security_groups_ids MskReplicator#security_groups_ids}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getSecurityGroupsIds() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link MskReplicatorKafkaClusterVpcConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link MskReplicatorKafkaClusterVpcConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<MskReplicatorKafkaClusterVpcConfig> {
        java.util.List<java.lang.String> subnetIds;
        java.util.List<java.lang.String> securityGroupsIds;

        /**
         * Sets the value of {@link MskReplicatorKafkaClusterVpcConfig#getSubnetIds}
         * @param subnetIds Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/msk_replicator#subnet_ids MskReplicator#subnet_ids}. This parameter is required.
         * @return {@code this}
         */
        public Builder subnetIds(java.util.List<java.lang.String> subnetIds) {
            this.subnetIds = subnetIds;
            return this;
        }

        /**
         * Sets the value of {@link MskReplicatorKafkaClusterVpcConfig#getSecurityGroupsIds}
         * @param securityGroupsIds Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/msk_replicator#security_groups_ids MskReplicator#security_groups_ids}.
         * @return {@code this}
         */
        public Builder securityGroupsIds(java.util.List<java.lang.String> securityGroupsIds) {
            this.securityGroupsIds = securityGroupsIds;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link MskReplicatorKafkaClusterVpcConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public MskReplicatorKafkaClusterVpcConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link MskReplicatorKafkaClusterVpcConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements MskReplicatorKafkaClusterVpcConfig {
        private final java.util.List<java.lang.String> subnetIds;
        private final java.util.List<java.lang.String> securityGroupsIds;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.subnetIds = software.amazon.jsii.Kernel.get(this, "subnetIds", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.securityGroupsIds = software.amazon.jsii.Kernel.get(this, "securityGroupsIds", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.subnetIds = java.util.Objects.requireNonNull(builder.subnetIds, "subnetIds is required");
            this.securityGroupsIds = builder.securityGroupsIds;
        }

        @Override
        public final java.util.List<java.lang.String> getSubnetIds() {
            return this.subnetIds;
        }

        @Override
        public final java.util.List<java.lang.String> getSecurityGroupsIds() {
            return this.securityGroupsIds;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("subnetIds", om.valueToTree(this.getSubnetIds()));
            if (this.getSecurityGroupsIds() != null) {
                data.set("securityGroupsIds", om.valueToTree(this.getSecurityGroupsIds()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.mskReplicator.MskReplicatorKafkaClusterVpcConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            MskReplicatorKafkaClusterVpcConfig.Jsii$Proxy that = (MskReplicatorKafkaClusterVpcConfig.Jsii$Proxy) o;

            if (!subnetIds.equals(that.subnetIds)) return false;
            return this.securityGroupsIds != null ? this.securityGroupsIds.equals(that.securityGroupsIds) : that.securityGroupsIds == null;
        }

        @Override
        public final int hashCode() {
            int result = this.subnetIds.hashCode();
            result = 31 * result + (this.securityGroupsIds != null ? this.securityGroupsIds.hashCode() : 0);
            return result;
        }
    }
}
