
//#region user_generated
//#endregion user_generated
//#region custom_js_libs
//#region from_dts_files.custom_js_libs
// TODO: add automatic *.d.ts search in $LO_HOME/lib/** and $PROJECT_DIR/lib/**
// to populate this block (look at typedef_utils.get_apis as reference)
//#endregion from_dts_files.custom_js_libs
//#endregion custom_js_libs
//#region static
//#region base.static
/// <reference no-default-lib="true"/>
/// <reference lib="es2023"/>
// TODO: refine generic NativeLib* types for lib/<module>/api.js (platform)

// generic typedef helper for classes:
// interface IClassX { ... }
// declare var ClassX: Constructor<IClassX>
// TODO: find solution to class declaration issues (TS class declaration !== JS class declaration)
interface Constructor<T> {
  readonly prototype: T
  new (): T
}

type OnUnhandledRejection = (error: Error) => void

type Require = <T extends Record<string | number | symbol, unknown>>(
  file_path: string
) => T | undefined

interface Console {
  log: (str: unknown) => number
  error: (str: unknown) => number
}

// available globally with v8 --expose-gc flag
type GC = undefined | (() => void)

type ENGINE = 'v8';
type OS = 'mac' | 'win' | 'linux';
type ARCH = 'x64' | 'arm64';
type TypedArray =
  | Uint8Array
  | Int8Array
  | Uint16Array
  | Int16Array
  | Uint32Array
  | Int32Array
  | Float32Array
  | Float64Array
  | BigUint64Array
  | BigInt64Array
  | ArrayBuffer

type Ptr<T extends TypedArray> = T & {
  ptr: pointer
  size: number
}

type UnknownLib<T extends string | number> = Record<
  T | string | number | symbol,
  unknown
>;
type Library<T extends string | number> =
  (T extends NativeLibsKeys ? NativeLibXExport<T> : UnknownLib<T>)
    & {
      handle?: number
      fileName?: string
      internal?: boolean
    }

interface RuntimeVersion {
  lo: string
  v8: string
}

interface RuntimeGenerics<E extends ENGINE, O extends OS, A extends ARCH> {
  engine: E
  os: O
  arch: A
}

// helpers
type Overwrite<T, U> = Omit<T, keyof U> & U
interface NativeLibs {}
type NativeLibsKeys = keyof NativeLibs;
type NativeLibX<T extends NativeLibsKeys> = NativeLibs[T];
type NativeLibXExport<T extends NativeLibsKeys> = Pick<NativeLibs, T>

//#endregion base.static
//#region declared_globals.static
declare var global: GlobalThis;
declare var onUnhandledRejection: OnUnhandledRejection;
declare var require: Require;
declare var TextEncoder: TextEncoderConstructor;
declare var TextDecoder: TextDecoderConstructor;
declare var lo: Runtime;
declare var gc: GC;
declare var Iterator: IteratorConstructor;
declare var console: Console;
//#endregion declared_globals.static
//#region core.static
// lo.core = lo.load('core') + overrides listed here
interface Core extends Overwrite<NativeLibX<'core'>, {
  dlsym(handle: number, name: string): number
  dlopen(path: string, flags: number): number
  // strnlen(str: string | number, size: number): number
  /**
   * Reads a file from the given path into a Uint8Array and returns it.
   * @param [path] The path to the file.
   */
  read_file(path: string): Uint8Array
  /**
   * Creates/Overwrites a file at the specified path with the given Uint8Array
   * as the contents of the file.
   * @param {string}[path] The path of the file to create.
   * @param {TypedArray}[buffer] The data write to the file.
   * @returns {number} Number of bytes written
   */
  write_file(
    path: string,
    buffer: Uint8Array,
    flags?: number,
    mode?: number
  ): number
  os: OS
  arch: ARCH
  engine: ENGINE
  little_endian: boolean
  homedir: string
  defaultWriteFlags: number
  defaultWriteMode: number
  mmap(
    ptr: number,
    length: number,
    prot: number,
    flags: number,
    fd: number,
    offset: number,
    buf: Uint32Array
  ): void
  getcwd(ptr: number, num: number, buf: Uint32Array): void
  getenv(name: string, buf: Uint32Array): void
  write_string(num: number, str: string): number
  readFile(path: string, flags?: number, size?: number): Uint8Array
  writeFile(
    path: string,
    u8: Uint8Array,
    flags?: number,
    mode?: number
  ): number

  isFile(path: string): boolean
  // conditionally defined props
  loader: void | ((specifier: string, resource: string) => string)
  sync_loader: void | ((specifier: string, resource: string) => string)
  binding_loader: void | (<T extends string>(name: T) => Library<T>)
}>{}
//#endregion core.static
//#region lo.static
interface Runtime {
  // validate with list from: lo eval 'console.log(`"${Object.getOwnPropertyNames(lo).join(`":unknown;"`)}":unknown;`)'
  moduleCache: Map<string, ReturnType<Runtime['loadModule']>>
  libCache: Map<string, object>
  requireCache: Map<string, object>
  start: number
  errno: number
  colors: Record<Uppercase<string>, string>
  core: Core
  libraries(): string[]
  builtins(): string[]
  assert(expression: any, message?: string | Function): any
  cstr(str: string): Ptr<Uint8Array>
  load<T extends NativeLibsKeys>(name: T): NativeLibXExport<T>
  library<T extends string | number>(name: T): Library<T>
  /**
   * Prints a string to the console
   * @param [str='a string'] The text to print.
   */
  print(str: string): void
  exit(status: number): void
  runMicroTasks(): void
  hrtime(): number
  nextTick(callback: Function): void
  getAddress(buf: TypedArray): number
  utf8Length(str: string): number
  utf8EncodeInto(str: string, buf: TypedArray): number
  utf8EncodeIntoAtOffset(str: string, buf: TypedArray, off: number): number
  utf8_decode(address: number, len?: number): string
  latin1Decode(address: number, len?: number): string
  utf8Encode(str: string): Uint8Array
  utf8Decode: Runtime['utf8_decode']
  wrap<
    Handle extends Uint32Array,
    WrappedFnArgs extends unknown[],
    WrappedFnRet,
    State,
  >(
    handle: Handle,
    fn: ((...args: [...WrappedFnArgs]) => WrappedFnRet) & { state?: State },
    plen: number
  ): ((...args: WrappedFnArgs) => number) & { state?: State }
  addr(handle: TypedArray): number
  version: RuntimeVersion
  args: string[]
  argv: number
  argc: number
  workerSource: string
  builtin(path: string): string
  os(): OS
  arch(): ARCH
  getenv(str: string): string
  evaluateModule<T extends object>(identifier: number): Promise<T>
  loadModule(
    source: string,
    specifier: string
  ): {
    requests: string
    isSourceTextModule: boolean
    status: number
    specifier: string
    src: string
    identity: number
    scriptId: number
    // js land extensions on returned value
    resource?: string
    evaluated?: boolean
    namespace?: object; // module namespace object
  }
  readMemory(dest: TypedArray, start: number, len: number): void
  wrapMemory(start: number, size: number, free?: number): Uint8Array
  unwrapMemory(buffer: ArrayBuffer): void
  ptr<T extends TypedArray>(u8: T): Ptr<T>
  register_callback(ptr: number, fn: Function): void
  registerCallback: Runtime['register_callback']
  setModuleCallbacks(
    on_module_load: Function,
    on_module_instantiate: Function
  ): void

  utf8EncodeIntoPtr(str: string, ptr: number): number
  runScript(source: string, path: string /* resource name */): void
  pumpMessageLoop(): void
  readMemoryAtOffset(
    u8: TypedArray,
    start: number,
    size: number,
    offset: number
  ): void
  setFlags(str: string): void
  getMeta: unknown

  setenv: Core['setenv']
  getcwd(): string
  run_script: Runtime['runScript']
  bindings: Runtime['libraries']
  evaluate_module: Runtime['evaluateModule']
  get_address: Runtime['getAddress']
  get_meta: Runtime['getMeta']
  latin1_decode: Runtime['latin1Decode']
  lib_cache: Runtime['libCache']
  load_module: Runtime['loadModule']
  module_cache: Runtime['moduleCache']
  next_tick: Runtime['nextTick']
  pump_message_loop: Runtime['pumpMessageLoop']
  read_memory: Runtime['readMemory']
  read_memory_at_offset: Runtime['readMemoryAtOffset']
  require_cache: Runtime['requireCache']
  run_microtasks: Runtime['runMicroTasks']
  set_flags: Runtime['setFlags']
  set_module_callbacks: Runtime['setModuleCallbacks']
  unwrap_memory: Runtime['unwrapMemory']
  utf8_encode: Runtime['utf8Encode']
  utf8_encode_into: Runtime['utf8EncodeInto']
  utf8_encode_into_ptr: Runtime['utf8EncodeIntoPtr']
  utf8_encode_into_at_offset: Runtime['utf8EncodeIntoAtOffset']
  utf8_length: Runtime['utf8Length']
  wrap_memory: Runtime['wrapMemory']
}
//#endregion lo.static
//#region TextEncoderConstructor.static
type TextEncoderConstructor = Constructor<ITextEncoder>;
interface ITextEncoder {
  /**
   * The encoding supported by the `TextEncoder` instance. Always set to `'utf-8'`.
   */
  readonly encoding: string
  /**
   * UTF-8 encodes the `input` string and returns a `Uint8Array` containing the
   * encoded bytes.
   * @param [input='an empty string'] The text to encode.
   */
  encode(input?: string): Uint8Array
  /**
   * UTF-8 encodes the `src` string to the `dest` Uint8Array and returns an object
   * containing the read Unicode code units and written UTF-8 bytes.
   *
   * ```js
   * const encoder = new TextEncoder()
   * const src = 'this is some data'
   * const dest = new Uint8Array(10)
   * const { read, written } = encoder.encodeInto(src, dest)
   * ```
   * @param src The text to encode.
   * @param dest The array to hold the encode result.
   */
  encodeInto(src?: string, dest?: Uint8Array): number
}
//#endregion TextEncoderConstructor.static
//#region TextDecoderConstructor.static
type TextDecoderConstructor = Constructor<ITextDecoder>;
interface ITextDecoder {
  /**
   * The encoding supported by the `TextEncoder` instance. Always set to `'utf-8'`.
   */
  readonly encoding: string
  /**
   * UTF-8 decodes the `Uint8Array` and returns an `input` string.
   */
  decode(ptr_source?: Ptr<Uint8Array> | Uint8Array): string
}
//#endregion TextDecoderConstructor.static
//#region Iterator.static
// Iterator class type from https://github.com/zloirock/core-js#iterator-helpers
interface IteratorConstructor extends Constructor<IIterator> {
  from(iterable: Iterable<any> | Iterator<any>): Iterator<any>
}
type Uint = number;
interface IIterator {
  drop(limit: Uint): Iterator<any>
  every(callbackfn: (value: any, counter: Uint) => boolean): boolean
  filter(callbackfn: (value: any, counter: Uint) => boolean): Iterator<any>
  find(callbackfn: (value: any, counter: Uint) => boolean): any
  flatMap(callbackfn: (value: any, counter: Uint) => Iterable<any> | Iterator<any>): Iterator<any>
  forEach(callbackfn: (value: any, counter: Uint) => void): void
  map(callbackfn: (value: any, counter: Uint) => any): Iterator<any>
  reduce(callbackfn: (memo: any, value: any, counter: Uint) => any, initialValue: any): any
  some(callbackfn: (value: any, counter: Uint) => boolean): boolean
  take(limit: Uint): Iterator<any>
  toArray(): Array<any>
}
//#endregion Iterator.static
//#region NativeLibApi.static
type LIB_API_ARCH = 'x64';
type LIB_API_C_TYPE = 'u64' | 'f64' | 'u32' | 'i64' | 'f32' | 'i32' | 'u8' | 'void' | 'char';
type LIB_API_POINTER = 'pointer'
type LIB_API_BOOL = 'bool';
type LIB_API_STRING = 'string';
type LIB_API_BUFFER = 'buffer';
type LIB_API_TYPED_ARRAY = 'u32array'

