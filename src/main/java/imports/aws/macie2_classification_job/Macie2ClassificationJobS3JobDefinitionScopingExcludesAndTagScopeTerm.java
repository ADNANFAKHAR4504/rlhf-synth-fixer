package imports.aws.macie2_classification_job;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.849Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.macie2ClassificationJob.Macie2ClassificationJobS3JobDefinitionScopingExcludesAndTagScopeTerm")
@software.amazon.jsii.Jsii.Proxy(Macie2ClassificationJobS3JobDefinitionScopingExcludesAndTagScopeTerm.Jsii$Proxy.class)
public interface Macie2ClassificationJobS3JobDefinitionScopingExcludesAndTagScopeTerm extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/macie2_classification_job#comparator Macie2ClassificationJob#comparator}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getComparator() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/macie2_classification_job#key Macie2ClassificationJob#key}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getKey() {
        return null;
    }

    /**
     * tag_values block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/macie2_classification_job#tag_values Macie2ClassificationJob#tag_values}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getTagValues() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/macie2_classification_job#target Macie2ClassificationJob#target}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getTarget() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link Macie2ClassificationJobS3JobDefinitionScopingExcludesAndTagScopeTerm}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link Macie2ClassificationJobS3JobDefinitionScopingExcludesAndTagScopeTerm}
     */
    public static final class Builder implements software.amazon.jsii.Builder<Macie2ClassificationJobS3JobDefinitionScopingExcludesAndTagScopeTerm> {
        java.lang.String comparator;
        java.lang.String key;
        java.lang.Object tagValues;
        java.lang.String target;

        /**
         * Sets the value of {@link Macie2ClassificationJobS3JobDefinitionScopingExcludesAndTagScopeTerm#getComparator}
         * @param comparator Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/macie2_classification_job#comparator Macie2ClassificationJob#comparator}.
         * @return {@code this}
         */
        public Builder comparator(java.lang.String comparator) {
            this.comparator = comparator;
            return this;
        }

        /**
         * Sets the value of {@link Macie2ClassificationJobS3JobDefinitionScopingExcludesAndTagScopeTerm#getKey}
         * @param key Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/macie2_classification_job#key Macie2ClassificationJob#key}.
         * @return {@code this}
         */
        public Builder key(java.lang.String key) {
            this.key = key;
            return this;
        }

        /**
         * Sets the value of {@link Macie2ClassificationJobS3JobDefinitionScopingExcludesAndTagScopeTerm#getTagValues}
         * @param tagValues tag_values block.
         *                  Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/macie2_classification_job#tag_values Macie2ClassificationJob#tag_values}
         * @return {@code this}
         */
        public Builder tagValues(com.hashicorp.cdktf.IResolvable tagValues) {
            this.tagValues = tagValues;
            return this;
        }

        /**
         * Sets the value of {@link Macie2ClassificationJobS3JobDefinitionScopingExcludesAndTagScopeTerm#getTagValues}
         * @param tagValues tag_values block.
         *                  Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/macie2_classification_job#tag_values Macie2ClassificationJob#tag_values}
         * @return {@code this}
         */
        public Builder tagValues(java.util.List<? extends imports.aws.macie2_classification_job.Macie2ClassificationJobS3JobDefinitionScopingExcludesAndTagScopeTermTagValues> tagValues) {
            this.tagValues = tagValues;
            return this;
        }

        /**
         * Sets the value of {@link Macie2ClassificationJobS3JobDefinitionScopingExcludesAndTagScopeTerm#getTarget}
         * @param target Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/macie2_classification_job#target Macie2ClassificationJob#target}.
         * @return {@code this}
         */
        public Builder target(java.lang.String target) {
            this.target = target;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link Macie2ClassificationJobS3JobDefinitionScopingExcludesAndTagScopeTerm}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public Macie2ClassificationJobS3JobDefinitionScopingExcludesAndTagScopeTerm build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link Macie2ClassificationJobS3JobDefinitionScopingExcludesAndTagScopeTerm}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements Macie2ClassificationJobS3JobDefinitionScopingExcludesAndTagScopeTerm {
        private final java.lang.String comparator;
        private final java.lang.String key;
        private final java.lang.Object tagValues;
        private final java.lang.String target;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.comparator = software.amazon.jsii.Kernel.get(this, "comparator", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.key = software.amazon.jsii.Kernel.get(this, "key", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.tagValues = software.amazon.jsii.Kernel.get(this, "tagValues", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.target = software.amazon.jsii.Kernel.get(this, "target", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.comparator = builder.comparator;
            this.key = builder.key;
            this.tagValues = builder.tagValues;
            this.target = builder.target;
        }

        @Override
        public final java.lang.String getComparator() {
            return this.comparator;
        }

        @Override
        public final java.lang.String getKey() {
            return this.key;
        }

        @Override
        public final java.lang.Object getTagValues() {
            return this.tagValues;
        }

        @Override
        public final java.lang.String getTarget() {
            return this.target;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getComparator() != null) {
                data.set("comparator", om.valueToTree(this.getComparator()));
            }
            if (this.getKey() != null) {
                data.set("key", om.valueToTree(this.getKey()));
            }
            if (this.getTagValues() != null) {
                data.set("tagValues", om.valueToTree(this.getTagValues()));
            }
            if (this.getTarget() != null) {
                data.set("target", om.valueToTree(this.getTarget()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.macie2ClassificationJob.Macie2ClassificationJobS3JobDefinitionScopingExcludesAndTagScopeTerm"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            Macie2ClassificationJobS3JobDefinitionScopingExcludesAndTagScopeTerm.Jsii$Proxy that = (Macie2ClassificationJobS3JobDefinitionScopingExcludesAndTagScopeTerm.Jsii$Proxy) o;

            if (this.comparator != null ? !this.comparator.equals(that.comparator) : that.comparator != null) return false;
            if (this.key != null ? !this.key.equals(that.key) : that.key != null) return false;
            if (this.tagValues != null ? !this.tagValues.equals(that.tagValues) : that.tagValues != null) return false;
            return this.target != null ? this.target.equals(that.target) : that.target == null;
        }

        @Override
        public final int hashCode() {
            int result = this.comparator != null ? this.comparator.hashCode() : 0;
            result = 31 * result + (this.key != null ? this.key.hashCode() : 0);
            result = 31 * result + (this.tagValues != null ? this.tagValues.hashCode() : 0);
            result = 31 * result + (this.target != null ? this.target.hashCode() : 0);
            return result;
        }
    }
}
