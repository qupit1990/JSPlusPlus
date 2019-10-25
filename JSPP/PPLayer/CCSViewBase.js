(function () {
  if (!window.JSPP) return

  JSPP.ppinclude(
    ':/PPComponent/EvtTools/EventListener.js'
  )

  let public = {
    CCSViewBase: function (ccpath, configs) {
      let node
      if (ccpath.indexOf('.csb') > 0) {
        node = ccs.CSLoader.loadCSB(ccpath)
      } else {
        node = ccs.load(ccpath, path).node
      }

      if (node) {
        let obj = node

        let exitfunc = node.onExit
        node.onExit = JSPP.ppfunction(function () {
          this.pprelease()
          if (exitfunc) exitfunc.apply(obj, arguments)
        }, this)

        let enterfunc = node.onEnter
        node.onEnter = JSPP.ppfunction(function () {
          if (enterfunc) enterfunc.apply(obj, arguments)
          this.onEnter()
        }, this)

        let sizeChangeEvent = cc.EventListenerCustom.create('resize', JSPP.ppfunction(this.onSizeChange, this))
        cc.eventManager.addListener(sizeChangeEvent, node)

        this.rootnode = node
      }

      if (!node) {
        JSPP.pperror('path :[' + ccpath + '] => no ccs for load !!!', new Error(''))
        return
      }

      this.CountListener++
      this.listener = JSPP.ppnew('EventListener', 'CCSViewListener_' + this.CountListener)

      if (configs) {
        this.uiConfigs = JSON.parse(JSON.stringify(configs))
      }

      this.onSizeChange()
    },

    virtual: {
      _CCSViewBase: function () {
        this.listener.pprelease()
        this.childrenCache = {}
      }
    },

    addToParent: function (parent) {
      if (JSPP.ppisObject(parent)) {
        let parentccs = JSPP.ppcast(parent, 'CCSViewBase')
        if (parentccs) {
          parentccs.rootnode.addChild(this.rootnode)
          return
        }
      }
      parent.addChild(this.rootnode)
    },

    close: function () {
      if (this.rootnode) {
        this.rootnode.removeFromParent()
        this.rootnode = null
      }
    }
  }

  let protected = {
    // 通用对象监听
    listener: null,
    // 根节点
    rootnode: null,
    virtual: {
      // 子类重载针对节点绑定逻辑的接口
      bindFunctionToNode: function (node, funckey, userdata) { },
      // 处理屏幕适配
      onSizeChange: function () {
        //this.doLayoutSimple(this.rootnode)
      },
      onEnter: function () {}
    },

    getNodeByPath: function (basicnode, path, getAllways) {
      if (!getAllways && this.childrenCache[basicnode] && this.childrenCache[basicnode][path]) {
        return this.childrenCache[basicnode][path]
      }

      let fathernode = basicnode
      let name = path
      if (path.lastIndexOf('/') >= 0) {
        let fatherpath = path.substr(0, path.lastIndexOf('/'))
        let getnode = this.getNodeByPath(fathernode, fatherpath, getAllways)

        if (getnode) {
          fathernode = getnode
        } else {
          JSPP.pperror('fathernode path[' + fatherpath + '] => not found , use basicnode instead')
        }

        name = path.substr(path.lastIndexOf('/') + 1)
      }

      let node
      if (name === '..') {
        node = fathernode.getParent()
      }
      if (name === '.') {
        node = fathernode
      } else {
        node = fathernode.getChildByName(name)
      }

      if (node) {
        this.childrenCache[basicnode] = this.childrenCache[basicnode] | {}
        this.childrenCache[basicnode][path] = node
      }

      return node

    },

    doLayout: function (node) {
      if (window.gm) {
        //2.0引擎
        gm.doLayout.autoLayout(node)
      }else{
        this.doLayoutSimple(node)
      }
    },

    doLayoutSimple: function (wgt, isMax, isPar) {
      if (!wgt) {
        JSPP.pperror('doLayoutSimple node is missing')
        return
      }
      let screen = cc.view.getFrameSize()
      let cutsize = { width: 0, height: 0 }
      let scPar = 1
      if (isPar) {
        let min = {}
        let psize = { width: wgt.parent.width, height: wgt.parent.height } // wgt.parent.getSize();
        scPar = wgt.parent.scaleX

        cutsize.width = Math.max(0, (psize.width * scPar - screen.width) / 2)
        cutsize.height = Math.max(0, (psize.height * scPar - screen.height) / 2)

        min.width = Math.min(screen.width, psize.width * scPar)
        min.height = Math.min(screen.height, psize.height * scPar)
        screen = min
      }

      let pctw = wgt.width / 1280
      let pcth = wgt.height / 720

      let size = { width: wgt.width, height: wgt.height } // wgt.getSize();
      let sw = screen.width * pctw / size.width
      let sh = screen.height * pcth / size.height

      if (isMax == true) {
        let sc = Math.max(sw, sh)
        sw = sc
        sh = sc
      } else if (sw != 0 && sh != 0) {
        let sc = Math.min(sw, sh)
        sw = sc
        sh = sc
      } else {
        let sc = Math.max(sw, sh)
        sw = sc
        sh = sc
      }

      sw /= scPar
      sh /= scPar
      wgt.scaleX = sw
      wgt.scaleY = sh

      let posx = wgt.x / 1280
      let posy = wgt.y / 720

      wgt.setPosition(
        cutsize.width / scPar + screen.width * posx / scPar,
        cutsize.height / scPar + screen.height * posy / scPar
      )
    },

    getNodeBycfgKey: function (key, root) {
      let data = this.uiConfigs[key]

      if (!data || !data.path) return

      return this.getNodeByPath(root ? root : this.rootnode, data.path)
    },

    doBindingWithcfgKey: function (key, root, userinfo) {
      let data = this.uiConfigs[key]

      if (!data || !data.path) return

      let node = this.getNodeByPath(root ? root : this.rootnode, data.path)
      if (node && data.function) {
        this.bindFunctionToNode(node, data.function, userinfo)
      }

      return node
    }
  }

  let private = {
    static: {
      CountListener: 0
    },
    uiConfigs: null,
    childrenCache: {}
  }

  JSPP.ppclass('CCSViewBase', public, protected, private)

})()