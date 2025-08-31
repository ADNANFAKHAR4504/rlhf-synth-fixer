package imports.aws.ssmcontacts_rotation;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.508Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.ssmcontactsRotation.SsmcontactsRotationRecurrence")
@software.amazon.jsii.Jsii.Proxy(SsmcontactsRotationRecurrence.Jsii$Proxy.class)
public interface SsmcontactsRotationRecurrence extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssmcontacts_rotation#number_of_on_calls SsmcontactsRotation#number_of_on_calls}.
     */
    @org.jetbrains.annotations.NotNull java.lang.Number getNumberOfOnCalls();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssmcontacts_rotation#recurrence_multiplier SsmcontactsRotation#recurrence_multiplier}.
     */
    @org.jetbrains.annotations.NotNull java.lang.Number getRecurrenceMultiplier();

    /**
     * daily_settings block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssmcontacts_rotation#daily_settings SsmcontactsRotation#daily_settings}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getDailySettings() {
        return null;
    }

    /**
     * monthly_settings block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssmcontacts_rotation#monthly_settings SsmcontactsRotation#monthly_settings}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getMonthlySettings() {
        return null;
    }

    /**
     * shift_coverages block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssmcontacts_rotation#shift_coverages SsmcontactsRotation#shift_coverages}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getShiftCoverages() {
        return null;
    }

    /**
     * weekly_settings block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssmcontacts_rotation#weekly_settings SsmcontactsRotation#weekly_settings}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getWeeklySettings() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link SsmcontactsRotationRecurrence}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link SsmcontactsRotationRecurrence}
     */
    public static final class Builder implements software.amazon.jsii.Builder<SsmcontactsRotationRecurrence> {
        java.lang.Number numberOfOnCalls;
        java.lang.Number recurrenceMultiplier;
        java.lang.Object dailySettings;
        java.lang.Object monthlySettings;
        java.lang.Object shiftCoverages;
        java.lang.Object weeklySettings;

        /**
         * Sets the value of {@link SsmcontactsRotationRecurrence#getNumberOfOnCalls}
         * @param numberOfOnCalls Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssmcontacts_rotation#number_of_on_calls SsmcontactsRotation#number_of_on_calls}. This parameter is required.
         * @return {@code this}
         */
        public Builder numberOfOnCalls(java.lang.Number numberOfOnCalls) {
            this.numberOfOnCalls = numberOfOnCalls;
            return this;
        }

        /**
         * Sets the value of {@link SsmcontactsRotationRecurrence#getRecurrenceMultiplier}
         * @param recurrenceMultiplier Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssmcontacts_rotation#recurrence_multiplier SsmcontactsRotation#recurrence_multiplier}. This parameter is required.
         * @return {@code this}
         */
        public Builder recurrenceMultiplier(java.lang.Number recurrenceMultiplier) {
            this.recurrenceMultiplier = recurrenceMultiplier;
            return this;
        }

        /**
         * Sets the value of {@link SsmcontactsRotationRecurrence#getDailySettings}
         * @param dailySettings daily_settings block.
         *                      Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssmcontacts_rotation#daily_settings SsmcontactsRotation#daily_settings}
         * @return {@code this}
         */
        public Builder dailySettings(com.hashicorp.cdktf.IResolvable dailySettings) {
            this.dailySettings = dailySettings;
            return this;
        }

        /**
         * Sets the value of {@link SsmcontactsRotationRecurrence#getDailySettings}
         * @param dailySettings daily_settings block.
         *                      Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssmcontacts_rotation#daily_settings SsmcontactsRotation#daily_settings}
         * @return {@code this}
         */
        public Builder dailySettings(java.util.List<? extends imports.aws.ssmcontacts_rotation.SsmcontactsRotationRecurrenceDailySettings> dailySettings) {
            this.dailySettings = dailySettings;
            return this;
        }

        /**
         * Sets the value of {@link SsmcontactsRotationRecurrence#getMonthlySettings}
         * @param monthlySettings monthly_settings block.
         *                        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssmcontacts_rotation#monthly_settings SsmcontactsRotation#monthly_settings}
         * @return {@code this}
         */
        public Builder monthlySettings(com.hashicorp.cdktf.IResolvable monthlySettings) {
            this.monthlySettings = monthlySettings;
            return this;
        }

        /**
         * Sets the value of {@link SsmcontactsRotationRecurrence#getMonthlySettings}
         * @param monthlySettings monthly_settings block.
         *                        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssmcontacts_rotation#monthly_settings SsmcontactsRotation#monthly_settings}
         * @return {@code this}
         */
        public Builder monthlySettings(java.util.List<? extends imports.aws.ssmcontacts_rotation.SsmcontactsRotationRecurrenceMonthlySettings> monthlySettings) {
            this.monthlySettings = monthlySettings;
            return this;
        }

        /**
         * Sets the value of {@link SsmcontactsRotationRecurrence#getShiftCoverages}
         * @param shiftCoverages shift_coverages block.
         *                       Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssmcontacts_rotation#shift_coverages SsmcontactsRotation#shift_coverages}
         * @return {@code this}
         */
        public Builder shiftCoverages(com.hashicorp.cdktf.IResolvable shiftCoverages) {
            this.shiftCoverages = shiftCoverages;
            return this;
        }

        /**
         * Sets the value of {@link SsmcontactsRotationRecurrence#getShiftCoverages}
         * @param shiftCoverages shift_coverages block.
         *                       Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssmcontacts_rotation#shift_coverages SsmcontactsRotation#shift_coverages}
         * @return {@code this}
         */
        public Builder shiftCoverages(java.util.List<? extends imports.aws.ssmcontacts_rotation.SsmcontactsRotationRecurrenceShiftCoverages> shiftCoverages) {
            this.shiftCoverages = shiftCoverages;
            return this;
        }

        /**
         * Sets the value of {@link SsmcontactsRotationRecurrence#getWeeklySettings}
         * @param weeklySettings weekly_settings block.
         *                       Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssmcontacts_rotation#weekly_settings SsmcontactsRotation#weekly_settings}
         * @return {@code this}
         */
        public Builder weeklySettings(com.hashicorp.cdktf.IResolvable weeklySettings) {
            this.weeklySettings = weeklySettings;
            return this;
        }

        /**
         * Sets the value of {@link SsmcontactsRotationRecurrence#getWeeklySettings}
         * @param weeklySettings weekly_settings block.
         *                       Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ssmcontacts_rotation#weekly_settings SsmcontactsRotation#weekly_settings}
         * @return {@code this}
         */
        public Builder weeklySettings(java.util.List<? extends imports.aws.ssmcontacts_rotation.SsmcontactsRotationRecurrenceWeeklySettings> weeklySettings) {
            this.weeklySettings = weeklySettings;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link SsmcontactsRotationRecurrence}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public SsmcontactsRotationRecurrence build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link SsmcontactsRotationRecurrence}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements SsmcontactsRotationRecurrence {
        private final java.lang.Number numberOfOnCalls;
        private final java.lang.Number recurrenceMultiplier;
        private final java.lang.Object dailySettings;
        private final java.lang.Object monthlySettings;
        private final java.lang.Object shiftCoverages;
        private final java.lang.Object weeklySettings;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.numberOfOnCalls = software.amazon.jsii.Kernel.get(this, "numberOfOnCalls", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.recurrenceMultiplier = software.amazon.jsii.Kernel.get(this, "recurrenceMultiplier", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.dailySettings = software.amazon.jsii.Kernel.get(this, "dailySettings", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.monthlySettings = software.amazon.jsii.Kernel.get(this, "monthlySettings", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.shiftCoverages = software.amazon.jsii.Kernel.get(this, "shiftCoverages", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.weeklySettings = software.amazon.jsii.Kernel.get(this, "weeklySettings", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.numberOfOnCalls = java.util.Objects.requireNonNull(builder.numberOfOnCalls, "numberOfOnCalls is required");
            this.recurrenceMultiplier = java.util.Objects.requireNonNull(builder.recurrenceMultiplier, "recurrenceMultiplier is required");
            this.dailySettings = builder.dailySettings;
            this.monthlySettings = builder.monthlySettings;
            this.shiftCoverages = builder.shiftCoverages;
            this.weeklySettings = builder.weeklySettings;
        }

        @Override
        public final java.lang.Number getNumberOfOnCalls() {
            return this.numberOfOnCalls;
        }

        @Override
        public final java.lang.Number getRecurrenceMultiplier() {
            return this.recurrenceMultiplier;
        }

        @Override
        public final java.lang.Object getDailySettings() {
            return this.dailySettings;
        }

        @Override
        public final java.lang.Object getMonthlySettings() {
            return this.monthlySettings;
        }

        @Override
        public final java.lang.Object getShiftCoverages() {
            return this.shiftCoverages;
        }

        @Override
        public final java.lang.Object getWeeklySettings() {
            return this.weeklySettings;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("numberOfOnCalls", om.valueToTree(this.getNumberOfOnCalls()));
            data.set("recurrenceMultiplier", om.valueToTree(this.getRecurrenceMultiplier()));
            if (this.getDailySettings() != null) {
                data.set("dailySettings", om.valueToTree(this.getDailySettings()));
            }
            if (this.getMonthlySettings() != null) {
                data.set("monthlySettings", om.valueToTree(this.getMonthlySettings()));
            }
            if (this.getShiftCoverages() != null) {
                data.set("shiftCoverages", om.valueToTree(this.getShiftCoverages()));
            }
            if (this.getWeeklySettings() != null) {
                data.set("weeklySettings", om.valueToTree(this.getWeeklySettings()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.ssmcontactsRotation.SsmcontactsRotationRecurrence"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            SsmcontactsRotationRecurrence.Jsii$Proxy that = (SsmcontactsRotationRecurrence.Jsii$Proxy) o;

            if (!numberOfOnCalls.equals(that.numberOfOnCalls)) return false;
            if (!recurrenceMultiplier.equals(that.recurrenceMultiplier)) return false;
            if (this.dailySettings != null ? !this.dailySettings.equals(that.dailySettings) : that.dailySettings != null) return false;
            if (this.monthlySettings != null ? !this.monthlySettings.equals(that.monthlySettings) : that.monthlySettings != null) return false;
            if (this.shiftCoverages != null ? !this.shiftCoverages.equals(that.shiftCoverages) : that.shiftCoverages != null) return false;
            return this.weeklySettings != null ? this.weeklySettings.equals(that.weeklySettings) : that.weeklySettings == null;
        }

        @Override
        public final int hashCode() {
            int result = this.numberOfOnCalls.hashCode();
            result = 31 * result + (this.recurrenceMultiplier.hashCode());
            result = 31 * result + (this.dailySettings != null ? this.dailySettings.hashCode() : 0);
            result = 31 * result + (this.monthlySettings != null ? this.monthlySettings.hashCode() : 0);
            result = 31 * result + (this.shiftCoverages != null ? this.shiftCoverages.hashCode() : 0);
            result = 31 * result + (this.weeklySettings != null ? this.weeklySettings.hashCode() : 0);
            return result;
        }
    }
}
