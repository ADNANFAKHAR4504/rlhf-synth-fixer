package imports.aws.ecr_replication_configuration;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.120Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.ecrReplicationConfiguration.EcrReplicationConfigurationReplicationConfigurationRuleDestination")
@software.amazon.jsii.Jsii.Proxy(EcrReplicationConfigurationReplicationConfigurationRuleDestination.Jsii$Proxy.class)
public interface EcrReplicationConfigurationReplicationConfigurationRuleDestination extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecr_replication_configuration#region EcrReplicationConfiguration#region}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getRegion();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecr_replication_configuration#registry_id EcrReplicationConfiguration#registry_id}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getRegistryId();

    /**
     * @return a {@link Builder} of {@link EcrReplicationConfigurationReplicationConfigurationRuleDestination}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link EcrReplicationConfigurationReplicationConfigurationRuleDestination}
     */
    public static final class Builder implements software.amazon.jsii.Builder<EcrReplicationConfigurationReplicationConfigurationRuleDestination> {
        java.lang.String region;
        java.lang.String registryId;

        /**
         * Sets the value of {@link EcrReplicationConfigurationReplicationConfigurationRuleDestination#getRegion}
         * @param region Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecr_replication_configuration#region EcrReplicationConfiguration#region}. This parameter is required.
         * @return {@code this}
         */
        public Builder region(java.lang.String region) {
            this.region = region;
            return this;
        }

        /**
         * Sets the value of {@link EcrReplicationConfigurationReplicationConfigurationRuleDestination#getRegistryId}
         * @param registryId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecr_replication_configuration#registry_id EcrReplicationConfiguration#registry_id}. This parameter is required.
         * @return {@code this}
         */
        public Builder registryId(java.lang.String registryId) {
            this.registryId = registryId;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link EcrReplicationConfigurationReplicationConfigurationRuleDestination}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public EcrReplicationConfigurationReplicationConfigurationRuleDestination build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link EcrReplicationConfigurationReplicationConfigurationRuleDestination}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements EcrReplicationConfigurationReplicationConfigurationRuleDestination {
        private final java.lang.String region;
        private final java.lang.String registryId;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.region = software.amazon.jsii.Kernel.get(this, "region", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.registryId = software.amazon.jsii.Kernel.get(this, "registryId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.region = java.util.Objects.requireNonNull(builder.region, "region is required");
            this.registryId = java.util.Objects.requireNonNull(builder.registryId, "registryId is required");
        }

        @Override
        public final java.lang.String getRegion() {
            return this.region;
        }

        @Override
        public final java.lang.String getRegistryId() {
            return this.registryId;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("region", om.valueToTree(this.getRegion()));
            data.set("registryId", om.valueToTree(this.getRegistryId()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.ecrReplicationConfiguration.EcrReplicationConfigurationReplicationConfigurationRuleDestination"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            EcrReplicationConfigurationReplicationConfigurationRuleDestination.Jsii$Proxy that = (EcrReplicationConfigurationReplicationConfigurationRuleDestination.Jsii$Proxy) o;

            if (!region.equals(that.region)) return false;
            return this.registryId.equals(that.registryId);
        }

        @Override
        public final int hashCode() {
            int result = this.region.hashCode();
            result = 31 * result + (this.registryId.hashCode());
            return result;
        }
    }
}
