import { join } from 'lib/path.js'

const { getenv, setenv, args, core: { chdir } } = lo

const server_root_dir	=  getenv('SERVER_ROOT_DIR') || ((() => {
  const pwd = getenv('PWD')
  const arg_dir = args[+(args[0] === 'lo')].replace(/\/{0,1}[^\/]+$/, '')
  if (arg_dir.indexOf(pwd) === 0) {
    return arg_dir === '.' ? getenv('LO_HOME') || './' : arg_dir
  }
  return join(pwd, arg_dir)
})())

if (!getenv('SERVER_ROOT_DIR')) setenv('SERVER_ROOT_DIR', server_root_dir, 0)
if (getenv('PWD') === '.') setenv('PWD', server_root_dir, 1)
chdir(server_root_dir)

import('./index.js')
