package imports.aws.config_configuration_aggregator;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.370Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.configConfigurationAggregator.ConfigConfigurationAggregatorAccountAggregationSource")
@software.amazon.jsii.Jsii.Proxy(ConfigConfigurationAggregatorAccountAggregationSource.Jsii$Proxy.class)
public interface ConfigConfigurationAggregatorAccountAggregationSource extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/config_configuration_aggregator#account_ids ConfigConfigurationAggregator#account_ids}.
     */
    @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getAccountIds();

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
     * @return a {@link Builder} of {@link ConfigConfigurationAggregatorAccountAggregationSource}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link ConfigConfigurationAggregatorAccountAggregationSource}
     */
    public static final class Builder implements software.amazon.jsii.Builder<ConfigConfigurationAggregatorAccountAggregationSource> {
        java.util.List<java.lang.String> accountIds;
        java.lang.Object allRegions;
        java.util.List<java.lang.String> regions;

        /**
         * Sets the value of {@link ConfigConfigurationAggregatorAccountAggregationSource#getAccountIds}
         * @param accountIds Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/config_configuration_aggregator#account_ids ConfigConfigurationAggregator#account_ids}. This parameter is required.
         * @return {@code this}
         */
        public Builder accountIds(java.util.List<java.lang.String> accountIds) {
            this.accountIds = accountIds;
            return this;
        }

        /**
         * Sets the value of {@link ConfigConfigurationAggregatorAccountAggregationSource#getAllRegions}
         * @param allRegions Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/config_configuration_aggregator#all_regions ConfigConfigurationAggregator#all_regions}.
         * @return {@code this}
         */
        public Builder allRegions(java.lang.Boolean allRegions) {
            this.allRegions = allRegions;
            return this;
        }

        /**
         * Sets the value of {@link ConfigConfigurationAggregatorAccountAggregationSource#getAllRegions}
         * @param allRegions Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/config_configuration_aggregator#all_regions ConfigConfigurationAggregator#all_regions}.
         * @return {@code this}
         */
        public Builder allRegions(com.hashicorp.cdktf.IResolvable allRegions) {
            this.allRegions = allRegions;
            return this;
        }

        /**
         * Sets the value of {@link ConfigConfigurationAggregatorAccountAggregationSource#getRegions}
         * @param regions Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/config_configuration_aggregator#regions ConfigConfigurationAggregator#regions}.
         * @return {@code this}
         */
        public Builder regions(java.util.List<java.lang.String> regions) {
            this.regions = regions;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link ConfigConfigurationAggregatorAccountAggregationSource}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public ConfigConfigurationAggregatorAccountAggregationSource build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link ConfigConfigurationAggregatorAccountAggregationSource}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements ConfigConfigurationAggregatorAccountAggregationSource {
        private final java.util.List<java.lang.String> accountIds;
        private final java.lang.Object allRegions;
        private final java.util.List<java.lang.String> regions;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.accountIds = software.amazon.jsii.Kernel.get(this, "accountIds", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.allRegions = software.amazon.jsii.Kernel.get(this, "allRegions", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.regions = software.amazon.jsii.Kernel.get(this, "regions", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.accountIds = java.util.Objects.requireNonNull(builder.accountIds, "accountIds is required");
            this.allRegions = builder.allRegions;
            this.regions = builder.regions;
        }

        @Override
        public final java.util.List<java.lang.String> getAccountIds() {
            return this.accountIds;
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

            data.set("accountIds", om.valueToTree(this.getAccountIds()));
            if (this.getAllRegions() != null) {
                data.set("allRegions", om.valueToTree(this.getAllRegions()));
            }
            if (this.getRegions() != null) {
                data.set("regions", om.valueToTree(this.getRegions()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.configConfigurationAggregator.ConfigConfigurationAggregatorAccountAggregationSource"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            ConfigConfigurationAggregatorAccountAggregationSource.Jsii$Proxy that = (ConfigConfigurationAggregatorAccountAggregationSource.Jsii$Proxy) o;

            if (!accountIds.equals(that.accountIds)) return false;
            if (this.allRegions != null ? !this.allRegions.equals(that.allRegions) : that.allRegions != null) return false;
            return this.regions != null ? this.regions.equals(that.regions) : that.regions == null;
        }

        @Override
        public final int hashCode() {
            int result = this.accountIds.hashCode();
            result = 31 * result + (this.allRegions != null ? this.allRegions.hashCode() : 0);
            result = 31 * result + (this.regions != null ? this.regions.hashCode() : 0);
            return result;
        }
    }
}
