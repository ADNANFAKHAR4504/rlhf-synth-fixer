package imports.aws.elasticsearch_domain;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.181Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.elasticsearchDomain.ElasticsearchDomainLogPublishingOptions")
@software.amazon.jsii.Jsii.Proxy(ElasticsearchDomainLogPublishingOptions.Jsii$Proxy.class)
public interface ElasticsearchDomainLogPublishingOptions extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticsearch_domain#cloudwatch_log_group_arn ElasticsearchDomain#cloudwatch_log_group_arn}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getCloudwatchLogGroupArn();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticsearch_domain#log_type ElasticsearchDomain#log_type}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getLogType();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticsearch_domain#enabled ElasticsearchDomain#enabled}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getEnabled() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link ElasticsearchDomainLogPublishingOptions}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link ElasticsearchDomainLogPublishingOptions}
     */
    public static final class Builder implements software.amazon.jsii.Builder<ElasticsearchDomainLogPublishingOptions> {
        java.lang.String cloudwatchLogGroupArn;
        java.lang.String logType;
        java.lang.Object enabled;

        /**
         * Sets the value of {@link ElasticsearchDomainLogPublishingOptions#getCloudwatchLogGroupArn}
         * @param cloudwatchLogGroupArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticsearch_domain#cloudwatch_log_group_arn ElasticsearchDomain#cloudwatch_log_group_arn}. This parameter is required.
         * @return {@code this}
         */
        public Builder cloudwatchLogGroupArn(java.lang.String cloudwatchLogGroupArn) {
            this.cloudwatchLogGroupArn = cloudwatchLogGroupArn;
            return this;
        }

        /**
         * Sets the value of {@link ElasticsearchDomainLogPublishingOptions#getLogType}
         * @param logType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticsearch_domain#log_type ElasticsearchDomain#log_type}. This parameter is required.
         * @return {@code this}
         */
        public Builder logType(java.lang.String logType) {
            this.logType = logType;
            return this;
        }

        /**
         * Sets the value of {@link ElasticsearchDomainLogPublishingOptions#getEnabled}
         * @param enabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticsearch_domain#enabled ElasticsearchDomain#enabled}.
         * @return {@code this}
         */
        public Builder enabled(java.lang.Boolean enabled) {
            this.enabled = enabled;
            return this;
        }

        /**
         * Sets the value of {@link ElasticsearchDomainLogPublishingOptions#getEnabled}
         * @param enabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticsearch_domain#enabled ElasticsearchDomain#enabled}.
         * @return {@code this}
         */
        public Builder enabled(com.hashicorp.cdktf.IResolvable enabled) {
            this.enabled = enabled;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link ElasticsearchDomainLogPublishingOptions}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public ElasticsearchDomainLogPublishingOptions build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link ElasticsearchDomainLogPublishingOptions}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements ElasticsearchDomainLogPublishingOptions {
        private final java.lang.String cloudwatchLogGroupArn;
        private final java.lang.String logType;
        private final java.lang.Object enabled;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.cloudwatchLogGroupArn = software.amazon.jsii.Kernel.get(this, "cloudwatchLogGroupArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.logType = software.amazon.jsii.Kernel.get(this, "logType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.enabled = software.amazon.jsii.Kernel.get(this, "enabled", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.cloudwatchLogGroupArn = java.util.Objects.requireNonNull(builder.cloudwatchLogGroupArn, "cloudwatchLogGroupArn is required");
            this.logType = java.util.Objects.requireNonNull(builder.logType, "logType is required");
            this.enabled = builder.enabled;
        }

        @Override
        public final java.lang.String getCloudwatchLogGroupArn() {
            return this.cloudwatchLogGroupArn;
        }

        @Override
        public final java.lang.String getLogType() {
            return this.logType;
        }

        @Override
        public final java.lang.Object getEnabled() {
            return this.enabled;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("cloudwatchLogGroupArn", om.valueToTree(this.getCloudwatchLogGroupArn()));
            data.set("logType", om.valueToTree(this.getLogType()));
            if (this.getEnabled() != null) {
                data.set("enabled", om.valueToTree(this.getEnabled()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.elasticsearchDomain.ElasticsearchDomainLogPublishingOptions"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            ElasticsearchDomainLogPublishingOptions.Jsii$Proxy that = (ElasticsearchDomainLogPublishingOptions.Jsii$Proxy) o;

            if (!cloudwatchLogGroupArn.equals(that.cloudwatchLogGroupArn)) return false;
            if (!logType.equals(that.logType)) return false;
            return this.enabled != null ? this.enabled.equals(that.enabled) : that.enabled == null;
        }

        @Override
        public final int hashCode() {
            int result = this.cloudwatchLogGroupArn.hashCode();
            result = 31 * result + (this.logType.hashCode());
            result = 31 * result + (this.enabled != null ? this.enabled.hashCode() : 0);
            return result;
        }
    }
}
