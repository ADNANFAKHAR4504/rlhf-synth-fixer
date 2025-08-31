package imports.aws.kendra_index;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.434Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.kendraIndex.KendraIndexDocumentMetadataConfigurationUpdatesRelevance")
@software.amazon.jsii.Jsii.Proxy(KendraIndexDocumentMetadataConfigurationUpdatesRelevance.Jsii$Proxy.class)
public interface KendraIndexDocumentMetadataConfigurationUpdatesRelevance extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kendra_index#duration KendraIndex#duration}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDuration() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kendra_index#freshness KendraIndex#freshness}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getFreshness() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kendra_index#importance KendraIndex#importance}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getImportance() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kendra_index#rank_order KendraIndex#rank_order}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getRankOrder() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kendra_index#values_importance_map KendraIndex#values_importance_map}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.Number> getValuesImportanceMap() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link KendraIndexDocumentMetadataConfigurationUpdatesRelevance}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link KendraIndexDocumentMetadataConfigurationUpdatesRelevance}
     */
    public static final class Builder implements software.amazon.jsii.Builder<KendraIndexDocumentMetadataConfigurationUpdatesRelevance> {
        java.lang.String duration;
        java.lang.Object freshness;
        java.lang.Number importance;
        java.lang.String rankOrder;
        java.util.Map<java.lang.String, java.lang.Number> valuesImportanceMap;

        /**
         * Sets the value of {@link KendraIndexDocumentMetadataConfigurationUpdatesRelevance#getDuration}
         * @param duration Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kendra_index#duration KendraIndex#duration}.
         * @return {@code this}
         */
        public Builder duration(java.lang.String duration) {
            this.duration = duration;
            return this;
        }

        /**
         * Sets the value of {@link KendraIndexDocumentMetadataConfigurationUpdatesRelevance#getFreshness}
         * @param freshness Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kendra_index#freshness KendraIndex#freshness}.
         * @return {@code this}
         */
        public Builder freshness(java.lang.Boolean freshness) {
            this.freshness = freshness;
            return this;
        }

        /**
         * Sets the value of {@link KendraIndexDocumentMetadataConfigurationUpdatesRelevance#getFreshness}
         * @param freshness Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kendra_index#freshness KendraIndex#freshness}.
         * @return {@code this}
         */
        public Builder freshness(com.hashicorp.cdktf.IResolvable freshness) {
            this.freshness = freshness;
            return this;
        }

        /**
         * Sets the value of {@link KendraIndexDocumentMetadataConfigurationUpdatesRelevance#getImportance}
         * @param importance Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kendra_index#importance KendraIndex#importance}.
         * @return {@code this}
         */
        public Builder importance(java.lang.Number importance) {
            this.importance = importance;
            return this;
        }

        /**
         * Sets the value of {@link KendraIndexDocumentMetadataConfigurationUpdatesRelevance#getRankOrder}
         * @param rankOrder Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kendra_index#rank_order KendraIndex#rank_order}.
         * @return {@code this}
         */
        public Builder rankOrder(java.lang.String rankOrder) {
            this.rankOrder = rankOrder;
            return this;
        }

        /**
         * Sets the value of {@link KendraIndexDocumentMetadataConfigurationUpdatesRelevance#getValuesImportanceMap}
         * @param valuesImportanceMap Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kendra_index#values_importance_map KendraIndex#values_importance_map}.
         * @return {@code this}
         */
        @SuppressWarnings("unchecked")
        public Builder valuesImportanceMap(java.util.Map<java.lang.String, ? extends java.lang.Number> valuesImportanceMap) {
            this.valuesImportanceMap = (java.util.Map<java.lang.String, java.lang.Number>)valuesImportanceMap;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link KendraIndexDocumentMetadataConfigurationUpdatesRelevance}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public KendraIndexDocumentMetadataConfigurationUpdatesRelevance build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link KendraIndexDocumentMetadataConfigurationUpdatesRelevance}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements KendraIndexDocumentMetadataConfigurationUpdatesRelevance {
        private final java.lang.String duration;
        private final java.lang.Object freshness;
        private final java.lang.Number importance;
        private final java.lang.String rankOrder;
        private final java.util.Map<java.lang.String, java.lang.Number> valuesImportanceMap;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.duration = software.amazon.jsii.Kernel.get(this, "duration", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.freshness = software.amazon.jsii.Kernel.get(this, "freshness", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.importance = software.amazon.jsii.Kernel.get(this, "importance", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.rankOrder = software.amazon.jsii.Kernel.get(this, "rankOrder", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.valuesImportanceMap = software.amazon.jsii.Kernel.get(this, "valuesImportanceMap", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.Number.class)));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        @SuppressWarnings("unchecked")
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.duration = builder.duration;
            this.freshness = builder.freshness;
            this.importance = builder.importance;
            this.rankOrder = builder.rankOrder;
            this.valuesImportanceMap = (java.util.Map<java.lang.String, java.lang.Number>)builder.valuesImportanceMap;
        }

        @Override
        public final java.lang.String getDuration() {
            return this.duration;
        }

        @Override
        public final java.lang.Object getFreshness() {
            return this.freshness;
        }

        @Override
        public final java.lang.Number getImportance() {
            return this.importance;
        }

        @Override
        public final java.lang.String getRankOrder() {
            return this.rankOrder;
        }

        @Override
        public final java.util.Map<java.lang.String, java.lang.Number> getValuesImportanceMap() {
            return this.valuesImportanceMap;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getDuration() != null) {
                data.set("duration", om.valueToTree(this.getDuration()));
            }
            if (this.getFreshness() != null) {
                data.set("freshness", om.valueToTree(this.getFreshness()));
            }
            if (this.getImportance() != null) {
                data.set("importance", om.valueToTree(this.getImportance()));
            }
            if (this.getRankOrder() != null) {
                data.set("rankOrder", om.valueToTree(this.getRankOrder()));
            }
            if (this.getValuesImportanceMap() != null) {
                data.set("valuesImportanceMap", om.valueToTree(this.getValuesImportanceMap()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.kendraIndex.KendraIndexDocumentMetadataConfigurationUpdatesRelevance"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            KendraIndexDocumentMetadataConfigurationUpdatesRelevance.Jsii$Proxy that = (KendraIndexDocumentMetadataConfigurationUpdatesRelevance.Jsii$Proxy) o;

            if (this.duration != null ? !this.duration.equals(that.duration) : that.duration != null) return false;
            if (this.freshness != null ? !this.freshness.equals(that.freshness) : that.freshness != null) return false;
            if (this.importance != null ? !this.importance.equals(that.importance) : that.importance != null) return false;
            if (this.rankOrder != null ? !this.rankOrder.equals(that.rankOrder) : that.rankOrder != null) return false;
            return this.valuesImportanceMap != null ? this.valuesImportanceMap.equals(that.valuesImportanceMap) : that.valuesImportanceMap == null;
        }

        @Override
        public final int hashCode() {
            int result = this.duration != null ? this.duration.hashCode() : 0;
            result = 31 * result + (this.freshness != null ? this.freshness.hashCode() : 0);
            result = 31 * result + (this.importance != null ? this.importance.hashCode() : 0);
            result = 31 * result + (this.rankOrder != null ? this.rankOrder.hashCode() : 0);
            result = 31 * result + (this.valuesImportanceMap != null ? this.valuesImportanceMap.hashCode() : 0);
            return result;
        }
    }
}
