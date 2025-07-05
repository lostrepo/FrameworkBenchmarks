FROM ubuntu:22.04 AS pre-build
RUN apt-get update -y
RUN apt-get install -qy libcurl4-openssl-dev git make tar gzip g++ curl zlib1g-dev libssl-dev

FROM pre-build AS builder
WORKDIR /build
RUN sh -c "git clone -n --depth=1 --filter=blob:none -b main --single-branch https://github.com/just-js/lo.git"
WORKDIR /build/lo
RUN sh -c "git sparse-checkout set --no-cone \
/lib/system /lib/core /lib/net /lib/encode /lib/epoll /lib/pico /lib/curl /lib/mach /lib/inflate \
/lib/net.js /lib/loop.js /lib/encode.js /lib/build.js /lib/curl.js /lib/untar.js /lib/inflate.js /lib/fs.js /lib/curl.js \
/lib/path.js /lib/proc.js /lib/system.js /lib/gen.js /lib/stringify.js /lib/timer.js / \
/runtime /lo.cc /lo.h /main.h /main.cc /main_win.h /main.js /Makefile /builtins.h /builtins.S /builtins_linux.S \
globals.d.ts"
RUN sh -c "git checkout"
RUN make clean
RUN make lo
COPY lo2.js lo2.config.js  ./
RUN ./lo build runtime lo2
COPY ./srv  ./srv/
COPY index.js stringify.js util.js tfb.config.js  ./
ENV LO_HOME=/build/lo
CMD ["./lo2"]
