package imports.aws.budgets_budget;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.185Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.budgetsBudget.BudgetsBudgetNotification")
@software.amazon.jsii.Jsii.Proxy(BudgetsBudgetNotification.Jsii$Proxy.class)
public interface BudgetsBudgetNotification extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/budgets_budget#comparison_operator BudgetsBudget#comparison_operator}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getComparisonOperator();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/budgets_budget#notification_type BudgetsBudget#notification_type}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getNotificationType();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/budgets_budget#threshold BudgetsBudget#threshold}.
     */
    @org.jetbrains.annotations.NotNull java.lang.Number getThreshold();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/budgets_budget#threshold_type BudgetsBudget#threshold_type}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getThresholdType();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/budgets_budget#subscriber_email_addresses BudgetsBudget#subscriber_email_addresses}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getSubscriberEmailAddresses() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/budgets_budget#subscriber_sns_topic_arns BudgetsBudget#subscriber_sns_topic_arns}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getSubscriberSnsTopicArns() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link BudgetsBudgetNotification}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link BudgetsBudgetNotification}
     */
    public static final class Builder implements software.amazon.jsii.Builder<BudgetsBudgetNotification> {
        java.lang.String comparisonOperator;
        java.lang.String notificationType;
        java.lang.Number threshold;
        java.lang.String thresholdType;
        java.util.List<java.lang.String> subscriberEmailAddresses;
        java.util.List<java.lang.String> subscriberSnsTopicArns;

        /**
         * Sets the value of {@link BudgetsBudgetNotification#getComparisonOperator}
         * @param comparisonOperator Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/budgets_budget#comparison_operator BudgetsBudget#comparison_operator}. This parameter is required.
         * @return {@code this}
         */
        public Builder comparisonOperator(java.lang.String comparisonOperator) {
            this.comparisonOperator = comparisonOperator;
            return this;
        }

        /**
         * Sets the value of {@link BudgetsBudgetNotification#getNotificationType}
         * @param notificationType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/budgets_budget#notification_type BudgetsBudget#notification_type}. This parameter is required.
         * @return {@code this}
         */
        public Builder notificationType(java.lang.String notificationType) {
            this.notificationType = notificationType;
            return this;
        }

        /**
         * Sets the value of {@link BudgetsBudgetNotification#getThreshold}
         * @param threshold Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/budgets_budget#threshold BudgetsBudget#threshold}. This parameter is required.
         * @return {@code this}
         */
        public Builder threshold(java.lang.Number threshold) {
            this.threshold = threshold;
            return this;
        }

        /**
         * Sets the value of {@link BudgetsBudgetNotification#getThresholdType}
         * @param thresholdType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/budgets_budget#threshold_type BudgetsBudget#threshold_type}. This parameter is required.
         * @return {@code this}
         */
        public Builder thresholdType(java.lang.String thresholdType) {
            this.thresholdType = thresholdType;
            return this;
        }

        /**
         * Sets the value of {@link BudgetsBudgetNotification#getSubscriberEmailAddresses}
         * @param subscriberEmailAddresses Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/budgets_budget#subscriber_email_addresses BudgetsBudget#subscriber_email_addresses}.
         * @return {@code this}
         */
        public Builder subscriberEmailAddresses(java.util.List<java.lang.String> subscriberEmailAddresses) {
            this.subscriberEmailAddresses = subscriberEmailAddresses;
            return this;
        }

        /**
         * Sets the value of {@link BudgetsBudgetNotification#getSubscriberSnsTopicArns}
         * @param subscriberSnsTopicArns Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/budgets_budget#subscriber_sns_topic_arns BudgetsBudget#subscriber_sns_topic_arns}.
         * @return {@code this}
         */
        public Builder subscriberSnsTopicArns(java.util.List<java.lang.String> subscriberSnsTopicArns) {
            this.subscriberSnsTopicArns = subscriberSnsTopicArns;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link BudgetsBudgetNotification}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public BudgetsBudgetNotification build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link BudgetsBudgetNotification}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements BudgetsBudgetNotification {
        private final java.lang.String comparisonOperator;
        private final java.lang.String notificationType;
        private final java.lang.Number threshold;
        private final java.lang.String thresholdType;
        private final java.util.List<java.lang.String> subscriberEmailAddresses;
        private final java.util.List<java.lang.String> subscriberSnsTopicArns;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.comparisonOperator = software.amazon.jsii.Kernel.get(this, "comparisonOperator", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.notificationType = software.amazon.jsii.Kernel.get(this, "notificationType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.threshold = software.amazon.jsii.Kernel.get(this, "threshold", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.thresholdType = software.amazon.jsii.Kernel.get(this, "thresholdType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.subscriberEmailAddresses = software.amazon.jsii.Kernel.get(this, "subscriberEmailAddresses", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.subscriberSnsTopicArns = software.amazon.jsii.Kernel.get(this, "subscriberSnsTopicArns", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.comparisonOperator = java.util.Objects.requireNonNull(builder.comparisonOperator, "comparisonOperator is required");
            this.notificationType = java.util.Objects.requireNonNull(builder.notificationType, "notificationType is required");
            this.threshold = java.util.Objects.requireNonNull(builder.threshold, "threshold is required");
            this.thresholdType = java.util.Objects.requireNonNull(builder.thresholdType, "thresholdType is required");
            this.subscriberEmailAddresses = builder.subscriberEmailAddresses;
            this.subscriberSnsTopicArns = builder.subscriberSnsTopicArns;
        }

        @Override
        public final java.lang.String getComparisonOperator() {
            return this.comparisonOperator;
        }

        @Override
        public final java.lang.String getNotificationType() {
            return this.notificationType;
        }

        @Override
        public final java.lang.Number getThreshold() {
            return this.threshold;
        }

        @Override
        public final java.lang.String getThresholdType() {
            return this.thresholdType;
        }

        @Override
        public final java.util.List<java.lang.String> getSubscriberEmailAddresses() {
            return this.subscriberEmailAddresses;
        }

        @Override
        public final java.util.List<java.lang.String> getSubscriberSnsTopicArns() {
            return this.subscriberSnsTopicArns;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("comparisonOperator", om.valueToTree(this.getComparisonOperator()));
            data.set("notificationType", om.valueToTree(this.getNotificationType()));
            data.set("threshold", om.valueToTree(this.getThreshold()));
            data.set("thresholdType", om.valueToTree(this.getThresholdType()));
            if (this.getSubscriberEmailAddresses() != null) {
                data.set("subscriberEmailAddresses", om.valueToTree(this.getSubscriberEmailAddresses()));
            }
            if (this.getSubscriberSnsTopicArns() != null) {
                data.set("subscriberSnsTopicArns", om.valueToTree(this.getSubscriberSnsTopicArns()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.budgetsBudget.BudgetsBudgetNotification"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            BudgetsBudgetNotification.Jsii$Proxy that = (BudgetsBudgetNotification.Jsii$Proxy) o;

            if (!comparisonOperator.equals(that.comparisonOperator)) return false;
            if (!notificationType.equals(that.notificationType)) return false;
            if (!threshold.equals(that.threshold)) return false;
            if (!thresholdType.equals(that.thresholdType)) return false;
            if (this.subscriberEmailAddresses != null ? !this.subscriberEmailAddresses.equals(that.subscriberEmailAddresses) : that.subscriberEmailAddresses != null) return false;
            return this.subscriberSnsTopicArns != null ? this.subscriberSnsTopicArns.equals(that.subscriberSnsTopicArns) : that.subscriberSnsTopicArns == null;
        }

        @Override
        public final int hashCode() {
            int result = this.comparisonOperator.hashCode();
            result = 31 * result + (this.notificationType.hashCode());
            result = 31 * result + (this.threshold.hashCode());
            result = 31 * result + (this.thresholdType.hashCode());
            result = 31 * result + (this.subscriberEmailAddresses != null ? this.subscriberEmailAddresses.hashCode() : 0);
            result = 31 * result + (this.subscriberSnsTopicArns != null ? this.subscriberSnsTopicArns.hashCode() : 0);
            return result;
        }
    }
}
