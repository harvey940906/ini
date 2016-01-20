// Junfei Zhang
// INFO 498E, Section AB
// Assignment 2 - Module Doc
// decode and encode examples

var fs = require('fs')
  , ini = require('../ini.js')

var decode_test = ini.parse(fs.readFileSync('./mytest.ini', 'utf-8'))

// you can see the decode result in the command line window
console.log('mytest.ini after decode')
console.log(decode_test)
console.log()

// you can see the encode result by openning the ini file
var encode_test = fs.writeFileSync('./mytest_modified.ini', ini.stringify(decode_test, {section: "mySection",whitespace: true}))


// test safe and unsafe
var safe_test = "number# is; 12345"

var safed = ini.safe(safe_test)
var unsafed = ini.unsafe(safed)

function test_safe (test){
  if(test.match(/\\/g)) return console.log('safe test success')
  else return console.log('safe test unsuccess')
}

function test_unsafe (test){
  if(test.match(/[^\\]/)) return console.log('unsafe test success')
  else return console.log('safe test unsuccess')
}

test_safe(safed)
test_unsafe(unsafed)