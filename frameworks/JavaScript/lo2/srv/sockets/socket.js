import { net } from 'lib/net.js'
import { Loop } from 'lib/loop.js'
// import { RequestParser } from 'lib/pico.js'

import { noop } from '../utils/noop.js'
import { RequestParser } from '../picohttpparser/pico.requestparser.js'
// import '../picohttpparser/pico.requestparser.template.js'

const { Readable } = Loop
const { recv2, close, send2 } = net

/**
 * @template {Socket} T
 */
export class Socket {
  fd = 0
  ip = 0
  port = 0
  /**@type {RequestParser} */
  parser = /**@type {any} */(null)
  /**@type {(socket: T) => -1 | 0 | void}*/
  readable = noop
  /**@type {Loop} */
  loop = /**@type {any} */(null)

  /**
   * @param {Loop} loop
   * @param {number} fd
   */
  constructor(loop, fd, parser_bufsize = 64 * 1024, parser_max_headers = 18) {
    this.parser = new RequestParser(new Uint8Array(parser_bufsize), parser_max_headers)
    this.fd = fd
    this.loop = loop
    Socket.sockets[fd] = this
  }

  /** @param {(socket: T) => void | 0 | -1} on_readable */
  addonreadable(on_readable, readable = Socket.readable, readable_error = Socket.close, modify = 0){
    this.readable = on_readable
    return modify
      ? this.loop.modify(this.fd, readable, Readable, readable_error)
      : this.loop.add(this.fd, readable, Readable, readable_error)
  }
  removefromloop(){
    return this.loop.remove(this.fd)
  }
  delete(){
    Socket.sockets[this.fd] = Socket.#fake_socket
  }
  /**
   * @param {number} pointer
   * @param {number} size
   */
  write(pointer, size){
    return Socket.write(this.fd, pointer, size, 0)
  }
  read(size = this.parser.rb_size) {
    return Socket.read(this.fd, this.parser.rb_ptr, size, 0)
  }
  close() {
    const { fd } = this
    if (fd === 0) return
    this.delete()
    this.fd = 0
    close(fd)
  }

  /**
   * @param {number} fd
   */
  static delete (fd) { Socket.sockets[fd].delete() }
  static write = send2
  static read = recv2
  /**
   * @param {number} fd
   */
  static close (fd) {
    return Socket.sockets[fd].close()
  }
  /**
   * @type {import("lib/loop.js").eventCallback}
   */
  static readable (fd) {
    const socket = Socket.sockets[fd]
    if (socket.readable(socket) === -1) socket.close()
  }
  /**@type {Socket[]} */
  static sockets = []

  static #fake_socket = (() => {
    /**@type {0} */
    const m0 = 0
    return new (class FakeSocket extends Socket {
      constructor(){ super(FakeSocket.fake_loop, 0, 0, 0) }
      static parser = new RequestParser(new Uint8Array(16), 1)
      static fake_loop = new (class FakeLoop extends Loop {
        callbacks = []
        size = 0
        add(){ return 0 }
        modify() { return 0 }
        poll() { return 0 }
        remove() { return 0 }
      })
      loop = FakeSocket.fake_loop
      parser = FakeSocket.parser
      init() {}
      readable = () => { return m0 }
      close(){}
      delete(){}
      discard(){ return m0 }
      addonreadable(){ return m0 }
      peek(){ return m0 }
      read(){ return m0 }
      write(){ return m0 }
      removefromloop(){ return m0 }
    })
  })()
}
