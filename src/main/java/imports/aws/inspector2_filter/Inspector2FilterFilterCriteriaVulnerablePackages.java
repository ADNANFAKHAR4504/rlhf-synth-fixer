package imports.aws.inspector2_filter;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.383Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.inspector2Filter.Inspector2FilterFilterCriteriaVulnerablePackages")
@software.amazon.jsii.Jsii.Proxy(Inspector2FilterFilterCriteriaVulnerablePackages.Jsii$Proxy.class)
public interface Inspector2FilterFilterCriteriaVulnerablePackages extends software.amazon.jsii.JsiiSerializable {

    /**
     * architecture block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#architecture Inspector2Filter#architecture}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getArchitecture() {
        return null;
    }

    /**
     * epoch block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#epoch Inspector2Filter#epoch}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getEpoch() {
        return null;
    }

    /**
     * file_path block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#file_path Inspector2Filter#file_path}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getFilePath() {
        return null;
    }

    /**
     * name block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#name Inspector2Filter#name}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getName() {
        return null;
    }

    /**
     * release block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#release Inspector2Filter#release}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getRelease() {
        return null;
    }

    /**
     * source_lambda_layer_arn block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#source_lambda_layer_arn Inspector2Filter#source_lambda_layer_arn}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getSourceLambdaLayerArn() {
        return null;
    }

    /**
     * source_layer_hash block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#source_layer_hash Inspector2Filter#source_layer_hash}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getSourceLayerHash() {
        return null;
    }

    /**
     * version block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#version Inspector2Filter#version}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getVersion() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link Inspector2FilterFilterCriteriaVulnerablePackages}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link Inspector2FilterFilterCriteriaVulnerablePackages}
     */
    public static final class Builder implements software.amazon.jsii.Builder<Inspector2FilterFilterCriteriaVulnerablePackages> {
        java.lang.Object architecture;
        java.lang.Object epoch;
        java.lang.Object filePath;
        java.lang.Object name;
        java.lang.Object release;
        java.lang.Object sourceLambdaLayerArn;
        java.lang.Object sourceLayerHash;
        java.lang.Object version;

        /**
         * Sets the value of {@link Inspector2FilterFilterCriteriaVulnerablePackages#getArchitecture}
         * @param architecture architecture block.
         *                     Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#architecture Inspector2Filter#architecture}
         * @return {@code this}
         */
        public Builder architecture(com.hashicorp.cdktf.IResolvable architecture) {
            this.architecture = architecture;
            return this;
        }

        /**
         * Sets the value of {@link Inspector2FilterFilterCriteriaVulnerablePackages#getArchitecture}
         * @param architecture architecture block.
         *                     Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#architecture Inspector2Filter#architecture}
         * @return {@code this}
         */
        public Builder architecture(java.util.List<? extends imports.aws.inspector2_filter.Inspector2FilterFilterCriteriaVulnerablePackagesArchitecture> architecture) {
            this.architecture = architecture;
            return this;
        }

        /**
         * Sets the value of {@link Inspector2FilterFilterCriteriaVulnerablePackages#getEpoch}
         * @param epoch epoch block.
         *              Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#epoch Inspector2Filter#epoch}
         * @return {@code this}
         */
        public Builder epoch(com.hashicorp.cdktf.IResolvable epoch) {
            this.epoch = epoch;
            return this;
        }

        /**
         * Sets the value of {@link Inspector2FilterFilterCriteriaVulnerablePackages#getEpoch}
         * @param epoch epoch block.
         *              Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#epoch Inspector2Filter#epoch}
         * @return {@code this}
         */
        public Builder epoch(java.util.List<? extends imports.aws.inspector2_filter.Inspector2FilterFilterCriteriaVulnerablePackagesEpoch> epoch) {
            this.epoch = epoch;
            return this;
        }

        /**
         * Sets the value of {@link Inspector2FilterFilterCriteriaVulnerablePackages#getFilePath}
         * @param filePath file_path block.
         *                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#file_path Inspector2Filter#file_path}
         * @return {@code this}
         */
        public Builder filePath(com.hashicorp.cdktf.IResolvable filePath) {
            this.filePath = filePath;
            return this;
        }

        /**
         * Sets the value of {@link Inspector2FilterFilterCriteriaVulnerablePackages#getFilePath}
         * @param filePath file_path block.
         *                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#file_path Inspector2Filter#file_path}
         * @return {@code this}
         */
        public Builder filePath(java.util.List<? extends imports.aws.inspector2_filter.Inspector2FilterFilterCriteriaVulnerablePackagesFilePath> filePath) {
            this.filePath = filePath;
            return this;
        }

        /**
         * Sets the value of {@link Inspector2FilterFilterCriteriaVulnerablePackages#getName}
         * @param name name block.
         *             Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#name Inspector2Filter#name}
         * @return {@code this}
         */
        public Builder name(com.hashicorp.cdktf.IResolvable name) {
            this.name = name;
            return this;
        }

