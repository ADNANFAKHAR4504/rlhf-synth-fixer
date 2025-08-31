package imports.aws.config_configuration_aggregator;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.370Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.configConfigurationAggregator.ConfigConfigurationAggregatorOrganizationAggregationSource")
@software.amazon.jsii.Jsii.Proxy(ConfigConfigurationAggregatorOrganizationAggregationSource.Jsii$Proxy.class)
public interface ConfigConfigurationAggregatorOrganizationAggregationSource extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/config_configuration_aggregator#role_arn ConfigConfigurationAggregator#role_arn}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getRoleArn();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/config_configuration_aggregator#all_regions ConfigConfigurationAggregator#all_regions}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getAllRegions() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/config_configuration_aggregator#regions ConfigConfigurationAggregator#regions}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getRegions() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link ConfigConfigurationAggregatorOrganizationAggregationSource}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link ConfigConfigurationAggregatorOrganizationAggregationSource}
     */
    public static final class Builder implements software.amazon.jsii.Builder<ConfigConfigurationAggregatorOrganizationAggregationSource> {
        java.lang.String roleArn;
        java.lang.Object allRegions;
        java.util.List<java.lang.String> regions;

        /**
         * Sets the value of {@link ConfigConfigurationAggregatorOrganizationAggregationSource#getRoleArn}
         * @param roleArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/config_configuration_aggregator#role_arn ConfigConfigurationAggregator#role_arn}. This parameter is required.
         * @return {@code this}
         */
        public Builder roleArn(java.lang.String roleArn) {
            this.roleArn = roleArn;
            return this;
        }

        /**
         * Sets the value of {@link ConfigConfigurationAggregatorOrganizationAggregationSource#getAllRegions}
         * @param allRegions Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/config_configuration_aggregator#all_regions ConfigConfigurationAggregator#all_regions}.
         * @return {@code this}
         */
        public Builder allRegions(java.lang.Boolean allRegions) {
            this.allRegions = allRegions;
            return this;
        }

        /**
         * Sets the value of {@link ConfigConfigurationAggregatorOrganizationAggregationSource#getAllRegions}
         * @param allRegions Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/config_configuration_aggregator#all_regions ConfigConfigurationAggregator#all_regions}.
         * @return {@code this}
         */
        public Builder allRegions(com.hashicorp.cdktf.IResolvable allRegions) {
            this.allRegions = allRegions;
            return this;
        }

        /**
         * Sets the value of {@link ConfigConfigurationAggregatorOrganizationAggregationSource#getRegions}
         * @param regions Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/config_configuration_aggregator#regions ConfigConfigurationAggregator#regions}.
         * @return {@code this}
         */
        public Builder regions(java.util.List<java.lang.String> regions) {
            this.regions = regions;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link ConfigConfigurationAggregatorOrganizationAggregationSource}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public ConfigConfigurationAggregatorOrganizationAggregationSource build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link ConfigConfigurationAggregatorOrganizationAggregationSource}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements ConfigConfigurationAggregatorOrganizationAggregationSource {
        private final java.lang.String roleArn;
        private final java.lang.Object allRegions;
        private final java.util.List<java.lang.String> regions;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.roleArn = software.amazon.jsii.Kernel.get(this, "roleArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.allRegions = software.amazon.jsii.Kernel.get(this, "allRegions", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.regions = software.amazon.jsii.Kernel.get(this, "regions", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.roleArn = java.util.Objects.requireNonNull(builder.roleArn, "roleArn is required");
            this.allRegions = builder.allRegions;
            this.regions = builder.regions;
        }

        @Override
        public final java.lang.String getRoleArn() {
            return this.roleArn;
        }

        @Override
        public final java.lang.Object getAllRegions() {
            return this.allRegions;
        }

        @Override
        public final java.util.List<java.lang.String> getRegions() {
            return this.regions;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("roleArn", om.valueToTree(this.getRoleArn()));
            if (this.getAllRegions() != null) {
                data.set("allRegions", om.valueToTree(this.getAllRegions()));
            }
            if (this.getRegions() != null) {
                data.set("regions", om.valueToTree(this.getRegions()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.configConfigurationAggregator.ConfigConfigurationAggregatorOrganizationAggregationSource"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            ConfigConfigurationAggregatorOrganizationAggregationSource.Jsii$Proxy that = (ConfigConfigurationAggregatorOrganizationAggregationSource.Jsii$Proxy) o;

            if (!roleArn.equals(that.roleArn)) return false;
            if (this.allRegions != null ? !this.allRegions.equals(that.allRegions) : that.allRegions != null) return false;
            return this.regions != null ? this.regions.equals(that.regions) : that.regions == null;
        }

        @Override
        public final int hashCode() {
            int result = this.roleArn.hashCode();
            result = 31 * result + (this.allRegions != null ? this.allRegions.hashCode() : 0);
            result = 31 * result + (this.regions != null ? this.regions.hashCode() : 0);
            return result;
        }
    }
}
