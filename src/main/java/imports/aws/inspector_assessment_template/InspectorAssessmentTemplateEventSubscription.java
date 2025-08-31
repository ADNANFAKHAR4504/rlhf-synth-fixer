package imports.aws.inspector_assessment_template;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.386Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.inspectorAssessmentTemplate.InspectorAssessmentTemplateEventSubscription")
@software.amazon.jsii.Jsii.Proxy(InspectorAssessmentTemplateEventSubscription.Jsii$Proxy.class)
public interface InspectorAssessmentTemplateEventSubscription extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector_assessment_template#event InspectorAssessmentTemplate#event}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getEvent();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector_assessment_template#topic_arn InspectorAssessmentTemplate#topic_arn}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getTopicArn();

    /**
     * @return a {@link Builder} of {@link InspectorAssessmentTemplateEventSubscription}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link InspectorAssessmentTemplateEventSubscription}
     */
    public static final class Builder implements software.amazon.jsii.Builder<InspectorAssessmentTemplateEventSubscription> {
        java.lang.String event;
        java.lang.String topicArn;

        /**
         * Sets the value of {@link InspectorAssessmentTemplateEventSubscription#getEvent}
         * @param event Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector_assessment_template#event InspectorAssessmentTemplate#event}. This parameter is required.
         * @return {@code this}
         */
        public Builder event(java.lang.String event) {
            this.event = event;
            return this;
        }

        /**
         * Sets the value of {@link InspectorAssessmentTemplateEventSubscription#getTopicArn}
         * @param topicArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector_assessment_template#topic_arn InspectorAssessmentTemplate#topic_arn}. This parameter is required.
         * @return {@code this}
         */
        public Builder topicArn(java.lang.String topicArn) {
            this.topicArn = topicArn;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link InspectorAssessmentTemplateEventSubscription}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public InspectorAssessmentTemplateEventSubscription build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link InspectorAssessmentTemplateEventSubscription}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements InspectorAssessmentTemplateEventSubscription {
        private final java.lang.String event;
        private final java.lang.String topicArn;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.event = software.amazon.jsii.Kernel.get(this, "event", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.topicArn = software.amazon.jsii.Kernel.get(this, "topicArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.event = java.util.Objects.requireNonNull(builder.event, "event is required");
            this.topicArn = java.util.Objects.requireNonNull(builder.topicArn, "topicArn is required");
        }

        @Override
        public final java.lang.String getEvent() {
            return this.event;
        }

        @Override
        public final java.lang.String getTopicArn() {
            return this.topicArn;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("event", om.valueToTree(this.getEvent()));
            data.set("topicArn", om.valueToTree(this.getTopicArn()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.inspectorAssessmentTemplate.InspectorAssessmentTemplateEventSubscription"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            InspectorAssessmentTemplateEventSubscription.Jsii$Proxy that = (InspectorAssessmentTemplateEventSubscription.Jsii$Proxy) o;

            if (!event.equals(that.event)) return false;
            return this.topicArn.equals(that.topicArn);
        }

        @Override
        public final int hashCode() {
            int result = this.event.hashCode();
            result = 31 * result + (this.topicArn.hashCode());
            return result;
        }
    }
}
