package imports.aws.ecr_replication_configuration;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.120Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.ecrReplicationConfiguration.EcrReplicationConfigurationReplicationConfiguration")
@software.amazon.jsii.Jsii.Proxy(EcrReplicationConfigurationReplicationConfiguration.Jsii$Proxy.class)
public interface EcrReplicationConfigurationReplicationConfiguration extends software.amazon.jsii.JsiiSerializable {

    /**
     * rule block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecr_replication_configuration#rule EcrReplicationConfiguration#rule}
     */
    @org.jetbrains.annotations.NotNull java.lang.Object getRule();

    /**
     * @return a {@link Builder} of {@link EcrReplicationConfigurationReplicationConfiguration}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link EcrReplicationConfigurationReplicationConfiguration}
     */
    public static final class Builder implements software.amazon.jsii.Builder<EcrReplicationConfigurationReplicationConfiguration> {
        java.lang.Object rule;

        /**
         * Sets the value of {@link EcrReplicationConfigurationReplicationConfiguration#getRule}
         * @param rule rule block. This parameter is required.
         *             Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecr_replication_configuration#rule EcrReplicationConfiguration#rule}
         * @return {@code this}
         */
        public Builder rule(com.hashicorp.cdktf.IResolvable rule) {
            this.rule = rule;
            return this;
        }

        /**
         * Sets the value of {@link EcrReplicationConfigurationReplicationConfiguration#getRule}
         * @param rule rule block. This parameter is required.
         *             Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ecr_replication_configuration#rule EcrReplicationConfiguration#rule}
         * @return {@code this}
         */
        public Builder rule(java.util.List<? extends imports.aws.ecr_replication_configuration.EcrReplicationConfigurationReplicationConfigurationRule> rule) {
            this.rule = rule;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link EcrReplicationConfigurationReplicationConfiguration}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public EcrReplicationConfigurationReplicationConfiguration build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link EcrReplicationConfigurationReplicationConfiguration}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements EcrReplicationConfigurationReplicationConfiguration {
        private final java.lang.Object rule;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.rule = software.amazon.jsii.Kernel.get(this, "rule", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.rule = java.util.Objects.requireNonNull(builder.rule, "rule is required");
        }

        @Override
        public final java.lang.Object getRule() {
            return this.rule;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("rule", om.valueToTree(this.getRule()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.ecrReplicationConfiguration.EcrReplicationConfigurationReplicationConfiguration"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            EcrReplicationConfigurationReplicationConfiguration.Jsii$Proxy that = (EcrReplicationConfigurationReplicationConfiguration.Jsii$Proxy) o;

            return this.rule.equals(that.rule);
        }

        @Override
        public final int hashCode() {
            int result = this.rule.hashCode();
            return result;
        }
    }
}
