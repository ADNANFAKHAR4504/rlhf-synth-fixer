package imports.aws.macie2_classification_job;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.848Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.macie2ClassificationJob.Macie2ClassificationJobS3JobDefinitionBucketCriteriaIncludesAndTagCriterion")
@software.amazon.jsii.Jsii.Proxy(Macie2ClassificationJobS3JobDefinitionBucketCriteriaIncludesAndTagCriterion.Jsii$Proxy.class)
public interface Macie2ClassificationJobS3JobDefinitionBucketCriteriaIncludesAndTagCriterion extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/macie2_classification_job#comparator Macie2ClassificationJob#comparator}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getComparator() {
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
     * @return a {@link Builder} of {@link Macie2ClassificationJobS3JobDefinitionBucketCriteriaIncludesAndTagCriterion}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link Macie2ClassificationJobS3JobDefinitionBucketCriteriaIncludesAndTagCriterion}
     */
    public static final class Builder implements software.amazon.jsii.Builder<Macie2ClassificationJobS3JobDefinitionBucketCriteriaIncludesAndTagCriterion> {
        java.lang.String comparator;
        java.lang.Object tagValues;

        /**
         * Sets the value of {@link Macie2ClassificationJobS3JobDefinitionBucketCriteriaIncludesAndTagCriterion#getComparator}
         * @param comparator Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/macie2_classification_job#comparator Macie2ClassificationJob#comparator}.
         * @return {@code this}
         */
        public Builder comparator(java.lang.String comparator) {
            this.comparator = comparator;
            return this;
        }

        /**
         * Sets the value of {@link Macie2ClassificationJobS3JobDefinitionBucketCriteriaIncludesAndTagCriterion#getTagValues}
         * @param tagValues tag_values block.
         *                  Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/macie2_classification_job#tag_values Macie2ClassificationJob#tag_values}
         * @return {@code this}
         */
        public Builder tagValues(com.hashicorp.cdktf.IResolvable tagValues) {
            this.tagValues = tagValues;
            return this;
        }

        /**
         * Sets the value of {@link Macie2ClassificationJobS3JobDefinitionBucketCriteriaIncludesAndTagCriterion#getTagValues}
         * @param tagValues tag_values block.
         *                  Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/macie2_classification_job#tag_values Macie2ClassificationJob#tag_values}
         * @return {@code this}
         */
        public Builder tagValues(java.util.List<? extends imports.aws.macie2_classification_job.Macie2ClassificationJobS3JobDefinitionBucketCriteriaIncludesAndTagCriterionTagValues> tagValues) {
            this.tagValues = tagValues;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link Macie2ClassificationJobS3JobDefinitionBucketCriteriaIncludesAndTagCriterion}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public Macie2ClassificationJobS3JobDefinitionBucketCriteriaIncludesAndTagCriterion build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link Macie2ClassificationJobS3JobDefinitionBucketCriteriaIncludesAndTagCriterion}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements Macie2ClassificationJobS3JobDefinitionBucketCriteriaIncludesAndTagCriterion {
        private final java.lang.String comparator;
        private final java.lang.Object tagValues;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.comparator = software.amazon.jsii.Kernel.get(this, "comparator", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.tagValues = software.amazon.jsii.Kernel.get(this, "tagValues", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.comparator = builder.comparator;
            this.tagValues = builder.tagValues;
        }

        @Override
        public final java.lang.String getComparator() {
            return this.comparator;
        }

        @Override
        public final java.lang.Object getTagValues() {
            return this.tagValues;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getComparator() != null) {
                data.set("comparator", om.valueToTree(this.getComparator()));
            }
            if (this.getTagValues() != null) {
                data.set("tagValues", om.valueToTree(this.getTagValues()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.macie2ClassificationJob.Macie2ClassificationJobS3JobDefinitionBucketCriteriaIncludesAndTagCriterion"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            Macie2ClassificationJobS3JobDefinitionBucketCriteriaIncludesAndTagCriterion.Jsii$Proxy that = (Macie2ClassificationJobS3JobDefinitionBucketCriteriaIncludesAndTagCriterion.Jsii$Proxy) o;

            if (this.comparator != null ? !this.comparator.equals(that.comparator) : that.comparator != null) return false;
            return this.tagValues != null ? this.tagValues.equals(that.tagValues) : that.tagValues == null;
        }

        @Override
        public final int hashCode() {
            int result = this.comparator != null ? this.comparator.hashCode() : 0;
            result = 31 * result + (this.tagValues != null ? this.tagValues.hashCode() : 0);
            return result;
        }
    }
}
