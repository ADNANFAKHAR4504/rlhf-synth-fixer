package imports.aws.ssmincidents_response_plan;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.516Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.ssmincidentsResponsePlan.SsmincidentsResponsePlanIncidentTemplate")
@software.amazon.jsii.Jsii.Proxy(SsmincidentsResponsePlanIncidentTemplate.Jsii$Proxy.class)
public interface SsmincidentsResponsePlanIncidentTemplate extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssmincidents_response_plan#impact SsmincidentsResponsePlan#impact}.
     */
    @org.jetbrains.annotations.NotNull java.lang.Number getImpact();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssmincidents_response_plan#title SsmincidentsResponsePlan#title}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getTitle();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssmincidents_response_plan#dedupe_string SsmincidentsResponsePlan#dedupe_string}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDedupeString() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssmincidents_response_plan#incident_tags SsmincidentsResponsePlan#incident_tags}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getIncidentTags() {
        return null;
    }

    /**
     * notification_target block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssmincidents_response_plan#notification_target SsmincidentsResponsePlan#notification_target}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getNotificationTarget() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssmincidents_response_plan#summary SsmincidentsResponsePlan#summary}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getSummary() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link SsmincidentsResponsePlanIncidentTemplate}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link SsmincidentsResponsePlanIncidentTemplate}
     */
    public static final class Builder implements software.amazon.jsii.Builder<SsmincidentsResponsePlanIncidentTemplate> {
        java.lang.Number impact;
        java.lang.String title;
        java.lang.String dedupeString;
        java.util.Map<java.lang.String, java.lang.String> incidentTags;
        java.lang.Object notificationTarget;
        java.lang.String summary;

        /**
         * Sets the value of {@link SsmincidentsResponsePlanIncidentTemplate#getImpact}
         * @param impact Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssmincidents_response_plan#impact SsmincidentsResponsePlan#impact}. This parameter is required.
         * @return {@code this}
         */
        public Builder impact(java.lang.Number impact) {
            this.impact = impact;
            return this;
        }

        /**
         * Sets the value of {@link SsmincidentsResponsePlanIncidentTemplate#getTitle}
         * @param title Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssmincidents_response_plan#title SsmincidentsResponsePlan#title}. This parameter is required.
         * @return {@code this}
         */
        public Builder title(java.lang.String title) {
            this.title = title;
            return this;
        }

        /**
         * Sets the value of {@link SsmincidentsResponsePlanIncidentTemplate#getDedupeString}
         * @param dedupeString Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssmincidents_response_plan#dedupe_string SsmincidentsResponsePlan#dedupe_string}.
         * @return {@code this}
         */
        public Builder dedupeString(java.lang.String dedupeString) {
            this.dedupeString = dedupeString;
            return this;
        }

        /**
         * Sets the value of {@link SsmincidentsResponsePlanIncidentTemplate#getIncidentTags}
         * @param incidentTags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssmincidents_response_plan#incident_tags SsmincidentsResponsePlan#incident_tags}.
         * @return {@code this}
         */
        public Builder incidentTags(java.util.Map<java.lang.String, java.lang.String> incidentTags) {
            this.incidentTags = incidentTags;
            return this;
        }

        /**
         * Sets the value of {@link SsmincidentsResponsePlanIncidentTemplate#getNotificationTarget}
         * @param notificationTarget notification_target block.
         *                           Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssmincidents_response_plan#notification_target SsmincidentsResponsePlan#notification_target}
         * @return {@code this}
         */
        public Builder notificationTarget(com.hashicorp.cdktf.IResolvable notificationTarget) {
            this.notificationTarget = notificationTarget;
            return this;
        }

        /**
         * Sets the value of {@link SsmincidentsResponsePlanIncidentTemplate#getNotificationTarget}
         * @param notificationTarget notification_target block.
         *                           Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssmincidents_response_plan#notification_target SsmincidentsResponsePlan#notification_target}
         * @return {@code this}
         */
        public Builder notificationTarget(java.util.List<? extends imports.aws.ssmincidents_response_plan.SsmincidentsResponsePlanIncidentTemplateNotificationTarget> notificationTarget) {
            this.notificationTarget = notificationTarget;
            return this;
        }

        /**
         * Sets the value of {@link SsmincidentsResponsePlanIncidentTemplate#getSummary}
         * @param summary Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssmincidents_response_plan#summary SsmincidentsResponsePlan#summary}.
         * @return {@code this}
         */
        public Builder summary(java.lang.String summary) {
            this.summary = summary;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link SsmincidentsResponsePlanIncidentTemplate}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public SsmincidentsResponsePlanIncidentTemplate build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link SsmincidentsResponsePlanIncidentTemplate}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements SsmincidentsResponsePlanIncidentTemplate {
        private final java.lang.Number impact;
        private final java.lang.String title;
        private final java.lang.String dedupeString;
        private final java.util.Map<java.lang.String, java.lang.String> incidentTags;
        private final java.lang.Object notificationTarget;
        private final java.lang.String summary;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.impact = software.amazon.jsii.Kernel.get(this, "impact", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.title = software.amazon.jsii.Kernel.get(this, "title", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.dedupeString = software.amazon.jsii.Kernel.get(this, "dedupeString", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.incidentTags = software.amazon.jsii.Kernel.get(this, "incidentTags", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.notificationTarget = software.amazon.jsii.Kernel.get(this, "notificationTarget", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.summary = software.amazon.jsii.Kernel.get(this, "summary", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.impact = java.util.Objects.requireNonNull(builder.impact, "impact is required");
            this.title = java.util.Objects.requireNonNull(builder.title, "title is required");
            this.dedupeString = builder.dedupeString;
            this.incidentTags = builder.incidentTags;
            this.notificationTarget = builder.notificationTarget;
            this.summary = builder.summary;
        }

        @Override
        public final java.lang.Number getImpact() {
            return this.impact;
        }

        @Override
        public final java.lang.String getTitle() {
            return this.title;
        }

        @Override
        public final java.lang.String getDedupeString() {
            return this.dedupeString;
        }

        @Override
        public final java.util.Map<java.lang.String, java.lang.String> getIncidentTags() {
            return this.incidentTags;
        }

        @Override
        public final java.lang.Object getNotificationTarget() {
            return this.notificationTarget;
        }

        @Override
        public final java.lang.String getSummary() {
            return this.summary;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("impact", om.valueToTree(this.getImpact()));
            data.set("title", om.valueToTree(this.getTitle()));
            if (this.getDedupeString() != null) {
                data.set("dedupeString", om.valueToTree(this.getDedupeString()));
            }
            if (this.getIncidentTags() != null) {
                data.set("incidentTags", om.valueToTree(this.getIncidentTags()));
            }
            if (this.getNotificationTarget() != null) {
                data.set("notificationTarget", om.valueToTree(this.getNotificationTarget()));
            }
            if (this.getSummary() != null) {
                data.set("summary", om.valueToTree(this.getSummary()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.ssmincidentsResponsePlan.SsmincidentsResponsePlanIncidentTemplate"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            SsmincidentsResponsePlanIncidentTemplate.Jsii$Proxy that = (SsmincidentsResponsePlanIncidentTemplate.Jsii$Proxy) o;

            if (!impact.equals(that.impact)) return false;
            if (!title.equals(that.title)) return false;
            if (this.dedupeString != null ? !this.dedupeString.equals(that.dedupeString) : that.dedupeString != null) return false;
            if (this.incidentTags != null ? !this.incidentTags.equals(that.incidentTags) : that.incidentTags != null) return false;
            if (this.notificationTarget != null ? !this.notificationTarget.equals(that.notificationTarget) : that.notificationTarget != null) return false;
            return this.summary != null ? this.summary.equals(that.summary) : that.summary == null;
        }

        @Override
        public final int hashCode() {
            int result = this.impact.hashCode();
            result = 31 * result + (this.title.hashCode());
            result = 31 * result + (this.dedupeString != null ? this.dedupeString.hashCode() : 0);
            result = 31 * result + (this.incidentTags != null ? this.incidentTags.hashCode() : 0);
            result = 31 * result + (this.notificationTarget != null ? this.notificationTarget.hashCode() : 0);
            result = 31 * result + (this.summary != null ? this.summary.hashCode() : 0);
            return result;
        }
    }
}
