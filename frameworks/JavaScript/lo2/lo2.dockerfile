FROM ubuntu:22.04 AS pre-build
RUN apt-get update -y
RUN apt-get install -qy libcurl4-openssl-dev git make tar gzip g++ curl zlib1g-dev libssl-dev

FROM pre-build AS builder
WORKDIR /build
RUN sh -c "git clone https://github.com/just-js/lo.git"
WORKDIR /build/lo
RUN make clean
RUN make lo
COPY lo2.js lo2.config.js  ./
RUN ./lo build runtime lo2
COPY ./srv  ./srv/
COPY index.js stringify.js util.js tfb.config.js  ./
ENV LO_HOME=/build/lo
CMD ["./lo2"]
