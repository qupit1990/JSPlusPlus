/**
 * JSPP库 头文件
 * 用于 引入JSPP
 *
 * 修改适配本地项目
 *
 */

(function () {
  if (!window.cc) return

  let pproot = 'src/JSPP/JSPP.js'

  cc.loader.loadJs(pproot, function () {

    console.log('JSPP Engine Loaded ! v:' + JSPP.getV())

    JSPP.__core__.DebugInfo.RootPath = pproot.substr(0, pproot.lastIndexOf('/'))

    JSPP.__core__.DebugInfo.loadfile = function (path, cb) {
      console.debug('loadfile by JSPP path ===> ' + path)
      try {
        //require(path)
        cc.loader.loadJs(path, function () {
        })
      } catch (e) {
        JSPP.pperror('includefile Error [path: ' + path + '] => : ' + e.message.toString(), e)
        throw new Error('[path: ' + path + '] => : \n' + e.message.toString() + ' [line: ' + e.lineNumber + '] .\n stack => :\n' + String(e.stack) + '  ')
      }
    }

    if (window.cc && cc.sys.OS_WINDOWS === cc.sys.os) {
      JSPP.ppdebugmode(function (str, err) {
        let logstr = '[ JSPP ERROR ]:\n    ' + str + '\n[ Error Stack ]:\n' + String(err.stack) + '  '
        console.error(logstr)
        throw new Error(logstr)
      })
    }
  })

})()