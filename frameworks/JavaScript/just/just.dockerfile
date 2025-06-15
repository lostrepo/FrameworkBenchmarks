FROM ubuntu:22.04 AS pre-build
RUN apt-get update -y
RUN apt-get install -qy g++ curl make tar gzip libfindbin-libs-perl

FROM pre-build AS builder
WORKDIR /build
RUN sh -c "$(curl -sSL https://raw.githubusercontent.com/just-js/just/0.1.8/install.sh)"
RUN make -C just install
ENV JUST_HOME=/build/just
ENV JUST_TARGET=/build/just
WORKDIR /app
COPY techempower.js util.js tfb.config.js ./
RUN just build --clean --cleanall --static techempower.js
WORKDIR /app
COPY fortunes.html /app/fortunes.html
CMD ["./techempower"]
