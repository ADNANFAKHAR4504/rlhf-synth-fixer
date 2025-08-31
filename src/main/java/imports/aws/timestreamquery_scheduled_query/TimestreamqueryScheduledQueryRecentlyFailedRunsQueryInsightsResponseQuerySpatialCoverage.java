package imports.aws.timestreamquery_scheduled_query;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.553Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.timestreamqueryScheduledQuery.TimestreamqueryScheduledQueryRecentlyFailedRunsQueryInsightsResponseQuerySpatialCoverage")
@software.amazon.jsii.Jsii.Proxy(TimestreamqueryScheduledQueryRecentlyFailedRunsQueryInsightsResponseQuerySpatialCoverage.Jsii$Proxy.class)
public interface TimestreamqueryScheduledQueryRecentlyFailedRunsQueryInsightsResponseQuerySpatialCoverage extends software.amazon.jsii.JsiiSerializable {

    /**
     * max block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreamquery_scheduled_query#max TimestreamqueryScheduledQuery#max}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getMax() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link TimestreamqueryScheduledQueryRecentlyFailedRunsQueryInsightsResponseQuerySpatialCoverage}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link TimestreamqueryScheduledQueryRecentlyFailedRunsQueryInsightsResponseQuerySpatialCoverage}
     */
    public static final class Builder implements software.amazon.jsii.Builder<TimestreamqueryScheduledQueryRecentlyFailedRunsQueryInsightsResponseQuerySpatialCoverage> {
        java.lang.Object max;

        /**
         * Sets the value of {@link TimestreamqueryScheduledQueryRecentlyFailedRunsQueryInsightsResponseQuerySpatialCoverage#getMax}
         * @param max max block.
         *            Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreamquery_scheduled_query#max TimestreamqueryScheduledQuery#max}
         * @return {@code this}
         */
        public Builder max(com.hashicorp.cdktf.IResolvable max) {
            this.max = max;
            return this;
        }

        /**
         * Sets the value of {@link TimestreamqueryScheduledQueryRecentlyFailedRunsQueryInsightsResponseQuerySpatialCoverage#getMax}
         * @param max max block.
         *            Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreamquery_scheduled_query#max TimestreamqueryScheduledQuery#max}
         * @return {@code this}
         */
        public Builder max(java.util.List<? extends imports.aws.timestreamquery_scheduled_query.TimestreamqueryScheduledQueryRecentlyFailedRunsQueryInsightsResponseQuerySpatialCoverageMax> max) {
            this.max = max;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link TimestreamqueryScheduledQueryRecentlyFailedRunsQueryInsightsResponseQuerySpatialCoverage}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public TimestreamqueryScheduledQueryRecentlyFailedRunsQueryInsightsResponseQuerySpatialCoverage build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link TimestreamqueryScheduledQueryRecentlyFailedRunsQueryInsightsResponseQuerySpatialCoverage}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements TimestreamqueryScheduledQueryRecentlyFailedRunsQueryInsightsResponseQuerySpatialCoverage {
        private final java.lang.Object max;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.max = software.amazon.jsii.Kernel.get(this, "max", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.max = builder.max;
        }

        @Override
        public final java.lang.Object getMax() {
            return this.max;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getMax() != null) {
                data.set("max", om.valueToTree(this.getMax()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.timestreamqueryScheduledQuery.TimestreamqueryScheduledQueryRecentlyFailedRunsQueryInsightsResponseQuerySpatialCoverage"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            TimestreamqueryScheduledQueryRecentlyFailedRunsQueryInsightsResponseQuerySpatialCoverage.Jsii$Proxy that = (TimestreamqueryScheduledQueryRecentlyFailedRunsQueryInsightsResponseQuerySpatialCoverage.Jsii$Proxy) o;

            return this.max != null ? this.max.equals(that.max) : that.max == null;
        }

        @Override
        public final int hashCode() {
            int result = this.max != null ? this.max.hashCode() : 0;
            return result;
        }
    }
}
