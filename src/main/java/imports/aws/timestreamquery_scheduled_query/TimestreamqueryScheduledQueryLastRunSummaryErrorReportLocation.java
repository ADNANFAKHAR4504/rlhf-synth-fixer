package imports.aws.timestreamquery_scheduled_query;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.546Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.timestreamqueryScheduledQuery.TimestreamqueryScheduledQueryLastRunSummaryErrorReportLocation")
@software.amazon.jsii.Jsii.Proxy(TimestreamqueryScheduledQueryLastRunSummaryErrorReportLocation.Jsii$Proxy.class)
public interface TimestreamqueryScheduledQueryLastRunSummaryErrorReportLocation extends software.amazon.jsii.JsiiSerializable {

    /**
     * s3_report_location block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreamquery_scheduled_query#s3_report_location TimestreamqueryScheduledQuery#s3_report_location}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getS3ReportLocation() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link TimestreamqueryScheduledQueryLastRunSummaryErrorReportLocation}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link TimestreamqueryScheduledQueryLastRunSummaryErrorReportLocation}
     */
    public static final class Builder implements software.amazon.jsii.Builder<TimestreamqueryScheduledQueryLastRunSummaryErrorReportLocation> {
        java.lang.Object s3ReportLocation;

        /**
         * Sets the value of {@link TimestreamqueryScheduledQueryLastRunSummaryErrorReportLocation#getS3ReportLocation}
         * @param s3ReportLocation s3_report_location block.
         *                         Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreamquery_scheduled_query#s3_report_location TimestreamqueryScheduledQuery#s3_report_location}
         * @return {@code this}
         */
        public Builder s3ReportLocation(com.hashicorp.cdktf.IResolvable s3ReportLocation) {
            this.s3ReportLocation = s3ReportLocation;
            return this;
        }

        /**
         * Sets the value of {@link TimestreamqueryScheduledQueryLastRunSummaryErrorReportLocation#getS3ReportLocation}
         * @param s3ReportLocation s3_report_location block.
         *                         Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/timestreamquery_scheduled_query#s3_report_location TimestreamqueryScheduledQuery#s3_report_location}
         * @return {@code this}
         */
        public Builder s3ReportLocation(java.util.List<? extends imports.aws.timestreamquery_scheduled_query.TimestreamqueryScheduledQueryLastRunSummaryErrorReportLocationS3ReportLocation> s3ReportLocation) {
            this.s3ReportLocation = s3ReportLocation;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link TimestreamqueryScheduledQueryLastRunSummaryErrorReportLocation}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public TimestreamqueryScheduledQueryLastRunSummaryErrorReportLocation build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link TimestreamqueryScheduledQueryLastRunSummaryErrorReportLocation}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements TimestreamqueryScheduledQueryLastRunSummaryErrorReportLocation {
        private final java.lang.Object s3ReportLocation;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.s3ReportLocation = software.amazon.jsii.Kernel.get(this, "s3ReportLocation", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.s3ReportLocation = builder.s3ReportLocation;
        }

        @Override
        public final java.lang.Object getS3ReportLocation() {
            return this.s3ReportLocation;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getS3ReportLocation() != null) {
                data.set("s3ReportLocation", om.valueToTree(this.getS3ReportLocation()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.timestreamqueryScheduledQuery.TimestreamqueryScheduledQueryLastRunSummaryErrorReportLocation"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            TimestreamqueryScheduledQueryLastRunSummaryErrorReportLocation.Jsii$Proxy that = (TimestreamqueryScheduledQueryLastRunSummaryErrorReportLocation.Jsii$Proxy) o;

            return this.s3ReportLocation != null ? this.s3ReportLocation.equals(that.s3ReportLocation) : that.s3ReportLocation == null;
        }

        @Override
        public final int hashCode() {
            int result = this.s3ReportLocation != null ? this.s3ReportLocation.hashCode() : 0;
            return result;
        }
    }
}
