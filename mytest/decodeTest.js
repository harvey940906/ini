var fs = require('fs')
  , ini = require('../ini.js')
  , test = require('tap').test

var mytest = ini.parse(fs.readFileSync('./mytest.ini', 'utf-8'))

console.log('')
console.log(mytest)

var out = ini.stringify(mytest)

//console.log(out)

var result = {
   o: 'p',
  'a with spaces': 'b  c',
  ' xa  n          p ': '"\r\nyoyoyo\r\r\n',
  '[disturbing]': 'hey you never know',
  s: 'something',
  s1: '"something\'',
  s2: 'something else' 
}