        /**
         * Sets the value of {@link Inspector2FilterFilterCriteriaVulnerablePackages#getName}
         * @param name name block.
         *             Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#name Inspector2Filter#name}
         * @return {@code this}
         */
        public Builder name(java.util.List<? extends imports.aws.inspector2_filter.Inspector2FilterFilterCriteriaVulnerablePackagesName> name) {
            this.name = name;
            return this;
        }

        /**
         * Sets the value of {@link Inspector2FilterFilterCriteriaVulnerablePackages#getRelease}
         * @param release release block.
         *                Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#release Inspector2Filter#release}
         * @return {@code this}
         */
        public Builder release(com.hashicorp.cdktf.IResolvable release) {
            this.release = release;
            return this;
        }

        /**
         * Sets the value of {@link Inspector2FilterFilterCriteriaVulnerablePackages#getRelease}
         * @param release release block.
         *                Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#release Inspector2Filter#release}
         * @return {@code this}
         */
        public Builder release(java.util.List<? extends imports.aws.inspector2_filter.Inspector2FilterFilterCriteriaVulnerablePackagesRelease> release) {
            this.release = release;
            return this;
        }

        /**
         * Sets the value of {@link Inspector2FilterFilterCriteriaVulnerablePackages#getSourceLambdaLayerArn}
         * @param sourceLambdaLayerArn source_lambda_layer_arn block.
         *                             Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#source_lambda_layer_arn Inspector2Filter#source_lambda_layer_arn}
         * @return {@code this}
         */
        public Builder sourceLambdaLayerArn(com.hashicorp.cdktf.IResolvable sourceLambdaLayerArn) {
            this.sourceLambdaLayerArn = sourceLambdaLayerArn;
            return this;
        }

        /**
         * Sets the value of {@link Inspector2FilterFilterCriteriaVulnerablePackages#getSourceLambdaLayerArn}
         * @param sourceLambdaLayerArn source_lambda_layer_arn block.
         *                             Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#source_lambda_layer_arn Inspector2Filter#source_lambda_layer_arn}
         * @return {@code this}
         */
        public Builder sourceLambdaLayerArn(java.util.List<? extends imports.aws.inspector2_filter.Inspector2FilterFilterCriteriaVulnerablePackagesSourceLambdaLayerArn> sourceLambdaLayerArn) {
            this.sourceLambdaLayerArn = sourceLambdaLayerArn;
            return this;
        }

        /**
         * Sets the value of {@link Inspector2FilterFilterCriteriaVulnerablePackages#getSourceLayerHash}
         * @param sourceLayerHash source_layer_hash block.
         *                        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#source_layer_hash Inspector2Filter#source_layer_hash}
         * @return {@code this}
         */
        public Builder sourceLayerHash(com.hashicorp.cdktf.IResolvable sourceLayerHash) {
            this.sourceLayerHash = sourceLayerHash;
            return this;
        }

        /**
         * Sets the value of {@link Inspector2FilterFilterCriteriaVulnerablePackages#getSourceLayerHash}
         * @param sourceLayerHash source_layer_hash block.
         *                        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#source_layer_hash Inspector2Filter#source_layer_hash}
         * @return {@code this}
         */
        public Builder sourceLayerHash(java.util.List<? extends imports.aws.inspector2_filter.Inspector2FilterFilterCriteriaVulnerablePackagesSourceLayerHash> sourceLayerHash) {
            this.sourceLayerHash = sourceLayerHash;
            return this;
        }

        /**
         * Sets the value of {@link Inspector2FilterFilterCriteriaVulnerablePackages#getVersion}
         * @param version version block.
         *                Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#version Inspector2Filter#version}
         * @return {@code this}
         */
        public Builder version(com.hashicorp.cdktf.IResolvable version) {
            this.version = version;
            return this;
        }

