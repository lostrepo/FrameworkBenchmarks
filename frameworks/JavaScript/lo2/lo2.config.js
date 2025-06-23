
const { core: { os } } = lo

const bindings = ['core', 'system', 'epoll', 'net', 'pico']
const libs = []
const embeds = []

const target = 'lo2'
const opt = '-O3 -march=native -mtune=native'

const v8_opts = {
  v8_cleanup: 0, v8_threads: 2, on_exit: 0,
  v8flags: '--stack-trace-limit=10 --use-strict --turbo-fast-api-calls --cppgc-young-generation \
--always-sparkplug --always-osr --no-debug-code \
--no-enable-slow-asserts --stress-inline --stress-maglev \
--fast-map-update --feedback-normalization --flush-baseline-code'
}

let link_type = '-static -static-libstdc++'
if (os === 'linux') {
  link_type += ' -static-libgcc'
} else if (os === 'mac') {
  bindings.push('mach')
  bindings.push('kevents')
}

const index = 'lo2.js'
export default { bindings, libs, embeds, target, opt, v8_opts, link_type, index }
