/** set parse as alias for decode */
exports.parse = exports.decode = decode
/** set stringify as alias for encode */
exports.stringify = exports.encode = encode

exports.safe = safe
exports.unsafe = unsafe

/** 
 * determine the current operating system , then decide to use appropriate newline character
 *  if windows, use '\r\n', else use '\n'
 */
var eol = process.platform === 'win32' ? '\r\n' : '\n'

/** 
 * encoded the object into an ini-sytle formatted string
 * @param {object} obj - the object being encoded into an ini-style formatted string
 * @param {string} [opt] - the optional section, 
 *  all top-level properties of the object are put into this section and the section-string is prepended to all sub-sections
 * @param {string} [opt.section=null] - the section string
 * @param {boolean} [opt.whitespace] - decide whether or not add whitespace around the '=' character
 * @return {string} a ini-style formatted string
 */
function encode (obj, opt) {
  var children = []
  var out = ''
/** check the opt parameter */
  if (typeof opt === 'string') {
    opt = {
      section: opt,
      whitespace: false
    }
  } else {
    /** if opt is a falsy value(null, undefined or 0), set opt as a empty array */
    opt = opt || {}
    opt.whitespace = opt.whitespace === true
  }
/** if opt.whitespace is true, put whitespace around the '=' character  */
  var separator = opt.whitespace ? ' = ' : '='
/** processing every keywords in the obj */
  Object.keys(obj).forEach(function (k, _, __) {
    var val = obj[k]
    if (val && Array.isArray(val)) {
      val.forEach(function (item) {
        out += safe(k + '[]') + separator + safe(item) + '\n'
      })
    } else if (val && typeof val === 'object') {
      children.push(k)
    } else {
      out += safe(k) + separator + safe(val) + eol
    }
  })
/** add opt.section at the beginning of output */
  if (opt.section && out.length) {
    out = '[' + safe(opt.section) + ']' + eol + out
  }

  children.forEach(function (k, _, __) {
    /** 
     * split k by setted rules and transfer splitted k into an array,
     * then transfer the array back into a string of all array elements are splitted by '\\.' 
     */
    var nk = dotSplit(k).join('\\.')
    var section = (opt.section ? opt.section + '.' : '') + nk
    var child = encode(obj[k], {
      section: section,
      whitespace: opt.whitespace
    })
    /** split out and child into two lines */
    if (out.length && child.length) {
      out += eol
    }
    out += child
  })

  return out
}

/** 
 * @param {string} str - the string would be processed
 * @return {string} the string processed
 */
function dotSplit (str) {
  return str.replace(/\1/g, '\u0002LITERAL\\1LITERAL\u0002')
    .replace(/\\\./g, '\u0001')
    .split(/\./).map(function (part) {
    return part.replace(/\1/g, '\\.')
      .replace(/\2LITERAL\\1LITERAL\2/g, '\u0001')
  })
}

/** 
 * Decode the ini-style formatted string into a nested object.
 * @param {string} str - the ini-style formatted string
 * @return {object} a object storing ini information
 */
function decode (str) {
  var out = {}
  var p = out
  var section = null
  /** set the regular expression */
  //          section     |key      = value
  var re = /^\[([^\]]*)\]$|^([^=]+)(=(.*))?$/i
  var lines = str.split(/[\r\n]+/g)

  lines.forEach(function (line, _, __) {
    /** remove blank lines */
    if (!line || line.match(/^\s*[;#]/)) return
    /** apply the regular expression */
    var match = line.match(re)
    if (!match) return
    if (match[1] !== undefined) {
      section = unsafe(match[1])
      p = out[section] = out[section] || {}
      return
    }
    var key = unsafe(match[2])
    var value = match[3] ? unsafe((match[4] || '')) : true
    switch (value) {
      case 'true':
      case 'false':
      case 'null': value = JSON.parse(value)
    }

    // Convert keys with '[]' suffix to an array
    if (key.length > 2 && key.slice(-2) === '[]') {
      key = key.substring(0, key.length - 2)
      if (!p[key]) {
        p[key] = []
      } else if (!Array.isArray(p[key])) {
        p[key] = [p[key]]
      }
    }

    // safeguard against resetting a previously defined
    // array by accidentally forgetting the brackets
    if (Array.isArray(p[key])) {
      p[key].push(value)
    } else {
      p[key] = value
    }
  })

  // {a:{y:1},"a.b":{x:2}} --> {a:{y:1,b:{x:2}}}
  // use a filter to return the keys that have to be deleted.
  Object.keys(out).filter(function (k, _, __) {
    if (!out[k] ||
      typeof out[k] !== 'object' ||
      Array.isArray(out[k])) {
      return false
    }
    // see if the parent section is also an object.
    // if so, add it to that, and mark this one for deletion
    var parts = dotSplit(k)
    var p = out
    var l = parts.pop()
    var nl = l.replace(/\\\./g, '.')
    parts.forEach(function (part, _, __) {
      if (!p[part] || typeof p[part] !== 'object') p[part] = {}
      p = p[part]
    })
    if (p === out && nl === l) {
      return false
    }
    p[nl] = out[k]
    return true
  }).forEach(function (del, _, __) {
    delete out[del]
  })

  return out
}

/** 
 * check if a string is quoted by single quotation mark or double quotation marks
 * @param {string} val - the string would be checked
 * @return {boolean}
 */
function isQuoted (val) {
  return (val.charAt(0) === '"' && val.slice(-1) === '"') ||
    (val.charAt(0) === "'" && val.slice(-1) === "'")
}

/**
 * escapes the string val such that it is safe to be used as a key or value in an ini-file
 * add backslash(\) before every semicolons(;) and number sign(#);
 * @prarm {string} val - the string would be escaped
 * @return {string} - the string escaped
 */
function safe (val) {
  return (typeof val !== 'string' ||
    val.match(/[=\r\n]/) ||
    val.match(/^\[/) ||
    (val.length > 1 && isQuoted(val)) ||
    val !== val.trim()) ?
      JSON.stringify(val) :
      val.replace(/;/g, '\\;').replace(/#/g, '\\#')
}

/** 
 * Unescapes the string val
 * remove the beginning and ending single quotes if the string is quoted,
 * otherwise find every semicolons(;) and number sign(#) and unescapes them
 * @param {string} val - the string would be unescaped
 * @return {string} - the string unescaped
 */
function unsafe (val, doUnesc) {
  val = (val || '').trim()
  if (isQuoted(val)) {
    // remove the single quotes before calling JSON.parse
    if (val.charAt(0) === "'") {
      val = val.substr(1, val.length - 2)
    }
    try { val = JSON.parse(val) } catch (_) {}
  } else {
    // walk the val to find the first not-escaped ; character
    var esc = false
    var unesc = ''
    for (var i = 0, l = val.length; i < l; i++) {
      var c = val.charAt(i)
      if (esc) {
        if ('\\;#'.indexOf(c) !== -1) {
          unesc += c
        } else {
          unesc += '\\' + c
        }
        esc = false
      } else if (';#'.indexOf(c) !== -1) {
        break
      } else if (c === '\\') {
        esc = true
      } else {
        unesc += c
      }
    }
    if (esc) {
      unesc += '\\'
    }
    return unesc
  }
  return val
}
