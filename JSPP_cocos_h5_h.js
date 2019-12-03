/**
 * JSPP库 头文件
 * 用于 引入JSPP
 *
 * 修改适配本地项目
 *
 */

(function () {
  if (!window.cc) return

  let pproot = 'src/JSPP'

  function loadfile (path, cb) {
    cc.log('loadfile by JSPP path ===> ' + path)
    try {
      cb()
    } catch (e) {
      JSPP.pperror('includefile Error [path: ' + path + '] => : ' + e.message.toString(), e)
      // throw new Error('[path: ' + path + '] => : \n' + e.message.toString() + ' [line: ' + e.lineNumber + '] .\n stack => :\n' + String(e.stack) + '  ')
    }
  }

  loadfile(pproot + '/JSPP.js', function () {
    console.log('JSPP Engine Loaded ! v:' + JSPP.getV())
    JSPP.RootPath = pproot
    JSPP.loadfile = loadfile
    loadfile(pproot + '/JSPPCore.js', function () {
      JSPP.setCore()
      if (cc.sys.OS_WINDOWS === cc.sys.os || cc.sys.MACOS === cc.sys.os) {
        loadfile(pproot + '/JSPPCompile.js', JSPP.setCompile)

        loadfile(pproot + '/JSPPDebug.js', function () {
          JSPP.setDebug()
          JSPP.ppdebugmode(function (str, err) {
            let logstr = '[ JSPP ERROR ]:\n    ' + str + ' (line:' + err.lineNumber + ')\n[ Error Stack ]:\n'
            let stack = String(err.stack)
            console.error(logstr + stack)

            let ignoreFiles = ['JSPP', 'jsb_boot']
            for (let index in ignoreFiles) {
              stack = stack.replace(new RegExp('[^\n]+/' + ignoreFiles[index] + '\.js:.+\n', 'g'), '')
            }
            throw new Error(logstr + stack)
          })
        })
      }
    })
  })

})()