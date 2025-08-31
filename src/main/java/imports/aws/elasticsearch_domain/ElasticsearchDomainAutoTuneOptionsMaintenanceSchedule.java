package imports.aws.elasticsearch_domain;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.179Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.elasticsearchDomain.ElasticsearchDomainAutoTuneOptionsMaintenanceSchedule")
@software.amazon.jsii.Jsii.Proxy(ElasticsearchDomainAutoTuneOptionsMaintenanceSchedule.Jsii$Proxy.class)
public interface ElasticsearchDomainAutoTuneOptionsMaintenanceSchedule extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticsearch_domain#cron_expression_for_recurrence ElasticsearchDomain#cron_expression_for_recurrence}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getCronExpressionForRecurrence();

    /**
     * duration block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticsearch_domain#duration ElasticsearchDomain#duration}
     */
    @org.jetbrains.annotations.NotNull imports.aws.elasticsearch_domain.ElasticsearchDomainAutoTuneOptionsMaintenanceScheduleDuration getDuration();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticsearch_domain#start_at ElasticsearchDomain#start_at}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getStartAt();

    /**
     * @return a {@link Builder} of {@link ElasticsearchDomainAutoTuneOptionsMaintenanceSchedule}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link ElasticsearchDomainAutoTuneOptionsMaintenanceSchedule}
     */
    public static final class Builder implements software.amazon.jsii.Builder<ElasticsearchDomainAutoTuneOptionsMaintenanceSchedule> {
        java.lang.String cronExpressionForRecurrence;
        imports.aws.elasticsearch_domain.ElasticsearchDomainAutoTuneOptionsMaintenanceScheduleDuration duration;
        java.lang.String startAt;

        /**
         * Sets the value of {@link ElasticsearchDomainAutoTuneOptionsMaintenanceSchedule#getCronExpressionForRecurrence}
         * @param cronExpressionForRecurrence Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticsearch_domain#cron_expression_for_recurrence ElasticsearchDomain#cron_expression_for_recurrence}. This parameter is required.
         * @return {@code this}
         */
        public Builder cronExpressionForRecurrence(java.lang.String cronExpressionForRecurrence) {
            this.cronExpressionForRecurrence = cronExpressionForRecurrence;
            return this;
        }

        /**
         * Sets the value of {@link ElasticsearchDomainAutoTuneOptionsMaintenanceSchedule#getDuration}
         * @param duration duration block. This parameter is required.
         *                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticsearch_domain#duration ElasticsearchDomain#duration}
         * @return {@code this}
         */
        public Builder duration(imports.aws.elasticsearch_domain.ElasticsearchDomainAutoTuneOptionsMaintenanceScheduleDuration duration) {
            this.duration = duration;
            return this;
        }

        /**
         * Sets the value of {@link ElasticsearchDomainAutoTuneOptionsMaintenanceSchedule#getStartAt}
         * @param startAt Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/elasticsearch_domain#start_at ElasticsearchDomain#start_at}. This parameter is required.
         * @return {@code this}
         */
        public Builder startAt(java.lang.String startAt) {
            this.startAt = startAt;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link ElasticsearchDomainAutoTuneOptionsMaintenanceSchedule}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public ElasticsearchDomainAutoTuneOptionsMaintenanceSchedule build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link ElasticsearchDomainAutoTuneOptionsMaintenanceSchedule}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements ElasticsearchDomainAutoTuneOptionsMaintenanceSchedule {
        private final java.lang.String cronExpressionForRecurrence;
        private final imports.aws.elasticsearch_domain.ElasticsearchDomainAutoTuneOptionsMaintenanceScheduleDuration duration;
        private final java.lang.String startAt;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.cronExpressionForRecurrence = software.amazon.jsii.Kernel.get(this, "cronExpressionForRecurrence", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.duration = software.amazon.jsii.Kernel.get(this, "duration", software.amazon.jsii.NativeType.forClass(imports.aws.elasticsearch_domain.ElasticsearchDomainAutoTuneOptionsMaintenanceScheduleDuration.class));
            this.startAt = software.amazon.jsii.Kernel.get(this, "startAt", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.cronExpressionForRecurrence = java.util.Objects.requireNonNull(builder.cronExpressionForRecurrence, "cronExpressionForRecurrence is required");
            this.duration = java.util.Objects.requireNonNull(builder.duration, "duration is required");
            this.startAt = java.util.Objects.requireNonNull(builder.startAt, "startAt is required");
        }

        @Override
        public final java.lang.String getCronExpressionForRecurrence() {
            return this.cronExpressionForRecurrence;
        }

        @Override
        public final imports.aws.elasticsearch_domain.ElasticsearchDomainAutoTuneOptionsMaintenanceScheduleDuration getDuration() {
            return this.duration;
        }

        @Override
        public final java.lang.String getStartAt() {
            return this.startAt;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("cronExpressionForRecurrence", om.valueToTree(this.getCronExpressionForRecurrence()));
            data.set("duration", om.valueToTree(this.getDuration()));
            data.set("startAt", om.valueToTree(this.getStartAt()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.elasticsearchDomain.ElasticsearchDomainAutoTuneOptionsMaintenanceSchedule"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            ElasticsearchDomainAutoTuneOptionsMaintenanceSchedule.Jsii$Proxy that = (ElasticsearchDomainAutoTuneOptionsMaintenanceSchedule.Jsii$Proxy) o;

            if (!cronExpressionForRecurrence.equals(that.cronExpressionForRecurrence)) return false;
            if (!duration.equals(that.duration)) return false;
            return this.startAt.equals(that.startAt);
        }

        @Override
        public final int hashCode() {
            int result = this.cronExpressionForRecurrence.hashCode();
            result = 31 * result + (this.duration.hashCode());
            result = 31 * result + (this.startAt.hashCode());
            return result;
        }
    }
}
