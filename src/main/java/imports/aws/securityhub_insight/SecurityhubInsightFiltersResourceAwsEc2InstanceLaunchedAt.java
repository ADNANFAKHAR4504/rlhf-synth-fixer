package imports.aws.securityhub_insight;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.406Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.securityhubInsight.SecurityhubInsightFiltersResourceAwsEc2InstanceLaunchedAt")
@software.amazon.jsii.Jsii.Proxy(SecurityhubInsightFiltersResourceAwsEc2InstanceLaunchedAt.Jsii$Proxy.class)
public interface SecurityhubInsightFiltersResourceAwsEc2InstanceLaunchedAt extends software.amazon.jsii.JsiiSerializable {

    /**
     * date_range block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_insight#date_range SecurityhubInsight#date_range}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.securityhub_insight.SecurityhubInsightFiltersResourceAwsEc2InstanceLaunchedAtDateRange getDateRange() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_insight#end SecurityhubInsight#end}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getEnd() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_insight#start SecurityhubInsight#start}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getStart() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link SecurityhubInsightFiltersResourceAwsEc2InstanceLaunchedAt}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link SecurityhubInsightFiltersResourceAwsEc2InstanceLaunchedAt}
     */
    public static final class Builder implements software.amazon.jsii.Builder<SecurityhubInsightFiltersResourceAwsEc2InstanceLaunchedAt> {
        imports.aws.securityhub_insight.SecurityhubInsightFiltersResourceAwsEc2InstanceLaunchedAtDateRange dateRange;
        java.lang.String end;
        java.lang.String start;

        /**
         * Sets the value of {@link SecurityhubInsightFiltersResourceAwsEc2InstanceLaunchedAt#getDateRange}
         * @param dateRange date_range block.
         *                  Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_insight#date_range SecurityhubInsight#date_range}
         * @return {@code this}
         */
        public Builder dateRange(imports.aws.securityhub_insight.SecurityhubInsightFiltersResourceAwsEc2InstanceLaunchedAtDateRange dateRange) {
            this.dateRange = dateRange;
            return this;
        }

        /**
         * Sets the value of {@link SecurityhubInsightFiltersResourceAwsEc2InstanceLaunchedAt#getEnd}
         * @param end Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_insight#end SecurityhubInsight#end}.
         * @return {@code this}
         */
        public Builder end(java.lang.String end) {
            this.end = end;
            return this;
        }

        /**
         * Sets the value of {@link SecurityhubInsightFiltersResourceAwsEc2InstanceLaunchedAt#getStart}
         * @param start Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/securityhub_insight#start SecurityhubInsight#start}.
         * @return {@code this}
         */
        public Builder start(java.lang.String start) {
            this.start = start;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link SecurityhubInsightFiltersResourceAwsEc2InstanceLaunchedAt}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public SecurityhubInsightFiltersResourceAwsEc2InstanceLaunchedAt build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link SecurityhubInsightFiltersResourceAwsEc2InstanceLaunchedAt}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements SecurityhubInsightFiltersResourceAwsEc2InstanceLaunchedAt {
        private final imports.aws.securityhub_insight.SecurityhubInsightFiltersResourceAwsEc2InstanceLaunchedAtDateRange dateRange;
        private final java.lang.String end;
        private final java.lang.String start;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.dateRange = software.amazon.jsii.Kernel.get(this, "dateRange", software.amazon.jsii.NativeType.forClass(imports.aws.securityhub_insight.SecurityhubInsightFiltersResourceAwsEc2InstanceLaunchedAtDateRange.class));
            this.end = software.amazon.jsii.Kernel.get(this, "end", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.start = software.amazon.jsii.Kernel.get(this, "start", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.dateRange = builder.dateRange;
            this.end = builder.end;
            this.start = builder.start;
        }

        @Override
        public final imports.aws.securityhub_insight.SecurityhubInsightFiltersResourceAwsEc2InstanceLaunchedAtDateRange getDateRange() {
            return this.dateRange;
        }

        @Override
        public final java.lang.String getEnd() {
            return this.end;
        }

        @Override
        public final java.lang.String getStart() {
            return this.start;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getDateRange() != null) {
                data.set("dateRange", om.valueToTree(this.getDateRange()));
            }
            if (this.getEnd() != null) {
                data.set("end", om.valueToTree(this.getEnd()));
            }
            if (this.getStart() != null) {
                data.set("start", om.valueToTree(this.getStart()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.securityhubInsight.SecurityhubInsightFiltersResourceAwsEc2InstanceLaunchedAt"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            SecurityhubInsightFiltersResourceAwsEc2InstanceLaunchedAt.Jsii$Proxy that = (SecurityhubInsightFiltersResourceAwsEc2InstanceLaunchedAt.Jsii$Proxy) o;

            if (this.dateRange != null ? !this.dateRange.equals(that.dateRange) : that.dateRange != null) return false;
            if (this.end != null ? !this.end.equals(that.end) : that.end != null) return false;
            return this.start != null ? this.start.equals(that.start) : that.start == null;
        }

        @Override
        public final int hashCode() {
            int result = this.dateRange != null ? this.dateRange.hashCode() : 0;
            result = 31 * result + (this.end != null ? this.end.hashCode() : 0);
            result = 31 * result + (this.start != null ? this.start.hashCode() : 0);
            return result;
        }
    }
}
