# Explorer IP Image

[![Build ompzowe/explorer-ip](https://github.com/zowe/explorer-ip/actions/workflows/explorer-ip-images.yml/badge.svg)](https://github.com/zowe/explorer-ip/actions/workflows/explorer-ip-images.yml)

## General Information

This image can be used to start IP Explorer.

It includes 2 Linux Distro:

- Ubuntu
- Red Hat UBI

Each image supports both `amd64` and `s390x` CPU architectures.

## Usage

Image `zowe-docker-release.jfrog.io/ompzowe/explorer-ip:latest` should be able to run with minimal environment variables:

Example commands:

```
# pull image
docker pull zowe-docker-release.jfrog.io/ompzowe/explorer-ip:latest
# start container
docker run -it --rm \
    zowe-docker-release.jfrog.io/ompzowe/explorer-ip:latest
```

