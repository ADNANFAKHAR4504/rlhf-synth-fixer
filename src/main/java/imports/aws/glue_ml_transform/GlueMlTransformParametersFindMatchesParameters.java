package imports.aws.glue_ml_transform;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.297Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.glueMlTransform.GlueMlTransformParametersFindMatchesParameters")
@software.amazon.jsii.Jsii.Proxy(GlueMlTransformParametersFindMatchesParameters.Jsii$Proxy.class)
public interface GlueMlTransformParametersFindMatchesParameters extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_ml_transform#accuracy_cost_trade_off GlueMlTransform#accuracy_cost_trade_off}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getAccuracyCostTradeOff() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_ml_transform#enforce_provided_labels GlueMlTransform#enforce_provided_labels}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getEnforceProvidedLabels() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_ml_transform#precision_recall_trade_off GlueMlTransform#precision_recall_trade_off}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getPrecisionRecallTradeOff() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_ml_transform#primary_key_column_name GlueMlTransform#primary_key_column_name}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getPrimaryKeyColumnName() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link GlueMlTransformParametersFindMatchesParameters}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link GlueMlTransformParametersFindMatchesParameters}
     */
    public static final class Builder implements software.amazon.jsii.Builder<GlueMlTransformParametersFindMatchesParameters> {
        java.lang.Number accuracyCostTradeOff;
        java.lang.Object enforceProvidedLabels;
        java.lang.Number precisionRecallTradeOff;
        java.lang.String primaryKeyColumnName;

        /**
         * Sets the value of {@link GlueMlTransformParametersFindMatchesParameters#getAccuracyCostTradeOff}
         * @param accuracyCostTradeOff Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_ml_transform#accuracy_cost_trade_off GlueMlTransform#accuracy_cost_trade_off}.
         * @return {@code this}
         */
        public Builder accuracyCostTradeOff(java.lang.Number accuracyCostTradeOff) {
            this.accuracyCostTradeOff = accuracyCostTradeOff;
            return this;
        }

        /**
         * Sets the value of {@link GlueMlTransformParametersFindMatchesParameters#getEnforceProvidedLabels}
         * @param enforceProvidedLabels Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_ml_transform#enforce_provided_labels GlueMlTransform#enforce_provided_labels}.
         * @return {@code this}
         */
        public Builder enforceProvidedLabels(java.lang.Boolean enforceProvidedLabels) {
            this.enforceProvidedLabels = enforceProvidedLabels;
            return this;
        }

        /**
         * Sets the value of {@link GlueMlTransformParametersFindMatchesParameters#getEnforceProvidedLabels}
         * @param enforceProvidedLabels Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_ml_transform#enforce_provided_labels GlueMlTransform#enforce_provided_labels}.
         * @return {@code this}
         */
        public Builder enforceProvidedLabels(com.hashicorp.cdktf.IResolvable enforceProvidedLabels) {
            this.enforceProvidedLabels = enforceProvidedLabels;
            return this;
        }

        /**
         * Sets the value of {@link GlueMlTransformParametersFindMatchesParameters#getPrecisionRecallTradeOff}
         * @param precisionRecallTradeOff Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_ml_transform#precision_recall_trade_off GlueMlTransform#precision_recall_trade_off}.
         * @return {@code this}
         */
        public Builder precisionRecallTradeOff(java.lang.Number precisionRecallTradeOff) {
            this.precisionRecallTradeOff = precisionRecallTradeOff;
            return this;
        }

        /**
         * Sets the value of {@link GlueMlTransformParametersFindMatchesParameters#getPrimaryKeyColumnName}
         * @param primaryKeyColumnName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_ml_transform#primary_key_column_name GlueMlTransform#primary_key_column_name}.
         * @return {@code this}
         */
        public Builder primaryKeyColumnName(java.lang.String primaryKeyColumnName) {
            this.primaryKeyColumnName = primaryKeyColumnName;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link GlueMlTransformParametersFindMatchesParameters}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public GlueMlTransformParametersFindMatchesParameters build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link GlueMlTransformParametersFindMatchesParameters}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements GlueMlTransformParametersFindMatchesParameters {
        private final java.lang.Number accuracyCostTradeOff;
        private final java.lang.Object enforceProvidedLabels;
        private final java.lang.Number precisionRecallTradeOff;
        private final java.lang.String primaryKeyColumnName;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.accuracyCostTradeOff = software.amazon.jsii.Kernel.get(this, "accuracyCostTradeOff", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.enforceProvidedLabels = software.amazon.jsii.Kernel.get(this, "enforceProvidedLabels", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.precisionRecallTradeOff = software.amazon.jsii.Kernel.get(this, "precisionRecallTradeOff", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.primaryKeyColumnName = software.amazon.jsii.Kernel.get(this, "primaryKeyColumnName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.accuracyCostTradeOff = builder.accuracyCostTradeOff;
            this.enforceProvidedLabels = builder.enforceProvidedLabels;
            this.precisionRecallTradeOff = builder.precisionRecallTradeOff;
            this.primaryKeyColumnName = builder.primaryKeyColumnName;
        }

        @Override
        public final java.lang.Number getAccuracyCostTradeOff() {
            return this.accuracyCostTradeOff;
        }

        @Override
        public final java.lang.Object getEnforceProvidedLabels() {
            return this.enforceProvidedLabels;
        }

        @Override
        public final java.lang.Number getPrecisionRecallTradeOff() {
            return this.precisionRecallTradeOff;
        }

        @Override
        public final java.lang.String getPrimaryKeyColumnName() {
            return this.primaryKeyColumnName;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getAccuracyCostTradeOff() != null) {
                data.set("accuracyCostTradeOff", om.valueToTree(this.getAccuracyCostTradeOff()));
            }
            if (this.getEnforceProvidedLabels() != null) {
                data.set("enforceProvidedLabels", om.valueToTree(this.getEnforceProvidedLabels()));
            }
            if (this.getPrecisionRecallTradeOff() != null) {
                data.set("precisionRecallTradeOff", om.valueToTree(this.getPrecisionRecallTradeOff()));
            }
            if (this.getPrimaryKeyColumnName() != null) {
                data.set("primaryKeyColumnName", om.valueToTree(this.getPrimaryKeyColumnName()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.glueMlTransform.GlueMlTransformParametersFindMatchesParameters"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            GlueMlTransformParametersFindMatchesParameters.Jsii$Proxy that = (GlueMlTransformParametersFindMatchesParameters.Jsii$Proxy) o;

            if (this.accuracyCostTradeOff != null ? !this.accuracyCostTradeOff.equals(that.accuracyCostTradeOff) : that.accuracyCostTradeOff != null) return false;
            if (this.enforceProvidedLabels != null ? !this.enforceProvidedLabels.equals(that.enforceProvidedLabels) : that.enforceProvidedLabels != null) return false;
            if (this.precisionRecallTradeOff != null ? !this.precisionRecallTradeOff.equals(that.precisionRecallTradeOff) : that.precisionRecallTradeOff != null) return false;
            return this.primaryKeyColumnName != null ? this.primaryKeyColumnName.equals(that.primaryKeyColumnName) : that.primaryKeyColumnName == null;
        }

        @Override
        public final int hashCode() {
            int result = this.accuracyCostTradeOff != null ? this.accuracyCostTradeOff.hashCode() : 0;
            result = 31 * result + (this.enforceProvidedLabels != null ? this.enforceProvidedLabels.hashCode() : 0);
            result = 31 * result + (this.precisionRecallTradeOff != null ? this.precisionRecallTradeOff.hashCode() : 0);
            result = 31 * result + (this.primaryKeyColumnName != null ? this.primaryKeyColumnName.hashCode() : 0);
            return result;
        }
    }
}
