# Use Ubuntu 24.04 as base image
FROM ubuntu:24.04

# Install system dependencies
RUN apt-get update && apt-get install -y \
    curl \
    git \
    build-essential \
    libssl-dev \
    zlib1g-dev \
    libbz2-dev \
    libreadline-dev \
    libsqlite3-dev \
    libncurses5-dev \
    libncursesw5-dev \
    xz-utils \
    tk-dev \
    libffi-dev \
    liblzma-dev \
    && rm -rf /var/lib/apt/lists/*

# Install pyenv
RUN curl https://pyenv.run | bash

# Add pyenv to PATH
ENV PATH="/root/.pyenv/bin:$PATH"
ENV PYENV_ROOT="/root/.pyenv"

# Install Python 3.12.11 using pyenv
RUN eval "$(pyenv init --path)" && \
    eval "$(pyenv init -)" && \
    pyenv install 3.12.11 && \
    pyenv global 3.12.11

# Set Python 3.12.11 as default
ENV PATH="/root/.pyenv/versions/3.12.11/bin:$PATH"

# Install nvm
RUN curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Add nvm to PATH
ENV NVM_DIR="/root/.nvm"
ENV PATH="$NVM_DIR:$PATH"

# Install Node.js 22.17.0 using nvm
RUN . "$NVM_DIR/nvm.sh" && \
    nvm install 22.17.0 && \
    nvm use 22.17.0 && \
    nvm alias default 22.17.0

# Set Node.js 22.17.0 as default
ENV PATH="/root/.nvm/versions/node/v22.17.0/bin:$PATH"

# Install pipenv 2025.0.4
RUN python -m pip install --upgrade pip && \
    pip install pipenv==2025.0.4

# Set working directory
WORKDIR /app

# Copy application code
COPY . .