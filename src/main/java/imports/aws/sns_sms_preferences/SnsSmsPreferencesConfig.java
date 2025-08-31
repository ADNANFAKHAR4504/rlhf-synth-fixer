package imports.aws.sns_sms_preferences;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.476Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.snsSmsPreferences.SnsSmsPreferencesConfig")
@software.amazon.jsii.Jsii.Proxy(SnsSmsPreferencesConfig.Jsii$Proxy.class)
public interface SnsSmsPreferencesConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sns_sms_preferences#default_sender_id SnsSmsPreferences#default_sender_id}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDefaultSenderId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sns_sms_preferences#default_sms_type SnsSmsPreferences#default_sms_type}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDefaultSmsType() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sns_sms_preferences#delivery_status_iam_role_arn SnsSmsPreferences#delivery_status_iam_role_arn}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDeliveryStatusIamRoleArn() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sns_sms_preferences#delivery_status_success_sampling_rate SnsSmsPreferences#delivery_status_success_sampling_rate}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDeliveryStatusSuccessSamplingRate() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sns_sms_preferences#id SnsSmsPreferences#id}.
     * <p>
     * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
     * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sns_sms_preferences#monthly_spend_limit SnsSmsPreferences#monthly_spend_limit}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getMonthlySpendLimit() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sns_sms_preferences#usage_report_s3_bucket SnsSmsPreferences#usage_report_s3_bucket}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getUsageReportS3Bucket() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link SnsSmsPreferencesConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link SnsSmsPreferencesConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<SnsSmsPreferencesConfig> {
        java.lang.String defaultSenderId;
        java.lang.String defaultSmsType;
        java.lang.String deliveryStatusIamRoleArn;
        java.lang.String deliveryStatusSuccessSamplingRate;
        java.lang.String id;
        java.lang.Number monthlySpendLimit;
        java.lang.String usageReportS3Bucket;
        java.lang.Object connection;
        java.lang.Object count;
        java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        com.hashicorp.cdktf.ITerraformIterator forEach;
        com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        com.hashicorp.cdktf.TerraformProvider provider;
        java.util.List<java.lang.Object> provisioners;

        /**
         * Sets the value of {@link SnsSmsPreferencesConfig#getDefaultSenderId}
         * @param defaultSenderId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sns_sms_preferences#default_sender_id SnsSmsPreferences#default_sender_id}.
         * @return {@code this}
         */
        public Builder defaultSenderId(java.lang.String defaultSenderId) {
            this.defaultSenderId = defaultSenderId;
            return this;
        }

        /**
         * Sets the value of {@link SnsSmsPreferencesConfig#getDefaultSmsType}
         * @param defaultSmsType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sns_sms_preferences#default_sms_type SnsSmsPreferences#default_sms_type}.
         * @return {@code this}
         */
        public Builder defaultSmsType(java.lang.String defaultSmsType) {
            this.defaultSmsType = defaultSmsType;
            return this;
        }

        /**
         * Sets the value of {@link SnsSmsPreferencesConfig#getDeliveryStatusIamRoleArn}
         * @param deliveryStatusIamRoleArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sns_sms_preferences#delivery_status_iam_role_arn SnsSmsPreferences#delivery_status_iam_role_arn}.
         * @return {@code this}
         */
        public Builder deliveryStatusIamRoleArn(java.lang.String deliveryStatusIamRoleArn) {
            this.deliveryStatusIamRoleArn = deliveryStatusIamRoleArn;
            return this;
        }

        /**
         * Sets the value of {@link SnsSmsPreferencesConfig#getDeliveryStatusSuccessSamplingRate}
         * @param deliveryStatusSuccessSamplingRate Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sns_sms_preferences#delivery_status_success_sampling_rate SnsSmsPreferences#delivery_status_success_sampling_rate}.
         * @return {@code this}
         */
        public Builder deliveryStatusSuccessSamplingRate(java.lang.String deliveryStatusSuccessSamplingRate) {
            this.deliveryStatusSuccessSamplingRate = deliveryStatusSuccessSamplingRate;
            return this;
        }

        /**
         * Sets the value of {@link SnsSmsPreferencesConfig#getId}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sns_sms_preferences#id SnsSmsPreferences#id}.
         *           Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         *           If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * @return {@code this}
         */
        public Builder id(java.lang.String id) {
            this.id = id;
            return this;
        }

        /**
         * Sets the value of {@link SnsSmsPreferencesConfig#getMonthlySpendLimit}
         * @param monthlySpendLimit Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sns_sms_preferences#monthly_spend_limit SnsSmsPreferences#monthly_spend_limit}.
         * @return {@code this}
         */
        public Builder monthlySpendLimit(java.lang.Number monthlySpendLimit) {
            this.monthlySpendLimit = monthlySpendLimit;
            return this;
        }

        /**
         * Sets the value of {@link SnsSmsPreferencesConfig#getUsageReportS3Bucket}
         * @param usageReportS3Bucket Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sns_sms_preferences#usage_report_s3_bucket SnsSmsPreferences#usage_report_s3_bucket}.
         * @return {@code this}
         */
        public Builder usageReportS3Bucket(java.lang.String usageReportS3Bucket) {
            this.usageReportS3Bucket = usageReportS3Bucket;
            return this;
        }

        /**
         * Sets the value of {@link SnsSmsPreferencesConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link SnsSmsPreferencesConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link SnsSmsPreferencesConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link SnsSmsPreferencesConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link SnsSmsPreferencesConfig#getDependsOn}
         * @param dependsOn the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        @SuppressWarnings("unchecked")
        public Builder dependsOn(java.util.List<? extends com.hashicorp.cdktf.ITerraformDependable> dependsOn) {
            this.dependsOn = (java.util.List<com.hashicorp.cdktf.ITerraformDependable>)dependsOn;
            return this;
        }

        /**
         * Sets the value of {@link SnsSmsPreferencesConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link SnsSmsPreferencesConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link SnsSmsPreferencesConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link SnsSmsPreferencesConfig#getProvisioners}
         * @param provisioners the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        @SuppressWarnings("unchecked")
        public Builder provisioners(java.util.List<? extends java.lang.Object> provisioners) {
            this.provisioners = (java.util.List<java.lang.Object>)provisioners;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link SnsSmsPreferencesConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public SnsSmsPreferencesConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link SnsSmsPreferencesConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements SnsSmsPreferencesConfig {
        private final java.lang.String defaultSenderId;
        private final java.lang.String defaultSmsType;
        private final java.lang.String deliveryStatusIamRoleArn;
        private final java.lang.String deliveryStatusSuccessSamplingRate;
        private final java.lang.String id;
        private final java.lang.Number monthlySpendLimit;
        private final java.lang.String usageReportS3Bucket;
        private final java.lang.Object connection;
        private final java.lang.Object count;
        private final java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        private final com.hashicorp.cdktf.ITerraformIterator forEach;
        private final com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        private final com.hashicorp.cdktf.TerraformProvider provider;
        private final java.util.List<java.lang.Object> provisioners;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.defaultSenderId = software.amazon.jsii.Kernel.get(this, "defaultSenderId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.defaultSmsType = software.amazon.jsii.Kernel.get(this, "defaultSmsType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.deliveryStatusIamRoleArn = software.amazon.jsii.Kernel.get(this, "deliveryStatusIamRoleArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.deliveryStatusSuccessSamplingRate = software.amazon.jsii.Kernel.get(this, "deliveryStatusSuccessSamplingRate", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.id = software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.monthlySpendLimit = software.amazon.jsii.Kernel.get(this, "monthlySpendLimit", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.usageReportS3Bucket = software.amazon.jsii.Kernel.get(this, "usageReportS3Bucket", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.connection = software.amazon.jsii.Kernel.get(this, "connection", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.count = software.amazon.jsii.Kernel.get(this, "count", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.dependsOn = software.amazon.jsii.Kernel.get(this, "dependsOn", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ITerraformDependable.class)));
            this.forEach = software.amazon.jsii.Kernel.get(this, "forEach", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ITerraformIterator.class));
            this.lifecycle = software.amazon.jsii.Kernel.get(this, "lifecycle", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.TerraformResourceLifecycle.class));
            this.provider = software.amazon.jsii.Kernel.get(this, "provider", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.TerraformProvider.class));
            this.provisioners = software.amazon.jsii.Kernel.get(this, "provisioners", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.Object.class)));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        @SuppressWarnings("unchecked")
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.defaultSenderId = builder.defaultSenderId;
            this.defaultSmsType = builder.defaultSmsType;
            this.deliveryStatusIamRoleArn = builder.deliveryStatusIamRoleArn;
            this.deliveryStatusSuccessSamplingRate = builder.deliveryStatusSuccessSamplingRate;
            this.id = builder.id;
            this.monthlySpendLimit = builder.monthlySpendLimit;
            this.usageReportS3Bucket = builder.usageReportS3Bucket;
            this.connection = builder.connection;
            this.count = builder.count;
            this.dependsOn = (java.util.List<com.hashicorp.cdktf.ITerraformDependable>)builder.dependsOn;
            this.forEach = builder.forEach;
            this.lifecycle = builder.lifecycle;
            this.provider = builder.provider;
            this.provisioners = (java.util.List<java.lang.Object>)builder.provisioners;
        }

        @Override
        public final java.lang.String getDefaultSenderId() {
            return this.defaultSenderId;
        }

        @Override
        public final java.lang.String getDefaultSmsType() {
            return this.defaultSmsType;
        }

        @Override
        public final java.lang.String getDeliveryStatusIamRoleArn() {
            return this.deliveryStatusIamRoleArn;
        }

        @Override
        public final java.lang.String getDeliveryStatusSuccessSamplingRate() {
            return this.deliveryStatusSuccessSamplingRate;
        }

        @Override
        public final java.lang.String getId() {
            return this.id;
        }

        @Override
        public final java.lang.Number getMonthlySpendLimit() {
            return this.monthlySpendLimit;
        }

        @Override
        public final java.lang.String getUsageReportS3Bucket() {
            return this.usageReportS3Bucket;
        }

        @Override
        public final java.lang.Object getConnection() {
            return this.connection;
        }

        @Override
        public final java.lang.Object getCount() {
            return this.count;
        }

        @Override
        public final java.util.List<com.hashicorp.cdktf.ITerraformDependable> getDependsOn() {
            return this.dependsOn;
        }

        @Override
        public final com.hashicorp.cdktf.ITerraformIterator getForEach() {
            return this.forEach;
        }

        @Override
        public final com.hashicorp.cdktf.TerraformResourceLifecycle getLifecycle() {
            return this.lifecycle;
        }

        @Override
        public final com.hashicorp.cdktf.TerraformProvider getProvider() {
            return this.provider;
        }

        @Override
        public final java.util.List<java.lang.Object> getProvisioners() {
            return this.provisioners;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getDefaultSenderId() != null) {
                data.set("defaultSenderId", om.valueToTree(this.getDefaultSenderId()));
            }
            if (this.getDefaultSmsType() != null) {
                data.set("defaultSmsType", om.valueToTree(this.getDefaultSmsType()));
            }
            if (this.getDeliveryStatusIamRoleArn() != null) {
                data.set("deliveryStatusIamRoleArn", om.valueToTree(this.getDeliveryStatusIamRoleArn()));
            }
            if (this.getDeliveryStatusSuccessSamplingRate() != null) {
                data.set("deliveryStatusSuccessSamplingRate", om.valueToTree(this.getDeliveryStatusSuccessSamplingRate()));
            }
            if (this.getId() != null) {
                data.set("id", om.valueToTree(this.getId()));
            }
            if (this.getMonthlySpendLimit() != null) {
                data.set("monthlySpendLimit", om.valueToTree(this.getMonthlySpendLimit()));
            }
            if (this.getUsageReportS3Bucket() != null) {
                data.set("usageReportS3Bucket", om.valueToTree(this.getUsageReportS3Bucket()));
            }
            if (this.getConnection() != null) {
                data.set("connection", om.valueToTree(this.getConnection()));
            }
            if (this.getCount() != null) {
                data.set("count", om.valueToTree(this.getCount()));
            }
            if (this.getDependsOn() != null) {
                data.set("dependsOn", om.valueToTree(this.getDependsOn()));
            }
            if (this.getForEach() != null) {
                data.set("forEach", om.valueToTree(this.getForEach()));
            }
            if (this.getLifecycle() != null) {
                data.set("lifecycle", om.valueToTree(this.getLifecycle()));
            }
            if (this.getProvider() != null) {
                data.set("provider", om.valueToTree(this.getProvider()));
            }
            if (this.getProvisioners() != null) {
                data.set("provisioners", om.valueToTree(this.getProvisioners()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.snsSmsPreferences.SnsSmsPreferencesConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            SnsSmsPreferencesConfig.Jsii$Proxy that = (SnsSmsPreferencesConfig.Jsii$Proxy) o;

            if (this.defaultSenderId != null ? !this.defaultSenderId.equals(that.defaultSenderId) : that.defaultSenderId != null) return false;
            if (this.defaultSmsType != null ? !this.defaultSmsType.equals(that.defaultSmsType) : that.defaultSmsType != null) return false;
            if (this.deliveryStatusIamRoleArn != null ? !this.deliveryStatusIamRoleArn.equals(that.deliveryStatusIamRoleArn) : that.deliveryStatusIamRoleArn != null) return false;
            if (this.deliveryStatusSuccessSamplingRate != null ? !this.deliveryStatusSuccessSamplingRate.equals(that.deliveryStatusSuccessSamplingRate) : that.deliveryStatusSuccessSamplingRate != null) return false;
            if (this.id != null ? !this.id.equals(that.id) : that.id != null) return false;
            if (this.monthlySpendLimit != null ? !this.monthlySpendLimit.equals(that.monthlySpendLimit) : that.monthlySpendLimit != null) return false;
            if (this.usageReportS3Bucket != null ? !this.usageReportS3Bucket.equals(that.usageReportS3Bucket) : that.usageReportS3Bucket != null) return false;
            if (this.connection != null ? !this.connection.equals(that.connection) : that.connection != null) return false;
            if (this.count != null ? !this.count.equals(that.count) : that.count != null) return false;
            if (this.dependsOn != null ? !this.dependsOn.equals(that.dependsOn) : that.dependsOn != null) return false;
            if (this.forEach != null ? !this.forEach.equals(that.forEach) : that.forEach != null) return false;
            if (this.lifecycle != null ? !this.lifecycle.equals(that.lifecycle) : that.lifecycle != null) return false;
            if (this.provider != null ? !this.provider.equals(that.provider) : that.provider != null) return false;
            return this.provisioners != null ? this.provisioners.equals(that.provisioners) : that.provisioners == null;
        }

        @Override
        public final int hashCode() {
            int result = this.defaultSenderId != null ? this.defaultSenderId.hashCode() : 0;
            result = 31 * result + (this.defaultSmsType != null ? this.defaultSmsType.hashCode() : 0);
            result = 31 * result + (this.deliveryStatusIamRoleArn != null ? this.deliveryStatusIamRoleArn.hashCode() : 0);
            result = 31 * result + (this.deliveryStatusSuccessSamplingRate != null ? this.deliveryStatusSuccessSamplingRate.hashCode() : 0);
            result = 31 * result + (this.id != null ? this.id.hashCode() : 0);
            result = 31 * result + (this.monthlySpendLimit != null ? this.monthlySpendLimit.hashCode() : 0);
            result = 31 * result + (this.usageReportS3Bucket != null ? this.usageReportS3Bucket.hashCode() : 0);
            result = 31 * result + (this.connection != null ? this.connection.hashCode() : 0);
            result = 31 * result + (this.count != null ? this.count.hashCode() : 0);
            result = 31 * result + (this.dependsOn != null ? this.dependsOn.hashCode() : 0);
            result = 31 * result + (this.forEach != null ? this.forEach.hashCode() : 0);
            result = 31 * result + (this.lifecycle != null ? this.lifecycle.hashCode() : 0);
            result = 31 * result + (this.provider != null ? this.provider.hashCode() : 0);
            result = 31 * result + (this.provisioners != null ? this.provisioners.hashCode() : 0);
            return result;
        }
    }
}
