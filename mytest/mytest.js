var fs = require('fs')
  , ini = require('ini')

var mytest = ini.parse(fs.readFileSync('./mytest.ini', 'utf-8'))


fs.writeFileSync('./mytest_modified.ini', ini.stringify(mytest, { section: 'section' }))