const { latin1Decode, get_address } = lo
const { parse_request } = lo.load('pico').pico

const rx = /-/g

// based on output from pico.requestparser.template.js
// has modifications
export class RequestParser {
  /**@type {Uint32Array}*/
  #ctx = /**@type {any}*/(null)
  /**@type {Uint8Array}*/
  #rb = /**@type {any}*/(null)
  #ctx_ptr = 0
  #rb_ptr = 0
  #rb_size = 0
  get rb(){ return this.#rb }
  get rb_ptr(){ return this.#rb_ptr }
  get rb_size(){ return this.#rb_size }

  constructor (/**@type {Uint8Array}*/rb,n_headers=18) {
    this.#rb = rb
    this.#rb_ptr = get_address(rb)
    this.#rb_size = rb.byteLength
    const ctx = new Uint32Array(14+n_headers*8)
    ctx[12] = n_headers
    this.#ctx = ctx
    this.#ctx_ptr = get_address(ctx)
  }

   parse(len=this.#rb_size){
     this.#ctx[10] = this.#ctx[12]
     const ptr = this.#ctx_ptr
     return parse_request(this.#rb_ptr,len,ptr+0,ptr+8,ptr+16,ptr+24,ptr+32,ptr+56,ptr+40,0)
   }

   // single SP between method and path
   get method_n_path_u8_view () {
    return this.rb.subarray(0, this.#ctx[2] + this.#ctx[6] + 1)
   }

   get method_u8_view () {
     return this.rb.subarray(0, this.#ctx[2])
   }

   get path_u8_view () {
     return this.rb.subarray(this.#ctx[2] + 1, this.#ctx[2] + 1 + this.#ctx[6])
   }

   get method () {
     const method_address = this.#ctx[0] + 4294967296 * this.#ctx[1]
     return latin1Decode(method_address,this.#ctx[2])
   }

   get path () {
     const path_address = this.#ctx[4] + 4294967296 * this.#ctx[5]
     return latin1Decode(path_address,this.#ctx[6])
   }

   get minor_version () {
     return this.#ctx[8]
   }

   get num_headers () {
     return this.#ctx[10]
   }

   get headers () {
     const nhead = this.#ctx[10]
     const raw_headers = this.#ctx
     let n = 14
     const result = {}
     for (let i=0;i<nhead;i++) {
     const key_address = raw_headers[n] + 4294967296 * raw_headers[n+1]
     const key_len = raw_headers[n+2]
     const val_address = raw_headers[n+4] + 4294967296 * raw_headers[n+5]
     const val_len = raw_headers[n+6]
     const key_string = latin1Decode(key_address,key_len).toLowerCase().replace(rx,'_')
     const val_string = latin1Decode(val_address,val_len)
     result[key_string] = val_string
     n += 8
     }
     return result
   }
}