type LibApiParameter = LIB_API_POINTER | LIB_API_C_TYPE | LIB_API_STRING
  | LIB_API_BUFFER | LIB_API_TYPED_ARRAY | LIB_API_BOOL;
type LibApiResult = LIB_API_POINTER | LIB_API_C_TYPE | LIB_API_BOOL;
type LibApiPointer = string; // this is sad
type LibApiOverride = { param: number, fastfield: string, slowfield: string } | number;
type LibApiItem = { nofast: boolean; declare_only: boolean; } | {
  parameters: LibApiParameter[]
  optional?: (true | false | 1 | 0 | undefined)[]
  pointers?: (LibApiPointer | void)[]
  result: LibApiResult
  rpointer?: LibApiPointer | [LibApiPointer]
  name?: string
  arch?: ARCH[]
  override?: (LibApiOverride | void)[]
  casts?: (string | void)[]
  jsdoc?: string
  man?: string[] | string
  nofast?: boolean
  nonblocking?: boolean
};
type LibApi = Record<string, LibApiItem>;
type LibApiTypedFn = <const T extends LibApi>(api: T) => T


type ConstantType = Exclude<LIB_API_C_TYPE, 'void' | 'char'> | number;
type LibConstants = Record<string, ConstantType>;
type LibConstsTypedFn = <const T extends LibConstants>(constnats: T) => T

type Platform = 'mac' | 'linux';
interface LibPlatform {
  name: string
  api: LibApi
  constants?: LibConstants
  structs?: string[]
  includes?: string[]
  libs?: string[]
  externs?: string[]
  include_paths?: string[]
  lib_paths?: string[]
  obj?: string[]
  preamble?: string
}
type LibPlatformTypedFn = <const T extends Partial<LibPlatform>>(platform: T) => T

//#endregion NativeLibApi.static
//#endregion static
//#region autogenerated
//#region globals.autogenerated
// TODO: add lo.core.engine prop to determine engine
interface CurrentRuntimeGenerics extends RuntimeGenerics<'v8', 'linux', 'x64'> {}
interface GlobalThis extends GlobalThisBase {
    global:GlobalThis;
    onUnhandledRejection:OnUnhandledRejection;
    require:Require;
    TextEncoder:TextEncoderConstructor;
    TextDecoder:TextDecoderConstructor;
    lo:Runtime;
    gc:GC;
    Iterator:IteratorConstructor;
    console:Console;
}
    type GlobalThisBaseOmit =   | 'global'
  | 'onUnhandledRejection'
  | 'require'
  | 'TextEncoder'
  | 'TextDecoder'
  | 'lo'
  | 'gc'
  | 'Iterator'
  | 'console'
// global base type
// keep only things that we have, no need to confuse people
interface GlobalThisBase
  extends Omit<Pick<
    typeof globalThis,
    // list from: lo eval 'console.log(`"${Object.getOwnPropertyNames(globalThis).join(`"    \n| "`)}"`)'
    | "Object"
    | "Function"
    | "Array"
    | "Number"
    | "parseFloat"
    | "parseInt"
    | "Infinity"
    | "NaN"
    | "undefined"
    | "Boolean"
    | "String"
    | "Symbol"
    | "Date"
    | "Promise"
    | "RegExp"
    | "Error"
    | "AggregateError"
    | "EvalError"
    | "RangeError"
    | "ReferenceError"
    | "SyntaxError"
    | "TypeError"
    | "URIError"
    | "globalThis"
    | "JSON"
    | "Math"
    | "Intl"
    | "ArrayBuffer"
    | "Atomics"
    | "Uint8Array"
    | "Int8Array"
    | "Uint16Array"
    | "Int16Array"
    | "Uint32Array"
    | "Int32Array"
    | "Float32Array"
    | "Float64Array"
    | "Uint8ClampedArray"
    | "BigUint64Array"
    | "BigInt64Array"
    | "DataView"
    | "Map"
    | "BigInt"
    | "Set"
    | "WeakMap"
    | "WeakSet"
    | "Proxy"
    | "Reflect"
    | "FinalizationRegistry"
    | "WeakRef"
    | "decodeURI"
    | "decodeURIComponent"
    | "encodeURI"
    | "encodeURIComponent"
    | "escape"
    | "unescape"
    | "eval"
    | "isFinite"
    | "isNaN"
    | "SharedArrayBuffer"
    // missing typedefs (extract from typescript DOM lib, we don't need DOM messing with types):
    // WebAssembly issue - https://github.com/microsoft/TypeScript-DOM-lib-generator/issues/826
    // WebAssembly
  >,
  GlobalThisBaseOmit
  > {}
//#endregion globals.autogenerated
//#region native_libs.autogenerated
interface NativeLibs {

