/**
 * 头像更新事件收集管理装置
 *
 * 使用样例：
 * 传入 cc.Node  用于控制生命周期
 * let HeadNodeCollector = JSPP.ppnew('HeadNodeFactory', cc.node)
 *
 * 注册头像监听
 * HeadNodeCollector.listenHead(uid，headBg)
 *
 * 增加头像请求进队列
 * HeadNodeCollector.addActiveInfo(uid, headurl)
 *
 * 激活队列内全部头像的请求
 * HeadNodeCollector.activeManagerList()
 *
 */
(function () {
  if (!window.JSPP) return

  let public = {
    // 通过node创建
    HeadNodeFactory: function (nodeone) {

      if (nodeone instanceof cc.Node) {
        this.lifeNode = nodeone
        let exitfunc = this.lifeNode.onExit
        let exitobj = this.lifeNode
        this.lifeNode.onExit = JSPP.ppfunction(function () {
          this.pprelease()
          exitfunc.apply(exitobj, arguments)
        }, this)
      } else {
        JSPP.pperror('template node not Found')
        return
      }

      cc.eventManager.addListener(cc.EventListenerCustom.create('loadWxHead', JSPP.ppfunction(this.newHeadBeActive, this)), this.lifeNode)
    },
    // _HeadNodeFactory: function () {},

    // 注册头像监听
    listenHead: function (uid, headNode) {
      if (!headNode) return

      let bchange = false
      for (let index = 0; index < this.nodeList.length; index++) {
        let pair = this.nodeList[index]
        if (pair[1] === headNode) {
          bchange = true
          pair[0] = uid
        }
      }
      if (!bchange) {
        this.nodeList.push([uid, headNode])
      }
    },
    // 增加头像请求
    addActiveInfo: function (uid, url) {
      let bhave = false
      for (let index = 0; index < this.activeList.length; index++) {
        let pair = this.activeList[index]
        if (pair[0] === uid) {
          pair[1] = url
          bhave = true
        }
      }
      if (!bhave) {
        this.activeList.push([uid, url])
      }
    },
    // 请求当前列表
    activeManagerList: function () {
      for (let index = 0; index < this.activeList.length; index++) {
        let pair = this.activeList[index]
        window.guild.uiUtil.asynLoadWxHeadImmediatelyNoDelay(pair[0], pair[1], window.guild.picConfig.defaultMask)
      }
      this.activeList = []
    }
  }

  let protected = {
    lifeNode: null,
    nodeList: [],
    activeList: []
  }

  let private = {
    newHeadBeActive: function (event, targetNode) {
      let headinfo = event.getUserData()
      cc.log(' newHead Active uid === >>>>>>> ' + headinfo.uid)

      for (let index = 0; index < this.nodeList.length;) {
        let pair = this.nodeList[index]
        if (!pair[1] || !cc.sys.isObjectValid(pair[1])) {
          cc.log(' nodeBg is destory === uid === >>>>>>> ' + pair[0])
          this.nodeList.splice(index, 1)
          continue
        }
        if (pair[0] === headinfo.uid) {
          if (!headinfo.mask) {
            headinfo.mask = window.guild.picConfig.defaultMask
          }
          cc.log('WX head uid :[' + pair[0] + '] add success !')
          window.guild.uiUtil.checkLoadWxHead(pair[1], headinfo.img, headinfo.mask, headinfo.scale, true)
          this.nodeList.splice(index, 1)
        } else {
          index++
        }
      }
    }
  }

  JSPP.ppclass('HeadNodeFactory', public, protected, private)

})()