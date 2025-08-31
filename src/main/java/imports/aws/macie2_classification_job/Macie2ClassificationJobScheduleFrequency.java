package imports.aws.macie2_classification_job;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.850Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.macie2ClassificationJob.Macie2ClassificationJobScheduleFrequency")
@software.amazon.jsii.Jsii.Proxy(Macie2ClassificationJobScheduleFrequency.Jsii$Proxy.class)
public interface Macie2ClassificationJobScheduleFrequency extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/macie2_classification_job#daily_schedule Macie2ClassificationJob#daily_schedule}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getDailySchedule() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/macie2_classification_job#monthly_schedule Macie2ClassificationJob#monthly_schedule}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getMonthlySchedule() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/macie2_classification_job#weekly_schedule Macie2ClassificationJob#weekly_schedule}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getWeeklySchedule() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link Macie2ClassificationJobScheduleFrequency}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link Macie2ClassificationJobScheduleFrequency}
     */
    public static final class Builder implements software.amazon.jsii.Builder<Macie2ClassificationJobScheduleFrequency> {
        java.lang.Object dailySchedule;
        java.lang.Number monthlySchedule;
        java.lang.String weeklySchedule;

        /**
         * Sets the value of {@link Macie2ClassificationJobScheduleFrequency#getDailySchedule}
         * @param dailySchedule Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/macie2_classification_job#daily_schedule Macie2ClassificationJob#daily_schedule}.
         * @return {@code this}
         */
        public Builder dailySchedule(java.lang.Boolean dailySchedule) {
            this.dailySchedule = dailySchedule;
            return this;
        }

        /**
         * Sets the value of {@link Macie2ClassificationJobScheduleFrequency#getDailySchedule}
         * @param dailySchedule Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/macie2_classification_job#daily_schedule Macie2ClassificationJob#daily_schedule}.
         * @return {@code this}
         */
        public Builder dailySchedule(com.hashicorp.cdktf.IResolvable dailySchedule) {
            this.dailySchedule = dailySchedule;
            return this;
        }

        /**
         * Sets the value of {@link Macie2ClassificationJobScheduleFrequency#getMonthlySchedule}
         * @param monthlySchedule Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/macie2_classification_job#monthly_schedule Macie2ClassificationJob#monthly_schedule}.
         * @return {@code this}
         */
        public Builder monthlySchedule(java.lang.Number monthlySchedule) {
            this.monthlySchedule = monthlySchedule;
            return this;
        }

        /**
         * Sets the value of {@link Macie2ClassificationJobScheduleFrequency#getWeeklySchedule}
         * @param weeklySchedule Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/macie2_classification_job#weekly_schedule Macie2ClassificationJob#weekly_schedule}.
         * @return {@code this}
         */
        public Builder weeklySchedule(java.lang.String weeklySchedule) {
            this.weeklySchedule = weeklySchedule;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link Macie2ClassificationJobScheduleFrequency}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public Macie2ClassificationJobScheduleFrequency build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link Macie2ClassificationJobScheduleFrequency}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements Macie2ClassificationJobScheduleFrequency {
        private final java.lang.Object dailySchedule;
        private final java.lang.Number monthlySchedule;
        private final java.lang.String weeklySchedule;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.dailySchedule = software.amazon.jsii.Kernel.get(this, "dailySchedule", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.monthlySchedule = software.amazon.jsii.Kernel.get(this, "monthlySchedule", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.weeklySchedule = software.amazon.jsii.Kernel.get(this, "weeklySchedule", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.dailySchedule = builder.dailySchedule;
            this.monthlySchedule = builder.monthlySchedule;
            this.weeklySchedule = builder.weeklySchedule;
        }

        @Override
        public final java.lang.Object getDailySchedule() {
            return this.dailySchedule;
        }

        @Override
        public final java.lang.Number getMonthlySchedule() {
            return this.monthlySchedule;
        }

        @Override
        public final java.lang.String getWeeklySchedule() {
            return this.weeklySchedule;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getDailySchedule() != null) {
                data.set("dailySchedule", om.valueToTree(this.getDailySchedule()));
            }
            if (this.getMonthlySchedule() != null) {
                data.set("monthlySchedule", om.valueToTree(this.getMonthlySchedule()));
            }
            if (this.getWeeklySchedule() != null) {
                data.set("weeklySchedule", om.valueToTree(this.getWeeklySchedule()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.macie2ClassificationJob.Macie2ClassificationJobScheduleFrequency"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            Macie2ClassificationJobScheduleFrequency.Jsii$Proxy that = (Macie2ClassificationJobScheduleFrequency.Jsii$Proxy) o;

            if (this.dailySchedule != null ? !this.dailySchedule.equals(that.dailySchedule) : that.dailySchedule != null) return false;
            if (this.monthlySchedule != null ? !this.monthlySchedule.equals(that.monthlySchedule) : that.monthlySchedule != null) return false;
            return this.weeklySchedule != null ? this.weeklySchedule.equals(that.weeklySchedule) : that.weeklySchedule == null;
        }

        @Override
        public final int hashCode() {
            int result = this.dailySchedule != null ? this.dailySchedule.hashCode() : 0;
            result = 31 * result + (this.monthlySchedule != null ? this.monthlySchedule.hashCode() : 0);
            result = 31 * result + (this.weeklySchedule != null ? this.weeklySchedule.hashCode() : 0);
            return result;
        }
    }
}
