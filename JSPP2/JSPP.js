/* ****************************************
 * (c) copyright 2015 - 2020
 * All Rights Reserved.
 * ****************************************
 * filename:  JSPP.js
 * author:    wxk
 * mail:      qupit@qq.com
 * created:   2019/9/19
 * descrip:   JSPP continue from luapp
 * verson:    1.0.0 初步功能结构整理实现   2019/8/30
 *            1.0.1 补充释放后报错信息提示   2019/9/2
 *            1.0.2 更换释放后报错检测运行方式   2019/9/5
 *            1.0.3 增加获取加载过的文件列表等相关接口   2019/9/12
 *            1.0.4 修复静态空间卸载后bug和protected调用判断逻辑   2019/9/18
 *            1.0.5 修改根路径配置, 提供JSPP_h文件以支持自举 ppclass 支持省略父类参数传入模式  2019/9/20
 *            1.0.6 提供getV方法支持获取版本号, 编译运行后不可以再操作类  2019/9/23
 *            1.0.7 提供ppcast动态类型转换接口, 优化内部逻辑使类型之间调用更可靠  2019/9/27
 *            1.1.0 static状态下,为静态对象 提供构造接口static() 析构接口_static() 2019/10/24
 *            1.2.0 冻结结构对象，实现防止意外修改的情况 2019/11/14
 *            2.0.0 拆分编译 支持编译成静态文件后加载的模式 拆分独立编译器 JSPPCompile.js 2019/11/14
*/

(function () {

  // 调用堆栈(检查调用权限)
  let ObjVisitList = [{ objid: 0, class: '_List_Head_', visitfunction: '_List_Head_' }]

  // JS plus plus
  let JSPP = {
    getV: function () {
      return '2.0.0'
    },

    ObjVisitList: ObjVisitList,

    FilePath: '',
    RootPath: '',
    loadfile: undefined, // (path, cb) => void

    ClassLimitType: {
      public: 0,
      protected: 1,
      private: 2
    },

    ClassMemberType: {
      Normal: 0,
      static: 1,
      staticconst: 2,
      virtual: 3,
      purevirtual: 4,
      final: 5
    },

    FunctionVirtualType: {
      Undefind: 0,
      Normal: 1,
      Virtual: 2,
      Final: 3
    },

    CallMemberType: {
      Nullfunction: 0,
      Normal: 1,
      Normalfunction: 2,
      static: 3,
      staticfunction: 4
    }
  }

  JSPP.deepcopyvalue = function (obj) {
    if (typeof obj === 'object') {
      let newobj = {}
      for (let key in obj) {
        if (typeof obj[key] === 'object') {
          newobj[key] = JSPP.deepcopyvalue(obj[key])
        } else {
          newobj[key] = obj[key]
        }
      }
      return newobj
    }else{
      return obj
    }
  }

  JSPP.setCore = function () {
    JSPP.ppinclude = JSPP.__core__.include
    JSPP.ppexclude = JSPP.__core__.exclude
    JSPP.getclassfilelist = JSPP.__core__.getclassfilelist
    JSPP.ppclass = JSPP.__core__.class
    JSPP.ppnew = JSPP.__core__.new
    JSPP.ppcast = JSPP.__core__.cast
    JSPP.ppstatic = JSPP.__core__.static
    JSPP.ppfunction = JSPP.__core__.function
    JSPP.ppisObject = JSPP.__core__.isObject
  }

  JSPP.setCompile = function () {
    JSPP.ppcompileclass = JSPP.__compile__.ppcompileclass

    JSPP.ppdebugmode = JSPP.__compile__.debugmode
    JSPP.pperror = JSPP.__compile__.error
  }

  JSPP.setDebug = function () {
    JSPP.ppisdebugmode = JSPP.__debug__.isdebugmode
    JSPP.ppdebugmode = JSPP.__debug__.debugmode
    JSPP.pperror = JSPP.__debug__.error
  }

  JSPP.ppstack = function () {
    let str = ' JSPP <<<< stack >>>>:\n'
    for (let index in ObjVisitList) {
      let one = ObjVisitList[ObjVisitList.length - 1 - index]
      str += '' + index + ': ' + JSON.stringify(one) + '\n'
    }
    return str
  }

  window.JSPP = JSPP

})()