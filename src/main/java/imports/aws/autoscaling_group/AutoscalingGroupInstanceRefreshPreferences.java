package imports.aws.autoscaling_group;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.096Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.autoscalingGroup.AutoscalingGroupInstanceRefreshPreferences")
@software.amazon.jsii.Jsii.Proxy(AutoscalingGroupInstanceRefreshPreferences.Jsii$Proxy.class)
public interface AutoscalingGroupInstanceRefreshPreferences extends software.amazon.jsii.JsiiSerializable {

    /**
     * alarm_specification block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#alarm_specification AutoscalingGroup#alarm_specification}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.autoscaling_group.AutoscalingGroupInstanceRefreshPreferencesAlarmSpecification getAlarmSpecification() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#auto_rollback AutoscalingGroup#auto_rollback}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getAutoRollback() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#checkpoint_delay AutoscalingGroup#checkpoint_delay}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getCheckpointDelay() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#checkpoint_percentages AutoscalingGroup#checkpoint_percentages}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.Number> getCheckpointPercentages() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#instance_warmup AutoscalingGroup#instance_warmup}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getInstanceWarmup() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#max_healthy_percentage AutoscalingGroup#max_healthy_percentage}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getMaxHealthyPercentage() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#min_healthy_percentage AutoscalingGroup#min_healthy_percentage}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getMinHealthyPercentage() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#scale_in_protected_instances AutoscalingGroup#scale_in_protected_instances}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getScaleInProtectedInstances() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#skip_matching AutoscalingGroup#skip_matching}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getSkipMatching() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#standby_instances AutoscalingGroup#standby_instances}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getStandbyInstances() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link AutoscalingGroupInstanceRefreshPreferences}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link AutoscalingGroupInstanceRefreshPreferences}
     */
    public static final class Builder implements software.amazon.jsii.Builder<AutoscalingGroupInstanceRefreshPreferences> {
        imports.aws.autoscaling_group.AutoscalingGroupInstanceRefreshPreferencesAlarmSpecification alarmSpecification;
        java.lang.Object autoRollback;
        java.lang.String checkpointDelay;
        java.util.List<java.lang.Number> checkpointPercentages;
        java.lang.String instanceWarmup;
        java.lang.Number maxHealthyPercentage;
        java.lang.Number minHealthyPercentage;
        java.lang.String scaleInProtectedInstances;
        java.lang.Object skipMatching;
        java.lang.String standbyInstances;

        /**
         * Sets the value of {@link AutoscalingGroupInstanceRefreshPreferences#getAlarmSpecification}
         * @param alarmSpecification alarm_specification block.
         *                           Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#alarm_specification AutoscalingGroup#alarm_specification}
         * @return {@code this}
         */
        public Builder alarmSpecification(imports.aws.autoscaling_group.AutoscalingGroupInstanceRefreshPreferencesAlarmSpecification alarmSpecification) {
            this.alarmSpecification = alarmSpecification;
            return this;
        }

        /**
         * Sets the value of {@link AutoscalingGroupInstanceRefreshPreferences#getAutoRollback}
         * @param autoRollback Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#auto_rollback AutoscalingGroup#auto_rollback}.
         * @return {@code this}
         */
        public Builder autoRollback(java.lang.Boolean autoRollback) {
            this.autoRollback = autoRollback;
            return this;
        }

        /**
         * Sets the value of {@link AutoscalingGroupInstanceRefreshPreferences#getAutoRollback}
         * @param autoRollback Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#auto_rollback AutoscalingGroup#auto_rollback}.
         * @return {@code this}
         */
        public Builder autoRollback(com.hashicorp.cdktf.IResolvable autoRollback) {
            this.autoRollback = autoRollback;
            return this;
        }

        /**
         * Sets the value of {@link AutoscalingGroupInstanceRefreshPreferences#getCheckpointDelay}
         * @param checkpointDelay Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#checkpoint_delay AutoscalingGroup#checkpoint_delay}.
         * @return {@code this}
         */
        public Builder checkpointDelay(java.lang.String checkpointDelay) {
            this.checkpointDelay = checkpointDelay;
            return this;
        }

