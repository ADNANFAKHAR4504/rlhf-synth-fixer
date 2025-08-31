package imports.aws.s3_bucket_replication_configuration;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.266Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.s3BucketReplicationConfiguration.S3BucketReplicationConfigurationRuleDestinationMetrics")
@software.amazon.jsii.Jsii.Proxy(S3BucketReplicationConfigurationRuleDestinationMetrics.Jsii$Proxy.class)
public interface S3BucketReplicationConfigurationRuleDestinationMetrics extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket_replication_configuration#status S3BucketReplicationConfigurationA#status}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getStatus();

    /**
     * event_threshold block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket_replication_configuration#event_threshold S3BucketReplicationConfigurationA#event_threshold}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.s3_bucket_replication_configuration.S3BucketReplicationConfigurationRuleDestinationMetricsEventThreshold getEventThreshold() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link S3BucketReplicationConfigurationRuleDestinationMetrics}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link S3BucketReplicationConfigurationRuleDestinationMetrics}
     */
    public static final class Builder implements software.amazon.jsii.Builder<S3BucketReplicationConfigurationRuleDestinationMetrics> {
        java.lang.String status;
        imports.aws.s3_bucket_replication_configuration.S3BucketReplicationConfigurationRuleDestinationMetricsEventThreshold eventThreshold;

        /**
         * Sets the value of {@link S3BucketReplicationConfigurationRuleDestinationMetrics#getStatus}
         * @param status Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket_replication_configuration#status S3BucketReplicationConfigurationA#status}. This parameter is required.
         * @return {@code this}
         */
        public Builder status(java.lang.String status) {
            this.status = status;
            return this;
        }

        /**
         * Sets the value of {@link S3BucketReplicationConfigurationRuleDestinationMetrics#getEventThreshold}
         * @param eventThreshold event_threshold block.
         *                       Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket_replication_configuration#event_threshold S3BucketReplicationConfigurationA#event_threshold}
         * @return {@code this}
         */
        public Builder eventThreshold(imports.aws.s3_bucket_replication_configuration.S3BucketReplicationConfigurationRuleDestinationMetricsEventThreshold eventThreshold) {
            this.eventThreshold = eventThreshold;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link S3BucketReplicationConfigurationRuleDestinationMetrics}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public S3BucketReplicationConfigurationRuleDestinationMetrics build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link S3BucketReplicationConfigurationRuleDestinationMetrics}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements S3BucketReplicationConfigurationRuleDestinationMetrics {
        private final java.lang.String status;
        private final imports.aws.s3_bucket_replication_configuration.S3BucketReplicationConfigurationRuleDestinationMetricsEventThreshold eventThreshold;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.status = software.amazon.jsii.Kernel.get(this, "status", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.eventThreshold = software.amazon.jsii.Kernel.get(this, "eventThreshold", software.amazon.jsii.NativeType.forClass(imports.aws.s3_bucket_replication_configuration.S3BucketReplicationConfigurationRuleDestinationMetricsEventThreshold.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.status = java.util.Objects.requireNonNull(builder.status, "status is required");
            this.eventThreshold = builder.eventThreshold;
        }

        @Override
        public final java.lang.String getStatus() {
            return this.status;
        }

        @Override
        public final imports.aws.s3_bucket_replication_configuration.S3BucketReplicationConfigurationRuleDestinationMetricsEventThreshold getEventThreshold() {
            return this.eventThreshold;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("status", om.valueToTree(this.getStatus()));
            if (this.getEventThreshold() != null) {
                data.set("eventThreshold", om.valueToTree(this.getEventThreshold()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.s3BucketReplicationConfiguration.S3BucketReplicationConfigurationRuleDestinationMetrics"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            S3BucketReplicationConfigurationRuleDestinationMetrics.Jsii$Proxy that = (S3BucketReplicationConfigurationRuleDestinationMetrics.Jsii$Proxy) o;

            if (!status.equals(that.status)) return false;
            return this.eventThreshold != null ? this.eventThreshold.equals(that.eventThreshold) : that.eventThreshold == null;
        }

        @Override
        public final int hashCode() {
            int result = this.status.hashCode();
            result = 31 * result + (this.eventThreshold != null ? this.eventThreshold.hashCode() : 0);
            return result;
        }
    }
}