  system: {
    mmap(p0: pointer,p1: u32,p2: i32,p3: i32,p4: i32,p5: u32): pointer;
    munmap(p0: pointer,p1: u32): i32;
    getcwd(p0: TypedArray,p1: i32): pointer;
    mprotect(p0: pointer,p1: u32,p2: i32): i32;
    memcpy(p0: pointer,p1: pointer,p2: u32): pointer;
    memmove(p0: pointer,p1: pointer,p2: u32): pointer;
    exit(p0: i32): void;
    usleep(p0: u32): i32;
    getpid(): i32;
    getrusage(p0: i32,p1: TypedArray): i32;
    sleep(p0: u32): u32;
    fork(): i32;
    kill(p0: i32,p1: i32): i32;
    waitpid(p0: i32,p1: TypedArray,p2: i32): i32;
    execvp(p0: string,p1: TypedArray): i32;
    readlink(p0: string,p1: TypedArray,p2: u32): u32;
    sysconf(p0: i32): u32;
    getrlimit(p0: i32,p1: Uint32Array): i32;
    setrlimit(p0: i32,p1: Uint32Array): i32;
    strerror_r(p0: i32,p1: TypedArray,p2: u32): i32;
    times(p0: TypedArray): i32;
    getenv(p0: string): pointer;
    calloc(p0: u32,p1: u32): pointer;
    free(p0: pointer): void;
    sysinfo(p0: TypedArray): u32;
    get_avphys_pages(): u32;
    signal(p0: i32,p1: pointer): pointer;
    memfd_create(p0: string,p1: u32): i32;
    pidfd_open(p0: i32,p1: i32,p2: u32): i32;
    gettid(p0: i32): i32;
    timerfd_create(p0: i32,p1: i32): i32;
    timerfd_settime(p0: i32,p1: i32,p2: TypedArray,p3: pointer): i32;
    eventfd(p0: u32,p1: i32): i32;
    clock_gettime(p0: i32,p1: pointer): i32;
    _SC_CLK_TCK: i32;
    _SC_NPROCESSORS_ONLN: i32;
    EFD_NONBLOCK: i32;
    EFD_CLOEXEC: i32;
    EFD_SEMAPHORE: i32;
  }
  encode: {
    hex_encode(p0: TypedArray,p1: u32,p2: TypedArray,p3: u32): u32;
    hex_decode(p0: TypedArray,p1: u32,p2: TypedArray,p3: u32): u32;
    base64_encode(p0: TypedArray,p1: u32,p2: TypedArray,p3: u32): u32;
    base64_encode_str(p0: string,p1: u32,p2: pointer,p3: u32): u32;
    base64_decode(p0: TypedArray,p1: u32,p2: TypedArray,p3: u32): u32;
    base64_decode_str(p0: pointer,p1: u32,p2: string,p3: u32): u32;
  }
  libmdbx: {
    mdbx_env_create(p0: pointer): i32;
    mdbx_env_open0(p0: pointer,p1: string,p2: u32,p3: i32): i32;
    mdbx_env_stat_ex(p0: pointer,p1: pointer,p2: pointer,p3: i32): i32;
    mdbx_env_info_ex(p0: pointer,p1: pointer,p2: pointer,p3: i32): i32;
    mdbx_env_sync_ex(p0: pointer,p1: boolean | 1 | 0,p2: boolean | 1 | 0): i32;
    mdbx_env_sync_poll(p0: pointer): i32;
    mdbx_env_set_syncbytes(p0: pointer,p1: i32): i32;
    mdbx_env_get_syncbytes(p0: pointer,p1: pointer): i32;
    mdbx_env_set_syncperiod(p0: pointer,p1: u32): i32;
    mdbx_env_close_ex(p0: pointer,p1: boolean | 1 | 0): i32;
    mdbx_env_get_flags(p0: pointer,p1: pointer): i32;
    mdbx_env_get_path(p0: pointer,p1: TypedArray): i32;
    mdbx_env_get_fd(p0: pointer,p1: TypedArray): i32;
    mdbx_env_set_geometry0(p0: pointer,p1: pointer): i32;
    mdbx_is_readahead_reasonable(p0: i32,p1: i32): i32;
    mdbx_env_set_assert(p0: pointer,p1: pointer): i32;
    mdbx_strerror(p0: i32): pointer;
    mdbx_strerror_r(p0: i32,p1: pointer,p2: i32): pointer;
    mdbx_get_sysraminfo(p0: pointer,p1: pointer,p2: pointer): i32;
    mdbx_env_set_userctx(p0: pointer,p1: pointer): i32;
    mdbx_txn_begin_ex0(p0: pointer,p1: u32,p2: pointer,p3: pointer): i32;
    mdbx_txn_begin_ex1(p0: pointer,p1: pointer,p2: u32,p3: pointer,p4: pointer): i32;
    mdbx_txn_set_userctx(p0: pointer,p1: pointer): i32;
    mdbx_txn_info(p0: pointer,p1: pointer,p2: boolean | 1 | 0): i32;
    mdbx_txn_commit_ex(p0: pointer,p1: pointer): i32;
    mdbx_txn_abort(p0: pointer): i32;
    mdbx_txn_break(p0: pointer): i32;
    mdbx_txn_reset(p0: pointer): i32;
    mdbx_txn_renew(p0: pointer): i32;
    mdbx_canary_put(p0: pointer,p1: pointer): i32;
    mdbx_canary_get(p0: pointer,p1: pointer): i32;
    mdbx_dbi_open0(p0: pointer,p1: string,p2: u32,p3: pointer): i32;
    mdbx_dbi_open1(p0: pointer,p1: u32,p2: pointer): i32;
    mdbx_dbi_stat(p0: pointer,p1: u32,p2: pointer,p3: i32): i32;
    mdbx_dbi_dupsort_depthmask(p0: pointer,p1: u32,p2: pointer): i32;
    mdbx_dbi_flags_ex(p0: pointer,p1: u32,p2: pointer,p3: pointer): i32;
    mdbx_dbi_close(p0: pointer,p1: u32): i32;
    mdbx_drop(p0: pointer,p1: u32,p2: boolean | 1 | 0): i32;
    mdbx_get(p0: pointer,p1: u32,p2: pointer,p3: pointer): i32;
    mdbx_get_ex(p0: pointer,p1: u32,p2: pointer,p3: pointer,p4: pointer): i32;
    mdbx_get_equal_or_great(p0: pointer,p1: u32,p2: pointer,p3: pointer): i32;
    mdbx_put0(p0: pointer,p1: u32,p2: pointer,p3: pointer,p4: u32): i32;
    mdbx_del(p0: pointer,p1: u32,p2: pointer,p3: pointer): i32;
    mdbx_cursor_create(p0: pointer): pointer;
    mdbx_cursor_set_userctx(p0: pointer,p1: pointer): i32;
    mdbx_cursor_bind(p0: pointer,p1: pointer,p2: u32): i32;
    mdbx_cursor_open(p0: pointer,p1: u32,p2: pointer): i32;
    mdbx_cursor_close(p0: pointer): void;
    mdbx_cursor_renew(p0: pointer,p1: pointer): i32;
    mdbx_cursor_dbi(p0: pointer): u32;
    mdbx_cursor_copy(p0: pointer,p1: pointer): i32;
    mdbx_cursor_count(p0: pointer,p1: pointer): i32;
    mdbx_estimate_distance(p0: pointer,p1: pointer,p2: pointer): i32;
    mdbx_estimate_range(p0: pointer,p1: u32,p2: pointer,p3: pointer,p4: pointer,p5: pointer,p6: pointer): i32;
    mdbx_dbi_sequence(p0: pointer,p1: u32,p2: pointer,p3: pointer): i32;
    mdbx_reader_list(p0: pointer,p1: pointer,p2: pointer): i32;
    mdbx_reader_check(p0: pointer,p1: pointer): i32;
    mdbx_thread_register(p0: pointer): i32;
    mdbx_thread_unregister(p0: pointer): i32;
    mdbx_env_set_hsr(p0: pointer,p1: pointer): i32;
    mdbx_env_open_for_recovery(p0: pointer,p1: pointer,p2: u32,p3: boolean | 1 | 0): i32;
    mdbx_env_turn_for_recovery(p0: pointer,p1: u32): i32;
    mdbx_env_get_maxkeysize_ex0(p0: pointer,p1: u32): i32;
    MDBX_DB_DEFAULTS: u32;
    MDBX_REVERSEKEY: u32;
    MDBX_DUPSORT: u32;
    MDBX_INTEGERKEY: u32;
    MDBX_DUPFIXED: u32;
    MDBX_INTEGERDUP: u32;
    MDBX_REVERSEDUP: u32;
    MDBX_CREATE: u32;
    MDBX_DB_ACCEDE: u32;
    MDBX_UPSERT: u32;
    MDBX_NOOVERWRITE: u32;
    MDBX_NODUPDATA: u32;
    MDBX_CURRENT: u32;
    MDBX_ALLDUPS: u32;
    MDBX_RESERVE: u32;
    MDBX_APPEND: u32;
    MDBX_APPENDDUP: u32;
    MDBX_MULTIPLE: u32;
    MDBX_CP_DEFAULTS: i32;
    MDBX_CP_COMPACT: i32;
    MDBX_CP_FORCE_DYNAMIC_SIZE: i32;
    MDBX_FIRST: i32;
    MDBX_FIRST_DUP: i32;
    MDBX_GET_BOTH: i32;
    MDBX_GET_BOTH_RANGE: i32;
    MDBX_GET_CURRENT: i32;
    MDBX_GET_MULTIPLE: i32;
    MDBX_LAST: i32;
    MDBX_LAST_DUP: i32;
    MDBX_NEXT: i32;
    MDBX_NEXT_DUP: i32;
    MDBX_NEXT_MULTIPLE: i32;
    MDBX_NEXT_NODUP: i32;
    MDBX_PREV: i32;
    MDBX_PREV_DUP: i32;
    MDBX_PREV_NODUP: i32;
    MDBX_SET: i32;
    MDBX_SET_KEY: i32;
    MDBX_SET_RANGE: i32;
    MDBX_PREV_MULTIPLE: i32;
    MDBX_SET_LOWERBOUND: i32;
    MDBX_SET_UPPERBOUND: i32;
    MDBX_SUCCESS: i32;
    MDBX_RESULT_FALSE: i32;
    MDBX_RESULT_TRUE: i32;
    MDBX_KEYEXIST: i32;
    MDBX_FIRST_LMDB_ERRCODE: i32;
    MDBX_NOTFOUND: i32;
    MDBX_PAGE_NOTFOUND: i32;
    MDBX_CORRUPTED: i32;
    MDBX_PANIC: i32;
    MDBX_VERSION_MISMATCH: i32;
    MDBX_INVALID: i32;
    MDBX_MAP_FULL: i32;
    MDBX_DBS_FULL: i32;
    MDBX_READERS_FULL: i32;
    MDBX_TXN_FULL: i32;
    MDBX_CURSOR_FULL: i32;
    MDBX_PAGE_FULL: i32;
    MDBX_UNABLE_EXTEND_MAPSIZE: i32;
    MDBX_INCOMPATIBLE: i32;
    MDBX_BAD_RSLOT: i32;
    MDBX_BAD_TXN: i32;
    MDBX_BAD_VALSIZE: i32;
    MDBX_BAD_DBI: i32;
    MDBX_PROBLEM: i32;
    MDBX_LAST_LMDB_ERRCODE: i32;
    MDBX_BUSY: i32;
    MDBX_FIRST_ADDED_ERRCODE: i32;
    MDBX_EMULTIVAL: i32;
    MDBX_EBADSIGN: i32;
    MDBX_WANNA_RECOVERY: i32;
    MDBX_EKEYMISMATCH: i32;
    MDBX_TOO_LARGE: i32;
    MDBX_THREAD_MISMATCH: i32;
    MDBX_TXN_OVERLAPPING: i32;
    MDBX_BACKLOG_DEPLETED: i32;
    MDBX_DUPLICATED_CLK: i32;
    MDBX_LAST_ADDED_ERRCODE: i32;
    MDBX_ENODATA: i32;
    MDBX_EINVAL: i32;
    MDBX_EACCESS: i32;
    MDBX_ENOMEM: i32;
    MDBX_EROFS: i32;
    MDBX_ENOSYS: i32;
    MDBX_EIO: i32;
    MDBX_EPERM: i32;
    MDBX_EINTR: i32;
    MDBX_ENOFILE: i32;
    MDBX_EREMOTE: i32;
    MDBX_MAX_DBI: u32;
    MDBX_MAXDATASIZE: u32;
    MDBX_MIN_PAGESIZE: u32;
    MDBX_MAX_PAGESIZE: u32;
    MDBX_TXN_READWRITE: u32;
    MDBX_TXN_RDONLY: u32;
    MDBX_TXN_RDONLY_PREPARE: u32;
    MDBX_TXN_TRY: u32;
    MDBX_TXN_NOMETASYNC: u32;
    MDBX_TXN_NOSYNC: u32;
    MDBX_TXN_INVALID: u32;
    MDBX_TXN_FINISHED: u32;
    MDBX_TXN_ERROR: u32;
    MDBX_TXN_DIRTY: u32;
    MDBX_TXN_SPILLS: u32;
    MDBX_TXN_HAS_CHILD: u32;
    MDBX_TXN_BLOCKED: u32;
    MDBX_ENV_DEFAULTS: u32;
    MDBX_VALIDATION: u32;
    MDBX_NOSUBDIR: u32;
    MDBX_RDONLY: u32;
    MDBX_EXCLUSIVE: u32;
    MDBX_ACCEDE: u32;
    MDBX_WRITEMAP: u32;
    MDBX_NOTLS: u32;
    MDBX_NORDAHEAD: u32;
    MDBX_COALESCE: u32;
    MDBX_LIFORECLAIM: u32;
    MDBX_PAGEPERTURB: u32;
    MDBX_SYNC_DURABLE: u32;
    MDBX_NOMETASYNC: u32;
    MDBX_SAFE_NOSYNC: u32;
    MDBX_MAPASYNC: u32;
    MDBX_UTTERLY_NOSYNC: u32;
    MDBX_NOMEMINIT: u32;
    struct_MDBX_stat_size: number;
    struct_MDBX_val_size: number;
    struct_MDBX_envinfo_size: number;
    struct_MDBX_txn_info_size: number;
    struct_MDBX_commit_latency_size: number;
    struct_MDBX_canary_size: number;
    struct_MDBX_version_info_size: number;
    struct_MDBX_build_info_size: number;
  }
  shm: {
    ftok(p0: string,p1: i32): i32;
    shmget(p0: i32,p1: u32,p2: i32): i32;
    shmat2(p0: i32,p1: i32): u64;
    shmdt(p0: pointer): i32;
    shmctl(p0: i32,p1: i32,p2: pointer): i32;
    EINVAL: i32;
    IPC_CREAT: i32;
    IPC_PRIVATE: i32;
    IPC_RMID: i32;
    SHM_HUGETLB: i32;
    SHM_HUGE_2MB: i32;
    SHM_HUGE_1GB: i32;
    SHM_NORESERVE: i32;
    IPC_EXCL: i32;
    SHM_RDONLY: i32;
    SHM_REMAP: i32;
    SHM_EXEC: i32;
  }
  epoll: {
    create(p0: i32): i32;
    modify(p0: i32,p1: i32,p2: i32,p3: TypedArray): i32;
    wait(p0: i32,p1: TypedArray,p2: i32,p3: i32): i32;
    close(p0: i32): i32;
    EPOLLIN: i32;
    EPOLLOUT: i32;
    EPOLLERR: i32;
    EPOLLHUP: i32;
    EPOLL_CLOEXEC: i32;
    EPOLLEXCLUSIVE: i32;
    EPOLLWAKEUP: i32;
    EPOLLONESHOT: i32;
    EPOLLET: i32;
    EPOLL_CTL_ADD: i32;
    EPOLL_CTL_DEL: i32;
    EPOLL_CTL_MOD: i32;
    EVENT_SIZE: 12;
    EAGAIN: i32;
  }
  sws: {
    mask(p0: pointer,p1: pointer,p2: u32): void;
    shacalc(p0: string,p1: pointer,p2: i32): void;
  }
  net: {
    socket(p0: i32,p1: i32,p2: i32): i32;
    socketpair(p0: i32,p1: i32,p2: i32,p3: pointer): i32;
    setsockopt(p0: i32,p1: i32,p2: i32,p3: TypedArray,p4: i32): i32;
    getsockopt(p0: i32,p1: i32,p2: i32,p3: TypedArray,p4: pointer): i32;
    bind(p0: i32,p1: TypedArray,p2: i32): i32;
    connect(p0: i32,p1: TypedArray,p2: i32): i32;
    listen(p0: i32,p1: i32): i32;
    close(p0: i32): i32;
    accept(p0: i32,p1: pointer,p2: pointer): i32;
    send(p0: i32,p1: TypedArray,p2: u32,p3: i32): i32;
    send_string(p0: i32,p1: string,p2: u32,p3: i32): i32;
    send2(p0: i32,p1: pointer,p2: u32,p3: i32): i32;
    sendto(p0: i32,p1: TypedArray,p2: u32,p3: i32,p4: TypedArray,p5: u32): i32;
    recv(p0: i32,p1: TypedArray,p2: u32,p3: i32): i32;
    recv2(p0: i32,p1: pointer,p2: u32,p3: i32): i32;
    recvfrom(p0: i32,p1: TypedArray,p2: u32,p3: i32,p4: TypedArray,p5: TypedArray): i32;
    sendmsg(p0: i32,p1: TypedArray,p2: i32): i32;
    recvmsg(p0: i32,p1: TypedArray,p2: u32): i32;
    read(p0: i32,p1: TypedArray,p2: i32): i32;
    write_string(p0: i32,p1: string,p2: i32): i32;
    write(p0: i32,p1: TypedArray,p2: i32): i32;
    dup2(p0: i32,p1: i32): i32;
    getsockname(p0: i32,p1: TypedArray,p2: Uint32Array): i32;
    recvmmsg(p0: i32,p1: TypedArray,p2: i32,p3: i32,p4: TypedArray): i32;
    sendmmsg(p0: i32,p1: TypedArray,p2: i32,p3: i32): i32;
    pipe2(p0: Uint32Array,p1: i32): i32;
    accept4(p0: i32,p1: pointer,p2: pointer,p3: i32): i32;
    ioctl(p0: i32,p1: u32,p2: TypedArray): i32;
    ioctl2(p0: i32,p1: u32,p2: i32): i32;
    ioctl3(p0: i32,p1: u32,p2: pointer): i32;
    EINPROGRESS: i32;
    EAGAIN: i32;
    AF_INET: i32;
    AF_UNIX: i32;
    SOCK_STREAM: i32;
    SOL_SOCKET: i32;
    SO_REUSEPORT: i32;
    SOMAXCONN: i32;
    MSG_NOSIGNAL: i32;
    SOCK_DGRAM: i32;
    SOCK_RAW: i32;
    SIOCGIFADDR: i32;
    IPPROTO_RAW: i32;
    SIOCSIFFLAGS: i32;
    SIOCSIFADDR: i32;
    SIOCSIFNETMASK: i32;
    SOCKADDR_LEN: 16;
    TCP_NODELAY: i32;
    SO_REUSEADDR: i32;
    IPPROTO_TCP: i32;
    SO_KEEPALIVE: i32;
    INADDR_ANY: i32;
    IPPROTO_IP: i32;
    IP_ADD_MEMBERSHIP: i32;
    SO_INCOMING_CPU: i32;
    SO_INCOMING_NAPI_ID: i32;
    SO_PRIORITY: i32;
    SO_RCVBUF: i32;
    SO_SNDBUF: i32;
    SO_RCVTIMEO: i32;
    SO_SNDTIMEO: i32;
    SO_RCVLOWAT: i32;
    SO_SNDLOWAT: i32;
    SOCK_NONBLOCK: i32;
    SOCK_CLOEXEC: i32;
    PF_PACKET: i32;
    ETH_P_ALL: i32;
    ETH_P_ARP: i32;
    SIOCGIFHWADDR: i32;
    SIOCGIFINDEX: i32;
    IFF_TUN: i32;
    IFF_TAP: i32;
    IFF_NO_PI: i32;
    IFF_UP: i32;
    TUNSETIFF: i32;
    TUNSETPERSIST: i32;
    TCP_CORK: i32;
    SOCK_SEQPACKET: i32;
    SO_ERROR: i32;
    EACCES: i32;
    EPERM: i32;
    EADDRINUSE: i32;
    EADDRNOTAVAIL: i32;
    EAFNOSUPPORT: i32;
    EALREADY: i32;
    EBADF: i32;
    ECONNREFUSED: i32;
    EFAULT: i32;
    EINTR: i32;
    ENETUNREACH: i32;
    ENOTSOCK: i32;
    EPROTOTYPE: i32;
    ETIMEDOUT: i32;
    EISCONN: i32;
    MSG_TRUNC: i32;
    MSG_PEEK: i32;
    struct_ip_mreq_size: number;
  }
  pico: {
    parseRequest(p0: TypedArray,p1: u32,p2: TypedArray): i32;
    parseRequest2(p0: pointer,p1: u32,p2: pointer): i32;
    parseResponse(p0: TypedArray,p1: u32,p2: TypedArray): i32;
    parseResponse2(p0: pointer,p1: u32,p2: pointer): i32;
    parse_request(p0: pointer,p1: u32,p2: pointer,p3: pointer,p4: pointer,p5: pointer,p6: pointer,p7: pointer,p8: pointer,p9: u64): i32;
    parse_response(p0: pointer,p1: u32,p2: pointer,p3: pointer,p4: pointer,p5: pointer,p6: pointer,p7: pointer,p8: u32): i32;
    decode_chunked(p0: pointer,p1: pointer,p2: pointer): i32;
    struct_phr_chunked_decoder_size: number;
  }
  libssl: {
    OpenSSL_version(p0: i32): pointer;
    EVP_PKEY_CTX_new_id(p0: i32,p1: pointer): pointer;
    EVP_PKEY_keygen_init(p0: pointer): i32;
    EVP_PKEY_keygen(p0: pointer,p1: pointer): i32;
    EVP_PKEY_new(): pointer;
    EVP_PKEY_id(p0: pointer): i32;
    EVP_PKEY_type(p0: i32): i32;
    EVP_PKEY_free(p0: pointer): void;
    EVP_PKEY_CTX_free(p0: pointer): void;
    EVP_MD_CTX_new(): pointer;
    EVP_MD_CTX_reset(p0: pointer): i32;
    EVP_MD_CTX_free(p0: pointer): void;
    EVP_get_digestbynid(p0: i32): pointer;
    EVP_get_digestbyname(p0: string): pointer;
    EVP_Digest(p0: TypedArray,p1: u32,p2: TypedArray,p3: TypedArray,p4: pointer,p5: pointer): i32;
    EVP_DigestInit_ex(p0: pointer,p1: pointer,p2: pointer): i32;
    EVP_DigestUpdate(p0: pointer,p1: pointer,p2: u32): i32;
    EVP_DigestUpdateBuffer(p0: pointer,p1: TypedArray,p2: u32): i32;
    EVP_DigestUpdateString(p0: pointer,p1: string,p2: u32): i32;
    EVP_DigestVerifyFinal(p0: pointer,p1: pointer,p2: u32): i32;
    EVP_DigestSignFinal(p0: pointer,p1: pointer,p2: pointer): i32;
    EVP_DigestFinal(p0: pointer,p1: TypedArray,p2: Uint32Array): i32;
    EVP_sha1(): pointer;
    EVP_sha224(): pointer;
    EVP_sha256(): pointer;
    EVP_sha384(): pointer;
    EVP_sha512(): pointer;
    EVP_sha512_256(): pointer;
    EVP_DigestVerifyInit(p0: pointer,p1: pointer,p2: pointer,p3: pointer,p4: pointer): i32;
    EVP_DigestSignInit(p0: pointer,p1: pointer,p2: pointer,p3: pointer,p4: pointer): i32;
    BIO_s_mem(): pointer;
    BIO_new(p0: pointer): pointer;
    BIO_new_mem_buf(p0: pointer,p1: i32): pointer;
    BIO_ctrl(p0: pointer,p1: i32,p2: u64,p3: pointer): i32;
    BIO_read(p0: pointer,p1: pointer,p2: i32): i32;
    PEM_write_bio_PrivateKey(p0: pointer,p1: pointer,p2: pointer,p3: pointer,p4: i32,p5: pointer,p6: pointer): i32;
    PEM_write_bio_PUBKEY(p0: pointer,p1: pointer): i32;
    PEM_write_bio_X509_REQ(p0: pointer,p1: pointer): i32;
    PEM_read_bio_X509(p0: pointer,p1: pointer,p2: pointer,p3: pointer): pointer;
    X509_get_subject_name(p0: pointer): pointer;
    X509_NAME_oneline(p0: pointer,p1: pointer,p2: i32): pointer;
    X509_get_issuer_name(p0: pointer): pointer;
    X509_free(p0: pointer): void;
    X509_get_pubkey(p0: pointer): pointer;
    X509_REQ_new(): pointer;
    X509_REQ_set_version(p0: pointer,p1: u32): i32;
    X509_REQ_get_subject_name(p0: pointer): pointer;
    X509_NAME_add_entry_by_txt(p0: pointer,p1: pointer,p2: i32,p3: pointer,p4: i32,p5: i32,p6: i32): i32;
    X509_REQ_set_pubkey(p0: pointer,p1: pointer): i32;
    X509_REQ_sign(p0: pointer,p1: pointer,p2: pointer): i32;
    OBJ_txt2nid(p0: pointer): i32;
    SSL_get_error(p0: pointer,p1: i32): i32;
    OPENSSL_init_ssl(p0: u64,p1: pointer): i32;
    SSL_is_init_finished(p0: pointer): i32;
    SSL_shutdown(p0: pointer): i32;
    SSL_get_servername(p0: pointer,p1: i32): pointer;
    SSL_get_servername_type(p0: pointer): i32;
    SSL_free(p0: pointer): void;
    SSL_read(p0: pointer,p1: pointer,p2: i32): i32;
    SSL_peek(p0: pointer,p1: pointer,p2: i32): i32;
    SSL_write(p0: pointer,p1: pointer,p2: i32): i32;
    SSL_write_string(p0: pointer,p1: string,p2: i32): i32;
    SSL_get_version(p0: pointer): pointer;
    SSL_CIPHER_get_name(p0: pointer): pointer;
    SSL_get_current_cipher(p0: pointer): pointer;
    SSL_get_peer_certificate(p0: pointer): pointer;
    SSL_set_SSL_CTX(p0: pointer,p1: pointer): pointer;
    SSL_new(p0: pointer): pointer;
    SSL_set_fd(p0: pointer,p1: i32): i32;
    SSL_set_bio(p0: pointer,p1: pointer,p2: pointer): void;
    SSL_set_accept_state(p0: pointer): void;
    SSL_connect(p0: pointer): i32;
    SSL_accept(p0: pointer): i32;
    SSL_set_connect_state(p0: pointer): void;
    SSL_do_handshake(p0: pointer): i32;
    SSL_CTX_new(p0: pointer): pointer;
    SSL_CTX_use_certificate_file(p0: pointer,p1: pointer,p2: i32): i32;
    SSL_CTX_use_certificate_chain_file(p0: pointer,p1: pointer): i32;
    SSL_CTX_use_PrivateKey_file(p0: pointer,p1: pointer,p2: i32): i32;
    SSL_CTX_set_options(p0: pointer,p1: u64): u64;
    SSL_CTX_set_cipher_list(p0: pointer,p1: string): i32;
    SSL_pending(p0: pointer): i32;
    SSL_has_pending(p0: pointer): i32;
    SSL_set_cipher_list(p0: pointer,p1: string): i32;
    SSL_CTX_free(p0: pointer): void;
    TLS_server_method(): pointer;
    TLS_client_method(): pointer;
    SSL_CTX_set_ciphersuites(p0: pointer,p1: string): i32;
    SSL_ctrl(p0: pointer,p1: i32,p2: u64,p3: pointer): u64;
    RSA_pkey_ctx_ctrl(p0: pointer,p1: i32,p2: i32,p3: i32,p4: pointer): i32;
    EVP_sha512_224(): pointer;
    X509_new(): pointer;
    ASN1_INTEGER_set(p0: pointer,p1: i32): i32;
    X509_get_serialNumber(p0: pointer): pointer;
    X509_time_adj_ex(p0: pointer,p1: i32,p2: u32,p3: pointer): pointer;
    X509_gmtime_adj(p0: pointer,p1: u32): pointer;
    X509_getm_notBefore(p0: pointer): pointer;
    X509_getm_notAfter(p0: pointer): pointer;
    X509_set_pubkey(p0: pointer,p1: pointer): i32;
    X509_sign(p0: pointer,p1: pointer,p2: pointer): i32;
    PEM_write_bio_X509(p0: pointer,p1: pointer): i32;
    X509_set_issuer_name(p0: pointer,p1: pointer): i32;
    SSL_CTX_set_verify(p0: pointer,p1: i32,p2: pointer): void;
    SSL_CTX_set_read_ahead(p0: pointer,p1: i32): void;
    SSL_CTX_set_mode(p0: pointer,p1: u64): i32;
    SSL_OP_ALL: u64;
    SSL_OP_NO_RENEGOTIATION: u64;
    SSL_OP_NO_SSLv3: u64;
    SSL_OP_NO_TLSv1: u64;
    SSL_OP_NO_TLSv1_1: u64;
    SSL_OP_NO_DTLSv1: u64;
    SSL_OP_NO_DTLSv1_2: u64;
    SSL_OP_NO_TLSv1_2: u64;
    SSL_OP_NO_SSLv2: u64;
    SSL_OP_NO_COMPRESSION: u64;
    OPENSSL_VERSION_MAJOR: i32;
    SSL_ERROR_WANT_READ: i32;
    SSL_ERROR_WANT_WRITE: i32;
    SSL_ERROR_SSL: i32;
    SSL_ERROR_WANT_X509_LOOKUP: i32;
    SSL_ERROR_WANT_CONNECT: i32;
    SSL_ERROR_WANT_ACCEPT: i32;
    EVP_PKEY_RSA: i32;
    EVP_PKEY_OP_KEYGEN: i32;
    EVP_PKEY_CTRL_RSA_KEYGEN_BITS: i32;
    BIO_CTRL_PENDING: i32;
    SSL_FILETYPE_PEM: i32;
    SSL_VERIFY_NONE: i32;
    SSL_MODE_RELEASE_BUFFERS: u64;
    SSL_MODE_ACCEPT_MOVING_WRITE_BUFFER: u64;
  }
  core: {
  /**
* The  function  dlopen()  loads  the  dynamic shared object (shared library)
* file named by the null-terminated string filename and returns an opaque
* "handle" for the loaded object.  This handle is employed with other
* functions in the dlopen API, such as dlsym(3), dladdr(3), dlinfo(3),
* and dlclose()
*
* ```js
* const handle = assert(core.dlopen('libcurl.so', core.RTLD_NOW));
* ```
* @param file_path {string} the path to the shared library file to open.
* @param flags {number} (i32) resolve symbols now (RTLD_NOW) or lazily (RTLD_LAZY)
*/
// man: https://man7.org/linux/man-pages/man3/dlopen.3.html,https://developer.apple.com/library/archive/documentation/System/Conceptual/ManPages_iPhoneOS/man3/dlopen.3.html
  dlopen(p0: string,p1: i32): pointer;
    dlsym(p0: pointer,p1: string): pointer;
    dlclose(p0: pointer): i32;
    read(p0: i32,p1: TypedArray,p2: i32): i32;
    read2(p0: i32,p1: pointer,p2: i32): i32;
    write(p0: i32,p1: TypedArray,p2: i32): i32;
    write_string(p0: i32,p1: string,p2?: i32): i32;
    putchar(p0: i32): i32;
    close(p0: i32): i32;
    pread(p0: i32,p1: TypedArray,p2: i32,p3: u32): i32;
    lseek(p0: i32,p1: u32,p2: i32): u32;
    fstat(p0: i32,p1: TypedArray): i32;
    fcntl(p0: i32,p1: i32,p2: i32): i32;
    ftruncate(p0: i32,p1: u32): i32;
    mknod(p0: string,p1: i32,p2: i32): i32;
    stat(p0: string,p1: TypedArray): i32;
    lstat(p0: string,p1: TypedArray): i32;
    rename(p0: string,p1: string): i32;
    access(p0: string,p1: i32): i32;
    open(p0: string,p1: i32,p2?: i32): i32;
    unlink(p0: string): i32;
    openat(p0: i32,p1: string,p2: i32): i32;
    readdir(p0: pointer): pointer;
    readlink(p0: string,p1: TypedArray,p2: u32): u32;
    opendir(p0: string): pointer;
    fstatat(p0: i32,p1: string,p2: TypedArray,p3: i32): i32;
    mkdir(p0: string,p1: u32): i32;
    rmdir(p0: string): i32;
    closedir(p0: pointer): i32;
    chdir(p0: string): i32;
    fchdir(p0: i32): i32;
    mprotect(p0: pointer,p1: u32,p2: i32): i32;
    memcpy(p0: pointer,p1: pointer,p2: u32): pointer;
    memset(p0: pointer,p1: i32,p2: u32): pointer;
    memmove(p0: pointer,p1: pointer,p2: u32): pointer;
    shm_open(p0: string,p1: i32,p2: i32): i32;
    shm_unlink(p0: string): i32;
    mmap(p0: pointer,p1: u32,p2: i32,p3: i32,p4: i32,p5: u32): pointer;
    munmap(p0: pointer,p1: u32): i32;
    msync(p0: pointer,p1: u32,p2: i32): i32;
    calloc(p0: u32,p1: u32): pointer;
    aligned_alloc(p0: u32,p1: u32): pointer;
    free(p0: pointer): void;
        fastcall(p0: pointer): void;
    getenv(p0: string): pointer;
    setenv(p0: string,p1: string,p2: i32): i32;
    unsetenv(p0: string): i32;
    sleep(p0: i32): void;
    usleep(p0: u32): i32;
    dup(p0: i32): i32;
    dup2(p0: i32,p1: i32): i32;
    getcwd(p0: pointer,p1: i32): pointer;
    getpid(): i32;
    fork(): i32;
    kill(p0: i32,p1: i32): i32;
    waitpid(p0: i32,p1: TypedArray,p2: i32): i32;
    execvp(p0: string,p1: TypedArray): i32;
    execve(p0: string,p1: TypedArray,p2: TypedArray): i32;
    isatty(p0: i32): i32;
    tcgetattr(p0: i32,p1: TypedArray): i32;
    tcsetattr(p0: i32,p1: i32,p2: TypedArray): i32;
    exit(p0: i32): void;
    sysconf(p0: i32): u32;
    getrusage(p0: i32,p1: TypedArray): i32;
    times(p0: TypedArray): u32;
    isolate_create(p0: i32,p1: Uint32Array,p2: string,p3: u32,p4: string,p5: u32,p6: TypedArray,p7: i32,p8: i32,p9: u64,p10: string,p11: string,p12: i32,p13: i32,p14: pointer): i32;
    isolate_context_create(p0: i32,p1: pointer,p2: string,p3: u32,p4: string,p5: u32,p6: pointer,p7: i32,p8: i32,p9: u64,p10: string,p11: string,p12: i32,p13: i32,p14: pointer,p15: TypedArray): void;
    isolate_context_destroy(p0: TypedArray): void;
    isolate_context_size(): i32;
    isolate_start(p0: TypedArray): void;
    callback(p0: pointer): void;
    memmem(p0: pointer,p1: u32,p2: pointer,p3: u32): pointer;
    strnlen(p0: pointer,p1: u32): u32;
    strnlen_str(p0: string,p1: u32): u32;
    sync(): void;
    posix_fadvise(p0: i32,p1: u32,p2: u32,p3: i32): i32;
    ioctl(p0: i32,p1: u32,p2: TypedArray): i32;
    ioctl2(p0: i32,p1: u32,p2: i32): i32;
    ioctl3(p0: i32,p1: u32,p2: pointer): i32;
    reboot(p0: i32): i32;
    getdents(p0: i32,p1: pointer,p2: u32): u32;
    getaffinity(p0: i32,p1: u32,p2: pointer): i32;
    copy_file_range(p0: i32,p1: pointer,p2: i32,p3: pointer,p4: u32,p5: u32): u32;
  // man: https://man7.org/linux/man-pages/man2/memfd_create.2.html
  memfd_create(p0: string,p1: u32): i32;
    setaffinity(p0: i32,p1: u32,p2: pointer): i32;
    vfork(): i32;
    vexecve(p0: string,p1: TypedArray,p2: TypedArray): i32;
    vfexecve(p0: i32,p1: TypedArray,p2: TypedArray): i32;
    getpagesize(): i32;
    madvise(p0: pointer,p1: u32,p2: i32): i32;
    S_IFBLK: i32;
    S_IFCHR: i32;
    S_IFIFO: i32;
    S_IRUSR: i32;
    S_IWUSR: i32;
    S_IRGRP: i32;
    S_IWGRP: i32;
    S_IROTH: i32;
    S_IWOTH: i32;
    O_RDONLY: i32;
    O_WRONLY: i32;
    O_CREAT: i32;
    S_IRWXU: i32;
    S_IRWXG: i32;
    S_IXOTH: i32;
    O_TRUNC: i32;
    STDIN: 0;
    STDOUT: 1;
    STDERR: 2;
    O_CLOEXEC: i32;
    RUSAGE_SELF: i32;
    SEEK_SET: i32;
    SEEK_CUR: i32;
    SEEK_END: i32;
    S_IRWXO: i32;
    F_OK: i32;
    S_IFMT: i32;
    S_IFDIR: i32;
    S_IFREG: i32;
    NAME_MAX: u32;
    O_RDWR: i32;
    O_SYNC: i32;
    O_DIRECTORY: i32;
    F_SETFL: i32;
    O_NONBLOCK: i32;
    EAGAIN: i32;
    WNOHANG: i32;
    SIGTERM: i32;
    MAP_SHARED: i32;
    MAP_ANONYMOUS: i32;
    MAP_PRIVATE: i32;
    MS_ASYNC: i32;
    MS_SYNC: i32;
    MS_INVALIDATE: i32;
    _SC_CLK_TCK: i32;
    F_GETFL: i32;
    RTLD_NOW: i32;
    RTLD_LAZY: i32;
    RTLD_GLOBAL: i32;
    RTLD_LOCAL: i32;
    RTLD_NODELETE: i32;
    RTLD_NOLOAD: i32;
    RTLD_DEFAULT: u64;
    RTLD_NEXT: u64;
    PROT_READ: i32;
    PROT_WRITE: i32;
    PROT_EXEC: i32;
    LINUX_REBOOT_CMD_HALT: u32;
    LINUX_REBOOT_CMD_POWER_OFF: u32;
    LINUX_REBOOT_CMD_RESTART: u32;
    RB_POWER_OFF: i32;
    EINTR: i32;
    MFD_CLOEXEC: i32;
    MAP_HUGETLB: i32;
    MAP_HUGE_SHIFT: i32;
    MADV_HUGEPAGE: i32;
    MAP_FIXED: i32;
    POSIX_FADV_SEQUENTIAL: i32;
    POSIX_FADV_WILLNEED: i32;
    POSIX_FADV_RANDOM: i32;
    POSIX_FADV_DONTNEED: i32;
    struct_clock_t_size: number;
    struct_cpu_set_t_size: number;
  }
  bestlines: {
    bestline(p0: TypedArray): pointer;
    bestline_raw(p0: TypedArray,p1: i32,p2: i32): pointer;
    cls(p0: i32): void;
    add(p0: pointer): i32;
    save(p0: string): i32;
    load(p0: string): i32;
  }
  heap: {
    }
  mach: {
    task_info(p0: u32,p1: i32,p2: pointer,p3: pointer): i32;
    task_self(): u32;
    get_executable_path(p0: pointer,p1: Uint32Array): i32;
    TASK_BASIC_INFO_COUNT: i32;
    KERN_SUCCESS: i32;
    TASK_BASIC_INFO: i32;
    struct_task_basic_info_size: number;
    struct_mach_msg_type_number_t_size: number;
  }
  tcc: {
    create(): pointer;
    delete(p0: pointer): void;
    set_output_type(p0: pointer,p1: i32): i32;
    set_options(p0: pointer,p1: string): void;
    add_library_path(p0: pointer,p1: string): i32;
    add_library(p0: pointer,p1: string): i32;
    add_include_path(p0: pointer,p1: string): i32;
    add_file(p0: pointer,p1: string): i32;
    compile_string(p0: pointer,p1: string): i32;
    relocate(p0: pointer): i32;
    get_symbol(p0: pointer,p1: string): pointer;
    add_symbol(p0: pointer,p1: string,p2: pointer): i32;
    output_file(p0: pointer,p1: string): i32;
    list_symbols(p0: pointer,p1: pointer,p2: pointer): void;
  }
  fsmount: {
    mount(p0: string,p1: string,p2: string,p3: u32,p4: pointer): i32;
    umount(p0: string): i32;
    umount2(p0: string,p1: i32): i32;
    MNT_FORCE: i32;
    MNT_DETACH: i32;
    MNT_EXPIRE: i32;
    UMOUNT_NOFOLLOW: i32;
    MS_DIRSYNC: u32;
    MS_LAZYTIME: u32;
    MS_MANDLOCK: u32;
    MS_NOATIME: u32;
    MS_NODEV: u32;
    MS_NODIRATIME: u32;
    MS_NOEXEC: u32;
    MS_NOSUID: u32;
    MS_RDONLY: u32;
    MS_REC: u32;
    MS_RELATIME: u32;
    MS_SILENT: u32;
    MS_STRICTATIME: u32;
    MS_SYNCHRONOUS: u32;
    MS_NOSYMFOLLOW: u32;
  }
  pthread: {
    create(p0: Uint32Array,p1: pointer,p2: pointer,p3: TypedArray): i32;
    cancel(p0: u64): i32;
    detach(p0: u64): i32;
    join(p0: u64,p1: pointer): i32;
    exit(p0: Uint32Array): void;
    tryJoin(p0: u64,p1: pointer): i32;
    setName(p0: u64,p1: string): i32;
    setAffinity(p0: u64,p1: u32,p2: TypedArray): i32;
    getAffinity(p0: u64,p1: u32,p2: TypedArray): i32;
    getcpuclockid(p0: u64,p1: Uint32Array): i32;
    self(): u64;
    EBUSY: i32;
  }
  sqlite: {
    version(): pointer;
    open(p0: pointer,p1: Uint32Array): i32;
    open2(p0: string,p1: Uint32Array,p2: i32,p3: pointer): i32;
    exec(p0: pointer,p1: string,p2: pointer,p3: pointer,p4: Uint32Array): i32;
    exec2(p0: pointer,p1: string,p2: pointer,p3: pointer,p4: Uint32Array): i32;
    exec3(p0: pointer,p1: pointer,p2: pointer,p3: pointer,p4: pointer): i32;
    exec4(p0: pointer,p1: pointer,p2: pointer,p3: pointer,p4: pointer): i32;
    errmsg(p0: pointer): pointer;
    close2(p0: pointer): i32;
    prepare2(p0: pointer,p1: string,p2: i32,p3: Uint32Array,p4: pointer): i32;
    finalize(p0: pointer): i32;
    column_count(p0: pointer): i32;
    column_type(p0: pointer,p1: i32): i32;
    column_name(p0: pointer,p1: i32): pointer;
    step(p0: pointer): i32;
    reset(p0: pointer): i32;
    bind_int(p0: pointer,p1: i32,p2: i32): i32;
    bind_int64(p0: pointer,p1: i32,p2: u64): i32;
    bind_double(p0: pointer,p1: i32,p2: f64): i32;
    bind_text(p0: pointer,p1: i32,p2: string,p3: i32,p4: u64): i32;
    bind_blob(p0: pointer,p1: i32,p2: TypedArray,p3: i32,p4: u64): i32;
    column_int(p0: pointer,p1: i32): i32;
    column_double(p0: pointer,p1: i32): f32;
    column_text(p0: pointer,p1: i32): pointer;
    column_blob(p0: pointer,p1: i32): pointer;
    column_bytes(p0: pointer,p1: i32): i32;
    blob_open(p0: pointer,p1: string,p2: string,p3: string,p4: i64,p5: i32,p6: Uint32Array): i32;
    blob_bytes(p0: pointer): i32;
    blob_read(p0: pointer,p1: TypedArray,p2: i32,p3: i32): i32;
    blob_close(p0: pointer): i32;
    blob_write(p0: pointer,p1: TypedArray,p2: i32,p3: i32): i32;
    serialize(p0: pointer,p1: string,p2: Uint32Array,p3: u32): pointer;
    deserialize(p0: pointer,p1: string,p2: TypedArray,p3: u32,p4: u32,p5: u32): i32;
    initialize(): i32;
    SQLITE_OPEN_READWRITE: i32;
    SQLITE_OPEN_PRIVATECACHE: i32;
    SQLITE_ROW: i32;
    SQLITE_OPEN_NOMUTEX: i32;
    SQLITE_OPEN_CREATE: i32;
    SQLITE_OK: i32;
    SQLITE_OPEN_READONLY: i32;
  }
  kevents: {
    kqueue(): i32;
    kevent(p0: i32,p1: pointer,p2: i32,p3: pointer,p4: i32,p5: pointer): i32;
    kevent64(p0: i32,p1: pointer,p2: i32,p3: pointer,p4: i32,p5: u32,p6: pointer): i32;
    EVFILT_READ: i32;
    EVFILT_EXCEPT: i32;
    EVFILT_WRITE: i32;
    EVFILT_VNODE: i32;
    EVFILT_PROC: i32;
    EVFILT_SIGNAL: i32;
    EVFILT_MACHPORT: i32;
    EVFILT_TIMER: i32;
    EV_ADD: i32;
    EV_ENABLE: i32;
    EV_DISABLE: i32;
    EV_DELETE: i32;
    EV_RECEIPT: i32;
    EV_ONESHOT: i32;
    EV_CLEAR: i32;
    EV_EOF: i32;
    EV_OOBAND: i32;
    EV_ERROR: i32;
    KEVENT_FLAG_IMMEDIATE: i32;
    struct_kevent64_s_size: number;
    struct_time_t_size: number;
    struct_timespec_size: number;
  }
  duckdb: {
    create_config(p0: pointer): i32;
    open_ext(p0: string,p1: Uint32Array,p2: pointer,p3: pointer): i32;
    set_config(p0: pointer,p1: string,p2: string): i32;
    connect(p0: pointer,p1: Uint32Array): i32;
    query(p0: pointer,p1: string,p2: pointer): i32;
    prepare(p0: pointer,p1: string,p2: Uint32Array): i32;
    row_count(p0: pointer): i32;
    column_count(p0: pointer): i32;
    value_timestamp(p0: pointer,p1: u32,p2: u32): pointer;
    value_uint32(p0: pointer,p1: u32,p2: u32): u32;
    value_int32(p0: pointer,p1: u32,p2: u32): i32;
    value_varchar(p0: pointer,p1: u32,p2: u32): pointer;
    close(p0: pointer): void;
    destroy_result(p0: pointer): void;
    destroy_prepare(p0: pointer): void;
    execute_prepared(p0: pointer,p1: pointer): i32;
    column_name(p0: pointer,p1: u32): pointer;
    column_type(p0: pointer,p1: u32): i32;
    result_error(p0: pointer): pointer;
    value_is_null(p0: pointer,p1: u32,p2: u32): u32;
    disconnect(p0: pointer): void;
    library_version(): pointer;
    DuckDBSuccess: i32;
    DuckDBError: i32;
    struct_duckdb_config_size: number;
    struct_duckdb_result_size: number;
    struct_duckdb_connection_size: number;
    struct_duckdb_database_size: number;
    struct_duckdb_prepared_statement_size: number;
  }
  netlink: {
    set_address(p0: i32,p1: string,p2: string,p3: i32): i32;
    device_up(p0: i32,p1: string): i32;
    device_down(p0: i32,p1: string): i32;
    RTM_NEWADDR: i32;
    RTM_DELADDR: i32;
  }
  rustls: {
    version(): pointer;
    client_config_builder_new(): pointer;
    connection_set_log_callback(p0: pointer,p1: pointer): void;
    connection_set_userdata(p0: pointer,p1: pointer): void;
    client_config_builder_dangerous_set_certificate_verifier(p0: pointer,p1: pointer): u32;
    root_cert_store_builder_new(): pointer;
    root_cert_store_builder_load_roots_from_file(p0: pointer,p1: string,p2: boolean | 1 | 0): u32;
    root_cert_store_builder_load_roots_from_bytes(p0: pointer,p1: TypedArray,p2: u32,p3: boolean | 1 | 0): u32;
    root_cert_store_builder_build(p0: pointer,p1: pointer): u32;
    web_pki_server_cert_verifier_builder_new(p0: pointer): pointer;
    web_pki_server_cert_verifier_builder_build(p0: pointer,p1: pointer): u32;
    client_config_builder_set_server_verifier(p0: pointer,p1: pointer): void;
    client_config_builder_set_enable_sni(p0: pointer,p1: boolean | 1 | 0): void;
    client_config_builder_set_alpn_protocols(p0: pointer,p1: pointer,p2: u32): u32;
    client_config_builder_build(p0: pointer): pointer;
    client_config_free(p0: pointer): void;
    client_connection_new(p0: pointer,p1: pointer,p2: Uint32Array): u32;
    connection_wants_read(p0: pointer): u32;
    connection_read_tls(p0: pointer,p1: pointer,p2: TypedArray,p3: Uint32Array): u32;
    connection_read_tls_from_fd(p0: pointer,p1: i32,p2: Uint32Array): u32;
    connection_read(p0: pointer,p1: TypedArray,p2: u32,p3: Uint32Array): u32;
    connection_wants_write(p0: pointer): u32;
    connection_write_tls(p0: pointer,p1: pointer,p2: TypedArray,p3: Uint32Array): u32;
    connection_write_tls_to_fd(p0: pointer,p1: i32,p2: Uint32Array): u32;
    connection_write(p0: pointer,p1: TypedArray,p2: u32,p3: Uint32Array): u32;
    connection_process_new_packets(p0: pointer): u32;
    connection_free(p0: pointer): void;
  }
  libffi: {
    ffi_prep_cif(p0: TypedArray,p1: u32,p2: u32,p3: TypedArray,p4: TypedArray): i32;
    ffi_call(p0: TypedArray,p1: pointer,p2: Uint32Array,p3: TypedArray): void;
      }
  cfzlib: {
    deflate(p0: TypedArray,p1: u32,p2: TypedArray,p3: u32): u32;
    inflate(p0: TypedArray,p1: u32,p2: TypedArray,p3: u32): u32;
  }
  mbedtls: {
    x509_crt_init(p0: pointer): void;
    net_init(p0: pointer): void;
    ssl_init(p0: pointer): void;
    ssl_config_init(p0: pointer): void;
    entropy_init(p0: pointer): void;
    ctr_drbg_init(p0: pointer): void;
    x509_crt_parse_der(p0: pointer,p1: pointer,p2: u32): i32;
    debug_set_threshold(p0: i32): void;
    ctr_drbg_seed(p0: pointer,p1: pointer,p2: pointer,p3: pointer,p4: u32): i32;
    exit(p0: i32): void;
    x509_crt_parse(p0: pointer,p1: pointer,p2: u32): i32;
    ssl_config_defaults(p0: pointer,p1: i32,p2: i32,p3: i32): i32;
    ssl_conf_max_frag_len(p0: pointer,p1: u8): i32;
    ssl_conf_rng(p0: pointer,p1: pointer,p2: pointer): void;
    ssl_conf_dbg(p0: pointer,p1: pointer,p2: pointer): void;
    ssl_conf_read_timeout(p0: pointer,p1: u32): void;
    ssl_conf_session_tickets(p0: pointer,p1: i32): void;
    ssl_conf_renegotiation(p0: pointer,p1: i32): void;
    ssl_conf_ca_chain(p0: pointer,p1: pointer,p2: pointer): void;
    ssl_conf_min_version(p0: pointer,p1: i32,p2: i32): void;
    ssl_conf_max_version(p0: pointer,p1: i32,p2: i32): void;
    ssl_setup(p0: pointer,p1: pointer): i32;
    ssl_set_hostname(p0: pointer,p1: string): i32;
    ssl_set_bio(p0: pointer,p1: pointer,p2: pointer,p3: pointer,p4: pointer): void;
    net_connect(p0: pointer,p1: string,p2: string,p3: i32): i32;
    net_set_block(p0: pointer): i32;
    ssl_handshake(p0: pointer): i32;
    ssl_get_version(p0: pointer): pointer;
    ssl_get_ciphersuite(p0: pointer): pointer;
    ssl_get_verify_result(p0: pointer): u32;
    ssl_write(p0: pointer,p1: pointer,p2: u32): i32;
    ssl_read(p0: pointer,p1: pointer,p2: u32): i32;
    ssl_close_notify(p0: pointer): i32;
    net_free(p0: pointer): void;
    ssl_free(p0: pointer): void;
    ssl_config_free(p0: pointer): void;
    x509_crt_free(p0: pointer): void;
    ctr_drbg_free(p0: pointer): void;
    entropy_free(p0: pointer): void;
    dhm_init(p0: pointer): void;
    md5_init(p0: pointer): void;
    md5_free(p0: pointer): void;
    md5_starts(p0: pointer): void;
    md5_update(p0: pointer,p1: pointer,p2: u32): void;
    md5_finish(p0: pointer,p1: pointer): void;
    md5_update_string(p0: pointer,p1: string,p2: u32): void;
    sha256_init(p0: pointer): void;
    sha256_free(p0: pointer): void;
    sha256_starts(p0: pointer,p1: i32): void;
    sha256_update(p0: pointer,p1: pointer,p2: u32): void;
    sha256_update_string(p0: pointer,p1: string,p2: u32): void;
    sha256_finish(p0: pointer,p1: pointer): void;
    MBEDTLS_SSL_IS_CLIENT: i32;
    MBEDTLS_SSL_TRANSPORT_STREAM: i32;
    MBEDTLS_SSL_PRESET_DEFAULT: i32;
    MBEDTLS_SSL_MAX_FRAG_LEN_NONE: i32;
    MBEDTLS_SSL_SESSION_TICKETS_ENABLED: i32;
    MBEDTLS_SSL_TLS1_3_KEY_EXCHANGE_MODE_ALL: i32;
    MBEDTLS_SSL_RENEGOTIATION_DISABLED: i32;
    MBEDTLS_SSL_MAJOR_VERSION_3: i32;
    MBEDTLS_SSL_MINOR_VERSION_4: i32;
    MBEDTLS_NET_PROTO_TCP: i32;
    MBEDTLS_ERR_SSL_WANT_READ: i32;
    MBEDTLS_ERR_SSL_WANT_WRITE: i32;
    MBEDTLS_ERR_SSL_CRYPTO_IN_PROGRESS: i32;
    MBEDTLS_ERR_SSL_PEER_CLOSE_NOTIFY: i32;
    struct_mbedtls_net_context_size: number;
    struct_mbedtls_x509_crt_size: number;
    struct_mbedtls_entropy_context_size: number;
    struct_mbedtls_ssl_context_size: number;
    struct_mbedtls_ssl_config_size: number;
    struct_mbedtls_ctr_drbg_context_size: number;
    struct_mbedtls_dhm_context_size: number;
    struct_mbedtls_md5_context_size: number;
    struct_mbedtls_sha256_context_size: number;
  }
  seccomp: {
    seccomp_syscall_resolve_num_arch(p0: i32,p1: i32): pointer;
    seccomp_init(p0: u32): pointer;
    seccomp_rule_add_exact(p0: pointer,p1: u32,p2: i32,p3: u32): i32;
    seccomp_load(p0: pointer): i32;
    seccomp_release(p0: pointer): void;
    seccomp_syscall_resolve_name(p0: string): i32;
  }
  lz4: {
    compress_default(p0: pointer,p1: pointer,p2: i32,p3: i32): i32;
    compress_hc(p0: pointer,p1: pointer,p2: i32,p3: i32,p4: i32): i32;
    decompress_safe(p0: pointer,p1: pointer,p2: i32,p3: i32): i32;
  }
  zlib: {
    deflate(p0: TypedArray,p1: u32,p2: TypedArray,p3: u32,p4: u32): u32;
    inflate(p0: TypedArray,p1: u32,p2: TypedArray,p3: u32): u32;
  }
  wireguard: {
    set(p0: pointer): i32;
    get(p0: Uint32Array,p1: string): i32;
    add(p0: string): i32;
    delete(p0: string): i32;
    free(p0: pointer): void;
    list(): pointer;
    keytobase64(p0: TypedArray,p1: TypedArray): void;
    keyfrombase64(p0: TypedArray,p1: TypedArray): i32;
    genpubKey(p0: TypedArray,p1: TypedArray): void;
    genprivKey(p0: TypedArray): void;
    genpresharedKey(p0: TypedArray): void;
  }
  simdutf8: {
        base64_to_binary_safe_fast(p0: pointer,p1: u32,p2: string,p3: u32): u32;
    base64_to_binary_safe_fast2(p0: pointer,p1: u32,p2: string,p3: u32): u32;
    is_utf8(p0: pointer,p1: u32): u32;
    utf8_length(p0: pointer,p1: u32): u32;
  }
  raylib: {
    InitWindow(p0: i32,p1: i32,p2: string): void;
    SetTargetFPS(p0: i32): void;
    WindowShouldClose(): boolean | 1 | 0;
    IsKeyPressed(p0: i32): boolean | 1 | 0;
    IsGestureDetected(p0: u32): boolean | 1 | 0;
    BeginDrawing(): void;
    ClearBackground(p0: TypedArray): void;
    DrawText(p0: string,p1: i32,p2: i32,p3: i32,p4: TypedArray): void;
    DrawRectangle(p0: i32,p1: i32,p2: i32,p3: i32,p4: TypedArray): void;
    EndDrawing(): void;
    CloseWindow(): void;
  }
  curl: {
    fopen(p0: string,p1: string): pointer;
    fdopen(p0: i32,p1: string): pointer;
    fclose(p0: pointer): i32;
    fflush(p0: pointer): i32;
    global_init(p0: u32): i32;
    easy_init(): pointer;
    version(): pointer;
    easy_setopt(p0: pointer,p1: u32,p2: string): i32;
    easy_setopt_2(p0: pointer,p1: u32,p2: u32): i32;
    easy_setopt_3(p0: pointer,p1: u32,p2: u64): i32;
    easy_perform(p0: pointer): i32;
    easy_cleanup(p0: pointer): void;
    global_cleanup(): void;
    easy_getinfo(p0: pointer,p1: u32,p2: Uint32Array): i32;
    CURLINFO_OFF_T: i32;
    CURL_GLOBAL_DEFAULT: i32;
    CURLOPT_URL: i32;
    CURLOPT_BUFFERSIZE: i32;
    CURLOPT_HTTP_VERSION: i32;
    CURL_HTTP_VERSION_1_1: i32;
    CURLOPT_FOLLOWLOCATION: i32;
    CURLINFO_SIZE_DOWNLOAD_T: i32;
    CURLOPT_WRITEFUNCTION: i32;
    CURLOPT_WRITEDATA: i32;
    CURLINFO_RESPONSE_CODE: i32;
    CURLOPT_FAILONERROR: i32;
    CURL_GLOBAL_NOTHING: i32;
    CURLOPT_ERRORBUFFER: i32;
    CURLOPT_HEADER: i32;
    CURLOPT_USERAGENT: i32;
  }
  webui: {
    webui_wait(): void;
    webui_new_window(): u32;
    webui_show(p0: u32,p1: TypedArray): boolean | 1 | 0;
    webui_show_browser(p0: u32,p1: string,p2: u32): u32;
    webui_interface_bind(p0: u32,p1: string,p2: pointer): u32;
    webui_script(p0: u32,p1: string,p2: u32,p3: string,p4: u32): u32;
    webui_run(p0: u32,p1: string): void;
    webui_interface_set_response(p0: u32,p1: u32,p2: string): void;
    webui_exit(): void;
    webui_is_shown(p0: u32): u32;
    webui_close(p0: u32): void;
    webui_set_file_handler(p0: u32,p1: pointer): void;
    webui_interface_is_app_running(): u32;
    webui_set_profile(p0: u32,p1: string,p2: string): void;
    webui_interface_get_int_at(p0: u32,p1: u32,p2: u32): i64;
    webui_interface_get_string_at(p0: u32,p1: u32,p2: u32): pointer;
    webui_clean(): void;
    webui_set_root_folder(p0: u32,p1: string): u32;
    webui_set_tls_certificate(p0: string,p1: string): u32;
    webui_set_kiosk(p0: u32,p1: u32): void;
    webui_destroy(p0: u32): void;
    webui_set_timeout(p0: u32): void;
    webui_set_icon(p0: u32,p1: string,p2: string): void;
    webui_encode(p0: string): pointer;
    webui_decode(p0: string): pointer;
    webui_free(p0: pointer): void;
    webui_malloc(p0: u32): pointer;
    webui_send_raw(p0: u32,p1: string,p2: TypedArray,p3: u32): void;
    webui_set_hide(p0: u32,p1: u32): void;
    webui_set_size(p0: u32,p1: u32,p2: u32): void;
    webui_set_position(p0: u32,p1: u32,p2: u32): void;
    webui_get_url(p0: u32): pointer;
    webui_set_public(p0: u32,p1: u32): void;
    webui_navigate(p0: u32,p1: string): void;
    webui_delete_all_profiles(): void;
    webui_delete_profile(p0: u32): void;
    webui_get_parent_process_id(p0: u32): u32;
    webui_get_child_process_id(p0: u32): u32;
    webui_set_port(p0: u32,p1: u32): u32;
    webui_set_runtime(p0: u32,p1: u32): void;
  }
  hescape: {
    hesc_escape_html(p0: pointer,p1: string,p2: u32): u32;
  }
  boringssl: {
    OpenSSL_version(p0: i32): pointer;
    EVP_PKEY_CTX_new_id(p0: i32,p1: pointer): pointer;
    EVP_PKEY_keygen_init(p0: pointer): i32;
    EVP_PKEY_keygen(p0: pointer,p1: pointer): i32;
    EVP_PKEY_new(): pointer;
    EVP_PKEY_id(p0: pointer): i32;
    EVP_PKEY_type(p0: i32): i32;
    EVP_PKEY_free(p0: pointer): void;
    EVP_PKEY_CTX_free(p0: pointer): void;
    EVP_MD_CTX_new(): pointer;
    EVP_MD_CTX_reset(p0: pointer): i32;
    EVP_MD_CTX_free(p0: pointer): void;
    EVP_MD_CTX_init(p0: pointer): void;
    EVP_get_digestbynid(p0: i32): pointer;
    EVP_get_digestbyname(p0: string): pointer;
    EVP_Digest(p0: TypedArray,p1: u32,p2: TypedArray,p3: TypedArray,p4: pointer,p5: pointer): i32;
    EVP_DigestInit_ex(p0: pointer,p1: pointer,p2: pointer): i32;
    EVP_DigestUpdate(p0: pointer,p1: pointer,p2: u32): i32;
    EVP_DigestUpdateBuffer(p0: pointer,p1: TypedArray,p2: u32): i32;
    EVP_DigestUpdateString(p0: pointer,p1: string,p2: u32): i32;
    EVP_DigestVerifyFinal(p0: pointer,p1: pointer,p2: u32): i32;
    EVP_DigestSignFinal(p0: pointer,p1: pointer,p2: pointer): i32;
    EVP_DigestFinal(p0: pointer,p1: TypedArray,p2: Uint32Array): i32;
    EVP_DigestFinal_ex(p0: pointer,p1: TypedArray,p2: Uint32Array): i32;
    EVP_sha1(): pointer;
    EVP_sha224(): pointer;
    EVP_sha256(): pointer;
    EVP_sha384(): pointer;
    EVP_sha512(): pointer;
    EVP_sha512_256(): pointer;
    EVP_DigestVerifyInit(p0: pointer,p1: pointer,p2: pointer,p3: pointer,p4: pointer): i32;
    EVP_DigestSignInit(p0: pointer,p1: pointer,p2: pointer,p3: pointer,p4: pointer): i32;
    BIO_s_mem(): pointer;
    BIO_new(p0: pointer): pointer;
    BIO_new_mem_buf(p0: pointer,p1: i32): pointer;
    BIO_ctrl(p0: pointer,p1: i32,p2: u64,p3: pointer): i32;
    BIO_read(p0: pointer,p1: pointer,p2: i32): i32;
    PEM_write_bio_PrivateKey(p0: pointer,p1: pointer,p2: pointer,p3: pointer,p4: i32,p5: pointer,p6: pointer): i32;
    PEM_write_bio_PUBKEY(p0: pointer,p1: pointer): i32;
    PEM_write_bio_X509_REQ(p0: pointer,p1: pointer): i32;
    PEM_read_bio_X509(p0: pointer,p1: pointer,p2: pointer,p3: pointer): pointer;
    X509_get_subject_name(p0: pointer): pointer;
    X509_NAME_oneline(p0: pointer,p1: pointer,p2: i32): pointer;
    X509_get_issuer_name(p0: pointer): pointer;
    X509_free(p0: pointer): void;
    BIO_free(p0: pointer): void;
    X509_get_pubkey(p0: pointer): pointer;
    X509_REQ_new(): pointer;
    X509_REQ_set_version(p0: pointer,p1: u32): i32;
    X509_REQ_get_subject_name(p0: pointer): pointer;
    X509_NAME_add_entry_by_txt(p0: pointer,p1: pointer,p2: i32,p3: pointer,p4: i32,p5: i32,p6: i32): i32;
    X509_REQ_set_pubkey(p0: pointer,p1: pointer): i32;
    X509_REQ_sign(p0: pointer,p1: pointer,p2: pointer): i32;
    OBJ_txt2nid(p0: pointer): i32;
    SSL_get_error(p0: pointer,p1: i32): i32;
    OPENSSL_init_ssl(p0: u64,p1: pointer): i32;
    SSL_is_init_finished(p0: pointer): i32;
    SSL_shutdown(p0: pointer): i32;
    SSL_get_servername(p0: pointer,p1: i32): pointer;
    SSL_get_servername_type(p0: pointer): i32;
    SSL_free(p0: pointer): void;
    SSL_read(p0: pointer,p1: pointer,p2: i32): i32;
    SSL_write(p0: pointer,p1: pointer,p2: i32): i32;
    SSL_write_string(p0: pointer,p1: string,p2: i32): i32;
    SSL_get_version(p0: pointer): pointer;
    SSL_CIPHER_get_name(p0: pointer): pointer;
    SSL_get_current_cipher(p0: pointer): pointer;
    SSL_get_peer_certificate(p0: pointer): pointer;
    SSL_set_SSL_CTX(p0: pointer,p1: pointer): pointer;
    SSL_new(p0: pointer): pointer;
    SSL_set_fd(p0: pointer,p1: i32): i32;
    SSL_set_bio(p0: pointer,p1: pointer,p2: pointer): void;
    SSL_set_accept_state(p0: pointer): void;
    SSL_connect(p0: pointer): i32;
    SSL_accept(p0: pointer): i32;
    SSL_set_connect_state(p0: pointer): void;
    SSL_do_handshake(p0: pointer): i32;
    SSL_CTX_new(p0: pointer): pointer;
    SSL_CTX_use_certificate_file(p0: pointer,p1: pointer,p2: i32): i32;
    SSL_CTX_use_certificate_chain_file(p0: pointer,p1: pointer): i32;
    SSL_CTX_use_PrivateKey_file(p0: pointer,p1: pointer,p2: i32): i32;
    SSL_CTX_set_options(p0: pointer,p1: u64): u64;
    SSL_CTX_set_cipher_list(p0: pointer,p1: string): i32;
    SSL_set_cipher_list(p0: pointer,p1: string): i32;
    SSL_CTX_free(p0: pointer): void;
    TLS_server_method(): pointer;
    TLS_client_method(): pointer;
    X509_new(): pointer;
    ASN1_INTEGER_set(p0: pointer,p1: i32): i32;
    X509_get_serialNumber(p0: pointer): pointer;
    X509_time_adj_ex(p0: pointer,p1: i32,p2: u32,p3: pointer): pointer;
    X509_gmtime_adj(p0: pointer,p1: u32): pointer;
    X509_getm_notBefore(p0: pointer): pointer;
    X509_getm_notAfter(p0: pointer): pointer;
    X509_set_pubkey(p0: pointer,p1: pointer): i32;
    X509_sign(p0: pointer,p1: pointer,p2: pointer): i32;
    PEM_write_bio_X509(p0: pointer,p1: pointer): i32;
    X509_set_issuer_name(p0: pointer,p1: pointer): i32;
    SSL_CTX_set_read_ahead(p0: pointer,p1: i32): void;
    SSL_pending(p0: pointer): i32;
    SSL_has_pending(p0: pointer): i32;
    SSL_OP_ALL: u64;
    SSL_OP_NO_RENEGOTIATION: u64;
    SSL_OP_NO_SSLv3: u64;
    SSL_OP_NO_TLSv1: u64;
    SSL_OP_NO_TLSv1_1: u64;
    SSL_OP_NO_DTLSv1: u64;
    SSL_OP_NO_DTLSv1_2: u64;
    SSL_OP_NO_TLSv1_2: u64;
    SSL_OP_NO_SSLv2: u64;
    SSL_OP_NO_COMPRESSION: u64;
    SSL_MODE_RELEASE_BUFFERS: u64;
    OPENSSL_VERSION_NUMBER: i32;
    SSL_ERROR_WANT_READ: i32;
    SSL_ERROR_WANT_WRITE: i32;
    SSL_ERROR_SSL: i32;
    SSL_ERROR_WANT_X509_LOOKUP: i32;
    SSL_ERROR_WANT_CONNECT: i32;
    SSL_ERROR_WANT_ACCEPT: i32;
    EVP_PKEY_RSA: i32;
    BIO_CTRL_PENDING: i32;
    SSL_FILETYPE_PEM: i32;
  }
  ada: {
    parse(p0: pointer,p1: u32): pointer;
    parse_str(p0: string,p1: u32): pointer;
    can_parse(p0: pointer,p1: u32): u32;
    can_parse_str(p0: string,p1: u32): u32;
    get_components(p0: pointer): pointer;
    free(p0: pointer): void;
  }
  libdeflate: {
    alloc_compressor(p0: i32): pointer;
    deflate_compress(p0: pointer,p1: pointer,p2: u32,p3: pointer,p4: u32): u32;
    deflate_zlib_compress(p0: pointer,p1: pointer,p2: u32,p3: pointer,p4: u32): u32;
    deflate_gzip_compress(p0: pointer,p1: pointer,p2: u32,p3: pointer,p4: u32): u32;
    free_compressor(p0: pointer): void;
    alloc_decompressor(): pointer;
    deflate_decompress(p0: pointer,p1: pointer,p2: u32,p3: pointer,p4: u32,p5: TypedArray): u32;
    deflate_zlib_decompress(p0: pointer,p1: pointer,p2: u32,p3: pointer,p4: u32,p5: TypedArray): u32;
    deflate_gzip_decompress(p0: pointer,p1: pointer,p2: u32,p3: pointer,p4: u32,p5: TypedArray): u32;
    free_decompressor(p0: pointer): void;
  }
  inflate: {
    inflate(p0: TypedArray,p1: u32,p2: TypedArray,p3: u32): i32;
    inflate2(p0: pointer,p1: u32,p2: pointer,p3: u32): i32;
  }
}
//#endregion native_libs.autogenerated
//#region tagged_types_for_native_libs.autogenerated
type pointer = number & {pointer?:never}
type u32 = number & {u32?:never}
type i32 = number & {i32?:never}
type u64 = number & {u64?:never}
type f64 = number & {f64?:never}
type f32 = number & {f32?:never}
type i64 = number & {i64?:never}
type u8 = number & {u8?:never}
//#endregion tagged_types_for_native_libs.autogenerated
//#endregion autogenerated
