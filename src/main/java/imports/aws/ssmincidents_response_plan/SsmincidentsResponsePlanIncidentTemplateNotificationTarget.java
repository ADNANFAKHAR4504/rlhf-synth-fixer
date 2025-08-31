package imports.aws.ssmincidents_response_plan;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.517Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.ssmincidentsResponsePlan.SsmincidentsResponsePlanIncidentTemplateNotificationTarget")
@software.amazon.jsii.Jsii.Proxy(SsmincidentsResponsePlanIncidentTemplateNotificationTarget.Jsii$Proxy.class)
public interface SsmincidentsResponsePlanIncidentTemplateNotificationTarget extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssmincidents_response_plan#sns_topic_arn SsmincidentsResponsePlan#sns_topic_arn}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getSnsTopicArn();

    /**
     * @return a {@link Builder} of {@link SsmincidentsResponsePlanIncidentTemplateNotificationTarget}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link SsmincidentsResponsePlanIncidentTemplateNotificationTarget}
     */
    public static final class Builder implements software.amazon.jsii.Builder<SsmincidentsResponsePlanIncidentTemplateNotificationTarget> {
        java.lang.String snsTopicArn;

        /**
         * Sets the value of {@link SsmincidentsResponsePlanIncidentTemplateNotificationTarget#getSnsTopicArn}
         * @param snsTopicArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssmincidents_response_plan#sns_topic_arn SsmincidentsResponsePlan#sns_topic_arn}. This parameter is required.
         * @return {@code this}
         */
        public Builder snsTopicArn(java.lang.String snsTopicArn) {
            this.snsTopicArn = snsTopicArn;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link SsmincidentsResponsePlanIncidentTemplateNotificationTarget}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public SsmincidentsResponsePlanIncidentTemplateNotificationTarget build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link SsmincidentsResponsePlanIncidentTemplateNotificationTarget}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements SsmincidentsResponsePlanIncidentTemplateNotificationTarget {
        private final java.lang.String snsTopicArn;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.snsTopicArn = software.amazon.jsii.Kernel.get(this, "snsTopicArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.snsTopicArn = java.util.Objects.requireNonNull(builder.snsTopicArn, "snsTopicArn is required");
        }

        @Override
        public final java.lang.String getSnsTopicArn() {
            return this.snsTopicArn;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("snsTopicArn", om.valueToTree(this.getSnsTopicArn()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.ssmincidentsResponsePlan.SsmincidentsResponsePlanIncidentTemplateNotificationTarget"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            SsmincidentsResponsePlanIncidentTemplateNotificationTarget.Jsii$Proxy that = (SsmincidentsResponsePlanIncidentTemplateNotificationTarget.Jsii$Proxy) o;

            return this.snsTopicArn.equals(that.snsTopicArn);
        }

        @Override
        public final int hashCode() {
            int result = this.snsTopicArn.hashCode();
            return result;
        }
    }
}
