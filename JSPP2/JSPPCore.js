/* ****************************************
 * (c) copyright 2015 - 2020
 * All Rights Reserved.
 * ****************************************
 * filename:  JSPPCore.js
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
  let CallMemberType = JSPP.CallMemberType

  // 类定义数据表
  let ClassTemplateMap = {
    // pp通用父类
    __PPCLASS__: {
      file: ':/JSPP.js',
      code: {
        public: {
          ppsuper: function () {
            if (ObjVisitList.length < 2) return
            let visitLast = ObjVisitList[ObjVisitList.length - 2]
            let useKey = visitLast.visitfunction
            let fatherClass = ClassComplatedMap[visitLast.class].F
            if (this.__self.refid !== visitLast.objid || fatherClass === '__PPCLASS__') {
              return
            }

            let realfunction = core.memberGet(this, fatherClass, fatherClass, useKey)
            if (typeof realfunction === 'function') {
              return realfunction.apply(this, arguments)
            }
          },
          ppretain: function () {
            this.__self.refCount++
          },
          pprelease: function () {
            this.__self.refCount--
            if (this.__self.refCount <= this.__self.autorefCount) {
              ObjVisitList.push({ objid: this.__self.refid, class: this.__class, visitfunction: 'pprelease' })

              let releaselist = ClassTreeMap[this.__class].D
              for (let index in releaselist) {
                let classname = releaselist[index][0]
                let realfunction = core.memberGet(this, classname, classname, '_' + classname)
                if (typeof realfunction === 'function') {
                  ObjVisitList.push({ objid: this.__self.refid, class: classname, visitfunction: 'pprelease' })
                  realfunction.call(this)
                  ObjVisitList.pop()
                }
              }

              ObjVisitList.pop()
              this.__self.__released = true
              ObjAliveCountMap[this.__class]--
            }
          },
          ppautorelease: function () {
            this.__self.autorefCount++
          },
          ppgetrefid: function () {
            return this.__self.refid
          }
        }
      }
    }
  }
  // 编译后的代码文件
  let ClassComplatedMap = {}
  // 链接之后的数据
  let ClassTreeMap = {}

  // 对应文件声明的类名查询表
  let FileClassesMap = {}
  // 新定义的类检查表
  let includeClassList = []
  // 类的对象调用查询表
  let ObjCreateProtoMap = {}
  // 静态对象存放表
  let StaticTable = {}
  // pp类对象存活计数表
  let ObjAliveCountMap = {}

  // 对应类所在的声明文件映射表
  let ClassDefinedFile = {}
  // 实例对象 调用访问器表
  let ObjVisitProtoMap = {}
  // pp对象id索引表
  let ObjMapWithIndex = {}
  // 用户对象列表[lua对象id] = usertag
  let BlandObjList = {}
  // 热点对象列表[index] = lua对象id
  let CheckRefObjList = {}
  // 调用堆栈(检查调用权限)
  let ObjVisitList = JSPP.ObjVisitList
  // 调试数据块 //ObjVisitListNums: ObjVisitList.length {对象创建计数器,当前文件路径,Debug模式,错误处理函数}

  let core = {
    objIDNext: 1,
    ClassTemplateMap: ClassTemplateMap,
    ClassComplatedMap: ClassComplatedMap,
    ClassTreeMap: ClassTreeMap,

    StaticTable: StaticTable,
    FileClassesMap: FileClassesMap,
    includeClassList: includeClassList,
    ObjCreateProtoMap: ObjCreateProtoMap,

    ClassDefinedFile: ClassDefinedFile,
    ObjVisitProtoMap: ObjVisitProtoMap,
    ObjAliveCountMap: ObjAliveCountMap,
    ObjVisitList: ObjVisitList
    //ObjMapWithIndex : ObjMapWithIndex,
    //BlandObjList : BlandObjList,
    //CheckRefObjList : CheckRefObjList,
  }

  core.class = function (classname, fathername, public, protected, private) {
    if (ClassTemplateMap[classname] !== undefined) {
      // 重定义类 :  classname
      if (JSPP.__debug__ && JSPP.ppisdebugmode()) {
        JSPP.pperror('define class again ! classname: ' + classname)
      }
      return
    }
    let templateMap = {}

    let _public = public
    let _protected = protected
    let _private = private

    if (typeof fathername === 'object' && private === undefined) {
      // 省略父类参数传入
      _private = protected
      _protected = public
      _public = fathername
      fathername = ''
    }

    if (typeof fathername === 'string' && fathername !== '') {
      templateMap.father = fathername
    } else {
      templateMap.father = '__PPCLASS__'
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

    templateMap.code = classBasic
    templateMap.file = JSPP.FilePath
    includeClassList.push(classname)
    ClassTemplateMap[classname] = templateMap

    return templateMap.code
  }

  core.distoryclass = function (classname, nocheck) {
    if (!ClassTemplateMap[classname] && !ClassComplatedMap[classname] && !ClassTreeMap[classname]) return

    if (!nocheck && core.hasclassobjAlive(classname)) {
      if (JSPP.__debug__ && JSPP.ppisdebugmode()) {
        // 类尚有未释放的对象在使用中。不可以卸载
        JSPP.pperror('can\'t distoryclass : ' + classname + '. it still has ' + ObjAliveCountMap[classname] + ' obj alived !')
      }
      return
    }

    if (ClassTreeMap[classname]) {
      let childrenList = ClassTreeMap[classname].CR
      for (let index in childrenList) {
        core.distoryclass(childrenList[index], true)
      }
    }

    let staticobj = StaticTable[classname]
    if (staticobj) {
      let staticReleasefunction = ClassComplatedMap[staticobj.__class].S['_static']
      if (typeof staticReleasefunction === 'function') {
        ObjVisitList.push({ objid: staticobj.__self.refid, class: staticobj.__class, visitfunction: '_static' })
        staticReleasefunction.call(staticobj)
        ObjVisitList.pop()
      }
      staticobj.__self.released = true
      delete StaticTable[classname]
    }

    delete ObjAliveCountMap[classname]
    delete ObjVisitProtoMap[classname]

    delete ClassTemplateMap[classname]
    delete ClassComplatedMap[classname]
    delete ClassTreeMap[classname]

  }

  core.hasclassobjAlive = function (classname) {
    if (ObjAliveCountMap[classname] && ObjAliveCountMap[classname] > 0) {
      return true
    }
    if (ClassTreeMap[classname]) {
      let childrenList = ClassTreeMap[classname].CR
      for (let index in childrenList) {
        if (core.hasclassobjAlive(childrenList[index])) {
          return true
        }
      }
    }
  }

  core.checkLimite = function (useclass, usefunc) {
    switch (ClassComplatedMap[useclass][usefunc][1]) {
      case  ClassLimitType.protected:
        if (ObjVisitList.length <= 1) {
          if (JSPP.__debug__ && JSPP.ppisdebugmode()) {
            JSPP.pperror('Limite Error! class : ' + useclass + ' key : ' + usefunc + ' is Protected!')
          }
          return false
        }
        let lastvisitclass = ObjVisitList[ObjVisitList.length - 1].class
        if (lastvisitclass !== useclass && ClassTreeMap[useclass].CR.indexOf(lastvisitclass) === -1 && ClassTreeMap[lastvisitclass].CR.indexOf(useclass) === -1) {
          if (JSPP.__debug__ && JSPP.ppisdebugmode()) {
            JSPP.pperror('Limite Error! class : ' + useclass + ' key : ' + usefunc + ' is Protected!')
          }
          return false
        }
        break
      case  ClassLimitType.private:
        if (ObjVisitList[ObjVisitList.length - 1].class !== useclass) {
          if (JSPP.__debug__ && JSPP.ppisdebugmode()) {
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

  core.memberGet = function (obj, usingClass, virtualClass, useKey) {
    if (obj.__self.released) {
      if (JSPP.__debug__ && JSPP.ppisdebugmode()) {
        JSPP.pperror('object released ! key[' + useKey + '] can do nothing !')
      }
      return
    }

    if (!core.checkLimite(usingClass, useKey)) return
    let keyinfo = ClassTreeMap[usingClass].VT[virtualClass][useKey]
    if (!keyinfo) return
    let keyclass = keyinfo[0]
    switch (keyinfo[1]) {
      case CallMemberType.Normal: {
        return this.__self.objs[keyclass][useKey]
      }
      case CallMemberType.static: {
        return StaticTable[keyclass].__self.obj[useKey]
      }
      case CallMemberType.Normalfunction: {
        let realfunction = ClassComplatedMap[keyclass].C[useKey]
        if (realfunction === undefined) return
        let castobj = obj
        let environment = { objid: obj.__self.refid, class: usingClass, visitfunction: useKey }
        return function () {
          ObjVisitList.push(environment)
          let ret = realfunction.apply(castobj, arguments)
          ObjVisitList.pop()
          return ret
        }
      }
      case CallMemberType.staticfunction: {
        let realfunction = ClassComplatedMap[keyclass].S[useKey]
        if (realfunction === undefined) return
        let castobj = obj
        let environment = { objid: obj.__self.refid, class: usingClass, visitfunction: useKey }
        return function () {
          ObjVisitList.push(environment)
          let ret = realfunction.apply(castobj, arguments)
          ObjVisitList.pop()
          return ret
        }
      }
    }
  }

  core.memberSet = function (obj, usingClass, virtualClass, useKey, value) {
    if (obj.__self.released) {
      if (JSPP.__debug__ && JSPP.ppisdebugmode()) {
        JSPP.pperror('object released ! key[' + useKey + '] can do nothing !')
      }
      return
    }
    if (!core.checkLimite(usingClass, useKey)) return
    let keyinfo = ClassTreeMap[usingClass].VT[virtualClass][useKey]
    if (!keyinfo) return
    let keyclass = keyinfo[0]
    switch (keyinfo[1]) {
      case CallMemberType.Normal: {
        this.__self.objs[keyclass][useKey] = value
        break
      }
      case CallMemberType.static: {
        StaticTable[keyclass].__self.obj[useKey] = value
        break
      }
    }
  }

  core.include = function (list) {
    for (let index = 0; index < list.length; index++) {
      let path = list[index]
      let environmentPath = ''
      if (JSPP.FilePath) {
        environmentPath = JSPP.FilePath.substr(0, JSPP.FilePath.lastIndexOf('/'))
      }
      let pathpice = path.split('/')
      for (let i = 0; i < pathpice.length; i++) {
        if (pathpice[i] === '..') {
          environmentPath = environmentPath.substr(0, environmentPath.lastIndexOf('/'))
        } else if (pathpice[i] === '.' || pathpice[i] === '') {
          continue
        } else if (pathpice[i] === ':') {
          environmentPath = JSPP.RootPath
        } else if (environmentPath) {
          environmentPath = environmentPath + '/' + pathpice[i]
        } else {
          environmentPath = pathpice[i]
        }
      }
      if (environmentPath && !FileClassesMap[environmentPath]) {
        let tmpPath = JSPP.FilePath
        JSPP.FilePath = environmentPath
        FileClassesMap[environmentPath] = []
        JSPP.loadfile(environmentPath, function () {
          FileClassesMap[environmentPath] = includeClassList

          if (JSPP.__compile__) {
            for (let index in includeClassList) {
              let classname = includeClassList[index]
              JSPP.__compile__.compileTemplateclass(classname)
            }

            JSPP.__compile__.compileAllclassWithTree()
          }

          for (let index in includeClassList) {
            let classname = includeClassList[index]

            ObjCreateProtoMap[classname] = {}
            ObjCreateProtoMap[classname].S = core.makestatictable(classname)
            ObjCreateProtoMap[classname].V = core.makevirtualtable(classname)
          }

          includeClassList = []
          JSPP.FilePath = tmpPath
        })
      }
    }
  }

  core.exclude = function (list) {
    for (let index = 0; index < list.length; index++) {
      let path = list[index]
      if (FileClassesMap[path]) {
        for (let index in FileClassesMap[path]) {
          core.distoryclass(FileClassesMap[path][index])
        }
        delete FileClassesMap[path]
      }
    }
  }

  //构建静态对象使用表
  core.makestatictable = function (classname) {
    // 构建静态空间
    let staticTemplate = {}

    let nowclassTreeMap = ClassTreeMap[classname].VT[classname]
    for (let key in nowclassTreeMap) {
      let useKey = key
      let value = nowclassTreeMap[useKey]
      if (value[0] === classname) {
        if (value[1] === CallMemberType.staticfunction) {
          Object.defineProperty(staticTemplate, useKey, {
            enumerable: true,
            configurable: false,
            get: function () {
              return core.memberGet(this, this.__class, this.__class, useKey)
            },
            set: function (value) {
              JSPP.pperror('class static function can\'t overwrite at runtime !')
            }
          })
        } else if (value[1] === CallMemberType.static) {
          Object.defineProperty(staticTemplate, useKey, {
            enumerable: true,
            configurable: false,
            get: function () {
              return core.memberGet(this, this.__class, this.__class, useKey)
            },
            set: function (value) {
              core.memberSet(this, this.__class, this.__class, useKey, value)
            }
          })
        }
      }
    }
    return staticTemplate
  }
  //构建静态对象
  core.createStaticObj = function (classname) {

    // 构建静态空间
    let staticobj = Object.create(ObjCreateProtoMap[classname].S)

    Object.defineProperty(staticobj, '__class', {
      enumerable: false,
      configurable: false,
      get: function () {
        return this.__self.realclass
      },
      set: function () {
        JSPP.pperror('JSPP key __class can\'t be Use !')
      }
    })

    Object.defineProperty(staticobj, '__self', {
      enumerable: false,
      configurable: false,
      value: { realclass: classname, obj: {}, refid: 0, released: false }
    })

    let nowclassTreeMap = ClassTreeMap[classname].VT[classname]
    for (let useKey in nowclassTreeMap) {
      let value = nowclassTreeMap[useKey]
      if (value[0] === classname && value[1] === CallMemberType.static) {
        staticobj.__self.obj[useKey] = JSPP.deepcopyvalue(ClassComplatedMap[classname].S[useKey])
      }
    }

    let value = ClassTreeMap[classname].VT[classname]['static']
    if (value[0] === classname && value[1] === CallMemberType.staticfunction) {
      staticobj.static()
    }

    Object.freeze(staticobj)

    StaticTable[classname] = staticobj
  }

  //构建动态对象使用表
  core.makevirtualtable = function (classname) {

    // 构建静态空间
    let virtualTemplate = {}
    let nowclassTreeMap = ClassTreeMap[classname].VT[classname]
    for (let key in nowclassTreeMap) {
      let useKey = key
      let value = nowclassTreeMap[useKey]

      if (value[1] === CallMemberType.Normalfunction) {
        Object.defineProperty(virtualTemplate, useKey, {
          enumerable: true,
          configurable: false,
          get: function () {
            let lastStage = ObjVisitList[ObjVisitList.length - 1]
            if (lastStage.objid === this.__self.refid) {
              return core.memberGet(this, this.__class, lastStage.class, useKey)
            } else {
              return core.memberGet(this, this.__class, this.__class, useKey)
            }
          },
          set: function (value) {
            JSPP.pperror('class function can\'t overwrite at runtime !')
          }
        })
      } else if (value[1] === CallMemberType.Normal) {
        Object.defineProperty(virtualTemplate, useKey, {
          enumerable: true,
          configurable: false,
          get: function () {
            let lastStage = ObjVisitList[ObjVisitList.length - 1]
            if (lastStage.objid === this.__self.refid) {
              return core.memberGet(this, this.__class, lastStage.class, useKey)
            } else {
              return core.memberGet(this, this.__class, this.__class, useKey)
            }
          },
          set: function (value) {
            let lastStage = ObjVisitList[ObjVisitList.length - 1]
            if (lastStage.objid === this.__self.refid) {
              core.memberSet(this, this.__class, lastStage.class, useKey, value)
            } else {
              core.memberSet(this, this.__class, this.__class, useKey, value)
            }
          }
        })
      }
    }
    return virtualTemplate
  }

  //构建动态对象
  core.ppnew = function (classname) {
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

    let newObj = Object.create(ObjVisitProtoMap[classname])
    Object.defineProperty(newObj, '__self', {
      enumerable: false,
      configurable: false,
      value: {
        refid: core.objIDNext++,
        released: false,
        refCount: 1,
        autorefCount: 0,
        realClass: classname,
        objs: {},
        casters: {}
      }
    })

    Object.defineProperty(newObj, '__class', {
      enumerable: false,
      configurable: false,
      get: function () {
        return this.__self.realClass
      },
      set: function () {
        JSPP.pperror('JSPP key __class can\'t be redefine !')
      }
    })

    if (JSPP.__debug__) {
      JSPP.__debug__.ObjCreateCount++
    }

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
      newObj.__self.objs[key] = objData

      let caster = Object.create(ObjVisitProtoMap[classname])
      let pointerClass = key
      Object.defineProperty(caster, '__self', {
        enumerable: false,
        configurable: false,
        value: newObj.__self
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

      newObj.__self.casters[key] = caster
    }

    newObj.__self.casters[classname] = newObj

    ObjVisitList.push({ objid: newObj.__self.refid, class: newObj.__class, visitfunction: 'ppnew' })

    let releaselist = ClassTreeMap[this.__class].D
    for (let index in releaselist) {
      let classname = releaselist[index][0]
      let realfunction = core.memberGet(this, classname, classname, '_' + classname)
      if (typeof realfunction === 'function') {
        ObjVisitList.push({ objid: this.__self.refid, class: classname, visitfunction: 'pprelease' })
        realfunction.call(this)
        ObjVisitList.pop()
      }
    }

    ObjVisitList.pop()

    // 调用构造函数
    let args = []
    for (let i = 1; i < arguments.length; i++) {
      args.push(arguments[i])
    }
    let initlist = ClassLifeMap[classname].init
    for (let index in initlist) {
      newObj[initlist[index]].apply(newObj, args)
    }

    ObjAliveCountMap[classname] = ObjAliveCountMap[classname] + 1

    return newObj
  }

  // JS plus plus
  window.JSPP.__core__ = core

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
    return Boolean(obj.__self && obj.__class)
  }

})()