/* ****************************************
 * (c) copyright 2015 - 2020
 * All Rights Reserved.
 * ****************************************
 * filename:  luapp.lua
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
 *            1.2.1 ppinclude ppexclude 参数改为只支持传入数组(参数1) ppinclude增加 引入结束执行的方法(参数2) 2019/11/22
 *            1.2.2 相对路径 增加/开头标记表示绝对路径 2019/11/26
*/

(function () {
  let Version = '1.2.2'

  let ClassLimitType = {
    public: 0,
    protected: 1,
    private: 2
  }

  let ClassMemberType = {
    Normal: 0,
    static: 1,
    staticconst: 2,
    virtual: 3,
    purevirtual: 4,
    final: 5
  }

  let CallMemberType = {
    Nullfunction: 0,
    Normal: 1,
    Normalfunction: 2,
    static: 3,
    staticfunction: 4
  }

  // 不可创建类
  let InvalidCreateClass = {}
  // 类的父子关系
  let ClassFatherMap = {}
  let ClassChildrenMap = {}
  // 类定义数据表
  let ClassTemplateMap = {}
  // 类的成员表及虚函数相关功能
  let ClassMemberMap = {}
  // 类的成员表
  let ClassMap = {}
  // 类的静态成员表
  let ClassStaticMap = {}
  // 继承规则表
  let RuleMap = {}
  // 类的对象调用查询表
  let ObjMemberCallMap = {}
  // 类的构造列表
  let ClassLifeMap = {}
  // 对应文件声明的类名查询表
  let FileClassesMap = {}
  // 对应类所在的声明文件映射表
  let ClassDefinedFile = {}
  // 依赖中的文件列表
  let CheckingincludeList = []
  // 是否处于异步状态中
  let DoEncludeWaiting = false
  // 实例对象 调用访问器表
  let ObjVisitProtoMap = {}
  // 静态对象存放表
  let StaticTable = {}
  // pp对象id索引表
  let ObjMapWithIndex = {}
  // pp类对象存活计数表
  let ObjAliveCountMap = {}
  // 用户对象列表[lua对象id] = usertag
  let BlandObjList = {}
  // 热点对象列表[index] = lua对象id
  let CheckRefObjList = {}
  // 调用堆栈(检查调用权限)
  let ObjVisitList = [{ objid: 0, class: '_List_Head_', visitfunction: '_List_Head_' }]
  // 调试数据块 //ObjVisitListNums: ObjVisitList.length {对象创建计数器,当前文件路径,Debug模式,错误处理函数}
  let DebugInfo = {
    ObjCreateCount: 1,
    FilePath: '',
    RootPath: '',
    ObjDebugMode: false,
    Error: null,
    loadfile: function (path, cb) {}
  }

  let core = {
    InvalidCreateClass: InvalidCreateClass,
    StaticTable: StaticTable,
    ClassFatherMap: ClassFatherMap,
    ClassChildrenMap: ClassChildrenMap,
    ClassMemberMap: ClassMemberMap,
    ClassMap: ClassMap,
    ClassTemplateMap: ClassTemplateMap,
    ClassStaticMap: ClassStaticMap,
    RuleMap: RuleMap,
    ObjMemberCallMap: ObjMemberCallMap,
    ClassLifeMap: ClassLifeMap,
    ClassDefinedFile: ClassDefinedFile,
    ObjVisitProtoMap: ObjVisitProtoMap,
    ObjAliveCountMap: ObjAliveCountMap,
    FileClassesMap: FileClassesMap,
    ObjVisitList: ObjVisitList,
    DebugInfo: DebugInfo
    //ObjMapWithIndex : ObjMapWithIndex,
    //BlandObjList : BlandObjList,
    //CheckRefObjList : CheckRefObjList,
  }

  // JS plus plus
  window.JSPP = { __core__: core, getV: function () { return Version } }

  let distoryclass = function (classname, nocheck) {
    if (ClassMap[classname] === undefined) return

    if (!nocheck) {
      if (ObjAliveCountMap[classname] && ObjAliveCountMap[classname] > 0) {
        if (DebugInfo.ObjDebugMode) {
          // 类尚有未释放的对象在使用中。不可以卸载
          JSPP.pperror('can\'t distoryclass : ' + classname + '. it still has ' + ObjAliveCountMap[classname] + ' obj alived !')
        }
        return
      }

      if (ClassChildrenMap[classname] !== undefined) {
        for (let index in ClassChildrenMap[classname]) {
          let checkChildrenClass = ClassChildrenMap[classname][index]
          if (ObjAliveCountMap[checkChildrenClass] && ObjAliveCountMap[checkChildrenClass] > 0) {
            if (DebugInfo.ObjDebugMode) {
              // 类尚有未释放的子类对象在使用中。不可以卸载
              JSPP.pperror('can\'t distoryclass : ' + classname + '. it still has ' + ObjAliveCountMap[checkChildrenClass] + ' children class[' + checkChildrenClass + '] obj alived !')
            }
            return
          }
        }
      }
    }

    if (ClassChildrenMap[classname] !== undefined) {
      for (let index in ClassChildrenMap[classname]) {
        distoryclass(ClassChildrenMap[classname][index], true)
      }
    }

    if (StaticTable[classname]) {
      let staticobj = StaticTable[classname]
      let staticReleasefunction = ClassStaticMap[staticobj.__class]['_static']
      if (typeof staticReleasefunction === 'function') {
        ObjVisitList.push({ objid: staticobj.__self.refid, class: staticobj.__class, visitfunction: '_static' })
        staticReleasefunction.call(staticobj)
        ObjVisitList.pop()
      }
      staticobj.__self.released = true
      delete StaticTable[classname]
    }

    delete ClassTemplateMap[classname]
    delete ClassMap[classname]
    delete RuleMap[classname]
    delete ClassLifeMap[classname]
    delete ClassStaticMap[classname]
    delete ClassMemberMap[classname]
    delete ObjVisitProtoMap[classname]
    delete ClassFatherMap[classname]
    delete ClassChildrenMap[classname]
    delete InvalidCreateClass[classname]
    delete ObjMemberCallMap[classname]
    delete ClassDefinedFile[classname]
    delete ObjAliveCountMap[classname]
  }

  let checkLimite = function (useclass, usefunc) {
    switch (ClassMemberMap[useclass][usefunc][1]) {
      case  ClassLimitType.protected:
        if (ObjVisitList.length <= 1) {
          if (DebugInfo.ObjDebugMode) {
            JSPP.pperror('Limite Error! class : ' + useclass + ' key : ' + usefunc + ' is Protected!')
          }
          return false
        }
        let lastvisitclass = ObjVisitList[ObjVisitList.length - 1].class
        if (lastvisitclass !== useclass && ClassChildrenMap[useclass].indexOf(lastvisitclass) === -1 && ClassChildrenMap[lastvisitclass].indexOf(useclass) === -1) {
          if (DebugInfo.ObjDebugMode) {
            JSPP.pperror('Limite Error! class : ' + useclass + ' key : ' + usefunc + ' is Protected!')
          }
          return false
        }
        break
      case  ClassLimitType.private:
        if (ObjVisitList[ObjVisitList.length - 1].class !== useclass) {
          if (DebugInfo.ObjDebugMode) {
            JSPP.pperror('Limite Error! class : ' + useclass + ' key : ' + usefunc + ' is Private!')
          }
          return false
        }
        break
      case  ClassLimitType.public:
        // do nothing
        break
    }
    return true
  }

  let compileTemplateLimits = function (classname, limitName) {
    if (ClassTemplateMap[classname][limitName] === undefined) return
    let nowType = ClassLimitType[limitName]
    for (let key in ClassTemplateMap[classname][limitName]) {
      let value = ClassTemplateMap[classname][limitName][key]
      if (key === 'static') {
        for (let key_1 in value) {
          ClassMemberMap[classname][key_1] = [ClassMemberType.static, nowType]
          ClassStaticMap[classname][key_1] = value[key_1]
        }
      } else if (key === 'staticconst') {
        for (let key_1 in value) {
          ClassMemberMap[classname][key_1] = [ClassMemberType.staticconst, nowType]
          ClassStaticMap[classname][key_1] = value[key_1]
        }
      } else if (key === 'virtual') {
        for (let key_1 in value) {
          let value_1 = value[key_1]
          if (key_1 === 'final') {
            for (let key_2 in value_1) {
              let value_2 = value_1[key_2]
              if (typeof value_2 === 'function') {
                ClassMap[classname][key_2] = value_2
                ClassMemberMap[classname][key_2] = [ClassMemberType.final, nowType]
              } else if (DebugInfo.ObjDebugMode) {
                // 错误使用关键字[final],不能用于定义变量
                JSPP.pperror('keyword[final] error used ! class : ' + classname + ' key : ' + key_2)
              }
            }
          } else if (value_1 === 0) {
            ClassMemberMap[classname][key_1] = [ClassMemberType.purevirtual, nowType]
          } else if (typeof value_1 === 'function') {
            ClassMap[classname][key_1] = value_1
            ClassMemberMap[classname][key_1] = [ClassMemberType.virtual, nowType]
          } else if (DebugInfo.ObjDebugMode) {
            // 错误使用关键字[virtual],不能用于定义变量
            JSPP.pperror('keyword[final] error used! class : ' + classname + ' key : ' + key_1)
          }
        }
      } else if (key === 'final') {
        if (DebugInfo.ObjDebugMode) {
          // 错误使用关键字[final],请同时使用[virtual]或更换其他成员名称
          JSPP.pperror('keyword[final] error used!  class : ' + classname + ' key : ' + key)
        }
      } else {
        ClassMemberMap[classname][key] = [ClassMemberType.Normal, nowType]
        ClassMap[classname][key] = value
      }
    }
  }

  let compileTemplateclass = function (classname) {
    if (ClassTemplateMap[classname] === undefined) return

    if (ClassFatherMap[classname]) {
      let fathercname = ClassFatherMap[classname]
      compileTemplateclass(fathercname)
    }

    compileTemplateLimits(classname, 'public')
    compileTemplateLimits(classname, 'protected')
    compileTemplateLimits(classname, 'private')

    let classData = ClassTemplateMap[classname]

    classData['complated'] = { public: classData.public, protected: classData.protected, private: classData.private }

    classData.public = undefined
    classData.protected = undefined
    classData.private = undefined
  }

  let compileVirtualRule = function (classname) {
    if (RuleMap[classname] !== undefined) return

    let virtuallist = {}
    if (ClassFatherMap[classname]) {
      let fathercname = ClassFatherMap[classname]
      if (ClassMemberMap[fathercname] === undefined) {
        if (DebugInfo.ObjDebugMode) {
          // 父类数据丢失。类名: classname 父类名: fathercname
          JSPP.pperror('missing father class ! named : ' + classname + ' ,father named : ' + fathercname)
        }
        return
      }

      compileVirtualRule(fathercname)

      for (let key in RuleMap[fathercname]) {
        virtuallist[key] = RuleMap[fathercname][key]
      }

      if (virtuallist['_' + fathercname] === false) {
        virtuallist['_' + classname] = false
      }

      do {
        ClassChildrenMap[fathercname].push(classname)
        fathercname = ClassFatherMap[fathercname]
      } while (fathercname)
    }

    for (let key in ClassMemberMap[classname]) {
      let value = ClassMemberMap[classname][key][0]
      if (virtuallist[key] === false) {
        if (DebugInfo.ObjDebugMode) {
          // 方法 :  v 已在父类中被标记为 Final（不可被重载类型）!
          JSPP.pperror('function : [' + key + '] be redefined with Final in father class ')
        }
        continue
      } else if (value === ClassMemberType.purevirtual || value === ClassMemberType.virtual) {
        virtuallist[key] = true
      } else if (value === ClassMemberType.final) {
        virtuallist[key] = false
      }
    }

    RuleMap[classname] = virtuallist
    ClassChildrenMap[classname] = []
  }

  let compileCallMemberMap = function (classname) {
    if (ObjMemberCallMap[classname] !== undefined) return
    ObjMemberCallMap[classname] = {}

    let mymap = {}

    // 制作父类的虚函数表
    if (ClassFatherMap[classname]) {
      let fathercname = ClassFatherMap[classname]
      compileCallMemberMap(fathercname)

      // 拷贝父类虚函数表到本体用于调用
      for (let key in ObjMemberCallMap[fathercname]) {
        let value = ObjMemberCallMap[fathercname][key]
        let copymap = {}

        for (let key1 in value) {
          copymap[key1] = value[key1]
        }

        ObjMemberCallMap[classname][key] = copymap
      }

      // 再拷贝父类虚函数表用于制作自己的虚函数表
      let fathermap = ObjMemberCallMap[classname][fathercname]
      for (let key in fathermap) {
        mymap[key] = fathermap[key]
      }
    }

    // 制作本体虚函数表
    for (let key in ClassMemberMap[classname]) {
      let value = ClassMemberMap[classname][key][0]
      if (value === ClassMemberType.static || value === ClassMemberType.staticconst) {
        let realValue = ClassStaticMap[classname][key]
        if (typeof realValue === 'function') {
          mymap[key] = [classname, CallMemberType.staticfunction]
        } else {
          mymap[key] = [classname, CallMemberType.static]
        }
      } else if (value === ClassMemberType.purevirtual) {
        if (mymap[key] !== undefined && mymap[key][1] !== CallMemberType.Nullfunction) {
          if (DebugInfo.ObjDebugMode) {
            // 纯虚函数 :  k 已在父类中定义为数值类型
            JSPP.pperror('member :' + key + ' was define by ZeroFunction in parent\'s class !')
          }
          continue
        }
        mymap[key] = [classname, CallMemberType.Nullfunction]
        // do nothing
      } else {
        let realValue = ClassMap[classname][key]
        if (typeof realValue === 'function') {
          if (mymap[key] !== undefined && mymap[key][1] === CallMemberType.Normal) {
            if (DebugInfo.ObjDebugMode) {
              // 成员变量 :  k 已在父类中定义为数值类型
              JSPP.pperror('member :' + key + ' was define by value in parent\'s class !')
            }
            continue
          }
          // 实现父类中虚函数调用
          let checkname = classname
          while (ClassFatherMap[checkname]) {
            let checkfname = ClassFatherMap[checkname]
            if (RuleMap[checkfname][key] !== true) {
              break
            }
            ObjMemberCallMap[classname][checkfname][key] = [classname, CallMemberType.Normalfunction]
            checkname = checkfname
          }
          mymap[key] = [classname, CallMemberType.Normalfunction]
        } else {
          if (mymap[key] !== undefined && mymap[key][1] === CallMemberType.Normalfunction) {
            if (DebugInfo.ObjDebugMode) {
              // 成员变量 :  k 已在父类中定义为方法类型
              JSPP.pperror('member :' + key + ' was define by function in parent\'s class !')
            }
            continue
          }
          mymap[key] = [classname, CallMemberType.Normal]
        }
      }
    }

    ObjMemberCallMap[classname][classname] = mymap

    // 检测是否为可以创建对象类型
    for (let key in RuleMap[classname]) {
      if (RuleMap[classname][key] !== undefined && typeof ClassMap[mymap[key][0]][key] !== 'function') {
        InvalidCreateClass[classname] = key
        break
      }
    }
  }

  let compileObjCallPrototype = function (classname) {
    if (ObjVisitProtoMap[classname] === undefined || ObjVisitProtoMap[classname]['__class']) return

    if (ClassFatherMap[classname]) {
      let fathercname = ClassFatherMap[classname]
      compileObjCallPrototype(fathercname)
    }

    let realclass = classname

    // 构建静态空间
    let staticobj = {}

    Object.defineProperty(staticobj, '__self', {
      enumerable: false,
      configurable: false,
      value: { refid: 0, released: false }
    })
    Object.defineProperty(staticobj, '__class', {
      enumerable: false,
      configurable: false,
      get: function () {
        return realclass
      },
      set: function () {
        JSPP.pperror('JSPP key __class can\'t be Use !')
      }
    })

    for (let key in ClassStaticMap[classname]) {
      let value = ClassStaticMap[classname][key]
      let useKey = key
      if (typeof value === 'function') {
        Object.defineProperty(staticobj, useKey, {
          enumerable: true,
          configurable: false,
          get: function () {
            let usingClass = this.__class
            if (!checkLimite(usingClass, useKey)) return
            let realfunction = ClassStaticMap[usingClass][useKey]
            if (realfunction === undefined) return
            let castobj = this
            let environment = { objid: this.__self.refid, class: usingClass, visitfunction: useKey }
            return function () {
              ObjVisitList.push(environment)
              let ret = realfunction.apply(castobj, arguments)
              ObjVisitList.pop()
              return ret
            }
          },
          set: function () {
            JSPP.pperror('class static function can\'t overwrite at runtime !')
          }
        })
      } else {
        Object.defineProperty(staticobj, useKey, {
          enumerable: true,
          configurable: false,
          get: function () {
            let usingClass = this.__class
            if (!checkLimite(usingClass, useKey)) return
            return staticobj.__self[useKey]
          },
          set: function (value) {
            if (!checkLimite(this.__class, useKey)) return
            if (ClassMemberMap[this.__class][useKey][0] === ClassMemberType.staticconst) {
              JSPP.pperror('class staticconst member can\'t do reset !')
              return
            }
            staticobj.__self[useKey] = value
          }
        })

        if (value && typeof value === 'object') {
          staticobj.__self[useKey] = JSON.parse(JSON.stringify(value))
        } else {
          staticobj.__self[useKey] = value
        }
      }
    }
    //限制意外修改
    Object.freeze(staticobj)

    let staticInitfunction = ClassStaticMap[staticobj.__class]['static']
    if (typeof staticInitfunction === 'function') {
      ObjVisitList.push({ objid: staticobj.__self.refid, class: staticobj.__class, visitfunction: 'static' })
      staticInitfunction.call(staticobj)
      ObjVisitList.pop()
    }
    StaticTable[classname] = staticobj

    // 构建虚函数表
    let objFinalMap = ObjMemberCallMap[classname][classname]
    let visitproto = {}

    Object.defineProperty(visitproto, '__self', {
      enumerable: false,
      configurable: false,
      get: function () {
        if (this === visitproto) return
        return this.__self
      },
      set: function () {
        JSPP.pperror('JSPP key __self can\'t be redefine !')
      }
    })
    Object.defineProperty(visitproto, '__class', {
      enumerable: false,
      configurable: false,
      get: function () {
        if (this === visitproto) return realclass
        return this.__class
      },
      set: function () {
        JSPP.pperror('JSPP key __class can\'t be redefine !')
      }
    })

    Object.defineProperty(visitproto, 'ppsuper', {
      enumerable: true,
      configurable: false,
      get: function () {
        if (this.__self.released) {
          if (DebugInfo.ObjDebugMode) {
            JSPP.pperror('obj has been released !')
          }
          return
        }
        let visitLast = ObjVisitList[ObjVisitList.length - 1]
        if (this.__self.refid !== visitLast.objid || !ClassFatherMap[visitLast.class]) {
          if (DebugInfo.ObjDebugMode) {
            JSPP.pperror('no Way To Call ppsuper !')
          }
          return
        }

        let useKey = visitLast.visitfunction
        let fatherClass = ClassFatherMap[visitLast.class]
        let functionpairs = ObjMemberCallMap[fatherClass][fatherClass][useKey]
        if (functionpairs === undefined || !checkLimite(functionpairs[0], useKey)) return
        let castobj = this.__self.casters[functionpairs[0]]
        let realfunction
        switch (functionpairs[1]) {
          case CallMemberType.Normalfunction:
            realfunction = ClassMap[functionpairs[0]][useKey]
            break
          case CallMemberType.staticfunction:
            realfunction = ClassStaticMap[functionpairs[0]][useKey]
            break
          default:
            if (DebugInfo.ObjDebugMode) {
              JSPP.pperror('ppsuper Used Error !')
            }
            return
        }
        let environment = { objid: this.__self.refid, class: functionpairs[0], visitfunction: useKey }
        return function () {
          ObjVisitList.push(environment)
          let ret = realfunction.apply(castobj, arguments)
          ObjVisitList.pop()
          return ret
        }
      },
      set: function () {
        JSPP.pperror('JSPP key ppretain can\'t be redefine !')
      }
    })

    Object.defineProperty(visitproto, 'ppretain', {
      enumerable: true,
      configurable: false,
      get: function () {
        return function () {
          if (this.__self.released) {
            if (DebugInfo.ObjDebugMode) {
              JSPP.pperror('obj has been released !')
            }
            return
          }
          this.__self.refCount++
        }
      },
      set: function () {
        JSPP.pperror('JSPP key ppretain can\'t be redefine !')
      }
    })

    Object.defineProperty(visitproto, 'pprelease', {
      enumerable: true,
      configurable: false,
      get: function () {
        return function () {
          if (this.__self.released) {
            if (DebugInfo.ObjDebugMode) {
              JSPP.pperror('obj has been released !')
            }
            return
          }
          this.__self.refCount--
          if (this.__self.refCount <= this.__self.autorefCount) {
            let releaselist = ClassLifeMap[realclass].release
            ObjVisitList.push({ objid: this.__self.refid, class: realclass, visitfunction: 'pprelease' })
            let castobj = this.__self.casters[realclass]
            for (let index in releaselist) {
              castobj[releaselist[index]]()
            }
            ObjVisitList.pop()
            this.__self.__released = true
            ObjAliveCountMap[realclass]--
          }
        }.bind(this)
      },
      set: function () {
        JSPP.pperror('JSPP key pprelease can\'t be redefine !')
      }
    })

    Object.defineProperty(visitproto, 'ppautorelease', {
      enumerable: true,
      configurable: false,
      get: function () {
        return function () {
          if (this.__self.released) {
            if (DebugInfo.ObjDebugMode) {
              JSPP.pperror('obj has been released !')
            }
            return
          }
          this.__self.autorefCount++
        }
      },
      set: function () {
        JSPP.pperror('JSPP key ppautorelease can\'t be redefine !')
      }
    })

    Object.defineProperty(visitproto, 'ppgetrefid', {
      enumerable: true,
      configurable: false,
      get: function () {
        return function () {
          if (this.__self.released) {
            if (DebugInfo.ObjDebugMode) {
              JSPP.pperror('obj has been released !')
            }
            return
          }
          return this.__self.refid
        }
      },
      set: function () {
        JSPP.pperror('JSPP key ppgetrefid can\'t be redefine !')
      }
    })

    for (let key in objFinalMap) {
      let value = objFinalMap[key]
      let useKey = key

      switch (value[1]) {
        case CallMemberType.Normal:
          Object.defineProperty(visitproto, useKey, {
            enumerable: true,
            configurable: false,
            get: function () {
              if (this.__self.released) {
                if (DebugInfo.ObjDebugMode) {
                  JSPP.pperror('object released ! key[' + useKey + '] can do nothing !')
                }
                return
              }
              let functionpairs = ObjMemberCallMap[realclass][this.__class][useKey]
              if (functionpairs === undefined || !checkLimite(functionpairs[0], useKey)) return
              return this.__self.objs[functionpairs[0]][useKey]
            },
            set: function (value) {
              let functionpairs = ObjMemberCallMap[realclass][this.__class][useKey]
              if (functionpairs === undefined || !checkLimite(functionpairs[0], useKey)) return
              this.__self.objs[functionpairs[0]][useKey] = value
            }
          })
          break
        case CallMemberType.Normalfunction:
          Object.defineProperty(visitproto, useKey, {
            enumerable: true,
            configurable: false,
            get: function () {
              if (this.__self.released) {
                if (DebugInfo.ObjDebugMode) {
                  JSPP.pperror('object released ! key[' + useKey + '] can do nothing !')
                }
                return
              }
              let functionpairs = ObjMemberCallMap[realclass][this.__class][useKey]
              if (functionpairs === undefined || !checkLimite(functionpairs[0], useKey)) return
              let castobj = this.__self.casters[functionpairs[0]]
              let realfunction = ClassMap[functionpairs[0]][useKey]
              let environment = { objid: this.__self.refid, class: functionpairs[0], visitfunction: useKey }
              return function () {
                ObjVisitList.push(environment)
                let ret = realfunction.apply(castobj, arguments)
                ObjVisitList.pop()
                return ret
              }
            },
            set: function () {
              JSPP.pperror('class function can\'t overwrite at runtime !')
            }
          })
          break
        case CallMemberType.static:
          Object.defineProperty(visitproto, useKey, {
            enumerable: true,
            configurable: false,
            get: function () {
              let functionpairs = ObjMemberCallMap[realclass][this.__class][useKey]
              if (functionpairs === undefined || !checkLimite(functionpairs[0], useKey)) return
              return StaticTable[functionpairs[0]][useKey]
            },
            set: function (value) {
              let functionpairs = ObjMemberCallMap[realclass][this.__class][useKey]
              if (functionpairs === undefined || !checkLimite(functionpairs[0], useKey)) return
              StaticTable[functionpairs[0]][useKey] = value
            }
          })
          break
        case CallMemberType.staticfunction:
          Object.defineProperty(visitproto, useKey, {
            enumerable: true,
            configurable: false,
            get: function () {
              let functionpairs = ObjMemberCallMap[realclass][this.__class][useKey]
              if (functionpairs === undefined || !checkLimite(functionpairs[0], useKey)) return
              let castobj = this
              let realfunction = ClassStaticMap[functionpairs[0]][useKey]
              let environment = { objid: this.__self.refid, class: functionpairs[0], visitfunction: useKey }
              return function () {
                ObjVisitList.push(environment)
                let ret = realfunction.apply(castobj, arguments)
                ObjVisitList.pop()
                return ret
              }
            },
            set: function () {
              JSPP.pperror('class function can\'t overwrite at runtime !')
            }
          })
          break
      }
    }

    ObjVisitProtoMap[classname] = visitproto

    //检索构造,析构函数
    let initlist = []
    let releaselist = []
    let checkclass = classname
    while (checkclass !== undefined) {
      let initfunc = ClassMap[checkclass][checkclass]
      if (typeof initfunc === 'function') {
        initlist.unshift(checkclass)
      }
      if (checkclass === classname || (RuleMap[checkclass]['_' + checkclass] !== undefined)) {
        //检查析构
        let releasefunc = ClassMap[checkclass]['_' + checkclass]
        if (typeof releasefunc === 'function') {
          releaselist.push('_' + checkclass)
        }
      }

      checkclass = ClassFatherMap[checkclass]
    }

    ClassLifeMap[classname].init = initlist
    ClassLifeMap[classname].release = releaselist
  }

  JSPP.ppisdebugmode = function () {
    return DebugInfo.ObjDebugMode
  }

  JSPP.ppdebugmode = function (errorfunc) {
    DebugInfo.ObjDebugMode = true
    if (errorfunc)
      DebugInfo.Error = errorfunc
  }

  JSPP.pperror = function (str, err) {
    if (DebugInfo.Error)
      DebugInfo.Error(str, err ? err : new Error())
  }

  JSPP.getclassfilelist = function () {
    let list = []
    for (let key in FileClassesMap) {
      list.push(key)
    }
    return list
  }

  let onFileLoadedCheck = function () {
    if (!DoEncludeWaiting) return
    let tmpPath = DebugInfo.FilePath

    for (let i = 0; i < CheckingincludeList.length;) {
      let checkingdata = CheckingincludeList[i]

      let allLoaded = true
      for (let j = 0; j < checkingdata.length; j++) {
        if (FileClassesMap[checkingdata[j]][0] !== true) {
          allLoaded = false
          break
        }
      }

      if (allLoaded) {
        DebugInfo.FilePath = checkingdata[1]
        checkingdata[2](DebugInfo.FilePath)
        CheckingincludeList.splice(i, 1)
      } else {
        i++
      }
    }
    if (CheckingincludeList.length === 0) {
      DoEncludeWaiting = false
    }

    DebugInfo.FilePath = tmpPath
  }

  JSPP.ppinclude = function (list, successfunc) {
    if (typeof list === 'function') {
      successfunc = list
      successfunc()
      return
    } else if (typeof list === 'string') {
      list = [list]
    }
    let myFilePath = DebugInfo.FilePath
    let includeBasePath = ''
    if (myFilePath) {
      includeBasePath = myFilePath.substr(0, myFilePath.lastIndexOf('/'))
    }

    let checkList = []
    for (let index = 0; index < list.length; index++) {
      let path = list[index]
      let environmentPath = includeBasePath
      let pathpice = path.split('/')
      for (let i = 0; i < pathpice.length; i++) {
        if (pathpice[i] === '..') {
          environmentPath = environmentPath.substr(0, environmentPath.lastIndexOf('/'))
        } else if (pathpice[i] === '.') {
          continue
        } else if (pathpice[i] === ':') {
          environmentPath = DebugInfo.RootPath
        } else if (pathpice[i] && environmentPath) {
          environmentPath = environmentPath + '/' + pathpice[i]
        } else {
          environmentPath = pathpice[i]
        }
      }
      if (environmentPath) {
        checkList.push(environmentPath)
        if (FileClassesMap[environmentPath] === undefined) {
          FileClassesMap[environmentPath] = [false, []]
          DebugInfo.FilePath = environmentPath
          DebugInfo.loadfile(environmentPath, function () {
            FileClassesMap[environmentPath][0] = true
            onFileLoadedCheck()
          })
        }
      }
    }

    if (typeof successfunc === 'function') {
      if (DoEncludeWaiting) {
        CheckingincludeList.push([checkList, DebugInfo.FilePath, successfunc])
        return
      }

      let allLoaded = true
      for (let index = 0; index < checkList.length; index++) {
        if (FileClassesMap[checkList[index]][0] !== true) {
          allLoaded = false
          break
        }
      }
      if (allLoaded) {
        DebugInfo.FilePath = myFilePath
        successfunc(DebugInfo.FilePath)
      } else {
        DoEncludeWaiting = true
        CheckingincludeList.push([checkList, DebugInfo.FilePath, successfunc])
      }
    }
  }

  JSPP.ppexclude = function (list) {
    for (let index = 0; index < list.length; index++) {
      let path = list[index]
      if (FileClassesMap[path]) {
        for (let index in FileClassesMap[path][1]) {
          distoryclass(FileClassesMap[path][1][index])
        }
        delete FileClassesMap[path]
      }
    }
  }

  JSPP.ppclass = function (classname, fathername, __public__, __protected__, __private__) {
    if (ClassTemplateMap[classname] !== undefined) {
      // 重定义类 :  classname
      if (DebugInfo.ObjDebugMode) {
        JSPP.pperror('define class again ! classname: ' + classname)
      }
      return
    }
    let _public = __public__
    let _protected = __protected__
    let _private = __private__

    if (fathername) {
      if (typeof fathername === 'string') {
        ClassFatherMap[classname] = fathername
      } else if (typeof fathername === 'object' && __private__ === undefined) {
        // 省略父类参数传入
        _private = __protected__
        _protected = __public__
        _public = fathername
      } else {
        // 不支持的父类定义方式！
        JSPP.pperror('define fatherclass with invalid type ! classname: ' + classname)
        return
      }
    }
    let classBasic = {
      public: _public || {
        static: {},
        staticconst: {},
        virtual: { final: {} }
      },
      protected: _protected || {
        static: {},
        staticconst: {},
        virtual: { final: {} }
      },
      private: _private || {
        static: {},
        staticconst: {}
      }
    }

    ClassTemplateMap[classname] = classBasic
    ClassMap[classname] = {}
    ClassLifeMap[classname] = {}
    ClassStaticMap[classname] = {}
    ClassMemberMap[classname] = {}
    ObjVisitProtoMap[classname] = {}
    ObjAliveCountMap[classname] = 0

    if (DebugInfo.FilePath) {
      FileClassesMap[DebugInfo.FilePath][1].push(classname)
      ClassDefinedFile[classname] = DebugInfo.FilePath
    }

    return classBasic
  }

  JSPP.ppcompileclass = function (classname) {
    compileTemplateclass(classname)
    compileVirtualRule(classname)
    compileCallMemberMap(classname)
    compileObjCallPrototype(classname)
  }

  JSPP.ppnew = function (classname) {
    if (ClassTemplateMap[classname] === undefined) {
      if (DebugInfo.ObjDebugMode) {
        JSPP.pperror('classname [' + classname + '] not found !')
      }
      return
    }

    if (ClassTemplateMap[classname]['complated'] === undefined) {
      JSPP.ppcompileclass(classname)
    }

    if (InvalidCreateClass[classname] !== undefined) {
      if (DebugInfo.ObjDebugMode) {
        JSPP.pperror('class : ' + classname + ' has a ZeroFunction named : ' + InvalidCreateClass[classname] + ', could not new !')
      }
      return
    }

    let ret = Object.create(ObjVisitProtoMap[classname])
    Object.defineProperty(ret, '__self', {
      enumerable: false,
      configurable: false,
      value: {
        refid: DebugInfo.ObjCreateCount,
        released: false,
        refCount: 1,
        autorefCount: 0,
        realClass: classname,
        objs: {},
        casters: {}
      }
    })

    Object.defineProperty(ret, '__class', {
      enumerable: false,
      configurable: false,
      get: function () {
        return this.__self.realClass
      },
      set: function () {
        JSPP.pperror('JSPP key __class can\'t be redefine !')
      }
    })

    DebugInfo.ObjCreateCount++

    for (let key in ObjMemberCallMap[classname]) {
      let value = ObjMemberCallMap[classname][key]
      let objData = {}
      for (let name in value) {
        let value1 = value[name] // objectpair
        if (value1[0] === key && value1[1] === CallMemberType.Normal) {
          let realValue = ClassMap[key][name]
          if (typeof realValue === 'object') {
            objData[name] = JSON.parse(JSON.stringify(realValue))
          } else {
            objData[name] = realValue
          }
        }
      }
      ret.__self.objs[key] = objData

      let caster = Object.create(ObjVisitProtoMap[classname])
      let pointerClass = key
      Object.defineProperty(caster, '__self', {
        enumerable: false,
        configurable: false,
        value: ret.__self
      })

      Object.defineProperty(caster, '__class', {
        enumerable: false,
        configurable: false,
        get: function () {
          return pointerClass
        },
        set: function () {
          JSPP.pperror('JSPP key __class can\'t be redefine !')
        }
      })

      ret.__self.casters[key] = caster
      //冻结限制意外修改操作
      Object.freeze(caster)
    }

    ret.__self.casters[classname] = ret
    //冻结限制意外修改操作
    Object.freeze(ret)

    // 调用构造函数
    let args = []
    for (let i = 1; i < arguments.length; i++) {
      args.push(arguments[i])
    }
    let initlist = ClassLifeMap[classname].init
    for (let index in initlist) {
      ret[initlist[index]].apply(ret, args)
    }

    ObjAliveCountMap[classname] = ObjAliveCountMap[classname] + 1

    return ret
  }

  JSPP.ppcast = function (ppobj, changeClassname) {
    if (ppobj.__self.released) {
      if (DebugInfo.ObjDebugMode) {
        JSPP.pperror('object released ! ppcast can do nothing !')
      }
      return
    }

    return ppobj.__self.casters[changeClassname]
  }

  JSPP.ppstatic = function (classname) {
    if (ObjMemberCallMap[classname] === undefined)
      JSPP.ppcompileclass(classname)

    return StaticTable[classname]
  }

  JSPP.ppfunction = function (jsfunc, obj) {
    let nowLimitInfo = ObjVisitList[ObjVisitList.length - 1]
    let environment = {
      objid: nowLimitInfo.objid,
      class: nowLimitInfo.class,
      visitfunction: nowLimitInfo.visitfunction
    }
    let realobject = obj
    let realfunction = jsfunc
    return function () {
      if (!realobject.__self.released) {
        ObjVisitList.push(environment)
        let ret = realfunction.apply(realobject, arguments)
        ObjVisitList.pop()
        return ret
      }
    }.bind(this)
  }

  JSPP.ppstack = function () {
    let str = ' JSPP <<<< stack >>>>:\n'
    for (let index in ObjVisitList) {
      let one = ObjVisitList[ObjVisitList.length - 1 - index]
      str += '' + index + ': ' + JSON.stringify(one) + '\n'
    }
    return str
  }

  JSPP.ppisObject = function (obj) {
    return Boolean(obj.__self && obj.__class && (!obj.__self.released))
  }

})()