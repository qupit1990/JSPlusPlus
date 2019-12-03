/* ****************************************
 * (c) copyright 2015 - 2020
 * All Rights Reserved.
 * ****************************************
 * filename:  JSPPDebug.js
 * author:    wxk
 * mail:      qupit@qq.com
 * created:   2019/11/13
 * descrip:   new beginning
 *
*/

(function () {
  if (!window.JSPP) return

  let FileClassesMap = JSPP.__core__.FileClassesMap

  // 调试数据块 //ObjVisitListNums: ObjVisitList.length {对象创建计数器,当前文件路径,Debug模式,错误处理函数}
  let debug = {
    ObjDebugMode: false,
    ObjCreateCount: 1,
    Errorfunc: null
  }


  debug.isdebugmode = function () {
    return debug.ObjDebugMode
  }

  debug.debugmode = function (errorfunc) {
    debug.ObjDebugMode = true
    if (errorfunc)
      debug.Errorfunc = errorfunc
  }

  debug.error = function (str, err) {
    if (debug.Errorfunc)
      debug.Errorfunc(str, err ? err : new Error())
  }

  debug.getclassfilelist = function () {
    let list = []
    for (let key in FileClassesMap) {
      list.push(key)
    }
    return list
  }

  JSPP.__debug__ = debug

})()