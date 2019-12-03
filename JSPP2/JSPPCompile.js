/* ****************************************
 * (c) copyright 2015 - 2020
 * All Rights Reserved.
 * ****************************************
 * filename:  JSPPCompile.js
 * author:    wxk
 * mail:      qupit@qq.com
 * created:   2019/11/13
 * descrip:   new beginning
 *
*/

(function () {
  if (!window.JSPP) return

  let ClassLimitType = JSPP.ClassLimitType
  let ClassMemberType = JSPP.ClassMemberType
  let FunctionVirtualType = JSPP.FunctionVirtualType
  let CallMemberType = JSPP.CallMemberType

  // 类源码定义数据表
  let ClassTemplateMap = JSPP.__core__.ClassTemplateMap
  // 编译后的代码文件
  let ClassComplatedMap = JSPP.__core__.ClassComplatedMap
  // 链接之后的数据
  let ClassTreeMap = JSPP.__core__.ClassTreeMap

  let compile = {}

  compile.compileTemplateLimits = function (datamap, classname, limitName) {
    let MemberDatas = {} // [0成员类型，1成员访问权限，2成员是否支持继承多态]
    let StaticDatas = {}
    let ClassDatas = {}
    let VirtualCallDatas = {} // [0成员所在的类， 1成员的使用方式]
    let VirtualZeroDatas = {}
    if (datamap[limitName] !== undefined) {
      let nowType = ClassLimitType[limitName]

      for (let key in datamap[limitName]) {
        let value = datamap[limitName][key]
        if (key === 'static') {
          for (let key_1 in value) {
            MemberDatas[key_1] = [ClassMemberType.static, nowType, FunctionVirtualType.Normal]
            StaticDatas[key_1] = value[key_1]
            if (typeof value[key_1] === 'function') {
              VirtualCallDatas[key_1] = [classname, CallMemberType.staticfunction]
            } else {
              VirtualCallDatas[key_1] = [classname, CallMemberType.static]
            }
          }
        } else if (key === 'staticconst') {
          for (let key_1 in value) {
            MemberDatas[key_1] = [ClassMemberType.staticconst, nowType, FunctionVirtualType.Normal]
            StaticDatas[key_1] = value[key_1]
            if (typeof value[key_1] === 'function') {
              VirtualCallDatas[key_1] = [classname, CallMemberType.staticfunction]
            } else {
              VirtualCallDatas[key_1] = [classname, CallMemberType.static]
            }
          }
        } else if (key === 'virtual') {
          for (let key_1 in value) {
            let value_1 = value[key_1]
            if (key_1 === 'final') {
              for (let key_2 in value_1) {
                let value_2 = value_1[key_2]
                if (typeof value_2 === 'function') {
                  MemberDatas[key_2] = [ClassMemberType.final, nowType, FunctionVirtualType.Final]
                  ClassDatas[key_2] = value_2
                  VirtualCallDatas[key_2] = [classname, CallMemberType.Normalfunction]
                } else {
                  // 错误使用关键字[final],不能用于定义变量
                  throw new Error('keyword[final] error used ! class : ' + classname + ' key : ' + key_2)
                }
              }
            } else if (value_1 === 0) {
              MemberDatas[key_1] = [ClassMemberType.purevirtual, nowType, FunctionVirtualType.Virtual]
              VirtualZeroDatas[key_1] = [classname, CallMemberType.Nullfunction]
            } else if (typeof value_1 === 'function') {
              ClassDatas[key_1] = value_1
              MemberDatas[key_1] = [ClassMemberType.virtual, nowType, FunctionVirtualType.Virtual]
              VirtualCallDatas[key_1] = [classname, CallMemberType.Normalfunction]
            } else {
              // 错误使用关键字[virtual],不能用于定义变量
              throw new Error('keyword[virtual] error used! class : ' + classname + ' key : ' + key_1)
            }
          }
        } else if (key === 'final') {
          // 错误使用关键字[final],请同时使用[virtual]或更换其他成员名称
          throw new Error('keyword[final] error used!  class : ' + classname + ' key : ' + key)
        } else {
          MemberDatas[key] = [ClassMemberType.Normal, nowType, FunctionVirtualType.Normal]
          ClassDatas[key] = value
          if (typeof value === 'function') {
            VirtualCallDatas[key] = [classname, CallMemberType.Normalfunction]
          } else {
            VirtualCallDatas[key] = [classname, CallMemberType.Normal]
          }
        }
      }
      datamap[limitName] = undefined // 清空阻止外部修改
    }
    return { M: MemberDatas, S: StaticDatas, C: ClassDatas, V: VirtualCallDatas, V0: VirtualZeroDatas }
  }

  compile.compileTemplateclass = function (classname) {
    // 代码模版丢失 或者已经编译过了
    if (ClassTemplateMap[classname] === undefined || ClassComplatedMap[classname] !== undefined) return

    // if (ClassFatherMap[classname]) {
    //   let fathercname = ClassFatherMap[classname]
    //   compileTemplateclass(fathercname)
    // }
    let codedata = ClassTemplateMap[classname].code
    let public = compile.compileTemplateLimits(codedata, classname, 'public')
    let protected = compile.compileTemplateLimits(codedata, classname, 'protected')
    let private = compile.compileTemplateLimits(codedata, classname, 'private')
    // 合并模版

    let MemberDatas = {}
    for (let key in public.M) {
      MemberDatas[key] = public.M[key]
    }
    for (let key in protected.M) {
      if (MemberDatas[key] !== undefined) {
        throw new Error(' Defined more then One Times ! OverWrite  class : ' + classname + ' key : ' + key)
      }
      MemberDatas[key] = protected.M[key]
    }
    for (let key in private.M) {
      if (MemberDatas[key] !== undefined) {
        throw new Error(' Defined more then One Times ! OverWrite  class : ' + classname + ' key : ' + key)
      }
      MemberDatas[key] = private.M[key]
    }

    let StaticDatas = {}
    for (let key in public.S) {
      StaticDatas[key] = public.S[key]
    }
    for (let key in protected.S) {
      StaticDatas[key] = protected.S[key]
    }
    for (let key in private.S) {
      StaticDatas[key] = private.S[key]
    }

    let ClassDatas = {}
    for (let key in public.C) {
      ClassDatas[key] = public.C[key]
    }
    for (let key in protected.C) {
      ClassDatas[key] = protected.C[key]
    }
    for (let key in private.C) {
      ClassDatas[key] = private.C[key]
    }

    let VirtualCallDatas = {}
    for (let key in public.V) {
      VirtualCallDatas[key] = public.V[key]
    }
    for (let key in protected.V) {
      VirtualCallDatas[key] = protected.V[key]
    }
    for (let key in private.V) {
      VirtualCallDatas[key] = private.V[key]
    }

    let VirtualZeroDatas = {}
    for (let key in public.V0) {
      VirtualZeroDatas[key] = public.V0[key]
    }
    for (let key in protected.V0) {
      VirtualZeroDatas[key] = protected.V0[key]
    }
    for (let key in private.V0) {
      VirtualZeroDatas[key] = private.V0[key]
    }

    ClassComplatedMap[classname] = {
      F: ClassTemplateMap[classname].father,
      M: MemberDatas,
      S: StaticDatas,
      C: ClassDatas,
      V: VirtualCallDatas,
      V0: VirtualZeroDatas
    }
  }

  compile.compileclassWithTree = function (classname) {
    if (ClassTreeMap[classname]) return
    let complateData = ClassComplatedMap[classname]

    let virtualTotleList = {}
    let virtualCallList = {}
    let virtualZeroList = {}
    let initFuncList = []
    let deleteFuncList = []

    if (complateData.F) {
      compile.compileclassWithTree(complateData.F)
      let fLinkData = ClassTreeMap[complateData.F]

      for (let key in fLinkData.VT) {
        let value = fLinkData.VT[key]
        let copymap = {}

        for (let key1 in value) {
          copymap[key1] = value[key1]
        }

        virtualTotleList[key] = copymap
      }

      for (let key in fLinkData.VT[complateData.F]) {
        virtualCallList[key] = fLinkData.VT[complateData.F][key]
      }
      for (let key in fLinkData.V0) {
        virtualZeroList[key] = fLinkData.V0[key]
      }
      initFuncList = [].concat(fLinkData.I)
      if (fLinkData.D.length > 0) {
        let upclass = fLinkData.D[0]
        if (ClassComplatedMap[upclass].M['_' + upclass][2] === FunctionVirtualType.Virtual) {
          // 父类析构函数声明了虚函数 子类析构结束后析构父类
          deleteFuncList = [].concat(fLinkData.D)
        }
      }

      fLinkData.CR.push(classname)

    }

    for (let key in complateData.V) {
      if (key === classname) {
        if (complateData.V[key][1] === CallMemberType.Normalfunction)
          initFuncList.push(complateData.V[key][0])
      } else if (key === '_' + classname) {
        if (complateData.V[key][1] === CallMemberType.Normalfunction)
          deleteFuncList.unshift(complateData.V[key][0])
      } else if (virtualZeroList[key]) {
        virtualZeroList[key] = undefined
      }
      if (virtualCallList[key] && virtualCallList[key][1] === CallMemberType.Normalfunction) { // 父类有此值 且是个正常方法
        let funcClass = virtualCallList[key][0]
        if (ClassComplatedMap[funcClass].M[key][2] === FunctionVirtualType.Final) {
          // 方法 :  v 已在父类中被标记为 Final（不可被重载类型）!
          throw new Error('function : [' + key + '] be redefined with Final in father class ')
          continue
        } else if (ClassComplatedMap[funcClass].M[key][2] === FunctionVirtualType.Virtual) {
          let nowclass = ClassComplatedMap[classname].F
          while (nowclass && virtualTotleList[nowclass][key] && ClassComplatedMap[nowclass].M[key][2] === FunctionVirtualType.Virtual) {
            virtualTotleList[nowclass][key] = complateData.V[key]
            nowclass = ClassComplatedMap[nowclass].F
          }
        }
      }

      virtualCallList[key] = complateData.V[key]
    }

    for (let key in complateData.V0) {
      virtualZeroList[key] = complateData.V0[key]
    }

    virtualTotleList[classname] = virtualCallList

    ClassTreeMap[classname] = {
      CR: [], // childrenclass
      VT: virtualTotleList,
      V0: virtualZeroList,
      I: initFuncList,
      D: deleteFuncList
    }
  }

  compile.compileAllclassWithTree = function () {
    for (let classname in ClassComplatedMap) {
      compile.compileclassWithTree(classname)
    }
  }

  compile.compileTemplateclass('__PPCLASS__')
  window.JSPP.__compile__ = compile
})()