        /**
         * Sets the value of {@link AutoscalingGroupInstanceRefreshPreferences#getCheckpointPercentages}
         * @param checkpointPercentages Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#checkpoint_percentages AutoscalingGroup#checkpoint_percentages}.
         * @return {@code this}
         */
        @SuppressWarnings("unchecked")
        public Builder checkpointPercentages(java.util.List<? extends java.lang.Number> checkpointPercentages) {
            this.checkpointPercentages = (java.util.List<java.lang.Number>)checkpointPercentages;
            return this;
        }

        /**
         * Sets the value of {@link AutoscalingGroupInstanceRefreshPreferences#getInstanceWarmup}
         * @param instanceWarmup Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#instance_warmup AutoscalingGroup#instance_warmup}.
         * @return {@code this}
         */
        public Builder instanceWarmup(java.lang.String instanceWarmup) {
            this.instanceWarmup = instanceWarmup;
            return this;
        }

        /**
         * Sets the value of {@link AutoscalingGroupInstanceRefreshPreferences#getMaxHealthyPercentage}
         * @param maxHealthyPercentage Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#max_healthy_percentage AutoscalingGroup#max_healthy_percentage}.
         * @return {@code this}
         */
        public Builder maxHealthyPercentage(java.lang.Number maxHealthyPercentage) {
            this.maxHealthyPercentage = maxHealthyPercentage;
            return this;
        }

        /**
         * Sets the value of {@link AutoscalingGroupInstanceRefreshPreferences#getMinHealthyPercentage}
         * @param minHealthyPercentage Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#min_healthy_percentage AutoscalingGroup#min_healthy_percentage}.
         * @return {@code this}
         */
        public Builder minHealthyPercentage(java.lang.Number minHealthyPercentage) {
            this.minHealthyPercentage = minHealthyPercentage;
            return this;
        }

        /**
         * Sets the value of {@link AutoscalingGroupInstanceRefreshPreferences#getScaleInProtectedInstances}
         * @param scaleInProtectedInstances Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#scale_in_protected_instances AutoscalingGroup#scale_in_protected_instances}.
         * @return {@code this}
         */
        public Builder scaleInProtectedInstances(java.lang.String scaleInProtectedInstances) {
            this.scaleInProtectedInstances = scaleInProtectedInstances;
            return this;
        }

        /**
         * Sets the value of {@link AutoscalingGroupInstanceRefreshPreferences#getSkipMatching}
         * @param skipMatching Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#skip_matching AutoscalingGroup#skip_matching}.
         * @return {@code this}
         */
        public Builder skipMatching(java.lang.Boolean skipMatching) {
            this.skipMatching = skipMatching;
            return this;
        }

        /**
         * Sets the value of {@link AutoscalingGroupInstanceRefreshPreferences#getSkipMatching}
         * @param skipMatching Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#skip_matching AutoscalingGroup#skip_matching}.
         * @return {@code this}
         */
        public Builder skipMatching(com.hashicorp.cdktf.IResolvable skipMatching) {
            this.skipMatching = skipMatching;
            return this;
        }

