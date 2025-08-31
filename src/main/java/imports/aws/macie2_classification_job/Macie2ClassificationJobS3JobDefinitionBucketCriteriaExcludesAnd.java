package imports.aws.macie2_classification_job;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.848Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.macie2ClassificationJob.Macie2ClassificationJobS3JobDefinitionBucketCriteriaExcludesAnd")
@software.amazon.jsii.Jsii.Proxy(Macie2ClassificationJobS3JobDefinitionBucketCriteriaExcludesAnd.Jsii$Proxy.class)
public interface Macie2ClassificationJobS3JobDefinitionBucketCriteriaExcludesAnd extends software.amazon.jsii.JsiiSerializable {

    /**
     * simple_criterion block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/macie2_classification_job#simple_criterion Macie2ClassificationJob#simple_criterion}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.macie2_classification_job.Macie2ClassificationJobS3JobDefinitionBucketCriteriaExcludesAndSimpleCriterion getSimpleCriterion() {
        return null;
    }

    /**
     * tag_criterion block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/macie2_classification_job#tag_criterion Macie2ClassificationJob#tag_criterion}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.macie2_classification_job.Macie2ClassificationJobS3JobDefinitionBucketCriteriaExcludesAndTagCriterion getTagCriterion() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link Macie2ClassificationJobS3JobDefinitionBucketCriteriaExcludesAnd}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link Macie2ClassificationJobS3JobDefinitionBucketCriteriaExcludesAnd}
     */
    public static final class Builder implements software.amazon.jsii.Builder<Macie2ClassificationJobS3JobDefinitionBucketCriteriaExcludesAnd> {
        imports.aws.macie2_classification_job.Macie2ClassificationJobS3JobDefinitionBucketCriteriaExcludesAndSimpleCriterion simpleCriterion;
        imports.aws.macie2_classification_job.Macie2ClassificationJobS3JobDefinitionBucketCriteriaExcludesAndTagCriterion tagCriterion;

        /**
         * Sets the value of {@link Macie2ClassificationJobS3JobDefinitionBucketCriteriaExcludesAnd#getSimpleCriterion}
         * @param simpleCriterion simple_criterion block.
         *                        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/macie2_classification_job#simple_criterion Macie2ClassificationJob#simple_criterion}
         * @return {@code this}
         */
        public Builder simpleCriterion(imports.aws.macie2_classification_job.Macie2ClassificationJobS3JobDefinitionBucketCriteriaExcludesAndSimpleCriterion simpleCriterion) {
            this.simpleCriterion = simpleCriterion;
            return this;
        }

        /**
         * Sets the value of {@link Macie2ClassificationJobS3JobDefinitionBucketCriteriaExcludesAnd#getTagCriterion}
         * @param tagCriterion tag_criterion block.
         *                     Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/macie2_classification_job#tag_criterion Macie2ClassificationJob#tag_criterion}
         * @return {@code this}
         */
        public Builder tagCriterion(imports.aws.macie2_classification_job.Macie2ClassificationJobS3JobDefinitionBucketCriteriaExcludesAndTagCriterion tagCriterion) {
            this.tagCriterion = tagCriterion;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link Macie2ClassificationJobS3JobDefinitionBucketCriteriaExcludesAnd}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public Macie2ClassificationJobS3JobDefinitionBucketCriteriaExcludesAnd build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link Macie2ClassificationJobS3JobDefinitionBucketCriteriaExcludesAnd}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements Macie2ClassificationJobS3JobDefinitionBucketCriteriaExcludesAnd {
        private final imports.aws.macie2_classification_job.Macie2ClassificationJobS3JobDefinitionBucketCriteriaExcludesAndSimpleCriterion simpleCriterion;
        private final imports.aws.macie2_classification_job.Macie2ClassificationJobS3JobDefinitionBucketCriteriaExcludesAndTagCriterion tagCriterion;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.simpleCriterion = software.amazon.jsii.Kernel.get(this, "simpleCriterion", software.amazon.jsii.NativeType.forClass(imports.aws.macie2_classification_job.Macie2ClassificationJobS3JobDefinitionBucketCriteriaExcludesAndSimpleCriterion.class));
            this.tagCriterion = software.amazon.jsii.Kernel.get(this, "tagCriterion", software.amazon.jsii.NativeType.forClass(imports.aws.macie2_classification_job.Macie2ClassificationJobS3JobDefinitionBucketCriteriaExcludesAndTagCriterion.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.simpleCriterion = builder.simpleCriterion;
            this.tagCriterion = builder.tagCriterion;
        }

        @Override
        public final imports.aws.macie2_classification_job.Macie2ClassificationJobS3JobDefinitionBucketCriteriaExcludesAndSimpleCriterion getSimpleCriterion() {
            return this.simpleCriterion;
        }

        @Override
        public final imports.aws.macie2_classification_job.Macie2ClassificationJobS3JobDefinitionBucketCriteriaExcludesAndTagCriterion getTagCriterion() {
            return this.tagCriterion;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getSimpleCriterion() != null) {
                data.set("simpleCriterion", om.valueToTree(this.getSimpleCriterion()));
            }
            if (this.getTagCriterion() != null) {
                data.set("tagCriterion", om.valueToTree(this.getTagCriterion()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.macie2ClassificationJob.Macie2ClassificationJobS3JobDefinitionBucketCriteriaExcludesAnd"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            Macie2ClassificationJobS3JobDefinitionBucketCriteriaExcludesAnd.Jsii$Proxy that = (Macie2ClassificationJobS3JobDefinitionBucketCriteriaExcludesAnd.Jsii$Proxy) o;

            if (this.simpleCriterion != null ? !this.simpleCriterion.equals(that.simpleCriterion) : that.simpleCriterion != null) return false;
            return this.tagCriterion != null ? this.tagCriterion.equals(that.tagCriterion) : that.tagCriterion == null;
        }

        @Override
        public final int hashCode() {
            int result = this.simpleCriterion != null ? this.simpleCriterion.hashCode() : 0;
            result = 31 * result + (this.tagCriterion != null ? this.tagCriterion.hashCode() : 0);
            return result;
        }
    }
}
