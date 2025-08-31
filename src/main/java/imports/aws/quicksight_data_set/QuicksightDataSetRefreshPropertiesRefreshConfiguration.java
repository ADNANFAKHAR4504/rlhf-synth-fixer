package imports.aws.quicksight_data_set;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.113Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.quicksightDataSet.QuicksightDataSetRefreshPropertiesRefreshConfiguration")
@software.amazon.jsii.Jsii.Proxy(QuicksightDataSetRefreshPropertiesRefreshConfiguration.Jsii$Proxy.class)
public interface QuicksightDataSetRefreshPropertiesRefreshConfiguration extends software.amazon.jsii.JsiiSerializable {

    /**
     * incremental_refresh block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#incremental_refresh QuicksightDataSet#incremental_refresh}
     */
    @org.jetbrains.annotations.NotNull imports.aws.quicksight_data_set.QuicksightDataSetRefreshPropertiesRefreshConfigurationIncrementalRefresh getIncrementalRefresh();

    /**
     * @return a {@link Builder} of {@link QuicksightDataSetRefreshPropertiesRefreshConfiguration}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link QuicksightDataSetRefreshPropertiesRefreshConfiguration}
     */
    public static final class Builder implements software.amazon.jsii.Builder<QuicksightDataSetRefreshPropertiesRefreshConfiguration> {
        imports.aws.quicksight_data_set.QuicksightDataSetRefreshPropertiesRefreshConfigurationIncrementalRefresh incrementalRefresh;

        /**
         * Sets the value of {@link QuicksightDataSetRefreshPropertiesRefreshConfiguration#getIncrementalRefresh}
         * @param incrementalRefresh incremental_refresh block. This parameter is required.
         *                           Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#incremental_refresh QuicksightDataSet#incremental_refresh}
         * @return {@code this}
         */
        public Builder incrementalRefresh(imports.aws.quicksight_data_set.QuicksightDataSetRefreshPropertiesRefreshConfigurationIncrementalRefresh incrementalRefresh) {
            this.incrementalRefresh = incrementalRefresh;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link QuicksightDataSetRefreshPropertiesRefreshConfiguration}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public QuicksightDataSetRefreshPropertiesRefreshConfiguration build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link QuicksightDataSetRefreshPropertiesRefreshConfiguration}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements QuicksightDataSetRefreshPropertiesRefreshConfiguration {
        private final imports.aws.quicksight_data_set.QuicksightDataSetRefreshPropertiesRefreshConfigurationIncrementalRefresh incrementalRefresh;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.incrementalRefresh = software.amazon.jsii.Kernel.get(this, "incrementalRefresh", software.amazon.jsii.NativeType.forClass(imports.aws.quicksight_data_set.QuicksightDataSetRefreshPropertiesRefreshConfigurationIncrementalRefresh.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.incrementalRefresh = java.util.Objects.requireNonNull(builder.incrementalRefresh, "incrementalRefresh is required");
        }

        @Override
        public final imports.aws.quicksight_data_set.QuicksightDataSetRefreshPropertiesRefreshConfigurationIncrementalRefresh getIncrementalRefresh() {
            return this.incrementalRefresh;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("incrementalRefresh", om.valueToTree(this.getIncrementalRefresh()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.quicksightDataSet.QuicksightDataSetRefreshPropertiesRefreshConfiguration"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            QuicksightDataSetRefreshPropertiesRefreshConfiguration.Jsii$Proxy that = (QuicksightDataSetRefreshPropertiesRefreshConfiguration.Jsii$Proxy) o;

            return this.incrementalRefresh.equals(that.incrementalRefresh);
        }

        @Override
        public final int hashCode() {
            int result = this.incrementalRefresh.hashCode();
            return result;
        }
    }
}
