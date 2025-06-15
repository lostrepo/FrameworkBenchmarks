export class Trie {
  /** @type {string | Uint8Array} */
  chars = ''
  value = /**@type {any}*/(null)
  /**
   * @returns {Trie | undefined | null}
   * @param {string | Uint8Array} chars
   */
  findNode(chars){
    /** @type {Trie} */
    var r = this,
    length = chars.length
    for (var i = 0; i < length && r; i++){
      r = r?.[chars[i]]
    }
    return r
  }
  /**
   * @param {string | Uint8Array} chars
   */
  find(chars){
    return this.findNode(chars)?.value
  }
  /**
   * @param {string | Uint8Array} chars
   */
  insertNode(chars){
    /** @type {Trie} */
    var r = this,
    tmp

    for (var i = 0; i < chars.length; i++){
      tmp = chars[i]
      // create node if doesn't exist already
      r[tmp] = r[tmp] || new Trie()
      r = r[tmp]
    }

    return r
  }
  /**
   * @param {any} value
   * @param {boolean} returnNode
   * @param {string | Uint8Array} chars
   */
  insert(chars, value, returnNode){
    var r = this.insertNode(chars)

    if (!r) return null

    r.chars = chars
    r.value = value

    return returnNode ? r : r.value
  }
}
