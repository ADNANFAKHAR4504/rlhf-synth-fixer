package imports.aws.s3_bucket_replication_configuration;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.266Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.s3BucketReplicationConfiguration.S3BucketReplicationConfigurationRuleDestinationMetricsEventThreshold")
@software.amazon.jsii.Jsii.Proxy(S3BucketReplicationConfigurationRuleDestinationMetricsEventThreshold.Jsii$Proxy.class)
public interface S3BucketReplicationConfigurationRuleDestinationMetricsEventThreshold extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket_replication_configuration#minutes S3BucketReplicationConfigurationA#minutes}.
     */
    @org.jetbrains.annotations.NotNull java.lang.Number getMinutes();

    /**
     * @return a {@link Builder} of {@link S3BucketReplicationConfigurationRuleDestinationMetricsEventThreshold}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link S3BucketReplicationConfigurationRuleDestinationMetricsEventThreshold}
     */
    public static final class Builder implements software.amazon.jsii.Builder<S3BucketReplicationConfigurationRuleDestinationMetricsEventThreshold> {
        java.lang.Number minutes;

        /**
         * Sets the value of {@link S3BucketReplicationConfigurationRuleDestinationMetricsEventThreshold#getMinutes}
         * @param minutes Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket_replication_configuration#minutes S3BucketReplicationConfigurationA#minutes}. This parameter is required.
         * @return {@code this}
         */
        public Builder minutes(java.lang.Number minutes) {
            this.minutes = minutes;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link S3BucketReplicationConfigurationRuleDestinationMetricsEventThreshold}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public S3BucketReplicationConfigurationRuleDestinationMetricsEventThreshold build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link S3BucketReplicationConfigurationRuleDestinationMetricsEventThreshold}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements S3BucketReplicationConfigurationRuleDestinationMetricsEventThreshold {
        private final java.lang.Number minutes;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.minutes = software.amazon.jsii.Kernel.get(this, "minutes", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.minutes = java.util.Objects.requireNonNull(builder.minutes, "minutes is required");
        }

        @Override
        public final java.lang.Number getMinutes() {
            return this.minutes;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("minutes", om.valueToTree(this.getMinutes()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.s3BucketReplicationConfiguration.S3BucketReplicationConfigurationRuleDestinationMetricsEventThreshold"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            S3BucketReplicationConfigurationRuleDestinationMetricsEventThreshold.Jsii$Proxy that = (S3BucketReplicationConfigurationRuleDestinationMetricsEventThreshold.Jsii$Proxy) o;

            return this.minutes.equals(that.minutes);
        }

        @Override
        public final int hashCode() {
            int result = this.minutes.hashCode();
            return result;
        }
    }
}
