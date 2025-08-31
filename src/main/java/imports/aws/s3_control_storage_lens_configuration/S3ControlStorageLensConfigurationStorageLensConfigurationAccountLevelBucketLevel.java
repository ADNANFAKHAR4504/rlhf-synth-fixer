package imports.aws.s3_control_storage_lens_configuration;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.285Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.s3ControlStorageLensConfiguration.S3ControlStorageLensConfigurationStorageLensConfigurationAccountLevelBucketLevel")
@software.amazon.jsii.Jsii.Proxy(S3ControlStorageLensConfigurationStorageLensConfigurationAccountLevelBucketLevel.Jsii$Proxy.class)
public interface S3ControlStorageLensConfigurationStorageLensConfigurationAccountLevelBucketLevel extends software.amazon.jsii.JsiiSerializable {

    /**
     * activity_metrics block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3control_storage_lens_configuration#activity_metrics S3ControlStorageLensConfiguration#activity_metrics}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.s3_control_storage_lens_configuration.S3ControlStorageLensConfigurationStorageLensConfigurationAccountLevelBucketLevelActivityMetrics getActivityMetrics() {
        return null;
    }

    /**
     * advanced_cost_optimization_metrics block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3control_storage_lens_configuration#advanced_cost_optimization_metrics S3ControlStorageLensConfiguration#advanced_cost_optimization_metrics}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.s3_control_storage_lens_configuration.S3ControlStorageLensConfigurationStorageLensConfigurationAccountLevelBucketLevelAdvancedCostOptimizationMetrics getAdvancedCostOptimizationMetrics() {
        return null;
    }

    /**
     * advanced_data_protection_metrics block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3control_storage_lens_configuration#advanced_data_protection_metrics S3ControlStorageLensConfiguration#advanced_data_protection_metrics}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.s3_control_storage_lens_configuration.S3ControlStorageLensConfigurationStorageLensConfigurationAccountLevelBucketLevelAdvancedDataProtectionMetrics getAdvancedDataProtectionMetrics() {
        return null;
    }

    /**
     * detailed_status_code_metrics block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3control_storage_lens_configuration#detailed_status_code_metrics S3ControlStorageLensConfiguration#detailed_status_code_metrics}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.s3_control_storage_lens_configuration.S3ControlStorageLensConfigurationStorageLensConfigurationAccountLevelBucketLevelDetailedStatusCodeMetrics getDetailedStatusCodeMetrics() {
        return null;
    }

    /**
     * prefix_level block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3control_storage_lens_configuration#prefix_level S3ControlStorageLensConfiguration#prefix_level}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.s3_control_storage_lens_configuration.S3ControlStorageLensConfigurationStorageLensConfigurationAccountLevelBucketLevelPrefixLevel getPrefixLevel() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link S3ControlStorageLensConfigurationStorageLensConfigurationAccountLevelBucketLevel}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link S3ControlStorageLensConfigurationStorageLensConfigurationAccountLevelBucketLevel}
     */
    public static final class Builder implements software.amazon.jsii.Builder<S3ControlStorageLensConfigurationStorageLensConfigurationAccountLevelBucketLevel> {
        imports.aws.s3_control_storage_lens_configuration.S3ControlStorageLensConfigurationStorageLensConfigurationAccountLevelBucketLevelActivityMetrics activityMetrics;
        imports.aws.s3_control_storage_lens_configuration.S3ControlStorageLensConfigurationStorageLensConfigurationAccountLevelBucketLevelAdvancedCostOptimizationMetrics advancedCostOptimizationMetrics;
        imports.aws.s3_control_storage_lens_configuration.S3ControlStorageLensConfigurationStorageLensConfigurationAccountLevelBucketLevelAdvancedDataProtectionMetrics advancedDataProtectionMetrics;
        imports.aws.s3_control_storage_lens_configuration.S3ControlStorageLensConfigurationStorageLensConfigurationAccountLevelBucketLevelDetailedStatusCodeMetrics detailedStatusCodeMetrics;
        imports.aws.s3_control_storage_lens_configuration.S3ControlStorageLensConfigurationStorageLensConfigurationAccountLevelBucketLevelPrefixLevel prefixLevel;