        /**
         * Sets the value of {@link Inspector2FilterFilterCriteriaVulnerablePackages#getVersion}
         * @param version version block.
         *                Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/inspector2_filter#version Inspector2Filter#version}
         * @return {@code this}
         */
        public Builder version(java.util.List<? extends imports.aws.inspector2_filter.Inspector2FilterFilterCriteriaVulnerablePackagesVersion> version) {
            this.version = version;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link Inspector2FilterFilterCriteriaVulnerablePackages}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public Inspector2FilterFilterCriteriaVulnerablePackages build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link Inspector2FilterFilterCriteriaVulnerablePackages}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements Inspector2FilterFilterCriteriaVulnerablePackages {
        private final java.lang.Object architecture;
        private final java.lang.Object epoch;
        private final java.lang.Object filePath;
        private final java.lang.Object name;
        private final java.lang.Object release;
        private final java.lang.Object sourceLambdaLayerArn;
        private final java.lang.Object sourceLayerHash;
        private final java.lang.Object version;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.architecture = software.amazon.jsii.Kernel.get(this, "architecture", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.epoch = software.amazon.jsii.Kernel.get(this, "epoch", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.filePath = software.amazon.jsii.Kernel.get(this, "filePath", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.name = software.amazon.jsii.Kernel.get(this, "name", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.release = software.amazon.jsii.Kernel.get(this, "release", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.sourceLambdaLayerArn = software.amazon.jsii.Kernel.get(this, "sourceLambdaLayerArn", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.sourceLayerHash = software.amazon.jsii.Kernel.get(this, "sourceLayerHash", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.version = software.amazon.jsii.Kernel.get(this, "version", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.architecture = builder.architecture;
            this.epoch = builder.epoch;
            this.filePath = builder.filePath;
            this.name = builder.name;
            this.release = builder.release;
            this.sourceLambdaLayerArn = builder.sourceLambdaLayerArn;
            this.sourceLayerHash = builder.sourceLayerHash;
            this.version = builder.version;
        }

        @Override
        public final java.lang.Object getArchitecture() {
            return this.architecture;
        }

        @Override
        public final java.lang.Object getEpoch() {
            return this.epoch;
        }

        @Override
        public final java.lang.Object getFilePath() {
            return this.filePath;
        }

        @Override
        public final java.lang.Object getName() {
            return this.name;
        }

        @Override
        public final java.lang.Object getRelease() {
            return this.release;
        }

        @Override
        public final java.lang.Object getSourceLambdaLayerArn() {
            return this.sourceLambdaLayerArn;
        }

        @Override
        public final java.lang.Object getSourceLayerHash() {
            return this.sourceLayerHash;
        }

        @Override
        public final java.lang.Object getVersion() {
            return this.version;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getArchitecture() != null) {
                data.set("architecture", om.valueToTree(this.getArchitecture()));
            }
            if (this.getEpoch() != null) {
                data.set("epoch", om.valueToTree(this.getEpoch()));
            }
            if (this.getFilePath() != null) {
                data.set("filePath", om.valueToTree(this.getFilePath()));
            }
            if (this.getName() != null) {
                data.set("name", om.valueToTree(this.getName()));
            }
            if (this.getRelease() != null) {
                data.set("release", om.valueToTree(this.getRelease()));
            }
            if (this.getSourceLambdaLayerArn() != null) {
                data.set("sourceLambdaLayerArn", om.valueToTree(this.getSourceLambdaLayerArn()));
            }
            if (this.getSourceLayerHash() != null) {
                data.set("sourceLayerHash", om.valueToTree(this.getSourceLayerHash()));
            }
            if (this.getVersion() != null) {
                data.set("version", om.valueToTree(this.getVersion()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.inspector2Filter.Inspector2FilterFilterCriteriaVulnerablePackages"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            Inspector2FilterFilterCriteriaVulnerablePackages.Jsii$Proxy that = (Inspector2FilterFilterCriteriaVulnerablePackages.Jsii$Proxy) o;

            if (this.architecture != null ? !this.architecture.equals(that.architecture) : that.architecture != null) return false;
            if (this.epoch != null ? !this.epoch.equals(that.epoch) : that.epoch != null) return false;
            if (this.filePath != null ? !this.filePath.equals(that.filePath) : that.filePath != null) return false;
            if (this.name != null ? !this.name.equals(that.name) : that.name != null) return false;
            if (this.release != null ? !this.release.equals(that.release) : that.release != null) return false;
            if (this.sourceLambdaLayerArn != null ? !this.sourceLambdaLayerArn.equals(that.sourceLambdaLayerArn) : that.sourceLambdaLayerArn != null) return false;
            if (this.sourceLayerHash != null ? !this.sourceLayerHash.equals(that.sourceLayerHash) : that.sourceLayerHash != null) return false;
            return this.version != null ? this.version.equals(that.version) : that.version == null;
        }

        @Override
        public final int hashCode() {
            int result = this.architecture != null ? this.architecture.hashCode() : 0;
            result = 31 * result + (this.epoch != null ? this.epoch.hashCode() : 0);
            result = 31 * result + (this.filePath != null ? this.filePath.hashCode() : 0);
            result = 31 * result + (this.name != null ? this.name.hashCode() : 0);
            result = 31 * result + (this.release != null ? this.release.hashCode() : 0);
            result = 31 * result + (this.sourceLambdaLayerArn != null ? this.sourceLambdaLayerArn.hashCode() : 0);
            result = 31 * result + (this.sourceLayerHash != null ? this.sourceLayerHash.hashCode() : 0);
            result = 31 * result + (this.version != null ? this.version.hashCode() : 0);
            return result;
        }
    }
}
