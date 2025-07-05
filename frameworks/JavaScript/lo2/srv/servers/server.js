import { net } from 'lib/net.js'
import { Loop } from 'lib/loop.js'

import { noop } from '../utils/noop.js'
import { Socket } from '../sockets/socket.js'

const { Blocked, Readable } = Loop
const { // getenv,
  assert, ptr, core: { fcntl, O_NONBLOCK, F_SETFL } } = lo
const { SOCK_STREAM, AF_INET, SOMAXCONN, SO_REUSEPORT, SOL_SOCKET, SOCKADDR_LEN,
  // IPPROTO_TCP, TCP_NODELAY,
  // SO_INCOMING_CPU,
  on: net_on, types: { sockaddr_in },
  socket, bind, listen, accept, close, setsockopt } = net

export class Server {
  fd = 0
  addr = '127.0.0.1'
  port = 8080
  /**@type {Loop} */
  loop = /**@type {any} */(null)
  parser_buf_size = 64 * 1024
  parser_max_headers = 18
  /**@type {(socket: Socket) => -1 | 0 | void} */
  socket_readable = noop
  /**@type {(socket: Socket) => -1 | 0 | void} */
  on_socket_readable = noop
  /**@type {(fd: number) => void} */
  accept_error = noop
  // typedef struct sockaddr_in {
  //   short          sin_family;
  //   u_short        sin_port;
  //   struct in_addr sin_addr;
  //   char           sin_zero[8];
  // }
  // struct in_addr {
  //   union {
  //     struct {
  //       u_char s_b1;
  //       u_char s_b2;
  //       u_char s_b3;
  //       u_char s_b4;
  //     } S_un_b;
  //     struct {
  //       u_short s_w1;
  //       u_short s_w2;
  //     } S_un_w;
  //     u_long S_addr;
  //   } S_un;
  // };
  sockaddr_in = ptr(new Uint8Array(16))
  sockaddr_in_len = ptr(new Uint32Array([this.sockaddr_in.byteLength]))
  sockaddr_in_dv = new DataView(this.sockaddr_in.buffer)
  // incoming_cpu = new Uint32Array([0])

  /**
   * @param {Server['addr']} addr
   * @param {Server['port']} port
   * @param {Server['loop']} loop
   * @param {Server['socket_readable']} on_socket_readable
   * @param {Server['accept_error']} on_accept_error
   */
  constructor(addr, port, loop, on_socket_readable, on_accept_error){
    this.init(addr, port, loop, on_socket_readable, on_accept_error)
  }

  /**
   * @param {Server['addr']} addr
   * @param {Server['port']} port
   * @param {Server['loop']} loop
   * @param {Server['socket_readable']} on_socket_readable
   * @param {Server['accept_error']} on_accept_error
   */
  init(addr, port, loop, on_socket_readable, on_accept_error) {
    const fd = socket(AF_INET, SOCK_STREAM, 0)
    assert(fd > 2)
    assert(fcntl(fd, F_SETFL, O_NONBLOCK) === 0)
    // this.incoming_cpu[0] = +getenv('CHILD_INDEX')
    assert(!setsockopt(fd, SOL_SOCKET, SO_REUSEPORT, net_on, 32))
    // assert(!setsockopt(fd, SOL_SOCKET, SO_INCOMING_CPU, this.incoming_cpu, 32))
    assert(bind(fd, sockaddr_in(addr, port), SOCKADDR_LEN) === 0)
    assert(listen(fd, SOMAXCONN) === 0)

    this.fd = fd
    this.loop = loop
    this.addr = addr
    this.port = port
    this.socket_readable = on_socket_readable
    this.accept_error = on_accept_error
    this.on_socket_readable = Server.socket_readable.bind(null, this)
    assert(loop.add(fd, Server.readable.bind(null, this), Readable, Server.error) === 0)
    Server.servers.set(this.fd, this)
  }

  removefromloop () {
    this.loop.remove(this.fd)
  }
  delete () {
    Server.servers.delete(this.fd)
  }
  close () {
    this.removefromloop()
    this.delete()
    close(this.fd)
  }
  /**
   * @param {Server} server
   */
  static readable (server) {
    const { sockaddr_in, sockaddr_in_dv, sockaddr_in_len, //incoming_cpu,
      on_socket_readable, create_socket, fd, loop, parser_buf_size, parser_max_headers
     } = server
    const sock_fd = accept(fd, sockaddr_in.ptr, sockaddr_in_len.ptr)

    if (sock_fd > 0) {
      assert(fcntl(sock_fd, F_SETFL, O_NONBLOCK) === 0)
      assert(sockaddr_in_len[0] === sockaddr_in.byteLength)
      // assert(!setsockopt(sock_fd, SOL_SOCKET, SO_INCOMING_CPU, incoming_cpu, 32))
      // assert(!setsockopt(sock_fd, IPPROTO_TCP, TCP_NODELAY, net_on, 32))
      const sock = create_socket(loop, sock_fd, parser_buf_size, parser_max_headers)
      const port = sockaddr_in_dv.getUint16(2)
      const ip = sockaddr_in_dv.getUint32(4)
      assert(port + ip)
      sock.port = port
      sock.ip = ip
      // const ip_str = sockaddr_in.subarray(4, 8).join('.')
      // console.log(`fd: ${fd}; connection from: ${ip_str}:${port};`)
      assert(sock.addonreadable(on_socket_readable) === 0)
      return
    }
    if (lo.errno === Blocked) return
    close(sock_fd)
  }

  /**
   * @param {Loop} loop
   * @param {number} fd
   * @param {number | undefined} parser_buf_size
   * @param {number | undefined} parser_max_headers
   */
  create_socket(loop, fd, parser_buf_size, parser_max_headers){
    return new Socket(loop, fd, parser_buf_size, parser_max_headers)
  }

  /**
   * @param {Server} server
   * @param {Socket} socket
   */
  static socket_readable (server, socket) {
    if (server.socket_readable(socket) === -1) return socket.close()
  }
  static error (fd, mask) {
    console.log(`accept error on socket ${fd} : ${mask}`)
  }
  /**@type {Map<number, Server>} */
  static servers = new Map()
}
