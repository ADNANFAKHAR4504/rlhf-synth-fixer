package imports.aws.s3_bucket_replication_configuration;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.266Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.s3BucketReplicationConfiguration.S3BucketReplicationConfigurationRuleDestinationReplicationTime")
@software.amazon.jsii.Jsii.Proxy(S3BucketReplicationConfigurationRuleDestinationReplicationTime.Jsii$Proxy.class)
public interface S3BucketReplicationConfigurationRuleDestinationReplicationTime extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket_replication_configuration#status S3BucketReplicationConfigurationA#status}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getStatus();

    /**
     * time block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket_replication_configuration#time S3BucketReplicationConfigurationA#time}
     */
    @org.jetbrains.annotations.NotNull imports.aws.s3_bucket_replication_configuration.S3BucketReplicationConfigurationRuleDestinationReplicationTimeTime getTime();

    /**
     * @return a {@link Builder} of {@link S3BucketReplicationConfigurationRuleDestinationReplicationTime}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link S3BucketReplicationConfigurationRuleDestinationReplicationTime}
     */
    public static final class Builder implements software.amazon.jsii.Builder<S3BucketReplicationConfigurationRuleDestinationReplicationTime> {
        java.lang.String status;
        imports.aws.s3_bucket_replication_configuration.S3BucketReplicationConfigurationRuleDestinationReplicationTimeTime time;

        /**
         * Sets the value of {@link S3BucketReplicationConfigurationRuleDestinationReplicationTime#getStatus}
         * @param status Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket_replication_configuration#status S3BucketReplicationConfigurationA#status}. This parameter is required.
         * @return {@code this}
         */
        public Builder status(java.lang.String status) {
            this.status = status;
            return this;
        }

        /**
         * Sets the value of {@link S3BucketReplicationConfigurationRuleDestinationReplicationTime#getTime}
         * @param time time block. This parameter is required.
         *             Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3_bucket_replication_configuration#time S3BucketReplicationConfigurationA#time}
         * @return {@code this}
         */
        public Builder time(imports.aws.s3_bucket_replication_configuration.S3BucketReplicationConfigurationRuleDestinationReplicationTimeTime time) {
            this.time = time;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link S3BucketReplicationConfigurationRuleDestinationReplicationTime}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public S3BucketReplicationConfigurationRuleDestinationReplicationTime build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link S3BucketReplicationConfigurationRuleDestinationReplicationTime}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements S3BucketReplicationConfigurationRuleDestinationReplicationTime {
        private final java.lang.String status;
        private final imports.aws.s3_bucket_replication_configuration.S3BucketReplicationConfigurationRuleDestinationReplicationTimeTime time;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.status = software.amazon.jsii.Kernel.get(this, "status", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.time = software.amazon.jsii.Kernel.get(this, "time", software.amazon.jsii.NativeType.forClass(imports.aws.s3_bucket_replication_configuration.S3BucketReplicationConfigurationRuleDestinationReplicationTimeTime.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.status = java.util.Objects.requireNonNull(builder.status, "status is required");
            this.time = java.util.Objects.requireNonNull(builder.time, "time is required");
        }

        @Override
        public final java.lang.String getStatus() {
            return this.status;
        }

        @Override
        public final imports.aws.s3_bucket_replication_configuration.S3BucketReplicationConfigurationRuleDestinationReplicationTimeTime getTime() {
            return this.time;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("status", om.valueToTree(this.getStatus()));
            data.set("time", om.valueToTree(this.getTime()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.s3BucketReplicationConfiguration.S3BucketReplicationConfigurationRuleDestinationReplicationTime"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            S3BucketReplicationConfigurationRuleDestinationReplicationTime.Jsii$Proxy that = (S3BucketReplicationConfigurationRuleDestinationReplicationTime.Jsii$Proxy) o;

            if (!status.equals(that.status)) return false;
            return this.time.equals(that.time);
        }

        @Override
        public final int hashCode() {
            int result = this.status.hashCode();
            result = 31 * result + (this.time.hashCode());
            return result;
        }
    }
}
