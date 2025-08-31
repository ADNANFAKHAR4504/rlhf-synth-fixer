package imports.aws.ecr_replication_configuration;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.120Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.ecrReplicationConfiguration.EcrReplicationConfigurationReplicationConfigurationRule")
@software.amazon.jsii.Jsii.Proxy(EcrReplicationConfigurationReplicationConfigurationRule.Jsii$Proxy.class)
public interface EcrReplicationConfigurationReplicationConfigurationRule extends software.amazon.jsii.JsiiSerializable {

    /**
     * destination block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecr_replication_configuration#destination EcrReplicationConfiguration#destination}
     */
    @org.jetbrains.annotations.NotNull java.lang.Object getDestination();

    /**
     * repository_filter block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecr_replication_configuration#repository_filter EcrReplicationConfiguration#repository_filter}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getRepositoryFilter() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link EcrReplicationConfigurationReplicationConfigurationRule}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link EcrReplicationConfigurationReplicationConfigurationRule}
     */
    public static final class Builder implements software.amazon.jsii.Builder<EcrReplicationConfigurationReplicationConfigurationRule> {
        java.lang.Object destination;
        java.lang.Object repositoryFilter;

        /**
         * Sets the value of {@link EcrReplicationConfigurationReplicationConfigurationRule#getDestination}
         * @param destination destination block. This parameter is required.
         *                    Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecr_replication_configuration#destination EcrReplicationConfiguration#destination}
         * @return {@code this}
         */
        public Builder destination(com.hashicorp.cdktf.IResolvable destination) {
            this.destination = destination;
            return this;
        }

        /**
         * Sets the value of {@link EcrReplicationConfigurationReplicationConfigurationRule#getDestination}
         * @param destination destination block. This parameter is required.
         *                    Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecr_replication_configuration#destination EcrReplicationConfiguration#destination}
         * @return {@code this}
         */
        public Builder destination(java.util.List<? extends imports.aws.ecr_replication_configuration.EcrReplicationConfigurationReplicationConfigurationRuleDestination> destination) {
            this.destination = destination;
            return this;
        }

        /**
         * Sets the value of {@link EcrReplicationConfigurationReplicationConfigurationRule#getRepositoryFilter}
         * @param repositoryFilter repository_filter block.
         *                         Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecr_replication_configuration#repository_filter EcrReplicationConfiguration#repository_filter}
         * @return {@code this}
         */
        public Builder repositoryFilter(com.hashicorp.cdktf.IResolvable repositoryFilter) {
            this.repositoryFilter = repositoryFilter;
            return this;
        }

        /**
         * Sets the value of {@link EcrReplicationConfigurationReplicationConfigurationRule#getRepositoryFilter}
         * @param repositoryFilter repository_filter block.
         *                         Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecr_replication_configuration#repository_filter EcrReplicationConfiguration#repository_filter}
         * @return {@code this}
         */
        public Builder repositoryFilter(java.util.List<? extends imports.aws.ecr_replication_configuration.EcrReplicationConfigurationReplicationConfigurationRuleRepositoryFilter> repositoryFilter) {
            this.repositoryFilter = repositoryFilter;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link EcrReplicationConfigurationReplicationConfigurationRule}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public EcrReplicationConfigurationReplicationConfigurationRule build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link EcrReplicationConfigurationReplicationConfigurationRule}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements EcrReplicationConfigurationReplicationConfigurationRule {
        private final java.lang.Object destination;
        private final java.lang.Object repositoryFilter;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.destination = software.amazon.jsii.Kernel.get(this, "destination", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.repositoryFilter = software.amazon.jsii.Kernel.get(this, "repositoryFilter", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.destination = java.util.Objects.requireNonNull(builder.destination, "destination is required");
            this.repositoryFilter = builder.repositoryFilter;
        }

        @Override
        public final java.lang.Object getDestination() {
            return this.destination;
        }

        @Override
        public final java.lang.Object getRepositoryFilter() {
            return this.repositoryFilter;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("destination", om.valueToTree(this.getDestination()));
            if (this.getRepositoryFilter() != null) {
                data.set("repositoryFilter", om.valueToTree(this.getRepositoryFilter()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.ecrReplicationConfiguration.EcrReplicationConfigurationReplicationConfigurationRule"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            EcrReplicationConfigurationReplicationConfigurationRule.Jsii$Proxy that = (EcrReplicationConfigurationReplicationConfigurationRule.Jsii$Proxy) o;

            if (!destination.equals(that.destination)) return false;
            return this.repositoryFilter != null ? this.repositoryFilter.equals(that.repositoryFilter) : that.repositoryFilter == null;
        }

        @Override
        public final int hashCode() {
            int result = this.destination.hashCode();
            result = 31 * result + (this.repositoryFilter != null ? this.repositoryFilter.hashCode() : 0);
            return result;
        }
    }
}
