import { CPUS, SERVER_ROOT_DIR } from './env/env.js'

const { setenv, cstr, ptr, library, args,
  core: { waitpid, WNOHANG, execvp, sysconf, fork }
 } = lo
const _SC_NPROCESSORS_ONLN = library('system')?.system._SC_NPROCESSORS_ONLN
const real_cpus_online = Math.max(1, _SC_NPROCESSORS_ONLN ? +sysconf(_SC_NPROCESSORS_ONLN) : 1)
const cpus_online = CPUS || Math.max(real_cpus_online / 2 |0, 1)
const instances = new Map();


startServerInstances()

let remainingTries = 100
let count = cpus_online
let pid = waitpid(-1, new Uint32Array(2), 0)
while(--count > 0 && --remainingTries > 0) {
  console.log(`child died with pid: ${pid}; remaining children: ${count}`)
  const env = instances.get(pid)
  instances.delete(pid)
  if (env) (fork_proc(env), ++count, console.log('recreated child'))
  pid = waitpid(-1, new Uint32Array(2), 0)
}





// use separate function so variables will be collected by GC.
function startServerInstances(){
  const env = {
    CHILD: 1,
    PWD: SERVER_ROOT_DIR,
    SERVER_ROOT_DIR: SERVER_ROOT_DIR,
    CPUS: cpus_online,
  }

  console.log('SERVER_ROOT_DIR: '+ env.SERVER_ROOT_DIR)

  for (var i = 0; i < env.CPUS; i++){
    // http
    fork_proc({ ...env, CHILD_INDEX: i })
  }
}


function makeArgs (args) {
    const argb = new Array(args.length)
    if (!args.length) return { args: new Uint8Array(0) }
    const b64 = new BigUint64Array(args.length + 1)
    for (let i = 0; i < args.length; i++) {
      const str = argb[i] = cstr(args[i])
      b64[i] = BigInt(str.ptr)
    }
    return {
      args: ptr(new Uint8Array(b64.buffer)),
      cstrings: argb
    }
  }


function exec_env (name, vargs, env, status = new Int32Array(2)) {
  const { args } = makeArgs([name, ...vargs])
    const pid = fork()
    if (pid === 0) {
    for (let i = 0; i < env.length; i++) {
      setenv(env[i][0], env[i][1], 0)
    }
      if (execvp(name, args) !== 0) {
        const err = new Error(`could not execvp ${lo.errno}`)
        console.error(err.message)
        console.error((new Error(``)).stack)
      }
    } else if (pid > 0) {
      waitpid(pid, status, WNOHANG)
    } else {
      status[0] = lo.errno
    }
  status[1] = pid
    return status
}

function fork_proc(env){
  const [_, pid] = exec_env(args[0], args.slice(1),//.concat(['--log-all']),
    Object.keys(env).map((k) => [k, env[k]]))
  instances.set(pid, env)

  const cpus = +env.CPUS || 0
  const cpu = +env.CHILD_INDEX || 0
  if (cpu < cpus) {
    pin_to_cpus(pid, [cpu, !CPUS && (real_cpus_online > cpus + cpu) ? cpus + cpu : cpu])
  }
}

function pin_to_cpus(pid, cpus){
  const { setaffinity, struct_cpu_set_t_size } = lo.core
  const cpu_set = ptr(new Uint8Array(struct_cpu_set_t_size))

  for (let i = 0; i < cpus.length; i++) {
    const cpu = cpus[i]
    const index_to_flip = Math.floor(cpu / 8)
    const bit_to_flip = cpu % 8
    cpu_set[index_to_flip] |= 1 << bit_to_flip
  }

  const rc = setaffinity(pid, struct_cpu_set_t_size, cpu_set.ptr)
  console.log(`setaffinity to cpus ${cpus} for pid ${pid}: ${rc === -1 ? `error ${lo.errno}` : 'success'}`)
  return rc
}
