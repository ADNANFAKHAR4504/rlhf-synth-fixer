package imports.aws.timestreamquery_scheduled_query;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.547Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.timestreamqueryScheduledQuery.TimestreamqueryScheduledQueryLastRunSummaryQueryInsightsResponse")
@software.amazon.jsii.Jsii.Proxy(TimestreamqueryScheduledQueryLastRunSummaryQueryInsightsResponse.Jsii$Proxy.class)
public interface TimestreamqueryScheduledQueryLastRunSummaryQueryInsightsResponse extends software.amazon.jsii.JsiiSerializable {

    /**
     * query_spatial_coverage block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreamquery_scheduled_query#query_spatial_coverage TimestreamqueryScheduledQuery#query_spatial_coverage}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getQuerySpatialCoverage() {
        return null;
    }

    /**
     * query_temporal_range block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreamquery_scheduled_query#query_temporal_range TimestreamqueryScheduledQuery#query_temporal_range}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getQueryTemporalRange() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link TimestreamqueryScheduledQueryLastRunSummaryQueryInsightsResponse}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link TimestreamqueryScheduledQueryLastRunSummaryQueryInsightsResponse}
     */
    public static final class Builder implements software.amazon.jsii.Builder<TimestreamqueryScheduledQueryLastRunSummaryQueryInsightsResponse> {
        java.lang.Object querySpatialCoverage;
        java.lang.Object queryTemporalRange;

        /**
         * Sets the value of {@link TimestreamqueryScheduledQueryLastRunSummaryQueryInsightsResponse#getQuerySpatialCoverage}
         * @param querySpatialCoverage query_spatial_coverage block.
         *                             Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreamquery_scheduled_query#query_spatial_coverage TimestreamqueryScheduledQuery#query_spatial_coverage}
         * @return {@code this}
         */
        public Builder querySpatialCoverage(com.hashicorp.cdktf.IResolvable querySpatialCoverage) {
            this.querySpatialCoverage = querySpatialCoverage;
            return this;
        }

        /**
         * Sets the value of {@link TimestreamqueryScheduledQueryLastRunSummaryQueryInsightsResponse#getQuerySpatialCoverage}
         * @param querySpatialCoverage query_spatial_coverage block.
         *                             Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreamquery_scheduled_query#query_spatial_coverage TimestreamqueryScheduledQuery#query_spatial_coverage}
         * @return {@code this}
         */
        public Builder querySpatialCoverage(java.util.List<? extends imports.aws.timestreamquery_scheduled_query.TimestreamqueryScheduledQueryLastRunSummaryQueryInsightsResponseQuerySpatialCoverage> querySpatialCoverage) {
            this.querySpatialCoverage = querySpatialCoverage;
            return this;
        }

        /**
         * Sets the value of {@link TimestreamqueryScheduledQueryLastRunSummaryQueryInsightsResponse#getQueryTemporalRange}
         * @param queryTemporalRange query_temporal_range block.
         *                           Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreamquery_scheduled_query#query_temporal_range TimestreamqueryScheduledQuery#query_temporal_range}
         * @return {@code this}
         */
        public Builder queryTemporalRange(com.hashicorp.cdktf.IResolvable queryTemporalRange) {
            this.queryTemporalRange = queryTemporalRange;
            return this;
        }

        /**
         * Sets the value of {@link TimestreamqueryScheduledQueryLastRunSummaryQueryInsightsResponse#getQueryTemporalRange}
         * @param queryTemporalRange query_temporal_range block.
         *                           Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreamquery_scheduled_query#query_temporal_range TimestreamqueryScheduledQuery#query_temporal_range}
         * @return {@code this}
         */
        public Builder queryTemporalRange(java.util.List<? extends imports.aws.timestreamquery_scheduled_query.TimestreamqueryScheduledQueryLastRunSummaryQueryInsightsResponseQueryTemporalRange> queryTemporalRange) {
            this.queryTemporalRange = queryTemporalRange;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link TimestreamqueryScheduledQueryLastRunSummaryQueryInsightsResponse}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public TimestreamqueryScheduledQueryLastRunSummaryQueryInsightsResponse build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link TimestreamqueryScheduledQueryLastRunSummaryQueryInsightsResponse}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements TimestreamqueryScheduledQueryLastRunSummaryQueryInsightsResponse {
        private final java.lang.Object querySpatialCoverage;
        private final java.lang.Object queryTemporalRange;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.querySpatialCoverage = software.amazon.jsii.Kernel.get(this, "querySpatialCoverage", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.queryTemporalRange = software.amazon.jsii.Kernel.get(this, "queryTemporalRange", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.querySpatialCoverage = builder.querySpatialCoverage;
            this.queryTemporalRange = builder.queryTemporalRange;
        }

        @Override
        public final java.lang.Object getQuerySpatialCoverage() {
            return this.querySpatialCoverage;
        }

        @Override
        public final java.lang.Object getQueryTemporalRange() {
            return this.queryTemporalRange;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getQuerySpatialCoverage() != null) {
                data.set("querySpatialCoverage", om.valueToTree(this.getQuerySpatialCoverage()));
            }
            if (this.getQueryTemporalRange() != null) {
                data.set("queryTemporalRange", om.valueToTree(this.getQueryTemporalRange()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.timestreamqueryScheduledQuery.TimestreamqueryScheduledQueryLastRunSummaryQueryInsightsResponse"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            TimestreamqueryScheduledQueryLastRunSummaryQueryInsightsResponse.Jsii$Proxy that = (TimestreamqueryScheduledQueryLastRunSummaryQueryInsightsResponse.Jsii$Proxy) o;

            if (this.querySpatialCoverage != null ? !this.querySpatialCoverage.equals(that.querySpatialCoverage) : that.querySpatialCoverage != null) return false;
            return this.queryTemporalRange != null ? this.queryTemporalRange.equals(that.queryTemporalRange) : that.queryTemporalRange == null;
        }

        @Override
        public final int hashCode() {
            int result = this.querySpatialCoverage != null ? this.querySpatialCoverage.hashCode() : 0;
            result = 31 * result + (this.queryTemporalRange != null ? this.queryTemporalRange.hashCode() : 0);
            return result;
        }
    }
}
