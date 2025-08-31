package imports.aws.elastic_beanstalk_application;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.162Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.elasticBeanstalkApplication.ElasticBeanstalkApplicationAppversionLifecycle")
@software.amazon.jsii.Jsii.Proxy(ElasticBeanstalkApplicationAppversionLifecycle.Jsii$Proxy.class)
public interface ElasticBeanstalkApplicationAppversionLifecycle extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elastic_beanstalk_application#service_role ElasticBeanstalkApplication#service_role}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getServiceRole();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elastic_beanstalk_application#delete_source_from_s3 ElasticBeanstalkApplication#delete_source_from_s3}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getDeleteSourceFromS3() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elastic_beanstalk_application#max_age_in_days ElasticBeanstalkApplication#max_age_in_days}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getMaxAgeInDays() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elastic_beanstalk_application#max_count ElasticBeanstalkApplication#max_count}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getMaxCount() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link ElasticBeanstalkApplicationAppversionLifecycle}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link ElasticBeanstalkApplicationAppversionLifecycle}
     */
    public static final class Builder implements software.amazon.jsii.Builder<ElasticBeanstalkApplicationAppversionLifecycle> {
        java.lang.String serviceRole;
        java.lang.Object deleteSourceFromS3;
        java.lang.Number maxAgeInDays;
        java.lang.Number maxCount;

        /**
         * Sets the value of {@link ElasticBeanstalkApplicationAppversionLifecycle#getServiceRole}
         * @param serviceRole Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elastic_beanstalk_application#service_role ElasticBeanstalkApplication#service_role}. This parameter is required.
         * @return {@code this}
         */
        public Builder serviceRole(java.lang.String serviceRole) {
            this.serviceRole = serviceRole;
            return this;
        }

        /**
         * Sets the value of {@link ElasticBeanstalkApplicationAppversionLifecycle#getDeleteSourceFromS3}
         * @param deleteSourceFromS3 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elastic_beanstalk_application#delete_source_from_s3 ElasticBeanstalkApplication#delete_source_from_s3}.
         * @return {@code this}
         */
        public Builder deleteSourceFromS3(java.lang.Boolean deleteSourceFromS3) {
            this.deleteSourceFromS3 = deleteSourceFromS3;
            return this;
        }

        /**
         * Sets the value of {@link ElasticBeanstalkApplicationAppversionLifecycle#getDeleteSourceFromS3}
         * @param deleteSourceFromS3 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elastic_beanstalk_application#delete_source_from_s3 ElasticBeanstalkApplication#delete_source_from_s3}.
         * @return {@code this}
         */
        public Builder deleteSourceFromS3(com.hashicorp.cdktf.IResolvable deleteSourceFromS3) {
            this.deleteSourceFromS3 = deleteSourceFromS3;
            return this;
        }

        /**
         * Sets the value of {@link ElasticBeanstalkApplicationAppversionLifecycle#getMaxAgeInDays}
         * @param maxAgeInDays Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elastic_beanstalk_application#max_age_in_days ElasticBeanstalkApplication#max_age_in_days}.
         * @return {@code this}
         */
        public Builder maxAgeInDays(java.lang.Number maxAgeInDays) {
            this.maxAgeInDays = maxAgeInDays;
            return this;
        }

        /**
         * Sets the value of {@link ElasticBeanstalkApplicationAppversionLifecycle#getMaxCount}
         * @param maxCount Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elastic_beanstalk_application#max_count ElasticBeanstalkApplication#max_count}.
         * @return {@code this}
         */
        public Builder maxCount(java.lang.Number maxCount) {
            this.maxCount = maxCount;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link ElasticBeanstalkApplicationAppversionLifecycle}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public ElasticBeanstalkApplicationAppversionLifecycle build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link ElasticBeanstalkApplicationAppversionLifecycle}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements ElasticBeanstalkApplicationAppversionLifecycle {
        private final java.lang.String serviceRole;
        private final java.lang.Object deleteSourceFromS3;
        private final java.lang.Number maxAgeInDays;
        private final java.lang.Number maxCount;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.serviceRole = software.amazon.jsii.Kernel.get(this, "serviceRole", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.deleteSourceFromS3 = software.amazon.jsii.Kernel.get(this, "deleteSourceFromS3", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.maxAgeInDays = software.amazon.jsii.Kernel.get(this, "maxAgeInDays", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.maxCount = software.amazon.jsii.Kernel.get(this, "maxCount", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.serviceRole = java.util.Objects.requireNonNull(builder.serviceRole, "serviceRole is required");
            this.deleteSourceFromS3 = builder.deleteSourceFromS3;
            this.maxAgeInDays = builder.maxAgeInDays;
            this.maxCount = builder.maxCount;
        }

        @Override
        public final java.lang.String getServiceRole() {
            return this.serviceRole;
        }

        @Override
        public final java.lang.Object getDeleteSourceFromS3() {
            return this.deleteSourceFromS3;
        }

        @Override
        public final java.lang.Number getMaxAgeInDays() {
            return this.maxAgeInDays;
        }

        @Override
        public final java.lang.Number getMaxCount() {
            return this.maxCount;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("serviceRole", om.valueToTree(this.getServiceRole()));
            if (this.getDeleteSourceFromS3() != null) {
                data.set("deleteSourceFromS3", om.valueToTree(this.getDeleteSourceFromS3()));
            }
            if (this.getMaxAgeInDays() != null) {
                data.set("maxAgeInDays", om.valueToTree(this.getMaxAgeInDays()));
            }
            if (this.getMaxCount() != null) {
                data.set("maxCount", om.valueToTree(this.getMaxCount()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.elasticBeanstalkApplication.ElasticBeanstalkApplicationAppversionLifecycle"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            ElasticBeanstalkApplicationAppversionLifecycle.Jsii$Proxy that = (ElasticBeanstalkApplicationAppversionLifecycle.Jsii$Proxy) o;

            if (!serviceRole.equals(that.serviceRole)) return false;
            if (this.deleteSourceFromS3 != null ? !this.deleteSourceFromS3.equals(that.deleteSourceFromS3) : that.deleteSourceFromS3 != null) return false;
            if (this.maxAgeInDays != null ? !this.maxAgeInDays.equals(that.maxAgeInDays) : that.maxAgeInDays != null) return false;
            return this.maxCount != null ? this.maxCount.equals(that.maxCount) : that.maxCount == null;
        }

        @Override
        public final int hashCode() {
            int result = this.serviceRole.hashCode();
            result = 31 * result + (this.deleteSourceFromS3 != null ? this.deleteSourceFromS3.hashCode() : 0);
            result = 31 * result + (this.maxAgeInDays != null ? this.maxAgeInDays.hashCode() : 0);
            result = 31 * result + (this.maxCount != null ? this.maxCount.hashCode() : 0);
            return result;
        }
    }
}
