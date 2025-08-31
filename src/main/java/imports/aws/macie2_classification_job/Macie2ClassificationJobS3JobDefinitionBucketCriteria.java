package imports.aws.macie2_classification_job;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.847Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.macie2ClassificationJob.Macie2ClassificationJobS3JobDefinitionBucketCriteria")
@software.amazon.jsii.Jsii.Proxy(Macie2ClassificationJobS3JobDefinitionBucketCriteria.Jsii$Proxy.class)
public interface Macie2ClassificationJobS3JobDefinitionBucketCriteria extends software.amazon.jsii.JsiiSerializable {

    /**
     * excludes block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/macie2_classification_job#excludes Macie2ClassificationJob#excludes}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.macie2_classification_job.Macie2ClassificationJobS3JobDefinitionBucketCriteriaExcludes getExcludes() {
        return null;
    }

    /**
     * includes block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/macie2_classification_job#includes Macie2ClassificationJob#includes}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.macie2_classification_job.Macie2ClassificationJobS3JobDefinitionBucketCriteriaIncludes getIncludes() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link Macie2ClassificationJobS3JobDefinitionBucketCriteria}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link Macie2ClassificationJobS3JobDefinitionBucketCriteria}
     */
    public static final class Builder implements software.amazon.jsii.Builder<Macie2ClassificationJobS3JobDefinitionBucketCriteria> {
        imports.aws.macie2_classification_job.Macie2ClassificationJobS3JobDefinitionBucketCriteriaExcludes excludes;
        imports.aws.macie2_classification_job.Macie2ClassificationJobS3JobDefinitionBucketCriteriaIncludes includes;

        /**
         * Sets the value of {@link Macie2ClassificationJobS3JobDefinitionBucketCriteria#getExcludes}
         * @param excludes excludes block.
         *                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/macie2_classification_job#excludes Macie2ClassificationJob#excludes}
         * @return {@code this}
         */
        public Builder excludes(imports.aws.macie2_classification_job.Macie2ClassificationJobS3JobDefinitionBucketCriteriaExcludes excludes) {
            this.excludes = excludes;
            return this;
        }

        /**
         * Sets the value of {@link Macie2ClassificationJobS3JobDefinitionBucketCriteria#getIncludes}
         * @param includes includes block.
         *                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/macie2_classification_job#includes Macie2ClassificationJob#includes}
         * @return {@code this}
         */
        public Builder includes(imports.aws.macie2_classification_job.Macie2ClassificationJobS3JobDefinitionBucketCriteriaIncludes includes) {
            this.includes = includes;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link Macie2ClassificationJobS3JobDefinitionBucketCriteria}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public Macie2ClassificationJobS3JobDefinitionBucketCriteria build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link Macie2ClassificationJobS3JobDefinitionBucketCriteria}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements Macie2ClassificationJobS3JobDefinitionBucketCriteria {
        private final imports.aws.macie2_classification_job.Macie2ClassificationJobS3JobDefinitionBucketCriteriaExcludes excludes;
        private final imports.aws.macie2_classification_job.Macie2ClassificationJobS3JobDefinitionBucketCriteriaIncludes includes;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.excludes = software.amazon.jsii.Kernel.get(this, "excludes", software.amazon.jsii.NativeType.forClass(imports.aws.macie2_classification_job.Macie2ClassificationJobS3JobDefinitionBucketCriteriaExcludes.class));
            this.includes = software.amazon.jsii.Kernel.get(this, "includes", software.amazon.jsii.NativeType.forClass(imports.aws.macie2_classification_job.Macie2ClassificationJobS3JobDefinitionBucketCriteriaIncludes.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.excludes = builder.excludes;
            this.includes = builder.includes;
        }

        @Override
        public final imports.aws.macie2_classification_job.Macie2ClassificationJobS3JobDefinitionBucketCriteriaExcludes getExcludes() {
            return this.excludes;
        }

        @Override
        public final imports.aws.macie2_classification_job.Macie2ClassificationJobS3JobDefinitionBucketCriteriaIncludes getIncludes() {
            return this.includes;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getExcludes() != null) {
                data.set("excludes", om.valueToTree(this.getExcludes()));
            }
            if (this.getIncludes() != null) {
                data.set("includes", om.valueToTree(this.getIncludes()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.macie2ClassificationJob.Macie2ClassificationJobS3JobDefinitionBucketCriteria"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            Macie2ClassificationJobS3JobDefinitionBucketCriteria.Jsii$Proxy that = (Macie2ClassificationJobS3JobDefinitionBucketCriteria.Jsii$Proxy) o;

            if (this.excludes != null ? !this.excludes.equals(that.excludes) : that.excludes != null) return false;
            return this.includes != null ? this.includes.equals(that.includes) : that.includes == null;
        }

        @Override
        public final int hashCode() {
            int result = this.excludes != null ? this.excludes.hashCode() : 0;
            result = 31 * result + (this.includes != null ? this.includes.hashCode() : 0);
            return result;
        }
    }
}
