var fs = require('fs')
  , ini = require('ini')

var mytest = ini.parse(fs.readFileSync('./mytest.ini', 'utf-8'))

mytest.scope = 'local'
mytest.database.database = 'use_another_database'
mytest.paths.default.tmpdir = '/tmp'
delete mytest.paths.default.datadir
mytest.paths.default.array.push('fourth value')

fs.writeFileSync('./mytest_modified.ini', ini.stringify(mytest, { section: 'section' }))