        /**
         * Sets the value of {@link S3ControlStorageLensConfigurationStorageLensConfigurationAccountLevelBucketLevel#getActivityMetrics}
         * @param activityMetrics activity_metrics block.
         *                        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3control_storage_lens_configuration#activity_metrics S3ControlStorageLensConfiguration#activity_metrics}
         * @return {@code this}
         */
        public Builder activityMetrics(imports.aws.s3_control_storage_lens_configuration.S3ControlStorageLensConfigurationStorageLensConfigurationAccountLevelBucketLevelActivityMetrics activityMetrics) {
            this.activityMetrics = activityMetrics;
            return this;
        }

        /**
         * Sets the value of {@link S3ControlStorageLensConfigurationStorageLensConfigurationAccountLevelBucketLevel#getAdvancedCostOptimizationMetrics}
         * @param advancedCostOptimizationMetrics advanced_cost_optimization_metrics block.
         *                                        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3control_storage_lens_configuration#advanced_cost_optimization_metrics S3ControlStorageLensConfiguration#advanced_cost_optimization_metrics}
         * @return {@code this}
         */
        public Builder advancedCostOptimizationMetrics(imports.aws.s3_control_storage_lens_configuration.S3ControlStorageLensConfigurationStorageLensConfigurationAccountLevelBucketLevelAdvancedCostOptimizationMetrics advancedCostOptimizationMetrics) {
            this.advancedCostOptimizationMetrics = advancedCostOptimizationMetrics;
            return this;
        }

        /**
         * Sets the value of {@link S3ControlStorageLensConfigurationStorageLensConfigurationAccountLevelBucketLevel#getAdvancedDataProtectionMetrics}
         * @param advancedDataProtectionMetrics advanced_data_protection_metrics block.
         *                                      Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3control_storage_lens_configuration#advanced_data_protection_metrics S3ControlStorageLensConfiguration#advanced_data_protection_metrics}
         * @return {@code this}
         */
        public Builder advancedDataProtectionMetrics(imports.aws.s3_control_storage_lens_configuration.S3ControlStorageLensConfigurationStorageLensConfigurationAccountLevelBucketLevelAdvancedDataProtectionMetrics advancedDataProtectionMetrics) {
            this.advancedDataProtectionMetrics = advancedDataProtectionMetrics;
            return this;
        }

        /**
         * Sets the value of {@link S3ControlStorageLensConfigurationStorageLensConfigurationAccountLevelBucketLevel#getDetailedStatusCodeMetrics}
         * @param detailedStatusCodeMetrics detailed_status_code_metrics block.
         *                                  Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3control_storage_lens_configuration#detailed_status_code_metrics S3ControlStorageLensConfiguration#detailed_status_code_metrics}
         * @return {@code this}
         */
        public Builder detailedStatusCodeMetrics(imports.aws.s3_control_storage_lens_configuration.S3ControlStorageLensConfigurationStorageLensConfigurationAccountLevelBucketLevelDetailedStatusCodeMetrics detailedStatusCodeMetrics) {
            this.detailedStatusCodeMetrics = detailedStatusCodeMetrics;
            return this;
        }

