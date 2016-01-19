var fs = require('fs')
  , ini = require('../ini.js')
  , test = require('tap').test

var mytest = ini.parse(fs.readFileSync('./mytest.ini', 'utf-8'))

console.log('')
console.log(mytest)

var out = ini.stringify(mytest)

//console.log(out)