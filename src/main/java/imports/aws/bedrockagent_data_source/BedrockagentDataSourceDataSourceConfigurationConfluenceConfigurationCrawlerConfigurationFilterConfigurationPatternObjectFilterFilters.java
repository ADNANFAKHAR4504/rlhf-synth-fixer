package imports.aws.bedrockagent_data_source;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.160Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.bedrockagentDataSource.BedrockagentDataSourceDataSourceConfigurationConfluenceConfigurationCrawlerConfigurationFilterConfigurationPatternObjectFilterFilters")
@software.amazon.jsii.Jsii.Proxy(BedrockagentDataSourceDataSourceConfigurationConfluenceConfigurationCrawlerConfigurationFilterConfigurationPatternObjectFilterFilters.Jsii$Proxy.class)
public interface BedrockagentDataSourceDataSourceConfigurationConfluenceConfigurationCrawlerConfigurationFilterConfigurationPatternObjectFilterFilters extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_data_source#object_type BedrockagentDataSource#object_type}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getObjectType();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_data_source#exclusion_filters BedrockagentDataSource#exclusion_filters}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getExclusionFilters() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_data_source#inclusion_filters BedrockagentDataSource#inclusion_filters}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getInclusionFilters() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link BedrockagentDataSourceDataSourceConfigurationConfluenceConfigurationCrawlerConfigurationFilterConfigurationPatternObjectFilterFilters}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link BedrockagentDataSourceDataSourceConfigurationConfluenceConfigurationCrawlerConfigurationFilterConfigurationPatternObjectFilterFilters}
     */
    public static final class Builder implements software.amazon.jsii.Builder<BedrockagentDataSourceDataSourceConfigurationConfluenceConfigurationCrawlerConfigurationFilterConfigurationPatternObjectFilterFilters> {
        java.lang.String objectType;
        java.util.List<java.lang.String> exclusionFilters;
        java.util.List<java.lang.String> inclusionFilters;

        /**
         * Sets the value of {@link BedrockagentDataSourceDataSourceConfigurationConfluenceConfigurationCrawlerConfigurationFilterConfigurationPatternObjectFilterFilters#getObjectType}
         * @param objectType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_data_source#object_type BedrockagentDataSource#object_type}. This parameter is required.
         * @return {@code this}
         */
        public Builder objectType(java.lang.String objectType) {
            this.objectType = objectType;
            return this;
        }

        /**
         * Sets the value of {@link BedrockagentDataSourceDataSourceConfigurationConfluenceConfigurationCrawlerConfigurationFilterConfigurationPatternObjectFilterFilters#getExclusionFilters}
         * @param exclusionFilters Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_data_source#exclusion_filters BedrockagentDataSource#exclusion_filters}.
         * @return {@code this}
         */
        public Builder exclusionFilters(java.util.List<java.lang.String> exclusionFilters) {
            this.exclusionFilters = exclusionFilters;
            return this;
        }

        /**
         * Sets the value of {@link BedrockagentDataSourceDataSourceConfigurationConfluenceConfigurationCrawlerConfigurationFilterConfigurationPatternObjectFilterFilters#getInclusionFilters}
         * @param inclusionFilters Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/bedrockagent_data_source#inclusion_filters BedrockagentDataSource#inclusion_filters}.
         * @return {@code this}
         */
        public Builder inclusionFilters(java.util.List<java.lang.String> inclusionFilters) {
            this.inclusionFilters = inclusionFilters;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link BedrockagentDataSourceDataSourceConfigurationConfluenceConfigurationCrawlerConfigurationFilterConfigurationPatternObjectFilterFilters}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public BedrockagentDataSourceDataSourceConfigurationConfluenceConfigurationCrawlerConfigurationFilterConfigurationPatternObjectFilterFilters build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link BedrockagentDataSourceDataSourceConfigurationConfluenceConfigurationCrawlerConfigurationFilterConfigurationPatternObjectFilterFilters}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements BedrockagentDataSourceDataSourceConfigurationConfluenceConfigurationCrawlerConfigurationFilterConfigurationPatternObjectFilterFilters {
        private final java.lang.String objectType;
        private final java.util.List<java.lang.String> exclusionFilters;
        private final java.util.List<java.lang.String> inclusionFilters;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.objectType = software.amazon.jsii.Kernel.get(this, "objectType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.exclusionFilters = software.amazon.jsii.Kernel.get(this, "exclusionFilters", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.inclusionFilters = software.amazon.jsii.Kernel.get(this, "inclusionFilters", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.objectType = java.util.Objects.requireNonNull(builder.objectType, "objectType is required");
            this.exclusionFilters = builder.exclusionFilters;
            this.inclusionFilters = builder.inclusionFilters;
        }

        @Override
        public final java.lang.String getObjectType() {
            return this.objectType;
        }

        @Override
        public final java.util.List<java.lang.String> getExclusionFilters() {
            return this.exclusionFilters;
        }

        @Override
        public final java.util.List<java.lang.String> getInclusionFilters() {
            return this.inclusionFilters;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("objectType", om.valueToTree(this.getObjectType()));
            if (this.getExclusionFilters() != null) {
                data.set("exclusionFilters", om.valueToTree(this.getExclusionFilters()));
            }
            if (this.getInclusionFilters() != null) {
                data.set("inclusionFilters", om.valueToTree(this.getInclusionFilters()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.bedrockagentDataSource.BedrockagentDataSourceDataSourceConfigurationConfluenceConfigurationCrawlerConfigurationFilterConfigurationPatternObjectFilterFilters"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            BedrockagentDataSourceDataSourceConfigurationConfluenceConfigurationCrawlerConfigurationFilterConfigurationPatternObjectFilterFilters.Jsii$Proxy that = (BedrockagentDataSourceDataSourceConfigurationConfluenceConfigurationCrawlerConfigurationFilterConfigurationPatternObjectFilterFilters.Jsii$Proxy) o;

            if (!objectType.equals(that.objectType)) return false;
            if (this.exclusionFilters != null ? !this.exclusionFilters.equals(that.exclusionFilters) : that.exclusionFilters != null) return false;
            return this.inclusionFilters != null ? this.inclusionFilters.equals(that.inclusionFilters) : that.inclusionFilters == null;
        }

        @Override
        public final int hashCode() {
            int result = this.objectType.hashCode();
            result = 31 * result + (this.exclusionFilters != null ? this.exclusionFilters.hashCode() : 0);
            result = 31 * result + (this.inclusionFilters != null ? this.inclusionFilters.hashCode() : 0);
            return result;
        }
    }
}
