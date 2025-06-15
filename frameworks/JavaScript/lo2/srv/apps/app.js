import { Server } from '../servers/server.js'
import { on_socket_readable } from './on.socket.readable.js'
import { loop } from '../loop/loop.js'
import { noop } from '../utils/noop.js'
import { TrieBasedRouter } from '../routing/trie.based.router.js'
// import { log } from '../utils/log.js'

export class App {
  #router = new TrieBasedRouter()
  #on_socket_readable = on_socket_readable.bind(null, (socket, parsed_bytes) => {
    /** @type {0 | -1} */
    let rc = -1
    const { method_u8_view, path_u8_view } = socket.parser
    const { parts, fns: [fn] } = this.#router.find_u8(method_u8_view, path_u8_view)
    switch (fn) {
      case undefined:
      break
      default:
      rc = fn(socket, parts)
      break
    }
    return rc
  })
  get on_socket_readable(){ return this.#on_socket_readable }
  set on_socket_readable(on_socket_readable){ this.#on_socket_readable = on_socket_readable }
  get router(){ return this.#router }
  set router(router){ this.#router = router }
  /**@type {Map<string, Server>} */
  #servers = new Map()
  #loop = loop
  get loop(){ return this.#loop }
  set loop(loop){ this.#loop = loop }

  /**
   * @param {string} route
   * @param {(socket: import("../sockets/socket.js").Socket, params: Record<string, string>) => -1 | 0} handler
   */
  get(route, handler){
    this.router.get(route, handler)
    return this
  }

  /**
   * @param {number} port
   * @param {(fd: number) => void} [on_error]
   */
  listen(port, address = '127.0.0.1', on_error = noop){
    this.#servers.set(port + address,
      new Server(address, port, this.#loop, this.on_socket_readable, on_error))
    return this
  }
  /**
   * @param {number} port
   */
  unlisten(port, address = '127.0.0.1'){
    const server = this.#servers.get(port + address)
    if (!server) return
    server.close()
    this.#servers.delete(port + address)
    return this
  }

  #loop_started = false
  start(){
    this.#loop_started = true
    while (this.#loop_started && this.#loop.poll() > 0) lo.runMicroTasks()
    this.#loop_started = false
    return this
  }
  stop(){
    this.#loop_started = false
    return this
  }
  clear(){
    this.stop()
    this.#servers.forEach(v => v.close())
    this.#servers.clear()
    return this
  }
}