        /**
         * Sets the value of {@link AutoscalingGroupInstanceRefreshPreferences#getStandbyInstances}
         * @param standbyInstances Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/autoscaling_group#standby_instances AutoscalingGroup#standby_instances}.
         * @return {@code this}
         */
        public Builder standbyInstances(java.lang.String standbyInstances) {
            this.standbyInstances = standbyInstances;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link AutoscalingGroupInstanceRefreshPreferences}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public AutoscalingGroupInstanceRefreshPreferences build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link AutoscalingGroupInstanceRefreshPreferences}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements AutoscalingGroupInstanceRefreshPreferences {
        private final imports.aws.autoscaling_group.AutoscalingGroupInstanceRefreshPreferencesAlarmSpecification alarmSpecification;
        private final java.lang.Object autoRollback;
        private final java.lang.String checkpointDelay;
        private final java.util.List<java.lang.Number> checkpointPercentages;
        private final java.lang.String instanceWarmup;
        private final java.lang.Number maxHealthyPercentage;
        private final java.lang.Number minHealthyPercentage;
        private final java.lang.String scaleInProtectedInstances;
        private final java.lang.Object skipMatching;
        private final java.lang.String standbyInstances;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.alarmSpecification = software.amazon.jsii.Kernel.get(this, "alarmSpecification", software.amazon.jsii.NativeType.forClass(imports.aws.autoscaling_group.AutoscalingGroupInstanceRefreshPreferencesAlarmSpecification.class));
            this.autoRollback = software.amazon.jsii.Kernel.get(this, "autoRollback", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.checkpointDelay = software.amazon.jsii.Kernel.get(this, "checkpointDelay", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.checkpointPercentages = software.amazon.jsii.Kernel.get(this, "checkpointPercentages", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.Number.class)));
            this.instanceWarmup = software.amazon.jsii.Kernel.get(this, "instanceWarmup", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.maxHealthyPercentage = software.amazon.jsii.Kernel.get(this, "maxHealthyPercentage", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.minHealthyPercentage = software.amazon.jsii.Kernel.get(this, "minHealthyPercentage", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.scaleInProtectedInstances = software.amazon.jsii.Kernel.get(this, "scaleInProtectedInstances", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.skipMatching = software.amazon.jsii.Kernel.get(this, "skipMatching", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.standbyInstances = software.amazon.jsii.Kernel.get(this, "standbyInstances", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        @SuppressWarnings("unchecked")
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.alarmSpecification = builder.alarmSpecification;
            this.autoRollback = builder.autoRollback;
            this.checkpointDelay = builder.checkpointDelay;
            this.checkpointPercentages = (java.util.List<java.lang.Number>)builder.checkpointPercentages;
            this.instanceWarmup = builder.instanceWarmup;
            this.maxHealthyPercentage = builder.maxHealthyPercentage;
            this.minHealthyPercentage = builder.minHealthyPercentage;
            this.scaleInProtectedInstances = builder.scaleInProtectedInstances;
            this.skipMatching = builder.skipMatching;
            this.standbyInstances = builder.standbyInstances;
        }

        @Override
        public final imports.aws.autoscaling_group.AutoscalingGroupInstanceRefreshPreferencesAlarmSpecification getAlarmSpecification() {
            return this.alarmSpecification;
        }

        @Override
        public final java.lang.Object getAutoRollback() {
            return this.autoRollback;
        }

        @Override
        public final java.lang.String getCheckpointDelay() {
            return this.checkpointDelay;
        }

        @Override
        public final java.util.List<java.lang.Number> getCheckpointPercentages() {
            return this.checkpointPercentages;
        }

        @Override
        public final java.lang.String getInstanceWarmup() {
            return this.instanceWarmup;
        }

        @Override
        public final java.lang.Number getMaxHealthyPercentage() {
            return this.maxHealthyPercentage;
        }

        @Override
        public final java.lang.Number getMinHealthyPercentage() {
            return this.minHealthyPercentage;
        }

        @Override
        public final java.lang.String getScaleInProtectedInstances() {
            return this.scaleInProtectedInstances;
        }

        @Override
        public final java.lang.Object getSkipMatching() {
            return this.skipMatching;
        }

        @Override
        public final java.lang.String getStandbyInstances() {
            return this.standbyInstances;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getAlarmSpecification() != null) {
                data.set("alarmSpecification", om.valueToTree(this.getAlarmSpecification()));
            }
            if (this.getAutoRollback() != null) {
                data.set("autoRollback", om.valueToTree(this.getAutoRollback()));
            }
            if (this.getCheckpointDelay() != null) {
                data.set("checkpointDelay", om.valueToTree(this.getCheckpointDelay()));
            }
            if (this.getCheckpointPercentages() != null) {
                data.set("checkpointPercentages", om.valueToTree(this.getCheckpointPercentages()));
            }
            if (this.getInstanceWarmup() != null) {
                data.set("instanceWarmup", om.valueToTree(this.getInstanceWarmup()));
            }
            if (this.getMaxHealthyPercentage() != null) {
                data.set("maxHealthyPercentage", om.valueToTree(this.getMaxHealthyPercentage()));
            }
            if (this.getMinHealthyPercentage() != null) {
                data.set("minHealthyPercentage", om.valueToTree(this.getMinHealthyPercentage()));
            }
            if (this.getScaleInProtectedInstances() != null) {
                data.set("scaleInProtectedInstances", om.valueToTree(this.getScaleInProtectedInstances()));
            }
            if (this.getSkipMatching() != null) {
                data.set("skipMatching", om.valueToTree(this.getSkipMatching()));
            }
            if (this.getStandbyInstances() != null) {
                data.set("standbyInstances", om.valueToTree(this.getStandbyInstances()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.autoscalingGroup.AutoscalingGroupInstanceRefreshPreferences"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            AutoscalingGroupInstanceRefreshPreferences.Jsii$Proxy that = (AutoscalingGroupInstanceRefreshPreferences.Jsii$Proxy) o;

            if (this.alarmSpecification != null ? !this.alarmSpecification.equals(that.alarmSpecification) : that.alarmSpecification != null) return false;
            if (this.autoRollback != null ? !this.autoRollback.equals(that.autoRollback) : that.autoRollback != null) return false;
            if (this.checkpointDelay != null ? !this.checkpointDelay.equals(that.checkpointDelay) : that.checkpointDelay != null) return false;
            if (this.checkpointPercentages != null ? !this.checkpointPercentages.equals(that.checkpointPercentages) : that.checkpointPercentages != null) return false;
            if (this.instanceWarmup != null ? !this.instanceWarmup.equals(that.instanceWarmup) : that.instanceWarmup != null) return false;
            if (this.maxHealthyPercentage != null ? !this.maxHealthyPercentage.equals(that.maxHealthyPercentage) : that.maxHealthyPercentage != null) return false;
            if (this.minHealthyPercentage != null ? !this.minHealthyPercentage.equals(that.minHealthyPercentage) : that.minHealthyPercentage != null) return false;
            if (this.scaleInProtectedInstances != null ? !this.scaleInProtectedInstances.equals(that.scaleInProtectedInstances) : that.scaleInProtectedInstances != null) return false;
            if (this.skipMatching != null ? !this.skipMatching.equals(that.skipMatching) : that.skipMatching != null) return false;
            return this.standbyInstances != null ? this.standbyInstances.equals(that.standbyInstances) : that.standbyInstances == null;
        }

        @Override
        public final int hashCode() {
            int result = this.alarmSpecification != null ? this.alarmSpecification.hashCode() : 0;
            result = 31 * result + (this.autoRollback != null ? this.autoRollback.hashCode() : 0);
            result = 31 * result + (this.checkpointDelay != null ? this.checkpointDelay.hashCode() : 0);
            result = 31 * result + (this.checkpointPercentages != null ? this.checkpointPercentages.hashCode() : 0);
            result = 31 * result + (this.instanceWarmup != null ? this.instanceWarmup.hashCode() : 0);
            result = 31 * result + (this.maxHealthyPercentage != null ? this.maxHealthyPercentage.hashCode() : 0);
            result = 31 * result + (this.minHealthyPercentage != null ? this.minHealthyPercentage.hashCode() : 0);
            result = 31 * result + (this.scaleInProtectedInstances != null ? this.scaleInProtectedInstances.hashCode() : 0);
            result = 31 * result + (this.skipMatching != null ? this.skipMatching.hashCode() : 0);
            result = 31 * result + (this.standbyInstances != null ? this.standbyInstances.hashCode() : 0);
            return result;
        }
    }
}
