import { join } from 'lib/path.js';
import { is_file } from 'lib/fs.js';
// import { log } from './srv/utils/log.js';

const { assert, getcwd, getenv, core: { read_file } } = lo

// TODO: read tsconfig.json for import/require alias replacement
// TODO: add CJS to ESM module transform for lo.core.loader
lo.core.loader = lo.core.sync_loader = (specifier, resource) => {
  const cwd = getcwd()
  // log({ specifier, resource, cwd })

  // import/require 'lib/<something>'
  if (/^lib\//.test(specifier)) {
    let lib_path = ''
    if (!is_file(lib_path = `${getenv('LO_HOME')}/${specifier}`)) lib_path = ''
    if (!lib_path && !is_file(lib_path = `${cwd}/${specifier}`)) lib_path = ''
    if (lib_path) return new TextDecoder().decode(read_file(lib_path))
  }

  // little helpers
  const get_dir = (s) => (s || '').replace(/\/[^\/]*$/, '/')
  const rm_cwd = (s) => (s || '').replace(cwd, '')

  // assume everything is below cwd or on the same level
  const path = join(cwd, get_dir(rm_cwd(resource)), rm_cwd(specifier))
  // CWD module isolation
  assert(path.indexOf(cwd) == 0, `path = "${path}" is outside CWD = ${cwd}!`)
  const path_dir = get_dir(path)


  const src = new TextDecoder().decode(read_file(path))
  // replace relative with absolute paths (dumb, works for me)
  const final_src = src
    ? src
      .replace(/(import|from)(\s+|\s*\(\s*)(['"`])\.\.\//g,
        `$1$2$3${path_dir.split('/').slice(0, -2).join('/')}/`)
      .replace(/(import|from)(\s+|\s*\(\s*)(['"`])\.\//g, `$1$2$3${path_dir}`)
    : '';
  // log({ get_import_src: '', specifier, resource, cwd, path, path_dir,
  //   // final_src,
  //   ['']: '' })
  return final_src
}
