package imports.aws.timestreamquery_scheduled_query;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.552Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.timestreamqueryScheduledQuery.TimestreamqueryScheduledQueryRecentlyFailedRuns")
@software.amazon.jsii.Jsii.Proxy(TimestreamqueryScheduledQueryRecentlyFailedRuns.Jsii$Proxy.class)
public interface TimestreamqueryScheduledQueryRecentlyFailedRuns extends software.amazon.jsii.JsiiSerializable {

    /**
     * error_report_location block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreamquery_scheduled_query#error_report_location TimestreamqueryScheduledQuery#error_report_location}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getErrorReportLocation() {
        return null;
    }

    /**
     * execution_stats block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreamquery_scheduled_query#execution_stats TimestreamqueryScheduledQuery#execution_stats}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getExecutionStats() {
        return null;
    }

    /**
     * query_insights_response block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreamquery_scheduled_query#query_insights_response TimestreamqueryScheduledQuery#query_insights_response}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getQueryInsightsResponse() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link TimestreamqueryScheduledQueryRecentlyFailedRuns}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link TimestreamqueryScheduledQueryRecentlyFailedRuns}
     */
    public static final class Builder implements software.amazon.jsii.Builder<TimestreamqueryScheduledQueryRecentlyFailedRuns> {
        java.lang.Object errorReportLocation;
        java.lang.Object executionStats;
        java.lang.Object queryInsightsResponse;

        /**
         * Sets the value of {@link TimestreamqueryScheduledQueryRecentlyFailedRuns#getErrorReportLocation}
         * @param errorReportLocation error_report_location block.
         *                            Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreamquery_scheduled_query#error_report_location TimestreamqueryScheduledQuery#error_report_location}
         * @return {@code this}
         */
        public Builder errorReportLocation(com.hashicorp.cdktf.IResolvable errorReportLocation) {
            this.errorReportLocation = errorReportLocation;
            return this;
        }

        /**
         * Sets the value of {@link TimestreamqueryScheduledQueryRecentlyFailedRuns#getErrorReportLocation}
         * @param errorReportLocation error_report_location block.
         *                            Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreamquery_scheduled_query#error_report_location TimestreamqueryScheduledQuery#error_report_location}
         * @return {@code this}
         */
        public Builder errorReportLocation(java.util.List<? extends imports.aws.timestreamquery_scheduled_query.TimestreamqueryScheduledQueryRecentlyFailedRunsErrorReportLocation> errorReportLocation) {
            this.errorReportLocation = errorReportLocation;
            return this;
        }

        /**
         * Sets the value of {@link TimestreamqueryScheduledQueryRecentlyFailedRuns#getExecutionStats}
         * @param executionStats execution_stats block.
         *                       Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreamquery_scheduled_query#execution_stats TimestreamqueryScheduledQuery#execution_stats}
         * @return {@code this}
         */
        public Builder executionStats(com.hashicorp.cdktf.IResolvable executionStats) {
            this.executionStats = executionStats;
            return this;
        }

        /**
         * Sets the value of {@link TimestreamqueryScheduledQueryRecentlyFailedRuns#getExecutionStats}
         * @param executionStats execution_stats block.
         *                       Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreamquery_scheduled_query#execution_stats TimestreamqueryScheduledQuery#execution_stats}
         * @return {@code this}
         */
        public Builder executionStats(java.util.List<? extends imports.aws.timestreamquery_scheduled_query.TimestreamqueryScheduledQueryRecentlyFailedRunsExecutionStats> executionStats) {
            this.executionStats = executionStats;
            return this;
        }

        /**
         * Sets the value of {@link TimestreamqueryScheduledQueryRecentlyFailedRuns#getQueryInsightsResponse}
         * @param queryInsightsResponse query_insights_response block.
         *                              Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreamquery_scheduled_query#query_insights_response TimestreamqueryScheduledQuery#query_insights_response}
         * @return {@code this}
         */
        public Builder queryInsightsResponse(com.hashicorp.cdktf.IResolvable queryInsightsResponse) {
            this.queryInsightsResponse = queryInsightsResponse;
            return this;
        }

        /**
         * Sets the value of {@link TimestreamqueryScheduledQueryRecentlyFailedRuns#getQueryInsightsResponse}
         * @param queryInsightsResponse query_insights_response block.
         *                              Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreamquery_scheduled_query#query_insights_response TimestreamqueryScheduledQuery#query_insights_response}
         * @return {@code this}
         */
        public Builder queryInsightsResponse(java.util.List<? extends imports.aws.timestreamquery_scheduled_query.TimestreamqueryScheduledQueryRecentlyFailedRunsQueryInsightsResponse> queryInsightsResponse) {
            this.queryInsightsResponse = queryInsightsResponse;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link TimestreamqueryScheduledQueryRecentlyFailedRuns}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public TimestreamqueryScheduledQueryRecentlyFailedRuns build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link TimestreamqueryScheduledQueryRecentlyFailedRuns}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements TimestreamqueryScheduledQueryRecentlyFailedRuns {
        private final java.lang.Object errorReportLocation;
        private final java.lang.Object executionStats;
        private final java.lang.Object queryInsightsResponse;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.errorReportLocation = software.amazon.jsii.Kernel.get(this, "errorReportLocation", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.executionStats = software.amazon.jsii.Kernel.get(this, "executionStats", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.queryInsightsResponse = software.amazon.jsii.Kernel.get(this, "queryInsightsResponse", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.errorReportLocation = builder.errorReportLocation;
            this.executionStats = builder.executionStats;
            this.queryInsightsResponse = builder.queryInsightsResponse;
        }

        @Override
        public final java.lang.Object getErrorReportLocation() {
            return this.errorReportLocation;
        }

        @Override
        public final java.lang.Object getExecutionStats() {
            return this.executionStats;
        }

        @Override
        public final java.lang.Object getQueryInsightsResponse() {
            return this.queryInsightsResponse;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getErrorReportLocation() != null) {
                data.set("errorReportLocation", om.valueToTree(this.getErrorReportLocation()));
            }
            if (this.getExecutionStats() != null) {
                data.set("executionStats", om.valueToTree(this.getExecutionStats()));
            }
            if (this.getQueryInsightsResponse() != null) {
                data.set("queryInsightsResponse", om.valueToTree(this.getQueryInsightsResponse()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.timestreamqueryScheduledQuery.TimestreamqueryScheduledQueryRecentlyFailedRuns"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            TimestreamqueryScheduledQueryRecentlyFailedRuns.Jsii$Proxy that = (TimestreamqueryScheduledQueryRecentlyFailedRuns.Jsii$Proxy) o;

            if (this.errorReportLocation != null ? !this.errorReportLocation.equals(that.errorReportLocation) : that.errorReportLocation != null) return false;
            if (this.executionStats != null ? !this.executionStats.equals(that.executionStats) : that.executionStats != null) return false;
            return this.queryInsightsResponse != null ? this.queryInsightsResponse.equals(that.queryInsightsResponse) : that.queryInsightsResponse == null;
        }

        @Override
        public final int hashCode() {
            int result = this.errorReportLocation != null ? this.errorReportLocation.hashCode() : 0;
            result = 31 * result + (this.executionStats != null ? this.executionStats.hashCode() : 0);
            result = 31 * result + (this.queryInsightsResponse != null ? this.queryInsightsResponse.hashCode() : 0);
            return result;
        }
    }
}