        /**
         * Sets the value of {@link S3ControlStorageLensConfigurationStorageLensConfigurationAccountLevelBucketLevel#getPrefixLevel}
         * @param prefixLevel prefix_level block.
         *                    Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/s3control_storage_lens_configuration#prefix_level S3ControlStorageLensConfiguration#prefix_level}
         * @return {@code this}
         */
        public Builder prefixLevel(imports.aws.s3_control_storage_lens_configuration.S3ControlStorageLensConfigurationStorageLensConfigurationAccountLevelBucketLevelPrefixLevel prefixLevel) {
            this.prefixLevel = prefixLevel;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link S3ControlStorageLensConfigurationStorageLensConfigurationAccountLevelBucketLevel}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public S3ControlStorageLensConfigurationStorageLensConfigurationAccountLevelBucketLevel build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link S3ControlStorageLensConfigurationStorageLensConfigurationAccountLevelBucketLevel}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements S3ControlStorageLensConfigurationStorageLensConfigurationAccountLevelBucketLevel {
        private final imports.aws.s3_control_storage_lens_configuration.S3ControlStorageLensConfigurationStorageLensConfigurationAccountLevelBucketLevelActivityMetrics activityMetrics;
        private final imports.aws.s3_control_storage_lens_configuration.S3ControlStorageLensConfigurationStorageLensConfigurationAccountLevelBucketLevelAdvancedCostOptimizationMetrics advancedCostOptimizationMetrics;
        private final imports.aws.s3_control_storage_lens_configuration.S3ControlStorageLensConfigurationStorageLensConfigurationAccountLevelBucketLevelAdvancedDataProtectionMetrics advancedDataProtectionMetrics;
        private final imports.aws.s3_control_storage_lens_configuration.S3ControlStorageLensConfigurationStorageLensConfigurationAccountLevelBucketLevelDetailedStatusCodeMetrics detailedStatusCodeMetrics;
        private final imports.aws.s3_control_storage_lens_configuration.S3ControlStorageLensConfigurationStorageLensConfigurationAccountLevelBucketLevelPrefixLevel prefixLevel;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.activityMetrics = software.amazon.jsii.Kernel.get(this, "activityMetrics", software.amazon.jsii.NativeType.forClass(imports.aws.s3_control_storage_lens_configuration.S3ControlStorageLensConfigurationStorageLensConfigurationAccountLevelBucketLevelActivityMetrics.class));
            this.advancedCostOptimizationMetrics = software.amazon.jsii.Kernel.get(this, "advancedCostOptimizationMetrics", software.amazon.jsii.NativeType.forClass(imports.aws.s3_control_storage_lens_configuration.S3ControlStorageLensConfigurationStorageLensConfigurationAccountLevelBucketLevelAdvancedCostOptimizationMetrics.class));
            this.advancedDataProtectionMetrics = software.amazon.jsii.Kernel.get(this, "advancedDataProtectionMetrics", software.amazon.jsii.NativeType.forClass(imports.aws.s3_control_storage_lens_configuration.S3ControlStorageLensConfigurationStorageLensConfigurationAccountLevelBucketLevelAdvancedDataProtectionMetrics.class));
            this.detailedStatusCodeMetrics = software.amazon.jsii.Kernel.get(this, "detailedStatusCodeMetrics", software.amazon.jsii.NativeType.forClass(imports.aws.s3_control_storage_lens_configuration.S3ControlStorageLensConfigurationStorageLensConfigurationAccountLevelBucketLevelDetailedStatusCodeMetrics.class));
            this.prefixLevel = software.amazon.jsii.Kernel.get(this, "prefixLevel", software.amazon.jsii.NativeType.forClass(imports.aws.s3_control_storage_lens_configuration.S3ControlStorageLensConfigurationStorageLensConfigurationAccountLevelBucketLevelPrefixLevel.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.activityMetrics = builder.activityMetrics;
            this.advancedCostOptimizationMetrics = builder.advancedCostOptimizationMetrics;
            this.advancedDataProtectionMetrics = builder.advancedDataProtectionMetrics;
            this.detailedStatusCodeMetrics = builder.detailedStatusCodeMetrics;
            this.prefixLevel = builder.prefixLevel;
        }

        @Override
        public final imports.aws.s3_control_storage_lens_configuration.S3ControlStorageLensConfigurationStorageLensConfigurationAccountLevelBucketLevelActivityMetrics getActivityMetrics() {
            return this.activityMetrics;
        }

        @Override
        public final imports.aws.s3_control_storage_lens_configuration.S3ControlStorageLensConfigurationStorageLensConfigurationAccountLevelBucketLevelAdvancedCostOptimizationMetrics getAdvancedCostOptimizationMetrics() {
            return this.advancedCostOptimizationMetrics;
        }

        @Override
        public final imports.aws.s3_control_storage_lens_configuration.S3ControlStorageLensConfigurationStorageLensConfigurationAccountLevelBucketLevelAdvancedDataProtectionMetrics getAdvancedDataProtectionMetrics() {
            return this.advancedDataProtectionMetrics;
        }

        @Override
        public final imports.aws.s3_control_storage_lens_configuration.S3ControlStorageLensConfigurationStorageLensConfigurationAccountLevelBucketLevelDetailedStatusCodeMetrics getDetailedStatusCodeMetrics() {
            return this.detailedStatusCodeMetrics;
        }

        @Override
        public final imports.aws.s3_control_storage_lens_configuration.S3ControlStorageLensConfigurationStorageLensConfigurationAccountLevelBucketLevelPrefixLevel getPrefixLevel() {
            return this.prefixLevel;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getActivityMetrics() != null) {
                data.set("activityMetrics", om.valueToTree(this.getActivityMetrics()));
            }
            if (this.getAdvancedCostOptimizationMetrics() != null) {
                data.set("advancedCostOptimizationMetrics", om.valueToTree(this.getAdvancedCostOptimizationMetrics()));
            }
            if (this.getAdvancedDataProtectionMetrics() != null) {
                data.set("advancedDataProtectionMetrics", om.valueToTree(this.getAdvancedDataProtectionMetrics()));
            }
            if (this.getDetailedStatusCodeMetrics() != null) {
                data.set("detailedStatusCodeMetrics", om.valueToTree(this.getDetailedStatusCodeMetrics()));
            }
            if (this.getPrefixLevel() != null) {
                data.set("prefixLevel", om.valueToTree(this.getPrefixLevel()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.s3ControlStorageLensConfiguration.S3ControlStorageLensConfigurationStorageLensConfigurationAccountLevelBucketLevel"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            S3ControlStorageLensConfigurationStorageLensConfigurationAccountLevelBucketLevel.Jsii$Proxy that = (S3ControlStorageLensConfigurationStorageLensConfigurationAccountLevelBucketLevel.Jsii$Proxy) o;

            if (this.activityMetrics != null ? !this.activityMetrics.equals(that.activityMetrics) : that.activityMetrics != null) return false;
            if (this.advancedCostOptimizationMetrics != null ? !this.advancedCostOptimizationMetrics.equals(that.advancedCostOptimizationMetrics) : that.advancedCostOptimizationMetrics != null) return false;
            if (this.advancedDataProtectionMetrics != null ? !this.advancedDataProtectionMetrics.equals(that.advancedDataProtectionMetrics) : that.advancedDataProtectionMetrics != null) return false;
            if (this.detailedStatusCodeMetrics != null ? !this.detailedStatusCodeMetrics.equals(that.detailedStatusCodeMetrics) : that.detailedStatusCodeMetrics != null) return false;
            return this.prefixLevel != null ? this.prefixLevel.equals(that.prefixLevel) : that.prefixLevel == null;
        }

        @Override
        public final int hashCode() {
            int result = this.activityMetrics != null ? this.activityMetrics.hashCode() : 0;
            result = 31 * result + (this.advancedCostOptimizationMetrics != null ? this.advancedCostOptimizationMetrics.hashCode() : 0);
            result = 31 * result + (this.advancedDataProtectionMetrics != null ? this.advancedDataProtectionMetrics.hashCode() : 0);
            result = 31 * result + (this.detailedStatusCodeMetrics != null ? this.detailedStatusCodeMetrics.hashCode() : 0);
            result = 31 * result + (this.prefixLevel != null ? this.prefixLevel.hashCode() : 0);
            return result;
        }
    }
}
